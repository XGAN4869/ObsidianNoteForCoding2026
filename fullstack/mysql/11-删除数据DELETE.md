# 第11章：删除数据 DELETE

## 本章目标
学完本章后，你将能够：
1. 掌握 DELETE 的基本用法与安全注意事项
2. 理解 DELETE 与 TRUNCATE 的深层区别及适用场景
3. 编写多表关联的 DELETE 语句
4. 实现"软删除"（逻辑删除）模式，并理解其优缺点
5. 理解 DELETE 与事务回滚的关系

## 前置知识
- 第9章：插入数据 INSERT（理解表结构和数据）
- 第10章：更新数据 UPDATE（WHERE 和 LIMIT 的用法类似）
- 第13章：WHERE 条件过滤
- 事务基础概念（ACID、ROLLBACK）

---

## 11.1 DELETE 基本语法

```sql
DELETE FROM 表名
[WHERE 条件]
[ORDER BY ...]
[LIMIT 行数];
```

### 前提：准备测试数据

```sql
-- 创建测试表
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    class VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入 10 条测试数据
INSERT INTO students (name, score, class) VALUES
('张三', 85, '一班'),
('李四', 92, '一班'),
('王五', 67, '一班'),
('赵六', 73, '二班'),
('孙七', 88, '二班'),
('周八', 45, '二班'),
('吴九', 95, '三班'),
('郑十', 58, '三班'),
('钱一', 76, '三班'),
('陈二', 61, '三班');

SELECT * FROM students ORDER BY id;
-- 查看初始数据
```

### 基本删除

```sql
-- 删除指定条件的行
DELETE FROM students WHERE score < 60;

-- 验证：周八(45分)和郑十(58分)被删除
SELECT * FROM students;
```

---

## 11.2 没有 WHERE 的 DELETE —— 全表删除

与 UPDATE 一样，忘记写 WHERE 的 DELETE 将删除表中的**所有行**：

```sql
-- ⚠️ 极度危险！删除所有行！
-- DELETE FROM students;

-- MySQL 命令行输出：
-- Query OK, 10 rows affected (0.01 sec)
-- 10 行全部被删除！
```

> **铁律**：与 UPDATE 一样，先写 `SELECT * FROM ... WHERE ...` 确认要删除的行，确认无误后，把 `SELECT *` 替换为 `DELETE`。

### DELETE 全表 vs TRUNCATE 全表

即使要清空一张表，DELETE 通常也不是最佳选择。DELETE 全表时：
- 逐行删除，每行都写 undo log
- 触发器会逐行触发
- AUTO_INCREMENT 不会重置
- 大表时非常慢

更高效的清空表方式见 [11.5 节 DELETE vs TRUNCATE](#115-delete-vs-truncate)。

---

## 11.3 DELETE ... LIMIT

使用 LIMIT 限制一次 DELETE 删除的最大行数，适用于分批删除大量数据的场景：

```sql
-- 删除分数最低的 2 个学生
DELETE FROM students
ORDER BY score ASC
LIMIT 2;

-- 按条件 + LIMIT
DELETE FROM students
WHERE class = '一班'
ORDER BY score ASC
LIMIT 2;
```

### 分批删除大表数据

```sql
-- 场景：需要删除一年的旧日志（1000 万行）
-- 如果一次性 DELETE，可能：
--   1. 锁持有时间过长
--   2. undo log 溢出
--   3. 主从复制严重延迟

-- ✅ 正确做法：分批删除
-- 伪代码，在脚本中循环执行
-- WHILE (SELECT COUNT(*) FROM logs WHERE created_at < '2025-01-01') > 0:
--     DELETE FROM logs WHERE created_at < '2025-01-01' LIMIT 10000;
--     COMMIT;
--     SLEEP(0.5);  -- 给复制留出时间

-- 实际在 MySQL 中手动分批：
DELETE FROM logs WHERE created_at < '2025-01-01' LIMIT 10000;
-- 每执行一次删 10000 行，反复执行直到返回 0 rows affected
```

### LIMIT 在 DELETE 中的限制

```sql
-- MySQL 的 DELETE ... LIMIT 不支持 OFFSET（不能跳行）
-- ❌ 不支持：
-- DELETE FROM students ORDER BY id LIMIT 10 OFFSET 20;  -- 语法错误

-- ✅ 变通方案（使用子查询）：
DELETE FROM students
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM students ORDER BY id LIMIT 10 OFFSET 20
    ) AS tmp
);
```

---

## 11.4 多表 DELETE（JOIN DELETE）

MySQL 支持在 DELETE 中关联多张表，可以基于关联表的数据决定删除哪些行，也可以一次删除多张表中的数据：

```sql
-- 准备关联表
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

INSERT INTO enrollments (student_id, course) VALUES
(1, '数学'), (1, '英语'),
(2, '数学'),
(3, '语文'), (3, '英语');
```

### 删除一张表中符合关联条件的行

```sql
-- 删除 enrollments 表中，课程为"数学"但学生分数低于 60 分的记录
DELETE e
FROM enrollments e
JOIN students s ON e.student_id = s.id
WHERE s.score < 60 AND e.course = '数学';

-- 语法解析：
-- DELETE e：指定只删除 enrollments 表中的行
-- FROM enrollments e：被删除的表
-- JOIN students s：关联的参考表
-- WHERE：关联条件 + 删除条件
```

```sql
-- 等价写法（省略表别名列表）
DELETE FROM enrollments
USING enrollments
JOIN students ON enrollments.student_id = students.id
WHERE students.score < 60 AND enrollments.course = '数学';
```

### 同时删除多张表中的行

```sql
-- 删除学生及其选课记录（级联删除）
DELETE s, e
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id
WHERE s.score < 60;

-- DELETE s, e：同时删除 students 和 enrollments 中匹配的行
-- 结果：分数低于 60 的学生被删除，同时他们对应的选课记录也被删除
```

```sql
-- 只删除选课记录，不删除学生
DELETE e
FROM students s
JOIN enrollments e ON s.id = e.student_id
WHERE s.score < 60;

-- DELETE e：只删除 enrollments 表中的行
-- 结果：分数低于 60 的学生的选课记录被删除，但学生本身保留
```

### 多表 DELETE 注意事项

1. 不关心关联性质的用 JOIN（INNER JOIN），关心保留行的用 LEFT JOIN
2. LEFT JOIN DELETE：如果没有匹配的右表行，左表中的行是否被删除取决于 WHERE 条件
3. 多表 DELETE 前务必先用 SELECT 验证关联行的范围

---

## 11.5 DELETE vs TRUNCATE

这是 MySQL 面试中最常被问到的问题之一。DELETE 和 TRUNCATE 都能清空表中的数据，但实现机制有天壤之别：

| 特性 | DELETE | TRUNCATE |
|------|--------|----------|
| **SQL 分类** | DML（数据操作语言） | DDL（数据定义语言） |
| **删除方式** | 逐行删除 | 删除并重建表（或逐页删除） |
| **事务回滚** | 可以 ROLLBACK（回滚） | InnoDB 中可以 ROLLBACK（原子 DDL），MyISAM 不行 |
| **触发触发器** | 逐行触发 DELETE 触发器 | **不触发**触发器 |
| **WHERE 条件** | 支持 WHERE 过滤 | **不支持**WHERE |
| **AUTO_INCREMENT** | **不重置**自增值 | **重置**自增值为 1 |
| **速度（大表）** | 慢（逐行删除 + undo log） | 极快（直接释放数据页） |
| **删除行数反馈** | 返回实际删除的行数 | 返回 0（"0 rows affected"） |
| **锁的粒度** | 行级锁（逐行加锁） | 表级锁（或元数据锁） |
| **binlog 记录** | 每行记录到 binlog | 只记录 TRUNCATE 语句（ROW 模式下） |
| **外键约束** | 受外键约束限制 | 有外键引用的表不能 TRUNCATE |
| **WHERE 中使用** | 可以 | 不可以 |

### 深入对比演示

```sql
-- 准备测试环境
CREATE TABLE test_delete (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(100)
);

CREATE TABLE test_truncate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(100)
);

-- 插入同样的数据
INSERT INTO test_delete (data) VALUES ('a'), ('b'), ('c'), ('d'), ('e');
INSERT INTO test_truncate (data) VALUES ('a'), ('b'), ('c'), ('d'), ('e');

-- == 对比1：AUTO_INCREMENT 行为 ==
DELETE FROM test_delete;
INSERT INTO test_delete (data) VALUES ('after_delete');
SELECT * FROM test_delete;
-- id=6（AUTO_INCREMENT 没有重置，延续之前的序列）

TRUNCATE TABLE test_truncate;
INSERT INTO test_truncate (data) VALUES ('after_truncate');
SELECT * FROM test_truncate;
-- id=1（AUTO_INCREMENT 重置为 1）
```

```sql
-- == 对比2：事务回滚 ==
START TRANSACTION;
DELETE FROM test_delete;      -- 清空表
SELECT COUNT(*) FROM test_delete;  -- 0
ROLLBACK;
SELECT COUNT(*) FROM test_delete;  -- 5（数据恢复，DELETE 可以回滚）

START TRANSACTION;
TRUNCATE TABLE test_truncate;  -- 清空表
SELECT COUNT(*) FROM test_truncate;  -- 0
ROLLBACK;
SELECT COUNT(*) FROM test_truncate;  -- 0（InnoDB 中也可能回滚，取决于版本）
-- 注意：MySQL 5.6+ 的 InnoDB 中 TRUNCATE 是原子操作，可以回滚
-- 但 MyISAM 和早期版本中不能回滚
```

```sql
-- == 对比3：外键限制 ==
CREATE TABLE parent (
    id INT PRIMARY KEY
);
CREATE TABLE child (
    id INT PRIMARY KEY,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);

INSERT INTO parent VALUES (1);
INSERT INTO child VALUES (1, 1);

-- TRUNCATE 被外键引用的表 → 报错
-- TRUNCATE TABLE parent;
-- ERROR 1701 (42000): Cannot truncate a table referenced in a foreign key constraint

-- DELETE 可以（前提是没有违反外键约束的数据，或有 ON DELETE CASCADE）
DELETE FROM child;   -- 先删子表
DELETE FROM parent;  -- 再删父表，OK
```

### 选择指南

```
需要删除所有行 + 重置自增 + 性能优先：用 TRUNCATE
需要删除部分行（有 WHERE）：        用 DELETE
需要触发器介入：                   用 DELETE
需要知道删了多少行：               用 DELETE
有外键关联：                       用 DELETE（或先删外键约束）
需要回滚（确认后可能后悔）：        用 DELETE
表很大要清空：                    用 TRUNCATE（秒级完成）
```

---

## 11.6 软删除（逻辑删除）

"软删除"不是真正的删除，而是通过一个标记列来表示数据"已删除"：

### 基本实现

```sql
-- 方式1：is_deleted 布尔标记
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,  -- 0=正常, 1=已删除
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_deleted (is_deleted)
);

-- "删除"操作：实际是 UPDATE
UPDATE articles SET is_deleted = 1 WHERE id = 5;

-- 查询时过滤掉已删除的
SELECT * FROM articles WHERE is_deleted = 0;
```

```sql
-- 方式2：deleted_at 时间戳标记
CREATE TABLE articles_v2 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    deleted_at TIMESTAMP NULL DEFAULT NULL,  -- NULL=未删除, 有值=删除时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_deleted_at (deleted_at)
);

-- "删除"操作
UPDATE articles_v2 SET deleted_at = NOW() WHERE id = 5;

-- 查询时过滤
SELECT * FROM articles_v2 WHERE deleted_at IS NULL;

-- 可以知道"什么时候删的"
SELECT * FROM articles_v2 WHERE deleted_at > '2026-01-01';
```

### 软删除的优点

1. **数据可恢复**：误删后只需 `UPDATE SET is_deleted = 0` 即可恢复
2. **保留历史信息**：关联数据不丢失，可以追溯完整历史
3. **审计需求**：满足法规和合规要求（数据不能物理删除）
4. **引用完整性**：外键关联的数据不会被破坏

### 软删除的缺点

1. **查询永远要加 WHERE**：每个查询都必须加 `WHERE is_deleted = 0`，稍有遗漏就会查出"已删除"数据
2. **唯一约束矛盾**：已删除行的唯一值（如 email）会阻止新行使用相同的值
3. **表数据持续膨胀**：不真正释放空间，表越来越大
4. **索引效率下降**：删除的数据也占用索引空间
5. **JOIN 查询复杂化**：每个关联表都要额外处理 is_deleted 条件

### 唯一约束问题的解决

```sql
-- 问题：email 列有 UNIQUE 约束
CREATE TABLE users_soft (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    is_deleted TINYINT(1) DEFAULT 0,
    UNIQUE KEY uk_email (email)  -- 问题：已删除用户仍占用 email
);

-- 插入正常用户
INSERT INTO users_soft (email, name) VALUES ('user@test.com', '原用户');

-- "删除"该用户
UPDATE users_soft SET is_deleted = 1 WHERE email = 'user@test.com';

-- 新用户想用同一 email → 冲突！
-- INSERT INTO users_soft (email, name) VALUES ('user@test.com', '新用户');
-- ERROR 1062: Duplicate entry 'user@test.com' for key 'uk_email'

-- 解决方案1：联合唯一索引（is_deleted + email）
-- 但需要 is_deleted = 0 时唯一，is_deleted = 1 时允许重复 — 做不到

-- 解决方案2：将唯一约束改为 (email, is_deleted)
CREATE TABLE users_soft_v2 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    is_deleted TINYINT(1) DEFAULT 0,
    UNIQUE KEY uk_email_deleted (email, is_deleted)
    -- 但这样同一个 email 可以有 is_deleted=0 和 is_deleted=1 各一条
);

-- 解决方案3：删除时将 email 改为 NULL（如果允许 NULL）
-- NULL 不参与 UNIQUE 约束比较
UPDATE users_soft SET email = NULL, is_deleted = 1 WHERE id = 5;

-- 解决方案4：删除时将原始值拼上后缀
UPDATE users_soft SET email = CONCAT(email, '_deleted_', id), is_deleted = 1 WHERE id = 5;
```

### 软删除 vs 硬删除：决策因素

```
| 场景                         | 推荐方案  |
|-----------------------------|-----------|
| 用户个人数据、订单、交易记录  | 软删除    |
| 重要配置数据（有审计要求）    | 软删除    |
| 日志、临时缓存、统计分析数据  | 硬删除    |
| 有外键级联关系的核心业务数据  | 软删除    |
| 需要定期清理的海量数据        | 硬删除    |
| GDPR/隐私合规要求用户可删除   | 硬删除    |
```

---

## 11.7 恢复被 DELETE 的数据

### 通过事务回滚恢复

```sql
-- 在执行 DELETE 之前开启事务，是恢复数据最简单的方式
START TRANSACTION;
DELETE FROM students WHERE id = 3;
-- 如果发现删错了
ROLLBACK;
-- 数据恢复！
```

### 通过 binlog 恢复

```sql
-- 如果 DELETE 已经 COMMIT 了，可以通过 binlog 恢复
-- 需要 MySQL 开启了 binlog（log_bin = ON）

-- 1. 首先查看当前 binlog 文件名
SHOW MASTER STATUS;

-- 2. 查看 binlog 中的事件（找到误删的时间点）
SHOW BINLOG EVENTS IN 'binlog.000001';

-- 3. 用 mysqlbinlog 工具导出恢复到某个时间点之前的记录
-- （在操作系统命令行执行，不是在 MySQL 中）
-- mysqlbinlog --stop-datetime="2026-07-09 10:30:00" binlog.000001 | mysql -u root -p
-- 恢复到 10:30:00 之前的所有操作
```

---

## 常见错误

### 1. 忘记 WHERE，全表被删

```sql
-- ❌ 灾难
-- DELETE FROM users;  -- 所有用户没了！

-- ✅ 预防
-- 1. 先 SELECT 再 DELETE
-- 2. 开启 sql_safe_updates = 1
-- 3. 重要操作前 START TRANSACTION
```

### 2. 对有关联外键的表直接 TRUNCATE

```sql
-- ❌ 报错
-- TRUNCATE TABLE orders;
-- ERROR 1701: Cannot truncate a table referenced in a foreign key constraint

-- ✅ 先处理外键约束
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders);  -- 先删子表
DELETE FROM orders;                                                  -- 再删主表
-- 或者
SET foreign_key_checks = 0;
TRUNCATE TABLE orders;
SET foreign_key_checks = 1;
-- 但这可能破坏引用完整性，慎用！
```

### 3. 误以为 TRUNCATE 会触发触发器

```sql
-- TRUNCATE 不会触发 DELETE 触发器
-- 如果表上有触发器（如记录删除日志），TRUNCATE 不会激活它们
-- 必须使用 DELETE 才能触发
```

### 4. DELETE ... LIMIT 不能带 OFFSET

```sql
-- ❌ MySQL 的 DELETE ... LIMIT 不支持 OFFSET
-- DELETE FROM students WHERE class='一班' ORDER BY id LIMIT 3 OFFSET 2;

-- ✅ 使用子查询变通
DELETE FROM students
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM students WHERE class='一班' ORDER BY id LIMIT 3 OFFSET 2
    ) AS tmp
);
```

---

## 本章练习

1. **基本删除练习**：在 `students` 表中插入 20 条测试数据。分别练习：
   - 删除分数低于 60 的学生
   - 删除"一班"的所有学生
   - 删除分数在 70 到 80 之间的学生
   每次删除前先用 SELECT 确认要删除的行。

2. **DELETE vs TRUNCATE 对比练习**：创建两张相同的表，分别用 DELETE 和 TRUNCATE 清空。观察并记录两者的差异：返回行数、AUTO_INCREMENT 行为、是否可以 ROLLBACK。

3. **分批删除练习**：创建一张有 10000 行数据的表（可用存储过程或程序生成）。使用 DELETE ... LIMIT 1000 分批删除全部数据，记录每次执行后的剩余行数。

4. **多表 DELETE 练习**：创建 `orders`（订单）和 `order_items`（订单明细）两张表，建立外键关系。编写 DELETE 语句删除"金额小于 100 元的订单及其所有明细行"。

5. **软删除实现练习**：创建一张 `messages` 表（包含 id, sender, content, is_deleted, created_at）。实现消息的软删除功能，并编写以下查询：
   - 查询所有未删除的消息
   - 查询最近 7 天被删除的消息
   - 恢复一条已删除的消息

6. **事务回滚恢复练习**：在事务中执行 DELETE 操作，然后使用 ROLLBACK 恢复数据。尝试 COMMIT 操作后，思考还有哪些手段可以恢复数据。
