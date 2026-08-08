# 第03章：Redis 数据模型与 Key 基础

## 本章目标
学完本章后，你将能够：
1. 理解 Redis 的 KV 数据模型
2. 遵循 Key 命名规范（冒号分隔）
3. 使用 SET/GET/EXISTS/DEL/TYPE 操作 Key
4. 使用 KEYS/SCAN 安全查找 Key
5. 使用 EXPIRE/TTL 控制 Key 过期

## 前置知识
- 需要先学习：第02章（安装与 redis-cli）

---

## 3.1 Redis 的 KV 模型

Redis 最核心的模型：**一个 Key 对应一个 Value**。

```
Key          →    Value (可以是不同类型)
─────────────────────────────────────────
"user:1"     →    {"name":"张三","age":25}     ← String 存 JSON
"user:1:info"→    {name:张三, age:25, email:...} ← Hash 存对象
"recent:news"→    [新闻1, 新闻2, 新闻3, ...]   ← List
"tags:article:1"→  {Go, Redis, Gin}           ← Set
"leaderboard"→    {张三:9500, 李四:8800, ...}  ← Sorted Set
```

Key 是**二进制安全**的字符串（最大 512MB），但实际使用中 Key 应该**短且有含义**。

---

## 3.2 Key 命名规范

```bash
# ✅ 好命名：用冒号分隔，层次清晰
user:1:name
user:1:email
article:100:title
article:100:view_count
cache:product:list
session:abc123

# ❌ 坏命名：无意义，难管理
a
u1
k123
user1name     # 不好区分 user:1:name 还是 user:1:name?
```

### 命名建议

| 规范 | 示例 | 说明 |
|------|------|------|
| 冒号分隔 | `user:1:profile` | 类似命名空间 |
| 业务名在前 | `cache:product:100` | 一眼看出用途 |
| 不包含空格 | `user_name` 而不是 `user name` | 避免解析问题 |
| 不要太长 | `u:1:name` 比 `user:1:user-name` 好 | 节省内存 |
| 统一大小写 | 全小写 `user:id` | 避免混乱 |

---

## 3.3 五种基本类型

| 类型 | 中文 | 特点 | 类比 |
|------|------|------|------|
| String | 字符串 | 最基础，存什么都行 | Go 的 string |
| Hash | 哈希 | field-value 对 | Go 的 map[string]string |
| List | 列表 | 有序，可重复 | Go 的 []string |
| Set | 集合 | 无序，不重复 | Go 的 set（无原生） |
| Sorted Set | 有序集合 | 有序，不重复，带分数 | 带权重的 Set |

---

## 3.4 基础 Key 操作

```bash
# SET：设置 Key
SET name "张三"
SET age 25
SET price 99.9

# GET：获取 Key
GET name        # "张三"
GET age         # "25"（存进去是数字，取出来是字符串）

# EXISTS：判断是否存在
EXISTS name     # (integer) 1
EXISTS xxx      # (integer) 0

# TYPE：查看类型
TYPE name       # string
TYPE listkey    # list

# DEL：删除（同步）
DEL name        # (integer) 1

# UNLINK：删除（异步，推荐）
UNLINK name     # (integer) 1
```

> 📌 `DEL` 是同步删除（阻塞），如果删大 Key 会卡。`UNLINK` 是异步删除（Redis 4.0+），生产推荐用 UNLINK。

---

## 3.5 查找 Key

```bash
# KEYS：模式匹配（⚠️ 生产禁用！）
KEYS *              # 所有 Key
KEYS user:*         # 以 user: 开头的
KEYS *:name         # 以 :name 结尾的

# SCAN：安全遍历（✅ 生产用这个）
SCAN 0 MATCH user:* COUNT 10
# 返回：(cursor, [匹配的key列表])
# 如果 cursor 不为 0，继续 SCAN cursor
```

### KEYS 为什么危险

```
KEYS * 遍历所有 Key → 时间复杂度 O(N)
如果有一千万个 Key，KEYS * 要遍历一千万次
遍历期间 Redis 单线程被卡住，其他请求全等 → 服务不可用
```

---

## 3.6 Key 过期控制

```bash
# EXPIRE：设置过期时间（秒）
SET temp "临时数据"
EXPIRE temp 10      # 10 秒后自动删除

# TTL：查看剩余时间
TTL temp            # (integer) 7  ← 还剩 7 秒
TTL name            # (integer) -1 ← 永不过期
TTL notexist        # (integer) -2 ← Key 不存在

# PEXPIRE：毫秒级过期
PEXPIRE temp 5000   # 5 秒后过期

# PTTL：查剩余毫秒
PTTL temp

# EXPIREAT：指定过期时间戳
EXPIREAT temp 1705300000  # Unix 时间戳

# PERSIST：取消过期
PERSIST temp        # 变为永不过期
```

### 过期时间的妙用

| 场景 | 过期时间 | 原因 |
|------|---------|------|
| 验证码 | 5 分钟 | 安全考虑 |
| 缓存商品详情 | 1 小时 | 商品信息不频繁变动 |
| Session | 30 分钟 | 登录超时 |
| 限流计数器 | 1 分钟 | 每分钟重置 |

---

## 3.7 SET 带过期（一条命令搞定）

```bash
# SET 直接带过期时间（原子操作）
SET verification_code "abc123" EX 300     # 300 秒后过期
SET lock:resource "1" EX 10 NX          # 不存在才设置，10秒过期

# SETEX：SET + EXPIRE（旧版语法）
SETEX key 300 value
```

> 📌 `SET key value EX seconds NX` 是分布式锁的基础！第11章详解。

---

## 常见错误

### 错误1：KEYS 用在生产环境

```bash
# ❌ 生产环境 KEYS * → Redis 卡死！
KEYS user:*

# ✅ 用 SCAN
SCAN 0 MATCH user:* COUNT 100
```

### 错误2：Key 没有过期时间，内存越占越多

```bash
# ❌ 缓存 Key 没有过期 → 内存泄漏
SET cache:article:1 "..."

# ✅ 设置合理的过期时间
SET cache:article:1 "..." EX 3600
```

### 错误3：TTL 返回值理解错误

```bash
TTL key
# -1 = 永不过期（没设 EXPIRE）
# -2 = Key 不存在（或已过期被删除了）
# >=0 = 剩余秒数
```

---

## 本章小结

- Redis 数据模型：Key → Value（Value 可以是 5 种类型之一）
- Key 命名：`业务:ID:属性`（如 `user:1:name`）
- 安全遍历：SCAN 代替 KEYS
- 过期控制：`SET key value EX seconds` 一条命令搞定
- DEL 同步删除 / UNLINK 异步删除

## 练习题

1. 用 `SET` 创建 5 个 Key，按规范命名。
2. 用 `KEYS` 和 `SCAN` 分别查找 Key，对比两者的行为。
3. 创建一个 10 秒后过期的 Key，用 `TTL` 观察倒计时。
4. 用 `PERSIST` 取消 Key 的过期时间。
5. 用 `TYPE` 和 `EXISTS` 检查已过期的 Key 是否还存在。
6. （思考题）为什么要用 `SCAN` 而不是 `KEYS`？SCAN 返回的 cursor 是什么？为什么它不阻塞？
