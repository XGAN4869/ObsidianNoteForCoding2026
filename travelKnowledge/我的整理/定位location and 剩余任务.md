剩余任务：

早：
🚗 定位 location 逻辑
- Promise 封装自己封一个，参考代码--function callUniApi(methodName, options = {}) 
⚪提问：是不是只要遇到 uni.xxx 这种有 success 和 fail 的回调，就可以打包成 Promise 使用，代码更简洁？
- manifest.json: 应用配置层的扩展，声明 who/permission/how to run/ ComparedTo other File， 是配置业务逻辑的
- P.S. uniapp 官方文档的东西不全面（最好看 wx 官方文档
⚪提问：缓存生命周期？ 是否存在
授权状态永久保存在本地，直到用户删除小程序缓存 / 卸载小程序，才会重置回 undefined（重新走首次授权流程）。
午
⭐补充区分两个容易混淆的权限层级
小程序 scope.userLocation（微信内授权）：getSetting 读取到的状态，控制小程序能不能申请定位；
手机系统定位权限：微信 APP 本身有没有开启 GPS 定位，scope.userLocation:true 也可能因为系统关闭 GPS 导致定位失败，authSetting 无法检测系统开关。

- locationReporter 和 locationRun 还没看

🚗 临时工
- tempAccess.js

- 6.26下午岗位配置单选
- role逻辑

- 6.26下午我的 页面我的单据和我的考勤权限

- 6.27早上我的 页面无法下拉（现在弄）
- 6.27临时工

- login
- 客诉/岗位 web-uniapp
- 具体的比较重要的功能（如图片上传）
- 定位这一块的逻辑咱可以打包一下存个档（看置顶豆包




- 登录页面弹窗--不要请先登录