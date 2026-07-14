# 第15章：GROUP BY 与 HAVING

## 本章目标
学完本章后，你将能够：
1. 理解 GROUP BY 的分组聚合原理
2. 熟练使用 COUNT、SUM、AVG、MAX、MIN 等聚合函数
3. 理解 ONLY_FULL_GROUP_BY 模式的要求并写出标准 SQL
4. 使用 HAVING 对分组后的结果进行过滤
5. 区分 WHERE 和 HAVING 的过滤时机
6. 使用 WITH ROLLUP 生成汇总行

## 前置知识
- 第12章：查询基础 SELECT
- 第13章：WHERE 条件过滤
- 第14章：ORDER BY 排序

---

## 15.1 GROUP BY 的概念

GROUP BY 将表中的行按照指定列的值分成若干"组"，然后对每个组应用聚合函数，最终每个组输出一行结果：

```
原始数据（10行）                    分组后（3行）
┌────────┬───────┐                ┌────────┬──────────┐
│ class  │ score │                │ class  │ AVG(score)│
├────────┼───────┤   GROUP BY     ├────────┼──────────┤
│ 一班   │  85   │   ========>    │ 一班   │   80.75   │
│ 一班   │  92   │   class        │ 二班   │   85.17   │
│ 一班   │  78   │                │ 三班   │   88.17   │
│ 一班   │  67   │                └────────┴──────────┘
│ 二班   │  88   │
│ 二班   │  95   │
│ 二班   │  72   │
│ 三班   │  88   │
│ 三班   │  85   │
│ 三班   │  91   │
└────────┴───────┘
```

### 准备测试数据

```sql
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(50) NOT NULL,
    category VARCHAR(30),
    region VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    salesperson VARCHAR(30)
);

INSERT INTO sales (product, category, region, amount, sale_date, salesperson) VALUES
('笔记本电脑', '电子产品', '华北', 5999.00, '2026-01-15', '张三'),
('机械键盘', '电子产品', '华北', 399.00, '2026-01-18', '张三'),
('Python编程书', '图书', '华北', 89.00, '2026-02-05', '李四'),
('显示器', '电子产品', '华东', 1999.00, '2026-02-10', '王五'),
('MySQL必知必会', '图书', '华东', 69.00, '2026-02-12', '王五'),
('无线鼠标', '电子产品', '华东', 129.00, '2026-03-01', '赵六'),
('办公椅', '家具', '华南', 599.00, '2026-03-10', '孙七'),
('笔记本电脑', '电子产品', '华南', 5999.00, '2026-03-15', '孙七'),
('Go语言圣经', '图书', '华南', 99.00, '2026-04-02', '周八'),
('台灯', '家具', '华北', 199.00, '2026-04-10', '张三'),
('机械键盘', '电子产品', '华东', 399.00, '2026-04-20', '赵六'),
('Python编程书', '图书', '华南', 89.00, '2026-05-05', '周八');

SELECT * FROM sales;
```

---

## 15.2 基本 GROUP BY 用法

```sql
-- 按分类统计销售总额
SELECT
    category,
    SUM(amount) AS total_amount,
    COUNT(*) AS order_count,
    AVG(amount) AS avg_amount
FROM sales
GROUP BY category;

-- 输出：
-- +--------------+---------------+--------------+-------------+
-- | category     | total_amount  | order_count  | avg_amount  |
-- +--------------+---------------+--------------+-------------+
-- | 电子产品      |      14924.00 |            5 |    2984.800 |
-- | 图书          |        346.00 |            4 |      86.500 |
-- | 家具          |        798.00 |            2 |     399.000 |
-- +--------------+---------------+--------------+-------------+
```

### 多列 GROUP BY

```sql
-- 按分类和地区两个维度分组
SELECT
    category,
    region,
    SUM(amount) AS total_amount,
    COUNT(*) AS order_count
FROM sales
GROUP BY category, region
ORDER BY category, region;

-- 输出：
-- +--------------+--------+---------------+-------------+
-- | category     | region | total_amount  | order_count |
-- +--------------+--------+---------------+-------------+
-- | 电子产品      | 华东   |       2527.00 |           2 |
-- | 电子产品      | 华北   |       6398.00 |           2 |
-- | 电子产品      | 华南   |       5999.00 |           1 |
-- | 家具          | 华北   |        199.00 |           1 |
-- | 家具          | 华南   |        599.00 |           1 |
-- | 图书          | 华东   |         69.00 |           1 |
-- | 图书          | 华北   |         89.00 |           1 |
-- | 图书          | 华南   |        188.00 |           2 |
-- +--------------+--------+---------------+-------------+
```

---

## 15.3 ONLY_FULL_GROUP_BY 模式

这是 MySQL 5.7 之后最重要的行为变化之一。当 `sql_mode` 包含 `ONLY_FULL_GROUP_BY` 时（MySQL 5.7.5+ 默认开启），SELECT 中的非聚合列必须出现在 GROUP BY 中：

```sql
-- 查看当前 sql_mode
SELECT @@sql_mode;

-- 检查是否包含 ONLY_FULL_GROUP_BY
SELECT @@sql_mode LIKE '%ONLY_FULL_GROUP_BY%';
```

### 违规示例

```sql
-- ❌ 在 ONLY_FULL_GROUP_BY 模式下报错
-- SELECT category, product, SUM(amount)
-- FROM sales
-- GROUP BY category;
-- ERROR 1055 (42000): Expression #2 of SELECT list is not in GROUP BY clause
-- and contains nonaggregated column 'sales.product' which is not functionally
-- dependent on columns in GROUP BY clause; this is incompatible with
-- sql_mode=only_full_group_by

-- 问题：product 不在 GROUP BY 中，也不是聚合函数的参数
-- MySQL 不知道每组（每个 category）中有多个 product，它应该取哪一个？
```

### 为什么需要 ONLY_FULL_GROUP_BY？

```sql
-- 假设没有 ONLY_FULL_GROUP_BY（MySQL 5.6 及更早版本的默认行为）
-- 下面的查询不会报错，但 product 列的值是"不确定的"（随机取组内的某一行的值）
-- SELECT category, product, SUM(amount)
-- FROM sales
-- GROUP BY category;
-- 结果可能是：
-- +--------------+-----------------+--------------+
-- | category     | product         | SUM(amount)  |
-- +--------------+-----------------+--------------+
-- | 电子产品      | 笔记本电脑       |     14924.00 |  ← product 可能是组内任意一行
-- | 图书          | Python编程书     |       346.00 |
-- | 家具          | 办公椅           |       798.00 |
-- +--------------+-----------------+--------------+
-- product 列的值没有任何意义！
```

### 正确做法

```sql
-- ✅ 方式1：将 product 也加入 GROUP BY
SELECT category, product, SUM(amount) AS total
FROM sales
GROUP BY category, product;

-- ✅ 方式2：使用聚合函数包装 product
SELECT
    category,
    GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ', ') AS products,
    SUM(amount) AS total
FROM sales
GROUP BY category;

-- ✅ 方式3：使用 ANY_VALUE() 明确表示"取任意值"（MySQL 5.7+）
SELECT
    category,
    ANY_VALUE(product) AS sample_product,  -- 明确告知：取任意一个值
    SUM(amount) AS total
FROM sales
GROUP BY category;
```

### 临时关闭 ONLY_FULL_GROUP_BY（不推荐）

```sql
-- 仅在需要兼容旧代码时使用
SET SESSION sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '');
-- 或
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- 执行你的查询 ...
-- SELECT category, product, SUM(amount) FROM sales GROUP BY category;

-- 恢复（重新连接即可恢复默认）
```

---

## 15.4 聚合函数详解

### COUNT

```sql
-- 准备含 NULL 的数据
INSERT INTO sales (product, category, region, amount, sale_date, salesperson)
VALUES ('测试商品', NULL, NULL, NULL, '2026-06-01', NULL);

-- COUNT(*)：计数所有行，包括全 NULL 的行
SELECT COUNT(*) FROM sales;  -- 13（所有行）

-- COUNT(col)：计数该列非 NULL 的行数
SELECT COUNT(category) FROM sales;     -- 12（category 为 NULL 的不计入）
SELECT COUNT(amount) FROM sales;       -- 12（amount 为 NULL 的不计入）
SELECT COUNT(region) FROM sales;       -- 12

-- COUNT(DISTINCT col)：计数该列非 NULL 且不重复的值
SELECT COUNT(DISTINCT category) FROM sales;  -- 3（电子产品、图书、家具 + 不包括 NULL）

-- 组合使用
SELECT
    COUNT(*) AS total_rows,
    COUNT(salesperson) AS has_salesperson,
    COUNT(DISTINCT region) AS region_count
FROM sales;
```

### SUM

```sql
-- SUM(col)：计算列的总和，忽略 NULL 值
SELECT SUM(amount) FROM sales;  -- 所有非 NULL amount 的总和

-- SUM 与 GROUP BY
SELECT category, SUM(amount) AS total
FROM sales
GROUP BY category;

-- SUM 返回 NULL 的情况：组内所有值都是 NULL 或组为空
SELECT category, SUM(amount) AS total
FROM sales
WHERE category = '不存在的分类'
GROUP BY category;
-- 返回空结果集（0 行），而不是一行 SUM=0
```

### AVG

```sql
-- AVG(col)：计算平均值，忽略 NULL 值
SELECT AVG(amount) FROM sales;

-- AVG 只计算非 NULL 的行，这与 SUM/COUNT 的行为一致
SELECT
    category,
    COUNT(*) AS cnt,
    SUM(amount) AS total,
    AVG(amount) AS avg_amt,
    SUM(amount) / COUNT(*) AS avg_with_nulls  -- 如果 amount 有 NULL，这个值会偏小
FROM sales
GROUP BY category;
```

### MAX 和 MIN

```sql
-- MAX(col) / MIN(col)：最大值和最小值
SELECT
    MAX(amount) AS max_sale,
    MIN(amount) AS min_sale
FROM sales;

-- MAX 和 MIN 也可以用于字符串和日期
SELECT
    MAX(sale_date) AS latest_sale,
    MIN(sale_date) AS earliest_sale,
    MAX(product) AS last_product_alphabetically
FROM sales;
```

### GROUP_CONCAT：组内拼接

```sql
-- GROUP_CONCAT：将组内所有行的某列值拼接成一个字符串
SELECT
    category,
    GROUP_CONCAT(product) AS products
FROM sales
GROUP BY category;
-- 输出列：'笔记本电脑,机械键盘,显示器,无线鼠标,笔记本电脑,机械键盘'

-- 带排序和自定义分隔符
SELECT
    category,
    GROUP_CONCAT(DISTINCT product ORDER BY product ASC SEPARATOR ' | ') AS products
FROM sales
GROUP BY category;
-- 输出列：'机械键盘 | 无线鼠标 | 笔记本电脑 | 显示器'

-- 注意：GROUP_CONCAT 默认最大长度是 1024 字节
-- 查看当前设置
SHOW VARIABLES LIKE 'group_concat_max_len';

-- 临时增大限制
SET SESSION group_concat_max_len = 10240;
```

---

## 15.5 HAVING：分组后过滤

WHERE 在分组**前**过滤行，HAVING 在分组**后**过滤组：

```sql
-- WHERE 先过滤行 → GROUP BY 分组 → HAVING 过滤组
SELECT
    category,
    SUM(amount) AS total_amount,
    COUNT(*) AS order_count
FROM sales
WHERE sale_date >= '2026-01-01'   -- 先过滤：只统计 2026 年以后的数据
GROUP BY category                   -- 再分组
HAVING COUNT(*) >= 3                -- 再过滤：只要订单数 >= 3 的分类
ORDER BY total_amount DESC;         -- 最后排序

-- 执行顺序：
-- FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
```

### WHERE vs HAVING 的关键区别

| 对比维度 | WHERE | HAVING |
|----------|-------|--------|
| **过滤时机** | 分组**前**（对原始行） | 分组**后**（对聚合结果） |
| **能否使用聚合函数** | **不能** | **可以** |
| **能否引用列别名** | **不能** | MySQL 中可以（扩展），标准 SQL 不行 |
| **性能** | 优（减少分组的数据量） | 差（分组后再过滤） |
| **使用场景** | 过滤原始行 | 过滤聚合后的组 |

```sql
-- ❌ WHERE 中不能使用聚合函数
-- SELECT category, SUM(amount) AS total
-- FROM sales
-- WHERE SUM(amount) > 5000  -- 错误！WHERE 中不能用聚合函数
-- GROUP BY category;

-- ✅ 应该用 HAVING
SELECT category, SUM(amount) AS total
FROM sales
GROUP BY category
HAVING SUM(amount) > 5000;

-- ✅ 能放 WHERE 的条件尽量放 WHERE（减小分组的数据量）
-- 好（先过滤再分组）：
SELECT region, SUM(amount) FROM sales
WHERE category = '电子产品'
GROUP BY region;

-- 差（全表分组再过滤）：
SELECT region, SUM(amount) FROM sales
GROUP BY region, category
HAVING category = '电子产品';
```

### HAVING 中使用列别名

```sql
-- MySQL 允许在 HAVING 中使用 SELECT 中定义的别名（这是 MySQL 扩展）
SELECT
    category,
    SUM(amount) AS total_amount
FROM sales
GROUP BY category
HAVING total_amount > 5000;  -- ✅ MySQL 支持（SQL 标准不支持）

-- 标准 SQL 写法：
-- HAVING SUM(amount) > 5000;
```

---

## 15.6 GROUP BY 与 NULL

在 GROUP BY 中，所有 NULL 值被视为相等（属于同一组）：

```sql
-- category 为 NULL 的行被分到同一组
SELECT
    category,
    COUNT(*) AS cnt
FROM sales
GROUP BY category;

-- 输出会有一行 category 为 NULL 的结果
-- 排序时，NULL 组通常排在最前面（ASC）或最后面（DESC）
```

---

## 15.7 WITH ROLLUP：生成汇总行

WITH ROLLUP 在 GROUP BY 的结果末尾追加汇总行（小计和总计）：

```sql
-- 按 category 和 region 两级分组，并生成汇总
SELECT
    COALESCE(category, '所有分类') AS category,
    COALESCE(region, '所有地区') AS region,
    SUM(amount) AS total_amount,
    COUNT(*) AS order_count
FROM sales
GROUP BY category, region WITH ROLLUP;

-- 输出包含：
-- 1. 各 (category, region) 组合的明细行
-- 2. 每个 category 的小计行（region 列为 NULL）
-- 3. 所有行的总计行（category 和 region 都为 NULL）

-- 输出示例（简化）：
-- +--------------+-----------+---------------+-------------+
-- | category     | region    | total_amount  | order_count |
-- +--------------+-----------+---------------+-------------+
-- | 电子产品      | 华东      |       2527.00 |           2 |
-- | 电子产品      | 华北      |       6398.00 |           2 |
-- | 电子产品      | 华南      |       5999.00 |           1 |
-- | 电子产品      | 所有地区   |      14924.00 |           5 | ← 小计
-- | 图书          | 华东      |         69.00 |           1 |
-- | 图书          | 华北      |         89.00 |           1 |
-- | 图书          | 华南      |        188.00 |           2 |
-- | 图书          | 所有地区   |        346.00 |           4 | ← 小计
-- | 家具          | 华北      |        199.00 |           1 |
-- | 家具          | 华南      |        599.00 |           1 |
-- | 家具          | 所有地区   |        798.00 |           2 | ← 小计
-- | 所有分类       | 所有地区   |      16068.00 |          11 | ← 总计
-- +--------------+-----------+---------------+-------------+
```

### WITH ROLLUP 的识别

```sql
-- 使用 GROUPING() 函数区分汇总行和明细行（MySQL 8.0+）
SELECT
    IF(GROUPING(category), '所有分类', category) AS category,
    IF(GROUPING(region), '所有地区', region) AS region,
    SUM(amount) AS total_amount
FROM sales
GROUP BY category, region WITH ROLLUP;
-- GROUPING(col) 返回 1 表示该列在当前行是一个 ROLLUP 汇总（值为 NULL 是因为汇总）
-- GROUPING(col) 返回 0 表示该列的值是实际数据
```

---

## 常见错误

### 1. 在 WHERE 中使用聚合函数

```sql
-- ❌ 错误
-- SELECT category, SUM(amount) AS total
-- FROM sales
-- WHERE SUM(amount) > 10000  -- WHERE 中不能用聚合函数！
-- GROUP BY category;

-- ✅ 正确：使用 HAVING
SELECT category, SUM(amount) AS total
FROM sales
GROUP BY category
HAVING SUM(amount) > 10000;
```

### 2. 违反 ONLY_FULL_GROUP_BY

```sql
-- ❌ 错误：SELECT 中的列不在 GROUP BY 中，也不是聚合函数参数
-- SELECT category, product, SUM(amount)
-- FROM sales
-- GROUP BY category;

-- ✅ 正确：要么加入 GROUP BY，要么用聚合函数包装，要么用 ANY_VALUE()
SELECT category, GROUP_CONCAT(product) AS products, SUM(amount) AS total
FROM sales
GROUP BY category;
```

### 3. 混淆 WHERE 和 HAVING 的过滤时机

```sql
-- ❌ 业务需求：统计订单数 >= 3 的分类
-- 错误做法：用 WHERE 过滤（但 WHERE 在分组前，无法判断分组后的 COUNT）
-- SELECT category, COUNT(*) FROM sales WHERE COUNT(*) >= 3 GROUP BY category;

-- ✅ 正确：分组后用 HAVING 过滤
SELECT category, COUNT(*) AS cnt
FROM sales
GROUP BY category
HAVING cnt >= 3;
```

### 4. 以为 COUNT(col) 和 COUNT(*) 一样

```sql
-- 两者不同！
SELECT
    COUNT(*) AS count_all,        -- 所有行，包括全 NULL
    COUNT(salesperson) AS count_col -- 只计算 salesperson 非 NULL 的行
FROM sales;
-- count_all 可能大于 count_col（如果有 NULL 值）
```

### 5. 在 GROUP BY 的结果中引用未分组的列

```sql
-- 在应用程序中查询 GROUP BY 结果后，不要假设未分组列的值有意义
-- 如果关闭了 ONLY_FULL_GROUP_BY，未分组的列取的是"不确定"的值
-- 这是 SQL 反模式，可能导致难以调试的 bug
```

---

## 本章练习

1. **基本分组练习**：使用 `sales` 表：
   - 按 region 分组统计销售总额和订单数
   - 按 category 分组统计平均销售额和最高销售额
   - 按 salesperson 分组统计每个人的销售总额，按总额降序排列

2. **HAVING 练习**：
   - 找出销售总额超过 5000 的 product
   - 找出订单数 >= 3 的 salesperson
   - 找出平均销售额超过 1000 的 category

3. **WHERE + HAVING 组合练习**：
   - 统计 2026 年第一季度（1-3月）各 category 的销售总额，只显示总额超过 5000 的分类

4. **ONLY_FULL_GROUP_BY 验证练习**：
   - 确认当前 sql_mode 包含 ONLY_FULL_GROUP_BY
   - 尝试写一个违反规则的分组查询，观察报错信息
   - 修正该查询使其符合标准

5. **WITH ROLLUP 练习**：
   - 对 sales 表按 category, region 分组统计，添加 WITH ROLLUP
   - 使用 COALESCE 或 GROUPING() 将汇总行的 NULL 替换为有意义的文字

6. **聚合函数深入练习**：
   - 向 sales 表插入包含 NULL 值（amount, region, salesperson 等）的行
   - 分别用 COUNT(*), COUNT(amount), COUNT(DISTINCT region) 统计，理解差异
   - 测试 SUM 和 AVG 遇到 NULL 的行为
