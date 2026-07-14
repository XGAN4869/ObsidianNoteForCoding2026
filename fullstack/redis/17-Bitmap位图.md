# 第17章：Bitmap —— 亿级用户签到

## 本章目标
掌握 Bitmap 实现用户签到、在线状态、布隆过滤器

---

## 17.1 Bitmap 是什么

Bitmap 本质是 **String 的位数组**。一个 bit 存一个布尔值（0/1），极省内存。

```
签到场景：
用户ID=100 → 第100个bit=1（今天签到了）
用户ID=200 → 第200个bit=1

1000万用户的签到数据只占 1.25MB！
```

---

## 17.2 基本操作

```bash
# SETBIT：设置第 offset 位为 0 或 1
SETBIT sign:20240101 100 1    # 用户100签到
SETBIT sign:20240101 200 1    # 用户200签到

# GETBIT：获取第 offset 位
GETBIT sign:20240101 100      # 1（签到了）
GETBIT sign:20240101 999      # 0（没签到）

# BITCOUNT：统计 1 的数量（签到人数）
BITCOUNT sign:20240101        # 2

# BITPOS：查找第一个 1 或 0 的位置
BITPOS sign:20240101 1        # 100（第一个签到的用户）

# BITOP：位运算（AND/OR/XOR/NOT）
BITOP AND result sign:0101 sign:0102  # 连续两天都签到的用户
BITOP OR result sign:0101 sign:0102   # 任意一天签到的用户
```

---

## 17.3 实战：用户签到

```bash
# 1月1日签到
SETBIT sign:2024:01:01 100 1
SETBIT sign:2024:01:01 200 1

# 1月2日签到
SETBIT sign:2024:01:02 100 1
SETBIT sign:2024:01:02 300 1

# 统计1月1日签到人数
BITCOUNT sign:2024:01:01          # 2

# 查询用户100在1月1日是否签到
GETBIT sign:2024:01:01 100        # 1

# 1日和2日都签到的用户（连续签到）
BITOP AND continuous sign:2024:01:01 sign:2024:01:02
BITCOUNT continuous               # 1（只有100）
```

---

## 17.4 Bitmap 的优势

| 方案 | 1000万用户存储 |
|------|-------------|
| Set（存用户ID字符串） | ~800MB |
| MySQL（一行一条） | ~几GB |
| **Bitmap（一个bit一个用户）** | **~1.2MB** |

---

## 常见错误

### 错误1：offset 过大导致内存暴增

```bash
SETBIT key 999999999 1   # 1亿个bit ≈ 12MB，还好
SETBIT key 9999999999 1  # 100亿个bit ≈ 1.25GB！
```

### 错误2：BITCOUNT 不带范围

```bash
# 一个多月的数据全量 COUNT 可能很慢
BITCOUNT sign:2024:01    # 可能 O(N)
# 指定范围
BITCOUNT sign:2024:01 0 1000000
```

---

## 本章小结
- `SETBIT/GETBIT`：设位/取位
- `BITCOUNT`：统计签到人数
- `BITOP AND/OR`：连续签到/任意签到
- Bitmap 适合**用户ID为数字**、**数据密度高**的场景

## 练习题
1. 用 Bitmap 实现一个简单的签到系统（签到、查询、统计）。
2. 用 BITOP 实现连续签到天数统计。
3. 计算 1000 万用户的签到数据用 Bitmap 约占用多少内存。
