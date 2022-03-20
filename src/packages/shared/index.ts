export function isFunction(v: unknown): v is Function {
  return typeof v === 'function'
}
