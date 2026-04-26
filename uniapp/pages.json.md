- pages 数组（路由表 + 全局页面配置）
	- 是页面注册表/路由,每个对象都表示一个页面路由
	- `style` 是页面窗口配置，`globalStyle` 全局窗口配置
	- uniapp 启动后会先读取pages
	- ```js
{
"pages": [ //pages数组中第一项表示应用启动页，参考：https://uniapp.dcloud.io/collocation/pages
	{
		"path": "pages/index/index",
		"style": {
			"navigationBarTitleText": "首页",
			"app-plus": {
				"titleNView":{
					"buttons":[
						{"text":"123","float": "left"},							{"text":"\ue86e","fontSrc":"/static/iconfont.ttf"}
					],
					"searchInput":{
						"autoFocus":"true",
						"backgroundColor":"#f76",
						"borderRadius":"12px",
						"placeholder":"搜索内容"
					}
				}
			}
		}
	}
],
"globalStyle": {
	"navigationBarTextStyle": "black",
	"navigationBarTitleText": "uni-app",
	"navigationBarBackgroundColor": "#F8F8F8",
	"backgroundColor": "#F8F8F8"
},
"uniIdRouter": {}
}


	  ```