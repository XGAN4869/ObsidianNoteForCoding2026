# 18. Context：跨层传递数据

## 18.1 本章要解决什么问题

当组件层级很深时，props 一层层传递会很麻烦。

这种情况叫“属性穿透”或者“prop drilling”。

例如：

- App → Layout → Header → UserMenu
- 只有最外层有当前用户信息
- 但最里面的组件才需要这个信息

Context 就是用来解决这种跨层传递数据的问题。

## 18.2 什么时候适合用 Context

适合：

- 主题色；
- 语言；
- 登录用户；
- 当前布局配置；
- 不太频繁变化的全局信息。

不太适合：

- 很复杂、很频繁变化的业务数据；
- 大型列表的每一项都依赖的高频状态；
- 所有状态都想一把放进去的场景。

如果数据变化很频繁，通常更适合状态管理库。

## 18.3 创建 Context

```jsx
import { createContext } from 'react';

export const ThemeContext = createContext('light');
```

这里的 `'light'` 是默认值。只有在外层没有提供 Provider 时才会用到。

## 18.4 提供数据

React 19 的官方文档中可以看到更简洁的写法：

```jsx
<ThemeContext value="dark">
  <App />
</ThemeContext>
```

为了兼容你在旧项目里常见的写法，我们也可以写成：

```jsx
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

初学时，你先认识 Provider 写法；遇到新版本项目，再认识简写。

## 18.5 读取 Context

```jsx
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

function Button() {
  const theme = useContext(ThemeContext);

  return <button className={theme}>按钮</button>;
}
```

`useContext` 会读取最近一层匹配的上下文值。

## 18.6 一个完整例子

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext('light');

function Header() {
  const theme = useContext(ThemeContext);
  return <header className={theme}>当前主题：{theme}</header>;
}

function AppContent() {
  return <Header />;
}

export default function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </button>
      <AppContent />
    </ThemeContext.Provider>
  );
}
```

## 18.7 Context 适合什么，不适合什么

适合传“环境信息”：

- 谁在登录；
- 语言是什么；
- 主题是什么；
- 是否为移动端布局。

不适合放所有业务数据：

- 表格每一行数据；
- 复杂编辑表单状态；
- 高频实时更新的内容。

因为 Context 一变，读取它的组件都会受到影响。

## 18.8 Provider 值尽量稳定

如果 value 每次都是新对象，子组件可能会频繁重渲染。

```jsx
const value = { user, logout };
```

这个对象如果每次渲染都重新创建，就会变化。

常见做法是：

- 用 useMemo 缓存对象；
- 拆分多个 Context；
- 只传必要字段。

## 18.9 拆分多个 Context

不要把所有东西都塞到一个 Context：

```jsx
<AuthContext />
<ThemeContext />
<LocaleContext />
```

拆分后更清楚，也更容易减少无关重渲染。

## 18.10 常见错误

- 以为 Context 是状态管理库；
- 把所有全局状态都放进一个 Context；
- Provider value 每次都创建新对象却不处理；
- 在组件内部创建 Context；
- 没有给默认值，却忘记包 Provider。

## 18.11 小结与练习

- Context 用于跨层传递信息；
- createContext 创建上下文；
- Provider 提供值；
- useContext 读取值；
- 它适合环境类数据，不适合滥放所有状态。

练习：

1. 写一个主题 Context，切换浅色和深色。
2. 写一个登录用户 Context，在多个组件里读取用户名。
3. 思考：你的项目中哪些数据适合用 Context，哪些不适合。
