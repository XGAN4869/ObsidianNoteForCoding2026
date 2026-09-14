# 并发同步与 Context

## 1. 学习目标

使用同步原语保护共享状态，用 Context 传播取消和超时，避免锁误用和请求结束后后台任务继续运行。

## 2. WaitGroup

~~~go
var wg sync.WaitGroup
for _, id := range ids {
	wg.Add(1)
	go func(id int64) {
		defer wg.Done()
		loadPost(id)
	}(id)
}
wg.Wait()
~~~

Add 必须在启动 Goroutine 前执行，Done 必须通过 defer 保证调用。

## 3. Mutex 与 RWMutex

~~~go
type Counter struct {
	mu    sync.Mutex
	value int64
}

func (c *Counter) Add(delta int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value += delta
}
~~~

读多写少时可使用 RWMutex，但先用普通 Mutex 保证正确性，再用基准测试证明优化收益。不要复制包含锁的结构体。

## 4. Once 与 sync.Map

sync.Once 适合只初始化一次的资源。sync.Map 适合特定的读多写少或键集合稳定场景，不要默认替代普通 Map + Mutex。

~~~go
var once sync.Once
once.Do(func() {
	// 初始化只执行一次
})
~~~

## 5. 数据竞争

两个 Goroutine 同时访问同一变量，至少一个是写操作，就可能产生数据竞争。使用锁、Channel 或原子操作修复，并运行：

~~~powershell
go test -race ./...
~~~

## 6. Context

Context 不用于传递业务对象，只用于取消、截止时间和少量请求范围元数据。

~~~go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

result, err := repository.Find(ctx, id)
~~~

Service、Repository、HTTP Client 等长耗时函数应把 ctx 作为第一个参数。

## 7. 取消传播

~~~go
func poll(ctx context.Context) error {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if err := fetchOnce(ctx); err != nil {
				return err
			}
		}
	}
}
~~~

请求结束时，HTTP 提供的 Context 会被取消。不要把请求 Context 用于脱离请求生命周期的后台任务。

## 8. 博客请求链路

~~~text
HTTP 请求进入
  ↓
创建请求 Context 和超时
  ↓
鉴权中间件写入 userID
  ↓
Handler 传 ctx 给 Service
  ↓
Service 传 ctx 给 Repository/Redis
  ↓
请求结束，所有下游收到取消
~~~

## 9. 常见问题与练习

常见问题：忘记 cancel、把 nil Context 传下去、context.Value 存业务参数、持锁调用外部网络、锁顺序不一致造成死锁。

练习：

1. 编写可取消的批量文章读取函数。
2. 为一个共享 Map 增加读写锁。
3. 编写超时测试，断言返回 context.DeadlineExceeded。
4. 找出一段可能发生 Goroutine 泄漏的代码并修复。

## 10. 小结与下一章

锁保护共享状态，Context 管理生命周期。所有并发资源都必须有明确的结束路径。

- 上一篇：[09-Goroutine与Channel](./09-Goroutine与Channel.md)
- 下一篇：[11-文件JSON与配置处理](./11-文件JSON与配置处理.md)

