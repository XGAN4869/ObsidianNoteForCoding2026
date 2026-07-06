# Prompt Examples

在用户要“提示词”“调用示例”“怎么问更容易出结果”时再读取本文件。

## 1. 分析现有组件通信

```text
Use $vue-components-communication to analyze these Vue components.
请先把组件分成页面组件/容器组件、业务区块组件、展示组件三类，
再按“状态被谁持有 -> 方法被谁触发 -> 数据传给谁 -> 改完怎么回流”梳理链路，
最后判断每一处应该用 props、emit、v-model、slot、defineExpose、provide/inject 还是 store。
请重点说明这样设计在封装性、代码简洁度、语义明确性上的好处。
```

## 2. 设计新页面的组件边界

```text
Use $vue-components-communication to design the component boundaries for this Vue page.
不要先写 API，先判断哪些应该是页面组件/容器组件，哪些应该是业务区块组件，哪些应该是展示组件。
请给我一份组件拆分方案，并说明每份状态应该放哪一层、每个动作由谁触发、数据怎么回流。
```

## 3. 重构 props / emit / store 过重的问题

```text
Use $vue-components-communication to refactor this component communication design.
当前代码里 props、emit、store 用得比较乱，请你先判断这里传递的分别是“值”“动作”“控制权”还是“共享状态”，
再给出更轻、更清晰的通信方式，并保留原有业务语义。
```

## 4. 只要分析，不要代码

```text
Use $vue-components-communication to review this Vue component interaction.
只输出职责判断、状态归属、通信链路和重构建议，不要直接写代码。
如果你认为某个状态放错层级，请明确指出应该上移、下沉还是局部保留。
```

## 5. 需要最小代码骨架

```text
Use $vue-components-communication to design this Vue component communication and give me only the minimal code skeleton.
请先给职责划分和通信方式选择，再给最小的 props / emit / v-model / slot / store 骨架，不要展开无关实现。
```

## 6. 分析完整页面链路，包含 App / store / services / Storage

```text
Use $vue-components-communication to analyze this Vue module end to end.
不要只看父子组件，请继续往上追到 App、store、services 和 Storage。
请明确区分业务状态、runtime 状态、失败补偿状态，尤其要列出每个 Storage key 的写入者、读取者、触发时机和语义。
```

## 7. 生成适合 Canvas 的 Markdown

```text
Use $vue-components-communication to analyze this Vue feature and output a Markdown document for canvas generation.
请输出组件分层、项目级节点、关键链路、Storage 总表、推荐节点清单、推荐连线清单和推荐分组方式。
重点说明状态被谁持有、方法被谁触发、数据传给谁、改完怎么回流。
```
