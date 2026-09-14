# 用户注册、登录与 JWT 认证

## 1. 认证目标

认证模块要解决三个问题：

1. 你是谁：解析并验证 Access Token。
2. 你能做什么：根据角色和资源判断权限。
3. 你是否还能继续登录：管理 Refresh Token 的有效期和撤销。

## 2. 注册流程

~~~text
接收 username/email/password
        ↓
DTO 绑定与格式校验
        ↓
查询用户名和邮箱是否冲突
        ↓
密码哈希
        ↓
创建 users 记录
        ↓
返回安全的 UserResponse
~~~

重复用户名和邮箱返回 409。数据库唯一索引是最后一道保护，Service 仍应把底层唯一冲突映射成稳定业务错误。

## 3. 密码哈希

使用 bcrypt 或 Argon2id，不使用 MD5、SHA1 或自定义加密。哈希函数接口：

~~~go
type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hash, password string) error
}
~~~

密码校验失败统一返回“用户名或密码错误”，不要告诉攻击者到底是哪一个字段错误。

## 4. Token 设计

Access Token：

- 有效期短，例如 15 分钟。
- 放在 Authorization: Bearer Header。
- Claims 包含 sub（用户 ID）、role、iat、exp 和 jti。

Refresh Token：

- 有效期长，例如 7～30 天。
- 只用于换取新的 Access Token。
- 服务端保存 token_hash、用户 ID、过期时间和 revoked_at。
- 退出登录时撤销当前 token。

## 5. JWT Manager 接口

~~~go
type Claims struct {
	UserID int64
	Role   string
	TokenID string
}

type TokenManager interface {
	IssueAccess(claims Claims) (string, error)
	IssueRefresh(userID int64) (raw string, tokenID string, err error)
	ParseAccess(token string) (Claims, error)
}
~~~

JWT Secret 至少 32 字节随机值，从环境变量读取。轮换密钥时需要兼容旧 Token 的过渡窗口。

## 6. 鉴权中间件

~~~go
func AuthRequired(tokens TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		const prefix = "Bearer "
		if !strings.HasPrefix(header, prefix) {
			response.Error(c, ErrUnauthorized)
			c.Abort()
			return
		}
		claims, err := tokens.ParseAccess(strings.TrimPrefix(header, prefix))
		if err != nil {
			response.Error(c, ErrUnauthorized)
			c.Abort()
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
~~~

中间件只负责身份验证；资源权限例如“是否文章作者”交给 PostService。

## 7. API 契约

### POST /api/v1/auth/register

请求：

~~~json
{"username":"alice","email":"alice@example.com","password":"strong-password"}
~~~

响应 201：返回 id、username、email、created_at，不返回 password_hash。

### POST /api/v1/auth/login

响应 200：

~~~json
{"access_token":"...","refresh_token":"...","expires_in":900,"user":{"id":1,"role":"user"}}
~~~

### POST /api/v1/auth/refresh

提交 Refresh Token，成功后返回新的 Access Token。可选择 Refresh Token 轮换，旧 token 立即撤销。

### POST /api/v1/auth/logout

撤销当前 Refresh Token，重复退出应保持幂等。

## 8. 权限检查

角色权限只是第一层：

~~~go
if post.AuthorID != currentUserID && role != "admin" {
	return ErrForbidden
}
~~~

检查必须在 Service 中执行，且使用数据库最新数据，不能相信客户端提交的 author_id。

## 9. 常见问题与测试

- Token 过期返回 401，而不是 500。
- 普通用户访问管理员路由返回 403。
- 禁用用户即使 Token 未过期也不能继续执行写操作。
- 不记录完整 Token。
- Refresh Token 撤销后不能再次刷新。

测试：注册成功、重复用户名、错误密码、过期 Token、错误签名、普通用户越权、管理员正常操作、退出后刷新失败。

## 10. 继续阅读

- 上一篇：[18-项目配置日志与启动流程](./18-项目配置日志与启动流程.md)
- 下一篇：[20-文章分类标签模块](./20-文章分类标签模块.md)

