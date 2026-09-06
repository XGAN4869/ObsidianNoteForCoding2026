# 05 - Dockerfile 从零到掌握

> 本章目标：学会阅读和编写 Dockerfile，能把一个应用构建成 Docker 镜像，并理解常见构建优化方法。

---

## 1. Dockerfile 是什么

一句话：

```text
Dockerfile 是制作镜像的说明书。
```

基本流程：

```text
写 Dockerfile -> docker build -> 生成镜像 -> docker run -> 启动容器
```

---

## 2. 最小示例：静态网站

创建目录：

```text
my-nginx/
├── Dockerfile
└── html/
    └── index.html
```

`html/index.html`：

```html
<h1>Hello Docker</h1>
```

`Dockerfile`：

```dockerfile
FROM nginx:alpine
COPY ./html /usr/share/nginx/html
EXPOSE 80
```

构建：

```powershell
docker build -t my-nginx:1.0 .
```

运行：

```powershell
docker run -d --name my-nginx -p 8080:80 my-nginx:1.0
```

访问：

```text
http://localhost:8080
```

---

## 3. docker build 基础

```powershell
docker build -t 镜像名:标签 构建上下文
```

示例：

```powershell
docker build -t my-app:1.0 .
```

`.` 表示当前目录作为构建上下文。  
Docker 构建时会把上下文中的文件发送给构建器，所以不要把无关大文件放进去。

---

## 4. .dockerignore

`.dockerignore` 用来排除不需要进入构建上下文的文件。

示例：

```text
.git
node_modules
__pycache__
*.log
.env
.DS_Store
```

好处：

```text
构建更快
镜像更小
避免把敏感文件打进镜像
```

---

## 5. FROM

```dockerfile
FROM nginx:alpine
```

`FROM` 指定基础镜像。  
常见基础镜像：

```text
alpine
debian
ubuntu
nginx
python
node
eclipse-temurin
```

建议：

```text
尽量使用明确版本，不要长期只写 latest。
```

---

## 6. WORKDIR

```dockerfile
WORKDIR /app
```

设置工作目录。  
后面的 `COPY`、`RUN`、`CMD` 等很多命令会以这个目录为基础。

推荐使用 `WORKDIR`，不要到处写 `cd`。

---

## 7. COPY 和 ADD

### COPY

```dockerfile
COPY package.json /app/package.json
COPY . /app
```

`COPY` 用于复制本地文件到镜像中。

### ADD

`ADD` 也能复制文件，还支持一些额外能力，例如自动解压本地 tar 文件。  
初学阶段建议：

```text
普通复制用 COPY。
确实需要 ADD 的特殊能力时再用 ADD。
```

---

## 8. RUN

```dockerfile
RUN apt-get update && apt-get install -y curl
```

`RUN` 在构建镜像时执行命令。  
注意：`RUN` 不是容器启动后执行，而是构建镜像时执行。

常见优化：

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

---

## 9. CMD

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

`CMD` 是容器默认启动命令。  
运行容器时可以被覆盖。

例如：

```powershell
docker run my-image echo hello
```

这里的 `echo hello` 会覆盖镜像里的 `CMD`。

---

## 10. ENTRYPOINT

```dockerfile
ENTRYPOINT ["python", "app.py"]
```

`ENTRYPOINT` 更像固定入口。  
通常用于希望容器固定执行某个程序的场景。

---

## 11. CMD 和 ENTRYPOINT 区别

| 对比 | CMD | ENTRYPOINT |
|---|---|---|
| 作用 | 默认命令或默认参数 | 固定入口命令 |
| 是否容易被 docker run 覆盖 | 容易 | 不容易 |
| 常见用途 | 提供默认启动命令 | 固定执行程序 |

常见组合：

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

表示默认执行：

```text
python app.py
```

---

## 12. ENV 和 ARG

### ENV

```dockerfile
ENV NODE_ENV=production
```

`ENV` 会保留在镜像和容器运行环境中。

### ARG

```dockerfile
ARG APP_VERSION=dev
```

`ARG` 主要在构建时使用。  
构建时传入：

```powershell
docker build --build-arg APP_VERSION=1.0 -t my-app:1.0 .
```

区别：

| 对比 | ARG | ENV |
|---|---|---|
| 生效阶段 | 构建时 | 构建时和运行时 |
| 是否保留到运行容器 | 通常不作为运行环境变量保留 | 会保留 |

---

## 13. EXPOSE

```dockerfile
EXPOSE 80
```

`EXPOSE` 是声明容器内服务端口。  
它不会自动把端口映射到宿主机。

真正映射端口要用：

```powershell
docker run -p 8080:80 my-image
```

---

## 14. USER

```dockerfile
USER appuser
```

指定容器运行时用户。  
安全建议：应用容器不要长期以 root 运行，能用普通用户就用普通用户。

---

## 15. VOLUME

```dockerfile
VOLUME ["/data"]
```

声明数据目录。  
但实际工作中，很多时候更推荐在 `docker run` 或 `compose.yml` 中明确挂载 volume。

---

## 16. HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/ || exit 1
```

用于告诉 Docker 如何检查容器健康状态。  
生产实践中很有用，但要确保镜像里有对应检查工具，例如 `curl`。

---

## 17. 镜像层和构建缓存

Dockerfile 中很多指令都会形成镜像层。  
Docker 会利用缓存加速构建。

常见优化思路：

```text
变化少的步骤放前面
变化多的代码复制放后面
先复制依赖清单，再安装依赖
再复制源码
```

Node.js 示例：

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]
```

这样只改源码时，不一定需要重新安装依赖。

---

## 18. 多阶段构建

多阶段构建用于减少最终镜像大小。

Go 示例：

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /src
COPY . .
RUN go build -o app .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /src/app /app/app
CMD ["/app/app"]
```

第一阶段用于编译，第二阶段只保留运行需要的文件。

---

## 19. Python Flask 示例

目录：

```text
flask-demo/
├── app.py
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

`app.py`：

```python
from flask import Flask
app = Flask(__name__)

@app.get("/")
def index():
    return "Hello Docker"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

`requirements.txt`：

```text
flask
```

`Dockerfile`：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

构建并运行：

```powershell
docker build -t flask-demo:1.0 .
docker run -d --name flask-demo -p 5000:5000 flask-demo:1.0
```

---

## 20. Dockerfile 常见错误

### 20.1 忘记 COPY 文件

报错可能是：

```text
file not found
module not found
```

检查 Dockerfile 有没有复制需要的文件。

### 20.2 构建上下文错了

如果你在错误目录执行：

```powershell
docker build -t my-app .
```

Docker 可能找不到 Dockerfile 或源码。

### 20.3 CMD 写错

容器启动后立即退出，可能是启动命令错误。  
排查：

```powershell
docker ps -a
docker logs 容器名
```

---

## 21. 最佳实践

```text
1. 明确基础镜像版本。
2. 使用 .dockerignore。
3. 不要把密码、密钥复制进镜像。
4. 依赖安装和代码复制分开，利用缓存。
5. 能用非 root 用户就不用 root。
6. 尽量减少镜像中无用文件。
7. 编译型项目使用多阶段构建。
8. 一个容器通常运行一个主要进程。
```

---

## 22. 本章练习

1. 写一个 nginx 静态网站 Dockerfile。
2. 写一个 Python Flask Dockerfile。
3. 给镜像打标签 `my-app:1.0`。
4. 故意删掉 `COPY app.py .`，观察构建或运行错误。
5. 加 `.dockerignore` 排除 `.git`、日志文件和缓存目录。

---

## 23. 本章总结

```text
Dockerfile 是镜像说明书。
FROM 指定基础镜像。
WORKDIR 指定工作目录。
COPY 复制文件。
RUN 构建时执行命令。
CMD 是默认启动命令。
ENTRYPOINT 是固定入口。
EXPOSE 只声明端口，不自动映射端口。
.dockerignore 可以减少上下文和风险。
多阶段构建可以减小最终镜像。
```

---

## 24. 官方资料

- Dockerfile 参考：https://docs.docker.com/reference/dockerfile/
- Docker build 最佳实践：https://docs.docker.com/build/building/best-practices/
- 多阶段构建：https://docs.docker.com/build/building/multi-stage/
- `.dockerignore`：https://docs.docker.com/build/concepts/context/#dockerignore-files
