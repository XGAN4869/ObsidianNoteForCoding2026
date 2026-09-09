# 01 · 部署到 Vercel

> 一键部署到全球 CDN，自动 HTTPS，免费，**比你自己买服务器快 100 倍**。

---

## 一、什么是 Vercel

- **Next.js 的母公司出品**（同一个团队）
- 部署 = push 代码到 GitHub，Vercel **自动构建 + 上线**
- 全球 CDN（亚洲、美洲、欧洲都有节点）
- **免费版够个人博客**：每月 100 GB 流量、无限次部署

**官网**：<https://vercel.com/>

---

## 二、部署前准备

### 你需要

- [ ] 一个 **GitHub 账号**（如果你已经有，跳过）
- [ ] 你的代码 **push 到 GitHub**（如果你还没做，看下面）
- [ ] 一个 **Vercel 账号**（用 GitHub 登录就行）

### 把代码 push 到 GitHub

#### 步骤 1：在 GitHub 建仓库

1. 登录 <https://github.com>
2. 右上角 `+` → `New repository`
3. 仓库名：`pixel-blog`（或你喜欢的名字）
4. **不要**勾 `Initialize with README`（因为你的项目已经有 README 了）
5. 点 **Create repository**

#### 步骤 2：本地推代码

```bash
cd pixel-blog

# 第一次推送，GitHub 会告诉你命令，这里给完整版：
git init                                  # 已经在 dev 阶段做过就跳过
git add .
git commit -m "feat: 完整的像素风博客"

# 关联 GitHub 仓库（替换成你的）
git remote add origin https://github.com/yourname/pixel-blog.git

# 分支名：GitHub 默认 main，旧项目是 master
# 看 GitHub 提示用的是哪个

git branch -M main                          # 重命名为 main
git push -u origin main                    # 第一次推送
```

> 推送时**会弹窗**让你输 GitHub 用户名密码。
> 现在 GitHub 不用密码了，用 **Personal Access Token**（教程前面有讲）。

### `.gitignore` 检查

确保 `data/*.db`、`data/*.json` 之类的**别 commit 私人数据**。

我们用的是 JSON（提交就行）+ MDX（提交），所以**所有数据都进 Git**。

如果有私人 token / 密钥，加进 `.env.local`（**已经被 .gitignore 排除**）。

---

## 三、部署到 Vercel

### 步骤 1：登录 Vercel

1. 打开 <https://vercel.com/>
2. 点 **Sign Up**（或 Log In）
3. 选 **Continue with GitHub**
4. 授权 Vercel 访问你的 GitHub

### 步骤 2：导入项目

1. Vercel Dashboard → 点 **Add New... → Project**
2. **Import Git Repository** 区会列出你的 GitHub 仓库
3. 找到 `pixel-blog`，点 **Import**

### 步骤 3：配置

| 配置项 | 怎么填 |
| --- | --- |
| **Project Name** | `pixel-blog`（会成为 `pixel-blog.vercel.app` 子域） |
| **Framework Preset** | 选 **Next.js**（自动检测） |
| **Root Directory** | 默认 `./` |
| **Build Command** | 默认（`next build`） |
| **Output Directory** | 默认（`.next`） |
| **Install Command** | 默认（`pnpm install`，如果你的 package.json 写了 pnpm） |

### 步骤 4：环境变量

**这一步很重要**，你的 `GITHUB_TOKEN` 之类的要在这里加：

1. 同一个页面，**Environment Variables** 区域
2. 填：
   - `GITHUB_TOKEN` = `ghp_xxxxx`
   - `GITHUB_REPO` = `yourname/pixel-blog`
3. 点 **Add** 添加
4. 可以选环境（Production / Preview / Development）—— 全勾

### 步骤 5：Deploy

点 **Deploy** 按钮。

会跑一个实时日志（看构建过程），通常 1-3 分钟完成。

完成后会显示：
```
✓ Deployment completed
🎉 Your project is live at https://pixel-blog.vercel.app
```

**点链接就能看到博客了 ✅**

---

## 四、自定义域名

### 用你自己的域名

1. Vercel Dashboard → 选项目 → **Settings → Domains**
2. 输入你的域名（比如 `yourname.com`）
3. Vercel 会告诉你加 DNS 记录
4. 去你的域名注册商（比如阿里云 / Cloudflare）加：
   - **A 记录**：`@` → `76.76.21.21`
   - **CNAME 记录**：`www` → `cname.vercel-dns.com`
5. 等 DNS 生效（**5 分钟到 48 小时**，通常 10 分钟）

### 用 Vercel 子域名

什么都不用做，**默认就有** `xxx.vercel.app`。

---

## 五、自动部署

每次你 push 代码到 GitHub：

```bash
git add .
git commit -m "fix: 修复首页胶囊不显示"
git push
```

Vercel 会**自动检测**，重新构建，**1-3 分钟后线上更新**。

### 预览部署（Preview）

如果你不是直接 push 到 `main`，而是**开 PR**：

```bash
git checkout -b feat/add-new-post
git push origin feat/add-new-post
```

然后到 GitHub 开 Pull Request，Vercel 会给这个分支一个**预览 URL**（比如 `pixel-blog-git-feat-add-new-post-yourname.vercel.app`），**不会影响线上**，你可以放心改。

合并 PR 后，**预览 URL 自动失效**，主线用新的代码。

---

## 六、其他部署平台

| 平台 | 难度 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **Vercel**（推荐） | ★ | 零配置，最适合 Next.js | 免费版有流量限制 |
| **Netlify** | ★ | 跟 Vercel 类似 | 不如 Vercel 适合 Next.js |
| **Cloudflare Pages** | ★ | 全球 CDN，免费额度大 | 配置稍复杂 |
| **GitHub Pages** | ★★ | 免费，跟代码同仓库 | 不支持 Serverless 函数 |
| **自己的 VPS** | ★★★ | 完全可控 | 要自己维护 |

**师傅推荐 Vercel**。

---

## 七、监控 & 分析

### 启用 Vercel Analytics（可选）

Vercel Dashboard → 项目 → **Analytics** → **Enable**

免费版能看到：
- 访问量
- Top 页面
- 加载性能

> 但 **Vercel Analytics 收费**（每月 $10 起步），先**不开**。

### 免费替代：Plausible / Umami

| 平台 | 价格 | 隐私 |
| --- | --- | --- |
| **Plausible** | 付费 / 自托管免费 | **不收集个人数据**，合规 |
| **Umami** | 完全免费、自托管 | 跟 Plausible 类似 |

简单做法：用 **Umami Cloud**（<https://cloud.umami.is/>），**免费 10 万访问/月**。

---

## 八、部署后的检查清单

- [ ] 网站能打开
- [ ] 首页正常
- [ ] 路由都正常（/posts、/about 等）
- [ ] 暗色 / 亮色切换正常
- [ ] 字体加载正常（**国内可能慢**，看下一节）
- [ ] 图片正常显示
- [ ] 移动端排版好看

---

## 九、国内访问优化

> Vercel 在国内访问**有时慢**。

### 方案 A：用 Vercel 自带的国内加速

Vercel 在中国大陆有合作 CDN（边缘网络），**自动启用**，但效果不稳定。

### 方案 B：迁移到 Cloudflare Pages

Cloudflare 在国内**访问**比 Vercel 稍好（毕竟全球最大 CDN 之一）。

**迁移步骤**：
1. Cloudflare Dashboard → Pages → Connect to Git
2. 选你的 GitHub 仓库
3. 配置：
   - Build command: `next build`
   - Build output: `.next`
4. 加环境变量

### 方案 C：用国内平台（备案后）

| 平台 | 备案要求 |
| --- | --- |
| 阿里云 / 腾讯云函数计算 | 域名要 ICP 备案 |
| 阿里云 / 腾讯云 Serverless | 同上 |
| 字节跳动 Cloud | 部分情况需要备案 |

> 如果你要长期国内访问，**域名 ICP 备案**（国内强制要求），约 7-20 天。
> 备案流程：阿里云 / 腾讯云搜"ICP 备案"。

---

## 十、回滚 / 重新部署

### 回滚到上一个版本

Vercel Dashboard → 项目 → **Deployments** → 找上一个部署 → 点菜单 → **Promote to Production**

### 强制重新部署

Vercel Dashboard → 项目 → **Deployments** → 最新一个 → 点菜单 → **Redeploy**

或者本地：

```bash
git commit --allow-empty -m "chore: 触发部署"
git push
```

---

## 十一、部署相关的环境变量清单

`.env.local`：

```env
# GitHub API（如果你用了 Giscus / GitHub API 写 JSON）
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO=yourname/pixel-blog

# 站点 URL（SEO 用）
NEXT_PUBLIC_SITE_URL=https://yourname.com

# Plausible 分析（可选）
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourname.com

# 其他任何第三方服务的密钥
```

> ⚠️ **注意**：`NEXT_PUBLIC_*` 开头的变量会**暴露给浏览器**（任何人都能看到）。
> **只放公开信息**（比如站点 URL）。
> 不公开的密钥（`GITHUB_TOKEN`）**不要加 `NEXT_PUBLIC_` 前缀**。

---

## 十二、做完了的标志

- [ ] 代码 push 到 GitHub
- [ ] Vercel 部署成功
- [ ] 访问 `https://xxx.vercel.app` 看到博客
- [ ] 每次 push 自动部署
- [ ] （可选）自定义域名

---

**下一步** → 打开 [`02-SEO 与 RSS.md`](02-SEO%20与%20RSS.md)