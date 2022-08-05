import { getSequence, isArray, isPlainObject, isString } from '../shared/index'
import { reactive } from '../reactivity/reactive'
import { effect } from '../reactivity/effect'
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
  createElement: (tag: string): Element => document.createElement(tag),
  setElementText(el: Element, text: string) {
    el.textContent = text
  },
  /**
   * 插入节点
   * @param el 要插入的节点
   * @param parent 父节点
   * @param referenceNode 如果传递了该参数 则插入位置为el前面 否则为父节点下的子节点末尾
   */
  insert(el: HTMLElement, parent: Document, referenceNode = null) {
    parent.insertBefore(el, referenceNode)
  },
  // 创建文本节点
  createText(text: string) {
    return document.createTextNode(text)
  },
  // 设置文本节点
  setText(el: Element, text: string) {
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
      if (nextValue == null) {
        el.removeAttribute('class')
      }
      else {
        // 可以选的是 setAttribute classList className
        // className 性能最好
        el.className = nextValue
      }
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

  // 任务队列缓存
  const queue = new Set()
  let isFlushing = false
  const p = Promise.resolve()
  const queueJob = (job) => {
    queue.add(job)
    if (!isFlushing) {
      isFlushing = true
      p.then(() => {
        try {
          queue.forEach(job => job())
        }
        finally {
          isFlushing = false
          queue.clear()
        }
      })
    }
  }
  /**
   * 全新的组件挂载
   * @param n2 节点
   * @param container 容器
   * @param anchor 锚点
   */
  const mountComponent = (n2, container: Element, anchor) => {
    const componentOptions = n2.type
    const { render, data } = componentOptions
    const state = reactive(data())

    effect(() => {
      // 把this指向了state
      const subTree = render.call(state)
      patch(null, subTree, container, anchor)
    }, {
      scheduler: queueJob,
    })
  }
  // 更新组件
  const patchComponent = () => {

  }
  /**
   * 打补丁 -> 更新
   * @param n1 旧节点
   * @param n2 新节点
   * @param container 挂载的容器
   */
  function patch(n1: VNode | null, n2: VNode, container: Element, referenceNode: (Element | null) = null) {
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
        mountElement(n2, container, referenceNode)
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
        insert(el, container, referenceNode)
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
      console.info('注释')
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
    // 渲染组件
    else if (isPlainObject(type)) {
      if (!n1) {
        mountComponent(n2, container, referenceNode)
      }
      else {
        patchComponent()
      }
    }

    else {
      // TODO: 未实现其他type类型逻辑
      console.info('其他类型')
    }
  }
  function mountElement(vnode: VNode, container: Element, referenceNode: Element | null = null) {
    /**
     * 为什么需要el和vnode建立联系 因为在后续的渲染中
     * 1、卸载过程中 需要根据vnode去获取真实的el 执行移除操作 而不是简单的innerHtml = ''
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

    insert(el, container, referenceNode)
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
        // const oldChildren = n1.children
        // const newChildren = n2.children
        /**
         * 这样做的缺点是 类型不同的是也被卸载掉
         */
        // const oldLen = oldChildren.length
        // const newLen = newChildren.length
        // const commonLen = Math.min(oldLen, newLen)
        // // 更新节点
        // for (let index = 0; index < commonLen; index++) {
        //   patch(oldChildren[index], newChildren[index], container)
        // }
        // // 新的大 那就是新增
        // if (newLen > oldLen) {
        //   for (let i = commonLen; i < newLen; i++) {
        //     patch(null, newChildren[i], container)
        //   }
        // }
        // // 旧的大 那就是删除
        // else if (oldLen > newLen) {
        //   for (let i = commonLen; i < oldLen; i++) {
        //     unmount(oldChildren[i])
        //   }
        // }
        /**
         * 简单diff算法
         */
        // let lastIndex = 0
        // for (let i = 0; i < newChildren.length; i++) {
        //   const newVNode = newChildren[i]
        //   let find = false
        //   for (let j = 0; j < oldChildren.length; j++) {
        //     const oldVNode = oldChildren[j]
        //     // 判断key一样 type
        //     if (oldVNode.key === newVNode.key) {
        //       find = true
        //       patch(oldVNode, newVNode, container)
        //       if (j < lastIndex) {
        //         insert(newVNode.el, container)
        //       }
        //       else {
        //         lastIndex = j
        //       }
        //       break
        //     }
        //   }
        //   // 子元素都找不到可复用的节点 那么认为当前是新增的节点
        //   if (!find) {
        //     patch(null, newVNode, container)
        //   }
        // }
        // // 处理旧节点被删除情况
        // for (let index = 0; index < oldChildren.length; index++) {
        //   const oldVNode = oldChildren[index]
        //   const has = newChildren.find(vnode => vnode.key === oldVNode.key)
        //   if (!has) {
        //     unmount(oldVNode)
        //   }
        // }
        patchKeyedChildren(n1, n2, container)
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
  function patchKeyedChildren(n1, n2, container) {
    const oldChildren = n1.children
    const newChildren = n2.children
    // 处理相同的开始
    let j = 0
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    // 1、向后循环 把前置相同的处理了
    // (a b) c
    // (a b) d e
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container)
      j++
      oldVNode = oldChildren[j]
      newVNode = newChildren[j]
    }

    // 2、把后面相同的处理了
    // 新旧的索引
    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1
    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container)
      // 递减 往前更新
      oldVNode = oldChildren[--oldEnd]
      newVNode = newChildren[--newEnd]
    }

    // 3、处理新增节点的情况
    // j > oldEnd 说明旧节点已经处理没了
    // j <= newEnd 说明新节点还有没处理完的
    if (j <= newEnd && j > oldEnd) {
      // 找到锚点位置 为什么要加1 也就是下一个节点 要插入的位置
      const anchorIndex = newEnd + 1
      // 如果anchorIndex小于数组长度  说明锚点在新的一组子节点中 否则就认为newEnd已经是尾部节点了
      const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor)
      }
    }
    // 4、多余的旧节点
    else if (j > newEnd && j <= oldEnd) {
      while (j <= oldEnd) {
        unmount(oldChildren[j++])
      }
    }
    // 5、非理想状态下
    else {
      // 1、计算新的一组子节点未处理的数量
      const count = newEnd - j + 1
      // 进行填充 - 1
      const source = new Array(count).fill(-1) // [-1, -1, -1, -1]
      const oldStart = j
      const newStart = j
      // // 用于填充新节点在旧节点上的索引位置 复杂度太高了
      // for (let index = j; index <= oldEnd; index++) {
      //   const oldVNode = oldChildren[index]
      //   for (let k = j; k <= newEnd; k++) {
      //     const newVNode = newChildren[k]
      //     // 找到可复用的元素
      //     if (oldVNode.key === newChildren.key) {
      //       // 还是需要更新的
      //       patch(oldVNode, newVNode, container)
      //       source[k - j] = index
      //     }
      //   }
      // }
      let moved = false
      let pos = 0
      // 代表更新过的节点数量
      let pathced = 0
      const keyIndex: Record<any, number> = {}
      for (let index = oldStart; index <= oldEnd; index++) {
        const oldVNode = oldChildren[index]
        keyIndex[oldVNode.key] = index
      }
      // 遍历旧节点剩余的未处理的节点
      for (let index = oldStart; index <= oldEnd; index++) {
        const oldVNode = oldChildren[index]
        // 如果更新的数量小于等于需要更新的数量 继续走逻辑 否则直接卸载掉 因为是多余的
        if (pathced <= count) {
          // 新节点在在旧节点的索引
          const k = keyIndex[oldVNode.key]
          if (typeof k !== 'undefined') {
            newVNode = newChildren[k]
            pathced++
            patch(oldVNode, newVNode, container)
            // 数组
            source[k - newStart] = index
            // 这里的逻辑和简单diff算法类似
            if (k < pos) {
              // 这里确定是要移动的
              moved = true
            }
            else {
              pos = k
            }
          }
          else {
            // 在新的一组子节点没找到对应的key 那么直接卸载
            unmount(oldVNode)
          }
        }
        else {
          unmount(oldVNode)
        }
      }
      // 如果moved是为真 则需要进行dom移动操作
      if (moved) {
        const seq = getSequence(source)
        // 指向最长递增子序列的最后一个元素
        let s = seq.length - 1
        // 指向新的一组子节点的最后一个元素
        for (let i = count - 1; i >= 0; i++) {
          if (source[i] === -1) {
            // 全新的节点
            const pos = i + j
            // 找到对应的vnode
            const newVNode = newChildren[pos]

            // 找到锚点
            const nextPos = pos + 1
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null

            // 因为我们最后是需要挂载的
            patch(null, newVNode, container, anchor)
          }
          else if (i !== seq[s]) {
            // 真正需要移动的节点
            const pos = i + j
            const newVNode = newChildren[pos]
            // 找到锚点
            const nextPos = pos + 1
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
            insert(newVNode.el, container, anchor)
          }
          else {
            // 不需要移动的节点 也是就是最长递增子序列的节点
            // 只需要让s指向下一个位置
            s--
          }
        }
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
