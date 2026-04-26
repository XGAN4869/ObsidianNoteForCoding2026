# Vue 与 uni-app 的差异点

---

## 核心结论：uni-app 是"伪多页面"，Vue 是"真单页面"

### Vue SPA 架构

```
┌─────────────────────────────────────┐
│          index.html (唯一页面)        │
│  ┌─────────────────────────────┐    │
│  │     Vue Router (路由表)       │    │
│  │  /home → Home组件            │    │
│  │  /about → About组件          │    │
│  └─────────────────────────────┘    │
│         JS 切换组件，DOM不变          │
└─────────────────────────────────────┘
```

- 只有一个 `index.html`
- JS 切换 Vue 组件，DOM diff 更新
- 无真实页面栈，只有路由记录
- `router.push` 替换组件

### uni-app 架构（App端/H5端）

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Webview 1      │  │   Webview 2     │  │   Webview 3      │
│  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │
│  │ pages/home │  │  │  │pages/detail│  │  │  │pages/detail│  │
│  │  (页面实例) │  │  │  │  (页面实例) │  │  │  │  (页面实例) │  │
│  └────────────┘  │  └──────────────────┘  └──────────────────┘
└──────────────────┘
        ↑                    ↑                    ↑
      页面栈: [home, detail, detail]  ← 真正的多个页面实例
```

- 可以有多个 webview
- 真正创建新页面实例
- 真实的栈，管理页面实例
- `uni.navigateTo` 创建新 webview

### SPA vs MPA 对比

| | Vue (Vue Router) | uni-app |
|--|------------------|---------|
| HTML | 只有一个 `index.html` | 可以有多个 webview |
| 组件切换 | JS 切换 Vue 组件，DOM diff 更新 | 真正创建新页面实例 |
| 页面栈作用 | 无真实页面栈，只有路由记录 | 真实的栈，管理页面实例 |
| 跳转 | `router.push` 替换组件 | `uni.navigateTo` 创建新 webview |
| 返回 | 历史记录回退，组件恢复 | 弹出页面实例，销毁当前页 |

> **页面栈在 uni-app 里就是字面意思的栈，每次 `navigateTo` 压入一个新页面实例，`navigateBack` 弹出一个。超过 10 层小程序会崩溃——真实的操作系统页面资源是有限的。**

---

## 全局文件对比

### pages.json vs Vue Router

`pages.json` 功能上可类比 Vue Router，但本质不同：

| | pages.json | Vue Router |
|--|------------|------------|
| 配置时机 | 编译时确定，静态 | 可以动态注册，运行时也可添加 |
| 配置内容 | 页面路径 + 原生配置（导航栏、标题） | 路径 + 组件映射 + 路由守卫 |
| 页面组件 | 不写组件路径，只写页面文件位置 | 显式指定组件 |
| 导航控制 | 不管导航逻辑，只声明页面存在 | 管导航逻辑、守卫、参数解析 |
| 嵌套路由 | 通过 subPackages 分包配置 | 真正的 children 嵌套 |
| tabBar | 底部 Tab 配置 | 无直接对应，需模拟 |

> **pages.json 更像是"页面清单/Manifest"，而不是路由表。** 它告诉 uni-app 有哪些页面、谁是谁、主包还是分包，但具体的跳转逻辑是 `uni.navigateTo` 这套 API 在管。

### 其他全局文件

| uni-app | Vue.js | 说明 |
|---------|-------|------|
| `manifest.json` | `vite.config.js` / `vue.config.js` | 项目构建配置、AppID、图标、权限等 |
| `uni.scss` | `src/assets/*.scss` | 全局样式变量、混入全局样式 |
| `App.vue` | `main.js` + `App.vue` | 应用入口，可挂载全局状态 |
| `main.js` | `main.js` | Vue 实例创建，全局注册 |

---

## 组件对比

| uni-app | Vue.js | 说明 |
|---------|-------|------|
| 内置组件（view、text、swiper） | 原生 HTML 标签 + Vue 内置组件 | uni-app 有一套跨端组件 |
| `template` 部分 | SFC 的 `<template>` | 页面/组件结构 |
| `uni-ui` / `uView` 等 | `vant` / `Element Plus` 等 | 第三方跨端 UI 库 |

---

## API 对比

| uni-app | Vue.js (浏览器端) | 说明 |
|---------|------------------|------|
| `uni.request()` | `axios` / `fetch` | 网络请求 |
| `uni.showToast()` | `Element Plus Message` / `alert` | 轻提示 |
| `uni.getStorage()` | `localStorage` | 本地存储 |
| `uni.navigateTo()` | `router.push()` | 路由跳转 |
| `uni.getLocation()` | 浏览器 Geolocation API | 地理位置 |
| `uni.login()` | — | 第三方登录（微信等） |
| `uni.chooseImage()` | File API | 选择图片 |

> **uni-app 的 API 都是 `uni.xxx()` 同步或异步方法，跨端统一调用，底层自动映射到各平台的原生 API。**

---

## 插件/生态对比

### uni-app 插件解决的根本问题

**1. 跨端兼容问题**

一个插件可能要同时兼容 App、H5、微信小程序、支付宝小程序、抖音小程序...插件内部帮你做了平台差异处理。

```javascript
// 你写：uni.showToast()
// 插件内部判断：当前在小程序用 wx API，在 App 用 native API...
```

**2. easycom 自动导入**

```json
// pages.json 中配置
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@/components/uni-$1/uni-$1.vue"
    }
  }
}
```
不用 `import { UniBadge } from 'uni-ui'` 就能直接用 `<uni-badge>`

**3. 统一发布和管理**
- npm 包是 JS 圈通用
- uni-app 插件市场是 DCloud 自己生态内的包市场，有审核、有版本对应各端

> **类比：npm 包 = 原材料（面粉、鸡蛋），uni 插件 = 按 uni-app 标准封装好的料理包（标好了加多少水、温度多少、时间多久）**

### uni.scss 本质

`uni.scss` 不是真正的 Sass 文件，而是 uni-app 全局样式变量，类似于 vant 的 `var.less`，定义了一套主题变量。

---

### 三个问题总结

> **uni-app 是在 Vue 语法外面包了一层"真实多页面"和"跨端原生能力"，pages.json 是页面清单而非路由表，uni 插件是一套解决跨端+自动导入+统一管理的封装生态。**

---

### 插件/生态

| uni-app | Vue.js | 说明 |
|---------|-------|------|
| 插件市场 (market.dcloud.net.cn) | npm 生态 (npmjs.com) | 第三方包/插件 |
| `uni-push` | 极光 / Firebase | 推送服务 |
| `uni广告` | Google AdMob | 广告变现 |
| `uni Cloud` | LeanCloud / BaaS | 云开发/后端即服务 |
| `uCharts` | ECharts | 跨端图表库 |

---

## 工程化对比

| uni-app | Vue.js | 说明 |
|---------|-------|------|
| `vue-cli` / `HBuilderX` | Vite / `vue-cli` | 项目脚手架/IDE |
| `pinia` / `vuex` | `pinia` / `vuex` | 状态管理 |
| `uni-app CLI` 项目 | `create-vue` / Vite + Vue3 | 标准工程结构 |
| `easycom` 机制 | — | 自动按需导入组件/插件，无需手动 import |
| 热更新 / 自动编译 | Vite HMR | 开发时热更新 |

---

## 总结

**uni-app = Vue (语法) + 跨端组件 + 统一 API + DCloud 生态**

```
    Vue (语法)
        ↓
   组件层 + 统一 API
        ↓
跨 Windows/Mac/Android/iOS/小程序/H5/快应用
        ↓
   插件市场/云开发
```

**本质：uni-app 就是 Vue，只是在 Vue 语法基础上加了一层统一封装，让一套代码能跑在：**
- iOS / Android（App 端）
- 微信/支付宝/抖音等小程序
- H5 / Web
- 快应用

**Vue 专注 Web 端，uni-app 通过中间层把 Vue 的能力扩展到所有平台。**
