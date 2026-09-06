# 12 - Docker 日志与故障排查

> 本章目标：遇到 Docker 问题时不慌，按照固定流程查状态、看日志、看配置、看网络、看磁盘。

---

## 1. 排障总原则

遇到问题按顺序查：

```text
1. docker ps -a 看容器状态
2. docker logs 看日志
3. docker inspect 看详细配置
4. docker events 看事件
5. docker stats 看资源
6. docker system df 看磁盘
7. 检查端口、网络、volume、环境变量
```

不要一上来就删除重装。

---

## 2. 核心排障命令

```powershell
docker ps
docker ps -a
docker logs 容器名
docker logs -f 容器名
docker inspect 容器名
docker events
docker stats
docker top 容器名
docker exec -it 容器名 sh
docker system df
docker network inspect 网络名
docker volume inspect 卷名
docker compose logs
docker compose ps
```

---

## 3. 查看容器状态

```powershell
docker ps -a
```

重点看 `STATUS`：

| 状态 | 含义 |
|---|---|
| Up | 正在运行 |
| Exited | 已退出 |
| Restarting | 不断重启 |
| Created | 已创建但未运行 |
| Paused | 暂停 |

---

## 4. 容器启动后立刻退出

先看：

```powershell
docker ps -a
docker logs 容器名
```

常见原因：

```text
主进程执行完了
CMD/ENTRYPOINT 写错
应用启动报错
缺少环境变量
缺少配置文件
端口或权限问题
```

示例：

```powershell
docker run alpine echo hello
```

这个容器会正常退出，因为 `echo hello` 执行完了。

---

## 5. 查看日志

```powershell
docker logs 容器名
```

持续查看：

```powershell
docker logs -f 容器名
```

查看最后 100 行：

```powershell
docker logs --tail 100 容器名
```

带时间戳：

```powershell
docker logs -t 容器名
```

Compose 日志：

```powershell
docker compose logs
docker compose logs -f app
```

---

## 6. 端口访问不了

检查容器是否运行：

```powershell
docker ps
```

看 `PORTS` 是否正确：

```text
0.0.0.0:8080->80/tcp
```

常见错误：

```text
忘记 -p
-p 顺序写反
宿主机端口被占用
应用只监听 127.0.0.1
容器内服务没有启动
防火墙或代理影响
```

正确格式：

```powershell
docker run -p 宿主机端口:容器端口 镜像
```

---

## 7. 容器之间无法通信

检查网络：

```powershell
docker network ls
docker network inspect 网络名
docker inspect 容器名
```

常见原因：

```text
两个容器不在同一个网络
使用了 localhost 作为对方地址
服务没监听正确地址
端口写错
DNS 名称写错
```

Compose 中，服务之间通常用服务名访问：

```text
http://redis:6379
mysql://db:3306
```

不要写 `localhost` 连接另一个容器。

---

## 8. 数据丢失

先问：

```text
有没有使用 volume？
有没有执行 docker compose down -v？
有没有删除 volume？
挂载路径是否正确？
数据库数据目录是否挂对？
```

查看 volume：

```powershell
docker volume ls
docker volume inspect 卷名
```

警告：

```powershell
docker compose down -v
```

会删除 Compose 管理的 volume。

---

## 9. 镜像构建失败

常见原因：

```text
Dockerfile 路径错误
构建上下文错误
COPY 文件不存在
依赖安装失败
网络问题
基础镜像拉取失败
命令在镜像系统中不存在
```

排查：

```powershell
docker build --no-cache -t my-app:debug .
```

查看 Dockerfile 中失败的那一行。

---

## 10. 权限问题

常见表现：

```text
Permission denied
cannot write file
bind mount 目录无法写入
非 root 用户无法访问目录
```

排查：

```powershell
docker exec -it 容器名 sh
id
ls -la 路径
```

处理思路：

```text
确认容器内用户是谁
确认目录属主和权限
确认挂载路径是否只读
不要简单粗暴 chmod 777，先理解原因
```

---

## 11. Docker 占用磁盘太多

查看：

```powershell
docker system df
```

可能占空间的对象：

```text
镜像
停止的容器
volume
构建缓存
日志
```

清理 dangling 镜像：

```powershell
docker image prune
```

清理构建缓存：

```powershell
docker builder prune
```

谨慎命令：

```powershell
docker system prune -a --volumes
```

这可能删除大量数据，执行前必须确认。

---

## 12. 容器不断重启

查看：

```powershell
docker ps -a
docker logs 容器名
docker inspect 容器名
```

常见原因：

```text
restart 策略导致失败后自动重启
应用启动就崩溃
健康检查失败
依赖服务不可用
配置错误
```

处理：先看日志，不要直接删除。

---

## 13. inspect 怎么看

```powershell
docker inspect 容器名
```

重点字段：

```text
State：运行状态和退出码
Config：环境变量和命令
HostConfig：端口、挂载、资源限制
Mounts：挂载信息
NetworkSettings：网络信息
```

---

## 14. 退出码简单理解

常见退出码：

| 退出码 | 常见含义 |
|---|---|
| 0 | 正常退出 |
| 1 | 一般错误 |
| 126 | 命令不能执行 |
| 127 | 命令不存在 |
| 137 | 可能被 kill，常见于内存不足 |

退出码只提供线索，最终还要结合日志判断。

---

## 15. 标准排障模板

遇到问题时，按这个模板记录：

```text
问题现象：
执行命令：
期望结果：
实际结果：
容器状态 docker ps -a：
日志 docker logs：
端口映射：
网络：
volume：
环境变量：
我已经尝试：
下一步：
```

---

## 16. 本章练习

1. 故意运行一个会退出的容器：`docker run alpine echo hello`，用 `ps -a` 查看。
2. 启动 nginx 不加 `-p`，观察为什么浏览器访问不了。
3. 用错误端口映射启动 nginx，再修正。
4. 在 Compose 中把 DB_HOST 写成 localhost，观察连接失败原因。
5. 使用 `docker system df` 查看磁盘占用。

---

## 17. 本章总结

```text
1. 排障先看 docker ps -a。
2. 再看 docker logs。
3. 配置问题看 docker inspect。
4. 网络问题看 docker network inspect。
5. 数据问题看 docker volume inspect。
6. 磁盘问题看 docker system df。
7. 不要遇到问题就重装，先收集证据。
```

---

## 18. 官方资料

- `docker logs`：https://docs.docker.com/reference/cli/docker/container/logs/
- `docker inspect`：https://docs.docker.com/reference/cli/docker/inspect/
- `docker system df`：https://docs.docker.com/reference/cli/docker/system/df/
- Logging drivers：https://docs.docker.com/engine/logging/configure/
- Docker Compose logs：https://docs.docker.com/reference/cli/docker/compose/logs/
