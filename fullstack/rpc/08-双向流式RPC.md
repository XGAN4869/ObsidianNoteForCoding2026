# 第08章：双向流式 RPC（Bidirectional）+ 四种模式对比

## 本章目标
掌握双向流 + 四种模式选型

---

## 8.1 双向流模型

```
Client                    Server
  │                         │
  │ ── Data ────────────> │
  │ <──────── Data ────── │
  │ ── Data ────────────> │
  │ ── Data ────────────> │
  │ <──────── Data ────── │
  │ <──────── Data ────── │
  │ ... 任意顺序收发 ...    │
```

Proto 定义：
```protobuf
rpc Chat(stream ChatMessage) returns (stream ChatMessage);
//        ^^^^^^                        ^^^^^^ 两边都是 stream
```

---

## 8.2 完整示例：简单聊天

```protobuf
service ChatService {
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}
message ChatMessage {
  string user = 1;
  string text = 2;
}
```

### Server：并发收发

```go
func (s *chatServer) Chat(stream pb.ChatService_ChatServer) error {
	for {
		msg, err := stream.Recv()
		if err == io.EOF { return nil }
		if err != nil { return err }

		log.Printf("[%s]: %s", msg.GetUser(), msg.GetText())

		// 回复
		stream.Send(&pb.ChatMessage{
			User: "Server",
			Text: "收到: " + msg.GetText(),
		})
	}
}
```

### Client：并发读写

```go
stream, _ := client.Chat(ctx)

// 发送 goroutine
go func() {
	for _, msg := range messages {
		stream.Send(&pb.ChatMessage{User: "Client", Text: msg})
	}
	stream.CloseSend()  // 关闭发送端
}()

// 接收
for {
	msg, err := stream.Recv()
	if err == io.EOF { break }
	fmt.Printf("[%s]: %s\n", msg.GetUser(), msg.GetText())
}
```

---

## 8.3 四种模式对比

| 模式 | Proto | Client | Server | 典型场景 |
|------|-------|--------|--------|---------|
| **一元** | `rpc M(Req) returns (Resp)` | 发送1次，接收1次 | 接收1次，发送1次 | 查询、创建 |
| **服务端流** | `rpc M(Req) returns (stream Resp)` | 发送1次，循环收 | 接收1次，多次发 | 大数据列表、实时推送 |
| **客户端流** | `rpc M(stream Req) returns (Resp)` | 多次发，收1次 | 循环收，发1次 | 文件上传、批量操作 |
| **双向流** | `rpc M(stream Req) returns (stream Resp)` | 多次发，循环收 | 循环收，多次发 | 聊天、实时协作 |

### 选型决策

```
一次请求一次响应？ → 一元 RPC
大量数据要推给客户端？ → 服务端流
大量数据要上传？ → 客户端流
需要实时双向通信？ → 双向流
```

---

## 常见错误

### 错误1：双向流中顺序收发导致死锁

```go
// ❌ 先发再收（如果 Server 也在等消息 → 死锁）
stream.Send(msg)
stream.Recv()  // 阻塞等待，Server 可能也在等 Send

// ✅ Client 端用 goroutine 分离收发
go func() { /* 发送 */ }()
/* 接收 */
```

### 错误2：忘记 CloseSend

```go
// 发完不关 → Server 的 Recv 永远在等 → 泄漏
stream.CloseSend()  // 必须调！
```

---

## 本章小结

| 方法 | Client | Server |
|------|--------|--------|
| 一元 | `Call(ctx, req)` | `Handler(ctx, req) (resp, err)` |
| 服务端流 | `Call(ctx, req)` → `Recv()` 循环 | `Handler(req, stream)` → `Send()` |
| 客户端流 | `Call(ctx)` → `Send()` → `CloseAndRecv()` | `Handler(stream)` → `Recv()` → `SendAndClose()` |
| 双向流 | `Call(ctx)` → `Send()`/`Recv()` 并发 | `Handler(stream)` → `Recv()`/`Send()` |

## 练习题
1. 实现聊天服务：Server 把收到的消息广播给所有客户端。
2. 实现一个双向流的上传+进度反馈服务。
3. 画出四种模式的时序图。
