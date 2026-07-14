# 附录C：项目模板与工具速查

## 最小项目模板

```
grpc-project/
├── proto/
│   └── hello.proto
├── server/
│   └── main.go
├── client/
│   └── main.go
├── go.mod
└── buf.gen.yaml
```

## protoc 命令模板

```bash
protoc \
  --go_out=. \
  --go_opt=paths=source_relative \
  --go-grpc_out=. \
  --go-grpc_opt=paths=source_relative \
  proto/hello.proto
```

## buf.gen.yaml

```yaml
version: v1
plugins:
  - plugin: go
    out: .
    opt: paths=source_relative
  - plugin: go-grpc
    out: .
    opt: paths=source_relative
```

## grpcurl 常用命令

```bash
# 列出服务
grpcurl -plaintext localhost:50051 list

# 列出方法
grpcurl -plaintext localhost:50051 list myapp.UserService

# 调用
grpcurl -plaintext -d '{"id":1}' localhost:50051 myapp.UserService/GetUser

# 健康检查
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
```

## ghz 压测

```bash
ghz --insecure \
  --proto ./proto/user.proto \
  --call user.UserService/GetUser \
  -d '{"id":1}' \
  -n 10000 -c 50 \
  localhost:50051
```

## VS Code 插件

- `vscode-proto3` —— Proto 语法高亮
- `buf` —— Lint + Format

## Go 依赖

```bash
go get google.golang.org/grpc
go get google.golang.org/protobuf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```
