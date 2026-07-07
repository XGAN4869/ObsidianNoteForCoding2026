## 分析范围

目标组件：

- `travel-web/sites/web/src/components/business/select/DateRangeFilter.vue`

直接父组件：

- `travel-web/sites/web/src/pages/rewardPunish/index.vue`
- `travel-web/sites/web/src/pages/jobFeedback/index.vue`
- `travel-web/sites/web/src/pages/vehicle/index.vue`
- `travel-web/sites/web/src/pages/system/sysLog/sysLogList.vue`
- `travel-web/sites/web/src/pages/complaint/index.vue`
- `travel-web/sites/web/src/pages/approval/index.vue`

这份文档只分析 `DateRangeFilter` 与父组件之间的通信、状态归属、数据回流和查询触发链路，不展开每个页面内部其他弹窗组件。

## 结论先行

`DateRangeFilter` 是一个复用型日期范围筛选业务组件。它不直接请求接口，也不拥有页面级筛选状态。真正的 `startDate` / `endDate` 都由父页面持有，子组件只负责两个日期选择器的展示、临时编辑状态、起止日期合法性校验，以及通过 `v-model:startDate` / `v-model:endDate` 把结果回写给父组件。

核心链路可以概括为：

```text
父组件 searchForm/search 持有真实日期
  -> v-model:startDate / v-model:endDate 传给 DateRangeFilter
  -> DateRangeFilter watch 外部值，同步到 innerStartDate / innerEndDate
  -> 用户操作 t-date-picker，先改变子组件内部值
  -> validateDateRange 校验起止日期
  -> 子组件通过 defineModel 回写父组件
  -> 父组件 watcher 监听日期变化
  -> 重置分页并请求列表接口
  -> 接口结果更新 table/card 列表
```

从组件通信类型看，它同时包含两类通信：

| 通信内容 | 方向 | 通信方式 | 类型判断 | 说明 |
| --- | --- | --- | --- | --- |
| `startDate` | 父 -> 子 -> 父 | `v-model:startDate` / `defineModel('startDate')` | 控制权 + 可编辑值 | 父组件持有真实值，子组件编辑后回写 |
| `endDate` | 父 -> 子 -> 父 | `v-model:endDate` / `defineModel('endDate')` | 控制权 + 可编辑值 | 父组件持有真实值，子组件可在非法范围时清空 |
| `config` | 父 -> 子 | `props.config` | 只读配置值 | 控制 label、placeholder、format、warning 文案等 |
| 校验失败提示 | 子组件内部 | `MessagePlugin.warning` | 子组件局部副作用 | 不通知父组件具体失败原因，只把修正后的值回写 |
| 查询动作 | 父组件内部 | `watch` + `fetch...` | 父组件业务动作 | 子组件不关心接口参数和分页 |

## DateRangeFilter 自身职责

### 组件分层

`DateRangeFilter` 更接近“业务区块组件里的轻筛选组件”，不是页面组件，也不是完全纯展示组件。

它承担的职责：

- 展示两个 `t-date-picker`。
- 接收父组件传入的 `startDate` / `endDate`。
- 用 `innerStartDate` / `innerEndDate` 保存当前编辑态。
- 通过 `config` 合并默认文案和页面自定义文案。
- 在 `change` / `blur` 时执行起止日期校验。
- 校验后通过 `defineModel` 把最终日期回写给父组件。

它不承担的职责：

- 不拼接口参数。
- 不重置分页。
- 不请求列表。
- 不维护 table/card 数据。
- 不写入 store 或 storage。

### 内部状态结构

`DateRangeFilter` 里有两层状态：

| 状态 | 所在位置 | 作用 | 是否真实业务状态 |
| --- | --- | --- | --- |
| `startDate` | `defineModel('startDate')` | 接收并回写父组件开始日期 | 是，归父组件所有 |
| `endDate` | `defineModel('endDate')` | 接收并回写父组件结束日期 | 是，归父组件所有 |
| `innerStartDate` | 子组件 `ref('')` | 日期选择器当前编辑值 | 否，是子组件副本 |
| `innerEndDate` | 子组件 `ref('')` | 日期选择器当前编辑值，非法时会被清空 | 否，是子组件副本 |
| `mergedConfig` | 子组件 `computed` | 默认配置 + 父组件配置 | 否，是渲染配置 |

父组件清空或改值时，子组件通过：

```js
watch(() => [startDate.value, endDate.value], ([newStartDate, newEndDate]) => {
  innerStartDate.value = newStartDate || '';
  innerEndDate.value = newEndDate || '';
}, { immediate: true })
```

把外部真实值同步进内部编辑态。

用户选择日期后，子组件通过：

```js
startDate.value = innerStartDate.value;
endDate.value = innerEndDate.value;
```

把内部编辑态回写给父组件。这里的 `defineModel` 本质上会触发对应的 `update:startDate` / `update:endDate`。

## 主流程：用户选择合法日期后查询列表

```text
用户选择开始/结束日期
  -> t-date-picker 改变 innerStartDate / innerEndDate
  -> 触发 validateDateRange
  -> parseDateValue / normalizeDateValue 把日期转成时间戳
  -> 判断 start <= end
  -> 回写 startDate.value / endDate.value
  -> 父组件 searchForm/search 被更新
  -> 父组件 watcher 触发
  -> pagination.current = 1
  -> fetchTableData / fetchData / fetchApprovalList
  -> 日期进入接口参数
  -> 列表刷新
```

这条链路里，子组件只管“日期输入是否可用”，父组件才管“这个日期用来查什么接口”。

## 支线流程

### 支线 1：父组件点击清除筛选

```text
点击清除筛选
  -> 父组件把 startDate / endDate 置空
  -> 父组件主动请求列表
  -> DateRangeFilter 的 watch 收到空值
  -> innerStartDate / innerEndDate 被清空
  -> 两个日期选择器 UI 清空
```

这里是典型的父组件控制子组件。真实状态在父组件，所以清空动作也应该由父组件发起。

需要注意：多个父组件的 `handleClearSearch` 都会“先改筛选字段，再主动 fetch”，同时页面上又有 watcher 监听筛选字段变化。因为各页面大多有 `loading` guard，重复请求通常会被挡住，但从阅读角度看，这里存在“清空函数主动查一次 + watcher 可能再查一次”的双触发结构。

### 支线 2：开始日期大于结束日期

```text
用户选出 start > end
  -> validateDateRange 判断非法
  -> MessagePlugin.warning(mergedConfig.warningMessage)
  -> innerEndDate = ''
  -> startDate.value = innerStartDate.value
  -> endDate.value = ''
  -> 父组件收到新的 startDate 和空 endDate
  -> 父组件 watcher 触发查询
```

这个分支说明 `DateRangeFilter` 不只是“展示输入框”，它还拥有局部校验权，并且会主动修正父组件的 `endDate`。这不一定错误，因为日期范围组件本来就可以封装校验；但读代码时要知道：父组件的 `endDate` 可能不是用户手动清空的，而是子组件校验失败后清空的。

### 支线 3：只选了开始日期或只选了结束日期

`DateRangeFilter` 本身允许单边日期存在，因为校验条件是：

```js
if (start > end && (start !== null && end !== null)) {
  ...
}
```

也就是说，只有开始和结束都存在且 `start > end` 时才判定非法。

不同父组件对单边日期的处理不完全一致：

- 大多数页面会把单边日期也传给接口，例如 `startTime: searchForm.startDate || undefined`。
- `sysLogList.vue` 只有 `startDate` 和 `endDate` 同时存在时，才传 `createTimeFrom` / `createTimeTo`。

因此，`DateRangeFilter` 的校验策略是通用的，但业务查询策略由父组件决定。

## 父组件调用关系总表

| 父组件 | 状态持有者 | 调用方式 | 自定义 config | 日期进入接口参数 | 监听方式 |
| --- | --- | --- | --- | --- | --- |
| `rewardPunish/index.vue` | `searchForm.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | 无，走默认 label | `startTime` / `endTime` | 单独 watch 日期数组 |
| `jobFeedback/index.vue` | `searchForm.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | 无，走默认 label | `createTimeStart` / `createTimeEnd` | deep watch `searchForm` |
| `vehicle/index.vue` | `searchForm.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | `{ label: '使用时间:' }` | 列表用 `startTime 00:00:00` / `endTime 23:59:59`，导出用原始日期 | watch 多个字段数组 |
| `system/sysLog/sysLogList.vue` | `searchForm.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | `{ label: '操作时间:' }` | `createTimeFrom` / `createTimeTo = endDate + 1 day` | watch 多个字段数组 |
| `complaint/index.vue` | `searchForm.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | 无，走默认 label | `createTimeStart` / `createTimeEnd` | deep watch `searchForm` |
| `approval/index.vue` | `search.value.startDate/endDate` | `v-model:startDate` + `v-model:endDate` | `{ label: '创建日期:' }` | `createTimeFrom` / `createTimeTo = endDate + 1 day` | watch 多个字段数组 |

## 各父组件细节

### 1. rewardPunish/index.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="searchForm.startDate"
  v-model:endDate="searchForm.endDate"
/>
```

状态归属：

- 父组件用 `reactive` 创建 `searchForm`。
- `startDate` / `endDate` 是页面筛选条件的一部分。
- `DateRangeFilter` 只是编辑这两个字段。

回流链路：

```text
DateRangeFilter 回写 searchForm.startDate/endDate
  -> watch(() => [searchForm.startDate, searchForm.endDate])
  -> pagination.current = 1
  -> fetchTableData()
  -> apiRewardPage(paramsData, bodyParams)
```

接口参数：

```js
const bodyParams = {
  keyword: searchForm.keyword?.trim() || undefined,
  type: searchForm.rewardType || undefined,
  startTime: searchForm.startDate || undefined,
  endTime: searchForm.endDate || undefined,
}
```

这个页面把日期范围映射成 `startTime` / `endTime`，语义上是“奖惩记录提交时间或业务时间范围筛选”。`DateRangeFilter` 不知道这个语义，只提供日期值。

### 2. jobFeedback/index.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="searchForm.startDate"
  v-model:endDate="searchForm.endDate"
/>
```

状态归属：

- 父组件 `searchForm` 持有 `status/startDate/endDate`。
- 日期和状态一起组成岗位反馈列表的筛选条件。

回流链路：

```text
DateRangeFilter 回写 searchForm.startDate/endDate
  -> deep watch(searchForm)
  -> pagination.current = 1
  -> fetchTableData()
  -> apiFeedBackPage(params, body)
```

接口参数：

```js
const body = {
  transferStatus: searchForm.status === '' ? undefined : Number(searchForm.status),
  createTimeStart: searchForm.startDate || undefined,
  createTimeEnd: searchForm.endDate || undefined,
}
```

这里的日期语义是“反馈创建时间”。父组件用 deep watch 监听整个 `searchForm`，所以日期、状态任意一个变化都会刷新列表。

### 3. vehicle/index.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="searchForm.startDate"
  v-model:endDate="searchForm.endDate"
  :config="{ label: '使用时间:' }"
/>
```

状态归属：

- 父组件持有车辆列表筛选条件：`keywords/users/status/startDate/endDate`。
- 子组件只负责“使用时间”的起止日期输入。

回流链路：

```text
DateRangeFilter 回写 searchForm.startDate/endDate
  -> watch([keywords, users, status, startDate, endDate])
  -> pagination.current = 1
  -> fetchTableData()
  -> vehiclePage(queryParams, bodyParams)
```

列表接口参数：

```js
const bodyParams = {
  keywords: searchForm.keywords?.trim() || undefined,
  driverName: searchForm.users?.trim() || undefined,
  status: searchForm.status === '' ? undefined : searchForm.status,
  startTime: searchForm.startDate ? `${searchForm.startDate} 00:00:00` : undefined,
  endTime: searchForm.endDate ? `${searchForm.endDate} 23:59:59` : undefined,
}
```

导出接口参数：

```js
const bodyParams = {
  keywords: searchForm.keywords?.trim() || '',
  driverName: searchForm.users?.trim() || '',
  status: searchForm.status || '',
  startTime: searchForm.startDate || '',
  endTime: searchForm.endDate || '',
  vehicleType: ''
}
```

这个页面有一个需要注意的差异：列表查询会给日期补 `00:00:00` / `23:59:59`，导出时却传原始日期字符串。若后端导出接口和列表接口对日期格式要求不同，这可以接受；如果期望导出结果和列表筛选完全一致，这里可能需要统一。

### 4. system/sysLog/sysLogList.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="searchForm.startDate"
  v-model:endDate="searchForm.endDate"
  :config="{ label: '操作时间:' }"
/>
```

状态归属：

- 父组件持有 `realName/startDate/endDate`。
- 日期语义是日志操作时间。

回流链路：

```text
DateRangeFilter 回写 searchForm.startDate/endDate
  -> watch([realName, startDate, endDate])
  -> pagination.current = 1
  -> fetchData()
  -> getAuditLogPage(bodyData, pagination)
```

接口参数：

```js
if (searchForm.startDate && searchForm.endDate) {
  bodyData.createTimeFrom = searchForm.startDate;
  bodyData.createTimeTo = addOneDay(searchForm.endDate);
}
```

这个页面和其他页面最大的区别是：只有开始日期和结束日期都存在时才传日期参数。结束日期还会通过 `addOneDay` 加一天，用来覆盖结束日期当天的所有时间。这说明 sysLog 页面把后端区间理解成 `[createTimeFrom, createTimeTo)` 这种半开区间。

### 5. complaint/index.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="searchForm.startDate"
  v-model:endDate="searchForm.endDate"
/>
```

状态归属：

- 父组件持有 `status/responsibleDeptId/startDate/endDate`。
- 日期和投诉状态、责任部门一起组成投诉列表筛选条件。

回流链路：

```text
DateRangeFilter 回写 searchForm.startDate/endDate
  -> deep watch(searchForm)
  -> pagination.current = 1
  -> fetchTableData()
  -> apiComplaintPage(queryData, searchData)
```

接口参数：

```js
const searchData = {
  complaintStatus: searchForm.status === '' ? undefined : Number(searchForm.status),
  assignedDeptIds: searchForm.responsibleDeptId === undefined
    || searchForm.responsibleDeptId === null
    || searchForm.responsibleDeptId === ''
      ? undefined
      : [Number(searchForm.responsibleDeptId)],
  createTimeStart: searchForm.startDate || undefined,
  createTimeEnd: searchForm.endDate || undefined,
};
```

这个页面用 deep watch 统一监听筛选对象，写法简单，但“哪个字段变化导致请求”不如数组 watch 直观。

### 6. approval/index.vue

调用位置：

```vue
<date-range-filter
  v-model:startDate="search.startDate"
  v-model:endDate="search.endDate"
  :config="{ label: '创建日期:' }"
/>
```

状态归属：

- 父组件用 `ref({ ... })` 保存搜索对象。
- `startDate/endDate` 是审批卡片列表查询参数的一部分。

回流链路：

```text
DateRangeFilter 回写 search.value.startDate/endDate
  -> watch([status, type, keyword, startDate, endDate])
  -> pagination.current = 1
  -> fetchApprovalList()
  -> getAllFormPage(params)
  -> approvalList 更新
  -> filteredList computed 返回卡片列表
```

接口参数：

```js
if (search.value.startDate) {
  params.createTimeFrom = search.value.startDate;
}
if (search.value.endDate) {
  params.createTimeTo = addOneDay(search.value.endDate);
}
```

这个页面和 `sysLogList.vue` 一样，会给结束日期加一天。但它允许只传开始或只传结束，不要求两个日期同时存在。

此外，`approval/index.vue` 还有路由恢复逻辑：

```text
route.query.formId / bizType
  -> openApprovalDetailFromRoute
  -> 清空 search.startDate/endDate
  -> fetchApprovalList({ bizTypeList: [bizType] })
```

这条链路不是 `DateRangeFilter` 主动触发的，但会影响它：父组件清空 `search.startDate/endDate` 后，子组件 watch 到外部值变化，日期选择器也会被清空。

## 组件通信图

```text
Page / Container Component
  owns:
    searchForm.startDate
    searchForm.endDate
    pagination
    table/card data

  passes:
    v-model:startDate
    v-model:endDate
    config

        |
        v

DateRangeFilter
  owns:
    innerStartDate
    innerEndDate
    mergedConfig

  does:
    show two t-date-picker controls
    validate start <= end
    warn and clear end date when invalid

        |
        v

Page / Container Component
  receives:
    updated startDate/endDate

  then:
    watcher resets page
    calls API
    renders new list
```

## 状态归属判断

| 状态/方法 | 真实持有者 | 触发者 | 影响范围 | 判断 |
| --- | --- | --- | --- | --- |
| `searchForm.startDate` / `search.value.startDate` | 父页面 | 子组件回写或父组件清空 | 接口查询、列表刷新、分页重置 | 页面级筛选状态 |
| `searchForm.endDate` / `search.value.endDate` | 父页面 | 子组件回写或父组件清空 | 接口查询、列表刷新、分页重置 | 页面级筛选状态 |
| `innerStartDate` | `DateRangeFilter` | `t-date-picker` 或外部 watch | 日期选择器显示 | 子组件临时编辑态 |
| `innerEndDate` | `DateRangeFilter` | `t-date-picker`、外部 watch、非法范围清空 | 日期选择器显示 | 子组件临时编辑态 |
| `validateDateRange` | `DateRangeFilter` | `change` / `blur` | 日期合法性、父组件日期值 | 子组件局部业务逻辑 |
| `fetchTableData` / `fetchData` / `fetchApprovalList` | 父页面 | watcher、清空、分页、初始化 | API 和列表 | 页面级业务动作 |

## 为什么这里适合用 v-model

`DateRangeFilter` 的核心是“可编辑输入组件”：父组件给它当前值，用户在子组件里编辑，子组件再把新值交回父组件。这正是 `v-model` 适合表达的场景。

如果改成纯 `props + emit`，大概会变成：

```vue
<date-range-filter
  :start-date="searchForm.startDate"
  :end-date="searchForm.endDate"
  @update-start-date="searchForm.startDate = $event"
  @update-end-date="searchForm.endDate = $event"
/>
```

语义不会更清楚，模板反而更长。所以当前 `v-model:startDate` / `v-model:endDate` 的方向是合理的。

## 需要特别留意的点

### 1. 子组件存在“双状态”

现在是：

```text
父组件真实值 startDate/endDate
  <-> 子组件副本 innerStartDate/innerEndDate
```

这样做的好处是子组件可以先本地编辑和校验，再回写父组件。代价是阅读者必须理解两条同步链：

- 父 -> 子：`watch` 同步外部值到内部值。
- 子 -> 父：`validateDateRange` 回写 `defineModel`。

如果以后组件逻辑继续变复杂，可以考虑减少副本状态，或者把“提交回写”和“校验修正”拆得更清楚。

### 2. `validateDateRange` 同时负责校验和回写

它现在做了三件事：

1. 解析日期。
2. 判断起止日期是否合法。
3. 修正并回写父组件。

对于当前组件规模还能接受，但如果未来加快捷日期、禁用范围、默认时间段等功能，建议拆成：

- `isInvalidRange`
- `normalizeRange`
- `commitRangeToParent`

这样初学者会更容易读懂。

### 3. 多个父组件清空筛选时可能形成双触发

很多页面都是：

```text
handleClearSearch 修改 searchForm
  -> 主动 fetch
  -> watcher 也监听到 searchForm 变化
```

当前大多数请求函数开头都有 `loading` 判断，所以通常不会造成明显重复请求。但从职责设计看，更清晰的方式是二选一：

- 方案 A：清空函数只改状态，让 watcher 统一触发查询。
- 方案 B：清空函数改状态并主动查，watcher 对清空流程做抑制。

保持一种触发源，后续排查请求次数会更轻松。

### 4. 各页面日期边界处理不一致

不同页面对结束日期的处理不同：

- `vehicle` 列表：补 `23:59:59`。
- `sysLog`：`endDate + 1 day`。
- `approval`：`endDate + 1 day`。
- `rewardPunish/jobFeedback/complaint`：直接传原始结束日期。

这不一定是错，因为后端接口可能约定不同。但从项目统一性看，建议以后整理一份“日期范围传参规范”，明确：

- 后端是闭区间还是半开区间。
- 结束日期是否要包含当天所有时间。
- 导出接口和列表接口是否必须保持一致。

### 5. `DateRangeFilter.vue` 里 `ref` / `watch` 没有显式 import

代码里显式 import 了：

```js
import { computed } from 'vue';
```

但实际使用了：

```js
ref(...)
watch(...)
```

如果项目配置了 Vue 自动导入，这没问题；如果没有自动导入，组件会报错。阅读这个文件时要结合项目构建配置判断。为了降低隐式依赖，显式写成下面这样会更稳：

```js
import { computed, ref, watch } from 'vue';
```

## 最适合初学者记住的一句话

`DateRangeFilter` 自己不查数据，它只是“帮父组件编辑两个日期”。父组件才是真正的状态持有者和业务决策者：父组件决定日期叫什么参数、什么时候查接口、查完怎么渲染列表；子组件只负责日期输入、局部校验和把结果回写。
