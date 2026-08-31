# uniapp 基础语法

## 官方文档

https://uniapp.dcloud.net.cn/tutorial/syntax-js.html

---

## 模板语法

uni-app 模板基于 Vue 3，支持所有 Vue 模板语法。

### 项目示例：主页结构

文件位置：[pages/index/index.vue](d:/01traveluniapp/traveluniapp/traveluniapp/pages/index/index.vue)

```vue
<template>
  <view class="content">
    <!-- 模板表达式 -->
    <text>{{ message }}</text>

    <!-- 条件渲染 -->
    <view v-if="showTopBtn">...</view>

    <!-- 列表渲染 -->
    <view v-for="(item, index) in list" :key="item.id">
      {{ item.title }}
    </view>

    <!-- 双向绑定 -->
    <input v-model="keyword" />

    <!-- 插槽使用 -->
    <up-waterfall v-model="flowList">
      <template v-slot:left="{leftList}">...</template>
    </up-waterfall>

    <!-- 事件绑定 -->
    <view @click="handleClick">点击</view>
  </view>
</template>
```

---

## 脚本语法（Composition API）

uni-app 支持 Vue 3 的 `<script setup>` 语法，代码更简洁。

### 项目示例：首页脚本

```vue
<script setup>
  import { ref, reactive } from 'vue'
  import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app'
  import { getBanner, getHomeList } from '../../api/api'

  // ref：基本类型响应式
  const keyword = ref('')
  const bannerList = ref([])

  // reactive：对象类型响应式
  const userInfo = reactive({ nickName: '', avatarUrl: '' })

  // 生命周期钩子
  onLoad(() => {
    loadInitialData()
  })

  onReachBottom(() => {
    console.log('触底加载更多')
  })

  onPageScroll((e) => {
    showTopBtn.value = e.scrollTop > 400
  })
</script>
```

### 常用生命周期钩子

| 钩子 | 触发时机 |
|------|----------|
| `onLoad` | 页面加载完成 |
| `onShow` | 页面显示 |
| `onHide` | 页面隐藏 |
| `onReady` | 页面初次渲染完成 |
| `onReachBottom` | 页面触底 |
| `onPageScroll` | 页面滚动 |

---

## 样式语法

### SCSS  scoped 组合使用

```vue
<style lang="scss" scoped>
  .content {
    padding: 20px;

    .banner-box {       /* 嵌套写法 */
      margin-top: 20px;
    }

    .demo-warter {
      &::after {        /* 伪类嵌套 */
        content: "";
      }
    }
  }
</style>
```

---

## API 调用

uni-app 提供全局 `uni` 对象调用各类 API。

### 页面导航

```javascript
// 跳转到详情页
uni.navigateTo({
  url: '/pages/detail/detail?item=' + encodeURIComponent(JSON.stringify(item))
})

// 回到顶部
uni.pageScrollTo({ scrollTop: 0, duration: 300 })
```

### 数据存储

```javascript
// 保存
uni.setStorageSync('userInfo', JSON.stringify(userInfo))

// 读取
const cache = uni.getStorageSync('userInfo')
if (cache) Object.assign(userInfo, JSON.parse(cache))
```

### 交互提示

```javascript
uni.showToast({ title: '操作成功', icon: 'success' })
uni.showLoading({ title: '加载中...' })
uni.hideLoading()
```

---

## 组件使用

本项目使用 uview-plus 组件库，全局引入后可直接使用。

### 项目示例：搜索组件

```vue
<up-search
  placeholder="搜索经典"
  bg-color="#e3e3e3"
  v-model="keyword"
  :show-action="false"
/>
```

### 项目示例：轮播图

```vue
<up-swiper
  v-if="bannerList.length > 0"
  :list="bannerList"
  keyName="image"
  radius="8"
  :autoplay="true"
  showTitle
/>
```

---

## 页面跳转与参数传递

### 跳转

```javascript
// 声明式导航（pages.json 配好的页面）
<navigator url="/pages/detail/detail">跳转</navigator>

//编程式导航
uni.navigateTo({ url: '/pages/detail/detail' })
uni.switchTab({ url: '/pages/index/index' })
uni.redirectTo({ url: '/pages/detail/detail' })
```

### 获取参数

```javascript
onLoad((options) => {
  const item = options.item
})
```

---

## 计算属性与侦听器

```javascript
import { computed, watch } from 'vue'

// 计算属性
const fullName = computed(() => firstName.value + lastName.value)

// 侦听器
watch(keyword, (newVal) => {
  console.log('搜索词：', newVal)
})
```

---

## 注意事项

1. `<script setup>` 中无需 `export default {}`，直接写逻辑
2. 组件库按需引入，全局注册后直接使用如 `<up-button>`
3. 样式 scoped 保证组件样式隔离
4. rpx 单位可自动适配不同屏幕
