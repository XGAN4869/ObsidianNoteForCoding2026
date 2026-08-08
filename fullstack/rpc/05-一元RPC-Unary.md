# 第05章：一元 RPC（Unary RPC）—— 深入掌握

## 本章目标
深入掌握最常用的一元 RPC 模式（请求→响应）

---

## 5.1 一元 RPC 模型

```
Client                    Server
  │                         │
  │ ── Request ──────────> │
  │                         │ 处理...
  │ <──────── Response ─── │
  │                         │
```

Proto 定义：
```protobuf
rpc GetUser(GetUserRequest) returns (GetUserResponse);
```

---

## 5.2 完整示例：用户查询服务

```protobuf
// proto/user.proto
syntax = "proto3";
option go_package = "grpc-demo/proto/user;user";
package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
}

message GetUserRequest { uint64 id = 1; }
message GetUserResponse { User user = 1; }

message CreateUserRequest { string name = 1; string email = 2; }
message CreateUserResponse { uint64 id = 1; }

message User {
  uint64 id = 1;
  string name = 2;
  string email = 3;
}
```

### Server 实现

```go
type userServer struct {
	pb.UnimplementedUserServiceServer
	users map[uint64]*pb.User  // 模拟数据库
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	user, ok := s.users[req.GetId()]
	if !ok {
		return nil, status.Errorf(codes.NotFound, "用户 %d 不存在", req.GetId())
	}
	return &pb.GetUserResponse{User: user}, nil
}
```

### Client 调用

```go
resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: 1})
if err != nil {
	// 处理 gRPC 错误
	st, _ := status.FromError(err)
	fmt.Printf("错误码: %s, 信息: %s\n", st.Code(), st.Message())
	return
}
fmt.Printf("用户: %s\n", resp.GetUser().GetName())
```

---

## 5.3 gRPC 调用流程

```
1. Client 调用 client.GetUser(ctx, req)
2. gRPC Client 将 req 序列化为 Protobuf 二进制
3. 通过 HTTP/2 发送到 Server
4. gRPC Server 反序列化为 Go struct
5. Server 调用你写的 GetUser(ctx, req)
6. 返回值序列化 → HTTP/2 返回 → Client 反序列化
```

---

## 常见错误

### 错误1：忘记传 Context

```go
// ❌ 第一个参数必须是 context.Context
client.GetUser(&pb.GetUserRequest{Id: 1})

// ✅
client.GetUser(ctx, &pb.GetUserRequest{Id: 1})
```

### 错误2：用 nil Context

```go
client.GetUser(nil, &pb.GetUserRequest{Id: 1})  // ❌ panic
client.GetUser(context.Background(), ...)        // ✅
```

---

## 本章小结
- 一元 RPC = 一次请求一次响应
- Proto: `rpc Method(Request) returns (Response);`
- Context 必须传，不能为 nil
- 用 `status.Errorf(codes.Code, msg)` 返回标准错误

## 练习题
1. 实现 UserService 的 CreateUser 方法。
2. 用 status.Errorf 返回不同的错误码（NotFound/InvalidArgument）。
3. 测试 Client 收到错误时的处理。
