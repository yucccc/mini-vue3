export function isFunction(v: unknown): v is Function {
  return typeof v === 'function'
}
export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}
export function isObject2(val: unknown): val is Record<any, any> {
  return Object.prototype.toString.call(val) === '[object Object]'
}

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const toRawType = (value: unknown): string => {
  // extract "RawType" from strings like "[object RawType]"
  return toTypeString(value).slice(8, -1)
}

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]'

export function isString(val: unknown): val is String { return typeof val === 'string' }
export const isArray = Array.isArray
