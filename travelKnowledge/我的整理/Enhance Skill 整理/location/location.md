# attendance 定位相关代码分析

这份文档只分析代码，不修改业务代码。

分析对象：

- `sites/uniapp/src/packageAttendance/attendance/index.vue`
- `sites/uniapp/src/packageAttendance/attendance/locationPermission.js`
- `sites/uniapp/src/packageAttendance/attendance/components/AttendanceLocationSelector.vue`
- 为了讲清楚 store 和 localStorage，也一起看了：
  - `sites/uniapp/src/store/modules/account.js`
  - `sites/uniapp/src/services/locationReporterRuntime.js`
  - `sites/uniapp/src/services/locationReporter.js`
  - `sites/uniapp/src/App.vue`

## 和 vue-inline-simplifier 的符合度

结论：当前代码“部分符合”，但不建议为了强行贴合 skill 去搬动现有业务逻辑。

符合的地方：

- `attendance/index.vue` 里的页面状态、computed、watch、生命周期、扫码提交、车辆提交、缓存恢复，大部分都留在当前 Vue 页面内，符合“页面专属逻辑优先写在当前 `.vue`”。
- `AttendanceLocationSelector.vue` 的表单状态、computed、watch、校验、emit 也都写在组件内部，符合“不额外拆 hooks/utils”的方向。
- 关键定位、权限、缓存流程都有注释，符合“新增或重写代码按逻辑段加注释”的阅读习惯。
- 没有把车辆表单逻辑继续拆成新的 helper、hooks、composables。

不完全符合的地方：

- `locationPermission.js` 是 attendance 目录下的页面专属定位权限 helper。如果这段是现在按照 `vue-inline-simplifier` 新写的，更推荐直接写回 `attendance/index.vue`，不要主动新建同目录 JS。
- `attendance/index.vue` 的车辆审批恢复逻辑和 `store/modules/account.js` 的恢复逻辑有相似段落。它们有业务原因：页面打开时要恢复，App 回前台/重新登录时也要恢复。但从“简化代码”的角度看，阅读成本确实偏高。
- `normalizeValue`、`applyLocationTarget`、`waitVehicleApproved` 这些函数名和职责还算清楚，但页面承担了扫码、审批、定位、缓存多条线，所以整体认知负担比较重。

为什么我不建议现在改业务源码：

- 把 `locationPermission.js` 合回 `attendance/index.vue` 会改变 import 边界，虽然理论上行为可保持一致，但定位权限是高风险链路。
- 车辆定位依赖审批轮询、缓存恢复、App 回前台、重新登录、后台定位权限，无法连接服务器时很难完整回归。
- `vue-inline-simplifier` 明确要求“不破坏现有业务行为”，所以当前最稳的处理是记录不完全符合点，不做执行代码搬迁。

后续真要按 skill 改时，建议只做小步：

1. 先只整理 `attendance/index.vue` 内部注释和函数分段，不改逻辑。
2. 再评估 `locationPermission.js` 是否真的只被 attendance 使用。
3. 如果确认只服务当前页面，再考虑把一次性打卡定位权限逻辑合回 `index.vue`。
4. 最后再看页面恢复逻辑和 store 恢复逻辑是否能用更简单的注释说明，而不是急着抽公共函数。

## 先记住总图

这个 attendance 里的定位其实分成两种：

1. 扫码打卡定位：只取一次当前位置，拿到 `lng/lat` 后提交打卡接口。
2. 使用车辆定位：审批通过后开启持续定位上报，直到结束使用车辆。

这两种定位不要混在一起看。

扫码打卡定位走：

`handleScanCodeTap -> handleScanTap -> getClockCoordinates -> getCurrentLocationWithPermission -> uni.getLocation -> attendanceLongterm/attendanceTempterm`

车辆持续定位走：

`AttendanceLocationSelector -> handleSubmitVehicle -> apiModifyCarStatus -> waitVehicleApproved -> applyLocationTarget -> setLocationReporterEntityId -> startLocationReporter -> locationReporter.start`

## store 和 localStorage 的配合

项目里说的 localStorage，在 uni-app 代码里主要是 `uni.setStorageSync / uni.getStorageSync / uni.removeStorageSync`。如果跑在 H5，它可以理解成浏览器 localStorage；如果跑在小程序，它就是小程序本地缓存。

这里有 4 层状态：

第一层：页面内存状态，在 `attendance/index.vue` 里。

- `selectedVehicle`：当前车辆表单和审批单信息。
- `vehicleActive`：车辆定位是否已经启动。
- `vehicleApprovalStatus`：车辆审批状态，比如 `审批中`、`已执行`。
- `vehicleSubmitting`：按钮提交锁。
- `scanLoading`：扫码打卡 loading。

这些是页面正在显示用的状态，刷新或离开页面后会丢。

第二层：车辆业务缓存，key 是 `attendanceVehicleState`。

存的内容是：

```js
{
  selectedVehicle,
  vehicleActive,
  vehicleApprovalStatus,
}
```

它的作用是：页面离开、重新进入、App 回前台、重新登录后，还能知道车辆审批/用车进行到哪一步。

第三层：定位 runtime 缓存，key 是 `LOCATION_REPORTER_RUNTIME_STATE`。

存的内容是：

```js
{
  entityId,
  type,
  active,
}
```

它不关心“车辆表单是什么”，只关心“定位上报器现在应该追踪谁，以及是否应该继续跑”。

第四层：底层上报缓存，在 `locationReporter.js` 里。

- `LOCATION_REPORT_LAST_SUCCESS_AT`：上一次成功上报的时间。
- `LOCATION_REPORT_PENDING_PAYLOAD`：上次上报失败、等待重试的定位点。

它不关心考勤业务，只负责让定位上报更稳。

<font color="#4f81bd">**最重要的一句话：**</font>

<font color="#4f81bd">**`attendanceVehicleState` 是业务状态缓存，`LOCATION_REPORTER_RUNTIME_STATE` 是定位上报器运行状态缓存，Pinia store 负责在登录、回前台时把它们串起来。**</font>

## 一条完整的车辆定位恢复链路

用户提交车辆：

1. 子组件把车辆表单 emit 给父页面。
2. 父页面调用 `apiModifyCarStatus` 创建审批单。
3. 父页面把 `审批中` 写进 `attendanceVehicleState`。
4. 父页面轮询 `apiCheckApproval`。
5. 审批变成 `已执行` 后，调用 `setLocationReporterEntityId(车牌号, 1)`。
6. 调用 `startLocationReporter()`。
7. runtime 写入 `LOCATION_REPORTER_RUNTIME_STATE.active = true`。
8. 父页面把 `vehicleActive = true` 写回 `attendanceVehicleState`。

页面重新进入：

1. `onLoad` 调 `restoreVehicleState()`。
2. 页面从 `attendanceVehicleState` 回填 `selectedVehicle / vehicleActive / vehicleApprovalStatus`。
3. 如果发现审批中，或者已执行但定位没开，就调用 `resumeVehicleApproval()` 继续后半段。

App 回前台：

1. `App.vue` 先看 `shouldResumeLocationReporter()`。
2. 如果 runtime 缓存显示定位本来就是 active，就直接 `startLocationReporter()`。
3. 如果 runtime 没有 active，再让 `accountStore.resumeVehicleLocation()` 从 `attendanceVehicleState` 业务缓存恢复。

重新登录：

1. 正式员工登录后，`accountStore.login()` 调 `getSystemInfo(true)`。
2. 然后调 `resumeVehicleLocation()`。
3. store 从 `attendanceVehicleState` 找车辆状态。
4. 如果上次已经 `vehicleActive`，直接重启定位上报。
5. 如果还在审批中或已执行但定位没开，就继续查审批，通过后再启动定位。

退出登录：

1. `logout()` 会停止定位上报。
2. 清空 runtime 的 entityId。
3. 删除 token。
4. 但它没有删除 `attendanceVehicleState`。

这意味着：车辆业务缓存是故意保留的，方便重新登录后继续恢复车辆审批/定位。

## `locationPermission.js` 逐段分析

### 顶部常量

`LOCATION_PERMISSION_MESSAGE` 是统一的定位失败提示。这样后面多个函数不用到处写一样的文案。

小白写法套路：先把会重复出现的文案、key、状态码抽成常量。

### `callUniApi(methodName, options = {})`

这个 function 是干啥的：

它把 uni-app 的 callback API 包成 Promise。

它接收什么数据：

- `methodName`：比如 `getSetting`、`authorize`、`getLocation`。
- `options`：传给 uni API 的参数。

它返回什么结果：

- 成功时 resolve uni API 的 success 结果。
- 失败时 reject 错误。

它中间做了几步：

1. 从 `uni` 上取对应方法。
2. 判断方法是不是存在。
3. 调用方法。
4. 把 `success` 接到 `resolve`，把 `fail` 接到 `reject`。

一句话总结：

这是一个“把 callback 变 async/await”的工具函数。

### `USER_LOCATION_SCOPE`

`scope.userLocation` 是微信小程序“使用时定位”的授权 key。

注意：这里不是后台持续定位权限，只是普通前台定位权限。扫码打卡只取一次定位，所以用这个权限。

### `getAuthSetting()`

这个 function 是干啥的：

读取当前用户对小程序权限的设置。

它中间做了几步：

1. 调 `uni.getSetting`。
2. 从结果里取 `authSetting`。
3. 没有就返回空对象。

关键点：

`authSetting[scope.userLocation]` 有 3 种状态：

- `true`：用户同意过。
- `false`：用户拒绝过。
- `undefined`：用户还没选择过。

### `openLocationSetting()`

这个 function 是干啥的：

当用户拒绝过定位权限时，引导用户去设置页重新打开。

它中间做了几步：

1. 弹窗告诉用户“需要获取位置权限才能打卡”。
2. 用户点取消，就抛错。
3. 用户点去设置，就调用 `openSetting`。
4. 从设置页回来后，再检查 `scope.userLocation` 是否为 `true`。
5. 如果还不是 `true`，继续抛错。

一句话总结：

用户拒绝过授权后，代码不能再直接弹系统授权，只能引导去设置页。

### `ensureUserLocationPermission()`

这个 function 是干啥的：

保证用户有前台定位权限。

它中间做了几步：

1. 先读当前授权状态。
2. 如果已经是 `true`，直接结束。
3. 如果是 `false`，说明拒绝过，走 `openLocationSetting()`。
4. 如果是 `undefined`，说明没问过，调用 `authorize` 主动申请。
5. 如果 `authorize` 失败，也走设置页。

小白模仿顺序：

先查权限状态 -> 已同意直接放行 -> 已拒绝去设置页 -> 未选择就申请授权 -> 失败兜底去设置页。

### `showLocationToast()`

这个 function 是干啥的：

定位不稳定时弹 toast，但 30 秒内最多弹一次。

为什么要这样写：

定位失败可能连续触发，如果每次都弹，用户会被 toast 刷屏。

核心变量：

- `LOCATION_TOAST_COOLDOWN_MS = 30 * 1000`
- `lastLocationToastAt`

一句话总结：

这是一个“带冷却时间的 toast”。

### `getCurrentLocationWithPermission(options = {})`

这个 function 是干啥的：

扫码打卡前，先确认权限，再真正取当前位置。

它中间做了几步：

1. `await ensureUserLocationPermission()`。
2. 调 `uni.getLocation`。
3. 指定 `type: 'gcj02'`。
4. 开启 `isHighAccuracy: true`。
5. 如果失败，先弹“定位不稳定”的 toast，再把错误抛出去。

注意：

它只负责“一次性取当前定位”，不负责持续上报。

## `AttendanceLocationSelector.vue` 逐段分析

这个组件只做表单和状态展示，不直接调接口，也不直接开定位。

它和父页面的关系：

- 父页面传入状态：`selectedVehicle / vehicleActive / approvalStatus / submitting`。
- 子组件显示表单、禁用状态、按钮文案。
- 用户点击按钮后，子组件通过 `emit` 通知父页面。

### template 表单区域

驾驶员是只读展示，来自 `driverDisplayText`。

车牌号、车辆类型、营运车辆、用车金额是用户输入。

`formDisabled` 控制是否禁用表单：

- 审批中禁用。
- 审批已执行但定位未开启时禁用。
- 车辆使用中禁用。

### template 状态和按钮

`statusText` 显示当前状态：

- `车辆审批中`
- `车辆已执行，请开启定位`
- `车辆使用中`
- `待开始使用车辆`

按钮分两种：

- `vehicleActive = true` 时显示“结束使用车辆”。
- 否则显示提交/开启定位按钮。

### props

props 是父组件给子组件的数据入口。

重点字段：

- `personalName`：驾驶员名字。
- `isTempWorker`：临时工不显示车辆使用。
- `selectedVehicle`：父页面缓存或接口得到的车辆数据。
- `vehicleActive`：车辆定位是否正在跑。
- `approvalStatus`：审批状态。
- `submitting`：父页面是否正在提交。

小白理解：

props 是“父页面说当前是什么状态”，子组件不要自己猜。

### emits

组件向外发两个事件：

- `submitVehicle`
- `closeVehicle`

真正的接口请求、审批轮询、定位启动，都由父页面处理。

这是一种比较好的分工：子组件只管输入，父组件只管业务流程。

### 常量和表单对象

`VEHICLE_TYPE_OPTIONS` 和 `VEHICLE_CATEGORY_OPTIONS` 是 picker 选项。

`EMPTY_FORM` 是表单初始值。

`FORM_RULES` 是校验文案。

`formData` 用 `reactive` 保存真实输入：

```js
{
  licensePlate: '',
  vehicleType: '',
  vehicleCategory: '',
  amount: '',
}
```

小白模仿：

表单字段集中放在一个对象里，不要散成很多个 `ref`。

### computed 状态

这里的 computed 写得很适合模仿。

- `approvalPending`：是否审批中。
- `locationPending`：审批已执行但定位还没开启。
- `formDisabled`：是否禁用表单。
- `driverDisplayText`：驾驶员显示名。
- `showVehicleCategory`：是否展示大车/小车。
- `vehicleTypeIndex`：picker 需要的下标。
- `selectedVehicleTypeLabel`：页面展示文案。
- `submitErrorText`：集中校验结果。
- `submitDisabled`：按钮是否禁用。
- `submitButtonText`：按钮文案。
- `statusText`：状态文案。

这里的固定套路是：

已有数据能推导出来的，就用 computed，不要再手动维护一份状态。

### `showToast(title)`

组件内部统一 toast 出口。

好处是：

以后想改 toast 样式、时长、icon，只改这一处。

### `resetForm()`

这个 function 是干啥的：

把表单恢复成空表单。

它用 `Object.assign(formData, EMPTY_FORM)`，因为 `formData` 是 reactive 对象，不能直接 `formData = {}`。

一句话总结：

reactive 表单重置时，改对象属性，不换对象引用。

### `fillForm(vehicle = {})`

这个 function 是干啥的：

把父页面传进来的车辆缓存/接口数据回填到表单。

它中间做了几步：

1. 回填车牌号。
2. 回填车辆类型。
3. 回填大车/小车。
4. 回填金额。

它还做了字段兼容：

`vehicle.relatedCost ?? vehicle.amount ?? ''`

意思是接口字段和表单字段都能兼容。

### `handleVehicleTypeChange(event)`

picker 返回的是下标，不是业务 value。

所以这段先拿下标，再从 `VEHICLE_TYPE_OPTIONS` 里找到真正的 value，最后存进 `formData.vehicleType`。

注意：

它没有直接清空 `vehicleCategory`，而是交给下面的 watch 做。

### `handleVehicleCategoryChange(event)`

和车辆类型一样，把 picker 下标转成业务 value。

小白模仿：

picker 只负责选下标，业务代码要统一转成后端需要的 value。

### `handleSubmitVehicle()`

这个 function 是干啥的：

用户点“提交使用车辆审批”或“开启车辆定位”时，把表单整理好发给父组件。

它中间做了几步：

1. 先看 `submitErrorText`。
2. 有错误就 toast 并 return。
3. 没错误就 emit `submitVehicle`。
4. emit 的 payload 里只放父组件需要的字段。

重要：

它不调接口，不开定位。

一句话总结：

子组件只负责“校验表单 + 发事件”，父组件负责真正业务。

### `handleCloseVehicle()`

这个 function 是干啥的：

用户点“结束使用车辆”时通知父组件。

它只做两件事：

1. 如果正在提交，直接 return。
2. emit `closeVehicle`。

### watch：监听 `formData.vehicleType`

当车辆类型不是营运车辆时，清空 `vehicleCategory`。

为什么用 watch：

因为这是字段联动：一个字段变化后，要影响另一个字段。

固定套路：

字段 A 变化 -> 字段 B 要跟着清理或更新 -> 用 watch。

### watch：监听 `props.selectedVehicle`

这个 watch 负责回显。

逻辑是：

1. 如果是临时工，或没有车辆数据：
   - 当前没激活车辆时，清空表单。
   - 当前激活车辆时，不乱清。
2. 如果有车辆数据，就 `fillForm(vehicle)`。

`immediate: true` 表示组件一加载就先执行一次，用来初始化表单。

### watch：监听 `props.isTempWorker`

临时工没有车辆使用场景，所以一旦切成临时工就清空表单。

### watch：监听 `props.vehicleActive`

当父组件告诉子组件“车辆从使用中变成未使用”时，子组件清空表单。

它用到了 `(isActive, wasActive)`：

- `isActive` 是新值。
- `wasActive` 是旧值。

只有从 true 变 false，才说明刚刚结束车辆使用。

## `attendance/index.vue` 逐段分析

这个文件是最乱的地方，因为它同时管：

- 首页 UI。
- 扫码打卡。
- 车辆表单父组件状态。
- 车辆审批。
- 车辆持续定位。
- 本地缓存恢复。

改它时建议分成 3 条线看：扫码线、车辆审批线、缓存恢复线。

### template

页面有 3 个主要卡片：

1. 扫码打卡卡片。
2. 考勤记录/请假入口卡片。
3. 使用车辆卡片。

车辆卡片只给正式员工看：

```vue
<view v-if="!accountStore.isTempWorker" class="card action-card">
```

`AttendanceLocationSelector` 接收父页面状态：

- `selectedVehicle`
- `vehicleActive`
- `vehicleApprovalStatus`
- `vehicleSubmitting`

并向父页面发：

- `submitVehicle`
- `closeVehicle`

### import 区

这里引入了 4 类东西：

1. 接口：`apiModifyCarStatus / apiStopCar / apiCheckApproval / attendanceLongterm / attendanceTempterm`
2. store：`useAccountStore / usePermissionStore`
3. 定位 runtime：`setLocationReporterEntityId / startLocationReporter / stopLocationReporter`
4. 一次性定位权限：`ensureUserLocationPermission / getCurrentLocationWithPermission`

注意：

`getCurrentLocationWithPermission` 用于扫码打卡一次性定位。

`startLocationReporter` 用于车辆持续定位。

### 常量区

车辆定位相关常量：

- `VEHICLE_LOCATION_TYPE = 1`
- `VEHICLE_STATE_KEY = 'attendanceVehicleState'`
- `VEHICLE_APPROVING_STATUS = '审批中'`
- `VEHICLE_APPROVED_STATUS = '已执行'`
- `VEHICLE_APPROVAL_CHECK_INTERVAL = 10000`
- `VEHICLE_APPROVAL_MAX_CHECK_COUNT = 180`

这里的意思是：

车辆定位的业务类型固定传 `1`，审批最多每 10 秒查一次，最多查 180 次。

### store 和 ref 状态

`accountStore` 提供账号信息和是否临时工。

`permissionStore` 提供权限码。

页面自己的状态：

- `selectedVehicle`：当前车辆信息。
- `vehicleActive`：持续定位是否启动。
- `vehicleApprovalStatus`：审批状态。
- `vehicleSubmitting`：防重复提交。
- `scanLoading`：扫码打卡 loading。
- `vehicleApprovalRunId`：取消旧轮询用。

### `displayUserName`

这个 computed 从多个字段里兜底取用户名。

顺序是：

`accountRealName -> realName -> accountName -> name -> 用户`

这是典型的显示字段兜底写法。

### `filteredActionItems`

这个 computed 决定考勤记录/请假入口是否显示。

逻辑：

1. 临时工不显示请假。
2. 临时工其他入口默认显示。
3. 正式员工看权限码。

重点：

权限判断不要写在 template 一堆 if 里，集中放 computed 更好读。

### `onLoad`

页面进入时做两件事：

1. `restoreVehicleState()` 从本地缓存恢复车辆状态。
2. 如果恢复出来的状态是审批中，或者已执行但定位没开，就调用 `resumeVehicleApproval()` 继续流程。

一句话总结：

页面加载先恢复缓存，再补上没跑完的车辆审批/定位流程。

### `onUnload`

页面离开时做两件事：

1. `vehicleApprovalRunId += 1`，让正在跑的审批轮询失效。
2. `saveVehicleState()`，把当前车辆状态写入本地缓存。

`vehicleApprovalRunId` 可以理解成“这一轮任务编号”。页面离开后编号变了，旧循环发现编号不对就退出。

### watch：监听 `accountStore.isTempWorker`

当账号切成临时工：

1. 清空当前车辆。
2. 关闭车辆 active。
3. 清空审批状态。
4. 停止定位上报。
5. 保存缓存。

为什么这样：

临时工没有车辆使用场景，不能继续保留正式员工的车辆定位。

### `saveVehicleState()`

这个 function 是干啥的：

把页面当前车辆状态写入 `attendanceVehicleState`。

写入内容：

```js
uni.setStorageSync(VEHICLE_STATE_KEY, {
  selectedVehicle: currentVehicle,
  vehicleActive: vehicleActive.value,
  vehicleApprovalStatus: vehicleApprovalStatus.value,
})
```

重点：

它没有删缓存，而是写当前状态。结束车辆后会写入：

```js
{
  selectedVehicle: null,
  vehicleActive: false,
  vehicleApprovalStatus: ''
}
```

所以 key 可能还在，但内容表示“没有正在使用车辆”。

### `restoreVehicleState()`

这个 function 是干啥的：

页面重新进入时，从 `attendanceVehicleState` 恢复车辆状态。

它中间做了几步：

1. 如果是临时工，直接清空车辆状态并 return。
2. 读取缓存。
3. 没缓存就 return。
4. 回填 `selectedVehicle`。
5. 回填 `vehicleActive`。
6. 回填 `vehicleApprovalStatus`。

一句话总结：

本地缓存负责“跨页面/跨重启记住上一次车辆进度”。

### `handleScanCodeTap()`

这个 function 是干啥的：

点击扫码区域后调起设备扫码。

它中间做了几步：

1. 如果 `scanLoading` 已经是 true，直接 return，防止重复扫码。
2. 调 `uni.scanCode`。
3. 成功后取 `res.result`。
4. 有结果就调用 `handleScanTap(codeUrl)`。
5. 没结果就提示扫码内容为空。
6. 失败时，如果是用户取消，不提示；其他失败提示打卡失败。

### `showToast(title)`

页面统一 toast 出口。

它先 `uni.hideLoading()`，再 showToast。

这样可以避免 loading 和 toast 同时叠在一起。

### `formatClockTime(date = new Date())`

这个 function 是干啥的：

生成 `HH:mm:ss` 格式的打卡时间。

它用 `padStart(2, '0')` 保证 9 点显示成 `09`。

### `getClockCoordinates()`

这个 function 是干啥的：

扫码打卡前获取一次定位，并把坐标转成后端需要的坐标系。

它中间做了几步：

1. 调 `getCurrentLocationWithPermission()`。
2. 如果失败，抛出“定位失败，请开启定位权限”。
3. 把微信小程序拿到的 `gcj02` 坐标转成 `wgs84`。
4. 如果转换结果为空，继续抛定位失败。
5. 返回 `{ lng, lat }`。

注意：

这里是扫码打卡的一次性定位，不会启动持续定位。

### `stopAttendanceLocation()`

这个 function 是干啥的：

停止当前考勤车辆定位。

它中间做了两步：

1. `stopLocationReporter({ silent: true })`
2. `setLocationReporterEntityId('')`

第一步是停底层定位上报，第二步是清空 runtime 里的追踪对象。

一句话总结：

结束用车或启动失败，都应该统一走这里收尾。

### `handleScanTap(codeUrl)`

这个 function 是干啥的：

扫码打卡主流程。

它中间做了几步：

1. 打开 `scanLoading`。
2. 生成打卡时间。
3. 获取一次性定位坐标。
4. 根据账号类型选择接口：
   - 临时工：`attendanceTempterm`
   - 正式员工：`attendanceLongterm`
5. 提交 `clockTime / codeUrl / lng / lat`。
6. 成功提示打卡成功。
7. 失败提示接口错误或打卡失败。
8. finally 关闭 `scanLoading`。

固定套路：

loading 开启 -> 准备参数 -> 调接口 -> 成功/失败提示 -> finally 关闭 loading。

### `delay(ms = 500)`

小延迟工具。

这里主要是让接口完成后 toast 不要太突兀。

### `normalizeValue(value)`

这个 function 是干啥的：

把接口参数统一整理成字符串或 null。

逻辑：

1. 如果是 `null`，返回 `null`。
2. 其他值转字符串并 trim。
3. 如果 trim 后是空字符串，返回 `null`。
4. 否则返回处理后的字符串。

用途：

避免把 `undefined`、空字符串、带空格字符串直接提交给后端。

### `applyLocationTarget(target, failureText)`

这个 function 是干啥的：

通用定位目标启动器。

它中间做了几步：

1. 从 `target.entityId` 取定位对象 id。
2. 没 id 就提示“未获取到定位对象”。
3. 调 `setLocationReporterEntityId(entityId, target.type)`。
4. 先确认定位权限。
5. 调 `startLocationReporter()`。
6. 如果启动失败，提示 `failureText`。
7. 返回启动是否成功。

对车辆定位来说：

- `entityId` 是车牌号。
- `type` 是 `VEHICLE_LOCATION_TYPE`，也就是 `1`。

### `waitVehicleApproved(vehicle, shouldWaitFirst = true)`

这个 function 是干啥的：

等车辆审批通过，通过后启动持续定位。

它中间做了几步：

1. 取审批单 id。
2. 创建新的 `runId`，用于取消旧轮询。
3. 如果没有审批单 id，抛错。
4. 默认先等 10 秒再查。
5. 循环最多 180 次：
   - 如果 runId 变了，说明旧任务过期，直接 return false。
   - 调 `apiCheckApproval`。
   - 更新 `vehicleApprovalStatus`。
   - 更新 `selectedVehicle.approvalStatus`。
   - 调 `saveVehicleState()` 写缓存。
   - 如果状态是 `已执行`，跳出循环。
   - 如果状态不是 `审批中`，抛业务错误。
   - 否则继续等 10 秒。
6. 如果最终不是 `已执行`，抛超时。
7. 审批通过后调 `applyLocationTarget()` 启动车辆定位。
8. 启动失败：缓存 `已执行但未 active`。
9. 启动成功：缓存 `vehicleActive = true`。

这是车辆定位最核心的函数。

它把三件事串起来：

审批状态 -> localStorage 缓存 -> 持续定位启动。

### `resumeVehicleApproval()`

这个 function 是干啥的：

页面重新进入时，继续没完成的审批/定位流程。

它中间做了几步：

1. 如果正在提交，直接 return。
2. 开启 `vehicleSubmitting`。
3. 调 `waitVehicleApproved(selectedVehicle.value, false)`。
4. 如果启动成功，提示已开始使用车辆。
5. 如果失败，停止定位、标记 inactive、提示失败。
6. finally 关闭 submitting。

和 `waitVehicleApproved` 的区别：

`resumeVehicleApproval` 是恢复入口，`waitVehicleApproved` 是真正轮询和启动定位。

### `handleSubmitVehicle(vehicle)`

这个 function 是干啥的：

开始使用车辆的主流程。

它中间做了几步：

1. 如果已有审批单，状态已执行但定位未开，直接走 `resumeVehicleApproval()`。
2. 整理子组件传来的车辆字段。
3. 组装 `vehiclePayload`。
4. 校验必填字段。
5. 防重复提交。
6. 调 `apiModifyCarStatus(vehiclePayload, true)` 创建审批单。
7. 拿到审批单 id。
8. 写入 `selectedVehicle`，状态为 `审批中`。
9. 写入 `attendanceVehicleState` 缓存。
10. 调 `waitVehicleApproved()` 等审批通过并启动车辆定位。
11. 成功后提示已开始使用车辆。
12. 失败时停止定位，标记 inactive，提示失败。

一句话总结：

开始用车 = 提交审批单 + 缓存审批中 + 等审批通过 + 启动车辆定位。

### `handleCloseVehicle()`

这个 function 是干啥的：

结束使用车辆。

它中间做了几步：

1. 从 `selectedVehicle` 取审批单 id。
2. 没 id 就提示。
3. 防重复提交。
4. 调 `apiStopCar({ id })`。
5. 停止定位上报。
6. 清空页面车辆状态。
7. 调 `saveVehicleState()` 写入空状态。
8. 提示已结束使用车辆。

重点：

结束车辆时一定要同时处理两件事：

- 通知后端结束。
- 停止前端持续定位上报。

### `handleActionTap(title)`

根据卡片标题跳转到考勤记录或请假申请。

这和定位关系不大。

## `account.js` 里和定位有关的段落

虽然它不在 attendance 目录下，但它是 store 恢复定位的核心。

### store 状态

`useAccountStore` 是 Pinia store，保存登录信息、账号信息、是否临时工、角色部门等。

文件底部有：

```js
persist: true
```

说明这个 store 状态会被持久化插件保存。除此之外，文件里还手动用了 `uni.setStorageSync` 保存 token 和车辆状态。

### `applyToken(token, accountSource)`

这个 function 把登录 token 写入本地缓存：

- `AUTHORIZATIONID`
- `AUTHORIZATION`
- `ACCOUNT_SOURCE`

这些是登录态缓存，和车辆定位缓存不是一个东西。

### `logout()`

退出登录时：

1. 让车辆审批轮询失效。
2. 停止定位上报。
3. 清空 runtime 的定位对象。
4. 删除 token。
5. 清空权限。
6. 重置账号 store。

注意：

它没有删 `attendanceVehicleState`。这就是为什么重新登录后还有可能恢复车辆审批/定位。

### `login(form)`

正式员工登录后：

1. 登录拿 token。
2. 写 token。
3. 拉账号信息。
4. 调 `resumeVehicleLocation()`。

所以正式员工登录完成后，会尝试恢复车辆定位。

### `loginTempWorker(form)`

临时工登录后不会调用 `resumeVehicleLocation()`。

原因：

临时工没有车辆使用场景。

### `getSystemInfo(reload = false)`

这个 function 根据 token 判断是不是临时工。

正式员工：

- 调 `getLoginInfoUniapp`
- 拉权限

临时工：

- 调 `loginTempInfo`
- 设置临时工默认菜单

它最后把账号信息写进 Pinia store。

### `resumeVehicleLocation()`

这个 function 是 store 层恢复车辆定位的入口。

它中间做了几步：

1. 如果是临时工，return false。
2. 读取 `attendanceVehicleState`。
3. 取出 `selectedVehicle` 和审批状态。
4. 如果没有车牌号，return false。
5. 如果缓存里 `vehicleActive = true`：
   - 设置 runtime entityId 为车牌号。
   - 调 `startLocationReporter()`。
6. 如果有审批单，且状态是 `审批中` 或 `已执行`：
   - 异步调用 `resumeVehicleApproval(vehicle)`。
   - 返回 true。
7. 其他情况 return false。

一句话总结：

store 不负责显示页面，它负责 App 级别恢复“车辆定位还要不要继续”。

### `resumeVehicleApproval(vehicle)`

这个 function 和页面里的 `waitVehicleApproved` 很像。

它中间做了几步：

1. 创建 runId，避免旧轮询继续跑。
2. 最多查 180 次审批。
3. 每次把审批状态写入 `attendanceVehicleState`。
4. 审批通过后设置 runtime entityId。
5. 调 `startLocationReporter()`。
6. 启动成功后，把 `vehicleActive = true` 写入 `attendanceVehicleState`。

为什么 store 里也要写一份：

因为 App 回前台、重新登录时，attendance 页面可能还没打开，但车辆定位仍然要恢复。

## `locationReporterRuntime.js` 逐段分析

这个文件是“业务页面”和“底层定位上报器”之间的桥。

页面不直接碰 `locationReporter.js`，而是通过 runtime 设置：

- 要追踪谁：`entityId`
- 业务类型：`type`
- 要不要继续跑：`active`

### runtime storage key

`LOCATION_REPORTER_RUNTIME_STORAGE_KEY = 'LOCATION_REPORTER_RUNTIME_STATE'`

这个缓存只记录定位上报器运行状态。

### `normalizeLocationReporterRuntimeState(rawState)`

这个 function 是干啥的：

把缓存读出来的乱数据整理成标准结构。

返回：

```js
{
  entityId,
  type,
  active,
}
```

它会保证：

- `entityId` 是去空格字符串。
- `type` 没有就默认 2。
- `active` 必须同时满足 raw active 为 true 且 entityId 存在。

### `writeLocationReporterRuntimeState(storageApi, partialState)`

这个 function 是干啥的：

把 runtime 状态写入本地缓存。

它会：

1. 先读旧状态。
2. 合并新字段。
3. normalize。
4. JSON.stringify 后写入 `LOCATION_REPORTER_RUNTIME_STATE`。

### `readLocationReporterRuntimeState(storageApi)`

这个 function 是干啥的：

读取 runtime 缓存。

它兼容两种情况：

- 读出来已经是 object。
- 读出来是 JSON 字符串。

如果解析失败，就返回空标准状态。

### 模块初始化

文件加载时执行：

```js
const persistedRuntimeState = readLocationReporterRuntimeState(uni);
let locationReporterEntityId = persistedRuntimeState.entityId;
let locationReporterType = persistedRuntimeState.type;
```

意思是：

App 重启后，runtime 先从缓存里恢复上一次追踪对象。

### `createLocationReporter(...)`

runtime 创建了一个全局唯一的 `locationReporter`。

它传进去 3 个关键函数：

- `getEntityId()`：每次上报前取当前 entityId。
- `getType()`：每次上报前取当前 type。
- `submitLocationReport(point)`：真正调 `reportTrack([point], false)`。

这就是为什么页面只要调用 `setLocationReporterEntityId`，底层上报时就能拿到最新车牌号。

### `setLocationReporterEntityId(entityId, type = 2)`

这个 function 是干啥的：

设置当前定位上报对象。

它中间做了几步：

1. entityId 转字符串并 trim。
2. type 没传就默认 2。
3. 写入内存变量。
4. 写入 `LOCATION_REPORTER_RUNTIME_STATE`。

如果 entityId 为空，active 会写成 false。

### `startLocationReporter()`

这个 function 是干啥的：

启动底层定位上报器。

它中间做了几步：

1. 先读 runtime 缓存。
2. 如果内存没有 entityId，但缓存有，就恢复到内存。
3. 调 `locationReporter.start()`。
4. 如果启动成功，写入 `active: true`。
5. 返回 started。

一句话总结：

启动成功后，runtime 才把 active 标记为 true。

### `stopLocationReporter(options)`

这个 function 是干啥的：

停止底层定位上报器。

它中间做了几步：

1. 调 `locationReporter.stop(options)`。
2. 写入 runtime 缓存 `active: false`。
3. 返回 stop 结果。

### `shouldResumeLocationReporter()`

这个 function 是干啥的：

App 回前台时判断是否应该直接恢复定位上报。

它只在这些条件都满足时返回 true：

- runtime 缓存 active 为 true。
- entityId 存在。
- type 是车辆定位 type，也就是 1。

为什么只恢复 type 1：

当前代码里 attendance 页面车辆定位统一用 type 1，避免误恢复其他业务类型。

## `locationReporter.js` 和 attendance 的关系

这个文件是底层持续定位上报层。

attendance 不应该直接改它，除非你要改所有持续定位业务。

### 顶部缓存 key

- `LOCATION_REPORT_LAST_SUCCESS_AT`
- `LOCATION_REPORT_PENDING_PAYLOAD`

第一个记录上次成功上报时间。

第二个记录失败后等待重试的 payload。

### `buildLocationReportPayload(location, options = {})`

这个 function 把 `uni` 定位结果整理成后端轨迹点。

字段包括：

- `entityId`
- `type`
- `lng`
- `lat`
- `trackTime`
- `speed`
- `direction`
- `accuracy`
- `altitude`
- `clientTime`

它也会把 gcj02 坐标转 wgs84。

### `createLocationReporter(options = {})`

这是底层上报器工厂。

它内部 state 里保存：

- 是否已启动。
- 启动中的 Promise。
- 上次成功上报时间。
- 待重试 payload。
- 定位变化监听器。
- 定位错误监听器。

这说明底层已经做了防重复启动、失败重试、监听解绑。

### `persistPendingPayload(payload)`

上报失败时，把 payload 存到本地缓存。

下次启动时，可以先补报失败的数据。

### `persistLastReportedAt(timestamp)`

上报成功后，把成功时间写到本地缓存。

这样 App 重启后也知道最近一次上报是什么时候。

### `start()`

持续定位启动流程：

1. 如果已经启动，直接返回 true。
2. 如果正在启动，复用同一个 Promise。
3. 检查环境是否支持后台定位。
4. 检查前台/后台定位权限。
5. 绑定定位监听。
6. 开启后台定位。
7. 标记已启动。
8. 开启静默补采定时器。
9. 先补报上次失败的 payload。
10. 主动采集一次当前位置。

### `stop()`

持续定位停止流程：

1. 清掉补采定时器。
2. 清掉阻断状态。
3. 调 `uni.stopLocationUpdate`。
4. 解绑定位监听。
5. 标记 `isStarted = false`。

## `App.vue` 里的恢复入口

`App.vue` 在 `onShow` 时做恢复。

顺序很关键：

1. 先检查页面权限和登录 token。
2. 先调用 `shouldResumeLocationReporter()`。
3. 如果 runtime 已经 active，直接 `startLocationReporter()`，然后 return。
4. 否则调用 `accountStore.resumeVehicleLocation()`。

为什么先 runtime 再 store：

runtime active 说明底层定位上报器上次已经启动过，只是 App 回前台需要继续跑。这个时候不用再从业务审批状态推一遍。

store 兜底说明 runtime 没有 active，但业务缓存里可能还有审批中/已执行未启动的车辆。

## 改代码时最容易乱的点

### 1. 同一个缓存 key 在两个地方使用

`attendanceVehicleState` 同时在：

- `attendance/index.vue`
- `store/modules/account.js`

如果你改缓存结构，两个文件都要同步改。

### 2. 车辆审批恢复逻辑有两份

页面里有：

- `waitVehicleApproved`
- `resumeVehicleApproval`

store 里也有：

- `resumeVehicleApproval`

原因是页面打开时需要恢复，App/登录时也需要恢复。

如果你要改审批状态判断、轮询次数、缓存字段，两边都要看。

### 3. 扫码定位和车辆定位不是同一个流程

扫码定位：

- 只取一次。
- 用 `getCurrentLocationWithPermission()`。
- 调打卡接口。

车辆定位：

- 审批通过后持续上报。
- 用 `startLocationReporter()`。
- 调 `reportTrack`。

### 4. localStorage 里有业务状态，也有 runtime 状态

不要把 `attendanceVehicleState` 和 `LOCATION_REPORTER_RUNTIME_STATE` 合并理解。

一个管业务，一个管上报器。

### 5. 结束车辆后缓存没有删除

`handleCloseVehicle` 结束后调用 `saveVehicleState()`，会写入空状态，而不是 remove key。

这不是一定错误，但读代码时容易误会“为什么缓存还在”。

### 6. `setLocationReporterEntityId` 会写 runtime 缓存

你可能以为它只改内存变量，其实它会同步写 `LOCATION_REPORTER_RUNTIME_STATE`。

所以它不只是 setter，也是缓存更新入口。

## 小白仿写固定套路

示例代码仅供参考，需要你手动复制到项目中。

```js
// 1. 页面状态：只放当前页面要展示的数据
const currentThing = ref(null)
const isActive = ref(false)
const status = ref('')
const submitting = ref(false)

// 2. 本地缓存：负责页面离开后还能恢复
const CACHE_KEY = 'xxxState'

function saveState() {
  // 保存业务进度，不保存无关 UI 细节
  uni.setStorageSync(CACHE_KEY, {
    currentThing: currentThing.value,
    isActive: isActive.value,
    status: status.value,
  })
}

function restoreState() {
  // 页面加载时先恢复，再决定要不要继续未完成流程
  const cache = uni.getStorageSync(CACHE_KEY)
  if (!cache) return

  currentThing.value = cache.currentThing || null
  isActive.value = Boolean(cache.isActive)
  status.value = cache.status || ''
}

// 3. 提交流程：校验 -> 调接口 -> 写缓存 -> 后续动作
async function handleSubmit(form) {
  if (submitting.value) return

  submitting.value = true
  try {
    // 先调接口创建业务单
    const res = await createSomething(form)

    // 接口成功后立刻写页面状态和缓存
    currentThing.value = {
      ...form,
      id: res.id,
      status: '处理中',
    }
    status.value = '处理中'
    isActive.value = false
    saveState()

    // 再继续后面的长流程，比如轮询、启动定位
    await waitUntilDone()
  } finally {
    submitting.value = false
  }
}

// 4. 恢复流程：如果缓存显示没完成，就接着做
async function resumeIfNeeded() {
  restoreState()

  if (status.value === '处理中' && currentThing.value?.id) {
    await waitUntilDone()
  }
}
```

## 一句话总结

这套代码的核心不是“定位函数很多”，而是“页面状态、业务缓存、定位 runtime 缓存、底层上报缓存”四层状态在配合：页面负责显示和发起业务，store 负责登录/回前台恢复，localStorage 负责跨页面和跨重启记住进度，runtime/reporter 负责真正持续定位。
