# Redis 从入门到精通：完整教程目录

> **教程定位**：本教程面向有后端开发基础、Redis 零基础的读者，从内存数据库概念讲起，逐步深入到五大基本类型、高级数据结构、持久化、主从复制、哨兵集群、Lua 脚本、内存优化、Go 客户端实战等高级主题。每章配有可执行的 Redis 命令、Go 代码示例、常见错误分析、练习题，帮助你在实战中掌握 Redis 7.x。

---

## 阅读指南

本教程共 38 章 + 3 个附录，按 9 个阶段组织：

| 阶段 | 章节范围 | 核心目标 | 建议学习时间 |
|------|----------|----------|-------------|
| Phase 1 | 第01-04章 | Redis 概念 + 安装 + 第一个命令 | 1-2天 |
| Phase 2 | 第05-10章 | 常用命令与 Key 管理 | 2-3天 |
| Phase 3 | 第11-16章 | 五大基本数据类型全掌握 | 4-6天 |
| Phase 4 | 第17-21章 | 高级数据类型 | 3-4天 |
| Phase 5 | 第22-25章 | 持久化与主从复制 | 3-4天 |
| Phase 6 | 第26-29章 | 高可用：哨兵与集群 | 3-4天 |
| Phase 7 | 第30-33章 | 事务、Lua、内存与安全 | 3-4天 |
| Phase 8 | 第34-37章 | Go 客户端实战（go-redis） | 3-4天 |
| Phase 9 | 第38章 | 总复习 + 面试宝典 | 1-2天 |

### 学习建议

1. **必须动手敲命令**：Redis 是实操型技术，每个命令都要在 `redis-cli` 中敲一遍
2. **理解数据结构比记命令更重要**：知道 String/Hash/List/Set/ZSet 各自适合什么场景，比背命令更有价值
3. **Docker 启动 Redis 最方便**：`docker run -d --name redis -p 6379:6379 redis:7`
4. **练习必须做**：每章末尾的练习题是巩固知识的关键
5. **Phase 8 整合全栈**：学完 Go 客户端后，你能把 Redis 集成到 Gin+GORM 项目中

---

## Phase 1：Redis 概念与环境搭建

### 第 01 章：Redis 是什么 —— 从零认识 Redis
- 什么是 Redis（内存数据库，不"只是缓存"）
- Redis 为什么快（内存、单线程、IO多路复用）
- Redis 能做什么（缓存、排行榜、计数器、分布式锁、消息队列...）
- Redis vs MySQL vs Memcached 对比
- Redis 核心特点一览

### 第 02 章：安装 Redis 与 redis-cli
- Docker 一键安装（推荐）/ Mac Homebrew / Linux apt / Windows WSL2
- `redis-server` 启动服务 / `redis-cli` 连接
- PING / HELP / 退出
- `redis.conf` 配置文件概览
- `CONFIG GET` / `CONFIG SET`

### 第 03 章：Redis 数据模型与 Key 基础
- KV 模型：Key → Value
- 五大基本类型全景图
- Key 命名规范（`user:1:name`）
- SET / GET / EXISTS / DEL / TYPE
- KEYS / SCAN 查找 Key
- EXPIRE / TTL / PERSIST 过期控制

### 第 04 章：Redis 配置与启动优化
- redis.conf 核心配置项详解
- bind / port / requirepass 网络与安全
- maxmemory / maxmemory-policy 内存限制
- SELECT 切换数据库
- INFO 服务器信息
- 启动时指定配置文件

---

## Phase 2：常用命令与 Key 管理

### 第 05 章：通用命令全集
- KEYS（危险！）/ SCAN（安全遍历）
- DEL / UNLINK / EXISTS / TYPE
- RENAME / RENAMENX / RANDOMKEY
- MOVE / DBSIZE / FLUSHDB / FLUSHALL

### 第 06 章：过期时间与内存淘汰
- EXPIRE / PEXPIRE / EXPIREAT / TTL / PTTL / PERSIST
- 过期删除策略（惰性 + 定期）
- maxmemory-policy 八种淘汰策略详解

### 第 07 章：发布订阅（Pub/Sub）
- SUBSCRIBE / PUBLISH / PSUBSCRIBE
- Pub/Sub 的优缺点
- vs Kafka / RabbitMQ 对比

### 第 08 章：事务（Transaction）
- MULTI / EXEC / DISCARD
- WATCH / UNWATCH 乐观锁
- Redis 事务 vs MySQL 事务（不支持回滚！）

### 第 09 章：管道（Pipeline）
- Pipeline 原理（批量命令，减少 RTT）
- Pipeline vs 事务的区别
- 性能对比（1条 vs 10000条）

### 第 10 章：慢查询日志与性能监控
- SLOWLOG GET / LEN / RESET
- INFO 命令详解（Server/Clients/Memory/Stats/Replication）
- MONITOR（仅调试）/ LATENCY

---

## Phase 3：五大基本数据类型全掌握

### 第 11 章：String —— 万物皆字符串
- SET/GET/SETNX/SETEX/MSET/MGET/GETSET
- GETRANGE/SETRANGE/APPEND/STRLEN
- INCR/DECR/INCRBY/INCRBYFLOAT 计数器
- 实战：缓存对象、计数器、分布式锁、限流

### 第 12 章：Hash —— 对象的完美存储
- HSET/HGET/HMSET/HMGET/HGETALL
- HDEL/HEXISTS/HLEN/HKEYS/HVALS
- HINCRBY/HSCAN
- 实战：用户信息、购物车、配置项

### 第 13 章：List —— 消息队列的基石
- LPUSH/RPUSH/LPOP/RPOP/LRANGE
- LINDEX/LLEN/LREM/LTRIM/LINSERT
- BLPOP/BRPOP 阻塞弹出
- 实战：消息队列、最新列表、任务队列

### 第 14 章：Set —— 集合运算
- SADD/SREM/SMEMBERS/SISMEMBER/SCARD
- SRANDMEMBER/SPOP
- SINTER/SUNION/SDIFF 交并差运算
- 实战：标签、共同好友、抽奖、去重

### 第 15 章：Sorted Set —— 排行榜神器
- ZADD/ZREM/ZSCORE/ZRANK/ZREVRANK
- ZRANGE/ZRANGEBYSCORE/ZCOUNT/ZCARD
- ZINCRBY/ZINTERSTORE/ZUNIONSTORE
- 实战：排行榜、延时队列、带权重的集合

### 第 16 章：五大类型实战对比与总结
- 五种类型全面对比（有序/唯一/适用场景/底层结构）
- 电商全场景选型指南
- 底层数据结构简介（SDS、ziplist、skiplist、hashtable）

---

## Phase 4：高级数据类型

### 第 17 章：Bitmap —— 亿级用户签到
- SETBIT/GETBIT/BITCOUNT/BITPOS/BITOP
- 实战：用户签到、在线状态统计

### 第 18 章：HyperLogLog —— 海量去重计数
- PFADD/PFCOUNT/PFMERGE
- 实战：UV（独立访客）统计

### 第 19 章：Geo —— 地理位置
- GEOADD/GEOPOS/GEODIST/GEORADIUS/GEORADIUSBYMEMBER
- 实战：附近的人、附近的商家

### 第 20 章：Stream —— 消息队列进阶
- XADD/XREAD/XREADGROUP/XACK
- Stream vs List vs Pub/Sub vs Kafka

### 第 21 章：高级类型总结与底层原理
- 八种类型全景图与选型决策树
- 底层数据结构深入（SDS、链表、跳表、哈希表、压缩列表）

---

## Phase 5：持久化与主从复制

### 第 22 章：RDB 持久化 —— 快照
- SAVE/BGSAVE/save 配置项
- RDB 优缺点（恢复快，可能丢数据）

### 第 23 章：AOF 持久化 —— 日志
- appendonly/appendfsync/BGREWRITEAOF
- RDB + AOF 混合持久化
- RDB vs AOF 对比与选择

### 第 24 章：主从复制
- REPLICAOF / 全量复制 vs 增量复制
- PSYNC/复制偏移量/复制积压缓冲区
- 读写分离与主从延迟

### 第 25 章：备份与灾难恢复
- 备份策略 / 恢复流程 / 模拟演练

---

## Phase 6：高可用与集群

### 第 26 章：哨兵（Sentinel）
- Sentinel 工作原理（主观下线→客观下线→选举→转移）
- sentinel.conf 配置 / Sentinel 集群

### 第 27 章：集群（Cluster）
- 哈希槽（16384）/ CRC16 分布
- `redis-cli --cluster create` / 节点伸缩

### 第 28 章：集群运维实战
- 故障模拟、槽迁移、扩容缩容

### 第 29 章：高可用方案对比
- 主从 vs Sentinel vs Cluster 选型指南

---

## Phase 7：高级特性

### 第 30 章：Lua 脚本
- EVAL/EVALSHA/SCRIPT LOAD/redis.call()
- 实战：分布式限流、抢购扣库存

### 第 31 章：内存管理与优化
- MEMORY USAGE/STATS/DOCTOR/PURGE
- 小对象压缩 / bigkey 排查 / 热 key 处理

### 第 32 章：安全与访问控制
- requirepass/AUTH/ACL（Redis 6.0+）
- rename-command/bind/protected-mode

### 第 33 章：Redis 模块与扩展
- RedisJSON/RedisSearch/RedisTimeSeries/RedisBloom/RedisGraph

---

## Phase 8：Go 客户端实战

### 第 34 章：go-redis 客户端入门
- go-redis v9 安装 / 连接 Redis（单机/Sentinel/Cluster）
- 第一个 Go Redis 程序 / 连接池配置

### 第 35 章：go-redis 操作五大类型
- String/Hash/List/Set/ZSet 的 Go API
- Pipeline / TxPipeline / Watch 事务

### 第 36 章：go-redis 高级特性
- Pub/Sub / Stream / Lua 在 Go 中的使用
- Redis + Gin 集成 / Redis + GORM 查询缓存

### 第 37 章：实战项目 —— 短链接系统
- Gin + GORM + Redis 全栈项目
- 短链接生成 / 访问计数 / 频率限制 / 过期控制

---

## Phase 9：总结与面试

### 第 38 章：Redis 面试宝典与总复习
- 知识体系回顾 / 高频面试题 40 题 / 场景设计题
- 进阶学习路线图

---

## 附录

### 附录 A：Redis 命令速查表（按类型分类 + 时间复杂度）
### 附录 B：Redis 常见错误排查指南
### 附录 C：生产环境部署清单

---

> **最后提醒**：Redis 技能是"敲"出来的，不是"看"出来的。每学一个命令，就在 `redis-cli` 中敲一遍。祝你学有所成！
