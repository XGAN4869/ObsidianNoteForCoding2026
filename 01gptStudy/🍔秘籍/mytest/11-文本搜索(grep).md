# 第 11 章 文本搜索 grep

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

### 1.1 从"看到内容"到"找到答案"

第 10 章你学会了查看文件内容--`cat` 一次性输出、`less` 分页浏览、`tail` 追踪末尾。现在你面前有一个 200MB 的系统日志 `/var/log/syslog`，或者一个 5000 行的 Nginx 配置文件。你的任务不是"看完它"，而是：

- "找出行首以 `2026-07-29` 开头的所有日志行"
- "找出所有包含 `ERROR` 的行及其前后各 3 行上下文"
- "统计今天 `nginx.conf` 中出现了多少次 `proxy_pass`"
- "在 200 个 `.py` 源文件中找到所有包含 `TODO` 的注释，并列出文件名"

这些任务的共同点是：**你已经有了文件，需要在文件内部定位特定内容。** 这就是**文本搜索（Text Searching）**--Linux 中最常用的数据处理操作之一。

如果说第 10 章解决的是"文件里有什么"，本章解决的是"**如何在文件中快速找到你关心的东西**"。

### 1.2 本章命令全景

本章覆盖 4 个核心命令：

| 分组 | 命令 | 功能 |
|------|------|------|
| **核心搜索（Core Search）** | `grep` | GNU 正则表达式搜索工具，Linux 中使用频率最高的文本处理命令之一。支持 BRE（基本正则）、ERE（扩展正则，通过 `-E`）、PCRE（Perl 兼容正则，通过 `-P`）三种正则引擎 |
| **便捷别名** | `egrep`、`fgrep` | `egrep` 等价于 `grep -E`（扩展正则）；`fgrep` 等价于 `grep -F`（固定字符串搜索，无正则） |
| **现代替代（Modern Alternative）** | `rg`（ripgrep） | 用 Rust 重写的现代文本搜索工具。默认递归搜索、自动忽略 `.gitignore`、智能大小写、多线程并行、比 `grep` 快数倍至数十倍 |

### 1.3 为什么 grep 是 Linux 文本处理的基石

在 Linux 运维和开发工作中，有一条不成文的规律：**你使用 `grep` 的频率仅次于 `ls` 和 `cd`。** 原因很简单：

- **日志分析：** 从 GB 级的日志中提取特定的错误、警告或请求记录
- **配置审计：** 在一组配置文件中检查某个参数是否存在、是否被正确设置
- **代码搜索：** 在项目中定位函数定义、TODO 注释、导入语句
- **管道过滤：** `command | grep pattern`--过滤命令输出，是管道（Pipe）体系中最常见的中间环节（下一章你将学到，`grep` 在管道中的地位类似于一个"智能滤网"）
- **安全分析：** `grep "Failed password" /var/log/auth.log` 检查暴力破解尝试

`grep` 的设计哲学是"**做好一件事**"--在文本流中查找匹配行。它不做多余的事，但在"查找匹配行"这件事上，做到了极致。

### 1.4 grep 名称的由来

`grep` 这个名字来自 `ed` 编辑器（Unix 最早的文本编辑器之一）中的一个命令：

```
g/re/p
```

- `g` -- global（全局，在整个文件中操作）
- `/re/` -- regular expression（正则表达式模式）
- `p` -- print（打印匹配行）

翻译："在整个文件（global）中，找到匹配正则表达式（regular expression）的行，并打印（print）它们。"

这个 1974 年的设计至今仍是 `grep` 的默认行为。**四十多年来，`grep` 的核心接口几乎没有改变--这是 Unix 哲学"做好一件事"的最佳见证。**

### 1.5 本章学习目标

完成本章后，你将能够：

- 理解**正则表达式（Regular Expression）**的三种方言：BRE（Basic Regular Expression）、ERE（Extended Regular Expression）、PCRE（Perl Compatible Regular Expression），以及它们的语法差异
- 熟练使用 `grep` 的 15+ 个核心参数：大小写忽略（`-i`）、反向匹配（`-v`）、递归搜索（`-r`/`-R`）、行号（`-n`）、仅文件名（`-l`）、计数（`-c`）、上下文行（`-A`/`-B`/`-C`）、正则引擎（`-E`/`-F`/`-P`）、仅匹配部分（`-o`）、整词匹配（`-w`）、整行匹配（`-x`）、颜色高亮（`--color`）
- 理解 `egrep`（`grep -E`）和 `fgrep`（`grep -F`）的存在意义和使用场景
- 安装并初步使用 `rg`（ripgrep），理解它相对于 `grep` 的六大优势：速度、默认递归、智能过滤、颜色输出、编码处理、用户体验
- 将 `grep` 融入管道工作流：`find ... | xargs grep`、`tail -f | grep`、`ps aux | grep`
- 解决 `grep` 使用中的常见问题：二进制文件误报、目录跳过、特殊字符转义、编码问题
- 建立"搜索即分析"的思维--`grep` 不是终点，而是数据分析流水线的起点

---

## 2. 核心概念

### 2.1 grep 的工作模型：行级过滤器

`grep` 的核心设计思想极其简单但强大：

```
输入（文件或标准输入）
    │
    ├── 逐行读取（Line by Line）
    ├── 对每一行执行模式匹配（Pattern Matching）
    │     ├── 匹配成功 → 输出该行（默认行为）或执行指定动作
    │     └── 匹配失败 → 忽略该行
    │
    └── 输出结果
```

关键认知：

- **grep 是面向行的（Line-Oriented）：** 匹配的单位是"行"，不是"词"（Word）也不是"字符"。如果一行中的任意位置出现了匹配模式，整行都会被输出。
- **grep 默认不修改任何文件：** 它只读取和筛选，不写入。`grep` 生成的输出可以重定向到新文件，但原文件不会被修改。
- **grep 的返回码（Exit Code）有意义：** `0` = 找到匹配；`1` = 未找到匹配；`2` = 发生错误。这个特性使 `grep` 非常适合在脚本中做条件判断。

```
grep 返回码速查：

  返回码   含义
  ──────  ─────────────────────────────────
  0        找到至少一个匹配行
  1        未找到任何匹配行（但也没有错误）
  2        发生了错误（如文件不存在、权限不足）
  >2       保留（通常不会出现）
```

### 2.2 正则表达式（Regular Expression）：文本搜索的语言

正则表达式是描述"文本模式"的语言。如果你只知道用**字面量（Literal）**搜索（如搜索 `error` 这个单词本身），你只发挥了 `grep` 不到 10% 的威力。

#### 2.2.1 字面量匹配 vs 模式匹配

```bash
# 字面量匹配：搜索确切的字符串 "error"
grep "error" /var/log/syslog
# 匹配: "error"、"an error occurred"、"errors"
# 不匹配: "Error"、"ERROR"、"err"

# 模式匹配：搜索以 "error" 结尾的单词（正则）
grep "error\b" /var/log/syslog
# 匹配: "error"、"network error"
# 不匹配: "errors"、"errorcode"
```

#### 2.2.2 三种正则引擎：BRE、ERE、PCRE

Linux 中存在三种正则表达式方言。理解它们的差异，是熟练使用 `grep` 的关键门槛。

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   BRE vs ERE vs PCRE 正则引擎对比                            │
│                                                                            │
│  维度              │  BRE（基本正则）      │  ERE（扩展正则）      │  PCRE   │
│  ──────────────────┼──────────────────────┼───────────────────────┼─────────│
│  全称              │  Basic Regular       │  Extended Regular      │  Perl   │
│                    │  Expression          │  Expression            │  Compat │ │
│                    │                      │                        │  Regex  │
│  grep 选项         │  grep（默认）         │  grep -E 或 egrep      │  grep -P│
│  编辑器支持        │  sed（默认）、vi      │  awk、grep -E          │  Perl、 │
│                    │                      │                        │  Python │
│  历史              │  最古老（1970s）      │  对 BRE 的增强（1980s） │  Perl   │
│                    │                      │                        │  5 时代 │
│  ──────────────────┼──────────────────────┼───────────────────────┼─────────│
│  核心语法差异      │                      │                        │         │
│  ──────────────────┼──────────────────────┼───────────────────────┼─────────│
│  + ? {}            │  需转义：\+ \? \{ \} │  直接使用：+ ? { }     │  同 ERE │
│  () 分组           │  需转义：\( ... \)   │  直接使用：( ... )     │  同 ERE │
│  | 或              │  需转义：\|          │  直接使用：|           │  同 ERE │
│  \d \w \s          │  不支持              │  不支持                │  支持   │
│  lookahead/behind  │  不支持              │  不支持                │  支持   │
│  非贪婪匹配        │  不支持              │  不支持                │  支持   │
│  ──────────────────┼──────────────────────┼───────────────────────┼─────────│
│  示例：匹配一个或多个数字                  │                        │         │
│  BRE               │  grep   '[0-9]\+'    │  --                    │  --     │
│  ERE               │  --                  │  grep -E '[0-9]+'      │  --     │
│  PCRE              │  --                  │  --                    │  grep -P│
│                    │                      │                        │  '\d+'  │
└────────────────────────────────────────────────────────────────────────────┘
```

**BRE 的历史包袱：你需要转义"扩展"语法**

BRE 是 `grep` 的默认模式，也是传统 Unix 工具（`sed`、`vi`）使用的正则方言。它的最大特点是：**元字符 `+`、`?`、`{`、`}`、`(`、`)`、`|` 默认被视为普通字符，必须用 `\` 转义后才能作为正则操作符使用。**

```bash
# 示例：在 BRE 中匹配 "一个或多个数字"
grep '[0-9][0-9]*' file.txt        # 不用 +，用 * 模拟（零个或多个）
grep '[0-9]\+' file.txt            # 转义 + 使其成为正则操作符

# 在 ERE 中匹配同样模式（推荐）
grep -E '[0-9]+' file.txt          # + 直接生效，更自然
```

**ERE 是现代默认选择：** `grep -E`（或 `egrep`）将 `+`、`?`、`{`、`}`、`(`、`)`、`|` 默认视为正则操作符，符合现代正则表达式直觉。**在日常使用中，建议默认使用 `grep -E`，除非你需要兼容老脚本。**

**PCRE 提供最丰富的特性：** `grep -P` 使用 libpcre 库，支持 `\d`（数字）、`\w`（单词字符）、`\s`（空白符）、环视断言、非贪婪匹配等高级特性。

**选择建议：**

| 场景 | 推荐引擎 | 原因 |
|------|----------|------|
| 简单字面量搜索 | `grep -F`（或 `fgrep`） | 不需要正则，固定字符串最快 |
| 一般正则搜索 | `grep -E`（或 `egrep`） | ERE 语法更自然，覆盖 90% 场景 |
| 需要 `\d`、`\s` 等简写 | `grep -P` | BRE/ERE 不支持这些 PCRE 简写 |
| 写脚本，追求兼容性 | `grep`（BRE） | 最大兼容性，所有系统都支持 |
| 在源码项目中搜索 | `rg`（ripgrep） | 更快、更智能的默认行为 |

### 2.3 grep 家族：grep、egrep、fgrep 的关系

在现代 GNU/Linux 系统中，`grep`、`egrep`、`fgrep` 实际上是**同一个二进制程序**，通过程序名称或参数切换行为：

```
┌──────────────┐
│   /usr/bin/grep  （GNU grep 二进制文件）    │
│                                          │
│   调用方式          │  等价于              │  正则引擎  │
│  ──────────────────┼─────────────────────┼────────────│
│   grep             │  grep -G            │  BRE       │
│   egrep            │  grep -E            │  ERE       │
│   fgrep            │  grep -F            │  无（固定字 │
│                    │                     │  符串）     │
└──────────────┘
```

```bash
# 验证它们确实是同一个程序的不同名称
ls -l /usr/bin/grep /usr/bin/egrep /usr/bin/fgrep
# 在 Ubuntu 24.04 上，egrep 和 fgrep 是指向 grep 的符号链接，
# 或者是由 grep 根据 argv[0]（程序名）判断行为的轻量包装脚本

# 三种等价写法
grep -E "error|warning" file.txt
egrep "error|warning" file.txt
# 以上两条完全相同

grep -F "192.168.1.[0-9]" file.txt
fgrep "192.168.1.[0-9]" file.txt
# 以上两条完全相同
```

**`egrep` 和 `fgrep` 仍然存在的原因：** 历史兼容性。许多老脚本和老管理员使用 `egrep` 和 `fgrep` 这两个命令名。在新的脚本中，建议使用 `grep -E` 和 `grep -F` 以提高可读性和明确性。

### 2.4 grep 在管道中的角色：智能滤网

`grep` 最常见的用法不是直接搜索文件，而是作为管道中的"中间过滤器"：

```
生成数据的命令 ──→ grep 过滤 ──→ 其他处理（排序、统计、输出）
     │                  │
     │                  └── 只放行匹配的行
     └── 可能产生大量输出
```

```bash
# 经典管道模式：过滤 + 进一步处理
ps aux | grep nginx                    # 在所有进程中找 nginx 相关进程
dmesg | grep -i error                   # 内核消息中的错误
history | grep git                       # 历史命令中的 git 相关操作
ip addr | grep "inet "                   # 网络接口中的 IPv4 地址
find /var/log -name "*.log" | xargs grep -l "ERROR"  # 哪些日志文件包含 ERROR
```

### 2.5 ripgrep (rg) 的设计哲学：更快、更智能的默认行为

`rg`（ripgrep）是由 Andrew Gallant（BurntSushi）用 Rust 语言重写的文本搜索工具。它的设计哲学是：**将 grep 的"最佳实践"作为默认行为。**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         grep  vs  rg  默认行为对比                          │
│                                                                            │
│  特性                │  grep                           │  rg               │
│  ────────────────────┼─────────────────────────────────┼───────────────────│
│  默认搜索方式        │  不递归（需要 -r）                │  默认递归搜索      │
│  隐藏文件            │  默认包含                        │  默认忽略          │
│  .gitignore          │  不读取                          │  自动遵守          │
│  二进制文件          │  默认尝试搜索（可能产生乱码）       │  默认跳过          │
│  颜色输出            │  --color=auto（通常由别名开启）     │  默认开启          │
│  大小写              │  默认区分                        │  智能大小写        │
│  搜索速度            │  单线程                          │  多线程并行        │
│  ────────────────────┼─────────────────────────────────┼───────────────────│
│  示例：搜索项目中的 TODO                                          │         │
│  grep  │  grep -rn "TODO" . --exclude-dir=.git --exclude="*.pyc"│         │
│  rg    │  rg "TODO"                          ← 默认合理行为      │         │
└────────────────────────────────────────────────────────────────────────────┘
```

`rg` 的"快"来自三个层面：
1. **Rust 语言本身的高性能**--零成本抽象、无 GC
2. **ripgrep 使用 Rust 的正则引擎（regex crate）**--基于有限自动机（Finite Automaton），在大量模式匹配场景下比 PCRE 更快
3. **并行目录遍历**--利用多核 CPU 同时搜索多个目录

在大型代码仓库（如 Linux 内核源码，超过 6 万个文件）中，`rg` 的搜索速度可以达到 `grep` 的 5-20 倍。

---

## 3. 命令详解

以下全部命令的示例，请打开终端逐一运行验证。

### 3.1 grep：GNU 正则表达式搜索工具

`grep` 在指定的文件（或标准输入）中搜索匹配指定模式的行，并将匹配行输出到标准输出。

**语法：**

```
grep [参数] <模式> [文件...]
```

**参数（完整列表共 20+ 个，以下为最常用参数）：**

| 参数 | 说明 | 必选/可选 | 默认值 |
|------|------|----------|--------|
| `-i` | 忽略大小写（Ignore case） | 可选 | 区分大小写 |
| `-v` | 反向匹配（Invert match）：输出**不**匹配模式的行 | 可选 | 输出匹配的行 |
| `-r` / `-R` | 递归搜索（Recursive）。`-R` 会跟随符号链接，`-r` 不会 | 可选 | 不递归 |
| `-n` | 在每行输出前显示行号（Line Number） | 可选 | 不显示行号 |
| `-l` | 仅输出包含匹配的**文件名**（Files with matches），不输出匹配的具体内容 | 可选 | 输出匹配行内容 |
| `-L` | 仅输出**不**包含匹配的文件名（Files without matches） | 可选 | 输出匹配行内容 |
| `-c` | 统计匹配行数（Count）。输出每文件的匹配行数而非匹配内容 | 可选 | 输出匹配行内容 |
| `-A <N>` | 显示匹配行及其**之后（After）** N 行上下文 | 可选 | 仅显示匹配行 |
| `-B <N>` | 显示匹配行及其**之前（Before）** N 行上下文 | 可选 | 仅显示匹配行 |
| `-C <N>` | 显示匹配行及其**前后（Context）** 各 N 行上下文 | 可选 | 仅显示匹配行 |
| `-E` | 使用**扩展正则表达式（Extended Regular Expression）** | 可选 | BRE（基本正则） |
| `-F` | 使用**固定字符串（Fixed Strings）**，不解析正则。等价于 `fgrep` | 可选 | BRE（基本正则） |
| `-G` | 使用**基本正则表达式（Basic Regular Expression）**--这是默认行为 | 可选 | BRE |
| `-P` | 使用**Perl 兼容正则表达式（Perl Compatible Regular Expression）** | 可选 | BRE |
| `-o` | 仅输出匹配的**部分**（Only matching），而非整行 | 可选 | 输出整行 |
| `-w` | 匹配**整个单词**（Word）。只匹配作为独立单词出现的模式 | 可选 | 匹配子串 |
| `-x` | 匹配**整行**（Line）。只有整行与模式完全一致才算匹配 | 可选 | 匹配行中子串 |
| `--color[=WHEN]` | 高亮显示匹配的文本。WHEN 取 `always`、`never`、`auto`（输出到终端时着色） | 可选 | `auto`（大多数发行版的别名设置） |
| `-q` | 安静模式（Quiet）：不输出任何内容，仅通过返回码指示是否找到匹配 | 可选 | 输出匹配内容 |
| `-s` | 静默模式（Suppress）：不显示关于不存在或不可读文件的错误信息 | 可选 | 显示错误信息 |
| `-h` | 多文件搜索时不显示文件名前缀（Hide filenames） | 可选 | 多文件时显示文件名 |
| `-H` | 即使搜索单个文件也显示文件名前缀 | 可选 | 单文件时不显示 |
| `-m <N>` | 在找到 N 个匹配行后停止读取（Max count） | 可选 | 读取到文件末尾 |
| `--include=<GLOB>` | 递归搜索时仅搜索匹配 GLOB 模式的文件 | 可选 | 搜索所有文件 |
| `--exclude=<GLOB>` | 递归搜索时排除匹配 GLOB 模式的文件 | 可选 | 不排除 |
| `--exclude-dir=<DIR>` | 递归搜索时排除匹配的目录 | 可选 | 不排除目录 |
| 模式（Pattern） | 要搜索的正则表达式或固定字符串。**必须指定** | 必选 | 无默认值 |
| 文件... | 要搜索的文件路径。可以指定多个。不指定时从标准输入读取 | 可选 | 标准输入 |

#### 3.1.1 grep 基础用法

```bash
# 准备练习用的文本文件
cat > /tmp/grep_demo.txt << 'EOF'
Hello World
hello world
HELLO WORLD
Welcome to Ubuntu 24.04
The quick brown fox jumps over the lazy dog
Error: Connection refused on port 8080
ERROR: Database query timeout (30s)
warning: Disk usage at 85%
This line has no keywords
192.168.1.100 - admin [29/Jul/2026:08:00:01 +0000] "GET /api/users HTTP/1.1" 200 1234
192.168.1.101 - user1 [29/Jul/2026:08:00:05 +0000] "POST /api/login HTTP/1.1" 401 89
192.168.1.102 - admin [29/Jul/2026:08:01:00 +0000] "GET /api/orders HTTP/1.1" 500 256
EOF

# 基本搜索：在文件中查找包含 "error" 的行
grep "error" /tmp/grep_demo.txt
# 输出：Error: Connection refused on port 8080
# 注意：默认区分大小写，"ERROR" 不会被匹配

# 在多个文件中搜索
grep "hello" /tmp/grep_demo.txt /etc/hostname
# 每个匹配行前会标注文件名
```

#### 3.1.2 `-i`：忽略大小写

```bash
# 默认：区分大小写
grep "error" /tmp/grep_demo.txt
# 输出：Error: Connection refused on port 8080

# -i：忽略大小写
grep -i "error" /tmp/grep_demo.txt
# 输出：
# Error: Connection refused on port 8080
# ERROR: Database query timeout (30s)
# 包含所有大小写变体：Error、ERROR、error
```

`-i` 是 `grep` 最常用的参数之一。在日志分析中，你通常不关心错误信息是 `Error`、`ERROR` 还是 `error`--用 `-i` 一次性捕获所有写法。

#### 3.1.3 `-v`：反向匹配

`-v` 是 `grep` 的"翻转模式"--输出**不**匹配的行。

```bash
# 排除空行（显示非空行）
grep -v "^$" /tmp/grep_demo.txt

# 排除注释行（以 # 开头的行）
grep -v "^#" /etc/ssh/sshd_config

# 排除不关心的内容：在进程列表中排除 grep 自身
ps aux | grep nginx | grep -v grep
# 如果不加 grep -v grep，grep 进程本身也会出现在结果中
```

**`grep -v grep` 技巧：** 当你用 `ps aux | grep <进程名>` 时，`grep` 命令本身也会出现在进程列表中（因为它的命令行参数包含了 `<进程名>`）。`| grep -v grep` 用于排除 grep 进程自身。

```bash
# 对比
ps aux | grep bash
# 输出包含 grep --color=auto bash 这一行（grep 自身）

ps aux | grep bash | grep -v grep
# 输出只包含真正的 bash 进程
```

#### 3.1.4 `-r` / `-R`：递归搜索

在目录中递归查找包含指定模式的文件：

```bash
# 在 /etc/nginx 中递归查找包含 "ssl" 的所有文件
grep -r "ssl" /etc/nginx/ 2>/dev/null

# 在 /var/log 中递归查找 "error"（忽略大小写）
grep -ri "error" /var/log/ 2>/dev/null | head -10

# -r 与 -R 的区别：-R 会跟随符号链接
grep -r "pattern" /path    # 不跟随符号链接
grep -R "pattern" /path    # 跟随符号链接
```

**配合 `--include` 和 `--exclude` 精确控制搜索范围：**

```bash
# 仅在 .log 文件中搜索
grep -r --include="*.log" "ERROR" /var/log/

# 排除 .gz 压缩文件
grep -r --exclude="*.gz" "ERROR" /var/log/

# 排除特定目录
grep -r --exclude-dir=".git" "TODO" ~/project/

# 组合使用：只在 .py 文件中搜索，排除 __pycache__ 目录
grep -r --include="*.py" --exclude-dir="__pycache__" "import os" ~/project/
```

#### 3.1.5 `-n`：显示行号

在输出中标注匹配行的行号：

```bash
grep -n "ERROR" /tmp/grep_demo.txt
# 输出：
# 7:ERROR: Database query timeout (30s)

grep -n "192.168" /tmp/grep_demo.txt
# 输出：
# 10:192.168.1.100 - admin ...
# 11:192.168.1.101 - user1 ...
# 12:192.168.1.102 - admin ...
```

`-n` 与 `less` 的配合非常实用：先用 `grep -n` 找到关键行的行号，再用 `less +<行号>` 打开文件浏览上下文。

```bash
# 工作流示例
grep -n "FATAL" /var/log/app.log
# 输出：245:FATAL: Server shutting down
less +245 /var/log/app.log
# less 打开文件并直接跳转到 245 行的上下文
```

#### 3.1.6 `-l` / `-L`：按文件输出

`-l` 只输出**包含**匹配的文件名，`-L` 只输出**不包含**匹配的文件名：

```bash
# 准备多个测试文件
echo "Contains the word network" > /tmp/grep_file1.txt
echo "No such word here" > /tmp/grep_file2.txt
echo "Another file with network config" > /tmp/grep_file3.txt

# -l：哪些文件包含 "network"
grep -l "network" /tmp/grep_file*.txt
# 输出：
# /tmp/grep_file1.txt
# /tmp/grep_file3.txt

# -L：哪些文件不包含 "network"
grep -L "network" /tmp/grep_file*.txt
# 输出：
# /tmp/grep_file2.txt
```

`-l` 在大型项目中非常有用--先快速定位哪些文件涉及某个关键词，再逐一检查：

```bash
# 场景：找出所有引用了 "deprecated_function" 的 Python 文件
grep -rl "deprecated_function" ~/project/src/ --include="*.py"
```

#### 3.1.7 `-c`：统计匹配行数

`-c` 不输出匹配内容，只输出每个文件中匹配行的数量：

```bash
# 统计 /tmp/grep_demo.txt 中包含 "error"（忽略大小写）的行数
grep -ci "error" /tmp/grep_demo.txt
# 输出：2

# 统计 /var/log/syslog 中包含 "Failed" 的行数
grep -c "Failed" /var/log/syslog 2>/dev/null

# 递归统计每个 .log 文件中包含 ERROR 的行数
grep -rc "ERROR" /var/log/ --include="*.log" 2>/dev/null
```

```bash
rm /tmp/grep_file1.txt /tmp/grep_file2.txt /tmp/grep_file3.txt
```

#### 3.1.8 `-A` / `-B` / `-C`：上下文行

这三个参数让你看到匹配行的"上下文"（Context）--这在日志分析中极其重要。

```bash
# 准备更丰富的测试数据
cat > /tmp/grep_context.txt << 'EOF'
line 1: Application starting
line 2: Loading config
line 3: Connecting to database
line 4: ERROR: Database connection failed
line 5: Retrying in 5 seconds
line 6: ERROR: Connection timeout
line 7: Falling back to cache
line 8: Application ready
line 9: Processing request
line 10: Request completed
EOF

# -A 2：显示匹配行及其后 2 行
grep -A 2 "ERROR" /tmp/grep_context.txt
# 输出：
# line 4: ERROR: Database connection failed
# line 5: Retrying in 5 seconds
# line 6: ERROR: Connection timeout    ← 第二个匹配也带上了后 2 行

# -B 2：显示匹配行及其前 2 行
grep -B 2 "ERROR" /tmp/grep_context.txt
# 输出：
# line 2: Loading config               ← 第一个匹配的前 2 行
# line 3: Connecting to database
# line 4: ERROR: Database connection failed
# line 4: ERROR: Database connection failed  ← 第二个匹配的前 2 行
# line 5: Retrying in 5 seconds
# line 6: ERROR: Connection timeout

# -C 2：显示匹配行及其前后各 2 行
grep -C 2 "ERROR" /tmp/grep_context.txt
# 输出包含每次 ERROR 前后各 2 行的完整上下文

# grep 在连续匹配之间用 "--" 分隔
```

**上下文参数的最佳实践：**

```bash
# 日志排查中最常用的组合：忽略大小写 + 行号 + 前后各 3 行 + 颜色
grep -in -C 3 "error" /var/log/syslog 2>/dev/null | head -30
```

```bash
rm /tmp/grep_context.txt
```

#### 3.1.9 `-E` / `-F` / `-P`：选择正则引擎

这是 `grep` 最核心的能力开关。你现在可以显式选择使用哪种正则引擎。

##### `-E`：扩展正则表达式（ERE）

ERE 将 `+`、`?`、`|`、`(`、`)`、`{`、`}` 默认作为正则操作符，无需转义：

```bash
# 准备测试数据
echo -e "apple\napplication\napartment\nbanana\ncherry\napricot" > /tmp/grep_ere.txt

# BRE 写法：需要转义 | 和 +
grep "apple\|apricot" /tmp/grep_ere.txt
grep "appl\+" /tmp/grep_ere.txt

# ERE 写法：更自然
grep -E "apple|apricot" /tmp/grep_ere.txt
# 输出：apple
#       apricot

grep -E "appl?e" /tmp/grep_ere.txt
# ? 表示前一个字符出现 0 次或 1 次
# 匹配 "apple"（l 出现 2 次？不，? 只作用于前一个 l）

# ERE 最常用的模式：匹配多个可选项
grep -E "ERROR|WARN|FATAL" /tmp/grep_demo.txt
# 匹配包含 ERROR、WARN 或 FATAL 的行

# 匹配一个或多个数字
grep -E "[0-9]+" /tmp/grep_demo.txt
# 匹配所有包含数字的行
```

##### `-F`：固定字符串（无正则）

当你搜索的字符串包含正则特殊字符（如 `.`、`*`、`[`、`]`）且你希望按**字面量**匹配时，使用 `-F`：

```bash
# 搜索 IP 地址中的字面量 [0-9]（非正则）
echo "The range is [0-9] in this document" > /tmp/grep_fixed.txt
echo "The number is 5" >> /tmp/grep_fixed.txt

# 不使用 -F：[ ] 被解释为正则字符类
grep "[0-9]" /tmp/grep_fixed.txt
# 输出两行都匹配（因为 "[0-9]" 是正则：匹配任何一个数字）

# 使用 -F：[ ] 被当作普通字符
grep -F "[0-9]" /tmp/grep_fixed.txt
# 只输出第一行（字面量匹配 "[0-9]"）

rm /tmp/grep_fixed.txt
```

**`-F` 的典型场景：**
- 搜索包含特殊字符的日志行：`grep -F "[ERROR]" app.log`
- 搜索文件路径：`grep -F "/usr/local/bin" script.sh`
- 搜索 SQL 语句中的模式：`grep -F "SELECT * FROM" query.log`
- 需要精确匹配时（性能也更好，因为无需解析正则）

##### `-P`：Perl 兼容正则表达式（PCRE）

`-P` 启用了 `grep` 中最强大的正则引擎，支持 BRE/ERE 不具备的特性：

```bash
# \d（数字）简写
grep -P "\d{3,}" /tmp/grep_demo.txt
# 匹配 3 个或更多连续数字

# \w（单词字符）简写
grep -P "\w+@\w+\.\w+" /tmp/grep_demo.txt
# 匹配类似 email 的模式

# \s（空白符）简写
grep -P "ERROR\s+:" /tmp/grep_demo.txt
# 匹配 ERROR（可能后跟空白）后面跟冒号的行

# 非贪婪匹配（ERE 不支持）
echo '<div>hello</div><div>world</div>' > /tmp/grep_pcre.txt
grep -P '<div>.*?</div>' /tmp/grep_pcre.txt
# -o 配合使用，非贪婪匹配每个 <div> 标签
grep -Po '<div>.*?</div>' /tmp/grep_pcre.txt
# 输出：<div>hello</div>
#       <div>world</div>
# 如果是贪婪匹配（ERE）：<div>hello</div><div>world</div>（一次性全匹配）

rm /tmp/grep_pcre.txt /tmp/grep_ere.txt
```

**PCRE 独有特性速查：**

| PCRE 特性 | 语法示例 | 说明 | BRE/ERE 替代方案 |
|-----------|---------|------|-----------------|
| 数字简写 | `\d` | 等价于 `[0-9]` | `[0-9]` |
| 非数字 | `\D` | 等价于 `[^0-9]` | `[^0-9]` |
| 单词字符 | `\w` | 等价于 `[a-zA-Z0-9_]` | `[a-zA-Z0-9_]` |
| 非单词字符 | `\W` | 等价于 `[^a-zA-Z0-9_]` | `[^a-zA-Z0-9_]` |
| 空白符 | `\s` | 等价于 `[ \t\n\r\f\v]` | `[[:space:]]` |
| 非空白符 | `\S` | 等价于 `[^ \t\n\r\f\v]` | `[^[:space:]]` |
| 单词边界 | `\b` | 单词的开头或结尾 | `\<` / `\>` （ERE） |
| 非单词边界 | `\B` | 不在单词边界处 | 无直接替代 |
| 非贪婪匹配 | `.*?` | 尽可能少匹配 | 无直接替代 |
| 正向前瞻 | `(?=...)` | 后面必须跟随... | 无直接替代 |
| 负向前瞻 | `(?!...)` | 后面不能跟随... | 无直接替代 |
| 正向后顾 | `(?<=...)` | 前面必须是... | 无直接替代 |
| 负向后顾 | `(?<!...)` | 前面不能是... | 无直接替代 |

```bash
# PCRE 环视（Lookaround）示例
echo -e "abc123\ndef456\nxyz789\nabc000" > /tmp/grep_look.txt

# 正向前瞻：匹配后面跟数字的 "abc"
grep -P "abc(?=\d)" /tmp/grep_look.txt
# 匹配 abc123 和 abc000（abc 后面跟了数字）

# 正向后顾：匹配前面是 "abc" 的数字
grep -Po "(?<=abc)\d+" /tmp/grep_look.txt
# 输出：123
#       000

rm /tmp/grep_look.txt
```

**PCRE 注意事项：**

- `-P` 是 GNU grep 的扩展，**不是 POSIX 标准**。在非 GNU 系统（如 macOS 的 BSD grep）上不可用。
- `-P` 依赖 libpcre 库。在极简容器环境中，libpcre 可能未安装导致 `-P` 失效。
- 如果在可移植脚本中使用了 `grep -P`，建议添加依赖检查或使用 ERE 替代。

#### 3.1.10 `-o`：仅输出匹配部分

默认情况下，`grep` 输出匹配的整行。`-o` 改为只输出匹配到的子串：

```bash
# 从日志中提取所有 IP 地址
grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" /tmp/grep_demo.txt
# 输出：
# 192.168.1.100
# 192.168.1.101
# 192.168.1.102

# 从日志中提取所有 HTTP 状态码
grep -oE ' [0-9]{3} ' /tmp/grep_demo.txt
# 输出：200、401、500

# 提取所有 email 地址（如果存在）
grep -oP '[\w.]+@[\w.]+' /var/log/mail.log 2>/dev/null

# 提取引号中的内容
grep -oE '"[^"]*"' /tmp/grep_demo.txt
# 输出引号内的内容
```

`-o` 将 `grep` 从"查找匹配行"升级为"**提取匹配内容**"--这在数据预处理阶段非常实用。

#### 3.1.11 `-w`：整词匹配

`-w` 要求模式作为**独立的单词（Word）**出现。单词的边界由非单词字符界定（字母、数字、下划线之外）：

```bash
# 准备测试
echo -e "error\nnetwork error\nerrors\nerror-prone\nmy_error" > /tmp/grep_word.txt

# 默认：子串匹配（匹配任何包含 "error" 的行）
grep "error" /tmp/grep_word.txt
# 输出全部 5 行（每行都包含 "error" 子串）

# -w：整词匹配（只匹配 "error" 作为独立单词的行）
grep -w "error" /tmp/grep_word.txt
# 输出：
# error
# network error
# 不匹配 errors、error-prone、my_error

rm /tmp/grep_word.txt
```

**`-w` 的典型场景：**
- 搜索日志中的 `ERROR` 级别（排除变量名中碰巧含有 "error" 的行）
- 搜索变量名 `port`（排除 `report`、`transport`、`portfolio` 等包含 "port" 但不是该变量的词）
- 搜索缩写 `AI`（排除 `MAIL`、`RAID`、`TRAIN` 等包含 "ai" 但与 AI 无关的词）

#### 3.1.12 `-x`：整行匹配

`-x` 要求整行完全匹配模式（而非行中某处出现即可）：

```bash
# 准备测试
echo -e "hello\nhello world\nhello\nHELLO\nsay hello" > /tmp/grep_line.txt

# 默认：子串匹配
grep "hello" /tmp/grep_line.txt
# 输出 4 行（除 HELLO 外的所有行）

# -x：整行匹配
grep -x "hello" /tmp/grep_line.txt
# 只输出恰好为 "hello" 的行（第 1 行和第 3 行）

# -x 配合 -i
grep -ix "hello" /tmp/grep_line.txt
# 输出恰好为 "hello"（忽略大小写）的行

rm /tmp/grep_line.txt
```

#### 3.1.13 `--color`：高亮匹配文本

`--color` 让匹配的文本在终端中以彩色显示，极大提升可读性：

```bash
# always：始终输出颜色代码
grep --color=always "ERROR" /tmp/grep_demo.txt

# auto：仅在输出到终端时着色（管道输出时不着色）
grep --color=auto "ERROR" /tmp/grep_demo.txt

# never：不着色
grep --color=never "ERROR" /tmp/grep_demo.txt
```

在 Ubuntu 24.04 中，`grep` 的颜色已通过 Shell 别名自动配置：

```bash
alias grep
# 通常显示：alias grep='grep --color=auto'
```

这意味着你在终端中使用 `grep` 时已经默认获得了高亮效果。但当你尝试将 `grep` 的输出通过管道传给其他命令，且需要保留颜色时，需要使用 `--color=always`：

```bash
# 带颜色的 grep 输出传给 less -R 分页浏览
grep --color=always "ERROR" /var/log/syslog 2>/dev/null | less -R
```

#### 3.1.14 `-q`：安静模式（用于脚本判断）

`-q` 不输出任何内容，仅通过返回码（Exit Code）指示是否找到匹配：

```bash
# 检查文件是否包含某关键词
if grep -q "ERROR" /tmp/grep_demo.txt; then
    echo "文件包含 ERROR"
else
    echo "文件不包含 ERROR"
fi

# 检查某个包是否已安装（在脚本中常用）
if dpkg -l | grep -q "^ii.*nginx"; then
    echo "nginx 已安装"
else
    echo "nginx 未安装"
fi
```

#### 3.1.15 `-m <N>`：限制匹配数量

在找到 N 个匹配行后立即停止搜索：

```bash
# 只获取前 5 条包含 "error" 的日志行
grep -i -m 5 "error" /var/log/syslog 2>/dev/null
```

在大文件中搜索时，`-m` 可以避免不必要地遍历整个文件，节省时间。

---

### 3.2 egrep 与 fgrep：便捷别名

`egrep` 和 `fgrep` 在现代 GNU 系统中是 `grep` 的同源命令（同一程序的不同调用方式）。

#### 3.2.1 egrep（grep -E）

```bash
# 三种等价写法
grep -E "ERROR|WARN|FATAL" /tmp/grep_demo.txt
egrep "ERROR|WARN|FATAL" /tmp/grep_demo.txt
grep --extended-regexp "ERROR|WARN|FATAL" /tmp/grep_demo.txt

# 验证它们输出完全相同
diff <(grep -E "ERROR|WARN" /tmp/grep_demo.txt) <(egrep "ERROR|WARN" /tmp/grep_demo.txt)
# 无差异（无输出）
```

**建议：** 在新脚本中使用 `grep -E` 而非 `egrep`。`grep -E` 明确地表示你选择了 ERE 引擎，而 `egrep` 的命名暗示它是一个"不同的程序"而非仅仅一个参数开关。

#### 3.2.2 fgrep（grep -F）

```bash
# fgrep 将模式中的每个字符都视为字面量（Literal）
fgrep "192.168.1.[0-9]" /tmp/grep_demo.txt
# [0-9] 被当作普通字符，不是正则字符类
# 结果：不会匹配任何行（因为没有字面量 "[0-9]"）

# 等价于
grep -F "192.168.1.[0-9]" /tmp/grep_demo.txt

# fgrep 的性能优势：不需要编译正则表达式，直接进行字符串匹配
# 当你不需要正则时，fgrep（grep -F）是最快的选择
```

**`fgrep` 的最佳场景：**

```bash
# 从文件中读取匹配模式列表（每个模式是固定的字符串）
# 假设有一个黑名单文件
echo -e "192.168.1.100\n10.0.0.5\n172.16.0.1" > /tmp/blacklist.txt

# 使用 fgrep 从日志中查找黑名单 IP
fgrep -f /tmp/blacklist.txt /tmp/grep_demo.txt

rm /tmp/blacklist.txt
```

---

### 3.3 rg（ripgrep）：下一代文本搜索工具

ripgrep（命令名 `rg`）是 grep 的现代替代品，用 Rust 编写，速度快、默认行为更智能。

#### 3.3.1 安装 rg

```bash
# Ubuntu 24.04 中直接通过 apt 安装
sudo apt update && sudo apt install -y ripgrep

# 验证安装
rg --version
# 输出类似：ripgrep 14.x.x
```

#### 3.3.2 rg 基础用法

```bash
# 在当前目录递归搜索 "TODO"（默认行为：递归、忽略 .gitignore）
rg "TODO" ~/project/ 2>/dev/null || echo "尚未创建项目目录"

# 默认显示文件名 + 行号 + 匹配行（带颜色）
rg "ERROR" /tmp/grep_demo.txt
# 输出：
# /tmp/grep_demo.txt
# 7:ERROR: Database query timeout (30s)

# 与 grep 的差异——不需要 -r 就能递归
rg "pattern" /path/to/dir   # 默认递归搜索目录
grep -r "pattern" /path/to/dir   # 需要显式 -r
```

#### 3.3.3 rg 的核心优势

##### 优势 1：速度（多线程并行 + 高效正则引擎）

```bash
# 在大项目中搜索
# grep（单线程）
# time grep -r "TODO" ~/large-project/ 2>/dev/null

# rg（多线程）
# time rg "TODO" ~/large-project/
# 通常在大型项目中有 5-20 倍的性能差距
```

##### 优势 2：智能默认行为

```bash
# rg 默认忽略的内容（无需手动指定 --exclude）：
#   1. 隐藏文件和隐藏目录（以 . 开头的目录）
#   2. .gitignore 中指定的文件
#   3. 二进制文件
#   4. 符号链接
#
# grep 需要这样达到类似效果：
# grep -r --exclude-dir=.git --exclude-dir=node_modules --exclude="*.pyc" "TODO" .

# rg 只需：
rg "TODO" .
```

##### 优势 3：智能大小写

```bash
# rg 默认使用智能大小写（Smart Case）：
# 模式全是小写 → 不区分大小写
# 模式包含大写 → 区分大小写

rg "error" /tmp/grep_demo.txt          # 匹配 error, Error, ERROR
rg "Error" /tmp/grep_demo.txt          # 只匹配 Error（不匹配 error 或 ERROR）

# 强制区分大小写：使用 -s（--case-sensitive）
rg -s "error" /tmp/grep_demo.txt       # 只匹配小写 error
```

##### 优势 4：自动过滤二进制文件

```bash
# grep 尝试搜索二进制文件时可能产生乱码输出
grep "pattern" /bin/ls
# 输出：Binary file /bin/ls matches

# rg 默认跳过二进制文件，无干扰输出
rg "pattern" /bin/ls
# 无输出、无警告
```

##### 优势 5：丰富的输出格式

```bash
# JSON 格式输出（适合机器解析）
rg --json "ERROR" /tmp/grep_demo.txt 2>/dev/null

# 只输出匹配的文件名
rg -l "ERROR" /tmp/grep_demo.txt

# 只输出匹配数量
rg -c "ERROR" /tmp/grep_demo.txt

# 输出匹配的次数（而非行数）——rg 特有
rg --count-matches "ERROR" /tmp/grep_demo.txt
```

##### 优势 6：替换功能（rg 特有）

ripgrep 内置了替换功能（`-r` 参数），这是 `grep` 不具备的能力（`grep` 只能搜索，替换需要 `sed`）：

```bash
# 预览替换（不实际修改文件）
rg "ERROR" -r "CRITICAL_ERROR" /tmp/grep_demo.txt
# 显示替换前后的对比

# 实际替换（仅演示语法，不实际执行以避免修改练习文件）
# rg "ERROR" -r "CRITICAL_ERROR" /tmp/grep_demo.txt --passthrough
```

#### 3.3.4 rg 常用参数对照表

| 功能 | grep | rg | 说明 |
|------|------|----|------|
| 忽略大小写 | `-i` | `-i` | 相同 |
| 反向匹配 | `-v` | `-v` | 相同 |
| 递归搜索 | `-r` | 默认 | rg 默认递归 |
| 显示行号 | `-n` | 默认 | rg 默认显示行号 |
| 仅输出文件名 | `-l` | `-l` | 相同 |
| 统计行数 | `-c` | `-c` | 相同 |
| 上下文行 | `-A/-B/-C` | `-A/-B/-C` | 相同 |
| 整词匹配 | `-w` | `-w` | 相同 |
| 整行匹配 | `-x` | `-x` | 相同 |
| 扩展正则（ERE） | `-E` | 默认 | rg 默认 ERE |
| 固定字符串 | `-F` | `-F` | 相同 |
| PCRE 正则 | `-P` | `-P` | 相同 |
| 仅匹配部分 | `-o` | `-o` | 相同 |
| 隐藏文件 | 默认包含 | `-.` 或 `--hidden` | rg 默认排除隐藏文件 |
| 二进制文件 | 默认搜索 | 默认跳过 | rg 更安全 |
| 遵守 .gitignore | 否 | 是 | rg 的核心优势 |
| 多线程 | 否 | 是 | rg 的核心优势 |
| 替换功能 | 无 | `-r` | rg 特有 |

```bash
# rg 常用命令示例
# 在项目中搜索，包含隐藏文件
rg --hidden "TODO" .

# 在项目中搜索所有文件（包括 .gitignore 中的）
rg --no-ignore "TODO" .

# 搜索所有文件，包括隐藏文件和被 .gitignore 忽略的文件
rg --no-ignore --hidden "TODO" .

# 限定文件类型
rg -t py "import os" .          # 只在 Python 文件中搜索
rg -T py "import os" .          # 排除 Python 文件
rg -g "*.{js,ts}" "TODO" .      # 使用 glob 模式限定文件
```

---

## 4. 实战练习

### 准备练习环境

```bash
# 创建练习用工作目录
mkdir -p ~/ch11-practice
cd ~/ch11-practice

# 创建模拟的 Web 服务器访问日志（Apache/Nginx 通用格式）
cat > access.log << 'EOF'
192.168.1.10 - - [29/Jul/2026:08:00:01 +0000] "GET /index.html HTTP/1.1" 200 2326
192.168.1.20 - - [29/Jul/2026:08:00:02 +0000] "POST /api/login HTTP/1.1" 200 128
10.0.0.5 - admin [29/Jul/2026:08:00:03 +0000] "GET /admin/dashboard HTTP/1.1" 200 5432
192.168.1.10 - - [29/Jul/2026:08:00:05 +0000] "GET /images/logo.png HTTP/1.1" 304 0
192.168.1.30 - - [29/Jul/2026:08:00:10 +0000] "POST /api/upload HTTP/1.1" 500 89
10.0.0.5 - admin [29/Jul/2026:08:00:15 +0000] "GET /admin/users HTTP/1.1" 200 1289
192.168.1.10 - - [29/Jul/2026:08:01:00 +0000] "GET /api/users?page=1 HTTP/1.1" 200 3456
192.168.1.20 - - [29/Jul/2026:08:01:05 +0000] "DELETE /api/sessions/abc123 HTTP/1.1" 204 0
10.0.0.5 - admin [29/Jul/2026:08:01:10 +0000] "GET /admin/settings HTTP/1.1" 403 45
192.168.1.30 - - [29/Jul/2026:08:01:15 +0000] "GET /api/orders HTTP/1.1" 500 156
192.168.1.10 - - [29/Jul/2026:08:02:00 +0000] "GET /favicon.ico HTTP/1.1" 404 52
192.168.1.20 - - [29/Jul/2026:08:02:05 +0000] "GET /api/products HTTP/1.1" 200 8921
10.0.0.5 - admin [29/Jul/2026:08:02:10 +0000] "POST /admin/users HTTP/1.1" 201 234
EOF

# 创建模拟的应用日志
cat > app.log << 'EOF'
2026-07-29 08:00:00 INFO  [main] Application starting on 0.0.0.0:8080
2026-07-29 08:00:01 INFO  [main] Database connection pool initialized (max=50)
2026-07-29 08:00:01 DEBUG [main] Loading configuration from /etc/app/config.yml
2026-07-29 08:00:02 INFO  [main] Redis cache connected at redis://localhost:6379
2026-07-29 08:00:02 DEBUG [main] Session store: redis, TTL=3600s
2026-07-29 08:00:03 INFO  [main] HTTP server listening on port 8080
2026-07-29 08:15:22 WARN  [http-nio-8080-exec-1] Slow request: GET /api/reports (2534ms)
2026-07-29 08:15:25 INFO  [http-nio-8080-exec-2] Request: GET /api/users completed in 45ms
2026-07-29 08:30:45 ERROR [http-nio-8080-exec-3] Database query timeout: SELECT * FROM orders WHERE status='pending'
2026-07-29 08:30:46 ERROR [http-nio-8080-exec-3] Database connection pool exhausted (50/50), retrying...
2026-07-29 08:30:51 ERROR [http-nio-8080-exec-3] Database connection pool still exhausted, attempt 2/3
2026-07-29 08:30:56 WARN  [http-nio-8080-exec-3] Database recovery: 2 connections dropped, pool restored
2026-07-29 08:31:00 INFO  [http-nio-8080-exec-3] Operation retry succeeded after 15s
2026-07-29 09:00:00 INFO  [scheduler-1] Starting daily report generation
2026-07-29 09:00:15 INFO  [scheduler-1] Report generated: /var/reports/daily_2026-07-29.pdf (size: 2.3MB)
2026-07-29 09:30:01 FATAL [main] OutOfMemoryError: Cannot allocate 256MB for image buffer
2026-07-29 09:30:01 FATAL [main] Server shutting down due to unrecoverable error
2026-07-29 09:30:02 INFO  [main] Shutdown hook: closing database connections
2026-07-29 09:30:02 INFO  [main] Shutdown hook: flushing pending logs
2026-07-29 09:30:03 INFO  [main] Application terminated
EOF

# 创建源代码文件（模拟项目）
mkdir -p src/{api,models,utils}
cat > src/api/server.py << 'EOF'
"""
TODO: Add authentication middleware
TODO: Implement rate limiting
FIXME: Handle edge case for empty request body
"""
import os
import sys

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

def start_server(host="0.0.0.0", port=8080):
    """Start the HTTP server."""
    # TODO: Add SSL/TLS support
    print(f"Server starting on {host}:{port}")
    # FIXME: Graceful shutdown not implemented
    pass

def handle_request(request):
    """Process an incoming HTTP request."""
    # TODO: Add request validation
    if not request:
        return None
    return {"status": "ok"}
EOF

cat > src/api/auth.py << 'EOF'
import hashlib
import os

# TODO: Replace SHA256 with bcrypt for password hashing
def hash_password(password: str) -> str:
    """Hash a password using SHA256."""
    salt = os.urandom(32)
    return hashlib.sha256(salt + password.encode()).hexdigest()

# FIXME: Token expiration not enforced
def verify_token(token: str) -> bool:
    """Verify an authentication token."""
    # TODO: Implement proper JWT verification
    return len(token) > 0
EOF

cat > src/utils/config.py << 'EOF'
import json
import os

# TODO: Add support for YAML config files
# TODO: Add environment variable override
# FIXME: Default config path is hardcoded
CONFIG_PATH = "/etc/app/config.json"

def load_config():
    """Load application configuration."""
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Config not found: {CONFIG_PATH}")
    with open(CONFIG_PATH) as f:
        return json.load(f)
EOF

# 创建更多测试文件
mkdir -p data
cat > data/whitelist.txt << 'EOF'
192.168.1.10
192.168.1.20
10.0.0.5
EOF

cat > data/blacklist.txt << 'EOF'
192.168.1.30
172.16.0.100
10.0.0.99
5.6.7.8
EOF

# 创建一个带特殊字符的测试文件
cat > special_chars.txt << 'EOF'
normal line
line with [brackets] and dots...
A line with asterisks *** and plus +++ signs.
line with (parentheses) and {braces}
Special regex chars: . * + ? [ ] ( ) { } | ^ $
Escaped: \. \* \+ \? \[ \] \( \) \{ \} \| \^ \$
Email: user@example.com
IP: 192.168.1.1
Path: /usr/local/bin/app
EOF

# 确认所有文件已创建
find ~/ch11-practice -type f | sort
```

---

### 练习 11.1：grep 基础匹配与大小写

**题目：**

（1）在 `app.log` 中搜索所有包含 `error` 的行（区分大小写）。记录找到了几条。

（2）使用 `-i` 参数再次搜索 `error`（忽略大小写）。比较两次结果的差异。

（3）搜索 `FATAL`，查看有多少条致命错误。

（4）使用 `-c` 统计 `app.log` 中 INFO、WARN、ERROR、FATAL 四个级别各出现了几次。

**答案：**

（1）：

```bash
grep "error" ~/ch11-practice/app.log
# 输出：无（app.log 中使用的是大写 ERROR，小写 error 不会被匹配）
```

（2）：

```bash
grep -i "error" ~/ch11-practice/app.log
# 输出包含所有 ERROR 行（3 条）和 OutOfMemoryError 行（1 条）
# 共 4 条结果
```

（3）：

```bash
grep "FATAL" ~/ch11-practice/app.log
# 输出 2 条 FATAL 行
```

（4）：

```bash
grep -c "INFO" ~/ch11-practice/app.log
grep -c "WARN" ~/ch11-practice/app.log
grep -c "ERROR" ~/ch11-practice/app.log
grep -c "FATAL" ~/ch11-practice/app.log
# 或者用一行循环
for level in INFO WARN ERROR FATAL; do
    count=$(grep -c "$level" ~/ch11-practice/app.log)
    echo "$level: $count"
done
# 预期输出：
# INFO: 10
# WARN: 2
# ERROR: 3
# FATAL: 2
```

---

### 练习 11.2：grep 上下文与行号

**题目：**

（1）在 `app.log` 中查找 "Database"，显示匹配行的行号。

（2）查找第一次出现 "ERROR" 的行，显示该行及其前 2 行和后 3 行的上下文。

（3）查找 "FATAL" 行，显示其前后各 5 行的上下文。观察应用崩溃前后的日志信息。

（4）使用 `-n` 和 `-C 1` 同时显示行号和上下文。

**答案：**

（1）：

```bash
grep -n "Database" ~/ch11-practice/app.log
# 输出：
# 2:2026-07-29 08:00:01 INFO  [main] Database connection pool initialized (max=50)
# 9:2026-07-29 08:30:45 ERROR [http-nio-8080-exec-3] Database query timeout: ...
# 10:2026-07-29 08:30:46 ERROR [http-nio-8080-exec-3] Database connection pool exhausted ...
# 11:2026-07-29 08:30:51 ERROR [http-nio-8080-exec-3] Database connection pool still ...
# 12:2026-07-29 08:30:56 WARN  [http-nio-8080-exec-3] Database recovery: ...
```

（2）：

```bash
grep -m 1 -B 2 -A 3 "ERROR" ~/ch11-practice/app.log
# -m 1 限制只处理第一个匹配
# 输出 ERROR 第一次出现及其前后上下文
```

（3）：

```bash
grep -C 5 "FATAL" ~/ch11-practice/app.log
# 崩溃前 5 行 → FATAL → 崩溃后 5 行
# 可以看到崩溃前后系统尝试了哪些恢复操作
```

（4）：

```bash
grep -n -C 1 "ERROR" ~/ch11-practice/app.log
# 每行前显示行号，每个 ERROR 行前后各显示 1 行上下文
```

---

### 练习 11.3：正则引擎选择（BRE vs ERE vs PCRE）

**题目：**

（1）使用 BRE（默认）搜索包含 "error" 或 "ERROR" 或 "Error" 的行。观察使用 `\|` 转义的写法。

（2）使用 ERE（`-E`）做同样的搜索。比较语法的差异。

（3）使用 ERE 匹配日志中的时间戳格式 `HH:MM:SS`（如 `08:30:45`）。提示：`[0-9]{2}:[0-9]{2}:[0-9]{2}`

（4）使用 PCRE（`-P`）的 `\d` 简写匹配同样的时间戳，并比较与 ERE 写法的差异。

（5）使用 ERE 在一条命令中匹配 INFO、WARN、ERROR、FATAL 四种日志级别。

**答案：**

（1）：

```bash
grep "error\|ERROR\|Error" ~/ch11-practice/app.log
# BRE 中 | 需要转义为 \|
# 仅匹配恰好包含 "error"、"ERROR" 或 "Error" 的行
```

（2）：

```bash
grep -E "error|ERROR|Error" ~/ch11-practice/app.log
# ERE 中 | 不需要转义，写法更自然

# 更好的写法：结合 -i 忽略大小写
grep -iE "error" ~/ch11-practice/app.log
# 等价但更简洁
```

（3）：

```bash
grep -oE "[0-9]{2}:[0-9]{2}:[0-9]{2}" ~/ch11-practice/app.log
# 提取所有时间戳
# {2} 在 ERE 中不需要转义
```

（4）：

```bash
grep -oP "\d{2}:\d{2}:\d{2}" ~/ch11-practice/app.log
# \d 等价于 [0-9]，写法更简洁
# 输出与 (3) 完全相同
```

（5）：

```bash
grep -E "INFO|WARN|ERROR|FATAL" ~/ch11-practice/app.log
# 或者更精确：只匹配日志级别字段
grep -E "\b(INFO|WARN|ERROR|FATAL)\b" ~/ch11-practice/app.log
# \b 是单词边界，避免匹配变量名中的这些词
```

---

### 练习 11.4：反向匹配、整词与整行

**题目：**

（1）在 `app.log` 中排除所有包含 DEBUG 的行，只显示有效的日志信息。

（2）在 `special_chars.txt` 中搜索 `[brackets]`。先不用 `-F`，再用 `-F`。观察差异。

（3）使用 `-w` 在 `app.log` 中匹配整词 `error`（忽略大小写）。比较带 `-w` 和不带 `-w` 的结果差异。

（4）在 `src/` 目录中搜索以 `# TODO` 开头的行（整行以注释开头）。提示：使用 `^# TODO` 作为模式。

**答案：**

（1）：

```bash
grep -v "DEBUG" ~/ch11-practice/app.log
# 输出所有不包含 DEBUG 的行。DEBUG 行被过滤掉
```

（2）：

```bash
# 不用 -F：[brackets] 中的 [ 和 ] 被解释为正则字符类
echo "=== 默认（BRE） ==="
grep "brackets" ~/ch11-practice/special_chars.txt
# 能匹配（因为搜索的是 "brackets"，没有特殊字符）

echo "=== 搜索 [brackets] 不带 -F ==="
grep "[brackets]" ~/ch11-practice/special_chars.txt
# [brackets] 被解释为匹配 b, r, a, c, k, e, t, s 中任意一个字符的行！
# 可能匹配到了非预期的行

echo "=== 搜索 [brackets] 带 -F ==="
grep -F "[brackets]" ~/ch11-practice/special_chars.txt
# 字面量匹配 "[brackets]"，只匹配第 2 行
```

（3）：

```bash
echo "=== 不带 -w ==="
grep -i "error" ~/ch11-practice/app.log
# 匹配：ERROR（3 行）、OutOfMemoryError（1 行，因为 "error" 是子串）
# 共 4 行

echo "=== 带 -w ==="
grep -iw "error" ~/ch11-practice/app.log
# 只匹配整词 "ERROR"（3 行）
# OutOfMemoryError 不匹配（"error" 不是独立单词）
```

（4）：

```bash
grep -rn "^# TODO" ~/ch11-practice/src/
# ^ 表示行首，# 表示字面量 # 号，空格，然后 TODO
# 匹配以 "# TODO" 开头的注释行
```

---

### 练习 11.5：-o 提取与 -l 文件定位

**题目：**

（1）从 `access.log` 中提取所有 IP 地址。使用 `-o` 配合适当的正则。

（2）从 `access.log` 中提取所有 HTTP 状态码（200、404、500 等）。统计每种状态码出现的次数（提示：`sort | uniq -c`）。

（3）统计 `access.log` 中所有请求传输的总字节数（最后一个字段）。提示：使用 `awk` 或只提取数字再求和。

（4）在 `src/` 目录中递归查找哪些 Python 文件包含 `TODO`，只输出文件名。

（5）在 `src/` 目录中递归查找哪些文件**不**包含 `TODO`，只输出文件名。

**答案：**

（1）：

```bash
grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" ~/ch11-practice/access.log | sort -u
# sort -u 去重，显示所有出现过的唯一 IP
```

（2）：

```bash
grep -oE ' [0-9]{3} ' ~/ch11-practice/access.log | sort | uniq -c
# 输出类似：
#       2  200
#       1  201
#       1  204
#       1  304
#       1  403
#       1  404
#       2  500
```

（3）：

```bash
# 方法 1：grep + awk
grep -oE '[0-9]+$' ~/ch11-practice/access.log | paste -sd+ | bc
# 输出总字节数

# 方法 2：直接用 awk
awk '{sum += $NF} END {print sum}' ~/ch11-practice/access.log
```

（4）：

```bash
grep -rl "TODO" ~/ch11-practice/src/
# -r 递归，-l 只输出文件名
# 预期输出所有 3 个 .py 文件（它们都包含 TODO）
```

（5）：

```bash
grep -rL "TODO" ~/ch11-practice/src/
# -L 输出不包含匹配的文件名
# 预期无输出（3 个 .py 文件都包含 TODO）
```

---

### 练习 11.6：grep 管道组合

**题目：**

（1）查看当前系统中所有与 "ssh" 相关的进程（使用 `ps aux | grep`，并排除 grep 自身）。

（2）查看 `/etc/passwd` 中哪些用户使用 `/bin/bash` 作为默认 Shell。使用 `grep` 统计数量。

（3）使用 `history | grep` 查看你最近执行过的 `apt` 相关命令。

（4）使用 `grep` 配合 `wc -l` 统计 `access.log` 中有多少个 500 错误（状态码为 500 的请求）。

**答案：**

（1）：

```bash
ps aux | grep ssh | grep -v grep
# 或者使用正则技巧
ps aux | grep "[s]sh"
# [s]sh 匹配 ssh 但不匹配 grep 进程本身（因为 ps 输出中 grep 的参数是 "[s]sh" 而非 "ssh"）
```

（2）：

```bash
grep "/bin/bash" /etc/passwd
# 列出所有使用 bash 的用户

grep -c "/bin/bash" /etc/passwd
# 统计数量
```

（3）：

```bash
history | grep "apt"
# 或
history | grep -E "apt|apt-get"
```

（4）：

```bash
grep -c '" 500 ' ~/ch11-practice/access.log
# 注意空格，确保匹配的是状态码 500 而不是响应大小中的 500
```

---

### 练习 11.7：fgrep 固定字符串搜索

**题目：**

（1）`special_chars.txt` 中包含特殊正则字符。使用 `fgrep` 搜索字面量字符串 `* + ?`（中间有空格）。不用 `fgrep` 会怎样？

（2）使用 `fgrep -f` 从 `data/blacklist.txt` 中读取黑名单 IP，在 `access.log` 中查找匹配的请求。哪些 IP 在黑名单中？

（3）比较 `grep`、`grep -F`、`fgrep` 在对纯文本（无正则特殊字符）搜索时的性能。使用 `time` 命令。

**答案：**

（1）：

```bash
# fgrep 将 * + ? 视为普通字符
fgrep "* + ?" ~/ch11-practice/special_chars.txt
# 输出：
# A line with asterisks *** and plus +++ signs.
# Special regex chars: . * + ? [ ] ( ) { } | ^ $

# 不用 fgrep（grep 默认 BRE）：
grep "* + ?" ~/ch11-practice/special_chars.txt
# * 被解释为"前一个字符重复零次或多次"，产生不可预期的结果
```

（2）：

```bash
fgrep -f ~/ch11-practice/data/blacklist.txt ~/ch11-practice/access.log
# 输出：
# 192.168.1.30 - - [29/Jul/2026:08:00:10 +0000] "POST /api/upload HTTP/1.1" 500 89
# 192.168.1.30 - - [29/Jul/2026:08:01:15 +0000] "GET /api/orders HTTP/1.1" 500 156
# IP 192.168.1.30 在黑名单中，且发起了两次请求（都返回了 500 错误）
```

（3）：

```bash
# 生成一个大文本文件用于性能测试
for i in $(seq 1 100000); do echo "line $i: some text data here"; done > /tmp/perf_test.txt
echo "target_string_to_find" >> /tmp/perf_test.txt

echo "=== grep (BRE) ==="
time grep "target_string_to_find" /tmp/perf_test.txt > /dev/null

echo "=== grep -F ==="
time grep -F "target_string_to_find" /tmp/perf_test.txt > /dev/null

echo "=== fgrep ==="
time fgrep "target_string_to_find" /tmp/perf_test.txt > /dev/null

rm /tmp/perf_test.txt
# grep -F / fgrep 通常比 grep (BRE) 稍快，因为不需要编译正则
```

---

### 练习 11.8：rg (ripgrep) 入门

**题目：**

（1）确认 ripgrep 已安装。如果未安装，使用 `sudo apt install -y ripgrep` 安装。

（2）使用 `rg` 在 `src/` 中搜索 `TODO`。注意观察输出格式与 `grep` 的差异。

（3）使用 `rg` 在 `src/` 中搜索 `FIXME`，比较输出与 `grep -rn "FIXME" src/` 的差异。

（4）使用 `rg --type-list` 查看 rg 支持的文件类型列表。然后使用 `rg -t py "import"` 只在 Python 文件中搜索 import 语句。

（5）使用 `rg -c "TODO" src/` 统计每个文件中 TODO 出现的次数。

（6）（挑战）使用 `rg --json "TODO" src/` 输出 JSON 格式的搜索结果。

**答案：**

（1）：

```bash
rg --version
# 如果未安装：
# sudo apt update && sudo apt install -y ripgrep
```

（2）：

```bash
rg "TODO" ~/ch11-practice/src/
# rg 的输出格式：文件路径:行号:匹配内容（带颜色高亮）
# 注意 rg 自动跳过了 __pycache__ 等不需要搜索的目录
```

（3）：

```bash
echo "=== rg ==="
rg "FIXME" ~/ch11-practice/src/

echo "=== grep -rn ==="
grep -rn "FIXME" ~/ch11-practice/src/
# rg 默认不会搜索隐藏文件，grep -r 会
# rg 的输出更紧凑且带颜色
```

（4）：

```bash
# 查看 rg 支持的文件类型
rg --type-list | head -20

# 只在 Python 文件中搜索
rg -t py "import" ~/ch11-practice/src/
# 输出所有 Python 文件中的 import 语句
```

（5）：

```bash
rg -c "TODO" ~/ch11-practice/src/
# 输出每个 Python 文件中 TODO 的数量
# 预期：
# src/api/server.py:3
# src/api/auth.py:2
# src/utils/config.py:2
```

（6）：

```bash
rg --json "TODO" ~/ch11-practice/src/ | head -30
# 输出 JSON 格式的搜索结果，适合被其他工具解析
# 每行一个 JSON 对象（streaming JSON）
```

---

### 练习 11.9：综合--日志安全审计

**题目：**

这是一个模拟的安全审计场景。你是一名安全工程师，需要审查访问日志和应用日志。

（1）从 `access.log` 中找出所有返回 5xx（服务器错误）的请求。它们可能表明服务器存在问题或被攻击。

（2）从 `access.log` 中找出所有来自内网 IP（192.168.x.x 或 10.x.x.x）的请求，提取这些 IP 地址并去重。

（3）从 `access.log` 中找出所有访问 `/admin/` 路径的请求。谁在访问管理后台？

（4）`app.log` 中是否有 "connection pool exhausted"（连接池耗尽）的记录？如果有，显示其完整上下文。

（5）结合 `data/blacklist.txt`，检查是否有黑名单 IP 在 `access.log` 中出现了。使用 `fgrep -f`。

（6）【挑战】找出 `access.log` 中状态码非 200 的所有请求，并按状态码分组统计数量。

**答案：**

（1）：

```bash
grep -E ' 5[0-9]{2} ' ~/ch11-practice/access.log
# 或者
grep -E '" 5[0-9]{2} ' ~/ch11-practice/access.log
# 注意空格确保匹配的是状态码位置
# 输出状态码为 500 的请求（2 条）
```

（2）：

```bash
grep -oE '(192\.168|10\.)[0-9]+\.[0-9]+\.[0-9]+' ~/ch11-practice/access.log | sort -u
# 提取所有内网 IP 并去重
# 预期输出：
# 10.0.0.5
# 192.168.1.10
# 192.168.1.20
# 192.168.1.30
```

（3）：

```bash
grep "/admin/" ~/ch11-practice/access.log
# 输出所有访问 /admin/ 路径的请求
# 可以看到 10.0.0.5（admin 用户）在访问管理后台
```

（4）：

```bash
grep -i -C 3 "connection pool exhausted" ~/ch11-practice/app.log
# 显示 "connection pool exhausted" 的前后 3 行上下文
# 观察连接池耗尽的完整时间线
```

（5）：

```bash
fgrep -f ~/ch11-practice/data/blacklist.txt ~/ch11-practice/access.log
# 检查黑名单 IP 是否在访问日志中出现
# 输出 192.168.1.30 的两条请求
```

（6）：

```bash
# 方法 1：grep + awk
grep -vE '" 200 ' ~/ch11-practice/access.log | grep -oE ' [0-9]{3} ' | sort | uniq -c

# 方法 2：纯 grep + sort
grep -oE ' [0-9]{3} ' ~/ch11-practice/access.log | grep -v ' 200 ' | sort | uniq -c
# 统计非 200 的状态码分布
```

---

### 练习 11.10：综合挑战--构建日志分析报告

**题目：**

写一个综合性的脚本任务，对 `app.log` 进行完整的日志级别分析。要求输出以下信息：

（1）日志的总行数
（2）各日志级别（INFO、DEBUG、WARN、ERROR、FATAL）的计数和占比
（3）所有 ERROR 和 FATAL 行，显示行号和前后各 2 行上下文
（4）判断应用是否正常终止（最后一行是否包含 "Application terminated"）

**答案：**

```bash
#!/bin/bash
LOGFILE=~/ch11-practice/app.log

echo "=========================================="
echo "  应用日志分析报告"
echo "=========================================="
echo ""

# (1) 总行数
TOTAL=$(wc -l < "$LOGFILE")
echo "日志总行数: $TOTAL"
echo ""

# (2) 各日志级别统计
echo "--- 日志级别分布 ---"
for level in INFO DEBUG WARN ERROR FATAL; do
    count=$(grep -c "$level" "$LOGFILE")
    pct=$(echo "scale=1; $count * 100 / $TOTAL" | bc)
    printf "  %-6s: %3d 行 (%5s%%)\n" "$level" "$count" "$pct"
done
echo ""

# (3) ERROR 和 FATAL 的上下文
echo "--- 错误与致命错误上下文 ---"
grep -n -C 2 -E "ERROR|FATAL" "$LOGFILE" | head -40
echo ""

# (4) 检查是否正常终止
echo "--- 终止状态 ---"
if grep -q "Application terminated" "$LOGFILE"; then
    echo "应用正常终止（找到 'Application terminated' 日志）"
else
    echo "警告：应用可能异常终止（未找到 'Application terminated' 日志）"
fi
```

---

### 清理练习环境

```bash
# 删除本章创建的所有练习文件
rm -rf ~/ch11-practice

echo "练习环境已清理"
```

---

## 5. 常见错误与排错

### 5.1 "grep: xxx: Is a directory" -- 忘记 -r 递归搜索目录

**现象：**

```bash
grep "pattern" /var/log
```

```
grep: /var/log: Is a directory
```

**原因：** `grep` 默认不递归搜索目录。当参数中包含目录时，`grep` 会报错。

**解决：**

```bash
# 方法 1：加 -r（推荐）
grep -r "pattern" /var/log

# 方法 2：如果只想搜索目录中的特定文件
grep "pattern" /var/log/*.log
```

### 5.2 "grep: xxx: No such file or directory" -- 通配符未被展开

**现象：**

```bash
grep "pattern" *.log
```

当前目录下没有 `.log` 文件时，Shell 不会展开 `*.log`，直接将字面量 `*.log` 传给 `grep`：

```
grep: *.log: No such file or directory
```

**原因：** 某些 Shell（如 Bash 的默认行为）在没有匹配文件时，保留了通配符的字面值。

**解决：**

```bash
# 方法 1：先检查是否有匹配文件
ls *.log 2>/dev/null && grep "pattern" *.log

# 方法 2：使用 find + xargs
find . -name "*.log" -type f | xargs grep "pattern"

# 方法 3：设置 Bash 的 nullglob 选项
shopt -s nullglob   # 没有匹配文件时，将 *.log 展开为空而非字面量
grep "pattern" *.log  # 如果无 .log 文件，等价于 grep "pattern"（从标准输入读取）
shopt -u nullglob   # 恢复默认
```

### 5.3 "Binary file xxx matches" -- grep 遇到了二进制文件

**现象：**

```bash
grep "pattern" /bin/*
```

```
Binary file /bin/cp matches
```

**原因：** 默认情况下，`grep` 认为二进制文件可能包含任意字节，其匹配结果在终端上显示可能造成混乱（乱码、蜂鸣、终端状态异常）。因此 `grep` 检测到二进制文件时只报告 "Binary file xxx matches"，不输出具体内容。

**解决：**

```bash
# 方法 1：强制 grep 输出匹配行（可能产生乱码）
grep -a "pattern" /bin/cp
# -a 等同于 --text：将二进制文件当作文本处理

# 方法 2：使用 strings 提取可读文本后再搜索（推荐）
strings /bin/cp | grep "pattern"

# 方法 3：只想知道哪些文件匹配（不需要查看内容）
grep -l "pattern" /bin/*

# 方法 4：使用 rg（ripgrep），它默认跳过二进制文件
rg "pattern" /bin/
```

### 5.4 正则特殊字符未转义--匹配结果与预期不符

**现象：**

```bash
# 想搜索 IP 地址 192.168.1.1
grep "192.168.1.1" access.log
# 结果匹配了 192.168.1.1, 192.168.1.10, 192.168.1.100, 192.168.1.101...
# 为什么？因为 . 是正则特殊字符，匹配"任意单个字符"
```

**原因：** 在正则表达式中，`.` 匹配任意单个字符。`192.168.1.1` 中的 `.` 并非字面量的点，而是"匹配任意字符"。因此 `192.168.1.1` 可以匹配 `192.168.1.10`（其中 `.` 匹配了 `0`，`1` 匹配了 `1`）。

但等等，实际上 `192.168.1.1` 作为正则表达式：
- `1` 匹配 `1`
- `9` 匹配 `9`
- `2` 匹配 `2`
- `.` 匹配任意字符（包括 `.`、`0` 等）
- `1` 匹配 `1`
- ...

所以 `192.168.1.1` 会匹配 `192.168.1.10` 因为：
- `192.168.1.1` 中的最后一个 `.` 匹配了 `0`，最后的 `1` 匹配了 `1`
- 但 `10` 还有 `0` 没被消耗--实际上正则是部分匹配（grep 匹配行中任意位置）

实际上 `192.168.1.1` 匹配 `192.168.1.100` 是因为最后一个 `.` 匹配了 `0`，最后的 `1` 匹配了第一个 `0` 后的...不对，让我重新想。

实际上 `grep "192.168.1.1"` 匹配 `192.168.1.100` 是因为：
- `192.168.1.1` 匹配了 `192.168.1.1`（前 11 个字符）
- 因为 IP `192.168.1.100` 包含子串 `192.168.1.1`（前 11 个字符完全等于搜索模式）
- `.` 匹配了字面量的 `.`（因为 `.` 在 `1` 和 `1` 之间，而 IP 中那里恰好也是 `.`）

实际上在 `192.168.1.100` 中搜索 `192.168.1.1`：
- `192.168.1.` 精确匹配
- 最后的 `.1` 可以匹配 `.1`（因为 `.` 匹配 `.`，然后 `1` 匹配 `1`）
- 所以子串 `192.168.1.1`（11 个字符）匹配成功

所以实际上按子串 `192.168.1.1` 匹配 `192.168.1.100` 是说得通的。关键是 `.` 可以匹配任何字符，导致边界不精确。

**解决：**

```bash
# 方法 1：转义点号（BRE）
grep "192\.168\.1\.1\b" access.log
# \. 表示字面量的点

# 方法 2：使用 -F（固定字符串）
grep -F "192.168.1.1" access.log
# -F 模式下所有字符都是字面量，无需转义

# 方法 3：使用 -w 整词匹配（IP 地址被视为一个词时有效）
grep -w "192.168.1.1" access.log
# -w 要求 IP 作为一个完整的词出现
# 注意：-w 对 IP 地址不一定有效，因为 . 在 grep -w 中是词分隔符
# 实际上 grep -w "192.168.1.1" 会匹配 192.168.1.1 作为独立词
# 因为 IP 地址中的 . 在 -w 模式下被视为词边界

# 方法 4：使用更精确的正则
grep -E "\b192\.168\.1\.1\b" access.log
# -E 模式下 \b 是单词边界
```

**常见需要转义的正则特殊字符：**

| 字符 | 在正则中的含义 | BRE 中转义写法 | ERE/F 中处理方式 |
|------|--------------|---------------|-----------------|
| `.` | 匹配任意单个字符 | `\.` | 同 BRE |
| `*` | 前一个元素重复零次或多次 | `\*` | 同 BRE |
| `[` `]` | 字符类 | `\[` `\]` | 同 BRE |
| `^` | 行首 | `\^`（仅在行中非首位时） | 同 BRE |
| `$` | 行尾 | `\$`（仅在行中非末位时） | 同 BRE |
| `\` | 转义字符 | `\\` | 同 BRE |

**最佳实践：当你不确定是否有特殊字符时，使用 `grep -F`（或 `fgrep`）。**

### 5.5 `grep` 搜索速度慢--如何优化

**现象：** 在一个包含大量文件的项目中执行 `grep -r "TODO" .`，等了很久还没有结果。

**原因分析：**
- `grep` 是单线程的，无法利用多核 CPU
- 未排除不需要搜索的目录（`.git`、`node_modules`、`__pycache__`、`vendor` 等）
- 未排除二进制文件（`.png`、`.jpg`、`.exe`、`.zip` 等）
- 搜索的是大型文件

**优化策略：**

```bash
# 优化 1：使用 --exclude-dir 排除不需要的目录
grep -r --exclude-dir={.git,node_modules,__pycache__,vendor} "TODO" .

# 优化 2：使用 --include 限制文件类型
grep -r --include="*.py" --include="*.js" "TODO" .

# 优化 3：组合 find + xargs grep（并行）
find . -name "*.py" -type f -print0 | xargs -0 -P 4 grep "TODO"
# -P 4 表示同时运行 4 个 grep 进程（利用多核）

# 优化 4：使用 rg（ripgrep）--默认多线程 + 智能过滤
rg "TODO" .
# rg 在多核机器上通常比 grep 快 5-20 倍

# 优化 5：先定位再搜索（缩小范围）
grep -rl "TODO" .  # 先找哪些文件包含 TODO
# 再针对性地在那些文件中搜索
```

### 5.6 `grep -r` 搜索包含特殊文件名的目录时跳过隐藏目录

**现象：** 你想用 `grep -r` 搜索当前目录下的所有内容（包括隐藏目录如 `.git`、`.config`），但 `grep -r` 似乎跳过了它们。

**原因：** `grep` 默认不会跳过隐藏文件和目录，但某些 Shell 的 `globbing` 机制可能排除了以 `.` 开头的目录。实际上 `grep -r` 本身会搜索隐藏目录。如果你遇到问题，可能是其他原因。

实际上 `grep -r` 会搜索所有目录包括隐藏目录。但如果你使用 `grep -r "pattern" *`（Shell 通配），Shell 默认不会展开以 `.` 开头的文件名。

```bash
# Shell 通配 * 不匹配隐藏文件
grep -r "pattern" *    # 不搜索 .git 等隐藏目录

# 指定具体目录则包含隐藏内容
grep -r "pattern" .    # 搜索所有内容（包括 .git）
```

**注意：** `rg`（ripgrep）恰好相反--它**默认**跳过隐藏文件和 `.gitignore` 中的文件。要包含它们需要用 `--hidden` 和 `--no-ignore`。

### 5.7 `grep` 输出中看到 "grep" 自己的进程

**现象：**

```bash
ps aux | grep nginx
```

输出中多了一行：

```
user    12345  0.0  0.0  12345  6789 pts/0  S+  08:00  0:00 grep --color=auto nginx
```

**原因：** 管道两边的命令是**同时启动**的。当你执行 `ps aux | grep nginx` 时，`grep nginx` 进程本身也在 `ps aux` 的输出中，它的命令行参数恰好包含 "nginx"，因此被自己匹配了。

**解决：**

```bash
# 方法 1：grep -v grep（最常用）
ps aux | grep nginx | grep -v grep

# 方法 2：正则技巧--将搜索模式的一个字符放入字符类
ps aux | grep "[n]ginx"
# 为什么有效？ps aux 输出中 grep 的命令行是 "grep [n]ginx"
# 正则 [n] 匹配 n，而字面量 "[n]ginx" 不匹配 "nginx"
# 实际上：ps 输出中的 grep 进程显示为 "grep [n]ginx"
# [n]ginx 作为正则匹配 "nginx"（因为 [n] 匹配 n）
# 但 grep 进程的命令行参数 "[n]ginx" 包含 [ ]，所以不会匹配自己

# 方法 3：使用 pgrep（专门用于查找进程）
pgrep -a nginx
```

### 5.8 `grep -v` 把"所有东西"都排除了

**现象：**

```bash
grep -v "DEBUG\|INFO" app.log
```

预期是排除 DEBUG 和 INFO 行，但输出为空。

**原因：** BRE 中 `\|` 是"或"操作符。上面的命令在 BRE 模式下表示排除"DEBUG 或 INFO"的行。但如果写错了转义，可能导致意外行为。

更具体地说，在 BRE 中 `\|` 表示"或"。`grep -v "DEBUG\|INFO"` 表示排除匹配 `DEBUG` 或 `INFO` 的行--这是正确的用法。如果输出为空，可能是因为日志中的所有行都包含 DEBUG 或 INFO。

**解决：**

```bash
# 确保使用正确的正则语法

# BRE 写法
grep -v "DEBUG\|INFO" app.log

# ERE 写法（推荐，语法更清晰）
grep -vE "DEBUG|INFO" app.log

# 如果需要排除多个模式，分别用管道
grep -v "DEBUG" app.log | grep -v "INFO"
```

---

## 6. 进阶延伸

### 6.1 grep 在管道生态系统中的核心地位

`grep` 在 Linux 命令行的管道生态中扮演着不可替代的"过滤器"角色。以下是几个经典的管道组合模式：

#### 模式 1：生成 → 过滤 → 统计

```bash
# 统计 Nginx 访问日志中每个 IP 的请求数
cat /var/log/nginx/access.log \
  | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' \
  | sort | uniq -c | sort -rn | head -10
# 提取 IP → 排序 → 去重计数 → 按数量降序 → Top 10
```

#### 模式 2：生成 → 过滤 → 进一步处理

```bash
# 找出占用磁盘空间最大的 10 个目录
du -h /var 2>/dev/null \
  | grep -E '^[0-9.]+[MG]' \
  | sort -rh \
  | head -10
# du 输出 → 只保留 MB/GB 级别的 → 按人类可读格式排序 → Top 10
```

#### 模式 3：实时流 → 过滤 → 动作

```bash
# 监控认证日志，有人登录失败时发送提醒
tail -F /var/log/auth.log \
  | grep --line-buffered "Failed password" \
  | while read line; do
      echo "检测到登录失败: $line" | wall
    done
```

### 6.2 grep 与 find 的组合：跨文件内容搜索

`grep` 负责搜索"文件内部"，`find` 负责搜索"文件本身"。将它们组合，你可以做任意维度的精确搜索：

```bash
# 组合模式：查找最近 7 天内修改过的 .log 文件，在其中搜索 ERROR
find /var/log -name "*.log" -type f -mtime -7 -exec grep -l "ERROR" {} \;

# 使用 xargs 提高效率（批量处理）
find /var/log -name "*.log" -type f -mtime -7 -print0 | xargs -0 grep -l "ERROR"

# 查找大于 10MB 的 .log 文件，看看里面有没有 "Out of memory"
find /var/log -name "*.log" -type f -size +10M -exec grep -l "Out of memory" {} \;
# 注意：在 10MB 文件中 grep 可能较慢，先用 -l 确认哪些文件有关键词
```

### 6.3 构建可复用的搜索脚本

将 `grep` 与 Shell 脚本结合，可以创建强大的可复用工具：

```bash
# 创建一个日志分析函数，添加到 ~/.bashrc
cat >> ~/.bashrc << 'EOF'

# 快捷日志搜索函数
logfind() {
    # 用法: logfind <模式> [<日志文件>]
    # 默认搜索 /var/log/syslog
    local pattern="$1"
    local logfile="${2:-/var/log/syslog}"

    echo "=== 搜索 '$pattern' 在 $logfile ==="
    grep -in --color=always -C 2 "$pattern" "$logfile" 2>/dev/null | less -R
}

# 代码搜索函数
codefind() {
    # 用法: codefind <模式> [<目录>]
    local pattern="$1"
    local dir="${2:-.}"

    grep -rn --color=always \
        --include="*.py" --include="*.js" --include="*.go" --include="*.rs" \
        --include="*.c" --include="*.cpp" --include="*.h" \
        --exclude-dir={.git,node_modules,__pycache__,vendor,target} \
        "$pattern" "$dir" 2>/dev/null | less -R
}
EOF

source ~/.bashrc

# 使用自定义函数
# logfind "ERROR"                         # 在 syslog 中搜索 ERROR
# logfind "Failed password" /var/log/auth.log  # 在 auth.log 中搜索
# codefind "TODO" ~/project               # 在项目中搜索 TODO
```

### 6.4 rg (ripgrep) 的高级用法

`rg` 提供了一些 `grep` 不具备的高级特性，值得在熟练掌握 `grep` 后探索：

#### 6.4.1 替换（Replace）

```bash
# 预览替换（不修改文件）
rg "ERROR" -r "CRITICAL" app.log

# 实际替换并保存（--passthrough 输出完整文件内容）
# rg "ERROR" -r "CRITICAL" app.log --passthrough > app_fixed.log
```

#### 6.4.2 多行搜索（Multiline）

```bash
# 搜索跨行的模式
rg -U --multiline "Database.*\n.*exhausted" app.log
# -U 启用多行模式，匹配跨行的 Database ... exhausted 模式
```

#### 6.4.3 文件类型过滤

```bash
# 列出所有 rg 认识的文件类型
rg --type-list

# 添加自定义文件类型
rg --type-add 'config:*.{yml,yaml,toml,ini,cfg}' -t config "port" .

# 结合多个类型
rg -t py -t js "import" .    # 只在 Python 和 JavaScript 文件中搜索
```

#### 6.4.4 与编辑器集成

`rg` 的输出格式与许多编辑器（VS Code、vim、Emacs）的快速搜索无缝集成：

```bash
# 生成 vim 兼容的搜索结果列表
rg --vimgrep "TODO" src/ > todo_results.txt

# VS Code 的搜索功能底层实际使用了 ripgrep
# 如果你在 VS Code 中使用 Ctrl+Shift+F 搜索，你已经在用 rg 了
```

### 6.5 正则表达式速查：BRE vs ERE vs PCRE 完整对比

以下是三种正则方言的完整语法对比，作为日常参考：

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     BRE vs ERE vs PCRE 完整语法对比                                │
│                                                                                  │
│  功能                │  BRE（grep）         │  ERE（grep -E）      │  PCRE（grep -P） │
│  ────────────────────┼──────────────────────┼──────────────────────┼─────────────────│
│  任意单个字符        │  .                   │  .                   │  .              │
│  零个或多个          │  *                   │  *                   │  *              │
│  一个或多个          │  \+                  │  +                   │  +              │
│  零个或一个          │  \?                  │  ?                   │  ?              │
│  精确重复 {n}        │  \{n\}               │  {n}                 │  {n}            │
│  重复 {n,m}          │  \{n,m\}             │  {n,m}               │  {n,m}          │
│  重复 {n,}           │  \{n,\}              │  {n,}                │  {n,}           │
│  分组                │  \(...\)             │  (...)               │  (...)          │
│  或                  │  \|                  │  |                   │  |              │
│  行首                │  ^                   │  ^                   │  ^              │
│  行尾                │  $                   │  $                   │  $              │
│  字符类              │  [abc]               │  [abc]               │  [abc]          │
│  排除字符类           │  [^abc]              │  [^abc]              │  [^abc]         │
│  范围                │  [a-z]               │  [a-z]               │  [a-z]          │
│  POSIX 字符类        │  [[:digit:]]         │  [[:digit:]]         │  [[:digit:]]    │
│  单词边界            │  \< \>               │  \< \>               │  \b             │
│  数字                │  [0-9]               │  [0-9]               │  \d             │
│  非数字              │  [^0-9]              │  [^0-9]              │  \D             │
│  单词字符            │  [a-zA-Z0-9_]        │  [a-zA-Z0-9_]        │  \w             │
│  非单词字符           │  [^a-zA-Z0-9_]       │  [^a-zA-Z0-9_]       │  \W             │
│  空白符              │  [[:space:]]         │  [[:space:]]         │  \s             │
│  非空白符            │  [^[:space:]]        │  [^[:space:]]        │  \S             │
│  非贪婪匹配           │  不支持              │  不支持              │  *? +? ?? {n,m}?│
│  正向前瞻            │  不支持              │  不支持              │  (?=...)        │
│  负向前瞻            │  不支持              │  不支持              │  (?!...)        │
│  正向后顾            │  不支持              │  不支持              │  (?<=...)       │
│  负向后顾            │  不支持              │  不支持              │  (?<!...)       │
│  非捕获分组           │  不支持              │  不支持              │  (?:...)        │
│  命名捕获组           │  不支持              │  不支持              │  (?P<name>...)  │
│  反向引用 \1          │  支持                │  支持                │  支持           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 grep 返回码（Exit Code）在脚本中的应用

`grep` 的返回码是被低估的特性。在 Shell 脚本中，它允许你在不解析文本输出的情况下做条件判断：

```bash
#!/bin/bash
# 示例：使用 grep 返回码做系统健康检查

check_service() {
    local service="$1"

    # 检查服务是否在运行
    if systemctl is-active --quiet "$service"; then
        echo "[OK] $service 正在运行"
    else
        echo "[FAIL] $service 未运行"
        return 1
    fi
}

check_log_errors() {
    local logfile="$1"
    local threshold="${2:-0}"  # 错误数阈值，默认 0

    # 统计最近 1 小时内修改的日志中的错误数
    local errors=$(find "$logfile" -mmin -60 -exec grep -ci "ERROR" {} \; 2>/dev/null || echo 0)

    if [ "$errors" -gt "$threshold" ]; then
        echo "[WARN] $logfile 最近 1 小时内出现 $errors 次 ERROR"
        return 1
    else
        echo "[OK] $logfile 无异常错误"
        return 0
    fi
}

check_disk_space() {
    # 检查 /var 分区使用率
    local usage=$(df -h /var | grep -oE '[0-9]+%' | head -1 | tr -d '%')

    if [ "$usage" -gt 90 ]; then
        echo "[CRIT] /var 分区使用率: ${usage}%"
        return 1
    elif [ "$usage" -gt 75 ]; then
        echo "[WARN] /var 分区使用率: ${usage}%"
        return 0
    else
        echo "[OK] /var 分区使用率: ${usage}%"
        return 0
    fi
}

# 执行检查
echo "=== 系统健康检查 $(date) ==="
check_service "nginx"
check_service "ssh"
check_log_errors "/var/log/syslog" 5
check_disk_space
```

### 6.7 grep 与 awk/sed 的分工

`grep`、`sed`、`awk` 是 Linux 文本处理的三剑客。它们各自有明确的职责：

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Linux 文本处理三剑客                               │
│                                                                      │
│  工具   │  核心职责            │  典型用法                           │
│  ───────┼──────────────────────┼─────────────────────────────────────│
│  grep   │  搜索（Search）       │  在文本中找匹配的行                │
│  sed    │  编辑（Edit）         │  替换、删除、插入文本              │
│  awk    │  分析（Analyze）      │  按列提取、计算、格式化报告        │
│  ───────┼──────────────────────┼─────────────────────────────────────│
│  类比   │                      │                                     │
│  grep   │  Ctrl+F 查找          │  "这一行有没有我需要的内容？"       │
│  sed    │  查找并替换            │  "把所有的 A 改成 B"              │
│  awk    │  数据透视表            │  "从第 3 列提取数字并计算平均值"   │
└──────────────────────────────────────────────────────────────────────┘
```

**常见组合管道：**

```bash
# grep 搜索 → sed 替换 → awk 统计分析
grep "ERROR" app.log \
  | sed 's/.*\[\(.*\)\].*/\1/' \
  | awk '{print $1}' \
  | sort | uniq -c | sort -rn
# 搜索 ERROR 行 → 提取线程名 → 统计每个线程的错误数
```

---

## 本章小结

恭喜你完成了第十一章--文本搜索！本章将你的 Linux 操作从"查看文件内容"提升到了"在文件中精准定位信息"。

回顾本章，你现在应该能够：

- 理解 `grep` 的**行级过滤器**模型--逐行读取、模式匹配、输出匹配行
- 区分**三种正则表达式方言**：BRE（基本正则，默认）、ERE（扩展正则，`-E`）、PCRE（Perl 兼容正则，`-P`），包括它们的语法差异和历史背景
- 使用 `grep` 的 **15+ 个核心参数**：`-i`（忽略大小写）、`-v`（反向匹配）、`-r`（递归）、`-n`（行号）、`-l`（文件名）、`-c`（计数）、`-A/-B/-C`（上下文）、`-E/-F/-P`（正则引擎）、`-o`（仅匹配部分）、`-w`（整词）、`-x`（整行）、`--color`（高亮）、`-q`（安静模式）、`-m`（限制数量）
- 理解 `egrep`（`grep -E`）和 `fgrep`（`grep -F`）的定位--它们是同一
- 掌握 `fgrep` 的最佳使用场景--搜索包含正则特殊字符的固定字符串
- 安装并使用 `rg`（ripgrep），理解其六大优势：多线程速度、智能默认行为、自动遵守 `.gitignore`、默认跳过二进制文件、智能大小写、丰富的输出格式
- 将 `grep` 融入管道工作流--`ps aux | grep`、`history | grep`、`find | xargs grep`
- 解决常见 `grep` 问题：二进制文件报错（`-a` 或 `strings`）、正则特殊字符（`-F` 或转义）、目录搜索（`-r`）、"grep 自身"出现在进程列表中（`grep -v grep` 或 `[n]ginx` 技巧）

**记住三条最重要的 grep 原则：**

1. **默认用 ERE（`-E`），安全用固定字符串（`-F`）：** 日常搜索用 `grep -E`（或 `rg`），语法更自然。当模式包含正则特殊字符且你要字面量匹配时，用 `grep -F`（或 `fgrep`）。
2. **上下文是日志分析的灵魂：** `grep -C 3` 不仅告诉你"哪里出了问题"，还告诉你"问题前后的上下文"--这在排查故障时比匹配行本身更有价值。
3. **grep 不是终点，是流水线的起点：** `grep` 的最佳用法不是在终端中直接看输出，而是作为管道中的一个环节--`grep 搜索 → sort 排序 → uniq -c 统计 → sort -rn 降序 → head 取 Top N`。这是一条可以无限组合的数据分析流水线。

**在下一章中，我们将学习文件传输与同步**--你将掌握 `scp`、`rsync`、`wget`、`curl` 等命令，学习如何在本地和远程服务器之间高效地传输文件。`grep` 在远程日志分析中的角色将是下一章的伏笔--当你需要先从远程服务器拉取日志，再用 `grep` 在本地搜索时，`scp` + `grep` 的组合将是最常见的远程排查工作流。

---

> **提示：** 如果你只记住本章的一个命令组合，请记 `grep -rn --include="*.py" "pattern" /path`。这个命令涵盖了递归搜索（`-r`）、行号（`-n`）、文件过滤（`--include`）三个核心功能，覆盖了 80% 的日常 `grep` 使用场景。

> **最佳实践：** 将 `alias grep='grep --color=auto'` 加入 `~/.bashrc`（Ubuntu 通常已默认配置）。如果你经常在大型代码仓库中工作，安装 `ripgrep`（`sudo apt install ripgrep`）并将 `alias sgrep='rg --hidden --no-ignore'` 加入配置中，它将对标 `grep -r` 的所有能力且快得多。
