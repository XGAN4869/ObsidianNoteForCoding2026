# 文件、JSON 与配置处理

## 1. 学习目标

能够安全读写文件，完成 JSON 编解码，设计可区分环境的配置，并避免把密钥提交到仓库。

## 2. 文件读写

~~~go
data, err := os.ReadFile("config.json")
if err != nil {
	return err
}
~~~

写文件：

~~~go
if err := os.WriteFile("output.txt", []byte("hello"), 0o644); err != nil {
	return err
}
~~~

大文件应使用 bufio.Reader/Writer 或流式处理，不要一次性加载进内存。

## 3. 目录与路径

使用 filepath.Join 拼接路径，避免手工写斜杠。外部传入的路径需要防止路径穿越，不要直接把用户输入拼接到服务器文件系统路径。

## 4. JSON 编解码

~~~go
type PostDTO struct {
	ID    int64  // JSON 名称：id
	Title string // JSON 名称：title
	Tags  []string
}

raw, err := json.Marshal(PostDTO{ID: 1, Title: "Go"})
if err != nil {
	return err
}

var dto PostDTO
if err := json.Unmarshal(raw, &dto); err != nil {
	return err
}
~~~

实际项目中使用 JSON tag 保持稳定字段名；内部密码哈希等字段不要出现在响应 DTO 中。

## 5. 流式 JSON

HTTP 请求体使用 json.Decoder，响应使用 json.Encoder：

~~~go
decoder := json.NewDecoder(r.Body)
decoder.DisallowUnknownFields()
if err := decoder.Decode(&request); err != nil {
	return err
}
~~~

DisallowUnknownFields 能尽早发现客户端字段拼写错误，但对版本兼容有影响，需要结合 API 策略使用。

## 6. 配置结构

~~~go
type Config struct {
	App struct {
		Env  string
		Addr string
	}
	Database struct {
		DSN          string
		MaxOpenConns int
	}
	Redis struct {
		Addr string
	}
	JWTSecret string
}
~~~

配置来源建议分层：默认值 → 配置文件 → 环境变量 → 启动参数。密钥只从环境变量或密钥管理服务读取。

## 7. 配置校验

~~~go
func (c Config) Validate() error {
	if c.Database.DSN == "" {
		return errors.New("数据库 DSN 不能为空")
	}
	if len(c.JWTSecret) < 32 {
		return errors.New("JWT 密钥长度不足")
	}
	return nil
}
~~~

配置错误应让程序快速失败，并指出缺少哪一项。

## 8. 博客项目中的 Markdown

博客文章正文可以存为数据库 TEXT，也可以把 Markdown 文件存储在对象存储。初版建议数据库保存正文，备份简单；文章附件另行保存 URL，不把大文件塞入数据库记录。

## 9. 常见问题与练习

常见问题：忽略 ReadFile 错误、用相对路径依赖启动目录、把密码写入配置文件、JSON 字段名不稳定、对不可信 JSON 直接反序列化成任意对象。

练习：

1. 设计开发、测试、生产三套配置示例。
2. 为 PostDTO 增加可选字段并验证输出。
3. 编写配置 Validate 测试。
4. 实现一个安全的 JSON HTTP 请求解析函数。

## 10. 小结与下一章

文件 API 管理资源，JSON tag 管理数据契约，配置校验保证服务启动时就暴露问题。

- 上一篇：[10-并发同步与Context](./10-并发同步与Context.md)
- 下一篇：[12-HTTP与网络编程](./12-HTTP与网络编程.md)

