# 第12章：Stream 拦截器

## 本章目标
掌握流式拦截器（与一元拦截器的差异）

---

## 12.1 Stream 拦截器签名

```go
// Server 端 Stream 拦截器
type StreamServerInterceptor func(
	srv interface{},
	ss grpc.ServerStream,
	info *grpc.StreamServerInfo,
	handler grpc.StreamHandler,
) error

// Client 端 Stream 拦截器
type StreamClientInterceptor func(
	ctx context.Context,
	desc *grpc.StreamDesc,
	cc *grpc.ClientConn,
	method string,
	streamer grpc.Streamer,
	opts ...grpc.CallOption,
) (grpc.ClientStream, error)
```

---

## 12.2 流式日志拦截器

```go
func StreamLoggingInterceptor(srv interface{},
	ss grpc.ServerStream, info *grpc.StreamServerInfo,
	handler grpc.StreamHandler) error {

	start := time.Now()
	err := handler(srv, ss)
	log.Printf("[Stream] %s 耗时 %v err=%v", info.FullMethod, time.Since(start), err)
	return err
}

// 注册
s := grpc.NewServer(grpc.StreamInterceptor(StreamLoggingInterceptor))
```

---

## 12.3 同时注册一元和流拦截器

```go
s := grpc.NewServer(
	grpc.ChainUnaryInterceptor(LogUnary, AuthUnary),
	grpc.ChainStreamInterceptor(LogStream, AuthStream),
)
```

> ⚠️ 一元和流式拦截器**分别注册**。流式方法不会经过一元拦截器。

---

## 12.4 Unary vs Stream Interceptor 对比

| 特性 | UnaryInterceptor | StreamInterceptor |
|------|-----------------|-------------------|
| 签名参数 | `ctx, req, info, handler` | `srv, ss, info, handler` |
| 获取请求 | `req interface{}` 直接拿到 | 需要通过 `ss.RecvMsg()` |
| 注册 | `grpc.UnaryInterceptor()` | `grpc.StreamInterceptor()` |

---

## 本章小结
- 流式拦截器签名不同于一元拦截器
- 分别用 `grpc.StreamInterceptor()` / `grpc.ChainStreamInterceptor()`
- 流式方法不走一元拦截器

## 练习题
1. 为流式服务添加日志拦截器。
2. 在流式拦截器中统计发送/接收的消息数量。
