# `request.js` 手搓注释稿

目标文件：`travel-web/sites/web/src/utils/request.js`

> 用法：新建空的 `request.js`，只看下面的注释，从上往下逐段补代码。每完成一段，就用该段末尾的“自检”确认输入、处理和返回值。

## 开写前先记住主链路

```text
业务 API 配置
-> requestFn(config)
-> axios 实例 service(config)
-> 请求拦截器补公共请求头
-> 后端
-> 响应拦截器统一判断业务结果
-> requestFn 只返回业务 data
```

## 纯注释手写骨架

```js
// ==================== 第 1 段：引入依赖 ====================

// 引入 axios：用它创建项目自己的请求实例，而不是让业务代码直接使用默认 axios。

// 从 TDesign 引入全局 Loading 和 Message：请求文件统一负责加载反馈和错误提示。

// 从公共 API 包引入两个能力：
// 1. setRequestClient：把 web 端的真实请求函数注册给公共 API 包。
// 2. ShowEnum：根据后端返回的 show 值决定警告、错误、通知或不弹提示。

// 引入账号 store：请求前读取 token、accountId；登录失效时执行 logout。

// 引入 router：登录失效后跳到登录页，并保存用户原本想访问的地址。

// 引入动态路由重置函数：退出登录时清理旧账号留下的权限路由和菜单来源。


// ==================== 第 2 段：读取环境变量 ====================

// 读取接口基础地址 VITE_BASE_URL，稍后交给 axios 实例的 baseURL。

// 读取人为请求延迟 VITE_API_DELAY，主要用于开发、演示或观察 Loading。
// 注意：环境变量通常是字符串；参与大小比较和 setTimeout 时会发生隐式数字转换。


// ==================== 第 3 段：封装消息提示 ====================

// 分别写三个只接收 msg 的小函数：警告、错误、普通通知。
// 它们内部只调用对应的 MessagePlugin 方法，后面不再重复写 UI 组件调用。


// ==================== 第 4 段：准备固定错误文案和协议常量 ====================

// 定义网络超时文案。

// 定义服务器 500 异常文案。

// 定义 401、403 对应的登录/权限错误文案映射对象。

// 用 Set 保存免登录接口白名单：至少包含登录接口和图片验证码接口。
// 使用 Set 是因为这里只关心“某个 URL 是否存在”，不需要遍历或保存重复项。


// ==================== 第 5 段：写纯判断工具函数 ====================

// 写 getRequestUrl(config)：
// - config 默认是空对象，避免调用者没传值时报错。
// - 读取 config.url；没有 url 时使用空字符串。
// - 最终统一转成字符串返回。

// 写 isAuthFreeRequest(config)：
// - 调用 getRequestUrl 取得当前请求地址。
// - 判断地址是否在免登录 Set 中。
// - 返回布尔值，不做任何副作用。

// 写 isBinaryResponse(config)：
// - 判断 config.responseType 是否为 blob 或 arraybuffer。
// - 二进制下载不能按普通 JSON 的 code/data 协议解析。

// 写 isAuthError(code)：只判断 code 是否严格等于数字 401 或 403。

// 写 isServerError(code)：先把 code 转成数字，再判断是否等于 500。

// 写 isNetworkTimeoutError(error)：
// - error 默认空对象。
// - 把 error.code 转成大写字符串，把 error.message 转成小写字符串。
// - ETIMEDOUT 直接算超时。
// - ECONNABORTED 只有在 message 含 timeout 时才算超时。

// 【原文件缺失，手写时必须补上】写 isLoggedOutBusinessRequest(config)：
// - 读取 accountStore。
// - 如果当前已经没有 token，并且本次请求不属于免登录白名单，就返回 true。
// - 否则返回 false。
// - 它用于丢弃“用户退出登录以后才返回”的旧业务请求，避免旧页面数据继续回写。
// - 登录和验证码接口必须放行，否则用户未登录时连登录请求也会被拦掉。

// 自检：这一段的函数都应该只返回字符串或布尔值，不弹窗、不跳路由。


// ==================== 第 6 段：创建“已退出登录”专用错误 ====================

// 写 createLoggedOutRequestError(config)：
// - 创建一个 Error，文案说明用户已退出、请求已取消。
// - 给 error.code 标记 LOGGED_OUT。
// - 把原请求 config 挂到 error.config，方便后续排查。
// - 增加 isLoggedOutRequest = true，后面的错误拦截器用它识别并直接透传。
// - 最后返回这个 error，不要在函数内部 reject。


// ==================== 第 7 段：统一处理登录失效 ====================

// 写 redirectToLogin()：
// - 获取 accountStore，并调用 logout 清空登录状态。
// - 调用 resetAsyncRoutes(router)，清理旧账号的动态权限路由。
// - 判断当前路径是否已经是 /login，避免重复跳转。
// - 如果不是登录页，就 router.push 到 /login。
// - query.redirect 保存当前 fullPath，让重新登录后可以返回原页面。
// - 按原文件逻辑，fullPath 先经过 encodeURIComponent。


// ==================== 第 8 段：根据 show 类型弹消息 ====================

// 写 showMessageByType(show, msg)：
// - show 是 WARN 时调用警告函数并返回其结果。
// - show 是 NOTIFY 时调用通知函数并返回其结果。
// - show 是 ERROR 时调用错误函数并返回其结果。
// - 其他值返回 null，让调用处决定是否使用默认错误提示。


// ==================== 第 9 段：创建 axios 实例 ====================

// 用 axios.create 创建 service：
// - baseURL 使用 VITE_BASE_URL。
// - 默认请求头 Content-Type 设置为 application/json;charset=UTF-8。
// - timeout 设置为 60 秒，写成 60 * 1000，能直接看出单位换算。


// ==================== 第 10 段：请求拦截器 ====================

// 给 service 注册请求成功拦截器，每次发请求前执行：
// - 获取 accountStore。
// - 把 token 写入 config.headers.Authorization。
// - 把 accountId 写入 config.headers.AuthorizationId。
// - 把固定端来源 web 写入 config.headers.ACCOUNT_SOURCE。
// - 必须 return config，否则 axios 不会继续发送请求。

// 自检：请求拦截器只补公共请求信息，不解析响应，也不管理 Loading。


// ==================== 第 11 段：响应拦截器——HTTP 已收到响应 ====================

// 给 service 注册响应拦截器，第一个回调处理“HTTP 层已经收到响应”的情况。

// 第一步：如果 response.config 表明这是 blob/arraybuffer，直接返回完整 response。
// 原因：文件流没有普通业务 code/data 结构，而且调用方通常还需要响应头和文件名。

// 第二步：如果当前已退出登录，并且响应来自普通业务接口：
// - 创建 LOGGED_OUT 专用错误。
// - 用 Promise.reject 返回，阻止旧响应继续回到页面。

// 第三步：安全取得 response.data；没有时使用空对象。

// 第四步：从响应体解构 code、msg、message、show，并把 code 转成数字。

// 第五步：处理业务成功 code === 200：
// - 取出 responseData.data。
// - 如果 data 是对象，并且自身拥有 optimizeCountSql 字段，说明它是项目使用的分页对象。
// - 把 pages、size、total、current 四个分页字段统一转成 Number。
// - 最后返回完整 response；真正裁剪成 res.data.data 的工作留给最外层 requestFn。

// 第六步：处理业务失败：
// - 如果是 401/403，执行 redirectToLogin。
// - 如果是 500，先弹统一服务器错误，再创建 Error。
// - 给 500 Error 补 code、response、messageShown，随后立即 Promise.reject。

// 第七步：处理除 200/500 外的业务错误：
// - 错误文案优先级：msg -> message -> 401/403 固定文案 -> “请求失败”。
// - 如果 show 不是 REDIRECT，就按 show 类型弹消息；无法匹配类型时弹默认错误消息。
// - 创建 Error，并补上 code、response、messageShown。
// - 最后 Promise.reject，让业务调用方进入 catch。


// ==================== 第 12 段：响应拦截器——请求过程直接失败 ====================

// 响应拦截器的第二个回调接收 error，处理超时、断网、HTTP 错误等情况。

// 第一步：如果 error.isLoggedOutRequest 已经为 true，直接 reject。
// 原因：这是我们主动创建的取消错误，不要再次弹消息或重复包装。

// 第二步：如果错误对应的是退出登录后的普通业务请求：
// - 创建 LOGGED_OUT 专用错误并 reject。

// 第三步：如果是网络超时：
// - 弹统一超时文案。
// - 把 error.message 改成统一文案。
// - 标记 messageShown = true。
// - 立即 reject。

// 第四步：如果 error.response 存在，说明服务器有返回：
// - 从 error.response.data 中读取 msg、show、code。
// - statusCode 优先使用业务 code，没有时使用 HTTP status，并统一转 Number。

// 第五步：error.response 中的 401/403：
// - 给 error 保存 authCode 和 authMessage。
// - authMessage 优先使用后端 msg，否则用固定鉴权文案。
// - 如果 config.skipAuthErrorMessage 不为 true，才弹鉴权错误，并标记 authMessageShown。
// - 执行 redirectToLogin，然后立即 reject。

// 第六步：error.response 中的 500：
// - 弹统一服务器错误。
// - 覆盖 error.message，设置 code = 500，并标记 messageShown。
// - 立即 reject。

// 第七步：其他带 response 的错误：
// - show 有值且不是 REDIRECT 时，调用 showMessageByType(show, msg)。
// - 标记 messageShown，防止后面的兜底消息重复弹出。

// 第八步：如果前面既没弹普通消息，也没弹鉴权消息，就做最终兜底：
// - error.message 恰好是 Network Error 时，提示检查网络连接。
// - 否则提示“请求失败，请稍后重试”。
// - 弹出后标记 messageShown。

// 第九步：无论属于哪种未提前返回的错误，最后都 Promise.reject(error)。

// 自检：响应拦截器成功时返回 response，失败时统一 reject Error，不能吞掉错误。


// ==================== 第 13 段：全局 Loading 并发计数 ====================

// 在模块顶层定义 loadingCount，初始为 0。
// 不能只用 true/false，因为多个并发请求会发生“第一个完成就提前关闭 Loading”的问题。

// 写 showLoading()：
// - 只有 loadingCount 还是 0 时才真正打开 LoadingPlugin。
// - 然后 loadingCount 加 1。

// 写 hideLoading()：
// - loadingCount 先减 1。
// - 当计数小于或等于 0 时，把它纠正回 0，并关闭 LoadingPlugin。

// 自检：两个请求同时开始时计数应为 2；完成一个后为 1，不能关闭；全部完成后才回到 0。


// ==================== 第 14 段：人为延迟工具 ====================

// 写 delay(ms)：返回一个 Promise，在 setTimeout 到时后 resolve。
// 该函数只负责等待，不负责发请求。


// ==================== 第 15 段：唯一对外请求入口 ====================

// 写 async requestFn(config)：
// - 从 config.loading 读取这次请求是否需要全局 Loading。
// - 需要时先调用 showLoading。

// 用 try/finally 包住真正请求流程：
// - 如果 VITE_API_DELAY 大于 0，就 await delay(VITE_API_DELAY)。
// - await service(config)，此时会自动经过请求和响应拦截器。
// - 如果原 config 是二进制响应，返回完整 res。
// - 普通 JSON 请求只返回 res.data.data，让页面直接拿业务数据。

// finally 中：
// - 只有本次请求打开过 Loading，才调用 hideLoading。
// - finally 无论成功还是失败都会执行，因此不会因为异常留下永久 Loading。


// ==================== 第 16 段：注册并导出 ====================

// 调用 setRequestClient(requestFn)，把 web 端实现注入 @travel/api。
// 没有这一步，公共 API 包只知道请求配置，不知道应该用谁真正发送。

// 默认导出 requestFn，允许其他模块在需要时直接使用这个统一请求入口。
```

## 推荐手写顺序

不要一次写完整文件。按下面顺序每写完一段就运行或检查一次：

1. imports、环境变量、常量。
2. 所有纯判断函数，包括原文件缺失的 `isLoggedOutBusinessRequest`。
3. 登录跳转和消息分发函数。
4. axios 实例与请求拦截器。
5. 响应成功回调。
6. 响应错误回调。
7. Loading 计数与 delay。
8. `requestFn`、注册、导出。

## 最容易写错的 8 个地方

1. 忘记在请求拦截器最后 `return config`。
2. 把 HTTP 成功误当成业务成功，漏掉 `code === 200` 判断。
3. 普通请求和二进制请求返回相同结构，导致下载接口拿不到完整响应。
4. 401/403 只跳登录但没清账号状态和动态路由。
5. 错误提示后没设置 `messageShown`，造成同一个错误弹两次。
6. Loading 用布尔值而不是计数，导致并发时提前关闭。
7. 不用 `finally` 关闭 Loading，失败请求会让遮罩一直存在。
8. 照抄当前源码却没补 `isLoggedOutBusinessRequest`，运行时会出现 `ReferenceError`。

## 一句话总结

这份文件的固定写法是：**先准备协议和判断函数，再创建 axios 实例；请求前补身份，响应后统一判错；最外层只管理 Loading、延迟和返回值。**
