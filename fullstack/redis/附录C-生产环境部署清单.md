# 附录C：生产环境部署清单

## redis.conf 推荐配置

```bash
# 网络
bind 127.0.0.1 192.168.1.100
port 6379
requirepass "strong-password"
protected-mode yes

# 内存
maxmemory 2gb
maxmemory-policy allkeys-lru

# 持久化（RDB + AOF 双开）
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes

# 日志
loglevel notice
logfile "/var/log/redis/redis.log"

# 慢查询
slowlog-log-slower-than 10000
slowlog-max-len 128

# 客户端
timeout 300
maxclients 10000

# 安全
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_ad8f3"

# 惰性删除
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
```

## 系统配置

```bash
# /etc/sysctl.conf
vm.overcommit_memory = 1      # 允许 fork 分配更多内存
net.core.somaxconn = 1024     # TCP 连接队列

# /etc/rc.local
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

## 监控指标

| 指标 | 命令 | 告警阈值 |
|------|------|---------|
| 内存使用率 | `INFO memory` | > 80% maxmemory |
| 命中率 | `INFO stats` | < 90% |
| 连接数 | `INFO clients` | > 80% maxclients |
| 慢查询数 | `SLOWLOG LEN` | > 50 |
| 主从延迟 | `INFO replication` | > 10s |
| 内存碎片率 | `INFO memory` | > 1.5 |

## 运维脚本

```bash
#!/bin/bash
# 备份脚本 /scripts/redis-backup.sh
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/backup/redis
mkdir -p $BACKUP_DIR

# 触发 BGSAVE
redis-cli -a password BGSAVE

# 等待完成
while [ $(redis-cli -a password INFO persistence | grep rdb_bgsave_in_progress:1 | wc -l) -eq 1 ]; do
    sleep 1
done

# 备份
cp /data/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
cp /data/appendonly.aof $BACKUP_DIR/

# 保留最近 7 天
find $BACKUP_DIR -mtime +7 -delete
```

## Docker 部署

```bash
docker run -d --name redis-prod \
  --restart always \
  -p 6379:6379 \
  -v /data/redis:/data \
  -v /etc/redis.conf:/usr/local/etc/redis/redis.conf \
  redis:7 redis-server /usr/local/etc/redis/redis.conf
```

## 检查清单（上线前）

- [ ] maxmemory 已设（不是 0）
- [ ] maxmemory-policy 已设（不是 noeviction）
- [ ] requirepass 已设强密码
- [ ] bind 绑定内网 IP，不暴露公网
- [ ] protected-mode yes
- [ ] FLUSHALL/FLUSHDB/KEYS 已禁用
- [ ] RDB + AOF 双开
- [ ] appendfsync everysec
- [ ] 慢查询日志开启
- [ ] 监控/告警配置
- [ ] 备份脚本 + 定时任务
- [ ] 恢复流程文档化
- [ ] 禁用 MONITOR
- [ ] 日志写入文件 + 轮转
