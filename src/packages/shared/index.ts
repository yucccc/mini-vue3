export function isFunction(v: unknown): v is Function {
  return typeof v === 'function'
}
export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}
export function isString(val: unknown): val is String { return typeof val === 'string' }
export const isArray = Array.isArray
