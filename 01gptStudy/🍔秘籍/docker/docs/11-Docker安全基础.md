# 11 - Docker 安全基础

> 本章目标：理解 Docker 常见安全风险，养成安全使用镜像、容器、网络、volume 和密钥的习惯。

---

## 1. 先记住一句话

```text
容器提供隔离，但不是绝对安全边界。生产中要最小权限、可信镜像、少暴露端口、保护密钥、限制资源。
```

---

## 2. 只使用可信镜像

风险：来源不明镜像可能包含恶意代码、后门、挖矿程序或过期漏洞。

建议：

```text
优先使用官方镜像或公司认证镜像。
查看镜像维护状态。
固定版本，不要盲目使用 latest。
定期更新基础镜像。
对重要镜像做漏洞扫描。
```

---

## 3. 不要把密钥写进镜像

不要在 Dockerfile 里写：

```dockerfile
ENV PASSWORD=真实密码
COPY id_rsa /root/.ssh/id_rsa
```

不要把 `.env`、证书、私钥打进镜像。

使用 `.dockerignore` 排除：

```text
.env
*.pem
*.key
id_rsa
.git
```

CI/CD 中使用 secret 管理敏感信息。

---

## 4. 不要随便使用 --privileged

危险命令：

```powershell
docker run --privileged ...
```

`--privileged` 会给容器非常高的权限，可能突破正常隔离边界。  
除非你明确知道原因，否则不要使用。

---

## 5. 不要随便挂载 Docker socket

危险挂载：

```powershell
-v /var/run/docker.sock:/var/run/docker.sock
```

如果容器能操作 Docker socket，它可能控制宿主机上的 Docker，风险很高。

---

## 6. 尽量不用 root 运行应用

Dockerfile 示例：

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]
```

原则：

```text
构建阶段可以使用 root 安装依赖。
运行阶段尽量切换到普通用户。
```

---

## 7. 能力控制 capabilities

Linux capabilities 可以细分 root 权限。  
默认容器会获得一组有限能力。

可以丢弃能力：

```powershell
docker run --cap-drop ALL nginx
```

按需增加能力：

```powershell
docker run --cap-add NET_ADMIN ...
```

建议：

```text
默认不要随便 cap-add。
需要什么加什么，不需要的不要给。
```

---

## 8. 只读根文件系统

如果应用不需要写根文件系统，可以：

```powershell
docker run --read-only nginx
```

需要写临时目录时，可以配合 tmpfs：

```powershell
docker run --read-only --tmpfs /tmp nginx
```

---

## 9. 限制资源

防止容器占满宿主机资源。

限制内存：

```powershell
docker run --memory 512m nginx
```

限制 CPU：

```powershell
docker run --cpus 1.0 nginx
```

生产建议：重要服务都应考虑资源限制。

---

## 10. 端口最小暴露

不要随便暴露端口：

```yaml
ports:
  - "3306:3306"
```

如果 MySQL 只给内部应用访问，就不需要映射到宿主机。  
Compose 内部服务可以通过服务名通信。

---

## 11. volume 挂载要谨慎

危险挂载：

```powershell
-v /:/host
-v C:\:/host
```

这会让容器看到大量宿主机文件，风险很高。

建议：

```text
只挂载必要目录。
能只读就只读。
不要把系统关键目录挂进容器。
```

只读挂载示例：

```powershell
docker run -v ${PWD}/config:/app/config:ro my-app
```

---

## 12. 使用镜像扫描

Docker 生态中可以使用 Docker Scout 或其他扫描工具检查镜像漏洞。  
扫描不是绝对安全，但可以发现很多已知漏洞。

建议流程：

```text
构建镜像
扫描镜像
修复高危漏洞
推送镜像
部署
持续重新扫描
```

---

## 13. seccomp、AppArmor、SELinux

这些是 Linux 安全机制。  
初学阶段不用深入，但要知道 Docker 可以利用它们进一步限制容器系统调用和访问权限。

简单理解：

```text
seccomp：限制系统调用。
AppArmor/SELinux：限制进程访问资源。
```

---

## 14. Rootless mode

Docker 支持 rootless 模式，让 Docker daemon 和容器以非 root 用户运行。  
它可以降低某些风险，但也有功能限制和额外配置成本。

初学阶段先理解概念，生产使用前要阅读官方文档并测试。

---

## 15. Compose 安全示例

```yaml
services:
  app:
    image: my-app:1.0.0
    read_only: true
    user: "1000:1000"
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp
    ports:
      - "8080:8080"
```

不是所有应用都能直接这样配置，需要根据应用实际调整。

---

## 16. 安全检查清单

- [ ] 镜像来源可信
- [ ] 镜像版本明确
- [ ] 没有把密码打进镜像
- [ ] `.dockerignore` 排除了敏感文件
- [ ] 应用尽量不用 root 运行
- [ ] 没有使用 `--privileged`
- [ ] 没有随便挂载 Docker socket
- [ ] 只暴露必要端口
- [ ] 只挂载必要目录
- [ ] 重要容器设置资源限制
- [ ] 重要镜像做漏洞扫描
- [ ] 日志、数据、密钥分开管理

---

## 17. 本章练习

1. 给一个 Dockerfile 添加非 root 用户。
2. 给容器添加 `--memory 256m` 限制。
3. 用只读方式挂载配置目录。
4. 写 `.dockerignore` 排除 `.env` 和私钥。
5. 检查一个 Compose 文件是否暴露了不必要端口。

---

## 18. 本章总结

```text
1. 容器隔离不是绝对安全。
2. 只用可信镜像。
3. 不把密钥写进镜像。
4. 不乱用 --privileged。
5. 不乱挂 Docker socket。
6. 应用尽量不用 root 运行。
7. 端口、volume、权限都要最小化。
8. 生产镜像要扫描漏洞并持续更新。
```

---

## 19. 官方资料

- Docker security：https://docs.docker.com/engine/security/
- Rootless mode：https://docs.docker.com/engine/security/rootless/
- Docker Scout：https://docs.docker.com/scout/
- Resource constraints：https://docs.docker.com/engine/containers/resource_constraints/
- Dockerfile best practices：https://docs.docker.com/build/building/best-practices/
