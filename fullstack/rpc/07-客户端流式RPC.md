# 第07章：客户端流式 RPC（Client Streaming）

## 本章目标
掌握客户端流：多次发送，一次响应

---

## 7.1 客户端流模型

```
Client                    Server
  │                         │
  │ ── Data 1 ──────────> │
  │ ── Data 2 ──────────> │
  │ ── Data 3 ──────────> │
  │ ── 发送结束 ────────> │
  │                         │ 处理完成
  │ <──────── Response ─── │
```

Proto 定义：
```protobuf
rpc BatchUpload(stream Chunk) returns (UploadResponse);
//               ^^^^^^ stream 在请求侧
```

---

## 7.2 完整示例：批量上传

```protobuf
service FileService {
  rpc BatchUpload(stream FileChunk) returns (UploadResponse);
}
message FileChunk { bytes data = 1; string filename = 2; }
message UploadResponse { string url = 1; int64 total_bytes = 2; }
```

### Client：`stream.Send()` 多次发送 + `CloseAndRecv()`

```go
stream, _ := client.BatchUpload(ctx)

for _, chunk := range chunks {
	stream.Send(&pb.FileChunk{Data: chunk, Filename: "test.txt"})
}

// 关闭发送，接收服务端响应
resp, err := stream.CloseAndRecv()
fmt.Printf("上传完成: %d bytes\n", resp.GetTotalBytes())
```

### Server：`stream.Recv()` 循环 + `SendAndClose()`

```go
func (s *fileServer) BatchUpload(stream pb.FileService_BatchUploadServer) error {
	var total int64
	for {
		chunk, err := stream.Recv()
		if err == io.EOF {
			// 发送最终响应
			return stream.SendAndClose(&pb.UploadResponse{
				Url: "https://cdn.example.com/test.txt", TotalBytes: total,
			})
		}
		if err != nil { return err }
		total += int64(len(chunk.GetData()))
	}
}
```

---

## 7.3 适用场景

| 场景 | 说明 |
|------|------|
| 文件上传 | 分块上传大文件 |
| 批量创建 | 一次提交多条记录 |
| 数据导入 | 客户端推送大量数据 |

---

## 常见错误

### 错误1：Client 用 Recv 而不是 CloseAndRecv

```go
// ❌ 客户端流没有服务端推送的消息可用 Recv
resp, err := stream.Recv()  // 错误！

// ✅ 客户端流用 CloseAndRecv 获取最终响应
resp, err := stream.CloseAndRecv()
```

### 错误2：Client Send 完忘记 CloseAndRecv

```go
stream.Send(...)
stream.Send(...)
// ❌ 忘记 CloseAndRecv！Server 不知道你发完了
```

---

## 本章小结
- `rpc Method(stream X) returns (Y)` 定义客户端流
- Client：Send 发送 → CloseAndRecv 收响应
- Server：Recv 循环收 → SendAndClose 发响应

## 练习题
1. 实现客户端流上传 10 个数据块，服务端统计总数。
2. 对比客户端流和一元 RPC 批量发送（for 循环 10 次）的区别。
