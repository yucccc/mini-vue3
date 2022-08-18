import { currentInstance } from '../renderer'
export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    include: RegExp,
    exclude: RegExp,
    max: Number,
  },
  setup(props, { slots }) {
    // 创建一个缓存对象
    // key: vnode.type
    // value: vnode
    const cache = new Map()
    const instance = currentInstance
    // 实例上存在一些特殊的对象
    const { move, createElement } = instance.keepAliveCtx

    const storageContainer = createElement('div')

    instance._deActivate = (vnode) => {
      move(vnode, storageContainer)
    }

    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor)
    }

    return () => {
      const rawVNode = slots.default()
      // 如果不是组件 直接渲染即可 非组件的虚拟节点无法被keepAlive ?
      if (typeof rawVNode.type !== 'object') {
        return rawVNode
      }
      const name = rawVNode.type.name
      // 不被命中的情况下直接返回原始组件
      if (name && (props.include && !props.include.text(name) || props.exclude && props.exclude.text(name))) {
        return rawVNode
      }
      const cachedVNode = cache.get(rawVNode.type)
      if (cachedVNode) {
        // 如果有缓存 说明应该激活
        rawVNode.component = cachedVNode.component
        rawVNode.keptAlive = true
      }
      else {
        cache.set(rawVNode.type, rawVNode)
      }
      rawVNode.shouldKeepAlive = true
      rawVNode.keepAliveInstance = instance
      return rawVNode
    }
  },
}