# 第 12 课：部署与 base 基础路径

## 本课目标

知道部署的是构建输出，能根据网站部署位置选择 `base`，会用浏览器 Network 和控制台检查部署后白屏或资源 404。

## 先分清两种网址

第一种是部署在域名根路径，例如 `https://example.com/`，应用从 `/` 开始。第二种是部署在子路径，例如 `https://example.com/my-app/`，应用从 `/my-app/` 开始。Vite 的 `base` 会影响构建后资源 URL。若部署位置是根路径，默认 `/` 通常合适；若固定部署到 `/my-app/`，配置可写：

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/my-app/',
})
```

前后斜杠都不要随意漏掉。若部署平台为每次构建生成未知嵌套路径，某些纯静态场景可研究相对 base `./`，但它并非所有路由和部署结构的万能方案，应以目标平台官方指南为准。

## 通用静态部署流程

在项目根目录执行 `npm run build`；执行 `npm run preview` 做本地生产检查；将默认的 `dist` 目录作为发布目录；在平台构建设置中通常把构建命令填为 `npm run build`，输出目录填为 `dist`；部署完成后访问平台提供的正式 URL。不同平台字段名称不同，Vite 官方静态部署指南提供 GitHub Pages、Netlify、Vercel、Cloudflare Pages 等示例，实际操作还要结合平台当时的官方文档。

不要上传 `node_modules` 当网站内容，也不要把 `src` 目录直接当构建输出。静态服务器需要提供 `dist` 中生成的 HTML 和资源。`npm run preview` 只是本地检查工具，不应作为公网上长期运行的生产服务器。

## 白屏与 404 的排查

部署后打开开发者工具的 Network。若 `index.html` 是 200，但 `/assets/...js` 是 404，重点检查 `base` 与实际部署子路径是否一致。若脚本成功加载但页面路由刷新 404，问题可能是单页应用的 history fallback，需要在部署平台配置所有前端路由回退到 `index.html`；这属于服务器或平台路由配置，不是单靠 Vite `base` 就能解决。

若接口请求 404 或 CORS，回忆第 09 课：`server.proxy` 只在 Vite 开发服务器中工作，不会被打进静态文件。生产环境 API 地址应通过环境变量或应用配置提供，代理应在部署平台、反向代理或后端设置。浏览器中出现混合内容错误时，检查 HTTPS 页面是否请求了 HTTP API。

## GitHub Pages 的两种常见情况

用户或组织站点形如 `https://用户名.github.io/`，通常使用 `/`。仓库站点形如 `https://用户名.github.io/仓库名/`，通常使用 `'/仓库名/'`。这是根据最终访问路径判断，不是看到 GitHub 就固定抄一个值。仓库改名后 base 也可能需要更新。部署工作流的 Node 版本要满足当前 Vite 要求，并使用锁文件稳定安装。

## 发布前清单

本地 build 成功；preview 功能正常；目标路径已经确认；`base` 与目标一致；敏感变量没有进入 `VITE_*`；平台构建命令和发布目录正确；正式 URL 的 HTML、JS、CSS、图片状态码正常；单页路由刷新经过测试；接口地址使用生产配置；没有把本地 `localhost` 写死在生产代码中。

## 检查点

假设正式地址为 `https://team.example/app/`，说出 base 应优先考虑 `/app/`。假设 JS 资源 404，先检查 Network 中请求路径。假设首页正常但 `/user/1` 刷新 404，检查服务器回退规则。假设开发代理有效而线上失败，检查生产代理与 API 配置。

官方依据：https://cn.vite.dev/guide/static-deploy 与 https://cn.vite.dev/config/shared-options#base
