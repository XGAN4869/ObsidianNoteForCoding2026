# uni-app 组件

---

## 组件类型

uni-app 的内置组件分四个来源：

| 类型 | 说明 | 来源 |
|------|------|------|
| **uni-app 组件** | uni-app 自己封装的跨端组件 | DCloud 原生，跨端兼容性最好 |
| **Vue 组件** | 标准的 Vue 3 组件 | Vue 官方 |
| **NVue 组件** | 使用 native 原生渲染的组件 | DCloud 原生，App 端性能好 |
| **小程序组件** | 从各小程序借鉴的组件 | 微信/支付宝等小程序 |

---

## 组件类型区别

| 类型 | 渲染方式 | 特点 |
|------|----------|------|
| uni-app 组件 | WebView 渲染 | 可用 scss，跨端兼容最好 |
| Vue 组件 | Vue 渲染 | 标准 Vue 语法，H5/App 支持 |
| NVue 组件 | 原生渲染 | App 端性能好，但写法限制多 |
| 小程序组件 | 各平台原生 | 仅特定平台可用 |

> **uni-app 组件是 DCloud 自己封装的"亲儿子"，跨端兼容性最好。**

---

## uni-app 内置基础组件

最核心的三个，相当于 HTML 标签：

| 组件 | 对应 HTML | 用途 |
|------|-----------|------|
| `view` | `div` | 容器、布局 |
| `text` | `span` | 文本 |
| `image` | `img` | 图片 |

### 其他常用内置组件

| 分类 | 组件 |
|------|------|
| 视图容器 | `scroll-view`（可滚动）、`swiper`（轮播） |
| 表单 | `button`、`input`、`textarea`、`picker` |
| 导航 | `navigator` |
| 媒体 | `video`、`audio`、`camera` |
| 地图 | `map` |
| 画布 | `canvas` |

---

## 本项目使用的组件

项目组件使用比例：

```
uni-app 内置基础组件（view/text/image）  ← 少但核心
uview-plus 业务组件（up-xxx）           ← 多且常用
```

### 1. uni-app 内置基础组件

| 组件 | 用途 | 示例 |
|------|------|------|
| `view` | 容器，相当于 div | `<view class="content">` |
| `text` | 文本，相当于 span | `<text class="label">` |
| `image` | 图片 | `<image :src="item.img">` |
| `scroll-view` | 可滚动容器 | `<scroll-view scroll-y="true">` |
| `button` | 按钮 | `<button open-type="chooseAvatar">` |
| `input` | 输入框 | `<input v-model="nickName">` |
| `template` | 模板（Vue 内置） | `<template v-if="...">` |

### 2. uview-plus 组件（第三方 UI 库）

通过 `easycom` 自动导入，组件名以 `up-` 开头：

| 组件 | 用途 |
|------|------|
| `up-search` | 搜索框 |
| `up-swiper` | 轮播图 |
| `up-notice-bar` | 通知栏 |
| `up-waterfall` | 瀑布流布局 |
| `up-lazy-load` | 图片懒加载 |
| `up-icon` | 图标 |
| `up-tag` | 标签 |
| `up-navbar` | 导航栏 |
| `up-cell-group` / `up-cell` | 单元格列表 |
| `up-popup` | 弹出层 |
| `up-rate` | 评分 |
| `up-scroll-list` | 横向滚动列表 |

---

## easycom 自动导入机制

### 什么是 easycom？

`easycom` 是 uni-app 的**自动组件导入**机制，不用手动 `import` 就能直接用组件。

### 没有 easycom 的时候

```javascript
// ❌ 每次用组件都要先 import
import UpSearch from '@/uni_modules/uview-plus/components/u-search/u-search.vue'
import UpSwiper from '@/uni_modules/uview-plus/components/u-swiper/u-swiper.vue'

export default {
  components: { UpSearch, UpSwiper }
}
```

### 有 easycom 的时候

```vue
<!-- ✅ 不用 import，直接用 -->
<up-search></up-search>
<up-swiper></up-swiper>
```

### 本项目配置（pages.json）

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^up-(.*)": "@/uni_modules/uview-plus/components/u-$1/u-$1.vue"
    }
  }
}
```

规则含义：遇到 `up-xxx` 组件，自动去 `@/uni_modules/uview-plus/components/u-xxx/u-xxx.vue` 找。

### easycom 参数说明

| 参数 | 说明 |
|------|------|
| `autoscan: true` | 自动扫描 `components/` 和 `uni_modules/` 下的组件 |
| `custom` | 自定义匹配规则 |

**本质：配置好规则后，按命名规范写组件就能自动找到，无需手动 import。**

---

## 和 Vue 3 对比

| Vue 3 | uni-app |
|-------|---------|
| 原生 HTML 标签 `div`/`span`/`img` | uni-app 有自己的标签 `view`/`text`/`image` |
| 无内置 UI 组件库 | 有内置组件 + uview-plus 等第三方库 |
| 按需手动 import 组件 | `easycom` 自动导入 |
| `npm install` 安装第三方库 | 可以用 npm，也可用插件市场的 uni-app 插件 |

---

## uni_modules vs node_modules

这是两个完全不同的概念。

| | `node_modules` | `uni_modules` |
|--|----------------|---------------|
| 来源 | npm 生态（npmjs.com） | DCloud 插件市场（market.dcloud.net.cn） |
| 通用性 | 通用 Node.js 包 | **专属于 uni-app** 的插件 |
| 跨端 | 不保证跨端 | 专为跨端设计 |
| 加载方式 | 需手动 import | `easycom` 自动导入 |
| 示例 | `vue`、`axios`、`lodash` | `uview-plus`、`uni-ui`、`uni-push` |

### 为什么 uview-plus 在 uni_modules 而不是 node_modules？

```
node_modules/
└── vue/              ← 通用 JS 框架，任何项目都能用
    axios/             ← 通用请求库，任何项目都能用
    lodash/           ← 通用工具库，任何项目都能用

uni_modules/
└── uview-plus/       ← 专属于 uni-app 的跨端 UI 库
    └── components/   ← 组件已按 uni-app 规范封装
    └── package.json  ← 包含平台标识，声明支持哪些平台
```

**简单理解：**
- `node_modules` = **原材料**，通用 JS 库
- `uni_modules` = **料理包**，按 uni-app 标准封装好，标明了支持哪些平台

### 哪些在 uni_modules？

本项目的 `uni_modules` 目录：

```
uni_modules/
└── uview-plus/       ← 本项目用的 UI 库，在插件市场下载
    └── components/
        ├── u-search/
        ├── u-swiper/
        ├── u-icon/
        └── ...（几百个组件）
```

### 开发时怎么选？

| 场景 | 用 npm（node_modules） | 用 uni_modules |
|------|----------------------|----------------|
| Vue 核心、路由、状态管理 | ✅ axios、pinia、vue-router | ❌ |
| 跨端 UI 组件库 | ❌ | ✅ uview-plus、uni-ui |
| 平台特定能力（推送、登录） | ❌ | ✅ uni-push、uni-login |
| 通用工具函数 | ✅ lodash、dayjs | ❌ |

### 一句话总结

> **uni_modules 是 uni-app 专属插件市场，封装好了跨端组件和规范；node_modules 是通用 npm 包，不保证跨端。**

---

## 简单总结

1. **uni-app 内置组件** ≈ HTML 标签 + 常用 UI 组件，`view`/`text`/`image` 最核心
2. **uview-plus** = 第三方 UI 库（`uni_modules`），`up-xxx` 系列，按需使用
3. **easycom** = 自动导入 `uni_modules` 中的组件，无需手动 import
4. **uni_modules** ≠ node_modules，前者是 uni-app 专属插件，后者是通用 npm 包
5. **开发时**：用 `view`/`text`/`image` 搭结构，用 `up-xxx` 做 UI，按需组合
