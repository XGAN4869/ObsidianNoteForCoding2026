# 第18章：HyperLogLog —— 海量去重计数

## 本章目标
掌握 HLL 实现 UV（独立访客）统计

---

## 18.1 HyperLogLog 是什么

HyperLogLog 是**概率去重统计算法**，用极小的内存（12KB）估算海量数据的去重数量。

| 方案 | 1亿个用户ID | 精确度 |
|------|-----------|--------|
| Set | ~8GB | 100% |
| MySQL | ~几十GB | 100% |
| **HLL** | **12KB** | **误差 0.81%** |

---

## 18.2 基本操作

```bash
# PFADD：添加元素
PFADD uv:20240101 "user:1"
PFADD uv:20240101 "user:2"
PFADD uv:20240101 "user:3"
PFADD uv:20240101 "user:1"     # 重复添加，不影响计数

# PFCOUNT：获取近似去重计数
PFCOUNT uv:20240101            # 3（近似）

# PFMERGE：合并多个 HLL
PFMERGE uv:week1 uv:0101 uv:0102 uv:0103
PFCOUNT uv:week1               # 一周的 UV
```

---

## 18.3 实战：网站 UV 统计

```bash
# 记录每次页面访问（用IP或用户ID）
PFADD uv:page:home "192.168.1.1"
PFADD uv:page:home "192.168.1.2"
PFADD uv:page:home "192.168.1.1"   # 重复

PFCOUNT uv:page:home               # 2（2个独立访客）

# 全站 UV
PFADD uv:site:total "192.168.1.1" "192.168.1.3"
# 也可以用 PFMERGE 合并各页面
```

---

## 18.4 使用限制

| 限制 | 说明 |
|------|------|
| 不精确 | 标准误差 0.81% |
| 不存元素 | 只能计数，不能列出"有哪些用户" |
| 不能删 | 没有 PFREM 命令 |
| 12KB 固定 | 无论多少数据都是 12KB |

> 📌 如果需要精确去重 + 能列出元素 → 用 Set（但内存大）。只需要估算数量 → 用 HLL。

---

## 本章小结
- HLL = 概率去重计数（12KB，误差 0.81%）
- `PFADD/PFCOUNT/PFMERGE` 三个命令搞定
- UV 统计的最佳工具

## 练习题
1. 用 HLL 统计页面 UV，对比 Set 的内存占用。
2. 用 PFMERGE 合并一周 7 天的 UV 数据。
3. 讨论：什么场景应该用 Set，什么场景应该用 HLL？
