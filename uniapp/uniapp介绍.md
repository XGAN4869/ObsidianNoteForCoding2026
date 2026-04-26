## 什么是 uniapp
#weex原生渲染 
	- Weex 是通过编译工具，把前端的 HTML、CSS 和 JavaScript 代码转成各平台原生代码
		- 像 iOS 的 Objective - C 或 Swift 代码、Android 的 Java 或 Kotlin 代码。运行时，Weex 框架在原生环境里解析渲染指令，将数据渲染成原生组件，实现跨平台渲染。
	- 但Weex 主要用于局部的渲染优化，更多的还是使用uni-app 内置的 api，各取所长
#组件，api与微信小程序大部分一致 
	uni - APP ≈ Vue 3 语法基础 + 微信小程序api + 多平台适配及扩展功能
#开放生态，组件丰富
![[123.jpg]]
	- uni 内置组件 和 api (满足基本的开发需求，组件、api命名规范与微信小程序基本相同)
	- uni 扩展组件(基于👆内置组件的二次封装) 和 mpvue 兼容组件
	- 微信小程序自定义组件 及 SDK（库的集合，内含示例代码，操作文件
	- npm 第三方包
	- APP端支持和原生混合编码
	- DCloud 将发布插件市场
## 666