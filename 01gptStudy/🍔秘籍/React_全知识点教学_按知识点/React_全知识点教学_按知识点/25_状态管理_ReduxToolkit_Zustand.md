# 25. 状态管理：Redux Toolkit 与 Zustand

## 25.1 本章要解决什么问题

React 自带的状态能力已经很强：

- `useState` 管组件自己的状态；
- props 父传子；
- Context 跨层传递；
- `useReducer` 管复杂一点的局部状态。

但是项目变大后，会出现问题：

```text
很多页面都要用同一份数据
多个组件都要修改同一份数据
props 一层层传很麻烦
登录用户、权限、购物车、主题等状态到处都要用
```

这时可以考虑状态管理库。

本章讲两个常见选择：

- Redux Toolkit：官方推荐的现代 Redux 写法，适合中大型项目和团队协作；
- Zustand：轻量状态库，写法简单，适合中小项目或局部全局状态。

---

## 25.2 不要一开始就上状态管理库

初学者先记住这个顺序：

```text
组件内部状态 → useState
父子通信 → props
跨几层传数据 → Context
复杂局部逻辑 → useReducer
很多页面共享且频繁修改 → 状态管理库
```

如果只是一个按钮计数器，不需要 Redux。

---

## 25.3 什么状态适合放全局

适合放全局：

- 当前登录用户；
- token 或登录状态；
- 主题模式；
- 语言设置；
- 购物车；
- 多页面共享的筛选条件；
- 多组件都要读写的业务数据。

不适合放全局：

- 输入框临时内容；
- 弹窗是否打开；
- 某个小组件自己的 hover 状态；
- 只在一个组件用的数据。

记住：

```text
状态离谁最近，就先放谁那里。
真的多人共用，再提升或放全局。
```

---

# Redux Toolkit

## 25.4 安装 Redux Toolkit

安装：

```bash
npm i @reduxjs/toolkit react-redux
```

两个包的作用：

| 包 | 作用 |
|---|---|
| `@reduxjs/toolkit` | 创建 store、slice、reducer、action |
| `react-redux` | 让 React 组件连接 Redux store |

---

## 25.5 Redux Toolkit 的核心概念

先记住四个词：

| 概念 | 简单理解 |
|---|---|
| store | 全局状态仓库 |
| slice | 某一块状态和修改方法 |
| reducer | 根据 action 修改状态的函数 |
| dispatch | 发出一个修改动作 |

通俗流程：

```text
组件点击按钮
↓
dispatch 一个 action
↓
slice 里的 reducer 修改状态
↓
store 更新
↓
组件重新渲染
```

---

## 25.6 创建 Redux store

推荐结构：

```text
src/
  store/
    index.js
    counterSlice.js
```

`src/store/counterSlice.js`：

```jsx
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    addBy(state, action) {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, addBy } = counterSlice.actions;
export default counterSlice.reducer;
```

注意：这里看起来像直接修改 `state.value`。

Redux Toolkit 内部使用 Immer 帮你处理不可变更新，所以这种写法是安全的。不要在普通 React state 中随便这样改。

---

## 25.7 配置 store

`src/store/index.js`：

```jsx
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice.js';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
```

解释：

```text
counter 这一块状态，由 counterReducer 管。
```

---

## 25.8 用 Provider 包住 App

main.jsx：

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import { store } from './store/index.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
```

`Provider` 的作用：

```text
把 store 提供给整个 React 应用。
```

没有 `Provider`，组件里就不能正常使用 Redux store。

---

## 25.9 在组件中读取和修改 Redux 状态

App.jsx：

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { addBy, decrement, increment } from './store/counterSlice.js';

export default function App() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>计数：{count}</h1>
      <button onClick={() => dispatch(decrement())}>-1</button>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(addBy(5))}>+5</button>
    </div>
  );
}
```

解释：

- `useSelector`：从 store 中读取状态；
- `useDispatch`：拿到 dispatch 函数；
- `dispatch(increment())`：发出一个修改动作。

---

## 25.10 Redux Toolkit 写 Todo 示例

`src/store/todoSlice.js`：

```jsx
import { createSlice } from '@reduxjs/toolkit';

const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    list: [],
  },
  reducers: {
    addTodo(state, action) {
      state.list.push({
        id: Date.now(),
        text: action.payload,
        done: false,
      });
    },
    toggleTodo(state, action) {
      const todo = state.list.find((item) => item.id === action.payload);
      if (todo) {
        todo.done = !todo.done;
      }
    },
    removeTodo(state, action) {
      state.list = state.list.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addTodo, toggleTodo, removeTodo } = todoSlice.actions;
export default todoSlice.reducer;
```

store/index.js：

```jsx
import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './todoSlice.js';

export const store = configureStore({
  reducer: {
    todos: todoReducer,
  },
});
```

App.jsx：

```jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTodo, removeTodo, toggleTodo } from './store/todoSlice.js';

export default function App() {
  const [text, setText] = useState('');
  const todos = useSelector((state) => state.todos.list);
  const dispatch = useDispatch();

  function handleSubmit(e) {
    e.preventDefault();

    const value = text.trim();
    if (!value) return;

    dispatch(addTodo(value));
    setText('');
  }

  return (
    <div>
      <h1>任务列表</h1>

      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>添加</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => dispatch(toggleTodo(todo.id))}
              />
              <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
                {todo.text}
              </span>
            </label>
            <button onClick={() => dispatch(removeTodo(todo.id))}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 25.11 Redux Toolkit 适合什么场景

适合：

- 中大型项目；
- 团队多人协作；
- 状态修改流程需要统一；
- 需要 Redux DevTools 调试；
- 状态变化复杂；
- 业务需要清晰的 action 记录。

不适合：

- 很小的练习项目；
- 只有一两个组件共享状态；
- 只是为了“看起来专业”。

---

# Zustand

## 25.12 Zustand 是什么

Zustand 是一个轻量状态管理库。

特点：

- API 少；
- 学起来快；
- store 本身就是一个 Hook；
- 小项目使用很方便。

安装：

```bash
npm i zustand
```

---

## 25.13 创建 Zustand store

`src/store/useCounterStore.js`：

```jsx
import { create } from 'zustand';

export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  addBy: (num) => set((state) => ({ count: state.count + num })),
}));
```

使用：

```jsx
import { useCounterStore } from './store/useCounterStore.js';

export default function App() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    <div>
      <h1>计数：{count}</h1>
      <button onClick={decrement}>-1</button>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

这里不需要 `Provider`。

---

## 25.14 Zustand Todo 示例

`src/store/useTodoStore.js`：

```jsx
import { create } from 'zustand';

export const useTodoStore = create((set) => ({
  todos: [],

  addTodo: (text) =>
    set((state) => ({
      todos: [
        ...state.todos,
        { id: Date.now(), text, done: false },
      ],
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      ),
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    })),
}));
```

App.jsx：

```jsx
import { useState } from 'react';
import { useTodoStore } from './store/useTodoStore.js';

export default function App() {
  const [text, setText] = useState('');
  const todos = useTodoStore((state) => state.todos);
  const addTodo = useTodoStore((state) => state.addTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const removeTodo = useTodoStore((state) => state.removeTodo);

  function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    addTodo(value);
    setText('');
  }

  return (
    <div>
      <h1>Zustand 任务列表</h1>

      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>添加</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              {todo.text}
            </label>
            <button onClick={() => removeTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 25.15 Redux Toolkit 与 Zustand 怎么选

| 对比 | Redux Toolkit | Zustand |
|---|---|---|
| 学习成本 | 稍高 | 较低 |
| 代码量 | 较多 | 较少 |
| 团队规范 | 很强 | 自由 |
| DevTools/中间件生态 | 很成熟 | 也支持但更轻量 |
| 适合项目 | 中大型、复杂业务 | 中小型、轻量需求 |
| 推荐初学路线 | 需要认真学 | 可以快速上手 |

简单建议：

```text
公司项目要求 Redux → 学 Redux Toolkit。
自己做小项目 → Zustand 很方便。
状态非常少 → 先别用状态库。
```

---

## 25.16 常见错误

### 错误 1：所有状态都放 Redux

输入框内容、弹窗开关等局部状态，通常不需要放全局。

### 错误 2：Redux 忘记 Provider

使用 `useSelector` 之前，必须在入口用 `Provider` 包住 App。

### 错误 3：selector 返回太大的对象

不推荐：

```jsx
const state = useSelector((state) => state);
```

推荐只取需要的值：

```jsx
const count = useSelector((state) => state.counter.value);
```

### 错误 4：Zustand 一次取太多状态

能拆开取就拆开取，减少无关渲染。

---

## 25.17 小结与练习

本章重点：

- 状态管理库不是一开始就必须用；
- Redux Toolkit 是现代 Redux 推荐写法；
- `configureStore` 创建 store；
- `createSlice` 创建状态片段；
- `Provider` 把 store 给 React；
- `useSelector` 读状态；
- `useDispatch` 发 action；
- Zustand 更轻量，store 本身就是 Hook。

练习：

1. 用 Redux Toolkit 写一个计数器。
2. 用 Redux Toolkit 写一个任务列表。
3. 用 Zustand 写同样的任务列表。
4. 思考：登录用户信息适合放哪里？输入框内容适合放哪里？
