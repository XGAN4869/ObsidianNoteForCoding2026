# 14. useEffect：副作用与清理

## 14.1 本章要解决什么问题

React 组件主要负责根据数据返回 JSX。但有些事情不是单纯计算页面，它们叫副作用。

常见副作用：

- 请求后端数据；
- 设置定时器；
- 监听 window 事件；
- 修改 document.title；
- 连接 WebSocket；
- 调用非 React 的第三方库。

useEffect 用来让组件和外部系统同步。

## 14.2 最简单的 useEffect

```jsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('组件渲染后执行');
  });

  return <h1>useEffect 示例</h1>;
}
```

没有依赖数组时，每次渲染后都会执行。

## 14.3 只在挂载后执行一次

```jsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('组件第一次显示后执行');
  }, []);

  return <h1>只执行一次</h1>;
}
```

空数组表示：这个 effect 不依赖组件中的响应式值，所以挂载后执行。

注意：开发环境 StrictMode 下，为了检查清理逻辑，effect 可能会经历额外的 setup + cleanup。不要把它误认为生产环境一定执行两次。

## 14.4 依赖变化时执行

```jsx
import { useEffect, useState } from 'react';

export default function SearchTitle() {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    document.title = keyword ? `搜索：${keyword}` : '首页';
  }, [keyword]);

  return (
    <input
      value={keyword}
      onChange={event => setKeyword(event.target.value)}
      placeholder="输入关键词"
    />
  );
}
```

依赖数组 `[keyword]` 表示：keyword 变化后重新执行 effect。

## 14.5 清理函数

如果 effect 设置了外部资源，通常要清理。

定时器示例：

```jsx
import { useEffect, useState } from 'react';

export default function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  return <p>运行秒数：{seconds}</p>;
}
```

return 出来的函数就是清理函数。组件卸载时会执行，依赖变化重新执行前也会先清理上一次。

## 14.6 监听事件要清理

```jsx
import { useEffect, useState } from 'react';

export default function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <p>窗口宽度：{width}</p>;
}
```

只添加不移除，会造成重复监听或内存浪费。

## 14.7 请求数据

```jsx
import { useEffect, useState } from 'react';

export default function UserInfo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>请求失败：{error.message}</p>;
  if (!user) return <p>暂无用户</p>;

  return <p>用户名：{user.name}</p>;
}
```

真实请求还要考虑取消请求，后面网络请求章节会更完整。

## 14.8 不要滥用 useEffect

不是所有代码都要放进 useEffect。

如果一个值可以在渲染时直接计算，不需要 effect：

```jsx
function Price({ count, price }) {
  const total = count * price;
  return <p>总价：{total}</p>;
}
```

不要写成：

```jsx
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(count * price);
}, [count, price]);
```

能从现有 props/state 直接算出来的值，通常直接计算。

## 14.9 依赖数组不要乱写

如果 effect 用到了组件里的变量、props、state、函数，通常应该出现在依赖数组里。

```jsx
useEffect(() => {
  document.title = title;
}, [title]);
```

不要为了“不想重新执行”就故意漏依赖。漏依赖可能导致 effect 使用旧值，产生难查的 bug。

## 14.10 常见错误

- 把能直接计算的值放进 effect；
- 依赖数组漏写依赖；
- 设置定时器或事件监听后不清理；
- 在 effect 中无限 setState 导致死循环；
- 把 StrictMode 开发检查误认为生产 bug；
- 直接把 useEffect 回调写成 async 函数。

说明：useEffect 的回调本身不要写成 `async () => {}`，因为 async 函数返回 Promise，而 effect 需要返回清理函数或 undefined。可以在里面定义 async 函数再调用。

## 14.11 小结与练习

- useEffect 用于同步外部系统；
- 依赖数组决定何时重新执行；
- 定时器、监听、连接等要清理；
- 不要把所有逻辑都塞进 useEffect；
- 开发环境 StrictMode 可能额外检查 effect。

练习：

1. 用 useEffect 修改 document.title。
2. 写一个计时器，每秒加 1，并在卸载时清理。
3. 写一个组件，请求用户数据并显示 loading/error/data。
