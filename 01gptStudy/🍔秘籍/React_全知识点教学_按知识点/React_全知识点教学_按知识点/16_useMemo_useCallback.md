# 16. useMemo 与 useCallback

## 16.1 本章要解决什么问题

React 组件重新渲染时，组件函数会重新执行。

大多数时候这没有问题。但有些场景可能需要优化：

- 某个计算很耗时；
- 给 memo 子组件传函数，函数每次渲染都变；
- 依赖对象或函数导致 effect 反复执行。

useMemo 和 useCallback 是性能优化工具。初学者要先记住：**不要为了“看起来高级”而滥用它们**。

## 16.2 useMemo 缓存计算结果

```jsx
import { useMemo, useState } from 'react';

function slowFilter(list, keyword) {
  console.log('执行耗时筛选');
  return list.filter(item => item.name.includes(keyword));
}

export default function ProductList({ products }) {
  const [keyword, setKeyword] = useState('');
  const [count, setCount] = useState(0);

  const filteredProducts = useMemo(() => {
    return slowFilter(products, keyword);
  }, [products, keyword]);

  return (
    <div>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      <button onClick={() => setCount(count + 1)}>无关计数：{count}</button>

      <ul>
        {filteredProducts.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

只有 products 或 keyword 变化时，才重新计算 filteredProducts。

## 16.3 useMemo 不要乱用

下面这种简单计算不需要 useMemo：

```jsx
const fullName = firstName + lastName;
```

如果你写成：

```jsx
const fullName = useMemo(() => firstName + lastName, [firstName, lastName]);
```

反而让代码更难读。

useMemo 适合：

- 计算真的比较重；
- 结果要传给 memo 子组件；
- 避免某些依赖对象每次都变。

## 16.4 useCallback 缓存函数

组件每次渲染都会创建新的函数：

```jsx
function App() {
  function handleClick() {
    console.log('点击');
  }

  return <Button onClick={handleClick} />;
}
```

这通常没问题。但如果 Button 使用 React.memo，并且你希望减少不必要渲染，可以用 useCallback：

```jsx
import { useCallback, useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <button onClick={handleClick}>点击：{count}</button>;
}
```

## 16.5 useCallback 等价理解

可以简单理解：

```jsx
const fn = useCallback(() => {
  // 函数内容
}, [a, b]);
```

大致等价于：

```jsx
const fn = useMemo(() => {
  return () => {
    // 函数内容
  };
}, [a, b]);
```

useCallback 缓存的是函数本身，useMemo 缓存的是计算结果。

## 16.6 配合 React.memo 的例子

```jsx
import { memo, useCallback, useState } from 'react';

const Child = memo(function Child({ onAdd }) {
  console.log('Child 渲染');
  return <button onClick={onAdd}>子组件按钮</button>;
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
      <Child onAdd={handleAdd} />
    </div>
  );
}
```

当 text 改变时，handleAdd 的引用不变，Child 更有机会跳过渲染。

注意：这只是性能优化，不是业务正确性的基础。

## 16.7 依赖数组仍然很重要

```jsx
const handleSubmit = useCallback(() => {
  console.log(username);
}, [username]);
```

如果函数里用到了 username，就应该写进依赖数组。

不要为了“函数不变”故意漏依赖。漏依赖会导致函数使用旧值。

## 16.8 什么时候不要用

不要一开始就给所有计算和函数都套 useMemo/useCallback。

不建议：

```jsx
const handleClick = useCallback(() => {
  alert('点击');
}, []);
```

如果没有传给 memo 子组件，也没有性能问题，这样写只是增加复杂度。

## 16.9 常见错误

- 把 useMemo 当作保证业务正确的工具；
- 所有函数都用 useCallback；
- 依赖数组漏写依赖；
- 缓存了很便宜的计算，代码变复杂；
- 以为 useCallback 会阻止函数执行，它只是缓存函数引用。

## 16.10 小结与练习

- useMemo 缓存计算结果；
- useCallback 缓存函数引用；
- 它们都是性能优化工具，不要滥用；
- 依赖数组必须正确；
- 常和 React.memo 配合使用。

练习：

1. 写一个列表，根据关键词筛选，用 useMemo 缓存筛选结果。
2. 写一个父子组件，子组件用 memo，父组件用 useCallback 传函数。
3. 删除不必要的 useMemo/useCallback，让代码更简单。
