# 03 - Compose 练习

> 目标：通过 Compose 管理多个服务，掌握 `compose.yml`、服务名通信、volume 和日志排查。

---

## 练习 1：最小 nginx Compose

创建 `compose.yml`：

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

查看：

```powershell
docker compose ps
docker compose logs
```

访问：

```text
http://localhost:8080
```

停止：

```powershell
docker compose down
```

---

## 练习 2：Nginx + Redis

```yaml
services:
  web:
    image: nginx
    ports:
      - "8081:80"

  redis:
    image: redis:7-alpine
```

启动：

```powershell
docker compose up -d
```

测试 Redis：

```powershell
docker compose exec redis redis-cli ping
```

期望：

```text
PONG
```

---

## 练习 3：服务名通信

使用临时 curl 容器加入 Compose 网络不太直观。更简单方式：

```powershell
docker compose exec redis redis-cli ping
```

理解：

```text
同一个 Compose 项目中的服务会加入默认网络。
服务之间可以用服务名通信。
```

---

## 练习 4：MySQL + volume

```yaml
services:
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

启动：

```powershell
docker compose up -d
```

查看日志：

```powershell
docker compose logs -f db
```

查看 volume：

```powershell
docker volume ls
```

停止但保留数据：

```powershell
docker compose down
```

警告：不要随便执行：

```powershell
docker compose down -v
```

---

## 练习 5：语法检查

执行：

```powershell
docker compose config
```

如果 YAML 缩进错了，这个命令通常能帮你发现。

---

## 练习 6：故意制造错误

### 错误 A：端口冲突

两个服务都写：

```yaml
ports:
  - "8080:80"
```

启动后观察错误。

### 错误 B：YAML 缩进错误

故意把 `image` 缩进写错，执行：

```powershell
docker compose config
```

观察错误信息。

### 错误 C：误删 volume

只在练习环境中理解，不要对重要数据执行：

```powershell
docker compose down -v
```

然后查看 volume 是否还在。

---

## 常用命令复习

```powershell
docker compose up -d
docker compose up -d --build
docker compose down
docker compose ps
docker compose logs
docker compose logs -f 服务名
docker compose exec 服务名 命令
docker compose config
```

---

## 验收标准

- [ ] 能写最小 compose.yml
- [ ] 能启动和停止 Compose 项目
- [ ] 能查看 Compose 日志
- [ ] 能执行 `docker compose exec`
- [ ] 能配置 MySQL volume
- [ ] 能解释服务名通信
- [ ] 能使用 `docker compose config` 检查配置
