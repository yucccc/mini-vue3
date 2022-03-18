import { activeEffect } from './effect'

// 桶子最终的数据格式如下
const test_target = { o: 1 }
// 最外面一层是WeakMap
const test = new WeakMap([
  // WeakMap 由target和Map组成
  [
    test_target,

    new Map([
      ['o', new Set()],
    ]),
  ],
])
const bucket = new WeakMap()
// 创建一个响应式对象
export function reactive(target: object) {
  const proxy = new Proxy(
    target,
    {
      // 读取的时候 需要将副作用加入桶子里面
      get(target, key) {
        if (!activeEffect) return

        let depsMap = bucket.get(target)
        // 如果不存在depsMap
        if (!depsMap)
          bucket.set(target, (depsMap = new Map()))

        let deps = depsMap.get(key)
        if (!deps)
          depsMap.set(key, (deps = new Set()))
        deps.add(activeEffect)

        return target[key]
      },
      set(target, key, newValue) {
        target[key] = newValue
        const depsMap = bucket.get(target)
        if (!depsMap) return true
        const effects = depsMap.get(key)
        effects && effects.forEach(fn => fn())
        return true
      },
    },
  )

  return proxy
}
