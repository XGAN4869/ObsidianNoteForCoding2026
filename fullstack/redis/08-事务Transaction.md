# 第08章：事务（Transaction）

## 本章目标
掌握 MULTI/EXEC/WATCH，理解 Redis 事务 vs MySQL 事务

---

## 8.1 基本事务

```bash
MULTI                   # 开启事务
SET name "张三"
SET age "25"
INCR counter
EXEC                    # 执行事务
# 1) OK
# 2) OK
# 3) (integer) 1

# 所有命令在 EXEC 时一次性执行，中间不会插入其他客户端的命令
```

### 放弃事务

```bash
MULTI
SET a 1
SET b 2
DISCARD                 # 放弃，前面的命令都不执行
```

---

## 8.2 WATCH 乐观锁

```bash
# 终端1：监控 balance
WATCH balance
GET balance           # "100"

# 终端2：修改 balance
SET balance 50

# 终端1：开启事务
MULTI
SET balance 80        # 期望 100，实际已被改成 50
EXEC                  # (nil) ← 事务被取消！
```

> 📌 WATCH 在 EXEC 前检查被监控的 Key 是否被修改过，修改过则放弃事务。这是乐观锁。

---

## 8.3 Redis 事务 vs MySQL 事务

| 特性 | MySQL | Redis |
|------|-------|-------|
| 原子性 | ✅ 全部成功或回滚 | ⚠️ 只保证执行不中断 |
| 回滚 | ✅ ROLLBACK | ❌ 不支持！ |
| 隔离性 | ✅ 四种隔离级别 | ✅ 单线程天然隔离 |
| 持久性 | ✅ | 取决于持久化配置 |

> ⚠️ **Redis 事务不支持回滚！** 事务中某条命令出错（如对 String 用 LPUSH），**其他命令仍会执行**。

---

## 本章小结
- MULTI/EXEC：打包执行
- WATCH：乐观锁，Key 被改则放弃事务
- 不支持回滚，出错继续执行

## 练习题
1. 用 MULTI/EXEC 执行 3 条命令，观察返回。
2. 用 WATCH 模拟两个客户端同时修改同一个 Key。
3. 在事务中故意写一条错误命令，观察其余命令是否执行。
