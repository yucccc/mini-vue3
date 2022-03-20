import { isObject } from '../shared'
import { track, trigger } from './effect'

// 创建一个响应式对象
export function reactive<T extends object>(target: T): T {
  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key, receiver) {
        track(target, key)
        const res = Reflect.get(target, key, receiver)
        // 如果是对象的是 需要递归代理为响应式
        if (isObject(res))
          return reactive(res)
        return res
      },
      set(target, key, value) {
        const res = Reflect.set(target, key, value)
        trigger(target, key)
        return res
      },
      // 拦截 in 操作符 见文档：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/has
      has(target, key) {
        track(target, key)
        return Reflect.has(target, key)
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
