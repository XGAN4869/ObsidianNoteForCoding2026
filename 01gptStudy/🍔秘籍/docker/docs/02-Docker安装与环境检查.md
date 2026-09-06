# 02 - Docker 安装与环境检查

> 本章目标：在 Windows 上安装 Docker Desktop，并确认 Docker 能正常运行。  
> 注意：安装要求可能随 Docker 官方更新变化。本文按 2026-07-25 查询到的 Docker 官方文档整理；以后如有不一致，以官方文档为准。

---

## 1. 本章目标

学完本章，你要能做到：

```text
知道 Windows 上为什么常用 Docker Desktop
知道 WSL 2 是什么
会检查 Docker 是否安装成功
会运行 hello-world
会运行 nginx
会做最基础的安装排查
```

---

## 2. Windows 上为什么用 Docker Desktop

Docker 的很多核心能力依赖 Linux 内核功能。  
Windows 本身不是 Linux，所以在 Windows 上运行 Linux 容器时，需要一个 Linux 环境。

Docker Desktop 会帮你准备：

```text
Docker Engine
Docker CLI
docker compose
图形界面
WSL 2 或 Hyper-V 后端
```

初学推荐：

```text
Docker Desktop + WSL 2
```

---

## 3. WSL 2 是什么

WSL 全称：

```text
Windows Subsystem for Linux
```

中文理解：

```text
Windows 的 Linux 子系统
```

WSL 2 给 Windows 提供 Linux 内核环境。  
Docker Desktop 使用 WSL 2 后，可以在 Windows 上运行 Linux 容器。

通俗理解：

```text
Windows 是你的主系统。
WSL 2 给 Docker 提供 Linux 环境。
Docker 在这个 Linux 环境里运行 Linux 容器。
```

---

## 4. 安装前检查

### 4.1 检查 Windows 版本

打开 PowerShell：

```powershell
winver
```

会弹出 Windows 版本信息。

Docker 官方文档中列出的 Windows x86_64 WSL 2 后端要求包括：

```text
Windows 10 64-bit：Enterprise、Pro 或 Education，22H2，build 19045
Windows 11 64-bit：Enterprise、Pro 或 Education，23H2，build 22631 或更高
```

提醒：

```text
如果你的系统版本不同，请看 Docker 官方安装文档。
不要靠猜。
```

---

### 4.2 检查 WSL

PowerShell 执行：

```powershell
wsl --version
```

Docker 官方文档要求 WSL 至少为 2.1.5，并建议保持最新。

更新 WSL：

```powershell
wsl --update
```

如果没有安装 WSL，可以尝试管理员 PowerShell：

```powershell
wsl --install
```

然后重启电脑。

---

### 4.3 检查 WSL 发行版版本

执行：

```powershell
wsl -l -v
```

示例：

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

重点看 `VERSION` 是否是 `2`。

如果是 WSL 1，可以转换：

```powershell
wsl --set-version Ubuntu 2
```

设置以后默认使用 WSL 2：

```powershell
wsl --set-default-version 2
```

---

### 4.4 检查硬件虚拟化

打开：

```text
任务管理器 -> 性能 -> CPU -> 虚拟化
```

如果显示：

```text
已启用
```

一般可以。

如果未启用，可能需要进 BIOS/UEFI 开启。不会操作时，不要乱改 BIOS，找老师、同事或管理员帮忙。

---

## 5. 安装 Docker Desktop

### 5.1 下载地址

只从官方地址下载：

```text
https://docs.docker.com/desktop/setup/install/windows-install/
```

不要从第三方网站下载。

---

### 5.2 安装模式

Docker Desktop Windows 官方文档说明有两种安装模式：

| 模式 | 说明 |
|---|---|
| Per-user | 推荐给大多数用户；安装在当前用户目录；通常不需要管理员权限安装或更新；Linux 容器后端为 WSL 2 |
| All-users | 给所有用户安装；通常需要管理员权限；可以使用 WSL 2 或 Hyper-V；Windows containers 需要此模式 |

初学 Linux 容器建议：

```text
Per-user + WSL 2
```

---

### 5.3 安装步骤

1. 双击 `Docker Desktop Installer.exe`
2. 按安装向导操作
3. 如果看到 WSL 2 相关选项，初学建议选择 WSL 2
4. 安装完成后启动 Docker Desktop
5. 等待 Docker Desktop 显示正常运行

第一次启动可能需要接受 Docker Desktop 使用条款。公司商业使用是否需要付费，要以 Docker 官方订阅条款为准。

---

## 6. 检查 Docker 是否正常

### 6.1 查看版本

```powershell
docker version
```

正常时通常能看到两部分：

```text
Client
Server
```

理解：

```text
Client = 你输入 docker 命令的工具
Server = Docker 后台服务
```

如果只有 Client，没有 Server，常见原因是 Docker Desktop 没启动。

---

### 6.2 查看系统信息

```powershell
docker info
```

它会显示：

```text
容器数量
镜像数量
存储驱动
日志驱动
Docker Root Dir
系统信息
CPU 和内存信息
```

初学者不需要全部看懂，只要确认没有报错。

---

## 7. 运行第一个容器

```powershell
docker run hello-world
```

这条命令会做：

```text
1. 检查本地有没有 hello-world 镜像
2. 如果没有，从镜像仓库拉取
3. 创建容器
4. 启动容器
5. 输出测试信息
6. 容器运行结束并退出
```

如果看到成功信息，说明 Docker 基本可用。

---

## 8. 查看 hello-world 容器

```powershell
docker ps
```

只看正在运行的容器。`hello-world` 已经退出，所以通常看不到。

查看所有容器：

```powershell
docker ps -a
```

你应该能看到刚才运行过的 `hello-world` 容器。

---

## 9. 运行 nginx 容器

```powershell
docker run -d --name my-nginx -p 8080:80 nginx
```

解释：

| 参数 | 作用 |
|---|---|
| `docker run` | 创建并启动容器 |
| `-d` | 后台运行 |
| `--name my-nginx` | 容器名字叫 my-nginx |
| `-p 8080:80` | 宿主机 8080 端口映射到容器 80 端口 |
| `nginx` | 使用 nginx 镜像 |

浏览器访问：

```text
http://localhost:8080
```

如果看到 nginx 欢迎页，说明成功。

---

## 10. 管理 nginx 容器

查看运行中容器：

```powershell
docker ps
```

查看日志：

```powershell
docker logs my-nginx
```

停止：

```powershell
docker stop my-nginx
```

启动：

```powershell
docker start my-nginx
```

删除：

```powershell
docker stop my-nginx
docker rm my-nginx
```

---

## 11. 常见错误

### 11.1 docker 命令不存在

错误类似：

```text
docker : The term 'docker' is not recognized
```

处理：

```text
1. 确认 Docker Desktop 已安装
2. 关闭 PowerShell，重新打开
3. 重启电脑
4. 重新安装 Docker Desktop
```

---

### 11.2 连接不上 Docker daemon

错误类似：

```text
Cannot connect to the Docker daemon
```

处理：

```text
1. 打开 Docker Desktop
2. 等待 Docker Desktop 完全启动
3. 再执行 docker version
4. 仍失败就重启 Docker Desktop
5. 还失败再重启电脑
```

---

### 11.3 端口被占用

如果：

```powershell
docker run -d --name my-nginx -p 8080:80 nginx
```

报端口冲突，可以换端口：

```powershell
docker run -d --name my-nginx2 -p 8081:80 nginx
```

然后访问：

```text
http://localhost:8081
```

---

### 11.4 镜像拉取失败

可能原因：

```text
网络问题
代理问题
公司网络限制
镜像仓库访问慢
```

处理思路：

```text
1. 检查网络
2. 换网络
3. 检查 Docker Desktop 代理设置
4. 问公司网络管理员
```

---

## 12. Windows + WSL 2 建议

如果你在 WSL 里开发 Linux 项目，建议把项目放在 Linux 文件系统，例如：

```text
/home/你的用户名/projects
```

不要长期把大量 Linux 项目放在：

```text
/mnt/c/Users/...
```

原因：性能和文件监听可能更差。

不过初学阶段只练习 Docker 命令，放在 Windows 目录也可以。

---

## 13. 本章练习

### 练习 1：检查 Docker

```powershell
docker version
docker info
```

写下：

```text
Client 是否存在：
Server 是否存在：
是否报错：
```

### 练习 2：运行 hello-world

```powershell
docker run hello-world
docker ps -a
```

找到 `hello-world` 容器。

### 练习 3：运行 nginx

```powershell
docker run -d --name my-nginx -p 8080:80 nginx
```

访问：

```text
http://localhost:8080
```

### 练习 4：清理 nginx

```powershell
docker stop my-nginx
docker rm my-nginx
```

---

## 14. 本章总结

记住：

```text
1. Windows 上推荐 Docker Desktop + WSL 2 学习 Linux 容器。
2. docker version 用来检查 Client 和 Server。
3. docker info 用来查看 Docker 系统信息。
4. docker run hello-world 用来测试 Docker。
5. docker run -d -p 8080:80 nginx 可以启动一个 Web 容器。
```

---

## 15. 下一章

下一章：

```text
03-容器基础命令.md
```

你会学习：

```text
run / ps / stop / start / restart / rm / logs / exec / inspect
```

---

## 16. 官方资料

- Docker Desktop Windows 安装：https://docs.docker.com/desktop/setup/install/windows-install/
- Docker Desktop WSL 2 后端：https://docs.docker.com/desktop/features/wsl/
- Docker Desktop WSL 最佳实践：https://docs.docker.com/desktop/features/wsl/best-practices/
- Docker 运行容器：https://docs.docker.com/engine/containers/run/
