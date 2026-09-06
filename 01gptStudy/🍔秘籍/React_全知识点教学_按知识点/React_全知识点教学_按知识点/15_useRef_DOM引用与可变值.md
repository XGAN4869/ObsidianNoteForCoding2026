# 15. useRef：DOM 引用与可变值

## 15.1 本章要解决什么问题

有些场景需要拿到真实 DOM，或者保存一个不需要触发渲染的值。

useRef 常见用途：

- 获取 input DOM，自动聚焦；
- 保存定时器 id；
- 保存上一次的值；
- 保存不参与页面显示的可变数据。

## 15.2 获取 DOM 元素

```jsx
import { useRef } from 'react';

export default function FocusInput() {
  const inputRef = useRef(null);

  function handleFocus() {
    inputRef.current.focus();
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleFocus}>聚焦输入框</button>
    </div>
  );
}
```

解释：

- `useRef(null)` 创建 ref 对象；
- `ref={inputRef}` 把 DOM 放到 inputRef.current；
- 点击按钮时调用 DOM 的 focus 方法。

## 15.3 ref.current 什么时候有值

第一次渲染时，DOM 还没有挂上去，所以初始是 null。

通常在事件中或 useEffect 中使用 DOM ref：

```jsx
import { useEffect, useRef } from 'react';

export default function AutoFocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

## 15.4 修改 ref 不会重新渲染

```jsx
import { useRef } from 'react';

export default function ClickCounter() {
  const countRef = useRef(0);

  function handleClick() {
    countRef.current++;
    console.log(countRef.current);
  }

  return <button onClick={handleClick}>点击</button>;
}
```

点击后控制台数字会变，但页面不会自动更新。

如果数据要显示在页面上，请使用 state。

## 15.5 保存定时器 id

```jsx
import { useRef, useState } from 'react';

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  function start() {
    if (timerRef.current !== null) return;

    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  }

  function stop() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  return (
    <div>
      <p>{time} 秒</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

timerRef 保存的是“定时器 id”，它不需要显示在页面上，所以适合用 ref。

## 15.6 保存上一次的值

```jsx
import { useEffect, useRef, useState } from 'react';

export default function PreviousValue() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(null);

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  return (
    <div>
      <p>当前：{count}</p>
      <p>上一次：{prevCountRef.current}</p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
    </div>
  );
}
```

useEffect 在渲染后更新 ref，因此下一次渲染时能看到上一次的值。

## 15.7 ref 和 state 的区别

| 对比 | state | ref |
|---|---|---|
| 修改后是否重新渲染 | 会 | 不会 |
| 是否适合显示到页面 | 适合 | 不适合 |
| 是否能保存 DOM | 不常用 | 常用 |
| 是否能保存定时器 id | 可以但不合适 | 适合 |

简单判断：

```text
要显示在页面上 → state
不显示，只是保存一个可变值 → ref
```

## 15.8 不要在渲染期间随意读写 ref

组件渲染应该保持纯净。不要在 JSX 计算过程中随意修改 ref。

不推荐：

```jsx
function App() {
  const countRef = useRef(0);
  countRef.current++;
  return <p>{countRef.current}</p>;
}
```

这会让组件行为难以预测。ref 的修改通常放在事件或 effect 中。

## 15.9 常见错误

- 以为修改 ref 会更新页面；
- DOM 还没挂载就访问 ref.current；
- 需要显示的数据用了 ref，导致页面不更新；
- 直接在渲染阶段修改 ref；
- 忘记清理 ref 中保存的定时器。

## 15.10 小结与练习

- useRef 返回一个有 current 属性的对象；
- ref 可以拿 DOM；
- ref 可以保存不触发渲染的可变值；
- 修改 ref.current 不会重新渲染；
- 页面显示用 state，不显示的内部值用 ref。

练习：

1. 写一个输入框，点击按钮后自动聚焦。
2. 写一个秒表，能开始和停止。
3. 保存并显示 count 的上一次值。
