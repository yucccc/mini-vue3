import { isString } from '../shared/index'
/**
 * 渲染器
 * 渲染器的作用：把虚拟dom渲染为特定平台上的真实元素
 * 渲染的过程叫做：挂载
 *
 *
 *
 */

// 创建一个渲染器
export function createRenderer(options) {
  const { createElement, setElementText, insert } = options
  /**
 *
 * @param n1 旧节点
 * @param n2 新节点
 * @param container 挂载的容器
 */
  function patch(n1, n2, container) {
  // 没有旧节点的时候 以为着要挂载
    if (!n1)
      mountElement(n2, container)

    else
      console.log('打补丁')

    // 打补丁
  }

  function mountElement(vnode, container) {
    const el = createElement(vnode.type)

    if (isString(vnode.children))
      setElementText(el, vnode.children)
    insert(el, container)
  }

  function render(vnode, container) {
    // 当有要渲染的
    if (vnode) {
      patch(container._vnode, vnode, container)
    }
    else {
      // 如果旧的存在 新的不存在 说明是卸载 直接置空
      if (container._vnode)
        container.innerHTML = ''
    }
    // 存储本次渲染的vnode
    container._vnode = vnode
  }
  return {
    render,
  }
}
export const nodeOptions = {
  createElement: tag => document.createElement(tag),
  setElementText(el, text) {
    el.textContent = text
  },
  insert(el, parent: Document, anchor = null) {
    parent.insertBefore(el, anchor)
  },
}
