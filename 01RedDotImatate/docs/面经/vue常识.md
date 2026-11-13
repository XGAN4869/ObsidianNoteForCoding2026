## watch
（一般是 watch 监听 active/enabled 变化），watch 回调本身**不能是 async 函数**（Vue watch 不推荐 async 回调，容易时序问题）。

> 等价于：启动加载，但是我不在这里 await 它、不在这里处理它的成功 / 失败；成功失败交给 composable 内部自己管理状态（loading/error），模板去读状态渲染。