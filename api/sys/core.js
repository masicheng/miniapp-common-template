import { defHttp } from "@utils/http/index";
const api = {
  getDictItemsByFldm: "/core/auth/zdflmx/getDictItemsByFldm",
};

export const getDictItemsByFldm = function (params) {
  return defHttp.get(
    {
      url: api.getDictItemsByFldm,
      params,
    },
    {
      isCache: true,
      withToken: false,
      ignoreCancelToken: false,
    }
  );
};
