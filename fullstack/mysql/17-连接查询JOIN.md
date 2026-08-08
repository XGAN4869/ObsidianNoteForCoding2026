# 第17章：连接查询 JOIN

## 本章目标
学完本章后，你将能够：
1. 理解笛卡尔积（交叉连接）及其对 JOIN 的影响
2. 掌握 INNER JOIN、LEFT JOIN、RIGHT JOIN、CROSS JOIN 的使用
3. 理解 LEFT JOIN 中 ON 和 WHERE 过滤的微妙区别
4. 编写包含 3 张表以上的多表 JOIN 查询
5. 使用 SELF JOIN 处理自引用数据
6. 避免 NATURAL JOIN 等危险写法

## 前置知识
- 第12章：查询基础 SELECT
- 第13章：WHERE 条件过滤
- 第15章：GROUP BY 与 HAVING（JOIN 后常配合分组）

---

## 17.1 JOIN 是什么

实际业务中，数据往往分散在多张表中。例如：
- `customers` 表存客户信息
- `orders` 表存订单信息（关联到客户）
- `order_items` 表存订单明细（关联到订单）
- `products` 表存商品信息（关联到明细）

JOIN 的作用就是**根据相关列将多张表中的数据组合成一张结果集**。

### 准备测试数据

```sql
-- 客户表
CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    vip_level ENUM('普通', '银卡', '金卡', '钻石') DEFAULT '普通'
);

INSERT INTO customers VALUES
(1, '张三', '北京', '金卡'),
(2, '李四', '上海', '普通'),
(3, '王五', '广州', '银卡'),
(4, '赵六', '深圳', '普通'),
(5, '孙七', '北京', '钻石');

-- 订单表
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20)
);

INSERT INTO orders VALUES
(101, 1, '2026-06-01', 299.00, '已完成'),
(102, 1, '2026-06-15', 599.00, '已完成'),
(103, 2, '2026-06-20', 199.00, '待发货'),
(104, 3, '2026-07-01', 899.00, '已完成'),
(105, 3, '2026-07-05', 399.00, '已取消'),
(106, 1, '2026-07-08', 1299.00, '待付款'),
(107, NULL, '2026-07-09', 99.00, '待付款'); -- 异常数据：没有对应客户
```

---

## 17.2 笛卡尔积（Cartesian Product）

在没有 JOIN 条件时，每张表中的每一行都会与另一张表的每一行组合，产生 M x N 行的结果：

```sql
-- 没有 ON 条件的 CROSS JOIN：产生笛卡尔积
SELECT c.name, o.id AS order_id, o.total_amount
FROM customers c
CROSS JOIN orders o;
-- customers 5 行 x orders 7 行 = 35 行！
```

### CROSS JOIN 的使用场景

```sql
-- 场景1：生成数字序列
SELECT ones.n + tens.n * 10 AS number
FROM
    (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones
CROSS JOIN
    (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens
ORDER BY number;
-- 生成 0-99 的序列

-- 场景2：生成日期范围
SELECT DATE_ADD('2026-01-01', INTERVAL seq DAY) AS date
FROM (SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 ...) AS numbers
WHERE DATE_ADD('2026-01-01', INTERVAL seq DAY) <= '2026-01-10';
```

---

## 17.3 INNER JOIN（内连接）

INNER JOIN 返回两个表中**满足连接条件的行**。如果某行在任意一边没有匹配，它不会出现在结果中：

```sql
-- INNER JOIN 基本语法
SELECT
    c.name AS customer_name,
    o.id AS order_id,
    o.total_amount,
    o.status
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;

-- INNER 关键字是可选的，JOIN 默认就是 INNER JOIN
SELECT c.name, o.id, o.total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id;
```

### INNER JOIN 的视觉理解

```
customers (5 rows)          orders (7 rows)
┌────┬──────┐              ┌─────┬─────────────┐
│ id │ name │              │ id  │ customer_id │
├────┼──────┤              ├─────┼─────────────┤
│ 1  │ 张三 │──────────────│ 101 │     1       │
│ 1  │ 张三 │──────────────│ 102 │     1       │
│ 1  │ 张三 │──────────────│ 106 │     1       │
│ 2  │ 李四 │──────────────│ 103 │     2       │
│ 3  │ 王五 │──────────────│ 104 │     3       │
│ 3  │ 王五 │──────────────│ 105 │     3       │
│ 4  │ 赵六 │    ✗无匹配    │     │             │
│ 5  │ 孙七 │    ✗无匹配    │     │             │
│    │      │              │ 107 │    NULL     │ ← customer_id 为 NULL，不匹配
└────┴──────┘              └─────┴─────────────┘

结果：6 行（赵六、孙七、order#107 不出现在结果中）
```

```sql
-- 验证
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name;
-- 赵六和孙七不会出现在结果中（他们的订单数为 0，被 INNER JOIN 过滤了）
```

### INNER JOIN 带额外条件

```sql
-- 在 ON 中添加额外过滤条件
SELECT c.name, o.id, o.total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id AND o.status = '已完成';

-- 等价于在 WHERE 中过滤
SELECT c.name, o.id, o.total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = '已完成';
-- 对于 INNER JOIN，ON 中的过滤条件和 WHERE 中的过滤条件效果相同
```

---

## 17.4 LEFT JOIN（左外连接）

LEFT JOIN 返回**左表中的所有行**，即使它们在右表中没有匹配。没有匹配的右表列填充为 NULL：

```sql
-- LEFT JOIN 语法
SELECT
    c.name AS customer_name,
    o.id AS order_id,
    o.total_amount,
    o.status
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;
```

### LEFT JOIN 的视觉理解

```
customers (左表)              orders (右表)
┌────┬──────┐              ┌─────┬─────────────┐
│ id │ name │              │ id  │ customer_id │
├────┼──────┤              ├─────┼─────────────┤
│ 1  │ 张三 │──────────────│ 101 │     1       │  匹配，合并
│ 1  │ 张三 │──────────────│ 102 │     1       │  匹配，合并
│ 1  │ 张三 │──────────────│ 106 │     1       │  匹配，合并
│ 2  │ 李四 │──────────────│ 103 │     2       │  匹配，合并
│ 3  │ 王五 │──────────────│ 104 │     3       │  匹配，合并
│ 3  │ 王五 │──────────────│ 105 │     3       │  匹配，合并
│ 4  │ 赵六 │──────────────│ NULL│    NULL     │  保留赵六，右表列填 NULL
│ 5  │ 孙七 │──────────────│ NULL│    NULL     │  保留孙七，右表列填 NULL
└────┴──────┘              └─────┴─────────────┘

结果：8 行。赵六和孙七保留，order 列全为 NULL
      order#107（customer_id=NULL）不匹配任何客户，被丢弃
```

### LEFT JOIN 实战：查找没有订单的客户

```sql
-- LEFT JOIN + IS NULL 是查找"无匹配"记录的经典模式
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- 输出：赵六、孙七（没有订单的客户）
```

### LEFT JOIN 中 ON 和 WHERE 的关键区别（极其重要！）

这是 JOIN 使用中最常见的陷阱：

```sql
-- == 场景 A：过滤条件放在 ON 中 ==
-- 影响 JOIN 的匹配过程，但保留左表所有行
SELECT c.name, o.id AS order_id, o.status
FROM customers c
LEFT JOIN orders o
    ON c.id = o.customer_id
    AND o.status = '已完成';  -- ← 条件在 ON 中！

-- 结果：每个客户都出现至少一次
-- 赵六、孙七也会出现（因为他们没有匹配的订单，左表行保留）
-- 对于张三的 3 个订单，只匹配 status='已完成' 的（2个），待付款的那个不匹配

-- == 场景 B：过滤条件放在 WHERE 中 ==
-- 条件在 WHERE 中，对 JOIN 后的整体结果进行过滤
SELECT c.name, o.id AS order_id, o.status
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.status = '已完成';  -- ← 条件在 WHERE 中！

-- 结果：赵六、孙七消失了！（因为他们的 o.status 是 NULL，IS NULL ≠ '已完成'）
-- 这实际上把 LEFT JOIN 变成了 INNER JOIN！
```

```sql
-- 总结：
-- LEFT JOIN 中：
--   ON 中的条件：影响"右表哪些行参与匹配"（左表行始终保留）
--   WHERE 中的条件：对 JOIN 后的整体结果集过滤
--
-- 对右表的过滤放在 WHERE 中 → LEFT JOIN 变 INNER JOIN
-- 对右表的过滤放在 ON 中 → 保留左表行，只是不匹配的右表行变 NULL
```

### LEFT JOIN 中的执行顺序

```
LEFT JOIN 的执行逻辑：

1. 从左表读取一行
2. 去右表找匹配的行（使用 ON 条件）
3. 如果找到 → 将这行与匹配的右表行合并
4. 如果没找到 → 将这行与 NULL（右表全是 NULL）合并
5. 返回结果（如果使用 WHERE，此时再过滤）
```

---

## 17.5 RIGHT JOIN（右外连接）

RIGHT JOIN 与 LEFT JOIN 镜像对称：保留右表的所有行：

```sql
-- RIGHT JOIN：保留 orders 表中的所有行，包括那些没有匹配客户的
SELECT c.name, o.id AS order_id, o.total_amount
FROM customers c
RIGHT JOIN orders o ON c.id = o.customer_id;

-- 结果：order#107 会出现（customer_id 为 NULL，name 列为 NULL）
-- 但赵六、孙七不会出现（他们是客户但没有订单，在 right table 中没有对应行）
```

> **实际建议**：RIGHT JOIN 在实际开发中极少使用。任何 RIGHT JOIN 都可以改写为 LEFT JOIN（交换表的顺序即可）。统一使用 LEFT JOIN 可以减少混淆。

---

## 17.6 FULL OUTER JOIN（全外连接）

MySQL 不直接支持 FULL OUTER JOIN，但可以通过 UNION 模拟：

```sql
-- FULL OUTER JOIN = LEFT JOIN + RIGHT JOIN（去重）
SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id

UNION  -- UNION 自动去重

SELECT c.name, o.id AS order_id
FROM customers c
RIGHT JOIN orders o ON c.id = o.customer_id;

-- 结果包含：
-- 1. 所有有订单的客户（LEFT JOIN 部分）
-- 2. 没有订单的客户（LEFT JOIN 部分）
-- 3. 没有客户的孤儿订单（RIGHT JOIN 部分）
```

---

## 17.7 SELF JOIN（自连接）

自连接是将一张表与其自身进行 JOIN，必须使用不同的别名来区分：

```sql
-- 准备数据：员工表（含上级关系）
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    manager_id INT,
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

INSERT INTO employees VALUES
(1, '张总', NULL),       -- 最高领导，没有上级
(2, '李经理', 1),        -- 上级是张总
(3, '王经理', 1),        -- 上级是张总
(4, '赵主管', 2),        -- 上级是李经理
(5, '孙员工', 4),        -- 上级是赵主管
(6, '周员工', 4);        -- 上级是赵主管
```

```sql
-- 自连接：查询每个员工及其上级的名字
SELECT
    e.name AS employee_name,
    m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- 输出：
-- +---------------+---------------+
-- | employee_name | manager_name  |
-- +---------------+---------------+
-- | 张总          | NULL          |
-- | 李经理         | 张总          |
-- | 王经理         | 张总          |
-- | 赵主管         | 李经理         |
-- | 孙员工         | 赵主管         |
-- | 周员工         | 赵主管         |
-- +---------------+---------------+
```

---

## 17.8 多表 JOIN（3 张表以上）

```sql
-- 准备订单明细表
CREATE TABLE order_items (
    id INT PRIMARY KEY,
    order_id INT,
    product_name VARCHAR(100),
    quantity INT,
    unit_price DECIMAL(10,2)
);

INSERT INTO order_items VALUES
(1001, 101, '机械键盘', 1, 299.00),
(1002, 102, '无线鼠标', 2, 199.50),
(1003, 102, '鼠标垫', 1, 29.00),
(1004, 103, 'Python编程书', 1, 199.00),
(1005, 104, '显示器', 1, 899.00),
(1006, 106, '笔记本电脑', 1, 1299.00);

-- 三表 JOIN：客户 → 订单 → 订单明细
SELECT
    c.name AS customer,
    o.id AS order_id,
    o.order_date,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * oi.unit_price) AS line_total
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
ORDER BY c.name, o.id;
```

### 多表 JOIN 的执行过程

```sql
-- 查询的渐进构建（从内到外依次 JOIN）：

-- 第 1 步：customers JOIN orders
--    → 6 行（有订单的客户 x 订单）

-- 第 2 步：上一步结果 JOIN order_items
--    → 6 行（因为每个订单都有明细）

-- 如果某一步使用了 LEFT JOIN，未匹配的行会保留（填充 NULL）
```

### JOIN 顺序和性能

```sql
-- 一般来说，JOIN 的顺序会影响性能（取决于优化器）
-- MySQL 优化器会自动选择它认为最优的 JOIN 顺序
-- 但在某些复杂查询中，可以用 STRAIGHT_JOIN 强制 JOIN 顺序

-- 强制 JOIN 顺序
SELECT STRAIGHT_JOIN
    c.name, o.id
FROM customers c
JOIN orders o ON c.id = o.customer_id;
-- STRAIGHT_JOIN 告诉优化器：严格按照我写的顺序 JOIN，不要重新排列

-- 提示：尽量不要使用 STRAIGHT_JOIN，除非你确认优化器选错了顺序
```

---

## 17.9 NATURAL JOIN 和 USING

### NATURAL JOIN（危险，避免使用）

NATURAL JOIN 自动以**两表中所有同名列**作为连接条件：

```sql
-- NATURAL JOIN：自动匹配同名同类型列
-- SELECT * FROM customers NATURAL JOIN orders;
-- 如果 customers 和 orders 都有 id 列，它会用 id=id 来 JOIN
-- 但这通常不是我们想要的！非常危险！

-- 更糟的是：如果表结构变化（加了同名列），NATURAL JOIN 的行为会静默改变
-- 强烈建议：永远不要在生产代码中使用 NATURAL JOIN
```

### USING（比 ON 更简洁，但有陷阱）

```sql
-- USING 用于两表有相同连接列名的情况
SELECT c.name, o.id, o.total_amount
FROM customers c
JOIN orders o USING (customer_id);
-- 等价于 ON c.customer_id = o.customer_id
-- 但注意：USING 会使结果中的连接列只出现一次

-- USING 与 ON 的细微差异：
-- 1. USING(col) 中，col 在结果集中只出现一次
-- 2. ON c.col = o.col 中，col 会出现两次
-- 3. 在 USING 的列上不能使用表前缀（如 c.customer_id）
```

---

## 17.10 JOIN 的常见模式

### 查找存在关系的记录（Semi-Join）

```sql
-- 查找"有订单的客户"
-- 方式1：JOIN + DISTINCT
SELECT DISTINCT c.* FROM customers c JOIN orders o ON c.id = o.customer_id;

-- 方式2：EXISTS（通常性能更好，详见第 18 章）
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

### 查找不存在关系的记录（Anti-Join）

```sql
-- 查找"没有订单的客户"
-- 方式1：LEFT JOIN + IS NULL
SELECT c.* FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- 方式2：NOT EXISTS（安全，推荐）
SELECT * FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- 方式3：NOT IN（有 NULL 陷阱！不推荐）
-- SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

### 查找重复/关联数据

```sql
-- 查找下了多笔订单的客户
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 1;
```

---

## 常见错误

### 1. LEFT JOIN 后在 WHERE 中过滤右表列

```sql
-- ❌ 这会把 LEFT JOIN 变成 INNER JOIN！
SELECT c.*, o.*
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.status = '已完成';
-- 没有订单的客户（o.status 为 NULL）被过滤掉了！

-- ✅ 如果想保留所有客户，把条件放在 ON 中
SELECT c.*, o.*
FROM customers c
LEFT JOIN orders o
    ON c.id = o.customer_id AND o.status = '已完成';
```

### 2. 忘记 ON 条件导致笛卡尔积

```sql
-- ❌ 灾难：5 个客户 x 7 个订单 = 35 行垃圾数据
-- SELECT c.name, o.id
-- FROM customers c
-- JOIN orders o;
-- 缺少 ON 条件！

-- ✅ 每个 JOIN 都必须有 ON 条件
SELECT c.name, o.id
FROM customers c
JOIN orders o ON c.id = o.customer_id;
```

### 3. JOIN 时列名歧义

```sql
-- ❌ 如果两表都有 id 列，不加表名会产生歧义
-- SELECT id, name FROM customers JOIN orders ON ...
-- ERROR 1052: Column 'id' in field list is ambiguous

-- ✅ 始终用表别名限定列名
SELECT c.id, c.name FROM customers c JOIN orders o ON c.id = o.customer_id;
```

### 4. 多表 JOIN 时重复行

```sql
-- 如果一个订单有多条明细，JOIN orders 和 order_items 后
-- orders 的列（如 total_amount）会在每条明细行中重复
-- 如果此时再 SUM(total_amount)，会重复计算！
-- 解决：SUM 之前去重，或使用不同粒度的子查询
```

### 5. 使用 NATURAL JOIN

```sql
-- ❌ NATURAL JOIN 自动匹配所有同名列，表结构变化时行为静默改变
-- SELECT * FROM t1 NATURAL JOIN t2;

-- ✅ 始终显式指定 ON 条件
SELECT * FROM t1 JOIN t2 ON t1.id = t2.t1_id;
```

---

## 本章练习

1. **INNER JOIN 练习**：查询所有订单的完整信息（客户名、订单日期、金额、状态）。注意观察哪些客户没有出现在结果中。

2. **LEFT JOIN 练习**：
   - 查询所有客户及其订单信息，包括没有订单的客户
   - 查询没有任何订单的客户（LEFT JOIN + IS NULL 模式）

3. **ON vs WHERE 对比练习**（重要）：
   - 用 LEFT JOIN，将 `o.status = '已完成'` 放在 ON 子句中
   - 用 LEFT JOIN，将 `o.status = '已完成'` 放在 WHERE 子句中
   - 比较两次查询的结果，特别是没有订单的客户是否出现，理解差异

4. **三表 JOIN 练习**：关联 customers、orders、order_items 三张表，查询每个客户的所有订单明细（产品名、数量、单价）。注意观察哪些行会出现多次（因为一个订单可能有多个明细）。

5. **SELF JOIN 练习**：在 employees 表上使用自连接，查询每个员工的姓名、职位级别（通过 manager_id 的深度判断）、以及直属上级的姓名。

6. **FULL OUTER JOIN 模拟练习**：使用 LEFT JOIN + UNION + RIGHT JOIN 模拟 FULL OUTER JOIN，获取所有客户和所有订单的完整视图（包括没有客户的孤儿订单和没有订单的客户）。
