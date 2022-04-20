
export type RendererNode = Record<string, any>

export type VNodeTypes =
    | string
    | VNode

export interface VNode {
  __v_isVNode: true
  __v_skip: true
  type: VNodeTypes
  props: Record<string, any> | null
  key: string | number | symbol | null
  // DOM
  el: RendererNode | null
}