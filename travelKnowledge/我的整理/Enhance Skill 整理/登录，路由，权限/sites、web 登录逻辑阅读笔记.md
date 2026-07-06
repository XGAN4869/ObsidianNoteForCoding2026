## 这个登录逻辑是干嘛的

`travel-web/sites/web` 的登录逻辑不是只有登录页一个文件，而是一整条链路：

1. `pages/login/login.vue` 收集账号、密码，做表单校验和密码加密。
2. `store/modules/account.js` 调登录接口，保存 token、accountId、用户信息。
3. `utils/request.js` 给每个业务请求自动加 token，并处理 401 / 403。
4. `router/index.js` 在进入页面前判断是否已登录、是否有权限、是否需要动态加路由。
5. `store/modules/permission.js` 拉取菜单权限、按钮权限、弹窗权限。
6. `router/model/permissionModel.js` 根据后端菜单动态生成可访问路由。
7. `components/layout/components/LayoutHeader.vue` 处理退出登录。

一句话：登录成功后，前端拿到 token，再用 token 拉用户信息和权限菜单，最后根据权限动态注册页面路由。

## 它接收什么数据

登录页主要接收用户输入的三份数据：

```js
const formData = reactive({
  user: '',
  pass: '',
  remember: shouldRememberLogin,
  ...rememberedLoginParams
});
```

含义：

- `user`：用户名 / 手机号。
- `pass`：用户输入的明文密码。
- `remember`：是否记住账号密码。

这里还有一个回显逻辑：

```js
const hasRememberedLoginParams = Boolean(accountStore.persistLoginParams?.user || accountStore.persistLoginParams?.pass);
const shouldRememberLogin = accountStore.rememberLogin || hasRememberedLoginParams;
const rememberedLoginParams = shouldRememberLogin ? accountStore.persistLoginParams : {};
```

意思是：

- 如果上次勾选过“记住我”，就从 Pinia 持久化数据里拿回账号密码。
- 然后把这些值合并进 `formData`，登录页一打开就能回显。

## 它返回什么结果

登录接口 `/web/login` 最终返回的是一个字符串。

在 `account.js` 里这样处理：

```js
const res = await loginApi(params, true);
const [resAccountId, resToken] = res.split('.');
accountId.value = resAccountId;
token.value = resToken;
```

说明后端返回格式类似：

```js
账号ID.token
```

前端把它拆成两份：

- `accountId`：后续放到请求头 `AUTHORIZATIONID`。
- `token`：后续放到请求头 `AUTHORIZATION`。

## 它中间做了哪几步

### 1. main.js 先装好全局能力

入口文件 `main.js` 做了这些事：

```js
import '@/utils/request.js';
import router from './router';
import { store } from './store';

app.use(store);
app.use(permissionDirective);
app.use(router);
```

重点是：

- 先引入 `utils/request.js`，让 `@travel/api` 知道以后请求要走哪个 request 客户端。
- 安装 Pinia store，登录状态、权限状态都放在这里。
- 安装 router，后面每次跳页面都会经过路由守卫。
- 安装 `v-permission` 指令，页面按钮权限显示会用到。

### 2. 登录页先做表单校验

`login.vue` 里的登录函数第一步：

```js
const valid = await tFormRef.value.validate();
if (valid !== true)
    return;
```

意思是：

- 先让 TDesign 表单校验账号和密码是否为空。
- 如果没通过，直接停止，不调接口。

这是提交类函数的固定写法：先校验，再请求。

### 3. 登录前先清掉旧权限

```js
permissionStore.resetPermission();
```

这一步很重要。

因为权限 store 可能有上一个账号残留的数据，登录新账号前先清空：

- `menuList`
- `menuCodes`
- `ruleNames`
- `dialogNames`
- `loaded`

这样能避免新账号短暂看到旧账号菜单。

### 4. 密码做两层加密

```js
const passSha1 = CryptoJS.SHA1(String(formData.pass ?? '').trim()).toString(CryptoJS.enc.Hex);

pass: CryptoJS.MD5(passSha1 + 'liangtong_travel_oa_salt').toString(),
```

密码处理顺序是：

1. 用户输入明文密码。
2. 去掉前后空格。
3. 先做 SHA1。
4. 再拼接固定盐值 `liangtong_travel_oa_salt`。
5. 最后做 MD5。
6. 把最终结果传给登录接口。

也就是：

```text
明文密码 -> SHA1 -> 拼盐 -> MD5 -> 发给后端
```

### 5. accountStore.login 真正调用登录接口

登录页调用：

```js
await accountStore.login({
  ...formData,
  pass: encryptedPassword,
}, {
  rememberPass: formData.pass,
});
```

然后 `account.js` 里执行：

```js
async function login(params, options = {}) {
    resetAccountState();
    const res = await loginApi(params, true);
    const [resAccountId, resToken] = res.split('.');
    accountId.value = resAccountId;
    token.value = resToken;
    rememberLogin.value = Boolean(params.remember);

    if (params.remember) {
        persistLoginParams.value = {
            pass: options.rememberPass ?? params.pass,
            user: params.user,
        };
    }
    else {
        persistLoginParams.value = {};
    }

    await getLoginInfo(true);
}
```

这段可以按顺序理解：

1. 先清空旧用户信息。
2. 调 `/web/login`。
3. 拆出 `accountId` 和 `token`。
4. 保存是否记住密码。
5. 如果记住，就保存原始输入的账号密码，用于下次回显。
6. 登录成功后立刻调用 `getLoginInfo(true)` 拉当前用户详情。

### 6. getLoginInfo 拉当前登录人信息

```js
const res = await getLoginInfoApi(true);
const normalizedAccountInfo = normalizeAccountInfo(res);
accountInfo.value = normalizedAccountInfo;
syncAccountDerivedFields(normalizedAccountInfo);
```

`/web/loginInfo` 返回的数据结构可能不固定，所以代码里做了兼容：

```js
if (res.data?.accountInfo) return res.data.accountInfo;
if (res.accountInfo) return res.accountInfo;
if (res.data) return res.data;
return res;
```

这就是 `normalizeAccountInfo` 的作用：不管后端包了几层，最后尽量拿到真正的用户对象。

随后 `syncAccountDerivedFields` 会同步一些常用字段：

- 角色 ID。
- 真实姓名。
- 部门 ID。
- 部门名称。
- 所属板块。

这样页面上就不用每次都写很长的 `accountInfo.roleVO.departmentVO.name`。

### 7. 登录成功后跳转 redirect 或首页

登录页最后：

```js
const redirect = route.query.redirect;
const redirectUrl = redirect ? decodeURIComponent(redirect) : '/';
await router.replace(redirectUrl);
```

意思是：

- 如果之前用户访问了受保护页面，被拦到登录页，登录后回到原页面。
- 如果没有 redirect，就去 `/`。

注意：这个 `/` 不是最终首页，它会被路由守卫再转到第一个有权限的动态菜单。

### 8. router.beforeEach 做登录态守卫

`router/index.js` 是整个登录逻辑最关键的文件。

每次跳页面都会进：

```js
router.beforeEach(async(to, _from, next) => {
  const accountStore = useAccountStore();
  const permissionStore = usePermissionStore();
});
```

它分三类情况：

#### 情况一：去登录页

```js
if (to.path === '/login') {
    next();
    return;
}
```

访问 `/login` 直接放行。

#### 情况二：有 token

```js
if (accountStore.token) {
  await accountStore.getLoginInfo();
  await permissionStore.fetchPermissionInfo(shouldLoadPermission);
  const hasNewRoutes = shouldLoadPermission
      ? addRoutes(router, permissionStore.menuList)
      : false;
}
```

有 token 时，会做三件事：

1. 拉用户信息。
2. 拉权限信息。
3. 根据权限菜单动态添加路由。

如果用户访问的是 `/`：

```js
const firstDynamicRoutePath = getFirstDynamicRoutePath();
next(firstDynamicRoutePath);
```

系统会自动跳到第一个可访问菜单。

#### 情况三：没有 token

```js
resetAsyncRoutes(router);
permissionStore.resetPermission();
redirectToLogin(next, to);
```

没 token 时：

1. 清掉动态路由。
2. 清掉权限。
3. 跳到登录页。
4. 如果访问的是业务页面，会带上 `redirect`，方便登录后跳回来。

### 9. permissionStore 拉权限

权限 store 调用：

```js
const res = await apiGetRolePermissionInfo();
setPermissionInfo(res);
```

接口是：

```js
RequestClient({
  url: '/web/role/getPermission',
  method: 'post',
  data: params || {},
  loading,
});
```

`setPermissionInfo` 会拆出四份数据：

```js
menuList.value = getVisibleMenuList(normalizedList);
menuCodes.value = getMenuCodes(normalizedList);
ruleNames.value = getRuleNames(normalizedList);
dialogNames.value = getDialogNames(normalizedList);
loaded.value = true;
```

含义：

- `menuList`：可见菜单，用来生成动态路由和左侧菜单。
- `menuCodes`：菜单权限 code，用于 `v-permission:menu`。
- `ruleNames`：页面按钮权限 code，用于普通 `v-permission`。
- `dialogNames`：弹窗内权限 code，用于 `v-permission:dialog`。
- `loaded`：权限是否已经加载过。

### 10. permissionModel 动态注册路由

后端返回菜单以后，不是所有前端路由都能访问。

核心逻辑是：

```js
export function createAsyncRoutes(menuList) {
  const menuMap = createMenuMap(menuList);

  return allRoutes
    .filter((route) => menuMap.has(normalizePath(route.path)))
    .map((route) => mergeRouteWithMenu(route, menuMap.get(normalizePath(route.path))));
}
```

这段的意思是：

1. 先把后端菜单转成 `path -> menu` 的 Map。
2. 再拿前端写死的 `allRoutes` 去匹配。
3. 只有后端菜单里有的 path，才会注册到 router。

真正注册路由的是：

```js
router.addRoute(route);
```

这样用户没有某个菜单权限时，这个页面路由根本不会加进 router。

### 11. request.js 给请求自动带 token

请求拦截器里：

```js
config.headers.AUTHORIZATION = accountStore.token;
config.headers.AUTHORIZATIONID = accountId;
config.headers.ACCOUNT_SOURCE = "web";
```

每个业务请求都会自动带：

- `AUTHORIZATION`：token。
- `AUTHORIZATIONID`：账号 ID。
- `ACCOUNT_SOURCE`：固定 `web`。

例外是：

```js
const AUTH_FREE_URLS = new Set([
    '/web/login',
    '/login/verify/getPic',
]);
```

登录接口和验证码接口不需要 token。

### 12. 请求遇到 401 / 403 会退回登录页

响应拦截器里：

```js
if (codeNumber === 401 || codeNumber === 403) {
    redirectToLogin();
}
```

如果后端告诉前端：

- `401`：登录过期。
- `403`：无权限。

前端会：

1. 清掉登录态。
2. 跳回 `/login`。
3. 带上当前页面路径作为 redirect。

### 13. 退出登录会清三件东西

退出入口在 `LayoutHeader.vue`：

```js
await router.replace('/login');
resetAsyncRoutes(router);
permissionStore.resetPermission();
accountStore.logout();
```

退出时按顺序做：

1. 跳到登录页。
2. 清掉动态路由。
3. 清掉权限。
4. 清掉账号 token 和用户信息。

这就是完整闭环。

## 小白应该怎么模仿

写登录逻辑时，可以按这个顺序：

1. 登录页只管表单、校验、提交。
2. 账号 store 只管 token、用户信息、记住密码。
3. 权限 store 只管菜单权限、按钮权限。
4. request 拦截器只管请求头和接口错误。
5. router 守卫只管能不能进入页面。
6. 动态路由工具只管把后端菜单变成前端路由。

不要把所有东西都塞进登录页。

## 示例代码

示例代码仅供参考，需要你手动复制到项目中。

```js
// 1. 登录页只负责校验和提交，不直接操作太多全局状态
async function handleLogin() {
  // 先校验表单，避免空账号、空密码进入接口
  const valid = await formRef.value.validate();
  if (valid !== true) {
    return;
  }

  // 密码在提交前统一加密，页面里不要到处重复写加密逻辑
  const encryptedPassword = encryptPassword(formData.pass);

  // 真正登录交给 accountStore，方便其他地方复用登录状态
  await accountStore.login({
    user: formData.user,
    pass: encryptedPassword,
    remember: formData.remember,
  });

  // 登录成功后根据 redirect 回到原页面，没有 redirect 就进系统入口
  router.replace(route.query.redirect || '/');
}
```

```js
// 2. 路由守卫只负责判断能不能进入页面
router.beforeEach(async(to, from, next) => {
  // 没 token 时，只允许去登录页
  if (!accountStore.token) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
    return;
  }

  // 有 token 时，先保证用户信息和权限已经加载
  await accountStore.getLoginInfo();
  await permissionStore.fetchPermissionInfo();

  // 权限准备好以后，再放行页面
  next();
});
```

```js
// 3. 请求拦截器只负责统一加请求头
service.interceptors.request.use((config) => {
  // 每个业务请求都带 token，避免每个接口手写一遍
  config.headers.AUTHORIZATION = accountStore.token;

  // 后端需要账号 ID 时，也统一从 store 中取
  config.headers.AUTHORIZATIONID = accountStore.accountId;

  return config;
});
```

## 举一反三

同类登录系统一般都是这个固定套路：

- 登录页：收集账号密码，做校验，调用 store。
- account store：保存 token，保存用户信息，处理退出。
- permission store：保存菜单、按钮、弹窗权限。
- request：请求前带 token，请求后处理 401 / 403。
- router：进入页面前检查 token，加载用户和权限，动态注册路由。
- layout：根据动态路由渲染菜单，根据账号信息显示头像和退出按钮。

适合抽出去复用的内容：

- 密码加密函数。
- 用户信息 normalize 函数。
- 权限 normalize 函数。
- 动态路由生成函数。
- 统一退出登录函数。

适合用 `computed` 的内容：

- 是否已登录。
- 当前用户名。
- 当前头像地址。
- 当前菜单列表。

适合用独立函数的内容：

- `normalizeAccountInfo`
- `syncAccountDerivedFields`
- `redirectToLogin`
- `resetAuthState`
- `createAsyncRoutes`

## 一句话总结

这个 web 登录逻辑的核心套路是：登录页拿账号密码换 token，store 保存 token 和用户信息，router 根据 token 拉权限并动态加路由，request 每次请求带 token，遇到过期就清状态并回登录页。
