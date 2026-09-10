# 03 npm、package.json 与项目管理

## 1. 创建项目

```powershell
mkdir node-learning
cd node-learning
npm init -y
```

`package.json` 是项目说明文件，常见字段包括：

- `name`：包名。
- `version`：版本号。
- `scripts`：可执行命令的别名。
- `dependencies`：运行程序需要的依赖。
- `devDependencies`：开发/测试时需要，生产程序通常不直接使用。
- `type`：设为 `module` 时，`.js` 默认按 ES 模块处理。

## 2. 安装依赖

```powershell
npm install express
npm install --save-dev eslint
```

安装后会修改 `package.json` 和 `package-lock.json`，并创建 `node_modules`。团队项目应提交 `package.json` 和 lock 文件；`node_modules` 一般不提交。

CI 或部署使用：

```powershell
npm ci
```

`npm ci` 依据 lock 文件安装，若 `package.json` 与 lock 不一致会失败。它适合可重复构建，不是用来随意更新依赖的命令。

## 3. scripts 与本地命令

在 `package.json` 中加入：

```json
{
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test",
    "check": "node --check src/server.js"
  }
}
```

运行：

```powershell
npm run check
npm test
npm start
```

`npm run` 会优先使用本项目 `node_modules/.bin` 中的命令，避免依赖全局安装。`npx` 可临时执行 CLI，但执行陌生包前先确认包名和来源。

## 4. 版本范围要看懂

- `1.2.3`：精确版本。
- `^1.2.3`：通常允许同一主版本内更新。
- `~1.2.3`：通常允许补丁版本更新。

实际安装结果由 lock 文件决定。升级前阅读变更日志，在分支中测试，不要为了“最新版”直接覆盖生产依赖。

## 5. npm 发布和私有仓库

发布前确认包名、版本、入口文件、许可证和 README，不要把 `.env`、私钥、用户数据打包。可以用 `npm pack --dry-run` 查看将发布的文件。私有 registry 通过项目或用户 `.npmrc` 配置，并注意不要把带 Token 的 `.npmrc` 提交到公开仓库。

## 6. 动手题

1. 创建 `start`、`test`、`check` 三个脚本。
2. 删除 `node_modules` 后运行 `npm ci`，观察依赖能否恢复。
3. 用 `npm ls --depth=0` 查看直接依赖，练习区分运行依赖和开发依赖。

## 检查清单

- [ ] 我知道 `package.json` 和 lock 文件各自的作用。
- [ ] 我知道什么时候用 `npm install`，什么时候用 `npm ci`。
- [ ] 我不会把 `node_modules`、密钥和 `.env` 提交到仓库。
- [ ] 我能用 `npm run` 执行项目脚本。
