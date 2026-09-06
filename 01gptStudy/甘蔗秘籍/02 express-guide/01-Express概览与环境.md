# 01 Express 概览与环境

## 这节只记住三件事

1. Node.js 让 JavaScript 在浏览器外运行。
2. Express 是运行在 Node.js 上的 Web 框架，负责把请求交给路由和中间件。
3. HTTP 请求有方法、路径、请求头、请求体；响应有状态码、响应头、响应体。

## 从 Vue/React 迁移过来怎么理解

Vue/React 主要画界面；Express 主要接收数据、执行业务规则、读写数据库，然后返回 JSON。前端的 `fetch('/api/posts')` 就是在请求 Express 的某个路由。

```text
浏览器/移动端 -> HTTP 请求 -> Express 路由 -> 业务代码 -> 数据库
                                     |
                                  HTTP 响应(JSON)
```

## 安装 Node.js

安装 LTS 版本后检查：

```bash
node -v
npm -v
```

如果两条命令都输出版本号，环境可用。若命令不存在，先修复 PATH，不要继续安装项目依赖。

## 创建第一个项目

```bash
mkdir express-demo
cd express-demo
npm init -y
npm install express
```

创建 `app.js`：

```js
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Express is running' });
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
```

启动：

```bash
node app.js
```

浏览器访问 `http://localhost:3000`。停止服务按 `Ctrl+C`。

## npm 脚本

在 `package.json` 的 `scripts` 中加入：

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "node --watch app.js"
  }
}
```

Node 18.11+ 支持 `node --watch`；如果你的版本不支持，可安装 `nodemon` 后使用 `nodemon app.js`。

## 常见错误

- `EADDRINUSE`：端口被占用，换端口或停止旧进程。
- `Cannot find module 'express'`：没有在当前项目目录执行 `npm install express`。
- 浏览器一直转圈：检查终端是否仍在运行、URL 和端口是否正确。

## 自测

1. `app` 是什么？
2. `app.get('/', handler)` 中的 `/` 表示什么？
3. `res.json()` 和 `res.send()` 有什么共同点？

