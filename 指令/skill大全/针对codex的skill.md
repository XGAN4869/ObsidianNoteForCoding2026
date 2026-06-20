codex 的 skill 规定技巧

## Scope Boundary

- 只允许修改：`pages/blog/**`、`components/blog/**`
- 禁止修改：`shared/config/**`、`package.json`、`nuxt.config.ts`
- 禁止新增依赖
- 遇到需要跨边界改动时，先停下并汇报

## Done Definition
只有同时满足以下条件才算完成：
1. 功能在目标页面可见
2. 不破坏现有路由/主题/SEO
3. `npm run typecheck` 通过
4. `npm run test` 中受影响测试通过；没有测试时补充最小验证说明
5. 输出修改文件列表、验证步骤、剩余风险

## Verification Steps
1. 运行：`npm run typecheck`
2. 运行：`npm run test`
3. 手动验证：访问 `/blog`、`/blog/[slug]`
4. 检查：移动端、暗黑模式、空状态
5. 记录：如果没跑某一步，必须说明原因

## Allowed Tools
- 允许：读文件、改目标目录文件、运行 typecheck/test/lint
- 允许：新增小型纯函数和对应测试
- 不允许：改目录结构、引入新库、批量重命名、改无关样式

## Fallback Path
如果实现失败，按下面顺序回退：
1. 保留现有结构，只做最小可运行修复
2. 去掉高风险增强功能，先保主流程
3. 无法安全完成时，输出 blocker、影响面、建议下一步