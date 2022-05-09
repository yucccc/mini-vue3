import { isArray, isPlainObject, isString } from '../shared/index'
import type { VNode } from './vnode'
import { Comment, Fragment, Text } from './vnode'
function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') {
    return false
  }
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
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置文本节点
  setText(el, text) {
    el.nodeValue = text
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
            if (e.timeStamp < invoker.attached) { return }
            // 如果给同一个事件绑定了多个函数 那么依次执行
            if (isArray(invoker.value)) { invoker.value.forEach(fn => fn(e)) }
            else { invoker.value(e) }
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
      if (type === 'boolean' && nextValue === '') {
        el[key] = true
      }
      else {
        el[key] = nextValue
      }
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
 */
export function createRenderer(options = nodeOptions) {
  const {
    createElement, setElementText,
    insert, patchProp, createText, setText,
  } = options
  /**
   * 打补丁 -> 更新
   * @param n1 旧节点
   * @param n2 新节点
   * @param container 挂载的容器
   */
  function patch(n1: VNode | null, n2: VNode, container: Element) {
    // 两个都全等了 没必要打补丁
    if (n1 === n2) { return }
    // 如果新旧的类型都不同了 那么就没必要打补丁了
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    // 往下走的type都是相同的了
    const { type } = n2
    // 是标签节点
    if (isString(type)) {
      // 没有旧节点的时候 全新的挂载
      if (!n1) {
        mountElement(n2, container)
      }
      // 有旧节点 那么可以对应出9种情况
      else {
        patchElement(n1, n2)
      }
    }
    // 文本节点
    else if (type === Text) {
      // 如果没有旧节点 则进行挂载
      if (n1 == null) {
        const el = n2.el = createText(n2.children)
        insert(el, container)
      }
      else {
        // 如果旧vnode存在 只需要使用新文本节点的文本内容更新旧的文本内容即可
        const el = n2.el = n1.el
        if (n2.children !== n1.children) {
          setText(el, n2.children)
        }
      }
    }
    else if (type === Comment) {
    }
    // 片段 渲染子节点
    else if (type === Fragment) {
      // 没有旧节点的时候 全新的挂载
      if (n1 == null) {
        n2.children(child => patch(null, child, container))
      }
      else {
        patchChildren(n1.children, n2.children, container)
      }
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

  function mountElement(vnode: VNode, container: Element) {
    /**
     * 为什么需要el和vnode建立联系 因为在后续的渲染中
     * 1、卸载过程中 需要根据vnode去获取真实的el 执行移除操作 而不是简单的innnerHtml = ''
     */
    const el = vnode.el = createElement(vnode.type)
    // 文本子节点
    if (isString(vnode.children)) {
      setElementText(el, vnode.children)
    }
    // 如果是数组 那么循环调用patch流程
    else if (isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el)
      })
    }
    // 设置props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProp(el, key, null, vnode.props[key])
      }
    }

    insert(el, container)
  }
  /**
   * 更新元素
   * @param n1
   * @param n2
   */
  function patchElement(n1, n2) {
    // 将旧的dom引用到到新的虚拟dom上
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props
    for (const key in newProps) {
      if (Object.prototype.hasOwnProperty.call(newProps, key)) {
        // 如果新的值 不和旧的值一样 那么就更新props
        if (newProps[key] !== oldProps[key]) {
          patchProp(el, key, oldProps[key], newProps[key])
        }
      }
    }
    for (const key in oldProps) {
      if (Object.prototype.hasOwnProperty.call(oldProps, key)) {
        // 如果旧的值 没有在新的key中存在 那就置空
        if (!(key in newProps)) {
          patchProp(el, key, oldProps[key], null)
        }
      }
    }
    // 更新children
    patchChildren(n1, n2, el)
  }

  function patchChildren(n1, n2, container) {
    // 新节点是文本
    if (isString(n2.children)) {
      // 旧节点有三种可能 文本 空节点 一组子节点
      // 只有是一组子节点的时候 才需要处理 将旧的卸载
      if (isArray(n1.children)) {
        n1.children.forEach(unmount)
      }
      setElementText(container, n2.children)
    }
    else if (isArray(n2.children)) {
      // 当新旧节点都是一组数据时 就涉及到核心diff算法
      if (isArray(n1.children)) {
        // 旧的也是一组
        const oldChildren = n1.children
        const newChildren = n2.children
        const oldLen = oldChildren.length
        const newLen = newChildren.length

        const commonLen = Math.min(oldLen, newLen)
        // 更新节点
        for (let index = 0; index < commonLen; index++) {
          patch(oldChildren[index], newChildren[index], container)
        }
        // 新的大 那就是新增
        if (newLen > oldLen) {
          for (let i = commonLen; i < newLen; i++) {
            patch(null, newChildren[i], container)
          }
        }
        // 旧的大 那就是删除
        else if (oldLen > newLen) {
          for (let i = commonLen; i < oldLen; i++) {
            unmount(oldChildren[i])
          }
        }
      }
      else {
        // 不是数组 那就是文本了 置空
        setElementText(container, '')
        // 然后再挂载
        n2.children.forEach(c => patch(null, c, container))
      }
    }
    // 新的节点不存在
    else {
      if (isArray(n1.children)) {
        n1.children.forEach(unmount)
      }
      else if (isString(n1.children)) {
        setElementText(container, '')
      }
    }
  }

  function unmount(vnode: VNode) {
    // 如果是片段 卸载的时候需要卸载子层
    if (vnode.type === Fragment) {
      return vnode.children.forEach(unmount)
    }
    const parent = vnode.el!.parentNode
    if (parent) { parent.removeChild(vnode.el) }
  }
  /**
   * 将vnode渲染为真实dom
   * @param vnode 要渲染的vnode
   * @param container 挂载的容器
   */
  function render(vnode: VNode, container) {
    // 当有要渲染的
    if (vnode) {
      patch(container._vnode, vnode, container)
    }
    else {
      // 如果旧的存在 新的不存在 说明是卸载 直接置空
      if (container._vnode) {
        unmount(container._vnode)
      }
    }
    // 存储本次渲染的vnode
    container._vnode = vnode
  }
  return {
    render,
  }
}
