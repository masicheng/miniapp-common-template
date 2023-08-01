// app.js
import "./utils/lodash-fix";
import updateManager from "./utils/updateManager";
App({
  onLaunch() {
    updateManager();
  },
  globalData: {
    userInfo: null,
  },
});
