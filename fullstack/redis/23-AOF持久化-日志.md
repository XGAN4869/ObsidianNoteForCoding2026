# 第23章：AOF 持久化 —— 日志

## 本章目标
理解 AOF 日志 + RDB+AOF 混合持久化

---

## 23.1 AOF 是什么

AOF（Append Only File）将每条**写命令**追加到日志文件。

```
SET name "张三"  → appendonly.aof 追加: SET name "张三"
INCR counter     → appendonly.aof 追加: INCR counter
```

---

## 23.2 AOF 配置

```bash
# redis.conf
appendonly yes              # 开启 AOF
appendfilename "appendonly.aof"

# fsync 策略（数据安全 vs 性能）
appendfsync always          # 每条命令都 fsync（最安全，最慢）
appendfsync everysec        # 每秒 fsync 一次（✅ 推荐）
appendfsync no              # 由 OS 决定何时 fsync（最不安全）
```

| fsync 策略 | 丢数据风险 | 性能 |
|-----------|----------|------|
| always | 不丢 | 最慢 |
| everysec | 最多丢 1 秒 | 适中 ✅ |
| no | 可能丢很多 | 最快 |

---

## 23.3 AOF 重写

AOF 文件随时间增长，重写可以压缩：

```bash
# 原 AOF 文件：
SET counter 1
INCR counter      # counter=2
INCR counter      # counter=3
INCR counter      # counter=4

# 重写后（等价）：
SET counter 4

# 触发重写
BGREWRITEAOF                  # 手动触发
# 自动触发配置
auto-aof-rewrite-percentage 100  # 增长100%时触发
auto-aof-rewrite-min-size 64mb   # 最小64MB才触发
```

---

## 23.4 RDB + AOF 混合持久化（Redis 4.0+）

```bash
aof-use-rdb-preamble yes    # 开启混合持久化
```

```
appendonly.aof 文件结构：
[RDB 快照数据] + [AOF 增量命令]
└── 重写时生成 ──┘   └── 重写后追加 ──┘

优势：RDB 的恢复速度 + AOF 的数据安全性
```

---

## 23.5 RDB vs AOF 对比

| 维度 | RDB | AOF |
|------|-----|-----|
| 文件大小 | 小（压缩二进制） | 大（文本命令） |
| 恢复速度 | 快 | 慢（逐条执行命令） |
| 数据安全 | 可能丢几分钟数据 | 最多丢 1 秒（everysec） |
| 写性能 | 快 | 稍慢（写磁盘） |
| 推荐场景 | 备份、快速恢复 | 数据安全要求高 |

> 📌 **生产推荐**：RDB + AOF **同时开启**（混合持久化），鱼和熊掌兼得。

---

## 常见错误

### 错误1：只用 RDB 不用 AOF

```
场景：RDB 每 5 分钟一次快照。4 分 59 秒时 Redis 崩溃。
→ 丢失了 4 分 59 秒的数据。
```

### 错误2：appendfsync always 导致性能极差

```bash
# always：每条命令都 fsync → QPS 从 10 万降到几千
# ✅ 用 everysec 平衡
```

---

## 本章小结
- AOF = 写命令日志（appendfsync everysec 推荐）
- AOF 重写压缩文件
- 混合持久化 = RDB 快速恢复 + AOF 数据安全
- 生产：RDB + AOF 双开

## 练习题
1. 开启 AOF（everysec），写数据后查看 appendonly.aof 文件内容。
2. 手动触发 AOF 重写，对比重写前后的文件大小。
3. 开启混合持久化，观察 aof 文件头部是否有 RDB 格式数据。
