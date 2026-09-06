# 11. 列表渲染与 key

## 11.1 本章要解决什么问题

前端项目经常要显示一组数据：

- 商品列表；
- 用户列表；
- 评论列表；
- 任务列表；
- 菜单列表。

React 中通常使用数组的 `map` 方法把数据变成 JSX。

## 11.2 最简单的列表渲染

```jsx
export default function App() {
  const names = ['小明', '小红', '小刚'];

  return (
    <ul>
      {names.map(name => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}
```

理解：

```text
数组中的每一项 → map → 一个 li
```

## 11.3 渲染对象数组

```jsx
const users = [
  { id: 1, name: '小明', age: 18 },
  { id: 2, name: '小红', age: 20 },
];

export default function UserList() {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.age} 岁
        </li>
      ))}
    </ul>
  );
}
```

真实项目中，列表数据通常是对象数组，并且每条数据有 id。

## 11.4 key 是什么

key 是 React 用来识别列表项身份的标记。

当列表新增、删除、排序时，React 需要知道：

```text
哪一项是原来的哪一项？
哪一项是新来的？
哪一项被删除了？
```

所以列表项要写 key：

```jsx
<li key={user.id}>{user.name}</li>
```

## 11.5 key 应该怎么选

优先使用稳定、唯一的 id。

```jsx
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}
```

不要使用随机数：

```jsx
// 错误：每次渲染 key 都变了
<li key={Math.random()}>{user.name}</li>
```

index 只适合非常稳定的列表：

```jsx
{menus.map((menu, index) => (
  <li key={index}>{menu}</li>
))}
```

如果列表不会增删、不会排序、只是固定展示，index 可以接受。任务列表、用户列表、可删除列表不要优先用 index。

## 11.6 列表中的事件

```jsx
import { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: '学习 JSX', done: true },
    { id: 2, text: '学习列表', done: false },
  ]);

  function handleToggle(id) {
    setTodos(todos.map(todo => (
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )));
  }

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => handleToggle(todo.id)}
            />
            {todo.text}
          </label>
        </li>
      ))}
    </ul>
  );
}
```

## 11.7 删除列表项

```jsx
function handleDelete(id) {
  setTodos(todos.filter(todo => todo.id !== id));
}
```

完整使用：

```jsx
{todos.map(todo => (
  <li key={todo.id}>
    {todo.text}
    <button onClick={() => handleDelete(todo.id)}>删除</button>
  </li>
))}
```

不要直接修改原数组：

```jsx
// 不推荐
 todos.splice(index, 1);
 setTodos(todos);
```

要创建新数组。

## 11.8 空列表处理

```jsx
function UserList({ users }) {
  if (users.length === 0) {
    return <p>暂无用户</p>;
  }

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

项目中不要让空白页面吓到用户，要给提示。

## 11.9 嵌套列表

```jsx
const groups = [
  {
    id: 1,
    name: '前端组',
    members: [
      { id: 11, name: '小明' },
      { id: 12, name: '小红' },
    ],
  },
];

export default function GroupList() {
  return (
    <div>
      {groups.map(group => (
        <section key={group.id}>
          <h2>{group.name}</h2>
          <ul>
            {group.members.map(member => (
              <li key={member.id}>{member.name}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

每一层 map 都需要自己的 key。

## 11.10 常见错误

- 忘记写 key；
- key 写成 Math.random；
- 可增删排序的列表用 index 当 key；
- 在 map 中使用 `{}` 后忘记 return；
- 直接修改原数组；
- 没有处理空列表。

## 11.11 小结与练习

- React 用 map 渲染列表；
- 每个列表项需要 key；
- key 要稳定、唯一；
- 更新数组时创建新数组；
- 空列表要给用户提示。

练习：

1. 渲染一个商品列表，显示名称和价格。
2. 给每个商品添加删除按钮。
3. 商品为空时显示“暂无商品”。
