# 第 40 章 容器基础（Docker）

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

### 1.1 从"装系统"到"跑容器"

前几章你学会了用 SSH 管理远程服务器、用 ufw/iptables 守护网络安全。现在，你的服务器已经安全就绪——接下来要解决的问题是：

- "我开发了一个 Python Web 应用，怎么确保它在服务器上运行的结果和我的笔记本上一模一样？"
- "服务器上已经装了 Python 3.12，但我这个旧项目需要 Python 3.9——装两个版本不会冲突吗？"
- "部署一个应用要装 Nginx、MySQL、Redis、Node.js——每次重装系统都要重新配一遍，有没有更快的方式？"
- "虚拟机（Virtual Machine）太重了——能不能只隔离应用，不隔离整个操作系统？"
- "微服务时代，一个系统有十几个服务，每个都要独立部署、独立扩缩容——怎么高效编排？"

这些问题的答案指向同一个技术：**容器（Container）**。而 Docker 是目前最广泛使用的容器引擎（Container Engine）。

### 1.2 本章在课程中的位置

```
+==================================================================+
|              Phase 6：容器与云原生 —— 从传统部署到现代架构            |
|                                                                  |
|  第 40 章：容器基础（Docker）  ← 你在这一章                          |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  docker run/ps/images/build/compose, Dockerfile, Compose     │ |
|  │  视角：理解容器本质——"轻量级隔离" vs "虚拟机"的区别           │ |
|  └──────────────────────────────────────────────────────────────┘ |
+==================================================================+
```

**本章的核心使命：建立容器的思维模型。** 容器不是"轻量级虚拟机"，而是一个被 Namespace 和 Cgroup 隔离的进程。理解了这一点，Docker 的一切操作都会变得清晰。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **镜像管理** | `docker pull`, `docker images`, `docker rmi`, `docker tag`, `docker save`, `docker load`, `docker push` | 获取、查看、删除、标记、导出和推送镜像 |
| **容器管理** | `docker run`, `docker ps`, `docker rm`, `docker logs`, `docker exec`, `docker inspect` | 运行、查看、删除容器，查看日志，进入容器，查看详情 |
| **镜像构建** | `docker build`, `Dockerfile` | 从 Dockerfile 构建自定义镜像 |
| **编排** | `docker compose`, `docker-compose.yml` | 用 YAML 文件定义和运行多容器应用 |
| **资源管理** | `docker network`, `docker volume` | 管理容器网络和数据卷 |
| **核心概念** | 镜像（Image）、容器（Container）、层（Layer）、仓库（Registry） | Docker 的四大基石 |

### 1.4 本章目标

完成本章后，你将能够：

- 理解容器与虚拟机（Virtual Machine, VM）的本质区别——进程级隔离 vs 操作系统级隔离
- 使用 `docker run` 的 20+ 核心参数运行容器，理解 `-d`（后台）、`-p`（端口映射）、`-v`（卷挂载）、`-e`（环境变量）、`--name`（命名）、`--rm`（退出即删）、`--restart`（重启策略）的含义
- 编写一个完整的多阶段 Dockerfile，包含 FROM、RUN、COPY、CMD、ENTRYPOINT、ENV、EXPOSE、WORKDIR、ARG、HEALTHCHECK 指令
- 使用 `docker build` 构建镜像，理解构建缓存（Build Cache）和层复用（Layer Reuse）原理
- 使用 `docker compose` 编排多容器应用（Web + 数据库 + 缓存），理解 services、volumes、networks、ports、environment、depends_on 等配置项
- 使用 `docker exec` 进入运行中的容器调试，使用 `docker logs` 查看容器日志
- 使用 `docker network` 创建自定义网络，使用 `docker volume` 管理持久化数据
- 使用 `docker save`/`docker load` 离线传输镜像，使用 `docker tag`/`docker push` 推送镜像到仓库

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS，使用 Docker Engine 26.x（Ubuntu 24.04 apt 源默认版本）。请在开始前完成以下准备：

```bash
# 1. 确认 Ubuntu 版本
lsb_release -a
# 输出示例：
# Distributor ID: Ubuntu
# Description:    Ubuntu 24.04 LTS
# Release:        24.04
# Codename:       noble

# 2. 安装 Docker Engine（如果尚未安装）
sudo apt update
sudo apt install -y docker.io docker-compose-v2
# Ubuntu 24.04 中 docker.io 包即为 Docker Engine
# docker-compose-v2 是 Docker Compose V2（独立二进制插件）

# 3. 将当前用户加入 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER
# ⚠ 需要重新登录（logout/login）才能生效
# 或者临时测试时使用 newgrp：
newgrp docker

# 4. 验证安装
docker --version
# 输出示例：
# Docker version 26.1.3, build b72abbb

docker compose version
# 输出示例：
# Docker Compose version v2.27.0

# 5. 启动 Docker 服务
sudo systemctl enable docker --now
sudo systemctl status docker
# 输出示例：
# Active: active (running)

# 6. 验证 Docker 可以正常运行
docker run --rm hello-world
# 输出 Hello from Docker! 及一段说明文字

# 7. 创建练习目录
mkdir -p ~/docker-lesson40
cd ~/docker-lesson40
```

**说明：** 本章所有命令在单台 Ubuntu 24.04 机器上即可完成。部分示例需要从 Docker Hub 拉取镜像，确保机器可以访问互联网。

---

## 2. 核心概念

### 2.1 容器与虚拟机的本质区别

理解容器和虚拟机的区别是本章最重要的理论基础。一句话概括：**虚拟机虚拟硬件，容器虚拟操作系统。**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    虚拟机（Virtual Machine）                          │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                       │
│  │  App A    │  │  App B    │  │  App C    │  ← 应用程序             │
│  ├───────────┤  ├───────────┤  ├───────────┤                       │
│  │Bin/Libs   │  │Bin/Libs   │  │Bin/Libs   │  ← 依赖库              │
│  ├───────────┤  ├───────────┤  ├───────────┤                       │
│  │Guest OS   │  │Guest OS   │  │Guest OS   │  ← 完整的客户操作系统   │
│  │(Ubuntu)   │  │(CentOS)   │  │(Windows)  │    每个 VM 一个内核     │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                       │
│        │              │              │                              │
│  ┌─────┴──────────────┴──────────────┴─────┐                        │
│  │         Hypervisor (KVM/VirtualBox)     │  ← 虚拟机管理器         │
│  └────────────────────┬────────────────────┘                        │
│                       │                                            │
│  ┌────────────────────┴────────────────────┐                        │
│  │            Host OS (Ubuntu)             │  ← 宿主机操作系统       │
│  └────────────────────┬────────────────────┘                        │
│                       │                                            │
│  ┌────────────────────┴────────────────────┐                        │
│  │          Physical Hardware              │  ← 物理硬件            │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
│  特点：每个 VM 有自己的内核、独立的操作系统、完全隔离、启动慢（分钟级）│
│       资源开销大——每个 VM 至少占用几百 MB 内存   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    容器（Container）                                 │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                       │
│  │  App A    │  │  App B    │  │  App C    │  ← 应用程序             │
│  ├───────────┤  ├───────────┤  ├───────────┤                       │
│  │Bin/Libs   │  │Bin/Libs   │  │Bin/Libs   │  ← 依赖库（每个容器独立）│
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                       │
│        │              │              │                              │
│  ┌─────┴──────────────┴──────────────┴─────┐                        │
│  │          Docker Engine                 │  ← 容器引擎             │
│  └────────────────────┬────────────────────┘                        │
│                       │                                            │
│  ┌────────────────────┴────────────────────┐                        │
│  │         Host OS Kernel (共享)           │  ← 所有容器共享内核     │
│  └────────────────────┬────────────────────┘                        │
│                       │                                            │
│  ┌────────────────────┴────────────────────┐                        │
│  │          Physical Hardware              │  ← 物理硬件            │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
│  特点：所有容器共享宿主机内核、仅隔离进程/网络/文件系统、启动快（秒级）│
│       资源开销小——一个容器只需几 MB 内存                               │
└─────────────────────────────────────────────────────────────────────┘
```

**容器 vs 虚拟机对比表：**

| 维度 | 虚拟机（VM） | 容器（Container） |
|------|-------------|-------------------|
| **隔离级别** | 操作系统级——每个 VM 有独立内核 | 进程级——共享宿主机内核 |
| **启动速度** | 分钟级（需要启动 OS） | 秒级（只启动进程） |
| **内存开销** | 每个 VM 数百 MB ~ 数 GB | 每个容器数 MB ~ 数十 MB |
| **磁盘占用** | 每个 VM 数个 GB（完整 OS 镜像） | 每个容器镜像数十 MB ~ 数百 MB |
| **移植性** | 依赖 Hypervisor 类型 | 只要 Docker Engine 一致，到处都能跑 |
| **安全隔离** | 强——内核级隔离 | 较弱——共享内核（需配合 seccomp/AppArmor 加固） |
| **适用场景** | 运行不同 OS、需要强隔离、传统应用 | 微服务、CI/CD、开发环境、云原生应用 |
| **代表性技术** | KVM, VirtualBox, VMware, Hyper-V | Docker, containerd, Podman, CRI-O |

**关键认知：** 容器不是"轻量级虚拟机"，而是**被 Linux Namespace（命名空间）和 Cgroup（控制组）限制的进程**。Docker 做的事情本质上是：
1. 用 Namespace 让进程只能看到属于自己的 PID、网络、文件系统等——实现隔离
2. 用 Cgroup 限制进程能使用的 CPU、内存、磁盘 I/O——实现资源限制
3. 用 UnionFS（联合文件系统，如 overlay2）把多个只读的镜像层叠起来，再在上面加一个可写层——实现镜像复用

### 2.2 Docker 的四大核心对象

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Docker 的四大核心对象                              │
│                                                                     │
│  1. 镜像（Image）                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • 容器的"模板"——一个只读的文件系统快照                            ││
│  │ • 由多个只读层（Layer）叠加组成，每层代表一次文件系统变更         ││
│  │ • 存储在 Registry（仓库）中，如 Docker Hub                       ││
│  │ • 类比：面向对象编程中的"类"（Class）                            ││
│  │ • 命名格式：仓库名[:标签]，如 ubuntu:24.04, nginx:latest         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                       docker run / docker create                     │
│                              ▼                                       │
│  2. 容器（Container）                                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • 镜像的运行实例——在镜像的只读层之上加上一个可读写层              ││
│  │ • 容器停止后，可读写层的数据仍然保留（除非使用 --rm 删除）        ││
│  │ • 容器可以被启动、停止、删除、暂停、重启                          ││
│  │ • 类比：面向对象编程中的"实例"（Instance）                       ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  3. 仓库（Registry）                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • 存储和分发镜像的服务器                                          ││
│  │ • 默认 Registry：Docker Hub（hub.docker.com）                     ││
│  │ • 操作：docker pull（下载）、docker push（上传）                  ││
│  │ • 类比：GitHub——存代码的地方；Registry——存镜像的地方              ││
│  │ • 私有 Registry：阿里云 ACR、Harbor、AWS ECR、自建 Registry      ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  4. 卷（Volume）和网络（Network）                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ • Volume：持久化存储——容器删了数据还在                            ││
│  │ • Network：容器间通信——让多个容器组成一个"虚拟局域网"            ││
│  │ • 类比：Volume 是"外接硬盘"，Network 是"交换机和网线"            ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 镜像分层（Layer）原理

Docker 镜像为什么能快速构建、轻量传输？核心秘密在于**分层复用（Layered Architecture）**。

```
┌─────────────────────────────────────────────────────────────────────┐
│                    镜像分层结构（以 nginx 为例）                       │
│                                                                     │
│  ┌──────────────────────────┐                                       │
│  │  可写容器层（Container Layer）  │  ← 容器运行时创建，存储所有修改  │
│  │  (R/W - 读写)             │        容器删除后该层也会被删除       │
│  ├──────────────────────────┤                                       │
│  │  第 4 层：CMD ["nginx", "-g", "daemon off;"]  │  ← 启动命令       │
│  ├──────────────────────────┤                                       │
│  │  第 3 层：COPY nginx.conf /etc/nginx/  │  ← 配置文件               │
│  ├──────────────────────────┤                                       │
│  │  第 2 层：RUN apt-get install nginx    │  ← 安装软件               │
│  ├──────────────────────────┤                                       │
│  │  第 1 层：FROM ubuntu:24.04            │  ← 基础镜像              │
│  └──────────────────────────┘                                       │
│                                                                     │
│  每层都是只读的（Read-Only），层与层之间通过 UnionFS 叠加。          │
│  查看层的命令：docker history nginx:latest                           │
│                                                                     │
│  分层带来的三大好处：                                                │
│  1. 复用（Reuse）：两个镜像如果 FROM 相同的基础镜像，基础层只存一份   │
│  2. 增量构建（Incremental Build）：只重建改变的层，其他层用缓存      │
│  3. 节省带宽（Delta Transfer）：只传输缺失的层，已有层跳过           │
└─────────────────────────────────────────────────────────────────────┘
```

**构建缓存（Build Cache）机制：**

```bash
# Docker 构建镜像时，每条指令生成一个层。
# 如果某条指令和上下文都没变，Docker 直接使用缓存的层，不重新执行。
#
# Dockerfile 指令顺序的建议：
#   把"变化频率低"的指令放前面（如 apt install）
#   把"变化频率高"的指令放后面（如 COPY 源代码）
#   这样前面的层可以被缓存复用，只重建后面变化的层
#
# 好的顺序：                     差的顺序：
#   FROM ubuntu:24.04             FROM ubuntu:24.04
#   RUN apt update && apt install COPY . /app        ← 每次代码改动都
#       -y nginx python3           RUN apt update && ...  导致后续层失效
#   COPY . /app                   （同"好的顺序"）
#
# 原因：COPY . /app 每次代码改动都会变，后面的 RUN apt install 也无法复用缓存
```

### 2.4 Docker 网络模型

Docker 提供了多种网络驱动（Network Driver），满足不同的通信需求。

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Docker 网络模式                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ bridge（桥接网络）            │ 默认模式                      │    │
│  │                               │ 容器通过 docker0 虚拟网桥通信│    │
│  │ [容器A:172.17.0.2]──[docker0]──[容器B:172.17.0.3]──[容器C]  │    │
│  │ 适用：单机多容器通信          │ 通过 -p 将容器端口映射到宿主机│    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ host（主机网络）               │ 容器直接使用宿主机网络栈      │    │
│  │                               │ 没有网络隔离，性能最高        │    │
│  │ 适用：高性能场景               │ 端口直接暴露，无 -p 映射     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ none（无网络）                 │ 容器没有网络接口              │    │
│  │                               │ 只有 loopback (127.0.0.1)    │    │
│  │ 适用：安全隔离、离线计算        │                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ overlay（覆盖网络）            │ 跨多台 Docker 主机的容器通信  │    │
│  │                               │ 用于 Docker Swarm 集群       │    │
│  │ 适用：多机编排                 │ 需要 key-value store         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 自定义 bridge 网络（推荐）       │ docker network create        │    │
│  │                               │ 容器间可通过名称互相访问      │    │
│  │ 适用：docker compose 项目      │ 内置 DNS 解析                │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.5 Docker 数据管理：卷（Volume）vs 绑定挂载（Bind Mount）

容器的文件系统是临时的——容器删除后，其内部写入的数据也会丢失。Docker 提供两种持久化数据的方式：

| 特性 | Volume（卷） | Bind Mount（绑定挂载） |
|------|-------------|----------------------|
| **管理方式** | Docker 管理（`docker volume create`） | 宿主机路径（`/host/path:/container/path`） |
| **存储位置** | `/var/lib/docker/volumes/` | 用户指定的任何宿主机路径 |
| **创建方式** | `docker volume create` 或 Compose 自动创建 | 在 `docker run -v` 中显式指定 |
| **备份** | 需要 `docker run --rm -v vol:/data ... tar` | 直接备份宿主机目录 |
| **适用场景** | 数据库数据、持久化应用数据 | 开发环境代码热更新、配置文件注入 |
| **推荐程度** | **生产环境推荐** | 开发环境常用 |

```
┌─────────────────────────────────────────────────────────────────────┐
│  Volume（卷）：                                                      │
│  docker run -v myvolume:/app/data nginx                             │
│       │          │                                                   │
│       │          └─ 容器内路径                                       │
│       └─ Docker Volume 名称（存储在 /var/lib/docker/volumes/）       │
│                                                                     │
│  Bind Mount（绑定挂载）：                                            │
│  docker run -v /home/user/code:/app nginx                           │
│       │                │                                             │
│       │                └─ 容器内路径                                 │
│       └─ 宿主机绝对路径（必须从 / 开始）                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 命令详解

### 3.1 docker pull —— 拉取镜像

`docker pull` 从 Registry（默认为 Docker Hub）下载镜像到本地。

**基本语法：**

```
docker pull [选项] 镜像名[:标签]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `镜像名[:标签]` | 要拉取的镜像名，标签可选 | 必选 | `:latest`（如果未指定标签） |
| `--platform` | 指定架构（如 linux/amd64, linux/arm64） | 可选 | 当前系统架构 |
| `--all-tags` / `-a` | 拉取所有标签的镜像 | 可选 | 仅指定标签 |
| `--quiet` / `-q` | 安静模式，只输出镜像 digest | 可选 | 否 |

**实战：**

```bash
# 1. 拉取最新版 Ubuntu 镜像
docker pull ubuntu:24.04
# 输出示例：
# 24.04: Pulling from library/ubuntu
# Digest: sha256:...
# Status: Downloaded newer image for ubuntu:24.04
# docker.io/library/ubuntu:24.04

# 2. 不指定标签——默认拉取 :latest
docker pull nginx
# 等价于：docker pull nginx:latest
# 等价于：docker pull docker.io/library/nginx:latest

# 3. 拉取指定平台（如在 ARM 机器上拉取 AMD64 镜像）
docker pull --platform linux/amd64 nginx:latest

# 4. 拉取 Alpine 版本（体积更小，通常只有 5MB 左右）
docker pull nginx:alpine
# Alpine Linux 是一个极简 Linux 发行版，基于 musl libc 和 BusyBox

# 5. 从私有 Registry 拉取
# docker pull myregistry.example.com:5000/myapp:v1.0
```

**镜像命名规范解析：**

```
docker pull docker.io/library/nginx:1.25-alpine
            │           │       │      │
            │           │       │      └─ 标签（Tag）
            │           │       └─ 镜像名（Repository Name）
            │           └─ 命名空间（Namespace）——library 表示 Docker 官方镜像
            └─ Registry 主机名——docker.io = Docker Hub
```

### 3.2 docker images —— 查看本地镜像

`docker images` 列出本地已下载的所有镜像。

**基本语法：**

```
docker images [选项] [镜像名[:标签]]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `镜像名[:标签]` | 过滤特定镜像 | 可选 | 列出全部 |
| `--all` / `-a` | 显示所有（包括中间层镜像） | 可选 | 仅显示顶层镜像 |
| `--quiet` / `-q` | 只显示镜像 ID | 可选 | 否 |
| `--digests` | 显示镜像的 digest（内容哈希） | 可选 | 否 |
| `--filter` / `-f` | 按条件过滤（如 `dangling=true` 列出悬空镜像） | 可选 | 无 |
| `--format` | 使用 Go 模板自定义输出格式 | 可选 | 默认表格 |

**实战：**

```bash
# 确保有镜像可供查看
docker pull nginx:alpine > /dev/null 2>&1
docker pull ubuntu:24.04 > /dev/null 2>&1

# 1. 列出所有镜像
docker images
# 输出示例：
# REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
# nginx        alpine    abc123def456   2 days ago    43MB
# ubuntu       24.04     def456abc789   3 weeks ago  78MB

# 2. 只显示镜像 ID
docker images -q
# 输出示例：
# abc123def456
# def456abc789

# 3. 显示 digest（SHA256 哈希——唯一标识镜像内容）
docker images --digests nginx
# 输出示例：
# REPOSITORY   TAG      DIGEST                                                                    IMAGE ID       CREATED       SIZE
# nginx        alpine   sha256:a1b2c3d4e5f6...                                                    abc123def456   2 days ago    43MB

# 4. 过滤出悬空镜像（dangling images——没有标签的镜像层）
docker images -f "dangling=true"
# 悬空镜像通常是构建失败留下的中间层，可以清理

# 5. 自定义输出格式
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
# 输出示例：
# REPOSITORY   TAG       SIZE
# nginx        alpine    43MB
# ubuntu       24.04     78MB

# 6. 过滤特定镜像
docker images nginx
# 只显示名为 nginx 的镜像（所有标签）

docker images nginx:alpine
# 只显示 nginx:alpine
```

### 3.3 docker rmi —— 删除镜像

`docker rmi` 删除本地镜像。注意：如果有容器正在使用该镜像，删除会失败。

**基本语法：**

```
docker rmi [选项] 镜像ID|镜像名[:标签]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `镜像ID|镜像名` | 要删除的镜像（可同时指定多个） | 必选 | — |
| `--force` / `-f` | 强制删除（即使有容器正在使用） | 可选 | 否 |
| `--no-prune` | 不删除未打标签的父镜像层 | 可选 | 会同时清理 |

**实战：**

```bash
# 先拉一个测试镜像
docker pull busybox:latest > /dev/null 2>&1

# 1. 用镜像名+标签删除
docker rmi busybox:latest
# 输出示例：
# Untagged: busybox:latest
# Deleted: sha256:...

# 2. 用镜像 ID 删除（可简写前几位，只要唯一即可）
# docker rmi abc123de

# 3. 强制删除（即使有容器在使用）
# docker rmi -f nginx:latest

# 4. 一次性删除多个镜像
# docker rmi nginx:alpine ubuntu:24.04

# 5. 清理所有未使用的镜像（推荐用这个而非 rmi 逐个删）
# docker image prune -a
# -a：删除所有未使用的镜像（不只是悬空镜像）
```

### 3.4 docker run —— 运行容器

`docker run` 是 Docker 最核心的命令。它从镜像创建一个新容器并启动它。`docker run` = `docker create` + `docker start`。

**基本语法：**

```
docker run [选项] 镜像名[:标签] [命令] [参数...]
```

**核心参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `--name <名称>` | 为容器指定一个名称（否则 Docker 随机生成） | 可选 | 随机名称如 `brave_curie` |
| `--detach` / `-d` | 后台运行容器（不会挂住终端） | 可选 | 前台运行 |
| `--interactive` / `-i` | 保持 STDIN 打开（交互模式的前提） | 可选 | 否 |
| `--tty` / `-t` | 分配一个伪终端（配合 `-i` 实现交互式 Shell） | 可选 | 否 |
| `--publish` / `-p <宿主机端口>:<容器端口>` | 端口映射——将容器端口映射到宿主机 | 可选 | 无映射 |
| `-p <宿主机IP>:<宿主机端口>:<容器端口>` | 绑定到指定宿主机 IP | 可选 | 0.0.0.0（所有 IP） |
| `--volume` / `-v <宿主机>:<容器>` | Bind Mount——挂载宿主机目录到容器 | 可选 | 无挂载 |
| `--volume` / `-v <卷名>:<容器>` | Volume——挂载命名卷到容器 | 可选 | 无挂载 |
| `--env` / `-e <KEY=VALUE>` | 设置环境变量 | 可选 | 无 |
| `--env-file <文件>` | 从文件读取环境变量（每行 KEY=VALUE） | 可选 | 无 |
| `--rm` | 容器退出后自动删除容器（开发测试常用） | 可选 | 退出后容器保留 |
| `--restart <策略>` | 容器退出后的重启策略 | 可选 | `no`（不重启） |
| `--network <网络名>` | 指定容器使用的网络 | 可选 | `bridge`（默认桥接网络） |
| `--hostname <主机名>` | 设置容器的主机名 | 可选 | 容器 ID 前 12 位 |
| `--workdir` / `-w <路径>` | 设置容器内的工作目录 | 可选 | `/` 或镜像定义的 WORKDIR |
| `--user` / `-u <用户>` | 以指定用户（ID 或用户名）运行容器 | 可选 | 镜像定义的用户或 root |
| `--entrypoint <命令>` | 覆盖镜像默认的 ENTRYPOINT | 可选 | 镜像定义的 ENTRYPOINT |
| `--memory` / `-m` | 限制容器内存使用（如 `256m`, `1g`） | 可选 | 无限制 |
| `--cpus` | 限制容器 CPU 使用（如 `1.5` 表示 1.5 核） | 可选 | 无限制 |
| `--expose` | 暴露端口（不映射到宿主机，仅用于内部网络） | 可选 | 无 |
| `--dns` | 设置容器的 DNS 服务器 | 可选 | 宿主机 DNS |
| `--add-host <主机名>:<IP>` | 添加一条 hosts 记录到容器内 `/etc/hosts` | 可选 | 无 |

**`--restart` 策略值：**

| 策略值 | 说明 |
|--------|------|
| `no` | 默认——容器退出后不自动重启 |
| `always` | 无论以什么退出码退出，都自动重启（Docker 启动时也会拉起来） |
| `unless-stopped` | 同 always，但如果手动 `docker stop` 后，Docker 重启时不会自动启动 |
| `on-failure[:最大次数]` | 仅在退出码非 0 时重启，可指定最大重启次数（如 `on-failure:5`） |

**实战：**

```bash
# ========== 基本运行 ==========

# 1. 最简单的运行——输出后退出
docker run --rm ubuntu:24.04 echo "Hello from Docker container!"
# 输出：Hello from Docker container!
# --rm：容器退出后自动删除——测试时非常实用

# 2. 运行交互式 Shell
docker run -it --rm ubuntu:24.04 bash
# -i：保持 stdin 打开（interactive）
# -t：分配伪终端（TTY）
# 在容器内：
#   root@abc123def456:/# cat /etc/os-release
#   root@abc123def456:/# whoami
#   root@abc123def456:/# exit
# 退出后容器自动删除

# ========== 后台运行 ==========

# 3. 后台运行 Nginx（-d 模式）
docker run -d --name my-nginx -p 8080:80 nginx:alpine
# -d：后台运行（detached mode）
# --name my-nginx：给容器起名
# -p 8080:80：宿主机 8080 端口 → 容器 80 端口

# 4. 验证 Nginx 是否正常运行
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
# 输出：200（表示 Nginx 正常响应）

curl -s http://localhost:8080 | head -5
# 可以看到 Nginx 的默认欢迎页面

# ========== 环境变量 ==========

# 5. 通过 -e 传递环境变量
docker run --rm -e MY_NAME="Docker User" ubuntu:24.04 bash -c 'echo "Hello, $MY_NAME"'
# 输出：Hello, Docker User

# 6. 通过 --env-file 批量设置
cat > /tmp/env-file.txt << 'EOF'
DB_HOST=mysql
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=s3cret
EOF
docker run --rm --env-file /tmp/env-file.txt ubuntu:24.04 \
    bash -c 'echo "DB_HOST=$DB_HOST, DB_PORT=$DB_PORT, DB_USER=$DB_USER"'
# 输出：DB_HOST=mysql, DB_PORT=3306, DB_USER=appuser

# ========== 资源限制 ==========

# 7. 限制内存和 CPU
docker run --rm -m 128m --cpus 0.5 ubuntu:24.04 bash -c 'echo "Memory limited to 128MB, CPU to 0.5 core"'
# -m 128m：最多使用 128MB 内存
# --cpus 0.5：最多使用半个 CPU 核心

# ========== 重启策略 ==========

# 8. 使用重启策略
docker run -d --name restart-test --restart unless-stopped nginx:alpine
# 容器退出后会自动重启（除非手动 docker stop）
# 验证重启策略：
docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' restart-test
# 输出：unless-stopped

# ========== 端口映射详解 ==========

# 9. 绑定到宿主机特定 IP
# docker run -d -p 127.0.0.1:8080:80 nginx:alpine
# 只有从 127.0.0.1:8080 才能访问，其他人无法访问

# 10. 随机端口映射——让 Docker 自己选择宿主机端口
# docker run -d -P nginx:alpine
# -P（大写）：将 Dockerfile 中 EXPOSE 声明的端口映射到宿主机随机端口
# 查看实际映射的端口：docker port <容器名>

# 清理测试容器
docker rm -f my-nginx restart-test 2>/dev/null
```

### 3.5 docker ps —— 查看容器

`docker ps` 列出容器。默认只显示运行中的容器。

**基本语法：**

```
docker ps [选项]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `--all` / `-a` | 显示所有容器（包括已停止的） | 可选 | 仅运行中 |
| `--quiet` / `-q` | 只显示容器 ID | 可选 | 否 |
| `--latest` / `-l` | 只显示最近创建的容器 | 可选 | 否 |
| `--no-trunc` | 不截断输出（显示完整的命令和 ID） | 可选 | 输出被截断 |
| `--size` / `-s` | 显示容器文件大小 | 可选 | 否 |
| `--filter` / `-f` | 按条件过滤（status, name, ancestor 等） | 可选 | 无 |
| `--format` | 使用 Go 模板自定义输出 | 可选 | 默认表格 |

**实战：**

```bash
# 创建测试容器
docker run -d --name ps-test-1 nginx:alpine 2>/dev/null
docker run -d --name ps-test-2 ubuntu:24.04 sleep 300 2>/dev/null
docker run --rm --name ps-test-3 ubuntu:24.04 echo "done" 2>/dev/null  # 已退出并删除

# 1. 查看运行中的容器
docker ps
# 输出示例：
# CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES
# abc123def456   ubuntu:24.04   "sleep 300"              5 seconds ago   Up 5 seconds             ps-test-2
# def456abc789   nginx:alpine   "/docker-entrypoint.…"   10 seconds ago  Up 10 seconds   80/tcp    ps-test-1

# 2. 查看所有容器（包括已停止的）
docker ps -a
# 会看到 STATUS=Exited 的容器——它们虽然退出了，但如果没有 --rm 仍然存在

# 3. 只显示容器 ID——适合脚本处理
docker ps -q
# 输出：
# abc123def456
# def456abc789

# 4. 按条件过滤
docker ps -a -f "status=exited"
# 只显示已退出的容器

docker ps -f "name=ps-test"
# 按名称过滤（前缀匹配）

docker ps -f "ancestor=nginx:alpine"
# 按镜像过滤

# 5. 自定义输出格式
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
# 输出示例：
# NAMES        IMAGE          STATUS         PORTS
# ps-test-2    ubuntu:24.04   Up 2 minutes
# ps-test-1    nginx:alpine   Up 2 minutes   80/tcp

# 6. 显示完整命令（不截断）
docker ps --no-trunc
# COMMAND 列会显示完整命令而非被截断的版本

# 7. 显示容器磁盘大小
docker ps -s
# SIZE 列会显示容器可写层的实际大小

# 清理
docker rm -f ps-test-1 ps-test-2 2>/dev/null
```

### 3.6 docker logs —— 查看容器日志

`docker logs` 获取容器的标准输出（stdout）和标准错误（stderr）日志。

**基本语法：**

```
docker logs [选项] 容器名|容器ID
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `容器名|容器ID` | 要查看日志的容器 | 必选 | — |
| `--follow` / `-f` | 持续跟踪日志输出（类似 `tail -f`） | 可选 | 否 |
| `--tail <行数>` | 只显示最后 N 行 | 可选 | `all`（全部） |
| `--since <时间>` | 显示某个时间之后的日志（如 `10m`=10分钟前, `2024-01-01`） | 可选 | 从最早开始 |
| `--until <时间>` | 显示某个时间之前的日志 | 可选 | 到现在为止 |
| `--timestamps` / `-t` | 显示时间戳 | 可选 | 否 |

**实战：**

```bash
# 1. 启动一个持续输出日志的容器
docker run -d --name log-test ubuntu:24.04 bash -c 'for i in $(seq 1 20); do echo "Log line $i - $(date)"; sleep 1; done'
# 等待几秒让日志生成
sleep 5

# 2. 查看日志
docker logs log-test
# 输出示例：
# Log line 1 - Wed Jul 31 10:00:01 UTC 2024
# Log line 2 - Wed Jul 31 10:00:02 UTC 2024
# Log line 3 - Wed Jul 31 10:00:03 UTC 2024
# ...

# 3. 查看最后 5 行
docker logs --tail 5 log-test
# 输出最后 5 行日志

# 4. 查看最近 10 秒的日志
docker logs --since 10s log-test

# 5. 带时间戳的日志
docker logs -t log-test
# 每行前面会显示时间戳

# 6. 持续跟踪（-f 模式）——按 Ctrl+C 退出
# docker logs -f log-test

# 清理
docker rm -f log-test 2>/dev/null
```

**日志驱动（Log Driver）说明：** Docker 默认使用 `json-file` 日志驱动，日志存储在 `/var/lib/docker/containers/<container-id>/<container-id>-json.log`。生产环境中建议配置日志轮转（log rotation），避免日志文件撑满磁盘。

### 3.7 docker exec —— 在运行中的容器里执行命令

`docker exec` 在已经运行的容器内启动一个新的进程。这是调试容器的核心命令。

**基本语法：**

```
docker exec [选项] 容器名|容器ID 命令 [参数...]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `容器名|容器ID` | 目标容器 | 必选 | — |
| `命令 [参数...]` | 要在容器内执行的命令 | 必选 | — |
| `--interactive` / `-i` | 保持 STDIN 打开 | 可选 | 否 |
| `--tty` / `-t` | 分配伪终端 | 可选 | 否 |
| `--detach` / `-d` | 后台运行命令 | 可选 | 前台 |
| `--env` / `-e <KEY=VALUE>` | 设置环境变量 | 可选 | 无 |
| `--workdir` / `-w <路径>` | 设置工作目录 | 可选 | root 目录 |
| `--user` / `-u <用户>` | 以指定用户身份执行 | 可选 | root |
| `--privileged` | 给进程扩展权限（慎用） | 可选 | 否 |

**实战：**

```bash
# 启动一个后台容器
docker run -d --name exec-test nginx:alpine

# 1. 在容器中执行单条命令
docker exec exec-test cat /etc/nginx/conf.d/default.conf
# 输出 Nginx 默认配置文件内容

# 2. 执行多条命令
docker exec exec-test sh -c 'echo "Hostname: $(hostname)"; echo "OS: $(cat /etc/os-release | head -1)"'
# 输出容器的主机名和 OS 信息

# 3. 进入交互式 Shell——调试容器时的标配操作
docker exec -it exec-test sh
# 进入后：
# / # ls /
# / # ps aux
# / # cat /etc/nginx/nginx.conf
# / # exit
# 注意：Alpine 镜像没有 bash，只有 sh。

# 4. 以特定用户执行
docker exec -u nobody exec-test whoami
# 输出：nobody

# 5. 在后台执行命令
docker exec -d exec-test nginx -s reload
# -d：后台执行，不阻塞终端

# 清理
docker rm -f exec-test 2>/dev/null
```

**docker exec vs docker attach：**

| 操作 | 命令 | 说明 |
|------|------|------|
| 进入运行中的容器并启动新进程 | `docker exec -it 容器名 bash` | **推荐**——新进程，退出不影响容器主进程 |
| 连接到容器主进程的 STDIN/STDOUT | `docker attach 容器名` | 连接到 PID 1 的进程——退出会停止容器 |

### 3.8 docker inspect —— 查看容器/镜像详细信息

`docker inspect` 返回 Docker 对象（容器、镜像、卷、网络）的底层元数据（JSON 格式）。

**基本语法：**

```
docker inspect [选项] 对象名|对象ID...
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `对象名|对象ID` | 要查看的容器、镜像、卷或网络 | 必选 | — |
| `--format` / `-f` | 使用 Go 模板提取特定字段 | 可选 | 完整 JSON |
| `--size` / `-s` | 显示文件大小（仅容器） | 可选 | 否 |

**实战：**

```bash
# 启动一个容器
docker run -d --name inspect-test -p 8080:80 nginx:alpine

# 1. 查看容器的完整 JSON（输出非常多）
docker inspect inspect-test | head -30
# 输出一个巨大的 JSON 对象

# 2. 提取特定字段——IP 地址
docker inspect --format '{{.NetworkSettings.IPAddress}}' inspect-test
# 输出示例：172.17.0.2

# 3. 提取多个字段
docker inspect --format '容器名: {{.Name}}  镜像: {{.Config.Image}}  状态: {{.State.Status}}' inspect-test
# 输出示例：容器名: /inspect-test  镜像: nginx:alpine  状态: running

# 4. 查看端口映射
docker inspect --format '{{json .NetworkSettings.Ports}}' inspect-test | python3 -m json.tool 2>/dev/null || \
    docker inspect --format '{{.NetworkSettings.Ports}}' inspect-test
# 可以看到 80/tcp 端口映射到了宿主机的 8080

# 5. 查看容器的环境变量
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' inspect-test
# 输出容器内的所有环境变量（NGINX_VERSION, PATH 等）

# 6. 查看挂载卷
docker inspect --format '{{json .Mounts}}' inspect-test | python3 -m json.tool 2>/dev/null || \
    docker inspect --format '{{.Mounts}}' inspect-test

# 7. 查看重启策略
docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' inspect-test
# 输出：no

# 8. 查看容器资源限制
docker inspect --format '内存限制: {{.HostConfig.Memory}}  CPU限制: {{.HostConfig.NanoCpus}}' inspect-test
# 输出示例：内存限制: 0  CPU限制: 0  （0 表示无限制）

# 9. 查看镜像的 inspect
docker inspect nginx:alpine | python3 -m json.tool 2>/dev/null | head -30
# 可以看到镜像的 Env、ExposedPorts、Cmd 等元数据

# 清理
docker rm -f inspect-test 2>/dev/null
```

**常用 `--format` Go 模板速查：**

| 查询内容 | `--format` 模板 |
|---------|----------------|
| 容器 IP 地址 | `{{.NetworkSettings.IPAddress}}` |
| 容器状态 | `{{.State.Status}}` |
| 容器启动时间 | `{{.State.StartedAt}}` |
| 端口映射 | `{{json .NetworkSettings.Ports}}` |
| 环境变量 | `{{range .Config.Env}}{{println .}}{{end}}` |
| 重启策略 | `{{.HostConfig.RestartPolicy.Name}}` |
| 镜像创建时间 | `{{.Created}}` |
| 镜像暴露端口 | `{{json .Config.ExposedPorts}}` |

### 3.9 docker rm —— 删除容器

`docker rm` 删除已停止的容器。运行中的容器需要先用 `-f` 强制删除，或先 `docker stop`。

**基本语法：**

```
docker rm [选项] 容器名|容器ID...
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `容器名|容器ID` | 要删除的容器 | 必选 | — |
| `--force` / `-f` | 强制删除运行中的容器 | 可选 | 否 |
| `--volumes` / `-v` | 同时删除容器的匿名卷（未命名卷） | 可选 | 否 |

**实战：**

```bash
# 1. 启动测试容器
docker run -d --name rm-test nginx:alpine

# 2. 停止并删除
docker stop rm-test && docker rm rm-test
# 输出：rm-test

# 3. 强制删除运行中的容器（无需先 stop）
docker run -d --name rm-test-2 nginx:alpine
docker rm -f rm-test-2
# -f 先 SIGKILL 再删除

# 4. 删除所有已停止的容器（清理利器）
docker container prune -f
# 等价于：docker rm $(docker ps -aq -f status=exited)

# 5. 批量删除所有容器（包括运行中的）
# docker rm -f $(docker ps -aq)
# ⚠ 危险！会删除所有容器

# 6. 删除容器时同时删除匿名卷
# docker rm -v 容器名
```

### 3.10 docker build —— 构建镜像

`docker build` 从 Dockerfile 和构建上下文（Build Context）构建镜像。

**基本语法：**

```
docker build [选项] 路径|URL|-
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `路径|URL|-` | 构建上下文路径（通常是包含 Dockerfile 的目录） | 必选 | — |
| `--tag` / `-t <名称:标签>` | 为镜像命名和打标签（可多次使用） | 可选 | 无标签 |
| `--file` / `-f <Dockerfile路径>` | 指定 Dockerfile 路径（若不在上下文目录下） | 可选 | `PATH/Dockerfile` |
| `--build-arg <KEY=VALUE>` | 传递构建参数（覆盖 Dockerfile 中 ARG 的默认值） | 可选 | ARG 的默认值 |
| `--no-cache` | 不使用构建缓存——全部从头构建 | 可选 | 使用缓存 |
| `--pull` | 尝试拉取 FROM 镜像的最新版本 | 可选 | 使用本地版本 |
| `--target <阶段名>` | 多阶段构建时只构建到指定阶段 | 可选 | 构建全部阶段 |
| `--platform` | 指定目标平台（如 linux/amd64, linux/arm64） | 可选 | 当前系统架构 |

**实战——先看 Dockerfile 写法，再构建：**

#### 3.10.1 Dockerfile 指令详解

Dockerfile 是一个文本文件，包含构建镜像所需的所有指令。下面逐一详解每条核心指令。

| 指令 | 说明 | 格式 | 何时使用 |
|------|------|------|---------|
| `FROM` | 指定基础镜像——Dockerfile 的第一条指令 | `FROM ubuntu:24.04` 或 `FROM scratch` | **必须**——每条 Dockerfile 至少一个 FROM |
| `RUN` | 在构建时执行命令（结果固化到镜像层中） | `RUN apt update && apt install -y nginx` | 安装软件、配置系统 |
| `COPY` | 从构建上下文复制文件到镜像 | `COPY . /app` 或 `COPY --chown=user:group src dest` | 复制代码、配置文件 |
| `ADD` | 同 COPY，但支持 URL 和 tar 自动解压 | `ADD archive.tar.gz /app/` | 需要自动解压或 URL 下载时（否则优先用 COPY） |
| `CMD` | 容器启动时的默认命令（可被 `docker run` 后的命令覆盖） | `CMD ["nginx", "-g", "daemon off;"]` 或 `CMD nginx -g 'daemon off;'` | 定义容器默认行为 |
| `ENTRYPOINT` | 容器入口点——不会被 `docker run` 后的命令覆盖（作为 ENTRYPOINT 的参数） | `ENTRYPOINT ["python3", "app.py"]` | 把容器定义成一个可执行程序 |
| `ENV` | 设置环境变量（在构建和运行时均有效） | `ENV APP_HOME=/app APP_PORT=3000` | 配置应用运行环境 |
| `WORKDIR` | 设置工作目录——之后的 RUN/CMD/COPY 都以此为当前目录 | `WORKDIR /app` | 避免使用 `cd` 和绝对路径 |
| `EXPOSE` | 声明容器运行时监听的端口（仅文档作用，不实际发布端口） | `EXPOSE 80/tcp` | 告知使用者应用监听的端口 |
| `ARG` | 构建参数——仅在构建时可用，不会被固化到镜像中 | `ARG VERSION=1.0` | 构建时动态传参 |
| `VOLUME` | 创建挂载点——声明容器数据存储的位置 | `VOLUME /data` | 标识数据持久化位置 |
| `USER` | 切换运行用户 | `USER appuser` | 以非 root 用户运行——安全最佳实践 |
| `HEALTHCHECK` | 定义容器的健康检查命令 | `HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1` | 让 Docker 知道容器是否真的在正常工作 |
| `LABEL` | 添加元数据标签 | `LABEL version="1.0" maintainer="team@example.com"` | 给镜像加注释和版本信息 |

**CMD 的三种写法：**

```dockerfile
# 写法 1：exec 形式（推荐——不会启动 Shell，信号直接传递）
CMD ["executable", "param1", "param2"]

# 写法 2：Shell 形式（/bin/sh -c 启动，支持变量替换和管道）
CMD nginx -g 'daemon off;'

# 写法 3：作为 ENTRYPOINT 的默认参数
ENTRYPOINT ["python3", "app.py"]
CMD ["--port", "3000"]   # 最终执行：python3 app.py --port 3000
```

**CMD vs ENTRYPOINT：**

```
┌─────────────────────────────────────────────────────────────────────┐
│  CMD：容器默认执行的命令——可被 docker run 后的命令完全覆盖          │
│  ENTRYPOINT：容器的固定入口——docker run 后的命令作为参数追加给它    │
│                                                                     │
│  示例 1：                                                           │
│    CMD ["echo", "hello"]                                            │
│    docker run myimage               → echo hello                   │
│    docker run myimage echo world    → echo world  （CMD 被覆盖）     │
│                                                                     │
│  示例 2：                                                           │
│    ENTRYPOINT ["echo"]                                              │
│    CMD ["hello"]                                                    │
│    docker run myimage               → echo hello                   │
│    docker run myimage world         → echo world  （world 作为参数追加）│
│                                                                     │
│  最佳实践：                                                          │
│  • ENTRYPOINT 定义"这个容器是一个什么程序"                           │
│  • CMD 定义"这个程序的默认参数"                                      │
│  • 如果想让用户自定义命令，只用 CMD，不用 ENTRYPOINT                  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.10.2 完整 Dockerfile 示例

```bash
cd ~/docker-lesson40
mkdir -p dockerfile-demo
cd dockerfile-demo
```

创建一个完整的 Python Flask Web 应用 Dockerfile：

```bash
cat > Dockerfile << 'DOCKERFILE_EOF'
# ============================================================
# 完整 Dockerfile 示例 —— Python Flask Web 应用
# ============================================================

# ---- 阶段 1：构建阶段（Builder Stage） ----
FROM python:3.12-slim AS builder

# ARG：构建参数，仅在构建时有效
ARG APP_VERSION=1.0.0

# ENV：设置环境变量，构建和运行时都有效
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# WORKDIR：设置工作目录
WORKDIR /build

# COPY：复制依赖文件（先复制 requirements.txt 以便缓存）
COPY requirements.txt .

# RUN：安装依赖到隔离目录
RUN pip install --no-cache-dir --target=/build/deps -r requirements.txt

# ---- 阶段 2：运行阶段（Runtime Stage） ----
FROM python:3.12-slim

# LABEL：镜像元数据
LABEL maintainer="developer@example.com" \
      version="${APP_VERSION}" \
      description="Flask Web Application"

# 创建非 root 用户
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# ENV：运行时环境变量
ENV APP_HOME=/app \
    APP_PORT=5000

# WORKDIR：设置运行时工作目录
WORKDIR $APP_HOME

# 从构建阶段复制依赖
COPY --from=builder /build/deps /usr/local/lib/python3.12/site-packages/

# COPY：复制应用代码
COPY app.py .
COPY templates/ ./templates/

# EXPOSE：声明监听端口（仅文档作用）
EXPOSE 5000

# VOLUME：声明数据卷挂载点
VOLUME /app/data

# USER：切换到非 root 用户运行
USER appuser

# HEALTHCHECK：健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" \
    || exit 1

# ENTRYPOINT：固定入口点
ENTRYPOINT ["python", "app.py"]

# CMD：ENTRYPOINT 的默认参数
CMD ["--port", "5000", "--host", "0.0.0.0"]
DOCKERFILE_EOF

echo "Dockerfile 已创建"
```

Now create the necessary application files:

```bash
# 创建 requirements.txt
cat > requirements.txt << 'EOF'
flask==3.0.3
gunicorn==22.0.0
EOF

# 创建 Flask 应用
cat > app.py << 'PYEOF'
"""A minimal Flask application for Docker demonstration."""
import argparse
import os
import sys
from flask import Flask, jsonify, render_template_string

app = Flask(__name__)

INDEX_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Docker Demo App</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 50px auto; }
        h1 { color: #333; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Docker Flask Demo</h1>
    <div class="info">
        <p><strong>Hostname:</strong> {{ hostname }}</p>
        <p><strong>Python Version:</strong> {{ python_version }}</p>
        <p><strong>App Version:</strong> {{ app_version }}</p>
    </div>
</body>
</html>"""

@app.route("/")
def index():
    return render_template_string(
        INDEX_HTML,
        hostname=os.uname().nodename,
        python_version=sys.version.split()[0],
        app_version=os.environ.get("APP_VERSION", "dev"),
    )

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()
    app.run(host=args.host, port=args.port)
PYEOF

# 创建模板目录
mkdir -p templates

echo "应用文件已创建"
```

Now build the image:

```bash
cd ~/docker-lesson40/dockerfile-demo

# 1. 基本构建
docker build -t flask-demo:1.0 .

# 输出示例（关键阶段）：
# [+] Building 45.2s (15/15) FINISHED
#  => [builder 1/4] FROM python:3.12-slim
#  => [builder 2/4] WORKDIR /build
#  => [builder 3/4] COPY requirements.txt .
#  => [builder 4/4] RUN pip install ...
#  => [stage-1 1/8] FROM python:3.12-slim
#  => [stage-1 2/8] RUN groupadd -r appgroup && useradd ...
#  => [stage-1 3/8] WORKDIR /app
#  => [stage-1 4/8] COPY --from=builder /build/deps ...
#  => [stage-1 5/8] COPY app.py .
#  => [stage-1 6/8] COPY templates/ ./templates/
#  => exporting to image
#  => => naming to docker.io/library/flask-demo:1.0

# 2. 查看构建的镜像
docker images flask-demo
# 输出：
# REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
# flask-demo   1.0       123abc456def   10 seconds ago  140MB

# 3. 测试运行
docker run -d --name flask-test -p 5000:5000 flask-demo:1.0
sleep 3  # 等待启动
curl -s http://localhost:5000/ | grep -o "<h1>.*</h1>"
# 输出：<h1>Docker Flask Demo</h1>

curl -s http://localhost:5000/health
# 输出：{"status":"ok"}

# 4. 使用 --no-cache 强制完全重建
# docker build --no-cache -t flask-demo:1.0 .

# 5. 使用 --build-arg 传递构建参数
# docker build --build-arg APP_VERSION=2.0.0 -t flask-demo:2.0 .

# 6. 多阶段构建——只构建到 builder 阶段（调试用）
# docker build --target builder -t flask-demo:builder-only .

# 清理
docker rm -f flask-test 2>/dev/null
```

**Dockerfile 编写最佳实践：**

1. **顺序关键：变化频率低的指令放前面**（利用缓存）——FROM -> RUN apt -> COPY requirements -> COPY 代码
2. **合并 RUN 指令减少层数：** 用 `&&` 连接，用 `\` 换行，最后 `apt clean` 清理缓存
3. **使用 `.dockerignore`** 排除 node_modules、.git 等不需要的文件（加快构建速度）
4. **使用多阶段构建（Multi-stage Build）** 减小最终镜像体积——构建阶段用大镜像，运行阶段只用精简版
5. **用非 root 用户运行：** 通过 `USER` 指令切换到普通用户——安全最佳实践
6. **优先使用 COPY 而非 ADD：** ADD 有隐式行为（自动解压 tar），COPY 更透明

### 3.11 docker tag —— 为镜像打标签

`docker tag` 为已有镜像创建新的标签（本质是别名，不会复制数据）。

**基本语法：**

```
docker tag 源镜像[:标签] 目标镜像[:标签]
```

**实战：**

```bash
# 确保有基础镜像
docker pull nginx:alpine > /dev/null 2>&1

# 1. 添加版本标签
docker tag nginx:alpine nginx:my-version-1.0
docker images nginx
# 输出：nginx 现在有两个标签指向上同一个 IMAGE ID

# 2. 准备推送到私有仓库（打上 Registry 地址前缀）
docker tag nginx:alpine myregistry.example.com:5000/nginx:production
# 格式：<registry>/<namespace>/<repository>:<tag>

# 3. 查看——新旧标签指向相同的 IMAGE ID
docker images nginx
# IMAGE ID 相同——说明它们共享同一份数据，tag 只是别名
```

### 3.12 docker save / docker load —— 离线传输镜像

在没有网络的环境中，`docker save` 和 `docker load` 是传输镜像的关键工具。

**基本语法：**

```
# 导出
docker save [选项] 镜像名[:标签]... > 文件.tar
# 或
docker save [选项] 镜像名[:标签]... -o 文件.tar

# 导入
docker load [选项] < 文件.tar
# 或
docker load -i 文件.tar
```

**实战：**

```bash
docker pull busybox:latest > /dev/null 2>&1

# 1. 导出镜像到 tar 文件
docker save busybox:latest -o /tmp/busybox.tar
# 或
docker save busybox:latest > /tmp/busybox.tar

# 2. 查看导出的文件大小
ls -lh /tmp/busybox.tar
# 输出示例：-rw-r--r-- 1 user user 4.2M ...

# 3. 删除本地镜像
docker rmi busybox:latest

# 4. 从 tar 文件重新导入
docker load -i /tmp/busybox.tar
# 输出示例：
# Loaded image: busybox:latest

# 5. 验证镜像已恢复
docker images busybox
# 应能看到 busybox:latest

# 6. 导出多个镜像到一个文件
# docker save nginx:alpine busybox:latest -o /tmp/multi-images.tar

# 7. 使用 gzip 压缩导出（节省空间）
docker save busybox:latest | gzip > /tmp/busybox.tar.gz
# 导入压缩文件：
gunzip -c /tmp/busybox.tar.gz | docker load

# 清理
rm -f /tmp/busybox.tar /tmp/busybox.tar.gz
```

**docker save vs docker export：**

| 命令 | 操作对象 | 内容 | 保留 |
|------|---------|------|------|
| `docker save` | 镜像（Image） | 所有层 + 元数据 + 标签 | 完整镜像（可在另一台机器上 `docker run`） |
| `docker export` | 容器（Container） | 仅容器文件系统的平面快照 | 不含层信息、元数据、历史记录 |

### 3.13 docker push —— 推送镜像到 Registry

`docker push` 将本地镜像上传到 Registry（如 Docker Hub 或私有仓库）。

**基本语法：**

```
docker push [选项] 镜像名[:标签]
```

**参数表：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `镜像名[:标签]` | 要推送的镜像 | 必选 | — |
| `--all-tags` / `-a` | 推送所有标签 | 可选 | 仅指定标签 |
| `--quiet` / `-q` | 安静模式 | 可选 | 否 |

**实战：**

```bash
# 推送镜像到 Docker Hub 的典型流程：
#
# 1. 登录 Docker Hub
# docker login
# 输入用户名和密码（或 Access Token）
#
# 2. 给镜像打上 <DockerHub用户名>/<镜像名>:<标签> 格式的标签
# docker tag flask-demo:1.0 myusername/flask-demo:1.0
#
# 3. 推送
# docker push myusername/flask-demo:1.0
# 输出示例：
# The push refers to repository [docker.io/myusername/flask-demo]
# abc123: Pushed
# def456: Pushed
# 1.0: digest: sha256:... size: 1234
#
# 4. 推送所有标签
# docker push -a myusername/flask-demo
#
# 5. 推送到私有仓库
# docker tag flask-demo:1.0 myregistry.example.com:5000/flask-demo:1.0
# docker push myregistry.example.com:5000/flask-demo:1.0
```

### 3.14 docker network —— 管理容器网络

`docker network` 管理 Docker 网络。在 Docker Compose 中通常自动创建，但在手动管理多容器通信时非常有用。

**基本语法：**

```
docker network 子命令 [参数...]
```

**常用子命令：**

| 子命令 | 说明 | 示例 |
|--------|------|------|
| `ls` / `list` | 列出所有网络 | `docker network ls` |
| `create <名称>` | 创建自定义网络 | `docker network create my-net` |
| `rm <名称>` | 删除网络 | `docker network rm my-net` |
| `inspect <名称>` | 查看网络详情 | `docker network inspect my-net` |
| `connect <网络> <容器>` | 将容器连接到网络 | `docker network connect my-net my-container` |
| `disconnect <网络> <容器>` | 将容器从网络断开 | `docker network disconnect my-net my-container` |
| `prune` | 删除所有未使用的网络 | `docker network prune -f` |

**实战：**

```bash
# 1. 查看默认网络
docker network ls
# 输出示例：
# NETWORK ID     NAME      DRIVER    SCOPE
# abc123def456   bridge    bridge    local
# def456abc789   host      host      local
# ghi789jkl012   none      null      local

# 2. 创建自定义 bridge 网络
docker network create --driver bridge my-app-net
# 输出：网络 ID 或名称

# 3. 查看网络细节
docker network inspect my-app-net
# 可以看到子网（如 172.18.0.0/16）、网关、连接到该网络的容器列表

# 4. 在两个容器间用自定义网络通信
docker run -d --name net-test-1 --network my-app-net nginx:alpine
docker run -d --name net-test-2 --network my-app-net nginx:alpine

# 5. 从 net-test-2 通过容器名 ping net-test-1
docker exec net-test-2 ping -c 2 net-test-1
# 输出示例：
# PING net-test-1 (172.18.0.2): 56 data bytes
# 64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.123 ms
# ↑ 自定义网络上的容器可以通过名称互相发现！

# 6. 自定义网络的 DNS 解析
docker exec net-test-2 sh -c 'nslookup net-test-1 2>/dev/null || cat /etc/hosts'
# 验证容器名可以被解析

# 7. 动态连接容器到网络
docker run -d --name net-test-3 nginx:alpine  # 先用默认 bridge
docker network connect my-app-net net-test-3  # 再连接到自定义网络
docker exec net-test-3 ping -c 1 net-test-1
# 现在 net-test-3 也可以和 net-test-1 通信了

# 8. 断开网络
docker network disconnect my-app-net net-test-3

# 清理
docker rm -f net-test-1 net-test-2 net-test-3 2>/dev/null
docker network rm my-app-net 2>/dev/null
```

**关键认知：默认 bridge 网络 VS 自定义 bridge 网络：**

| 特性 | 默认 bridge | 自定义 bridge |
|------|-----------|-------------|
| DNS 自动解析容器名 | 不支持 | **支持**（容器间可通过名称通信） |
| 网络隔离 | 所有容器在同一网络 | 不同网络的容器天然隔离 |
| 容器连接 | 需要 `--link`（已废弃） | 直接通过容器名 |
| 配置灵活性 | 不可自定义 | 可自定义子网、网关等 |

### 3.15 docker volume —— 管理数据卷

`docker volume` 管理命名卷（Named Volume）。命名卷由 Docker 管理存储位置，是生产环境中持久化数据的推荐方式。

**基本语法：**

```
docker volume 子命令 [参数...]
```

**常用子命令：**

| 子命令 | 说明 | 示例 |
|--------|------|------|
| `ls` / `list` | 列出所有卷 | `docker volume ls` |
| `create <名称>` | 创建卷 | `docker volume create my-data` |
| `rm <名称>` | 删除卷 | `docker volume rm my-data` |
| `inspect <名称>` | 查看卷详情 | `docker volume inspect my-data` |
| `prune` | 删除所有未使用的卷 | `docker volume prune -f` |

**实战：**

```bash
# 1. 创建命名卷
docker volume create app-data

# 2. 查看卷的详细信息
docker volume inspect app-data
# 输出示例：
# [
#     {
#         "CreatedAt": "2024-07-31T10:00:00+08:00",
#         "Driver": "local",
#         "Labels": null,
#         "Mountpoint": "/var/lib/docker/volumes/app-data/_data",
#         "Name": "app-data",
#         "Options": null,
#         "Scope": "local"
#     }
# ]
# Mountpoint 是卷在宿主机上的实际存储位置

# 3. 使用卷启动容器
docker run -d --name vol-test -v app-data:/data nginx:alpine

# 4. 在容器中写入数据
docker exec vol-test sh -c 'echo "Persistent data!" > /data/test.txt'

# 5. 删除容器并验证数据仍然存在
docker rm -f vol-test
docker run --rm -v app-data:/data busybox cat /data/test.txt
# 输出：Persistent data!
# ↑ 容器删除了，但卷中的数据还在！

# 6. 备份卷中的数据
docker run --rm -v app-data:/data -v $(pwd):/backup busybox \
    tar czf /backup/app-data-backup.tar.gz -C /data .
ls -lh app-data-backup.tar.gz

# 7. 恢复卷数据
docker volume create app-data-restore
docker run --rm -v app-data-restore:/data -v $(pwd):/backup busybox \
    tar xzf /backup/app-data-backup.tar.gz -C /data

# 清理
docker volume rm app-data app-data-restore 2>/dev/null
rm -f app-data-backup.tar.gz
```

### 3.16 docker compose —— 多容器编排

`docker compose` 让你在单个 YAML 文件中定义和运行多容器应用。`docker compose` 是 Docker Compose V2（独立插件）的命令形式，已在 Ubuntu 24.04 中废弃旧版的 `docker-compose`（带连字符）命令。

**基本语法：**

```
docker compose [选项] 子命令 [参数...]
```

**常用子命令：**

| 子命令 | 说明 |
|--------|------|
| `up [-d]` | 创建并启动所有服务（`-d` 后台运行） |
| `down [-v]` | 停止并删除所有容器和网络（`-v` 同时删除卷） |
| `ps` | 查看 Compose 项目中的容器状态 |
| `logs [-f] [服务名]` | 查看服务日志（`-f` 跟踪） |
| `build` | 构建或重新构建服务镜像 |
| `exec <服务名> <命令>` | 在服务容器中执行命令 |
| `restart [服务名]` | 重启服务 |
| `stop [服务名]` | 停止服务（不删除容器） |
| `start [服务名]` | 启动已停止的服务 |
| `config` | 验证并查看 Compose 文件的最终配置 |

#### 3.16.1 docker-compose.yml 核心配置项

| 顶层配置项 | 说明 | 示例 |
|-----------|------|------|
| `services` | 定义所有服务（容器）——必填，compose 的核心 | 见下方完整示例 |
| `networks` | 定义自定义网络——可选，不定义则使用默认网络 | 见下方 |
| `volumes` | 定义命名卷——可选，不定义则动态创建 | 见下方 |
| `configs` | 定义配置资源（Docker Swarm 用） | 进阶内容 |
| `secrets` | 定义敏感数据（Docker Swarm 用） | 进阶内容 |

**services 下的常用子配置项：**

| 子配置项 | 说明 | 示例 |
|---------|------|------|
| `image` | 使用已有镜像（与 `build` 互斥） | `image: nginx:alpine` |
| `build` | 从 Dockerfile 构建（与 `image` 互斥） | `build: .` 或 `build: ./app` |
| `container_name` | 自定义容器名 | `container_name: my-web` |
| `ports` | 端口映射 | `ports: - "8080:80"` |
| `environment` | 设置环境变量 | `environment: - DB_HOST=mysql` |
| `env_file` | 从文件加载环境变量 | `env_file: - .env` |
| `volumes` | 挂载卷或目录 | `volumes: - db-data:/var/lib/mysql` |
| `networks` | 指定网络 | `networks: - app-net` |
| `depends_on` | 定义服务启动依赖顺序 | `depends_on: - mysql` |
| `restart` | 重启策略 | `restart: unless-stopped` |
| `command` | 覆盖默认命令 | `command: python app.py --port 5000` |
| `entrypoint` | 覆盖入口点 | `entrypoint: ["python", "app.py"]` |
| `healthcheck` | 健康检查 | `healthcheck: { test: ["CMD", "curl", "-f", "http://localhost/"] }` |
| `logging` | 日志配置 | `logging: { driver: "json-file", options: { max-size: "10m" } }` |

**关键：`depends_on` 的局限性：**

`depends_on` 只保证**启动顺序**，不保证目标服务的**应用已就绪**。例如 `depends_on: mysql` 只是等 MySQL 容器启动，但 MySQL 初始化可能需要好几秒——此时应用容器已经开始尝试连接数据库了。解决方案是在应用代码中实现重试逻辑，或使用 `condition: service_healthy`（需配合 `healthcheck`）。

#### 3.16.2 完整 docker-compose.yml 示例

```bash
cd ~/docker-lesson40
mkdir -p compose-demo
cd compose-demo
```

```bash
# 创建 docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
# ============================================================
# docker-compose.yml —— 完整的多容器 Web 应用示例
# ============================================================
#
# 这个示例定义了一个典型的 Web 应用栈：
#   web（Nginx + Flask） + db（MySQL） + cache（Redis）
#
# ============================================================

version: "3.9"

# ============================================================
# 服务定义
# ============================================================
services:

  # ---- Web 应用服务 ----
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: compose-demo-web:latest
    container_name: compose-web
    ports:
      - "8080:5000"
    environment:
      - FLASK_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=appuser
      - DB_PASSWORD=apppassword
      - DB_NAME=appdb
      - REDIS_HOST=cache
      - REDIS_PORT=6379
    env_file:
      - .env
    volumes:
      - app-logs:/app/logs
    networks:
      - app-network
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ---- MySQL 数据库服务 ----
  db:
    image: mysql:8.0
    container_name: compose-db
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=appdb
      - MYSQL_USER=appuser
      - MYSQL_PASSWORD=apppassword
    volumes:
      - db-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ---- Redis 缓存服务 ----
  cache:
    image: redis:7-alpine
    container_name: compose-cache
    ports:
      - "6379:6379"
    volumes:
      - cache-data:/data
    networks:
      - app-network
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

# ============================================================
# 卷定义
# ============================================================
volumes:
  db-data:
    name: compose-db-data
  cache-data:
    name: compose-cache-data
  app-logs:
    name: compose-app-logs

# ============================================================
# 网络定义
# ============================================================
networks:
  app-network:
    name: compose-app-network
    driver: bridge
COMPOSE_EOF

# 创建环境变量文件
cat > .env << 'ENVEOF'
# Compose 环境变量（${VAR} 格式的引用会从此文件自动加载）
COMPOSE_PROJECT_NAME=compose-demo
FLASK_DEBUG=false
ENVEOF

# 创建 MySQL 初始化脚本
cat > init.sql << 'SQLEOF'
-- 初始化数据库表
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45),
    visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQLEOF

# 创建应用所需的 Dockerfile（复用之前的 Flask 应用）
cat > Dockerfile << 'DKEOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1
CMD ["python", "app.py", "--port", "5000"]
DKEOF

# 复制之前创建的 Flask 应用文件（从 dockerfile-demo）
cp ../dockerfile-demo/requirements.txt .
cp ../dockerfile-demo/app.py .

echo "Compose 项目文件已创建"
```

Now demonstrate Compose usage:

```bash
cd ~/docker-lesson40/compose-demo

# 1. 验证 Compose 文件语法
docker compose config
# 输出合并后的完整配置（包含 .env 变量的展开结果）
# 如果有语法错误，这里会报出

# 2. 启动所有服务（后台模式）
# docker compose up -d
# 输出示例：
# [+] Running 4/4
#  ✔ Network compose-app-network  Created
#  ✔ Container compose-db         Healthy
#  ✔ Container compose-cache      Healthy
#  ✔ Container compose-web        Started

# 3. 查看运行状态
# docker compose ps
# 输出示例：
# NAME           IMAGE                COMMAND                  SERVICE   STATUS
# compose-cache  redis:7-alpine       "docker-entrypoint.s…"  cache     healthy
# compose-db     mysql:8.0            "docker-entrypoint.s…"  db        healthy
# compose-web    compose-demo-web     "python app.py --por…"  web       running

# 4. 查看日志
# docker compose logs -f web     # 只看 web 服务的日志并跟踪
# docker compose logs --tail=20  # 查看所有服务的最后 20 行日志

# 5. 在服务容器中执行命令
# docker compose exec web python --version
# docker compose exec db mysql -u appuser -papppassword appdb -e "SHOW TABLES;"

# 6. 重启单个服务
# docker compose restart web

# 7. 停止所有服务（保留容器和数据）
# docker compose stop

# 8. 启动已停止的服务
# docker compose start

# 9. 停止并删除所有容器、网络（保留卷）
# docker compose down

# 10. 停止并删除所有容器、网络、卷（彻底清理）
# docker compose down -v

# 11. 重新构建镜像并启动
# docker compose up -d --build
```

**Docker Compose 项目生命周期：**

```
docker compose up -d      ← 创建并启动（首次会构建镜像、创建网络和卷）
        │
        ├─ docker compose ps       ← 查看状态
        ├─ docker compose logs     ← 查看日志
        ├─ docker compose exec     ← 进入容器
        ├─ docker compose stop     ← 停止服务（容器保留）
        ├─ docker compose start    ← 重新启动
        ├─ docker compose restart  ← 重启服务
        │
docker compose down        ← 停止并删除容器和网络
docker compose down -v     ← 停止并删除容器、网络和卷（数据也会删除！）
```

---

## 4. 实战练习

### 练习 1：运行 Nginx 并自定义欢迎页

**任务：**
1. 使用 Nginx Alpine 镜像，以 detach 模式运行一个容器
2. 命名为 `nginx-practice`
3. 将宿主机端口 `9090` 映射到容器端口 `80`
4. 创建一个自定义的 `index.html` 并通过 bind mount 挂载到容器 `/usr/share/nginx/html/`
5. 用 curl 验证自定义页面是否正确显示
6. 查看容器日志最后 5 行
7. 停止并删除容器

**参考答案：**

```bash
cd ~/docker-lesson40

# 1. 创建自定义 HTML
mkdir -p nginx-html
cat > nginx-html/index.html << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>Docker Test</title></head>
<body>
    <h1>我的自定义 Nginx 页面</h1>
    <p>容器 ID：<span id="hostname">加载中...</span></p>
    <script>document.getElementById('hostname').textContent = document.location.host;</script>
</body>
</html>
HTML

# 2. 运行 Nginx 容器并挂载自定义页面
docker run -d --name nginx-practice -p 9090:80 \
    -v $(pwd)/nginx-html:/usr/share/nginx/html:ro \
    nginx:alpine

# 3. 验证
curl -s http://localhost:9090 | grep "我的自定义"
# 输出：    <h1>我的自定义 Nginx 页面</h1>

# 4. 查看容器日志最后 5 行
docker logs --tail 5 nginx-practice
# 可以看到 Nginx 的访问日志

# 5. 停止并删除
docker stop nginx-practice && docker rm nginx-practice

# 6. 清理
rm -rf nginx-html
```

---

### 练习 2：交互式探索 Ubuntu 容器

**任务：**
1. 以交互模式启动一个 Ubuntu 24.04 容器
2. 在容器内执行以下操作：
   - 查看操作系统版本（`cat /etc/os-release`）
   - 查看主机名（`hostname`）
   - 安装 `curl` 工具（`apt update && apt install -y curl`）
   - 使用 curl 访问 `http://example.com`
3. 退出容器
4. 用 `docker ps -a` 确认容器已退出
5. 删除已退出的容器

**参考答案：**

```bash
# 1. 启动交互式容器
docker run -it --name ubuntu-explore ubuntu:24.04 bash

# 在容器内执行以下命令：
# root@容器ID:/# cat /etc/os-release | head -3
# root@容器ID:/# hostname
# root@容器ID:/# apt update && apt install -y curl
# root@容器ID:/# curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://example.com
# root@容器ID:/# exit

# 2. 确认容器已退出
docker ps -a -f "name=ubuntu-explore"
# STATUS 列应显示 Exited

# 3. 删除容器
docker rm ubuntu-explore
```

---

### 练习 3：编写 Dockerfile 构建自定义镜像

**任务：**
编写一个 Dockerfile，基于 Ubuntu 24.04 构建包含以下功能的自定义镜像：
1. 安装 `curl` 和 `wget` 工具
2. 设置环境变量 `APP_NAME=myapp` 和 `APP_VERSION=1.0`
3. 创建工作目录 `/workspace`
4. 暴露端口 `8080`
5. 使用 `CMD` 定义一个默认命令：打印 `APP_NAME` 和 `APP_VERSION`，然后 `sleep infinity`

构建镜像并运行容器验证。

**参考答案：**

```bash
cd ~/docker-lesson40
mkdir -p practice-dockerfile
cd practice-dockerfile

# 1. 编写 Dockerfile
cat > Dockerfile << 'EOF'
FROM ubuntu:24.04

# 安装工具
RUN apt update && \
    apt install -y curl wget && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# 设置环境变量
ENV APP_NAME=myapp \
    APP_VERSION=1.0

# 工作目录
WORKDIR /workspace

# 声明端口
EXPOSE 8080

# 默认命令
CMD echo "App: $APP_NAME, Version: $APP_VERSION" && \
    echo "Workspace: $(pwd)" && \
    echo "curl version: $(curl --version | head -1)" && \
    sleep infinity
EOF

# 2. 构建镜像
docker build -t practice-app:1.0 .

# 3. 运行验证
docker run -d --name practice-container practice-app:1.0
sleep 2

# 4. 查看输出
docker logs practice-container
# 应输出：
# App: myapp, Version: 1.0
# Workspace: /workspace
# curl version: curl 8.5.0 ...

# 5. 进入容器验证工作目录和工具
docker exec practice-container pwd
# 输出：/workspace（ENV 和 WORKDIR 生效）

docker exec practice-container which curl wget
# 输出：/usr/bin/curl /usr/bin/wget（安装成功）

# 6. 查看镜像层
docker history practice-app:1.0

# 7. 清理
docker rm -f practice-container
docker rmi practice-app:1.0
```

---

### 练习 4：数据持久化——使用 Volume 保存 MySQL 数据

**任务：**
1. 创建一个名为 `mysql-practice-data` 的 Docker Volume
2. 运行一个 MySQL 8.0 容器，将该 Volume 挂载到 `/var/lib/mysql`
3. 设置 root 密码为 `RootPass123`
4. 在容器中创建一个名为 `practicedb` 的数据库
5. 停止并删除 MySQL 容器
6. 重新运行一个新的 MySQL 容器，挂载同一个 Volume
7. 验证 `practicedb` 数据库仍然存在（证明数据已持久化）
8. 清理所有资源

**参考答案：**

```bash
# 1. 创建命名卷
docker volume create mysql-practice-data

# 2. 启动 MySQL 容器
docker run -d --name mysql-practice \
    -e MYSQL_ROOT_PASSWORD=RootPass123 \
    -v mysql-practice-data:/var/lib/mysql \
    mysql:8.0

# 等待 MySQL 完全启动（healthy）
echo "等待 MySQL 启动..."
sleep 20

# 3. 创建数据库
docker exec mysql-practice mysql -uroot -pRootPass123 -e "CREATE DATABASE practicedb;"
docker exec mysql-practice mysql -uroot -pRootPass123 -e "SHOW DATABASES;" | grep practicedb
# 输出：practicedb（确认数据库已创建）

# 4. 停止并删除容器
docker stop mysql-practice && docker rm mysql-practice

# 5. 重新启动新容器，挂载同一个 Volume
docker run -d --name mysql-practice-v2 \
    -e MYSQL_ROOT_PASSWORD=RootPass123 \
    -v mysql-practice-data:/var/lib/mysql \
    mysql:8.0

echo "等待 MySQL 启动..."
sleep 20

# 6. 验证数据库仍然存在
docker exec mysql-practice-v2 mysql -uroot -pRootPass123 -e "SHOW DATABASES;" | grep practicedb
# 输出：practicedb（数据已持久化！）

# 7. 清理
docker rm -f mysql-practice-v2
docker volume rm mysql-practice-data
```

---

### 练习 5：自定义网络——容器间通过名称通信

**任务：**
1. 创建一个自定义 bridge 网络 `practice-net`
2. 在该网络中启动两个 Alpine 容器：`box-a` 和 `box-b`
3. 从 `box-a` 通过容器名 ping `box-b`
4. 从 `box-b` 通过容器名 ping `box-a`
5. 清理所有资源

**参考答案：**

```bash
# 1. 创建自定义网络
docker network create practice-net

# 2. 启动容器
docker run -d --name box-a --network practice-net alpine:latest sleep 300
docker run -d --name box-b --network practice-net alpine:latest sleep 300

# 3. 验证跨容器通信（通过容器名）
echo "=== box-a ping box-b ==="
docker exec box-a ping -c 2 box-b
# 应看到成功的 ping 响应

echo "=== box-b ping box-a ==="
docker exec box-b ping -c 2 box-a
# 应看到成功的 ping 响应

# 4. 尝试在默认 bridge 网络中的容器是否能与 practice-net 的容器通信
docker run --rm alpine:latest ping -c 1 -W 2 box-a 2>&1
# 输出：ping: bad address 'box-a'（默认 bridge 网络不支持名称解析，且网络隔离）

# 5. 清理
docker rm -f box-a box-b
docker network rm practice-net
```

---

### 练习 6：docker save/load 离线传输镜像

**任务：**
1. 拉取 `alpine:latest` 镜像
2. 使用 `docker save` 导出为 `.tar` 文件
3. 删除本地的 `alpine:latest` 镜像
4. 使用 `docker load` 从 `.tar` 文件恢复镜像
5. 运行一个 Alpine 容器验证
6. 清理

**参考答案：**

```bash
cd ~/docker-lesson40

# 1. 拉取镜像
docker pull alpine:latest

# 2. 导出
docker save alpine:latest -o alpine-backup.tar
ls -lh alpine-backup.tar
# 查看文件大小

# 3. 删除本地镜像
docker rmi alpine:latest

# 4. 验证镜像已删除
docker images alpine
# 应显示空或错误

# 5. 从 tar 文件恢复
docker load -i alpine-backup.tar
# 输出：Loaded image: alpine:latest

# 6. 验证——运行容器
docker run --rm alpine:latest echo "Alpine restored successfully!"
# 输出：Alpine restored successfully!

# 7. 清理
rm alpine-backup.tar
```

---

### 练习 7：Docker Compose 编排 WordPress + MySQL

**任务：**
编写一个 `docker-compose.yml` 文件，编排以下服务：
1. `wordpress` 服务使用 `wordpress:latest` 镜像，映射端口 `8080:80`
2. `db` 服务使用 `mysql:8.0` 镜像
3. MySQL 的 root 密码设为 `wordpress123`，数据库名为 `wordpress`
4. 两个服务连接到同一个自定义网络
5. WordPress 服务依赖 MySQL 服务
6. 为 MySQL 创建命名卷 `wp-db-data`
7. 验证 `docker compose config` 语法正确（不实际启动服务）

**参考答案：**

```bash
cd ~/docker-lesson40
mkdir -p practice-compose
cd practice-compose

cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  wordpress:
    image: wordpress:latest
    container_name: wp-app
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress123
      WORDPRESS_DB_NAME: wordpress
    networks:
      - wp-network
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: wp-db
    environment:
      MYSQL_ROOT_PASSWORD: wordpress123
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress123
    volumes:
      - wp-db-data:/var/lib/mysql
    networks:
      - wp-network
    restart: unless-stopped

volumes:
  wp-db-data:
    name: wp-db-data

networks:
  wp-network:
    name: wp-network
    driver: bridge
EOF

# 验证配置语法
docker compose config
# 输出合并后的完整 YAML 配置——如果语法有误会在这里报错

# 如果想实际启动：
# docker compose up -d
# 然后在浏览器中访问 http://localhost:8080 进行 WordPress 安装向导

# 清理（如果启动了的话）
# docker compose down -v

# 清理目录
cd ~/docker-lesson40
rm -rf practice-compose
```

---

### 练习 8：综合练习——构建、运行、调试一个完整容器

**任务：**
完成以下完整的容器操作流程：
1. 编写一个 Dockerfile，基于 `nginx:alpine`，添加一个自定义的 `50x.html` 错误页面到 `/usr/share/nginx/html/`
2. 将镜像构建为 `custom-nginx:latest`
3. 以后台模式运行容器，映射宿主机 8090 端口
4. 使用 `docker exec` 进入容器，查看 Nginx 配置文件和自定义错误页面是否存在
5. 使用 `docker logs` 查看访问日志
6. 使用 `docker inspect` 查看容器的 IP 地址和端口映射
7. 使用 curl 验证 502 错误页面（Nginx 的 502 错误会触发 50x.html）
8. 使用 `docker tag` 给镜像添加 `custom-nginx:v1` 标签
9. 使用 `docker save` 导出镜像
10. 停止并删除容器，删除镜像，然后 `docker load` 恢复镜像

**参考答案：**

```bash
cd ~/docker-lesson40
mkdir -p practice-comprehensive
cd practice-comprehensive

# 1. 创建自定义错误页面
cat > 50x.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>服务器错误</title></head>
<body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
    <h1 style="color: #e74c3c;">500 - 服务器内部错误</h1>
    <p>抱歉，服务器遇到了一些问题。请稍后再试。</p>
    <p style="color: #999; font-size: 12px;">Custom Error Page v1.0</p>
</body>
</html>
HTMLEOF

# 2. 编写 Dockerfile
cat > Dockerfile << 'DKEOF'
FROM nginx:alpine
COPY 50x.html /usr/share/nginx/html/50x.html
LABEL maintainer="student@lesson40"
LABEL version="1.0"
EXPOSE 80
DKEOF

# 3. 构建镜像
docker build -t custom-nginx:latest .

# 4. 运行容器
docker run -d --name custom-web -p 8090:80 custom-nginx:latest

# 5. 进入容器验证
echo "=== 容器内验证 ==="
docker exec custom-web ls -la /usr/share/nginx/html/50x.html
# 应看到 50x.html 存在

docker exec custom-web cat /etc/nginx/conf.d/default.conf | head -10
# 查看 Nginx 默认配置

# 6. 查看日志
echo "=== 容器日志 ==="
curl -s http://localhost:8090/ > /dev/null
docker logs --tail 3 custom-web
# 应看到访问日志

# 7. 查看容器详情
echo "=== 容器 IP ==="
docker inspect --format 'IP: {{.NetworkSettings.IPAddress}}' custom-web

echo "=== 端口映射 ==="
docker inspect --format 'Ports: {{json .NetworkSettings.Ports}}' custom-web | python3 -m json.tool 2>/dev/null || \
    docker inspect --format '{{json .NetworkSettings.Ports}}' custom-web

# 8. 触发 Nginx 错误页面（访问不存在的 upstream 不会直接触发 50x）
# 但我们可以验证 50x.html 确实被 Nginx 加载：
curl -s http://localhost:8090/50x.html
# 输出自定义的错误页面 HTML

# 9. 添加标签
docker tag custom-nginx:latest custom-nginx:v1
docker images custom-nginx
# 应看到两个标签指向同一个 IMAGE ID

# 10. 导出镜像
docker save custom-nginx:latest custom-nginx:v1 -o custom-nginx.tar
ls -lh custom-nginx.tar

# 11. 停止并删除容器
docker stop custom-web && docker rm custom-web

# 12. 删除镜像
docker rmi custom-nginx:latest custom-nginx:v1
docker images custom-nginx || echo "镜像已删除"

# 13. 从 tar 恢复镜像
docker load -i custom-nginx.tar
docker images custom-nginx
# 应看到两个标签都已恢复

# 14. 验证恢复后的镜像可用
docker run --rm custom-nginx:latest cat /usr/share/nginx/html/50x.html | grep "Custom Error Page"
# 输出包含 "Custom Error Page"

# 15. 最终清理
docker rmi custom-nginx:latest custom-nginx:v1
rm -f custom-nginx.tar
cd ~/docker-lesson40
rm -rf practice-comprehensive
```

---

### 练习 9：使用 docker inspect 和 --format 提取容器信息

**任务：**
1. 启动一个 Nginx 容器（后台模式，命名为 `inspect-target`）
2. 使用 `docker inspect` 配合 `--format` 分别提取：
   - 容器的 PID（宿主机上的进程 ID）
   - 容器的 IP 地址
   - 容器的网关地址
   - 容器的 MAC 地址
   - 容器是否在运行中
   - 容器的重启策略
   - 容器的内存限制
3. 展开查看完整 JSON 中 `.Config.Env` 部分
4. 清理

**参考答案：**

```bash
# 1. 启动容器
docker run -d --name inspect-target nginx:alpine

# 2. 提取各种信息
echo "=== 容器 PID ==="
docker inspect --format '宿主机 PID: {{.State.Pid}}' inspect-target

echo "=== IP 地址 ==="
docker inspect --format '容器 IP: {{.NetworkSettings.IPAddress}}' inspect-target

echo "=== 网关地址 ==="
docker inspect --format '网关: {{.NetworkSettings.Gateway}}' inspect-target

echo "=== MAC 地址 ==="
docker inspect --format 'MAC: {{.NetworkSettings.MacAddress}}' inspect-target

echo "=== 运行状态 ==="
docker inspect --format '状态: {{.State.Status}}' inspect-target

echo "=== 重启策略 ==="
docker inspect --format '重启策略: {{.HostConfig.RestartPolicy.Name}}' inspect-target

echo "=== 内存限制 ==="
docker inspect --format '内存限制(字节): {{.HostConfig.Memory}}' inspect-target
# 0 表示无限制

echo "=== 环境变量 ==="
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' inspect-target

# 3. 清理
docker rm -f inspect-target
```

---

### 练习 10：镜像标签管理

**任务：**
1. 拉取 `alpine:latest` 镜像
2. 给它添加 3 个标签：`my-alpine:stable`、`my-alpine:dev`、`my-alpine:test`
3. 列出所有 `my-alpine` 标签的镜像，确认它们有相同的 IMAGE ID
4. 删除 `my-alpine:test` 标签
5. 给 `my-alpine:dev` 重新打标签为 `my-alpine:production`
6. 删除所有 `my-alpine` 镜像
7. 确认 `alpine:latest` 仍然存在（原始镜像不受影响）

**参考答案：**

```bash
# 1. 拉取镜像
docker pull alpine:latest

# 2. 添加多个标签
docker tag alpine:latest my-alpine:stable
docker tag alpine:latest my-alpine:dev
docker tag alpine:latest my-alpine:test

# 3. 验证——所有标签应指向同一个 IMAGE ID
docker images my-alpine
# 输出：3 个标签，同一个 IMAGE ID
docker images alpine
# alpine:latest 的 IMAGE ID 也应相同

# 4. 删除 test 标签
docker rmi my-alpine:test
docker images my-alpine
# my-alpine:test 已消失，stable 和 dev 还在

# 5. 重新打标签
docker tag my-alpine:dev my-alpine:production
docker images my-alpine
# 现在有 stable, dev, production 三个标签

# 6. 删除所有 my-alpine 镜像
docker rmi my-alpine:stable my-alpine:dev my-alpine:production
docker images my-alpine || echo "my-alpine 标签已全部删除"

# 7. 确认原始镜像仍在
docker images alpine:latest
# alpine:latest 仍然存在——tag 只是别名，删除别名不影响原始镜像
```

---

## 5. 常见错误与排错

### 5.1 "Cannot connect to the Docker daemon" —— Docker 守护进程未运行

**现象：**

```
docker: Cannot connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?
```

**原因：** Docker 守护进程（dockerd）未启动，或当前用户无权访问 Docker socket。

**解决：**

```bash
# 1. 检查 Docker 服务状态
sudo systemctl status docker
# 如果 Active: inactive (dead)，需要启动

# 2. 启动 Docker 服务
sudo systemctl enable docker --now
sudo systemctl status docker
# 应显示 Active: active (running)

# 3. 如果 Docker 服务正常运行但仍报错——可能是用户权限问题
ls -la /var/run/docker.sock
# 输出示例：srw-rw---- 1 root docker ... /var/run/docker.sock
# docker.sock 属于 root:docker 组

# 4. 将当前用户加入 docker 组
sudo usermod -aG docker $USER
# 然后需要重新登录（logout/login），或使用 newgrp：
newgrp docker
docker ps  # 应该可以正常运行
```

### 5.2 "port is already allocated" —— 端口冲突

**现象：**

```
Error response from daemon: driver failed programming external connectivity
on endpoint ... Bind for 0.0.0.0:8080 failed: port is already allocated.
```

**原因：** 宿主机端口已被其他进程（可能是另一个 Docker 容器）占用。

**解决：**

```bash
# 1. 查看谁占用了该端口
sudo ss -tlnp | grep 8080
# 或
sudo lsof -i :8080

# 2. 如果是 Docker 容器占用
docker ps --filter "publish=8080"
# 找到占用该端口的容器
# docker stop <容器名>  或  docker rm -f <容器名>

# 3. 解决方案：
# A. 停掉占用端口的容器
# B. 改用其他宿主机端口：-p 8081:80
# C. 让 Docker 自动选择端口：-p 80（只指定容器端口，宿主机端口随机）
docker run -d -p 80 --name auto-port nginx:alpine
docker port auto-port
# 输出：80/tcp -> 0.0.0.0:32768 （Docker 自动分配的随机端口）
```

### 5.3 "No such image" —— 镜像未找到

**现象：**

```
Unable to find image 'myimage:latest' locally
docker: Error response from daemon: pull access denied for myimage ...
or repository does not exist: myimage:latest not found.
```

**原因：** 本地没有该镜像，且从 Registry 拉取时也找不到（可能是拼写错误、网络问题或 Registry 不可达）。

**解决：**

```bash
# 1. 检查本地是否有该镜像
docker images | grep myimage

# 2. 尝试显式拉取
docker pull myimage:latest

# 3. 常见原因排查：
# A. 标签拼写错误——检查镜像名和标签
# B. 网络问题——检查能否访问 Docker Hub
curl -I https://hub.docker.com 2>&1 | head -3

# C. Docker Hub 上确实不存在——访问 https://hub.docker.com 搜索确认
# D. 如果是私有镜像，需要先登录
docker login

# 4. 检查已拉取的镜像列表
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 5.4 "container ... is not running" —— 容器已退出

**现象：**

```
Error response from daemon: Container abc123... is not running
```

**原因：** 尝试 `docker exec` 进入一个已退出的容器。

**解决：**

```bash
# 1. 查看容器状态
docker ps -a | grep <容器名>
# STATUS 列为 Exited (0) 或 Exited (非0)

# 2. 查看退出原因——查看退出码和日志
docker logs <容器名>
# 日志会显示容器输出，帮助判断退出的原因

# 3. 查看退出码
docker inspect --format '退出码: {{.State.ExitCode}}' <容器名>
# ExitCode 0 = 正常退出，非 0 = 异常退出

# 4. 常见退出原因：
# - 前台进程结束了（如 echo "done" 执行完就退出）
# - 应用程序崩溃（非 0 退出码）
# - 缺少必要的环境变量或配置文件

# 5. 解决方案：
# A. 重新启动容器：docker start <容器名>
# B. 查看日志找到问题所在：docker logs <容器名>
# C. 如果需要保持在运行状态，用 sleep infinity 等命令
```

### 5.5 "permission denied" —— 容器内权限问题

**现象：**

```
bash: /app/script.sh: Permission denied
```

**原因：** 容器内文件没有执行权限，或以错误用户身份运行。

**解决：**

```bash
# 1. 在 Dockerfile 中添加执行权限
RUN chmod +x /app/script.sh

# 2. 如果不想修改 Dockerfile，在 docker run 时作为命令执行
docker run --rm myimage sh /app/script.sh  # 用 sh 执行脚本

# 3. 使用 USER 指令切换到非 root 用户时，确保文件所有权正确
# Dockerfile:
# RUN chown -R appuser:appgroup /app
# USER appuser

# 4. 在 bind mount 时，容器内 UID 需要匹配宿主机文件的所有者
# 查看容器内用户的 UID
docker run --rm myimage id
# 如果 UID 不匹配，可以用 --user 参数指定
docker run --rm --user $(id -u):$(id -g) -v $(pwd):/app myimage
```

### 5.6 "Cannot link to a non-running container" —— Compose 依赖问题

**现象：**

```
Cannot start service web: Cannot link to a non-running container /compose-db as /compose-web/db
```

**原因：** `depends_on` 指定的容器启动后很快就退出了，或者启动顺序不正确。

**解决：**

```bash
# 1. 查看依赖服务的日志
docker compose logs db

# 2. 验证依赖服务是否健康
docker compose ps
# 关注 STATUS 列——应该是 "Up" 或 "healthy"

# 3. 使用 depends_on 的 condition 语法（Compose v3.9+）
# services:
#   web:
#     depends_on:
#       db:
#         condition: service_healthy
#   db:
#     healthcheck:
#       test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
#       interval: 10s
#       retries: 5

# 4. 如果数据库初始化时间长，增加 start_period
# healthcheck:
#   start_period: 30s  # 给 30 秒初始化时间
```

### 5.7 镜像构建慢、体积大

**解决策略：**

```bash
# 1. 使用 .dockerignore 排除不需要的文件
cat > .dockerignore << 'EOF'
.git
.gitignore
node_modules
*.md
.env
.DS_Store
__pycache__
*.pyc
dist
build
.vscode
.idea
EOF

# 2. 使用更小的基础镜像
# FROM ubuntu:24.04    → 78MB
# FROM alpine:latest    → 7MB
# FROM debian:bookworm-slim → 74MB
# FROM scratch          → 0MB（适合 Go/Rust 等静态编译语言）

# 3. 合并 RUN 指令减少层数
# 不好：
# RUN apt update
# RUN apt install -y nginx
# RUN apt clean
#
# 好：
# RUN apt update && \
#     apt install -y nginx && \
#     apt clean && \
#     rm -rf /var/lib/apt/lists/*

# 4. 使用多阶段构建（Multi-stage Build）
# 构建阶段用完整镜像，运行阶段只复制必需文件

# 5. 分析镜像体积
docker images --format "{{.Repository}}:{{.Tag}} - {{.Size}}"
docker history <镜像名>  # 查看每层的大小
```

---

## 6. 进阶延伸

### 6.1 Docker Compose vs Docker Swarm vs Kubernetes

本章的 Docker Compose 适合单机多容器编排。当你需要跨多台机器管理容器时，需要编排平台：

| 工具 | 定位 | 适用场景 | 学习曲线 |
|------|------|---------|---------|
| **Docker Compose** | 单机容器编排 | 开发环境、个人项目、单服务器部署 | 低——1 个 YAML 文件 |
| **Docker Swarm** | Docker 原生集群 | 小型生产集群（3-5 节点）、希望保持 Docker 生态 | 中——基于 Compose 文件扩展 |
| **Kubernetes (K8s)** | 行业标准容器编排平台 | 中大型生产集群、需要自动扩缩容/服务发现/滚动更新 | 高——概念多、配置复杂 |

**Swarm 模式快速体验：**

```bash
# Docker Engine 内置了 Swarm 模式
# 初始化单节点 Swarm
# docker swarm init

# 部署一个 Stack（等同于 Compose，但可跨节点）
# docker stack deploy -c docker-compose.yml myapp

# 查看 Stack 中的服务
# docker stack services myapp
```

### 6.2 镜像优化——多阶段构建进阶

多阶段构建（Multi-stage Build）是减小镜像体积的利器。在第一个阶段（构建阶段）完成编译和依赖安装，在第二个阶段（运行阶段）只复制最终需要的二进制文件。

```dockerfile
# 示例：Go 应用的多阶段构建——最终镜像不到 10MB
# ---- 阶段 1：构建 ----
FROM golang:1.22 AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

# ---- 阶段 2：运行 ----
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /build/app /app
ENTRYPOINT ["/app"]
# 最终镜像只包含编译好的二进制文件，不含 Go 编译器
```

### 6.3 Docker 安全基础

容器的安全是一个深度防御（Defense in Depth）问题：

1. **不要用 root 运行容器：** Dockerfile 中使用 `USER` 指令切换到非 root 用户
2. **使用只读根文件系统：** `docker run --read-only` ——防止容器被入侵后写入恶意文件
3. **限制能力（Capabilities）：** `docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE` ——只给容器最少的能力
4. **使用 seccomp 和 AppArmor 配置文件：** 限制容器可以执行的系统调用
5. **定期扫描镜像漏洞：** 使用 `docker scout` 或 Trivy 等工具
6. **不要将敏感信息写入镜像层：** 使用 Docker Secrets 或环境变量

```bash
# 启用只读文件系统
docker run --read-only --tmpfs /tmp --tmpfs /run nginx:alpine
# /tmp 和 /run 需要可写，用 tmpfs 提供临时存储

# 删除所有 capabilities，只保留绑定低端口的能力
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp:latest

# 使用 docker scout 扫描镜像漏洞（Docker Desktop 内置）
# docker scout quickview myimage:latest
```

### 6.4 容器日志管理

生产环境中，容器日志会快速增长。需要配置日志轮转避免撑满磁盘：

```bash
# docker run 时配置日志轮转
docker run -d --name app \
    --log-driver json-file \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    nginx:alpine

# 在 docker-compose.yml 中配置：
# services:
#   web:
#     logging:
#       driver: "json-file"
#       options:
#         max-size: "10m"
#         max-file: "3"
```

### 6.5 容器资源限制详解

在没有资源限制的情况下，单个容器可以耗尽宿主机的全部 CPU 和内存——这就是著名的"吵闹的邻居"（Noisy Neighbor）问题。

```bash
# CPU 限制：
# --cpus=1.5       限制使用 1.5 个核心
# --cpuset-cpus=0-2  限制使用 CPU 0, 1, 2

# 内存限制：
# -m 256m          硬限制 256MB（超过会被 OOM Killer 杀掉）
# --memory-reservation=200m  软限制（系统内存紧张时才生效）

# 示例：全面的资源限制
docker run -d --name limited-app \
    --cpus=1.0 \
    --memory=512m \
    --memory-swap=1g \
    --pids-limit=100 \
    nginx:alpine
# --memory-swap=1g：总内存+交换空间 1GB（其中 512M 物理内存 + 512M swap）
# --pids-limit=100：容器内最多 100 个 PID（防 fork 炸弹）
```

### 6.6 后续学习路径

完成本章后，建议按以下顺序继续深入学习容器生态：

1. **Docker Compose 进阶：** 环境变量替换（`${VAR}`）、extends 继承、profiles 按需启动服务、secrets/configs 管理
2. **Dockerfile 最佳实践深度：** 完整参考 [Docker 官方最佳实践指南](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
3. **容器网络深入：** overlay 网络、macvlan、ipvlan 驱动，理解 CNI（Container Network Interface，容器网络接口）
4. **容器存储深入：** 存储驱动对比（overlay2, devicemapper, btrfs）、CSI（Container Storage Interface，容器存储接口）
5. **Kubernetes 入门：** Pod、Deployment、Service、Ingress——K8s 的核心抽象
6. **CI/CD 中的容器：** 在 GitHub Actions、GitLab CI 中构建和推送 Docker 镜像
7. **容器安全深入：** Docker Bench Security、Podman（无守护进程的容器引擎）、gVisor/kata-containers（安全容器运行时）

---

**本章总结：**

容器是 Linux 命名空间（Namespace）和控制组（Cgroup）技术的集大成应用。Docker 通过镜像（Image）、容器（Container）、仓库（Registry）三大抽象，加上 Dockerfile 和 Docker Compose，为开发者提供了从代码构建到多服务编排的完整工具链。

关键记忆点：
- 容器是进程，虚拟机是操作系统——这是理解一切的基础
- Dockerfile 按"变化频率从低到高"排列指令以最大化构建缓存利用率
- Compose 负责单机编排，Kubernetes 负责集群编排
- 镜像分层是 Docker 快速、轻量的秘密——理解 UnionFS 就理解了 Docker
