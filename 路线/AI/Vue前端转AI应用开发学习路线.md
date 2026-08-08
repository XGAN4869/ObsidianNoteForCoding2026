> 目标：从 Vue 前端逐步成长为能独立开发 AI Web 应用的全栈开发者。

## 学习顺序

1. 大模型基础与 API
2. Vue AI 聊天应用
3. Node.js AI 后端
4. Function Calling
5. RAG 知识库
6. Agent 与 Workflow
7. MCP
8. Python 与部署

---

## 第一阶段：大模型基础与 API

预计时间：3～5 天

- [ ] 了解 LLM、Token、上下文窗口
- [ ] 了解 System、User、Assistant 三种消息角色
- [ ] 了解 Temperature、最大输出长度
- [ ] 注册并调用一个模型 API
- [ ] 使用 JavaScript 发送单轮对话请求
- [ ] 实现多轮对话
- [ ] 学习基础 Prompt 结构
  - [ ] 角色
  - [ ] 任务
  - [ ] 上下文
  - [ ] 约束
  - [ ] 输出格式
- [ ] 让模型返回固定 JSON 格式

阶段成果：使用 JavaScript 完成一个命令行 AI 对话程序。

---

## 第二阶段：Vue AI 聊天应用

预计时间：1～2 周

- [ ] 创建 Vue 聊天页面
- [ ] 实现消息列表和输入框
- [ ] 实现用户消息与 AI 消息展示
- [ ] 使用 SSE 或流式 Fetch 接收回复
- [ ] 实现逐字输出效果
- [ ] 渲染 Markdown 和代码块
- [ ] 实现停止生成
- [ ] 实现重新生成
- [ ] 实现对话历史
- [ ] 实现加载、错误和重试状态
- [ ] 避免在前端代码中暴露 API Key

阶段成果：完成一个类似 ChatGPT 的 Vue 聊天页面。

---

## 第三阶段：Node.js AI 后端

预计时间：2～3 周

- [ ] 学习 Node.js 基础
- [ ] Express、Hono、NestJS 三选一
- [ ] 学习 REST API
- [ ] 学习环境变量
- [ ] 在后端保存模型 API Key
- [ ] 实现聊天代理接口
- [ ] 实现 SSE 流式接口
- [ ] 学习 `async/await` 和异常处理
- [ ] 学习请求参数校验
- [ ] 学习基础鉴权
- [ ] 学习限流和日志
- [ ] 接入 SQLite、MySQL 或 PostgreSQL
- [ ] 保存用户、会话和消息

阶段成果：完成 Vue + Node.js 前后端分离 AI 聊天应用。

---

## 第四阶段：Function Calling

预计时间：1～2 周

- [ ] 理解 Function Calling 的执行流程
- [ ] 定义工具名称、说明和参数
- [ ] 使用 JSON Schema 描述参数
- [ ] 接收并校验模型生成的参数
- [ ] 在后端执行真实函数
- [ ] 把函数结果返回给模型
- [ ] 支持多个工具
- [ ] 处理工具调用失败和重试
- [ ] 为危险操作增加人工确认

练习工具：

- [ ] 天气查询
- [ ] 订单查询
- [ ] 数据库查询
- [ ] 邮件内容生成

阶段成果：完成一个能自动选择并调用业务接口的 AI 助手。

---

## 第五阶段：RAG 知识库

预计时间：3～5 周

- [ ] 理解 Embedding
- [ ] 理解向量和相似度检索
- [ ] 学习文档读取与清洗
- [ ] 学习文本分块 Chunk
- [ ] 生成并保存文档向量
- [ ] 选择一个向量数据库
  - [ ] Chroma
  - [ ] pgvector
  - [ ] Milvus
- [ ] 根据问题检索相关内容
- [ ] 把检索结果加入 Prompt
- [ ] 显示答案引用来源
- [ ] 处理检索不到内容的情况
- [ ] 测试答案相关性与忠实度
- [ ] 防止不同用户访问错误文档

阶段成果：完成一个支持 Markdown、PDF 文档问答的知识库。

---

## 第六阶段：Agent 与 Workflow

预计时间：3～5 周

- [ ] 理解 Agent、工具和工作流的区别
- [ ] 先学习单 Agent
- [ ] 把复杂任务拆成固定步骤
- [ ] 保存工作流状态
- [ ] 实现条件分支
- [ ] 实现失败重试
- [ ] 实现任务中断与恢复
- [ ] 在关键操作前请求人工确认
- [ ] 学习 LangGraph 或 Dify
- [ ] 最后再了解多 Agent

阶段成果：完成一个可以检索资料、调用工具、生成结果的工作流助手。

---

## 第七阶段：MCP

预计时间：1～2 周

- [ ] 理解 MCP Client、Server、Tool、Resource
- [ ] 使用现成 MCP Server
- [ ] 使用 JavaScript 编写 MCP Server
- [ ] 暴露一个本地查询工具
- [ ] 暴露一个只读数据资源
- [ ] 增加参数校验和权限限制
- [ ] 连接 Claude、Codex 或其他 MCP Client

阶段成果：完成一个能让 AI 安全访问业务工具的 MCP Server。

---

## 第八阶段：Python 与部署

预计时间：按需学习

### Python

- [ ] 变量、列表、字典
- [ ] 条件、循环、函数
- [ ] 模块与虚拟环境
- [ ] 读取 JSON、CSV、Markdown
- [ ] `requests` 或 `httpx`
- [ ] FastAPI 基础
- [ ] 能阅读和修改常见 AI 示例

### 部署

- [ ] Linux 常用命令
- [ ] Docker 基础
- [ ] Docker Compose
- [ ] Nginx 基础
- [ ] HTTPS 和域名
- [ ] 环境变量管理
- [ ] 日志与监控
- [ ] 云服务器部署

阶段成果：独立部署一个 Vue + AI 后端 + 数据库应用。

---

## 暂时不学

- Java、Spring AI、LangChain4J
- 高等数学、线性代数、概率统计
- 机器学习算法
- PyTorch
- Transformer 手写实现
- CUDA 和 GPU 训练
- LoRA、QLoRA 微调
- 多模态模型训练
- Kubernetes
- 多 Agent 复杂架构

有模型训练、算法研究或大规模部署需求时再学习。

---

## 推荐项目顺序

- [ ] 项目一：Vue 流式 AI 聊天页面
- [ ] 项目二：Vue + Node.js 完整聊天系统
- [ ] 项目三：Function Calling 订单助手
- [ ] 项目四：企业文档 RAG 知识库
- [ ] 项目五：Agent 工作流助手
- [ ] 项目六：自定义 MCP Server

## 当前第一步

- [ ] 选择一个模型 API
- [ ] 用 JavaScript 发出第一次对话请求
- [ ] 创建 Vue 聊天页面
- [ ] 接入流式输出
