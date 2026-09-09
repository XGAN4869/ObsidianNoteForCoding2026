# 02 · SEO 与 RSS

> 让 Google 搜到你的博客，让读者订阅你的更新。

---

## 一、SEO 是什么

**SEO（Search Engine Optimization）** = 让搜索引擎更好地收录和排名你的博客。

**我们关心的 3 件事**：

1. **被收录**：Google / 百度能找到你
2. **排名高**：搜相关关键词时排前面
3. **展示好**：搜索结果显示正确的标题、简介、图片

---

## 二、Next.js 内置 SEO 工具

Next.js 自带：

| 工具 | 作用 |
| --- | --- |
| **Metadata API** | 设置 `<title>`、`<meta>` |
| **OG Image** | 社交分享时的预览图 |
| **sitemap.xml** | 自动生成站点地图 |
| **robots.txt** | 告诉爬虫能爬哪些页 |
| **JSON-LD** | 结构化数据 |

---

## 三、全局 metadata

打开 `src/app/layout.tsx`：

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yourname.com'),  // ← 改成你的域名
  title: {
    default: 'PixelBlog - 一个 1-bit 像素风的博客',
    template: '%s · PixelBlog',  // 子页面的 title 会自动加这个后缀
  },
  description: '一个 1-bit 像素风的个人博客，记录代码、生活、像素艺术。',
  keywords: ['博客', '像素风', '前端', 'Next.js', '1-bit'],
  authors: [{ name: '你的名字' }],
  creator: '你的名字',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://yourname.com',
    siteName: 'PixelBlog',
    title: 'PixelBlog',
    description: '一个 1-bit 像素风的个人博客',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixelBlog',
    description: '一个 1-bit 像素风的个人博客',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};
```

---

## 四、每页 metadata

每个页面**单独覆盖**：

```tsx
// app/posts/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      images: post.meta.cover ? [post.meta.cover] : ['/og.png'],
    },
  };
}
```

---

## 五、自动生成 sitemap.xml

Next.js 15 支持**文件式 sitemap**。

新建 `src/app/sitemap.ts`：

```ts
import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { getAllFriends } from '@/lib/friends';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourname.com';

  // 静态页面
  const staticRoutes = ['', '/posts', '/capsules', '/todos', '/about', '/friends', '/guestbook'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.7,
    }),
  );

  // 博客文章
  const posts = await getAllPosts();
  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}
```

访问 `/sitemap.xml` 就能看到（**自动生成**，**不用手维护**）。

---

## 六、自动生成 robots.txt

新建 `src/app/robots.ts`：

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://yourname.com/sitemap.xml',
  };
}
```

访问 `/robots.txt` 就能看到。

---

## 七、OG Image（社交分享预览图）

当别人把你的博客链接分享到 Twitter / 微博 / 微信时，**会显示一张预览图**。

### 静态 OG 图

新建 `public/og.png`（1200x630 像素）。

### 动态 OG 图（Next.js OG）

更高级的方案：**每篇文章自动生成 OG 图**。

新建 `src/app/og/route.tsx`（**注意路径**）：

```tsx
import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/posts';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  let title = 'PixelBlog';
  let description = '一个 1-bit 像素风的个人博客';

  if (slug) {
    const post = await getPostBySlug(slug);
    if (post) {
      title = post.meta.title;
      description = post.meta.description ?? '';
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 30 }}>
          {title}
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>{description}</div>
        <div style={{ fontSize: 24, position: 'absolute', bottom: 60, opacity: 0.5 }}>
          pixel-blog.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
```

用：

```tsx
// app/posts/[slug]/page.tsx
openGraph: {
  images: [`/og?slug=${post.meta.slug}`],  // ← 自动生成
},
```

---

## 八、JSON-LD 结构化数据

帮助 Google 更好地理解你的页面。

新建 `src/components/JsonLd.tsx`：

```tsx
type Props = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

在博客详情页用：

```tsx
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta.title,
    datePublished: post.meta.date,
    author: {
      '@type': 'Person',
      name: '你的名字',
    },
    description: post.meta.description,
  }}
/>
```

---

## 九、RSS 订阅

### 安装

```bash
pnpm add feed
```

### RSS 路由

新建 `src/app/rss.xml/route.ts`：

```ts
import { Feed } from 'feed';
import { getAllPosts } from '@/lib/posts';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourname.com';

  const feed = new Feed({
    title: 'PixelBlog',
    description: '一个 1-bit 像素风的个人博客',
    id: siteUrl,
    link: siteUrl,
    language: 'zh-CN',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: 'All rights reserved 2026, Your Name',
    feedLinks: {
      rss2: `${siteUrl}/rss.xml`,
    },
  });

  const posts = await getAllPosts();
  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${siteUrl}/posts/${post.slug}`,
      link: `${siteUrl}/posts/${post.slug}`,
      description: post.description ?? '',
      date: new Date(post.date),
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
```

访问 `/rss.xml` 就能看到 RSS。

### 让读者订阅

在导航或 footer 加：

```tsx
<a href="/rss.xml">[RSS]</a>
```

**所有 RSS 阅读器**（Feedly、NetNewsWire、Reeder）都能识别这个 URL。

---

## 十、提交搜索引擎

### Google Search Console

1. 打开 <https://search.google.com/search-console/>
2. 添加你的网站
3. 验证（DNS / HTML 文件 / Meta tag 三选一）
4. 提交 sitemap：`https://yourname.com/sitemap.xml`

### 百度站长平台

1. 打开 <https://ziyuan.baidu.com/>
2. 添加网站（**需要 ICP 备案**）
3. 验证后提交 sitemap

### Bing Webmaster Tools

1. 打开 <https://www.bing.com/webmasters>
2. 添加网站
3. 提交 sitemap

> ⚠️ **百度需要备案**，没备案的域名**不能提交百度**。

---

## 十一、SEO 检查工具

| 工具 | 用途 |
| --- | --- |
| **Google Lighthouse** | 性能 / SEO / 可访问性评分 |
| **Google Search Console** | 收录情况、关键词排名 |
| **Bing Webmaster** | Bing 收录 |
| **Meta SEO Inspector**（Chrome 插件） | 看页面 SEO 元信息 |

跑 Lighthouse：

1. 打开博客
2. F12 → Lighthouse 标签
3. 勾 "SEO" 和 "Performance"
4. 点 "Analyze page load"
5. 看分数（目标：90+）

---

## 十二、常见 SEO 误区

| ❌ 误区 | ✅ 正确 |
| --- | --- |
| "标题要堆关键词" | 标题**写得自然**，1-2 个关键词 |
| "Description 写什么都行" | Description 是**搜索结果展示的**，写得有吸引力 |
| "图片不用 alt" | **每张图必须有 alt** |
| "链接越多越好" | **质量 > 数量**，友链找相关的 |
| "H1 用一次" | ✅ **每个页面只有 1 个 H1** |
| "Meta keywords 重要" | ❌ Google **不用** Meta keywords |

---

## 十三、做完了的标志

- [ ] `<title>` / `<description>` 每页不同
- [ ] `/sitemap.xml` 可访问
- [ ] `/robots.txt` 可访问
- [ ] `/rss.xml` 可访问
- [ ] OG Image 显示正常（分享博客链接时能看到）
- [ ] JSON-LD 结构化数据
- [ ] Google Search Console 提交
- [ ] Lighthouse SEO 分数 ≥ 90

---

**下一步** → 打开 [`03-性能与可访问性.md`](03-性能与可访问性.md)