# 第13章：List —— 消息队列的基石

## 本章目标
掌握 List 类型：消息队列、最新列表、阻塞消费

---

## 13.1 List 是什么

List 是**双向链表**，有序，可重复。支持从两端插入和弹出：

```
Key: messages
┌────┬────┬────┬────┬────┐
│ A  │ B  │ C  │ D  │ E  │
└────┴────┴────┴────┴────┘
  ↑                       ↑
 LPUSH                   RPUSH
 LPOP←                    →RPOP
```

---

## 13.2 插入与弹出

```bash
# 左插入
LPUSH list a             # [a]
LPUSH list b             # [b, a]

# 右插入
RPUSH list c             # [b, a, c]

# 左弹出（取出并删除）
LPOP list                # "b" ← 最左边

# 右弹出
RPOP list                # "c" ← 最右边

# 阻塞弹出（队列为空时等待）
BLPOP queue 30           # 30秒内有数据就弹出，没数据返回 nil
BRPOP queue 30
```

---

## 13.3 范围与索引

```bash
RPUSH nums 1 2 3 4 5 6 7 8 9 10

# 范围查询（LRANGE 不会删除元素）
LRANGE nums 0 -1          # 全部 [1,2,3,...,10]
LRANGE nums 0 4           # 前5个 [1,2,3,4,5]
LRANGE nums -3 -1         # 最后3个 [8,9,10]

# 按索引获取
LINDEX nums 0             # "1"
LINDEX nums -1            # "10"

# 长度
LLEN nums                 # 10
```

---

## 13.4 删除与裁剪

```bash
RPUSH scores 80 90 70 90 60 90

LREM scores 2 90          # 从左删2个"90"
LREM scores -1 60         # 从右删1个"60"
LREM scores 0 70          # 删所有"70"

# 裁剪：只保留 [start, stop]
RPUSH data 1 2 3 4 5
LTRIM data 0 2            # [1,2,3] ← 只保留前3个

# 指定位置插入
LINSERT scores BEFORE 70 65  # 在第一个70前面插65
LINSERT scores AFTER 70 75   # 在第一个70后面插75
```

---

## 13.5 实战场景

### 消息队列

```bash
# 生产者：往队尾加任务
RPUSH task:queue "send_email:1"
RPUSH task:queue "resize_image:2"

# 消费者：从队头取任务（阻塞等待）
BRPOP task:queue 0        # 0=无限等待
```

### 最新列表（固定容量）

```bash
# 最新 10 条新闻
LPUSH news "新闻1"
LPUSH news "新闻2"
...
LPUSH news "新闻11"
LTRIM news 0 9            # 只保留最新10条
LRANGE news 0 -1          # 查看最新10条
```

---

## 常见错误

### 错误1：用 LRANGE 遍历大 List

```bash
# ❌ 百万级 List，LRANGE 0 -1 卡死
# ✅ 分页取
LRANGE biglist 0 99       # 每次只取100条
```

### 错误2：消息队列用 LPOP 而不是 BLPOP

```bash
# ❌ LPOP：队列为空立即返回nil，需要循环轮询 → CPU 浪费
while LPOP queue; done

# ✅ BLPOP：阻塞等待，有数据才返回 → 省 CPU
BLPOP queue 0
```

---

## 本章小结

| 命令 | 用途 |
|------|------|
| `LPUSH` / `RPUSH` | 左/右插入 |
| `LPOP` / `RPOP` | 左/右弹出 |
| `BLPOP` / `BRPOP` | 阻塞弹出（消息队列） |
| `LRANGE` | 范围查询 |
| `LTRIM` | 裁剪（固定长度列表） |
| `LLEN` / `LINDEX` / `LREM` / `LINSERT` | 长度/索引/删除/插入 |

## 练习题

1. 用 List 实现一个简单的消息队列（生产者 RPUSH，消费者 BRPOP）。
2. 实现一个"最新10条"的列表（LPUSH + LTRIM）。
3. 对比 LPOP 和 BLPOP 在空队列时的行为。
4. （思考题）List 做消息队列有哪些缺陷？什么时候该用 Stream 代替？
