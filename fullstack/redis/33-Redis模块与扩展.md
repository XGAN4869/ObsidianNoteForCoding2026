# 第33章：Redis 模块与扩展

## 本章目标
了解 Redis 模块生态（RedisJSON、RedisSearch 等）

---

## 33.1 Redis 模块系统

Redis 4.0+ 支持动态加载模块扩展功能：

```bash
# 加载模块
MODULE LOAD /path/to/redisjson.so

# 查看已加载
MODULE LIST

# 卸载
MODULE UNLOAD redisjson
```

---

## 33.2 常用模块

| 模块 | 功能 | 场景 |
|------|------|------|
| **RedisJSON** | JSON 文档存储和查询 | 替代 MongoDB 存 JSON |
| **RedisSearch** | 全文搜索 | 商品搜索、文章搜索 |
| **RedisTimeSeries** | 时间序列数据 | IoT 传感器、监控指标 |
| **RedisBloom** | 布隆过滤器、布谷鸟过滤器 | 去重、防缓存穿透 |
| **RedisGraph** | 图数据库 | 社交关系、推荐系统 |
| **RedisGears** | 服务端计算 | 实时数据处理 |

---

## 33.3 RedisBloom 示例

```bash
# 加载 RedisBloom 模块后
BF.ADD filter:users "user:12345"    # 添加到布隆过滤器
BF.EXISTS filter:users "user:12345" # 判断是否存在（1=可能存在，0=一定不存在）

CF.ADD cuckoo:users "user:12345"   # 布谷鸟过滤器（支持删除）
CF.DEL cuckoo:users "user:12345"   # 删除
```

---

## 本章小结
- 模块 = Redis 的"插件"
- RedisJSON/RedisSearch/RedisBloom 最常用
- 布隆过滤器解决缓存穿透
- 生产环境可用 Redis Stack（集成常用模块）

## 练习题
1. 安装 Redis Stack（内含常用模块），体验 RedisJSON 和 RedisBloom。
2. 用布隆过滤器实现"判断用户是否存在"。
