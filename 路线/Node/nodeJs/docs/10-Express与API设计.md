# 10 Express 与 API 设计

## 1. 安装和最小服务

```powershell
npm install express
```

```js
import express from 'express'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.listen(3000, () => console.log('http://localhost:3000'))
```

`express.json` 负责解析 JSON，但仍需限制体积并校验字段类型。

## 2. 路由、控制器、服务

建议把请求处理分成三层：

1. 路由：匹配 `GET /notes/:id`。
2. 控制器：读取参数、调用服务、选择状态码。
3. 服务：执行业务规则，不依赖 Express 的 `req/res`。

这样服务函数可以脱离 HTTP 单独测试。不要在控制器里写一大段数据库 SQL 和复杂业务判断。

## 3. 参数和响应

```js
app.get('/notes/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'INVALID_ID' })
    }
    const note = await noteService.findById(id)
    if (!note) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json({ data: note })
  } catch (error) {
    next(error)
  }
})
```

错误码（如 `INVALID_ID`）比把内部异常文字直接返回更稳定。列表接口要约定分页参数的默认值、最大值和排序字段白名单。

## 4. 错误处理中间件

Express 错误处理中间件有四个参数：

```js
app.use((error, req, res, next) => {
  console.error({ error: error.message, path: req.path })
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500
  res.status(status).json({ error: status === 500 ? 'INTERNAL_ERROR' : error.message })
})
```

生产环境不要暴露堆栈、SQL、密钥。未处理的 Promise 要交给 `next(error)` 或使用框架提供的异步错误机制。

## 5. 中间件顺序

日志、请求 ID、解析 body、认证、路由、404、错误处理通常按这个方向排列。中间件忘记调用 `next()` 且不返回响应时，请求会卡住。

## 动手题

为记事本 API 增加 `GET /notes`、`POST /notes`、`DELETE /notes/:id`，处理空标题、错误 ID、未知路由和异常。写出至少 6 个请求例子。

## 检查清单

- [ ] 我会限制 JSON body 大小。
- [ ] 我能解释路由、控制器、服务的区别。
- [ ] 我有统一错误处理中间件。
- [ ] 我没有把内部堆栈返回给客户端。
