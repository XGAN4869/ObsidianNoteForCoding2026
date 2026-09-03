

> 适用于使用 Vue 3、Vite、TypeScript、ESLint、Prettier 和 Husky 初始化前端项目。
> 本提示词不包含 VitePress 配置，适合普通 Vue 应用、后台管理项目或业务项目。

## 一、推荐使用方式

先在准备创建项目的父目录打开终端，然后把下面的提示词完整交给 AI 编程工具执行。

```text
请帮我初始化一个 Vue 3 + Vite + TypeScript 前端项目，严格按照下面的要求执行：

1. 创建项目
   - 使用官方命令：npm create vue@latest
   - 项目名称使用：<项目名称>
   - 选择 Vue 3 和 TypeScript。
   - 根据项目实际需要选择 JSX、Vue Router、Pinia、Vitest、端到端测试、ESLint 和 Prettier。
   - 不要安装或配置 VitePress。
   - 如果目标目录已经存在，请先检查文件，不要直接覆盖已有代码。

2. 安装和确认 TypeScript 类型检查
   - 确认项目已经安装 typescript。
   - 安装 vue-tsc：npm install -D vue-tsc
   - 在 package.json 增加："type-check": "vue-tsc --noEmit"
   - 执行 npm run type-check，确保类型检查通过。

3. 配置 ESLint 和 Prettier
   - 优先沿用 create-vue 生成的 ESLint 配置，不要重复创建互相冲突的配置文件。
   - 如果项目缺少 Prettier，再安装：npm install -D prettier eslint-config-prettier
   - 增加适合 Vue + TypeScript 的 Prettier 配置，并让 ESLint 与 Prettier 不冲突。
   - 在 package.json 增加或合并这些脚本：
     - "lint": "eslint . --cache"
     - "lint:fix": "eslint . --fix"
     - "format": "prettier --write ."
     - "format:check": "prettier --check ."
     - "type-check": "vue-tsc --noEmit"

4. 配置 Husky 和 lint-staged
   - 如果项目还没有 Git 仓库，先执行：git init
   - 安装开发依赖：npm install -D husky lint-staged
   - 使用当前 Husky 推荐方式初始化：npx husky init
   - 确认 package.json 中存在 Husky 初始化生成的 prepare 脚本；不要同时保留过时的 "husky install" 写法。
   - 配置 lint-staged，只检查本次提交中已经暂存的文件，不要在 pre-commit 中直接执行整个项目的 lint。
   - 在 package.json 增加或合并："lint:staged": "lint-staged"
   - lint-staged 配置如下：

     "lint-staged": {
       "*.{ts,tsx,vue,js,jsx}": [
         "eslint --fix",
         "prettier --write"
       ],
       "*.{json,css,scss,md,yml,yaml}": [
         "prettier --write"
       ]
     }

   - 将 .husky/pre-commit 的内容设置为：npm run lint:staged
   - 确认 .husky/pre-commit 路径和内容正确。
   - 不要在 pre-commit 中执行耗时的全量 lint 或 build。

5. TypeScript 检查接入策略
   - 默认只在 pre-commit 中执行 lint-staged，避免每次提交都运行完整类型检查。
   - 如果项目规模较小，或者我明确要求提交前做完整校验，再将 type-check 接入 pre-commit。
   - 如果接入，请说明执行顺序和可能增加的提交耗时。

6. 提交信息校验（可选）
   - 只有在我明确需要规范 commit message 时，才安装：
     npm install -D @commitlint/cli @commitlint/config-conventional
   - 创建 commitlint.config.mjs，使用 conventional commits 规则。
   - 创建 .husky/commit-msg，内容为：npx --no -- commitlint --edit "$1"
   - 不要默认添加 commitlint，避免给简单项目增加不必要的配置。

7. 最终检查
   - 执行 npm install，确认 prepare 能正常启用 Husky。
   - 执行 npm run type-check。
   - 执行 npm run lint 或项目现有的 ESLint 检查命令。
   - 执行 npm run format:check；如果项目没有该脚本，补齐后再检查。
   - 使用 git add 暂存一个测试文件，验证 lint-staged 和 .husky/pre-commit 可以正常工作。
   - 检查 git diff，确认没有修改与初始化无关的业务代码。

8. 输出结果
   - 列出实际执行过的命令。
   - 列出新增或修改的文件。
   - 说明 package.json 新增的 scripts 和开发依赖。
   - 说明 TypeScript 类型检查、ESLint、Prettier 和 Husky 是否验证通过。
   - 如果某一步失败，给出真实错误原因和下一步建议，不要假设已经成功。
```

## 二、手动初始化命令参考

如果不使用 AI，也可以按以下顺序执行。`<项目名称>` 替换为实际项目名。

```bash
npm create vue@latest
cd <项目名称>
npm install
npm install -D vue-tsc husky lint-staged prettier eslint-config-prettier
git init
npx husky init
npm run type-check
npm run lint
npm run format:check
```

## 三、建议的 package.json 配置

下面只展示初始化阶段需要关注的字段。不要直接覆盖已有 `package.json`，应当合并配置。

```json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit",
    "lint": "eslint . --cache",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint:staged": "lint-staged",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,vue,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## 四、初始化后的目录重点

```text
<项目名称>/
├─ .husky/
│  └─ pre-commit       # 提交前执行 npm run lint:staged
├─ src/
├─ public/
├─ eslint.config.*     # 以 create-vue 实际生成的文件为准
├─ tsconfig*.json
├─ package.json
└─ vite.config.ts
```

## 五、团队协作注意事项

- 将 `.husky`、`package.json`、`package-lock.json` 以及 ESLint、Prettier、lint-staged 配置一并提交到仓库。
- 团队成员执行 `npm install` 后，`prepare` 会自动启用 Husky。
- 紧急情况下可以使用 `git commit --no-verify` 跳过钩子，但不应作为日常提交方式。
- 不要固定安装未经验证的 TypeScript 大版本；优先使用项目锁文件和当前 Vue 工具链兼容的版本。
- 如果项目使用 pnpm、yarn 或 bun，需要把提示词中的 npm 命令统一替换为对应包管理器命令。

## 六、旧笔记内容的取舍说明

- 保留：`typescript`、`vue-tsc`、`type-check`、Husky、`lint-staged`、pre-commit 和可选的 commitlint。
- 移除：VitePress 相关内容。
- 修正：将旧的 `npx husky install` 调整为当前推荐的 `npx husky init`，并使用 `prepare: husky`。
- 补充：加入 `npm create vue@latest`、Vue 项目选项、配置合并原则、初始化后的验证流程和团队协作说明。