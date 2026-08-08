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