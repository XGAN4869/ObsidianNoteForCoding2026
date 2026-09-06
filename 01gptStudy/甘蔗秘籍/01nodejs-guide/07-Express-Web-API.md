# 07 Express Web API 实践

## 1. 安装与最小应用

```bash
npm install express
npm install -D @types/express
```

```js
import express from 'express'
const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.listen(process.env.PORT ?? 3000)
```

## 2. 中间件顺序

中间件按注册顺序执行。常见顺序：请求 ID/日志 → 安全 Header → Body 解析 → 公开路由 → 鉴权 → 业务路由 → 404 → 错误处理。忘记 `next()` 或提前发送响应会造成请求悬挂或重复响应。

## 3. 路由与控制器

控制器只做 HTTP 适配：读取 params/query/body，调用 service，映射状态码。数据库查询和业务规则放 service/repository，便于测试。

```js
router.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await postService.findPublished(req.params.slug)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (error) { next(error) }
})
```

## 4. 统一错误处理

最后注册错误中间件，区分业务错误与未知错误；生产响应不返回堆栈。为每个请求设置超时和大小限制，避免慢请求长期占用连接。

## 5. REST API 约定

例如：`GET /api/posts`、`GET /api/posts/:slug`、`POST /api/posts`、`PATCH /api/posts/:id`、`DELETE /api/posts/:id`。分页响应可包含 `{ data, meta: { page, pageSize, total } }`。统一字段命名、状态码和错误码，前端会更容易处理。
