# 04 模块、npm 与 TypeScript

## 1. ESM 与 CommonJS

现代项目可在 `package.json` 设置 `"type": "module"`，使用 ESM：

```js
import { sum } from './math.js'
export function total(items) { return items.reduce(sum, 0) }
```

CommonJS 使用 `require`/`module.exports`。两种系统的默认导出、路径扩展名和互操作规则不同；一个项目优先只选一种，不要混写后凭感觉修补。运行现有项目时先看其 `package.json`。

## 2. npm 依赖

```bash
npm install express
npm install -D typescript tsx @types/node
npm uninstall express
```

运行依赖放 `dependencies`，仅开发工具放 `devDependencies`。提交锁文件；升级前查看变更日志、运行测试并检查安全公告。

## 3. package.json 关键字段

- `scripts`：团队统一的开发、测试、构建命令。
- `type`：模块系统。
- `engines`：声明 Node/npm 支持范围。
- `exports`：限制包的公开入口，库项目尤其重要。

## 4. TypeScript 服务端规范

为请求输入、服务返回值和配置对象定义类型；运行时仍要用 schema 校验，因为类型擦除后用户可以发送任意 JSON。开启严格模式，避免 `any` 扩散。

## 5. 配置与路径别名

路径别名（如 `@/lib`）要同时配置 TypeScript 和实际运行工具。别名失配会出现“编辑器不报错、Node 运行失败”。先用相对路径理解模块，再按团队规范引入别名。
