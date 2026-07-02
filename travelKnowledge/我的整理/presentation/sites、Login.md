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
