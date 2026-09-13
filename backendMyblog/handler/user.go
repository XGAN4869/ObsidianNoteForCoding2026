// handler/user.go
package handler

import (
	"net/http"
	"strconv"
	"xioagandashen/dto"
	"xioagandashen/middleware"
	"xioagandashen/service"
	"xioagandashen/utils"

	"github.com/gin-gonic/gin"
)

type UserHandler struct{ svc *service.UserService }

func NewUserHandler(s *service.UserService) *UserHandler { return &UserHandler{svc: s} }

func (h *UserHandler) Register(c *gin.Context) {
    var req dto.RegisterReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    u, err := h.svc.Register(req)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"code": 0, "data": service.ToUserResp(u)})
}



func (h *UserHandler) GetProfile(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    u, err := h.svc.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"code": 0, "data": service.ToUserResp(u)})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
    userID := c.GetUint64(middleware.CtxUserID) // 来自 token
    var req dto.UpdateProfileReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    u, err := h.svc.UpdateProfile(userID, req)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"code": 0, "data": service.ToUserResp(u)})
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
    // 身份来自 JWT 中间件注入的 context，而非 URL
    userID := c.GetUint64(middleware.CtxUserID)
    if userID == 0 {
        c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "未登录"})
        return
    }

    var req dto.ChangePasswordReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }

    if err := h.svc.ChangePassword(userID, req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "ok"})
}
func (h *UserHandler) Login(c *gin.Context) {
    var req dto.LoginReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": err.Error()})
        return
    }
    u, err := h.svc.Login(req)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": err.Error()})
        return
    }
    // 签发 token
    token, err := utils.GenerateToken(u.ID, u.Role)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "签发 token 失败"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"code": 0, "data": gin.H{
        "token": token,
        "user":  service.ToUserResp(u),
    }})
}