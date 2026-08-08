# 第3章：连接 MySQL 与第一个查询

## 本章目标
学完本章后，你将能够：
1. 熟练使用 mysql 命令行客户端连接本地和远程 MySQL 服务器
2. 理解 mysql 客户端的常用选项（-u、-p、-h、-P、-D）及其含义
3. 执行你的第一个 SQL 查询并理解返回结果
4. 使用 SHOW 系列命令浏览数据库元数据（数据库列表、表列表、表结构）
5. 了解 MySQL 的 4 个系统数据库及其用途
6. 使用图形化工具（MySQL Workbench、DBeaver）管理数据库

## 前置知识
- 第2章：MySQL 已安装完毕，服务已正常启动，已设置好 root 密码

---

## 3.1 mysql 命令行客户端

### 什么是 mysql 客户端

`mysql` 是 MySQL 官方提供的命令行客户端程序（通常位于 `bin/mysql.exe` 或 `/usr/bin/mysql`）。它是一个"命令行交互式 Shell"——你在里面输入 SQL 语句，它将语句发送到 MySQL 服务器，然后把结果打印给你。

需要注意区分两个概念：
- `mysqld`：MySQL **服务器**守护进程（daemon），负责存储和管理数据。`d` 表示 daemon
- `mysql`：MySQL **客户端**程序，用于连接服务器并执行 SQL 命令

### 基本连接语法

```
mysql [OPTIONS] [database_name]
```

### 常用选项详解

| 选项 | 短选项 | 长选项 | 说明 | 示例 |
|------|--------|--------|------|------|
| 用户名 | `-u` | `--user` | 登录用户名 | `-u root` |
| 密码 | `-p` | `--password` | 密码（`-p` 后不直接跟密码则为交互式输入） | `-p` 或 `-pMyPassword` |
| 主机 | `-h` | `--host` | 服务器主机名或 IP | `-h localhost` 或 `-h 192.168.1.100` |
| 端口 | `-P` | `--port` | 服务器端口号（注意：是大写 `P`！） | `-P 3306` |
| 数据库 | `-D` | `--database` | 连接后直接使用的数据库 | `-D school` |
| 执行语句 | `-e` | `--execute` | 执行一条语句后退出（非交互模式） | `-e "SELECT VERSION()"` |
| 协议 | | `--protocol` | 连接协议（TCP/SOCKET/PIPE/MEMORY） | `--protocol=TCP` |
| 字符集 | | `--default-character-set` | 客户端字符集 | `--default-character-set=utf8mb4` |

### 连接示例

```bash
# 1. 最简单的本地连接（交互式输入密码）
mysql -u root -p

# 2. 指定主机和端口的连接
mysql -u root -p -h 127.0.0.1 -P 3306

# 3. 连接并直接指定要使用的数据库
mysql -u root -p -D mysql

# 4. 非交互模式：执行单条语句后退出（适合脚本）
mysql -u root -p密码 -e "SELECT VERSION(); SELECT NOW();"
# 注意：-p和密码之间不要有空格！-pMyPassword（正确） vs -p MyPassword（错误）
# 但也请注意，在命令行中明文写密码是不安全的（会被 shell history 记录）

# 5. 从外部 SQL 文件执行（导入）
mysql -u root -p < backup.sql

# 6. 通过 source 命令在 mysql 交互模式中执行文件
mysql> source /path/to/script.sql
# 或简写
mysql> \. /path/to/script.sql
```

> **密码安全性警告**：在命令行使用 `-p密码`（密码紧跟在 `-p` 后不加空格）会明文暴露密码。一方面会出现在 shell 历史记录中，另一方面其他用户可以通过 `ps` 命令看到。建议使用 `-p` 的交互式输入方式，或者将密码存储在配置文件 `~/.my.cnf` 中。

### 安全的密码管理

```bash
# Linux/Mac: 在 ~/.my.cnf 中设置（权限建议设为 600）
cat > ~/.my.cnf << 'EOF'
[client]
user=root
password=你的密码
host=localhost
EOF
chmod 600 ~/.my.cnf

# 之后可以直接无密码登录
mysql
```

---

## 3.2 连接本地与远程 MySQL

### 连接本地 MySQL

**本地连接**指的是客户端和服务器在同一台机器上。地址通常用：
- `localhost` → 尝试 Unix socket（Linux）或共享内存（Windows），速度最快
- `127.0.0.1` → 强制走 TCP/IP 协议栈，即使是本机

```bash
# 本地连接四种方式
mysql -u root -p                              # 默认 localhost
mysql -u root -p -h localhost                 # 明确指定 localhost
mysql -u root -p -h 127.0.0.1 -P 3306       # TCP 方式连接本地
mysql -u root -p --protocol=TCP -h 127.0.0.1 # 强制 TCP 协议
```

> **localhost vs 127.0.0.1 的一个坑**：在某些 MySQL 配置下，`-h localhost` 会走 Unix socket 连接（Linux/Mac），而 `-h 127.0.0.1` 走 TCP 连接。这两者在 MySQL 的用户权限体系中属于不同的 entry——`'root'@'localhost'` 和 `'root'@'127.0.0.1'` 是两个不同的用户账号！这就是为什么有时候 `mysql -u root -p -h localhost` 能连上，但 `mysql -u root -p -h 127.0.0.1` 却报 Access Denied 的原因。

### 连接远程 MySQL

**远程连接**指的是客户端和服务器在不同机器上。

```bash
# 远程连接
mysql -u username -p -h 192.168.1.100 -P 3306
```

远程连接的前提条件：

1. **服务端监听网络接口**：修改配置文件
```ini
[mysqld]
bind-address = 0.0.0.0    # 0.0.0.0 表示监听所有网卡
# 或监听特定 IP
bind-address = 192.168.1.100
```

2. **防火墙开放 3306 端口**：

```bash
# Linux (firewalld)
sudo firewall-cmd --add-port=3306/tcp --permanent
sudo firewall-cmd --reload

# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 3306 -j ACCEPT

# Windows
# 控制面板 → Windows Defender 防火墙 → 高级设置 → 入站规则 → 新建规则 → 端口 3306
```

3. **用户权限允许远程访问**：

```sql
-- 创建可从任意主机连接的用户
CREATE USER 'myuser'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';

-- 或限制特定 IP
CREATE USER 'myuser'@'192.168.1.50' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT ON mydb.* TO 'myuser'@'192.168.1.50';

FLUSH PRIVILEGES;
```

> **安全建议**：不要轻易允许 root 远程连接！为远程连接单独创建受限用户，并限制来源 IP。

---

## 3.3 进入 MySQL 的世界：mysql 提示符

成功连接后，你会看到：

```
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.0.36 MySQL Community Server - GPL

Copyright (c) 2000, 2024, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

最后的 `mysql>` 就是提示符（prompt），表示 MySQL 正在等待你输入 SQL 命令。

### 提示符的含义

`mysql>` 是最简单的默认提示符。你可以通过 `prompt` 命令自定义提示符来显示更多有用信息：

```sql
-- 自定义提示符：显示 用户名@主机名 [当前数据库]>
prompt \u@\h [\d]>\_

-- 这会让提示符变成：
-- root@localhost [(none)]>
-- 选库后变：
-- root@localhost [school]>

-- 如果你想让这个设置永久生效，写入 my.cnf 的 [mysql] 节：
-- [mysql]
-- prompt=\u@\h [\d]>\_
```

常用的 prompt 转义字符：

| 转义符 | 含义 |
|--------|------|
| `\u` | 当前用户名 |
| `\h` | 主机名 |
| `\d` | 当前数据库名 |
| `\D` | 完整日期 |
| `\t` | 当前时间 |
| `\n` | 换行 |
| `\_` | 空格 |
| `\R` | 当前时间（24小时制，秒） |
| `\m` | 分钟 |
| `\p` | 端口号 |
| `\v` | 服务器版本 |

---

## 3.4 第一个查询：Hello, MySQL!

SQL 语句以分号（`;`）结束。输入以下内容，看看 MySQL 返回什么：

```sql
-- 查询 MySQL 服务器版本
SELECT VERSION();
-- 返回类似: 8.0.36

-- 查询当前日期和时间
SELECT NOW();
-- 返回类似: 2026-07-09 14:30:00

-- 查询当前登录的用户
SELECT USER();
-- 返回类似: root@localhost

-- 查询当前选中的数据库
SELECT DATABASE();
-- 刚开始返回 NULL（还没有选择数据库）

-- 可以做简单计算
SELECT 1 + 1;
-- 返回: 2

SELECT 100 * 0.85;
-- 返回: 85.00

-- 可以一次执行多条语句
SELECT VERSION(); SELECT NOW(); SELECT USER();
```

> **分号的重要性**：MySQL 默认用分号作为语句的结束符。如果你按了回车没有分号，MySQL 会等待你继续输入（认为语句还没结束）。这时候行首会变成 `->` 或 `'>` 等，表示还在等待输入。输入 `;` 并按回车，或者按 `\c` 取消当前输入。

### SQL 语句的书写规范

```sql
-- ✅ 推荐：关键字大写，表名列名小写，合理换行
SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1;

-- ✅ 也可以：全小写（MySQL 不区分 SQL 关键字的大小写）
select column1, column2 from table_name where condition;

-- ❌ 不推荐：全大写（难阅读）
SELECT COLUMN1, COLUMN2 FROM TABLE_NAME WHERE CONDITION;
```

---

## 3.5 探索数据库：SHOW 系列命令

SHOW 命令是探索 MySQL 服务器状态的利器。它不属于标准 SQL（是 MySQL 扩展），但非常实用。

### SHOW DATABASES —— 列出所有数据库

```sql
SHOW DATABASES;
-- +--------------------+
-- | Database           |
-- +--------------------+
-- | information_schema |
-- | mysql              |
-- | performance_schema |
-- | sys                |
-- +--------------------+
```

刚安装的 MySQL 有 4 个系统数据库（你还没有创建自己的数据库）：

| 数据库 | 用途 |
|--------|------|
| **mysql** | 核心系统库，存储用户账号、权限、时区、帮助信息等元数据 |
| **information_schema** | 信息模式库，提供数据库元信息的只读视图（有哪些表、列、索引等）。符合 ANSI SQL 标准 |
| **performance_schema** | 性能模式库，收集服务器运行时性能数据（查询耗时、锁等待、内存使用等） |
| **sys** | 系统库，基于 performance_schema 和 information_schema 的友好视图（MySQL 5.7+）。提供 `sys.schema_*` 等易用的诊断视图 |

```sql
-- 过滤数据库名
SHOW DATABASES LIKE '%schema%';
-- 显示名称中包含 "schema" 的数据库

SHOW DATABASES LIKE 'm%';
-- 显示以 "m" 开头的数据库
```

### USE —— 选择当前数据库

在进行表操作和查询之前，需要先选择要使用的数据库：

```sql
-- 切换到 mysql 系统库
USE mysql;
-- 提示: Database changed

-- 查看当前数据库
SELECT DATABASE();
-- +------------+
-- | DATABASE() |
-- +------------+
-- | mysql      |
-- +------------+
```

### SHOW TABLES —— 列出当前数据库的所有表

```sql
USE mysql;
SHOW TABLES;
-- +------------------------------------------------------+
-- | Tables_in_mysql                                      |
-- +------------------------------------------------------+
-- | columns_priv                                         |
-- | component                                            |
-- | db                                                   |
-- | default_roles                                        |
-- | engine_cost                                          |
-- | ...                                                  |
-- | user                                                 |
-- +------------------------------------------------------+
```

### DESCRIBE / DESC —— 查看表结构

```sql
-- 查看 user 表的结构
DESCRIBE mysql.user;
-- 或简写
DESC mysql.user;

-- 输出包含：Field(列名), Type(数据类型), Null, Key, Default, Extra
```

### SHOW CREATE DATABASE / TABLE —— 查看创建语句

```sql
-- 查看数据库的创建语句（包含字符集和排序规则）
SHOW CREATE DATABASE mysql\G

-- 查看表的创建语句（包含所有列定义、索引、引擎等完整定义）
SHOW CREATE TABLE mysql.user\G
```

---

## 3.6 深入了解系统数据库

虽然平时开发一般不直接操作系统数据库，但了解它们对于调试问题和性能优化很有帮助。

### mysql 系统库

存储 MySQL 运行所需的核心元数据，最重要的一些表：

| 表名 | 内容 |
|------|------|
| `user` | 用户账号和全局权限 |
| `db` | 数据库级别的权限 |
| `tables_priv` | 表级别的权限 |
| `columns_priv` | 列级别的权限 |
| `procs_priv` | 存储过程和函数的权限 |
| `general_log` | 通用查询日志（如果启用） |
| `slow_log` | 慢查询日志（如果启用） |
| `time_zone_name` | 时区信息 |

```sql
-- 查看所有用户
SELECT User, Host FROM mysql.user;

-- 查看当前用户的权限
SHOW GRANTS FOR CURRENT_USER();
```

### information_schema 系统库

符合 ANSI SQL 标准的元数据视图。当你使用 SHOW DATABASES、SHOW TABLES 时，MySQL 实际上就是从 information_schema 中查询的。

```sql
-- 查看所有数据库（和使用 SHOW DATABASES 一样的效果）
SELECT SCHEMA_NAME FROM information_schema.SCHEMATA;

-- 查看 school 数据库中的所有表
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'school';

-- 查看 student 表的所有列
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'school' AND TABLE_NAME = 'student';
```

### performance_schema 系统库

性能监控的宝库。它以非常低的性能开销收集运行时事件数据。

```sql
-- 查看当前所有连接
SELECT * FROM performance_schema.processlist;

-- 查看最近执行的语句
SELECT * FROM performance_schema.events_statements_history
ORDER BY TIMER_START DESC LIMIT 10;
```

### sys 系统库

sys 库把 performance_schema 的复杂数据做了一层封装，让监控更简单。

```sql
-- 查看最耗时的语句
SELECT * FROM sys.statement_analysis LIMIT 10;

-- 查看表上的 I/O 统计
SELECT * FROM sys.io_global_by_file_by_bytes LIMIT 10;

-- 查看冗余索引
SELECT * FROM sys.schema_redundant_indexes;
```

---

## 3.7 mysql 客户端常用命令（快捷方式）

在 `mysql>` 提示符下，除了 SQL 语句，还有一些 mysql 客户端内置命令可用。这些命令以反斜杠 `\` 开头：

| 命令 | 短写 | 功能 |
|------|------|------|
| `help` | `\h` | 显示帮助 |
| `clear` | `\c` | 清除当前输入（取消一条还没写完的语句） |
| `connect` | `\r` | 重新连接服务器 |
| `exit` / `quit` | `\q` | 退出 mysql 客户端 |
| `status` | `\s` | 显示当前状态（服务器版本、运行时间、当前数据库、字符集等） |
| `source` | `\.` | 执行 SQL 文件 |
| `system` | `\!` | 执行操作系统命令（不退出 mysql） |
| `tee` | `\T` | 将后续所有输出同时写入文件 |
| `notee` | `\t` | 停止 tee |
| `use` | `\u` | 切换数据库 |
| `ego` | `\G` | 发送语句并使用垂直格式显示结果 |
| `go` | `\g` | 发送语句（等同于 `;`） |
| `edit` | `\e` | 用外部编辑器编辑当前语句 |
| `pager` | `\P` | 设置分页程序（如 `\P less`） |
| `nopager` | `\n` | 取消分页设置 |

### 重要的命令详解

**`\G` —— 垂直输出**：当表中列太多，水平显示会折行难以阅读时，用 `\G` 替代 `;` 结尾：

```sql
-- 水平显示（列多时很乱）
SELECT * FROM mysql.user;

-- 垂直显示（每列单独一行，清晰易读）
SELECT * FROM mysql.user\G
```

**`\c` —— 取消当前输入**：

```sql
mysql> SELECT * FROM users WHERE
    -> OOPS我打错了，不想继续了
    -> \c
mysql>   -- 回到干净的提示符
-- 等价于按 Ctrl+C（在 Linux/Mac 端）
```

**`\!` —— 不退出 mysql 执行系统命令**：

```sql
mysql> \! ls -la
-- 列出当前目录的文件，然后自动回到 mysql 提示符

mysql> \! date
-- 显示系统日期

-- Windows 下需要用 cmd 命令
mysql> \! dir
```

**`\T` / `\t` —— 记录输出到文件**：

```sql
mysql> \T /tmp/query_output.txt
mysql> SELECT * FROM large_table;   -- 输出同时写入文件
mysql> \t                        -- 停止记录
```

---

## 3.8 HELP 命令的使用

MySQL 内置了详细的帮助系统，可以直接在 mysql 客户端中查阅：

```sql
-- 查看所有帮助分类
HELP contents;

-- 查看数据操作相关的帮助
HELP Data Manipulation;

-- 查看具体语句的帮助
HELP SELECT;
HELP CREATE TABLE;
HELP SHOW;
HELP INSERT;

-- 查看函数帮助
HELP COUNT;
HELP DATE_FORMAT;
HELP CONCAT;
```

---

## 3.9 MySQL Workbench 图形化管理工具

MySQL Workbench 是 MySQL 官方提供的免费图形化管理工具，功能强大。

### 下载与安装

1. 访问 https://dev.mysql.com/downloads/workbench/
2. 选择对应操作系统下载
3. Windows 上双击 .msi 或 .exe 安装
4. Mac 上下载 DMG 文件双击安装
5. Linux 上可通过 apt/yum 安装：`sudo apt install mysql-workbench`

### 创建连接

1. 打开 Workbench，首页会看到 "MySQL Connections" 区域
2. 点击 `+` 号（或 "Setup New Connection"）
3. 填写连接信息：
   - Connection Name：给连接起个名字（如 "本地 MySQL"）
   - Hostname：127.0.0.1 或远程服务器 IP
   - Port：3306
   - Username：root
   - Password：点击 "Store in Vault..." 输入密码
4. 点击 "Test Connection" 测试连接是否成功
5. 如果成功，点击 OK 保存

### 基本操作

- **运行 SQL**：双击连接进入 → 看到 SQL Editor → 在编辑区写 SQL → 点击闪电图标（或 Ctrl+Enter）执行
- **查看数据**：左侧 Navigator → Schemas → 展开数据库 → 展开 Tables → 右键某表 → "Select Rows - Limit 1000"
- **查看表结构**：右键表 → "Table Inspector" → 可以看到 DDL、列信息、索引信息
- **可视化管理**：右键表 → Create/Alter/Drop Table 等，可图形化操作
- **导入导出**：Server 菜单 → Data Export / Data Import

### Workbench 的优缺点

| 优点 | 缺点 |
|------|------|
| 官方出品，与 MySQL 兼容性最好 | 界面有时卡顿，内存占用较高 |
| ER 图设计功能（逆向工程/正向工程） | Linux 版本部分功能不稳定 |
| 可视化查询执行计划（Visual Explain） | 大结果集显示性能差 |
| 服务器管理（启动/停止/状态监控） | 版本更新较慢 |

---

## 3.10 DBeaver —— 通用数据库管理工具

DBeaver 是一个开源的通用数据库管理工具，支持 MySQL、PostgreSQL、Oracle、SQLite 等几乎所有主流数据库。它使用 Java 开发，跨平台。

### 为什么 DBeaver 很流行

1. **免费开源**：社区版完全免费
2. **支持所有主流数据库**：一个工具管理所有数据库，不需要为每种数据库安装不同客户端
3. **功能强大**：SQL 编辑器（自动补全、语法高亮）、数据浏览与编辑、ER 图、导入导出、数据导出为多种格式
4. **活跃更新**：更新频繁，bug 修复及时

### 下载与连接 MySQL

1. 访问 https://dbeaver.io/download/ 下载对应版本
2. 安装后打开 DBeaver
3. 点击左上角 "新建连接" 图标（插头+加号），或按 Ctrl+N
4. 选择 MySQL → 下一步
5. 填写连接信息（主机、端口、用户名、密码）
6. 点击 "测试连接" → 首次会提示下载 MySQL JDBC 驱动 → 点击下载
7. 连接成功后，左侧 Database Navigator 会出现 MySQL 连接
8. 双击连接展开，可以看到所有数据库和表

### DBeaver 基本操作

- **SQL 编辑器**：按 F3 或选中连接后点 SQL 图标打开
- **运行 SQL**：Ctrl+Enter 执行当前语句（或选中语句）
- **浏览数据**：双击表名即可看到数据
- **过滤数据**：在数据视图中点击列头上的漏斗图标
- **ER 图**：选中数据库 → 右键 "View Diagram"
- **导出数据**：选中查询结果 → 右键 "Export Resultset"
- **编辑数据**：在数据视图中直接点击单元格修改，然后点击 Save 按钮（底部）

---

## 3.11 字符集问题处理

### 常见乱码场景

你可能会遇到以下情况：
- 插入中文数据后，查询显示为 `???` 或乱码
- mysql 客户端输入中文时报错
- 从文件导入的数据中文乱码

### 原因分析

MySQL 的字符集涉及多个层面：

```sql
-- 查看各层面的字符集设置
SHOW VARIABLES LIKE 'character_set_%';
-- character_set_client      → 客户端发送的 SQL 使用什么编码
-- character_set_connection  → 服务器收到后转换成什么编码
-- character_set_database    → 当前数据库的默认编码
-- character_set_results     → 服务器返回结果用什么编码
-- character_set_server      → 服务器的默认编码
```

> **乱码的根本原因**：数据在"客户端编码 → 服务器连接编码 → 表/列编码 → 结果编码"的转换链路中，某一环编码不匹配或被截断。

### 解决方案

**方案 1：一次性设置（连接后执行）**

```sql
SET NAMES utf8mb4;
-- 这相当于同时设置：
-- SET character_set_client = utf8mb4;
-- SET character_set_connection = utf8mb4;
-- SET character_set_results = utf8mb4;
```

**方案 2：连接时指定**

```bash
mysql -u root -p --default-character-set=utf8mb4
```

**方案 3：永久配置（推荐）**

在 my.ini / my.cnf 中配置：

```ini
[client]
default-character-set=utf8mb4

[mysql]
default-character-set=utf8mb4

[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

> **重要提醒**：`character-set-server` 只影响新建数据库的默认值，不会改变已有数据库的字符集。如果你已有的数据库是 `utf8` 创建的，需要单独执行 `ALTER DATABASE` 和 `ALTER TABLE` 来转换。详见第4章。

---

## 常见错误

### 错误 1：忘记在 SQL 语句结尾加分号

**现象**：
```
mysql> SELECT VERSION()
    ->
```
按了回车后没有返回结果，而是出现了 `->` 提示符。

**原因**：MySQL 看到分号才认为一条语句结束。没有分号，它认为你还没写完，继续等待输入。

**解决方法**：在 `->` 后输入 `;` 再按回车；或输入 `\c` 放弃当前输入。

### 错误 2：Access denied for user 'root'@'localhost' (using password: YES)

**现象**：输入密码后连接被拒绝。

**原因**：
1. 密码确实输错了
2. `root`@`localhost` 用户的认证方式不是密码认证（如 Ubuntu 的 auth_socket）
3. 用户不存在或权限问题

**解决方法**：
- 确认密码无误（注意大小写、特殊字符）
- Ubuntu 系统：尝试 `sudo mysql`（用系统 root 权限连接）
- 如果密码忘记：参考第2章的错误2（跳过授权表重置密码）

### 错误 3：区分 -p 和 -P

**现象**：输入 `mysql -u root -P 3306` 后提示输入密码但随即报错。

**原因**：`-P`（大写）是指定端口号，不是密码！`-p`（小写）才是密码选项。

**正确的连接**：`mysql -u root -p -P 3306`（小写 p 要密码，大写 P 指定端口）

### 错误 4：远程连接失败 "Can't connect to MySQL server on 'xxx'"

**现象**：可以本地连接，但远程连不上。

**原因**：通常是以下三个原因之一：
1. MySQL 只绑定了 127.0.0.1（`bind-address = 127.0.0.1`，不监听外网）
2. 防火墙阻止了 3306 端口
3. 用户没有远程访问权限（Host 列为 localhost）

**排查步骤**：
```bash
# 1. 在服务器上确认 MySQL 监听状态
netstat -an | grep 3306
# 应该看到 0.0.0.0:3306 或 :::3306，而不仅仅是 127.0.0.1:3306

# 2. 检查防火墙
sudo ufw status
# 或
sudo firewall-cmd --list-ports

# 3. 检查用户 Host 范围
SELECT User, Host FROM mysql.user;
# 如果 Host 是 localhost，则只能本地连接；需要 % 或具体 IP
```

### 错误 5：用 mysql 客户端退出后，误以为数据丢失了

**现象**：用 `INSERT` 插入数据后 `\q` 退出，重新连接发现数据不见了。

**原因**：在 MyISAM 引擎下，默认 autocommit=ON，INSERT 会立即持久化，数据不会丢失。但在 InnoDB 下，如果你之前执行了 `START TRANSACTION` 或设置 `autocommit=0`，INSERT 后没有 COMMIT，退出时事务自动回滚了。

**正确做法**：确保 INSERT/UPDATE/DELETE 后执行了 COMMIT（如果不在自动提交模式）。

---

## 本章练习

1. **基本连接练习**：使用命令行连接 MySQL，分别尝试以下三种方式：
   - `mysql -u root -p`
   - `mysql -u root -p -h 127.0.0.1`
   - `mysql -u root -p -h localhost`
   说说你观察到的区别（如果有的话）。

2. **SHOW 命令探索**：连接 MySQL 后，依次执行以下命令并记录结果：
   ```sql
   SHOW DATABASES;
   USE mysql;
   SHOW TABLES LIKE 'user';
   DESC mysql.user;
   SELECT DATABASE();
   ```

3. **系统数据库探索**：查看 information_schema 中有哪些表：
   ```sql
   USE information_schema;
   SHOW TABLES;
   ```
   找出一个你可能感兴趣的表，用 DESC 查看其结构。

4. **自定义提示符**：将 mysql 提示符改为显示 `用户名@主机 [数据库名] >` 的格式，然后切换到 mysql 数据库，观察提示符的变化。

5. **非交互模式练习**：使用 `mysql -e` 方式，在不进入交互模式的情况下执行 "SELECT VERSION(), NOW(), USER();" 并获取结果。（提示：可以用这个功能编写 shell 脚本）

6. **图形化工具**：安装 MySQL Workbench 或 DBeaver，创建一个本地连接，运行 "SELECT VERSION();"，尝试浏览 mysql 系统库的 user 表数据。
