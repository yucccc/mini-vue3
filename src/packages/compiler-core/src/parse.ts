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

// 文本模式
export const enum TextModes {
  //          | Elements | Entities | End sign              | Inside of
  DATA, //    | ✔        | ✔        | End tags of ancestors | 正常情况
  RCDATA, //  | ✘        | ✔        | End tag of the parent | <textarea> 无法解析标签 但是能解析字符实体
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script> 无法解析标签也无法解析字符实体
  CDATA,
  ATTRIBUTE_VALUE,
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
  children?: Root[]
}
interface ParseContext {
  source: string
  mode: TextModes
  // 消费指定数量的字符
  advanceBy: (num: number) => void
  // 空白字符
  advanceSpaces: () => void
}
export function parse(str: string): Root {
  const context: ParseContext = {
    source: str,
    mode: TextModes.DATA,
    advanceBy(num) {
      context.source = context.source.slice(num)
    },
    advanceSpaces() {
      const match = /^[\s]+/.exec(context.source)
      if (match) {
        context.advanceBy(match[0].length)
      }
    },
  }
  const nodes = parseChildren(context, [])
  // 创建root 根节点
  return {
    type: 'Root',
    children: nodes,
  }
}

function parseChildren(context: { source: string; mode: TextModes }, ancestors) {
  const nodes = []
  const { source, mode } = context
  while (!isEnd(context, ancestors)) {
    let node
    // 只有DATA模式 和 RCDATA模式 才支持插值节点解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有DATA模式才支持标签解析
      if (mode === TextModes.DATA && source[0] === '<') {
        if (source[1] === '!') {
          // 注释 <!-- xsxx
          if (source.startsWith('<!--')) {
            // node = parseComment(context)
            node = { type: 'Interpolation3' }
          }
          else if (source.startsWith('<![CDATA[')) {
            // node = parseCDATA(context)
            node = { type: 'Interpolation2' }
          }
        }
        else if (source[1] === '/') {
          // 结束标签
        }
        else if (/[a-z]/i.test(source[1])) {
          // 标签
          node = parseElement(context, ancestors)
        }
      }
      // 解析插值
      else if (source.startsWith('{{')) {
        // node = parseInterpolation(context)
        node = { type: 'Interpolation' }
      }
    }
    // node 不存在 说明处于其他模式 一切按文本处理
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
}
function isEnd(context: ParseContext, ancestors) {
  const { source } = context
  if (!source) { return true }
  // 与整个父级做比较
  for (let index = ancestors.length - 1; index >= 0; --index) {
    if (source.startsWith(`</${ancestors[index].tag}`)) {
      return true
    }
  }
  return false
}
// 解析文本
function parseText(context: ParseContext) {
  let endIndex = context.source.length
  // 找打字符<  的位置  作为停止的位置
  const ltIndex = context.source.indexOf('<')
  // 找到插值位置
  const delimiterIndex = context.source.indexOf('{{')
  // 如果< 早出现 则作为结尾字符 比如 aasdasdas<p>{{ aa }}</p>
  if (ltIndex > -1 && ltIndex < endIndex) {
    endIndex = ltIndex
  }
  // {{ 早出现 比如 aasdasdas {{ aa }}<p>x</p>
  if (delimiterIndex > -1 && delimiterIndex < endIndex) {
    endIndex = delimiterIndex
  }
  const content = context.source.slice(0, endIndex)
  context.advanceBy(content.length)

  return {
    type: 'Text',
    content,
  }
}

function parseElement(context: ParseContext, ancestors: any[]) {
  const element = parseTag(context)
  if (element) {
    if (element.isSelfClosing) {
      return element
    }
    if (element.tag === 'textarea' || element.tag === 'title') {
      // 切换到文本模式 不解析标签 但解析字符实体
      context.mode = TextModes.RCDATA
    }
    else if (/style|xmp|iframe|noembed|noframes|noscript/.test(element.tag)) {
      // 特殊标签 不解析标签也不解析实体
      context.mode = TextModes.RAWTEXT
    }
    else {
      context.mode = TextModes.DATA
    }

    ancestors.push(element)

    element.children = parseChildren(context, ancestors)

    ancestors.pop()
    if (context.source.startsWith(`</${element.tag}`)) {
      parseTag(context, 'end')
    }
    else {
      console.log(`${element.tag}缺少闭合标签`)
    }
    return element
  }
  else {
    console.log('解析标签出错', context.source)
    return null
  }
}
function parseTag(context: ParseContext, type: 'start' | 'end' = 'start') {
  const { advanceBy, advanceSpaces } = context
  const match = type === 'start'
    ? /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
    : /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // ['<div', 'div']
  if (match) {
    const tag = match[1] // div
    advanceBy(match[0].length)
    advanceSpaces()

    const props = parseAttributes(context)
    // 被消费完毕后剩下的以/>开头说明是自闭合标签
    const isSelfClosing = type === 'start' && context.source.startsWith('/>')
    // 消费完毕
    advanceBy(isSelfClosing ? 2 : 1)
    return {
      type: 'Element',
      tag,
      props,
      children: [],
      isSelfClosing,
    }
  }
  else {
    console.log('不是合格的标签', context.source)
    return null
  }
}
function parseAttributes(context: ParseContext) {
  const props = []
  const { advanceBy, advanceSpaces } = context
  while (
    !context.source.startsWith('>')
     && !context.source.startsWith('/>')
  ) {
    const match = /^[^\s/>][^\s/>=]*/.exec(context.source)
    const name = match[0]
    // 消费属性名 a="xx" => ="xx"
    advanceBy(name.length)
    // 消费空格 a = "xx" =>  ="xx"
    advanceSpaces()
    // 消费等于号
    advanceBy(1)
    // 消费等于号前面的空格

    advanceSpaces()
    // 属性值
    let value = ''
    const quote = context.source[0]
    const isQuoted = quote === '"' || quote === '\''
    if (isQuoted) {
      // 消费引号
      advanceBy(1)
      const endQuoteIndex = context.source.indexOf(quote)
      if (endQuoteIndex > -1) {
        value = context.source.slice(0, endQuoteIndex) // 得到的可能是 --obj.a-- 包含空格换行
        // 消费属性值 这里注意的是 属性值包含空格也被消费了
        advanceBy(value.length)
        // 消费引号
        advanceBy(1)
      }
      else {
        console.error('缺少结尾引号')
      }
    }
    else {
      // 说明属性是这么写的 a=bb 值没写引号
      const match = /^[^\t\r\n\f >]+/.exec(context.source)
      if (match) {
        value = match[0]
        advanceBy(value.length)
      }
    }
    advanceSpaces()
    props.push({
      type: 'Attribute',
      name,
      value,
    })
  }
  return props
}
// 展示ast节点
export function dump(node: Root, indent = 0) {
  const type = node.type
  const desc = node.type === 'Root'
    ? ''
    : node.type === 'Element'
      ? node.tag
      : node.content // 文本

  console.log(`${'-'.repeat(indent)}${type}: ${desc}`)
  if (node.children) {
    node.children.forEach(n => dump(n, indent + 2))
  }
}

// 用于深度优先遍历ast
export function traverseNode(ast: Root, context: Context) {
  context.currentNode = ast
  const exitFns = []

  const transforms = context.nodeTransforms

  // 执行转换函数 如果一直写在这里很很臃肿
  transforms.forEach(n => n(context.currentNode!, context))
  for (let index = 0; index < transforms.length; index++) {
    // 转换函数返回值为退出阶段函数
    const onExit = transforms[index](context.currentNode!, context)
    if (onExit) {
      exitFns.push(onExit)
    }
    //  任何转换函数都可能将元素移除 如果被移除了 直接停止该循环
    if (!context.currentNode) {
      return
    }
  }

  const children = context.currentNode.children

  if (children) {
    children.forEach((n, index) => {
      context.parent = context.currentNode
      context.childIndex = index
      traverseNode(n, context)
    })
  }
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
// 转换标签节点
export function transformElement(node: Root, b: Context) {
  return () => {
    if (node.type !== 'Element') {
      return
    }
    const callExp = createCallExpression('h', [
      createStringLiteral(node.tag),
    ])
    console.log(callExp)

    node.children?.length === 1
      ? callExp.arguments.push(node.children[0].jsNode)
      : callExp.arguments.push(
        createArrayExpression(node.children?.map(c => c.jsNode)),
      )
    node.jsNode = callExp
  }
}
// 转换文本节点
export function transformText(node: Root, b: Context) {
  if (node.type !== 'Text') {
    return
  }
  node.jsNode = createStringLiteral(node.content)
}
const FunctionDecl = 'FunctionDecl'
const StringLiteral = 'StringLiteral'
const Identifier = 'Identifier'
const ArrayExpression = 'ArrayExpression'
const CallExpression = 'CallExpression'

// 转换根节点
export function transformRoot(node: Root) {
  return () => {
    if (node.type !== 'Root') {
      return
    }
    // 暂时不考虑存在多个根节点的问题
    const vnodeJSAST = node.children[0].jsNode
    node.jsNode = {
      type: FunctionDecl,
      id: { type: 'Identifier', name: 'render' },
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: vnodeJSAST,
        },
      ],
    }
  }
}
interface Context {
  // 当前正在转换的节点
  currentNode: Root | null
  // 转换函数
  nodeTransforms: ((a: Root, b: Context) => void)[]
  // 当前节点在父节点中的索引
  childIndex: number
  parent: Root | null
  replaceNode: (node: any) => any
  removeNode: () => void
}

export function transform(ast: Root) {
  const context: Context = {
    // 当前正在转换的节点
    currentNode: null!,
    // 当前节点在父节点中的索引
    childIndex: 0,
    // 当前转换节点的父节点
    parent: null!,
    // 用于替换节点 接收新节点作为参数
    replaceNode(node: any) {
      if (context.parent && context.parent.children) {
        context.parent.children[context.childIndex] = node
        context.currentNode = node
      }
    },
    // 删除节点
    removeNode() {
      if (context.parent) {
        context.parent.children?.splice(context.childIndex, 1)
        context.currentNode = null
      }
    },
    nodeTransforms: [
      transformRoot,
      transformElement,
      transformText,
    ],
  }
  traverseNode(ast, context)
  dump(ast)
}
// 创建字符串文字节点
function createStringLiteral(value) {
  return {
    type: StringLiteral,
    value,
  }
}
// 创建Identifier 节点
function createIdentifier(name) {
  return {
    type: Identifier,
    name,
  }
}
// 创建arrayExpression 节点
function createArrayExpression(elements) {
  return {
    type: ArrayExpression,
    elements,
  }
}

// 创建arrayExpression 节点
function createCallExpression(callee: string, args: any[]) {
  return {
    type: CallExpression,
    callee: createIdentifier(callee),
    arguments: args,
  }
}
function generate(node) {
  const context = {
    code: '', // 最终生成的渲染代码,
    push(code) {
      context.code += code
    },
    currentIndex: 0,
    newLine() {
      context.code += `\n${'  '.repeat(context.currentIndex)}`
    },
    // 用于缩进 让currentIndet自增后 调用换行函数
    indent() {
      context.currentIndex++
      context.newLine()
    },
    // 取消缩进
    deIndent() {
      context.currentIndex--
      context.newLine()
    },
  }
  genNode(node, context)
  return context.code
}
function genNode(node, context) {
  switch (node.type) {
    case 'FunctionDecl':
      genFunctionDecl(node, context)
      break
    case 'ReturnStatement':
      genReturnStatement(node, context)
      break
    case 'CallExpression':
      genCallExpression(node, context)
      break
    case 'StringLiteral':
      genStringLiteral(node, context)
      break
    case 'ArrayExpression':
      genArrayExpression(node, context)
      break
  }
}
function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    genNode(node, context)
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}
function genFunctionDecl(node, context) {
  const { push, indent, deIndent } = context

  push(`function ${node.id.name} `)
  push('(')
  genNodeList(node.params, context)
  push(') ')
  push('{')
  indent()

  node.body.forEach(n => genNode(n, context))

  deIndent()
  push('}')
}

function genReturnStatement(node, context) {
  const { push } = context

  push('return ')
  genNode(node.return, context)
}

function genCallExpression(node, context) {
  const { push } = context
  const { callee, arguments: args } = node
  push(`${callee.name}(`)
  genNodeList(args, context)
  push(')')
}

function genStringLiteral(node, context) {
  const { push } = context

  push(`'${node.value}'`)
}

function genArrayExpression(node, context) {
  const { push } = context
  push('[')
  genNodeList(node.elements, context)
  push(']')
}
// 解析字符实体
function decodeHtml(rawText, asAttr = false) {
  return rawText
}

export function complie(template) {
  const ast = parse(template)
  // 将模板ast转为为JavaScript ast
  // transform(ast)
  // const code = generate(ast.jsNode)
  return ast
}
