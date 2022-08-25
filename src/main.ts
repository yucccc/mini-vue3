import './style.css'
import { effect } from './packages/reactivity/effect'
import { reactive } from './packages/reactivity/reactive'
import { complie, dump, parse, transform, traverseNode } from './packages/compiler-core/src/parse'
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
const ast = complie('<div><p>Vue</p><p>template</p></div>')
console.log(ast)

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

const ComponentA = {
  name: 'ComponentA',
  data() {
    return {
      foo: '<===>hello v3',
    }
  },
  props: {
    title: String,
  },
  setup(props, { attrs, emit }) {
    emit('change', '子组件触发传参')
    // return {
    //   a: 1,
    // }
    const a = 1
    return () => {
      return {
        type: 'p',
        children: `这是组件ComponentA${this.foo} | title === >${props.title} | setup 传递 ${a} | 模板编译后的数据${ast}`,
      }
    }
  },
  // render() {
  //   return {
  //     type: 'div',
  //     children: `这是组件ComponentA${this.foo} title === >${this.title} setup 传递 ${this.a}`,
  //   }
  // },
}
setTimeout(() => {
  renderComponent.props.title = '1s后修改'
}, 1000)

const handerChange = (v) => {
  console.log('%c [ 监听到子组件消息  ]-100-「main」', 'font-size:13px; background:pink; color:#bf2c9f;', v)
}

const renderComponent = {
  type: ComponentA,
  props: {
    title: '父组件传递过来的props title',
    // 监听子组件的消息
    onChange: handerChange,
  },
}

renderer.render(renderComponent, document.querySelector('#app'))

// setTimeout(() => {
//   renderer.render(newVnodeEsayDiff, document.querySelector('#app'))
// }, 1000)
