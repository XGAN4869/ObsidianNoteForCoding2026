package main

import (
	"xioagandashen/handler"
	"xioagandashen/repository"
	"xioagandashen/router"
	"xioagandashen/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
    dsn := "root:12345678@tcp(127.0.0.1:3307)/blog_db?charset=utf8mb4&parseTime=True&loc=Local"
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil { panic(err) }

    userRepo := repository.NewUserRepo(db)
    userSvc  := service.NewUserService(userRepo)
    userHdl  := handler.NewUserHandler(userSvc)

    r := gin.Default()
    router.Setup(r, userHdl)
    r.Run(":8080")
}