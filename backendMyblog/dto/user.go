// dto/user.go
package dto

type RegisterReq struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Password string `json:"password" binding:"required,min=6,max=32"`
    Nickname string `json:"nickname" binding:"max=50"`
    Email    string `json:"email" binding:"omitempty,email,max=100"`
}

type LoginReq struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type UpdateProfileReq struct {
    Nickname string `json:"nickname" binding:"max=50"`
    Email    string `json:"email" binding:"omitempty,email,max=100"`
    Avatar   string `json:"avatar" binding:"max=255"`
    Bio      string `json:"bio" binding:"max=255"`
}

type ChangePasswordReq struct {
    OldPassword string `json:"oldPassword" binding:"required"`
    NewPassword string `json:"newPassword" binding:"required,min=6,max=32"`
}

type UserResp struct {
    ID         uint64 `json:"id"`
    Username   string `json:"username"`
    Nickname   string `json:"nickname"`
    Email      string `json:"email"`
    Avatar     string `json:"avatar"`
    Bio        string `json:"bio"`
    Role       int8   `json:"role"`
    Status     int8   `json:"status"`
    CreateTime string `json:"createTime"`
}