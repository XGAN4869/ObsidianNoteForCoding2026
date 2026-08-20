# Vue 3 渲染机制：从模板编译到响应式更新

> [!info] 本篇范围
> 本文以本地 Vue 源码仓库 `C:\Project\vue源码\core` 的 `v3.5.40`（提交 `fa2885d8c`）为主要依据，解释浏览器端 Vue 3 的运行时渲染链路。源码会持续变化，阅读时应以当前仓库版本为准。
>
> 本篇讨论的是 **DOM 渲染器**。SSR、Hydration、`<Suspense>`、`<Teleport>`、异步组件和自定义渲染器会在对应章节说明边界，但不展开全部实现。

## 学习目标

- 能说清 Vue 3 中“模板 → 编译产物 → VNode → 组件渲染副作用 → patch → 宿主 DOM”的完整链路。
- 能从 `createApp()` 追到 `renderer.render()`、`patch()` 和 `setupRenderEffect()`。
- 能解释响应式数据变化后，为什么是 `ReactiveEffect` 触发调度器，而不是直接同步修改 DOM。
- 能区分编译器优化（`patchFlag`、`dynamicChildren`、静态提升）与运行时 Diff。
- 能使用源码文件定位某个渲染阶段，而不是只背一张生命周期图。

#234
## 一、先记住一条主线

```text
SFC / template
    ↓  构建阶段编译（或运行时 compiler build 编译）
render 函数
    ↓  执行 render
VNode / Block
    ↓  组件渲染副作用 ReactiveEffect
patch(prevVNode, nextVNode)
    ↓  runtime-core 调用 host 操作
真实 DOM

响应式状态变化
    ↓
ReactiveEffect.trigger()
    ↓
effect.scheduler() → queueJob()
    ↓
Promise 微任务 flushJobs()
    ↓
组件更新函数再次 render → patch → updated 后置回调
```

> [!tip] 一句话
> Vue 3 不是“数据变化后直接改 DOM”，而是让组件的渲染函数成为一个响应式副作用：首次执行时建立依赖，依赖变化时调度这个副作用重新执行，再由 `patch` 把新旧 VNode 的差异应用到宿主环境。

## 二、三个层次不要混在一起

| 层次                  | 主要职责                              | 本地源码入口                                                                           |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| 编译器（compiler）       | 把模板转换成 JavaScript 渲染代码，并标记静态/动态信息 | `packages/compiler-core/src/compile.ts`、`transform.ts`、`codegen.ts`              |
| 运行时核心（runtime-core） | 组件实例、VNode、响应式渲染副作用、patch、调度器     | `packages/runtime-core/src/renderer.ts`、`component.ts`、`scheduler.ts`、`vnode.ts` |
| 宿主运行时（runtime-dom）  | 提供浏览器 DOM 的创建、插入、删除、属性更新等操作       | `packages/runtime-dom/src/index.ts`、`nodeOps.ts`、`modules/`                      |

> [!warning] 编译期 ≠ 运行时
> 使用 `.vue` 单文件组件时，模板通常由构建工具在构建阶段编译；浏览器拿到的组件一般已经带有 `render` 函数。只有使用包含 compiler 的构建，或显式使用运行时模板编译时，浏览器才会在运行阶段执行模板编译。

## 三、从 `createApp()` 到第一次渲染

### 1. `runtime-dom` 创建 DOM 渲染器

`runtime-dom/src/index.ts` 将浏览器相关的 `nodeOps` 和 `patchProp` 合并为 renderer options，然后懒创建 `runtime-core` 的 renderer：

```ts
// 源码心智模型，非原文件完整摘录
const rendererOptions = extend({ patchProp }, nodeOps)

function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}

export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)
  return app
}
```

这体现了 Vue 3 的“平台无关核心”设计：`runtime-core` 不直接写死 `document.createElement`，而是由 `runtime-dom` 注入宿主操作；换成 Canvas、原生移动端或测试环境时，可以提供另一套 renderer options。

**源码定位：**

- `C:\Project\vue源码\core\packages\runtime-dom\src\index.ts:72-85`
- `C:\Project\vue源码\core\packages\runtime-dom\src\index.ts:104-123`
- `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:318-350`

### 2. `createAppAPI()` 返回应用实例

`runtime-core/src/apiCreateApp.ts` 中的 `createAppAPI(render, hydrate)` 会创建应用对象。调用 `app.mount(container)` 时，核心动作可以抽象为：

```ts
const vnode = createVNode(rootComponent, rootProps)
vnode.appContext = context
render(vnode, container)
```

真实源码还会处理插件、应用上下文、容器规范化、开发期检查、卸载等逻辑；上面只保留“应用进入渲染器”的主线。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\apiCreateApp.ts:253-390`

### 3. `render()` 把根 VNode 交给 `patch()`

`createRenderer()` 内部的 `render(vnode, container)` 会读取容器上一次的 `container._vnode`：

```ts
if (vnode == null) {
  if (container._vnode) unmount(container._vnode)
} else {
  patch(container._vnode || null, vnode, container)
}
container._vnode = vnode
```

第一次挂载时旧节点是 `null`；之后更新根 VNode 时，旧节点来自 `container._vnode`。这也是“首次挂载”和“后续更新”共用同一个 `patch` 入口的原因。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:2418-2444`

## 四、组件挂载：实例、setup 和 render

### 1. `processComponent()` 选择挂载还是更新

`patch()` 根据 VNode 的 `type` 和 `shapeFlag` 分流：文本、注释、静态节点、Fragment、Element、Component、Teleport、Suspense 等各有处理函数。组件分支进入 `processComponent()`：

```text
patch(null, componentVNode)
    ↓
processComponent(n1 = null, n2)
    ↓
mountComponent()
```

有旧组件 VNode 时，则进入 `updateComponent()`；它会判断 `shouldUpdateComponent()`，如果确实需要更新，就调用该组件已有的 `instance.update()`。

**源码定位：** `renderer.ts:406-470`、`renderer.ts:1165-1200`、`renderer.ts:1282-1310`

### 2. `mountComponent()` 创建组件实例并执行 `setupComponent()`

首次挂载组件时，源码会：

1. 调用 `createComponentInstance()` 创建内部实例。
2. 调用 `setupComponent()` 初始化 props、slots 和有状态组件的 `setup()`。
3. 处理同步 `setup()`、异步 `setup()`、`<Suspense>` 和兼容模式分支。
4. 最终调用 `setupRenderEffect()` 建立渲染副作用。

`setupComponent()` 的关键关系是：

```text
setupComponent(instance)
  ├─ initProps(instance, vnode.props)
  ├─ initSlots(instance, vnode.children)
  └─ setupStatefulComponent(instance)
       ├─ 创建 public render proxy
       ├─ 调用 setup(props, setupContext)
       └─ handleSetupResult() / finishComponentSetup()
```

**源码定位：**

- `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:1202-1273`
- `C:\Project\vue源码\core\packages\runtime-core\src\component.ts:809-927`
- `C:\Project\vue源码\core\packages\runtime-core\src\component.ts:929-965`

### 3. `finishComponentSetup()` 确定组件的 render 函数

组件最终必须有一个可以返回 VNode 的 `instance.render`。来源主要有三类：

| 来源 | 发生的事情 |
|---|---|
| `setup()` 返回函数 | 该函数被当作组件 render 函数 |
| 编译工具生成的 `Component.render` | 直接使用构建产物 |
| 运行时 compiler 构建 + `Component.template` | 调用 `compile(template, options)` 生成 render |

Vue 源码在 `finishComponentSetup()` 中明确区分了 runtime-only 与包含 compiler 的构建：如果当前构建没有 `compile`，而组件只有 `template`，开发环境会给出提示。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\component.ts:1000-1094`

## 五、模板编译：Parse → Transform → Codegen

### 1. `baseCompile()` 的三步

`compiler-core/src/compile.ts` 的 `baseCompile()` 可以概括为：

```ts
const ast = isString(source) ? baseParse(source, options) : source
transform(ast, resolvedOptions)
return generate(ast, resolvedOptions)
```

这不是“使用一个正则替换 HTML”这么简单，而是解析器、转换插件和代码生成器协同完成的编译流程。

### 2. Parse：模板字符串变成 AST

`baseParse()` 读取模板中的元素、属性、指令、插值、文本和注释，构建 AST。AST 仍是编译器内部的数据结构，不是 VNode，也不是 DOM。

### 3. Transform：补充语义并准备优化信息

`transform()` 会遍历 AST，执行一组 node transform 与 directive transform，并为根节点准备 codegen 信息。Vue 3 的编译器还会识别哪些节点是静态的、哪些节点是动态的，以及哪些子节点属于同一个 block。

### 4. Codegen：AST 生成 render 代码

`generate()` 根据 AST 生成 JavaScript 代码字符串和辅助函数引用。编译后的代码常见形态类似：

```js
// 仅为理解结构的示意，不代表某个模板的完整实际输出
import { openBlock, createElementBlock, toDisplayString } from 'vue'

function render(_ctx, _cache) {
  return (
    openBlock(),
    createElementBlock('div', null, toDisplayString(_ctx.count), 1)
  )
}
```

其中 `1` 是示意性的 patch flag；实际值由编译器根据模板生成。不要把编译产物中的 helper 调用误认为组件运行时每次都重新解析模板。

**源码定位：**

- `C:\Project\vue源码\core\packages\compiler-core\src\compile.ts:67-125`
- `C:\Project\vue源码\core\packages\compiler-core\src\parser.ts:1028`
- `C:\Project\vue源码\core\packages\compiler-core\src\transform.ts:334-410`
- `C:\Project\vue源码\core\packages\compiler-core\src\codegen.ts:283-390`

## 六、VNode、Block 和编译器提示

### 1. `createVNode()` 创建 VNode

运行 `render` 函数时，`createVNode()` 创建描述节点的对象。VNode 会携带 `type`、`props`、`children`、`shapeFlag`、`patchFlag`、`dynamicChildren`、`el` 等运行时信息。

```text
render()
  → createVNode(type, props, children, patchFlag, dynamicProps)
  → VNode
```

`el` 是挂载后关联的宿主节点；它不是在 VNode 创建时就等于真实 DOM。`shapeFlag` 帮助 renderer 判断元素、组件等大类；`patchFlag` 和 `dynamicProps` 则帮助更新阶段走更窄的路径。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\vnode.ts:531-632`

### 2. Block 负责收集动态子节点

编译器会把模板中的动态节点组织成 block。运行时通过 `openBlock()`、`createBlock()` 等机制记录动态子节点，更新时可以优先处理这些节点，而不是无差别遍历整棵静态树。

> [!note] 优化边界
> “Vue 3 不需要 Diff”是不准确的。Vue 3 仍然有 `patch()` 和子节点 Diff；只是编译器提前提供了静态提升、patch flag、block tree、动态子节点等信息，使运行时可以跳过一部分不可能变化的内容。

### 3. 常见 patch flag 的理解

| 信息 | 作用 | 运行时意义 |
|---|---|---|
| `TEXT` | 文本内容动态 | 主要更新文本，不必完整比较所有 props |
| `CLASS` / `STYLE` | class 或 style 动态 | 走对应的属性更新路径 |
| `PROPS` | 指定动态 props | 配合 `dynamicProps` 定向检查 |
| `FULL_PROPS` | props 动态性复杂 | 需要更完整地比较 props |
| `CACHED` / 静态缓存 | 已缓存的静态 VNode | 更新和 hydration 时可以跳过对应静态子树 |
| `BAIL` | 放弃当前优化路径 | 回退到更保守的 patch 逻辑 |

具体 flag 数值和组合应以 `packages/shared/src/patchFlags.ts` 与当前编译器输出为准，不要只背数字。

## 七、`setupRenderEffect()`：组件渲染的核心

### 1. 创建 `ReactiveEffect`

Vue 3.5.40 的 `setupRenderEffect()` 为每个组件创建一个 `ReactiveEffect(componentUpdateFn)`，并把调度器设置为 `queueJob(job)`：

```ts
const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
const update = (instance.update = effect.run.bind(effect))
const job = (instance.job = effect.runIfDirty.bind(effect))
job.i = instance
job.id = instance.uid
effect.scheduler = () => queueJob(job)

update() // 立即执行首次渲染
```

这里要区分三个名字：

- `componentUpdateFn`：组件首次挂载和后续更新真正执行的函数。
- `ReactiveEffect`：负责记录依赖、重新运行和停止副作用。
- `job` / `scheduler`：负责把更新放入 Vue 的调度队列，而不是立刻递归执行。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:1596-1621`

### 2. 首次执行：beforeMount → render → patch → mounted

首次执行 `componentUpdateFn` 时，源码主线是：

```text
instance.isMounted === false
  ↓
执行 beforeMount 相关回调
  ↓
renderComponentRoot(instance)
  ↓
得到 instance.subTree
  ↓
patch(null, subTree, container, ...)
  ↓
同步 initialVNode.el
  ↓
将 mounted 回调放入 post-render 队列
  ↓
instance.isMounted = true
```

`renderComponentRoot()` 会执行组件的 `instance.render`，并处理 render proxy、props、slots、错误降级、Fragment 等情况。首次组件渲染中的 `patch` 仍然存在，只是旧子树为 `null`，所以主要任务是创建节点。

**源码定位：** `renderer.ts:1322-1465`、`componentRenderUtils.ts` 中的 `renderComponentRoot()`

### 3. 后续执行：beforeUpdate → render → patch → updated

组件自己的 `ref`、`reactive` 或 `computed` 依赖变化时，`ReactiveEffect` 会被触发；父组件更新子组件的 props 时，也可能通过 `instance.next` 进入同一个更新函数。

```text
组件更新 effect 被调度
  ↓
处理 next VNode / 更新 props 与 slots
  ↓
执行 beforeUpdate
  ↓
renderComponentRoot(instance) → nextTree
  ↓
prevTree = instance.subTree
instance.subTree = nextTree
  ↓
patch(prevTree, nextTree, hostParentNode(prevTree.el), ...)
  ↓
将 updated 回调放入 post-render 队列
```

**源码定位：** `renderer.ts:1473-1588`

## 八、`patch()` 如何分派节点类型

### 1. 先判断是否相同节点

`patch(n1, n2, ...)` 先处理两个边界：

1. `n1 === n2`：无需处理。
2. `n1` 存在但 `isSameVNodeType(n1, n2)` 为假：卸载旧树，再按首次挂载处理新树。

之后根据 `n2.type` 和 `shapeFlag` 分派：

```text
Text       → processText
Comment    → processCommentNode
Static     → mountStaticNode / patchStaticNode
Fragment   → processFragment
Element    → processElement
Component  → processComponent
Teleport   → Teleport.process
Suspense   → Suspense.process
```

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:379-470`

### 2. Element 更新：props 与 children 分开处理

Element 的 patch 通常要分别考虑：

- props：由 `patchProp` 处理 class、style、事件、DOM property/attribute 等。
- children：根据文本、数组、Fragment 等形态决定更新策略。
- 旧节点和新节点类型不同：卸载旧节点并创建新节点。

runtime-core 只负责调用抽象的 host 操作；浏览器中具体的 `patchProp` 和 `nodeOps` 来自 runtime-dom。

### 3. Keyed children：Map + 复用 + 最长递增子序列

在复杂的 keyed children 更新中，Vue 3.5.40 的 renderer 会：

1. 建立新子节点的 `key → index` Map。
2. 遍历旧子节点，寻找可复用的新节点；找不到的旧节点会卸载。
3. 记录新旧索引映射 `newIndexToOldIndexMap`。
4. 当节点发生移动时，计算最长递增子序列（LIS）。
5. 从后向前挂载新节点或移动不在稳定序列中的节点。

这是一种启发式的同层 Diff，不是对任意 DOM 树计算理论上的全局最小编辑距离。

**源码定位：** `renderer.ts:1917-2045`

## 九、响应式触发与调度队列

### 1. `ReactiveEffect` 如何建立依赖

Vue 3.5.40 的 `ReactiveEffect` 在 `run()` 时成为当前 active subscriber；响应式属性被读取时，`track()` 将当前 effect 与对应 dep 建立关联。一次运行结束后，源码会清理本轮没有再次读取的旧依赖。

```text
effect.run()
  → activeSub = effect
  → render 读取 state.count
  → dep 记录 effect
  → render 结束，清理本轮未使用的 dep
```

因此 `v-if` 分支切换后，组件不一定永远订阅曾经读取过的所有属性；依赖会随着每次 effect 执行重新校准。

**源码定位：** `C:\Project\vue源码\core\packages\reactivity\src\effect.ts:87-214`、`effect.ts:324-351`

### 2. trigger 不等于立刻执行 render

当依赖变化时，`ReactiveEffect.trigger()` 的优先级是：暂停则暂存，有 scheduler 则调用 scheduler，否则才直接 `runIfDirty()`。组件渲染 effect 设置了 scheduler，因此通常走：

```text
响应式 setter / trigger
  ↓
ReactiveEffect.trigger()
  ↓
effect.scheduler()
  ↓
queueJob(instance.job)
```

### 3. scheduler 如何批量刷新

`queueJob()` 会去重并把 job 放入队列；`queueFlush()` 使用已解决的 Promise 安排微任务，随后 `flushJobs()` 按队列顺序执行任务。源码还区分 pre-flush、主队列和 post-flush 回调，并在开发环境检测递归更新。

```text
queueJob(job)
  → job.flags 标记 QUEUED
  → resolvedPromise.then(flushJobs)
  → 按调度顺序执行主队列中的 job
  → 对应组件的 pre-flush 回调在其渲染更新前处理
  → flushPostFlushCbs()
```

这就是连续多次修改状态时，Vue 通常会把组件更新合并到同一轮刷新中的原因。要读取本轮 DOM 更新后的结果，应使用 `nextTick()` 或相应的后置生命周期/回调。

**源码定位：**

- `C:\Project\vue源码\core\packages\runtime-core\src\scheduler.ts:99-121`
- `C:\Project\vue源码\core\packages\runtime-core\src\scheduler.ts:173-245`
- `C:\Project\vue源码\core\packages\reactivity\src\effect.ts:194-214`

## 十、卸载、停止 effect 与更新完成

组件卸载时，renderer 会执行 `beforeUnmount` 相关逻辑，停止组件 effect scope，处理子树卸载和 DOM 移除，再把卸载完成状态与后置回调放入对应队列。Vue 3 不是只“删除 DOM 标签”，还要停止组件作用域中的响应式副作用，避免销毁后的组件继续参与更新。

**源码定位：** `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts:2160-2205`、`renderer.ts:2333-2388`

## 十一、SSR Hydration 是另一条入口

客户端普通挂载使用 `patch(null, subTree, container)`；如果服务端已经输出 HTML，客户端会使用 hydration renderer，把已有 DOM 与首次生成的 VNode 对齐，而不是无条件重新创建全部 DOM。源码中 `setupRenderEffect()` 也有 `el && hydrateNode` 的分支。

```text
普通挂载：render → patch(null, vnode)
服务端 HTML：hydrate → hydrateNode(existingDOM, vnode)
```

Hydration 的目标是复用服务端 DOM，同时检查结构是否匹配；它不是普通 Diff 的简单别名。

**源码定位：** `renderer.ts:1349-1385`、`runtime-dom/src/index.ts:87-102`

## 十二、Vue 2 与 Vue 3 的关键差异

| 对比项 | Vue 2 | Vue 3 |
|---|---|---|
| 响应式核心 | 主要使用 `Object.defineProperty` | `Proxy`、`ReactiveEffect`、dep/subscriber 机制 |
| 组件更新单位 | 渲染 Watcher | 每个组件一个渲染 `ReactiveEffect` |
| 调度名称 | Watcher queue | scheduler job queue：`queueJob` / `flushJobs` |
| 平台抽象 | runtime 与平台耦合更明显 | runtime-core 注入 host operations，runtime-dom 提供 DOM 实现 |
| 编译优化 | 有静态节点优化 | patch flags、静态提升、block tree、dynamic children 更系统 |
| VNode 形态 | 以组件/元素 VNode 为主 | 增加 Fragment、Teleport、Suspense 等内置分支 |

## 十三、容易说错的地方

1. **“Vue 3 没有 Diff。”** 错。Vue 3 仍然调用 `patch()`；只是编译器提供了更多运行时提示，使 Diff 更有针对性。
2. **“`ReactiveEffect` 每次触发都会立即执行 render。”** 不准确。组件 effect 设置了 scheduler，通常先进入 `queueJob()` 和微任务刷新。
3. **“VNode 就是真实 DOM。”** 错。VNode 是描述节点的对象，挂载后才通过 host 操作得到或关联真实节点。
4. **“模板总是在浏览器运行时编译。”** 错。`.vue` 单文件组件通常在构建时编译；只有特定 compiler build 才支持运行时模板编译。
5. **“runtime-core 直接调用 `document.createElement`。”** 错。runtime-core 调用抽象的 `hostCreateElement` 等操作，runtime-dom 才提供浏览器实现。
6. **“`updated` 回调在 `patch()` 调用结束的同步下一行执行。”** 不应这样记。源码把组件更新回调放入 post-render 队列，具体执行时机受调度器和 Suspense 等因素影响。
7. **“源码里的 `patchFlag` 数字可以永远照抄。”** 不可靠。flag 是编译器与运行时的内部协议，应结合当前版本源码理解。

## 十四、源码阅读路线

遇到一个渲染问题时，可以按下面顺序查：

```text
1. runtime-dom/src/index.ts
   确认 createApp 使用了哪一个 renderer

2. runtime-core/src/apiCreateApp.ts
   看 app.mount 如何创建根 VNode 并调用 render

3. runtime-core/src/renderer.ts
   跟 patch → processComponent / processElement

4. runtime-core/src/component.ts
   看 setup、render 函数最终如何落到 instance.render

5. runtime-core/src/renderer.ts
   重点看 mountComponent → setupRenderEffect → componentUpdateFn

6. reactivity/src/effect.ts + runtime-core/src/scheduler.ts
   追响应式依赖如何触发、如何排队、何时刷新

7. compiler-core/src/compile.ts / transform.ts / codegen.ts
   如果问题与模板编译、patch flag 或静态提升有关，再回到编译器
```

## 十五、复习题

1. `createApp(App).mount('#app')` 如何从 `runtime-dom` 进入 `runtime-core`？
2. 为什么 `setup()` 返回一个函数时，这个函数可以成为组件 render？
3. 首次组件渲染中，`instance.subTree` 是什么时候得到的？旧子树为什么是 `null`？
4. 组件自己的 `ref` 改变与父组件传入的新 props，分别如何进入 `componentUpdateFn`？
5. `patchFlag`、`dynamicChildren` 和普通 VNode Diff 各自解决什么问题？
6. 为什么 renderer 可以脱离 DOM？请指出 runtime-core 与 runtime-dom 的分工。
7. `queueJob()` 为什么要去重并使用 Promise 微任务？
8. 卸载组件时，为什么除了移除 DOM，还要停止 effect scope？

## 十六、官方资料与源码索引

### Vue 官方文档

- [Vue：渲染机制（Rendering Mechanism）](https://vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue：渲染函数与 JSX](https://vuejs.org/guide/extras/render-function.html)
- [Vue：响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue：生命周期钩子](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue：应用实例与 `createApp`](https://vuejs.org/guide/essentials/application.html)

### 本地 Vue `v3.5.40` 源码

- `C:\Project\vue源码\core\packages\runtime-dom\src\index.ts`
- `C:\Project\vue源码\core\packages\runtime-core\src\apiCreateApp.ts`
- `C:\Project\vue源码\core\packages\runtime-core\src\renderer.ts`
- `C:\Project\vue源码\core\packages\runtime-core\src\component.ts`
- `C:\Project\vue源码\core\packages\runtime-core\src\scheduler.ts`
- `C:\Project\vue源码\core\packages\runtime-core\src\vnode.ts`
- `C:\Project\vue源码\core\packages\reactivity\src\effect.ts`
- `C:\Project\vue源码\core\packages\compiler-core\src\compile.ts`
- `C:\Project\vue源码\core\packages\compiler-core\src\transform.ts`
- `C:\Project\vue源码\core\packages\compiler-core\src\codegen.ts`

## 一句话总结

Vue 3 的渲染过程是：构建工具或运行时 compiler 把模板变成 render 函数，组件挂载时创建 `ReactiveEffect` 并执行 render 得到 VNode，renderer 通过 `patch` 把 VNode 转换为宿主节点；响应式依赖变化后由 scheduler 调度组件 effect，重新 render、patch，并在合适的后置队列执行更新回调。
