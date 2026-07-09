# account.js 书写框架（按 vue-components-communication 分析）

分析对象：

- `travel-web/sites/web/src/store/modules/account.js`
- 关联页面：`travel-web/sites/web/src/pages/login/login.vue`
- 关联请求：`travel-web/sites/web/src/utils/request.js`
- 关联路由：`travel-web/sites/web/src/router/index.js`
- 关联持久化：`travel-web/sites/web/src/store/index.js`

---

## 先说结论

`account.js` 不是普通工具文件，也不是展示层代码。  
它在这条登录链路里扮演的是：

`页面组件 / 容器组件` 和 `services / request / router / Storage` 之间的“登录状态中枢”。

你写这个文件时，不要先想“这个函数怎么写”，要先想下面 4 件事：

1. 哪些状态必须由 `account store` 真实持有。
2. 登录页只能触发什么动作，不能自己决定什么状态。
3. `request.js` 要从这里读取什么。
4. 退出登录、登录恢复、记住密码回显，分别从哪里流入、流出。

---

## 1. 节点分层表

| 节点                                | 类型                      | 主要职责                            | 不该负责什么                |
| --------------------------------- | ----------------------- | ------------------------------- | --------------------- |
| `pages/login/login.vue`           | 页面组件 / 容器组件             | 收集表单、校验、触发登录、决定跳转               | 不直接长期持有 token，不直接拼请求头 |
| `store/modules/account.js`        | 共享状态中枢 / store          | 持有登录态、用户信息、派生字段、记住密码信息          | 不渲染 UI，不处理按钮样式        |
| `utils/request.js`                | service / 请求运行时         | 给请求统一挂 token，处理 401/403、超时、错误提示 | 不决定登录表单长什么样           |
| `router/index.js`                 | 路由协调层                   | 判断是否需要登录、是否拉用户信息、是否跳回登录页        | 不保存登录凭证               |
| `store/index.js` + persistedstate | store 基础设施 / Storage 桥接 | 让指定字段持久化                        | 不负责业务判断               |
| `packages/api` 登录接口               | API 层                   | 请求后端登录接口和登录信息接口                 | 不直接修改前端状态             |

---

## 2. 项目级节点表

### `login.vue` 负责什么

- 持有“本页输入中的表单草稿”
- 调用 `accountStore.login(...)`
- 登录成功后跳转
- 回显“记住我”的账号密码

### `account.js` 负责什么

- 持有全局共享的真实登录状态
- 把后端登录结果转成前端可复用状态
- 拉取并缓存当前登录人信息
- 提供统一的 `login / getLoginInfo / logout`

### `request.js` 负责什么

- 从 `accountStore` 读取 token 和 accountId
- 放进请求头
- 遇到 401/403 时触发退出和回登录页

### `router` 负责什么

- 页面切换前检查是否有登录态
- 已登录时补拉用户信息和权限
- 登录失效时带 redirect 回登录页

### `Storage` 负责什么

- 持久化 token、accountId、记住密码相关字段
- 支撑刷新后恢复登录态和登录页回显

---

## 3. 关键链路表

### 链路 1：登录提交链路

| 项目 | 内容 |
|---|---|
| 状态被谁持有 | `login.vue` 先临时持有表单输入，`account.js` 最终持有登录态 |
| 方法被谁触发 | `login.vue` 点击提交时触发 |
| 方法被谁执行 | `accountStore.login()` 执行 |
| 数据传给谁 | 传给 `packages/api` 的登录接口 |
| 改完怎么回流 | 接口返回 token -> `account.js` 写入 store -> `request.js` 后续自动读取 |

### 链路 2：登录信息补拉链路

| 项目     | 内容                                      |
| ------ | --------------------------------------- |
| 状态被谁持有 | `account.js` 持有 `accountInfo` 和拆分字段     |
| 方法被谁触发 | `login()` 内部触发，或 `router.beforeEach` 触发 |
| 方法被谁执行 | `accountStore.getLoginInfo()`           |
| 数据传给谁  | 接口返回数据写入 store                          |
| 改完怎么回流 | 页面、权限、请求、页头等依赖 store 的地方重新读取            |

### 链路 3：请求鉴权链路

| 项目 | 内容 |
|---|---|
| 状态被谁持有 | `account.js` 持有 `token`、`accountId` |
| 方法被谁触发 | 任意业务请求发起时触发 |
| 方法被谁执行 | `request.js` 请求拦截器执行 |
| 数据传给谁 | 传给后端请求头 |
| 改完怎么回流 | 服务端返回结果后，若 401/403 再反向回流到 `logout + redirect` |

### 链路 4：退出登录链路

| 项目 | 内容 |
|---|---|
| 状态被谁持有 | `account.js` 持有真实登录态 |
| 方法被谁触发 | 用户主动退出，或请求/路由发现鉴权失败 |
| 方法被谁执行 | `accountStore.logout()` |
| 数据传给谁 | 清空 store 和本地持久化字段 |
| 改完怎么回流 | `router` 重定向到登录页，登录页重新以初始态或记住密码回显态渲染 |

---

## 4. Storage 总表

这个模块最少要盯住这些持久化语义：

| key/字段 | 写入者 | 读取者 | 触发时机 | 业务语义 |
|---|---|---|---|---|
| `token` | `account.js` | `request.js`、`router` | 登录成功后 | 当前登录凭证 |
| `accountId` | `account.js` | `request.js` | 登录成功后 | 当前用户标识 |
| `persistLoginParams` | `account.js` | `login.vue` | 记住密码时 | 登录页回显数据 |
| `rememberLogin` | `account.js` | `login.vue` | 勾选记住我时 | 是否启用回显 |

注意：

- 这些 key 不是同一层东西。
- `token/accountId` 是“登录业务状态”。
- `persistLoginParams/rememberLogin` 是“登录页体验状态”。
- 不要把它们混成一坨处理。

---

## 5. account.js 的职责边界

你写 `account.js` 时，最容易犯的错，就是把它写成“大杂烩”。

### 它应该负责

- 持有真实登录状态
- 统一暴露登录相关动作
- 统一做用户信息标准化和字段拆分
- 统一处理记住密码回显所需数据
- 统一提供退出登录时的清理

### 它不应该负责

- 登录页 UI 结构
- 某个按钮的 loading 展示
- 请求弹 toast 的视觉细节
- 动态路由具体怎么生成
- 页面布局怎么渲染

一句话：

`account.js` 负责“状态和动作”，不负责“页面长什么样”。`

---

## 6. account.js 的书写框架

你从 0 开始写时，推荐固定按这个顺序：

### 第 1 层：先写 import

- 登录接口
- 获取登录信息接口
- `defineStore`

这一层只做依赖准备，不放业务判断。

### 第 2 层：再写小工具函数

先写“脏数据清洗”和“结构兼容”函数，例如：

- `normalizeString`
- `normalizeAccountInfo`
- `getResponseErrorMessage`
- `hasResponseError`
- `getDepartmentInfo`

这样主流程会短很多。

### 第 3 层：再写状态

优先顺序建议这样排：

#### 第一批必须先有

- `token`
- `accountInfo`
- `accountId`

#### 第二批再补

- `persistLoginParams`
- `rememberLogin`

#### 第三批业务增强字段

- `accountRoleId`
- `accountRealName`
- `accountDepartmentId`
- `accountDepartmentName`
- `accountDepartmentBelongBlock`
- `bucketName`
- `cosRegion`
- `cosDir`

### 第 4 层：再写内部辅助函数

优先写两个：

- `syncAccountDerivedFields(info)`
- `resetAccountState()`

它们的意义是：

- 一个负责“把完整用户信息拆成页面更好用的字段”
- 一个负责“统一清空”

### 第 5 层：再写主流程函数

主流程固定就是 3 个：

#### `login(params, options = {})`

顺序固定：

1. 先清旧状态
2. 调登录接口
3. 保存 token / accountId
4. 处理记住密码
5. 拉用户信息

#### `getLoginInfo(reload)`

顺序固定：

1. 有缓存且不强刷就直接返回
2. 没缓存就调接口
3. 判断是否报错
4. 标准化结构
5. 写入 store
6. 同步派生字段

#### `logout()`

顺序固定：

1. 清 token
2. 清 id
3. 清用户信息
4. 必要时写退出标记

### 第 6 层：最后 return 暴露字段

return 时建议按这个顺序排：

1. 核心登录态
2. 用户资料
3. 派生字段
4. 行为方法
5. 登录页回显相关状态

这样后面别人读 store 会更顺。

### 第 7 层：最后再配 persist

只把需要跨刷新保留的字段放进去：11

- token
- accountId
- 需要回显的登录页字段
- 需要跨刷新保留的用户基础信息

不要为了省事把全部字段都持久化。

---

## 7. 最小可手写骨架

示例代码仅供参考，需要你手动复制到项目中。

```js
import { getLoginInfo as getLoginInfoApi, login as loginApi } from '@api' // 引入登录接口和登录信息接口
import { defineStore } from 'pinia' // 引入 pinia store 定义方法

const normalizeString = (value) => { // 统一把空值转成空字符串，避免页面出现 undefined
  if (value === undefined || value === null) return '' // 空值直接转空串
  return String(value) // 其他值统一转字符串
}

export const useAccountStore = defineStore('account', () => { // 创建 account store
  const token = ref('') // 真实登录凭证，由 store 持有
  const accountId = ref('') // 当前登录人 id，由 store 持有
  const accountInfo = ref({}) // 当前登录人完整信息，由 store 持有
  const persistLoginParams = ref({}) // 记住密码回显数据
  const rememberLogin = ref(false) // 是否记住密码

  function resetAccountState() { // 统一清理用户信息，避免多处重复写清空逻辑
    accountInfo.value = {} // 清空用户信息
  }

  async function getLoginInfo(reload = false) { // 拉取当前登录人信息
    if (accountInfo.value?.id && !reload) return // 已有缓存且不要求强刷时直接结束

    const res = await getLoginInfoApi(true) // 请求登录信息接口
    accountInfo.value = res?.accountInfo || {} // 把用户信息写进 store
  }

  async function login(params, options = {}) { // 登录主流程
    resetAccountState() // 登录前先清旧用户信息

    const res = await loginApi(params, true) // 调用登录接口获取凭证
    const [resAccountId, resToken] = String(res || '').split('.') // 按项目当前返回格式拆 id 和 token

    accountId.value = normalizeString(resAccountId) // 保存账号 id
    token.value = normalizeString(resToken) // 保存 token
    rememberLogin.value = Boolean(params.remember) // 保存是否记住密码

    if (params.remember) { // 如果勾选记住密码
      persistLoginParams.value = { // 保存用于回显的数据
        user: params.user, // 保存用户名
        pass: options.rememberPass ?? params.pass, // 保存回显密码，优先用明文回显值
      }
    } else { // 没勾选记住密码时
      persistLoginParams.value = {} // 清空回显数据
    }

    await getLoginInfo(true) // 登录成功后立刻补拉一次用户信息
  }

  function logout() { // 退出登录
    token.value = '' // 清空 token
    accountId.value = '' // 清空账号 id
    resetAccountState() // 清空用户信息
  }

  return { // 对外暴露状态和方法
    token, // 暴露 token
    accountId, // 暴露账号 id
    accountInfo, // 暴露用户信息
    persistLoginParams, // 暴露回显数据
    rememberLogin, // 暴露记住密码状态
    login, // 暴露登录方法
    getLoginInfo, // 暴露获取用户信息方法
    logout, // 暴露退出方法
  }
}, {
  persist: { // 配置持久化
    pick: ['token', 'accountId', 'persistLoginParams', 'rememberLogin'], // 只持久化必要字段
  },
})
```

---

## 8. 通信方式为什么这样选

### 为什么不是 props / emit

因为 `token` 和 `accountInfo` 不是局部父子组件状态。  
它们会被：

- 登录页使用
- 请求层读取
- 路由守卫读取
- 页头读取
- 权限系统读取

这已经是典型的“跨页面、跨模块共享状态”，所以应该用 `store`。

### 为什么不是 provide / inject

因为这里不是同一棵局部组件树里的上下文共享。  
它会跨路由、跨模块、跨入口使用，`provide/inject` 不适合。

### 为什么登录页只触发，不持有真实登录态

因为登录页只是“输入表单的地方”，不是“系统登录态的唯一真实拥有者”。

所以正确关系是：

- 登录页持有表单草稿
- `account.js` 持有登录态真值

---

## 9. 优势说明

### 封装性

登录细节集中在 store，页面不需要知道 token 怎么拆、用户信息怎么补拉。

### 代码简洁度

登录页只写“收集表单 -> 调 store -> 跳转”，不会越来越胖。

### 语义明确性

一看文件职责就知道：

- `login.vue` 是登录入口
- `account.js` 是登录状态中心
- `request.js` 是鉴权请求层
- `router` 是访问控制层

---

## 10. 你下一步真正该怎么写

如果你从 0 写，推荐严格按这个顺序：

1. 先写最小版 `account.js`
2. 只保留：
   - `token`
   - `accountId`
   - `accountInfo`
   - `login`
   - `getLoginInfo`
   - `logout`
3. 跑通以后再补：
   - `persistLoginParams`
   - `rememberLogin`
4. 再补派生字段：
   - `accountRealName`
   - `accountDepartmentName`
   - `accountRoleId`
5. 最后再补数据清洗工具函数

不要第一版就把完整业务字段全抄进去。

---

## 一句话总结

`account.js` 的正确写法，不是先想“我要写几个函数”，而是先想“登录态的真实拥有者是谁”，然后围绕这个唯一持有者，把登录、补拉用户信息、请求鉴权、退出清理和本地恢复串成一条显式状态链路。`
