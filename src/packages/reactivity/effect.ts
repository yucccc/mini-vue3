
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
  // 目前存在的问题是永远只有一个副作用在执行
  activeEffect = fn
  fn()
}

// 思考：执行这个副作用有什么用呢？ 答案：其实后面很多逻辑都是依靠于副作用的重新执行
// 比如组件的重新渲染 当数据更新后 需要重新执行effect effect里面是更新组件的一些逻辑

// // 当我们某个数据变更的时候 想要执行某个副作用
// const obj = { text: 'hello vue3' }

// //  修改obj.text 当值变化的时候 重新执行下副作用effect 修改document.body.innerText
// obj.text = 'hello vite'
