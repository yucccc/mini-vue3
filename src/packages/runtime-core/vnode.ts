
export type RendererNode = Record<string, any>

export type VNodeTypes =
    | string
    | VNode

export interface VNode {
  type: VNodeTypes
  props: Record<string, any> | null
  key: string | number | symbol | null
  // 引用的真实元素
  el: RendererNode | null
  children: VNode[] | string | null
}