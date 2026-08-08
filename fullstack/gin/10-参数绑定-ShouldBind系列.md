# 第10章：参数绑定 —— ShouldBind 系列

## 本章目标
学完本章后，你将能够：
1. 使用 `ShouldBindJSON` 绑定 JSON Body
2. 使用 `ShouldBindQuery` 绑定查询参数
3. 使用 `ShouldBindUri` 绑定路径参数
4. 使用 `ShouldBind` 自动选择绑定方式
5. 区分 ShouldBind 和 MustBind 的行为差异

## 前置知识
- 需要先学习：第05-06章（参数读取）、第01章的 Go 结构体和标签

---

## 10.1 什么是参数绑定

参数绑定让你**直接把请求参数映射到 Go 结构体**，不用手动一个字段一个字段地读：

```go
// ❌ 手写：一个字段一个字段读
name := c.Query("name")
age, _ := strconv.Atoi(c.DefaultQuery("age", "0"))
email := c.Query("email")
// ... 10 个字段，手酸

// ✅ 参数绑定：一行搞定
var query UserQuery
c.ShouldBindQuery(&query)
// query.Name, query.Age, query.Email 全部自动填好了！
```

---

## 10.2 四大绑定方法

| 方法 | 绑定来源 | 结构体标签 | 何时用 |
|------|---------|----------|--------|
| `ShouldBindJSON` | JSON Body | `json` | POST/PUT/PATCH 的 JSON 请求 |
| `ShouldBindQuery` | 查询参数 | `form` | GET 请求的 `?key=value` |
| `ShouldBindUri` | 路径参数 | `uri` | `/users/:id` 中的参数 |
| `ShouldBind` | 自动选择 | 根据 Content-Type | 不想手动区分来源时 |

---

## 10.3 ShouldBindJSON：绑定 JSON Body

```go
type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Email    string `json:"email"    binding:"required,email"`
	Age      int    `json:"age"`
}

r.POST("/users", func(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// req.Username, req.Password 等已自动填好
	c.JSON(201, gin.H{
		"username": req.Username,
		"email":    req.Email,
	})
})
```

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456","email":"zs@example.com","age":25}'
# {"email":"zs@example.com","username":"zhangsan"}
```

---

## 10.4 ShouldBindQuery：绑定查询参数

```go
type SearchRequest struct {
	Keyword  string `form:"keyword"`
	Status   string `form:"status"`
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
}

r.GET("/users", func(c *gin.Context) {
	var req SearchRequest

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 10
	}

	c.JSON(200, gin.H{
		"keyword":   req.Keyword,
		"status":    req.Status,
		"page":      req.Page,
		"page_size": req.PageSize,
	})
})
```

> 📌 查询参数绑定用 `form` 标签，不是 `json`！因为查询参数格式是 `key=value`，和表单一样。

---

## 10.5 ShouldBindUri：绑定路径参数

```go
type UserURI struct {
	ID   uint   `uri:"id" binding:"required"`
	Name string `uri:"name"`
}

r.GET("/users/:id/:name", func(c *gin.Context) {
	var uri UserURI

	if err := c.ShouldBindUri(&uri); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"id": uri.ID, "name": uri.Name})
})
```

---

## 10.6 ShouldBind：自动选择

`ShouldBind` 根据 Content-Type 自动选择绑定方式：

```go
r.POST("/users", func(c *gin.Context) {
	var req CreateUserRequest

	// ShouldBind 自动判断：
	// Content-Type: application/json → 按 JSON 绑定
	// Content-Type: application/x-www-form-urlencoded → 按表单绑定
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"username": req.Username})
})
```

> 📌 `ShouldBind` 很方便，但有个坑：结构体标签必须同时写 `json` 和 `form`，因为不知道请求是哪种格式。

---

## 10.7 ShouldBind vs MustBind

| 方法 | 绑定失败时 | 何时用 |
|------|----------|--------|
| `ShouldBind` | 返回 error，你手动处理 | 推荐 ✅ |
| `MustBind` | 自动返回 400 + 错误信息 | 简单场景 |

```go
// ShouldBind：自己处理错误（推荐）
if err := c.ShouldBindJSON(&req); err != nil {
	c.JSON(400, gin.H{"code": 1001, "message": "参数错误", "detail": err.Error()})
	return
}

// MustBind：自动 400（不能自定义错误格式）
c.MustBindWith(&req, binding.JSON)
// 失败时自动返回：{"error": "Key: '...' Error:Field validation..."}
```

> 📌 **推荐始终用 ShouldBind**，可以自定义错误格式和业务错误码。

---

## 10.8 结构体标签速查

| 标签 | 数据来源 | 绑定方法 |
|------|---------|---------|
| `json:"name"` | JSON Body | `ShouldBindJSON` |
| `form:"name"` | Query / Form | `ShouldBindQuery` / `ShouldBind` |
| `uri:"name"` | URI Path | `ShouldBindUri` |
| `header:"name"` | Request Header | `ShouldBindHeader` |
| `binding:"required"` | — | 验证规则（第11章） |

---

## 常见错误

### 错误1：用 `json` 标签绑定查询参数

```go
// ❌ ShouldBindQuery 读的是 form 标签！
type Req struct {
	Name string `json:"name"`
}
c.ShouldBindQuery(&req)  // req.Name 永远为空

// ✅ 查询参数用 form 标签
type Req struct {
	Name string `form:"name"`
}
```

### 错误2：ShouldBind 时标签不全

```go
// ShouldBind 不知道请求是 JSON 还是 Form
// 结构体需要同时写两种标签
type Req struct {
	Name string `json:"name" form:"name"`  // 两种都要
}
c.ShouldBind(&req)
```

### 错误3：忘记传指针

```go
// ❌ ShouldBind 必须传指针
var req SearchRequest
c.ShouldBindQuery(req)  // 编译错误！

// ✅ 传指针
c.ShouldBindQuery(&req)
```

---

## 本章小结

- `ShouldBindJSON` + `json` 标签 → JSON Body
- `ShouldBindQuery` + `form` 标签 → 查询参数
- `ShouldBindUri` + `uri` 标签 → 路径参数
- `ShouldBind` 自动选择 → 需要同时写 `json` 和 `form`
- 始终用 ShouldBind，不用 MustBind

## 练习题

1. 用 `ShouldBindJSON` 绑定创建用户的 JSON 请求体。
2. 用 `ShouldBindQuery` 绑定搜索用户的查询参数（keyword, page, page_size）。
3. 用 `ShouldBindUri` 绑定 `/users/:id/orders/:order_id` 路径参数。
4. 对比 `ShouldBind` 和 `ShouldBindJSON` 的行为差异。
5. （思考题）为什么 GORM 的 `Where` 零值会被跳过，但参数绑定中的零值（如 `Page=0`）不会？两种设计背后的考虑是什么？
