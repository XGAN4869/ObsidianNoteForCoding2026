# 13. 样式处理：className、style、CSS Modules

## 13.1 本章要解决什么问题

React 负责页面结构和状态，但页面还需要样式。

本章学习三种常见样式写法：

- 普通 CSS + className；
- 内联 style；
- CSS Modules。

还有 CSS-in-JS、Tailwind CSS、Sass 等方案，它们属于扩展工具，本章先掌握最基础、最常见的方式。

## 13.2 普通 CSS + className

App.jsx：

```jsx
import './App.css';

export default function App() {
  return (
    <div className="card">
      <h2 className="title">用户卡片</h2>
      <p>你好，React</p>
    </div>
  );
}
```

App.css：

```css
.card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.title {
  color: #2563eb;
}
```

注意：React JSX 中写 `className`，不是 `class`。

## 13.3 条件 className

```jsx
function TabButton({ active, children }) {
  return (
    <button className={active ? 'tab active' : 'tab'}>
      {children}
    </button>
  );
}
```

CSS：

```css
.tab {
  color: #333;
}

.tab.active {
  color: white;
  background: #2563eb;
}
```

## 13.4 多个 className 拼接

```jsx
function Alert({ type }) {
  const className = `alert alert-${type}`;

  return <div className={className}>提示信息</div>;
}
```

使用：

```jsx
<Alert type="success" />
<Alert type="error" />
```

CSS：

```css
.alert-success { color: green; }
.alert-error { color: red; }
```

复杂项目可以使用 `clsx` 或 `classnames` 工具库，避免手动拼接太乱。

## 13.5 内联 style

React 的 style 接收对象：

```jsx
export default function App() {
  return (
    <h1 style={{ color: 'tomato', fontSize: 32 }}>
      标题
    </h1>
  );
}
```

注意：

- CSS 属性使用驼峰命名：`fontSize`、`backgroundColor`；
- 数字通常自动加 px，例如 `fontSize: 32`；
- 有些属性可以写字符串，例如 `width: '50%'`。

## 13.6 动态 style

```jsx
function Progress({ percent }) {
  return (
    <div className="progress">
      <div
        className="progress-inner"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
```

内联 style 适合和数据强相关的动态样式，例如进度条宽度。

## 13.7 CSS Modules

普通 CSS 是全局的，类名可能冲突。CSS Modules 可以让类名局部化。

文件名：`UserCard.module.css`

```css
.card {
  padding: 16px;
  border: 1px solid #ddd;
}

.name {
  color: #2563eb;
}
```

UserCard.jsx：

```jsx
import styles from './UserCard.module.css';

export default function UserCard({ name }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.name}>{name}</h2>
    </div>
  );
}
```

好处：不同组件都可以写 `.card`，最终不会互相污染。

## 13.8 全局样式放哪里

常见做法：

```text
src/
  index.css        全局样式、重置样式、body 样式
  App.css          App 相关样式
  components/
    UserCard.jsx
    UserCard.module.css
```

全局样式适合：

- body 字体；
- 通用 reset；
- CSS 变量；
- 全局布局基础。

组件自己的样式尽量靠近组件文件。

## 13.9 样式方案怎么选

| 场景 | 建议 |
|---|---|
| 学习和小项目 | 普通 CSS + className |
| 组件样式怕冲突 | CSS Modules |
| 少量动态样式 | 内联 style |
| 大量原子类 | Tailwind CSS |
| 复杂主题系统 | CSS-in-JS 或 CSS 变量 |

初学先不要同时学太多样式库。先把 CSS 和 className 用熟。

## 13.10 常见错误

- 写 `class` 而不是 `className`；
- style 写成字符串；
- CSS 属性写成 `font-size` 而不是 `fontSize`；
- 普通 CSS 类名冲突；
- 内联 style 写太多，导致结构难读；
- 忘记 import CSS 文件。

## 13.11 小结与练习

- React 中类名用 className；
- 普通 CSS 适合基础样式；
- style 用对象，适合动态样式；
- CSS Modules 能减少类名冲突；
- 样式文件要合理组织。

练习：

1. 写一个 UserCard，并用 App.css 美化。
2. 根据 active 状态切换按钮样式。
3. 把 UserCard 的样式改成 CSS Modules。
