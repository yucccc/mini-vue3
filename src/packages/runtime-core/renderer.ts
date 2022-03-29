/**
 * 渲染器
 * 渲染器的作用：把虚拟dom渲染为特定平台上的真实元素
 * 渲染的过程叫做：挂载
 *
 *
 *
 */

// 创建一个渲染器
export function createRenderer() {
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
  return render
}

export function patch(n1, n2, container) {

}
