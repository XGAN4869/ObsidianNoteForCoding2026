# 第14章：健康检查与 Reflection

## 本章目标
实现 gRPC 健康检查 + 开启 Reflection 方便调试

---

## 14.1 健康检查

```bash
go get google.golang.org/grpc/health/grpc_health_v1
```

```go
import (
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	s := grpc.NewServer()

	// 创建健康检查服务
	healthServer := health.NewServer()
	healthpb.RegisterHealthServer(s, healthServer)

	// 设置状态
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)
	// 或针对特定服务
	healthServer.SetServingStatus("user.UserService", healthpb.HealthCheckResponse_SERVING)

	s.Serve(lis)
}
```

```bash
# 用 grpcurl 检查
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
```

---

## 14.2 gRPC Reflection

Reflection 让客户端**动态发现**服务有哪些方法（不需要 `.proto` 文件）：

```go
import "google.golang.org/grpc/reflection"

reflection.Register(s)  // 一行搞定！
```

开启后，`grpcurl` 不用传 `-proto` 文件：

```bash
# 列出所有服务
grpcurl -plaintext localhost:50051 list

# 列出方法
grpcurl -plaintext localhost:50051 list user.UserService

# 调用
grpcurl -plaintext -d '{"id":1}' localhost:50051 user.UserService/GetUser
```

---

## 14.3 调试工具

| 工具 | 用途 |
|------|------|
| `grpcurl` | gRPC 的 curl |
| `grpcui` | gRPC 的图形界面 |
| `evans` | 交互式 gRPC 客户端 |

```bash
go install github.com/fullstorydev/grpcui/cmd/grpcui@latest
grpcui -plaintext localhost:50051
# 打开浏览器 → 图形界面测试 gRPC
```

---

## 本章小结
- Health Check：K8s/Docker 健康探针的标准实现
- Reflection：动态发现服务，`grpcurl` 免传 proto
- 生产建议：Reflection 仅开发/测试环境开启

## 练习题
1. 添加健康检查服务，用 grpcurl 验证。
2. 开启 Reflection，用 grpcurl 不传 proto 调用服务。
3. 安装 grpcui，用图形界面测试。
