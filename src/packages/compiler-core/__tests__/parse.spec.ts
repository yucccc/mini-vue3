import { parse, tokenize } from '../src/parse'
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

it('my-base-parse3 ', () => {
  const tmp1 = '<div>/div>'
  expect(tokenize(tmp1)).toEqual([
    { name: 'div', type: 'tag' },
    { content: '/div>', type: 'text' },
  ],
  )
})

it('嵌套', () => {
  const tmp = '<div>1<div>2</div><div>3<div>4</div></div></div>'
  expect(tokenize(tmp)).toEqual([
    { name: 'div', type: 'tag' },
    { content: '1', type: 'text' },
    { name: 'div', type: 'tag' },
    { content: '2', type: 'text' },
    { name: 'div', type: 'tagEnd' },
    { name: 'div', type: 'tag' },
    { content: '3', type: 'text' },
    { name: 'div', type: 'tag' },
    { content: '4', type: 'text' },
    { name: 'div', type: 'tagEnd' },
    { name: 'div', type: 'tagEnd' },
    { name: 'div', type: 'tagEnd' },
  ],
  )
})

it('parse 纯文本 ', () => {
  const tmp1 = 'div'
  expect(parse(tmp1)).toEqual({ children: [{ content: 'div', type: 'Text' }], type: 'Root' })
})

it('parse正常标签 ', () => {
  const tmp = '<div><p>Vue</p><p>template</p></div>'
  expect(parse(tmp)).toEqual(
    {
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          children: [
            {
              type: 'Element',
              tag: 'p',
              children: [
                { content: 'Vue', type: 'Text' },
              ],
            },
            {
              type: 'Element',
              tag: 'p',
              children: [
                { content: 'template', type: 'Text' },
              ],
            },
          ],
        },
      ],
    },
  )
})
