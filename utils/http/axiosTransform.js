export class AxiosTransform {
  /**
   * A function that is called before a request is sent. It can modify the request configuration as needed.
   * 在发送请求之前调用的函数。它可以根据需要修改请求配置。
   */
  beforeRequestHook;
  /**
   * @description: 处理响应数据
   */
  transformResponseHook;
  /**
   * @description: 请求失败处理
   */
  requestCatchHook;
  /**
   * @description: 请求之前的拦截器
   */
  requestInterceptors;
  /**
   * @description: 请求之后的拦截器
   */
  responseInterceptors;
  /**
   * @description: 请求之前的拦截器错误处理
   */
  requestInterceptorsCatch;
  /**
   * @description: 请求之后的拦截器错误处理
   */
  responseInterceptorsCatch;
}
