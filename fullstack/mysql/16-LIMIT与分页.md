# 第16章：LIMIT 与分页

## 本章目标
学完本章后，你将能够：
1. 掌握 LIMIT 的各种语法及其底层行为
2. 实现正确高效的分页查询
3. 理解深层分页的性能问题及其成因
4. 掌握游标分页（keyset pagination）和延迟关联等优化技术
5. 在 UPDATE 和 DELETE 中正确使用 LIMIT

## 前置知识
- 第12章：查询基础 SELECT
- 第14章：ORDER BY 排序
- 第10章：更新数据 UPDATE
- 第11章：删除数据 DELETE

---

## 16.1 LIMIT 基本语法

LIMIT 用于限制查询返回的行数。MySQL 支持三种写法：

```sql
-- 写法1（MySQL 传统）：LIMIT [offset,] count
SELECT * FROM table_name LIMIT 5;        -- 返回前 5 行
SELECT * FROM table_name LIMIT 10, 5;    -- 跳过前 10 行，返回接下来 5 行

-- 写法2（SQL 标准，MySQL 8.0+）：LIMIT count OFFSET offset
SELECT * FROM table_name LIMIT 5 OFFSET 10;  -- 跳过 10 行，返回 5 行

-- 写法3（PostgreSQL 兼容）：仅 LIMIT
SELECT * FROM table_name FETCH FIRST 5 ROWS ONLY;  -- MySQL 8.0+ 支持
```

### 准备测试数据

```sql
CREATE TABLE articles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(50),
    views INT DEFAULT 0,
    category VARCHAR(30),
    published_at DATETIME NOT NULL,
    INDEX idx_published (published_at),
    INDEX idx_category (category)
);

-- 生成约 50 行测试数据（模拟博客文章）
INSERT INTO articles (title, author, views, category, published_at) VALUES
('MySQL 入门教程', '张三', 1500, '数据库', '2026-01-05 10:00:00'),
('Go 语言并发编程', '李四', 3200, '编程语言', '2026-01-10 14:30:00'),
('Redis 缓存实战', '王五', 2800, '数据库', '2026-01-15 09:00:00'),
('Docker 容器化部署', '赵六', 1800, '运维', '2026-02-01 11:00:00'),
('Kubernetes 入门', '孙七', 4500, '运维', '2026-02-10 16:00:00'),
('Python 数据分析', '周八', 2100, '编程语言', '2026-02-20 08:30:00'),
('设计模式详解', '吴九', 980, '编程语言', '2026-03-01 10:00:00'),
('微服务架构设计', '郑十', 3600, '架构', '2026-03-10 14:00:00'),
('Linux 命令速查', '钱一', 5600, '运维', '2026-03-15 09:00:00'),
('HTTP 协议详解', '陈二', 1200, '网络', '2026-04-01 11:00:00');

-- 为了让数据更多一些，我们再插入一些变体
INSERT INTO articles (title, author, views, category, published_at)
SELECT
    CONCAT(title, ' (续', seq, ')'),
    author,
    views + seq * 100,
    category,
    DATE_ADD(published_at, INTERVAL seq DAY)
FROM articles, (SELECT 1 AS seq UNION SELECT 2 UNION SELECT 3) AS numbers
WHERE id <= 10;

SELECT COUNT(*) FROM articles;  -- 应返回 40 行
```

### 基本用法

```sql
-- 返回前 5 行
SELECT id, title, views FROM articles LIMIT 5;

-- 跳过前 10 行，返回接下来 5 行（第 11-15 行）
SELECT id, title, views FROM articles LIMIT 10, 5;

-- MySQL 8.0+ 推荐写法
SELECT id, title, views FROM articles LIMIT 5 OFFSET 10;
```

---

## 16.2 LIMIT 与 ORDER BY

没有 ORDER BY 的 LIMIT 返回的行是**不确定的**——每次查询可能返回不同的结果：

```sql
-- ❌ 不推荐：没有 ORDER BY，返回顺序不确定
SELECT * FROM articles LIMIT 10;

-- ✅ 推荐：先排序，再 LIMIT
SELECT * FROM articles ORDER BY id LIMIT 10;
SELECT * FROM articles ORDER BY published_at DESC LIMIT 10;
```

> **铁律**：LIMIT 必须配合 ORDER BY 使用，否则结果是不可预测的。

---

## 16.3 分页查询

分页是 LIMIT 最常见的应用场景：

```sql
-- 分页公式：
-- 第 N 页，每页 pageSize 条：
-- OFFSET = (N - 1) * pageSize
-- LIMIT pageSize OFFSET (N-1)*pageSize

-- 每页 10 条
-- 第 1 页：offset = 0
SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 0;
-- 等价于
SELECT * FROM articles ORDER BY id LIMIT 10;

-- 第 2 页：offset = 10
SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 10;

-- 第 3 页：offset = 20
SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 20;

-- 第 N 页（通用公式）
-- SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET (N-1)*10;
```

### 获取总行数以计算总页数

```sql
-- 先查询总行数
SELECT COUNT(*) AS total FROM articles;

-- 假设 total = 40，pageSize = 10
-- 总页数 = CEIL(40 / 10) = 4 页

-- 在应用程序中：
-- total_pages = CEIL(total / pageSize)
-- 第 1 页: LIMIT 0, 10
-- 第 2 页: LIMIT 10, 10
-- 第 3 页: LIMIT 20, 10
-- 第 4 页: LIMIT 30, 10
```

### COUNT(*) 的性能考虑

```sql
-- 在大表上，COUNT(*) 可能很慢（尤其在 InnoDB 中）
-- 优化策略：

-- 1. 如果只需要知道"是否有下一页"，查询 pageSize+1 行
SELECT * FROM articles
ORDER BY id
LIMIT 11;  -- 查 11 行，如果有第 11 行说明有下一页

-- 2. 使用近似值（如 EXPLAIN 的 rows 估算）
EXPLAIN SELECT COUNT(*) FROM articles;
-- Extra 中的 rows 是估算值，不精确但快

-- 3. 缓存总数（定期更新）
-- 4. 使用 Redis 计数器
```

---

## 16.4 深层分页性能问题

这是分页查询中最关键的优化知识。浅分页（前几页）通常很快，但深层分页（如第 10000 页）会极慢。

### 问题演示

```sql
-- 浅分页（快）：只扫描 10 行
EXPLAIN SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 0;
-- rows ≈ 10（优化器估算）

-- 深层分页（非常慢）：需要扫描 100010 行
EXPLAIN SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100000;
-- rows ≈ 100010（先扫描 100010 行，再丢弃前 100000 行！）
```

### 为什么会慢？

```
LIMIT 100000, 10 的执行过程：

1. MySQL 从存储引擎读取数据行（按 ORDER BY 的顺序）
2. 第 1 行 → 这是第 1 行，但 offset=100000，跳过
3. 第 2 行 → 跳过
4. ...
5. 第 100000 行 → 跳过
6. 第 100001 行 → 需要的！保留
7. ...
8. 第 100010 行 → 保留
9. 返回这 10 行

总扫描行数：100010 行
实际返回行数：10 行
效率：99.99% 的工作被浪费！
```

### 用大表验证

```sql
-- 创建一个更大的测试表（如果数据不够大）
CREATE TABLE big_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用存储过程插入 10 万行（仅供参考，在测试环境执行）
-- DELIMITER $$
-- CREATE PROCEDURE generate_data()
-- BEGIN
--     DECLARE i INT DEFAULT 1;
--     WHILE i <= 100000 DO
--         INSERT INTO big_test (data) VALUES (CONCAT('data_', i));
--         SET i = i + 1;
--     END WHILE;
-- END$$
-- DELIMITER ;
-- CALL generate_data();

-- 对比执行时间
-- SELECT * FROM big_test ORDER BY id LIMIT 10 OFFSET 0;      -- ~0.01 秒
-- SELECT * FROM big_test ORDER BY id LIMIT 10 OFFSET 10000;  -- ~0.05 秒
-- SELECT * FROM big_test ORDER BY id LIMIT 10 OFFSET 50000;  -- ~0.2 秒
-- SELECT * FROM big_test ORDER BY id LIMIT 10 OFFSET 99990;  -- ~0.5 秒
```

---

## 16.5 深层分页优化方案

### 方案一：游标分页（Keyset Pagination）—— 最推荐

游标分页不使用 OFFSET，而是记住上一页最后一行的排序键值：

```sql
-- 传统分页（第 101 页，每页 10 条）
-- SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 1000;  -- 慢！

-- 游标分页：记住上一页最后一行的 id
-- 第 1 页
SELECT * FROM articles WHERE id > 0 ORDER BY id LIMIT 10;
-- 假设最后一行的 id 是 10

-- 第 2 页：用上一页最后一个 id 作为游标
SELECT * FROM articles WHERE id > 10 ORDER BY id LIMIT 10;
-- 假设最后一行的 id 是 20

-- 第 3 页
SELECT * FROM articles WHERE id > 20 ORDER BY id LIMIT 10;
-- 每页只扫描恰好 10 行，性能恒定！

-- 游标分页的 EXPLAIN
EXPLAIN SELECT * FROM articles WHERE id > 10000 ORDER BY id LIMIT 10;
-- rows ≈ 10（只扫描需要的行数）
-- 无论哪一页，扫描行数都是 pageSize
```

### 游标分页的条件

```sql
-- 游标分页要求：
-- 1. 排序列有索引（最好是主键或唯一索引）
-- 2. 排序列的值是唯一的（否则可能漏行或重复）

-- 如果排序列可能不唯一（比如按 views 排序）：
-- 使用复合排序（排序列 + 主键）
SELECT * FROM articles
WHERE (views, id) > (1000, 50)  -- 上一页最后一行的 (views, id)
ORDER BY views, id
LIMIT 10;
```

### 方案二：延迟关联（Deferred Join）

先只查主键（利用覆盖索引），再用主键关联查完整数据：

```sql
-- 传统深层分页（慢，回表查所有列）
-- SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100000;

-- 延迟关联（快，先在索引中定位，再回表查完整行）
SELECT a.*
FROM articles a
JOIN (
    SELECT id FROM articles
    ORDER BY id
    LIMIT 10 OFFSET 100000
) AS tmp ON a.id = tmp.id;

-- 为什么快？
-- 子查询只查 id（主键），在索引中完成（覆盖索引扫描）
-- 扫描 100010 个 id 值比扫描 100010 个完整行快得多
-- 最后 JOIN 回主表只取 10 个完整行
```

### 方案三：使用 BETWEEN 范围（适合连续主键）

```sql
-- 如果主键是连续的（没有大量删除导致的间隙）
-- 第 101 页，每页 10 条 → id 范围是 1001 到 1010
SELECT * FROM articles
WHERE id BETWEEN 1001 AND 1010
ORDER BY id;

-- 前置知识：每页 10 条，id 从 1 开始
-- 第 N 页的 id 范围：[(N-1)*10 + 1, N*10]
-- 但注意：如果有删除导致 id 不连续，这个范围可能不足 10 行
```

### 优化方案对比

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **游标分页** | 大部分应用，尤其是移动端"加载更多" | 性能恒定，O(1) 复杂度 | 无法跳页，需要维护游标 |
| **延迟关联** | 需要传统分页（跳页） | 大幅减少回表开销 | 仍然扫描所有 offset 行（只是扫描的是索引） |
| **范围查询** | 连续主键/时间戳 | 最快 | 主键不连续时结果数不准确 |
| **限制总页数** | 用户可以接受只显示前 N 页 | 从根本上限制扫描量 | 用户看不到后面的数据 |

### 方案四：应用层优化（交互设计）

很多时候，深层分页问题可以通过改变交互设计来规避：

```sql
-- 无限滚动（Infinite Scroll）：用户滚动到底部时自动加载下一页
-- 这正是游标分页的最佳应用场景

-- "加载更多" 按钮：类似于无限滚动，每次加载固定数量的条目

-- 限制可见页码：Google 搜索只显示前 10 页左右
-- "搜索 + 过滤" 替代翻页：让用户用更精确的条件缩小结果集
```

---

## 16.6 LIMIT 在 UPDATE 和 DELETE 中的使用

### UPDATE ... LIMIT

```sql
-- 只更新最先匹配的 5 行
UPDATE articles
SET views = views + 100
WHERE category = '数据库'
ORDER BY published_at ASC
LIMIT 5;

-- 分批更新大表（避免锁持有时间过长）
UPDATE articles
SET category = '已归档'
WHERE published_at < '2025-01-01'
LIMIT 1000;
-- 执行多次，每次处理 1000 行
```

### DELETE ... LIMIT

```sql
-- 删除最早的 3 篇文章
DELETE FROM articles
ORDER BY published_at ASC
LIMIT 3;

-- 分批删除大表数据
DELETE FROM logs
WHERE created_at < '2025-01-01'
LIMIT 10000;
-- 每次删 10000 行，重复执行直到受影响行数为 0
```

### UPDATE/DELETE 的 LIMIT 注意事项

```sql
-- MySQL 的 UPDATE/DELETE 的 LIMIT 不支持 OFFSET
-- ❌ 不支持：
-- UPDATE articles SET views=0 ORDER BY id LIMIT 5 OFFSET 10;
-- DELETE FROM articles ORDER BY id LIMIT 5 OFFSET 10;

-- ✅ 如果需要跳行，使用子查询：
DELETE FROM articles
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM articles ORDER BY id LIMIT 5 OFFSET 10
    ) AS tmp
);
```

---

## 16.7 LIMIT 的执行计划分析

```sql
-- 使用 EXPLAIN 分析 LIMIT 查询
EXPLAIN SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100;

-- 关键字段：
-- rows：优化器估算的需要检查的行数
-- Extra：
--   "Using index"：使用覆盖索引，不需要回表
--   "Using filesort"：需要额外排序（说明 ORDER BY 没用到索引）
--   "Using where"：使用了 WHERE 过滤

-- 分析深分页
EXPLAIN SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 90000;
-- rows 列的值应该接近 90010，说明需要扫描大量行
```

### 使用 EXPLAIN FORMAT=JSON 获取详细信息

```sql
-- JSON 格式的 EXPLAIN 通常包含更多信息
EXPLAIN FORMAT=JSON
SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100;
-- 关注 "rows_examined_per_scan" 和 "rows_produced_per_join"
```

---

## 常见错误

### 1. LIMIT 不带 ORDER BY

```sql
-- ❌ 返回的 10 行可能每次都不一样！
-- SELECT * FROM articles LIMIT 10;

-- ✅ 始终配合 ORDER BY
SELECT * FROM articles ORDER BY id LIMIT 10;
```

### 2. OFFSET 位置写错

```sql
-- ❌ MySQL 传统写法：LIMIT offset, count
-- 新手容易混淆：LIMIT 100, 10 → 跳过 100 行，返回 10 行（不是"第 100 条到第 110 条"）

-- MySQL 8.0+ 推荐用 LIMIT count OFFSET offset（语义更清晰）
SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100;
-- 跳过 100 行，返回 10 行
```

### 3. 用 COUNT(*) 每次都查一遍

```sql
-- ❌ 每次分页请求都执行 COUNT(*)，在大表上非常浪费
-- SELECT COUNT(*) FROM articles;  -- 每次分页都执行

-- ✅ 优化：缓存总数、使用估算值、采用游标分页免去 COUNT(*)
```

### 4. 在分页查询中使用大 OFFSET

```sql
-- ❌ 深层分页性能灾难
-- SELECT * FROM articles ORDER BY id LIMIT 10 OFFSET 100000;

-- ✅ 改用游标分页
SELECT * FROM articles WHERE id > 100000 ORDER BY id LIMIT 10;
```

### 5. 在子查询中用 LIMIT 但不加 ORDER BY

```sql
-- ❌ 子查询中的 LIMIT 没有 ORDER BY，结果不确定
-- SELECT * FROM t WHERE id IN (SELECT id FROM orders LIMIT 10);

-- ✅ 子查询中 LIMIT 也需要 ORDER BY
SELECT * FROM t WHERE id IN (
    SELECT id FROM orders ORDER BY created_at DESC LIMIT 10
);
```

---

## 本章练习

1. **基本分页练习**：对 `articles` 表实现分页查询，每页 10 条，分别查询第 1 页、第 2 页和第 4 页的数据（按 id 排序）。

2. **深层分页性能对比**：创建一个 10 万行的测试表（可用存储过程或复制现有数据）。分别测试 `LIMIT 10 OFFSET 0`、`LIMIT 10 OFFSET 10000`、`LIMIT 10 OFFSET 90000` 的执行时间，记录性能差异。使用 EXPLAIN 观察 rows 估算值的变化。

3. **游标分页实现**：对 `articles` 表实现游标分页。假设前端传过来上一页最后一行的 id，实现"下一页"查询。对比游标分页与传统 OFFSET 分页的 EXPLAIN 输出。

4. **延迟关联练习**：对 10 万行的测试表，分别用传统 `LIMIT offset, count` 和延迟关联（子查询只查 id + JOIN）查询深层数据（OFFSET 50000）。使用 EXPLAIN 比较两者的扫描行数。

5. **UPDATE/DELETE LIMIT 练习**：
   - 使用 UPDATE ... LIMIT 将最早的 3 篇文章的 views 改为 0
   - 模拟分批删除场景：每次删除 10 行（含 ORDER BY），共删除 5 批
   - 验证总的删除行数

6. **游标分页 + 排序练习**：如果按 views（可能不唯一）排序分页，使用 `(views, id)` 复合游标实现稳定的分页查询。
