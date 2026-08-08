# 附录C SQL 风格指南

## 概述

一致的 SQL 编码风格对于代码可读性、可维护性和团队协作至关重要。SQL 不像 Python (PEP8) 或 Java (Google Java Style) 那样有"唯一标准"的风格指南，不同的团队和开源项目有不同的约定。

本指南综合了多个知名项目（如 GitLab SQL Guide、Mozilla SQL Style Guide、SQL Style Guide by Simon Holywell）的最佳实践，提供一套清晰、实用的建议。

## C.1 命名规范

### C.1.1 表名和列名

```sql
-- 推荐：蛇形命名法 (snake_case)
CREATE TABLE order_items (
  id INT UNSIGNED PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 不推荐：驼峰命名法 (camelCase/PascalCase)
-- CREATE TABLE OrderItems (
--   Id INT,
--   OrderId INT,
--   ProductName VARCHAR(100)
-- );

-- 不推荐：匈牙利命名法
-- CREATE TABLE tbl_order_items (
--   int_id INT,
--   int_order_id INT,
--   str_product_name VARCHAR(100)
-- );
```

**表名约定**：
- 使用复数形式还是单数形式？**选定一个并保持全库一致**
- 推荐：`users`, `orders`, `products`（复数，因为表是记录的集合）
- 备选：`user`, `order`, `product`（单数，因为每行代表一个实体）
- 关联表（多对多）：`user_roles`, `order_products`（两个实体名拼接，按字母顺序）

### C.1.2 索引名

```sql
-- 主键：PK_表名 或 直接 PRIMARY KEY
CONSTRAINT pk_users PRIMARY KEY (id)          -- 明确命名
-- 或直接 PRIMARY KEY (id)                    -- 简洁（MySQL 自动命名为 PRIMARY）

-- 普通索引：idx_表名缩写_列名
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
-- 格式：idx_{table}_{column1}_{column2}...

-- 唯一索引：uk_表名缩写_列名
CREATE UNIQUE INDEX uk_users_email ON users(email);
CREATE UNIQUE INDEX uk_users_username ON users(username);
-- 格式：uk_{table}_{column}

-- 外键：fk_表名_引用表名
CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);
CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id);
-- 格式：fk_{child_table}_{parent_table}
```

### C.1.3 别名

```sql
-- 推荐：有意义的缩写
SELECT o.order_no, u.name AS user_name
FROM orders o
JOIN users u ON o.user_id = u.id;

-- 不推荐：无意义的单字母（多表时）
-- SELECT a.order_no, b.name
-- FROM orders a
-- JOIN users b ON a.user_id = b.id;

-- 更推荐：使用表名的简短缩写
SELECT ord.order_no, usr.name
FROM orders ord
JOIN users usr ON ord.user_id = usr.id;

-- 在使用多个派生表时，使用描述性别名
SELECT latest_orders.*
FROM (
  SELECT user_id, MAX(created_at) AS last_order_date
  FROM orders
  GROUP BY user_id
) AS latest_orders;
```

---

## C.2 关键字与格式化

### C.2.1 关键字大小写

```sql
-- 推荐：SQL 关键字大写
SELECT o.id, o.order_no, u.name AS customer_name
FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE o.status = 'paid'
  AND o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 备选：全部小写（部分团队偏好）
-- select o.id, o.order_no, u.name as customer_name
-- from orders o
-- inner join users u on o.user_id = u.id
-- where o.status = 'paid'
--   and o.created_at >= '2024-01-01'
-- order by o.created_at desc
-- limit 20;
```

**建议**：大写关键字更醒目，小写关键字更易输入。选择一种并**全项目保持一致**。本指南使用大写风格。

### C.2.2 缩进与换行

```sql
-- 推荐：每个主要子句独立一行
SELECT id, name, email
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- 列多时：每列一行（缩进 2-4 空格）
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.created_at,
  o.order_count,
  o.total_amount
FROM users u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_amount
  FROM orders
  WHERE status != 'cancelled'
  GROUP BY user_id
) AS o ON u.id = o.user_id
WHERE u.status = 'active'
  AND u.created_at >= '2023-01-01'
ORDER BY o.total_amount DESC NULLS LAST
LIMIT 100;

-- JOIN 条件缩进
SELECT *
FROM orders o
  INNER JOIN users u
    ON o.user_id = u.id
  LEFT JOIN order_items oi
    ON o.id = oi.order_id
WHERE o.status = 'paid';
```

### C.2.3 逗号位置

**方案 A：尾随逗号（推荐）**

```sql
SELECT
  id,
  name,
  email,
  phone,
  created_at    -- 最后一列没有逗号
FROM users
WHERE
  status = 'active'
  AND created_at >= '2024-01-01'
  AND email IS NOT NULL;
```

**方案 B：前置逗号**

```sql
SELECT
  id
  , name
  , email
  , phone
  , created_at
FROM users
WHERE
  status = 'active'
  AND created_at >= '2024-01-01'
  AND email IS NOT NULL;
```

**建议**：前置逗号方便增删行（最后一行的逗号不会丢），但不够直观。尾随逗号更直观。选定一种并保持一致。

### C.2.4 JOIN 的显式写法

```sql
-- 推荐：始终使用显式 JOIN（ANSI SQL 92 风格）
SELECT u.name, o.order_no
FROM users u
JOIN orders o ON u.id = o.user_id;

-- 不推荐：隐式 JOIN（逗号连接，ANSI SQL 89 风格）
-- SELECT u.name, o.order_no
-- FROM users u, orders o
-- WHERE u.id = o.user_id;
-- 问题：容易遗漏 WHERE 条件而产生笛卡尔积；JOIN 条件和 WHERE 条件混在一起

-- 始终将 JOIN 条件放在 ON 中，WHERE 用于过滤
SELECT u.name, o.order_no, o.total_amount
FROM users u
JOIN orders o ON u.id = o.user_id     -- JOIN 条件
WHERE o.total_amount > 100             -- 过滤条件
  AND u.status = 'active';
```

---

## C.3 SQL 编写最佳实践

### C.3.1 永远不要使用 SELECT *

```sql
-- 不推荐
SELECT * FROM users WHERE id = 1;

-- 推荐：显式列出需要的列
SELECT id, name, email, status FROM users WHERE id = 1;

-- 原因：
-- 1. 无法使用覆盖索引(必须回表)
-- 2. 表新增列会影响现有查询(可能触发意外的列名冲突)
-- 3. 传输不必要的数据
-- 4. 代码阅读者需要查表结构才知道返回了哪些列
```

### C.3.2 使用表别名

```sql
-- 在多表查询中始终使用别名
SELECT
  ord.id,
  ord.total_amount,
  usr.name
FROM orders ord
JOIN users usr ON ord.user_id = usr.id;
```

### C.3.3 使用 COALESCE / IFNULL 处理 NULL

```sql
-- 不推荐：在应用层处理 NULL
SELECT name, phone FROM users;

-- 推荐：在 SQL 中提供默认值
SELECT
  name,
  COALESCE(phone, '未提供') AS phone,
  COALESCE(address, '未知地址') AS address
FROM users;
-- COALESCE 是标准 SQL，IFNULL 是 MySQL 特有
```

### C.3.4 避免不必要的 DISTINCT

```sql
-- 不推荐：不必要的去重
SELECT DISTINCT u.name
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id = 123;

-- 推荐：去掉不必要的 DISTINCT（u.id=123 的用户名本身就唯一）
SELECT u.name
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id = 123;
```

### C.3.5 批量操作使用 LIMIT

```sql
-- 不推荐：一次性删除大量数据(大事务、大量锁、从库延迟)
-- DELETE FROM logs WHERE created_at < '2023-01-01';

-- 推荐：分批删除
DELETE FROM logs WHERE created_at < '2023-01-01' LIMIT 1000;
-- 循环执行直到 affected_rows = 0
```

### C.3.6 字符串使用单引号

```sql
-- 推荐：字符串使用单引号
SELECT * FROM users WHERE name = 'John';

-- 避免：双引号在 MySQL ANSI_QUOTES 模式下被当作标识符引用
-- SELECT * FROM users WHERE name = "John";

-- 别名可以使用双引号或反引号
SELECT name AS "User Name" FROM users;
SELECT name AS `User Name` FROM users;
```

---

## C.4 注释与文档

### C.4.1 行内注释

```sql
-- 单行注释：解释复杂的过滤逻辑
SELECT * FROM orders
WHERE status = 'pending'
  AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)  -- 超过 24 小时未支付的订单
  AND payment_method IS NOT NULL;
```

### C.4.2 块注释

```sql
/*
 * 功能：获取用户最近 30 天的消费统计
 * 参数：无
 * 返回：user_id, user_name, order_count, total_amount
 * 作者：张三
 * 日期：2024-01-15
 */
SELECT
  u.id AS user_id,
  u.name AS user_name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total_amount), 0) AS total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
  AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND o.status != 'cancelled'
WHERE u.status = 'active'
GROUP BY u.id, u.name
ORDER BY total_amount DESC;
```

### C.4.3 存储过程/函数头注释

```sql
DELIMITER //

/*
 * sp_order_cleanup: 清理过期订单
 *
 * 参数:
 *   p_days_to_keep: 保留天数，超过此天数的订单将被清理
 *   p_batch_size: 每批删除的行数（避免大事务）
 *
 * 返回:
 *   0: 成功
 *   1: 参数错误
 *
 * 示例:
 *   CALL sp_order_cleanup(90, 1000);
 */
CREATE PROCEDURE sp_order_cleanup(
  IN p_days_to_keep INT,
  IN p_batch_size INT
)
BEGIN
  -- 存储过程体
END //

DELIMITER ;
```

---

## C.5 DDL 风格

### C.5.1 CREATE TABLE 模板

```sql
-- 推荐的建表风格
CREATE TABLE order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  order_id INT UNSIGNED NOT NULL COMMENT '订单ID',
  product_id INT UNSIGNED NOT NULL COMMENT '商品ID',
  product_name VARCHAR(200) NOT NULL COMMENT '商品名称快照',
  product_price DECIMAL(10,2) NOT NULL COMMENT '商品单价快照',
  quantity INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '数量',
  subtotal DECIMAL(12,2) NOT NULL COMMENT '小计(price * quantity)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  -- 主键
  PRIMARY KEY (id),

  -- 索引
  KEY idx_order_id (order_id),
  KEY idx_product_id (product_id),

  -- 外键
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';
```

### C.5.2 列定义规范

```sql
-- 列定义的推荐顺序：
-- 1. 列名
-- 2. 数据类型
-- 3. UNSIGNED（如果适用）
-- 4. NOT NULL / NULL
-- 5. DEFAULT 值
-- 6. AUTO_INCREMENT（如果适用）
-- 7. COMMENT

-- 不推荐：
-- name varchar(100) not null default ''   -- 类型大小写不统一

-- 推荐：
-- name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '用户姓名'
```

---

## C.6 文件与版本管理

### C.6.1 文件组织

```
database/
├── migrations/
│   ├── V001__create_users_table.sql
│   ├── V002__create_orders_table.sql
│   ├── V003__add_order_index.sql
│   └── V004__create_order_items_table.sql
├── procedures/
│   ├── sp_order_cleanup.sql
│   └── sp_generate_report.sql
├── seeds/
│   ├── seed_categories.sql
│   └── seed_products.sql
├── test_data/
│   └── generate_test_data.sql
└── README.md
```

### C.6.2 版本管理建议

1. **所有 SQL 文件必须纳入版本控制（Git）**
2. **使用迁移工具**：Flyway、Liquibase、gh-ost 等
3. **命名规范**：V{序号}__{描述}.sql（Flyway 风格）
4. **每个文件只包含一个逻辑变更**
5. **迁移文件不可修改**（已有编号的文件内容不能变，只能新增文件）
6. **包含回滚脚本**：U{序号}__{描述}.sql

---

## C.7 示例：一个格式良好的查询

```sql
/*
 * 查询：各部门的销售排行榜
 * 
 * 说明：按部门统计每位销售人员的月度业绩，
 *       仅统计已完成的订单，展示 Top 3。
 * 
 * 数据范围：当前月份
 */

-- 使用 CTE 先计算月度销售数据
WITH monthly_sales AS (
  SELECT
    e.id AS employee_id,
    e.name AS employee_name,
    d.id AS dept_id,
    d.name AS dept_name,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.actual_amount), 0) AS total_sales
  FROM employees e
    JOIN departments d
      ON e.dept_id = d.id
    LEFT JOIN orders o
      ON e.id = o.salesperson_id
      AND o.status = 'delivered'
      AND o.delivered_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND o.delivered_at < DATE_ADD(
        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
        INTERVAL 1 MONTH
      )
  WHERE e.status = 'active'
    AND e.role = 'sales'
  GROUP BY e.id, e.name, d.id, d.name
),
-- 在 CTE 基础上使用窗口函数排名
ranked_sales AS (
  SELECT
    employee_name,
    dept_name,
    order_count,
    total_sales,
    RANK() OVER (
      PARTITION BY dept_id
      ORDER BY total_sales DESC
    ) AS rank_in_dept
  FROM monthly_sales
)
-- 每个部门只取 Top 3
SELECT
  dept_name AS '部门',
  rank_in_dept AS '排名',
  employee_name AS '销售人员',
  order_count AS '订单数',
  total_sales AS '销售额'
FROM ranked_sales
WHERE rank_in_dept <= 3
ORDER BY
  dept_name ASC,
  rank_in_dept ASC;
```

---

## 常见错误

### 错误 1：SQL 关键字全部小写且无缩进

```
问题：SELECT u.id,u.name,o.total FROM users u JOIN orders o ON u.id=o.user_id 
      WHERE o.status='paid' AND u.created_at>'2024-01-01' ORDER BY o.created_at DESC LIMIT 10

问题分析：可读性极差，难以排查错误，难以评审。

改进：至少将每个子句换行、关键字大写。
```

### 错误 2：滥用反引号

```
问题：SELECT `id`, `name`, `email` FROM `users` WHERE `status` = 'active';

分析：在不需要的时候使用反引号（所有列名都不是保留字），降低了可读性。

建议：仅在列名/表名是保留字或包含特殊字符时使用反引号。
```

### 错误 3：注释过时或误导

```
问题：代码中保留了错误的注释，与实际 SQL 逻辑不符。

建议：
  - 修改 SQL 时同步更新注释
  - 注释应该说明"为什么"而不是"是什么"（代码本身说明了"是什么"）
  - 使用版本控制，不要在 SQL 代码中保留大段注释掉的旧代码
```

### 错误 4：不一致的命名风格

```
问题：一个项目中混用 snake_case 和 camelCase，
     orders 表有的名称使用 order_items 有的使用 OrderDetails。

建议：在项目初期确定命名规范并严格执行。
     可以使用 SQL linter 工具（如 sqlfluff）自动检查。
```

---

## 本章练习

### 练习 1：代码格式化

将以下"丑陋"的 SQL 按照本指南的规范重新格式化：

```sql
select a.id,a.name,b.total,b.status from (select id,name from users where status=1) a left join (select user_id,sum(amount) as total,status from orders group by user_id,status having sum(amount)>1000) b on a.id=b.user_id where b.status='paid' order by b.total desc limit 10;
```

### 练习 2：风格评审

找一段生产代码中的 SQL（约 5-10 条），按照本指南进行风格评审，输出：
1. 不符合规范的地方
2. 修改建议
3. 修改后的 SQL

### 练习 3：制定团队风格指南

为你的团队定制一份 SQL 风格指南（参考本附录），需要包含：
1. 命名规范（表、列、索引、外键）
2. 格式化规范（大小写、缩进、空行、逗号）
3. 注释规范
4. DDL 模板
5. 反模式列表（禁止使用的写法）
