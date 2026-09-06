# 第 29 章 systemd 服务管理

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

### 1.1 从"安装软件"到"管理服务"

第 28 章你学会了用 `apt`、`dpkg`、`snap` 安装和管理软件。安装完成后，下一个问题自然出现：

- "装好了 nginx，它现在在运行吗？怎么启动、停止、重启它？"
- "想让数据库服务每次开机自动启动——在哪里配置？"
- "服务器突然变得很慢，怎么查看是哪个服务占用了最多资源？"
- "系统启动花了 45 秒——这段时间到底在干什么？怎么加速？"
- "写了一个后台脚本，怎么让它像 nginx 一样成为正规的'服务'？"
- "想每天凌晨 3 点自动备份数据库——crontab 之外还有更好的选择吗？"
- "日志文件 `/var/log/syslog` 已经 2GB 了，有没有更智能的日志管理方式？"

这些问题的答案都指向同一个东西：**systemd**——现代 Ubuntu 的初始化系统（Init System）和服务管理器（Service Manager）。

Systemd 管理的不只是"服务"——它管理的是整个系统的**启动、运行、监控、停止全部生命周期**。从内核加载完毕（kernel handover）的那一刻起，systemd 就开始接管一切，直到系统关机。

### 1.2 systemd 在课程中的位置

```
+------------------------------------------------------------------+
|                 Phase 4：系统篇 —— 从底层存储到顶层服务                |
|                                                                  |
|  第 26 章：磁盘与存储管理                                            |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  fdisk, mkfs, mount, /etc/fstab, dd, fsck                    │ |
|  │  视角：硬件的第一层抽象 —— 从磁盘到文件系统                       │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▼                                    |
|  第 27 章：LVM 与文件系统                                           |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  PV → VG → LV, 在线扩容, 快照                                  │ |
|  │  视角：企业级弹性存储                                           │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▼                                    |
|  第 28 章：软件包管理                                               |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  apt, dpkg, snap, flatpak, PPA                               │ |
|  │  视角：软件的安装、更新、卸载                                    │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▼                                    |
|  第 29 章：systemd 服务管理  ← 你在这一章                            |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  systemctl, journalctl, systemd-analyze, hostnamectl, ...    │ |
|  │  视角：系统生命周期的总管 —— 服务运行、日志收集、启动优化           │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

**systemd 的核心使命：作为 PID 1，管理整个用户空间（User Space）的启动、服务调度、资源控制、日志收集和系统状态，是 Linux 操作系统中最接近"总管家"角色的软件。**

### 1.3 历史背景：SysV Init 的终结与 systemd 的崛起

在 systemd 之前，Linux 世界使用 **SysV Init（System V Initialization）** 作为初始化系统，这是一个诞生于 1980 年代的古老设计：

```
SysV Init 时代（~1983 - 2015）：              systemd 时代（2015 - 至今）：
────────────────────────────                ──────────────────────────
PID 1: /sbin/init（简单 shell 脚本）          PID 1: /usr/lib/systemd/systemd
启动方式：串行（一个接一个）                   启动方式：并行（尽可能同时启动）
配置方式：/etc/init.d/ 下的 shell 脚本        配置方式：声明式 unit 文件（.service 等）
依赖管理：手动编号（S01, S02, ...）            依赖管理：自动解析依赖关系
运行级别：0-6（runlevel）                     目标：target（更灵活的替代方案）
守护进程管理：不内置，需借助 start-stop-daemon   守护进程管理：内置，cgroup 级别监控
Socket 激活：不支持                             Socket 激活：原生支持
日志管理：纯文本 /var/log/syslog               日志管理：二进制 journal + syslog 兼容
```

**关键转折点：**

```
2009   Fedora 15 工程师 Lennart Poettering 和 Kay Sievers
       提出 systemd 设计方案，目标是解决 SysV Init 的五大痛点：
         · 串行启动太慢
         · shell 脚本不可靠（依赖解析、错误处理弱）
         · 守护进程脱离后难以追踪
         · 没有统一的日志机制
         · 各发行版配置方式不统一
       │
2011   Fedora 15：首个默认使用 systemd 的主流发行版
       │
2013   Debian 技术委员会在激烈争论后投票通过采用 systemd
       │
2015   Ubuntu 15.04：从 Upstart（Ubuntu 自研的过渡方案）切换到 systemd
       │
2024   Ubuntu 24.04 LTS：systemd 255，所有现代 Linux 发行版的事实标准
```

> **为什么叫"systemd"？** 名称来源于 Unix 中守护进程（Daemon）的命名惯例——后台服务通常以 `d` 结尾（如 `sshd`、`httpd`）。"system" + "d" = systemd，意为"系统守护进程"。

### 1.4 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **服务生命周期管理** | `systemctl start/stop/restart/reload/enable/disable` | 控制服务的运行和开机自启 |
| **系统状态查看** | `systemctl status`, `systemctl is-active`, `systemctl is-enabled` | 查看服务运行状态和启用状态 |
| **全局状态** | `systemctl list-units`, `systemctl list-unit-files` | 列出活跃的 unit 和已安装的 unit 文件 |
| **系统控制** | `systemctl reboot/poweroff/suspend/hibernate` | 通过 systemd 执行开关机操作 |
| **日志管理** | `journalctl` | 查询和过滤 systemd 日志（journal） |
| **启动分析** | `systemd-analyze` | 分析启动耗时，绘制启动链图 |
| **系统信息管理** | `hostnamectl`, `timedatectl`, `localectl` | 管理主机名、时区、区域设置 |
| **会话管理** | `loginctl` | 管理用户登录会话和 seat（席位） |
| **Unit 编写** | `[Unit]`, `[Service]`, `[Install]` 配置段 | 编写自定义 .service 文件 |
| **Timer 定时任务** | `.timer` unit 类型 | systemd 原生定时任务（替代 cron） |
| **核心概念** | unit, target, service, socket, timer, cgroup, dependency | 理解 systemd 的架构基础 |

### 1.5 本章目标

完成本章后，你将能够：

- 理解 systemd 作为 PID 1 的架构设计：unit 类型体系、依赖关系模型、cgroup 资源控制
- 使用 `systemctl` 管理服务的启动、停止、重启、重载、开机自启、屏蔽
- 使用 `journalctl` 按时间、服务、优先级、可执行文件路径等多维度查询日志
- 使用 `systemd-analyze` 分析和优化系统启动性能
- 使用 `hostnamectl`、`timedatectl`、`localectl` 管理系统的基础身份信息
- 使用 `loginctl` 查看和管理用户登录会话
- 编写一个完整的 `.service` 文件，将自定义程序注册为系统服务
- 编写 `.timer` 文件实现 systemd 原生定时任务
- 识别并解决 systemd 相关的常见故障

### 1.6 前置准备

本章基于 Ubuntu 24.04 LTS，所有命令均可直接在终端中执行。请在开始前完成以下准备：

```bash
# 1. 确认 Ubuntu 版本
lsb_release -a
# 输出示例：
# Distributor ID: Ubuntu
# Description:    Ubuntu 24.04 LTS
# Release:        24.04
# Codename:       noble

# 2. 确认 systemd 版本
systemd --version
# 输出示例：
# systemd 255 (255.4-1ubuntu8)
# +PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT -GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD -BPF_FRAMEWORK -XKBCOMMON +UTMP +SYSVINIT default-hierarchy=unified

# 3. 创建练习用目录
mkdir -p ~/systemd-lesson29
cd ~/systemd-lesson29

# 4. 确认自己拥有 sudo 权限
sudo -v
```

---

## 2. 核心概念

### 2.1 systemd 的架构全景：PID 1 统领全局

systemd 是 Linux 内核启动后运行的**第一个用户空间进程**，PID 恒为 1。作为所有其他进程的祖先，它负责"拉起"整个操作系统：

```
┌─────────────────────────────────────────────────────────────────────┐
│                     systemd 架构全景图                               │
│                                                                     │
│   内核（Kernel）                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  加载完毕 → 执行 /usr/lib/systemd/systemd（PID 1）              │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│   systemd（PID 1）                                                   │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                                                              │ │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │ │
│   │  │  systemd │  │ journald │  │  logind  │  │  udevd   │     │ │
│   │  │  (核心)  │  │ (日志)   │  │ (登录)   │  │ (设备)   │     │ │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │ │
│   │       │              │              │              │          │ │
│   │       ▼              ▼              ▼              ▼          │ │
│   │  ┌──────────────────────────────────────────────────────┐    │ │
│   │  │                 Unit 管理体系                         │    │ │
│   │  │                                                      │    │ │
│   │  │  .service  .target  .socket  .timer   .mount  .swap  │    │ │
│   │  │  (服务)    (目标)   (套接字)  (定时器)  (挂载)  (交换) │    │ │
│   │  │                                                      │    │ │
│   │  │  .device  .path   .slice  .scope   .snapshot         │    │ │
│   │  │  (设备)   (路径)  (切片)   (范围)   (快照)            │    │ │
│   │  └──────────────────────────────────────────────────────┘    │ │
│   │                                                              │ │
│   │  ┌──────────────────────────────────────────────────────┐    │ │
│   │  │              cgroup 资源控制                          │    │ │
│   │  │  每个 service 自动获得独立的 cgroup                   │    │ │
│   │  │  可限制 CPU、内存、I/O、网络带宽                      │    │ │
│   │  └──────────────────────────────────────────────────────┘    │ │
│   │                                                              │ │
│   │  ┌──────────────────────────────────────────────────────┐    │ │
│   │  │              依赖关系解析                             │    │ │
│   │  │  Requires / Wants / Before / After / Conflicts       │    │ │
│   │  └──────────────────────────────────────────────────────┘    │ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**systemd 的关键设计原则：**

1. **一切都是 unit（Everything is a Unit）**：服务、挂载点、设备、定时器、socket 等都是"unit"，以统一的模型管理
2. **声明式配置（Declarative Configuration）**：不再写脚本描述"怎么做"，而是声明"期望状态是什么"
3. **按需启动（On-Demand Activation）**：通过 socket、timer、path 等触发机制，服务在真正被需要时才启动
4. **并行启动（Parallel Startup）**：自动解析依赖，尽可能同时启动不互相依赖的服务
5. **cgroup 绑定（cgroup Binding）**：每个服务运行在独立的 cgroup 中，即使 daemon 两次 fork 也无法逃逸
6. **统一日志（Unified Logging）**：所有服务的输出由 journald 统一收集，支持结构化查询

### 2.2 Unit 类型详解：systemd 管理的十种"事物"

systemd 将系统中需要管理的每种"事物"抽象为 **Unit**。Unit 的类型由其文件扩展名决定：

```
┌─────────────────────────────────────────────────────────────────────┐
│                   systemd Unit 类型全景                              │
│                                                                     │
│   类型        扩展名      职责                   类比                │
│   ────────── ──────────  ───────────────────── ─────────────────   │
│   Service    .service    定义和管理一个守护进程    "一个后台程序"     │
│   Target     .target     逻辑分组和同步点        "一个里程碑"        │
│   Socket     .socket     套接字激活              "一个端口监听器"     │
│   Timer      .timer      定时触发（替代 cron）   "一个闹钟"          │
│   Mount      .mount      文件系统挂载点           "一个 mount -t"    │
│   Automount  .automount  按需自动挂载             "按需 mount"       │
│   Device     .device     内核设备                "一个 /dev 节点"    │
│   Swap       .swap       交换文件/分区            "一个 swapon"      │
│   Path       .path       文件系统路径监视         "一个 inotify 触发器"│
│   Slice      .slice      资源控制分组             "一个 cgroup 容器" │
│   Scope      .scope      外部创建的进程组         "一个进程组"        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.2.1 Service Unit（.service）

最常用的 unit 类型，定义一个后台服务进程。这是本章的重点。

```bash
# 查看系统上的所有 service unit
systemctl list-units --type=service
# 输出示例（截取）：
# UNIT                      LOAD   ACTIVE SUB     DESCRIPTION
# accounts-daemon.service   loaded active running Accounts Service
# apache2.service           loaded active running The Apache HTTP Server
# cron.service              loaded active running Regular background program...
# NetworkManager.service    loaded active running Network Manager
# ssh.service               loaded active running OpenBSD Secure Shell server
```

每个 `.service` 文件描述：启动什么程序、以什么用户运行、依赖哪些条件、失败时如何恢复。

#### 2.2.2 Target Unit（.target）

Target 是 systemd 对 SysV Runlevel 的替代。它在功能上类似于"里程碑"——将一组服务逻辑分组，作为系统启动过程中的同步点。

```bash
# 查看所有 target unit
systemctl list-units --type=target --all
# 输出示例：
# UNIT                  LOAD   ACTIVE   SUB    DESCRIPTION
# basic.target          loaded active   active Basic System
# graphical.target      loaded active   active Graphical Interface
# multi-user.target     loaded active   active Multi-User System
# network.target        loaded active   active Network
# rescue.target         loaded inactive dead   Rescue Mode
```

**SysV Runlevel 与 systemd Target 的映射关系：**

| SysV Runlevel | systemd Target | 说明 |
|:-:|------|------|
| 0 | `runlevel0.target → poweroff.target` | 关机 |
| 1 | `runlevel1.target → rescue.target` | 单用户/救援模式 |
| 2-4 | `runlevel2-4.target → multi-user.target` | 多用户文本模式 |
| 5 | `runlevel5.target → graphical.target` | 多用户图形模式 |
| 6 | `runlevel6.target → reboot.target` | 重启 |

**常用 target 的依赖层级（自底向上）：**

```
sysinit.target          ← 系统初始化完成（挂载文件系统、设置主机名等）
    │
    ▼
basic.target            ← 基本系统就绪（sockets、timers、paths 都 ready）
    │
    ▼
multi-user.target       ← 多用户文本模式（网络已通、所有"常规"服务已启动）
    │
    ▼
graphical.target        ← 图形界面模式（显示管理器、桌面环境已启动）
```

#### 2.2.3 Socket Unit（.socket）

Socket unit 实现**基于套接字的按需激活**。当有连接请求到达时，systemd 才启动对应的 service。

```bash
# 经典的场景：sshd 通过 socket 激活
# 当有 SSH 连接请求到达端口 22 时，sshd.service 才真正启动
ls /usr/lib/systemd/system/ssh.socket
# 输出：/usr/lib/systemd/system/ssh.socket

# 查看 socket unit 列表
systemctl list-units --type=socket
# 输出示例：
# UNIT                    LOAD   ACTIVE SUB     DESCRIPTION
# cups.socket             loaded active running CUPS Scheduler
# dbus.socket             loaded active running D-Bus System Message Bus Socket
# ssh.socket              loaded active listening OpenBSD Secure Shell server socket
```

**Socket 激活的优势：**
- 减少开机启动时间（daemon 不需要预先启动）
- 节省内存（不活跃时服务不占用资源）
- 提供无中断的并行启动语义

#### 2.2.4 Timer Unit（.timer）

Timer unit 是 cron 的 systemd 原生替代品，可以按日历时间或相对时间触发 service unit。

```bash
# 查看系统中已定义的 timer
systemctl list-timers
# 输出示例：
# NEXT                        LEFT          LAST                        PASSED    UNIT
# Thu 2024-07-25 06:31:26 CST 12min left    Thu 2024-07-25 06:16:17 CST 2min ago  apt-daily.timer
# Thu 2024-07-25 07:19:27 CST 1h 0min left  Thu 2024-07-25 06:19:27 CST -         fwupd-refresh.timer
# Fri 2024-07-26 00:00:00 CST 17h left      Thu 2024-07-25 00:00:01 CST 6h ago    logrotate.timer
```

**Timer 相对 cron 的优势：**
- 与 service unit 深度集成：timer 触发后直接启动 service
- 支持 `OnBootSec`（开机后 N 秒执行）
- 支持 `RandomizedDelaySec`（随机延迟，避免惊群效应）
- 自动记录上次执行时间，可通过 `systemctl status` 查看执行历史
- 支持 `Persistent=true`：错过的时间点在下次开机时补执行

#### 2.2.5 其他 Unit 类型速览

```bash
# Mount：文件系统挂载点，对应 /etc/fstab 或 .mount 文件
systemctl list-units --type=mount | head -10

# Device：内核设备的 systemd 表示
systemctl list-units --type=device | head -10

# Swap：交换空间
systemctl list-units --type=swap

# Path：监视文件系统路径，当指定路径出现/变化时触发 service
systemctl list-units --type=path
```

### 2.3 依赖关系模型：Requires、Wants、Before、After

systemd 的依赖关系使用声明式的配置指令，而不是脚本中的顺序编号：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    systemd 依赖关系指令                              │
│                                                                     │
│   指令        含义               失败行为            典型用法        │
│   ────────── ────────────────── ────────────────── ───────────────  │
│   Requires    强依赖             如果被依赖方失败，  服务需要该条件    │
│               (Hard Dependency)  本方也失败          才能运行         │
│                                                                     │
│   Wants       弱依赖             被依赖方失败        "最好有"，但不    │
│               (Soft Dependency)  不影响本方          强制            │
│                                                                     │
│   Requisite   即时强依赖          启动时立即检查     很少用           │
│                                                                     │
│   BindsTo     绑定依赖            双向强依赖，        需要同生命周期    │
│                                  任一方退出时       的服务            │
│                                  另一方也退出                        │
│                                                                     │
│   PartOf      部分归属            如果 parent 重启/  附属服务         │
│                                  停止，本方也跟随                    │
│                                                                     │
│   Before      排序-在前          仅影响启动顺序      确保 A 在 B 前    │
│               (Ordering Only)    不影响依赖          启动            │
│                                                                     │
│   After       排序-在后          仅影响启动顺序      确保 A 在 B 后    │
│               (Ordering Only)    不影响依赖          启动            │
│                                                                     │
│   Conflicts   冲突              如果对方正在运行，   互斥服务          │
│                                  本方无法启动        (如两个 MTA)     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**关键认知：Before/After 与 Requires/Wants 是正交的（Independent Axes）**

```ini
# Before/After = 控制启动顺序（谁先谁后），不影响"是否启动"
# Requires/Wants = 控制触发关系（启动 A 是否也要启动 B），不影响顺序

[Unit]
Description=My Web Application
After=network.target         # 排序：在网络就绪之后启动
Wants=network.target         # 依赖：启动我时也启动 network.target
Requires=postgresql.service  # 依赖：强依赖数据库，它死了我也死
Before=httpd.service         # 排序：在 Apache 之前启动
```

**常见的组合模式：**

```ini
# 模式 1："网络服务"模式 —— 网络必须可用，数据库最好也在
After=network.target
Wants=network.target
After=postgresql.service
Wants=postgresql.service

# 模式 2："严格依赖"模式 —— 数据库不可用我就不启动
After=postgresql.service
Requires=postgresql.service

# 模式 3："独立服务"模式 —— 什么都不依赖，最早启动
# 不写 After/Requires 即可

# 模式 4："互斥"模式 —— 不能和另一个同类服务同时运行
Conflicts=postfix.service
```

### 2.4 cgroup 与控制组：systemd 如何"抓住"进程

传统 SysV Init 时代，守护进程启动后会通过两次 `fork()`（Double-Fork）脱离终端，变成孤儿进程，由 init 收养。这让进程管理变得极其困难——你无法确定 PID 1234 到底是不是你的服务。

systemd 通过 **cgroup（Control Group，控制组）** 彻底解决了这个问题：

```
┌─────────────────────────────────────────────────────────────────────┐
│              cgroup 如何绑定每个 service                             │
│                                                                     │
│   /sys/fs/cgroup/system.slice/                                      │
│   ├── ssh.service/          ← sshd 及其所有子进程都在这里             │
│   │   ├── cgroup.procs      ← 进程列表：1234, 1235                  │
│   │   └── ...                                                       │
│   ├── nginx.service/        ← nginx 及其 worker 进程都在这里         │
│   │   ├── cgroup.procs      ← 进程列表：5678, 5679, 5680            │
│   │   └── ...                                                       │
│   └── cron.service/         ← cron 在这里                           │
│       └── ...                                                       │
│                                                                     │
│   systemd 使用 cgroup 的好处：                                       │
│   1. 进程无法逃逸：即使 daemon 执行 double-fork，子进程仍在该 cgroup │
│   2. 批量终止：停止服务时，一次性终止 cgroup 内所有进程               │
│   3. 资源限制：可针对整个 service 限制 CPU、内存、I/O                │
│   4. 精确计费：统计整个 service 的资源消耗（CPU time、内存峰值等）     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```bash
# 查看某个服务的 cgroup 结构
systemctl status ssh | grep -i cgroup
# 输出：CGroup: /system.slice/ssh.service

# 直接查看 cgroup 文件系统
ls /sys/fs/cgroup/system.slice/ssh.service/
# 可以看到 pids、memory、cpu 等相关文件

# 查看 ssh 服务的所有进程
cat /sys/fs/cgroup/system.slice/ssh.service/cgroup.procs
# 输出示例（所有归属于 ssh 服务的 PID）：
# 1234
# 1235
```

### 2.5 Unit 文件的查找路径与优先级

systemd 从多个路径加载 unit 文件，优先级从高到低：

```
┌─────────────────────────────────────────────────────────────────────┐
│                 systemd unit 文件路径与优先级                         │
│                                                                     │
│  优先级    路径                             用途                     │
│  ──────── ───────────────────────────────── ─────────────────────── │
│  最高      /etc/systemd/system/             系统管理员自定义         │
│            /etc/systemd/system/             覆盖（Override）         │
│                                            systemd-sysv-install     │
│                                            gen 生成的 symlink       │
│                                                                     │
│  中等      /run/systemd/system/            运行时动态生成            │
│            (tmpfs，重启后清空)              （如容器管理工具）        │
│                                                                     │
│  最低      /usr/lib/systemd/system/         软件包安装的默认         │
│            (= /lib/systemd/system/          unit 文件               │
│             on Ubuntu 24.04)                                        │
│                                                                     │
│  本地      /usr/local/lib/systemd/system/  本地编译安装的            │
│                                            软件的 unit 文件          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```bash
# 查看某个 unit 的实际加载路径
systemctl show -p FragmentPath ssh.service
# 输出：FragmentPath=/usr/lib/systemd/system/ssh.service

# 查看所有被覆盖的 unit（管理员修改过的）
systemd-delta
# 输出示例：
# [EXTENDED]   /lib/systemd/system/ssh.service → /etc/systemd/system/ssh.service.d/override.conf
# [OVERRIDDEN] /lib/systemd/system/getty@.service → /etc/systemd/system/getty@.service
```

**管理员自定义 unit 的放置规则：**

| 操作 | 路径 |
|------|------|
| 创建新的 service | `/etc/systemd/system/myapp.service` |
| 修改包自带的 service | 创建 `/etc/systemd/system/原服务名.service.d/override.conf`（Drop-in 方式） |
| 完全覆盖包自带的 service | 在 `/etc/systemd/system/` 放置同名文件 |

> **Drop-in 覆盖优于直接修改：** 系统更新时不会覆盖 `/etc/systemd/system/` 下的 drop-in 目录，但直接修改 `/usr/lib/systemd/system/` 下的文件会在软件包升级时丢失。

---

## 3. 命令详解

### 3.1 systemctl：systemd 的"总控开关"

`systemctl` 是 systemd 体系中最重要、使用频率最高的命令。它覆盖了 unit 的启动/停止、启用/禁用、状态查看、系统控制等功能。

#### 3.1.1 systemctl 命令全景表

**Unit 生命周期管理命令：**

| 命令 | 说明 | 需要 sudo |
|------|------|:--------:|
| `systemctl start NAME` | 启动 unit | 是 |
| `systemctl stop NAME` | 停止 unit | 是 |
| `systemctl restart NAME` | 重启 unit（stop + start） | 是 |
| `systemctl reload NAME` | 重载配置（不重启进程，如果 unit 支持） | 是 |
| `systemctl reload-or-restart NAME` | 如果支持 reload 则 reload，否则 restart | 是 |
| `systemctl try-restart NAME` | 仅在已运行时重启（条件重启） | 是 |
| `systemctl kill NAME` | 向 unit 的进程发送信号 | 是 |
| `systemctl clean NAME` | 清理 unit 的配置、状态和缓存目录 | 是 |

**开机自启管理命令：**

| 命令 | 说明 | 需要 sudo |
|------|------|:--------:|
| `systemctl enable NAME` | 启用自动启动（创建 symlink） | 是 |
| `systemctl disable NAME` | 禁用自动启动（删除 symlink） | 是 |
| `systemctl reenable NAME` | 重设自动启动（disable 再 enable） | 是 |
| `systemctl preset NAME` | 按预设策略启用/禁用（恢复出厂设置） | 是 |
| `systemctl mask NAME` | 屏蔽 unit（完全禁止启动，链接到 /dev/null） | 是 |
| `systemctl unmask NAME` | 解除屏蔽 | 是 |
| `systemctl is-enabled NAME` | 检查是否已启用自动启动 | 否 |
| `systemctl enable --now NAME` | 启用自动启动 + 立即启动它 | 是 |
| `systemctl disable --now NAME` | 禁用自动启动 + 立即停止它 | 是 |

**状态查看命令：**

| 命令 | 说明 | 权限 |
|------|------|:----:|
| `systemctl status NAME` | 查看 unit 的详细状态 | 不需要 |
| `systemctl is-active NAME` | 检查 unit 是否正在运行 | 不需要 |
| `systemctl is-failed NAME` | 检查 unit 是否处于失败状态 | 不需要 |
| `systemctl show NAME` | 显示 unit 的所有属性（低级信息） | 不需要 |
| `systemctl cat NAME` | 显示 unit 文件的完整内容 | 不需要 |
| `systemctl list-dependencies NAME` | 显示 unit 的依赖树 | 不需要 |

**系统级命令：**

| 命令 | 说明 | 需要 sudo |
|------|------|:--------:|
| `systemctl reboot` | 重启系统 | 是 |
| `systemctl poweroff` | 关机 | 是 |
| `systemctl halt` | 停止系统（CPU 停机） | 是 |
| `systemctl suspend` | 挂起到内存（睡眠） | 是 |
| `systemctl hibernate` | 挂起到磁盘（休眠） | 是 |
| `systemctl hybrid-sleep` | 混合睡眠（同时 suspend + hibernate） | 是 |
| `systemctl rescue` | 进入救援模式（单用户） | 是 |
| `systemctl emergency` | 进入紧急模式（最小化环境） | 是 |
| `systemctl default` | 进入默认 target（通常是 graphical.target） | 是 |
| `systemctl isolate TARGET` | 切换到指定 target | 是 |
| `systemctl daemon-reload` | 重新加载 unit 文件（修改 unit 文件后必须执行） | 是 |
| `systemctl daemon-reexec` | 重新执行 systemd 自身 | 是 |

**列表与查询命令：**

| 命令 | 说明 |
|------|------|
| `systemctl list-units` | 列出已加载的活跃 unit（默认） |
| `systemctl list-units --all` | 列出所有已加载的 unit（含不活跃的） |
| `systemctl list-units --type=service` | 按类型过滤 |
| `systemctl list-units --state=failed` | 按状态过滤 |
| `systemctl list-unit-files` | 列出所有已安装的 unit 文件及其启用状态 |
| `systemctl list-sockets` | 列出 socket unit |
| `systemctl list-timers` | 列出 timer unit |
| `systemctl get-default` | 显示默认启动 target |
| `systemctl set-default TARGET` | 设置默认启动 target |
| `systemctl --failed` | 列出所有失败的 unit |

#### 3.1.2 systemctl 常用操作示例

```bash
# ===== 服务生命周期管理 =====

# 1. 查看服务状态
systemctl status ssh
# 输出示例：
# ● ssh.service - OpenBSD Secure Shell server
#      Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled; preset: enabled)
#      Active: active (running) since Thu 2024-07-25 06:20:15 CST; 2h 30min ago
#        Docs: man:sshd(8)
#              man:sshd_config(5)
#    Main PID: 1234 (sshd)
#       Tasks: 1 (limit: 19012)
#      Memory: 5.2M (peak: 12.3M)
#         CPU: 1.234s
#      CGroup: /system.slice/ssh.service
#              └─1234 "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups"

# status 输出解读：
# Loaded:  unit 文件已加载；"enabled" 表示开机自启
# Active:  服务当前正在运行；括号中是运行时长
# Main PID: 主进程 ID
# CGroup:  该服务所属的 cgroup 及其进程树

# 还有几个非常实用的状态检查命令：
systemctl is-active ssh
# 输出：active

systemctl is-enabled ssh
# 输出：enabled

systemctl is-failed ssh
# 输出：active（running 状态也是 active，不算 failed）

# 列出所有失败的 unit
systemctl --failed
# 输出：0 loaded units listed.（如果一切正常）

# ===== 启动/停止/重启 =====

# 启动
sudo systemctl start nginx

# 验证
systemctl is-active nginx
# 输出：active

# 重新加载配置（不中断服务，仅当服务支持 reload）
sudo systemctl reload nginx

# 重启（完全停止再启动，会短暂中断服务）
sudo systemctl restart nginx

# 条件重启（仅在已运行时重启，未运行则不启动）
sudo systemctl try-restart nginx

# 停止
sudo systemctl stop nginx
systemctl is-active nginx
# 输出：inactive

# ===== 开机自启管理 =====

# 查看当前是否开机自启
systemctl is-enabled nginx
# 输出：disabled

# 启用开机自启
sudo systemctl enable nginx
# 输出：
# Synchronizing state of nginx.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
# Executing: /usr/lib/systemd/systemd-sysv-install enable nginx
# Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /usr/lib/systemd/system/nginx.service.

# 再次检查
systemctl is-enabled nginx
# 输出：enabled

# enable 实际上做了什么？
# 1. 在 /etc/systemd/system/ 下创建符号链接
# 2. 链接目标的路径取决于 unit 文件中的 [Install] 段

# 启用并立即启动（一步完成）
sudo systemctl enable --now nginx

# 禁用并立即停止（一步完成）
sudo systemctl disable --now nginx

# ===== 屏蔽（Mask）—— 最彻底的禁用方式 =====

# 屏蔽一个服务（禁用无法阻止手动启动，mask 可以）
sudo systemctl mask nginx
# 输出：Created symlink /etc/systemd/system/nginx.service → /dev/null.

# 被 mask 的服务完全无法启动，即使手动执行 start
sudo systemctl start nginx
# 错误：Failed to start nginx.service: Unit nginx.service is masked.

#解除屏蔽
sudo systemctl unmask nginx
# 输出：Removed '/etc/systemd/system/nginx.service'.

# ===== 查看 unit 文件内容 =====

# 查看完整的 unit 文件（包含所有 drop-in 覆盖）
systemctl cat ssh
# 输出：完整的 ssh.service 文件内容

# ===== 查看依赖关系 =====

systemctl list-dependencies ssh
# 输出：
# ssh.service
# ● ├─system.slice
# ● ├─sshd.socket
# ● ├─sysinit.target
# ● │ ...
# ● └─shutdown.target

# 反向依赖：谁依赖了 ssh
systemctl list-dependencies --reverse ssh

# ===== 查看所有失败的服务 =====

systemctl --failed
# 或
systemctl list-units --state=failed

# ===== 查看 unit 的所有属性 =====

systemctl show ssh
# 输出约 100+ 行属性，常用于脚本中提取信息

# 提取特定属性
systemctl show -p ActiveState ssh
# 输出：ActiveState=active

systemctl show -p SubState ssh
# 输出：SubState=running

systemctl show -p MainPID ssh
# 输出：MainPID=1234

systemctl show -p MemoryCurrent ssh
# 输出：MemoryCurrent=5439488（单位：字节）

# ===== 重新加载 systemd 配置 =====

# 修改了任何 unit 文件后必须执行
sudo systemctl daemon-reload

# ===== 系统控制命令 =====

# 重启系统
sudo systemctl reboot

# 关机
sudo systemctl poweroff

# 进入救援模式（单用户，最小化环境）
sudo systemctl rescue

# 查看当前默认 target
systemctl get-default
# 输出：graphical.target

# 设置为纯文本模式（服务器常用）
sudo systemctl set-default multi-user.target
# 下次开机将进入文本模式
```

### 3.2 journalctl：systemd 的统一日志系统

`journalctl` 是 systemd 的日志查看器，用于查询和管理 `journald` 收集的日志。

#### 3.2.1 journald 架构：二进制日志 vs 传统文本日志

```
┌─────────────────────────────────────────────────────────────────────┐
│                    systemd 日志架构                                  │
│                                                                     │
│   应用程序                                                            │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │  stdout/stderr    syslog(3)      sd_journal_send()           │ │
│   │       │              │                  │                     │ │
│   │       ▼              ▼                  │                     │ │
│   │  ┌──────────────────────────────────────┘                     │ │
│   │  │                                                            │ │
│   │  ▼                                                            │ │
│   │  systemd-journald.service（PID 通常在 ~300）                    │ │
│   │  ┌──────────────────────────────────────────────────────┐    │ │
│   │  │  1. 收集所有日志                                       │    │ │
│   │  │  2. 添加元数据（PID、UID、GID、unit name、时间戳...）  │    │ │
│   │  │  3. 以二进制格式存储到 /var/log/journal/               │    │ │
│   │  │  4. 可选地转发给 syslog daemon（rsyslog 等）           │    │ │
│   │  └──────────────────────────────────────────────────────┘    │ │
│   │                                        │                       │ │
│   │                                        ▼                       │ │
│   │  journalctl  ←── 你在这里查询                                 │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   与传统 syslog 的对比：                                             │
│   ┌────────────────┬──────────────────────┬────────────────────┐   │
│   │   特性          │  journal（二进制）    │  syslog（文本）     │   │
│   ├────────────────┼──────────────────────┼────────────────────┤   │
│   │   存储格式      │  二进制、带索引       │  纯文本             │   │
│   │   查询能力      │  按字段精确查询       │  grep 全文搜索      │   │
│   │   元数据        │  自动添加 UID/GID     │  无                 │   │
│   │   按服务过滤    │  -u ssh.service      │  grep sshd          │   │
│   │   Boot 隔离     │  -b 0 (当前启动)     │  需手动处理          │   │
│   │   完整性        │  可签名验证（FSS）    │  无                 │   │
│   │   空间控制      │  自动轮转和大小限制   │  logrotate 管理     │   │
│   └────────────────┴──────────────────────┴────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

```bash
# 检查 journal 是否启用了永久存储（默认 Ubuntu 24.04 不启用）
ls /var/log/journal/
# 如果目录不存在，表示 journal 日志仅保存在 /run/log/journal/（tmpfs，重启丢失）

# 启用永久存储
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald

# 确认
ls /var/log/journal/
# 输出类似：d7b4a0c6f7e84c7b9a6e2f1d3c5a8b0f（机器 ID 命名的目录）
```

#### 3.2.2 journalctl 完整参数表

**查询过滤参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-u, --unit=UNIT` | 按 unit 名称过滤 | `journalctl -u ssh.service` |
| `--user-unit=UNIT` | 按用户 unit 过滤 | `journalctl --user-unit=foo.service` |
| `-p, --priority=RANGE` | 按日志级别过滤 | `journalctl -p err` |
| `-b, --boot[=ID]` | 按启动次数过滤 | `journalctl -b 0`（当前启动） |
| `-k, --dmesg` | 仅显示内核日志 | `journalctl -k` |
| `-t, --identifier=SYSLOG_ID` | 按 syslog 标识符过滤 | `journalctl -t sshd` |
| `_PID=PID` | 按进程 ID 过滤 | `journalctl _PID=1234` |
| `_UID=UID` | 按用户 ID 过滤 | `journalctl _UID=1000` |
| `_COMM=NAME` | 按可执行文件名过滤 | `journalctl _COMM=sshd` |
| `_EXE=PATH` | 按可执行文件路径过滤 | `journalctl _EXE=/usr/sbin/sshd` |
| `_SYSTEMD_UNIT=UNIT` | 精确按 unit 过滤 | `journalctl _SYSTEMD_UNIT=ssh.service` |
| `-g, --grep=PATTERN` | 按正则表达式过滤消息内容 | `journalctl -g "Failed password"` |
| `--case-sensitive` | 与 `-g` 配合，区分大小写 | `journalctl -g "ERROR" --case-sensitive` |

**输出控制参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-n, --lines=N` | 显示最近 N 行 | `journalctl -n 50` |
| `-f, --follow` | 实时跟踪（类似 tail -f） | `journalctl -f` |
| `-r, --reverse` | 反向显示（最新的在前） | `journalctl -r` |
| `-e, --pager-end` | 跳到日志末尾 | `journalctl -e` |
| `-o, --output=FORMAT` | 输出格式 | `journalctl -o json-pretty` |
| `--no-pager` | 不使用分页器 | `journalctl --no-pager` |
| `-q, --quiet` | 抑制信息性消息 | `journalctl -q` |
| `-x, --catalog` | 显示解释性帮助文本 | `journalctl -x` |
| `--no-tail` | 显示所有行（不做 `tail`） | `journalctl --no-tail` |

**输出格式（`-o` 选项）：**

| 格式 | 说明 |
|------|------|
| `short` | 默认格式（类 syslog） |
| `short-full` | short + 完整时间戳 |
| `short-iso` | short + ISO 8601 时间戳 |
| `short-precise` | short + 微秒精度时间戳 |
| `verbose` | 显示所有字段（最详细） |
| `json` | JSON 格式（每行一条） |
| `json-pretty` | 格式化 JSON（易于阅读） |
| `json-sse` | JSON Server-Sent Events 格式 |
| `cat` | 仅显示消息正文（无元数据） |

**时间范围参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-S, --since=DATE` | 从指定时间开始 | `journalctl --since "2024-07-25 06:00:00"` |
| `-U, --until=DATE` | 到指定时间结束 | `journalctl --until "2024-07-25 12:00:00"` |
| `--since=yesterday` | 从昨天开始 | `journalctl --since yesterday` |
| `--since=today` | 从今天 00:00 开始 | `journalctl --since today` |
| `--since="1 hour ago"` | 从过去 1 小时开始 | `journalctl --since "1 hour ago"` |
| `--since="-1h"` | 同上（简写） | `journalctl --since -1h` |

**日志维护参数：**

| 参数 | 说明 |
|------|------|
| `--disk-usage` | 显示 journal 日志占用的磁盘空间 |
| `--vacuum-size=SIZE` | 按大小清理旧日志 |
| `--vacuum-time=TIME` | 按时间清理旧日志 |
| `--rotate` | 立即执行日志轮转 |
| `--flush` | 将 `/run/log/journal` 中的日志刷新到 `/var/log/journal` |
| `--sync` | 同步所有未写入的日志到磁盘 |
| `--list-boots` | 列出所有有日志记录的启动 |
| `--header` | 显示 journal 文件头信息 |
| `--verify` | 验证 journal 文件的完整性 |

#### 3.2.3 journalctl 实战示例

```bash
# ===== 基础查询 =====

# 查看所有日志（从最新的开始）
journalctl
# 按 q 退出

# 查看最近 50 条日志
journalctl -n 50

# 从日志末尾开始查看（最新的在前）
journalctl -e

# 实时跟踪日志（不停输出最新内容）
journalctl -f
# 按 Ctrl+C 退出

# ===== 按服务过滤 =====

# 查看 ssh 服务的所有日志
journalctl -u ssh.service

# 查看 nginx 最近 20 条日志
journalctl -u nginx.service -n 20

# 同时查看多个服务的日志
journalctl -u ssh.service -u nginx.service

# ===== 按时间过滤 =====

# 查看今天的日志
journalctl --since today

# 查看昨天的日志
journalctl --since yesterday --until today

# 查看最近 1 小时的日志
journalctl --since "1 hour ago"

# 查看指定时间段
journalctl --since "2024-07-25 06:00:00" --until "2024-07-25 12:00:00"

# 查看当前启动的日志（自开机以来）
journalctl -b

# 查看上一次启动的日志
journalctl -b -1

# 列出所有有记录的启动
journalctl --list-boots
# 输出示例：
#  -3  d7b4a0c6... Tue 2024-07-23 09:15:22 CST—Tue 2024-07-23 18:30:05 CST
#  -2  d7b4a0c6... Wed 2024-07-24 08:00:01 CST—Wed 2024-07-24 22:10:33 CST
#  -1  d7b4a0c6... Wed 2024-07-24 22:15:00 CST—Thu 2024-07-25 06:10:00 CST
#   0  d7b4a0c6... Thu 2024-07-25 06:20:15 CST—

# ===== 按日志级别过滤 =====

# 日志级别（从低到高）：
#   emerg (0)   系统不可用
#   alert (1)   必须立即采取措施
#   crit  (2)   严重情况
#   err   (3)   错误
#   warning (4) 警告
#   notice (5)  正常但重要的事件
#   info  (6)   信息性消息
#   debug (7)   调试消息

# 查看错误及以上级别的日志
journalctl -p err

# 查看警告级别（仅 warning）
journalctl -p warning

# 查看从 warning 到 emerg 的所有日志
journalctl -p warning..emerg

# 查看某个服务的错误日志
journalctl -u nginx.service -p err

# ===== 高级过滤（按字段） =====

# 按 PID 过滤
journalctl _PID=1234

# 按 UID 过滤（1000 通常是第一个普通用户）
journalctl _UID=1000

# 按可执行文件过滤
journalctl _COMM=cron

# 组合过滤：查看特定服务在特定时间的错误日志
journalctl -u nginx.service -p err --since "1 hour ago"

# ===== 输出格式 =====

# 仅显示消息正文（无元数据）
journalctl -u ssh.service -o cat | head -5
# 输出示例：
# Accepted publickey for ubuntu from 192.168.1.100 port 52341 ssh2
# Received disconnect from 192.168.1.100 port 52341:11: disconnected by user

# JSON 格式输出（方便脚本处理）
journalctl -u ssh.service -n 2 -o json-pretty
# 输出示例：
# {
#         "__CURSOR" : "s=...",
#         "__REALTIME_TIMESTAMP" : "1721866900123456",
#         "__MONOTONIC_TIMESTAMP" : "1234567890",
#         "_BOOT_ID" : "d7b4a0c6f7e84c7b9a6e2f1d3c5a8b0f",
#         "PRIORITY" : "6",
#         "_UID" : "0",
#         "_GID" : "0",
#         "_SYSTEMD_UNIT" : "ssh.service",
#         "MESSAGE" : "Accepted publickey for ubuntu from 192.168.1.100",
#         ...
# }

# 详细模式（显示所有元数据字段）
journalctl -u ssh.service -n 1 -o verbose

# ===== 内核日志 =====

# 查看内核消息（等同于 dmesg）
journalctl -k

# 查看最近 10 条内核消息
journalctl -k -n 10

# ===== 按可执行文件路径过滤 =====

# 查看特定进程的所有日志
journalctl _EXE=/usr/sbin/sshd

# ===== 日志维护 =====

# 查看 journal 占用磁盘空间
journalctl --disk-usage
# 输出示例：Archived and active journals take up 128.0M in the file system.

# 按大小清理（保留最近 200MB）
sudo journalctl --vacuum-size=200M
# 输出示例：
# Deleted archived journal /var/log/journal/.../system@xxx.journal (48.0M).
# Vacuuming done, freed 48.0M of archived journals from /var/log/journal/....

# 按时间清理（保留最近 7 天）
sudo journalctl --vacuum-time=7d

# 只保留最近 2 次启动的日志
sudo journalctl --vacuum-time=2boots

# 立即轮转日志
sudo journalctl --rotate

# 将内存中的日志刷新到磁盘
sudo journalctl --flush
```

### 3.3 systemd-analyze：启动性能分析与优化

`systemd-analyze` 用于分析系统启动耗时，找出启动瓶颈。

#### 3.3.1 启动时间概览

```bash
# 查看启动总耗时
systemd-analyze
# 输出示例：
# Startup finished in 6.345s (kernel) + 15.234s (userspace) = 21.579s
# graphical.target reached after 15.200s in userspace.

# 输出解读：
# kernel:    内核加载耗时（从引导加载程序到内核初始化完成）
# userspace: 用户空间启动耗时（从 systemd 启动到目标完成）
# 最后一行： 到达 graphical.target 的精确时间
```

#### 3.3.2 各服务启动耗时排序

```bash
# 按初始化耗时排序（从最慢到最快）
systemd-analyze blame
# 输出示例：
# 8.234s apt-daily.service
# 5.123s snapd.service
# 3.456s NetworkManager-wait-online.service
# 2.345s dev-sda1.device
# 1.567s docker.service
# 1.234s containerd.service
#  892ms systemd-journald.service
#  678ms ssh.service
#  345ms systemd-logind.service
#  234ms systemd-resolved.service

# 输出解读：
# 每一行 = 一个 unit 的初始化耗时
# 时间 = 从 unit 被触发到它报告"ready"的时间
# 注意：这些时间是"实际耗时"，但服务之间可能并行执行
#      所以 blame 时间的总和 >> 实际启动时间（这是正常的）
```

#### 3.3.3 关键链分析（Critical Chain）

```bash
# 查看启动关键路径（哪个依赖链决定了启动时间）
systemd-analyze critical-chain
# 输出示例：
# The time when unit became active or started is printed after the "@" character.
# The time the unit took to start is printed after the "+" character.
#
# graphical.target @15.200s
# └─multi-user.target @15.198s
#   └─snapd.service @10.075s +5.123s
#     └─network.target @10.072s
#       └─NetworkManager.service @8.567s +1.505s
#         └─network-pre.target @8.564s
#           └─firewalld.service @6.234s +2.330s
#             └─sysinit.target @6.230s
#               └─systemd-journald.service @5.338s +892ms

# 输出解读：
# @15.200s = 该 unit 在启动后 15.200 秒激活
# +5.123s  = 该 unit 自身花了 5.123 秒初始化
# 箭头表示依赖关系："上面的"依赖"下面的"
# 关键路径（红色高亮的链）= 决定启动总时间的瓶颈链路
```

#### 3.3.4 生成启动可视化图表

```bash
# 生成 SVG 格式的启动时序图
systemd-analyze plot > ~/systemd-lesson29/boot-plot.svg
# 输出：~/systemd-lesson29/boot-plot.svg（可用浏览器打开查看）

# 如果没有安装图形环境，可以将文件传到本机查看
# SVG 图中每个 unit 显示为一条时间轴，可以看到：
# - 哪些服务在并行启动
# - 哪些服务占用了最长时间
# - 服务之间的依赖等待关系
```

#### 3.3.5 安全等级分析

```bash
# 分析 systemd 各服务的权限安全等级
systemd-analyze security ssh
# 输出示例（截取）：
#   NAME                                                      EXPOSURE
# ✗ PrivateNetwork=                                         0.5
# ✓ User=/DynamicUser=                                      0.4
# ✗ CapabilityBoundingSet=~CAP_SET(UID|GID|PCAP)            0.3
# ...
# → Overall exposure level for ssh.service: 5.2 UNSAFE 😨

# 输出解读：
# ✓ = 已配置的安全加固项
# ✗ = 未配置的安全加固项（存在暴露风险）
# 数值 = 暴露评分
# 最后一行 = 总体安全等级（SAFE > MEDIUM > UNSAFE）
```

#### 3.3.6 条件检查与验证

```bash
# 验证指定 unit 的启动条件是否满足
systemd-analyze verify /etc/systemd/system/myapp.service
# 输出：检查语法、依赖关系、文件存在性等问题

# 检查条件表达式
systemd-analyze condition 'ConditionKernelVersion>=5.15'
# 输出：test succeeded（在当前内核上条件成立）
```

### 3.4 hostnamectl：主机名管理

`hostnamectl` 是 systemd 提供的系统主机名管理工具，取代了传统的 `hostname` 命令和 `/etc/hostname` 文件的直接编辑。

```bash
# ===== 查看当前主机信息 =====
hostnamectl
# 输出示例：
#  Static hostname: ubuntu-server
#        Icon name: computer-vm
#          Chassis: vm 🖴
#       Machine ID: d7b4a0c6f7e84c7b9a6e2f1d3c5a8b0f
#          Boot ID: e8c5b1d7a8f95d8c0b7f3e2a4d6c9e1f
#   Operating System: Ubuntu 24.04 LTS
#             Kernel: Linux 6.8.0-31-generic
#       Architecture: x86-64
#    Hardware Vendor: VMware, Inc.
#     Firmware Version: 6.00

# 输出字段说明：
# Static hostname:   静态主机名（存储在 /etc/hostname，重启后持久）
# Pretty hostname:   美观主机名（可包含大小写、空格、特殊字符，给人看的）
# Transient hostname: 临时主机名（运行时通过 DHCP 或 mDNS 设置的，重启丢失）
# Machine ID:        系统唯一标识（安装时生成，用于 journal 等）
# Boot ID:           本次启动的唯一标识（每次重启生成新的）

# ===== 设置主机名 =====

# 设置静态主机名（推荐）
sudo hostnamectl set-hostname webserver-prod-01

# 验证
hostnamectl
# Static hostname: webserver-prod-01
cat /etc/hostname
# 输出：webserver-prod-01

# 设置美观主机名（可包含特殊字符和空格）
sudo hostnamectl set-hostname --pretty "Web Server (Production #01)"

# 设置临时主机名（重启后恢复为静态主机名）
sudo hostnamectl set-hostname --transient temp-debug-host

# ===== 其他信息设置 =====

# 设置机箱类型
sudo hostnamectl set-chassis server
# 可选值：desktop, laptop, server, tablet, handset, vm, container

# 设置部署环境
sudo hostnamectl set-deployment production
# 可选值：development, integration, staging, production

# 设置硬件位置描述
sudo hostnamectl set-location "Rack 3, Unit 12, DC Shanghai"
```

### 3.5 timedatectl：时间与日期管理

`timedatectl` 是 systemd 提供的系统时间和日期管理工具，取代了 `date`、`hwclock` 的部分功能和 NTP 配置的手动管理。

```bash
# ===== 查看当前时间设置 =====
timedatectl
# 输出示例：
#                Local time: Thu 2024-07-25 14:30:00 CST
#            Universal time: Thu 2024-07-25 06:30:00 UTC
#                  RTC time: Thu 2024-07-25 06:30:00
#                 Time zone: Asia/Shanghai (CST, +0800)
# System clock synchronized: yes
#               NTP service: active
#           RTC in local TZ: no

# 输出字段说明：
# Local time:          本地时间（考虑了时区）
# Universal time:      UTC 时间（世界协调时）
# RTC time:            硬件时钟（Real-Time Clock）的时间
# Time zone:           当前时区
# System clock synced: 系统时钟是否已与 NTP 同步
# NTP service:         NTP 服务是否在运行
# RTC in local TZ:     硬件时钟是否使用本地时间（Linux 建议设为 no，即使用 UTC）

# ===== 列出所有可用时区 =====
timedatectl list-timezones
# 输出（500+ 条时区记录）：
# Africa/Abidjan
# Africa/Accra
# ...
# Asia/Shanghai
# Asia/Singapore
# ...
# Europe/London
# Europe/Paris
# ...

# 按城市名过滤时区
timedatectl list-timezones | grep -i shanghai
# 输出：Asia/Shanghai

# ===== 设置时区 =====
sudo timedatectl set-timezone Asia/Tokyo

# 验证
timedatectl | grep "Time zone"
# 输出：Time zone: Asia/Tokyo (JST, +0900)

# 恢复为上海时区
sudo timedatectl set-timezone Asia/Shanghai

# ===== 设置时间与日期 =====

# 设置日期
sudo timedatectl set-time "2024-07-25"

# 设置时间（24 小时制）
sudo timedatectl set-time "14:30:00"

# 同时设置日期和时间
sudo timedatectl set-time "2024-07-25 14:30:00"

# ===== NTP 管理 =====

# 查看 NTP 同步状态
timedatectl show-timesync --all
# 输出示例：
# LinkNTPServers=ntp.ubuntu.com
# SystemNTPServers=
# FallbackNTPServers=ntp.ubuntu.com
# ServerName=ntp.ubuntu.com
# ServerAddress=91.189.91.157
# RootDistanceMaxUSec=5s
# PollIntervalMinUSec=32s
# PollIntervalMaxUSec=34min 8s
# PollIntervalUSec=34min 8s
# NTPRequestCount=42
# Frequency=13359228
# ...

# 启用 NTP 自动同步
sudo timedatectl set-ntp true

# 检查
timedatectl | grep "NTP service"
# 输出：NTP service: active

# ===== RTC 配置 =====

# 将硬件时钟设为 UTC（推荐）
sudo timedatectl set-local-rtc 0

# 将硬件时钟设为本地时间（不推荐，但与 Windows 双系统时可能需要）
sudo timedatectl set-local-rtc 1
# 警告：
# Warning: The system is configured to read the RTC time in the local time zone.
#          This mode cannot be fully supported. It will create various problems
#          with time zone changes and daylight saving time adjustments.
```

### 3.6 localectl：区域与键盘布局管理

`localectl` 管理系统的区域设置（Locale）和键盘布局。

```bash
# ===== 查看当前区域设置 =====
localectl
# 输出示例：
# System Locale: LANG=en_US.UTF-8
#                LANGUAGE=en_US:en
#     VC Keymap: (unset)
#    X11 Layout: us
#     X11 Model: pc105

# 输出字段说明：
# System Locale: 系统语言环境（影响终端、命令行工具的显示语言）
# VC Keymap:     虚拟控制台键盘布局（Ctrl+Alt+F3 进入的纯终端）
# X11 Layout:    GUI 图形界面的键盘布局

# ===== 列出所有可用的 Locale =====
localectl list-locales
# 输出（几百条）：
# C.UTF-8
# en_US.UTF-8
# zh_CN.UTF-8
# zh_TW.UTF-8
# ja_JP.UTF-8
# ...

# ===== 设置系统 Locale =====
sudo localectl set-locale LANG=zh_CN.UTF-8
# 注意：终端需要支持中文显示，否则可能出现乱码

# 恢复英文
sudo localectl set-locale LANG=en_US.UTF-8

# ===== 查看键盘布局 =====
localectl list-keymaps | head -20
# 输出：
# afghan
# albanian
# ...
# us

# 设置键盘布局
sudo localectl set-keymap us

# ===== 同时设置 X11 键盘布局 =====
sudo localectl set-x11-keymap us pc105

# 验证
localectl
# X11 Layout: us
# X11 Model: pc105
```

### 3.7 loginctl：登录会话管理

`loginctl` 管理 systemd-logind 服务，用于查看和控制用户登录会话（Session）和 seat（席位）。

```bash
# ===== 查看当前登录会话 =====
loginctl
# 输出示例：
# SESSION  UID USER    SEAT  TTY
#       2 1000 ubuntu  seat0 tty2
#      c1  120 gdm     seat0 tty1
#
# 2 sessions listed.

# ===== 查看当前用户的会话详情 =====
loginctl session-status
# 输出示例：
# 2 - ubuntu (1000)
#     Since: Thu 2024-07-25 06:20:15 CST; 3h 15min ago
#     State: active
#    Leader: 1500 (gdm-session-wor)
#      Seat: seat0; vc2
#       TTY: tty2
#    Remote: no
#   Service: gdm-password
#     Type: x11
#     Class: user
#      Idle: no
#      Unit: session-2.scope
#            ├─1500 gdm-session-worker [pam/gdm-password]
#            ├─1512 /usr/libexec/gdm-x-session --register-session --run-script...
#            └─...
# ...

# 查看特定会话
loginctl show-session 2
# 输出类似 systemctl show 的属性列表

# ===== 查看所有用户 =====
loginctl list-users
# 输出：
# UID USER
# 120 gdm
# 1000 ubuntu
#
# 2 users listed.

# 查看特定用户状态
loginctl user-status ubuntu

# ===== 查看所有 seats =====
loginctl list-seats
# 输出示例：
# SEAT
# seat0
#
# 1 seats listed.

# ===== 会话管理操作 =====
# 终止一个会话（相当于强制退出用户）
loginctl terminate-session 2

# 锁定所有会话
loginctl lock-sessions

# 解锁所有会话
loginctl unlock-sessions

# 终止所有会话（踢出所有用户）
loginctl terminate-user ubuntu
```

---

## 4. 实战练习

### 练习 29.1：systemctl 服务生命周期管理

**题目：**

以 `cron` 服务为例，完成完整的服务生命周期操作：
（1）查看 cron 的完整状态。
（2）检查它是否运行中、是否开机自启。
（3）查看它的 unit 文件内容。
（4）查看它的依赖关系。
（5）（如果有 sudo 权限）停止 cron 5 秒后再启动，观察状态变化。
（6）列出当前所有 failed 状态的 unit。

**答案：**

```bash
# （1）查看完整状态
systemctl status cron
# ● cron.service - Regular background program processing daemon
#      Loaded: loaded (/usr/lib/systemd/system/cron.service; enabled; preset: enabled)
#      Active: active (running) since ...; 2h 30min ago
#        Docs: man:cron(8)
#    Main PID: 789 (cron)
#       Tasks: 1 (limit: 19012)
#      Memory: 1.2M
#         CPU: 3.456s
#      CGroup: /system.slice/cron.service
#              └─789 /usr/sbin/cron -f -P

# （2）检查运行与启动状态
systemctl is-active cron
# active

systemctl is-enabled cron
# enabled

# （3）查看 unit 文件
systemctl cat cron
# 输出：
# [Unit]
# Description=Regular background program processing daemon
# Documentation=man:cron(8)
# After=remote-fs.target nss-user-lookup.target
#
# [Service]
# EnvironmentFile=-/etc/default/cron
# ExecStart=/usr/sbin/cron -f -P $EXTRA_OPTS
# Restart=on-failure
# RuntimeDirectory=cron
#
# [Install]
# WantedBy=multi-user.target

# （4）查看依赖关系
systemctl list-dependencies cron
# cron.service
# ● ├─system.slice
# ● ├─remote-fs.target
# ● │ ├─iscsi.service
# ● │ └─remote-fs-pre.target
# ● ├─sysinit.target
# ● │ ├─...

# （5）停止并重启
sudo systemctl stop cron
systemctl is-active cron
# inactive

sleep 5

sudo systemctl start cron
systemctl is-active cron
# active

# （6）检查失败 unit
systemctl --failed
# 输出：0 loaded units listed.（如果一切正常）
```

### 练习 29.2：journalctl 日志查询

**题目：**

根据以下场景完成日志查询：
（1）查看系统自本次开机以来的所有错误及以上级别的日志。
（2）查看 cron 服务最近 20 条日志。
（3）查看最近 1 小时内所有与 SSH 相关的日志。
（4）找出所有来自 PID 1（systemd 自身）的日志，显示最近 10 条。
（5）查看上一次启动中发生的所有错误日志。
（6）统计 journal 日志占用的磁盘空间。

**答案：**

```bash
# （1）本次启动以来的错误日志
journalctl -b -p err
# 如果没有输出 = 系统很健康

# （2）cron 服务最近 20 条日志
journalctl -u cron.service -n 20
# 输出类似：
# Jul 25 12:00:01 ubuntu-server CRON[12345]: (root) CMD (test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily ))
# Jul 25 12:00:01 ubuntu-server CRON[12345]: pam_unix(cron:session): session closed for user root

# （3）最近 1 小时 SSH 相关日志
journalctl -u ssh.service --since "1 hour ago"

# 或者用 grep 搜索整个 journal
journalctl --since "1 hour ago" -g "ssh"

# （4）来自 PID 1 的最近 10 条日志
journalctl _PID=1 -n 10
# 可以看到 systemd 自身的操作日志：
# 如启动/停止 unit、reload 配置等

# （5）上一次启动的错误日志
journalctl -b -1 -p err
# -b -1 表示上次启动（-b -2 是上上次）

# （6）磁盘空间使用
journalctl --disk-usage
# 输出示例：Archived and active journals take up 128.0M in the file system.
```

### 练习 29.3：systemd-analyze 启动分析

**题目：**

（1）查看系统启动的总耗时。
（2）找出初始化耗时最长的 5 个 service。
（3）分析启动关键路径，找出瓶颈所在。
（4）生成启动可视化图表（SVG）。
（5）评估 ssh.service 的安全加固等级。

**答案：**

```bash
# （1）启动总耗时
systemd-analyze
# Startup finished in 4.234s (kernel) + 18.567s (userspace) = 22.801s

# （2）最慢的 5 个服务
systemd-analyze blame | head -5
# 输出示例：
# 8.234s apt-daily.service
# 5.123s snapd.service
# 3.456s NetworkManager-wait-online.service
# 2.345s dev-sda1.device
# 1.567s fwupd.service

# （3）关键路径分析
systemd-analyze critical-chain
# 输出显示了时间线的瓶颈链路

# （4）生成 SVG 图表
systemd-analyze plot > ~/systemd-lesson29/boot-plot.svg
echo "SVG 保存在：~/systemd-lesson29/boot-plot.svg"
ls -lh ~/systemd-lesson29/boot-plot.svg

# （5）安全评估
systemd-analyze security ssh
# 查看安全等级和建议的加固措施
```

### 练习 29.4：系统身份信息管理

**题目：**

（1）查看当前系统的完整主机名信息。
（2）将主机名改为 `lab-server-29`，并验证。
（3）查看当前时区设置并列出所有亚洲时区。
（4）查看 NTP 同步状态。
（5）查看系统的区域设置。

**答案：**

```bash
# （1）完整主机信息
hostnamectl
# 记录当前的 Static hostname（下面要改回来）

# （2）修改主机名
# 记住原来的主机名
OLD_HOSTNAME=$(hostnamectl --static)
echo "当前主机名：$OLD_HOSTNAME"

sudo hostnamectl set-hostname lab-server-29

# 验证
hostnamectl | grep "Static hostname"
# Static hostname: lab-server-29

# 改回去（练习后恢复）
sudo hostnamectl set-hostname "$OLD_HOSTNAME"

# （3）时区设置
timedatectl | grep "Time zone"
# Time zone: Asia/Shanghai (CST, +0800)

# 列出所有亚洲时区
timedatectl list-timezones | grep Asia/ | head -20

# （4）NTP 同步状态
timedatectl show-timesync --all | grep -E "Server|NTPRequest"

# （5）区域设置
localectl
# System Locale: LANG=en_US.UTF-8
#     VC Keymap: (unset)
#    X11 Layout: us
```

### 练习 29.5：编写一个完整的 systemd Service 文件

**题目：**

编写一个自己的 service：创建一个简单的 HTTP 健康检查脚本，将它封装为 systemd 服务，实现：
（1）服务每 10 秒向指定 URL 发送一次健康检查请求。
（2）服务在 `/var/log/health-check/` 下输出日志。
（3）服务必须以非 root 用户运行。
（4）配置开机自启。
（5）配置失败自动重启（Restart=on-failure）。
（6）如果网络不可用，服务不应启动（After=network.target）。
（7）验证服务是否正常运行。

**答案：**

```bash
# ===== 第 1 步：创建健康检查脚本 =====

# 创建日志目录
sudo mkdir -p /var/log/health-check

# 创建脚本
sudo tee /usr/local/bin/health-check.sh << 'SCRIPT'
#!/bin/bash
# 健康检查脚本 —— 每隔 10 秒检查一次目标 URL 是否可达
TARGET_URL="${1:-http://localhost}"
LOG_FILE="/var/log/health-check/health-check.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    if curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "$TARGET_URL" 2>/dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "$TARGET_URL")
        echo "[$TIMESTAMP] OK - $TARGET_URL returned HTTP $HTTP_CODE" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] FAIL - $TARGET_URL is unreachable" >> "$LOG_FILE"
    fi
    sleep 10
done
SCRIPT

# 设置为可执行
sudo chmod +x /usr/local/bin/health-check.sh

# ===== 第 2 步：创建 service unit 文件 =====

sudo tee /etc/systemd/system/health-check.service << 'UNIT'
[Unit]
Description=Custom Health Check Service
Documentation=https://example.com/health-check
After=network.target
Wants=network.target

[Service]
Type=simple
User=nobody
Group=nogroup
ExecStart=/usr/local/bin/health-check.sh http://localhost
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/health-check/service-stdout.log
StandardError=append:/var/log/health-check/service-stderr.log

# 安全加固（可选）
PrivateTmp=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log/health-check

[Install]
WantedBy=multi-user.target
UNIT

# ===== 第 3 步：加载并启动服务 =====

# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable health-check.service
# 输出：Created symlink /etc/systemd/system/multi-user.target.wants/health-check.service → /etc/systemd/system/health-check.service.

# 启动服务
sudo systemctl start health-check.service

# ===== 第 4 步：验证服务状态 =====

# 查看状态
systemctl status health-check
# ● health-check.service - Custom Health Check Service
#      Loaded: loaded (/etc/systemd/system/health-check.service; enabled; preset: enabled)
#      Active: active (running) since ...; 10s ago
#    Main PID: 45678 (health-check.sh)
#       Tasks: 2 (limit: 19012)
#      Memory: 1.2M
#         CPU: 50ms
#      CGroup: /system.slice/health-check.service
#              ├─45678 /bin/bash /usr/local/bin/health-check.sh http://localhost
#              └─45700 sleep 10

# 检查日志
tail -f /var/log/health-check/health-check.log
# [2024-07-25 14:30:10] FAIL - http://localhost is unreachable
# [2024-07-25 14:30:20] FAIL - http://localhost is unreachable
# （如果本地没有 HTTP 服务在监听）

# 查看 systemd journal 中该服务的日志
journalctl -u health-check.service -n 10

# ===== 第 5 步：清理（可选，练习后将服务移除） =====

# sudo systemctl stop health-check.service
# sudo systemctl disable health-check.service
# sudo rm /etc/systemd/system/health-check.service
# sudo systemctl daemon-reload
# sudo rm -rf /var/log/health-check
# sudo rm /usr/local/bin/health-check.sh
```

**service 文件各段解释：**

```
[Unit]
Description=自定义健康检查服务           ← 服务的简短描述
After=network.target                    ← 在网络就绪之后启动
Wants=network.target                    ← 需要网络，但网络失败不影响本服务

[Service]
Type=simple                             ← 最简单的类型，认为 ExecStart 启动的进程就是主进程
User=nobody                             ← 以 nobody 用户运行（最小权限原则）
Group=nogroup                           ← 对应的组
ExecStart=/usr/local/bin/health-check.sh ← 启动命令
Restart=on-failure                      ← 仅在异常退出时重启（exit code ≠ 0）
RestartSec=10                           ← 失败后等待 10 秒再重启
StandardOutput=append:/var/log/...      ← stdout 输出追加到指定文件
StandardError=append:/var/log/...       ← stderr 输出追加到指定文件
PrivateTmp=yes                          ← 使用独立的 /tmp 目录
NoNewPrivileges=yes                     ← 禁止获得新权限
ProtectSystem=strict                    ← 系统目录设为只读
ProtectHome=yes                         ← 隐藏 /home 目录
ReadWritePaths=/var/log/health-check    ← 允许写入的路径

[Install]
WantedBy=multi-user.target              ← 在 multi-user.target 启动时自动启动本服务
```

### 练习 29.6：日志管理与真空清理

**题目：**

（1）查看 journal 日志当前占用多少磁盘空间。
（2）设置 journal 日志永久存储（如果尚未启用）。
（3）将超过 2 天的旧日志清理掉。
（4）验证清理后的大小。
（5）查看本次启动中所有 warning 及以上级别的日志。

**答案：**

```bash
# （1）当前磁盘占用
journalctl --disk-usage
# Archived and active journals take up 128.0M in the file system.

# （2）启用永久存储
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
ls /var/log/journal/
# 应该能看到以机器 ID 命名的子目录

# （3）清理 2 天前的日志
sudo journalctl --vacuum-time=2d
# 输出示例：
# Deleted archived journal /var/log/journal/.../system@xxx.journal (48.0M).
# Vacuuming done, freed 48.0M of archived journals from /var/log/journal/....

# （4）验证大小
journalctl --disk-usage
# 应该比之前小了

# （5）warning 及以上日志
journalctl -b -p warning
# 查看当前启动中的 warning/err/crit/alert/emerg 日志
```

### 练习 29.7：编写 systemd Timer 定时任务

**题目：**

使用 systemd timer 创建一个定时任务，每 5 分钟执行一次练习 29.5 中的健康检查，而不是让脚本一直运行。要求：
（1）修改 health-check 脚本，使其执行一次检查后就退出（不是无限循环）。
（2）创建一个 .timer 文件，每 5 分钟触发一次。
（3）启用并启动 timer。
（4）验证 timer 是否在正常运行。

**答案：**

```bash
# ===== 第 1 步：创建一次性执行脚本 =====

sudo tee /usr/local/bin/health-check-once.sh << 'SCRIPT'
#!/bin/bash
# 一次性健康检查脚本（配合 timer 使用）
TARGET_URL="http://localhost"
LOG_FILE="/var/log/health-check/health-check-timer.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "$TARGET_URL" > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "$TARGET_URL")
    echo "[$TIMESTAMP] OK - $TARGET_URL returned HTTP $HTTP_CODE" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] FAIL - $TARGET_URL is unreachable" >> "$LOG_FILE"
fi
SCRIPT

sudo chmod +x /usr/local/bin/health-check-once.sh

# ===== 第 2 步：创建 service unit =====

sudo tee /etc/systemd/system/health-check-timer.service << 'UNIT'
[Unit]
Description=One-shot Health Check (Timer-based)

[Service]
Type=oneshot
User=nobody
Group=nogroup
ExecStart=/usr/local/bin/health-check-once.sh
StandardOutput=journal
StandardError=journal
UNIT

# ===== 第 3 步：创建 timer unit（文件名必须与 service 同名前缀） =====

sudo tee /etc/systemd/system/health-check-timer.timer << 'TIMER'
[Unit]
Description=Run health check every 5 minutes
Requires=health-check-timer.service

[Timer]
OnCalendar=*:0/5
Persistent=true
RandomizedDelaySec=30

[Install]
WantedBy=timers.target
TIMER

# Timer 参数解释：
# OnCalendar=*:0/5       每 5 分钟执行（* 表示任何小时，0/5 表示第 0, 5, 10...分钟）
# Persistent=true         如果错过了执行时间（如系统关机），下次开机时补执行
# RandomizedDelaySec=30   随机延迟 0-30 秒，避免精确整点造成的并发高峰

# ===== 第 4 步：加载、启用、启动 =====

sudo systemctl daemon-reload
sudo systemctl enable health-check-timer.timer
sudo systemctl start health-check-timer.timer

# ===== 第 5 步：验证 =====

# 查看 timer 状态
systemctl status health-check-timer.timer
# ● health-check-timer.timer - Run health check every 5 minutes
#      Loaded: loaded (/etc/systemd/system/health-check-timer.timer; enabled; preset: enabled)
#      Active: active (waiting) since ...

# 查看所有 timer
systemctl list-timers | grep health
# NEXT                        LEFT          LAST                        PASSED   UNIT
# Thu ... 14:35:00 CST        4min 30s left Thu ... 14:30:00 CST        30s ago  health-check-timer.timer

# 查看执行结果
journalctl -u health-check-timer.service -n 5
# 输出类似：
# Jul 25 14:30:00 ubuntu-server systemd[1]: Starting One-shot Health Check (Timer-based)...
# Jul 25 14:30:00 ubuntu-server systemd[1]: health-check-timer.service: Deactivated successfully.
# Jul 25 14:30:00 ubuntu-server systemd[1]: Finished One-shot Health Check (Timer-based).

# 查看健康检查日志
cat /var/log/health-check/health-check-timer.log
```

### 练习 29.8：Service 配置高级选项——资源限制

**题目：**

修改练习 29.5 的 health-check.service，添加以下限制：
（1）限制内存使用不超过 50MB。
（2）限制 CPU 使用不超过 10%（以 CPUQuota 方式）。
（3）限制最多派生 5 个任务。
（4）验证限制是否生效。

**答案：**

```bash
# ===== 第 1 步：创建带限制的 service override =====

sudo mkdir -p /etc/systemd/system/health-check.service.d

sudo tee /etc/systemd/system/health-check.service.d/limits.conf << 'OVERRIDE'
[Service]
# 内存限制：50MB
MemoryMax=50M
MemoryHigh=40M

# CPU 限制：单核的 10%（0.1 个 CPU）
CPUQuota=10%

# 最大任务数（进程 + 线程）
TasksMax=5

# I/O 限制（可选）
# IOWeight=100
# IOReadBandwidthMax=/dev/sda 10M
# IOWriteBandwidthMax=/dev/sda 10M
OVERRIDE

# ===== 第 2 步：重新加载并重启 =====

sudo systemctl daemon-reload
sudo systemctl restart health-check.service

# ===== 第 3 步：验证限制 =====

# 查看服务的 cgroup 资源设置
systemctl show health-check | grep -E "(MemoryMax|MemoryHigh|CPUQuota|TasksMax)"
# MemoryMax=52428800
# MemoryHigh=41943040
# CPUQuotaPerSecUSec=100ms
# TasksMax=5

# 查看运行时资源状态
systemctl status health-check
# Memory: 对应显示当前内存使用和峰值

# 使用 systemd-cgtop 实时查看
systemd-cgtop
# 按 q 退出

# 查看 cgroup 文件系统中的实际限制
cat /sys/fs/cgroup/system.slice/health-check.service/memory.max
# 输出：52428800（= 50MB，单位：字节）
```

---

## 5. 常见错误与排错

### 5.1 错误：`Failed to start xxx.service: Unit xxx.service not found`

```bash
# 症状：
sudo systemctl start myapp
# 错误：
# Failed to start myapp.service: Unit myapp.service not found.

# 原因与排查：
# 1. 拼写错误：检查实际的 unit 名称
systemctl list-unit-files | grep -i myapp

# 2. 忘记写 .service 后缀（虽然 systemctl 会自动添加，但有时不会）
sudo systemctl start myapp.service     # 显式写出后缀

# 3. unit 文件没有放在正确的路径
ls /etc/systemd/system/myapp*          # 自定义 unit 应放这里
ls /usr/lib/systemd/system/myapp*      # 系统安装的 unit 放这里

# 4. 创建了 unit 文件但没有 daemon-reload
sudo systemctl daemon-reload
sudo systemctl start myapp
```

### 5.2 错误：`Failed to start xxx.service: Unit xxx.service is masked`

```bash
# 症状：
sudo systemctl start myapp
# 错误：
# Failed to start myapp.service: Unit myapp.service is masked.

# 原因：该 unit 已被 mask（链接到 /dev/null），完全禁止启动

# 排查：
ls -la /etc/systemd/system/myapp.service
# 输出示例：lrwxrwxrwx 1 root root 9 ... /etc/systemd/system/myapp.service -> /dev/null

# 解决方法：
sudo systemctl unmask myapp.service
# 再尝试启动
sudo systemctl start myapp.service
```

### 5.3 错误：`Job for xxx.service failed because the control process exited with error code`

```bash
# 症状：
sudo systemctl start myapp
# 错误：
# Job for myapp.service failed because the control process exited with error code.
# See "systemctl status myapp.service" and "journalctl -xeu myapp.service" for details.

# 排查步骤（按序执行）：
# 第 1 步：查看详细状态
systemctl status myapp.service
# 注意：code=exited, status=1/FAILURE 这样的信息

# 第 2 步：查看完整日志
journalctl -xeu myapp.service
# -x: 显示解释性文本
# -e: 跳到日志末尾
# -u: 指定 unit

# 第 3 步：手动执行启动命令，看具体报错
# 从 systemctl cat myapp 中复制 ExecStart 命令
# 模拟相同用户和环境手动执行

# 第 4 步：检查常见的启动失败原因
# - 可执行文件不存在或没有执行权限
ls -la /path/to/your/program
# - 以非 root 用户运行但访问了受保护的文件
# - 使用相对路径而不是绝对路径（ExecStart 必须用绝对路径）
# - 脚本中 #!/bin/bash 第一行缺失
```

### 5.4 错误：`Loaded: not-found (Reason: No such file or directory)`

```bash
# 症状：
systemctl status xyz
# 输出：
# ● xyz.service
#      Loaded: not-found (Reason: No such file or directory)
#      Active: inactive (dead)

# 原因：
# 1. unit 的符号链接存在但目标文件已被删除
# 2. systemd 已经知道这个 unit 但文件路径无效

# 排查：
ls -l /etc/systemd/system/xyz.service
# 如果链接指向一个不存在的文件，输出会显示为红色/损坏

# 解决方法：
# 如果该服务不需要了：
sudo systemctl disable xyz
sudo rm /etc/systemd/system/xyz.service    # 如果存在错误的符号链接

# 如果要修复：
# 重新创建 unit 文件在正确的位置
sudo systemctl daemon-reload
sudo systemctl reset-failed xyz            # 清除失败状态
```

### 5.5 错误：`Failed to enable unit: Unit file is not properly named`

```bash
# 症状：
sudo systemctl enable my-app.service
# 错误：
# Failed to enable unit: Unit file my-app.service is not properly named.

# 原因：unit 文件名必须与 [Install] 段中的 WantedBy/Alias 匹配
# 更具体地说，文件名不能包含某些特殊字符

# 解决：检查文件名
# - 使用字母、数字、连字符、下划线、点（仅用于扩展名）
# - 避免空格、斜杠、反斜杠
# - 正确格式：my-app.service、my_app_v2.service
# - 错误格式：my app.service、my/app.service
```

### 5.6 错误：Service 启动后立即退出（`Active: inactive (dead)`）

```bash
# 症状：
sudo systemctl start myservice
systemctl status myservice
# Active: inactive (dead) since ...; 2s ago

# 这是最常见的 systemd 新手问题之一

# 原因分析：
# 1. Type=simple（默认）：ExecStart 进程启动了但立即退出了
#    解决：确保你的程序在前台持续运行，而不是 daemonize（后台化）

# 2. Type=forking：程序 fork 后父进程退出了但子进程没活下来
#    解决：确保 daemon 正确 fork，或考虑切换为 Type=simple

# 3. Type=oneshot：RemainAfterExit=no（默认），ExecStart 完成后服务就结束了
#    解决：如果需要服务保持 active 状态，添加 RemainAfterExit=yes

# 排查方法：
journalctl -u myservice.service -n 20
# 查看 ExecStart 进程到底输出了什么
```

### 5.7 错误：`systemctl daemon-reload` 未执行

```bash
# 症状：
# 修改了 /etc/systemd/system/myapp.service 之后用 systemctl start
# 但 systemd 仍然使用旧的配置

# 原因：systemd 不会自动检测 unit 文件的变化

# 解决：
sudo systemctl daemon-reload    # 每次修改 unit 文件后必须执行

# 如果修改已经生效但似乎没变化：
sudo systemctl show myapp | grep ExecStart
# 确认 ExecStart 是否是新的值
```

### 5.8 错误：service 文件中的环境变量不生效

```bash
# 症状：
# 在 service 文件中设置了环境变量，但程序拿不到

# 原因排查：
# 1. Environment 指令在 [Service] 段中，不在 [Unit] 段
# 2. 使用了 shell 语法（如 $HOME）—— Environment 不支持变量展开
#    [正确] Environment="MY_VAR=hello"
#    [错误] Environment="MY_VAR=$HOME/hello"

# 3. EnvironmentFile 中的文件格式错误（不要用 export 关键字）
#    [正确] MY_VAR=hello
#    [错误] export MY_VAR=hello
#    [正确] MY_VAR="hello world"
#    [错误] MY_VAR=hello world

# 4. EnvironmentFile 前面加 "-" 可容忍文件不存在
#    EnvironmentFile=-/etc/default/myapp
#    不加 "-" 则文件不存在时服务启动失败

# 解决示例：
sudo mkdir -p /etc/systemd/system/myapp.service.d
sudo tee /etc/systemd/system/myapp.service.d/env.conf << 'EOF'
[Service]
Environment="MY_VAR=hello"
EnvironmentFile=-/etc/default/myapp
EOF
sudo systemctl daemon-reload
sudo systemctl restart myapp
```

---

## 6. 进阶延伸

### 6.1 Service Type 深入：simple vs forking vs oneshot vs notify vs dbus vs idle

Service 的 `Type=` 参数决定了 systemd 如何判断服务是否"已启动完毕"。选择错误的 Type 是最常见的 systemd 配置错误之一。

```
┌─────────────────────────────────────────────────────────────────────┐
│                 systemd Service Type 决策指南                        │
│                                                                     │
│   Type         systemd 如何判断"已就绪"         何时使用             │
│   ─────────── ─────────────────────────────── ────────────────────  │
│   simple       执行 ExecStart 后就认为       你的程序在前台运行      │
│   (默认)       已就绪（不等待）               不 fork，不 daemonize  │
│                                                                     │
│   forking      ExecStart 的父进程退出后      传统 daemon，需要 fork  │
│                认为就绪（子进程继续运行）      如 nginx、apache       │
│                需要指定 PIDFile=              要求提供 PID 文件      │
│                                                                     │
│   oneshot      ExecStart 进程完全退出后       一次性任务/初始化脚本   │
│                认为就绪                        配合 RemainAfterExit   │
│                                                                     │
│   notify      服务主动发送 sd_notify()        支持 systemd 通知协议  │
│                消息后认为就绪                  的现代服务             │
│                                                                     │
│   dbus         服务在 D-Bus 总线上注册         需要通过 D-Bus 交互    │
│                指定名称后认为就绪              的桌面服务             │
│                                                                     │
│   idle         ExecStart 执行完毕后（且        避免控制台输出的混乱    │
│                没有其他 job 在排队）            极少使用               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**详细示例：**

```bash
# ===== Type=simple（推荐用于新编写的服务） =====
# 你的程序在前台运行，不自行 daemonize

# 创建一个演示文件
sudo tee /etc/systemd/system/type-simple-demo.service << 'EOF'
[Unit]
Description=Type=simple Demo

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do echo "Running..."; sleep 5; done'
EOF

sudo systemctl daemon-reload
sudo systemctl start type-simple-demo
systemctl status type-simple-demo
# Active: active (running)，Main PID 是 bash 进程

# ===== Type=forking（传统 daemon） =====
# 程序启动后 fork 到后台，父进程退出

sudo tee /etc/systemd/system/type-forking-demo.service << 'EOF'
[Unit]
Description=Type=forking Demo

[Service]
Type=forking
# 模拟一个 fork 行为：bash 启动后立即退出，sleep 留在后台
ExecStart=/bin/bash -c 'sleep 3600 & echo $! > /tmp/demo.pid; exit 0'
PIDFile=/tmp/demo.pid
EOF

sudo systemctl daemon-reload
sudo systemctl start type-forking-demo

# ===== Type=oneshot（一次性任务） =====

sudo tee /etc/systemd/system/type-oneshot-demo.service << 'EOF'
[Unit]
Description=Type=oneshot Demo

[Service]
Type=oneshot
RemainAfterExit=yes       # 没有这个，执行完就会变成 inactive
ExecStart=/bin/bash -c 'echo "Initialization done at $(date)" | tee /tmp/oneshot-demo.log'
ExecStop=/bin/bash -c 'echo "Cleanup done at $(date)" | tee -a /tmp/oneshot-demo.log'
EOF

sudo systemctl daemon-reload
sudo systemctl start type-oneshot-demo
systemctl status type-oneshot-demo
# Active: active (exited) —— 进程已退出但 service 仍然 active

# 清理
sudo systemctl stop type-simple-demo type-forking-demo type-oneshot-demo 2>/dev/null
sudo rm /etc/systemd/system/type-*-demo.service
sudo rm -f /tmp/demo.pid /tmp/oneshot-demo.log
sudo systemctl daemon-reload
```

### 6.2 ExecStartPre / ExecStartPost / ExecStopPost：生命周期钩子

systemd 支持在 service 启动和停止的不同阶段执行额外的命令：

```
┌─────────────────────────────────────────────────────────────────────┐
│                 Service 生命周期钩子                                  │
│                                                                     │
│   服务启动流程：                                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ ExecStartPre=  →  启动前准备（创建目录、检查配置、挂载文件...）│ │
│   │       │                                                        │ │
│   │       ▼                                                        │ │
│   │ ExecStart=     →  主程序启动                                   │ │
│   │       │                                                        │ │
│   │       ▼                                                        │ │
│   │ ExecStartPost= →  启动后操作（通知监控系统、写启动标记...）     │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   服务停止流程：                                                      │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ ExecStop=      →  自定义停止命令（默认先发 SIGTERM）          │ │
│   │       │                                                        │ │
│   │       ▼                                                        │ │
│   │ ExecStopPost=  →  停止后清理（删除临时文件、释放资源...）      │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   重载流程：                                                          │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │ ExecReload=    →  重载配置（systemctl reload 时执行）         │ │
│   └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

```bash
# 完整示例：一个带生命周期钩子的 service

sudo tee /etc/systemd/system/lifecycle-demo.service << 'EOF'
[Unit]
Description=Service Lifecycle Demo

[Service]
Type=simple
User=nobody

# 启动前：确保目录存在
ExecStartPre=/bin/mkdir -p /tmp/lifecycle-demo
ExecStartPre=/bin/chown nobody:nogroup /tmp/lifecycle-demo
# 启动前检查（前面加 "-" 表示即使失败也继续）
ExecStartPre=-/bin/bash -c 'echo "Pre-start check at $$(date)" >> /tmp/lifecycle-demo/log'

# 主程序
ExecStart=/bin/bash -c 'while true; do echo "Service running"; sleep 10; done'

# 启动后：记录启动完成
ExecStartPost=/bin/bash -c 'echo "Service started at $$(date)" >> /tmp/lifecycle-demo/log'

# 重载（SIGHUP）时执行
ExecReload=/bin/bash -c 'echo "Reloaded at $$(date)" >> /tmp/lifecycle-demo/log'

# 自定义停止命令（不写则默认 SIGTERM → SIGKILL）
ExecStop=/bin/bash -c 'echo "Stopping at $$(date)" >> /tmp/lifecycle-demo/log'

# 停止后：清理通知
ExecStopPost=/bin/bash -c 'echo "Service stopped at $$(date)" >> /tmp/lifecycle-demo/log'

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start lifecycle-demo
sleep 2
sudo systemctl reload lifecycle-demo
sleep 2
sudo systemctl stop lifecycle-demo

# 查看生命周期日志
cat /tmp/lifecycle-demo/log
# 输出示例：
# Pre-start check at Thu Jul 25 15:00:00 CST 2024
# Service started at Thu Jul 25 15:00:00 CST 2024
# Reloaded at Thu Jul 25 15:00:04 CST 2024
# Stopping at Thu Jul 25 15:00:05 CST 2024
# Service stopped at Thu Jul 25 15:00:05 CST 2024

# 清理
sudo rm /etc/systemd/system/lifecycle-demo.service
sudo systemctl daemon-reload
```

### 6.3 Drop-in 覆盖：不修改原始 unit 文件的配置方法

`/usr/lib/systemd/system/` 下的文件属于软件包，`apt upgrade` 会覆盖它们。正确的修改方式是使用 **drop-in 覆盖**：

```bash
# Drop-in 目录命名规则：
# /etc/systemd/system/<unit名>.d/<任意名称>.conf

# ===== 示例：覆盖 nginx.service 的配置 =====

# 第 1 步：创建 drop-in 目录
sudo mkdir -p /etc/systemd/system/nginx.service.d

# 第 2 步：写入覆盖配置
sudo tee /etc/systemd/system/nginx.service.d/custom.conf << 'EOF'
[Service]
# 增加重启策略
Restart=on-failure
RestartSec=5

# 添加环境变量
Environment="CUSTOM_FLAG=production"

# CPU 限制
CPUQuota=50%

# 覆盖 ExecStart（如果需要）
# ExecStart=
# ExecStart=/usr/sbin/nginx -g "daemon on; master_process on;" -c /etc/nginx/custom.conf
EOF

# 第 3 步：生效
sudo systemctl daemon-reload
sudo systemctl restart nginx

# 第 4 步：验证覆盖效果
systemctl cat nginx
# 会同时显示原始文件和所有 drop-in 覆盖

# 查看覆盖是否生效
systemctl show nginx | grep RestartSec
# 输出：RestartSec=5（我们设置的）

# ===== 删除覆盖 =====
# sudo rm -rf /etc/systemd/system/nginx.service.d
# sudo systemctl daemon-reload
# sudo systemctl restart nginx
```

> **重置 ExecStart 的注意事项：** 如果要覆盖 `ExecStart=`，必须先写一行空的 `ExecStart=` 来清空原始值，再写新的值。这是因为 `ExecStart=` 支持多次指定（追加模式）。

### 6.4 Socket Activation：按需启动的高级模式

Socket 激活是 systemd 最强大的特性之一。守护进程不需要预先常驻内存，只有当客户端连接到达时才被启动。

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Socket 激活工作流程                                 │
│                                                                     │
│   1. systemd 创建 socket 并开始监听                                  │
│       ┌─────────────┐                                               │
│       │  systemd    │  ← 监听 0.0.0.0:8080                          │
│       │  socket     │                                              │
│       └──────┬──────┘                                               │
│              │                                                      │
│   2. 客户端连接到达                                                  │
│              │                                                      │
│       ┌──────▼──────┐      ┌──────────────┐                        │
│       │  客户端     │ ────→│ TCP:8080     │                        │
│       │  (浏览器)   │      │ (已监听)     │                        │
│       └─────────────┘      └──────┬───────┘                        │
│                                   │                                  │
│   3. systemd 启动对应的 service，并将 socket 传递给它                 │
│                                   │                                  │
│       ┌───────────────────────────▼──────────────────────┐          │
│       │  systemd 将 socket FD 以文件描述符方式传给 service │          │
│       └───────────────────────────┬──────────────────────┘          │
│                                   │                                  │
│   4. service 直接接管 socket 处理请求                                │
│       ┌───────────────────────────▼──────────────────────┐          │
│       │  app.service（现在才开始运行）                     │          │
│       │  - 直接使用 systemd 传入的 FD                     │          │
│       │  - 处理请求                                      │          │
│       │  - 一段时间无连接后可自行退出（利用 idle timeout）  │          │
│       └──────────────────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```bash
# ===== 完整示例：一个支持 Socket 激活的 Python HTTP 服务 =====

# 第 1 步：创建 Python 应用（支持 socket activation）
sudo tee /usr/local/bin/socket-demo.py << 'PYTHON'
#!/usr/bin/env python3
"""支持 systemd socket activation 的简单 HTTP 服务"""
import os
import sys
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Hello from socket-activated service!\n")

    def log_message(self, format, *args):
        pass  # 静默日志

# 检查是否有 systemd 传入的 socket
# systemd socket activation 会把 LISTEN_FDS 环境变量传给服务
listen_fds = int(os.environ.get('LISTEN_FDS', 0))
if listen_fds > 0:
    # 使用 systemd 传入的 socket（FD 从 3 开始）
    import socket as sock_module
    server = HTTPServer(('', 0), Handler)
    server.socket = sock_module.fromfd(3, sock_module.AF_INET, sock_module.SOCK_STREAM)
    server.server_bind = lambda: None  # 已经绑定好了
    print("Using systemd socket activation", file=sys.stderr)
else:
    # 回退模式：自行绑定端口
    server = HTTPServer(('127.0.0.1', 9090), Handler)
    print("Listening on 127.0.0.1:9090", file=sys.stderr)

server.serve_forever()
PYTHON

sudo chmod +x /usr/local/bin/socket-demo.py

# 第 2 步：创建 socket unit
sudo tee /etc/systemd/system/socket-demo.socket << 'EOF'
[Unit]
Description=Socket Demo Socket

[Socket]
ListenStream=9090
Accept=no

[Install]
WantedBy=sockets.target
EOF

# 第 3 步：创建 service unit
sudo tee /etc/systemd/system/socket-demo.service << 'EOF'
[Unit]
Description=Socket Demo Service
Requires=socket-demo.socket
After=socket-demo.socket

[Service]
Type=simple
ExecStart=/usr/local/bin/socket-demo.py
NonBlocking=true
EOF

# 第 4 步：启动 socket，服务在后台等待激活
sudo systemctl daemon-reload
sudo systemctl enable socket-demo.socket
sudo systemctl start socket-demo.socket

# 此时 service 还没有启动！
systemctl is-active socket-demo.service
# 输出：inactive

# 查看 socket 是否在监听
ss -tlnp | grep 9090
# 输出：LISTEN  0  128  0.0.0.0:9090  0.0.0.0:*  users:(("systemd",pid=1,fd=XX))

# 第 5 步：访问端口触发激活
curl http://localhost:9090
# 输出：Hello from socket-activated service!

# 再次检查——service 现在已启动
systemctl is-active socket-demo.service
# 输出：active

# 第 6 步：清理
sudo systemctl stop socket-demo.socket socket-demo.service
sudo rm /etc/systemd/system/socket-demo.{socket,service}
sudo rm /usr/local/bin/socket-demo.py
sudo systemctl daemon-reload
```

### 6.5 systemd 与容器的关系：Podman/Docker 中的 systemd

在现代容器环境中，systemd 仍然扮演着重要角色。容器内部的 PID 1 可以是一个 init 系统（如 systemd）或直接是应用进程。

```bash
# Ubuntu 24.04 中，systemd 支持在容器内以受限模式运行

# 查看 systemd 是否检测到自己在容器中运行
systemd-detect-virt
# 在物理机/虚拟机中输出：none / kvm / vmware
# 在容器中输出：container (lxc / docker / podman)

# 容器中的 systemd 行为会自动调整：
# - 不尝试加载内核模块
# - 不需要硬件时钟同步
# - 某些 target（如 swap.target）可能被跳过

# 如果想在 Docker 容器中运行 systemd（不常见但可能）：
# docker run --privileged --cgroupns=host \
#   -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
#   ubuntu:24.04 /usr/lib/systemd/systemd
```

### 6.6 `systemd-run`：将任意命令作为临时 service 运行

当你需要隔离运行一个命令，利用 systemd 的 cgroup 沙箱和资源限制，但不想写完整的 service 文件时，可以使用 `systemd-run`：

```bash
# ===== 基础用法 =====

# 将命令作为临时 service 运行（后台）
sudo systemd-run --unit=my-temp-task \
  /bin/bash -c 'sleep 60; echo "done"'

# 查看状态（它就是一个正常的 service！）
systemctl status my-temp-task

# ===== 带资源限制 =====

# 限制内存 100M，CPU 50% 运行一个计算任务
sudo systemd-run --unit=cpu-limited-task \
  -p MemoryMax=100M \
  -p CPUQuota=50% \
  -p User=nobody \
  /bin/bash -c 'echo "Running with limits..."; sleep 120'

# ===== 前台运行（阻塞等待） =====

# --wait 等待命令完成，--pty 提供交互式终端
sudo systemd-run --wait --pty \
  -p MemoryMax=100M \
  /bin/bash -c 'echo "Hello from isolated env"; whoami; pwd'

# ===== 定时运行 =====

# 创建一个一次性的定时任务（类似 at 命令）
sudo systemd-run --on-active=30s --unit=delayed-task \
  /bin/bash -c 'echo "30 seconds later" > /tmp/delayed.txt'
# 30 秒后自动执行

# 按日历时间调度（类似 cron）
sudo systemd-run --on-calendar="*-*-* 03:00:00" --unit=nightly-backup \
  /bin/bash -c 'echo "$(date): Backup running" >> /tmp/backup.log'

# 查看调度信息
systemctl status nightly-backup.timer
```

### 6.7 systemd 与 SysV Init 脚本的兼容性

systemd 保留了与 SysV Init 脚本的向后兼容。当 systemd 遇到 `/etc/init.d/` 下的 SysV 脚本时，会自动生成一个包装 service unit：

```bash
# 查看由 SysV 脚本自动生成的 unit
systemctl list-units | grep LSB

# 示例：如果存在 /etc/init.d/some-legacy-app
ls /etc/init.d/some-legacy-app
systemctl status some-legacy-app
# Loaded: loaded (/etc/init.d/some-legacy-app; generated)
# "generated" 表示这是 systemd 自动从 SysV 脚本生成的

# 生成的 unit 实际存储在
ls /run/systemd/generator.late/
# 输出可能包括：some-legacy-app.service

# 已知限制：
# - 依赖关系无法自动解析（所有 LSB unit 串行启动）
# - 没有 cgroup 隔离
# - 不支持 socket/timer 激活
# → 建议迁移到原生 .service 文件
```

### 6.8 本章关键命令速查表

```
┌─────────────────────────────────────────────────────────────────────┐
│                    本章核心命令快速索引                               │
│                                                                     │
│   目标                        命令                                  │
│   ────────────────────────   ────────────────────────────────────── │
│   查看服务状态                systemctl status NAME                 │
│   启动/停止/重启服务          systemctl start/stop/restart NAME     │
│   启用/禁用开机自启           systemctl enable/disable NAME         │
│   查看日志                    journalctl -u NAME                    │
│   实时跟踪日志                journalctl -f                         │
│   查看本次启动日志            journalctl -b                         │
│   查看错误日志                journalctl -p err                     │
│   启动耗时分析                systemd-analyze blame                 │
│   关键路径分析                systemd-analyze critical-chain        │
│   管理主机名                  hostnamectl set-hostname NAME         │
│   管理时区                    timedatectl set-timezone ZONE         │
│   管理区域设置                localectl set-locale LANG=...         │
│   查看登录会话                loginctl                              │
│   列出失败的服务              systemctl --failed                    │
│   列出 timer                  systemctl list-timers                 │
│   列出 socket                 systemctl list-sockets                │
│   重新加载 unit 文件          systemctl daemon-reload               │
│   屏蔽服务                    systemctl mask NAME                   │
│   服务安全评估                systemd-analyze security NAME         │
│   查看 unit 文件内容          systemctl cat NAME                    │
│   运行临时服务                systemd-run COMMAND                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

本章完成了 systemd 从概念到实践的完整学习路径。你从 SysV Init 的历史局限出发，理解了 systemd 的架构理由和设计哲学；通过 unit 类型体系、依赖关系模型和 cgroup 绑定机制的深入学习，建立了 systemd 的宏观认知框架；最后通过 systemctl、journalctl、systemd-analyze 等核心命令的实操练习，和编写自己的 .service 与 .timer 文件，获得了管理 Ubuntu 服务生态的完整能力。

systemd 的存在不仅改变了服务管理的方式，更重塑了 Linux 系统的整个运行时模型。掌握 systemd，就是掌握了现代 Linux 的"总控室"。
