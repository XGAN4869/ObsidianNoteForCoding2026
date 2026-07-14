# 附录C：项目环境搭建 FAQ

## Gin 安装 FAQ

**Q：怎么安装 Gin？**
```bash
go mod init myproject
go get -u github.com/gin-gonic/gin
```

**Q：下载慢怎么办？**
```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

**Q：Gin 需要什么 Go 版本？**
> Gin v1.9+ 需要 Go 1.20+。

## 开发工具推荐

| 工具 | 用途 |
|------|------|
| VS Code + Go 插件 | Go 开发主 IDE |
| Postman | API 测试（图形界面） |
| curl | API 测试（命令行） |
| httpie | API 测试（更友好的命令行） |
| Air | 代码热加载 |
| jq | JSON 格式化工具 |

## curl 常用测试命令

```bash
# GET 请求
curl http://localhost:8080/api/users

# GET + 查询参数
curl "http://localhost:8080/api/users?page=1&page_size=10"

# POST JSON
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'

# POST 表单
curl -X POST http://localhost:8080/login \
  -d "username=zhangsan&password=123456"

# 带 Token
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer eyJhbG..."

# 上传文件
curl -X POST http://localhost:8080/upload \
  -F "file=@/path/to/image.png"

# 查看详细信息（-v）
curl -v http://localhost:8080/api/users

# 格式化 JSON 输出（配合 jq）
curl http://localhost:8080/api/users | jq
```

## 目录结构模板

```
gin-project/
├── main.go              # 入口，组装路由
├── go.mod
├── config/
│   └── config.go        # 配置
├── models/
│   └── user.go          # 数据模型
├── handlers/            # 处理函数（Controller）
│   ├── user.go
│   └── article.go
├── middlewares/         # 中间件
│   ├── auth.go
│   └── cors.go
├── routes/
│   └── router.go        # 路由注册
├── response/
│   └── response.go      # 统一响应
├── docs/                # Swagger 文档
├── uploads/             # 文件上传目录
└── templates/           # HTML 模板
```

## 最小可运行项目

```go
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.Run(":8080")
}
```

运行：
```bash
go run main.go
# [GIN-debug] GET /ping → ...
# [GIN-debug] Listening and serving HTTP on :8080
```

测试：
```bash
curl http://localhost:8080/ping
# {"message":"pong"}
```
