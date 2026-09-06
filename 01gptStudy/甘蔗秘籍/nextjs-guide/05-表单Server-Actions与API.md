# 05 表单、Server Actions 与 API

## 1. 表单的两条路

- **Server Action**：表单直接调用服务端函数，适合同一个 Next 应用内的写入操作。
- **Route Handler**：在 `app/api/**/route.ts` 中实现 HTTP 方法，适合公开/跨端 API、Webhook 或需要精确控制响应的场景。

两者都必须做服务端校验。客户端校验只是改善体验，不能当作安全措施。

## 2. Server Action 基本结构

```ts
// app/blog/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { ok: false, message: '标题不能为空' }
  // 1. 检查当前用户权限
  // 2. 校验所有字段
  // 3. 写入数据库
  revalidatePath('/blog')
  return { ok: true }
}
```

```tsx
import { createPost } from './actions'

export function PostForm() {
  return <form action={createPost}>
    <input name="title" required />
    <textarea name="content" required />
    <button type="submit">发布</button>
  </form>
}
```

Action 是网络边界，用户可以伪造请求；永远重新验证权限、输入和资源归属。

## 3. Route Handler

```ts
// app/api/posts/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const posts = await getPosts()
  return NextResponse.json({ data: posts })
}

export async function POST(request: Request) {
  const body = await request.json()
  // 校验 body、鉴权、写入
  return NextResponse.json({ data: body }, { status: 201 })
}
```

明确状态码：成功创建用 201，参数错误用 400/422，未登录用 401，无权限用 403，不存在用 404，未知故障用 500。不要把数据库原始错误返回给用户。

## 4. pending、成功与失败反馈

表单提交应禁用重复点击，并向用户说明状态。可使用 React/Next 当前版本提供的表单状态 hooks；若版本不同，使用客户端组件维护 `pending`、`message` 也可以。反馈必须来自服务端真实结果，不要点击后直接假装成功。

## 5. Cookie、Header 与文件

服务端读取 Cookie/Header 时要考虑动态渲染和缓存影响。上传文件时限制大小、MIME 类型和文件名，保存到对象存储并在数据库保存 URL；不要把任意用户文件直接写进可执行目录。

## 6. API 设计清单

- 请求和响应有稳定 JSON 结构，例如 `{ data, error, meta }`。
- 分页参数有上限，排序字段使用白名单。
- 错误信息可读但不泄露内部细节。
- 写操作具备鉴权、幂等/重复提交策略和审计信息。
- 需要跨域时显式配置 CORS，不要使用 `*` 放开带凭据请求。
