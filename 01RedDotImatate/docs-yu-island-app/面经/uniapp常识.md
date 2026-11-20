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

## onLoad、onMounted 与 :key（页面实例 vs 组件实例）

- `onLoad` 是 **uni-app 页面生命周期**，跟着页面实例走：页面被创建时执行 1 次，能拿到路由 query。`navigateTo` 压入新页面 = 新实例 → `onLoad` 再执行；`onShow` 才是每次回到页面都执行。
- `onMounted` 是 **Vue 组件生命周期**，跟着组件实例走：组件挂载时执行 1 次。只要父组件渲染时复用了同一个组件实例（同位置、同组件、同 key），props 变化不会重跑 `onMounted`，组件里的 ref、分页游标、展开状态都会保留。
- 所以「页面实例不变、只换数据」时，子组件不会自动重新初始化：它的 `onMounted` 早就跑完了，靠它拉数据的逻辑也不会再执行。

### 用 :key 强制重建子组件

```html
<!-- 换笔记时评论区重新挂载：评论列表、分页游标、展开状态一起重置 -->
<CommentSection :key="note.noteId" :article-id="note.noteId" />
```

- key 变了，Vue 判定为新节点、不复用旧实例：旧组件走 `onUnmounted` / `onScopeDispose`，新组件重新 `onMounted`。
- 只改 `:article-id` 不改 key 是 props 更新，实例复用，`onMounted` 不会再跑，旧笔记的评论会留在列表里。
- 等价写法是 `watch(() => props.articleId, ...)` 手动重置；key 直接重建整个子树更省心，代价是子树内的 DOM 和状态全部丢弃。
- 详情页里 `CommentSection` 还套在 `v-if="note"` 中：`note` 初始为 null 时不挂载，详情返回后才第一次挂载。

> 一句话：`onLoad` 管「页面开了」，`onMounted` 管「组件挂上了」；页面不换实例，组件就不会重新挂载，换数据要靠 key 或 watch。

销毁细节见《组件销毁时机》。

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

## 物理返回键与浮层关闭顺序（onBackPress）

> 项目背景：笔记详情页有多个可能叠在页面上的浮层——导航栏展开态、可见性面板、删除确认、评论输入框（键盘）、图片全屏。按 Android 物理返回键时，用户期望**先关掉最上层，而不是直接退出页面**。

```ts
onBackPress(() => {
  if (navbarRef.value?.close()) return true
  if (visibilitySheet.value) {
    visibilitySheet.value = false
    return true
  }
  if (commentSectionRef.value?.closeDeleteConfirm()) return true
  if (commentSectionRef.value?.closeKeyboard()) return true
  if (!fullscreen.value) return false
  void galleryRef.value?.exitFullscreen()
  return true
})
```

- 返回值是"这一下返回键有没有被我消费"：`true` = 已处理，不再执行默认返回；`false` = 放行，系统才会走 `navigateBack`。
- 判断顺序必须**按层级从上层到下层**（z-index / 打开顺序），一次返回只关一层；"全屏"排在默认返回之前，默认返回永远放最后。
- 每层用 `close()` 返回的 boolean 表示"我原来是否开着"，链路才能自然往下走；不要写成互斥的 if-else，否则每加一个浮层都要改所有分支的顺序判断。
- 这个顺序要和页面左上角自定义返回按钮（navbar 的 `@back`）保持一致，否则物理键和按钮会出现两种行为。
- `onBackPress` 只在 App / H5 有效；微信小程序没有可拦截的物理返回键，只能靠页面内按钮。
- 反例：删除确认弹窗开着时按返回，页面直接 `navigateBack`，弹窗和还没提交的评论一起消失——这就是没做拦截的体验问题。
- 新增浮层时，插到它对应层级的位置，并在关闭函数里返回"是否真的关了"，否则链路会提前放行。
