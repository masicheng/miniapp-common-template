const {
  miniProgram: { envVersion },
} = wx.getAccountInfoSync();
const url = (function () {
  switch (envVersion) {
    case "develop":
      return "http://172.16.0.172";
    case "trial":
      return "";
    case "release":
      return "";
  }
})();
const globConfig = {
  baseUrl: url,
  apiUrl: "/hd-api",
  urlPrefix: "",
  uploadUrl: "",
  downloadUrl: "",
};

module.exports = globConfig;
