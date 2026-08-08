# 第12章：Hash —— 对象的完美存储

## 本章目标
完全掌握 Hash 类型，用它存储用户、购物车、配置

---

## 12.1 Hash 是什么

Hash 是一个 **field-value 映射表**，最适合存"对象"：

```
Key: user:1
┌──────────────────┐
│ field    value   │
├──────────────────┤
│ name  →  张三    │
│ age   →  25      │
│ email →  zs@test │
└──────────────────┘
```

```bash
# 对比：String 存 JSON
SET user:1 '{"name":"张三","age":25,"email":"zs@test"}'
# 要改 age：GET → 解析JSON → 修改 → 序列化 → SET（麻烦）

# Hash：直接改单个字段
HSET user:1 age 26     # 只改 age，其他字段不受影响！
```

---

## 12.2 基本操作

```bash
# HSET：设置字段
HSET user:1 name "张三"
HSET user:1 age 25
HSET user:1 email "zs@test.com"

# 批量设置
HMSET user:1 name "张三" age 25 email "zs@test.com"

# HGET：获取单个字段
HGET user:1 name              # "张三"

# HMGET：获取多个字段
HMGET user:1 name age email   # "张三" "25" "zs@test.com"

# HGETALL：获取所有字段（⚠️ 字段多时慢！）
HGETALL user:1
# 1) "name"  2) "张三"
# 3) "age"   4) "25"
# 5) "email" 6) "zs@test.com"
```

---

## 12.3 字段操作

```bash
HDEL user:1 age               # 删除 age 字段

HEXISTS user:1 name           # (integer) 1 ← 存在
HEXISTS user:1 phone          # (integer) 0 ← 不存在

HLEN user:1                   # (integer) 3 ← 字段数量

HKEYS user:1                  # "name" "age" "email"
HVALS user:1                  # "张三" "25" "zs@test.com"
```

---

## 12.4 计数器

```bash
HSET cart:1 apple 3           # 购物车：3个苹果
HINCRBY cart:1 apple 2        # 再加2个 → 5
HINCRBY cart:1 apple -1       # 减1个 → 4

HINCRBYFLOAT stock:1 price 9.9  # 加 9.9
```

---

## 12.5 HSCAN 分批遍历

```bash
# ❌ HGETALL 字段多时阻塞
# ✅ HSCAN 分批
HSCAN user:1 0 COUNT 10
```

---

## 12.6 实战场景

### 购物车

```bash
# 用户1的购物车
HSET cart:1 sku:001 3         # SKU001 买3件
HSET cart:1 sku:002 1         # SKU002 买1件
HINCRBY cart:1 sku:001 1      # SKU001 再加1件
HDEL cart:1 sku:002           # 删除 SKU002
HLEN cart:1                   # 购物车有几种商品
HGETALL cart:1                # 查看购物车全部
```

### 用户信息

```bash
HSET profile:1 nickname "小张" avatar "https://..." bio "全栈工程师"
```

### 配置项

```bash
HSET config:app debug "false" max_connections "100" timeout "30"
HGET config:app max_connections
```

---

## 常见错误

### 错误1：HGETALL 大 Hash

```bash
# Hash 有 100 万个 field
HGETALL big:hash   # ⚠️ 一次性返回所有数据 → 内存爆 + 网络堵
# ✅ 用 HSCAN 或 HMGET 需要的字段
```

### 错误2：用 String 存对象而不考虑 Hash

```bash
# ❌ String 存 JSON：每次更新都要完整覆盖
SET user:1 '{"name":"张三","age":25,"email":"zs@test","phone":"138..."}'

# ✅ Hash 存对象：更新一个字段只改一个字段
HSET user:1 age 26
```

---

## 本章小结

| 命令 | 用途 |
|------|------|
| `HSET` / `HGET` / `HMGET` | 字段读写 |
| `HGETALL` / `HKEYS` / `HVALS` | 遍历（慎用 HGETALL） |
| `HINCRBY` | 字段计数器 |
| `HDEL` / `HEXISTS` / `HLEN` | 删除/判断/计数 |
| `HSCAN` | 分批安全遍历 |

## 练习题

1. 用 Hash 实现购物车：添加商品、修改数量、删除商品、查看全部。
2. 用 Hash 存储用户信息，分别更新不同字段。
3. 对比 String(JSON) 和 Hash 存储对象，在更新单个字段时的操作差异。
4. （思考题）什么场景下应该用 String(JSON) 而不是 Hash？
