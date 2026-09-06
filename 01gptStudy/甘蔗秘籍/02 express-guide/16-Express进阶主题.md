# 16 Express 进阶主题

## 静态资源与缓存

```js
const path = require('node:path');
app.use('/assets', express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));
```

静态文件目录不要放密钥、数据库文件或源码。缓存时间要和文件命名策略配套。

## Cookie 与 Session

Cookie 是浏览器保存并随请求发送的一小段数据；Session 通常把会话数据放服务端、Cookie 只保存会话 ID。使用成熟库并设置 `httpOnly`、`secure`、`sameSite`。多实例部署时 Session 存储不能只放单机内存，应使用共享存储。

## 文件上传

上传使用 `multipart/form-data`，需要专门中间件。必须限制单文件大小、总大小、文件数量和允许的 MIME/扩展名；不要直接使用用户提供的文件名，文件应存储在非公开目录或对象存储，并用随机名。

## 反向代理与真实 IP

部署在 Nginx、云负载均衡后面时，`req.ip` 是否可信取决于 `app.set('trust proxy', ...)` 的配置。配置过宽可能让客户端伪造协议和 IP；应按照代理拓扑设置具体跳数或网段。

## 性能

- 避免在请求处理中执行大规模同步循环和同步文件 API。
- 给数据库查询加索引并限制返回字段。
- 使用分页、缓存和压缩，但先用日志或指标确认瓶颈。
- Node 的单个进程使用一个事件循环；CPU 密集任务应移到 Worker、队列或独立服务。

## 健康检查与优雅关闭

健康检查只做轻量检查；深度检查可另设 `/ready`。收到 `SIGTERM` 后停止接收新请求，等待在途请求完成，再关闭数据库连接。设置超时，避免无限等待。

## TypeScript 迁移思路

先为 `req.body`、`req.params`、service 返回值定义类型，再逐步把文件改为 `.ts`。类型检查不能替代运行时校验：来自网络的数据仍需要 Zod/Joi 等运行时验证。

## 可观测性

至少记录请求 ID、状态码、耗时和错误码；生产再加入指标（吞吐、延迟、错误率）和分布式追踪。日志中永远不记录密码、访问令牌和完整 Cookie。

