# 15 - Docker 面试与工作场景题

> 本章目标：用问答方式复习 Docker 核心知识，能应对面试和真实工作任务。

---

## 1. 基础概念题

### 1.1 Docker 是什么？

答：Docker 是一个把应用、依赖、配置打包成镜像，并用容器运行、分发的工具。

---

### 1.2 镜像和容器区别？

答：

```text
镜像是只读模板。
容器是镜像运行后的实例。
一个镜像可以启动多个容器。
```

命令区别：

```text
docker images 查看镜像
docker ps 查看容器
docker rmi 删除镜像
docker rm 删除容器
```

---

### 1.3 Docker 和虚拟机区别？

答：虚拟机通常包含完整操作系统和独立内核；容器通常是宿主机内核上的隔离进程。容器启动快、资源占用少，但隔离方式不同，不能简单等同于虚拟机。

---

## 2. 命令题

### 2.1 docker run 和 docker start 区别？

```text
docker run：创建新容器并启动。
docker start：启动已经存在的容器。
```

---

### 2.2 docker ps 和 docker ps -a 区别？

```text
docker ps：只看正在运行的容器。
docker ps -a：查看所有容器，包括停止的。
```

---

### 2.3 如何查看容器日志？

```powershell
docker logs 容器名
docker logs -f 容器名
docker logs --tail 100 容器名
```

Compose：

```powershell
docker compose logs -f 服务名
```

---

### 2.4 如何进入容器？

```powershell
docker exec -it 容器名 sh
```

如果容器有 bash：

```powershell
docker exec -it 容器名 bash
```

---

## 3. Dockerfile 题

### 3.1 Dockerfile 是什么？

答：Dockerfile 是构建镜像的说明书。

流程：

```text
Dockerfile -> docker build -> image -> docker run -> container
```

---

### 3.2 CMD 和 ENTRYPOINT 区别？

```text
CMD 提供默认命令或参数，容易被 docker run 覆盖。
ENTRYPOINT 更像固定入口，不容易被普通参数覆盖。
```

---

### 3.3 COPY 和 ADD 区别？

```text
COPY 用于复制文件，语义简单清晰。
ADD 除了复制，还支持一些额外能力，例如本地 tar 自动解压。
普通复制优先使用 COPY。
```

---

### 3.4 EXPOSE 会自动开放端口吗？

答：不会。  
`EXPOSE` 只是声明容器内端口。宿主机访问容器仍需要：

```powershell
docker run -p 8080:80 镜像
```

---

### 3.5 如何优化镜像大小？

```text
使用更小基础镜像。
使用 .dockerignore。
减少无用依赖。
清理包管理器缓存。
使用多阶段构建。
不要复制无关文件。
```

---

## 4. 网络题

### 4.1 -p 8080:80 是什么意思？

```text
宿主机 8080 端口映射到容器 80 端口。
```

顺序：

```text
-p 宿主机端口:容器端口
```

---

### 4.2 容器之间为什么不能用 localhost 访问？

答：每个容器有自己的网络空间。  
在容器 A 里，`localhost` 指容器 A 自己，不是容器 B。

Compose 中应使用服务名：

```text
redis
mysql
db
app
```

---

### 4.3 如何让两个容器互通？

创建自定义网络：

```powershell
docker network create app-net
docker run -d --name web --network app-net nginx
docker run --rm --network app-net curlimages/curl http://web
```

---

## 5. Volume 题

### 5.1 volume 和 bind mount 区别？

| 对比 | volume | bind mount |
|---|---|---|
| 管理者 | Docker | 用户指定宿主机路径 |
| 适合 | 数据库、持久化数据 | 开发代码、配置文件 |
| 可移植性 | 较好 | 依赖宿主机路径 |

---

### 5.2 删除容器会删除 volume 吗？

答：不会自动删除。  
但下面命令会删除 Compose 创建的 volume：

```powershell
docker compose down -v
```

---

## 6. Compose 题

### 6.1 Docker Compose 是什么？

答：Compose 用一个 YAML 文件定义和管理多个容器。

常用命令：

```powershell
docker compose up -d
docker compose down
docker compose ps
docker compose logs
docker compose exec
```

---

### 6.2 depends_on 能保证数据库已经可用吗？

答：不一定。  
`depends_on` 可以控制启动顺序，但服务启动不等于服务可用。数据库初始化可能需要时间。应配合 healthcheck 或应用重试。

---

## 7. 原理题

### 7.1 Docker 隔离靠什么？

```text
namespace 做隔离。
cgroups 做资源限制。
OverlayFS/overlay2 做镜像分层和可写层。
capabilities、seccomp 等增强安全控制。
```

---

### 7.2 namespace 和 cgroups 区别？

```text
namespace 让容器看到独立世界。
cgroups 限制容器能用多少资源。
```

---

### 7.3 镜像为什么能分层？

答：镜像由多个只读层组成，不同镜像可以共享相同层。这样可以节省空间、加快构建和传输。

---

## 8. 排障题

### 8.1 容器启动后立刻退出怎么办？

```powershell
docker ps -a
docker logs 容器名
docker inspect 容器名
```

常见原因：

```text
主进程执行完了
启动命令错
缺少环境变量
应用报错
配置文件缺失
```

---

### 8.2 端口访问不了怎么办？

检查：

```powershell
docker ps
docker logs 容器名
```

重点看：

```text
容器是否运行
PORTS 是否有映射
-p 是否写反
宿主机端口是否冲突
应用是否监听正确地址
```

---

### 8.3 Docker 磁盘占满怎么办？

查看：

```powershell
docker system df
```

谨慎清理：

```powershell
docker image prune
docker builder prune
```

危险命令，执行前确认：

```powershell
docker system prune -a --volumes
```

---

## 9. 工作场景题

### 9.1 如何把一个应用 Docker 化？

```text
1. 分析应用运行方式。
2. 编写 Dockerfile。
3. 添加 .dockerignore。
4. 构建镜像。
5. 本地运行验证。
6. 写 compose.yml 管理依赖服务。
7. 配置 volume、network、environment。
8. 推送镜像仓库。
9. 在目标环境部署。
```

---

### 9.2 生产为什么不用 latest？

```text
latest 可能变化。
无法确认部署内容。
不利于回滚。
不利于排查。
```

生产应使用明确版本或 digest。

---

### 9.3 数据库容器化要注意什么？

```text
必须挂载 volume。
必须有备份。
不要轻易 docker compose down -v。
设置资源限制。
注意日志和磁盘。
生产中评估是否使用云数据库或专门数据库平台。
```

---

## 10. 面试自测清单

- [ ] 能解释 Docker 是什么
- [ ] 能解释镜像和容器区别
- [ ] 能解释 Docker 和虚拟机区别
- [ ] 能写基本 Dockerfile
- [ ] 能解释 CMD 和 ENTRYPOINT
- [ ] 能解释 COPY 和 ADD
- [ ] 能解释 volume 和 bind mount
- [ ] 能解释容器网络和端口映射
- [ ] 能写基本 compose.yml
- [ ] 能排查容器退出
- [ ] 能排查端口访问失败
- [ ] 能解释 namespace、cgroups、OverlayFS
- [ ] 知道 Docker 安全基本原则
- [ ] 知道生产不要依赖 latest

---

## 11. 官方资料

- Docker overview：https://docs.docker.com/get-started/docker-overview/
- Dockerfile 参考：https://docs.docker.com/reference/dockerfile/
- Docker Compose：https://docs.docker.com/compose/
- Docker network：https://docs.docker.com/engine/network/
- Docker storage：https://docs.docker.com/engine/storage/
- Docker security：https://docs.docker.com/engine/security/
