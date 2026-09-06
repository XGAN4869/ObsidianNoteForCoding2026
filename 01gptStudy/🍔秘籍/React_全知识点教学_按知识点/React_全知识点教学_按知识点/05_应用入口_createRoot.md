# 5. 应用入口 createRoot

## 5.1 本章要解决什么问题

React 组件写好了以后，需要挂载到浏览器页面中。这个入口通常在 src/main.jsx。

你需要理解：

- index.html 中的 root 是什么；
- createRoot 做什么；
- App 组件为什么能显示；
- StrictMode 为什么开发时可能让某些逻辑执行两次。

## 5.2 index.html 中的根节点

Vite 项目的 index.html 通常有：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

React 会把组件渲染到 id 为 root 的 div 中。

## 5.3 main.jsx 标准写法

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

这段代码分成三步理解：

1. 找到页面中的 root DOM 节点；
2. createRoot 创建 React 根；
3. render 把 App 组件渲染进去。

## 5.4 App 是根组件

```jsx
export default function App() {
  return <h1>你好，React</h1>;
}
```

App 不是特殊关键字，只是大家习惯把根组件命名为 App。你也可以叫 Root，但 main.jsx 中要对应修改。

## 5.5 StrictMode 是什么

StrictMode 是开发环境的检查工具。它不会在页面上显示额外内容。

它可以帮助发现：

- 不安全的副作用；
- 过时的写法；
- 组件是否能正确清理 effect。

在开发环境中，StrictMode 可能会让某些函数或 effect 额外执行一次，用来检查代码是否安全。这不是生产环境的真实重复执行。

所以如果你看到 useEffect 里打印了两次，不要马上以为 React 出错。你应该检查有没有清理函数，后面 useEffect 章节会讲。

## 5.6 不使用 StrictMode 可以吗

可以，但不建议初学项目删除。它帮助你提前发现问题。

如果你临时为了观察日志，可以这样：

```jsx
createRoot(document.getElementById('root')).render(<App />);
```

但正式学习和项目中建议保留 StrictMode。

## 5.7 多个根节点

一般项目只有一个 React 根。但 React 允许在一个页面不同位置创建多个根：

```jsx
createRoot(document.getElementById('header-root')).render(<Header />);
createRoot(document.getElementById('main-root')).render(<App />);
```

初学者不需要这样做。普通单页应用一个 root 就够。

## 5.8 卸载根

如果你把 React 嵌入到非 React 系统里，可能需要卸载：

```jsx
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// 某些场景不再需要时
root.unmount();
```

普通 Vite 项目很少手动调用 unmount。

## 5.9 常见错误

- index.html 中没有 id 为 root 的元素；
- main.jsx 中 getElementById 写错；
- 忘记从 react-dom/client 导入 createRoot；
- App 没有默认导出，却用默认导入；
- 误以为 StrictMode 生产环境也会让 effect 重复执行。

## 5.10 小结与练习

- index.html 提供 root；
- main.jsx 创建 React 根；
- App 是根组件；
- StrictMode 是开发检查工具；
- 普通项目一个 createRoot 就够。

练习：

1. 找到你的 Vite 项目中的 index.html 和 main.jsx。
2. 把 App 组件显示的文字改成“我理解入口了”。
3. 临时移除 StrictMode，观察控制台日志变化，再恢复。
