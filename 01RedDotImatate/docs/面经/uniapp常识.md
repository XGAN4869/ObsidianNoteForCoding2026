## 生命周期
- onShow /onHide 是【页面级路由事件】，只和页面栈有关；页面内部用 swiper / 横向 scroll-view 滑动切换子组件，完全不会触发页面的 onShow /onHide！
- 触发 onHide
  - 跳转去`uni.navigateTo` 打开新页面（最常见）
  - tabbar 切换（`switchTab`）,不会触发 onUnload
- 触发 onUnload 销毁
  - 返回 `navigateBack` 触发 onUnload

- 页面声明周期和 应用生命周期 
  - 1. **页面里写的 `onHide(()=>{})`（页面生命周期）：App 切后台，不会触发！**
  - 2. **App.vue 里面的 `onHide`（应用生命周期）：切后台才会触发**uni-app
