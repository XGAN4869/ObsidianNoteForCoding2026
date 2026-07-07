# request.js 分析

## 这个 function 是干啥的

`travel-web/sites/web/src/utils/request.js` 不是“发一个请求”这么简单。

它真正负责的是 5 件事：

1. 创建统一的 axios 实例。
2. 在请求发出前，统一补 token、账号 id、端来源。
3. 在响应回来后，统一处理成功、超时、401/403、500、弹窗提示。
4. 给页面层统一管理 loading。
5. 通过 `setRequestClient(requestFn)` 把自己注入给 `@travel/api`，让业务 API 不直接依赖 axios。

## 它接收什么数据

最外层暴露的是 `requestFn(config)`。

它接收的主要是一个请求配置对象，常见字段有：

- `url`
- `method`
- `data`
- `params`
- `loading`
- `responseType`

也就是说，业务层不是写 `axios.get()`、`axios.post()`，而是把“这次请求要怎么发”描述成一个 `config` 对象交给它。

## 它返回什么结果

普通 JSON 请求时：

- 成功返回 `res.data.data`
- 失败抛出 `Error`

二进制请求时，比如下载文件：

- 直接返回整个 `axios response`

所以这份封装的核心约定是：

- 页面层平时拿到的是“业务数据 data”
- 只有下载、导出这类特殊请求，才拿完整响应对象

## 它中间做了哪几步

### 第 1 步：把 web 端请求实现注册给 API 包

文件最后这句最关键：

```js
setRequestClient(requestFn);
```

它的意思是：

`@travel/api` 里所有 `RequestClient({...})`，最终都会转到这里的 `requestFn(config)`。

调用链要这样记：

```text
业务 API 方法
-> RequestClient(config)
-> requestFn(config)
-> service(config)
-> 请求/响应拦截器
-> 返回数据
```

### 第 2 步：`requestFn` 先处理 loading 和延迟

`requestFn(config)` 自己并不直接处理 token 和错误，它先做外围流程：

1. 看 `config.loading`，决定要不要开全局 loading。
2. 看 `VITE_API_DELAY`，决定要不要人为延迟。
3. 再调用 `service(config)` 真正发请求。
4. 最后在 `finally` 里兜底关闭 loading。

这一步的重点是：

- loading 不让页面重复写
- 不管成功还是失败，都能收口关闭 loading

### 第 3 步：请求拦截器统一补请求头

请求发出前会经过：

```js
service.interceptors.request.use(...)
```

这里做了 3 件事：

1. 如果用户已经退出登录，而且这次又不是免登录接口，直接拒绝这次请求。
2. 从 `accountStore` 里取 token 和 `accountId`。
3. 统一写入 `AUTHORIZATION`、`AUTHORIZATIONID`、`ACCOUNT_SOURCE`。

这样页面和 API 方法就不用每次手动补登录态。

### 第 4 步：响应拦截器统一处理业务成功和业务失败

这份代码把“请求成功”和“业务成功”分开了。

HTTP 成功不等于业务成功，它还会继续看：

```js
const { code, msg, message, show } = response.data
```

重点规则是：

- `code === 200`：认为业务成功
- `401/403`：登录态失效，执行登出和跳登录
- `500`：弹统一服务异常提示
- 其他业务错误：按 `show` 决定提示方式

所以它不是只看 axios 层的 `status`，还看后端业务层的 `code`。

### 第 5 步：顺手修正分页字段类型

在成功分支里，它还做了一个业务修正：

如果发现返回数据里有 `optimizeCountSql`，就把分页字段转成数字：

- `pages`
- `size`
- `total`
- `current`

这说明作者遇到过“后端分页字段可能是字符串”的情况，所以在这里做了兼容。

### 第 6 步：异常分支统一处理网络错误

如果请求根本没走到业务成功分支，会进入错误处理：

- 超时：提示网络超时
- 401/403：提示并跳登录
- 500：统一服务异常提示
- 其他情况：根据 `show` 或兜底文案提示

这里还用了 `messageShown`、`authMessageShown` 之类的标记，避免同一个错误被重复提示多次。

## 按八荣八耻判断

### 写得比较好的地方

#### 1. 以“认真查阅和复用现有”为荣

这份代码没有让每个 API 文件都各自写一套 axios 逻辑，而是：

- API 包只负责描述接口配置
- web 端统一注入 `requestFn`

这是明显的“复用现有能力”，而不是到处复制请求代码。

#### 2. 以“遵循规范”为荣

它把职责切得比较清楚：

- 工具判断函数放前面
- axios 实例单独创建
- 请求拦截器只管发出前
- 响应拦截器只管回来后
- `requestFn` 只做入口编排

整体结构是有层次的，不算乱写。

#### 3. 以“主动验证和兜底”为荣

这里能看到不少防御性写法：

- 超时单独识别
- 401/403 单独识别
- 500 单独识别
- `finally` 兜底关 loading
- 已退出登录时直接中止业务请求

说明作者不是只管 happy path。

#### 4. 以“诚实面对业务约定”为荣

它没有假装这是个纯技术层封装，而是明确承认后端业务协议存在：

- `code`
- `msg/message`
- `show`
- 分页字段修正

这其实是比较真实的项目写法。

### 还可以改进的地方

#### 1. `request.js` 同时承担了太多业务语义

它现在既管：

- token
- 跳登录
- 消息提示
- loading
- 分页字段修正
- 业务错误协议

这会导致阅读成本偏高。小白第一次看会觉得“怎么一个请求文件里什么都有”。

#### 2. 免登录白名单维护成本高

`AUTH_FREE_URLS` 是硬编码的：

- 少写一个公开接口，就可能被误拦截
- 新人不熟时，很容易忘记同步这里

这属于“能跑，但维护时容易漏”的点。

#### 3. 分页修正依赖 `optimizeCountSql` 这个特殊字段，可读性一般

这说明作者在兼容某类分页对象，但这个判断条件比较业务化。

如果不了解后端返回结构，读者会很难第一眼明白：

“为什么看到 `optimizeCountSql` 就要把分页字段转数字？”

#### 4. API 包和 web 请求实现的契约不完全一致

`packages/api/src/apis/workerManagement.js` 里已经有人传了：

```js
resolveFullResponse: true
```

但 web 端这个 `request.js` 没有消费这个开关，而 uniapp 端已经支持了。

这说明“统一 API 契约”这件事还没完全收口好。

虽然当前这个接口只在 uniapp 侧使用，不一定立刻出 bug，但从封装完整性上讲，这是一个值得留意的缺口。

## 小白应该怎么模仿

你以后自己写类似请求封装，不要一下写这么大一坨，按这个顺序模仿最稳：

1. 先写 axios 实例。
2. 再写请求拦截器，只负责补 token。
3. 再写响应拦截器，只负责判断成功失败。
4. 再写 `request(config)` 入口，统一处理 loading。
5. 最后再加项目特有逻辑，比如跳登录、特殊提示、分页修正。

你可以先记住一句最朴素的话：

“请求封装不是为了少写 `axios.post`，而是为了把重复规则集中到一个地方。”

## 示例代码

示例代码仅供参考，需要你手动复制到项目中。

```js
import axios from "axios";

const service = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

service.interceptors.request.use((config) => {
  // 1. 发请求前，统一补 token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

service.interceptors.response.use(
  (response) => {
    // 2. 请求成功后，不急着直接返回，先看业务码
    const res = response.data || {};
    if (Number(res.code) === 200) {
      return res.data;
    }

    // 3. 业务失败时，统一抛错
    throw new Error(res.msg || "请求失败");
  },
  (error) => {
    // 4. 网络失败、超时、401 等，都在这里集中处理
    throw error;
  }
);

async function request(config) {
  // 5. 对外只暴露一个统一入口
  return service(config);
}
```

## 举一反三

这类请求封装的固定写法，一般就是：

1. 先准备 axios 实例。
2. 再在请求前统一加公共头。
3. 再在响应后统一判业务码。
4. 最后暴露一个统一的 `request(config)` 给业务层调用。

适合抽出去复用的内容有：

- token 注入
- 错误提示
- 401 跳登录
- loading
- 下载文件特殊处理

适合继续拆函数的内容有：

- 业务码判断
- 登录失效判断
- 分页数据修正
- 错误提示文案选择

## 一句话总结

这份 `request.js` 的核心套路不是“怎么发请求”，而是“把项目里所有请求共用的规则，统一拦在入口和出口处理掉”。
