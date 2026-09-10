# 02 JavaScript 异步与事件循环

## 1. 为什么需要异步

读磁盘、访问数据库、请求网络都可能花时间。如果 Node 在等待时完全停住，服务器就不能处理其他请求。Node 通常把等待交给操作系统或 libuv，任务完成后再执行回调。

“异步”不等于“同时执行所有 JavaScript”。同一时刻，JavaScript 主线程仍然一次执行一段代码；长时间的 CPU 计算仍会阻塞请求。

## 2. 回调、Promise、async/await

回调是“完成后要调用的函数”：

```js
setTimeout(() => console.log('两秒后'), 2000)
console.log('先打印')
```

Promise 表示“未来会成功或失败的结果”：

```js
const result = new Promise((resolve) => {
  setTimeout(() => resolve('完成'), 100)
})

result.then(value => console.log(value))
  .catch(error => console.error(error))
```

`async/await` 是更容易阅读的 Promise 写法：

```js
async function main() {
  try {
    const value = await result
    console.log(value)
  } catch (error) {
    console.error('失败：', error.message)
  }
}
main()
```

注意：`await` 只能在 `async` 函数内，或支持顶层 await 的 ES 模块中使用。

## 3. 顺序执行和并行等待

如果第二步必须等第一步的结果，顺序写：

```js
const user = await loadUser()
const orders = await loadOrders(user.id)
```

如果两件事互不依赖，可以同时开始，再一起等待：

```js
const [users, products] = await Promise.all([
  loadUsers(),
  loadProducts()
])
```

`Promise.all` 中任意一个 Promise 失败，整体就失败。需要“一个失败也不影响其他结果”时，使用 `Promise.allSettled` 并检查每项的 `status`。

## 4. 事件循环的直观顺序

下面代码中，同步输出先发生；Promise 的微任务通常在进入下一个事件循环阶段前执行；定时器回调稍后执行：

```js
console.log('A')
setTimeout(() => console.log('D'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('B')
```

常见输出是 `A`、`B`、`C`、`D`。不要把这个规律扩大成“所有异步都一定按同样顺序”；文件、网络和不同 Node 版本的调度细节应以实际 API 语义为准。

## 5. 常见异步错误

- 忘记 `await`：打印出 Promise，而不是结果。
- 忘记 `return`：调用方无法等待内部 Promise。
- 空的 `catch`：错误被吞掉，问题更难查。
- 在循环中无限并发：同时发出太多请求，导致限流或内存上涨。

有数量限制时，先分批处理，或使用经过验证的并发控制库，不要自己复制不完整的实现。

## 6. 动手题

1. 让两个 `setTimeout` 分别等待 100ms 和 10ms，预测输出。
2. 把一个回调式函数改成返回 Promise 的函数。
3. 写三个异步任务，用 `Promise.all` 同时等待，并故意让一个任务失败，观察结果。

## 检查清单

- [ ] 我知道 `async` 函数总是返回 Promise。
- [ ] 我会用 `try/catch` 包住 `await`。
- [ ] 我能区分“必须顺序”和“可以并行”的任务。
- [ ] 我知道 CPU 密集代码仍会阻塞事件循环。
