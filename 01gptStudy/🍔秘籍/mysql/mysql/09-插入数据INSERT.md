# 第9章：插入数据 INSERT

## 本章目标
学完本章后，你将能够：
1. 掌握 INSERT INTO ... VALUES 的基本用法和多行插入
2. 理解 AUTO_INCREMENT 的工作原理与 LAST_INSERT_ID() 的使用
3. 使用 INSERT ... SELECT 从其他表复制数据
4. 理解 INSERT IGNORE、REPLACE INTO 和 ON DUPLICATE KEY UPDATE 的区别与适用场景
5. 掌握批量插入的性能优化技巧

## 前置知识
- 第8章：建表与数据类型（理解表结构和列定义）
- 基本数据类型（INT、VARCHAR、DATE 等）
- 主键与唯一约束的概念

---

## 9.1 INSERT 基本语法

INSERT 语句用于向表中插入一行或多行数据。最基本的语法如下：

```sql
-- 创建示例表
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age TINYINT UNSIGNED,
    gender ENUM('男', '女'),
    email VARCHAR(100) UNIQUE,
    enrolled_date DATE DEFAULT (CURRENT_DATE)
);

-- 插入一行数据：指定列名
INSERT INTO students (name, age, gender, email)
VALUES ('张三', 20, '男', 'zhangsan@example.com');

-- 查看插入结果
SELECT * FROM students;
```

运行结果：
```
+----+--------+------+--------+-----------------------+---------------+
| id | name   | age  | gender | email                 | enrolled_date |
+----+--------+------+--------+-----------------------+---------------+
|  1 | 张三   |   20 | 男     | zhangsan@example.com  | 2026-07-09    |
+----+--------+------+--------+-----------------------+---------------+
```

### 列的顺序可以任意调换

INSERT 中列的排列顺序不需要和建表时的顺序一致，只要 VALUES 中的值顺序与指定的列顺序一致即可：

```sql
-- 列的顺序可以自由安排
INSERT INTO students (email, name, age, gender)
VALUES ('lisi@example.com', '李四', 22, '男');

-- 效果完全一样，因为 VALUES 中值的顺序与列列表中的顺序一一对应
```

### 省略列列表（不推荐）

如果省略列列表，必须为表的**所有列**按建表时的列顺序提供值：

```sql
-- 省略列列表：必须按建表顺序为每一列提供值
INSERT INTO students
VALUES (3, '王五', 25, '男', 'wangwu@example.com', '2026-07-01');

-- 这很脆弱：如果表结构变了（比如加了列），这条语句就会出错！
-- 生产代码中务必明确写出列名。
```

> **最佳实践**：始终显式列出列名。代码可读性高，不受表结构变化影响。

---

## 9.2 多行插入（批量插入）

MySQL 支持在一条 INSERT 语句中插入多行数据，这比多次执行单行 INSERT 快得多：

```sql
-- 一次插入多行：VALUES 后用逗号分隔多个元组
INSERT INTO students (name, age, gender, email)
VALUES
    ('赵六', 19, '男', 'zhaoliu@example.com'),
    ('孙七', 21, '女', 'sunqi@example.com'),
    ('周八', 23, '男', 'zhouba@example.com'),
    ('吴九', 20, '女', 'wujiu@example.com');

-- 上面一条语句的效果等价于下面的四条语句，但速度快很多
```

### 为什么多行插入更快？

每次 INSERT 都需要：
- 客户端与服务器之间的网络往返
- 事务开销和日志写入
- 索引的维护

将多行合并为一条语句，所有这些开销只发生一次：

```sql
-- ❌ 慢：四次网络往返 + 四次事务开销
INSERT INTO t VALUES (1);
INSERT INTO t VALUES (2);
INSERT INTO t VALUES (3);
INSERT INTO t VALUES (4);

-- ✅ 快：一次网络往返 + 一次事务开销
INSERT INTO t VALUES (1), (2), (3), (4);
```

但注意：VALUES 子句不能无限长。`max_allowed_packet` 参数限制了单条 SQL 语句的最大长度（默认 4MB，最大可设为 1GB）。

```sql
-- 查看当前设置
SHOW VARIABLES LIKE 'max_allowed_packet';

-- 查看单次 INSERT 建议的最大行数（实际取决于每行的数据大小）
-- 一般建议一次 INSERT 不超过 1000 行，根据实际情况调整
```

### 批量插入实战建议

```sql
-- 假设要插入 10000 行数据，建议分批
-- 每批 500~1000 行是比较合理的

-- 伪代码（应用程序层面）
-- rows = 10000 条数据
-- batch_size = 500
-- for i in 0..19:
--     batch_rows = rows[i*500 : (i+1)*500]
--     INSERT INTO t VALUES (batch_rows)
```

---

## 9.3 INSERT ... SET（MySQL 特有语法）

MySQL 提供了另一种插入语法，使用 SET 子句：

```sql
-- MySQL 特有的 INSERT ... SET 语法
INSERT INTO students
SET name = '郑十',
    age = 24,
    gender = '男',
    email = 'zhengshi@example.com';

-- 等价于：
-- INSERT INTO students (name, age, gender, email)
-- VALUES ('郑十', 24, '男', 'zhengshi@example.com');
```

INSERT ... SET 的优点：
- 列和值在同一行，对应关系一目了然，不易写错位置
- 适合列数较多但只需要指定部分列的插入

INSERT ... SET 的限制：
- 一次只能插入**一行**，不支持多行批量插入
- 这是 MySQL 特有的语法，不具有 SQL 标准可移植性

---

## 9.4 插入默认值

### 使用 DEFAULT 关键字

```sql
-- 插入时对某些列使用 DEFAULT 关键字
INSERT INTO students (name, age, gender, email, enrolled_date)
VALUES ('钱十一', 22, '女', 'qian11@example.com', DEFAULT);

-- enrolled_date 有默认值 CURRENT_DATE，使用 DEFAULT 即使用该默认值
```

### 使用 VALUES() 插入全默认行

```sql
-- 插入全默认值行（要求所有列要么有默认值，要么是 AUTO_INCREMENT 或可为 NULL）
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 所有列都使用默认值
INSERT INTO logs VALUES ();
INSERT INTO logs (action) VALUES ('login');

SELECT * FROM logs;
-- +----+---------+---------------------+
-- | id | action  | created_at          |
-- +----+---------+---------------------+
-- |  1 | unknown | 2026-07-09 10:00:00 |
-- |  2 | login   | 2026-07-09 10:00:01 |
-- +----+---------+---------------------+
```

---

## 9.5 INSERT ... SELECT：从其他表复制数据

INSERT ... SELECT 可以将查询结果直接插入到目标表中，非常实用：

```sql
-- 先创建一张结构相同的空表
CREATE TABLE students_archive (
    id INT PRIMARY KEY,  -- 注意：这里特意不用 AUTO_INCREMENT，保留原始 id
    name VARCHAR(50) NOT NULL,
    age TINYINT UNSIGNED,
    gender ENUM('男', '女'),
    email VARCHAR(100),
    enrolled_date DATE
);

-- 将 students 表中年龄大于 21 的学生复制到归档表
INSERT INTO students_archive (id, name, age, gender, email, enrolled_date)
SELECT id, name, age, gender, email, enrolled_date
FROM students
WHERE age > 21;

-- 验证结果
SELECT * FROM students_archive;
```

### INSERT ... SELECT 的注意事项

1. **列数量和类型必须匹配**：SELECT 的列数、位置、数据类型必须与 INSERT 指定的列兼容
2. **不要求列名相同**：MySQL 按位置对应，不按列名对应
3. **可以包含表达式**：SELECT 中可以包含函数、计算表达式

```sql
-- 插入时可以转换数据
INSERT INTO students_archive (id, name, age, gender, email, enrolled_date)
SELECT
    id,
    UPPER(name) AS name,          -- 名字转大写
    age,
    gender,
    email,
    enrolled_date
FROM students
WHERE age > 21 AND gender = '男';
```

### 同一张表的数据复制

```sql
-- 如果需要在一张表中复制某些行（必须确保不违反唯一约束）
INSERT INTO students (name, age, gender, email)
SELECT CONCAT(name, '(副本)'), age, gender, NULL
FROM students
WHERE id = 1;

-- 注意：上面 email 设为 NULL 是为了不违反 UNIQUE 约束
```

---

## 9.6 INSERT IGNORE：跳过冲突行

普通的 INSERT 在遇到错误（如主键或唯一键冲突）时，整个语句失败，已插入的行会回滚：

```sql
-- 这条语句会因为 email 重复而失败（假设 'zhangsan@example.com' 已存在）
-- INSERT INTO students (name, age, gender, email)
-- VALUES ('张三', 20, '男', 'zhangsan@example.com');
-- ERROR 1062 (23000): Duplicate entry 'zhangsan@example.com' for key 'email'
```

使用 INSERT IGNORE 后，冲突的行会被**跳过**（并产生一个警告），不冲突的行照常插入：

```sql
-- INSERT IGNORE：遇到重复键时跳过该行，继续处理后续行
INSERT IGNORE INTO students (name, age, gender, email)
VALUES
    ('新同学A', 20, '男', 'newA@example.com'),      -- 这行可正常插入
    ('张三', 20, '男', 'zhangsan@example.com'),      -- email 冲突，跳过
    ('新同学B', 21, '女', 'newB@example.com');       -- 这行可正常插入

-- 结果：插入了 2 行（而不是 3 行），冲突行被跳过
-- 用 SHOW WARNINGS 查看跳过的原因
SHOW WARNINGS;
```

INSERT IGNORE 会忽略的错误类型：
- 主键 / 唯一键冲突（ER_DUP_ENTRY）
- NOT NULL 列被赋了 NULL 值
- 数据类型转换失败（值被截断为"最接近"的有效值）
- 分区表中某行没有匹配的分区

> **谨慎使用**：INSERT IGNORE 不仅忽略键冲突，还忽略了**所有可忽略的错误**，包括数据类型转换问题。它会把不合法的值静默转换成合法值（或截断），可能导致数据丢失。

---

## 9.7 REPLACE INTO：先删后插

REPLACE INTO 的语义是：如果新行与现有行的主键或唯一键冲突，则**先删除旧行，再插入新行**：

```sql
-- REPLACE INTO 示例
REPLACE INTO students (id, name, age, gender, email)
VALUES (1, '张三改', 21, '男', 'zhangsan_new@example.com');

-- 上面的操作等价于：
-- 1. 检查 id=1 是否已存在？存在 -> DELETE FROM students WHERE id=1;
-- 2. INSERT INTO students VALUES (1, '张三改', 21, '男', 'zhangsan_new@example.com');

-- 重要：id=1 的行被完全删除了，所以 AUTO_INCREMENT 的 id 不会沿用原来的
-- 如果 id 是 AUTO_INCREMENT 且你没指定，它会生成一个新值
```

### REPLACE INTO 的危险之处

```sql
-- 假设有外键约束或触发器，REPLACE 会触发 ON DELETE 级联操作！
CREATE TABLE orders (
    id INT PRIMARY KEY,
    amount DECIMAL(10,2)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO orders VALUES (1, 100.00);
INSERT INTO order_items (order_id, product) VALUES (1, '商品A'), (1, '商品B');

-- 使用 REPLACE 更新订单
REPLACE INTO orders VALUES (1, 200.00);

-- ⚠️ 灾难！order_items 中 order_id=1 的所有行都被 ON DELETE CASCADE 删除了！
-- 因为 REPLACE 实际上是先 DELETE 再 INSERT！
SELECT * FROM order_items;  -- 空表！
```

> **结论**：有外键约束或有触发器时，永远不要用 REPLACE INTO。使用 INSERT ... ON DUPLICATE KEY UPDATE 代替。

---

## 9.8 INSERT ... ON DUPLICATE KEY UPDATE（Upsert）

这是 MySQL 提供的"有则更新、无则插入"（upsert）语法。遇到唯一键冲突时执行 UPDATE，否则执行 INSERT：

```sql
-- 假设 zhangsan_new@example.com 已存在
INSERT INTO students (name, age, gender, email)
VALUES ('张三再改', 22, '男', 'zhangsan_new@example.com')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),   -- VALUES(name) 引用 INSERT 中试图插入的 name 值
    age = VALUES(age),
    gender = VALUES(gender);

-- 效果：email 冲突的行被更新，其余不变
-- VALUES() 函数获取的是 INSERT 部分的对应列的值

-- 查看影响行数：
-- 如果返回 1：执行了 INSERT
-- 如果返回 2：执行了 UPDATE（检测到冲突，更新了行）
-- 如果返回 0：执行了 UPDATE 但没有实际改变数据
```

### 使用表达式更新

```sql
-- 除了直接用 VALUES()，还可以用表达式
INSERT INTO students (name, age, gender, email, enrolled_date)
VALUES ('张三再改', 22, '男', 'zhangsan_new@example.com', '2026-01-01')
ON DUPLICATE KEY UPDATE
    age = age + 1,                      -- 在原有 age 上加 1
    email = VALUES(email),              -- 使用新值
    enrolled_date = VALUES(enrolled_date);

-- 也可以引用表中已有的列值进行计算
INSERT INTO page_visits (page_url, visit_count)
VALUES ('/home', 1)
ON DUPLICATE KEY UPDATE
    visit_count = visit_count + 1;      -- 递增计数器
```

### ON DUPLICATE KEY UPDATE 只检查 UNIQUE 约束

```sql
-- 只有主键和唯一索引才会触发 ON DUPLICATE KEY UPDATE
-- 普通索引不会触发

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(20) UNIQUE,   -- 唯一索引：冲突时触发 UPDATE
    name VARCHAR(100),        -- 普通列：冲突时不会触发
    INDEX idx_name (name)     -- 普通索引：冲突时也不会触发
);

INSERT INTO products (sku, name)
VALUES ('SKU001', '产品A')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);

-- 如果 sku='SKU001' 已存在 -> 触发 UPDATE
-- 如果 name='产品A' 已存在 -> 不会触发（name 上只有普通索引）
```

### MySQL 8.0.20+ 的新语法

```sql
-- MySQL 8.0.20 开始，VALUES() 被标记为弃用
-- 推荐使用别名引用要插入的值
INSERT INTO students (name, age, gender, email)
VALUES ('新名字', 25, '男', 'newemail@example.com') AS new_row
ON DUPLICATE KEY UPDATE
    name = new_row.name,
    age = new_row.age;
```

---

## 9.9 AUTO_INCREMENT 深入理解

### 什么是 AUTO_INCREMENT

AUTO_INCREMENT 属性为数值列自动生成递增的唯一值，通常用于主键：

```sql
CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) AUTO_INCREMENT = 1000;  -- 从 1000 开始递增

INSERT INTO posts (title, content) VALUES ('第一篇', '文章内容');
INSERT INTO posts (title, content) VALUES ('第二篇', '文章内容');

SELECT id, title FROM posts;
-- +------+-----------+
-- | id   | title     |
-- +------+-----------+
-- | 1000 | 第一篇    |
-- | 1001 | 第二篇    |
-- +------+-----------+
```

### LAST_INSERT_ID()：获取自增值

```sql
-- 插入后获取刚生成的 AUTO_INCREMENT 值
INSERT INTO students (name, age, gender, email)
VALUES ('新学生', 19, '女', 'newstudent@example.com');

SELECT LAST_INSERT_ID();
-- 返回最近一次 INSERT 生成的 AUTO_INCREMENT 值
-- 如果一次 INSERT 插入了多行，返回第一行的 AUTO_INCREMENT 值
```

LAST_INSERT_ID() 的特性：

1. **连接级别**：每个连接维护独立的 LAST_INSERT_ID，不会受其他连接影响
2. **线程安全**：在多线程/多连接环境中不会混淆
3. **不受事务回滚影响**：即使 ROLLBACK，LAST_INSERT_ID() 也不回退

```sql
-- 多行插入时，LAST_INSERT_ID() 返回第一行的自增值
INSERT INTO students (name, age, gender, email) VALUES
    ('学生A', 20, '男', 'stuA@test.com'),
    ('学生B', 21, '女', 'stuB@test.com'),
    ('学生C', 22, '男', 'stuC@test.com');

SELECT LAST_INSERT_ID();  -- 返回学生A的 id

-- 后续的行 id 依次递增，分别是 LAST_INSERT_ID()+1, LAST_INSERT_ID()+2, ...
```

### AUTO_INCREMENT 的间隙

AUTO_INCREMENT 的值可能出现间隙（gap）：

```sql
-- 情况1：ROLLBACK 不会回收已分配的 AUTO_INCREMENT 值
START TRANSACTION;
INSERT INTO students (name, email) VALUES ('学生X', 'stuX@test.com');
-- 假设分配了 id=10
ROLLBACK;
-- id=10 被"浪费"了，下一个 INSERT 将从 11 开始

INSERT INTO students (name, email) VALUES ('学生Y', 'stuY@test.com');
SELECT LAST_INSERT_ID();  -- 返回 11（不是 10）
```

```sql
-- 情况2：DELETE 不会重置 AUTO_INCREMENT
DELETE FROM students WHERE id = 100;
INSERT INTO students (name, email) VALUES ('学生Z', 'stuZ@test.com');
-- 新插入的 id 不会复用 100
```

```sql
-- 情况3：REPLACE INTO（先删后插）可能导致 id 跳跃
REPLACE INTO students (id, name, email) VALUES (5, '替换', 'replace@test.com');
-- 如果 id=5 存在，则删除后重新插入，但 id 值由你指定
```

### 重置 AUTO_INCREMENT

```sql
-- 查看当前 AUTO_INCREMENT 值
SELECT AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'students';

-- 方式1：ALTER TABLE 重置
ALTER TABLE students AUTO_INCREMENT = 1;

-- 方式2：TRUNCATE TABLE 完全清空表并重置
-- TRUNCATE TABLE students;  -- 删除所有行，重置 AUTO_INCREMENT

-- 注意：只有当表中最大 id 小于新值时，重置才有意义
-- 如果将 AUTO_INCREMENT 设为小于当前最大 id 的值，它会自动调整到 max(id)+1
```

### 获取最后插入的完整行（安全方式）

```sql
-- 不要只依赖 LAST_INSERT_ID() 然后手动拼凑，使用子查询更安全
INSERT INTO students (name, age, gender, email)
VALUES ('安全检查', 20, '男', 'safe@test.com');

-- 使用 LAST_INSERT_ID() 在第二次查询中获取完整行
SELECT * FROM students WHERE id = LAST_INSERT_ID();
```

---

## 9.10 批量插入性能优化

### 优化要点汇总

```sql
-- == 优化 1：多行合并为一条 INSERT ==
-- ❌ 慢
INSERT INTO t VALUES (1, 'a');
INSERT INTO t VALUES (2, 'b');
INSERT INTO t VALUES (3, 'c');
-- ... 10000 次

-- ✅ 快
INSERT INTO t VALUES
(1, 'a'), (2, 'b'), (3, 'c'),
(4, 'd'), (5, 'e'), (6, 'f');
-- ... 10000 行合并为几条语句
```

```sql
-- == 优化 2：关闭自动提交，手动控制事务 ==
-- ❌ 每条 INSERT 都是一个独立事务
SET autocommit = 0;  -- 或者用
START TRANSACTION;
INSERT INTO t VALUES (1, 'a');
INSERT INTO t VALUES (2, 'b');
INSERT INTO t VALUES (3, 'c');
-- ... 10000 条 INSERT
COMMIT;
```

```sql
-- == 优化 3：大批量导入时临时禁用索引和约束检查 ==
-- 适用于从文件导入海量数据的情况
ALTER TABLE t DISABLE KEYS;         -- 禁用非唯一索引
-- 执行批量 INSERT ...
ALTER TABLE t ENABLE KEYS;          -- 重建索引

-- 禁用唯一检查和外键检查
SET unique_checks = 0;
SET foreign_key_checks = 0;
-- 执行批量 INSERT（此时不检查唯一性和外键）...
SET unique_checks = 1;
SET foreign_key_checks = 1;
```

```sql
-- == 优化 4：使用 LOAD DATA INFILE 替代 INSERT ==
-- 这是 MySQL 最快的导入方式（直接读取文件，比 INSERT 快 20 倍以上）
LOAD DATA INFILE '/path/to/data.csv'
INTO TABLE students
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS                -- 跳过 CSV 标题行
(name, age, gender, email);
```

### 性能对比示例

```sql
-- 创建一个测试表
CREATE TABLE perf_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(200)
);

-- 测试1：逐条插入（慢）
-- 插入 10000 行，每条独立事务：约 5-10 秒

-- 测试2：批量插入 + 事务（快）
START TRANSACTION;
INSERT INTO perf_test (data) VALUES
('row1_data'), ('row2_data'),  ('row3_data'),
('row4_data'), ('row5_data'),  ('row6_data'),
-- ... 合并成几百条多行 INSERT
('row9998_data'), ('row9999_data'), ('row10000_data');
COMMIT;
-- 插入 10000 行：约 0.1-0.5 秒（快 20 倍以上）
```

---

## 常见错误

### 1. 值数量与列数量不匹配

```sql
-- ❌ 错误：指定了 4 列，但只提供了 3 个值
-- INSERT INTO students (name, age, gender, email)
-- VALUES ('姓名', 20, '男');
-- ERROR 1136 (21S01): Column count doesn't match value count at row 1
```

**原因**：VALUES 子句中值的个数必须与列列表中列的数量相等。
**解决**：要么补全缺失的值，要么从列列表中移除不需要赋值的列。

### 2. 违反 NOT NULL 约束

```sql
-- ❌ 错误：name 列是 NOT NULL，但没提供值也没有默认值
-- INSERT INTO students (age, gender) VALUES (20, '男');
-- ERROR 1364 (HY000): Field 'name' doesn't have a default value
```

**解决**：为 NOT NULL 且无默认值的列提供值，或者修改表结构添加默认值。

### 3. 数据类型不匹配导致静默截断

```sql
-- ⚠️ 危险：向 TINYINT 插入超范围值
-- 在非严格模式下，MySQL 会静默地将 999 截断为 127（TINYINT 最大值）
-- 或修改 sql_mode 包含 STRICT_TRANS_TABLES 来强制报错
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';
-- 这样超出范围的值就会报错而不是静默截断
```

### 4. REPLACE INTO 误删数据

```sql
-- ❌ 危险：REPLACE INTO 会删除整行再插入
-- 被删除的行如果有 ON DELETE CASCADE 外键，会级联删除关联数据
-- 永远在有外键关系的表上使用 INSERT ... ON DUPLICATE KEY UPDATE 代替
```

### 5. 忘记 LAST_INSERT_ID() 是连接级别的

```sql
-- 误解：认为 LAST_INSERT_ID() 全局有效
-- 实际：每个连接的 LAST_INSERT_ID() 是独立的
-- 连接A插入一行，连接B查询 LAST_INSERT_ID() 不会得到连接A的结果
-- 这是好事，保证了并发安全，但要理解它的作用域
```

---

## 本章练习

1. **基本插入练习**：创建一张 `books` 表（id, title, author, price, publish_date），使用 INSERT 插入 5 本不同的书。要求 id 使用 AUTO_INCREMENT，publish_date 默认值为当前日期。

2. **批量插入练习**：使用一条 INSERT 语句，一次性向 `books` 表中插入 10 本书的数据。

3. **INSERT ... SELECT 练习**：创建一张 `books_expensive` 表（结构与 books 相同），使用 INSERT ... SELECT 将 books 表中 price > 50 的书复制过去。

4. **Upsert 练习**：使用 INSERT ... ON DUPLICATE KEY UPDATE 实现以下需求：向 `books` 表插入一本书，如果书名（title 列有 UNIQUE 约束）已存在，则更新 price 为插入的新价格。

5. **混淆对比练习**：分别测试 INSERT IGNORE、REPLACE INTO 和 INSERT ... ON DUPLICATE KEY UPDATE 在同一本书（同名）被重复插入时的行为差异，记录每种语法的表现。

6. **LAST_INSERT_ID() 练习**：插入一条数据后立即查询 `SELECT LAST_INSERT_ID()`，验证其返回值。然后插入 5 行数据（一条语句），再次查询 LAST_INSERT_ID()，理解多行插入时的返回值规律。
