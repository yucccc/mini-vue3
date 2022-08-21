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
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
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
interface Root {
  type: string
  tag?: string
  content?: string
  children: Root[]
}

export function parse(str: string): Root {
  // 将模版进行标记化
  const tokens = tokenize(str)
  // 创建root 根节点
  const root: Root = {
    type: 'Root',
    children: [],
  }
  // 起初只有root根节点
  const elementStack = [root]
  while (tokens.length) {
    const parent = elementStack[elementStack.length - 1]
    const t = tokens[0]
    switch (t.type) {
      case 'tag':{
        // 如果是tag 创建一个节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: [],
        }
        // 需要将他添加到父节点的children 中
        parent.children.push(elementNode)
        // 压栈
        elementStack.push(elementNode)
        break
      }
      case 'text' : {
        const textNode = {
          type: 'Text',
          content: t.content,
          // text是无子节点的了 这里只是为了ts暂时通过
          children: [],
        }
        parent.children.push(textNode)
        break
      }
      case 'tagEnd': {
        elementStack.pop()
        break
      }
    }
    tokens.shift()
  }
  return root
}