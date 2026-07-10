
> 这份笔记把原来散落在评论里的 `MyPromise` 代码整理成一份完整版本，并用“状态归属 + 触发链路 + 数据回流”的方式来分析。虽然它不是 Vue 组件通信，但可以套用同一套思路：先找谁持有状态，再看谁触发方法、数据传给谁、最后结果怎么回流。

> [!tip] 配套流程图
> [[Promise 手撕流程与思路.canvas|打开 Promise 手撕流程与思路 Canvas]]
> [[Promise 手撕流程与思路.svg|打开 Promise 手撕流程 SVG]]

## 1. 这份代码要解决什么

手写 Promise 的核心不是背 API，而是把异步任务的结果保存起来，并且让后面注册的 `then / catch` 可以按顺序拿到结果。

一句话理解：

> `MyPromise` 持有异步状态，`executor` 决定成功或失败，`then` 注册后续动作，每次 `then` 都返回一个新的 Promise 来承接链式调用。

它主要实现了这些能力：

- 三种状态：`pending`、`fulfilled`、`rejected`
- 构造函数接收 `executor(resolve, reject)`
- `then(onFulfilled, onRejected)` 支持链式调用
- `catch(onRejected)` 本质上是 `then(null, onRejected)`
- `MyPromise.resolve(value)` 和 `MyPromise.reject(reason)`
- 值穿透：`.then().then()` 不会丢值
- 错误穿透：没有写失败回调时，错误会继续往后传
- Promise A+ 风格的返回值解析：如果 `then` 回调返回另一个 Promise 或 thenable，要等待它最终完成

## 2. 完整带注释代码

```js
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
  #state = PENDING;
  #value = undefined;
  #fulfilledQueue = [];
  #rejectedQueue = [];

  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  #runMicroTask(fn) {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(fn);
    } else {
      setTimeout(fn, 0);
    }
  }

  #transition(state, result, queue) {
    if (this.#state !== PENDING) return;

    this.#state = state;
    this.#value = result;

    if (queue.length > 0) {
      this.#runMicroTask(() => {
        queue.forEach((fn) => fn());
      });
    }
  }

  constructor(executor) {
    const resolve = (data) => {
      this.#transition(FULFILLED, data, this.#fulfilledQueue);
    };

    const reject = (reason) => {
      this.#transition(REJECTED, reason, this.#rejectedQueue);
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    const resolveHandler =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;

    const rejectHandler =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };

    const nextPromise = new MyPromise((resolve, reject) => {
      const resolvePromise = (targetPromise, x, res, rej) => {
        if (x === targetPromise) {
          return rej(new TypeError("Chaining cycle detected for promise"));
        }

        const isObjectOrFunction =
          x !== null && (typeof x === "object" || typeof x === "function");

        if (!isObjectOrFunction) {
          return res(x);
        }

        let called = false;

        try {
          const then = x.then;

          if (typeof then !== "function") {
            return res(x);
          }

          then.call(
            x,
            (y) => {
              if (called) return;
              called = true;
              resolvePromise(targetPromise, y, res, rej);
            },
            (reason) => {
              if (called) return;
              called = true;
              rej(reason);
            },
          );
        } catch (error) {
          if (called) return;
          called = true;
          rej(error);
        }
      };

      const handleFulfilled = () => {
        this.#runMicroTask(() => {
          try {
            const result = resolveHandler(this.#value);
            resolvePromise(nextPromise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };

      const handleRejected = () => {
        this.#runMicroTask(() => {
          try {
            const result = rejectHandler(this.#value);
            resolvePromise(nextPromise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };

      if (this.#state === FULFILLED) {
        handleFulfilled();
      } else if (this.#state === REJECTED) {
        handleRejected();
      } else {
        this.#fulfilledQueue.push(handleFulfilled);
        this.#rejectedQueue.push(handleRejected);
      }
    });

    return nextPromise;
  }
}
```

## 3. 测试用例

```js
// 1. 基础异步
const p1 = new MyPromise((resolve) => {
  setTimeout(() => resolve(1), 1000);
});

p1.then((value) => {
  console.log("p1:", value); // 1 秒后输出 1
});

// 2. 链式调用
p1
  .then((value) => value * 2)
  .then((value) => {
    console.log("链式:", value); // 2
  });

// 3. then 回调返回新的 Promise
p1
  .then((value) => {
    return new MyPromise((resolve) => {
      setTimeout(() => resolve(value * 3), 1000);
    });
  })
  .then((value) => {
    console.log("返回 Promise:", value); // 3
  });

// 4. 错误处理
const p2 = new MyPromise((_, reject) => {
  reject("出错啦");
});

p2
  .catch((error) => {
    console.log("捕获:", error); // 出错啦
    return "恢复";
  })
  .then((value) => {
    console.log("恢复后:", value); // 恢复
  });

// 5. 值穿透
MyPromise.resolve(42)
  .then()
  .then()
  .then((value) => {
    console.log("穿透:", value); // 42
  });

// 6. 错误穿透
MyPromise.reject("失败")
  .then((value) => {
    console.log(value);
  })
  .catch((error) => {
    console.log("错误穿透:", error); // 失败
  });

// 7. 防止循环引用
const p3 = MyPromise.resolve(1);
const p4 = p3.then(() => p4);

p4.catch((error) => {
  console.log(error instanceof TypeError); // true
});
```

## 4. 按“组件通信链路”的思路分析

这份代码不是 Vue 组件，但可以把它当成一个小系统来拆。

| 节点 | 类比成组件分层 | 主要职责 | 持有状态 | 接收什么 | 发出什么 |
| --- | --- | --- | --- | --- | --- |
| `MyPromise` 实例 | 容器组件 | 保存异步任务状态，管理成功/失败队列 | `#state`、`#value`、两个回调队列 | `executor` 的执行结果 | 下一个 Promise 的状态变化 |
| `executor` | 外部业务动作 | 决定这次任务成功还是失败 | 不长期持有 | `resolve`、`reject` | 成功值或失败原因 |
| `resolve / reject` | 动作入口 | 把外部结果写回 Promise | 不持有 | 成功值、失败原因 | 调用 `#transition` |
| `#transition` | 状态更新器 | 修改状态并触发队列 | 更新 `#state`、`#value` | 目标状态、结果、队列 | 执行已注册回调 |
| `then` | 链路注册器 | 注册成功/失败处理，并返回新 Promise | 新建 `nextPromise` | 成功回调、失败回调 | 新的 Promise |
| `resolvePromise` | 回流解析器 | 解析 then 回调返回值 | 不持有 | 普通值、Promise、thenable | 决定 `nextPromise` 成功或失败 |
| `catch` | 失败链路快捷入口 | 只注册失败处理 | 不持有 | 失败回调 | 等价于 `then(null, onRejected)` |

## 5. 状态归属

| 状态 | 真实持有者 | 为什么归它持有 |
| --- | --- | --- |
| 当前 Promise 的状态 | 当前 `MyPromise` 实例 | 每个 Promise 都只能从 `pending` 变成成功或失败一次 |
| 当前 Promise 的结果值 | 当前 `MyPromise` 实例 | 成功值或失败原因要留给后续 `then / catch` 使用 |
| 成功回调队列 | 当前 `MyPromise` 实例 | 异步完成前，成功处理函数需要暂存 |
| 失败回调队列 | 当前 `MyPromise` 实例 | 异步完成前，失败处理函数需要暂存 |
| 链式调用的下一步状态 | `nextPromise` | 每次 `then` 都必须返回一个新的 Promise，不能复用旧 Promise |

关键点：

> 老 Promise 只负责保存自己的结果；新 Promise 负责承接 `then` 回调之后的结果。

所以 `then` 一定要返回 `nextPromise`。如果直接返回 `this`，链式调用里的每一步就没有独立状态了。

## 6. 关键链路表

| 场景 | 状态被谁持有 | 方法被谁触发 | 数据传给谁 | 改完怎么回流 |
| --- | --- | --- | --- | --- |
| 创建 Promise | `MyPromise` 实例 | `new MyPromise(executor)` | `executor` 拿到 `resolve / reject` | `resolve / reject` 写回当前实例 |
| 异步成功 | 当前 Promise | 异步任务调用 `resolve(value)` | `value` 传给 `#transition` | 状态变成 `fulfilled`，执行成功队列 |
| 异步失败 | 当前 Promise | 异步任务调用 `reject(reason)` | `reason` 传给 `#transition` | 状态变成 `rejected`，执行失败队列 |
| pending 时调用 then | 当前 Promise | 用户调用 `.then()` | 成功/失败处理函数进入队列 | 等 Promise 完成后再执行 |
| fulfilled 后调用 then | 当前 Promise | 用户调用 `.then()` | 当前 `#value` 传给成功处理函数 | 返回值决定 `nextPromise` 的状态 |
| rejected 后调用 then | 当前 Promise | 用户调用 `.then()` | 当前 `#value` 传给失败处理函数 | 返回值或异常决定 `nextPromise` 的状态 |
| then 返回普通值 | `nextPromise` | `resolvePromise` 解析 | 普通值传给 `resolve` | `nextPromise` 成功 |
| then 抛出错误 | `nextPromise` | `try...catch` 捕获 | 错误传给 `reject` | `nextPromise` 失败 |
| then 返回 Promise | 返回的 Promise 先持有结果 | `resolvePromise` 调用它的 `then` | 等它最终成功或失败 | 再回流到 `nextPromise` |

## 7. 传递内容判断

借用组件通信的判断方式，这份代码里主要传了三类东西。

| 传递内容 | 对应代码 | 类比通信方式 | 解释 |
| --- | --- | --- | --- |
| 值 | `resolve(value)`、`reject(reason)` | 传 `props` | 外部把结果交给 Promise |
| 动作 | `onFulfilled`、`onRejected` | 传 `emit` 的处理函数 | 用户把后续要做什么注册进去 |
| 控制权 | `then.call(x, resolve, reject)` | 类似把控制权交给 thenable | 如果返回值是 thenable，就尊重它自己的完成逻辑 |

这里没有 Vue 的 `store / provide / inject / slot`，因为状态没有跨模块共享，也不需要父级控制子级渲染。真实状态都被封装在每个 `MyPromise` 实例内部，这是这份代码最重要的边界。

## 8. then 为什么要这么绕

`then` 不是简单地执行回调，它要做三件事：

1. 标准化回调：没传成功回调就原样返回值，没传失败回调就继续抛错。
2. 返回新 Promise：让链式调用每一步都有独立状态。
3. 解析回调结果：普通值直接成功，Promise/thenable 要继续等待，异常要变成失败。

也就是这条链：

```txt
旧 Promise 完成
  -> 执行 then 注册的回调
  -> 得到 result
  -> resolvePromise 解析 result
  -> 决定 nextPromise 成功或失败
  -> 下一个 then 继续执行
```

## 9. resolvePromise 是整份代码的难点

`resolvePromise(targetPromise, x, res, rej)` 的职责是：

- 如果 `x` 和 `targetPromise` 是同一个，说明出现循环引用，直接失败
- 如果 `x` 不是对象也不是函数，说明它是普通值，直接成功
- 如果 `x` 是对象或函数，就尝试读取它的 `then`
- 如果 `then` 不是函数，也当普通值处理
- 如果 `then` 是函数，就把 `x` 当成 thenable，调用它的 `then`
- 用 `called` 防止同一个 thenable 同时多次调用成功和失败
- 如果过程中抛错，且之前还没成功/失败，就让新 Promise 失败

最重要的防线是这两句：

```js
if (x === targetPromise) {
  return rej(new TypeError("Chaining cycle detected for promise"));
}
```

它防止这样的死循环：

```js
const p = MyPromise.resolve(1);
const next = p.then(() => next);
```

如果不拦截，`next` 会一直等待自己完成，永远没有出口。

## 10. 这份实现和原生 Promise 的差距

这份代码适合用来理解 Promise A+ 的核心链路，但它还不是完整原生 Promise。

主要差距：

- 原生 Promise 的任务调度属于真正的微任务，这里用 `queueMicrotask`，没有时退化为 `setTimeout`
- `finally`、`all`、`race`、`allSettled`、`any` 等静态方法还没实现
- `Promise.resolve` 对 thenable 的吸收可以继续增强
- 原生 Promise 还有更多规范边界，例如跨 realm、宿主环境调度、错误追踪等

面试或复习时不用一开始追求完全复刻原生 Promise，先把这四条讲清楚就够有杀伤力：

1. 状态只能改变一次。
2. `then` 必须返回新 Promise。
3. 回调返回值要经过 Promise Resolution Procedure。
4. 成功、失败、异常都要能继续往后传。

## 11. 仿写框架

以后再手写 Promise，可以按这个顺序写。

```txt
1. 定义三种状态
2. 创建 MyPromise 类
3. 在实例上保存 state、value、fulfilledQueue、rejectedQueue
4. constructor 接收 executor
5. 在 constructor 内定义 resolve / reject
6. resolve / reject 调用 transition
7. transition 只允许 pending 改一次状态
8. then 标准化 onFulfilled / onRejected
9. then 返回 nextPromise
10. pending 时把处理函数放进队列
11. fulfilled / rejected 时异步执行对应处理函数
12. 写 resolvePromise 解析 then 回调返回值
13. catch 复用 then
14. static resolve / reject 复用 constructor
15. 最后补测试：异步、链式、返回 Promise、错误、穿透、循环引用
```

## 12. 复述版

如果要用自己的话讲这段代码，可以这么说：

> 我这个 `MyPromise` 的核心是把异步结果变成一个可追踪的状态机。实例内部持有 `state`、`value` 和两个回调队列。创建时执行 `executor`，外部任务通过 `resolve` 或 `reject` 把结果回流到当前 Promise。调用 `then` 时不会直接复用当前 Promise，而是创建一个 `nextPromise`，让链式调用的下一步有自己的状态。`then` 回调的返回值会交给 `resolvePromise` 统一解析：普通值直接成功，Promise 或 thenable 就等待它完成，抛错就让 `nextPromise` 失败。这样成功、失败、值穿透、错误穿透和链式调用都能串起来。
