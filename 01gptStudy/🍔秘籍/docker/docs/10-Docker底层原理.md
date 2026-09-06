# 10 - Docker 底层原理

> 本章目标：从“会用 Docker”进入“懂 Docker”。你不需要一开始背术语，但要理解容器为什么能隔离、镜像为什么能分层、Docker 为什么启动快。

---

## 1. 先记住核心结论

```text
容器不是完整虚拟机。
容器本质上是被 Linux 内核能力隔离和限制起来的进程。
镜像是分层文件系统。
Docker 通过 namespace 做隔离，通过 cgroups 做资源限制，通过 OverlayFS 做镜像分层。
```

---

## 2. Docker 整体架构

简化架构：

```text
你输入 docker 命令
        ↓
Docker Client
        ↓
Docker Daemon / Docker Engine
        ↓
containerd
        ↓
runc
        ↓
Linux kernel
        ↓
容器进程
```

初学解释：

| 组件 | 通俗解释 |
|---|---|
| Docker Client | 你输入 `docker` 命令的工具 |
| Docker Daemon | Docker 后台服务，管理镜像、容器、网络、卷 |
| containerd | 容器运行时管理组件 |
| runc | 真正创建容器进程的低层工具 |
| Linux kernel | 提供 namespace、cgroups、文件系统、网络等能力 |

---

## 3. docker run 背后发生了什么

执行：

```powershell
docker run -d --name web -p 8080:80 nginx
```

大致流程：

```text
1. Docker Client 把请求发给 Docker Daemon。
2. Daemon 检查本地是否有 nginx 镜像。
3. 没有镜像就从 registry 拉取。
4. 准备容器文件系统。
5. 创建网络、挂载 volume、设置端口转发。
6. 调用 containerd / runc 创建隔离进程。
7. 容器中的主进程启动。
```

---

## 4. 容器为什么不是虚拟机

虚拟机通常有：

```text
虚拟硬件
完整操作系统
独立内核
应用和依赖
```

容器通常是：

```text
宿主机内核上的隔离进程
独立文件系统视图
独立进程空间
独立网络空间
资源限制
```

所以容器通常启动更快、占用更少。  
但容器的隔离边界和虚拟机不一样，不能简单地把容器当成完整虚拟机。

---

## 5. namespace：隔离

namespace 的作用：

```text
让容器看起来像有自己的系统环境。
```

常见 namespace：

| namespace | 作用 |
|---|---|
| PID | 隔离进程编号，容器内可以看到自己的进程树 |
| NET | 隔离网络设备、IP、路由、端口 |
| MNT | 隔离挂载点和文件系统视图 |
| UTS | 隔离 hostname |
| IPC | 隔离进程间通信资源 |
| USER | 隔离用户和用户组映射 |

通俗理解：

```text
namespace 让容器“看到的世界”变小。
```

---

## 6. PID namespace 示例理解

宿主机上有很多进程。  
容器里面执行：

```sh
ps
```

可能只看到几个进程。  
这不是宿主机真的只有几个进程，而是 PID namespace 让容器只能看到自己的进程空间。

---

## 7. network namespace 示例理解

容器有自己的网络设备和 IP。  
容器里的 `localhost` 指的是容器自己，不是宿主机。

这就是为什么：

```text
应用在容器内监听 127.0.0.1，不一定能被其他容器访问。
宿主机访问容器服务通常需要 -p 端口映射。
```

---

## 8. cgroups：资源限制

cgroups 的作用：

```text
限制和统计进程使用的 CPU、内存、IO 等资源。
```

例如限制容器内存：

```powershell
docker run -d --name limited-nginx --memory 256m nginx
```

限制 CPU：

```powershell
docker run -d --name cpu-nginx --cpus 0.5 nginx
```

通俗理解：

```text
namespace 负责隔离“看到什么”。
cgroups 负责限制“能用多少”。
```

---

## 9. 镜像为什么是分层的

Docker 镜像由多层只读层组成。  
每个 Dockerfile 指令可能产生一层。

例如：

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y curl
COPY app /app
CMD ["/app"]
```

可能形成：

```text
基础层
安装 curl 的层
复制 app 的层
元数据层
```

好处：

```text
不同镜像可以共享相同层
拉取镜像时只下载缺少的层
构建时可以使用缓存
```

---

## 10. OverlayFS / overlay2

Docker 在 Linux 上常见使用 `overlay2` 存储驱动。

简单理解：

```text
多个只读镜像层 + 容器自己的可写层 = 容器看到的完整文件系统
```

容器运行时写文件，通常写到容器可写层。  
这也是为什么容器删除后，可写层数据会丢。

重要数据要用：

```text
volume
bind mount
外部存储
```

---

## 11. copy-on-write

copy-on-write 可以理解为：

```text
不改文件时共享原来的镜像层。
要改文件时，再复制一份到可写层进行修改。
```

好处：

```text
节省空间
容器创建更快
镜像层可复用
```

---

## 12. 容器主进程

每个容器都有一个主进程。  
这个主进程结束，容器通常就退出。

例如：

```powershell
docker run alpine echo hello
```

`echo hello` 执行完，容器就退出。

而：

```powershell
docker run -d nginx
```

nginx 主进程持续运行，所以容器保持运行。

---

## 13. ENTRYPOINT / CMD 与主进程

Dockerfile 里的：

```dockerfile
ENTRYPOINT
CMD
```

决定容器默认启动什么进程。  
如果启动命令写错，容器可能立即退出。

排查：

```powershell
docker ps -a
docker logs 容器名
docker inspect 容器名
```

---

## 14. Docker 网络底层简化

单机 bridge 网络大致有：

```text
容器 network namespace
veth pair
Linux bridge
dns
NAT / 端口转发
```

宿主机访问容器：

```text
localhost:8080 -> 端口转发 -> 容器IP:80
```

容器互相访问：

```text
容器A -> Docker bridge -> 容器B
```

自定义 bridge 网络中，Docker 提供服务名 DNS 解析。

---

## 15. Docker volume 底层理解

volume 是 Docker 管理的宿主机目录。  
容器通过挂载看到这个目录。

删除容器：

```text
容器可写层删除
volume 不会自动删除
```

这就是 volume 能持久保存数据的原因。

---

## 16. OCI 是什么

OCI 全称：

```text
Open Container Initiative
```

它定义了容器镜像格式和运行时规范。  
Docker、containerd、runc 等都与 OCI 生态相关。

通俗理解：

```text
OCI 是容器行业的标准协议。
大家按标准来，镜像和运行时更容易兼容。
```

---

## 17. 一张总图

```text
Dockerfile
   ↓ build
Image：只读分层文件系统
   ↓ run
Container：镜像层 + 可写层 + namespace + cgroups + network + mounts
   ↓
容器主进程运行
```

---

## 18. 常见面试级理解

### Docker 为什么启动快？

```text
因为容器不是启动完整虚拟机，而是在宿主机内核上启动隔离进程，并复用镜像层。
```

### 容器隔离靠什么？

```text
主要靠 namespace 隔离视图，cgroups 限制资源，再配合 capabilities、seccomp、文件系统和网络规则。
```

### 镜像为什么能复用？

```text
因为镜像是分层的，不同镜像可以共享相同只读层。
```

---

## 19. 本章练习

1. 运行 `docker history nginx:alpine` 观察镜像层。
2. 运行 `docker inspect nginx:alpine` 查看 RootFS。
3. 启动 alpine 容器，执行 `ps`，观察容器内进程。
4. 启动 nginx，执行 `docker inspect` 查看网络信息。
5. 用 `--memory 128m` 启动容器，理解资源限制。

---

## 20. 本章总结

```text
1. 容器不是完整虚拟机，是被隔离和限制的进程。
2. namespace 做隔离。
3. cgroups 做资源限制。
4. OverlayFS/overlay2 实现镜像分层和容器可写层。
5. 容器主进程结束，容器通常退出。
6. Docker Client 把命令交给 Docker Daemon。
7. Docker 底层还涉及 containerd、runc、OCI。
```

---

## 21. 官方资料

- Docker overview：https://docs.docker.com/get-started/docker-overview/
- Docker Engine：https://docs.docker.com/engine/
- Docker storage drivers：https://docs.docker.com/engine/storage/drivers/
- OverlayFS driver：https://docs.docker.com/engine/storage/drivers/overlayfs-driver/
- Resource constraints：https://docs.docker.com/engine/containers/resource_constraints/
- OCI：https://opencontainers.org/
