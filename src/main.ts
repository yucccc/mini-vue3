import './style.css'
import { effect } from './packages/reactivity/effect'
import { reactive } from './packages/reactivity/reactive'
import { createRenderer, nodeOptions } from './packages/runtime-core/renderer'
// const originalObj = { text: 'hello vue3', ok: true }

const renderer = createRenderer(nodeOptions)
const vnode = {
  type: 'h1',
  // 使用props描述元素属性
  props: {
    id: 'foo',
    disabled: '',
  },
  children: [
    { type: 'span', children: 'hello vue3' },
    { type: 'input', props: { form: 'input form' } },
  ],
}

const vnode2 = {
  type: {},
  // 使用props描述元素属性
  props: { form: 'input form' },
}

const obj = reactive(vnode)
const obj2 = reactive(vnode2)

effect(() => {
  // 执行的时候响应式对象会被收集 等再次更新的时候 副作用函数会被再次执行
  // document.body.innerText = obj.ok ? obj.text : 'not'
  renderer.render(obj, document.querySelector('#app'))
  // renderer.render(obj2, document.querySelector('#app'))
})

// setTimeout(() => { vnode.children = 'hello patch vue3 => vue4' }, 1000)

setTimeout(() => {
  obj.type = 'input'
}, 1000)

// setTimeout(() => {
//   obj.ok = true
// }, 2000)

// setTimeout(() => {
//   obj.ok = false
// }, 3000)
