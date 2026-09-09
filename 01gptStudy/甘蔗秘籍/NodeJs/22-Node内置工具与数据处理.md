# 22 Node 内置工具与数据处理

## 1. `events`：事件通知

```js
import { EventEmitter } from 'node:events'

const bus = new EventEmitter()
bus.once('ready', () => console.log('只执行一次'))
bus.emit('ready')
```

`on` 注册监听、`once` 只监听一次、`off` 移除监听、`emit` 发出事件。长期服务要在不需要时移除监听器，避免内存上涨；事件名和 payload 结构应有清楚约定。

## 2. `util` 与回调兼容

Node 的旧 API 可能使用回调。`util.promisify` 可以把遵循 `(error, value)` 约定的函数转成 Promise，但不是所有回调都适合直接转换；先查 API 文档。

## 3. `crypto` 的正确用途

```js
import { randomBytes, createHmac } from 'node:crypto'

const token = randomBytes(32).toString('hex')
const signature = createHmac('sha256', process.env.SIGNING_SECRET)
  .update('message')
  .digest('hex')
```

随机 Token 使用密码学安全随机数。HMAC 用于验证消息完整性，不是密码加密。密码存储使用 `scrypt` 或成熟的 Argon2 实现并配合 salt；不要自己设计哈希算法。

## 4. `zlib` 与压缩

HTTP gzip/br 压缩要根据客户端 `Accept-Encoding` 协商，并设置正确的 `Content-Encoding`、`Vary: Accept-Encoding`。已经压缩的图片、视频通常不必再次压缩；压缩也会消耗 CPU，应通过实际数据测试收益。

## 5. CLI 退出码和标准流

CLI 的正常结果写 stdout，错误和诊断写 stderr；成功退出码通常是 0，失败使用非 0。处理管道输入时不要假定一定有 TTY；用流读取 stdin，并限制输入大小。

## 6. Markdown、HTML 与 XSS

Markdown 解析器可能生成 HTML。将不可信 Markdown 展示到网页前，启用成熟的 HTML 清理策略，限制链接协议和危险属性。服务器端渲染也要转义用户内容，不能只相信前端做过过滤。

## 7. 图片压缩工具

pngquant、FFmpeg 等是外部程序，不是 Node 内置模块。通过 `spawn` 传参数数组，固定可执行文件路径或白名单；处理退出码、stderr、超时和临时目录。用户上传的文件先隔离，再扫描和转换。

## 8. 练习

1. 用 `EventEmitter` 发出 `note.created` 事件并监听一次。
2. 生成一个随机 Token，打印长度而不是完整值。
3. 把一段文本 gzip 后再解压，比较压缩前后大小。

## 检查清单

- [ ] 我知道事件监听器需要生命周期管理。
- [ ] 我知道随机数、HMAC、密码哈希不是一回事。
- [ ] 我不会把用户输入直接当 shell 命令、HTML 或文件路径。
