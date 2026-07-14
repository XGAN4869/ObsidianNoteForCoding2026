# 第06章：服务端流式 RPC（Server Streaming）

## 本章目标
掌握服务端流：一次请求，多次响应

---

## 6.1 服务端流模型

```
Client                    Server
  │                         │
  │ ── Request ──────────> │
  │                         │ 开始发送...
  │ <──────── Data 1 ──── │
  │ <──────── Data 2 ──── │
  │ <──────── Data 3 ──── │
  │ <──────── EOF ─────── │
```

Proto 定义：
```protobuf
rpc ListUsers(ListUsersRequest) returns (stream User);
//                                          ^^^^^^ stream 关键字
```

---

## 6.2 完整示例：实时日志推送

```protobuf
service LogService {
  rpc StreamLogs(LogRequest) returns (stream LogEntry);
}
message LogRequest { string level = 1; }
message LogEntry { string message = 1; int64 timestamp = 2; }
```

### Server：`stream.Send()` 多次发送

```go
func (s *logServer) StreamLogs(req *pb.LogRequest, stream pb.LogService_StreamLogsServer) error {
	for i := 0; i < 10; i++ {
		if err := stream.Send(&pb.LogEntry{
			Message:   fmt.Sprintf("日志 #%d", i),
			Timestamp: time.Now().Unix(),
		}); err != nil {
			return err
		}
		time.Sleep(500 * time.Millisecond)
	}
	return nil  // 返回 nil 表示流结束
}
```

### Client：`stream.Recv()` 循环接收

```go
stream, err := client.StreamLogs(ctx, &pb.LogRequest{Level: "INFO"})

for {
	entry, err := stream.Recv()
	if err == io.EOF {
		break  // 流结束
	}
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("[%d] %s\n", entry.GetTimestamp(), entry.GetMessage())
}
```

---

## 6.3 适用场景

| 场景 | 说明 |
|------|------|
| 大数据列表 | 一次查 10 万条，边发边处理 |
| 实时推送 | 日志、监控指标 |
| 进度通知 | 文件上传进度 |

---

## 常见错误

### 错误1：Client 忘记处理 io.EOF

```go
for {
	entry, err := stream.Recv()
	if err == io.EOF { break }  // ← 必须处理！
}
```

### 错误2：Server 返回 nil 后继续 Send

```go
// ❌ Server 返回 nil 后不能再 Send
return nil
stream.Send(...)  // 这不会执行，无效代码
```

---

## 本章小结
- `returns (stream X)` 定义服务端流
- Server：`stream.Send()` 多次发送，return nil 结束
- Client：`stream.Recv()` 循环接收，`io.EOF` 结束

## 练习题
1. 实现一个服务端流服务，推送 10 条通知。
2. Server 端每次 Send 前 sleep 500ms，观察 Client 端是否逐条收到。
3. 在 Client 端中途 cancel context，观察 Server 是否能感知。
