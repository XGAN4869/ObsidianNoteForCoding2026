# uni-app 编译链路笔记

## 结论先行

- uni-app 的 App 端是 **WebView + 原生控件** 的混合结构：页面跑在 WebView 里，tabBar、导航栏、状态栏是原生控件。
- CLI 和 HBuilderX 可能加载**两份物理路径不同、包名相同**的 `uni-cli-shared`。
- 模块缓存按**解析后的真实路径**区分实例，包名相同不等于实例相同。
- easycom 的注册表是模块级状态，两份实例各有一份：一边注册，另一边读不到，组件匹配和组件样式就会丢失。
- 统一办法：让 HBuilderX 也使用项目 `node_modules` 里的编译器，并锁死版本。

---

## 一、运行模型：WebView + 原生控件

- 页面 DOM、Vue 运行时、业务样式都在 WebView 中执行。
- tabBar、导航栏、状态栏不在 WebView 里，属于原生控件，**读不到 CSS 变量**。
- 所以原生栏的颜色必须在构建阶段从 `tokens.css` 生成 `theme.json`，本项目由 `scripts/generate-native-theme.ts` 完成。
- 运行时主题的唯一来源是 `useAppearanceStore`；原生导航同步只由 `App.vue → syncNativeThemeAssets` 负责。

这条边界决定了很多"样式为什么不生效"的问题：CSS 只管 WebView，原生控件只认构建期产物。

---

## 二、依赖可能来自两个地方

```text
yu-island-app/
├── node_modules/
│   └── @dcloudio/
│       ├── vite-plugin-uni/
│       └── uni-cli-shared/
├── src/
│   └── vite.config.ts      # HX 的配置查找入口
├── vite.config.ts          # 真正的配置
└── package.json
```

编译相关依赖存在两份：

```text
项目依赖
yu-island-app/node_modules/
├── @dcloudio/vite-plugin-uni
└── @dcloudio/uni-cli-shared

HBuilderX 内置依赖
HBuilderX/plugins/uniapp-cli-vite/
├── 内置编译器
└── 内置编译器使用的 uni-cli-shared
```

两个目录都可能有 `uni-cli-shared`。**名字一样，不代表是同一个模块实例。**

---

## 三、Node.js：缓存键是解析后的路径

Node.js 加载模块时会缓存，但缓存键不是包名，而是**解析后的真实文件路径**。

```js
const a = require('./utils')
const b = require('./utils')
// 两次解析到同一个文件 → 复用同一个模块实例

const projectShared = require('/project/node_modules/@dcloudio/uni-cli-shared')
const hxShared = require('/HBuilderX/plugins/uniapp-cli-vite/node_modules/@dcloudio/uni-cli-shared')
// 包名相同，真实路径不同 → 两个独立实例
```

Vite / ESM 同理：模块按 resolved id 缓存，真实路径不同就是模块图里的两个节点。

如果模块内部维护了模块级变量：

```js
const cache = new Map()

export function setCache(key, value) {
  cache.set(key, value)
}

export function getCache(key) {
  return cache.get(key)
}
```

那么：

```text
项目实例 A：setCache('easycom', info)  →  写入缓存 A
HX 实例 B： getCache('easycom')        →  读取缓存 B（空）
```

| 实例 | 物理位置 | 内存状态 |
| --- | --- | --- |
| A | 项目 `node_modules` | easycom 数据已注册 |
| B | HBuilderX 安装目录 | easycom 数据为空 |

两份实例各有独立作用域，状态不共享，这就是所谓的**缓存失联**。

> 说明：上面的 `Map` 是简化示例。实际 easycom 实现以安装版本源码为准。本项目安装的版本里，状态是 `@dcloudio/uni-cli-shared/dist/easycom.js` 顶层的 `easycoms`、`easycomsCache`、`easycomsInvalidCache` 三个模块级变量。

---

## 四、easycom 为什么依赖这份模块级状态

模板里可以直接写组件标签，不手动 `import`：

```vue
<template>
  <view>
    <UserCard />
  </view>
</template>
```

编译器根据目录约定自动映射：

```text
UserCard
    ↓
src/components/UserCard/UserCard.vue
```

也可以写自定义规则，例如本项目的 TDesign：

```json
{
  "easycom": {
    "custom": {
      "^t-(.*)": "@tdesign/uniapp/$1/$1.vue"
    }
  }
}
```

编译时需要先扫描并注册组件信息，再在模板编译阶段查询。若两步落在不同模块实例上：

1. 实例 A 完成 easycom 初始化，注册表里有 `t-*` 映射；
2. 实例 B 做模板匹配，查自己的空注册表；
3. `t-button` 等标签解析失败，TDesign 组件的 JS 和组件自身 CSS 都不会进入产物；
4. 表现就是字体、间距、布局和预期不一致，但页面本身不报错。

结论：**版本一致 ≠ 实例一致。** 只对齐 `package.json` 的版本号，不能保证运行的是同一个模块实例。

---

## 五、在本项目中的表现

- 现象：同一份源码，`npm run dev:app` 正常，HBuilderX 运行时 TDesign 组件样式异常。
- 原因：配置里的 `@dcloudio/vite-plugin-uni` 从项目 `node_modules` 加载，平台编译模块和别名解析却从 HBuilderX 安装目录加载。
- 证据：修复前 HX 产物 `app-service.js` 104,094 B、`app.css` 77,754 B；强制使用项目上下文后变为 197,555 B / 78,467 B，与 CLI 产物完全一致。

### 怎么定位

在配置加载时打印三个值，CLI 和 HX 各跑一次：

```js
console.log(process.env.UNI_CLI_CONTEXT)
console.log(process.argv[1])
console.log(process.env.UNI_INPUT_DIR)
```

若 `UNI_CLI_CONTEXT` 指向 HBuilderX 安装目录而不是项目根，基本可以确认走了两份模块。

---

## 六、怎么修：统一编译链路

目标：**CLI 和 HBuilderX 都从项目 `node_modules` 加载编译器。**

1. **根 `vite.config.ts` 统一上下文**
   - 检测到 `UNI_CLI_CONTEXT` 不是项目根时：
     - 进程入口不是项目内的 `@dcloudio/vite-plugin-uni/bin/uni.js` → 直接报错，拒绝 HX 内置编译器；
     - 入口正确 → 把 `UNI_CLI_CONTEXT` 改回项目根。
   - 必须在 `uni()` 插件初始化之前改完，否则平台模块已经按旧上下文解析。

2. **保留 `src/vite.config.ts`**
   - HBuilderX 只在 `UNI_INPUT_DIR/vite.config.ts` 找配置，也就是 `src/vite.config.ts`。
   - 该文件只做转发：`export { default } from '../vite.config'`。

3. **`envDir` 固定到项目根**
   - 保证两条链路读同一份 `.env`、`.env.development`、`.env.development.local`。

4. **精确锁版本**
   - `@dcloudio/*`、`tailwindcss`、`weapp-tailwindcss` 都写死版本，不用 `^`。
   - 否则一次 `npm install` 就可能让两边的实现分叉。

5. **校验 HX 版本**
   - `HX_Version` 的主次版本必须等于项目编译器的 `compilerVersion`，不一致就报错。

6. **运行纪律**
   - HX 只导入项目根目录，不单独导入 `src`，也不把 `dist/dev/app` 当工程运行。
   - HX 正在编译时，不要同时开 `npm run dev:app` 监听同一份源码。

### 为什么不直接让 HX 编译

HX 内置编译器版本不一定和项目依赖一致，且它不会自动使用项目里注册的 Tailwind / Vite 插件。统一到项目依赖后，CLI 能产出的结果，HX 也能复现。

---

## 七、视口uniapp
- windowHeight	number	可使用窗口高度（适用于小窗模式）