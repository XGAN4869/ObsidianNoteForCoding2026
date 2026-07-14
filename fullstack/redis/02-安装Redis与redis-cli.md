# 第02章：安装 Redis 与 redis-cli

## 本章目标
学完本章后，你将能够：
1. 用 Docker 一键启动 Redis
2. 使用 `redis-cli` 连接 Redis 并执行基本命令
3. 理解 `redis.conf` 核心配置
4. 使用 `CONFIG GET/SET` 动态修改配置

## 前置知识
- 需要先学习：第01章（Redis 概念）

---

## 2.1 Docker 安装（推荐 ⭐）

一行命令搞定：

```bash
docker run -d --name redis-tutorial -p 6379:6379 redis:7
```

参数解释：
- `-d`：后台运行
- `--name`：容器名称
- `-p 6379:6379`：端口映射（宿主机:容器）
- `redis:7`：使用 Redis 7.x 版本

验证：
```bash
docker ps | grep redis
# 看到 redis-tutorial 状态为 Up 即成功
```

---

## 2.2 其他安装方式

### Mac（Homebrew）

```bash
brew install redis
brew services start redis  # 后台启动
```

### Linux（apt）

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### Windows（WSL2）

Windows 不原生支持 Redis，推荐用 WSL2 + Docker，或直接在 WSL2 的 Linux 中安装。

---

## 2.3 连接 Redis：redis-cli

```bash
# Docker 方式连接
docker exec -it redis-tutorial redis-cli

# 本地安装方式连接
redis-cli

# 连接远程 Redis
redis-cli -h 192.168.1.100 -p 6379 -a yourpassword
```

### 第一个命令

```bash
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> ECHO "Hello Redis"
"Hello Redis"

127.0.0.1:6379> HELP SET
# 显示 SET 命令的完整用法

127.0.0.1:6379> exit
# 退出
```

> 📌 `127.0.0.1:6379>` 是 redis-cli 的提示符，表示连接的 IP 和端口。

---

## 2.4 基础命令

```bash
# 查看服务器信息
INFO
# 可以看到版本、内存、客户端、复制等所有信息

# 选择数据库（0-15，默认 0 号）
SELECT 0

# 当前数据库有多少 Key
DBSIZE

# 增删查
SET name "张三"
GET name           # "张三"
EXISTS name        # (integer) 1
DEL name           # (integer) 1
EXISTS name        # (integer) 0
```

---

## 2.5 redis.conf 核心配置

用 Docker 时，配置文件在容器内。查看、修改配置：

```bash
# 查看所有配置
CONFIG GET *

# 查看特定配置
CONFIG GET maxmemory
CONFIG GET bind

# 动态修改配置（重启失效）
CONFIG SET maxmemory 256mb
CONFIG SET requirepass "mypassword"
```

### 必知的核心配置

| 配置项 | 默认值 | 含义 | 建议 |
|--------|--------|------|------|
| `bind` | `127.0.0.1` | 绑定的网卡 | 生产指定内网 IP |
| `port` | `6379` | 监听端口 | 不改 |
| `requirepass` | 空 | 连接密码 | 生产必设 |
| `maxmemory` | 不限制 | 最大内存 | 生产必设（如 2gb） |
| `maxmemory-policy` | `noeviction` | 内存满后的淘汰策略 | 缓存场景设 `allkeys-lru` |
| `databases` | `16` | 数据库数量 | 一般不改 |
| `save` | `3600 1 300 100 60 10000` | RDB 快照条件 | 按需调整 |
| `appendonly` | `no` | 开启 AOF | 生产建议 `yes` |

---

## 2.6 Docker 常用管理命令

```bash
# 停止
docker stop redis-tutorial

# 启动
docker start redis-tutorial

# 重启
docker restart redis-tutorial

# 查看日志
docker logs redis-tutorial

# 进入容器（不是 redis-cli）
docker exec -it redis-tutorial bash

# 删除容器（数据会丢！）
docker rm -f redis-tutorial
```

---

## 常见错误

### 错误1：连接被拒绝

```
Could not connect to Redis at 127.0.0.1:6379: Connection refused
```

**原因**：Redis 没有启动，或端口不对。

**解决**：`docker ps` 检查容器状态，`docker start redis-tutorial` 启动。

### 错误2：Docker 容器退出

```bash
docker ps -a | grep redis
# STATUS: Exited
```

**解决**：`docker logs redis-tutorial` 查看日志，通常是端口冲突或配置错误。

### 错误3：需要密码认证

```
(error) NOAUTH Authentication required
```

**解决**：`AUTH yourpassword` 输入密码，或连接时加 `-a` 参数。

### 错误4：KEYS * 在生产环境用了

```bash
KEYS *  # 生产环境千万不要用！可能卡死 Redis
```

**原因**：KEYS 会遍历所有 Key（O(N)），数据量大时阻塞其他请求。用 `SCAN` 代替。

---

## 本章小结

- Docker 方式：`docker run -d --name redis -p 6379:6379 redis:7`
- 连接：`redis-cli`（本地）/ `docker exec -it redis redis-cli`（Docker）
- 基础命令：PING / SET / GET / DEL / EXISTS / INFO / CONFIG GET
- redis.conf 重点：maxmemory / requirepass / maxmemory-policy

## 练习题

1. 用 Docker 启动一个 Redis 7 实例。
2. 用 `redis-cli` 连接，执行 PING、SET、GET、DEL 命令。
3. 查看 Redis 的 `maxmemory` 配置，并动态修改为 128MB。
4. 查看 Redis 的 `bind` 和 `port` 配置。
5. （思考题）`CONFIG SET` 修改的配置，重启后会丢失吗？如何让配置永久生效？
