# 第 02 课：安装 Node.js，并检查环境

## 本课目标

这节课只做环境准备。完成后，PowerShell 能正确显示 Node.js 和 npm 的版本。没有通过检查之前，先不要创建 Vite 项目。

## 先理解两个名字

Node.js 让电脑可以在浏览器外运行 JavaScript，也为 Vite 提供运行环境。npm 是常见的包管理器，通常随 Node.js 一起安装。npm 负责下载项目依赖、执行 `package.json` 里的脚本。Vite 不是直接“装进浏览器”的软件，它作为开发依赖运行在项目中。

截至本文核对日期，Vite 官方主线要求 Node.js 20.19+ 或 22.12+。注意这里不是“20 以上都可以”：例如 20.10 小于 20.19，不满足要求；22.10 也小于 22.12。Node 21、23 等非长期支持分支即使数值看似更高，也不适合初学者长期使用。建议从 Node.js 官方网站选择当前受支持的 LTS 版本，并同时留意所选框架模板是否提出更高要求。官方地址是 https://nodejs.org/ 。安装界面如果不理解某个高级选项，保留默认值即可。

## 在 PowerShell 中检查

打开 PowerShell，逐行输入：

```powershell
node --version
npm --version
```

每输入一行按一次回车。成功时会分别出现类似 `v22.12.0` 和一个 npm 版本号。示例数字不是必须完全相同，只需要 Node 满足 Vite 要求。如果出现“无法将 node 识别为命令”，先完全关闭 PowerShell 和编辑器，再重新打开终端，因为安装程序修改的 PATH 可能只对新终端生效。如果仍失败，重新检查 Node.js 是否安装完成，不要通过随便复制网上的 PATH 来碰运气。

再确认 npm 的下载源：

```powershell
npm config get registry
```

它会显示当前 registry 地址。安装依赖失败不一定是 Vite 错误，也可能是网络、代理、证书或 registry 配置问题。不要为了消除错误而随意关闭证书校验。公司网络下应询问网络管理员或使用公司规定的镜像。

## 理解项目内安装

脚手架生成项目后，`package.json` 会记录依赖，`npm install` 会把依赖放入 `node_modules`。`node_modules` 可能很大，可以重新安装，通常不提交到 Git。锁文件 `package-lock.json` 记录较精确的依赖解析结果，团队项目应提交它。删除锁文件可能改变间接依赖版本，所以不能把“删除锁文件和 node_modules”当作遇错后的第一反应。

全局安装 `vite` 不是本教程的默认方式。让 Vite 记录在项目的 `devDependencies` 中，更容易保证不同成员使用相同大版本。执行 `npm run dev` 时，npm 会自动找到项目本地的 Vite 可执行文件，不需要你手工写完整路径。

## 安全与习惯

只从 Node.js 官方站点或公司批准的软件源下载安装程序。终端命令要看懂作用再执行。不要复制要求关闭系统安全功能、绕过证书或以管理员权限执行大段未知脚本的“修复方案”。版本不对时优先更新 Node，命令找不到时优先重开终端，网络失败时先读错误中的域名和状态。

## 检查点

请确认：`node --version` 有结果；版本满足 20.19+ 或 22.12+；`npm --version` 有结果；你能说出 npm 是包管理器；你知道关闭旧终端再打开能刷新 PATH。全部满足后再进入下一课。

官方依据：https://cn.vite.dev/guide/#scaffolding-your-first-vite-project 与 https://nodejs.org/
