import { isArray, isObject } from '../shared'
import { TriggerOpTypes, track, trigger } from './effect'
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

function createReactive<T extends object>(target: T, isShallow = false): T {
  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key, receiver) {
        // const targetIsArray = isArray(target)
        track(target, key)
        const res = Reflect.get(target, key, receiver)
        // if (key === 'raw')
        //   return target
        if (isShallow)
          return res

        // 如果是对象的是 需要递归代理为响应式
        if (isObject(res))
          return reactive(res)

        return res
      },
      set(target, key, newValue, receiver) {
        const oldValue = (target as any)[key]
        // 如果要设置的值存在 那么就是设置 否则就是新增 用于判断是否需要重新执行循环等 只有add才会执行ITERATE_KEY的关联逻辑
        const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD

        let res = true
        // if (target === receiver.raw) {
        // NaN问题改为Object
        if (!Object.is(newValue, oldValue)) {
          res = Reflect.set(target, key, newValue, receiver)
          // 如果是数组的话 触发的key 是length
          trigger(target, isArray(target) ? 'length' : key, type)
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
        const result = Reflect.deleteProperty(target, key)
        // 真的有被删除成功再触发通知
        if (result)
          trigger(target, key, TriggerOpTypes.DELETE)
        return result
      },
      // 见文档 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys
      ownKeys(target) {
        // 因为ownKeys无法拿到key 那么我们自定义一个ITERATE_KEY 用于代表iterate
        track(target, ITERATE_KEY)
        return Reflect.ownKeys(target)
      },
    } as ProxyHandler<any>,
  )

  return proxy
}
// 创建一个响应式对象
export function reactive<T extends object>(target: T): T {
  return createReactive(target)
}
// 浅响应
export function shallowReactive(target: object): object {
  return createReactive(target, true)
}
