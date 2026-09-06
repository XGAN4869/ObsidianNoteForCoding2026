# 第10章：更新数据 UPDATE

## 本章目标
学完本章后，你将能够：
1. 掌握 UPDATE 的基本语法和 WHERE 条件过滤
2. 使用表达式和对其他列的引用来更新数据
3. 编写多表关联的 UPDATE 语句（JOIN UPDATE）
4. 理解 LIMIT 和 ORDER BY 在 UPDATE 中的应用
5. 认识 `sql_safe_updates` 模式及其保护作用
6. 区分"匹配行数"和"实际修改行数"的差异

## 前置知识
- 第9章：插入数据 INSERT（理解表结构和数据）
- 第13章：WHERE 条件过滤（UPDATE 大量依赖 WHERE 子句）
- 第17章：连接查询 JOIN（理解多表 UPDATE）

---

## 10.1 UPDATE 基本语法

UPDATE 语句用于修改表中已存在的行。语法结构如下：

```sql
UPDATE 表名
SET 列1 = 值1, 列2 = 值2, ...
[WHERE 条件]
[ORDER BY ...]
[LIMIT 行数];
```

### 最简单的 UPDATE

```sql
-- 准备测试数据
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    department VARCHAR(50),
    title VARCHAR(50),
    active TINYINT(1) DEFAULT 1
);

INSERT INTO employees (name, salary, department, title) VALUES
('张三', 8000.00, '技术部', '工程师'),
('李四', 9000.00, '技术部', '高级工程师'),
('王五', 7000.00, '市场部', '市场专员'),
('赵六', 12000.00, '技术部', '架构师'),
('孙七', 7500.00, '市场部', '市场专员');

-- 给张三加薪 1000
UPDATE employees
SET salary = salary + 1000
WHERE name = '张三';

SELECT name, salary FROM employees WHERE name = '张三';
-- +--------+----------+
-- | name   | salary   |
-- +--------+----------+
-- | 张三   |  9000.00 |
-- +--------+----------+
```

---

## 10.2 没有 WHERE 的 UPDATE —— 更新所有行

**这是最常见的 UPDATE 陷阱**。如果忘记写 WHERE 子句，所有行都会被更新：

```sql
-- ⚠️ 极其危险！给所有人加薪 5000！
-- UPDATE employees SET salary = salary + 5000;

-- 上面的语句没有 WHERE，会更新 employees 表中的每一行！
-- 在执行 UPDATE 之前，务必先用 SELECT 检查要更新的范围：
SELECT id, name, salary FROM employees;
-- 确认无误后，再把 SELECT 改成 UPDATE：

UPDATE employees SET salary = salary + 5000;
-- 这会把所有 5 个人的工资都加上 5000
```

> **铁律**：写 UPDATE 之前，先写 `SELECT * FROM ... WHERE ...` 确认要修改哪些行，然后再把 SELECT 部分替换为 UPDATE。

---

## 10.3 使用表达式更新

SET 子句中可以使用各种表达式，包括对同表其他列的引用：

```sql
-- 重置测试数据
UPDATE employees SET salary = 8000.00 WHERE id = 1;

-- 1. 算术表达式：所有 技术部 员工加薪 10%
UPDATE employees
SET salary = salary * 1.1
WHERE department = '技术部';

-- 查看结果
SELECT name, department, salary FROM employees WHERE department = '技术部';
```

```sql
-- 2. 字符串函数更新
UPDATE employees
SET title = UPPER(title)
WHERE department = '技术部';

-- 3. 引用其他列的值
UPDATE employees
SET title = CONCAT(department, '-', title)
WHERE id = 1;
-- 张三的 title 变成了 "技术部-工程师"
```

```sql
-- 4. 条件表达式更新
UPDATE employees
SET
    salary = CASE
        WHEN salary < 8000 THEN salary * 1.2   -- 低薪涨 20%
        WHEN salary < 10000 THEN salary * 1.1  -- 中薪涨 10%
        ELSE salary * 1.05                      -- 高薪涨 5%
    END;
```

```sql
-- 5. 同时更新多列，引用另一列的新值要小心
-- 下面的例子是安全的：两列互相独立
UPDATE employees
SET
    salary = salary * 1.1,
    title = CONCAT('高级', title);

-- ⚠️ 但要注意：SET 中列与列之间的赋值顺序是不确定的（在 MySQL 中是确定的：从左到右）
-- 在标准 SQL 中，一个 SET 子句中的列不应依赖另一个被同时修改的列
```

---

## 10.4 UPDATE 的返回值解读

执行 UPDATE 后，MySQL 会返回三种行数信息：

```sql
-- 执行更新
UPDATE employees
SET salary = salary + 100
WHERE department = '技术部';

-- MySQL 命令行输出示例：
-- Query OK, 3 rows affected (0.01 sec)
-- Rows matched: 3  Changed: 3  Warnings: 0
```

| 术语 | 含义 |
|------|------|
| **Rows matched** | WHERE 条件匹配到的行数（不论是否实际修改） |
| **Changed** | 实际被修改的行数（新值与旧值不同的行） |
| **Affected rows** | 客户端报告的受影响行数 = Changed 行数（默认） |

```sql
-- 演示：Matched 和 Changed 可能不同
-- 把张三的工资"更新"为相同值
UPDATE employees
SET salary = 9000.00
WHERE name = '张三';
-- Rows matched: 1  Changed: 0  (因为新旧值相同)

-- 设置 CLIENT_FOUND_ROWS 标志可以改变行为
-- 但在实际代码中很少需要这样做
```

### 通过程序获取信息

```php
<?php
// PHP 示例
$mysqli->query("UPDATE employees SET salary = salary * 1.1 WHERE department = '技术部'");
echo "受影响行数: " . $mysqli->affected_rows;            // 实际被改的行数
echo "匹配行数: " . $mysqli->info;                         // "Rows matched: 3  Changed: 2  Warnings: 0"
?>
```

```python
# Python 示例（使用 mysql-connector-python）
cursor.execute(
    "UPDATE employees SET salary = salary * 1.1 WHERE department = '技术部'"
)
print(f"受影响行数: {cursor.rowcount}")  # 实际被改的行数
# mysql_info() 需要调用 cursor._info 或类似 API 获取详细信息
```

---

## 10.5 UPDATE ... LIMIT

LIMIT 子句限制 UPDATE 最多影响的行数，适用于分批更新或只处理"第一条匹配行"的场景：

```sql
-- 只给工资最低的一个人加薪 2000（找出并更新"最低工资"的员工）
UPDATE employees
SET salary = salary + 2000
ORDER BY salary ASC
LIMIT 1;

-- 组合 ORDER BY + LIMIT：实现队列处理
-- 处理最早创建的 5 条待处理记录
UPDATE tasks
SET status = 'processing', started_at = NOW()
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 5;
```

### LIMIT + ORDER BY 的应用场景

```sql
-- 场景1：任务队列（FIFO - 先进先出）
-- 取出最早进入队列的前 10 个任务
UPDATE email_queue
SET status = 'sending', worker_id = 1, started_at = NOW()
WHERE status = 'queued'
ORDER BY created_at ASC
LIMIT 10;

-- 场景2：分批更新大表（避免锁表时间过长）
-- 每次只更新 1000 行，重复执行直到没有行被更新
UPDATE large_logs
SET archived = 1
WHERE archived = 0 AND created_at < '2025-01-01'
LIMIT 1000;

-- 检查是否还有行需要更新，如果有则再次执行
-- 第1次：Rows matched: 1000  Changed: 1000
-- 第2次：Rows matched: 1000  Changed: 1000
-- ...
-- 第N次：Rows matched: 0     Changed: 0  -> 全部完成
```

> **注意**：MySQL 的 UPDATE ... LIMIT 不能带 OFFSET 跳过，这与 SELECT 的 LIMIT offset, count 不同。

### 为什么不直接用 WHERE 全量更新？

```sql
-- ❌ 问题：一次更新 1000 万行可能：
-- 1. 锁住太多行，阻塞其他用户的读写操作
-- 2. 产生巨大的 undo log，回滚段可能耗尽
-- 3. 主从复制产生巨大延迟
-- 4. 事务过长，失败后重做代价大

-- ✅ 分批更新：每次 1000~10000 行
UPDATE huge_table
SET processed = 1
WHERE processed = 0
LIMIT 5000;
-- 重复执行直到 rows affected = 0
```

---

## 10.6 多表 UPDATE（JOIN UPDATE）

MySQL 支持在 UPDATE 中使用 JOIN 来同时更新多张表，或基于另一张表的数据更新当前表：

```sql
-- 准备关联表
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(50),
    budget DECIMAL(12,2),
    bonus_rate DECIMAL(4,3) DEFAULT 0.000
);

INSERT INTO departments (dept_name, budget, bonus_rate) VALUES
('技术部', 500000.00, 0.15),
('市场部', 300000.00, 0.10);
```

### 基于关联表更新一张表

```sql
-- 给每个部门中在该部门的员工加薪，涨幅基于部门的 bonus_rate
UPDATE employees e
JOIN departments d ON e.department = d.dept_name
SET e.salary = e.salary * (1 + d.bonus_rate);

-- 等价写法（使用 INNER JOIN）
-- JOIN 和 INNER JOIN 在 UPDATE 中效果相同
UPDATE employees e
INNER JOIN departments d ON e.department = d.dept_name
SET e.salary = e.salary * (1 + d.bonus_rate);
```

```sql
-- 使用 LEFT JOIN：更新所有员工，没有匹配到部门的也更新
UPDATE employees e
LEFT JOIN departments d ON e.department = d.dept_name
SET
    e.salary = IFNULL(e.salary * (1 + d.bonus_rate), e.salary * 1.05);
-- 有部门的按部门 bonus_rate 涨，没有部门的统一涨 5%
```

### 同时更新多张表

```sql
-- 一次 UPDATE 同时修改两张表（MySQL 支持，但不是 SQL 标准）
UPDATE employees e
JOIN departments d ON e.department = d.dept_name
SET
    e.salary = e.salary * 1.1,
    d.budget = d.budget - e.salary * 0.1;

-- 注意：上面的语句同时更新了 employees 的 salary 和 departments 的 budget
-- 虽然可行，但在实际项目中很少这样用（事务语义不清晰）
```

---

## 10.7 子查询在 UPDATE 中的应用

### 子查询在 SET 中

```sql
-- 将工资设为该部门的平均工资
-- 注意：MySQL 不允许在 UPDATE 的子查询中直接引用正在更新的同一张表
-- 需要用派生表（derived table）包装一层

-- ❌ 错误写法
-- UPDATE employees e
-- SET salary = (SELECT AVG(salary) FROM employees WHERE department = e.department);
-- ERROR 1093 (HY000): You can't specify target table 'e' for update in FROM clause

-- ✅ 正确写法：用派生表绕过限制
UPDATE employees e
JOIN (
    SELECT department, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
) AS dept_avg ON e.department = dept_avg.department
SET e.salary = dept_avg.avg_salary;
```

### 子查询在 WHERE 中

```sql
-- 给工资低于所有员工平均工资的人加薪 20%
UPDATE employees
SET salary = salary * 1.2
WHERE salary < (SELECT AVG(salary) FROM employees);

-- 这里没问题：子查询不包含正在更新的同一张表（MySQL 特定限制）
-- 实际上这个例子中会有同样的问题，需要改写：
UPDATE employees
SET salary = salary * 1.2
WHERE salary < (SELECT avg_sal FROM (SELECT AVG(salary) AS avg_sal FROM employees) AS tmp);
```

### UPDATE 的 VALUES 局限性

在 UPDATE 中，`VALUES()` 函数只能在 INSERT ... ON DUPLICATE KEY UPDATE 中使用，不能在普通的 UPDATE 中使用。

---

## 10.8 sql_safe_updates 安全模式

这是 MySQL 的一个安全带：当启用时，UPDATE 和 DELETE 语句不能在没有 WHERE 或 LIMIT 的情况下执行，也不能在 WHERE 条件不使用索引列的情况下执行：

```sql
-- 查看当前设置
SELECT @@sql_safe_updates;
-- 0：关闭（默认，危险）
-- 1：开启（安全）

-- 开启安全模式（当前会话）
SET sql_safe_updates = 1;

-- 测试1：不带 WHERE 的 UPDATE —— 被阻止
-- UPDATE employees SET salary = 10000;
-- ERROR 1175 (HY000): You are using safe update mode and you tried
-- to update a table without a WHERE that uses a KEY column.

-- 测试2：WHERE 条件不带 KEY 列 —— 被阻止
-- UPDATE employees SET salary = 10000 WHERE name = '张三';
-- 如果 name 列上没有索引，同样会报错

-- 测试3：WHERE 条件带 KEY 列 —— 允许
UPDATE employees SET salary = 10000 WHERE id = 1;  -- OK，id 是主键

-- 测试4：带 LIMIT 的 UPDATE —— 允许（即使没有 KEY）
UPDATE employees SET salary = 10000 LIMIT 1;  -- OK

-- 关闭安全模式
SET sql_safe_updates = 0;
```

> **建议**：在交互式 MySQL 客户端中（如 mysql 命令行、Navicat、DBeaver），开启 `sql_safe_updates = 1`。在应用程序代码中，由 ORM 或 SQL 构建器来控制 WHERE 条件，因此通常不需要开启。

### 生产环境建议

```sql
-- 在生产环境的 MySQL 配置中开启
-- my.cnf 或 my.ini:
-- [mysqld]
-- sql_safe_updates = 1

-- 或在应用程序连接池的初始化 SQL 中设置
-- SET SESSION sql_safe_updates = 1;
```

---

## 10.9 UPDATE 的数据完整性注意事项

### 更新唯一键

```sql
-- 更新唯一键列需要注意：新值不能与已有值冲突
-- email 列是 UNIQUE 的

-- 测试：将张三的 email 改成李四的 email
-- UPDATE employees SET email = 'lisi@company.com' WHERE id = 1;  -- 假设李四已有这个 email
-- ERROR 1062 (23000): Duplicate entry 'lisi@company.com' for key 'email'

-- 使用 IGNORE 关键字可以跳过冲突行（MySQL 特有）
UPDATE IGNORE employees SET email = 'lisi@company.com' WHERE id = 1;
-- 如果没有冲突，正常更新；如果有冲突，静默跳过（不更新）
-- 注意：UPDATE IGNORE 同样会忽略很多其他错误，谨慎使用
```

### 更新与触发器

```sql
-- 如果表上有 UPDATE 触发器，BEFORE UPDATE 触发的修改会影响实际写入的值
-- 如果 BEFORE UPDATE 触发器中的 NEW 值被修改，实际写入的是修改后的值

CREATE TRIGGER before_employee_update
BEFORE UPDATE ON employees
FOR EACH ROW
SET NEW.updated_at = NOW();

-- 之后每次 UPDATE，updated_at 列都会被自动设置为当前时间
```

### 并发更新与乐观锁

```sql
-- 乐观锁模式：在 WHERE 中带上版本号
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 100 AND version = 5;
-- 只有版本号匹配的行才被更新
-- 如果 Affected rows = 0，说明其他连接已经修改过这一行
```

---

## 常见错误

### 1. 忘记 WHERE 子句导致全表更新

```sql
-- ❌ 灾难性错误
-- UPDATE employees SET salary = 10000;
-- 所有人的工资都被改成 10000 了！

-- ✅ 预防：先 SELECT 再 UPDATE
-- SELECT * FROM employees WHERE id = 5;  -- 先确认
-- UPDATE employees SET salary = 10000 WHERE id = 5;  -- 再更新
```

**根本原因**：UPDATE 语法中 WHERE 是可选的，如果不写就是全表更新。
**解决**：开启 `sql_safe_updates` 模式，或遵守"先 SELECT 后 UPDATE"的铁律。

### 2. 子查询引用正在更新的同一张表

```sql
-- ❌ 错误
-- UPDATE employees
-- SET salary = (SELECT MAX(salary) FROM employees);
-- ERROR 1093: You can't specify target table for update in FROM clause
```

**原因**：MySQL 不允许在 UPDATE 的子查询中直接引用正在更新的同一张表，这是为了防止数据不一致。
**解决**：使用派生表（子查询嵌套一层）或 JOIN 方式。

### 3. LEFT JOIN UPDATE 退化为 CROSS JOIN

```sql
-- ⚠️ 危险：如果没有正确的 ON 条件，会导致全表更新
UPDATE employees e
LEFT JOIN departments d ON 1=1  -- 这实际上是 CROSS JOIN！
SET e.salary = 0;
-- 如果有 ON 条件写错（比如列名拼写错误导致永远为 TRUE），后果更隐蔽
```

### 4. 误解 SET 子句中列的计算顺序

```sql
-- 假设 salary=8000，bonus=2000
UPDATE employees
SET salary = salary * 1.5,     -- 8000*1.5 = 12000
    total = salary + bonus;     -- 这里引用的 salary 是 8000 还是 12000？

-- MySQL 中，SET 从左到右计算，所以这里的 salary 已经是 12000
-- 但 ANSI SQL 标准不保证 SET 子句中的列更新顺序
-- 最佳实践：不要在同一个 UPDATE 的 SET 中引用了刚更新的列
```

---

## 本章练习

1. **基本更新练习**：向 `employees` 表插入 5 条不同的员工数据，然后：
   - 给所有工资低于 8000 的员工加薪 20%
   - 把所有"市场部"员工调到"销售部"
   - 验证每次更新后的结果

2. **表达式更新练习**：创建一张 `products` 表（id, name, price, stock, category），插入 10 条商品数据。编写 UPDATE 实现：
   - 所有"食品"类商品打 8 折（price = price * 0.8）
   - 同时更新多个列：打 8 折 + 库存减半
   - 使用 CASE 表达式：不同分类打不同折扣

3. **LIMIT + ORDER BY 练习**：创建一张 `task_queue` 表（id, task_name, status, priority, created_at），插入 20 条不同优先级的待处理任务。编写 UPDATE 实现：按优先级从高到低、创建时间从早到晚的顺序，将前 5 个"pending"任务更新为"processing"。

4. **多表 JOIN UPDATE 练习**：创建 `departments` 和 `employees` 两张关联表。通过 JOIN UPDATE 实现：根据部门的 `raise_percentage` 给对应员工加薪。

5. **sql_safe_updates 练习**：开启 `SET sql_safe_updates = 1`，分别尝试：
   - 不带 WHERE 的 UPDATE（应被阻止）
   - 带非索引列 WHERE 条件的 UPDATE（应被阻止）
   - 带主键 WHERE 条件的 UPDATE（应成功）
   - 带 LIMIT 的 UPDATE（应成功）
   记录每种情况的报错信息。
