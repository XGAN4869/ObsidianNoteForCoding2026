# 首页信息流工程总结

更新于 2026-11-13。本文以当前首页实现为准。组件之间的 props、事件和调用顺序见[首页目录结构与数据流向](../../../src/pages/index/docs/首页目录结构与数据流向.md)。

## 1. 当前进度

| 功能 | 已实现 |
| --- | --- |
| 发现与关注 | 两条流各自加载和保存浏览进度。发现允许游客浏览。关注流未登录显示登录入口，空态可以去发现或关注推荐作者。 |
| 首屏与刷新 | 有效缓存先展示，随后请求最新首屏。支持下拉刷新和失败重试，有旧内容时保留列表。 |
| 游标分页 | 触底或点击「继续加载」加载下一批。按笔记 ID 去重，检测游标未推进，末页停止请求。发现流的快照版本变化时，用当前响应整页替换。 |
| 双列布局 | 新卡片测量完成后再提交布局。普通翻页追加到较矮列，首屏和刷新重建双列。 |
| 窗口化与切页 | 视图只渲染视口及上下缓冲区内的卡片，外层保留完整内容高度。发现与关注支持横滑跟手和吸附，分别记住滚动位置。 |
| 账号隔离 | 切换账号时重建两条流并清空滚动记录。旧实例卸载后会拦截晚到的请求或测量结果。 |

## 2. 关键实现

### 加载、缓存与防重入

首页下拉时通过当前流的组件 `ref` 调用 `refresh()`，触底时调用 `loadMore()`。两个流组件用 `defineExpose` 暴露这两个入口。视图内的重试和继续加载分别通过 `retry`、`more` 事件交给所属流组件。

首屏、翻页、刷新和重试都进入 `useHomeFeed.loadPage()`。`initialized` 记录首屏是否已启动。每条流的 `busy` 在首次等待前置为 `true`，覆盖缓存恢复、接口请求、测量和布局提交，期间新的加载触发直接返回。`finally` 清理 `busy` 和加载阶段。请求失败时记住失败阶段，重试沿用该阶段，翻页失败保留原游标。

首屏缓存按账号和流类型隔离，有效期 30 分钟，保存列表、游标、末页状态和推荐作者。恢复时重新测量，测量失败时按样式令牌估算尺寸。网络请求成功且新卡片测量通过后，替换布局并写入新快照。普通翻页只追加到内存中的布局。缓存过期在读取时判断。

### 卡片测量与窗口化

`HomeFeedView` 通过 `defineExpose` 暴露 `measure(notes)`。流组件把 `list.value!.measure(notes)` 传给 `useHomeFeed`。测量区复用正式卡片，通过一次节点查询读取整批卡片宽高与列间距，结束后清空临时节点。普通翻页只测量去重后待追加的卡片。

`useHomeFeedLayout` 按笔记 ID 匹配实测高度，由 `useWaterfall` 提交列布局。两列同高时优先放左列，追加时保留已有卡片的列和坐标。最终用 `state` prop 把 `view.columns` 和 `view.contentHeight` 传回视图。

视图以页面滚动位置扣除导航偏移后的值计算窗口，使用卡片的顶部和底部判断是否与窗口相交。外层按完整列高占位，离屏节点卸载时页面高度保持稳定。布局数据仍保留在内存中，挂载节点数和内存占用需要分别验证。

### 页面隐藏与返回

`onHide()` 更新首页可见状态并取消横滑，`onShow()` 恢复当前流的滚动位置。只要首页实例仍在，离开前发起的刷新可以继续。请求和测量成功后，`loadPage('refresh')` 提交新布局，返回时通过同一个 `view` 渲染。如果刷新仍在进行，列表可以继续显示「正在加载」。

## 3. 验证与待接入

- **本轮通过** — `node scripts/check-feed.mjs`、`npm run type-check` 和 `npm run lint`。脚本使用模拟响应，覆盖双流隔离、快照切换、分页去重与重试、缓存恢复、卸载后旧响应、滚动恢复和横滑。
- **待接详情** — 卡片的 `open(id)` 目前转发到发现或关注组件。首页尚未绑定 `@open`，详情路由和详情回写尚未接入。详情确认的互动变化和删除结果需要在这条链路接通后验证。
- **待验证跨页刷新** — 接回详情后，分别验证刷新在离页期间完成、返回时仍在请求、响应到达时首页已隐藏三种情况。核对新卡片测量是否返回、返回后的列表与滚动位置，以及顶部原生下拉指示器是否正确结束。本轮未在真实后端或 App 真机跑通这条链路。

## 4. 修改入口

| 想改的功能 | 文件 |
| --- | --- |
| Tab、页面生命周期、触底和滚动恢复 | [index.vue](../../../src/pages/index/index.vue) |
| 横向跟手、预览与吸附 | [HomeFeedPager.vue](../../../src/pages/index/pager/HomeFeedPager.vue) |
| 发现、关注与登录差异 | [HomeDiscoverFeed.vue](../../../src/pages/index/feed/HomeDiscoverFeed.vue)、[HomeFollowingFeed.vue](../../../src/pages/index/feed/HomeFollowingFeed.vue) |
| 加载阶段、游标、重试与提交 | [useHomeFeed.ts](../../../src/pages/index/feed/composables/useHomeFeed.ts)、[feed.ts](../../../src/api/modules/feed.ts) |
| 首屏缓存和尺寸估算 | [cache.ts](../../../src/pages/index/feed/utils/cache.ts)、[cardSize.ts](../../../src/pages/index/feed/utils/cardSize.ts) |
| 卡片实测、窗口化与列布局 | [HomeFeedView.vue](../../../src/pages/index/feed/components/HomeFeedView.vue)、[useHomeFeedLayout.ts](../../../src/pages/index/feed/composables/useHomeFeedLayout.ts)、[useWaterfall.ts](../../../src/pages/index/feed/composables/useWaterfall.ts) |
