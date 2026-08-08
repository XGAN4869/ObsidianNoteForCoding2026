# 第01章：Gin 框架概述与安装

## 本章目标
学完本章后，你将能够：
1. 理解什么是 Web 框架以及为什么需要它
2. 对比 Go 主流 Web 框架的差异
3. 安装 Gin 并跑通第一个 HTTP 服务
4. 理解 `gin.Default()` 和 `gin.New()` 的区别
5. 逐行理解 Gin 程序的每个部分

## 前置知识
- 需要先学习：Go 语言基础（变量、函数、结构体、指针、`go mod`）
- 需要了解：用浏览器访问过网站（知道 URL 是什么即可）

---

## 1.1 什么是 Web 框架

### 没有框架的世界：用 `net/http` 写服务

Go 标准库自带了 `net/http`，可以不用任何框架就写 HTTP 服务：

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	// 注册路由
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, World!")
	})

	// 启动服务
	http.ListenAndServe(":8080", nil)
}
```

这已经能跑了，但随着业务增长，你会发现很多痛点：
- 获取路径参数 `/users/:id` 要手写解析
- 获取 JSON Body 要手写 `json.Unmarshal`
- 参数校验要手写
- 每个请求都要手写日志
- 没有中间件机制

### 框架帮你做了什么

```go
// 用 Gin 写同样的功能
r := gin.Default()
r.GET("/users/:id", func(c *gin.Context) {
	id := c.Param("id")         // 直接获取路径参数
	c.JSON(200, gin.H{"id": id}) // 一行返回 JSON
})
r.Run(":8080")
```

Web 框架帮你处理了：
- **路由匹配**：自动解析路径参数
- **参数解析**：自动绑定 JSON/Form/Query
- **参数校验**：一行标签搞定
- **响应封装**：一行返回 JSON/XML
- **中间件**：日志、恢复、认证、跨域...

---

## 1.2 Go Web 框架对比

| 框架 | Stars | 特点 | 适用场景 |
|------|-------|------|---------|
| **Gin** | 77k+ | 高性能、轻量、文档丰富 | ⭐ 绝大多数项目首选 |
| Echo | 29k+ | 类似 Gin，路由稍强 | 喜欢 Echo API 风格 |
| Fiber | 32k+ | Express.js 风格，极快 | 从 Node.js 转 Go |
| Beego | 31k+ | 全栈 MVC，类似 Django | 需要全栈框架 |
| net/http | 标准库 | 零依赖 | 极小项目 |

**为什么选 Gin**：
- GitHub 77k+ Stars（Go Web 框架第 1）
- 高性能（基于 httprouter 的 Radix Tree 路由）
- API 简洁优雅
- 中间件生态丰富（`gin-contrib` 系列）
- 中文资料最多

---

## 1.3 安装 Gin

### 第一步：创建项目

```bash
mkdir gin-tutorial
cd gin-tutorial
go mod init gin-tutorial
```

### 第二步：安装 Gin

```bash
go get -u github.com/gin-gonic/gin
```

安装完成后 `go.mod` 会新增一行：
```
require github.com/gin-gonic/gin v1.9.x
```

### 验证安装

```bash
go run main.go
# 如果没有报错，安装成功
```

---

## 1.4 第一个 Gin 程序

```go
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. 创建 Gin 引擎（包含 Logger 和 Recovery 中间件）
	r := gin.Default()

	// 2. 注册路由：GET /ping
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// 3. 启动 HTTP 服务，监听 8080 端口
	r.Run(":8080")
}
```

运行：
```bash
go run main.go
# 输出：
# [GIN-debug] GET    /ping    --> main.main.func1
# [GIN-debug] Listening and serving HTTP on :8080
```

测试：
```bash
curl http://localhost:8080/ping
# {"message":"pong"}
```

> 🎉 恭喜！你的第一个 Gin 服务已经跑起来了！

### 逐行程序解析

```go
r := gin.Default()
```
`gin.Default()` 创建一个 `*gin.Engine`，**自动附带 Logger（日志）和 Recovery（panic 恢复）中间件**。

```go
r.GET("/ping", func(c *gin.Context) { ... })
```
注册一个 GET 路由，路径是 `/ping`。当浏览器或 curl 访问 `GET /ping` 时，执行后面的函数。

```go
func(c *gin.Context)
```
这是**处理函数**（Handler）的签名。`*gin.Context` 是 Gin 的核心——它携带了这次请求的所有信息（参数、请求头、响应写入器），贯穿整个请求处理过程。

```go
c.JSON(http.StatusOK, gin.H{"message": "pong"})
```
返回一个 JSON 响应。`gin.H` 是 `map[string]interface{}` 的别名，方便构建 JSON：
```go
type H map[string]interface{}
```

```go
r.Run(":8080")
```
启动 HTTP 服务器，监听 8080 端口。等价于 `r.Run("0.0.0.0:8080")`。

---

## 1.5 `gin.Default()` vs `gin.New()`

```go
// Default：包含 Logger + Recovery 中间件
r := gin.Default()

// New：纯净引擎，没有任何中间件
r := gin.New()
```

| 方法 | 中间件 | 何时使用 |
|------|--------|---------|
| `gin.Default()` | Logger + Recovery | 大多数场景（推荐） |
| `gin.New()` | 无 | 需要完全自定义中间件时 |

> 📌 日常开发用 `gin.Default()` 就行。Recovery 能防止 panic 导致服务崩溃，Logger 帮你看到每个请求的日志。

### 验证 Recovery 的作用

```go
// 用 Default：访问 /panic 不会崩溃
r := gin.Default()
r.GET("/panic", func(c *gin.Context) {
	panic("出错了！")
})
r.Run(":8080")
// 访问 /panic → 返回 500，服务继续运行

// 用 New：访问 /panic → 服务崩溃！
r := gin.New()
r.GET("/panic", func(c *gin.Context) {
	panic("出错了！")
})
// 没有 Recovery 中间件，panic 会导致进程退出
```

---

## 1.6 热加载（开发利器）

每次改代码都要 `Ctrl+C` → `go run` → 再测试，很烦。用热加载工具：

```bash
# 安装 Air（最流行的 Go 热加载工具）
go install github.com/cosmtrek/air@latest

# 在项目目录下运行
air
# 之后每次保存代码，自动重新编译运行！
```

---

## 常见错误

### 错误1：端口被占用

```
listen tcp :8080: bind: address already in use
```

**原因**：8080 端口已经被其他程序占用。

**解决**：换个端口 `r.Run(":8081")` 或者关掉占用 8080 的程序。

### 错误2：`gin.H` 不是包

```go
// ❌ 错误：import "gin" 然后用 gin.H
// ❌ 错误：gin.H 只能在有 `github.com/gin-gonic/gin` 导入时使用

// ✅ 正确导入
import "github.com/gin-gonic/gin"
```

### 错误3：用 `go run` 运行了错误的文件

```bash
# ❌ 必须指定 main 包所在文件
go run main.go

# ✅ 或者整个包一起
go run .
```

---

## 本章小结

- Web 框架帮你省掉路由匹配、参数解析、响应封装等模板代码
- Gin 是 Go 生态最流行的 Web 框架（77k+ Stars）
- `gin.Default()` 自动包含 Logger + Recovery
- 一个 Gin 程序三步走：创建引擎 → 注册路由 → `Run()`
- `gin.Context` 是贯穿请求处理的核心对象
- `gin.H` 是 `map[string]interface{}` 的快捷别名

## 练习题

1. 创建一个 Gin 项目，写一个 `GET /hello` 接口，返回 `{"msg": "你好，世界"}`。
2. 分别用 `gin.Default()` 和 `gin.New()` 创建引擎，访问一个会 panic 的接口，观察区别。
3. 给服务换一个端口（比如 9090），验证是否生效。
4. 安装 Air 热加载工具，体验自动重启。
5. （思考题）为什么 Web 框架要提供中间件机制？直接用函数处理请求不行吗？
