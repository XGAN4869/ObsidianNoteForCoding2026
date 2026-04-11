

> 目标：一天内能看懂 uni-app 项目、改页面、调接口、做页面跳转、处理基础多端差异，并能跑到 H5/小程序/App。

  

## 1. 一句话理解 uni-app

  

uni-app 是用 Vue 语法写多端应用的框架。你主要写 `.vue` 页面、`pages.json` 路由配置、`manifest.json` 应用配置，然后编译到 H5、App、微信/支付宝/抖音等小程序。

  

核心心法：

  

```text

uni-app = Vue 写页面 + pages.json 管路由/窗口 + uni API 调系统能力 + 条件编译处理多端差异

```

  

官网入口：

  

- [uni-app 官网](https://uniapp.dcloud.net.cn/)

- [uni-app 快速上手](https://uniapp.dcloud.net.cn/quickstart)

- [工程简介](https://uniapp.dcloud.net.cn/tutorial/project.html)

- [页面](https://uniapp.dcloud.net.cn/tutorial/page.html)

  

## 2. 工程结构必须先懂

  

典型项目结构：

  

```text

pages/          业务页面

components/     公共组件

static/         静态资源，图片、视频等

App.vue         应用入口，放全局生命周期和全局样式

main.js/ts      Vue 初始化入口

pages.json      页面路由、导航栏、tabBar、窗口样式

manifest.json   App、小程序、H5 的发行配置、权限、appid 等

uni.scss        全局 scss 变量，常用于主题色

```

  

一天速成最重要的是这几个文件：

  

| 文件 | 必须掌握 |

|---|---|

| `pages.json` | 注册页面、配置首页、标题栏、tabBar、下拉刷新 |

| `pages/*.vue` | 写页面结构、逻辑、样式 |

| `components` | 抽公共组件 |

| `static` | 放图片等静态资源 |

| `manifest.json` | 配 appid、权限、发行信息 |

  

`pages.json` 的 `pages` 第一项就是首页。新增页面后，如果没有注册到 `pages.json`，页面就打不开。

  

参考：

  

- [pages.json](https://uniapp.dcloud.net.cn/collocation/pages.html)

- [manifest.json](https://uniapp.dcloud.net.cn/collocation/manifest.html)

  

## 3. 页面怎么写

  

uni-app 页面就是 Vue 单文件组件：

  

```vue

<template>

  <view class="page">

    <text>{{ title }}</text>

    <button @click="changeTitle">点我</button>

  </view>

</template>

  

<script>

export default {

  data() {

    return {

      title: 'Hello uni-app'

    }

  },

  onLoad(options) {

    console.log('页面参数', options)

  },

  methods: {

    changeTitle() {

      this.title = '被点了'

    }

  }

}

</script>

  

<style>

.page {

  padding: 32rpx;

}

</style>

```

  

页面三块：

  

| 区域 | 作用 |

|---|---|

| `template` | 页面结构，常用 `view`、`text`、`image`、`button` |

| `script` | 数据、方法、生命周期、请求 |

| `style` | 样式，支持 CSS/SCSS，常用 `rpx` 做移动端适配 |

  

## 4. 生命周期

  

一天速成先记这些：

  

| 生命周期 | 使用场景 |

|---|---|

| `onLaunch` | App 启动，全局初始化，写在 `App.vue` |

| `onShow` | App 或页面显示，回来时也会触发 |

| `onHide` | App 或页面隐藏 |

| `onLoad(options)` | 页面加载，拿路由参数，适合初始化请求 |

| `onReady` | 页面首次渲染完成 |

| `onUnload` | 页面卸载，清理定时器/监听 |

| `onPullDownRefresh` | 下拉刷新 |

| `onReachBottom` | 触底加载更多 |

| `onPageScroll` | 页面滚动监听，慎用频繁更新数据 |

  

重点区别：

  

```js

onLoad(options) {

  // 页面第一次加载，拿参数、请求详情

}

  

onShow() {

  // 页面每次显示都会触发，比如从详情页返回列表页

}

```

  

参考：

  

- [页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html)

- [应用生命周期](https://uniapp.dcloud.net.cn/api/lifecycle.html)

  

## 5. 常用内置组件

  

uni-app 组件接近小程序，不是直接写 HTML 标签。

  

| 组件 | 类比 | 用途 |

|---|---|---|

| `view` | `div` | 容器 |

| `text` | `span` | 文本 |

| `image` | `img` | 图片 |

| `button` | `button` | 按钮 |

| `input` | `input` | 输入框 |

| `textarea` | `textarea` | 多行输入 |

| `scroll-view` | 滚动容器 | 区域滚动 |

| `swiper` | 轮播 | banner、滑动页 |

| `navigator` | 路由链接 | 页面跳转 |

  

示例：

  

```vue

<template>

  <view>

    <image src="/static/logo.png" mode="widthFix" />

    <text>旅行列表</text>

  

    <scroll-view scroll-y class="list">

      <view v-for="item in list" :key="item.id">

        {{ item.name }}

      </view>

    </scroll-view>

  </view>

</template>

```

  

注意：`scroll-view` 做纵向滚动时要给固定高度；普通页面长列表通常优先用页面级滚动。

  

参考：

  

- [组件](https://uniapp.dcloud.net.cn/component/)

- [view](https://uniapp.dcloud.net.cn/component/view.html)

- [scroll-view](https://uniapp.dcloud.net.cn/component/scroll-view.html)

  

## 6. 路由跳转

  

页面必须先在 `pages.json` 注册：

  

```json

{

  "pages": [

    {

      "path": "pages/index/index",

      "style": {

        "navigationBarTitleText": "首页"

      }

    },

    {

      "path": "pages/detail/detail",

      "style": {

        "navigationBarTitleText": "详情"

      }

    }

  ]

}

```

  

常用跳转 API：

  

| API | 作用 |

|---|---|

| `uni.navigateTo` | 保留当前页，跳到非 tabBar 页，可返回 |

| `uni.redirectTo` | 关闭当前页，跳到非 tabBar 页 |

| `uni.switchTab` | 跳到 tabBar 页面 |

| `uni.reLaunch` | 关闭所有页面，打开新页面 |

| `uni.navigateBack` | 返回上一页 |

  

示例：

  

```js

uni.navigateTo({

  url: '/pages/detail/detail?id=123'

})

```

  

详情页接参数：

  

```js

onLoad(options) {

  console.log(options.id)

}

```

  

选择规则：

  

| 场景 | 用哪个 |

|---|---|

| 首页到详情页 | `navigateTo` |

| 登录成功去首页 | `reLaunch` 或 `switchTab` |

| 跳 tabBar 页 | `switchTab` |

| 返回上一页 | `navigateBack` |

  

关键限制：

  

- `navigateTo`、`redirectTo` 只能打开非 tabBar 页面。

- `switchTab` 只能打开 tabBar 页面。

- `reLaunch` 可以打开任意页面。

  

参考：[路由 API](https://uniapp.dcloud.net.cn/api/router.html)

  

## 7. 请求接口

  

uni-app 用 `uni.request`：

  

```js

uni.request({

  url: 'https://example.com/api/list',

  method: 'GET',

  data: {

    page: 1

  },

  success: (res) => {

    console.log(res.data)

  },

  fail: (err) => {

    console.error(err)

  }

})

```

  

真实项目建议封装：

  

```js

export function request(options) {

  return new Promise((resolve, reject) => {

    uni.request({

      url: 'https://example.com' + options.url,

      method: options.method || 'GET',

      data: options.data || {},

      header: {

        'content-type': 'application/json'

      },

      success: (res) => {

        resolve(res.data)

      },

      fail: reject

    })

  })

}

```

  

注意：

  

- 小程序运行时通常需要配置合法域名。

- H5 本地调试要注意跨域。

- `content-type` 默认常见为 `application/json`，具体项目按后端要求配置。

  

参考：[uni.request](https://uniapp.dcloud.net.cn/api/request/request.html)

  

## 8. 本地缓存

  

常用于 token、用户信息、草稿：

  

```js

uni.setStorageSync('token', 'xxx')

  

const token = uni.getStorageSync('token')

  

uni.removeStorageSync('token')

  

uni.clearStorageSync()

```

  

异步写法：

  

```js

uni.setStorage({

  key: 'user',

  data: {

    name: 'Tom'

  },

  success() {

    console.log('保存成功')

  }

})

```

  

注意：不要使用 `uni-`、`uni_`、`dcloud-`、`dcloud_` 作为 key 前缀，这些是系统保留前缀。

  

参考：[Storage](https://uniapp.dcloud.net.cn/api/storage/storage.html)

  

## 9. 提示、弹窗、loading

  

高频 API：

  

```js

uni.showToast({

  title: '保存成功',

  icon: 'success'

})

  

uni.showToast({

  title: '请先登录',

  icon: 'none'

})

  

uni.showLoading({

  title: '加载中'

})

  

uni.hideLoading()

  

uni.showModal({

  title: '提示',

  content: '确定删除吗？',

  success(res) {

    if (res.confirm) {

      console.log('用户确认')

    }

  }

})

```

  

参考：[交互反馈 API](https://uniapp.dcloud.net.cn/api/ui/prompt.html)

  

## 10. 样式和适配

  

uni-app 的 CSS 和 Web 大体一致，但移动端建议多用 `rpx`：

  

```css

.card {

  width: 690rpx;

  margin: 30rpx;

  padding: 24rpx;

}

```

  

常用单位：

  

| 单位 | 用法 |

|---|---|

| `rpx` | 推荐移动端适配，750rpx 等于屏幕宽度 |

| `px` | 固定像素 |

| `%` | 普通布局可用 |

| `vh/vw` | vue 页面支持，nvue 有限制 |

  

注意：`vue` 页面是 webview 渲染；`nvue`、`uvue` 是原生渲染，CSS 支持范围更有限。

  

参考：[页面样式与布局](https://uniapp.dcloud.net.cn/tutorial/syntax-css.html)

  

## 11. 条件编译

  

条件编译是 uni-app 跨端开发的核心能力。不同平台写不同代码，用特殊注释：

  

```js

// #ifdef MP-WEIXIN

console.log('只在微信小程序编译')

// #endif

  

// #ifdef APP

console.log('只在 App 编译')

// #endif

  

// #ifndef H5

console.log('除了 H5 都编译')

// #endif

```

  

模板里：

  

```vue

<!-- #ifdef MP-WEIXIN -->

<official-account></official-account>

<!-- #endif -->

```

  

样式里：

  

```css

/* #ifdef H5 */

.page {

  cursor: pointer;

}

/* #endif */

```

  

常见平台值：

  

| 平台值 | 含义 |

|---|---|

| `WEB` / `H5` | Web/H5 |

| `APP` | App |

| `APP-ANDROID` | Android App |

| `APP-IOS` | iOS App |

| `MP-WEIXIN` | 微信小程序 |

| `MP-ALIPAY` | 支付宝小程序 |

| `MP` | 各类小程序 |

| `VUE3` | Vue3 项目 |

| `UNI-APP-X` | uni-app x 项目 |

  

参考：[条件编译处理多端差异](https://uniapp.dcloud.net.cn/tutorial/platform.html)

  

## 12. 一天学习路线

  

### 上午：能跑起来、能看懂结构

  

1. 安装 HBuilderX，创建 `uni-app` 项目。

2. 跑 H5：运行到浏览器。

3. 打开 `pages.json`，看首页、页面标题、tabBar。

4. 打开 `pages/index/index.vue`，理解 `template/script/style`。

5. 新增一个 `pages/detail/detail.vue`，并注册到 `pages.json`。

  

### 下午：能做业务页面

  

1. 练 `view/text/image/button/input/scroll-view`。

2. 练 `data`、`methods`、`v-for`、`v-if`、事件绑定。

3. 从首页 `navigateTo` 到详情页，并通过 `onLoad` 接收参数。

4. 用 `uni.request` 拉一个接口。

5. 用 `uni.setStorageSync` 保存 token 或用户信息。

6. 加 `showToast`、`showLoading`、`showModal`。

  

### 晚上：掌握真实项目必备点

  

1. 配 tabBar。

2. 封装 request。

3. 用 `onPullDownRefresh` 做下拉刷新。

4. 用 `onReachBottom` 做分页加载。

5. 用条件编译处理 H5/微信/App 差异。

6. 尝试发行 H5 或运行到微信开发者工具。

  

## 13. 速成必背代码模板

  

```vue

<template>

  <view class="page">

    <view v-for="item in list" :key="item.id" @click="goDetail(item)">

      {{ item.title }}

    </view>

  </view>

</template>

  

<script>

export default {

  data() {

    return {

      list: [],

      page: 1

    }

  },

  onLoad() {

    this.getList()

  },

  onPullDownRefresh() {

    this.page = 1

    this.getList(true)

  },

  onReachBottom() {

    this.page++

    this.getList()

  },

  methods: {

    getList(refresh = false) {

      uni.request({

        url: 'https://example.com/api/list',

        data: {

          page: this.page

        },

        success: (res) => {

          const rows = res.data.list || []

          this.list = refresh ? rows : this.list.concat(rows)

        },

        complete: () => {

          uni.stopPullDownRefresh()

        }

      })

    },

    goDetail(item) {

      uni.navigateTo({

        url: `/pages/detail/detail?id=${item.id}`

      })

    }

  }

}

</script>

  

<style>

.page {

  padding: 24rpx;

}

</style>

```

  

## 14. 最容易踩坑的地方

  

| 坑 | 正确做法 |

|---|---|

| 新建页面后打不开 | 检查是否注册到 `pages.json` |

| 跳 tabBar 页面失败 | 用 `uni.switchTab`，不能用 `navigateTo` |

| 参数丢失或乱码 | 用 `encodeURIComponent` / `decodeURIComponent` |

| `onShow` 里重复请求 | 判断是否真的需要每次回来都刷新 |

| `scroll-view` 不滚动 | 必须给固定高度，并设置 `scroll-y` |

| H5 请求失败 | 多半是跨域 |

| 微信小程序请求失败 | 检查合法域名白名单 |

| 样式在 App/nvue 不生效 | nvue/uvue CSS 支持范围比 web 少 |

| 多端差异写满 if else | 用条件编译 |

| 图片路径混乱 | 本地静态资源放 `static` |

  

## 15. 一天结束后你应该能做到

  

1. 看懂 uni-app 项目目录。

2. 新增页面并配置路由。

3. 写基本页面和组件。

4. 调接口并渲染列表。

5. 页面跳转和传参。

6. 使用缓存、弹窗、loading。

7. 做下拉刷新和触底加载。

8. 配 tabBar。

9. 处理简单多端差异。

10. 跑 H5 或微信小程序。