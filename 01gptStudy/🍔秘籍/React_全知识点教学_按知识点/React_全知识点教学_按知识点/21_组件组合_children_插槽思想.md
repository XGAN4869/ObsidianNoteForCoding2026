# 21. 组件组合、children 与插槽思想

## 21.1 本章要解决什么问题

学到现在，你已经会写组件、props、state。接下来要学一个很重要的思想：**不要总想着把所有东西都写死在组件里面，要学会把组件组合起来。**

组件组合能解决：

- 一个组件太死板，只能显示固定内容；
- 父组件想把一段 JSX 放进子组件内部；
- 多个页面有相同外壳，但里面内容不同；
- 想写出像“卡片”“弹窗”“布局”这样的通用组件。

React 中没有 Vue 那种叫 `slot` 的专门语法，但 React 有 `children`，它可以实现类似“插槽”的效果。

---

## 21.2 什么是 children

`children` 是 React 自动传给组件的一个 prop。

当你这样使用组件：

```jsx
<Card>
  <h2>标题</h2>
  <p>内容</p>
</Card>
```

`<Card>` 标签中间的内容：

```jsx
<h2>标题</h2>
<p>内容</p>
```

会变成 `Card` 组件的 `children`。

---

## 21.3 最简单的 children 示例

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

export default function App() {
  return (
    <div>
      <Card>
        <h2>用户信息</h2>
        <p>姓名：小明</p>
      </Card>

      <Card>
        <h2>商品信息</h2>
        <p>商品：笔记本电脑</p>
      </Card>
    </div>
  );
}
```

`Card` 只负责外壳：

- 边框；
- 背景；
- 内边距；
- 阴影。

里面显示什么，由父组件决定。

---

## 21.4 children 的直观理解

你可以把组件想象成一个盒子：

```text
<Card>
  这里放什么都可以
</Card>
```

`Card` 是盒子。  
`children` 是盒子里面的东西。

所以：

```jsx
function Card({ children }) {
  return <div>{children}</div>;
}
```

意思就是：

```text
我做一个 div 盒子，然后把外面传进来的内容放进去。
```

---

## 21.5 为什么不用普通 props

普通 props 适合传普通数据：

```jsx
<UserCard name="小明" age={18} />
```

`children` 适合传 JSX 结构：

```jsx
<Card>
  <h2>复杂标题</h2>
  <button>按钮</button>
</Card>
```

对比：

| 传递内容 | 推荐方式 |
|---|---|
| 字符串、数字、布尔值 | props |
| 函数 | props |
| 一段 JSX 内容 | children |
| 页面区域内容 | children |
| 布局内部区域 | children |

---

## 21.6 写一个通用布局组件

假设很多页面都有相同结构：

```text
顶部 Header
中间页面内容
底部 Footer
```

可以写成：

```jsx
function Layout({ children }) {
  return (
    <div>
      <header>
        <h1>我的系统</h1>
      </header>

      <main>{children}</main>

      <footer>版权所有</footer>
    </div>
  );
}

function HomePage() {
  return <p>这里是首页</p>;
}

function UserPage() {
  return <p>这里是用户页</p>;
}

export default function App() {
  return (
    <Layout>
      <HomePage />
    </Layout>
  );
}
```

以后换页面，只换 `children`：

```jsx
<Layout>
  <UserPage />
</Layout>
```

布局组件不关心中间是什么，它只负责公共外壳。

---

## 21.7 children 可以是字符串

```jsx
function Box({ children }) {
  return <div className="box">{children}</div>;
}

export default function App() {
  return <Box>你好 React</Box>;
}
```

这里的 `children` 是文本内容。

---

## 21.8 children 可以是一个组件

```jsx
function Panel({ children }) {
  return <section className="panel">{children}</section>;
}

function LoginForm() {
  return (
    <form>
      <input placeholder="用户名" />
      <input placeholder="密码" type="password" />
      <button>登录</button>
    </form>
  );
}

export default function App() {
  return (
    <Panel>
      <LoginForm />
    </Panel>
  );
}
```

`Panel` 不需要知道 `LoginForm` 内部怎么写。

---

## 21.9 children 可以是多个元素

```jsx
function Modal({ children }) {
  return (
    <div className="modal-mask">
      <div className="modal-box">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Modal>
      <h2>提示</h2>
      <p>确定要删除吗？</p>
      <button>取消</button>
      <button>确定</button>
    </Modal>
  );
}
```

`children` 可以包含一段完整结构。

---

## 21.10 多个位置怎么办

有时一个组件不只需要一个“插槽”。比如弹窗需要：

- 标题区域；
- 内容区域；
- 底部按钮区域。

React 中常见做法是：**用 props 传 JSX**。

```jsx
function Dialog({ title, children, footer }) {
  return (
    <div className="dialog">
      <div className="dialog-title">{title}</div>
      <div className="dialog-body">{children}</div>
      <div className="dialog-footer">{footer}</div>
    </div>
  );
}

export default function App() {
  return (
    <Dialog
      title={<h2>删除确认</h2>}
      footer={
        <>
          <button>取消</button>
          <button>确定</button>
        </>
      }
    >
      <p>删除后无法恢复。</p>
    </Dialog>
  );
}
```

这里：

- `title` 是标题位置；
- `children` 是主体位置；
- `footer` 是底部位置。

这就是 React 中常见的“具名插槽思想”。

---

## 21.11 组件组合优先于复杂配置

有些人会把组件写成这样：

```jsx
<Card title="标题" content="内容" showButton={true} buttonText="确定" />
```

当需求越来越多，props 会越来越长。

更灵活的写法是：

```jsx
<Card>
  <h2>标题</h2>
  <p>内容</p>
  <button>确定</button>
</Card>
```

这叫组件组合。

通俗说：

```text
不要把一个组件做成万能遥控器。
把小组件像积木一样拼起来。
```

---

## 21.12 传组件本身作为 props

有时可以把一个组件当作 props 传入。

```jsx
function Page({ aside }) {
  return (
    <div className="page">
      <aside>{aside}</aside>
      <main>主要内容</main>
    </div>
  );
}

function Menu() {
  return (
    <ul>
      <li>首页</li>
      <li>用户</li>
    </ul>
  );
}

export default function App() {
  return <Page aside={<Menu />} />;
}
```

这适合“某个区域由外部决定”的情况。

---

## 21.13 render props 思想入门

有时父组件不只是传 JSX，还想传一个函数，让子组件调用这个函数来生成内容。

这种思想常叫 render props。

简单示例：

```jsx
function DataBox({ render }) {
  const user = { name: '小明', age: 18 };

  return <div>{render(user)}</div>;
}

export default function App() {
  return (
    <DataBox
      render={(user) => (
        <p>
          {user.name}，{user.age} 岁
        </p>
      )}
    />
  );
}
```

不要一开始就大量使用 render props。初学先掌握 `children` 和普通组件组合即可。

---

## 21.14 children 与 props 的区别总结

| 内容 | props | children |
|---|---|---|
| 本质 | 父传子数据 | 一种特殊 props |
| 适合 | 传数据、函数、配置 | 传标签中间的 JSX |
| 写法 | `<User name="小明" />` | `<Card>内容</Card>` |
| 常见用途 | 用户名、列表、回调函数 | 卡片、弹窗、布局、页面外壳 |

记住一句话：

```text
props 传“参数”，children 传“夹在组件标签中间的内容”。
```

---

## 21.15 常见错误

### 错误 1：组件里没有写 children

```jsx
function Card() {
  return <div className="card"></div>;
}

<Card>
  <p>这段内容不会显示</p>
</Card>
```

正确：

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
```

### 错误 2：把 children 当成普通字符串

`children` 可能是字符串，也可能是 JSX，也可能是多个元素。不要随便用字符串方法处理它。

### 错误 3：组件组合过度

如果一个组件只用一次，而且拆出来后更难看懂，就可以先不拆。

---

## 21.16 小结与练习

本章重点：

- `children` 是 React 自动传入的特殊 prop；
- 组件标签中间的内容就是 `children`；
- React 用 `children` 实现类似插槽的能力；
- 多个插槽位置可以用 props 传 JSX；
- 组件组合能让代码更灵活。

练习：

1. 写一个 `Card` 组件，用 `children` 显示内容。
2. 写一个 `Layout` 组件，包含 Header、Main、Footer。
3. 写一个 `Dialog` 组件，支持 `title`、`children`、`footer` 三个区域。
4. 把同一个 `Card` 用在用户信息、商品信息、文章信息三个地方。
