# 09 - Docker 镜像仓库 Registry

> 本章目标：理解镜像仓库，掌握登录、打标签、推送、拉取镜像，以及基础版本管理规范。

---

## 1. Registry 是什么

一句话：

```text
Registry 是存放 Docker 镜像的仓库服务。
```

常见 registry：

```text
Docker Hub
公司私有镜像仓库
云厂商镜像仓库
本地 registry
```

流程：

```text
本地构建镜像 -> 打标签 -> 登录仓库 -> 推送镜像 -> 其他机器拉取镜像 -> 运行容器
```

---

## 2. 镜像完整名称

常见格式：

```text
仓库地址/命名空间/镜像名:标签
```

示例：

```text
nginx:alpine
mysql:8
docker.io/library/nginx:alpine
myregistry.example.com/team/app:1.0.0
```

如果只写：

```text
nginx
```

Docker 默认会按 Docker Hub 官方库解析。

---

## 3. tag 是什么

tag 是镜像标签，用于区分版本。

示例：

```text
app:1.0.0
app:1.0.1
app:2026-07-25
app:git-a1b2c3d
app:prod
```

工作建议：

```text
不要只依赖 latest。
生产发布要使用明确版本或不可变标识。
```

---

## 4. digest 是什么

digest 是镜像内容的哈希标识。  
例如：

```text
nginx@sha256:xxxx
```

tag 可能变化，digest 指向具体内容，更适合需要严格可重复部署的场景。

---

## 5. 登录仓库

```powershell
docker login
```

登录指定仓库：

```powershell
docker login myregistry.example.com
```

安全提醒：

```text
不要把密码写进脚本或仓库。
CI/CD 中使用安全变量或 secret。
```

---

## 6. 给镜像打仓库标签

假设本地镜像：

```text
my-app:1.0
```

要推送到 Docker Hub 用户 `yourname`：

```powershell
docker tag my-app:1.0 yourname/my-app:1.0
```

推送：

```powershell
docker push yourname/my-app:1.0
```

拉取：

```powershell
docker pull yourname/my-app:1.0
```

---

## 7. 推送到私有仓库

私有仓库地址：

```text
registry.example.com
```

打标签：

```powershell
docker tag my-app:1.0 registry.example.com/team/my-app:1.0
```

登录：

```powershell
docker login registry.example.com
```

推送：

```powershell
docker push registry.example.com/team/my-app:1.0
```

拉取：

```powershell
docker pull registry.example.com/team/my-app:1.0
```

---

## 8. 本地 registry 练习

Docker 官方提供 `registry` 镜像，可用于本地练习。

启动本地 registry：

```powershell
docker run -d --name local-registry -p 5000:5000 registry:2
```

给镜像打标签：

```powershell
docker pull nginx:alpine
docker tag nginx:alpine localhost:5000/my-nginx:1.0
```

推送：

```powershell
docker push localhost:5000/my-nginx:1.0
```

拉取：

```powershell
docker pull localhost:5000/my-nginx:1.0
```

清理：

```powershell
docker stop local-registry
docker rm local-registry
```

---

## 9. save/load 和 registry 的区别

| 方式 | 适合场景 |
|---|---|
| `docker save/load` | 离线传输、临时备份 |
| registry | 团队共享、自动化部署、CI/CD |

工作中更常用 registry。

---

## 10. 镜像版本命名建议

推荐：

```text
语义化版本：1.0.0、1.1.0
日期版本：2026.07.25
Git 提交号：git-a1b2c3d
环境标签：dev、test、prod 要谨慎使用
```

生产建议：

```text
每次发布使用唯一 tag。
不要让 prod 指向不清楚的内容。
保留回滚所需历史版本。
```

---

## 11. 镜像仓库安全

```text
1. 不推送包含密码和密钥的镜像。
2. 不使用来源不明镜像。
3. CI/CD 中使用 secret 管理仓库账号。
4. 对重要镜像做漏洞扫描。
5. 生产可使用 digest 固定镜像内容。
6. 私有仓库要开启认证和 TLS。
```

---

## 12. 常见错误

### 12.1 push 被拒绝

可能原因：

```text
没有 docker login
没有权限
镜像名不符合仓库路径
仓库不存在
```

### 12.2 repository does not exist

检查：

```text
仓库地址是否正确
命名空间是否正确
镜像名是否正确
tag 是否正确
是否已登录
```

### 12.3 本地 registry 推送失败

检查 registry 是否运行：

```powershell
docker ps
```

检查端口：

```text
localhost:5000
```

---

## 13. 本章练习

1. 构建一个镜像 `my-demo:1.0`。
2. 给它打 tag：`你的用户名/my-demo:1.0`。
3. 登录 Docker Hub。
4. 推送镜像。
5. 删除本地镜像。
6. 从仓库重新拉取。
7. 启动本地 registry 并推送 `localhost:5000/my-nginx:1.0`。

---

## 14. 本章总结

```text
1. registry 是镜像仓库。
2. docker login 登录仓库。
3. docker tag 给镜像改仓库名和版本。
4. docker push 推送镜像。
5. docker pull 拉取镜像。
6. 不建议生产长期使用 latest。
7. digest 比 tag 更能固定具体镜像内容。
8. 本地 registry 可以用 registry:2 练习。
```

---

## 15. 官方资料

- Docker Hub：https://docs.docker.com/docker-hub/
- Docker Registry：https://docs.docker.com/registry/
- `docker login`：https://docs.docker.com/reference/cli/docker/login/
- `docker push`：https://docs.docker.com/reference/cli/docker/image/push/
- `docker pull`：https://docs.docker.com/reference/cli/docker/image/pull/
