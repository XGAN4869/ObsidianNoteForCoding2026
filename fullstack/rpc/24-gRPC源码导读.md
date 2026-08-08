# 第24章：gRPC 源码导读

## 本章目标
了解 gRPC-Go 的核心模块和阅读路径

---

## 24.1 gRPC-Go 项目结构

```
google.golang.org/grpc/
├── clientconn.go      # ClientConn：连接管理核心
├── server.go          # Server：服务端核心
├── stream.go          # Stream：流的实现
├── rpc_util.go        # RPC 工具
├── call.go            # 一元调用逻辑
├── resolver/          # 名称解析
├── balancer/          # 负载均衡
├── credentials/       # TLS 认证
├── metadata/          # 元数据
├── codes/             # 状态码
├── status/            # Status 类型
├── interceptor.go     # 拦截器
└── health/            # 健康检查
```

---

## 24.2 核心流程

### Client 端发请求
```
client.GetUser(ctx, req)
  → conn.Invoke(ctx, method, req, reply)
    → newClientStream() 创建 HTTP/2 Stream
      → encode(req) Protobuf 序列化
        → transport.Write() 发送 HTTP/2 DATA 帧
          → transport.Read() 接收响应
            → decode(reply) 反序列化
```

### Server 端处理
```
transport.Read() 收到 HTTP/2 帧
  → 找到匹配的 Method Handler
    → decode(req) 反序列化
      → [拦截器链]
        → Handler(ctx, req) 你写的业务代码
      → [拦截器链 返回]
    → encode(resp)
  → transport.Write() 发送 HTTP/2 响应帧
```

---

## 24.3 推荐阅读路径

1. `call.go` —— 一元 RPC 调用流程
2. `stream.go` —— 流式实现
3. `clientconn.go` —— 连接管理
4. `server.go` —— 服务端注册与处理
5. `interceptor.go` —— 拦截器链实现

---

## 本章小结
- gRPC-Go 核心：ClientConn(连接管理) + Server + Stream
- HTTP/2 帧的读写封装在 transport 层
- 推荐从 `call.go` 开始阅读源码

## 练习题
1. 阅读 `call.go` 的 `invoke` 函数，画出调用流程图。
2. 找到拦截器链是如何被调用的（`interceptor.go`）。
