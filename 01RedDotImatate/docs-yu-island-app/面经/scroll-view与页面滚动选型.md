# scroll-view 与页面滚动选型

uni-app 里两种滚动方式的能力对比。背景是 webview 两层结构下的通信开销，见[窗口滚动和页面级滚动](窗口滚动和页面级滚动.md)。

| 能力 | scroll-view（当前方案） | onPageScroll 页面滚动 |
| --- | --- | --- |
| 运行时开关滚动 | ✅ `:scroll-y="!fullscreen"` | ❌ 无原生开关，只能靠 touch 拦截，不可靠 |
| 滚动事件 | `@scroll`，只在这个容器内滚动才触发 | 全局页面滚动才触发 |
| 滚动位置读写 | `scroll-top` 属性可控、`uni.createSelectorQuery` 取 | `uni.pageScrollTo`、`onPageScroll` 里的 `scrollTop` |
| 触底加载 | `@scrolltolower` | `onReachBottom` |
| 和全屏图片手势共存 | ✅ 可以锁容器 | ❌ 很难彻底隔离手势 |

## 怎么选

- **页面滚动**：长列表、无限瀑布流。原生滚动不经过 JS，性能更好；`onReachBottom`、`onPullDownRefresh`、`uni.pageScrollTo` 都是现成的。本项目首页属于这种。
- **scroll-view**：内容有限，但需要冻结滚动、和手势配合、或者"上下固定中间滚"的布局。本项目详情页属于这种：全屏图片要关掉背景滚动（`:scroll-y="!fullscreen"`），捏合拖动要和滚动抢控制权。

uni 文档提到"webview 渲染下区域滚动性能不及页面滚动"是成立的，但要按内容量级判断：单篇详情的内容量远小于无限信息流，这点性能差异可以接受。
