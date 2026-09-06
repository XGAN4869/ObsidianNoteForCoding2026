# 第 14 章 文本处理语言 awk

---

## 目录

1. [概述](#1-概述)
2. [核心概念](#2-核心概念)
3. [命令详解](#3-命令详解)
4. [实战练习](#4-实战练习)
5. [常见错误与排错](#5-常见错误与排错)
6. [进阶延伸](#6-进阶延伸)

---

## 1. 概述

### 1.1 从"编辑"到"分析与计算"

第 13 章你学会了用 `sed` 编辑文本流——替换、删除、插入、行重排。sed 是"文本编辑的瑞士军刀"。现在你面临新的需求：

- "统计 Web 日志中每种 HTTP 状态码的出现次数"
- "计算 CSV 文件中所有员工的平均薪资，并按部门分组统计"
- "从 `/etc/passwd` 中提取用户名和 UID，按 UID 排序输出格式化表格"
- "找出日志中响应时间超过 500ms 的请求，计算其占比"
- "将 Markdown 表格转换为 CSV 格式"

这些任务的共同点是：**不仅需要查找和替换，更需要按字段（列）分析、计算、统计和格式化输出。** sed 最擅长的是"行编辑"，而 awk 的设计目标就是"按字段进行分析与计算"。这就是 **awk** 的世界。

awk 是 Linux "文本处理三剑客"中的第二位：

```
                        文本处理三剑客
              +--------------+--------------+
              |              |              |
           第 13 章       第 14 章       第 15 章
            sed            awk          工具箱
         （流编辑器）   （模式扫描与     （sort/uniq/
                          处理语言）      cut/tr/xargs...）
              |              |              |
        替换、删除、      按列分析、      排序去重、
        插入、修改        数值计算、      切分转换、
                         格式化报告      批量处理
```

**awk 的核心使命：将文本视为"记录（Record）"和"字段（Field）"的集合，用模式（Pattern）筛选记录，用动作（Action）处理字段，输出分析结果。**

### 1.2 awk 名称的由来与设计哲学

awk 的名字来自三位作者的姓氏首字母：

- **A**lfred V. **A**ho（阿尔弗雷德-艾侯）
- **P**eter J. **W**einberger（彼得-温伯格）
- **B**rian W. **K**ernighan（布莱恩-柯林汉）

三人于 1977 年在贝尔实验室共同设计并实现了 awk。Kernighan 也是 Unix 经典著作《The C Programming Language》的合著者。正因为设计者中有 C 语言的共同缔造者，awk 的语法具有浓厚的 C 语言风格。

awk 的设计哲学同样体现了 Unix 的核心原则：

1. **模式-动作范式（Pattern-Action Paradigm）**：`pattern { action }` 是最简形式。每一行（记录）读入后，依次与每个模式匹配，匹配成功则执行对应动作
2. **字段感知（Field-Aware）**：awk 自动将每行按分隔符拆分为 `$1`、`$2`、`$3`...这是它区别于 sed 和 grep 的最根本特性
3. **数据驱动的类型系统**：变量无需声明，类型在运行时自动推断。字符串和数字之间的转换是透明的
4. **真正的编程语言**：支持变量、数组（关联数组，Associative Array）、控制流、用户自定义函数，本质上是一门完整的领域特定语言（DSL，Domain-Specific Language）

### 1.3 awk 能做什么：能力全景

| 能力 | 说明 | 典型场景 |
|------|------|---------|
| **字段提取** | 按列提取第 N 个字段 | `awk '{print $1, $3}' data.txt` |
| **条件筛选** | 按条件过滤记录 | `awk '$3 > 100' data.txt` |
| **数值计算** | 求和、平均值、最大值、最小值 | `awk '{sum+=$2} END{print sum}' data.txt` |
| **格式化输出** | 使用 printf 生成对齐的报告 | `awk '{printf "%-10s %5d\n", $1, $2}'` |
| **分组统计** | 按类别分组计数、求和 | `awk '{count[$1]++} END{for(k in count) print k, count[k]}'` |
| **文本转换** | 大小写转换、字符串替换 | `awk '{print toupper($0)}' file.txt` |
| **多文件处理** | 跨文件关联、合并 | `awk 'NR==FNR{map[$1]=$2;next} {print $0, map[$1]}' file1 file2` |
| **报告生成** | 添加标题、页脚、计算列宽 | `awk 'BEGIN{print "=== REPORT ==="} ... END{print "=== END ==="}'` |

### 1.4 awk 与 grep、sed 的关系

```
+--------------------------------------------------------------+
|                   文本处理三剑客的分工                         |
|                                                              |
|  功能        |  grep        |  sed          |  awk           |
|  ------------+--------------+---------------+----------------|
|  主要操作    |  搜索/筛选    |  编辑/替换     |  分析/计算     |
|  核心能力    |  找到匹配行   |  修改文本      |  按列/字段处理 |
|  数据结构    |  行           |  行 + 模式空间 |  记录(行)+字段  |
|  计算能力    |  无           |  极有限(e标志) |  完整的编程语言 |
|  典型场景    |  "有没有？"   |  "改成什么？"  |  "怎么分析？"  |
|             |  "在哪里？"   |  "删掉哪些？"  |  "怎么算？"   |
|  ------------+--------------+---------------+----------------|
|  示例        |  grep ERROR  |  sed 's/8080  |  awk '{print  |
|             |  app.log     |  /9090/' cfg   |  $1,$3}' data |
+--------------------------------------------------------------+
```

**三者不是替代关系，而是组合关系。** 一个典型的文本处理流水线通常包含 `grep` 过滤 + `sed` 编辑 + `awk` 分析。例如：

```bash
# 从日志中提取错误信息、脱敏 IP 地址、按错误类型统计
grep "ERROR" /var/log/app.log \
  | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/[REDACTED]/g' \
  | awk '{print $NF}' \
  | sort | uniq -c | sort -rn
```

awk 是三剑客中唯一具备**完整编程能力**的工具。当任务涉及"按某列的值进行计算"、"对数据进行分组统计"、"生成格式化报表"时，awk 是首选工具。

### 1.5 历史背景：从 1977 到 GNU awk

```
1977  awk      — 贝尔实验室诞生，三位作者的名字首字母命名
              |  设计目标：填补 grep/sed 在数值计算和报表生成方面的空白
              |  核心创新：模式-动作范式、字段自动分割、关联数组
              |
1985  nawk     — "New awk"，由三位原始作者重构
              |  增加了用户自定义函数、动态正则、更丰富的内置函数
              |
1987  gawk     — GNU awk（GNU 项目的 awk 实现）
              |  完全兼容 nawk，并增加大量扩展
              |  主要扩展：网络编程（TCP/IP）、多字节字符支持、
              |  命名空间、PROCINFO 数组、位操作函数等
              |
至今           — GNU Awk 5.2（Ubuntu 24.04 LTS 默认版本）
              |  命令：awk -> 实际上是 gawk（符号链接）
              |  验证：awk --version
```

在 Ubuntu 24.04 LTS 中，`awk` 命令通过 alternatives 系统指向 `gawk`：

```bash
# 确认 awk 指向 gawk
ls -la $(which awk)
# 输出示例：
# lrwxrwxrwx ... /usr/bin/awk -> /etc/alternatives/awk
# 最终指向 /usr/bin/gawk

# 查看版本
awk --version
# 输出：
# GNU Awk 5.2.2 ...
# Copyright (C) 1989, 1991-2023 Free Software Foundation.
```

本章所有内容均基于 **GNU Awk 5.2**（Ubuntu 24.04 LTS 默认版本）。标注 `gawk` 的功能仅为 GNU 扩展，在 POSIX awk 中不可用。

### 1.6 本章学习目标

完成本章后，你将能够：

- 理解 awk 的**执行模型**：模式-动作循环、记录与字段的关系
- 熟练操作**字段与记录**：`$0`、`$1`..`$NF`、`NR`、`NF`、`FNR`
- 掌握**字段分隔符与记录分隔符**：`FS`、`RS`、`OFS`、`ORS` 的实际应用
- 运用 **BEGIN / END 块**初始化变量、打印表头和汇总结果
- 使用**模式匹配**：正则模式、比较模式、范围模式、复合模式
- 查阅并使用**所有内置变量**：`FILENAME`、`ARGC`、`ARGV`、`ENVIRON`、`RSTART`、`RLENGTH` 等
- 调用**内置函数**：字符串函数（`length`、`substr`、`match`、`split`、`gsub`）、数学函数（`int`、`rand`、`srand`、`sqrt`）、时间函数（`systime`、`strftime`）
- 使用**关联数组**进行分组统计、去重、查找
- 编写**控制流**：`if/else`、`while`、`for`、`next`、`exit`
- 定义**用户自定义函数**，封装复用逻辑
- 记忆并灵活运用 **20 个实用 awk 单行脚本**

---
## 2. 核心概念

### 2.1 awk 的执行模型：模式-动作循环

awk 的执行模型与 sed 的"读取-执行-输出-循环"有相似之处，但更加强大和灵活。它的核心是一个**模式-动作（Pattern-Action）循环**：

```
+-----------------------------------------------------------------+
|                     awk 执行循环                                 |
|                                                                 |
|  BEGIN 块（可选）                                                |
|  +--------------+                                               |
|  | 在处理任何    |  执行一次，在任何输入读取之前                    |
|  | 输入之前执行   |  通常用于：打印表头、初始化变量、设置 FS/RS     |
|  +--------------+                                               |
|       |                                                         |
|       v                                                         |
|  +---------------------------------------------------+          |
|  |              对每条记录（默认是每一行）             |          |
|  |                                                   |          |
|  |  1. 读取一条记录 -> $0 = 整条记录                   |          |
|  |  2. 按 FS 分割 -> $1, $2, ..., $NF（自动字段拆分）  |          |
|  |  3. 设置 NR（当前记录号）、NF（字段数）等内置变量    |          |
|  |  4. 依次匹配每个 模式 { 动作 } 语句                |          |
|  |     - 模式匹配成功 -> 执行动作                       |          |
|  |     - 模式为空 -> 匹配所有记录                       |          |
|  |     - 动作为空 -> 默认动作是 print $0                |          |
|  |  5. 读取下一条记录，重复步骤 1~5                    |          |
|  |                                                   |          |
|  +---------------------------------------------------+          |
|       |                                                         |
|       v                                                         |
|  END 块（可选）                                                  |
|  +--------------+                                               |
|  | 在所有输入    |  执行一次，在所有输入处理完之后                  |
|  | 处理完之后    |  通常用于：打印汇总、统计结果、页脚              |
|  +--------------+                                               |
|                                                                 |
+-----------------------------------------------------------------+
```

**用一段代码直观理解 awk 的执行模型：**

```bash
# 准备示例数据
cat > /tmp/awk-model.txt << 'EOF'
Alice 90 85 95
Bob 78 82 88
Carol 95 91 89
EOF

# awk 程序：统计每人的平均分
awk '
BEGIN { print "姓名    平均分"                 # BEGIN 块：只执行一次
        print "---------------" }
      { avg = ($2 + $3 + $4) / 3               # 动作块：每条记录执行一次
        printf "%-8s %5.1f\n", $1, avg }
END   { print "---------------"                 # END 块：只执行一次
        print "共处理", NR, "条记录" }
' /tmp/awk-model.txt

# 输出：
# 姓名    平均分
# ---------------
# Alice      90.0
# Bob        82.7
# Carol      91.7
# ---------------
# 共处理 3 条记录
```

**执行过程逐行拆解：**

```
1. 程序启动 -> 执行 BEGIN 块：
   打印 "姓名    平均分"
   打印 "---------------"

2. 读取第 1 条记录 "Alice 90 85 95"：
   $0 = "Alice 90 85 95"
   $1 = "Alice", $2 = "90", $3 = "85", $4 = "95", NF = 4, NR = 1
   执行动作块：avg = 90, 打印 "Alice      90.0"

3. 读取第 2 条记录 "Bob 78 82 88"：
   $1 = "Bob", $2 = "78", $3 = "82", $4 = "88", NF = 4, NR = 2
   执行动作块：avg = 82.67, 打印 "Bob        82.7"

4. 读取第 3 条记录 "Carol 95 91 89"：
   $1 = "Carol", $2 = "95", $3 = "91", $4 = "89", NF = 4, NR = 3
   执行动作块：avg = 91.67, 打印 "Carol      91.7"

5. 所有记录处理完毕 -> 执行 END 块：
   打印 "---------------"
   打印 "共处理 3 条记录"

6. 程序退出
```

### 2.2 记录与字段：awk 的数据世界观

awk 看待数据的方式与 sed 和 grep 有本质不同。sed 看到的是"行"，awk 看到的是"记录中的字段"：

```
+------------------------------------------------------------------+
|                  awk 的数据世界观                                  |
|                                                                  |
|  输入文件（或者标准输入、管道流）                                    |
|                                                                  |
|  +---------------------------------------------+                 |
|  | 记录 1（Record 1 / Row 1）                   |                 |
|  | +------+------+------+------+--------------+ |                 |
|  | |字段1  |字段2  |字段3  |字段4  |字段5 ($NF)   | |                 |
|  | |$1    |$2    |$3    |$4    |$5           | |                 |
|  | +------+------+------+------+--------------+ |                 |
|  |                  |                          |                 |
|  |              $0 = 整条记录                    |                 |
|  +---------------------------------------------+                 |
|  | 记录 2（Record 2）  ... $1, $2, $3 ...       |                 |
|  +---------------------------------------------+                 |
|  | 记录 3（Record 3）  ...                       |                 |
|  +---------------------------------------------+                 |
|  | ...                                         |                 |
|  +---------------------------------------------+                 |
|                                                                  |
|  每条记录读取后自动按 FS（字段分隔符，Field Separator）分割         |
|  $0 = 整条记录的原貌（未经分割）                                   |
|  $1, $2, $3, ..., $NF = 分割后的字段                              |
|  NF = 当前记录的字段数量                                           |
|  NR = 当前已处理的记录总数（跨文件累积）                             |
|                                                                  |
+------------------------------------------------------------------+
```

**核心概念对照表：**

| awk 术语 | 英文 | 通俗理解 | 访问方式 |
|---------|------|---------|---------|
| 记录 | Record | 一行（默认 RS="\\n"） | `$0` |
| 字段 | Field | 一列（默认 FS=" " 即空白字符） | `$1`, `$2`, ..., `$NF` |
| 记录号 | Record Number | 当前是第几条记录（全局累积） | `NR` |
| 字段数 | Number of Fields | 当前记录有多少个字段 | `NF` |
| 文件内记录号 | File Record Number | 当前记录在当前文件中的编号 | `FNR` |
| 文件名 | Filename | 当前正在处理的文件名 | `FILENAME` |

**基础示例：感受记录与字段：**

```bash
# 准备测试数据
cat > /tmp/awk-records.txt << 'EOF'
Alice   85      92      78
Bob     90      88      95
Carol   76      89      82
EOF

# 打印每条记录的第一个和最后一个字段
awk '{print $1, $NF}' /tmp/awk-records.txt
# 输出：
# Alice 78
# Bob 95
# Carol 82
# 解释：$1 是姓名，$NF 是每行最后一个字段（第 3 次考试成绩）

# 打印每条记录，并在前面加上记录号和字段数
awk '{print "记录" NR ": 字段数=" NF " | " $0}' /tmp/awk-records.txt
# 输出：
# 记录1: 字段数=4 | Alice   85      92      78
# 记录2: 字段数=4 | Bob     90      88      95
# 记录3: 字段数=4 | Carol   76      89      82

# 打印 $0 与显式重建 $0 的区别
# $0 保留原始空白，print $1,$2,$3,$4 使用 OFS（默认空格）重建
awk '{print "[" $0 "]"; print "[" $1,$2,$3,$4 "]"}' /tmp/awk-records.txt
# 输出：
# [Alice   85      92      78]
# [Alice 85 92 78]
# 注意原始 Tab 缩进丢失，被 OFS（默认空格）替代
```
### 2.3 字段分隔符（FS）与记录分隔符（RS）

awk 如何判断"一条记录从哪里到哪里"以及"记录内的字段如何划分"？答案来自两个内置变量：

```
+-----------------------------------------------------------------+
|              FS（Field Separator） 与 RS（Record Separator）     |
|                                                                 |
| 输入文本：                                                       |
|                                                                 |
|  field1,field2,field3\n      <- RS="\n"（默认）每条记录以换行结束  |
|  field1,field2,field3\n      <- FS="," 每个字段以逗号分隔          |
|                                                                 |
|  -------------------------------------------------------------  |
|                                                                 |
|  FS（字段分隔符）             RS（记录分隔符）                     |
|  +----------------+         +----------------+                  |
|  | 默认：" "（空格）|         | 默认："\n"（换行）|                 |
|  | 特殊行为：       |         | 可以修改为：    |                  |
|  | - 单个空格=任意  |         | - 正则表达式    |                  |
|  |   空白字符       |         | - 空字符串""   |                  |
|  | - 忽略前导空白   |         |   (段落模式)    |                  |
|  | - 其他值=精确匹配|         | - 多字符分隔符  |                  |
|  +----------------+         +----------------+                  |
|                                                                 |
+-----------------------------------------------------------------+
```

**FS 的默认行为（单个空格 = 任意连续空白）：**

```bash
# 默认 FS=" " 的特殊性：单个空格被解释为"任意连续空白字符"
echo "a   b    c" | awk '{print $1, $2, $3}'
# 输出：a b c
# 注意：输入中的多个空格被视为一个分隔符

echo "   leading spaces" | awk '{print $1}'
# 输出：leading
# 注意：前导空白被自动跳过（FS=" " 的特殊行为）
```

**四种设置 FS 的方式：**

```bash
# 方式 1：-F 命令行选项（最常用）
awk -F: '{print $1, $NF}' /etc/passwd
# 以冒号作为字段分隔符

# 方式 2：在 BEGIN 块中设置 FS 变量
awk 'BEGIN{FS=":"} {print $1, $NF}' /etc/passwd

# 方式 3：-v 命令行赋值变量
awk -v FS=":" '{print $1, $NF}' /etc/passwd

# 方式 4：在 BEGIN 块中设置 FS 为正则表达式
awk 'BEGIN{FS="[,;]"} {print $1, $2, $3}' data.txt
# 以逗号或分号作为分隔符
```

**FS 的正则表达式能力：**

```bash
# FS 可以是一个正则表达式（ERE）
cat > /tmp/awk-fs-regex.txt << 'EOF'
Alice,25;Engineering
Bob,30;Marketing
Carol,28;Engineering
EOF

# 同时以逗号或分号作为字段分隔符
awk 'BEGIN{FS="[,;]"} {print $1, $2, $3}' /tmp/awk-fs-regex.txt
# 输出：
# Alice 25 Engineering
# Bob 30 Marketing
# Carol 28 Engineering
```

**RS 的灵活设置：**

```bash
# 默认 RS="\n"，每条记录一行

# 设置 RS="" 进入"段落模式"：由空行分隔的文本块视为一条记录
cat > /tmp/awk-rs-paragraph.txt << 'EOF'
Name: Alice
Age: 30
City: Shanghai

Name: Bob
Age: 25
City: Beijing

Name: Carol
Age: 28
City: Shenzhen
EOF

# 段落模式（gawk 特性）：RS="" 将连续的非空行视为一条记录
# FS="\n" 将记录内的每行视为一个字段
awk 'BEGIN{RS=""; FS="\n"} {print "--- Record " NR " ---"; print $1; print $2; print $3}' \
  /tmp/awk-rs-paragraph.txt
# 输出：
# --- Record 1 ---
# Name: Alice
# Age: 30
# City: Shanghai
# --- Record 2 ---
# Name: Bob
# Age: 25
# City: Beijing
# --- Record 3 ---
# Name: Carol
# Age: 28
# City: Shenzhen
```

### 2.4 输出字段分隔符（OFS）与输出记录分隔符（ORS）

当你使用 `print $1, $2` 时，awk 在字段之间自动插入 **OFS（Output Field Separator）**。当你使用 `print` 时，awk 在记录末尾自动插入 **ORS（Output Record Separator）**。

```bash
# 默认 OFS=" "（空格），ORS="\n"（换行）
echo "a b c" | awk '{print $1, $2, $3}'
# 输出：a b c
# $1 和 $2 之间自动插入了 OFS（空格）

# 修改 OFS 为逗号（生成 CSV 格式）
echo "a b c" | awk 'BEGIN{OFS=","} {print $1, $2, $3}'
# 输出：a,b,c

# 修改 ORS 为 " | " （所有记录连成一行）
seq 1 5 | awk 'BEGIN{ORS=" | "} {print} END{print "\n"}'
# 输出：1 | 2 | 3 | 4 | 5 |
```

**OFS 关键特性：只有当 $0 被重建时，OFS 才生效：**

```bash
# 设置 OFS 但只修改 $1 — $0 不会自动重建
echo "a b c" | awk 'BEGIN{OFS=","} {$1="X"; print}'
# 输出：X b c
# OFS 未生效！因为 $0 没有被重建

# 强制重建 $0：给 $0 赋值，或使用 $1=$1 惯用技巧
echo "a b c" | awk 'BEGIN{OFS=","} {$1="X"; $1=$1; print}'
# 输出：X,b,c
# $1=$1 是一种触发 $0 重建的惯用技巧
```

### 2.5 模式-动作（Pattern-Action）深度解析

awk 程序的核心结构是：

```
模式 { 动作 }
pattern { action }
```

两者都可以省略，但有特定的默认行为：

| 省略部分 | 默认行为 | 示例 | 含义 |
|---------|---------|------|------|
| 都写 | 模式匹配时执行动作 | `NR==1{print}` | 第一条记录时打印 |
| 省略模式 | 对所有记录执行动作 | `{print $1}` | 打印每条记录的第一字段 |
| 省略动作 | 默认动作为 {print $0} | `/error/` | 打印包含 error 的记录 |
| 只写模式 | 同上 | `NR<=5` | 打印前 5 条记录 |

```bash
# 演示各种模式-动作组合
cat > /tmp/awk-patterns.txt << 'EOF'
1 Alice 85
2 Bob 78
3 Carol 92
4 David 65
5 Eve 88
EOF

# 完整模式-动作：只打印第 1 条记录的第 2 个字段
awk 'NR==1{print $2}' /tmp/awk-patterns.txt
# 输出：Alice

# 省略模式 = 对所有记录执行动作
awk '{print $2}' /tmp/awk-patterns.txt
# 输出：Alice / Bob / Carol / David / Eve

# 省略动作 = 默认 {print $0}
awk 'NR<=3' /tmp/awk-patterns.txt
# 输出：前 3 行

# 多条模式-动作语句可以串联（一条记录可能匹配多个模式）
awk 'NR==1{print "Header:", $0} $3>=85{print "High:", $2}' /tmp/awk-patterns.txt
# 输出：
# Header: 1 Alice 85
# High: Alice
# High: Carol
# High: Eve
```

### 2.6 awk 的调用方式

```bash
# 方式 1：命令行直接传入程序（最常用）
awk [选项] '程序' [文件...]
awk '{print $1}' file.txt

# 方式 2：从脚本文件读取程序（复杂程序推荐）
awk [选项] -f script.awk [文件...]
awk -f calc.awk data.txt

# 方式 3：从标准输入读取数据
command | awk [选项] '程序'
echo "a b c" | awk '{print $2}'

# 方式 4：多个文件连续处理
awk '{print FILENAME, $0}' file1.txt file2.txt
# FILENAME 变量指示当前处理的是哪个文件
```

**常用选项：**

| 选项 | 说明 | 示例 |
|------|------|------|
| `-F fs` | 设置字段分隔符（FS） | `awk -F: '{print $1}' /etc/passwd` |
| `-v var=value` | 向程序传递变量 | `awk -v limit=10 '$3>limit' data.txt` |
| `-f script-file` | 从文件读取 awk 程序 | `awk -f program.awk data.txt` |
| `-W compat` | 兼容模式（关闭 gawk 扩展） | `awk -W compat '{print $1}'` |
| `-W posix` | POSIX 模式（严格遵循 POSIX） | `awk -W posix '{print $1}'` |
| `--lint` | 发出可疑或不可移植结构的警告 | `awk --lint '{print $1}'` |
| `--sandbox` | 沙盒模式（禁用 system()、重定向等） | `awk --sandbox '...'` |

### 2.7 awk 中的可执行脚本文件（Shebang）

awk 程序可以直接作为可执行脚本运行：

```bash
# 创建可执行的 awk 脚本
cat > ~/avg.awk << 'AWKEOF'
#!/usr/bin/awk -f
# 计算各列的平均值
{
    for (i = 1; i <= NF; i++) {
        sum[i] += $i
    }
    count++
}
END {
    for (i = 1; i <= length(sum); i++) {
        printf "第 %d 列平均值: %.2f\n", i, sum[i] / count
    }
}
AWKEOF

chmod +x ~/avg.awk

# 直接执行
~/avg.awk /tmp/awk-records.txt
```

---
## 3. 命令详解

### 3.1 模式匹配详解

awk 的模式（Pattern）决定了"哪些记录需要执行动作"。awk 支持多种类型的模式。

#### 3.1.1 BEGIN 和 END（特殊模式）

`BEGIN` 和 `END` 是两种特殊的模式——它们不匹配任何输入记录，而是在特定时机执行一次。

```bash
# BEGIN：在任何输入被读取之前执行
# END：在所有输入被读取之后执行
awk 'BEGIN{print "START"} {print NR, $0} END{print "END"}' <(echo -e "line1\nline2")
# 输出：
# START
# 1 line1
# 2 line2
# END

# BEGIN 的实际用途：打印报告标题
awk 'BEGIN{
    printf "%-15s %5s %5s %5s\n", "Name", "Score1", "Score2", "Score3"
    print "-----------------------------------------"
}
{ printf "%-15s %5d %5d %5d\n", $1, $2, $3, $4 }' /tmp/awk-records.txt
# 输出：
# Name            Score1 Score2 Score3
# -----------------------------------------
# Alice              85     92     78
# Bob                90     88     95
# Carol              76     89     82

# END 的实际用途：打印汇总统计
awk '{sum+=$2; count++} END{printf "总计: %d, 平均: %.1f\n", sum, sum/count}' /tmp/awk-records.txt
# 输出：总计: 251, 平均: 83.7
```

#### 3.1.2 表达式模式（Expression Pattern）

当表达式求值为非零或非空时匹配：

```bash
# 比较运算作为模式
awk '$3 > 85' /tmp/awk-patterns.txt
# 输出：
# 3 Carol 92
# 5 Eve 88

# 使用 NR 和 FNR 控制范围
awk 'NR >= 2 && NR <= 4' /tmp/awk-patterns.txt
# 输出：
# 2 Bob 78
# 3 Carol 92
# 4 David 65

# 混合字段和内置变量
awk '$3 > 80 && NR % 2 == 1' /tmp/awk-patterns.txt
# 输出：3 Carol 92
```

#### 3.1.3 正则表达式模式（Regular Expression Pattern）

```bash
# /regex/ 模式匹配 $0
awk '/Alice/' /tmp/awk-patterns.txt
# 输出：1 Alice 85

# 显式指定匹配目标字段：~（匹配）和 !~（不匹配）
awk '$2 ~ /^[A-C]/' /tmp/awk-patterns.txt
# 输出：Alice, Bob, Carol（$2 以 A、B 或 C 开头）

# 不匹配
awk '$2 !~ /e$/' /tmp/awk-patterns.txt
# 输出：Carol, David（$2 不以 e 结尾）
```

#### 3.1.4 范围模式（Range Pattern）

范围模式用逗号分隔两个模式：`pattern1, pattern2`。从 pattern1 首次匹配开始，到 pattern2 匹配时结束：

```bash
# 打印从包含 "Bob" 的行到包含 "David" 的行
awk '/Bob/,/David/' /tmp/awk-patterns.txt
# 输出：
# 2 Bob 78
# 3 Carol 92
# 4 David 65

# 范围模式在每对起始/结束之间独立地打开和关闭
cat > /tmp/awk-range.txt << 'EOF'
START block1 line1
block1 line2
END
middle
START block2 line1
block2 line2
END
EOF

awk '/START/,/END/' /tmp/awk-range.txt
# 输出：两个 START...END 块的内容
```

#### 3.1.5 复合模式（使用 &&、||、!）

```bash
# 逻辑与：两个条件同时满足
awk 'NR>=2 && $3>80' /tmp/awk-patterns.txt
# 输出：Carol 92, Eve 88

# 逻辑或：任一条件满足
awk 'NR==1 || $3>90' /tmp/awk-patterns.txt
# 输出：1 Alice 85, 3 Carol 92

# 逻辑非
awk '!(NR==1 || NR==5)' /tmp/awk-patterns.txt
# 输出：第 2、3、4 行
```

### 3.2 内置变量完整参考

awk 提供了一组内置变量，用于控制其行为和获取运行时信息。以下是完整参考表。

#### 3.2.1 输入/输出控制变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FS` | `" "` | 输入字段分隔符（Field Separator）。单空格特殊：匹配任意连续空白字符 |
| `RS` | `"\n"` | 输入记录分隔符（Record Separator）。仅 gawk 支持正则 |
| `OFS` | `" "` | 输出字段分隔符（Output Field Separator）。重建 $0 时生效 |
| `ORS` | `"\n"` | 输出记录分隔符（Output Record Separator） |
| `OFMT` | `"%.6g"` | 数字的默认输出格式（用于 print 打印数字时） |
| `CONVFMT` | `"%.6g"` | 数字到字符串的默认转换格式 |
| `FIELDWIDTHS` | `""` | 固定宽度字段列表（gawk 扩展）。设置后 FS 被忽略 |
| `FPAT` | `""` | 描述字段内容的正则表达式（gawk 扩展）。用于解析 CSV 等 |

**FIELDWIDTHS 示例（固定宽度字段）：**

```bash
# 处理固定宽度的列式数据
cat > /tmp/awk-fixed.txt << 'EOF'
AliceBeijing25
Bob  Shanghai30
CarolGuangzhou28
EOF

# FIELDWIDTHS 指定每列的宽度
awk 'BEGIN{FIELDWIDTHS="5 9 2"} {print "Name:", $1, "City:", $2, "Age:", $3}' /tmp/awk-fixed.txt
# 输出：
# Name: Alice City: Beijing   Age: 25
# Name: Bob   City: Shanghai  Age: 30
# Name: Carol City: Guangzhou Age: 28
```

**FPAT 示例（解析 CSV 中的引号字段）：**

```bash
# 当字段本身包含分隔符（如 CSV 引号字段），用 FPAT 定义"字段长什么样"
echo '"Alice, Jr.",Engineering,85000' | awk -v FPAT='([^,]+)|(\"[^\"]+\")' '{print $1, $2, $3}'
# 输出："Alice, Jr." Engineering 85000
```

#### 3.2.2 运行时信息变量

| 变量 | 说明 |
|------|------|
| `$0` | 当前记录的完整文本 |
| `$1` ~ `$N` | 当前记录的第 N 个字段 |
| `$NF` | 当前记录的最后一个字段 |
| `NR` | 已处理的总记录数（Number of Records，跨文件累积） |
| `FNR` | 当前文件中的记录数（File Number of Records，每个文件重置） |
| `NF` | 当前记录的字段数（Number of Fields） |
| `FILENAME` | 当前输入文件的名称 |
| `ARGC` | 命令行参数的数量 |
| `ARGV` | 命令行参数数组（ARGV[0]=="awk"） |
| `ENVIRON` | 环境变量关联数组（只读） |
| `RLENGTH` | match() 函数匹配的字符串长度 |
| `RSTART` | match() 函数匹配的字符串起始位置 |
| `SUBSEP` | 多维数组下标分隔符，默认 "\034"（ASCII 28，不可见字符） |
| `IGNORECASE` | 非零时，所有正则匹配和字符串比较忽略大小写（gawk 扩展） |
| `ERRNO` | 当 getline 或 close() 失败时的错误描述（gawk 扩展） |
| `RT` | RS 为正则时，当前记录的实际分隔符文本（gawk 扩展） |
| `PROCINFO` | 进程信息关联数组，包含 PID、UID、版本等（gawk 扩展） |

**NR vs FNR vs FILENAME 的深度演示：**

```bash
# 准备两个文件
cat > /tmp/awk-file1.txt << 'EOF'
a 1
b 2
EOF

cat > /tmp/awk-file2.txt << 'EOF'
c 3
d 4
e 5
EOF

# 观察 NR vs FNR vs FILENAME
awk '{
    printf "NR=%-2d  FNR=%-2d  NF=%-2d  FILENAME=%-20s  $0=%s\n", \
      NR, FNR, NF, FILENAME, $0
}' /tmp/awk-file1.txt /tmp/awk-file2.txt
# 输出：
# NR=1   FNR=1   NF=2   FILENAME=/tmp/awk-file1.txt   $0=a 1
# NR=2   FNR=2   NF=2   FILENAME=/tmp/awk-file1.txt   $0=b 2
# NR=3   FNR=1   NF=2   FILENAME=/tmp/awk-file2.txt   $0=c 3
# NR=4   FNR=2   NF=2   FILENAME=/tmp/awk-file2.txt   $0=d 4
# NR=5   FNR=3   NF=2   FILENAME=/tmp/awk-file2.txt   $0=e 5
# 注意：NR 跨文件累加，FNR 在每个文件内独立计数

# ARGC 和 ARGV：查看命令行参数
awk 'BEGIN{
    printf "ARGC = %d\n", ARGC
    for (i = 0; i < ARGC; i++) {
        printf "ARGV[%d] = %s\n", i, ARGV[i]
    }
}' /tmp/awk-file1.txt /tmp/awk-file2.txt
# 输出：
# ARGC = 3
# ARGV[0] = awk
# ARGV[1] = /tmp/awk-file1.txt
# ARGV[2] = /tmp/awk-file2.txt

# ENVIRON：访问环境变量
awk 'BEGIN{print "HOME:", ENVIRON["HOME"]; print "USER:", ENVIRON["USER"]}'

# PROCINFO（gawk 扩展）
awk 'BEGIN{
    print "PID:", PROCINFO["pid"]
    print "UID:", PROCINFO["uid"]
    print "Version:", PROCINFO["version"]
}'
```

### 3.3 awk 运算符

#### 3.3.1 算术运算符

```bash
awk 'BEGIN{
    a = 10; b = 3
    print "加 +:",  a + b     # 13
    print "减 -:",  a - b     # 7
    print "乘 *:",  a * b     # 30
    print "除 /:",  a / b     # 3.33333（awk 自动浮点运算）
    print "取余 %:", a % b    # 1
    print "幂 ^:",  a ^ b     # 1000
    print "幂 **:", a ** b    # 1000（与 ^ 等价）
}'
```

#### 3.3.2 赋值运算符

| 运算符 | 示例 | 等价于 |
|-------|------|--------|
| `=` | `x = 10` | 基本赋值 |
| `+=` | `x += 5` | `x = x + 5` |
| `-=` | `x -= 3` | `x = x - 3` |
| `*=` | `x *= 2` | `x = x * 2` |
| `/=` | `x /= 4` | `x = x / 4` |
| `%=` | `x %= 5` | `x = x % 5` |
| `^=` | `x ^= 3` | `x = x ^ 3` |
| `++` | `x++` / `++x` | 自增（后置/前置） |
| `--` | `x--` / `--x` | 自减（后置/前置） |

#### 3.3.3 比较运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `==` | 等于 | `$1 == "Alice"` |
| `!=` | 不等于 | `$2 != 0` |
| `<` | 小于 | `$3 < 100` |
| `<=` | 小于等于 | `$3 <= 80` |
| `>` | 大于 | `$3 > 85` |
| `>=` | 大于等于 | `$3 >= 90` |
| `~` | 匹配正则 | `$2 ~ /^A/` |
| `!~` | 不匹配正则 | `$2 !~ /^A/` |
| `in` | 数组成员测试 | `"key" in arr` |

#### 3.3.4 逻辑运算符

| 运算符 | 说明 | 短路求值 |
|-------|------|---------|
| `&&` | 逻辑与 | 是 |
| `||` | 逻辑或 | 是 |
| `!` | 逻辑非 | - |

#### 3.3.5 其他运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| `?:` | 条件表达式（三元） | `$3>80 ? "Pass" : "Fail"` |
| 空格 | 字符串连接 | `str = s1 s2` |
| `$` | 字段引用 | `$N`、`$(expr)` |
| `in` | 数组成员测试 | `if ("key" in arr)` |

```bash
# 三元运算符示例
awk '{print $2, ($3 >= 85) ? "优秀" : "加油"}' /tmp/awk-patterns.txt
# 输出：
# Alice 优秀
# Bob 加油
# Carol 优秀
# David 加油
# Eve 优秀

# 字符串连接（用空格即可）
awk 'BEGIN{first="Hello"; second="World"; print first ", " second "!"}'
# 输出：Hello, World!

# 数组 in 运算符
awk 'BEGIN{
    arr["apple"] = 100; arr["banana"] = 200
    if ("apple" in arr) print "apple 存在"
    if (!("orange" in arr)) print "orange 不存在"
}'
# 输出：
# apple 存在
# orange 不存在
```

### 3.4 内置函数

#### 3.4.1 字符串函数

**length([string])** — 返回字符串长度。无参数时返回 $0 的长度。

```bash
awk '{print NR, length, $0}' /tmp/awk-patterns.txt
# 输出：
# 1 12 1 Alice 85
# 2 9 2 Bob 78
# 3 11 3 Carol 92
# ...

# 显示每个字段的长度
echo "hello world awk" | awk '{for(i=1;i<=NF;i++) print $i, length($i)}'
# 输出：
# hello 5
# world 5
# awk 3
```

**substr(string, start[, length])** — 提取子字符串（位置从 1 开始计数）。

```bash
# 提取每行的第 3-7 个字符
awk '{print substr($0, 3, 5)}' /tmp/awk-patterns.txt
# 输出：
# Alice
# Bob 7
# Carol
# avid
# ve 88
```

**index(string, substring)** — 返回 substring 在 string 中首次出现的位置，未找到返回 0。

```bash
awk 'BEGIN{
    str = "hello world"
    print index(str, "wor")     # 7
    print index(str, "xyz")     # 0
}'
```

**match(string, regex[, array])** — 正则匹配，设置 RSTART 和 RLENGTH。array 参数为 gawk 扩展。

```bash
# match 与 RSTART/RLENGTH
awk 'BEGIN{
    str = "Server: 192.168.1.100:8080"
    if (match(str, /([0-9]+\.)+[0-9]+/)) {
        print "IP 地址:", substr(str, RSTART, RLENGTH)   # 192.168.1.100
        print "起始位置:", RSTART                         # 9
        print "长度:", RLENGTH                           # 14
    }
}'

# 使用 array 参数捕获分组（gawk 扩展）
awk 'BEGIN{
    str = "Name: Alice, Age: 30"
    if (match(str, /Name: ([[:alpha:]]+), Age: ([0-9]+)/, arr)) {
        print "全部匹配:", arr[0]     # Name: Alice, Age: 30
        print "第1组:", arr[1]        # Alice
        print "第2组:", arr[2]        # 30
    }
}'
```

**split(string, array[, fieldsep])** — 按分隔符拆分字符串为数组，返回元素数量。

```bash
awk 'BEGIN{
    str = "apple,banana,cherry,date"
    n = split(str, fruits, ",")
    print "元素数:", n
    for (i = 1; i <= n; i++) print "fruits[" i "]=", fruits[i]
}'
# 输出：
# 元素数: 4
# fruits[1]= apple
# fruits[2]= banana
# fruits[3]= cherry
# fruits[4]= date
```

**sub(regex, replacement[, target]) 和 gsub(regex, replacement[, target])** — sub 替换第一个匹配，gsub 替换所有匹配。返回替换次数。target 默认为 $0。

```bash
echo "apple banana apple cherry" | awk '{gsub(/apple/, "ORANGE"); print}'
# 输出：ORANGE banana ORANGE cherry

echo "apple banana apple cherry" | awk '{n=sub(/apple/, "ORANGE"); print n, $0}'
# 输出：1 ORANGE banana apple cherry
```

**sprintf(format, expr1, ...)** — 与 printf 相同，但返回字符串而非输出。

```bash
awk 'BEGIN{
    name = "Alice"; score = 95.5
    formatted = sprintf("%-10s: %05.1f", name, score)
    print formatted    # Alice     : 095.5
}'
```

**tolower(string) 和 toupper(string)**

```bash
echo "Hello World" | awk '{print tolower($0); print toupper($0)}'
# 输出：
# hello world
# HELLO WORLD
```

**gensub(regex, replacement, how[, target])**（gawk 扩展）— 高级替换函数，不修改原 target。

```bash
awk 'BEGIN{
    str = "2026-07-29"
    result = gensub(/([0-9]+)-([0-9]+)-([0-9]+)/, "\\3/\\2/\\1", "g", str)
    print result    # 29/07/2026
}'
```

**字符串函数速查表：**

| 函数 | 说明 | POSIX |
|------|------|-------|
| `length([s])` | 字符串长度 | 是 |
| `index(s, t)` | t 在 s 中的位置 | 是 |
| `match(s, r[, a])` | 正则匹配 | 是（第三个参数为 gawk 扩展） |
| `split(s, a[, fs])` | 拆分字符串为数组 | 是 |
| `sub(r, t[, s])` | 替换第一个匹配 | 是 |
| `gsub(r, t[, s])` | 替换所有匹配 | 是 |
| `gensub(r, t, h[, s])` | 通用替换 | gawk 扩展 |
| `substr(s, i[, n])` | 提取子字符串 | 是 |
| `sprintf(f, ...)` | 格式化字符串 | 是 |
| `tolower(s)` | 转小写 | 是 |
| `toupper(s)` | 转大写 | 是 |
| `asort(src[, dst])` | 按值排序数组 | gawk 扩展 |
| `asorti(src[, dst])` | 按键排序数组 | gawk 扩展 |
| `strtonum(s)` | 字符串转数字 | gawk 扩展 |

#### 3.4.2 数学函数

| 函数 | 说明 |
|------|------|
| `int(x)` | 截断取整（向零方向截断） |
| `rand()` | 返回 [0, 1) 之间的随机浮点数 |
| `srand([x])` | 设置随机种子，返回旧的种子 |
| `sqrt(x)` | 平方根 |
| `sin(x)` | 正弦（弧度制） |
| `cos(x)` | 余弦（弧度制） |
| `atan2(y, x)` | 四象限反正切（y/x 的弧度） |
| `log(x)` | 自然对数（ln） |
| `exp(x)` | e 的 x 次幂 |

```bash
# 数学函数演示
awk 'BEGIN{
    print "int(3.7) =", int(3.7)          # 3
    print "int(-3.7) =", int(-3.7)        # -3
    print "sqrt(16) =", sqrt(16)          # 4
    print "log(10) =", log(10)            # 2.30259
    print "exp(1) =", exp(1)              # 2.71828

    # 随机数
    srand()                               # 用当前时间初始化种子
    print "rand:", int(rand() * 100)      # 0-99 的随机整数
}'

# 生成 1 到 10 之间的随机整数
awk 'BEGIN{srand(); print int(rand()*10)+1}'
```

**gawk 扩展的位操作函数：**

| 函数 | 说明 |
|------|------|
| `and(v1, v2)` | 按位与 |
| `or(v1, v2)` | 按位或 |
| `xor(v1, v2)` | 按位异或 |
| `lshift(v, n)` | 左移 n 位 |
| `rshift(v, n)` | 右移 n 位 |
| `compl(v)` | 按位取反 |

#### 3.4.3 时间函数

| 函数 | 说明 |
|------|------|
| `systime()` | 返回自纪元（1970-01-01 00:00:00 UTC）以来的秒数 |
| `strftime([format[, timestamp]])` | 格式化时间戳。省略 timestamp 则使用当前时间 |

```bash
# 获取当前时间戳
awk 'BEGIN{print systime()}'
# 输出：1751548800（示例）

# 格式化当前时间
awk 'BEGIN{print strftime("%Y-%m-%d %H:%M:%S", systime())}'
# 输出：2026-07-29 08:00:00（示例）

# 各种格式化示例
awk 'BEGIN{
    print "年-月-日:",  strftime("%Y-%m-%d")
    print "时:分:秒:",  strftime("%H:%M:%S")
    print "星期几:",    strftime("%A")
    print "月份名:",    strftime("%B")
    print "ISO 8601:",  strftime("%Y-%m-%dT%H:%M:%S%z")
}'
```

**常用 strftime 格式符：**

| 格式符 | 含义 | 示例 |
|-------|------|------|
| `%Y` | 四位年份 | 2026 |
| `%m` | 两位月份 | 07 |
| `%d` | 两位日期 | 29 |
| `%H` | 24小时制 | 08 |
| `%M` | 两位分钟 | 05 |
| `%S` | 两位秒数 | 30 |
| `%A` | 完整星期名 | Tuesday |
| `%a` | 缩写星期名 | Tue |
| `%B` | 完整月份名 | July |
| `%b` | 缩写月份名 | Jul |
| `%u` | 星期几（1=周一） | 2 |
| `%w` | 星期几（0=周日） | 2 |
| `%j` | 一年中的第几天 | 210 |
| `%z` | 时区偏移 | +0800 |
| `%Z` | 时区名称 | CST |
| `%%` | 字面量百分号 | % |

### 3.5 关联数组（Associative Array）

关联数组是 awk 最强大的数据结构。它是键值对（Key-Value Pair）的集合——键可以是任意字符串或数字，值为任意 awk 标量值。这在其他语言中有时被称为哈希表（Hash Table）或字典（Dictionary）。

#### 3.5.1 关联数组的基本操作

```bash
# 创建和访问关联数组
awk 'BEGIN{
    price["apple"]  = 8.5
    price["banana"] = 3.2
    price["cherry"] = 15.0
    print "苹果:", price["apple"]

    if ("orange" in price)
        print "橘子存在"
    else
        print "橘子不在价目表中"

    # 删除键
    delete price["banana"]
    print "删除后:", ("banana" in price) ? "还在" : "已删除"
}'
# 输出：
# 苹果: 8.5
# 橘子不在价目表中
# 删除后: 已删除
```

#### 3.5.2 遍历关联数组：for-in 循环

```bash
# 遍历所有键值对
awk 'BEGIN{
    price["apple"]  = 8.5
    price["banana"] = 3.2
    price["cherry"] = 15.0
    for (fruit in price) {
        print fruit, "->", price[fruit]
    }
}'
# 注意：for-in 遍历顺序是不确定的
```

#### 3.5.3 关联数组的经典应用场景

**场景 1：词频统计**

```bash
cat > /tmp/awk-words.txt << 'EOF'
apple banana apple cherry apple
banana cherry date apple banana
EOF

awk '{
    for (i = 1; i <= NF; i++) {
        word[$i]++
    }
}
END {
    for (w in word) {
        printf "%-10s: %d\n", w, word[w]
    }
}' /tmp/awk-words.txt
# 输出：
# apple     : 4
# banana    : 3
# cherry    : 2
# date      : 1
```

**场景 2：分组求和与平均值**

```bash
# 准备数据：部门,姓名,薪资
cat > /tmp/awk-dept.txt << 'EOF'
Engineering,Alice,85000
Marketing,Bob,65000
Engineering,Carol,92000
Sales,David,70000
Engineering,Eve,88000
Marketing,Frank,62000
Sales,Grace,75000
EOF

# 按部门统计人数、总薪资和平均薪资
awk -F, '{
    dept[$1]++                # 部门人数
    total[$1] += $3           # 部门总薪资
}
END {
    printf "%-12s %6s %10s %8s\n", "Department", "Count", "Total", "Avg"
    printf "%-12s %6s %10s %8s\n", "----------", "-----", "----------", "------"
    for (d in dept) {
        printf "%-12s %6d %10.0f %8.0f\n", d, dept[d], total[d], total[d]/dept[d]
    }
}' /tmp/awk-dept.txt
# 输出：
# Department   Count      Total      Avg
# ----------   -----  ----------  ------
# Engineering      3     265000    88333
# Marketing        2     127000    63500
# Sales            2     145000    72500
```

**场景 3：去重**

```bash
cat > /tmp/awk-dup.txt << 'EOF'
apple
banana
apple
cherry
banana
date
EOF

awk '!seen[$0]++' /tmp/awk-dup.txt
# 输出：
# apple
# banana
# cherry
# date
# 解释：seen[$0] 初始为 0（假），取反后为真，执行默认动作 print
# 再次遇到相同值时，seen[$0] 已非零，取反为假，不打印
```

**场景 4：查找表（多文件关联）**

```bash
# 准备映射文件
cat > /tmp/awk-map.txt << 'EOF'
1 Engineering
2 Marketing
3 Sales
EOF

# 准备数据文件
cat > /tmp/awk-data.txt << 'EOF'
1 Alice
2 Bob
1 Carol
3 David
EOF

# 经典模式：NR==FNR 处理第一个文件建立映射，next 跳过后续处理
awk 'NR==FNR {dept[$1]=$2; next} {print $2, "->", dept[$1]}' \
  /tmp/awk-map.txt /tmp/awk-data.txt
# 输出：
# Alice -> Engineering
# Bob -> Marketing
# Carol -> Engineering
# David -> Sales
```

#### 3.5.4 数组排序（gawk 扩展）

gawk 提供了 `asort`、`asorti` 和 `PROCINFO["sorted_in"]` 用于数组排序：

```bash
awk 'BEGIN{
    price["apple"]  = 8.5
    price["banana"] = 3.2
    price["cherry"] = 15.0

    # 使用 PROCINFO["sorted_in"] 控制遍历顺序（gawk 4.0+）
    PROCINFO["sorted_in"] = "@val_num_asc"  # 按值数值升序
    for (f in price) {
        print f, "->", price[f]
    }
}'
# 输出：
# banana -> 3.2
# apple -> 8.5
# cherry -> 15.0
```

**PROCINFO["sorted_in"] 排序策略：**

| 值 | 含义 |
|---|------|
| `"@unsorted"` | 默认，不排序 |
| `"@ind_str_asc"` | 按键字符串升序 |
| `"@ind_str_desc"` | 按键字符串降序 |
| `"@ind_num_asc"` | 按键数值升序 |
| `"@ind_num_desc"` | 按键数值降序 |
| `"@val_str_asc"` | 按值字符串升序 |
| `"@val_str_desc"` | 按值字符串降序 |
| `"@val_num_asc"` | 按值数值升序 |
| `"@val_num_desc"` | 按值数值降序 |

#### 3.5.5 多维数组（模拟）

awk 通过连接下标和 SUBSEP 模拟多维数组：

```bash
# 二维数组模拟
awk 'BEGIN{
    matrix[1,1] = "A"; matrix[1,2] = "B"
    matrix[2,1] = "C"; matrix[2,2] = "D"
    for (idx in matrix) {
        split(idx, parts, SUBSEP)
        print "matrix[" parts[1] "][" parts[2] "] =", matrix[idx]
    }
}'
# 输出：
# matrix[1][1] = A
# matrix[1][2] = B
# matrix[2][1] = C
# matrix[2][2] = D

# 实际应用：按日期+状态统计
cat > /tmp/awk-multi.txt << 'EOF'
2026-07-01 OK
2026-07-01 ERROR
2026-07-01 OK
2026-07-02 OK
2026-07-02 ERROR
2026-07-02 ERROR
EOF

awk '{count[$1, $2]++}
END {
    for (idx in count) {
        split(idx, parts, SUBSEP)
        print parts[1], parts[2], ":", count[idx]
    }
}' /tmp/awk-multi.txt
# 输出：
# 2026-07-01 OK : 2
# 2026-07-01 ERROR : 1
# 2026-07-02 OK : 1
# 2026-07-02 ERROR : 2
```

### 3.6 控制流

#### 3.6.1 if-else 语句

```bash
# 基本 if-else
awk '{
    if ($3 >= 90) {
        print $2, "优秀"
    } else if ($3 >= 80) {
        print $2, "良好"
    } else {
        print $2, "需努力"
    }
}' /tmp/awk-patterns.txt
# 输出：
# Alice 良好
# Bob 需努力
# Carol 优秀
# David 需努力
# Eve 良好
```

#### 3.6.2 while 和 do-while 循环

```bash
# while 循环
awk 'BEGIN{
    str = "HELLO"
    i = 1
    while (i <= length(str)) {
        print substr(str, i, 1)
        i++
    }
}'

# do-while 循环（至少执行一次）
awk 'BEGIN{n=0; do{print "n =", n; n++} while (n < 3)}'
```

#### 3.6.3 for 循环（C 风格）

```bash
# for 循环：遍历所有字段
awk '{for (i = 1; i <= NF; i++) printf "[%s] ", $i; print ""}' /tmp/awk-patterns.txt
# 输出：
# [1] [Alice] [85]
# [2] [Bob] [78]
# [3] [Carol] [92]
# [4] [David] [65]
# [5] [Eve] [88]

# break 和 continue
awk 'BEGIN{
    for (i = 1; i <= 10; i++) {
        if (i == 3) continue   # 跳过 i=3
        if (i == 7) break      # i=7 时退出循环
        print i
    }
}'
# 输出：1 2 4 5 6
```

#### 3.6.4 for-in 循环（遍历数组）

```bash
awk 'BEGIN{
    arr["a"]=1; arr["b"]=2; arr["c"]=3
    for (key in arr) { print key, arr[key] }
}'
```

#### 3.6.5 next 和 exit 语句

```bash
# next：跳过当前记录，立即开始下一条记录
awk 'NR==1{next} {print NR, $0}' /tmp/awk-patterns.txt
# 输出：第 2-5 行（第 1 行被跳过）

# nextfile（gawk 扩展）：跳过当前文件的剩余记录
awk 'FNR==3{nextfile} {print FILENAME, $0}' /tmp/awk-file1.txt /tmp/awk-file2.txt
# file1.txt 和 file2.txt 都只输出前 2 行

# exit [status]：立即停止处理并跳转到 END 块
awk '{
    if ($3 < 70) {
        print "发现低分，退出"
        exit 1
    }
    print $0
}
END {
    print "处理完毕，共", NR, "条记录"
}' /tmp/awk-patterns.txt
# 输出：
# 1 Alice 85
# 2 Bob 78
# 3 Carol 92
# 4 David 65
# 发现低分，退出
# 处理完毕，共 4 条记录
```

### 3.7 用户自定义函数

awk 允许用户定义函数，语法如下：

```
function name(parameter-list) {
    body
}
```

#### 3.7.1 基本函数定义

```bash
# 定义一个计算平均值的函数
awk '
function avg(a, b, c) {
    return (a + b + c) / 3.0
}
{
    result = avg($2, $3, $4)
    printf "%-8s 平均分: %.1f\n", $1, result
}' /tmp/awk-records.txt
# 输出：
# Alice    平均分: 85.0
# Bob      平均分: 91.0
# Carol    平均分: 82.3
```

#### 3.7.2 局部变量约定

awk 函数中的局部变量通过在形参列表末尾添加额外参数来声明（这是 awk 特有的约定）：

```bash
awk '
# i 和 result 前面的缩进是约定风格，表明它们是局部变量
function factorial(n,              i, result) {
    result = 1
    for (i = 1; i <= n; i++) {
        result *= i
    }
    return result
}
BEGIN {
    print "5! =", factorial(5)       # 120
    print "10! =", factorial(10)     # 3628800
}'
```

#### 3.7.3 函数作用域注意事项

```bash
awk '
function modify(val) {
    val = "CHANGED"           # 修改的是局部参数（值传递）
    global_var = "MODIFIED"   # 未声明的变量是全局的！
}
BEGIN {
    original = "ORIGINAL"
    global_var = "INITIAL"
    result = modify(original)
    print "original:", original        # "ORIGINAL"（未被修改）
    print "global_var:", global_var    # "MODIFIED"（被函数修改了！）
}'
# 重要教训：在函数中使用的变量，如果不显式声明为局部变量，就是全局变量！
```

#### 3.7.4 完整示例：带辅助函数的报告程序

```bash
cat > /tmp/report.awk << 'AWKEOF'
# 函数：计算百分比
function pct(part, total,        tmp) {
    if (total == 0) return 0
    return (part / total) * 100
}

# 函数：等级评定
function grade(score) {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
}

# 主程序
BEGIN {
    printf "%-10s %5s %5s %5s %6s\n", "Name", "Q1", "Q2", "Q3", "Grade"
    printf "%-10s %5s %5s %5s %6s\n", "----------", "-----", "-----", "-----", "------"
}
{
    avg_score = ($2 + $3 + $4) / 3
    avg_all += avg_score
    count++
    printf "%-10s %5d %5d %5d  %5.1f %s\n", $1, $2, $3, $4, avg_score, grade(avg_score)
}
END {
    printf "%-10s %5s %5s %5s %6s\n", "----------", "-----", "-----", "-----", "------"
    printf "全班平均分: %.1f (%d人)\n", avg_all / count, count
}
AWKEOF

awk -f /tmp/report.awk /tmp/awk-records.txt
```

### 3.8 实用单行脚本精选 20 例

以下 20 个 awk 单行脚本覆盖了日常文本处理中最常用的场景。每一条都可以直接复制使用。

**1. 打印第 N 个字段**

```bash
# 打印每行的第 1 个和第 3 个字段
awk '{print $1, $3}' data.txt
```

**2. 打印最后一行**

```bash
awk 'END{print}' file.txt
# 等价于 tail -n 1
```

**3. 打印第 N 到第 M 行**

```bash
# 打印第 5 到第 10 行
awk 'NR>=5 && NR<=10' file.txt
# 等价于 sed -n '5,10p'
```

**4. 统计文件总行数**

```bash
awk 'END{print NR}' file.txt
# 等价于 wc -l
```

**5. 删除空行（只输出非空行）**

```bash
awk 'NF' file.txt
# NF 为零时等于 false，空行不被打印
```

**6. 删除重复行（保留第一次出现）**

```bash
awk '!seen[$0]++' file.txt
# 经典去重模式——seen 数组记录每行出现次数
```

**7. 计算某一列的总和**

```bash
# 计算第 2 列的总和
awk '{sum+=$2} END{print sum}' data.txt
```

**8. 计算某一列的平均值**

```bash
awk '{sum+=$3; count++} END{print sum/count}' data.txt
```

**9. 找出某一列的最大值和最小值**

```bash
awk 'NR==1||$2>max{max=$2} NR==1||$2<min{min=$2} END{print "max:", max, "min:", min}' data.txt
```

**10. 按某一列分组统计行数**

```bash
awk '{count[$1]++} END{for(k in count) print k, count[k]}' data.txt
# 等价于 sort | uniq -c | sort -rn（但不排序）
```

**11. 字段分隔符转换（空格 -> CSV）**

```bash
awk 'BEGIN{OFS=","} {$1=$1; print}' data.txt
# $1=$1 强制重建 $0，触发 OFS 生效
```

**12. 格式化输出（表格对齐）**

```bash
awk '{printf "%-15s %5d %8.2f\n", $1, $2, $3}' data.txt
# 左对齐 15 字符，右对齐 5 字符整数，右对齐 8 字符浮点
```

**13. 将每行按空格转置为每行一个词**

```bash
awk '{for(i=1;i<=NF;i++) print $i}' file.txt
# 每行一个单词，常用于词频分析前置步骤
```

**14. 在每行开头添加行号和制表符**

```bash
awk '{print NR "\t" $0}' file.txt
# 等价于 cat -n，生成带行号的输出
```

**15. 打印第 N 个字段匹配正则的行**

```bash
awk '$3 ~ /^[0-9]+$/' file.txt
# 只输出第 3 个字段为纯数字的行
```

**16. 多文件关联（查找表）**

```bash
awk 'NR==FNR{map[$1]=$2; next} {print $0, map[$1]}' lookup.txt data.txt
# file1 建立映射表，file2 使用映射表追加信息
```

**17. 统计访问日志中每种 HTTP 状态码的出现次数**

```bash
awk '{count[$9]++} END{for(c in count) print c, count[c]}' access.log
# 假设第 9 个字段为 HTTP 状态码（Apache/Nginx 通用日志格式）
```

**18. 单词出现频率统计（不分大小写，去掉标点）**

```bash
awk '{for(i=1;i<=NF;i++){w=tolower($i);gsub(/[^a-zA-Z]/,"",w);if(w) count[w]++}} END{for(w in count) print count[w], w}' file.txt | sort -rn
```

**19. 计算某列值大于阈值的行所占百分比**

```bash
awk '$3>80{pass++} {total++} END{printf "通过率: %.1f%%\n", (pass/total)*100}' data.txt
```

**20. 提取特定行范围并计算区间统计**

```bash
awk 'NR>=100 && NR<=200{sum+=$2; count++} END{printf "行100-200: 合计=%d, 平均=%.2f\n", sum, sum/count}' data.txt
```

---

## 4. 实战练习

### 准备练习环境

```bash
# 创建练习工作目录
mkdir -p ~/ch14-practice
cd ~/ch14-practice

# 练习数据 1：员工信息（CSV 格式）
cat > employees.csv << 'EOF'
id,name,department,salary,hire_date,performance
1,Alice Johnson,Engineering,85000,2020-03-15,A
2,Bob Smith,Marketing,65000,2019-07-01,B
3,Carol Williams,Engineering,92000,2018-11-22,A
4,David Brown,Sales,70000,2021-01-10,C
5,Eve Davis,Engineering,88000,2020-06-30,A
6,Frank Miller,Marketing,62000,2022-02-14,C
7,Grace Wilson,Sales,75000,2019-09-05,B
8,Henry Moore,Engineering,95000,2017-05-18,A
9,Iris Taylor,Marketing,67000,2021-08-25,B
10,Jack Anderson,Sales,71000,2020-12-01,B
EOF

# 练习数据 2：Web 访问日志（Apache/Nginx 通用日志格式简化版）
cat > access.log << 'EOF'
192.168.1.100 - - [29/Jul/2026:08:00:01 +0800] "GET /index.html HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
192.168.1.101 - - [29/Jul/2026:08:00:02 +0800] "GET /api/users HTTP/1.1" 200 567 "https://example.com" "curl/7.81"
10.0.0.50 - - [29/Jul/2026:08:00:03 +0800] "POST /api/orders HTTP/1.1" 201 234 "https://example.com" "PostmanRuntime/7.29"
192.168.1.102 - - [29/Jul/2026:08:00:04 +0800] "GET /nonexistent HTTP/1.1" 404 45 "-" "Mozilla/5.0"
192.168.1.100 - - [29/Jul/2026:08:00:05 +0800] "GET /api/products HTTP/1.1" 200 890 "-" "Mozilla/5.0"
10.0.0.50 - - [29/Jul/2026:08:00:06 +0800] "GET /api/users/123 HTTP/1.1" 200 345 "-" "curl/7.81"
192.168.1.103 - - [29/Jul/2026:08:00:07 +0800] "PUT /api/users/456 HTTP/1.1" 200 123 "-" "axios/1.2"
192.168.1.100 - - [29/Jul/2026:08:00:08 +0800] "GET /about HTTP/1.1" 200 2345 "-" "Mozilla/5.0"
10.0.0.51 - - [29/Jul/2026:08:00:09 +0800] "POST /api/orders HTTP/1.1" 500 89 "-" "curl/7.81"
192.168.1.104 - - [29/Jul/2026:08:00:10 +0800] "DELETE /api/users/789 HTTP/1.1" 403 56 "-" "curl/7.81"
EOF

# 练习数据 3：学生成绩单（空格分隔，含表头）
cat > scores.txt << 'EOF'
Name Math English Science Total
Alice 85 92 78 255
Bob 78 82 88 248
Carol 95 91 89 275
David 65 70 68 203
Eve 88 85 92 265
Frank 72 68 75 215
Grace 91 94 88 273
Henry 82 79 85 246
Iris 76 88 82 246
Jack 89 86 91 266
EOF

# 练习数据 4：系统用户 ID 映射（用于多文件关联练习）
cat > dept_map.txt << 'EOF'
Engineering ENG-01
Marketing MKT-02
Sales SLS-03
EOF

# 练习数据 5：段落格式的配置信息
cat > servers.conf << 'EOF'
[web-server]
host=web01.example.com
port=8080
enabled=true

[database]
host=db01.example.com
port=5432
enabled=true

[cache]
host=cache01.example.com
port=6379
enabled=false
EOF
```

---

### 练习 14.1：基本字段提取——从 passwd 和 CSV 中提取信息

**题目：**

（1）从 `/etc/passwd` 中提取所有用户的用户名（第 1 字段）和登录 Shell（第 7 字段），用空格分隔。

（2）从 `employees.csv` 中提取第 2 列（姓名）和第 4 列（薪资），跳过表头行。

（3）打印 `employees.csv` 中每行的字段数（跳过表头）。

**答案：**

（1）：

```bash
awk -F: '{print $1, $7}' /etc/passwd
# 或使用更清晰的格式
awk -F: '{printf "Username: %-15s Shell: %s\n", $1, $7}' /etc/passwd
# 输出示例：
# Username: root            Shell: /bin/bash
# Username: daemon          Shell: /usr/sbin/nologin
# ...
```

（2）：

```bash
# 方法 1：跳过第 1 行
awk -F, 'NR>1{print $2, $4}' ~/ch14-practice/employees.csv
# 输出：
# Alice Johnson 85000
# Bob Smith 65000
# ...

# 方法 2：用模式匹配排除表头
awk -F, '!/^id,/{print $2, $4}' ~/ch14-practice/employees.csv
```

（3）：

```bash
awk -F, 'NR>1{print $2, "字段数:", NF}' ~/ch14-practice/employees.csv
# 输出：
# Alice Johnson 字段数: 6
# Bob Smith 字段数: 6
# ...
```

---

### 练习 14.2：条件筛选——过滤与分析

**题目：**

（1）从 `employees.csv` 中打印薪资大于 80000 的员工姓名和薪资（跳过表头）。

（2）从 `access.log` 中打印 HTTP 状态码不是 200 的请求行。

（3）从 `scores.txt` 中打印总分（第 5 列）高于 260 的学生姓名和总分（跳过表头）。

（4）找出 `employees.csv` 中绩效（performance）为 A 且薪资高于 90000 的员工。

**答案：**

（1）：

```bash
awk -F, 'NR>1 && $4>80000{print $2, $4}' ~/ch14-practice/employees.csv
# 输出：
# Alice Johnson 85000
# Carol Williams 92000
# Eve Davis 88000
# Henry Moore 95000
```

（2）：

```bash
# access.log 的第 9 个字段是 HTTP 状态码
awk '$9 != 200' ~/ch14-practice/access.log
# 输出：
# 201 POST 和 404、500、403 的行

# 也可以使用正则
awk '$9 !~ /^200$/' ~/ch14-practice/access.log
```

（3）：

```bash
awk 'NR>1 && $5>260{print $1, $5}' ~/ch14-practice/scores.txt
# 输出：
# Carol 275
# Eve 265
# Grace 273
# Jack 266
```

（4）：

```bash
awk -F, 'NR>1 && $6=="A" && $4>90000{print $2, $4, $6}' ~/ch14-practice/employees.csv
# 输出：
# Carol Williams 92000 A
# Henry Moore 95000 A
```

---

### 练习 14.3：BEGIN 与 END 块——报表生成

**题目：**

（1）使用 BEGIN/END 为 `scores.txt` 添加表头和各科平均分汇总行（跳过原表头行，重新生成）。

（2）使用 BEGIN/END 统计 `employees.csv` 中的总人数、总薪资和平均薪资。

（3）使用 BEGIN/END 统计 `access.log` 中总请求数，以及每种 HTTP 方法的请求数。

**答案：**

（1）：

```bash
awk 'NR==1{next}
    { math+=$2; eng+=$3; sci+=$4; total+=$5; count++ }
END {
    printf "%-10s %6s %8s %8s %8s\n", "Name", "Math", "English", "Science", "Total"
    printf "%-10s %6s %8s %8s %8s\n", "----------", "------", "--------", "--------", "------"
}
NR>1{ printf "%-10s %6d %8d %8d %8d\n", $1, $2, $3, $4, $5 }
END {
    printf "%-10s %6s %8s %8s %8s\n", "----------", "------", "--------", "--------", "------"
    printf "%-10s %6.1f %8.1f %8.1f %8.1f\n", "AVERAGE", math/count, eng/count, sci/count, total/count
}' ~/ch14-practice/scores.txt
# 注：此处有两个 END 块演示其并发执行特性；实际效果是两部分都会输出
```

（2）：

```bash
awk -F, 'NR>1{sum+=$4; count++}
END{printf "总人数: %d  总薪资: %.0f  平均薪资: %.0f\n", count, sum, sum/count}' \
  ~/ch14-practice/employees.csv
# 输出：
# 总人数: 10  总薪资: 769000  平均薪资: 76900
```

（3）：

```bash
# access.log 中 HTTP 方法在第 6 个字段（用空格分隔）
awk '{
    # 提取 HTTP 方法：$6 去掉前导双引号
    method = $6
    gsub(/"/, "", method)
    count[method]++
}
END {
    print "HTTP Method    Requests"
    print "-----------    --------"
    for (m in count) {
        printf "%-15s %d\n", m, count[m]
    }
    print "-----------    --------"
    printf "%-15s %d\n", "TOTAL", NR
}' ~/ch14-practice/access.log
```

---

### 练习 14.4：字段分隔符处理——CSV 转 TSV

**题目：**

（1）将 `employees.csv` 从逗号分隔（CSV）转换为制表符分隔（TSV）。

（2）从 `/etc/passwd` 中提取用户名、UID、GID 和 Home 目录，用制表符分隔输出，并加上表头。

（3）将 `servers.conf` 中 `[section]` 标记后的 `key=value` 行转换为 `section key value` 格式。

**答案：**

（1）：

```bash
awk 'BEGIN{FS=","; OFS="\t"} {$1=$1; print}' ~/ch14-practice/employees.csv
# $1=$1 强制重建 $0，使得 OFS 生效
# 输出的第一个行（表头）也会被转换
```

（2）：

```bash
awk -F: 'BEGIN{
    OFS="\t"
    print "USERNAME\tUID\tGID\tHOME"
    print "--------\t---\t---\t----"
}
{
    print $1, $3, $4, $6
}' /etc/passwd
```

（3）：

```bash
# 提取 [section] 中的名称，并与后续的 key=value 关联
awk -F= '
/^\[/{section=$1; gsub(/[\[\]]/, "", section); next}
NF==2{print section, $1, $2}
' ~/ch14-practice/servers.conf
# 输出：
# web-server host web01.example.com
# web-server port 8080
# web-server enabled true
# database host db01.example.com
# database port 5432
# database enabled true
# cache host cache01.example.com
# cache port 6379
# cache enabled false
```

---

### 练习 14.5：数学运算——统计分析

**题目：**

（1）计算 `employees.csv` 中薪资的标准差。

（2）找出 `scores.txt` 中数学成绩（Math）最高和最低的学生。

（3）计算 `access.log` 中各 HTTP 状态码的请求占比（百分比）。

**答案：**

（1）：

```bash
awk -F, 'NR>1{
    salary[++n] = $4
    sum += $4
}
END {
    avg = sum / n
    for (i = 1; i <= n; i++) {
        sq_diff += (salary[i] - avg) ^ 2
    }
    stdev = sqrt(sq_diff / n)
    printf "人数: %d  平均: %.0f  标准差: %.0f\n", n, avg, stdev
}' ~/ch14-practice/employees.csv
```

（2）：

```bash
awk 'NR==1{next}
    NR==2 || $2>max{max=$2; max_name=$1}
    NR==2 || $2<min{min=$2; min_name=$1}
END {
    printf "数学最高: %s (%d)\n", max_name, max
    printf "数学最低: %s (%d)\n", min_name, min
}' ~/ch14-practice/scores.txt
# 输出：
# 数学最高: Carol (95)
# 数学最低: David (65)
```

（3）：

```bash
awk '{
    total++
    status[$9]++
}
END {
    printf "%-8s %8s %8s\n", "Status", "Count", "Percent"
    printf "%-8s %8s %8s\n", "------", "------", "------"
    for (s in status) {
        printf "%-8s %8d %7.1f%%\n", s, status[s], (status[s]/total)*100
    }
}' ~/ch14-practice/access.log
# 输出：
# Status     Count   Percent
# ------     -----   ------
# 200            5    50.0%
# 201            1    10.0%
# 403            1    10.0%
# 404            1    10.0%
# 500            1    10.0%
# ...
```

---

### 练习 14.6：关联数组——分组统计

**题目：**

（1）统计 `employees.csv` 中每个部门（department）的员工人数。

（2）统计 `employees.csv` 中每个部门的总薪资和平均薪资。

（3）统计 `access.log` 中每个 IP 地址的访问次数，按次数降序排列。

**答案：**

（1）：

```bash
awk -F, 'NR>1{dept[$3]++}
END{for(d in dept) printf "%-15s %d\n", d, dept[d]}' ~/ch14-practice/employees.csv
# 输出：
# Engineering     4
# Marketing       3
# Sales           3
```

（2）：

```bash
awk -F, 'NR>1{
    dept[$3]++
    total[$3] += $4
}
END {
    printf "%-15s %6s %10s %8s\n", "Department", "Count", "TotalSalary", "AvgSalary"
    printf "%-15s %6s %10s %8s\n", "----------", "-----", "----------", "--------"
    for (d in dept) {
        printf "%-15s %6d %10.0f %8.0f\n", d, dept[d], total[d], total[d]/dept[d]
    }
}' ~/ch14-practice/employees.csv
# 输出：
# Department      Count TotalSalary AvgSalary
# ----------      ----- ---------- --------
# Engineering         4     360000    90000
# Marketing           3     194000    64667
# Sales               3     216000    72000
```

（3）：

```bash
awk '{count[$1]++}
END{
    PROCINFO["sorted_in"] = "@val_num_desc"  # gawk 4.0+ 按值降序遍历
    for(ip in count) printf "%-16s %d\n", ip, count[ip]
}' ~/ch14-practice/access.log
# 输出：
# 192.168.1.100   3
# 10.0.0.50       2
# 192.168.1.101   1
# ...
# 如果 gawk 版本不支持 PROCINFO["sorted_in"]，可用管道：
# awk '{count[$1]++} END{for(ip in count) print count[ip], ip}' access.log | sort -rn
```

---

### 练习 14.7：字符串函数——文本清洗与转换

**题目：**

（1）将 `employees.csv` 中第 2 列的姓名转换为大写输出。

（2）统计 `employees.csv` 中每个员工姓（Last Name）的出现频率（假设名字格式为 "FirstName LastName"，取空格后的部分）。

（3）将 `access.log` 中的 IP 地址脱敏——前两段保留，后两段替换为 `XXX.XXX`（如 `192.168.XXX.XXX`）。

**答案：**

（1）：

```bash
awk -F, 'NR>1{print toupper($2)}' ~/ch14-practice/employees.csv
# 输出：
# ALICE JOHNSON
# BOB SMITH
# CAROL WILLIAMS
# ...
```

（2）：

```bash
awk -F, 'NR>1{
    # 提取空格后的部分作为姓
    n = split($2, name_parts, " ")
    last_name = name_parts[n]
    lastname_count[last_name]++
}
END {
    for (ln in lastname_count) {
        print ln ":", lastname_count[ln]
    }
}' ~/ch14-practice/employees.csv
# 输出：
# Johnson: 1
# Smith: 1
# Williams: 1
# Brown: 1
# ...
```

（3）：

```bash
awk '{
    # 匹配 IP 地址格式 x.x.x.x
    ip = $1
    if (match(ip, /^([0-9]+)\.([0-9]+)\.[0-9]+\.[0-9]+/, m)) {
        masked = m[1] "." m[2] ".XXX.XXX"
    }
    $1 = masked
    print
}' ~/ch14-practice/access.log
# 输出：
# 192.168.XXX.XXX - - [29/Jul/2026:08:00:01 +0800] "GET /index.html HTTP/1.1" 200 ...
# 注意：使用 match 的第三个参数是 gawk 扩展
```

---

### 练习 14.8：printf 格式化输出——报表美化

**题目：**

（1）以表格形式输出 `scores.txt`（跳过原表头），重新生成对齐的格式化表格。

（2）从 `employees.csv` 生成一份包含排名、姓名、部门、薪资的表格，按薪资降序排列。

（3）以百分比格式输出 `scores.txt` 中每位学生各科成绩占总分的比例。

**答案：**

（1）：

```bash
awk 'NR==1{next}
{
    printf "%-10s %6s %8s %8s %8s\n", $1, $2, $3, $4, $5
}' ~/ch14-practice/scores.txt
# 输出：格式化对齐的表格
```

（2）：

```bash
awk -F, 'NR>1{print $4, $2, $3}' ~/ch14-practice/employees.csv | sort -rn | awk '
BEGIN { printf "%-5s %-18s %-15s %8s\n", "Rank", "Name", "Department", "Salary"
        printf "%-5s %-18s %-15s %8s\n", "----", "------------------", "---------------", "------" }
      { printf "%-5d %-18s %-15s %8s\n", NR, $2, $3, "$"$1 }'
# 输出：
# Rank  Name               Department      Salary
# ----  ------------------  --------------- ------
# 1     Henry Moore         Engineering     $95000
# 2     Carol Williams      Engineering     $92000
# ...
```

（3）：

```bash
awk 'NR==1{next}
{
    total = $2 + $3 + $4
    printf "%-10s Math: %5.1f%%  Eng: %5.1f%%  Sci: %5.1f%%\n", \
      $1, ($2/total)*100, ($3/total)*100, ($4/total)*100
}' ~/ch14-practice/scores.txt
# 输出：
# Alice      Math:  33.3%  Eng:  36.1%  Sci:  30.6%
# Bob        Math:  31.5%  Eng:  33.1%  Sci:  35.5%
# ...
```

---

### 练习 14.9：正则表达式高级匹配

**题目：**

（1）从 `access.log` 中找出请求的 URL 路径以 `/api/` 开头的所有行。

（2）找出 `employees.csv` 中邮箱格式不规范的记录（如果数据中有 email 字段）——使用 `employees.csv` 中姓名包含特殊字符的行作为替代练习：找出姓名包含 `'` 或 `-` 的记录（如果有的话）。

（3）从 `access.log` 中找出 User-Agent 包含 "curl" 的请求，并打印 IP 和请求的 URL 路径。

**答案：**

（1）：

```bash
awk '$7 ~ /^\/api\//' ~/ch14-practice/access.log
# 输出：所有请求路径以 /api/ 开头的行
# 例如：
# 192.168.1.101 ... "GET /api/users HTTP/1.1" ...
# 10.0.0.50 ... "POST /api/orders HTTP/1.1" ...
```

（2）：

```bash
# 以 employees.csv 为例：检查名字列（第 2 列）是否包含非字母空格字符
awk -F, 'NR>1 && $2 ~ /[^a-zA-Z ]/{print "特殊姓名:", $2}' ~/ch14-practice/employees.csv
# 本例中没有特殊字符，所有姓名都是正常的英文名
# 扩展练习：创建一个包含特殊字符姓名的小文件来测试
echo "11,O'Brien,Marketing,70000,2020-01-01,B" >> ~/ch14-practice/employees_special.csv
cat ~/ch14-practice/employees.csv >> ~/ch14-practice/employees_special.csv
awk -F, '$2 ~ /[^a-zA-Z ]/' ~/ch14-practice/employees_special.csv
```

（3）：

```bash
awk '$NF ~ /curl/' ~/ch14-practice/access.log | awk '{print $1, $7}'
# 或者在一个 awk 调用中完成：
awk '$NF ~ /curl/{print $1, $7}' ~/ch14-practice/access.log
# 输出：
# 192.168.1.101 /api/users
# 10.0.0.50 /api/users/123
# 10.0.0.51 /api/orders
# 192.168.1.104 /api/users/789
```

---

### 练习 14.10：控制流——条件与循环

**题目：**

（1）遍历 `scores.txt` 中的每一行（跳过表头），用 if-else 判断每位学生的等级：总分 270+ 为 "A"，240-269 为 "B"，210-239 为 "C"，210 以下为 "D"。

（2）编写一个循环，打印 `scores.txt` 中每位学生的各科成绩及其与平均分的偏差。

（3）使用 `next` 跳过 `employees.csv` 中 performance 为 "C" 的员工，只输出 A 和 B 级别的员工。

**答案：**

（1）：

```bash
awk 'NR==1{next}
{
    if ($5 >= 270) grade = "A"
    else if ($5 >= 240) grade = "B"
    else if ($5 >= 210) grade = "C"
    else grade = "D"
    printf "%-10s %3d  %s\n", $1, $5, grade
}' ~/ch14-practice/scores.txt
# 输出：
# Alice      255  B
# Bob        248  B
# Carol      275  A
# David      203  D
# Eve        265  B
# Frank      215  C
# Grace      273  A
# Henry      246  B
# Iris       246  B
# Jack       266  B
```

（2）：

```bash
awk 'NR==1{next}
{
    avg = ($2 + $3 + $4) / 3
    printf "%-10s", $1
    for (i = 2; i <= 4; i++) {
        diff = $i - avg
        printf "  %s:%d(%+d)", (i==2?"Math":i==3?"Eng":"Sci"), $i, diff
    }
    print ""  # 换行
}' ~/ch14-practice/scores.txt
# 输出：
# Alice        Math:85(+0)  Eng:92(+7)  Sci:78(-7)
# Bob          Math:78(-4)  Eng:82(+0)  Sci:88(+6)
# ...
```

（3）：

```bash
awk -F, 'NR==1{print; next}   # 表头始终打印
    $6 == "C" {next}           # 跳过 C 级别
    {print}' ~/ch14-practice/employees.csv
# 输出：除 performance 为 C 的员工之外的所有行
```

---

### 练习 14.11：多文件关联——查找表

**题目：**

（1）使用 `dept_map.txt`（部门名到部门代码的映射）为 `employees.csv` 的每一行追加部门代码。

（2）模拟两阶段处理：先计算 `scores.txt` 中每人的总分，再用第二个 awk 调用找出总分最高的 3 人。

（3）（挑战题）修改 `ARGV` 数组以动态切换输入文件——使用 BEGIN 块手动设置要处理的文件列表。

**答案：**

（1）：

```bash
awk -F, '
NR==FNR {
    # 处理第一个文件 dept_map.txt（FS 默认是空格，因为是通过 -F, 传入的）
    # 但 dept_map.txt 是空格分隔！需要处理这个冲突
}
' ~/ch14-practice/dept_map.txt ~/ch14-practice/employees.csv
# 由于两个文件分隔符不同，需要更细致的处理

# 正确方案：不使用 -F,，在 awk 内部动态判断
awk '
# 处理第一个文件：dept_map.txt（空格分隔）
NR==FNR {
    dept_code[$1] = $2
    next
}
# 处理第二个文件：employees.csv（逗号分隔）
FNR==1 {
    # 表头：重新解析
    n = split($0, hdr, ",")
    # 追加列
    for (i = 1; i <= n; i++) printf "%s,", hdr[i]
    print "dept_code"
    next
}
{
    # 解析 CSV 行
    n = split($0, fields, ",")
    for (i = 1; i <= n; i++) printf "%s,", fields[i]
    print dept_code[fields[3]]
}' ~/ch14-practice/dept_map.txt ~/ch14-practice/employees.csv
# 输出：employees.csv 的内容 + 末尾追加的部门代码列
```

（2）：

```bash
# 步骤 1：计算每人总分
awk 'NR>1{print $1, $5}' ~/ch14-practice/scores.txt | sort -k2 -rn | head -3
# 输出：
# Grace 273
# Carol 275
# Jack 266
# （按总分降序后发现 Carol 比 Grace 高，实际排名应为 Carol > Grace > Jack）

# 正确的从高到低排序：
awk 'NR>1{print $5, $1}' ~/ch14-practice/scores.txt | sort -rn | head -3
# 输出：
# 275 Carol
# 273 Grace
# 266 Jack
```

（3）：

```bash
# 使用 ARGV 控制输入文件列表
awk 'BEGIN{
    # 手动设置要处理的文件
    ARGV[1] = "/etc/hostname"
    ARGV[2] = "/etc/hosts"
    ARGC = 3   # ARGV[0]="awk" + 两个文件
}
{
    print FILENAME ":", $0
}'
# 输出：
# /etc/hostname: (hostname内容)
# /etc/hosts: (hosts文件内容)
```

---

### 练习 14.12：用户自定义函数——综合应用

**题目：**

（1）编写一个 `grade(score)` 函数，根据分数返回等级，并在 `scores.txt` 中使用它给每位学生评等级。

（2）编写一个 `to_camel_case(str)` 函数，将 "hello world awk" 转换为 "helloWorldAwk"，并使用它处理 `employees.csv` 中部门名称的格式转换。

（3）（综合挑战）编写一个完整的 awk 脚本 `stats.awk`，接受一个 CSV 文件作为输入，输出包含以下内容的统计报告：总记录数、按某列分组的计数、每列的平均值、整体数据摘要。

**答案：**

（1）：

```bash
awk '
function grade(score) {
    if (score >= 270) return "A"
    if (score >= 240) return "B"
    if (score >= 210) return "C"
    return "D"
}
NR==1{printf "%-10s %6s %6s\n", "Name", "Total", "Grade"; next}
{
    printf "%-10s %6d %6s\n", $1, $5, grade($5)
}' ~/ch14-practice/scores.txt
# 输出：
# Name       Total  Grade
# Alice        255      B
# Bob          248      B
# Carol        275      A
# David        203      D
# ...
```

（2）：

```bash
awk '
function to_camel_case(str,       parts, n, i, result) {
    n = split(str, parts, " ")
    result = tolower(parts[1])
    for (i = 2; i <= n; i++) {
        result = result toupper(substr(tolower(parts[i]), 1, 1)) \
                  tolower(substr(parts[i], 2))
    }
    return result
}
BEGIN {
    print to_camel_case("hello world awk")       # helloWorldAwk
    print to_camel_case("ENGINEERING DESIGN")     # engineeringDesign
    print to_camel_case("Quality Assurance Test") # qualityAssuranceTest
}'
# 输出：
# helloWorldAwk
# engineeringDesign
# qualityAssuranceTest
```

（3）：

```bash
cat > ~/ch14-practice/stats.awk << 'AWKEOF'
#!/usr/bin/awk -f
# stats.awk — CSV 文件统计报告生成器
# 用法: awk -F, -f stats.awk -v group_col=3 -v value_col=4 data.csv

function avg(arr, n,      i, sum) {
    for (i in arr) sum += arr[i]
    return sum / n
}

BEGIN {
    if (group_col == "") group_col = 3   # 默认按第 3 列分组
    if (value_col == "") value_col = 4   # 默认统计第 4 列
    FS = ","
}

NR == 1 {
    # 保存表头
    header = $0
    next
}

{
    # 统计总数
    total_records++

    # 按 group_col 分组计数
    group[$group_col]++

    # 按 group_col 分组累加 value_col
    sum[$group_col] += $value_col

    # 收集所有 value 用于计算整体统计
    all_values[total_records] = $value_col
    all_sum += $value_col
}

END {
    print "====== 统计报告 ======"
    print ""
    printf "总记录数: %d\n", total_records
    printf "总%s合计: %.0f\n", (value_col==4?"薪资":"值"), all_sum
    printf "总%s均值: %.2f\n", (value_col==4?"薪资":"值"), all_sum / total_records
    print ""

    printf "%-20s %8s %10s\n", "分组", "记录数", "平均" (value_col==4?"薪资":"值")
    printf "%-20s %8s %10s\n", "--------------------", "------", "--------"
    for (g in group) {
        printf "%-20s %8d %10.2f\n", g, group[g], sum[g]/group[g]
    }
}
AWKEOF

chmod +x ~/ch14-practice/stats.awk

# 执行示例
awk -F, -f ~/ch14-practice/stats.awk ~/ch14-practice/employees.csv
```

---

## 5. 常见错误与排错

### 5.1 忘记为非空格分隔符设置 FS

**现象：**

```bash
awk '{print $1, $2}' /etc/passwd
# 输出：整行的内容作为 $1（因为冒号不是空格，默认 FS 没有拆分）
```

**原因：** 默认 FS 是单个空格字符（特殊行为：匹配任意连续空白）。对于冒号、逗号、制表符等非空白分隔符，需要显式指定。

**解决：**

```bash
# 正确：使用 -F 选项
awk -F: '{print $1, $2}' /etc/passwd

# 或使用 BEGIN 块
awk 'BEGIN{FS=":"} {print $1, $2}' /etc/passwd

# 或使用 -v
awk -v FS=":" '{print $1, $2}' /etc/passwd
```

### 5.2 Shell 变量与 awk 变量混淆

**现象：**

```bash
name="Alice"
# 错误：在单引号内使用 $name——Shell 不会展开
awk -F, '$2 == "$name"{print}' employees.csv
# 输出为空！因为 awk 看到的是字面量字符串 "$name"

# 错误：在双引号内直接引用 Shell 变量——注入风险
awk -F, "$2 == \"$name\"{print}" employees.csv
# 如果 name 包含特殊字符（如 /），awk 语法可能被破坏
```

**原因：** awk 程序在单引号中时，Shell 不做变量展开。在双引号中直接拼接会导致代码注入和语法错误风险。

**解决：**

```bash
# 正确方法：使用 -v 传递变量
awk -F, -v name="$name" '$2 == name{print}' employees.csv

# 或者使用 ENVIRON 数组
export name="Alice"
awk -F, '$2 == ENVIRON["name"]{print}' employees.csv
```

### 5.3 忘记 BEGIN 块做预处理

**现象：**

```bash
# 想要打印表头，把 print 放在了模式-动作块中
awk '{print "NAME\tAGE"} {print $1, $2}' data.txt
# 输出：每一行前面都打印了表头
```

**原因：** 没有用 BEGIN 块包裹预处理代码，导致每处理一条记录都执行一次。

**解决：**

```bash
# 正确：表头放在 BEGIN 块中
awk 'BEGIN{print "NAME\tAGE"} {print $1, $2}' data.txt
```

### 5.4 while/for 循环中的死循环

**现象：**

```bash
# 终端卡住，光标闪烁，CPU 100%
awk 'BEGIN{
    i = 1
    while (i <= 10) {
        print i
        # 忘记 i++ ！
    }
}'
# Ctrl+C 也无法立即中断（需等待当前 print 完成）
```

**原因：** 循环变量没有递增或条件永远为真。

**解决：**

```bash
# 正确：确保循环变量在每次迭代中发生变化
awk 'BEGIN{
    for (i = 1; i <= 10; i++) {
        print i
    }
}'
# 使用 for 循环代替 while 可以减少此类错误
```

### 5.5 字符串比较 vs 数值比较的类型陷阱

**现象：**

```bash
# 字符串比较：按字典序
awk 'BEGIN{
    if ("10" < "9") print "10 < 9 (字符串比较)"
    if (10 < 9)    print "10 < 9 (数值比较——不会输出)"
}'
# 输出：10 < 9 (字符串比较)
# 因为 "10" 和 "9" 作为字符串比较时，'1' 的 ASCII 码小于 '9'
```

**原因：** awk 根据操作数的上下文自动决定比较类型。从文件读取的字段默认是字符串类型。当字符串参与数值运算时会自动转换为数字，但比较运算时可能仍是字符串比较。

**解决：**

```bash
# 显式进行数值转换（加 0）
awk '$3 + 0 > 85' data.txt

# 或使用 int() 函数
awk 'int($3) > 85' data.txt

# 字段参与算术运算（如 $3+0）会自动触发数值转换
```

### 5.6 print 参数遗忘逗号导致字符串粘连

**现象：**

```bash
echo "a b c" | awk '{print $1 $2 $3}'
# 输出：abc
# 期望：a b c
```

**原因：** awk 中字符串连接操作符是空格（将两个表达式并列）。`print $1 $2 $3` 将三个字段连接为一个字符串后再输出，中间没有 OFS。

**解决：**

```bash
# 正确：用逗号分隔，awk 自动插入 OFS（默认空格）
echo "a b c" | awk '{print $1, $2, $3}'
# 输出：a b c

# 使用逗号 = 让 print 用 OFS 分隔
# 不使用逗号 = 字符串连接后一次性输出
```

### 5.7 关联数组处理大文件导致内存溢出

**现象：**

```bash
# 处理 2GB 的日志文件，统计每个 IP 的访问次数
awk '{count[$1]++} END{...}' huge_log_2gb.txt
# awk 进程内存消耗持续增长，最终被 OOM Killer 杀掉
```

**原因：** 关联数组将所有去重后的键值对保存在内存中。当唯一键的数量非常大（如数百万不同的 IP 地址），内存消耗可能超过可用物理内存。

**解决：**

```bash
# 方案 1：使用 sort + uniq 分流（适合极端大规模去重）
sort huge_log.txt | uniq -c | sort -rn | head -100

# 方案 2：使用管道分段处理
split -l 1000000 huge_log.txt chunk_
for f in chunk_*; do
    awk '{count[$1]++} END{for(k in count) print count[k], k}' "$f" >> /tmp/partial
done
sort -k2 /tmp/partial | awk '{sum[$2]+=$1} END{for(k in sum) print sum[k], k}' | sort -rn

# 方案 3：如果只需要 Top N，定期清理低频键
awk '{
    count[$1]++
    if (NR % 100000 == 0) {
        # 定期删除只有 1 次的键（低频项）
        for (k in count) if (count[k] == 1) delete count[k]
    }
}
END{...}' huge_log.txt
```

### 5.8 多文件处理时 NR 与 FNR 混淆

**现象：**

```bash
# 期望：file1 建立映射，file2 使用映射
# 错误：使用 NR==1 判定是否在处理 file1
awk 'NR==1{map[$1]=$2; next} {print $0, map[$1]}' file1 file2
# 这样 file1 的第 1 行会被装入 map，但 file1 的第 2 行开始就被当作 file2 处理了！
```

**原因：** NR 是全局计数器。NR==FNR 在且仅在处理第一个文件时为真（因为第一个文件处理完毕时，FNR 重置为 1，但 NR 继续累加）。

**解决：**

```bash
# 正确：使用 NR==FNR 判定第一个文件
awk 'NR==FNR{map[$1]=$2; next} {print $0, map[$1]}' file1 file2
# NR==FNR 当且仅当在处理第一个文件时为真
```

---

## 6. 进阶延伸

### 6.1 awk 脚本文件与 Shebang

当 awk 程序超过 10 行时，建议写入文件并通过 `-f` 选项调用：

```bash
# 创建分析脚本
cat > ~/bin/log-summary.awk << 'AWKEOF'
#!/usr/bin/awk -f
# 日志摘要分析脚本
# 用法: ./log-summary.awk access.log
# 或: awk -f log-summary.awk access.log

BEGIN {
    print "=== Log Analysis Report ==="
    print strftime("Generated: %Y-%m-%d %H:%M:%S", systime())
    print ""
}

{
    total++
    # 按 HTTP 方法统计
    method = $6
    gsub(/"/, "", method)
    methods[method]++

    # 按状态码统计
    statuses[$9]++

    # 按小时统计
    hour = substr($4, 14, 2)
    hourly[hour]++
}

END {
    printf "Total Requests: %d\n\n", total

    print "--- By HTTP Method ---"
    for (m in methods) printf "  %-8s %d\n", m, methods[m]

    print "\n--- By Status Code ---"
    for (s in statuses) printf "  %-8s %d (%.1f%%)\n", s, statuses[s], (statuses[s]/total)*100

    print "\n--- By Hour ---"
    PROCINFO["sorted_in"] = "@ind_str_asc"
    for (h in hourly) printf "  %s:00  %d\n", h, hourly[h]
}
AWKEOF

chmod +x ~/bin/log-summary.awk
~/bin/log-summary.awk ~/ch14-practice/access.log
```

### 6.2 awk 在 Shell 管道中的实战模式

awk 在 Shell 管道中通常承担"分析中枢"的角色：

```bash
# 模式 1：grep 过滤 -> awk 计算
grep "ERROR" /var/log/syslog | awk '{print $0}' | wc -l
# 等同于
grep -c "ERROR" /var/log/syslog

# 模式 2：awk 提取 -> sort 排序 -> uniq 去重
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
# 这本身也可以用纯 awk 完成，但在超大规模数据下 sort 的外部排序更可靠

# 模式 3：awk 计算 -> awk 格式化
df -h | awk 'NR>1{print $5, $6}' | sort -rn | \
  awk '{printf "%-30s %s\n", $2, $1}'

# 模式 4：多文件关联
# 用 awk 预先处理两个文件，在第三个 awk 中合并
awk '{print $1}' file1 | sort > /tmp/keys1
awk '{print $1}' file2 | sort > /tmp/keys2
comm -12 /tmp/keys1 /tmp/keys2  # 找交集
```

### 6.3 awk vs Python/Perl：工具选择指南

awk、Python 和 Perl 都能处理文本，如何选择？

| 任务 | 推荐工具 | 理由 |
|------|---------|------|
| 单次数据分析（管道） | **awk** | 一行命令搞定，无需写文件、无 boilerplate |
| 日志流式处理 | **awk** | 内存占用小，流式处理效率高 |
| 复杂逻辑（多条件分支、状态机） | **Perl** 或 **Python** | awk 的脚本能力有限，大程序难以维护 |
| JSON/XML/CSV 解析 | **Python**（或 `jq`/`xq`） | awk 不处理嵌套结构和引用转义 |
| 网络请求/数据库连接 | **Python** | gawk 有 TCP 支持但不稳定，Python 生态成熟 |
| 频繁修改的长期脚本 | **Python** | 可读性、可测试性、IDE 支持远优于 awk |
| 列式计算（sum/avg/group） | **awk** | 最简洁，`awk '{sum+=$3} END{print sum}'` |
| 系统运维一键命令 | **awk** | 系统自带，无依赖，适合 SSH 远程执行 |

**经验法则：** 如果逻辑能用一行 awk 写完，就用 awk。如果程序超过 20 行且需要长期维护，就用 Python。

### 6.4 gawk 专属扩展功能

GNU Awk（gawk）在 POSIX awk 基础上提供了许多扩展功能：

#### 6.4.1 TCP/IP 网络编程（/inet）

```bash
# gawk 支持通过 /inet 伪文件进行 TCP/UDP 通信
# 示例：检查 HTTP 服务是否可用
awk 'BEGIN{
    service = "/inet/tcp/0/example.com/80"
    print "GET / HTTP/1.1" |& service
    print "Host: example.com" |& service
    print "" |& service
    while ((service |& getline) > 0) {
        print $0
        if (++n >= 5) break   # 只取前 5 行
    }
    close(service)
}'
# 注意：此功能在编译 gawk 时需要 --enable-network 选项
```

#### 6.4.2 协程（Coprocess）

```bash
# gawk 协程：与外部命令双向通信
# 示例：通过 tr 命令进行大小写转换
awk 'BEGIN{
    cmd = "tr a-z A-Z"
    print "hello world" |& cmd
    close(cmd, "to")          # 关闭写端
    while ((cmd |& getline) > 0) {
        print "Uppercase:", $0   # HELLO WORLD
    }
    close(cmd)
}'
```

#### 6.4.3 命名空间（Namespace）

```bash
# gawk 5.0+ 支持命名空间，便于组织大型 awk 库
gawk '
@namespace "math"
function square(x) { return x * x }

@namespace "main"
BEGIN {
    print math::square(5)   # 25
}
'
```

#### 6.4.4 include 指令

```bash
# 创建可复用的函数库
cat > ~/awk-lib.awk << 'EOF'
function trim(s) {
    gsub(/^[ \t]+|[ \t]+$/, "", s)
    return s
}
function pct(part, total) {
    if (total == 0) return 0
    return (part / total) * 100
}
EOF

# 使用 @include 引入库（gawk 5.0+）
gawk -i ~/awk-lib.awk 'BEGIN{print trim("  hello  ")}'
```

#### 6.4.5 调试器

```bash
# gawk 内置交互式调试器
gawk -D -f program.awk data.txt
# 调试器命令：
# b N    — 在第 N 行设置断点
# r      — 运行直到断点
# p var  — 打印变量值
# s      — 单步执行
# n      — 单步（跳过函数调用）
# c      — 继续执行
# q      — 退出
```

### 6.5 性能考量

对于大数据集的 awk 处理，以下优化策略可以显著提升性能：

```bash
# 1. 避免不必要的字段分割
# awk 不需要访问字段时，不要在程序中引用 $1/$2/NF 等
# 不需要字段时用 grep 替代 awk
grep "ERROR" huge.log          # 比 awk '/ERROR/' 略快

# 2. 使用 next 尽早跳过不需要的行
# 把最常见的模式放在前面
awk '$9==200{next} {print}' access.log    # 跳过 200（最常见）
# 优于先打印再判断

# 3. 避免在循环中使用正则匹配
# 差：
awk '{for(i=1;i<=NF;i++) if($i~/pattern/) print}' file
# 好：
awk '/pattern/{for(i=1;i<=NF;i++) print $i}' file

# 4. 使用字符类 [ ] 代替 | 选择
# 差：
awk '$1 ~ /error|warn|fail/' log
# 好：
awk '$1 ~ /error|warn|fail/' log  # 差别很小，但当模式很多时可以考虑预编译

# 5. 关闭不需要的 gawk 特性
gawk --posix '...'      # 使用 POSIX 模式，禁用 gawk 扩展
gawk --no-optimize '...' # 关闭优化器（调试用）

# 6. 大数据去重：外部排序可能比关联数组更高效
LC_ALL=C sort -u huge.txt | wc -l   # 外部排序 + C locale 加速
```

### 6.6 延伸阅读与资源

- **GNU Awk 官方手册**：`info gawk`（本机）或 https://www.gnu.org/software/gawk/manual/
- **Effective awk Programming**（Arnold Robbins）：GNU awk 维护者撰写，包含大量实战技巧
- **The AWK Programming Language**（Aho, Kernighan, Weinberger）：awk 三位创始人的经典著作
- **awk 一行命令速查**：https://www.pement.org/awk/awk1line.txt
- **awk 常见问答（FAQ）**：`man gawk` 中的 FAQ 部分，或 https://www.gnu.org/software/gawk/manual/gawk.html#FAQ

---

**本章小结：**

awk 是"文本处理三剑客"中最强大的一员。与 grep 的"搜索"和 sed 的"编辑"不同，awk 的核心能力是**按字段进行分析与计算**。

awk 的核心思维可以归纳为四点：

1. **记录与字段的世界观**：数据由记录（Record）组成，每条记录由字段（Field）组成。`$0` 是整条记录，`$1`..`$NF` 是字段，`NR` 是记录号，`NF` 是字段数。这比 sed 的"一切皆行"的模型更丰富。

2. **模式-动作范式**：`pattern { action }`。模式决定"对哪些记录执行"，动作决定"执行什么"。BEGIN/END 是特殊的模式节点，分别在处理前和处理后执行一次。

3. **关联数组是灵魂**：从词频统计到分组汇总，从去重到查找表，关联数组使得 awk 能够处理"按键归类"的几乎所有场景。理解关联数组 = 理解 awk 80% 的能力。

4. **优雅的极简主义**：`awk '{print $1}'` 能做的事情，不写两行。`awk '!seen[$0]++'` 实现去重的简洁程度，在几乎所有主流语言中都难以超越。

从第 13 章的 sed 到本章的 awk，你已经掌握了 Linux 文本处理领域最重要的两个工具。下一个阶段，你将在第 15 章学习文本处理的辅助工具箱——sort、uniq、cut、tr、xargs、paste 等——它们虽然各自功能单一，但与 grep、sed、awk 组合起来，构成了 Linux 文本处理的完整兵器谱。

三剑客中的每一把剑都不是孤立存在的。真正的力量，在于让它们在管道中协同工作：
```
grep 过滤 → sed 编辑 → awk 计算 → sort 排序
```
这是一种"Unix 思维"——将复杂问题分解为简单的步骤，每个步骤由一个专用工具完成，然后用管道串联起来。这是 Linux 命令行哲学的精髓。<｜end▁of▁thinking｜>
