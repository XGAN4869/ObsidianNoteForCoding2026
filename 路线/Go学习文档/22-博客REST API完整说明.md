# 博客 REST API 完整说明

## 1. 统一响应格式

成功响应：

~~~json
{
  "data": {},
  "request_id": "req_123"
}
~~~

失败响应：

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法",
    "details": {"title": "不能为空"}
  },
  "request_id": "req_123"
}
~~~

客户端依赖 code，不依赖可能调整的 message。

## 2. 路由总览

### 公开路由

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /healthz | 存活检查 |
| GET | /readyz | 就绪检查 |
| GET | /api/v1/posts | 已发布文章列表 |
| GET | /api/v1/posts/:id | 文章详情 |
| GET | /api/v1/categories | 分类列表 |
| GET | /api/v1/tags | 标签列表 |
| POST | /api/v1/auth/register | 注册 |
| POST | /api/v1/auth/login | 登录 |
| POST | /api/v1/auth/refresh | 刷新 Token |

### 认证路由

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/v1/auth/logout | 退出 |
| GET | /api/v1/me | 当前用户 |
| PATCH | /api/v1/me | 修改资料 |
| POST | /api/v1/posts | 创建文章 |
| PATCH | /api/v1/posts/:id | 修改文章 |
| POST | /api/v1/posts/:id/publish | 发布文章 |
| POST | /api/v1/posts/:id/comments | 发布评论 |

### 管理路由

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/v1/admin/comments | 待审核评论 |
| POST | /api/v1/admin/comments/:id/approve | 批准 |
| POST | /api/v1/admin/comments/:id/reject | 拒绝 |
| GET | /api/v1/admin/users | 用户管理 |
| PATCH | /api/v1/admin/users/:id/status | 禁用/恢复 |

## 3. 分页契约

请求参数 page 默认 1，page_size 默认 20，最大 100。响应：

~~~json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 125,
  "has_next": true
}
~~~

深分页接口可以增加 cursor，但不要同时让 page 和 cursor 产生不清晰优先级。

## 4. 参数校验

Handler 负责必填、格式和长度校验；Service 负责业务校验。例如 title 长度是 Handler 可判断的，分类是否存在是 Service 必须判断的。

错误详情只返回字段级安全信息，不返回 SQL 或堆栈。

## 5. 状态码规则

- 201：创建资源。
- 204：成功删除且无响应体。
- 400：格式或参数错误。
- 401：缺少或无效身份。
- 403：身份存在但无权限。
- 404：目标不存在或对当前角色不可见。
- 409：唯一约束或状态冲突。
- 422：格式正确但业务语义无法处理（项目可选）。
- 500：未预期内部错误。

## 6. OpenAPI 文档

为每个接口记录：

- summary 和 description。
- 参数位置、类型和是否必填。
- 请求体 schema。
- 成功响应。
- 400/401/403/404/409/500 响应。
- 认证要求。
- 示例请求和响应。

OpenAPI 文档应与路由测试一起维护，避免“文档能调通、接口已改变”。

## 7. API 版本与兼容

初版使用 /api/v1。新增可选字段通常兼容；删除字段、修改类型或改变状态含义需要新版本或迁移期。错误码一旦对外使用，不要随意复用旧含义。

## 8. 本章练习

1. 为创建文章写完整请求和响应。
2. 为未登录、无权限、资源不存在分别设计错误响应。
3. 给文章列表添加 keyword、category 和 tag 参数。
4. 为发布文章接口补充 OpenAPI 字段清单。

## 9. 继续阅读

- 上一篇：[21-评论与内容审核模块](./21-评论与内容审核模块.md)
- 下一篇：[23-博客项目测试与排错](./23-博客项目测试与排错.md)

