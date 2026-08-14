```js
# `useInitForm` 代码复盘与通用复用格式

本文对应 `src/composables/form/useInitForm.js`，用于下次创建“弹窗表单 + 校验 + 查询回显 + 提交”的 composable 时直接参考。

## 一、当前实现做得怎么样

整体思路是对的：把表单数据、校验引用、提交 loading、查询回显和提交动作集中管理，页面组件只负责业务字段和接口。当前代码已经能支撑用户模块的新增、编辑、充值等场景。

做得比较好的地方：

- 使用 `reactive` 保存 `formData`，通过 `Object.assign` 重置，能保持模板绑定的对象引用不变。
- 提交前有 loading 锁，且在 `finally` 中恢复，能避免重复点击后一直 loading。
- `transformParams` 允许不同页面把表单数据转换成接口需要的参数。
- 查询回显也在 `finally` 中关闭 loading，基本的请求状态处理是完整的。
- `onSuccess` 交给页面处理刷新列表、提示消息等业务动作，职责边界比较清楚。

## 二、需要重点注意的问题

### 必须优先修正

1. **`rowId` 是模块级共享状态**

```js
let rowId = ref(null)
```

所有 `useInitForm()` 实例都会读写同一个 id。现在父组件和多个子组件依赖它传递 id，所以暂时能工作；但只要两个弹窗同时打开、异步回显交错，或者以后把 composable 用到别的页面，就可能互相覆盖。通用写法应把 `rowId` 放进函数内部，让每个实例独立持有。

2. **弹窗显隐状态和 `v-model:visible` 没有统一来源**

`open()` 只修改 composable 自己的 `modalState[key]`。子组件实际使用的是 `defineModel('visible')`，因此子组件内部调用 `open()` 并不能自动关闭或打开父组件传入的 visible。这也是调用方出现“必须手动 `visible.value = false`”注释的原因。建议由父组件统一持有弹窗 visible，composable 只处理表单；或者让 composable 明确返回一个单独的 `visible` ref，不要同时维护两套状态。

3. **校验引用没有保护**

```js
const valid = await formRef.value.validate()
```

如果模板忘记绑定 `ref="formRef"`，这里会直接抛出 TypeError，而且发生在 `try` 外部。通用代码应先判断 `formRef.value?.validate`，并对校验异常做统一处理。

4. **接口函数是否存在没有明确约束**

`fetchFormData()` 默认直接调用 `opt.getInfo(id)`，提交时直接调用 `opt.submitForm(...)`。如果只是复用表单状态、没有查询或提交接口，会在用户操作时才报错。建议在调用前给出明确错误，或者让这两个能力变成可选功能。

### 建议改进

- `resetSingleForm` 不需要声明为 `async`；固定写入空字符串也不适合数字、数组、对象等字段。至少应允许调用方传入默认值，复杂表单最好重新执行 `createEmptyForm()`。
- `createEmptyForm` 应是“工厂函数”，每次返回新对象，避免多个实例共享嵌套对象或数组。
- `typeof opt.transformParams === 'function' && opt.transformParams` 后半段是重复判断。
- `console.log('key', key)` 应删除或改成可控的调试日志。
- `onSuccess` 如果可能是异步函数，应使用 `await`；否则回调异常和提交重置时机都不容易控制。
- 当前 `fetchFormData` 返回接口原始响应，但不同调用方有的读取 `res.username`，有的读取 `res.data[0]`。建议在 composable 内统一“响应解析”，或在 `mapResponse` 中明确转换。
- `resetForm` 使用的是浅层 `Object.assign`。表单里若有嵌套对象/数组，需要在工厂函数里返回全新的嵌套值，必要时再做深拷贝。
- `watch` 被当前文件导入但未使用，应删除。

## 三、下次可直接复用的通用格式

下面这版把“表单状态”和“弹窗显隐”分开，`rowId` 为实例级状态，查询/提交接口均可选，适合 Vue 3 `script setup`。

```js
// composables/form/useForm.js
import { computed, reactive, ref, toRaw } from 'vue'

export default function useForm(options = {}) {
  const {
    // 必须是函数：每次调用都返回全新的初始对象
    createEmptyForm = () => ({}),
    rules = {},
    getInfo,
    submitForm,
    // (rawFormData, rowId) => payload
    transformParams,
    onSuccess,
    onError,
  } = options

  const formData = reactive(createEmptyForm())
  const formRef = ref(null)
  const rowId = ref(null)
  const loadingDialog = ref(false)
  const submitLoading = ref(false)

  const resetForm = () => {
    Object.assign(formData, createEmptyForm())
  }

  const resetField = (field, defaultValue = '') => {
    formData[field] =
      typeof defaultValue === 'function' ? defaultValue() : defaultValue
  }

  const loadForm = async (id = rowId.value) => {
    if (typeof getInfo !== 'function') {
      throw new Error('useForm: 未配置 getInfo，不能查询表单数据')
    }

    rowId.value = id ?? null
    loadingDialog.value = true
    try {
      return await getInfo(id)
    } finally {
      loadingDialog.value = false
    }
  }

  const handleSubmit = async () => {
    if (submitLoading.value) return

    if (typeof formRef.value?.validate !== 'function') {
      throw new Error('useForm: 请确认模板已绑定 ref="formRef"')
    }
    if (typeof submitForm !== 'function') {
      throw new Error('useForm: 未配置 submitForm，不能提交表单')
    }

    const valid = await formRef.value.validate()
    if (valid !== true) return

    submitLoading.value = true
    try {
      const rawFormData = toRaw(formData)
      const payload = typeof transformParams === 'function'
        ? transformParams(rawFormData, rowId.value)
        : { ...rawFormData }

      const result = await submitForm(payload)
      if (typeof onSuccess === 'function') {
        await onSuccess(result)
      }
      resetForm()
      return result
    } catch (error) {
      if (typeof onError === 'function') {
        await onError(error)
      }
      throw error
    } finally {
      submitLoading.value = false
    }
  }

  const confirmBtnProps = computed(() => ({
    content: submitLoading.value ? '保存中...' : '保存',
    theme: 'primary',
    loading: submitLoading.value,
    disabled: submitLoading.value,
    onClick: handleSubmit,
  }))

  return {
    formData,
    formRef,
    rules,
    rowId,
    loadingDialog,
    submitLoading,
    confirmBtnProps,
    resetForm,
    resetField,
    loadForm,
    handleSubmit,
  }
}
```

## 四、调用方式

### 新增表单

```js
const { formData, formRef, rules, resetForm, confirmBtnProps } = useForm({
  createEmptyForm: () => ({
    username: '',
    status: '1',
  }),
  submitForm: apiAddUser,
  rules: userRules,
  onSuccess: () => {
    visible.value = false
    emit('success')
  },
})
```

### 编辑表单

```js
const { formData, formRef, rules, rowId, loadForm, handleSubmit } = useForm({
  createEmptyForm: () => ({ id: '', username: '', status: '1' }),
  getInfo: apiUserInfo,
  submitForm: apiUpdateUser,
  transformParams: (data, id) => ({
    ...data,
    id,
  }),
})

// visible 由父组件通过 v-model 传入；打开时再加载数据
watch(visible, async (value) => {
  if (!value || !props.id) return

  const response = await loadForm(props.id)
  Object.assign(formData, mapUserResponse(response))
})
```

父组件建议自己维护 `visible` 和 `selectedId`：

```vue
<edit-user v-model:visible="editVisible" :id="selectedId" />
```

这样就不需要用模块级变量在父子组件之间“偷传” id，也不会出现多个表单实例相互覆盖的问题。

## 五、复用时的检查清单

- `createEmptyForm` 是否为函数，并且每次返回新对象？
- 模板是否绑定了 `ref="formRef"`，并且表单组件确实提供 `validate()`？
- 新增和编辑是否明确区分了 `rowId`、回显映射和提交参数？
- `getInfo`、`submitForm` 是否在当前场景需要，未配置时是否会给出明确提示？
- 提交失败时是否保留表单内容，提交成功后是否再关闭弹窗和刷新列表？
- 接口响应结构是否在一个地方统一解析，避免页面分别读取 `res`、`res.data`、`res.data[0]`？
- 是否存在两个以上表单实例？如果有，禁止使用模块级 `ref` 保存当前行 id。
- 回显请求、提交请求、校验失败、重复点击和关闭后重新打开是否都手动验证过？

结论：当前 `useInitForm` 适合作为项目内的第一版抽取，但不建议原样复制到新模块。优先改掉共享 `rowId`、双重弹窗状态和无保护的 `formRef`，再按上面的“实例级状态 + 工厂函数 + 明确请求边界”格式复用。

```