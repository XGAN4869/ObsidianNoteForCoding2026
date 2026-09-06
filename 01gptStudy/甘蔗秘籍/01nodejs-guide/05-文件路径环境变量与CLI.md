# 05 文件、路径、环境变量与 CLI

## 1. 路径必须跨平台

```js
import path from 'node:path'
const filePath = path.join(process.cwd(), 'data', 'posts.json')
```

不要手写 `/` 或 `\\` 拼路径，也不要把用户输入直接当作路径；先限制在允许目录并防止 `../` 路径穿越。

## 2. 文件读写

```js
import { readFile, writeFile } from 'node:fs/promises'
const text = await readFile(filePath, 'utf8')
await writeFile(filePath, text, 'utf8')
```

并发写入要考虑覆盖和锁；大文件使用 Stream，不要一次性读入内存。生产服务通常把数据放数据库/对象存储，文件系统只适合临时或明确持久化的环境。

## 3. 环境变量

```js
const port = Number(process.env.PORT ?? 3000)
if (!process.env.DATABASE_URL) throw new Error('缺少 DATABASE_URL')
```

启动时集中读取、转换和校验配置；不要在业务各处散落 `process.env.X`。`.env` 文件不得提交密钥，生产使用部署平台的密钥管理。

## 4. CLI 参数

`process.argv` 包含 Node 路径和脚本路径，复杂命令可使用维护良好的参数解析库。输出帮助、退出码和错误信息要清晰；破坏性命令要求显式确认。

## 5. 子进程

`execFile`/`spawn` 可运行外部程序。永远不要把未经校验的用户字符串拼进 shell 命令；优先传数组参数并设置超时、资源限制和退出处理。
