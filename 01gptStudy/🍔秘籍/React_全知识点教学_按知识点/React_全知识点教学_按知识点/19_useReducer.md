# 19. useReducer

## 19.1 本章要解决什么问题

当 state 很复杂、更新规则很多时，useState 可能会开始显得乱。

例如：

- 表单字段很多；
- 一个页面里有多个相关状态；
- 更新逻辑要根据不同动作来分支处理；
- 你想把“怎么更新状态”集中到一个地方。

useReducer 就是为这种场景准备的。

## 19.2 useReducer 的基本形式

```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

export default function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加 1</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减 1</button>
    </div>
  );
}
```

useReducer 返回两个值：

- 当前 state；
- dispatch 函数。

## 19.3 reducer 是什么

reducer 就是一个纯函数：

```text
当前 state + action → 新 state
```

它不应该直接修改原 state，而应该返回新 state。

## 19.4 action 是什么

action 是一个普通对象，用来描述“发生了什么事”。

```jsx
{ type: 'increment' }
{ type: 'setName', payload: '小明' }
```

一般来说：

- type 表示动作类型；
- payload 表示这次动作携带的数据。

## 19.5 更完整的例子

```jsx
import { useReducer } from 'react';

const initialState = {
  todos: [],
  input: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'change_input':
      return { ...state, input: action.payload };
    case 'add_todo':
      return {
        ...state,
        todos: [...state.todos, { id: Date.now(), text: state.input }],
        input: '',
      };
    case 'delete_todo':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    default:
      return state;
  }
}

export default function TodoApp() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <input
        value={state.input}
        onChange={e => dispatch({ type: 'change_input', payload: e.target.value })}
      />
      <button onClick={() => dispatch({ type: 'add_todo' })}>添加</button>

      <ul>
        {state.todos.map(todo => (
          <li key={todo.id}>
            {todo.text}
            <button onClick={() => dispatch({ type: 'delete_todo', payload: todo.id })}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 19.6 useReducer 和 useState 的关系

很多时候，useState 也能做同样的事。

useReducer 更适合：

- 状态之间关系复杂；
- 操作类型很多；
- 你想把更新规则集中管理；
- 你喜欢明确的“动作 → 更新”结构。

如果只是一个简单计数器，useState 更简单。

## 19.7 reducer 要保持纯

不要在 reducer 里做这些事情：

- 请求接口；
- 读写 DOM；
- 直接修改外部变量；
- 调用随机副作用函数。

reducer 只负责根据输入计算新状态。

## 19.8 懒初始化

如果初始状态计算很重，可以传第三个参数：

```jsx
function init(initialArg) {
  return { count: initialArg };
}

const [state, dispatch] = useReducer(reducer, 10, init);
```

普通学习阶段先知道有这个能力即可。

## 19.9 常见错误

- 直接修改 state；
- reducer 里写副作用；
- action type 拼错；
- dispatch 的 action 没有 payload 却在 reducer 里读取；
- 状态很简单却硬用 useReducer。

## 19.10 小结与练习

- useReducer 适合复杂状态；
- reducer 是纯函数；
- dispatch 用来派发 action；
- action 通常有 type 和 payload；
- 简单场景用 useState 就够了。

练习：

1. 用 useReducer 写一个计数器。
2. 用 useReducer 写一个待办事项列表。
3. 把一个复杂 useState 表单改成 useReducer。
