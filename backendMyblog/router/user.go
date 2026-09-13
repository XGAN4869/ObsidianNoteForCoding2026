// router/router.go
package router

import (
    "github.com/gin-gonic/gin"
    "xioagandashen/handler"
    "xioagandashen/middleware"
)

func Setup(r *gin.Engine, uh *handler.UserHandler) {
    api := r.Group("/api/user")
    {
        // 公开
        api.POST("/register", uh.Register)
        api.POST("/login", uh.Login)
        api.GET("/:id", uh.GetProfile)

        // 需登录
        auth := api.Group("")
        auth.Use(middleware.JWTAuth())
        {
            auth.PUT("/profile", uh.UpdateProfile)          // 改为 /profile，无需 :id
            auth.PUT("/password", uh.ChangePassword)
        }

        // 仅管理员（示例）
        admin := api.Group("/admin")
        admin.Use(middleware.JWTAuth(), middleware.RequireRole(1))
        {
            // admin.GET("/list", uh.ListUsers)
        }
    }
}