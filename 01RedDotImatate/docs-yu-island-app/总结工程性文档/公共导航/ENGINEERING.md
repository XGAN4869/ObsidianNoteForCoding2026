# AppNavbar 公共导航工程文档

更新时间：2026-11-04。主要交付平台：普通 uni-app 的 App-Plus；H5 用于快速预览，小程序作为补充兼容。

## 1. 先理解两层结构

```text
AppNavbar
├─ 顶部公共区域：根据设备实际状态栏高度留出空间
└─ 可选导航内容区：设计基准高 48px，可配置或整行替换
   ├─ 左侧操作：图标按钮
   ├─ 中间内容：标题、Tab、自定义文字或搜索框
   └─ 右侧操作：文字按钮或搜索入口
```

状态栏上的时间、信号、电池由手机系统显示。组件只负责占位，不绘制模拟状态栏。

导航内容区可以完全隐藏。这时仍然保留设备状态栏空间，不残留一条空白导航行。

## 2. 文件职责与调用关系

| 文件                                         | 职责                                       | 通常何时修改       |
| -------------------------------------------- | ------------------------------------------ | ------------------ |
| `src/components/common/AppNavbar.vue`        | 参数、插槽、事件、搜索状态、状态栏高度读取 | 增加导航公共能力   |
| `src/components/common/app-navbar.css`       | 导航布局与 TDesign 内部适配                | 处理对齐、控件结构 |
| `src/styles/tokens.css`                      | 尺寸、字号、颜色数值来源                   | 统一调整设计规则   |
| `src/styles/buttons.css`                     | BTN 编号到 TDesign 变量的映射              | 调整公共按钮规范   |
| `src/styles/inputs.css`                      | INP 编号到输入控件的映射                   | 调整公共输入规范   |
| `src/styles/typography.css`                  | TY 字阶及字重变体                          | 调整公共文字规范   |
| `src/stores/appearance.ts`                   | 系统主题与图标后缀                         | 处理共享外观状态   |
| `src/components/common/native-navigation.ts` | 原生状态栏和底栏图标同步                   | 处理原生层外观     |
| `src/pages/dev/NavigationSamples.vue`        | 参数和插槽的可运行示例                     | 验收或增加使用示例 |

```text
页面传 props / slots
  → AppNavbar 决定显示哪一行、哪一段内容
  → app-navbar.css 组织布局
  → BTN / INP / TY 规范读取 tokens
  → TDesign 渲染实际按钮、输入框和图标

系统窗口尺寸变化
  → AppNavbar 重新读取 statusBarHeight
  → 更新 --navbar-status-height
  → 顶部公共区域重新占位
```

AppNavbar 不执行返回、保存草稿等业务动作，只触发事件，由页面处理。

## 3. 新页面接入流程

### 第一步：选择导航来源

需要使用 AppNavbar 的页面，在 `src/pages.json` 对应页面设置：

```json
{
  "path": "pages/example/index",
  "style": {
    "navigationStyle": "custom"
  }
}
```

已有原生标题栏的页面无需强行替换。不要在原生标题栏下再添加一份默认带状态栏占位的 AppNavbar。

### 第二步：页面绑定主题

```vue
<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import { useAppearanceStore } from '@/stores/appearance'

const appearance = useAppearanceStore()

function onBack(): void {
  uni.navigateBack()
}

function onSaveDraft(): void {
  // 在这里调用业务层保存草稿；导航组件不持有草稿状态。
}
</script>

<template>
  <view class="min-h-screen bg-canvas text-ink" :class="appearance.themeClass">
    <AppNavbar title="发布笔记" left-icon="chevron-left" right-text="存草稿" @left="onBack" @right="onSaveDraft" />
    <!-- 页面正文 -->
  </view>
</template>
```

TDesign 的 `t-button`、`t-input` 等标签由 easycom 引入，不在页面手动 import。

### 第三步：选择自定义层级

| 需求                           | 使用方式                         |
| ------------------------------ | -------------------------------- |
| 普通标题、返回图标、右侧文字   | `title`、`leftIcon`、`rightText` |
| 只修改标题字体                 | `titleClass`                     |
| 只修改标题水平位置             | `titleAlign`，默认 `left`        |
| 替换左右操作                   | `left` / `right` 插槽            |
| 中间放两行文字、计数或其他内容 | `center` 插槽                    |
| 搜索页、聊天页等整行自由排版   | `content` 插槽                   |
| 只显示状态栏空间               | `:show-content="false"`          |

`content` 优先于内置整行布局；`center` 优先于内置标题和 Tab；`tabs` 优先于 `title`。`showContent=false` 时，以上导航内容均不渲染。

## 4. 字体与按钮规则

| 位置或场景                       | 默认规范                                  |
| -------------------------------- | ----------------------------------------- |
| 左侧图标                         | `btn-06-icon`                             |
| 右侧文字                         | `btn-05-inline` + `ty-05-label`           |
| 右侧搜索图标                     | `btn-06-icon`                             |
| 存在左侧图标或 `left` 插槽的标题 | `ty-04-body`                              |
| 没有左侧操作的标题               | `ty-03-subhead`                           |
| 内置搜索框文字、占位文字         | `ty-05-label` 对应的字号与字重            |
| 内置搜索与取消文字               | `btn-05-inline` + `ty-05-label`           |
| 首页 Tab                         | `ty-03-subhead`；选中加粗，未选中常规字重 |

标题字体可以直接指定完整类名，不需要为每种页面增加一个参数：

```vue
<AppNavbar title="143 条评论" title-class="ty-04-body ty-weight-bold" left-icon="chevron-left" />
```

需要混排时，在插槽中分别指定字体：

```vue
<AppNavbar left-icon="chevron-left" right-text="更多">
  <template #center>
    <view class="min-w-0">
      <text class="block truncate ty-04-body ty-weight-bold">小衣橱</text>
      <text class="block ty-06-meta text-success">在线</text>
    </view>
  </template>
</AppNavbar>
```

自定义 `content` 时，最外层建议使用 `flex w-full items-center`，左右内边距用 `px-space-16`，间距按项目语义类选择。插槽内容的按钮编号和文字类由页面明确提供。

图标名由 TDesign 解析；传本地图片路径时，可按主题提供对应资源。首页搜索图标已经通过 `appearance.iconSuffix` 选择明暗位图。若使用图标字体，需要在 App 真机上核对资源加载。

## 5. 高度与状态栏适配流程

| 区域           | 来源                                  | 说明                        |
| -------------- | ------------------------------------- | --------------------------- |
| 导航内容行     | `--ys-navbar-height: 96rpx`           | 375px 设计宽下为 48px       |
| 默认左右内边距 | `--ys-space-16`                       | 375px 设计宽下为 16px       |
| 内置搜索框     | `--ys-navbar-search-height: 64rpx`    | 375px 设计宽下为 32px       |
| 状态栏         | `uni.getWindowInfo().statusBarHeight` | 设备实际 px，不按设计稿乘 2 |

状态栏处理顺序：

1. 组件初始化时读取实际状态栏高度。
2. 挂载后再同步一次，并订阅 `uni.onWindowResize`。
3. 窗口尺寸变化时重新读取高度，适配旋转等场景。
4. 返回有效非负高度时，直接使用系统 px；返回 0 也属于有效值。
5. 缺少有效高度时，使用 `env(safe-area-inset-top, 0px)` 兜底。
6. 卸载时移除窗口监听。

设计稿中的 46px 是示例，不是所有手机共同的状态栏高度。父页面不要再补同样的顶部 padding。

```vue
<!-- 正常页面：仅保留设备状态栏空间 -->
<AppNavbar :show-content="false" />

<!-- 嵌入组件预览：不重复处理系统状态栏，也不吸顶 -->
<AppNavbar title="预览" :safe-area-top="false" :sticky="false" />
```

App-Plus 不增加微信胶囊空间。微信小程序的胶囊处理只在 `MP-WEIXIN` 条件编译中生效，且仅在内容行显示时增加额外空间。

## 6. 首页文字与图标的垂直居中

首页是 `tabs + searchable` 组合。只给最外层设置 `align-items: center`，并不能完全消除内部行内文字的基线差异。

当前布局逐层保证垂直对齐：

1. 导航行使用统一的 `--ys-navbar-height` 高度。
2. 左右操作区填满行高，通过 flex 对齐图标按钮。
3. 中间区拉伸至行高，通过 flex 垂直居中。
4. Tab 列表使用同一行高；Tab 按钮内部的文字采用 `display: block`，不再依赖行内基线定位。
5. 搜索图标容器使用 flex 与比例行高，位图作为块级元素显示。

不要通过页面内 `padding-top`、`top`、`translateY` 来修正某台手机的对齐，否则切换字体或设备后容易再次偏移。

区分两个概念：这里修复的是文字、图标在导航行中的上下居中；`titleAlign` 控制的是水平位置，默认仍按设计稿靠左，首页 Tab 保持水平居中。

## 7. 事件与搜索流程

```text
点击 Tab → 更新默认 v-model → 触发 change(value)
点击搜索图标 → 进入内置搜索行 → 编辑 keyword
点击搜索或键盘搜索 → 退出搜索行 → 触发 search(keyword)
点击取消 → 清空 keyword → 退出搜索行 → 触发 search('')
点击左侧按钮 → 触发 left → 页面处理返回等业务
点击右侧文字 → 触发 right → 页面处理保存等业务
```

`v-model:keyword` 用于同步输入文字。`rightText` 和 `searchable` 同时传入时，右侧优先显示文字按钮。需要多个操作或不同搜索排版时使用插槽。

## 8. 排查与验证流程

1. 先确认问题属于状态栏占位、导航内容区高度、垂直对齐还是水平位置。
2. 状态栏问题检查 `safeAreaTop` 与父页面是否重复占位；不要写死 46px。
3. 高度问题检查令牌和输入框尺寸；不要直接改某个页面的内联高度。
4. 首页垂直对齐问题沿“导航行 → 中间区 → Tab 列表 → 按钮内容 → 文字 / 图标”逐层检查。
5. 字体问题检查 `titleClass`、插槽文字类和主题令牌；不要新增裸字号或裸色值。
6. 使用开发预览 `/pages/dev/ui?section=navigation` 检查标题、操作、自定义字体、插槽、内容隐藏；再回到实际首页验证。
7. 执行类型检查与 lint，再构建 App；H5 供布局回归，小程序仅作补充。
8. 通过 HBuilderX 在 App-Plus 真机验证冷启动、返回首页、旋转、明暗主题和不同状态栏设备。

```bash
npm run type-check
npm run lint
npm run build:app
npm run build:h5
npm run build:mp-weixin
```

浏览器检查可以测量行框中心与文字、图标中心，但不能替代 App 原生容器验证。浏览器通过时仍须在 Android / iOS 真机检查状态栏空间与导航行的实际位置。

相关官方 API：[窗口信息与 statusBarHeight](https://uniapp.dcloud.net.cn/api/system/getWindowInfo.html)。

## 9. 本次验证记录

2026-11-04 已通过类型检查、lint，以及 App、H5、微信小程序构建。小程序构建提示不支持 `p` 标签选择器，未阻断构建。

H5 实际首页的测量结果：导航行高 48px，中心位于 24px；“发现”“关注”的文字框中心约为 23.992px，搜索图标和位图中心为 24px，垂直误差小于 0.01px。

本次未连接 App 真机。以上结果证明页面布局与编译产物通过检查，App 状态栏、设备字体及原生容器内的最终呈现仍需按第 8 节进行真机验收。
