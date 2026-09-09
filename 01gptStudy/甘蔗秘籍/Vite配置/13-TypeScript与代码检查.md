# 第 13 课：TypeScript 与代码检查

## 本课目标

理解 Vite 对 TypeScript 的职责边界，知道为什么页面可能能运行但类型仍有错误，建立“转译、类型检查、Lint、测试、构建”彼此不同的认识。

## Vite 支持 TS，但不负责完整类型检查

Vite 可以直接处理 `.ts` 文件，把 TypeScript 语法转成浏览器可执行的 JavaScript。官方明确说明，这个流程只做转译，不执行完整类型检查。原因是转译可以按单个文件快速完成，而类型检查需要理解整个模块图，会影响 Vite 的按需速度。因此，开发服务器正常启动、页面能显示，不代表 TypeScript 没有类型错误。

例如下面代码可能被转译，但类型检查应该报告问题：

```ts
const count: number = '10'
console.log(count)
```

字符串在运行时仍能被打印，所以仅看页面不一定发现错误。项目需要单独运行 TypeScript 检查。原生 TS 项目可以根据自己的 `tsconfig` 使用：

```powershell
npx tsc --noEmit
```

`--noEmit` 表示只检查，不另外生成 JavaScript。Vue 单文件组件项目常使用 `vue-tsc`，具体命令应以 Vue 模板和该工具当前官方说明为准。不要在没有安装对应包的项目里机械执行陌生命令。

## 建立明确脚本

可以根据项目技术栈在 `package.json` 中加入独立脚本，例如原生 TypeScript 项目：

```json
{
  "scripts": {
    "dev": "vite",
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && vite build",
    "preview": "vite preview"
  }
}
```

这里的 `&&` 表示类型检查成功后才构建。是否把检查串进 build 是团队决策；脚手架或框架模板可能已经提供更合适的脚本，先读现有 `package.json`，不要重复添加。

## 类型声明与 import.meta.env

Vite 提供 `vite/client` 客户端类型，其中包括资源导入、`import.meta.env` 和 HMR 相关定义。自定义环境变量较多时，可以在 `src/vite-env.d.ts` 增强 `ImportMetaEnv`：

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_FEATURE_ON: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

类型声明只能帮助开发时发现错误，不会把字符串自动变成布尔值，也不会保护秘密。环境变量实际读取仍是字符串。官方还提醒，若这类全局类型增强不生效，应检查声明文件中是否含有破坏全局增强方式的 `import`。

## 四种检查各管一件事

类型检查发现类型关系问题；ESLint 等静态分析工具检查规则和潜在代码问题；测试验证指定输入输出和交互；Vite build 生成生产资源。它们会有重叠，但不能相互完全替代。理想的提交前流程是按项目已有命令执行类型检查、Lint、测试和 build。没有测试脚本时不要假装测试已经通过，应明确说“项目未配置自动测试”。

## tsconfig 不要盲抄

`tsconfig.json` 的选项会受到 TypeScript 版本、框架和模板影响。Vite 只使用其中与转译相关的一部分，完整类型行为由 TypeScript 工具决定。官方当前主线还说明 Vite 的转译器与目标选项有自己的规则。最安全的起点是 create-vite 当前模板生成的 tsconfig，再按明确报错和官方文档调整，不要把五年前博客中的整份配置覆盖进去。

## 检查点

故意写一次 `const count: number = '10'`，观察开发服务与 `tsc --noEmit` 的差异，然后恢复。查看 `package.json` 是否已有类型检查脚本。回答：build 成功是否一定代表类型正确？取决于脚本是否显式运行类型检查，单独的 Vite 转译并不保证。环境变量声明成 number 是否会自动转换？不会。

官方依据：https://cn.vite.dev/guide/features#typescript
