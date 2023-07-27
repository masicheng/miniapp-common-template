import axios from "axios-miniprogram";
import { isFunction } from "lodash";
import { AxiosCanceler } from "./axiosCancel";
import { cloneDeep } from "lodash";
import { AxiosCache } from "./axiosCache";
import { RequestEnum, ContentTypeEnum } from "./enum";

const axiosCache = new AxiosCache();

export class WAxios {
  constructor(options) {
    this.options = options;
    this.axiosInstance = axios.create(options);
    this.setupInterceptors();
  }
  setupInterceptors() {
    const {
      axiosInstance,
      options: { transform },
    } = this;
    if (!transform) {
      return;
    }
    const {
      requestInterceptors,
      requestInterceptorsCatch,
      responseInterceptors,
      responseInterceptorsCatch,
    } = transform;

    const axiosCanceler = new AxiosCanceler();

    // Request interceptor configuration processing
    this.axiosInstance.interceptors.request.use((config) => {
      // If cancel repeat request is turned on, then cancel repeat request is prohibited
      const { requestOptions } = config; //this.options;
      const ignoreCancelToken = requestOptions?.ignoreCancelToken ?? true;
      !ignoreCancelToken && axiosCanceler.addPending(config);
      if (requestInterceptors && isFunction(requestInterceptors)) {
        config = requestInterceptors(config, this.options);
      }
      return config;
    }, undefined);

    // Request interceptor error capture
    requestInterceptorsCatch &&
      isFunction(requestInterceptorsCatch) &&
      this.axiosInstance.interceptors.request.use(undefined, requestInterceptorsCatch);

    // Response result interceptor processing
    this.axiosInstance.interceptors.response.use((res) => {
      res && axiosCanceler.removePending(res.config);
      if (responseInterceptors && isFunction(responseInterceptors)) {
        res = responseInterceptors(res);
      }
      return res;
    }, undefined);

    // Response result interceptor error capture
    responseInterceptorsCatch &&
      isFunction(responseInterceptorsCatch) &&
      this.axiosInstance.interceptors.response.use(undefined, (error) => {
        return responseInterceptorsCatch(axiosInstance, error);
      });
  }
  getTransform() {
    const { transform } = this.options;
    return transform;
  }

  get(config, options) {
    return this.request({ ...config, method: RequestEnum.GET }, options);
  }

  post(config, options) {
    return this.request({ ...config, method: RequestEnum.POST }, options);
  }

  put(config, options) {
    return this.request({ ...config, method: RequestEnum.PUT }, options);
  }

  delete(config, options) {
    return this.request({ ...config, method: RequestEnum.DELETE }, options);
  } // support form-data
  supportFormData(config) {
    const headers = config.headers || this.options.headers;
    const contentType = headers?.["Content-Type"] || headers?.["content-type"];

    if (
      contentType !== ContentTypeEnum.FORM_URLENCODED ||
      !Reflect.has(config, "data") ||
      config.method?.toUpperCase() === RequestEnum.GET
    ) {
      return config;
    }

    return {
      ...config,
      // data: qs.stringify(config.data, { arrayFormat: "brackets" }),
    };
  }

  request(config, options) {
    let conf = cloneDeep(config);
    // cancelToken 如果被深拷贝，会导致最外层无法使用cancel方法来取消请求
    if (config.cancelToken) {
      conf.cancelToken = config.cancelToken;
    }
    const transform = this.getTransform();

    const { requestOptions } = this.options;

    const opt = Object.assign({}, requestOptions, options);

    const { beforeRequestHook, requestCatchHook, transformResponseHook } = transform || {};
    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt);
    }

    conf.requestOptions = opt;

    // conf = this.supportFormData(conf);

    return new Promise((resolve, reject) => {
      // 获取缓存数据
      if (opt?.isCache) {
        const cache = axiosCache.getCache(config);
        if (cache) {
          return resolve(cache);
        }
      }
      this.axiosInstance
        .request(conf)
        .then((res) => {
          if (transformResponseHook && isFunction(transformResponseHook)) {
            try {
              const ret = transformResponseHook(res, opt);
              // 写入缓存
              if (opt?.isCache) {
                axiosCache.setCache(config, ret);
              }
              resolve(ret);
            } catch (err) {
              reject(err || new Error("request error!"));
            }
            return;
          }
          resolve(res);
        })
        .catch((e) => {
          if (requestCatchHook && isFunction(requestCatchHook)) {
            reject(requestCatchHook(e, opt));
            return;
          }
          if (axios.isAxiosError(e)) {
            // rewrite error message from axios in here
          } else if (axios.isCancel(e)) {
            return;
          }
          reject(e);
        });
    });
  }
}
