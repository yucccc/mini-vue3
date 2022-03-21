import { isArray, isObject } from '../shared'
import { track, trigger } from './effect'

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
// 创建一个响应式对象
export function reactive<T extends object>(target: T): T {
  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key, receiver) {
        // const targetIsArray = isArray(target)
        track(target, key)
        const res = Reflect.get(target, key, receiver)
        // 如果是对象的是 需要递归代理为响应式
        if (isObject(res))
          return reactive(res)
        return res
      },
      set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver)
        // 如果是数组的话 触发的key 是length
        trigger(target, isArray(target) ? 'length' : key)

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
          trigger(target, key)
        return result
      },
    },
  )

  return proxy
}
