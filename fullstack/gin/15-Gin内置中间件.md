# 第15章：Gin 内置中间件

## 本章目标
学完本章后，你将能够：
1. 理解 `Logger` 和 `Recovery` 中间件的工作机制
2. 使用 `gin.BasicAuth()` 实现简单认证
3. 理解 `gin.Default()` 和 `gin.New()` 的唯一区别

## 前置知识
- 需要先学习：第14章（中间件概念）

---

## 15.1 `gin.Logger()`：请求日志

`Logger` 是 Gin 使用的第一个中间件（如果你用 `Default()`），自动记录每个请求：

```
[GIN] 2024/01/15 - 12:00:00 | 200 | 1.234ms | 127.0.0.1 | GET "/users"
```

### 自定义日志格式

```go
r := gin.New()

// 自定义格式化函数
r.Use(gin.LoggerWithFormatter(func(params gin.LogFormatterParams) string {
	return fmt.Sprintf("[%s] %s %s %d %v\n",
		params.TimeStamp.Format("2006-01-02 15:04:05"),
		params.Method,
		params.Path,
		params.StatusCode,
		params.Latency,
	)
}))

// 或者用默认格式 + 指定输出
f, _ := os.Create("gin.log")
gin.DefaultWriter = io.MultiWriter(f, os.Stdout)  // 同时写文件和终端
```

### 日志格式参数

```go
type LogFormatterParams struct {
	Request      *http.Request
	TimeStamp    time.Time
	StatusCode   int
	Latency      time.Duration
	ClientIP     string
	Method       string
	Path         string
	ErrorMessage string
	BodySize     int
	Keys         map[string]interface{}
}
```

---

## 15.2 `gin.Recovery()`：Panic 恢复

`Recovery` 是 Gin 的安全网——捕获 panic，防止进程崩溃：

```go
// ❌ 没有 Recovery：panic 导致进程退出
r := gin.New()
r.GET("/panic", func(c *gin.Context) {
	panic("出错了！")  // 进程崩溃！
})

// ✅ 有 Recovery：返回 500，服务继续运行
r := gin.New()
r.Use(gin.Recovery())
r.GET("/panic", func(c *gin.Context) {
	panic("出错了！")  // 返回 500，服务继续
})
```

访问 `/panic` 时，Recovery 返回的响应：
```json
{"error": "Internal Server Error"}
```

终端输出：
```
2024/01/15 12:00:00 [Recovery] panic recovered:
出错了！
/path/to/main.go:25
```

### 自定义 Recovery 行为

```go
r.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
	// recovered 是 panic 的内容
	err, ok := recovered.(string)
	if ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "服务器内部错误",
			"detail":  err,
		})
	}
}))
```

---

## 15.3 `gin.BasicAuth()`：HTTP 基本认证

最简单的认证方式——用户名密码放在请求头中：

```go
// 认证账户列表
accounts := gin.Accounts{
	"admin":    "admin123",
	"zhangsan": "password",
}

// 保护的路由组
admin := r.Group("/admin", gin.BasicAuth(accounts))
{
	admin.GET("/dashboard", func(c *gin.Context) {
		// c.MustGet(gin.AuthUserKey) 获取当前用户
		user := c.MustGet(gin.AuthUserKey).(string)
		c.JSON(200, gin.H{"msg": fmt.Sprintf("欢迎 %s", user)})
	})
}
```

```bash
# 无认证访问 → 401
curl http://localhost:8080/admin/dashboard

# 带认证访问 → 200
curl -u admin:admin123 http://localhost:8080/admin/dashboard
# {"msg":"欢迎 admin"}
```

---

## 15.4 `gin.Default()` 的内部构成

```go
// gin.Default() 就是这样：
func Default() *Engine {
	engine := New()
	engine.Use(Logger(), Recovery())
	return engine
}

// gin.New() 就是这样：
func New() *Engine {
	// 没有任何中间件
}
```

---

## 常见错误

### 错误1：生产环境用了 Default 的彩色日志

```go
// ⚠️ Default 的日志带颜色代码，写到文件里是乱码
r := gin.Default()

// ✅ 生产环境自己配置
r := gin.New()
r.Use(gin.LoggerWithWriter(f, "/path/to/access.log"))
r.Use(gin.Recovery())
```

### 错误2：Recovery 只能防 panic，不能防逻辑错误

```go
// ❌ Recovery 防不了逻辑错误
r := gin.Default()
r.GET("/users/:id", func(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	users[id].Name  // id 是 999 → index out of range → panic
	// Recovery 能捕获，但返回 500 不是优雅的处理方式
})

// ✅ 自己检查边界
if id >= len(users) {
	c.JSON(404, gin.H{"error": "用户不存在"})
	return
}
```

### 错误3：BasicAuth 在生产环境不够安全

```go
// ⚠️ BasicAuth 是明文传输（除非用 HTTPS）
// 生产环境应该用 JWT（第23章）或 OAuth2
```

---

## 本章小结

- `gin.Logger()` 记录每个请求的方法、路径、状态、耗时
- `gin.Recovery()` 捕获 panic，防止进程崩溃
- `gin.Default()` = `gin.New()` + Logger + Recovery
- `gin.BasicAuth()` 适合简单的内部管理后台
- 生产环境用 `gin.New()` + 自定义配置

## 练习题

1. 用 `gin.New()` 手动添加 Logger 和 Recovery，对比 `gin.Default()`。
2. 自定义日志格式，在日志中显示客户端 IP 和 User-Agent。
3. 用 `gin.BasicAuth()` 保护一个管理后台路由组。
4. 写一个会 panic 的接口，验证 Recovery 的行为（对比有/无 Recovery）。
5. （思考题）除了 Logger 和 Recovery，还有哪些"每个 Web 服务都需要的"中间件？
