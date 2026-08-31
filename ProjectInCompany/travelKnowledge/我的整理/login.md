login.vue
```js
// 假设这段代码在一个 async 函数内部
try {
    // 1. await 会暂停当前函数的执行，等待 accountStore.login() 返回的 Promise 结果
    await accountStore.login({ ...formData }).catch((error) => {
        // 2. 如果 login() 失败，这个 .catch() 会被触发
        console.log('捕获到登录错误:', error); 
        
        // 3. 关键点：这里没有 return 一个成功的值，而是重新抛出了一个被拒绝的 Promise
        return Promise.reject(error); 
    });

    // 4. 只有当上面的 await 表达式成功完成（即得到一个非 rejected 的值），才会执行到这里
    MessagePlugin.success('登录成功');
    const redirect = route.query.redirect;
    // ... 页面跳转逻辑
} catch (e) {
    // 5. 如果 .catch() 里的 Promise.reject(error) 被执行，这里的 catch 就会捕获到这个错误
    console.error('登录流程最终失败:', e);
}

```
- FIXME: 去看 Promise 源码