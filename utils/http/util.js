import { cloneDeep, mergeWith, isObject, isString } from "lodash";

/**
 递归合并两个对象。
 Recursively merge two objects.
 @param target 目标对象，合并后结果存放于此。The target object to merge into.
 @param source 要合并的源对象。The source object to merge from.
 @returns 合并后的对象。The merged object.
 */
function deepMerge(target, source) {
  return mergeWith(cloneDeep(target), source, (objValue, srcValue) => {
    if (isObject(objValue) && isObject(srcValue)) {
      return mergeWith(cloneDeep(objValue), srcValue, (prevValue, nextValue) => {
        // 如果是数组，合并数组(去重) If it is an array, merge the array (remove duplicates)
        return isArray(prevValue) ? unionWith(prevValue, nextValue, isEqual) : undefined;
      });
    }
  });
}

const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
export function joinTimestamp(join, restful = false) {
  if (!join) {
    return restful ? "" : {};
  }
  const now = new Date().getTime();
  if (restful) {
    return `?_t=${now}`;
  }
  return { _t: now };
}
/**
 * @description: Format request parameter time
 */
export function formatRequestDate(params) {
  if (Object.prototype.toString.call(params) !== "[object Object]") {
    return;
  }
  for (const key in params) {
    const format = params[key]?.format ?? null;
    if (format && typeof format === "function") {
      params[key] = params[key].format(DATE_TIME_FORMAT);
    }
    if (isString(key)) {
      const value = params[key];
      if (value) {
        try {
          params[key] = isString(value) ? value.trim() : value;
        } catch (error) {
          throw new Error(error);
        }
      }
    }
    if (isObject(params[key])) {
      formatRequestDate(params[key]);
    }
  }
}

module.exports = {
  deepMerge,
  formatRequestDate,
  joinTimestamp,
};
