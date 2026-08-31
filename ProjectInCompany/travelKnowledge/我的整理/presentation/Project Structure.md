## 总结

这个项目本质上是一个 `pnpm workspace` 管理的前端 monorepo。

它把后台管理端、小程序端和公共业务包放在同一个仓库里：

- `sites/web`：Vue3 + Vite + TDesign 的后台管理系统。
- `sites/uniapp`：uni-app + Vue3 的小程序端。
- `packages/api`：统一接口层。
- `packages/enums`：公共枚举。
- `packages/tool`：公共工具函数。

小程序分包主要通过 `sites/uniapp/src/pages.json` 的 `subPackages` 配置完成。

主包只保留登录、首页、业务菜单、个人中心等高频入口页面。

审批、考勤、客诉、会议、岗位反馈、报警、临时工等业务页面按模块放进不同分包，减少主包体积，也让业务边界更清楚。

## 负责模块

我负责梳理这个项目时，重点看了两层结构：

第一层是项目级结构。

项目根目录下真正的前端主工程是 `travel-web`。它通过 `pnpm-workspace.yaml` 把 `packages/*` 和 `sites/*` 纳入同一个 workspace。

第二层是小程序分包结构。

小程序端在 `sites/uniapp/src/pages.json` 中配置主包页面和 `subPackages`。主包负责承载入口，分包负责承载具体业务。

这样做的好处是：公共能力可以复用，业务模块可以按端、按功能拆开，后续新增业务时不会全部堆到一个目录里。

## 1. 项目整体结构

### 1.1 根目录结构

```text
C:\Project\travel
├─ travel-web/          # 前端主工程
├─ docs/                # 项目说明和学习沉淀
├─ ObsidianNote/        # 代码分析笔记
├─ Presentation/        # 面试/汇报整理文档
└─ *.py / *.md          # 部分后端接口参考和临时说明文档
```

面试表达：

我会先说明这个项目不是单页面散装项目，而是一个 monorepo。核心代码都在 `travel-web` 里，根目录还放了项目文档、接口参考和汇报材料。

### 1.2 `travel-web` 工程结构

```text
travel-web
├─ sites/
│  ├─ web/              # 后台管理端
│  └─ uniapp/           # 小程序端
├─ packages/
│  ├─ api/              # 接口封装
│  ├─ enums/            # 公共枚举
│  └─ tool/             # 公共工具
├─ pnpm-workspace.yaml
└─ package.json
```

关键逻辑：

- `pnpm-workspace.yaml` 声明 `packages/*` 和 `sites/*`。
- `sites/web/package.json` 和 `sites/uniapp/package.json` 都依赖 `@travel/api`、`@travel/enums`、`@travel/tool`。
- `packages/api/src/config.js` 通过 `setRequestClient` 注入请求实现。
- web 端在 `sites/web/src/utils/request.js` 用 axios 注入请求。
- 小程序端在 `sites/uniapp/src/utils/request.js` 用 `uni.request` 注入请求。

面试表达：

我把公共接口、枚举、工具函数放到 `packages` 里，两个端只负责自己的页面和运行环境。这样 web 端和小程序端可以共用同一套 API 方法，但请求底层可以分别走 axios 和 `uni.request`。

## 2. 后台管理端结构

后台管理端在 `sites/web`。

```text
sites/web/src
├─ assets/              # 静态资源
├─ components/          # 通用组件、业务组件、布局组件
├─ config/              # 表格列、单元格渲染等配置
├─ directives/          # 权限指令
├─ hooks/               # 组合式函数
├─ pages/               # 业务页面
├─ router/              # 静态路由、业务路由、动态权限路由
├─ store/               # Pinia 状态
├─ style/               # 全局样式、变量、业务样式
└─ utils/               # 请求、权限、工具函数
```

后台端的路由拆分方式：

- `router/modules/businessRoutes.js` 放业务模块路由，比如审批、组织、临时工、考勤、财务、物料、车辆、客诉、岗位反馈、奖惩。
- `router/modules/systemRoutes.js` 放系统管理路由，比如系统配置、角色权限、薪资规则、操作日志。
- `router/index.js` 负责登录校验、权限加载、动态路由注册和无权限跳转。

面试表达：

后台端没有用小程序意义上的分包，而是做了路由模块拆分。业务路由和系统路由分开维护，再通过权限接口动态决定用户能看到哪些菜单。

## 3. 小程序端结构

小程序端在 `sites/uniapp`。

```text
sites/uniapp/src
├─ pages/               # 主包页面
├─ packageApproval/     # 审批分包
├─ packageAttendance/   # 考勤分包
├─ packageOther/        # 其他业务分包
├─ components/          # 公共组件
├─ constants/           # 常量
├─ services/            # 定位上报等服务
├─ static/              # 小程序静态资源
├─ store/               # Pinia 状态
├─ style/               # 全局样式
├─ utils/               # 请求、图片、鉴权、坐标等工具
└─ pages.json           # 页面和分包配置
```

入口逻辑：

- `main.js` 注册 Pinia、持久化插件、TDesign 组件和导航鉴权拦截器。
- `App.vue` 处理小程序生命周期，比如启动时拉取系统信息、回到前台时恢复定位上报、注册截屏/录屏审计。
- `utils/auth-guard.js` 拦截 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab`，未登录访问非公开页面时跳登录。
- `utils/request.js` 统一处理 `uni.request`、Token 请求头、错误提示、401/403 跳登录。

面试表达：

小程序端主包只放入口页面和全局能力。请求、鉴权、状态管理、公共组件放在主包可复用目录里，业务功能通过分包承载。

## 4. 小程序分包是怎么做的

### 4.1 主包页面

`pages.json` 的 `pages` 配置了主包页面：

```text
pages/index/index       # 首页
pages/login/login       # 登录页
pages/business/index    # 业务菜单
pages/profile/index     # 我的
pages/profile/setting   # 设置
```

其中 `tabBar` 配置了三个主入口：

- 首页：`pages/index/index`
- 菜单：`pages/business/index`
- 我的：`pages/profile/index`

项目使用自定义 tabbar，组件是 `components/CustomTabBar/index.vue`。

点击 tab 时通过 `uni.switchTab` 切换主包 tab 页面。

面试表达：

我没有把所有业务都放在 tabbar 里。tabbar 只保留首页、菜单、我的这三个高频入口，具体业务通过菜单页进入分包。

### 4.2 审批分包

配置位置：`pages.json -> subPackages -> packageApproval`

```text
root: packageApproval/
name: approval
pages:
  approval/index        # 单据审批
  detail/detail         # 审批详情
  audit/index           # 审批处理
```

对应目录：

```text
src/packageApproval
├─ approval/
│  ├─ index.vue
│  ├─ detail.vue
│  └─ detailConfig.js
├─ detail/
│  └─ detail.vue
└─ audit/
   └─ index.vue
```

作用：

审批相关页面放在一个独立分包里。用户从首页或业务菜单进入审批列表，再从审批列表进入详情或处理页。

关键跳转：

- `pages/index/index.vue` 会跳到 `/packageApproval/approval/index`。
- `packageApproval/approval/index.vue` 会根据列表项跳到 `/packageApproval/detail/detail` 或 `/packageApproval/audit/index`。

面试表达：

审批是一个相对完整的业务闭环，所以我把列表、详情、处理页放到同一个分包。这样用户进入审批模块时才加载审批相关页面，主包不需要提前加载这些代码。

### 4.3 考勤分包

配置位置：`pages.json -> subPackages -> packageAttendance`

```text
root: packageAttendance
name: attendance
pages:
  attendance/index              # 考勤管理
  attendance-record/index       # 我的考勤记录
  attendance-supplement/index   # 提交补卡申请
  attendance-leave/index        # 提交请假申请
```

对应目录：

```text
src/packageAttendance
├─ attendance/
│  ├─ index.vue
│  ├─ locationPermission.js
│  └─ components/
│     └─ AttendanceLocationSelector.vue
├─ attendance-record/
│  └─ index.vue
├─ attendance-supplement/
│  └─ index.vue
└─ attendance-leave/
   └─ index.vue
```

作用：

考勤模块包含打卡、定位权限、考勤记录、补卡、请假。这些页面和能力关联紧密，所以放在 `packageAttendance`。

关键跳转：

- `packageAttendance/attendance/index.vue` 可以跳到考勤记录和请假申请。
- `packageAttendance/attendance-record/index.vue` 可以跳到补卡申请。

面试表达：

考勤模块比较重，既有打卡，又有定位和申请流程。我把它独立成考勤分包，避免这些代码进入主包，同时保持模块内部页面跳转集中。

### 4.4 其他业务分包

配置位置：`pages.json -> subPackages -> packageOther`

```text
root: packageOther
name: other
pages:
  alarm/index                     # 一键报警
  meeting/index                   # 会议纪要
  feedback/index                  # 岗位反馈与建议
  customer-complaint/index        # 客诉管理
  customer-complaint/detail       # 内部客诉管理
  temp-worker/index               # 临时工管理
```

对应目录：

```text
src/packageOther
├─ alarm/
├─ meeting/
├─ feedback/
├─ temp-worker/
└─ customer-complaint/
   ├─ index.vue
   ├─ detail.vue
   ├─ ComplaintCreateForm.vue
   ├─ ComplaintDialog.vue
   ├─ components/
   └─ utils/
```

作用：

`packageOther` 承载频次相对独立、但又不适合继续放主包的业务页面。

其中客诉模块内部又拆了组件和工具函数，比如分页、详情状态、弹窗权限、记录标准化等。

面试表达：

`packageOther` 不是随便堆页面，而是把一些独立业务放在一个低频业务分包里。像客诉这种内部逻辑较多的模块，还会在分包内部继续拆组件和工具函数。

## 5. 分包入口和权限是怎么串起来的

小程序业务入口在 `pages/business/index.vue`。

它不是直接写死全部菜单，而是从 `permission` store 里拿 `menuList`。

权限 store 在 `store/modules/permission.js` 里做了几件事：

1. 定义 `BUSINESS_MENU_DEFINITIONS`。
2. 把后台返回的菜单名称或 `vueUrl` 映射成小程序页面路径。
3. 过滤 `display === true` 的菜单和按钮。
4. 生成最终可见的 `menuList`。
5. 业务菜单页点击后统一通过 `uni.navigateTo({ url: item.path })` 进入分包。

典型映射关系：

```text
单据审批       -> /packageApproval/approval/index
考勤与排班     -> /packageAttendance/attendance/index
一键报警       -> /packageOther/alarm/index
会议纪要       -> /packageOther/meeting/index
岗位反馈       -> /packageOther/feedback/index
客诉管理       -> /packageOther/customer-complaint/index
临时工管理     -> temp-worker-dialog 或 packageOther/temp-worker/index
```

面试表达：

小程序分包不是孤立存在的。用户先进入主包的业务菜单页，菜单数据由权限接口控制。权限 store 把后台菜单映射成小程序分包路径，点击菜单时再 `navigateTo` 到对应分包页面。

## 6. 数据从哪里来、如何处理、如何展示

整体数据流可以这样讲：

```text
用户登录
  -> 保存 Token 和用户信息
  -> 请求权限接口
  -> permission store 标准化菜单
  -> 业务菜单页 computed 生成展示项
  -> 用户点击菜单
  -> uni.navigateTo 进入分包页面
  -> 分包页面调用 @travel/api
  -> @travel/api 通过注入的 RequestClient 发请求
  -> 页面更新列表、详情或表单状态
```

关键点：

- 接口方法统一在 `packages/api`。
- web 和 uniapp 使用同一套 API 方法。
- 请求底层由各端注入。
- 小程序端请求会自动带 `AUTHORIZATION`、`AUTHORIZATIONID`、`ACCOUNT_SOURCE: app`。
- 后台端请求会自动带 `AUTHORIZATION`、`AUTHORIZATIONID`、`ACCOUNT_SOURCE: web`。

面试表达：

数据不是页面里直接拼接口请求。页面调用 `@travel/api`，API 层再走当前端注入的请求客户端。这样页面只关心业务参数，请求头、登录过期、错误提示这些通用逻辑都放在请求封装里。

## 7. 关键代码模块拆解

### 7.1 `pnpm-workspace.yaml`

作用：

声明 monorepo 范围。

关键逻辑：

它把 `packages/*` 和 `sites/*` 都加入 workspace，所以站点项目可以用 `workspace:*` 引用内部公共包。

面试表达：

我用 workspace 把应用和公共包统一管理，避免每个端复制一套 API、枚举和工具函数。

### 7.2 `packages/api/src/config.js`

作用：

提供请求客户端注入能力。

关键逻辑：

`setRequestClient(client)` 保存当前端的请求实现，API 方法内部通过 `RequestClient` 发请求。

面试表达：

公共 API 包不直接依赖 axios 或 `uni.request`。它只依赖一个抽象的 `RequestClient`。web 端和小程序端启动时分别注入自己的实现。

### 7.3 `sites/uniapp/src/pages.json`

作用：

声明小程序主包页面、分包页面、tabbar、全局样式和组件自动导入规则。

关键逻辑：

`pages` 放主包页面，`subPackages` 放业务分包，`lazyCodeLoading: requiredComponents` 开启组件按需注入。

面试表达：

小程序分包主要就是在 `pages.json` 里做声明。主包负责入口，业务模块按 root 拆成不同分包。

### 7.4 `store/modules/permission.js`

作用：

把后台权限菜单转换成小程序可展示、可跳转的菜单。

关键逻辑：

`BUSINESS_MENU_DEFINITIONS` 定义小程序菜单路径，`fetchPermissionInfo` 调接口拿权限，`setPermissionInfo` 标准化出 `menuList`、`menuCodes`、`ruleNames`、`dialogNames`。

面试表达：

这里解决的是“后台权限菜单”和“小程序真实页面路径”不完全一致的问题。我用一层映射表把它们对齐，页面只需要渲染最终菜单。

### 7.5 `pages/business/index.vue`

作用：

展示业务菜单并负责进入分包。

关键逻辑：

`menuItems` 用 `computed` 合并权限菜单和本地图标配置，点击菜单后根据 `item.path` 走 `uni.navigateTo`。

面试表达：

业务菜单页是主包到分包的入口。它既受权限控制，也统一处理图标、文案和跳转。

### 7.6 `utils/auth-guard.js`

作用：

统一处理小程序导航鉴权。

关键逻辑：

它拦截 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab`。如果用户没有 Token 且目标页面不是公开路由，就重定向到登录页。

面试表达：

我没有在每个页面单独判断登录，而是在导航层做统一拦截。这样主包和分包页面都能复用同一套登录校验。

## 8. 分包这样设计解决了什么问题

### 问题一：主包体积容易变大

如果所有页面都放到 `pages`，审批、考勤、客诉等业务都会进入主包。

现在主包只保留入口页，业务页进入分包。

面试表达：

这样可以减少小程序首次加载压力，用户进入具体业务时才加载对应分包。

### 问题二：业务边界不清楚

如果所有页面都堆在 `pages` 下，后续维护时很难判断页面属于哪个模块。

现在按业务拆成：

- 审批：`packageApproval`
- 考勤：`packageAttendance`
- 其他低频业务：`packageOther`

面试表达：

分包不仅是性能优化，也是业务结构优化。每个业务模块有自己的目录，页面、组件、工具可以就近维护。

### 问题三：后台权限和小程序路径不一致

后台管理端的路径可能是 `/approval`、`/attendance`，小程序真实路径是 `/packageApproval/approval/index`。

项目用 `BUSINESS_MENU_DEFINITIONS` 做映射。

面试表达：

我通过映射表把后台权限菜单转换成小程序分包路径，避免把后端菜单结构强行改成小程序目录结构。

## 9. 可能被问到的问题

### Q1：这个项目整体是什么结构？

A：

这是一个 `pnpm workspace` 的 monorepo。`sites` 放应用端，包括后台 web 和小程序 uniapp。`packages` 放公共能力，包括 API、枚举和工具函数。这样两个端可以复用公共逻辑，但页面和运行环境各自独立。

### Q2：小程序为什么要做分包？

A：

因为小程序主包不适合放太多业务页面。项目里审批、考勤、客诉这些模块页面多、逻辑重。如果都放主包，会影响首次加载。分包后，主包只放首页、登录、菜单、我的，业务模块在用户进入时再加载。

### Q3：分包具体怎么配置？

A：

在 `sites/uniapp/src/pages.json` 里配置。`pages` 是主包页面，`subPackages` 是分包数组。每个分包配置 `root`、`name` 和 `pages`。比如审批分包 root 是 `packageApproval/`，考勤分包 root 是 `packageAttendance`。

### Q4：用户从主包怎么进入分包？

A：

用户先进入主包的业务菜单页 `pages/business/index.vue`。这个页面从 `permission` store 取菜单数据。菜单项里有分包路径，点击后通过 `uni.navigateTo` 跳到对应分包页面。

### Q5：分包页面有没有权限控制？

A：

有。权限控制主要有两层。第一层是菜单权限，`permission` store 只生成用户可见菜单。第二层是导航鉴权，`auth-guard.js` 拦截小程序导航方法，没有 Token 时会跳登录页。

### Q6：web 端和小程序端怎么复用接口？

A：

公共接口都在 `packages/api`。API 包本身不写死 axios 或 `uni.request`，而是通过 `setRequestClient` 注入请求方法。web 端注入 axios，小程序端注入 `uni.request`。

### Q7：为什么 `packageOther` 里放多个模块？

A：

审批和考勤是比较完整、比较重的模块，所以单独分包。报警、会议、岗位反馈、客诉、临时工属于相对独立但单独建包成本较高的业务，所以放在 `packageOther`。其中客诉模块内部又继续拆了组件和工具函数。

### Q8：后台端有没有分包？

A：

后台端没有小程序意义上的分包。它主要是路由模块拆分。`businessRoutes.js` 放业务路由，`systemRoutes.js` 放系统管理路由，再由权限逻辑动态注册可访问路由。

## 10. 一句话总结

这个项目通过 monorepo 把 web、小程序和公共包统一管理；小程序端再通过 `pages.json` 的 `subPackages` 把审批、考勤和其他业务拆成分包，实现主包轻量化、业务模块清晰化和权限入口统一化。
