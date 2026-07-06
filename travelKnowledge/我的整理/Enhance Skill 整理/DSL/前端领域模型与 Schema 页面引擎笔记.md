记录时间：2026-07-06

## 这次真正要找的方向

一开始看的 DDD、Feature-Sliced Design 更偏“前端代码如何按业务领域组织”。但截图里的课程方向更具体，重点不是普通的领域模型文章，而是：

```text
领域模型 DSL
Schema 配置
解析引擎
模板引擎
SchemaSearchBar / SchemaTable / SchemaView
后台页面自动生成
```

也就是说，把页面常见结构抽象成配置，再由统一组件或引擎解析配置并渲染页面。

## 一句话理解

领域模型负责描述业务里有什么，Schema/DSL 负责把这些业务描述变成可执行配置，引擎负责读取配置并生成页面。

```text
业务概念
  -> 领域模型
  -> DSL / JSON Schema
  -> 解析引擎
  -> 页面组件
```

比如后台列表页可以被描述成：

```js
const pageSchema = {
  api: {
    list: getList,
    delete: deleteItem,
  },
  searchBar: [
    { label: '姓名', field: 'name', component: 'input' },
    { label: '状态', field: 'status', component: 'select' },
  ],
  table: [
    { title: '姓名', field: 'name' },
    { title: '手机号', field: 'phone' },
    { title: '状态', field: 'status', render: 'enumTag' },
  ],
  actions: ['search', 'reset', 'add', 'edit', 'delete'],
};
```

然后页面只写：

```vue
<SchemaView :schema="pageSchema" />
```

## 和普通工具函数的区别

普通工具函数通常只处理一个点：

```js
formatAmount(100);
```

Schema 页面引擎处理的是一整类页面：

```js
renderPageBySchema(pageSchema);
```

它减少重复工作的核心原因是：查询栏、表格、分页、按钮、接口请求、弹窗、删除确认这些流程在很多后台页面里都一样，只有字段、接口、文案、渲染方式不同。

## 和当前项目 approval 的关系

当前项目里这个目录已经有一点“轻量领域模型 + 展示引擎”的味道：

```text
packages/tool/src/approval/
  flow.js
  detailFields.js
  index.js
```

它现在做的是：

```text
后端原始审批详情
  -> buildApprovalDetailFields
  -> displayFields
  -> 页面详情渲染

后端原始审批流程
  -> buildApprovalFlows
  -> displayFlows
  -> 页面审批流渲染
```

所以它可以理解成：

```text
审批领域的前端展示模型
```

如果继续往截图里的“模板引擎”方向走，未来可能会变成：

```js
const approvalDetailSchema = {
  bizType: 'purchase_apply',
  detailApi: getPurchaseApplyInfo,
  fields: [
    { label: '单号', field: 'code' },
    { label: '创建人', field: 'creatorFullName' },
    { label: '采购明细', field: 'procureItemList', component: 'PurchaseItems' },
  ],
  flow: {
    source: 'workflowConfig',
    statusStrategy: 'approvalFlow',
  },
  actions: ['agree', 'reject', 'withdraw'],
};
```

页面变成：

```vue
<SchemaApprovalDetail :schema="approvalDetailSchema" />
```

## 推荐重点看的 GitHub 项目

### 1. baidu/amis

地址：https://github.com/baidu/amis

最贴近截图方向。

它的核心思想是：通过 JSON 配置生成后台页面。适合学习：

```text
schema
renderer
crud
form
service
page
```

可以重点看它如何用 JSON 描述页面，再由渲染器把 JSON 变成真实 UI。

### 2. aisuda/amis-admin

地址：https://github.com/aisuda/amis-admin

这是基于 amis 的后台应用模板。比 amis 本体更像“dashboard 模板引擎”的实际使用方式。

适合看：

```text
后台页面如何配置
菜单如何配置
CRUD 页面如何生成
amis 在真实管理后台中怎么落地
```

### 3. alibaba/lowcode-engine

地址：https://github.com/alibaba/lowcode-engine

阿里的低代码引擎，架构更大。适合后面看，不建议一开始就深读。

重点概念：

```text
设计器
物料
插件
schema
渲染内核
低代码协议
```

### 4. alibaba/formily

地址：https://github.com/alibaba/formily

表单领域的 Schema 引擎。适合理解“字段配置如何变成表单”。

重点看：

```text
JSON Schema
表单状态
字段联动
校验规则
自定义组件
```

### 5. xaboy/form-create

地址：https://github.com/xaboy/form-create

Vue 方向的动态表单引擎，上手比 Formily 轻。适合 Vue 项目参考。

重点看：

```text
规则配置
组件映射
动态表单渲染
表单提交数据结构
```

### 6. lljj-x/vue-json-schema-form

地址：https://github.com/lljj-x/vue-json-schema-form

轻量的 Vue JSON Schema 表单项目。适合入门理解 JSON Schema 如何描述数据结构和表单。

## 推荐学习顺序

```text
amis
  -> amis-admin
  -> form-create 或 vue-json-schema-form
  -> formily
  -> alibaba/lowcode-engine
```

不要一开始就啃低代码引擎源码。先理解“配置如何驱动页面”，再看大型引擎会轻松很多。

## 可以模仿到当前项目的方向

当前项目适合先从简单的 CRUD 页面引擎开始，而不是直接做完整低代码平台。

可以先抽：

```text
SchemaSearchBar
SchemaTable
SchemaDialog
SchemaView
```

一个后台页面就可以变成：

```vue
<SchemaSearchBar :schema="searchSchema" v-model="searchForm" />
<SchemaTable :schema="tableSchema" :data="list" />
```

再进一步：

```vue
<SchemaCrudPage :schema="pageSchema" />
```

这条路线和截图里的课程更接近。

## 最后记一句

前端领域模型不是一定要写成 DDD 那种实体和值对象。对后台系统来说，更实用的一种形态是：

```text
把业务字段、接口、状态、操作、渲染方式抽成 Schema，
再用统一引擎解释这个 Schema。
```

这就是截图里“领域模型 DSL 设计”“模板引擎”“SchemaTable”“SchemaSearchBar”的核心。
