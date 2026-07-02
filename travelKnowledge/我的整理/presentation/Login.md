# Web 登录逻辑项目解析

## 1. 功能概述

这个登录功能主要解决三个问题。

第一，用户输入账号密码后，前端完成表单校验和密码加密。

第二，登录成功后，把 token、账号 ID、用户信息和部门信息统一存到 Pinia。

第三，根据当前账号权限，动态生成可访问菜单和路由。

这不是一个单独的登录按钮逻辑。

它是一条完整的登录鉴权链路。

入口在 `travel-web/sites/web/src/pages/login/login.vue`。

状态管理在 `travel-web/sites/web/src/store/modules/account.js` 和 `travel-web/sites/web/src/store/modules/permission.js`。

请求拦截在 `travel-web/sites/web/src/utils/request.js`。

路由守卫在 `travel-web/sites/web/src/router/index.js`。

动态路由生成在 `travel-web/sites/web/src/router/model/permissionModel.js`。

## 2. 核心业务流程

1. 用户进入 `/login` 页面。
2. 用户输入手机号和密码。
3. `t-form` 先做必填校验。
4. 校验通过后，前端对密码做 SHA1 和 MD5 加盐处理。
5. 调用 `accountStore.login()`。
6. Store 调用 `/web/login` 接口。
7. 接口返回字符串，前端拆出 `accountId` 和 `token`。
8. Store 保存登录态，并根据“记住我”决定是否保存账号密码。
9. Store 再调用 `/web/loginInfo` 获取用户详情。
10. 登录页提示成功。
11. 根据 `redirect` 回到用户原本想访问的页面。
12. 路由守卫检测到 token 后，拉用户信息和权限信息。
13. 权限 Store 调用 `/web/role/getPermission`。
14. 前端把权限数据拆成菜单权限、页面按钮权限、弹窗按钮权限。
15. `permissionModel` 根据菜单权限注册动态路由。
16. Layout 通过 `asyncRoute` 渲染侧边栏菜单。
17. 页面按钮通过 `v-permission` 控制显示隐藏。

面试表达：

我负责的是后台系统的登录鉴权链路。它不只是登录接口调用，还包括登录态保存、用户信息回显、接口请求鉴权、权限菜单生成、动态路由注册和按钮级权限控制。

## 3. 核心代码模块

### 3.1 登录页面模块

文件：`travel-web/sites/web/src/pages/login/login.vue`

作用：

负责收集用户输入，完成表单校验，触发登录。

关键逻辑：

页面用 `formData` 统一管理 `user`、`pass`、`remember`。

模板里通过 `v-model` 绑定到输入框和复选框。

点击登录时，先调用 `tFormRef.value.validate()`。

校验通过后，再处理密码加密和接口调用。

代码里没有直接把原始密码传给接口。

它先把密码 `trim()` 后做 SHA1。

再拼接固定 salt。

最后再做 MD5。

面试表达：

登录页这块我主要做了表单输入、校验和提交前的数据处理。账号、密码、记住我都放在 `formData` 中统一管理，模板通过 `v-model` 绑定，提交时先校验，再对密码做加密处理，最后交给 Store 统一完成登录。

### 3.2 账号 Store 模块

文件：`travel-web/sites/web/src/store/modules/account.js`

作用：

统一保存登录态和用户基础信息。

关键逻辑：

`token` 保存接口鉴权凭证。

`accountId` 保存当前登录账号 ID。

`accountInfo` 保存用户完整信息。

`accountRoleId`、`accountRealName`、`accountDepartmentId`、`accountDepartmentName`、`accountDepartmentBelongBlock` 保存派生字段。

`persistLoginParams` 和 `rememberLogin` 保存记住密码逻辑。

`persist.pick` 只持久化需要跨刷新保留的字段。

面试表达：

登录成功后的数据没有散落在页面里，而是统一放在 `accountStore`。这样请求拦截器、路由守卫、顶部用户信息、水印和业务页面都能从同一个状态源读取当前用户信息。

### 3.3 请求封装模块

文件：`travel-web/sites/web/src/utils/request.js`

作用：

统一处理接口请求、token 注入、登录失效和错误提示。

关键逻辑：

请求前会读取 `accountStore.token`。

业务接口没有 token 时，会创建 `LOGGED_OUT` 错误并中断请求。

登录接口 `/web/login` 和验证码接口 `/login/verify/getPic` 放在 `AUTH_FREE_URLS` 中，不需要 token。

请求头里统一写入 `AUTHORIZATION`、`AUTHORIZATIONID` 和 `ACCOUNT_SOURCE`。

响应里如果遇到 401 或 403，会调用 `redirectToLogin()` 清理登录态并跳回登录页。

面试表达：

我把鉴权逻辑放在请求封装层处理。这样业务页面不用每次自己判断 token，也不用重复写 401、403 的处理。只要接口返回登录过期或无权限，请求层会统一清状态、提示用户、跳转登录页。

### 3.4 路由守卫模块

文件：`travel-web/sites/web/src/router/index.js`

作用：

控制用户能不能进入目标页面。

关键逻辑：

如果访问 `/login`，直接放行。

如果有 token，先调用 `accountStore.getLoginInfo()`。

再调用 `permissionStore.fetchPermissionInfo()` 获取权限。

如果权限还没加载，就调用 `addRoutes()` 注册动态路由。

如果访问 `/`，跳到第一个可访问业务路由。

如果没有权限路由，跳回登录页并提示。

如果没有 token，就重置动态路由和权限状态，再跳登录页。

面试表达：

路由守卫是登录后的核心入口。它负责判断是否有 token、是否需要重新拉用户信息、是否需要加载权限、目标路由是否存在。这样可以保证刷新页面后，也能恢复当前用户的菜单和可访问路由。

### 3.5 权限 Store 模块

文件：`travel-web/sites/web/src/store/modules/permission.js`

作用：

统一管理菜单权限和按钮权限。

关键逻辑：

`menuList` 保存可见菜单。

`menuCodes` 保存菜单 code。

`ruleNames` 保存页面按钮权限。

`dialogNames` 保存弹窗按钮权限。

`loaded` 标记权限是否已经加载过。

`fetchPermissionInfo()` 只有在有 token 时才拉权限。

如果 `loaded` 为 true 且不强制刷新，就直接复用缓存。

面试表达：

权限数据没有直接在页面里使用，而是先经过权限 Store 统一标准化。菜单、页面按钮、弹窗按钮分别存成不同数组，页面使用时只需要关心权限 code，不需要关心后端原始数据结构。

### 3.6 动态路由模块

文件：`travel-web/sites/web/src/router/model/permissionModel.js`

作用：

根据后端菜单权限，生成当前用户可访问路由。

关键逻辑：

`createAsyncRoutes()` 用后端返回的 `vueUrl` 和前端 `allRoutes` 做匹配。

匹配成功后，把后端菜单的 `name`、`icon`、`orderIndex` 合并到路由 `meta`。

`addRoutes()` 先清理旧动态路由，再注册新动态路由。

`resetAsyncRoutes()` 用于退出登录或权限失效时恢复到静态路由。

面试表达：

动态路由这块不是后端直接控制前端组件，而是后端提供菜单路径和权限数据，前端用 `vueUrl` 匹配本地路由表。这样既能保证前端路由可控，也能根据角色动态展示不同菜单。

### 3.7 页面展示模块

文件：`travel-web/sites/web/src/components/layout/Layout.vue`

作用：

根据动态路由渲染侧边栏菜单。

关键逻辑：

`menuRoutes` 是一个 `computed`。

它直接读取 `asyncRoute.value`。

当路由守卫注册动态路由后，`asyncRoute` 更新，侧边栏也跟着更新。

面试表达：

登录后的菜单不是写死在 Layout 里，而是通过 `asyncRoute` 派生出来。权限变化后，动态路由变，菜单展示也会同步变化。

### 3.8 权限指令模块

文件：`travel-web/sites/web/src/directives/permission.js`

作用：

控制按钮和操作入口是否显示。

关键逻辑：

默认读取 `permissionStore.ruleNames`。

`v-permission:dialog` 读取 `dialogNames`。

`v-permission:menu` 读取 `menuCodes`。

指令内部使用 `watch` 监听权限数组变化。

权限没加载完成时，后续权限更新也能重新计算显示状态。

面试表达：

按钮权限没有写在每个页面的 `if` 判断里，而是抽成了 `v-permission` 指令。页面只传权限 code，指令负责从 Store 读取权限列表并控制显示隐藏。

## 4. 关键函数解析

### login

位置：`login.vue`

作用：

处理用户点击登录后的完整流程。

输入：

来自 `formData` 的账号、密码、记住我状态。

输出：

登录成功后跳转到目标页面。

为什么这样写：

先做表单校验，避免空账号空密码请求接口。

再做密码加密，避免明文密码直接提交。

登录成功后读取 `route.query.redirect`，让用户回到原本要访问的页面。

面试怎么说：

我把登录提交分成四步：校验、加密、调用 Store、跳转。页面只负责用户交互，真正的登录态保存放到 Store 里。

### accountStore.login

位置：`account.js`

作用：

调用登录接口，并保存登录态。

输入：

登录参数 `params` 和记住密码配置 `options`。

输出：

更新 `token`、`accountId`、`rememberLogin`、`persistLoginParams`，并拉取用户信息。

为什么这样写：

登录接口返回的是一个用点号分隔的字符串。

前端用 `res.split('.')` 拆出账号 ID 和 token。

然后马上调用 `getLoginInfo(true)`。

这样登录成功后，页面能立即拿到用户姓名、角色、部门、COS 配置等信息。

面试怎么说：

登录成功不是只保存 token。我还会立刻拉用户信息，并把常用字段同步成独立状态，方便后续页面直接使用。

### getLoginInfo

位置：`account.js`

作用：

获取当前登录用户的详细信息。

输入：

`reload`，表示是否强制重新拉取。

输出：

更新 `accountInfo`、COS 配置和用户派生字段。

为什么这样写：

如果已有 `accountInfo.id` 且不需要刷新，就直接复用缓存。

如果需要刷新，就调用 `/web/loginInfo`。

返回值可能有不同结构，所以用 `normalizeAccountInfo()` 做统一处理。

面试怎么说：

我考虑了接口返回结构不稳定的问题，所以没有直接写死 `res.data.accountInfo`，而是先做标准化，再保存到 Store。

### syncAccountDerivedFields

位置：`account.js`

作用：

从用户详情里提取常用字段。

输入：

用户详情 `info`。

输出：

角色 ID、真实姓名、部门 ID、部门名称、所属板块等字段。

为什么这样写：

业务页面经常只需要用户的某几个字段。

如果每次都从深层对象里取，模板和业务代码会变复杂。

所以 Store 里提前同步成扁平字段。

面试怎么说：

我把常用用户字段从复杂对象里拆出来，统一放在 Store。这样业务页面不用重复写 `roleVO.departmentVO` 这种深层读取。

### fetchPermissionInfo

位置：`permission.js`

作用：

获取并缓存当前用户权限。

输入：

`reload`，表示是否强制刷新权限。

输出：

更新菜单、页面按钮、弹窗按钮权限。

为什么这样写：

权限接口只在有 token 时调用。

如果已经加载过权限，并且不需要刷新，就复用现有权限。

这样可以避免同一轮路由跳转中重复请求权限接口。

面试怎么说：

权限加载做了缓存控制。第一次进入系统会拉权限，后续路由跳转不重复拉，刷新页面时再重新恢复权限。

### setPermissionInfo

位置：`permission.js`

作用：

把后端权限数据整理成前端好用的状态。

输入：

接口返回的权限列表。

输出：

`menuList`、`menuCodes`、`ruleNames`、`dialogNames`。

为什么这样写：

后端返回的是完整权限树。

前端实际使用时，需要分成菜单、页面按钮、弹窗按钮。

所以用 `permission-state.js` 里的工具函数统一拆分。

面试怎么说：

我没有让页面直接消费后端权限树，而是在 Store 层先拆成不同用途的数据。菜单渲染、按钮控制、弹窗控制各用各的权限数组。

### addRoutes

位置：`permissionModel.js`

作用：

根据权限菜单注册动态路由。

输入：

router 实例和当前用户菜单列表。

输出：

把可访问路由注册到 Vue Router，并更新 `asyncRoute`。

为什么这样写：

注册前先移除旧动态路由。

这样可以避免切换账号或权限失效后，旧路由残留。

面试怎么说：

动态路由注册前会先清理旧路由，再按当前用户权限重新添加，保证路由表和当前登录用户一致。

### redirectToLogin

位置：`router/index.js` 和 `request.js`

作用：

登录失效时跳回登录页。

输入：

当前路由信息。

输出：

跳转 `/login`，并保留原访问路径。

为什么这样写：

如果用户访问的是业务页，跳登录时带上 `redirect`。

登录成功后可以回到原页面。

如果本身就是 `/` 或 `/login`，就不保存 redirect。

这样可以避免无意义跳转和重复编码。

面试怎么说：

我在登录失效时保留用户原本访问的业务路径，登录后可以自动回去。同时对 `/` 和 `/login` 做了特殊处理，避免 redirect 出现重复编码。

## 5. 数据流转

登录数据流：

用户输入账号密码 -> `formData` 保存 -> `t-form` 校验 -> 密码加密 -> `accountStore.login()` -> `/web/login` -> 拆出 `accountId` 和 `token` -> Pinia 持久化 -> `/web/loginInfo` -> 标准化用户信息 -> 保存到 `accountInfo` 和派生字段 -> 跳转业务页面

权限数据流：

路由守卫检测 token -> `getLoginInfo()` 恢复用户信息 -> `fetchPermissionInfo()` 请求 `/web/role/getPermission` -> `setPermissionInfo()` 标准化权限 -> `menuList` 生成动态路由 -> `asyncRoute` 更新菜单 -> `ruleNames` 和 `dialogNames` 控制按钮

请求鉴权流：

业务页面发请求 -> `request.js` 请求拦截器读取 `accountStore.token` -> 写入 `AUTHORIZATION` 和 `AUTHORIZATIONID` -> 接口返回 401/403 -> 清理登录态 -> 跳回登录页

页面展示流：

权限接口数据 -> `menuList` -> `createAsyncRoutes()` 匹配本地路由 -> `addRoutes()` 注册路由 -> `asyncRoute` 更新 -> `Layout.vue` 的 `menuRoutes` 重新计算 -> 侧边栏展示当前用户可访问菜单

## 6. 技术亮点

### 亮点一：登录状态统一放在 Pinia

代码中怎么体现：

`account.js` 统一保存 `token`、`accountId`、`accountInfo` 和部门相关字段。

`persist.pick` 只持久化登录后需要保留的字段。

解决了什么问题：

避免 token、用户信息散落在页面、请求工具、路由守卫中。

刷新页面后，基础登录态还能恢复。

面试表达：

我把登录状态统一放在 Pinia，而不是放在登录页组件里。请求拦截器、路由守卫、Layout、业务表单都能从同一个 Store 读取当前用户。

### 亮点二：登录提交前做密码二次处理

代码中怎么体现：

`login.vue` 里先对密码做 SHA1，再拼接 salt 做 MD5。

解决了什么问题：

前端不会直接把用户输入的明文密码交给接口。

面试表达：

提交登录前，我会先对密码做固定规则处理，再交给登录接口。页面层只处理提交前转换，具体登录态保存仍然交给 Store。

### 亮点三：请求层统一处理鉴权

代码中怎么体现：

`request.js` 的请求拦截器统一注入 `AUTHORIZATION`、`AUTHORIZATIONID`、`ACCOUNT_SOURCE`。

`AUTH_FREE_URLS` 把登录接口和验证码接口排除。

解决了什么问题：

业务页面不需要重复写 token 请求头。

未登录时也不会继续发业务请求。

面试表达：

我把 token 注入和登录失效处理放到请求封装层，这样所有接口都走同一套鉴权规则。

### 亮点四：路由守卫负责恢复登录上下文

代码中怎么体现：

`router.beforeEach()` 中先判断 token。

有 token 时，先拉用户信息，再拉权限，再注册动态路由。

解决了什么问题：

刷新页面后，Pinia 内存状态会重新初始化。

路由守卫可以重新拉取用户信息和权限，保证菜单和页面权限正常恢复。

面试表达：

路由守卫不只是判断能不能进页面，还负责恢复登录上下文。刷新后它会重新拉用户信息和权限，再注册动态路由。

### 亮点五：权限数据按使用场景拆分

代码中怎么体现：

`permission-state.js` 把后端权限拆成 `menuCodes`、`ruleNames`、`dialogNames`。

解决了什么问题：

菜单权限、页面按钮权限、弹窗按钮权限使用场景不同。

拆开后页面判断更清楚。

面试表达：

我没有让页面直接遍历后端权限树，而是先在 Store 层拆成三类权限。菜单看 `menuCodes`，页面按钮看 `ruleNames`，弹窗按钮看 `dialogNames`。

### 亮点六：动态路由由后端菜单和前端路由共同决定

代码中怎么体现：

`createAsyncRoutes()` 用后端 `vueUrl` 匹配前端 `allRoutes`。

匹配成功后才注册路由。

解决了什么问题：

后端决定用户拥有什么菜单。

前端仍然控制真实组件和路由结构。

面试表达：

动态路由不是完全由后端下发组件路径，而是后端给菜单路径，前端用本地路由表匹配。这样权限灵活，同时前端代码也更可控。

### 亮点七：按钮权限抽成指令

代码中怎么体现：

`v-permission` 默认读取 `ruleNames`。

`v-permission:dialog` 读取 `dialogNames`。

`v-permission:menu` 读取 `menuCodes`。

解决了什么问题：

页面不用反复写权限判断函数。

权限变化时，指令内部的 `watch` 会重新更新显示状态。

面试表达：

按钮权限我抽成了 Vue 指令。页面只需要写权限 code，具体显示隐藏由指令统一处理。

### 亮点八：退出登录清理完整

代码中怎么体现：

`LayoutHeader.vue` 退出时先跳转 `/login`。

再调用 `resetAsyncRoutes()`、`permissionStore.resetPermission()`、`accountStore.logout()`。

解决了什么问题：

退出后不会保留旧菜单、旧按钮权限、旧 token。

面试表达：

退出登录时我会同时清 token、清权限、清动态路由。这样切换账号时不会出现上一个账号的菜单残留。

## 7. 可能被问到的问题

### Q1：为什么登录逻辑不直接写在页面里？

A：因为登录成功后很多地方都要用登录态。比如请求拦截器要用 token，路由守卫要判断是否登录，Layout 要显示用户信息，业务页面也要读取当前用户。所以我把登录状态放到 `accountStore` 统一管理。

### Q2：这个登录功能的数据流是怎样的？

A：用户输入账号密码后，页面先校验，再加密密码，然后调用 `accountStore.login()`。Store 调 `/web/login` 拿到账号 ID 和 token，再调 `/web/loginInfo` 获取用户详情。之后路由守卫拉权限，生成动态路由，最后 Layout 根据动态路由展示菜单。

### Q3：为什么要在登录后马上调用 `getLoginInfo(true)`？

A：登录接口只返回账号 ID 和 token，不够页面展示使用。登录后马上拉用户信息，可以拿到真实姓名、角色、部门、头像、COS 配置等数据，后续页面不用再单独请求。

### Q4：为什么 `getLoginInfo` 里要做 `normalizeAccountInfo`？

A：因为接口返回结构可能有多种情况，比如数据可能在 `res.data.accountInfo`，也可能在 `res.accountInfo` 或 `res.data`。先标准化，可以避免页面或 Store 写死某一种返回格式。

### Q5：为什么请求拦截器里要排除 `/web/login`？

A：登录接口本身就是用来获取 token 的。如果登录接口也要求 token，就会形成死循环。所以把 `/web/login` 放到 `AUTH_FREE_URLS`，表示它不需要登录态。

### Q6：为什么未登录时要在请求层直接取消业务请求？

A：因为没有 token 的业务请求一定会失败。提前取消可以减少无效请求，也能避免用户退出后页面组件继续发请求造成错误提示混乱。

### Q7：路由守卫为什么要重新拉权限？

A：Pinia 的内存状态刷新后会丢失。即使 token 持久化还在，菜单权限和动态路由也需要重新恢复。所以路由守卫在有 token 时会拉用户信息和权限，再注册路由。

### Q8：为什么动态路由要先清理再注册？

A：如果不清理旧动态路由，切换账号或权限变化后，旧账号的路由可能残留。先 `removeDynamicRoutes()`，再按当前权限注册，可以保证路由表和当前账号一致。

### Q9：为什么按钮权限要做成 `v-permission` 指令？

A：因为按钮权限在很多页面都会用。如果每个页面都写权限判断，会重复而且容易漏。抽成指令后，页面只写权限 code，显示隐藏统一处理。

### Q10：`computed` 在这个登录链路里怎么用？

A：`Layout.vue` 用 `computed` 从 `asyncRoute.value` 得到 `menuRoutes`，动态路由变化后菜单自动更新。`LayoutHeader.vue` 用 `computed` 从 `accountStore.accountInfo` 得到用户信息和头像。`App.vue` 用 `computed` 从登录用户真实姓名生成水印内容。

### Q11：`watch` 在这个登录链路里怎么用？

A：`App.vue` 监听 `accountStore.accountInfo`，用户信息变化后更新水印 key。`v-permission` 指令监听权限数组，权限加载完成或变化后，重新判断元素是否显示。

### Q12：这里有没有做防重复提交？

A：登录页本身没有单独定义 `loginLoading` 或禁用按钮状态。它依赖接口请求的 `loading` 参数触发全局 Loading。面试时可以如实说：当前登录链路已经有全局 loading，但如果继续优化，可以在登录页增加本地 `submitting` 状态，防止用户连续点击登录按钮。

### Q13：错误提示是在哪里处理的？

A：接口通用错误主要在 `request.js` 里处理。比如业务 code 不是 200，会根据 `show` 类型调用 warning、info 或 error。401 和 403 会统一清登录态并跳登录页。路由守卫里也会捕获登录状态异常，给出提示后重置状态。

### Q14：登录后菜单是怎么展示出来的？

A：登录后路由守卫会调用权限接口。权限 Store 得到 `menuList` 后，`permissionModel` 用菜单的 `vueUrl` 匹配前端路由，生成动态路由并更新 `asyncRoute`。Layout 的侧边栏绑定 `asyncRoute`，所以菜单会自动展示。

### Q15：这个功能里哪些地方体现了初始化逻辑和回显逻辑？

A：登录页初始化时，会根据 `accountStore.rememberLogin` 和 `persistLoginParams` 回显账号密码。登录成功后，`getLoginInfo(true)` 初始化用户信息。刷新页面时，路由守卫通过 token 重新初始化用户信息和权限。

## 8. 可用于面试或答辩的表达

我负责过后台系统的登录鉴权链路。

这个功能不是单纯调登录接口。

它包括登录表单、密码处理、登录态持久化、用户信息初始化、请求鉴权、权限加载、动态路由和按钮权限控制。

用户登录时，页面先通过 TDesign 表单做必填校验。

校验通过后，前端对密码做 SHA1 和 MD5 加盐处理。

然后调用 `accountStore.login()`。

Store 统一保存 token、账号 ID 和用户信息。

登录成功后，会立即调用 `/web/loginInfo` 获取当前用户详情。

这样顶部用户信息、水印、业务页面默认字段都能直接读取 Store。

请求层会统一注入 token 和账号 ID。

如果接口返回 401 或 403，请求层会清理登录态并跳回登录页。

路由层会根据 token 判断是否允许进入页面。

有 token 时，会重新拉用户信息和权限。

权限数据会被拆成菜单权限、页面按钮权限和弹窗按钮权限。

菜单权限用于生成动态路由。

按钮权限通过 `v-permission` 控制页面操作入口。

退出登录时，会同时清 token、清权限、清动态路由。

这样可以避免切换账号后出现旧菜单或旧按钮残留。

## 9. 一句话总结

这个登录功能本质上是通过 Pinia 统一管理登录态，通过请求拦截器统一处理鉴权，通过路由守卫和权限 Store 动态恢复菜单与按钮权限，把“登录、鉴权、权限展示、退出清理”这一整条后台访问流程规范化。

# UniApp 登录逻辑项目解析

## 1. 功能概述

这个登录功能主要解决移动端两类账号的登录问题。

第一类是普通员工。

第二类是临时工。

普通员工走 `/app/login`。

临时工走 `/temp/login`。

登录成功后，前端会统一保存 token、账号 ID、账号来源。

然后再根据 token 判断当前账号是不是临时工。

如果是普通员工，就拉取员工信息和后端权限。

如果是临时工，就拉取临时工信息，并设置固定的移动端菜单权限。

入口页面是 `travel-web/sites/uniapp/src/pages/login/login.vue`。

账号状态管理在 `travel-web/sites/uniapp/src/store/modules/account.js`。

token 解析在 `travel-web/sites/uniapp/src/store/modules/account-auth.js`。

用户信息标准化在 `travel-web/sites/uniapp/src/store/modules/account-normalize.js`。

请求封装在 `travel-web/sites/uniapp/src/utils/request.js`。

页面鉴权在 `travel-web/sites/uniapp/src/utils/auth-guard.js`。

权限菜单在 `travel-web/sites/uniapp/src/store/modules/permission.js`。

## 2. 核心业务流程

### 2.1 普通员工登录流程

1. 用户进入 `/pages/login/login`。
2. 默认登录类型是 `APP_LOGIN_TYPE`。
3. 用户输入账号和密码。
4. `accountInput` 把输入写到 `form.user`。
5. `passwordInput` 把输入写到 `form.pass`。
6. 点击登录时，先执行 `validateLoginForm()`。
7. 校验通过后，执行 `buildLoginSubmitPayload()`。
8. 密码先做 SHA1。
9. 再拼接固定 salt。
10. 最后做 MD5。
11. 调用 `accountStore.login()`。
12. Store 调用 `loginUniapp()`。
13. 接口请求 `/app/login`。
14. 返回 token 字符串。
15. `applyToken()` 拆分并保存 `AUTHORIZATIONID`、`AUTHORIZATION`、`ACCOUNT_SOURCE`。
16. 设置 `isLogin = true`。
17. 设置 `isTempWorker = false`。
18. 调用 `getSystemInfo(true)`。
19. `getSystemInfo()` 调用 `/app/loginInfo` 获取用户信息。
20. 普通员工会继续调用权限接口。
21. 权限 Store 保存菜单和按钮权限。
22. 登录页提示成功。
23. 调用 `wx.login()` 获取微信 code。
24. 普通员工场景下调用 `getWechatOpenid()`。
25. 最后 `switchTab` 到首页。

面试表达：

普通员工登录不是只拿 token。我在 token 保存后，会马上拉用户信息和权限信息。这样进入首页后，用户信息、菜单、按钮权限都已经准备好。

### 2.2 临时工登录流程

1. 用户切换到“临时工登录”。
2. `loginType` 变成 `TEMP_WORKER_LOGIN_TYPE`。
3. 账号输入框改为手机号输入。
4. 最大长度限制为 11 位。
5. `accountInput` 把输入写到 `form.phone`。
6. `passwordInput` 把输入写到 `form.password`。
7. 点击登录时，校验手机号和密码。
8. 密码同样做 SHA1 和 MD5 加盐。
9. 调用 `accountStore.loginTempWorker()`。
10. Store 调用 `loginTemp()`。
11. 接口请求 `/temp/login`。
12. 返回 token 字符串。
13. `applyToken()` 保存账号 ID、token 和账号来源。
14. 设置 `isLogin = true`。
15. 设置 `isTempWorker = true`。
16. 调用 `getSystemInfo(true)`。
17. `getSystemInfo()` 根据 token 中是否包含 `TEMP-` 判断临时工身份。
18. 临时工调用 `/temp/loginInfo`。
19. 临时工不拉完整权限树。
20. 调用 `permissionStore.setTempWorkerPermission()` 设置固定菜单。
21. 登录成功后跳转首页。

面试表达：

临时工登录和普通员工共用一个登录页，但接口、字段和权限初始化不同。我用 `loginType` 区分登录模式，用 computed 映射不同表单字段，提交时再按账号类型调用不同 Store action。

### 2.3 已登录自动跳转流程

1. 登录页 `onLoad()` 执行。
2. 先根据 query 解析登录类型。
3. 如果 query 里有手机号，就回填到 `form.phone`。
4. 如果本地已经有 `AUTHORIZATION`。
5. 说明已有登录态。
6. 直接调用 `redirectToHome()`。
7. 跳到首页。

面试表达：

登录页初始化时会判断本地 token。如果用户已经登录，就不重复停留在登录页，直接进入首页。

## 3. 核心代码模块

### 3.1 登录页面模块

文件：`travel-web/sites/uniapp/src/pages/login/login.vue`

作用：

负责登录模式切换、表单输入、表单校验、密码加密和提交。

关键逻辑：

`APP_LOGIN_TYPE` 表示普通员工登录。

`TEMP_WORKER_LOGIN_TYPE` 表示临时工登录。

`LOGIN_COPY_BY_TYPE` 抽离不同登录模式的输入提示和按钮文案。

`form` 同时保存两套字段。

普通员工使用 `user` 和 `pass`。

临时工使用 `phone` 和 `password`。

页面没有写两套表单。

它用 `accountInput` 和 `passwordInput` 两个 computed 做字段映射。

当前是临时工登录时，输入写入 `form.phone` 和 `form.password`。

当前是普通员工登录时，输入写入 `form.user` 和 `form.pass`。

面试表达：

登录页支持普通员工和临时工两种模式，但没有复制两套输入框。我用 computed 把同一个输入框映射到不同表单字段，保证模板简单，提交逻辑也清楚。

### 3.2 登录表单校验模块

位置：`login.vue` 的 `validateLoginForm()`

作用：

根据登录类型校验不同字段。

关键逻辑：

临时工校验 `phone` 和 `password`。

普通员工校验 `user` 和 `pass`。

校验结果统一返回 `{ valid, message }`。

页面拿到结果后，只需要判断 `valid`。

面试表达：

我把校验规则按登录类型集中到 `validateLoginForm()`。它统一返回校验状态和错误文案，页面点击登录时不用写很多分散判断。

### 3.3 登录参数组装模块

位置：`login.vue` 的 `buildLoginSubmitPayload()`

作用：

根据登录类型组装接口参数。

关键逻辑：

普通员工提交 `{ user, pass }`。

临时工提交 `{ phone, password }`。

两个模式都会先调用 `normalizeLoginValue()` 去掉首尾空格。

两个模式都会对密码做 SHA1。

再拼接 `liangtong_travel_oa_salt`。

最后做 MD5。

面试表达：

接口参数没有直接从表单透传，而是经过统一组装。这样既能处理字段差异，也能保证密码加密规则一致。

### 3.4 账号 Store 模块

文件：`travel-web/sites/uniapp/src/store/modules/account.js`

作用：

统一管理登录态、用户信息、账号类型和登录后的初始化。

关键逻辑：

`login()` 处理普通员工登录。

`loginTempWorker()` 处理临时工登录。

`getSystemInfo()` 负责登录后获取用户信息。

`logout()` 负责退出登录清理。

Store 中保存了：

`loginInfo`：接口原始用户信息。

`accountInfo`：标准化后的用户信息。

`isLogin`：是否登录。

`isTempWorker`：是否临时工。

`accountRealName`、`accountRoleName`、`accountDepartmentName` 等派生字段。

`loading` 和 `lastPromise` 用来防止用户信息重复请求。

面试表达：

登录成功后的状态没有放在登录页，而是统一放在账号 Store。页面、权限、首页、个人中心都从这个 Store 读取当前用户身份和用户信息。

### 3.5 Token 工具模块

文件：`travel-web/sites/uniapp/src/store/modules/account-auth.js`

作用：

解析登录接口返回的 token，并判断是否临时工。

关键逻辑：

`parseLoginToken()` 用第一个点号拆分 token。

点号前面是 `accountId`。

点号后面是 `authToken`。

`buildStoredToken()` 返回标准结构。

`isTempWorkerAuthToken()` 判断 token 里是否包含 `TEMP-`。

面试表达：

登录接口返回的是组合 token，前端先拆出账号 ID 和真正的鉴权 token。临时工身份不是靠页面状态猜，而是通过 token 中的 `TEMP-` 标识判断。

### 3.6 用户信息标准化模块

文件：`travel-web/sites/uniapp/src/store/modules/account-normalize.js`

作用：

兼容不同接口返回结构，并提取常用用户字段。

关键逻辑：

`normalizeAccountInfoResponse()` 支持多种返回格式。

它会依次判断 `res.data.accountInfo`、`res.accountInfo`、`res.data` 和 `res`。

同时统一头像字段。

`avatarUrl`、`avatar`、`avator` 会互相兜底。

`deriveAccountFields()` 提取真实姓名、角色名、部门名、所属板块等字段。

面试表达：

我没有在页面里直接读取接口原始结构，而是先做标准化。这样不管接口把用户信息放在 `data.accountInfo` 还是 `data`，Store 都能得到统一的 `accountInfo`。

### 3.7 请求封装模块

文件：`travel-web/sites/uniapp/src/utils/request.js`

作用：

统一处理请求地址、请求头、参数过滤、loading、错误提示和登录失效跳转。

关键逻辑：

`AUTH_REDIRECT_EXEMPT_URLS` 维护免登录重定向接口。

包括 `/app/login`、`/temp/login`、验证码和临时工登记接口。

请求前读取本地 `AUTHORIZATION` 和 `AUTHORIZATIONID`。

如果存在，就写入 header。

同时统一写入 `ACCOUNT_SOURCE = app`。

请求参数会通过 `normalizeRequestBody()` 和 `filterParams()` 过滤 `null`、`undefined`。

如果接口返回 401 或 403，并且需要重定向，就调用 `redirectToLogin()`。

`redirectToLogin()` 会先调用 `accountStore.logout()`。

再 `reLaunch` 到登录页。

面试表达：

请求层统一注入 token 和账号 ID。业务页面不用手动传登录信息。遇到 401 或 403 时，请求层会统一清登录态并回到登录页。

### 3.8 页面鉴权模块

文件：`travel-web/sites/uniapp/src/utils/auth-guard.js`

作用：

拦截未登录用户访问受保护页面。

关键逻辑：

`PUBLIC_ROUTES` 保存公开页面。

登录页和临时工登记页不需要登录。

`installNavigationAuthGuards()` 会给 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 安装拦截器。

如果目标页面不是公开页面，并且没有 token，就重启到登录页。

`ensureCurrentPageAuth()` 用于 App 生命周期里检查当前页面。

面试表达：

uniapp 没有像 Vue Router 那样统一的前端路由守卫，所以我通过 `uni.addInterceptor` 拦截跳转方法，同时在 App 生命周期里检查当前页面，保证未登录用户不能进入业务页。

### 3.9 权限 Store 模块

文件：`travel-web/sites/uniapp/src/store/modules/permission.js`

作用：

登录后生成移动端业务菜单和按钮权限。

关键逻辑：

普通员工调用 `apiGetRolePermissionInfo()`。

返回的权限树会拆成：

`menuList`：移动端业务菜单。

`menuCodes`：菜单权限 code。

`ruleNames`：页面按钮权限 code。

`dialogNames`：弹窗权限 code。

临时工调用 `setTempWorkerPermission()`。

临时工菜单固定为审批和考勤。

面试表达：

普通员工菜单来自后端权限树，临时工菜单走固定配置。这样既支持正式员工按角色授权，也能让临时工只看到移动端允许的功能。

### 3.10 业务菜单展示模块

文件：`travel-web/sites/uniapp/src/pages/business/index.vue`

作用：

登录后根据权限 Store 展示业务菜单。

关键逻辑：

`menuItems` 是 computed。

它从 `permissionStore.menuList` 派生菜单展示数据。

再合并本地的图标和颜色。

点击菜单时，如果是临时工管理弹窗，就打开弹窗。

普通菜单则 `uni.navigateTo()`。

面试表达：

业务菜单不是页面写死的，而是从权限 Store 派生出来。后端权限决定用户能看到哪些业务，本地配置负责图标和展示样式。

## 4. 关键函数解析

### accountInput

位置：`login.vue`

作用：

把同一个账号输入框映射到不同字段。

输入：

用户输入内容。

输出：

普通员工写入 `form.user`。

临时工写入 `form.phone`。

为什么这样写：

两个登录模式共用同一套 UI。

但接口字段不一样。

用 computed 的 getter 和 setter 做字段分发，可以避免复制两套模板。

面试怎么说：

我用 computed 做双向绑定代理。当前是临时工登录时，输入框绑定手机号；当前是普通员工登录时，绑定账号。

### passwordInput

作用：

把同一个密码输入框映射到不同密码字段。

输入：

用户输入的密码。

输出：

普通员工写入 `form.pass`。

临时工写入 `form.password`。

为什么这样写：

普通员工和临时工接口字段不同。

但页面展示上都是密码输入框。

用 computed 可以让模板只保留一个输入框。

面试怎么说：

密码输入也是同样思路。模板只写一个输入框，字段差异放在 computed 里处理。

### validateLoginForm

作用：

校验当前登录模式需要的字段。

输入：

`currentLoginType` 和 `formData`。

输出：

`{ valid, message }`。

为什么这样写：

普通员工和临时工校验字段不一样。

统一返回对象后，调用方只需要按一个格式处理结果。

面试怎么说：

我把校验函数做成和登录类型相关。临时工检查手机号和密码，普通员工检查账号和密码。

### buildLoginSubmitPayload

作用：

生成真正提交给接口的参数。

输入：

登录类型和表单数据。

输出：

普通员工输出 `{ user, pass }`。

临时工输出 `{ phone, password }`。

为什么这样写：

接口字段不同。

密码处理规则相同。

所以在一个函数里同时处理字段映射和密码加密。

面试怎么说：

提交参数不是直接从 form 传出去，而是先清洗字段、加密密码，再根据登录类型输出不同接口需要的数据结构。

### handleLogin

作用：

处理点击登录的主流程。

输入：

当前表单状态。

输出：

登录成功后跳转首页。

为什么这样写：

先校验。

再设置 `loading`。

然后构建提交参数。

再按登录类型调用不同 Store action。

最后提示成功并跳首页。

异常时统一 toast。

`finally` 里关闭 loading。

面试怎么说：

登录主流程分成校验、组装参数、调用 Store、成功跳转、失败提示几个步骤。按钮用 `loading` 禁用，防止重复提交。

### applyToken

位置：`account.js`

作用：

保存登录接口返回的 token。

输入：

接口 token 和账号来源。

输出：

写入 `AUTHORIZATIONID`、`AUTHORIZATION`、`ACCOUNT_SOURCE`。

为什么这样写：

接口返回的 token 里同时包含账号 ID 和鉴权 token。

请求层需要分别使用。

所以登录后先统一拆分并保存。

面试怎么说：

我没有把接口返回的 token 原样到处传，而是登录成功后统一拆分。账号 ID 和鉴权 token 分别存储，后续请求拦截器统一读取。

### login

位置：`account.js`

作用：

处理普通员工登录。

输入：

普通员工登录参数。

输出：

保存 token，获取用户信息，恢复车辆定位。

为什么这样写：

普通员工登录后不仅要进系统。

还需要用户信息、权限菜单和可能的车辆定位恢复。

所以登录后依次调用 `getSystemInfo(true)` 和 `resumeVehicleLocation()`。

面试怎么说：

普通员工登录成功后，我会立即拉用户信息和权限。如果之前有车辆使用状态，还会尝试恢复车辆定位。

### loginTempWorker

位置：`account.js`

作用：

处理临时工登录。

输入：

手机号和密码。

输出：

保存 token，获取临时工信息，设置临时工身份。

为什么这样写：

临时工接口独立。

权限也不是完整后端权限树。

所以登录后只调用 `getSystemInfo(true)`，里面会根据 token 判断并设置临时工菜单。

面试怎么说：

临时工登录和普通员工登录分开处理。临时工只拿移动端需要的信息和固定菜单，不走正式员工完整权限树。

### getSystemInfo

位置：`account.js`

作用：

获取当前登录用户的信息和权限。

输入：

`reload`。

输出：

更新账号信息、账号类型、派生字段和权限。

为什么这样写：

它先判断是否正在 loading。

如果正在请求，就复用 `lastPromise`。

如果已有 `accountInfo.id` 且不需要 reload，就直接返回缓存。

否则读取本地 token。

通过 `isTempWorkerAuthToken()` 判断身份。

普通员工调用 `getLoginInfoUniapp()`。

临时工调用 `loginTempInfo()`。

面试怎么说：

`getSystemInfo` 是登录后恢复上下文的核心函数。它既能避免重复请求，又能根据 token 自动区分正式员工和临时工，分别拉不同接口。

### normalizeAccountInfoResponse

作用：

统一不同接口的用户信息格式。

输入：

接口返回值。

输出：

标准化后的 `accountInfo`。

为什么这样写：

不同接口返回结构不完全一致。

用户信息可能在 `data.accountInfo`、`accountInfo`、`data` 或根对象上。

头像字段也可能是 `avatarUrl`、`avatar`、`avator`。

面试怎么说：

我对登录信息做了标准化处理。这样页面不用关心接口返回结构差异，只读取统一的 `accountInfo`。

### deriveAccountFields

作用：

从用户信息里提取常用展示字段。

输入：

标准化后的 `accountInfo`。

输出：

真实姓名、角色名、部门 ID、部门名称、所属板块等。

为什么这样写：

页面经常需要这些字段。

如果每个页面都从深层对象里取，会重复而且容易空值报错。

面试怎么说：

我把用户常用字段在 Store 层提前派生出来。页面只读 `accountRealName`、`accountDepartmentName` 这类扁平字段。

### request

位置：`utils/request.js`

作用：

统一发送接口请求。

输入：

请求配置。

输出：

成功返回 `responseData.data`，失败 reject。

为什么这样写：

请求前统一加 token 和账号 ID。

请求体统一过滤空参数。

接口返回 401/403 时统一跳登录。

面试怎么说：

请求封装层承担了移动端鉴权。登录态、请求头、loading、错误提示、登录过期跳转都在这里统一处理。

### installNavigationAuthGuards

位置：`auth-guard.js`

作用：

安装页面跳转拦截器。

输入：

uni 实例。

输出：

给 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 加上登录校验。

为什么这样写：

UniApp 没有统一的 Vue Router beforeEach。

所以通过 `uni.addInterceptor` 拦截跳转。

面试怎么说：

我用 uni 的拦截器实现移动端路由守卫。只要跳转到非公开页面，就先检查本地 token，没有 token 就回登录页。

## 5. 数据流转

### 5.1 普通员工登录数据流

账号密码输入 -> `accountInput` / `passwordInput` 写入 `form.user` / `form.pass` -> `validateLoginForm()` 校验 -> `buildLoginSubmitPayload()` 清洗和加密 -> `accountStore.login()` -> `/app/login` -> `applyToken()` 保存 `AUTHORIZATIONID` 和 `AUTHORIZATION` -> `/app/loginInfo` -> `normalizeAccountInfoResponse()` 标准化 -> `deriveAccountFields()` 派生字段 -> `permissionStore.fetchPermissionInfo(true)` 拉权限 -> 首页和业务菜单读取 Store 展示

### 5.2 临时工登录数据流

手机号密码输入 -> computed 写入 `form.phone` / `form.password` -> 校验手机号和密码 -> 加密密码 -> `accountStore.loginTempWorker()` -> `/temp/login` -> 保存 token -> token 中包含 `TEMP-` -> `getSystemInfo()` 选择 `/temp/loginInfo` -> 标准化临时工信息 -> `permissionStore.setTempWorkerPermission()` 设置固定菜单 -> 跳转首页

### 5.3 请求鉴权数据流

业务接口调用 -> `request.js` 读取本地 `AUTHORIZATION` 和 `AUTHORIZATIONID` -> 写入请求头 -> 后端返回 200 -> 返回 `data` -> 后端返回 401/403 -> `errHandler()` -> `redirectToLogin()` -> `accountStore.logout()` -> 清 token、权限、定位 -> `reLaunch('/pages/login/login')`

### 5.4 页面鉴权数据流

应用启动 -> `main.js` 调用 `installNavigationAuthGuards()` -> 用户跳转页面 -> 拦截器判断目标路由 -> 公开页面放行 -> 非公开页面检查 token -> 没 token 则跳登录 -> `App.vue` 生命周期里再调用 `ensureCurrentPageAuth()` 兜底检查当前页

### 5.5 登录后菜单展示流

普通员工权限接口 -> `permissionStore.setPermissionInfo()` -> `menuList` / `menuCodes` / `ruleNames` / `dialogNames` -> `business/index.vue` 的 `menuItems` computed 合并图标和颜色 -> 页面展示业务菜单 -> `PermissionView` 控制按钮和模块显示

## 6. 技术亮点

### 亮点一：一个登录页支持两类账号

代码中怎么体现：

`loginType` 控制当前登录模式。

`APP_LOGIN_TYPE` 和 `TEMP_WORKER_LOGIN_TYPE` 抽成常量。

`LOGIN_COPY_BY_TYPE` 抽离文案。

解决了什么问题：

普通员工和临时工不用各写一个登录页。

界面和交互复用，接口字段差异在逻辑里处理。

面试表达：

我用一个登录页支持普通员工和临时工登录。页面通过 `loginType` 切换模式，文案、字段和接口都根据模式变化。

### 亮点二：computed 做双向字段映射

代码中怎么体现：

`accountInput` 和 `passwordInput` 都是 computed。

它们有 getter 和 setter。

解决了什么问题：

同一个输入框可以绑定不同字段。

不用复制模板。

面试表达：

我用 computed 做输入字段代理。普通员工输入写入账号字段，临时工输入写入手机号字段，但模板只保留一套输入框。

### 亮点三：登录参数集中构造

代码中怎么体现：

`buildLoginSubmitPayload()` 统一处理字段映射、trim 和密码加密。

解决了什么问题：

提交接口前的数据处理集中。

不同登录模式的参数结构也清楚。

面试表达：

提交前我会先构造 payload。这里同时处理字段差异和密码加密，避免页面直接把原始表单传给接口。

### 亮点四：token 拆分和身份识别独立封装

代码中怎么体现：

`account-auth.js` 提供 `parseLoginToken()`、`buildStoredToken()`、`isTempWorkerAuthToken()`。

解决了什么问题：

token 解析规则不会散落在 Store、请求层和页面里。

临时工判断也有统一入口。

面试表达：

我把 token 解析抽成工具函数。登录接口返回的组合 token 会被拆成账号 ID 和鉴权 token，临时工身份通过 token 中的 `TEMP-` 标识判断。

### 亮点五：用户信息标准化

代码中怎么体现：

`normalizeAccountInfoResponse()` 兼容多种接口返回结构。

`deriveAccountFields()` 派生常用字段。

解决了什么问题：

正式员工和临时工接口结构可能不同。

页面不用关心这些差异。

面试表达：

我在 Store 层把用户信息标准化。页面只使用统一后的 `accountInfo` 和派生字段，不直接依赖接口原始结构。

### 亮点六：普通员工和临时工权限初始化分流

代码中怎么体现：

`getSystemInfo()` 里通过 `isTempWorkerAuthToken()` 判断身份。

普通员工调用 `permissionStore.fetchPermissionInfo(true)`。

临时工调用 `permissionStore.setTempWorkerPermission()`。

解决了什么问题：

普通员工按角色权限控制。

临时工只开放固定移动端功能。

面试表达：

我没有让临时工也去拉完整权限树。普通员工走后端权限，临时工走固定菜单配置，保证权限边界更清楚。

### 亮点七：请求层统一处理登录失效

代码中怎么体现：

`request.js` 里 401/403 会进入 `errHandler()`。

然后调用 `redirectToLogin()`。

`redirectToLogin()` 会先 `logout()`，再 `reLaunch` 到登录页。

解决了什么问题：

业务页面不用重复写登录过期处理。

token 失效后状态能统一清理。

面试表达：

登录失效不是在每个页面单独处理，而是在请求封装层统一处理。这样只要接口返回 401 或 403，就会清登录态并回到登录页。

### 亮点八：UniApp 跳转鉴权拦截

代码中怎么体现：

`main.js` 启动时调用 `installNavigationAuthGuards()`。

`auth-guard.js` 拦截 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab`。

解决了什么问题：

未登录用户不能通过手动跳转进入业务页。

面试表达：

UniApp 没有标准 Vue Router 守卫，所以我用 `uni.addInterceptor` 做跳转鉴权，所有页面跳转都会先检查 token。

### 亮点九：权限菜单和本地展示配置分离

代码中怎么体现：

`permissionStore.menuList` 决定有哪些菜单。

`business/index.vue` 再合并本地图标和颜色。

解决了什么问题：

权限来自后端。

展示样式留在前端。

面试表达：

菜单权限和 UI 展示分开处理。后端决定用户能看什么，前端负责图标、颜色和跳转表现。

### 亮点十：退出登录清理完整

代码中怎么体现：

`logout()` 会停止定位上报。

清空定位对象。

移除 `AUTHORIZATION`、`AUTHORIZATIONID`、`ACCOUNT_SOURCE`。

重置权限 Store。

重置账号状态。

解决了什么问题：

退出后不会继续带旧 token 请求。

也不会继续上报定位。

面试表达：

退出登录时我不仅清 token，还会停止定位、清权限、清账号信息，避免旧账号状态残留。

## 7. 可能被问到的问题

### Q1：为什么普通员工和临时工共用一个登录页？

A：它们页面结构基本一致，只是账号字段、接口和权限初始化不同。共用页面可以减少重复代码，差异通过 `loginType` 和 computed 处理。

### Q2：普通员工和临时工的字段有什么区别？

A：普通员工提交 `user` 和 `pass`。临时工提交 `phone` 和 `password`。页面用 `accountInput` 和 `passwordInput` 做字段映射。

### Q3：为什么要用 computed 做输入框绑定？

A：因为模板只有一个账号输入框和一个密码输入框，但不同登录类型要写入不同字段。computed 的 getter 和 setter 可以把同一个输入框映射到不同字段。

### Q4：密码是怎么处理的？

A：提交前先 trim，再做 SHA1，然后拼接固定 salt，最后做 MD5。普通员工和临时工都走同一套加密规则。

### Q5：登录接口返回 token 后怎么保存？

A：先用 `parseLoginToken()` 按点号拆成账号 ID 和鉴权 token，再保存到 `AUTHORIZATIONID` 和 `AUTHORIZATION`。同时写入 `ACCOUNT_SOURCE = app`。

### Q6：怎么判断当前账号是不是临时工？

A：通过 `isTempWorkerAuthToken()` 判断本地 token 是否包含 `TEMP-` 标识。如果包含，就走临时工信息接口和临时工菜单。

### Q7：为什么登录后还要调用 `getSystemInfo()`？

A：登录接口只负责拿 token。页面还需要用户姓名、部门、角色、权限菜单等信息，所以登录后要继续拉用户信息并初始化权限。

### Q8：普通员工和临时工获取用户信息的接口一样吗？

A：不一样。普通员工调用 `/app/loginInfo`，临时工调用 `/temp/loginInfo`。`getSystemInfo()` 会根据 token 自动选择接口。

### Q9：权限是怎么初始化的？

A：普通员工调用 `permissionStore.fetchPermissionInfo(true)` 拉后端权限树。临时工调用 `setTempWorkerPermission()` 设置固定菜单。

### Q10：登录后菜单怎么展示？

A：权限 Store 生成 `menuList`。业务菜单页用 computed 从 `permissionStore.menuList` 派生展示数据，再合并本地图标和颜色。

### Q11：请求接口时 token 是怎么带上的？

A：`request.js` 每次请求前读取 `AUTHORIZATION` 和 `AUTHORIZATIONID`，放到请求 header。业务页面不用自己传。

### Q12：登录过期怎么处理？

A：请求层判断返回码。如果是 401 或 403，就提示登录状态过期，调用 `accountStore.logout()` 清状态，再 `reLaunch` 到登录页。

### Q13：哪些接口不会触发未授权跳登录？

A：登录接口、临时工登录接口、验证码接口、临时工登记接口在 `AUTH_REDIRECT_EXEMPT_URLS` 中，不会因为没有 token 跳登录。

### Q14：UniApp 里怎么做页面守卫？

A：用 `uni.addInterceptor` 拦截 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab`。如果目标不是公开页面且没有 token，就跳登录。

### Q15：App 启动时怎么恢复登录状态？

A：`App.vue` 的 `onLaunch()` 会先检查当前页面鉴权和 token。如果有 token，就调用 `accountStore.getSystemInfo(true)` 重新拉用户信息。

### Q16：为什么 `getSystemInfo()` 要用 `loading` 和 `lastPromise`？

A：防止多个页面或生命周期同时触发用户信息请求。如果已经在请求中，直接复用同一个 Promise，避免重复接口调用。

### Q17：临时工为什么不拉完整权限树？

A：临时工只允许使用移动端固定功能，比如审批和考勤。直接设置固定菜单更清晰，也避免临时工拿到不该有的 PC 权限结构。

### Q18：退出登录做了哪些事？

A：停止定位上报，清空定位对象，移除 token 和账号 ID，重置权限 Store，重置账号信息。

## 8. 可用于面试或答辩的表达

我负责的是 UniApp 端的登录鉴权链路。

这个登录页支持普通员工和临时工两种账号。

普通员工走 `/app/login`。

临时工走 `/temp/login`。

页面层通过 `loginType` 控制当前登录模式。

账号和密码输入框没有写两套。

我用 computed 的 getter 和 setter，把同一个输入框映射到不同字段。

普通员工写入 `user` 和 `pass`。

临时工写入 `phone` 和 `password`。

提交前会先做表单校验。

再统一清洗字段和加密密码。

密码处理是 SHA1 后拼接 salt，再做 MD5。

登录成功后，Store 会拆分接口返回的 token。

点号前面是账号 ID。

点号后面是鉴权 token。

它们分别保存到 `AUTHORIZATIONID` 和 `AUTHORIZATION`。

之后通过 token 里是否包含 `TEMP-` 判断是不是临时工。

普通员工会调用 `/app/loginInfo`，并拉取后端权限树。

临时工会调用 `/temp/loginInfo`，然后设置固定移动端菜单。

请求层会统一读取本地 token 并写入 header。

如果接口返回 401 或 403，请求层会统一退出登录并回到登录页。

页面跳转鉴权通过 `uni.addInterceptor` 实现。

它会拦截 `navigateTo`、`redirectTo`、`reLaunch` 和 `switchTab`。

没有 token 时，不能进入非公开页面。

这套逻辑把登录、身份识别、用户信息恢复、权限菜单初始化、请求鉴权和退出清理串成了一条完整链路。

## 9. 一句话总结

这个登录功能本质上是通过 `loginType` 区分普通员工和临时工，通过 Store 统一管理 token 和用户信息，通过请求封装和导航拦截统一处理鉴权，把移动端登录、身份分流、权限初始化和登录失效处理规范化。
