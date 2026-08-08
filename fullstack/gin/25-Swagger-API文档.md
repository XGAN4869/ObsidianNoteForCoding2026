# 第25章：Swagger API 文档

## 本章目标
学完本章后，你将能够：
1. 理解 Swagger/OpenAPI 的作用
2. 使用 swaggo/swag 生成 API 文档
3. 用注释驱动文档生成
4. 用 Swagger UI 在线测试 API

## 前置知识
- 需要先学习：第03-04章（路由基础）、第10-13章（参数绑定和响应）

---

## 25.1 安装

```bash
go install github.com/swaggo/swag/cmd/swag@latest
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
```

---

## 25.2 API 注释规范

```go
package main

// @title           用户管理系统 API
// @version         1.0
// @description     用户注册、登录、CRUD 接口
// @host            localhost:8080
// @BasePath        /api/v1
// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
func main() { ... }
```

### 接口注释

```go
// @Summary      获取用户列表
// @Description  支持分页和状态筛选
// @Tags         用户
// @Accept       json
// @Produce      json
// @Param        page      query    int     false  "页码"     default(1)
// @Param        page_size query    int     false  "每页条数"  default(10)
// @Param        status    query    string  false  "用户状态"
// @Success      200  {object}  Response{data=[]User}
// @Failure      400  {object}  Response
// @Security     Bearer
// @Router       /users [get]
func ListUsers(c *gin.Context) { ... }

// @Summary      创建用户
// @Tags         用户
// @Accept       json
// @Produce      json
// @Param        body  body      CreateUserRequest  true  "用户信息"
// @Success      201   {object}  Response{data=User}
// @Failure      400   {object}  Response
// @Router       /users [post]
func CreateUser(c *gin.Context) { ... }

// @Summary      获取用户详情
// @Tags         用户
// @Param        id  path  int  true  "用户ID"
// @Success      200 {object} Response{data=User}
// @Failure      404 {object} Response
// @Router       /users/{id} [get]
func GetUser(c *gin.Context) { ... }
```

---

## 25.3 生成文档

```bash
swag init -g main.go
```

生成 `docs/` 目录：
```
docs/
├── docs.go
├── swagger.json
└── swagger.yaml
```

### 在 Gin 中集成

```go
import (
	_ "gin-project/docs"  // swag init 生成的 docs 包
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	r := gin.Default()

	// Swagger UI 访问地址
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ... 你的路由
	r.Run(":8080")
}
```

访问 `http://localhost:8080/swagger/index.html` → 在线 API 文档 + 测试界面。

---

## 25.4 注释标记速查

| 标记 | 说明 | 示例 |
|------|------|------|
| `@Summary` | 简短摘要 | `@Summary 获取用户列表` |
| `@Tags` | 分组标签 | `@Tags 用户` |
| `@Param` | 参数定义 | `@Param id path int true "用户ID"` |
| `@Success` | 成功响应 | `@Success 200 {object} Response` |
| `@Failure` | 失败响应 | `@Failure 400 {object} Response` |
| `@Router` | 路由 | `@Router /users/{id} [get]` |
| `@Security` | 认证方式 | `@Security Bearer` |

---

## 本章小结

- Swagger 用注释生成在线 API 文档
- `swag init -g main.go` 生成文档代码
- `gin-swagger` 一行代码集成 Swagger UI
- 文档即代码：改了代码，重新生成文档即可

## 练习题

1. 为你的项目添加 Swagger 注释。
2. 运行 `swag init` 生成文档。
3. 集成 Swagger UI，在浏览器中测试 API。
4. （思考题）Swagger 文档在前后端协作中解决了什么问题？除了 Swagger，还有哪些 API 文档方案？
