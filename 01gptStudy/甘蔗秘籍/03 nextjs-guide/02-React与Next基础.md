# 02 React 与 Next.js 基础

## 1. 从 Vue 思维切换

| Vue | React/Next.js |
|---|---|
| `template` | JSX（JavaScript 表达 UI） |
| `props` | `props` |
| `emit` | 回调函数或 `onXxx` props |
| `ref()` | `useState()` |
| `computed` | `useMemo`（只在有必要时） |
| `watch` | `useEffect`（仅处理副作用） |
| `v-if`/`v-for` | JavaScript 的 `&&`、三元表达式、`map` |
| composable | 自定义 hook |

React 组件必须返回一棵 JSX 树。JSX 中使用 `className`、`htmlFor`，事件使用 `onClick` 等驼峰命名。

```tsx
type GreetingProps = { name: string }

export function Greeting({ name }: GreetingProps) {
  return <h1 className="title">你好，{name}</h1>
}
```

## 2. Server Component 与 Client Component

App Router 的组件默认是 **Server Component**：在服务器执行，可直接读取数据库或私密环境变量，发送给浏览器的 JavaScript 更少。文件顶部写 `'use client'` 后，该文件成为 Client Component，并把它的依赖子树带到浏览器，才能使用 `useState`、`useEffect`、点击事件和浏览器 API。

```tsx
// app/counter.tsx
'use client'
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>点击 {count}</button>
}
```

原则：能留在服务器就留在服务器；把交互部分切成最小 Client Component。`'use client'` 不是“整个页面必须客户端渲染”的开关，而是一个模块边界。

## 3. Props、state 与单向数据流

父组件通过 props 给子组件数据；子组件通过回调通知父组件。state 应放在最接近真正使用它的共同父级，避免把所有状态塞进全局 store。

```tsx
'use client'
import { useState } from 'react'

export default function SearchBox() {
  const [keyword, setKeyword] = useState('')
  return <input value={keyword} onChange={e => setKeyword(e.target.value)} />
}
```

## 4. useEffect 的边界

`useEffect` 用于和 React 外部系统同步：订阅事件、定时器、手动调用浏览器 API。不要用它计算可由 props/state 直接得到的值，也不要用它替代服务器数据获取。

```tsx
useEffect(() => {
  const handler = () => console.log(window.scrollY)
  window.addEventListener('scroll', handler)
  return () => window.removeEventListener('scroll', handler)
}, [])
```

## 5. Next 页面最小形态

```tsx
// app/page.tsx -> /
export default function HomePage() {
  return <main><h1>我的博客</h1></main>
}
```

页面、布局、加载和错误文件必须默认导出符合约定的组件。服务端组件可以是 `async`：

```tsx
export default async function Page() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}
```

## 6. TypeScript 最小规范

- 为组件 props 写 `type` 或 `interface`。
- API 返回值定义类型；不要到处使用 `any`。
- 外部数据进入应用时做运行时校验（例如使用 Zod），因为 TypeScript 类型会在运行时消失。
- `null`、`undefined` 明确处理，避免页面运行时崩溃。
