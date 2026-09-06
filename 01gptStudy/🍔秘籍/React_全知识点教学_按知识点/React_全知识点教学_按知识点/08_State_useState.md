# 8. State：useState

## 8.1 本章要解决什么问题

props 是父组件传来的数据。state 是组件自己需要记住的数据。

例如：

- 按钮点击次数；
- 输入框内容；
- 弹窗是否打开；
- 当前选中的标签；
- 请求回来的列表数据。

state 变化后，React 会重新渲染组件，页面会更新。

## 8.2 最简单的 useState

```jsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数：{count}
    </button>
  );
}
```

解释：

- count 是当前状态；
- setCount 是修改状态的函数；
- useState(0) 表示初始值是 0。

## 8.3 state 变化会重新渲染

你可以把组件函数想象成“根据当前 state 重新计算 JSX”。

```text
点击按钮 → setCount → React 重新运行 Counter → 返回新的 JSX → 页面显示新 count
```

不要把 state 当普通变量。

## 8.4 普通变量不能触发页面更新

错误示例：

```jsx
export default function Counter() {
  let count = 0;

  return (
    <button onClick={() => count++}>
      {count}
    </button>
  );
}
```

count 变了，但 React 不知道要重新渲染，所以页面不会按预期更新。

会影响页面显示的数据，应该放进 state。

## 8.5 基于旧状态更新：函数写法

如果新状态依赖旧状态，推荐写函数形式：

```jsx
setCount(prevCount => prevCount + 1);
```

例如连续加三次：

```jsx
function addThree() {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
}
```

不要写成：

```jsx
function addThree() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
```

因为同一次事件里 count 还是当前这一次渲染中的值。

## 8.6 更新对象 state

不要直接修改对象。

错误：

```jsx
user.name = '小红';
setUser(user);
```

正确：创建新对象。

```jsx
const [user, setUser] = useState({ name: '小明', age: 18 });

function changeName() {
  setUser({ ...user, name: '小红' });
}
```

React 需要新的对象引用来判断状态发生了变化。

## 8.7 更新数组 state

新增：

```jsx
setTodos([...todos, { id: 3, text: '学习 React' }]);
```

删除：

```jsx
setTodos(todos.filter(todo => todo.id !== id));
```

修改：

```jsx
setTodos(
  todos.map(todo =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  )
);
```

不要直接 push、splice、sort 原数组后再 set。

## 8.8 初始值只在第一次渲染使用

```jsx
const [count, setCount] = useState(0);
```

0 只在组件第一次出现时作为初始值。后面重新渲染不会重新初始化。

如果初始值计算很重，可以传函数：

```jsx
const [list, setList] = useState(() => createBigList());
```

这样 createBigList 只在初始化时执行。

## 8.9 一个组件可以有多个 state

```jsx
const [name, setName] = useState('');
const [age, setAge] = useState(18);
const [open, setOpen] = useState(false);
```

如果几个状态总是一起变化，也可以合成一个对象。但初学时，简单独立的状态分开写更清楚。

## 8.10 常见错误

- 忘记导入 useState；
- 直接修改对象或数组；
- 以为 setState 后下一行立刻能读到新值；
- 在循环或条件中调用 useState；
- 把不会影响页面的数据也全部放进 state；
- 基于旧状态更新时没有使用函数写法。

## 8.11 小结与练习

- state 是组件自己记住的数据；
- setState 会触发重新渲染；
- 对象和数组更新要创建新值；
- 基于旧状态更新时用函数写法；
- Hooks 必须在组件顶层调用。

练习：

1. 写一个计数器，可以加一、减一、清零。
2. 写一个按钮控制一段文字显示或隐藏。
3. 写一个 todo 数组，可以新增、删除、切换完成状态。
