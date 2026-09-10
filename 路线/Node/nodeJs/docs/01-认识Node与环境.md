# 01 认识 Node.js 与准备环境

## 1. Node.js 直接用了 Chrome 的 V8 引擎

Node.js 是一个**在浏览器外运行 JavaScript 的运行时**。它把 V8 JavaScript 引擎、libuv 和一组系统 API 组合在一起，所以 JavaScript 可以读文件、开网络服务、访问数据库。

⭐ V8 是 JS 引擎，JS 代码跑在哪里取决于 who 把 V8 嵌入
- Chrome 把 V8 嵌进去 → JS 跑在浏览器里。
    
- Node.js 把 V8 嵌进去 → JS 跑在服务器/本机里。

```plainText
Chrome
├─ Browser Process        主控进程
├─ Renderer Process       渲染进程：【Blink + V8 + DOM/CSSOM/JS】
├─ GPU Process            GPU 加速、合成、WebGL
├─ Network Service        网络服务进程【HTTP、DNS、TLS、缓存】
├─ Storage Service        存储服务：【IndexedDB、CacheStorage 等】-- 不反复请求 Nginx
├─ Utility Process        工具进程：音频、视频、PDF、打印、解码等
├─ Extension Process      扩展进程
├─ Crashpad Handler       崩溃处理
└─ Zygote                 Linux/macOS 上用于 fork 和沙箱
```
- JavaScript：编程语言。
- **V8（JavaScript 引擎）**：**只负责执行 JS 代码**，**可以脱离浏览器单独拿出来用**。
- Node.js：让 JavaScript 可以在操作系统上运行的环境。
- Express、Fastify：建立在 Node.js 之上的 Web 框架。

Node.js 不是数据库，也不是前端框架。浏览器里的 `window`、`document` 在 Node.js 中通常不存在；Node.js 提供的是 `process`、`fs`、`http` 等服务器能力。

## 2. 安装与检查

从 Node.js 官网选择 LTS 版本安装。安装后重新打开终端，再执行：

```powershell
node --version
npm --version
where.exe node
```

`node --version` 显示 Node 版本，`npm --version` 显示 npm 版本，`where.exe node` 显示实际使用的安装位置。电脑上若有多个 Node，优先保留一个明确的 LTS 版本，避免“我改了文件但运行的不是这个 Node”。

## 3. 第一个脚本

新建 `hello.js`：

```js
console.log('你好，Node.js')
console.log('当前版本：', process.version)
console.log('当前目录：', process.cwd())
```

在该文件所在目录运行：

```powershell
node hello.js
```

`process.cwd()` 是“启动命令时所在的目录”。它不一定是脚本所在目录，这是以后处理文件路径时很重要的区别。

## 4. Node 程序怎样结束

同步代码执行完、没有未完成的定时器/网络连接/文件流后，Node 进程会自然退出。可以用退出码表示结果：

```js
console.log('成功')
process.exitCode = 0
```

失败时通常设置 `process.exitCode = 1`，让脚本或 CI 知道这次执行失败。不要在还需要清理文件、关闭连接时随意调用 `process.exit()`。

## 5. 浏览器和 Node 的简单区别

| 能力 | 浏览器 | Node.js |
|---|---|---|
| 页面 DOM | 有 `document` | 默认没有 |
| 文件系统 | 受沙箱限制 | 可通过 `fs` 访问（仍要遵守权限） |
| 网络 | `fetch`、WebSocket | `http`、`https`、`fetch` 等 |
| 全局对象 | `window` 等 | `globalThis`、`process` |
| 主要任务 | 展示页面和交互 | API、脚本、构建、服务 |

## 6. 动手题

1. 把“你好”改成你的名字并运行。
2. 故意在文件中写一个不存在的变量，观察错误中的文件名和行号。
3. 在不同目录执行 `node C:\路径\hello.js`，观察 `process.cwd()` 是否改变。

## 检查清单

- [ ] 我能说出 Node.js 是运行时，不是语言。
- [ ] 我能用 `node 文件名.js` 运行脚本。
- [ ] 我知道 `process.cwd()` 表示什么。
- [ ] 我知道错误信息中的文件名和行号应该先看。
