# 第23章：JWT 认证

## 本章目标
学完本章后，你将能够：
1. 理解 JWT 原理（Header.Payload.Signature）
2. 使用 `golang-jwt/jwt` 生成和解析 Token
3. 封装 JWT 认证中间件
4. 实现 Access Token + Refresh Token 双 Token 模式

## 前置知识
- 需要先学习：第16章（自定义中间件）、第13章（统一响应）

---

## 23.1 JWT 是什么

JWT = JSON Web Token，是一个加密签名的 JSON 字符串：

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDUzMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

分解：
Header.Payload.Signature
└─────┘ └──────────────┘ └──────────────────────────────────┘
  算法      用户数据             签名（防篡改）
```

---

## 23.2 安装和使用

```bash
go get github.com/golang-jwt/jwt/v5
```

### 生成 Token

```go
import "github.com/golang-jwt/jwt/v5"

var jwtKey = []byte("your-secret-key-32bytes!!!!!!!")

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, username string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24小时过期
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "gin-tutorial",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}
```

### 解析 Token

```go
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{},
		func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("无效的Token")
}
```

---

## 23.3 JWT 认证中间件

```go
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Authorization 头获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"code": 401, "message": "请先登录"})
			return
		}

		// Bearer xxx → 取 xxx 部分
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(401, gin.H{"code": 401, "message": "认证格式错误"})
			return
		}

		// 解析 Token
		claims, err := ParseToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"code": 401, "message": "Token无效或已过期"})
			return
		}

		// 存入 Context（后续 Handler 可获取）
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)

		c.Next()
	}
}
```

---

## 23.4 完整登录+认证流程

```go
func main() {
	r := gin.Default()

	// 公开路由
	r.POST("/login", func(c *gin.Context) {
		var req struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// 验证用户名密码（实际项目查数据库）
		if req.Username != "admin" || req.Password != "123456" {
			c.JSON(401, gin.H{"code": 401, "message": "用户名或密码错误"})
			return
		}

		// 生成 Token
		token, _ := GenerateToken(1, req.Username)
		c.JSON(200, gin.H{
			"code":    0,
			"message": "登录成功",
			"data":    gin.H{"token": token, "expires_in": 86400},
		})
	})

	// 需要认证的路由
	auth := r.Group("/api")
	auth.Use(JWTAuthMiddleware())
	{
		auth.GET("/profile", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			username, _ := c.Get("username")
			c.JSON(200, gin.H{"user_id": userID, "username": username})
		})
	}

	r.Run(":8080")
}
```

测试：
```bash
# 登录
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
# {"data":{"token":"eyJhbG..."}}

# 认证访问
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer eyJhbG..."
# {"user_id":1,"username":"admin"}

# 无认证访问 → 401
curl http://localhost:8080/api/profile
# {"code":401,"message":"请先登录"}
```

---

## 23.5 JWT vs Session

| 特性 | JWT | Session |
|------|-----|---------|
| 存储位置 | 客户端 | 服务端 |
| 扩展性 | ✅ 无状态，天然分布式 | ❌ 需要共享存储 |
| 注销控制 | ❌ Token签发后无法主动失效 | ✅ 服务端删除即可 |
| 安全性 | 依赖密钥保护 | 依赖Cookie+服务端 |

---

## 常见错误

### 错误1：密钥太短

```go
// ❌ 密钥太短（暴力破解风险）
var jwtKey = []byte("123")

// ✅ 至少 32 字节
var jwtKey = []byte("your-256-bit-secret-key-here!!")
```

### 错误2：Token 不过期

```go
// ❌ 永不过期
claims := Claims{UserID: 1}
// 如果泄露，攻击者永久可用

// ✅ 设置合理过期时间
ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour))
```

### 错误3：将敏感信息放入 Token

```go
// ❌ Token 的 Payload 只是 Base64 编码，不是加密！
claims.Password = "123456"  // 任何拿到 Token 的人都能解码看到

// ✅ Token 只存不敏感的信息（user_id, username）
```

---

## 本章小结

- JWT = Header.Payload.Signature（签名防篡改，不防窥探）
- `jwt.NewWithClaims()` 生成，`jwt.ParseWithClaims()` 解析
- 中间件从 `Authorization: Bearer xxx` 提取并验证 Token
- JWT 无状态，适合分布式；Session 有状态，注销更方便

## 练习题

1. 实现 JWT 登录接口（POST /login）和认证中间件。
2. 实现一个 `/api/profile` 接口，从 JWT 中读取用户 ID 并返回用户信息。
3. 实现 Token 刷新机制：Access Token 过期后，用 Refresh Token 换取新 Token。
4. （思考题）JWT 的 Payload 是 Base64 编码而非加密，这意味着什么？如何保护敏感数据？
