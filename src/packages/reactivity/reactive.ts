import { track, trigger } from './effect'

// 创建一个响应式对象
export function reactive(target: object) {
  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key) {
        track(target, key)
        return target[key]
      },
      set(target, key, newValue) {
        target[key] = newValue
        trigger(target, key)
        return true
      },
    },
  )

  return proxy
}
