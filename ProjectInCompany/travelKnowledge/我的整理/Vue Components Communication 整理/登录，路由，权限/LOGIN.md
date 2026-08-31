# 登录页改用浏览器原生密码管理器设计

## 目标

移除项目自行持久化明文密码的实现，改由浏览器密码管理器识别、保存和回填登录凭据，同时保持现有后端登录协议、账号状态、权限清理和登录跳转行为不变。

## 当前问题

当前登录页把用户输入的原始密码通过 `rememberPass` 传给 account store，再由 `persistLoginParams` 持久化到 `localStorage`。浏览器开发者工具可以直接看到密码明文。

`accountStore.logout()` 不会清理 `persistLoginParams` 和 `rememberLogin`，因此主动退出或鉴权失效后重新进入登录页，密码仍然会从 Pinia 持久化状态回填。

## 选定方案

采用浏览器原生密码管理器方案，不再由业务代码保存密码。

### 登录页

- 删除“记住我”复选框。
- 从 `formData` 删除 `remember` 字段。
- 删除读取 `accountStore.persistLoginParams` 和 `accountStore.rememberLogin` 的初始化逻辑。
- 用户名输入框使用规范的 `name="username"` 和 `autocomplete="username"`。
- 密码输入框使用 `type="password"`、`name="password"` 和 `autocomplete="current-password"`。
- 保留真实表单的 submit 行为，让浏览器能够识别一次完整登录提交。
- 保留现有表单校验、密码哈希、登录成功提示和重定向逻辑。
- 调用 `accountStore.login()` 时只传接口参数，不再传 `rememberPass`。

### Account store

- 删除 `persistLoginParams` 和 `rememberLogin` 状态。
- 删除 `login(params, options)` 中保存或清空原始密码的逻辑。
- 将登录方法收敛为 `login(params)`。
- 从 store 返回对象和持久化 `pick` 中删除上述两个字段。
- token、账号信息和其他已有持久化字段保持不变。

### 历史明文数据清理

现有浏览器中可能已经存在：

```json
{
  "persistLoginParams": {
    "user": "...",
    "pass": "明文密码"
  },
  "rememberLogin": true
}
```

应用升级后需要清除这两个历史属性，但不能删除整个 `account` 存储，否则会让所有当前登录用户立即掉线。

在 account store 初始化前执行一次保守迁移：

1. 读取 `localStorage.account`。
2. JSON 解析成功时，只删除 `persistLoginParams` 和 `rememberLogin`。
3. 其余 token、账号资料字段原样保留。
4. 数据不存在或格式异常时不阻断应用启动。

迁移代码仅负责删除已废弃的敏感字段，不引入新的密码存储方案。

## 数据流

```text
用户填写账号和密码
-> 浏览器根据 name/autocomplete 识别登录表单
-> login.vue 校验表单
-> 原始密码仅在页面内存中短暂存在
-> 按现有规则生成接口密码哈希
-> accountStore.login(params)
-> 后端验证成功
-> 页面跳转
-> 浏览器自行决定是否提示保存密码
-> 后续回填由浏览器密码管理器完成
```

业务代码不读取浏览器密码库，也无法强制浏览器弹出保存提示。

## 安全边界

- 本次改造解决的是“原始密码被业务代码写入 localStorage”的问题。
- 前端传给后端的密码哈希规则保持不变。
- token 仍按项目现状保存在 Pinia 持久化存储中；迁移到 HttpOnly Cookie 需要后端配合，不纳入本次范围。
- 浏览器是否保存、何时提示以及如何同步密码，由用户浏览器和用户设置决定。

## 测试与验证

先添加一个最小回归测试，验证：

1. 登录页不存在 `remember`、`rememberPass` 和旧持久化回填逻辑。
2. 用户名与密码输入框包含规范的 `name` 和 `autocomplete`。
3. account store 不再定义或持久化 `persistLoginParams`、`rememberLogin`。
4. 历史数据迁移只删除两个废弃字段，并保留 token 等其他字段。

实现后再执行：

- 回归测试。
- web 项目 lint。
- web 项目 build 或等价编译检查。
- 手工检查登录、退出、刷新和浏览器自动填充行为。

## 不在本次范围

- 修改后端登录接口。
- 改变现有密码哈希算法。
- 将 token 迁移到 HttpOnly Cookie。
- 自定义浏览器保存密码弹窗。
- 跨浏览器保证完全一致的密码保存提示。
