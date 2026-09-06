# 13 - Docker 生产实践

> 本章目标：理解 Docker 在工作环境中怎么用得更稳定、更安全、更可维护。

---

## 1. 生产实践总原则

```text
镜像要可重复构建。
容器要可删除重建。
数据要持久化和备份。
配置和密钥不要写死。
日志要能收集。
资源要有限制。
服务要有健康检查。
发布要能回滚。
```

---

## 2. 不要在生产中依赖 latest

不推荐：

```yaml
image: my-app:latest
```

推荐：

```yaml
image: my-app:1.3.7
```

或者使用 Git 提交号：

```yaml
image: my-app:git-a1b2c3d
```

原因：

```text
latest 可能变化。
你无法明确知道生产环境到底运行哪个版本。
回滚困难。
排查困难。
```

---

## 3. 镜像构建建议

```text
1. 使用明确基础镜像版本。
2. 使用 .dockerignore。
3. 不把源码以外的大文件复制进镜像。
4. 不把密钥复制进镜像。
5. 依赖安装和源码复制分层，利用缓存。
6. 编译型应用使用多阶段构建。
7. 运行阶段尽量使用非 root 用户。
8. 镜像构建后进行漏洞扫描。
```

---

## 4. 容器不要手工修改

不推荐：

```text
进入生产容器
手动安装软件
手动改配置
把容器当服务器维护
```

推荐：

```text
修改 Dockerfile 或配置
重新构建镜像
发布新容器
旧容器可回滚
```

容器应该是可替换的，不应该是手工养大的宠物服务器。

---

## 5. 配置管理

配置不要写死进镜像。  
常见方式：

```text
环境变量
env_file
配置文件挂载
配置中心
平台 secret/config 功能
```

Compose 示例：

```yaml
services:
  app:
    image: my-app:1.0.0
    env_file:
      - app.env
```

生产密码不要提交到 Git 仓库。

---

## 6. 数据持久化和备份

数据库必须持久化：

```yaml
services:
  db:
    image: mysql:8
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

但只有 volume 还不够。  
生产必须考虑：

```text
定期备份
备份校验
恢复演练
备份加密
异地备份
```

---

## 7. 日志管理

容器日志默认可能写到宿主机磁盘。  
如果日志无限增长，可能把磁盘打满。

建议：

```text
应用日志输出到 stdout/stderr。
配置日志轮转。
接入日志收集系统。
定期检查磁盘占用。
```

Docker daemon 可配置日志驱动和日志轮转，例如 `json-file` 的 `max-size`、`max-file`。

---

## 8. 健康检查

Dockerfile 示例：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/health || exit 1
```

Compose 示例：

```yaml
services:
  app:
    image: my-app:1.0.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

注意：健康检查依赖镜像中存在对应工具，也依赖应用提供健康接口。

---

## 9. 重启策略

```yaml
services:
  app:
    image: my-app:1.0.0
    restart: unless-stopped
```

常见策略：

```text
no
always
unless-stopped
on-failure
```

重启策略不是万能的。应用反复崩溃时，必须看日志找原因。

---

## 10. 资源限制

Compose 示例：

```yaml
services:
  app:
    image: my-app:1.0.0
    mem_limit: 512m
    cpus: 1.0
```

Docker run 示例：

```powershell
docker run --memory 512m --cpus 1.0 my-app:1.0.0
```

生产中需要防止一个容器吃光宿主机资源。

---

## 11. 网络暴露最小化

不要把所有服务都暴露到宿主机。

例如：

```yaml
services:
  app:
    image: my-app:1.0.0
    ports:
      - "8080:8080"
  db:
    image: mysql:8
```

这里 `db` 没有 `ports`，只给 Compose 内部服务访问。

---

## 12. 发布和回滚

建议流程：

```text
1. 提交代码。
2. CI 构建镜像。
3. 镜像打唯一 tag。
4. 扫描镜像。
5. 推送 registry。
6. 测试环境部署。
7. 验证通过。
8. 生产发布。
9. 监控日志和指标。
10. 出问题回滚到旧 tag。
```

回滚前提：你保留了旧镜像 tag，并且配置兼容。

---

## 13. Docker Compose 适合什么

适合：

```text
本地开发环境
测试环境
小型单机部署
教学和实验
```

不适合或需谨慎：

```text
大规模生产集群
复杂弹性伸缩
跨主机自动调度
高级服务治理
```

这些场景通常会考虑 Kubernetes、Swarm、Nomad 或云厂商容器平台。

---

## 14. 监控和观察

基础命令：

```powershell
docker stats
docker logs
docker events
docker system df
```

生产建议接入：

```text
日志系统
指标监控
告警系统
链路追踪
镜像漏洞扫描
```

---

## 15. 生产检查清单

- [ ] 镜像 tag 明确
- [ ] 镜像可重复构建
- [ ] 使用 `.dockerignore`
- [ ] 不含明文密钥
- [ ] 应用非 root 运行
- [ ] 配置和密钥外部化
- [ ] 数据使用 volume 或外部存储
- [ ] 有备份和恢复演练
- [ ] 设置日志轮转或日志收集
- [ ] 设置健康检查
- [ ] 设置资源限制
- [ ] 只暴露必要端口
- [ ] 有回滚方案
- [ ] 有监控和告警

---

## 16. 本章练习

1. 给一个镜像改为明确版本 tag。
2. 给 Dockerfile 添加 `.dockerignore`。
3. 给应用添加 healthcheck。
4. 给容器设置 `--memory` 和 `--cpus`。
5. 修改 Compose，让数据库不暴露宿主机端口。
6. 写一个简短发布回滚流程。

---

## 17. 本章总结

```text
1. 生产不要依赖 latest。
2. 容器要可删除重建。
3. 数据必须持久化并备份。
4. 密钥不要进镜像和 Git。
5. 日志要管理，磁盘要监控。
6. 资源要限制。
7. 服务要有健康检查。
8. 发布要能回滚。
```

---

## 18. 官方资料

- Docker build best practices：https://docs.docker.com/build/building/best-practices/
- Resource constraints：https://docs.docker.com/engine/containers/resource_constraints/
- Docker logging：https://docs.docker.com/engine/logging/configure/
- Compose production considerations：https://docs.docker.com/compose/how-tos/production/
