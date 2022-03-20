import { effect } from '../effect'
import { reactive } from '../reactive'

describe('reactivity/effect', () => {
  it('一开始的时候应该运行传递的函数一次 should run the passed function once (wrapped by a effect)', () => {
    const fn = jest.fn(() => {})
    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('观察对象变化时应该重新运行 should observe basic properties', () => {
    const obj = reactive({ num: 1 })
    let current
    effect(() => {
      current = obj.num
    })
    expect(current).toEqual(1)
    obj.num = 10
    expect(current).toEqual(10)
  })

  it('应该观察多个属性 should observe multiple properties', () => {
    const obj = reactive({ num: 1, num2: 1 })
    let current
    effect(() => {
      current = obj.num + obj.num2 + obj.num
    })
    expect(current).toEqual(3)
    obj.num = obj.num2 = 10
    expect(current).toEqual(30)
  })

  it('多个依赖副作用都应该被执行 should handle multiple effects', () => {
    let dummy1, dummy2
    const counter = reactive({ num: 0 })
    effect(() => dummy1 = counter.num)
    effect(() => dummy2 = counter.num)
    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)
    counter.num++
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
  })
  // TODO 深度响应式
  it('should observe nested properties', () => {
    let dummy
    const counter = reactive({ nested: { num: 0 } })
    effect(() => (dummy = counter.nested.num))

    expect(dummy).toBe(0)
    counter.nested.num = 8
    expect(dummy).toBe(8)
  })

  it('should observe has operations', () => {
    let dummy
    const obj = reactive<{ prop: string | number }>({ prop: 'value' })
    effect(() => (dummy = 'prop' in obj))

    expect(dummy).toBe(true)
    // // @ts-expect-error
    delete obj.prop
    expect(dummy).toBe(false)
    obj.prop = 12
    expect(dummy).toBe(true)
  })
})
