# 第35章：go-redis 操作五大类型

## 本章目标
用 Go 程序操作五种数据类型 + Pipeline + 事务

---

## 35.1 String 操作

```go
// 基础
rdb.Set(ctx, "key", "value", 0)
rdb.Get(ctx, "key").Result()
rdb.GetSet(ctx, "key", "new").Result()  // 返回旧值

// 批量
rdb.MSet(ctx, "k1", "v1", "k2", "v2")
rdb.MGet(ctx, "k1", "k2").Result()  // []interface{}{"v1", "v2"}

// 计数器
rdb.Incr(ctx, "counter").Result()
rdb.IncrBy(ctx, "counter", 10).Result()
rdb.Decr(ctx, "counter").Result()

// 分布式锁
rdb.SetNX(ctx, "lock:task", "unique_id", 30*time.Second).Result()
```

---

## 35.2 Hash 操作

```go
rdb.HSet(ctx, "user:1", "name", "张三", "age", 25)
rdb.HGet(ctx, "user:1", "name").Result()
rdb.HGetAll(ctx, "user:1").Result()  // map[string]string
rdb.HDel(ctx, "user:1", "age")
rdb.HIncrBy(ctx, "cart:1", "apple", 2)
rdb.HExists(ctx, "user:1", "email").Result()
rdb.HLen(ctx, "user:1").Result()
rdb.HKeys(ctx, "user:1").Result()
```

---

## 35.3 List 操作

```go
rdb.LPush(ctx, "queue", "task1", "task2")
rdb.RPop(ctx, "queue").Result()
rdb.BRPop(ctx, 5*time.Second, "queue").Result()  // 阻塞弹出
rdb.LRange(ctx, "queue", 0, -1).Result()
rdb.LLen(ctx, "queue").Result()
rdb.LTrim(ctx, "queue", 0, 9)  // 只保留前10个
```

---

## 35.4 Set 操作

```go
rdb.SAdd(ctx, "tags:1", "Go", "Redis", "Gin")
rdb.SMembers(ctx, "tags:1").Result()
rdb.SIsMember(ctx, "tags:1", "Go").Result()
rdb.SCard(ctx, "tags:1").Result()
rdb.SInter(ctx, "tags:1", "tags:2").Result()  // 交集
rdb.SUnion(ctx, "tags:1", "tags:2").Result()  // 并集
rdb.SDiff(ctx, "tags:1", "tags:2").Result()   // 差集
rdb.SPop(ctx, "tags:1").Result()
```

---

## 35.5 ZSet 操作

```go
rdb.ZAdd(ctx, "rank", redis.Z{Score: 9500, Member: "张三"})
rdb.ZRange(ctx, "rank", 0, -1).Result()
rdb.ZRevRangeWithScores(ctx, "rank", 0, 9).Result()  // Top10
rdb.ZScore(ctx, "rank", "张三").Result()
rdb.ZRevRank(ctx, "rank", "张三").Result()
rdb.ZIncrBy(ctx, "rank", 500, "张三")
rdb.ZCount(ctx, "rank", "8000", "10000").Result()
```

---

## 35.6 Pipeline

```go
pipe := rdb.Pipeline()
pipe.Set(ctx, "k1", "v1", 0)
pipe.Set(ctx, "k2", "v2", 0)
pipe.Incr(ctx, "counter")
cmds, _ := pipe.Exec(ctx)
// 一次网络往返执行 3 条命令
```

---

## 35.7 事务

```go
// TxPipeline：事务 Pipeline（原子性）
tx := rdb.TxPipeline()
tx.Set(ctx, "k1", "v1", 0)
tx.Incr(ctx, "counter")
tx.Exec(ctx)

// Watch 乐观锁
rdb.Watch(ctx, func(tx *redis.Tx) error {
	val, _ := tx.Get(ctx, "balance").Int()
	if val < 100 {
		return fmt.Errorf("余额不足")
	}
	_, err := tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.Set(ctx, "balance", val-100, 0)
		return nil
	})
	return err
}, "balance")
```

---

## 本章小结
- 五种类型的 Go API 与 redis-cli 命令一一对应
- Pipeline：批量发送，减少网络往返
- TxPipeline：事务 Pipeline（原子性）
- Watch：乐观锁事务

## 练习题
1. 用 go-redis 操作五种数据类型。
2. 用 Pipeline 一次执行 100 条 SET 命令，对比逐条执行的性能。
3. 用 Watch + TxPipelined 实现安全的转账操作。
