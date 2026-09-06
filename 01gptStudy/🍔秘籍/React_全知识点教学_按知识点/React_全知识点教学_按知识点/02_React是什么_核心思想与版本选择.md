# 2. React 是什么：核心思想与版本选择

## 2.1 本章要解决什么问题

学习 React 前，先要知道它到底是什么，解决什么问题。

React 不是完整的“万能前端框架”。它主要负责 UI，也就是页面怎么根据数据显示。

React 常和这些工具一起出现：

- React DOM：把 React 组件渲染到浏览器 DOM；
- Vite：开发和打包工具；
- React Router：路由；
- Redux Toolkit、Zustand：状态管理；
- Next.js、Remix、React Router Framework Mode：更完整的应用框架。

本教材先讲纯 React + Vite 的单页应用基础。

## 2.2 React 解决什么问题

不用 React 时，你可能会写：

```js
const text = document.querySelector('#text');
const btn = document.querySelector('#btn');

let count = 0;

btn.addEventListener('click', () => {
  count++;
  text.textContent = count;
});
```

数据一多，DOM 操作会越来越乱。

React 的思路是：

```text
你告诉 React：当前数据下，页面应该是什么样。
React 帮你把页面更新到正确状态。
```

## 2.3 React 的三个核心思想

### 组件化

把页面拆成小块：

- Header；
- Sidebar；
- UserCard；
- TodoList；
- TodoItem。

每个组件负责自己的结构、样式和逻辑。

### 声明式 UI

你不需要一步一步命令浏览器修改 DOM，而是声明“如果 count 是 3，页面显示 3”。

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 单向数据流

父组件通过 props 把数据传给子组件。子组件不能直接改父组件的数据。子组件如果想通知父组件，要调用父组件传来的函数。

```text
父组件 state → props → 子组件显示
子组件事件 → 调用父组件函数 → 父组件更新 state
```

## 2.4 React 是库还是框架

React 官方通常把 React 称为 UI library。意思是它主要负责界面层。

一个完整项目还需要：

- 路由；
- 请求；
- 状态管理；
- 表单校验；
- 测试；
- 构建与部署。

所以学习 React 时，你会同时学习一些生态工具。但要分清：React 核心是组件和状态，生态工具是为项目服务的。

## 2.5 版本选择

新项目通常直接安装当前稳定版本。写项目时最重要的是查看 package.json：

```json
{
  "dependencies": {
    "react": "以项目实际安装版本为准",
    "react-dom": "以项目实际安装版本为准"
  }
}
```

上面只是说明位置，不是让你照抄。你的真实版本以创建项目时安装到 package.json 里的版本为准。

如果你的项目是 React 18，核心知识仍然大部分相同：函数组件、JSX、props、state、Hooks 都一样重要。

React 19 增加或稳定了一些新能力，例如 Actions、useActionState、useOptimistic，以及更靠近框架和服务端能力的内容。初学者可以先掌握本教材前 22 章，再理解这些能力。

## 2.6 React 与 Vue 的差别，简单理解

如果你已经看过 Vue3，可以这样对比：

| 方向   | React            | Vue3                   |
| ---- | ---------------- | ---------------------- |
| 页面描述 | JSX              | template 模板            |
| 状态   | useState 等 Hooks | ref、reactive           |
| 派生数据 | useMemo 或直接计算    | computed               |
| 副作用  | useEffect        | watch、watchEffect、生命周期 |
| 子传父  | 父传回调函数           | emit                   |
| 跨层数据 | Context          | provide/inject         |

不要把两者语法硬套。React 更强调“组件函数根据数据返回 JSX”。

## 2.7 什么时候适合使用 React

适合：

- 中大型交互页面；
- 后台管理系统；
- 电商、内容、数据看板；
- 需要组件复用的项目；
- 团队已经使用 React 技术栈。

不一定适合：

- 一个只有几行交互的静态页面；
- 完全不需要构建工具的小页面；
- 你还完全不会 HTML、CSS、JavaScript 的时候。

## 2.8 常见错误

- 以为 React 自带所有功能；
- 把 React Router、Redux 误认为 React 核心；
- 看到 React 19 新 API 就马上到处使用；
- 在 React 中大量手动操作 DOM；
- 子组件直接修改父组件数据。

## 2.9 小结与练习

- React 主要负责 UI；
- React 核心思想是组件化、声明式 UI、单向数据流；
- 新项目使用函数组件和 Hooks；
- 版本以 package.json 和官方文档为准。

练习：

1. 用一句话说明 React 解决了什么问题。
2. 写出“单向数据流”的意思。
3. 说出 React 核心和 React 生态工具的区别。
