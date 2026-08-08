# 第10章：Deadline/Timeout 超时控制

## 本章目标
掌握 gRPC 超时设置与传播

---

## 10.1 Client 端设置超时

```go
// 绝对超时：1 秒内必须完成
ctx, cancel := context.WithTimeout(context.Background(), time.Second)
defer cancel()

resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: 1})
if err != nil {
	if status.Code(err) == codes.DeadlineExceeded {
		fmt.Println("请求超时！")
	}
}
```

---

## 10.2 Server 端检查超时

```go
func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	// 检查是否已被取消
	if ctx.Err() == context.Canceled {
		return nil, status.Error(codes.Canceled, "客户端取消了请求")
	}
	if ctx.Err() == context.DeadlineExceeded {
		return nil, status.Error(codes.DeadlineExceeded, "请求已超时")
	}

	// 耗时操作前检查
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
		// 继续处理
	}
}
```

---

## 10.3 Deadline 在调用链中传播

```
Client (2秒超时)
  └→ ServiceA (剩余1.5秒)
        └→ ServiceB (剩余0.8秒)
              └→ 只有0.8秒时间来完成！
```

gRPC 自动传播 deadline。ServiceA 收到 Client 的 deadline 后，调用 ServiceB 时自动传递剩余时间。

---

## 常见错误

### 错误1：不设超时

```go
// ❌ 永远阻塞（如果服务端不响应）
client.GetUser(context.Background(), req)

// ✅ 设超时
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()
client.GetUser(ctx, req)
```

### 错误2：Server 端不检查 ctx.Done()

```go
// ❌ 耗时操作不做超时检查 → Client 超时了 Server 还在跑
for _, item := range items {  // 100万条
	process(item)
}

// ✅ 定期检查
for _, item := range items {
	select {
	case <-ctx.Done(): return nil, ctx.Err()
	default: process(item)
	}
}
```

---

## 本章小结
- Client：`context.WithTimeout(ctx, duration)`
- Server：检查 `ctx.Done()` / `ctx.Err()`
- Deadline 自动在调用链中传播
- 生产环境每个 gRPC 调用都要设超时

## 练习题
1. Client 设 500ms 超时，Server sleep 1 秒，观察超时错误。
2. Server 端在循环中检查 ctx.Done() 提前退出。
3. 尝试链式调用两个服务，观察 deadline 传播。
