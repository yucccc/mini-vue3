
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
type KeyToDepMap = Map<any, Set<any>>
const bucket = new WeakMap<any, KeyToDepMap>()

// 当前激活的副作用函数
export let activeEffect

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: Function
  // scope?: Function
  // allowRecurse?: boolean
  // onStop?: () => void
}

// 逻辑上其实我们只需要将数据变成响应式的 那么当

/**
 * 副作用实现
 * @param fn
 * @param options
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions): void {
  const effectFn = () => {
    // 执行前将该副作用的收集依赖清除
    // cleanupEffect(effectFn)

    // 目前存在的问题是永远只有一个副作用在执行
    activeEffect = effectFn
    fn()
  }
  // 执行时给effectFn
  effectFn.deps = []

  effectFn()
}

// 思考：执行这个副作用有什么用呢？ 答案：其实后面很多逻辑都是依靠于副作用的重新执行
// 比如组件的重新渲染 当数据更新后 需要重新执行effect effect里面是更新组件的一些逻辑

// // 当我们某个数据变更的时候 想要执行某个副作用
// const obj = { text: 'hello vue3' }

// //  修改obj.text 当值变化的时候 重新执行下副作用effect 修改document.body.innerText
// obj.text = 'hello vite'

export function track(target, key) {
  if (!activeEffect) return

  let depsMap = bucket.get(target)

  // 如果不存在depsMap
  if (!depsMap)
    bucket.set(target, (depsMap = new Map()))

  let deps = depsMap.get(key)

  if (!deps)
    depsMap.set(key, (deps = new Set()))

  deps.add(activeEffect)
  // deps
  // 将其添加到activeEffect.deps中 这段逻辑在 effectFn.deps = []
  // 读取的每个值都会被收集
  activeEffect.deps.push(deps)
}

export function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set(effects)
  effectsToRun.forEach(fn => fn())
}

export function cleanupEffect(effect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++)
      deps[i].delete(effect)
    deps.length = 0
  }
}
