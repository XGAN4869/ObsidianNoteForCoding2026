# gRPC 从入门到精通：完整教程目录

> **教程定位**：本教程面向有 Go 后端基础、RPC 零基础的读者，从 RPC 概念讲起，逐步深入到 Protocol Buffers 语法、四种通信模式、拦截器、认证、负载均衡、gRPC Gateway、微服务实战等高级主题。每章配有可编译的 `.proto` 文件和可运行的 Go 代码、常见错误分析、练习题。

---

## 阅读指南

本教程共 26 章 + 3 个附录，按 6 个阶段组织：

| 阶段 | 章节 | 核心目标 | 时间 |
|------|------|----------|------|
| Phase 1 | 01-04 | RPC 概念 + Proto3 语法 + 第一个 gRPC 程序 | 2-3天 |
| Phase 2 | 05-08 | 四种通信模式（一元/服务端流/客户端流/双向流） | 3-4天 |
| Phase 3 | 09-13 | 错误处理、超时、拦截器、Metadata、认证 | 3-5天 |
| Phase 4 | 14-18 | 健康检查、负载均衡、Gateway、服务发现、测试 | 3-4天 |
| Phase 5 | 19-23 | 生态工具链 + 三个实战项目 | 3-5天 |
| Phase 6 | 24-26 | 源码导读 + 面试宝典 + 微服务全景 | 1-2天 |

### 学习建议

1. **必须动手生成代码**：每章 `.proto` 文件都要自己跑 `protoc` 生成 Go 代码
2. **理解 HTTP/2 是基础**：gRPC 基于 HTTP/2，理解帧、流、多路复用有助于深入
3. **对比 REST 学 RPC**：你已学过 Gin（REST），对比学习印象更深
4. **练习必须做**：每章末尾的练习题是巩固知识的关键

---

## Phase 1：RPC 概念与 Proto3 基础

### 第 01 章：什么是 RPC —— 从零理解远程过程调用
- RPC 概念 / 进程间通信演进 / RPC vs REST
- RPC 三要素：服务定义、序列化、传输协议
- gRPC 的诞生与四大优势

### 第 02 章：Protocol Buffers 语法全解（上）
- Proto3 文件结构 / 基本类型 / Message / 嵌套 / Enum / map
- 字段编号规则 / 默认值 / repeated

### 第 03 章：Protocol Buffers 语法全解（下）
- Service 定义 / oneof / Any / Well-Known Types
- import / package vs go_package / reserved
- Proto 向后兼容原则

### 第 04 章：安装工具链 + 第一个 gRPC 程序
- protoc + 插件安装 / 生成 Go 代码
- Server/Client 编写 / 完整项目结构 / grpcurl 测试

---

## Phase 2：四种通信模式

### 第 05 章：一元 RPC（Unary）
### 第 06 章：服务端流式 RPC（Server Streaming）
### 第 07 章：客户端流式 RPC（Client Streaming）
### 第 08 章：双向流式 RPC（Bidirectional）+ 四种模式对比

---

## Phase 3：高级特性

### 第 09 章：错误处理与状态码
### 第 10 章：Deadline/Timeout 超时控制
### 第 11 章：拦截器（Interceptor）
### 第 12 章：Stream 拦截器
### 第 13 章：Metadata 与认证（JWT/TLS）

---

## Phase 4：生产级实践

### 第 14 章：健康检查与 Reflection
### 第 15 章：负载均衡
### 第 16 章：gRPC Gateway（REST ↔ gRPC）
### 第 17 章：服务发现与注册
### 第 18 章：测试 gRPC 服务

---

## Phase 5：生态扩展 + 实战项目

### 第 19 章：gRPC 生态工具链（buf/grpcurl/ghz）
### 第 20 章：Proto 最佳实践与规范
### 第 21 章：实战一 —— 用户认证微服务
### 第 22 章：实战二 —— 聊天微服务（双向流）
### 第 23 章：实战三 —— 微服务网关

---

## Phase 6：总结与面试

### 第 24 章：gRPC 源码导读
### 第 25 章：gRPC 面试宝典与总复习
### 第 26 章：从单体到微服务 —— 全景回顾

---

## 附录

### 附录 A：Proto3 语法速查表
### 附录 B：gRPC 错误排查指南
### 附录 C：项目模板与工具速查

---

> **最后提醒**：gRPC 技能是"生成"出来和"跑"出来的。每学一个概念，就写 proto、生成代码、跑 server 和 client。祝你学有所成！
