# 第19章：HTML 模板渲染

## 本章目标
学完本章后，你将能够：
1. 使用 `LoadHTMLGlob` 加载模板文件
2. 使用 Go template 语法渲染动态页面
3. 实现模板嵌套与布局
4. 自定义模板函数

## 前置知识
- 需要先学习：第03章（路由基础）、第12章（响应渲染）

---

## 19.1 加载模板

```go
// 加载 templates/ 目录下所有 .html 文件
r.LoadHTMLGlob("templates/*")

// 加载所有子目录
r.LoadHTMLGlob("templates/**/*")

// 加载指定文件
r.LoadHTMLFiles("templates/index.html", "templates/about.html")
```

### 目录结构

```
gin-project/
├── main.go
└── templates/
    ├── index.html
    ├── user.html
    └── layout/
        └── base.html
```

---

## 19.2 Go Template 语法速成

```go
// 基础渲染
r.GET("/", func(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title":   "首页",
		"message": "欢迎来到 Gin！",
	})
})
```

### 模板语法

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ .title }}</title>              <!-- 输出变量 -->
</head>
<body>
    <h1>{{ .message }}</h1>
    
    <!-- 条件判断 -->
    {{ if .user }}
        <p>欢迎, {{ .user.Name }}</p>
    {{ else }}
        <p>请先登录</p>
    {{ end }}
    
    <!-- 循环 -->
    <ul>
    {{ range .items }}
        <li>{{ . }}</li>                      <!-- 循环中的 . 是当前元素 -->
    {{ else }}
        <li>列表为空</li>
    {{ end }}
    </ul>
    
    <!-- with：改变上下文 -->
    {{ with .user }}
        <p>{{ .Name }} ({{ .Email }})</p>    <!-- 这里的 . 指向 user -->
    {{ end }}
    
    <!-- 安全 HTML（默认会转义） -->
    {{ .content }}                            <!-- 转义 HTML -->
    {{ .content | safeHTML }}                 <!-- 不转义（需注册函数） -->
</body>
</html>
```

---

## 19.3 模板嵌套

```html
<!-- templates/layout/base.html -->
<!DOCTYPE html>
<html>
<head><title>{{ .title }}</title></head>
<body>
    <header>公共头部</header>
    
    {{ template "content" . }}               <!-- 插入子模板 -->
    
    <footer>公共底部</footer>
</body>
</html>
```

```html
<!-- templates/index.html -->
{{ define "content" }}
    <h1>{{ .message }}</h1>
    <p>这是首页的内容区域</p>
{{ end }}
```

```go
// 加载顺序：先布局，后页面
r.LoadHTMLGlob("templates/layout/*")
r.LoadHTMLGlob("templates/*")

r.GET("/", func(c *gin.Context) {
	c.HTML(200, "base.html", gin.H{
		"title":   "首页",
		"message": "欢迎！",
	})
})
```

---

## 19.4 自定义模板函数

```go
r.SetFuncMap(template.FuncMap{
	"formatTime": func(t time.Time) string {
		return t.Format("2006-01-02 15:04:05")
	},
	"add": func(a, b int) int {
		return a + b
	},
	"safeHTML": func(s string) template.HTML {
		return template.HTML(s)
	},
})
r.LoadHTMLGlob("templates/*")
```

模板中使用：
```html
<p>时间：{{ formatTime .created_at }}</p>
<p>总价：{{ add .price .tax }}</p>
```

---

## 常见错误

### 错误1：模板文件改了但不生效

Gin 在启动时加载模板到内存，修改模板后需要重启服务。生产环境这是优点（性能），开发时用 Air 热加载。

### 错误2：`{{ . }}` 中的点指向错误

```html
{{ range .items }}
    {{ . }}          ← 指向当前元素
    {{ $.title }}    ← 用 $ 指向根上下文
{{ end }}
```

---

## 本章小结

- `LoadHTMLGlob("templates/*")` 加载模板
- `{{ .var }}` 输出变量，`{{ range }}` 循环，`{{ if }}` 条件
- `{{ define "name" }}` + `{{ template "name" }}` 嵌套
- `SetFuncMap` 注册自定义函数
- `$` 指向根上下文

## 练习题

1. 创建一个简单博客首页，展示文章列表（标题+摘要）。
2. 实现布局模板 + 内容模板的嵌套结构。
3. 注册一个 `truncate` 函数用于截断长文本。
4. （思考题）Gin 的模板渲染和前端 SPA（React/Vue）方案相比，各有什么优劣？
