# 第03章：路由基础 —— GET/POST/PUT/DELETE

## 本章目标
学完本章后，你将能够：
1. 注册 GET/POST/PUT/DELETE/PATCH 五种路由
2. 理解 `gin.Context` 的核心作用
3. 返回 String、JSON、HTML 三种格式的响应
4. 用 curl 和 Postman 测试 API
5. 理解路由方法如何映射到 CRUD 操作

## 前置知识
- 需要先学习：第01-02章（Gin入门、HTTP基础）

---

## 3.1 路由注册全览

Gin 提供了对应 HTTP 方法的路由注册函数：

```go
r := gin.Default()

r.GET("/users", handler)       // 查询
r.POST("/users", handler)      // 创建
r.PUT("/users/:id", handler)   // 完整更新
r.PATCH("/users/:id", handler) // 部分更新
r.DELETE("/users/:id", handler)// 删除

// 还有一个特殊的
r.Any("/ping", handler)        // 匹配所有 HTTP 方法
```

---

## 3.2 `gin.Context`：请求的"身份证"

每一个请求到达时，Gin 会创建一个 `*gin.Context` 对象，它贯穿整个请求处理过程。

```go
func handler(c *gin.Context) {
	// c 包含了这次请求的全部信息
	
	// 读：请求信息
	c.Request.Method        // "GET"
	c.Request.URL.Path      // "/users"
	c.ClientIP()            // 客户端 IP
	
	// 写：构建响应
	c.JSON(200, data)       // 返回 JSON
	c.String(200, "hello")  // 返回纯文本
	c.HTML(200, "tpl", nil) // 返回 HTML
	
	// 控制：请求流程
	c.Next()                // 交给下一个处理器
	c.Abort()               // 中止后续处理
	c.Set("key", value)     // 存值（跨中间件传递）
	c.Get("key")            // 取值
}
```

> 📌 `*gin.Context` 是 Gin 中使用频率最高的对象。后续每一章都在和它打交道。

---

## 3.3 GET 路由

### 返回字符串

```go
r.GET("/hello", func(c *gin.Context) {
	c.String(http.StatusOK, "你好，世界！")
})
// curl http://localhost:8080/hello
// 输出：你好，世界！
```

### 返回 JSON

```go
// 方式一：gin.H（最常用）
r.GET("/user", func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"name": "张三",
		"age":  25,
	})
})
// curl http://localhost:8080/user
// {"age":25,"name":"张三"}

// 方式二：传入结构体
type User struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
r.GET("/user2", func(c *gin.Context) {
	c.JSON(http.StatusOK, User{Name: "张三", Age: 25})
})

// 方式三：传入 map
r.GET("/user3", func(c *gin.Context) {
	c.JSON(http.StatusOK, map[string]interface{}{
		"name": "张三",
		"age":  25,
	})
})
```

---

## 3.4 POST 路由

```go
// 接收 POST 请求，返回创建成功的 JSON
r.POST("/users", func(c *gin.Context) {
	// 实际项目中，这里会解析 Body、存入数据库
	c.JSON(http.StatusCreated, gin.H{
		"message": "用户创建成功",
		"id":      1,
	})
})
```

```bash
curl -X POST http://localhost:8080/users
# {"id":1,"message":"用户创建成功"}
```

> 📌 创建成功通常返回 `201 Created`，而不是 `200 OK`。

---

## 3.5 PUT 和 PATCH 路由

```go
// PUT：完整更新（替换资源的所有字段）
r.PUT("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("用户 %s 已完整更新", id),
	})
})

// PATCH：部分更新（只更新传入的字段）
r.PATCH("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("用户 %s 已部分更新", id),
	})
})
```

---

## 3.6 DELETE 路由

```go
r.DELETE("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	// 删除成功后通常返回 200 + 消息，或 204 No Content
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("用户 %s 已删除", id),
	})
})
```

---

## 3.7 完整示例：迷你 CRUD API

```go
package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// GET     /users     → 用户列表
	r.GET("/users", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"users": []gin.H{
				{"id": 1, "name": "张三"},
				{"id": 2, "name": "李四"},
			},
		})
	})

	// GET     /users/:id → 用户详情
	r.GET("/users/:id", func(c *gin.Context) {
		id := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"id":   id,
			"name": fmt.Sprintf("用户%s", id),
		})
	})

	// POST    /users     → 创建用户
	r.POST("/users", func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{
			"id":      3,
			"message": "用户创建成功",
		})
	})

	// PUT     /users/:id → 完整更新用户
	r.PUT("/users/:id", func(c *gin.Context) {
		id := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("用户%s完整更新", id),
		})
	})

	// DELETE  /users/:id → 删除用户
	r.DELETE("/users/:id", func(c *gin.Context) {
		id := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("用户%s已删除", id),
		})
	})

	r.Run(":8080")
}
```

测试所有接口：
```bash
curl http://localhost:8080/users              # 列表
curl http://localhost:8080/users/1            # 详情
curl -X POST http://localhost:8080/users      # 创建
curl -X PUT http://localhost:8080/users/1     # 更新
curl -X DELETE http://localhost:8080/users/1  # 删除
```

---

## 3.8 路由方法与 CRUD 的对应关系

```
HTTP方法  →  SQL操作   →  业务含义
─────────────────────────────────────
GET       →  SELECT    →  查询/读取
POST      →  INSERT    →  创建/新增
PUT       →  UPDATE    →  更新(全量覆盖)
PATCH     →  UPDATE    →  更新(部分修改)
DELETE    →  DELETE    →  删除
```

> 📌 实际项目中，POST 也能用于更新，PUT 也能用于创建，但遵循标准约定让你的 API 更好维护。

---

## 常见错误

### 错误1：用 `r.GET` 注册 POST 路由

```go
// ❌ GET 方法注册了创建操作
r.GET("/users", createUser)  // 创建应该用 POST！

// ✅ 创建用 POST
r.POST("/users", createUser)
```

### 错误2：忘记 `http.StatusOK` 直接写数字

```go
// ❌ 魔法数字，别人看不懂
c.JSON(200, data)

// ✅ 用 http 包的常量，语义清晰
c.JSON(http.StatusOK, data)
```

### 错误3：创建成功用 200 而不是 201

```go
// ⚠️ 不标准（虽然能跑）
c.JSON(200, data)  // POST 创建成功

// ✅ 标准做法
c.JSON(http.StatusCreated, data)  // 201 Created
```

### 错误4：处理函数中忘记写 `c.JSON`

```go
// ❌ 请求一直挂起，超时才返回
r.GET("/users", func(c *gin.Context) {
	// 什么都没返回！客户端等到超时
})

// ✅ 必须调用 c.JSON/c.String/c.HTML 等方法返回响应
r.GET("/users", func(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
})
```

---

## 本章小结

| 方法 | Gin 注册 | 用途 | 成功状态码 |
|------|---------|------|----------|
| GET | `r.GET()` | 查询 | 200 |
| POST | `r.POST()` | 创建 | 201 |
| PUT | `r.PUT()` | 全量更新 | 200 |
| PATCH | `r.PATCH()` | 部分更新 | 200 |
| DELETE | `r.DELETE()` | 删除 | 200/204 |

- `*gin.Context` 是请求处理的核心对象
- `gin.H` 是构建 JSON 的快捷方式
- `r.Run(":8080")` 默认监听本地 8080 端口

## 练习题

1. 编写一个完整的 CRUD API 骨架（用户资源），包含 5 个接口。
2. 用 curl 测试每一个接口，确认返回正确的状态码。
3. 用 `http.StatusOK` 等常量替换所有硬编码的状态码数字。
4. 写一个 `GET /hello?name=张三` 接口，返回 `{"greeting": "你好，张三"}`。
5. （思考题）`PATCH` 和 `PUT` 的区别是什么？为什么实际项目中 PATCH 用得更多？
