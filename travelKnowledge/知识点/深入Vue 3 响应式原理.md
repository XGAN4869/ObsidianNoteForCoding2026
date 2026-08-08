```js
//Reference:https://cn.vuejs.org/guide/extras/reactivity-in-depth.html#what-is-reactivity


/*
Vue 响应式原理：原生 JS 无法追踪局部变量，但是 "对象属性" 可以被追踪
Vue3 用 Proxy 创响应式对象 、 getter / setter 用于 ref
*/


let A2

//必须被 reactive 中的 proxy 代理 or ref 的 getter 和 setter
// state 是 proxy 代理壳
const state = reactive({
    A0:1,
    A1:2,
})
//------------------------Effect 写法一---------------------------------
//A0 和 A1 是"依赖" dep
//update() 是 "订阅者"/ "副作用" effect
function update() {
  A2 = state.A0 + state.A1
}
whenDepsChange(update)

//------------------------Effect 写法二---------------------------------
// but，如何监听到 A0 和 A1？
/* 
0 因此需要一个魔法函数 whenDepsChange(update) 是这个东西把 update 副作用 启动的
【副作用注册器 + 首次执行器】
⭐：主要用来判断，当我的响应式对象 state 被读取的时候，有没有 "副作用update()" 的表达式，如果没有副作用，那到时候 track 进 weakSet 的时候，执行就变成 undefined()，会报错，所以一般 track() 函数内部就 return了。

👆根本原因是: console.log(state.A1) 只需要执行一次，根本不需要被 track

⭐🔷⭐对比在 template 中可能会变动( props传来的，或者有副作用的 ) 的模板字符串 {{ state.A1 }}, 会被 compile 成一个 render() 函数（如下）
*/

function render() {
  return createVNode(`页面内容：${state.A1}`)
}
//vue 会 将其作为副作用执行 
// effect(render)，和底下这个写法是一样的
whenDepsChange(render)

//------------------------Effect 写法三---------------------------------

/**
 * 除了模板字符串以外，会被自动传入 whenDepsChange 这个函数的还有 
 * watchEffect
 * computed(原理类似，不一定是副作用函数 update())
 * watch
 */

watchEffect(() => {
  console.log(state.A1)
})

const total = computed(() => {
  return state.price * state.count
})

watch(
  () => state.A1,
  (newValue) => {
    console.log('A1 变化了', newValue)
  }
)

function whenDepsChange(update) {
  const effect = () => {
    activeEffect = effect
    update()
    activeEffect = null
  }
  effect()
}


/* 
1. get()读取 state.A0 staet.A1，如果检测到有 update()副作用， 响应式系统才调用 track() 去添加副作用
P.S. proxy：代理对象，读取它会触发 get。target：原始对象{A0:1,A1:2}，也就是不包含reactive 的部分。读取它不会再次触发这个 Proxy 的 get
*/

// function reactive(obj) {

    return new Proxy(obj, {
    get(target, key) { // target 是原始对象，key 是当前读取的属性名
      track(target, key)
      return target[key]
    },

    //track 函数内部
    let activeEffect

    function track(target, key) {
      if (activeEffect) { // 副作用不存在就不 track，参考上面的 whenDepsChange
        const effects = getSubscribersForProperty(target, key) //有就添加到 Set 中
        effects.add(activeEffect)
      }
    }

/* 
1.1 track 期间 

*/

/* 
2. track()后，系统把 update() 保存到了 A0 和 A1 的"通知"名单里(如下)：
如果在第一次追踪时没有找到对相应属性订阅的副作用集合，它将会在这里新建 WeakMap
*/


WeakMap 全局一个 {
  target对象(未被代理的原始裸对象) => Map 原始对象的属性 {
    'A0' => Set 该属性的订阅者 { update },
    'A1' => Set { update }
  }
  ....
}

/* 
3. A0 A1 变化 set()，会"通知" trigger() 其他所有名单中的 "副作用"
如 state.A1 = 100，触发 set
*/
    set(target, key, value) {
      target[key] = value // 赋值A1
      trigger(target, key) //通知 update() 重新执行
    }
  })
}


```