# 第 8 章 文件权限与 ACL

---

## 目录

1. [概述](#1-概述)
2. [核心概念](#2-核心概念)
3. [命令详解](#3-命令详解)
4. [实战练习](#4-实战练习)
5. [常见错误与排错](#5-常见错误与排错)
6. [进阶延伸](#6-进阶延伸)

---

## 1. 概述

### 1.1 从"你是谁"到"你能动什么"

第 7 章回答了"谁是谁"——你用 `useradd` 创建了用户，用 `id` 查看了 UID 和 GID，用 `sudo` 控制了谁能做什么。但 Linux 安全模型还有另一半：**文件权限（File Permission）**。

你创建了一个用户叫 `lisi`，并不意味着他就不能查看你的家目录下的文件。你能做的就是为你的文件**设定规则**——"这个文件只有我可以读写，同组的人可以读，其他人完全看不到"。这套规则系统就是 Linux 文件权限。

Linux 的文件权限模型经历了两个时代：

```
第一代：ugo/rwx 模型（1970s — 至今）
─────────────────────────────────────────
最基本的权限系统：将访问者分为三类（所有者 Owner、所属组 Group、其他人 Others），
每类可以拥有三种权限（读 Read、写 Write、执行 Execute）。
简单、可靠、但不够灵活——你无法只让"张三和李四"有权限而"王五"没有（如果他们都属于同一个组）。

第二代：ACL 扩展（1990s — 至今）
─────────────────────────────────────────
ACL（访问控制列表，Access Control List）打破了 ugo 的局限，
允许为任意数量的特定用户和组单独设置权限。
"张三读写，李四只读，王五禁止访问"——ugo 做不到，ACL 可以。

第三代：chattr 隐藏属性（2000s — 至今）
─────────────────────────────────────────
超越普通权限的"不可变标志"——即使 root 也无法删除或修改（除非先移除标志）。
用于保护关键系统文件免受误操作和 rootkit 篡改。
```

本章将完整覆盖这三层权限体系，从最基础的 `rwx` 三位权限到最精细的 ACL 规则，再到最底层的文件隐藏属性。

### 1.2 本章命令全景

本章覆盖的 8 个核心命令分为四组：

| 分组 | 命令 | 功能 |
|------|------|------|
| **基础权限（Base Permission）** | `chmod`、`chown`、`chgrp` | 修改读/写/执行权限、修改文件所有者和所属组 |
| **权限掩码（Mask）** | `umask` | 控制系统新建文件/目录的默认权限 |
| **ACL（Access Control List）** | `getfacl`、`setfacl` | 查看和设置超越 ugo 的细粒度访问控制 |
| **隐藏属性（Extended Attributes）** | `chattr`、`lsattr` | 设置和查看文件的不可变标志和追加标志等隐藏属性 |

### 1.3 为什么"学习权限"是分水岭

在自学 Linux 的道路上，**文件权限**是一个分水岭：

- 在此之前，你学的是"怎么用 Linux"——复制文件、创建目录、查看日志。这些操作图形界面也能做。
- 在此之后，你学的是"怎么管 Linux"——谁可以访问什么、脚本为什么不能执行、服务为什么写不了日志、网站为什么被黑了。这些问题背后几乎都指向权限。

更重要的是，权限是 **Linux 安全模型的基础**。一个配置不当的权限（如 `chmod 777`）可以让你四小时搭建的服务器在四秒内被攻陷。本章不仅要教你怎么设置权限，还要帮你建立"权限安全意识"——什么能做、什么绝对不能做。

### 1.4 本章学习目标

完成本章后，你将能够：

- 深刻理解 `rwx` 三位权限在**文件**和**目录**上的不同含义
- 熟练使用符号模式（Symbolic Mode）和八进制模式（Octal Mode）修改权限
- 理解 SUID（Set User ID）、SGID（Set Group ID）和 Sticky Bit（粘滞位）三种特殊权限的工作原理
- 使用 `chown` 和 `chgrp` 修改文件的所属关系
- 理解 `umask` 如何影响新建文件和目录的默认权限
- 使用 `getfacl` 和 `setfacl` 实现 ugo 模型无法实现的细粒度权限控制
- 使用 `chattr` 和 `lsattr` 设置不可变标志（`i`）和追加标志（`a`），保护关键文件
- 建立权限安全意识——避免 `chmod 777` 和 `chmod -R` 的滥用

---

## 2. 核心概念

### 2.1 rwx 权限三位一体的本质

Linux 文件权限的最小单位是三个字母：`r`、`w`、`x`。但它们在**文件**和**目录**上的含义截然不同——这是初学者最容易混淆的地方。

#### 2.1.1 rwx 在文件上的含义

| 权限 | 字母 | 二进制位 | 对文件的含义 | 典型场景 |
|------|------|----------|-------------|----------|
| **读（Read）** | `r` | 4 (100) | 可以查看文件内容（`cat`、`less`、`head`） | 读取配置文件：`cat /etc/hostname` |
| **写（Write）** | `w` | 2 (010) | 可以修改文件内容（`vim`、`echo >`）。**注意：** 能修改内容不代表能删除文件——删除文件取决于**目录**的写权限 | 编辑脚本：`vim script.sh` |
| **执行（Execute）** | `x` | 1 (001) | 可以将文件作为程序/脚本来运行。对于二进制程序（如 `/bin/ls`），就是能够执行它；对于脚本（如 `.sh`），就是能够通过 `./script.sh` 的方式运行 | 运行程序：`./myapp` |

**关键认知：** 对文件有写权限（`w`）不等于能删除文件。文件的删除操作作用于**目录**——你修改的是目录的内容（删除其中的一条记录），而非修改文件本身。因此，你能删除一个文件的前提是对**它所在的目录**有写权限。

```bash
# 验证：创建一个你有读权限但没有写权限的目录中的文件
mkdir /tmp/testdir
echo "hello" > /tmp/testdir/myfile
chmod 544 /tmp/testdir        # 目录: r-xr--r--（你没有写权限）
# 尝试删除（会失败）
rm /tmp/testdir/myfile
# rm: cannot remove '/tmp/testdir/myfile': Permission denied
```

#### 2.1.2 rwx 在目录上的含义

| 权限 | 字母 | 二进制位 | 对目录的含义 | 典型场景 |
|------|------|----------|-------------|----------|
| **读（Read）** | `r` | 4 (100) | 可以列出目录中的文件名（`ls`）。**但不能进入目录，也不能查看文件属性** | `ls /var/log` |
| **写（Write）** | `w` | 2 (010) | 可以在目录中创建、删除、重命名文件（无论文件的权限是什么！）。**注意：** 仅有写权限而没有执行权限，你无法在目录中做任何事 | `touch /tmp/newfile` |
| **执行（Execute）** | `x` | 1 (001) | 可以**进入**（`cd`）该目录，可以访问目录中的文件（如果知道文件名）。可以把 `x` 理解为目录的"通行证" | `cd /home/zhangsan` |

**目录权限的组合效果：**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        目录权限组合效果表                                │
│                                                                         │
│  权限值   含义                      ls   cd   touch   rm   cat(已知文件) │
│  ──────   ────────────────────     ──   ──   ─────   ──   ───────────── │
│  r--      只能列出文件名            ✓    ✗     ✗      ✗     ✗           │
│  r-x      可以浏览和访问文件        ✓    ✓     ✗      ✗     ✓           │
│  -wx      可以进出但不能列出文件    ✗    ✓     ✓      ✓     ✓(需知道文件名)│
│  ---      完全禁止访问              ✗    ✗     ✗      ✗     ✗           │
│  rwx      完全开放                  ✓    ✓     ✓      ✓     ✓           │
└─────────────────────────────────────────────────────────────────────────┘
```

**关于 `-wx` 的有趣现象：** 如果你对目录有 `wx` 权限但没有 `r`（即权限为 `-wx` 或 `3`），你无法 `ls` 列出目录内容，但如果你已经知道某个文件的名称，你仍然可以 `cat` 它。这像是一个"盲人房间"——你看不到房间里有什么，但只要你知道某样东西的名字并伸手去摸，你就能摸到它。

```bash
# 实验：-wx 权限的"盲人"目录
mkdir /tmp/blinddir
echo "secret content" > /tmp/blinddir/secret.txt
chmod 733 /tmp/blinddir          # 目录权限: rwx-wx-wx

# 用另一个用户测试（或在自己的终端中临时切换）
# 因为你既是所有者又是测试者，需要确认效果
su - testuser                     # 切换到另一个用户
ls /tmp/blinddir                  # ls: cannot open directory: Permission denied（无 r）
cat /tmp/blinddir/secret.txt      # 成功！你可以访问知道名字的文件
cd /tmp/blinddir                  # 成功！你可以进入
ls                                # 失败！你无法列出内容
exit
```

### 2.2 权限的三类对象：ugo 模型

Linux 将访问文件的"人"分为三类：

| 对象 | 符号 | 含义 | 判断规则 |
|------|------|------|----------|
| **所有者（Owner / User）** | `u` | 文件的创建者（可以理解为主人） | 内核比较进程的**有效 UID** 与文件 inode 中存储的 UID。第 7 章讲的 UID 在这里正式登场 |
| **所属组（Group）** | `g` | 文件所属的组（可以理解为同部门的同事） | 内核比较进程的**有效 GID 和附加组**与文件 inode 中存储的 GID。如果一个用户属于多个组，只要有**任意一个组**匹配就算数 |
| **其他人（Others）** | `o` | 既不是所有者、也不属于所属组的所有用户（可以理解为路人） | 既不匹配 UID 也不匹配 GID 的所有进程 |

**权限匹配的优先级（重要！）：**

当进程试图访问一个文件时，内核按以下顺序检查：

```
1. 进程的 UID == 文件的 UID？    → 如果是，使用 Owner 权限，结束检查。
2. 进程的 GID（或任何附加组）== 文件的 GID？  → 如果是，使用 Group 权限，结束检查。
3. 都不匹配                      → 使用 Others 权限。
```

**这意味着：** 即使 Others 权限比 Group 权限更宽松，只要你是所有者，就只能按 Owner 权限来——不会"降级"使用更宽松的规则。这不是 bug，这是设计——所有者的权限就是所有者的权限，不会因为"作为路人反而更自由"。

```bash
# 验证：创建一个 Others 权限比 Owner 更宽松的文件
echo "test" > /tmp/perm_test
chmod 604 /tmp/perm_test         # Owner: rw-, Group: ---, Others: r--
# 所有者是 zhangsan（假设是你）
whoami
cat /tmp/perm_test               # 成功（Owner 有 r 权限）

# 切换到 testuser
sudo -u testuser cat /tmp/perm_test  # 成功（testuser 是 Others, Others有 r 权限）

# 但如果你（zhangsan）的 Owner 权限被设为 0（---），即使 Others 有 r 权限，
# 你仍然无法读取——因为你是 Owner，只能按 Owner 权限来
```

### 2.3 从 `ls -l` 读懂权限信息

```bash
# 查看文件权限的最常用方式
ls -l /etc/hostname
```

预期输出（示例）：

```
-rw-r--r-- 1 root root 7 Jul 29 10:00 /etc/hostname
```

将输出拆解：

```
-        rw-       r--       r--       1   root    root    7  Jul 29 10:00  /etc/hostname
│        │         │         │         │    │       │      │   │              │
│        │         │         │         │    │       │      │   │              └── 文件名
│        │         │         │         │    │       │      │   └── 修改时间
│        │         │         │         │    │       │      └── 文件大小（字节）
│        │         │         │         │    │       └── 所属组名（通过 GID→名称 映射）
│        │         │         │         │    └── 所有者名（通过 UID→名称 映射）
│        │         │         │         └── 硬链接数
│        │         │         └── Others 权限（其他用户）
│        │         └── Group 权限（所属组）
│        └── Owner 权限（所有者）
└── 文件类型（- = 普通文件，d = 目录，l = 符号链接，b = 块设备，c = 字符设备，s = 套接字，p = 管道）
```

**第 1 个字符：文件类型**

| 字符 | 文件类型 | 英文 | 示例 |
|------|---------|------|------|
| `-` | 普通文件 | Regular File | `/etc/hostname` |
| `d` | 目录 | Directory | `/home` |
| `l` | 符号链接 | Symbolic Link | `/bin/sh -> dash` |
| `b` | 块设备文件 | Block Device | `/dev/sda` |
| `c` | 字符设备文件 | Character Device | `/dev/tty` |
| `s` | 套接字文件 | Socket | `/run/systemd/private` |
| `p` | 命名管道 | Named Pipe (FIFO) | （使用 `mkfifo` 创建） |

### 2.4 二进制与八进制表示法

`rwx` 三位的本质是一个 **3 位二进制数**。理解这一点后，`chmod 755` 对你来说就不是一串需要背诵的数字了。

#### 2.4.1 每一位的二进制值

```
┌──────────────────────────────────────────────────────────────┐
│                     rwx → 二进制 → 八进制                      │
│                                                              │
│    权限            二进制         八进制      含义             │
│    ────            ──────        ──────      ────             │
│    ---             000           0           无任何权限        │
│    --x             001           1           仅执行            │
│    -w-             010           2           仅写入            │
│    -wx             011           3           写+执行           │
│    r--             100           4           仅读取            │
│    r-x             101           5           读+执行           │
│    rw-             110           6           读+写             │
│    rwx             111           7           读+写+执行        │
└──────────────────────────────────────────────────────────────┘
```

**记忆技巧：**
- `r` = 4（read 有四个字母？不对——把 `r` 想象成第一位，值最大）
- `w` = 2（write 五个字母，不如 4 大）
- `x` = 1（execute 最长，值最小）
- 组合就是加法：`rwx` = 4+2+1 = 7，`rx` = 4+1 = 5，`rw` = 4+2 = 6

#### 2.4.2 将整个权限串转为八进制

一个文件的权限由三组 `rwx` 组成（Owner、Group、Others），因此可以用三个八进制数字表示：

```
权限字符:           rwx    r-x    r--
   │                │      │      │
   ▼                ▼      ▼      ▼
二进制:             111    101    100
   │                │      │      │
   ▼                ▼      ▼      ▼
八进制:              7      5      4

最终: chmod 754 file
```

```bash
# 练习：在脑海中将以下权限转为八进制，然后验证
# rwx------  = ?
# rw-r--r--  = ?
# rwxr-xr-x  = ?
# --wx--x--x = ?

# 验证你的答案
touch /tmp/perm_calc_test
chmod 700 /tmp/perm_calc_test; ls -l /tmp/perm_calc_test    # rwx------
chmod 644 /tmp/perm_calc_test; ls -l /tmp/perm_calc_test    # rw-r--r--
chmod 755 /tmp/perm_calc_test; ls -l /tmp/perm_calc_test    # rwxr-xr-x
chmod 311 /tmp/perm_calc_test; ls -l /tmp/perm_calc_test    # --wx--x--x
rm /tmp/perm_calc_test
```

#### 2.4.3 常见权限数值速查

| 八进制 | 权限串 | 常见使用场景 |
|--------|--------|-------------|
| `777` | `rwxrwxrwx` | 临时开放（极度危险，绝不用于生产环境） |
| `755` | `rwxr-xr-x` | 可执行程序、脚本、目录的标准权限 |
| `750` | `rwxr-x---` | 只允许所有者和同组用户访问的目录 |
| `700` | `rwx------` | 私密目录（如 `~/.ssh`）或私密脚本 |
| `644` | `rw-r--r--` | 普通配置文件的标准权限 |
| `640` | `rw-r-----` | 包含敏感信息的配置文件 |
| `600` | `rw-------` | 极度敏感的文件（如 SSH 私钥、数据库密码文件） |
| `400` | `r--------` | 只读配置文件（`root` 也只读，防止自己误修改） |
| `000` | `---------` | 临时锁定文件，阻止一切访问 |

### 2.5 特殊权限：SUID、SGID、Sticky Bit

除了 `rwx` 九位基本权限（3 位 x 3 类对象），Linux 还有三个**特殊权限位（Special Permission Bits）**。它们用八进制中的第 4 位数字表示：

| 特殊权限 | 符号 | 八进制值 | 作用位置 | 效果 |
|----------|------|---------|----------|------|
| **SUID**（Set User ID） | `s`（在 Owner 的 `x` 位上） | `4` | 可执行文件 | 执行该文件时，进程的**有效 UID** 变为文件所有者的 UID（而非执行者的 UID） |
| **SGID**（Set Group ID） | `s`（在 Group 的 `x` 位上） | `2` | 可执行文件 / 目录 | 文件：执行时有效 GID 变为文件的 GID。目录：在该目录中新建的文件/子目录会**自动继承**该目录的所属组 |
| **Sticky Bit**（粘滞位） | `t`（在 Others 的 `x` 位上） | `1` | 目录 | 只有文件的所有者、目录的所有者或 root 才能删除或重命名目录中的文件（尽管 Others 有目录的写权限也不能删除他人的文件） |

**八进制表示扩展：** 三个特殊权限位放在基本权限前面，构成第 4 位数字：

```
chmod 4755 file    → SUID + rwxr-xr-x
chmod 2755 file    → SGID + rwxr-xr-x
chmod 1777 dir     → Sticky Bit + rwxrwxrwx
chmod 6755 file    → SUID + SGID + rwxr-xr-x（4+2 = 6）
```

#### 2.5.1 SUID：以文件所有者的身份运行

**最经典的 SUID 案例是 `passwd` 命令：**

```bash
# 查看 passwd 命令的权限
ls -l /usr/bin/passwd
```

预期输出：

```
-rwsr-xr-x 1 root root 59976 Mar 31  2024 /usr/bin/passwd
```

注意 Owner 权限位的 `s`（`rws`）。这个 `s` 就是 SUID 位。

**为什么 `passwd` 需要 SUID？** 普通用户修改自己的密码时，需要写入 `/etc/shadow` 文件。但 `/etc/shadow` 只有 root 能写。这就是 SUID 的魔法——当你（普通用户）执行 `passwd` 时，进程的有效 UID 暂时变成 `0`（root），于是就能写入 `/etc/shadow` 了。但 `passwd` 程序内部有严格的逻辑：它只允许你修改**你自己**的密码，不会让你修改 root 的密码。

```bash
# 查看系统中所有设置了 SUID 的文件（安全检查常用）
sudo find / -perm -4000 -type f -ls 2>/dev/null
# -perm -4000 表示"至少设置了 SUID 位（4xxx）"
```

**SUID 的安全风险：** 如果一个设置了 SUID 的程序存在漏洞（如缓冲区溢出），攻击者就可以通过该程序获得文件所有者（通常是 root）的权限。因此系统管理员应定期审计系统中的 SUID 文件列表。

#### 2.5.2 SGID（在文件上）：以文件所属组的身份运行

```bash
# 查看 write 命令的权限（用于向其他用户的终端发送消息）
ls -l /usr/bin/write
```

预期输出（示例）：

```
-rwxr-sr-x 1 root tty 14880 Mar 31  2024 /usr/bin/write
```

注意 Group 权限位的 `s`（`r-s`）。执行 `write` 时，进程的有效 GID 变为 `tty` 组。

#### 2.5.3 SGID（在目录上）：共享协作目录的利器

这是 SGID 在**实践中最常用**的场景：将一个目录设置为 SGID 后，所有在该目录中新建的文件和子目录都会自动继承该目录的所属组。

```bash
# 创建一个共享目录项目
sudo mkdir /srv/project
sudo chown root:developers /srv/project
sudo chmod 2770 /srv/project        # 2 = SGID, 770 = rwxrwx---
ls -ld /srv/project
# drwxrws--- 2 root developers 4096 Jul 29 10:00 /srv/project
#        ↑ 注意这里的 s（SGID）

# 测试效果
sudo touch /srv/project/testfile
ls -l /srv/project/testfile
# -rw-rw-r-- 1 root developers 0 Jul 29 10:00 testfile
#                ↑ 自动归属 developers 组，而非 root 组！
```

如果没有 SGID，`root` 创建的文件的所属组会是 `root`（root 的主组）。有了 SGID，文件自动归属 `developers` 组——所有 `developers` 组的成员都可以根据组权限来访问它。

#### 2.5.4 Sticky Bit：保护共享目录

**最经典的 Sticky Bit 案例是 `/tmp` 目录：**

```bash
ls -ld /tmp
```

预期输出：

```
drwxrwxrwt 20 root root 4096 Jul 29 10:00 /tmp
```

注意 Others 权限位的 `t`（`rwt`）。这表示 Sticky Bit 已设置。

**为什么 `/tmp` 需要 Sticky Bit？** `/tmp` 是一个所有人都有写权限的共享目录（权限 `777`）。如果没有 Sticky Bit，`zhangsan` 可以删掉 `lisi` 在 `/tmp` 中创建的文件——因为 `lisi` 的文件对 `zhangsan` 来说是"目录中的一条记录"，而目录的写权限允许任何人增删其中的记录。Sticky Bit 阻止了这一点——只有文件的所有者（或 root）才能删。

```bash
# 验证 Sticky Bit 的效果
echo "zhangsan's file" > /tmp/zhangsan_tmp
sudo -u lisi rm /tmp/zhangsan_tmp
# rm: cannot remove '/tmp/zhangsan_tmp': Operation not permitted
# Sticky Bit 保护生效！
```

**Sticky Bit 的大小写含义：**

| 显示 | 含义 |
|------|------|
| `t`（小写） | Sticky Bit 已设置，且 Others 有执行权限（`x`） |
| `T`（大写） | Sticky Bit 已设置，但 Others **没有**执行权限（`-`）。这是一个不常见的错误配置——目录没有执行权限意味着无法进入，Sticky Bit 也就失去了意义 |

同理，SUID 和 SGID 也有大小写之分：

| 显示 | 含义 |
|------|------|
| `s`（小写） | SUID/SGID 已设置，且对应位置有执行权限（`x`） |
| `S`（大写） | SUID/SGID 已设置，但对应位置**没有**执行权限（`-`）。通常是无意错误 |

### 2.6 umask：新建文件/目录的默认权限

当你创建一个新文件或目录时，它的默认权限是**计算出来**的，而非写死在某个地方。计算的关键变量就是 `umask`（用户文件创建掩码，User File Creation Mask）。

#### 2.6.1 umask 的工作原理

```
最终权限 = 基础权限 - umask（更准确地说：基础权限 & ~umask）
```

- **文件的基础权限**始终是 `666`（`rw-rw-rw-`）——新文件默认不赋予执行权限是安全的
- **目录的基础权限**始终是 `777`（`rwxrwxrwx`）——目录必须有执行权限才能进入
- **umask** 指定了要**屏蔽（去掉）**哪些权限位

**Ubuntu 24.04 的默认 umask 为 `0002`：**

```
文件权限 = 666 - 002 = 664  →  rw-rw-r--
目录权限 = 777 - 002 = 775  →  rwxrwxr-x
```

**计算过程（以 umask 002 创建文件为例）：**

```
基础权限:  110 110 110  (666 = rw-rw-rw-)
umask:     000 000 010  (002)
───────────────────────────
结果:      110 110 100  (664 = rw-rw-r--)
                        ↑
                        Others 的 w 被屏蔽了（2 & ~2 = 2 & 5 = 0）
```

#### 2.6.2 查看和设置 umask

```bash
# 查看当前 umask（两种显示方式）
umask                           # 八进制显示：0002
umask -S                        # 符号显示：u=rwx,g=rwx,o=rx

# 临时修改 umask（仅影响当前 Shell 会话）
umask 0027                      # 新文件 640, 新目录 750

# 验证
touch /tmp/umask_test_file
mkdir /tmp/umask_test_dir
ls -ld /tmp/umask_test_file /tmp/umask_test_dir
# -rw-r----- 1 zhangsan zhangsan 0 Jul 29 10:00 /tmp/umask_test_file
# drwxr-x--- 2 zhangsan zhangsan 4096 Jul 29 10:00 /tmp/umask_test_dir
rm -rf /tmp/umask_test_file /tmp/umask_test_dir
```

#### 2.6.3 常用 umask 值对照表

| umask | 新建文件权限 | 新建目录权限 | 适用场景 |
|-------|-------------|-------------|----------|
| `0002` | `664`（rw-rw-r--） | `775`（rwxrwxr-x） | Ubuntu 默认——Others 可读但不可写 |
| `0022` | `644`（rw-r--r--） | `755`（rwxr-xr-x） | 传统 Unix 默认——同组成员不可写 |
| `0027` | `640`（rw-r-----） | `750`（rwxr-x---） | 安全敏感场景——Others 完全被禁止 |
| `0077` | `600`（rw-------） | `700`（rwx------） | 最高隐私——只有所有者能访问 |
| `0000` | `666`（rw-rw-rw-） | `777`（rwxrwxrwx） | 极度开放——不推荐，除非是特殊共享场景 |

### 2.7 ACL：超越 ugo 的细粒度控制

传统的 `ugo/rwx` 模型有一个致命的局限：你只能为一个文件指定**一个**所有者和**一个**所属组。如果你需要"`zhangsan` 读写、`lisi` 只读、`wangwu` 禁止访问"，ugo 模型做不到——除非你把 `lisi` 和 `wangwu` 分到不同的组，但组结构调整成本很高，且无法做到"对每个文件有不同的组合"。

**ACL（Access Control List，访问控制列表）**就是为解决这个问题而生的。它是一个"权限列表"，挂在文件或目录上，可以包含任意数量的条目（Entry），每条指定一个特定用户或组的权限。

```bash
# 查看一个文件是否有 ACL（注意 ls -l 输出中的 + 号）
touch /tmp/acl_demo
setfacl -m u:lisi:rw /tmp/acl_demo
ls -l /tmp/acl_demo
# -rw-rw-r--+ 1 zhangsan zhangsan 0 Jul 29 10:00 /tmp/acl_demo
#           ↑ 这个 + 号表示文件有 ACL
```

**ACL 条目类型：**

| 类型 | 语法 | 含义 | 示例 |
|------|------|------|------|
| **用户 ACL** | `u:用户名:权限` | 给特定用户设置权限 | `u:lisi:rwx`——`lisi` 有 `rwx` 权限 |
| **组 ACL** | `g:组名:权限` | 给特定组设置权限 | `g:developers:r`——`developers` 组成员有 `r` 权限 |
| **掩码（Mask）** | `m::权限` | 限制所有命名用户和命名组的**最大权限上限** | `m::r-x`——所有命名 ACL 条目最多 `r-x`，即使某条设为 `rwx`，生效的也只有 `r-x` |
| **其他（Other）** | `o::权限` | 对应 ugo 模型中的 Others（也可以通过 `chmod o+/-` 修改） | `o::---`——Others 无任何权限 |

**ACL 掩码（Mask）是理解 ACL 的关键：**

掩码是一个"上限开关"——它限制了所有命名用户条目和命名组条目的最大权限。即使你把 `u:lisi:rwx` 写入 ACL，如果掩码是 `r-x`，`lisi` 真正生效的权限也只是 `r-x`。

```bash
# 掩码的作用演示
touch /tmp/mask_demo
setfacl -m u:lisi:rwx /tmp/mask_demo
getfacl /tmp/mask_demo
# 默认掩码会自动计算为允许的最高权限

# 收紧掩码
setfacl -m m::r /tmp/mask_demo
getfacl /tmp/mask_demo
# 你会看到 u:lisi:rwx 旁边出现 #effective:r--
# 表示 lisi 实际生效的只有 r-- 权限
rm /tmp/mask_demo
```

---

## 3. 命令详解

以下全部命令的示例，请打开终端逐一运行验证。

### 3.1 ls -l：查看文件权限（扩展）

`ls -l` 在第 4 章已经介绍过，这里专门展开它在**权限查看**方面的用法。

**语法：**

```
ls [参数] [文件/目录]
```

**参数（仅列出与权限相关的部分）：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-l` | 长格式列出，显示权限、所有者、所属组、大小、时间 | 可选 | 短格式 |
| `-d` | 显示目录本身的权限，而非目录中的内容（Directory） | 可选 | 列出目录内容 |
| `-n` | 显示数字 UID 和 GID 而非用户名和组名（Numeric） | 可选 | 显示名称 |
| `-a` | 显示所有文件，包括以 `.` 开头的隐藏文件（All） | 可选 | 不显示隐藏文件 |
| `-h` | 人类可读的文件大小（Human-readable，如 1K、234M） | 可选 | 字节 |
| `-i` | 显示 inode 编号（Inode） | 可选 | 不显示 |

#### 3.1.1 `-d`：查看目录本身的权限

```bash
# 查看 /home 目录自身的权限（不加 -d 会列出 /home 下的内容）
ls -l /home
ls -ld /home
```

预期输出（对比）：

```
# ls -l /home（列出内容）
total 4
drwxr-x--- 25 zhangsan zhangsan 4096 Jul 29 10:00 zhangsan

# ls -ld /home（只显示目录自身）
drwxr-xr-x 3 root root 4096 Jul 29 10:00 /home
```

#### 3.1.2 `-n`：查看数字 UID/GID

当 `/etc/passwd` 中缺失某个用户条目时（例如挂载了另一个系统的硬盘），`ls -l` 会显示数字而非名称。此时可以用 `-n` 来确认：

```bash
ls -ln /etc/hostname
# -rw-r--r-- 1 0 0 7 Jul 29 10:00 /etc/hostname
#            ↑ ↑  UID=0(root) GID=0(root)
```

### 3.2 chmod：修改文件权限

`chmod`（Change Mode）是修改文件权限的核心命令。它支持两种模式：**符号模式（Symbolic Mode）**和**八进制模式（Octal Mode）**。

**语法：**

```
chmod [参数] <权限表达式> <文件或目录>
```

#### 3.2.1 符号模式（Symbolic Mode）

符号模式使用 `[ugoa][+-=][rwxXst]` 的语法来修改权限，适合**增量修改**——在现有基础上添加或移除某个权限。

**权限表达式语法：**

```
[谁] [操作] [什么权限]

谁（Who）：
  u = 所有者（User/Owner）
  g = 所属组（Group）
  o = 其他人（Others）
  a = 所有人（All，等同于 ugo）

操作（Operation）：
  + = 添加权限
  - = 移除权限
  = = 设置为精确权限（会覆盖原有权限）

什么权限（What）：
  r = 读
  w = 写
  x = 执行
  X = 条件执行（如果对象是目录，或者文件已有某处设置了执行权限，则添加执行权限）
  s = SUID 或 SGID
  t = Sticky Bit
```

```bash
# 创建测试文件
touch /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # 初始：-rw-rw-r--

# 给所有人添加执行权限
chmod a+x /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # -rwxrwxr-x

# 移除其他人的写权限
chmod o-w /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # -rwxrwxr-x（o 本就没有 w）

# 精确设置组权限为只读
chmod g=r /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # -rwxr--r-x

# 给所有者和组添加写权限，给其他人移除所有权限
chmod ug+w,o-rx /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # -rwxrw----

# 组合操作：同时添加和移除
chmod u-w,g+x,o+r /tmp/chmod_sym_test
ls -l /tmp/chmod_sym_test             # 根据你的命令结果
```

**`X`（大写）条件执行权限：**

```bash
# 批量操作：给目录加执行权限，但不影响普通文件
mkdir /tmp/chmod_X_test
touch /tmp/chmod_X_test/file.txt
mkdir /tmp/chmod_X_test/subdir

chmod -R a+X /tmp/chmod_X_test
ls -l /tmp/chmod_X_test/
# 目录 subdir 会获得 x 权限
# 普通文件 file.txt 不会获得 x 权限（因为文件原本没有 x）
```

#### 3.2.2 八进制模式（Octal Mode）

八进制模式使用数字来**精确设置**权限，适合一次性完整设置。

```bash
# 创建测试文件
touch /tmp/chmod_oct_test

# 设置标准权限
chmod 755 /tmp/chmod_oct_test         # rwxr-xr-x
chmod 644 /tmp/chmod_oct_test         # rw-r--r--
chmod 600 /tmp/chmod_oct_test         # rw-------

# 设置特殊权限
chmod 4755 /tmp/chmod_oct_test        # rwsr-xr-x（SUID）
chmod 2755 /tmp/chmod_oct_test        # rwxr-sr-x（SGID）

# 验证
ls -l /tmp/chmod_oct_test
```

**chmod 完整参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归修改（Recursive），对所有子目录和文件生效。**谨慎使用！** | 可选 | 仅修改指定路径 |
| `-v` | 显示每次修改的详细信息（Verbose） | 可选 | 安静模式 |
| `-c` | 仅显示被修改的条目（Changed），类似 `-v` 但跳过未变更的 | 可选 | 安静模式 |
| `--reference=<参考文件>` | 将权限设置为与参考文件相同 | 可选 | 无 |
| `-f` | 不显示大多数错误信息（Force，但不会强制修改不可修改的文件） | 可选 | 显示错误 |

#### 3.2.3 `--reference`：复制参考文件的权限

```bash
# 创建两个文件
touch /tmp/ref_file /tmp/target_file
chmod 751 /tmp/ref_file

# 将 target_file 的权限设置为与 ref_file 相同
chmod --reference=/tmp/ref_file /tmp/target_file
ls -l /tmp/ref_file /tmp/target_file
# 两者权限完全相同
```

#### 3.2.4 `chmod -R` 的陷阱与安全使用

`chmod -R`（递归修改）是最危险的文件操作之一。一个错误的 `chmod -R 777 /` 能让系统瞬间不可用。以下是在安全范围内的递归操作实践：

```bash
# 创建一个练习用的目录树
mkdir -p /tmp/chmod_r_demo/{sub1,sub2/sub3}
touch /tmp/chmod_r_demo/file1
touch /tmp/chmod_r_demo/sub2/sub3/file2

# 递归设置整个目录树为 755
chmod -R 755 /tmp/chmod_r_demo

# 验证
find /tmp/chmod_r_demo -type f -exec ls -l {} \;

# 更安全的递归：只给目录加执行权限，只给文件加读写权限
find /tmp/chmod_r_demo -type d -exec chmod 755 {} \;
find /tmp/chmod_r_demo -type f -exec chmod 644 {} \;

# 验证
ls -lR /tmp/chmod_r_demo/

rm -rf /tmp/chmod_r_demo
```

**安全准则：**
- 永远在执行 `chmod -R` 之前确认路径（`pwd && ls -la <目标路径>`）
- 永远不要对 `/`、`/etc`、`/usr` 等系统目录使用 `chmod -R`
- 如果确实需要对目录树设置不同权限（目录 `755`，文件 `644`），使用 `find` + `type` 分别处理
- 养成在执行 `chmod -R` 之前先 `echo` 预览的习惯

### 3.3 chown：修改文件所有者和所属组

`chown`（Change Owner）用于修改文件的所有者（Owner）和/或所属组（Group）。

**语法：**

```
chown [参数] <所有者>[:<所属组>] <文件或目录>
```

**基础用法：**

```bash
# 创建测试文件
sudo touch /tmp/chown_test
ls -l /tmp/chown_test                    # Owner: root, Group: root

# 仅修改所有者
sudo chown zhangsan /tmp/chown_test
ls -l /tmp/chown_test                    # Owner: zhangsan, Group: root

# 同时修改所有者和所属组
sudo chown zhangsan:zhangsan /tmp/chown_test
ls -l /tmp/chown_test                    # Owner: zhangsan, Group: zhangsan

# 仅修改所属组（也可以使用 chgrp）
sudo chown :root /tmp/chown_test
ls -l /tmp/chown_test                    # Owner: zhangsan, Group: root

# 使用 . 代替 : 也是合法的（但 : 更常见，避免了与文件名中 . 的歧义）
sudo chown root.zhangsan /tmp/chown_test
```

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归修改（Recursive） | 可选 | 仅修改指定路径 |
| `-v` | 显示每次修改的详细信息（Verbose） | 可选 | 安静模式 |
| `-c` | 仅显示被修改的条目（Changed） | 可选 | 安静模式 |
| `--reference=<参考文件>` | 将所有权设置为与参考文件相同 | 可选 | 无 |
| `-h` | 修改符号链接本身的所有者（而非它所指向的目标文件） | 可选 | 修改目标文件 |
| `--from=<当前所有者>[:<当前组>]` | 仅在当前所有者/组匹配指定值时修改（安全检查） | 可选 | 不检查 |

#### 3.3.1 `--from`：带安全检查的所有权修改

```bash
# 仅在当前所有者是 root 时才修改
sudo chown --from=root zhangsan /tmp/chown_test

# 仅在当前所有者和组都匹配时才修改
sudo chown --from=root:root zhangsan:zhangsan /tmp/chown_test

# 如果当前所有者不匹配，修改被拒绝
chown --from=lisi zhangsan /tmp/chown_test
# chown: cannot access '/tmp/chown_test': 所有权未改变
```

**为什么有 `--from`？** 在自动化脚本中，你可能有多个进程同时操作同一个文件。`--from` 提供了一种**乐观并发控制**——"如果当前所有者是 A，则改为 B"——避免了"我先检查、你再修改"之间的竞态条件（Race Condition）。

#### 3.3.2 递归修改所有权

```bash
# 整个目录树的所有权变更
sudo chown -R zhangsan:zhangsan /srv/project

# 仅修改目录的所有者，不碰文件（精确控制）
sudo find /srv/project -type d -exec chown root:developers {} \;
sudo find /srv/project -type f -exec chown zhangsan:developers {} \;
```

### 3.4 chgrp：修改文件所属组

`chgrp`（Change Group）是 `chown` 的一个子集——它只修改文件的所属组。在没有 `chown :group` 语法的旧 Unix 系统中，`chgrp` 是唯一修改组的方式。现代 Linux 中 `chown :group` 和 `chgrp` 等价。

**语法：**

```
chgrp [参数] <所属组> <文件或目录>
```

**基础用法：**

```bash
sudo touch /tmp/chgrp_test
ls -l /tmp/chgrp_test                    # Group: root

sudo chgrp zhangsan /tmp/chgrp_test
ls -l /tmp/chgrp_test                    # Group: zhangsan
```

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归修改（Recursive） | 可选 | 仅修改指定路径 |
| `-v` | 显示每次修改的详细信息（Verbose） | 可选 | 安静模式 |
| `-c` | 仅显示被修改的条目（Changed） | 可选 | 安静模式 |
| `--reference=<参考文件>` | 将所属组设置为与参考文件相同 | 可选 | 无 |
| `-h` | 修改符号链接本身的组 | 可选 | 修改目标文件 |

#### 3.4.1 普通用户使用 chgrp 的限制

与 `chown` 不同，普通用户（非 root）在**某些条件下**可以使用 `chgrp`：

```bash
# 普通用户可以修改自己文件的所属组——但只能改为自己所属的组之一
id
# 假设你在 groups: zhangsan, developers, sudo

touch /tmp/myfile
chgrp developers /tmp/myfile             # 成功（你是 developers 组成员）
chgrp root /tmp/myfile                   # 失败（你不在 root 组中）
# chgrp: changing group of '/tmp/myfile': Operation not permitted
```

### 3.5 umask：设置文件创建默认权限掩码

`umask` 既是一个命令，也是一个 Shell 内置函数。我们在这里把它当作命令来讲解。

**语法：**

```
umask [参数] [掩码值]
```

**基础用法：**

```bash
# 查看当前 umask
umask                                    # 0002
umask -S                                 # u=rwx,g=rwx,o=rx

# 修改 umask
umask 0027
umask                                    # 0027

# 测试新 umask 的效果
touch /tmp/umask_test_new
mkdir /tmp/umask_test_dir_new
ls -ld /tmp/umask_test_new /tmp/umask_test_dir_new
# -rw-r----- 1 zhangsan zhangsan 0 Jul 29 10:00 /tmp/umask_test_new
# drwxr-x--- 2 zhangsan zhangsan 4096 Jul 29 10:00 /tmp/umask_test_dir_new

rm -rf /tmp/umask_test_new /tmp/umask_test_dir_new

# 恢复默认 umask
umask 0002
```

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-S` | 以符号模式显示当前 umask（Symbolic） | 可选 | 八进制显示 |
| `-p` | 以可被 Shell 复用的格式输出（`umask 0002` 的形式，Pipeable） | 可选 | 八进制数字 |

#### 3.5.1 umask 的计算：不是减法，是位掩码

初学者常以为 `umask = 减法`。更精确的理解是：**umask 是一个位掩码，通过 `& ~umask` 操作来屏蔽权限位。**

```
文件最终权限 = 0666 & ~umask
目录最终权限 = 0777 & ~umask
```

```bash
# 示例：umask = 0023
# ~00023（按位取反）= 77754（八进制）
# 文件权限 = 0666 & 0754 = 0644 = rw-r--r--
# 目录权限 = 0777 & 0754 = 0754 = rwxr-xr--

# 在 bash 中计算验证
umask 0023
touch /tmp/calc_test
ls -l /tmp/calc_test | awk '{print $1}'  # -rw-r--r--
rm /tmp/calc_test
umask 0002                                 # 恢复默认
```

#### 3.5.2 持久化 umask 设置

`umask` 命令只影响当前 Shell 会话。要持久化，需要将设置写入配置文件：

```bash
# 为单个用户设置（写入 ~/.profile 或 ~/.bashrc）
echo "umask 0027" >> ~/.profile

# 为所有用户设置（需要 root 权限，写入 /etc/profile 或 /etc/login.defs）
# /etc/login.defs 中有 UMASK 配置项
grep "^UMASK" /etc/login.defs
```

### 3.6 getfacl：查看 ACL

`getfacl`（Get File ACL）用于查看文件或目录的 ACL 信息。

**语法：**

```
getfacl [参数] <文件或目录>
```

**基础用法：**

```bash
# 查看一个没有 ACL 的普通文件
touch /tmp/no_acl_file
getfacl /tmp/no_acl_file
```

预期输出：

```
# file: tmp/no_acl_file
# owner: zhangsan
# group: zhangsan
user::rw-
group::rw-
other::r--
```

这个输出就是"最小 ACL"——它等价于 ugo 模型的三位权限，以 ACL 的语法展示。

```bash
# 查看有 ACL 的文件（/tmp 通常有特殊的 ACL 或没有）
# 我们创建一个带 ACL 的文件
setfacl -m u:lisi:r /tmp/no_acl_file
getfacl /tmp/no_acl_file
```

预期输出：

```
# file: tmp/no_acl_file
# owner: zhangsan
# group: zhangsan
user::rw-
user:lisi:r--
group::rw-
mask::rw-
other::r--
```

**输出解读：**

| 行 | 含义 |
|----|------|
| `# file:` | 文件路径（如果省略前导 `/`，说明是相对路径） |
| `# owner:` | 文件所有者 |
| `# group:` | 文件所属组 |
| `user::` | 所有者的权限（等同于 ugo 模型中的 Owner 权限）。空用户名表示所有者 |
| `user:用户名:` | 命名用户（Named User）的 ACL 条目 |
| `group::` | 所属组的权限（等同于 ugo 模型中的 Group 权限）。空组名表示所属组 |
| `group:组名:` | 命名组（Named Group）的 ACL 条目 |
| `mask::` | ACL 掩码——命名用户和命名组的有效权限上限 |
| `other::` | 其他人的权限（等同于 ugo 模型中的 Others 权限） |

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归显示（Recursive） | 可选 | 仅显示指定路径 |
| `-t` | 以表格形式输出（Tabular），更简洁 | 可选 | 多行完整格式 |
| `-p` | 不显示前导的注释行（Path，跳过 `#` 开头的行） | 可选 | 显示注释 |
| `-n` | 显示数字 UID/GID 而非名称（Numeric） | 可选 | 显示名称 |
| `-d` | 显示默认 ACL（Default，仅对目录有意义） | 可选 | 显示访问 ACL |
| `--absolute-names` | 不剥离 `/` 前缀 | 可选 | 剥离 `/` |

```bash
# 表格形式输出（便于脚本处理）
getfacl -t /tmp/no_acl_file

# 纯 ACL 条目（不包含注释）
getfacl -p /tmp/no_acl_file
```

### 3.7 setfacl：设置 ACL

`setfacl`（Set File ACL）用于设置、修改、删除文件的 ACL 条目。

**语法：**

```
setfacl [参数] <ACL规则> <文件或目录>
```

**基础用法：**

```bash
# 创建测试文件
touch /tmp/setfacl_test

# 给特定用户授予读写权限
setfacl -m u:lisi:rw /tmp/setfacl_test

# 给特定组授予只读权限
setfacl -m g:developers:r /tmp/setfacl_test

# 查看结果
getfacl /tmp/setfacl_test

# 删除特定用户的 ACL 条目
setfacl -x u:lisi /tmp/setfacl_test

# 查看结果——lisi 的条目已删除
getfacl /tmp/setfacl_test

# 清空文件的所有 ACL（只保留最基础的 ugo 权限）
setfacl -b /tmp/setfacl_test
```

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-m` | 修改（Modify）或添加 ACL 条目 | 二选一 | -- |
| `-x` | 删除（eXclude）指定的 ACL 条目 | 二选一 | -- |
| `-b` | 清空（Blank）所有扩展 ACL 条目，只保留基础权限 | 二选一 | -- |
| `-k` | 删除所有默认 ACL（Default，仅对目录有意义） | 二选一 | -- |
| `-R` | 递归应用（Recursive） | 可选 | 仅目标路径 |
| `-d` | 设置默认 ACL（Default，仅对目录有效） | 可选 | 设置访问 ACL |
| `--set=` | 以完整 ACL 替换现有 ACL（注意与 `-m` 的区别） | 可选 | 追加/修改 |
| `--mask` | 重新计算掩码（即使你显式设置了掩码，也重新计算为所有条目的并集） | 可选 | 尊重显式掩码 |
| `-n` | 不重新计算掩码（No mask recalculation） | 可选 | 自动重新计算 |
| `-restore=<文件>` | 从备份文件恢复 ACL（与 `getfacl -R` 配合使用） | 可选 | 无 |

#### 3.7.1 `-m`：添加或修改 ACL 条目

```bash
# ACL 规则格式：u:用户名:权限, g:组名:权限, m::权限, o::权限
touch /tmp/acl_m_test

# 添加用户条目
setfacl -m u:lisi:rwx /tmp/acl_m_test

# 添加多个条目（用逗号分隔）
setfacl -m u:lisi:rwx,g:developers:rx /tmp/acl_m_test

# 修改掩码（限制所有命名条目的上限）
setfacl -m m::r /tmp/acl_m_test

# 查看：lisi 的 rwx 旁边会显示 #effective:r--
getfacl /tmp/acl_m_test

rm /tmp/acl_m_test
```

#### 3.7.2 `-x`：删除 ACL 条目

```bash
touch /tmp/acl_x_test
setfacl -m u:lisi:rw,g:developers:r /tmp/acl_x_test

# 删除特定用户的条目
setfacl -x u:lisi /tmp/acl_x_test

# 删除特定组的条目
setfacl -x g:developers /tmp/acl_x_test

# 验证
getfacl /tmp/acl_x_test
rm /tmp/acl_x_test
```

#### 3.7.3 `-b`：清空所有 ACL

```bash
touch /tmp/acl_b_test
setfacl -m u:lisi:rwx,g:developers:r /tmp/acl_b_test
ls -l /tmp/acl_b_test                    # 有 + 号

setfacl -b /tmp/acl_b_test              # 清空
ls -l /tmp/acl_b_test                    # + 号消失了
getfacl /tmp/acl_b_test                  # 只有最基础的三条
rm /tmp/acl_b_test
```

**注意：** `-b` 不会改变 ugo 基础权限。`chmod` 设置的基础权限在清空 ACL 后保持不变。

#### 3.7.4 `-d`：默认 ACL（目录继承）

这是 ACL 最实用的功能之一——在目录上设置"默认 ACL"，该目录中所有新建的文件和子目录都会**自动继承**这些 ACL 条目。

```bash
# 创建一个共享协作目录
mkdir /tmp/shared_dir

# 设置默认 ACL：所有新建文件自动授予 lisi 读写权限
setfacl -m d:u:lisi:rw /tmp/shared_dir
setfacl -m d:g:developers:r /tmp/shared_dir

# 查看目录的默认 ACL
getfacl -d /tmp/shared_dir

# 创建新文件——自动继承默认 ACL
touch /tmp/shared_dir/newfile
getfacl /tmp/shared_dir/newfile
# newfile 自动获得了 u:lisi:rw 和 g:developers:r 的 ACL

# 创建子目录——也会自动继承
mkdir /tmp/shared_dir/subdir
getfacl /tmp/shared_dir/subdir
# 子目录继承了默认 ACL 和默认 ACL 的默认 ACL（子子目录也会继承）

rm -rf /tmp/shared_dir
```

**默认 ACL 的威力：** 你在父目录设置一次默认 ACL 后，整个目录树中所有未来创建的文件和子目录都会自动获得正确的权限——无需任何额外操作。这在团队共享存储（如 `/srv/project`）的管理中极为有用。

#### 3.7.5 `--restore`：备份和恢复 ACL

```bash
# 创建一个有复杂 ACL 的目录树
mkdir -p /tmp/acl_backup_test/{dir1,dir2}
touch /tmp/acl_backup_test/{file1,dir1/file2}
setfacl -m u:lisi:rw /tmp/acl_backup_test/file1
setfacl -R -m u:lisi:rx /tmp/acl_backup_test/dir1

# 备份整个目录树的 ACL
getfacl -R /tmp/acl_backup_test > /tmp/acl_backup.txt

# 破坏 ACL（清空所有）
setfacl -R -b /tmp/acl_backup_test

# 从备份恢复
setfacl --restore=/tmp/acl_backup.txt

# 验证恢复结果
getfacl -R /tmp/acl_backup_test

rm -rf /tmp/acl_backup_test /tmp/acl_backup.txt
```

### 3.8 chattr：设置文件隐藏属性

`chattr`（Change Attribute）设置的是**文件系统扩展属性（Extended Attributes）**——这些属性超越了 `rwx` 权限系统，甚至**root 用户也无法绕过**（除非先移除属性）。这是保护关键系统文件的最后一道防线。

**语法：**

```
chattr [参数] <操作符><属性> <文件>
```

**操作符：**

| 操作符 | 含义 |
|--------|------|
| `+` | 添加属性 |
| `-` | 移除属性 |
| `=` | 将属性设置为**仅**指定的属性（移除其他所有属性） |

**常用属性：**

| 属性 | 名称 | 含义 | 典型用途 |
|------|------|------|----------|
| `a` | Append Only（仅追加） | 文件只能以追加模式打开写入。不能修改已有内容，不能删除或重命名。需要 root 权限 | 保护日志文件不被篡改或清空，同时允许持续写入新日志 |
| `i` | Immutable（不可变） | 文件完全不可修改——不能删除、重命名、写入、创建硬链接。**连 root 也不行**（除非先移除 `i` 属性） | 保护关键配置文件（如 `/etc/ssh/sshd_config`）或系统二进制文件免受篡改 |
| `A` | No Atime（不更新访问时间） | 访问此文件时不更新 `atime`（访问时间，Access Time）。减少磁盘 I/O | 在 SSD 或大量读取的文件上使用，减少不必要的写入 |
| `c` | Compressed（压缩） | 文件在磁盘上自动压缩存储，读取时自动解压。透明压缩 | 节省磁盘空间（文件系统需支持压缩，如 ext4 需要特定挂载选项） |
| `d` | No Dump（不备份） | `dump` 命令备份时跳过此文件 | 排除缓存文件或临时文件 |
| `e` | Extent Format（扩展格式） | 文件使用 extent（区段）映射存储。这是现代 ext4 文件的默认属性，**不能**用 chattr 移除 | 自动设置，无需手动管理 |
| `s` | Secure Deletion（安全删除） | 删除文件时用零覆盖数据块。注意：现代系统不建议依赖此属性；使用专用工具如 `shred` | 高安全环境中的数据销毁 |
| `S` | Synchronous Updates（同步更新） | 对此文件的修改立即写入磁盘（而非先缓存在内存中再批量写入），类似挂载选项 `sync` | 关键数据文件需要立即持久化到磁盘 |
| `u` | Undeletable（可恢复） | 删除文件时保留其内容以便恢复。注意：现代系统不建议依赖此属性 | 防止误删除 |

#### 3.8.1 `i` 属性（不可变，最重要）

```bash
# 创建一个受保护的文件
sudo touch /tmp/immutable_test
echo "This file is protected." | sudo tee /tmp/immutable_test
cat /tmp/immutable_test

# 设置不可变属性
sudo chattr +i /tmp/immutable_test

# 尝试删除（即使是 root 也不行）
sudo rm /tmp/immutable_test
# rm: cannot remove '/tmp/immutable_test': Operation not permitted

# 尝试修改
echo "new content" | sudo tee /tmp/immutable_test
# tee: /tmp/immutable_test: Operation not permitted

# 尝试重命名
sudo mv /tmp/immutable_test /tmp/renamed_test
# mv: cannot move '/tmp/immutable_test' to '/tmp/renamed_test': Operation not permitted

# 解除不可变属性后才能操作
sudo chattr -i /tmp/immutable_test
sudo rm /tmp/immutable_test               # 现在可以删除了
```

**`i` 属性的使用场景：**

| 场景 | 操作 |
|------|------|
| 保护 SSH 配置免遭篡改 | `sudo chattr +i /etc/ssh/sshd_config` |
| 锁定 DNS 解析器配置 | `sudo chattr +i /etc/resolv.conf` |
| 防止系统关键二进制被替换（Rootkit 防御） | `sudo chattr +i /bin/ls`（不推荐用于所有场景，因为会阻止系统更新） |
| 锁定 sudoers 配置 | `sudo chattr +i /etc/sudoers`（注意：visudo 保存前会自动移除 `i`？不——visudo 会报错！所以需要先 `-i` 再编辑） |

**重要提醒：** 如果对 `/etc/sudoers` 设置了 `+i` 属性，`visudo` 在保存时会失败（无法写入）。这是保护，也是陷阱——请确保记住哪些文件设置了 `i` 属性。

#### 3.8.2 `a` 属性（仅追加）

```bash
# 创建一个日志文件
sudo touch /tmp/append_only.log
sudo chattr +a /tmp/append_only.log

# 可以追加内容
echo "Log line 1" | sudo tee -a /tmp/append_only.log
echo "Log line 2" | sudo tee -a /tmp/append_only.log

# 查看内容（读取不受影响）
cat /tmp/append_only.log

# 不能覆盖（即使使用 >）
sudo -s
echo "Trying to overwrite" > /tmp/append_only.log
# bash: /tmp/append_only.log: Operation not permitted
exit

# 不能删除
sudo rm /tmp/append_only.log
# rm: cannot remove '/tmp/append_only.log': Operation not permitted

# 不能截断（truncate）
sudo truncate -s 0 /tmp/append_only.log
# truncate: cannot open '/tmp/append_only.log' for writing: Operation not permitted

# 清理
sudo chattr -a /tmp/append_only.log
sudo rm /tmp/append_only.log
```

**`a` 属性的典型场景：** 服务器日志文件。你可以设置 `+a` 保护历史日志不被篡改或清空，同时允许日志服务持续追加新条目。注意：大多数日志轮转工具（如 `logrotate`）需要写权限来移动/重命名日志文件，`+a` 会导致轮转失败。使用前请确认日志工具兼容性。

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归设置属性（Recursive） | 可选 | 仅指定路径 |
| `-V` | 显示版本信息（Version） | 可选 | 不显示 |
| `-f` | 抑制大多数错误信息（Force） | 可选 | 显示错误 |
| `-v` | 显示每次修改的详细信息（Verbose） | 可选 | 安静模式 |

```bash
# 递归设置目录下所有文件的不可变属性（谨慎！）
sudo chattr -R +i /etc/myapp/configs/
# 验证
sudo lsattr -R /etc/myapp/configs/
```

### 3.9 lsattr：查看文件隐藏属性

`lsattr`（List Attributes）用于查看 `chattr` 设置的隐藏属性。它是 `chattr` 的"查看伴侣"。

**语法：**

```
lsattr [参数] [文件或目录]
```

**基础用法：**

```bash
# 查看单个文件
sudo lsattr /tmp/append_only.log
# 输出类似: -----a-------------- /tmp/append_only.log

# 查看目录下的所有文件（默认不递归）
sudo lsattr /tmp/

# 查看当前目录
lsattr
```

**参数：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-R` | 递归查看（Recursive），进入子目录 | 可选 | 仅当前层级 |
| `-a` | 查看所有文件，包括以 `.` 开头的隐藏文件（All） | 可选 | 跳过隐藏文件 |
| `-d` | 显示目录本身的属性，而非其内容（Directory） | 可选 | 列出目录内容 |
| `-l` | 显示属性的完整名称（Long format），而非缩写 | 可选 | 缩写格式 |
| `-v` | 显示文件版本/生成编号（Version） | 可选 | 不显示 |

```bash
# 查看指定文件属性
touch /tmp/lsattr_test
sudo chattr +ai /tmp/lsattr_test
lsattr /tmp/lsattr_test
# ----ia-------------- /tmp/lsattr_test
#      ↑↑ i 和 a 属性已设置

# 展示长格式属性名
lsattr -l /tmp/lsattr_test
# /tmp/lsattr_test          Immutable, Append_Only

# 查看目录本身而非目录内容
mkdir /tmp/lsattr_dir_test
sudo chattr +i /tmp/lsattr_dir_test
lsattr -d /tmp/lsattr_dir_test
# ----i--------------- /tmp/lsattr_dir_test

sudo chattr -i /tmp/lsattr_dir_test
sudo chattr -a -i /tmp/lsattr_test
rm -rf /tmp/lsattr_dir_test /tmp/lsattr_test
```

**输出格式：**

```
-----ia-------------e--  /tmp/somefile
││││││││││││││││││││││
│││││││││││││││││││││└── e: Extent Format（默认，不可改变）
││││││││││││││││││││└── ... 更多位置
│└┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴── 属性字母（从右到左：A, a, c, d, e, i, j, s, S, u, ...）
└────────────────────── 共 22 个属性位（具体支持哪些取决于文件系统）
```

---

## 4. 实战练习

### 准备练习环境

```bash
# 确认你有 sudo 权限
sudo -v && echo "sudo 权限已确认" || echo "请确保你的账户有 sudo 权限"

# 创建练习用的测试用户
sudo useradd -m -s /bin/bash ch08user1 2>/dev/null
sudo useradd -m -s /bin/bash ch08user2 2>/dev/null
sudo passwd -q ch08user1 2>/dev/null || sudo passwd ch08user1
# 设置一个简单密码（练习用，如 Test1234!）

# 创建练习用工作目录
mkdir -p ~/ch08-practice
cd ~/ch08-practice
```

---

### 练习 8.1：理解 rwx 权限的基础含义

**题目：**

（1）创建一个文件 `hello.sh`，写入 `#!/bin/bash` 和 `echo "Hello World"`。

（2）使用 `ls -l` 查看该文件的初始权限。尝试直接运行它：`./hello.sh`。能成功吗？为什么？

（3）给文件添加执行权限（两种方式：`chmod +x` 和 `chmod u+x`），再次尝试运行。

（4）移除文件的读权限：`chmod -r hello.sh`。尝试 `cat hello.sh`。能成功吗？

（5）恢复读权限。然后移除写权限：`chmod -w hello.sh`。尝试用 `echo "new line" >> hello.sh` 追加内容。能成功吗？

（6）将文件权限设为 `000`（`chmod 000 hello.sh`）。尝试读取、写入、执行。三种操作分别是什么结果？

**答案：**

（1）：

```bash
cat > hello.sh << 'EOF'
#!/bin/bash
echo "Hello World"
EOF
```

（2）：

```bash
ls -l hello.sh
# -rw-rw-r-- 1 zhangsan zhangsan ... hello.sh（没有 x 权限）

./hello.sh
# bash: ./hello.sh: Permission denied
# 原因：没有执行权限。虽然脚本内容正确，但系统不允许将其作为程序运行
```

（3）：

```bash
chmod +x hello.sh
./hello.sh                    # 输出: Hello World

# 或者
chmod u+x hello.sh
./hello.sh                    # 输出: Hello World
```

（4）：

```bash
chmod -r hello.sh
cat hello.sh
# cat: hello.sh: Permission denied
# 因为没有读权限，无法查看文件内容
```

（5）：

```bash
chmod +r hello.sh              # 恢复读权限
chmod -w hello.sh
echo "new line" >> hello.sh
# bash: hello.sh: Permission denied
# 没有写权限，无法修改文件内容
```

（6）：

```bash
chmod 000 hello.sh
ls -l hello.sh                 # ---------- 1 zhangsan zhangsan ...
cat hello.sh                   # Permission denied（无读权限）
echo "x" >> hello.sh           # Permission denied（无写权限）
./hello.sh                     # Permission denied（无执行权限）

# 注意：即使自己是所有者，也无法访问——ugo 中的第一组 "Owner" 就是 ---
# 恢复权限（作为所有者，你仍然可以修改权限）
chmod 755 hello.sh
```

---

### 练习 8.2：目录权限的独特行为实验

**题目：**

（1）创建一个目录 `testdir`，在其中创建一个文件 `secret.txt`（内容任意）。

（2）设置目录权限为 `r--`（400）。尝试 `ls testdir`、`cd testdir`、`cat testdir/secret.txt`。分别成功还是失败？

（3）设置目录权限为 `-wx`（300）。尝试 `ls testdir`、`cd testdir`（进入后 `ls`）、`cat testdir/secret.txt`（已知文件名的情况下）。

（4）设置目录权限为 `r-x`（500）。尝试 `cd testdir` 并在其中 `touch newfile.txt`。能成功吗？

（5）仅设置目录权限为 `--x`（100）。尝试 `cd testdir` 并 `ls`。结果如何？这说明了什么？

**答案：**

（1）：

```bash
mkdir testdir
echo "This is a secret." > testdir/secret.txt
```

（2）：

```bash
chmod 400 testdir
ls testdir
# 成功：可以列出文件名（有 r 权限）
# 但会看到文件权限旁边显示 ? 或错误信息（无法读取 inode 的详细信息）

cd testdir
# bash: cd: testdir: Permission denied
# 失败：没有 x 权限，无法进入目录

cat testdir/secret.txt
# cat: testdir/secret.txt: Permission denied
# 失败：虽然知道文件名，但无法进入目录访问它
```

（3）：

```bash
chmod 300 testdir
ls testdir
# ls: cannot open directory 'testdir': Permission denied
# 失败：没有 r 权限，无法列出目录内容

cd testdir
# 成功！
ls
# ls: cannot open directory '.': Permission denied
# 进入后在目录内仍然无法列出内容

cat secret.txt
# 成功！——因为你知道文件名，并且有 x 权限（可以"触碰"文件）
```

（4）：

```bash
chmod 500 testdir
cd testdir
touch newfile.txt
# touch: cannot touch 'newfile.txt': Permission denied
# 失败：没有 w 权限，不能在目录中创建文件
exit                     # 退出 testdir（如果有 cd 进入的话）
```

（5）：

```bash
chmod 100 testdir
cd testdir
# 成功：x 权限允许进入
ls
# ls: cannot open directory '.': Permission denied
# 失败：没有 r 权限，无法列出内容
# 这说明：x 是"进入许可"，r 是"列出许可"，两者独立
```

**清理：**

```bash
cd ~/ch08-practice
rm -rf testdir
```

---

### 练习 8.3：八进制权限计算

**题目：**

（1）不做任何计算，直接说出以下八进制数字对应的权限字符串：
   - `755` = ?
   - `644` = ?
   - `600` = ?
   - `777` = ?
   - `750` = ?

（2）不做任何计算，直接说出以下权限字符串对应的八进制数字：
   - `rwxr-xr-x` = ?
   - `rw-r-----` = ?
   - `rwx------` = ?
   - `--wx-w--wx` = ?
   - `r--------` = ?

（3）使用 `chmod` 八进制模式，创建一个文件并验证上述所有权限值。

**答案：**

（1）：

```
755 = rwxr-xr-x （7=rwx, 5=r-x, 5=r-x）
644 = rw-r--r-- （6=rw-, 4=r--, 4=r--）
600 = rw------- （6=rw-, 0=---, 0=---）
777 = rwxrwxrwx （7=rwx, 7=rwx, 7=rwx）
750 = rwxr-x--- （7=rwx, 5=r-x, 0=---）
```

（2）：

```
rwxr-xr-x = 755 （rwx=7, r-x=5, r-x=5）
rw-r----- = 640 （rw-=6, r--=4, ---=0）
rwx------ = 700 （rwx=7, ---=0, ---=0）
--wx-w--wx = 323 （-wx=3, -w-=2, -wx=3）
r-------- = 400 （r--=4, ---=0, ---=0）
```

（3）：

```bash
touch octal_test
for perm in 755 644 600 777 750 640 700 323 400; do
    chmod $perm octal_test
    echo -n "chmod $perm → "
    ls -l octal_test | awk '{print $1}'
done
rm octal_test
```

---

### 练习 8.4：特殊权限 SUID/SGID/Sticky Bit 的识别与实践

**题目：**

（1）在系统中找到三个设置了 SUID 的程序（提示：使用 `find -perm -4000`）。写出路径和权限串。

（2）查看 `/usr/bin/passwd` 的权限，识别它的 SUID 位，并解释为什么 `/usr/bin/passwd` 需要 SUID。

（3）创建一个共享目录 `/tmp/shared_project`，设置 SGID 位（`2770`）。验证在该目录中新建文件的所属组会自动继承目录的所属组。

（4）查看 `/tmp` 的权限，识别 Sticky Bit（`t`）。创建一个测试文件，切换到另一个用户（`ch08user1`），尝试删除该文件。解释为什么删除失败。

（5）使用八进制模式设置以下特殊权限组合：
   - `chmod 4755` — 解释第 4 位数字 4 的含义
   - `chmod 2755` — 解释第 4 位数字 2 的含义
   - `chmod 1777` — 解释第 4 位数字 1 的含义

**答案：**

（1）：

```bash
sudo find / -perm -4000 -type f 2>/dev/null | head -n 30
# 常见结果：
# /usr/bin/passwd    -rwsr-xr-x（SUID）
# /usr/bin/sudo      -rwsr-xr-x（SUID）
# /usr/bin/su        -rwsr-xr-x（SUID）
# /usr/bin/chsh      -rwsr-xr-x（SUID）
# /usr/bin/gpasswd   -rwsr-xr-x（SUID）
```

（2）：

```bash
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root 59976 ... /usr/bin/passwd
#   ↑ Owner 权限位的 s = SUID

# 为什么需要 SUID：
# passwd 命令需要写入 /etc/shadow 来修改密码
# 但 /etc/shadow 只有 root 可写
# 普通用户执行 passwd 时，SUID 将进程的有效 UID 临时变为 0（root）
# 这样就能写入 /etc/shadow 了
# 而 passwd 程序内部有逻辑确保只能修改自己的密码
```

（3）：

```bash
sudo mkdir -p /tmp/shared_project
sudo chown root:zhangsan /tmp/shared_project   # 使用你自己的组
sudo chmod 2770 /tmp/shared_project
ls -ld /tmp/shared_project
# drwxrws--- 2 root zhangsan ... /tmp/shared_project
#        ↑ s = SGID

# 测试继承效果
sudo touch /tmp/shared_project/rootfile
ls -l /tmp/shared_project/rootfile
# -rw-rw-r-- 1 root zhangsan ... rootfile
# 注意所属组是 zhangsan（目录的组），而非 root（创建者的主组）
# 这说明 SGID 继承生效了！

sudo rm -rf /tmp/shared_project
```

（4）：

```bash
ls -ld /tmp
# drwxrwxrwt 20 root root ... /tmp
#         ↑ t = Sticky Bit

# 创建测试文件
echo "my temp file" > /tmp/sticky_test

# 尝试用另一个用户删除
sudo -u ch08user1 rm /tmp/sticky_test
# rm: cannot remove '/tmp/sticky_test': Operation not permitted
# 即使 ch08user1 对 /tmp 有写权限，Sticky Bit 阻止了删除他人文件的尝试

rm /tmp/sticky_test
```

（5）：

| 命令 | 第 4 位 | 含义 |
|------|---------|------|
| `chmod 4755 file` | 4 | 设置 SUID。执行文件时，进程有效 UID 变为文件所有者的 UID |
| `chmod 2755 file` | 2 | 设置 SGID。执行文件时，进程有效 GID 变为文件所属组；如果是目录，新建文件继承目录的所属组 |
| `chmod 1777 dir` | 1 | 设置 Sticky Bit。只有文件所有者和 root 能删除目录中的文件 |
| `chmod 6755 file` | 6 = 4+2 | 同时设置 SUID 和 SGID |

---

### 练习 8.5：umask 的实际效果

**题目：**

（1）记录当前 umask 值。然后依次测试以下 umask 值下新建文件和目录的权限：
   - `umask 0002`（Ubuntu 默认）
   - `umask 0022`
   - `umask 0027`
   - `umask 0077`

（2）每次修改 umask 后，验证新建文件的权限。将结果填入下表（或记录在终端中）：

| umask | 新建文件权限 | 新建目录权限 |
|-------|-------------|-------------|
| 0002  | ?           | ?           |
| 0022  | ?           | ?           |
| 0027  | ?           | ?           |
| 0077  | ?           | ?           |

（3）恢复为原始 umask 值。

**答案：**

（1）、（2）：

```bash
# 记录原始 umask
ORIG_UMASK=$(umask)
echo "原始 umask: $ORIG_UMASK"

# 测试各种 umask
for mask in 0002 0022 0027 0077; do
    umask $mask
    touch /tmp/umask_file_${mask}
    mkdir /tmp/umask_dir_${mask}
    echo -n "umask $mask → 文件: "
    ls -l /tmp/umask_file_${mask} | awk '{print $1}'
    echo -n "umask $mask → 目录: "
    ls -ld /tmp/umask_dir_${mask} | awk '{print $1}'
    rm -rf /tmp/umask_file_${mask} /tmp/umask_dir_${mask}
done
```

预期结果：

| umask | 新建文件权限 | 新建目录权限 |
|-------|-------------|-------------|
| 0002  | -rw-rw-r--（664） | drwxrwxr-x（775） |
| 0022  | -rw-r--r--（644） | drwxr-xr-x（755） |
| 0027  | -rw-r-----（640） | drwxr-x---（750） |
| 0077  | -rw-------（600） | drwx------（700） |

（3）：

```bash
umask $ORIG_UMASK
echo "umask 已恢复为: $(umask)"
```

---

### 练习 8.6：ACL 的添加、查看、删除和继承

**题目：**

（1）创建文件 `acl_file.txt`。使用 `setfacl` 为 `ch08user1` 授予读写权限，为 `ch08user2` 授予只读权限。使用 `getfacl` 验证。

（2）查看 `ls -l acl_file.txt` 的输出。你看到了什么特殊标志？这表示什么？

（3）修改掩码为 `r--`。再次使用 `getfacl` 查看。`ch08user1` 的条目前出现了什么标记？它表示什么？

（4）删除 `ch08user1` 的 ACL 条目。验证删除结果。

（5）清空文件的所有 ACL（`-b`）。确认文件回到纯粹的 ugo 权限状态。

（6）创建目录 `acl_dir`，设置默认 ACL：`ch08user1` 具有 `rwx` 权限。验证在 `acl_dir` 中新建的文件和子目录自动继承此 ACL。

（7）使用 `getfacl -R` 备份 `acl_dir` 的 ACL，然后清空所有 ACL，再从备份恢复。验证恢复是否成功。

**答案：**

（1）：

```bash
echo "ACL practice file" > acl_file.txt
setfacl -m u:ch08user1:rw- acl_file.txt
setfacl -m u:ch08user2:r-- acl_file.txt

getfacl acl_file.txt
# 应能看到 u:ch08user1:rw- 和 u:ch08user2:r--
```

（2）：

```bash
ls -l acl_file.txt
# -rw-rw-r--+ 1 zhangsan zhangsan ... acl_file.txt
#           ↑ + 号表示该文件有扩展 ACL
```

（3）：

```bash
setfacl -m m::r-- acl_file.txt
getfacl acl_file.txt
# u:ch08user1:rw- 旁边应该显示 #effective:r--
# 这表示：虽然 ACL 条目是 rw-，但掩码将实际生效权限限制为 r--
```

（4）：

```bash
setfacl -x u:ch08user1 acl_file.txt
getfacl acl_file.txt
# ch08user1 的条目应该已消失
```

（5）：

```bash
setfacl -b acl_file.txt
ls -l acl_file.txt             # + 号消失
getfacl acl_file.txt           # 只有 user:: group:: other:: 三条
```

（6）：

```bash
mkdir acl_dir
setfacl -m d:u:ch08user1:rwx acl_dir
getfacl -d acl_dir             # 查看默认 ACL

# 测试继承
touch acl_dir/inherited_file.txt
mkdir acl_dir/inherited_subdir
getfacl acl_dir/inherited_file.txt
getfacl acl_dir/inherited_subdir
# 两者都应该自动获得了 u:ch08user1:rwx 的 ACL
```

（7）：

```bash
# 备份
getfacl -R acl_dir > acl_backup.txt

# 清空
setfacl -R -b acl_dir
getfacl -R acl_dir             # 只有基础权限

# 恢复
setfacl --restore=acl_backup.txt
getfacl -R acl_dir             # ACL 已经恢复

rm acl_backup.txt
```

---

### 练习 8.7：chattr 隐藏属性的设置与验证

**题目：**

（1）创建一个普通文件 `protected.txt`。使用 `lsattr` 查看它的当前属性（应该只有基本属性如 `e`）。

（2）使用 `chattr +i` 设置不可变属性。尝试删除、修改、重命名该文件。解释为什么 root 也无法绕过。

（3）使用 `lsattr` 验证 `i` 属性已设置。

（4）移除 `i` 属性（`chattr -i`），然后删除文件。

（5）创建一个文件 `append_log.txt`，设置 `a` 属性。尝试：用 `echo >>` 追加内容（应成功），用 `echo >` 覆盖内容（应失败），用 `rm` 删除（应失败）。

（6）移除 `a` 属性并清理文件。

**答案：**

（1）：

```bash
echo "protected data" > protected.txt
lsattr protected.txt
# 输出类似: ---------------e-- protected.txt
# e = Extent Format（ext4 默认属性）
```

（2）：

```bash
sudo chattr +i protected.txt

# 尝试删除
sudo rm protected.txt
# rm: cannot remove 'protected.txt': Operation not permitted

# 尝试修改
echo "new data" | sudo tee protected.txt
# tee: protected.txt: Operation not permitted

# 尝试重命名
sudo mv protected.txt renamed.txt
# mv: cannot move 'protected.txt' to 'renamed.txt': Operation not permitted

# 为什么 root 也无法绕过：
# i 属性是文件系统的底层限制，操作系统内核在执行任何修改操作前
# 都会检查 inode 的扩展属性。它发生在权限检查之前——即使 root
# （UID 0）也无法绕过文件系统层的不可变标志。
```

（3）：

```bash
lsattr protected.txt
# ----i-------------e-- protected.txt
#     ↑ i 属性已设置
```

（4）：

```bash
sudo chattr -i protected.txt
rm protected.txt
```

（5）：

```bash
echo "line 1" > append_log.txt
sudo chattr +a append_log.txt

# 追加（应成功）
echo "line 2" | sudo tee -a append_log.txt
cat append_log.txt
# line 1
# line 2

# 覆盖（应失败）
echo "overwrite" | sudo tee append_log.txt
# tee: append_log.txt: Operation not permitted

# 删除（应失败）
sudo rm append_log.txt
# rm: cannot remove 'append_log.txt': Operation not permitted
```

（6）：

```bash
sudo chattr -a append_log.txt
rm append_log.txt
```

---

### 练习 8.8：chown 和 chgrp 的所有权管理

**题目：**

（1）以 root 身份创建文件 `owned.txt`。查看其所有者（应为 root）。

（2）将该文件的所有者改为你自己，所属组改为你的主组。使用 `chown` 一次性完成。

（3）仅修改文件所属组为 `adm`（如果你的用户属于 `adm` 组）。

（4）创建一个符号链接 `link_to_owned.txt` 指向 `owned.txt`。使用 `chown -h` 修改符号链接本身的所有者（而非目标文件）。

（5）使用 `chown --from` 做一次带安全检查的所有权修改——仅在当前所有者为指定用户时才允许修改。

**答案：**

（1）：

```bash
sudo touch owned.txt
ls -l owned.txt
# -rw-r--r-- 1 root root 0 ... owned.txt
```

（2）：

```bash
sudo chown $(whoami):$(id -gn) owned.txt
ls -l owned.txt
# -rw-r--r-- 1 zhangsan zhangsan 0 ... owned.txt（所有者和组都变了）
```

（3）：

```bash
sudo chown :adm owned.txt
ls -l owned.txt
# -rw-r--r-- 1 zhangsan adm 0 ... owned.txt
```

（4）：

```bash
ln -s owned.txt link_to_owned.txt
ls -l link_to_owned.txt          # 注意：符号链接本身通常显示 lrwxrwxrwx

# 修改符号链接本身的所有者（而非目标文件）
sudo chown -h ch08user1 link_to_owned.txt
ls -l link_to_owned.txt
# 符号链接的所有者变成了 ch08user1
# 但 owned.txt 的所有者保持不变

rm link_to_owned.txt
```

（5）：

```bash
# 仅在当前所有者是 zhangsan 时才修改
sudo chown --from=zhangsan root owned.txt
ls -l owned.txt
# -rw-r--r-- 1 root adm 0 ... owned.txt（修改成功，因为当前所有者确实是 zhangsan）

# 仅在当前所有者是 lisi 时才修改（会失败，因为当前所有者是 root）
sudo chown --from=lisi zhangsan owned.txt
# chown: cannot access 'owned.txt': ... （修改被拒绝）

rm owned.txt
```

---

### 练习 8.9：综合权限排错

**题目：**

以下是一个模拟的真实场景：一个 Web 开发者向你求助，说他的脚本无法正常工作。请诊断并修复。

```bash
# 模拟场景设置（由你来执行）
sudo mkdir -p /tmp/webapp
sudo touch /tmp/webapp/config.ini
sudo chown root:root /tmp/webapp/config.ini
sudo chmod 640 /tmp/webapp/config.ini         # root 可读写，root 组可读

# 开发者（ch08user1）报告：
# 1. 无法读取配置文件：cat /tmp/webapp/config.ini → Permission denied
# 2. 无法在应用目录中创建文件：touch /tmp/webapp/test → Permission denied
# 3. 无法进入应用目录：cd /tmp/webapp → Permission denied
```

请：

（1）使用 `ls -l` 和 `ls -ld` 查看相关文件和目录的权限。

（2）诊断每个问题的根本原因（权限、所有者、所属组哪个不对）。

（3）逐一修复每个问题，使 `ch08user1` 能够：
   - 读取 `/tmp/webapp/config.ini`
   - 在 `/tmp/webapp` 目录中创建文件
   - 进入 `/tmp/webapp` 目录

**注意：** 不要使用 `chmod 777`！

**答案：**

（1）诊断：

```bash
ls -l /tmp/webapp/config.ini
ls -ld /tmp/webapp

# /tmp/webapp: drwxr-xr-x root root
# /tmp/webapp/config.ini: -rw-r----- root root
```

（2）根本原因分析：

- **问题 1（无法读取 config.ini）：** 文件权限 `640` = `rw-r-----`。文件属于 root:root，ch08user1 既不是 root（UID 不匹配），也不在 root 组中（GID 不匹配），所以 ch08user1 以 Others 身份访问——Others 权限为 `---`，无法读取。

- **问题 2&3（无法创建文件和进入目录）：** 目录权限是 `drwxr-xr-x`（755），目录属于 root:root。ch08user1 作为 Others 有 `r-x` 权限——可以进入（`x`）和列出目录（`r`），但**没有写权限**（`w`）。因此可以 `cd` 但不能创建文件。

（3）修复方案：

```bash
# 方案一：使用 ACL 授予 ch08user1 特定权限（推荐——最小权限）
setfacl -m u:ch08user1:r /tmp/webapp/config.ini
setfacl -m u:ch08user1:rwx /tmp/webapp

# 方案二：将文件所属组改为 ch08user1 所在的组
sudo chown :zhangsan /tmp/webapp/config.ini
sudo chmod 660 /tmp/webapp/config.ini        # Owner 和 Group 都可读写
sudo chown :zhangsan /tmp/webapp
sudo chmod 775 /tmp/webapp                   # Owner 和 Group 都有 rwx

# 验证修复
sudo -u ch08user1 cat /tmp/webapp/config.ini
sudo -u ch08user1 touch /tmp/webapp/test
sudo -u ch08user1 bash -c "cd /tmp/webapp && pwd"

# 清理
sudo rm -rf /tmp/webapp
```

---

### 练习 8.10：安全审计——找出权限不当的文件

**题目：**

模拟一次生产环境安全检查。完成以下检查项：

（1）找出 `/etc` 中所有**任何人可写**的文件（Others 有 `w` 权限）。

（2）找出你的家目录中所有权限为 `777` 的文件和目录。

（3）找出 `/tmp` 中不属于你但你却有写权限的文件（利用 `find -writable`）。

（4）检查你的 `~/.ssh/` 目录下私钥文件的权限是否为 `600`。如果权限过于宽松（如 `644` 或 `664`），SSH 会拒绝使用该私钥。

（5）列出系统中所有设置了 SUID 位的文件，检查是否有你不认识的可疑文件。

**答案：**

（1）：

```bash
find /etc -type f -perm -o=w 2>/dev/null
# 也可以使用：find /etc -type f -perm -0002
# 正常情况下，/etc 中几乎没有 o+w 的文件。如果发现了，应立即检查原因
```

（2）：

```bash
find ~ -perm 0777 2>/dev/null
# 正常情况下应该为空。如果有文件，应立即收紧权限
```

（3）：

```bash
find /tmp -writable -not -user $(whoami) 2>/dev/null
# 注意：/tmp 中你有写权限的文件可能是因为文件属于你，或者因为目录权限开放
```

（4）：

```bash
ls -l ~/.ssh/id_* 2>/dev/null
# 私钥文件（id_rsa, id_ed25519 等）应显示：
# -rw------- 1 zhangsan zhangsan ... id_rsa
# 如果权限不是 600，SSH 会拒绝使用：
# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
# Permissions 0644 for '/home/zhangsan/.ssh/id_rsa' are too open.
# It is required that your private key files are NOT accessible by others.

# 修复：
chmod 600 ~/.ssh/id_rsa 2>/dev/null
chmod 600 ~/.ssh/id_ed25519 2>/dev/null
```

（5）：

```bash
sudo find / -perm -4000 -type f -ls 2>/dev/null
# 正常系统中常见的 SUID 文件：
# /usr/bin/passwd、/usr/bin/sudo、/usr/bin/su、/usr/bin/chsh、
# /usr/bin/gpasswd、/usr/bin/newgrp
# 如果你在 /tmp、/home、/var/tmp 等用户可写目录中发现了 SUID 文件，
# 这可能是恶意软件或后门——立即调查！
```

---

### 清理练习环境

```bash
# 删除本章创建的所有文件
rm -rf ~/ch08-practice

# 删除测试用户
sudo userdel -r ch08user1 2>/dev/null
sudo userdel -r ch08user2 2>/dev/null

# 清理临时文件
sudo rm -f /tmp/chown_test /tmp/chgrp_test /tmp/chmod_sym_test \
          /tmp/chmod_oct_test /tmp/ref_file /tmp/target_file \
          /tmp/umask_test_new /tmp/umask_test_dir_new \
          /tmp/no_acl_file /tmp/acl_demo /tmp/setfacl_test \
          /tmp/acl_x_test /tmp/acl_b_test /tmp/acl_m_test \
          /tmp/append_only.log /tmp/lsattr_test /tmp/immutable_test

echo "练习环境已清理"
```

---

## 5. 常见错误与排错

### 5.1 "chmod: changing permissions of 'xxx': Operation not permitted"——你不是文件所有者

**现象：**

```bash
chmod 755 /etc/hostname
```

```
chmod: changing permissions of '/etc/hostname': Operation not permitted
```

**原因：** 只有文件的所有者和 root 才能修改文件的权限。`/etc/hostname` 的所有者是 root。

**解决：**

```bash
# 检查文件所有权
ls -l /etc/hostname

# 如果文件属于 root，使用 sudo
sudo chmod 755 /etc/hostname
```

**记忆技巧：** 能改权限的人只有两个——文件的主人和 root。组成员不行，Others 更不行。

### 5.2 脚本有执行权限但仍然 "Permission denied"

**现象：**

```bash
./script.sh
```

```
bash: ./script.sh: Permission denied
```

但你确认文件权限已经加了执行位：

```bash
ls -l script.sh
# -rwxr-xr-x 1 zhangsan zhangsan ... script.sh  ← 有 x 权限！
```

**可能的原因：**

| 原因 | 排查命令 | 解决 |
|------|----------|------|
| 脚本所在的分区以 `noexec` 挂载（禁止执行任何程序） | `mount \| grep $(df . \| tail -1 \| awk '{print $1}')` | 重新挂载去掉 `noexec`：`sudo mount -o remount,exec /path` |
| 脚本的 Shebang（`#!/bin/bash`）指向了不存在的解释器 | `head -1 script.sh`，然后 `ls -l /bin/bash` | 修正 Shebang 路径 |
| 文件设置了 `i`（不可变）属性 | `lsattr script.sh` | `sudo chattr -i script.sh` |

### 5.3 SSH 私钥权限错误——"Permissions are too open"

**现象：**

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/user/.ssh/id_rsa' are too open.
It is required that your private key files are NOT accessible by others.
```

**原因：** SSH 私钥文件必须只有所有者可读写（`600`）。如果 Group 或 Others 有任何权限，SSH 会拒绝使用该私钥——这是为了防止私钥泄露。

**解决：**

```bash
chmod 600 ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_ed25519   # 如果使用 Ed25519 密钥
```

**扩展：** 同样，`~/.ssh` 目录本身权限也有限制——通常应为 `700`（只有所有者可以进入）：

```bash
chmod 700 ~/.ssh
```

### 5.4 "setfacl: Operation not supported"——文件系统不支持 ACL

**现象：**

```bash
setfacl -m u:lisi:rw file.txt
```

```
setfacl: file.txt: Operation not supported
```

**原因：** 文件所在的分区不支持 ACL（如挂载时没有 `acl` 选项，或文件系统类型本身不支持 ACL）。

**排查与解决：**

```bash
# 1. 检查分区的挂载选项
mount | grep "on $(df file.txt | tail -1 | awk '{print $NF}') type"

# 2. 如果使用 ext4 但缺少 acl 选项
sudo mount -o remount,acl /mountpoint

# 3. 持久化：编辑 /etc/fstab，在挂载选项中添加 acl
# 例如：defaults,acl   0   1
```

**注意：** Ubuntu 24.04 的 ext4 默认挂载选项就包含 ACL 支持。如果你遇到此错误，通常是因为挂载了外部存储或使用了不支持 ACL 的文件系统（如某些 NAS 或 FAT32）。

### 5.5 "chattr: Operation not supported while reading flags"——文件系统不支持扩展属性

**现象：**

```bash
chattr +i file.txt
```

```
chattr: Operation not supported while reading flags on file.txt
```

**原因：** 文件所在的分区或文件系统类型不支持扩展属性。常见于：
- NFS（网络文件系统）挂载的目录
- FAT32/exFAT 分区
- tmpfs（`/tmp` 有时使用 tmpfs，不支持所有扩展属性）
- 某些虚拟文件系统（如 `/proc`、`/sys`）

**解决：**

```bash
# 将文件移动到支持扩展属性的文件系统上
df -T file.txt                          # 查看文件系统类型
# 如果是 ext4/xfs/btrfs，应该支持 chattr
# 如果是 tmpfs/vfat/nfs，考虑复制到 ext4 分区
```

### 5.6 "Permission denied" 但 `ls -l` 显示有权限——你忽略了目录权限

**现象：**

```bash
ls -l /var/log/syslog
# -rw-r----- 1 root adm 12345 Jul 29 10:00 /var/log/syslog
# 你的用户在 adm 组中，应该有 r 权限
cat /var/log/syslog
# cat: /var/log/syslog: Permission denied  ← 为什么？
```

**原因：** 你忽略了**目录**的权限。要访问 `/var/log/syslog`，你需要拥有路径上**每一级目录**的执行权限（`x`）：

```
/        ← 需要 x
/var     ← 需要 x
/var/log ← 需要 x（如果这个目录的 Others 没有 x，你就进不去）
```

**排查：**

```bash
ls -ld / /var /var/log
# 检查每一级的权限。如果有任何一级缺少 x 权限，访问就会失败
```

### 5.7 使用 `chmod -R` 后系统异常——目录被批量去掉了执行权限

**现象：** 你执行了 `chmod -R 644 /some/dir`，之后无法 `cd` 进入该目录及其子目录。

**原因：** `644` = `rw-r--r--`——**目录的执行权限被去掉了**。目录没有 `x` 权限就无法进入。

**解决：**

```bash
# 恢复目录的执行权限
find /some/dir -type d -exec chmod 755 {} \;
# 或者
chmod -R a+X /some/dir        # X = 仅目录添加执行权限
```

**教训：** 永远不要对混合了文件和目录的路径使用统一的八进制 `chmod -R`。使用 `find` 分别处理，或使用符号模式 `X`。

### 5.8 ACL 条目设置后不生效——掩码限制了权限

**现象：**

```bash
setfacl -m u:lisi:rwx file.txt
# 验证：lisi 尝试写入 file.txt——失败！
```

但你确认 `getfacl` 中确实有 `u:lisi:rwx`。

**原因：** 检查 ACL 掩码（`mask::`）。如果掩码是 `r--`，那么 lisi 的 `rwx` 实际生效只有 `r--`。

```bash
getfacl file.txt
# 查找 mask:: 行
# 如果看到类似：mask::r--
# 且 u:lisi:rwx 旁边显示 #effective:r--
# 这说明掩码限制了有效权限
```

**解决：**

```bash
setfacl -m m::rwx file.txt
# 或者重新计算掩码为最宽松值
```

---

## 6. 进阶延伸

### 6.1 Linux 权限深度解析：数字 UID/GID 才是内核的"语言"

第 7 章介绍了 UID 和 GID 的概念，本章终于能切实看见它们在工作中的"幕后角色"。

当你执行 `ls -l` 时，看到的 `zhangsan`、`root` 这些名字**并不是**文件 inode 中真正存储的内容。inode 中只存储了数字（UID 和 GID），`ls` 只是通过查询 `/etc/passwd` 和 `/etc/group` 将它们转换成了人类可读的名称。

```bash
# 验证：使用 -n 查看数字格式
ls -l /etc/hostname
ls -ln /etc/hostname
# -rw-r--r-- 1 0 0 7 Jul 29 10:00 /etc/hostname
#              ↑ ↑
#            UID GID
```

这解释了为什么以下场景会出现"奇怪"的权限行为：

**场景：** 你从另一个系统或备份中挂载了一个硬盘。这个硬盘上有属于 UID 1001 的文件。你的当前系统上没有 UID 1001 的用户。

```bash
# 模拟这种场景
sudo touch /tmp/orphan_file
sudo chown 9999:9999 /tmp/orphan_file     # 9999 是一个不存在的 UID

ls -l /tmp/orphan_file
# -rw-r--r-- 1 9999 9999 0 Jul 29 10:00 /tmp/orphan_file
#             ↑    ↑
# 显示数字而非名字——因为 /etc/passwd 中没有 UID 9999

ls -ln /tmp/orphan_file
# -rw-r--r-- 1 9999 9999 0 Jul 29 10:00 /tmp/orphan_file
# 两者显示相同——因为没有名字可翻译

sudo rm /tmp/orphan_file
```

**关键认知：** 权限检查发生在内核层，使用的是**数字 UID/GID**，而非用户名。即使所有用户名都从 `/etc/passwd` 中删除，权限系统仍然正常工作——因为内核只认数字。

### 6.2 理解文件系统的 ACL 支持

并非所有文件系统都支持 ACL，也并非所有挂载的文件系统都启用了 ACL：

| 文件系统 | ACL 支持 | 默认是否启用 | 备注 |
|----------|----------|-------------|------|
| **ext4** | 是 | Ubuntu 24.04 默认启用 | 主流 Linux 文件系统 |
| **xfs** | 是 | 默认启用 | Red Hat 系列默认 |
| **btrfs** | 是 | 默认启用 | 新一代文件系统 |
| **ZFS** | 是 | 默认启用 (via NFSv4 ACL) | 使用 NFSv4 ACL 模型，与 POSIX ACL 不兼容 |
| **tmpfs** | 是 | 默认启用 | 内存文件系统 |
| **NTFS** (ntfs-3g) | 有限 | 需要特殊挂载选项 | 不推荐在 NTFS 上使用 ACL |
| **FAT32/exFAT** | 否 | -- | 完全不支持权限概念 |

```bash
# 检查当前分区的文件系统类型
df -T ~
# Filesystem     Type  ... Mounted on
# /dev/sda2      ext4  ... /

# 查看挂载选项是否包含 acl
mount | grep -E "^/dev.*on / type"
# /dev/sda2 on / type ext4 (rw,relatime,errors=remount-ro)
# ext4 在 Ubuntu 24.04 中默认启用 ACL，即使 mount 输出未显式显示 acl
```

### 6.3 权限的安全设计原则

#### 6.3.1 最小权限原则在文件权限中的实践

| 原则 | 反例 | 正例 |
|------|------|------|
| Web 目录不应让 Web 用户可以写入全部文件 | `chmod -R 777 /var/www` | 只对需要上传的特定目录（如 `uploads/`）设置写权限 |
| 配置文件的组权限应只赋予需要读取的服务组 | `chmod 644 /etc/app/db.conf` | `chmod 640` + `chown :appgroup /etc/app/db.conf` |
| 私钥文件必须只有所有者可读 | `chmod 644 ~/.ssh/id_rsa` | `chmod 600 ~/.ssh/id_rsa` |

#### 6.3.2 `chmod 777` 为什么是"万能但万恶"

`chmod 777` 是 Linux 管理员中最经典的"快速修复法"——"权限有问题？`chmod 777` 搞定！"但它带来了三个致命问题：

1. **数据泄露：** 任何人都能读取文件内容。如果你的配置文件包含数据库密码，`chmod 777` 相当于把密码贴在公告板上。

2. **数据篡改：** 任何人都能修改文件内容。Web 目录 `777` 意味着任何能在服务器上创建文件的攻击者都可以修改你的网页。

3. **恶意代码植入：** 任何人都能在目录中新建文件。`/tmp` 中的 777 目录如果有 SUID 文件被放置，攻击者就可以执行任意代码。

**替代方案：** 使用 `chown` + 组权限（`770`/`750`/`640`）或 ACL 来精确控制访问。

### 6.4 使用 umask 加强系统安全

生产环境的安全加固通常从调整 umask 开始：

```bash
# 安全基线：umask 0027
# 文件：640（Owner 读写，Group 读，Others 无权限）
# 目录：750（Owner rwx，Group r-x，Others 无权限）

# 高安全环境：umask 0077
# 文件：600（仅 Owner 可读写）
# 目录：700（仅 Owner 可访问）

# 在 /etc/profile 或 /etc/login.defs 中设置全局 umask
echo "umask 0027" | sudo tee -a /etc/profile.d/security-umask.sh
```

**注意：** 修改全局 umask 可能会影响一些假设宽松权限的应用程序（如某些打印服务、共享目录）。在修改前请充分测试。

### 6.5 文件权限与能力的未来：Linux Capabilities

`chmod +s`（SUID）赋予了进程**全部** root 权限——即使该程序只需要一种特定权限（如绑定 1024 以下的端口）。这是典型的"过度授权"。

Linux Capabilities（能力）机制将 root 的超级权限拆分成多个**独立的能力单元**：

```bash
# 查看某个程序需要哪些 capabilities
getcap /usr/bin/ping
# /usr/bin/ping cap_net_raw=ep
# ping 只需要 cap_net_raw（创建原始套接字），不需要完整的 root 权限

# 查看系统中的所有 capabilities
capsh --print
```

| 传统 SUID 方式 | Capabilities 方式 |
|----------------|-------------------|
| `chmod u+s /usr/bin/ping` | `sudo setcap cap_net_raw+ep /usr/bin/ping` |
| ping 进程拥有完整的 root 权限 | ping 进程仅拥有 cap_net_raw 能力 |
| 如果 ping 有漏洞，攻击者获得 root | 如果 ping 有漏洞，攻击者仅获得 cap_net_raw |

```bash
# 查看所有设置了 capabilities 的文件
sudo getcap -r / 2>/dev/null
```

**Capabilities 的优势：** 遵循最小权限原则——程序只获得它真正需要的那个能力，而非全部的 root 权限。现代 Linux 发行版越来越多地用 capabilities 替代传统的 SUID。

### 6.6 POSIX ACL 与 NFSv4 ACL

本章讲解的是 **POSIX ACL**（IEEE 1003.1e 草案定义），这是 Linux（ext4/xfs/btrfs）使用的标准。但在跨平台环境中，你会遇到另一种 ACL 模型：**NFSv4 ACL**。

| 特性 | POSIX ACL | NFSv4 ACL |
|------|-----------|-----------|
| **使用者** | Linux (ext4/xfs/btrfs)、macOS（旧版） | NFSv4、ZFS、Windows（SMB） |
| **权限粒度** | r、w、x 三种 | 更细：读数据、写数据、追加、删除、删除子项、读属性、写属性、读 ACL、写 ACL、读所有权等 13+ 种 |
| **条目类型** | 命名用户、命名组、掩码 | ALLOW/DENY 类型，支持继承标志 |
| **拒绝规则** | 无显式拒绝（只能通过不授予来隐式拒绝） | 支持显式 DENY 条目 |
| **工具** | `getfacl`、`setfacl` | `nfs4_getfacl`、`nfs4_setfacl` |

在你管理纯 Linux 环境时，POSIX ACL 足够使用。如果涉及 NFS 共享存储或与 Windows 系统交互，你需要了解 NFSv4 ACL 的模型。

---

## 本章小结

恭喜你完成了第八章——文件权限与 ACL！这一章是 Linux 安全体系的核心，它将你在第 7 章学到的"用户和组"概念真正用到了"保护文件"上。

回顾本章，你现在应该能够：

- 理解 `rwx` 三位权限在文件和目录上的**不同含义**——文件上 r/w/x 控制读/写/执行内容，目录上 r/w/x 控制列出/增删/进入
- 使用 `ls -l` 读懂完整的权限信息——文件类型、ugo 三位权限、硬链接数、所有者和所属组
- 使用**符号模式**（`u+x`、`g-w`、`o=r`）做增量权限修改，使用**八进制模式**（`755`、`644`）做精确权限设置
- 理解二进制到八进制的转换——`rwx` = `111` = `7`，`rw-` = `110` = `6`，`r--` = `100` = `4`
- 识别和设置三种特殊权限——**SUID**（`4xxx`，以所有者身份执行）、**SGID**（`2xxx`，以组身份执行或目录继承组）、**Sticky Bit**（`1xxx`，保护共享目录）
- 使用 `chown` 和 `chgrp` 修改文件的所有者和所属组
- 理解 `umask` 的工作原理——它通过位掩码计算来设定新建文件/目录的默认权限
- 使用 `getfacl` 和 `setfacl` 实现传统的 ugo 模型无法做到的**细粒度权限控制**
- 理解 ACL 掩码（mask）的作用——它限制了命名 ACL 条目的有效权限上限
- 使用**默认 ACL**（`setfacl -m d:`）让目录树中的新文件和子目录自动继承权限
- 使用 `chattr +i` 和 `chattr +a` 设置**文件系统级别的保护**——连 root 也无法绕过
- 使用 `lsattr` 查看文件的隐藏属性
- 建立**权限安全意识**——避免 `chmod 777`、小心 `chmod -R`、理解 `Permission denied` 的根因不一定是目标文件的权限问题

**记住三条最重要的安全原则：**

1. **最小权限原则：** 永远只赋予完成任务所需的最小权限。能用 `750` 就不要用 `755`，能用 `640` 就不要用 `644`。
2. **不用 `chmod 777` 解决问题：** 权限不对时，停下来思考"谁需要什么访问"，用 `chown` + `chmod` + ACL 精确设置。`777` 是直接把门拆了，而不是配一把钥匙。
3. **权限检查要考虑整个路径：** 访问文件需要路径上**每一级目录**都有执行权限（`x`）。只看目标文件的权限是不够的。

**在下一章中，我们将学习进程管理**——你将掌握 `ps`、`top`、`htop`、`kill`、`nice`、`renice`、`nohup`、`bg`、`fg`、`jobs` 等命令。如果说文件权限控制的是"谁能访问什么"，那么进程管理控制的是"谁在做什么、占用多少资源、是否可以停下来"。这两章一起构成了 Linux 系统管理员日常工作的两大核心支柱。

---

> **提示：** 如果你只记住本章的一个命令组合，请记住这个安全检查三连：`ls -la`（查看权限） → `getfacl`（查看 ACL） → `lsattr`（查看隐藏属性）。这三个层次构成了文件的完整安全画像。任何一个层面被忽略，都可能是安全隐患的入口。
