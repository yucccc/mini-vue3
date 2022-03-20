
import { isFunction } from '../../shared/index'
describe('effect', () => {
  it('test', () => {
    expect(isFunction(() => {})).toBe(true)
  })
})
