# 第13章：WHERE 条件过滤

## 本章目标
学完本章后，你将能够：
1. 熟练使用各种比较运算符进行数据过滤
2. 正确理解 SQL 三值逻辑，避免 NULL 比较陷阱
3. 掌握 AND、OR、NOT 的组合使用与优先级
4. 使用 BETWEEN、IN、LIKE 等高级过滤条件
5. 编写正则表达式过滤（REGEXP）并理解其性能影响
6. 理解 WHERE 与索引性能的关系

## 前置知识
- 第12章：查询基础 SELECT（WHERE 是 SELECT 的子句）
- 基本数据类型与 NULL 概念

---

## 13.1 比较运算符

WHERE 子句使用比较运算符来判断每行是否应该包含在结果集中：

```sql
-- 准备测试数据
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INT,
    salary DECIMAL(10,2),
    department VARCHAR(50),
    hire_date DATE
);

INSERT INTO employees (name, age, salary, department, hire_date) VALUES
('张三', 28, 8000.00, '技术部', '2020-03-15'),
('李四', 35, 12000.00, '技术部', '2018-07-01'),
('王五', 22, 6000.00, '市场部', '2023-01-10'),
('赵六', 30, 9000.00, '市场部', '2021-06-20'),
('孙七', 45, 15000.00, '管理层', '2015-01-01'),
('周八', NULL, 7000.00, '技术部', '2022-09-01'),
('吴九', 26, NULL, '市场部', '2024-02-15');
```

### MySQL 比较运算符全表

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `=` | 等于 | `WHERE age = 30` |
| `<>` 或 `!=` | 不等于 | `WHERE dept <> '技术部'` |
| `<` | 小于 | `WHERE salary < 8000` |
| `<=` | 小于等于 | `WHERE age <= 30` |
| `>` | 大于 | `WHERE salary > 10000` |
| `>=` | 大于等于 | `WHERE age >= 35` |
| `IS NULL` | 是否为 NULL | `WHERE age IS NULL` |
| `IS NOT NULL` | 是否不为 NULL | `WHERE salary IS NOT NULL` |
| `<=>` | NULL 安全等于 | `WHERE age <=> NULL` |
| `BETWEEN a AND b` | 在两值之间（含边界） | `WHERE age BETWEEN 25 AND 35` |
| `IN (...)` | 在列表中 | `WHERE dept IN ('技术部','市场部')` |
| `LIKE` | 模式匹配 | `WHERE name LIKE '张%'` |
| `REGEXP` / `RLIKE` | 正则匹配 | `WHERE name REGEXP '^[张李]'` |

### 基础比较示例

```sql
-- 等于
SELECT name, age FROM employees WHERE age = 30;

-- 不等于（<> 和 != 等价，推荐使用 <>，它是 SQL 标准）
SELECT name, department FROM employees WHERE department <> '技术部';
SELECT name, department FROM employees WHERE department != '技术部';

-- 大小比较
SELECT name, salary FROM employees WHERE salary >= 10000;
SELECT name, age FROM employees WHERE age < 30;
```

### 字符串比较与排序规则（Collation）

```sql
-- MySQL 的字符串比较默认是大小写不敏感的（取决于列的 collation）
-- 查看列的排序规则
SHOW FULL COLUMNS FROM employees;

-- 一般情况下：
-- utf8mb4_general_ci：大小写不敏感（ci = Case Insensitive）
-- utf8mb4_bin：大小写敏感（bin = binary）

-- 演示：
CREATE TABLE test_case (
    id INT,
    name VARCHAR(50) COLLATE utf8mb4_general_ci
);

INSERT INTO test_case VALUES (1, 'Alice'), (2, 'alice'), (3, 'ALICE');

-- 大小写不敏感：三条都能找到
SELECT * FROM test_case WHERE name = 'Alice';
-- 返回 3 行：Alice, alice, ALICE

-- 强制大小写敏感比较：使用 BINARY 关键字
SELECT * FROM test_case WHERE BINARY name = 'Alice';
-- 只返回 1 行：Alice

-- 或者使用 COLLATE 子句
SELECT * FROM test_case WHERE name COLLATE utf8mb4_bin = 'Alice';
```

---

## 13.2 NULL 比较：三值逻辑

这是 SQL 中最容易被误解的概念。SQL 使用**三值逻辑**（Three-Valued Logic），每个条件的结果可能是：

| 值 | 含义 |
|----|------|
| **TRUE** | 条件成立 |
| **FALSE** | 条件不成立 |
| **UNKNOWN** (NULL) | 未知（涉及 NULL 的比较） |

### NULL 与任何值的比较都返回 UNKNOWN

```sql
-- 测试 NULL 比较
SELECT
    1 = NULL,           -- NULL (不是 0，不是 FALSE！)
    1 <> NULL,          -- NULL
    NULL = NULL,        -- NULL（注意：NULL 不等于 NULL！）
    NULL IS NULL,       -- 1 (TRUE)
    NULL <=> NULL;      -- 1 (TRUE，NULL-safe 等于)
```

### WHERE 只保留条件为 TRUE 的行

```sql
-- age 为 NULL 的行（周八）不会被以下任何条件选中：
SELECT * FROM employees WHERE age = NULL;       -- 0 行（永远为空！）
SELECT * FROM employees WHERE age <> NULL;      -- 0 行（永远为空！）

-- ✅ 正确做法：
SELECT * FROM employees WHERE age IS NULL;      -- 1 行（周八）
SELECT * FROM employees WHERE age IS NOT NULL;  -- 6 行
```

### 为什么 `= NULL` 永远不返回任何行？

```sql
-- SQL 的逻辑规则：
-- 1. 任何值与 NULL 比较的结果是 UNKNOWN
-- 2. WHERE 子句只保留结果为 TRUE 的行
-- 3. UNKNOWN 不是 TRUE，所以被过滤掉

-- 所以：
-- WHERE age = NULL   → age = NULL 的结果是 UNKNOWN → 不是 TRUE → 行被丢弃
-- WHERE age != NULL  → age != NULL 的结果是 UNKNOWN → 不是 TRUE → 行被丢弃
```

### <=> NULL-safe 等于运算符

```sql
-- <=> 是 MySQL 特有的"NULL 安全等于"运算符
SELECT
    1 <=> 1,        -- 1 (TRUE，两值相等)
    1 <=> 2,        -- 0 (FALSE)
    1 <=> NULL,     -- 0 (FALSE，不是 UNKNOWN！)
    NULL <=> NULL;  -- 1 (TRUE，两个 NULL 被视为相等)

-- 实战使用：
SELECT * FROM employees WHERE age <=> NULL;
-- 等价于 WHERE age IS NULL

-- 在 JOIN 的 ON 条件中有时很有用：
-- ON a.col <=> b.col  （将 NULL 视为相等进行匹配）
```

---

## 13.3 AND、OR、NOT 与运算符优先级

```sql
-- AND：所有条件都为 TRUE
SELECT name, age, department, salary
FROM employees
WHERE department = '技术部' AND salary > 8000;

-- OR：任一条件为 TRUE
SELECT name, age, department, salary
FROM employees
WHERE department = '技术部' OR department = '市场部';

-- NOT：取反
SELECT name, department
FROM employees
WHERE NOT (department = '技术部');

-- NOT 的另一种写法
SELECT name, department
FROM employees
WHERE department != '技术部';
```

### 运算符优先级：NOT > AND > OR

这是一个非常容易出错的点。AND 的优先级高于 OR：

```sql
-- ⚠️ 没有括号的版本：结果可能不是你想的
SELECT name, department, salary
FROM employees
WHERE department = '技术部' AND salary > 8000 OR salary > 10000;
-- 等价于：
-- WHERE (department = '技术部' AND salary > 8000) OR (salary > 10000)
-- 返回：技术部且工资>8000的人，以及任何部门工资>10000的人

-- ✅ 明确意图：加括号
SELECT name, department, salary
FROM employees
WHERE department = '技术部' AND (salary > 8000 OR salary > 10000);
-- 等价于：
-- WHERE department = '技术部' AND salary > 8000
-- 返回：技术部且工资>8000的人
```

### 优先级口诀和实际建议

```
优先级从高到低：
1. 算术运算符（* / + -）
2. 比较运算符（= <> < > <= >=）
3. IS [NOT] NULL, LIKE, [NOT] BETWEEN, [NOT] IN
4. NOT
5. AND
6. OR

实际建议：永远用括号明确表达你的意图，不要依赖优先级！
```

### 三值逻辑下的 AND/OR/NOT 真值表

```sql
-- AND 真值表
-- TRUE  AND TRUE  = TRUE
-- TRUE  AND FALSE = FALSE
-- TRUE  AND NULL  = NULL (UNKNOWN)
-- FALSE AND NULL  = FALSE（注意：FALSE AND 任何值都是 FALSE）
-- NULL  AND NULL  = NULL

-- OR 真值表
-- TRUE  OR NULL  = TRUE（TRUE OR 任何值都是 TRUE）
-- FALSE OR NULL  = NULL
-- NULL  OR NULL  = NULL

-- NOT 真值表
-- NOT TRUE  = FALSE
-- NOT FALSE = TRUE
-- NOT NULL  = NULL
```

### MySQL 的短路求值

```sql
-- MySQL 使用短路求值（short-circuit evaluation）
-- 在 AND 中，如果左边是 FALSE，右边不会被计算
-- 在 OR 中，如果左边是 TRUE，右边不会被计算

-- 这意味着：
-- WHERE 1=1 OR expensive_function()   -- expensive_function() 不会执行
-- WHERE 0=1 AND expensive_function()  -- expensive_function() 不会执行

-- 但这不能作为优化手段依赖，优化器可能重新排列条件！
```

---

## 13.4 BETWEEN ... AND ...

BETWEEN 用于判断一个值是否在闭区间 `[a, b]` 内（包含 a 和 b）：

```sql
-- 工资在 7000 到 12000 之间（包含两端）
SELECT name, salary FROM employees
WHERE salary BETWEEN 7000 AND 12000;

-- 等价于：
SELECT name, salary FROM employees
WHERE salary >= 7000 AND salary <= 12000;

-- BETWEEN 对日期也适用
SELECT name, hire_date FROM employees
WHERE hire_date BETWEEN '2020-01-01' AND '2022-12-31';
```

### NOT BETWEEN

```sql
-- 工资不在 7000~12000 范围内的
SELECT name, salary FROM employees
WHERE salary NOT BETWEEN 7000 AND 12000;

-- 等价于：
SELECT name, salary FROM employees
WHERE salary < 7000 OR salary > 12000;
```

### BETWEEN 的边界顺序

```sql
-- BETWEEN 要求 a <= b，否则返回空结果
SELECT * FROM employees WHERE salary BETWEEN 12000 AND 7000;
-- 等价于 WHERE salary >= 12000 AND salary <= 7000
-- 这个条件永远不成立，返回 0 行！
```

---

## 13.5 IN 运算符

IN 用于检查一个值是否在给定的列表中：

```sql
-- 检查部门是否在指定列表中
SELECT name, department FROM employees
WHERE department IN ('技术部', '市场部');

-- 等价于：
SELECT name, department FROM employees
WHERE department = '技术部' OR department = '市场部';

-- 数字列表
SELECT name, age FROM employees
WHERE age IN (22, 28, 35);
```

### NOT IN

```sql
-- 部门不在指定列表中的
SELECT name, department FROM employees
WHERE department NOT IN ('技术部', '市场部');
```

### IN 与子查询

```sql
-- IN 经常与子查询一起使用
-- 查询在"技术部"员工的年龄列表中的员工
SELECT name, age, department
FROM employees
WHERE age IN (
    SELECT DISTINCT age
    FROM employees
    WHERE department = '技术部'
);
-- 返回年龄与任何技术部员工相同的所有员工
```

### IN 与 NULL 陷阱（极其重要！）

这是 SQL 中最隐蔽的陷阱之一：

```sql
-- 准备数据
INSERT INTO employees (name, age, salary, department) VALUES
('测试A', 25, 5000, NULL);

-- NOT IN 与 NULL 的陷阱
SELECT name FROM employees
WHERE department NOT IN ('技术部', '市场部');
-- 预期的结果：'孙七'（管理层），'测试A'（NULL）
-- 实际结果：可能只有 '孙七'！NULL 的那行不会出现！

-- 为什么？
-- WHERE department NOT IN ('技术部', '市场部')
-- 等价于：
-- WHERE department <> '技术部' AND department <> '市场部'
-- 当 department 是 NULL 时：
-- NULL <> '技术部' → UNKNOWN
-- NULL <> '市场部' → UNKNOWN
-- UNKNOWN AND UNKNOWN → UNKNOWN → 不是 TRUE → 行被排除！
```

```sql
-- ✅ 解决方案：在 NOT IN 子查询中排除 NULL
SELECT name FROM employees
WHERE department NOT IN ('技术部', '市场部')
   OR department IS NULL;

-- 或者当子查询可能返回 NULL 时：
-- 确保子查询不返回 NULL：
SELECT name FROM employees
WHERE department NOT IN (
    SELECT department FROM dept WHERE department IS NOT NULL
);
```

> **口诀**：`IN` 中如果有 NULL 无关紧要（不匹配 NULL 就是 FALSE，不影响其他值匹配）。但 `NOT IN` 中有 NULL 会毁掉整个查询结果！这就是为什么 EXISTS/NOT EXISTS 通常更安全（第 18 章会讲）。

---

## 13.6 LIKE：模式匹配

LIKE 用于简单的模式匹配，使用两个通配符：

| 通配符 | 含义 |
|--------|------|
| `%` | 匹配任意数量的字符（包括 0 个） |
| `_` | 匹配恰好一个字符 |

```sql
-- 名字以 '张' 开头
SELECT name FROM employees WHERE name LIKE '张%';
-- 返回：张三

-- 名字以 '五' 结尾
SELECT name FROM employees WHERE name LIKE '%五';
-- 返回：王五

-- 名字中包含 '王'（任意位置）
SELECT name FROM employees WHERE name LIKE '%王%';
-- 返回：王五

-- 名字恰好两个字符
SELECT name FROM employees WHERE name LIKE '__';
-- 返回：张三、李四、王五、赵六、孙七、周八、吴九
-- （下划线是两个，匹配恰好两个字符）

-- 名字第二个字是 '三'
SELECT name FROM employees WHERE name LIKE '_三';
```

### LIKE 的转义

```sql
-- 如果要搜索的字面量中包含 % 或 _，需要使用转义
-- 例如：搜索包含 '50%' 的产品名称

CREATE TABLE promotions (
    id INT PRIMARY KEY,
    title VARCHAR(100)
);

INSERT INTO promotions VALUES (1, '全场 50% off'), (2, '满 200 减 50');

-- 搜索包含 '50%' 的字面量
SELECT * FROM promotions WHERE title LIKE '%50\%%' ESCAPE '\\';
-- ESCAPE '\\' 表示 \ 后面的字符失去通配符含义，作为普通字符匹配

-- 也可以用其他字符作为转义符
SELECT * FROM promotions WHERE title LIKE '%50#%%' ESCAPE '#';
```

### LIKE 与索引性能

```sql
-- LIKE 的性能取决于通配符的位置：

-- ✅ 前缀搜索：可以使用索引（如果列上有索引）
SELECT * FROM employees WHERE name LIKE '张%';
-- 优化器知道需要找以'张'开头的值，可以利用 B-Tree 索引

-- ❌ 中缀/后缀搜索：无法使用索引
SELECT * FROM employees WHERE name LIKE '%王%';
-- 优化器无法利用索引，必须全表扫描

-- ❌ 后缀搜索：无法使用索引
SELECT * FROM employees WHERE name LIKE '%五';
-- 同样必须全表扫描

-- 实战技巧：如果经常需要后缀搜索，考虑：
-- 1. 创建一个反向索引列：reverse_name，在上面建索引
-- 2. 使用全文索引（FULLTEXT）
-- 3. 使用 ElasticSearch 等搜索引擎
```

---

## 13.7 REGEXP/RLIKE：正则表达式匹配

REGEXP（或同义词 RLIKE）支持正则表达式匹配，比 LIKE 更强大但性能较差：

```sql
-- 基本用法：名字以'张'或'李'开头
SELECT name FROM employees WHERE name REGEXP '^[张李]';
-- ^ 表示开头，[张李] 表示张或李其中之一

-- RLIKE 是 REGEXP 的同义词，完全等价
SELECT name FROM employees WHERE name RLIKE '^[张李]';
```

### 常用正则表达式模式

| 模式 | 含义 | 示例 |
|------|------|------|
| `^` | 匹配开头 | `'^张'` → 以"张"开头 |
| `$` | 匹配结尾 | `'五$'` → 以"五"结尾 |
| `.` | 匹配任意单个字符 | `'张.'` → "张"后跟任意字符 |
| `[abc]` | 匹配 a、b 或 c 中的一个 | `'^[张李]'` → 以张或李开头 |
| `[a-z]` | 匹配 a 到 z 范围 | `'[0-9]'` → 任意数字 |
| `[^abc]` | 匹配非 a、b、c 的字符 | `'[^0-9]'` → 非数字 |
| `*` | 前一个字符出现 0 次或多次 | `'a*'` → 0个或多个a |
| `+` | 前一个字符出现 1 次或多次 | `'a+'` → 至少1个a |
| `?` | 前一个字符出现 0 次或 1 次 | `'colou?r'` → color或colour |
| `{n}` | 前一个字符出现恰好 n 次 | `'[0-9]{3}'` → 恰好3位数字 |
| `{n,}` | 前一个字符出现至少 n 次 | `'[0-9]{2,}'` → 至少2位数字 |
| `{n,m}` | 前一个字符出现 n 到 m 次 | `'[0-9]{2,4}'` → 2到4位数字 |
| `a\|b` | 匹配 a 或 b | `'张\|李'` → 包含张或李 |
| `[[:<:]]` | 单词开头边界 | `'[[:<:]]tech'` → 以tech开头的单词 |
| `[[:>:]]` | 单词结尾边界 | `'tech[[:>:]]'` → 以tech结尾的单词 |

### 实战正则示例

```sql
-- 1. 验证邮箱格式（简化版）
-- 匹配：字母数字下划线@字母数字.字母
SELECT 'test@example.com' REGEXP '^[A-Za-z0-9._]+@[A-Za-z0-9]+\\.[A-Za-z]{2,}$';
-- 返回 1 (TRUE)

-- 2. 判断是否为纯数字
SELECT '12345' REGEXP '^[0-9]+$';     -- 1
SELECT '123a5' REGEXP '^[0-9]+$';     -- 0

-- 3. 名字中包含至少两个连续数字
SELECT '商品A-001' REGEXP '[0-9]{2}';  -- 1（包含 00）

-- 4. 匹配以大写字母开头的名字
SELECT 'ZhangSan' REGEXP '^[A-Z]';    -- 1

-- 5. 在 WHERE 中使用
SELECT name FROM employees
WHERE name REGEXP '^[张李]';
```

### REGEXP vs LIKE 性能对比

```sql
-- REGEXP 永远不能使用普通索引（会全表扫描）
-- 即使是前缀匹配也不行
-- SELECT * FROM employees WHERE name REGEXP '^张';  -- 全表扫描

-- 而 LIKE 在通配符不在开头时可以使用索引
-- SELECT * FROM employees WHERE name LIKE '张%';    -- 可能使用索引

-- 结论：能用 LIKE 解决的不要用 REGEXP
-- REGEXP 只用于 LIKE 无法处理的复杂模式
```

---

## 13.8 WHERE 与索引

WHERE 条件是否高效，很大程度上取决于是否能用上索引：

```sql
-- 创建索引
CREATE INDEX idx_department ON employees(department);
CREATE INDEX idx_salary ON employees(salary);

-- ✅ 这些 WHERE 条件可以使用索引
SELECT * FROM employees WHERE department = '技术部';      -- 等值
SELECT * FROM employees WHERE salary > 8000;               -- 范围（但不如等值高效）
SELECT * FROM employees WHERE salary BETWEEN 7000 AND 12000; -- BETWEEN
SELECT * FROM employees WHERE salary IN (7000, 8000, 9000); -- IN
SELECT * FROM employees WHERE department LIKE '技%';        -- 前缀 LIKE

-- ❌ 这些 WHERE 条件不能使用索引（或效率很低）
SELECT * FROM employees WHERE department LIKE '%技术%';     -- 非前缀 LIKE
SELECT * FROM employees WHERE department REGEXP '^技';      -- REGEXP（永远不能）
SELECT * FROM employees WHERE salary + 1000 > 8000;         -- 对列做了函数/运算
SELECT * FROM employees WHERE YEAR(hire_date) = 2023;       -- 函数包裹了列
SELECT * FROM employees WHERE department IS NULL;            -- IS NULL 能用，但要注意
-- 注意：IS NULL 在 MySQL 5.6+ 的 InnoDB 中可以使用索引
```

---

## 常见错误

### 1. 用 = NULL 判断空值

```sql
-- ❌ 永远返回 0 行！
SELECT * FROM employees WHERE age = NULL;
-- 原因：任何值（包括 NULL）与 NULL 比较的结果都是 UNKNOWN，不是 TRUE

-- ✅ 正确
SELECT * FROM employees WHERE age IS NULL;
```

### 2. NOT IN 中有 NULL

```sql
-- ❌ 结果异常
-- SELECT * FROM employees WHERE department NOT IN ('技术部', NULL);
-- 如果列表中有 NULL，返回 0 行！

-- 如果子查询可能返回 NULL，NOT IN 结果可能是空集
-- ✅ 使用 NOT EXISTS 代替（第18章详讲）
-- 或确保子查询不含 NULL：
-- WHERE department NOT IN (SELECT dept FROM t WHERE dept IS NOT NULL)
```

### 3. AND/OR 优先级混淆

```sql
-- ❌ 容易误解为：(dept='技术部' OR dept='市场部') AND salary > 8000
SELECT * FROM employees
WHERE department = '技术部' OR department = '市场部' AND salary > 8000;
-- 实际等价于：
-- WHERE department = '技术部' OR (department = '市场部' AND salary > 8000)

-- ✅ 明确意图
SELECT * FROM employees
WHERE (department = '技术部' OR department = '市场部') AND salary > 8000;
```

### 4. BETWEEN 后面写反了

```sql
-- ❌ 返回 0 行（4 不在 8 和 2 之间）
SELECT * FROM employees WHERE salary BETWEEN 12000 AND 7000;

-- ✅ BETWEEN 左小右大
SELECT * FROM employees WHERE salary BETWEEN 7000 AND 12000;
```

### 5. LIKE 匹配模式用错通配符

```sql
-- ❌ 想找恰好两个字符的名字，但用了 %
-- SELECT * FROM employees WHERE name LIKE '%';  -- 匹配所有行！

-- ✅ 用 _ 匹配恰好一个字符
SELECT * FROM employees WHERE name LIKE '__';
```

---

## 本章练习

1. **基本比较练习**：在 `employees` 表上执行以下查询：
   - 年龄大于等于 30 的员工
   - 工资在 8000 到 12000 之间的员工
   - 属于"技术部"且年龄小于 35 的员工
   - 不属于"市场部"的员工

2. **NULL 比较练习**：查询 age 为 NULL 的员工和 salary 为 NULL 的员工。然后尝试用 `= NULL` 和 `!= NULL` 查询（应返回 0 行），理解三值逻辑。

3. **IN vs NOT IN 练习**：向 employees 表添加一条 department 为 NULL 的记录。分别用 IN 和 NOT IN 查询，观察 NULL 值的行为差异。解释为什么 NOT IN 的结果中不包含 NULL 行。

4. **LIKE 模式匹配练习**：
   - 查询名字以"张"开头的员工
   - 查询名字中包含"五"的员工
   - 查询名字恰好两个字的员工
   - 搜索包含 '%' 字符的数据（转义练习）

5. **REGEXP 正则练习**：
   - 用正则匹配名字以"张"或"李"开头的员工
   - 写一个正则验证手机号格式（1 开头的 11 位数字）
   - 写一个正则判断字符串是否全为中文（使用 Unicode 范围）

6. **优先级练习**：不加括号执行 `WHERE a=1 OR b=2 AND c=3`，用 EXPLAIN 查看实际执行条件。然后加括号明确意图，比较结果差异。
