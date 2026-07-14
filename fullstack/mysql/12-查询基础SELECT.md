# 第12章：查询基础 SELECT

## 本章目标
学完本章后，你将能够：
1. 掌握 SELECT 语句的基本结构和各种写法
2. 理解 SELECT 子句的书写顺序与实际执行顺序的差异
3. 熟练使用列别名、表别名和 DISTINCT 去重
4. 在 SELECT 中使用表达式和函数处理数据
5. 正确处理 NULL 值在查询中的表现

## 前置知识
- 第9章：插入数据 INSERT（需要表中已有数据才能查询）
- 基本数据类型知识
- 表达式基础知识（算术运算、字符串拼接）

---

## 12.1 最简单的 SELECT

SELECT 不一定需要表。它可以用于简单的表达式计算和函数调用，这在调试和验证时非常有用：

```sql
-- 1. 最简单的 SELECT：计算表达式
SELECT 1;
-- +---+
-- | 1 |
-- +---+
-- | 1 |
-- +---+

-- 2. 选择字符串字面量
SELECT 'Hello, World!';

-- 3. 计算表达式
SELECT 1 + 1;               -- 2
SELECT 3 * 7;               -- 21
SELECT 10 / 3;              -- 3.3333
SELECT 10 DIV 3;            -- 3（整数除法）
SELECT 10 % 3;              -- 1（取模）

-- 4. 调用函数
SELECT NOW();               -- 当前日期时间
SELECT VERSION();           -- MySQL 版本
SELECT DATABASE();          -- 当前数据库
SELECT USER();              -- 当前用户
SELECT PI();                -- 圆周率 π
SELECT RAND();              -- 0~1 之间的随机数
SELECT UUID();              -- 生成 UUID
```

### SELECT 的多列

```sql
-- 同时选择多个表达式
SELECT
    1 + 1 AS '算术结果',
    NOW() AS '当前时间',
    VERSION() AS 'MySQL版本',
    '多列查询' AS '说明';
```

---

## 12.2 SELECT FROM 基本查询

有了表之后，SELECT 才能真正发挥威力：

```sql
-- 准备测试数据
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, category, price, stock, description) VALUES
('机械键盘', '电脑配件', 399.00, 50, 'Cherry 青轴机械键盘'),
('无线鼠标', '电脑配件', 129.00, 200, '蓝牙 5.0 无线鼠标'),
('显示器27寸', '电脑配件', 1999.00, 30, '4K IPS 显示器'),
('Python编程书', '图书', 89.00, 100, '从入门到实践'),
('MySQL必知必会', '图书', 69.00, 80, '数据库经典入门书'),
('Go语言圣经', '图书', 99.00, 60, NULL),
('办公椅', '家具', 599.00, 15, '人体工学椅'),
('台灯 LED', '家具', 199.00, 45, '护眼台灯');
```

### 指定列查询

```sql
-- 查询指定列：高效、清晰
SELECT name, price, stock
FROM products;

-- 输出：
-- +-----------------+----------+-------+
-- | name            | price    | stock |
-- +-----------------+----------+-------+
-- | 机械键盘         |  399.00  |    50 |
-- | 无线鼠标         |  129.00  |   200 |
-- ...

-- 列的顺序由 SELECT 子句决定，与建表顺序无关
SELECT stock, name, price
FROM products;
-- stock 显示在第一列
```

### 查询所有列：SELECT *

```sql
-- SELECT * 返回表中的所有列
SELECT * FROM products;

-- 为什么 SELECT * 在生产代码中不好？
-- 1. 性能：读取不需要的列浪费 IO 和内存
-- 2. 不稳定：表结构改变（加列/改列序）可能影响依赖列位置的应用代码
-- 3. 不可读：看代码的人不知道到底查了哪些列
-- 4. 覆盖索引失效：无法利用只包含部分列的覆盖索引

-- ✅ 生产代码始终列出所需的列
SELECT id, name, price, stock FROM products;

-- SELECT * 的合理使用场景：
-- 1. 临时探索性查询（如命令行手动检查数据）
-- 2. 确实需要所有列（如导出完整数据）
-- 3. 使用 EXISTS/NOT EXISTS 子查询（内部用 SELECT 1 或 SELECT * 均可）
```

> **面试要点**：当面试官问"SELECT * 有什么问题"时，至少说出以上 4 点中的 3 点。

---

## 12.3 列别名（Column Alias）

别名用于给查询结果中的列一个临时名称，不影响原始表：

```sql
-- 1. 使用 AS 关键字（推荐写法，可读性最好）
SELECT
    name AS '商品名称',
    price AS '价格',
    stock AS '库存数量'
FROM products;

-- 2. 省略 AS（也能工作，但不推荐）
SELECT
    name '商品名称',
    price '价格',
    stock '库存数量'
FROM products;

-- 3. 如果别名不含空格和特殊字符，可以不用引号
SELECT
    name AS product_name,
    price AS unit_price,
    stock AS quantity
FROM products;
```

### 别名的作用范围：执行顺序的关键影响

别名只在 ORDER BY、HAVING 和后续的 SELECT 中可用，在 WHERE 中不可用。这是由 SQL 的执行顺序决定的：

```sql
-- ✅ 可以在 ORDER BY 中使用别名（ORDER BY 在 SELECT 之后执行）
SELECT
    name,
    price * stock AS total_value
FROM products
ORDER BY total_value DESC;

-- ❌ 不能在 WHERE 中使用别名（WHERE 在 SELECT 之前执行）
-- SELECT
--     name,
--     price * stock AS total_value
-- FROM products
-- WHERE total_value > 5000;
-- ERROR 1054 (42S22): Unknown column 'total_value' in 'where clause'
```

本章 [12.6 节](#126-select-子句的书写顺序-vs-实际执行顺序) 会深入解释执行顺序。

---

## 12.4 表别名（Table Alias）

表别名简化长表名的书写，尤其在多表 JOIN 和子查询中必不可少：

```sql
-- 使用表别名简化查询
SELECT p.name, p.price, p.stock
FROM products p;  -- p 是 products 的别名
```

```sql
-- 表别名在多表查询中不可或缺
-- 假设有 orders 和 products 两张表
SELECT
    o.id AS order_id,
    p.name AS product_name,
    o.quantity,
    p.price * o.quantity AS subtotal
FROM orders o
JOIN products p ON o.product_id = p.id;
```

表别名的规则：
- 一旦定义了表别名，就必须使用别名引用该表，不能再用原表名
- 表别名只在当前查询中有效
- 表别名不能用引号括起来（用了引号就不是别名而是字符串了）

---

## 12.5 DISTINCT：去除重复行

DISTINCT 用于消除结果集中的重复行：

```sql
-- 查询所有商品分类
SELECT category FROM products;
-- 返回 8 行，其中'电脑配件'出现 3 次，'图书'出现 3 次，'家具'出现 2 次

-- 使用 DISTINCT 去重
SELECT DISTINCT category FROM products;
-- +--------------+
-- | category     |
-- +--------------+
-- | 电脑配件      |
-- | 图书          |
-- | 家具          |
-- +--------------+
-- 返回 3 行，每行唯一
```

### DISTINCT 与多列

当 DISTINCT 应用于多列时，去重的是**整行组合**，而非某一列：

```sql
-- 多列 DISTINCT：去除 (category, price) 的重复组合
SELECT DISTINCT category, price FROM products;

-- 这意味着：
-- ('电脑配件', 399.00) 和 ('电脑配件', 129.00) 是不同的行，都会保留
-- 但如果两条记录完全相同（category 和 price 都一样），则只保留一条
```

### DISTINCT 与聚合函数

```sql
-- DISTINCT 可以用在聚合函数内部
SELECT COUNT(DISTINCT category) FROM products;      -- 3（3 个不同的分类）
SELECT COUNT(*) FROM products;                       -- 8（总共 8 行）
SELECT COUNT(DISTINCT category), COUNT(*) FROM products;

-- GROUP_CONCAT 中使用 DISTINCT
SELECT GROUP_CONCAT(DISTINCT category ORDER BY category SEPARATOR ', ')
FROM products;
-- 输出：电脑配件, 图书, 家具
```

### DISTINCT vs GROUP BY

```sql
-- 以下两条语句结果完全相同：
SELECT DISTINCT category FROM products;
SELECT category FROM products GROUP BY category;

-- 区别：
-- DISTINCT：简单去重，只能去除完全相同的行
-- GROUP BY：分组聚合，可以在每组上使用聚合函数（COUNT, SUM, AVG 等）

-- 当只需要去重时，用 DISTINCT 更简洁、意图更明确
-- 当需要计算每组的数据时，用 GROUP BY
```

---

## 12.6 SELECT 子句的书写顺序 vs 实际执行顺序

这是理解 SQL 最关键的知识点之一。书写 SQL 时各子句必须按以下顺序，但 MySQL 实际执行时的顺序完全不同：

### 书写顺序（必须严格遵守）

```sql
SELECT [DISTINCT] 列列表
FROM 表名
[JOIN 其他表 ON 条件]
[WHERE 过滤条件]
[GROUP BY 分组列]
[HAVING 分组后过滤条件]
[ORDER BY 排序列 [ASC|DESC]]
[LIMIT [偏移量,] 行数];
```

### SQL 各子句的实际执行顺序

```
(7) SELECT
(8) DISTINCT
(1) FROM (包括 JOIN 和 ON)
(2) WHERE
(3) GROUP BY
(4) HAVING
(6) ORDER BY
(9) LIMIT
```

按执行顺序详细解读每一步：

```sql
-- 示例查询
SELECT
    category,
    COUNT(*) AS cnt,
    AVG(price) AS avg_price
FROM products
WHERE price > 50
GROUP BY category
HAVING COUNT(*) >= 2
ORDER BY avg_price DESC
LIMIT 5;
```

| 步骤 | 执行内容 | 说明 |
|------|----------|------|
| 1. FROM | 确定数据源 `products` 表，如果有 JOIN 则在此步完成表连接 | 这是执行的起点 |
| 2. WHERE | 过滤：只保留 `price > 50` 的行 | 在分组前过滤，减少后续处理的数据量 |
| 3. GROUP BY | 按 `category` 分组 | 每组的行被合并为一个组 |
| 4. HAVING | 过滤分组：只保留 `COUNT(*) >= 2` 的组 | 在分组后过滤 |
| 5. SELECT | 选择列并计算表达式：`category`, `COUNT(*)` 等 | 此时才真正确定最终输出的列 |
| 6. ORDER BY | 按 `avg_price DESC` 排序 | 排序是最后一步（除 LIMIT 外） |
| 7. LIMIT | 只返回前 5 行 | 最后截断结果集 |

### 为什么理解执行顺序极其重要

**规则一：列别名不能在 WHERE 中使用**

```sql
-- ❌ 错误：total 是 SELECT 中定义的别名，但 WHERE 在 SELECT 之前执行
SELECT name, price * stock AS total
FROM products
WHERE total > 5000;

-- ✅ 正确：在 WHERE 中重复写表达式
SELECT name, price * stock AS total
FROM products
WHERE price * stock > 5000;

-- ✅ 或者在 HAVING 中使用（但语义不太对）
-- HAVING 在 SELECT 之后执行，可以使用别名
```

**规则二：ORDER BY 可以使用列别名**

```sql
-- ✅ 正确：ORDER BY 在 SELECT 之后执行
SELECT name, price * stock AS total_value
FROM products
ORDER BY total_value DESC;
```

**规则三：SELECT 中表达式的计算顺序**

```sql
-- SELECT 中的表达式按书写顺序计算（从左到右）
SELECT
    price,
    price * 0.1 AS discount,
    price - price * 0.1 AS discounted_price
FROM products
LIMIT 3;
-- 注意：这里的 discounted_price 引用了 discount 别名
-- 在 SELECT 中可以引用之前定义的别名（但这不是 SQL 标准行为，不推荐依赖）
```

---

## 12.7 在 SELECT 中使用表达式

SELECT 不仅可以选择列，还可以包含计算和函数调用：

```sql
-- 1. 算术表达式
SELECT
    name,
    price,
    stock,
    price * stock AS total_value,        -- 总价值
    price * 1.13 AS price_with_tax       -- 含税价格（13% 税率）
FROM products;

-- 2. 字符串函数
SELECT
    name,
    UPPER(name) AS name_upper,            -- 转大写
    LOWER(category) AS cat_lower,         -- 转小写
    CONCAT(name, ' - ¥', price) AS label, -- 拼接
    LENGTH(name) AS name_len              -- 字符长度
FROM products;
```

```sql
-- 3. 数学函数
SELECT
    name,
    price,
    ROUND(price * 1.13, 2) AS price_taxed,   -- 四舍五入到 2 位小数
    CEIL(price) AS ceiling_price,              -- 向上取整
    FLOOR(price) AS floor_price,               -- 向下取整
    price MOD 10 AS price_mod                  -- 取模
FROM products;

-- 4. 日期函数
SELECT
    name,
    created_at,
    YEAR(created_at) AS year,
    MONTH(created_at) AS month,
    DATEDIFF(NOW(), created_at) AS days_ago   -- 距今天数
FROM products;
```

```sql
-- 5. 条件表达式
SELECT
    name,
    price,
    stock,
    -- CASE 表达式
    CASE
        WHEN stock >= 100 THEN '充足'
        WHEN stock >= 30 THEN '正常'
        WHEN stock > 0 THEN '紧张'
        ELSE '缺货'
    END AS stock_status,
    -- IF 函数（MySQL 特有）
    IF(stock > 50, '库存充裕', '需要补货') AS stock_note
FROM products;
```

### 字面量混合列

```sql
-- 在 SELECT 中混合字面量（常量）与列值
SELECT
    '商品：' AS prefix,
    name,
    '价格：¥' AS price_label,
    price,
    '元' AS unit
FROM products;

-- 实战示例：生成报表行
SELECT
    CONCAT('商品【', name, '】当前库存', stock, '件，单价¥', price) AS report
FROM products;

-- 输出示例：
-- 商品【机械键盘】当前库存50件，单价¥399.00
```

---

## 12.8 NULL 在 SELECT 中的行为

NULL 是 SQL 中的一个核心概念。它表示"未知"或"不存在"：

```sql
-- 准备含 NULL 的数据
UPDATE products SET description = NULL WHERE id = 6;

-- 查询含 NULL 的列
SELECT name, description FROM products;
-- Go语言圣经 的 description 列显示为 NULL
```

### 任何表达式包含 NULL，结果都是 NULL

```sql
-- NULL 的传染性：任何与 NULL 的运算结果都是 NULL
SELECT
    1 + NULL,           -- NULL
    'Hello' || NULL,    -- NULL（MySQL 中 || 默认是 OR，不是字符串拼接）
    CONCAT('Hello', NULL), -- NULL
    100 > NULL,         -- NULL
    100 = NULL;         -- NULL（不是 FALSE！）
```

### 处理 NULL 的函数

```sql
-- COALESCE：返回第一个非 NULL 的值
SELECT
    name,
    description,
    COALESCE(description, '暂无描述') AS desc_display
FROM products;

-- IFNULL（MySQL 特有，等价于两个参数的 COALESCE）
SELECT
    name,
    IFNULL(description, '暂无描述') AS desc_display
FROM products;

-- NULLIF：如果两个参数相等返回 NULL，否则返回第一个参数
SELECT NULLIF(100, 100);  -- NULL（因为相等）
SELECT NULLIF(100, 200);  -- 100（因为不等）
-- 常见用途：避免除以零
SELECT price / NULLIF(stock, 0) FROM products;
```

### NULL 在计算中的实际影响

```sql
-- 计算总和时，SUM() 会忽略 NULL（视为 0）
-- 但手动用 + 计算时，遇到 NULL 结果就是 NULL

-- 假设某人的 bonus 是 NULL
SELECT salary + bonus FROM employees;       -- 如果 bonus 是 NULL，结果为 NULL
SELECT salary + COALESCE(bonus, 0) FROM employees;  -- 正确，把 NULL 当成 0
```

---

## 12.9 字符串拼接

```sql
-- MySQL 中字符串拼接用 CONCAT()，不要用 + 或 ||
-- + 在 MySQL 中只是数字加法，|| 默认是逻辑 OR

-- ✅ 正确
SELECT CONCAT('Hello', ' ', 'World') AS greeting;          -- Hello World
SELECT CONCAT(name, ' - ¥', price) AS display FROM products;

-- CONCAT_WS：用指定分隔符拼接（自动跳过 NULL）
SELECT CONCAT_WS(' - ', name, category, price) FROM products;
-- 如果某列为 NULL，自动跳过该列和对应的分隔符

-- GROUP_CONCAT：将组内多行拼接为一个字符串（见第15章）
```

---

## 10.10 SELECT 结果集的特性

```sql
-- 1. 查询结果本质上也是一张表（派生表）
-- 这意味着可以在另一个查询中把查询结果当作表来使用
SELECT * FROM (
    SELECT name, price FROM products WHERE price > 100
) AS expensive_products;

-- 2. 结果集中列的顺序由 SELECT 子句决定
-- 3. 结果集的行顺序在没有 ORDER BY 时是不确定的（取决于存储引擎和查询计划）
-- 4. 同一查询多次执行可能返回不同顺序的行（没有 ORDER BY 的情况下）
```

---

## 常见错误

### 1. 在 WHERE 中使用 SELECT 别名

```sql
-- ❌ 错误
-- SELECT name, price * stock AS total_value
-- FROM products
-- WHERE total_value > 5000;

-- 原因：WHERE 执行时 SELECT 还没执行，别名还不存在
-- 解决：在 WHERE 中重复表达式
SELECT name, price * stock AS total_value
FROM products
WHERE price * stock > 5000;
```

### 2. 用 = 判断 NULL 而不是 IS NULL

```sql
-- ❌ 错误
-- SELECT * FROM products WHERE description = NULL;
-- 结果：0 行（任何值与 NULL 的比较结果都是 NULL/UNKNOWN，不是 TRUE）

-- ✅ 正确
SELECT * FROM products WHERE description IS NULL;
```

### 3. SELECT * 的隐患

```sql
-- 表结构是：id, name, email, password_hash, is_admin, created_at
-- ❌ 返回了所有列，包括敏感的 password_hash
-- SELECT * FROM users WHERE id = 1;

-- ✅ 只返回需要的列
SELECT id, name, email, created_at FROM users WHERE id = 1;
```

### 4. 字符串拼接到一半出现 NULL

```sql
-- ❌ 意外：如果 description 为 NULL，整个结果就是 NULL
SELECT CONCAT(name, ' - ', description) FROM products;

-- ✅ 使用 COALESCE 保护
SELECT CONCAT(name, ' - ', COALESCE(description, '')) FROM products;
```

---

## 本章练习

1. **无表 SELECT 练习**：使用 SELECT（不带 FROM）计算以下内容：
   - 半径为 5 的圆的面积（π * r^2）
   - 当前日期和时间（NOW()）
   - 字符串 "Hello" 和 "MySQL" 用空格拼接
   - 100 除以 3，保留 3 位小数

2. **基本查询练习**：创建 `products` 表并插入至少 8 条数据。练习：
   - 查询所有产品的名称和价格
   - 查询所有列（SELECT *）
   - 查询唯一的分类列表（DISTINCT）
   - 对每个产品计算总价值（价格 x 库存）

3. **别名练习**：查询所有产品，使用别名输出以下列名：`商品名`、`分类`、`单价`、`库存`、`总价值`（价格x库存）、`含税价格`（价格x1.13）。

4. **NULL 处理练习**：向 `products` 表添加几条 description 为 NULL 的记录。练习使用 COALESCE 和 IFNULL 将 NULL 替换为"暂无描述"。

5. **执行顺序验证练习**：尝试在 WHERE 子句中使用 SELECT 中定义的别名（应该报错），然后在 ORDER BY 中使用同样的别名（应该成功），体会执行顺序的差异。

6. **表达式练习**：编写一条查询，对每个产品输出：
   - 产品名称
   - 库存状态（CASE 表达式，充足/正常/紧张/缺货）
   - 完整描述（如果 description 为 NULL 则显示"暂无描述"）
   - 格式化的价格标签（如"机械键盘 - 399元"）
