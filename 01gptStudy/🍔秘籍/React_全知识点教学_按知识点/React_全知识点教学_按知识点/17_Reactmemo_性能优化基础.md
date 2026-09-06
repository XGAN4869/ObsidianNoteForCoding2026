# 17. React.memo 与性能优化基础

## 17.1 本章要解决什么问题

当父组件重新渲染时，子组件通常也会跟着重新渲染。

这不一定是坏事。大多数组件渲染都很快，React 的默认行为也很好理解。

但在下面这些场景里，你可能会想减少不必要的渲染：

- 子组件计算很多；
- 列表很长；
- 页面输入很频繁；
- 子组件接收的 props 很稳定；
- 某个图表、表格、卡片渲染成本高。

React.memo 就是用来做这类优化的。

## 17.2 React.memo 是什么

React.memo 会返回一个“记忆化”的组件。

如果父组件重新渲染，但传给子组件的 props 没变，React 可能跳过这个子组件的重新渲染。

```jsx
import { memo } from 'react';

const UserCard = memo(function UserCard({ name }) {
  console.log('UserCard 渲染');
  return <h2>{name}</h2>;
});
```

使用：

```jsx
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>count: {count}</button>
      <UserCard name="小明" />
    </div>
  );
}
```

点击按钮时，App 会重新渲染，但如果 `name` 没变，`UserCard` 有机会跳过渲染。

## 17.3 React.memo 不是保证

memo 是性能优化，不是业务正确性的保证。

React 官方也强调：即使使用 memo，React 仍然可能重新渲染组件。

你应该这样理解：

```text
props 没变 → React 可能跳过渲染
props 变了 → 一定重新渲染
state 变了 → 组件自己也会重新渲染
context 变了 → 使用该 context 的组件也会重新渲染
```

## 17.4 什么时候适合用 React.memo

适合：

- 子组件很重；
- 子组件经常收到相同 props；
- 父组件因为别的状态频繁重渲染；
- 你已经用 DevTools 或日志确认有性能问题。

不适合：

- 小组件；
- 只渲染一次的页面；
- props 每次都变；
- 你只是想“看起来高级”。

## 17.5 浅比较是什么

React.memo 默认只做浅比较。

简单理解就是：

- 基本类型比较值是否相等；
- 对象、数组、函数比较引用是否相同。

```jsx
const a = { name: '小明' };
const b = { name: '小明' };

// a !== b，因为它们是两个不同对象
```

所以如果你每次渲染都创建新对象，即使对象内容一样，memo 也可能失效。

## 17.6 如何配合 useMemo 和 useCallback

如果你要传对象给 memo 子组件，可以先缓存对象：

```jsx
const person = useMemo(() => ({ name, age }), [name, age]);
return <Profile person={person} />;
```

如果你要传函数给 memo 子组件，可以先缓存函数：

```jsx
const handleSelect = useCallback(() => {
  setSelectedId(id);
}, [id]);
```

这也是为什么 `memo` 常和 `useMemo`、`useCallback` 一起出现。

## 17.7 一个完整例子

```jsx
import { memo, useCallback, useState } from 'react';

const CounterButton = memo(function CounterButton({ onAdd }) {
  console.log('CounterButton 渲染');
  return <button onClick={onAdd}>加 1</button>;
});

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  const handleAdd = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div>
      <p>count：{count}</p>
      <input value={text} onChange={e => setText(e.target.value)} />
      <CounterButton onAdd={handleAdd} />
    </div>
  );
}
```

输入框变化时，`CounterButton` 可能不会重新渲染，因为它收到的 `onAdd` 引用稳定。

## 17.8 不要为了 memo 改坏代码

有些人为了让 memo 生效，会把 props 强行改得很怪，或者写很多缓存代码。

记住：

1. 先把代码写对；
2. 再用性能工具看问题；
3. 真有瓶颈再优化。

如果没有卡顿，通常不要提前优化。

## 17.9 React Compiler 相关提醒

React 官方文档提到，React Compiler 未来会自动做很多 memo 化优化。

这意味着：

- 以后某些手写 memo 的需要会下降；
- 但今天的普通项目，React.memo 仍然很常见；
- 你仍然要理解它在做什么。

## 17.10 常见错误

- 给所有组件都包 React.memo；
- props 每次都变，还期待 memo 生效；
- 把 useMemo/useCallback 当成万能工具；
- 以为 memo 能阻止 state 变化导致的渲染；
- 没有先定位性能问题就乱优化。

## 17.11 小结与练习

- React.memo 用来减少不必要的子组件重渲染；
- 它只是一种优化，不是保证；
- 默认做浅比较；
- 对象和函数 props 经常需要配合 useMemo/useCallback；
- 先写正确，再做性能优化。

练习：

1. 写一个父组件和 memo 子组件，观察输入框变化时子组件是否重渲染。
2. 把对象 props 改成单独传字段，观察效果。
3. 先删除 memo，确认代码逻辑仍然正确，再决定是否加回去。
