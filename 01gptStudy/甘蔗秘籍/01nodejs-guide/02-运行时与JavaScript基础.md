# 02 Node.js 运行时与 JavaScript 基础

## 1. 全局对象与常用模块

Node 提供 `globalThis`、`process`、`console`、定时器等全局能力。文件系统、路径、HTTP 等功能通过内置模块导入：

```js
import path from 'node:path'
import { readFile } from 'node:fs/promises'
```

使用 `node:` 前缀能明确表示这是内置模块，避免与第三方包混淆。

## 2. 值、引用与不可变更新

字符串、数字、布尔、`null`、`undefined` 是基本值；对象、数组和函数是引用。请求数据进入业务层后，尽量通过新对象更新，减少共享可变状态：

```js
const nextPost = { ...post, title: newTitle }
```

## 3. 函数与闭包

回调、Promise 和事件监听器都依赖函数。闭包会保留外层变量；长生命周期监听器如果一直引用大对象，可能造成内存增长，因此要在结束时移除监听器。

## 4. 解构、可选链与空值合并

```js
const { title = '无标题' } = input
const city = user?.address?.city ?? '未知城市'
```

`??` 只在 `null`/`undefined` 时使用默认值，和会把 `0`、`''` 当作假的 `||` 不完全相同。

## 5. Map、Set 与 JSON

`Map` 适合键值映射，`Set` 适合去重。`JSON.stringify` 不能可靠表示 `BigInt`、循环引用和所有日期语义；API 响应前要明确序列化规则，尤其是数据库日期和大整数。

## 6. 阻塞与非阻塞

同步 API（例如 `readFileSync`）会让当前线程等待，启动脚本或一次性 CLI 可以使用，处理 HTTP 请求时通常改用异步 API。异步不等于“自动更快”：CPU 密集计算仍会阻塞事件循环，应拆分、缓存或交给 Worker/专门服务。

## 7. 前端开发者常见误区

- Node 中没有 `window`、`document`、`localStorage`。
- `fetch` 在现代 Node 版本中可用，但要处理超时、非 2xx 响应和响应体解析错误。
- `__dirname` 在 ESM 中不是默认变量，需要从 `import.meta.url` 推导。
- 不要把服务端密钥打包进前端代码或返回给浏览器。
