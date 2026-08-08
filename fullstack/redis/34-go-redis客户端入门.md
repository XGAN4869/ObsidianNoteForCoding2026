# 第34章：go-redis 客户端入门

## 本章目标
用 Go 程序操作 Redis（go-redis v9）

---

## 34.1 安装与连接

```bash
go get github.com/redis/go-redis/v9
```

```go
package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func main() {
	// 单机模式
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",  // 无密码
		DB:       0,   // 默认数据库
	})

	// Sentinel 模式
	rdb = redis.NewFailoverClient(&redis.FailoverOptions{
		MasterName:    "mymaster",
		SentinelAddrs: []string{":26379", ":26380", ":26381"},
	})

	// Cluster 模式
	rdb = redis.NewClusterClient(&redis.ClusterOptions{
		Addrs: []string{":6379", ":6380", ":6381"},
	})

	// 测试连接
	pong, err := rdb.Ping(ctx).Result()
	fmt.Println(pong, err)  // PONG <nil>
}
```

---

## 34.2 基本操作

```go
// SET
rdb.Set(ctx, "name", "张三", 0)  // 0=永不过期
rdb.Set(ctx, "token", "abc123", 10*time.Minute)  // 10分钟过期

// GET
val, err := rdb.Get(ctx, "name").Result()
if err == redis.Nil {
	fmt.Println("Key 不存在")
}

// DEL
rdb.Del(ctx, "name")

// EXISTS
n, _ := rdb.Exists(ctx, "name").Result()  // 1=存在

// EXPIRE
rdb.Expire(ctx, "name", 1*time.Hour)

// TTL
ttl, _ := rdb.TTL(ctx, "name").Result()
```

---

## 34.3 连接池配置

```go
rdb := redis.NewClient(&redis.Options{
	Addr:         "localhost:6379",
	PoolSize:     10,               // 连接池大小
	MinIdleConns: 3,                // 最小空闲连接
	MaxRetries:   3,                // 重试次数
	DialTimeout:  5 * time.Second,  // 连接超时
	ReadTimeout:  2 * time.Second,  // 读超时
	WriteTimeout: 2 * time.Second,  // 写超时
})
```

---

## 常见错误

### 错误1：忘记 defer Close

```go
rdb := redis.NewClient(&redis.Options{...})
defer rdb.Close()  // 程序退出时关闭连接池
```

### 错误2：不判断 redis.Nil

```go
val, err := rdb.Get(ctx, "key").Result()
if err != nil {
	// ❌ 把 "key不存在" 当错误处理
	// ✅ 用 redis.Nil 区分
	if err == redis.Nil {
		// key 不存在，不是错误
	}
}
```

---

## 本章小结
- 三种连接方式：NewClient / NewFailoverClient / NewClusterClient
- 基本操作与 redis-cli 命令一一对应
- redis.Nil 表示 Key 不存在
- 连接池配置：PoolSize / MinIdleConns / Timeout

## 练习题
1. 用 go-redis 连接 Redis，执行 SET/GET/DEL。
2. 配置连接池，设置合理的超时时间。
3. 处理 redis.Nil 错误。
