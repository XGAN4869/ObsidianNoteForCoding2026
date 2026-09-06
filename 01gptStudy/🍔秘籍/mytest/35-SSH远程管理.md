# 第 35 章 SSH 远程管理

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

### 1.1 从"配好网络"到"远程掌控"

第 33 章你学会了用 `ip`、`ss`、`ping`、`traceroute`、`dig` 诊断网络，第 34 章你掌握了用 Netplan 配置网络、用 ufw/iptables/nftables 守护网络。现在，你的服务器已经在机房里轰鸣运转，网络一切正常——但你人在家里，或者隔着半个地球。接下来的问题自然浮现：

- "我怎样才能安全地登录到远在千里之外的服务器上？"
- "密码通过网络传输，会不会被中间人截获？"
- "每次登录都要输入密码——有没有更安全又更方便的方式？"
- "我不能直接访问内网数据库服务器，但可以通过一台跳板机（Jump Host）中转——怎么做？"
- "怎么把本地文件安全地传到服务器上？反过来呢？"
- "如果有 50 台服务器，每台都要配置不同的密钥、端口、用户名，怎么管理才不混乱？"
- "公网上有人整天扫 22 端口暴力破解我的 SSH——怎么加固防御？"

这些问题的答案只有一个：**SSH（Secure Shell，安全外壳协议）**——Linux 远程管理的基石，系统管理员最重要的日常工具，没有之一。

OpenSSH（OpenBSD Secure Shell）是 SSH 协议最广泛使用的开源实现，Ubuntu 24.04 LTS 预装了 OpenSSH 客户端（`openssh-client`）。本章将带你从原理到实践，全面掌握 SSH 远程管理。

### 1.2 本章在课程中的位置

```
+==================================================================+
|              Phase 5：网络篇 —— 从单机到互联                         |
|                                                                  |
|  第 33 章：网络基础                                                |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  TCP/IP 四层模型, ip, ss, ping, traceroute, dig, ethtool    │ |
|  │  视角：建立网络思维框架——用现代工具看清网络的全貌              │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▼                                    |
|  第 34 章：网络配置与防火墙                                        |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  netplan, nmcli, ufw, iptables, nftables, DNS 解析链路      │ |
|  │  视角：从"看清网络"到"配置网络" + "守护网络"                   │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▼                                    |
|  第 35 章：SSH 远程管理  ← 你在这一章                               |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  ssh, ssh-keygen, ssh-copy-id, ssh-agent, scp, sftp, sshd   │ |
|  │  视角：从"本地操作"到"远程管理"——SSH 是管理员的通用语言        │ |
|  └──────────────────────────────────────────────────────────────┘ |
+==================================================================+
```

**本章的核心使命：建立以 SSH 为中心的工作流。** 日常管理中，你的大部分操作都会通过 SSH 在远程服务器上执行。一个熟练的系统管理员不是"打开终端输命令"，而是"打开终端，SSH 到服务器，然后命令才真正开始"。SSH 就是你伸向远程服务器的"手"。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **远程登录** | `ssh` | 建立加密的远程 Shell 会话——SSH 的核心命令 |
| **密钥管理** | `ssh-keygen` | 生成、管理 SSH 密钥对（Key Pair） |
| **密钥部署** | `ssh-copy-id` | 将公钥安全地复制到远程服务器——免密登录的基础 |
| **密钥代理** | `ssh-agent`, `ssh-add` | 在内存中缓存私钥密码——避免重复输入 passphrase |
| **文件传输** | `scp`（Secure Copy） | 基于 SSH 的安全文件复制——`cp` 的远程版 |
| **文件传输** | `sftp`（SSH File Transfer Protocol） | 基于 SSH 的交互式文件传输——`ftp` 的安全替代 |
| **服务端** | `sshd`（SSH Daemon） | SSH 服务器守护进程——配置接受哪些连接、允许哪些用户 |
| **客户端配置** | `~/.ssh/config` | SSH 客户端配置文件——为每台服务器预设参数，告别冗长命令行 |
| **端口转发** | `-L`（本地转发）, `-R`（远程转发）, `-D`（动态转发） | SSH 隧道（SSH Tunneling）——通过 SSH 连接转发 TCP 流量 |
| **跳板连接** | `-J`（Jump Host） | 通过中间服务器跳转到目标服务器 |
| **协议原理** | 非对称加密 + 对称加密 + 主机认证 | SSH 协议的三大安全基石 |

### 1.4 本章目标

完成本章后，你将能够：

- 理解 SSH 协议的三大安全机制：非对称加密密钥交换（Asymmetric Key Exchange）、对称加密会话传输（Symmetric Encryption Session）、主机密钥认证（Host Key Authentication）
- 使用 `ssh` 命令登录远程服务器，掌握 `-p`（端口）、`-i`（密钥）、`-v`（调试）、`-J`（跳板）、`-A`（代理转发）、`-X`（X11 转发）等核心参数
- 使用 `ssh-keygen` 生成 RSA 和 Ed25519 密钥对，理解两者的区别和适用场景
- 使用 `ssh-copy-id` 部署公钥到远程服务器，实现免密登录
- 使用 `ssh-agent` 和 `ssh-add` 管理密钥，避免反复输入 passphrase
- 理解并配置 SSH 隧道三种模式：本地端口转发（Local Forward, `-L`）、远程端口转发（Remote Forward, `-R`）、动态端口转发（Dynamic Forward/SOCKS Proxy, `-D`）
- 编写 `~/.ssh/config` 配置文件，为多台服务器管理连接参数
- 使用 `scp` 和 `sftp` 在本地和远程之间安全地传输文件
- 配置 `sshd_config` 进行 SSH 服务安全加固：禁用 root 登录、禁用密码认证、修改默认端口、限制允许用户
- 使用 `ssh -v` / `ssh -vvv` 对 SSH 连接问题进行排错

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS（OpenSSH 9.6p1）。请在开始前完成以下准备：

```bash
# 1. 确认 Ubuntu 版本
lsb_release -a
# 输出示例：
# Distributor ID: Ubuntu
# Description:    Ubuntu 24.04 LTS
# Release:        24.04
# Codename:       noble

# 2. 确认 OpenSSH 客户端版本
ssh -V
# 输出示例：
# OpenSSH_9.6p1 Ubuntu-3ubuntu13, OpenSSL 3.0.13 30 Jan 2024

# 3. 确认 SSH 服务器是否已安装（本章涉及 sshd 配置）
dpkg -l | grep openssh-server
# 如果已安装，会显示 "ii  openssh-server ..."
# 如果未安装：
# sudo apt update && sudo apt install -y openssh-server

# 4. 确认 sshd 服务状态
sudo systemctl status sshd
# 或
sudo systemctl status ssh
# （Ubuntu 中服务名通常是 ssh，而非 sshd）

# 5. 创建练习目录
mkdir -p ~/ssh-lesson35
cd ~/ssh-lesson35

# 6. 创建临时练习用户（用于练习 scp 和权限问题）
# sudo useradd -m -s /bin/bash sshtest
# echo "sshtest:TestPass123" | sudo chpasswd
# 练习完成后删除：
# sudo userdel -r sshtest
```

**说明：** 本章的部分练习（如 `ssh-copy-id`、远程连接、`scp`、`sftp`）需要两台 Linux 主机。如果你只有一台机器，可以使用以下替代方案：

- **方案 A（推荐）：** 在同一台机器上使用 `ssh localhost` 练习——SSH 服务器监听本地回环地址 127.0.0.1
- **方案 B：** 使用虚拟机（VirtualBox / Multipass）创建第二台 Ubuntu 实例
- **方案 C：** 使用 Docker 容器运行第二个 SSH 服务实例

本章示例默认采用方案 A（`ssh localhost`），但所有命令同样适用于远程主机。

---

## 2. 核心概念

### 2.1 SSH 协议的三层安全模型

SSH 协议的安全建立在三个层次的机制之上。理解这三层，你就真正理解了 SSH 为什么安全。

```
┌─────────────────────────────────────────────────────────────────┐
│                   SSH 协议三层安全模型                             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  第 1 层：密钥交换（Key Exchange）                          │  │
│  │  ─────────────────────────────────────                     │  │
│  │  • 使用非对称加密（Asymmetric Encryption）                  │  │
│  │  • 算法：Diffie-Hellman (DH) 或 ECDH（椭圆曲线 DH）       │  │
│  │  • 目的：在不安全的网络上安全地协商出会话密钥（Session      │  │
│  │    Key），即使通信被窃听，攻击者也推导不出会话密钥          │  │
│  │  • 关键特性：前向安全性（Forward Secrecy）——即使私钥       │  │
│  │    事后泄露，历史会话内容也无法被解密                      │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│                               ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  第 2 层：主机认证（Host Authentication）                   │  │
│  │  ────────────────────────────────────────                  │  │
│  │  • 客户端验证"我连接的确实是我想连接的服务器"               │  │
│  │  • 服务器向客户端出示其主机密钥（Host Key）                 │  │
│  │  • 客户端检查该密钥是否在 ~/.ssh/known_hosts 中            │  │
│  │  • 首次连接时提示用户手动确认（TOFU: Trust On First Use）  │  │
│  │  • 防止中间人攻击（MITM, Man-in-the-Middle Attack）        │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│                               ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  第 3 层：对称加密通信（Symmetric Encryption Session）      │  │
│  │  ──────────────────────────────────────────────────        │  │
│  │  • 使用第 1 层协商出的会话密钥进行对称加密                  │  │
│  │  • 算法：AES-256-GCM、ChaCha20-Poly1305 等                 │  │
│  │  • 目的：高效加密所有后续通信——对称加密比非对称加密         │  │
│  │    快数百倍，适合批量数据传输                               │  │
│  │  • MAC（Message Authentication Code，消息认证码）          │  │
│  │    确保数据的完整性和真实性——数据未被篡改                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**三层的分工类比：**

```
第 1 层（密钥交换） = 两个人在嘈杂的广场上，通过公开对话商定一个只有他俩知道的暗号
                       （旁观者听到全部对话，但推导不出暗号）

第 2 层（主机认证） = 你通过对方的声音和约定的暗号，确认对面确实是你认识的那个人
                       （而非冒充者）

第 3 层（对称加密） = 确认身份后，用暗号加密全天对话——别人听到的是乱码
```

**为什么非对称加密和对称加密都要用？**

非对称加密（RSA/ECDH）安全性极高，但计算成本大，不适合加密大量数据。对称加密（AES/ChaCha20）效率极高，但需要双方事先共享密钥。SSH 的巧妙之处在于：**用非对称加密协商密钥，用对称加密保护通信**——各取所长。

### 2.2 密钥对：公钥与私钥

SSH 密钥对（Key Pair）是非对称加密的核心概念：

```
┌─────────────────────────────────────────────────────────────────┐
│                      密钥对（Key Pair）                            │
│                                                                  │
│   ┌─────────────────────┐          ┌─────────────────────┐      │
│   │     私钥              │          │     公钥              │      │
│   │   (Private Key)      │  配对    │   (Public Key)       │      │
│   │                      │ ◄─────► │                      │      │
│   │   你必须妥善保管      │          │   你可以到处分发      │      │
│   │   永远不要泄露        │          │   放在服务器上        │      │
│   │   相当于"钥匙"        │          │   相当于"锁"          │      │
│   │   放在 ~/.ssh/ 下    │          │   扩展名 .pub         │      │
│   │   权限必须 600        │          │   权限可以是 644      │      │
│   └─────────────────────┘          └─────────────────────┘      │
│                                                                  │
│   私钥加密 → 公钥解密（数字签名场景）                              │
│   公钥加密 → 私钥解密（加密通信场景）                              │
│                                                                  │
│   SSH 认证中的使用方式：                                          │
│     服务器用你的公钥加密一个挑战值（Challenge）                    │
│     → 只有持有对应私钥的你才能解密并返回正确响应                   │
│     → 过程中私钥本身从未通过网络传输                              │
└─────────────────────────────────────────────────────────────────┘
```

**密钥类型对比（重要决策）：**

| 密钥类型 | 默认长度 | 安全性 | 性能 | 兼容性 | 推荐程度 |
|---------|---------|--------|------|--------|---------|
| **Ed25519** | 256 位（固定） | 极高（~128 位安全强度） | 极快——签名和验证均高效 | OpenSSH 6.5+ (2014) 广泛支持 | **强烈推荐**（2024 年首选） |
| **RSA** | 2048/4096 位 | 高（2048 位 ~112 位安全强度） | 较慢——密钥越长越慢 | 所有版本都支持 | 可用，但正在被 Ed25519 取代 |
| **ECDSA** | 256/384/521 位 | 高，但依赖系统随机数质量 | 快 | OpenSSH 5.7+ (2011) | 可用但非首选——存在随机数风险 |
| **DSA** | 1024 位 | 低（已被破解） | — | 已被 OpenSSH 7.0 弃用 | **不要使用** |

**2024 年的最佳实践：一律使用 Ed25519。**

```bash
# 生成 Ed25519 密钥对（推荐）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 如果需要兼容老旧系统，使用 RSA 4096 位
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### 2.3 主机密钥与 known_hosts

**主机密钥（Host Key）** 是 SSH 协议防止中间人攻击的关键机制。每台 SSH 服务器在安装时都会生成自己唯一的主机密钥对。

```
首次连接时的交互过程：

$ ssh myserver.com

The authenticity of host 'myserver.com (192.168.1.100)' can't be established.
ED25519 key fingerprint is SHA256:7kmZos2N3xQvH6JpB9dLrW2kY5tXcM8nA1fV4gQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])?

你输入 "yes" 后：
→ 服务器的主机公钥被追加到 ~/.ssh/known_hosts
→ 客户端永久记住这台服务器的主机密钥
→ 下次连接时自动验证，不再询问
```

**如果主机密钥发生变化（警告！）：**

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
```

**这种情况的两种可能：**

1. **合法变更：** 服务器重装了系统或重新生成了主机密钥——你需要从 `known_hosts` 中删除旧条目
2. **中间人攻击：** 有人在冒充目标服务器——**不要连接，先验证！**

```bash
# 从 known_hosts 中删除特定主机（通过主机名）
ssh-keygen -R myserver.com
# 或通过 IP
ssh-keygen -R 192.168.1.100

# 查看已知主机列表
cat ~/.ssh/known_hosts
# 格式：主机名/IP 算法 公钥
```

**关键认知：** `known_hosts` 文件是 SSH 安全的重要防线。它确保你每次连接的服务器都是你初次信任的那台。在生产环境中，可以通过 SSHFP DNS 记录或 CA（Certificate Authority，证书颁发机构）机制来管理主机密钥，而不是手动确认。

### 2.4 SSH 代理（ssh-agent）的工作原理

输入密钥的 passphrase（密码短语）是保护私钥的好习惯——但每次 SSH 连接都输入会很繁琐。`ssh-agent` 解决了这个矛盾：

```
┌─────────────────────────────────────────────────────────────────┐
│                   ssh-agent 工作流程                               │
│                                                                  │
│   1. 启动 agent（通常在登录时自动启动）                            │
│      $ eval $(ssh-agent)                                        │
│      → agent 在后台运行，监听一个 Unix socket                     │
│                                                                  │
│   2. 添加私钥到 agent                                            │
│      $ ssh-add ~/.ssh/id_ed25519                                 │
│      → 提示输入 passphrase（仅此一次）                            │
│      → agent 在内存中持有解密后的私钥                             │
│                                                                  │
│   3. SSH 连接时                                                  │
│      $ ssh myserver.com                                          │
│      → SSH 客户端通过 SSH_AUTH_SOCK 环境变量找到 agent           │
│      → 向 agent 请求签名，agent 用内存中的私钥完成签名            │
│      → 私钥本身从未离开 agent 进程                               │
│      → 用户无需再次输入 passphrase                                │
│                                                                  │
│   4. 转发 agent（Agent Forwarding, ssh -A）                      │
│      → 从服务器 A 连到服务器 B 时，B 也可以访问你本地的 agent     │
│      → 实现"带着密钥链"跨多跳连接                                 │
│      → ⚠ 安全风险：如果服务器 A 被攻破，攻击者可滥用你的 agent   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 SSH 隧道（SSH Tunneling）概念概述

SSH 不仅是远程 Shell，还是一个强大的 TCP 隧道工具。三种端口转发模式覆盖了不同的网络穿透场景：

| 模式 | 参数 | 方向 | 通俗理解 | 典型场景 |
|------|------|------|---------|---------|
| **本地转发（Local Forward）** | `-L` | 本地端口 → 远程主机:远程端口 | "把远程端口搬到本地来" | 远程数据库在服务器上只监听 localhost——本地工具连不上→本地转发让本地工具能访问 |
| **远程转发（Remote Forward）** | `-R` | 远程端口 → 本地主机:本地端口 | "把本地端口搬到远程去" | 本地开发服务（如内网 Web 应用）想让公网同事看——远程转发把本地端口暴露到服务器上 |
| **动态转发（Dynamic Forward）** | `-D` | SOCKS5 代理 | "把 SSH 服务器变成代理服务器" | 通过服务器安全上网——所有浏览器流量经 SSH 隧道加密，绕过网络审查或保护隐私 |

详细的三种模式将在 3.9 节中展开（含 ASCII 网络拓扑图）。

---

## 3. 命令详解

### 3.1 ssh —— 远程登录

`ssh` 是 OpenSSH 的客户端命令。它建立到远程主机的加密连接，并在远程主机上启动一个 Shell（默认是用户的登录 Shell）。

**基本语法：**

```
ssh [选项...] [user@]host [command]
```

**最简单的使用：**

```bash
# 以当前本地用户名登录远程主机
ssh myserver.com

# 以指定用户名登录
ssh alice@myserver.com

# 登录并直接执行一条命令（不启动交互式 Shell）
ssh alice@myserver.com 'ls -la /var/log'

# 登录并执行多条命令
ssh alice@myserver.com 'cd /var/log && ls -la && df -h'

# 本地脚本通过 SSH 在远程执行
cat local_script.sh | ssh alice@myserver.com 'bash -s'
```

#### 3.1.1 ssh 核心参数表

| 参数 | 全称 | 说明 | 示例 |
|------|------|------|------|
| `-p <port>` | Port | 指定 SSH 服务端口（默认 22） | `ssh -p 2222 alice@server.com` |
| `-i <identity_file>` | IdentityFile | 指定私钥文件路径 | `ssh -i ~/.ssh/mykey alice@server.com` |
| `-l <login_name>` | LoginName | 指定登录用户名（等同于 `user@host` 语法） | `ssh -l alice server.com` |
| `-v` / `-vv` / `-vvv` | Verbose | 调试模式——级别越高输出越详细 | `ssh -vvv alice@server.com` |
| `-L <local_port>:<remote_host>:<remote_port>` | LocalForward | 本地端口转发 | `ssh -L 3306:localhost:3306 alice@server.com` |
| `-R <remote_port>:<local_host>:<local_port>` | RemoteForward | 远程端口转发 | `ssh -R 8080:localhost:3000 alice@server.com` |
| `-D <port>` | DynamicForward | 动态端口转发（SOCKS5 代理） | `ssh -D 1080 alice@server.com` |
| `-J <jump_host>` | JumpHost | 通过跳板机连接目标主机 | `ssh -J gw.example.com alice@internal.com` |
| `-A` | ForwardAgent | 启用 SSH Agent 转发——允许远程主机使用本地的 ssh-agent | `ssh -A alice@server.com` |
| `-X` | ForwardX11 | 启用 X11 转发——在本地显示远程 GUI 程序 | `ssh -X alice@server.com` |
| `-Y` | ForwardX11Trusted | 可信 X11 转发——比 `-X` 权限更宽松 | `ssh -Y alice@server.com` |
| `-N` | NoShell | 不执行远程命令（仅建立连接，用于端口转发） | `ssh -N -L 3306:localhost:3306 alice@server.com` |
| `-T` | NoPTY | 不分配伪终端——用于脚本或非交互式命令 | `ssh -T alice@server.com 'command'` |
| `-f` | Background | SSH 在后台运行（配合 `-N` 用于隧道） | `ssh -f -N -L 3306:localhost:3306 alice@server.com` |
| `-C` | Compression | 启用压缩——慢速网络下可提高传输速度 | `ssh -C alice@server.com` |
| `-o <option>` | Option | 传递任意配置选项（等同于 `~/.ssh/config` 中的设置） | `ssh -o StrictHostKeyChecking=no alice@server.com` |
| `-4` / `-6` | IPv4/IPv6 | 强制使用 IPv4 或 IPv6 | `ssh -4 alice@server.com` |
| `-E <log_file>` | LogFile | 将调试日志写入文件而非 stderr | `ssh -E /tmp/ssh.log -v alice@server.com` |
| `-F <configfile>` | ConfigFile | 指定 SSH 配置文件（默认 `~/.ssh/config`） | `ssh -F ~/.ssh/config-prod alice@server.com` |

#### 3.1.2 参数实战示例

```bash
# ========== 基本连接 ==========

# 1. 最基本的登录
ssh localhost
# 首次连接会提示确认主机指纹
# The authenticity of host 'localhost (::1)' can't be established.
# 输入 yes 后，指纹存入 ~/.ssh/known_hosts

# 2. 指定用户名
ssh ubuntu-learner@localhost
# 或等价写法
ssh -l ubuntu-learner localhost

# 3. 指定端口
ssh -p 2222 user@remote-server.com
# SSH 默认端口为 22，生产环境中常改为非标准端口以减少扫描

# 4. 指定私钥
ssh -i ~/.ssh/my_custom_key user@remote-server.com
# 如果私钥不在默认位置 (~/.ssh/id_rsa, ~/.ssh/id_ed25519 等)
# 需要用 -i 显式指定

# ========== 执行远程命令 ==========

# 5. 登录并执行单条命令
ssh localhost 'hostname'
# 输出：你的主机名
# 命令执行完毕，SSH 会话自动关闭

# 6. 执行多条命令
ssh localhost 'echo "当前时间: $(date)"; echo "磁盘使用:"; df -h / | tail -1'

# 7. 远程执行本地脚本
cat << 'SCRIPT' > /tmp/remote-check.sh
#!/bin/bash
echo "=== 主机名 ==="
hostname
echo "=== 运行时间 ==="
uptime
echo "=== 内存 ==="
free -h | head -2
SCRIPT
chmod +x /tmp/remote-check.sh
ssh localhost 'bash -s' < /tmp/remote-check.sh

# 8. 远程执行需要 sudo 的命令
ssh -t localhost 'sudo systemctl status ssh'
# -t 强制分配伪终端——sudo 通常需要终端才能输入密码

# ========== 调试模式 ==========

# 9. 单级调试——查看连接流程
ssh -v localhost exit
# 输出：连接建立、认证方法协商、密钥交换算法等

# 10. 双级调试——更详细的协议信息
ssh -vv localhost exit 2>&1 | head -50
# 输出包含客户端和服务端的能力协商过程

# 11. 三级调试——最详细（通常用于给开发者提交 bug）
ssh -vvv localhost exit 2>&1 | head -80
# 输出包含所有协议细节，包括密钥交换过程的字节级信息
```

**ssh -v 输出解读（关键节点）：**

```
# -v 输出的几个关键阶段：

debug1: Connecting to localhost [::1] port 22.
  → 阶段 1：建立 TCP 连接

debug1: SSH2_MSG_KEXINIT sent / received
  → 阶段 2：开始密钥交换（Key Exchange）

debug1: kex: algorithm: curve25519-sha256
  → KEX 算法：ECDH over Curve25519

debug1: SSH2_MSG_NEWKEYS sent / received
  → 阶段 3：密钥交换完成，开始对称加密

debug1: Authentications that can continue: publickey,password
  → 阶段 4：服务端宣布可接受的认证方式

debug1: Authentication succeeded (publickey).
  → 阶段 5：认证成功

debug1: channel 0: new [client-session]
  → 阶段 6：建立会话通道
```

### 3.2 ssh-keygen —— 密钥生成与管理

`ssh-keygen` 用于生成、管理和转换 SSH 认证密钥。

**基本语法：**

```
ssh-keygen [选项]
```

**常用参数表：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-t <type>` | 指定密钥类型：ed25519, rsa, ecdsa, dsa | `ssh-keygen -t ed25519` |
| `-b <bits>` | 密钥长度（RSA 常用 4096） | `ssh-keygen -t rsa -b 4096` |
| `-C <comment>` | 添加注释（通常是邮箱），方便识别密钥 | `ssh-keygen -t ed25519 -C "alice@example.com"` |
| `-f <file>` | 指定私钥文件路径 | `ssh-keygen -f ~/.ssh/my_key` |
| `-N <passphrase>` | 设置 passphrase（`""` 表示不设密码） | `ssh-keygen -t ed25519 -N "" -f testkey` |
| `-p` | 修改已有密钥的 passphrase | `ssh-keygen -p -f ~/.ssh/id_ed25519` |
| `-l` | 显示密钥指纹（Fingerprint） | `ssh-keygen -l -f ~/.ssh/id_ed25519.pub` |
| `-R <hostname>` | 从 known_hosts 中删除指定主机条目 | `ssh-keygen -R oldserver.com` |
| `-y` | 从私钥导出公钥 | `ssh-keygen -y -f ~/.ssh/id_ed25519` |
| `-a <rounds>` | 指定 KDF 轮数（增加暴力破解难度） | `ssh-keygen -t ed25519 -a 100` |
| `-F <hostname>` | 在 known_hosts 中查找主机 | `ssh-keygen -F github.com` |
| `-H` | 对 known_hosts 文件进行哈希处理 | `ssh-keygen -H -f ~/.ssh/known_hosts` |

#### 3.2.1 生成密钥对

```bash
# ========== 生成 Ed25519 密钥（推荐） ==========

# 1. 交互式生成——推荐，可以设置 passphrase
ssh-keygen -t ed25519 -C "ubuntu-learner@lesson35"
# 提示 1：Enter file in which to save the key (/home/you/.ssh/id_ed25519):
#   → 按 Enter 使用默认路径
# 提示 2：Enter passphrase (empty for no passphrase):
#   → 输入密码短语（推荐设置，即使有 ssh-agent 也要设置）
# 提示 3：Enter same passphrase again:
#   → 再次输入确认

# 2. 非交互式生成——适合脚本
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "auto-generated"
# -N "" 表示空 passphrase（不推荐在生产环境中使用）

# ========== 生成 RSA 4096 位密钥（兼容老系统） ==========

# 3. 生成 RSA 密钥
ssh-keygen -t rsa -b 4096 -C "ubuntu-learner@lesson35"
# -b 4096 指定 4096 位——不推荐使用默认的 3072 位以下长度

# ========== 查看生成的文件 ==========

# 4. 查看生成的密钥文件
ls -la ~/.ssh/id_ed25519*
# 输出示例：
# -rw-------  1 user user  411 Jul 30 10:00 id_ed25519      ← 私钥（权限 600）
# -rw-r--r--  1 user user  101 Jul 30 10:00 id_ed25519.pub  ← 公钥（权限 644）

# 5. 查看公钥内容
cat ~/.ssh/id_ed25519.pub
# 输出示例：
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... ubuntu-learner@lesson35
# |          |                                |
# |          |                                └─ 注释（-C 指定的内容）
# |          └─ Base64 编码的公钥数据
# └─ 密钥类型

# 6. 查看私钥内容（不要泄露！）
head -3 ~/.ssh/id_ed25519
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAA...
# 这是 OpenSSH 专有格式，以 Base64 编码
```

#### 3.2.2 密钥指纹与验证

```bash
# 7. 查看公钥指纹（Fingerprint）——SHA256 格式（默认）
ssh-keygen -l -f ~/.ssh/id_ed25519.pub
# 输出示例：
# 256 SHA256:7kmZos2N3xQvH6JpB9dLrAb5tXcM8nA1fV4gQw you@host (ED25519)

# 8. 查看 MD5 格式指纹（某些旧系统需要）
ssh-keygen -l -E md5 -f ~/.ssh/id_ed25519.pub
# 输出示例：
# 256 MD5:1a:2b:3c:4d:5e:6f:7a:8b:9c:0d:1e:2f:3a:4b:5c:6d you@host (ED25519)

# 9. 从私钥中提取/恢复公钥
ssh-keygen -y -f ~/.ssh/id_ed25519
# 输出公钥内容（需要输入 passphrase）
# 如果私钥在，但公钥丢失了，可以用这个命令恢复

# 10. 验证公钥和私钥是否配对
ssh-keygen -y -f ~/.ssh/id_ed25519 > /tmp/extracted.pub
diff ~/.ssh/id_ed25519.pub /tmp/extracted.pub && echo "公钥私钥匹配"
```

#### 3.2.3 管理 passphrase

```bash
# 11. 修改已有密钥的 passphrase
ssh-keygen -p -f ~/.ssh/id_ed25519
# 提示：Enter old passphrase: （输入旧密码）
# 提示：Enter new passphrase (empty for no passphrase): （输入新密码）
# 提示：Enter same passphrase again: （再次确认）

# 12. 移除 passphrase（不推荐）
ssh-keygen -p -f ~/.ssh/id_ed25519 -N ""

# 13. 添加或修改 passphrase（非交互式）
ssh-keygen -p -f ~/.ssh/id_ed25519 -N "new_strong_passphrase" -P "old_passphrase"
# -P 为旧 passphrase
```

### 3.3 ssh-copy-id —— 部署公钥到远程服务器

公钥认证（Public Key Authentication）是 SSH 最安全、最方便的认证方式。`ssh-copy-id` 自动化了公钥部署过程。

**基本语法：**

```
ssh-copy-id [选项] [user@]host
```

**参数表：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-i <identity_file>` | 指定要安装的公钥文件 | `ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server` |
| `-p <port>` | 指定 SSH 端口 | `ssh-copy-id -p 2222 user@server` |
| `-f` | 强制模式——即使密钥已存在也追加 | `ssh-copy-id -f user@server` |
| `-o <ssh_option>` | 传递 SSH 选项 | `ssh-copy-id -o StrictHostKeyChecking=no user@server` |

**实战：**

```bash
# ========== 部署公钥到目标服务器 ==========

# 1. 先确认你有公钥
ls ~/.ssh/id_ed25519.pub || echo "没有公钥——请先用 ssh-keygen 生成"

# 2. 部署公钥到远程服务器（需要输入远程用户的密码）
ssh-copy-id localhost
# 或指定用户
ssh-copy-id ubuntu-learner@localhost

# 执行过程：
# /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "..."
# /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key...
# /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed
# 输入远程用户密码后：
# Number of key(s) added: 1
# Now try logging into the machine, with: "ssh 'localhost'"
# and check to make sure that only the key(s) you wanted were added.

# 3. 验证——现在应该免密登录
ssh localhost 'echo "免密登录成功: $(hostname)"'
# 如果设置了 passphrase，ssh-agent 未运行时仍需要输入一次

# 4. 查看服务端的 authorized_keys 文件
cat ~/.ssh/authorized_keys
# 这就是 ssh-copy-id 写入的内容——一行一个公钥
# 权限必须是 600（仅所有者可读写）

# ========== 手动部署（理解 ssh-copy-id 做了什么） ==========

# 5. 手动方式——等价于 ssh-copy-id 的效果
cat ~/.ssh/id_ed25519.pub | ssh ubuntu-learner@localhost \
    'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# 这是 ssh-copy-id 的实际操作：
# ① mkdir -p ~/.ssh —— 确保 .ssh 目录存在
# ② chmod 700 ~/.ssh —— 设置正确的目录权限
# ③ cat >> ~/.ssh/authorized_keys —— 将公钥追加到 authorized_keys
# ④ chmod 600 ~/.ssh/authorized_keys —— 设置正确的文件权限
```

**权限问题：如果权限不对，公钥认证会静默失败。** 正确的权限是：

| 路径 | 权限 | 说明 |
|------|------|------|
| `~/.ssh/` | `700` (drwx------) | 只有所有者能读、写、进入 |
| `~/.ssh/authorized_keys` | `600` (-rw-------) | 只有所有者能读写 |
| `~/.ssh/id_ed25519`（私钥） | `600` (-rw-------) | 只有所有者能读写 |
| `~/.ssh/id_ed25519.pub`（公钥） | `644` (-rw-r--r--) | 所有者读写，其他人只读 |
| `~/.ssh/config` | `600` (-rw-------) | 只有所有者能读写 |
| `~/.ssh/known_hosts` | `644` (-rw-r--r--) | 所有者读写，其他人只读 |

```bash
# 修复权限的批量命令
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_* 2>/dev/null
chmod 644 ~/.ssh/id_*.pub ~/.ssh/known_hosts 2>/dev/null
```

### 3.4 ssh-agent 与 ssh-add —— 密钥代理管理

`ssh-agent` 在后台运行，缓存解密后的私钥。`ssh-add` 是管理 agent 中密钥的工具。

**基本语法：**

```
# 启动 agent
eval $(ssh-agent)

# 管理密钥
ssh-add [选项] [密钥文件...]
```

**ssh-add 参数表：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-l` | 列出 agent 中已加载的密钥指纹 | `ssh-add -l` |
| `-L` | 列出 agent 中已加载的公钥 | `ssh-add -L` |
| `-d <file>` | 从 agent 中移除指定密钥 | `ssh-add -d ~/.ssh/id_ed25519` |
| `-D` | 从 agent 中移除所有密钥 | `ssh-add -D` |
| `-t <seconds>` | 设置密钥的生命周期（超时自动移除） | `ssh-add -t 3600 ~/.ssh/id_ed25519` |
| `-x` | 锁定 agent（需要密码才能再次使用） | `ssh-add -x` |
| `-X` | 解锁 agent | `ssh-add -X` |
| `-k` | 将密钥加载到 agent 但不在内存中存储密钥（macOS Keychain 等） | （各平台不同） |

**实战：**

```bash
# ========== 启动 ssh-agent ==========

# 1. 检查 agent 是否已在运行
echo $SSH_AUTH_SOCK
# 如果有输出（如 /tmp/ssh-XXXXXX/agent.1234），说明 agent 已在运行
# 如果输出为空，需要启动

# 2. 启动 ssh-agent
eval $(ssh-agent)
# 输出：
# Agent pid 12345
# eval 的作用：执行 ssh-agent 输出的环境变量设置命令
# ssh-agent 输出类似于：
# SSH_AUTH_SOCK=/tmp/ssh-XXXXXX/agent.12345; export SSH_AUTH_SOCK;
# SSH_AGENT_PID=12346; export SSH_AGENT_PID;

# 3. 验证环境变量
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK"
echo "SSH_AGENT_PID=$SSH_AGENT_PID"

# ========== 添加密钥到 agent ==========

# 4. 添加密钥（默认添加 ~/.ssh/id_rsa, id_ed25519, id_ecdsa 等）
ssh-add
# 提示输入 passphrase（如已设置）
# Identity added: /home/user/.ssh/id_ed25519 (user@host)

# 5. 添加指定密钥
ssh-add ~/.ssh/my_custom_key
# 对于自定义路径的密钥

# 6. 列出已加载的密钥
ssh-add -l
# 输出示例：
# 256 SHA256:7kmZos2N3xQvH6JpB9dLrAb5tXcM8nA1fV4gQw ubuntu-learner@lesson35 (ED25519)

# 7. 列出已加载的公钥
ssh-add -L
# 输出公钥全文——可以复制用于部署

# ========== 管理 agent 中的密钥 ==========

# 8. 移除指定密钥
ssh-add -d ~/.ssh/id_ed25519
# 输出：Identity removed: /home/user/.ssh/id_ed25519

# 9. 添加密钥并设置 1 小时生命周期
ssh-add -t 3600 ~/.ssh/id_ed25519
# 3600 秒后自动从 agent 中移除

# 10. 清空所有密钥
ssh-add -D
# 输出：All identities removed.

# 11. 锁定 agent——暂时禁用
ssh-add -x
# 提示输入锁定密码
# 锁定后，即使别人拿到 SSH_AUTH_SOCK 也无法使用

# 12. 解锁 agent
ssh-add -X
# 提示输入解锁密码

# ========== SSH Agent 转发（-A） ==========

# 13. 场景：从 local → serverA → serverB
#     希望 serverB 能使用你本地的密钥（而非在 serverA 上存私钥）
ssh -A serverA
# 在 serverA 上：
ssh serverB
# serverB 的认证请求会被转发回你本地的 ssh-agent
# ⚠ 谨慎使用——如果 serverA 被入侵，攻击者可滥用你的 agent

# 14. 更安全的替代方案：使用 ProxyJump（-J）
ssh -J serverA serverB
# -J 不使用 agent 转发，而是通过 serverA 建立隧道
# serverB 的认证请求直接由本地 SSH 客户端处理
```

**ssh-agent 与桌面环境的集成：**

在现代 Ubuntu 24.04 桌面（GNOME）中，`gnome-keyring-daemon` 会自动接管 SSH agent 的角色，你不需要手动启动 `ssh-agent`。登录桌面时，GNOME Keyring 会提示你输入私钥的 passphrase，此后整个桌面会话期间无需再次输入。

```bash
# 检查是谁在提供 ssh-agent 服务
echo $SSH_AUTH_SOCK
# 如果路径包含 "keyring"，说明是 GNOME Keyring 在管理
# 如：/run/user/1000/keyring/ssh
```

### 3.5 scp —— 安全文件复制

`scp`（Secure Copy）是基于 SSH 协议的文件复制工具。它使用与 `ssh` 相同的认证和加密机制。

**基本语法：**

```
scp [选项...] 源路径... 目标路径
```

源和目标可以是本地路径或 `[user@]host:路径` 的远程路径。

**常用参数表：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-r` | 递归复制整个目录 | `scp -r mydir/ user@server:~/` |
| `-P <port>` | 指定 SSH 端口（注意是大写 P） | `scp -P 2222 file.txt user@server:~/` |
| `-p` | 保留文件属性（修改时间、访问时间、权限） | `scp -p file.txt user@server:~/` |
| `-i <identity_file>` | 指定私钥 | `scp -i ~/.ssh/mykey file.txt user@server:~/` |
| `-C` | 启用压缩 | `scp -C largefile.tar.gz user@server:~/` |
| `-q` | 静默模式——不显示进度信息 | `scp -q file.txt user@server:~/` |
| `-v` | 详细模式——显示调试信息 | `scp -v file.txt user@server:~/` |
| `-l <limit>` | 限制带宽（单位 Kbit/s） | `scp -l 8192 bigfile user@server:~/` |
| `-3` | 通过本地主机中转（两台远程主机之间复制） | `scp -3 userA@serverA:file userB@serverB:file` |

**实战：**

```bash
# 创建测试文件
cd ~/ssh-lesson35
echo "这是测试文件内容" > test.txt
dd if=/dev/urandom of=bigfile.bin bs=1M count=10 2>/dev/null
mkdir -p testdir/subdir
echo "子目录文件" > testdir/subdir/nested.txt
echo "根目录文件" > testdir/root.txt

# ========== 从本地复制到远程 ==========

# 1. 单个文件上传
scp test.txt localhost:~/ssh-lesson35/received.txt
# 如果 localhost 需要密码，会提示输入

# 2. 验证
cat ~/ssh-lesson35/received.txt
# 输出：这是测试文件内容

# 3. 上传到远程指定用户的目录
scp test.txt ubuntu-learner@localhost:/tmp/test-upload.txt

# 4. 递归上传整个目录
scp -r testdir localhost:~/ssh-lesson35/
# 远程会创建 ~/ssh-lesson35/testdir/ 目录并包含所有子目录和文件

# 5. 验证目录上传
ssh localhost 'ls -la ~/ssh-lesson35/testdir/'
ssh localhost 'ls -la ~/ssh-lesson35/testdir/subdir/'
ssh localhost 'cat ~/ssh-lesson35/testdir/subdir/nested.txt'

# ========== 从远程复制到本地 ==========

# 6. 下载文件
scp localhost:~/ssh-lesson35/received.txt ./downloaded.txt
cat downloaded.txt

# 7. 下载整个目录
scp -r localhost:~/ssh-lesson35/testdir ./testdir-downloaded/
ls -la testdir-downloaded/
ls -la testdir-downloaded/subdir/

# ========== 远程主机之间的复制 ==========

# 8. 在两台远程主机之间复制（通过本地中转，使用 -3）
# scp -3 userA@serverA:/path/file userB@serverB:/path/
# 注意：如果不加 -3，scp 会让 serverA 直接连到 serverB
# 加 -3 则强制通过本地中转

# ========== 带宽限制与端口指定 ==========

# 9. 限速上传——8192 Kbit/s = 1 MB/s
scp -l 8192 bigfile.bin localhost:~/ssh-lesson35/

# 10. 使用非标准端口
# scp -P 2222 file.txt user@server:~/path/

# 11. 保留文件属性
scp -p test.txt localhost:~/ssh-lesson35/test-with-attrs.txt
# 对比原始文件和复制后的文件属性
ls -la test.txt
ssh localhost 'ls -la ~/ssh-lesson35/test-with-attrs.txt'
# 修改时间和权限应该一致

# ========== 通配符与多文件 ==========

# 12. 上传多个文件
scp test.txt bigfile.bin localhost:~/ssh-lesson35/

# 13. 使用通配符
scp ~/ssh-lesson35/test*.txt localhost:/tmp/

# ========== scp vs rsync ==========

# scp 适合：一次性简单复制
# rsync 适合：增量同步、断点续传、大量文件、保留更多属性
# rsync 属于进阶工具，将在后续章节详细介绍

# 清理
rm -rf ~/ssh-lesson35/testdir-downloaded ~/ssh-lesson35/downloaded.txt
```

**scp 的注意事项：**

1. **路径中的 `:` 是分隔符。** `user@host:path` 中，`:` 之后是远程路径。本地路径不能包含 `:`，否则会被误解析。如果本地文件名确实有 `:`，使用 `./` 前缀：`scp ./file:with:colons.txt user@server:~/`
2. **`-P`（大写）是指定端口，`-p`（小写）是保留属性。** 这是 `scp` 和 `ssh` 不一致的地方——`ssh` 用 `-p` 指定端口。
3. **`scp` 已被 OpenSSH 官方标记为"过时"。** 推荐使用 `sftp` 或 `rsync` 作为替代。但 `scp` 因为简单直接，在日常使用中仍然非常普遍。

### 3.6 sftp —— SSH 文件传输协议

`sftp`（SSH File Transfer Protocol）是基于 SSH 的交互式文件传输工具。它提供了类似 FTP 的界面，但所有通信都经过 SSH 加密。

**基本语法：**

```
sftp [选项...] [user@]host
```

**常用参数表：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `-P <port>` | 指定 SSH 端口 | `sftp -P 2222 user@server` |
| `-i <identity_file>` | 指定私钥 | `sftp -i ~/.ssh/mykey user@server` |
| `-b <batchfile>` | 批处理模式——从文件读取命令 | `sftp -b commands.sftp user@server` |
| `-r` | 递归模式（用于 `get`/`put` 目录） | 在 sftp 内部使用 |

**sftp 交互命令表：**

| 命令 | 说明 | 示例 |
|------|------|------|
| `ls [path]` | 列出远程目录内容 | `ls /var/log` |
| `lls [path]` | 列出本地目录内容 | `lls ~/` |
| `cd <path>` | 切换远程目录 | `cd /etc/ssh` |
| `lcd <path>` | 切换本地目录 | `lcd ~/Downloads` |
| `pwd` | 显示远程当前目录 | `pwd` |
| `lpwd` | 显示本地当前目录 | `lpwd` |
| `get <remote> [local]` | 下载文件 | `get nginx.conf ./` |
| `get -r <dir>` | 递归下载目录 | `get -r project/ ./` |
| `put <local> [remote]` | 上传文件 | `put id_ed25519.pub ./` |
| `put -r <dir>` | 递归上传目录 | `put -r myproject/ ./` |
| `mget <pattern>` | 批量下载（通配符） | `mget *.log` |
| `mput <pattern>` | 批量上传（通配符） | `mput *.txt` |
| `rm <path>` | 删除远程文件 | `rm oldfile.log` |
| `rmdir <path>` | 删除远程目录 | `rmdir emptydir/` |
| `mkdir <path>` | 创建远程目录 | `mkdir backups` |
| `rename <old> <new>` | 重命名远程文件 | `rename old.txt new.txt` |
| `chmod <mode> <path>` | 修改远程文件权限 | `chmod 600 private.key` |
| `df [-h]` | 显示远程磁盘使用情况 | `df -h` |
| `!<command>` | 执行本地 Shell 命令 | `!ls -la` |
| `help` / `?` | 显示帮助 | `help put` |
| `bye` / `exit` / `quit` | 退出 sftp | `bye` |

**实战：**

```bash
# 创建练习文件
cd ~/ssh-lesson35
mkdir -p sftp-test
echo "File A content" > sftp-test/fileA.txt
echo "File B content" > sftp-test/fileB.txt
echo "Large data: $(head -c 1000 /dev/urandom | base64)" > sftp-test/big.txt

# ========== 交互式 sftp ==========

# 1. 连接
sftp localhost
# 进入 sftp> 交互提示符
# Connected to localhost.

# 在 sftp 提示符下执行：
# sftp> ls
# sftp> pwd
# sftp> lpwd
# sftp> cd /tmp
# sftp> put ~/ssh-lesson35/sftp-test/fileA.txt
# sftp> get fileA.txt ~/ssh-lesson35/downloaded_A.txt
# sftp> bye

# ========== 单条命令模式 ==========

# 2. 直接使用 sftp 命令获取文件（无需进入交互模式）
sftp localhost:/etc/hostname ~/ssh-lesson35/
# 下载 /etc/hostname 到本地 ~/ssh-lesson35/

# ========== 批处理模式 ==========

# 3. 创建批处理命令文件
cat > /tmp/sftp-batch.cmds << 'EOF'
# 这是一组 sftp 批处理命令
cd /tmp
lcd ~/ssh-lesson35/sftp-test
put fileA.txt
put fileB.txt
mkdir uploaded_from_batch
cd uploaded_from_batch
put fileA.txt
put fileB.txt
bye
EOF

# 4. 执行批处理
sftp -b /tmp/sftp-batch.cmds localhost
# 批处理模式在出错时会立即终止

# 5. 验证批处理结果
ssh localhost 'ls -la /tmp/uploaded_from_batch/'
ssh localhost 'ls -la /tmp/file{A,B}.txt'

# ========== 递归上传和下载 ==========

# 6. 递归上传整个目录
sftp localhost << 'SFTPEOF'
mkdir /tmp/sftp-recursive-test
cd /tmp/sftp-recursive-test
put -r ~/ssh-lesson35/sftp-test
bye
SFTPEOF

# 7. 验证
ssh localhost 'find /tmp/sftp-recursive-test -type f'

# ========== 通过 stdin 执行命令 ==========

# 8. 管道方式——适合脚本化
echo "ls -la /etc/ssh/" | sftp localhost

# 9. here-doc 方式——更灵活
sftp localhost << 'EOF2'
get /etc/ssh/sshd_config ~/ssh-lesson35/sshd_config.downloaded
get /etc/ssh/ssh_config ~/ssh-lesson35/ssh_config.downloaded
bye
EOF2

ls -la ~/ssh-lesson35/sshd_config.downloaded ~/ssh-lesson35/ssh_config.downloaded

# 清理
rm -f ~/ssh-lesson35/sshd_config.downloaded ~/ssh-lesson35/ssh_config.downloaded
```

**sftp vs scp 对比：**

| 特性 | scp | sftp |
|------|-----|------|
| 交互性 | 纯命令模式 | 支持交互式浏览 |
| 远程文件管理 | 仅复制 | 复制、删除、重命名、改权限等 |
| 断点续传 | 不支持 | 支持（OpenSSH 9.0+ 的 `reget`/`reput`） |
| 目录浏览 | 不支持 | 支持 `ls`、`cd` 等 |
| 批量操作 | 通过通配符 | `mget`/`mput` + 批处理文件 |
| 官方支持 | 已标记为过时 | 推荐使用 |

### 3.7 sshd 与 sshd_config —— SSH 服务端配置

`sshd`（SSH Daemon）是 SSH 服务器守护进程。它在后台监听 SSH 连接请求，验证客户端身份，然后提供 Shell 访问。

**服务管理：**

```bash
# ========== sshd 服务管理 ==========

# 1. 查看 sshd 服务状态
sudo systemctl status ssh
# Ubuntu 24.04 中服务名是 "ssh"（不是 "sshd"）
# 输出示例：
# ● ssh.service - OpenBSD Secure Shell server
#    Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled; ...)
#    Active: active (running) since ...

# 2. 确认 sshd 进程在运行
ps aux | grep sshd
# 输出示例：
# root       890  0.0  0.1  12172  6280 ?        Ss   10:00   0:00 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups

# 3. 确认 sshd 监听端口
sudo ss -tlnp | grep ssh
# 输出示例：
# LISTEN  0  128  0.0.0.0:22  0.0.0.0:*  users:(("sshd",pid=890,fd=3))
# LISTEN  0  128  [::]:22     [::]:*      users:(("sshd",pid=890,fd=4))

# 4. 启动/停止/重启 sshd
sudo systemctl stop ssh     # 停止（远程操作时不要执行！）
sudo systemctl start ssh    # 启动
sudo systemctl restart ssh  # 重启（当前连接不受影响）
sudo systemctl reload ssh   # 重新加载配置（不中断连接）

# 5. 查看 sshd 的有效配置（去除注释和空行）
sudo sshd -T | head -30
# 输出当前 sshd 的所有配置项及其生效值（包括未在 sshd_config 中显式设置的默认值）

# 6. 验证 sshd_config 语法
sudo sshd -t
# 无输出 = 语法正确
# 有错误信息 = 需要修正

# 7. 扩展测试模式——同时显示有效配置
sudo sshd -T | grep -E "^(port|permitrootlogin|passwordauthentication|allowusers|pubkeyauthentication)"
# 输出示例：
# port 22
# permitrootlogin prohibit-password
# passwordauthentication yes
# pubkeyauthentication yes
```

#### 3.7.1 sshd_config 安全加固

`/etc/ssh/sshd_config` 是 SSH 服务器的配置文件。生产环境中，以下安全加固措施是基本要求。

**sshd_config 关键安全参数表：**

| 参数 | 默认值 | 推荐值 | 说明 |
|------|--------|--------|------|
| `Port` | `22` | `<非标准端口>` | 改用非标准端口可大幅减少自动扫描和暴力破解 |
| `PermitRootLogin` | `prohibit-password` | `no` | **完全禁止 root 直接登录**——必须先以普通用户登录后再 `sudo -i` |
| `PasswordAuthentication` | `yes` | `no` | **禁用密码认证——只允许密钥认证**（先确认密钥已部署） |
| `PubkeyAuthentication` | `yes` | `yes` | 启用公钥认证（必须保持开启） |
| `AllowUsers` | （无限制） | `<特定用户列表>` | **白名单——只允许列出的用户登录** |
| `AllowGroups` | （无限制） | `ssh-users` | 只允许特定用户组的成员登录 |
| `DenyUsers` | （无限制） | `root nobody` | 黑名单（`AllowUsers` 优先） |
| `MaxAuthTries` | `6` | `3` | 最多认证尝试次数——降低暴力破解效率 |
| `MaxSessions` | `10` | `5` | 每个连接最多允许的会话数 |
| `ClientAliveInterval` | `0`（禁用） | `300` | 每 300 秒发送 keep-alive 消息——检测死连接 |
| `ClientAliveCountMax` | `3` | `3` | 3 次 keep-alive 无响应后断开连接（总计 900 秒） |
| `LoginGraceTime` | `120` | `30` | 登录超时——30 秒内未完成认证则断开 |
| `X11Forwarding` | `yes` | `no` | 除非需要远程 GUI，否则关闭 X11 转发 |
| `PermitEmptyPasswords` | `no` | `no` | 禁止空密码（必须保持 `no`） |
| `Protocol` | `2` | `2` | SSH 协议版本——永远只使用版本 2 |
| `HostKey` | （多文件） | 仅保留 ed25519 | 主机密钥算法——优先 Ed25519 |
| `KexAlgorithms` | （默认） | `curve25519-sha256,...` | 限制密钥交换算法——仅使用安全的 |
| `Ciphers` | （默认） | `chacha20-poly1305@openssh.com,aes256-gcm@openssh.com` | 限制加密算法 |
| `MACs` | （默认） | `hmac-sha2-512-etm@openssh.com,...` | 限制消息认证码算法 |

**完整的安全配置示例：**

```bash
# 在修改之前，先备份原配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.original
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup-$(date +%Y%m%d)

# 查看当前所有配置差异
sudo sshd -T | head -50
```

```bash
# /etc/ssh/sshd_config 安全配置片段
# 注意：这是选段，不是完整文件
# 完整配置请参考 man sshd_config

# ========== 端口与监听 ==========

# Port 22                         # 默认 22——建议改为非标准端口（如 2222）
Port 2222                         # 改为 2222（需要同时在防火墙放行）

# 只监听特定 IP——如果有多个 IP
# ListenAddress 192.168.1.100
# ListenAddress 10.0.0.1

# ========== 认证方式 ==========

PermitRootLogin no                # 禁止 root 登录——必须用普通用户 + sudo
PasswordAuthentication no         # 禁止密码登录——只用密钥（前提：密钥已部署！）
PubkeyAuthentication yes          # 启用公钥认证
ChallengeResponseAuthentication no # 禁止键盘交互认证（KbdInteractive）
KerberosAuthentication no         # 禁用 Kerberos
GSSAPIAuthentication no           # 禁用 GSSAPI（减少连接延迟）
UsePAM yes                        # 保留 PAM 支持（账户管理、会话）

# ========== 用户控制 ==========

AllowUsers ubuntu-learner alice   # 白名单——只允许这些用户
# AllowGroups ssh-users           # 或按组控制：只允许 ssh-users 组的成员

# ========== 安全限制 ==========

MaxAuthTries 3                    # 只允许 3 次认证尝试
MaxSessions 5                     # 每个连接最多 5 个会话
LoginGraceTime 30                 # 30 秒内必须完成登录

# ========== 密钥交换与加密 ==========

# 仅使用安全的密钥交换算法（移除 diffie-hellman-group1-sha1 等弱算法）
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group18-sha512,diffie-hellman-group16-sha512

# 仅使用安全的对称加密算法
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com

# 仅使用安全的 MAC 算法（Encrypt-then-MAC 模式优先）
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,umac-128-etm@openssh.com

# ========== 连接管理 ==========

ClientAliveInterval 300           # 每 300 秒发送 keep-alive
ClientAliveCountMax 3             # 3 次无响应 => 断开（共 900 秒）
TCPKeepAlive yes                  # 启用 TCP keep-alive

# ========== 转发控制 ==========

X11Forwarding no                  # 关闭 X11 转发（不需要远程 GUI）
AllowTcpForwarding yes            # 保留 TCP 转发（SSH 隧道需要）
AllowAgentForwarding no           # 禁止 Agent 转发——防止被滥用
GatewayPorts no                   # 禁止远程端口转发绑定到非 localhost 地址
PermitTunnel no                   # 除非需要 VPN over SSH
```

**修改配置的安全流程（远程操作时务必遵守！）：**

```bash
# ═══════════════════════════════════════════════════════════
# ★ 远程修改 sshd_config 的正确流程：
#    保持一个会话打开，用另一个会话验证新配置
# ═══════════════════════════════════════════════════════════

# 步骤 1：打开一个"保底会话"（不要关掉！）
# 终端 1：
ssh user@server
# 保持这个会话——它不会因为 sshd restart 而断开

# 步骤 2：在另一个终端中修改配置
# 终端 2：
ssh user@server
sudo vim /etc/ssh/sshd_config
# ... 进行修改 ...

# 步骤 3：验证配置语法
sudo sshd -t
# 如果报错，修正后再次验证直到无错误

# 步骤 4：重新加载配置
sudo systemctl reload ssh

# 步骤 5：从新终端（终端 3）尝试连接
# 终端 3：
ssh user@server
# 如果能成功登录，说明新配置没问题

# 步骤 6：不要急着关掉终端 1 和 2
# 继续操作 5 分钟，确认一切正常后再关闭
# 如果新配置导致无法登录，用终端 1 恢复原配置
```

### 3.8 ~/.ssh/config —— SSH 客户端配置文件

`~/.ssh/config` 是 SSH 客户端最强大的功能之一。它允许你为每台服务器预设连接参数——告别每次手打长命令。

**文件位置：** `~/.ssh/config`

**权限要求：** `600`（`-rw-------`）

**为什么需要 ~/.ssh/config？**

```
没有 config 时：                    有 config 时：

$ ssh -p 2222 -i ~/.ssh/keys/      $ ssh prod
    prod-ed25519 -J gw.example.
    com deploy@app-server-01.
    internal.example.com

每次都要记住和输入这些参数。          只需要记住一个别名（Host）。
```

**完整配置模板：**

```bash
# 先创建配置文件并设置正确权限
touch ~/.ssh/config
chmod 600 ~/.ssh/config
```

```text
# ============================================================
# ~/.ssh/config — SSH 客户端配置文件
# ============================================================
# 规则优先顺序（先匹配先生效）：
#   Host-specific > Wildcard > Default
#   配置文件从上到下扫描，第一个匹配的 Host 块生效
# ============================================================

# ========== [1] 全局默认配置（适用于所有主机） ==========

Host *
    # ---- 连接参数 ----
    Port 22
    # ServerAliveInterval 60              # 每 60 秒发送 keep-alive
    # ServerAliveCountMax 5               # 5 次无响应后断开

    # ---- 认证参数 ----
    IdentityFile ~/.ssh/id_ed25519
    # PreferredAuthentications publickey,password
    # 认证顺序：先尝试公钥，再尝试密码

    # ---- 安全参数 ----
    StrictHostKeyChecking ask
    # ask：首次连接时询问（默认）
    # yes：永远不自动添加新的主机密钥（最安全）
    # no：自动添加（不安全——不推荐）

    # ---- 性能参数 ----
    Compression yes                       # 启用压缩
    # ControlMaster auto                  # 自动复用连接（见下方说明）
    # ControlPath ~/.ssh/controlmasters/%r@%h:%p
    # ControlPersist 10m                  # 连接关闭后保留 10 分钟

    # ---- 转发开关（默认禁止，需要时按主机开启） ----
    ForwardAgent no
    ForwardX11 no

# ========== [2] 特定主机配置 ==========

# --- 生产 Web 服务器 ---
Host prod-web
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/keys/prod-web-ed25519
    # 该服务器的特定配置——端口 2222，使用专用密钥

# --- 生产数据库服务器（通过跳板机访问） ---
Host prod-db
    HostName 10.0.1.50
    User dbadmin
    Port 22
    IdentityFile ~/.ssh/keys/prod-db-ed25519
    ProxyJump prod-web                   # 通过 prod-web 跳转

# --- 跳板机/堡垒机 ---
Host bastion
    HostName bastion.example.com
    User admin
    Port 22
    IdentityFile ~/.ssh/keys/bastion-ed25519

# --- 通过堡垒机访问内网所有服务器 ---
Host *.internal.example.com
    User admin
    ProxyJump bastion
    # 所有 .internal.example.com 的主机都通过 bastion 跳转

# --- GitHub（使用特定密钥） ---
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/keys/github-ed25519
    # 测试：ssh -T git@github.com
    # 输出：Hi <username>! You've successfully authenticated...

# --- GitLab ---
Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/keys/gitlab-ed25519

# --- 开发环境（启用 Agent 转发和 X11 转发） ---
Host dev-*
    User developer
    ForwardAgent yes                     # 允许 agent 转发
    ForwardX11 yes                       # 允许 X11 转发
    # dev-box, dev-vm 等都会匹配这个块

# --- 阿里云 ECS ---
Host aliyun-web
    HostName 47.xxx.xxx.xxx
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/keys/aliyun-ed25519

# --- AWS EC2 ---
Host aws-*.amazonaws.com
    User ec2-user
    IdentityFile ~/.ssh/keys/aws-ed25519
    # 所有 AWS EC2 默认主机名模式

# --- 本地虚拟机 ---
Host vm-ubuntu
    HostName 192.168.122.100
    User ubuntu-learner
    StrictHostKeyChecking no             # 开发用 VM 频繁重建时可设为 no
    UserKnownHostsFile /dev/null         # 不记录 VM 的主机密钥

# ========== [3] 连接复用（ControlMaster） ==========
# 开启后：同一主机的多个 SSH 会话共享一个 TCP 连接
# 好处：后续连接瞬间完成、不需要重复认证

Host *
    ControlMaster auto
    ControlPath ~/.ssh/controlmasters/%C
    # %C = 连接的哈希值——为每个连接生成唯一路径
    ControlPersist 300
    # 连接关闭后保持 300 秒——期间新连接可复用
```

**启用连接复用前的准备：**

```bash
mkdir -p ~/.ssh/controlmasters
chmod 700 ~/.ssh/controlmasters
```

**~/.ssh/config 常用配置项速查：**

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `Host` | 别名——`ssh <别名>` 即用此配置块 | `Host myserver` |
| `HostName` | 实际主机名或 IP | `HostName 192.168.1.100` |
| `User` | 登录用户名 | `User deploy` |
| `Port` | SSH 端口 | `Port 2222` |
| `IdentityFile` | 私钥路径（可多次指定，依次尝试） | `IdentityFile ~/.ssh/id_ed25519` |
| `ProxyJump` | 跳板机——等价于 `ssh -J` | `ProxyJump bastion` |
| `ForwardAgent` | Agent 转发——等效 `-A` | `ForwardAgent yes` |
| `ForwardX11` | X11 转发——等效 `-X` | `ForwardX11 yes` |
| `LocalForward` | 本地端口转发——等效 `-L` | `LocalForward 3306 localhost:3306` |
| `RemoteForward` | 远程端口转发——等效 `-R` | `RemoteForward 8080 localhost:3000` |
| `DynamicForward` | 动态端口转发——等效 `-D` | `DynamicForward 1080` |
| `StrictHostKeyChecking` | 主机密钥检查策略 | `ask` / `yes` / `no` |
| `UserKnownHostsFile` | known_hosts 文件路径 | `~/.ssh/known_hosts` |
| `ServerAliveInterval` | keep-alive 间隔（秒） | `60` |
| `ServerAliveCountMax` | keep-alive 最大次数 | `5` |
| `Compression` | 启用压缩 | `yes` |
| `ControlMaster` | 连接复用模式 | `auto` / `yes` / `no` |
| `ControlPath` | 控制套接字路径 | `~/.ssh/controlmasters/%C` |
| `ControlPersist` | 控制套接字保持时间 | `300` |
| `LogLevel` | 日志级别 | `INFO` / `VERBOSE` / `DEBUG` |
| `ConnectTimeout` | 连接超时（秒） | `10` |

**实战：使用配置文件简化日常操作**

```bash
# 1. 创建配置
cat >> ~/.ssh/config << 'EOF'

# 练习别名——连接本地 SSH 服务
Host self
    HostName localhost
    User ubuntu-learner
    Port 22
    IdentityFile ~/.ssh/id_ed25519
EOF

# 2. 使用别名连接（无需指定用户名和主机）
ssh self 'echo "通过别名连接成功: $(hostname)"'

# 3. 测试配置块的生效
ssh -v self exit 2>&1 | grep -E "Reading configuration|Applying options"
# 输出示例：
# debug1: Reading configuration data /home/user/.ssh/config
# debug1: /home/user/.ssh/config line XX: Applying options for self

# 4. 验证特定 Host 的生效配置
ssh -G self
# -G 选项：输出匹配 Host 的完整配置（不实际连接）
# 输出示例：
# hostname localhost
# user ubuntu-learner
# port 22
# identityfile ~/.ssh/id_ed25519
```

### 3.9 SSH 隧道（端口转发）三种模式详解

SSH 隧道是 SSH 最强大的功能之一——通过加密的 SSH 连接来转发 TCP 流量。这在安全访问内网服务、穿透防火墙、保护公共 Wi-Fi 上网流量等场景中非常实用。

#### 3.9.1 本地端口转发（Local Forward, `-L`）

**命令格式：**

```
ssh -L [bind_address:]local_port:remote_host:remote_port [user@]ssh_server
```

**含义：** 将本地机器上的 `local_port` 转发到 `ssh_server` 可以访问的 `remote_host:remote_port`。

**理解方式：** "把远程服务搬到本地来"。你在本地访问 `localhost:local_port`，实际访问到的是 `ssh_server` 能连通的那个 `remote_host:remote_port`。

```
┌─────────────────────────────────────────────────────────────────────┐
│  本地端口转发 (-L)                                                    │
│                                                                     │
│  ┌──────────┐                    ┌──────────┐    ┌────────────────┐ │
│  │ 你的电脑   │    SSH 加密隧道     │ SSH 服务器 │    │  目标服务器      │ │
│  │          │ ◄════════════════► │          │    │                │ │
│  │ localhost│                    │          │───►│ 192.168.1.50   │ │
│  │ :3306    │                    │ (能访问   │    │ :3306          │ │
│  │          │                    │  内网)    │    │ (MySQL)        │ │
│  └──────────┘                    └──────────┘    └────────────────┘ │
│                                                                     │
│  命令：ssh -L 3306:192.168.1.50:3306 user@ssh-server                │
│                                                                     │
│  效果：                                                              │
│  • 在本机访问 localhost:3306                                         │
│  • 等同于直接在 ssh-server 上访问 192.168.1.50:3306                   │
│  • MySQL 客户端只需连接 localhost:3306，无需改动配置                  │
└─────────────────────────────────────────────────────────────────────┘
```

**实战示例：**

```bash
# 场景：远程 MySQL 数据库 (192.168.1.50:3306) 只在服务器所在内网可访问
# 目标：在本地用 MySQL 客户端连接该数据库

# 1. 建立本地端口转发
ssh -N -L 3306:192.168.1.50:3306 user@ssh-server.com
# -N：不执行远程命令（仅建立隧道）
# 如果在后台运行：
ssh -f -N -L 3306:192.168.1.50:3306 user@ssh-server.com
# -f：放到后台运行

# 2. 现在本地访问 localhost:3306 即等同于访问远程数据库
mysql -h 127.0.0.1 -P 3306 -u dbuser -p
# 实际上是通过 SSH 隧道连接到远程的 192.168.1.50:3306

# 场景：远程服务器的本地服务（如 Redis 在服务器上只监听 127.0.0.1:6379）
# 目标：本地 Redis 客户端连接远程的 Redis
ssh -N -L 6379:localhost:6379 user@ssh-server.com
# 注意：remote_host=localhost 指的是 ssh-server 上的 localhost
# 然后：
redis-cli -h 127.0.0.1 -p 6379
# 连接成功

# 场景：通过跳板机访问内网 Web 服务
ssh -N -L 8080:internal-web.internal.com:80 user@bastion.example.com
# 浏览器访问 http://localhost:8080 → 实际访问内网的 internal-web:80
```

**可选的 bind_address：**

```bash
# 默认只绑定 127.0.0.1（仅本机能访问）
ssh -L 3306:remote-db:3306 user@server

# 允许局域网内其他机器通过你的机器转发
ssh -L 0.0.0.0:3306:remote-db:3306 user@server
# 或
ssh -L '*:3306:remote-db:3306' user@server
# ⚠ 谨慎使用——这让你的机器变成了网关，任何人都能通过你的 3306 端口访问远程数据库
```

#### 3.9.2 远程端口转发（Remote Forward, `-R`）

**命令格式：**

```
ssh -R [bind_address:]remote_port:local_host:local_port [user@]ssh_server
```

**含义：** 将远程 `ssh_server` 上的 `remote_port` 转发到本地机器能够访问的 `local_host:local_port`。

**理解方式：** "把本地服务暴露到远程去"。远程服务器上的某个端口收到的连接，会被转发到你本地的某个端口——与 `-L` 方向相反。

```
┌─────────────────────────────────────────────────────────────────────┐
│  远程端口转发 (-R)                                                    │
│                                                                     │
│  ┌────────────────┐         ┌──────────┐      ┌──────────┐         │
│  │  你的开发机      │         │ SSH 服务器 │      │ 同事的电脑 │         │
│  │  (无法被外网访问) │         │ (有公网IP) │      │          │         │
│  │                │         │          │      │          │         │
│  │ localhost:3000 │◄────────│ :9090    │◄─────│ 访问 :9090│         │
│  │ (开发中的 Web)  │ SSH隧道  │          │      │          │         │
│  └────────────────┘         └──────────┘      └──────────┘         │
│                                                                     │
│  命令：ssh -R 9090:localhost:3000 user@ssh-server.com                │
│                                                                     │
│  效果：                                                              │
│  • 同事访问 ssh-server.com:9090                                      │
│  • 实际访问到的是你本地的 localhost:3000（你的开发环境）               │
│  • 你不需要在云端部署，就能让同事看到你本地的开发效果                  │
└─────────────────────────────────────────────────────────────────────┘
```

**实战示例：**

```bash
# 场景：本地开发了一个 Web 应用（监听 localhost:3000）
#       想让远程同事通过 ssh-server 的公网地址看到效果
#       你的本地机器可以 SSH 到 ssh-server，但外网无法直接访问你的机器

# 1. 建立远程端口转发
ssh -R 9090:localhost:3000 user@ssh-server.com
# 现在 ssh-server.com:9090 收到的连接会被转发到你的 localhost:3000

# 2. 同事访问 http://ssh-server.com:9090 就能看到你本地的开发页面

# ⚠ 注意：默认情况下，ssh-server 上只监听 127.0.0.1:9090
# 要让别人通过公网访问，需要修改 ssh-server 的 sshd_config：
# GatewayPorts yes    （或 GatewayPorts clientspecified）

# 场景：用远程端口转发做内网穿透
# 你本地的 SSH 服务（端口 22）在 NAT 后面，无法从外网直接访问
# 通过一个有公网 IP 的服务器暴露：
ssh -R 2222:localhost:22 user@public-server.com
# 现在从任何地方执行 ssh -p 2222 user@public-server.com
# 实际连接的是你本地机器（但需要 public-server 上 GatewayPorts yes）
```

#### 3.9.3 动态端口转发（Dynamic Forward/SOCKS Proxy, `-D`）

**命令格式：**

```
ssh -D [bind_address:]local_port [user@]ssh_server
```

**含义：** 在本地创建一个 SOCKS5 代理服务器。所有发往该代理的 TCP 连接，都会通过 SSH 服务器代为完成——SSH 服务器变成了代理服务器。

**理解方式：** "用 SSH 服务器当代理上网"。你的浏览器或应用配置 SOCKS5 代理为 `localhost:1080` 后，所有网络流量都会经过 SSH 服务器转发，对外表现为 SSH 服务器的 IP。

```
┌─────────────────────────────────────────────────────────────────────┐
│  动态端口转发 (-D) —— SOCKS5 代理                                    │
│                                                                     │
│  ┌──────────┐         加密隧道          ┌──────────┐                 │
│  │ 你的笔记本 │ ◄═════════════════════► │ SSH 服务器 │               │
│  │          │                          │ (代理出口) │               │
│  │ SOCKS5   │                          │          │               │
│  │ :1080    │                          │ 访问：    │               │
│  │          │                          │ google.com│──────► 互联网   │
│  │ 浏览器──►│                          │ github.com│──────►         │
│  │ (配置代理)│                          │ ...       │──────►         │
│  └──────────┘                          └──────────┘                 │
│                                                                     │
│  命令：ssh -D 1080 user@ssh-server.com                               │
│                                                                     │
│  效果：                                                              │
│  • 浏览器配置 SOCKS5 代理：localhost:1080                             │
│  • 所有浏览器流量通过 SSH 服务器中转                                  │
│  • 网站看到的 IP 是你 SSH 服务器的 IP，而非你的真实 IP                │
│  • 公共 Wi-Fi 下使用——所有流量加密，防止嗅探                          │
└─────────────────────────────────────────────────────────────────────┘
```

**实战示例：**

```bash
# 1. 启动 SOCKS5 代理
ssh -D 1080 user@ssh-server.com
# 本地 1080 端口现在是一个 SOCKS5 代理

# 或以后台模式运行
ssh -f -N -D 1080 user@ssh-server.com
# -f 后台运行，-N 不执行 Shell

# 2. 配置浏览器使用 SOCKS5 代理
# Firefox：
#   设置 → 网络设置 → 手动代理配置
#   SOCKS 主机：127.0.0.1  端口：1080
#   选择 SOCKS v5
#   勾选"使用 SOCKS v5 时代理 DNS 查询"
#
# Chrome（命令行启动）：
#   google-chrome --proxy-server="socks5://127.0.0.1:1080"

# 3. 命令行工具通过 SOCKS5 代理访问
# curl 通过 SOCKS5 代理
curl --socks5-hostname 127.0.0.1:1080 https://ifconfig.me
# --socks5-hostname 让 DNS 解析也通过代理（防止 DNS 泄漏）

# 4. 使用 tsocks/proxychains 让任意程序走代理
# 安装 proxychains
sudo apt install -y proxychains4
# 配置 /etc/proxychains4.conf 最后一行为 socks5 127.0.0.1 1080
# 然后：
proxychains4 wget https://example.com
# wget 通过代理访问
```

**三种转发模式对比总结：**

```
┌──────────────┬────────────────────┬────────────────────┬──────────────────────┐
│              │   本地转发 (-L)     │   远程转发 (-R)     │   动态转发 (-D)       │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 流量方向      │ 本地 → 远程 → 目标  │ 远程 → 本地 → 目标  │ 本地 → 远程 → 任意    │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 谁发起连接    │ 本地用户            │ 本地用户            │ 本地用户              │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 在谁那里监听  │ 本地机器            │ 远程 SSH 服务器     │ 本地机器              │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 转发目标      │ 一个固定目标         │ 一个固定目标         │ 任意目标（SOCKS5）     │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 典型场景      │ 访问远程内网数据库   │ 暴露本地服务给外网    │ 代理上网/绕过限制     │
├──────────────┼────────────────────┼────────────────────┼──────────────────────┤
│ 类比理解      │ "把远程端口搬来"    │ "把本地端口送去"      │ "把服务器当代理"      │
└──────────────┴────────────────────┴────────────────────┴──────────────────────┘
```

**SSH 隧道的实际限制：**

SSH 隧道只能转发 TCP 流量（SOCKS5 支持 UDP ASSOCIATE，但应用有限）。对于 UDP 流量（如 DNS、VoIP），SSH 隧道不适用。如果确实需要转发 UDP，可以考虑 WireGuard 或 OpenVPN。

---

## 4. 实战练习

### 练习 1：生成 Ed25519 密钥对并部署

**任务：** 完成以下操作：
1. 生成一个 Ed25519 密钥对，使用 `ubuntu-learner@lesson35` 作为注释
2. 查看公钥和私钥的文件权限
3. 查看公钥的 SHA256 指纹
4. 部署公钥到 localhost（或远程测试服务器）
5. 验证免密登录是否生效

**参考答案：**

```bash
# 1. 生成密钥对
ssh-keygen -t ed25519 -C "ubuntu-learner@lesson35" -f ~/.ssh/id_ed25519_exercise
# 提示输入 passphrase——输入 "ExercisePass123" 两次

# 2. 查看权限
ls -la ~/.ssh/id_ed25519_exercise*
# 私钥应显示 -rw------- (600)
# 公钥应显示 -rw-r--r-- (644)

# 3. 查看指纹
ssh-keygen -l -f ~/.ssh/id_ed25519_exercise.pub
# 输出示例：
# 256 SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ubuntu-learner@lesson35 (ED25519)

# 4. 部署到 localhost
ssh-copy-id -i ~/.ssh/id_ed25519_exercise.pub localhost
# 输入当前用户的密码

# 5. 验证免密登录
ssh -i ~/.ssh/id_ed25519_exercise localhost 'echo "免密登录成功: $(date)"'
# 如果设置了 passphrase，需要输入（练习 3 将解决这个问题）
```

---

### 练习 2：使用 ssh-agent 管理密钥并设置生命周期

**任务：**
1. 启动 ssh-agent（如果尚未运行）
2. 将练习 1 生成的密钥添加到 agent
3. 验证密钥已加载
4. 添加密钥时设置 5 分钟生命周期
5. 5 分钟后确认密钥已自动移除
6. 重新添加密钥并测试免密登录

**参考答案：**

```bash
# 1. 检查或启动 agent
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval $(ssh-agent)
    echo "agent 已启动: PID=$SSH_AGENT_PID"
else
    echo "agent 已在运行: sock=$SSH_AUTH_SOCK"
fi

# 2. 添加密钥
ssh-add ~/.ssh/id_ed25519_exercise
# 输入 passphrase: ExercisePass123
# 输出：Identity added: /home/user/.ssh/id_ed25519_exercise

# 3. 验证已加载
ssh-add -l
# 应显示一条密钥条目

# 4. 移除现有密钥，添加带生命周期的
ssh-add -D
ssh-add -t 300 ~/.ssh/id_ed25519_exercise
# 300 秒 = 5 分钟

# 5. 立即测试——应该不需要 passphrase
ssh -i ~/.ssh/id_ed25519_exercise localhost 'echo "agent 生效中"'

# 6. 等待 5 分钟后密钥自动过期
echo "等待 300 秒..."
sleep 300
ssh-add -l
# 应该显示 "The agent has no identities." （密钥已过期）

# 7. 重新添加
ssh-add ~/.ssh/id_ed25519_exercise
ssh -i ~/.ssh/id_ed25519_exercise localhost 'echo "再次成功"'
```

---

### 练习 3：配置 ~/.ssh/config 简化连接

**任务：**
1. 创建 `~/.ssh/config` 文件（如果已存在则备份）
2. 添加一个名为 `self` 的 Host 配置块，指向 localhost
3. 添加一个全局配置块，启用以下功能：
   - 连接保活（60 秒间隔）
   - 压缩
   - 连接复用（ControlMaster auto）
4. 使用 `ssh -G self` 验证配置是否正确
5. 使用别名 `ssh self` 连接

**参考答案：**

```bash
# 1. 备份已有配置
[ -f ~/.ssh/config ] && cp ~/.ssh/config ~/.ssh/config.backup-exercise

# 2. 创建配置
mkdir -p ~/.ssh/controlmasters
chmod 700 ~/.ssh/controlmasters

cat > ~/.ssh/config << 'EOF'
# ===== 全局配置 =====
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 5
    Compression yes
    ControlMaster auto
    ControlPath ~/.ssh/controlmasters/%C
    ControlPersist 300

# ===== localhost 别名 =====
Host self
    HostName localhost
    User ubuntu-learner
    Port 22
    IdentityFile ~/.ssh/id_ed25519_exercise
EOF

# 3. 设置正确的权限
chmod 600 ~/.ssh/config

# 4. 验证配置
ssh -G self | head -20
# 输出应显示 hostname=localhost, user=ubuntu-learner 等

# 5. 使用别名连接
ssh self 'echo "通过别名连接: $(hostname)"'

# 6. 验证连接复用——打开两个 SSH 会话
# 终端 1：
ssh self
# 终端 2：
ssh self
# 第二个连接应该瞬间建立（没有认证过程）
# 查看复用 socket：
ls ~/.ssh/controlmasters/
```

---

### 练习 4：scp 与 sftp 文件传输

**任务：**
1. 创建一个 10MB 的测试文件
2. 使用 `scp` 上传到远程主机 `/tmp/`
3. 使用 `scp` 从远程主机下载 `/etc/hostname` 到本地
4. 使用 `sftp` 交互式完成：上传文件、切换目录、查看文件列表、下载文件、退出
5. 使用 `sftp` 的批处理模式上传 3 个文件

**参考答案：**

```bash
cd ~/ssh-lesson35

# 1. 创建测试文件
dd if=/dev/urandom of=10mb-test.bin bs=1M count=10 2>/dev/null
ls -lh 10mb-test.bin

# 2. scp 上传
scp 10mb-test.bin localhost:/tmp/
# 验证
ssh localhost 'ls -lh /tmp/10mb-test.bin'

# 3. scp 下载
scp localhost:/etc/hostname ./remote-hostname.txt
cat ./remote-hostname.txt

# 4. sftp 交互式操作
sftp localhost << 'SFTPEND'
mkdir /tmp/sftp-exercise
cd /tmp/sftp-exercise
put ~/ssh-lesson35/10mb-test.bin
put ~/ssh-lesson35/remote-hostname.txt
ls -la
get hostname.txt ~/ssh-lesson35/sftp-downloaded.txt
rm 10mb-test.bin
ls -la
bye
SFTPEND

# 验证
cat ~/ssh-lesson35/sftp-downloaded.txt
ssh localhost 'ls -la /tmp/sftp-exercise/'
ssh localhost 'test -f /tmp/sftp-exercise/10mb-test.bin && echo "文件存在" || echo "已删除"'

# 5. sftp 批处理模式
echo "File 1" > batch-file1.txt
echo "File 2" > batch-file2.txt
echo "File 3" > batch-file3.txt

cat > /tmp/sftp-batch.cmds << 'EOF'
mkdir /tmp/sftp-batch-exercise
cd /tmp/sftp-batch-exercise
lcd ~/ssh-lesson35
put batch-file1.txt
put batch-file2.txt
put batch-file3.txt
ls -la
bye
EOF

sftp -b /tmp/sftp-batch.cmds localhost

# 验证批处理结果
ssh localhost 'ls -la /tmp/sftp-batch-exercise/'
ssh localhost 'cat /tmp/sftp-batch-exercise/batch-file1.txt'
```

---

### 练习 5：SSH 本地端口转发——访问远程服务

**任务：**
1. 在远程主机（或 localhost）上启动一个简单的 HTTP 服务（使用 Python）
2. 该 HTTP 服务只监听 127.0.0.1（不允许外部直接访问）
3. 建立 SSH 本地端口转发——将本地端口 8888 转发到远程的 HTTP 服务
4. 用 `curl` 访问 `localhost:8888`，验证能获取到 HTTP 响应
5. 关闭转发和 HTTP 服务

**参考答案：**

```bash
# 1. 在远程主机上启动 HTTP 服务（仅监听 localhost）
ssh localhost 'python3 -c "
from http.server import HTTPServer, BaseHTTPRequestHandler
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header(\"Content-type\", \"text/plain\")
        self.end_headers()
        self.wfile.write(b\"Hello from SSH tunnel!\")
HTTPServer((\"127.0.0.1\", 18888), H).serve_forever()
" &' &
# 等待服务启动
sleep 2

# 2. 验证——直接访问应该失败（服务只监听 127.0.0.1）
curl -s --connect-timeout 3 http://localhost:18888 2>&1 || echo "直接访问失败（预期行为）"

# 3. 建立 SSH 本地端口转发
ssh -f -N -L 8888:localhost:18888 localhost
# -f：后台运行
# -N：不执行远程命令
# -L 8888:localhost:18888：本地 8888 → 远程 localhost:18888
#   注意：这里的 localhost 是相对于 SSH 服务器（localhost）的

# 4. 通过隧道访问
curl -s http://localhost:8888
# 输出：Hello from SSH tunnel!

# 5. 验证隧道确实在工作
ssh localhost 'ss -tlnp | grep 18888'   # 远程的 HTTP 服务
ss -tlnp | grep 8888                     # 本地的隧道监听端口

# 6. 清理
# 杀掉 SSH 隧道进程
pkill -f "ssh.*-L 8888:localhost:18888"
# 杀掉远程 HTTP 服务
ssh localhost 'pkill -f "python3.*18888"'
```

---

### 练习 6：查看并理解 sshd_config 配置

**任务：**
1. 查看 `/etc/ssh/sshd_config` 文件的内容
2. 使用 `sshd -T` 查看所有生效配置
3. 找出当前配置中的以下关键参数：
   - 监听端口
   - 是否允许 root 登录
   - 是否允许密码认证
   - 是否允许公钥认证
   - 最大认证尝试次数
4. 备份 sshd_config，然后修改配置测试 `sshd -t` 语法检查
5. 将备份还原

**参考答案：**

```bash
# 1. 查看 sshd_config
sudo cat /etc/ssh/sshd_config | grep -v '^#' | grep -v '^$'
# 显示所有非注释非空行

# 2. 查看所有生效配置
sudo sshd -T | head -40

# 3. 筛选关键参数
sudo sshd -T | grep -E "^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|maxauthtries|allowusers|clientaliveinterval)"
# 输出示例：
# port 22
# permitrootlogin prohibit-password
# passwordauthentication yes
# pubkeyauthentication yes
# maxauthtries 6
# clientaliveinterval 0

# 4. 备份
sudo cp /etc/ssh/sshd_config /tmp/sshd_config.exercise-backup

# 5. 验证语法（不实际修改）
sudo sshd -t && echo "当前配置语法正确"

# 6. 练习修改并验证（在备份上进行语法检查）
cat > /tmp/sshd_config.test << 'EOF'
# 测试配置——故意放一个错误看看 sshd -t 的反应
Port 22
PermitRootLogin no
PasswordAuthentication no
# ChallengeResponseAuthentication yes  # 早期 Ubuntu 的拼写，现在是 KbdInteractiveAuthentication
EOF
sudo sshd -t -f /tmp/sshd_config.test 2>&1 || echo "预期：可能有缺失配置项的警告"

# 7. 还原（本练习未实际修改，无需还原）
# 如果做了实际修改：
# sudo cp /tmp/sshd_config.exercise-backup /etc/ssh/sshd_config
# sudo sshd -t && sudo systemctl reload ssh

echo "练习完成——原始 sshd_config 未被修改"
```

---

### 练习 7：SSH 跳板机连接

**任务：**
1. 模拟跳板机场景：使用本地 22 端口模拟跳板机
2. 使用 `-J` 参数通过 localhost "跳转"到 localhost 自身
3. 使用 `-J` 执行远程命令验证跳转路径
4. 在 `~/.ssh/config` 中配置 `ProxyJump`
5. 比较 `-J` 和 `-A` 的差异

**参考答案：**

```bash
# 1. 通过 localhost "跳转"到 localhost（两次认证）
ssh -J localhost localhost 'echo "跳板连接成功: $(hostname) $(date)"'

# 分析：-J localhost localhost
# 第一步：SSH 连接到第一个 localhost（跳板机）
# 第二步：通过跳板机连接第二个 localhost（目标）
# 效果：进行了两次 SSH 认证

# 2. 使用 -v 查看跳转过程
ssh -v -J localhost localhost 'exit' 2>&1 | grep -E "debug1: (Connecting|jumphost|channel)"
# 输出示例：
# debug1: Setting implicit ProxyCommand from ProxyJump: ssh -J localhost -v ...
# debug1: channel 0: new [client-session]

# 3. 在 ~/.ssh/config 中配置 ProxyJump
cat >> ~/.ssh/config << 'EOF'

# 模拟跳板机配置
Host bastion-local
    HostName localhost
    User ubuntu-learner

# 通过跳板机到达的目标
Host target-via-bastion
    HostName localhost
    User ubuntu-learner
    ProxyJump bastion-local
EOF

# 使用配置的别名
ssh target-via-bastion 'echo "通过 ProxyJump 配置连接成功"'

# 4. 比较 -J（ProxyJump）和 -A（Agent Forwarding）
echo "=== -J (ProxyJump) 方式 ==="
echo "-J 在本地和目标之间建立端到端的加密连接"
echo "跳板机只做 TCP 转发，无法解密或篡改通信"
echo "目标机的认证请求直接从本地 SSH 客户端发出"
echo ""

echo "=== -A (Agent Forwarding) 方式 ==="
echo "ssh -A bastion  # 先登录跳板机并转发 agent"
echo "ssh target      # 在跳板机上登录目标机"
echo "目标机的认证请求 → 转发到跳板机 → 再转发到本地 agent"
echo "风险：如果跳板机被入侵，攻击者可滥用 agent socket"
echo ""

echo "结论：ProxyJump (-J) 比 Agent Forwarding (-A) 更安全"
echo "推荐使用 -J 或 ProxyJump 配置项"
```

---

### 练习 8：SSH 连接排错综合练习

**任务：**
模拟以下 SSH 连接问题，使用 `ssh -v` 进行排错：
1. 尝试连接一个不存在的端口——观察错误信息
2. 尝试使用不存在的密钥文件——观察认证失败过程
3. 故意提供错误用户名——观察服务端响应
4. 查看 `~/.ssh/known_hosts` 中的条目格式
5. 使用 `ssh-keygen -R` 清理某个条目后重新连接

**参考答案：**

```bash
# 1. 连接不存在的端口
ssh -v -p 19999 localhost exit 2>&1 | grep -E "debug1:|Connection refused|No route"
# 输出应包含：
# debug1: Connecting to localhost [::1] port 19999.
# Connection refused

# 2. 使用不存在的密钥文件
ssh -v -i /tmp/nonexistent_key localhost exit 2>&1 | grep -E "debug1: (Trying|Offering|identity|Authentication)"
# 输出示例：
# debug1: Trying private key: /tmp/nonexistent_key
# debug1: Will attempt key: /home/user/.ssh/id_ed25519
# debug1: Authentication succeeded (publickey).

# 观察：ssh 会依次尝试所有可用的密钥，直到成功

# 3. 故意提供错误用户名
ssh -v nonexistent_user@localhost exit 2>&1 | grep -E "debug1: (Authentication|Permission)"
# 输出示例：
# debug1: Authentications that can continue: publickey,password
# Permission denied (publickey,password).

# 4. 查看 known_hosts 中的条目
cat ~/.ssh/known_hosts | head -5
# 每行格式：主机名/IP 算法 Base64编码的公钥
# 如果启用 HashKnownHosts，主机名会被哈希处理

# 5. 从 known_hosts 中删除 localhost 并重新连接
# 删除前先查看
ssh-keygen -F localhost
# 输出当前 known_hosts 中关于 localhost 的条目

# 删除
ssh-keygen -R localhost
# 输出：# Host localhost found: line XX
#       # /home/user/.ssh/known_hosts updated.

# 重新连接——应该再次提示确认主机指纹
ssh localhost exit
# 预期输出：
# The authenticity of host 'localhost (::1)' can't be established.
# Are you sure you want to continue connecting (yes/no/[fingerprint])?
# 输入 yes 确认

# 6. 清理练习文件
rm -f ~/ssh-lesson35/10mb-test.bin \
      ~/ssh-lesson35/remote-hostname.txt \
      ~/ssh-lesson35/sftp-downloaded.txt \
      ~/ssh-lesson35/batch-file{1,2,3}.txt

# 可选：清理练习用密钥
# rm -f ~/.ssh/id_ed25519_exercise ~/.ssh/id_ed25519_exercise.pub
```

---

## 5. 常见错误与排错

### 错误 1：Permission denied (publickey)

**现象：** 使用密钥登录时收到 `Permission denied (publickey).`，即使密钥已用 `ssh-copy-id` 部署。

**完整错误信息：**

```
Permission denied (publickey).
```

**原因和排查步骤：**

```bash
# === 系统化排查 Permission denied ===

# 步骤 1：检查本地私钥文件
ls -la ~/.ssh/id_ed25519
# 权限必须是 -rw------- (600)

# 步骤 2：检查是否在使用正确的密钥
ssh -v user@server 2>&1 | grep -i "Offering public key"
# 确认客户端正尝试正确的密钥

# 步骤 3：检查服务器端 SSH 日志
sudo tail -50 /var/log/auth.log | grep sshd
# 或
sudo journalctl -u ssh -n 50
# 关键信息：
# "Authentication refused: bad ownership or modes" → 服务器端权限问题
# "Failed publickey" → 密钥不匹配

# 步骤 4：检查服务器端 ~/.ssh 权限（这是最常见的原因！）
ssh user@server 'ls -lad ~/.ssh; ls -la ~/.ssh/authorized_keys'
# 正确权限：
# drwx------  (700)  ~/.ssh/
# -rw-------  (600)  ~/.ssh/authorized_keys

# 步骤 5：修复服务器端权限
ssh user@server 'chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys'

# 步骤 6：检查服务端是否启用了公钥认证
ssh user@server 'sudo sshd -T | grep -E "pubkeyauthentication|passwordauthentication"'
# pubkeyauthentication yes  ← 必须是 yes

# 步骤 7：检查 authorized_keys 中的公钥是否与本地私钥匹配
ssh-keygen -y -f ~/.ssh/id_ed25519    # 从本地私钥导出公钥
ssh user@server 'cat ~/.ssh/authorized_keys'  # 查看服务器上的公钥
# 两者的公钥应该一致
```

**一步到位的排查命令：**

```bash
# 服务器端一键诊断权限
ssh user@server 'echo "=== .ssh 目录 ===" && ls -lad ~/.ssh && echo "=== authorized_keys ===" && ls -la ~/.ssh/authorized_keys && echo "=== 我的 HOME ===" && echo $HOME && ls -lad $HOME'
```

---

### 错误 2：WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED

**现象：** 连接时出现主机密钥变更警告，连接被拒绝。

**完整错误信息：**

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
...
Host key verification failed.
```

**原因：** `known_hosts` 中记录的主机密钥与服务器当前提供的不一致。

**解决：**

```bash
# 步骤 1：确认是否是合法变更（重装系统、重建主机密钥）
#        先通过其他渠道（控制台登录、云厂商信息）确认服务器是否确实变更

# 步骤 2：如果是合法变更——删除旧条目
ssh-keygen -R <hostname_or_ip>
# 也删除 IP 地址条目（如果主机名和 IP 都存储了）
ssh-keygen -R <ip_address>

# 步骤 3：重新连接并确认新密钥
ssh user@server
# 会提示确认新指纹

# 步骤 4：危险操作——跳过主机密钥检查（仅用于测试！）
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null user@server
# ⚠ 这完全跳过了主机认证——容易遭受中间人攻击
# 仅在以下场景使用：临时测试、虚拟机频繁重建、自动化部署（使用 SSH CA 更好）
```

---

### 错误 3：ssh 连接非常慢（几十秒才能出提示）

**现象：** SSH 连接建立需要 5-30 秒，但建立后响应正常。

**原因：** 最常见的原因是服务端的 DNS 反向解析超时，或 GSSAPI 认证协商延迟。

**解决：**

```bash
# === 客户端快速排查 ===

# 方法 1：禁用 GSSAPI 认证（最常见的加速手段）
ssh -o GSSAPIAuthentication=no user@server

# 方法 2：在 ~/.ssh/config 中永久禁用
cat >> ~/.ssh/config << 'EOF'
Host slow-server
    HostName <实际主机名>
    GSSAPIAuthentication no
EOF

# === 服务端优化 ===

# 方法 3：修改 sshd_config 关闭 DNS 反向解析
echo "UseDNS no" | sudo tee -a /etc/ssh/sshd_config
sudo sshd -t && sudo systemctl reload ssh

# 方法 4：如果服务端不需要 GSSAPI
echo "GSSAPIAuthentication no" | sudo tee -a /etc/ssh/sshd_config
sudo sshd -t && sudo systemctl reload ssh

# 方法 5：使用 ssh -v 定位具体延迟阶段
ssh -v user@server exit 2>&1 | grep -E "debug1: (Connecting|Authentications|Authentication|pledge)"
# 观察各阶段之间的时间间隔——找到卡在哪一步
```

---

### 错误 4：Connection refused / Connection timed out

**现象：** `ssh: connect to host server.com port 22: Connection refused` 或 `Connection timed out`

**排查步骤：**

```bash
# 步骤 1：确认网络连通性
ping -c 3 server.com
# 通了 → 目标主机在线，问题可能是端口或服务
# 不通 → 网络/防火墙/路由问题

# 步骤 2：确认端口可达
nc -zv server.com 22 2>&1
# Connection refused → 端口未监听（sshd 未运行或监听在其他端口）
# Connection timed out → 防火墙拦截了该端口

# 步骤 3：在服务器端确认 sshd 是否运行
# （需要其他方式登录——控制台、VNC、云厂商串口）
sudo systemctl status ssh
# 或
sudo ss -tlnp | grep sshd

# 步骤 4：确认防火墙是否放行 SSH 端口
sudo ufw status verbose | grep -i ssh
# 或
sudo iptables -L INPUT -n | grep <端口号>

# 步骤 5：如果在云上——确认安全组/防火墙规则
# 云厂商通常有独立于系统防火墙的安全组（Security Group）
# 需要在云控制台确认入站规则允许你的 IP 访问 SSH 端口
```

---

### 错误 5：ssh-copy-id 失败——"Permission denied" 或 "No such file"

**现象：** `ssh-copy-id` 执行时报权限拒绝或文件找不到。

**解决：**

```bash
# 问题 1：远程用户的密码不对
# 确保用的是远程用户的密码，而非本地用户的密码
# ssh-copy-id 需要远程认证——先确认可以用密码登录
ssh user@server 'echo "密码登录正常"'

# 问题 2：服务器端 ~/.ssh 目录不存在
# 手动创建
ssh user@server 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'

# 问题 3：密码认证被禁用
# 如果服务器 PasswordAuthentication=no，则 ssh-copy-id 无法使用密码
# 方案：手动复制公钥（需要另一种登录方式）
cat ~/.ssh/id_ed25519.pub | ssh user@server \
    -o PasswordAuthentication=no \
    'cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
# 如果已经有其他密钥可以登录，用密钥认证后手动复制

# 问题 4：HOME 目录权限不对
# sshd 对 HOME 目录权限有严格要求
ssh user@server 'ls -lad $HOME'
# drwx------ 或 drwxr-xr-x 都可以
# 如果是 drwxrwxrwx (777) → sshd 会拒绝使用 authorized_keys
ssh user@server 'chmod 755 $HOME'
```

---

### 错误 6：修改 sshd_config 后无法登录

**现象：** 修改 `/etc/ssh/sshd_config` 并重启后，无法通过 SSH 登录。

**这是 SSH 管理中最危险的错误——一次错误配置可能让你永远失去对远程服务器的访问。**

**预防和补救：**

```bash
# ══════════════════════════════════════════════════
# ★ 预防措施（修改 sshd_config 前必须执行！）
# ══════════════════════════════════════════════════

# 保持一个活着的 SSH 会话（不要关闭！）
# 终端 1：建立保底连接
ssh user@server
sudo -i  # 获取 root 权限以备不时之需

# 终端 2：执行实际修改
ssh user@server
sudo vim /etc/ssh/sshd_config
# ... 修改完成后 ...

# 1. 验证语法
sudo sshd -t
# 有错误就修正，无错误继续

# 2. 重载（而非重启——reload 不中断活跃连接）
sudo systemctl reload ssh

# 3. 在终端 3 测试新配置能否登录
ssh user@server 'echo "新配置下登录成功"'

# 4. 确认无误后再关闭终端 1 和终端 2
# ══════════════════════════════════════════════════

# 如果已经被锁在外面（需要在控制台操作）：
# 方法 1：云服务器——使用云厂商的 VNC/串口控制台登录
# 方法 2：物理服务器——直接接显示器键盘登录
# 方法 3：云服务器——使用救援模式（Rescue Mode）挂载系统盘修复
# 方法 4：从快照/备份恢复

# 登录后：
sudo vim /etc/ssh/sshd_config  # 恢复之前的配置
sudo systemctl restart ssh
```

---

## 6. 进阶延伸

### 6.1 从"能用 SSH"到"SSH 基础设施工程"

本章覆盖了 SSH 的核心操作——从密钥生成到隧道转发，从客户端配置到服务端安全加固。但这些技能只是起点。在真实的运维环境中，SSH 管理的挑战在于**规模化**和**标准化**：

- 50 台服务器，每台都有不同的密钥——如何安全地轮换密钥？
- 100 个开发人员，每人需要访问不同的服务器组——如何管理授权？
- 生产环境不允许手动确认主机指纹——如何安全地分发主机密钥？
- 合规要求审计谁在什么时间登录了哪台服务器——如何记录和审查 SSH 会话？

以下是你接下来应该深入的方向：

**（1）SSH 证书认证（SSH Certificate Authority）**

SSH 支持基于 CA（Certificate Authority，证书颁发机构）的认证机制——这是比 authorized_keys 文件更强大的规模化方案：

```
传统方式（authorized_keys）：              证书方式（CA）：
───────────────────────────              ────────────────
每个用户 → 每台服务器                        CA 签发用户证书
每台服务器都要维护                              │
authorized_keys 文件                        用户持证书登录服务器
新员工入职：更新所有服务器的文件               │
员工离职：在所有服务器上删除其公钥              服务器只需信任 CA 的公钥
这个流程不可规模化                            │
                                           签发新证书 → 吊销证书
                                           服务器无需更新任何配置
```

```bash
# SSH CA 的基本概念（示意）：

# 1. CA 生成 CA 密钥对（只需一次）
ssh-keygen -t ed25519 -f ~/.ssh/ca_key -C "SSH CA"

# 2. 在所有服务器上信任 CA（只需一次）
# 将 ca_key.pub 复制到每台服务器的 /etc/ssh/ca.pub
# 在 sshd_config 中添加：
# TrustedUserCAKeys /etc/ssh/ca.pub

# 3. 为用户签发证书（有有效期的临时凭证）
ssh-keygen -s ~/.ssh/ca_key -I "alice_id" \
    -n alice -V +52w ~/.ssh/alice_id_ed25519.pub
# -I：证书标识（用于审计日志）
# -n：允许登录的用户名（principals）
# -V：有效期（+52w = 52 周）

# 4. 用户持证书登录
ssh -i ~/.ssh/alice_id_ed25519-cert.pub alice@server

# 优势：
# - 证书有明确的有效期——到期自动失效
# - 离职只需吊销证书，无需触碰服务器
# - 所有认证事件在日志中有明确的证书 ID——可审计
```

**（2）多因素认证（MFA/2FA）与 SSH**

对于面向公网的 SSH 服务，仅靠密钥认证不够——密钥文件可能被盗。添加第二因素可以大幅提升安全性。

```bash
# 方法 1：Google Authenticator (TOTP)
sudo apt install -y libpam-google-authenticator

# 配置 PAM（Pluggable Authentication Module）
echo "auth required pam_google_authenticator.so" | \
    sudo tee -a /etc/pam.d/sshd

# 在 sshd_config 中：
# ChallengeResponseAuthentication yes
# AuthenticationMethods publickey,keyboard-interactive
# 认证顺序：先验证公钥，再提示输入 TOTP 验证码

# 普通用户初始化：
google-authenticator
# 扫描二维码，绑定到手机 App（Google Authenticator / Authy 等）

# 方法 2：使用 FIDO2/U2F 硬件安全密钥（YubiKey 等）
ssh-keygen -t ed25519-sk -C "yubikey-alice"
# -sk 表示 Security Key（需要插入 YubiKey）
# 生成的私钥与硬件绑定——私钥无法导出
# 登录时需要触摸硬件密钥确认
```

**（3）SSH 会话审计与录制**

生产环境中的 SSH 操作需要审计。以下是几种方案：

```bash
# 方案 1：使用 script 命令录制会话
ssh user@server
script --timing=/tmp/session.timing /tmp/session.log
# ... 进行操作 ...
exit
# 回放：
scriptreplay --timing=/tmp/session.timing /tmp/session.log

# 方案 2：使用 tlog（systemd 集成的终端 I/O 日志）
sudo apt install -y tlog
# 配置为用户的登录 shell，自动录制所有操作
# 详见 /etc/tlog/tlog-rec-session.conf

# 方案 3：商业方案
# - Teleport（开源、支持 CA、会话录制、RBAC）
# - HashiCorp Boundary
# - CyberArk（企业级特权访问管理）
```

**（4）Mosh（Mobile Shell）——高延迟和间歇连接场景**

Mosh 是 SSH 的补充协议，专为移动网络和高延迟场景设计：

```bash
sudo apt install -y mosh

# Mosh 的优势：
# - 本地即时回显：输入字符立即显示（不等服务器确认）
# - 连接漫游：切换 Wi-Fi 到 4G —— 自动重连，无需手动重新建立 SSH
# - 预测性输入：使用 UDP + SSP（State Synchronization Protocol）
#   而非 TCP，在网络中断期间比 SSH 更稳定

# 使用方式（需要服务器端也安装 mosh）：
mosh user@server
# 内部：使用 SSH 建立初始连接和认证
#       然后切换到 Mosh 协议进行持续的终端会话
```

**（5）tmux/screen —— 保持会话不中断**

SSH 连接可能随时断开（网络抖动、电脑休眠、切换网络）。tmux（Terminal Multiplexer，终端复用器）让你的远程会话与 SSH 连接解耦：

```bash
sudo apt install -y tmux

# tmux 的核心价值：
# - SSH 断开了 → 会话仍在服务器端运行
# - 重新 SSH 登录 → tmux attach 恢复之前的全部状态
# - 一个 SSH 连接 → 多个独立的窗口和面板

# 基本使用：
tmux new -s work          # 创建名为 "work" 的会话
# ... 在会话中进行任何操作 ...
# Ctrl+B, D               # 分离（detach）——退出 tmux 但保持会话运行

# 断开 SSH 连接（或主动断开），然后重新登录：
tmux attach -t work       # 恢复 "work" 会话——一切如初
tmux ls                   # 列出所有会话
tmux kill-session -t work # 终止会话
```

### 6.2 命令速查表

```
SSH 远程管理命令速查表

SSH 连接与执行
  ssh user@host                         基本登录
  ssh -p 2222 user@host                 指定端口
  ssh -i ~/.ssh/mykey user@host         指定私钥
  ssh user@host 'command'               远程执行命令
  ssh -t user@host 'sudo command'       远程执行 sudo 命令（-t 分配终端）
  ssh -v / -vv / -vvv user@host         调试模式（级别 1/2/3）
  ssh -J gw.example.com target.internal 通过跳板机连接
  ssh -A user@host                      启用 Agent 转发
  ssh -X user@host                      启用 X11 转发
  ssh -N -f -L 3306:db:3306 user@host   后台本地端口转发

SSH 密钥管理
  ssh-keygen -t ed25519 -C "comment"    生成 Ed25519 密钥（推荐）
  ssh-keygen -t rsa -b 4096 -C "comment"生成 RSA 4096 位密钥
  ssh-keygen -l -f ~/.ssh/id_ed25519.pub查看密钥指纹
  ssh-keygen -y -f ~/.ssh/id_ed25519    从私钥导出公钥
  ssh-keygen -p -f ~/.ssh/id_ed25519    修改 passphrase
  ssh-keygen -R hostname                从 known_hosts 删除主机
  ssh-keygen -F hostname                在 known_hosts 中查找主机
  ssh-copy-id user@host                 部署公钥到服务器
  ssh-copy-id -i ~/.ssh/custom.pub host 部署指定公钥

SSH Agent 管理
  eval $(ssh-agent)                     启动 agent
  ssh-add                               添加默认密钥到 agent
  ssh-add ~/.ssh/mykey                  添加指定密钥
  ssh-add -l                            列出已加载密钥
  ssh-add -L                            列出已加载公钥
  ssh-add -d ~/.ssh/mykey               移除指定密钥
  ssh-add -D                            移除所有密钥
  ssh-add -t 3600 ~/.ssh/mykey          添加密钥并设置 3600 秒生命周期
  ssh-add -x / -X                       锁定/解锁 agent

SSH 隧道（端口转发）
  ssh -L LPORT:RHOST:RPORT user@server  本地转发——本地 LPORT → RHOST:RPORT
  ssh -R RPORT:LHOST:LPORT user@server  远程转发——远程 RPORT → LHOST:LPORT
  ssh -D LPORT user@server              动态转发——本地 SOCKS5 代理
  ssh -f -N -L 3306:db:3306 user@server 在后台建立本地转发隧道
  ssh -f -N -R 8080:localhost:3000 ...  在后台建立远程转发隧道
  ssh -f -N -D 1080 user@server         在后台建立 SOCKS5 代理

scp 文件传输
  scp localfile user@host:/remote/path  上传文件
  scp user@host:/remote/file ./local/   下载文件
  scp -r dir/ user@host:/remote/path    递归上传目录
  scp -r user@host:/remote/dir/ ./local 递归下载目录
  scp -P 2222 file user@host:~/         指定端口（大写 P）
  scp -p file user@host:~/              保留文件属性（小写 p）
  scp -C largefile user@host:~/         启用压缩
  scp -l 8192 file user@host:~/         限制带宽（Kbit/s）

sftp 文件传输
  sftp user@host                        交互式连接
  sftp -P 2222 user@host                指定端口
  sftp -b batch.cmds user@host          批处理模式
  sftp user@host:/remote/file ./local   直接下载（单条命令）

sftp 内部命令
  ls / cd / pwd                         远程文件浏览
  lls / lcd / lpwd                      本地文件浏览
  get file [local]                      下载文件
  put file [remote]                     上传文件
  get -r dir/ / put -r dir/             递归传输目录
  mget *.log / mput *.txt               批量传输
  rm / rmdir / mkdir / rename / chmod   远程文件管理
  df -h                                 查看远程磁盘
  !command                              执行本地 Shell 命令
  bye / exit / quit                     退出

sshd 服务端管理
  sudo systemctl status ssh             查看 sshd 状态
  sudo systemctl start/stop/restart ssh 启动/停止/重启
  sudo systemctl reload ssh             重新加载配置（不中断连接）
  sudo sshd -t                          验证 sshd_config 语法
  sudo sshd -T                          显示所有生效配置
  sudo sshd -T | grep <param>           查询特定参数

sshd_config 安全加固（核心参数）
  Port 2222                             修改监听端口
  PermitRootLogin no                    禁止 root 直接登录
  PasswordAuthentication no             禁用密码认证
  PubkeyAuthentication yes              启用公钥认证
  AllowUsers alice bob                  用户白名单
  MaxAuthTries 3                        认证尝试限制
  ClientAliveInterval 300               keep-alive 间隔
  KexAlgorithms / Ciphers / MACs       限制算法套件

~/.ssh/config 常用配置
  Host <alias>                          定义主机别名
  HostName <actual-host>                实际主机名或 IP
  User <username>                       登录用户名
  Port <port>                           端口
  IdentityFile <path>                   私钥路径
  ProxyJump <bastion>                   跳板机
  ForwardAgent yes/no                    Agent 转发
  LocalForward / RemoteForward / DynamicForward  端口转发（持久化配置）
  ServerAliveInterval 60                keep-alive
  ControlMaster auto                    连接复用
  Compression yes                       压缩
  StrictHostKeyChecking ask/yes/no     主机密钥检查策略

日志与排错
  ssh -v user@host                      客户端调试
  sudo tail -f /var/log/auth.log        服务端认证日志（Ubuntu）
  sudo journalctl -u ssh -f             服务端 systemd 日志
  ssh -G <host-alias>                   查看 config 中别名的生效配置
  ssh -E /tmp/ssh.log -v user@host      将调试信息写入文件
  ssh-keygen -R <hostname>             从 known_hosts 删除主机条目
  ssh-keygen -F <hostname>             在 known_hosts 中查找主机
```

### 6.3 推荐阅读路径

- **`man ssh`** — SSH 客户端手册。最权威的参考资料，包含所有参数和配置项。重点关注 `SSH-BASED VIRTUAL PRIVATE NETWORKS` 章节了解 SSH VPN
- **`man ssh_config`** — `~/.ssh/config` 的完整配置项文档。关键词：`ControlMaster`（连接复用）、`ProxyJump`（跳板机）、`CanonicalizeHostname`
- **`man sshd_config`** — SSH 服务器端所有配置项。任何安全加固决策前都应先查阅
- **`man ssh-keygen`** — 密钥管理完整文档。关注 `CERTIFICATES` 章节了解 SSH 证书认证
- **[OpenSSH Cookbook](https://en.wikibooks.org/wiki/OpenSSH/Cookbook)** — Wikibooks 上的 OpenSSH 实战手册，覆盖从基础到高级的各种场景
- **[Mozilla SSH Guidelines](https://infosec.mozilla.org/guidelines/openssh)** — Mozilla 的 OpenSSH 安全配置指南，提供经过审计的 sshd_config 安全配置模板，可实际用于生产环境
- **SSH Mastery (Michael W. Lucas)** — ISBN: 978-1642350029。一本专讲 SSH 的书——从协议原理到实际运维，深入程度超过任何通用 Linux 教材
- **`man tmux`** — 终端复用器手册。tmux 是 SSH 工作流的天然伴侣——它们各自解决不同的问题，但组合使用是 Linux 远程管理的标准实践

---

*本章完成于 2026 年 7 月。祝你在远程管理的世界里游刃有余——SSH 是你伸向每一台服务器的"手"，掌握它，你就真正掌控了整个网络。*
