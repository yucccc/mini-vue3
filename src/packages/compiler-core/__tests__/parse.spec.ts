import { tokenize } from '../src/parse'
it('my-base-parse ', () => {
  const tmp1 = 'div'
  expect(tokenize(tmp1)).toEqual([{ content: 'div', type: 'text' }])
})

it('my-base-parse2 ', () => {
  const tmp1 = '<div></div>'
  expect(tokenize(tmp1)).toEqual([
    { name: 'div', type: 'tag' },
    { name: 'div', type: 'tagEnd' },
  ],
  )
})

it('my-base-parse2 ', () => {
  const tmp1 = '<div>1312a</div>'
  expect(tokenize(tmp1)).toEqual([
    { name: 'div', type: 'tag' },
    { content: '1312a', type: 'text' },
    { name: 'div', type: 'tagEnd' },
  ],
  )
})

it('my-base-parse2 ', () => {
  const tmp1 = '<div>/div>'
  expect(tokenize(tmp1)).toEqual([
    { name: 'div', type: 'tag' },
    { content: '/div>', type: 'text' },
  ],
  )
})