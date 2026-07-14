# 附录B：gRPC 错误排查指南

## protoc 命令错误

| 错误 | 原因 | 解决 |
|------|------|------|
| protoc-gen-go: program not found | 插件不在 PATH | `export PATH=$PATH:$(go env GOPATH)/bin` |
| File not found | proto 路径不对 | 用 `-I` 或 `--proto_path` 指定 |
| go_package 不匹配 | module 和 go_package 不统一 | 检查 go.mod 的 module 名 |

## 连接错误

| 错误 | 原因 | 解决 |
|------|------|------|
| Unavailable / connection refused | Server 没启动 | 检查端口和启动命令 |
| DeadlineExceeded | 超时 | 调大超时或检查 Server 性能 |
| TLS handshake error | 证书问题 | 开发环境用 insecure |

## 代码生成错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 编译报错：接口未实现 | 忘记嵌入 UnimplementedXXX | 嵌入 `pb.UnimplementedXXXServer` |
| 生成的文件找不到 | go_package 路径不对 | 检查 go.mod + go_package |

## 流式错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 服务端流收不到数据 | Client 没循环 Recv | 用 `for { Recv() }` |
| 客户端流 Server 没响应 | Client 没调 CloseAndRecv | Send 完后必须 CloseAndRecv |
| 双向流死锁 | 收发顺序问题 | Client 用 goroutine 分离收发 |

## 拦截器错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 拦截器不生效 | 一元和流式拦截器分开注册 | 分别注册 UnaryInterceptor 和 StreamInterceptor |
| Metadata 取不到 | key 大小写 | gRPC Metadata key 统一为小写 |
