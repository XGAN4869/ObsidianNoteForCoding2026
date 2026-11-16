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

## tab 页与非 tab 页的存活

- 在 `pages.json` 的 `tabBar.list` 里注册的页面是 **tab 页**（本项目首页 `pages/index/index`，见 `pages.json:148-156`）。
  - 被 `navigateTo` 盖住、或 `switchTab` 切走：只触发 `onHide`，**不触发 `onUnload`**；页面实例和组件状态（内存）都保留，回来时触发 `onShow`。
  - 再次 `switchTab` 到同一个 tab，不会重建页面。
- 被 `uni.navigateTo` 打开的是 **普通页面**，压入页面栈：
  - `navigateBack` 返回时触发 `onUnload`，页面销毁，内存状态清空。
  - `switchTab` 跳去 tab 页时，会关闭所有非 tab 页，这些页面同样触发 `onUnload`。
  - `redirectTo` 替换当前页，当前页销毁；`reLaunch` 关闭所有页面。
- 结论：需要跨页保留内存状态的页面，只能做成 tab 页；普通页面返回后状态就没了，要靠本地缓存或 Store 恢复。
- App 切后台不会销毁页面；进程被系统杀掉时，所有页面和内存状态一起清空。
