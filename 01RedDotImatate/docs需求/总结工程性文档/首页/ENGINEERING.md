# 首页双列瀑布流工程总结

更新时间：2026-11-05。

## 刷新与布局总时序

```text
refresh()
→ discoverPagination.refresh()
→ 请求 pageResult
→ measuringItems 渲染隐藏测量区
→ nextTick
→ createSelectorQuery 批量读取卡片尺寸
→ lastMeasurement 保存测量结果
→ 分页提交 list / cursor / hasMore
→ applyMeasuredPage
→ useWaterfall 按最短列追加
→ 正式列表渲染 column.items
→ 清空 measuringItems
```

## 每一步的职责

| 步骤                                   | 负责者                           | 结果                                             |
| -------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `refresh()`                            | 首页页面                         | 用户主动触发刷新                                 |
| `discoverPagination.refresh()`         | `useCursorFeed.ts`               | 从 `cursor: null` 请求最新首屏                   |
| 请求 `pageResult`                      | `src/api/modules/*`              | 返回 `list`、`nextCursor`、`hasMore`             |
| `measuringItems` 渲染隐藏测量区        | `index.vue` + `HomeNoteCard.vue` | 用正式卡片结构生成临时测量节点                   |
| `nextTick`                             | `useCardMeasurement.ts`          | 等待测量节点完成排版                             |
| `createSelectorQuery` 批量读取卡片尺寸 | `useCardMeasurement.ts`          | 获取每张卡片的实际 px 宽高和间距                 |
| `lastMeasurement` 保存结果             | `useCardMeasurement.ts`          | 保存本批卡片与尺寸的对应关系                     |
| 分页提交 `list / cursor / hasMore`     | `useCursorFeed.ts`               | 确认这次请求成功，更新分页状态                   |
| `applyMeasuredPage`                    | `index.vue`                      | 将分页数据和实测高度配对                         |
| `useWaterfall` 按最短列追加            | `useWaterfall.ts`                | 新卡片逐张进入当前累计高度最小的列，旧卡片不换列 |
| 正式列表渲染 `column.items`            | `index.vue`                      | 用户看到最终两列卡片                             |
| 清空 `measuringItems`                  | `useCardMeasurement.ts`          | 删除临时测量节点，释放测量区                     |

## 失败边界

测量失败时，`load` 不返回 `pageResult`，分页层不会提交新列表和新游标；旧内容继续保留，重试会重新执行同一时序。

分页成功后，`lastMeasurement` 已经存在，页面才调用 `applyMeasuredPage`。分页数据和布局数据不会分别提交，避免出现列表更新但列布局没有更新的中间状态。

## 当前性能取舍

- 每一批只测量新增卡片，不重复测量历史卡片。
- 使用一次 `createSelectorQuery` 批量读取尺寸，不逐张等待查询。
- 测量区关闭图片和头像请求，只保留卡片排版所需的尺寸。
- `useWaterfall` 只追加新批次，历史卡片的列归属不变。
- 当前仍保留完整列表节点，窗口化和实际设备性能测量后续补充。

## App-Plus 图片资源问题与方案

### 现象

H5 可以显示当前 mock 图片，App-Plus 端看不到图片。当前 mock 使用 `https://picsum.photos/seed/...`，该服务会发生外部跳转；H5 浏览器能跟随跳转，不代表 App-Plus 原生图片组件、设备网络和证书链也能稳定访问。

测量区不显示图片是设计行为：`HomeNoteCard` 在 `measuring` 模式下关闭封面和头像图片，只保留封面比例和文字排版。正式卡片仍会渲染图片。

卡片图片定位已避免使用 `inset: 0`，改用 `top/right/bottom/left` 四个方向，降低 App-Plus 样式编译差异。

### 推荐的生产方案

COS 可以作为图片源站，建议按以下链路接入：

```text
发布服务上传图片
→ COS 保存原图和裁切后的成品封面
→ 后端返回稳定的 HTTPS 图片 URL、width、height
→ 首页 t-image 直接使用 URL
```

腾讯云 COS 会为对象提供访问 URL，也可以绑定自定义域名并配置 HTTPS；高频跨地域访问时再使用 CDN 加速。[COS 域名管理](https://cloud.tencent.com/document/product/436/18424)、[COS HTTPS 自定义域名](https://cloud.tencent.com/document/product/436/11142)

生产约束：

- 不在 App 内放 COS SecretId、SecretKey 或永久密钥。
- 公开图片使用稳定的 HTTPS COS/CDN URL，尽量避免多次 302 跳转。
- 私有图片由后端签发可访问 URL，或使用 COS/CDN 的回源鉴权，不让客户端自行签名。
- 后端返回已经裁切完成的封面宽高；首页按返回比例预留空间，不二次猜测图片比例。
- 图片失败必须触发卡片局部占位和错误回调，不能让整列高度失去约束。

腾讯云文档说明：COS 默认域名可直接访问对象，也可以绑定 CDN 或自定义域名；私有读场景需要配置 CDN 回源鉴权，不能把临时密钥直接当作 CDN 访问方案。[COS CDN 与私有读](https://cloud.tencent.com/document/faq/436/56558)、[COS CDN 加速配置](https://cloud.tencent.com/document/product/436/18670)

### 排查顺序

1. 先把一张本地静态图放入 `src/static`，确认 App-Plus 的卡片布局和 `<t-image>` 能显示本地资源。
2. 再替换成一个稳定、无跳转的 HTTPS 图片 URL，区分布局问题和网络/域名问题。
3. 查看图片错误回调和设备网络日志，确认是 DNS、TLS、重定向、CDN 权限还是资源本身失败。
4. 最后接入 COS/CDN，使用真实后端返回的成品图片 URL 进行 Android/iOS 真机验证。

当前仅完成 H5 预览和构建验证，App-Plus 真机图片链路尚未完成验收。

## 分页契约与状态归属

首页分页由 `usePagination<T>` 管理，每条信息流单独创建实例。发现流和关注流不能共用列表、游标或错误状态。

```ts
interface CursorPage<T> {
  list: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

`nextCursor` 是后端生成的不透明分页凭证。前端不解析、不拼接、不计算，只在下一次请求中原样传回；`pageSize` 只控制本次取数。

`load` 必须返回 `CursorPage<T>`。测量结果属于布局层，保存在 `useCardMeasurement.lastMeasurement`，不改变分页 composable 的返回契约。

分页层当前负责：

- 首屏、下一页、刷新和失败重试。
- 同一流的请求锁，避免连续触底重复请求。
- 按 `getKey` 去重。
- 只有请求成功后才提交列表、游标和 `hasMore`。
- 下一页失败保留旧列表和旧游标。
- 游标不推进但仍声明有更多时，停止请求并进入错误状态。

## Composable 规范

新增 composable 遵循 `src/composables/CONVENTIONS.md`：

- 文件顺序为 import、类型、辅助函数、状态、派生状态、内部逻辑、公开方法、return。
- `//!` 标记状态分区和公开方法，`//!! 重点:` 标记核心约束，`//1.`、`//2.` 标记真实执行步骤。
- `前`、`后` 只表示前端和后端的数据来源；普通函数的参数和返回值使用“输入”“输出”。
- 一个 composable 只处理一个职责，不放模板、页面文案和 TDesign 结构。
- `useCursorFeed.ts` 是现有参考文件，不修改其既有注释和分页契约。

## 卡片测量与瀑布流

`useCardMeasurement` 不持续监听每张卡片，而是在每批数据排版完成后批量读取一次尺寸：

1. `measuringItems` 暂存本批数据。
2. 页面在隐藏测量区复用 `HomeNoteCard`，保持实际列宽和样式。
3. `nextTick` 等待节点排版。
4. `uni.createSelectorQuery().selectAll(...).boundingClientRect()` 批量读取卡片宽高，并读取间距探针。
5. 测量结果保存为 `lastMeasurement`，测量区在 `finally` 中清空。

测量卡片使用 `measuring` 属性关闭封面和头像图片请求，但保留封面比例、标题换行、作者行和内边距，因此测出的高度接近正式卡片。标题自然占一行或两行，超过两行截断。

`useWaterfall` 保存：

```ts
interface WaterfallColumn<T> {
  items: T[];
  height: number;
}
```

首屏和刷新调用 `replace`，先清空列，再逐张放入当前最短列。下一页调用 `append`，只遍历新增卡片；每放入一张就更新列高，旧卡片的列归属和位置保持不变。

测量失败时，`load` 不返回 `pageResult`，分页层不会提交新列表或新游标；旧内容继续保留，重试会重新执行请求、测量和布局提交。

## 性能取舍

- 每批只测量新增卡片，不重复测量历史卡片。
- 一次 `SelectorQuery` 批量读取尺寸，避免逐张等待查询。
- 测量区不下载业务图片，避免重复网络请求和图片解码。
- 查询布局信息仍有成本；隐藏节点并不等于没有布局成本。
- `useWaterfall` 追加时会复制旧列数组，历史数据量变大后仍有 O(N) 引用复制成本。
- 当前没有窗口化，正式卡片节点会随累计数据增加；后续性能重点是窗口化、图片资源释放和内存观察。
- `ResizeObserver` 更适合内容展开、容器宽度变化等持续尺寸变化场景；当前按批测一次的跨端需求使用 `SelectorQuery`。

## 当前验证与验收

已取得的功能证据：

- H5 375 宽下，一行和两行标题测得不同高度。
- H5 20 → 40 条追加时，旧卡片的列归属和列内位置保持不变。
- H5 45 条数据到达末页，显示“没有更多了”。
- 测量区在完成后清空，页面无横向溢出。
- H5、小程序构建和 lint 通过。

需求验收状态以首页需求评审文档的 `8.1 当前完成状态` 为准。目前 AC-01、AC-04、AC-08、AC-11 已勾选；失败注入、重复 ID、缓存、窗口化和真机交互仍未勾选。

类型检查仍被项目已有的 `src/utils/storage.ts` 缺失和 `src/types/api.ts` 不是模块两个错误阻断，本次首页新增代码未增加新的类型错误。
