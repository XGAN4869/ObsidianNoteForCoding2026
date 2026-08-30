# Promise `then` 中 `result.then(resolve, reject)` 的递归接力分析

> 本文结合 `路线/知识点/进阶/Promise手撕/思路.md` 中的源码截图，重点解释 P3、第二次 `then`、函数参数绑定和被忽略的 P4。

## 图里所说的“身份”是什么意思

这里的“身份”不是 JavaScript 术语，`result === P3` 也不是让你照着写的一行源码。

它只是想表达：**代码运行到这一刻，这个变量盒子里面实际装着什么值或什么函数。**

更直白地写应该是：

```text
result 变量里保存着 P3 对象
resolve 变量里保存着 resolveP2 函数
reject 变量里保存着 rejectP2 函数
```

为什么会这样，要从变量的来源看：

```js
return new Promise((resolve, reject) => {
  const result = callback(this.result)
})
```

这个 `new Promise(...)` 是第一次 `P1.then(...)` 创建的新 Promise，也就是 P2，所以 executor 接收到的两个参数实际是控制 P2 的函数：

```text
resolve 变量 ← P2 的成功函数 resolveP2
reject 变量  ← P2 的失败函数 rejectP2
```

而用户回调返回了内层 Promise P3：

```js
const result = callback(this.result)
```

所以：

```text
result 变量 ← 用户回调的返回值 P3
```

因此原代码：

```js
result.then(resolve, reject)
```

把三个变量中保存的真实内容代进去，就是：

```js
P3.then(resolveP2, rejectP2)
```

## 这个 function 是干嘛的

你的 `then(onFullFilled, onRejected)` 会读取旧 Promise 的状态和结果，执行用户传入的回调，再创建并返回一个新 Promise。

第一次执行 `P1.then(firstCallback)` 时：

- `this` 是 P1。
- `then` 创建的新 Promise 是 P2。
- P2 executor 中的 `resolve`、`reject` 应理解为 `resolveP2`、`rejectP2`。
- `firstCallback` 返回的内层 Promise 是 P3。

当源码执行：

```js
result.then(resolve, reject)
```

这一行的真实身份是：

```js
P3.then(resolveP2, rejectP2)
```

它会再次调用同一个 `then` 方法，但是调用者已经从 P1 变成 P3。

## 它接收什么数据

`then` 接收两个函数参数：

```js
then(onFullFilled, onRejected)
```

参数身份由位置决定：

| 调用位置 | 传入的函数 | `then` 内部形参 |
| --- | --- | --- |
| 第一个参数 | `resolveP2` | `onFullFilled` |
| 第二个参数 | `rejectP2` | `onRejected` |

所以：

```js
P3.then(resolveP2, rejectP2)
```

进入 `then` 后等价于：

```js
onFullFilled = resolveP2
onRejected = rejectP2
```

JavaScript 不要求第一个参数必须叫 `onFullFilled`。只要传入的是函数，第一个实参就会被第一个形参接住。

`resolveP2` 可以放在成功回调的位置，是因为它本身也是一个接收值的函数：

```text
onFullFilled(value) 需要接收成功值
resolveP2(value)     也接收一个值，并让 P2 成功
```

`rejectP2` 同理：

```text
onRejected(reason) 需要接收失败原因
rejectP2(reason)    也接收一个原因，并让 P2 失败
```

## 它返回什么结果

每次调用 `then` 都会返回一个新的 Promise：

```text
P1.then(firstCallback)           → 返回 P2
P3.then(resolveP2, rejectP2)     → 返回 P4
P2.then(secondCallback)          → 还会返回另一个 Promise
```

主流程只关心 P1、P2、P3，所以 P4 没有被变量接住，但它确实被创建了。

成功分支中，`resolveP2(20)` 通常返回 `undefined`，因此第二次 `then` 的内部流程还会使用 `undefined` 解决 P4：

```text
resolveP2(20)
   ↓ 返回 undefined
第二次 then 的 result = undefined
   ↓
resolveP4(undefined)
```

P4 不影响 P2，因为代码没有使用 P4。

## 它中间做了哪几步

### 第一步：第一次进入 `then`

```js
P1.then(firstCallback)
```

此时：

```text
this = P1
onFullFilled = firstCallback
新建 Promise = P2
resolve = resolveP2
reject = rejectP2
```

### 第二步：执行 P1 的成功回调

```js
const result = callback(this.result)
```

身份展开：

```js
const result = firstCallback(P1.result)
const result = firstCallback(10)
```

你的 `firstCallback` 返回内层 Promise，所以：

```text
result = P3
```

### 第三步：再次调用同一个 `then`

```js
result.then(resolve, reject)
```

身份展开：

```js
P3.then(resolveP2, rejectP2)
```

这一步可以理解为“再入”或“嵌套调用”。它调用了同一个 `then` 方法，但不是同步无限递归：P3 此时是 `pending`，第二次 `then` 会先保存回调，然后结束当前同步执行。

### 第四步：第二次进入 `then`

第二次进入时：

```text
this = P3
onFullFilled = resolveP2
onRejected = rejectP2
新建 Promise = P4
```

P3 仍然是 `pending`，所以把将来要执行的操作保存进 P3.callbacks。

### 第五步：P3 一秒后成功

```js
resolveP3(value * 2)
resolveP3(20)
```

P3 变成：

```text
P3.state = fulfilled
P3.result = 20
```

然后 P3 执行保存的成功处理函数。

### 第六步：成功回调实际就是 `resolveP2`

第二次 `then` 中会执行：

```js
handle(onFullFilled)
```

但此时：

```js
onFullFilled === resolveP2
```

所以 `handle` 中的：

```js
const result = callback(this.result)
```

真实展开为：

```js
const result = resolveP2(P3.result)
const result = resolveP2(20)
```

于是 P2 成功，结果为 20。

### 第七步：P2 执行已经保存的第二个回调

P2 成功后，之前通过第二个 `.then()` 保存的打印回调开始执行：

```js
secondCallback(P2.result)
secondCallback(20)
```

最终打印：

```text
20
```

## 小白应该怎么模仿

遇到函数作为参数传递时，不要只看函数名字，固定做三次改名：

1. 先标记这个函数原本属于谁，例如 `resolveP2`。
2. 再看它被传到第几个参数位置。
3. 最后进入函数体，把形参替换成真实函数名。

本例固定展开：

```text
P3.then(resolveP2, rejectP2)
        ↓ 第一个参数       ↓ 第二个参数
onFullFilled = resolveP2   onRejected = rejectP2
        ↓
callback = resolveP2
        ↓
callback(P3.result) = resolveP2(20)
```

## 示例代码

示例代码仅供参考，需要你手动复制到项目中。

下面只用于展示函数身份，不代表让你替换当前源码：

```js
// P3.then 的两个参数只是普通函数
P3.then(
  value => resolveP2(value),
  reason => rejectP2(reason)
)

// 上面可以缩写成：
P3.then(resolveP2, rejectP2)
```

两种写法的核心效果相同，因为 `then` 会在成功时把值传给第一个函数，在失败时把原因传给第二个函数。

## 举一反三

这和数组把函数作为参数传给 `forEach` 是同一种 JavaScript 能力：

```js
function printValue(value) {
  console.log(value)
}

[10, 20].forEach(printValue)
```

`forEach` 的形参可能叫 `callback`，传进去的真实函数叫 `printValue`。进入 `forEach` 后，`callback` 指向的就是 `printValue`。

Promise 中也是一样：

```text
then 的形参叫 onFullFilled
传入的真实函数叫 resolveP2
进入 then 后，onFullFilled 指向 resolveP2
```

## 一句话总结

`resolveP2` 和 `rejectP2` 没有变成另一种方法，它们只是作为普通函数按位置传入 P3 的 `then`；P3 完成后，`then` 再调用这两个函数，从而把 P3 的状态和结果接力给 P2。
