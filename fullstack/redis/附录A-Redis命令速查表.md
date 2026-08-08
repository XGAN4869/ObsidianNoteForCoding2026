# 附录A：Redis 命令速查表

## Key 操作

| 命令 | 说明 | 复杂度 |
|------|------|--------|
| `SET key val [EX s] [NX\|XX]` | 设置值 | O(1) |
| `GET key` | 获取值 | O(1) |
| `DEL key` | 删除（同步） | O(N) |
| `UNLINK key` | 异步删除 | O(1) |
| `EXISTS key` | 判断存在 | O(1) |
| `TYPE key` | 查看类型 | O(1) |
| `EXPIRE key sec` | 设过期（秒） | O(1) |
| `TTL key` | 剩余时间 | O(1) |
| `SCAN cursor MATCH p` | 安全遍历 | O(1)每批 |
| `KEYS pattern` | 遍历（⛔禁用） | O(N) |

## String

| 命令 | 说明 |
|------|------|
| `SET/GET/MSET/MGET` | 读写/批量 |
| `SETNX/SETEX` | 不存在才设/带过期 |
| `INCR/DECR/INCRBY` | 计数器 |
| `APPEND/STRLEN` | 追加/长度 |
| `GETRANGE/SETRANGE` | 子串 |

## Hash

| 命令 | 说明 |
|------|------|
| `HSET/HGET/HMSET/HMGET` | 字段读写 |
| `HGETALL/HKEYS/HVALS` | 遍历（⚠️慎用） |
| `HDEL/HEXISTS/HLEN` | 删除/判断/计数 |
| `HINCRBY/HSCAN` | 计数/安全遍历 |

## List

| 命令 | 说明 |
|------|------|
| `LPUSH/RPUSH` | 左/右插入 |
| `LPOP/RPOP/BLPOP/BRPOP` | 弹出/阻塞弹出 |
| `LRANGE/LINDEX/LLEN` | 范围/索引/长度 |
| `LREM/LTRIM/LINSERT` | 删除/裁剪/插入 |

## Set

| 命令 | 说明 |
|------|------|
| `SADD/SREM/SMEMBERS` | 增删查 |
| `SINTER/SUNION/SDIFF` | 交/并/差 |
| `SISMEMBER/SCARD` | 判断/计数 |
| `SRANDMEMBER/SPOP` | 随机取/弹 |
| `SSCAN` | 安全遍历 |

## Sorted Set

| 命令 | 说明 |
|------|------|
| `ZADD/ZREM` | 添加/删除 |
| `ZRANGE/ZREVRANGE` | 按排名获取 |
| `ZRANGEBYSCORE` | 按分数获取 |
| `ZSCORE/ZRANK/ZREVRANK` | 分数/排名 |
| `ZINCRBY` | 增加分数 |
| `ZCOUNT/ZCARD` | 计数 |
| `ZINTERSTORE/ZUNIONSTORE` | 交/并存储 |

## 其他类型

| 类型 | 核心命令 |
|------|---------|
| Bitmap | `SETBIT/GETBIT/BITCOUNT/BITOP` |
| HyperLogLog | `PFADD/PFCOUNT/PFMERGE` |
| Geo | `GEOADD/GEODIST/GEORADIUS/GEORADIUSBYMEMBER` |
| Stream | `XADD/XREAD/XREADGROUP/XACK` |

## 事务/Lua/PubSub

| 命令 | 说明 |
|------|------|
| `MULTI/EXEC/DISCARD` | 事务 |
| `WATCH/UNWATCH` | 乐观锁 |
| `EVAL/EVALSHA` | Lua 脚本 |
| `SUBSCRIBE/PUBLISH` | 发布订阅 |

## 运维

| 命令 | 说明 |
|------|------|
| `INFO [section]` | 服务器信息 |
| `CONFIG GET/SET` | 配置 |
| `SLOWLOG GET/LEN/RESET` | 慢查询 |
| `MEMORY USAGE/USAGE key` | 内存诊断 |
| `CLIENT LIST/KILL` | 客户端 |
| `CLUSTER INFO/NODES` | 集群信息 |
| `BGSAVE/BGREWRITEAOF` | 持久化 |

## ⛔ 生产禁用

| 命令 | 风险 | 替代 |
|------|------|------|
| `KEYS *` | 阻塞全库 | `SCAN` |
| `FLUSHDB/FLUSHALL` | 删库 | `rename-command` |
| `CONFIG SET`（暴露） | 安全风险 | `rename-command` |
| `MONITOR` | 性能杀手 | `SLOWLOG` |
| `SAVE` | 阻塞 | `BGSAVE` |
