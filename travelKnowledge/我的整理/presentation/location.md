# UniApp 考勤定位逻辑项目解析

## 1. 功能概述

这个功能主要解决考勤场景里的两个定位问题。

第一，用户扫码打卡前，要获取一次当前位置。

第二，长期工开始使用车辆后，要持续上报车辆轨迹。

这两个定位逻辑不是混在一起写的。

扫码打卡是“一次性定位”。

车辆使用是“持续定位上报”。

入口页面是 `travel-web/sites/uniapp/src/packageAttendance/attendance/index.vue`。

定位权限封装在 `travel-web/sites/uniapp/src/packageAttendance/attendance/locationPermission.js`。

车辆表单组件是 `travel-web/sites/uniapp/src/packageAttendance/attendance/components/AttendanceLocationSelector.vue`。

持续定位运行时在 `travel-web/sites/uniapp/src/services/locationReporterRuntime.js`。

底层定位上报器在 `travel-web/sites/uniapp/src/services/locationReporter.js`。

坐标转换在 `travel-web/sites/uniapp/src/utils/coordinate.js`。

## 2. 核心业务流程

### 2.1 扫码打卡定位流程

1. 用户点击“扫码打卡”区域。
2. 页面先判断 `scanLoading`，防止重复点击。
3. 调用 `uni.scanCode()` 打开扫码。
4. 扫码成功后拿到 `codeUrl`。
5. 进入 `handleScanTap(codeUrl)`。
6. 设置 `scanLoading = true`。
7. 调用 `formatClockTime()` 生成当前打卡时间。
8. 调用 `getClockCoordinates()` 获取当前位置。
9. `getClockCoordinates()` 内部先校验定位权限。
10. 权限通过后调用 `uni.getLocation()`。
11. 小程序返回 GCJ-02 坐标。
12. 前端用 `convertGcj02ToWgs84()` 转成 WGS84。
13. 根据账号类型调用不同打卡接口。
14. 正式员工调用 `attendanceLongterm()`。
15. 临时工调用 `attendanceTempterm()`。
16. 成功后提示“打卡成功”。
17. 失败后提示接口错误或“打卡失败”。
18. 最后关闭 `scanLoading`。

面试表达：

扫码打卡这块我做的是一次性定位。用户扫码后，不是直接提交二维码，而是先拿当前定位，把小程序的 GCJ-02 坐标转换成后端需要的 WGS84，再和打卡时间、扫码内容一起提交。

### 2.2 车辆持续定位流程

1. 长期工填写车辆使用表单。
2. 子组件校验车牌、车辆类型、车辆金额等字段。
3. 子组件只通过 `emit('submitVehicle')` 把数据交给父组件。
4. 父组件 `handleSubmitVehicle()` 组装车辆申请参数。
5. 调用 `apiModifyCarStatus()` 创建车辆使用审批单。
6. 创建成功后，把车辆信息保存到本地缓存。
7. 状态设置为“审批中”。
8. 调用 `waitVehicleApproved()` 轮询审批状态。
9. 审批状态变成“已执行”后，才启动定位。
10. 调用 `applyLocationTarget()` 设置定位对象。
11. 定位对象是车辆车牌号。
12. 定位类型是 `VEHICLE_LOCATION_TYPE = 1`。
13. 先校验定位权限。
14. 再调用 `startLocationReporter()`。
15. 底层启动后台定位。
16. 监听位置变化。
17. 把定位点转换成后端轨迹数据。
18. 调用 `/web/track/upload` 上报。
19. 用户结束用车时，调用 `apiStopCar()`。
20. 停止定位上报，清空车辆状态。

面试表达：

车辆定位不是点击开始就马上上报。它先创建车辆使用审批单，等审批状态变成“已执行”后，才真正启动后台定位。这样定位上报和业务审批状态是一致的。

## 3. 核心代码模块

### 3.1 考勤首页模块

文件：`travel-web/sites/uniapp/src/packageAttendance/attendance/index.vue`

作用：

负责串联扫码打卡、车辆使用、审批轮询和定位启动。

关键逻辑：

页面统一管理定位相关业务状态。

`selectedVehicle` 保存当前车辆对象。

`vehicleActive` 表示车辆定位是否已经启动。

`vehicleApprovalStatus` 保存车辆审批状态。

`vehicleSubmitting` 防止车辆开始和结束重复提交。

`scanLoading` 防止扫码打卡重复点击。

页面还抽出了几个配置常量。

`VEHICLE_LOCATION_TYPE` 表示车辆定位上报类型。

`VEHICLE_STATE_KEY` 表示车辆状态缓存 key。

`VEHICLE_APPROVING_STATUS` 和 `VEHICLE_APPROVED_STATUS` 表示审批状态。

`VEHICLE_APPROVAL_CHECK_INTERVAL` 控制轮询间隔。

`VEHICLE_APPROVAL_MAX_CHECK_COUNT` 控制最大轮询次数。

面试表达：

考勤首页是定位业务的编排层。它不直接写底层定位细节，而是负责什么时候扫码、什么时候获取一次定位、什么时候创建车辆审批、什么时候启动持续定位、什么时候停止定位。

### 3.2 定位权限模块

文件：`travel-web/sites/uniapp/src/packageAttendance/attendance/locationPermission.js`

作用：

封装一次性定位前的权限判断。

关键逻辑：

`callUniApi()` 把 uni 的 callback API 包成 Promise。

`ensureUserLocationPermission()` 先读取 `scope.userLocation`。

如果用户已经授权，直接返回。

如果用户拒绝过授权，就引导用户打开设置页。

如果用户还没选择过，就调用 `uni.authorize()`。

`getCurrentLocationWithPermission()` 先确保权限，再调用 `uni.getLocation()`。

定位类型使用 `gcj02`。

开启 `isHighAccuracy`。

定位失败时不会一直弹提示。

`showLocationToast()` 做了 30 秒冷却。

面试表达：

我把定位权限和获取当前位置封装成单独模块。页面只调用 `getCurrentLocationWithPermission()`，不用关心用户是第一次授权、拒绝过授权，还是需要打开设置页。

### 3.3 车辆定位表单组件

文件：`travel-web/sites/uniapp/src/packageAttendance/attendance/components/AttendanceLocationSelector.vue`

作用：

负责车辆使用表单、字段联动、状态文案和提交事件。

关键逻辑：

表单数据集中放在 `formData`。

`VEHICLE_TYPE_OPTIONS` 管车辆类型。

`VEHICLE_CATEGORY_OPTIONS` 管运营车辆的大车和小车。

`FORM_RULES` 集中管理表单校验提示。

`submitErrorText` 是一个 `computed`。

它根据当前表单值派生出第一个错误提示。

`formDisabled` 根据审批中、待开启定位、车辆使用中这几个状态派生。

`statusText` 根据审批和定位状态显示当前文案。

子组件不直接调接口。

它只在校验通过后 `emit('submitVehicle')`。

面试表达：

车辆表单组件只负责收集和校验用户输入，不负责接口和定位。真正的审批、轮询、定位启动都交给父组件处理。这样组件职责更清楚。

### 3.4 定位运行时模块

文件：`travel-web/sites/uniapp/src/services/locationReporterRuntime.js`

作用：

把业务对象转换成底层定位上报器需要的参数。

关键逻辑：

页面只关心“我要跟踪哪辆车”。

运行时模块把它转成 `entityId` 和 `type`。

`setLocationReporterEntityId()` 设置上报对象。

`startLocationReporter()` 启动底层上报器。

`stopLocationReporter()` 停止上报器。

`shouldResumeLocationReporter()` 判断应用回到前台时是否需要恢复定位。

运行时状态会写入本地缓存。

缓存 key 是 `LOCATION_REPORTER_RUNTIME_STATE`。

面试表达：

我在业务页面和底层定位之间加了一层 runtime。页面只传车辆车牌和业务类型，不直接关心底层上报器的实现。这样车辆定位、人员定位以后也可以复用同一套上报能力。

### 3.5 底层持续定位上报模块

文件：`travel-web/sites/uniapp/src/services/locationReporter.js`

作用：

负责真正的后台定位、位置监听、轨迹数据构造、失败重试和停止清理。

关键逻辑：

`createLocationReporter()` 创建定位上报器。

`start()` 里先检查前台定位权限。

再检查后台定位权限。

然后绑定 `uni.onLocationChange()`。

再调用 `uni.startLocationUpdateBackground()`。

启动成功后，会主动调用一次 `getLocation()`。

如果系统长时间没有推送位置变化，会用定时器补采一次定位。

每次拿到定位后，统一走 `handleLocationChange()`。

`handleLocationChange()` 会先补报上一次失败的数据。

再把新定位点整理成后端需要的 payload。

最后调用 `submitPayload()` 上报。

如果上报失败，会把 payload 缓存到本地，等下次定位再补报。

面试表达：

底层上报器解决的是持续定位的稳定性问题。它不只监听位置变化，还处理权限、后台定位、启动锁、静默补采、失败缓存和下次补报。

### 3.6 坐标转换模块

文件：`travel-web/sites/uniapp/src/utils/coordinate.js`

作用：

把小程序定位坐标转换成后端需要的坐标。

关键逻辑：

`convertGcj02ToWgs84()` 接收经纬度。

先把输入转成有效数字。

如果无法转换，就返回 `null` 坐标。

如果坐标在中国大陆范围外，就不做偏移转换，只保留 7 位小数。

如果在范围内，就按 GCJ-02 偏移公式反推 WGS84。

最后统一保留 7 位小数。

面试表达：

小程序拿到的是 GCJ-02 坐标，但后端轨迹接口需要 WGS84。这里我把坐标转换抽成工具函数，扫码打卡和持续定位上报都能复用。

## 4. 关键函数解析

### handleScanCodeTap

作用：

处理用户点击扫码打卡入口。

输入：

用户点击事件。

输出：

调起扫码，并把扫码结果交给打卡流程。

为什么这样写：

先判断 `scanLoading`。

如果正在打卡，就直接 return。

这样可以防止用户连续点击，重复打开扫码或重复提交。

面试怎么说：

扫码入口做了重复点击保护。用户点击后先调设备扫码，拿到二维码内容后，再进入真正的打卡提交流程。

### handleScanTap

作用：

执行扫码打卡主流程。

输入：

扫码得到的 `codeUrl`。

输出：

调用正式工或临时工打卡接口。

为什么这样写：

扫码打卡需要三个核心数据。

第一个是当前时间 `clockTime`。

第二个是二维码内容 `codeUrl`。

第三个是当前坐标 `lng`、`lat`。

这三个数据都准备好后，才调用接口。

面试怎么说：

我把扫码打卡拆成扫码、取时间、取定位、提交接口四步。这样每一步失败时都能给用户明确提示。

### getClockCoordinates

作用：

获取扫码打卡时的一次性定位。

输入：

无。

输出：

转换后的 `lng` 和 `lat`。

为什么这样写：

它先调用 `getCurrentLocationWithPermission()`。

拿到小程序返回的 GCJ-02 坐标后，再用 `convertGcj02ToWgs84()` 转换。

如果定位失败或转换失败，就抛出“定位失败，请开启定位权限”。

面试怎么说：

扫码打卡提交前，我单独封装了 `getClockCoordinates()`，专门处理权限、定位和坐标转换。页面提交时只需要拿到最终可用的经纬度。

### ensureUserLocationPermission

作用：

确认用户是否授权前台定位。

输入：

无。

输出：

有权限则正常返回。

无权限则引导授权或抛出错误。

为什么这样写：

微信小程序定位授权有三种状态。

`true` 表示已同意。

`false` 表示拒绝过，需要打开设置页。

`undefined` 表示还没选择过，可以调用 `authorize`。

面试怎么说：

我没有直接调用 `getLocation`，而是先根据授权状态区分处理。第一次授权走 `authorize`，拒绝过授权就引导用户去设置页打开。

### getCurrentLocationWithPermission

作用：

带权限检查地获取一次当前位置。

输入：

可选定位参数。

输出：

`uni.getLocation()` 的定位结果。

为什么这样写：

定位失败可能是权限问题，也可能是系统定位关闭、信号差或超时。

所以这里先保证小程序权限，再调用系统定位。

失败时做 toast 冷却，避免连续弹提示。

面试怎么说：

这个函数把权限检查和一次性定位包在一起。业务页面不用关心具体授权流程，只处理成功坐标或失败提示。

### handleSubmitVehicle

作用：

处理开始使用车辆。

输入：

子组件提交的车辆表单对象。

输出：

创建车辆审批单，并在审批通过后启动车辆定位。

为什么这样写：

开始使用车辆不是简单保存表单。

它要先组装车辆参数。

再校验车牌、车辆类型、车辆分类、金额。

然后调用 `apiModifyCarStatus()` 创建审批单。

审批单创建成功后，把状态写入缓存。

再调用 `waitVehicleApproved()` 等审批通过。

面试怎么说：

车辆使用流程是先提交审批，再等审批状态变成已执行，最后才启动定位。这样可以保证定位上报只发生在合法用车状态下。

### waitVehicleApproved

作用：

轮询车辆审批状态，并在审批通过后启动定位。

输入：

车辆对象和是否先等待一次的配置。

输出：

定位启动成功返回 true。

为什么这样写：

审批不是立即完成。

所以用 `VEHICLE_APPROVAL_CHECK_INTERVAL` 每 10 秒查一次。

最多查 `VEHICLE_APPROVAL_MAX_CHECK_COUNT` 次。

`vehicleApprovalRunId` 用来终止旧轮询。

页面离开或重新开始流程时，旧轮询不会继续影响新状态。

面试怎么说：

我做了审批轮询控制。每次开始轮询都会生成新的 runId，如果页面离开或流程重启，旧轮询会自动失效，避免异步结果覆盖新状态。

### applyLocationTarget

作用：

设置定位对象并启动定位上报。

输入：

`target.entityId` 和 `target.type`。

输出：

定位启动是否成功。

为什么这样写：

定位上报必须先知道跟踪对象是谁。

这里先把车牌号写入 runtime。

再检查定位权限。

最后启动 `startLocationReporter()`。

面试怎么说：

启动定位前，我先设置当前跟踪对象。车辆定位用车牌号作为 `entityId`，用类型 1 表示车辆轨迹，然后再启动底层上报器。

### stopAttendanceLocation

作用：

停止当前考勤定位。

输入：

无。

输出：

停止上报器并清空定位对象。

为什么这样写：

结束用车、启动失败、临时工身份切换都需要清理定位。

所以抽成统一函数。

面试怎么说：

停止定位没有散落在多个地方，而是统一走 `stopAttendanceLocation()`。这样结束用车和异常回滚都能清掉上报器和定位对象。

### handleCloseVehicle

作用：

处理结束使用车辆。

输入：

当前车辆审批单 ID。

输出：

调用结束用车接口，停止定位并清理缓存。

为什么这样写：

后端需要知道结束的是哪一次车辆使用。

所以先取 `selectedVehicle.value.id`。

接口成功后，再停止定位，清状态，保存缓存。

面试怎么说：

结束用车时，我先通知后端结束车辆使用，再停止本地定位上报，并清空车辆状态。这样前后端状态能保持一致。

### buildLocationReportPayload

位置：`locationReporter.js`

作用：

把 uni 定位结果整理成后端轨迹接口字段。

输入：

`location` 和 `options`。

输出：

包含 `entityId`、`type`、`lng`、`lat`、`trackTime`、`speed`、`direction`、`accuracy`、`altitude`、`clientTime` 的对象。

为什么这样写：

uni 返回的是设备定位数据。

后端需要的是轨迹点数据。

这里统一做字段转换、坐标转换、时间转换和数值格式化。

面试怎么说：

我把原始定位点转换成标准轨迹 payload。这样后端只接收统一格式，页面也不用关心速度、方向、精度这些字段怎么处理。

### start

位置：`locationReporter.js`

作用：

启动后台持续定位上报服务。

输入：

无。

输出：

启动成功返回 true，失败返回 false。

为什么这样写：

启动过程比较复杂。

它要检查环境是否支持后台定位。

要申请前台定位和后台定位权限。

要绑定位置变化监听。

要启动后台定位。

还要补报失败数据和主动采集一次初始位置。

面试怎么说：

底层 `start()` 做了完整的后台定位启动流程。它还用 `startPromise` 防止并发启动，避免用户或页面生命周期重复触发定位启动。

## 5. 数据流转

### 5.1 扫码打卡数据流

扫码结果 -> `codeUrl` -> 当前时间 `clockTime` -> 一次性定位 -> GCJ-02 坐标 -> WGS84 坐标 -> `lng` / `lat` -> 正式工或临时工打卡接口 -> 成功提示

对应接口：

正式工：`/app/attendance/clock/longterm`

临时工：`/temp/attendance/clock/tempterm`

### 5.2 车辆定位数据流

车辆表单 -> 子组件校验 -> 父组件组装车辆申请参数 -> `/app/vehicle/usage/create` 创建审批单 -> 本地缓存车辆状态 -> 轮询 `/web/vehicle/getAuditStatus` -> 审批已执行 -> 设置 `entityId` 为车牌号 -> 启动后台定位 -> 坐标转换和 payload 标准化 -> `/web/track/upload` 上报轨迹 -> 结束用车 `/web/vehicle/end` -> 停止定位并清缓存

### 5.3 持续定位上报数据流

`uni.onLocationChange` 或主动 `getLocation` -> 原始 GCJ-02 定位 -> `buildLocationReportPayload()` -> WGS84 坐标 -> 轨迹 payload -> `reportTrack([point])` -> 成功记录最后上报时间 -> 失败缓存 pending payload -> 下次定位先补报失败数据

### 5.4 页面状态流

本地缓存 `attendanceVehicleState` -> `restoreVehicleState()` 回显车辆状态 -> `resumeVehicleApproval()` 继续审批轮询 -> `waitVehicleApproved()` 审批通过 -> `vehicleActive = true` -> 子组件 `statusText` 显示车辆使用中

## 6. 技术亮点

### 亮点一：一次性定位和持续定位分层清晰

代码中怎么体现：

扫码打卡只调用 `getClockCoordinates()`。

车辆定位走 `applyLocationTarget()` 和 `startLocationReporter()`。

解决了什么问题：

扫码只需要一次坐标。

车辆使用需要持续上报轨迹。

两类定位需求不混在一起，逻辑更清楚。

面试表达：

我把考勤定位分成一次性定位和持续定位。扫码打卡只取一次当前位置，车辆使用才启动后台持续上报。

### 亮点二：定位权限单独封装

代码中怎么体现：

`locationPermission.js` 提供 `ensureUserLocationPermission()` 和 `getCurrentLocationWithPermission()`。

解决了什么问题：

页面不用重复处理授权状态。

用户拒绝过授权时，也能统一引导去设置页。

面试表达：

我没有在页面里直接写 `uni.getLocation`，而是先封装定位权限。业务代码只关心“能不能拿到坐标”。

### 亮点三：坐标转换抽成公共工具

代码中怎么体现：

`convertGcj02ToWgs84()` 同时被扫码打卡和轨迹上报使用。

解决了什么问题：

避免两个场景各自写一套坐标处理。

也保证后端收到的经纬度格式一致。

面试表达：

因为小程序定位坐标和后端轨迹坐标标准不同，所以我把 GCJ-02 转 WGS84 抽成公共工具，并统一保留 7 位小数。

### 亮点四：车辆定位和审批状态绑定

代码中怎么体现：

`handleSubmitVehicle()` 先创建审批单。

`waitVehicleApproved()` 轮询状态。

只有状态为“已执行”时，才调用 `applyLocationTarget()`。

解决了什么问题：

避免审批还没通过就开始上报车辆轨迹。

面试表达：

车辆定位不是表单提交后马上开启，而是等审批执行后再启动。这样定位上报和业务审批状态保持一致。

### 亮点五：车辆状态本地缓存，支持页面恢复

代码中怎么体现：

`saveVehicleState()` 写入 `attendanceVehicleState`。

`restoreVehicleState()` 在页面进入时恢复。

`App.vue` 的 `onShow()` 也会尝试恢复定位。

解决了什么问题：

用户离开页面、切后台、重新进入时，不会丢失审批中或用车中的状态。

面试表达：

我把车辆使用状态缓存到本地。页面重新进入时，如果还在审批中，就继续查审批；如果已经在用车，就恢复车辆定位。

### 亮点六：用 `computed` 管理派生状态

代码中怎么体现：

`displayUserName` 派生顶部显示名。

`filteredActionItems` 根据账号类型和权限派生入口列表。

子组件里 `formDisabled`、`submitDisabled`、`submitButtonText`、`statusText` 都是 computed。

解决了什么问题：

模板不用写复杂判断。

状态变化后，按钮、文案和禁用状态自动更新。

面试表达：

我把页面展示相关的判断放到 `computed`。比如审批中、待开启定位、车辆使用中这些状态，都会自动影响按钮文案和表单是否可编辑。

### 亮点七：用 `watch` 处理字段联动和状态清理

代码中怎么体现：

父组件监听 `accountStore.isTempWorker`。

切换成临时工时，清掉车辆状态并停止定位。

子组件监听 `formData.vehicleType`。

非运营车辆时，清空 `vehicleCategory`。

子组件监听 `props.selectedVehicle`。

有缓存车辆时回显表单。

子组件监听 `props.vehicleActive`。

车辆结束后清空表单。

解决了什么问题：

字段联动和状态清理不需要散落在点击事件里。

面试表达：

我用 `watch` 处理有因果关系的状态变化。比如车辆类型变了，就清掉不再需要的车辆分类；身份切到临时工，就停止车辆定位。

### 亮点八：表单校验集中

代码中怎么体现：

`AttendanceLocationSelector.vue` 里用 `FORM_RULES` 存提示文案。

`submitErrorText` 统一计算当前第一个错误。

`handleSubmitVehicle()` 只判断 `submitErrorText`。

解决了什么问题：

校验规则不分散在多个点击事件里。

以后加字段时，只需要补充规则和 computed。

面试表达：

车辆表单校验没有写成一堆 if 分散在模板里，而是通过 `FORM_RULES` 和 `submitErrorText` 集中管理。

### 亮点九：持续定位有失败重试

代码中怎么体现：

`locationReporter.js` 里有 `PENDING_REPORT_STORAGE_KEY`。

上报失败时保存 pending payload。

下一次定位进来时，先调用 `flushPendingPayload()` 补报。

解决了什么问题：

网络抖动时，不会直接丢失轨迹点。

面试表达：

轨迹上报失败时，我没有直接丢弃数据，而是先缓存失败 payload。下次定位成功时，优先补报旧数据。

### 亮点十：持续定位有启动锁和停止清理

代码中怎么体现：

`locationReporter.js` 用 `state.startPromise` 防止重复启动。

`stop()` 会清定时器、解绑监听、停止系统定位、重置状态。

解决了什么问题：

避免多个页面生命周期同时触发定位启动。

也避免退出或结束用车后继续监听定位。

面试表达：

后台定位启动时我做了并发保护，停止时也统一解绑监听和清理定时器，避免重复上报或内存残留。

## 7. 可能被问到的问题

### Q1：为什么扫码打卡要先定位再提交？

A：因为考勤打卡需要证明用户当时的位置。前端先拿当前位置，再把 `clockTime`、`codeUrl`、`lng`、`lat` 一起提交给后端。

### Q2：扫码打卡和车辆定位有什么区别？

A：扫码打卡是一次性定位，只需要当前经纬度。车辆定位是持续定位，需要后台监听位置变化，并持续上报轨迹。

### Q3：为什么要做 GCJ-02 转 WGS84？

A：小程序 `uni.getLocation({ type: 'gcj02' })` 返回的是 GCJ-02 坐标。后端打卡和轨迹接口需要 WGS84，所以前端在提交前统一转换。

### Q4：定位权限是怎么处理的？

A：先通过 `getSetting()` 判断 `scope.userLocation`。已授权直接定位，没选择过就调用 `authorize`，拒绝过就弹窗引导用户打开设置页。

### Q5：为什么定位失败提示要做冷却？

A：定位失败可能是信号差或系统定位关闭。如果一直弹 toast，用户体验会很差。所以 `showLocationToast()` 限制 30 秒内最多提示一次。

### Q6：车辆定位为什么要等审批通过？

A：车辆使用是一个审批业务。只有审批状态变成“已执行”，才说明这次用车有效。定位上报应该和有效用车状态绑定。

### Q7：车辆审批轮询怎么避免旧请求影响新状态？

A：通过 `vehicleApprovalRunId`。每次开始新轮询都会生成新的 runId，旧轮询发现 runId 不一致就停止，不会覆盖新状态。

### Q8：车辆表单为什么拆成子组件？

A：车辆表单只负责输入、校验、状态文案和事件抛出。父组件负责接口、审批、定位。这样组件职责清楚，也方便维护。

### Q9：车辆表单里 computed 起什么作用？

A：它把按钮禁用、提交文案、状态文案、车辆类型文案都从原始状态中派生出来。模板只绑定结果，不写复杂判断。

### Q10：车辆类型变化时为什么要清空车辆分类？

A：只有运营车辆才需要选择大车或小车。切到非运营车辆后，如果不清空 `vehicleCategory`，提交时可能带上脏数据。

### Q11：为什么要缓存 `attendanceVehicleState`？

A：审批和定位不是瞬时流程。用户可能切后台或离开页面。缓存后，重新进入页面还能恢复车辆状态，继续轮询或恢复定位。

### Q12：App 回到前台时如何恢复定位？

A：`App.vue` 的 `onShow()` 会先检查 `shouldResumeLocationReporter()`。如果运行时缓存显示定位还在 active，就直接 `startLocationReporter()`。否则再交给账号 Store 的 `resumeVehicleLocation()` 从车辆缓存恢复。

### Q13：轨迹上报失败怎么办？

A：失败时会把当前 payload 缓存到 `LOCATION_REPORT_PENDING_PAYLOAD`。下一次定位变化时，先补报旧 payload，再处理新的定位点。

### Q14：持续定位怎么防重复启动？

A：底层 `createLocationReporter()` 的 state 里有 `isStarted` 和 `startPromise`。已经启动就直接返回 true，正在启动就复用同一个 Promise。

### Q15：结束用车时做了哪些清理？

A：先调用 `/web/vehicle/end` 通知后端结束用车。成功后调用 `stopAttendanceLocation()` 停止上报器，清空定位对象，再清空 `selectedVehicle`、`vehicleActive` 和审批状态。

### Q16：临时工为什么不走车辆定位？

A：代码里监听了 `accountStore.isTempWorker`。切到临时工时，会清空车辆状态并停止定位。说明车辆定位只服务长期工用车场景。

### Q17：持续定位上报的 payload 包含哪些字段？

A：包含 `entityId`、`type`、`lng`、`lat`、`trackTime`、`speed`、`direction`、`accuracy`、`altitude`、`clientTime`。这些字段在 `buildLocationReportPayload()` 里统一生成。

### Q18：如果系统不推送位置变化怎么办？

A：`locationReporter.js` 做了静默补采。系统超过一段时间没有推送定位时，会通过定时器主动调用一次 `getLocation()`，作为在线心跳和补偿。

## 8. 可用于面试或答辩的表达

我负责的是 UniApp 考勤模块里的定位链路。

这个定位不是简单调用 `uni.getLocation`。

它分成两种场景。

第一种是扫码打卡的一次性定位。

用户扫码后，前端先拿当前坐标，再做 GCJ-02 到 WGS84 的转换，最后把打卡时间、二维码内容和坐标一起提交给后端。

第二种是长期工使用车辆后的持续定位。

用户先提交车辆使用审批。

审批单创建成功后，页面进入轮询。

只有审批状态变成“已执行”，才会启动后台定位上报。

车辆定位使用车牌号作为上报对象。

上报类型用常量 `VEHICLE_LOCATION_TYPE` 管理。

底层定位上报器负责权限、后台定位、位置监听、静默补采、失败重试和停止清理。

页面只负责业务流程编排。

子组件只负责车辆表单输入和校验。

这样写的好处是，一次性打卡定位和持续车辆定位不会互相干扰。

权限逻辑、坐标转换、轨迹上报也都可以复用。

## 9. 一句话总结

这个功能本质上是通过定位权限封装、坐标统一转换、车辆审批状态驱动、后台定位上报器和本地状态恢复，把“扫码打卡取点”和“车辆使用轨迹上报”两个定位流程规范化，保证考勤数据既能提交当前位置，也能持续记录车辆轨迹。
