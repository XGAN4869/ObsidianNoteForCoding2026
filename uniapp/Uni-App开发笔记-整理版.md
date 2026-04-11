# Uni-App 企业级开发笔记整理

> 基于他人笔记重构，对比 Vue 后台管理，标注关键差异

---

## 一、组件划分规则

uni-app 沿用 Vue 开发的三类组件划分：

| 类型 | 说明 | uni-app 实现 |
|------|------|-------------|
| **页面组件** | 对应 pages.json 中注册的页面 | 放在 `pages/` 目录下，每个文件对应一个路由 |
| **业务组件** | 可复用的业务逻辑组件 | 放在 `components/` 目录下，使用 easycom 自动引入 |
| **公共展示组件（UI组件）** | 纯 UI 展示组件 | 使用 uview-plus 等 UI 库，配置 easycom 后自动全局可用 |

### 落地方式

**easycom 自动化引入（无需手动 import）：**

```json
// pages.json 或 uni.scss 中配置
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^up-(.*)": "uview-plus/components/u-$1/u-$1.vue"
    }
  }
}
```

```vue
<!-- 直接使用，无需 import -->
<up-button type="primary">按钮</up-button>
```

---

## 二、路由架构（重点差异）

**核心区别：uni-app 没有 Vue Router，路由统一写在 `pages.json`**

### 标准 pages.json 配置示例

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
        "navigationBarTitleText": "详情页"
      }
    }
  ],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#2867CE",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "/static/tabbar/home.png",
        "selectedIconPath": "/static/tabbar/home-active.png",
        "text": "首页"
      },
      {
        "pagePath": "pages/my/my",
        "iconPath": "/static/tabbar/my.png",
        "selectedIconPath": "/static/tabbar/my-active.png",
        "text": "我的"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "uni-app",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  }
}
```

### 路由跳转方式

```javascript
// 跳转到非 tabBar 页面（保留当前页）
uni.navigateTo({ url: '/pages/detail/detail?id=1' })

// 跳转到 tabBar 页面（关闭所有非 tabBar 页面）
uni.switchTab({ url: '/pages/my/my' })

// 关闭当前页，跳转到新页面
uni.redirectTo({ url: '/pages/detail/detail' })

// 回到上一页
uni.navigateBack()

// 关闭所有页面，打开到应用首页
uni.reLaunch({ url: '/pages/index/index' })
```

### 与 Vue Router 的核心差异

| 特性 | Vue Router | uni-app pages.json |
|------|-----------|-------------------|
| 路由定义 | 在 Vue 文件中 | 集中在 pages.json |
| 动态路由 | `:id` 形式 | 直接在 url 传参 `?id=1` |
| 嵌套路由 | `<router-view>` | 直接页面跳转，无需嵌套 |
| 路由守卫 | beforeEach | 使用 `uni-id` 配合后端鉴权 |

---

## 三、状态管理架构（Pinia）

目录结构与 Vue 后台基本一致：

```
store/
├── index.js          # 创建 pinia 实例
├── modules/
│   ├── user.js       # 用户模块
│   ├── cart.js       # 购物车模块
│   └── global.js      # 全局配置模块
```

### 1. 应用初始化层 main.js

```javascript
// #ifdef VUE3
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = Pinia.createPinia()
  app.use(pinia)
  return { app, pinia }
}
// #endif
```

### 2. 状态管理层 store/index.js

```javascript
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    title: '计数器',
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    },
    setTitle(newTitle) {
      this.title = newTitle
    }
  },
  getters: {
    doubleCount: (state) => state.count * 2
  }
})
```

### 3. 组件中使用

```vue
<script setup>
import { useCounterStore } from '@/store/index.js'

const counterStore = useCounterStore()

// 访问 state
console.log(counterStore.count)

// 调用 action
counterStore.increment()

// 访问 getter
console.log(counterStore.doubleCount)
</script>
```

### 与 Vue 后台的微小差异

- 无需在 main.js 中使用 `createPinia()`，而是 `Pinia.createPinia()`
- 小程序环境中建议使用同步存储 `uni.getStorageSync()` 配合 Pinia 做持久化

---

## 四、组件 & 页面通信方案

### 1. 父子通信（props / emit）

**父组件：**
```vue
<template>
  <Counter title="计数器" @total="handleTotal" />
</template>

<script setup>
const handleTotal = (payload) => {
  console.log('子组件触发：', payload.type)
}
</script>
```

**子组件 Counter.vue：**
```vue
<template>
  <view>
    <button @click="add">增加</button>
    <view>{{ count }}</view>
  </view>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

defineProps({
  title: String
})

const emit = defineEmits(['total'])
const count = ref(0)

const add = () => {
  count.value++
  emit('total', { type: 'add', value: count.value })
}
</script>
```

### 2. 兄弟/跨页面通信

**方案 A：通过 Pinia 全局状态**
```javascript
// store/modules/global.js
export const useGlobalStore = defineStore('global', {
  state: () => ({
    sharedData: null
  })
})
```

**方案 B：路由传参（复杂对象需要序列化）**

列表页跳转：
```javascript
const goDetail = (item) => {
  uni.navigateTo({
    url: `/pages/detail/detail?item=${encodeURIComponent(JSON.stringify(item))}`
  })
}
```

详情页接收：
```javascript
onLoad((opt) => {
  try {
    const data = JSON.parse(decodeURIComponent(opt.item))
    Object.assign(itemData, data)
  } catch (error) {
    console.error('数据解析失败:', error)
  }
})
```

### 3. 全局状态（Pinia）

```javascript
// any-component.js
import { useGlobalStore } from '@/store/modules/global.js'

const globalStore = useGlobalStore()
globalStore.sharedData = 'hello'
```

### 4. 路由传参

| 方式 | 说明 | 示例 |
|------|------|------|
| url 参数 | 简单数据 | `?id=1&name=test` |
| 复杂对象 | 需 JSON.stringify + encodeURIComponent | `?item=${encodeURIComponent(JSON.stringify(obj))}` |

---

## 五、网络请求封装（重点差异）

**核心区别：uni-app 没有 axios，使用 `uni.request`**

### 1. 请求封装 http.js

```javascript
// api/http.js
const baseUrl = 'https://api.example.com'

export default function http(url, data, method = 'GET') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: baseUrl + url,
      data,
      method,
      header: {
        'token': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.data.code === 1) {
          resolve(res.data)
        } else {
          uni.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
          reject(res.data.msg)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}
```

### 2. API 模块化管理 api.js

```javascript
// api/api.js
import http from './http.js'

export const getBanner = () => http('/user/getBanner')

export const getHomeList = () => http('/user/getHomeList')

export const login = (data) => http('/user/login', data, 'POST')
```

### 3. 页面中调用

```vue
<script setup>
import { getBanner } from '@/api/api.js'
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  getBanner().then(res => {
    if (res.code === 1) {
      bannerList.value = res.data.bannerList
    }
  })
})
</script>
```

### 与 axios 的核心差异

| 特性 | axios | uni.request |
|------|-------|-------------|
| 引入方式 | `import axios from 'axios'` | 直接使用 `uni.request` |
| 请求拦截器 | 通过 axios.interceptors | 在 http.js 封装函数中处理 |
| 响应拦截器 | 同上 | 同上 |
| 响应数据结构 | `res.data` | `res.data`（一致） |
| 错误处理 | catch 捕获 | Promise reject 捕获 |

### 4. Mock 数据模拟（开发环境）

```javascript
// api/mockData/pageApi.js
export const getBanner = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 1,
        data: {
          bannerList: [{ image: '/static/banner.jpg' }]
        }
      })
    }, 100)
  })
}
```

```javascript
// api/http.js 中添加拦截
if (process.env.NODE_ENV === 'development') {
  if (url.includes('user/getBanner')) {
    return Promise.resolve(getBanner())
  }
}
```

---

## 六、生命周期差异（非常关键）

**核心区别：uni-app 页面使用特有的生命周期，与 Vue 后台管理完全不同**

### 页面生命周期（对应 Vue 的 onMounted）

| 生命周期 | 说明 | 使用场景 |
|---------|------|---------|
| `onLoad` | 页面加载时调用，可获取路由参数 | **初始化数据、请求接口** |
| `onShow` | 页面显示时调用（每次切回来都触发） | 刷新页面数据、埋点 |
| `onReady` | 页面初次渲染完成 | 获取 DOM、启动动画 |
| `onHide` | 页面隐藏（切到后台） | 暂停定时器、录音等 |
| `onUnload` | 页面卸载（关闭或跳转） | 清理资源、取消订阅 |
| `onPageScroll` | 页面滚动 | 监听滚动位置、显示回到顶部 |
| `onReachBottom` | 页面触底 | 加载更多、分页请求 |

### 组件生命周期（与 Vue 基本一致）

| 生命周期 | 说明 |
|---------|------|
| `onMounted` | 组件挂载 |
| `onUnmounted` | 组件卸载 |
| `onBeforeMount` | 挂载前 |
| `onBeforeUnmount` | 卸载前 |

### 典型使用场景对比

```vue
<script setup>
import { onLoad, onShow, onReachBottom, onPageScroll } from '@dcloudio/uni-app'

// ✅ 初始化数据（相当于 onMounted）
onLoad(() => {
  fetchData()
})

// ✅ 每次进入页面刷新
onShow(() => {
  refreshData()
})

// ✅ 触底加载更多
onReachBottom(() => {
  loadMore()
})

// ✅ 监听滚动
onPageScroll((e) => {
  showTopBtn.value = e.scrollTop > 400
})
</script>
```

### 记忆口诀

- **onLoad**：页面加载，只执行一次 → 初始请求
- **onShow**：每次显示就执行 → 刷新数据
- **onReady**：渲染完成 → 获取 DOM
- **onUnload**：页面卸载 → 清理资源

---

## 七、禁止操作与限制（必看）

uni-app（小程序/H5）**不能做**而 Vue 后台管理可以做的事：

### 1. 不能操作 DOM

```javascript
// ❌ 禁止使用
document.querySelector('.box')
document.getElementById('app')
window.document.body

// ✅ 使用 ref 获取组件
const uWaterfallRef = ref(null)
uWaterfallRef.value // 可以操作组件实例
```

### 2. 不能用 window 对象相关 API

```javascript
// ❌ 禁止使用
window.location.href
window.alert()
window.confirm()
window.open()
window.localStorage  // ✅ 用 uni.setStorageSync 代替

// ✅ 使用 uni API
uni.navigateTo({ url: '/pages/index/index' })
uni.showToast({ title: '提示' })
uni.setStorageSync('key', 'value')
```

### 3. 不能直接引入大部分基于浏览器的 npm 包

| 包类型 | 示例 | 解决方案 |
|--------|------|---------|
| DOM 库 | jQuery | 不需要，uni-app 已经封装好 |
| 浏览器 API | 各种 polyfill | 使用 uni API |
| Canvas 库 | html2canvas | 使用 uni.canvasTempFilePath |
| 文件处理 | FileSaver | 使用 uni.saveFile |

### 4. 其他限制

- 不支持 `eval()`（安全限制）
- 不支持动态执行代码 `new Function()`
- 不支持某些 ES6+ 特性（取决于目标平台）
- storage 上限 10MB（小程序）
- 字体文件需放在 static 目录下

---

## 八、完整业务示例

**从页面打开 → 请求接口 → Pinia 存储 → 页面渲染 → 组件调用**

### 业务场景：旅游 App 首页瀑布流 + 详情页

### 1. 目录结构

```
├── api/
│   ├── http.js          # 请求封装
│   ├── api.js           # API 接口管理
│   └── mockData/
│       └── pageApi.js   # Mock 数据
├── components/
│   └── WaterfallItem/   # 瀑布流项组件
│       └── WaterfallItem.vue
├── pages/
│   ├── index/
│   │   └── index.vue    # 首页
│   ├── detail/
│   │   └── detail.vue   # 详情页
│   └── line/
│       └── line.vue     # 地图导览
├── store/
│   ├── index.js         # Pinia 入口
│   └── modules/
│       └── user.js      # 用户模块
├── static/
└── pages.json
```

### 2. 封装请求层

```javascript
// api/http.js
const baseUrl = 'https://api.example.com'

export default function http(url, data, method = 'GET') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: baseUrl + url,
      data,
      method,
      header: { 'token': uni.getStorageSync('token') || '' },
      success: (res) => {
        if (res.data.code === 1) resolve(res.data)
        else reject(res.data.msg)
      },
      fail: reject
    })
  })
}
```

```javascript
// api/api.js
import http from './http.js'

export const getBanner = () => http('/user/getBanner')
export const getHomeList = () => http('/user/getHomeList')
export const login = (data) => http('/user/login', data, 'POST')
export const getUserInfo = () => http('/user/info')
```

### 3. Pinia 状态管理

```javascript
// store/modules/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    nickName: '',
    avatarUrl: '',
    token: ''
  }),
  actions: {
    setUserInfo(info) {
      this.nickName = info.nickName
      this.avatarUrl = info.avatarUrl
    },
    setToken(token) {
      this.token = token
      uni.setStorageSync('token', token)
    },
    loginOut() {
      this.$reset()
      uni.clearStorageSync()
    }
  }
})
```

### 4. 首页瀑布流实现

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="content">
    <up-search v-model="keyword" placeholder="搜索" :show-action="false" />
    
    <view class="banner-box">
      <up-swiper v-if="bannerList.length > 0" :list="bannerList" keyName="image" />
    </view>
    
    <view class="list">
      <up-waterfall v-model="flowList">
        <template v-slot:left="{leftList}">
          <WaterfallItem :list="leftList" @click="goDetail" />
        </template>
        <template v-slot:right="{rightList}">
          <WaterfallItem :list="rightList" @click="goDetail" />
        </template>
      </up-waterfall>
    </view>
    
    <view v-if="showTopBtn" @click="handleToTop" class="top-btn">
      <up-icon name="arrow-upward" color="#fff" />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app'
import { getBanner, getHomeList } from '@/api/api.js'

const keyword = ref('')
const bannerList = ref([])
const flowList = ref([])
const showTopBtn = ref(false)

// 请求数据
onLoad(() => {
  Promise.all([getBanner(), getHomeList()]).then(([bannerRes, listRes]) => {
    if (bannerRes.code === 1) bannerList.value = bannerRes.data.bannerList
    if (listRes.code === 1) flowList.value = listRes.data
  })
})

// 触底加载
onReachBottom(() => {
  uni.showLoading()
  setTimeout(() => {
    loadMore()
    uni.hideLoading()
  }, 500)
})

// 滚动显示回到顶部
onPageScroll((e) => {
  showTopBtn.value = e.scrollTop > 400
})

// 跳转详情
const goDetail = (item) => {
  uni.navigateTo({
    url: `/pages/detail/detail?item=${encodeURIComponent(JSON.stringify(item))}`
  })
}

const handleToTop = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 300 })
}
</script>

<style lang="scss" scoped>
.content { padding: 20rpx; min-height: 100vh; }
.top-btn {
  position: fixed; bottom: 120rpx; right: 40rpx;
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
}
</style>
```

### 5. 详情页实现

```vue
<!-- pages/detail/detail.vue -->
<template>
  <view class="detail">
    <up-navbar bg-color="transparent" :autoBack="true" />
    
    <scroll-view scroll-y class="scroll-container">
      <image :src="itemData.img" mode="aspectFill" class="detail-image" />
      
      <view class="d-content">
        <view class="tit-row">
          <text class="main-title">{{ itemData.title }}</text>
          <up-tag text="5A级景区" shape="circle" />
        </view>
        
        <view class="jj">
          <text class="label">景区介绍</text>
          <text class="nr">{{ itemData.introduce }}</text>
        </view>
        
        <view class="jj">
          <text class="label">开放时间</text>
          <text class="nr">{{ itemData.times }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const itemData = reactive({
  id: 0, title: '', img: '', introduce: '', times: ''
})

onLoad((opt) => {
  if (opt.item) {
    try {
      Object.assign(itemData, JSON.parse(decodeURIComponent(opt.item)))
    } catch (e) {
      uni.showToast({ title: '数据加载失败', icon: 'none' })
    }
  }
})
</script>

<style lang="scss" scoped>
.detail { min-height: 100vh; background: #f8f8f8; }
.scroll-container { height: 100vh; }
.detail-image { width: 100%; height: 650rpx; }
.d-content {
  margin-top: -60rpx; background: #fff; border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 30rpx; position: relative; z-index: 10;
}
.jj { margin-bottom: 40rpx; }
.label { display: block; font-size: 30rpx; font-weight: bold; margin-bottom: 15rpx; }
.nr { display: block; font-size: 28rpx; color: #666; line-height: 1.6; }
</style>
```

### 6. 瀑布流项组件

```vue
<!-- components/WaterfallItem/WaterfallItem.vue -->
<template>
  <view v-for="item in list" :key="item.id" class="waterfall-item" @click="$emit('click', item)">
    <up-lazy-load :image="item.img" border-radius="10" />
    <view class="title">{{ item.title }}</view>
    <view class="price">{{ item.times }}</view>
    <view class="tag" v-if="item.tag">
      <view class="tag-item" v-for="(t, i) in item.tag" :key="i">{{ t }}</view>
    </view>
  </view>
</template>

<script setup>
defineProps({ list: Array })
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.waterfall-item {
  margin: 10rpx; background: #fff; border-radius: 16rpx; padding: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.title { font-size: 28rpx; font-weight: bold; margin-top: 10rpx; }
.price { font-size: 22rpx; color: #909399; margin-top: 10rpx; }
.tag { display: flex; margin-top: 10rpx; }
.tag-item {
  border: 1rpx solid #ffaa00; color: #ffaa00; font-size: 18rpx;
  padding: 2rpx 10rpx; border-radius: 50rpx; margin-right: 10rpx;
}
</style>
```

### 7. 用户登录完整流程

```vue
<!-- pages/my/my.vue -->
<template>
  <view class="content">
    <view class="user-card" @click="handleCardClick">
      <image :src="userInfo.avatarUrl || '/static/default.png'" />
      <view class="name">{{ userInfo.nickName || '登录/注册' }}</view>
    </view>
    
    <up-popup :show="showLogin" mode="bottom">
      <view class="login-form">
        <button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image :src="tempAvatar || '/static/default.png'" />
        </button>
        <input type="nickname" v-model="tempName" placeholder="点击获取昵称" @blur="onNicknameBlur" />
        <view class="protocol" @click="isAgree = !isAgree">
          <view :class="{ checked: isAgree }"></view>
          <text>我已阅读并同意《用户协议》</text>
        </view>
        <button @click="saveProfile">确认提交</button>
      </view>
    </up-popup>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { login, getUserInfo } from '@/api/api.js'
import { useUserStore } from '@/store/modules/user.js'

const userStore = useUserStore()
const userInfo = reactive({ nickName: '', avatarUrl: '' })
const tempAvatar = ref('')
const tempName = ref('')
const showLogin = ref(false)
const isAgree = ref(false)

onLoad(() => {
  const cache = uni.getStorageSync('user_info')
  if (cache) Object.assign(userInfo, cache)
})

const handleCardClick = () => {
  if (userInfo.nickName) return
  uni.showModal({
    title: '提示',
    content: '授权登录后可使用完整功能',
    success: (res) => { if (res.confirm) showLogin.value = true }
  })
}

const onChooseAvatar = (e) => { tempAvatar.value = e.detail.avatarUrl }
const onNicknameBlur = (e) => { tempName.value = e.detail.value }

const saveProfile = async () => {
  if (!isAgree.value) return uni.showToast({ title: '请勾选协议', icon: 'none' })
  
  uni.showLoading({ title: '登录中...' })
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    const res = await login({ 
      code: loginRes.code,
      nickName: tempName.value,
      avatarUrl: tempAvatar.value
    })
    
    if (res.token) {
      uni.setStorageSync('token', res.token)
      userStore.setToken(res.token)
    }
    
    const userRes = await getUserInfo()
    userInfo.nickName = userRes.nickName || tempName.value
    userInfo.avatarUrl = userRes.avatarUrl || tempAvatar.value
    
    uni.setStorageSync('user_info', userInfo)
    userStore.setUserInfo(userInfo)
    
    showLogin.value = false
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>
```

---

## 快速对比表（vs Vue 后台管理）

| 方面 | Vue 后台管理 | uni-app |
|------|------------|---------|
| **路由** | Vue Router (分散在 .vue 文件) | pages.json (集中管理) |
| **网络请求** | axios + 拦截器 | uni.request |
| **生命周期** | onMounted / onUnmounted | onLoad / onShow / onReady / onUnload |
| **DOM 操作** | document.querySelector | 禁止，只能用 ref 操作组件实例 |
| **window API** | window.location 等 | 禁止，使用 uni API |
| **组件库** | element-ui / ant-design | uview-plus / uni-ui |
| **npm 包** | 无限制 | 限于不支持浏览器 API 的包 |
| **响应式单位** | px / rem / em | rpx (推荐) |
| **存储** | localStorage | uni.setStorageSync |
