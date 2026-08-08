# 第27章：集群（Cluster）—— 数据分片

## 本章目标
理解 Cluster 原理 + 搭建 Redis Cluster

---

## 27.1 Cluster 是什么

Cluster 把数据**自动分片**到多个 Redis 节点，突破单机内存上限：

```
单机：                     Cluster（3主3从）：
┌──────────┐              ┌────┐ ┌────┐ ┌────┐
│  16GB    │              │16G │ │16G │ │16G │  = 48GB
│  所有数据 │              │槽0-5│ │槽5-9│ │槽9-16│
└──────────┘              └────┘ └────┘ └────┘
                           复制   复制   复制
                          ┌────┐ ┌────┐ ┌────┐
                          │从  │ │从  │ │从  │
                          └────┘ └────┘ └────┘
```

---

## 27.2 哈希槽（Hash Slot）

```
CRC16(key) % 16384 = 槽编号（0-16383）

Key "user:1"  → CRC16 → 12345 → 槽12345 → 节点B
Key "user:2"  → CRC16 → 6789  → 槽6789  → 节点A
Key "order:1" → CRC16 → 15000 → 槽15000 → 节点C

16384个槽均匀分布到所有Master节点
```

### 控制分片位置（Hash Tag）

```bash
# 只对 { } 内的部分计算哈希
SET {user:1}:name "张三"
SET {user:1}:age "25"
# 这两个 Key 一定在同一个槽 → 同一个节点
# 这样事务、交集运算才能跨 Key
```

---

## 27.3 创建集群

```bash
# 1. 启动 6 个 Redis 实例（3主3从）
# 每个实例配置：
cluster-enabled yes
cluster-config-file nodes.conf

# 2. 创建集群
redis-cli --cluster create \
  127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 \
  127.0.0.1:6382 127.0.0.1:6383 127.0.0.1:6384 \
  --cluster-replicas 1   # 每个主库配1个从库

# 3. 查看集群状态
CLUSTER INFO
CLUSTER NODES

# 4. 连接集群
redis-cli -c -p 6379    # -c = Cluster 模式
```

---

## 27.4 客户端重定向

```bash
# 访问错误节点时，自动重定向
SET user:1 "张三"
# → 如果槽不在这个节点，返回 MOVED 127.0.0.1:6380
# → redis-cli -c 自动跟随重定向

# Go 客户端也是如此
rdb := redis.NewClusterClient(&redis.ClusterOptions{
	Addrs: []string{"127.0.0.1:6379", "...6380", "...6381"},
})
// 自动处理重定向
```

---

## 27.5 集群限制

| 限制 | 说明 |
|------|------|
| 不支持多数据库 | 只能 SELECT 0 |
| 多 Key 操作需同槽 | `SINTER` 等需用 Hash Tag |
| 事务只能同槽 | MULTI 中的 Key 必须在同一节点 |
| 不支持 Lua 多 Key | 除非所有 Key 在同一槽 |

---

## 常见错误

### 错误1：没有 `-c` 模式连接集群

```bash
# ❌ 非集群模式连接 Cluster 节点
redis-cli -p 6379
SET user:1 "张三"  # (error) MOVED 12123 127.0.0.1:6380

# ✅ 加 -c
redis-cli -c -p 6379
SET user:1 "张三"  # OK（自动重定向）
```

### 错误2：忘记 Hash Tag

```bash
# ❌ 两个 Key 在不同槽 → 无法事务
MULTI
SET user:1:name "张三"
SET user:1:age "25"
EXEC  # 可能失败！

# ✅ 用 Hash Tag 放同一槽
SET {user:1}:name "张三"
SET {user:1}:age "25"
```

---

## 本章小结
- Cluster = 数据分片（16384 槽），水平扩展
- `CRC16(key) % 16384` → 路由到对应节点
- `{hash_tag}` 控制 Key 在同一槽
- 限制：不支持多 DB、多 Key 需同槽

## 练习题
1. 用 Docker 搭建 3 主 3 从的 Redis Cluster。
2. 测试 Key 分布：写入 100 个 Key，观察分布到哪些节点。
3. 使用 Hash Tag 让两个 Key 在同一个槽。
