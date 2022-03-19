import './style.css'
import { effect } from './packages/reactivity/effect'
import { reactive } from './packages/reactivity/reactive'

const originalObj = { text: 'hello vue3', ok: true }

const obj = reactive(originalObj)

effect(() => {
  console.log('作用用被执行')

  // 执行的时候响应式对象会被收集 等再次更新的时候 副作用函数会被再次执行
  document.body.innerText = obj.ok ? obj.text : 'not'
})

setTimeout(() => {
  obj.ok = false
}, 1000)

setTimeout(() => {
  obj.ok = true
}, 2000)

setTimeout(() => {
  obj.ok = false
}, 3000)
