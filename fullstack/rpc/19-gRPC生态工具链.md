# 第19章：gRPC 生态工具链

## 本章目标
掌握 buf + grpcurl + grpcui + ghz 全套工具

---

## 19.1 buf：现代 protoc 替代

```bash
go install github.com/bufbuild/buf/cmd/buf@latest
```

```yaml
# buf.yaml
version: v1
breaking:
  use: [FILE]
lint:
  use: [DEFAULT]
```

```bash
buf lint                    # 检查 proto 规范
buf breaking --against '.git#branch=main'  # 检测不兼容变更
buf generate                # 生成代码（替代手写 protoc 命令）
```

---

## 19.2 grpcurl：gRPC 的 curl

```bash
# 无 proto 文件调用（需服务端开启 Reflection）
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50051 user.UserService/GetUser
grpcurl -plaintext -d '{"id":1}' localhost:50051 user.UserService/GetUser

# 带 proto 文件调用
grpcurl -plaintext -import-path ./proto -proto user.proto \
  -d '{"name":"张三"}' localhost:50051 user.UserService/CreateUser
```

---

## 19.3 ghz：gRPC 压测工具

```bash
go install github.com/bojand/ghz/cmd/ghz@latest

# 压测
ghz --insecure \
  --proto ./proto/user.proto \
  --call user.UserService/GetUser \
  -d '{"id":1}' \
  -n 10000 -c 50 \
  localhost:50051

# 输出：QPS、延迟分布、百分位
```

---

## 19.4 grpcui：图形界面

```bash
go install github.com/fullstorydev/grpcui/cmd/grpcui@latest
grpcui -plaintext localhost:50051
# 打开 http://localhost:... → 图形界面，填参数，点击调用
```

---

## 本章小结
- buf → 规范检查 + 代码生成
- grpcurl → 命令行调试
- grpcui → 图形界面调试
- ghz → 压力测试

## 练习题
1. 用 buf lint 检查 proto 文件规范。
2. 用 ghz 压测 gRPC 服务，记录 QPS 和延迟。
