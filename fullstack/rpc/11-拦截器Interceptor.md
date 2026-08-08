# 第11章：拦截器（Interceptor）—— gRPC 的中间件

## 本章目标
掌握一元拦截器：类似 Gin 的中间件

---

## 11.1 拦截器是什么

```
Client 端拦截器：                 Server 端拦截器：
Client → [日志拦截] → 网络        网络 → [日志拦截] → [认证拦截] → Handler
```

---

## 11.2 Server 端一元拦截器

```go
// 签名
type UnaryServerInterceptor func(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error)

// 日志拦截器
func LoggingInterceptor(ctx context.Context, req interface{},
	info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {

	start := time.Now()

	// 调用实际处理函数
	resp, err := handler(ctx, req)

	log.Printf("方法: %s, 耗时: %v, 错误: %v", info.FullMethod, time.Since(start), err)
	return resp, err
}

// 注册
s := grpc.NewServer(grpc.UnaryInterceptor(LoggingInterceptor))
```

---

## 11.3 实用拦截器

### 认证拦截器

```go
func AuthInterceptor(ctx context.Context, req interface{},
	info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "缺少Metadata")
	}
	token := md.Get("authorization")
	if len(token) == 0 || token[0] != "Bearer secret" {
		return nil, status.Error(codes.Unauthenticated, "认证失败")
	}
	return handler(ctx, req)
}
```

### Panic 恢复拦截器

```go
func RecoveryInterceptor(ctx context.Context, req interface{},
	info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {

	defer func() {
		if r := recover(); r != nil {
			log.Printf("panic recovered: %v", r)
			err = status.Errorf(codes.Internal, "内部错误")
		}
	}()
	return handler(ctx, req)
}
```

---

## 11.4 拦截器链

```go
// 多个拦截器：先注册的先执行
s := grpc.NewServer(
	grpc.ChainUnaryInterceptor(
		RecoveryInterceptor,   // ① 最外层：捕获 panic
		LoggingInterceptor,    // ② 次外层：记录日志
		AuthInterceptor,       // ③ 最内层：认证
	),
)
// 执行顺序：Recovery → Logging → Auth → Handler
// 返回顺序：Handler → Auth → Logging → Recovery（洋葱模型！）
```

---

## 常见错误

### 错误1：拦截器中忘记调用 handler

```go
// ❌ 拦截器没调 handler → 请求被吞了！
func BadInterceptor(...) (interface{}, error) {
	return nil, nil  // 忘了调 handler(ctx, req)
}
```

### 错误2：拦截器链顺序搞错

```go
// ❌ Recovery 放在最内层 → 捕获不到 Auth 的 panic
grpc.ChainUnaryInterceptor(Auth, Recovery)
// ✅ Recovery 在最外层
grpc.ChainUnaryInterceptor(Recovery, Auth)
```

---

## 本章小结
- 拦截器 = gRPC 的中间件（类似 Gin 的 `Use()`）
- Server 端：`grpc.UnaryInterceptor()` / `grpc.ChainUnaryInterceptor()`
- Client 端：`grpc.WithUnaryInterceptor()` / `grpc.WithChainUnaryInterceptor()`
- 洋葱模型：外层先进先出

## 练习题
1. 实现日志+认证+恢复三个拦截器。
2. 用 ChainUnaryInterceptor 组合它们。
3. 写一个 Client 端拦截器打印请求耗时。
