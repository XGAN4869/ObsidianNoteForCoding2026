# 第11章：String —— 万物皆字符串

## 本章目标
完全掌握 String 类型的所有命令和实战场景

## 前置知识：第03章（Key基础）

---

## 11.1 String 是什么

String 是 Redis 最基础的类型——二进制安全的字符串，最大 512MB。**万物皆可 String**：数字、JSON、序列化对象、二进制数据...

```bash
SET name "张三"
SET age 25            # 存数字，取出来是字符串 "25"
SET price 99.9
SET avatar "\x89PNG..."  # 二进制也OK
```

---

## 11.2 基础读写

```bash
# SET：完整语法
SET key value [EX seconds] [PX milliseconds] [NX|XX] [GET]
# EX：过期秒数  PX：过期毫秒
# NX：不存在才设  XX：存在才设
# GET：返回旧值（Redis 6.2+）

SET user:1:name "张三"
SET user:1:age 25 EX 3600        # 1小时过期
SET lock:task NX EX 30           # 不存在才设，30秒过期（分布式锁！）

# GET：获取值
GET user:1:name                 # "张三"
GET notexist                    # (nil)

# GETSET：返回旧值并设新值
GETSET counter 0                # (nil) ← 之前不存在
GETSET counter 100              # "0" ← 返回旧值

# MSET / MGET：批量操作
MSET user:1:name "张三" user:1:age "25" user:1:email "zs@test.com"
MGET user:1:name user:1:age user:1:email
# 批量减少网络往返，性能提升显著
```

---

## 11.3 子串操作

```bash
SET greeting "Hello Redis"

GETRANGE greeting 0 4          # "Hello"
GETRANGE greeting -5 -1        # "Redis"（负数从末尾数）

SETRANGE greeting 6 "World"    # 从位置6替换 → "Hello World"

APPEND greeting "!!!"            # 追加 → "Hello World!!!"
STRLEN greeting                 # 16
```

---

## 11.4 计数器（INCR 系列）

**String 最重要的能力之一**：原子性的计数器。

```bash
SET article:1:views 0

INCR article:1:views            # 1  （+1）
INCR article:1:views            # 2
INCRBY article:1:views 10       # 12 （+10）
DECR article:1:views            # 11 （-1）
DECRBY article:1:views 5        # 6  （-5）

INCRBYFLOAT price 0.5           # 0.5（浮点+）
INCRBYFLOAT price -0.3          # 0.2

# ⚠️ INCR 只能用于存数字的 String
SET name "张三"
INCR name                       # (error) 不是数字！
```

---

## 11.5 实战场景

### 场景1：缓存 JSON 对象

```bash
SET user:1 '{"name":"张三","age":25,"email":"zs@test.com"}' EX 3600
GET user:1
```

### 场景2：分布式锁

```bash
# 获取锁（NX=不存在才设，EX=30秒过期防死锁）
SET lock:order:1 unique_value NX EX 30

# 释放锁（用 Lua 脚本保证原子性，第30章）
# if redis.call("GET", KEYS[1]) == ARGV[1] then
#     return redis.call("DEL", KEYS[1])
# end
```

### 场景3：计数器（点赞、阅读量）

```bash
INCR article:100:likes          # 点赞+1
INCR article:100:views          # 阅读+1
GET article:100:likes           # 获取点赞数
```

### 场景4：限流

```bash
# 简单计数器限流：每个用户每分钟最多访问 10 次
INCR rate:user:1:minute
EXPIRE rate:user:1:minute 60    # 60 秒后重置
# 如果超过 10 次，拒绝访问
```

---

## 常见错误

### 错误1：INCR 用于非数字

```bash
SET key "hello"
INCR key  # (error) ERR value is not an integer or out of range
```

### 错误2：分布式锁不加过期

```bash
# ❌ 设锁不加过期 → 程序崩溃 → 锁永远不释放 → 死锁！
SET lock:task "1" NX

# ✅ 必须加过期
SET lock:task "1" NX EX 30
```

### 错误3：GETSET 理解偏差

```bash
SET a 1
GETSET a 2   # 返回 "1"（旧值），a 现在是 "2"
```

---

## 本章小结

| 命令 | 用途 |
|------|------|
| `SET key val EX sec NX` | 设值+过期+不存在才设 |
| `GET` / `MSET` / `MGET` | 读写/批量 |
| `GETRANGE` / `SETRANGE` | 子串操作 |
| `INCR` / `DECR` / `INCRBY` | 计数器 |
| `APPEND` / `STRLEN` | 追加/长度 |

## 练习题

1. 用 `SET NX EX` 实现一个简单的分布式锁。
2. 用 `INCR` 实现文章阅读量计数器。
3. 用 `MSET` / `MGET` 批量操作 100 个 Key，对比单条操作的性能。
4. （思考题）`SET key value NX EX 30` 这个命令在分布式锁中为什么需要 `NX`？如果没有会有什么问题？
