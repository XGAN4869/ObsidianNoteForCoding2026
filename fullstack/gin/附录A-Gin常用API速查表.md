# 附录A：Gin 常用 API 速查表

## 路由注册

| 方法 | 用途 |
|------|------|
| `r.GET(path, ...handler)` | GET 请求 |
| `r.POST(path, ...handler)` | POST 请求 |
| `r.PUT(path, ...handler)` | PUT 请求 |
| `r.PATCH(path, ...handler)` | PATCH 请求 |
| `r.DELETE(path, ...handler)` | DELETE 请求 |
| `r.Any(path, ...handler)` | 所有方法 |
| `r.NoRoute(handler)` | 404 处理 |
| `r.NoMethod(handler)` | 405 处理 |
| `r.Group(prefix)` | 路由分组 |
| `group.Use(middleware)` | 分组中间件 |

## Context 参数方法

| 方法 | 用途 |
|------|------|
| `c.Param("id")` | 获取路径参数 `:id` |
| `c.Query("key")` | 获取查询参数 `?key=value` |
| `c.DefaultQuery("key", "def")` | 带默认值查询参数 |
| `c.QueryArray("ids")` | 获取数组参数 |
| `c.PostForm("key")` | 获取表单参数 |
| `c.DefaultPostForm("key", "def")` | 带默认值表单参数 |
| `c.GetRawData()` | 获取原始 Body |
| `c.GetHeader("key")` | 获取请求头 |
| `c.ClientIP()` | 获取客户端 IP |
| `c.ContentType()` | 获取 Content-Type |

## 参数绑定

| 方法 | 绑定来源 | 标签 |
|------|---------|------|
| `c.ShouldBindJSON(&obj)` | JSON Body | `json` |
| `c.ShouldBindQuery(&obj)` | 查询参数 | `form` |
| `c.ShouldBindUri(&obj)` | 路径参数 | `uri` |
| `c.ShouldBind(&obj)` | 自动选择 | `json`+`form` |

## 绑定/验证标签

| 标签 | 用途 |
|------|------|
| `required` | 必填 |
| `min=n` / `max=n` | 最小/最大 |
| `len=n` | 精确长度 |
| `gt/gte/lt/lte` | 数字比较 |
| `eq=n` / `ne=n` | 等于/不等于 |
| `oneof=a b c` | 枚举值 |
| `email` / `url` | 格式验证 |
| `eqfield=F` / `nefield=F` | 跨字段 |

## 响应方法

| 方法 | 用途 |
|------|------|
| `c.JSON(code, obj)` | 返回 JSON |
| `c.IndentedJSON(code, obj)` | 美化 JSON |
| `c.XML(code, obj)` | 返回 XML |
| `c.YAML(code, obj)` | 返回 YAML |
| `c.String(code, format, args)` | 返回字符串 |
| `c.HTML(code, tpl, data)` | 渲染 HTML |
| `c.Data(code, contentType, bytes)` | 返回原始数据 |
| `c.File(filepath)` | 返回文件 |
| `c.FileAttachment(filepath, name)` | 文件下载 |
| `c.Redirect(code, url)` | 重定向 |

## Context 控制方法

| 方法 | 用途 |
|------|------|
| `c.Next()` | 传给下一个处理器 |
| `c.Abort()` | 中止后续处理器 |
| `c.AbortWithStatus(code)` | 中止+状态码 |
| `c.AbortWithStatusJSON(code, obj)` | 中止+JSON |
| `c.Set(key, value)` | 存值（跨中间件） |
| `c.Get(key)` | 取值 |
| `c.Error(err)` | 添加错误 |

## 文件操作

| 方法 | 用途 |
|------|------|
| `c.FormFile("field")` | 获取上传文件 |
| `c.SaveUploadedFile(file, dst)` | 保存文件 |
| `c.MultipartForm()` | 多文件上传 |
| `r.Static("/url", "./dir")` | 静态文件服务 |
| `r.MaxMultipartMemory` | 最大内存 |

## Cookie

| 方法 | 用途 |
|------|------|
| `c.SetCookie(name, value, maxAge, path, domain, secure, httpOnly)` | 设置 Cookie |
| `c.Cookie(name)` | 读取 Cookie |

## 启动与配置

| 方法/配置 | 用途 |
|----------|------|
| `r.Run(":8080")` | 启动服务 |
| `r.Use(middleware)` | 全局中间件 |
| `gin.SetMode(gin.ReleaseMode)` | 生产模式 |
| `gin.SetMode(gin.TestMode)` | 测试模式 |
| `r.SetTrustedProxies(ips)` | 信任代理 |
| `r.LoadHTMLGlob("templates/*")` | 加载模板 |
