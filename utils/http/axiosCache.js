import { isString, isPlainObject } from "lodash";

export class AxiosCache {
  constructor() {
    this.keyCached = new Map();
    this.cache = new Map();
  }
  serializeQueryArgs(config) {
    const { url, params, data } = config;
    const queryArgs = params || data;
    let serialized = "";
    if (isString(queryArgs)) {
      serialized = queryArgs;
    } else {
      const stringified = JSON.stringify(queryArgs, (key, value) =>
        isPlainObject(value)
          ? Object.keys(value)
              .sort()
              .reduce((acc, key) => {
                acc[key] = value[key];
                return acc;
              }, {})
          : value
      );
      serialized = stringified;
    }
    return url + serialized;
  }

  getCache(config) {
    const key = this.serializeQueryArgs(config);
    const cache = this.cache.get(key);
    if (cache) {
      return cache;
    }
  }

  setCache(config, value) {
    const key = this.serializeQueryArgs(config);
    if (this.keyCached.get(key)) {
      return;
    }
    this.keyCached.set(key, key);
    this.cache.set(key, value);
  }
}
