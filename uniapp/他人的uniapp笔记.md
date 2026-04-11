一：入门
00首节介绍
uni-app官网：https://uniapp.dcloud.net.cn/component/image.html，下载HBuilder软件，小程序
01编辑器下载和view组件
<template>
	<!--<view>	uni-app 中的视图容器，类似于 HTML 的 <div>，用于包裹内容-->
	<view class="content">
		<view>这是一只猫	</view>
		<image src="https://img.yzcdn.cn/vant/cat.jpeg"></image>
	</view>
</template>

<script>
	//export default { ... }	导出当前页面的配置对象，供外部使用
	export default {
		data() {//data()	数据函数，返回页面中使用的数据
			return {
				title: 'Hello'
			}//return { title: 'Hello' }	返回一个对象，title 是定义的一个变量，值为 'Hello'
		},
		onLoad() {
//onLoad()	页面生命周期函数，页面加载时自动执行（这里暂时为空）
		},
		methods: {//methods: { }	存放页面中所有自定义方法的地方（这里暂时为空）

		}
	}
</script>

<style>
	/*.content	类选择器，作用于模板中 class="content" 的 <view>
display: flex	使用弹性盒布局，让子元素灵活排列
align-items: center	子元素在交叉轴（垂直方向）上居中对齐
justify-content: center	子元素在主轴（水平方向）上居中对齐*/
	.content {
		display: flex;
		align-items:center;
		justify-content: center;
	}
</style>


02-scroll-view滚动组件
<template>
	<!--<view>	uni-app 中的视图容器，类似于 HTML 的 <div>，用于包裹内容-->
	<view class="content">
		<view class="banner">banner</view>
		<!--scroll-view	uni-app 中用于创建可滚动区域的组件
scroll-y	属性，设置为 true（或直接写 scroll-y）表示允许垂直滚动
style="height: 300rpx;"	内联样式，设置滚动区域高度为 300rpx。超出这个高度的内容才能滚动
@scrolltolower	事件绑定，当滚动到底部时触发后面指定的方法-->
		<scroll-view scroll-y style="height: 300rpx;" 
		@scrolltolower="scrolltolower">
		
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		</scroll-view>
	
		
	</view>
</template>

<script>
	//export default { ... }	导出当前页面的配置对象，供外部使用
	export default {
		data() {//data()	数据函数，返回页面中使用的数据
			return {
				title: 'Hello'
			}//return { title: 'Hello' }	返回一个对象，title 是定义的一个变量，值为 'Hello'
		},
		onLoad() {
//onLoad()	页面生命周期函数，页面加载时自动执行（这里暂时为空）
		},
		methods: {//methods: { }	存放页面中所有自定义方法的地方（这里暂时为空）
      scrolltolower(){//scrolltolower()	自定义方法名，与模板中 @scrolltolower 对应。当滚动到底部时执行
		  console.log('触底了')//在浏览器/小程序控制台输出文字“触底了”，用于调试
	  }
		}
	}
</script>

<style>
.content .banner {
	width:100%;
	height: 300rpx;
	background-color: red;
}
/**.content .section	后代选择器，选中 .content 内部的所有 .section 元素
background-color: blue;	设置背景颜色为蓝色
margin-bottom: 20rpx;	设置下外边距为 20rpx，让每个段落之间有间隔**/
.content .section {
	background-color: blue;
	margin-bottom: 20rpx;
}
</style>


03-css预处理器和flex布局
<template>
	<!--<view>	uni-app 中的视图容器，类似于 HTML 的 <div>，用于包裹内容-->
	<view class="content"><!--content	内容，整个页面的主容器-->
		<view class="banner">banner</view><!--content	内容，整个页面的主容器-->
		<!--flex-box	弹性盒子，使用 flex 布局的容器
item	项目/条目，表示列表中的单个项-->
<view class="flex-box">
	<view class="item">
		<image src="https://img.yzcdn.cn/vant/cat.jpeg"></image>
	</view>
	<view class="item">
			<image src="https://img.yzcdn.cn/vant/cat.jpeg"></image>
	</view>
	
</view>
		<!-- <scroll-view scroll-y style="height: 300rpx;" 
		@scrolltolower="scrolltolower">
		
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		<view class="section">这是一个段落</view>
		</scroll-view> -->

	</view>
</template>

<script>
	//export default { ... }	导出当前页面的配置对象，供外部使用
	export default {
		data() {//data()	数据函数，返回页面中使用的数据
			return {
				title: 'Hello'
			}//return { title: 'Hello' }	返回一个对象，title 是定义的一个变量，值为 'Hello'
		},
		onLoad() {
//onLoad()	页面生命周期函数，页面加载时自动执行（这里暂时为空）
		},
		methods: {//methods: { }	存放页面中所有自定义方法的地方（这里暂时为空）
      scrolltolower(){//scrolltolower()	自定义方法名，与模板中 @scrolltolower 对应。当滚动到底部时执行
		  console.log('触底了')//在浏览器/小程序控制台输出文字“触底了”，用于调试
	  }
		}
	}
</script>

<style lang="scss">
		
	.content {
		.banner {
			width:100%;
			height: 300rpx;
			background-color: red;
		}
		.section {
			background-color: blue;
			margin-bottom: 20rpx;
		}//margin-bottom	下外边距
		.flex-box {
			display:flex;//display	显示方式 flex	弹性盒布局模型
			justify-content: space-around;/*justify-content	主轴对齐方式
space-around	平均分布，两端有间距*/
			.item {
			            image{
							width:100rpx;
						    height: 100rpx;
						}
		}
		
			
		}
	}
/* .content .banner {
	width:100%;
	height: 300rpx;
	background-color: red;
}
/**.content .section	后代选择器，选中 .content 内部的所有 .section 元素
background-color: blue;	设置背景颜色为蓝色
margin-bottom: 20rpx;	设置下外边距为 20rpx，让每个段落之间有间隔**/
/* .content .section {
	background-color: blue;
	margin-bottom: 20rpx;
} */
</style>



04-button基本语法用法
<template>
    <!-- 按钮组件，样式类为 btn，尺寸为迷你，点击时执行 handleClick 方法 -->
    <button class="btn" size="mini" @click="handleClick">点击</button>
</template>

<script setup>
    // 定义 handleClick 方法，使用箭头函数
    // 当按钮被点击时，在控制台输出"按钮被点击了"
    const handleClick = () => {
        console.log('按钮被点击了')
    }
</script>

<style lang="scss">
    // 按钮样式
    .btn {
        background-color: blue;  // 蓝色背景
        color: #fff;             // 白色文字
    }
</style>

05-小程序创建和api调用
微信公众号官网https://mp.weixin.qq.com/，下载微信开发者工具，注册账号


06-input语法和实际运用
可以在微信开发小程序查看
<template>
	<view class="flex">
		<view>用户名</view>
		<!--type="nickname"	输入框类型为“昵称”（微信小程序专用，可获取微信昵称）
		placeholder	占位符，输入框为空时显示的提示文字
		value="allen"	输入框的默认值（显示"allen"）-->
		<input type="nickname" placeholder="请输入用户名" value="allen" class="my-input" 
		 @focus="handleFocus" @input="handleInput"/>
		 <!--@focus	焦点事件，当输入框获得焦点时触发
@input	输入事件，当输入框内容变化时触发
handleFocus	处理焦点事件的函数名
handleInput	处理输入事件的函数名-->
	</view>

</template>

<script setup>
  const handleInput =(e) =>{
	  console.log(e)
  }
	const handleFocus =() =>{
		console.log('handleFocus')
  }
</script>

<style lang="scss">
	.flex {
		display:flex;//弹性布局（让子元素灵活排列）
		align-items:center;//垂直居中对齐
		.my-input {//类选择器，选中 class="my-input" 的元素
			   border :2rpx solid #000;//边框：2 像素宽、实线、黑色
			   padding-left:10rpx;//左内边距：10 像素（rpx 是微信小程序的响应式单位）
		}
	}
   
</style>

07-picker语法和实际运用
<template>
  <view>
    <view>地区选择器</view>
	<!--picker	选择器组件，用于提供滑动选择功能
@change	改变事件，当选择器值发生变化时触发
:range	绑定范围，接收数组作为选项列表（: 是 v-bind: 的简写）
:value	绑定值，当前选中的值-->
    <picker @change="handleChange" :range="arr" :value="index">
      <view>{{ arr[index] }}</view>
    </picker>
  </view>
<!--mode="time"	模式为"时间"，表示时间选择器
mode="date"	模式为"日期"，表示日期选择器
start="09:01"	开始时间，可选范围的最小时间
end="21:01"	结束时间，可选范围的最大时间-->
  <view>时间选择器</view>
  <picker @change="handleTime" mode="time" :value="time" start="09:01" end="21:01">
    <view>{{ time }}</view>
  </picker>
<!--:start	绑定开始日期，日期选择器的最小可选日期
:end	绑定结束日期，日期选择器的最大可选日期
{{ arr[index] }}	插值表达式，显示数组 arr 中索引为 index 的值-->
  <view>
    <view>日期选择器</view>
    <picker mode="date" :value="date" :start="startDate" :end="endDate">
      <view>{{ date }}</view>
    </picker>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// 地区选择器
const arr = ['中国', '美国', '英国', '日本']
const index = ref(0)
/**handleChange	处理改变事件，handle = 处理，change = 改变
handleTime	处理时间事件
getDate	获取日期
console.log(e)	在控制台打印事件对象 e
e.detail.value	事件详情中的值（选择器选中的值）
return	返回，函数输出结果**/
const handleChange = (e) => {
  console.log(e)
  index.value = e.detail.value
}
/**new Date()	创建新的日期对象，获取当前时间
let year	声明年份变量（let = 可变的变量）
date.getFullYear()	获取完整年份（如 2026）
date.getMonth()	获取月份（0-11，0 代表一月）
date.getDate()	获取日期（几号）
type	类型，参数名称（'start' 开始 / 'end' 结束）
if (type === 'start')	如果类型等于 'start'
else if	否则如果
year = year - 10	年份减 10 年
year = year + 10	年份加 10 年
month > 9 ? month : '0' + month	三元运算符：如果月份大于 9 则不变，否则前面补 0
day > 9 ? day : '0' + day	同上，给日期补 0
${year}-${month}-${day}	模板字符串，拼接成 "2026-03-29" 格式**/
// 时间选择器
const time = ref('12:01')

const handleTime = (e) => {
  time.value = e.detail.value
}

 const date =computed(() =>{
	 return getDate({
		 format:true
	 })
 })
 const startDate =computed(() =>{
	 return getDate('start')
 })
 const endDate =computed(() =>{
	 return getDate('end')
 })
const getDate = (type) => {
  const date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  if (type === 'start') {
    year = year - 10
  } else if (type === 'end') {
    year = year + 10
  }
  
  month = month > 9 ? month : '0' + month
  day = day > 9 ? day : '0' + day
  
  return `${year}-${month}-${day}`
}


</script>

<style lang="scss">
</style>

08-naviggator语法和实际运用
<template>
<!--<navigator>定义：微信小程序的路由跳转组件（相当于 HTML 的 <a> 标签）。
open-type="switchTab"定义：navigator 组件的跳转方式之一。switchTab：跳转到 tabBar 页面，并关闭所有非 tabBar 页面
url定义：跳转的目标页面路径。格式：相对于项目根目录的路径，通常不带文件后缀。-->
 <navigator open-type="switchTab"url="/pages/my/my">
	 <button>跳转到我的页面</button>
 </navigator>
</template>

<script setup>

</script>

<style lang="scss">
</style>
新建页面添加代码：
<template>
	<view>
		我的页面
	</view>
</template>

<script>
	export default {
		data() {//data()作用：定义组件的响应式数据。
			return {
				
			}
		},
		methods: {
			//methods作用：存放组件内定义的方法（事件处理、逻辑函数等）。
		}
	}
</script>

<style>

</style>

  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/my/my",
        "text": "我的"
      }
    ]
  }
}


09-扩展插件介绍和使用
DCloud插件市场
第一步：打开uni-app官网，打开需要的下载的插件

第二步：登录下载

第三步：进行使用：
10-自定义组件的创建和使用
全局引入和局部引入：
index.vue
<template>
<counter /><!--<counter />	自定义组件的使用标签，自闭合形式-->
</template>

<script setup>
  
</script>

<style lang="scss">
</style>

main.js
import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'  // uni-app 的适配器文件
import counter from './components/counter.vue'  // 组件文件路径

Vue.config.productionTip = false
App.mpType = 'app'

// 全局注册组件
Vue.component('counter', counter)

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import counter from './components/counter.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.component('counter', counter)
  return {
    app
  }
}
// #endif


counter.vue
<template>
	<!--class="flex-box"	CSS 类名，用于样式控制-->
	<view class="flex-box">
		<button @click="add">增加</button>
		<view>{{ counter }}</view>  <!-- 修正：couter → counter -->
		<button @click="minus">减少</button>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	const counter = ref(0)
	
	const add = () => {
		counter.value++  // 修正：couter → counter
	}
	
	const minus = () => {
		counter.value--  // 已经正确
	}
</script>

<style>
.flex-box {
	display: flex;//display: flex	CSS Flexbox 布局，让子元素水平排列
}
</style>

index.vue
<template>
<counter /><!--<counter />	自定义组件的使用标签，自闭合形式-->
</template>

<script setup>
  import couter from '../../components/counter.vue'
</script>

<style lang="scss">
</style>

main.js
import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'  // uni-app 的适配器文件
import counter from './components/counter.vue'  // 组件文件路径

Vue.config.productionTip = false
App.mpType = 'app'

// 全局注册组件
Vue.component('counter', counter)

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
//import counter from './components/counter.vue'

export function createApp() {
  const app = createSSRApp(App)
  //app.component('counter', counter)
  return {
    app
  }
}
// #endif


11-easycom引入方式
直接改大写
Counter.vue
<template>
	<!--class="flex-box"	CSS 类名，用于样式控制-->
	<view class="flex-box">
		<button @click="add">增加</button>
		<view>{{ counter }}</view>  <!-- 修正：couter → counter -->
		<button @click="minus">减少</button>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	const counter = ref(0)
	
	const add = () => {
		counter.value++  // 修正：couter → counter
	}
	
	const minus = () => {
		counter.value--  // 已经正确
	}
</script>

<style>
.flex-box {
	display: flex;//display: flex	CSS Flexbox 布局，让子元素水平排列
}
</style>

index.vue
<template>
<Counter /><!--<counter />	自定义组件的使用标签，自闭合形式-->
</template>

<script setup>
  //import couter from '../../components/counter.vue'
</script>

<style lang="scss">
</style>


12组件通信--父子组件实现
<template>
	<!--<Counter />	自定义组件标签，使用 PascalCase（大驼峰）写法，引用 counter.vue 组件
title="第一个计数器"	向子组件传递 props（属性），title 是属性名，"第一个计数器" 是属性值
@total="total"	事件绑定语法，@ 是 v-on: 的简写，监听子组件触发的 total 自定义事件，触发后调用 total 方法
<view>	uni-app 内置组件，用于包裹和布局内容
{{ totalNum }}	插值表达式（Mustache 语法），显示响应式变量 totalNum 的值-->
 <Counter title="第一个计数器" @total="total" />
 <Counter title="第一个计数器"  @total="total"/>
  <Counter title="第一个计数器" @total="total"/>
  <view>总数{{ totalNum}}</view>
</template>

<script setup>
 //ref	响应式引用函数，将普通数据变成响应式数据，需要用 .value 访问/修改
import { ref } from 'vue'
const totalNum =ref(0)
const total =(e) =>{
	console.log(e)
e.type === 'add' ? totalNum.value++  :totalNum.value--
}
/*const totalNum = ref(0)	创建响应式变量 totalNum，初始值为 0，用于存储三个计数器的总和
const total = (e) => { }	定义箭头函数 total，接收事件参数 e
console.log(e)	在控制台输出事件对象，用于调试
e.type	从事件对象中取出 type 属性（值为 'add' 或 'minus'）
? :	三元运算符，条件判断的简写形式：条件 ? 真时执行 : 假时执行
totalNum.value++	将 totalNum 的值加 1
totalNum.value--	将 totalNum 的值减 1*/
</script>

<style lang="scss">
</style>

<template>
	<!--style="text-align: center;"	内联样式，直接写在标签上的 CSS 样式
text-align: center	CSS 属性，让文字水平居中
class="flex-box"	CSS 类名，用于引用样式表中定义的样式
<button>	uni-app 内置按钮组件
@click="add"	点击事件绑定，点击按钮时调用 add 方法-->
<view style="text-align: center;">{{ title }}</view>
	<view class="flex-box">
		<button @click="add">增加</button>
		<view>{{ counter }}</view>  <!-- 修正：couter → counter -->
		<button @click="minus">减少</button>
	</view>
</template>

<script setup>
	import { ref,defineProps,defineEmits } from 'vue'
	defineProps({
		title:String
	})
	 const emit =defineEmits(['total'])
	const counter = ref(0)
	const add = () => {
		counter.value++  
		emit('total',{
			type:'add',
			counter
		})
	}
	
	const minus = () => {
		counter.value--  
		emit('total',{
			type:'minus',
			counter
		}
		)
	}
	/**defineProps	Vue 3 宏函数，用于定义子组件接收的属性（props）
defineProps({ title: String })	声明组件接收一个名为 title 的属性，类型为 String（字符串）
String	JavaScript 数据类型，表示文本字符串
defineEmits	Vue 3 宏函数，用于定义子组件可以触发的事件
defineEmits(['total'])	声明组件可以触发名为 total 的自定义事件
emit	事件触发器函数，用于向父组件发送事件
emit('total', 数据)	触发 total 事件，并传递数据给父组件
{ type: 'add', counter }	对象字面量，传递的数据结构，包含 type 和 counter 两个属性
type: 'add'	对象属性，值为字符串 'add'，表示操作类型
counter	对象属性简写，等同于 counter: counter，传递当前计数器的值*defineProps	Vue 3 宏函数，用于定义子组件接收的属性（props）
defineProps({ title: String })	声明组件接收一个名为 title 的属性，类型为 String（字符串）
String	JavaScript 数据类型，表示文本字符串
defineEmits	Vue 3 宏函数，用于定义子组件可以触发的事件
defineEmits(['total'])	声明组件可以触发名为 total 的自定义事件
emit	事件触发器函数，用于向父组件发送事件
emit('total', 数据)	触发 total 事件，并传递数据给父组件
{ type: 'add', counter }	对象字面量，传递的数据结构，包含 type 和 counter 两个属性
type: 'add'	对象属性，值为字符串 'add'，表示操作类型
counter	对象属性简写，等同于 counter: counter，传递当前计数器的值*/
</script>

<style>
.flex-box {
	display: flex;//display: flex	CSS Flexbox 布局，让子元素水平排列
}
</style>

13-组件通信-pinia的使用
1. 应用初始化层 main.js  
// #ifdef VUE3
import { createSSRApp } from 'vue'
//createSSRApp: 创建一个支持服务端渲染的应用实例。在 Uni-app 运行在 H5 或小程序时，这是 Vue 3 的标准启动方式。
import * as Pinia from 'pinia'//Pinia: 全局状态管理库。你可以把它想象成一个**“公共大仓库”**，项目里任何地方想用数据，都可以从这里取，不用自己传。
import App from './App'
//导出一个名为 createApp 的函数。
export function createApp() {
    const app = createSSRApp(App)
    const pinia = Pinia.createPinia()
    //app.use(pinia): 告诉 Vue 应用：“嘿，我要在这个项目里使用 Pinia 仓库管理数据。”
    app.use(pinia)
    /**const app = createSSRApp(App):
createSSRApp：创建一个支持**服务端渲染（SSR）**的应用实例。在 Uni-app 开发 H5 或小程序时，这种方式比标准的 createApp 兼容性更好。
App：这是你项目根目录下的 App.vue。它是所有页面的“外壳”。
const pinia = Pinia.createPinia():
createPinia()：这是 Pinia 库提供的工具，用来创建一个全新的状态管理实例（即那个“公共大仓库”）。
app.use(pinia):意思：插件注册。**/
    return {
        app,   // 必须有逗号
        pinia,  // 必须有逗号
    }
}//#ifdef VUE3 ... #endif: 条件编译。意思是这段代码只有在环境是 Vue 3 时才会运行，Uni-app 用它来兼容不同平台。
// #endif
2. 状态管理层 (store/index.js)  
import { defineStore } from 'pinia'
//defineStore: 定义仓库的函数。第一个参数 'counter' 是这个仓库的 ID（唯一标识）。
export const useCounterStore = defineStore('counter', { // 括号在最后才结束
    state: () => ({
        title: '计数器'//state: 仓库里的数据源。比如 title: '计数器' 就是存在云端的全局变量。
    }),
    actions: {//actions: 修改数据的方法。在 Pinia 中，如果你想改 state 里的值，必须通过 actions 里的函数（如 changeTitle）来执行。
        changeTitle(title) {
            this.title = title
        }/**changeTitle: 这是你定义的一个动作方法（Action）。它的名字是你自己取的，表达“修改标题”的意思。

(title): 括号里的 title 是一个形参（参数）。它代表从外部传进来的“新值”。

比如：你在输入框输入了“我的计数器”，这个字符串就会通过这个参数传进来。

this.title: 这里的 this 指向当前的 Store 实例。this.title 指的是你在 state 中定义的那个初始的 title。

= title: 这是一个赋值操作。把“新传进来的值”覆盖掉“旧的值”。**/
    }
}) // 确保这里闭合
3. 组件逻辑层 (Counter.vue)  
<template>
<view style="text-align: center;">
	<input type="text" :value="counterStore.title" @input="changeTitle">
</view>
	<view class="flex-box">
		<button @click="add">增加</button>
		<view>{{ counter }}</view>  <!-- 修正：couter → counter -->
		<button @click="minus">减少</button>
	</view>
</template>
<!--props (通过 defineProps): 父传子。父页面通过 title="第一个计数器" 把文字传进来。
emits (通过 defineEmits): 子传父。子组件通过 emit('total', ...) 向父页面“发信号”，告诉父页面：“我这边的数字变了，你更新一下总数。”
ref: 响应式引用。它把一个普通数字变成“活”的。如果你改了 counter.value，界面上显示数字的地方会自动跟着跳动。
useCounterStore(): 钩子函数。在组件里调用它，就能拿到前面定义的那个“公共仓库”。
flex-box (CSS): 布局方式。让“增加按钮”、“数字”、“减少按钮”在同一行水平排列。-->
<script setup>
	import { ref,defineProps,defineEmits } from 'vue'
import { useCounterStore } from '../../store/index.js'// 修改后（根据你的实际层级向上跳级）
	//调用钩子函数获取store
	const counterStore =useCounterStore()
	//console.log(counterStore,'counterStore')
	
	//当input输入时候
	const changeTitle =(e) =>{
		console.log(e)
		counterStore.changeTitle(e.detail.value)
		
	}//属性声明 (Properties)。
	defineProps({
		title:String
	})//事件声明 (Emits)。
	 const emit =defineEmits(['total'])
	const counter = ref(0)
	const add = () => {
		counter.value++  
		emit('total',{
			type:'add',
			counter
		})
	}
	/**props	接收者	耳朵：听父组件传下来的话（如：标题叫什么）。
emits	发送者	嘴巴：告诉父组件发生了什么（如：我加了1）。
ref(0)	记录者	私人笔记本：记下自己当前的数字是多少。
value	钥匙	开关：在 JS 里修改 ref 数据必须带上的后缀。**/
	const minus = () => {
		counter.value--  
		emit('total',{
			type:'minus',
			counter
		}
		)
	}
	
</script>

<style>
.flex-box {
	display: flex;//display: flex	CSS Flexbox 布局，让子元素水平排列
}
</style>
 4. 页面显示层 (index.vue)  
<template>
<!--<Counter />: 自定义组件标签。你写了三次，代表页面上会出现三个独立的计数器。
@total="total": 事件监听。监听子组件发出的 total 信号，并触发父页面里的 total 函数。
totalNum: 父页面的汇总数据。它根据子组件传回来的 type（是 add 还是 minus）来增加或减少。-->
 <Counter title="第一个计数器" @total="total" />
 <Counter title="第一个计数器"  @total="total"/>
  <Counter title="第一个计数器" @total="total"/>
  <view>总数{{ totalNum}}</view>
</template>

<script setup>
 //ref	响应式引用函数，将普通数据变成响应式数据，需要用 .value 访问/修改
import { ref } from 'vue'
// 建议写法
import Counter from '@/components/Counter/Counter.vue'
const totalNum =ref(0)
//totalNum它是定义在 父页面 (index.vue) 中的一个响应式变量，用来记录所有子组件计数器相加后的总和。
//const total: 定义一个名为 total 的常量，它指向一个函数。
const total =(e) =>{
	console.log(e)
e.type === 'add' ? totalNum.value++  :totalNum.value--
}
/**(e) => { ... }: 这是一个箭头函数。
e: 代表 Event（事件对象）。它是子组件通过 emit 传过来的那个数据包。
在你的代码里，这个 e 实际上就是子组件里的这个对象：{ type: 'add', counter: ... }。
console.log(e): 调试命令。它会在浏览器控制台打印出收到的数据，方便你查看子组件到底传了什么。
e.type === 'add': 这是一个条件判断。检查收到的信号类型是不是字符串 'add'。**/
</script>

<style lang="scss">
</style>

14页面配置文件导航相关介绍
"globalStyle": {
			"navigationBarTextStyle": "white",
			"navigationBarTitleText": "uni-app",
			"navigationBarBackgroundColor": "#111",
			"backgroundColor": "#F8F8F8",
			"navigationStyle": "custom"
		},
<template>
<uni-nav-bar title="导航栏组件"></uni-nav-bar>
</template>

<script setup>
 
</script>

<style lang="scss">
</style>


15-页面配置文件其他属性介绍
16-小程序打包上线流程
17-App打包上线流程
二：实战（旅游）
01-项目介绍和功能讲解

02-开发前的工具
uniapp官网、Hbuilder
小程序/微信开发工具
开发前的准备工作 uniapp官网 小程序IDE下载 uview-plus 接口文档
03-页面创建和tabbar配置
 这份笔记整理针对的是 pages.json 文件，它是 uni-app 项目的“心脏”，负责页面路由、底部选项卡（TabBar）和全局视觉配置。  
1. 页面配置 (pages)
这是项目的路由表，决定了应用包含哪些页面。
● 启动页：数组中的第一个对象即为应用启动时的首页。
● path：页面的相对路径，对应项目中的 .vue 文件。
● style：特定页面的配置，会覆盖globalStyle 中的同名配置。
  ○ navigationBarTitleText：当前页面的导航栏标题。
2. 全局样式配置 (globalStyle)
定义应用所有页面的默认外观，相当于“皮肤”基准。
● 常用属性：
  ○ navigationBarTextStyle：导航栏文字/图标颜色（仅支持 black 或 white）。
  ○ navigationBarTitleText：全局默认标题，如果页面没单独写 style，就显示这个。
  ○ navigationBarBackgroundColor：导航栏背景色。
  ○ backgroundColor：窗口的背景色（通常在下拉刷新或页面未渲染时可见）。
3. 底部选项卡 (tabBar)
用于在应用底部创建多页切换功能。
● 基础属性：
  ○ color：文字默认颜色。
  ○ selectedColor：文字选中时的颜色。
  ○ backgroundColor：TabBar 的底色。
  ○ borderStyle：上边框颜色（可选 black 或 white）。
● list 数组（建议 2-5 个按钮）：
  ○ pagePath：点击跳转的路径（必须在 pages 中定义过）。
  ○ text：图标下方的文字。
  ○ iconPath：默认图标路径（建议 81px × 81px）。
  ○ selectedIconPath：选中后的图标路径。
4. 其他配置
● uniIdRouter：uni-app 自带的登录鉴权路由。当使用 uni-id 时，可在此配置哪些页面需要登录才能访问，实现自动重定向。

面试/开发知识点补充
● 优先级关系：pages[i].style (局部) >globalStyle (全局)。
● 路径注意：路径结尾不要加 .vue 后缀。
● TabBar 限制：
  ○ 只有在 tabBar.list 中注册过的页面，才能使用 uni.switchTab 跳转。
  ○ 如果你使用了 uni.navigateTo 跳转到 TabBar 页面，在某些平台上是无效的，必须使用 switchTab。
● 图片资源：iconPath 引用的图标必须放在 static 目录下，不能使用网络图片或 Base64。

快速记忆口诀
Pages 定路由，Global 换外衣；TabBar 管切换，首项是首页。
{
	"pages": [//pages	所有页面的配置列表
		// 页面数组，第一个页面是应用启动页
		{
			"path": "pages/index/index",
			// 页面路径
			"style": {
				// 页面样式配置
				"navigationBarTitleText": "uni-app"
				// 导航栏标题文字
			}
		},
		{
			"path": "pages/like/like",
			"style": {
				"navigationBarTitleText": ""
			}
		},
		{
			"path": "pages/my/my",
			"style": {
				"navigationBarTitleText": ""
			}
		}
	],
	"tabBar": {// 底部选项卡配置
		"color": "#7A7E83",
		// 未选中时图标的颜色（灰色）
		"selectedColor": "#2867CE",
		// 选中时图标的颜色（蓝色）
		"borderStyle": "black",
		// 导航栏上边框的颜色（黑色）
		"backgroundColor": "#ffffff",
		// 导航栏的背景颜色（白色）
		"list": [
			// 导航栏按钮列表
			{
				"pagePath": "pages/index/index",// 点击跳转的页面路径
				"iconPath": "/static/tabbar/ly-home01.png",// 未选中时显示的图标路径
				"selectedIconPath": "/static/tabbar/ly-home.png",// 选中时显示的图标路径
				"text": "首页"// 导航按钮显示的文字
			},
			{
				"pagePath": "pages/like/like",
				"iconPath": "/static/tabbar/ly-link01.png",
				"selectedIconPath": "/static/tabbar/ly-link.png",
				"text": "喜欢"
			},
			{
				"pagePath": "pages/my/my",
				"iconPath": "/static/tabbar/ly-my01.png",
				"selectedIconPath": "/static/tabbar/ly-home.png",
				"text": "我的"
			}
		]
	},
	"globalStyle": {// 全局样式配置,影响所有页面
		"navigationBarTextStyle": "black",// 导航栏文字颜色（黑色/白色）
		"navigationBarTitleText": "uni-app",// 导航栏标题文字（所有页面默认标题）
		"navigationBarBackgroundColor": "#F8F8F8",// 导航栏背景颜色（浅灰色）
		"backgroundColor": "#F8F8F8"// 页面背景颜色（浅灰色）
	},
	"uniIdRouter": {}// 用户身份路由配置（用于权限控制）
}

04-uview-plus组件库介绍和导入
打开uview-plus官网：https://uview-plus.jiangruyi.com/，
下载地址：https://ext.dcloud.net.cn/plugin?name=uview-plus，
点击下载插件并导入
安装依赖库：npm i days  clipboard在文件里面输入cmd开始安装
https://ext.dcloud.net.cn/plugin?id=1593
 这份代码是 uni-app 开发中一个非常标准的页面模板，结合了 uView-plus 组件库和 Flex 弹性布局。
快速记忆口诀
Flex 开启排整齐，方向列行要分清；VH 占满全屏高，RPX 适配万类机。  
<template>
	<view class="content">
		<up-button 
			text="渐变色按钮" 
			color="linear-gradient(to right, rgb(66,83,216), rgb(213,51,186))"
		></up-button>
	</view>
</template>

<script>
	import uButton from '../../uni_modules/uview-plus/components/u-button/u-button.vue';
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style>
	.content {
	    display: flex;                    /* 弹性布局 */
	    flex-direction: column;          /* 垂直排列（上下方向） */
	    align-items: center;             /* 水平居中 */
	    justify-content: flex-start;     /* 垂直方向从顶部开始对齐 */
	    min-height: 100vh;               /* 最小高度占满整个视口（屏幕） */
	}
	
	.logo {
	    height: 200rpx;                  /* 高度 200rpx（响应式单位） */
	    width: 200rpx;                   /* 宽度 200rpx */
	    margin-top: 200rpx;              /* 上边距 200rpx */
	    margin-left: auto;               /* 左边距自动（配合 margin-right: auto 实现水平居中） */
	    margin-right: auto;              /* 右边距自动 */
	    margin-bottom: 50rpx;            /* 下边距 50rpx */
	}
	
	.text-area {
	    display: flex;                   /* 弹性布局 */
	    justify-content: center;         /* 水平居中 */
	}
	
	.title {
	    font-size: 36rpx;                /* 字体大小 36rpx */
	    color: #8f8f94;                  /* 文字颜色（灰色） */
	}
</style>
1. 组件化开发 (Template)
● uView 组件使用：
  ○ <up-button>：是 uView-plus 提供的增强版按钮。
  ○ 渐变色实现：通过 color 属性直接传入 CSS 的 linear-gradient 值，无需写复杂的 CSS 类名。
● 注意点：组件名 up-button 对应了配置文件或 uni_modules 中的组件定义。
2. 脚本逻辑 (Script)
● 组件导入：
  ○ import uButton from '...'：手动导入组件。但在实际开发中，如果开启了 easycom 模式，这一行通常可以省略，直接在模板使用即可。
● 生命周期：
  ○ onLoad()：页面加载时触发，常用于初始化数据或发起网络请求。
● 数据管理：
  ○ data()：返回一个对象，存储页面的响应式变量（如 title）。
3. Flex 弹性布局样式 (Style)
这是笔记的重点，决定了页面元素如何排列。
属性	作用	常见值说明
display: flex	开启弹性布局	使容器变为 Flex 容器，子元素变为 Flex 项目。
flex-direction	排列方向	column
：垂直排列（上下）；row
：水平排列（左右）。
align-items	侧轴对齐	在 column
 模式下，控制子元素水平居中 (center
)。
justify-content	主轴对齐	flex-start
：顶部对齐；center
：居中对齐。
min-height: 100vh	全屏高度	vh
 是视口单位，100vh
 代表占据整个屏幕高度。
 4. 响应式单位与间距  
● rpx (responsive pixel)：
  ○ uni-app 专用的响应式单位。
  ○ 原理：以 750rpx 为屏幕总宽度。在不同尺寸的手机上会自动缩放，实现一套代码适配所有机型。
● 居中技巧：
  ○ margin-left: auto; margin-right: auto;：配合固定宽度的元素，可以实现简单的水平居中。
05-接口介绍和http请求类封装
快速记忆口诀
Http 封前缀，Api 封路径。Setup 写逻辑，OnLoad 调接口。Token 随头走，响应看 Code。
api的封装，http请求类
1.处理公共的请求前和响应后的逻辑
2.处理公共的参数和请求头
 uni-app 组合式开发（Vue3 setup）、封装请求拦截器 以及 API 模块化管理。这三部分是现代前端项目的“地基”。
5. 页面组件实战：index.vue
代码展示了 Vue3 script setup 语法在 uni-app 中的用法。
● 组合式 API 引入：
  ○ import { onLoad } from '@dcloudio/uni-app'：uni-app 专属生命周期。
● 生命周期逻辑：
  ○ onLoad：页面加载时立即执行。此时发起网络请求 getBanner() 获取初始化数据。
● uView-plus 组件配置：
  ○ 渐变色按钮：通过属性传参（Props）将 CSS 渐变函数传给组件内部。
<template>
	<view class="content">
		<!--linear-gradient: CSS渐变函数-->
		<up-button 
			text="渐变色按钮" 
			color="linear-gradient(to right, rgb(66,83,216), rgb(213,51,186))"
		></up-button>
	</view>
</template>

<script setup>
	import uButton from '../../uni_modules/uview-plus/components/u-button/u-button.vue';
     import { getBanner } from '../../api/api';
	//onLoad: 页面生命周期钩子，页面加载时执行,@dcloudio/uni-app: uni-app官方提供的API包
	 import { onLoad } from '@dcloudio/uni-app'
	 
	 onLoad(() =>{
		 getBanner().then(res =>{
			 console.log(res,'res')
		 })
	 })
</script>

<style>
	.content {
	    display: flex;                    /* 弹性布局 */
	    flex-direction: column;          /* 垂直排列（上下方向） */
	    align-items: center;             /* 水平居中 */
	    justify-content: flex-start;     /* 垂直方向从顶部开始对齐 */
	    min-height: 100vh;               /* 最小高度占满整个视口（屏幕） */
	}
	
	.logo {
	    height: 200rpx;                  /* 高度 200rpx（响应式单位） */
	    width: 200rpx;                   /* 宽度 200rpx */
	    margin-top: 200rpx;              /* 上边距 200rpx */
	    margin-left: auto;               /* 左边距自动（配合 margin-right: auto 实现水平居中） */
	    margin-right: auto;              /* 右边距自动 */
	    margin-bottom: 50rpx;            /* 下边距 50rpx */
	}
	
	.text-area {
	    display: flex;                   /* 弹性布局 */
	    justify-content: center;         /* 水平居中 */
	}
	
	.title {
	    font-size: 36rpx;                /* 字体大小 36rpx */
	    color: #8f8f94;                  /* 文字颜色（灰色） */
	}
</style>
1. 网络请求核心：http.js (拦截器封装)
封装的目的是：统一前缀、统一 Token 处理、统一错误拦截。
● Promise 包装：将 uni.request 的回调地步（callback）转换为 Promise，支持 .then() 或 async/await 链式调用。
● BaseUrl (基础路径)：统一管理服务器地址，方便环境切换（如从 Mock 切换到正式环境）。
● 请求头 (Header)：
  ○ uni.getStorageSync('token') || ''：从本地缓存同步获取 Token。这是小程序实现持久化登录的关键。
● 逻辑拦截 (Interceptor)：
  ○ Success (200状态码)：即使网络通了，也要看业务状态码（如 code == 1 表示业务成功）。
  ○ Fail (异常)：处理断网、服务器 500 等底层网络错误。
let baseUrl = 'https://m1.apifoxmock.com/m1/4728220-0-default/api'
/*baseUrl: 基础URL地址，所有接口的公共前缀
APIFox Mock: 一个API模拟工具，用于模拟后端接口返回数据
m1: Mock服务标识
4728220-0-default: 项目唯一标识ID*/
/*xport default: ES6模块导出语法，让其他文件可以导入使用
http: 函数名，用于发送HTTP请求
url: 接口路径，会拼接到baseUrl后面
data: 请求参数（对象格式）
method: 请求方法，默认GET，可选POST/PUT/DELETE等
= 'GET': 默认参数值*/
export default function http(url, data, method = 'GET') {
	return new Promise((resolve, reject) => {
		/*romise: JavaScript异步编程解决方案
resolve: 成功的回调函数reject: 失败时的回调函数
链式调用: 可以用.then()和.catch()处理结果*/
/*uni.request: uni-app提供的网络请求API
uni: uni-app的全局对象
request: 发起网络请求的方法*/
		uni.request({
			url: baseUrl + url,
			data,
			method,
			header: {/*uni.getStorageSync: 同步获取本地存储数据
|| '': 如果token不存在，使用空字符串*/
				'token': uni.getStorageSync('token') || ''
			},
			success: res => {
				/*res: response响应对象
res.data: 服务器返回的数据体
code: 业务状态码，1表示成功
msg: 服务器返回的消息*/
				if (res.data.code == 1) {
					resolve(res.data)
				} else {
					uni.showToast({
						title: res.data.msg || '请求失败',
						icon: 'none'
					})
					reject(res.data.msg)
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '服务器请求异常',
					icon: 'none'
				})
				reject(err)
			}
		}) // 👈 注意：这里只闭合 uni.request 的括号
	}) // 👈 这里闭合 Promise
}
2. 接口管理模块：api.js (模块化)
● 单一职责：将具体的 URL 路径封装成函数名（如 getBanner），页面调用时不直接接触 URL，降低耦合。
● 相对路径引入：import http from './http.js' 引入刚才封装好的工具函数。
● 导出规范：使用 export const 命名导出，方便在页面中按需引入。
// api.js
import http from './http.js'; // ./: 当前目录（相对路径）

export const getBanner = () => {
    console.log('1. 进入了 getBanner 函数'); // 👈 添加打印
    return http('/user/getBanner'); 
};/*xport const: 导出常量（函数）
getBanner: 函数名，获取轮播图数据
箭头函数: () => {} 是ES6的简写函数语法
/user/getBanner: 具体接口路径，实际请求: baseUrl + /user/getBanner*/

 面试高频知识点总结  
核心词汇	核心解释	备注
uni.request	uni-app 底层请求 API	类似于原生的 wx.request
 或 H5 的 fetch
Promise	异步编程方案	解决回调地狱，支持同步写法
Token 持久化	登录凭证管理	存入 StorageSync
，每次请求自动携带
Easycom	组件自动注册	uView 组件通常配置在 easycom 下，无需 import 即可使用
rpx	响应式像素	uni-app 根据屏幕宽度（750rpx）自动缩放
06-关于后端联调的问题

07-小程序和H5数据mock过程
uni-app 项目的入口配置、Mock 数据拦截机制、以及 Vue3 组合式 API 的实战调试。它是进阶开发中处理“前后端分离”和“本地仿真调试”的核心知识点。  
快速记忆口诀
Main 启动看版本，Mock 拦截看环境。Http 封前缀，Promise 传成功。Proxy 难看清，JSON 脱壳见真形。
4. API 模块化：api.js (业务接口)
● 语义化封装：将接口路径封装为 getBanner 等函数，避免页面直接书写硬编码字符串。
● ES6 箭头函数简写：() => http('/...') 提高了代码的简洁性。
// api.js
import http from './http.js'; // ./: 当前目录（相对路径）

export const getBanner = () => {
    console.log('1. 进入了 getBanner 函数'); // 👈 添加打印
    return http('/user/getBanner'); 
};/*xport const: 导出常量（函数）
getBanner: 函数名，获取轮播图数据
箭头函数: () => {} 是ES6的简写函数语法
/user/getBanner: 具体接口路径，实际请求: baseUrl + /user/getBanner*/
1. 项目入口文件：main.js (双版本兼容)
main.js 是小程序/App 的执行起点，负责初始化 Vue 实例。
● 条件编译 (#ifndef / #ifdef)：
  ○ Vue2 模式：使用 new Vue() 挂载，需要设置 App.mpType = 'app' 明确小程序身份。
  ○ Vue3 模式：使用 createSSRApp 开启服务端渲染兼容模式，是目前 uni-app 的主流写法。
● 全局引入：通过 import './api/mock.js' 在入口处引入 Mock 配置，确保整个应用生命周期内请求都能被拦截。
import App from './App'

import './api/mock.js'
/*ue	Vue.js核心库
productionTip	生产环境提示开关
mpType	小程序类型标识
new Vue()	创建Vue实例
...App	展开运算符，将App内容展开
$mount()	手动挂载Vue实例到页面*/

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}/*createSSRApp	创建服务端渲染应用的函数
SSR	Server-Side Rendering（服务端渲染）
export function	导出函数
createApp()	创建应用的函数名
return { app }	返回包含app的对象*/
// #endif
2. 数据模拟层：Mock.js 与 拦截逻辑
在后端接口未就绪时，前端通过 Mock 模拟真实返回。
● Mock.mock() 原理：
  ○ 使用正则表达式（如 /api\/user\/getBanner/）精准匹配请求路径。
  ○ 绑定本地数据函数（如 pageApi.getBanner），当匹配成功时，拦截真实网络请求，直接返回本地 JSON。
● 环境变量控制 (process.env.NODE_ENV)：
  ○ Development (开发环境)：开启 Mock 拦截。
  ○ Production (生产环境)：关闭 Mock，走真实 uni.request 访问服务器，实现无缝切换。
import Mock from 'mockjs'
import pageApi  from './mockData/pageApi'

Mock.mock(/api\/user\/getBanner/,'get', pageApi.getBanner)
/*Mock	Mock.js库的对象
mockjs	模拟数据生成库
Mock.mock()	Mock.js的核心方法，用于拦截请求
/api/user/getBanner/	正则表达式，匹配URL路径
正则表达式	用于匹配字符串模式的语法
/	正则中转义斜杠
'get'	要拦截的HTTP请求方法
pageApi.getBanner	返回模拟数据的函数*/
3. 请求工具层：http.js (手动拦截设计)
除了 Mock.js，你还展示了在 http.js 内部通过判断 url.includes 实现的手动拦截。
● Promise.resolve()：
  ○ 作用：将本地对象包装成一个“成功的 Promise”。
  ○ 意义：保证上层调用者（如 index.vue）可以统一使用 .then() 语法，无论是真实数据还是模拟数据，业务逻辑保持一致。
// http.js
import pageApi from './mockData/pageApi.js' 
/*pageApi	导入的模拟数据对象名
mockData	模拟数据目录
pageApi.js	页面API模拟数据文件*/
export default function http(url, data, method = 'GET') {
    if (process.env.NODE_ENV === 'development') {
		/*process.env	Node.js的环境变量对象
NODE_ENV	环境变量名，表示当前运行环境
development	开发环境
production	生产环境（上线后）*/
        /*url.includes()	检查字符串是否包含指定内容
mockData	模拟数据变量名
pageApi.getBanner()	调用pageApi对象的方法获取数据
Promise.resolve()	直接返回一个成功的Promise对象
return	函数返回，不再执行后续代码*/
        // 1. 拦截 Banner
        if (url.includes('user/getBanner')) {
            // 这里定义的名字是 mockData
            const mockData = pageApi.getBanner(); 
            
            // 💡 修正：这里必须使用上面定义的名字 mockData，不能用 response
            console.log('🚀 拦截成功，返回 Banner 数据:', mockData);
            return Promise.resolve(mockData);
        }

        // 2. 拦截 HomeList
        if (url.includes('user/getHomeList')) {
            const mockData = pageApi.getHomeList(); 
            
            console.log('🚀 拦截成功，返回列表数据:', mockData);
            return Promise.resolve(mockData);
        }
    }
    
    // ... 下面是你原有的 uni.request 逻辑
}
5. 页面调试技巧：index.vue (数据处理)
展示了 Vue3 script setup 下的调试最佳实践。
● onLoad 生命周期：小程序特有的钩子，在页面初次渲染前获取数据。
● Proxy 数据脱壳 (JSON.parse(JSON.stringify()))：
  ○ 痛点：Vue3 的响应式对象在 console.log 时会显示 Proxy 包装，难以直观查看原始值。
  ○ 技巧：先转为 JSON 字符串再转回对象，可以强行去掉 Proxy 代理，得到纯净的、可折叠的 JavaScript 数组/对象。
<template>
	<view class="content">
		<!--linear-gradient: CSS渐变函数-->
		<up-button 
			text="渐变色按钮" 
			color="linear-gradient(to right, rgb(66,83,216), rgb(213,51,186))"
		></up-button>
	</view>
</template>

<script setup>
    import { getBanner } from '../../api/api';
    import { onLoad } from '@dcloudio/uni-app';

    onLoad(() => {
        getBanner().then(res => {
            // --- 就在这里执行打印 ---
            
            // 方式 A：打印整个大盒子（最推荐，最完整的可折叠结构）
            console.log('📦 完整数据包 (点左侧箭头展开):', res);
//条件判断：res存在且code等于1,===	严格相等运算符（不进行类型转换）
            if (res && res.code === 1) {
                // 方式 B：如果你只想看数组部分，且不想看到 Proxy 字样
                const banners = res.data.bannerList;
                console.log('📂 纯净数组 (可折叠):', JSON.parse(JSON.stringify(banners)));
            }/*res.data.bannerList	从响应数据中取出bannerList数组
JSON.parse()	将JSON字符串转换为JavaScript对象
JSON.stringify()	将JavaScript对象转换为JSON字符串
JSON.parse(JSON.stringify())	深拷贝，去除Proxy代理*/
        })
    })
</script>
<style>
	.content {
	    display: flex;                    /* 弹性布局 */
	    flex-direction: column;          /* 垂直排列（上下方向） */
	    align-items: center;             /* 水平居中 */
	    justify-content: flex-start;     /* 垂直方向从顶部开始对齐 */
	    min-height: 100vh;               /* 最小高度占满整个视口（屏幕） */
	}
	
	.logo {
	    height: 200rpx;                  /* 高度 200rpx（响应式单位） */
	    width: 200rpx;                   /* 宽度 200rpx */
	    margin-top: 200rpx;              /* 上边距 200rpx */
	    margin-left: auto;               /* 左边距自动（配合 margin-right: auto 实现水平居中） */
	    margin-right: auto;              /* 右边距自动 */
	    margin-bottom: 50rpx;            /* 下边距 50rpx */
	}
	
	.text-area {
	    display: flex;                   /* 弹性布局 */
	    justify-content: center;         /* 水平居中 */
	}
	
	.title {
	    font-size: 36rpx;                /* 字体大小 36rpx */
	    color: #8f8f94;                  /* 文字颜色（灰色） */
	}
</style>
关键词	解释	开发用途
createSSRApp	Vue3 创建应用实例的方法	跨端适配，支持服务端渲染
process.env	Node.js 进程环境变量	区分开发环境和正式上线环境
Promise.resolve	立即返回成功状态	模拟异步网络响应
Regex (正则)	/.../
 符号定义的模式	用于匹配复杂的 URL 路径
Deep Copy	JSON.parse(stringify)	调试时查看响应式数据的原始值

把这个文件复制到开发中，然后调用这个文件里面的文字，到小程序显示出来







08-首页banner和搜索
官网uview-plushttps://uiadmin.net/uview-plus
快速记忆口诀
搜索 Search 放顶端，轮播 Swiper 占中间。Ref 定义数据源，Value 赋值不能删。V-if 判定数据到，防止组件白屏现。Padding 留白显高级，SCSS 嵌套最方便
 代码展示了 uni-app 首页核心功能的实现：搜索栏、轮播图（Swiper）以及公告栏。它结合了 uView-plus 组件库和 Vue3 的 setup 语法，是移动端应用最常见的布局模式。  
1. 核心组件功能 (UI 层)
使用了 uView-plus 的高频组件，极大简化了开发工作量：
● up-search (搜索栏)：
  ○ v-model：双向绑定搜索关键词 keyword。
  ○ :show-action="false"：隐藏右侧的“搜索”文字按钮，使界面更清爽。
● up-swiper (轮播图)：
  ○ v-if="bannerList.length > 0"：关键技巧。防止数据还未从接口返回时，组件加载空白或报错。
  ○ keyName="image"：指定从对象数组中提取哪个字段作为图片地址（这里对应接口返回的 image 字段）。
  ○ radius & autoplay：设置圆角和自动播放。
● up-notice-bar (公告栏)：
  ○ 用于滚动显示重要信息，提升页面的动态感。
2. 响应式数据逻辑 (Script 层)
代码使用了 Vue3 的 Composition API 组合式语法。
● ref 响应式声明：
  ○ const keyword = ref('')：定义字符串类型的响应式数据。
  ○ const bannerList = ref([])：定义数组类型的响应式数据，用于存放接口请求回来的图片列表。
● 异步数据请求：
  ○ 在 onLoad 生命周期内调用封装好的 getBanner()。
  ○ 赋值逻辑：通过 bannerList.value = ... 进行赋值（注意 ref 对象在脚本中修改必须加 .value）。
● 错误捕获：使用 .catch() 处理网络异常，防止程序崩溃。
3. 样式布局 (Style 层)
● SCSS 语法：lang="scss" 允许嵌套写法，代码结构更清晰。
● 盒模型：通过 padding: 20px 给整个内容区域留白，避免元素贴边。
● 响应式单位 rpx：min-height: 300rpx 确保不同屏幕下轮播图区域有基础的支撑高度，防止数据加载前布局塌陷。
<template>
	<view class="content">
		<up-search 
			placeholder="搜索经典" 
			bg-color="#e3e3e3" 
			v-model="keyword"
			:show-action="false"
		></up-search>
		
		<view class="banner-box">
			<up-swiper 
				v-if="bannerList.length > 0"
				:list="bannerList" 
				keyName="image"
				radius="8"
				:autoplay="true"
				showTitle
			></up-swiper>
			
			<up-notice-bar text="项目数据仅为示例,非真实数据"></up-notice-bar>
			<view class="list"></view>
		</view>
	</view>
</template>

<script setup>
	import { getBanner } from '../../api/api';
	import { onLoad } from '@dcloudio/uni-app';
	import { ref } from 'vue';

	const keyword = ref('');
	const bannerList = ref([]);

	onLoad(() => {
		getBanner().then(res => {
			if (res && res.code === 1) {
				bannerList.value = res.data.bannerList;
			}
		}).catch(err => {
			console.error('❌ 获取失败:', err);
		});
	});
</script>

<style lang="scss">
	.content {
		padding: 20px;
		.banner-box {
			margin-top: 20px;
			min-height: 300rpx;
		}
	}
</style>
 开发知识点避坑指南  
常见问题	解决方案	原因
轮播图不显示	检查 v-if
 或数据中的 keyName	组件需要数据加载完成后才能正确渲染索引。
搜索框无法输入	检查 v-model
 是否定义	如果没有声明 ref
，输入内容无法同步。
图片拉伸变形	在 up-swiper
 增加 imgMode
 属性	默认可能是填充，可以改为 aspectFill
 保持比例。
生命周期混淆	页面加载用 onLoad
，组件加载用 onMounted	onLoad
 是小程序/uni-app 专有，能获取页面参数。
09-瀑布流左侧内容显示
 这份代码在之前搜索和轮播的基础上，新增了移动端非常流行的**瀑布流（Waterfall）**布局。这种布局非常适合展示高度不一的图片内容  。
1. 瀑布流组件的核心：up-waterfall
瀑布流与普通列表的不同之处在于它分为“左右两栏”，组件会自动计算图片高度并将内容插入到较短的那一栏。
● 插槽机制 (v-slot)：
  ○ v-slot:left：定义左侧列的显示模板。
  ○ v-slot:right：定义右侧列的显示模板。
  ○ 技巧：左右两边的模板代码通常是一模一样的，确保视觉一致性。
● 懒加载优化 (up-lazy-load)：
  ○ 瀑布流通常伴随大量图片，使用懒加载组件可以显著提升首屏渲染速度，只有当图片进入视口时才开始下载。
● 数据绑定：通过 v-model="flowList" 绑定数据源，组件内部会自动分配数据到左右插槽。
2. 列表项的样式精雕 (Style)
为了让瀑布流看起来更专业，代码中应用了几个关键 CSS 技巧：
● 阴影与圆角 (box-shadow & border-radius)：给卡片增加轻微阴影，营造出“悬浮”感和层次感。
● 绝对定位角标 (isDot)：
  ○ 父元素 .demo-warter 必须设置 position: relative。
  ○ 角标 .isDot 设置 position: absolute，通过 top 和 right 将“热门”或“标签”精准定位在卡片右上角。
● 标签排版 (demo-tag)：使用 flex 布局，配合不同颜色的 border 区分不同属性的标签（如：橙色圆角表示“分类”，蓝色方角表示“等级”）。
3. 数据驱动逻辑 (Script)
● 并发请求：在 onLoad 中同时发起 getBanner 和 getHomeList。
● 响应式更新：
  ○ bannerList 控制顶部轮播。
  ○ flowList 驱动瀑布流列表。
● 严谨性判断：赋值前判断 res.code === 1，确保数据格式正确，避免非法数据导致页面崩溃。
知识点	面试回答要点
瀑布流原理	左右等宽，动态计算各列高度，将新元素插入到当前总高度最小的那一列。
图片懒加载	监听滚动位置，通过 IntersectionObserver
 API 判断元素是否可见，可见时替换 src
。
性能优化	除了懒加载，还可以使用“虚拟列表”技术，仅渲染屏幕可见范围内的 DOM 节点。
层级处理 (Z-index)	在瀑布流卡片中，角标（Hot）的 z-index
 需高于图片，确保文字不被遮挡。
<template>
	<view class="content">
		<up-search 
			placeholder="搜索经典" 
			bg-color="#e3e3e3" 
			v-model="keyword"
			:show-action="false"
		></up-search>
		
		<view class="banner-box">
			<up-swiper 
				v-if="bannerList.length > 0"
				:list="bannerList" 
				keyName="image"
				radius="8"
				:autoplay="true"
				showTitle
			></up-swiper>
			
			<up-notice-bar text="项目数据仅为示例,非真实数据"></up-notice-bar>
			
			<view class="list">
				<up-waterfall v-model="flowList" ref="uWaterfallRef">
					<template v-slot:left="{leftList}">
						<view class="demo-warter" v-for="(item, index) in leftList" :key="item.id">
							<up-lazy-load border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag" v-if="item.tag && item.tag.length > 0">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text" v-if="item.tag[1]">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
					
					<template v-slot:right="{rightList}">
						<view class="demo-warter" v-for="(item, index) in rightList" :key="item.id">
							<up-lazy-load border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag" v-if="item.tag && item.tag.length > 0">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text" v-if="item.tag[1]">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
				</up-waterfall>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { getBanner, getHomeList } from '../../api/api';
	import { onLoad } from '@dcloudio/uni-app';
	import { ref } from 'vue';

	const keyword = ref('');
	const bannerList = ref([]); 
	const flowList = ref([]);   

	onLoad(() => {
		getBanner().then(res => {
			if (res && res.code === 1) {
				bannerList.value = res.data.bannerList;
			}
		});

		getHomeList().then(res => {
			if (res && res.code === 1) {
				flowList.value = res.data; 
			}
		});
	});
</script>

<style lang="scss">
	.content {
		padding: 20px;
		.banner-box {
			margin-top: 20px;
			min-height: 300rpx;
		}
		.list {
			margin: 30rpx 0;
			.demo-warter {
				margin: 10rpx;
				background-color: #fff;
				border-radius: 16rpx;
				padding: 16rpx;
				box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
				position: relative; // 必须有，否则角标定位会乱
			}
			.demo-title {
				font-size: 28rpx;
				font-weight: bold;
				margin-top: 10rpx;
				color: #303133;
			}
			.demo-price {
				font-size: 22rpx;
				color: #909399;
				margin-top: 10rpx;
			}
			.demo-tag {
				display: flex;
				margin-top: 10rpx;
				.demo-tag-owner {
					border: 1px solid #ffaa00;
					color: #ffaa00;
					font-size: 18rpx;
					padding: 2rpx 10rpx;
					border-radius: 50rpx;
				}
				.demo-tag-text {
					border: 1px solid #00aaff;
					color: #00aaff;
					margin-left: 10rpx;
					padding: 2rpx 10rpx;
					font-size: 18rpx;
					border-radius: 8rpx;
				}
			}
			.isDot {
				position: absolute;
				top: 10rpx;
				right: 10rpx;
				font-size: 20rpx;
				color: #fff;
				background-color: #ff4444;
				border-radius: 6rpx;
				padding: 2rpx 8rpx;
				z-index: 10;
			}
		}
	}
</style>

10-瀑布流右侧内容和置顶功能实现
uview-plus 的官网地址是：https://uview-plus.jiangruyi.com/-2-4
 这份代码是 uni-app 首页开发的完整进阶版本。它在瀑布流的基础上，增加了移动端极其重要的两个功能：触底加载更多（无限滚动） 和 回到顶部（Scroll to Top）。 
触底加载与页面滚动交互
1. 触底加载逻辑 (onReachBottom)
这是实现“无限滚动”列表的核心。
● 触发机制：当页面滚动到距离底部一定距离（默认 50px）时自动触发。
● 模拟分页逻辑 (addRandomData)：
  ○ 深拷贝数据：使用 JSON.parse(JSON.stringify()) 复制已有数据，防止引用同一对象导致修改混乱。
  ○ 唯一 ID 处理：关键点！ 瀑布流依赖 key 值渲染。通过 Date.now() + Math.random() 生成临时唯一 ID，避免 Vue 渲染报错。
  ○ 数组合并：使用扩展运算符 [...flowList.value, ...newData] 将新数据追加到旧数组末尾。
2. 回到顶部交互 (onPageScroll)
提升用户体验的“标配”功能。
● 显示/隐藏逻辑：
  ○ 通过 onPageScroll 监听滚动条位置 e.scrollTop。
  ○ 设置阈值（如 400px），超过则 showTopBtn.value = true，否则隐藏。这体现了按需显示的 UI 原则。
● 平滑滚动 (uni.pageScrollTo)：
  ○ duration: 300：设置 300 毫秒的过渡时间，比瞬间跳转更符合用户视觉预期。
3. 性能优化技巧：懒加载阈值
● threshold="-450"：
  ○ 在 up-lazy-load 组件中，该参数决定了图片提前加载的时机。
  ○ -450 表示图片距离屏幕底部还有 450px 时就开始下载，能有效减少用户看到“转圈圈”的时间。
<template>
	<view class="content">
		<up-search 
			placeholder="搜索经典" 
			bg-color="#e3e3e3" 
			v-model="keyword"
			:show-action="false"
		></up-search>
		
		<view class="banner-box">
			<up-swiper 
				v-if="bannerList.length > 0"
				:list="bannerList" 
				keyName="image"
				radius="8"
				:autoplay="true"
				showTitle
			></up-swiper>
			
			<up-notice-bar text="项目数据仅为示例,非真实数据"></up-notice-bar>
			
			<view class="list">
				<up-waterfall v-model="flowList" ref="uWaterfallRef">
					<template v-slot:left="{leftList}">
						<view class="demo-warter" v-for="(item, index) in leftList" :key="item.id">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
					
					<template v-slot:right="{rightList}">
						<view class="demo-warter" v-for="(item, index) in rightList" :key="item.id">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
				</up-waterfall>
			</view>
		</view>

		<view v-if="showTopBtn" @click="handleToTop" class="topClass">
			<up-icon name="arrow-upward" color="#fff" size="24"></up-icon>
		</view>
	</view>
</template>

<script setup>
	import { getBanner, getHomeList } from '../../api/api';
	import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
	import { ref } from 'vue';

	const keyword = ref('');
	const bannerList = ref([]); 
	const flowList = ref([]); 
	const showTopBtn = ref(false);

	// --- 1. 数据加载方法 ---
	const loadInitialData = () => {
		getBanner().then(res => {
			if (res && res.code === 1) {
				bannerList.value = res.data.bannerList;
			}
		});

		getHomeList().then(res => {
			if (res && res.code === 1) {
				flowList.value = res.data; 
			}
		});
	};

	// 模拟触底加载更多数据
	const addRandomData = () => {
		if (flowList.value.length === 0) return;
		
		const newData = [];
		for (let i = 0; i < 6; i++) {
			// 随机抽取现有的一条数据进行复制
			let randomIndex = Math.floor(Math.random() * flowList.value.length);
			let item = JSON.parse(JSON.stringify(flowList.value[randomIndex]));
			
			// 必须更改 ID，否则 Vue 渲染 key 会冲突报错
			// 如果 uni.$u.guid() 报错，直接用时间戳+随机数
			item.id = Date.now() + Math.random().toString(36).substr(2, 9);
			newData.push(item);
		}
		// 追加到列表
		flowList.value = [...flowList.value, ...newData];
	};

	// --- 2. 生命周期钩子 ---

	onLoad(() => {
		loadInitialData();
	});

	// 监听触底
	onReachBottom(() => {
		console.log('触发加载更多');
		uni.showLoading({ title: '加载中...' });
		setTimeout(() => {
			addRandomData();
			uni.hideLoading();
		}, 800);
	});

	// 监听滚动：显示/隐藏回到顶部按钮
	onPageScroll((e) => {
		showTopBtn.value = e.scrollTop > 400;
	});

	// --- 3. 交互方法 ---

	const handleToTop = () => {
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 300
		});
	};
</script>

<style lang="scss">
	.content {
		padding: 20px;
		background-color: #f5f5f5;
		min-height: 100vh;

		.banner-box {
			margin-top: 20px;
		}

		.list {
			margin: 30rpx 0;
			.demo-warter {
				margin: 10rpx;
				background-color: #fff;
				border-radius: 16rpx;
				padding: 16rpx;
				box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
				position: relative;
			}
			.demo-title {
				font-size: 28rpx;
				font-weight: bold;
				margin-top: 10rpx;
				color: #303133;
			}
			.demo-price {
				font-size: 22rpx;
				color: #909399;
				margin-top: 10rpx;
			}
			.demo-tag {
				display: flex;
				margin-top: 10rpx;
				.demo-tag-owner {
					border: 1px solid #ffaa00;
					color: #ffaa00;
					font-size: 18rpx;
					padding: 0 10rpx;
					border-radius: 50rpx;
				}
				.demo-tag-text {
					border: 1px solid #00aaff;
					color: #00aaff;
					margin-left: 10rpx;
					padding: 0 10rpx;
					font-size: 18rpx;
					border-radius: 8rpx;
				}
			}
			.isDot {
				position: absolute;
				top: 10rpx;
				right: 10rpx;
				font-size: 20rpx;
				color: #fff;
				background-color: #fa3534;
				padding: 2rpx 10rpx;
				border-radius: 8rpx;
				z-index: 1;
			}
		}

		.topClass {
			position: fixed;
			bottom: 120rpx;
			right: 40rpx;
			background-color: rgba(0, 0, 0, 0.6);
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 99;
		}
	}
</style>
 
11-我的页面样式和uni-icon引入
这两份代码展示了 uni-app 页面设计的两个重要方面：“我的”页面（个人中心）的弧形背景设计，以及**“首页”完整的功能交互实现**。
以下是为你整理的开发笔记，侧重于 CSS 高级装饰技巧 和 页面交互逻辑。
1. CSS 弧形背景特效 (topBox 模拟)
在个人中心或详情页头部，常用的“圆弧底”背景并不是一张图片，而是通过 CSS 伪元素模拟的：
● 原理：使用 ::after 伪元素创建一个比容器更宽的矩形（如 width: 140%）。
● 关键属性：
  ○ border-radius: 0 0 50% 50%：将矩形的底部两个角设为巨大的圆角，从而形成完美的弧线。
  ○ left: -20%：通过负偏移让超宽的伪元素左右居中。
  ○ z-index: -1：确保背景弧形处在文字和图标下方。
● 优势：比图片加载更快，且支持颜色渐变，适配所有屏幕尺寸。
2. 页面生命周期与滚动监听
首页代码展示了如何处理用户与屏幕的频繁交互：
● onPageScroll (页面滚动)：
  ○ 用于实时获取滚动距离 e.scrollTop。
  ○ 业务逻辑：当用户下滑超过 400px 时，才通过 showTopBtn 变量显示“回到顶部”按钮，保持界面简洁。
● onReachBottom (触底加载)：
  ○ 移动端性能优化的核心。不一次性加载千条数据，而是分批加载，配合 uni.showLoading 提升用户心理预期。
3. 瀑布流中的数据安全与渲染
● 深拷贝防止引用干扰：
  ○ JSON.parse(JSON.stringify(item))：在模拟“加载更多”时，通过这种方式彻底复制对象。
  ○ 重要性：如果不进行深拷贝，修改新数据的 id 可能会无意中修改了原数组中的旧数据，导致 Vue 渲染紊乱。
● ID 唯一性策略：
  ○ 瀑布流组件对 key 值的要求极高。使用 Date.now() + Math.random() 组合生成 ID 是前端临时解决 Key 冲突的最稳妥方法。
4. 样式细节优化
● page 标签全局样式：
  ○ 在 <style> 中直接写 page { background-color: ... } 是修改 uni-app 页面底层背景色的标准做法，因为它对应着 HTML 的 body。
● Fixed 定位 z-index：
  ○ “回到顶部”按钮使用 position: fixed，并给 z-index: 99，确保它永远浮动在瀑布流卡片和轮播图的最上方。
技术点	作用	记忆点
::after 弧形	视觉美化	宽 140% + 底部 50% 圆角。
gap: 20rpx	Flex 子项间距	Flex 布局中最简单的间距控制方式。
scoped	样式隔离	确保当前页面的 CSS 不会污染其他页面。
threshold	懒加载阈值	设置 -450
 提前加载图片，消灭白块。
<template>
  <view class="content">
    <view class="topBox">
      <view class="setbox">
        <view class="set-left">
          <!-- 日历图标 + 签到文字 -->
          <up-icon name="calendar" size="30" color="#fff"></up-icon>
          <view class="txt">签到</view>
        </view>
        <view class="set-right">
          <!-- 设置图标 -->
          <up-icon name="setting" size="30" color="#fff"></up-icon>
          <!-- 聊天/消息图标 -->
          <up-icon name="chat" size="30" color="#fff"></up-icon>
        </view>
      </view>
    </view>

    <view class="listBox">
      <!-- 列表内容区域，后续可添加瀑布流、卡片等 -->
    </view>
  </view>
</template>

<script setup>
// 页面逻辑可在此添加
// 例如：签到功能、跳转设置页、打开聊天等
</script>

<style lang="scss" scoped>
.content {
  min-height: 100vh;           // 最小高度占满视口
  background-color: #f5f5f5;   // 整体背景色

  .topBox {
    width: 100%;
    position: relative;         // 为伪元素提供定位基准
    z-index: 1;                // 确保内容在伪元素上方
    overflow: hidden;          // 隐藏溢出，实现圆角裁剪
    padding: 40rpx 20rpx;      // 上下40rpx，左右20rpx
    box-sizing: border-box;    // 边框盒模型
    
    // 伪元素：创建蓝色弧形背景
    &::after {
      content: "";
      width: 140%;             // 宽度超宽，实现弧形效果
      height: 200px;           // 固定高度
      position: absolute;
      z-index: -1;             // 放在内容下方
      top: 0;
      left: -20%;              // 向左偏移，使弧顶居中
      background-color: #00aaff; // 蓝色背景
      border-radius: 0 0 50% 50%; // 底部圆弧效果
    }
  }

  .setbox {
    display: flex;
    justify-content: space-between; // 左右两端对齐
    align-items: center;            // 垂直居中

    .set-left {
      display: flex;
      align-items: center;          // 图标和文字垂直居中
      
      .txt {
        color: #fff;                // 白色文字
        font-size: 30rpx;          // 字号
        margin-left: 10rpx;        // 与图标的间距
      }
    }
    
    .set-right {
      display: flex;
      gap: 20rpx;                  // 两个图标之间的间距
    }
  }

  .listBox {
    padding: 20rpx;                // 列表内容内边距
  }
}
</style>
<template>
	<view class="content">
		<up-search 
			placeholder="搜索经典" 
			bg-color="#e3e3e3" 
			v-model="keyword"
			:show-action="false"
		></up-search>
		
		<view class="banner-box">
			<up-swiper 
				v-if="bannerList.length > 0"
				:list="bannerList" 
				keyName="image"
				radius="8"
				:autoplay="true"
				showTitle
			></up-swiper>
			
			<up-notice-bar text="项目数据仅为示例,非真实数据"></up-notice-bar>
			
			<view class="list">
				<up-waterfall v-model="flowList" ref="uWaterfallRef">
					<template v-slot:left="{leftList}">
						<view class="demo-warter" v-for="(item, index) in leftList" :key="item.id">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
					
					<template v-slot:right="{rightList}">
						<view class="demo-warter" v-for="(item, index) in rightList" :key="item.id">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
				</up-waterfall>
			</view>
		</view>

		<view v-if="showTopBtn" @click="handleToTop" class="topClass">
			<up-icon name="arrow-upward" color="#fff" size="24"></up-icon>
		</view>
	</view>
</template>

<script setup>
	import { getBanner, getHomeList } from '../../api/api';
	import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
	import { ref } from 'vue';

	const keyword = ref('');
	const bannerList = ref([]); 
	const flowList = ref([]); 
	const showTopBtn = ref(false);

	// --- 1. 数据加载方法 ---
	const loadInitialData = () => {
		getBanner().then(res => {
			if (res && res.code === 1) {
				bannerList.value = res.data.bannerList;
			}
		});

		getHomeList().then(res => {
			if (res && res.code === 1) {
				flowList.value = res.data; 
			}
		});
	};

	// 模拟触底加载更多数据
	const addRandomData = () => {
		if (flowList.value.length === 0) return;
		
		const newData = [];
		for (let i = 0; i < 6; i++) {
			// 随机抽取现有的一条数据进行复制
			let randomIndex = Math.floor(Math.random() * flowList.value.length);
			let item = JSON.parse(JSON.stringify(flowList.value[randomIndex]));
			
			// 必须更改 ID，否则 Vue 渲染 key 会冲突报错
			// 如果 uni.$u.guid() 报错，直接用时间戳+随机数
			item.id = Date.now() + Math.random().toString(36).substr(2, 9);
			newData.push(item);
		}
		// 追加到列表
		flowList.value = [...flowList.value, ...newData];
	};

	// --- 2. 生命周期钩子 ---

	onLoad(() => {
		loadInitialData();
	});

	// 监听触底
	onReachBottom(() => {
		console.log('触发加载更多');
		uni.showLoading({ title: '加载中...' });
		setTimeout(() => {
			addRandomData();
			uni.hideLoading();
		}, 800);
	});

	// 监听滚动：显示/隐藏回到顶部按钮
	onPageScroll((e) => {
		showTopBtn.value = e.scrollTop > 400;
	});

	// --- 3. 交互方法 ---

	const handleToTop = () => {
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 300
		});
	};
</script>
<style>
	page {
		background-color:rgb(240,240,240);
	}
</style>
<style lang="scss" scoped>
	.content {
		padding: 20px;
		background-color: #f5f5f5;
		min-height: 100vh;

		.banner-box {
			margin-top: 20px;
		}

		.list {
			margin: 30rpx 0;
			.demo-warter {
				margin: 10rpx;
				background-color: #fff;
				border-radius: 16rpx;
				padding: 16rpx;
				box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
				position: relative;
			}
			.demo-title {
				font-size: 28rpx;
				font-weight: bold;
				margin-top: 10rpx;
				color: #303133;
			}
			.demo-price {
				font-size: 22rpx;
				color: #909399;
				margin-top: 10rpx;
			}
			.demo-tag {
				display: flex;
				margin-top: 10rpx;
				.demo-tag-owner {
					border: 1px solid #ffaa00;
					color: #ffaa00;
					font-size: 18rpx;
					padding: 0 10rpx;
					border-radius: 50rpx;
				}
				.demo-tag-text {
					border: 1px solid #00aaff;
					color: #00aaff;
					margin-left: 10rpx;
					padding: 0 10rpx;
					font-size: 18rpx;
					border-radius: 8rpx;
				}
			}
			.isDot {
				position: absolute;
				top: 10rpx;
				right: 10rpx;
				font-size: 20rpx;
				color: #fff;
				background-color: #fa3534;
				padding: 2rpx 10rpx;
				border-radius: 8rpx;
				z-index: 1;
			}
		}

		.topClass {
			position: fixed;
			bottom: 120rpx;
			right: 40rpx;
			background-color: rgba(0, 0, 0, 0.6);
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 99;
		}
	}
</style>
📋 报错原因总结
核心问题
组件库不匹配 - 你的项目使用的是 uview-plus UI 库，但代码中使用了 uni-ui 的 uni-icons 组件。
错误信息分析
[Vue warn]: Failed to resolve component: uni-icons
Vue 无法找到 uni-icons 这个组件
因为项目中根本没有安装或注册这个组件
为什么会出现这个问题？
1.项目实际使用的 UI 库
从日志 uview-plus V3 https://uview-plus.jiangruyi.com/ 可以看出
你的项目已正确安装并配置了 uview-plus
2.代码中混用了不同 UI 库
第一个页面使用 up- 前缀（uview-plus）
第二个页面错误使用了 uni- 前缀（uni-ui）
两者是完全独立的组件库，不能混用
3.缺少组件注册
uni-icons 不是 uview-plus 的组件
项目没有安装 uni-ui，所以找不到这个组件
解决方案对比
方案	操作	优缺点
✅ 推荐	将 uni-icons 改为 up-icon	无需额外安装，与项目统一
⚠️ 备选	安装并配置 uni-ui	增加项目体积，可能样式冲突



12-我的页面卡片效果实现
 这份代码是“我的”页面（个人中心）的核心架构。它通过 CSS 技巧实现了美观的“悬浮卡片”效果，并结合了 Vue3 的条件渲染来处理登录状态。  
1. 悬浮卡片布局逻辑 (user-card)
这种设计让页面更有层次感，看起来用户信息是“漂浮”在蓝色背景之上的。
● 层级关系：
  ○ 背景层：.topBox::after 伪元素负责圆弧背景。
  ○ 内容层：.user-card 设置 position: relative 并给一个正数的 z-index，确保它在背景上方。
● 阴影与圆角：
  ○ box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.05)：使用极浅的阴影增加呼吸感。
  ○ border-radius: 16rpx：配合背景色实现卡片化视觉。
● 关键修正点：
  ○ 在 .topBox 容器中不能使用 overflow: hidden。如果开启了隐藏溢出，超出容器底部的卡片阴影或边缘会被截断。
2. 条件渲染处理登录态 (v-if / v-else)
代码展示了如何根据 userInfo 的内容动态展示界面：
● 未登录状态：userInfo.nickName 为空。显示默认头像（/static/tt.jpg）和“注册/登录”提示文字。
● 已登录状态：显示用户真实的 acatarUrl（头像）和 nickName（昵称）。
● 响应式对象 (reactive)：
  ○ 使用 reactive 定义 userInfo。这种方式非常适合管理像用户信息这样包含多个属性的对象。

3. 数据统计栏设计 (u-bottom)
这是一种经典的“宫格统计”布局：
● Flex 布局：使用 justify-content: space-around 让四个统计项（点赞、喜欢、收藏、浏览）在水平方向上等间距排列。
● 视觉重心：
  ○ .num：加粗并使用较大字号（33rpx），突出核心数据。
  ○ .u-tit：使用灰色（#757575）和较小字号（26rpx），作为辅助说明。
4. 样式细节深度解析
● box-sizing: border-box：
  ○ 这是一个必须养成的习惯。它确保你设置的 padding（内边距）不会把容器撑大，方便精确计算布局。
● gap: 20rpx：
  ○ 在 .set-right 中，利用 gap 属性可以非常方便地控制多个图标（设置、消息）之间的间距，而不需要给每个图标单独写 margin。
技术点	作用	记忆点
reactive	声明响应式对象	修改属性时，视图会自动更新。
v-if / v-else	条件分支渲染	切换登录/未登录两种界面。
space-around	水平等距分布	子元素两侧都有均匀间隙。
::after	创建装饰性背景	配合绝对定位，不占用 DOM 空间。
<template>
  <view class="content">
    <view class="topBox">
      <view class="setbox">
        <view class="set-left">
          <up-icon name="calendar" size="30" color="#fff"></up-icon>
          <view class="txt">签到</view>
        </view>
        <view class="set-right">
          <up-icon name="setting" size="30" color="#fff"></up-icon>
          <up-icon name="chat" size="30" color="#fff"></up-icon>
        </view>
      </view>

      <view class="user-card">
        <view class="u-top">
          <template v-if="!userInfo.nickName">
            <image src="/static/tt.jpg" mode="aspectFill"></image>
            <view class="tit">注册/登录</view>
          </template>
          <template v-else>
            <image :src="userInfo.acatarUrl" mode="aspectFill"></image>
            <view class="tit">{{ userInfo.nickName }}</view>
          </template>
        </view>
        <view class="u-bottom">
          <view class="u-item">
            <view class="num">12</view>
            <view class="u-tit">点赞</view>
          </view>
          <view class="u-item">
            <view class="num">12</view>
            <view class="u-tit">喜欢</view>
          </view>
          <view class="u-item">
            <view class="num">12</view>
            <view class="u-tit">收藏</view>
          </view>
          <view class="u-item">
            <view class="num">12</view>
            <view class="u-tit">浏览</view>
          </view>
        </view>
      </view>
    </view>

    <view class="listBox">
      <!-- 列表内容区域 -->
    </view>
  </view>
</template>

<script setup>
import { reactive } from 'vue'

const userInfo = reactive({
  nickName: '',      // 用户昵称
  acatarUrl: ''      // 用户头像地址
})
</script>

<style lang="scss" scoped>
.content {
  min-height: 100vh;
  background-color: #f5f5f5;

  .topBox {
    width: 100%;
    position: relative;
    z-index: 1;
    // 注意：如果要显示悬浮卡片，这里不能用 overflow: hidden
    padding: 40rpx 20rpx 100rpx; // 增加底部内边距给卡片留位
    box-sizing: border-box;

    // 伪元素：蓝色弧形背景
    &::after {
      content: "";
      width: 140%;
      height: 350rpx;        // 调高背景高度
      position: absolute;
      z-index: -1;
      top: 0;
      left: -20%;
      background-color: #00aaff;
      border-radius: 0 0 50% 50%;
    }
  }

  // 顶部图标栏
  .setbox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .set-left {
      display: flex;
      align-items: center;
      
      .txt {
        color: #fff;
        font-size: 30rpx;
        margin-left: 10rpx;
      }
    }
    
    .set-right {
      display: flex;
      gap: 20rpx;
    }
  }

  // 用户信息卡片
  .user-card {
    margin-top: 40rpx;
    padding: 30rpx;
    background-color: #fff;
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.05);
    border-radius: 16rpx;
    position: relative;      // 提高层级，确保在背景上方

    // 卡片顶部：头像和昵称
    .u-top {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;
      
      image {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background-color: #eee;
      }
      
      .tit {
        font-size: 32rpx;
        font-weight: 700;
        color: #333;
      }
    }

    // 卡片底部：统计数据
    .u-bottom {
      display: flex;
      justify-content: space-around;
      align-items: center;

      .u-item {
        text-align: center;
        
        .num {
          color: #000;
          font-size: 33rpx;
          font-weight: 700;
        }
        
        .u-tit {
          color: #757575;
          font-size: 26rpx;
          margin-top: 10rpx;
        }
      }
    }
  }

  // 列表容器
  .listBox {
    padding: 20rpx;
  }
}
</style>

13-用户鉴权流程介绍

14-用户信息获取异常流程介绍
 这份代码实现了一个功能完整的微信小程序“个人中心”登录授权体系。它不仅包含了 UI 装饰，还深度集成了微信最新的头像昵称填写能力、用户协议校验以及本地数据持久化。
1. 微信头像昵称填写 (新规适配)
微信目前不再直接通过 API 返回用户头像昵称，需要用户手动触发填写：
● 头像选择 (open-type="chooseAvatar")：
  ○ 必须使用 button 组件并设置 open-type。
  ○ 在 @chooseavatar 事件中，通过 e.detail.avatarUrl 获取图片临时路径。
● 昵称输入 (type="nickname")：
  ○ input 组件设置 type="nickname" 后，点击输入框会弹出微信昵称插件，用户可一键选择。
  ○ 关键点：由于它是插件填入，v-model 有时无法实时捕获，建议配合 @blur（失去焦点）事件通过 e.detail.value 进行二次确认。
2. 合规性设计：用户协议校验
根据应用商店和微信的监管要求，登录前必须有明显的勾选协议步骤：
● 交互逻辑：定义 isAgree 响应式变量。如果用户未勾选就点击“允许”，使用 uni.showToast 进行强提示拦截。
● 样式实现：使用一个圆形的 view 模拟 checkbox，通过动态绑定 :class="{ 'checked': isAgree }" 实现视觉上的选中效果。
3. 数据持久化策略 (uni.setStorageSync)
为了保证用户关闭小程序后再打开依然是登录状态：
● 存储数据：在 saveProfile 成功后，将用户信息存入本地缓存 user_info。
● 初始化恢复 (onLoad)：
  ○ 页面加载时使用 uni.getStorageSync('user_info') 读取。
  ○ 使用 Object.assign(userInfo, cache) 将缓存数据快速合并到响应式对象中，实现自动登录。
4. 弹出层交互 (up-popup)
使用 uView-plus 的弹出层组件作为登录底部的“抽屉”：
● 模式设定：mode="bottom" 配合 round="20"（圆角），符合现代移动端 UI 规范。
● 触发条件：点击用户卡片时判断 userInfo.nickName 是否存在，若为空则弹出，已登录则不触发（防止重复授权）。
  
<template>
	<view class="content">
		<view class="topBox">
			<view class="setbox">
				<view class="set-left">
					<up-icon name="calendar" size="30" color="#fff"></up-icon>
					<view class="txt">签到</view>
				</view>
				<view class="set-right">
					<up-icon name="setting" size="30" color="#fff"></up-icon>
					<up-icon name="chat" size="30" color="#fff"></up-icon>
				</view>
			</view>

			<view class="user-card" @click="handleCardClick">
				<view class="u-top">
					<image :src="userInfo.avatarUrl || '/static/tt.jpg'" mode="aspectFill"></image>
					<view class="tit">{{ userInfo.nickName || '注册 / 登录' }}</view>
				</view>
				<view class="u-bottom">
					<view class="u-item" v-for="(item, index) in stats" :key="index">
						<view class="num">{{ item.value }}</view>
						<view class="u-tit">{{ item.label }}</view>
					</view>
				</view>
			</view>
		</view>

		<up-popup :show="showLoginPopup" mode="bottom" round="20" @close="showLoginPopup = false">
			<view class="login-drawer">
				<view class="header">
					<text class="title">微信授权登录</text>
					<up-icon name="close" @click="showLoginPopup = false"></up-icon>
				</view>
				
				<view class="tips">申请获取您的头像、昵称，用于完善个人资料</view>

				<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image :src="tempAvatar || '/static/tt.jpg'" mode="aspectFill"></image>
					<view class="mask">修改头像</view>
				</button>

				<view class="input-group">
					<text>昵称</text>
					<input 
						type="nickname" 
						class="nickname-input" 
						placeholder="点击获取微信昵称" 
						v-model="tempName"
						@blur="onNicknameBlur"
					/>
				</view>

				<view class="protocol-box" @click="isAgree = !isAgree">
					<view class="checkbox" :class="{ 'checked': isAgree }">
						<up-icon v-if="isAgree" name="checkbox-mark" color="#fff" size="12"></up-icon>
					</view>
					<text class="p-txt">我已阅读并同意 <text class="link">《用户协议》</text> 与 <text class="link">《隐私政策》</text></text>
				</view>

				<view class="btn-group">
					<button class="btn refuse" @click="showLoginPopup = false">拒绝</button>
					<button class="btn allow" @click="saveProfile">允许</button>
				</view>
			</view>
		</up-popup>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const userInfo = reactive({ nickName: '', avatarUrl: '' })
const tempAvatar = ref('')
const tempName = ref('')
const showLoginPopup = ref(false)
const isAgree = ref(false) // 协议打钩状态

const stats = reactive([
	{ label: '点赞', value: 12 }, { label: '喜欢', value: 12 },
	{ label: '收藏', value: 12 }, { label: '浏览', value: 12 }
])

onLoad(() => {
	const cache = uni.getStorageSync('user_info')
	if (cache) Object.assign(userInfo, cache)
})

const handleCardClick = () => {
	if (userInfo.nickName) return
	showLoginPopup.value = true
}

const onChooseAvatar = (e) => { tempAvatar.value = e.detail.avatarUrl }
const onNicknameBlur = (e) => { tempName.value = e.detail.value }

// 点击“允许”按钮
const saveProfile = () => {
	// 先检查是否打钩
	if (!isAgree.value) {
		return uni.showToast({ title: '请先勾选并同意协议', icon: 'none' })
	}
	// 检查是否填写信息
	if (!tempName.value) {
		return uni.showToast({ title: '请完善昵称', icon: 'none' })
	}
	
	userInfo.nickName = tempName.value
	userInfo.avatarUrl = tempAvatar.value || '/static/tt.jpg'
	
	uni.setStorageSync('user_info', {
		nickName: userInfo.nickName,
		avatarUrl: userInfo.avatarUrl
	})
	
	showLoginPopup.value = false
	uni.showToast({ title: '已授权登录', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.content {
	min-height: 100vh;
	background-color: #f5f5f5;

	.topBox {
		width: 100%; position: relative; z-index: 1;
		padding: 40rpx 30rpx 120rpx; box-sizing: border-box;
		&::after {
			content: ""; width: 140%; height: 380rpx; position: absolute;
			z-index: -1; top: 0; left: -20%; background-color: #00aaff;
			border-radius: 0 0 50% 50%;
		}
	}

	.setbox {
		display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx;
		.set-left { display: flex; align-items: center; .txt { color: #fff; font-size: 30rpx; margin-left: 10rpx; } }
		.set-right { display: flex; gap: 30rpx; }
	}

	.user-card {
		padding: 40rpx 30rpx; background-color: #fff; border-radius: 20rpx;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
		.u-top {
			display: flex; align-items: center; margin-bottom: 40rpx;
			image { width: 110rpx; height: 110rpx; border-radius: 50%; margin-right: 24rpx; background-color: #f8f8f8; }
			.tit { font-size: 34rpx; font-weight: bold; color: #333; }
		}
		.u-bottom {
			display: flex; justify-content: space-around;
			.u-item { text-align: center; .num { font-size: 32rpx; font-weight: bold; color: #333; } .u-tit { font-size: 24rpx; color: #999; margin-top: 8rpx; } }
		}
	}

	.login-drawer {
		padding: 40rpx; background-color: #fff; display: flex; flex-direction: column; align-items: center;
		.header { width: 100%; display: flex; justify-content: space-between; margin-bottom: 20rpx; .title { font-size: 32rpx; font-weight: bold; } }
		.tips { font-size: 24rpx; color: #999; margin-bottom: 50rpx; width: 100%; }

		.avatar-btn {
			width: 160rpx; height: 160rpx; border-radius: 50%; padding: 0; margin-bottom: 40rpx; position: relative;
			&::after { border: none; }
			image { width: 100%; height: 100%; border-radius: 50%; }
			.mask { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.4); color: #fff; font-size: 20rpx; padding: 4rpx 0; }
		}

		.input-group {
			width: 100%; display: flex; align-items: center; padding: 30rpx 0; border-bottom: 1rpx solid #eee; margin-bottom: 40rpx;
			text { width: 120rpx; font-size: 30rpx; }
			.nickname-input { flex: 1; font-size: 30rpx; }
		}

		.protocol-box {
			width: 100%; display: flex; align-items: center; margin-bottom: 50rpx;
			.checkbox {
				width: 32rpx; height: 32rpx; border: 2rpx solid #ccc; border-radius: 50%;
				margin-right: 15rpx; display: flex; align-items: center; justify-content: center;
				&.checked { background-color: #00aaff; border-color: #00aaff; }
			}
			.p-txt { font-size: 24rpx; color: #666; .link { color: #00aaff; } }
		}

		.btn-group {
			width: 100%; display: flex; gap: 30rpx;
			.btn {
				flex: 1; height: 90rpx; line-height: 90rpx; border-radius: 45rpx; font-size: 30rpx;
				&::after { border: none; }
				&.refuse { background-color: #f5f5f5; color: #666; }
				&.allow { background-color: #00aaff; color: #fff; }
			}
		}
	}
}
</style>




小程序登录与授权
技术考察点	回答核心
最新登录规范	无法直接弹出授权框，必须引导用户手动设置头像（chooseAvatar）和昵称（nickname）。
Storage 限制	单个小程序缓存上限 10MB。登录信息应存入同步缓存，确保页面加载时立即获取。
v-for 的 key	在统计栏 stats
 循环中，必须指定 :key
（如 index 或 label），提升虚拟 DOM 更新性能。
reactive vs ref	userInfo
 是一个多属性对象，用 reactive
 更合适；isAgree
 是简单布尔值，用 ref
 更轻量。
15-调用loain获取用户凭证
 这份代码展示了微信小程序前后端完整的登录授权链路。它不仅仅是 UI 的展示，更通过 async/await 异步语法实现了从“获取微信 Code”到“换取后端 Token”的核心流程。  
1. 微信“静默登录”流程
在代码中，saveProfile 函数实现了标准的登录逻辑：
2. 获取 Code：通过 uni.login 获取微信提供的临时登录凭证 code。
3. 换取 Token：将 code 以及用户手动填写的头像、昵称发送给后端接口 login()。
4. 身份持久化：后端通过 code 向微信换取用户唯一标识（OpenID），并在数据库创建用户，最后返回一个自定义的 token。
5. 本地存储：前端收到 token 后，使用 uni.setStorageSync('token', ...) 存储，用于后续所有接口的鉴权。
6. 异步编程优化 (Async/Await)
代码使用了现代化的异步处理方式：
● Try...Catch：用于捕获登录过程中的各种错误（如网络超时、用户拒绝、服务器崩溃）。
● Finally：无论登录成功还是失败，都会执行 uni.hideLoading()，防止加载动画卡死在页面上，增强了程序的鲁棒性（健壮性）。
7. 登录态的“系统创建”占位
在 user-card 中，针对未登录状态做了更细腻的 UI 设计：
● 占位展示：通过 v-if="!userInfo.nickName" 判断。
● 引导语：显示“系统创建”和“点击授权微信账号”，相比单纯的“注册/登录”，这种设计在社交类或内容类 App 中能降低用户的防备心理。
8. 用户信息获取与合并
● getUserInfo()：登录成功后再次调用后端接口，获取经过服务器校验后的最终信息。
● Object.assign：
  ○ 在 onLoad 中使用 Object.assign(userInfo, cache)。
  ○ 优点：它可以直接把缓存对象里的属性“填入”现有的 reactive 响应式对象中，而不会破坏 Vue 的数据监听。
 核心业务流程表  
步骤	关键 API / 方法	作用
Step 1: 预检查	if (!isAgree.value)	强制用户阅读隐私协议，合规性必备。
Step 2: 取凭证	uni.login	获取 code
（5分钟内有效，只能用一次）。
Step 3: 换身份	login({ code, ... })	后端接口，核心是把微信身份转为自己的系统账号。
Step 4: 存凭证	uni.setStorageSync('token')	以后发请求带上它，后端才知道你是谁。
Step 5: 初始加载	uni.getStorageSync	实现“自动登录”，用户不用每次打开都重新点。
<template>
	<view class="content">
		<view class="topBox">
			<view class="setbox">
				<view class="set-left">
					<up-icon name="calendar" size="30" color="#fff"></up-icon>
					<view class="txt">签到</view>
				</view>
				<view class="set-right">
					<up-icon name="setting" size="30" color="#fff"></up-icon>
					<up-icon name="chat" size="30" color="#fff"></up-icon>
				</view>
			</view>

			<view class="user-card" @click="handleCardClick">
				<view class="u-top">
					<template v-if="!userInfo.nickName">
						<view class="system-user">
							<view class="default-avatar">
								<up-icon name="account-fill" size="40" color="#ccc"></up-icon>
							</view>
							<view class="system-info">
								<view class="tit">系统创建</view>
								<view class="sub-tit">点击授权微信账号</view>
							</view>
						</view>
					</template>
					
					<template v-else>
						<image :src="userInfo.avatarUrl" mode="aspectFill"></image>
						<view class="tit">{{ userInfo.nickName }}</view>
					</template>
				</view>
				
				<view class="u-bottom">
					<view class="u-item" v-for="(item, index) in stats" :key="index">
						<view class="num">{{ item.value }}</view>
						<view class="u-tit">{{ item.label }}</view>
					</view>
				</view>
			</view>
		</view>

		<up-popup :show="showLoginPopup" mode="bottom" round="20" @close="showLoginPopup = false">
			<view class="login-drawer">
				<view class="header">
					<text class="title">微信授权登录</text>
					<up-icon name="close" @click="showLoginPopup = false"></up-icon>
				</view>
				
				<view class="tips">申请获取您的头像、昵称，用于完善个人资料</view>

				<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image :src="tempAvatar || '/static/tt.jpg'" mode="aspectFill"></image>
					<view class="mask">修改头像</view>
				</button>

				<view class="input-group">
					<text>昵称</text>
					<input 
						type="nickname" 
						class="nickname-input" 
						placeholder="点击获取微信昵称" 
						v-model="tempName"
						@blur="onNicknameBlur"
					/>
				</view>

				<view class="protocol-box" @click="isAgree = !isAgree">
					<view class="checkbox" :class="{ 'checked': isAgree }">
						<up-icon v-if="isAgree" name="checkbox-mark" color="#fff" size="12"></up-icon>
					</view>
					<text class="p-txt">我已阅读并同意 <text class="link">《用户协议》</text> 与 <text class="link">《隐私政策》</text></text>
				</view>

				<view class="btn-group">
					<button class="btn refuse" @click="showLoginPopup = false">拒绝</button>
					<button class="btn allow" @click="saveProfile">允许</button>
				</view>
			</view>
		</up-popup>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { login, getUserInfo } from '../../api/api' // 确保路径正确

// --- 响应式数据 ---
const userInfo = reactive({ nickName: '', avatarUrl: '' })
const tempAvatar = ref('')
const tempName = ref('')
const showLoginPopup = ref(false)
const isAgree = ref(false) 

const stats = reactive([
	{ label: '点赞', value: 12 }, { label: '喜欢', value: 12 },
	{ label: '收藏', value: 12 }, { label: '浏览', value: 12 }
])

// --- 生命周期 ---
onLoad(() => {
	const cache = uni.getStorageSync('user_info')
	if (cache) Object.assign(userInfo, cache)
})

// --- 交互逻辑 ---
const handleCardClick = () => {
	if (userInfo.nickName) return
	showLoginPopup.value = true
}

const onChooseAvatar = (e) => { tempAvatar.value = e.detail.avatarUrl }
const onNicknameBlur = (e) => { tempName.value = e.detail.value }

// --- 核心登录流程 ---
const saveProfile = async () => {
	// 1. 校验
	if (!isAgree.value) {
		return uni.showToast({ title: '请先勾选协议', icon: 'none' })
	}
	if (!tempName.value || !tempAvatar.value) {
		return uni.showToast({ title: '请选择头像并输入昵称', icon: 'none' })
	}

	uni.showLoading({ title: '授权登录中...', mask: true })

	try {
		// 2. 获取微信 Code
		const loginRes = await uni.login({ provider: 'weixin' })
		if (!loginRes.code) throw new Error('获取Code失败')

		// 3. 调用后端接口登录 (换取 Token)
		const res = await login({ 
			code: loginRes.code,
			nickName: tempName.value,
			avatarUrl: tempAvatar.value
		})

		// 假设后端返回的对象里有 token
		if (res && res.token) {
			uni.setStorageSync('token', res.token)
		}

		// 4. 调用后端接口获取最终用户信息
		const serverUser = await getUserInfo()
		
		// 5. 更新本地状态并缓存
		userInfo.nickName = serverUser.nickName || tempName.value
		userInfo.avatarUrl = serverUser.avatarUrl || tempAvatar.value
		
		uni.setStorageSync('user_info', {
			nickName: userInfo.nickName,
			avatarUrl: userInfo.avatarUrl
		})

		showLoginPopup.value = false
		uni.showToast({ title: '已成功授权', icon: 'success' })

	} catch (error) {
		console.error('登录流程异常:', error)
		uni.showToast({ title: '服务繁忙，请重试', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}
</script>

<style lang="scss" scoped>
.content {
	min-height: 100vh;
	background-color: #f5f5f5;

	.topBox {
		width: 100%; position: relative; z-index: 1;
		padding: 40rpx 30rpx 120rpx; box-sizing: border-box;
		&::after {
			content: ""; width: 140%; height: 380rpx; position: absolute;
			z-index: -1; top: 0; left: -20%; background-color: #00aaff;
			border-radius: 0 0 50% 50%;
		}
	}

	.setbox {
		display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx;
		.set-left { display: flex; align-items: center; .txt { color: #fff; font-size: 30rpx; margin-left: 10rpx; } }
		.set-right { display: flex; gap: 30rpx; }
	}

	.user-card {
		padding: 40rpx 30rpx; background-color: #fff; border-radius: 20rpx;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
		
		.u-top {
			display: flex; align-items: center; margin-bottom: 40rpx;
			
			.system-user {
				display: flex; align-items: center;
				.default-avatar {
					width: 110rpx; height: 110rpx; background-color: #f0f0f0;
					border-radius: 50%; display: flex; align-items: center;
					justify-content: center; margin-right: 24rpx;
				}
				.system-info {
					.tit { font-size: 34rpx; font-weight: bold; color: #333; }
					.sub-tit { font-size: 24rpx; color: #999; margin-top: 4rpx; }
				}
			}

			image { width: 110rpx; height: 110rpx; border-radius: 50%; margin-right: 24rpx; background-color: #f8f8f8; }
			.tit { font-size: 34rpx; font-weight: bold; color: #333; }
		}

		.u-bottom {
			display: flex; justify-content: space-around;
			.u-item { text-align: center; .num { font-size: 32rpx; font-weight: bold; color: #333; } .u-tit { font-size: 24rpx; color: #999; margin-top: 8rpx; } }
		}
	}

	.login-drawer {
		padding: 40rpx; background-color: #fff; display: flex; flex-direction: column; align-items: center;
		.header { width: 100%; display: flex; justify-content: space-between; margin-bottom: 20rpx; .title { font-size: 32rpx; font-weight: bold; } }
		.tips { font-size: 24rpx; color: #999; margin-bottom: 50rpx; width: 100%; }

		.avatar-btn {
			width: 160rpx; height: 160rpx; border-radius: 50%; padding: 0; margin-bottom: 40rpx; position: relative;
			&::after { border: none; }
			image { width: 100%; height: 100%; border-radius: 50%; }
			.mask { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.4); color: #fff; font-size: 20rpx; padding: 4rpx 0; }
		}

		.input-group {
			width: 100%; display: flex; align-items: center; padding: 30rpx 0; border-bottom: 1rpx solid #eee; margin-bottom: 40rpx;
			text { width: 120rpx; font-size: 30rpx; }
			.nickname-input { flex: 1; font-size: 30rpx; }
		}

		.protocol-box {
			width: 100%; display: flex; align-items: center; margin-bottom: 50rpx;
			.checkbox {
				width: 32rpx; height: 32rpx; border: 2rpx solid #ccc; border-radius: 50%;
				margin-right: 15rpx; display: flex; align-items: center; justify-content: center;
				&.checked { background-color: #00aaff; border-color: #00aaff; }
			}
			.p-txt { font-size: 24rpx; color: #666; .link { color: #00aaff; } }
		}

		.btn-group {
			width: 100%; display: flex; gap: 30rpx;
			.btn {
				flex: 1; height: 90rpx; line-height: 90rpx; border-radius: 45rpx; font-size: 30rpx;
				&::after { border: none; }
				&.refuse { background-color: #f5f5f5; color: #666; }
				&.allow { background-color: #00aaff; color: #fff; }
			}
		}
	}
}
</style>

16-用户信息补充弹出层编写
份代码是对微信小程序用户授权与资料完善流程的最终优化版本。它巧妙地结合了“静默登录”与“手动补全”两种场景，通过弹窗（Modal）和抽屉（Popup）引导用户完成规范化的入驻。
重点在于 用户交互路径（UX）的深度设计。
1. 差异化交互路径设计
代码中通过 handleCardClick 和 performLogin 实现了智能化的逻辑分流：
● 路径 A：静默恢复。用户点击卡片，后台通过 uni.login 的 code 发现该用户已存在且有头像昵称，直接更新 UI，不打扰用户。
● 路径 B：温和引导。如果是个新用户或资料不全，先通过 uni.showModal（温馨提示）征求用户同意，再开启授权。这种“二次确认”能有效降低用户对弹出申请的抵触感。
2. “系统创建”状态的 UI 占位
在未登录时，使用 .system-user 代替简单的“未登录”文字：
● 默认图标：使用 up-icon name="account-fill" 配合灰色背景，营造出一种“待激活账户”的视觉效果。
● 副标题引导：显示“点击完善微信信息”，通过文案暗示这只是一个小步骤，而非繁琐的注册流程。
3. 手动资料补全抽屉 (up-popup)
微信新规下，开发者必须提供一个让用户手动设置头像和昵称的界面：
● 头像选择器 (open-type="chooseAvatar")：
  ○ 样式技巧：将 button 设置为透明背景，内部包裹 image。用户点击的是“头像按钮”，但视觉上只是点击了头像。
● 昵称输入框 (type="nickname")：
  ○ 事件捕获：在 @blur（失去焦点）时通过 e.detail.value 同步昵称，这是处理微信昵称插件最稳健的方式。
● 微信绿 (#07C160)：提交按钮使用标准的微信品牌色，在视觉上增加用户的信任感。
4. 数据持久化与同步 (Object.assign)
● 初始化重载：在 onLoad 中通过 uni.getStorageSync 读取。
● 对象合并：Object.assign(userInfo, cache)。
  ○ 深度解析：由于 userInfo 是由 reactive 创建的，直接赋值 userInfo = cache 会导致响应式丢失（即数据变了界面不动）。使用 Object.assign 可以只修改属性值而保留响应式容器。
环节	实现手段	目的
状态判断	if (userInfo.nickName) return	防止已登录用户重复触发登录逻辑。
登录换码	uni.login({ provider: 'weixin' })	拿到 code
 作为通往后端的门票。
资料拉取	const remoteUser = await getUserInfo()	优先使用服务器存储的数据，保证多端同步。
完善抽屉	show.value = true	针对新用户，弹出资料收集界面。
提交拦截	if (!userInfo.nickName) ...	前端强校验，确保入库数据的完整性。
<template>
	<view class="content">
		<view class="topBox">
			<view class="setbox">
				<view class="set-left">
					<up-icon name="calendar" size="30" color="#fff"></up-icon>
					<view class="txt">签到</view>
				</view>
				<view class="set-right">
					<up-icon name="setting" size="30" color="#fff"></up-icon>
					<up-icon name="chat" size="30" color="#fff"></up-icon>
				</view>
			</view>

			<view class="user-card" @click="handleCardClick">
				<view class="u-top">
					<template v-if="!userInfo.nickName">
						<view class="system-user">
							<view class="default-avatar">
								<up-icon name="account-fill" size="40" color="#ccc"></up-icon>
							</view>
							<view class="system-info">
								<view class="tit">系统创建</view>
								<view class="sub-tit">点击完善微信信息</view>
							</view>
						</view>
					</template>
					<template v-else>
						<image :src="userInfo.avatarUrl || '/static/tt.jpg'" mode="aspectFill"></image>
						<view class="tit">{{ userInfo.nickName }}</view>
					</template>
				</view>
				
				<view class="u-bottom">
					<view class="u-item" v-for="(item, index) in stats" :key="index">
						<view class="num">{{ item.value }}</view>
						<view class="u-tit">{{ item.label }}</view>
					</view>
				</view>
			</view>
		</view>

		<view class="listBox"></view>

		<up-popup :show="show" @close="close" round="20" mode="bottom">
			<view class="popup">
				<view class="title">获取您的昵称、头像</view>
				
				<view class="flex-row">
					<view class="label">获取用户头像</view>
					<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseavatar">
						<image class="avatar" :src="userInfo.avatarUrl || '/static/tt.jpg'"></image>
					</button>
				</view>
				
				<view class="flex-row">
					<view class="label">获取用户昵称</view>
					<input 
						class="nickname-input" 
						v-model="userInfo.nickName" 
						type="nickname" 
						placeholder="请输入或获取昵称" 
						@blur="changeName"
					>
				</view>
				
				<button class="submit-btn" @click="userSubmit">确认提交</button>
			</view>
		</up-popup>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { login, getUserInfo } from '../../api/api'

// --- 用户数据状态 ---
const userInfo = reactive({
	nickName: '',
	avatarUrl: ''
})

const stats = reactive([
	{ label: '点赞', value: 12 }, { label: '喜欢', value: 12 },
	{ label: '收藏', value: 12 }, { label: '浏览', value: 12 }
])

const show = ref(false)

// --- 生命周期：读取缓存 ---
onLoad(() => {
	const cache = uni.getStorageSync('user_info')
	if (cache) Object.assign(userInfo, cache)
})

const close = () => { show.value = false }

// --- 交互：点击登录卡片 ---
const handleCardClick = () => {
	if (userInfo.nickName) return // 已有资料则不跳转
	
	uni.showModal({
		title: '温馨提示',
		content: '亲，授权微信登录后才能正常使用小程序',
		confirmColor: '#07C160',
		success: (res) => {
			if (res.confirm) performLogin()
		}
	})
}

// --- 逻辑：微信登录流程 ---
const performLogin = () => {
	uni.showLoading({ title: '安全登录中...', mask: true })
	
	uni.login({
		provider: 'weixin',
		success: async (loginRes) => {
			try {
				// 1. 调用后端登录接口换取 Token
				const res = await login(loginRes.code)
				if (res.token) uni.setStorageSync('token', res.token)
				
				// 2. 尝试获取后端存储的用户信息
				const remoteUser = await getUserInfo()
				
				if (remoteUser && remoteUser.nickName) {
					// 如果后端有资料，直接更新并缓存
					userInfo.nickName = remoteUser.nickName
					userInfo.avatarUrl = remoteUser.avatarUrl
					uni.setStorageSync('user_info', userInfo)
					uni.hideLoading()
				} else {
					// 如果后端没资料，打开手动填写抽屉
					uni.hideLoading()
					show.value = true
				}
			} catch (err) {
				uni.hideLoading()
				uni.showToast({ title: '登录失败，请重试', icon: 'none' })
			}
		},
		fail: () => {
			uni.hideLoading()
			uni.showToast({ title: '微信授权失败', icon: 'none' })
		}
	})
}

// --- 回调：头像与昵称获取 ---
const onChooseavatar = (e) => {
	userInfo.avatarUrl = e.detail.avatarUrl 
}

const changeName = (e) => {
	userInfo.nickName = e.detail.value 
}

// --- 动作：手动完善后提交 ---
const userSubmit = () => {
	if (!userInfo.nickName) return uni.showToast({ title: '请输入昵称', icon: 'none' })
	if (!userInfo.avatarUrl) return uni.showToast({ title: '请选择头像', icon: 'none' })
	
	// 持久化到本地显示
	uni.setStorageSync('user_info', userInfo)
	show.value = false
	uni.showToast({ title: '完善成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.content {
	min-height: 100vh;
	background-color: #f5f5f5;

	.topBox {
		width: 100%; position: relative; z-index: 1;
		padding: 40rpx 30rpx 120rpx; box-sizing: border-box;
		&::after {
			content: ""; width: 140%; height: 380rpx; position: absolute;
			z-index: -1; top: 0; left: -20%; background-color: #00aaff;
			border-radius: 0 0 50% 50%;
		}
	}

	.setbox {
		display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx;
		.set-left { display: flex; align-items: center; .txt { color: #fff; font-size: 30rpx; margin-left: 10rpx; } }
		.set-right { display: flex; gap: 30rpx; }
	}

	.user-card {
		padding: 40rpx 30rpx; background-color: #fff; border-radius: 20rpx;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
		
		.u-top {
			display: flex; align-items: center; margin-bottom: 40rpx;
			
			.system-user {
				display: flex; align-items: center;
				.default-avatar {
					width: 110rpx; height: 110rpx; background-color: #f0f0f0;
					border-radius: 50%; display: flex; align-items: center;
					justify-content: center; margin-right: 24rpx;
				}
				.system-info {
					.tit { font-size: 34rpx; font-weight: bold; color: #333; }
					.sub-tit { font-size: 24rpx; color: #999; margin-top: 4rpx; }
				}
			}
			image { width: 110rpx; height: 110rpx; border-radius: 50%; margin-right: 24rpx; background-color: #f8f8f8; }
			.tit { font-size: 34rpx; font-weight: bold; color: #333; }
		}

		.u-bottom {
			display: flex; justify-content: space-around;
			.u-item { text-align: center; .num { font-size: 32rpx; font-weight: bold; color: #333; } .u-tit { font-size: 24rpx; color: #999; margin-top: 8rpx; } }
		}
	}
}

/* 弹出层样式 */
.popup {
	padding: 40rpx 30rpx 60rpx;
	background-color: #fff;
	.title {
		margin-bottom: 40rpx;
		font-size: 34rpx;
		font-weight: bold;
		text-align: center;
		color: #333;
	}
	.flex-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1rpx solid #f5f5f5;
		padding: 30rpx 0;
		.label { font-size: 30rpx; color: #333; }
		.nickname-input { text-align: right; font-size: 30rpx; flex: 1; margin-left: 20rpx; }
	}
	.avatar-wrapper {
		width: 80rpx; height: 80rpx;
		padding: 0; margin: 0;
		background: none;
		&::after { border: none; }
		.avatar { width: 80rpx; height: 80rpx; border-radius: 10rpx; }
	}
	.submit-btn {
		margin-top: 60rpx;
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		border-radius: 50rpx;
		background-color: #07C160 !important; /* 确定按钮为微信绿 */
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border: none;
		&::after { border: none; }
	}
}
</style>

17用户免登逻辑和列表显示
代码完成了“我的”页面（个人中心）的最终版开发。它在之前的基础上引入了 up-cell 宫格列表，并进一步精细化了 CSS 交互效果。
重点在于 列表组件的应用 与 用户体验（UX）的微调。
1. 常用列表组件：up-cell
这是页面中下游区域的核心组件，用于展示个人资料、购物车、设置等功能入口。
● 组件结构：由 up-cell-group 包裹多个 up-cell。
● 关键属性：
  ○ title：左侧文字描述。
  ○ icon：左侧图标（uView 内置图标库）。
  ○ isLink：自动在右侧显示箭头 >。
  ○ size="large"：增大垂直间距，更适合移动端点击。
● 布局技巧：.lists 设置了 margin-top: -50rpx。利用负外边距让列表区域向上“压”住顶部的蓝色弧形背景，形成视觉上的自然过渡。
2. CSS 交互反馈（Active 态）
为了让应用更有“质感”，代码加入了点击反馈效果：
&:active {
    transform: scale(0.95); // 点击时略微缩小
    background: rgba(255, 255, 255, 0.3); // 背景变亮
}
● 毛玻璃质感：顶部图标使用 background: rgba(255, 255, 255, 0.2)，这种半透明效果在蓝色背景下显得非常现代、高级。
3. 数据处理：JSON 序列化存储
在 onLoad 和 userSubmit 中，对缓存的处理更加严谨：
● 存储：JSON.stringify(userInfo)。由于 reactive 对象在某些环境下直接存储可能丢失属性，转为字符串（JSON）是最安全的做法。
● 读取：JSON.parse(cache)。读取后通过 Object.assign 恢复响应式。
4. 逻辑细节优化
● 头像兜底：使用 userInfo.avatarUrl || '/static/tt.jpg'。确保在没有头像时，页面不会出现图片的破损图标。
● 方法封装：将点击事件封装为 handleAction 和 handleListClick，通过传入字符串参数来区分点击的项，减少了重复代码。
功能点	实现方案	目的
功能入口	up-cell	统一的入口风格，支持图标和箭头。
层叠效果	margin-top: -50rpx	提升设计感，打破呆板的线性布局。
点击反馈	:active
 伪类	给予用户即时的操作确认。
数据同步	Object.assign	既更新了数据，又保留了 Vue 的响应式追踪。
<template>
	<view class="content">
		<!-- 顶部蓝色背景区域 -->
		<view class="topBox">
			<view class="setbox">
				<view class="set-left" @click="handleAction('签到')">
					<up-icon name="calendar" size="26" color="#fff"></up-icon>
					<view class="txt">签到</view>
				</view>
				<view class="set-right">
					<view class="icon-wrapper" @click="handleAction('设置')">
						<up-icon name="setting" size="26" color="#fff"></up-icon>
					</view>
					<view class="icon-wrapper" @click="handleAction('消息')">
						<up-icon name="chat" size="26" color="#fff"></up-icon>
					</view>
				</view>
			</view>

			<view class="user-card" @click="handleCardClick">
				<view class="u-top">
					<template v-if="!userInfo.nickName">
						<view class="system-user">
							<view class="default-avatar">
								<up-icon name="account-fill" size="38" color="#ccc"></up-icon>
							</view>
							<view class="system-info">
								<view class="tit">注册/登录</view>
								<view class="sub-tit">点击完善微信信息</view>
							</view>
						</view>
					</template>
					<template v-else>
						<image :src="userInfo.avatarUrl || '/static/tt.jpg'" mode="aspectFill"></image>
						<view class="tit">{{ userInfo.nickName }}</view>
					</template>
				</view>

				<view class="u-bottom">
					<view class="u-item" v-for="(item, index) in stats" :key="index">
						<view class="num">{{ item.value }}</view>
						<view class="u-tit">{{ item.label }}</view>
					</view>
				</view>
			</view>
		</view>

		<view class="lists">
			<up-cell-group :border="false">
				<up-cell title="个人信息" isLink @click="handleListClick('profile')" icon="account" size="large"></up-cell>
				<up-cell title="我的购物车" isLink @click="handleListClick('cart')" icon="shopping-cart" size="large"></up-cell>
				<up-cell title="用户反馈" isLink @click="handleListClick('feedback')" icon="chat" size="large"></up-cell>
				<up-cell title="我的邮件" isLink @click="handleListClick('email')" icon="email" size="large"></up-cell>
				<up-cell title="分享有礼" isLink @click="handleListClick('share')" icon="share-fill" size="large"></up-cell>
			</up-cell-group>
		</view>

		<up-popup :show="show" @close="close" round="20" mode="bottom">
			<view class="popup">
				<view class="title">完善个人资料</view>
				<view class="flex-row">
					<view class="label">获取用户头像</view>
					<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseavatar">
						<image class="avatar" :src="userInfo.avatarUrl || '/static/tt.jpg'"></image>
					</button>
				</view>
				<view class="flex-row">
					<view class="label">获取用户昵称</view>
					<input class="nickname-input" v-model="userInfo.nickName" type="nickname" placeholder="点击输入昵称" @blur="changeName">
				</view>
				<button class="submit-btn" @click="userSubmit">确认提交</button>
			</view>
		</up-popup>
	</view>
</template>

<script setup>
	import { ref, reactive } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'

	const userInfo = reactive({ nickName: '', avatarUrl: '' })
	const stats = reactive([
		{ label: '点赞', value: 12 }, { label: '喜欢', value: 12 },
		{ label: '浏览', value: 12 }, { label: '收藏', value: 12 }
	])
	const show = ref(false)

	onLoad(() => {
		const cache = uni.getStorageSync('userInfo')
		if (cache) Object.assign(userInfo, JSON.parse(cache))
	})

	const close = () => { show.value = false }
	const handleCardClick = () => { if (!userInfo.nickName) performLogin() }

	const performLogin = () => {
		uni.showModal({
			title: '微信授权',
			content: '授权登录后可使用完整功能',
			success: (res) => { if (res.confirm) show.value = true }
		})
	}

	const handleListClick = (type) => {
		if (type === 'profile') show.value = true
		else uni.showToast({ title: '功能开发中', icon: 'none' })
	}

	const handleAction = (n) => uni.showToast({ title: '点击了' + n, icon: 'none' })
	const onChooseavatar = (e) => { userInfo.avatarUrl = e.detail.avatarUrl }
	const changeName = (e) => { userInfo.nickName = e.detail.value }

	const userSubmit = () => {
		if (!userInfo.nickName) return uni.showToast({ title: '请输入昵称', icon: 'none' })
		uni.setStorageSync('userInfo', JSON.stringify(userInfo))
		show.value = false
		uni.showToast({ title: '资料已更新', icon: 'success' })
	}
</script>

<style lang="scss" scoped>
	.content {
		min-height: 100vh;
		background-color: #f8f8f8;
	}


	.topBox {
		width: 100%; position: relative; z-index: 1;
		padding: 40rpx 30rpx 120rpx; box-sizing: border-box;
		&::after {
			content: ""; width: 140%; height: 380rpx; position: absolute;
			z-index: -1; top: 0; left: -20%; background-color: #00aaff;
			border-radius: 0 0 50% 50%;
		}
	}
	.setbox {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 50rpx;
		position: relative;
		z-index: 2;
	}

	.set-left {
		display: flex;
		align-items: center;
		color: #fff;
		font-size: 28rpx;
		background: rgba(255, 255, 255, 0.2);
		padding: 12rpx 24rpx;
		border-radius: 60rpx;
		
		.txt { 
			margin-left: 10rpx;
			font-weight: 500;
		}
	}

	.set-right {
		display: flex;
		gap: 30rpx;
	}

	.icon-wrapper {
		background: rgba(255, 255, 255, 0.2);
		padding: 12rpx;
		border-radius: 50%;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		
		&:active {
			transform: scale(0.95);
			background: rgba(255, 255, 255, 0.3);
		}
	}

	.user-card {
		padding: 40rpx 30rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
		position: relative;
		z-index: 2;
	}

	.u-top {
		display: flex;
		align-items: center;
		margin-bottom: 40rpx;
	}

	.system-user {
		display: flex;
		align-items: center;
	}

	.default-avatar {
		width: 110rpx;
		height: 110rpx;
		background: #f5f5f5;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 24rpx;
	}

	.system-info {
		.tit { 
			font-weight: bold; 
			font-size: 34rpx; 
			color: #333; 
		}
		.sub-tit { 
			font-size: 24rpx; 
			color: #999; 
			margin-top: 4rpx; 
		}
	}

	.u-top image {
		width: 110rpx;
		height: 110rpx;
		border-radius: 50%;
		margin-right: 24rpx;
	}

	.u-top .tit { 
		font-weight: bold; 
		font-size: 34rpx; 
		color: #333; 
	}

	.u-bottom {
		display: flex;
		justify-content: space-around;
	}

	.u-item {
		text-align: center;
		
		.num { 
			font-weight: bold; 
			font-size: 32rpx; 
			color: #333; 
		}
		.u-tit { 
			font-size: 24rpx; 
			color: #999; 
			margin-top: 8rpx; 
		}
	}

	.lists {
		margin: -50rpx 30rpx 0;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		position: relative;
		z-index: 2;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
	}

	.popup {
		padding: 40rpx;
		
		.title { 
			text-align: center; 
			font-weight: bold; 
			font-size: 34rpx; 
			margin-bottom: 40rpx; 
		}
	}

	.flex-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
		
		.label { 
			font-size: 30rpx; 
			color: #333; 
		}
	}

	.avatar-wrapper {
		padding: 0;
		margin: 0;
		background: none;
		border: none;
		
		&::after { 
			border: none; 
		}
		
		.avatar { 
			width: 90rpx; 
			height: 90rpx; 
			border-radius: 12rpx; 
		}
	}

	.nickname-input { 
		text-align: right; 
		font-size: 30rpx; 
	}

	.submit-btn {
		margin-top: 50rpx;
		background: #07C160;
		color: #fff;
		border-radius: 50rpx;
		font-weight: bold;
		border: none;
		
		&:active {
			opacity: 0.8;
		}
	}
</style>
从你的代码演变来看，一个完整的 uni-app 页面通常包含以下链路：
1. UI 框架选择：选用 uView-plus 等成熟库（Search, Swiper, Waterfall, Cell, Popup）。
2. 响应式状态管理：使用 Vue3 的 ref（简单变量）和 reactive（复杂对象）。
3. 生命周期利用：onLoad 做初始化加载，onPageScroll 做交互监听。
4. 多端兼容处理：利用 rpx 单位适配不同屏幕，利用微信特有 open-type 调起原生能力。
5. 交互闭环：加载中（loading）、操作反馈（toast）、持久化存储（storage）。

18-首页跳转至景点详情
这两份代码展示了 uni-app 中最核心的业务闭环：列表页向详情页的跳转及数据传递。
重点在于 路由传参的安全性 与 大数据量传输的规范。
1. 复杂对象传参：序列化与编码 (JSON + URL)
在 goDetail 方法中，你使用了一种非常标准且稳妥的方式来传递对象：
● JSON.stringify(item)：由于 URL 只能携带字符串，必须先将 JavaScript 对象转换为 JSON 字符串。
● encodeURIComponent()：关键步骤！
  ○ URL 中不允许出现特殊字符（如 ?, =, & 以及图片路径中的 /）。
  ○ 如果不进行编码，JSON 中的特殊符号会截断 URL，导致详情页接收到的数据不完整或解析失败。
● decodeURIComponent()：在详情页（接收方）进行逆向解码，恢复原本的 JSON 字符串。
2. 跳转 API 的选择：uni.navigateTo
● 保留当前页：该 API 会保留列表页，跳转到详情页。
● 层级限制：uni-app/微信小程序通常有 10 层页面栈限制。详情页返回时，列表页的状态（如滚动位置、已加载的数据）会依然存在，用户体验极佳。
3. 详情页的数据接收 (onLoad)
在详情页的 onLoad(opt) 钩子中：
● opt 是一个对象，包含了所有通过 URL 传递的参数。
● 解析逻辑：JSON.parse(decodeURIComponent(opt.item))。这是一个从“密文”到“明文”再到“对象”的转换过程。
<template>
	<view class="content">
		<up-search 
			placeholder="搜索经典" 
			bg-color="#e3e3e3" 
			v-model="keyword"
			:show-action="false"
		></up-search>
		
		<view class="banner-box">
			<up-swiper 
				v-if="bannerList.length > 0"
				:list="bannerList" 
				keyName="image"
				radius="8"
				:autoplay="true"
				showTitle
			></up-swiper>
			
			<up-notice-bar text="项目数据仅为示例,非真实数据"></up-notice-bar>
			
			<view class="list">
				<up-waterfall v-model="flowList" ref="uWaterfallRef">
					<template v-slot:left="{leftList}">
						<view class="demo-warter" v-for="(item, index) in leftList" :key="item.id"
						@click="goDetail(item)">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
					
					<template v-slot:right="{rightList}">
						<view class="demo-warter" v-for="(item, index) in rightList" :key="item.id"
						@click="goDetail(item)">
							<up-lazy-load threshold="-450" border-radius="10" :image="item.img" :index="index"></up-lazy-load>
							<view class="demo-title">{{item.title}}</view>
							<view class="demo-price">{{item.times}}</view>
							<view class="demo-tag">
								<view class="demo-tag-owner">{{ item.tag[0] }}</view>
								<view class="demo-tag-text">{{ item.tag[1] }}</view>
							</view>
							<view class="isDot" v-if="item.isDot">{{item.isDot}}</view>
						</view>
					</template>
				</up-waterfall>
			</view>
		</view>

		<view v-if="showTopBtn" @click="handleToTop" class="topClass">
			<up-icon name="arrow-upward" color="#fff" size="24"></up-icon>
		</view>
	</view>
</template>

<script setup>
	import { getBanner, getHomeList } from '../../api/api';
	import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
	import { ref } from 'vue';

	const keyword = ref('');
	const bannerList = ref([]); 
	const flowList = ref([]); 
	const showTopBtn = ref(false);

	// --- 1. 数据加载方法 ---
	const loadInitialData = () => {
		getBanner().then(res => {
			if (res && res.code === 1) {
				bannerList.value = res.data.bannerList;
			}
		});

		getHomeList().then(res => {
			if (res && res.code === 1) {
				flowList.value = res.data; 
			}
		});
	};

	// 模拟触底加载更多数据
	const addRandomData = () => {
		if (flowList.value.length === 0) return;
		
		const newData = [];
		for (let i = 0; i < 6; i++) {
			// 随机抽取现有的一条数据进行复制
			let randomIndex = Math.floor(Math.random() * flowList.value.length);
			let item = JSON.parse(JSON.stringify(flowList.value[randomIndex]));
			
			// 必须更改 ID，否则 Vue 渲染 key 会冲突报错
			item.id = Date.now() + Math.random().toString(36).substr(2, 9);
			newData.push(item);
		}
		// 追加到列表
		flowList.value = [...flowList.value, ...newData];
	};
	
	// 修正：函数名拼写错误，并添加正确的跳转逻辑
	const goDetail = (item) => {
		const can = JSON.stringify(item)
		uni.navigateTo({
			url: `/pages/detail/detail?item=${encodeURIComponent(can)}`
		})
	}

	// --- 2. 生命周期钩子 ---
	onLoad(() => {
		loadInitialData();
	});

	// 监听触底
	onReachBottom(() => {
		console.log('触发加载更多');
		uni.showLoading({ title: '加载中...' });
		setTimeout(() => {
			addRandomData();
			uni.hideLoading();
		}, 800);
	});

	// 监听滚动：显示/隐藏回到顶部按钮
	onPageScroll((e) => {
		showTopBtn.value = e.scrollTop > 400;
	});

	// --- 3. 交互方法 ---
	const handleToTop = () => {
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 300
		});
	};
</script>

<style>
	page {
		background-color:rgb(240,240,240);
	}
</style>

<style lang="scss" scoped>
	.content {
		padding: 20px;
		background-color: #f5f5f5;
		min-height: 100vh;

		.banner-box {
			margin-top: 20px;
		}

		.list {
			margin: 30rpx 0;
			.demo-warter {
				margin: 10rpx;
				background-color: #fff;
				border-radius: 16rpx;
				padding: 16rpx;
				box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
				position: relative;
			}
			.demo-title {
				font-size: 28rpx;
				font-weight: bold;
				margin-top: 10rpx;
				color: #303133;
			}
			.demo-price {
				font-size: 22rpx;
				color: #909399;
				margin-top: 10rpx;
			}
			.demo-tag {
				display: flex;
				margin-top: 10rpx;
				.demo-tag-owner {
					border: 1px solid #ffaa00;
					color: #ffaa00;
					font-size: 18rpx;
					padding: 0 10rpx;
					border-radius: 50rpx;
				}
				.demo-tag-text {
					border: 1px solid #00aaff;
					color: #00aaff;
					margin-left: 10rpx;
					padding: 0 10rpx;
					font-size: 18rpx;
					border-radius: 8rpx;
				}
			}
			.isDot {
				position: absolute;
				top: 10rpx;
				right: 10rpx;
				font-size: 20rpx;
				color: #fff;
				background-color: #fa3534;
				padding: 2rpx 10rpx;
				border-radius: 8rpx;
				z-index: 1;
			}
		}

		.topClass {
			position: fixed;
			bottom: 120rpx;
			right: 40rpx;
			background-color: rgba(0, 0, 0, 0.6);
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 99;
		}
	}
</style>
<template>
	<view>
		
	</view>
</template>

<script setup>
	import { onLoad } from '@dcloudio/uni-app'
	onLoad((opt) =>{
		console.log(JSON.parse(decodeURIComponent(opt.item)))
	})
</script>

<style lang="scss">

</style>

19-景点详情页面编写
这份代码完成了从“列表点击”到“详情展示”的完整逻辑闭环。它采用了移动端非常流行的大图沉浸式设计，并结合了 Vue3 的响应式语法。
重点在于沉浸式 UI 布局与路由数据解析的安全处理。
1. 沉浸式顶部布局 (Immersion Layout)
代码通过 CSS 技巧实现了一个非常美观的头部效果：
● 大图封底：.detail-image 设置了 width: 100% 和固定高度（650rpx），作为页面的视觉中心。
● 内容向上溢出：.d-content 设置了 margin-top: -60rpx。
  ○ 原理：利用负外边距让白色的内容卡片“压”在图片上方。
  ○ 圆角设计：border-radius: 40rpx 40rpx 0 0 给卡片顶部添加了大圆角，视觉上比直角更柔和、更现代。
● 透明导航栏 (up-navbar)：
  ○ bg-color="transparent" 配合 :autoBack="true"。
  ○ 这使得返回按钮直接浮在图片上，不会遮挡图片的完整性。
2. 健壮的数据解析 (Safe Parsing)
在 onLoad 中，你加入了一段非常专业的代码：
JavaScript
try {
    const data = JSON.parse(decodeURIComponent(opt.item))
    Object.assign(itemData, data)
} catch (error) {
    console.error('数据解析失败:', error)
    // 容错处理
}
● 为什么要 Try-Catch？ 路由传参是不可靠的。如果 URL 被用户手动修改、截断，或者编码出现异常，JSON.parse 会直接抛出错误导致页面白屏。加入 try...catch 能有效防止程序崩溃。
● 数据初始化：itemData 使用 reactive 定义并给出了初始空值，确保在数据还没解析完成的微小瞬间，页面不会因为读取 undefined 的属性而报错。
3. 文本排版优化 (Typography)
● 行高 (line-height: 1.6)：对于“景区介绍”这种长文本，增加行高可以显著提升阅读舒适度。
● 自动换行 (word-break: break-all)：防止连续的中英文混排或特殊符号撑破容器。
● 层级感：通过 label（加粗/深黑）和 nr（常规/浅灰）的对比，区分信息标题和具体内容。
技巧名称	实现代码	视觉效果
负边距压盖	margin-top: -60rpx	卡片悬浮在图片上。
图片裁剪	mode="aspectFill"	图片等比例填满容器，不拉伸。
圆角容器	border-radius: 40rpx	增加页面的呼吸感。
沉浸式导航	bg-color="transparent"	导航栏与背景图融为一体。
<template>
	<view class="detail">
		<up-navbar title="" bg-color="transparent" :autoBack="true" left-icon-color="#fff" />
		
		<view class="d-con">
			<image :src="itemData.img" mode="aspectFill" class="detail-image"></image>
			
			<view class="d-content">
				<view class="j-con">
					<view class="tit-row">
						<text class="main-title">{{ itemData.title || '加载中...' }}</text>
						<up-tag 
							text="5A级景区" 
							size="mini" 
							shape="circle" 
							bgColor="#66B1FF" 
							borderColor="#66B1FF" 
							color="#fff">
						</up-tag>
					</view>
					
					<view class="jj">
						<text class="label">景区介绍</text>
						<text class="nr">{{ itemData.introduce || '暂无介绍' }}</text>
					</view>
					
					<view class="jj">
						<text class="label">开放时间</text>
						<text class="nr">{{ itemData.times || '暂无信息' }}</text>
					</view>
					
					<view class="j-con ls">
						<view class="tit" style="font-size: 34rpx; margin-top: 20rpx; color: #000000; font-weight: bold;">
							游玩推荐
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, reactive } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'

	const itemData = reactive({
		id: 0,
		title: '',
		img: '',
		introduce: '',
		times: ''
	})

	onLoad((opt) => {
		if (opt && opt.item) {
			try {
				const data = JSON.parse(decodeURIComponent(opt.item))
				Object.assign(itemData, data)
			} catch (error) {
				console.error('数据解析失败:', error)
				uni.showToast({ title: '数据读取失败', icon: 'none' })
			}
		}
	})
</script>

<style lang="scss" scoped>
.detail {
	min-height: 100vh;
	background-color: #f8f8f8;
	
	.d-con {
		position: relative;
		
		.detail-image {
			width: 100%;
			height: 650rpx;
		}
		
		.d-content {
			width: 100%;
			margin-top: -60rpx;
			background-color: #fff;
			padding: 40rpx 30rpx;
			box-sizing: border-box;
			border-radius: 40rpx 40rpx 0 0;
			position: relative;
			z-index: 10;
			
			.tit-row {
				display: flex;
				align-items: center;
				margin-bottom: 40rpx;
				
				.main-title {
					font-size: 38rpx;
					font-weight: bold;
					color: #333;
					margin-right: 15rpx;
				}
			}
			
			.jj {
				margin-bottom: 40rpx;
				
				.label {
					display: block;
					font-size: 30rpx;
					font-weight: bold;
					color: #111;
					margin-bottom: 15rpx;
				}
				
				.nr {
					display: block;
					font-size: 28rpx;
					color: #666;
					line-height: 1.6;
					word-break: break-all;
				}
			}
		}
	}
}
</style>

20-游玩推荐列表
这两份代码标志着项目进入了数据驱动逻辑与复杂组件开发的成熟阶段。你不仅完善了详情页的 UI 交互（加入了滚动容器和推荐列表），还构建了一个稳健的 Mock API 层 来模拟后端数据。
重点在于 Mock 数据架构 与 进阶组件布局。
1. Mock 数据的战略意义 (api/mockData)
在前后端分离开发中，前端往往需要领先于后端接口。
● Promise 模拟异步：通过 return new Promise 配合 setTimeout，真实还原了网络请求的延迟感。
● 数据结构对齐：在 Mock 层定义的 introduce、times 等字段，必须与页面 reactive 对象中的属性名严格一致。
● 拦截思维：未来只需将 import 的路径从 mockData 改为真实的 request 工具类，即可无缝切换到生产环境。
2. 详情页的 UX 增强：scroll-view
对于内容较长的详情页，直接使用原生页面滚动有时会与自定义导航栏产生冲突。
● enhanced 增强特性：在微信小程序中，开启 enhanced 可以使用更多高级滚动特性。
● :show-scrollbar="false"：隐藏滚动条，使页面视觉更加纯净，符合现代 App 的极简审美。
● Flex 布局适配：外层 .detail 设置 display: flex; flex-direction: column;，确保 scroll-view 能自动撑开并占据剩余屏幕高度。
3. “游玩推荐”：两列流式布局
代码展示了如何在一个纵向详情页中嵌入一个“瀑布流”式的推荐区域：
● flex-wrap: wrap：这是实现多列布局的基石。
● 宽度百分比 (width: 48%)：配合 justify-content: space-between，可以完美实现左右对齐且中间留白的双列效果。
● 绝对定位标签 (topFixed)：
  ○ position: absolute 配合容器的 overflow: hidden。
  ○ 通过 border-top-left-radius 保持与容器圆角一致，细节处理非常到位。
技术点	实现细节	价值
Mock API	Promise
 + setTimeout	模拟真实后端延迟，便于前端独立开发。
滚动容器	scroll-view	提供更细腻的滚动控制，隐藏滚动条。
伪元素应用	::before
 装饰条	增强页面层次感，引导视觉。
文本截断	ellipsis
 + nowrap	防止推荐列表的标题因过长而撑破布局。
<template>
	<view class="detail">
		<up-navbar title="" bg-color="transparent" :autoBack="true" left-icon-color="#fff" />
		
		<!-- 添加滚动容器 -->
		<scroll-view class="scroll-container" scroll-y="true" enhanced :show-scrollbar="false">
			<view class="d-con">
				<image :src="itemData.img" mode="widthFix" class="detail-image"></image>
				
				<view class="d-content">
					<view class="j-con">
						<view class="tit-row">
							<text class="main-title">{{ itemData.title }}</text>
							<up-tag 
								text="5A级景区" 
								size="mini" 
								shape="circle" 
								bgColor="#66B1FF" 
								borderColor="#66B1FF" 
								color="#fff">
							</up-tag>
						</view>
						
						<view class="jj">
							<text class="label">景区介绍</text>
							<text class="nr">{{ itemData.introduce }}</text>
						</view>
						
						<view class="jj">
							<text class="label">开放时间</text>
							<text class="nr">{{ itemData.times }}</text>
						</view>
						
						<!-- 游玩推荐 -->
						<view class="j-con ls">
							<view class="tit" style="font-size: 34rpx; margin-top: 20rpx; color: #000000; font-weight: bold;">
								游玩推荐
							</view>
							<view class="jj tj-list">
								<view class="item" v-for="(item, idx) in projectList" :key="idx">
									<image :src="item.url" mode="aspectFill"></image>
									<view class="topFixed">
										{{ item.tag }}
									</view>
									<view class="infos">
										<view class="tit">{{ item.title }}</view>
										<view class="desc">
											<up-icon name="map" color="#9c9c9c" size="16"></up-icon>
											<text class="text">{{ item.desc }}</text>
										</view>
									</view>
								</view>
							</view>
						</view>
						
						<!-- 底部留白 -->
						<view class="bottom-space"></view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const itemData = reactive({
	id: 0,
	title: '',
	img: '',
	introduce: '',
	times: ''
})

// 定义游玩推荐列表
const projectList = ref([
	{
		url: '/static/tt.jpg',
		tag: '热门推荐',
		title: '天坛祈年殿',
		desc: '祈年殿是天坛的标志性建筑'
	},
	{
		url: '/static/gg.jpg',
		tag: '必去景点',
		title: '故宫博物院',
		desc: '世界五大宫之首'
	},
	{
		url: '/static/jzg.jpg',
		tag: '自然风光',
		title: '九寨沟',
		desc: '人间仙境，童话世界'
	},
	{
		url: '/static/bmy.jpg',
		tag: '历史遗迹',
		title: '兵马俑',
		desc: '世界第八大奇迹'
	}
])

onLoad((opt) => {
	if (opt && opt.item) {
		try {
			const data = JSON.parse(decodeURIComponent(opt.item))
			Object.assign(itemData, data)
			console.log('详情数据:', itemData)
		} catch (error) {
			console.error('数据解析失败:', error)
			uni.showToast({ title: '数据读取失败', icon: 'none' })
		}
	}
})
</script>

<style lang="scss" scoped>
.detail {
	width: 100%;
	height: 100vh;
	background-color: #f8f8f8;
	display: flex;
	flex-direction: column;
	
	// 滚动容器
	.scroll-container {
		flex: 1;
		width: 100%;
	}
	
	.d-con {
		width: 100%;
		padding-bottom: 40rpx;
		
		.detail-image {
			width: 100%;
			display: block;
		}
		
		.d-content {
			width: 100%;
			margin-top: -40rpx;
			background-color: #fff;
			padding: 40rpx 30rpx 60rpx;
			box-sizing: border-box;
			border-radius: 40rpx 40rpx 0 0;
			position: relative;
			z-index: 10;
			
			.tit-row {
				display: flex;
				align-items: center;
				margin-bottom: 40rpx;
				
				.main-title {
					font-size: 38rpx;
					font-weight: bold;
					color: #333;
					margin-right: 15rpx;
				}
			}
			
			.jj {
				margin-bottom: 40rpx;
				
				.label {
					display: block;
					font-size: 30rpx;
					font-weight: bold;
					color: #111;
					margin-bottom: 15rpx;
					position: relative;
					padding-left: 20rpx;
					
					&::before {
						content: '';
						position: absolute;
						left: 0;
						top: 50%;
						transform: translateY(-50%);
						width: 6rpx;
						height: 30rpx;
						background-color: #66B1FF;
						border-radius: 3rpx;
					}
				}
				
				.nr {
					display: block;
					font-size: 28rpx;
					color: #666;
					line-height: 48rpx;
					text-align: justify;
					word-break: break-all;
				}
			}
			
			.tj-list {
				display: flex;
				flex-wrap: wrap;
				justify-content: space-between;
				
				.item {
					position: relative;
					width: 48%;
					margin-bottom: 20rpx;
					background-color: #fff;
					box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
					border-radius: 20rpx;
					overflow: hidden;
					
					.topFixed {
						position: absolute;
						top: 0;
						left: 0;
						border-top-left-radius: 20rpx;
						border-bottom-right-radius: 20rpx;
						background-color: #ffaa7f;
						color: #fff;
						text-align: center;
						font-size: 22rpx;
						padding: 6rpx 20rpx;
						box-sizing: border-box;
						z-index: 2;
					}
					
					image {
						width: 100%;
						height: 200rpx;
						display: block;
					}
					
					.infos {
						padding: 15rpx 15rpx 20rpx;
						
						.tit {
							font-size: 28rpx;
							font-weight: 700;
							color: #111;
							margin-bottom: 10rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
						
						.desc {
							display: flex;
							align-items: center;
							
							.text {
								font-size: 24rpx;
								color: #8a8a8a;
								margin-left: 8rpx;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
								flex: 1;
							}
						}
					}
				}
			}
			
			// 底部留白
			.bottom-space {
				height: 40rpx;
			}
		}
	}
}
</style>
// api/mockData/pageApi.js

/**
 * 统一导出 getBanner 函数
 * 作用：模拟获取轮播图数据
 */
export const getBanner = () => {
	console.log("--- 正在执行 Mock 拦截: getBanner ---");
	return new Promise((resolve) => {
		// 模拟网络延迟 100ms
		setTimeout(() => {
			resolve({
				code: 1,
				data: {
					bannerList: [{
							image: '/static/gsh.jpg',
							title: '身无彩凤双飞翼，心有灵犀一点通',
						},
						{
							image: '/static/qt.jpg',
							title: '谁念西风独自凉，萧萧黄叶闭疏窗',
						},
					]
				},
				msg: 'success'
			});
		}, 100);
	});
};

/**
 * 统一导出 getHomeList 函数
 * 作用：模拟获取首页瀑布流列表数据
 */
export const getHomeList = () => {
	console.log("--- 正在执行 Mock 拦截: getHomeList ---");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				code: 1,
				data: [{
						id: 1,
						title: '天坛公园',
						img: '/static/tt.jpg',
						tag: ['著名', '名胜古迹'],
						isDot: '推荐',
						dot: true,
						introduce: '天坛公园，原名“天地坛”，位于北京市东城区，是中国现存最大的古代祭祀性建筑群。',
						times: '9:00 -- 18:00',
						address: ['116.410886', '39.881949']
					},
					{
						id: 2,
						title: '北京故宫',
						img: '/static/gg.jpg',
						tag: ['著名', '名胜古迹'],
						isDot: '推荐',
						dot: false,
						introduce: '北京故宫（紫禁城）位于北京中轴线的中心，是中国明清两代的皇家宫殿。',
						times: '每周一到周五9:00 -- 18:00',
					},
					{
						id: 3,
						title: '四川九寨沟',
						img: '/static/jzg.jpg',
						tag: ['著名', '风景区'],
						isDot: '强烈推荐',
						dot: false,
						introduce: '九寨沟国家自然保护区具有较高的生态保护、科学研究和美学旅游价值。',
						times: '每周一到周五8:00 -- 17:00',
					},
					{
						id: 4,
						title: '西安兵马俑',
						img: '/static/bmy.jpg',
						tag: ['世界遗产', '名胜古迹'],
						isDot: '必去',
						dot: true,
						introduce: '兵马俑是第一批全国重点文物保护单位，位于陕西省西安市临潼区。',
						times: '每周一到周五9:00 -- 18:00',
					},
					{
						id: 5,
						title: '大唐不夜城',
						img: '/static/ddbyc.jpg',
						tag: ['网红打卡', '文化街区'],
						isDot: '夜景美',
						dot: false,
						introduce: '大唐不夜城是全国唯一一个以盛唐文化为背景的大型仿唐建筑群步行街。',
						times: '全天开放',
					},
					{
						id: 6,
						title: '黄山',
						img: '/static/hs.jpg',
						tag: ['五岳归来', '自然景观'],
						isDot: '推荐',
						dot: false,
						introduce: '黄山位于安徽省黄山市，以奇松、怪石、云海、温泉、冬雪“五绝”著称。',
						times: '每周一到周天7:00 -- 17:30',
					},
					{
						id: 7,
						title: '杭州西湖',
						img: '/static/xh.jpg',
						tag: ['江南美景', '免费开放'],
						isDot: '推荐',
						dot: false,
						introduce: '西湖位于浙江省杭州市，为江南三大名湖之一，景色秀丽。',
						times: '全天开放',
					}
				],
				msg: 'success'
			});
		}, 200);
	});
};

// 默认导出对象，增加鲁棒性
export default {
	getBanner,
	getHomeList
};

21-项目详情页面编写
这组代码展示了小程序开发中一个非常核心的场景：从详情页（Detail）深度下钻到地图导览页（Line），并伴随复杂的数据联动。
通过这套逻辑，你已经实现了一个具备地图定位、评分系统、以及横向滚动推荐的完整交互闭环。
地图导览与动态切换笔记
1. 微信小程序地图组件 (<map>)
在 line.vue 中，<map> 组件是核心。
● Markers（标记点）：通过 detailInfo.markers 数组实现。每一个对象代表地图上的一个大头针。
  ○ 关键属性：必须包含 id, latitude, longitude。
  ○ 动态更新：当用户切换项目时，通过修改 markers[0] 的坐标，地图上的红点会随之移动。
● 位置中心：:latitude 和 :longitude 决定了地图视图的中心点，通常设置为当前项目的坐标。
2. 横向滚动列表 (up-scroll-list)
在页面底部，你使用了 uView 的 up-scroll-list 来实现“更多项目”的快速切换：
● 交互逻辑：点击项触发 switchProject。
● 局部刷新：切换时并没有跳转页面，而是通过 reactive 对象的特性，直接修改 detailInfo 的标题和坐标，从而实现“原地切换”的丝滑感。
● UI 细节：设置了 indicator（指示器），让用户直观地知道当前列表可以左右滑动。
3. 仿原生胶囊按钮 (capsule-mock)
由于微信小程序右上角自带“胶囊按钮”，为了让 UI 更加对称和美观，你在地图左上角手动模拟了一个背景块（.capsule-mock）：
● 设计目的：这是一种常见的“反补”设计，使顶部状态栏区域在视觉上保持平衡。
● 返回按钮：.back-icon 采用绝对定位浮在地图最上层，点击调用 uni.navigateBack()，符合移动端的操作习惯。
4. 路由跳转与 ID 传参
在 detail.vue 中，通过 goLine 方法实现了 ID 的精准传递：
● 修正逻辑：确保 projectList 中每个项目都有唯一的 id。
● 传参方式：url: /pages/line/line?id=${item.id}。
● 接收方式：在 line.vue 的 onLoad 中通过 props.id 获取，并调用 fetchProjectDetail 向后端（或 Mock）请求该项目的具体坐标和介绍。
功能模块	关键技术	作用
地理位置	<map>
 组件 + markers	直观展示项目在景区中的位置。
项目评价	up-rate
 (readonly)	以星级形式展示项目推荐度，增强信息说服力。
动态加载	uni.showLoading	在数据切换的空档期提供视觉反馈，避免界面卡死感。
布局模式	flex-direction: column	经典的“上图下文”布局，地图固定高度，信息流随内容撑开。
<template>
	<view class="line-container">
		<view class="map-box">
			<map 
				id="myMap"
				class="full-map"
				:latitude="detailInfo.latitude"
				:longitude="detailInfo.longitude"
				:markers="detailInfo.markers"
				:show-location="true"
				:show-scale="true"
			></map>
			
			<view class="back-icon" @click="goBack">
				<up-icon name="arrow-left" size="22" color="#333"></up-icon>
			</view>
			
			<view class="capsule-mock">
				<view class="dot"></view>
				<view class="line-v"></view>
				<view class="circle"></view>
			</view>
			
			<view class="map-copyright">© 2026 高德地图数据</view>
		</view>

		<view class="project-info">
			<view class="title-line">
				<text class="label">当前游玩项目：</text>
				<text class="content">{{ detailInfo.title }}</text>
			</view>
			<view class="star-line">
				<text class="label">项目推荐：</text>
				<up-rate 
					v-model="detailInfo.rate" 
					count="5" 
					active-color="#FFD700" 
					size="20" 
					readonly
				></up-rate>
			</view>
		</view>

		<view class="swiper-section">
			<view class="section-title">更多游玩推荐</view>
			<up-scroll-list :indicator="true" indicatorActiveColor="#f56c6c">
				<view 
					class="scroll-item" 
					v-for="(item, index) in detailInfo.otherProjects" 
					:key="index"
					@click="switchProject(item)"
				>
					<image :src="item.url" mode="aspectFill" class="scroll-img"></image>
					<view class="scroll-text">其他游玩项目：{{ item.name }}</view>
				</view>
			</up-scroll-list>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectInfo } from '../../api/api.js'

// 初始化数据（直接写死初始值，保证直接运行能看到效果）
const detailInfo = reactive({
	id: 1,
	title: '过山车',
	rate: 5,
	latitude: 39.9042, // 北京坐标示例
	longitude: 116.4074,
	markers: [{
		id: 1,
		latitude: 39.9042,
		longitude: 116.4074,
		iconPath: '/static/marker.png', // 红色定位点图标，需确保static下有该文件
		width: 30,
		height: 30,
		title: '过山车'
	}],
	otherProjects: [
		{ id: 2, name: '旋转木马', url: '/static/zz.jpg',},
		{ id: 3, name: '激流勇进', url: '/static/cl.jpg' },
		{ id: 4, name: '摩天轮', url: '/static/cc.jpg' }
	]
})

// 返回函数
const goBack = () => {
	uni.navigateBack()
}

// 点击轮播图切换项目
const switchProject = (item) => {
	// 重新通过接口获取数据或直接本地切换
	uni.showLoading({ title: '加载中' })
	setTimeout(() => {
		detailInfo.title = item.name
		uni.hideLoading()
	}, 500)
}

onLoad((props) => {
	// 如果有传参 ID，则调用接口更新数据
	if (props.id) {
		fetchProjectDetail(props.id)
	}
})

const fetchProjectDetail = (id) => {
	projectInfo({ id: id }).then(res => {
		const data = res.data || res
		if (data && data.title) {
			detailInfo.title = data.title
			detailInfo.latitude = data.location ? data.location[0] : 39.9042
			detailInfo.longitude = data.location ? data.location[1] : 116.4074
			// 更新红色定位点
			detailInfo.markers[0].latitude = detailInfo.latitude
			detailInfo.markers[0].longitude = detailInfo.longitude
		}
	})
}
</script>

<style lang="scss" scoped>
.line-container {
	width: 100%;
	min-height: 100vh;
	background-color: #ffffff;
	display: flex;
	flex-direction: column;

	// 1. 地图模块样式
	.map-box {
		width: 100%;
		height: 650rpx; // 地图高度
		position: relative;

		.full-map {
			width: 100%;
			height: 100%;
		}

		.back-icon {
			position: absolute;
			top: 80rpx;
			left: 30rpx;
			width: 70rpx;
			height: 70rpx;
			background-color: rgba(255, 255, 255, 0.9);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
		}

		.capsule-mock {
			position: absolute;
			top: 80rpx;
			right: 30rpx;
			width: 150rpx;
			height: 60rpx;
			background-color: rgba(255, 255, 255, 0.8);
			border-radius: 40rpx;
			display: flex;
			align-items: center;
			justify-content: space-around;
			padding: 0 10rpx;
			z-index: 10;
			.dot { width: 10rpx; height: 10rpx; background: #000; border-radius: 50%; }
			.line-v { width: 1rpx; height: 30rpx; background: #ddd; }
			.circle { width: 30rpx; height: 30rpx; border: 4rpx solid #000; border-radius: 50%; }
		}

		.map-copyright {
			position: absolute;
			bottom: 20rpx;
			left: 20rpx;
			font-size: 18rpx;
			color: #666;
			background: rgba(255, 255, 255, 0.5);
			padding: 2rpx 10rpx;
		}
	}

	// 2. 项目信息栏样式
	.project-info {
		padding: 40rpx 30rpx;
		background: #fff;
		border-bottom: 20rpx solid #f8f8f8;

		.title-line, .star-line {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			
			.label {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}
			.content {
				font-size: 32rpx;
				color: #f56c6c;
				font-weight: bold;
			}
		}
	}

	// 3. 轮播图样式
	.swiper-section {
		padding: 30rpx;
		
		.section-title {
			font-size: 30rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
			color: #333;
		}

		.scroll-item {
			margin-right: 20rpx;
			width: 320rpx;
			
			.scroll-img {
				width: 320rpx;
				height: 200rpx;
				border-radius: 12rpx;
				box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
			}

			.scroll-text {
				font-size: 26rpx;
				color: #666;
				margin-top: 10rpx;
				text-align: center;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}
}
</style>
<template>
	<view class="detail">
		<up-navbar title="景区详情" bg-color="transparent" :autoBack="true" left-icon-color="#fff" />
		
		<scroll-view class="scroll-container" scroll-y="true" enhanced :show-scrollbar="false">
			<view class="d-con">
				<image :src="itemData.img" mode="widthFix" class="detail-image"></image>
				
				<view class="d-content">
					<view class="j-con">
						<view class="tit-row">
							<text class="main-title">{{ itemData.title }}</text>
							<up-tag text="5A级景区" size="mini" shape="circle" bgColor="#66B1FF" borderColor="#66B1FF" color="#fff" />
						</view>
						
						<view class="jj">
							<text class="label">景区介绍</text>
							<text class="nr">{{ itemData.introduce }}</text>
						</view>
						
						<view class="jj">
							<text class="label">开放时间</text>
							<text class="nr">{{ itemData.times }}</text>
						</view>
						
						<view class="j-con ls">
							<view class="tit" style="font-size: 34rpx; margin-top: 20rpx; color: #000; font-weight: bold;">
								游玩推荐
							</view>
							<view class="jj tj-list">
								<view class="item" v-for="(item, idx) in projectList" :key="idx" @click="goLine(item)">
									<image :src="item.url" mode="aspectFill"></image>
									<view class="topFixed">{{ item.tag }}</view>
									<view class="infos">
										<view class="tit">{{ item.title }}</view>
										<view class="desc">
											<up-icon name="map" color="#9c9c9c" size="16"></up-icon>
											<text class="text">{{ item.desc }}</text>
										</view>
									</view>
								</view>
							</view>
						</view>
						
						<view class="bottom-space"></view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const itemData = reactive({
	id: 0,
	title: '',
	img: '',
	introduce: '',
	times: ''
})

// 修复跳转逻辑
const goLine = (item) => {
	console.log('点击跳转项目ID:', item.id);
	if (!item.id) {
		uni.showToast({ title: '缺少项目ID', icon: 'none' });
		return;
	}
	// 修复拼写错误 uno -> uni
	uni.navigateTo({
		url: `/pages/line/line?id=${item.id}`
	})
}

// 修复数据源：必须包含 id 才能跳转成功
const projectList = ref([
	{
		id: 1, // 确保有ID
		url: '/static/gsc.jpg',
		tag: '热门推荐',
		title: '过山车',
		desc: '挑战心跳极限'
	},
	{
		id: 2,
		url:  '/static/zz.jpg',
		tag: '必去景点',
		title: '旋转木马',
		desc: '童话般的浪漫'
	},
	{
		id: 3,
		url:'/static/cl.jpg',
		tag: '自然风光',
		title: '激流勇进',
		desc: '清凉一夏的快感'
	},
	{
		id: 4,
		url:  '/static/cc.jpg',
		tag: '历史遗迹',
		title: '摩天轮',
		desc: '俯瞰全城美景'
	}
])

onLoad((opt) => {
	if (opt && opt.item) {
		try {
			const data = JSON.parse(decodeURIComponent(opt.item))
			Object.assign(itemData, data)
		} catch (error) {
			console.error('数据解析失败:', error)
		}
	}
})
</script>

<style lang="scss" scoped>
/* 保持你原来的样式不变 */
.detail {
	width: 100%; height: 100vh; background-color: #f8f8f8; display: flex; flex-direction: column;
	.scroll-container { flex: 1; width: 100%; }
	.d-con {
		width: 100%;
		.detail-image { width: 100%; display: block; }
		.d-content {
			width: 100%; margin-top: -40rpx; background-color: #fff; padding: 40rpx 30rpx 60rpx;
			box-sizing: border-box; border-radius: 40rpx 40rpx 0 0; position: relative; z-index: 10;
			.tit-row { display: flex; align-items: center; margin-bottom: 40rpx; .main-title { font-size: 38rpx; font-weight: bold; color: #333; margin-right: 15rpx; } }
			.jj {
				margin-bottom: 40rpx;
				.label { display: block; font-size: 30rpx; font-weight: bold; color: #111; margin-bottom: 15rpx; position: relative; padding-left: 20rpx; &::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 30rpx; background-color: #66B1FF; border-radius: 3rpx; } }
				.nr { display: block; font-size: 28rpx; color: #666; line-height: 48rpx; text-align: justify; word-break: break-all; }
			}
			.tj-list {
				display: flex; flex-wrap: wrap; justify-content: space-between;
				.item {
					position: relative; width: 48%; margin-bottom: 20rpx; background-color: #fff; box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08); border-radius: 20rpx; overflow: hidden;
					.topFixed { position: absolute; top: 0; left: 0; border-top-left-radius: 20rpx; border-bottom-right-radius: 20rpx; background-color: #ffaa7f; color: #fff; text-align: center; font-size: 22rpx; padding: 6rpx 20rpx; z-index: 2; }
					image { width: 100%; height: 200rpx; display: block; }
					.infos { padding: 15rpx 15rpx 20rpx; .tit { font-size: 28rpx; font-weight: 700; color: #111; margin-bottom: 10rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .desc { display: flex; align-items: center; .text { font-size: 24rpx; color: #8a8a8a; margin-left: 8rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; } } }
				}
			}
			.bottom-space { height: 40rpx; }
		}
	}
}
</style>
// api/api.js
import http from './http.js';

// 获取轮播图
export const getBanner = () => {
    return http('/api/user/getBanner'); 
};

// 获取首页列表
export const getHomeList = () => {
    return http('/api/user/getHomeList');
};

// 登录接口
export const login = (data) => {
    return http('/login', data, 'POST');
};

// 获取用户信息
export const getUserInfo = () => {
    return http('/getUserInfo');
};

// api/api.js 建议修改如下：
export const projectInfo = (data) => {
    return http('/project/info', data); // 这个是 line 页面用的
};

// 确保 detail 页面调用的名称一致
export const detailProject = () => {
    return http('/detail/project');
};

22.我的喜欢页面编写
这份代码展示了用户中心常见的**“我的喜欢”/“收藏夹”列表页**。它在 UI 上延续了之前的双列卡片设计，但在数据容错处理和交互细节上做了进一步的增强。
重点在于数据的防御性编程与列表加载优化。
收藏列表与数据防御
1. 数据的防御性编程 (Defensive Programming)
在 loadLikeList 的 .then() 回调中，你编写了一段非常健壮的逻辑：
● 多格式兼容：后端接口返回的数据结构往往可能发生变动（例如有时包裹在 res.data 里，有时直接返回数组）。
● 容错链路：通过 if...else if 逐层拆解数据，确保无论后端返回 res.code === 1 还是直接返回数组，前端都能正确渲染，而不至于因 undefined 导致崩溃。
● 模拟数据兜底：在 .catch() 中加入模拟数据。这在开发阶段非常实用，即便后端接口挂了，你依然可以调试 CSS 样式和交互逻辑。
2. 文本的多行截断技巧
在 .desc .text 的样式中，你使用了经典的 Webkit 内核多行溢出隐藏：
SCSS
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: 2; // 限制显示2行
overflow: hidden;
● 对比：之前的 white-space: nowrap 只能处理单行省略。对于介绍类文字，显示 2 行既能保留足够的信息量，又能保证卡片对齐。
3. 视觉反馈与状态处理
● 空状态提示 (v-if="linkList.length === 0")：这是提升 UX（用户体验）的关键。如果没有数据且不给提示，用户会怀疑是 App 加载失败还是自己确实没收藏过。
● 渐变色标签 (linear-gradient)：
  ○ background: linear-gradient(135deg, #ff5500, #ff7733);
  ○ 相比纯色，渐变色标签更具动感，且右上角的反向圆角处理（border-top-right 与 border-bottom-left）让卡片看起来更精致。
● 点击缩放反馈 (:active)：
  ○ transform: scale(0.98);
  ○ 给用户一种“按下去”的物理反馈感，简单却有效。
技巧名称	实现手段	视觉效果
双列布局	width: 48%
 + flex-wrap	经典的瀑布流式展示。
多行截断	-webkit-line-clamp: 2	限制介绍内容，防止高度参差不齐。
点击反馈	&:active { scale(0.98) }	增加操作的触感和灵动感。
渐变标签	linear-gradient	强化“喜欢”状态的视觉权重。
<template>
	<view class="like">
		<view class="tj-list">
			<view class="item" v-for="(item, index) in linkList" :key="index">
				<image :src="item.img" mode="aspectFill"></image>
				<view class="topFixed">喜欢</view>
				<view class="infos">
					<view class="tit">{{ item.title }}</view>
					<view class="desc">
						<text class="text">{{ item.introduce || item.desc || '暂无介绍' }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态提示 -->
		<view v-if="linkList.length === 0" class="empty-state">
			<text>暂无喜欢的内容</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { likeList } from '../../api/api.js'

const linkList = ref([])

onLoad(() => {
	loadLikeList()
})

// 加载喜欢列表
const loadLikeList = () => {
	uni.showLoading({ title: '加载中...' })
	
	likeList().then(res => {
		console.log('喜欢列表返回:', res)
		uni.hideLoading()
		
		// 处理多种返回数据格式
		if (res && res.code === 1 && res.data) {
			linkList.value = res.data
		} else if (res && res.data) {
			linkList.value = res.data
		} else if (Array.isArray(res)) {
			linkList.value = res
		} else {
			console.error('数据格式错误:', res)
			linkList.value = []
			uni.showToast({ title: '数据格式错误', icon: 'none' })
		}
	}).catch(err => {
		console.error('获取喜欢列表失败:', err)
		uni.hideLoading()
		uni.showToast({ title: '加载失败', icon: 'none' })
		
		// 开发测试用模拟数据
		linkList.value = [
			{
				id: 1,
				img: '/static/tt.jpg',
				title: '天坛公园',
				introduce: '天坛公园，原名"天地坛"，位于北京市东城区，是中国现存最大的古代祭祀性建筑群。'
			},
			{
				id: 2,
				img: '/static/gg.jpg',
				title: '北京故宫',
				introduce: '北京故宫是中国明清两代的皇家宫殿，旧称紫禁城。'
			},
			{
				id: 3,
				img: '/static/jzg.jpg',
				title: '九寨沟',
				introduce: '九寨沟国家自然保护区具有较高的生态保护、科学研究和美学旅游价值。'
			},
			{
				id: 4,
				img: '/static/bmy.jpg',
				title: '西安兵马俑',
				introduce: '兵马俑是第一批全国重点文物保护单位，位于陕西省西安市临潼区。'
			}
		]
	})
}
</script>

<style lang="scss" scoped>
.like {
	min-height: 100vh;
	padding: 20rpx;
	box-sizing: border-box;
	background-color: #f5f5f5;
	
	.tj-list {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		
		.item {
			position: relative;
			width: 48%;
			margin-bottom: 20rpx;
			background-color: #fff;
			border-radius: 20rpx;
			overflow: hidden;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
			transition: all 0.3s;
			
			&:active {
				transform: scale(0.98);
			}
			
			.topFixed {
				position: absolute;
				top: 0;
				right: 0;
				border-top-right-radius: 20rpx;
				border-bottom-left-radius: 20rpx;
				background: linear-gradient(135deg, #ff5500, #ff7733);
				color: #fff;
				text-align: center;
				font-size: 22rpx;
				padding: 6rpx 20rpx;
				box-sizing: border-box;
				z-index: 2;
			}
			
			image {
				width: 100%;
				height: 200rpx;
				display: block;
			}
			
			.infos {
				padding: 15rpx 15rpx 20rpx;
				
				.tit {
					font-size: 28rpx;
					font-weight: 700;
					color: #111;
					margin-bottom: 12rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.desc {
					display: flex;
					justify-content: flex-start;
					align-items: center;
					
					.text {
						font-size: 24rpx;
						color: #8a8a8a;
						line-height: 1.4;
						overflow: hidden;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						text-overflow: ellipsis;
					}
				}
			}
		}
	}
	
	.empty-state {
		text-align: center;
		padding: 100rpx 0;
		color: #999;
		font-size: 28rpx;
	}
}
</style>

23.这个小程序使用了什么技术
这是一个基于 Vue3 生态构建的现代 uni-app 跨平台小程序项目。
它不仅是一个简单的页面堆砌，而是结合了 UI 框架、异步接口请求、Mock 模拟数据以及原生小程序能力的完整应用。以下是该程序使用的核心技术栈分析：
1. 核心框架：uni-app (Vue 3 版本)
这是整个项目的底层框架。
● 开发语言：使用了 Vue 3。你可以看到代码中大量使用了 <script setup> 语法，这是 Vue 3 推荐的组合式 API（Composition API）编写方式，效率更高且逻辑更清晰。
● 跨端能力：uni-app 允许一套代码编译到微信小程序、支付宝小程序、H5、Android 和 iOS 等多个平台。
2. UI 组件库：uView-plus (或 uView 2.x)
代码中大量使用了以 up-（或 u-）开头的组件，这表明项目深度集成了 uView-plus 框架。
● 使用的组件：
  ○ 布局与导航：up-navbar（自定义导航栏）、up-popup（弹出层）、up-cell（单元格列表）。
  ○ 展示组件：up-swiper（轮播图）、up-waterfall（瀑布流）、up-tag（标签）、up-rate（评分）。
  ○ 交互组件：up-search（搜索框）、up-scroll-list（横向滚动）、up-notice-bar（通知栏）。
3. 网络请求与数据处理
● 异步编程：代码中广泛使用 async/await 和 Promise 处理接口请求。
● 拦截器/封装：通过 import http from './http.js' 可以推断出项目对 uni.request 进行了二次封装，统一处理了 Token 鉴权和错误拦截。
● 数据模拟 (Mock)：在 pageApi.js 中，使用了 setTimeout 和 Promise 来模拟真实的后端接口请求。这在后端接口未就绪时，能让前端独立开发。
4. 微信小程序原生能力集成
程序深度调用了微信提供的原生接口：
● 身份授权：使用 open-type="chooseAvatar" 获取头像，type="nickname" 获取昵称。
● 地理位置：集成了 <map> 组件，并利用 markers 属性标注地理坐标（GCJ-02 坐标系）。
● 登录流程：调用 uni.login 获取微信 code，用于前后端换取登录态。
5. 样式与预处理器：SCSS
代码中使用了 <style lang="scss">，说明项目配置了 Sass/Scss 预处理器。
● 嵌套语法：利用 SCSS 的嵌套特性处理复杂的 CSS 层级（如 .user-card { .u-top { image { ... } } }）。
● 设计技巧：使用了 linear-gradient（渐变）、box-shadow（阴影）、margin 负值压盖、以及移动端常用的 rpx 响应式单位。
6. 状态管理与持久化
● 响应式数据：利用 Vue 3 的 ref 和 reactive 实现数据与视图的双向绑定。
● 本地存储：利用 uni.setStorageSync 和 uni.getStorageSync 实现用户登录信息（Token）和个人资料的持久化存储，确保用户下次打开 App 时无需重复登录。
维度	技术/工具	作用
底层框架	uni-app (Vue 3)	跨平台开发基础，响应式逻辑处理。
UI 视觉	uView-plus	提供统一、美观的移动端 UI 组件。
样式编写	SCSS	提高 CSS 编写效率和可维护性。
接口通讯	Promise / Axios 风格封装	处理前后端数据交互。
原生接口	微信地图、授权、分享	调用手机硬件或微信特有功能。
数据模拟	Mock.js 思想	前后端并行开发，模拟接口返回。
总结： 这是一个标准的、具有商用潜力的 Vue 3 跨平台小程序 模板。它在交互上追求“沉浸式体验”（如透明导航栏、地图联动），在代码结构上遵循了“高内聚低耦合”的模块化开发原则。  
三：uni-app 面试题汇总  
 7. uniapp 调用支付  
 面试回答模板
“在 UniApp 中实现微信支付，主要分为前端发起请求、后端调用微信 API、前端唤起支付面板三个大环节。具体步骤如下：”
8. 创建订单（下单阶段）
首先，前端需要搜集用户选择的商品 ID、数量、收货地址等信息，组织成一个订单对象。
● 发起请求：调用后端接口（如 /createOrder）。
● 获取结果：后端在数据库生成订单记录后，会返回一个唯一的订单编号（order_number）。
9. 订单预支付（预下单阶段）
有了订单编号后，前端并不能直接发起支付，需要通过后端去微信服务器进行“预支付”操作。
● 发起预支付请求：前端将“订单编号”发送给后端预支付接口。
● 后端逻辑：后端调用微信的 unifiedorder（统一下单）接口，微信服务器会返回预支付交易会话标识 prepay_id。
● 获取核心参数：后端会根据微信的要求进行签名加密，最终返回给前端 5 个核心参数：
  ○ timeStamp（时间戳）
  ○ nonceStr（随机字符串）
  ○ package（包含 prepay_id 的包）
  ○ signType（签名算法）
  ○ paySign（签名）
10. 发起微信支付（唤起面板阶段）
这是前端最核心的一步，调用 UniApp 提供的 API。
● 调用接口：使用 uni.requestPayment()。将后端传来的那 5 个核心参数以及 provider: 'wxpay' 传入。
● 执行逻辑：此时手机会自动跳出微信支付的密码/指纹输入面板。
11. 支付结果处理（状态同步阶段）
● 回调检测：
  ○ 如果用户取消或网络失败，会在 fail 回调中处理，提示用户“未完成支付”。
  ○ 如果支付成功，进入 success 回调。
● 最终查询：注意，success 回调并不代表钱已经到账。前端在收到 success 后，必须再次发起一个请求给后端（如 /checkPayStatus），由后端去微信后台查询最终扣款结果，确认无误后，再给用户展示“支付成功”的提示并跳转到结果页。
💡 面试加分点（高阶技巧）
如果你能在回答中补充以下细节，面试官会觉得你很有经验：
● 支付环境区分：微信支付在小程序、App 和 H5 环境下的流程略有不同。小程序直接用 uni.requestPayment，而 App 可能需要配置 manifest.json 的 SDK，H5 往往是跳转微信提供的 URL。
● 安全性：强调支付签名（paySign）必须由后端生成，绝对不能在前端暴露 AppSecret 或进行私钥签名，防止订单信息被篡改。
● 幂等性：提到在创建订单时会处理重复点击问题，防止用户连续点击产生两个订单。
● Loading 处理：在调用 requestPayment 前会展示 loading，防止用户在唤起微信的间隙重复操作。
// 3. 发起支付
uni.requestPayment({
    provider: 'wxpay',                    // 支付服务商：微信支付
    timeStamp: payParams.timeStamp,       // 时间戳
    nonceStr: payParams.nonceStr,         // 随机字符串
    package: payParams.package,           // 预支付交易会话标识
    signType: payParams.signType,         // 签名类型
    paySign: payParams.paySign,           // 签名
    
    success: (res) => {
        // 4. 去后端查询最终结果
        this.checkOrder(orderNo);          // 支付成功回调，查询订单最终状态
    },
    
    fail: (err) => {
        uni.showToast({ 
            title: '支付已取消',           // 支付失败或用户取消
            icon: 'none' 
        });
    }
});
核心流程（背诵版）
12. 下单： 前端将商品信息发给后端，后端生成订单并返回 订单编号。
13. 预支付： 前端把订单号发给后端，后端调用微信统一下单接口，返回 5 个支付核心参数（timeStamp, nonceStr, package, signType, paySign）。
14. 调用支付： 前端调用 uni.requestPayment 唤起微信面板，用户输入密码。
15. 结果确认： 支付成功后，前端必须再次请求后端查询支付状态，确认到账后再展示成功提示。

面试加分细节（一句话突显经验）
● 安全性： “签名（paySign）必须由后端生成，前端绝不接触私钥，防止数据被篡改。”
● 最终准则： “前端 success 回调不代表最终成功，必须以服务器查询微信后台的结果为准。”
● 用户体验： “调用 API 前会开启 loading，防止重复点击产生多笔订单。”

常用 API 记忆
● 发起支付：uni.requestPayment({ provider: 'wxpay', ... })
● 环境区分： 微信小程序直接用，App 需在 manifest.json 配置 SDK。
 2. 微信小程序知识点  
3. 小程序核心文件结构
面试官：请介绍一下小程序的主要文件构成。
● WXML (模板)：类似 HTML，但基于微信自定义组件化，支持逻辑判断和列表渲染。
● WXSS (样式)：支持 rpx 响应式单位（屏幕宽度默认为 750rpx），支持 @import。
● JS (逻辑)：处理交互、网络请求。
● JSON (配置)：
  ○ app.json：全局配置（页面路径、TabBar、网络超时）。
  ○ page.json：局部配置（覆盖全局的状态栏、禁用滚动等）。

4. 页面跳转（路由导航）
面试官：常用的跳转方式有哪些？有什么区别？
● wx.navigateTo：保留当前页，跳非 TabBar 页。注意：页面栈最多 10 层。
● wx.redirectTo：关闭当前页，跳非 TabBar 页。常用于登录逻辑，防止用户回退。
● wx.switchTab：专门跳 TabBar，并清空其他非 TabBar 页面栈。
● wx.reLaunch：重置所有页面栈。
● wx.navigateBack：回退，可传 delta 指定回退层数。

3. 组件通信（重点）
面试官：父子组件如何传值？
● 父传子：父组件通过属性绑定，子组件在 properties 中定义接收（可指定类型和默认值）。
● 子传父：子组件通过 this.triggerEvent('事件名', {数据}) 抛出自定义事件，父组件通过 bind:事件名 监听。
● 跨页面/全局：
  ○ getApp().globalData：全局变量。
  ○ wx.setStorage / wx.getStorage：本地持久化。
  ○ 发布订阅模式（如 Mitt 或微信自带的事件总线）。

4. 登录流程（必考核心）
面试官：请详细描述小程序登录流程。
这里要区分“前端流程”和“前后端交互”。
5. 前端：调用 wx.login() 获取 code（临时登录凭证）。
6. 前端：将 code 发送到自身服务器。
7. 后端：带上 AppID + AppSecret + code 请求微信接口（auth.code2Session）。
8. 微信服务器：校验成功，返回 openid（用户唯一标识）和 session_key。
9. 后端：自定义登录态（如 Token），并关联 openid，返回给小程序前端。
10. 前端：将 Token 存储到本地，后续请求带上 Token。

11. 常见问题处理（避坑经验）
面试官：小程序背景图不显示怎么办？
● 限制：WXSS 中的 background-image不支持本地路径。
● 方案：
  a. 使用 网络图片地址（最常用）。
  b. 转为 Base64 编码。
  c. 使用 <image> 组件，结合 CSS 定位（z-index: -1）模拟背景。

面试加分：小程序优化与生命周期
● 双线程模型：回答时提到小程序是 逻辑层（JS） 和 视图层（Webview） 双线程通信，中间通过 setData 传递。优化建议：减少 setData 的频率和数据量，避免页面卡顿。
● 生命周期：
  ○ App：onLaunch (启动), onShow (前台), onHide (后台)。
  ○ Page：onLoad (加载), onReady (渲染完成), onUnload (销毁)。
简短版记忆口诀：
“一登（登录）、二转（跳转）、三传（通信）、四配置（JSON）、五坑（背景图/setData）。”
小程序的生命周期
应用的生命周期
生命周期	说明
onLaunch	小程序初始化完成时触发，全局只触发一次
onShow	小程序启动，或从后台进入前台显示时触发
onHide	小程序从前台进入后台时触发
onError	小程序发生脚本错误或 API 调用报错时触发
生命周期	说明
onShow	生命周期回调 — 监听页面显示，请求数据
onReady	生命周期回调 — 监听页面初次渲染完成，获取页面元素（少用）
onHide	生命周期回调 — 监听页面隐藏，终止任务，如定时器或者播放音乐
onUnload	生命周期回调 — 监听页面卸载，终止任务
onLoad	生命周期回调 — 监听页面加载，发送请求获取数据
面试加分点
1. 页面栈与跳转性能
页面栈最多10层，超过会触发wx.navigateTo失败
使用wx.reLaunch或wx.redirectTo可避免页面栈过深
2. 组件通信最佳实践
简单传值用properties
复杂数据传递用app.globalData
跨组件通信用EventBus或状态管理
3. 登录安全
用户信息必须经过后端验证，不能直接使用前端返回的数据
session_key不能暴露给前端，只保留在后端
使用wx.checkSession检查登录态是否过期
4. 背景图优化
背景图使用image组件+定位，支持懒加载
网络背景图需配置downloadFile域名白名单
大背景图建议压缩后上传CDN
 5. uni-app 跨端原理  
1，面试官：uni-app 为什么能实现一套代码多端运行？
核心回答： uni-app 采用了“编译器”和“运行时（Runtime）”**双向驱动的架构。
● 编译器（开发阶段）：
  ○ 基于 vue-loader，将 Vue 语法转换为各个平台的原生语法。
  ○ App 端： 将代码编译为原生引擎识别的配置或 Weex/NVue。
  ○ 小程序端： 将 Vue 组件拆解并转换为对应的 WXML、WXSS、JS 和 JSON 配置文件。
  ○ H5 端： 编译为标准的 HTML/JS/CSS。
● 运行时（运行阶段）：
  ○ 提供了统一的 API 适配层（即 uni.xxx）。
  ○ 在不同平台运行时，Runtime 会自动将 uni.request 映射为 wx.request（小程序）或 XMLHttpRequest（H5）等底层实现。
● 条件编译：
  ○ 通过 #ifdef 等语法，允许开发者在同一套代码中编写针对特定平台的差异化逻辑。
,2. 微信小程序登录流程（标准 5 步法）
面试官：请详细说明小程序是如何实现登录和维护状态的？
核心回答： 这是一个典型的“三方交互”过程（小程序、开发者后台、微信后台）。
6. 获取 Code： 小程序端调用 wx.login() 获取临时登录凭证 code（有效期 5 分钟）。
7. 提交 Code： 前端通过 wx.request() 将 code 发送给开发者自己的后端。
8. 换取 OpenID： 后端带上 AppID + AppSecret + Code 请求微信接口（auth.code2Session）。
9. 下发 Token： 微信返回 openid（用户唯一标识）和 session_key。后端将其与用户信息关联，生成自定义的 Token 返回给小程序。
  ○ 注意：session_key 和 openid 严禁直接传回前端，以防被伪造。
10. 持久化： 小程序将 Token 存入 storage。后续所有业务请求都在 Header 中携带该 Token，后端校验 Token 后返回数据。
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  小程序端  │     │  业务服务器 │     │  微信服务器 │     │  用户    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. wx.login()  │                │                │
     │───────────────>│                │                │
     │ 返回 code      │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 2. 发送 code   │                │                │
     │────────────────>│                │                │
     │                │ 3. code + appid │                │
     │                │   + appsecret  │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ 4. 返回 openid │                │
     │                │   + session_key│                │
     │                │<───────────────│                │
     │                │                │                │
     │ 5. 返回 token  │                │                │
     │<────────────────│                │                │
     │                │                │                │
     │ 6. 携带 token  │                │                │
     │   请求业务数据  │                │                │
     │────────────────>│                │                │
     │                │ 7. 验证 token  │                │
     │                │   返回业务数据  │                │
     │<────────────────│                │                │

临场发挥小贴士
● 关于 AppID： 如果面试官问“AppID 能在前端代码里写死吗？”，你要回答：“AppID 可以在配置中声明，但 AppSecret 必须严格保存在后端，绝不能出现在前端代码里，否则会导致严重的安全漏洞。”
● 关于 uni-app 原理： 强调 Vue 语法规范。uni-app 实际上是把 Vue 的开发体验带到了非 Web 平台，通过 AST（抽象语法树）转换技术实现的“转译”。
● 简短版记忆口诀：
  ○ 原理： “编译器转语法，运行时换 API”。
  ○ 登录： “拿 code、传后端、换 openid、回 Token”。
 4. uni-app 的生命周期  
5. uni-app 生命周期
uni-app 的生命周期分为三个层次：应用、页面、组件。
应用生命周期 (App.vue)
你列出的很全面，面试时重点突出这三个：
● onLaunch: 全局唯一，适合初始化 SDK（如高德地图、语音识别）或获取用户信息。
● onShow / onHide: 适合处理 App 的活跃状态，比如“从后台回来时刷新余额”。
页面生命周期 (Pages)
6. onUnload: 它是页面卸载（销毁），不是隐藏。比如 uni.redirectTo 或 uni.navigateBack 会触发它。
7. onHide: 它是页面隐藏（切到后台或跳转到下个页面），页面并没有销毁。
重点补充：
● onPullDownRefresh: 监听用户下拉动作，做刷新逻辑。
● onReachBottom: 页面上拉触底，常用于加载更多列表数据。
● onShareAppMessage: 用户点击右上角分享。
组件生命周期 (Components)
uni-app 组件完全遵循 Vue 的生命周期：
● created: 实例创建完成，数据观测已完成，但尚未挂载。
● mounted: 挂载完成，可以操作 DOM（在小程序端是逻辑层布局完成）。
● destroyed: 组件销毁。
8. 页面传值方式（深度优化）
你提到的 URL 传值有一处重大错误：uni-app 获取参数通常不使用 this.$route（那是 Vue-Router 的做法），而是通过生命周期钩子。
 第一种：URL 参数传递 (最常用)  
发送方：  
uni.navigateTo({ url: '/pages/detail/detail?id=123&name=uni' });
翻译：

从当前页面，跳转到 /pages/detail/detail 这个页面。

跳转的同时，顺便带两个参数过去：

一个叫 id，值是 123

一个叫 name，值是 uni

参数像快递包裹一样，附在 URL 后面，用 ? 开头，多个参数之间用 & 连接。
接收方 (在 onLoad 中拿)：  
onLoad(options) {
    console.log(options.id); // 123
}
翻译：

当目标页面加载完成后，会自动执行 onLoad 这个函数。

跳转时带过来的所有参数，会被打包成一个叫 options 的对象。

通过 options.id 就能拿到 123，通过 options.name 就能拿到 'uni'。
第二种：全局状态管理
● Vuex / Pinia: 适用于大中型项目，数据响应式，但刷新页面（H5 端）会丢失，需配合持久化。
第三种：本地存储 (Storage)
● uni.setStorageSync / uni.getStorageSync: 适合持久化数据（如 Token）。
● 优缺点: 读写速度比内存慢，不建议频繁传递大型对象。
第四种：事件总线 (EventBus) - 面试加分项
利用 uni.$emit 和 uni.$on 进行页面间通讯，非常适合跨页面通知（如：从 B 页面修改了数据，返回 A 页面要求 A 刷新）。
● 发送: uni.$emit('update', { msg: '修改成功' })
● 监听: uni.$on('update', (data) => { ... })
● 注意: 必须在 onUnload 里用 uni.$off 销毁监听，防止内存泄漏。
第五种：通过 getApp().globalData
在 App.vue 定义全局变量，简单粗暴但非响应式。
如果面试官问：“onLoad 和 onReady 有什么区别？”
● 回答：onLoad 侧重于获取数据（接收参数、请求接口）；onReady 侧重于** UI 渲染完成**（可以进行 canvas 操作、查询节点信息 uni.createSelectorQuery）。
 5.uni-app 实现跨端适配
在面试中，谈到 uni-app 的跨端适配，仅仅背出 #ifdef 是不够的。面试官更看重你对“一套代码如何处理不同平台差异”的系统性理解。
你可以从以下四个维度来完善你的回答，展现出你处理复杂跨端问题的能力：
1. 条件编译（核心手段）
你提到的 #ifdef（if defined）和 #ifndef（if not defined）是最基础的工具。
 JS 逻辑适配：  
// #ifdef APP-PLUS
// 只有在 App 端才执行的扫码 API
plus.barcode.scan(...);
// #endif

// #ifdef APP-PLUS	条件编译开始，只在 App 端生效
plus.barcode.scan(...)	5+ App 专属的扫码 API，只在 App 端存在
// #endif	条件编译结束

编译结果：

编译到 App → 代码保留，正常执行

编译到 H5/小程序 → 这段代码被完全删除，不会报错

为什么不直接写 if 判断？因为 plus 对象在其他平台根本不存在，直接判断会报 plus is not defined。条件编译从源码层面删除，更彻底。
CSS 样式适配：  
/* #ifdef H5 */
.header { height: 44px; } /* H5 导航栏通常自持 */
/* #endif */

/* #ifdef H5 */	CSS 中的条件编译写法（用注释形式）
.header { height: 44px; }	只在 H5 端生效的样式
/* #endif */	条件编译结束

为什么这样写？

各端导航栏高度不同：H5 通常 44px，小程序默认自带导航栏不需要额外处理

通过条件编译，让样式只作用于特定平台
Template 模板适配：
<template>
  <view>
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="getUserInfo">微信登录</button>
    <!-- #endif -->
  </view>
</template>

<!-- #ifdef MP-WEIXIN -->	模板中的条件编译（用 HTML 注释形式）
open-type="getUserInfo"	微信小程序专用属性，调起授权弹窗
<!-- #endif -->	条件编译结束

为什么需要条件编译？

open-type 是微信小程序独有的，H5 和 App 不认识这个属性

如果不加条件编译，H5/App 编译后会保留这个属性，虽然不报错但没有意义

用条件编译可以做到：只在微信小程序端展示这个按钮，其他端用替代方案
2. 样式与布局适配 (Rpx & Flex)
跨端最头疼的是屏幕尺寸。uni-app 官方推荐的方案是：
● rpx (responsive pixel)：它是微信小程序首创，uni-app 沿用的单位。它规定屏幕宽度恒为 750rpx。利用它，你可以实现等比例缩放。
● Flex 布局：这是跨端开发的标准答案。不论是 H5、小程序还是 App（尤其是 nvue/weex 模式），Flex 都能提供最一致的排版表现。
3. 运行环境判断 (运行时适配)
除了编译时处理，有时我们需要在代码运行过程中动态判断平台。
● uni.getSystemInfo()：获取系统信息（手机品牌、屏幕高度、系统版本等）。
● uni.getPlatform()（或 process.env.UNI_PLATFORM）：用于在代码中动态执行分支逻辑。
4. 平台特有功能与插件适配
● 原生子窗体 (subNVue)：在 App 端解决原生组件层级覆盖问题（如地图上的悬浮按钮）。
● API 差异处理：比如支付功能，微信小程序用 uni.requestPayment，App 可能需要配置特定的 Provider。
5. 常见环境名速记表 (面试常考)  
环境名	对应平台
VUE3	HBuilderX 3.0+ 且使用了 Vue3 时有效
H5	H5 浏览器
MP-WEIXIN	微信小程序
APP-PLUS	App (iOS 和 Android)
MP	所有小程序平台
面试官可能会追问：
“条件编译虽然好用，但如果代码中到处都是 #ifdef，维护起来很痛苦，你会怎么优化？”
你的进阶回答：
6. 函数封装：将平台差异逻辑封装在单独的 utils/platform.js 中，导出统一的接口，页面只管调用，不管平台。
7. 组件多态：创建同名组件，针对不同平台写不同的 .vue 文件，uni-app 编译时会自动按平台选择。
8. uniapp 封装组件
我们需要把“为什么要封装”和“怎么封装”讲得更有深度。
面试表达建议：
9. 混合媒体上传组件 (u-uploader)
背景： 官方 uni.chooseImage 只能选图片，uni.chooseVideo 只能选视频，无法在一个组件中同时支持两者。，但在实际业务（如：社交动态、工单反馈）中，用户需要在一个九宫格里同时选择或展示图片和视频。
核心实现逻辑：
• 统一入口：封装一个容器，通过 uni.showActionSheet 让用户选择“上传图片”还是“上传视频”。
• 差异化预览：
• 图片：直接使用 <image> 标签预览。
• 视频：使用 <video> 标签，或者为了性能考虑，在列表页使用视频封面图加“播放图标”覆盖。
• 上传流程：统一调用 uni.uploadFile，但需要根据文件类型判断是否需要设置不同的请求参数（如视频需要处理转码状态）。
• 内部状态管理：维护一个数组 fileList，每个对象包含 url、type (image/video) 和 status (loading/success/error)。
面试话术：
“我封装这个组件主要是为了解决交互统一性的问题。通过在组件内部处理 uni.chooseMedia 的兼容逻辑，父组件只需要通过 v-model 绑定一个数组即可实现图文视频混排预览，极大降低了页面的代码量。”

10. 全局水印组件 (Watermark)
背景：企业内部系统、敏感数据页面需要防止截图泄密，在页面上叠加用户专属水印。
核心实现逻辑：
• Canvas 生成图源：利用 uni.createCanvasContext 动态绘制文字（工号、姓名、日期），旋转 -30 度，然后通过 canvasToTempFilePath 导出为 Base64 图片。
• 背景平铺：将生成的图片设为容器的 background-image，并设置 background-repeat: repeat。
• 穿透点击：关键技术点在于设置 CSS 属性 pointer-events: none;，确保水印层浮在最上方但不影响下方按钮的点击操作。
• 防篡改（进阶知识点）：在 H5 端可以利用 MutationObserver 监听 DOM 节点，防止用户通过控制台删除水印节点（这能体现你考虑周全）。

3. 面试官可能会问：封装组件要注意什么？
作为新手，如果你能答出以下几点，会显得很有“灵性”：
4. 数据单向流：属性通过 props 传入，事件通过 $emit 传出。
5. 槽位 (Slot) 的灵活运用：比如上传组件的“上传按钮”样式，应该提供一个 slot 让父组件可以自定义，而不是写死。
6. 命名规范：遵循 Vue 官方建议，组件名采用大驼峰（如 MyUploader），使用时采用连字符（<my-uploader />）。
7. 性能优化：比如水印组件，如果页面很长，Canvas 只需要画一小块并平铺，而不是画一整张大图，避免内存溢出。
总结：你的回答模板
“在项目中，我发现官方的原生组件在处理复杂业务逻辑时（如多媒体混合上传）略显繁琐，且多个页面有数据保密的共性需求（如水印）。
因此我对这些功能进行了封装：
8. Uploader 组件：实现了图片视频同框预览和统一上传进度管理；
9. 水印组件：利用 Canvas 动态生成包含用户特征的背景图，并利用 CSS 的 pointer-events 属性解决了交互层级冲突。
这不仅提高了开发效率，也保证了 UI 风格的一致性。”
10. uniapp 封装方法
关于 uni-app 封装方法，面试时主要考察工具函数封装、API 封装、请求封装、公共方法抽离四个维度
11. 网络请求封装 (最重要的封装)
uni-app 自带的 uni.request 功能较为基础，实际项目中必须封装，以处理 Token 注入、请求拦截、响应拦截（如 401 自动跳转登录）等。
封装要点：
● 基础配置：提取 baseUrl、超时时间 timeout。
● 请求拦截器：自动在 Header 中加入 Authorization: Bearer token。
● 响应拦截器：统一处理业务状态码（例如：code: 200 为成功，403 权限不足，500 弹出错误提示）。
● Promise 化：让调用方可以使用 async/await。
面试话术：
“我参考了 Axios 的设计思路，利用 Promise 对 uni.request 进行了二次封装。通过设置请求拦截器自动挂载用户 Token，并在响应拦截器中对常见的错误码进行全局统一弹窗处理。这样在页面开发时，我只需要关心数据本身，而不需要重复写 uni.showToast 等逻辑。”
12. 公共工具类封装 (Utils)
针对高频使用的逻辑，封装成独立的 JS 文件。
● 时间格式化：封装一个 formatTime 方法，处理 YYYY-MM-DD HH:mm:ss。
● 节流/防抖 (Throttle/Debounce)：在搜索框输入、抢购按钮点击时必用，防止性能浪费或重复提交。
● 正则校验：封装手机号、身份证、邮箱的统一校验逻辑。
面试话术：
“我会建立一个 utils 目录。例如，针对频繁的点击事件，我会封装一个节流函数；针对金额显示，我会封装一个千分位格式化方法。通过 export 导出，在需要的地方按需引入，保证了逻辑的唯一性。”
13. 全局交互与 API 简化
为了让代码更简洁，可以将一些繁琐的 uni-app 原生 API 进行简化封装。
 示例：
第一段：封装 Toast 提示
export const msg = (title = '', icon = 'none') => {
    uni.showToast({ title, icon });
}

翻译：

封装了一个叫 msg 的方法，用于快速弹出提示框。

title：提示文字，默认为空字符串

icon：图标类型，默认为 'none'（无图标）

调用 msg('登录成功') 就相当于写 uni.showToast({ title: '登录成功', icon: 'none' })，省去每次写配置对象的麻烦。
第二段：封装确认弹窗（Modal）
export const confirm = (content, title = '提示') => {
    return new Promise((resolve) => {
        uni.showModal({
            title,
            content,
            success: (res) => { if (res.confirm) resolve(true) }
        });
    });
}

翻译：

封装了一个叫 confirm 的方法，用于弹出确认对话框，并用 Promise 的方式返回用户的选择结果。

content：弹窗内容（必填）

title：弹窗标题，默认为 '提示'

当用户点击「确定」时，resolve(true)；点击「取消」时，Promise 不会 resolve（即不会进入 .then）。

这样做的好处是可以用 await 来等待用户操作，代码更优雅。
面试话术：
“我也习惯封装一些 UI 交互方法。比如将 uni.showModal 封装成返回 Promise 的函数，这样在业务逻辑中可以用 if (await confirm('确定删除吗？')) 这种同步写法，避免了深层的回调地狱（Callback Hell）。”
4. 封装方法的挂载方式 (面试加分项)
面试官可能会追问：“你封装好方法后，在页面中是怎么使用的？”
● 局部引入：import { msg } from '@/utils/ui.js'（推荐：Tree-shaking 友好，逻辑清晰）。
● 全局挂载 (Vue2)：Vue.prototype.$msg = msg。
● 全局挂载 (Vue3)：app.config.globalProperties.$msg = msg。
 面试避坑指南
● 不要过度封装：如果一个功能只用一次，没必要封装。
● 保持纯粹性：封装的方法尽量不要直接操作 DOM 或强耦合某个页面数据，应当通过参数传入。
● 文档注释：提到你会写 JSDoc 注释（如 @param、@return），这能体现你是一个具备良好协作习惯的开发者。
5. Uni-app 分包策略
背景：微信小程序之所以需要分包，主要是为了解决小程序官方限制了主包体积和总体积的大小，如果应用体积超限，我们将不能发布到应用官方，最终会上不了线。整个小程序所有分包大小不能超过20M，单个分包/主包大小不能超过2M
 核心思路 
将代码划分成不同的包，打开一个包中的某个 页面，才加载这个包的代码。优化小程序首次启动的下载时间。
6. 核心数值（必须记牢）
面试官常会直接问具体的限制：
• 单包限制：主包或单个分包不能超过 2MB。
• 总包限制：整个小程序所有包合计不能超过 20MB。
• 特殊情况：如果你提到 静态资源（图片/视频） 过大，面试官可能会问怎么处理。
• 回答技巧：大资源建议放在 CDN（如阿里云 OSS、腾讯云 COS），不占包体积

7. 谈谈你对 uni-app 的理解


8. uni 支持的文件类型
9. uniapp 中封装接口请求相较于微信小程序有什么要注意的

10. uni-app 在非 h5 端上运行为什么要在架构上分为逻辑层和视图层？

11. 详细描述一下 Uniapp 的工作原理
12. 描述一下在 Uniapp 中如何实现跨平台开发
13. 在 Uniapp 中是否可以使用原生功能？如果可以，如何实现？
14. 在 Uniapp 中如何处理网络请求？
15. 描述一下在 Uniapp 中，组件和页面的区别
16. Uniapp 如何实现自定义组件？
17. 请列出 Uniapp 工程中有哪些可用的构建模式？

18. 描述一下 Uniapp 的几种布局方式
19. 如何在 Uniapp 中使用 vuex 来管理全局状态？
20. 在 Uniapp 中，如何使用原生 SDK 以及插件？
21. 描述一下在 Uniapp 中如何实现动态路由
22. 一句话总的形容 uniapp 与 vue 和微信小程序的区别
23. uni-app 跨端原理
24. 不同平台的 runtime 是怎么转义的？
25. uni-app 的编译器是如何特定编译的？

