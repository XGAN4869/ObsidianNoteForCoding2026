# 12 博客项目：API、数据库与鉴权

## 1. 路由设计

```text
GET    /api/posts              已发布列表（分页、tag、q）
GET    /api/posts/:slug        已发布详情
POST   /api/posts              登录后创建
PATCH  /api/posts/:id          作者/管理员编辑
DELETE /api/posts/:id          作者/管理员删除
```

公开查询只返回已发布记录；管理查询显式带当前用户条件。不要让调用方通过修改 ID 绕过资源归属检查。

## 2. 创建流程

```text
请求 -> 解析 JSON -> schema 校验 -> 读取会话
     -> 检查权限 -> 生成/校验 slug -> 事务写入
     -> 记录审计日志 -> 返回 201
```

失败时返回稳定错误码。数据库唯一冲突映射为 409，字段校验为 422，未登录为 401，无权限为 403。

## 3. 控制器示例

```ts
export async function createPost(req, res, next) {
  try {
    const input = createPostSchema.parse(req.body)
    if (!req.user) return res.status(401).json({ error: '请先登录' })
    const post = await postService.create(input, req.user.id)
    return res.status(201).json({ data: post })
  } catch (error) { next(error) }
}
```

实际项目将 `parse` 换成你选择的 schema 库；运行时校验不可省略。

## 4. 会话中间件

中间件解析安全 Cookie/Session，得到最小用户信息（id、role），不把密码哈希挂到请求对象。管理接口统一使用 `requireUser`，作者操作再使用 `requirePostOwner`。登录、登出、会话过期和 CSRF 按认证库要求实现。

## 5. 缓存与发布

API 层对公开 GET 设置合适的 Cache-Control；私有和草稿响应使用 `private, no-store` 或等效策略。发布、编辑、删除后清理相关缓存。缓存不是权限边界，权限判断仍要先于返回数据。
