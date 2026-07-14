# 第20章：Stream —— 消息队列进阶

## 本章目标
掌握 Stream：Redis 5.0+ 的持久化消息队列

---

## 20.1 Stream 是什么

Stream 是 Redis 5.0 引入的**持久化消息队列**，解决了 List 和 Pub/Sub 的痛点：

| 特性 | List | Pub/Sub | Stream |
|------|------|---------|--------|
| 持久化 | ❌（消费即删） | ❌ | ✅ |
| 消息回溯 | ❌ | ❌ | ✅ |
| 消费者组 | ❌ | ❌ | ✅ |
| 消息确认 | ❌ | ❌ | ✅ |

---

## 20.2 基本操作

```bash
# XADD：添加消息（* = 自动生成ID）
XADD mystream * field1 value1 field2 value2
# "1705300000000-0" ← 自动生成的ID

XADD mystream * sensor_id 1234 temperature 25.5

# XLEN：消息数量
XLEN mystream

# XRANGE：范围查询
XRANGE mystream - +              # 所有消息
XRANGE mystream - + COUNT 10    # 最新10条

# XREVRANGE：反向查询（最新在前）
XREVRANGE mystream + - COUNT 10

# XDEL：删除消息
XDEL mystream "1705300000000-0"

# XREAD：读取消息（阻塞等待）
XREAD COUNT 2 STREAMS mystream 0   # 从头读2条
XREAD BLOCK 0 STREAMS mystream $   # 阻塞等待新消息
```

---

## 20.3 消费者组

```bash
# 创建消费者组
XGROUP CREATE mystream mygroup $  # $=从最新开始
XGROUP CREATE mystream mygroup 0  # 0=从头开始

# 消费者组读取
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream >
# > = 读取未分配给其他消费者的新消息

# 确认消息（ACK）
XACK mystream mygroup "1705300000000-0"

# 查看待处理消息
XPENDING mystream mygroup

# 查看消费者组信息
XINFO GROUPS mystream
XINFO CONSUMERS mystream mygroup
```

---

## 20.4 Stream vs List vs Pub/Sub

| 场景 | 推荐 |
|------|------|
| 简单任务队列 | List (BLPOP) |
| 实时通知（不持久） | Pub/Sub |
| 可靠消息队列 | Stream |
| 高吞吐量消息 | Kafka/RabbitMQ |

---

## 常见错误

### 错误1：忘记 ACK

```bash
# ❌ 读了消息但没 ACK → 消息卡在 PEL（待处理列表）
# 消费者反复收到同一批消息

# ✅ 处理完及时 ACK
XACK mystream mygroup "1705300000000-0"
```

### 错误2：Stream 内存无限增长

```bash
# Stream 会一直增长，需要定期裁剪
XTRIM mystream MAXLEN 10000    # 只保留最新 10000 条
# 或 XADD 时指定
XADD mystream MAXLEN ~ 10000 * field value
```

---

## 本章小结
- `XADD/XREAD/XRANGE` 基本操作
- `XREADGROUP/XACK` 消费者组
- Stream 比 List 更可靠（持久化+确认），比 Pub/Sub 更持久

## 练习题
1. 用 XADD/XREAD 实现消息发送和读取。
2. 创建消费者组，模拟两个消费者消费消息。
3. 对比 Stream 和 List 做消息队列的优劣。
