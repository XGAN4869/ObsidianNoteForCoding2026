# 第03章：Protocol Buffers 语法全解（下）

## 本章目标
掌握 Service 定义、oneof、Any、Well-Known Types、import 和向后兼容原则

## 前置知识
- 第02章（Proto3 基础语法）

---

## 3.1 Service 定义

Service 是 gRPC 的核心——定义 RPC 方法：

```protobuf
service UserService {
  // 一元 RPC：请求→响应
  rpc GetUser (GetUserRequest) returns (GetUserResponse);

  // 服务端流
  rpc ListUsers (ListUsersRequest) returns (stream User);

  // 客户端流
  rpc BatchCreate (stream CreateUserRequest) returns (BatchCreateResponse);

  // 双向流
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest { uint64 id = 1; }
message GetUserResponse { User user = 1; }
```

---

## 3.2 oneof：多选一字段

```protobuf
message Response {
  oneof result {
    User user = 1;
    Error error = 2;
    string message = 3;
  }
}
// 同一时刻，result 只能是 user/error/message 之一
// 设置一个字段会自动清除其他字段
```

### 场景

```protobuf
// 查询用户响应：要么成功返回用户，要么失败返回错误
message GetUserResponse {
  oneof result {
    User user = 1;
    ErrorInfo error = 2;
  }
}
```

---

## 3.3 Any：通用类型

`Any` 可以存储任意 Message（类似 Go 的 `interface{}`）：

```protobuf
import "google/protobuf/any.proto";

message Notification {
  string type = 1;
  google.protobuf.Any payload = 2;  // 可以是任何 Message
}
```

Go 中使用：
```go
any, _ := anypb.New(&User{Name: "张三"})
notification := &Notification{Type: "user", Payload: any}

// 解析
var user User
any.UnmarshalTo(&user)
```

---

## 3.4 Well-Known Types

Google 预定义的类型，导入即用：

```protobuf
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/empty.proto";
import "google/protobuf/wrappers.proto";
import "google/protobuf/field_mask.proto";

message Event {
  google.protobuf.Timestamp created_at = 1; // 时间戳
  google.protobuf.Duration since = 2;        // 时间间隔
}

// 空请求/响应
rpc Ping(google.protobuf.Empty) returns (google.protobuf.Empty);

// 包装类型（解决默认值问题）
google.protobuf.Int32Value age = 1;  // age 可以为 nil
google.protobuf.StringValue name = 2;
```

---

## 3.5 import：复用 Proto

```protobuf
// user.proto
syntax = "proto3";
package user;
option go_package = "myproject/proto/user;user";
message User { string name = 1; }

// order.proto（引用 User）
syntax = "proto3";
package order;
import "user.proto";                  // 导入
message Order {
  uint64 id = 1;
  user.User buyer = 2;                // 用包名引用
}
```

---

## 3.6 package vs go_package

```protobuf
syntax = "proto3";

package myapp.user;          // Proto 世界内的命名空间
option go_package = "github.com/me/project/gen/user;user";
//           └─ Go module 路径 ──┘ └包名┘
```

| 选项 | 作用 |
|------|------|
| `package` | proto 文件之间的引用（如 `user.User`） |
| `go_package` | 生成的 Go 代码放在哪个 Go 包下 |

---

## 3.7 reserved：保留字段和编号

当你要删除字段时，用 `reserved` 防止编号被重用：

```protobuf
message User {
  reserved 2, 15, 9 to 11;     // 保留编号（禁止再用）
  reserved "old_name", "phone"; // 保留字段名（禁止再用）
  string name = 1;
  string email = 3;
}
```

---

## 3.8 向后兼容的 Proto 演化原则

| ✅ 安全的变更 | ❌ 不安全的变更 |
|-------------|-------------|
| 添加新字段（新编号） | 删除已用字段（除非 reserved） |
| 添加新 Message | 修改字段编号 |
| 添加新 RPC 方法 | 修改字段类型（int32→string） |
| 添加新枚举值 | 删除枚举值 |
| 重命名字段（二进制兼容） | 修改 oneof 的结构 |

---

## 常见错误

### 错误1：go_package 写错导致生成路径错误

```protobuf
// ❌ go_package 没写全
option go_package = "user";

// ✅ 完整的 module 路径
option go_package = "github.com/me/project/proto/user;user";
```

### 错误2：import 后忘记用包名前缀

```protobuf
import "user.proto";
message Order {
  User user = 1;       // ❌ 没加包名前缀
  user.User user = 1;  // ✅ 用包名.消息名
}
```

---

## 本章小结

- `service` 定义 RPC 方法，支持四种流模式
- `oneof` 实现多选一，`Any` 存任意类型
- `Timestamp/Duration/Empty/Wrappers` 常用 Well-Known Types
- `package` = Proto 命名空间，`go_package` = Go 包路径
- `reserved` 防止删除字段的编号被重用

## 练习题

1. 定义一个 UserService，包含 CRUD 四个 RPC 方法。
2. 用 `oneof` 设计一个 API 通用响应（成功返回数据，失败返回错误）。
3. 用 `Timestamp` 给 User 添加 `created_at` 和 `updated_at` 字段。
4. Proto 向后兼容的"安全变更"有哪些？列举 3 个。
