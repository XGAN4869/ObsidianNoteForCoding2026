# 第二十三章 EXPLAIN 执行计划

## 本章目标

通过本章学习，你将能够：
1. 理解 EXPLAIN 输出的每一列的含义和作用
2. 掌握访问类型（type）的完整等级体系，能够判断查询效率
3. 深入理解 Extra 列的常见信息，识别性能瓶颈
4. 使用 EXPLAIN FORMAT=JSON 获取更详细的执行计划信息
5. 使用 EXPLAIN ANALYZE 获取实际执行时间（MySQL 8.0.18+）
6. 能够通过 EXPLAIN 定位慢查询的根本原因并给出优化方案
7. 熟练掌握从 EXPLAIN 输出制定索引优化策略的方法

## 前置知识

在学习本章之前，你需要：
- 理解上一章中索引的原理（B+Tree、聚簇索引、二级索引、回表）
- 掌握基本的 SELECT、JOIN、子查询语法
- 了解复合索引和最左前缀原则
- 理解 MySQL 的查询执行基本流程（解析 → 优化 → 执行）
- 知道慢查询日志的基本概念

---

## 23.1 EXPLAIN 基础

### 23.1.1 什么是 EXPLAIN

EXPLAIN 是 MySQL 提供的查询分析工具，用于显示 MySQL 优化器为 SELECT 语句生成的执行计划。通过在 SELECT 语句前添加 EXPLAIN 关键字即可使用。

```sql
-- 基本用法
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- EXPLAIN 输出类似：
-- id | select_type | table | type | possible_keys | key  | key_len | ref   | rows | filtered | Extra
-- 1  | SIMPLE      | users | ref  | idx_email     | idx_email | 302  | const | 1    | 100.00   | NULL

-- EXPLAIN 可用于：SELECT, INSERT, UPDATE, DELETE, REPLACE
EXPLAIN UPDATE orders SET status = 'shipped' WHERE id = 100;
EXPLAIN DELETE FROM logs WHERE created_at < '2024-01-01';
```

### 23.1.2 EXPLAIN 输出的行含义

EXPLAIN 输出的每一行对应查询执行计划中的一个步骤。对于涉及 JOIN 或子查询的语句，可能有多行输出。

```sql
-- JOIN 查询的 EXPLAIN（多行输出）
EXPLAIN
SELECT o.*, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending';

-- 输出可能有两行：
-- 一行代表 orders 表的访问（驱动表）
-- 一行代表 users 表的访问（被驱动表）
-- id 列相同，执行顺序从上到下
```

### 23.1.3 执行顺序判断规则

```sql
-- 规则 1：id 越大，越先执行
-- 规则 2：id 相同时，从上到下顺序执行

-- 示例：子查询（id 不同）
EXPLAIN
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- id=2: 子查询 users（先执行）
-- id=1: 主查询 orders（后执行）
```

---

## 23.2 EXPLAIN 字段详解

### 23.2.1 id 列

```sql
-- id：查询的标识符，表示 SELECT 的序号
-- 同一个 SELECT 中的多个表使用同一个 id
-- 子查询有独立的 id

-- 简单查询：单 id
EXPLAIN SELECT * FROM users;  -- id=1

-- JOIN 查询：多个表，同一个 id
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- id=1, table=u
-- id=1, table=o

-- 子查询：不同 id，id 大的先执行
EXPLAIN SELECT * FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);
-- id=2 (子查询，先执行)
-- id=1 (主查询，后执行)

-- UNION：额外行
EXPLAIN SELECT id FROM users UNION SELECT user_id FROM orders;
-- id=1, table=users (UNION 第一个 SELECT)
-- id=2, table=orders (UNION 第二个 SELECT)
-- id=NULL, table=<union1,2> (UNION 结果去重，临时表)
```

### 23.2.2 select_type 列

select_type 描述了 SELECT 的类型。

```sql
-- SIMPLE（最常见）：简单查询，不包含子查询和 UNION
EXPLAIN SELECT * FROM users WHERE id = 1;  -- SIMPLE

-- PRIMARY：最外层的查询（包含子查询时）
-- SUBQUERY：SELECT 或 WHERE 子句中的子查询（非相关子查询）
EXPLAIN SELECT * FROM orders
WHERE user_id = (SELECT id FROM users WHERE email = 'test@test.com');
-- 主查询: PRIMARY
-- 子查询: SUBQUERY

-- DEPENDENT SUBQUERY：相关子查询（依赖外部查询的值）
EXPLAIN SELECT * FROM orders o
WHERE amount > (SELECT AVG(amount) FROM orders WHERE user_id = o.user_id);
-- 子查询引用了外部 o.user_id → DEPENDENT SUBQUERY
-- 性能通常很差！外层每行都需要执行一次子查询

-- DERIVED：派生表（FROM 子句中的子查询）
EXPLAIN SELECT * FROM (
    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) AS user_stats WHERE cnt > 5;
-- 子查询在 FROM 中 → DERIVED

-- MATERIALIZED（MySQL 8.0+）：子查询结果被物化为临时表
EXPLAIN SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');
-- users 子查询先执行，结果物化，然后 orders 与物化结果 JOIN

-- UNION：UNION 中第二个及之后的 SELECT
-- UNION RESULT：UNION 结果的去重操作（使用临时表）
-- DEPENDENT UNION：UNION 中的相关子查询
-- UNCACHEABLE SUBQUERY：结果不能被缓存的子查询（含用户变量或非确定性函数）
```

### 23.2.3 table 列

```sql
-- table：显示当前步骤访问的表名、别名、或派生表标识

-- 普通表
EXPLAIN SELECT * FROM users;  -- table=users

-- 别名
EXPLAIN SELECT * FROM users u;  -- table=u

-- 派生表
EXPLAIN SELECT * FROM (SELECT * FROM users) AS sub;
-- table=<derived2>  （2 是子查询的 id）

-- UNION 结果
-- table=<union1,2>  （1 和 2 是两个 SELECT 的 id）
```

---

## 23.3 访问类型 type —— 最重要的列

访问类型按性能从优到差排列：

```
system > const > eq_ref > ref > fulltext > ref_or_null > index_merge >
unique_subquery > index_subquery > range > index > ALL
```

### 23.3.1 system

系统表，表中只有一行数据（极少见）。

```sql
-- system 类型极为罕见，出现在访问只有一行的系统表时
EXPLAIN SELECT * FROM mysql.help_topic WHERE help_topic_id = 1;
```

### 23.3.2 const

通过 PRIMARY KEY 或 UNIQUE 索引的等值查询，且结果最多只有一行（常量优化）。

```sql
-- const：主键等值查询
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type=const：MySQL 在查询开始前就已经确定结果只有一行

-- const：唯一索引等值查询
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';
-- type=const：前提是 email 上有 UNIQUE 索引且查询的是完整值
```

### 23.3.3 eq_ref

在 JOIN 查询中，被驱动表使用 PRIMARY KEY 或 UNIQUE NOT NULL 索引进行等值匹配，每行只匹配一行。

```sql
-- eq_ref：JOIN 时被驱动表通过 PRIMARY KEY 关联
EXPLAIN SELECT * FROM orders o
JOIN users u ON o.user_id = u.id;
-- orders(type=ALL 或 range) + users(type=eq_ref)
-- 对 orders 的每一行，在 users 中用 PRIMARY KEY 查找恰好一行

-- eq_ref 是 JOIN 连接中最优的类型
-- 前提：被驱动表的连接键上有 PRIMARY KEY 或 UNIQUE NOT NULL 索引
```

### 23.3.4 ref

使用非唯一索引（或唯一索引的前缀）进行等值匹配，可能返回多行。

```sql
-- ref：普通索引等值查询
CREATE INDEX idx_status ON orders(status);
EXPLAIN SELECT * FROM orders WHERE status = 'pending';
-- type=ref：idx_status 是非唯一索引，可能匹配多行

-- ref：JOIN 中被驱动表使用非唯一索引
EXPLAIN SELECT * FROM orders o
JOIN users u ON o.city = u.city;  -- city 上有普通索引
-- type=ref

-- ref：复合索引的最左前缀匹配
CREATE INDEX idx_name_age ON users(name, age);
EXPLAIN SELECT * FROM users WHERE name = 'Alice';
-- type=ref：使用了复合索引的最左前缀
```

### 23.3.5 range

索引范围扫描。当查询中使用了 `=, <>, >, >=, <, <=, IS NULL, <=>, BETWEEN, IN(), LIKE 'prefix%'` 等范围条件时出现。

```sql
-- range：BETWEEN
EXPLAIN SELECT * FROM orders WHERE id BETWEEN 100 AND 200;  -- type=range

-- range：>=
EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-01-01';  -- type=range

-- range：IN
EXPLAIN SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5);  -- type=range

-- range：LIKE 前缀匹配
EXPLAIN SELECT * FROM users WHERE name LIKE 'Al%';  -- type=range

-- 注意：LIKE '%Al' 或 LIKE '%Al%' 无法使用索引，type=ALL
EXPLAIN SELECT * FROM users WHERE name LIKE '%Al%';  -- type=ALL
```

### 23.3.6 index

全索引扫描。扫描整个索引树（而非扫描数据文件）。通常在需要排序且索引覆盖了查询所有列时出现。

```sql
-- index：全索引扫描
EXPLAIN SELECT name FROM users ORDER BY name;
-- type=index：按 name 索引的顺序扫描整个索引树
-- 比 ALL 好（只读索引不读数据），但仍需扫描整个索引

-- index：覆盖索引中的范围查询
CREATE INDEX idx_status_amount ON orders(status, amount);
EXPLAIN SELECT status, amount FROM orders WHERE amount > 100;
-- 可能 type=index（扫描整个索引）
-- 因为 amount 不是复合索引的最左列，无法用 range，只能用 index

-- 性能对比：
-- type=ALL：扫描全部数据页（最大 I/O）
-- type=index：扫描全部索引页（索引页通常小于数据页）
-- type=range：扫描部分索引页
```

### 23.3.7 ALL —— 全表扫描（最差）

扫描整个表的数据文件，性能最差。大数据量下应尽量避免。

```sql
-- ALL：无索引可用
EXPLAIN SELECT * FROM users WHERE phone = '13800138000';
-- 如果 phone 列上没有索引 → type=ALL

-- ALL：条件在索引列上运算
EXPLAIN SELECT * FROM orders WHERE YEAR(created_at) = 2024;
-- 即使 created_at 有索引，YEAR() 函数使索引失效 → type=ALL

-- ALL：LIKE 后缀模糊匹配
EXPLAIN SELECT * FROM users WHERE name LIKE '%Alice%';  -- type=ALL

-- 优化目标：尽可能将 type 从 ALL 优化为 range 或 ref
```

### 23.3.8 其他类型

```sql
-- index_merge：使用多个索引合并
CREATE INDEX idx_name ON users(name);
CREATE INDEX idx_age ON users(age);
EXPLAIN SELECT * FROM users WHERE name = 'Alice' OR age = 25;
-- type=index_merge：MySQL 分别用两个索引查找，然后合并结果

-- ref_or_null：类似 ref 但额外检查 NULL 值
EXPLAIN SELECT * FROM users WHERE name = 'Alice' OR name IS NULL;
-- type=ref_or_null

-- unique_subquery / index_subquery：IN 子查询的优化
EXPLAIN SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');
-- users: type=index_subquery（子查询使用了索引）
```

---

## 23.4 其他重要字段

### 23.4.1 possible_keys 和 key

```sql
-- possible_keys：MySQL 认为可能使用的索引（候选索引列表）
-- key：MySQL 实际选择使用的索引

EXPLAIN SELECT * FROM users
WHERE name = 'Alice' AND age = 25;
-- possible_keys: idx_name, idx_age, idx_name_age
-- key: idx_name_age  ← 优化器选择了复合索引

-- 如果 key 为 NULL 但有 possible_keys：
-- 说明优化器认为全表扫描比使用索引更快（常见于小表或低选择性条件）

-- 如果 possible_keys 为 NULL：
-- 说明没有任何索引可用于当前查询 → 需要创建索引
```

### 23.4.2 key_len

key_len 表示 MySQL 实际使用的索引键的长度（字节数）。通过 key_len 可以判断复合索引中使用了多少列。

```sql
-- 使用复合索引的 key_len 分析
CREATE INDEX idx_name_age_city ON users(name VARCHAR(100), age INT, city VARCHAR(50));
-- 假设 utf8mb4，name 占 100*4+2 = 402 字节（VARCHAR 额外 2 字节存长度）
-- age INT 占 4 字节（允许 NULL 额外 1 字节 = 5 字节）
-- city VARCHAR(50) 占 50*4+2 = 202 字节

-- 查询 1：只使用 name
EXPLAIN SELECT * FROM users WHERE name = 'Alice';
-- key_len = 402（只用了 name 列）

-- 查询 2：使用 name 和 age
EXPLAIN SELECT * FROM users WHERE name = 'Alice' AND age = 25;
-- key_len = 402 + 5 = 407（用了 name 和 age）

-- 查询 3：使用全部三列
EXPLAIN SELECT * FROM users WHERE name = 'Alice' AND age = 25 AND city = 'NY';
-- key_len = 402 + 5 + 202 = 609（用了全部三列）

-- 实际用途：验证复合索引的哪一部分被实际使用
```

### 23.4.3 ref 列

```sql
-- ref：显示索引的哪一列（或哪个常量）被用于与索引进行比较

-- const：与常量比较
EXPLAIN SELECT * FROM users WHERE name = 'Alice';
-- ref = const

-- 列名：JOIN 中与另一个表的列比较
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- orders 的 ref = mydb.u.id（与 users 表的 id 列比较）

-- func：与函数结果比较
EXPLAIN SELECT * FROM users WHERE name = LOWER('Alice');
-- ref = func
```

### 23.4.4 rows 列

rows 是优化器**估算**的需要扫描的行数（不是结果集的行数）。rows 越小越好，但这是估算值，可能不准确。

```sql
-- 估算的行数
EXPLAIN SELECT * FROM users WHERE name = 'Alice';
-- rows = 5  （估算有 5 行匹配 name='Alice'）

EXPLAIN SELECT * FROM orders WHERE user_id = 100;
-- rows = 50  （估算该用户有 50 个订单）

-- 多表 JOIN 的估算总访问量 = rows 的乘积
-- 假设 orders: rows=1000, users: rows=1
-- 估算总访问 ≈ 1000 * 1 = 1000 行

-- 注意：
-- 1. rows 是估算值，可能与实际行数相差很大
-- 2. rows 受统计信息影响，ANALYZE TABLE 可以更新统计信息
-- 3. 对于 LIMIT 查询，rows 可能不大但实际扫描可能很多
```

### 23.4.5 filtered 列

filtered 表示经过 WHERE 条件过滤后，剩余行的百分比估计值。配合 rows 使用，可以估算最终返回的行数。

```sql
EXPLAIN SELECT * FROM users WHERE name = 'Alice' AND age > 20;
-- rows = 10, filtered = 20.00
-- 预计扫描 10 行，过滤后剩下 2 行（10 * 20%）

-- 低 filtered 值（如 10% 以下）说明 WHERE 条件过滤了大量行
-- 如果有索引未被使用，可能需要检查索引设计
```

---

## 23.5 Extra 列 —— 关键附加信息

Extra 列提供了执行计划的额外重要信息，是判断性能问题的关键依据。

### 23.5.1 好消息

```sql
-- Using index（覆盖索引）—— 最优！
-- 查询所需的列全部包含在索引中，不需要回表
EXPLAIN SELECT email FROM users WHERE email = 'test@test.com';
-- Extra: Using index → 只读索引，性能最好

-- Using index condition（ICP - Index Condition Pushdown）
-- MySQL 5.6+ 特性：将 WHERE 条件下推到存储引擎层过滤
-- 减少了回表次数
EXPLAIN SELECT * FROM users WHERE name LIKE 'Al%' AND age > 20;
-- Extra: Using index condition → 在索引层面就过滤掉不符合 age>20 的行

-- Select tables optimized away
-- 查询已经被优化成不需要访问表（如 MIN/MAX on indexed column）
EXPLAIN SELECT MAX(id) FROM users;
-- Extra: Select tables optimized away

-- Using MRR (Multi-Range Read)
-- 对范围扫描的结果按主键排序后再回表，将随机 I/O 转为顺序 I/O

-- No tables used
-- 查询没有涉及任何表（如 SELECT 1+1）
EXPLAIN SELECT 1 + 1;  -- Extra: No tables used
```

### 23.5.2 坏消息

```sql
-- Using filesort —— 需要额外排序（坏消息！）
-- MySQL 无法利用索引顺序完成 ORDER BY，需要独立排序操作
EXPLAIN SELECT * FROM users ORDER BY age;
-- 如果 age 上没有索引 → Extra: Using filesort
-- 大量数据时，filesort 可能导致磁盘临时文件产生

-- 解决方案：为 age 创建索引
CREATE INDEX idx_age ON users(age);
EXPLAIN SELECT * FROM users ORDER BY age;  -- Extra 中不再有 Using filesort

-- Using temporary —— 使用临时表（更坏的消息！）
-- 通常出现在 GROUP BY + ORDER BY 不同列，或 DISTINCT + ORDER BY
EXPLAIN SELECT DISTINCT name FROM users ORDER BY age;
-- Extra: Using temporary; Using filesort

-- 解决方案：创建复合索引使 GROUP BY 和 ORDER BY 能使用同一索引
```

### 23.5.3 其他 Extra 信息

```sql
-- Using where —— 使用 WHERE 条件过滤（中性信息）
-- MySQL 服务器层对存储引擎返回的行进行 WHERE 过滤
-- 结合 type=ALL 时说明全表扫描 + 服务器过滤（性能差）
-- 结合 type=range/ref 时说明索引扫描 + 服务器一层过滤（正常）

-- Using join buffer —— 使用了连接缓冲区（无索引的 JOIN）
-- 说明被驱动表的 JOIN 列上没有索引
-- 每次 JOIN 需要从驱动表中缓存数据到 join buffer
-- 解决方案：为 JOIN 列创建索引

-- Impossible WHERE —— WHERE 条件永远为假
EXPLAIN SELECT * FROM users WHERE 1 = 0;
-- Extra: Impossible WHERE
-- MySQL 优化器直接返回空结果，不访问表
```

---

## 23.6 EXPLAIN 的增强形式

### 23.6.1 EXPLAIN FORMAT=JSON

提供更详细的执行计划信息，以 JSON 格式输出。包含成本估算、子查询详情、排序操作等。

```sql
-- EXPLAIN FORMAT=JSON
EXPLAIN FORMAT=JSON
SELECT u.name, COUNT(*) AS order_cnt
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.id;

-- JSON 输出中包含：
-- query_block：查询块信息
-- table：每张表的访问详情
--   - table_name
--   - access_type：访问类型
--   - possible_keys：候选索引
--   - key：实际使用的索引
--   - used_key_parts：实际使用的索引部分
--   - rows_examined_per_scan：每次扫描估算行数
--   - cost_info：详细的成本估算
--     - read_cost：读取成本
--     - eval_cost：计算成本
--     - prefix_cost：前缀成本（包含前面的表）
--     - data_read_per_join：数据传输量
-- ordering_operation：排序操作详情
-- group_operation：分组操作详情
```

### 23.6.2 EXPLAIN ANALYZE（MySQL 8.0.18+）

EXPLAIN ANALYZE **实际执行**查询并输出每一步的真实时间消耗和返回行数。这是性能分析的游戏规则改变者。

```sql
-- EXPLAIN ANALYZE：实际执行 + 真实数据
EXPLAIN ANALYZE
SELECT u.name, COUNT(*) AS cnt
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.name;

-- 输出格式：
-- -> Table scan on <temporary>  (actual time=0.001..0.002 rows=50 loops=1)
--     -> Aggregate using temporary table  (actual time=5.234..5.238 rows=50 loops=1)
--         -> Nested loop inner join  (cost=100.50 rows=500) (actual time=0.050..4.890 rows=500 loops=1)
--             -> Table scan on u  (cost=10.25 rows=100) (actual time=0.020..0.150 rows=100 loops=1)
--             -> Index lookup on o using idx_user_id (user_id=u.id) (cost=0.35 rows=5) (actual time=0.015..0.045 rows=5 loops=100)

-- 关键信息解读：
-- actual time=X..Y：
--   X = 返回第一行的时间（ms）
--   Y = 返回所有行的时间（ms）
-- rows = 实际返回的行数
-- loops = 该步骤执行的次数
-- cost = 估算成本（来自优化器）

-- 与普通 EXPLAIN 的区别：
-- - EXPLAIN（估算）：基于统计信息的估算，不执行查询
-- - EXPLAIN ANALYZE（实测）：真正执行查询，给出准确的时间和行数
-- - 警告：INSERT/UPDATE/DELETE 也会真正执行！建议用事务包裹并回滚

-- 安全使用 EXPLAIN ANALYZE 的技巧：
START TRANSACTION;
EXPLAIN ANALYZE UPDATE orders SET status = 'archived' WHERE created_at < '2023-01-01';
ROLLBACK;  -- 取消修改
```

---

## 23.7 实战：EXPLAIN 驱动的查询优化流程

### 23.7.1 标准优化流程

```
步骤 1：收集慢查询
    ↓ (慢查询日志 / performance_schema)
步骤 2：EXPLAIN 慢查询
    ↓
步骤 3：分析执行计划
    - type=ALL? → 需要索引
    - Extra=Using filesort? → 调整索引或查询
    - Extra=Using temporary? → 优化 GROUP BY/DISTINCT
    - key=NULL? → 索引未被使用或不存在
    ↓
步骤 4：创建/修改索引
    ↓
步骤 5：重新 EXPLAIN 验证
    ↓ (type 从 ALL→range/ref, rows 大幅减少)
步骤 6：对比性能指标
    ↓ (SHOW PROFILES / 应用层计时)
步骤 7：确认优化效果并上线
```

### 23.7.2 实战案例：优化一个慢查询

```sql
-- 原始慢查询（假设耗时 5 秒）
SELECT o.order_no, u.name, p.product_name, o.amount
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 50;

-- 步骤 1：EXPLAIN
EXPLAIN
SELECT o.order_no, u.name, p.product_name, o.amount
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 50;

-- 步骤 2：分析执行计划
-- 假设输出：
-- id=1, table=o, type=ALL, key=NULL, rows=5000000, Extra=Using where; Using filesort
-- id=1, table=u, type=eq_ref, key=PRIMARY, rows=1, Extra=NULL
-- id=1, table=p, type=eq_ref, key=PRIMARY, rows=1, Extra=NULL
--
-- 问题：
-- 1. orders 表 type=ALL（全表扫描 500 万行！）
-- 2. Extra=Using filesort（额外排序操作）

-- 步骤 3：设计索引
-- 查询条件：status = 'pending' AND created_at > '2024-01-01'
-- 排序条件：ORDER BY created_at DESC
-- JOIN 条件：user_id 和 product_id
--
-- 最优索引设计：
-- CREATE INDEX idx_status_created ON orders(status, created_at);
-- 原因：status 是等值查询，created_at 是范围查询
-- 索引可以同时满足 WHERE 过滤和 ORDER BY 排序

CREATE INDEX idx_status_created ON orders(status, created_at);

-- 步骤 4：重新 EXPLAIN
EXPLAIN
SELECT o.order_no, u.name, p.product_name, o.amount
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 50;

-- 优化后的执行计划：
-- id=1, table=o, type=range, key=idx_status_created, rows=50000, Extra=Using index condition
-- id=1, table=u, type=eq_ref, key=PRIMARY, rows=1, Extra=NULL
-- id=1, table=p, type=eq_ref, key=PRIMARY, rows=1, Extra=NULL
--
-- 改进：
-- type: ALL → range（性能飞跃）
-- rows: 5000000 → 50000（减少 99%）
-- Extra: 去掉 Using filesort（利用索引排序）
--
-- 预计查询时间：5 秒 → 0.05 秒
```

---

## 常见错误

1. **只看 type 不看 Extra**
   - 错误：看到 type=ref 就认为查询没问题，忽略了 Extra=Using filesort 或 Using temporary。
   - 后果：小数据量时没问题，数据量增长后性能急剧下降。
   - 解决：type 和 Extra 同等重要，尤其关注 Using filesort 和 Using temporary 在大数据量下的影响。

2. **过度依赖 rows 列的精确度**
   - 错误：看到 rows=1 就认为扫描了 1 行，效率很高。
   - 后果：rows 是估算值，实际可能相差 10 倍甚至 100 倍。InnoDB 的统计信息可能不准确。
   - 解决：对于重要查询，使用 EXPLAIN ANALYZE（MySQL 8.0.18+）获取真实执行数据，或执行 ANALYZE TABLE 更新统计信息。

3. **忽略 filtered 列**
   - 错误：rows=10000, filtered=100.00，认为扫了 10000 行。但如果 filtered=10.00，实际应用层还需要做更多的过滤。
   - 后果：低估了查询的实际工作量。
   - 解决：关注 rows * filtered% 来估算实际符合条件的行数。

4. **对 DEPENDENT SUBQUERY 视而不见**
   - 错误：执行计划中出现 DEPENDENT SUBQUERY（相关子查询），但没有做优化。
   - 后果：外层查询的每一行都会触发子查询执行，N 行数据导致 N 次子查询。
   - 解决：将相关子查询改写为 JOIN 或使用 MATERIALIZED 子查询。

5. **EXPLAIN FORMAT=JSON 只看片段**
   - 错误：只看 query_cost 总体数字，忽略了各步骤的 cost_info 详情。
   - 后果：无法定位具体哪个 JOIN 步骤的开销最大。
   - 解决：仔细分析 cost_info 中各步骤的 read_cost 和 eval_cost，优先优化成本最高的步骤。

---

## 本章练习

1. **type 类型判断**：给定 10 个不同的查询场景和表结构，判断每个查询的 EXPLAIN type 应该是哪种类型（const, eq_ref, ref, range, index, ALL），并说明判断依据。

2. **复合索引 key_len 分析**：创建一个包含复合索引 `(name VARCHAR(50), age INT, email VARCHAR(100))` 的表（utf8mb4），对于不同的 WHERE 条件组合，计算 key_len 的值以判断索引的哪些列被使用了。

3. **慢查询优化实战**：给定一个慢查询的 EXPLAIN 输出（包含 type=ALL、Extra=Using filesort 等信息），完成以下步骤：(1) 指出性能瓶颈；(2) 设计最优索引；(3) 预测优化后的 EXPLAIN 输出；(4) 说明为什么新索引能解决问题。

4. **EXPLAIN ANALYZE 使用**：使用 EXPLAIN ANALYZE（MySQL 8.0.18+ 环境）执行一个 JOIN 查询，解读 actual time、rows 和 loops 的含义，并与普通 EXPLAIN 的估算进行对比。

5. **explain_json 解读**：给出一个 EXPLAIN FORMAT=JSON 的输出示例，解读嵌套结构中各部分的含义，重点分析 cost_info 中 read_cost、eval_cost、prefix_cost 的区别和意义。

6. **综合优化**：有一张 1000 万行的销售表 sales(id, product_id, sale_date, quantity, amount)，高频查询为 `SELECT product_id, SUM(quantity), SUM(amount) FROM sales WHERE sale_date BETWEEN ? AND ? GROUP BY product_id ORDER BY SUM(amount) DESC LIMIT 10`。编写此查询的 EXPLAIN，设计覆盖索引，重新 EXPLAIN 验证，并解释为什么 type 由 ALL 变为 range 且 Extra 中不再出现 Using temporary 和 Using filesort。
