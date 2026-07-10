分析对象：

- `travel-web/sites/web/src/utils/request.js`
- `travel-web/sites/web/src/main.js`
- `travel-web/packages/api/src/config.js`
- `travel-web/packages/api/src/apis/**`
- `travel-web/sites/web/src/store/modules/account.js`
- `travel-web/sites/web/src/router/index.js`
- `travel-web/sites/web/src/router/model/permissionModel.js`

分析方法：`$vue-components-communication`

---

 ## 一、先说结论

`request.js` 不是 Vue 页面组件，也不是普通的 API 文件。

它属于项目级的 **services / 请求运行时适配层**，负责把下面几类节点串起来：

```text
页面组件 / store
-> packages/api 业务接口
-> RequestClient 运行时桥
-> web request.js
-> axios / 后端 API
-> account store / router / TDesign 全局反馈
```

按 `$vue-components-communication` 的判断方式，这里传递的不只是数据，还包含四类内容：

1. **值**：请求参数、token、accountId、后端返回数据。
2. **动作**：发起请求、退出登录、重置路由、跳转登录页。
3. **控制权**：通过 `setRequestClient(requestFn)` 把 web 请求实现注册给共享 API 包。
4. **共享状态**：`accountStore` 持有的登录态，以及 `request.js` 自己持有的全局 loading 计数。

所以分析这个文件时，不应该只逐行解释 axios，而应该先回答：

- 状态被谁持有？
- 请求由谁触发？
- 参数传给谁？
- 成功结果如何回流？
- 登录失效后谁清状态、谁改路由、谁让页面重渲染？

---

## 二、节点职责表

| 节点                               | 类型判断                 | 持有的状态 / 能力                   | 接收什么                       | 发出什么                       |
| -------------------------------- | -------------------- | ---------------------------- | -------------------------- | -------------------------- |
| 页面组件 / 页面 store                  | 页面组件、容器组件或业务状态层      | 表单、筛选条件、页面 loading 等业务状态     | 用户输入、路由参数                  | 调用具体 API 方法                |
| `packages/api/src/apis/**`       | 业务 API 描述层           | 不持有登录态                       | `data`、`params`、`loading`  | `RequestClient(config)`    |
| `packages/api/src/config.js`     | 运行时桥接层               | 当前 `RequestClient` 函数引用      | `setRequestClient(client)` | 把请求配置交给已注册客户端              |
| `sites/web/src/utils/request.js` | web services / 请求适配层 | axios 实例、loadingCount、错误处理规则 | axios config               | 后端请求、统一结果或统一错误             |
| `account store`                  | 跨页面共享状态持有者           | `token`、`accountId`、用户资料     | 登录接口结果                     | 给请求层提供鉴权数据                 |
| `router` / `permissionModel`     | 路由与权限运行时             | 当前路由、动态路由表                   | 鉴权失败动作                     | 清路由、跳登录页                   |
| TDesign 插件                       | 全局展示反馈层              | Loading、Message UI           | 提示文案、开关动作                  | 全局 loading 或消息提示           |
| 后端 API                           | 外部服务节点               | 服务端业务数据与鉴权结果                 | headers、params、data        | `code`、`data`、`msg`、`show` |

### 组件层为什么不直接处理这些逻辑

页面组件只应该表达业务意图，例如：

```js
await apiFormBase(formData, true)
```

页面不应该重复负责：

- 每次手动读取 token。
- 每次手动拼公共请求头。
- 每次分别处理 401、403、500 和超时。
- 每个页面自己实现全局 loading 计数。
- 每个页面自己决定如何清登录态和动态路由。

这些规则跨页面、跨模块复用，因此应该集中在 `request.js`、store 和 router 中。

---

## 三、真实状态归属

| 状态 | 真实持有者 | 使用者 | 状态类型 |
|---|---|---|---|
| `token` | `accountStore` | 请求拦截器、路由守卫 | 登录业务状态 |
| `accountId` | `accountStore` | 请求拦截器、业务页面 | 登录业务状态 |
| 用户资料 | `accountStore` | App 水印、页面、权限模块 | 跨页面共享状态 |
| `RequestClient` 函数引用 | `packages/api/src/config.js` | 所有共享 API 方法 | 运行时控制权 |
| axios 实例 `service` | `request.js` 模块 | `requestFn` | services 运行时能力 |
| `loadingCount` | `request.js` 模块 | `showLoading/hideLoading` | 全局短生命周期运行时状态 |
| 动态路由集合 | `permissionModel.js` | router、退出登录流程 | 权限运行时状态 |
| 页面表单与筛选条件 | 具体页面 / 容器组件 | 页面子组件、API 调用 | 页面业务状态 |

### Storage 在这条链中的位置

web 端的 `request.js` 没有直接调用 `localStorage`。

真实链路是：

```text
Pinia persistedstate
-> 刷新后恢复 account store 的 token/accountId
-> request.js 每次请求前读取 accountStore
-> 写入请求头
```

因此：

- 请求时的直接读取点是 `accountStore`。
- Storage 是 Pinia 持久化插件背后的恢复介质。
- 不应把 `request.js` 说成“直接从 Storage 读取 token”。

---

## 四、五条关键通信链路

### 链路 1：应用启动与请求客户端注册

| 问题 | 答案 |
|---|---|
| 谁触发 | `main.js` 第一行导入 `@/utils/request.js` |
| 谁执行 | `request.js` 模块初始化 |
| 传递什么 | `requestFn` 请求能力 |
| 传给谁 | `setRequestClient(requestFn)` |
| 最终结果 | `packages/api` 中的 `RequestClient` 指向 web 实现 |

```text
main.js
-> import request.js
-> request.js 创建 axios 实例和拦截器
-> setRequestClient(requestFn)
-> config.js 保存 RequestClient 引用
```

这里传递的是 **运行时控制权**，不是 props、emit 或普通业务值。

### 链路 2：正常业务请求

```text
页面 / store 调用业务 API
-> API 函数组装 config
-> RequestClient(config)
-> requestFn(config)
-> service(config)
-> 请求拦截器补公共头
-> axios 请求后端
-> 响应拦截器判断业务 code
-> requestFn 返回 res.data.data
-> 页面 / store 更新自己的业务状态
-> Vue 响应式系统重新渲染
```

| 问题 | 答案 |
|---|---|
| 状态被谁持有 | 页面或 store 持有最终业务数据 |
| 方法被谁触发 | 页面事件、生命周期或 store action |
| 数据传给谁 | API 层 -> RequestClient -> requestFn -> 后端 |
| 改完怎么回流 | 后端数据返回页面/store，再触发组件重渲染 |

### 链路 3：请求头鉴权注入

```text
accountStore 持有 token/accountId
-> axios 请求拦截器读取
-> 写入 Authorization / AuthorizationId / ACCOUNT_SOURCE
-> 后端鉴权
```

这里的通信方式是 **store 到 services 的共享状态读取**。

它不是 `props`，因为 request.js 不在组件树里；也不是 `provide/inject`，因为登录态需要跨路由和跨模块使用。

### 链路 4：401 / 403 登录失效回流

当前代码意图是：

```text
后端返回 401/403
-> 响应拦截器识别
-> accountStore.logout()
-> resetAsyncRoutes(router)
-> router.push('/login?redirect=...')
-> 依赖 store/router 的 UI 重新渲染
```

这条链里：

- 后端负责报告鉴权失败。
- `request.js` 负责统一编排副作用。
- `accountStore` 负责清空登录态真值。
- router 负责访问入口切换。
- 页面组件不应该各自重复写一遍退出逻辑。

### 链路 5：并发请求的全局 Loading

```text
请求 A loading=true -> loadingCount 0→1 -> 打开 Loading
请求 B loading=true -> loadingCount 1→2 -> 保持 Loading
请求 A 完成 -> loadingCount 2→1 -> 不关闭
请求 B 完成 -> loadingCount 1→0 -> 关闭 Loading
```

`loadingCount` 是 `request.js` 自己持有的运行时状态，因为它只服务于整个请求系统的并发协调，不属于某个页面组件。

`finally` 保证请求成功或失败后都会执行关闭逻辑。

---

## 五、request.js 内部职责拆解

### 1. 常量和协议

- `VITE_BASE_URL`：后端基础地址。
- `VITE_API_DELAY`：开发或演示用延迟。
- `AUTH_ERROR_MESSAGES`：鉴权错误文案。
- `AUTH_FREE_URLS`：免登录接口集合。
- `ShowEnum`：后端控制前端提示方式的协议。

### 2. 纯判断函数

- `getRequestUrl`
- `isAuthFreeRequest`
- `isBinaryResponse`
- `isAuthError`
- `isServerError`
- `isNetworkTimeoutError`

这类函数适合保持纯函数：输入一个值，只返回判断结果，不直接改 store、router 或 UI。

### 3. 有副作用的协调函数

- `redirectToLogin`：清账号状态、清动态路由、跳登录页。
- `showMessageByType`：触发全局消息。
- `showLoading/hideLoading`：修改 loadingCount 并控制全局 Loading。

判断一个函数是否应该放进这一层，可以问：

> 它是否会修改全局状态、路由、Storage 或 UI？

如果答案是“会”，就要在文档中明确写出它的影响范围和回流点。

### 4. axios 请求拦截器

职责应该集中为：

1. 判断请求现在能不能发。
2. 读取登录态。
3. 写入公共 headers。
4. 返回 config，交给 axios 继续执行。

### 5. axios 响应拦截器

职责是把多种后端/网络结果归一化：

- 二进制响应直接返回完整 response。
- `code === 200` 视为业务成功。
- 401/403 触发登录失效流程。
- 500 使用统一服务端异常文案。
- 超时、断网、其他业务错误统一转换为 Error。
- 使用 `messageShown/authMessageShown` 避免上层重复提示。

### 6. 对外请求入口 `requestFn`

`requestFn` 是整个文件对外暴露的唯一主入口，负责外围编排：

```text
读取 config.loading
-> 必要时打开 Loading
-> 必要时延迟
-> 调用 axios service
-> 普通请求返回业务 data
-> 二进制请求返回完整 response
-> finally 关闭 Loading
```

它不应该继续堆入大量具体业务页面逻辑。

---

## 六、通信方式为什么这样选

| 场景 | 选择 | 原因 |
|---|---|---|
| 页面把请求参数交给 API | 普通函数参数 | 这是一次性的值传递 |
| API 调用请求层 | `RequestClient(config)` | API 层只描述请求，不依赖 axios |
| web 端提供真实请求实现 | `setRequestClient(requestFn)` | 传递的是运行时能力和控制权 |
| request.js 读取登录态 | Pinia store | token/accountId 跨页面、跨模块共享 |
| 请求结果回到页面 | Promise return / reject | 调用者继续更新自己的业务状态 |
| 鉴权失败清状态 | store action + router action | 这是跨模块副作用编排 |
| 全局 Loading | services 模块级计数 | 多个请求需要共享并发状态 |

### 为什么不用 `props / emit / v-model`

因为 `request.js` 不属于 Vue 组件树。

- `props` 适合父组件向子组件传值。
- `emit` 适合子组件向父组件表达动作。
- `v-model` 适合父持有、子编辑的组件值回流。

而当前问题是跨页面的请求能力、登录态和运行时副作用，因此应使用：

- 函数调用。
- Promise 回流。
- store 共享状态。
- 模块级依赖注入。
- router 和 UI 插件提供的全局能力。

---

## 七、当前代码需要优先确认的问题

### 阻断级：`isLoggedOutBusinessRequest` 被调用但没有定义

当前响应成功分支和失败分支都调用了：

```js
isLoggedOutBusinessRequest(...)
```

但文件内没有该函数定义，也没有对应 import。

这会导致普通响应进入拦截器后出现 `ReferenceError`，并可能在错误分支再次触发同一个未定义函数，从而掩盖原始响应。

同时，文件中已经存在但未被使用的：

```js
isAuthFreeRequest(config)
```

说明当前代码很可能缺少了原本计划放在请求拦截器中的“已退出登录请求拦截”判断。分析文档必须把“代码当前实际行为”和“作者设计意图”分开写。

### 必须确认：登录失效清理不完整且存在重复实现

`redirectToLogin()` 当前只处理：

- `accountStore.logout()`
- `resetAsyncRoutes(router)`
- 跳转登录页

但项目已有 `utils/authReset.js`，其中还会执行：

```js
permissionStore.resetPermission()
```

router 内部也有另一套 `resetAuthState()`。

这意味着退出清理规则散落在多个位置，可能出现 token 已清空，但权限 store 的菜单、按钮或 `loaded` 状态仍残留的情况。

### 必须确认：redirect 可能被重复编码

`request.js` 使用：

```js
encodeURIComponent(router.currentRoute.value.fullPath)
```

而 router 自己的 `redirectToLogin()` 明确把原始 `fullPath` 交给 vue-router 编码，以避免 `%252F` 这类双重编码。

两个入口的规则不一致，应该统一。

### 建议确认：分页结构修正放在全局请求层是否合适

当前代码通过 `optimizeCountSql` 判断分页对象，并原地修改：

- `pages`
- `size`
- `total`
- `current`

它解决了后端数字字符串问题，但也让全局基础请求层知道了某种分页实现细节。需要在项目约定中说明，或抽成名字明确的标准化函数。

---

## 八、可直接复制的分析书写框架

以后分析其他 `request.js`、service、store、router 或跨组件链路时，可以直接复制下面的 Markdown 骨架。

```md
# [文件名] 通信与职责分析

## 1. 一句话定位

`[文件名]` 属于 `[页面组件 / 容器组件 / 业务区块 / 展示组件 / store / services / Storage / API / runtime]`。

它的核心职责是：`[用一句话说明它连接了谁、解决了什么问题]`。

## 2. 分析范围

- 主文件：`[路径]`
- 上游触发者：`[路径或模块]`
- 下游执行者：`[路径或模块]`
- 状态持有者：`[store / page / Storage]`
- 副作用节点：`[router / message / loading / Storage]`

## 3. 节点分层表

| 节点 | 类型 | 持有什么 | 接收什么 | 发出什么 | 不该负责什么 |
|---|---|---|---|---|---|
| `[节点]` | `[类型]` | `[状态/能力]` | `[输入]` | `[输出/动作]` | `[边界]` |

## 4. 真实状态归属

| 状态 | 唯一真实持有者 | 谁读取 | 谁修改 | 生命周期 |
|---|---|---|---|---|
| `[状态]` | `[持有者]` | `[读取者]` | `[修改者]` | `[页面内/跨页面/持久化/runtime]` |

## 5. 关键链路

### 链路 A：[链路名]

1. `[谁]` 发起。
2. `[谁]` 处理。
3. `[数据/动作]` 传给 `[谁]`。
4. `[谁]` 更新真实状态。
5. `[页面/组件]` 因什么重新渲染。

简图：

`触发者 -> 执行者 -> 状态持有者/API -> 回流点 -> UI`

## 6. 通信内容判断

- 传的是值：`[内容]`
- 传的是动作：`[内容]`
- 传的是控制权：`[内容]`
- 传的是共享状态：`[内容]`

## 7. 通信方式选择

| 场景 | 选择 | 为什么 | 为什么不用其他方式 |
|---|---|---|---|
| `[场景]` | `[props/emit/v-model/slot/defineExpose/provide/inject/store/函数/Promise]` | `[原因]` | `[排除原因]` |

## 8. App / store / services / Storage / API 补查

### App

- 启动时是否注册或恢复状态：`[是/否，说明位置]`

### store

- 共享状态：`[字段]`
- 修改入口：`[action]`

### services

- 请求、错误、权限、轮询或上报逻辑：`[说明]`

### Storage

| key | 写入者 | 读取者 | 更新时间 | 删除时间 | 语义 |
|---|---|---|---|---|---|

### API

- 请求参数：`[data/params/headers]`
- 返回结构：`[code/data/msg]`
- 失败协议：`[401/403/500/show]`

## 9. 回流设计

- 谁发起：`[节点]`
- 谁决定：`[节点]`
- 谁更新：`[节点]`
- 谁重渲染：`[节点]`
- 失败后回到哪里：`[节点]`

## 10. 风险检查

- [ ] 是否调用了未定义函数。
- [ ] 是否存在定义后未使用的规则。
- [ ] source of truth 是否唯一。
- [ ] 登录/退出清理是否完整。
- [ ] Storage 写入、读取、删除是否对称。
- [ ] 是否重复提示同一个错误。
- [ ] loading 是否能在异常时关闭。
- [ ] 二进制和普通 JSON 返回契约是否一致。
- [ ] 页面是否知道了过多请求、权限或缓存细节。
- [ ] 同一规则是否在 request、router、store 中重复实现。

## 11. 一句话总结

`[文件名]` 的核心不是 `[表面语法]`，而是 `[状态归属 + 调用链 + 回流设计]`。
```

---

## 九、手写 request.js 时的推荐顺序

从 0 编写请求封装时，可以按下面顺序落代码：

1. 先定义请求和响应契约：成功码、错误结构、返回值形状。
2. 创建 axios 实例，只放 `baseURL`、timeout、通用 content type。
3. 写纯判断函数：二进制、超时、鉴权错误、服务器错误。
4. 写请求拦截器：请求准入、token 和公共头。
5. 写响应成功分支：业务成功、特殊响应、数据标准化。
6. 写响应失败分支：超时、断网、鉴权、服务端错误和兜底提示。
7. 写登录失效协调函数，统一清 store、权限和动态路由。
8. 写 loading 计数，确保并发请求不会提前关闭。
9. 写唯一入口 `requestFn(config)`，统一 return/reject 契约。
10. 最后调用 `setRequestClient(requestFn)` 完成平台能力注册。

不要一开始就把所有业务特殊情况塞进拦截器。先保证主链路清楚，再增加有明确名称和边界的兼容规则。

---

## 十、一句话总结

这份 `request.js` 的核心不是“封装 axios”，而是：

**由共享 API 层描述请求，由 web 请求适配层掌握执行控制权，由 account store 持有登录态真值，再通过 Promise、router 和全局 UI 插件完成成功与失败的显式回流。**
