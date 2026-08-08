# 第16章：gRPC Gateway —— REST 转 gRPC

## 本章目标
为 gRPC 服务自动生成 RESTful JSON API

---

## 16.1 什么是 gRPC Gateway

```
浏览器/手机                    微服务之间
   │                            │
   │ REST (JSON)                │ gRPC (Protobuf)
   ▼                            ▼
┌──────────────┐          ┌──────────────┐
│ gRPC Gateway │ ───────>│ gRPC Server  │
│  (HTTP/1.1)  │  转换    │  (HTTP/2)    │
└──────────────┘          └──────────────┘
```

---

## 16.2 添加 HTTP 注解

```protobuf
import "google/api/annotations.proto";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse) {
    option (google.api.http) = {
      get: "/api/v1/users/{id}"
    };
  }

  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse) {
    option (google.api.http) = {
      post: "/api/v1/users"
      body: "*"
    };
  }
}
```

---

## 16.3 生成代码并启动

```bash
# 安装 gateway 插件
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# 生成
protoc \
  --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative \
  proto/user.proto
```

```go
// 同时启动 gRPC + HTTP Gateway
func main() {
	go func() {
		// gRPC :50051
		lis, _ := net.Listen("tcp", ":50051")
		s := grpc.NewServer()
		pb.RegisterUserServiceServer(s, &server{})
		s.Serve(lis)
	}()

	// HTTP Gateway :8080
	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	pb.RegisterUserServiceHandlerFromEndpoint(context.Background(), mux, "localhost:50051", opts)
	http.ListenAndServe(":8080", mux)
}
```

---

## 16.4 测试 REST API

```bash
# 现在可以用 REST 方式调用了！
curl http://localhost:8080/api/v1/users/1
# {"user":{"id":1,"name":"张三"}}

curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"李四","email":"lisi@test.com"}'
```

---

## 本章小结
- gRPC Gateway = 一个反向代理，把 REST JSON 转成 gRPC
- 通过 `google.api.http` 注解定义 REST 路由
- 对外暴露 REST，内部用 gRPC（鱼和熊掌兼得）

## 练习题
1. 为 UserService 生成 gRPC Gateway，同时启动两个端口。
2. 用 curl 测试 REST API。
3. 对比直接用 Gin 写 REST API 和用 gRPC Gateway，各有什么优劣？
