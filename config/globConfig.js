const {
  miniProgram: { envVersion },
} = wx.getAccountInfoSync();
const url = (function () {
  switch (envVersion) {
    case "develop":
      return "";
    case "trial":
      return "";
    case "release":
      return "";
  }
})();
const globConfig = {
  baseUrl: url,
  apiUrl: "",
  urlPrefix: "",
  uploadUrl: "",
  downloadUrl: "",
};

module.exports = globConfig;
