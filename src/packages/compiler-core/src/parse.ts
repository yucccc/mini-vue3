// 定义枚举
const enum State {
  // 初始状态 <
  Initial = 1,
  // 标签开始状态
  TagOpen,
  // 标签名
  TagName,
  // 文本
  Text,
  TagEnd,
  TagEndName,
}
// 判断是否字母
function isAlpha(char: string) {
  return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z'
}

// 解析
export function tokenize(str: string) {
  // 初始状态
  let currentState = State.Initial
  // 用于缓存字符串
  const chars = []
  const tokens: { type: string; name?: string; content?: string }[] = []
  // 只要字符串没被消耗完，就一直循环
  while (str) {
    const char = str[0]
    switch (currentState) {
      case State.Initial:
        if (char === '<') { // <
          currentState = State.TagOpen
          str = str.slice(1)
        }
        else { // x
          // 切换到文本状态
          currentState = State.Text
          chars.push(char)
          str = str.slice(1)
        }

        break
      case State.TagOpen:
        if (char === '/') { // </
          currentState = State.TagEnd
          str = str.slice(1)
        }
        else { // <x
          currentState = State.TagName
          chars.push(char)
          str = str.slice(1)
        }
        break
      case State.TagName:
        if (char === '>') { // <x>
          currentState = State.Initial
          // 此次状态已经结束 需要将数据保存
          tokens.push({
            type: 'tag',
            name: chars.join(''),
          })
          chars.length = 0
          str = str.slice(1)
        }
        else { // <xx // 还是字符
          chars.push(char)
          str = str.slice(1)
        }
        break
      case State.Text:
        if (char === '<') { // x <
          currentState = State.TagOpen
          tokens.push({
            type: 'text',
            content: chars.join(''),
          })
          chars.length = 0
          str = str.slice(1)
        }
        else { // xx
          chars.push(char)
          str = str.slice(1)
        }
        break
      case State.TagEnd:

        if (char === '>') { // </>
          console.log('%c [ </> 情况未处理 ]-95-「parse」', 'font-size:13px; background:pink; color:#bf2c9f;')
        }
        else { // </x
          currentState = State.TagEndName
          chars.push(char)
          str = str.slice(1)
        }
        break
      case State.TagEndName:
        if (char === '>') { // </xx>
          // 结束
          currentState = State.Initial
          tokens.push({
            type: 'tagEnd',
            name: chars.join(''),
          })
          chars.length = 0
          str = str.slice(1)
        }
        else { // </xx
          currentState = State.TagEndName
          chars.push(char)
          str = str.slice(1)
        }
        break
    }
  }
  if (chars.length > 0) {
    tokens.push({
      type: 'text',
      content: chars.join(''),
    })
  }
  return tokens
}
