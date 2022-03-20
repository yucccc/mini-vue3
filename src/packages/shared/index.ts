export function isFunction(v: unknown): v is Function {
  return typeof v === 'function'
}
export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}
