# 03 · 常见问题 FAQ

> 师傅踩过的坑，**都列在这**。

---

## 一、环境问题

### Q1：Node.js 安装后 `node -v` 没反应

**症状**：输入命令没反应 / 报错 `node: command not found` / `不是内部命令`。

**排查**：

1. **关掉命令行重开一个**（PATH 没刷新）
2. **手动加 PATH**：
   - Windows：Win + R → `sysdm.cpl` → 高级 → 环境变量 → 找 Path → 编辑 → 加 `C:\Program Files\nodejs\`
   - macOS / Linux：编辑 `~/.zshrc` 或 `~/.bashrc`，加 `export PATH="/usr/local/bin:$PATH"`
3. **装 Node.js 的时候勾了 "Add to PATH" 吗**？

---

### Q2：pnpm 装不上

**症状**：`npm install -g pnpm` 报错。

**解决**：

```bash
# 1. 用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install -g pnpm

# 2. 用 corepack（Node 自带）
corepack enable
corepack prepare pnpm@latest --activate

# 3. macOS / Linux 权限
sudo npm install -g pnpm
```

---

### Q3：pnpm install 慢 / 卡住

**解决**：

```bash
# 1. 换镜像
pnpm config set registry https://registry.npmmirror.com

# 2. 删除重装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 二、项目问题

### Q4：`pnpm dev` 报错 "Cannot find module"

**症状**：报某个模块找不到。

**解决**：

```bash
# 1. 重装依赖
rm -rf node_modules .next
pnpm install

# 2. 看完整错误（向上滚）
```

---

### Q5：浏览器打开 `localhost:3000` 显示"无法访问"

**排查**：

1. 终端里 `pnpm dev` **还在跑吗**？（没退）
2. 终端里有报错吗？
3. 试试 `127.0.0.1:3000` 而不是 `localhost:3000`
4. 看端口被占用没：`lsof -i :3000`（macOS / Linux）
5. 关掉防火墙试试

---

### Q6：改了文件浏览器不刷新

**排查**：

1. **保存文件了吗**？（最容易忘）
2. 看终端有没有报错
3. **强制刷新**：`Ctrl + Shift + R`（macOS: `Cmd + Shift + R`）
4. 关掉 `pnpm dev` 重启

---

### Q7：TypeScript 报错 "Cannot find module '@/...'"

**症状**：明明文件在，但 TS 报错找不到。

**解决**：

1. **检查 `tsconfig.json`**：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. **重启编辑器**（VSCode）
3. **重启 `pnpm dev`**

---

### Q8：Tailwind class 没生效

**症状**：写了 `bg-fg text-bg` 但页面没变。

**排查**：

1. **`tailwind.config.ts` 里 `content` 字段对吗**？
   ```ts
   content: ['./src/**/*.{ts,tsx,mdx}']
   ```
2. **CSS 变量定义了**？看 `globals.css` 有没有 `:root { --bg: ... }`
3. **保存了**？
4. **重启 dev 服务器**

---

### Q9：next/font 报 "Failed to fetch"

**症状**：报 Google Fonts 下载失败。

**原因**：**国内网络访问 Google 不稳定**。

**解决**：

```bash
# 方案 A：开代理（你懂的）
# 方案 B：用本地字体
# 方案 C：mock
```

在 `.env.local` 加：

```env
NEXT_FONT_GOOGLE_MOCKED_RESPONSES=1
```

这会让 Next.js 用本地假字体，**首次构建能跑起来**。之后再下载真字体。

或者用本地字体：

```tsx
import localFont from 'next/font/local';

const vt323 = localFont({
  src: '../public/fonts/VT323-Regular.ttf',
  display: 'swap',
});
```

---

## 三、样式问题

### Q10：圆角没去掉

**症状**：组件有圆角。

**原因**：浏览器默认样式 / 第三方组件带了圆角。

**解决**：

1. `globals.css` 里强制 `* { border-radius: 0 !important; }`
2. **检查 Tailwind 的 `rounded-none`** 有没有覆盖

---

### Q11：暗色模式不切换

**排查**：

1. **`<html>` 有 `data-theme="dark"` 吗**？（F12 看 Elements）
2. **CSS 变量切换了吗**？（Computed 标签看 `--bg` 的值）
3. **localStorage 写入了吗**？（Application 标签看 Local Storage）

---

### Q12：主题切换闪屏

**症状**：刷新页面时，先看到亮色，再变成暗色（或反过来）。

**原因**：服务端渲染了亮色，客户端才切。

**解决**：

1. **用了 `themeInitScript`**？在 `<head>` 里同步设置 `data-theme`
2. 看 `src/lib/theme.ts` 的 `themeInitScript` 是否注入

---

### Q13：颜色不对 / 不一致

**症状**：有的地方白底黑字，有的地方黑底白字。

**排查**：

1. **用了 Tailwind 的 `bg-white` / `bg-black`**？换成 `bg-bg` `bg-fg`
2. **有地方忘了用 CSS 变量**？

---

### Q14：图片模糊

**症状**：像素图在浏览器里看起来糊。

**排查**：

1. **CSS 有 `image-rendering: pixelated`** 吗？
2. **图片被 Next.js 优化了**？用 `unoptimized`
4. **图片被拉伸到非整数倍**？保持原始比例

---

### Q15：字体模糊

**症状**：字体在浏览器里看起来糊。

**排查**：

1. **用了 `next/font/google`**？会自动优化
2. **字号是 4 的倍数吗**？（16/24/32/48）
3. **`font-smooth: never`** 加了吗？

---

## 四、数据问题

### Q16：博客文章读不到

**排查**：

1. **文件在 `content/posts/` 下**？
2. **文件名是英文**？（不要用中文）
3. **frontmatter 格式对吗**？（三个 `-` 开头结尾）
4. 看终端 `pnpm dev` 有没有报错

---

### Q17：本地 JSON 改了，部署后没生效

**原因**：**Serverless 函数不能跨请求保持文件状态**。

**解决**：

1. 用 GitHub API 方案（教程里有）
2. 或用 Vercel KV / Supabase
3. 或纯前端 localStorage

---

### Q18：API 路由报 "GITHUB_TOKEN is not defined"

**排查**：

1. `.env.local` 里加了吗？
2. **重启 `pnpm dev`**（环境变量只在启动时读）
3. **变量名对吗**？（`GITHUB_TOKEN`，不是 `GITHUB_TOKEN=`）

---

### Q19：localStorage 数据丢了

**原因**：用户清缓存 / 隐私模式 / 换设备。

**解决**：

1. **用 API + 数据库**（Vercel KV / Supabase）
2. **接受丢失**（个人博客，OK）
3. **加导出 / 导入按钮**

---

## 五、部署问题

### Q20：Vercel 部署失败

**排查**：

1. 看 Vercel Dashboard → Deployments → 失败的部署日志
2. **本地先跑 `pnpm build`** 确认能编译
3. **环境变量在 Vercel 里加了吗**？

---

### Q21：部署后样式不对

**排查**：

1. **CSS 文件被打包了**？看 Network 标签里 CSS 200 OK
2. **CSS 变量在生产环境生效吗**？看 Computed 标签
3. **图片 404**？看 Console 标签

---

### Q22：Google Fonts 在国内访问慢

**解决**：

1. 本地化字体（前面讲过）
2. 用 Cloudflare R2 / 阿里 OSS 存字体
3. 用 `@font-face` 加 CDN

---

### Q23：域名访问不到

**排查**：

1. **DNS 加了吗**？（CNAME / A 记录）
2. **DNS 生效了吗**？（`nslookup yourdomain.com`）
3. **HTTPS 证书生成了吗**？（Vercel 自动）
4. **等 5 分钟到 48 小时**

---

## 六、其他常见错误

### Q24：删代码后报错 "Module not found"

**排查**：

```bash
# 1. 全局搜索
grep -r "import.*旧文件" src/

# 2. 删除所有 import

# 3. 重启
```

---

### Q25：`pnpm build` 报错但 `pnpm dev` 不报错

**原因**：生产构建会做更严格的检查（TypeScript / ESLint）。

**解决**：

1. 看具体报错
2. **修复类型错误**
3. 或 `next.config.mjs` 里临时加 `eslint: { ignoreDuringBuilds: true }`（**不推荐**）

---

### Q26：动画卡顿

**排查**：

1. **用了 `transition: all`**？换成具体属性
2. **用了 `will-change`**？
3. **图片太大**？
4. **动画 fps 高**？像素风**不需要 60fps**，跳帧就好

---

### Q27：组件没刷新

**症状**：改了组件代码，浏览器没反应。

**排查**：

1. **保存了**？
2. **保存的是 .tsx 不是 .ts**？（同名 .ts 和 .tsx 会冲突）
3. **重启 `pnpm dev`**
4. **重启编辑器**

---

### Q28：报 "Hydration failed"

**症状**：React 报 hydration mismatch。

**原因**：服务端和客户端渲染的内容不一样。

**常见情况**：
- 用 `new Date()` 在组件里（服务器和客户端时间不同）
- 用 `localStorage`（服务器没有 localStorage）
- 用 `window` 对象（服务器没有 window）

**解决**：
- 这些逻辑放 `useEffect` 里（**只在客户端跑**）
- 用 `useState` + `mounted` 状态保护

---

### Q29：路由跳转后样式丢了

**排查**：

1. **用了 `<a>` 而不是 `<Link>`**？
2. **样式用了 scoped CSS**？Next.js 不支持
3. **全局 CSS 没在 layout 里 import**？

---

### Q30：访问 `/posts/中文-slug` 404

**原因**：中文 URL slug 在 Next.js dynamic route 里默认**不支持**。

**解决**：

1. **永远用英文 slug**（推荐）
2. 或用 `[...slug]` catch-all 路由
3. 或手动 `encodeURIComponent` + `decodeURIComponent`

---

## 七、性能问题

### Q31：首屏加载慢

**排查**：

1. Lighthouse → Performance
2. **看 LCP 元素**是什么（图片？字体？）
3. **bundle 太大**？拆代码
4. **用 `next/dynamic`**

---

### Q32：图片加载慢

**解决**：

1. **用 `next/image`**
2. **像素图用 `unoptimized`**
3. **封面图压缩到 200KB 以内**
4. **用 WebP / AVIF 格式**

---

### Q33：移动端卡顿

**排查**：

1. **有动画太多**？减
3. **图片懒加载**？加 `loading="lazy"`
4. **关闭不必要的过渡**

---

## 八、调试技巧

### Q34：怎么找 bug

1. **看终端日志**（红字 = 错误）
2. **看浏览器 Console**（F12）
3. **看 Network**（哪个请求失败）
4. **二分法**：注释一半代码，跑；如果好了，说明问题在注释那部分
5. **AI**：把报错 + 代码贴给 AI

### Q35：怎么问 AI 才好

好的提问：

```
我在做 XX 任务，按教程走到第 X 步。
运行 X 命令时，终端报错：[截图报错]
我已经试过：[列出你做过的尝试]
请帮我：找出问题原因 + 怎么修。
```

不好的提问：

```
不行
报错
```
---

## 九、避坑总结

### 师傅的 10 条经验

1. **别跳步骤** —— 教程里的步骤都是师傅踩过的坑
2. **看错误先看第一行** —— 关键信息在报错的第一行
3. **复制粘贴出错** —— 看有没有空格、引号、特殊字符
4. **重启大法** —— dev 服务器、VSCode、浏览器，遇到奇怪问题先重启
6. **不要修改框架代码** —— `node_modules` 永远别碰
7. **commit 经常 commit** —— 出问题 `git reset --hard HEAD~1` 回滚
8. **用 GitHub 备份** —— `git push` 是你的最强备份
9. **学会二分法** —— 不知道哪里出问题，注释一半代码跑跑看
10. **别问"为什么"**，先问"是不是" —— 排查问题先确认问题

---

## 十、最后的最后

> **如果遇到教程里没列的问题**：
>
> 1. 把报错信息贴给 AI
> 2. Google 报错信息的第一行
> 3. 去 Stack Overflow / GitHub Issues 搜
> 4. 问有经验的朋友
>
> **永远别问"为什么"而不带具体信息**。

**师傅祝你搭博客顺利。** 🖤

---

**教程结束。**

> 接下来：**自己写代码、做自己的设计、调自己的样式**。
>
> 教程只是起点，**真正的博客是你的**。