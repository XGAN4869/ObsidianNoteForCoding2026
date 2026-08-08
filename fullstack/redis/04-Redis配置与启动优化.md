# 第04章：Redis 配置与启动优化

## 本章目标
学完本章后，你将能够：
1. 理解 redis.conf 核心配置项
2. 动态修改配置（CONFIG GET/SET）
3. 使用 SELECT 切换数据库
4. 使用 INFO 查看服务器状态

## 前置知识
- 需要先学习：第02-03章（安装、Key 基础）

---

## 4.1 redis.conf 核心配置

```bash
# 网络
bind 127.0.0.1           # 绑定的网卡，生产应指定内网 IP
port 6379                # 端口
protected-mode yes        # 保护模式（无密码+非本地=拒绝连接）
requirepass ""           # 密码（生产必设！）

# 内存
maxmemory 0              # 最大内存（0=不限制，生产必设！）
maxmemory-policy noeviction  # 淘汰策略

# 持久化
save 3600 1 300 100 60 10000  # RDB 触发条件
appendonly no            # AOF（默认关闭）
dbfilename dump.rdb      # RDB 文件名

# 日志
loglevel notice          # 日志级别（debug/verbose/notice/warning）
logfile ""               # 日志文件（空=标准输出）

# 客户端
timeout 0                # 客户端空闲超时（0=永不超时）
maxclients 10000         # 最大客户端数

# 慢查询
slowlog-log-slower-than 10000  # 慢查询阈值（微秒）
slowlog-max-len 128      # 慢查询日志条数
```

---

## 4.2 动态修改配置

```bash
# 查看所有
CONFIG GET *

# 查看特定
CONFIG GET maxmemory
CONFIG GET maxmemory-policy

# 修改（重启失效）
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET requirepass "mypassword"

# 注意：修改 requirepass 后需要认证
AUTH mypassword

# 永久生效（写入配置文件）
CONFIG REWRITE
```

> 📌 `CONFIG REWRITE` 把当前运行的配置写入 redis.conf，重启也生效。

---

## 4.3 多数据库

```bash
# 默认有 16 个数据库（0-15）
SELECT 0   # 切换到 0 号
SELECT 1   # 切换到 1 号

# 每个数据库独立
SET name "张三"  # 存在 0 号
SELECT 1
GET name         # (nil) ← 1 号没有

# 移动 Key 到其他数据库
MOVE name 2

# 当前数据库 Key 数量
DBSIZE

# 清空当前数据库（⚠️ 危险！）
FLUSHDB

# 清空所有数据库（⚠️ 极其危险！）
FLUSHALL
```

> ⚠️ **多数据库在生产中几乎不用**。Cluster 模式不支持多数据库。推荐用 Key 前缀（`prod:key` / `test:key`）区分环境。

---

## 4.4 INFO 命令

```bash
INFO            # 全部信息
INFO server     # 服务器信息（版本、运行时间）
INFO clients    # 客户端信息
INFO memory     # 内存信息
INFO stats      # 统计信息（命中率、命令计数）
INFO replication # 复制信息
INFO keyspace   # 各数据库 Key 数量
```

### 关键指标

```bash
INFO memory
# used_memory_human: 1.2M     ← 当前内存使用
# maxmemory_human: 256M       ← 最大内存限制
# mem_fragmentation_ratio: 1.05 ← 内存碎片率

INFO stats
# keyspace_hits: 1000         ← 命中次数
# keyspace_misses: 50         ← 未命中次数
# 命中率 = hits / (hits + misses) = 1000/1050 = 95.2%

INFO replication
# role: master                 ← 角色（master/slave）
# connected_slaves: 2          ← 连接的从库数量
```

---

## 4.5 启动时指定配置文件

### Docker 方式

```bash
# 创建自定义配置文件
cat > redis.conf << 'EOF'
maxmemory 128mb
maxmemory-policy allkeys-lru
requirepass mypassword
save 900 1
EOF

# 挂载配置文件启动
docker run -d --name redis-custom \
  -p 6379:6379 \
  -v $(pwd)/redis.conf:/usr/local/etc/redis/redis.conf \
  redis:7 redis-server /usr/local/etc/redis/redis.conf
```

### 本地方式

```bash
redis-server /path/to/redis.conf
```

---

## 常见错误

### 错误1：生产环境不设 maxmemory

```
# ❌ 默认 maxmemory=0（不限制）
# Redis 会一直占用内存直到 OOM（被系统杀死）

# ✅ 生产必设
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 错误2：生产环境不设密码

```
# ❌ 无密码 + 公网暴露 → 被黑客入侵
# 很多 Redis 被黑用来挖矿！

# ✅ 设密码
requirepass "strong-password-here"
```

### 错误3：FLUSHALL 误操作

```bash
# ⚠️ 清空所有数据库！不可逆！
FLUSHALL

# 防护措施：
# 1. 生产环境 rename-command FLUSHALL ""
# 2. 权限控制（ACL）
```

---

## 本章小结

- redis.conf 重点：`maxmemory` / `maxmemory-policy` / `requirepass` / `save` / `appendonly`
- `CONFIG GET/SET` 动态调整，`CONFIG REWRITE` 持久化
- 默认 16 个数据库，但生产不推荐用（用 Key 前缀区分）
- `INFO` 查看运行状态，关注 memory 和 stats
- 生产必设：maxmemory、密码、淘汰策略

## 练习题

1. 查看当前 Redis 的 maxmemory 和 maxmemory-policy 配置。
2. 用 CONFIG SET 修改 maxmemory 为 128MB，然后用 CONFIG REWRITE 持久化。
3. 用 SELECT 切换数据库，验证不同数据库的数据隔离。
4. 用 INFO 查看 server、memory、stats、keyspace 信息。
5. （思考题）Redis 的多数据库功能为什么在生产环境中几乎没人用？Cluster 模式下为什么不能用多数据库？
