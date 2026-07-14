# 第15章：Sorted Set —— 排行榜神器

## 本章目标
掌握 ZSet：排行榜、延时队列、分数范围查询

---

## 15.1 Sorted Set 是什么

ZSet = Set + Score（分数）。每个元素有一个 score，按 score 排序：

```
Key: leaderboard
┌──────────┬───────┐
│  member  │ score │
├──────────┼───────┤
│  张三    │  9500 │  ← 第1名
│  李四    │  8800 │  ← 第2名
│  王五    │  7200 │  ← 第3名
│  赵六    │  6500 │  ← 第4名
└──────────┴───────┘
```

---

## 15.2 基本操作

```bash
# ZADD：添加元素
ZADD leaderboard 9500 "张三"
ZADD leaderboard 8800 "李四"
ZADD leaderboard 7200 "王五"
ZADD leaderboard 6500 "赵六"

# ZRANGE：按排名（索引）升序获取
ZRANGE leaderboard 0 -1              # 全部
ZRANGE leaderboard 0 -1 WITHSCORES   # 带分数
ZRANGE leaderboard 0 2               # 前3名

# ZREVRANGE：降序获取
ZREVRANGE leaderboard 0 -1 WITHSCORES # 分数从高到低

# ZSCORE：获取分数
ZSCORE leaderboard "张三"            # "9500"

# ZRANK：获取排名（升序，0开始）
ZRANK leaderboard "张三"             # 3（第4名，因为升序）

# ZREVRANK：获取排名（降序，0开始）
ZREVRANK leaderboard "张三"          # 0（第1名，因为降序）

# ZCARD：元素数量
ZCARD leaderboard                    # 4

# ZREM：删除
ZREM leaderboard "赵六"

# ZINCRBY：增加分数
ZINCRBY leaderboard 500 "张三"       # 10000（9500+500）
```

---

## 15.3 按分数范围查询

```bash
# 分数 8000-10000 之间的
ZRANGEBYSCORE leaderboard 8000 10000 WITHSCORES
# 分数 8000-10000，偏移1个，限2个
ZRANGEBYSCORE leaderboard 8000 10000 LIMIT 1 2

# ZCOUNT：分数范围内的数量
ZCOUNT leaderboard 7000 10000       # 3

# 按分数删除
ZREMRANGEBYSCORE leaderboard 0 5000  # 删 0-5000 分的

# 按排名删除
ZREMRANGEBYRANK leaderboard 0 1      # 删最后两名
```

---

## 15.4 集合运算

```bash
ZADD z1 1 "a" 2 "b" 3 "c"
ZADD z2 2 "a" 4 "b" 6 "d"

# 交集（sum=分数相加, min=取最小, max=取最大）
ZINTERSTORE result 2 z1 z2 AGGREGATE SUM
# result: a:3(1+2), b:6(2+4)

# 并集
ZUNIONSTORE result 2 z1 z2 AGGREGATE MAX
# result: a:2, b:4, c:3, d:6
```

---

## 15.5 实战场景

### 排行榜

```bash
# 玩家得分
ZADD game:rank 1000 "player:A"
ZADD game:rank 2000 "player:B"
# 加分数
ZINCRBY game:rank 500 "player:A"
# 前10名
ZREVRANGE game:rank 0 9 WITHSCORES
# 查看某玩家排名
ZREVRANK game:rank "player:A"
```

### 延时队列

```bash
# score = 执行时间戳（现在+延迟秒数）
ZADD delay:queue 1705300000 "task:order:1:send_sms"
ZADD delay:queue 1705300100 "task:order:2:send_sms"

# 定时取到期的任务
ZRANGEBYSCORE delay:queue 0 1705300050 LIMIT 0 10
# 执行后删除
ZREM delay:queue "task:order:1:send_sms"
```

### 带权重的集合

```bash
# 热搜词（score=搜索次数）
ZADD hot:keywords 10000 "AI" 8000 "Golang" 6000 "Redis"
ZINCRBY hot:keywords 1 "Redis"   # 每次搜索+1
```

---

## 常见错误

### 错误1：ZRANK vs ZREVRANK 搞混

```bash
ZREVRANK key "张三"   # 降序排名（分数最高的排第0）
ZRANK key "张三"      # 升序排名（分数最低的排第0）
# 排行榜场景用 ZREVRANK
```

### 错误2：ZADD 重复元素

```bash
ZADD key 100 "a"
ZADD key 200 "a"      # 不会重复添加！会更新分数
ZCARD key             # 1
```

### 错误3：大 ZSet 用 ZRANGE 取全部

```bash
# ❌ 百万级 ZSet 取全部
ZRANGE leaderboard 0 -1   # 卡死
# ✅ 分页取
ZRANGE leaderboard 0 99
```

---

## 本章小结

| 命令 | 用途 |
|------|------|
| `ZADD` / `ZREM` | 添加/删除 |
| `ZRANGE` / `ZREVRANGE` | 按排名范围获取 |
| `ZRANGEBYSCORE` | 按分数范围获取 |
| `ZSCORE` / `ZRANK` / `ZREVRANK` | 分数/排名 |
| `ZINCRBY` | 增加分数 |
| `ZINTERSTORE` / `ZUNIONSTORE` | 交/并集 |

## 练习题

1. 用 ZSet 实现游戏排行榜：添加分数、加分数、查前10名、查某玩家排名。
2. 用 ZSet 实现延时队列：添加延迟任务、取到期的任务。
3. 用 ZINCRBY 实现热搜词排名。
4. （思考题）ZSet 的底层是什么数据结构？为什么它同时支持按排名和按分数查询？
