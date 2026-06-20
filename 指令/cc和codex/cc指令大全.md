# Claude Code (cc) 指令大全

本文档整理了 Claude Code (cc) 的常用指令和技能，方便快速查阅。

## 1. 基本指令

### 1.1 会话管理
```bash
/help              # 获取帮助信息
/clear             # 清空当前会话的上下文，开始新的对话
/compact           # 压缩当前会话的上下文，保留重要部分
/fast              # 切换到快速模式（使用相同的 Claude Opus 4.6 模型，输出更快）
```

### 1.2 任务管理
```bash
/tasks             # 查看当前任务列表
/agents            # 打开代理管理对话框
```

### 1.3 工作流管理
```bash
/plan              # 进入计划模式，设计实现方案
/worktree          # 创建隔离的 git worktree
```

## 2. 技能（Skills）

技能是通过 `/` 命令调用的专用功能，使用 `Skill` 工具执行。

### 2.1 配置管理
```bash
/update-config     # 配置 Claude Code 设置（settings.json）
```

### 2.2 代码质量
```bash
/simplify          # 审查更改的代码，检查可重用性、质量和效率，修复发现的问题
```

### 2.3 循环执行
```bash
/loop              # 按固定间隔循环执行提示或指令
# 示例：/loop 5m /foo   # 每5分钟执行一次/foo
# 示例：/loop 10m "检查部署状态"   # 每10分钟检查部署状态
```

### 2.4 Claude API
```bash
/claude-api        # 使用 Claude API 或 Anthropic SDK 构建应用
# 触发条件：代码导入 anthropic、@anthropic-ai/sdk、claude_agent_sdk
```

### 2.5 技能发现
```bash
/find-skills       # 帮助用户发现和安装代理技能
# 使用场景：用户询问"如何做X"、"寻找X的技能"、"有没有可以...的技能"
```

### 2.6 上下文管理
```bash
/context-hygiene   # 保持会话小而专注，抵抗上下文窗口限制
# 使用场景：任务涉及多个文件、会话变长、用户提到上下文溢出、token限制等
```

### 2.7 网页内容提取
```bash
/defuddle          # 使用 Defuddle CLI 从网页提取干净的 Markdown 内容
# 替代 WebFetch，用于在线文档、文章、博客等，去除杂乱内容节省 token
```

### 2.8 Obsidian 相关
```bash
/json-canvas       # 创建和编辑 JSON Canvas 文件 (.canvas)
# 用于思维导图、流程图、可视化画布

/obsidian-bases    # 创建和编辑 Obsidian Bases (.base 文件)
# 用于数据库视图、表格视图、卡片视图、过滤器、公式

/obsidian-cli      # 使用 Obsidian CLI 与运行的 Obsidian 仓库交互
# 功能：读取、创建、搜索、管理笔记、任务、属性等
# 支持插件和主题开发：重载插件、运行 JavaScript、捕获错误、截图

/obsidian-markdown # 创建和编辑 Obsidian 风格的 Markdown
# 支持：维基链接、嵌入、标注、属性、Obsidian 特定语法
```

## 3. Git 相关操作

虽然 Claude Code 没有专门的 git 技能，但可以通过 Bash 工具执行 git 命令，或使用内置的代码提交流程。

### 3.1 代码提交
当用户要求提交代码时，Claude Code 会自动执行以下步骤：
1. 运行 `git status`、`git diff`、`git log` 查看状态
2. 分析更改并草拟提交信息
3. 添加相关文件并创建提交
4. 验证提交成功

### 3.2 Pull Request 创建
当用户要求创建 PR 时：
1. 检查当前分支状态
2. 分析所有相关提交
3. 草拟 PR 标题和摘要
4. 创建分支、推送到远程、创建 PR

## 4. 代理（Agents）

使用 `Agent` 工具启动专用代理处理复杂任务。

### 4.1 代理类型
```bash
# 通用代理 - 研究复杂问题、搜索代码、执行多步骤任务
Agent(subagent_type="general-purpose")

# 探索代理 - 快速探索代码库，按模式查找文件，搜索关键词
Agent(subagent_type="Explore", thoroughness="quick|medium|very thorough")

# 计划代理 - 软件架构代理，设计实现计划
Agent(subagent_type="Plan")

# Claude Code 指南代理 - 回答关于 Claude Code 的问题
Agent(subagent_type="claude-code-guide")

# 状态行设置代理 - 配置 Claude Code 状态行设置
Agent(subagent_type="statusline-setup")
```

### 4.2 使用场景
- **探索代理**：当需要快速查找文件模式（如 "src/components/**/*.tsx"）、搜索代码关键词时使用
- **计划代理**：当需要设计实现策略时使用
- **通用代理**：当搜索关键词或文件不确定能否在前几次尝试中找到匹配时使用

## 5. 任务管理（Tasks）

使用任务工具来构建结构化任务列表，跟踪进度。

### 5.1 任务工具
```bash
TaskCreate()    # 创建新任务
TaskList()      # 列出所有任务
TaskGet()       # 按ID获取任务详情
TaskUpdate()    # 更新任务状态
TaskOutput()    # 获取任务输出（已弃用，推荐使用 Read 工具）
TaskStop()      # 停止运行中的后台任务
```

### 5.2 使用场景
- 复杂多步骤任务（3个或更多步骤）
- 需要仔细规划或多个操作的任务
- 计划模式下的工作跟踪
- 用户明确要求使用任务列表时

## 6. 计划模式（Plan Mode）

使用 `EnterPlanMode` 工具在开始非平凡实现任务前进入计划模式。

### 6.1 何时使用计划模式
- 新功能实现
- 多种有效方法可选的任务
- 影响现有行为或结构的代码修改
- 架构决策
- 多文件更改
- 需求不明确
- 用户偏好重要时

### 6.2 计划模式流程
1. 使用 `EnterPlanMode` 进入计划模式
2. 使用 `Glob`、`Grep`、`Read` 工具探索代码库
3. 理解现有模式和架构
4. 设计实现方法
5. 使用 `AskUserQuestion` 澄清方法（如果需要）
6. 使用 `ExitPlanMode` 提交计划供用户批准

## 7. 工作树（Worktree）

使用 `EnterWorktree` 工具创建隔离的 git worktree。

### 7.1 使用场景
- 用户明确要求"worktree"时
- 需要在隔离环境中工作

### 7.2 工作树操作
```bash
EnterWorktree()     # 创建隔离的 git worktree
ExitWorktree()      # 退出工作树会话
```

## 8. 内存系统（Memory）

Claude Code 具有持久的、基于文件的内存系统。

### 8.1 内存类型
- **user** - 用户信息：角色、目标、职责、知识
- **feedback** - 用户给出的工作指导：避免什么、继续什么
- **project** - 项目信息：正在进行的工作、目标、计划、bug、事件
- **reference** - 外部系统信息指针

### 8.2 内存位置
```
C:\Users\Administrator\.claude\projects\E--Work1-githubClone-ObsidianNoteForCoding2026\memory\
```

### 8.3 如何使用
- 当用户明确要求记住某事时立即保存
- 当记忆相关时访问记忆
- 在基于记忆推荐前验证信息是否仍然正确

## 9. 工具使用指南

### 9.1 专用工具优先原则
- **不要**使用 Bash 运行有专用工具的命令
- 文件搜索：使用 `Glob`（不要用 `find` 或 `ls`）
- 内容搜索：使用 `Grep`（不要用 `grep` 或 `rg`）
- 读取文件：使用 `Read`（不要用 `cat`、`head`、`tail`）
- 编辑文件：使用 `Edit`（不要用 `sed` 或 `awk`）
- 创建文件：使用 `Write`（不要用 `cat` 或 `echo` 重定向）

### 9.2 Bash 工具使用场景
- 系统命令和需要 shell 执行的终端操作
- git 命令
- 包管理命令（npm、yarn、pip 等）
- 构建和测试命令

## 10. 实用技巧

### 10.1 并行工具调用
如果可以并行调用多个工具且它们之间没有依赖关系，可以在单个响应中同时调用多个工具。

### 10.2 风险操作确认
对于难以撤销或影响共享状态的操作，默认情况下应透明地沟通并请求确认：
- 破坏性操作：删除文件/分支、强制推送、`rm -rf`
- 难以撤销的操作：`git reset --hard`、修改已发布的提交
- 影响他人的操作：推送代码、创建/关闭 PR、发送消息

### 10.3 用户运行命令
如果用户需要自己运行 shell 命令（如交互式登录 `gcloud auth login`），建议他们输入 `! <command>`，`!` 前缀会在当前会话中运行命令。

## 11. 常见问题

### 11.1 如何获取帮助？
```bash
/help              # 获取 Claude Code 使用帮助
```

### 11.2 如何提交反馈？
在 https://github.com/anthropics/claude-code/issues 报告问题。

### 11.3 当前模型版本？
- Claude Opus 4.6: 'claude-opus-4-6'
- Claude Sonnet 4.6: 'claude-sonnet-4-6'  
- Claude Haiku 4.5: 'claude-haiku-4-5-20251001'

快速模式使用相同的 Claude Opus 4.6 模型，但输出更快。

---

**标签**：#ClaudeCode #cc指令 #开发工具 #AI助手 #效率工具

**相关笔记**：
- [[git]] - Git 常用指令指南
- [[CLAUDE]] - 项目配置说明
- [[Obsidian怎么玩]] - Obsidian 使用指南

**更新时间**：2026-04-10