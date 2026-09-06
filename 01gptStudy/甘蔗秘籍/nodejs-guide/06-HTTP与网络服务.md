# 06 HTTP、URL 与网络服务

## 1. HTTP 基础

请求包含方法、URL、Header、可选 Body；响应包含状态码、Header、Body。常见方法：GET 读取、POST 创建/触发、PUT 全量替换、PATCH 局部更新、DELETE 删除。GET 应尽量无副作用。

## 2. Node 原生 HTTP

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ message: 'ok' }))
    return
  }
  res.writeHead(404).end('Not Found')
})
server.listen(3000, '0.0.0.0')
```

真实项目需要路由匹配、Body 解析、校验、鉴权、日志和错误处理中间件，通常使用 Express/Fastify 等框架。

## 3. URL 与查询参数

```js
const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
```

路径参数用于识别资源，查询参数用于筛选/分页。所有数字、日期和枚举都要校验边界。

## 4. JSON Body

读取请求流时设置大小上限并捕获无效 JSON。响应统一 `content-type`，序列化日期和错误结构保持稳定。

## 5. CORS、Cookie 与缓存

CORS 是浏览器的跨域限制，不是服务器安全认证。只允许明确的来源；带 Cookie 时不能随意使用 `*`。Cookie 设置 `HttpOnly`、`Secure`、合适的 `SameSite` 和过期时间。公共 GET 才考虑 HTTP 缓存，私有响应禁止共享缓存。

## 6. 优雅关闭

收到 SIGTERM 时停止接收新连接，等待在途请求，关闭数据库连接，再在超时后退出。部署平台依赖这一流程完成无损发布。
