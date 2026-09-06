# 01 - 零基础认识 Docker

> 本章目标：不用复杂术语，先把 Docker 的核心概念讲清楚。

---

## 1. 本章目标

学完本章，你要能回答：

```text
Docker 是什么？
Docker 解决什么问题？
镜像和容器有什么区别？
Docker 和虚拟机有什么区别？
Docker 大概由哪些部分组成？
```

---

## 2. 先看一个真实场景

你写了一个网站，在自己电脑能运行。  
发给同事后，同事说：

```text
我这里运行不了。
```

可能原因：

```text
你的 Python 是 3.12，他的是 3.10
你的 Node.js 是 20，他的是 18
你电脑有某个依赖，他没有
你的环境变量配置了，他没配置
你用 MySQL 8，他用 MySQL 5.7
你电脑端口没冲突，他电脑端口被占用
```

这就是经典问题：

```text
在我电脑上明明能跑，为什么换一台机器就不能跑？
```

Docker 就是为了解决这类问题。

---

## 3. Docker 是什么

### 3.1 一句话解释

**Docker 是一个把应用、依赖、配置打包成镜像，并用容器运行的工具。**

### 3.2 生活类比

可以把 Docker 理解成“标准外卖盒”：

```text
饭菜 = 应用程序
餐具 = 依赖
调料 = 配置
外卖盒 = 镜像
打开盒子开始吃 = 运行容器
```

没有 Docker：每台机器都要手动准备环境。  
有 Docker：环境被提前打包，换机器也更容易运行。

---

## 4. Docker 主要解决的问题

### 4.1 环境一致

以前经常出现：

```text
开发环境能跑
测试环境不能跑
生产环境又出问题
```

Docker 的思路：

```text
把应用运行需要的环境一起打包。
```

---

### 4.2 部署简单

不用 Docker 时，部署可能需要：

```text
安装语言环境
安装系统依赖
安装数据库客户端
修改配置文件
配置环境变量
启动服务
```

用 Docker 后，常见方式变成：

```powershell
docker run 应用镜像
```

多服务项目可以使用：

```powershell
docker compose up -d
```

---

### 4.3 应用隔离

不同项目可能需要不同软件版本：

```text
项目 A 需要 Redis 6
项目 B 需要 Redis 7
项目 C 需要 MySQL 5.7
项目 D 需要 MySQL 8.0
```

如果全都装在宿主机，容易冲突。  
如果放进不同容器，彼此隔离，管理更清楚。

---

### 4.4 方便迁移

Docker 常见流程：

```text
写 Dockerfile
-> 构建镜像
-> 推送镜像仓库
-> 在另一台机器拉取镜像
-> 运行容器
```

这样部署更标准。

---

## 5. 镜像 image

### 5.1 一句话解释

**镜像是创建容器的模板。**

### 5.2 类比

镜像像：

```text
菜谱
安装包
模具
游戏安装文件
```

例如：

```text
nginx 镜像
mysql 镜像
redis 镜像
ubuntu 镜像
python 镜像
node 镜像
```

镜像一般不是“正在运行”的东西。  
它是准备好的模板。

查看镜像：

```powershell
docker images
```

---

## 6. 容器 container

### 6.1 一句话解释

**容器是镜像运行起来后的实例。**

如果镜像是菜谱，容器就是做出来的一盘菜。  
如果镜像是安装包，容器就是安装后正在运行的软件。

启动容器：

```powershell
docker run nginx
```

查看正在运行的容器：

```powershell
docker ps
```

查看所有容器：

```powershell
docker ps -a
```

---

## 7. 镜像和容器的区别

| 对比 | 镜像 image | 容器 container |
|---|---|---|
| 本质 | 模板 | 运行实例 |
| 是否运行 | 不运行 | 可以运行 |
| 类比 | 菜谱 | 做出来的菜 |
| 查看命令 | `docker images` | `docker ps` |
| 删除命令 | `docker rmi` | `docker rm` |

记忆口诀：

```text
镜像负责“造容器”。
容器负责“跑程序”。
```

一个镜像可以启动多个容器。

---

## 8. Docker 和虚拟机的区别

### 8.1 虚拟机

虚拟机通常包含：

```text
应用
依赖
完整操作系统
虚拟硬件
```

优点：隔离强。  
缺点：启动慢、占资源多。

### 8.2 Docker 容器

Docker 容器通常包含：

```text
应用
依赖
必要文件系统
隔离环境
```

容器不是完整虚拟机。  
Linux 容器通常共享宿主机提供的 Linux 内核能力，更像“被隔离起来的进程”。

| 对比 | Docker 容器 | 虚拟机 |
|---|---|---|
| 启动速度 | 通常很快 | 通常较慢 |
| 资源占用 | 较少 | 较多 |
| 是否包含完整操作系统 | 通常不包含完整系统内核 | 通常包含完整操作系统 |
| 隔离方式 | 进程级隔离 | 硬件虚拟化隔离 |
| 常见用途 | 应用部署、开发环境、微服务 | 多系统测试、强隔离场景 |

类比：

```text
虚拟机像一套完整出租房。
容器像一个隔开的工作间。
```

---

## 9. Docker 的基本组成

初学阶段先认识这些：

```text
Docker Client
Docker Daemon
Docker Image
Docker Container
Docker Registry
Docker Compose
Docker Desktop
```

### 9.1 Docker Client

你在终端输入的 `docker` 命令，就是 Docker Client。

例如：

```powershell
docker ps
```

它负责把你的命令发给 Docker 后台服务。

### 9.2 Docker Daemon

Docker Daemon 是 Docker 后台服务。  
它真正管理：

```text
镜像
容器
网络
数据卷
```

### 9.3 Docker Registry

Registry 是镜像仓库。  
常见公共仓库是 Docker Hub。

例如：

```powershell
docker pull nginx
```

就是从仓库拉取 `nginx` 镜像。

### 9.4 Docker Desktop

Windows 和 macOS 上常用 Docker Desktop。  
它提供图形界面和 Docker 运行环境。

### 9.5 Docker Compose

Docker Compose 用来管理多个容器。  
例如一个项目需要：

```text
web
mysql
redis
nginx
```

就可以写在一个 `compose.yml` 里，然后执行：

```powershell
docker compose up -d
```

---

## 10. Docker 的基本流程

```text
Dockerfile -> docker build -> image -> docker run -> container
```

解释：

```text
Dockerfile 是说明书。
docker build 是制作镜像。
image 是制作好的模板。
docker run 是运行镜像。
container 是运行出来的实例。
```

---

## 11. 初学者常见误区

### 误区 1：把镜像当容器

错误：

```text
我删除容器后，镜像也没了。
```

正确：

```text
删除容器不会自动删除镜像。
```

---

### 误区 2：把容器当完整虚拟机

不推荐：

```text
进入容器后手动安装一堆软件，然后长期依赖这个容器。
```

推荐：

```text
把安装步骤写进 Dockerfile，重新构建镜像。
```

---

### 误区 3：以为容器数据天然安全

容器删除后，容器内部数据可能丢失。  
重要数据要使用：

```text
volume
bind mount
外部数据库
```

---

### 误区 4：以为 localhost 永远能访问容器

容器有自己的网络空间。  
宿主机访问容器服务，通常需要端口映射：

```powershell
docker run -p 8080:80 nginx
```

意思是：

```text
宿主机 8080 端口 -> 容器 80 端口
```

---

## 12. 本章练习

### 练习 1

用自己的话解释 Docker：

```text
Docker 是：____________________________
```

参考答案：

```text
Docker 是把应用和依赖打包成镜像，并用容器运行的工具。
```

### 练习 2

判断：镜像是运行中的程序。

答案：错误。镜像是模板，容器才是运行实例。

### 练习 3

判断：一个镜像可以启动多个容器。

答案：正确。

### 练习 4

Docker 容器是不是完整虚拟机？

答案：不是。容器更像被隔离起来的进程。

---

## 13. 本章总结

必须记住 5 句话：

```text
1. Docker 用来打包、运行、分发应用。
2. 镜像是模板。
3. 容器是镜像运行后的实例。
4. Docker 容器不是完整虚拟机。
5. Docker Compose 用来管理多个容器。
```

---

## 14. 下一章

下一章：

```text
02-Docker安装与环境检查.md
```

你要完成：

```text
安装 Docker Desktop
检查 Docker 是否正常
运行 hello-world
运行 nginx
```

---

## 15. 官方资料

- Docker 官方文档：https://docs.docker.com/
- Docker 运行容器：https://docs.docker.com/engine/containers/run/
- Docker CLI 参考：https://docs.docker.com/reference/cli/docker/
