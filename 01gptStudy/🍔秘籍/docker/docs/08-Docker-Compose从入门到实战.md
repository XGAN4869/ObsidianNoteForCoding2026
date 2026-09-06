# 08 - Docker Compose 从入门到实战

> 本章目标：学会使用 Docker Compose 管理多个容器，能读写 `compose.yml`，并能完成简单多服务项目。

---

## 1. Compose 是什么

一句话：

```text
Docker Compose 是用一个 YAML 文件定义和管理多个容器的工具。
```

没有 Compose 时：

```text
docker run web
docker run mysql
docker run redis
docker run nginx
```

使用 Compose 后：

```powershell
docker compose up -d
```

---

## 2. 核心命令

```powershell
docker compose up
docker compose up -d
docker compose down
docker compose ps
docker compose logs
docker compose logs -f
docker compose exec
docker compose build
docker compose pull
docker compose config
```

---

## 3. 最小 compose.yml

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

启动：

```powershell
docker compose up -d
```

访问：

```text
http://localhost:8080
```

停止并删除容器、默认网络：

```powershell
docker compose down
```

---

## 4. services 是什么

`services` 下面定义每个服务。  
一个 service 通常对应一个容器模板。

示例：

```yaml
services:
  web:
    image: nginx
  redis:
    image: redis:7-alpine
```

服务名：

```text
web
redis
```

在同一个 Compose 项目里，服务之间可以用服务名通信。

---

## 5. image 和 build

### 使用现成镜像

```yaml
services:
  redis:
    image: redis:7-alpine
```

### 使用 Dockerfile 构建

```yaml
services:
  app:
    build: .
    image: my-app:1.0
```

也可以指定 Dockerfile：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
```

---

## 6. ports

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

含义：

```text
宿主机 8080 端口 -> 容器 80 端口
```

---

## 7. environment

```yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: appdb
```

注意：真实工作中不要把生产密码直接写进仓库里的 compose 文件。

---

## 8. env_file

可以把环境变量放到 `.env` 或其他文件。

`db.env`：

```text
MYSQL_ROOT_PASSWORD=123456
MYSQL_DATABASE=appdb
```

`compose.yml`：

```yaml
services:
  db:
    image: mysql:8
    env_file:
      - db.env
```

---

## 9. volumes

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

`mysql-data` 是命名 volume。  
删除容器不会自动删除它。

警告：

```powershell
docker compose down -v
```

会删除 Compose 创建的 volume，可能导致数据丢失。

---

## 10. networks

```yaml
services:
  web:
    image: nginx
    networks:
      - app-net
  redis:
    image: redis:7-alpine
    networks:
      - app-net

networks:
  app-net:
```

同一网络内，服务可以通过服务名访问。

---

## 11. depends_on

```yaml
services:
  web:
    build: .
    depends_on:
      - db
  db:
    image: mysql:8
```

`depends_on` 可以控制启动顺序。  
但注意：服务启动不等于服务已经完全可用。数据库可能还在初始化。更稳的做法是配合 healthcheck 或应用重试机制。

---

## 12. healthcheck

```yaml
services:
  web:
    image: nginx
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 3s
      retries: 3
```

注意：镜像里必须有 `curl`，否则检查会失败。

---

## 13. restart

```yaml
services:
  web:
    image: nginx
    restart: unless-stopped
```

常见值：

```text
no
always
unless-stopped
on-failure
```

---

## 14. 查看最终配置

```powershell
docker compose config
```

这个命令可以检查 Compose 文件是否能被正确解析。

---

## 15. 示例：Nginx + Redis

`compose.yml`：

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
```

启动：

```powershell
docker compose up -d
```

查看：

```powershell
docker compose ps
```

日志：

```powershell
docker compose logs
```

进入 redis：

```powershell
docker compose exec redis redis-cli ping
```

停止：

```powershell
docker compose down
```

---

## 16. 示例：应用 + MySQL

```yaml
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_NAME: appdb
      DB_USER: root
      DB_PASSWORD: 123456
    depends_on:
      - db

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: appdb
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

重点：

```text
app 访问数据库主机名写 db，而不是 localhost。
```

因为 `db` 是 Compose 服务名。

---

## 17. Compose 常见错误

### 17.1 YAML 缩进错误

YAML 对缩进敏感。  
建议统一使用 2 个空格，不要混用 Tab。

### 17.2 app 连接数据库失败

可能原因：

```text
DB_HOST 写成 localhost
数据库还没初始化完
用户名密码错误
服务不在同一网络
```

### 17.3 down -v 导致数据丢失

`docker compose down -v` 会删除 volume。生产和重要数据环境谨慎使用。

### 17.4 端口冲突

修改宿主机端口：

```yaml
ports:
  - "8081:80"
```

---

## 18. 本章练习

1. 写一个只启动 nginx 的 `compose.yml`。
2. 加入 Redis 服务。
3. 使用 `docker compose logs` 查看日志。
4. 使用 `docker compose exec redis redis-cli ping` 测试 Redis。
5. 给 MySQL 配置 volume。
6. 故意执行 `docker compose config` 检查语法。

---

## 19. 本章总结

```text
1. Compose 用一个 YAML 文件管理多个容器。
2. services 定义服务。
3. image 使用现成镜像，build 使用 Dockerfile 构建。
4. ports 做端口映射。
5. volumes 做数据持久化。
6. environment 设置环境变量。
7. 服务之间用服务名通信。
8. docker compose down -v 会删除 volume，谨慎使用。
```

---

## 20. 官方资料

- Docker Compose 文档：https://docs.docker.com/compose/
- Compose 文件参考：https://docs.docker.com/reference/compose-file/
- Compose CLI 参考：https://docs.docker.com/reference/cli/docker/compose/
