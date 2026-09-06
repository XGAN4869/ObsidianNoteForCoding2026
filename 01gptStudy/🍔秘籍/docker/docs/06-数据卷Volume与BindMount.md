# 06 - 数据卷 Volume 与 Bind Mount

> 本章目标：理解容器数据为什么会丢，掌握 volume 和 bind mount 的使用与区别。

---

## 1. 为什么需要数据持久化

容器通常是可以删除、重建的。  
如果数据只写在容器内部，删除容器后数据可能丢失。

典型例子：

```text
MySQL 数据库文件
Redis 持久化文件
上传的图片
应用日志
用户生成文件
```

这些数据不能只放在容器可写层里。

---

## 2. Docker 常见存储方式

| 类型 | 说明 | 常见用途 |
|---|---|---|
| 容器可写层 | 容器内部默认可写区域 | 临时文件，不可靠 |
| volume | Docker 管理的数据卷 | 数据库、持久化数据 |
| bind mount | 宿主机路径挂载到容器 | 开发代码挂载、配置文件 |
| tmpfs | 内存文件系统 | 临时敏感数据，容器停止即消失 |

初学重点：

```text
volume
bind mount
```

---

## 3. volume 是什么

一句话：

```text
volume 是 Docker 管理的持久化数据目录。
```

特点：

```text
由 Docker 管理位置
适合保存重要数据
不依赖具体容器生命周期
删除容器不会自动删除 volume
适合数据库
```

---

## 4. volume 基础命令

```powershell
docker volume create my-data
docker volume ls
docker volume inspect my-data
docker volume rm my-data
```

查看 volume：

```powershell
docker volume ls
```

查看详情：

```powershell
docker volume inspect my-data
```

---

## 5. 使用 volume 运行容器

```powershell
docker volume create nginx-html

docker run -d --name nginx-volume-demo `
  -p 8080:80 `
  -v nginx-html:/usr/share/nginx/html `
  nginx
```

格式：

```text
-v volume名:容器内路径
```

---

## 6. MySQL volume 示例

```powershell
docker volume create mysql-data

docker run -d --name mysql-demo `
  -e MYSQL_ROOT_PASSWORD=123456 `
  -v mysql-data:/var/lib/mysql `
  mysql:8
```

解释：

```text
mysql-data 是 Docker volume。
/var/lib/mysql 是 MySQL 在容器内保存数据的位置。
```

即使删除 MySQL 容器，只要不删除 `mysql-data`，数据卷仍然存在。

---

## 7. bind mount 是什么

一句话：

```text
bind mount 是把宿主机上的某个文件或目录挂进容器。
```

适合：

```text
开发时把源码挂进容器
把配置文件挂进容器
把宿主机某个目录共享给容器
```

示例：

```powershell
docker run -d --name nginx-bind-demo `
  -p 8081:80 `
  -v ${PWD}/html:/usr/share/nginx/html `
  nginx
```

Windows PowerShell 中 `${PWD}` 表示当前目录对象，实际使用时如果出错，可以改成绝对路径。

---

## 8. volume 和 bind mount 区别

| 对比 | volume | bind mount |
|---|---|---|
| 谁管理 | Docker | 用户自己管理宿主机路径 |
| 适合 | 数据库数据、持久化数据 | 开发代码、配置文件 |
| 路径 | Docker 决定 | 用户指定 |
| 可移植性 | 较好 | 依赖宿主机路径 |
| 删除容器影响 | 不会自动删除 volume | 不会自动删除宿主机文件 |

记忆：

```text
重要数据优先 volume。
开发挂代码常用 bind mount。
```

---

## 9. 推荐使用 --mount 语法

`-v` 简短，但 `--mount` 更清晰。

volume 示例：

```powershell
docker run -d --name nginx-mount-volume `
  --mount type=volume,source=nginx-data,target=/usr/share/nginx/html `
  nginx
```

bind 示例：

```powershell
docker run -d --name nginx-mount-bind `
  --mount type=bind,source=${PWD}/html,target=/usr/share/nginx/html `
  nginx
```

---

## 10. 挂载会遮住容器内原文件

如果你把宿主机空目录挂到容器目录：

```text
宿主机空目录 -> /usr/share/nginx/html
```

容器里原本的 nginx 默认页面可能被遮住。  
这不是文件被删除，而是被挂载覆盖视图遮住。

---

## 11. 备份 volume

备份思路：用临时容器把 volume 打包到宿主机。

```powershell
docker run --rm `
  -v mysql-data:/data `
  -v ${PWD}:/backup `
  alpine `
  tar czf /backup/mysql-data-backup.tar.gz -C /data .
```

恢复思路：

```powershell
docker run --rm `
  -v mysql-data:/data `
  -v ${PWD}:/backup `
  alpine `
  sh -c "cd /data && tar xzf /backup/mysql-data-backup.tar.gz"
```

真实生产数据库备份还应使用数据库自己的备份工具，例如 `mysqldump`、物理备份或云厂商备份方案。

---

## 12. 删除 volume

删除指定 volume：

```powershell
docker volume rm mysql-data
```

删除未使用 volume：

```powershell
docker volume prune
```

警告：

```text
volume 里可能有数据库数据。
删除前必须确认不再需要。
```

---

## 13. Compose 中使用 volume

```yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

启动：

```powershell
docker compose up -d
```

停止并删除容器和网络：

```powershell
docker compose down
```

如果加 `-v`：

```powershell
docker compose down -v
```

会删除 Compose 创建的 volume，谨慎使用。

---

## 14. 常见问题

### 14.1 数据为什么丢了

可能原因：

```text
没有使用 volume
用了 docker compose down -v
删除了 volume
挂载路径写错
数据库实际数据目录不是你挂载的目录
```

### 14.2 bind mount 为什么看不到文件

可能原因：

```text
宿主机路径写错
Windows 路径格式问题
容器内目标路径写错
文件权限不足
```

### 14.3 挂载后容器原文件不见了

这是挂载遮挡，不是删除。

---

## 15. 本章练习

1. 创建 volume：`docker volume create practice-data`
2. 查看 volume：`docker volume inspect practice-data`
3. 用 nginx 挂载 volume。
4. 用 bind mount 挂载本地 `html` 目录到 nginx。
5. 尝试删除容器后确认 volume 仍然存在。
6. 谨慎删除练习 volume。

---

## 16. 本章总结

```text
1. 容器内部数据不适合长期保存重要数据。
2. volume 由 Docker 管理，适合数据库和持久化数据。
3. bind mount 使用宿主机路径，适合开发代码和配置。
4. 删除容器不会自动删除 volume。
5. docker compose down -v 会删除 volume，要小心。
6. 挂载会遮住容器内原目录内容。
```

---

## 17. 官方资料

- Docker storage 概览：https://docs.docker.com/engine/storage/
- Volumes：https://docs.docker.com/engine/storage/volumes/
- Bind mounts：https://docs.docker.com/engine/storage/bind-mounts/
- tmpfs mounts：https://docs.docker.com/engine/storage/tmpfs/
