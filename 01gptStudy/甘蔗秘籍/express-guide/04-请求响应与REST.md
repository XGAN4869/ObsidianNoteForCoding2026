# 04 请求、响应与 REST API

## 请求头和 Content-Type

客户端发送 JSON 时必须带：

```http
Content-Type: application/json
```

前端示例：

```js
fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '第一篇', content: '你好' })
});
```

## 响应方法

```js
res.status(200).json({ data: post });
res.status(201).json({ data: created });
res.status(204).send();
res.status(404).json({ error: 'post_not_found' });
```

发送响应后不要再次 `res.json()`，否则会出现“Cannot set headers after they are sent”。

## 状态码速记

| 状态码 | 含义 | 典型场景 |
|---|---|---|
| 200 | 成功 | 查询、更新 |
| 201 | 已创建 | 新建文章 |
| 204 | 成功但无内容 | 删除 |
| 400 | 请求格式或业务输入错误 | 缺少标题 |
| 401 | 未认证 | 没有登录 |
| 403 | 已认证但无权限 | 非作者修改 |
| 404 | 资源不存在 | 文章 ID 不存在 |
| 409 | 冲突 | 用户名重复 |
| 500 | 服务端未知错误 | 数据库异常 |

## 统一响应格式

项目应约定一种格式，前端更容易处理：

```js
// 成功
{ "data": { "id": 1 } }

// 失败
{ "error": { "code": "VALIDATION_ERROR", "message": "标题不能为空" } }
```

不要把数据库堆栈返回给用户；错误详情只写日志。

## 校验输入

最简单的手写校验：

```js
function validatePost(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!title || title.length > 120) return '标题必须为 1-120 个字符';
  if (!content) return '正文不能为空';
  return null;
}
```

大型项目可使用 Zod、Joi 等校验库，但原则不变：在边界处校验，业务层只接收可信数据。

