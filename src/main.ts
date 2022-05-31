import './style.css'
import { effect } from './packages/reactivity/effect'
import { reactive } from './packages/reactivity/reactive'
import { createRenderer } from './packages/runtime-core/renderer'
// const originalObj = { text: 'hello vue3', ok: true }

const renderer = createRenderer()
// const vnode = {
//   type: 'h1',
//   // 使用props描述元素属性
//   props: {
//     id: 'foo',
//     disabled: '',
//     onClick: () => {
//       console.log('click')
//     },
//   },
//   children: [
//     { type: 'span', children: 'hello vue3' },
//     { type: 'input', props: { form: 'input form' } },
//   ],
// }
// const oldVnodeEsayDiff = {
//   type: 'div',
//   children: [
//     { type: 'p', children: '1', key: '4' },
//     { type: 'p', children: '2', key: '2' },
//     { type: 'p', children: '3', key: '1' },
//     { type: 'p', children: '3', key: '3' },
//   ],
// }
// const newVnodeEsayDiff = {
//   type: 'div',
//   children: [
//     { type: 'p', children: '4', key: '1' },
//     { type: 'p', children: '5', key: '2' }, // 1被删除
//     { type: 'p', children: '6', key: '3' },
//     { type: 'p', children: '6', key: '4' },
//   ],
// }
// 复杂情况
const oldVnodeEsayDiff = {
  type: 'div',
  children: [
    { type: 'p', children: '1', key: '1' },
    { type: 'p', children: '2', key: '2' },
    { type: 'p', children: '3', key: '3' },
    { type: 'p', children: '4', key: '4' },
    { type: 'p', children: '6', key: '6' },
    { type: 'p', children: '5', key: '5' },

  ],
}
const newVnodeEsayDiff = {
  type: 'div',
  children: [
    { type: 'p', children: '1', key: '1' },
    { type: 'p', children: '3', key: '3' },
    { type: 'p', children: '4', key: '4' },
    { type: 'p', children: '2', key: '2' },
    { type: 'p', children: '7', key: '7' },
    { type: 'p', children: '5', key: '5' },
  ],
}

renderer.render(oldVnodeEsayDiff, document.querySelector('#app'))

setTimeout(() => {
  renderer.render(newVnodeEsayDiff, document.querySelector('#app'))
}, 1000)
