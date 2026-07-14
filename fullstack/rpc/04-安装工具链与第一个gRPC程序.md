# 第04章：安装工具链 + 第一个 gRPC 程序

## 本章目标
1. 安装 protoc + Go 插件
2. 编写 `.proto` 并生成 Go 代码
3. 读懂生成的代码
4. 编写 Server 和 Client
5. 用 grpcurl 测试

## 前置知识
- 第02-03章（Proto3 语法）

---

## 4.1 安装工具链

### protoc 编译器

```bash
# Mac
brew install protobuf

# Linux
sudo apt install -y protobuf-compiler
# 或下载：https://github.com/protocolbuffers/protobuf/releases

# Windows
# 下载 protoc-xxx-win64.zip，解压，加 PATH
```

验证：
```bash
protoc --version
# libprotoc 25.x
```

### Go 插件

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 确保 $GOPATH/bin 在 PATH 中
export PATH="$PATH:$(go env GOPATH)/bin"
```

---

## 4.2 项目结构

```
grpc-hello/
├── proto/
│   └── hello.proto
├── server/
│   └── main.go
├── client/
│   └── main.go
├── go.mod
└── go.sum
```

```bash
mkdir -p grpc-hello/proto grpc-hello/server grpc-hello/client
cd grpc-hello
go mod init grpc-hello
```

---

## 4.3 编写 Proto 文件

```protobuf
// proto/hello.proto
syntax = "proto3";

option go_package = "grpc-hello/proto/hello;hello";

package hello;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

---

## 4.4 生成 Go 代码

```bash
protoc \
  --go_out=. \
  --go_opt=paths=source_relative \
  --go-grpc_out=. \
  --go-grpc_opt=paths=source_relative \
  proto/hello.proto
```

生成两个文件：
- `proto/hello/hello.pb.go` —— 消息的序列化/反序列化代码
- `proto/hello/hello_grpc.pb.go` —— gRPC 客户端/服务端接口

### 读懂 `hello_grpc.pb.go`

```go
// 生成的 Client 接口（你要用这个调用远端）
type GreeterClient interface {
	SayHello(ctx context.Context, in *HelloRequest, opts ...grpc.CallOption) (*HelloReply, error)
}

// 生成的 Server 接口（你要实现这个）
type GreeterServer interface {
	SayHello(context.Context, *HelloRequest) (*HelloReply, error)
}

// 注册服务
func RegisterGreeterServer(s grpc.ServiceRegistrar, srv GreeterServer)
```

---

## 4.5 编写 Server

```go
// server/main.go
package main

import (
	"context"
	"log"
	"net"
	"google.golang.org/grpc"
	pb "grpc-hello/proto/hello"
)

type server struct {
	pb.UnimplementedGreeterServer  // 必须嵌入！
}

func (s *server) SayHello(ctx context.Context, req *pb.HelloRequest) (*pb.HelloReply, error) {
	log.Printf("收到请求: name=%s", req.GetName())
	return &pb.HelloReply{Message: "你好, " + req.GetName() + "!"}, nil
}

func main() {
	lis, _ := net.Listen("tcp", ":50051")
	s := grpc.NewServer()
	pb.RegisterGreeterServer(s, &server{})
	log.Println("gRPC 服务启动在 :50051")
	s.Serve(lis)
}
```

---

## 4.6 编写 Client

```go
// client/main.go
package main

import (
	"context"
	"log"
	"time"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pb "grpc-hello/proto/hello"
)

func main() {
	conn, _ := grpc.Dial("localhost:50051",
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	defer conn.Close()

	client := pb.NewGreeterClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	resp, err := client.SayHello(ctx, &pb.HelloRequest{Name: "张三"})
	if err != nil {
		log.Fatalf("调用失败: %v", err)
	}
	log.Printf("响应: %s", resp.GetMessage())
}
```

---

## 4.7 运行测试

```bash
# 终端1：启动 Server
go run server/main.go

# 终端2：运行 Client
go run client/main.go
# 输出：响应: 你好, 张三!
```

---

## 4.8 grpcurl：gRPC 的 curl

```bash
# 安装
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# 列出服务（需要 Reflection，第14章）
grpcurl -plaintext localhost:50051 list

# 调用（指定 proto 文件）
grpcurl -plaintext \
  -d '{"name":"张三"}' \
  -import-path ./proto \
  -proto hello.proto \
  localhost:50051 \
  hello.Greeter/SayHello
```

---

## 常见错误

### 错误1：protoc-gen-go 找不到

```
protoc-gen-go: program not found or is not executable
```

**解决**：`export PATH="$PATH:$(go env GOPATH)/bin"`

### 错误2：忘记嵌入 UnimplementedGreeterServer

```go
// ❌ 编译错误
type server struct{}

// ✅ 必须嵌入
type server struct {
	pb.UnimplementedGreeterServer
}
```

### 错误3：go_package 路径不匹配

```protobuf
// ❌ proto 的 go_package 和 go.mod 的 module 不匹配
option go_package = "grpc-hello/proto/hello;hello";
// go.mod: module github.com/me/grpc-hello

// ✅ 保持一致
option go_package = "github.com/me/grpc-hello/proto/hello;hello";
```

---

## 本章小结

- 安装：protoc + protoc-gen-go + protoc-gen-go-grpc
- 生成：`protoc --go_out=. --go-grpc_out=. proto/xxx.proto`
- Server：实现接口 → `RegisterXXXServer` → `Serve()`
- Client：`grpc.Dial` → `NewXXXClient` → 调用
- grpcurl 调试 gRPC 服务

## 练习题

1. 创建项目，定义 HelloService，生成代码，运行 Server/Client。
2. 给 HelloReply 增加一个 `reply_at` 时间戳字段。
3. 用 grpcurl 调用 gRPC 服务。
4. （思考题）生成的 `.pb.go` 和 `_grpc.pb.go` 分别包含什么内容？为什么要分两个文件？
