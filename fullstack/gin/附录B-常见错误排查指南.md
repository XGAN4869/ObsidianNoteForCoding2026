# 附录B：Gin 常见错误排查指南

## 路由错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 路由不匹配（404） | 路径拼错或方法不对 | 检查路径和方法，用 `r.Routes()` 查看 |
| 路由冲突 panic | 同名参数路由冲突 | 用静态路由 or 合并路径 |
| 静态文件路由冲突 | `/static` 同时是路由和静态文件 | 改路径前缀 |

## 参数绑定错误

| 错误 | 原因 | 解决 |
|------|------|------|
| ShouldBindJSON 失败 | Content-Type 不是 JSON | 确认 `Content-Type: application/json` |
| ShouldBindQuery 取不到值 | 标签写了 `json` 而不是 `form` | 查询参数用 `form` 标签 |
| ShouldBind 取不到 JSON 值 | 结构体没写 `json` 标签 | 同时写 `json` 和 `form` |
| 结构体字段为空 | 字段首字母小写（未导出） | 首字母大写 |

## 验证错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 验证信息是英文 | 默认英文 validator | 注册中文翻译器 |
| int 类型 required 不生效 | 0 是零值，validator 认为没传 | 用指针 `*int` 或 `gte=0` |
| 验证标签没反应 | 标签写错了（空格、逗号） | 检查标签格式 |

## 响应错误

| 错误 | 原因 | 解决 |
|------|------|------|
| Headers were already written | 多次写响应 | Abort 后 return 或检查逻辑 |
| JSON 字段名大写 | 没写 `json` 标签 | 字段加 `json:"field_name"` |
| JSON 包含密码 | `json:"password"` | 改为 `json:"-"` |

## CORS 错误

| 错误 | 原因 | 解决 |
|------|------|------|
| CORS header 缺失 | 没加 CORS 中间件 | 加 CORS 中间件 |
| CORS 还是报错 | 中间件顺序：CORS 在 Auth 前面 | CORS 放最外层 |
| Credentials + * 冲突 | Allow-Origin 不能是* | 指定具体 Origin |
| OPTIONS 请求 401 | Auth 中间件拦截了预检请求 | CORS 在 Auth 之前 |

## 中间件错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 中间件不生效 | 注册顺序错了 | 中间件在路由前注册 |
| c.Next() 后代码仍执行 | 这是正常的（洋葱模型后置） | 需要的话用 return |
| c.Abort() 后还在执行 | Abort 只是标记，不自动 return | Abort 后必须手动 return |
| c.Set/Get 取不到值 | key 冲突被覆盖 | 用有命名空间的 key |

## 文件上传错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 文件保存失败 | uploads 目录不存在 | `os.MkdirAll("./uploads", 0755)` |
| 文件太大 | 超过 MaxMultipartMemory | 调大限制或用分片上传 |
| 多文件上传读不到 | 字段名不对 | 检查 FormFile 的字段名 |

## 生产部署错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 客户端 IP 全是 127.0.0.1 | 在 Nginx 后面 | `r.SetTrustedProxies()` + Nginx 设 X-Forwarded-For |
| Ctrl+C 请求被中断 | 没优雅关闭 | 用 srv.Shutdown |
| 连接数爆了 | 没设超时 | 设 ReadTimeout/WriteTimeout/IdleTimeout |
