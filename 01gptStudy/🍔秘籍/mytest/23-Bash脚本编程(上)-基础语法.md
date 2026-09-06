# 第 23 章 Bash 脚本编程(上)：基础语法

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

### 1.1 从"变量与环境"到"脚本编程"

第 22 章你学习了 Shell 变量与环境变量——变量是 Shell 的"记忆"，环境变量是进程间传递配置的"通道"。你掌握了 `export` 的工作原理、`declare` 的类型系统、Bash 启动文件的加载顺序。你能够在交互式命令行中熟练操作变量。

现在，你需要将这些知识**组合成可执行的脚本**：

- "如何将一系列命令保存到文件中，一次性执行它们？"
- "脚本的第一行 `#!/bin/bash` 到底起什么作用？为什么有些脚本写 `#!/usr/bin/env bash`？"
- "如果脚本需要读取用户输入或命令行参数，应该怎么写？"
- "`$@` 和 `$*` 看起来一样，它们的区别到底是什么？"
- "如何在脚本中进行数学计算？`$(( ))`、`let`、`expr`、`bc` 各有什么特点？"
- "什么样的引号用在什么地方？单引号、双引号、反引号的行为有什么不同？"
- "`$(command)` 和 `` `command` `` 都是命令替换，为什么现代脚本都推荐前者？"

这些问题的核心是**Bash 脚本编程的基础语法**——将你之前学到的所有知识点串联起来，形成可复用的自动化程序。

### 1.2 Bash 脚本：Phase 3 的终点，Phase 4 的起点

```
+------------------------------------------------------------------+
|                    Phase 3：I/O 与变量 —— Shell 脚本的基础设施        |
|                                                                  |
|  第 20 章：重定向与管道                                              |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  数据流：>, >>, <, 2>, &>, |, tee, <(), Here Doc              │ |
|  │  视角：Shell 如何为进程"安排"输入输出                             │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 21 章：输入输出与文件描述符                                       |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  内核机制：fd table, exec 重定向, lsof, /proc/PID/fd/, ulimit  │ |
|  │  视角：内核如何管理进程的"打开文件"                               │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 22 章：Shell 变量与环境变量                                      |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  变量分类, export, declare, 启动文件, 重要环境变量               │ |
|  │  视角：Shell 如何"记住"和"传递"配置与状态                         │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 23 章：Bash 脚本编程(上) - 基础语法  ← 你在这一章                |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  Shebang, 引号, 数组, 算术, 命令替换, 参数展开, 脚本参数         │ |
|  │  视角：Shell 编程的基本构建块 —— 变量+I/O 的完整表达              │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 24 章：Bash 脚本编程(中) - 条件与循环  →                        |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  if/case, for/while/until, 条件测试, break/continue           │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

脚本是 Shell 编程的基本单元。在此之前，你在交互式 Shell 中逐条执行命令——这是一次性的、不可复用的。脚本将命令序列保存在文件中，让它们可以被反复执行、被版本控制、被部署到不同的机器。本章聚焦于脚本的**基础语法**——相当于学习一门编程语言时的"变量、表达式、语句"阶段。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **脚本结构** | shebang (`#!`), `chmod +x`, `./script.sh` vs `bash script.sh` | 创建和执行脚本的基本流程 |
| **引号系统** | `' '` (单引号), `" "` (双引号), `` ` ` `` (反引号) | 三种引号的展开行为与适用场景 |
| **数组** | 索引数组 (`arr=()`, `${arr[0]}`), 关联数组 (`declare -A`) | 存储和操作多个值的容器 |
| **算术运算** | `$(())`, `let`, `expr`, `bc` | 整数和小数运算、浮点计算 |
| **命令替换** | `$( )` vs `` ` ` `` | 将命令的输出嵌入到变量或另一个命令中 |
| **参数展开** | 15+ 种展开语法 | 默认值、子串、模式匹配、大小写转换等 |
| **脚本参数** | `$0` ~ `$9`, `${10}`, `$#`, `$@`, `$*`, `$?`, `$$`, `$!`, `$-` | 脚本如何接收和处理命令行参数 |

### 1.4 本章目标

完成本章后，你将能够：

- 使用正确的 shebang 和文件权限创建可执行的 Bash 脚本
- 在三种引号之间做出正确的选择，理解每种引号的展开行为
- 创建和操作索引数组与关联数组，理解它们的底层差异
- 使用 `$(())`、`let`、`expr`、`bc` 进行整数和浮点运算
- 使用 `$( )` 进行命令替换，理解为什么它优于反引号
- 熟练掌握 15 种以上的参数展开语法，灵活处理字符串
- 使用 `$0`、`$1`、`$@`、`$*`、`$#`、`$?` 等特殊参数编写健壮的脚本
- 解释 `"$@"` 和 `"$*"` 的本质区别及其对脚本参数处理的深远影响

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS，使用 Bash 5.x。

```bash
# 确认 Bash 版本
echo $BASH_VERSION
# 输出示例：5.2.21(1)-release

# 创建一个练习目录
mkdir -p ~/bash-lesson23
cd ~/bash-lesson23
echo "练习目录已创建: $(pwd)"
```

---

## 2. 核心概念

### 2.1 脚本的本质：从"逐条输入"到"批量执行"

在交互式 Shell 中，你输入一条命令，Shell 执行一条。脚本改变了这个模式——将所有命令写入一个文件，然后一次性交给 Shell 执行。

```
+------------------------------------------------------------------+
|                    交互式 Shell vs 脚本                              |
|                                                                  |
|  交互式 Shell（一条一条输入）：                                      |
|  $ echo "处理用户数据..."                    ← 手动输入             |
|  $ name="Alice"                              ← 手动输入            |
|  $ count=0                                   ← 手动输入            |
|  $ echo "$name has $count items"             ← 手动输入            |
|  （每次都要手动输入，无法复用，容易出错）                            |
|                                                                  |
|  脚本（一次性批量执行）：                                           |
|  process.sh:                                                      |
|    #!/bin/bash                                                    |
|    echo "处理用户数据..."              ← 所有命令写在文件里          |
|    name="Alice"                                                   |
|    count=0                                                        |
|    echo "$name has $count items"                                  |
|  $ bash process.sh                    ← 一行命令全部执行             |
|  优势：可复用、可版本控制、可分享、减少人为错误                      |
+------------------------------------------------------------------+
```

```bash
# 演示：创建一个最简单的脚本
cat > /tmp/hello.sh << 'EOF'
#!/bin/bash
echo "你好，这是你的第一个 Bash 脚本！"
echo "当前日期：$(date '+%Y-%m-%d')"
echo "当前用户：$USER"
echo "当前目录：$PWD"
EOF

echo "=== 脚本内容 ==="
cat /tmp/hello.sh
echo ""
echo "=== 执行结果 ==="
bash /tmp/hello.sh
```

### 2.2 Shebang（#!）：脚本的"自述声明"

Shebang（Hashbang）是脚本文件的第一行，格式为 `#!interpreter [optional-arg]`。它告诉操作系统：**运行这个脚本时，应该用哪个解释器来执行它**。

当你执行 `./script.sh` 时，内核检查文件开头的 magic bytes。如果是 `#!` (0x23 0x21)，内核读取第一行剩余内容，提取解释器路径和参数，然后调用 `execve(interpreter, [interpreter, script])`。

#### 两种 Shebang 风格

```bash
#!/bin/bash
# 绝对路径：明确、快速
# 缺点：如果 bash 不在 /bin/bash，脚本会失败
```

```bash
#!/usr/bin/env bash
# env 查找：可移植，在 PATH 中查找 bash
# 缺点：多一个 env 进程，不能传额外参数给解释器
```

**推荐策略：**

| 场景 | 推荐 Shebang | 原因 |
|------|-------------|------|
| 个人/项目脚本 | `#!/bin/bash` | 简洁，Linux 上 bash 路径标准化 |
| 跨平台分发 | `#!/usr/bin/env bash` | 适应不同安装路径 |
| 需要 bash 参数 | `#!/bin/bash -eu` | env 方式不能可靠传参 |
| 最大兼容性(POSIX) | `#!/bin/sh` | 不使用 Bash 特有语法 |

```bash
# 验证：Ubuntu 上 /bin/sh 是什么？
echo "=== Ubuntu 上 /bin/sh 的实际身份 ==="
ls -la /bin/sh
readlink -f /bin/sh
echo "注意：Ubuntu 上 /bin/sh 通常是 dash（Debian Almquist Shell）"
echo "如果写 #!/bin/sh，就不能使用 Bash 特有语法（数组、关联数组、<<<等）"
```

### 2.3 脚本的文件权限与执行方式

```
+------------------------------------------------------------------+
|                    执行脚本的三种方式                                |
|                                                                  |
|  方式 1：bash script.sh                                           |
|    子 Shell 中运行，不需要执行权限，不需要 shebang                   |
|                                                                  |
|  方式 2：./script.sh（直接执行）                                    |
|    需要执行权限（chmod +x），由 shebang 决定解释器                   |
|                                                                  |
|  方式 3：source script.sh 或 . script.sh                          |
|    当前 Shell 中执行，不需要执行权限                                |
|    脚本中的变量修改、cd 等直接影响当前 Shell                         |
+------------------------------------------------------------------+
```

```bash
# 演示：三种执行方式
cat > /tmp/exec-demo.sh << 'EOF'
#!/bin/bash
echo "脚本 PID: $$, 父PID: $PPID"
MY_VAR="内部变量"
echo "MY_VAR=$MY_VAR"
cd /
echo "切换目录: $(pwd)"
EOF

echo "=== 方式1：bash exec-demo.sh ==="
bash /tmp/exec-demo.sh
echo "MY_VAR=${MY_VAR:-未定义}, 目录未变: $(pwd)"

chmod +x /tmp/exec-demo.sh
echo ""
echo "=== 方式2：./exec-demo.sh ==="
/tmp/exec-demo.sh
echo "目录未变: $(pwd)"

echo ""
echo "=== 方式3：source exec-demo.sh（影响当前Shell！）==="
source /tmp/exec-demo.sh
echo "MY_VAR=$MY_VAR, 目录改变了!: $(pwd)"
cd - > /dev/null
rm -f /tmp/exec-demo.sh
```

### 2.4 Bash 脚本的基本结构

一个结构良好的 Bash 脚本通常包含以下部分：

```
#!/bin/bash                              ← Shebang
# ==========================================
# 脚本名称: backup.sh
# 功能描述: 备份指定目录
# 使用方法: ./backup.sh <source_dir>
# ==========================================

set -euo pipefail                        ← 安全设置

# --- 变量定义 ---
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# --- 函数定义 ---
usage() {
    echo "Usage: $0 <source_dir>"
    exit 1
}

# --- 参数检查 ---
if [ $# -lt 1 ]; then usage; fi

# --- 主逻辑 ---
# ...

# --- 清理与退出 ---
exit 0
```

```bash
# 演示：创建一个结构完整的脚本
cat > /tmp/script-template.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log_info() { echo "[INFO] $(date '+%H:%M:%S') - $*"; }
log_error() { echo "[ERROR] $(date '+%H:%M:%S') - $*" >&2; }

show_help() {
    cat << HELP
Usage: $SCRIPT_NAME [options]
Options:
  -h, --help     显示帮助
  -v, --verbose  详细输出
HELP
}

VERBOSE=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help) show_help; exit 0 ;;
        -v|--verbose) VERBOSE=true; shift ;;
        *) log_error "未知参数: $1"; exit 1 ;;
    esac
done

log_info "脚本开始 (PID: $$)"
log_info "脚本目录: $SCRIPT_DIR"
log_info "脚本名称: $SCRIPT_NAME"
$VERBOSE && log_info "详细模式开启"
log_info "执行完毕"
SCRIPT

chmod +x /tmp/script-template.sh
/tmp/script-template.sh --help
echo ""
/tmp/script-template.sh
```

### 2.5 三种引号的本质区别

```
+------------------------------------------------------------------+
|                    三种引号的展开行为对比                             |
|                                                                  |
|  引号       变量展开  命令替换  转义序列  适用场景                    |
|  ───────────────────────────────────────────────────────────────  |
|  '单引号'   否        否        否        字面量字符串              |
|  "双引号"   是        是        是(部分)  含变量的字符串             |
|  `反引号`   是        是        是        命令替换（过时）           |
+------------------------------------------------------------------+
```

#### 2.5.1 单引号：一切照原样

单引号内的所有字符都保持字面值，没有任何特殊处理。

```bash
NAME="Alice"
echo 'Hello $NAME'              # 输出: Hello $NAME
echo 'Today is $(date)'         # 输出: Today is $(date)
echo 'Line1\nLine2'             # 输出: Line1\nLine2

# 在单引号中插入单引号：结束单引号 + 转义单引号 + 开始单引号
echo 'It'\''s a nice day'       # 输出: It's a nice day
```

#### 2.5.2 双引号：允许变量和命令替换

```bash
NAME="Alice"
echo "Hello $NAME"              # 输出: Hello Alice
echo "Today is $(date +%A)"     # 输出: Today is Monday

# 双引号保留空格和换行
greeting="Hello   World"
echo "[$greeting]"              # 输出: [Hello   World]（空格保留）
echo [$greeting]                # 输出: [Hello World]（无引号，空格压缩）

# 双引号中需要转义的字符：$ ` " \ !
echo "价格: \$10.00"

# 双引号保护变量——防止单词分割和文件名展开
file="my document.txt"
# 正确：ls "$file"      → 一个参数
# 错误：ls $file        → 两个参数（"my" 和 "document.txt"）
```

#### 2.5.3 反引号 vs $()：命令替换

```bash
# 旧式写法（反引号）
today=`date +%Y-%m-%d`

# 新式写法（推荐）
today=$(date +%Y-%m-%d)

# 为什么 $() 更好？
# 1. 可嵌套：$(echo $(date))  vs  `echo \`date\``
# 2. 可读性：明确的开闭符号
# 3. 转义简单：不需要复杂的反斜杠规则
# 4. 视觉区分：$() 与单引号 '' 完全不同
```

### 2.6 数组：索引数组与关联数组

Bash 支持两种数组：**索引数组**（Indexed Array，整数下标）和**关联数组**（Associative Array，字符串下标）。关联数组需要 Bash 4.0+ 且必须用 `declare -A` 显式声明。

#### 2.6.1 索引数组

```bash
# === 索引数组的创建 ===
# 方式1：括号初始化
fruits=("苹果" "香蕉" "橙子")

# 方式2：逐个赋值
fruits[3]="葡萄"

# 方式3：使用 declare
declare -a colors=("红色" "绿色" "蓝色")

# === 常用操作 ===
echo "第1个: ${fruits[0]}"
echo "所有元素: ${fruits[@]}"
echo "数组长度: ${#fruits[@]}"
echo "索引列表: ${!fruits[@]}"

# 追加元素
fruits+=("西瓜")

# 删除元素
unset fruits[1]

# 遍历数组
for fruit in "${fruits[@]}"; do
    echo "  - $fruit"
done

# 数组切片
numbers=(0 1 2 3 4 5 6 7 8 9)
echo "前3个: ${numbers[@]:0:3}"
echo "最后3个: ${numbers[@]: -3}"   # 注意空格！
```

#### 2.6.2 关联数组

```bash
# 必须用 declare -A 声明！
declare -A user
user[name]="张三"
user[age]=28
user[city]="深圳"

echo "姓名: ${user[name]}"
echo "年龄: ${user[age]}"
echo "所有键: ${!user[@]}"
echo "所有值: ${user[@]}"
echo "键值对数: ${#user[@]}"

# 检查键是否存在
if [[ -v user[name] ]]; then
    echo "键 'name' 存在"
fi

# 遍历关联数组
for key in "${!user[@]}"; do
    printf "  %-10s -> %s\n" "$key" "${user[$key]}"
done

# 实用场景：计数统计
declare -A word_count
text="apple banana apple orange banana apple"
for word in $text; do
    ((word_count[$word]++))
done
# 输出每个单词出现的次数
```

注意：关联数组的键是**无序的**（哈希表特性），遍历时顺序与插入顺序无关。

### 2.7 算术运算：四种方式的对比与选择

Bash 本身只支持整数运算。需要浮点运算时使用外部工具（`bc` 或 `awk`）。

```
+------------------------------------------------------------------+
|                    四种算术运算方式对比                               |
|                                                                  |
|  方式         语法                       整数  浮点  性能            |
|  ───────────────────────────────────────────────────────────────  |
|  $(( ))      $(( 1 + 2 * 3 ))          是    否    最快（内置）    |
|  let         let "x = 1 + 2"            是    否    快（内置）      |
|  expr        expr 1 + 2 \* 3            是    否    慢（外部进程）  |
|  bc          echo "scale=2; 10/3" | bc  是    是    最慢（外部进程）|
|                                                                  |
|  推荐顺序：$(( )) > let > bc > expr（expr 已过时）                  |
+------------------------------------------------------------------+
```

#### 2.7.1 $(( )) -- 算术展开（首选）

```bash
# === 四则运算 ===
echo "5 + 3 = $((5 + 3))"
echo "10 - 4 = $((10 - 4))"
echo "6 * 7 = $((6 * 7))"
echo "20 / 3 = $((20 / 3))"   # 整数除法，截断
echo "20 % 3 = $((20 % 3))"   # 取余
echo "2 ** 10 = $((2 ** 10))" # 幂

# === 变量参与运算（可以省略 $） ===
x=10; y=3
echo "x + y = $((x + y))"

# === 自增自减 ===
count=0
((count++))       # 自增
((count += 5))    # 加等于
echo "count = $count"

# === 三元运算 ===
a=10; b=20
max=$(( a > b ? a : b ))
echo "最大值: $max"

# === 位运算 ===
echo "5 & 3 = $(( 5 & 3 ))"   # 按位与
echo "5 | 3 = $(( 5 | 3 ))"   # 按位或
echo "1 << 4 = $(( 1 << 4 ))" # 左移: 16

# === 条件判断 ===
if (( 5 > 3 )); then
    echo "5 > 3 为真"
fi
```

#### 2.7.2 let -- 算术赋值

```bash
let "a = 5 + 3"
echo "a = $a"

let "b = a * 2"
echo "b = $b"

let count=0
let count++       # 自增
let count+=5      # 加等于

# let 的返回值可以作为条件
let "5 > 3" && echo "真" || echo "假"
```

#### 2.7.3 bc -- 浮点运算

```bash
# 简单计算
echo "scale=4; 10 / 3" | bc       # 3.3333

# 使用 Here String
result=$(bc <<< "scale=2; 100/3")
echo "100/3 = $result"

# 变量传入
radius=5
area=$(bc -l <<< "scale=2; 3.14159 * $radius * $radius")
echo "半径为 $radius 的圆面积 = $area"

# 数学函数（需要 -l）
echo "sqrt(2) = $(bc -l <<< 'scale=6; sqrt(2)')"
echo "e(1) = $(bc -l <<< 'e(1)')"
echo "s(1.5708) = $(bc -l <<< 'scale=4; s(3.14159/2)')"
```

#### 2.7.4 expr -- 过时的外部命令

```bash
# 仅供参考，不推荐新脚本使用
echo "5 + 3 = $(expr 5 + 3)"
echo "6 * 7 = $(expr 6 \* 7)"   # * 必须转义！
# expr 的问题：空格必须、* 必须转义、每次调用启动新进程
```

### 2.8 命令替换：$( ) 的完整指南

命令替换（Command Substitution）让你将一个命令的 stdout 嵌入到其他命令或变量赋值中。

```bash
# === 基础用法 ===
today=$(date '+%Y-%m-%d')
echo "日期: $today"

file_count=$(ls /usr/bin | wc -l)
echo "/usr/bin 文件数: $file_count"

# === 嵌入字符串 ===
echo "用户: $(whoami), 时间: $(date '+%H:%M:%S')"

# === 嵌套（$() 的优势！） ===
parent=$(dirname $(dirname $(which bash)))
echo "bash 上两级目录: $parent"

# === 捕获多行输出 ===
top5=$(ls -1 /usr/bin | head -5)
echo "$top5"       # 加引号保留换行

# === 捕获 stderr（2>&1） ===
errors=$(ls /root 2>&1)
echo "输出: $errors"

# === 注意：末尾换行符被去除 ===
output=$(printf "Line1\nLine2\n\n\n")
echo "[$output]"   # 末尾换行被去除
```

### 2.9 参数展开：Bash 字符串处理的瑞士军刀

参数展开（Parameter Expansion）是 Bash 最强大的特性之一。第 22 章介绍了基本语法，本节进行最全面的深度讲解。

#### 2.9.1 默认值与必填检查

```bash
# ${var:-word}：未定义或为空时使用默认值（不修改 var）
echo "用户名: ${username:-匿名用户}"

# ${var:=word}：未定义或为空时赋值并返回
echo "配置: ${config:=/etc/myapp.conf}"
# 现在 config 已被赋值为 /etc/myapp.conf

# ${var:?error}：未定义或为空时报错退出
# echo "${REQUIRED:?必须设置 REQUIRED}"

# ${var:+word}：已定义且非空时使用替代值
debug="on"
echo "调试: ${debug:+(开启)}"    # 输出 (开启)
unset debug
echo "调试: ${debug:+(关闭)}"    # 输出空
```

#### 2.9.2 模式删除（# 删前缀，% 删后缀）

```bash
filepath="/usr/local/bin/my-script.sh"

echo "完整: $filepath"
echo "#  删最短前缀: ${filepath#*/}"       # usr/local/bin/my-script.sh
echo "## 删最长前缀: ${filepath##*/}"      # my-script.sh（获取文件名！）
echo "%  删最短后缀: ${filepath%.*}"       # /usr/local/bin/my-script
echo "%% 删最长后缀: ${filepath%%.*}"      # /usr/local/bin/my-script

# 实战：提取文件扩展名
filename="backup.tar.gz"
echo "短扩展名: .${filename##*.}"         # .gz
echo "长扩展名: ${filename#*.}"            # tar.gz

# 实战：批量改扩展名
for file in *.txt; do
    mv "$file" "${file%.txt}.md"
done
```

#### 2.9.3 字符串长度与子串

```bash
str="Hello, Ubuntu Linux!"
echo "长度: ${#str}"                  # 字符数（非字节数！）

text="0123456789"
echo "从索引5: ${text:5}"            # 56789
echo "索引2取4个: ${text:2:4}"       # 2345
echo "最后3个: ${text: -3}"          # 789（注意空格）
echo "倒数第5取2个: ${text: -5:2}"   # 56

# 提取邮箱的用户名和域名
email="user@example.com"
echo "用户名: ${email%%@*}"
echo "域名: ${email##*@}"
```

#### 2.9.4 模式替换

```bash
text="The quick brown fox jumps over the lazy fox"

echo "替换第1个 fox: ${text/fox/cat}"
echo "替换所有 fox: ${text//fox/cat}"
echo "开头替换: ${text/#The/A}"        # 只匹配开头
echo "结尾替换: ${text/%fox/wolf}"     # 只匹配结尾

# 压缩重复空格
compressed="${text//  / }"
echo "压缩空格: $compressed"
```

#### 2.9.5 大小写转换（Bash 4.0+）

```bash
text="hello WORLD"

echo "^  首大写: ${text^}"     # Hello WORLD
echo "^^ 全大写: ${text^^}"    # HELLO WORLD
echo ",  首小写: ${text,}"     # hello WORLD
echo ",, 全小写: ${text,,}"    # hello world

# 按模式转换
echo "^^[hw]: ${text^^[hw]}"   # Hello World
```

#### 2.9.6 间接引用

```bash
# ${!var}：获取 var 的值，作为变量名再读取
target="HOME"
echo "\${!target} = ${!target}"   # 展开为 $HOME

# 实战：动态配置读取
config_name="DB_HOST"
DB_HOST="192.168.1.100"
echo "$config_name = ${!config_name}"

# ${!prefix*} / ${!prefix@}：列出所有匹配前缀的变量名
echo "以 BASH 开头的变量: ${!BASH*}"
```

### 2.10 脚本参数：特殊变量全景

脚本参数是脚本与外部世界交互的主要通道。

```
+------------------------------------------------------------------+
|                    脚本参数特殊变量                                   |
|                                                                  |
|  $0       脚本本身名称      $#      参数总数                        |
|  $1~$9    第1~9个参数      ${10}   第10个参数（需要{}）             |
|  $@       所有参数（分体）  $*      所有参数（整体）                  |
|  $?       上条命令退出码    $$      当前 Shell PID                 |
|  $!       最后后台进程PID   $-      当前 Shell 选项                 |
+------------------------------------------------------------------+
```

#### 2.10.1 "$@" vs "$*" -- 最核心的区别

这是 Bash 脚本编程中**最重要**的概念区别之一。

```
假设脚本参数是: apple "banana split" cherry

不加引号的 $@ 和 $*：
  → apple banana split cherry（4个参数！参数中的空格被拆分）

"$@"（推荐！几乎所有情况都用这个）：
  → "apple" "banana split" "cherry"（3个参数，保持独立且正确引用）

"$*"：
  → "apple banana split cherry"（1个参数，所有参数合并为一个字符串）
```

```bash
# 演示脚本：对比 $@ vs $*
cat > /tmp/at-vs-star.sh << 'SCRIPT'
#!/bin/bash
echo "参数总数: $#"
echo ""
echo "=== for arg in \$@ (不加引号 -- 危险) ==="
for arg in $@; do echo "  [$arg]"; done
echo ""
echo "=== for arg in \"\$@\" (加引号 -- 推荐) ==="
for arg in "$@"; do echo "  [$arg]"; done
echo ""
echo "=== for arg in \"\$*\" (加引号 -- 合并) ==="
for arg in "$*"; do echo "  [$arg]"; done
SCRIPT

chmod +x /tmp/at-vs-star.sh
echo "测试: 3个参数，第2个含空格"
/tmp/at-vs-star.sh apple "banana split" cherry
```

**实际应用模式：**

```bash
# 模式1：将脚本参数转发给另一个命令（最常见）
wrapper() {
    command "$@"   # 正确转发所有参数
}

# 模式2：shift 消费后传递剩余
first="$1"
shift
process_remaining "$@"

# 模式3：参数验证
if [ $# -eq 0 ]; then
    echo "用法: $0 <参数1> [参数2...]" >&2
    exit 1
fi
```

#### 2.10.2 退出码 `$?`

```bash
# 0 = 成功，非0 = 失败
echo "hello" > /dev/null
echo "成功: $?"     # 0

ls /nonexistent 2>/dev/null
echo "失败: $?"     # 2

# 常见退出码
# 0     : 成功
# 1     : 一般错误
# 2     : 误用 Shell 内置
# 126   : 命令无法执行
# 127   : 命令未找到
# 128+N : 被信号 N 终止

# 使用方式
if grep -q "root" /etc/passwd; then
    echo "找到 root 用户"
fi

mkdir /tmp/test 2>/dev/null && echo "成功" || echo "失败"
```

#### 2.10.3 `$$`、`$!`、`$-`

```bash
echo "当前 PID: $$"
echo "父 PID: $PPID"

# $!：最后一个后台进程的 PID
sleep 10 &
echo "后台进程 PID: $!"
wait $! 2>/dev/null

# $-：Shell 选项标志
echo "Shell 选项: $-"
# h=hashall, i=interactive, m=monitor, B=braceexpand, H=histexpand
[[ $- == *i* ]] && echo "交互式 Shell" || echo "非交互式 Shell"
```

---

## 3. 命令详解

本节深入讲解脚本编程中最重要的几个命令和内置机制。

### 3.1 chmod +x：赋予脚本执行权限

`chmod +x` 给文件添加可执行权限。这是 `./script.sh` 方式执行脚本的前提。

```bash
# 创建一个脚本
echo '#!/bin/bash
echo "Hello from script"
' > /tmp/perm-demo.sh

# 查看初始权限
ls -l /tmp/perm-demo.sh

# 尝试直接执行（会失败）
/tmp/perm-demo.sh 2>&1 || echo "失败：没有执行权限"

# 添加执行权限
chmod +x /tmp/perm-demo.sh

# 现在可以执行了
/tmp/perm-demo.sh

# chmod +x 的变体
chmod u+x script.sh   # 仅文件所有者
chmod a+x script.sh   # 所有用户
chmod 755 script.sh   # rwxr-xr-x

rm -f /tmp/perm-demo.sh
```

### 3.2 declare：定义有类型的变量

第 22 章详细讲过 `declare`，这里聚焦于脚本中最常用的两种用途：整数变量和数组。

```bash
# declare -i：整数变量
declare -i counter=0
counter="counter + 10"     # 自动求值，=10
counter="5 * 3"            # =15
echo "counter = $counter"

# declare -a：索引数组
declare -a names=("Alice" "Bob" "Charlie")
names+=("David")
echo "所有: ${names[@]}"

# declare -A：关联数组（必须显式声明！）
declare -A scores
scores[Alice]=95
scores[Bob]=87
echo "Alice 的分数: ${scores[Alice]}"

# declare -r：只读常量
declare -r MAX_SIZE=100
# MAX_SIZE=200  # 会报错：readonly variable

# declare -p：打印变量定义（调试利器）
name="test"
declare -p name
```

### 3.3 shift：参数列表左移

`shift` 从 `$1`、`$2`、`$3`... 中移除 `$1`，原来的 `$2` 变成新的 `$1`，以此类推。`$#` 减 1。

```bash
cat > /tmp/shift-demo.sh << 'SCRIPT'
#!/bin/bash
echo "参数总数: $#"
echo "所有参数: $@"
echo ""

while [ $# -gt 0 ]; do
    echo "处理: $1 (剩余 $# 个)"
    shift
done

echo ""
echo "处理完毕！"
SCRIPT

chmod +x /tmp/shift-demo.sh
/tmp/shift-demo.sh one two three four five

# shift N：一次移多个
echo ""
echo "=== shift 2 演示 ==="
cat > /tmp/shift2-demo.sh << 'SCRIPT'
#!/bin/bash
echo "原始: $@"
shift 2
echo "shift 2 后: $@"
SCRIPT
chmod +x /tmp/shift2-demo.sh
/tmp/shift2-demo.sh a b c d e

rm -f /tmp/shift-demo.sh /tmp/shift2-demo.sh
```

### 3.4 read：读取用户输入

`read` 从 stdin 读取一行，将其分割为单词并赋值给变量。

```bash
# 基本用法
echo "请输入你的名字:"
read name
echo "你好, $name!"

# 读取多个变量
echo "请输入姓名、年龄、城市（空格分隔）:"
read name age city
echo "$name, $age 岁, 来自 $city"

# 常用选项
echo "请输入密码（不回显）:"
read -s password
echo "密码已录入（长度: ${#password}）"

echo "5 秒后超时..."
read -t 5 -p "请输入（5秒内）: " input
echo "你输入了: ${input:-超时!}"

# 读取整个文件
while IFS= read -r line; do
    echo "行: $line"
done <<< "line1
line2
line3"
```

### 3.5 printf：格式化输出

`printf` 比 `echo` 更强大、更可移植。它不自动添加换行。

```bash
# 基本格式化
name="Alice"
score=95
printf "姓名: %s, 分数: %d\n" "$name" $score

# 对齐表格
printf "%-15s %5s %8s\n" "姓名" "年龄" "城市"
printf "%-15s %5d %8s\n" "Alice" 25 "Beijing"
printf "%-15s %5d %8s\n" "Bob" 30 "Shanghai"
printf "%-15s %5d %8s\n" "Charlie" 22 "Shenzhen"

# 常用格式说明符
# %s   字符串
# %d   十进制整数
# %f   浮点数（如 %.2f）
# %x   十六进制
# %-10s 左对齐，宽度10
# %10s  右对齐，宽度10
```

### 3.6 IFS：内部字段分隔符

`IFS`（Internal Field Separator）控制 Bash 如何进行单词分割。默认值是空格、制表符和换行符。

```bash
# 默认 IFS 的分割行为
line="one two three"
for word in $line; do
    echo "  [$word]"
done
# 输出三个单词

# 自定义 IFS
echo "=== IFS=, ==="
line="apple,banana,orange,grape"
IFS=',' read -r -a fruits <<< "$line"
for fruit in "${fruits[@]}"; do
    echo "  - $fruit"
done

# 解析 /etc/passwd
echo "=== 解析 /etc/passwd ==="
while IFS=: read -r user _ uid gid _ home shell; do
    [ $uid -ge 1000 ] 2>/dev/null || continue
    echo "  用户: $user, UID: $uid, 家目录: $home, Shell: $shell"
done < /etc/passwd

# IFS 在脚本中的最佳实践
# 在脚本开头保存并恢复 IFS，或在子作用域中使用
old_ifs="$IFS"
IFS=',' read -r a b c <<< "1,2,3"
IFS="$old_ifs"
```

### 3.7 在脚本中捕获和处理错误

虽然错误处理在第 25 章会详细讲解，但这里引入最基本的概念。

```bash
cat > /tmp/error-basics.sh << 'SCRIPT'
#!/bin/bash

# set -e：任何命令失败立即退出
# set -u：使用未定义变量时报错
# set -o pipefail：管道中任何命令失败则整体失败
set -euo pipefail

# 检查命令是否成功
if ! command -v curl > /dev/null 2>&1; then
    echo "警告: curl 未安装，跳过网络操作" >&2
fi

# 捕获脚本退出的清理操作
cleanup() {
    echo "清理临时文件..."
    rm -f /tmp/myscript_*.tmp
}
trap cleanup EXIT

# 使用 $? 检查上一个命令
grep -q "root" /etc/passwd
if [ $? -eq 0 ]; then
    echo "root 用户存在"
fi

echo "脚本正常结束"
SCRIPT

bash /tmp/error-basics.sh
rm -f /tmp/error-basics.sh
```

---

## 4. 实战练习

### 练习 23.1：我的第一个 Bash 脚本

**题目：**

编写一个脚本 `~/bash-lesson23/myinfo.sh`，要求：
（1）使用正确的 shebang
（2）输出当前用户名、家目录、当前日期、当前工作目录
（3）输出你的姓名（用变量存储）
（4）使用 `chmod +x` 使其可执行，并用 `./myinfo.sh` 方式运行

**答案：**

```bash
cat > ~/bash-lesson23/myinfo.sh << 'SCRIPT'
#!/bin/bash
# ==========================================
# 脚本: myinfo.sh
# 描述: 显示用户和系统信息
# ==========================================

name="Ubuntu Learner"
current_date=$(date '+%Y年%m月%d日 %H:%M:%S')

echo "======================================"
echo "  我的信息"
echo "======================================"
echo "姓名:     $name"
echo "用户名:   $USER"
echo "家目录:   $HOME"
echo "当前目录: $PWD"
echo "当前时间: $current_date"
echo "Shell:    $SHELL"
echo "主机名:   $(hostname)"
echo "======================================"
SCRIPT

chmod +x ~/bash-lesson23/myinfo.sh
~/bash-lesson23/myinfo.sh
```

### 练习 23.2：三种引号的对比

**题目：**

编写脚本演示单引号、双引号、反引号/`$()` 的区别。
（1）创建变量 `name="Alice"`, `age=25`
（2）分别用三种引号输出包含 `$name` 和 `$age` 的字符串
（3）在反引号/`$()` 中嵌套执行 `date` 命令并对比

**答案：**

```bash
cat > ~/bash-lesson23/quote-demo.sh << 'SCRIPT'
#!/bin/bash

name="Alice"
age=25

echo "=== 单引号：一切照原样 ==="
echo '姓名: $name, 年龄: $age'
echo '日期: $(date +%Y-%m-%d)'

echo ""
echo "=== 双引号：变量和命令替换 ==="
echo "姓名: $name, 年龄: $age"
echo "日期: $(date +%Y-%m-%d)"

echo ""
echo "=== 命令替换对比 ==="
# 旧式（反引号）
old_way=`date +%H:%M:%S`
echo "反引号: $old_way"

# 新式（推荐）
new_way=$(date +%H:%M:%S)
echo "\$():    $new_way"

# 嵌套对比
echo ""
echo "反引号嵌套（需要转义）:"
nested_backtick=`echo \`date +%H\``
echo "  结果: $nested_backtick"

echo "\$() 嵌套（直接嵌套）:"
nested_dollar=$(echo $(date +%H))
echo "  结果: $nested_dollar"
SCRIPT

chmod +x ~/bash-lesson23/quote-demo.sh
~/bash-lesson23/quote-demo.sh
```

### 练习 23.3：数组的创建与遍历

**题目：**

（1）创建一个索引数组，包含 6 种编程语言名称
（2）使用三种不同的方式遍历数组
（3）输出数组的长度、所有索引、切片（前3个、后2个）
（4）创建一个关联数组，存储 3 个学生的姓名和分数，遍历输出

**答案：**

```bash
cat > ~/bash-lesson23/array-demo.sh << 'SCRIPT'
#!/bin/bash

# (1) 创建索引数组
languages=("Python" "JavaScript" "Go" "Rust" "Java" "TypeScript")
echo "=== 编程语言数组 ==="
echo "数组: ${languages[@]}"
echo "长度: ${#languages[@]}"
echo "索引: ${!languages[@]}"
echo ""

# (2) 三种遍历方式
echo "--- 按索引遍历 ---"
for i in "${!languages[@]}"; do
    echo "  [$i] ${languages[$i]}"
done

echo ""
echo "--- 按值遍历 ---"
for lang in "${languages[@]}"; do
    echo "  - $lang"
done

echo ""
echo "--- C风格for遍历 ---"
for ((i=0; i<${#languages[@]}; i++)); do
    echo "  第$((i+1))个: ${languages[$i]}"
done

# (3) 切片
echo ""
echo "--- 切片 ---"
echo "前3个: ${languages[@]:0:3}"
echo "后2个: ${languages[@]: -2}"

# (4) 关联数组
echo ""
echo "=== 学生成绩（关联数组）==="
declare -A scores
scores["小明"]=92
scores["小红"]=88
scores["小刚"]=95

for student in "${!scores[@]}"; do
    echo "  $student: ${scores[$student]} 分"
done

# 平均分计算
total=0
for score in "${scores[@]}"; do
    ((total += score))
done
echo "  平均分: $(( total / ${#scores[@]} ))"
SCRIPT

chmod +x ~/bash-lesson23/array-demo.sh
~/bash-lesson23/array-demo.sh
```

### 练习 23.4：算术运算综合

**题目：**

编写一个计算器脚本，从命令行接收两个数字和一个运算符（+、-、x、/），输出计算结果。
- 使用 `$(())` 做整数运算
- 使用 `bc` 处理除法（保留 2 位小数）
- 支持 `$1`、`$2`、`$3` 三个位置参数
- 参数不足时报错

**答案：**

```bash
cat > ~/bash-lesson23/calculator.sh << 'SCRIPT'
#!/bin/bash

# 参数检查
if [ $# -ne 3 ]; then
    echo "用法: $0 <数字1> <运算符> <数字2>" >&2
    echo "运算符: + - x /" >&2
    exit 1
fi

num1="$1"
op="$2"
num2="$3"

echo "计算: $num1 $op $num2"
echo "======================================"

case "$op" in
    +)
        result=$(( num1 + num2 ))
        echo "整数加法: $num1 + $num2 = $result"
        ;;
    -)
        result=$(( num1 - num2 ))
        echo "整数减法: $num1 - $num2 = $result"
        ;;
    x)
        result=$(( num1 * num2 ))
        echo "整数乘法: $num1 * $num2 = $result"
        ;;
    /)
        if [ "$num2" -eq 0 ]; then
            echo "错误: 除数不能为 0" >&2
            exit 1
        fi
        # 整数除法
        int_result=$(( num1 / num2 ))
        # 浮点除法
        float_result=$(bc -l <<< "scale=2; $num1 / $num2")
        echo "整数除法: $num1 / $num2 = $int_result"
        echo "浮点除法: $num1 / $num2 = $float_result"
        ;;
    *)
        echo "错误: 不支持的运算符 '$op'" >&2
        exit 1
        ;;
esac
SCRIPT

chmod +x ~/bash-lesson23/calculator.sh
echo "=== 测试 ==="
~/bash-lesson23/calculator.sh 10 + 7
~/bash-lesson23/calculator.sh 50 - 23
~/bash-lesson23/calculator.sh 8 x 6
~/bash-lesson23/calculator.sh 22 / 7
```

### 练习 23.5：参数展开实战 -- 文件名批量处理

**题目：**

编写一个脚本，接收任意数量的文件名作为参数，对每个文件名执行以下操作：
（1）输出原始文件名
（2）仅输出文件名部分（去除路径）
（3）仅输出扩展名（如果没有则输出"无扩展名"）
（4）输出不带扩展名的文件名
（5）将文件名改为全小写

**答案：**

```bash
cat > ~/bash-lesson23/filename-tool.sh << 'SCRIPT'
#!/bin/bash

if [ $# -eq 0 ]; then
    echo "用法: $0 <文件1> [文件2...]" >&2
    exit 1
fi

echo "共处理 $# 个文件"
echo "=============================================="

count=0
for filepath in "$@"; do
    ((count++))
    filename="${filepath##*/}"          # 去除路径
    dirname="${filepath%/*}"            # 目录部分
    [ "$dirname" = "$filepath" ] && dirname="."  # 仅文件名的情况
    
    # 扩展名处理
    if [[ "$filename" == *.* ]]; then
        ext="${filename##*.}"
        basename_no_ext="${filename%.*}"
    else
        ext="(无)"
        basename_no_ext="$filename"
    fi
    
    # 全小写
    lowercase="${filename,,}"
    
    echo "[$count] $filepath"
    echo "    目录:     $dirname"
    echo "    文件名:   $filename"
    echo "    扩展名:   $ext"
    echo "    去扩展名: $basename_no_ext"
    echo "    全小写:   $lowercase"
    echo ""
done
SCRIPT

chmod +x ~/bash-lesson23/filename-tool.sh
~/bash-lesson23/filename-tool.sh /usr/local/bin/script.sh \
    /home/user/Documents/report.TXT \
    /etc/nginx/nginx.conf \
    Makefile
```

### 练习 23.6：$@ 与 $* 的区别验证

**题目：**

编写一个脚本 `wrapper.sh`，它将自己收到的所有参数原封不动地传递给另一个命令（`echo`）。
要求分别用 `$@`（不加引号）、`"$@"`、`"$*"` 三种方式调用，观察带空格参数时的不同行为。

**答案：**

```bash
cat > ~/bash-lesson23/wrapper.sh << 'SCRIPT'
#!/bin/bash

echo "脚本 $0 收到 $# 个参数"

# 定义测试函数
test_pass() {
    local desc="$1"
    shift
    echo ""
    echo "--- $desc ---"
    echo "参数展开为: $@"
    echo "参数个数: $#"
    count=0
    for arg in "$@"; do
        ((count++))
        echo "  参数$count: [$arg]"
    done
}

# 测试1：不加引号的 $@（危险）
test_pass "不加引号 \$@" $@

# 测试2：加引号的 "$@"（推荐）
test_pass "加引号 \"\$@\"" "$@"

# 测试3：加引号的 "$*"（合并）
test_pass "加引号 \"\$*\"" "$*"

echo ""
echo "结论: 几乎所有情况下都应该使用 \"\$@\""
SCRIPT

chmod +x ~/bash-lesson23/wrapper.sh
~/bash-lesson23/wrapper.sh hello "world bash" "ubuntu linux" test
```

### 练习 23.7：组合挑战 -- 日志分析脚本

**题目：**

编写一个脚本 `log-analyzer.sh`，实现以下功能：
（1）接收一个日志文件路径作为参数（必填，使用 `${1:?}` 检查）
（2）统计总行数
（3）统计包含 ERROR 的行数（不区分大小写）
（4）统计包含 WARNING 的行数（不区分大小写）
（5）输出报告（使用 printf 格式化对齐）
（6）使用 bc 计算错误率（ERROR/总行数 * 100，保留 2 位小数）

**答案：**

```bash
cat > ~/bash-lesson23/log-analyzer.sh << 'SCRIPT'
#!/bin/bash

# 参数检查（使用 ${var:?}）
logfile="${1:?用法: $0 <日志文件路径>}"

if [ ! -f "$logfile" ]; then
    echo "错误: 文件 '$logfile' 不存在" >&2
    exit 1
fi

echo "=============================================="
echo "  日志分析报告"
echo "=============================================="
echo "文件: $logfile"
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 统计
total_lines=$(wc -l < "$logfile")
error_count=$(grep -ci "error" "$logfile")
warn_count=$(grep -ci "warn" "$logfile")

# 使用 bc 计算错误率
if [ "$total_lines" -gt 0 ]; then
    error_rate=$(bc -l <<< "scale=2; $error_count * 100 / $total_lines")
    warn_rate=$(bc -l <<< "scale=2; $warn_count * 100 / $total_lines")
else
    error_rate="0.00"
    warn_rate="0.00"
fi

# 格式化输出
printf "%-20s %10s %10s\n" "指标" "数量" "占比"
printf "%-20s %10s %10s\n" "--------------------" "----------" "----------"
printf "%-20s %10d %10s\n" "总行数" "$total_lines" "100.00%"
printf "%-20s %10d %9.2f%%\n" "ERROR 行数" "$error_count" "$error_rate"
printf "%-20s %10d %9.2f%%\n" "WARNING 行数" "$warn_count" "$warn_rate"

echo ""
echo "=============================================="
SCRIPT

chmod +x ~/bash-lesson23/log-analyzer.sh

# 创建测试日志文件
cat > /tmp/test-log.txt << 'LOG'
2026-07-30 10:00:01 INFO  System started
2026-07-30 10:00:05 ERROR Connection failed to database
2026-07-30 10:01:00 INFO  User login: alice
2026-07-30 10:01:30 WARN  Disk usage exceeds 80%
2026-07-30 10:02:00 ERROR Timeout on API request
2026-07-30 10:02:15 ERROR File not found: config.yaml
2026-07-30 10:03:00 WARN  Memory usage high
2026-07-30 10:03:30 INFO  Backup completed
2026-07-30 10:04:00 INFO  User logout: alice
2026-07-30 10:04:45 ERROR Permission denied: /etc/shadow
LOG

~/bash-lesson23/log-analyzer.sh /tmp/test-log.txt
rm -f /tmp/test-log.txt
```

### 练习 23.8：参数展开进阶 -- 字符串格式转换器

**题目：**

编写一个脚本 `string-converter.sh`，接收一个字符串参数，输出以下转换结果：
（1）原始字符串
（2）全大写
（3）全小写
（4）首字母大写
（5）字符串长度
（6）去除前后空白
（7）将空格替换为下划线（snake_case 风格）
（8）如果字符串以 "The " 开头，将其替换为 "A "

**答案：**

```bash
cat > ~/bash-lesson23/string-converter.sh << 'SCRIPT'
#!/bin/bash

input="${1:?用法: $0 <字符串>}"

echo "======================================"
echo "  字符串格式转换器"
echo "======================================"
echo "原始字符串:     [$input]"
echo "全大写 (^^):   [${input^^}]"
echo "全小写 (,,):   [${input,,}]"
echo "首大写 (^):    [${input^}]"
echo "首小写 (,):    [${input,}]"
echo "字符串长度:    ${#input} 个字符"

# 去除前后空白（使用参数展开技巧）
trimmed="${input#"${input%%[![:space:]]*}"}"
trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
echo "去前后空白:    [$trimmed]"

# 替换空格为下划线
snake="${input// /_}"
echo "snake_case:    $snake"

# 替换开头
echo "替换开头/The/: [${input/#The /A }]"

# 额外的模式匹配演示
echo ""
path="${input}"
# 如果看起来像路径
if [[ "$input" == */* ]]; then
    echo "路径分析:"
    echo "  文件名:     ${input##*/}"
    echo "  目录:       ${input%/*}"
    echo "  扩展名:     ${input##*.}"
fi
SCRIPT

chmod +x ~/bash-lesson23/string-converter.sh
~/bash-lesson23/string-converter.sh "The Quick Brown Fox"

echo ""
echo "=== 测试带空白的字符串 ==="
~/bash-lesson23/string-converter.sh "   hello world   "

echo ""
echo "=== 测试路径风格字符串 ==="
~/bash-lesson23/string-converter.sh "/usr/local/bin/my-app.sh"
```

### 练习 23.9：IFS 实战 -- CSV 解析器

**题目：**

编写脚本解析一个 CSV 格式的字符串。CSV 数据包含：姓名,年龄,城市,职业。要求：
（1）使用自定义 IFS 分割字段
（2）将每个字段存入数组
（3）格式化输出

**答案：**

```bash
cat > ~/bash-lesson23/csv-parser.sh << 'SCRIPT'
#!/bin/bash

csv_data="${1:-"张三,28,深圳,软件工程师"}"

echo "=== CSV 解析器 ==="
echo "原始数据: $csv_data"
echo ""

# 方法1：使用 IFS 和 read
echo "--- 方法1: IFS + read ---"
old_ifs="$IFS"
IFS=','
read -r name age city profession <<< "$csv_data"
IFS="$old_ifs"

printf "%-10s: %s\n" "姓名" "$name"
printf "%-10s: %s\n" "年龄" "$age"
printf "%-10s: %s\n" "城市" "$city"
printf "%-10s: %s\n" "职业" "$profession"

echo ""

# 方法2：使用数组
echo "--- 方法2: 数组 ---"
old_ifs="$IFS"
IFS=','
read -r -a fields <<< "$csv_data"
IFS="$old_ifs"

echo "共 ${#fields[@]} 个字段:"
for i in "${!fields[@]}"; do
    # 去除前后空白
    field="${fields[$i]}"
    field="${field#"${field%%[![:space:]]*}"}"
    field="${field%"${field##*[![:space:]]}"}"
    echo "  字段 $((i+1)): [$field]"
done

echo ""

# 方法3：while + IFS（处理多行CSV）
echo "--- 方法3: 逐行解析 ---"
cat << 'CSVDATA' | while IFS=',' read -r name age city job; do
    echo "  $name | $age | $city | $job"
done
张三,28,深圳,软件工程师
李四,35,上海,产品经理
王五,22,北京,数据分析师
CSVDATA
SCRIPT

chmod +x ~/bash-lesson23/csv-parser.sh
~/bash-lesson23/csv-parser.sh "Alice,30,London,Designer"
```

### 练习 23.10：综合挑战 -- 简易备份脚本

**题目：**

编写一个完整的备份脚本 `backup.sh`，要求：
（1）接收源目录和目标目录作为参数
（2）检查源目录是否存在（使用 `${var:?}` 检查参数）
（3）创建时间戳命名的备份目录
（4）使用数组存储要排除的文件模式
（5）统计备份的文件数和总大小
（6）使用 `bc` 计算备份耗时（秒，保留 1 位小数）
（7）生成备份报告
（8）正确使用 `"$@"` 传递参数给内部函数

**答案：**

```bash
cat > ~/bash-lesson23/backup.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# --- 参数检查 ---
src_dir="${1:?用法: $0 <源目录> <目标目录>}"
dest_base="${2:?用法: $0 <源目录> <目标目录>}"

if [ ! -d "$src_dir" ]; then
    echo "错误: 源目录 '$src_dir' 不存在" >&2
    exit 1
fi

# --- 变量 ---
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="${dest_base}/backup_${timestamp}"
SCRIPT_NAME="$(basename "$0")"
start_time=$(date +%s.%N)

# --- 排除模式（数组） ---
declare -a exclude_patterns=(
    "*.tmp"
    "*.log"
    ".git"
    "__pycache__"
    "node_modules"
)

# --- 函数 ---
log() { echo "[$(date '+%H:%M:%S')] $*"; }
error() { echo "[ERROR] $*" >&2; }

# --- 主逻辑 ---
echo "================================================"
echo "  $SCRIPT_NAME - 备份脚本"
echo "================================================"
log "源目录:   $src_dir"
log "目标目录: $backup_dir"

# 创建备份目录
mkdir -p "$backup_dir"
log "备份目录已创建"

# 复制文件（使用 rsync 如果可用）
if command -v rsync > /dev/null 2>&1; then
    log "使用 rsync 进行备份..."
    rsync -a "$src_dir/" "$backup_dir/" 2>/dev/null
else
    log "使用 cp 进行备份..."
    cp -r "$src_dir/"* "$backup_dir/" 2>/dev/null
fi

# --- 统计 ---
file_count=$(find "$backup_dir" -type f 2>/dev/null | wc -l)
total_size=$(du -sb "$backup_dir" 2>/dev/null | cut -f1)
# 转换为人类可读格式
if [ -n "$total_size" ] && [ "$total_size" -gt 0 ]; then
    size_mb=$(bc -l <<< "scale=1; $total_size / 1048576")
else
    size_mb="0.0"
fi

# 计算耗时
end_time=$(date +%s.%N)
elapsed=$(bc -l <<< "scale=1; $end_time - $start_time")

# --- 报告 ---
echo ""
echo "================================================"
echo "  备份报告"
echo "================================================"
printf "%-20s %s\n" "备份时间:" "$timestamp"
printf "%-20s %d\n" "文件总数:" "$file_count"
printf "%-20s %s MB\n" "总大小:" "$size_mb"
printf "%-20s %s 秒\n" "耗时:" "$elapsed"

# 排除模式说明
echo ""
echo "排除模式: ${exclude_patterns[*]}"
echo "================================================"
log "备份完成!"
SCRIPT

chmod +x ~/bash-lesson23/backup.sh

# 测试（使用临时目录）
mkdir -p /tmp/test-src/subdir
echo "file1" > /tmp/test-src/file1.txt
echo "file2" > /tmp/test-src/file2.txt
echo "file3" > /tmp/test-src/subdir/file3.txt
mkdir -p /tmp/test-dest

~/bash-lesson23/backup.sh /tmp/test-src /tmp/test-dest

# 清理
rm -rf /tmp/test-src /tmp/test-dest
```

---

## 5. 常见错误与排错

### 5.1 误区：忘记 shebang 或 shebang 路径错误

**错误案例：**

```bash
# 脚本没有 shebang 行
echo "Hello"
```

**问题：**

没有 shebang 的脚本用 `./script.sh` 执行时，系统不知道用哪个解释器。`bash script.sh` 执行没问题，但直接执行会失败或不按预期工作。

**正确做法：**

```bash
#!/bin/bash
# 脚本第一行必须是 shebang
echo "Hello"
```

```bash
# 演示
cat > /tmp/no-shebang.sh << 'EOF'
echo "无 shebang 的脚本"
EOF
chmod +x /tmp/no-shebang.sh
/tmp/no-shebang.sh 2>&1 || echo "（可能失败或使用默认shell）"
bash /tmp/no-shebang.sh  # 这种方式始终有效
rm -f /tmp/no-shebang.sh
```

### 5.2 误区：忘记 chmod +x

**错误案例：**

```bash
# 创建脚本后直接尝试 ./script.sh
cat > script.sh << 'EOF'
#!/bin/bash
echo "Hello"
EOF
./script.sh
# Permission denied!
```

**正确做法：**

```bash
chmod +x script.sh
./script.sh
```

### 5.3 误区：变量引用不加双引号

**错误案例：**

```bash
filename="my document.txt"
cat $filename    # 展开为 cat my document.txt —— 两个参数！
```

**问题：**

不加引号的变量会经历单词分割（Word Splitting）和文件名展开（Globbing）。这是 Bash 脚本中**最常见**的 bug 来源。

**正确做法：**

```bash
filename="my document.txt"
cat "$filename"    # 正确——一个参数
```

```bash
# 演示：单词分割的危害
echo "=== 不加引号（错误）==="
files="file1.txt file2.txt"
for f in $files; do
    echo "  文件: $f"
done
# 输出两行（单词分割了）

echo "=== 加引号（正确）==="
for f in "$files"; do
    echo "  文件: $f"
done
# 输出一行（整个作为整体）

echo ""
echo "规则：变量引用几乎总是应该用双引号包裹，除非你有意利用单词分割。"
```

### 5.4 误区：混淆 `$@` 和 `$*`

**错误案例：**

```bash
# 想将所有参数传递给另一个命令
some_command $*     # 错误！带空格的参数会被拆分
some_command $@     # 同样错误！
```

**正确做法：**

```bash
some_command "$@"   # 正确！每个参数保持独立并正确引用
```

```bash
# 演示
cat > /tmp/bad-pass.sh << 'SCRIPT'
#!/bin/bash
echo "=== 错误：\$* ==="
set -- "hello world" "ubuntu linux"
for arg in $*; do echo "  [$arg]"; done   # 4个！
echo "=== 正确：\"\$@\" ==="
for arg in "$@"; do echo "  [$arg]"; done # 2个！
SCRIPT
bash /tmp/bad-pass.sh
rm -f /tmp/bad-pass.sh
```

### 5.5 误区：在 `$(( ))` 中变量前加 `$` 导致可移植性问题

在 `$(( ))` 中，`$` 是可选的。但某些实现中，含有未声明变量的表达式可能行为不一致。

**最佳实践：**

```bash
x=10; y=3
echo $(( x + y ))     # 推荐：省略 $
echo $(( $x + $y ))   # 也可以，但 $ 是冗余的
```

### 5.6 误区：`let` 表达式中有空格但没加引号

```bash
let x = 5 + 3     # 错误！Shell 把 "=" 和 "5" 看作独立参数
let "x = 5 + 3"   # 正确
(( x = 5 + 3 ))   # 推荐：使用 $(()) 更清晰
```

### 5.7 误区：关联数组忘记 `declare -A`

```bash
# 错误：没有声明关联数组
arr["key"]="value"     # Bash 将 "key" 当作索引0（字符串转整数）

# 正确
declare -A arr
arr["key"]="value"
```

```bash
# 演示错误
echo "=== 忘记 declare -A 的后果 ==="
wrong_arr["name"]="test"
echo "wrong_arr[name] = ${wrong_arr[name]}"
echo "wrong_arr[0] = ${wrong_arr[0]}"    # key 被转为 0！

echo ""
declare -A correct_arr
correct_arr["name"]="test"
echo "correct_arr[name] = ${correct_arr[name]}"
```

### 5.8 误区：单引号里使用变量

```bash
name="Alice"
echo 'Hello $name'    # 输出: Hello $name（字面量）
echo "Hello $name"    # 输出: Hello Alice
```

### 5.9 误区：反引号中的嵌套命令替换

```bash
# 错误（可读性极差）
result=`echo \`date\``

# 正确
result=$(echo $(date))
```

### 5.10 误区：`${var: -3}` 和 `${var:-3}` 混淆

```bash
text="HelloWorld"

# ${var:-word}  -- 默认值语法（var 不存在时返回 word）
echo "${undefined:-3}"        # 输出: 3

# ${var: -3}  -- 子串截取（从倒数第3个开始，注意空格！）
echo "${text: -3}"            # 输出: rld

# ${var:offset}  -- 子串截取（从 offset 开始）
echo "${text:5}"              # 输出: World
```

---

## 6. 进阶延伸

### 6.1 Shebang 的内核级实现

Shebang 不是 Shell 的特性——它是 Linux 内核的特性。当你执行 `./script.sh` 时，处理发生在内核的 `execve()` 系统调用中。

```
+------------------------------------------------------------------+
|                    内核中的 Shebang 处理流程                           |
|                                                                  |
|  execve("./script.sh", argv, envp)                                |
|    ↓                                                              |
|  内核 do_execve() → exec_binprm()                                 |
|    ↓                                                              |
|  检查文件的前 256 字节: search_binary_handler()                    |
|    ↓                                                              |
|  发现 #! 开头: load_script()                                       |
|    ↓                                                              |
|  解析第一行，提取解释器路径和参数:                                    |
|    #!/usr/bin/env bash                                             |
|    → interpreter = "/usr/bin/env"                                 |
|    → arg = "bash"                                                 |
|    ↓                                                              |
|  重新调用: execve("/usr/bin/env", ["env", "bash", "./script.sh"])  |
+------------------------------------------------------------------+
```

**关键限制：**
- 大部分系统只检查文件的前 128-256 字节
- Shebang 行通常限制在 127 字符以内
- 大多数系统只支持一个可选参数给解释器

### 6.2 安全脚本模板 -- 生产环境最佳实践

```bash
cat > ~/bash-lesson23/safe-template.sh << 'SCRIPT'
#!/bin/bash
# ==========================================
# 安全 Bash 脚本模板
# ==========================================
# 适用于生产环境的完整设置

# --- Shell 设置 ---
set -euo pipefail          # 严格模式
IFS=$'\n\t'                # 安全的 IFS

# --- 颜色输出（如果终端支持） ---
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED='' GREEN='' YELLOW='' NC=''
fi

# --- 日志函数 ---
log_info()  { echo -e "${GREEN}[INFO]${NC} $(date '+%H:%M:%S') $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $*" >&2; }

# --- 清理函数 ---
cleanup() {
    local exit_code=$?
    log_info "清理中... (退出码: $exit_code)"
    # 删除临时文件
    rm -f "${TMPFILE:-}" 2>/dev/null
    exit $exit_code
}
trap cleanup EXIT INT TERM

# --- 使用帮助 ---
usage() {
    cat << EOF
用法: $(basename "$0") [选项] <参数>

选项:
  -h, --help     显示此帮助
  -v, --verbose  详细输出
  -o, --output   输出文件路径

示例:
  $(basename "$0") -v -o result.txt input.txt
EOF
    exit 0
}

# --- 参数解析 ---
VERBOSE=false
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)    usage ;;
        -v|--verbose) VERBOSE=true; shift ;;
        -o|--output)  OUTPUT_FILE="$2"; shift 2 ;;
        --)           shift; break ;;
        -*)           log_error "未知选项: $1"; usage ;;
        *)            break ;;
    esac
done

# --- 依赖检查 ---
check_deps() {
    local missing=()
    for cmd in "$@"; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            missing+=("$cmd")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "缺少依赖: ${missing[*]}"
        exit 1
    fi
}

# --- 主逻辑 ---
main() {
    log_info "脚本启动 (PID: $$)"
    $VERBOSE && log_info "详细模式开启"
    
    # 你的业务逻辑
    log_info "Hello, 这是安全脚本模板"
    
    log_info "脚本完成"
}

# --- 入口 ---
main "$@"
SCRIPT

chmod +x ~/bash-lesson23/safe-template.sh
echo "安全脚本模板已创建: ~/bash-lesson23/safe-template.sh"
~/bash-lesson23/safe-template.sh --help
```

### 6.3 使用 getopt/getopts 处理复杂参数

对于需要复杂选项解析的脚本，使用 `getopts`（POSIX）或 `getopt`（GNU）：

```bash
# getopts 示例（POSIX，推荐用于短选项）
cat > ~/bash-lesson23/getopts-demo.sh << 'SCRIPT'
#!/bin/bash

usage() {
    echo "用法: $0 [-v] [-f file] [-n count] arg1"
    exit 1
}

VERBOSE=false
FILE=""
COUNT=10

while getopts "vf:n:h" opt; do
    case "$opt" in
        v) VERBOSE=true ;;
        f) FILE="$OPTARG" ;;
        n) COUNT="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done
shift $((OPTIND - 1))

echo "VERBOSE: $VERBOSE"
echo "FILE:    $FILE"
echo "COUNT:   $COUNT"
echo "剩余参数: $@"
SCRIPT

chmod +x ~/bash-lesson23/getopts-demo.sh
~/bash-lesson23/getopts-demo.sh -v -f config.ini -n 20 hello world
```

### 6.4 关联数组的高级应用：多值存储与 LRU 缓存

```bash
cat > ~/bash-lesson23/assoc-advanced.sh << 'SCRIPT'
#!/bin/bash

# 场景1：一个键对应多个值（用分隔符）
declare -A multi_value
multi_value["user1"]="read,write,execute"
multi_value["user2"]="read"

echo "=== 多值关联数组 ==="
for user in "${!multi_value[@]}"; do
    old_ifs="$IFS"
    IFS=','
    read -r -a perms <<< "${multi_value[$user]}"
    IFS="$old_ifs"
    echo "  $user 的权限: ${perms[@]}"
done

# 场景2：简单计数器
echo ""
echo "=== 访问计数器 ==="
declare -A page_views
pages=("/home" "/home" "/about" "/home" "/contact" "/about" "/home")

for page in "${pages[@]}"; do
    ((page_views["$page"]++))
done

for page in "${!page_views[@]}"; do
    echo "  $page: ${page_views[$page]} 次"
done

# 场景3：标记已处理元素（去重）
echo ""
echo "=== 去重处理 ==="
declare -A processed
items=("task1" "task2" "task1" "task3" "task2" "task4")

for item in "${items[@]}"; do
    if [[ -z "${processed[$item]:-}" ]]; then
        echo "  处理: $item"
        processed[$item]=1
    else
        echo "  跳过(重复): $item"
    fi
done
SCRIPT

chmod +x ~/bash-lesson23/assoc-advanced.sh
~/bash-lesson23/assoc-advanced.sh
```

### 6.5 参数展开的性能考量

参数展开是 Bash 内置操作，性能极高。在循环中大量操作字符串时，参数展开比调用外部命令（`sed`、`awk`、`cut`）快 10-100 倍。

```bash
# 性能对比（概念演示）
echo "=== 参数展开 vs 外部命令 ==="

text="The quick brown fox jumps over the lazy dog"

# 参数展开（内置，极快）
time for i in {1..1000}; do
    _="${text/fox/cat}"
    _="${text##* }"
    _="${text^^}"
done 2>&1 | grep -E 'real|user'

echo ""
echo "对比：同样的操作如果每次调用 sed 会慢得多"
echo "规则：能用参数展开的地方绝不用外部命令"
```

### 6.6 技巧：使用 eval 动态构建变量名

**警告：`eval` 有安全风险，仅在受控场景使用！** `eval` 让 Shell 对其参数进行第二次解析——这既是它强大的原因，也是它危险的原因。

```bash
# eval 的安全使用场景：动态变量赋值
prefix="config"
for key in host port user; do
    eval "${prefix}_${key}=value_of_${key}"
done
# 等价于：
# config_host=value_of_host
# config_port=value_of_port
# config_user=value_of_user
echo "config_host = $config_host"
echo "config_port = $config_port"

# 更安全的替代：使用 nameref（Bash 4.3+）
for key in db_host db_port; do
    value="dynamic_${key}"
    declare -g "$key=$value"
done
echo "db_host = $db_host"
```

### 6.7 最佳实践清单

```bash
echo "=========================================="
echo "  Bash 脚本编程 —— 最佳实践清单"
echo "=========================================="
echo ""
echo "【Shebang】"
echo "  + 始终使用 #!/bin/bash 或 #!/usr/bin/env bash"
echo "  + 避免 #!/bin/sh 除非需要 POSIX 兼容"
echo "  - 不要省略 shebang"
echo ""
echo "【安全设置】"
echo "  + 脚本开头使用 set -euo pipefail"
echo "  + trap cleanup EXIT 确保清理逻辑执行"
echo "  + 验证所有输入参数"
echo ""
echo "【引号】"
echo "  + 变量引用始终用双引号: \"\$var\""
echo "  + 字面量字符串用单引号: 'static text'"
echo "  + 命令替换用 \$() 而非反引号"
echo ""
echo "【数组】"
echo "  + 遍历时 \"\${arr[@]}\" 而非 \$arr"
echo "  + 关联数组必须 declare -A"
echo "  + 用 \${!arr[@]} 获取所有键/索引"
echo ""
echo "【算术】"
echo "  + 整数运算用 \$(( ))"
echo "  + 浮点运算用 bc"
echo "  + 避免使用 expr"
echo ""
echo "【参数】"
echo "  + 传递参数用 \"\$@\" 而非 \$* 或 \$@"
echo "  + 检查 \$# 验证参数数量"
echo "  + 用 \${var:?} 检查必填参数"
echo ""
echo "【展开】"
echo "  + 能用参数展开的地方绝不用外部命令"
echo "  + 文件名提取: \${var##*/} \${var%%.*}"
echo "  + 默认值: \${var:-default}"
echo ""
echo "【调试】"
echo "  + set -x 查看每条命令的执行"
echo "  + set -u 捕捉未定义变量"
echo "  + declare -p 查看变量类型和值"
echo "  + shellcheck 静态分析脚本（推荐安装）"
```

---

本章至此结束。你学习了 Bash 脚本编程的基础语法：shebang 与文件权限、三种引号的本质区别、索引数组与关联数组、四种算术运算方式、命令替换与参数展开的 15+ 种语法，以及脚本参数的特殊变量。这些知识构成了 Shell 脚本编程的"词汇表"——掌握它们，你就能读写任何 Bash 脚本的基本结构。

第 24 章将进入**条件判断与循环**（Bash 脚本编程三部曲的第二部），届时你将学习 `if`、`case`、`for`、`while`、`until` 等流程控制结构——它们赋予脚本"智能决策"和"重复执行"的能力。

