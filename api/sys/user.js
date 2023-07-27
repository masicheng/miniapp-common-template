import { defHttp } from "@utils/http/index";
const api = {
  login: "/br/zqr/user/safe/codeLogin",
};
export const loginNew = function (data) {
  let {
    brand,
    model,
    version,
    system,
    platform,
    SDKVersion,
    windowWidth: windowwidth,
    windowHeight: windowheight,
    screenWidth: screenwidth,
    screenHeight: screenheight,
    pixelRatio,
  } = wx.getSystemInfoSync();
  data["device"] = JSON.stringify({
    brand,
    model,
    version,
    system,
    platform,
    sdkversion: SDKVersion,
    pixelRatio,
    windowwidth,
    windowheight,
    screenwidth,
    screenheight,
  });
  return defHttp.post(
    { url: api.login, data },
    {
      isTransformResponse: false,
    }
  );
};
