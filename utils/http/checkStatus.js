// import { useUserStoreWithOut } from "/@/store/modules/user";
const errMsg = {
  errMsg401: "用户没有权限（令牌、用户名、密码错误）!",
  errMsg403: "用户得到授权，但是访问是被禁止的。!",
  errMsg404: "网络请求错误,未找到该资源!",
  errMsg405: "网络请求错误,请求方法未允许!",
  errMsg408: "网络请求超时!",
  errMsg500: "服务器错误,请联系管理员!",
  errMsg501: "网络未实现!",
  errMsg502: "网络错误!",
  errMsg503: "服务不可用，服务器暂时过载或维护!",
  errMsg504: "网络超时!",
  errMsg505: "http版本不支持该请求!",
};

export function checkStatus(status, msg, errorMessageMode = "message") {
  let errMessage = "";
  switch (status) {
    case 400:
      errMessage = `${msg}`;
      break;
    // 401: Not logged in
    // Jump to the login page if not logged in, and carry the path of the current page
    // Return to the current page after successful login. This step needs to be operated on the login page.
    case 401:
      // userStore.setToken(undefined);
      // errMessage = msg || errMsg.errMsg401;
      // if (stp === SessionTimeoutProcessingEnum.PAGE_COVERAGE) {
      //   userStore.setSessionTimeout(true);
      // } else {
      //   userStore.logout(true);
      // }
      break;
    default:
      errMessage = errMsg[`errMsg${status}`];
  }
  if (errMessage) {
    if (errorMessageMode === "modal") {
      wx.showModal({
        title: "错误提示",
        content: errMessage,
        showCancel: false,
      });
    } else if (errorMessageMode === "message") {
      wx.showToast({
        title: errMessage,
        icon: "none",
      });
    }
  }
}
