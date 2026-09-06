# 10 Express 常见问题

## 为什么 `req.body` 是 undefined？

通常是忘了在路由前注册 `app.use(express.json())`，或客户端没有发送正确的 `Content-Type`。

## 为什么路由访问不到？

检查 HTTP 方法、完整挂载前缀、参数路径、文件是否真的被 `require`，以及是否被更早的路由截获。

## 为什么请求一直不结束？

某个中间件既没有 `next()`，也没有 `res.send/json/end`。给每个分支都安排明确的结束动作。

## 为什么出现 headers sent？

同一个请求发送了两次响应。`return res.status(...).json(...)`，并避免在回调后继续发送。

## CORS 是什么？

浏览器的跨源限制。服务端用 `cors` 包或自定义响应头允许明确的前端源。CORS 不是身份认证，也不能替代权限检查。

## Express 能做 WebSocket 吗？

Express 处理 HTTP；WebSocket 通常使用 `ws`、Socket.IO 等库，并与 HTTP server 配合。不要把长连接当普通 REST 请求设计。

