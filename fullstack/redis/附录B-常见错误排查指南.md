# 附录B：Redis 常见错误排查指南

## 连接错误

| 错误 | 原因 | 解决 |
|------|------|------|
| Connection refused | Redis 没启动 | `docker start redis` 或启动服务 |
| NOAUTH Authentication required | 需要密码 | `AUTH password` |
| DENIED Redis is running in protected mode | 保护模式 | 设密码或关闭 protected-mode |

## 内存错误

| 错误 | 原因 | 解决 |
|------|------|------|
| OOM command not allowed | 内存满+淘汰noeviction | 改淘汰策略或加内存 |
| used_memory > maxmemory | 内存超限 | 分析 bigkey / 设过期 |

## 持久化错误

| 错误 | 原因 | 解决 |
|------|------|------|
| RDB 文件损坏 | 写入时断电 | 用备份恢复 |
| AOF 文件损坏 | 同上 | `redis-check-aof --fix` |
| fork 失败 | 内存不足 | 加内存或降低 RDB 频率 |

## 集群/主从错误

| 错误 | 原因 | 解决 |
|------|------|------|
| Slave 连接不上 Master | 网络不通/密码不一致 | 检查网络+配置 masterauth |
| MOVED 重定向 | 不是 Cluster 模式连接 | `redis-cli -c` |
| CLUSTERDOWN | 槽不全/节点挂 | `redis-cli --cluster fix` |

## 性能错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 慢查询多 | 复杂命令/bigkey | SLOWLOG + 优化 |
| CPU 100% | KEYS/大范围查询 | 禁用 KEYS/分批查询 |
| 内存碎片率高（>1.5） | 大量删除 | MEMORY PURGE / 重启 |
| 命中率低 | 缓存策略不对 | 分析 keyspace_hits/misses |

## 常用排查命令

```bash
INFO memory          # 内存
INFO stats           # 命中率
INFO replication     # 主从
CLUSTER INFO         # 集群
SLOWLOG GET 10       # 慢查询
CLIENT LIST          # 客户端
MEMORY DOCTOR        # 内存诊断（7.0+）
```
