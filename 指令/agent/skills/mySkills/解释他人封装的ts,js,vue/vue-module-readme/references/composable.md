# 组合式 Hook 写作规则

模块标题格式：

```markdown
## useInitTable（组合式 Hook）
```

节内必须严格使用以下三级标题，顺序不能调整。

## 一句话说明

用一段话回答两个问题：

- 它解决什么问题
- 什么场景不适合使用

不要只写“封装了表格逻辑”。要说明它是否负责请求、分页、竞态、状态持久化、响应适配或生命周期。

## 快速开始

必须包含：

1. import
2. 选项对象
3. 解构返回值
4. 模板或业务函数中的使用

示例必须完整可运行，并在注释中说明关键输入、返回值和调用时机。

```vue
<script setup lang="ts">
import { useInitTable } from '@/composables/useInitTable'
import { getUserPage } from '@/api/user'
import type { UserQuery, UserPage, UserVO } from '@/types'

// getTable 必须返回包含 records 和分页信息的响应
const {
  searchFormParams,
  tableData,
  loading,
  handleSearch,
  resetAllForm,
} = useInitTable<UserQuery, UserQuery, UserPage, UserVO>({
  getTable: (query, pagination) => getUserPage({ ...query, ...pagination }),
  initialSearchParams: { name: '' },
  immediate: true,
})
</script>

<template>
  <el-input v-model="searchFormParams.name" />
  <el-button @click="handleSearch">查询</el-button>
  <el-button @click="resetAllForm">重置</el-button>

  <el-table v-loading="loading" :data="tableData">
    <el-table-column prop="name" label="姓名" />
  </el-table>
</template>
```

## 选项对象

必须使用表格：

| 名称 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `getTable` | `(query, pagination) => Promise<Response>` | 是 | 无 | 真正执行列表请求 |

除接口本身外，还要说明：

- 哪些选项会改变请求参数
- 哪些选项影响响应结构
- 哪些选项影响生命周期
- 哪些选项具有并发或重复请求语义

## 返回值

必须使用表格：

| 名称 | 类型 | 说明 | 什么时候用 |
| --- | --- | --- | --- |
| `tableData` | `Ref<T[]>` | 当前页表格数据 | 传给表格组件 |

如果返回值是只读的，要明确写“只能读取，不能由页面直接修改”。如果返回值实际是可写状态，也要说明允许修改的范围。

## 真实场景

至少给三个完整场景：

1. 基础分页查询
2. 新增或编辑成功后刷新
3. 失败处理、并发搜索或响应结构转换中的至少一种

复杂场景应继续使用可运行代码，不能只列步骤。

## 生命周期与调用时机

明确写清：

- 必须在 `setup` 顶层还是可在普通函数中调用
- `immediate`、`onMounted` 或外部手动触发分别何时请求
- 组件卸载时是否会取消、清理或失效请求
- 页面参数变化时如何使用 `watch`
- 多次调用时状态是否相互隔离

如果源码没有实现取消、清理或隔离，不要暗示已经实现，直接写现状。

## 常见坑

至少覆盖三个坑，优先写这些：

- 在请求函数中重复拼接分页参数
- 直接修改只读 loading
- 忽略请求竞态
- 重置后忘记重新查询
- 响应结构不匹配导致表格为空
- 在组件外部调用生命周期钩子

每个坑都要给错误写法和正确写法。
