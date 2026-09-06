# 22. 错误边界、Suspense 与 lazy

## 22.1 本章要解决什么问题

真实项目中，页面可能会出现错误：

- 某个组件代码写错；
- 某个数据为空，却访问了它的属性；
- 某个页面组件很大，第一次加载很慢；
- 用户进入某个路由时才需要加载对应页面。

本章学习三个重要概念：

- **错误边界 Error Boundary**：组件出错时，显示备用界面，避免整个页面白屏；
- **Suspense**：等待某些内容准备好时，显示 fallback；
- **lazy**：把组件拆成懒加载，访问时再下载。

---

## 22.2 什么是错误边界

错误边界就是一个特殊组件。

它的作用是：

```text
如果子组件渲染时出错，不让整个 React 应用直接崩掉，
而是显示一个友好的错误提示。
```

比如：

```text
用户列表组件坏了
↓
显示：页面出错了，请刷新或联系管理员
```

这样比整个页面空白更好。

---

## 22.3 错误边界的重要事实

React 官方错误边界目前常规写法仍然是 **class 组件**。

函数组件和 Hooks 是新项目主线，但错误边界这个能力仍常用 class 组件实现，或者使用第三方库封装好的函数式写法。

初学者先记住：

```text
普通组件用函数组件。
错误边界可以单独写一个 class 组件。
```

---

## 22.4 一个最小错误边界

新建文件：

```text
src/components/ErrorBoundary.jsx
```

代码：

```jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('组件发生错误：', error);
    console.error('错误信息：', info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          页面出错了，请刷新后重试。
        </div>
      );
    }

    return this.props.children;
  }
}
```

使用：

```jsx
import ErrorBoundary from './components/ErrorBoundary.jsx';

function BrokenComponent() {
  const user = null;
  return <p>{user.name}</p>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>
  );
}
```

`BrokenComponent` 会报错，但页面会显示备用提示。

---

## 22.5 错误边界能捕获什么

错误边界主要捕获：

- 子组件渲染过程中的错误；
- 子组件生命周期中的错误；
- 子组件构造函数中的错误。

简单说：

```text
组件渲染时炸了，错误边界可以接住。
```

---

## 22.6 错误边界不能捕获什么

错误边界不能捕获所有错误。

常见不能捕获：

- 事件处理函数中的错误；
- `setTimeout`、`Promise` 等异步回调中的错误；
- 服务端渲染错误；
- 错误边界组件自己内部的错误。

事件函数错误示例：

```jsx
function App() {
  function handleClick() {
    throw new Error('点击时出错');
  }

  return <button onClick={handleClick}>点击</button>;
}
```

这种错误应该在事件函数里自己处理：

```jsx
function App() {
  function handleClick() {
    try {
      throw new Error('点击时出错');
    } catch (error) {
      console.error(error);
      alert('操作失败');
    }
  }

  return <button onClick={handleClick}>点击</button>;
}
```

---

## 22.7 错误边界放在哪里

可以包住整个应用：

```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

也可以包住某个容易出错的区域：

```jsx
<div>
  <Header />

  <ErrorBoundary>
    <UserList />
  </ErrorBoundary>

  <Footer />
</div>
```

实际项目中，常见做法是：

- 顶层放一个总错误边界；
- 重要业务区域再单独放局部错误边界。

---

## 22.8 什么是 lazy

`lazy` 用来懒加载组件。

普通导入：

```jsx
import UserPage from './pages/UserPage.jsx';
```

意思是：应用启动时就加载这个组件。

懒加载：

```jsx
import { lazy } from 'react';

const UserPage = lazy(() => import('./pages/UserPage.jsx'));
```

意思是：需要显示 `UserPage` 时，再加载它。

这可以减少首页第一次加载的代码量。

---

## 22.9 lazy 必须配合 Suspense

懒加载组件需要时间下载。下载期间显示什么？

用 `Suspense` 的 `fallback`。

```jsx
import { lazy, Suspense } from 'react';

const UserPage = lazy(() => import('./pages/UserPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<p>页面加载中...</p>}>
      <UserPage />
    </Suspense>
  );
}
```

解释：

- `lazy`：什么时候需要组件，什么时候加载组件文件；
- `Suspense`：等待组件加载时，先显示备用内容；
- `fallback`：备用内容。

---

## 22.10 lazy 的文件必须默认导出

被 `lazy` 加载的组件文件通常要默认导出。

UserPage.jsx：

```jsx
export default function UserPage() {
  return <h1>用户页面</h1>;
}
```

App.jsx：

```jsx
import { lazy, Suspense } from 'react';

const UserPage = lazy(() => import('./pages/UserPage.jsx'));
```

如果只写命名导出：

```jsx
export function UserPage() {}
```

初学阶段不要这样配合 `lazy`，容易出错。

---

## 22.11 路由页面懒加载

懒加载最常见的地方是路由页面。

```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const UserPage = lazy(() => import('./pages/UserPage.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/users">用户</Link>
      </nav>

      <Suspense fallback={<p>页面加载中...</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UserPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

注意：React Router 不同版本导入包名可能不同。当前官方文档的声明式模式示例从 `react-router` 导入；旧教程或旧项目中常见 `react-router-dom`。以你项目安装版本的官方文档为准。

---

## 22.12 Suspense 不等于通用 loading 方案

初学者容易误会：

```text
是不是所有网络请求都能直接用 Suspense？
```

答案：不一定。

在普通 React 客户端项目中，最稳妥的入门写法仍然是：

```text
useEffect + loading + error + data
```

Suspense 主要常见用于：

- `lazy` 懒加载组件；
- 支持 Suspense 的框架或数据库；
- React 生态中更高级的数据加载方案。

所以本教材先用 Suspense 讲组件懒加载，不把它说成所有请求的万能写法。

---

## 22.13 Suspense fallback 可以自定义

简单文字：

```jsx
<Suspense fallback={<p>加载中...</p>}>
  <UserPage />
</Suspense>
```

也可以是组件：

```jsx
function Loading() {
  return <div className="loading">正在努力加载，请稍等...</div>;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserPage />
    </Suspense>
  );
}
```

---

## 22.14 ErrorBoundary 和 Suspense 可以一起用

一个负责错误，一个负责加载中。

```jsx
<ErrorBoundary>
  <Suspense fallback={<p>加载中...</p>}>
    <UserPage />
  </Suspense>
</ErrorBoundary>
```

含义：

- 加载组件时，显示“加载中”；
- 组件渲染出错时，显示“页面出错”。

---

## 22.15 常见错误

### 错误 1：lazy 没有放在 Suspense 里

错误：

```jsx
const UserPage = lazy(() => import('./UserPage.jsx'));

function App() {
  return <UserPage />;
}
```

正确：

```jsx
<Suspense fallback={<p>加载中...</p>}>
  <UserPage />
</Suspense>
```

### 错误 2：lazy 写在组件内部

不推荐：

```jsx
function App() {
  const UserPage = lazy(() => import('./UserPage.jsx'));
  return <UserPage />;
}
```

推荐写在组件外面：

```jsx
const UserPage = lazy(() => import('./UserPage.jsx'));

function App() {
  return <UserPage />;
}
```

### 错误 3：以为错误边界能捕获事件错误

事件错误需要在事件函数中 `try...catch`。

### 错误 4：把所有内容都懒加载

不要为了懒加载而懒加载。首页必须显示的关键组件不一定要懒加载。

---

## 22.16 小结与练习

本章重点：

- 错误边界用于捕获子组件渲染错误；
- 错误边界常规写法是 class 组件；
- `lazy` 用于组件懒加载；
- `lazy` 通常需要配合 `Suspense`；
- `Suspense fallback` 是加载期间显示的备用 UI；
- 普通网络请求不要盲目改成 Suspense。

练习：

1. 写一个 `ErrorBoundary`，包住一个故意报错的组件。
2. 创建 `HomePage.jsx` 和 `AboutPage.jsx`，用 `lazy` 懒加载。
3. 给 `Suspense` 写一个自定义 `Loading` 组件。
4. 尝试把错误边界放在整个 App 外层，再放在某个局部区域，观察区别。
