# PermissionView 权限组件项目解析

## 1. 功能概述

`PermissionView` 是 uniapp 小程序里的权限展示组件。

它主要解决三个问题。

第一，页面里的菜单入口、按钮入口、表单操作不再手写一堆 `if` 判断。

第二，权限判断不只支持页面按钮，还支持菜单权限和弹窗权限。

第三，没有权限时可以选择直接隐藏，也可以用遮罩文案提示用户。

入口文件是 `travel-web/sites/uniapp/src/components/PermissionView/index.vue`。

权限数据来源是 `travel-web/sites/uniapp/src/store/modules/permission.js`。

实际使用场景包括首页待办入口、个人中心菜单、考勤操作入口、客诉处理弹窗等页面。

面试表达：

我负责的是小程序端的权限展示组件封装。它不是单纯判断一个按钮显不显示，而是把菜单权限、页面按钮权限、弹窗权限统一收口到一个组件和一组工具函数里。页面只需要传权限码和权限作用域，组件内部会从 Pinia 权限 Store 读取对应权限集合，判断是否展示内容。

## 2. 核心业务流程

1. 登录后，权限接口返回当前账号的权限树。
2. `permissionStore.setPermissionInfo()` 把权限树拆成菜单、页面按钮、弹窗按钮三类数据。
3. 页面使用 `PermissionView` 包住需要控制的内容。
4. 组件通过 `scope` 判断应该读取哪一类权限集合。
5. 组件把外部传入的 `code` 和 `codes` 合并、去空、去空格。
6. 组件用 `canShowByPermission()` 判断权限集合里是否命中目标权限码。
7. 有权限时展示默认插槽内容。
8. 没有权限且 `mode="mask"` 时展示遮罩插槽或默认 `maskText`。
9. 没有权限且是默认 `hide` 模式时不渲染内容。
10. 如果业务逻辑需要在 JS 点击事件里判断权限，可以直接调用 `canShowByPermission()` 或 `executeByPermission()`。

面试表达：

这个功能的核心流程是，后端权限数据先进入 `permissionStore`，前端把它整理成 `menuCodes`、`ruleNames`、`dialogNames` 三类数组。页面展示时不直接读取后端原始权限树，而是通过 `PermissionView` 传入权限码。组件根据 `scope` 选择对应数组，再判断是否命中权限码，最后决定展示、隐藏，或者显示无权限遮罩。

## 3. 关键代码模块拆解

### 3.1 权限展示组件模块

文件：`travel-web/sites/uniapp/src/components/PermissionView/index.vue`

作用：

统一控制小程序页面中的权限展示。

关键逻辑：

组件接收 `code`、`codes`、`mode`、`maskText`、`scope` 五个 props。

`code` 用于单个权限码。

`codes` 用于多个权限码，只要命中其中一个就展示。

`mode` 决定无权限时是隐藏还是遮罩。

`scope` 决定读取 `ruleNames`、`menuCodes` 还是 `dialogNames`。

模板里只保留两种渲染结果。

有权限时显示默认插槽。

没权限但开启 mask 模式时显示 `mask` 插槽或默认文本。

面试表达：

这个组件我没有让页面自己去写权限数组判断，而是把权限判断封装到 `PermissionView` 里。页面只关心“这个区域对应哪个权限码”，组件内部负责读取 Store、判断权限、决定展示方式。这样每个页面的模板会更干净，权限规则也更统一。

### 3.2 权限 Store 模块

文件：`travel-web/sites/uniapp/src/store/modules/permission.js`

作用：

统一保存和标准化当前账号的权限数据。

关键逻辑：

`menuList` 保存页面可展示的业务菜单。

`menuCodes` 保存菜单权限码。

`ruleNames` 保存页面按钮和页面内操作权限码。

`dialogNames` 保存弹窗按钮权限码。

`loaded` 标记权限是否已经加载过。

`fetchPermissionInfo()` 调用 `apiGetRolePermissionInfo()` 获取后端权限。

`setPermissionInfo()` 把后端权限树拆成前端好用的数据结构。

面试表达：

权限接口返回的是一棵完整权限树，页面直接消费会很麻烦。所以我在 Store 层先做一次标准化，把菜单权限、页面权限、弹窗权限拆开。这样组件和页面后续只需要查数组，不需要关心后端原始结构。

### 3.3 页面使用模块

文件示例：

`travel-web/sites/uniapp/src/pages/index/index.vue`

`travel-web/sites/uniapp/src/pages/profile/index.vue`

`travel-web/sites/uniapp/src/packageAttendance/attendance/index.vue`

`travel-web/sites/uniapp/src/packageOther/customer-complaint/ComplaintDialog.vue`

作用：

在真实业务页面中控制入口显示和操作权限。

关键逻辑：

首页用 `scope="menu"` 控制“今日核心待办”入口。

个人中心用 `codes` 判断是否显示菜单卡片，再用单个 `code` 控制“我的单据”“我的考勤”。

考勤页用 `PermissionView` 控制长期工的考勤记录、请假申请入口。

客诉弹窗用 `mode="mask"`，无权限时不直接消失，而是展示“仅创建账号可上传沟通记录与处理结果”的提示。

面试表达：

这个组件的价值在页面使用时更明显。比如首页和个人中心是菜单级权限，用 `scope="menu"`。客诉弹窗是操作权限，但无权限时不能让用户完全不知道原因，所以用了 `mode="mask"` 展示说明。不同页面只换入参，不需要重复写判断逻辑。

## 4. 重要函数说明

### normalizeCodeList

位置：`PermissionView/index.vue`

作用：

把单个 `code` 和多个 `codes` 合并成一个干净数组。

输入：

`code` 字符串和 `codes` 数组。

输出：

去掉空值和首尾空格后的权限码数组。

为什么这样写：

业务页面有时只判断一个权限，有时要判断多个权限。

如果每个页面自己处理单个和多个权限，会重复而且容易漏掉空值。

统一清洗后，后面的权限判断只需要处理数组。

面试怎么说：

我先把外部传入的 `code` 和 `codes` 标准化成同一种数据结构。这样后续判断函数不用关心入参到底是单个还是多个，也避免空字符串、空格、`null` 这类脏数据影响判断结果。

### canShowByPermission

位置：`PermissionView/index.vue`

作用：

判断目标权限码是否命中当前账号权限集合。

输入：

目标权限码 `code/codes`，当前权限集合 `ruleNames`。

输出：

布尔值，表示是否有权限展示。

为什么这样写：

它支持两种权限集合格式。

如果权限集合是数组，就用 `includes` 判断。

如果权限集合是对象，就用 `hasOwnProperty` 判断 key 是否存在。

多个权限码使用 `some`，只要命中一个就通过。

面试怎么说：

权限判断的核心是 `canShowByPermission()`。它先拿到标准化后的权限码数组，再判断这些权限码里有没有任意一个存在于当前账号权限集合中。这里用 `some` 是因为很多入口只要拥有任意一个相关权限就应该展示，不要求所有权限都同时具备。

### normalizePermissionMode

位置：`PermissionView/index.vue`

作用：

规范无权限时的展示模式。

输入：

外部传入的 `mode`。

输出：

只返回 `mask` 或 `hide`。

为什么这样写：

外部传错字符串时，组件不进入未知状态。

只有明确传 `mask` 才展示遮罩。

其他情况都按默认隐藏处理。

面试怎么说：

我给展示模式做了兜底处理。外部只有传入 `mask` 才会进入遮罩模式，其他值统一走隐藏模式。这样可以避免因为页面传参错误导致权限组件出现不可预期的展示状态。

### getPermissionNamesByScope

位置：`PermissionView/index.vue`

作用：

根据 `scope` 选择当前要判断的权限集合。

输入：

`scope` 和可选的 `permissionStore`。

输出：

对应的权限数组。

为什么这样写：

项目里有三类权限。

`rule` 对应页面按钮和页面内操作权限。

`menu` 对应菜单入口权限。

`dialog` 对应弹窗按钮权限。

如果外部没有传 Store，就默认使用全局 `usePermissionStore()`。

如果某一类数据不是数组，就返回空数组兜底，避免后续 `includes` 报错。

面试怎么说：

我把权限来源按 `scope` 做了统一入口。页面不用自己知道 Store 里具体字段怎么取，只要传 `scope="menu"` 或 `scope="dialog"`。组件内部会选择 `menuCodes`、`dialogNames` 或默认的 `ruleNames`。

### executeByPermission

位置：`PermissionView/index.vue`

作用：

在 JS 逻辑中按权限执行成功或失败回调。

输入：

权限码、权限作用域、成功回调、失败回调、可选 Store。

输出：

有回调时返回回调结果，没有回调时返回 `true` 或 `false`。

为什么这样写：

有些场景不适合直接隐藏按钮。

比如点击后需要提示“无权限”，或者要在执行动作前做权限拦截。

这个函数可以复用同一套权限判断逻辑，避免模板组件和 JS 事件判断结果不一致。

面试怎么说：

除了组件展示，我还提供了 `executeByPermission()` 给脚本逻辑使用。它会先按 `scope` 取权限，再复用 `canShowByPermission()` 判断。有权限执行 `onSuccess`，没权限执行 `onFail`。这样模板展示和点击拦截用的是同一套规则。

### setup 中的 computed

位置：`PermissionView/index.vue`

作用：

把 props 和 Store 数据转换成模板可直接使用的展示状态。

关键计算：

`normalizedMode` 从 `props.mode` 得到最终模式。

`permissionNames` 从 `props.scope` 和 Store 得到权限集合。

`canShow` 根据权限码和权限集合得到是否展示。

`isMaskMode` 判断当前是否是遮罩模式。

为什么这样写：

这些值都是由 props 或 Store 推导出来的。

用 `computed` 后，当权限 Store 或 props 变化时，展示状态会自动重新计算。

面试怎么说：

组件内部没有手动写 `watch`，而是用 `computed` 表达派生状态。`canShow` 依赖权限码和权限数组，只要 Store 权限更新，页面显示就会自动跟着变化。

## 5. 数据流转

权限接口数据流：

`apiGetRolePermissionInfo()` -> `fetchPermissionInfo()` -> `setPermissionInfo()` -> 拆分出 `menuCodes`、`ruleNames`、`dialogNames` -> Pinia 持久化 -> 页面组件读取。

组件展示数据流：

页面传入 `code/codes` 和 `scope` -> `normalizeCodeList()` 清洗权限码 -> `getPermissionNamesByScope()` 取对应权限集合 -> `canShowByPermission()` 判断是否命中 -> `canShow` 控制默认插槽展示。

无权限展示数据流：

`canShow` 为 `false` -> `normalizePermissionMode()` 判断模式 -> `isMaskMode` 为 `true` 时显示 `mask` 插槽或 `maskText` -> `isMaskMode` 为 `false` 时不渲染内容。

脚本拦截数据流：

点击事件 -> `executeByPermission()` -> 按 `scope` 获取权限集合 -> 复用 `canShowByPermission()` -> 有权限执行 `onSuccess` -> 无权限执行 `onFail`。

## 6. 技术亮点总结

### 亮点一：权限判断组件化

代码中怎么体现：

页面通过 `<PermissionView>` 包住需要控制的内容。

具体判断逻辑集中在 `PermissionView/index.vue`。

解决了什么问题：

页面不用重复写 `permissionStore.ruleNames.includes(xxx)`。

权限展示规则集中维护，后续调整判断规则只需要改组件和工具函数。

面试表达：

我把页面权限展示抽成了 `PermissionView` 组件。业务页面只传权限码，不直接操作权限数组。这样模板更清晰，也能保证不同页面的权限判断规则一致。

### 亮点二：支持三类权限作用域

代码中怎么体现：

`getPermissionNamesByScope()` 根据 `scope` 返回 `dialogNames`、`menuCodes` 或 `ruleNames`。

解决了什么问题：

菜单、页面按钮、弹窗按钮的权限来源不同。

如果只写死 `ruleNames`，菜单入口和弹窗按钮会判断错。

面试表达：

我没有把权限来源写死，而是加了 `scope`。菜单入口用 `menu`，弹窗按钮用 `dialog`，普通页面按钮用默认 `rule`。这样同一个组件能覆盖多个权限场景。

### 亮点三：支持单权限和多权限

代码中怎么体现：

组件同时支持 `code` 和 `codes`。

`normalizeCodeList()` 会把它们合并成数组。

`canShowByPermission()` 使用 `some` 判断，只要命中一个权限码就展示。

解决了什么问题：

有些 UI 区块不是由单个权限决定的。

比如个人中心菜单卡片，只要用户有“我的单据”或“我的考勤”其中一个菜单权限，就应该显示外层卡片。

面试表达：

我考虑了一个区域由多个权限共同控制的情况，所以组件不只支持单个 `code`，也支持 `codes`。外层容器可以用多个权限判断，内部每一项再用单个权限精确控制。

### 亮点四：无权限时支持隐藏和遮罩两种体验

代码中怎么体现：

`PERMISSION_VIEW_MODE` 定义 `hide` 和 `mask`。

模板里 `v-else-if="isMaskMode"` 展示遮罩插槽或默认文本。

客诉弹窗里使用 `mode="mask"` 提示用户没有处理权限。

解决了什么问题：

有些入口无权限时应该彻底隐藏。

有些业务区域无权限时需要告诉用户原因，不能直接消失。

面试表达：

我把无权限状态分成两种处理。普通入口默认隐藏，避免用户看到不可操作按钮。像客诉处理这种需要说明原因的场景，使用 `mask` 模式展示提示文案，让用户知道不是页面坏了，而是当前账号没有处理权限。

### 亮点五：模板判断和 JS 判断复用同一套逻辑

代码中怎么体现：

组件内部用 `canShowByPermission()`。

考勤页和客诉弹窗的脚本逻辑也直接导入 `canShowByPermission()`。

`executeByPermission()` 进一步封装成功和失败回调。

解决了什么问题：

避免模板显示一套规则，点击事件又写另一套规则。

降低权限判断不一致的风险。

面试表达：

我把核心判断函数导出，让组件展示和业务 JS 都复用它。这样不会出现按钮看起来有权限，但点击时又被另一套逻辑拦掉的问题。

### 亮点六：权限数据做了兜底处理

代码中怎么体现：

`getPermissionNamesByScope()` 判断对应字段是否为数组。

不是数组时返回空数组。

`canShowByPermission()` 在没有权限码时直接返回 `false`。

解决了什么问题：

权限接口未加载、字段为空、页面传参为空时，不会误展示受控内容。

也不会因为 `includes` 调用在非数组上导致页面报错。

面试表达：

权限组件默认是保守策略。没有传权限码、权限集合不存在、权限数据格式异常时，都不会展示内容。这样可以避免权限数据异常时误放开操作入口。

## 7. 可能被问到的问题

### Q1：为什么要做 `PermissionView`，不用页面里直接 `v-if` 判断？

A：因为权限判断在很多页面都会用到。如果每个页面都直接写 `permissionStore.ruleNames.includes()`，代码会重复，而且菜单、按钮、弹窗三类权限容易取错。封装成组件后，页面只传 `code` 和 `scope`，具体读取哪个权限数组、如何判断、无权限怎么展示都由组件统一处理。

### Q2：`code` 和 `codes` 有什么区别？

A：`code` 适合单个权限码，比如一个按钮只对应一个权限。`codes` 适合一个区域由多个权限共同决定的场景，比如个人中心外层菜单卡片，只要命中“我的单据”或“我的考勤”其中一个权限，就显示外层容器。

### Q3：为什么多个权限用 `some`，不是要求全部满足？

A：当前业务场景里，多权限通常表示“任意一个入口可见，外层区域就可见”。比如一个菜单卡片里有两个子菜单，用户只要有其中一个子菜单权限，就应该看到卡片。如果需要全部满足，可以后续扩展一个 `matchMode`，但当前代码是按任意命中处理。

### Q4：`scope` 是干什么的？

A：`scope` 用来选择权限来源。默认 `rule` 读取 `ruleNames`，用于页面按钮和页面内操作。`menu` 读取 `menuCodes`，用于菜单入口。`dialog` 读取 `dialogNames`，用于弹窗按钮。如果不区分 `scope`，不同类型权限会混在一起，容易判断错。

### Q5：为什么权限 Store 要拆成 `menuCodes`、`ruleNames`、`dialogNames`？

A：因为后端返回的是完整权限树，但前端使用时场景不同。菜单展示只关心菜单 code，页面按钮只关心页面按钮 code，弹窗按钮只关心弹窗按钮 code。Store 先拆分，页面后面使用就更简单，也不需要重复遍历权限树。

### Q6：`mode="mask"` 解决了什么问题？

A：它解决的是“无权限但需要解释”的场景。比如客诉处理弹窗里，用户没有处理权限时，如果直接隐藏整块区域，用户可能不知道为什么不能操作。使用 mask 模式可以展示提示文案，告诉用户当前账号无权限或只能由创建账号处理。

### Q7：为什么 `normalizePermissionMode()` 只认 `mask`？

A：这是一个兜底设计。只有明确传入 `mask` 才展示遮罩，其他值都走默认隐藏。这样外部传错字符串时，不会出现未知展示状态。

### Q8：权限数据还没加载完时会发生什么？

A：如果权限数据还没加载，`ruleNames`、`menuCodes`、`dialogNames` 默认是空数组。组件会判断没有权限，默认不展示内容。等权限 Store 更新后，`computed` 会重新计算，页面会自动更新显示状态。

### Q9：为什么 `canShowByPermission()` 还支持对象格式？

A：这是为了兼容不同权限集合结构。数组用 `includes` 判断，对象用 key 判断。虽然当前 Store 里主要是数组，但工具函数保留对象兼容，可以让它在更多场景复用。

### Q10：这个组件和 `v-permission` 指令有什么区别？

A：`PermissionView` 更适合小程序和组件化展示场景，用插槽控制一块内容显示、隐藏或遮罩。指令更适合直接挂在 DOM 元素上控制元素展示。当前 uniapp 页面里，用组件包裹内容会更直观，也方便处理 mask 插槽。

### Q11：如果用户没有权限，是否只是前端隐藏就够了？

A：前端权限控制主要是用户体验和入口控制，不能替代后端鉴权。真正的接口权限仍然需要后端校验。前端做 `PermissionView` 是为了避免用户看到不可操作入口，并减少无效操作。

### Q12：这个组件有没有考虑临时工场景？

A：有些页面会在使用 `PermissionView` 前先判断 `accountStore.isTempWorker`。比如考勤页里，临时工不走正式员工权限树，页面会直接放行部分入口；正式员工才走 `PermissionView` 和 `ruleNames` 判断。这说明组件负责通用权限判断，特殊账号类型由页面业务逻辑先分流。

## 8. 可用于面试或答辩的表达

我在小程序端封装了一个 `PermissionView` 权限展示组件。

它主要用来统一控制菜单入口、页面按钮和弹窗操作的显示权限。

后端权限接口返回后，我先在 `permissionStore` 里把权限树拆成三类数据。

`menuCodes` 用来判断菜单入口。

`ruleNames` 用来判断页面按钮和页面内操作。

`dialogNames` 用来判断弹窗按钮。

页面使用时，只需要用 `PermissionView` 包住受控内容，然后传入权限码。

如果是菜单权限，就传 `scope="menu"`。

如果是弹窗权限，就传 `scope="dialog"`。

普通页面按钮默认走 `rule`。

组件内部会先把 `code` 和 `codes` 合并成一个干净数组。

然后根据 `scope` 从 Store 里取对应权限集合。

最后通过 `canShowByPermission()` 判断是否命中权限。

有权限时展示默认插槽内容。

没有权限时，默认隐藏。

如果业务需要解释原因，可以传 `mode="mask"`，展示遮罩插槽或默认文案。

我还把核心判断函数导出了。

这样模板展示和 JS 点击事件都能复用同一套权限判断规则。

比如考勤页面的入口过滤、客诉弹窗的提交前校验，都可以直接调用 `canShowByPermission()`。

这样做的好处是，权限逻辑不会散落在每个页面里，后续如果权限字段或判断规则调整，只需要改组件和工具函数。

同时它也避免了菜单权限、按钮权限、弹窗权限混用导致的判断错误。

## 9. 一句话总结

`PermissionView` 本质上是把“权限数据来源选择、权限码标准化、权限命中判断、无权限展示策略”统一封装起来，让小程序页面只通过 `code/codes + scope` 就能完成菜单、按钮和弹窗的权限控制。
