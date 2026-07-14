# 第06章：表单参数与 Body 读取

## 本章目标
学完本章后，你将能够：
1. 使用 `c.PostForm()` 获取表单参数
2. 使用 `c.GetRawData()` 读取原始请求体
3. 理解不同 Content-Type 的区别
4. 正确选择参数获取方式

## 前置知识
- 需要先学习：第05章（路径参数和查询参数）
- 需要了解：第02章的 Content-Type 概念

---

## 6.1 表单参数（application/x-www-form-urlencoded）

表单参数是 HTML 表单提交时最常用的格式：

```go
r.POST("/login", func(c *gin.Context) {
	// 获取单个表单字段
	username := c.PostForm("username")
	password := c.PostForm("password")

	// 带默认值
	remember := c.DefaultPostForm("remember", "false")

	c.JSON(200, gin.H{
		"username": username,
		"password": password,  // ⚠️ 实际项目中绝不要返回密码！
		"remember": remember,
	})
})
```

```bash
# 方式一：form 格式
curl -X POST http://localhost:8080/login \
  -d "username=zhangsan&password=123456&remember=true"

# 方式二：-F 参数（自动设置 Content-Type）
curl -X POST http://localhost:8080/login \
  -F "username=zhangsan" \
  -F "password=123456"
```

---

## 6.2 读取原始请求体

```go
r.POST("/webhook", func(c *gin.Context) {
	// 获取原始 Body（字节切片）
	body, err := c.GetRawData()
	if err != nil {
		c.JSON(400, gin.H{"error": "读取失败"})
		return
	}

	// 打印原始内容
	fmt.Printf("收到 webhook: %s\n", string(body))

	c.JSON(200, gin.H{"msg": "收到"})
})
```

> ⚠️ `c.GetRawData()` 是一次性读取！读完后 Body 就空了。如果后续还要用 `c.ShouldBindJSON()`，需要先 `c.Request.Body = io.NopCloser(bytes.NewBuffer(body))` 恢复。

---

## 6.3 三种 Content-Type 对比

```go
r.POST("/test", func(c *gin.Context) {
	contentType := c.ContentType()

	switch contentType {
	case "application/json":
		// JSON Body → 第10章 c.ShouldBindJSON
	case "application/x-www-form-urlencoded":
		// HTML 表单 → c.PostForm
	case "multipart/form-data":
		// 文件上传 → 第20章 c.FormFile
	}

	c.JSON(200, gin.H{"content_type": contentType})
})
```

| Content-Type | 场景 | Gin 读取方式 | 何时用 |
|-------------|------|------------|--------|
| `application/json` | 前后端分离 | `c.ShouldBindJSON()` | API 接口 |
| `x-www-form-urlencoded` | HTML 表单 | `c.PostForm()` | 传统表单 |
| `multipart/form-data` | 文件上传 | `c.FormFile()` | 传文件 |

---

## 6.4 为什么 PostForm 不能读 JSON Body

这是一个常见误区：

```go
// ❌ 尝试用 PostForm 读取 JSON Body
r.POST("/users", func(c *gin.Context) {
	name := c.PostForm("name")  // 永远返回空字符串！
})

// curl 发送了 JSON：
// curl -X POST http://localhost:8080/users -H "Content-Type: application/json" -d '{"name":"张三"}'
// PostForm 只能读 form-urlencoded 和 multipart，不会读 JSON！
```

**PostForm 只读两种格式**：`application/x-www-form-urlencoded` 和 `multipart/form-data`。

JSON 数据必须用 `c.ShouldBindJSON()` 或 `c.GetRawData() + json.Unmarshal`（第10章详解）。

---

## 6.5 完整示例

```go
package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 登录接口（表单参数）
	r.POST("/login", func(c *gin.Context) {
		username := c.PostForm("username")
		password := c.PostForm("password")

		if username == "" || password == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "用户名和密码不能为空",
			})
			return
		}

		// 实际项目中这里验证用户名密码
		if username == "admin" && password == "123456" {
			c.JSON(http.StatusOK, gin.H{"msg": "登录成功"})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		}
	})

	// Webhook 接口（接收原始 Body）
	r.POST("/webhook", func(c *gin.Context) {
		body, _ := c.GetRawData()
		contentType := c.ContentType()

		fmt.Printf("Content-Type: %s\n", contentType)
		fmt.Printf("Body: %s\n", string(body))

		c.JSON(http.StatusOK, gin.H{"msg": "收到"})
	})

	r.Run(":8080")
}
```

---

## 常见错误

### 错误1：用 PostForm 读取 JSON

```go
// ❌ 发送的是 JSON，却用 PostForm 读
// curl -X POST ... -H "Content-Type: application/json" -d '{"name":"张三"}'
name := c.PostForm("name")  // 永远为空！
```

### 错误2：GetRawData 后还想 ShouldBindJSON

```go
// ❌ Body 已经被 GetRawData 消耗了
body, _ := c.GetRawData()
var user User
c.ShouldBindJSON(&user)  // 失败！Body 已经空了

// ✅ 需要恢复 Body
body, _ := c.GetRawData()
c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
var user User
c.ShouldBindJSON(&user)  // 现在可以了
```

### 错误3：Content-Type 与数据格式不匹配

```bash
# ❌ 声明是 JSON，但数据是表单格式
curl -X POST http://localhost:8080/api \
  -H "Content-Type: application/json" \
  -d "name=张三&age=25"
# 服务端按 JSON 解析，报错！
```

---

## 本章小结

- `c.PostForm("key")` 读取表单参数（form-urlencoded/multipart）
- `c.GetRawData()` 读取原始 Body（任何格式）
- `c.ContentType()` 判断请求的 Content-Type
- JSON Body 不能用 PostForm 读，必须用 ShouldBindJSON
- GetRawData 一次性消费，用后需恢复 Body

## 练习题

1. 写一个登录接口，用 PostForm 读取用户名和密码，返回验证结果。
2. 写一个 Webhook 接口，打印接收到的原始请求体和 Content-Type。
3. 分别用 form-urlencoded 和 JSON 发送请求，观察 PostForm 的行为差异。
4. （思考题）为什么 Gin 不提供一个能同时读 JSON 和 Form 的"万能方法"？
