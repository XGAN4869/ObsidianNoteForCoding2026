# 第 13 章 流编辑器 sed

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

### 1.1 从"搜索"到"编辑"

第 11 章你学会了用 `grep` 搜索文本，第 12 章你掌握了正则表达式的完整语法。现在，你面前摆着新的任务：

- "把 500 行配置文件中所有的 `port 8080` 改成 `port 9090`"
- "删除日志文件中所有以 `#` 开头的注释行"
- "在配置文件的特定行之前插入一条新的设置项"
- "从 CSV 文件中提取第 3 列和第 5 列，中间用制表符分隔"
- "去除所有行首行尾的空白字符"

这些任务的共同点是：**不仅要找到，更要修改**。`grep` 只能告诉你"在哪里"，但无法帮你"改什么"。这就是 **sed（Stream Editor，流编辑器）** 的领域。

sed 是 Linux "文本处理三剑客"中的第一位：

```
                        文本处理三剑客
              ┌──────────────┼──────────────┐
              │              │              │
           第 13 章       第 14 章       第 15 章
            sed            awk          工具箱
         （流编辑器）   （模式扫描与     （sort/uniq/
                          处理语言）      cut/tr/xargs...）
              │              │              │
        替换、删除、      按列分析、      排序去重、
        插入、修改        数值计算、      切分转换、
                         格式化报告      批量处理
```

**sed 的核心使命：对文本流进行逐行编辑——替换、删除、插入、修改——然后将结果输出到标准输出（或写回文件）。**

### 1.2 sed 名称的由来与设计哲学

sed 是 **S**tream **Ed**itor 的缩写。它诞生于 1973-1974 年，由贝尔实验室的 Lee E. McMahon 编写，作为 Unix 早期文本编辑器 `ed` 的脚本化替代品。

`ed` 是交互式编辑器，需要人工逐条输入命令。而 sed 将这些命令**写成脚本**，自动批量执行：

```
ed 的工作方式（交互式）：               sed 的工作方式（脚本化）：
─────────────────────────              ─────────────────────────
$ ed file.txt                          $ sed 's/old/new/g' file.txt
> 1,5p      ← 手动输入命令             # 命令写成脚本，一次执行完毕
> s/foo/bar/ ← 手动输入
> w         ← 手动保存
> q         ← 手动退出
```

sed 的设计哲学体现了 Unix 的核心原则：

1. **做好一件事**：sed 只做文本流编辑，不做交互、不做文件管理
2. **管道友好**：sed 从标准输入读取，向标准输出写入，完美融入管道体系
3. **非交互式**：所有编辑指令以脚本形式传入，无人值守运行

### 1.3 sed 能做什么：能力全景

sed 的编辑能力覆盖了文本处理的全部常用操作：

| 操作类型 | sed 命令 | 典型场景 |
|---------|---------|---------|
| **替换（Substitute）** | `s` | 查找并替换文本、格式化数据、脱敏信息 |
| **删除（Delete）** | `d` | 删除注释行、删除空行、删除指定范围的行 |
| **打印（Print）** | `p` | 输出特定行、配合 `-n` 实现精确提取 |
| **追加（Append）** | `a` | 在某行之后添加新内容 |
| **插入（Insert）** | `i` | 在某行之前插入新内容 |
| **修改（Change）** | `c` | 将某行整体替换为新内容 |
| **字符转换（Transliterate）** | `y` | 大小写转换、简繁转换、字符映射 |
| **读写文件** | `r` / `w` | 在指定位置插入文件内容、将匹配行写入文件 |
| **行号输出** | `=` | 显示匹配行的行号 |
| **提前退出** | `q` | 处理到指定行后立即停止，提高效率 |
| **多行处理** | `N` / `P` / `D` | 跨行匹配、段落处理 |
| **保持空间（Hold Space）** | `h` / `H` / `g` / `G` / `x` | 行重排、内容累积、高级变换 |
| **分支跳转** | `:` / `b` / `t` | 条件处理、循环、复杂逻辑 |

### 1.4 sed 与 grep、awk 的关系

```
┌──────────────────────────────────────────────────────────────┐
│                   文本处理三剑客的分工                         │
│                                                              │
│  功能        │  grep        │  sed          │  awk           │
│  ────────────┼──────────────┼───────────────┼────────────────│
│  主要操作    │  搜索/筛选    │  编辑/替换     │  分析/计算     │
│  核心能力    │  找到匹配行   │  修改文本      │  按列/字段处理 │
│  输出        │  匹配的行     │  修改后的全部  │  格式化的报告  │
│             │              │  或选定的行    │               │
│  典型场景    │  "有没有？"   │  "改成什么？"  │  "怎么分析？"  │
│             │  "在哪里？"   │  "删掉哪些？"  │  "怎么算？"   │
│  ────────────┼──────────────┼───────────────┼────────────────│
│  示例        │  grep ERROR  │  sed 's/8080  │  awk '{print  │
│             │  app.log     │  /9090/' cfg   │  $1,$3}' data │
└──────────────────────────────────────────────────────────────┘
```

**三者不是替代关系，而是组合关系。** 一个典型的文本处理流水线通常包含 `grep` 过滤 + `sed` 编辑 + `awk` 分析。例如：

```bash
# 从日志中提取错误信息、脱敏 IP 地址、按错误类型统计
grep "ERROR" /var/log/app.log \
  | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/[REDACTED]/g' \
  | awk '{print $NF}' \
  | sort | uniq -c | sort -rn
```

### 1.5 历史背景：从 ed 到 sed

sed 的血统可以追溯到 Unix 上最早的编辑器 `ed`：

```
1971  ed      — Unix 第一个文本编辑器（Ken Thompson 编写）
              │  命令格式：地址+单字母命令（如 1,5p、s/old/new/）
              │  这个语法设计至今仍是 sed 的核心
              │
1974  sed     — 将 ed 的命令"脚本化"（Lee E. McMahon 编写）
              │  非交互式，从文件或标准输入读取命令，批量执行
              │  核心创新：模式空间（Pattern Space）概念
              │
1986  GNU sed — GNU 项目重写的 sed（最初由 Jay Fenlason 编写）
              │  增加了大量扩展：不区分大小写的 s///I、
              │  s///e（执行替换结果为 Shell 命令）、就地编辑 -i、
              │  扩展正则支持（-E / -r）等
              │
至今          — GNU sed 4.9（Ubuntu 24.04 LTS 默认版本）
```

### 1.6 本章学习目标

完成本章后，你将能够：

- 理解 sed 的**执行模型**：模式空间（Pattern Space）、保持空间（Hold Space）、每次循环的四个阶段
- 熟练编写**地址（Address）**：行号、正则模式、范围、相对地址、`$` 末行
- 掌握 **s 命令的全部标志**：`g`（全局）、`i`（忽略大小写）、`p`（打印替换）、数字（第 N 次匹配）、`e`（执行 Shell 命令）
- 使用 **d/p/a/i/c/y/r/w/q/=** 命令完成日常文本编辑任务
- 运用**保持空间**实现行交换、行重排、段落累积等高级操作
- 理解**多行模式**（N/P/D）与**分支跳转**（b/t）的工作原理
- 使用 `sed -f` 将命令组织为可复用的脚本文件
- 识别并解决 sed 使用中的常见错误：转义问题、地址范围误用、替换目标失效

---

## 2. 核心概念

### 2.1 sed 的执行模型：读取—执行—输出—循环

sed 的工作方式可以用一个四阶段循环来描述。理解这个循环，是掌握 sed 的第一道门槛。

```
┌─────────────────────────────────────────────────────────────────┐
│                     sed 执行循环（Execution Cycle）               │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 阶段 1    │    │ 阶段 2    │    │ 阶段 3    │    │ 阶段 4    │  │
│  │ 读取 Read │───→│ 执行 Exec │───→│ 输出 Print│───→│ 循环 Loop│  │
│  │          │    │          │    │          │    │          │  │
│  │ 从输入流  │    │ 在模式空间│    │ 将模式空间│    │ 读取下一行│  │
│  │ 读取一行  │    │ 上依次执行│    │ 内容输出到│    │（除非 -n）│  │
│  │ 放入模式  │    │ 所有 sed  │    │ 标准输出  │    │ 回到阶段 1│  │
│  │ 空间     │    │ 命令      │    │          │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                                        │
│       │  输入流可以是：                                          │
│       │  · 文件（sed '...' file.txt）                           │
│       │  · 标准输入（echo "hello" | sed '...'）                 │
│       │  · 管道前序命令的输出（grep ... | sed '...'）            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**关键认知：**

1. **sed 是逐行处理的**：每次只读取一行到模式空间，处理完输出后，模式空间被清空，再读下一行
2. **sed 默认自动输出**：除非使用 `-n` 选项，否则每一行在处理后都会自动输出
3. **sed 不修改原文件**：默认情况下，sed 只将结果输出到标准输出，原文件保持不变。使用 `-i` 参数可实现就地编辑（In-place Editing）
4. **命令按顺序执行**：一行读入模式空间后，所有 sed 命令（脚本）按从上到下的顺序依次对该行执行

下面用一个具体例子来感受这个循环：

```bash
# 准备示例文件
cat > /tmp/sed-demo.txt << 'EOF'
apple
banana
cherry
date
elderberry
EOF

# sed 脚本：在第 2 行前插入一行，删除第 4 行，将 "a" 替换为 "X"
sed '2i\--- inserted ---
4d
s/a/X/g' /tmp/sed-demo.txt
```

```
执行过程（逐行追踪）：

第 1 行 "apple" 进入模式空间：
  · 命令 1 "2i\..." → 行号不是 2，不执行
  · 命令 2 "4d" → 行号不是 4，不执行
  · 命令 3 "s/a/X/g" → 替换 "a" 为 "X" → 模式空间变为 "Xpple"
  · 自动输出 → 打印 "Xpple"

第 2 行 "banana" 进入模式空间：
  · 命令 1 "2i\..." → 行号是 2，先输出 "--- inserted ---"
  · 命令 2 "4d" → 行号不是 4，不执行
  · 命令 3 "s/a/X/g" → 替换后 → "bXnXnX"
  · 自动输出 → 打印 "bXnXnX"

... 以此类推

最终输出：
Xpple
--- inserted ---
bXnXnX
cherry
elderberry
```

### 2.2 模式空间与保持空间：sed 的两个工作区

这是 sed 区别于 grep 的最重要设计。sed 维护两块内存区域：

```
┌─────────────────────────────────────────────────────────────────┐
│                    sed 的双缓冲区模型                            │
│                                                                 │
│   模式空间（Pattern Space）              保持空间（Hold Space）   │
│   ┌─────────────────────┐              ┌─────────────────────┐  │
│   │                     │              │                     │  │
│   │  · 每次循环读入一行  │              │  · 初始为空          │  │
│   │  · 所有命令在此执行  │  交换/拷贝   │  · 仅在显式操作时    │  │
│   │  · 循环结束时自动输出│ ←──────────→ │    才发生变化        │  │
│   │  · 输出后被清空      │              │  · 可以跨行保持数据  │  │
│   │                     │              │                     │  │
│   └─────────────────────┘              └─────────────────────┘  │
│                                                                 │
│  保持空间的存在让 sed 可以：                                      │
│  · 记住"上一行"的内容                                            │
│  · 交换两行的位置                                                │
│  · 累积多行内容后一次性处理                                       │
│  · 实现"查找匹配行 → 收集后续行 → 一起处理"的模式                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**模式空间与保持空间的类比：**

| 概念 | 类比 |
|------|------|
| 模式空间 | 工作台——你手头正在处理的那一行 |
| 保持空间 | 抽屉——你暂时存放以备后用的内容 |
| `h` / `H` | 把工作台上的东西放进抽屉（拷贝/追加） |
| `g` / `G` | 从抽屉取出东西放到工作台上（拷贝/追加） |
| `x` | 工作台和抽屉的内容互换 |

详细的保持空间操作将在 3.15 节展开。现在只需记住：**模式空间是默认工作区，保持空间是临时存储区，两者可以互相拷贝、追加、交换。**

### 2.3 sed 的脚本结构：地址 + 命令

每一条 sed 指令的通用格式是：

```
[地址]命令[选项/参数]
[addr]command[options/args]
```

**地址（Address）决定"对哪些行操作"，命令（Command）决定"做什么"。**

```bash
# 结构示例
sed '3d' file.txt          # 地址=3（第 3 行），命令=d（删除）
sed '/error/s/foo/bar/' f  # 地址=/error/（匹配行），命令=s（替换）
sed '1,5p' file.txt        # 地址=1,5（第 1 到第 5 行），命令=p（打印）
```

一条 sed 脚本可以包含多条指令，用分号 `;` 分隔或用多个 `-e` 参数：

```bash
# 分号分隔多条命令
sed '/^#/d; /^$/d; s/foo/bar/g' config.txt

# 多个 -e 参数（等价）
sed -e '/^#/d' -e '/^$/d' -e 's/foo/bar/g' config.txt

# 写入脚本文件（推荐用于复杂脚本）
cat > cleanup.sed << 'EOF'
/^#/d          # 删除注释行
/^$/d          # 删除空行
s/foo/bar/g    # 替换 foo 为 bar
EOF
sed -f cleanup.sed config.txt
```

### 2.4 地址（Address）详解

地址是 sed 的"寻址系统"。它决定了哪些行会执行后续命令。sed 支持五种地址类型。

#### 2.4.1 零地址：不指定地址

如果不指定地址，命令作用于**所有行**：

```bash
sed 's/foo/bar/' file.txt     # 所有行的第一个 foo 都被替换为 bar
sed 'd' file.txt              # 删除所有行（输出为空）
```

#### 2.4.2 单地址：指定某一类行

**行号：**

```bash
# 准备测试文件
cat > /tmp/sed-addr.txt << 'EOF'
line 1: alpha
line 2: beta
line 3: gamma
line 4: delta
line 5: epsilon
line 6: zeta
line 7: eta
line 8: theta
EOF

# 只打印第 3 行
sed -n '3p' /tmp/sed-addr.txt
# 输出：
# line 3: gamma

# 删除第 1 行
sed '1d' /tmp/sed-addr.txt
# 输出：
# line 2: beta
# line 3: gamma
# ...（第 1 行被删除）

# 删除最后一行（$ 表示最后一行）
sed '$d' /tmp/sed-addr.txt
# 输出：
# line 1: alpha
# ...（最后一行被删除）
```

**正则模式 /pattern/：**

```bash
# 打印包含 "ta" 的行
sed -n '/ta/p' /tmp/sed-addr.txt
# 输出：
# line 4: delta
# line 6: zeta
# line 7: eta
# line 8: theta

# 删除包含 "alpha" 的行
sed '/alpha/d' /tmp/sed-addr.txt
# 输出：除 line 1 外的所有行
```

**特殊符号 `$`（最后一行）：**

```bash
# 在最后一行后追加内容
sed '$a\--- END OF FILE ---' /tmp/sed-addr.txt
# 输出：
# line 1: alpha
# ...
# line 8: theta
# --- END OF FILE ---
```

#### 2.4.3 行号范围：addr1,addr2

从第 addr1 行开始到第 addr2 行结束（包含两端）：

```bash
# 打印第 3 行到第 6 行
sed -n '3,6p' /tmp/sed-addr.txt
# 输出：
# line 3: gamma
# line 4: delta
# line 5: epsilon
# line 6: zeta

# 删除第 1 行到第 3 行
sed '1,3d' /tmp/sed-addr.txt
# 输出：从 line 4 开始
```

#### 2.4.4 正则范围：/pattern1/,/pattern2/

从匹配 pattern1 的行开始，到匹配 pattern2 的行结束：

```bash
# 打印从包含 "gamma" 的行到包含 "zeta" 的行
sed -n '/gamma/,/zeta/p' /tmp/sed-addr.txt
# 输出：
# line 3: gamma
# line 4: delta
# line 5: epsilon
# line 6: zeta

# 实用案例：提取 XML/HTML 中某个标签的内容
cat > /tmp/sed-xml.txt << 'EOF'
before
<block>
内容第一行
内容第二行
内容第三行
</block>
after
EOF

sed -n '/<block>/,/<\/block>/p' /tmp/sed-xml.txt
# 输出：
# <block>
# 内容第一行
# 内容第二行
# 内容第三行
# </block>
```

**正则范围的"嵌套"行为：** 如果结束模式在开始模式之前就被匹配，或者是打开后一直没找到结束模式，sed 有特定的处理规则：

```bash
# 演示：结束模式在多个段落中的行为
cat > /tmp/sed-range.txt << 'EOF'
START
  block 1 - line 1
  block 1 - line 2
END
middle text
START
  block 2 - line 1
  block 2 - line 2
END
trailing text
EOF

# 提取 START 到 END 的内容（两个段落都会被提取）
sed -n '/START/,/END/p' /tmp/sed-range.txt
# 输出：
# START
#   block 1 - line 1
#   block 1 - line 2
# END
# START
#   block 2 - line 1
#   block 2 - line 2
# END
```

#### 2.4.5 相对地址（GNU 扩展）

GNU sed 支持相对寻址和步进寻址，这些是 POSIX 标准之外的扩展：

```bash
# addr,+N：从 addr 开始的 N 行（含 addr 行）
sed -n '3,+2p' /tmp/sed-addr.txt
# 输出：
# line 3: gamma
# line 4: delta
# line 5: epsilon
# （第 3 行 + 后续 2 行 = 共 3 行）

# addr,~N：从 addr 开始直到行号为 N 的倍数的行为止
# （较少使用，但有其应用场景）

# FIRST~STEP：从第 FIRST 行开始，每隔 STEP 行匹配一次（GNU 扩展，常用！）
sed -n '2~2p' /tmp/sed-addr.txt
# 输出：
# line 2: beta
# line 4: delta
# line 6: zeta
# line 8: theta
# （打印所有偶数行）

sed -n '1~3p' /tmp/sed-addr.txt
# 输出：
# line 1: alpha
# line 4: delta
# line 7: eta
# （第 1, 4, 7 行，每隔 3 行）
```

**地址总结表：**

| 地址形式 | 含义 | 示例 | 说明 |
|---------|------|------|------|
| 无 | 所有行 | `sed 's/a/b/'` | 不加地址作用于每一行 |
| `N` | 第 N 行 | `sed '3d'` | 行号从 1 开始 |
| `$` | 最后一行 | `sed '$a\END'` | 特殊符号，表示末行 |
| `/regex/` | 匹配正则的行 | `sed '/error/d'` | 使用 BRE 正则引擎（默认） |
| `N,M` | 第 N 到第 M 行 | `sed '3,6d'` | 包含 N 和 M |
| `/re1/,/re2/` | 从 re1 匹配行到 re2 匹配行 | `sed '/start/,/end/p'` | 范围可能在文件中多次出现 |
| `N,+M` | 第 N 行及后续 M 行 | `sed '3,+2d'` | GNU 扩展 |
| `N~STEP` | 从第 N 行起每隔 STEP 行 | `sed '1~2p'` | GNU 扩展（奇偶行选择） |
| `0,/regex/` | 从第 1 行到第一个匹配 regex 的行 | `sed '0,/BEGIN/d'` | GNU 扩展（与 `1,/re/` 不同，可匹配第 1 行） |
| `addr!` | 地址取反 | `sed '/^#/!s/foo/bar/'` | 非匹配行才执行命令 |

### 2.5 sed 的正则引擎：BRE 还是 ERE？

sed 的默认正则引擎是 **BRE（Basic Regular Expression）**，这与 `grep` 的默认模式相同。这意味着 `+`、`?`、`|`、`()`、`{}` 需要用 `\` 转义才能作为元字符使用。

```bash
# sed 默认使用 BRE
echo "abc123def" | sed 's/[0-9]\+/NUMBERS/'
# 输出：abcNUMBERSdef
# 注意：+ 需要转义为 \+（BRE 语法）

# 使用 -E（或 -r）启用 ERE（Extended Regular Expression）
echo "abc123def" | sed -E 's/[0-9]+/NUMBERS/'
# 输出：abcNUMBERSdef
# 使用 -E 后，+ 直接生效，更自然
```

**sed 中 -E 与 -r 的关系：** `-E` 和 `-r` 是同一个选项的两种写法。`-r` 是 GNU sed 的历史选项，`-E` 是 POSIX 标准选项。在 GNU sed 4.9 中两者完全等价，建议使用 `-E`（更符合 POSIX 标准）。

**BRE 与 -E 的关键差异速查：**

| 语法元素 | sed（BRE，默认） | sed -E（ERE） |
|---------|-----------------|--------------|
| 分组 | `\(...\)` | `(...)` |
| 或 | `\|` | `\|` |
| 一个或多个 | `\+` | `+` |
| 零个或一个 | `\?` | `?` |
| 指定重复次数 | `\{n,m\}` | `{n,m}` |
| 单词边界 | `\b`（GNU 扩展） | `\b`（GNU 扩展） |
| 反向引用 | `\1`, `\2`, ... | `\1`, `\2`, ...（同 BRE） |

**建议：** 日常使用中，使用 `sed -E` 可以避免大量反斜杠转义的困扰。本章的大部分示例将使用 `-E`，仅在需要说明 BRE 特有语法时显式使用默认模式。

### 2.6 sed 的调用方式

```bash
# 方式 1：命令行直接传入命令（最常用）
sed [选项] '命令' [文件...]
sed 's/old/new/' file.txt

# 方式 2：从脚本文件读取命令（复杂脚本推荐）
sed [选项] -f script.sed [文件...]
sed -f cleanup.sed file.txt

# 方式 3：从标准输入读取数据
command | sed [选项] '命令'
echo "hello world" | sed 's/world/sed/'

# 方式 4：多个文件连续处理
sed 's/old/new/g' file1.txt file2.txt file3.txt
# sed 将三个文件视为一个连续的输入流，行号跨文件连续编号
```

**常用选项：**

| 选项 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-n` | 抑制（Suppress）自动输出。只有在命令中显式使用 `p` 或 `=` 等时才输出 | 可选 | 自动输出每一行 |
| `-e script` | 添加一条 sed 命令。多个 `-e` 可串联多条命令 | 可选 | 第一位置参数即为命令 |
| `-f script-file` | 从文件中读取 sed 命令 | 可选 | 从命令行读取 |
| `-E`（或 `-r`） | 使用扩展正则表达式（ERE） | 可选 | 使用 BRE |
| `-i[SUFFIX]` | 就地编辑（In-place）。如果指定 SUFFIX，则创建备份文件 | 可选 | 输出到标准输出 |
| `--follow-symlinks` | 搭配 `-i` 使用时，跟踪符号链接（而非替换链接本身） | 可选 | 替换符号链接本身 |
| `-z` | 以 NUL 字符作为行分隔符（而非换行符） | 可选 | 换行为分隔符 |
| `--debug` | 显示 sed 脚本执行的调试信息（GNU sed 4.6+） | 可选 | 不显示 |

---

## 3. 命令详解

### 3.1 s — 替换（Substitute）

`s` 是 sed 中使用频率最高的命令，占据日常 sed 使用的 80% 以上。

#### 3.1.1 基本语法

```
[地址]s/正则表达式/替换文本/[标志]
[addr]s/regex/replacement/[flags]
```

**分隔符不一定是 `/`：** 当正则表达式或替换文本中包含大量 `/` 时，可以换成别的字符（`#`、`|`、`,`、`@` 等都行）。sed 使用 `s` 后面的第一个字符作为分隔符：

```bash
# 当替换内容包含路径时，使用 # 或 | 作为分隔符更清晰
sed 's/\/usr\/local\/bin/\/opt\/bin/' file.txt    # 反斜杠地狱
sed 's#/usr/local/bin#/opt/bin#' file.txt          # 清晰
sed 's|/usr/local/bin|/opt/bin|' file.txt          # 同样清晰
```

#### 3.1.2 基本替换示例

```bash
# 准备测试文本
cat > /tmp/sed-s-test.txt << 'EOF'
The quick brown fox jumps over the lazy dog.
The fox is quick and the dog is lazy.
Fox and Dog are both animals.
EOF

# 基本替换：将每行第一个 "fox" 替换为 "cat"
sed 's/fox/cat/' /tmp/sed-s-test.txt
# 输出：
# The quick brown cat jumps over the lazy dog.
# The cat is quick and the dog is lazy.
# Fox and Dog are both animals.
# 注意：第 3 行的 "Fox"（大写）没有被替换，sed 默认区分大小写

# 全局替换：将每行所有的 "the" 替换为 "THE"
sed 's/the/THE/g' /tmp/sed-s-test.txt
# 输出：
# THE quick brown fox jumps over THE lazy dog.
# THE fox is quick and THE dog is lazy.
# Fox and Dog are both animals.
```

#### 3.1.3 替换标志（Flags）

`s` 命令支持以下标志：

| 标志 | 说明 | 示例 |
|------|------|------|
| `g` | 全局替换（Global）——替换行内所有匹配，而非仅第一个 | `s/foo/bar/g` |
| `i` | 忽略大小写（Ignore case）——GNU 扩展 | `s/foo/bar/i` |
| `p` | 当替换成功时，打印该行（通常搭配 `-n`） | `s/foo/bar/p` |
| `数字` | 仅替换第 N 次匹配 | `s/foo/bar/2` |
| `e` | 将模式空间的替换结果作为 Shell 命令执行——GNU 扩展 | `s/^/echo /e` |
| `w 文件` | 将替换成功的行写入指定文件 | `s/foo/bar/w /tmp/out.txt` |
| `m` | 多行模式（Multi-line）——GNU 扩展，控制 `^` 和 `$` 的行为 | `s/^/>>/mg` |

**标志 `g`（global）——全局替换：**

```bash
cat > /tmp/sed-flags.txt << 'EOF'
one one one one
two two
three
EOF

# 不加 g：只替换每行的第一个匹配
sed 's/one/ONE/' /tmp/sed-flags.txt
# 输出：
# ONE one one one
# two two
# three

# 加 g：替换每行的所有匹配
sed 's/one/ONE/g' /tmp/sed-flags.txt
# 输出：
# ONE ONE ONE ONE
# two two
# three
```

**标志 `i`（ignore case）——忽略大小写（GNU 扩展）：**

```bash
# 替换 fox，不区分大小写
sed 's/fox/cat/gi' /tmp/sed-s-test.txt
# 输出：
# The quick brown cat jumps over the lazy dog.
# The cat is quick and the dog is lazy.
# cat and Dog are both animals.
# 注意：第 3 行的 "Fox" 被替换为 "cat"（大小写被忽略）
```

**标志 `p`（print）——打印被替换的行：**

```bash
# 配合 -n：只打印发生了替换的行
sed -n 's/fox/cat/p' /tmp/sed-s-test.txt
# 输出：
# The quick brown cat jumps over the lazy dog.
# The cat is quick and the dog is lazy.
# （第 3 行不包含 "fox"，所以不打印）
```

**标志 `数字`——仅替换第 N 次出现：**

```bash
# 只替换每行的第 1 次匹配（默认行为，等价于 s/one/ONE/）
sed 's/one/ONE/1' /tmp/sed-flags.txt
# 输出：
# ONE one one one

# 只替换每行的第 2 次匹配
sed 's/one/ONE/2' /tmp/sed-flags.txt
# 输出：
# one ONE one one

# 只替换每行的第 3 次匹配
sed 's/one/ONE/3' /tmp/sed-flags.txt
# 输出：
# one one ONE one
```

**标志 `e`（execute）——将替换结果作为 Shell 命令执行（GNU 扩展，慎用）：**

```bash
# 将日期字符串替换为命令并执行
echo "Today is DATE" | sed 's/DATE/date/e'
# 输出：
# Today is 2026年07月29日 ...（实际执行了 date 命令）

# 实用示例：计算并替换
echo "Result: EXPR" | sed 's/EXPR/echo $((3+4))/e'
# 输出：
# Result: 7
```

**`w` 标志——将替换成功的行写入文件：**

```bash
# 将替换成功的行写入 /tmp/sed-changed.txt
sed 's/fox/cat/w /tmp/sed-changed.txt' /tmp/sed-s-test.txt
# 屏幕输出（正常）：
# The quick brown cat jumps over the lazy dog.
# The cat is quick and the dog is lazy.
# Fox and Dog are both animals.
#
# 同时，/tmp/sed-changed.txt 中写入了前两行（替换成功的行）
cat /tmp/sed-changed.txt
# 输出：
# The quick brown cat jumps over the lazy dog.
# The cat is quick and the dog is lazy.
```

#### 3.1.4 反向引用（Backreference）

在替换文本中，`\1` 到 `\9` 引用正则表达式中对应捕获分组匹配到的内容。`&` 引用整个匹配的文本。

```bash
# 准备测试
cat > /tmp/sed-backref.txt << 'EOF'
John Smith
Alice Johnson
Bob Williams
EOF

# 交换名和姓："FirstName LastName" → "LastName, FirstName"
sed -E 's/(\w+) (\w+)/\2, \1/' /tmp/sed-backref.txt
# 输出：
# Smith, John
# Johnson, Alice
# Williams, Bob

# & 引用整个匹配的文本：为所有单词加上括号
sed -E 's/\w+/[&]/g' /tmp/sed-backref.txt
# 输出：
# [John] [Smith]
# [Alice] [Johnson]
# [Bob] [Williams]

# 实用案例：给 IPv4 地址加上引号
echo "server 192.168.1.100" | sed -E 's/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/"\1"/'
# 输出：
# server "192.168.1.100"

# 实用案例：给 Markdown 链接加上 target 属性
echo '[link](https://example.com)' | sed -E 's/\[([^]]+)\]\(([^)]+)\)/<a href="\2">\1<\/a>/'
# 输出：
# <a href="https://example.com">link</a>
```

#### 3.1.5 替换中的特殊字符

| 字符 | 在替换文本中的含义 |
|------|-------------------|
| `&` | 整个匹配的文本 |
| `\1` ~ `\9` | 第 1 到第 9 个捕获分组的内容 |
| `\n` | 换行符（仅在特定上下文中有效） |
| `\\` | 字面量的反斜杠 |
| `\/` | 字面量的斜杠（当 `/` 用作分隔符时） |

#### 3.1.6 s 命令的常见变体

```bash
# 在每行开头添加内容（利用 ^ 匹配行首，替换为前缀+匹配）
sed 's/^/>> /' file.txt
# 每行前面加上 ">> "

# 在每行末尾添加内容
sed 's/$/ END/' file.txt
# 每行末尾加上 " END"

# 删除行尾空白
sed 's/[ \t]*$//' file.txt

# 删除行首空白
sed 's/^[ \t]*//' file.txt

# 压缩多个空格为一个
echo "a    b     c" | sed -E 's/ +/ /g'
# 输出：a b c

# 给非空行添加行号前缀
sed -E '/./s/^/  /' file.txt
# 每一行前加两个空格（提升缩进）
```

### 3.2 d — 删除（Delete）

`d` 命令删除匹配的行。删除后立即开始下一个循环（后续命令不再对该行执行）。

```bash
# 准备测试文件
seq 1 10 > /tmp/sed-numbers.txt
cat /tmp/sed-numbers.txt
# 输出：1 到 10，每行一个数字

# 删除第 3 行
sed '3d' /tmp/sed-numbers.txt
# 输出：1, 2, 4, 5, 6, 7, 8, 9, 10

# 删除第 3 行到第 7 行
sed '3,7d' /tmp/sed-numbers.txt
# 输出：1, 2, 8, 9, 10

# 删除包含 "5" 的行
sed '/5/d' /tmp/sed-numbers.txt
# 输出：1, 2, 3, 4, 6, 7, 8, 9, 10

# 删除空行（经典用法）
sed '/^$/d' file.txt

# 删除以 # 开头的注释行（另一个经典用法）
sed '/^#/d' config.conf

# 同时删除注释行和空行
sed '/^#/d; /^$/d' config.conf
# 等价于
sed -E '/^(#|$)/d' config.conf

# 删除从第 5 行到最后一行
sed '5,$d' /tmp/sed-numbers.txt
# 输出：1, 2, 3, 4

# 删除从包含 "3" 的行到包含 "7" 的行
sed '/3/,/7/d' /tmp/sed-numbers.txt
# 输出：1, 2, 8, 9, 10
```

### 3.3 p — 打印（Print）

`p` 命令显式打印模式空间的内容。通常与 `-n` 选项配合使用，因为 `-n` 抑制了默认输出，这样 `p` 就精确控制了"打印哪些行"。

```bash
# 打印第 5 行
sed -n '5p' /tmp/sed-numbers.txt
# 输出：5

# 打印第 1 到第 5 行
sed -n '1,5p' /tmp/sed-numbers.txt
# 输出：1, 2, 3, 4, 5

# 不指定 -n：每行默认打印一次，p 再打印一次 → 匹配行打印两次
sed '/5/p' /tmp/sed-numbers.txt
# 输出：
# 1
# 2
# ...
# 5    ← 自动输出
# 5    ← p 命令输出（第 5 行出现两次！）
# 6
# ...

# 打印包含 "error" 的行（模拟 grep）
sed -n '/error/p' /var/log/syslog

# 打印行号范围：第 10 行到第 20 行
sed -n '10,20p' large_file.txt

# 打印不匹配的行（与 -n 结合实现反向选择）
sed -n '/^#/!p' config.conf
# 打印所有不以 # 开头的行
```

`p` 与 `-n` 的关系总结：

| 组合 | 行为 |
|------|------|
| `sed '3p'` | 第 3 行打印两次（自动输出 + p），其余打印一次 |
| `sed -n '3p'` | 仅打印第 3 行，其余不输出 |
| `sed -n '3,5p'` | 仅打印第 3-5 行 |

### 3.4 a — 追加（Append）

`a` 命令在匹配行的**之后**追加新文本。

```bash
# 语法：sed '[地址]a\新文本'

# 在第 3 行后追加一行
seq 1 5 | sed '3a\--- inserted after line 3 ---'
# 输出：
# 1
# 2
# 3
# --- inserted after line 3 ---
# 4
# 5

# 在匹配行后追加多行（每行末尾用 \ 续行，最后一行除外）
seq 1 5 | sed '3a\
line A\
line B\
line C'
# 输出：
# 1
# 2
# 3
# line A
# line B
# line C
# 4
# 5

# 在文件末尾追加（$ 表示最后一行）
seq 1 5 | sed '$a\--- END ---'
# 输出：
# 1
# 2
# 3
# 4
# 5
# --- END ---

# 在包含特定文本的行后追加
cat > /tmp/sed-config.txt << 'EOF'
[server]
host = localhost
port = 8080
[database]
host = db.local
EOF

sed '/port = 8080/a\max_connections = 100' /tmp/sed-config.txt
# 输出：
# [server]
# host = localhost
# port = 8080
# max_connections = 100
# [database]
# host = db.local
```

### 3.5 i — 插入（Insert）

`i` 命令在匹配行的**之前**插入新文本。语法与 `a` 完全相同，只是插入位置在匹配行之前。

```bash
# 在第 3 行前插入一行
seq 1 5 | sed '3i\--- inserted before line 3 ---'
# 输出：
# 1
# 2
# --- inserted before line 3 ---
# 3
# 4
# 5

# 在文件开头插入（第 1 行之前）
seq 1 5 | sed '1i\--- HEADER ---'
# 输出：
# --- HEADER ---
# 1
# 2
# 3
# 4
# 5

# 在包含特定模式的行前插入
sed '/\[database\]/i\
# Database configuration start' /tmp/sed-config.txt
# 输出：
# [server]
# host = localhost
# port = 8080
# # Database configuration start
# [database]
# host = db.local
```

**a、i、c 的现代语法（GNU sed 扩展）：**

在 GNU sed 中，`a`、`i`、`c` 也支持更简洁的内联语法：

```bash
# 传统语法（需要反斜杠换行）
sed '/pattern/a\new line'

# GNU sed 扩展语法（一行内完成）
sed '/pattern/a new line'   # 注意 a 后面有空格
```

两种语法在 GNU sed 中都有效，但传统语法（反斜杠）具有更好的可移植性。

### 3.6 c — 修改（Change）

`c` 命令用新文本**整体替换**匹配的行。与 `s` 不同，`c` 替换的是整行，而非行内部分。

```bash
# 将第 3 行替换为新内容
seq 1 5 | sed '3c\REPLACED LINE'
# 输出：
# 1
# 2
# REPLACED LINE
# 4
# 5

# 替换匹配特定模式的行
sed '/port = 8080/c\port = 9090  # changed' /tmp/sed-config.txt
# 输出：
# [server]
# host = localhost
# port = 9090  # changed
# [database]
# host = db.local

# 将第 2 到第 4 行替换为一行（注意：范围被替换为一行！）
seq 1 5 | sed '2,4c\--- range replaced ---'
# 输出：
# 1
# --- range replaced ---
# 5
# 注意：第 2、3、4 行被整体替换为一整行！

# c 的范围行为与 s 完全不同：
seq 1 5 | sed '2,4s/.*/REPLACED/'
# s 作用于每一行独立处理：
# 1
# REPLACED  ← 第 2 行被替换
# REPLACED  ← 第 3 行被替换
# REPLACED  ← 第 4 行被替换
# 5
```

### 3.7 y — 字符转换（Transliterate）

`y` 命令进行**逐字符的一对一替换**，类似于 `tr` 命令。源字符集和目标字符集必须等长。

```bash
# 语法：sed '[地址]y/源字符集/目标字符集/'

# 大小写转换
echo "Hello World" | sed 'y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/'
# 输出：HELLO WORLD

echo "HELLO WORLD" | sed 'y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/'
# 输出：hello world

# 实用案例：ROT13 加密（字母旋转 13 位）
echo "Hello World" | sed 'y/abcdefghijklmnopqrstuvwxyz/nopqrstuvwxyzabcdefghijklm/'
# 输出：Uryyb Jbeyq
# 再次 ROT13 恢复原文
echo "Uryyb Jbeyq" | sed 'y/abcdefghijklmnopqrstuvwxyz/nopqrstuvwxyzabcdefghijklm/'
# 输出：Hello World
# （但大小写需要分开处理）

# 数字转换：将 0-9 转换为 a-j
echo "12345" | sed 'y/0123456789/abcdefghij/'
# 输出：bcdef

# 删除特定字符的变通：y 不支持删除，但可以配合 s
# y 不支持正则，它是逐字面量字符的映射
```

### 3.8 = — 行号（Line Number）

`=` 命令打印匹配行的行号。行号打印在单独一行（在匹配行之前）。

```bash
# 显示匹配行的行号
sed -n '/beta/=p' /tmp/sed-addr.txt
# 输出：
# 2          ← 行号
# line 2: beta  ← 匹配行内容

# 为整个文件添加行号（类似 cat -n）
sed '=' /tmp/sed-addr.txt | sed 'N; s/\n/\t/'
# 输出：
# 1	line 1: alpha
# 2	line 2: beta
# 3	line 3: gamma
# ...（行号后跟制表符和内容）

# 只显示文件的总行数（等价于 wc -l）
sed -n '$=' file.txt
```

### 3.9 n — 读取下一行（Next）

`n` 命令读取输入的下一行到模式空间，**替换**当前模式空间的内容（而非追加）。然后从 `n` 命令之后继续执行剩余命令。

```bash
cat > /tmp/sed-n-test.txt << 'EOF'
Header: Config
Value: 100
Header: Timeout
Value: 30
Header: Retry
Value: 3
EOF

# 打印 Header 行后面的 Value 行
sed -n '/Header:/{n;p;}' /tmp/sed-n-test.txt
# 输出：
# Value: 100
# Value: 30
# Value: 3
# 解释：匹配 "Header:" 行 → 执行 {n;p;} → n 读入下一行 → p 打印它

# 删除匹配行和它的下一行（如删除 Header 和它后面的 Value）
sed '/Header:/{n;d;}' /tmp/sed-n-test.txt
# 输出：
# Header: Config
# Header: Timeout
# Header: Retry

# 在偶数行后追加一个空行
seq 1 6 | sed 'n;G'
# 输出：
# 1
# 2
#
# 3
# 4
#
# 5
# 6
#
# 解释：n 使模式空间交替为奇/偶行，G 在偶数行后追加空行
```

### 3.10 r — 从文件读取（Read File）

`r` 命令在匹配行之后读取并插入一个文件的内容。

```bash
# 准备一个模板文件
cat > /tmp/sed-header.txt << 'EOF'
=============================
  Document Header
=============================
EOF

echo -e "Chapter 1\nChapter 2\nChapter 3" > /tmp/sed-content.txt

# 在第 1 行之后插入 header 文件
sed '1r /tmp/sed-header.txt' /tmp/sed-content.txt
# 输出：
# Chapter 1
# =============================
#   Document Header
# =============================
# Chapter 2
# Chapter 3

# 在文件末尾插入 footer
cat > /tmp/sed-footer.txt << 'EOF'
=============================
  End of Document
=============================
EOF

sed '$r /tmp/sed-footer.txt' /tmp/sed-content.txt
# 输出：content + footer

# 在匹配行后插入模板
sed '/Chapter 2/r /tmp/sed-header.txt' /tmp/sed-content.txt
# 输出：
# Chapter 1
# Chapter 2
# =============================
#   Document Header
# =============================
# Chapter 3
```

### 3.11 w — 写入文件（Write File）

`w` 命令将匹配行写入指定文件（与 `s` 命令的 `w` 标志不同，这是独立的 `w` 命令）。

```bash
# 将第 1 到第 5 行写入单独的文件
sed -n '1,5w /tmp/sed-first5.txt' /etc/passwd
# -n 抑制自动输出，w 将行写入文件
cat /tmp/sed-first5.txt
# 输出：/etc/passwd 的前 5 行

# 将包含 "ERROR" 的行写入错误日志
sed -n '/ERROR/w /tmp/errors.log' /var/log/syslog

# 将注释行和非注释行分开写入不同文件
sed -n '/^#/w /tmp/comments.txt; /^#/!w /tmp/active.txt' config.conf
# 注释行写入 comments.txt，非注释行写入 active.txt
```

### 3.12 q — 退出（Quit）

`q` 命令使 sed 在处理完当前行后立即退出，不再读取后续行。对于大文件，`q` 可以大幅提高效率。

```bash
# 只处理前 10 行（等价于 head -n 10，但更灵活）
sed '10q' /var/log/syslog
# 输出：文件的前 10 行，然后 sed 退出

# 打印前 5 行后退出
sed '5q' /tmp/sed-numbers.txt
# 输出：1, 2, 3, 4, 5

# 打印到第一个匹配行，然后退出
sed '/error/q' /var/log/syslog
# 输出从第 1 行到第一个包含 "error" 的行（含该行），然后退出

# 删除前 N-1 行，只留最后一行（用 q 和反向思维）
# 不直接用 q，而是用 $!d（删除所有非最后行）
sed '$!d' file.txt
# 等效于 tail -n 1
```

### 3.13 分组命令 `{ }` —— 对同一地址执行多条命令

当多个命令针对同一个地址时，可以用 `{ }` 将它们分组，避免重复书写地址。

```bash
# 不使用分组：每次都要写地址
sed -n '/error/p' app.log
sed -n '/error/=p' app.log

# 使用分组：对匹配行执行多条命令
sed -n '/error/{
    =
    p
}' app.log
# 对匹配 "error" 的行，先打印行号，再打印内容

# 复杂示例：对行范围执行多条操作
sed '3,8{
    /^#/d     # 在 3-8 行中删除注释行
    s/foo/bar/g  # 在 3-8 行中替换
    /^$/d     # 在 3-8 行中删除空行
}' config.conf
```

### 3.14 保持空间命令：h、H、g、G、x

保持空间（Hold Space）是 sed 的第二个内存缓冲区。以下五个命令操作保持空间：

| 命令 | 全称 | 功能 | 对目标的影响 |
|------|------|------|-------------|
| `h` | hold | 将模式空间**拷贝**到保持空间 | 覆盖保持空间原内容 |
| `H` | Hold（追加） | 将模式空间**追加**到保持空间 | 在保持空间末尾加换行符再追加 |
| `g` | get | 将保持空间**拷贝**到模式空间 | 覆盖模式空间原内容 |
| `G` | Get（追加） | 将保持空间**追加**到模式空间 | 在模式空间末尾加换行符再追加 |
| `x` | eXchange | **交换**模式空间和保持空间 | 两者互换内容 |

#### 3.14.1 图解保持空间操作

```
初始状态（以文件 line1, line2, line3 为例，处理到 line2）：

模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ line2    │      │ （空）    │
└──────────┘      └──────────┘

执行 h：
模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ line2    │  h   │ line2    │  ← 覆盖
└──────────┘      └──────────┘

执行 H（假设保持空间已有 "line1"）：
模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ line2    │  H   │ line1    │  ← 追加，中间自动加 \n
└──────────┘      │ line2    │
                  └──────────┘

执行 g（假设保持空间有 "SAVED"）：
模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ SAVED    │  g   │ SAVED    │  ← 覆盖模式空间
└──────────┘      └──────────┘

执行 G（假设保持空间有 "SAVED"，模式空间有 "CURRENT"）：
模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ CURRENT  │  G   │ SAVED    │
│ SAVED    │      └──────────┘  ← 追加到模式空间，中间加 \n
└──────────┘

执行 x：
模式空间：         保持空间：
┌──────────┐      ┌──────────┐
│ SAVED    │  x   │ CURRENT  │  ← 互相交换
└──────────┘      └──────────┘
```

#### 3.14.2 经典示例：行反转（tac 模拟）

```bash
# 使用保持空间将文件行反转（第一行变最后一行）
cat > /tmp/sed-tac.txt << 'EOF'
alpha
beta
gamma
delta
EOF

# sed tac：通过 G 累积行，最后 $!d 删除中间输出
sed '1!G;h;$!d' /tmp/sed-tac.txt
# 输出：
# delta
# gamma
# beta
# alpha
```

**逐行拆解执行过程：**

```
第 1 行 "alpha" 进入模式空间：
  1!G → 第 1 行不执行 G
  h   → 保持空间 = "alpha"
  $!d → 不是最后一行，删除（不输出）

第 2 行 "beta" 进入模式空间：
  1!G → 不是第 1 行，执行 G → 模式空间 = "beta\nalpha"
  h   → 保持空间 = "beta\nalpha"
  $!d → 不是最后一行，删除

第 3 行 "gamma" 进入模式空间：
  1!G → 模式空间 = "gamma\nbeta\nalpha"
  h   → 保持空间 = "gamma\nbeta\nalpha"
  $!d → 删除

第 4 行 "delta"（最后一行）进入模式空间：
  1!G → 模式空间 = "delta\ngamma\nbeta\nalpha"
  h   → 保持空间 = "delta\ngamma\nbeta\nalpha"
  $!d → 是最后一行，不执行 d → 输出模式空间
```

#### 3.14.3 经典示例：合并相邻行

```bash
# 将每两行合并为一行（用空格分隔）
seq 1 6 | sed 'N; s/\n/ /'
# 输出：
# 1 2
# 3 4
# 5 6

# 将相邻行合并（使用保持空间方法）
seq 1 6 | sed '1~2h; 1~2!{H;g;s/\n/ --> /;}'
# 输出：
# 1 --> 2
# 3 --> 4
# 5 --> 6
```

#### 3.14.4 经典示例：在段落间插入空行

```bash
# 给非空行与空行之间的段落添加空行分隔
# （实际上，更常见的需求是压缩连续空行为单个空行）
cat > /tmp/sed-paragraph.txt << 'EOF'
line 1
line 2
line 3

line 4
line 5

line 6
EOF

# 在段落前插入空行（使用 x 交换来检测段落边界）
sed 'x; /^$/!{x;G;x;}; x' /tmp/sed-paragraph.txt
# （这是经典的 sed 段落格式化技巧）
```

### 3.15 多行模式命令：N、P、D

这三个命令操作模式空间中的多行内容（包含 `\n` 分隔符）。

| 命令 | 全称 | 功能 |
|------|------|------|
| `N` | Next（追加） | 将下一行追加到模式空间（用 `\n` 分隔）。与 `n` 不同，`N` 是追加而非替换 |
| `P` | Print（首行） | 打印模式空间中第一个 `\n` 之前的内容 |
| `D` | Delete（首行） | 删除模式空间中第一个 `\n` 之前的内容，然后**不读取新行**，从剩余内容开始新的循环 |

**`D` 的特殊行为** 是多行模式的核心：它删除首行后，如果模式空间还有内容，就**不读取新行而直接开始新的循环**（从第一条命令重新执行）。这使得 `D` 可以实现对多行模式空间的逐行处理。

#### 3.15.1 N 与 n 的关键区别

```
┌─────────────────────────────────────────────────────────────┐
│                     n  vs  N  的区别                         │
│                                                             │
│  命令    │  操作                                │  模式空间  │
│  ────────┼──────────────────────────────────────┼────────────│
│  n       │  读取下一行，覆盖模式空间               │  替换      │
│         │  旧内容被丢弃                          │           │
│  ────────┼──────────────────────────────────────┼────────────│
│  N       │  读取下一行，追加到模式空间             │  追加      │
│         │  新旧内容用 \n 分隔，旧内容保留           │           │
│                                                             │
│  示例（处理 line1, line2, line3）：                          │
│                                                             │
│  sed 'n'        → 第 1 行被下一行替换，原 line1 丢失           │
│                    输出：line2, line4, ...（跳行输出）         │
│                                                             │
│  sed 'N'        → line1\nline2 合并为一行，作为整体输出        │
│  s/\n/ /       → "line1 line2"                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.15.2 N 的典型用例

```bash
# 将连续两行合并为一行
seq 1 6 | sed 'N; s/\n/ -> /'
# 输出：
# 1 -> 2
# 3 -> 4
# 5 -> 6

# 当行末是反斜杠时，与下一行连接（处理续行符 \）
cat > /tmp/sed-continuation.txt << 'EOF'
line 1 \
continued on line 2
line 3
line 4 \
continued on line 5
EOF

sed -E ':loop; /\\$/{N; s/\\\n//; b loop}' /tmp/sed-continuation.txt
# 输出：
# line 1 continued on line 2
# line 3
# line 4 continued on line 5

# 查找跨行的模式（如 HTML 标签跨两行的情况）
cat > /tmp/sed-multiline.txt << 'EOF'
This is <em
>important</em> text.
Normal text.
Also <em>highlighted</em> here.
EOF

# 将 <em\n> 合并为 <em>
sed -E ':loop; /<em$/{N; s/<em\n>/<em>/; b loop}' /tmp/sed-multiline.txt
# 此处示例简化处理，实际 HTML 多行标签处理更复杂
```

#### 3.15.3 P 和 D 的协同工作

```bash
# 打印模式空间的第一行（到 \n 为止）
cat > /tmp/sed-pd-test.txt << 'EOF'
alpha
beta
gamma
delta
EOF

# N 读取两行后，P 只打印第一行，D 删除第一行
sed 'N;P;D' /tmp/sed-pd-test.txt
# 输出：
# alpha
# beta
# gamma
# delta
# 看起来和 cat 一样？因为每一轮循环都是：N 合并两行 → P 打印首行 → D 删除首行
# 然后不读新行，下一轮继续处理剩余的第二行
```

**更实用的 P/D 示例：处理段落**

```bash
# 删除所有空行，但保留段落之间一个空行（经典技巧）
cat > /tmp/sed-blank.txt << 'EOF'
line 1
line 2


line 3


line 4
line 5
EOF

# 将多个连续空行压缩为一个
sed '$!N; /^\n$/!P; D' /tmp/sed-blank.txt
# 输出：
# line 1
# line 2
#
# line 3
#
# line 4
# line 5
```

### 3.16 分支与跳转：:、b、t

sed 的分支命令使其具备了基本的流程控制能力。

| 命令 | 全称 | 功能 |
|------|------|------|
| `:label` | label | 定义一个标签（跳转目标） |
| `b label` | branch | 无条件跳转到标签。省略 label 则跳到脚本末尾（开始下一循环） |
| `t label` | test | 条件跳转：如果自上次读取输入行或上次 `t` 命令以来，有 `s` 替换成功，则跳转 |

#### 3.16.1 标签 `:` 和分支 `b`

```bash
# 基本分支：跳过某些命令
# 格式：sed '/pattern/b skip;  commands...; :skip; more commands...'

# 示例：对不以 # 开头的行执行替换，以 # 开头的行原样保留
cat > /tmp/sed-branch.txt << 'EOF'
# This is a comment
active = true
# Another comment
port = 8080
EOF

sed '/^#/b end; s/=/ => /; :end' /tmp/sed-branch.txt
# 输出：
# # This is a comment
# active => true
# # Another comment
# port => 8080
# 解释：以 # 开头的行跳转到 :end（不执行 s 命令），其余行执行 s 替换
```

#### 3.16.2 条件分支 `t`

`t` 是 sed 中最强大的流程控制命令。它使 sed 能够实现循环和条件处理。

```bash
# t 的典型用法：循环替换直到匹配穷尽
# 示例：将一行中的多个空格压缩为一个（用循环替代 g 标志）
echo "a    b     c      d" | sed -E ':loop; s/  / /; t loop'
# 输出：a b c d
# 解释：
#   :loop 定义标签
#   s/  / / 将两个空格替换为一个
#   t loop → 如果替换成功，跳回 :loop 继续尝试
#   → 循环直到没有连续两个空格为止

# 不使用 t 而用 g 的等效写法：
echo "a    b     c      d" | sed -E 's/  +/ /g'
# t 的优势在于可以执行更复杂的条件逻辑
```

#### 3.16.3 组合使用 b 和 t 构建复杂逻辑

```bash
# 示例：对奇数行执行 A 操作，偶数行执行 B 操作
cat > /tmp/sed-oddeven.txt << 'EOF'
task: backup
task: restore
task: verify
task: cleanup
EOF

# 使用保持空间切换状态
sed -E '
1{
    h          # 保存第 1 行状态
    s/task: /[ODD]  /  # 第 1 行标记为 ODD
    b print
}
# 后续行
{
    x          # 交换，拿到上一行的状态
    /ODD/{
        s/ODD/EVEN/
        x
        s/task: /[EVEN] /
        b print
    }
    /EVEN/{
        s/EVEN/ODD/
        x
        s/task: /[ODD]  /
        b print
    }
}
:print
' /tmp/sed-oddeven.txt
# 输出：
# [ODD]  backup
# [EVEN] restore
# [ODD]  verify
# [EVEN] cleanup
# （此例演示复杂流程控制，实际可以用更简单的方法实现奇偶行判断）
```

**简化版奇偶判断（使用 GNU 扩展 `1~2` 地址）：**

```bash
sed -E '1~2s/task: /[ODD]  /; 2~2s/task: /[EVEN] /' /tmp/sed-oddeven.txt
```

#### 3.16.4 b 和 t 省略标签的行为

```bash
# b 省略标签 → 跳到脚本末尾（跳过所有后续命令，开始下一循环）
sed '/pattern/{s/old/new/; b; s/this/wont/run}' file.txt

# t 省略标签 → 如果有替换发生，跳到脚本末尾
sed 's/foo/bar/; t; s/baz/qux/' file.txt
# 如果第一行 s/foo/bar/ 替换成功，t 跳转到末尾，第二行的 s 不执行
```

### 3.17 实战常用组合模式

以下是一些在实际运维和开发中高频出现的 sed 组合模式。

```bash
# 1. 删除 C/C++ 风格的注释（简化的单行注释处理）
sed -E 's|//.*$||' source.c      # 删除 // 行注释
sed -E 's|/\*.*\*/||g' source.c  # 删除 /* */ 块注释（单行）

# 2. 去除 DOS/Windows 风格的回车符（\r\n → \n）
sed 's/\r$//' windows_file.txt

# 3. 在每行开头添加行号（右对齐，占 4 位）
sed = file.txt | sed 'N; s/\n/\t/'

# 4. 提取日志中特定时间段的内容
sed -n '/2026-07-29 08:00/,/2026-07-29 09:00/p' app.log

# 5. 删除 XML/HTML 标签，只保留文本
echo "<p>Hello <b>World</b></p>" | sed 's/<[^>]*>//g'
# 输出：Hello World

# 6. 给 JSON 的 key 加上引号（非标准 JSON 修复）
echo '{name: John, age: 30}' | sed -E 's/(\{|, )([a-z]+):/"\2":/g'
# 输出：{"name": John, "age": 30}

# 7. 将 CSV 分隔符从逗号改为制表符
echo "a,b,c,d" | sed 's/,/\t/g'
# 输出：a	b	c	d

# 8. 在 Makefile 中将空格缩进替换为 Tab
sed 's/^    /\t/' Makefile
```

---

## 4. 实战练习

### 准备练习环境

```bash
# 创建练习用工作目录
mkdir -p ~/ch13-practice
cd ~/ch13-practice

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# 练习数据 1：服务器配置文件（模拟 nginx 风格）
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cat > server.conf << 'EOF'
# Nginx Server Configuration
# Generated on 2026-07-29

server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/html;
    index index.html index.htm;
}

server {
    listen 8080;
    server_name api.example.com;
    root /var/www/api;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

# server {
#     listen 443;
#     server_name secure.example.com;
#     # SSL disabled for now
# }
EOF

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# 练习数据 2：CSV 格式的数据文件
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cat > employees.csv << 'EOF'
id,name,department,salary,hire_date
1,Alice Johnson,Engineering,85000,2020-03-15
2,Bob Smith,Marketing,65000,2019-07-01
3,Carol Williams,Engineering,92000,2018-11-22
4,David Brown,Sales,70000,2021-01-10
5,Eve Davis,Engineering,88000,2020-06-30
6,Frank Miller,Marketing,62000,2022-02-14
7,Grace Wilson,Sales,75000,2019-09-05
8,Henry Moore,Engineering,95000,2017-05-18
9,Iris Taylor,Marketing,67000,2021-08-25
10,Jack Anderson,Sales,71000,2020-12-01
EOF

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# 练习数据 3：应用日志（模拟 Node.js 应用）
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cat > app.log << 'EOF'
2026-07-29 08:00:01 INFO  [app] Server starting on port 3000
2026-07-29 08:00:02 INFO  [db] Connected to PostgreSQL at 10.0.0.50:5432
2026-07-29 08:00:03 INFO  [redis] Connected to Redis at 10.0.0.60:6379
2026-07-29 08:00:04 DEBUG [app] Loading routes: /api/users, /api/orders
2026-07-29 08:05:12 INFO  [app] GET /api/users - 200 OK (45ms)
2026-07-29 08:05:15 INFO  [app] GET /api/orders - 200 OK (120ms)
2026-07-29 08:05:20 INFO  [app] POST /api/orders - 201 Created (230ms)
2026-07-29 08:10:01 WARN  [app] Request GET /api/reports timed out after 5000ms
2026-07-29 08:10:01 ERROR [app] Report generation failed: OutOfMemoryError
2026-07-29 08:10:02 ERROR [db] Connection pool exhausted (50/50), retrying...
2026-07-29 08:10:03 INFO  [db] Database connection pool restored (45/50)
2026-07-29 08:15:01 DEBUG [cache] Cache miss for key: user:123:profile
2026-07-29 08:15:02 DEBUG [cache] Cache miss for key: user:456:profile
2026-07-29 08:15:30 INFO  [app] GET /api/users/123 - 200 OK (12ms)
2026-07-29 08:15:31 INFO  [app] GET /api/users/456 - 200 OK (10ms)
2026-07-29 08:20:00 ERROR [app] Unhandled exception in POST /api/batch
  TypeError: Cannot read property 'id' of undefined
    at processBatch (/app/services/batch.js:45:22)
2026-07-29 08:20:01 INFO  [app] Error handler invoked, returning 500
2026-07-29 08:20:05 WARN  [app] Rate limit approaching: 950/1000 requests
EOF

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# 练习数据 4：混乱格式的配置文件
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cat > messy.conf << 'EOF'
# Application Configuration


debug = true


# Database Settings
db_host = localhost
db_port = 5432


db_name = myapp
    # Indented comment
    
# Redis Settings
redis_host = 127.0.0.1
redis_port = 6379



# Logging
log_level = info
EOF

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# 练习数据 5：姓名列表（用于高级操作）
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cat > names.txt << 'EOF'
John
Smith
Alice
Johnson
Bob
Williams
Carol
Davis
EOF

# 确认所有文件已创建
ls -la ~/ch13-practice/
```

---

### 练习 13.1：基本替换——修改配置文件

**题目：**

（1）将 `server.conf` 中所有的 `listen 80` 改为 `listen 8080`。

（2）将 `server.conf` 中所有的 `example.com` 改为 `myapp.local`（全局替换，一行中可能出现多次）。

（3）预览修改效果但不实际修改文件（即只在标准输出查看，不改原文件）。

**答案：**

（1）：

```bash
sed 's/listen 80/listen 8080/' ~/ch13-practice/server.conf
# 或者使用 -E 更精确：
sed -E 's/listen 80\b/listen 8080/' ~/ch13-practice/server.conf
# \b 防止匹配到 8080（虽然此例中不会误匹配）
```

（2）：

```bash
sed 's/example\.com/myapp.local/g' ~/ch13-practice/server.conf
# 注意：. 需要转义为 \. 避免匹配任意字符
# 预期结果：两处 example.com 都变为 myapp.local
```

（3）：

```bash
# sed 默认只输出到标准输出，不修改原文件——这就是"预览"
sed 's/listen 80/listen 8080/' ~/ch13-practice/server.conf
# 确认原文件未变
cat ~/ch13-practice/server.conf | grep "listen 80"
# 仍然输出 listen 80，证明原文件未被修改
```

---

### 练习 13.2：删除操作——清理配置文件

**题目：**

（1）删除 `server.conf` 中所有以 `#` 开头的注释行。

（2）同时删除注释行和空行，只保留有效的配置行。

（3）删除从第一个 `# Proxy` 行到包含 `proxy_set_header` 的行（删除整个注释块和下一行）。

**答案：**

（1）：

```bash
sed '/^#/d' ~/ch13-practice/server.conf
# 输出：不含注释行的内容
```

（2）：

```bash
sed '/^#/d; /^$/d' ~/ch13-practice/server.conf
# 或者使用 -E：
sed -E '/^(#|$)/d' ~/ch13-practice/server.conf
# 预期输出：
# server {
#     listen 80;
#     server_name example.com www.example.com;
#     root /var/www/html;
#     index index.html index.htm;
# }
# server {
#     listen 8080;
#     server_name api.example.com;
#     root /var/www/api;
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_set_header Host $host;
#     }
# }
```

（3）：

```bash
sed '/# Proxy/,/proxy_set_header/d' ~/ch13-practice/server.conf
# 删除从 "# Proxy settings" 到 "proxy_set_header Host $host;" 的行
```

---

### 练习 13.3：打印操作——提取特定行

**题目：**

（1）只打印 `server.conf` 的第 1 到第 5 行。

（2）只打印包含 `listen` 的行。

（3）打印 `server.conf` 中从第一个 `server {` 到对应的 `}` 之间的所有行（第一个 server 块）。

（4）打印除了第 1-3 行和最后 1 行之外的所有行。

**答案：**

（1）：

```bash
sed -n '1,5p' ~/ch13-practice/server.conf
# -n 抑制自动输出，p 只打印指定行
# 输出：前 5 行
```

（2）：

```bash
sed -n '/listen/p' ~/ch13-practice/server.conf
# 输出：
#     listen 80;
#     listen 8080;
# #     listen 443;
```

（3）：

```bash
sed -n '/server {/,/}/p' ~/ch13-practice/server.conf
# 注意：这会匹配三次（两个活跃 server 块 + 一个注释的 server 块）
# 要只取第一个，加上退出条件：
sed -n '/server {/,/}/{p; /}/q}' ~/ch13-practice/server.conf
# 输出：第一个 server 块的内容
```

（4）：

```bash
# 先计算总行数
total=$(sed -n '$=' ~/ch13-practice/server.conf)
# 打印第 4 行到倒数第 2 行
sed -n "4,$((total-1))p" ~/ch13-practice/server.conf
# 或者更优雅的做法：
sed '1,3d; $d' ~/ch13-practice/server.conf
```

---

### 练习 13.4：插入、追加与整行替换

**题目：**

（1）在 `server.conf` 的第 1 行之前插入一个文件头注释 `# ===== Server Config =====`。

（2）在每个 `server {` 行之后追加一行注释 `    # Server block start`。

（3）将 `server.conf` 中 `server_name` 行整行替换为 `    server_name mysite.local;`。

**答案：**

（1）：

```bash
sed '1i\# ===== Server Config =====' ~/ch13-practice/server.conf
# i 命令在第 1 行之前（before）插入文本
# 输出：
# # ===== Server Config =====
# # Nginx Server Configuration
# ...
```

（2）：

```bash
sed '/server {/a\    # Server block start' ~/ch13-practice/server.conf
# 每个 "server {" 行后面追加一行注释
```

（3）：

```bash
sed -E '/^\s*server_name/c\    server_name mysite.local;' ~/ch13-practice/server.conf
# c 命令将匹配行整体替换
# 注意：c 会替换整行，而非部分文本
# 如果需要部分替换（保留缩进等），应该使用 s：
sed -E 's/server_name .*;/server_name mysite.local;/' ~/ch13-practice/server.conf
```

---

### 练习 13.5：字符转换与大小写

**题目：**

（1）将 `employees.csv` 中的表头行（第 1 行）全部转换为大写。

（2）将 `app.log` 中所有 `ERROR` 行的日志级别改为小写 `error`，其他内容保持不变。

（3）使用 `y` 命令将 `employees.csv` 中的数字 0-4 替换为字母 a-e（只做映射测试）。

**答案：**

（1）：

```bash
# 方法 1：使用 y 命令
sed '1y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/' ~/ch13-practice/employees.csv
# 输出第 1 行：
# ID,NAME,DEPARTMENT,SALARY,HIRE_DATE

# 方法 2：使用 GNU sed 的 \U 转义（在替换文本中）
sed -E '1s/.*/\U&/' ~/ch13-practice/employees.csv
# \U 将替换文本中的匹配内容转为大写（GNU 扩展）
# 输出：ID,NAME,DEPARTMENT,SALARY,HIRE_DATE

# 方法 3：使用 sed -E 和 \u（仅首字母大写）
sed -E '1s/(\w+)/\u\1/g' ~/ch13-practice/employees.csv
```

（2）：

```bash
# 只对包含 ERROR 的行执行替换
sed '/ERROR/s/ERROR/error/' ~/ch13-practice/app.log
# 注意：不使用 g 标志，只替换第一个出现的 ERROR
# 因为日志行中通常只在固定位置出现一次日志级别
```

（3）：

```bash
# y 做逐字符映射：0→a, 1→b, 2→c, 3→d, 4→e
echo "10234" | sed 'y/01234/abcde/'
# 输出：bacde

# 对 CSV 文件的薪资金额做映射（仅演示，无实际意义）
sed 'y/0123456789/abcdefghij/' ~/ch13-practice/employees.csv
```

---

### 练习 13.6：反向引用——数据重排

**题目：**

（1）将 `employees.csv` 中每行数据（跳过表头）的格式从 `id,name,department,salary,hire_date` 改为 `name (department): $salary`。

（2）将 `app.log` 中的时间戳格式 `YYYY-MM-DD HH:MM:SS` 改为 `HH:MM DD/MM/YYYY`。

（3）将 `names.txt` 中的姓、名互换（当前是 FirstName 后跟 LastName，变成 LastName, FirstName）。

**答案：**

（1）：

```bash
sed -E '2,$s/^[^,]*,([^,]*),([^,]*),([^,]*),.*/\1 (\2): $\3/' ~/ch13-practice/employees.csv
# 输出（从第 2 行开始）：
# Alice Johnson (Engineering): $85000
# Bob Smith (Marketing): $65000
# ...
# 解释：
# ^[^,]*   → 跳过 id 字段
# ([^,]*)  → 捕获 name（\1）
# ([^,]*)  → 捕获 department（\2）
# ([^,]*)  → 捕获 salary（\3）
# .*       → 跳过 hire_date
```

（2）：

```bash
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})/\4:\5 \3\/\2\/\1/' ~/ch13-practice/app.log
# 输出示例：
# 08:00 29/07/2026 INFO  [app] Server starting on port 3000
# 解释：
# \1=YYYY, \2=MM, \3=DD, \4=HH, \5=MM(分钟), \6=SS
# 重新排列为 HH:MM(分钟) DD/MM/YYYY
```

（3）：

```bash
# names.txt 格式：奇数是 FirstName，偶数是 LastName
# 用 N 合并两行后用反向引用交换
sed -E 'N; s/(.*)\n(.*)/\2, \1/' ~/ch13-practice/names.txt
# 输出：
# Smith, John
# Johnson, Alice
# Williams, Bob
# Davis, Carol
```

---

### 练习 13.7：保持空间——行交换与反转

**题目：**

（1）交换 `names.txt` 中的第 1 行和第 2 行。

（2）将 `names.txt` 的奇数行和偶数行互换（第 1 行和第 2 行交换，第 3 行和第 4 行交换，以此类推）。

（3）使用保持空间将 `names.txt` 完全反转（最后一行变第一行）。

**答案：**

（1）：

```bash
# 交换第 1 行和第 2 行
sed '1{h;d}; 2{G}' ~/ch13-practice/names.txt
# 解释：
# 1{h;d} → 第 1 行：h 保存到保持空间，d 删除（不输出）
# 2{G}   → 第 2 行：G 取回保持空间追加 → 模式空间 = "Smith\nJohn"
#          然后自动输出：先打印 Smith（原第 2 行），再打印 John（原第 1 行）
```

（2）：

```bash
sed -E '1~2{h;d}; 2~2{G}' ~/ch13-practice/names.txt
# 使用 GNU 扩展 ~ 步进地址
# 奇数行 (1,3,5,7)：h 保存到保持空间，d 删除
# 偶数行 (2,4,6,8)：G 追加保持空间，自动输出
# 输出：每对互换
```

（3）：

```bash
sed '1!G;h;$!d' ~/ch13-practice/names.txt
# 输出：
# Davis
# Carol
# Williams
# Bob
# Johnson
# Alice
# Smith
# John
```

---

### 练习 13.8：多行模式——段落处理

**题目：**

（1）使用 `N` 命令将 `names.txt` 的每两行合并为一行，格式为 "FirstName LastName"。

（2）在 `messy.conf` 中，使用 `N`/`P`/`D` 将连续空行压缩为单个空行。

（3）（挑战题）在 `app.log` 中，将跨行的错误堆栈（以 `  TypeError` 等缩进行开头）合并回前一行。

**答案：**

（1）：

```bash
sed 'N; s/\n/ /' ~/ch13-practice/names.txt
# 输出：
# John Smith
# Alice Johnson
# Bob Williams
# Carol Davis
```

（2）：

```bash
sed '$!N; /^\n$/!P; D' ~/ch13-practice/messy.conf
# 这是一个经典的 sed 压缩空行方法
# 解释：
# $!N     → 不是最后一行时，追加下一行
# /^\n$/!P → 如果模式空间不是仅含一个换行符（即非双空行），打印第一行
# D       → 删除第一行，剩余内容继续下一循环
```

（3）：

```bash
# 将以空格/Tab 开头的行（续行）合并到前一行
sed -E ':merge; $!N; s/\n  / /; t merge; P; D' ~/ch13-practice/app.log
# 解释：
# :merge 定义标签
# $!N    追加下一行
# s/\n  / /  将换行后跟空格的模式替换为单个空格
# t merge  如果替换成功，跳回 merge（继续合并更多续行）
# P       打印第一行
# D       删除第一行
```

---

### 练习 13.9：读写文件——模板插入

**题目：**

（1）创建一个 footer 文件，并在 `server.conf` 的末尾插入它。

（2）将 `server.conf` 中所有被注释掉的 server 块（以 `# server {` 开头到对应的 `# }`）提取写入单独的文件 `disabled_servers.conf`。

**答案：**

（1）：

```bash
# 创建 footer 文件
cat > ~/ch13-practice/footer.conf << 'EOF'
# ============================================
# End of server configuration
# Last updated: 2026-07-29
# ============================================
EOF

sed '$r ~/ch13-practice/footer.conf' ~/ch13-practice/server.conf
# 输出：server.conf 的内容 + footer.conf 的内容
```

（2）：

```bash
# 提取被注释的 server 块
sed -n '/^# server {/,/^# }/w ~/ch13-practice/disabled_servers.conf' ~/ch13-practice/server.conf
cat ~/ch13-practice/disabled_servers.conf
# 输出：
# # server {
# #     listen 443;
# #     server_name secure.example.com;
# #     # SSL disabled for now
# # }
```

---

### 练习 13.10：分支与循环——复杂条件处理

**题目：**

（1）使用分支 `b` 实现：对 `server.conf` 中以 `#` 开头的行不做任何处理（原样输出），对其他行中的 `listen` 替换为 `LISTEN`。

（2）使用 `t` 条件分支将多个连续空格压缩为一个空格（不用 `g` 标志，用循环实现）。

（3）（挑战题）在 `employees.csv` 中，将所有薪资金额加 10% 并输出。

**答案：**

（1）：

```bash
sed '/^#/b skip; s/listen/LISTEN/g; :skip' ~/ch13-practice/server.conf
# 解释：
# /^#/b skip → 匹配注释行，跳转到 :skip（跳过 s 命令）
# s/listen/LISTEN/g → 非注释行执行替换
# :skip → 标签，注释行跳到这里继续（然后自动输出）
```

（2）：

```bash
echo "a    b     c      d" | sed -E ':loop; s/  / /; t loop'
# 解释：
# :loop  定义标签
# s/  / /  将两个空格替换为一个
# t loop  如果替换成功，跳回 loop（继续压缩）
# 循环直到没有两个连续空格
```

（3）：

```bash
# 对第 2 行及以后行的第 4 个字段（薪资）加 10%
# 注意：sed 本身不擅长算术，这里用 e 标志执行 shell 计算
sed -E '2,$s/([^,]*,){3}([0-9]+)/echo "\1$((\2 * 110 \/ 100))"/e' ~/ch13-practice/employees.csv
# 解释：
# ([^,]*,){3}  → 匹配前 3 个字段（id,name,department,）
# ([0-9]+)     → 捕获薪资数字
# /e           → 将替换结果作为 shell 命令执行
# echo "...$((...))" → shell 算术计算并输出结果
```

---

### 练习 13.11：综合应用——日志分析脚本

**题目：**

编写一个 sed 脚本文件 `analyze_log.sed`，对 `app.log` 执行以下操作：

（1）删除 DEBUG 级别的日志行。

（2）将 INFO 行以绿色标记（添加 `[OK]` 前缀），WARN 行以黄色标记（添加 `[WARN]` 前缀），ERROR 行以红色标记（添加 `[CRIT]` 前缀）。

（3）用 `[REDACTED]` 替换所有 IP 地址。

（4）删除时间戳中的秒部分（`HH:MM:SS` 改为 `HH:MM`）。

（5）输出到标准输出。

**答案：**

```bash
# 创建脚本文件
cat > ~/ch13-practice/analyze_log.sed << 'SEDEOF'
# (1) 删除 DEBUG 行
/DEBUG/d

# (2) 添加日志级别标记
s/INFO/[OK]  /
s/WARN/[WARN]/
s/ERROR/[CRIT]/

# (3) 脱敏 IP 地址
s/[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}/[REDACTED]/g

# (4) 删除秒部分：HH:MM:SS → HH:MM
s/\([0-9]\{2\}:[0-9]\{2\}\):[0-9]\{2\}/\1/

SEDEOF

# 执行
sed -f ~/ch13-practice/analyze_log.sed ~/ch13-practice/app.log
```

---

### 练习 13.12：就地编辑与备份——修改真实文件

**题目：**

（1）使用 `-i` 选项直接在 `messy.conf` 中删除所有空行和注释行（以 `#` 开头）。

（2）使用 `-i.bak` 选项对 `server.conf` 执行修改（将 `listen 80` 改为 `listen 80 default_server`），同时保留原文件的 `.bak` 备份。

（3）确认修改结果和备份文件。

**答案：**

（1）：

```bash
# -i 直接修改文件，先备份
cp ~/ch13-practice/messy.conf ~/ch13-practice/messy.conf.orig
sed -i '/^$/d; /^[[:space:]]*#/d' ~/ch13-practice/messy.conf

# 查看修改后的文件
cat ~/ch13-practice/messy.conf
# 预期输出（所有空行和注释行被删除）：
# debug = true
# db_host = localhost
# db_port = 5432
# db_name = myapp
# redis_host = 127.0.0.1
# redis_port = 6379
# log_level = info
```

（2）：

```bash
# -i.bak 在修改前创建 .bak 备份
sed -i.bak 's/listen 80\b/listen 80 default_server/' ~/ch13-practice/server.conf

# 确认修改
grep "listen 80" ~/ch13-practice/server.conf
# 输出：
#     listen 80 default_server;

# 确认备份
grep "listen 80" ~/ch13-practice/server.conf.bak
# 输出：
#     listen 80;
```

（3）：

```bash
# 对比修改前后
echo "=== 原始备份 ==="
cat ~/ch13-practice/server.conf.bak | grep "listen"

echo ""
echo "=== 修改后 ==="
cat ~/ch13-practice/server.conf | grep "listen"
```

---

## 5. 常见错误与排错

### 5.1 "sed: -e expression #1, char X: unterminated `s' command" —— 分隔符不匹配

**现象：**

```bash
sed 's/foo/bar' file.txt
```

```
sed: -e expression #1, char 9: unterminated `s' command
```

**原因：** `s` 命令需要三个分隔符（如 `s/pattern/replacement/`），你只提供了两个。第三个分隔符标志着替换文本的结束和标志的开始。

**解决：**

```bash
# 正确写法
sed 's/foo/bar/' file.txt

# 如果替换文本中包含 /，换用其他分隔符
sed 's#/usr/local/bin#/opt/bin#' file.txt
```

### 5.2 "sed: -e expression #1, char X: unknown option to `s'" —— 非法标志

**现象：**

```bash
sed 's/foo/bar/x' file.txt
```

```
sed: -e expression #1, char 13: unknown option to `s'
```

**原因：** `s` 命令只接受特定的标志字符（`g`、`i`、`p`、`e`、`m`、数字、`w`），`x` 不是有效标志。

**解决：**

```bash
# 确认标志的合法值
# 常见的合法标志：g, i, p, e, m, 1-9（数字）
sed 's/foo/bar/g' file.txt    # 正确
sed 's/foo/bar/gi' file.txt   # 也正确（组合标志）
```

### 5.3 替换未生效 —— 正则表达式写错或分隔符含在模式中

**现象：**

```bash
sed 's/192.168.1.1/10.0.0.1/' file.txt
# 预期：替换 IP 地址 192.168.1.1
# 实际：也匹配了 192.168.1.100（因为 . 是元字符）
```

**原因：** `.` 在正则中匹配任意单个字符。`192.168.1.1` 中的点号匹配了数字 `0`，导致意外匹配。

**解决：**

```bash
# 转义点号
sed 's/192\.168\.1\.1/10.0.0.1/' file.txt

# 或者使用 -E 模式（ERE 中同样需要转义）
sed -E 's/192\.168\.1\.1/10.0.0.1/' file.txt
```

**其他常见的"替换没反应"原因：**

```bash
# 1. 大小写不匹配
echo "Hello" | sed 's/hello/Hi/'
# 输出：Hello  （什么都没变！因为 h 和 H 不同）
# 解决：加 i 标志（GNU 扩展）
echo "Hello" | sed 's/hello/Hi/i'
# 输出：Hi

# 2. 捕获分组忘记转义（BRE 模式）
echo "abc123" | sed 's/(abc)(123)/\2\1/'
# 输出：abc123  （什么都没变！因为 () 被当作字面量）
# 解决：转义括号（BRE）
echo "abc123" | sed 's/\(abc\)\(123\)/\2\1/'
# 输出：123abc
# 或者用 -E
echo "abc123" | sed -E 's/(abc)(123)/\2\1/'
# 输出：123abc

# 3. 量词忘记转义（BRE 模式）
echo "abc123def" | sed 's/[0-9]+/NUM/'
# 输出：abc123def  （什么都没变！+ 被当作字面量加号）
# 解决：转义 +（BRE）
echo "abc123def" | sed 's/[0-9]\+/NUM/'
# 输出：abcNUMdef
# 或者用 -E
echo "abc123def" | sed -E 's/[0-9]+/NUM/'
# 输出：abcNUMdef
```

### 5.4 地址范围不按预期工作 —— 贪婪匹配与重复激活

**现象：**

```bash
# 想删除第 1 个到第 3 个 "server {" 块
sed '/server {/,/}/d' server.conf
# 实际：删除了所有 server 块（甚至更多）
```

**原因：** sed 的范围匹配是"开关"模式：在匹配到开始模式后"打开"，匹配到结束模式后"关闭"。如果文件中有多个块，范围会在每个块的开始处重新激活。

**解决：**

```bash
# 方法 1：在第一个结束模式后退出
sed '/server {/,/}/{/}/q; d}' server.conf

# 方法 2：如果只需要特定的第 N 个块，使用行号
sed '3,15d' server.conf  # 如果知道确切行号

# 方法 3：使用 0,/pattern/（GNU 扩展）只匹配第一次
sed '0,/server {/d' server.conf  # 删除到第一个 server {
```

### 5.5 "sed: can't read xxx: No such file or directory" —— 文件路径错误

**现象：**

```bash
sed 's/foo/bar/' /path/to/nonexistent/file
```

```
sed: can't read /path/to/nonexistent/file: No such file or directory
```

**原因：** 指定的输入文件不存在。

**解决：**

```bash
# 先检查文件是否存在
ls -la /path/to/file && sed 's/foo/bar/' /path/to/file

# 或者使用 test 命令
[ -f /path/to/file ] && sed 's/foo/bar/' /path/to/file
```

### 5.6 `-i` 导致的不可逆修改

**现象：**

```bash
# 本想预览修改，习惯性加了 -i
sed -i 's/^/# /' important_config.conf
# 每一行前面都加了 #，文件变成全注释！
```

**原因：** `-i` 直接修改文件，没有撤销操作。

**解决：**

```bash
# 永远先预览，后 -i
sed 's/pattern/replacement/' file.txt | head    # 先看效果
sed -i.bak 's/pattern/replacement/' file.txt    # 加 .bak 保留备份

# 如果忘记备份且后悔了：
# 1. 如果有 .bak 文件：mv file.txt.bak file.txt
# 2. 如果使用版本控制：git checkout file.txt
# 3. 如果文件非常重要且没有备份：考虑从系统快照/备份恢复
```

### 5.7 管道中使用 sed 时发现输出为空

**现象：**

```bash
echo "test" | sed -n 's/test/TEST/p'
# 输出：TEST  （-n + p，预期行为）

echo "test" | sed -n 's/foo/bar/'
# 输出：（空）  ← 为什么？
```

**原因：** `-n` 抑制了自动输出。当没有匹配时，`p` 也不打印任何东西，所以屏幕上一片空白。

**解决：**

```bash
# 如果不需要筛选，就去掉 -n
echo "test" | sed 's/foo/bar/'
# 输出：test  （原样输出，因为没有匹配到 foo）

# 如果需要筛选，确认模式正确
echo "test" | sed -n 's/test/TEST/p'
# 输出：TEST
```

### 5.8 在 `Makefile` 中使用 sed 的 `$` 会被展开

**现象：**

```makefile
# Makefile 中
fix:
	sed 's/$$/ END/' file.txt
```

**原因：** 在 Makefile 中，`$` 是变量展开符号。`$$` 才能表示字面量的 `$`。

**解决：**

```makefile
# Makefile 中
fix:
	sed 's/$$/ END/' file.txt      # $$ → $（字面量）
	sed 's/\$$/ END/' file.txt     # \$$ → 在 Makefile 中更安全的写法
```

### 5.9 sed 的正则 vs grep 的正则 —— BRE 转义的不一致性

**现象：**

```bash
# 在 grep 中（默认 BRE）
echo "abc123" | grep '[0-9]\+'
# 输出：abc123（grep 中 \+ 是"一个或多个"）

# 在 sed 中（默认 BRE）
echo "abc123" | sed 's/[0-9]\+/NUM/'
# 输出：abcNUM（sed 中 \+ 也是"一个或多个"——所以是一致的？）
```

实际上 GNU grep 和 GNU sed 在 BRE 下的转义规则是一致的。但在某些老版本的 Unix 工具或不同的实现中可能有差异。

**最佳实践：始终使用 `-E` 消除歧义。**

```bash
# 使用 -E，grep 和 sed 的语法完全一致
echo "abc123" | grep -E '[0-9]+'
echo "abc123" | sed -E 's/[0-9]+/NUM/'
```

---

## 6. 进阶延伸

### 6.1 sed 脚本文件：将一次性命令变为可复用工具

当 sed 命令超过 3-4 行时，将其写入脚本文件是更明智的做法：

```bash
# 创建一个清理配置文件的脚本
cat > ~/bin/cleanup-config.sed << 'EOF'
#!/usr/bin/sed -f
# 配置文件清理脚本
# 用法：sed -f cleanup-config.sed config.conf

# 1. 删除注释行（以 # 或 ; 开头）
/^[[:space:]]*[#;]/d

# 2. 删除空行
/^[[:space:]]*$/d

# 3. 删除行尾空白
s/[[:space:]]*$//

# 4. 删除行首空白
s/^[[:space:]]*//

# 5. 压缩 = 号周围的空格
s/[[:space:]]*=[[:space:]]*/=/g
EOF

chmod +x ~/bin/cleanup-config.sed

# 使用脚本文件
sed -f ~/bin/cleanup-config.sed messy.conf
```

### 6.2 sed 与 Shell 变量的交互

在 Shell 脚本中，将变量值传递给 sed 需要谨慎处理：

```bash
# 基本用法：双引号允许 Shell 变量展开
old="foo"
new="bar"
sed "s/$old/$new/g" file.txt   # Shell 先展开变量，sed 收到 s/foo/bar/g

# 危险：如果变量中包含特殊字符
old="a/b"                       # 包含 / 分隔符
# sed "s/$old/$new/g" → sed "s/a/b/bar/g"  ← 语法错误！
# 解决：使用不同的分隔符
sed "s|$old|$new|g" file.txt   # 用 | 替代 /

# 更安全：变量中可能包含任何字符
old="some*pattern[with]special.chars"
escaped_old=$(printf '%s\n' "$old" | sed 's/[[\.*^$()+?{|\/]/\\&/g')
sed "s/$escaped_old/$new/g" file.txt
# 或者更简单：如果只是字面量，使用 awk 而非 sed

# 在 sed 中使用环境变量
export LOG_LEVEL="INFO"
sed -n "/^$LOG_LEVEL/p" app.log
# 注意：双引号中的 $ 会被 Shell 展开
# 在单引号中 $ 不会展开
```

### 6.3 sed 能做的 vs 不该做的 —— 选择正确的工具

sed 是文本处理利器，但并非万能。以下是工具选择的建议：

| 任务 | 推荐工具 | 为什么 |
|------|---------|--------|
| 简单查找替换 | **sed** | 最简洁，`sed 's/a/b/'` 比 `awk '{gsub(/a/,"b")}1'` 直观 |
| 多条件筛选 + 替换 | **sed** | 地址 + 命令 + 分支可以处理复杂条件 |
| 按列/字段处理 | **awk** | sed 没有列的概念，awk 原生支持 `$1, $2, $NF` |
| 数值计算 | **awk** | sed 需要 `e` 标志调用外部 shell，awk 内置算术运算 |
| CSV/TSV 解析 | **awk** 或专用工具（`csvkit`） | sed 不处理引号嵌套、字段转义等边界情况 |
| JSON/XML 处理 | **jq** / **xq** | sed 基于行的模型无法可靠处理结构化数据 |
| 二进制文件 | **不可用 sed** | sed 是面向文本的工具，二进制修改应使用 `xxd` + `sed` 或专用十六进制编辑器 |
| 交互式编辑 | **vim** / **nano** | sed 是非交互式的，不适合需要即时反馈的编辑 |

### 6.4 从 sed 到 awk：三剑客的过渡

第 14 章将学习 awk。以下是一个预览，展示同一个任务在 sed 和 awk 中的不同实现：

```bash
# 任务：提取日志中的时间戳和消息内容

# 示例日志行
line="2026-07-29 08:05:12 INFO  [app] GET /api/users - 200 OK (45ms)"

# sed 方案：依赖正则捕获分组
echo "$line" | sed -E 's/^([^ ]+ [^ ]+) .*\] (.*)$/\1 | \2/'
# 输出：2026-07-29 08:05:12 | GET /api/users - 200 OK (45ms)

# awk 方案：利用字段分割
echo "$line" | awk '{print $1, $2, "|", $6, $7, $8, $9}'
# 输出：2026-07-29 08:05:12 | GET /api/users - 200 OK (45ms)
```

**从 sed 过渡到 awk 时，不需要"忘记" sed。** 三剑客各自擅长不同的领域，真正的能力在于知道何时用哪一个：

```
sed → 行编辑（替换、删除、插入）
awk → 字段分析与计算（$1, $2, 求和、分组统计）
grep → 行筛选（找到匹配行）

三者在管道中协同工作时，产出远超各自单独使用。
```

### 6.5 其他文本处理工具一览

sed 是整个 Linux 文本处理生态系统的重要成员。以下是与 sed 协同或替代的场景：

| 工具 | 与 sed 的关系 | 场景 |
|------|-------------|------|
| `tr` | `y` 命令的独立版本 | 简单字符转换，比 sed 更快 |
| `cut` | 补充 | 按分隔符或字符位置提取字段，比 sed 更简洁 |
| `paste` | 补充 | 按列合并文件（sed 也能做，但 paste 更直接） |
| `colrm` | 替代 | 按字符列删除（`sed 's/^.\{5\}//'` 的替代方案） |
| `perl -pe` | 超集 | Perl 一行命令，正则功能远超 sed（支持环视、非贪婪等） |
| `sd` | 现代替代 | Rust 写的查找替换工具，语法更直观：`sd 'old' 'new' file` |
| `sad` | 现代替代 | Rust 写的"超级 sed"，支持 diff 预览、模糊匹配 |

### 6.6 构建个人 sed 速查表

将常用的 sed 模式整理为个人速查表，放入 `~/.sed-cheatsheet.txt`：

```bash
cat > ~/.sed-cheatsheet.txt << 'EOF'
==================== sed 个人速查表 ====================

【地址速查】
3p                    → 打印第 3 行
3,10p                 → 打印第 3-10 行
/pattern/p            → 打印匹配行
/start/,/end/p        → 打印从 start 到 end 的范围
1~2p                  → 打印奇数行（GNU）
$                     → 最后一行
/pattern/!            → 地址取反（非匹配行）

【替换 s】
s/old/new/            → 替换每行第一个 old
s/old/new/g           → 替换每行所有 old
s/old/new/gi          → 全局 + 忽略大小写（GNU）
s/old/new/2           → 替换每行第 2 个 old
s/old/new/p           → 替换并打印（配合 -n）
s/old/new/w file      → 替换成功的行写入 file

【删除 d】
/^$/d                 → 删除空行
/^#/d                 → 删除注释行
1,10d                 → 删除第 1-10 行
/pattern/,/end/d      → 删除范围

【其他常用命令】
a\TEXT                → 在匹配行后追加
i\TEXT                → 在匹配行前插入
c\TEXT                → 替换整行
=                     → 打印行号
y/abc/xyz/            → 逐字符替换
r filename            → 读取文件内容插入
w filename            → 写入文件
q                     → 退出

【保持空间】
h / H                 → 存到/追加到保持空间
g / G                 → 取回/追加到模式空间
x                     → 交换保持空间和模式空间

【多行】
N                     → 追加下一行到模式空间
P                     → 打印模式空间第一行
D                     → 删除模式空间第一行

【流程控制】
:label                → 定义标签
b label               → 无条件跳转
t label               → 替换成功则跳转

【选项】
-n                    → 取消自动输出
-E                    → 扩展正则（推荐）
-i                    → 就地编辑
-i.bak                → 就地编辑 + 备份
-f script.sed         → 从文件读取命令
EOF

# 搜索速查表
grep "删除" ~/.sed-cheatsheet.txt
```

---

**本章小结：**

sed 是你学到的第一个"编辑"工具——此前你学的一切（`ls`、`cat`、`less`、`grep`）都是"查看"和"搜索"，而 sed 让你真正开始"修改"文本。

sed 的核心思维可以归纳为三点：

1. **逐行循环**：读一行 → 执行全部命令 → 输出 → 下一行。这是理解所有 sed 行为的基础。
2. **地址+命令**：先定位（地址），再操作（命令）。地址决定"哪些行"，命令决定"做什么"。
3. **两空间协作**：模式空间是工作台，保持空间是抽屉。理解了二者的协作，你就掌握了 sed 最强大的部分。

sed 的力量不在于记住每一个命令，而在于懂得如何用这些简单的积木（s、d、p、a、i、c、N、P、D、h、H、g、G、x、b、t）搭建出复杂的文本处理流水线。

下一章，你将学习三剑客的第二位——**awk**。如果说 sed 是"文本编辑的瑞士军刀"，awk 就是"文本分析的编程语言"。你将在 awk 中发现一个全新的世界：字段（`$1`、`$2`）、关联数组、内置变量、格式化输出，以及真正的编程逻辑控制。

准备好了吗？让我们继续前进。
