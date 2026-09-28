# Vue 组件写作规则

模块标题格式：

```markdown
## UserForm（Vue 组件）
```

节内必须严格使用以下三级标题，顺序不能调整。

## 一句话说明

用一段话说清：

- 组件解决什么问题
- 适合什么场景
- 不适合什么场景

如果组件只适合表单弹窗，就明确写“不适合承载整页数据请求”。不要使用“功能强大”“灵活易用”一类空话。

## 快速开始

给一个最小可运行示例，必须包含：

1. 导入组件
2. 准备必需 Props
3. 绑定 `v-model`
4. 处理至少一个核心事件
5. 模板中的实际使用

示例格式：

````markdown
```vue
<script setup lang="ts">
import { ref } from 'vue'
import UserForm from '@/components/UserForm.vue'

const visible = ref(false)

// 必须传对象，组件内部直接读取 name 和 age
const formData = ref({
  name: '',
  age: 18,
})

function handleSuccess() {
  visible.value = false
}
</script>

<template>
  <el-button @click="visible = true">新增用户</el-button>
  <UserForm v-model="visible" :model-value="formData" @success="handleSuccess" />
</template>
```
````

如果源码中的 import 路径、依赖库或初始化步骤无法确认，写：

```markdown
<!-- TODO: 待作者确认 -->
```

## Props

必须使用表格：

| 名称 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `modelValue` | `boolean` | 是 | 无 | 控制弹窗显隐 |

规则：

- 名称与源码一致，使用行内代码。
- 类型写法优先保持 TypeScript 原意。
- 默认值必须来自源码或真实调用点；无法确认就写待确认。
- 不要遗漏复杂对象、数组、函数和插槽相关 Props。

## Emits

必须使用表格：

| 事件名 | 参数 | 触发时机 |
| --- | --- | --- |
| `success` | `data: UserVO` | 保存成功后触发 |

如果没有事件，不要删除小节，写：

```markdown
该组件不触发自定义事件。
```

## Slots

必须使用表格：

| 插槽名 | 作用域参数 | 说明 |
| --- | --- | --- |
| `footer` | 无 | 替换默认底部按钮 |

如果没有插槽，写：

```markdown
该组件不提供插槽。
```

## v-model

单独说明支持哪些 `v-model`，以及每个模型的语义。

默认模型：

```vue
<UserForm v-model="visible" />
```

具名模型：

```vue
<UserForm v-model:visible="visible" v-model:model-value="formData" />
```

如果只支持默认模型，也要明确写“只支持默认 `v-model`”。如果源码没有明确说明模型更新时机，标记待确认。

## 真实场景

至少给两个完整场景。每个场景包含标题、需求说明、可直接复制的代码和使用时注意点。

推荐场景：

- 新增数据
- 编辑并回显数据
- 只读查看
- 父组件保存后再刷新列表
- 错误处理和关闭确认

场景内部不要出现四级标题。使用粗体区分：

```markdown
**场景一：新增用户**

需求说明和完整代码。

**场景二：编辑用户并回显**

需求说明和完整代码。
```

## 常见坑

至少覆盖两个坑。每个坑使用“错误写法”和“正确写法”对照，并解释后果。

````markdown
**错误写法**

```vue
<UserForm :model-value="{ name: '' }" />
```

每次渲染都会创建新对象，子组件监听对象变化时可能重复执行。

**正确写法**

```vue
<script setup lang="ts">
const formData = ref({ name: '' })
</script>

<template>
  <UserForm :model-value="formData" />
</template>
```
````
