# attendance 车辆定位逻辑分析（含 services 与 Storage）

## 1. 分析范围

- 页面容器组件：[attendance/index.vue](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/packageAttendance/attendance/index.vue)
- 业务区块组件：[AttendanceLocationSelector.vue](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/packageAttendance/attendance/components/AttendanceLocationSelector.vue)
- App 级恢复入口：[App.vue](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/App.vue)
- 共享状态协调层：[account.js](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/store/modules/account.js)
- runtime 桥接层：[locationReporterRuntime.js](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/services/locationReporterRuntime.js)
- 底层定位上报器：[locationReporter.js](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/services/locationReporter.js)
- 页面定位权限工具：[locationPermission.js](/E:/Work1/hzlt/Private/614/travel-web/sites/uniapp/src/packageAttendance/attendance/locationPermission.js)

## 2. 这次只看什么

这份文档只看“车辆定位逻辑”，不展开普通扫码打卡。

重点只回答 4 个问题：

1. 车辆定位的真实状态分别被谁持有。
2. 页面、store、services、App 是怎么串起来的。
3. Storage 一共有哪些 key，它们分别由谁写、谁读、何时变化。
4. 用户开始用车、结束用车、离开页面、重进小程序后，定位是怎么恢复或停止的。

## 3. 一句话总览

这个模块的车辆定位不是单靠 `attendance/index.vue` 在管，而是 5 层接力：

1. `AttendanceLocationSelector.vue` 负责收集车辆表单并 `emit` 动作。
2. `attendance/index.vue` 负责审批、页面状态、页面内缓存恢复。
3. `accountStore` 负责登录后用后端 `loginInfo` 和本地缓存继续恢复车辆定位。
4. `locationReporterRuntime.js` 负责把“当前要追踪哪辆车”变成 `entityId + type + active`，并写入 runtime Storage。
5. `locationReporter.js` 负责真正的后台定位、上报、失败重试、待重试 payload 缓存和最后成功时间缓存。

所以这条链路不是单一 source of truth，而是“分层 source of truth”：

- 页面业务状态主源：`attendanceVehicleState`
- 定位运行时主源：`LOCATION_REPORTER_RUNTIME_STATE`
- 上报补偿主源：`LOCATION_REPORT_PENDING_PAYLOAD`
- 上报成功时间主源：`LOCATION_REPORT_LAST_SUCCESS_AT`

## 4. 分层角色判断

### 4.1 页面组件 / 容器组件

#### `attendance/index.vue`

- 类型：页面组件 / 容器组件
- 职责：
  - 开始用车审批
  - 审批轮询
  - 审批通过后启动车辆定位
  - 结束用车并停止定位
  - 保存和恢复页面级车辆状态
  - 把页面状态通过 `props` 回流给车辆表单子组件
- 持有的页面真实状态：
  - `selectedVehicle`
  - `vehicleActive`
  - `vehicleApprovalStatus`
  - `vehicleSubmitting`

### 4.2 业务区块组件

#### `AttendanceLocationSelector.vue`

- 类型：业务区块组件
- 职责：
  - 收集车辆表单
  - 回显页面传来的车辆状态
  - 做局部字段联动和局部校验
  - 通过 `emit('submitVehicle')`、`emit('closeVehicle')` 把动作交回父组件
- 它不直接碰：
  - Storage
  - 定位服务
  - 审批轮询
  - API

### 4.3 应用级容器

#### `App.vue`

- 类型：应用级容器
- 职责：
  - 小程序启动和回前台时恢复全局车辆定位
  - 先调用 `shouldResumeLocationReporter()`
  - 再调用 `startLocationReporter()`
  - 再调用 `accountStore.resumeVehicleLocation()`

这里很关键：车辆定位的恢复，不是只有 attendance 页面自己负责，`App.vue` 也在负责。

### 4.4 共享状态协调层

#### `accountStore`

- 类型：共享状态 / 业务协调层
- 职责：
  - 登录后拉取 `loginInfo`
  - 把后端返回的 `vehicleUsageForm` 同步到 `attendanceVehicleState`
  - 在登录后或回到前台时恢复车辆审批/定位
  - 退出登录时统一停止定位并清理页面车辆缓存

### 4.5 service 桥接层

#### `locationReporterRuntime.js`

- 类型：运行时桥接服务
- 职责：
  - 保存“当前应该给谁上报定位”
  - 保存 `entityId + type + active`
  - 对上提供：
    - `setLocationReporterEntityId`
    - `startLocationReporter`
    - `stopLocationReporter`
    - `shouldResumeLocationReporter`
  - 对下调用底层 `locationReporter`

它不是页面组件，但它承担了“运行时共享状态”的角色。

### 4.6 service 引擎层

#### `locationReporter.js`

- 类型：底层定位上报引擎
- 职责：
  - 权限检查
  - 启动后台定位
  - 监听定位变化
  - 静默补采定位
  - 构造上报 payload
  - 上报失败后缓存待重试 payload
  - 下次继续补报

## 5. 车辆定位通信方式判断

按照 `$vue-components-communication` 的规则，这里要先判断传递的到底是什么。

### 5.1 页面和子组件之间

- 传给子组件的是“值”
  - `personalName`
  - `isTempWorker`
  - `selectedVehicle`
  - `vehicleActive`
  - `approvalStatus`
  - `submitting`
- 所以通信方式是 `props`

- 子组件传回页面的是“动作”
  - `submitVehicle`
  - `closeVehicle`
- 所以通信方式是 `emit`

### 5.2 页面和 store / services 之间

- 页面传给 runtime 的是“控制目标”
  - 当前车辆车牌号 `licensePlate`
  - 当前业务类型 `VEHICLE_LOCATION_TYPE = 1`
- 通信方式不是 `props/emit`
- 本质是“方法调用 + 共享状态写入”

### 5.3 App、store、runtime 之间

- 它们传的是“共享状态”和“恢复控制权”
- 共享状态通过 Storage 落盘
- 恢复动作通过方法调用触发

结论：

- 页面内：`props + emit`
- 页面外：`store + service runtime + Storage`

## 6. Storage 总表

这部分是这次最重要的。

| Storage Key | 所在层 | 写入者 | 读取者 | 作用 |
| --- | --- | --- | --- | --- |
| `attendanceVehicleState` | 页面业务层 | `attendance/index.vue`、`accountStore` | `attendance/index.vue`、`accountStore` | 保存当前车辆审批/定位业务状态 |
| `LOCATION_REPORTER_RUNTIME_STATE` | runtime 层 | `locationReporterRuntime.js` | `locationReporterRuntime.js`、`App.vue`（间接） | 保存当前 runtime 的 `entityId/type/active` |
| `LOCATION_REPORT_LAST_SUCCESS_AT` | reporter 层 | `locationReporter.js` | `locationReporter.js` | 保存最后一次成功上报定位的时间 |
| `LOCATION_REPORT_PENDING_PAYLOAD` | reporter 层 | `locationReporter.js` | `locationReporter.js` | 保存上次上报失败、待下次补报的定位 payload |

## 7. 每个 Storage key 的具体语义

### 7.1 `attendanceVehicleState`

#### 持有者

- 页面 `index.vue`
- `accountStore`

#### 数据结构

```js
{
  selectedVehicle,
  vehicleActive,
  vehicleApprovalStatus,
}
```

#### 它代表什么

它代表的是“attendance 业务视角下，这辆车现在处于什么状态”。

这个状态是页面业务源，不是底层定位引擎源。

#### 什么时候写入

##### 页面写入

- `handleSubmitVehicle()` 创建审批单后
- `waitVehicleApproved()` 审批状态变化后
- `waitVehicleApproved()` 定位真正启动成功后
- `handleCloseVehicle()` 结束用车后
- `saveVehicleState()` 页面卸载或状态变化时
- `watch(accountStore.isTempWorker)` 切为临时工后

##### store 写入

- `getSystemInfo()` 内部的 `syncVehicleUsageFormFromLoginInfo()`
- `resumeVehicleApproval()` 轮询审批状态时
- `resumeVehicleApproval()` 启动定位成功后

#### 什么时候删除

- 页面 `saveVehicleState()` 判断当前没车、没激活、没审批状态时会删
- `accountStore.clearVehicleStateCache()` 会删
- `logout()` 最终也会清掉

#### 核心意义

这个 key 决定：

- 页面回到 attendance 时显示什么
- 登录后能不能继续审批轮询
- 登录后能不能继续恢复车辆定位

### 7.2 `LOCATION_REPORTER_RUNTIME_STATE`

#### 持有者

- `locationReporterRuntime.js`

#### 数据结构

```js
{
  entityId,
  type,
  active
}
```

#### 它代表什么

它代表的是“底层定位 runtime 现在应该给谁上报、按什么业务类型上报、是否处于 active 恢复态”。

它不是页面业务状态，而是定位运行时状态。

#### 什么时候写入

- `setLocationReporterEntityId(entityId, type)`
- `startLocationReporter()` 成功后把 `active` 写成 `true`
- `stopLocationReporter()` 后把 `active` 写成 `false`

#### 非常关键的细节

`setLocationReporterEntityId()` 并不会直接把 `active` 设成 `true`。

它的逻辑是：

- 如果只是在设置 `entityId/type`
- 那么 `active` 继续沿用之前的值
- 只有真正 `startLocationReporter()` 成功了，`active` 才会被写成 `true`

这意味着：

- “知道应该追踪哪辆车”
- 和“已经正式处于定位恢复态”

是两个不同阶段。

#### 什么时候清空

严格说它不会完全 remove，而是被写成：

```js
{
  entityId: '',
  type: 2,
  active: false
}
```

这发生在：

- `stopAttendanceLocation()` 里先 `stopLocationReporter({ silent: true })`
- 然后 `setLocationReporterEntityId('')`

#### 核心意义

这个 key 决定：

- App 启动时 `shouldResumeLocationReporter()` 会不会返回 true
- 小程序回前台时会不会直接恢复后台定位能力

### 7.3 `LOCATION_REPORT_LAST_SUCCESS_AT`

#### 持有者

- `locationReporter.js`

#### 它代表什么

最近一次定位上报成功的时间戳。

#### 什么时候写入

- `submitPayload()` 上报成功后

#### 谁会读

- `createLocationReporter()` 初始化时读进 `state.lastReportedAt`

#### 注意点

它是 reporter 层自己的运行记录，不参与页面 UI 回显。

### 7.4 `LOCATION_REPORT_PENDING_PAYLOAD`

#### 持有者

- `locationReporter.js`

#### 它代表什么

上一次定位上报失败后，缓存起来准备下一次重试的完整定位 payload。

#### 什么时候写入

- `submitPayload()` 上报失败时写入当前 payload

#### 什么时候清空

- `submitPayload()` 下次补报成功后清空

#### 谁会读

- reporter 初始化时读进 `state.pendingPayload`
- 每次 `flushPendingPayload()` 都会先尝试补报

#### 特别要注意

这个 key 不会因为 `attendance` 页面结束用车而被显式清理。

也就是说：

- 页面结束用车会停 runtime
- 但 reporter 层缓存的“失败待补报 payload”不一定立刻被删除
- 只有之后真正补报成功，它才会清掉

这就是车辆定位逻辑里一个非常容易忽略的 Storage 动向。

## 8. 从页面到 service 的完整链路

## 8.1 开始用车链路

### 状态被谁持有

- 子组件持有：`formData`
- 页面持有：`selectedVehicle`、`vehicleApprovalStatus`、`vehicleActive`
- runtime 持有：`entityId/type/active`
- reporter 持有：`pendingPayload`、`lastReportedAt`

### 方法被谁触发

1. 用户在 `AttendanceLocationSelector.vue` 填表
2. 点击提交按钮
3. 子组件 `emit('submitVehicle', payload)`
4. 页面 `handleSubmitVehicle(vehicle)`

### 数据传给谁

1. 子组件把车辆表单值交给页面
2. 页面组装 `vehiclePayload`
3. 页面调用 `apiModifyCarStatus`
4. 审批单创建成功后，页面先把 `attendanceVehicleState` 写成：
   - `selectedVehicle = 审批单`
   - `vehicleApprovalStatus = 审批中`
   - `vehicleActive = false`
5. 页面进入 `waitVehicleApproved()`
6. 审批通过后，页面调用：
   - `setLocationReporterEntityId(vehicle.licensePlate, 1)`
   - `startLocationReporter()`
7. runtime 把当前车辆写入 `LOCATION_REPORTER_RUNTIME_STATE`
8. reporter 启动后：
   - 先尝试补报 `pendingPayload`
   - 再主动采集一次定位
   - 再监听后台定位变化

### 改完怎么回流

1. `startLocationReporter()` 成功后
2. 页面把 `attendanceVehicleState` 改成：
   - `vehicleApprovalStatus = 已执行`
   - `vehicleActive = true`
3. 页面状态通过 `props` 回流给子组件
4. 子组件根据新 props 切换状态文案和按钮

### 这一条链路里的 Storage 变化顺序

1. `attendanceVehicleState`：先写“审批中”
2. `LOCATION_REPORTER_RUNTIME_STATE`：写 `entityId/type`
3. `LOCATION_REPORTER_RUNTIME_STATE`：`start` 成功后改 `active = true`
4. `LOCATION_REPORT_PENDING_PAYLOAD`：如果上报失败则写入
5. `LOCATION_REPORT_LAST_SUCCESS_AT`：如果上报成功则刷新
6. `attendanceVehicleState`：最后写“已执行 + vehicleActive = true”

## 8.2 结束用车链路

### 状态被谁持有

- 页面持有当前车辆状态
- runtime 持有当前定位对象状态
- reporter 仍可能持有待补报 payload

### 方法被谁触发

1. 子组件点击“结束使用车辆”
2. `emit('closeVehicle')`
3. 页面 `handleCloseVehicle()`

### 数据传给谁

1. 页面调用 `apiStopCar`
2. 页面调用 `stopAttendanceLocation()`
3. `stopAttendanceLocation()` 内部做两步：
   - `stopLocationReporter({ silent: true })`
   - `setLocationReporterEntityId('')`

### 改完怎么回流

1. 页面清空：
   - `selectedVehicle = null`
   - `vehicleActive = false`
   - `vehicleApprovalStatus = ''`
2. 页面重新保存 `attendanceVehicleState`
3. 子组件收到空 props 后 reset 表单

### 这一条链路里的 Storage 变化顺序

1. `LOCATION_REPORTER_RUNTIME_STATE`：先被写成 `active = false`
2. `LOCATION_REPORTER_RUNTIME_STATE`：再被写成 `entityId = ''`
3. `attendanceVehicleState`：被清空或删除
4. `LOCATION_REPORT_PENDING_PAYLOAD`：不保证此时一定清空
5. `LOCATION_REPORT_LAST_SUCCESS_AT`：不会因为结束用车被清空

### 这里最值得注意的点

结束用车清掉的是：

- 页面业务状态
- runtime 恢复状态

不一定立即清掉的是：

- reporter 层的历史成功时间
- reporter 层的失败待补报 payload

## 8.3 页面离开再回来链路

### 页面自己负责的恢复

`attendance/index.vue` 在：

- `onLoad`
- `onShow`

里都会执行 `restoreAndResumeVehicleState()`

它读的是：

- `attendanceVehicleState`

如果发现：

- 有 `selectedVehicle.id`
- 且状态是“审批中”或“已执行但还没 active”

就继续 `resumeVehicleApproval()`

### App 全局负责的恢复

`App.vue` 在：

- `onLaunch`
- `onShow`

里会执行 `resumeVehicleState()`

它先：

1. 调 `shouldResumeLocationReporter()`
2. 如果 runtime state 说自己还是 active，就直接 `startLocationReporter()`
3. 再调 `accountStore.resumeVehicleLocation()`

### 这说明什么

恢复路径有两条：

1. attendance 页面自己的恢复路径
2. App + accountStore 的全局恢复路径

## 8.4 登录后恢复链路

### store 负责的同步

`accountStore.getSystemInfo()` 会调用 `syncVehicleUsageFormFromLoginInfo()`

它会读取后端的 `vehicleUsageForm`，并把结果同步到：

- `attendanceVehicleState`

### 同步时的关键判断

#### 如果后端返回 `endTime`

- 说明这次用车已经结束
- store 会直接：
  - `stopLocationReporter({ silent: true })`
  - `setLocationReporterEntityId('')`
  - `removeStorageSync('attendanceVehicleState')`

#### 如果后端返回审批中或已执行的车辆表单

- store 会把它落回 `attendanceVehicleState`
- 然后 `resumeVehicleLocation()` 决定：
  - 如果 `vehicleActive = true`，直接恢复 runtime 定位
  - 如果还在审批中或已执行未激活，继续审批恢复流程

### 这里的意义

`attendanceVehicleState` 不只是页面自己写的缓存。

它还会被 store 用后端登录态反向纠正。

所以这个 key 的真实来源其实有两个：

1. 页面本地业务写入
2. 登录后端状态同步写入

## 9. Storage 动向重点结论

这是最值得画进 canvas 的部分。

### 9.1 `attendanceVehicleState` 是业务状态源

它决定：

- 页面表单回显
- 当前是否显示“审批中/已执行/用车中”
- 登录后还能不能继续恢复车辆流程

### 9.2 `LOCATION_REPORTER_RUNTIME_STATE` 是运行时恢复源

它决定：

- App 重启后是否直接恢复后台定位能力

也就是说：

- `attendanceVehicleState` 偏业务语义
- `LOCATION_REPORTER_RUNTIME_STATE` 偏运行时语义

这两个 key 不能混着理解。

### 9.3 `PENDING_PAYLOAD` 是补偿源

它代表的不是“当前车还在不在用”，而是：

- 上一次上报有没有失败
- 失败的数据有没有等着下次补发

所以它和页面结束用车不是一一对应关系。

### 9.4 存在三层恢复机制

#### 第一层：页面恢复

- `attendance/index.vue`
- 看 `attendanceVehicleState`

#### 第二层：应用恢复

- `App.vue`
- 看 `LOCATION_REPORTER_RUNTIME_STATE`

#### 第三层：底层补偿恢复

- `locationReporter.js`
- 看 `LOCATION_REPORT_PENDING_PAYLOAD`

## 10. 关键链路表

| 链路 | 状态被谁持有 | 方法被谁触发 | 数据传给谁 | 改完怎么回流 |
| --- | --- | --- | --- | --- |
| 提交用车审批 | 子组件 `formData` + 页面车辆状态 | 子组件按钮点击 | `emit -> index.vue -> apiModifyCarStatus` | 页面更新 `attendanceVehicleState`，再 `props` 回流 |
| 审批通过后启动车辆定位 | 页面车辆状态 + runtime 状态 | `waitVehicleApproved()` | `index.vue -> locationReporterRuntime -> locationReporter` | runtime/storage 更新后，页面把 `vehicleActive` 回流给子组件 |
| 结束用车 | 页面车辆状态 + runtime 状态 | 子组件结束按钮 | `emit -> index.vue -> apiStopCar -> stopAttendanceLocation` | 页面清空业务状态，runtime 写 inactive，子组件 reset |
| 页面重进恢复 | `attendanceVehicleState` | `onLoad/onShow` | `index.vue -> restoreAndResumeVehicleState` | 页面状态恢复后回流子组件 |
| App 重启恢复 | `LOCATION_REPORTER_RUNTIME_STATE` | `App.vue onLaunch/onShow` | `App.vue -> shouldResumeLocationReporter -> startLocationReporter` | runtime 自恢复，不依赖当前是否在 attendance 页面 |
| 上报失败补偿 | `LOCATION_REPORT_PENDING_PAYLOAD` | reporter 新位置到来或重启 | `locationReporter -> flushPendingPayload -> submitPayload` | 成功后清掉 pending payload |

## 11. 适合画 Canvas 的节点

建议只围绕车辆定位画下面这些节点：

- `AttendanceLocationSelector.vue`
- `attendance/index.vue`
- `accountStore.resumeVehicleLocation`
- `accountStore.syncVehicleUsageFormFromLoginInfo`
- `App.vue.resumeVehicleState`
- `locationReporterRuntime.setLocationReporterEntityId`
- `locationReporterRuntime.startLocationReporter`
- `locationReporterRuntime.stopLocationReporter`
- `locationReporter.shouldResumeLocationReporter`
- `locationReporter.flushPendingPayload`
- `locationReporter.submitPayload`
- `Storage: attendanceVehicleState`
- `Storage: LOCATION_REPORTER_RUNTIME_STATE`
- `Storage: LOCATION_REPORT_LAST_SUCCESS_AT`
- `Storage: LOCATION_REPORT_PENDING_PAYLOAD`
- `API: apiModifyCarStatus`
- `API: apiCheckApproval`
- `API: apiStopCar`
- `API: reportTrack`

## 12. 适合画 Canvas 的边

- `AttendanceLocationSelector.vue --emit submitVehicle--> attendance/index.vue`
- `AttendanceLocationSelector.vue --emit closeVehicle--> attendance/index.vue`
- `attendance/index.vue --write--> attendanceVehicleState`
- `attendance/index.vue --call--> apiModifyCarStatus`
- `attendance/index.vue --call--> apiCheckApproval`
- `attendance/index.vue --call--> locationReporterRuntime.setLocationReporterEntityId`
- `attendance/index.vue --call--> locationReporterRuntime.startLocationReporter`
- `attendance/index.vue --call--> locationReporterRuntime.stopLocationReporter`
- `locationReporterRuntime --write--> LOCATION_REPORTER_RUNTIME_STATE`
- `App.vue --read via shouldResume--> LOCATION_REPORTER_RUNTIME_STATE`
- `App.vue --call--> startLocationReporter`
- `accountStore --read/write--> attendanceVehicleState`
- `accountStore --call--> startLocationReporter`
- `locationReporter --read/write--> LOCATION_REPORT_PENDING_PAYLOAD`
- `locationReporter --write--> LOCATION_REPORT_LAST_SUCCESS_AT`
- `locationReporter --call--> reportTrack`

## 13. 最终结论

如果只看“车辆定位逻辑”，这个模块最核心的认知有 5 句：

1. `attendance/index.vue` 只是车辆定位业务入口，不是唯一恢复入口。
2. 真正的恢复逻辑是“页面恢复 + App 恢复 + reporter 补偿恢复”三层叠加。
3. `attendanceVehicleState` 管业务状态，`LOCATION_REPORTER_RUNTIME_STATE` 管 runtime 状态，`LOCATION_REPORT_PENDING_PAYLOAD` 管补偿状态，它们不是一个东西。
4. 结束用车会清掉页面和 runtime 的状态，但不保证立即清掉 reporter 的历史成功时间和待补报 payload。
5. 如果后续要画 canvas，最值得重点连线的不是单个组件，而是 `attendance/index.vue -> accountStore -> locationReporterRuntime -> locationReporter -> Storage` 这条纵向链。

## 14. 后续如果继续生成 Canvas，可直接用这句

```text
请基于这份 Markdown，只绘制 attendance 模块中的车辆定位逻辑。
把图分成“页面组件、业务区块、App/Store 协调层、runtime 层、reporter 层、Storage 层”六组，
重点画清楚 attendanceVehicleState、LOCATION_REPORTER_RUNTIME_STATE、LOCATION_REPORT_PENDING_PAYLOAD、LOCATION_REPORT_LAST_SUCCESS_AT 这四个 Storage 的读写方向和恢复关系。
```
