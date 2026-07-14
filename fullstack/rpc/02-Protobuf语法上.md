# 第02章：Protocol Buffers 语法全解（上）

## 本章目标
学完本章后，你将能够：
1. 理解 Proto3 文件的基本结构
2. 定义 Message（含嵌套、枚举、map、repeated）
3. 理解字段编号的重要性
4. 理解 proto3 默认值的行为

## 前置知识
- 第01章（RPC 概念）

---

## 2.1 什么是 Protocol Buffers

Protocol Buffers（简称 Protobuf）是 Google 的**二进制序列化格式**——把 Go 结构体变成紧凑的二进制数据，比 JSON 快 5-10 倍，小 3-5 倍。

```
Go struct {Name:"张三", Age:25}
        │
        ▼ Protobuf 序列化
   二进制: 0a 06 e5 bc a0 e4 b8 89 10 19
        │
        ▼ 反序列化
Go struct {Name:"张三", Age:25}
```

---

## 2.2 第一个 `.proto` 文件

```protobuf
// 指定 proto 语法版本（必须是第一行，非注释）
syntax = "proto3";

// 包名（防止命名冲突）
package user;

// Go 包路径（生成的 Go 代码放在哪个包）
option go_package = "myproject/proto/user;user";

// 定义一个 Message（相当于 Go 的 struct）
message User {
  uint64 id = 1;        // 字段编号 = 1
  string name = 2;      // 字段编号 = 2
  int32 age = 3;        // 字段编号 = 3
  string email = 4;     // 字段编号 = 4
}
```

### 文件结构总结

```
syntax = "proto3";        // ① 语法版本（必须第一行）
package mypackage;        // ② 包名（可选）
option go_package = "...";// ③ Go 包路径（必须！）
import "other.proto";     // ④ 导入（可选）

message XXX { ... }       // ⑤ 消息定义
service XXX { ... }       // ⑥ 服务定义
```

---

## 2.3 基本数据类型

| Proto 类型 | Go 类型 | 说明 | 默认值 |
|-----------|---------|------|--------|
| `int32` | `int32` | 32位整数 | `0` |
| `int64` | `int64` | 64位整数 | `0` |
| `uint32` | `uint32` | 无符号32位 | `0` |
| `uint64` | `uint64` | 无符号64位 | `0` |
| `sint32` | `int32` | 有符号（ZigZag编码，适合负数） | `0` |
| `float` | `float32` | 32位浮点 | `0.0` |
| `double` | `float64` | 64位浮点 | `0.0` |
| `bool` | `bool` | 布尔 | `false` |
| `string` | `string` | UTF-8 字符串 | `""` |
| `bytes` | `[]byte` | 二进制数据 | `[]` |

---

## 2.4 字段编号：最关键的规则

```protobuf
message User {
  string name = 1;    // 编号 1
  int32 age = 2;      // 编号 2
  string email = 3;   // 编号 3
}
```

- 编号 **1-15**：用 1 字节编码（高频字段放这里）
- 编号 **16-2047**：用 2 字节编码
- 编号 **19000-19999**：保留，不能用
- 编号 **1-536870911**：合法范围
- **编号一旦分配，永远不要改！**（这是 Protobuf 向后兼容的基础）

---

## 2.5 repeated（数组）和 map

```protobuf
message User {
  // repeated = 数组/切片
  repeated string tags = 1;        // []string{"Go", "gRPC"}
  repeated int32 scores = 2;       // []int32{90, 80, 95}

  // map = 键值对
  map<string, string> metadata = 3;  // map[string]string
  map<int32, string> id_names = 4;   // map[int32]string
}
```

> ⚠️ map 的 key 只能是整数类型或 string，不能是 float/bytes/message/enum。

---

## 2.6 嵌套 Message

```protobuf
message Address {
  string country = 1;
  string city = 2;
  string street = 3;
}

message User {
  string name = 1;
  Address address = 2;  // 嵌套 Message
}

// 在 Go 中使用：
// user.Address.City
```

---

## 2.7 枚举（Enum）

```protobuf
enum Gender {
  UNKNOWN = 0;   // ⚠️ 第一个值必须是 0（默认值）
  MALE = 1;
  FEMALE = 2;
}

message User {
  string name = 1;
  Gender gender = 2;   // 默认值 UNKNOWN（0）
}
```

> ⚠️ **枚举第一个值必须是 0**。因为 proto3 的默认值是 0，如果第一个值不是 0，就无法区分"没设置"和"设置了枚举的第一个值"。

---

## 2.8 默认值（零值）陷阱

Proto3 所有字段都有默认值。**注意**：默认值在序列化时会被省略！

```
Proto 类型  默认值
int32      → 0
string     → ""（空字符串）
bool       → false
enum       → 0（第一个值）
repeated   → 空列表
message    → nil

关键问题：无法区分"没传"和"传了默认值"！
age = 0：是用户年龄真的为 0，还是前端没传？
name = ""：是用户名叫 ""，还是没传？

解决方案：
1. 用包装类型（如 google.protobuf.Int32Value）
2. 用 oneof（第03章）
3. 业务逻辑约定（0 就是没传）
```

---

## 常见错误

### 错误1：修改已上线字段的编号

```protobuf
// ❌ 上线后改了编号
string name = 1;   // 原来编号1
string name = 5;   // 上线后改成5 → 旧客户端读到乱数据！

// ✅ 永不改编号，只添加新字段
string name = 1;
string email = 5;  // 新字段用新编号
```

### 错误2：字段编号从 0 开始

```protobuf
message User {
  string name = 0;  // ❌ 编号不能是 0！最小是 1
}
```

### 错误3：枚举第一个值不是 0

```protobuf
enum Status {
  ACTIVE = 1;    // ❌ 第一个值不是 0
  INACTIVE = 2;
}
// proto3 默认值是 0，不存在 ACTIVE=1 的默认，导致默认为无效状态
```

---

## 本章小结

- `syntax = "proto3"` 必须是第一行
- 字段编号 1-15 用 1 字节，**永不修改已上线编号**
- `repeated` = 数组，`map<k,v>` = 字典
- 枚举第一个值必须是 0
- proto3 默认值无法区分"没传"和"传了默认值"

## 练习题

1. 定义一个 `Product` message（id/name/price/tags/category 枚举）。
2. 定义一个嵌套结构：`Order` 包含 `OrderItem`（repeated）。
3. proto3 默认值有什么陷阱？举例说明。
4. 为什么字段编号不能随便改？
