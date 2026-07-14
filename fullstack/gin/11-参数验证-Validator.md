# 第11章：参数验证 —— Validator

## 本章目标
学完本章后，你将能够：
1. 使用 Gin 内置的 validator 标签验证参数
2. 使用基础验证（required/min/max/len）
3. 使用高级验证（email/url/跨字段）
4. 自定义验证器
5. 将验证错误信息翻译为中文

## 前置知识
- 需要先学习：第10章（参数绑定）

---

## 11.1 验证标签速览

Gin 使用 `go-playground/validator` 作为验证引擎，通过 `binding` 标签定义规则：

```go
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Email    string `json:"email"    binding:"required,email"`
	Age      int    `json:"age"      binding:"gte=0,lte=150"`
	Website  string `json:"website"  binding:"omitempty,url"`
}
```

---

## 11.2 常用验证标签

### 基础验证

| 标签 | 含义 | 示例 |
|------|------|------|
| `required` | 必填（非零值） | `binding:"required"` |
| `min=n` | 最小值/最小长度 | `binding:"min=3"` |
| `max=n` | 最大值/最大长度 | `binding:"max=100"` |
| `len=n` | 精确长度 | `binding:"len=11"` |
| `eq=n` | 等于 | `binding:"eq=1"` |
| `ne=n` | 不等于 | `binding:"ne=0"` |
| `oneof` | 枚举值 | `binding:"oneof=active inactive"` |

### 字符串验证

| 标签 | 含义 | 示例 |
|------|------|------|
| `email` | 邮箱格式 | `binding:"email"` |
| `url` | URL 格式 | `binding:"url"` |
| `alpha` | 只含字母 | `binding:"alpha"` |
| `alphanum` | 字母+数字 | `binding:"alphanum"` |
| `contains` | 包含子串 | `binding:"contains=admin"` |
| `startswith` | 前缀 | `binding:"startswith=+"` |
| `endswith` | 后缀 | `binding:"endswith=.com"` |

### 数字验证

| 标签 | 含义 |
|------|------|
| `gt=n` | 大于 |
| `gte=n` | 大于等于 |
| `lt=n` | 小于 |
| `lte=n` | 小于等于 |

### 跨字段验证

| 标签 | 含义 | 示例 |
|------|------|------|
| `eqfield=Field` | 等于另一个字段 | `binding:"eqfield=Password"` |
| `nefield=Field` | 不等于另一个字段 | `binding:"nefield=OldPassword"` |
| `gtfield=Field` | 大于另一个字段 | `binding:"gtfield=MinAge"` |

### 其他

| 标签 | 含义 |
|------|------|
| `omitempty` | 空值时不验证 |
| `-` | 跳过验证 |
| `dive` | 深入验证切片/数组元素 |

---

## 11.3 完整验证示例

```go
type RegisterRequest struct {
	Username        string `json:"username"        binding:"required,min=3,max=50,alphanum"`
	Password        string `json:"password"        binding:"required,min=6,max=32"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	Email           string `json:"email"           binding:"required,email"`
	Age             int    `json:"age"             binding:"gte=18,lte=120"`
	Gender          string `json:"gender"          binding:"oneof=male female other"`
	ReferralCode    string `json:"referral_code"   binding:"omitempty,len=8"`
}

r.POST("/register", func(c *gin.Context) {
	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		// 验证失败
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    422,
			"message": "参数验证失败",
			"detail":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "注册成功",
		"username": req.Username,
	})
})
```

---

## 11.4 自定义验证器

```go
import "github.com/go-playground/validator/v10"

// 自定义验证：检查是否是合法的手机号
func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	// 简单示例：11位数字
	if len(phone) != 11 {
		return false
	}
	for _, c := range phone {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func main() {
	r := gin.Default()

	// 注册自定义验证器
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("phone", validatePhone)
	}

	r.POST("/register", func(c *gin.Context) {
		var req struct {
			Phone string `json:"phone" binding:"required,phone"`
		}
		// ...
	})
}
```

---

## 11.5 中文错误信息翻译

```go
import (
	"reflect"
	"strings"
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	zhTranslations "github.com/go-playground/validator/v10/translations/zh"
)

var trans ut.Translator

func init() {
	zh := zh.New()
	uni := ut.New(zh, zh)
	trans, _ = uni.GetTranslator("zh")
}

func translateError(err error) string {
	errs, ok := err.(validator.ValidationErrors)
	if !ok {
		return err.Error()
	}

	var msgs []string
	for _, e := range errs {
		msgs = append(msgs, e.Translate(trans))
	}
	return strings.Join(msgs, "; ")
}
```

---

## 常见错误

### 错误1：int 类型的 required 陷阱

```go
type Req struct {
	Age int `json:"age" binding:"required"`
}
// req.Age = 0 时，required 认为"你没传"！
// 因为 int 的零值是 0，validator 认为零值是"空"
// 解决：用指针 *int，或 gte=0
```

### 错误2：验证标签写法错误

```go
// ❌ 标签间不要有空格
`binding:"required, min=3"`  // 空格导致 min 标签被忽略！

// ✅ 逗号后紧跟标签
`binding:"required,min=3"`
```

### 错误3：验证顺序与标签顺序无关

validator 按固定顺序验证，不是按标签书写顺序。如果想验证"非空 + 然后邮箱格式"，用 `required,email` 即可。

---

## 本章小结

- `binding:"required,min=3,email"` 多个规则用逗号分隔
- `eqfield` 用于确认密码、`oneof` 用于枚举
- 自定义验证器通过 `RegisterValidation` 注册
- int 类型的 required 有零值陷阱，推荐用指针
- 始终检查 `ShouldBindJSON` 的 error

## 练习题

1. 定义一个注册请求结构体，包含用户名、密码、确认密码、邮箱，添加完整的验证规则。
2. 实现手机号（11位数字）的自定义验证器。
3. 写一个 `/register` 接口，验证失败时返回统一格式的错误响应。
4. （思考题）为什么 validator 认为 `int` 的零值 `0` 是"未设置"？这种设计是功能还是缺陷？
