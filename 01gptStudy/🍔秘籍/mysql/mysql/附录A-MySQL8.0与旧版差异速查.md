# 附录A MySQL 8.0 与旧版差异速查

## 概述

MySQL 8.0 是自 5.7 以来最大的一次版本升级，包含了大量新特性、性能改进和破坏性变更。本附录整理了从 MySQL 5.7 升级到 8.0 时最需要注意的关键差异。

| 特性 | MySQL 5.7 | MySQL 8.0 |
|------|-----------|-----------|
| 默认认证插件 | mysql_native_password | caching_sha2_password |
| 默认字符集 | latin1 | utf8mb4 |
| 默认排序规则 | latin1_swedish_ci | utf8mb4_0900_ai_ci |
| 角色 (Roles) | 不支持 | 支持 |
| 窗口函数 | 不支持 | ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD 等 |
| CTE (公共表表达式) | 不支持 | 支持 WITH 子句 |
| 递归 CTE | 不支持 | 支持 WITH RECURSIVE |
| 降序索引 | 语法被解析但忽略 | 真正支持降序索引 |
| 不可见索引 | 不支持 | 支持 ALTER TABLE ... ALTER INDEX ... INVISIBLE |
| CHECK 约束 | 语法被解析但忽略 | 真正执行 CHECK 约束 |
| 原子 DDL | 不支持 | InnoDB DDL 是原子的(可回滚) |
| JSON 函数 | 基础支持 | 大幅增强(JSON_TABLE, JSON_ARRAYAGG 等) |
| Query Cache | 支持 | 完全移除 |
| SQL_CALC_FOUND_ROWS | 支持 | 已弃用(推荐 COUNT(*) 加窗口函数) |
| tx_isolation | 变量名 | 改为 transaction_isolation |
| tx_read_only | 变量名 | 改为 transaction_read_only |
| expire_logs_days | 变量名 | 弃用→binlog_expire_logs_seconds |
| 自增主键持久化 | 重启可能回退 | 真正持久化(写入redo log) |
| 直方图统计 | 不支持 | 支持 ANALYZE TABLE ... UPDATE HISTOGRAM |
| 资源组 | 不支持 | 支持 Resource Group (线程优先级) |
| 加密表空间 | 基础 | redo log/undo log/系统表也可加密 |

---

## 一、认证与安全

### 1.1 认证插件变更

```sql
-- MySQL 5.7 默认
CREATE USER 'user'@'host' IDENTIFIED BY 'password';
-- 等价于
CREATE USER 'user'@'host' IDENTIFIED WITH mysql_native_password BY 'password';

-- MySQL 8.0 默认
CREATE USER 'user'@'host' IDENTIFIED BY 'password';
-- 等价于
CREATE USER 'user'@'host' IDENTIFIED WITH caching_sha2_password BY 'password';
```

**兼容性解决方案：**

```sql
-- 方案1: 将 8.0 用户认证方式改为旧版(兼容旧客户端)
ALTER USER 'user'@'host' IDENTIFIED WITH mysql_native_password BY 'password';

-- 方案2: 修改 8.0 服务器默认认证插件(my.cnf)
-- [mysqld]
-- default_authentication_plugin=mysql_native_password

-- 方案3: 升级客户端到 8.0 版本(推荐)
-- mysql-connector-java 8.0+, libmysqlclient 8.0+, php 7.4+ 都支持 caching_sha2_password
```

### 1.2 密码管理增强

```sql
-- MySQL 8.0 新增密码管理功能

-- 密码历史(不能重复使用最近的N个密码)
-- [mysqld] password_history = 3

-- 密码重用间隔(不能重复使用N天内的密码)
-- [mysqld] password_reuse_interval = 365

-- 失败登录限制
ALTER USER 'user'@'host' FAILED_LOGIN_ATTEMPTS 5 PASSWORD_LOCK_TIME 2;

-- 密码随机生成
SET PASSWORD FOR 'user'@'host' = 'random';
-- ALTER USER 'user'@'host' IDENTIFIED BY RANDOM PASSWORD;
```

### 1.3 角色管理（全新功能）

```sql
-- MySQL 8.0 全新功能
CREATE ROLE 'app_developer', 'app_readonly', 'app_admin';
GRANT SELECT, INSERT, UPDATE ON app_db.* TO 'app_developer';
GRANT 'app_developer' TO 'dev_user'@'%';
SET DEFAULT ROLE 'app_developer' TO 'dev_user'@'%';
-- MySQL 5.7: 无角色概念，只能逐个用户授权
```

---

## 二、SQL 语法增强

### 2.1 窗口函数（全新功能）

```sql
-- MySQL 8.0 才支持的窗口函数
SELECT
  name,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK() OVER (ORDER BY salary DESC) AS rank_num,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank_num,
  LAG(salary, 1) OVER (ORDER BY hire_date) AS prev_salary,
  LEAD(salary, 1) OVER (ORDER BY hire_date) AS next_salary,
  SUM(salary) OVER (PARTITION BY dept_id) AS dept_total,
  AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg
FROM employees;

-- MySQL 5.7 替代方案(繁琐且性能差)
-- ROW_NUMBER: 使用 @变量
SELECT @row_num := @row_num + 1 AS row_num, name, salary
FROM employees, (SELECT @row_num := 0) r
ORDER BY salary DESC;

-- RANK: 需要更复杂的变量逻辑
```

### 2.2 CTE（公共表表达式）

```sql
-- MySQL 8.0 全新功能

-- 普通 CTE
WITH dept_stats AS (
  SELECT dept_id, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY dept_id
)
SELECT e.name, e.salary, d.avg_sal
FROM employees e
JOIN dept_stats d ON e.dept_id = d.dept_id
WHERE e.salary > d.avg_sal;

-- 递归 CTE
WITH RECURSIVE cte AS (
  SELECT id, name, parent_id, 0 AS level
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, cte.level + 1
  FROM categories c
  JOIN cte ON c.parent_id = cte.id
)
SELECT * FROM cte;

-- MySQL 5.7: 需要存储过程循环或多次子查询实现
```

### 2.3 CHECK 约束（真正生效）

```sql
-- MySQL 8.0: CHECK 约束真正生效
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2) CHECK (price > 0),
  stock INT CHECK (stock >= 0)
);
-- INSERT INTO products VALUES (1, 'test', -5, 10); -- 报错！

-- MySQL 5.7: CHECK 语法被解析但忽略(不检查)
-- 相同的 INSERT 不会报错
```

### 2.4 降序索引

```sql
-- MySQL 8.0: 降序索引真正生效
CREATE INDEX idx_a_b_desc ON test_table(a ASC, b DESC);

-- EXPLAIN 查看：
-- Key_name: idx_a_b_desc
-- Collation: A,D  (Ascending, Descending)

-- MySQL 5.7: DESC 关键字被解析但忽略(仍创建升序索引)
-- Collation 始终显示 A,A
```

### 2.5 不可见索引

```sql
-- MySQL 8.0 全新功能：测试索引效果无需删除索引
CREATE INDEX idx_test ON products(name) INVISIBLE;

-- 当前会话可使用不可见索引
SET SESSION optimizer_switch = 'use_invisible_indexes=on';

-- 切换可见性
ALTER TABLE products ALTER INDEX idx_test VISIBLE;
ALTER TABLE products ALTER INDEX idx_test INVISIBLE;

-- 应用场景：
-- 1. 测试删除某个索引对性能的影响(设为INVISIBLE而不是DROP)
-- 2. 避免误用某个刚创建的索引
```

---

## 三、JSON 功能大幅增强

```sql
-- MySQL 8.0 新增的重要 JSON 函数

-- JSON_TABLE: 将 JSON 转换为关系表
SELECT jt.* FROM users,
JSON_TABLE(users.data, '$.projects[*]' COLUMNS (
  project_name VARCHAR(100) PATH '$.name',
  project_role VARCHAR(100) PATH '$.role'
)) AS jt;

-- JSON_ARRAYAGG: 聚合为 JSON 数组
SELECT dept_id, JSON_ARRAYAGG(name) FROM employees GROUP BY dept_id;

-- JSON_OBJECTAGG: 聚合为 JSON 对象
SELECT dept_id, JSON_OBJECTAGG(id, name) FROM employees GROUP BY dept_id;

-- JSON_PRETTY: 格式化 JSON 输出
SELECT JSON_PRETTY(data) FROM users;

-- JSON_STORAGE_SIZE: 获取 JSON 占用存储空间
SELECT JSON_STORAGE_SIZE(data) FROM users;

-- JSON_MERGE_PATCH: RFC 7396 标准的合并
SELECT JSON_MERGE_PATCH('{"a":1,"b":2}', '{"b":3,"c":4}');
-- 结果: {"a":1, "b":3, "c":4}

-- JSON_OVERLAPS (8.0.17+): 两个 JSON 数组是否有交集
SELECT JSON_OVERLAPS('["a","b"]', '["b","c"]');  -- 1
```

---

## 四、InnoDB 改进

### 4.1 原子 DDL

```sql
-- MySQL 8.0: DDL 操作在 InnoDB 中是原子的
-- 如果 DDL 中途崩溃，整个操作会被回滚，不会产生半成品表

-- MySQL 5.7: 如果 ALTER TABLE 中途崩溃，表可能损坏

-- 相关新变量：
-- ddl_log_crash_recovery: DDL 日志崩溃恢复
```

### 4.2 自增值持久化

```sql
-- MySQL 8.0: 自增值持久化到 Redo Log（不再回退）
-- 重启后自增值不会减少

-- MySQL 5.7: 自增值存在内存中，重启后可能回退到 MAX(id)+1
-- 如果之前删除了最大的几行，重启后 AUTO_INCREMENT 会变小
-- 解决方案：每次重启后执行 ALTER TABLE ... AUTO_INCREMENT = ...;

-- 演示：
-- MySQL 5.7: INSERT → 自增值=100 → DELETE 90-100 → 重启 → 自增值可能变成 91
-- MySQL 8.0: INSERT → 自增值=100 → DELETE 90-100 → 重启 → 自增值仍是 101
```

### 4.3 缓冲池改进

```sql
-- MySQL 8.0: innodb_buffer_pool_size 可以动态调整（无需重启）
SET GLOBAL innodb_buffer_pool_size = 8589934592;  -- 8G

-- MySQL 5.7: innodb_buffer_pool_size 修改需要重启（或使用 chunk 方式）

-- MySQL 8.0: innodb_buffer_pool_in_core_file 可控制是否包含在 core dump 中
```

### 4.4 Undo 表空间管理

```sql
-- MySQL 8.0: 支持独立 Undo 表空间的管理
CREATE UNDO TABLESPACE undo_003 ADD DATAFILE 'undo_003.ibu';
ALTER UNDO TABLESPACE undo_003 SET INACTIVE;
DROP UNDO TABLESPACE undo_003;

-- innodb_undo_log_truncate: 自动截断 Undo Log
-- MySQL 5.7: Undo 表空间创建后无法删除
```

---

## 五、字符集与排序规则

### 5.1 默认字符集变更

```sql
-- MySQL 5.7 默认
SHOW VARIABLES LIKE 'character_set_server';  -- latin1
SHOW VARIABLES LIKE 'collation_server';      -- latin1_swedish_ci

-- MySQL 8.0 默认
SHOW VARIABLES LIKE 'character_set_server';  -- utf8mb4
SHOW VARIABLES LIKE 'collation_server';      -- utf8mb4_0900_ai_ci

-- 影响：
-- 1. CREATE TABLE 不使用 CHARACTER SET 时，默认 utf8mb4
-- 2. utf8mb4 完整支持 emoji (4 字节) vs utf8mb3(MySQL的utf8) 只支持 3 字节
-- 3. 新排序规则基于 Unicode 9.0 (0900)

-- 迁移注意事项：
-- 如果 5.7 使用了 utf8（实际是 utf8mb3），存储 emoji 会失败
-- 升级到 8.0 后，utf8 仍是 utf8mb3 的别名（为了兼容）
-- 但建议显式使用 utf8mb4
```

### 5.2 utf8 的含义

```sql
-- MySQL 中 utf8 的真实含义：
-- MySQL 5.7/8.0 中: utf8 → utf8mb3（最多 3 字节，不支持 emoji）
-- 真正的 UTF-8 是 utf8mb4（最多 4 字节）

-- 建议：
-- 始终使用 utf8mb4 而不是 utf8
ALTER TABLE mytable CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

---

## 六、复制改进

### 6.1 复制语法变更

```sql
-- MySQL 8.0.23+ (新语法)
CHANGE REPLICATION SOURCE TO SOURCE_HOST='master', SOURCE_LOG_FILE='binlog.000001', SOURCE_LOG_POS=4;
START REPLICA;
SHOW REPLICA STATUS;

-- MySQL 5.7 (旧语法，8.0 仍兼容)
CHANGE MASTER TO MASTER_HOST='master', MASTER_LOG_FILE='binlog.000001', MASTER_LOG_POS=4;
START SLAVE;
SHOW SLAVE STATUS;
```

### 6.2 基于 WRITESET 的并行复制

```sql
-- MySQL 8.0: 新增 binlog_transaction_dependency_tracking = WRITESET
-- 基于写入集合的并行复制(对同一个行的写事务不能并行，不同行可以)
-- 比 5.7 的 COMMIT_ORDER 有更高的并行度

-- [mysqld]
-- binlog_transaction_dependency_tracking = WRITESET
-- slave_parallel_type = LOGICAL_CLOCK
-- slave_parallel_workers = 8
```

### 6.3 克隆插件（全新功能）

```sql
-- MySQL 8.0.17+: Clone 插件，物理克隆实例
-- 安装插件
INSTALL PLUGIN clone SONAME 'mysql_clone.so';

-- 从远程克隆
CLONE INSTANCE FROM 'repl'@'master_host':3306
  IDENTIFIED BY 'password';

-- 比 mysqldump 快得多(物理复制)
-- 用于快速创建新的 Slave
```

---

## 七、移除与弃用的功能

### 7.1 Query Cache 完全移除

```sql
-- MySQL 8.0: Query Cache 已被移除
-- 相关变量如 query_cache_size, query_cache_type 都不存在了

-- MySQL 5.7: 默认 query_cache_size = 1M, query_cache_type = OFF
-- Query Cache 在高并发下效果很差(全局锁竞争)，8.0 完全移除

-- 替代方案：应用层缓存(Redis, Memcached)
```

### 7.2 SQL_CALC_FOUND_ROWS 弃用

```sql
-- MySQL 5.7 方式:
SELECT SQL_CALC_FOUND_ROWS * FROM users LIMIT 10;
SELECT FOUND_ROWS();  -- 获取不带 LIMIT 的总行数

-- MySQL 8.0 替代方案:
SELECT COUNT(*) OVER () AS total_rows, u.*
FROM users u LIMIT 10;
-- 或执行两个独立查询
```

### 7.3 其他弃用的功能

```sql
-- 1. 分区引擎（非 InnoDB 的分区）不再支持
-- 2. PROCEDURE ANALYSE() 已移除
-- 3. 旧的密码哈希函数 PASSWORD() 已弃用
-- 4. INFORMATION_SCHEMA 中的一些视图被 performance_schema 替代
-- 5. mysql_install_db 被 mysqld --initialize 替代
-- 6. ERROR_FOR_DIVISION_BY_ZERO, NO_ZERO_DATE, NO_ZERO_IN_DATE 
--    在 strict mode 下默认包含在 sql_mode 中(8.0中默认strict)
```

---

## 八、配置变量重命名

| MySQL 5.7 变量名 | MySQL 8.0 变量名 | 说明 |
|-----------------|-----------------|------|
| tx_isolation | transaction_isolation | 事务隔离级别 |
| tx_read_only | transaction_read_only | 只读事务 |
| expire_logs_days | binlog_expire_logs_seconds | binlog 过期时间 |
| master_info_repository | (移除，自动使用TABLE) | 复制信息存储方式 |
| relay_log_info_repository | (移除，自动使用TABLE) | relay log 信息存储 |
| sync_relay_log_info | (移除) | |
| innodb_locks_unsafe_for_binlog | (移除) | |
| internal_tmp_disk_storage_engine | (移除) | |

---

## 九、升级前检查清单

1. **兼容性检查**
   ```bash
   mysqlcheck -u root -p --all-databases --check-upgrade
   # 或
   mysqlsh -- util checkForServerUpgrade root@localhost
   ```

2. **认证插件兼容性**：确认所有客户端支持 caching_sha2_password

3. **字符集检查**：确认 utf8/utf8mb3 的数据是否需要转为 utf8mb4

4. **保留字检查**：MySQL 8.0 新增了保留字（如 `GROUPS`, `RANK`, `LEADING`, `SYSTEM`, `WINDOW` 等）

5. **SQL_MODE 检查**：8.0 默认包含更多的 strict mode

6. **分区表检查**：非 InnoDB 的分区表需要迁移

7. **触发器/存储过程**：检查是否使用了弃用的函数

8. **配置变量**：检查配置文件中的旧变量名

9. **第三方工具兼容性**：确认备份工具、监控工具、ORM 框架等支持 8.0

10. **备份数据**：升级前务必全量备份！

---

## 本章练习

### 练习 1：版本差异实践

1. 安装 MySQL 5.7 和 8.0 各一个实例
2. 在两个版本上分别执行同样的 SQL，对比差异
3. 演示缓存代理插件差异（mysql_native_password vs caching_sha2_password）
4. 演示 CHECK 约束在 5.7 被忽略、8.0 生效
5. 演示窗口函数在 5.7 的替代写法 vs 8.0 原生语法

### 练习 2：升级演练

1. 在一个 MySQL 5.7 测试实例上进行完整的升级演练
2. 执行升级前检查，解决所有警告
3. 备份数据库
4. 执行升级（In-Place Upgrade 或 Logical Upgrade）
5. 验证升级后所有应用功能正常
6. 记录每步的操作和耗时
