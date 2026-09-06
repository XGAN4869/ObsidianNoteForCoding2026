# 20. 自定义 Hooks

## 20.1 本章要解决什么问题

当你发现一段逻辑在多个组件里重复出现时，最好把它提取成自定义 Hook。

自定义 Hook 能复用的通常不是 UI，而是逻辑。

例如：

- 监听窗口宽度；
- 控制开关状态；
- 读取本地存储；
- 封装请求逻辑；
- 记录鼠标位置；
- 处理表单字段。

## 20.2 自定义 Hook 的命名规则

自定义 Hook 必须以 `use` 开头。

```jsx
function useWindowWidth() {}
function useToggle() {}
function useLocalStorage() {}
```

这样 React 和 ESLint 才能识别它是一个 Hook。

## 20.3 一个最简单的 useToggle

```jsx
import { useState } from 'react';

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  function toggle() {
    setValue(v => !v);
  }

  return [value, toggle, setValue];
}

export default function App() {
  const [open, toggleOpen] = useToggle(false);

  return (
    <div>
      <button onClick={toggleOpen}>切换</button>
      {open && <p>显示中</p>}
    </div>
  );
}
```

## 20.4 提取重复逻辑

如果多个组件都要写“显示或隐藏”的逻辑，就可以用 useToggle。

```jsx
const [open, toggleOpen] = useToggle();
const [menuOpen, toggleMenu] = useToggle();
```

同一个逻辑可在多个地方复用。

## 20.5 useLocalStorage 示例

```jsx
import { useEffect, useState } from 'react';

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

使用：

```jsx
export default function App() {
  const [name, setName] = useLocalStorage('name', '小明');

  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

## 20.6 自定义 Hook 里可以用其他 Hook

自定义 Hook 本质上也是一个函数，只是里面可以安全地调用其他 Hook。

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
```

## 20.7 自定义 Hook 不等于新组件

自定义 Hook：

- 不返回 JSX；
- 返回数据、函数、对象、数组；
- 共享逻辑。

组件：

- 返回 JSX；
- 负责展示 UI。

这两个概念不要混。

## 20.8 自定义 Hook 的返回形式

你可以返回数组：

```jsx
return [value, setValue];
```

也可以返回对象：

```jsx
return { value, setValue };
```

如果返回多个值且顺序很重要，可以用数组；如果字段较多，通常对象更清楚。

## 20.9 规则和限制

自定义 Hook 也要遵守 Rules of Hooks：

- 只能在组件或自定义 Hook 顶层调用 Hook；
- 不能在条件、循环、嵌套函数里调用；
- 不能随便在普通函数里调用 useState/useEffect。

## 20.10 常见错误

- 自定义 Hook 没有 use 前缀；
- 把 UI 写进 Hook；
- 在条件中调用 Hook；
- 一个 Hook 里隐藏了太多副作用；
- 明明很简单的逻辑也硬抽象成 Hook。

## 20.11 小结与练习

- 自定义 Hook 用于复用逻辑；
- 命名必须以 use 开头；
- Hook 不返回 JSX；
- 可以组合其他 Hook；
- 先提取真正重复的逻辑，不要过度抽象。

练习：

1. 写一个 useToggle。
2. 写一个 useLocalStorage。
3. 写一个 useWindowWidth。
