
export type RendererNode = Record<string, any>

export const Text = Symbol('Text')
export const Comment = Symbol('Comment')
export const Fragment = Symbol('Fragment')
export type VNodeTypes =
    | string
    | VNode
    | typeof Comment
    | typeof Text
    | typeof Fragment

export interface VNode {
  type: VNodeTypes
  props: Record<string, any> | null
  key: string | number | symbol | null
  // 引用的真实元素
  el: RendererNode | null
  children: VNode[] | string | null
}