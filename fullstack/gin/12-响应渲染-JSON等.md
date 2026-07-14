# 第12章：响应渲染 —— JSON/XML/YAML/String/HTML

## 本章目标
学完本章后，你将能够：
1. 使用 `c.JSON()` 返回各种格式的 JSON
2. 使用 `c.XML()` / `c.YAML()` 返回其他格式
3. 使用 `c.String()` / `c.Data()` / `c.Stream()` 返回文本和二进制
4. 根据场景选择合适的响应渲染方法

## 前置知识
- 需要先学习：第03章（路由基础）、第10章（参数绑定）

---

## 12.1 JSON 响应

JSON 是 API 开发中最常用的响应格式：

```go
// 基础 JSON
c.JSON(http.StatusOK, gin.H{"message": "ok"})

// 结构体（字段会被导出）
type User struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
c.JSON(http.StatusOK, User{Name: "张三", Age: 25})

// Map
c.JSON(http.StatusOK, map[string]interface{}{
	"users": []string{"张三", "李四"},
	"total": 2,
})
```

---

## 12.2 JSON 变体

```go
// IndentedJSON：美化输出（开发调试用）
c.IndentedJSON(http.StatusOK, gin.H{
	"name": "张三",
	"age":  25,
})
// 输出带缩进：
// {
//     "age": 25,
//     "name": "张三"
// }

// PureJSON：不转义 HTML（默认会转义 & > < 等字符）
c.PureJSON(http.StatusOK, gin.H{
	"html": "<p>hello</p>",
})
// 输出："html":"<p>hello</p>"（不转义）

// SecureJSON：防止 JSON 劫持（在前加 while(1); 前缀）
c.SecureJSON(http.StatusOK, gin.H{"data": "sensitive"})
// 输出：while(1);{"data":"sensitive"}

// AsciiJSON：非 ASCII 字符转 Unicode（防止乱码）
c.AsciiJSON(http.StatusOK, gin.H{"name": "张三"})
// 输出：{"name":"张三"}

// JSONP：跨域 JSONP 回调
c.JSONP(http.StatusOK, gin.H{"name": "张三"})
// ?callback=func → func({"name":"张三"});
```

---

## 12.3 XML 和 YAML

```go
// XML 响应
c.XML(http.StatusOK, gin.H{"message": "ok"})
// <map><message>ok</message></map>

type User struct {
	XMLName xml.Name `xml:"user"`
	Name    string   `xml:"name"`
	Age     int      `xml:"age"`
}
c.XML(http.StatusOK, User{Name: "张三", Age: 25})
// <user><name>张三</name><age>25</age></user>

// YAML 响应
c.YAML(http.StatusOK, gin.H{"message": "ok"})
// message: ok
```

---

## 12.4 字符串、二进制和流

```go
// 纯文本
c.String(http.StatusOK, "返回纯文本")

// 格式化字符串
c.String(http.StatusOK, "用户 %s 的年龄是 %d", "张三", 25)

// 原始字节（文件下载、图片等）
c.Data(http.StatusOK, "application/octet-stream", fileBytes)

// 流式响应（大文件、实时数据）
c.Stream(func(w io.Writer) bool {
	for i := 0; i < 10; i++ {
		fmt.Fprintf(w, "第 %d 条数据\n", i)
		time.Sleep(100 * time.Millisecond)
	}
	return false
})
```

---

## 12.5 响应方法选择指南

| 场景 | 方法 | 状态码 |
|------|------|--------|
| API 返回数据 | `c.JSON(200, data)` | 200 |
| 创建成功 | `c.JSON(201, data)` | 201 |
| 错误响应 | `c.JSON(400/404/500, msg)` | 相应错误码 |
| 调试查看 | `c.IndentedJSON(200, data)` | 200 |
| HTML 页面 | `c.HTML(200, "tpl", data)` | 200 |
| 纯文本 | `c.String(200, msg)` | 200 |
| 文件下载 | `c.Data()` / `c.File()` | 200 |
| 实时流 | `c.Stream()` | 200 |
| 重定向 | `c.Redirect(302, url)` | 302 |

---

## 常见错误

### 错误1：结构体字段忘了 json 标签

```go
type User struct {
	Name string  // ❌ 没有 json 标签，大写导出，JSON key 是 "Name"
	age  int     // ❌ 小写不导出，JSON 中不会出现
}

// ✅ 推荐始终加 json 标签
type User struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
```

### 错误2：JSON 中包含敏感字段

```go
type User struct {
	Name     string `json:"name"`
	Password string `json:"password"` // ❌ 密码也返回了！
}

// ✅ 密码字段用 json:"-"
type User struct {
	Name     string `json:"name"`
	Password string `json:"-"`
}
```

### 错误3：纯文本设了错误的 Content-Type

```go
// ❌ 纯文本却用 c.JSON
c.JSON(200, "hello")  // 返回 "hello"（带引号），Content-Type 是 application/json

// ✅ 纯文本用 c.String
c.String(200, "hello")  // 返回 hello，Content-Type 是 text/plain
```

---

## 本章小结

- JSON：`c.JSON()`（最常用）、`c.IndentedJSON()`（调试）
- 安全 JSON：`c.SecureJSON()`（防劫持）、`c.PureJSON()`（不转义 HTML）
- 其他格式：`c.XML()`、`c.YAML()`、`c.String()`
- 二进制：`c.Data()` + Content-Type
- 流式：`c.Stream()` 实时推送
- 字段用 `json:"-"` 隐藏，用 `json:"name,omitempty"` 空值不输出

## 练习题

1. 写一个接口返回 Indented JSON，包含用户的基本信息。
2. 对比 `c.JSON`、`c.PureJSON`、`c.SecureJSON` 在返回 HTML 字符串时的差异。
3. 写一个流式响应的接口，逐秒推送 5 条消息。
4. （思考题）为什么 JSON 劫持攻击需要 `SecureJSON` 来防御？攻击原理是什么？
