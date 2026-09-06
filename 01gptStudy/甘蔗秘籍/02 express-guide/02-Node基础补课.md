# 02 Node.js 基础补课

Express 只是 Node.js 的库。先掌握下面这些 JavaScript/Node 概念。

## 模块

CommonJS 导入和导出：

```js
// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// app.js
const { add } = require('./math');
```

路径以 `./` 开头表示当前目录；第三方包不写 `./`。

## 异步与 Promise

文件、数据库、网络操作都可能需要等待。不要用同步 API 阻塞整个服务。

```js
const fs = require('node:fs/promises');

async function readText() {
  const text = await fs.readFile('note.txt', 'utf8');
  return text;
}
```

`await` 只能在 `async` 函数中使用。异步函数抛出的错误要用 `try/catch` 或交给 Express 错误处理中间件。

## 环境变量

不要把密码写进 Git：

```js
const port = Number(process.env.PORT || 3000);
const dbUrl = process.env.DATABASE_URL;
```

本地可使用 `.env` 文件和 `dotenv` 包：

```bash
npm install dotenv
```

```js
require('dotenv').config();
```

把 `.env` 加入 `.gitignore`。

## JSON

`JSON.parse()` 把字符串变成对象，`JSON.stringify()` 把对象变成字符串。Express 的 `express.json()` 会自动解析 `Content-Type: application/json` 的请求体。

## 调试方法

先打印最小信息：

```js
console.log({ method: req.method, path: req.path, body: req.body });
```

不要打印密码、Token、完整 Cookie。遇到问题时记录“输入、经过哪一步、输出或错误”。

## 自测

- 为什么数据库查询通常写成 `await`？
- `process.env.PORT` 为什么可能是字符串？
- `.env` 为什么不能提交到公开仓库？

