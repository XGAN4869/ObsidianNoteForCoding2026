```js
import router from './index.js'
import { useAccountStore } from '@/store/index.js'
import NProgress from 'nprogress' // 引入nprogress插件
import 'nprogress/nprogress.css'  // 这个nprogress样式必须引入
import { getItem } from '@/composables/auth.js'
import { MessagePlugin } from 'tdesign-vue-next'

//TODO: 去查一下为什么 pinia 不能写外面？
//TODO: 刷新页面后, 整个 js 文件重置, 这个 isAuthenticated 也变为了 false
let isAuthenticated = false

// 路由守卫
router.beforeEach(async(to, from) => {
  const accountStore = useAccountStore()
  NProgress.start()
  //有 token
  if (getItem('token')) {
    if (!isAuthenticated) {
      try{
        await accountStore.loginInfo()
      }catch(e){
        router.push('/login')
      }
      isAuthenticated = true
      return to.fullPath || '/'
    }
    //防止用户重复登录
    if (to.path === '/login') {
      return '/'
    }
  } else {
    //Token 不存在
    if (to.path !== '/login') {
      MessagePlugin.error('请先登录')
      //避免无限重定向,重定向到目标路由，给登陆页用
      return `/login?redirect=${encodeURIComponent(to.fullPath)}`
    }else{
      //主动退出登录，把isAuthenticated 的信息清空一下
      isAuthenticated = false
    }
  }

  return true
})

router.afterEach((to, from) => {
  NProgress.done()
})

```