import { isArray, isObject } from '../shared'
import { TriggerOpTypes, enableTracking, pauseTracking, track, trigger } from './effect'
export const ITERATE_KEY = Symbol('')
// export const mutableHandlers: ProxyHandler<object> = {
//   get,
//   set,
//   deleteProperty,
//   has,
//   ownKeys,
// }

// const get = createGetter()

// function createGetter() {
// }

/**
 * 重写数组操作方法
 */
const arrayInstrumentation = createArrayInstrumentation()
function createArrayInstrumentation() {
  const instrumentations: Record<string, Function> = {}
  // as const 意思为 将类型推断为 readonly ['includes', 'indexOf', 'lastIndexOf'] 固定了的意思
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach((method) => {
    const originMethod = Array.prototype[method]
    instrumentations[method] = function(...args: unknown[]) {
      // this 是代理对象 先在代理对象中查找
      const res = originMethod.apply(this, args)
      // 没找到
      if (res === -1 || res === false)
        return originMethod.apply(this.raw, args)

      return res
    }
  })
  ;(['push', 'unshift', 'pop', 'shift', 'splice'] as const).forEach((method) => {
    const originMethod = Array.prototype[method]
    instrumentations[method] = function(this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = originMethod.apply(this, args)
      enableTracking()
      return res
    }
  })

  return instrumentations
}
function createReactiveObject<T extends object>(
  target: T,
  isShallow: boolean,
  isReadOnly: boolean,
  /**
   * 存储创建后的响应式对象 防止多次创建
   */
  proxyMap: WeakMap<any, any>): T {
  // 做点容错吧
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`)
    return target
  }
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target)

  if (existingProxy)
    return existingProxy

  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key, receiver) {
        // const targetIsArray = isArray(target)
        if (key === 'raw') return target
        // 非只读才建立联系
        if (!isReadOnly)
          track(target, key)

        if (isArray(target) && Object.prototype.hasOwnProperty.call(arrayInstrumentation, key))
          return Reflect.get(arrayInstrumentation, key, receiver)

        const res = Reflect.get(target, key, receiver)
        // if (key === 'raw')
        //   return target
        if (isShallow)
          return res

        // 如果是对象的是 需要递归代理为响应式
        if (isObject(res))
        // 处理深只读和深响应
          return isReadOnly ? readonly(res) : reactive(res)

        return res
      },
      set(target, key, newValue, receiver) {
        let res = true
        if (isReadOnly) {
          console.warn(`${String(key)} 是只读的`)
          return res
        }

        const oldValue = (target as any)[key]
        // 如果要设置的值存在 那么就是设置 否则就是新增 用于判断是否需要重新执行循环等 只有add才会执行ITERATE_KEY的关联逻辑
        const type = isArray(target)
          ? typeof key !== 'symbol' && Number(key) < target.length ? TriggerOpTypes.SET : TriggerOpTypes.ADD
          : Object.prototype.hasOwnProperty.call(target, key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD

        // if (target === receiver.raw) {
        // NaN问题改为Object
        if (!Object.is(newValue, oldValue)) {
          res = Reflect.set(target, key, newValue, receiver)
          // 如果是数组的话 触发的key 是length
          trigger(target, isArray(target) ? 'length' : key, type, newValue)
        }
        // }

        return res
      },
      // 拦截 in 操作符 见文档：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/has
      has(target, key) {
        const result = Reflect.has(target, key)
        track(target, key)
        return result
      },
      // 拦截delete 操作符 见文档： https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/deleteProperty
      deleteProperty(target, key) {
        if (isReadOnly) {
          console.warn(`${key} 是只读的`)
          return true
        }

        const result = Reflect.deleteProperty(target, key)
        // 真的有被删除成功再触发通知
        if (result)
          trigger(target, key, TriggerOpTypes.DELETE)
        return result
      },
      // 见文档 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys
      ownKeys(target) {
        // 因为ownKeys无法拿到key 那么我们自定义一个ITERATE_KEY 用于代表iterate
        track(target, isArray(target) ? 'length' : ITERATE_KEY)
        return Reflect.ownKeys(target)
      },
    } as ProxyHandler<any>,
  )
  proxyMap.set(target, proxy)
  return proxy
}
// 防止每次创建新的响应式对象
export const reactiveMap = new WeakMap<any, any>()
export const shallowReactiveMap = new WeakMap<any, any>()
export const readonlyMap = new WeakMap<any, any>()
export const shallowReadonlyMap = new WeakMap<any, any>()
// 创建一个响应式对象
export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, false, false, reactiveMap)
}
// 浅响应
export function shallowReactive(target: object): object {
  return createReactiveObject(target, true, false, shallowReactiveMap)
}

// 深只读
export function readonly(target: object): object {
  return createReactiveObject(target, false, true, readonlyMap)
}
// 浅只读
export function shallowReadonly(target: object): object {
  return createReactiveObject(target, true, true, shallowReadonlyMap)
}
