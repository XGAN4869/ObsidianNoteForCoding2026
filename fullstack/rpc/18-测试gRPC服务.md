# 第18章：测试 gRPC 服务

## 本章目标
使用 bufconn 内存连接测试 gRPC 服务

---

## 18.1 bufconn：不启动网络端口测试

```go
import "google.golang.org/grpc/test/bufconn"

func setupTestServer(t *testing.T) (*grpc.ClientConn, func()) {
	lis := bufconn.Listen(1024 * 1024)  // 内存连接

	s := grpc.NewServer()
	pb.RegisterGreeterServer(s, &server{})

	go s.Serve(lis)

	conn, _ := grpc.Dial("bufnet",
		grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
			return lis.Dial()
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)

	return conn, func() { conn.Close(); s.Stop() }
}
```

---

## 18.2 单元测试

```go
func TestSayHello(t *testing.T) {
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := pb.NewGreeterClient(conn)
	resp, err := client.SayHello(context.Background(), &pb.HelloRequest{Name: "张三"})

	if err != nil {
		t.Fatalf("调用失败: %v", err)
	}
	if !strings.Contains(resp.GetMessage(), "张三") {
		t.Errorf("期望包含'张三', 得到: %s", resp.GetMessage())
	}
}
```

---

## 18.3 表驱动测试

```go
func TestGetUser(t *testing.T) {
	conn, cleanup := setupTestServer(t)
	defer cleanup()
	client := pb.NewUserServiceClient(conn)

	tests := []struct {
		name string; id uint64; wantCode codes.Code
	}{
		{"存在的用户", 1, codes.OK},
		{"不存在的用户", 999, codes.NotFound},
		{"无效ID", 0, codes.InvalidArgument},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := client.GetUser(ctx, &pb.GetUserRequest{Id: tt.id})
			if status.Code(err) != tt.wantCode {
				t.Errorf("期望 %v, 得到 %v", tt.wantCode, status.Code(err))
			}
		})
	}
}
```

---

## 本章小结
- `bufconn` 在内存中模拟 gRPC 通信（不需要网络端口）
- 测试 Server 实现就像测试普通函数
- 表驱动测试覆盖正常/异常/边界

## 练习题
1. 用 bufconn 测试一个 Unary RPC。
2. 写表驱动测试，覆盖正常/错误/超时场景。
3. 测试拦截器是否正常工作。
