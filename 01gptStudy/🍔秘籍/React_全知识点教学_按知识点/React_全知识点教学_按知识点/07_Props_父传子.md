# 7. Props：父组件向子组件传数据

## 7.1 本章要解决什么问题

组件如果只能显示固定内容，就很难复用。

props 解决的问题是：父组件把数据传给子组件，让同一个子组件显示不同内容。

例如同一个 UserCard 可以显示不同用户：

```jsx
<UserCard name="小明" age={18} />
<UserCard name="小红" age={20} />
```

## 7.2 最简单的 props

```jsx
function UserCard(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>年龄：{props.age}</p>
    </div>
  );
}

export default function App() {
  return <UserCard name="小明" age={18} />;
}
```

props 是一个对象。父组件写的属性，会出现在 props 对象中。

## 7.3 解构 props

更常见的写法是解构：

```jsx
function UserCard({ name, age }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>年龄：{age}</p>
    </div>
  );
}
```

这和下面的 JavaScript 是同一个思路：

```js
const user = { name: '小明', age: 18 };
const { name, age } = user;
```

## 7.4 传字符串、数字、布尔值、对象

```jsx
function ProductCard({ title, price, isHot, info }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>价格：{price}</p>
      {isHot && <strong>热门商品</strong>}
      <p>分类：{info.category}</p>
    </div>
  );
}

export default function App() {
  const product = { category: '电子产品' };

  return (
    <ProductCard
      title="键盘"
      price={199}
      isHot={true}
      info={product}
    />
  );
}
```

字符串可以直接写引号，其他 JavaScript 值用花括号。

## 7.5 默认值

如果父组件没传，可以给默认值：

```jsx
function Avatar({ size = 80, src = '/default-avatar.png' }) {
  return <img width={size} height={size} src={src} alt="头像" />;
}
```

使用：

```jsx
<Avatar />
<Avatar size={120} src="/me.png" />
```

## 7.6 props 是只读的

子组件不能直接修改 props。

错误写法：

```jsx
function UserCard({ user }) {
  user.name = '新名字';
  return <h2>{user.name}</h2>;
}
```

正确思路：

- 子组件只负责显示 props；
- 如果要修改数据，让父组件传一个函数下来；
- 子组件调用函数通知父组件。

## 7.7 子组件通知父组件

React 没有 Vue 的 emit。React 常用“父传回调函数”。

```jsx
function DeleteButton({ id, onDelete }) {
  return <button onClick={() => onDelete(id)}>删除</button>;
}

export default function App() {
  function handleDelete(id) {
    alert('要删除的 id：' + id);
  }

  return <DeleteButton id={1} onDelete={handleDelete} />;
}
```

命名习惯：

- 传入子组件的回调常叫 onDelete、onChange、onSubmit；
- 父组件内部处理函数常叫 handleDelete、handleChange、handleSubmit。

## 7.8 展开传 props

```jsx
const user = { name: '小明', age: 18 };

<UserCard {...user} />
```

等价于：

```jsx
<UserCard name={user.name} age={user.age} />
```

注意：不要滥用展开。初学时显式写出来更清楚。

## 7.9 常见错误

- 在子组件里修改 props；
- 传数字时写成字符串，例如 age="18"；
- 回调函数写成 onDelete={handleDelete()}，导致立即执行；
- props 名字在父子组件中不一致；
- 传对象后在子组件直接改对象内部属性。

## 7.10 小结与练习

- props 用于父传子；
- props 是只读的；
- 非字符串值用花括号；
- 子传父通常靠父组件传回调函数；
- onXxx 和 handleXxx 是常见命名习惯。

练习：

1. 写 ProductCard，接收 title、price、stock。
2. 写一个 UserCard 列表，用不同 props 显示三个人。
3. 给 UserCard 传 onSelect，点击后父组件弹出用户名字。
