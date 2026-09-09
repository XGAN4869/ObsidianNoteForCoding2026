# 02 · 初始化 Next.js 项目

> 一行命令起项目，配 TypeScript、配 Tailwind v4、跑起来看到"Hello"。

---

## 一、打开 VSCode 终端

打开你的 `pixel-blog` 文件夹。

按 `` Ctrl + ` ``（反引号，键盘左上角 ESC 下面那个键），打开 VSCode 内置终端。

你应该看到终端底部出现一行提示，类似：

```
PS C:\Users\xxx\Documents\pixel-blog>
```

---

## 二、创建 Next.js 项目

### 一行命令

```bash
pnpm create next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --use-pnpm --no-turbopack
```

> 这行命令**所有参数都给你写好了**，**不要一个一个问**。
> 师傅帮你**算好了**哪些要、哪些不要。

### 参数解释

| 参数 | 意思 | 为什么这样选 |
| --- | --- | --- |
| `pnpm create next-app@latest` | 用 pnpm 跑 create-next-app 最新版 | 最新版的 init 更稳定 |
| `.` | 在**当前目录**创建 | 你已经在 pixel-blog 文件夹里了 |
| `--typescript` | 用 TypeScript | 防止"undefined 不是函数"这类低级错误 |
| `--tailwind` | 装 Tailwind v4 | 我们的样式方案 |
| `--app` | 用 App Router（新路由） | 现代写法，比 Page Router 好 |
| `--eslint` | 装 ESLint | 代码检查 |
| `--src-dir` | 代码放在 `src/` 下 | 项目结构更整洁 |
| `--import-alias "@/*"` | `@/` 指向 `src/` | 后面写 import 方便 |
| `--use-pnpm` | 用 pnpm 装依赖 | 跟你环境一致 |
| `--no-turbopack` | 暂时用 webpack | Turbopack 在某些系统上还不稳 |

### 接下来你会看到

```
✔ Would you like to use TypeScript? ... Yes
✔ Would you like to use ESLint? ... Yes
✔ Would you like to use Tailwind CSS? ... Yes
✔ Would you like your code inside a `src/` directory? ... Yes
✔ Would you like to use App Router? ... Yes
✔ Would you like to use Turbopack? ... No
✔ Would you like to customize the import alias? ... Yes
✔ What import alias would you like configured? ... @/*

Creating a new Next.js app in ...
```

等它跑完（30 秒 - 1 分钟），你会看到：

```
Success! Created pixel-blog at ...
```

---

## 三、看看项目长啥样

```bash
ls        # Windows PowerShell 也支持
# 或者
dir       # Windows cmd
```

你应该看到：

```
.next/             (构建产物，自动生成)
.git/              (Git 仓库)
node_modules/      (依赖，自动生成)
public/            (静态资源)
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    favicon.ico
.eslintrc.json
.gitignore
next.config.mjs
package.json
postcss.config.mjs
README.md
tailwind.config.ts
tsconfig.json
```

> ✅ **这就是 `01-方案/04-项目目录结构.md` 里说的目录**——create-next-app 已经帮你建好了基础结构。
> 我们后续教程里会**在 src/app 下加 pages**，在 src 下加 components / lib 等。

---

## 四、跑起来！

### 启动开发服务器

```bash
pnpm dev
```

你会看到：

```
  ▲ Next.js 15.x.x (webpack)
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### 打开浏览器

打开 Chrome / Edge / Safari，访问：

```
http://localhost:3000
```

你应该看到 Next.js 默认欢迎页：

```
▲ Next.js
Welcome to your new app
Get started by editing src/app/page.tsx
```

**看到这一行 = 项目跑起来了 ✅**

### 看看终端在干嘛

你切回 VSCode 终端，**会发现日志在疯狂滚动**——

```
✓ Compiled in 1.2s
GET / 200 in 50ms
GET / 200 in 50ms
...
```

这是 Next.js 在监控你的文件变化，**你改任何文件，浏览器会自动刷新**（叫 **HMR = Hot Module Replacement**）。

### 关掉开发服务器

按 `Ctrl + C` 关闭。

---

## 五、改成"像素风"

> 现在跑的是 Next.js 默认风格（白底黑字 + 一点蓝色）。
> 我们要改造成**像素风**。

### 步骤 1：清空默认首页

打开 `src/app/page.tsx`，**整个文件内容**替换成：

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">
        Hello Pixel Blog
      </h1>
      <p className="text-base">
        这是我的第一个像素风博客
      </p>
      <button className="mt-8 border-2 border-fg bg-fg text-bg px-4 py-2 shadow-pixel hover:shadow-pixel-sm active:translate-x-1 active:translate-y-1 active:shadow-none">
        像素按钮
      </button>
    </main>
  );
}
```

> 这段代码里**用到了像素风的所有核心概念**：
> - `border-2` = 硬边框
> - `bg-fg text-bg` = 黑底白字（暗色）/ 白底黑字（亮色）由主题控制
> - `shadow-pixel` = 我们定义的硬阴影
> - `active:translate-x-1 active:translate-y-1` = 点击"跳"一下
> - 字体暂用默认，下一步换

保存后浏览器**自动刷新**，你会看到"Hello Pixel Blog"页面。

### 步骤 2：配像素风全局样式

打开 `src/app/globals.css`，**整个文件内容**替换成：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #ffffff;
  --fg: #000000;
  --accent: #ff0000;
}

:root[data-theme='dark'] {
  --bg: #000000;
  --fg: #ffffff;
  --accent: #ff5555;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #000000;
    --fg: #ffffff;
    --accent: #ff5555;
  }
}

html,
body {
  background: var(--bg);
  color: var(--fg);
}

* {
  border-radius: 0 !important;
}

a {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 2px;
}

img {
  image-rendering: pixelated;
}
```

### 步骤 3：配 Tailwind

打开 `tailwind.config.ts`，**整个文件**替换成：

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        accent: 'var(--accent)',
      },
      boxShadow: {
        pixel: '4px 4px 0 0 var(--fg)',
        'pixel-sm': '2px 2px 0 0 var(--fg)',
        'pixel-lg': '8px 8px 0 0 var(--fg)',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 步骤 4：刷新浏览器

你应该看到一个**白底黑字**的简单页面（亮色模式）。

如果你的系统是深色的，浏览器可能默认显示**黑底白字**（暗色模式）——这是正常的，下一步教程会教你加切换按钮。

---

## 六、加上"亮色 / 暗色切换按钮"

打开 `src/app/layout.tsx`，先看看现有的内容。

通常 create-next-app 生成的是这样的：

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({...});
const geistMono = Geist_Mono({...});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**把它改成**：

```tsx
import type { Metadata } from 'next';
import { VT323 } from 'next/font/google';
import './globals.css';

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My Pixel Blog',
  description: '一个 1-bit 像素风的个人博客',
};

// 主题初始化脚本（避免暗色闪屏）
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${vt323.variable} font-pixel text-base`}>
        {children}
      </body>
    </html>
  );
}
```

注意 `dangerouslySetInnerHTML` —— **这不是病毒**，它是 React 允许你插入 HTML 的方式。这里只是插入一段很小的 JS 来在页面加载前设置主题，避免"先亮再暗"的闪屏。

### 创建主题切换按钮

新建 `src/components/layout/ThemeToggle.tsx`：

```tsx
'use client';  // 标记这是客户端组件（需要浏览器 API）

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 组件挂载时读取 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // 没存过，跟着系统
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, []);

  // 切换主题
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // 防止服务端和客户端内容不一致（hydration error）
  if (!mounted) {
    return <button className="border-2 border-fg px-4 py-2">主题</button>;
  }

  return (
    <button
      onClick={toggle}
      className="border-2 border-fg px-4 py-2 shadow-pixel-sm hover:shadow-pixel-none active:translate-x-px active:translate-y-px"
      aria-label="切换主题"
    >
      [{theme === 'light' ? '☼' : '☾'}]
    </button>
  );
}
```

> `'use client'` 是 Next.js 13+ 的约定，意思是"这个组件要在浏览器跑"。
> 我们用了 `useState`、`useEffect`、`localStorage`，**全是浏览器 API**，所以必须标记。

### 把按钮放到首页

修改 `src/app/page.tsx`：

```tsx
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-4">
      <ThemeToggle />
      <h1 className="text-4xl font-bold">Hello Pixel Blog</h1>
      <p>这是我的第一个像素风博客</p>
      <button className="border-2 border-fg bg-fg text-bg px-4 py-2 shadow-pixel hover:shadow-pixel-sm active:translate-x-1 active:translate-y-1 active:shadow-none">
        像素按钮
      </button>
    </main>
  );
}
```

**保存 → 浏览器刷新 → 点击"主题"按钮 → 黑白互换 🎉**

---

## 七、提交到 Git

项目跑起来了，**重要节点 commit 一下**。

```bash
git add .
git commit -m "feat: 初始化 Next.js 项目 + 像素风主题切换"
```

> 提交信息用 **Conventional Commits** 规范：
> - `feat:` 新功能
> - `fix:` 修 bug
> - `style:` 改样式
> - `docs:` 文档
> - `refactor:` 重构代码
> - `chore:` 杂项（依赖、配置）

以后**每完成一个模块**，记得 commit。

---

## 八、跑生产构建看看

```bash
pnpm build
```

会跑一个"模拟生产环境"的构建，**确保你的代码能编译过**。

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (4/4)
✓ Collecting build data
```

如果看到 `Compiled successfully`，**项目构建没问题** ✅。

启动生产版：

```bash
pnpm start
```

访问 `http://localhost:3000`，**跟开发版看起来一样，但更快**。

---

## 九、常见问题

### Q1：`pnpm create next-app` 卡在下载？

**A**：可能网络问题。重试，或者：

```bash
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
```

> 这是淘宝镜像，国内下载更快。

### Q2：装依赖时报 `EACCES: permission denied`？

**A**：

**macOS / Linux**：

```bash
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.pnpm-store
```

**Windows**：以管理员身份运行命令行。

### Q3：浏览器打开 localhost:3000 显示"无法访问"？

**A**：

1. 检查终端里 `pnpm dev` 还在跑（没退）
2. 看终端输出有没有错误
3. 试试 `http://127.0.0.1:3000` 而不是 `localhost:3000`
4. 关掉防火墙试试

### Q4：改了文件浏览器没刷新？

**A**：

1. 看终端有没有报错
2. 看 VSCode 右下角有没有"同步失败"提示
3. **保存文件了吗**？（最容易忘的）
4. **强制刷新**：Ctrl + Shift + R（macOS: Cmd + Shift + R）

### Q5：TypeScript 报错 "Cannot find module '@/...' "？

**A**：检查 `tsconfig.json` 里有没有 `paths: { "@/*": ["./src/*"] }`，没有就加上。

### Q6：Tailwind class 没生效？

**A**：

1. 检查 `tailwind.config.ts` 里 `content` 字段对不对
2. 类名**完全正确**吗？（大小写敏感）
3. 重启 `pnpm dev`

### Q7：next/font 报 "module not found"？

**A**：网络问题。Next.js 第一次用 Google Fonts 会去 Google 服务器下载字体。**国内被墙**。

解决：

```bash
# .env.local 里加
NEXT_FONT_GOOGLE_MOCKED_RESPONSES=1
```

或者改用本地字体（见 `06-附录/02-字体推荐.md`）。

### Q8：怎么停掉 `pnpm dev`？

**A**：在终端里按 `Ctrl + C`。

### Q9：项目文件夹里 `.next/` 是什么？

**A**：Next.js 的构建产物（缓存）。**不要 commit 到 Git**（已经在 `.gitignore` 里了）。

---

## 十、做完后的样子

```
✅ 项目跑起来了
✅ 浏览器显示 "Hello Pixel Blog"
✅ 点击按钮能切换黑白主题
✅ pnpm build 成功
✅ 第一次 git commit 完成

—— 你现在准备好写像素风组件了。
```

---

**下一步** → 打开 [`03-编辑器与必备插件.md`](03-编辑器与必备插件.md)