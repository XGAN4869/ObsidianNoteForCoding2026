# 第 08 课：vite.config 配置文件基础

## 本课目标

能够找到或创建配置文件，使用 `defineConfig` 获得编辑器提示，只修改有明确目的的配置，并理解配置文件运行在 Node.js 环境而不是浏览器环境。

## 配置文件放哪里

Vite 执行命令时，会在项目根目录自动查找 `vite.config.js`，也支持其他 JavaScript 或 TypeScript 扩展名。根目录通常也是放 `package.json` 和 `index.html` 的目录。不要把配置文件放进 `src`。一个清楚的基础写法是：

```js
import { defineConfig } from 'vite'

export default defineConfig({
  // 只在有需要时添加配置
})
```

`defineConfig` 主要帮助类型提示和编辑器体验，它不会自动增加业务功能。使用 ESM 语法时，配置文件必须能被 Node 识别为 ESM。create-vite 模板通常已经通过 `package.json` 的 `"type": "module"` 做好安排；旧项目没有该设置时，可以考虑 `.mjs`，但不要在不了解项目模块体系时随意切换。

## 先学习五个常见区域

`base` 控制部署时公共基础路径；`plugins` 放插件实例；`resolve` 影响模块解析，例如别名；`server` 只配置开发服务器；`build` 影响生产构建。结构示例：

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  plugins: [],
  resolve: {},
  server: {},
  build: {},
})
```

这个示例只是帮助识别结构，不建议为了好看把空对象全写进真实项目。默认值通常已经合适。每新增一项，都应能说清楚它解决了哪个实际问题，并在开发和构建中验证。

## 配置可以是函数

需要根据命令或模式返回不同选项时，可以导出函数：

```js
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  console.log('command:', command, 'mode:', mode)

  return {
    base: '/',
  }
})
```

开发服务器对应的 `command` 是 `serve`，生产构建对应 `build`。`mode` 则可能是 `development`、`production` 或自定义值。只有真的需要条件配置时再用函数，普通对象更容易阅读。

## Node 环境与客户端环境不要混

配置文件由 Node.js 执行，可以使用 Node 相关能力，但浏览器端的 `window`、`document` 在这里不存在。反过来，客户端源代码也不应随意使用 Node 专属变量。配置中的 `process.env` 只包含当时进程已有的变量；若要在配置解析期间读取 `.env` 文件，使用 `loadEnv`，具体见第 07 课。

当前 Vite 默认会用自己的配置加载流程处理配置文件，并提供 `--configLoader` 选项。官方说明未来主要版本可能改变默认加载方式。初学者不需要主动改加载器；遇到配置调试或特殊 monorepo 问题时，先查对应版本官方文档，而不是照搬旧博客参数。

## 修改后的固定验证法

第一步保存配置；第二步完全停止并重启开发服务器，因为部分配置不能只靠 HMR 更新；第三步观察终端是否有配置解析错误；第四步打开页面；第五步运行 `npm run build`。一次只改一个配置项。若失败，撤销刚才那一项而不是同时重写整个文件。

## 检查点

找到项目根目录，确认 `vite.config.js` 与 `package.json` 的相对位置。添加一个空的 `defineConfig` 写法并重启服务。指出 `server` 和 `build` 的作用阶段不同。回答：配置文件能直接使用 `document.querySelector` 吗？不能。客户端读取 `.env` 是否要在配置中手动 `loadEnv`？通常不需要。

官方依据：https://cn.vite.dev/config/
