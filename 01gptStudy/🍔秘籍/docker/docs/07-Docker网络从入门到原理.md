# 07 - Docker 网络从入门到原理

> 本章目标：理解容器网络的基本模型，掌握端口映射、自定义网络、容器互通和常见网络排查。

---

## 1. 先记住一句话

```text
容器有自己的网络空间；宿主机访问容器服务通常需要端口映射；容器之间通信推荐使用自定义 bridge 网络和容器名。
```

---

## 2. 核心命令

```powershell
docker network ls
docker network create
docker network inspect
docker network rm
docker run --network
docker run -p
```

---

## 3. 查看 Docker 网络

```powershell
docker network ls
```

常见网络：

| 网络 | 说明 |
|---|---|
| bridge | 默认桥接网络，单机最常见 |
| host | 使用宿主机网络，Linux 上常见 |
| none | 不配置网络 |

Docker 还支持 overlay、macvlan 等网络驱动，后续生产或集群场景再深入。

---

## 4. 端口映射

启动 nginx：

```powershell
docker run -d --name web-net-demo -p 8080:80 nginx
```

含义：

```text
宿主机 8080 端口 -> 容器 80 端口
```

访问：

```text
http://localhost:8080
```

顺序必须记住：

```text
-p 宿主机端口:容器端口
```

---

## 5. EXPOSE 和 -p 的区别

Dockerfile 中：

```dockerfile
EXPOSE 80
```

只是声明容器内服务端口，不会自动映射到宿主机。

真正映射端口：

```powershell
docker run -p 8080:80 nginx
```

---

## 6. 默认 bridge 网络

如果你执行：

```powershell
docker run -d --name web1 nginx
```

不指定网络时，容器通常会进入默认 `bridge` 网络。

查看：

```powershell
docker inspect web1
```

重点看：

```text
NetworkSettings
```

---

## 7. 创建自定义 bridge 网络

```powershell
docker network create app-net
```

查看：

```powershell
docker network ls
```

详细信息：

```powershell
docker network inspect app-net
```

---

## 8. 容器通过名字通信

创建网络：

```powershell
docker network create app-net
```

启动 nginx：

```powershell
docker run -d --name web --network app-net nginx
```

启动临时 curl 容器测试：

```powershell
docker run --rm --network app-net curlimages/curl http://web
```

重点：在同一个自定义 bridge 网络中，容器可以通过容器名解析。

---

## 9. 为什么推荐自定义 bridge

自定义 bridge 网络优点：

```text
容器名 DNS 解析更方便
隔离不同项目
便于管理
Compose 默认也会为项目创建网络
```

默认 bridge 适合简单练习，自定义 bridge 更适合实际项目。

---

## 10. 容器访问宿主机

在 Docker Desktop 中，容器访问宿主机可以尝试：

```text
host.docker.internal
```

例如容器访问宿主机 3000 端口服务：

```text
http://host.docker.internal:3000
```

注意：不同平台和环境行为可能不同，以 Docker 官方文档和实际环境为准。

---

## 11. 宿主机访问容器

宿主机访问容器服务一般靠端口映射：

```powershell
docker run -d --name web -p 8080:80 nginx
```

然后访问：

```text
http://localhost:8080
```

如果没有 `-p`，宿主机通常不能直接通过 localhost 访问容器服务。

---

## 12. 容器访问外网

多数情况下，容器可以访问外网：

```powershell
docker run --rm curlimages/curl https://example.com
```

如果失败，可能是：

```text
宿主机网络问题
DNS 问题
代理问题
公司网络限制
Docker Desktop 网络配置问题
```

---

## 13. none 网络

```powershell
docker run -it --rm --network none alpine sh
```

容器没有普通网络连接。  
适合极端隔离测试，一般初学不常用。

---

## 14. host 网络

Linux 上可以使用：

```powershell
docker run --network host nginx
```

它让容器直接使用宿主机网络命名空间。  
这会减少隔离，端口也更容易冲突。Docker Desktop 上行为和 Linux 原生环境可能不同，初学阶段不建议依赖它。

---

## 15. Compose 中的网络

`compose.yml` 示例：

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
  redis:
    image: redis:7-alpine
```

Compose 默认会为这个项目创建一个网络。  
同一 Compose 项目里的服务可以用服务名通信，例如 `web` 访问 `redis:6379`。

---

## 16. 底层简单理解

Linux 上 Docker bridge 网络大致涉及：

```text
network namespace：每个容器有独立网络空间
veth pair：连接容器和宿主机桥
bridge：类似虚拟交换机
iptables/nftables：做 NAT 和端口转发
DNS：自定义网络中解析容器名
```

初学不用背细节，但要知道：

```text
容器不是直接等于宿主机网络。
端口映射是从宿主机转发到容器。
```

---

## 17. 常见问题排查

### 17.1 localhost 访问失败

检查：

```powershell
docker ps
```

看 `PORTS` 是否有：

```text
0.0.0.0:8080->80/tcp
```

没有就说明端口没有映射或映射错了。

### 17.2 容器之间访问失败

检查：

```powershell
docker network ls
docker network inspect 网络名
docker inspect 容器名
```

确认两个容器是否在同一个网络。

### 17.3 端口冲突

换宿主机端口：

```powershell
docker run -p 8081:80 nginx
```

### 17.4 DNS 解析失败

确保使用自定义 bridge 网络，不要乱用默认 bridge。

---

## 18. 本章练习

1. 创建网络 `practice-net`。
2. 在 `practice-net` 中启动 nginx，命名为 `web`。
3. 使用 curl 容器访问 `http://web`。
4. 用 `docker network inspect practice-net` 查看容器。
5. 删除容器和网络。

命令参考：

```powershell
docker network create practice-net
docker run -d --name web --network practice-net nginx
docker run --rm --network practice-net curlimages/curl http://web
docker stop web
docker rm web
docker network rm practice-net
```

---

## 19. 本章总结

```text
1. 容器有自己的网络空间。
2. 宿主机访问容器通常需要 -p。
3. -p 格式是 宿主机端口:容器端口。
4. 自定义 bridge 网络可以让容器通过名字通信。
5. Compose 默认会为项目创建网络。
6. 网络排查先看 docker ps、inspect、network inspect。
```

---

## 20. 官方资料

- Docker networking 概览：https://docs.docker.com/engine/network/
- Bridge 网络驱动：https://docs.docker.com/engine/network/drivers/bridge/
- Host 网络驱动：https://docs.docker.com/engine/network/drivers/host/
- Overlay 网络驱动：https://docs.docker.com/engine/network/drivers/overlay/
