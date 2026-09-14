# 数据库、SQL 与事务

## 1. 学习目标

能够使用 database/sql 安全访问 MySQL 或 PostgreSQL，理解连接池、事务、分页和索引。

## 2. 数据库连接

~~~go
db, err := sql.Open("mysql", dsn)
if err != nil {
	return err
}
db.SetMaxOpenConns(20)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(time.Hour)

if err := db.PingContext(ctx); err != nil {
	return err
}
~~~

sql.Open 不一定立即建立连接，PingContext 才能在启动时验证连通性。

## 3. 参数绑定

~~~go
row := db.QueryRowContext(ctx,
	"SELECT id, title FROM posts WHERE id = ?",
	postID,
)
~~~

永远不要用字符串拼接用户输入构造 SQL。参数绑定防止 SQL 注入。

## 4. CRUD

~~~go
result, err := db.ExecContext(ctx,
	"INSERT INTO posts (title, content) VALUES (?, ?)",
	title, content,
)
id, err := result.LastInsertId()
~~~

查询多行时必须关闭 rows：

~~~go
rows, err := db.QueryContext(ctx, "SELECT id, title FROM posts")
if err != nil { return err }
defer rows.Close()

for rows.Next() {
	var id int64
	var title string
	if err := rows.Scan(&id, &title); err != nil {
		return err
	}
}
if err := rows.Err(); err != nil {
	return err
}
~~~

## 5. 事务

文章发布可能同时更新文章状态和审计记录：

~~~go
tx, err := db.BeginTx(ctx, nil)
if err != nil {
	return err
}
defer tx.Rollback()

if _, err := tx.ExecContext(ctx, updateSQL, postID); err != nil {
	return err
}
if _, err := tx.ExecContext(ctx, auditSQL, postID); err != nil {
	return err
}
return tx.Commit()
~~~

defer Rollback 在 Commit 后会返回 sql.ErrTxDone，可安全忽略。

## 6. 分页与索引

~~~sql
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC, id DESC
LIMIT ? OFFSET ?;
~~~

限制 pageSize 最大值。深分页时使用基于游标的分页。为常用过滤和排序建立组合索引，并使用 EXPLAIN 验证查询计划。

## 7. Repository 设计

Repository 负责 SQL 和数据库映射，不负责 HTTP 状态和业务权限：

~~~go
type PostRepository interface {
	FindPublished(ctx context.Context, page, pageSize int) ([]Post, int64, error)
	FindByID(ctx context.Context, id int64) (*Post, error)
}
~~~

Service 负责“只有作者能修改”或“只有已审核评论可展示”等规则。

## 8. 迁移与兼容

数据库结构变更通过有序迁移文件管理。先增加兼容字段，再发布代码，最后清理旧字段，避免滚动发布期间新旧代码不兼容。

## 9. 常见问题与练习

常见问题：忘记 rows.Close、忽略 rows.Err、事务中途 return 未回滚、连接池参数照抄、把数据库错误直接暴露。

练习：

1. 为文章列表编写分页查询。
2. 写一个事务，同时创建文章和标签关联。
3. 设计 users 与 posts 的索引。
4. 使用 sqlmock 为 Repository 编写一条查询测试。

## 10. 小结与下一章

数据库代码的关键是参数安全、资源关闭、事务边界和可验证的索引设计。

- 上一篇：[12-HTTP与网络编程](./12-HTTP与网络编程.md)
- 下一篇：[14-测试调试与工程规范](./14-测试调试与工程规范.md)

