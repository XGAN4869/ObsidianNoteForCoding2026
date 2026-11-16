# 评论区组件通信分析（Canvas 源文档）

## 1. 分析范围

本文分析 [CSDN《uniapp 实现一个评论区》](https://blog.csdn.net/qq_53273706/article/details/136458373) 中展示的代码。下文的 `index.vue` 和 `hb-comment.vue` 都指文章示例。当前项目的需求见[评论与二级回复方案](03-评论与二级回复.md)。

评论容器负责读取、提交和更新评论列表，评论区块负责渲染列表和管理输入。列表用 `props` 下传，用户操作用 `emit` 上报，接口成功后父组件通过 `ref` 调用子组件方法。

## 2. 组件分层与状态归属

| 组件 | 分层 | 持有的状态 | 接收的数据 | 发出或处理的动作 |
| --- | --- | --- | --- | --- |
| 详情页 | 页面组件 | 当前文章标识 | 文章只给出调用示例 | 给评论容器传 `articleId`，接收 `shareFriend` |
| `index.vue`（`comment-eg`） | 评论容器 | `commentData` 评论列表、`foldList` 展开记录、`reqFlag` 请求锁、读取到的 `userId` | `articleId`，以及子组件发出的操作和参数 | 读取列表，提交新增、点赞、删除，更新展开状态 |
| `hb-comment.vue` | 评论业务区块 | `sendConf` 草稿和回复目标、`submit` 弹层开关、`focus` 焦点、`KeyboardHeight` 键盘高度 | `cmData` 列表数据 | 渲染评论，打开输入，发出 `add`、`like`、`del`、`fold`、`share`、`focusOn` |

一级评论、二级回复和评论输入弹层都是 `hb-comment.vue` 内部的模板区块。文章示例没有拆出独立的评论项或输入栏组件。

## 3. 通信方式

| 传递内容 | 方式 | 位置与作用 |
| --- | --- | --- |
| 文章标识和评论列表 | `props` | 详情页传 `articleId` 给容器，容器传 `cmData` 给评论区块 |
| 发送、点赞、删除、展开意图 | `emit` | 评论区块带着操作所需的参数通知容器，容器负责执行业务操作 |
| 完成后的界面操作 | `ref` | 容器调用子组件的 `addComplete()` 关闭输入并重置草稿。原文也通过 `ref` 调 `likeComplete()` 和 `deleteComplete()` 修改列表 |
| 输入文字 | `v-model` | `textarea` 和区块内部的 `sendConf.content` 双向绑定。父组件在收到 `add` 时才取得发送内容 |
| 转发 | `emit` | 评论区块发出 `share`，容器再发出 `shareFriend` 给详情页 |

## 4. 项目级节点

| 节点 | 示例中的职责或证据 |
| --- | --- |
| App | 文章没有提供 `App.vue` 或启动恢复代码 |
| Store | 文章没有展示 Store、`provide/inject` 或跨页面评论状态同步 |
| Services / 平台 | 评论 API 的具体封装没有展示。区块在 `mounted()` 中通过 `uni.onKeyboardHeightChange` 获取键盘高度 |
| Storage | 容器在 `created()` 中读取本地用户 ID，见下表 |
| API | `getCommentList` 读取，`addMessageData` 新增，`likeMessageData` 点赞，`delMessageData` 删除 |

### Storage 读写表

| Key | 写入者 | 读取者 | 读取时机 | 数据含义 |
| --- | --- | --- | --- | --- |
| `userId` | 文章未展示 | `index.vue` | `created()` | 本地记录的用户标识，供评论请求使用 |

## 5. Canvas 分图清单

每张图单独绘制。节点按下表命名，连线标签标出传递的数据、事件或函数。图 1 展示参与者，图 2–4 展示各自的执行顺序。

### 图 1 · 首次加载与父子通信

| 节点 | 归属与职责 |
| --- | --- |
| 详情页 | 持有当前文章 ID |
| 评论容器 | 监听 `articleId`，执行 `getComment()`，更新 `commentData` |
| 评论 API | 按文章查询评论 |
| 评论区块 | 接收 `cmData`，渲染一级评论和 `children` 回复 |

| 起点 | 连线标签 | 终点 |
| --- | --- | --- |
| 详情页 | `props: articleId` | 评论容器 |
| 评论容器 | `getComment() → getCommentList()` | 评论 API |
| 评论 API | 返回评论列表 | 评论容器 |
| 评论容器 | 保存列表并计算折叠状态，再下传 `props: cmData` | 评论区块 |
| 评论区块 | `emit: add / like / del / fold` | 评论容器 |
| 评论容器 | 接口成功后通过 `ref` 调用完成方法 | 评论区块 |

### 图 2 · 回复一条二级评论并提交

| 步骤 | 节点与方法 | 输入与输出 |
| --- | --- | --- |
| 1 | 区块 `replyChild()` | 点一级评论 A 下的回复 B，写入 `parentId = A.id`、`answerId = B.id` |
| 2 | 区块 `commentInput()` | 打开输入弹层，用户输入的内容更新到 `sendConf.content` |
| 3 | 区块 `addMsg()` | 检查是否可发送，经 `emit('add', sendConf)` 把草稿交给容器 |
| 4 | 容器 `add()` | 补充 `userId` 和 `scriptCode`，调用 `addMessageData()` |
| 5a | 区块 `addComplete()` | 容器在接口成功后通过 `ref` 调用，区块收起弹层并重置草稿 |
| 5b | 容器 `getComment()` | 接着重拉列表，新的 `commentData` 经 `cmData` 下传给区块 |

连线顺序为 1 → 2 → 3 → 4。第 4 步成功后先调用 5a，再触发 5b。图中保留两条不同的回流线，一条控制输入界面，一条更新列表。

### 图 3 · 输入弹层如何跟着键盘移动

| 起点 | 连线标签 | 终点 |
| --- | --- | --- |
| 区块 `commentInput()` | `submit = true` | 显示输入弹层 |
| 区块 `commentInput()` | 原文等待 50ms 后设置 `focus = true` | 输入框请求焦点 |
| 输入框请求焦点 | 系统响应焦点 | 键盘弹出 |
| 系统键盘 | `uni.onKeyboardHeightChange` 报告高度 | 区块更新 `KeyboardHeight` |
| `KeyboardHeight` | 绑定弹层 `bottom` | 输入弹层抬到键盘上方 |

`submit` 表示弹层是否显示，提交评论由图 2 中的 `addMsg()` 发起。

### 图 4 · 点赞、删除、展开回复

| 分支 | 子组件发起 | 父组件处理 | 结果回流 |
| --- | --- | --- | --- |
| 点赞 | `like()` 发出 `like`，携带评论 ID 和目标状态 | `like()` 调用点赞接口 | 成功后调用子组件的 `likeComplete()`，修改图标状态和计数 |
| 删除 | `confirmDelete()` 二次确认，发出 `del` | `del()` 调用删除接口 | 成功后调用 `deleteComplete()` 移除该条评论，再调用 `getComment()` 重拉列表 |
| 展开 | `foldMsg()` 发出 `fold`，携带楼层 ID | `fold()` 更新 `foldList` 和该楼的 `isFold` | 子组件显示已经加载的回复 |

三个分支分别画成「子组件发起 → 父组件处理 → 界面更新」。展开只修改已有列表的显示状态。

## 6. 状态边界与改进建议

**原文实际共用了对象引用。** 子组件在 `init(cmData)` 中直接保存父组件传入的对象，因此 `likeComplete()` 和 `deleteComplete()` 会改到父组件的列表。子组件发送时直接传出 `sendConf`，父组件的 `add()` 给它补字段时也会改到草稿。

若后续采用这种分层，可让容器统一更新评论列表，用草稿字段组装新的请求对象。区块继续掌握草稿、焦点和弹层，`ref` 只用来执行关闭输入等界面操作。这些是调整建议，图 1–4 按文章现有实现绘制。
