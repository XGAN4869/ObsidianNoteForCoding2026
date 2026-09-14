# HTTP 与网络编程

## 1. 学习目标

理解 HTTP 请求链路，使用 net/http 编写客户端和服务端，掌握超时、Header、Cookie 和中间件。

## 2. HTTP 请求结构

一次请求包含方法、URL、Header、Body；响应包含状态码、Header、Body。博客常用状态码包括 200、201、204、400、401、403、404、409 和 500。

## 3. 标准库 HTTP Server

~~~go
mux := http.NewServeMux()
mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, `{"status":"ok"}`)
})

server := &http.Server{
	Addr:              ":8080",
	Handler:           mux,
	ReadHeaderTimeout: 5 * time.Second,
	ReadTimeout:       10 * time.Second,
	WriteTimeout:      15 * time.Second,
	IdleTimeout:       60 * time.Second,
}
~~~

设置超时能降低慢连接占满资源的风险。

## 4. HTTP Client

~~~go
client := &http.Client{Timeout: 5 * time.Second}
req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
if err != nil {
	return err
}
resp, err := client.Do(req)
if err != nil {
	return err
}
defer resp.Body.Close()
~~~

始终关闭 Body；检查状态码后再解析响应。生产客户端应复用一个 Client。

## 5. Header、Cookie 和认证

~~~go
req.Header.Set("Authorization", "Bearer "+token)
req.Header.Set("Accept", "application/json")
~~~

Cookie 要设置 Secure、HttpOnly、SameSite。JWT 放在 Authorization Header 时，不要把完整 Token 写入日志。

## 6. Middleware

~~~go
func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}
~~~

中间件应职责单一，认证中间件只负责认证，不直接查询文章或修改业务状态。

## 7. 优雅关闭

~~~go
shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := server.Shutdown(shutdownCtx); err != nil {
	return err
}
~~~

收到 SIGINT/SIGTERM 后停止接收新请求，等待进行中的请求结束，再释放数据库和 Redis。

## 8. 常见问题与练习

常见问题：不设置超时、不关闭 Body、写 Header 后再写状态码、重复写响应、把内部错误返回客户端。

练习：

1. 用 net/http 实现 GET /healthz。
2. 编写带超时的 JSON Client。
3. 实现记录请求耗时的中间件。
4. 设计博客 API 的公共响应头。

## 9. 小结与下一章

HTTP 服务的可靠性来自超时、状态码、资源关闭、上下文取消和清晰的中间件边界。

- 上一篇：[11-文件JSON与配置处理](./11-文件JSON与配置处理.md)
- 下一篇：[13-数据库SQL与事务](./13-数据库SQL与事务.md)
