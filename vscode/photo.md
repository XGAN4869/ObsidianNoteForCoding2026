# 账单查询模块组件通信分析（Canvas 源文档）

## 1. 分析范围

本文件分析以下代码在账单页中的职责边界、状态归属、事件回流和 API 链路：

- `src/components/form/searchForm.vue`
- `src/composables/table/useInitTable.js`
- `src/composables/form/useInitForm.js`
- `src/pages/bill/composables/useCharts.js`

为了说明真实调用关系，补充查看了账单页及图表包装组件：

- `src/pages/bill/bill.vue`
- `src/pages/bill/components/chartTop.vue`
- `src/pages/bill/components/chartBottom.vue`
- `src/api/common/bill.js`

结论先说：账单页的主链路是“`searchForm.vue` → `bill.vue` → `useInitTable.js` → `billingDetailList`”，而图表链路是“`bill.vue` 的已确认查询快照 → `chartTop/chartBottom` → `useCharts.js` → `billChartStatics`”。`useInitForm.js` 不在账单页这条查询链路中，它服务于用户管理等弹窗 CRUD 表单。

## 2. 模块一句话总结

账单页容器统一持有查询条件和“已提交查询快照”，搜索表单只负责编辑并发出意图，表格组合函数负责分页查询，图表组合函数负责把快照请求转换成 ECharts 展示；弹窗表单组合函数是另一条独立的提交链路。

## 3. 组件分层结论

### 3.1 页面组件 / 容器组件

#### `src/pages/bill/bill.vue`

- 类型：页面组件 / 容器组件。
- 持有或协调：`searchFormParams`、`appliedSearchParams`、当前粒度、当前模型类型、表格状态、搜索配置、图表查询参数。
- 负责：组装搜索表单、图表和表格；把搜索条件转换成 API 参数；处理查询去重、重置、分页、导出和初始化请求。
- 对下游传值：向 `search-form` 传 `config`、`searchLoading` 和 `v-model:searchParamsValue`；向两个图表组件传 `searchform`。
- 接收动作：接收 `search-form` 的 `search/reset` 事件；接收表格分页事件；处理粒度、模型类型、用户选择等局部交互。

### 3.2 业务区块组件

#### `src/components/form/searchForm.vue`

- 类型：可复用的搜索业务区块组件（不是纯展示组件）。
- 接收：`config` 搜索项配置、`searchLoading`、`searchParamsValue` 双向模型。
- 负责：按配置渲染输入框/选择器/日期范围；支持具名 slot 覆盖默认控件；处理展开收起、响应式显示数量、按钮防抖和窗口 resize 监听。
- 发出：`search`（查询意图）、`reset`（重置意图）。
- 不负责：API 请求、分页、业务参数转换、图表刷新决策。

#### `chartTop.vue` / `chartBottom.vue`

- 类型：图表业务区块包装组件。
- 接收：父页面传入的 `searchform` 查询参数对象。
- 负责：调用 `useCharts`，管理图表挂载/卸载时机，并显示 `cost` 和空数据提示。
- 发出：没有向父页面发业务事件；查询完成后的展示状态留在自身。

### 3.3 展示组件

#### `t-input`、`t-select`、`t-date-range-picker`、`t-table`、ECharts 实例

- 类型：第三方展示/交互组件或运行时实例。
- 只接收值、配置和 loading，产生用户交互或渲染结果。
- 业务决策仍由 `searchForm.vue` 或 `bill.vue` 完成。

#### `useInitTable.js`、`useCharts.js`、`useInitForm.js`

它们不是 Vue 组件，而是组合式逻辑模块。绘图时应把它们画成“逻辑节点/状态服务节点”，不要误画成有模板层级的子组件。

## 4. 项目级节点

### 4.1 App

在本次追踪的账单查询链路中没有发现 `App` 级恢复或副作用参与。账单默认时间范围在 `bill.vue` 的 setup 阶段计算，不从 App 恢复。

### 4.2 store

账单页的查询条件、表格数据和图表状态均为页面/组合函数实例内状态；本链路没有直接读写 store。

### 4.3 services

本链路没有额外的 services/runtime 桥接层。网络请求通过 `src/api/common/bill.js` 暴露的 API 函数直接发出。

### 4.4 Storage

本链路未发现 `uni.setStorageSync`、`uni.getStorageSync` 或 `uni.removeStorageSync`。因此没有缓存恢复、持久化状态或失败补偿状态需要画入账单查询图。

### 4.5 API

| API 节点 | 调用者 | 作用 | 请求形态 |
| --- | --- | --- | --- |
| `billingDetailList` | `useInitTable.fetchTableData` | 分页查询账单明细 | body 为转换后的搜索条件，params 为分页 |
| `billChartStatics` | `useCharts.getData`（由两个图表组件分别调用） | 查询账单统计趋势 | body 为图表查询条件，无表格分页 |
| `billingDetailExport` | `bill.vue` 的导出处理 | 导出账单明细 | body 为当前表单条件转换结果 |
| `getModelTypes` | `bill.vue` | 加载模型类型选项 | 页面初始化调用 |
| `userList` | `useSelectChange` / `bill.vue` | 加载普通用户下拉选项 | 页面初始化调用 |

## 5. 状态被谁持有

| 状态 | 真实持有者 | 修改入口 | 下游使用 | 状态类别 |
| --- | --- | --- | --- | --- |
| `searchFormParams` | `useInitTable` 在账单页创建的 reactive 对象（由 `bill.vue` 解构使用） | `searchForm` 的 `v-model`、账单页粒度/模型/用户处理函数 | 表格查询、导出、生成已确认快照 | 业务状态 |
| `appliedSearchParams` | `bill.vue` | `handleSearchForm` 在一次查询开始时整体替换 | `chartSearchParams`、`chartBottomSearchParams` | 业务状态快照 |
| `tableData` | `useInitTable` | `fetchTableData` 请求成功后赋值 | `t-table` | 业务状态 |
| `pagination` | `useInitTable` | 分页事件和接口响应更新 | `t-table` | 业务状态 |
| `loading` / `searchLoading` | `useInitTable` | 表格请求和搜索请求的 finally | 表格/搜索按钮 loading | UI 状态 |
| `isExpanded`、`windowWidth` | `searchForm.vue` | 展开按钮、resize 监听 | 搜索项显隐和布局 | 区块临时 UI 状态 |
| `myChart` | `useCharts` 闭包 | `init` / `deleteChart` | ECharts resize、setOption | runtime 状态 |
| `cost`、`isEmpty` | 每个 `useCharts` 实例 | `getData` 响应处理 | 对应图表包装组件 | 展示状态 |
| `modalState`、`formData`、`rowId` | `useInitForm` 调用方的组合函数实例 | `open`、表单输入、`handleSubmit` | 用户管理等弹窗表单 | 独立表单业务状态 |

### 5.1 `useInitForm.js` 的独立边界

`useInitForm.js` 创建弹窗状态、表单数据、校验 ref、提交 loading，并通过 `getInfo` / `submitForm` 处理详情读取和保存。当前仓库的页面实际多使用逻辑相同的 `useInitForm.ts`；`useInitForm.js` 与其运行职责一致。

它与账单查询的关系是“同一项目中的平行表单基础设施”，不是 `searchForm.vue` 的内部实现，也不参与 `useCharts.js` 的数据流。绘图时建议单独画成“弹窗 CRUD 表单支线”，与账单主链路只在“页面使用组合函数”这一层做弱关联。

### 5.2 配置式 UI：`searchConfig`

`searchConfig` 是账单页传给 `searchForm.vue` 的渲染配置数组。它不是严格 JSON Schema，而是项目自定义的 UI 协议；实际查询值仍然保存在 `searchFormParams` 中。

| 配置项 | 控件/来源 | 关键字段 | 触发链路 |
| --- | --- | --- | --- |
| `time` | `#time` slot 自定义 `t-radio-group` | `current`、`options` | `handleChoose` 更新 `granularity/timeRange` 后查询 |
| `timeRange` | 内置 `t-date-range-picker` | `mode`、`format`、`valueType`、`disableDate`、`disableTime`、`onChange`、`onClear` | 修改或清空时调用 `handleSearchForm` |
| `clientId` | `#clientId` slot 自定义 `t-select` | `userOptions`、`handleUserSelectChange` | 选择/失焦/清空时更新 clientId 并查询 |
| `apiKeyId` | 内置 `t-input` | `type: input`、`typeDiff: number`、`onClear` | Enter 或清空时发出查询 |

可以用下面的约束句式理解这份配置：`field` 决定写入 `searchParamsValue` 的键；`type` 决定默认控件；slot 决定自定义 UI；`onChange/onClear` 是项目扩展事件；`mode/format/disable*` 约束日期控件行为。配置只描述“如何渲染和何时通知”，不应直接承担 API 请求或跨区块状态。

## 6. 通信方式结论

| 通信位置 | 当前方式 | 传递内容 | 判断 |
| --- | --- | --- | --- |
| `bill.vue` → `searchForm.vue` | `props` | `config`、`searchLoading` | 传配置和只读 loading，语义清楚 |
| `bill.vue` ↔ `searchForm.vue` | `v-model:searchParamsValue` | 可编辑查询值对象 | 父页面/组合函数持有真实值，子组件负责编辑 |
| `searchForm.vue` → `bill.vue` | `emit('search')` / `emit('reset')` | 查询、重置动作意图 | 子组件不做业务决策，父组件编排请求 |
| `bill.vue` → `chartTop/chartBottom` | `props: searchform` | 已确认的查询快照派生对象 | 图表只消费已提交值，不跟随输入过程刷新 |
| `chartTop/chartBottom` → `useCharts` | 配置对象 + getter | `chartId`、`getChart`、`getParams` | getter 保证每次请求取到最新 prop |
| `useInitTable` → API | 函数参数 | `transformParams` 后的 body + 分页 params | 组合函数封装请求和响应归一化 |
| `useCharts` → API/ECharts | 函数参数和命令式实例 | 统计请求参数、ECharts option | API 与图表 runtime 封装在组合函数内部 |
| `useInitForm` → 表单 API | 函数参数 | `formData` 或转换后的提交参数 | 独立于账单查询的提交链路 |

不建议在这里引入 `store` 或 `provide/inject`：当前共享范围只有账单页面内部，`props + v-model + emit` 已能表达完整链路。

## 7. 关键链路

### 7.1 首次加载

1. `bill.vue` 调用 `useInitTable({ getTable: billingDetailList, transformParams, searchFormParams })`。
2. `useInitTable` 创建 `searchFormParams`、`tableData`、`pagination` 和 loading 状态。
3. `searchForm.vue` 通过 `v-model:searchParamsValue` 绑定同一个查询对象。
4. `bill.vue` 的 `onMounted` 调用 `fetchTableData()` 获取表格；两个图表组件 mounted 后各自调用 `useCharts.init()`，随后首次调用 `getData()`。

### 7.2 点击查询 / 输入触发查询

1. 用户在 `searchForm.vue` 修改控件值，值通过 `v-model` 直接回流到 `bill.vue` 的 `searchFormParams`。
2. 查询按钮、输入框 Enter、选择器 blur，或配置项的 `onChange/onClear` 触发 `search` 意图。
3. `bill.vue.handleSearchForm` 合并可选参数，并用 `searchPromise` 合并同一轮重复触发。
4. `handleSearchForm` 把当前条件复制到 `appliedSearchParams`，形成“用户已确认”的快照。
5. `useInitTable.handleSearch` 将页码重置为 1，等待 300ms 后调用 `fetchTableData`。
6. `fetchTableData` 调用 `transformParams`：把 `timeRange: Date[]` 转为 `startTime/endTime` 秒级时间戳，再调用 `billingDetailList(body, paginationParams)`。
7. 响应写入 `tableData` 和 `pagination`。
8. `appliedSearchParams` 引用发生变化，`chartTop/chartBottom` 的 `watch(() => props.searchform)` 被触发；两个组件分别调用各自 `useCharts.getData()`。
9. `useCharts` 调用 `billChartStatics(getParams())`，将 `timestamps`、`amounts`、`totalAmount` 写入 ECharts option、`cost`、`isEmpty`，最后重绘图表。

### 7.3 重置

`searchForm.vue` 只发出 `reset`；`bill.vue.handleReset` 重新生成按小时的默认时间范围、模型类型和分页，再 `Object.assign(searchFormParams, params)`，最后复用 `handleSearchForm`，因此表格和图表会使用同一份新快照刷新。

### 7.4 分页

`t-table @page-change` → `bill.vue.handlePageChange` → `useInitTable.handlePageChange` → 更新 `pagination` → `fetchTableData`。分页只影响表格，不改变 `appliedSearchParams`，所以不会触发图表刷新。

### 7.5 图表上下两条支线

- `chartTop` 的 `chartSearchParams` 包含 `startTime/endTime/granularity/apiKeyId/clientId`，当前没有传 `modelTypes`。
- `chartBottom` 的 `chartBottomSearchParams` 直接使用完整 `transformParams(appliedSearchParams)`，包含 `modelTypes`。
- 两者都调用 `billChartStatics`，但请求口径不同。绘图时应把它们画成两个独立的 `useCharts` 实例，并确认是否为有意的“总览/模型类型”差异；若不是有意差异，应统一参数来源。

## 8. Storage 总表

本链路无 Storage 节点。

| key | 写入者 | 读取者 | 时机 | 语义 |
| --- | --- | --- | --- | --- |
| 无 | 无 | 无 | 无 | 账单查询状态不持久化 |

## 9. 适合画 Canvas 的节点清单

建议使用以下稳定 ID，避免绘图工具按文件名重复建节点：

| ID | 节点 | 分组 | 节点说明 |
| --- | --- | --- | --- |
| BILL | `bill.vue` | 页面容器 | 查询编排、快照、表格/图表协调 |
| SF | `searchForm.vue` | 搜索业务区块 | 配置驱动控件、双向编辑、发出搜索动作 |
| TBL | `useInitTable.js` | 组合逻辑 | 搜索、分页、表格请求、loading |
| PARAMS | `searchFormParams` | 业务状态 | 当前正在编辑的查询值 |
| SNAP | `appliedSearchParams` | 业务状态 | 用户确认后供图表使用的查询快照 |
| CFG | `searchConfig` | 配置 | 搜索字段、控件类型、slot 回调 |
| CTOP | `chartTop.vue` | 图表区块 | 顶部统计图包装 |
| CBOTTOM | `chartBottom.vue` | 图表区块 | 底部统计图包装 |
| CHART_TOP_LOGIC | `useCharts`（chartTop 实例） | 组合逻辑 | chartTop 的 ECharts runtime 与请求 |
| CHART_BOTTOM_LOGIC | `useCharts`（chartBottom 实例） | 组合逻辑 | chartBottom 的 ECharts runtime 与请求 |
| TABLE_API | `billingDetailList` | API | 分页账单明细接口 |
| CHART_API | `billChartStatics` | API | 账单趋势统计接口 |
| EXPORT_API | `billingDetailExport` | API | 账单导出接口 |
| MODEL_API | `getModelTypes` | API | 模型类型接口 |
| USER_API | `userList` | API | 用户选项接口 |
| FORM_LOGIC | `useInitForm.js` | 独立组合逻辑 | 弹窗表单显隐、校验、提交；不属于账单查询主链路 |
| MODAL_STATE | `modalState/formData/rowId` | 独立业务状态 | 用户管理等 CRUD 弹窗状态 |

## 10. 适合画 Canvas 的边清单

箭头方向统一为“数据/动作流向”；边标签可直接作为连线文字。

| 起点 | 终点 | 边标签 | 类型 |
| --- | --- | --- | --- |
| BILL | SF | `config + searchLoading + v-model` | props / 双向值 |
| CFG | SF | `字段、控件类型、slot 回调` | 配置驱动 |
| SF | PARAMS | `控件 v-model 写入` | 值回流 |
| SF | BILL | `emit search/reset` | 动作事件 |
| PARAMS | BILL | `当前编辑条件` | 读取 |
| BILL | TBL | `handleSearch / fetchTableData` | 方法调用 |
| TBL | TABLE_API | `transformParams(body) + pagination` | API 请求 |
| TABLE_API | TBL | `records/data + current/size/total` | 响应 |
| TBL | BILL | `tableData、pagination、loading` | 状态暴露 |
| BILL | SNAP | `handleSearchForm 整体替换` | 快照写入 |
| SNAP | CTOP | `chartSearchParams` | props |
| SNAP | CBOTTOM | `chartBottomSearchParams` | props |
| CTOP | CHART_TOP_LOGIC | `getParams getter + lifecycle` | 组合函数配置 |
| CBOTTOM | CHART_BOTTOM_LOGIC | `getParams getter + lifecycle` | 组合函数配置 |
| CHART_TOP_LOGIC | CHART_API | `统计参数（不含 modelTypes）` | API 请求 |
| CHART_BOTTOM_LOGIC | CHART_API | `完整 transformParams（含 modelTypes）` | API 请求 |
| CHART_API | CHART_TOP_LOGIC | `timestamps/amounts/totalAmount` | 响应 |
| CHART_API | CHART_BOTTOM_LOGIC | `timestamps/amounts/totalAmount` | 响应 |
| CHART_TOP_LOGIC | CTOP | `cost/isEmpty/ECharts option` | 展示状态 |
| CHART_BOTTOM_LOGIC | CBOTTOM | `cost/isEmpty/ECharts option` | 展示状态 |
| BILL | EXPORT_API | `transformParams(searchFormParams)` | 导出请求 |
| BILL | MODEL_API | `onMounted` | 初始化请求 |
| BILL | USER_API | `fetchUserList` | 初始化请求 |
| FORM_LOGIC | MODAL_STATE | `open/reset/submit` | 独立弹窗支线 |

## 11. 推荐分组方式

### 分组 A：页面容器

包含 `BILL`。它是所有业务动作的决策中心，也是 `PARAMS` 和 `SNAP` 的页面级协调者。

### 分组 B：搜索区块

包含 `SF`、`CFG`、`PARAMS`。`SF` 可以编辑 `PARAMS`，但不直接调用 API。

### 分组 C：表格查询

包含 `TBL`、`TABLE_API`、表格展示节点。突出“查询条件 → 参数转换 → 分页 API → tableData/pagination”。

### 分组 D：图表查询

包含 `CTOP`、`CBOTTOM`、两个独立的 `useCharts` 实例和 `CHART_API`。突出“快照 → props → watch → getData → ECharts”。

### 分组 E：独立弹窗表单

包含 `FORM_LOGIC`、`MODAL_STATE` 以及用户管理弹窗页面。用虚线或不同颜色表示它与账单查询主链路没有直接调用关系。

### 分组 F：外部 API

统一放置 `TABLE_API`、`CHART_API`、`EXPORT_API`、`MODEL_API`、`USER_API`，避免把接口误认为组件内部状态。

## 12. 最终结论

1. `searchForm.vue` 是“值编辑器 + 动作发射器”：通过 `v-model` 改值，通过 `emit` 表达查询/重置意图。
2. `useInitTable.js` 是“表格查询状态机”：接收搜索条件和配置，负责分页、参数转换、请求和响应归一化。
3. `bill.vue` 是真正的业务编排中心：它把正在编辑的 `searchFormParams` 转成 `appliedSearchParams` 快照，并决定何时刷新表格和图表。
4. `useCharts.js` 是“图表 runtime + 统计请求适配器”：每个图表包装组件各创建一个实例，监听快照变化后独立请求并重绘。
5. `useInitForm.js` 是平行的弹窗 CRUD 表单组合函数，不应与账单搜索或图表链路直接连线；最多标记为同项目的复用逻辑。
6. 当前代码没有 App、store、services、Storage 参与；绘图重点应放在 props、v-model、emit、快照替换、watch、API 请求和 ECharts runtime 六类关系上。

## 附：绘图时应标注的实现风险

- `searchForm.vue` 中 `<t-form-item label="item.label">` 是字面量字符串；如果期望显示配置中的标签，应确认是否应写成 `:label="item.label"`。
- `searchForm.vue` 的 `debouncedReset` 当前只是直接 emit，并未真正防抖；查询按钮才使用了 300ms 防抖。
- `useCharts.js` 的 `getData` 先 `setOption`，随后 `clear()` 再以 `notMerge: true` 再次 `setOption`，存在重复渲染逻辑，绘图时可标为“图表更新实现”。
- 图表 watch 是浅层监听；当前依靠 `bill.vue` 替换 `appliedSearchParams` 对象来触发。如果未来改成原对象深层 mutation，需要改为 `deep: true` 或显式替换引用。
- `chartTop` 与 `chartBottom` 对同一统计 API 使用了不同参数口径，需确认是否是产品设计要求。
- `useInitForm.js` 把 `rowId` 定义在函数外部，多个 `useInitForm` 实例可能共享同一份 ID；这属于独立弹窗支线的状态隔离风险。

## SVG 速览图（新增）

为了便于快速复习，已根据上面的组件职责、主流程、分支和风险整理出一张精简 SVG：

![[photo.svg]]

打开方式：在 Obsidian 中预览本笔记即可查看；也可以直接打开同目录下的 [`photo.svg`](photo.svg)。图中采用四条水平阅读 lane：组件通信、主流程、分支链路、重难点。原文中的文件名、函数名、状态名和 API 名称均保持一致，图示只是摘要，不替代上面的详细说明。
