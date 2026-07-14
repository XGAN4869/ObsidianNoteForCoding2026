# 第09章：管道（Pipeline）

## 本章目标
理解 Pipeline 原理 + 区分 Pipeline 和事务

---

## 9.1 为什么需要 Pipeline

```
无 Pipeline：每条命令一次网络往返
Client → [SET a 1] → Server
Client ← [OK]       ← Server
Client → [SET b 2] → Server
Client ← [OK]       ← Server
（N 条命令 = N 次网络往返）

有 Pipeline：打包发送
Client → [SET a 1][SET b 2][SET c 3] → Server
Client ← [OK][OK][OK]                ← Server
（N 条命令 = 1 次网络往返）
```

---

## 9.2 redis-cli 中使用

```bash
# 方式一：--pipe 批量导入
cat commands.txt
SET user:1 "张三"
SET user:2 "李四"
SET user:3 "王五"

cat commands.txt | redis-cli --pipe

# 方式二：程序中使用（Go/Python等）
# 第34-35章详细讲解
```

---

## 9.3 Pipeline vs 事务

| 特性 | Pipeline | 事务(MULTI) |
|------|---------|-----------|
| 打包发送 | ✅ | ✅ |
| 原子性 | ❌（命令可能交叉执行） | ✅（中间不插入其他命令） |
| 批量优化 | 减少 RTT | 减少 RTT + 原子性 |

---

## 本章小结
- Pipeline = 一次发送多条命令，减少网络往返（RTT）
- Pipeline 不保证原子性，事务保证
- Go 客户端的 Pipeline/TxPipeline 在第35章

## 练习题
1. 用 `--pipe` 批量导入 100 条数据。
2. 对比 Pipeline 和 MULTI/EXEC 的区别。
