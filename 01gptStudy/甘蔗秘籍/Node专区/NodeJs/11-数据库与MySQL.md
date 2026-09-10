# 11 数据库与 MySQL

## 1. 为什么不用长期保存的内存数组

进程重启后内存会丢失，多进程也不会共享同一数组。MySQL 可以持久化、查询、索引和约束数据。

常见概念：表、行、列、主键、外键、索引、事务。主键唯一标识一行；索引让查询更快，但会占空间并增加写入成本。

## 2. 表设计的最小原则

- 为每张业务表选择稳定主键。
- 字符串、日期、数字选择合适类型。
- 金额使用 `DECIMAL`，不要用浮点数直接保存钱。
- 必填字段用 `NOT NULL`，唯一业务字段可用 `UNIQUE`。
- 关联关系用外键或在应用层明确约束。

## 3. 参数化 SQL

使用 `mysql2/promise` 连接池：

```js
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 5000
})

const [rows] = await pool.execute(
  'SELECT id, title FROM notes WHERE owner_id = ? ORDER BY id DESC LIMIT ?',
  [ownerId, limit]
)
```

`?` 占位符和参数数组能避免把用户输入拼进 SQL。表名、列名不能用普通占位符；需要动态排序时使用白名单映射。

## 4. 连接池与事务

池大小不是越大越好，应结合数据库最大连接数和实例数量。事务要保证“要么全部成功，要么全部回滚”：

```js
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  await connection.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromId])
  await connection.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId])
  await connection.commit()
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

事务范围要短，避免持有连接太久。查询失败、超时和死锁要记录并按业务决定是否重试。

## 5. ORM、迁移和分页

Knex、Prisma 等工具可以生成查询和迁移。生产部署应使用可审计、可回滚策略（例如 Prisma 的 `migrate deploy`），不要让应用启动时随意改表。小数据可用 `LIMIT/OFFSET`；数据很大时优先使用基于稳定排序键的游标分页。

## 动手题与检查

建立 `notes` 表，写“新增、按 ID 查询、列表、删除”四个函数。测试非法 ID、超长标题、重复请求和数据库断开。确认：

- [ ] 所有值都参数化。
- [ ] 连接最终会释放。
- [ ] 迁移文件进入版本控制。
- [ ] 日志不包含数据库密码。
