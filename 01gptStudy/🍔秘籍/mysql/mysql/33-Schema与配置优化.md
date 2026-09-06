# 第33章 Schema 与配置优化

## 本章目标

1. 熟练掌握数据库设计的三大范式（1NF、2NF、3NF）及其实际应用
2. 理解何时需要反范式化（Denormalization）及权衡
3. 精通字段类型选择的最佳实践（INT vs BIGINT, CHAR vs VARCHAR, DATETIME vs TIMESTAMP 等）
4. 理解 NULL 值的代价及最佳使用策略
5. 掌握垂直分表和水平分表/分区的概念和应用场景
6. 深入掌握 InnoDB 核心配置参数的含义和调优方法
7. 能够输出生产级别的 my.cnf 配置文件

## 前置知识

- 了解关系型数据库的基本概念（表、列、行、主键、外键）
- 理解 InnoDB 存储引擎的基本原理
- 具备基本的 MySQL 使用经验
- 了解硬件基础知识（SSD vs HDD, 内存大小, IOPS 等）

---

## 33.1 数据库范式

### 33.1.1 第一范式（1NF）：原子性

**定义**：每个列必须是原子的，不可再分的。不允许有重复组或多值列。

```sql
-- 违反 1NF 的设计
CREATE TABLE student (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  phone1 VARCHAR(20),    -- 违反！重复组
  phone2 VARCHAR(20),    -- 违反！重复组
  courses VARCHAR(200)   -- 违反！多值列："Math,English,Physics"
);

-- 符合 1NF 的设计
CREATE TABLE student (
  id INT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE student_phone (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES student(id)
);

CREATE TABLE student_course (
  student_id INT NOT NULL,
  course_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (student_id, course_name),
  FOREIGN KEY (student_id) REFERENCES student(id)
);
```

**原子性的灰色地带**：

```sql
-- address 列：是否原子？
CREATE TABLE users (
  id INT PRIMARY KEY,
  address VARCHAR(500)  -- "北京市朝阳区建国路100号"
);

-- 如果业务永远只需要完整地址 → 原子（OK）
-- 如果需要按城市/省份筛选 → 非原子（需要拆分）
CREATE TABLE users (
  id INT PRIMARY KEY,
  province VARCHAR(50),
  city VARCHAR(50),
  district VARCHAR(50),
  detail_address VARCHAR(300)
);
```

### 33.1.2 第二范式（2NF）：完全函数依赖

**定义**：在 1NF 基础上，非主键列必须完全依赖于**整个**主键（而非部分主键）。仅适用于复合主键。

```sql
-- 违反 2NF 的设计
CREATE TABLE order_items (
  order_id INT NOT NULL,    -- PK 的一部分
  product_id INT NOT NULL,  -- PK 的一部分
  product_name VARCHAR(100), -- 违反！仅依赖于 product_id，不依赖于 order_id
  quantity INT,              -- OK：依赖于 (order_id, product_id) 整体
  price DECIMAL(10,2),       -- OK：依赖于 (order_id, product_id) 整体
  PRIMARY KEY (order_id, product_id)
);

-- 符合 2NF 的设计
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE order_items (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT,
  price DECIMAL(10,2),     -- 这个价格是"下单时的快照价格"
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
-- product_name 移到 products 表，通过 product_id 关联
```

### 33.1.3 第三范式（3NF）：消除传递依赖

**定义**：在 2NF 基础上，非主键列必须只依赖于主键，不能存在传递依赖。

```sql
-- 违反 3NF 的设计
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  dept_id INT,
  dept_name VARCHAR(100),   -- 违反！依赖于 dept_id，而非直接依赖于 id
  dept_manager VARCHAR(50)  -- 违反！同样依赖于 dept_id
);
-- id → dept_id → dept_name（传递依赖）

-- 符合 3NF 的设计
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  manager VARCHAR(50)
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  dept_id INT,
  FOREIGN KEY (dept_id) REFERENCES departments(id)
);
-- dept_name 和 dept_manager 移到 departments 表
```

### 33.1.4 何时反范式

**反范式化的目的**：用存储空间和写入成本换取查询性能。

```sql
-- 场景：电商订单列表页需要展示订单基本信息 + 用户名
-- 每次查询需要 JOIN users 表

-- 范式化设计（需要 JOIN）
SELECT o.order_no, o.total_amount, o.status, u.name AS user_name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at >= '2024-01-01';

-- 反范式化设计（冗余 username）
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(50) NOT NULL,  -- 冗余！但避免了 JOIN
  order_no VARCHAR(20),
  total_amount DECIMAL(12,2),
  status VARCHAR(20),
  created_at DATETIME
);

-- 反范式的好处：查询不需要 JOIN，速度更快
-- 反范式的代价：用户名更新时需要同步修改所有历史订单
--   （但历史订单的用户名通常不需要更新——这就是合适的冗余时机！）
```

**反范式化决策矩阵**：

```
+--------------------------------------------+
| 反范式化的条件                               |
+--------------------------------------------+
| 1. 数据很少更新（或更新时容忍不一致）           |
| 2. 查询频率远高于写入频率                      |
| 3. 业务上有明显的读取性能需求                   |
| 4. 冗余量合理（不是复制整个表）                 |
| 5. 有机制保证最终一致性                        |
+--------------------------------------------+
```

---

## 33.2 字段类型优化

### 33.2.1 使用最小的数据类型

```sql
-- 错误做法
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,    -- 订单量不可能超过 42 亿 → INT UNSIGNED 就够了
  user_id BIGINT,           -- 同上
  status CHAR(50)           -- CHAR(50) 浪费空间 → VARCHAR(20) 或 TINYINT
);

-- 正确做法
CREATE TABLE orders (
  id INT UNSIGNED PRIMARY KEY,         -- 最大 42 亿（够用）
  user_id INT UNSIGNED NOT NULL,       -- 够用
  status_id TINYINT UNSIGNED NOT NULL, -- 0-255 种状态
  amount DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL
);

-- 整型范围参考
-- TINYINT:   -128 to 127 (SIGNED), 0 to 255 (UNSIGNED)
-- SMALLINT:  -32,768 to 32,767 (SIGNED), 0 to 65,535 (UNSIGNED)
-- MEDIUMINT: -8,388,608 to 8,388,607 (SIGNED), 0 to 16,777,215 (UNSIGNED)
-- INT:       -2,147,483,648 to 2,147,483,647 (SIGNED), 0 to 4,294,967,295 (UNSIGNED)
-- BIGINT:    ±9.22 quintillion

-- 空间节省示例
-- 1000 万行 × (BIGINT 8字节 - INT 4字节) = 40 MB 节省
-- 1000 万行 × (CHAR(50) - VARCHAR(20)) ≈ 300 MB 节省
```

### 33.2.2 NOT NULL 优先

```sql
-- NULL 的代价
-- 1. 每行每个 NULL 列需要 1 字节的 NULL 标志位
-- 2. NULL 使索引更复杂（某些引擎对 NULL 的处理效率较低）
-- 3. NULL 使查询语义复杂（三值逻辑：TRUE / FALSE / UNKNOWN）
-- 4. COUNT(col) 不计算 NULL 值

-- 推荐做法
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY,
  name VARCHAR(50) NOT NULL DEFAULT '',     -- 默认空字符串而不是 NULL
  email VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL DEFAULT '',     -- 没有手机号就用空串
  status TINYINT NOT NULL DEFAULT 1,        -- 默认激活
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 何时使用 NULL 是合理的
-- 1. 可选日期（如 deleted_at，NULL 表示未删除）-- 软删除经典用法
-- 2. 确实需要区分"不存在"和"空值"的场景
-- 3. 外键可以为 NULL（表示可选关联）
```

### 33.2.3 CHAR vs VARCHAR

```sql
-- CHAR(N)：定长，N 字符（不是字节！），最大 255 字符
--   适用：固定长度的代码、ID、哈希值
CREATE TABLE country (
  code CHAR(2) NOT NULL PRIMARY KEY,       -- ISO 国家代码：CN, US, JP
  name VARCHAR(100) NOT NULL
);
-- code CHAR(2)：所有行都占 2 字符，无碎片

-- VARCHAR(N)：变长，N 字符，实际占用 = 数据长度 + 1~2 字节长度前缀
--   适用：可变长度的文本
CREATE TABLE users (
  username VARCHAR(50) NOT NULL,   -- 用户名长度可变
  email VARCHAR(255) NOT NULL,     -- 邮件地址长度可变
  bio VARCHAR(500)                 -- 个人简介长度可变
);

-- 选择建议
-- CHAR：固定长度的编码（MD5、SHA、ISBN、国家代码、邮政编码）
-- VARCHAR：姓名、地址、URL、邮件、描述等可变长度文本
-- VARCHAR 的存储开销：VARCHAR(255) 需要 1 字节长度前缀，VARCHAR(256+) 需要 2 字节
```

### 33.2.4 时间类型选择

```sql
-- DATETIME：8 字节，范围 '1000-01-01 00:00:00' 到 '9999-12-31 23:59:59'
--   - 无时区概念，存储的是字面值
--   - 适合：历史数据、未来日期、不需要时区转换的场景

-- TIMESTAMP：4 字节，范围 '1970-01-01 00:00:01' UTC 到 '2038-01-19 03:14:07' UTC
--   - 自动时区转换（存储时转 UTC，读取时转当前时区）
--   - 适合：记录行创建/更新时间，自动更新功能
--   - 接近 2038 年需要注意临界问题（32 位时间戳溢出）

-- DATE：3 字节，范围 '1000-01-01' 到 '9999-12-31'
--   - 纯日期，不需要时间部分
--   - 适合：生日、入职日期、节日

-- TIME：3 字节，范围 '-838:59:59' 到 '838:59:59'
--   - 适合：时间段、工作时长

-- 推荐
CREATE TABLE users (
  birth_date DATE,                          -- 生日（不需要时间）
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 33.2.5 TEXT / BLOB 的独立存储

```sql
-- 不推荐：将 TEXT 列与常用列放在同一表中
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,              -- TEXT 列拖慢全表扫描
  price DECIMAL(10,2),
  stock INT
);

-- 推荐：将大字段分离到扩展表
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200),
  price DECIMAL(10,2),
  stock INT,
  status TINYINT,
  created_at DATETIME
) ENGINE=InnoDB ROW_FORMAT=COMPACT;

CREATE TABLE product_details (
  product_id INT PRIMARY KEY,
  description TEXT,              -- 只在查看详情页时才读取
  specifications JSON,           -- JSON 格式的规格参数
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 好处：
-- 1. 主表行紧凑，全表扫描快
-- 2. Buffer Pool 中可以缓存更多主表行
-- 3. 大部分查询只访问主表，不需要加载 TEXT
```

### 33.2.6 DECIMAL vs FLOAT/DOUBLE

```sql
-- DECIMAL(M, D)：精确十进制，适合金额
-- FLOAT/DOUBLE：近似值，适合科学计算

-- 错误：用 FLOAT 存金额
CREATE TABLE payments (
  id INT PRIMARY KEY,
  amount FLOAT  -- 0.1 + 0.2 可能不等于 0.3！
);

-- 正确：用 DECIMAL 存金额
CREATE TABLE payments (
  id INT PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL  -- 精确到分，最大 9,999,999,999.99
);

-- DECIMAL 精度选择建议
-- 商品价格：DECIMAL(10,2)  -- 最高 99,999,999.99
-- 订单金额：DECIMAL(12,2)  -- 最高 9,999,999,999.99
-- 汇率：DECIMAL(18,8)      -- 需要更高精度
```

### 33.2.7 枚举类型的最佳替代

```sql
-- 避免使用 ENUM 类型（原因见常见错误）
CREATE TABLE orders (
  id INT PRIMARY KEY,
  status ENUM('pending','paid','shipped','delivered','cancelled')
  -- 问题：增加新状态需要 ALTER TABLE（锁表）
  -- 问题：顺序基于插入顺序而非预期逻辑顺序
);

-- 推荐：使用 TINYINT + 查找表（或应用层常量）
CREATE TABLE order_status (
  id TINYINT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  description VARCHAR(100)
);

INSERT INTO order_status VALUES
(1, 'pending', '待支付'),
(2, 'paid', '已支付'),
(3, 'shipped', '已发货'),
(4, 'delivered', '已签收'),
(5, 'cancelled', '已取消');

CREATE TABLE orders (
  id INT PRIMARY KEY,
  status_id TINYINT NOT NULL DEFAULT 1,  -- 1 = pending
  FOREIGN KEY (status_id) REFERENCES order_status(id)
);
```

---

## 33.3 表的垂直分割

### 33.3.1 什么时候需要垂直分割

```sql
-- 场景：一张有很多列的表，不同业务场景访问不同的列

-- 分割前
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200),         -- 列表页需要
  price DECIMAL(10,2),       -- 列表页需要
  stock INT,                 -- 列表页需要
  image_url VARCHAR(500),    -- 列表页需要
  description TEXT,          -- 仅详情页需要
  spec_json JSON,            -- 仅详情页需要
  seo_title VARCHAR(200),    -- 仅 SEO 需要
  seo_keywords VARCHAR(500), -- 仅 SEO 需要
  created_at DATETIME,
  updated_at DATETIME
);

-- 分割后：主表 + 详情表 + SEO 表
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200),
  price DECIMAL(10,2),
  stock INT,
  image_url VARCHAR(500),
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE product_details (
  product_id INT PRIMARY KEY,
  description TEXT,
  spec_json JSON
);

CREATE TABLE product_seo (
  product_id INT PRIMARY KEY,
  seo_title VARCHAR(200),
  seo_keywords VARCHAR(500),
  seo_description TEXT
);

-- 好处：
-- 列表查询：SELECT id, name, price, stock, image_url FROM products;
--   → 扫描紧凑的窄表，更快
-- 详情页查询：JOIN product_details → 仅 1 行 JOIN
-- SEO：独立管理，和商品主流程解耦
```

---

## 33.4 InnoDB 核心配置

### 33.4.1 innodb_buffer_pool_size —— 最重要的参数

```ini
# 这是 InnoDB 性能调优中最重要的参数，没有之一！
# Buffer Pool 缓存了数据页和索引页

# 查看当前缓冲池大小和命中率
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';

# Innodb_buffer_pool_read_requests：逻辑读取次数（包括缓存命中）
# Innodb_buffer_pool_reads：物理读取次数（磁盘读取）
# 命中率 = 1 - (reads / read_requests)

# 理想命中率：> 99%

# 推荐设置
# 专用数据库服务器：物理内存的 50% - 70%
# 共享服务器：物理内存的 30% - 50%
# 最小：至少比数据库热数据大

# 示例：64GB 专用数据库服务器
innodb_buffer_pool_size = 40G

# 大型缓冲池 (>1GB) 建议启用多个实例以减少锁竞争
innodb_buffer_pool_instances = 8  # 设置为 CPU 核心数

# 查看各个实例的使用情况
SELECT * FROM information_schema.INNODB_BUFFER_POOL_STATS\G
```

### 33.4.2 innodb_flush_log_at_trx_commit

```sql
-- 性能与持久性的核心权衡参数

-- 值 = 0：每秒刷新一次 redo log
--   - 最快（不等待磁盘）
--   - 但 MySQL 崩溃可能丢失最近 1 秒的数据
--   - 适合：可容忍少量数据丢失的场景

-- 值 = 1：每次提交都刷新 redo log（默认，最安全）
--   - 保证 ACID 持久性
--   - 最慢（每次 commit 都是一次磁盘写）
--   - 适合：金融、订单等需要强持久性的场景

-- 值 = 2：每次提交写 redo log，每秒刷新到磁盘
--   - 折中方案
--   - MySQL 崩溃不丢数据（redo log 已写入），但 OS 崩溃可能丢 1 秒
--   - 适合：多数互联网业务（配合备用电源/UPS）
```

### 33.4.3 innodb_io_capacity

```ini
# 告诉 InnoDB 底层磁盘的 IOPS 能力
# 影响后台任务（脏页刷新、change buffer 合并等）的执行速度

# 参考值
# HDD (7200 RPM)：~200
# SATA SSD：~2000-5000
# NVMe SSD：~20000-100000
# 云盘（如 AWS gp2/gp3）：根据云盘规格

# 查看当前值
SHOW VARIABLES LIKE 'innodb_io_capacity';
SHOW VARIABLES LIKE 'innodb_io_capacity_max';

# 不正确的配置导致的症状
# - 设置过低：后台 I/O 任务过于保守，脏页积累，Checkpoint
#   - SHOW ENGINE INNODB STATUS 中看到大量 pending writes
# - 设置过高：后台 I/O 过于激进，影响前台查询响应
```

### 33.4.4 连接和线程配置

```ini
# max_connections：最大并发连接数
# 每个连接消耗 ~1-10MB 内存（取决于缓冲区和排序操作）
# 公式：max_connections ≤ 可用 RAM / 每连接内存预估
# 例：16GB 可用 RAM，每连接 ~2MB → max_connections ≈ 8000（但不要设到极限）

max_connections = 500

# thread_cache_size：线程缓存
# 避免频繁创建/销毁连接线程
# 查看缓存命中率
# SHOW STATUS LIKE 'Threads_created';
# SHOW STATUS LIKE 'Connections';
# 如果 Threads_created / Connections 高 → 增大 thread_cache_size
thread_cache_size = 100

# table_open_cache：打开表缓存
# 每个打开的表占用文件描述符
# SHOW STATUS LIKE 'Open_tables';
# SHOW STATUS LIKE 'Opened_tables';
# Opened_tables 不断增长 → 增大 table_open_cache
table_open_cache = 4000

# table_definition_cache：表定义缓存
table_definition_cache = 2000
```

### 33.4.5 其他重要配置

```ini
# 最大允许的数据包大小（影响 BLOB/TEXT 传输、大 INSERT 语句）
max_allowed_packet = 64M

# 临时表最大大小（超过则写入磁盘）
tmp_table_size = 64M
max_heap_table_size = 64M

# 排序缓冲区（per-thread，不宜过大）
sort_buffer_size = 4M

# JOIN 缓冲区（per-thread）
join_buffer_size = 4M

# 读取缓冲区（per-thread）
read_buffer_size = 2M
read_rnd_buffer_size = 8M

# 默认字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 默认存储引擎
default-storage-engine = INNODB

# SQL 模式（推荐严格模式）
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
```

### 33.4.6 生产环境推荐配置模板

```ini
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
# === 基础配置 ===
user = mysql
port = 3306
bind-address = 0.0.0.0
datadir = /var/lib/mysql
socket = /var/run/mysqld/mysqld.sock
pid-file = /var/run/mysqld/mysqld.pid

# === 字符集 ===
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# === 存储引擎 ===
default-storage-engine = INNODB

# === InnoDB 缓冲池 ===
innodb_buffer_pool_size = 40G              # 根据实际内存调整！
innodb_buffer_pool_instances = 8

# === InnoDB 日志 ===
innodb_log_file_size = 2G
innodb_log_files_in_group = 2
innodb_flush_log_at_trx_commit = 1         # 金融/订单场景用 1，其他考虑 2
innodb_flush_method = O_DIRECT             # 绕过 OS 缓存（减少双缓存）

# === InnoDB I/O ===
innodb_io_capacity = 2000                  # 根据磁盘类型调整
innodb_io_capacity_max = 4000

# === InnoDB 其他 ===
innodb_file_per_table = 1                  # 每表独立表空间（推荐）
innodb_flush_neighbors = 0                 # SSD 设为 0
innodb_adaptive_hash_index = ON
innodb_read_io_threads = 8
innodb_write_io_threads = 8

# === 二进制日志 ===
log_bin = /var/log/mysql/binlog
binlog_format = ROW
binlog_expire_logs_seconds = 604800        # 7 天
sync_binlog = 1
max_binlog_size = 1G

# === 慢查询日志 ===
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1
min_examined_row_limit = 1000

# === 错误日志 ===
log_error = /var/log/mysql/error.log
log_error_verbosity = 3

# === 连接相关 ===
max_connections = 500
thread_cache_size = 100
table_open_cache = 4000
table_definition_cache = 2000

# === 缓冲区 ===
sort_buffer_size = 4M
join_buffer_size = 4M
read_buffer_size = 2M
read_rnd_buffer_size = 8M
tmp_table_size = 64M
max_heap_table_size = 64M

# === 其他 ===
max_allowed_packet = 64M
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
explicit_defaults_for_timestamp = 1

# === GTID ===
gtid_mode = ON
enforce_gtid_consistency = ON
```

---

## 常见错误

### 错误 1：滥用 VARCHAR(255)

```
问题：把所有文本列都设为 VARCHAR(255)，不管实际需要多少。

原因：VARCHAR(255) 是很多教程的"默认值"。

影响：浪费存储空间（VARCHAR 只存实际数据+长度前缀，所以影响不大），
      但语义上不清晰，维护者无法获知实际的业务约束。

建议：根据业务需求设置合理的长度。
  - 用户名：VARCHAR(50)
  - 邮箱：VARCHAR(254)（RFC 5321 最大）
  - URL：VARCHAR(2048)
  - 描述：VARCHAR(500) 或 TEXT
```

### 错误 2：使用 ENUM 类型

```
问题：在 MySQL 中使用 ENUM 类型存储状态。

影响：
  1. ALTER TABLE 加新状态需要重建表（MySQL 8.0 之前的版本）
  2. 排序基于插入顺序而非字母顺序
  3. 移植性差（其他数据库不支持）
  4. 数字索引易与字面值混淆：
     SELECT * FROM orders WHERE status = 1;  -- 危险！按 ENUM 索引而非值

建议：使用 TINYINT + 查找表或在应用层用常量维护映射关系
```

### 错误 3：FLOAT/DOUBLE 存储金额

```
问题：使用 FLOAT 或 DOUBLE 存储货币金额。

SELECT 0.1 + 0.2 = 0.3;  -- MySQL 返回 0（不等于！）
-- 原因：浮点数在二进制表示中无法精确表示某些十进制小数

正确做法：使用 DECIMAL(M,D)
  CREATE TABLE transactions (
    amount DECIMAL(12,2) NOT NULL  -- 精确到分
  );
```

### 错误 4：innodb_buffer_pool_size 设置不当

```
症状 1：设置过小 → 频繁磁盘 I/O，Buffer Pool 命中率 < 95%
症状 2：设置过大（接近物理内存）→ OS 开始 SWAP → MySQL 可能被 OOM Killer 杀死

排查：
  SHOW ENGINE INNODB STATUS\G
  -- 查看 BUFFER POOL AND MEMORY 部分的 "Buffer pool hit rate"

建议：
  - 数据总量 < 内存 50%：设 50-60% 内存
  - 数据总量 > 内存：设 70-80% 内存（留足够空间给 OS 和连接）
  - 始终监控 SWAP 使用情况
```

### 错误 5：忘记设置 innodb_file_per_table=1

```
问题：使用共享表空间（ibdata1），删除表后空间不释放，文件越来越大。

解决：
  innodb_file_per_table = 1  # 每个表独立的 .ibd 文件
  # 注意：已有在共享表空间中的表不会自动迁移，需要重建
```

---

## 本章练习

### 练习 1：范式化设计

设计一个在线教育平台的数据库：
1. 包含学生、教师、课程、选课、成绩
2. 分别设计符合 1NF、2NF、3NF 的表结构
3. 标注每一步违反了哪个范式和如何修正
4. 分析哪些地方适合反范式化（如课程详情页频繁查询教师姓名）

### 练习 2：字段类型优化

对以下"不合理的表设计"进行优化，写出原因和优化后的 DDL：
1. 所有列都用 VARCHAR(255)
2. 金额用 FLOAT 存储
3. 时间用 VARCHAR 存储
4. 状态列用 ENUM
5. NULL 到处使用

### 练习 3：InnoDB 配置调优

1. 在测试服务器上：
   - 配置 innodb_buffer_pool_size 分别为默认、1G、4G
   - 每个配置下运行 sysbench 测试
   - 记录 Buffer Pool 命中率、TPS、响应时间
2. 对比 innodb_flush_log_at_trx_commit = 0/1/2 的性能和安全性
3. 测试 innodb_io_capacity 过低时的表现

### 练习 4：表分割实战

1. 创建一个包含 50 列的"超级宽表"
2. 分析不同业务场景的列访问模式
3. 将表垂直分割为 3-4 个子表
4. 测试分割前后的性能差异（全表扫描、列表查询、详情查询）
5. 评估分割方案的优缺点

### 练习 5：配置文件编写

1. 为以下场景编写完整的 my.cnf 文件：
   - 场景 A：16GB 内存，SSD 磁盘，电商读多写少
   - 场景 B：64GB 内存，SSD 磁盘，日志系统写多读少
   - 场景 C：2GB 内存，开发测试环境
2. 解释每个关键参数的设置理由

### 练习 6：综合评估

分析一个旧系统的数据库设计，输出评估报告：
1. 找出不符合范式的设计
2. 找出字段类型不合理的列
3. 找出缺失的索引
4. 评估 InnoDB 配置是否合理
5. 给出完整的改进方案（含优先级排序）
