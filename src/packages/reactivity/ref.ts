import { reactive } from './reactive'
export function ref(v: any) {
  return reactive({ value: v })
}