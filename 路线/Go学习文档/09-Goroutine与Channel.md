# Goroutine 与 Channel

## 1. 学习目标

理解 Goroutine 的启动和退出，掌握 Channel、select、关闭规则，并能写出不会泄漏的工作池。

## 2. Goroutine

~~~go
go func() {
	fmt.Println("后台任务")
}()
~~~

Goroutine 很轻量，但不是“免费线程”。它仍会占用栈、调度资源和外部连接。启动前要回答：谁负责等待它结束？谁负责取消它？错误如何返回？

## 3. Channel

~~~go
jobs := make(chan int)
go func() {
	jobs <- 42
	close(jobs)
}()
value, ok := <-jobs
fmt.Println(value, ok)
~~~

无缓冲 Channel 需要发送和接收同时准备；有缓冲 Channel 允许暂存有限数量的数据。

~~~go
jobs := make(chan int, 2)
jobs <- 1
jobs <- 2
~~~

### 关闭原则

通常由发送方关闭 Channel，接收方只负责读取。不要向已关闭 Channel 发送数据，会 panic；从已关闭 Channel 读取会得到零值和 false。

## 4. 单向 Channel

~~~go
func producer(out chan<- int) {
	defer close(out)
	for i := 0; i < 3; i++ {
		out <- i
	}
}

func consumer(in <-chan int) {
	for value := range in {
		fmt.Println(value)
	}
}
~~~

单向类型把职责写进函数签名，减少错误操作。

## 5. select

~~~go
select {
case value := <-result:
	fmt.Println(value)
case <-time.After(time.Second):
	return errors.New("处理超时")
}
~~~

select 没有 default 时会阻塞；有 default 时会立即执行，忙轮询会消耗 CPU，应谨慎使用。

## 6. 工作池

~~~go
func worker(ctx context.Context, jobs <-chan int, results chan<- string) {
	for {
		select {
		case <-ctx.Done():
			return
		case id, ok := <-jobs:
			if !ok {
				return
			}
			results <- fmt.Sprintf("处理任务 %d", id)
		}
	}
}
~~~

生产环境工作池需要限制 worker 数量、关闭 jobs 后等待 worker 退出、明确结果 Channel 的关闭者，并确保取消时释放资源。

## 7. 博客项目中的并发

可用 Goroutine 处理不影响主响应的任务，例如刷新文章浏览量、写审计日志或预热缓存。但文章发布、权限校验和数据库事务仍应同步完成。

## 8. 常见问题与练习

常见问题：Goroutine 泄漏、忘记关闭结果 Channel、重复 close、无界创建 Goroutine、Channel 方向混乱。

练习：

1. 写一个三个 worker 的数字平方工作池。
2. 为 worker 增加 Context 取消。
3. 模拟一个超时任务并确保主函数能退出。
4. 用 go test -race 检查共享计数器。

## 9. 小结与下一章

Goroutine 负责并发执行，Channel 负责通信，Context 负责取消。并发代码的验收标准是可停止、可观察、可测试。

- 上一篇：[08-包模块与依赖管理](./08-包模块与依赖管理.md)
- 下一篇：[10-并发同步与Context](./10-并发同步与Context.md)

