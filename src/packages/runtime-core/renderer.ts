import { isArray, isPlainObject, isString } from '../shared/index'

function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}
// 平台方法
export const nodeOptions = {
  createElement: tag => document.createElement(tag),
  setElementText(el, text) {
    el.textContent = text
  },
  insert(el, parent: Document, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  patchProp(el: Element, key: string, prevValue, nextValue) {
    // 处理事件
    if (/^on/.test(key)) {
      const name = key.slice(2).toLowerCase()
      // 元素伪造事件处理函数
      const invokers = el._vei || (el._vei = {})
      let invoker = invokers[key]
      // 移除事件可以直接移除 但是性能不好
      // prevValue && el.addEventListener(name, prevValue)
      // 采用的是伪造事件的方法 这样每次只需要更新invoker的value就行了
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e: Event) => {
            // 如果事件发生的时间要早于绑定的时间  那么不执行 阻止冒泡问题
            if (e.timeStamp < invoker.attached) return
            // 如果给同一个事件绑定了多个函数 那么依次执行
            if (isArray(invoker.value))
              invoker.value.forEach(fn => fn(e))
            else
              invoker.value(e)
          }
          // 事件被绑定的时间 这里严格上是需要做下兼容 不过目前主流浏览器都是支持返回高精度时间
          invoker.attached = performance.now()
          // 绑定到value上
          invoker.value = nextValue
          el.addEventListener(name, invoker)
        }
        else {
          // 更新
          invoker.value = nextValue
        }
      }
      else if (invoker) {
      // 移除事件
        el.removeEventListener(name, nextValue)
      }
    }
    else if (key === 'class') {
      // 可以选的是 setAttribute classList className
      // className 性能最好
      el.className = nextValue || ''
    }
    // 用in判断key是否存在对应的dom properties
    else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key]
      // 用于 :disabled = false 或者disabled= ""
      if (type === 'boolean' && nextValue === '')
        el[key] = true

      else
        el[key] = nextValue
    }
    else {
      el.setAttribute(key, nextValue)
    }
  },
}

/**
 * 创建一个渲染器
 * 渲染器的作用：把虚拟dom渲染为特定平台上的真实元素
 * 渲染的过程叫做：挂载
 *
 */
export function createRenderer(options) {
  const { createElement, setElementText, insert, patchProp } = options
  /**
   * 打补丁 -> 更新
   * @param n1 旧节点
   * @param n2 新节点
   * @param container 挂载的容器
   */
  function patch(n1, n2, container) {
    if (n1 === n2) return
    // 如果新旧的类型都不同了 那么就没必要打补丁了
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    const { type } = n2
    if (isString(type)) {
    // 没有旧节点的时候 认为要挂载
      if (!n1)
        mountElement(n2, container)
      else
      // TODO: 未实现patch逻辑
        console.log('打补丁')
    }
    else if (isPlainObject(type)) {
      // TODO: 未实现渲染子组件逻辑
      console.info('组件')
    }
    else {
      // TODO: 未实现其他type类型逻辑
      console.info('其他类型')
    }

    // 打补丁
  }

  function mountElement(vnode, container) {
    /**
     * 为什么需要el和vnode建立联系 因为在后续的渲染中
     * 1、卸载过程中 需要根据vnode去获取真实的el 执行移除操作 而不是现在简单的innnerHtml = ''
     */
    const el = vnode.el = createElement(vnode.type)

    if (isString(vnode.children)) {
      setElementText(el, vnode.children)
    }
    else if (isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el)
      })
    }
    // 设置props
    if (vnode.props) {
      for (const key in vnode.props)
        patchProp(el, key, null, vnode.props[key])
    }

    insert(el, container)
  }
  function unmount(vnode) {
    const parent = vnode.el.parentNode
    if (parent)
      parent.removeChild(vnode.el)
  }

  function render(vnode, container) {
    // 当有要渲染的
    if (vnode) {
      patch(container._vnode, vnode, container)
    }
    else {
      // 如果旧的存在 新的不存在 说明是卸载 直接置空
      if (container._vnode)
        unmount(container._vnode)
    }
    // 存储本次渲染的vnode
    container._vnode = vnode
  }
  return {
    render,
  }
}
