import { effect, track, trigger } from './effect'
export function computed(getter) {
  // 标识是否脏数据 默认true需要重新计算
  let _dirty = true
  // 缓存的值
  let _value

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 当值发生变化的时候
      _dirty = true
      trigger(obj, 'value')
    },
  })
  const obj = {
    get value() {
      if (_dirty) {
        _value = effectFn()
        _dirty = false
      }
      track(obj, 'value')
      return _value
    },
  }
  return obj
}
