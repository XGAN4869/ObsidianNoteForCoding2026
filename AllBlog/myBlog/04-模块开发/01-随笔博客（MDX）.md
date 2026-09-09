# 01 · 随笔博客（MDX）

> 像写 Word 一样写博客，自动生成 HTML，自动部署上线。

---

## 一、什么是 MDX

| 格式 | 是什么 |
| --- | --- |
| **Markdown** | 普通文本格式，写标题/段落/列表 |
| **MDX** | Markdown + JSX = 能在文章里写 React 组件 |

**普通 Markdown**：

```md
# 你好

这是 **粗体**，这是 *斜体*。

- 列表项 1
- 列表项 2
```

**MDX 还能这样**：

```mdx
# 你好

这是一段普通文字。

<PixelAlert>这是 React 组件！</PixelAlert>

这是组件后面的内容。
```

**为什么用 MDX？**

- 文章里可以**嵌入像素组件**（比如像素猫、图片画廊）
- 文章本身就是 **React 树的一部分**
- 不影响 Markdown 的简洁

---

## 二、依赖安装

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react gray-matter remark-gfm rehype-highlight highlight.js date-fns
pnpm add -D @types/hast
```

| 包 | 干什么 |
| --- | --- |
| `@next/mdx` | Next.js 支持 MDX |
| `@mdx-js/loader` | Webpack 加载 MDX |
| `gray-matter` | 解析 frontmatter（文章头部的元信息） |
| `remark-gfm` | GitHub 风格 Markdown（表格、删除线、任务列表） |
| `rehype-highlight` | 代码高亮 |
| `highlight.js` | 代码高亮主题 |
| `date-fns` | 日期格式化 |

---

## 三、配置

### 步骤 1：更新 `next.config.mjs`

```js
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
};

export default withMDX(nextConfig);
```

### 步骤 2：创建 `mdx-components.tsx`

> 这个文件告诉 Next.js："MDX 里的标签用什么 React 组件渲染"。

在项目**根目录**创建 `mdx-components.tsx`（跟 `src/` 平级）：

```tsx
import type { MDXComponents } from 'mdx/types';
import { PixelCard } from '@/components/pixel/PixelCard';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 让所有 <h1> 自动用我们的样式
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 border-b-2 border-fg pb-1">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="my-3 leading-relaxed">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside my-3 ml-4">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside my-3 ml-4">{children}</ol>
    ),
    li: ({ children }) => <li className="my-1">{children}</li>,
    a: ({ children, href }) => (
      <a href={href} className="underline underline-offset-2">
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-fg pl-4 my-3 italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="px-1 border border-fg bg-bg">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="border-2 border-fg p-4 my-4 overflow-x-auto">
        {children}
      </pre>
    ),
    hr: () => <hr className="border-0 border-t-2 border-fg my-6" />,

    // 自定义组件（在 MDX 里直接用）
    PixelCard,

    ...components,
  };
}
```

---

## 四、写第一篇博客

### 文件位置

```
content/posts/hello-world.mdx
```

> **文件名 = URL slug**：
> `hello-world.mdx` → `/posts/hello-world`
> **永远不要用中文文件名**。

### 文件内容

```mdx
---
title: 'Hello, Pixel Blog'
date: '2026-09-08'
tags: ['随笔', '开篇', '像素风']
description: '这是我的第一篇像素风博客，介绍这个博客的来历。'
cover: '/images/posts/hello-world.png'
---

# 你好，世界

这是我用 **Next.js** 搭的第一个像素风博客。

## 为什么用像素风

- 简单（只有黑白两色）
- 复古（80 年代游戏机的味道）
- 有辨识度（不像"又一个 Bootstrap 博客"）

## 代码示例

\`\`\`ts
function hello() {
  console.log('hello, pixel world');
}
\`\`\`

> 这是引用块。

## 任务清单

- [x] 搭起项目
- [x] 配主题切换
- [ ] 写第二篇博客

## 一个像素组件

<PixelCard>
  <h3 className="text-xl font-bold">我在文章里！</h3>
  <p className="p-4">MDX 嵌入了 React 组件</p>
</PixelCard>
```

### Frontmatter 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期，格式 `YYYY-MM-DD` |
| `tags` | ❌ | 标签数组 |
| `description` | ❌ | 简介，SEO 用 |
| `cover` | ❌ | 封面图 URL（`/images/...`） |

---

## 五、读取博客（lib/posts.ts）

新建 `src/lib/posts.ts`：

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { Post, PostMeta } from '@/types/post';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

/**
 * 取所有文章元信息（按日期倒序）
 */
export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const mdxFiles = files.filter((f) => /\.mdx?$/.test(f));

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.replace(/\.mdx?$/, '');
        const meta = await getPostMeta(slug);
        return meta;
      }),
    );

    return posts.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

async function getPostMeta(slug: string): Promise<PostMeta> {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? ''),
    tags: data.tags ?? [],
    description: data.description,
    cover: data.cover,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      meta: {
        slug,
        title: data.title ?? slug,
        date: data.date instanceof Date
          ? data.date.toISOString().slice(0, 10)
          : String(data.date ?? ''),
        tags: data.tags ?? [],
        description: data.description,
        cover: data.cover,
      },
      body: content,
    };
  } catch {
    return null;
  }
}

/** 取所有标签 + 每个标签的文章数 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** 按标签过滤 */
export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.tags.includes(tag));
}

/** 取上一篇和下一篇 */
export async function getAdjacentPosts(slug: string) {
  const posts = await getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? posts[idx - 1] : null,
    next: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}
```

### 类型定义 `src/types/post.ts`

```ts
export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description?: string;
  cover?: string;
};

export type Post = {
  meta: PostMeta;
  body: string;
};
```

---

## 六、文章列表页

新建 `src/app/posts/page.tsx`：

```tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { PostCard } from '@/components/blog/PostCard';
import { PixelEmpty } from '@/components/pixel';
import { Container } from '@/components/layout/Container';

export const metadata = {
  title: '随笔 · PixelBlog',
  description: '我的所有随笔',
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <Container>
      <h1 className="text-4xl font-bold mb-6">[ 随笔 ]</h1>
      <p className="text-sm mb-6">共 {posts.length} 篇</p>

      {posts.length === 0 ? (
        <PixelEmpty
          icon="[·]"
          title="还没有随笔"
          description="在 content/posts/ 下加一篇 .mdx 吧"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="no-underline">
                <PostCard post={post} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
```

### PostCard 组件

新建 `src/components/blog/PostCard.tsx`：

```tsx
import { PixelCard } from '@/components/pixel';
import { formatDate } from '@/lib/date';
import type { PostMeta } from '@/types/post';
import { TagList } from './TagList';

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <PixelCard interactive>
      <div className="p-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold">{post.title}</h2>
        <p className="text-sm">
          [{formatDate(post.date)}]
          {post.tags.length > 0 && (
            <>
              {' · '}
              <TagList tags={post.tags} />
            </>
          )}
        </p>
        {post.description && (
          <p className="mt-1">{post.description}</p>
        )}
      </div>
    </PixelCard>
  );
}
```

### TagList 组件

新建 `src/components/blog/TagList.tsx`：

```tsx
import { PixelBadge } from '@/components/pixel';

export function TagList({ tags }: { tags: string[] }) {
  return (
    <span className="inline-flex gap-1 flex-wrap">
      {tags.map((tag) => (
        <PixelBadge key={tag} variant="outline">
          #{tag}
        </PixelBadge>
      ))}
    </span>
  );
}
```

### 日期工具 `src/lib/date.ts`

新建：

```ts
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: string | Date, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

/** 相对时间："3 天前" */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return '今天';
  if (diff < 2 * day) return '昨天';
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / (365 * day))} 年前`;
}
```

---

## 七、文章详情页

新建 `src/app/posts/[slug]/page.tsx`：

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getPostBySlug, getAllPosts, getAdjacentPosts } from '@/lib/posts';
import { Container } from '@/components/layout/Container';
import { TagList } from '@/components/blog/TagList';
import { formatDate } from '@/lib/date';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.meta.title} · PixelBlog`,
    description: post.meta.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = await getAdjacentPosts(slug);

  return (
    <Container>
      <article className="flex flex-col gap-4">
        <header className="border-b-2 border-fg pb-4">
          <h1 className="text-4xl font-bold">{post.meta.title}</h1>
          <p className="text-sm mt-2">
            [{formatDate(post.meta.date)}]
            {post.meta.tags.length > 0 && (
              <>
                {' · '}
                <TagList tags={post.meta.tags} />
              </>
            )}
          </p>
          {post.meta.description && (
            <p className="mt-2 italic">{post.meta.description}</p>
          )}
        </header>

        <div className="prose-pixel">
          <MDXRemote
            source={post.body}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeHighlight],
              },
            }}
          />
        </div>

        <nav className="border-t-2 border-fg pt-4 flex justify-between gap-4 flex-wrap">
          {prev ? (
            <Link href={`/posts/${prev.slug}`} className="no-underline">
              <PixelCard className="hover:shadow-pixel-sm">← {prev.title}</PixelCard>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/posts/${next.slug}`} className="no-underline">
              <PixelCard className="hover:shadow-pixel-sm">{next.title} →</PixelCard>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </Container>
  );
}
```

### 安装 `next-mdx-remote`

```bash
pnpm add next-mdx-remote
```

> 因为我们用了 `@next/mdx` 配置 MDX 文件作为 page，**但文章详情页是从 frontmatter + body 字符串动态渲染**——所以用 `next-mdx-remote/rsc`。

---

## 八、文章正文样式 `src/styles/prose.css`

新建：

```css
/* 文章正文样式 */

/* 行内代码 */
.prose-pixel code {
  background: var(--bg);
  border: 1px solid var(--fg);
  padding: 0 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.95em;
}

/* 代码块 */
.prose-pixel pre {
  background: var(--bg);
  border: 2px solid var(--fg);
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  box-shadow: 4px 4px 0 0 var(--fg);
}

.prose-pixel pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* highlight.js 主题覆盖 */
.prose-pixel .hljs {
  background: transparent;
  color: var(--fg);
}

.prose-pixel .hljs-comment,
.prose-pixel .hljs-quote {
  color: var(--fg);
  opacity: 0.6;
  font-style: italic;
}

.prose-pixel .hljs-keyword,
.prose-pixel .hljs-selector-tag,
.prose-pixel .hljs-built_in,
.prose-pixel .hljs-name {
  font-weight: bold;
}

.prose-pixel .hljs-string,
.prose-pixel .hljs-attr {
  /* 字符串用同色，靠斜体区分 */
  font-style: italic;
}

.prose-pixel .hljs-number,
.prose-pixel .hljs-literal {
  text-decoration: underline;
}

/* 表格 */
.prose-pixel table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.prose-pixel th,
.prose-pixel td {
  border: 2px solid var(--fg);
  padding: 8px 12px;
  text-align: left;
}

.prose-pixel th {
  background: var(--fg);
  color: var(--bg);
}

/* 图片 */
.prose-pixel img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border: 2px solid var(--fg);
  image-rendering: pixelated;
}

/* 引用 */
.prose-pixel blockquote {
  border-left: 4px solid var(--fg);
  padding-left: 16px;
  margin: 16px 0;
  font-style: italic;
}
```

在 `layout.tsx` 引入：

```tsx
import '@/styles/prose.css';
```

---

## 九、首页加"最新随笔"模块

修改 `src/app/page.tsx`：

```tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PixelCard } from '@/components/pixel';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/layout/Container';

export default async function Home() {
  const posts = (await getAllPosts()).slice(0, 3);

  return (
    <Container>
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold">[ PixelBlog ]</h1>
          <p className="mt-2">一个 1-bit 像素风的个人博客</p>
        </div>
        <ThemeToggle />
      </header>

      <PixelCard>
        <h2 className="text-2xl font-bold p-4 border-b-2 border-fg">📝 最新随笔</h2>
        {posts.length === 0 ? (
          <p className="p-4">还没写过文章。</p>
        ) : (
          <ul className="p-4 flex flex-col gap-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`} className="no-underline">
                  <PixelCard interactive>
                    <div className="p-4">
                      <h3 className="text-xl font-bold">{post.title}</h3>
                      <p className="text-sm mt-1">{post.description}</p>
                    </div>
                  </PixelCard>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="p-4 border-t-2 border-fg">
          <Link href="/posts" className="no-underline">
            [查看全部 →]
          </Link>
        </div>
      </PixelCard>
    </Container>
  );
}
```

---

## 十、新增文章的流程

**每次写新文章 = 3 步**：

1. **创建文件**：`content/posts/my-new-post.mdx`
2. **写 frontmatter + 内容**
3. **Git commit**

```bash
git add content/posts/my-new-post.mdx
git commit -m "feat: 新增文章《XXX》"
git push
```

**部署到 Vercel 后，1 分钟内线上就能看到**。

---

## 十一、删除文章

1. **删除文件**：`rm content/posts/old-post.mdx`
2. **Git commit**
3. **推送**

---

## 十二、按标签过滤

新建 `src/app/posts/tag/[tag]/page.tsx`：

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import { PostCard } from '@/components/blog/PostCard';
import { PixelCard } from '@/components/pixel';
import { Container } from '@/components/layout/Container';

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);
  if (posts.length === 0) notFound();

  return (
    <Container>
      <h1 className="text-4xl font-bold mb-6">#{decodedTag}</h1>
      <p className="text-sm mb-6">共 {posts.length} 篇</p>
      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className="no-underline">
              <PostCard post={post} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/posts">← 返回所有随笔</Link>
      </p>
    </Container>
  );
}
```

---

## 十三、做完了的标志

- [ ] `content/posts/hello-world.mdx` 存在
- [ ] 访问 `/posts` 看到列表
- [ ] 访问 `/posts/hello-world` 看到详情
- [ ] 代码块有高亮
- [ ] 图片能正常显示
- [ ] 暗色 / 亮色都好看
- [ ] 上一篇 / 下一篇 跳转正常

---

**下一步** → 打开 [`02-时光胶囊.md`](02-时光胶囊.md)