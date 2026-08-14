```js
import { ref, reactive, computed,watch } from 'vue'  
  
//TODO:因为，父组件和子组件会创建两个不同的 useInitTable 实例，所以这个必须放全局  
let rowId = ref(null)  
  
export default function useInitForm(opt = {}) {  
  //表单显隐-------------------------------------------  
  const modalState = reactive({ ...opt.modalParams })  
  
  //表单数据---------------------------------------------  
  const formData = reactive({ ...opt.createEmptyForm })  
  
  //resetForm  
  const createEmptyForm = () => opt.createEmptyForm  
  const resetForm = () => {  
    //在原对象上改，因为传进去的 formData 是原对象的  
    Object.assign(formData, createEmptyForm())  
  }  
  //2. 重置局部表单, 考虑数组的情况  
  const resetSingleForm = (field, defaultValue = '') => {  
    formData[field] = ''  
    //TODO:如果你想，可以分个类，来重置不同类型的字段  
    typeof defaultValue === 'function' ? defaultValue() : defaultValue  
  }  
  
  //TODO: 这个不要了，之后让组件自己传递 props，因为跨组件调用方法了，导致你不得不把 rowId 放在全局  
  //TODO: 每次调用方法都是一个新的实例对象  
  const open = (key, id) => {  
    rowId.value = id ?? null  
    modalState[key] = true  
    console.log('key', key)  
  }  
  const loadingDialog = ref(false)  
  
  //TODO: 回显数据， return 的时候会自动包一个 Promise !!! 记得用 watch 配合 async 接收  
  async function fetchFormData(id) {  
    //TODO: 少了一些兜底  
  
    try {  
      loadingDialog.value = true  
      const res = await opt.getInfo(id)  
      return res  
    } finally {  
      loadingDialog.value = false  
    }  
  }  
  
  //rules  
  const rules = opt.rules  
  
  //表单按钮-------------------------------------------  
  //取消  
  const cancelBtnProps = {  
    content: '取消',  
    theme: 'default',  
    variant: 'base',  
  }  
  const submitLoading = ref(false)  
  //确认  
  const confirmBtnProps = computed(() => ({  
    content: submitLoading.value ? '保存中...' : '保存',  
    theme: 'primary',  
    loading: submitLoading.value,  
    disabled: submitLoading.value,  
    onClick: handleSubmit,  
  }))  
  
  //表单提交--------------------------------------------  
  
  //valid 判断  
  const formRef = ref()  
  
  const handleSubmit = async () => {  
    // 校验...  
    if (submitLoading.value) {  
      return  
    }  
    //校验  
    const valid = await formRef?.value?.validate() // 返回 Promise，永远 ≠ true    if (valid !== true) {  
      return  
    }  
    submitLoading.value = true  
    try {  
      let res = null  
      //TODO: 处理前置逻辑，这部分之后换一种写法，处理参数即可，不要重调整个函数  
      if (typeof opt.transformParams === 'function' && opt.transformParams) {  
        res = await opt.submitForm(opt.transformParams()) // 调接口  
      } else {  
        res = await opt.submitForm(formData) // 调接口  
      }  
      if (opt.onSuccess && typeof opt.onSuccess === 'function') {  
        //TODO: 这里有概率成功后用户还需要调用接口，所以需要 await       await opt.onSuccess(res)  
      }  
      resetForm()  
    } catch (err) {  
      console.error(err)  
    } finally {  
      submitLoading.value = false  
    }  
  }  
  
  return {  
    //loading  
    submitLoading,  
    //表单显示隐藏  
    modalState,  
    open,  
    //form  
    formData,  
    //reset  
    resetForm,  
    //rules  
    rules,  
    //按钮  
    cancelBtnProps,  
    confirmBtnProps,  
    //valid  
    formRef,  
    //submit，如果没用 confirmBtnProps,就要用 handleSubmit    handleSubmit,  
    //获取请求数据  
    fetchFormData,  
    //父组件传递过来的id  
    loadingDialog,  
    rowId,  
    resetSingleForm,  
  }  
}
```