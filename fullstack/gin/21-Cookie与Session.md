# 第21章：Cookie 与 Session

## 本章目标
学完本章后，你将能够：
1. 使用 `c.SetCookie()` 设置 Cookie
2. 使用 `c.Cookie()` 读取 Cookie
3. 理解 Cookie 各属性（HttpOnly、Secure、SameSite）
4. 使用 `gin-contrib/sessions` 实现服务端 Session

## 前置知识
- 需要先学习：第07章（请求头）

---

## 21.1 Cookie 操作

### 设置 Cookie

```go
r.GET("/set-cookie", func(c *gin.Context) {
	c.SetCookie(
		"username",        // 名称
		"zhangsan",        // 值
		3600,              // 过期时间（秒），-1=浏览器关闭删除
		"/",               // 路径
		"localhost",       // 域名
		false,             // Secure（HTTPS才传）
		true,              // HttpOnly（JS无法读取）
	)
	c.String(200, "Cookie 已设置")
})
```

### 读取 Cookie

```go
r.GET("/get-cookie", func(c *gin.Context) {
	username, err := c.Cookie("username")
	if err != nil {
		c.String(200, "未找到 Cookie")
		return
	}
	c.String(200, "用户名: %s", username)
})
```

---

## 21.2 Cookie 属性详解

| 属性 | 含义 | 推荐值 |
|------|------|--------|
| `name` | Cookie 名称 | 有意义的名字 |
| `value` | Cookie 值 | 不存敏感信息 |
| `maxAge` | 有效期（秒） | 86400（1天），-1=会话结束删除 |
| `path` | 作用路径 | "/" |
| `domain` | 作用域名 | 你的域名 |
| `secure` | 仅 HTTPS 传输 | 生产环境 `true` |
| `httpOnly` | 禁止 JS 读取 | `true`（防 XSS） |

### SameSite 属性（需手动设置）

```go
c.SetSameSite(http.SameSiteStrictMode)  // 严格模式
c.SetSameSite(http.SameSiteLaxMode)     // 宽松模式（推荐）
c.SetSameSite(http.SameSiteNoneMode)    // 无限制（需配合 Secure）
```

---

## 21.3 Session：服务端存储

Cookie 存用户 ID 在客户端（不安全），Session 把数据存服务端：

```bash
go get github.com/gin-contrib/sessions
go get github.com/gin-contrib/sessions/cookie  # Cookie 存储
```

```go
import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
)

func main() {
	r := gin.Default()

	// 创建 Session 存储（密钥用于加密）
	store := cookie.NewStore([]byte("your-secret-key-32-bytes!!!"))
	r.Use(sessions.Sessions("mysession", store))

	// 登录：设置 Session
	r.POST("/login", func(c *gin.Context) {
		username := c.PostForm("username")
		password := c.PostForm("password")

		if username == "admin" && password == "123456" {
			session := sessions.Default(c)
			session.Set("user_id", 1)
			session.Set("username", username)
			session.Save()  // 必须调用！
			c.JSON(200, gin.H{"msg": "登录成功"})
			return
		}
		c.JSON(401, gin.H{"error": "用户名或密码错误"})
	})

	// 获取：读取 Session
	r.GET("/profile", func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		if userID == nil {
			c.JSON(401, gin.H{"error": "请先登录"})
			return
		}
		c.JSON(200, gin.H{
			"user_id":  userID,
			"username": session.Get("username"),
		})
	})

	// 登出：清除 Session
	r.POST("/logout", func(c *gin.Context) {
		session := sessions.Default(c)
		session.Clear()
		session.Save()
		c.JSON(200, gin.H{"msg": "已登出"})
	})

	r.Run(":8080")
}
```

---

## 21.4 Cookie vs Session

| 特性 | Cookie | Session |
|------|--------|---------|
| 存储位置 | 客户端（浏览器） | 服务端 |
| 安全性 | 低（可被篡改） | 高（服务端控制） |
| 容量 | 4KB | 理论上无限制 |
| 服务器压力 | 无 | 需要存储 |
| 分布式部署 | 不需要额外处理 | 需要共享存储（Redis） |
| Gin 中实现 | 内置 `c.SetCookie()` | `gin-contrib/sessions` |

---

## 常见错误

### 错误1：Session 忘记 `Save()`

```go
session := sessions.Default(c)
session.Set("user_id", 1)
// ❌ 忘记 Save()！数据不会持久化

// ✅ 修改了 Session 必须 Save
session.Save()
```

### 错误2：Cookie 存敏感信息

```go
// ❌ 密码存 Cookie
c.SetCookie("password", "123456", 3600, "/", "", false, false)

// ✅ Session 只存 ID，敏感信息查数据库
session.Set("user_id", 1)
```

### 错误3：Cookie 没有 HttpOnly

```go
// ❌ HttpOnly=false：JS 能读 Cookie → XSS 攻击可窃取
c.SetCookie("token", token, 3600, "/", "", false, false)

// ✅ HttpOnly=true：JS 无法读取
c.SetCookie("token", token, 3600, "/", "", false, true)
```

---

## 本章小结

- `c.SetCookie()` 设置，`c.Cookie()` 读取
- Cookie 属性：HttpOnly（防XSS）、Secure（仅HTTPS）、SameSite（防CSRF）
- Session 把敏感数据存服务端，客户端只存 Session ID
- 修改 Session 后必须 `Save()`

## 练习题

1. 实现"记住我"功能：在 Cookie 中存储用户名（30天过期）。
2. 用 `gin-contrib/sessions` 实现登录/登出/获取用户信息的完整流程。
3. 写一个中间件，检查 Session 中有没有 `user_id`，没有则 401。
4. （思考题）如果服务部署在多台机器上，Cookie-Session 模式会遇到什么问题？如何解决？
