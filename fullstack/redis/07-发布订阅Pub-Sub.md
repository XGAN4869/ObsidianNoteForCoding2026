# 第07章：发布订阅（Pub/Sub）

## 本章目标
理解 Redis Pub/Sub 模型，掌握 SUBSCRIBE/PUBLISH/PSUBSCRIBE

---

## 7.1 发布订阅模型

```
Publisher(发布者)  →  Channel(频道)  →  Subscriber(订阅者)
   "新消息"           news               收到 "新消息"
```

### 基本操作

```bash
# 终端1：订阅
SUBSCRIBE news          # 订阅 news 频道
# 进入订阅模式，等待消息...

# 终端2：发布
PUBLISH news "Hello Redis Pub/Sub"
# (integer) 1  ← 1个订阅者收到了消息

# 终端1 显示：
# 1) "message"
# 2) "news"
# 3) "Hello Redis Pub/Sub"
```

---

## 7.2 模式订阅

```bash
# 订阅所有 news:* 频道
PSUBSCRIBE news:*

# 发布到 news:sports
PUBLISH news:sports "体育新闻"

# 发布到 news:tech
PUBLISH news:tech "科技新闻"
# 订阅者都能收到
```

---

## 7.3 Pub/Sub 的局限性

| 缺点 | 说明 |
|------|------|
| 不持久化 | 消息发了就没了，离线收不到 |
| 不重放 | 不能回过头看历史消息 |
| 不确认 | 发了不管订阅者是否处理成功 |
| 可靠性差 | 网络断开期间消息丢失 |

> 📌 需要可靠消息 → 用 Stream（第20章）或 RabbitMQ/Kafka。

---

## 本章小结
- `SUBSCRIBE` 订阅频道 / `PUBLISH` 发布消息
- `PSUBSCRIBE pattern` 模式订阅
- Pub/Sub 简单但不持久，适合实时通知、WebSocket 推送

## 练习题
1. 开两个 redis-cli 终端，一个订阅一个发布。
2. 用 PSUBSCRIBE 订阅 `order:*` 模式。
3. 总结 Pub/Sub 的三个局限性。
