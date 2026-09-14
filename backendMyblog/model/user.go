// model/user.go
package model

import "time"

type User struct {
    ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
    Username   string    `gorm:"size:50;uniqueIndex;not null" json:"username"`
    Password   string    `gorm:"size:100;not null" json:"-"` // json:"-" 永不出参
    Nickname   string    `gorm:"size:50;not null;default:''" json:"nickname"`
    Email      string    `gorm:"size:100;not null;default:'';index" json:"email"`
    Avatar     string    `gorm:"size:255;not null;default:''" json:"avatar"`
    Bio        string    `gorm:"size:255;not null;default:''" json:"bio"`
    Role       int8      `gorm:"not null;default:2" json:"role"`   // 1管理员 2作者
    Status     int8      `gorm:"not null;default:1" json:"status"` // 0禁用 1启用
    CreateTime time.Time `gorm:"autoCreateTime" json:"createTime"`
    UpdateTime time.Time `gorm:"autoUpdateTime" json:"updateTime"`
}

func (User) TableName() string { return "user" }