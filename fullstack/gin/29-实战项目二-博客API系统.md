# 第29章：实战项目二 —— 博客 API 系统

## 本章目标
使用 Gin + GORM 构建一个功能完整的博客后端 API

### 数据模型
```go
type Article struct {
	gorm.Model
	Title     string    `gorm:"not null" json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	Status    string    `gorm:"default:draft" json:"status"` // draft/published
	ViewCount int       `gorm:"default:0" json:"view_count"`
	UserID    uint      `json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Tags      []Tag     `gorm:"many2many:article_tags" json:"tags,omitempty"`
	Comments  []Comment `gorm:"foreignKey:ArticleID" json:"comments,omitempty"`
}

type Comment struct {
	gorm.Model
	Content   string  `gorm:"type:text;not null" json:"content"`
	ArticleID uint    `json:"article_id"`
	UserID    uint    `json:"user_id"`
	User      User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type Tag struct {
	gorm.Model
	Name     string    `gorm:"uniqueIndex;not null" json:"name"`
	Articles []Article `gorm:"many2many:article_tags" json:"-"`
}
```

### 核心接口

```go
// 发布文章（事务：创建文章+关联标签）
func PublishArticle(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
		TagIDs  []uint `json:"tag_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	article := Article{
		Title:   req.Title,
		Content: req.Content,
		Status:  "published",
		UserID:  c.GetUint("user_id"),
	}

	db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&article).Error; err != nil {
			return err
		}
		if len(req.TagIDs) > 0 {
			var tags []Tag
			tx.Find(&tags, req.TagIDs)
			tx.Model(&article).Association("Tags").Append(&tags)
		}
		return nil
	})

	response.Created(c, article)
}

// 文章列表（Preload 解决 N+1）
func ListArticles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var articles []Article
	var total int64

	query := db.Model(&Article{}).Where("status = ?", "published")
	if tagID := c.Query("tag_id"); tagID != "" {
		query = query.Joins("JOIN article_tags ON articles.id = article_tags.article_id").
			Where("article_tags.tag_id = ?", tagID)
	}

	query.Count(&total)
	query.Preload("User").Preload("Tags").
		Order("created_at desc").Scopes(Paginate(page, pageSize)).Find(&articles)

	response.Success(c, gin.H{"articles": articles, "total": total})
}

// 文章详情（阅读量+1）
func GetArticle(c *gin.Context) {
	var article Article
	err := db.Preload("User").Preload("Tags").
		Preload("Comments.User").First(&article, c.Param("id")).Error
	if err != nil {
		response.NotFound(c, "文章不存在")
		return
	}
	db.Model(&article).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	response.Success(c, article)
}
```

### API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/articles` | 文章列表（分页+标签筛选） |
| GET | `/api/v1/articles/:id` | 文章详情 |
| POST | `/api/v1/articles` | 发布文章 |
| PUT | `/api/v1/articles/:id` | 编辑文章 |
| DELETE | `/api/v1/articles/:id` | 删除文章 |
| POST | `/api/v1/articles/:id/comments` | 发表评论 |
| GET | `/api/v1/tags` | 标签列表 |

### 练习题

1. 实现完整的博客 API（文章、评论、标签）。
2. 添加"热门文章"接口（按阅读量排序 TOP 10）。
3. 添加文章搜索功能（关键词搜索标题和内容）。
4. 生成 Swagger 文档。
