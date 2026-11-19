# 笔记详情评论弹窗的键盘布局

更新于 2026-11-19。适用范围是 uni-app App-vue 的安卓详情页，已在当前 HBuilderX 安卓基座和连接的真机上验证。

## 页面、面板和键盘

详情页使用纵向 Flex，正文和评论在 `scroll-view` 内滚动，原底栏独占页面底部一行。评论弹窗打开时，遮罩覆盖背景，底栏仍在原位。弹窗的白色面板从输入栏延伸到屏幕底边，系统键盘盖在面板下半段。

`t-popup` 的 `placement="bottom"` 将面板锚定在底部。键盘弹起后，在**面板外层**增加 `keyH` 高的 `padding-bottom`，输入框和发送按钮随面板内部布局移到键盘上边缘。内边距和内容一起绘制面板背景，因此键盘下方仍是白色区域。此前的 `bottom: keyH` 会抬起整块面板，面板下方会露出遮罩。键盘收起时，面板底部恢复使用 `safe-area-inset-bottom`，给系统手势区留空间。

## 为什么要同时配置系统和 WebView

| 层级 | 配置 | 实际作用 |
| --- | --- | --- |
| 安卓页面窗口 | `softinputMode: "nothing"` | 系统键盘覆盖原窗口，页面高度保持稳定。 |
| uni-app 输入框 | `:adjust-position="false"` | 关闭输入框的自动上推。 |
| WebView 视图层 | `navigator.virtualKeyboard.overlaysContent = true` | 开启键盘覆盖模式，使输入框聚焦时的可视区域保持原位。 |
| 评论面板 | `uni.onKeyboardHeightChange` → `keyH` → `custom-style` | 使用键盘高度更新输入面板的底部内边距。 |

排查双重位移时，真机的布局窗口高度一直是 `776px`。当时面板已经设置 `bottom: 286px`，WebView 的 `visualViewport.offsetTop` 又变为 `270px`，画面整体上移，背景底栏也出现在键盘上方。启用 `overlaysContent` 后，额外平移归零。这些数值仅用于说明实测现象，布局按键盘高度回调动态计算。

[HTML5+ WebView 键盘模式](https://www.html5plus.org/doc/zh_cn/webview.html#WebviewStyles) · [uni-app input](https://uniapp.dcloud.net.cn/component/input.html) · [Chrome VirtualKeyboard API](https://developer.chrome.com/docs/web-platform/virtual-keyboard)

## 实现位置与数据流

| 文件 | 职责 |
| --- | --- |
| [pages.json](../../../src/pages.json) | 给 `pages/note/index` 配置 `app-plus.softinputMode: "nothing"`。 |
| [详情页 index.vue](../../../src/pages/note/index.vue) | `keyboardViewport` 的 `renderjs` 在 WebView 视图层探测并启用覆盖模式。挂载时启用，根节点 `touchstart` 在输入入口聚焦前也会执行。页面继续通过 `onResize(measureContent)` 重新测量正文折叠。 |
| [commentSection.vue](../../../src/pages/note/media/components/commentSection.vue) | 转发详情页对 `openComposer()` 和 `closeKeyboard()` 的调用。 |
| [comment.vue](../../../src/pages/note/media/components/comment.vue) | 管理弹窗开关和 `keyH`，在组件挂载时注册键盘高度回调，卸载时用同一回调解绑。输入框聚焦后，键盘高度更新通过 `custom-style` 应用到 `t-popup` 面板。 |

面板样式的核心实现如下。

```ts
const composerStyle = computed(() => ({
  'padding-bottom': keyH.value > 0
    ? `${keyH.value}px`
    : 'env(safe-area-inset-bottom, 0px)'
}))
```

`keyH` 使用键盘回调的像素值。`t-popup` 保持 `placement="bottom"` 并绑定 `:custom-style="composerStyle"`，输入框自身的间距继续由 `.note-comment-composer` 提供。正文滚动区沿用原有 Flex 分配，键盘避让发生在弹窗面板这一层。

Vue 3 页面逻辑用 `<script setup lang="ts">`。详情页使用 `<renderjs name="keyboardViewport">` 单独声明视图层模块，避免 `vue-tsc` 将它当成第二段 Vue 业务脚本。当前 App 编译器会把该模块编入 `app-renderjs.js`，并在页面挂载时执行 `mounted`。`navigator.virtualKeyboard` 的类型声明位于 [env.d.ts](../../../src/env.d.ts)。[uni-app renderjs](https://uniapp.dcloud.net.cn/tutorial/renderjs.html) · [键盘高度监听](https://uniapp.dcloud.net.cn/api/key.html#onkeyboardheightchange)

## 真机复测要点

- 在安卓基座打开评论输入框，核对详情内容和原底栏位置，确认键盘弹起时没有整体上推。
- 检查键盘完全弹出后的画面。输入栏和发送按钮在键盘顶边上方，面板背景向下延伸，边缘没有露出灰色遮罩。
- 收起键盘，确认面板回到底部并恢复安全区留白。关闭弹窗后，确认正文滚动位置和原底栏仍在原位。
- 换 WebView 内核、输入法或平台时重新验证。视图层通过能力探测使用 `navigator.virtualKeyboard`，当前键盘高度监听按 `APP-PLUS` 编译。当前真机结果适用于上述安卓环境。
