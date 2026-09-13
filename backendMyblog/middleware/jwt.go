// middleware/jwt.go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "xioagandashen/utils"
)

const (
    CtxUserID = "userID"
    CtxRole   = "role"
)

// 解析 Bearer token，注入 userID/role 到 context
func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                gin.H{"code": 401, "msg": "未登录"})
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                gin.H{"code": 401, "msg": "Token 格式错误"})
            return
        }

        claims, err := utils.ParseToken(parts[1])
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                gin.H{"code": 401, "msg": "Token 无效或已过期"})
            return
        }

        // 注入上下文，后续 handler 用 c.GetUint64(CtxUserID) 取
        c.Set(CtxUserID, claims.UserID)
        c.Set(CtxRole, claims.Role)
        c.Next()
    }
}

// 角色校验（可选，管理员接口用）
func RequireRole(roles ...int8) gin.HandlerFunc {
    return func(c *gin.Context) {
        v, ok := c.Get(CtxRole)
        if !ok {
            c.AbortWithStatusJSON(http.StatusForbidden,
                gin.H{"code": 403, "msg": "无权限"})
            return
        }
        role := v.(int8)
        for _, r := range roles {
            if role == r {
                c.Next()
                return
            }
        }
        c.AbortWithStatusJSON(http.StatusForbidden,
            gin.H{"code": 403, "msg": "无权限"})
    }
}