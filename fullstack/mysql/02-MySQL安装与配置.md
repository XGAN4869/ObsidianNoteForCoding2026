# 第2章：MySQL 安装与配置

## 本章目标
学完本章后，你将能够：
1. 从 MySQL 官网下载对应你操作系统的安装包
2. 在 Windows（MSI 和 ZIP）、Linux（apt 和 yum）、Mac（Homebrew 和 DMG）上成功安装 MySQL
3. 理解 MySQL 安装后的目录结构和配置文件结构
4. 配置 my.ini/my.cnf 中的关键参数并理解其含义
5. 启动、停止、重启 MySQL 服务
6. 验证安装并完成首次安全设置

## 前置知识
- 第1章：理解什么是数据库、DBMS、MySQL 的基本概念
- 基本的操作系统操作能力（会打开终端/命令提示符）

---

## 2.1 下载 MySQL

### 官网下载页面导航

1. 打开浏览器，访问 MySQL 官方下载页：**https://dev.mysql.com/downloads/**

2. 页面会看到几个主要下载入口：
   - **MySQL Community Server**：社区版服务器（核心组件）
   - **MySQL Installer for Windows**：Windows 一站式安装器
   - **MySQL Workbench**：官方图形化管理工具
   - **MySQL Shell**：新一代命令行工具
   - **MySQL Router**：路由组件（用于高可用架构）

3. 点击 **MySQL Community Server** 进入下载页

4. 选择操作系统（Select Operating System）：
   - Windows → 看到 MSI Installer 和 ZIP Archive 两种格式
   - Ubuntu Linux → 看到 DEB 包
   - Red Hat Enterprise Linux / Oracle Linux → 看到 RPM 包
   - macOS → 看到 DMG Archive 和 Compressed TAR Archive

5. 选择版本：建议选择最新 GA（General Availability，正式发布版）。例如当前最新的 **MySQL 8.0.x** 或 **MySQL 8.4.x LTS**。

> **版本选择建议**：对于学习来说，选择最新的 GA 版本即可。如果是生产环境部署，建议选择发布超过 6 个月以上的版本（bug 基本被修完）。MySQL 8.4 是 LTS（长期支持）版本，适合生产环境。

---

## 2.2 Windows 安装：MSI 安装器方式

MSI（Microsoft Installer）是 Windows 上最推荐的方式，它提供了图形化安装向导。

### 详细步骤

**步骤 1**：下载 MSI 安装包

访问 https://dev.mysql.com/downloads/installer/，下载 `mysql-installer-community-x.x.x.msi`（通常约 400MB，包含了 MySQL Server、Workbench、Connector 等所有组件）。

**步骤 2**：双击运行安装器

双击 `.msi` 文件，出现安装向导首页。

**步骤 3**：选择安装类型（Choosing a Setup Type）

这是关键的一步，有 5 种选项：

| 安装类型 | 包含内容 | 适合人群 |
|----------|----------|----------|
| **Developer Default** | MySQL Server、Workbench、Shell、Router、Connectors、文档、示例 | 开发者（推荐初学者选这个） |
| **Server only** | 仅 MySQL Server | 只做数据库服务的机器 |
| **Client only** | Workbench、Shell、Connectors（不含 Server） | 只需连接远程数据库的机器 |
| **Full** | 所有组件（最大安装） | 需要完整环境 |
| **Custom** | 自选组件 | 高级用户自定义 |

> **建议**：初学者选择 **Developer Default**，会安装完整开发环境。如果只是为了学习数据库本身，Server only 也够了。

**步骤 4**：检查安装依赖（Check Requirements）

安装器会检查你的系统是否缺少某些依赖。Windows 通常需要：
- **Microsoft Visual C++ Redistributable**：如果未安装，安装器会提示你手动安装。点击 Execute 按钮会自动安装。

**步骤 5**：安装（Installation）

检查通过后，点击 Execute 开始下载安装所有选中的组件。这一步可能需要几分钟。

**步骤 6**：产品配置（Product Configuration）

安装完成后，进入配置阶段。逐项配置：

1. **Type and Networking**：
   - Config Type：选择 Development Computer（开发机，占用较少内存）
   - Port：默认 3306（建议保持默认，除非端口冲突）
   - Open Windows Firewall ports：如果数据库和客户端不在同一台机器，需要勾选

2. **Authentication Method**：
   - **Use Strong Password Encryption (caching_sha2_password)**：MySQL 8.0 推荐，更安全
   - **Use Legacy Authentication Method (mysql_native_password)**：与老版本客户端兼容
   - 建议选择推荐项（Strong Password Encryption），除非你需要老客户端连接

3. **Accounts and Roles**：
   - 设置 **root 密码**（务必记住！）
   - 可以添加额外用户（可以稍后再添加）

4. **Windows Service**：
   - 将 MySQL 注册为 Windows 服务
   - Service Name：默认 `MySQL80`（可以自定义）
   - 勾选 "Start the MySQL Server at System Startup"（开机自启）

5. **Server File Permissions**：保持默认

**步骤 7**：Apply Configuration

点击 Execute 应用所有配置。配置成功后，MySQL 服务就已启动。

### 验证 Windows MSI 安装

打开 **命令提示符（cmd）** 或 **PowerShell**：

```bash
# 1. 检查版本
mysql --version
# 输出示例: mysql  Ver 8.0.36 for Win64 on x86_64 (MySQL Community Server - GPL)

# 2. 使用刚设置的 root 密码连接
mysql -u root -p
# 输入密码后，看到 mysql> 提示符即表示成功

# 3. 在 mysql> 提示符下检查状态
mysql> SELECT VERSION();
mysql> STATUS;
```

或者使用 Windows 服务管理查看：按 Win+R → 输入 `services.msc` → 找到 `MySQL80` 服务 → 查看状态是否为"正在运行"。

---

## 2.3 Windows 安装：ZIP 压缩包方式

ZIP 方式不需要安装向导，适合深度定制或绿色部署。

### 详细步骤

```bash
# 1. 下载 ZIP 压缩包（从官网下载页选 "Windows (x86, 64-bit), ZIP Archive"）

# 2. 解压到目标目录，例如
# C:\mysql\  （建议路径中没有空格和中文字符）

# 3. 创建数据目录
mkdir C:\mysql\data

# 4. 创建配置文件 my.ini
# 在 C:\mysql\ 目录下新建 my.ini，内容如下
```

**my.ini 最简配置示例**：

```ini
[client]
# 客户端默认端口
port=3306

[mysql]
# mysql 命令行客户端的默认字符集
default-character-set=utf8mb4

[mysqld]
# MySQL 安装目录
basedir=C:/mysql
# 数据存放目录
datadir=C:/mysql/data
# 端口号
port=3306
# 允许最大连接数
max_connections=200
# 字符集
character-set-server=utf8mb4
# 默认存储引擎
default-storage-engine=INNODB
# 认证插件（推荐）
default_authentication_plugin=caching_sha2_password
```

> **路径分隔符注意**：在 my.ini 中，使用正斜杠 `/` 或双反斜杠 `\\`，不要用单反斜杠（`\` 会被当作转义字符）。

### 初始化 MySQL（一键生成数据目录）

**以管理员身份**打开命令提示符，执行：

```bash
cd C:\mysql\bin

# 初始化 MySQL 数据目录（生成 root 用户随机密码）
mysqld --initialize --console
# 注意！控制台会在最后一行输出 root 用户的临时密码，务必记下来：
# 例如: [Note] A temporary password is generated for root@localhost: abcDEF123!@#
```

> **重要**：`--initialize` 会生成随机密码；如果使用 `--initialize-insecure` 则 root 用户无密码，不推荐在生产环境使用。

### 安装为 Windows 服务

```bash
# 安装 MySQL 为 Windows 服务（以管理员身份运行）
mysqld --install MySQL80 --defaults-file="C:\mysql\my.ini"
# Service successfully installed.

# 启动服务
net start MySQL80
# 或
sc start MySQL80

# 停止服务
net stop MySQL80

# 卸载服务（如果需要）
mysqld --remove MySQL80
```

### 修改 root 密码（ZIP 安装后）

```bash
# 1. 用临时密码连接
mysql -u root -p
# 粘贴刚才的临时密码

# 2. 修改密码（MySQL 会强制要求修改初始密码后才能执行其他语句）
ALTER USER 'root'@'localhost' IDENTIFIED BY '你的新密码';
FLUSH PRIVILEGES;

# 3. 退出重新用新密码登录验证
mysql -u root -p
```

---

## 2.4 Linux 安装：apt 方式（Ubuntu/Debian）

Ubuntu/Debian 系统的包管理器是 apt。

### 详细步骤

```bash
# 1. 更新包索引
sudo apt update

# 2. 安装 MySQL Server
sudo apt install mysql-server

# 安装过程中可能会提示设置 root 密码（取决于版本）
# 如果没有提示，安装完成后 root 用户默认使用 auth_socket 插件认证
# （即 sudo mysql 可以直接登录，不需要密码）

# 3. 启动 MySQL 服务
sudo systemctl start mysql
# 或
sudo service mysql start

# 4. 设置开机自启
sudo systemctl enable mysql

# 5. 检查服务状态
sudo systemctl status mysql
# 看到 active (running) 表示启动成功
```

### 首次安全设置

```bash
# 运行安全初始化脚本
sudo mysql_secure_installation
```

这个脚本会引导你完成以下操作：
1. 设置 root 密码（如果之前没有设置）
2. 删除匿名用户
3. 禁止 root 远程登录
4. 删除 test 数据库（对所有人可访问的测试库）
5. 重新加载权限表

### 修改 root 认证方式（Ubuntu 18.04+）

Ubuntu 18.04 及之后版本通过 apt 安装的 MySQL，root 用户默认使用 `auth_socket` 插件——只有系统 root 用户（sudo）才能以 MySQL root 身份登录。如果你想用普通用户名和密码登录：

```bash
# 1. 以 sudo 方式登录
sudo mysql

# 2. 修改 root 认证方式
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的新密码';
# 或使用 caching_sha2_password（MySQL 8.0+ 推荐）
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '你的新密码';

FLUSH PRIVILEGES;
EXIT;

# 3. 现在可以 mysql -u root -p 登录了
mysql -u root -p
```

### 配置 MySQL（Ubuntu）

Ubuntu 下 MySQL 配置文件位置（按优先级排序）：
- `/etc/mysql/mysql.conf.d/mysqld.cnf`（主要配置文件）
- `/etc/mysql/mysql.cnf`
- `/etc/mysql/my.cnf`

```bash
# 编辑配置文件
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf

# 常用修改：
# [mysqld]
# bind-address = 0.0.0.0          # 允许远程连接（默认只监听 127.0.0.1）
# character-set-server = utf8mb4
# default-storage-engine = innodb

# 修改后重启 MySQL
sudo systemctl restart mysql
```

---

## 2.5 Linux 安装：yum 方式（CentOS/RHEL）

CentOS 和 RHEL 使用 yum（或 dnf）作为包管理器。

### 详细步骤

```bash
# 1. 添加 MySQL Yum Repository
# 访问 https://dev.mysql.com/downloads/repo/yum/ 下载对应版本的 rpm 包
# 以 CentOS 7 / MySQL 8.0 为例：
wget https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm
sudo rpm -ivh mysql80-community-release-el7-11.noarch.rpm

# 2. 验证仓库是否添加成功
yum repolist enabled | grep mysql
# 输出类似: mysql80-community/x86_64    MySQL 8.0 Community Server

# 3. 安装 MySQL Server
sudo yum install mysql-community-server

# 4. 启动 MySQL
sudo systemctl start mysqld
# 或
sudo service mysqld start

# 5. 设置开机自启
sudo systemctl enable mysqld

# 6. 获取临时 root 密码
sudo grep 'temporary password' /var/log/mysqld.log
# 输出: A temporary password is generated for root@localhost: abc123XYZ
# 记下这个密码！

# 7. 用临时密码登录并修改密码
mysql -u root -p
# 输入临时密码
ALTER USER 'root'@'localhost' IDENTIFIED BY '你的新密码';

# 8. 运行安全初始化
mysql_secure_installation
```

### CentOS/RHEL 配置文件位置

```bash
# 主配置文件
/etc/my.cnf

# 编辑配置
sudo vim /etc/my.cnf

# 查看 MySQL 数据目录
sudo ls /var/lib/mysql/

# 查看 MySQL 日志
sudo tail -f /var/log/mysqld.log
```

---

## 2.6 Mac 安装：Homebrew 方式

Homebrew 是 Mac 上最流行的包管理器。

```bash
# 1. 如果没有安装 Homebrew，先安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 更新 Homebrew
brew update

# 3. 安装 MySQL
brew install mysql

# 4. 启动 MySQL 服务
brew services start mysql
# 或
mysql.server start

# 5. 设置开机自启
brew services start mysql  # Homebrew 管理的服务默认自启

# 6. 安全设置
mysql_secure_installation

# 7. 配置
# macOS 上 MySQL 配置文件位置：
# /usr/local/etc/my.cnf (Intel Mac)
# /opt/homebrew/etc/my.cnf (Apple Silicon Mac)
```

### 卸载 MySQL（Homebrew）

```bash
brew services stop mysql
brew uninstall mysql
# 如果数据也需要删除：
rm -rf /usr/local/var/mysql
```

---

## 2.7 Mac 安装：DMG 安装器方式

1. 访问 https://dev.mysql.com/downloads/mysql/
2. 选择 macOS 并下载 DMG Archive
3. 双击 `.dmg` 文件，再双击 `.pkg` 文件
4. 按照安装向导点击 Continue
5. 安装过程中可能会弹出一个带有随机 root 密码的窗口，务必截图或复制保存！
6. 安装完成后，打开"系统偏好设置" → "MySQL"
7. 可以在这里启动/停止 MySQL 服务
8. 也可以勾选 "Automatically Start MySQL Server on Startup" 实现开机自启

---

## 2.8 MySQL 安装后的目录结构

了解 MySQL 的目录结构能帮你更好地管理数据库文件。

### Windows 典型目录结构

以默认安装路径 `C:\Program Files\MySQL\MySQL Server 8.0\` 为例：

```
MySQL Server 8.0/
├── bin/          ← 可执行文件目录
│   ├── mysqld.exe           ← MySQL 服务器主程序
│   ├── mysql.exe            ← 命令行客户端
│   ├── mysqldump.exe        ← 备份工具
│   ├── mysqladmin.exe       ← 管理工具
│   ├── mysqlcheck.exe       ← 表检查和修复
│   ├── mysqlimport.exe      ← 数据导入工具
│   ├── mysqlshow.exe        ← 数据库信息查看
│   ├── mysqlbinlog.exe      ← 二进制日志分析工具
│   └── mysqlslap.exe        ← 压力测试工具
│
├── data/         ← 数据文件存放目录
│   ├── mysql/               ← mysql 系统数据库
│   ├── performance_schema/  ← 性能监控数据库
│   ├── sys/                 ← sys 系统数据库
│   ├── ibdata1              ← InnoDB 系统表空间
│   ├── ib_logfile0          ← InnoDB redo log
│   ├── ib_logfile1          ← InnoDB redo log
│   └── YourDB/              ← 你自己创建的数据库
│
├── docs/         ← 文档
├── include/      ← C/C++ 头文件（用于开发 MySQL 应用）
├── lib/          ← 库文件
├── share/        ← 共享文件
│   ├── charsets/            ← 字符集配置文件
│   ├── english/             ← 错误信息文件
│   └── ...
│
├── my.ini        ← 配置文件（有时在 C:\ProgramData\MySQL\MySQL Server 8.0\）
└── LICENSE
```

### Linux 典型目录结构

```
/usr/sbin/mysqld                ← MySQL 服务器主程序
/usr/bin/mysql                  ← 命令行客户端
/usr/bin/mysqldump              ← 备份工具
/var/lib/mysql/                 ← 数据文件目录
/var/log/mysql/error.log        ← 错误日志
/etc/mysql/my.cnf (或 /etc/my.cnf)  ← 配置文件
/usr/share/mysql/               ← 共享文件
```

---

## 2.9 配置文件详解（my.ini / my.cnf）

MySQL 的配置文件名称取决于操作系统：Windows 上叫 `my.ini`，Linux/Mac 上叫 `my.cnf`。

### 配置文件查找顺序

MySQL 启动时按以下顺序查找配置文件（会合并所有找到的文件，后面的覆盖前面的）：

**Windows**：
1. `%PROGRAMDATA%\MySQL\MySQL Server 8.0\my.ini`
2. `%WINDIR%\my.ini`
3. `C:\my.ini`
4. `安装目录\my.ini`

**Linux**：
1. `/etc/my.cnf`
2. `/etc/mysql/my.cnf`
3. `/usr/etc/my.cnf`
4. `~/.my.cnf`（用户主目录下的隐藏配置）

```sql
-- 查看 MySQL 实际加载了哪些配置文件
mysql --help | grep "my.cnf"
-- Windows 下：
mysqld --verbose --help | findstr "my.ini"
```

### 配置文件的结构

配置文件分为多个节（section），每一节用 `[section_name]` 标识：

```ini
[client]
# 所有 MySQL 客户端（mysql、mysqldump、mysqladmin 等）的通用配置
port=3306
default-character-set=utf8mb4

[mysql]
# mysql 命令行客户端专用配置
default-character-set=utf8mb4
prompt=\\u@\\h [\\d]>\\_
# 常用 prompt 设置：显示 用户名@主机名 [当前数据库]>

[mysqld]
# MySQL 服务器核心配置（最关键的节）
basedir="C:/Program Files/MySQL/MySQL Server 8.0/"
datadir="C:/ProgramData/MySQL/MySQL Server 8.0/Data/"
port=3306
max_connections=200
character-set-server=utf8mb4
default-storage-engine=INNODB
default_authentication_plugin=caching_sha2_password

[mysqldump]
# mysqldump 备份工具专用配置
quick
max_allowed_packet=128M
```

### 关键配置参数详解

| 参数 | 所属节 | 说明 | 建议值 |
|------|--------|------|--------|
| **basedir** | `[mysqld]` | MySQL 安装根目录 | 自动检测，通常不需要手动设置 |
| **datadir** | `[mysqld]` | 数据文件存放目录 | 如果需要单独挂载数据盘，修改此路径 |
| **port** | `[mysqld]` | 监听端口 | 3306（默认，如端口冲突可改为 3307 等） |
| **max_connections** | `[mysqld]` | 最大并发连接数 | 开发环境 100-200，生产环境根据需求 500-2000 |
| **character-set-server** | `[mysqld]` | 服务器默认字符集 | **utf8mb4**（不要用 utf8！） |
| **collation-server** | `[mysqld]` | 服务器默认排序规则 | utf8mb4_unicode_ci（或 utf8mb4_0900_ai_ci，MySQL 8.0+） |
| **default-storage-engine** | `[mysqld]` | 默认存储引擎 | INNODB |
| **innodb_buffer_pool_size** | `[mysqld]` | InnoDB 缓冲池大小（最重要性能参数） | 开发环境 512M；生产环境建议物理内存的 50%-70% |
| **innodb_log_file_size** | `[mysqld]` | InnoDB redo log 文件大小 | 开发环境 256M；生产环境 1G-4G |
| **sql_mode** | `[mysqld]` | SQL 模式（影响语法容忍度） | 现代 MySQL 推荐默认值，包含 `ONLY_FULL_GROUP_BY` |
| **default-character-set** | `[mysql]` `[client]` | 客户端的默认字符集 | utf8mb4 |
| **max_allowed_packet** | `[mysqld]` | 单个数据包最大大小 | 64M-256M（如需存储大文本/文件） |
| **bind-address** | `[mysqld]` | 绑定的网络接口 | 127.0.0.1（仅本地）或 0.0.0.0（允许远程连接） |

### 配置修改后生效方式

```bash
# 修改配置文件后，需要重启 MySQL 服务才能生效
# Windows:
net stop MySQL80
net start MySQL80

# Linux:
sudo systemctl restart mysql

# Mac (Homebrew):
brew services restart mysql

# 注意：某些参数可以通过 SET GLOBAL 动态修改，不需要重启：
SET GLOBAL max_connections = 300;
```

> **区分动态参数和静态参数**：`max_connections` 是动态参数（可在运行时修改），`innodb_buffer_pool_size` 在 MySQL 5.7+ 也是动态的。但 `datadir`、`basedir` 这种路径参数必须在重启后生效。查看参数类型：`SHOW VARIABLES LIKE 'parameter_name';`

---

## 2.10 各操作系统管理 MySQL 服务

### Windows

```cmd
# 启动
net start MySQL80
# 或
sc start MySQL80

# 停止
net stop MySQL80

# 重启（没有直接命令，需先停后启）
net stop MySQL80 && net start MySQL80

# 查看服务状态
sc query MySQL80

# 卸载服务
mysqld --remove MySQL80

# 通过 Windows 服务管理器（GUI）
# Win+R → services.msc → 找到 MySQL80 → 右键操作
```

### Linux（systemd，推荐）

```bash
# 启动
sudo systemctl start mysql
# 或
sudo systemctl start mysqld

# 停止
sudo systemctl stop mysql

# 重启
sudo systemctl restart mysql

# 查看状态
sudo systemctl status mysql

# 开机自启
sudo systemctl enable mysql

# 禁止开机自启
sudo systemctl disable mysql
```

### Linux（service，老方式）

```bash
sudo service mysql start
sudo service mysql stop
sudo service mysql restart
sudo service mysql status
```

### Mac（Homebrew）

```bash
# 启动
brew services start mysql

# 停止
brew services stop mysql

# 重启
brew services restart mysql

# 查看状态
brew services list | grep mysql
```

### Mac（DMG 安装）

打开"系统偏好设置" → "MySQL" → 点击 Start/Stop MySQL Server 按钮。

---

## 2.11 验证安装

### 基础验证

```bash
# 1. 查看版本（无须连接服务器）
mysql --version
# mysql  Ver 8.0.36 for Linux on x86_64 (MySQL Community Server - GPL)

# 2. 测试连接
mysql -u root -p
# 输入密码
# 看到 mysql> 提示符则成功

# 3. 在 mysql> 提示符下执行
SELECT VERSION();
# +-----------+
# | VERSION() |
# +-----------+
# | 8.0.36    |
# +-----------+

SELECT NOW();
# 显示当前时间

SELECT USER();
# 显示当前登录用户

SHOW DATABASES;
# 显示当前所有数据库

STATUS;
# 显示服务器状态信息（版本、运行时间、当前数据库、字符集等）
```

### 查看重要系统变量

```sql
-- 查看字符集相关设置
SHOW VARIABLES LIKE 'character_set_%';
SHOW VARIABLES LIKE 'collation_%';

-- 查看存储引擎
SHOW ENGINES;

-- 查看 InnoDB 状态
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

---

## 常见错误

### 错误 1：连接时提示 "Can't connect to MySQL server on 'localhost' (10061)"

**现象**：运行 `mysql -u root -p` 后立即报错，无法连接到服务器。

**原因**：MySQL 服务没有启动！mysql 客户端无法连接到 mysqld 服务进程。10061 是 Windows Sockets 错误码，表示目标主机上没有进程在监听 3306 端口。

**解决方法**：
- Windows：`net start MySQL80` 或检查 services.msc
- Linux：`sudo systemctl start mysql`
- 如果启动失败，查看错误日志（`datadir/主机名.err` 或 `/var/log/mysql/error.log`）

### 错误 2：忘记 root 密码

**现象**：重装系统后或久未使用，无法用 root 密码登录。

**原因**：正常现象，解决方案是"跳过授权表"模式启动。

**解决方法（安全模式重置）**：

```bash
# Windows（以管理员身份运行 cmd）：
# 1. 停止 MySQL 服务
net stop MySQL80
# 2. 跳过授权表启动
mysqld --console --skip-grant-tables --shared-memory
# 3. 另开一个命令行窗口，无需密码登录
mysql -u root
# 4. 刷新权限并修改密码
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
# 5. 关闭跳过授权表的窗口，正常启动服务

# Linux：
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
sudo systemctl restart mysql
```

### 错误 3：ZIP 安装执行 mysqld --initialize 时报错 "MSVCR120.dll 找不到"

**现象**：Windows ZIP 方式安装时报缺少 MSVCR120.dll 或 VCRUNTIME140.dll。

**原因**：缺少 Microsoft Visual C++ Redistributable 运行时库。

**解决方法**：从微软官网下载并安装 [Visual C++ Redistributable for Visual Studio 2015-2022](https://aka.ms/vs/17/release/vc_redist.x64.exe)。

### 错误 4：配置文件修改后不生效

**现象**：修改了 my.ini/my.cnf，重启 MySQL 后参数还是老值。

**原因**：
1. 改错了配置文件（MySQL 加载多个配置文件，你改的不是它实际加载的那个）
2. 改错了参数名（如把 `max_connections` 写成了 `max_connection`）

**解决方法**：
```bash
# 查看 MySQL 实际加载的配置文件
mysqld --verbose --help | grep -A 1 "Default options"

# 查看当前生效的参数值
SHOW VARIABLES LIKE '参数名';
```

### 错误 5：使用 utf8 字符集后 emoji 插入失败

**现象**：创建数据库时用了 `CHARACTER SET utf8`，插入 `😀` 时报错 `Incorrect string value`。

**原因**：MySQL 的 `utf8` 是残缺的，只支持 3 字节字符，emoji（4 字节）无法存储。

**解决方法**：所有地方统一使用 `utf8mb4`。详见第4章。

---

## 本章练习

1. **安装 MySQL**：在你的操作系统上安装 MySQL，使用 `mysql --version` 和连接 MySQL 后执行 `SELECT VERSION();` 截图记录。

2. **配置文件探索**：找到你系统上的 my.ini 或 my.cnf 文件，查看其中有哪些 `[mysqld]` 下的参数。将你找到的配置文件中所有 active（非注释的）参数列出来。

3. **服务管理练习**：练习启动、停止、重启 MySQL 服务各一次（使用命令行而不是 GUI），每次操作后执行 `STATUS;` 确认服务状态。

4. **root 密码修改**：连接到 MySQL 后，将 root 密码改成一个新的复杂密码（至少包含大写字母、小写字母、数字、特殊字符），然后退出用新密码重新登录验证。

5. **配置修改练习**：修改配置文件，将 `max_connections` 改为 300 并重启 MySQL。登录后执行 `SHOW VARIABLES LIKE 'max_connections';` 验证是否生效。如果是动态参数，尝试用 `SET GLOBAL` 方式修改而不重启。

6. **安全初始化**：如果还没有执行过 `mysql_secure_installation`，请在安装 MySQL 后执行它。记录每一步的选择和原因。
