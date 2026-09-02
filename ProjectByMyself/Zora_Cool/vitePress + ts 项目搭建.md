### TypeScript 部分
推荐安装：

```bash
npm install -D typescript vue-tsc
```

然后可以在 [package.json](vscode-webview://00d3c7fm62jpi4gpbi837hrood019djvkg13p2ett6atibl46pik/package.json) 的 `scripts` 中增加：

```json
"type-check": "vue-tsc --noEmit"
```

以后运行：

```bash
npm run type-check
```

### Husky + pre‑commit 代码提交校验配置

> husky：管理 Git hooks，在提交代码前自动执行校验脚本，拦截不合规代码提交。配合 lint‑staged 只校验本次提交变更的文件。

####  1. 安装 husky（开发依赖）

```
npm install husky --save-dev
```

#### 2. 初始化 husky

```
npx husky install
```

- 会在项目根生成 `.husky` 文件夹，存放 git hook 脚本
- 在 `package.json` 添加 `prepare` 脚本，保证其他人 install 依赖后自动启用 husky

```
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

> `prepare` 脚本：pnpm/npm install 完成后自动执行，团队其他成员拉取项目不需要手动跑 `husky install`。

#### 3. 创建 pre‑commit 钩子

pre‑commit：**git commit 执行之前触发**，校验不通过直接阻断提交。

#### 推荐搭配 lint‑staged（只校验本次提交改动文件）

先安装 lint‑staged

```
npm install lint-staged --save-dev
```
装 eslint prettier，然后 ts 的版本得是 6 才能使用

```
# 1. 安装依赖
npm install -D typescript@~6.0.3 eslint prettier @eslint/js typescript-eslint eslint-plugin-vue globals eslint-config-prettier

# 2. 生成 Husky 内部文件
npm run prepare

# 3. 创建 .husky/pre-commit
# 内容写：
npm run lint:lint-staged

# 4. 配置 eslint.config.mjs 和 Prettier 配置文件

# 5. 暂存并提交
git add .
git commit -m "configure lint tools"

```

在 `package.json` 增加脚本与 lint‑staged 配置：

```
{
  "scripts": {
    "prepare": "husky",
    "lint:lint-eslint": "eslint .",
    "lint:lint-prettier": "prettier --check .",
    "lint:lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx,vue,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```


#### 补充：执行 npm run prepare做了什么？
让 husky 执行 package.json 中的 prepare: husky，然后 husky 会自动做两件事
1. 写入 git 配置：core.hooksPath=.husky/_
2. 在 `.husky/_` 里生成一批内部脚本：
	.husky/_/pre-commit
	.husky/_/pre-push
	.husky/_/commit-msg
	.husky/_/post-commit
	...
![[Pasted image 20260902171132.png]]
#### 团队协作说明

- 项目提交 husky 配置：提交 `.husky` 目录、`package.json`，其他同事拉取代码执行 `pnpm install` 自动启用钩子。
- 紧急跳过校验（仅应急，不建议滥用）：

```
git commit --no-verify
```

需要我顺带把你项目现有的 `type‑check` 也接入 pre‑commit，提交时顺带做 TS 类型检查吗？