## 经典高度占满剩余空间
```vue
<template>
  <!-- 最外层容器 flex纵向，占满可视窗口高度 -->
  <div class="page-wrap">
    <div class="chat-bar">
      <!-- t-row 筛选栏 -->
    </div>
    <!-- 这里占剩余全部高度 -->
    <div class="chat-body"></div>
  </div>
</template>

<style lang="less" scoped>
.page-wrap {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.chat-bar {
  /* 高度自动，不需要写死 */
}
.chat-body {
  flex: 1;
  overflow: auto; /* 内容多了内部滚动，不会把页面撑出去 */
}
</style>
```

## 滚动条
- 给元素设置固定最大高度 = 视口
- overflow-y: auto 
	>1. 内部内容高度 **≤ 盒子高度 (100vh)** → 不显示滚动条
	>2. 内部内容高度 **＞ 盒子高度 (100vh)** → 自动出现垂直滚动条，内容超出部分可以滚动查看
- overflow‑x:hidden
	>水平方向：无论内容多宽，直接截断，**永远不出现横向滚动条**。
```js
<div style="height: 100vh; overflow-y: auto; overflow-x: hidden">
```