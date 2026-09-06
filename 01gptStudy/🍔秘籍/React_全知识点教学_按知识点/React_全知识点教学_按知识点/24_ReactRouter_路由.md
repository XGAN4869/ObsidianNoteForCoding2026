# 24. React Router：路由

## 24.1 本章要解决什么问题

单页应用中，页面切换通常不是整页刷新，而是：

```text
地址栏变化
↓
React 根据路径显示不同组件
```

路由能解决：

- `/` 显示首页；
- `/users` 显示用户列表；
- `/users/1` 显示用户详情；
- 点击链接切换页面；
- 登录后才能访问某些页面；
- 找不到路径时显示 404。

React 常用路由库是 React Router。

---

## 24.2 安装 React Router

当前 React Router 官方文档中，声明式路由模式常从 `react-router` 导入。

安装：

```bash
npm i react-router
```

如果你看旧教程，可能会看到：

```bash
npm i react-router-dom
```

这是旧版本项目里很常见的写法。学习时一定看清项目版本。本文按当前官方文档的声明式模式讲解。

---

## 24.3 最小路由示例

main.jsx：

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

App.jsx：

```jsx
import { Routes, Route, Link } from 'react-router';

function HomePage() {
  return <h1>首页</h1>;
}

function AboutPage() {
  return <h1>关于我们</h1>;
}

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}
```

解释：

- `BrowserRouter`：启用浏览器路由；
- `Link`：页面内跳转链接；
- `Routes`：路由规则容器；
- `Route`：一条路径对应一个组件；
- `element`：路径命中后显示的 JSX。

---

## 24.4 Link 与普通 a 标签的区别

普通写法：

```html
<a href="/about">关于</a>
```

在单页应用中，它可能导致整页刷新。

React Router 推荐：

```jsx
<Link to="/about">关于</Link>
```

`Link` 会更新地址栏，并让 React 显示新组件，通常不会整页刷新。

---

## 24.5 NavLink 高亮当前菜单

`NavLink` 可以知道当前链接是否激活。

```jsx
import { NavLink } from 'react-router';

function Menu() {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        首页
      </NavLink>

      <NavLink
        to="/users"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        用户
      </NavLink>
    </nav>
  );
}
```

CSS：

```css
.active {
  color: red;
  font-weight: bold;
}
```

---

## 24.6 动态路由参数 useParams

路径中有变化的部分，叫动态参数。

路由规则：

```jsx
<Route path="/users/:id" element={<UserDetailPage />} />
```

访问：

```text
/users/100
```

组件中获取 `id`：

```jsx
import { useParams } from 'react-router';

function UserDetailPage() {
  const params = useParams();

  return <h1>用户 ID：{params.id}</h1>;
}
```

也可以解构：

```jsx
const { id } = useParams();
```

注意：从 URL 取到的参数通常是字符串。

---

## 24.7 查询参数 useSearchParams

查询参数长这样：

```text
/search?keyword=react&page=1
```

读取：

```jsx
import { useSearchParams } from 'react-router';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';

  function search() {
    setSearchParams({ keyword: 'vue', page: '1' });
  }

  return (
    <div>
      <p>关键词：{keyword}</p>
      <p>页码：{page}</p>
      <button onClick={search}>搜索 vue</button>
    </div>
  );
}
```

查询参数适合保存：

- 搜索关键词；
- 页码；
- 筛选条件；
- 排序方式。

---

## 24.8 useLocation 获取当前地址信息

```jsx
import { useLocation } from 'react-router';

function CurrentPath() {
  const location = useLocation();

  return (
    <div>
      <p>当前路径：{location.pathname}</p>
      <p>查询字符串：{location.search}</p>
    </div>
  );
}
```

常见用途：

- 根据当前路径控制菜单；
- 页面切换后发送统计；
- 调试路由信息。

---

## 24.9 useNavigate 编程式跳转

点击 `Link` 是声明式跳转。  
在函数里跳转叫编程式跳转。

```jsx
import { useNavigate } from 'react-router';

function LoginPage() {
  const navigate = useNavigate();

  function handleLogin() {
    // 假设登录成功
    navigate('/dashboard');
  }

  return <button onClick={handleLogin}>登录</button>;
}
```

替换当前历史记录：

```jsx
navigate('/login', { replace: true });
```

后退：

```jsx
navigate(-1);
```

---

## 24.10 404 页面

用 `*` 匹配没有命中的路径。

```jsx
function NotFoundPage() {
  return <h1>404：页面不存在</h1>;
}

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/users" element={<UsersPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

`*` 一般放在最后。

---

## 24.11 嵌套路由与 Outlet

后台系统常有共同布局：

```text
/dashboard
/dashboard/profile
/dashboard/settings
```

父页面有菜单，子页面显示在中间区域。

```jsx
import { Routes, Route, Link, Outlet } from 'react-router';

function DashboardLayout() {
  return (
    <div>
      <h1>后台</h1>
      <nav>
        <Link to="profile">个人资料</Link>
        <Link to="settings">设置</Link>
      </nav>

      <Outlet />
    </div>
  );
}

function ProfilePage() {
  return <p>个人资料页</p>;
}

function SettingsPage() {
  return <p>设置页</p>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
```

`Outlet` 表示：

```text
子路由组件显示在这里。
```

子路由路径一般写相对路径：

```jsx
<Route path="profile" element={<ProfilePage />} />
```

不要写成：

```jsx
<Route path="/dashboard/profile" element={<ProfilePage />} />
```

---

## 24.12 index 路由

父路由本身也需要默认内容时，可以写 index 路由。

```jsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<p>后台首页</p>} />
  <Route path="profile" element={<ProfilePage />} />
</Route>
```

访问 `/dashboard` 时，会显示 index 对应内容。

---

## 24.13 受保护路由

有些页面必须登录后才能看。

思路：

```text
如果已登录 → 显示页面
如果未登录 → 跳转登录页
```

```jsx
import { Navigate } from 'react-router';

function ProtectedRoute({ isLogin, children }) {
  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

使用：

```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute isLogin={isLogin}>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

真实项目中，登录状态可能来自 Context、Redux、Zustand 或后端接口。

---

## 24.14 路由懒加载

页面很多时，可以配合 `lazy` 和 `Suspense`。

```jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<p>页面加载中...</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Suspense>
  );
}
```

懒加载适合：

- 后台系统很多页面；
- 某些页面很大；
- 首页不需要立即加载的页面。

---

## 24.15 路由文件拆分

项目变大后，建议拆分页面。

```text
src/
  main.jsx
  App.jsx
  pages/
    HomePage.jsx
    UsersPage.jsx
    UserDetailPage.jsx
    LoginPage.jsx
    NotFoundPage.jsx
```

App.jsx：

```jsx
import { Routes, Route } from 'react-router';
import HomePage from './pages/HomePage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import UserDetailPage from './pages/UserDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/users/:id" element={<UserDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

---

## 24.16 常见错误

- 忘记用 `BrowserRouter` 包住应用；
- 把 `Link` 写成普通 `a` 导致整页刷新；
- 动态参数写了 `:id`，读取时却写 `params.userId`；
- 子路由忘记写 `Outlet`；
- 嵌套路由子路径乱写 `/`；
- 复制旧教程代码时，包名和项目版本不一致。

---

## 24.17 小结与练习

本章重点：

- React Router 用于根据路径显示不同组件；
- `BrowserRouter` 提供路由环境；
- `Routes` 和 `Route` 定义规则；
- `Link` 和 `NavLink` 用于导航；
- `useParams` 读取动态参数；
- `useSearchParams` 读取和修改查询参数；
- `useNavigate` 用于函数里跳转；
- 嵌套路由需要 `Outlet`；
- 受保护路由用条件判断和 `Navigate` 实现。

练习：

1. 创建首页、用户页、详情页、登录页、404 页。
2. 点击用户列表中的用户，跳转到 `/users/:id`。
3. 在详情页用 `useParams` 显示用户 id。
4. 做一个未登录不能进入的 `/dashboard` 页面。
5. 给当前菜单加高亮样式。
