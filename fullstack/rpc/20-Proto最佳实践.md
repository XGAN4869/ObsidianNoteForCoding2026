# 第20章：Proto 最佳实践与规范

## 本章目标
掌握 proto 文件组织、命名规范、向后兼容

---

## 20.1 文件组织

```
proto/
├── common/
│   ├── base.proto         # 公共消息
│   └── error.proto        # 错误定义
├── user/
│   └── v1/
│       └── user.proto     # 用户服务 v1
└── order/
    └── v1/
        └── order.proto    # 订单服务 v1
```

### 命名规范

```
包名：小写，点分隔  package myapp.user.v1
消息：大驼峰         message UserRequest {}
字段：蛇形           string user_name = 1;
服务：大驼峰+Service service UserService {}
方法：大驼峰         rpc GetUser(...) {}
枚举：大驼峰         enum UserStatus {}
枚举值：大写下划线    USER_STATUS_ACTIVE
```

---

## 20.2 向后兼容规则

```
✅ 安全：
- 添加新字段（新编号）
- 添加新 Message/Enum/RPC
- 删除字段（用 reserved 标记）

❌ 不安全：
- 改字段编号（破坏性最大！）
- 改字段类型（int32 → string）
- 删除 required 字段（proto2）
```

---

## 20.3 API 版本管理

```
方案1：路径版本
proto/user/v1/user.proto → package user.v1
proto/user/v2/user.proto → package user.v2

方案2：服务名版本
service UserServiceV1 {}
service UserServiceV2 {}
```

---

## 本章小结
- 目录：`{服务}/{版本}/` 结构
- 命名：消息大驼峰、字段蛇形
- 向后兼容第一原则：**永不改字段编号**
- 版本管理：package/路径体现版本

## 练习题
1. 用 buf lint 检查你的 proto 文件是否符合规范。
2. 设计一个支持 v1/v2 两个版本的 API 目录结构。
