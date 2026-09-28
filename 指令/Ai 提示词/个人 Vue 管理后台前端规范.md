1. 技术栈：Vue3、Vite、TypeScript、Pinia、Router、Axios、TDesign、Tailwind、Less。
2. 格式：UTF-8、LF、两空格、单引号、无分号、100 字宽；提交前通过 lint 和类型检查。
3. TS：新增公共模块必须用 TS，存量 JS 渐进迁移，禁止双实现。
4. 命名：页面 `resource/resource.vue`，组件 `PascalCase.vue`，composable `useXxx.ts`，store `useXxxStore`，API `apiXxx`。
5. 表格：分页 `pagination`，数据 `tableData`，请求 `fetchTableData`，搜索参数 `searchFormParams`。
6. 表单：实例 `formRef`，规则 `rules`，校验 `validateForm`，提交 `handleSubmit`。
7. 组件：统一 `<script setup>`、`defineProps`、`defineEmits`、`defineModel`；禁止修改 props。
8. 初始化：`main.ts` 只做 `initStore`、`initRouter`、`setupXxx`，业务放 API、store、composable、页面。
9. 路由：path 用 kebab-case，name 用 PascalCase，页面懒加载；Pinia 用 setup store，store id 用单数。
10. 请求：统一处理 token、业务码、HTTP 错误、401、loading；成功返回 data，错误继续 reject。
11. 样式：Tailwind 做简单布局，复杂样式用 scoped Less，全局只放 reset 和第三方覆盖。
12. 质量：composable、request、utils 必须写 Vitest；异步用 try/catch/finally，禁止调试日志。
13. 原则：新代码必须遵守，存量逐步收敛，禁止新增第二套写法。
