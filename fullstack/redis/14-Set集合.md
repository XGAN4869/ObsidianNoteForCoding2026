# 第14章：Set —— 集合运算

## 本章目标
掌握 Set 类型：标签系统、共同好友、抽奖、去重

---

## 14.1 Set 是什么

Set 是无序、不重复的字符串集合，支持**交并差**运算：

```
Key: tags:article:1
┌────────┐
│  Go    │
│ Redis  │
│  Gin   │
└────────┘
（无序，不重复）
```

---

## 14.2 基本操作

```bash
SADD tags:article:1 Go Redis Gin  # 添加
SADD tags:article:2 Go Python

SMEMBERS tags:article:1           # 所有元素
# ⚠️ 元素多时慢，用 SSCAN

SREM tags:article:1 Gin           # 删除

SISMEMBER tags:article:1 Go       # 判断存在 1=存在 0=不存在

SCARD tags:article:1              # 元素数量

SRANDMEMBER tags:article:1 2      # 随机取2个（不删除）
SPOP tags:article:1 1             # 随机弹1个（删除）

SSCAN tags:article:1 0            # 分批遍历
```

---

## 14.3 集合运算（交/并/差）

```bash
# 交集：共同标签
SINTER tags:article:1 tags:article:2   # ["Go"]

# 并集：所有标签
SUNION tags:article:1 tags:article:2   # ["Go","Redis","Gin","Python"]

# 差集：文章1有但文章2没有的标签
SDIFF tags:article:1 tags:article:2    # ["Redis","Gin"]

# 存到新Key
SINTERSTORE common tags:article:1 tags:article:2
```

---

## 14.4 实战场景

### 共同好友

```bash
SADD friends:张三 李四 王五 赵六
SADD friends:李四 张三 王五 孙七

# 共同好友
SINTER friends:张三 friends:李四   # 王五

# 可能认识的人（张三的好友+李四的好友-共同好友）
SUNION friends:张三 friends:李四   # 全部好友
```

### 抽奖

```bash
SADD lottery:2024 user:1 user:2 ... user:1000
SRANDMEMBER lottery:2024 3        # 随机抽3个（不删除）
SPOP lottery:2024 1               # 中奖后移出
```

### 标签系统

```bash
SADD article:1:tags Go Redis Gin
SADD article:2:tags Go Python
# 查有 Go 标签的文章：用 Set 的逆运算
```

---

## 常见错误

### 错误1：SMEMBERS 大集合

```bash
# ❌ 百万级 Set，SMEMBERS 卡死
SMEMBERS big:set

# ✅ 用 SSCAN
SSCAN big:set 0 COUNT 100
```

### 错误2：SPOP 误用

```bash
# SPOP 会删除元素！统计时注意
SPOP lottery:2024 1     # 这个人被"踢出"了集合
# 如果只是随机查看，用 SRANDMEMBER
```

---

## 本章小结

| 命令 | 用途 |
|------|------|
| `SADD` / `SREM` / `SMEMBERS` | 增删查 |
| `SINTER` / `SUNION` / `SDIFF` | 交/并/差集 |
| `SRANDMEMBER` / `SPOP` | 随机取/弹 |
| `SISMEMBER` / `SCARD` | 判断存在/计数 |

## 练习题

1. 用 Set 实现标签系统：给两篇文章打标签，算交集并集。
2. 用 Set 实现共同好友功能。
3. 用 Set 实现抽奖：随机选 3 个中奖者，中奖后移出。
4. （思考题）Set 的交集和差集运算在数据量很大时性能如何？底层是如何实现的？
