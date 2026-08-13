```js
import { ref, reactive, watch } from 'vue'  
import { MessagePlugin } from 'tdesign-vue-next'  
  
//列表查询, 分页, 搜索封装    || opt = {} 函数参数默认值, 用来兜底  
export default function useInitTable(opt = {}) {  
  const loading = ref(false)  
  
  //分页-------------------------------------------  
  const pagination = reactive({  
    current: 1, //当前页  
    pageSize: 10, //每页几条  
    total: 0, //总数据  
  })  
  
  const handlePageChange = async (pageInfo) => {  
    pagination.current = pageInfo.current  
    pagination.pageSize = pageInfo.pageSize  
    await fetchTableData()  
  }  
  
  //搜索-----------------------------------------  
  //searchForm, 可插拔 searchForm, 默认无 searchForm, 传了就有👇，只执行一次  
  let searchFormParams = null  
  let resetAllForm = null  
  let resetForm = null  
  //loading  
  const searchLoading = ref(false)  
  
  //判断有无 opt.searchFormParams, 有👇 P.S.此行以及以上是初始化刚挂载的时候才执行一次，之后就是执行单独的函数了  
  if (opt.searchFormParams) {  
    //reactive 会直接修改传入对象，所以需要解构  
    searchFormParams = reactive({ ...opt.searchFormParams })  
    //1. 重置所有表单 / 用 for key in s... ，将初始值给到  
    resetAllForm = async () => {  
      //P.S. 由于 时间 有初始值，所以重置后还是有  
      Object.assign(searchFormParams, { ...opt.searchFormParams })  
      try {  
        searchLoading.value = true  
        await fetchTableData()  
      } finally {  
        searchLoading.value = false  
      }  
    }  
    //2. 重置局部表单, 考虑数组的情况  
    resetForm = async (field) => {  
      searchFormParams[field] = ''  
      await fetchTableData()  
    }  
  }  
  const delay = (ms) => {  
    return new Promise((resolve) => {  
      setTimeout(resolve, ms)  
    })  
  }  
  async function handleSearch() {  
    pagination.current = 1  
    try {  
      searchLoading.value = true  
      await delay(300)  
      await fetchTableData()  
    } finally {  
      searchLoading.value = false  
    }  
  }  
  // // 直接在组合函数内部写 onBeforeUnmount,但是这种写法不能 await 了  
  // onBeforeUnmount(() => {  
  //   console.log('组合函数内部：组件销毁，清除定时器')  
  //   clearTimeout(timerId)  // })  //数据--------------------------------------------  
  const tableData = ref([])  
  //fetchTableData  
  async function fetchTableData() {  
    loading.value = true  
    try {  
      //TODO: 前置逻辑, 给时间写的，为了方便转化,这玩意我的理解是？不仅可以接收新参数，还可以继续拼接？  
      let requestParams = searchFormParams  
      if (typeof opt.transformParams === 'function') {  
        try {  
          requestParams = opt.transformParams({ ...searchFormParams })  
        } catch (e) {  
          requestParams = { ...searchFormParams }  
        }  
      }  
      const res = await opt.getTable(requestParams || {}, {  
        [opt?.paginationParams?.[0] ?? 'current']: pagination.current,  
        [opt?.paginationParams?.[1] ?? 'size']: pagination.pageSize,  
      })  
      let recordsObj = {}  
  
      if (opt.onSuccess && typeof opt.onSuccess === 'function') {  
        recordsObj = opt.onSuccess(res)  
      }  
      tableData.value = res.records ?? recordsObj.records ?? res.data  
      const { current, size, total } = res || res.data  
      Object.assign(pagination, {  
        current: Number(current),  
        pageSize: Number(size),  
        total: Number(total),  
      })  
    } finally {  
      loading.value = false  
    }  
  }  
  
  //列配置--------------------------------------------  
  const columnConfig = reactive({  
    placement: 'top-right',  
    hideTriggerButton: true, // 隐藏组件自带按钮，改用模板中的“列设置”按钮  
    dialogProps: {  
      header: '列配置',  
      confirmBtn: '确定',  
      cancelBtn: '取消',  
    },  
  })  
  
  //排序--------------------------------------------  
  async function sortChange(item) {  
    Object.assign(searchFormParams, {  
      ...opt.searchFormParams,  
      sortField: item.sortBy,  
      sortOrder: item.descending ? 'dsc' : 'asc',  
    })  
    await fetchTableData()  
  }  
  
  //状态修改  
  //修改密码 t-pop  const loadingButton = ref(false)  
  
  const changePopConfirm = async (id, key) => {  
    // 方法映射  
    const apiMap = {  
      // resetPass: opt.resetPass,  
      delete: opt.delete,  
      status: opt.status,  
    }  
  
    try {  
      const apiFn = apiMap[key]  
      if (key === 'status') {  
        await apiFn({ userId: id })  
        MessagePlugin.success('状态修改成功')  
      } else if (key === 'delete') {  
        await apiFn(id)  
        MessagePlugin.success('删除成功')  
      }  
      fetchTableData()  
    } finally {  
      loadingButton.value = false  
    }  
  }  
  
  //分页  
  return {  
    //搜索  
    searchFormParams,  
    resetAllForm,  
    resetForm,  
    loading,  
    //分页  
    pagination,  
    handlePageChange,  
    //表格数据  
    tableData,  
    fetchTableData,  
    //列配置  
    columnConfig,  
    //排序  
    sortChange,  
    //  
    changePopConfirm,  
    loadingButton,  
    //search  
    handleSearch,  
    searchLoading,  
  }  
}
```