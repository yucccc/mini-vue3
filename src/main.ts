import './style.css'
import { effect } from './packages/reactivity/effect'
import { reactive } from './packages/reactivity/reactive'
const app = document.querySelector<HTMLDivElement>('#app')!

const template = ' <h1>Hello easy vue3 !</h1> '
const originalObj = { text: 'hello vue3' }
const obj = reactive(originalObj)
effect(() => {
  document.body.innerText = obj.text
})
setTimeout(() => {
  obj.text = 'hello vue 🐂'
}, 1000)

app.innerHTML = template
