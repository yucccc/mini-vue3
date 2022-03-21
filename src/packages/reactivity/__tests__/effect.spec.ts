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
    expect(current).toBe(1)
    obj.num = 10
    expect(current).toBe(10)
  })

  it('应该观察多个属性 should observe multiple properties', () => {
    const obj = reactive({ num: 1, num2: 1 })
    let current
    effect(() => {
      current = obj.num + obj.num2 + obj.num
    })
    expect(current).toBe(3)
    obj.num = obj.num2 = 10
    expect(current).toBe(30)
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

  it('should observe properties on the prototype chain', () => {
    let dummy
    const counter = reactive({ num: 0 })
    const parentCounter = reactive({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    // @ts-expect-error
    delete counter.num
    expect(dummy).toBe(2)
    parentCounter.num = 4
    expect(dummy).toBe(4)
    counter.num = 3
    expect(dummy).toBe(3)
  })
  it('should observe has operations on the prototype chain', () => {
    let dummy
    const counter = reactive({ num: 0 })
    const parentCounter = reactive({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = 'num' in counter))

    expect(dummy).toBe(true)
    // @ts-expect-error
    delete counter.num
    expect(dummy).toBe(true)
    // @ts-expect-error
    delete parentCounter.num
    expect(dummy).toBe(false)
    counter.num = 3
    expect(dummy).toBe(true)
  })

  it('should observe inherited property accessors', () => {
    let dummy, parentDummy, hiddenValue: any
    const obj = reactive<{ prop?: number }>({})
    const parent = reactive({
      set prop(value) {
        hiddenValue = value
      },
      get prop() {
        return hiddenValue
      },
    })
    Object.setPrototypeOf(obj, parent)
    effect(() => (dummy = obj.prop))
    effect(() => (parentDummy = parent.prop))

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
    obj.prop = 4
    expect(dummy).toBe(4)
    // this doesn't work, should it?
    // expect(parentDummy).toBe(4)
    parent.prop = 2
    expect(dummy).toBe(2)
    expect(parentDummy).toBe(2)
  })
  it('should observe function call chains', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = getNum()))

    function getNum() {
      return counter.num
    }

    expect(dummy).toBe(0)
    counter.num = 2
    expect(dummy).toBe(2)
  })
  it('should observe iteration', () => {
    let dummy
    const list = reactive(['Hello'])
    effect(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list.push('World!')
    expect(dummy).toBe('Hello World!')
    list.shift()
    expect(dummy).toBe('World!')
  })

  it('should observe implicit array length changes', () => {
    let dummy
    const list = reactive(['Hello'])
    effect(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list[1] = 'World!'
    expect(dummy).toBe('Hello World!')
    list[3] = 'Hello!'
    expect(dummy).toBe('Hello World!  Hello!')
  })
})
