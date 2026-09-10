# 07 HTTP 基础：请求和响应

## 1. 一次 HTTP 请求包含什么

浏览器发请求时，至少包含：方法（GET/POST 等）、URL、请求头和可选请求体。服务器返回：状态码、响应头和响应体。

- `GET`：读取资源，通常不改变数据。
- `POST`：创建或触发动作。
- `PUT`：整体替换一个资源（项目也可能约定为更新）。
- `PATCH`：部分更新。
- `DELETE`：删除。

状态码要表达事实：`200` 成功、`201` 创建、`204` 成功但无正文、`400` 请求格式错误、`401` 未认证、`403` 无权限、`404` 不存在、`409` 冲突、`429` 过多请求、`500` 服务端未预期错误。

## 2. 原生 HTTP 服务

```js
import http from 'node:http'

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'GET' && req.url === '/') {
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: 'NOT_FOUND' }))
})

server.listen(3000, '127.0.0.1', () => {
  console.log('服务运行在 http://127.0.0.1:3000')
})
```

每个请求都必须结束响应（`res.end()`），否则浏览器会一直等待。正式服务还要设置请求体上限、超时和错误处理。

## 3. 解析 URL 与查询参数

```js
const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
console.log(url.pathname)
console.log(url.searchParams.get('page'))
```

不要通过字符串截取猜 URL；`URL` 能正确处理编码和查询参数。`Host` 来自请求，应在信任边界内使用，生成绝对链接时配置允许的主机列表。

## 4. 读取 JSON 请求体

请求体是流，必须边读边限制大小：

```js
async function readJson(req, maxBytes = 1_000_000) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) throw Object.assign(new Error('请求体过大'), { statusCode: 413 })
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(text)
}
```

调用方应捕获 JSON 语法错误并返回 `400`，不能让错误变成未处理异常。

## 5. 头部与安全

响应可以设置 `Content-Type`、`Cache-Control`、`Content-Security-Policy` 等头。跨域（CORS）不是“全部允许”就安全；只允许明确的来源、方法和头，并正确处理预检请求。反向代理场景下要正确理解 `X-Forwarded-For`，不能盲信客户端自己填写的值。

## 动手题与检查

做出 `GET /health`（返回 `{ok:true}`）和未知路径（404）；再用请求工具发送错误 JSON 和超大正文。确认：

- [ ] 每条路径都会结束响应。
- [ ] 状态码和错误消息能帮助调用方。
- [ ] 请求体有大小限制。
- [ ] 不会把完整堆栈返回给用户。
