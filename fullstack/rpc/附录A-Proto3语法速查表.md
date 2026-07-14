# 附录A：Proto3 语法速查表

## 文件结构
```protobuf
syntax = "proto3";
package mypack;
option go_package = "module/path;packname";
import "other.proto";
```

## 基本类型
| Proto | Go | 默认值 |
|-------|----|----|
| int32/64 | int32/64 | 0 |
| uint32/64 | uint32/64 | 0 |
| float/double | float32/64 | 0.0 |
| bool | bool | false |
| string | string | "" |
| bytes | []byte | [] |

## Message
```protobuf
message User {
  uint64 id = 1;
  string name = 2;
  repeated string tags = 3;      // 数组
  map<string, int32> scores = 4; // 字典
  Address address = 5;           // 嵌套
  Gender gender = 6;             // 枚举
}
```

## Enum
```protobuf
enum Status { UNKNOWN = 0; ACTIVE = 1; INACTIVE = 2; }
// ⚠️ 第一个值必须是 0
```

## Service（四种模式）
```protobuf
service Svc {
  rpc Unary(Req) returns (Resp);                          // 一元
  rpc ServerStream(Req) returns (stream Resp);            // 服务端流
  rpc ClientStream(stream Req) returns (Resp);            // 客户端流
  rpc BidiStream(stream Req) returns (stream Resp);       // 双向流
}
```

## Well-Known Types
```protobuf
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/empty.proto";
import "google/protobuf/wrappers.proto";
import "google/protobuf/any.proto";
```

## oneof
```protobuf
message Response {
  oneof result {
    User user = 1;
    Error error = 2;
  }
}
```

## Go 代码生成
```bash
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/hello.proto
```
