# 第13章：Metadata 与认证

## 本章目标
掌握 Metadata 传递 + JWT 认证 + TLS 加密

---

## 13.1 Metadata 是什么

Metadata = gRPC 的 Header（键值对），类似 HTTP Header。

```go
// Client 发送 Metadata
md := metadata.Pairs(
	"authorization", "Bearer token123",
	"trace-id", "abc-def-123",
)
ctx := metadata.NewOutgoingContext(context.Background(), md)
client.GetUser(ctx, req)

// Server 接收 Metadata
md, ok := metadata.FromIncomingContext(ctx)
token := md.Get("authorization")  // ["Bearer token123"]
traceID := md.Get("trace-id")     // ["abc-def-123"]
```

---

## 13.2 JWT 认证全流程

### Server 端拦截器

```go
func JWTAuthInterceptor(ctx context.Context, req interface{},
	info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {

	// 白名单（不需要认证的方法）
	if info.FullMethod == "/user.UserService/Login" ||
	   info.FullMethod == "/user.UserService/Register" {
		return handler(ctx, req)
	}

	md, _ := metadata.FromIncomingContext(ctx)
	tokens := md.Get("authorization")
	if len(tokens) == 0 {
		return nil, status.Error(codes.Unauthenticated, "缺少Token")
	}

	claims, err := parseJWT(tokens[0])  // 解析JWT
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "Token无效")
	}

	// 把 user_id 注入 Context
	ctx = context.WithValue(ctx, "user_id", claims.UserID)
	return handler(ctx, req)
}
```

### Client 端拦截器

```go
func JWTAuthClientInterceptor(ctx context.Context, method string,
	req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker,
	opts ...grpc.CallOption) error {

	// 自动注入 Token
	token := getToken()
	ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer "+token)
	return invoker(ctx, method, req, reply, cc, opts...)
}
```

---

## 13.3 TLS 加密

```go
// Server 端
creds, _ := credentials.NewServerTLSFromFile("server.crt", "server.key")
s := grpc.NewServer(grpc.Creds(creds))

// Client 端
creds, _ := credentials.NewClientTLSFromFile("ca.crt", "")
conn, _ := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(creds))
```

---

## 常见错误

### 错误1：Metadata key 大小写

```go
md.Get("Authorization")   // ❌ gRPC Metadata key 统一转为小写
md.Get("authorization")   // ✅
```

### 错误2：Client 用 NewIncomingContext

```go
// ❌ Client 端用 NewIncomingContext（那是 Server 用的）
ctx := metadata.NewIncomingContext(ctx, md)

// ✅ Client 用 NewOutgoingContext
ctx := metadata.NewOutgoingContext(ctx, md)
```

---

## 本章小结
- Metadata = gRPC Header（key-value）
- Client 发：`NewOutgoingContext` + `AppendToOutgoingContext`
- Server 收：`FromIncomingContext`
- JWT 认证 = Metadata + 拦截器
- TLS = `grpc.Creds(creds)`

## 练习题
1. 实现 JWT 认证拦截器（生成 Token + 验证 Token）。
2. 用 Metadata 传递 TraceID。
3. 用 Wireshark 对比 TLS 加密前后的网络包。
