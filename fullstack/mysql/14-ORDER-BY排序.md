# 第14章：ORDER BY 排序

## 本章目标
学完本章后，你将能够：
1. 掌握 ORDER BY 的基本用法与多列组合排序
2. 理解 NULL 值在排序中的特殊行为
3. 使用 FIELD() 和 CASE 实现自定义排序
4. 理解 ORDER BY 与索引的关系，避免性能陷阱
5. 结合 LIMIT 实现排序分页

## 前置知识
- 第12章：查询基础 SELECT
- 第13章：WHERE 条件过滤
- 第16章：LIMIT 与分页（与 LIMIT 结合使用）

---

## 14.1 ORDER BY 基本语法

ORDER BY 用于对查询结果进行排序：

```sql
SELECT 列列表
FROM 表名
[WHERE 条件]
ORDER BY 列1 [ASC|DESC], 列2 [ASC|DESC], ...;
```

### 准备测试数据

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INT,
    score DECIMAL(5,2),
    class VARCHAR(20),
    city VARCHAR(50)
);

INSERT INTO students (name, age, score, class, city) VALUES
('张三', 20, 85.5, '一班', '北京'),
('李四', 22, 92.0, '一班', '上海'),
('王五', 19, 78.5, '一班', '广州'),
('赵六', 21, 88.0, '二班', '北京'),
('孙七', 23, 95.5, '二班', '深圳'),
('周八', 20, 72.0, '二班', '上海'),
('吴九', 21, 88.0, '三班', '北京'),
('郑十', 22, 85.5, '三班', '广州'),
('钱一', 19, 91.0, '三班', NULL),
('陈二', 24, 67.0, '一班', '深圳');
```

### 单列排序

```sql
-- 按分数升序排列（ASC 是默认值，可省略）
SELECT name, score FROM students ORDER BY score ASC;
SELECT name, score FROM students ORDER BY score;       -- 等价

-- 按分数降序排列
SELECT name, score FROM students ORDER BY score DESC;
```

### 多列排序

```sql
-- 先按 class 升序，class 相同的再按 score 降序
SELECT class, name, score
FROM students
ORDER BY class ASC, score DESC;

-- 输出：
-- +--------+--------+-------+
-- | class  | name   | score |
-- +--------+--------+-------+
-- | 一班    | 李四   | 92.0  |  ← class='一班' 中 score 最高的
-- | 一班    | 张三   | 85.5  |
-- | 一班    | 王五   | 78.5  |
-- | 一班    | 陈二   | 67.0  |
-- | 二班    | 孙七   | 95.5  |  ← class='二班' 中 score 最高的
-- | 二班    | 赵六   | 88.0  |
-- | 二班    | 周八   | 72.0  |
-- | 三班    | 钱一   | 91.0  |
-- | 三班    | 吴九   | 88.0  |
-- | 三班    | 郑十   | 85.5  |
-- +--------+--------+-------+
```

```sql
-- 每列可以有不同的排序方向
SELECT class, age, name
FROM students
ORDER BY class ASC, age DESC, name ASC;
-- 先按班级升序 → 班级内按年龄降序 → 同龄按姓名升序
```

---

## 14.2 ORDER BY 中的表达式与别名

### 使用表达式排序

```sql
-- 按年龄与分数的某种组合排序
SELECT name, age, score, (age * 10 + score) AS rank_score
FROM students
ORDER BY age * 10 + score DESC;

-- 按总成绩排序（假设有三科成绩）
-- ORDER BY chinese + math + english DESC;
```

### 使用列别名排序

```sql
-- 可以在 ORDER BY 中使用 SELECT 中定义的别名（因为 ORDER BY 在 SELECT 之后执行）
SELECT
    name,
    score,
    score * 1.1 AS adjusted_score
FROM students
ORDER BY adjusted_score DESC;
-- ✅ 有效：ORDER BY 可以使用 SELECT 中的别名
```

```sql
-- 相反，WHERE 中不能使用别名
-- SELECT name, score * 1.1 AS adj FROM students WHERE adj > 80;  -- ❌ 错误
```

### 使用列位置排序（按列序号）

```sql
-- 按 SELECT 列表中的第 2 列排序（1-based）
SELECT name, score, class FROM students ORDER BY 2 DESC;
-- 等价于 ORDER BY score DESC

-- 按第 3 列再按第 2 列排序
SELECT name, score, class FROM students ORDER BY 3, 2;
-- 等价于 ORDER BY class, score
```

> **严重警告**：按列位置排序非常脆弱。如果 SELECT 列表的列顺序发生变化（比如加了新列），排序逻辑就静默改变，且没有任何错误提示。**生产代码中绝不使用**。

---

## 14.3 NULL 在排序中的行为

在 MySQL 中，NULL 在排序时被视为"最小值"（ASC 中最先出现，DESC 中最后出现）：

```sql
-- 按 city 升序排列：NULL 值排在最前面
SELECT name, city FROM students ORDER BY city ASC;
-- NULL 行最先出现

-- 按 city 降序排列：NULL 值排在最后面
SELECT name, city FROM students ORDER BY city DESC;
-- NULL 行最后出现
```

### 控制 NULL 的排序位置

MySQL 没有直接提供 NULLS FIRST / NULLS LAST 语法（这是 SQL 标准的一部分），但可以通过技巧实现：

```sql
-- 让 NULL 在升序时排在最后（通常的需求）
SELECT name, city
FROM students
ORDER BY city IS NULL ASC, city ASC;
-- 解释：city IS NULL 返回 0（非 NULL）或 1（NULL）
-- 所以非 NULL 行（IS NULL = 0）排在前面，NULL 行（IS NULL = 1）排在后面

-- 让 NULL 在降序时排在最前面
SELECT name, city
FROM students
ORDER BY city IS NULL DESC, city DESC;
```

```sql
-- 更清晰的写法：使用 CASE 表达式
SELECT name, city
FROM students
ORDER BY
    CASE WHEN city IS NULL THEN 1 ELSE 0 END,  -- NULL 排最后
    city ASC;

-- 或使用 IF（MySQL 特有）
SELECT name, city
FROM students
ORDER BY
    IF(city IS NULL, 1, 0),  -- NULL 排最后
    city ASC;
```

> **注意**：MySQL 8.0.16+ 开始，ORDER BY 支持了 `NULLS FIRST` 和 `NULLS LAST` 语法（但仅在特定场景下生效，不完全支持标准）。

---

## 14.4 自定义排序顺序

MySQL 没有直接的"按给定顺序排序"的内置功能，但可以通过一些技巧实现。

### 使用 FIELD() 函数自定义排序

```sql
-- FIELD() 返回参数 1 在后续参数列表中的位置（从 1 开始）
-- 如果没找到，返回 0

-- 示例：按特定城市顺序排列
SELECT name, city
FROM students
ORDER BY FIELD(city, '北京', '上海', '广州', '深圳');
-- 北京(1) → 上海(2) → 广州(3) → 深圳(4) → NULL(0，排在最后)

-- FIELD 在 ORDER BY 中的工作原理：
-- 1. 对每行计算 FIELD(city, '北京', '上海', '广州', '深圳')
-- 2. city='北京' → 1, city='上海' → 2, city='广州' → 3, city='深圳' → 4, city=NULL → 0
-- 3. 按返回值从小到大排序
```

```sql
-- 实战：按业务优先级排序
-- 将状态为 '处理中' > '待处理' > '已完成' 的顺序排列
SELECT task_name, status
FROM tasks
ORDER BY FIELD(status, '处理中', '待处理', '已完成');

-- FIELD 不在列表中的值返回 0，会排列在最前面
-- 如果希望未列出的值排在最后：
SELECT task_name, status
FROM tasks
ORDER BY FIELD(status, '已完成', '待处理', '处理中') DESC;
-- 反转后：处理中(3) → 待处理(2) → 已完成(1) → 其他(0用DESC变成最后)

-- 或用两层排序确保未列出的排在最后
SELECT task_name, status
FROM tasks
ORDER BY
    FIELD(status, '处理中', '待处理', '已完成') = 0,  -- 0=在列表中排前, 1=不在排后
    FIELD(status, '处理中', '待处理', '已完成');
```

### 使用 CASE WHEN 自定义排序

CASE WHEN 更灵活，支持复杂的排序逻辑：

```sql
-- 将特定城市排在前面
SELECT name, city, score
FROM students
ORDER BY
    CASE
        WHEN city = '北京' THEN 1
        WHEN city = '上海' THEN 2
        WHEN city = '广州' THEN 3
        ELSE 4
    END,
    score DESC;

-- 北京的学生排在最前面，然后是上海、广州，其他城市最后
-- 每个城市组内按分数降序排列
```

```sql
-- 复杂业务逻辑排序
SELECT
    product_name,
    stock,
    sales_volume,
    category
FROM products
ORDER BY
    -- 缺货的排在最后
    CASE WHEN stock = 0 THEN 1 ELSE 0 END,
    -- 热销的排前面
    CASE
        WHEN sales_volume > 1000 THEN 1
        WHEN sales_volume > 500 THEN 2
        WHEN sales_volume > 100 THEN 3
        ELSE 4
    END,
    -- 同组内按库存降序
    stock DESC;
```

---

## 14.5 随机排序

```sql
-- 使用 RAND() 随机排序
SELECT name, score FROM students ORDER BY RAND();

-- ⚠️ RAND() 排序的性能极差
-- 原因：每行都调用一次 RAND()，且生成的值无序（无法用索引），必须是 filesort
-- 对于大表，使用 RAND() 排序几乎不可接受

-- 如果需要从大表中随机选取 N 行：
-- 方式1：先获取最大 ID，在代码中生成随机 ID 列表，再 WHERE id IN (...)
-- 方式2：使用子查询 + LIMIT
SELECT * FROM students
WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM students)))
ORDER BY id
LIMIT 5;
-- 但这种方式在 ID 有间隙时不够"均匀随机"
```

---

## 14.6 ORDER BY 与 LIMIT 结合

```sql
-- 分数最高的 3 个学生
SELECT name, score FROM students ORDER BY score DESC LIMIT 3;

-- 分数最低的 3 个学生
SELECT name, score FROM students ORDER BY score ASC LIMIT 3;

-- 分页：每页 3 条，第 2 页
SELECT name, score FROM students ORDER BY id LIMIT 3 OFFSET 3;
-- 第 1 页: LIMIT 0,3  或 LIMIT 3 OFFSET 0
-- 第 2 页: LIMIT 3,3  或 LIMIT 3 OFFSET 3
-- 第 3 页: LIMIT 6,3  或 LIMIT 3 OFFSET 6
```

> 关于分页与深层分页的性能问题，详见第 16 章（LIMIT 与分页）。

---

## 14.7 ORDER BY 的性能与 filesort

### 什么是 filesort？

当 MySQL 无法利用索引直接完成排序时，必须执行 **filesort**——即将需要排序的数据读到内存（或磁盘上的临时文件）中进行排序：

```sql
-- 查看排序是否使用了 filesort
EXPLAIN SELECT name, score FROM students ORDER BY score;
-- 如果 Extra 列中出现 "Using filesort"，说明 MySQL 在额外进行排序操作
```

### 使用索引避免 filesort

```sql
-- 在排序列上创建索引
CREATE INDEX idx_score ON students(score);

-- 现在按 score 排序可以利用索引（B-Tree 索引本身就是有序的）
EXPLAIN SELECT name, score FROM students ORDER BY score;
-- Extra 中通常不会出现 "Using filesort"（前提是优化器选择了该索引）

-- 但如果同时有其他条件，索引是否被使用取决于多种因素：
EXPLAIN SELECT name, score FROM students WHERE class = '一班' ORDER BY score;
-- 优化器可能用 idx_score 做排序，然后用 WHERE 过滤
-- 也可能用其他索引做过滤，然后 filesort 排序
-- 具体取决于数据分布和优化器的判断
```

### ORDER BY 使用索引的条件

```sql
-- 创建复合索引
CREATE INDEX idx_class_score ON students(class, score);

-- ✅ 可以使用索引（ORDER BY 列是索引的最左前缀）
SELECT * FROM students ORDER BY class;              -- 索引第一列
SELECT * FROM students ORDER BY class, score;       -- 索引前两列（完整使用）
SELECT * FROM students ORDER BY class DESC, score DESC;  -- 所有列同方向

-- ❌ 不能使用索引（或不高效）
SELECT * FROM students ORDER BY score;              -- 跳过了索引的第一列 class
SELECT * FROM students ORDER BY class ASC, score DESC;  -- 排序方向不一致

-- 使用 EXPLAIN 验证
EXPLAIN SELECT * FROM students ORDER BY class, score;
```

### 排序优化实战建议

1. 尽量让 ORDER BY 的列匹配索引的最左前缀
2. 尽量保证所有排序列的排序方向一致（全 ASC 或全 DESC）
3. 只在必要时排序——不要在应用程序层也能完成排序的数据上加 ORDER BY
4. `ORDER BY RAND()` 绝对要避免
5. 如果 filesort 不可避免，考虑增加 `sort_buffer_size` 参数以减少磁盘排序

---

## 常见错误

### 1. 混淆 ASC 和 DESC

```sql
-- 初学者常以为不写就是 DESC
-- 实际上默认是 ASC（升序，从小到大）

-- 想要"分数最高的前 5 名"
-- ❌ 忘记写 DESC
SELECT name, score FROM students ORDER BY score LIMIT 5;
-- 返回分数最低的 5 名！

-- ✅ 明确写 DESC
SELECT name, score FROM students ORDER BY score DESC LIMIT 5;
```

### 2. 多列排序写错顺序

```sql
-- 想要：每班选分数最高的前 3 名
-- ❌ 错误：先按 score 排，再按 class 排，结果不对
SELECT * FROM students ORDER BY score DESC, class LIMIT 3;

-- ✅ 正确：先按 class 分班，再在每班内按 score 排
SELECT * FROM students ORDER BY class, score DESC;
```

### 3. ORDER BY 与 GROUP BY 混用时的注意

```sql
-- 在 GROUP BY 查询中，ORDER BY 只能引用 GROUP BY 列或聚合函数结果
-- 不能引用非分组列（在 ONLY_FULL_GROUP_BY 模式下会报错）

SELECT class, AVG(score) AS avg_score
FROM students
GROUP BY class
ORDER BY avg_score DESC;  -- ✅ 引用聚合结果
```

### 4. 依赖默认排序

```sql
-- ❌ 错误假设：认为 SELECT 返回的行顺序与 INSERT 顺序一致
-- 没有 ORDER BY 时，返回顺序是不确定的！

-- 即使 InnoDB 通常按主键顺序返回，也不能依赖这个行为
-- 查询优化器、存储引擎版本、并发操作都可能改变返回顺序

-- ✅ 需要特定顺序时，始终使用 ORDER BY
```

---

## 本章练习

1. **基本排序练习**：对 `students` 表执行以下排序查询：
   - 按分数降序排列所有学生
   - 按年龄升序排列所有学生
   - 先按班级升序，再按分数降序排列
   - 查询分数最高的 3 名学生

2. **NULL 排序练习**：使用 `city IS NULL` + 常规排序，实现：
   - 按 city 升序但 NULL 排在最后
   - 按 city 降序但 NULL 排在最前

3. **自定义排序练习**：
   - 使用 FIELD() 将学生按城市 '深圳', '北京', '上海', '广州' 的顺序排列
   - 使用 CASE WHEN 将 score >= 90 的排最前，80-89 的其次，其余的排最后

4. **索引与排序练习**：创建一个无索引的测试表（10 万行），分别测试有索引和无索引情况下 `ORDER BY col LIMIT 100` 的性能差异。使用 EXPLAIN 观察 "Using filesort" 的出现情况。

5. **综合练习**：
   - 创建 `orders` 表（id, customer, amount, status, created_at），插入 20 条数据
   - 查询金额最高的 5 笔订单
   - 按状态自定义排序（'pending' 排第一，'processing' 排第二，'completed' 排第三），相同状态按金额降序
   - 每个客户中金额最高的一笔订单（提示：结合子查询或窗口函数）
