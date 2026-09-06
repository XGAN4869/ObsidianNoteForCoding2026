# 4. JSX 语法

## 4.1 本章要解决什么问题

JSX 是 React 中最常见的页面写法。它看起来像 HTML，但它本质上是 JavaScript 的语法扩展。

React 组件通常返回 JSX：

```jsx
function Hello() {
  return <h1>你好，React</h1>;
}
```

你要学会：

- JSX 中怎么写标签；
- JSX 中怎么使用变量；
- JSX 中 class、style 怎么写；
- JSX 中常见错误怎么避免。

## 4.2 JSX 不是字符串

下面不是字符串：

```jsx
const title = <h1>你好</h1>;
```

它会被构建工具转换成 React 能理解的 JavaScript 对象描述。你可以简单理解为：JSX 是“用 JavaScript 描述页面结构”。

## 4.3 组件必须返回一个根

错误写法：

```jsx
function App() {
  return (
    <h1>标题</h1>
    <p>内容</p>
  );
}
```

正确写法一：包一层 div。

```jsx
function App() {
  return (
    <div>
      <h1>标题</h1>
      <p>内容</p>
    </div>
  );
}
```

正确写法二：使用 Fragment，不额外生成 DOM。

```jsx
function App() {
  return (
    <>
      <h1>标题</h1>
      <p>内容</p>
    </>
  );
}
```

## 4.4 使用花括号插入 JavaScript 表达式

```jsx
function UserCard() {
  const name = '小明';
  const age = 18;

  return (
    <div>
      <h2>{name}</h2>
      <p>年龄：{age}</p>
      <p>明年：{age + 1}</p>
    </div>
  );
}
```

花括号中可以写表达式，例如变量、计算、函数调用。

不能直接写 if 语句，因为 if 是语句，不是表达式。条件渲染会在后面专门讲。

## 4.5 属性写法

HTML 中写 class，JSX 中写 className：

```jsx
<h1 className="title">标题</h1>
```

HTML label 的 for，JSX 中写 htmlFor：

```jsx
<label htmlFor="username">用户名</label>
<input id="username" />
```

动态属性用花括号：

```jsx
const imageUrl = '/avatar.png';

return <img src={imageUrl} alt="头像" />;
```

## 4.6 style 写法

JSX 中 style 不是字符串，而是对象。

```jsx
function App() {
  const color = 'tomato';

  return (
    <h1 style={{ color: color, fontSize: 32 }}>
      红色标题
    </h1>
  );
}
```

注意：CSS 中 font-size，在 JSX style 对象中写 fontSize。

## 4.7 注释写法

JSX 标签里面的注释：

```jsx
function App() {
  return (
    <div>
      {/* 这是 JSX 注释 */}
      <h1>标题</h1>
    </div>
  );
}
```

JS 代码区域仍然用普通注释：

```js
// 这是普通 JS 注释
const name = '小明';
```

## 4.8 标签必须闭合

HTML 中有些标签可以不写结束标签，但 JSX 中必须闭合。

```jsx
<input />
<img src="/logo.png" alt="logo" />
<br />
```

## 4.9 组件名必须大写开头

小写开头会被 React 当作普通 HTML 标签。

```jsx
function UserCard() {
  return <div>用户卡片</div>;
}

export default function App() {
  return <UserCard />;
}
```

错误示例：

```jsx
function userCard() {
  return <div>用户卡片</div>;
}
```

## 4.10 常见错误

- 写 class 而不是 className；
- 写 for 而不是 htmlFor；
- return 后换行导致返回 undefined；
- 多个同级标签没有根节点；
- img、input 没有闭合；
- 把对象直接放到 JSX 中显示。

## 4.11 小结与练习

- JSX 看起来像 HTML，但属于 JavaScript；
- 表达式用花括号；
- class 写 className；
- style 写对象；
- 组件名大写开头；
- 返回多个标签时用 div 或 Fragment 包起来。

练习：

1. 写一个 UserCard，显示姓名、年龄、头像。
2. 给标题添加 className。
3. 使用 style 把年龄改成蓝色。
