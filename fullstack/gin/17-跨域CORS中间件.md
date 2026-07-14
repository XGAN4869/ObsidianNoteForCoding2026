# 第17章：跨域 CORS 中间件

## 本章目标
学完本章后，你将能够：
1. 理解跨域（同源策略）的原因
2. 手动编写 CORS 中间件
3. 使用 `gin-contrib/cors` 库快速配置
4. 理解 OPTIONS 预检请求

## 前置知识
- 需要先学习：第16章（自定义中间件）、第07章（请求头）

---

## 17.1 什么是跨域

浏览器的**同源策略**限制：`http://localhost:3000` 的 JS 代码不能直接请求 `http://localhost:8080` 的 API。

```
http://localhost:3000  →  http://localhost:8080  ❌ 跨域（端口不同）
http://example.com     →  http://api.example.com   ❌ 跨域（子域名不同）
http://example.com:3000 → http://example.com:8080 ❌ 跨域（端口不同）
```

**同源** = 协议 + 域名 + 端口完全一致。

---

## 17.2 手动编写 CORS 中间件

```go
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 允许所有来源（开发环境）
		c.Header("Access-Control-Allow-Origin", "*")
		// 允许的请求方法
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// 允许的请求头
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		// 允许携带 Cookie
		c.Header("Access-Control-Allow-Credentials", "true")
		// 预检请求缓存时间（秒）
		c.Header("Access-Control-Max-Age", "86400")

		// 处理预检请求（OPTIONS）
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
```

---

## 17.3 使用 `gin-contrib/cors`

```bash
go get github.com/gin-contrib/cors
```

### 开发环境（允许所有来源）

```go
import "github.com/gin-contrib/cors"

r.Use(cors.Default())
// 等价于允许所有来源的宽松配置
```

### 生产环境（精确控制）

```go
r.Use(cors.New(cors.Config{
	AllowOrigins:     []string{"https://example.com", "https://app.example.com"},
	AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
	ExposeHeaders:    []string{"Content-Length", "X-Trace-ID"},
	AllowCredentials: true,  // 允许携带 Cookie
	MaxAge:           12 * time.Hour,
}))
```

---

## 17.4 OPTIONS 预检请求

浏览器在发送某些跨域请求前，会先发一个 OPTIONS 请求"探路"：

```
浏览器 → OPTIONS /api/users (询问：可以用 POST 吗？)
服务器 → 204 No Content (回答：可以，方法允许)
浏览器 → POST /api/users (正式发送)
```

触发预检的条件（非简单请求）：
- 方法不是 GET/HEAD/POST
- Content-Type 不是 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`
- 自定义请求头（如 Authorization）

---

## 常见错误

### 错误1：允许了 Credentials 但 Origin 用 `*`

```go
// ❌ 不能同时设置 Credentials=true 和 Origin=*
c.Header("Access-Control-Allow-Origin", "*")
c.Header("Access-Control-Allow-Credentials", "true")

// ✅ 指定具体的 Origin
c.Header("Access-Control-Allow-Origin", "https://example.com")
c.Header("Access-Control-Allow-Credentials", "true")
```

### 错误2：CORS 中间件没有放在最前面

```go
// ❌ Auth 在 CORS 前面 → OPTIONS 请求被拦截
r.Use(AuthMiddleware())
r.Use(CORSMiddleware())

// ✅ CORS 在最前面
r.Use(CORSMiddleware())
r.Use(AuthMiddleware())
```

### 错误3：Allow-Headers 漏了自定义头

```go
// ❌ 前端请求带了 Authorization 头，但没在 AllowHeaders 里
AllowHeaders: []string{"Content-Type"}  // 漏了 Authorization
// 前端请求被 CORS 拦截！

// ✅ 加上所有需要的头
AllowHeaders: []string{"Content-Type", "Authorization", "X-Request-ID"}
```

---

## 本章小结

- 同源策略限制跨域请求（协议+域名+端口不同）
- CORS 通过响应头告诉浏览器"允许跨域"
- 预检请求（OPTIONS）是非简单请求的前置步骤
- 生产环境精确限制 AllowOrigins，不要用 `*`
- CORS 中间件要放在认证中间件之前

## 练习题

1. 手动写一个 CORS 中间件，应用到项目中。
2. 用 `gin-contrib/cors` 配置生产环境的 CORS。
3. 用浏览器分别测试有 CORS 和没 CORS 的 API，观察浏览器 F12 的错误信息。
4. （思考题）CORS 是浏览器的安全机制，为什么 curl/Postman 不受跨域限制？
