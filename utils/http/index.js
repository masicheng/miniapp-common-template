import { WAxios } from "./Axios";
import { deepMerge } from "./utils";
import { cloneDeep, isString, isNull, isEmpty } from "lodash";
import globConfig from "../../config/globConfig";
import { joinTimestamp, formatRequestDate } from "./helper";
import { checkStatus } from "./checkStatus";
import { AxiosRetry } from "./axiosRetry";
import axios from "axios-miniprogram";
import { RequestEnum, ResultEnum, MessageEnum } from "./enum";

const getToken = function () {
  return wx.getStorageSync("token");
};

const transform = {
  /**
   * @description: 处理响应数据。如果数据不是预期格式，可直接抛出错误
   */
  transformResponseHook: (res, options) => {
    const { isTransformResponse, isReturnNativeResponse } = options;
    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res;
    }
    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data;
    }
    // 错误的时候返回
    const { data } = res;
    if (!data) {
      // return '[HTTP] Request has no return value';
      throw new Error(MessageEnum.apiRequestFailed);
    }
    //  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { code, data: result, msg: message } = data;
    // 这里逻辑可以根据项目进行修改
    const hasSuccess = data && Reflect.has(data, "code") && code === ResultEnum.SUCCESS;
    if (hasSuccess) {
      let successMsg = message;

      if (isNull(successMsg) || isEmpty(successMsg)) {
        successMsg = MessageEnum.operationSuccess;
      }

      if (options.successMessageMode === "modal") {
        wx.showModal({
          title: MessageEnum.successTip,
          content: successMsg,
          showCancel: false,
        });
      } else if (options.successMessageMode === "message") {
        wx.showToast({
          title: successMsg,
          icon: "success",
        });
      }
      return result;
    }

    // 在此处根据自己项目的实际情况对不同的code执行不同的操作
    // 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
    let timeoutMsg = "";
    switch (code) {
      case ResultEnum.SUCCESS:
        return result;
      case ResultEnum.TIMEOUT:
        timeoutMsg = MessageEnum.timeoutMessage;
        const userStore = useUserStoreWithOut();
        userStore.setToken(undefined);
        userStore.logout(true);
        break;
      default:
        if (message) {
          timeoutMsg = message;
        }
    }

    // errorMessageMode='modal'的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
    // errorMessageMode='none' 一般是调用时明确表示不希望自动弹出错误提示
    if (options.errorMessageMode === "modal") {
      wx.showModal({
        title: MessageEnum.errorTip,
        content: timeoutMsg,
        showCancel: false,
      });
    } else if (options.errorMessageMode === "message") {
      wx.showToast({
        title: timeoutMsg,
        icon: "none",
      });
    }

    throw new Error(timeoutMsg || MessageEnum.apiRequestFailed);
  },

  // 请求之前处理config
  beforeRequestHook: (config, options) => {
    const { apiUrl, joinPrefix, joinParamsToUrl, formatDate, joinTime = true, isCache = false, urlPrefix } = options;

    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`;
    }
    if (apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`;
    }
    const params = config.params || {};
    const data = config.data || false;
    formatDate && data && !isString(data) && formatRequestDate(data);

    if (config.method?.toUpperCase() === "GET") {
      if (!isCache) {
        if (!isString(params)) {
          // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
          config.params = Object.assign(params || {}, joinTimestamp(joinTime, false));
        } else {
          // 兼容restful风格
          config.url = config.url + params + `${joinTimestamp(joinTime, true)}`;
          config.params = undefined;
        }
      }
    } else {
      if (!isString(params)) {
        formatDate && formatRequestDate(params);
        if (
          Reflect.has(config, "data") &&
          config.data &&
          (Object.keys(config.data).length > 0 || config.data instanceof FormData)
        ) {
          config.data = data;
          config.params = params;
        } else {
          // 非GET请求如果没有提供data，则将params视为data
          config.data = params;
          config.params = undefined;
        }
        if (joinParamsToUrl) {
          config.url = setObjToUrlParams(config.url, Object.assign({}, config.params, config.data));
        }
      } else {
        // 兼容restful风格
        config.url = config.url + params;
        config.params = undefined;
      }
    }
    return config;
  },
  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: (config, options) => {
    // 请求之前处理config
    const token = getToken();

    if (token && config?.requestOptions?.withToken !== false) {
      // jwt token
      config.headers.Authorization = options.authenticationScheme ? `${options.authenticationScheme} ${token}` : token;
    }
    return config;
  },

  /**
   * @description: 响应拦截器处理
   */
  responseInterceptors: (res) => {
    return res;
  },
  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (axiosInstance, error) => {
    const { response, code, message, config } = error || {};
    const errorMessageMode = config?.requestOptions?.errorMessageMode || "none";
    const msg = response?.data?.error?.message ?? "";
    const err = error?.toString?.() ?? "";
    let errMessage = "";
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    try {
      if (code === "ECONNABORTED" && message.indexOf("timeout") !== -1) {
        errMessage = MessageEnum.timeoutMessage;
      }
      if (err?.includes("Network Error")) {
        errMessage = MessageEnum.networkExceptionMsg;
      }

      if (errMessage) {
        if (errorMessageMode === "modal") {
          wx.showModal({
            title: MessageEnum.errorTip,
            content: errMessage,
            showCancel: false,
          });
        } else if (errorMessageMode === "message") {
          wx.showToast({
            title: errMessage,
            icon: "none",
          });
        }
        return Promise.reject(error);
      }
    } catch (error) {
      throw new Error(error);
    }

    checkStatus(error?.response?.code, msg, errorMessageMode);

    // 添加自动重试机制 保险起见 只针对GET请求
    const retryRequest = new AxiosRetry();
    const { isOpenRetry } = config.requestOptions.retryRequest;
    config.method?.toUpperCase() === RequestEnum.GET &&
      isOpenRetry &&
      // @ts-ignore 
      retryRequest.retry(axiosInstance, error);
    return Promise.reject(error);
  },
};
function createAxios(opt) {
  return new WAxios(
    // 深度合并
    deepMerge(
      {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // authentication schemes，e.g: Bearer
        authenticationScheme: "Bearer",
        // authenticationScheme: '',
        timeout: 10 * 1000,
        // 基础接口地址
        baseURL: globConfig.baseUrl,
        // 如果是form-data格式
        headers: {
          post: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          get: { "Content-Type": "application/json" },
        },
        // 数据处理方式
        transform: cloneDeep(transform),
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将prefix 添加到url
          joinPrefix: true,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: "message",
          // 接口地址
          apiUrl: globConfig.apiUrl,
          // 接口拼接地址
          urlPrefix: globConfig.urlPrefix,
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          retryRequest: {
            isOpenRetry: true,
            count: 3,
            waitTime: 100,
          },
        },
      },
      opt || {}
    )
  );
}
// defHttp.default.baseURL = globConfig.baseUrl;
export const defHttp = createAxios();