import './style.css'
import { effect } from './packages/reactivity/effect'
const app = document.querySelector<HTMLDivElement>('#app')!

const template = ` <h1>Hello easy vue3 !</h1> `
effect(() => {
  console.log('effect');
})



app.innerHTML = template
