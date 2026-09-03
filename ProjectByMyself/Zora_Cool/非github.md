不需要 Husky。这个项目已经使用 **simple-git-hooks + lint-staged + commitlint** 实现了提交时自动检查。

当前项目已经配置的流程
在 package.json:6-9 中：


"postinstall": "simple-git-hooks"
执行 pnpm install 后，会自动把 Hook 安装到 .git/hooks/。

具体 Hook 在 package.json:45-52：


"simple-git-hooks": {
  "pre-commit": "pnpm exec lint-staged",
  "commit-msg": "pnpm exec commitlint --edit $1"
},
"lint-staged": {
  "*.{vue,js,jsx}": [
    "pnpm run lint:all"
  ]
}
因此提交过程是：

执行 git commit
pre-commit 自动执行 lint-staged
如果暂存区包含 .vue/.js/.jsx 文件，则执行 pnpm run lint:all
ESLint 报错时阻止提交
commit-msg 使用 Commitlint 检查提交信息
提交信息不符合规范时阻止提交
提交信息规则来自 commitlint.config.js，例如：


feat: 增加订单列表
fix(web): 修复登录状态异常
docs: 更新项目说明
refactor: 重构请求模块