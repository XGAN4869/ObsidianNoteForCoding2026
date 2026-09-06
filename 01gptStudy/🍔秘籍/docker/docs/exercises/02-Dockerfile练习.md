# 02 - Dockerfile 练习

> 目标：通过三个小项目练习 Dockerfile，掌握构建镜像、运行容器、排查构建错误。

---

## 练习 1：Nginx 静态网站

### 目录结构

```text
exercise-nginx/
├── Dockerfile
└── html/
    └── index.html
```

### index.html

```html
<h1>Hello Dockerfile</h1>
```

### Dockerfile

```dockerfile
FROM nginx:alpine
COPY ./html /usr/share/nginx/html
EXPOSE 80
```

### 构建运行

```powershell
docker build -t exercise-nginx:1.0 .
docker run -d --name exercise-nginx -p 8088:80 exercise-nginx:1.0
```

访问：

```text
http://localhost:8088
```

清理：

```powershell
docker stop exercise-nginx
docker rm exercise-nginx
```

---

## 练习 2：Python Flask

### 目录结构

```text
exercise-flask/
├── app.py
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

### app.py

```python
from flask import Flask
app = Flask(__name__)

@app.get("/")
def index():
    return "Hello Flask Dockerfile"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### requirements.txt

```text
flask
```

### .dockerignore

```text
.git
__pycache__
*.pyc
.env
```

### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 构建运行

```powershell
docker build -t exercise-flask:1.0 .
docker run -d --name exercise-flask -p 5001:5000 exercise-flask:1.0
```

访问：

```text
http://localhost:5001
```

查看日志：

```powershell
docker logs exercise-flask
```

---

## 练习 3：故意制造错误

### 错误 A：COPY 文件名写错

把 Dockerfile 中：

```dockerfile
COPY app.py .
```

改成：

```dockerfile
COPY app2.py .
```

重新构建：

```powershell
docker build -t exercise-flask:bad .
```

观察错误信息。

---

### 错误 B：CMD 写错

把：

```dockerfile
CMD ["python", "app.py"]
```

改成：

```dockerfile
CMD ["python", "missing.py"]
```

构建并运行：

```powershell
docker build -t exercise-flask:badcmd .
docker run --name badcmd exercise-flask:badcmd
```

排查：

```powershell
docker ps -a
docker logs badcmd
```

清理：

```powershell
docker rm badcmd
```

---

## 练习 4：缓存观察

先构建一次：

```powershell
docker build -t exercise-flask:cache .
```

只修改 `app.py`，再构建一次。  
观察哪些步骤使用了缓存，哪些步骤重新执行。

思考：

```text
为什么先 COPY requirements.txt，再 RUN pip install，再 COPY app.py？
```

---

## 练习 5：添加非 root 用户，进阶

尝试把 Dockerfile 改成：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN useradd -m appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
USER appuser
EXPOSE 5000
CMD ["python", "app.py"]
```

构建运行后检查：

```powershell
docker exec -it exercise-flask sh
id
exit
```

---

## 验收标准

- [ ] 能写 nginx Dockerfile
- [ ] 能写 Flask Dockerfile
- [ ] 能使用 `.dockerignore`
- [ ] 能构建镜像
- [ ] 能运行镜像
- [ ] 能通过 logs 排查 CMD 错误
- [ ] 能解释 COPY、RUN、CMD 的作用
- [ ] 能解释为什么要利用构建缓存
