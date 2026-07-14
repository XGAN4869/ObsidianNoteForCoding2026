# 第36章 全文搜索、JSON 与实用技巧

## 本章目标

1. 掌握 InnoDB 全文索引的创建和使用（Natural Language / Boolean / Query Expansion 三种模式）
2. 掌握 ngram 解析器对中文全文搜索的支持
3. 深入掌握 MySQL JSON 数据类型的高级操作（路径表达式、JSON 函数、生成列+索引）
4. 掌握丰富的实用运维命令（SHOW PROCESSLIST, KILL, FLUSH 等）
5. 能够利用 INFORMATION_SCHEMA 进行数据库元数据查询
6. 积累常用的实用脚本和排查技巧

## 前置知识

- 熟悉基本的 SELECT/INSERT/UPDATE/DELETE
- 了解索引的基本概念
- 熟悉 MySQL 命令行客户端的使用

---

## 36.1 InnoDB 全文索引

### 36.1.1 创建全文索引

```sql
-- 创建表时指定
CREATE TABLE articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 在已有表上添加
ALTER TABLE products ADD FULLTEXT INDEX ft_name_desc (name, description);

-- 或
CREATE FULLTEXT INDEX ft_name_desc ON products(name, description);

-- 查看全文索引
SHOW INDEX FROM articles WHERE Index_type = 'FULLTEXT';
```

### 36.1.2 自然语言模式（Natural Language Mode，默认）

```sql
-- 基本搜索：返回按相关性排序的结果
SELECT id, title,
       MATCH(title, content) AGAINST('MySQL indexing optimization') AS relevance
FROM articles
WHERE MATCH(title, content) AGAINST('MySQL indexing optimization' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC;

-- 相关性分数：
-- 0 = 无匹配
-- 越高 = 越相关
-- 计算基于：词频（TF）、文档频率倒数（IDF）、字段长度

-- 最少匹配字数限制
SHOW VARIABLES LIKE 'innodb_ft_min_token_size';
-- 默认 3（InnoDB）：少于 3 个字符的词被忽略
-- MyISAM 对应参数：ft_min_word_len

-- 停用词（被忽略的常见词）
-- 默认停用词：the, a, is, of, for, to, and, in, ...
-- 查看停用词表
SELECT * FROM information_schema.INNODB_FT_DEFAULT_STOPWORD;

-- 自定义停用词表
-- 1. 创建停用词表
CREATE TABLE my_stopwords (value VARCHAR(30)) ENGINE=INNODB;
INSERT INTO my_stopwords VALUES ('的'), ('是'), ('在'), ('和');
-- 2. 配置
SET GLOBAL innodb_ft_server_stopword_table = 'mydb/my_stopwords';
-- 3. 重建全文索引
ALTER TABLE articles DROP INDEX ft_title_content;
ALTER TABLE articles ADD FULLTEXT INDEX ft_title_content (title, content);
```

### 36.1.3 布尔模式（Boolean Mode）

布尔模式提供了丰富的搜索操作符，比自然语言模式更灵活：

```sql
-- 操作符速查表：
-- +    必须包含（AND）
-- -    必须不包含（NOT）
-- >    增加权重
-- <    减少权重
-- *    通配符后缀
-- ""   短语匹配
-- ()   分组
-- ~    负权重（降低相关性但不排除）

-- 必须包含 MySQL，必须不包含 Oracle
SELECT * FROM articles
WHERE MATCH(title, content)
  AGAINST('+MySQL -Oracle' IN BOOLEAN MODE);

-- 包含 MySQL，并且包含 indexing 的文档相关性更高
SELECT id, title,
       MATCH(title, content) AGAINST('+MySQL >indexing' IN BOOLEAN MODE) AS relevance
FROM articles
WHERE MATCH(title, content) AGAINST('+MySQL' IN BOOLEAN MODE)
ORDER BY relevance DESC;

-- 短语匹配（精确匹配 "query optimization" 这个短语）
SELECT * FROM articles
WHERE MATCH(title, content)
  AGAINST('"query optimization"' IN BOOLEAN MODE);

-- 前缀搜索（opti* 匹配 optimization, optimal, optimize 等）
SELECT * FROM articles
WHERE MATCH(title, content)
  AGAINST('+MySQL +opti*' IN BOOLEAN MODE);

-- 组合：MySQL + (优化 OR indexing) - 分区
SELECT * FROM articles
WHERE MATCH(title, content)
  AGAINST('+MySQL +(优化 indexing) -分区' IN BOOLEAN MODE);
```

### 36.1.4 查询扩展模式（Query Expansion）

两阶段搜索，自动找到相关文档：

```sql
-- 阶段 1：正常搜索 "database"，找到相关文档
-- 阶段 2：从阶段 1 的文档中提取高频词，加上原始搜索词再次搜索
-- 结果：可能找到不含 "database" 但与数据库相关的文档（含 "MySQL", "SQL" 等）

SELECT * FROM articles
WHERE MATCH(title, content)
  AGAINST('database' WITH QUERY EXPANSION);

-- 适用场景：
-- 1. 用户搜索词可能不能完全表达意图时
-- 2. 内容发现/推荐场景
-- 3. "猜你喜欢"式的搜索

-- 局限性：
-- 1. 如果第一步的结果相关性差，第二步会偏差更大
-- 2. 结果不如布尔模式可预测
```

### 36.1.5 中文全文搜索（ngram 解析器）

MySQL 内置的全文索引默认按空格分词，对中文（无空格分隔）无效。ngram 解析器将文本按固定长度切分为 n-gram：

```sql
-- ngram 配置
SHOW VARIABLES LIKE 'ngram_token_size';
-- 默认 2：将文本切分为每 2 个字符一组
-- 例："你好世界" → "你好"、"好世"、"世界"

-- 创建 ngram 全文索引
CREATE TABLE chinese_articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 或在已有表上添加
ALTER TABLE articles ADD FULLTEXT INDEX ft_ngram (content) WITH PARSER ngram;

-- 搜索中文
SELECT * FROM chinese_articles
WHERE MATCH(title, content)
  AGAINST('数据库优化' IN BOOLEAN MODE);
-- ngram 切分为 "数据"、"据库"、"库优"、"优化"
-- 包含这些切分的文档都会被匹配（以 AND/OR 组合，取决于模式）

-- ngram_token_size 调优
-- 值 = 1：最细致，索引最大，搜索结果最多（但也可能噪音多）
-- 值 = 2：默认，适合大多数中文搜索
-- 值 = 3：更适合短语匹配，但短词会遗漏

-- 停用词对 ngram 的影响
-- ngram 使用独立的停用词表
SHOW VARIABLES LIKE 'innodb_ft_min_token_size';  -- 对 ngram 无效！

-- ngram 专属的最小 token 长度（MySQL 内部计算）
-- ngram_token_size = 2, innodb_ft_min_token_size = 3
-- → 实际上 ngram 忽略 innodb_ft_min_token_size
-- → ngram 的最小 token 长度等于 ngram_token_size
```

---

## 36.2 JSON 高级操作

### 36.2.1 JSON 路径表达式

```sql
-- 示例 JSON 文档
SET @doc = '{
  "name": "张三",
  "age": 28,
  "skills": ["Java", "Python", "MySQL"],
  "address": {
    "city": "北京",
    "district": "朝阳区"
  },
  "projects": [
    {"name": "电商系统", "role": "后端开发"},
    {"name": "数据平台", "role": "架构师"}
  ]
}';

-- 基本路径
SELECT JSON_EXTRACT(@doc, '$.name');              -- "张三"  (带引号)
SELECT @doc->>'$.name';                            -- 张三     (不带引号，文本)
SELECT @doc->'$.name';                             -- "张三"  (带引号，同 JSON_EXTRACT)

-- 数组访问
SELECT JSON_EXTRACT(@doc, '$.skills[0]');         -- "Java"

-- 通配符
SELECT JSON_EXTRACT(@doc, '$.projects[*].name');  -- ["电商系统", "数据平台"]

-- 递归通配符（搜索所有嵌套层级）
SELECT JSON_EXTRACT(@doc, '$**.city');             -- ["北京"]

-- 数组范围
SELECT JSON_EXTRACT(@doc, '$.skills[0 to 1]');    -- ["Java", "Python"]
```

### 36.2.2 JSON 函数分类速查

**读取函数：**

```sql
-- JSON_EXTRACT / -> / ->>
SELECT JSON_EXTRACT(data, '$.name') FROM users;    -- 提取值（保留 JSON 类型）
SELECT data->'$.name' FROM users;                  -- 同 JSON_EXTRACT
SELECT data->>'$.name' FROM users;                -- 提取为文本（去掉引号）

-- JSON_UNQUOTE：去掉 JSON 值的引号
SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) FROM users;

-- JSON_KEYS：获取所有顶层键
SELECT JSON_KEYS(data) FROM users;                 -- ["name", "age", "skills"]

-- JSON_CONTAINS_PATH：检查路径是否存在
SELECT JSON_CONTAINS_PATH(data, 'one', '$.email') FROM users;
-- one = 至少一个存在，all = 全部存在

-- JSON_LENGTH：获取数组长度或对象键数
SELECT JSON_LENGTH(data) FROM users;               -- 顶层键数量
SELECT JSON_LENGTH(data, '$.skills') FROM users;   -- skills 数组长度

-- JSON_TYPE：获取 JSON 值的类型
SELECT JSON_TYPE(data->'$.name') FROM users;       -- STRING
SELECT JSON_TYPE(data->'$.age') FROM users;        -- INTEGER
SELECT JSON_TYPE(data->'$.skills') FROM users;     -- ARRAY
SELECT JSON_TYPE(data->'$.address') FROM users;    -- OBJECT
```

**修改函数：**

```sql
-- JSON_SET：插入或更新值（存在则更新，不存在则插入）
UPDATE users
SET data = JSON_SET(data,
  '$.name', '李四',
  '$.phone', '13900139000'
) WHERE id = 1;

-- JSON_INSERT：仅在键不存在时插入（不覆盖已有值）
UPDATE users
SET data = JSON_INSERT(data, '$.created_at', NOW())
WHERE id = 1;

-- JSON_REPLACE：仅在键存在时更新（不插入新键）
UPDATE users
SET data = JSON_REPLACE(data, '$.name', '王五')
WHERE id = 1;

-- JSON_REMOVE：删除键/值
UPDATE users
SET data = JSON_REMOVE(data, '$.temporary_field')
WHERE id = 1;

-- JSON_ARRAY_APPEND：追加到数组
UPDATE users
SET data = JSON_ARRAY_APPEND(data, '$.skills', 'Go')
WHERE id = 1;
-- 原 skills: ["Java", "Python"] → ["Java", "Python", "Go"]

-- JSON_ARRAY_INSERT：在指定位置插入
UPDATE users
SET data = JSON_ARRAY_INSERT(data, '$.skills[0]', 'C++')
WHERE id = 1;

-- JSON_MERGE_PRESERVE / JSON_MERGE_PATCH：合并 JSON
SELECT JSON_MERGE_PRESERVE('{"a":1}', '{"b":2}');   -- {"a":1, "b":2}
SELECT JSON_MERGE_PATCH('{"a":1}', '{"a":2,"b":3}'); -- {"a":2, "b":3}
```

**搜索函数：**

```sql
-- JSON_CONTAINS：检查是否包含指定值
SELECT * FROM users
WHERE JSON_CONTAINS(data, '"Java"', '$.skills');
-- 用户的 skills 数组中包含 "Java"

-- JSON_SEARCH：搜索值返回路径
SELECT JSON_SEARCH(data, 'one', '北京') FROM users;
-- 返回 "$.address.city"（第一个匹配的路径）

-- JSON_OVERLAPS（MySQL 8.0.17+）：两个 JSON 是否有交集
SELECT JSON_OVERLAPS('["Java","Python"]', '["Go","Java"]');  -- 1 (true)
```

**聚合函数（MySQL 8.0.14+）：**

```sql
-- JSON_ARRAYAGG：将多行聚合为 JSON 数组
SELECT category_id, JSON_ARRAYAGG(product_name) AS product_list
FROM products
GROUP BY category_id;

-- JSON_OBJECTAGG：将多行聚合为 JSON 对象
SELECT JSON_OBJECTAGG(id, name) FROM users WHERE id <= 5;
-- {"1": "张三", "2": "李四", "3": "王五", ...}
```

**JSON_TABLE（MySQL 8.0.4+）：将 JSON 转换为关系表**

```sql
-- 将 JSON 数组展开为行
SELECT jt.* FROM users,
JSON_TABLE(users.data, '$.projects[*]' COLUMNS (
  project_name VARCHAR(100) PATH '$.name',
  project_role VARCHAR(100) PATH '$.role'
)) AS jt
WHERE users.id = 1;
-- +---------------+--------------+
-- | project_name  | project_role |
-- +---------------+--------------+
-- | 电商系统       | 后端开发      |
-- | 数据平台       | 架构师        |
-- +---------------+--------------+
```

### 36.2.3 生成列 + 索引（高效查询 JSON 内容）

这是查询 JSON 字段内容的最佳实践：

```sql
-- 场景：users 表有个 data JSON 列，需要频繁按 email 查询

-- 1. 创建虚拟生成列（或 STORED 生成列）并使用索引
ALTER TABLE users
  ADD COLUMN email VARCHAR(255)
  GENERATED ALWAYS AS (data->>'$.email') STORED;

-- 2. 在生成列上创建索引
CREATE INDEX idx_email ON users(email);

-- 3. 现在可以高效查询了！
SELECT * FROM users WHERE email = 'user@example.com';
-- 索引生效！type: ref

-- VIRTUAL vs STORED：
-- VIRTUAL（默认）：不占用存储空间，查询时计算，在 WHERE 中使用会自动计算
--                  MySQL 8.0 支持在 VIRTUAL 列上创建二级索引！
-- STORED：占用存储空间，插入/更新时计算一次，查询时直接使用
--         需要索引的话用 STORED（5.7），或用 VIRTUAL + 二级索引（8.0）

-- 多键索引
ALTER TABLE users
  ADD COLUMN city VARCHAR(100) GENERATED ALWAYS AS (data->>'$.address.city') VIRTUAL;

CREATE INDEX idx_city ON users(city);
-- 现在可以高效地按城市查用户了！
```

### 36.2.4 JSON 性能注意事项

```sql
-- 不推荐：对未加索引的 JSON 列频繁查询
SELECT * FROM users WHERE data->>'$.email' = 'user@example.com';
-- 无法使用索引 → 全表扫描

-- 推荐：使用生成列 + 索引
-- 参见上一节的方案

-- 不推荐：在 JSON 中存储应该在关联表中存储的数据
-- JSON：{"skills": ["Java", "Python", "MySQL"]}
-- 如果需要按技能搜索用户 → 应该建 user_skills 关联表

-- 适合 JSON 的场景：
-- 1. 结构灵活的数据（不同产品有不同属性）
-- 2. 读多写少的配置数据
-- 3. 嵌套结构数据
-- 4. 一次读取整个文档的场景（不需要按内部字段查询）

-- 不适合 JSON 的场景：
-- 1. 需要频繁按内部字段搜索（用生成列+索引）
-- 2. 需要关联查询的数据（建关系表）
-- 3. 需要事务级别的外键约束
-- 4. 数据量大且需要聚合分析的场景
```

---

## 36.3 实用命令集

### 36.3.1 连接与进程管理

```sql
-- SHOW PROCESSLIST：查看所有连接
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;  -- 显示完整的查询文本

-- 查看结果：
-- +----+------+-----------+------+---------+------+-------+------------------+
-- | Id | User | Host      | db   | Command | Time | State | Info             |
-- +----+------+-----------+------+---------+------+-------+------------------+
-- | 5  | root | localhost | mydb | Query   | 0    | init  | SHOW PROCESSLIST |
-- | 10 | app  | 10.0.1.5  | mydb | Sleep  | 120  |       | NULL             |
-- | 11 | app  | 10.0.1.5  | mydb | Query  | 15   | Sending data | SELECT ...    |
-- +----+------+-----------+------+---------+------+-------+------------------+

-- 使用 INFORMATION_SCHEMA 查询（可以 WHERE 和 ORDER）
SELECT * FROM information_schema.PROCESSLIST
WHERE Command != 'Sleep'
ORDER BY Time DESC;

-- KILL：终止连接或查询
KILL 11;              -- 终止连接（断开连接）
KILL CONNECTION 11;   -- 同上（MySQL 8.0 标准写法）
KILL QUERY 11;        -- 仅终止当前查询，不断开连接

-- 批量清理 Sleep 连接（谨慎使用！）
SELECT CONCAT('KILL ', id, ';')
FROM information_schema.PROCESSLIST
WHERE Command = 'Sleep' AND Time > 300;  -- 空闲超过 300 秒
-- 将输出复制执行
```

### 36.3.2 状态与统计查询

```sql
-- 服务器状态变量
SHOW STATUS;                          -- 所有状态变量（几百个）
SHOW STATUS LIKE 'Threads%';          -- 线程相关
SHOW STATUS LIKE 'Questions';         -- 执行过的查询总数
SHOW STATUS LIKE 'Com_select';        -- SELECT 语句数
SHOW STATUS LIKE 'Com_insert';        -- INSERT 语句数
SHOW STATUS LIKE 'Innodb_rows%';      -- InnoDB 行操作统计
SHOW STATUS LIKE 'Handler%';          -- 处理器统计

-- 计算缓冲池命中率
SELECT
  ROUND((1 - (
    (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads')
    /
    (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests')
  )) * 100, 2) AS buffer_pool_hit_rate_pct;

-- 每秒查询数（QPS）计算
-- 两个时间点的 Questions 差值 / 时间间隔（秒）
```

### 36.3.3 维护与修复命令

```sql
-- ANALYZE TABLE：更新索引统计信息
ANALYZE TABLE orders;
-- 优化器使用统计信息来选择最优的查询计划
-- 建议定期执行（尤其在大批量数据变更后）

-- OPTIMIZE TABLE：重建表 + 索引，回收空间
OPTIMIZE TABLE orders;
-- 注意：会锁表！对于 InnoDB 相当于 ALTER TABLE ... FORCE
-- 仅在大量 DELETE 后表空间膨胀时使用
-- 对于 InnoDB，这不是常规维护操作

-- CHECK TABLE：检查表是否有错误
CHECK TABLE orders;

-- REPAIR TABLE：修复损坏的表（主要是 MyISAM）
REPAIR TABLE orders;
-- InnoDB 很少需要修复（有自动崩溃恢复机制）

-- CHECKSUM TABLE：计算表校验和
CHECKSUM TABLE orders;

-- FLUSH 命令家族
FLUSH TABLES;              -- 关闭所有打开的表（强制重新打开）
FLUSH TABLES WITH READ LOCK;  -- 全局读锁（用于全量备份前）
FLUSH LOGS;                -- 关闭并重新打开所有日志文件
FLUSH STATUS;              -- 清空状态变量
FLUSH PRIVILEGES;          -- 重新加载权限表
FLUSH HOSTS;               -- 清空主机缓存
```

### 36.3.4 批量操作技巧

```sql
-- 批量更新（比逐行 UPDATE 快几十倍）
UPDATE orders SET status = 'archived'
WHERE created_at < '2020-01-01' AND status != 'archived'
LIMIT 10000;
-- 重复执行直到受影响行数为 0（避免大事务锁表）

-- 批量删除
DELETE FROM logs
WHERE created_at < '2023-01-01'
LIMIT 5000;
-- 同样分批执行

-- 使用 JOIN 批量更新
UPDATE orders o
JOIN (SELECT order_id FROM archived_orders WHERE archive_date < '2023-01-01') a
  ON o.id = a.order_id
SET o.status = 'archived';

-- 条件性 INSERT（避免重复插入）
INSERT INTO users (username, email, created_at)
VALUES ('new_user', 'new@example.com', NOW())
ON DUPLICATE KEY UPDATE
  updated_at = NOW();
-- username 或 email 如果是 UNIQUE KEY，冲突时执行 UPDATE

-- INSERT IGNORE（忽略重复键错误）
INSERT IGNORE INTO users (username, email)
VALUES ('existing_user', 'existing@example.com');
-- 如果已存在，静默跳过（不报错）

-- REPLACE INTO（删除旧行，插入新行）
REPLACE INTO users (id, username, email)
VALUES (1, 'updated_name', 'updated@example.com');
-- 注意：如果 id=1 存在，先 DELETE 再 INSERT（不是 UPDATE！）
-- AUTO_INCREMENT 值会变化，触发器会被触发，慎用
```

### 36.3.5 字符串和日期常用操作

```sql
-- 字符串操作
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users;   -- 拼接
SELECT CONCAT_WS('-', year, month, day) FROM dates;                  -- 带分隔符拼接
SELECT SUBSTRING(name, 1, 10) FROM users;                            -- 截取
SELECT REPLACE(description, 'old', 'new') FROM products;             -- 替换
SELECT TRIM('  hello  ') AS result;                                  -- 去空格
SELECT LENGTH('你好') AS byte_len, CHAR_LENGTH('你好') AS char_len;    -- 字节/字符长度
SELECT LOCATE('keyword', content) FROM articles;                     -- 查找位置
SELECT FIELD(status, 'pending','paid','shipped');                    -- 返回位置序号

-- 日期操作
SELECT NOW();                                  -- 当前日期时间 2024-01-15 10:30:00
SELECT CURDATE();                              -- 当前日期 2024-01-15
SELECT CURTIME();                              -- 当前时间 10:30:00

SELECT DATE_ADD(NOW(), INTERVAL 7 DAY);        -- 7 天后
SELECT DATE_SUB(NOW(), INTERVAL 1 MONTH);      -- 1 个月前
SELECT DATEDIFF('2024-01-15', '2024-01-01');   -- 日期差（天数）：14
SELECT TIMESTAMPDIFF(YEAR, birth_date, NOW()); -- 年龄计算
SELECT TIMESTAMPDIFF(MONTH, '2020-01-01', '2024-01-01'); -- 月份差

SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');  -- 格式化
SELECT YEAR(NOW()), MONTH(NOW()), DAY(NOW());     -- 提取部分
SELECT DAYOFWEEK(NOW()), WEEKDAY(NOW());          -- 星期几
SELECT LAST_DAY(NOW());                           -- 当月最后一天
```

---

## 36.4 INFORMATION_SCHEMA 实用查询

### 36.4.1 表索引元数据

```sql
-- 查看库中所有表的基本信息
SELECT
  TABLE_NAME,
  ENGINE,
  TABLE_ROWS,
  AVG_ROW_LENGTH,
  ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
  ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb,
  TABLE_COLLATION,
  CREATE_TIME,
  UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- 查看索引信息
SELECT
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
  INDEX_TYPE,
  NON_UNIQUE,
  CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mydb'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE, NON_UNIQUE, CARDINALITY
ORDER BY TABLE_NAME, INDEX_NAME;

-- 查找没有主键的表
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
  AND TABLE_NAME NOT IN (
    SELECT DISTINCT TABLE_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'mydb' AND INDEX_NAME = 'PRIMARY'
  );

-- 全表扫描风险：查找所有列独特性低的索引
SELECT
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mydb'
  AND CARDINALITY < 10
  AND INDEX_NAME != 'PRIMARY'
ORDER BY CARDINALITY;
```

### 36.4.2 列信息

```sql
-- 查看所有列详情
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_KEY,
  EXTRA,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'mydb'
  AND TABLE_NAME = 'orders'
ORDER BY ORDINAL_POSITION;

-- 查找指定列出现在哪些表中
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'mydb'
  AND COLUMN_NAME LIKE '%user_id%';

-- 查找允许 NULL 的列
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'mydb'
  AND IS_NULLABLE = 'YES'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

### 36.4.3 外键关系

```sql
-- 查看所有外键约束
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'mydb'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 查看某一个表被哪些表引用
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'mydb'
  AND REFERENCED_TABLE_NAME = 'users';
```

---

## 常见错误

### 错误 1：LIKE '%keyword%' 代替全文搜索

```
问题：在大文本字段上使用 LIKE '%keyword%' 搜索，
     导致全表扫描，响应时间数秒到数十秒。

解决：使用 FULLTEXT 索引 + MATCH ... AGAINST
  - 比 LIKE 快几个数量级
  - 支持相关性排序
  - 支持布尔操作符
  - ngram 解析器支持中文
```

### 错误 2：JSON 列上直接 WHERE 导致全表扫描

```
问题：WHERE data->>'$.email' = 'user@example.com'
     对百万级用户表全表扫描。

解决：使用生成列 + 索引
  ALTER TABLE users ADD COLUMN email VARCHAR(255)
    GENERATED ALWAYS AS (data->>'$.email') STORED;
  CREATE INDEX idx_email ON users(email);
```

### 错误 3：OPTIMIZE TABLE 滥用

```
问题：定期自动执行 OPTIMIZE TABLE 作为"日常维护"。

分析：
  - OPTIMIZE TABLE 会重建表，相当于 ALTER TABLE ... FORCE
  - 过程中锁表，大表可能耗时数小时
  - InnoDB 的碎片整理效果有限
  
建议：
  - InnoDB 表不需要常规 OPTIMIZE TABLE
  - 仅在大量 DELETE 后表空间显著膨胀（>50% 浪费）时才考虑
  - 优先使用 pt-online-schema-change 或 gh-ost 在线重建
```

### 错误 4：FLUSH PRIVILEGES 过度使用

```
问题：每次修改权限后都执行 FLUSH PRIVILEGES，以为这样才"生效"。

事实：
  - GRANT, REVOKE, CREATE USER, ALTER USER → 自动生效，不需要 FLUSH
  - 仅直接操作 mysql.* 表时才需要 FLUSH
  - 多余的 FLUSH 不会造成错误，但也没有意义
```

### 错误 5：KILL 大量连接后未排查原因

```
问题：大量 Sleep 连接，手动 KILL 后清理了表面现象，
     但根本原因（连接池泄漏、应用未关闭连接）未解决。

建议：
  1. 先排查哪些应用/IP 产生了大量 Sleep 连接
  2. 检查应用的连接池配置
  3. 设置 wait_timeout 和 interactive_timeout（如 600 秒）
  4. KILL 是应急措施，不是长期方案
```

---

## 本章练习

### 练习 1：全文搜索实践

1. 创建包含 1000 篇中文文章的表
2. 创建 ngram 全文索引
3. 对比 LIKE 和 MATCH...AGAINST 在同一搜索词下的性能
4. 测试布尔模式的 +、-、*、" " 操作符
5. 测试查询扩展模式的效果
6. 调整 ngram_token_size 并对比搜索结果变化

### 练习 2：JSON 数据操作

1. 创建一个使用 JSON 列存储用户扩展信息的表
2. 插入包含嵌套结构和数组的 JSON 数据
3. 使用 JSON_EXTRACT 和 ->> 操作符查询
4. 使用 JSON_SET、JSON_REMOVE、JSON_ARRAY_APPEND 修改数据
5. 创建生成列并添加索引，验证查询性能提升
6. 使用 JSON_TABLE 将 JSON 数组展开为关系表并做聚合分析

### 练习 3：INFORMATION_SCHEMA 数据字典查询

编写 SQL 完成以下查询：
1. 找出所有超过 1GB 的表
2. 找出所有缺少主键的表
3. 找出所有未被使用的索引（提示：结合 performance_schema）
4. 生成 DROP INDEX 语句（针对重复索引）
5. 生成数据库结构报告（表名、行数、大小、索引、创建时间）

### 练习 4：实用命令脚本

1. 编写查找并 KILL 长时间运行的查询的脚本（超过 300 秒的 SELECT）
2. 编写批量清理 N 天前日志数据的脚本（分批删除）
3. 编写监控脚本：检查连接数、QPS、缓冲池命中率
4. 编写数据库健康检查脚本（检查无主键表、大表、膨胀表）

### 练习 5：JSON Schema 设计

设计一个电商产品的 JSON Schema，要求：
1. 使用 JSON 存储不同品类的属性（手机有屏幕尺寸、相机像素；衣服有尺寸、材质等）
2. 设计生成列用于高效查询关键属性
3. 编写 JSON 查询 SQL 实现：查找屏幕 > 6 英寸的手机，或 材质 = '棉' 的衣服
4. 对比 JSON 方案和传统 EAV（Entity-Attribute-Value）方案的优劣
