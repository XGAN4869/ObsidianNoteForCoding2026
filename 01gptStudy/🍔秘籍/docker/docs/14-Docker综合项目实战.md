# 14 - Docker 综合项目实战

> 本章目标：用完整项目把镜像、容器、Dockerfile、volume、network、Compose、排障串起来。

---

## 1. 实战要求

每个项目都按这个流程做：

```text
1. 创建目录结构
2. 写代码或配置
3. 写 Dockerfile
4. 写 compose.yml
5. 构建镜像
6. 启动服务
7. 验证访问
8. 查看日志
9. 故意制造错误并排查
10. 清理资源
```

---

## 2. 项目一：Nginx 静态网站

### 2.1 目录结构

```text
project-nginx/
├── Dockerfile
└── html/
    └── index.html
```

### 2.2 index.html

```html
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Docker Demo</title></head>
  <body><h1>Hello Docker Nginx</h1></body>
</html>
```

### 2.3 Dockerfile

```dockerfile
FROM nginx:alpine
COPY ./html /usr/share/nginx/html
EXPOSE 80
```

### 2.4 构建和运行

```powershell
docker build -t project-nginx:1.0 .
docker run -d --name project-nginx -p 8080:80 project-nginx:1.0
```

访问：

```text
http://localhost:8080
```

### 2.5 排查练习

把 `COPY ./html` 写错，重新构建，观察页面变化或错误。

清理：

```powershell
docker stop project-nginx
docker rm project-nginx
```

---

## 3. 项目二：Python Flask 容器化

### 3.1 目录结构

```text
project-flask/
├── app.py
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

### 3.2 app.py

```python
from flask import Flask
app = Flask(__name__)

@app.get("/")
def index():
    return "Hello Flask in Docker"

@app.get("/health")
def health():
    return "ok"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### 3.3 requirements.txt

```text
flask
```

### 3.4 .dockerignore

```text
.git
__pycache__
*.pyc
.env
```

### 3.5 Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 3.6 构建运行

```powershell
docker build -t project-flask:1.0 .
docker run -d --name project-flask -p 5000:5000 project-flask:1.0
```

访问：

```text
http://localhost:5000
http://localhost:5000/health
```

---

## 4. 项目三：Flask + Redis + Compose

### 4.1 目录结构

```text
project-flask-redis/
├── app.py
├── requirements.txt
├── Dockerfile
└── compose.yml
```

### 4.2 app.py

```python
from flask import Flask
import redis
import os

app = Flask(__name__)
r = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379, decode_responses=True)

@app.get("/")
def index():
    count = r.incr("hits")
    return f"Hello Docker Compose, hits={count}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### 4.3 requirements.txt

```text
flask
redis
```

### 4.4 Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 4.5 compose.yml

```yaml
services:
  app:
    build: .
    image: project-flask-redis:1.0
    ports:
      - "5000:5000"
    environment:
      REDIS_HOST: redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
```

### 4.6 启动和验证

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

访问：

```text
http://localhost:5000
```

刷新多次，hits 应该增加。

### 4.7 重点理解

```text
app 连接 redis，不写 localhost。
因为 redis 是 Compose 服务名。
```

---

## 5. 项目四：MySQL 数据持久化

### 5.1 compose.yml

```yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: appdb
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql-data:
```

启动：

```powershell
docker compose up -d
```

查看：

```powershell
docker compose logs -f db
docker volume ls
```

停止但保留数据：

```powershell
docker compose down
```

危险：

```powershell
docker compose down -v
```

它会删除 volume，可能导致数据库数据丢失。

---

## 6. 项目五：本地 Registry

启动 registry：

```powershell
docker run -d --name registry-demo -p 5000:5000 registry:2
```

打标签并推送：

```powershell
docker pull nginx:alpine
docker tag nginx:alpine localhost:5000/nginx-demo:1.0
docker push localhost:5000/nginx-demo:1.0
```

拉取：

```powershell
docker pull localhost:5000/nginx-demo:1.0
```

清理：

```powershell
docker stop registry-demo
docker rm registry-demo
```

---

## 7. 综合排障任务

请故意制造这些错误，并排查：

| 错误 | 排查命令 |
|---|---|
| 端口写错 | `docker ps`、浏览器访问 |
| 服务名写成 localhost | `docker compose logs app` |
| requirements.txt 少写 redis | `docker compose logs app` |
| MySQL 没挂 volume | `docker volume ls`、重建后验证 |
| Dockerfile COPY 路径写错 | `docker build` 输出 |

---

## 8. 项目验收标准

你能独立完成：

- [ ] 构建 nginx 静态网站镜像
- [ ] 运行 Flask 容器
- [ ] 使用 Compose 启动 Flask + Redis
- [ ] 解释为什么容器间连接用服务名
- [ ] 使用 volume 保存 MySQL 数据
- [ ] 推送镜像到本地 registry
- [ ] 使用 logs/ps/inspect 排查错误

---

## 9. 本章总结

```text
项目一练 Dockerfile 和端口映射。
项目二练应用容器化。
项目三练 Compose 和容器网络。
项目四练 volume 和数据库持久化。
项目五练 registry。
综合排障练工作能力。
```

---

## 10. 官方资料

- Dockerize an app：https://docs.docker.com/get-started/docker-concepts/building-images/writing-a-dockerfile/
- Docker Compose：https://docs.docker.com/compose/
- Volumes：https://docs.docker.com/engine/storage/volumes/
- Registry：https://docs.docker.com/registry/
