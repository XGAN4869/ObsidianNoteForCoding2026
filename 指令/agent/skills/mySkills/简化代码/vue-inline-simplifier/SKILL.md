---
name: vue-inline-simplifier
description: Keep Vue3 page JavaScript logic inline, simple, commented, and generated in staged edits. Use when modifying or simplifying Vue .vue files, Vue3 page logic, uni-app or mini-program pages, sites/uniapp or sites/web page code, or when the user asks not to split files, to write JS back into the current Vue file, to add clear comments, or to simplify code without over-engineering.
---

# Vue Inline Simplifier

## 触发场景

用于修改 Vue3 页面逻辑、简化当前目录代码、避免拆文件、把 JS 写回当前 `.vue`、补清楚注释、逐段生成，或处理 Vue3 相关页面代码。

## 硬性规则

- 当前目录下 AI 写的 JS 逻辑，优先直接写在当前 Vue 文件里。
- 不主动新建 JS / TS 文件。
- 不主动新建 `.js`、`.ts`、`utils`、`hooks`、`services`、`helpers`、`composables`。
- 页面状态、表单、computed、watch、生命周期、页面事件、页面专属接口调用、简单转换、loading、toast、modal、缓存和提交逻辑，默认写在当前 `.vue`。
- 使用 code-simplifier 思路简化代码。
- 使用 code-simplifier 思路简化代码：减少过度封装、中转函数、一次性 helper、多层转换、不必要中间变量和项目不需要的抽象。
- 每段新增代码都要加注释。
- 每段新增或重写代码都要按逻辑段加注释，说明职责，不翻译语法。
- 大改动必须逐段生成。
- 大改动必须逐段生成；每次只改一个逻辑段。
- 不做过度抽象。
- 不写过度兜底。
- 命名要简单。
- 不破坏现有业务行为。

## 执行流程

1. Intake：识别当前目录、当前文件、是否是 `.vue`、用户要改什么、是否允许新增文件、是否要保留原行为；信息不足时只问最少问题。
2. Scan：查看当前 `.vue` 结构、同目录 JS/TS 抽离文件、页面专属 helper、过度封装、过度兜底、复杂命名和不能删的业务逻辑。
3. Plan：给出短计划，说明改哪些、不改哪些、是否新增文件、是否影响业务；默认不新增文件。
4. Edit：按段修改，例如状态变量、computed/watch、接口调用、提交逻辑、模板绑定、最终检查。
5. Check：每段后检查是否新增 JS/TS、过度抽离、过度校验、复杂命名、缺注释或破坏原业务。
6. Review：最终说明修改段落、写回当前 Vue 的逻辑、是否新增文件、简化点、保留的关键业务和风险点。

## 代码风格

- 表单优先叫 `formData`，列表优先叫 `xxxList`，当前项优先叫 `currentXxx`。
- loading 用 `loading` 或 `submitLoading`；获取列表用 `loadList` 或 `getList`；提交和保存用 `submitForm`、`saveForm`。
- 不写三层以上语义叠加的变量名，不为了精确表达写超长名字。
- 字段明确时直接使用，例如 `item.name`；不要默认写成 `String(item?.data?.info?.name || '').trim()`。
- 只在后端字段不稳定、用户说明可能为空、小程序兼容、权限登录定位缓存支付、或原代码已有必要兜底时保留校验。
- 不删除登录、权限、表单校验、接口失败提示、定位权限、小程序生命周期、缓存恢复、线上兼容和稳定业务流程。

## 输出格式

每段修改前输出：

```text
第 N 段：xxx
目标：xxx
影响范围：xxx
```

每段修改后说明：行为是否变化、是否新增文件、是否删除逻辑、是否有风险点。

## 禁止事项

- 禁止无必要新建 `.js` / `.ts` 文件。
- 禁止把当前页面专属逻辑拆成 utils / hooks。
- 禁止一次性大面积重写。
- 禁止写过长变量名。
- 禁止写过多 `?.`、`Array.isArray`、`typeof` 兜底。
- 禁止删除权限、登录、定位、缓存等关键逻辑。
- 禁止写没有意义的注释。
- 禁止为了“工程化”牺牲可读性。

## 最终检查

确认：JS 逻辑优先留在当前 `.vue`；没有主动新增 JS/TS；使用 code-simplifier 思路；新增代码有逻辑段注释；大改动已逐段生成；没有过度抽象、过度兜底和复杂命名；现有业务行为未被破坏。
