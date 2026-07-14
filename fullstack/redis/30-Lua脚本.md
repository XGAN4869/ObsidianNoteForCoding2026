# 第30章：Lua 脚本

## 本章目标
掌握 Lua 脚本实现原子性复杂操作

---

## 30.1 为什么需要 Lua

Redis 单条命令是原子的，但多条命令组合不是。Lua 脚本让多条命令**原子执行**：

```bash
# 问题：先 GET 再 SET（非原子！中间可能被其他客户端改动）
GET counter
# ... 另一个客户端也 GET 并 SET ...
SET counter 100

# 解决：用 Lua 脚本原子执行
EVAL "return redis.call('INCRBY', KEYS[1], ARGV[1])" 1 counter 10
```

---

## 30.2 EVAL 和 EVALSHA

```bash
# EVAL：执行脚本
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
# └─ 脚本内容 ─┘ └─── 参数 ──┘ ↑Key数 ↑Key  ↑Arg

# EVALSHA：按 SHA1 执行缓存的脚本（免传输脚本内容）
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# "a1b2c3d4..."  ← SHA1值
EVALSHA a1b2c3d4... 1 mykey

# SCRIPT EXISTS a1b2c3d4...  # 检查脚本是否缓存
# SCRIPT FLUSH                # 清空脚本缓存
```

---

## 30.3 实战：分布式限流

```lua
-- 滑动窗口限流：每个用户每分钟最多 N 次
local key = KEYS[1]           -- rate:user:1
local limit = tonumber(ARGV[1])  -- 限制次数
local window = tonumber(ARGV[2]) -- 窗口秒数

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end
if current > limit then
    return 0  -- 超限
end
return 1      -- 放行
```

```bash
EVAL "..." 1 rate:user:1 10 60
#                          └─限10次  └─60秒窗口
```

---

## 30.4 实战：抢购扣库存

```lua
-- 原子扣库存，防止超卖
local key = KEYS[1]      -- stock:product:1
local qty = tonumber(ARGV[1])

local stock = tonumber(redis.call('GET', key) or 0)
if stock >= qty then
    redis.call('DECRBY', key, qty)
    return 1  -- 扣成功
end
return 0      -- 库存不足
```

---

## 常见错误

### 错误1：Lua 脚本中写死 Key

```lua
-- ❌ Key 写死在脚本里
redis.call('SET', 'mykey', 'value')

-- ✅ 通过 KEYS[] 传入
redis.call('SET', KEYS[1], ARGV[1])
```

### 错误2：复杂计算放 Redis

```lua
-- ❌ 在 Redis 中做大量计算（阻塞主线程）
for i=1,1000000 do ... end

-- ✅ 简单逻辑在 Redis，复杂逻辑在应用层
```

---

## 本章小结
- Lua 让多条 Redis 命令原子执行
- `EVAL script numkeys key... arg...`
- `EVALSHA` + `SCRIPT LOAD` 避免每次传脚本
- 实战：分布式限流、抢购扣库存

## 练习题
1. 用 Lua 实现"存在才删除"（类似 DEL IF EXISTS）。
2. 用 Lua 实现分布式限流。
3. 用 Lua 实现抢购扣库存（防超卖）。
