# 第36章：go-redis 高级特性

## 本章目标
Pub/Sub、Stream、Lua 脚本在 Go 中的使用 + Redis+Gin/GORM 集成

---

## 36.1 Pub/Sub

```go
// 发布
rdb.Publish(ctx, "news", "重要通知")

// 订阅
sub := rdb.Subscribe(ctx, "news")
defer sub.Close()

for msg := range sub.Channel() {
	fmt.Printf("收到: %s\n", msg.Payload)
}
```

---

## 36.2 Stream

```go
// 发送消息
rdb.XAdd(ctx, &redis.XAddArgs{
	Stream: "mystream",
	Values: map[string]interface{}{"user_id": 1, "action": "login"},
})

// 消费者组读取
msgs, _ := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
	Group:    "mygroup",
	Consumer: "consumer1",
	Streams:  []string{"mystream", ">"},
	Count:    5,
	Block:    time.Second,
}).Result()

for _, msg := range msgs[0].Messages {
	fmt.Println(msg.Values)
	rdb.XAck(ctx, "mystream", "mygroup", msg.ID)  // 确认
}
```

---

## 36.3 Lua 脚本

```go
// 执行 Lua
result, err := rdb.Eval(ctx,
	`return redis.call('INCRBY', KEYS[1], ARGV[1])`,
	[]string{"counter"},  // KEYS
	10,                    // ARGV
).Result()

// EVALSHA（缓存脚本）
sha, _ := rdb.ScriptLoad(ctx, `return redis.call('GET', KEYS[1])`).Result()
rdb.EvalSha(ctx, sha, []string{"mykey"}).Result()
```

---

## 36.4 Redis + Gin 集成

### Session 存储

```go
// 使用 redis 存储 Session（替代内存/Cookie）
store, _ := redis.NewStore(10, "tcp", "localhost:6379", "", []byte("secret"))
r.Use(sessions.Sessions("mysession", store))
```

### 缓存中间件

```go
func CacheMiddleware(rdb *redis.Client, ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := "cache:" + c.Request.URL.Path
		if cached, err := rdb.Get(ctx, key).Result(); err == nil {
			c.String(200, cached)  // 命中缓存
			c.Abort()
			return
		}
		// 未命中，继续处理
		c.Next()
		// 缓存响应
		if body, exists := c.Get("response_body"); exists {
			rdb.Set(ctx, key, body, ttl)
		}
	}
}
```

---

## 36.5 Redis + GORM 查询缓存

```go
// 缓存用户信息
func GetUser(db *gorm.DB, rdb *redis.Client, id uint) (*User, error) {
	key := fmt.Sprintf("user:%d", id)

	// 1. 查 Redis 缓存
	if cached, err := rdb.Get(ctx, key).Result(); err == nil {
		var user User
		json.Unmarshal([]byte(cached), &user)
		return &user, nil
	}

	// 2. 查 MySQL
	var user User
	if err := db.First(&user, id).Error; err != nil {
		return nil, err
	}

	// 3. 写 Redis 缓存
	data, _ := json.Marshal(user)
	rdb.Set(ctx, key, data, 30*time.Minute)

	return &user, nil
}
```

---

## 本章小结
- Pub/Sub：Subscribe + Channel 异步接收
- Stream：XReadGroup 消费者组 + XACK 确认
- Lua：Eval/EvalSha 原子执行
- Gin + Redis：Session 存储、缓存中间件
- GORM + Redis：查询缓存（先查 Redis → 没有再查 DB）

## 练习题
1. 用 go-redis 实现 Pub/Sub 的发布和订阅。
2. 用 go-redis 实现 Stream 的生产和消费。
3. 实现 GORM 查询缓存：用户信息优先从 Redis 获取。
