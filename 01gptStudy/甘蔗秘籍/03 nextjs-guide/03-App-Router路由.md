# 03 App Router 路由系统

## 1. 文件夹就是 URL

```text
app/page.tsx                    -> /
app/about/page.tsx              -> /about
app/blog/page.tsx               -> /blog
app/blog/[slug]/page.tsx        -> /blog/hello
app/docs/[...segments]/page.tsx -> /docs/a/b（捕获多段）
```

文件夹名称默认出现在 URL 中；`page.tsx` 才是可访问页面。文件夹可用括号分组但不出现在 URL：`app/(marketing)/about/page.tsx`。

## 2. layout 与模板

`layout.tsx` 在导航时保持状态，适合导航栏、侧栏和全局 Provider。根布局必须包含 `<html>` 与 `<body>`。

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><nav>博客</nav>{children}</body></html>
}
```

嵌套布局会包住更深层页面。`template.tsx` 与布局相似，但进入该路由时会重新挂载，适用于每次进入都要重置的界面。

## 3. 导航

优先使用 `next/link`，它能预取页面并避免整页刷新：

```tsx
import Link from 'next/link'
<Link href="/blog">文章</Link>
```

Client Component 中需要编程式导航时使用 `useRouter`；读取当前路径使用 `usePathname`；读取查询参数使用 `useSearchParams`。这些 hooks 只能在客户端组件中使用。

## 4. 动态路由与 params

```tsx
type Props = { params: Promise<{ slug: string }> }

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  return <article>{slug}</article>
}
```

不同 Next.js 版本对 `params` 类型可能存在同步/异步差异，以项目生成的类型和官方版本文档为准；核心思想不变：从 URL 取得参数、校验参数、查询数据、处理不存在情况。

## 5. notFound 与重定向

```tsx
import { notFound } from 'next/navigation'

const post = await getPost(slug)
if (!post) notFound()
```

`notFound()` 会渲染当前层级的 `not-found.tsx`。服务端逻辑中可用 `redirect('/login')`；不要把它当作普通返回值。

## 6. loading 与 error

在任意路由段放置：

```text
app/blog/loading.tsx      # 该段加载期间显示
app/blog/error.tsx        # 该段运行时错误边界（需 'use client'）
app/not-found.tsx         # 404 UI
```

错误组件接收 `error` 和 `reset`，可提供“重试”按钮。生产环境不要把堆栈和密钥直接显示给用户。

## 7. 平行路由与拦截路由（了解即可）

平行路由用 `@slot` 同时渲染多个区域，适合仪表盘；拦截路由用 `(.)`、`(..)` 等约定在当前上下文中以弹窗显示另一页面。它们解决复杂导航问题，先掌握普通嵌套路由再学习。
