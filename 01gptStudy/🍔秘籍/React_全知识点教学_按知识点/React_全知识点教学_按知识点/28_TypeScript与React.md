# 28. TypeScript 与 React

## 28.1 本章要解决什么问题

JavaScript 很灵活，但也容易写错。

比如：

```jsx
<UserCard age="18" />
```

你本来想传数字 `18`，却传成字符串 `'18'`。JavaScript 不一定马上提醒你。

TypeScript 可以在写代码时提前提醒：

```text
这里应该传 number，你传了 string。
```

React + TypeScript 的目标不是让代码变复杂，而是：

- 减少低级错误；
- 让 props 更清楚；
- 让事件类型更明确；
- 让 ref、state、reducer 更安全；
- 让项目变大后更容易维护。

---

## 28.2 创建 React + TypeScript 项目

使用 Vite：

```bash
npm create vite@latest my-react-ts-app
```

选择：

```text
React
TypeScript
```

进入项目：

```bash
cd my-react-ts-app
npm install
npm run dev
```

TypeScript 版 React 文件通常是：

```text
.ts   普通 TypeScript 文件
.tsx  写 JSX 的 TypeScript 文件
```

组件文件一般用 `.tsx`。

---

## 28.3 最简单的 TSX 组件

```tsx
export default function App() {
  return <h1>你好 React + TypeScript</h1>;
}
```

如果文件中写 JSX，就用 `.tsx` 后缀。

---

## 28.4 给 props 添加类型

JavaScript 写法：

```jsx
function UserCard({ name, age }) {
  return <p>{name}：{age}</p>;
}
```

TypeScript 写法：

```tsx
type UserCardProps = {
  name: string;
  age: number;
};

function UserCard({ name, age }: UserCardProps) {
  return <p>{name}：{age}</p>;
}

export default function App() {
  return <UserCard name="小明" age={18} />;
}
```

解释：

- `name: string`：name 必须是字符串；
- `age: number`：age 必须是数字；
- 如果写 `age="18"`，TypeScript 会提醒错误。

---

## 28.5 可选 props

有些 props 可以不传，用 `?`。

```tsx
type ButtonProps = {
  text: string;
  disabled?: boolean;
};

function MyButton({ text, disabled = false }: ButtonProps) {
  return <button disabled={disabled}>{text}</button>;
}
```

`disabled?: boolean` 表示：

```text
disabled 可以传，也可以不传。
如果传，必须是 boolean。
```

---

## 28.6 children 类型

如果组件接收 `children`，可以使用 `ReactNode`。

```tsx
import type { ReactNode } from 'react';

type CardProps = {
  title: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Card title="提示">
      <p>这里是内容</p>
    </Card>
  );
}
```

`ReactNode` 可以表示 React 能渲染的内容，比如字符串、数字、JSX、数组等。

---

## 28.7 useState 类型推断

很多时候，TypeScript 可以自动推断类型。

```tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

这里 `count` 会被推断为 `number`。

所以不能写：

```tsx
setCount('abc');
```

---

## 28.8 useState 显式指定类型

如果初始值是空数组，建议指定类型。

```tsx
type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  function addTodo() {
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: '学习 React', done: false },
    ]);
  }

  return <button onClick={addTodo}>添加</button>;
}
```

`useState<Todo[]>([])` 表示：

```text
todos 是 Todo 对象数组。
```

---

## 28.9 可能为空的 state

请求数据时，初始值可能是 `null`。

```tsx
type User = {
  id: number;
  name: string;
};

const [user, setUser] = useState<User | null>(null);
```

`User | null` 表示：

```text
user 要么是 User 对象，要么是 null。
```

使用时要判断：

```tsx
if (!user) {
  return <p>暂无用户</p>;
}

return <p>{user.name}</p>;
```

不要直接写：

```tsx
return <p>{user.name}</p>;
```

因为 `user` 可能是 `null`。

---

## 28.10 事件类型：input onChange

React 输入事件常用 `ChangeEvent`。

```tsx
import type { ChangeEvent } from 'react';
import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
  }

  return <input value={text} onChange={handleChange} />;
}
```

解释：

- `ChangeEvent`：变化事件；
- `HTMLInputElement`：事件来自 input 元素；
- 这样 `e.target.value` 就能被正确识别。

---

## 28.11 事件类型：form onSubmit

表单提交常用 `FormEvent`。

```tsx
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function LoginForm() {
  const [username, setUsername] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log(username);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <button>登录</button>
    </form>
  );
}
```

---

## 28.12 事件类型：button onClick

```tsx
import type { MouseEvent } from 'react';

function MyButton() {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    console.log(e.currentTarget.textContent);
  }

  return <button onClick={handleClick}>点击</button>;
}
```

实际项目中，简单点击事件也可以不手写类型，让 TypeScript 自动推断。

---

## 28.13 useRef 操作 DOM 的类型

```tsx
import { useRef } from 'react';

export default function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>聚焦</button>
    </div>
  );
}
```

解释：

- `HTMLInputElement`：这是 input DOM 元素；
- `null`：组件刚开始渲染时 ref 可能还没有值；
- `?.`：如果 current 不为空，就调用 focus。

---

## 28.14 useRef 保存可变值

```tsx
import { useRef } from 'react';

export default function Timer() {
  const timerRef = useRef<number | null>(null);

  function start() {
    timerRef.current = window.setInterval(() => {
      console.log('运行中');
    }, 1000);
  }

  function stop() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

浏览器环境中，`window.setInterval` 返回 number。

---

## 28.15 给函数 props 添加类型

子组件经常接收回调函数。

```tsx
type TodoItemProps = {
  id: number;
  text: string;
  done: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

function TodoItem({ id, text, done, onToggle, onDelete }: TodoItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(id)}
        />
        {text}
      </label>
      <button onClick={() => onDelete(id)}>删除</button>
    </li>
  );
}
```

`(id: number) => void` 表示：

```text
这个函数接收一个 number 参数，不返回有用结果。
```

---

## 28.16 useReducer 类型

复杂状态可以用 reducer，并给 action 写联合类型。

```tsx
import { useReducer } from 'react';

type State = {
  count: number;
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'add'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'add':
      return { count: state.count + action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+1</button>
      <button onClick={() => dispatch({ type: 'add', payload: 5 })}>+5</button>
    </div>
  );
}
```

好处：如果你写错 action：

```tsx
dispatch({ type: 'add' });
```

TypeScript 会提醒：缺少 `payload`。

---

## 28.17 CSS style 类型

如果要把 style 对象单独提出来，可以用 `CSSProperties`。

```tsx
import type { CSSProperties } from 'react';

const boxStyle: CSSProperties = {
  color: 'red',
  fontSize: 20,
  backgroundColor: '#f5f5f5',
};

export default function App() {
  return <div style={boxStyle}>内容</div>;
}
```

---

## 28.18 API 数据类型

请求后端时，最好给返回数据定义类型。

```tsx
type User = {
  id: number;
  name: string;
  email: string;
};

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');

  if (!response.ok) {
    throw new Error('请求失败');
  }

  return await response.json();
}
```

注意：TypeScript 类型不会自动验证后端真实返回值。  
如果后端返回错了，运行时仍可能出问题。大型项目可以使用 Zod 等运行时校验库，但初学先知道这个限制即可。

---

## 28.19 React.FC 要不要用

你可能看到这种写法：

```tsx
const UserCard: React.FC<UserCardProps> = ({ name, age }) => {
  return <p>{name}：{age}</p>;
};
```

这种写法不是不能用，但初学推荐更简单的函数写法：

```tsx
function UserCard({ name, age }: UserCardProps) {
  return <p>{name}：{age}</p>;
}
```

原因：函数声明更直观，也不需要额外解释 `React.FC` 的细节。

---

## 28.20 常见错误

- `.ts` 文件里写 JSX，应该改成 `.tsx`；
- props 没写类型，变成隐式 `any`；
- 空数组 `useState([])` 没指定类型，后面推断不清楚；
- 可能为 `null` 的数据没有判断就访问；
- ref 忘记写 `null`；
- 事件类型写错元素，比如 input 写成 button；
- 以为 TypeScript 会检查后端真实数据，实际上它主要是静态检查。

---

## 28.21 小结与练习

本章重点：

- React + TypeScript 组件文件用 `.tsx`；
- props 要写类型；
- 可选 props 用 `?`；
- `children` 常用 `ReactNode`；
- `useState` 能推断类型，但空数组和 null 常要手写类型；
- 事件可以用 `ChangeEvent`、`FormEvent`、`MouseEvent`；
- DOM ref 常写 `useRef<HTMLInputElement | null>(null)`；
- API 返回值要定义类型，但不要误以为它能自动校验真实后端数据。

练习：

1. 把一个普通 React 计数器改成 TypeScript。
2. 给 `UserCard` 写 props 类型。
3. 写一个 `Todo` 类型，并用 `useState<Todo[]>([])` 保存任务列表。
4. 给 input 的 `onChange` 写事件类型。
5. 用 `useRef<HTMLInputElement | null>(null)` 实现点击按钮聚焦输入框。
