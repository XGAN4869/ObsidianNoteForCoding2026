# 第26章：哨兵（Sentinel）—— 自动故障转移

## 本章目标
理解 Sentinel 原理 + 配置 Sentinel 集群

---

## 26.1 Sentinel 是什么

Sentinel 监控 Master，当 Master 挂了，**自动**把 Slave 提升为 Master：

```
故障前：
  Master(宕机)  ← Sentinel 监控
  Slave1
  Slave2

故障后（Sentinel 自动操作）：
  Slave1 → 新 Master ↑
  Slave2 → 复制新 Master
  客户端 → Sentinel 问新 Master 地址
```

---

## 26.2 Sentinel 工作原理

```
步骤1：主观下线（SDOWN）
  Sentinel1 发现 Master 无响应（down-after-milliseconds）

步骤2：客观下线（ODOWN）
  多个 Sentinel 投票确认 Master 真挂了（quorum）

步骤3：选举 Leader
  Sentinel 们选一个 Leader 执行故障转移

步骤4：故障转移
  Leader 选一个最优 Slave → 提升为 Master → 通知其他 Slave 复制新 Master

步骤5：通知客户端
  客户端通过 Sentinel 获取新 Master 地址
```

---

## 26.3 配置 Sentinel

```bash
# sentinel.conf（至少需要 3 个 Sentinel 实例）
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
#                            ↑ 主库地址     ↑ quorum=2个Sentinel同意才算挂
sentinel down-after-milliseconds mymaster 5000  # 5秒无响应判为下线
sentinel failover-timeout mymaster 10000        # 故障转移超时
sentinel parallel-syncs mymaster 1              # 同时同步的Slave数

# 启动 Sentinel
redis-sentinel sentinel.conf
```

---

## 26.4 客户端连接 Sentinel

```go
// go-redis 的 Sentinel 模式（第34章详解）
rdb := redis.NewFailoverClient(&redis.FailoverOptions{
	MasterName:    "mymaster",
	SentinelAddrs: []string{"127.0.0.1:26379", "127.0.0.1:26380", "127.0.0.1:26381"},
})
// 自动发现新 Master，故障切换无感知！
```

---

## 26.5 Sentinel 限制

| 限制 | 说明 |
|------|------|
| 不处理数据分片 | 所有数据全量复制，单 Master 容量上限 |
| 切换期间不可写 | 故障转移中写操作会失败 |
| 至少 3 个 Sentinel | 防止脑裂（网络分区导致双主） |

---

## 常见错误

### 错误1：少于 3 个 Sentinel

```
2 个 Sentinel → 网络分区 → 各自认为对方挂了 → 2 个 Master（脑裂）
至少 3 个 → 多数派投票 → 避免脑裂
```

### 错误2：quorum 设为 1

```
quorum=1 → 1个Sentinel判定下线就切换 → 网络抖动误切换
quorum=n/2+1 → 多数派确认 → 稳定
```

---

## 本章小结
- Sentinel = 监控 + 自动故障转移
- 至少 3 个 Sentinel + quorum > n/2
- 客户端连接 Sentinel 模式，自动发现新 Master
- 不解决数据分片，单 Master 容量上限

## 练习题
1. 配置 1 主 2 从 + 3 Sentinel。
2. 模拟主库宕机，观察 Sentinel 自动切换。
3. 查看 Sentinel 日志，理解选举过程。
