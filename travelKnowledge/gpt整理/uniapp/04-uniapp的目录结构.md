# uniapp 的目录结构

## 官方文档

https://uniapp.dcloud.net.cn/tutorial/project.html

## 开发工具

下载地址：https://www.dcloud.io/hbuilderx.html

---

## 目录结构一览

```
traveluniapp/                    项目根目录
├── App.vue                     🔺 应用入口组件（第一个运行的组件）
├── main.js                     🔺 全局 JS 文件（类似 vue-cli 的 main.js）
├── index.html                  🔺 H5 入口 HTML 文件
├── pages.json                  🔺 页面配置文件（全局配置页面）
├── manifest.json               🔺 应用配置文件（全局配置应用）
├── uni.scss                    🔺 全局样式文件
├── static/                     🔺 静态资源目录（图片等）
├── pages/                      🔺 页面目录
├── components/                 🔺 组件目录
├── api/                        🔺 API 请求封装
├── uni_modules/                🔺 uni-app 插件模块
└── unpackage/                  🔺 编译输出目录
```

---

## 各文件作用

### App.vue
应用的根组件，**整个 uni-app 项目的第一个组件**，首次运行时会自动加载。

```vue
<script>
  export default {
    onLaunch() { console.log('App Launch') },
    onShow()   { console.log('App Show')   },
    onHide()   { console.log('App Hide')   }
  }
</script>
```

### main.js
全局 JS 文件，**创建 Vue 实例并挂载**，类似 Vue CLI 的 `main.js`。

```javascript
import App from './App'
// ... 条件编译兼容 Vue 2 / Vue 3
const app = new Vue({ ...App })
app.$mount()
```

### index.html
H5 平台的入口 HTML 文件。

### pages.json
**页面配置文件**，配置所有页面的路径、窗口样式、tabBar 等。

### manifest.json
**应用配置文件**，包含应用名称、图标、平台配置等。

### uni.scss
**全局样式文件**，定义全局变量和公共样式。

### static/
静态资源目录，存放图片、字体等静态文件。

### pages/
页面目录，包含各个页面的 .vue 文件。

```javascript
pages/
├── index/index.vue    首页
├── my/my.vue         我的页
├── like/like.vue     收藏页
├── detail/detail.vue 详情页
└── line/line.vue     路线页
```

### components/
公共组件目录，存放可复用的 Vue 组件。

---

## 与 Vue CLI 项目对比

| Vue CLI | uni-app |
|---------|---------|
| `main.js` | `main.js` |
| `App.vue` | `App.vue` |
| `views/` | `pages/` |
| `components/` | `components/` |
| `assets/` | `static/` |
| `router/index.js` | `pages.json` |
| 无 | `manifest.json` |
| 无 | `uni.scss` |

---

## 本项目实际结构

```
traveluniapp/traveluniapp/
├── App.vue                应用入口
├── main.js                全局入口
├── index.html              H5 入口
├── pages.json             页面配置
├── manifest.json          应用配置
├── uni.scss               全局样式
├── static/                静态资源（图片）
├── pages/                 页面文件
│   ├── index/index.vue
│   ├── my/my.vue
│   ├── like/like.vue
│   ├── detail/detail.vue
│   └── line/line.vue
├── api/                    请求封装
│   ├── api.js
│   └── mock.js
├── components/             公共组件
└── uni_modules/            插件模块（uview-plus）
```
