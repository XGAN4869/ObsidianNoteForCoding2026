# 00 - Docker 学习总路线

> 目标：从零基础开始，循序渐进掌握 Docker 的使用、原理、排错和工作实践。  
> 学习原则：先会用，再懂原理；一次只学一个重点；每个命令都亲手敲。

---

## 1. Docker 一句话理解

**Docker 是一个把应用、依赖、配置一起打包，并用容器运行的工具。**

生活类比：

```text
镜像 image      = 菜谱 / 安装包 / 模具
容器 container  = 做出来的菜 / 正在运行的软件
Dockerfile      = 制作镜像的说明书
registry        = 镜像仓库 / 应用商店
volume          = 容器外面的硬盘
network         = 容器之间的网线
```

---

## 2. 学完后你要达到的能力

### 2.1 会用 Docker

你能熟练操作：

```powershell
docker version
docker info
docker run
docker ps
docker ps -a
docker stop
docker start
docker restart
docker rm
docker logs
docker exec
docker inspect
docker images
docker pull
docker rmi
docker build
docker compose up
docker compose down
```

### 2.2 会写 Dockerfile

你能把一个普通应用做成镜像，例如：

```dockerfile
FROM nginx:alpine
COPY ./html /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 会用 Docker Compose

你能用一个 `compose.yml` 一次启动多个服务，例如：

```text
前端容器
后端容器
MySQL 容器
Redis 容器
Nginx 容器
```

### 2.4 懂核心原理

你要逐步理解：

```text
镜像分层
容器生命周期
namespace 隔离
cgroups 资源限制
OverlayFS / UnionFS
Docker Client / Docker Daemon
containerd / runc / OCI
Docker 网络
Docker volume
```

### 2.5 能排查问题

你要能处理：

```text
容器启动失败
容器启动后立刻退出
端口访问不了
容器之间不通
镜像拉取失败
Dockerfile 构建失败
数据库数据丢失
Docker 占用磁盘太多
权限问题
日志过大
```

---

## 3. 总学习路线

| 阶段 | 文档 | 学习目标 |
|---|---|---|
| 0 | `00-Docker学习总路线.md` | 了解全局路线，不迷路 |
| 1 | `01-零基础认识Docker.md` | 明白 Docker 是什么、解决什么问题 |
| 2 | `02-Docker安装与环境检查.md` | 安装 Docker 并运行第一个容器 |
| 3 | `03-容器基础命令.md` | 会启动、查看、停止、删除容器 |
| 4 | `04-镜像基础命令.md` | 会拉取、查看、删除、管理镜像 |
| 5 | `05-Dockerfile从零到掌握.md` | 会制作自己的镜像 |
| 6 | `06-数据卷Volume与BindMount.md` | 会持久化数据 |
| 7 | `07-Docker网络从入门到原理.md` | 会配置和排查容器网络 |
| 8 | `08-Docker-Compose从入门到实战.md` | 会管理多容器项目 |
| 9 | `09-Docker镜像仓库Registry.md` | 会推送、拉取、管理镜像版本 |
| 10 | `10-Docker底层原理.md` | 理解 Docker 为什么能隔离、为什么启动快 |
| 11 | `11-Docker安全基础.md` | 知道安全边界和常见风险 |
| 12 | `12-Docker日志与故障排查.md` | 掌握排障方法 |
| 13 | `13-Docker生产实践.md` | 知道工作中怎么用得稳 |
| 14 | `14-Docker综合项目实战.md` | 用项目串联所有知识 |
| 15 | `15-Docker面试与工作场景题.md` | 面试和工作场景复盘 |

---

## 4. 推荐学习节奏

如果每天学习 1 到 2 小时：

| 周数 | 内容 | 检查标准 |
|---|---|---|
| 第 1 周 | Docker 是什么、安装、hello-world、nginx | 能跑通第一个容器 |
| 第 2 周 | 容器命令 | 会 `run/ps/stop/start/rm/logs/exec` |
| 第 3 周 | 镜像命令 | 会 `pull/images/rmi/tag/save/load` |
| 第 4 周 | Dockerfile | 能构建自己的镜像 |
| 第 5 周 | volume 和 network | 数据不丢，容器能互通 |
| 第 6 周 | Docker Compose | 一个命令启动多个服务 |
| 第 7 周 | Registry | 会推送和拉取镜像 |
| 第 8 周 | 底层原理 | 能解释 namespace、cgroups、OverlayFS |
| 第 9 周 | 排障和安全 | 会查日志、查端口、查挂载、查网络 |
| 第 10 周 | 综合项目 | 独立完成一个容器化项目 |

---

## 5. 每章学习方法

每一章都按这个顺序学习：

```text
1. 看本章目标
2. 读通俗解释
3. 抄核心命令
4. 亲手执行命令
5. 故意制造一个小错误
6. 用 logs / ps / inspect 排查
7. 完成练习题
8. 用自己的话写总结
```

不要只看不练。Docker 是操作型技能，必须动手。

---

## 6. 初学阶段最重要的 10 个命令

```powershell
docker version          # 查看 Docker 客户端和服务端版本
docker info             # 查看 Docker 系统信息
docker run              # 创建并启动容器
docker ps               # 查看正在运行的容器
docker ps -a            # 查看所有容器
docker stop             # 停止容器
docker start            # 启动已存在容器
docker rm               # 删除容器
docker logs             # 查看容器日志
docker exec -it         # 进入容器或在容器里执行命令
```

---

## 7. 安全提醒

初学阶段不要随便执行这些命令：

```powershell
docker system prune -a
docker system prune --volumes
docker rm -f $(docker ps -aq)
docker volume rm 数据卷名
```

原因：它们可能删除容器、镜像、缓存，甚至删除重要数据。

---

## 8. 学习检查表

完成基础阶段后，你应该能做到：

- [ ] 我能解释 Docker 是什么
- [ ] 我能解释镜像和容器的区别
- [ ] 我能安装并启动 Docker Desktop
- [ ] 我能运行 `docker run hello-world`
- [ ] 我能运行 nginx 容器
- [ ] 我能用浏览器访问 nginx
- [ ] 我能查看正在运行的容器
- [ ] 我能查看所有容器
- [ ] 我能停止、启动、删除容器
- [ ] 我能查看日志
- [ ] 我能进入容器内部
- [ ] 我知道删除容器不等于删除镜像

---

## 9. 官方资料

遇到命令细节不确定时，以官方文档为准：

- Docker 官方文档：https://docs.docker.com/
- Docker CLI 参考：https://docs.docker.com/reference/cli/docker/
- Dockerfile 参考：https://docs.docker.com/reference/dockerfile/
- Docker Compose 文档：https://docs.docker.com/compose/
- Windows 安装 Docker Desktop：https://docs.docker.com/desktop/setup/install/windows-install/

---

## 10. 下一步

下一章：

```text
01-零基础认识Docker.md
```

你要先理解：

```text
Docker 到底解决了什么问题？
为什么公司要用 Docker？
Docker 和虚拟机有什么区别？
```
