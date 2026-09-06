# 第 25 章 Bash 脚本编程(下)：函数与高级技巧

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

### 1.1 从"脚本编写者"到"脚本工程师"

第 23 章你学会了 Bash 脚本的基础语法——shebang、引号、数组、算术运算、参数展开。第 24 章你掌握了条件判断与循环——`if`/`case`/`for`/`while`/`until`/`select`，这赋予脚本"智能决策"和"重复执行"的能力。

现在，你需要将脚本提升到**工程级**——让代码可组织、可调试、可防御：

- "当代码越来越多，如何避免重复编写相同的逻辑？"
- "函数内部的变量会污染全局命名空间吗？`local` 关键字到底做了什么？"
- "Bash 函数的'返回值'和'输出'是两回事——两者的区别是什么？"
- "脚本突然被 Ctrl+C 中断，临时文件留在磁盘上怎么办？"
- "如何优雅地解析 `-f file -v -n 10` 这样的命令行参数，而不是自己写一堆 if/case？"
- "脚本出错了，如何快速定位到哪一行、哪个函数？"
- "子 Shell（Subshell）的管道陷阱到底是什么？为什么 while+pipe 中的变量在循环外会丢失？"
- "Heredoc 能不能禁止变量展开？"

这些问题的核心是**函数与高级技巧**——将你的脚本从"能运行"提升到"健壮、可维护、可调试"的工程水准。

### 1.2 Bash 脚本三部曲：第 25 章的位置

```
+------------------------------------------------------------------+
|                    Phase 3：I/O 与变量 —— Shell 脚本的基础设施        |
|                                                                  |
|  第 23 章：Bash 脚本编程(上) - 基础语法                              |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  Shebang, 引号, 数组, 算术, 命令替换, 参数展开, 脚本参数       │ |
|  │  视角：Shell 编程的基本构建块 —— "词汇表"                      │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 24 章：Bash 脚本编程(中) - 条件与循环                            |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  if/case, for/while/until, 条件测试, break/continue/select   │ |
|  │  视角：脚本的"大脑" —— 智能决策与重复执行                       │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 25 章：Bash 脚本编程(下) - 函数与高级技巧  ← 你在这一章         |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  函数, local, trap, getopts, 调试, heredoc, 子shell, 性能     │ |
|  │  视角：脚本的"工程化" —— 从能运行到健壮可维护                    │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

第 23 章教你怎么"写"，第 24 章教你怎么"想"，第 25 章教你怎么"组织"——这是从编写一次性脚本走向构建可维护工具的最后一步。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **函数定义** | `function name {}`, `name() {}`, `local` | 代码复用、变量作用域隔离 |
| **函数调用与传参** | `$1`~`$N`, `$@`, `$#`, `shift`, `return` | 函数如何接收参数、返回状态码 |
| **信号处理** | `trap`, `EXIT`, `INT`, `TERM`, `ERR`, `DEBUG` | 捕获信号、脚本清理、优雅退出 |
| **参数解析** | `getopts`, `OPTARG`, `OPTIND` | POSIX 标准命令行选项解析 |
| **调试技术** | `set -x`, `set -e`, `set -u`, `set -o pipefail`, `PS4`, `BASH_SOURCE`, `BASH_LINENO`, `FUNCNAME` | 错误定位、执行追踪、防御性编程 |
| **内嵌文档** | Heredoc (`<<`), `<<-` (去缩进), 带引号定界符 | 在脚本中内嵌多行文本 |
| **子 Shell** | `( )`, 管道 `|`, 进程替换 `<()`, `>()` | 理解子 Shell 的变量隔离与性能影响 |

### 1.4 本章目标

完成本章后，你将能够：

- 使用两种语法定义函数，理解它们的等价性和细微差异
- 使用 `local` 隔离函数内部的变量，避免全局命名空间污染
- 区分函数的 `return`（退出码 0-255）和 stdout 输出（通过 `$()` 捕获）
- 正确使用函数内部的 `$1`、`$2`、`$@`、`$#` 和 `shift` 处理参数
- 使用 `trap` 捕获 `EXIT`、`INT`、`TERM` 等信号，实现脚本清理和优雅退出
- 使用 `getopts` 解析带参数的短选项（`-f file -v -n 10`）
- 使用 `set -x`（执行追踪）、`set -e`（遇错退出）、`set -u`（未定义变量报错）、`set -o pipefail`（管道错误检测）进行防御性编程和调试
- 定制 `PS4` 显示文件名、行号和函数名，实现精确的错误定位
- 正确使用 Heredoc（包括带引号定界符以禁止变量展开）
- 解释子 Shell 的创建时机、变量隔离机制，以及管道 while 变量丢失问题的三种解决方案
- 应用脚本性能优化的关键技巧

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS，使用 Bash 5.x。

```bash
# 确认 Bash 版本
echo $BASH_VERSION
# 输出示例：5.2.21(1)-release

# 创建一个练习目录
mkdir -p ~/bash-lesson25
cd ~/bash-lesson25
echo "练习目录已创建: $(pwd)"
```

---

## 2. 核心概念

### 2.1 函数：代码复用的基石

函数（Function）是 Bash 中实现代码复用（Code Reuse）的基本机制。它的本质是**给一组命令取一个名字，之后可以通过这个名字反复调用它们**。

```
+------------------------------------------------------------------+
|                    没有函数 vs 有函数                                 |
|                                                                    |
|  没有函数（重复代码）：                                              |
|  echo "=== 开始备份 ==="                                            |
|  tar -czf /backup/etc-$(date +%Y%m%d).tar.gz /etc                 |
|  echo "=== 备份完成 ==="                                            |
|  echo "=== 开始备份 ==="    ← 又写一遍                              |
|  tar -czf /backup/home-$(date +%Y%m%d).tar.gz /home               |
|  echo "=== 备份完成 ==="    ← 又写一遍                              |
|  （修改日志格式需要改 N 处）                                         |
|                                                                    |
|  有函数（一组逻辑只写一次）：                                         |
|  do_backup() {                                                     |
|      local name="$1"                                               |
|      log "开始备份 $name"                                          |
|      tar -czf "/backup/${name}-$(date +%Y%m%d).tar.gz" "/$name"   |
|      log "备份 $name 完成"                                         |
|  }                                                                 |
|  do_backup etc           ← 一个名字调用一次                         |
|  do_backup home          ← 复用！                                  |
|  （修改日志格式只需改 1 处）                                         |
+------------------------------------------------------------------+
```

#### 2.1.1 两种定义语法

Bash 支持两种函数定义语法，它们**完全等价**：

```bash
# 语法1：function 关键字（推荐——可读性更好）
function myfunc {
    echo "这是函数"
}

# 语法2：函数名+括号（POSIX 兼容）
myfunc() {
    echo "这是函数"
}

# 两种语法可以混合：function 关键字 + 括号（Bash/Ksh 特有）
function myfunc() {
    echo "这也是合法的（但非 POSIX）"
}
```

**选择建议：**

| 语法 | 兼容性 | 可读性 | 推荐场景 |
|------|--------|--------|---------|
| `function name { }` | Bash/Ksh | 高——`function` 关键字一目了然 | 日常 Bash 脚本 |
| `name() { }` | POSIX | 中——括号容易和变量混淆 | 需要 POSIX 兼容时 |
| `function name() { }` | Bash/Ksh | 最高 | 个人偏好（本书推荐） |

```bash
# 演示：三种语法对比
cat > /tmp/func-syntax.sh << 'SCRIPT'
#!/bin/bash

# 语法1：function 关键字
function greet1 {
    echo "[greet1] 你好！"
}

# 语法2：括号
greet2() {
    echo "[greet2] 你好！"
}

# 语法3：function + 括号
function greet3() {
    echo "[greet3] 你好！"
}

# 三者调用方式完全一样
greet1
greet2
greet3

# 验证它们的类型
echo ""
echo "greet1 类型: $(type -t greet1)"
echo "greet2 类型: $(type -t greet2)"
echo "greet3 类型: $(type -t greet3)"
# 三者的 type 都是 "function"
SCRIPT

bash /tmp/func-syntax.sh
rm -f /tmp/func-syntax.sh
```

#### 2.1.2 函数的调用

函数调用**不需要括号**——直接写函数名即可，就像调用普通命令一样：

```bash
# 定义
function say_hello {
    echo "Hello, $1!"
}

# 调用（注意：没有括号！）
say_hello "World"     # 输出: Hello, World!
say_hello "Ubuntu"    # 输出: Hello, Ubuntu!

# 错误方式（不要这样做）：
# say_hello("World")  # Bash 会将 () 解释为子 Shell！
```

```bash
# 演示：函数调用的正确与错误方式
cat > /tmp/func-call.sh << 'SCRIPT'
#!/bin/bash

function myfunc {
    echo "函数 myfunc 被调用，参数: $@"
}

echo "=== 正确调用 ==="
myfunc hello world         # 正确！

echo ""
echo "=== 错误调用（带括号）==="
# myfunc(hello world)     # 这会导致语法错误！
echo "myfunc(hello) 会导致语法错误，因为 () 是子 Shell 语法"

echo ""
echo "=== 命令替换中调用 ==="
result=$(myfunc "from" "substitution")
echo "捕获的输出: $result"

echo ""
echo "=== 作为条件调用 ==="
function is_even {
    return $(( $1 % 2 ))
}
if is_even 10; then
    echo "10 是偶数（return 0 => 真）"
fi
if ! is_even 7; then
    echo "7 是奇数（return 1 => 假）"
fi
SCRIPT

bash /tmp/func-call.sh
rm -f /tmp/func-call.sh
```

**关键规则：** 函数在被调用之前必须已经定义。Bash 是解释执行的，如果调用时函数尚未定义，会得到 "command not found" 错误。

### 2.2 local 变量：函数内的作用域隔离

`local` 是 Bash 函数中最重要的关键字之一。它声明一个变量的作用域（Scope）仅限于该函数内部——函数外部的同名变量不会被修改。

```
+------------------------------------------------------------------+
|                    local 变量的作用域隔离                             |
|                                                                    |
|  var="全局值"                                                       |
|                                                                    |
|  function test {                                                   |
|      local var="局部值"     ← 只在函数内部可见                       |
|      echo "函数内: $var"    → 输出 "局部值"                         |
|      var="修改局部"          → 修改的还是局部 var                    |
|  }                                                                 |
|                                                                    |
|  test                                                              |
|  echo "函数外: $var"        → 输出 "全局值"（全局未被修改！）        |
|                                                                    |
|  ┌──────────────────────────────────────────────────────────────┐  |
|  │  全局作用域: var="全局值"                                      │  |
|  │  ┌──────────────────────────────────────────────────────┐    │  |
|  │  │  函数作用域: local var="局部值"                        │    │  |
|  │  │  （同名的另一个变量，与全局 var 完全隔离）              │    │  |
|  │  └──────────────────────────────────────────────────────┘    │  |
|  └──────────────────────────────────────────────────────────────┘  |
+------------------------------------------------------------------+
```

#### 2.2.1 基本演示

```bash
cat > /tmp/local-demo.sh << 'SCRIPT'
#!/bin/bash

# 全局变量
global_var="全局值"

function test_local {
    local local_var="局部值"
    local global_var="函数内的同名局部变量"
    
    echo "=== 函数内部 ==="
    echo "local_var:  $local_var"
    echo "global_var: $global_var  <-- 这是局部版本，遮蔽了全局"
}

function test_no_local {
    no_local_var="没有 local 的变量"
    global_var="修改了全局变量！"   # 没有 local，直接修改全局！
    
    echo "=== test_no_local 函数内 ==="
    echo "no_local_var: $no_local_var"
    echo "global_var:   $global_var"
}

echo "=== 调用前 ==="
echo "global_var: $global_var"
echo "local_var:  ${local_var:-未定义}"
echo "no_local_var: ${no_local_var:-未定义}"

echo ""
test_local

echo ""
echo "=== test_local 调用后 ==="
echo "global_var: $global_var  <-- 全局值未被修改！"
echo "local_var:  ${local_var:-未定义}  <-- 函数退出后不可访问"

echo ""
test_no_local

echo ""
echo "=== test_no_local 调用后 ==="
echo "global_var:   $global_var  <-- 全局值被修改了！"
echo "no_local_var: $no_local_var  <-- 泄漏到全局了！"
SCRIPT

bash /tmp/local-demo.sh
rm -f /tmp/local-demo.sh
```

#### 2.2.2 local 的声明与赋值分离

```bash
# local 可以先声明后赋值
function demo {
    local name       # 声明（值为空）
    local count=0    # 声明并赋值
    
    name="Alice"     # 赋值（仍是局部变量）
    ((count++))
    
    echo "$name: $count"
}

# local 的一次性声明多个变量
function multi_local {
    local x y z
    local a=1 b=2 c=3
    
    echo "x=$x, y=$y, z=$z"
    echo "a=$a, b=$b, c=$c"
}
```

#### 2.2.3 local 与命令替换的陷阱

```bash
# local 配合命令替换时的微妙行为
function bad_local {
    # 错误：local + 命令替换，local 的返回值会覆盖命令的退出码
    local result=$(false)    # false 返回 1，但 local 返回 0（声明成功）
    echo "退出码: $?"          # 输出 0！false 的退出码被 local 吞噬了
}

function good_local {
    # 正确：分离声明和赋值
    local result
    result=$(false)
    echo "退出码: $?"          # 输出 1！正确保留了命令的退出码
}

echo "=== local 的退出码陷阱 ==="
bad_local
good_local
```

**规则：** `local` 本身是一个命令，它总是返回 0。如果你需要检查命令替换中命令的退出码，必须将 `local` 声明和赋值分开。

#### 2.2.4 函数嵌套调用与作用域链

```bash
cat > /tmp/scope-chain.sh << 'SCRIPT'
#!/bin/bash

var_global="G"

function outer {
    local var_outer="O"
    echo "[outer] 开始: global=$var_global, outer=$var_outer, inner=${var_inner:-未定义}"
    
    function inner {
        local var_inner="I"
        echo "[inner] global=$var_global, outer=$var_outer, inner=$var_inner"
        # inner 可以访问 outer 的 local 变量！
        # 因为 inner 在 outer 内部定义，共享 outer 的作用域
    }
    
    inner
    echo "[outer] 结束: global=$var_global, outer=$var_outer, inner=${var_inner:-未定义}"
    # 注意：inner 的 local 变量在 inner 退出后不可访问
}

outer
echo "[全局] global=$var_global, outer=${var_outer:-未定义}, inner=${var_inner:-未定义}"
# outer 的 local 变量在 outer 退出后也不可访问
SCRIPT

bash /tmp/scope-chain.sh
rm -f /tmp/scope-chain.sh
```

### 2.3 函数的"返回值"：return vs stdout 输出

Bash 函数与大多数编程语言的一个根本区别是：**函数有两种不同的"返回"方式**。这个区别是很多 Bash 脚本错误的根源。

#### 2.3.1 return：退出状态码（0-255）

```bash
# return 返回的是退出状态码（Exit Code），必须是 0-255 之间的整数
# 0 = 成功，非 0 = 失败

function check_file {
    if [[ -f "$1" ]]; then
        return 0    # 文件存在 => 成功
    else
        return 1    # 文件不存在 => 失败
    fi
}
# 调用者通过 $? 获取 return 的值
check_file /etc/passwd && echo "文件存在" || echo "文件不存在"

# 注意：return 只能返回 0-255！
# return 256  会被截断为 0
# return -1   会被截断为 255
# return 300  会被截断为 44 (300 % 256)
```

#### 2.3.2 stdout 输出：数据返回

```bash
# 函数通过 echo/printf 向 stdout 输出数据，调用者通过 $() 捕获

function get_date {
    echo "$(date '+%Y-%m-%d')"     # 这是输出（数据），不是返回值
}
today=$(get_date)                    # 用 $() 捕获
echo "今天是: $today"

function add_numbers {
    local result=$(( $1 + $2 ))
    echo "$result"                   # 输出计算结果
}
sum=$(add_numbers 10 20)
echo "10 + 20 = $sum"
```

#### 2.3.3 两种"返回"的对比

```
+------------------------------------------------------------------+
|                    函数返回 vs 函数输出                               |
|                                                                    |
|  return N（退出状态码）          |  stdout 输出（数据）                |
|  ───────────────────────────────────────────────────────────────  |
|  目的：表示成功/失败             |  目的：传递数据给调用者            |
|  类型：0-255 整数               |  类型：任意文本                    |
|  获取：$?                       |  获取：$() 或 ``                  |
|  用于：if/while 条件判断         |  用于：变量赋值、管道传递          |
|  示例：return 0 / return 1       |  示例：echo "data"               |
|  限制：只能返回一个整数          |  限制：stdout 和 stderr 都会输出   |
+------------------------------------------------------------------+
```

#### 2.3.4 综合示例：同时使用两种返回

```bash
cat > /tmp/return-vs-output.sh << 'SCRIPT'
#!/bin/bash

# 这个函数同时使用两种"返回"：
# - stdout 输出用户名（数据）
# - return 退出码表示是否找到（状态）
function get_username {
    local uid="$1"
    local line name
    
    # 从 /etc/passwd 查找 UID
    line=$(grep "^[^:]*:[^:]*:$uid:" /etc/passwd 2>/dev/null)
    
    if [[ -n "$line" ]]; then
        name=$(echo "$line" | cut -d: -f1)
        echo "$name"         # 通过 stdout 返回用户名
        return 0             # 通过 return 返回"找到"的状态
    else
        echo "未知用户"       # 通过 stdout 返回错误提示
        return 1             # 通过 return 返回"未找到"的状态
    fi
}

# 测试
echo "=== 示例1：用户存在 ==="
user_name=$(get_username 0)
status=$?
echo "用户名: $user_name"
echo "状态码: $status (0=成功)"

echo ""
echo "=== 示例2：用户不存在 ==="
user_name=$(get_username 99999)
status=$?
echo "用户名: $user_name"
echo "状态码: $status (非0=失败)"

echo ""
echo "=== 示例3：在条件中使用 ==="
if get_username 1000 > /dev/null; then
    echo "UID 1000 存在"
else
    echo "UID 1000 不存在"
fi
SCRIPT

bash /tmp/return-vs-output.sh
rm -f /tmp/return-vs-output.sh
```

### 2.4 函数参数：$1、$2、$@ 与 shift

函数内部的参数机制与脚本的完全一样——函数拥有自己独立的 `$1`、`$2`、`$@`、`$#`。

```
+------------------------------------------------------------------+
|                    函数参数的独立性                                    |
|                                                                    |
|  ./script.sh apple banana                                         |
|    ├── $0 = ./script.sh                                            |
|    ├── $1 = apple                                                  |
|    ├── $2 = banana                                                 |
|    └── $# = 2                                                      |
|                                                                    |
|  script 内调用: myfunc cherry date                                 |
|    ├── $1 = cherry    ← 函数的 $1，不是脚本的 $1！                   |
|    ├── $2 = date                                                  |
|    └── $# = 2                                                      |
|                                                                    |
|  脚本的 $1 (apple) 在函数内部不可直接访问                             |
|  如果需要，必须在调用前保存：local script_arg1="$1"                    |
+------------------------------------------------------------------+
```

#### 2.4.1 基本参数传递

```bash
cat > /tmp/func-args.sh << 'SCRIPT'
#!/bin/bash

function show_args {
    echo "  函数名: ${FUNCNAME[0]}"
    echo "  参数个数: $#"
    
    local i=1
    for arg in "$@"; do
        echo "  \$($i) = [$arg]"
        ((i++))
    done
}

echo "=== 脚本级参数 ==="
echo "脚本本身收到 $# 个参数: $@"

echo ""
echo "=== 调用 show_args one two \"three four\" ==="
show_args one two "three four"

echo ""
echo "=== 调用 show_args (无参数) ==="
show_args

# 函数内部修改参数
function process {
    echo "处理参数: $@"
    echo "第一个: $1, 第二个: ${2:-无}"
    
    # 在函数内使用 shift
    local first="$1"
    shift
    echo "第一个参数是: $first, 剩余: ${@:-无}"
}

echo ""
echo "=== 函数内使用 shift ==="
process apple banana cherry
SCRIPT

bash /tmp/func-args.sh
rm -f /tmp/func-args.sh
```

#### 2.4.2 保存脚本参数到函数内部

```bash
cat > /tmp/preserve-args.sh << 'SCRIPT'
#!/bin/bash

# 场景：函数需要访问脚本的参数，同时也需要自己的参数

function show_context {
    local func_arg1="$1"       # 函数的第一个参数
    local script_args=("$@")   # 注意：函数内 $@ 是函数的参数！
    
    echo "函数的参数1: $func_arg1"
}

# 调用时传递脚本参数
function process_all {
    # 保存脚本参数（因为函数内 $@ 会变成函数的参数）
    local saved_args=("$@")
    
    echo "=== process_all 函数 ==="
    echo "收到的参数: ${saved_args[@]}"
    
    for arg in "${saved_args[@]}"; do
        echo "  处理: $arg"
    done
}

# 从脚本层调用，传递脚本的参数
process_all "$@"    # 将脚本的所有参数传递给函数
SCRIPT

chmod +x /tmp/preserve-args.sh
echo "=== 测试1：带参数调用脚本 ==="
/tmp/preserve-args.sh hello "ubuntu linux" world
rm -f /tmp/preserve-args.sh
```

### 2.5 子 Shell（Subshell）：隐式的变量隔离

理解子 Shell 是写出正确 Bash 脚本的关键。子 Shell 是当前 Shell 的一个**子进程副本**——它继承了父 Shell 的所有变量和环境，但对变量的任何修改都不会反映回父 Shell。

#### 2.5.1 子 Shell 的创建时机

```bash
# 以下操作都会创建子 Shell：

# 1. 括号 ()
( cd /tmp; echo "在子 Shell 中: $(pwd)" )
echo "回到父 Shell: $(pwd)"    # 目录未变！cd 在子 Shell 中

# 2. 管道中的每个命令（除了最后一个在某些配置下）
echo "hello" | while read line; do
    ((count++))                 # 在子 Shell 中修改变量
done
echo "count=$count"             # 0！变量修改丢失了

# 3. 命令替换 $()
result=$(cd /tmp; pwd)
echo "命令替换中的目录: $result"

# 4. 后台执行 &
sleep 1 &
echo "后台 PID: $!"             # 后台作业在子 Shell 中运行

# 5. 脚本执行（bash script.sh 或 ./script.sh）
# 脚本本身就在一个子 Shell 中运行（相对于调用它的 Shell）

# 6. 进程替换 <()  >()
while read line; do
    echo "$line"
done < <(echo "hello")          # <( ) 在子 Shell 中运行
```

#### 2.5.2 管道 while 变量丢失问题（最经典的子 Shell 陷阱）

```bash
cat > /tmp/pipe-while-trap.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  管道 while 的子 Shell 变量丢失问题"
echo "=========================================="

# --- 问题演示 ---
echo ""
echo "--- 问题：管道中的 while ---"
count=0
seq 1 5 | while read num; do
    ((count += num))
    echo "  循环内: count=$count (累加了 $num)"
done
echo "循环外: count=$count (期望 15，实际 0！)"
echo "原因: 管道的右边(while循环)在子 Shell 中运行"

# --- 解决方案1：进程替换 <() ---
echo ""
echo "--- 解决方案1：进程替换 ---"
count=0
while read num; do
    ((count += num))
done < <(seq 1 5)
echo "循环外: count=$count (正确！进程替换在当前 Shell 中运行 while)"

# --- 解决方案2：重定向 ---
echo ""
echo "--- 解决方案2：文件重定向 ---"
count=0
while read num; do
    ((count += num))
done <<< "$(seq 1 5)"
echo "循环外: count=$count (正确！here-string 不创建子 Shell)"

# --- 解决方案3：lastpipe 选项（Bash 4.2+） ---
echo ""
echo "--- 解决方案3：shopt -s lastpipe ---"
shopt -s lastpipe   # 将管道最后一个命令放在当前 Shell 中执行
count=0
seq 1 5 | while read num; do
    ((count += num))
done
echo "循环外: count=$count (正确！lastpipe 将 while 放在了当前 Shell)"
shopt -u lastpipe

# --- 解决方案4：使用命名管道（FIFO） ---
echo ""
echo "--- 解决方案4：使用中间变量/数组 ---"
# 简单场景下可以将数据先存入数组
data=($(seq 1 5))          # 数据存入当前 Shell 的数组
sum=0
for num in "${data[@]}"; do
    ((sum += num))
done
echo "sum=$sum (数组方案，避免子 Shell 问题)"
SCRIPT

bash /tmp/pipe-while-trap.sh
rm -f /tmp/pipe-while-trap.sh
```

**管道子 Shell 问题解决方案速查：**

| 方案 | 语法 | 适用场景 | Bash 版本要求 |
|------|------|---------|-------------|
| 进程替换 | `while read ... done < <(cmd)` | 通用，推荐 | Bash 3.0+ |
| Here String | `while read ... done <<< "$(cmd)"` | 数据量小时 | Bash 3.0+ |
| lastpipe 选项 | `shopt -s lastpipe` + 管道 | 脚本中（非交互式） | Bash 4.2+ |
| 预存数组 | 先收集数据到数组再遍历 | 数据量可控时 | 任意 |

---

## 3. 命令详解

### 3.1 trap：信号处理与脚本清理

`trap` 让你在脚本中捕获信号（Signal）并执行指定的处理函数。这是编写健壮脚本的核心机制——确保无论脚本如何终止，清理工作（删除临时文件、释放锁、记录日志）都能执行。

#### 3.1.1 trap 的基本语法

```
trap 'commands' SIGNAL...
trap 'commands' EXIT     # 捕获脚本退出（任何方式）
trap - SIGNAL            # 恢复默认信号处理
trap -p                  # 查看当前所有 trap 设置
```

**常用信号：**

| 信号 | 编号 | 触发条件 | 用途 |
|------|------|---------|------|
| `EXIT` | 0 | 脚本正常或异常退出 | 清理临时文件（最常用） |
| `INT` | 2 | Ctrl+C (SIGINT) | 打断时的清理 |
| `TERM` | 15 | `kill` 命令（默认） | 外部终止时的清理 |
| `ERR` | - | 任何命令返回非零退出码 | 错误处理（需 set -e 配合） |
| `DEBUG` | - | 每条命令执行前 | 详细调试追踪 |
| `RETURN` | - | 函数或 source 脚本返回时 | 函数级别的清理 |
| `HUP` | 1 | 终端关闭 | 守护进程重新加载配置 |

#### 3.1.2 基础示例：清理临时文件

```bash
cat > /tmp/trap-cleanup.sh << 'SCRIPT'
#!/bin/bash

# 创建临时文件
TMPFILE=$(mktemp /tmp/myscript_XXXXXX.tmp)
TMPDIR=$(mktemp -d /tmp/myscript_XXXXXX.d)

echo "脚本 PID: $$"
echo "临时文件: $TMPFILE"
echo "临时目录: $TMPDIR"

# trap 处理器：无论脚本如何退出都执行清理
cleanup() {
    local exit_code=$?
    echo ""
    echo "=== 清理中 ==="
    echo "删除临时文件: $TMPFILE"
    rm -f "$TMPFILE"
    echo "删除临时目录: $TMPDIR"
    rm -rf "$TMPDIR"
    echo "脚本退出码: $exit_code"
    echo "=== 清理完毕 ==="
    exit $exit_code
}

# 注册 trap：捕获 EXIT、INT、TERM 三个信号
trap cleanup EXIT INT TERM

echo ""
echo "=== 开始工作 ==="
echo "模拟数据" > "$TMPFILE"

# 显示临时文件内容
echo "写入的内容: $(cat $TMPFILE)"

echo "脚本即将正常退出..."
# 无需手动清理——trap 会在 EXIT 时自动调用 cleanup
SCRIPT

echo "=== 运行脚本 ==="
bash /tmp/trap-cleanup.sh
echo ""
echo "=== 验证临时文件已清理 ==="
ls /tmp/myscript_*.tmp 2>/dev/null || echo "(无临时文件残留)"
rm -f /tmp/trap-cleanup.sh
```

#### 3.1.3 Ctrl+C 中断处理

```bash
cat > /tmp/trap-interactive.sh << 'SCRIPT'
#!/bin/bash

# 禁止 Ctrl+C 中断关键操作
critical_section=false

handle_interrupt() {
    echo ""
    if $critical_section; then
        echo "[警告] 正在执行关键操作，请勿中断！操作完成后再试。"
        # 不退出，只是记录
    else
        echo ""
        echo "收到中断信号，正在退出..."
        exit 130  # 128 + 2 (SIGINT)
    fi
}

trap handle_interrupt INT

echo "=== 演示 trap INT（Ctrl+C 保护）==="
echo "这个脚本在关键操作期间保护你免受 Ctrl+C 影响"
echo ""

for i in {1..5}; do
    if (( i == 3 )); then
        critical_section=true
        echo "[第 $i 步] 关键操作进行中...（3秒内 Ctrl+C 无效）"
        sleep 3
        critical_section=false
        echo "[第 $i 步] 关键操作完成"
    else
        echo "[第 $i 步] 普通操作...（Ctrl+C 可中断）"
        sleep 2
    fi
done

echo "脚本正常完成！"
SCRIPT

echo "按 Ctrl+C 测试（2秒内可以试试不同步骤的反应）"
timeout 4 bash /tmp/trap-interactive.sh 2>&1 || true
rm -f /tmp/trap-interactive.sh
```

#### 3.1.4 trap ERR：自动错误捕获

```bash
cat > /tmp/trap-err.sh << 'SCRIPT'
#!/bin/bash

# 开启错误检测
set -e

# ERR trap：任何命令失败时（非零退出码）触发
handle_error() {
    local line=$1
    local exit_code=$2
    local command=$3
    
    echo "==========================================" >&2
    echo "  脚本错误！" >&2
    echo "==========================================" >&2
    echo "  行号:     $line" >&2
    echo "  退出码:   $exit_code" >&2
    echo "  命令:     $command" >&2
    echo "  时间:     $(date '+%Y-%m-%d %H:%M:%S')" >&2
    echo "==========================================" >&2
}

trap 'handle_error $LINENO $? "$BASH_COMMAND"' ERR

echo "=== trap ERR 演示 ==="
echo "这条命令会成功"
echo "成功: $?"

# 下一个命令故意失败
echo ""
echo "接下来会执行一条失败的命令..."
ls /nonexistent/directory 2>/dev/null
echo "（不会执行到这里，因为 set -e + ERR trap 已退出）"
SCRIPT

echo "=== 运行 ==="
bash /tmp/trap-err.sh 2>&1 || echo "脚本因错误退出"
rm -f /tmp/trap-err.sh
```

#### 3.1.5 trap DEBUG：逐条命令追踪

```bash
cat > /tmp/trap-debug.sh << 'SCRIPT'
#!/bin/bash

# DEBUG trap：每条命令执行前触发
trap 'echo "[DEBUG] 第 $LINENO 行: $BASH_COMMAND"' DEBUG

echo "Hello"
name="World"
echo "Hello, $name!"

# 关闭 DEBUG trap
trap - DEBUG
echo "（DEBUG trap 已关闭）"
echo "这行不会显示 DEBUG 信息"
SCRIPT

echo "=== trap DEBUG 演示 ==="
bash /tmp/trap-debug.sh
rm -f /tmp/trap-debug.sh
```

### 3.2 getopts：命令行选项解析

`getopts` 是 Bash 内置的 POSIX 标准选项解析器。它解决了手动解析命令行选项的繁琐和易错问题。

#### 3.2.1 getopts 基本语法

```
getopts optstring variable [args...]
    optstring: 选项定义字符串（如 "vf:n:h"）
    variable:  每次匹配到的选项字母存入这个变量
    OPTARG:    带参数选项的参数值
    OPTIND:    下一个待处理参数的索引

optstring 语法：
    单个字母: 无参数选项（如 "v" 对应 -v）
    字母+冒号: 需要参数（如 "f:" 对应 -f file）
    开头的冒号: 静默模式（不自动报错，自己处理）
```

#### 3.2.2 完整示例：一个带选项的脚本

```bash
cat > /tmp/getopts-demo.sh << 'SCRIPT'
#!/bin/bash

# ==========================================
# 使用 getopts 解析命令行选项
# 支持: -v (详细), -f file (文件), -n count (数量), -h (帮助)
# ==========================================

usage() {
    cat << EOF
用法: $(basename "$0") [选项]

选项:
  -v           详细输出模式 (Verbose)
  -f FILE      指定输入文件 (File)
  -n COUNT     指定处理数量 (Number, 默认 10)
  -h           显示此帮助信息

示例:
  $(basename "$0") -v -f data.txt -n 20
  $(basename "$0") -f config.ini
  $(basename "$0") -h
EOF
    exit 0
}

# 默认值
VERBOSE=false
FILE=""
COUNT=10

# getopts 循环
while getopts "vf:n:h" opt; do
    case "$opt" in
        v)
            VERBOSE=true
            ;;
        f)
            FILE="$OPTARG"
            ;;
        n)
            COUNT="$OPTARG"
            # 验证 COUNT 是正整数
            if [[ ! "$COUNT" =~ ^[0-9]+$ ]]; then
                echo "错误: -n 后必须是正整数，得到 '$COUNT'" >&2
                exit 1
            fi
            ;;
        h)
            usage
            ;;
        \?)
            echo "错误: 无效选项 -$OPTARG" >&2
            usage
            ;;
        :)
            echo "错误: 选项 -$OPTARG 需要一个参数" >&2
            usage
            ;;
    esac
done

# 移除已处理的选项，$1 现在指向第一个非选项参数
shift $((OPTIND - 1))

# --- 输出解析结果 ---
echo "=========================================="
echo "  选项解析结果"
echo "=========================================="
echo "详细模式 (VERBOSE): $VERBOSE"
echo "文件      (FILE):    ${FILE:-(未指定)}"
echo "数量      (COUNT):   $COUNT"
echo "剩余参数:            ${@:-(无)}"
echo "=========================================="

# 验证必填选项
if [[ -z "$FILE" ]]; then
    echo "错误: -f 选项是必填的" >&2
    usage
fi

# 检查文件是否存在
if [[ ! -f "$FILE" ]]; then
    echo "错误: 文件 '$FILE' 不存在" >&2
    exit 1
fi

# --- 模拟业务逻辑 ---
if $VERBOSE; then
    echo "[详细] 开始处理文件: $FILE"
    echo "[详细] 处理数量: $COUNT"
fi

echo "正在处理 $COUNT 条记录..."
for ((i=1; i<=COUNT; i++)); do
    $VERBOSE && echo "  [$i/$COUNT] 处理中..."
done
echo "处理完成！"
SCRIPT

chmod +x /tmp/getopts-demo.sh

echo "=== 测试1：正常使用 ==="
echo "test data" > /tmp/getopts-test.txt
/tmp/getopts-demo.sh -v -f /tmp/getopts-test.txt -n 3

echo ""
echo "=== 测试2：缺少必填选项 ==="
/tmp/getopts-demo.sh -v 2>&1 || true

echo ""
echo "=== 测试3：无效选项 ==="
/tmp/getopts-demo.sh -x 2>&1 || true

echo ""
echo "=== 测试4：帮助 ==="
/tmp/getopts-demo.sh -h

rm -f /tmp/getopts-demo.sh /tmp/getopts-test.txt
```

#### 3.2.3 getopts optstring 详解

```
optstring "vf:n:h" 的解析：

  v   → 无参数布尔选项。使用: -v
  f:  → 带参数的选项。使用: -f filename 或 -ffilename
  n:  → 带参数的选项。使用: -n 10 或 -n10
  h   → 无参数布尔选项。使用: -h

以冒号开头的 ":" 表示静默模式：
  ":vf:n:h" → getopts 不自动打印错误消息
  错误通过 ? (无效选项) 或 : (缺少参数) case 分支自行处理
```

#### 3.2.4 处理非选项参数（-- 约定）

```bash
cat > /tmp/getopts-with-args.sh << 'SCRIPT'
#!/bin/bash

# 演示：getopts 与位置参数混合使用
# mycmd -v -f file -- arg1 arg2 arg3

while getopts "vf:" opt; do
    case "$opt" in
        v) echo "详细模式";;
        f) echo "文件: $OPTARG";;
    esac
done
shift $((OPTIND - 1))

echo ""
echo "=== 选项之后的参数 ==="
echo "参数个数: $#"
for arg in "$@"; do
    echo "  - $arg"
done
SCRIPT

chmod +x /tmp/getopts-with-args.sh
echo "=== 选项和位置参数混合 ==="
/tmp/getopts-with-args.sh -v -f config.ini -- file1.txt file2.txt "my doc.txt"
rm -f /tmp/getopts-with-args.sh
```

### 3.3 调试：set 命令与追踪技术

调试是脚本工程师的必备技能。Bash 提供了一套强大的内置调试工具，不需要安装任何额外的软件。

#### 3.3.1 set -x：执行追踪（Trace）

`set -x` 让 Bash 在执行每条命令之前将其打印到 stderr，前面加上 `+` 符号。

```bash
cat > /tmp/debug-setx.sh << 'SCRIPT'
#!/bin/bash

echo "=== set -x 基础演示 ==="

# 开启追踪
set -x

name="Alice"
echo "Hello, $name!"

count=0
for i in {1..3}; do
    ((count += i))
done
echo "Sum = $count"

# 关闭追踪
set +x

echo ""
echo "=== 追踪已关闭 ==="
echo "这行不会显示 + 前缀"
SCRIPT

bash /tmp/debug-setx.sh
rm -f /tmp/debug-setx.sh
```

#### 3.3.2 PS4：自定义追踪前缀

`PS4` 是 `set -x` 输出的前缀变量，默认为 `+`。你可以自定义它来显示文件名、行号、函数名。

```bash
cat > /tmp/debug-ps4.sh << 'SCRIPT'
#!/bin/bash

# 默认 PS4
echo "=== 默认 PS4 ==="
set -x
echo "默认追踪格式"
set +x

# 自定义 PS4：显示脚本名和行号
echo ""
echo "=== 自定义 PS4：显示脚本名+行号 ==="
export PS4='+ ${BASH_SOURCE}:${LINENO}: '
set -x
name="Bob"
echo "Name: $name"
set +x

# 自定义 PS4：显示函数调用链
echo ""
echo "=== 自定义 PS4：显示函数调用链 ==="
export PS4='+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'

function level2 {
    set -x
    local result="deep value"
    echo "$result"
    set +x
}

function level1 {
    level2
}

level1

# 最强大的 PS4：完整调用栈
echo ""
echo "=== PS4：显示时间+文件+行号+函数 ==="
export PS4='+ [$(date "+%H:%M:%S")] ${BASH_SOURCE##*/}:${LINENO} ${FUNCNAME[0]:+${FUNCNAME[0]}()}=> '

function outer_func {
    set -x
    local val=42
    echo "Value: $val"
    set +x
}

outer_func
SCRIPT

bash /tmp/debug-ps4.sh
rm -f /tmp/debug-ps4.sh
```

#### 3.3.3 set -e：遇错即退

`set -e`（errexit）让脚本在任何命令返回非零退出码时立即退出。

```bash
cat > /tmp/debug-sete.sh << 'SCRIPT'
#!/bin/bash

echo "=== 没有 set -e ==="
function without_e {
    echo "步骤1: 成功"
    ls /nonexistent 2>/dev/null   # 失败但不退出
    echo "步骤2: 仍然执行（因为没有 set -e）"
}
without_e

echo ""
echo "=== 有 set -e ==="
function with_e {
    set -e
    echo "步骤1: 成功"
    ls /nonexistent 2>/dev/null   # 失败，set -e 会让脚本退出
    echo "步骤2: 永远不会执行到这里"
}
with_e || echo "脚本因 set -e 退出（上面的 ls 失败了）"

echo ""
echo "=== set -e 的例外（不会触发退出）==="
set -e
# 以下情况即使命令失败也不会触发 set -e 退出：
echo "--- while/until 条件 ---"
i=0
while (( i < 3 )); do
    ((i++))
    echo "  i=$i"
done
echo "（while 条件中的失败不会触发 set -e）"

echo "--- if 条件 ---"
if ls /nonexistent 2>/dev/null; then
    echo "不执行"
else
    echo "if 条件中的失败不会触发 set -e"
fi

echo "--- || 和 && ---"
false || echo "|| 左侧失败不会触发 set -e"
true && echo "&& 不会触发"
set +e
SCRIPT

bash /tmp/debug-sete.sh
rm -f /tmp/debug-sete.sh
```

#### 3.3.4 set -u：未定义变量报错

```bash
cat > /tmp/debug-setu.sh << 'SCRIPT'
#!/bin/bash

echo "=== set -u 演示 ==="

set -u

# 定义一些变量
NAME="Alice"

echo "已定义的变量: $NAME"

# 未定义的变量会导致错误
# echo "$UNDEFINED"       # 这行会报错退出

# 安全地检查可能未定义的变量
echo "安全默认值: ${UNDEFINED:-默认值}"
echo "条件检查: ${UNDEFINED:+已设置}"

# 使用 -v 测试避免 set -u 报错
if [[ -v UNDEFINED ]]; then
    echo "UNDEFINED 已定义"
else
    echo "UNDEFINED 未定义（-v 测试很安全）"
fi

set +u
echo "set -u 已关闭"
SCRIPT

bash /tmp/debug-setu.sh
rm -f /tmp/debug-setu.sh
```

#### 3.3.5 set -o pipefail：管道错误检测

```bash
cat > /tmp/debug-pipefail.sh << 'SCRIPT'
#!/bin/bash

echo "=== 没有 pipefail ==="
# 默认：管道整体状态 = 最后一个命令的状态
false | true
echo "退出码: $?  (false | true => true 成功，false 的失败被忽略)"

echo ""
echo "=== 有 pipefail ==="
set -o pipefail
false | true
echo "退出码: $?  (false | true => false 失败，pipefail 检测到了)"

echo ""
echo "=== pipefail 实战 ==="
# 场景：检查 grep 是否真的找到了匹配项
echo "--- 没有 pipefail（危险）---"
set +o pipefail
# 模拟：cat 失败但 grep 成功
cat /nonexistent 2>/dev/null | grep -c "data"
echo "退出码: $?  (看似成功，但 cat 失败了！)"

echo ""
echo "--- 有 pipefail（安全）---"
set -o pipefail
cat /nonexistent 2>/dev/null | grep -c "data"
echo "退出码: $?  (正确反映管道中有命令失败)"

set +o pipefail
SCRIPT

bash /tmp/debug-pipefail.sh
rm -f /tmp/debug-pipefail.sh
```

#### 3.3.6 综合调试变量：BASH_SOURCE、BASH_LINENO、FUNCNAME

```bash
cat > /tmp/debug-vars.sh << 'SCRIPT'
#!/bin/bash

# 这三个数组变量是高级错误定位的核心：
# BASH_SOURCE[i] - 调用栈第 i 层的源文件
# BASH_LINENO[i] - 调用栈第 i 层的行号
# FUNCNAME[i]    - 调用栈第 i 层的函数名

function print_stack {
    echo "=========================================="
    echo "  调用栈 (Call Stack)"
    echo "=========================================="
    echo ""
    printf "%-5s %-25s %-30s %s\n" "深度" "函数名" "文件" "行号"
    printf "%-5s %-25s %-30s %s\n" "----" "-------------------------" "------------------------------" "----"
    
    local frame=0
    # FUNCNAME[0] = 当前函数本身
    # FUNCNAME[1] = 调用者
    # FUNCNAME[${#FUNCNAME[@]}-1] = main
    while caller $frame > /dev/null 2>&1; do
        local line_no func_name file_name
        read -r line_no func_name file_name <<< "$(caller $frame)"
        printf "%-5s %-25s %-30s %s\n" "$frame" "${func_name:-main}" "${file_name##*/}" "$line_no"
        ((frame++))
    done
    
    # 也显示 main（脚本顶层）
    printf "%-5s %-25s %-30s %s\n" "$frame" "main" "${BASH_SOURCE[0]##*/}" "${BASH_LINENO[0]:-0}"
    
    echo ""
}

# 使用 BASH_SOURCE、BASH_LINENO、FUNCNAME 数组
function show_direct_arrays {
    echo "=== BASH_SOURCE / BASH_LINENO / FUNCNAME 数组 ==="
    for ((i=0; i<${#FUNCNAME[@]}; i++)); do
        echo "  FUNCNAME[$i]=${FUNCNAME[$i]}"
        echo "  BASH_SOURCE[$i]=${BASH_SOURCE[$i]}"
        echo "  BASH_LINENO[$i]=${BASH_LINENO[$i]}"
        echo "  ---"
    done
}

function level3 {
    echo "=== 在 level3 中打印调用栈 ==="
    print_stack
    echo ""
    show_direct_arrays
}

function level2 {
    level3
}

function level1 {
    level2
}

level1
SCRIPT

bash /tmp/debug-vars.sh
rm -f /tmp/debug-vars.sh
```

#### 3.3.7 调试工具的开启与关闭组合

```bash
# 推荐的防御性脚本开头
set -euo pipefail     # 严格模式：三个一起用
# -e: 命令失败则退出
# -u: 未定义变量报错
# -o pipefail: 管道中任何命令失败则整体失败

# 仅在调试时开启（可以放在脚本中条件控制）
if [[ "${DEBUG:-}" == "true" ]]; then
    set -x
    export PS4='+ ${BASH_SOURCE##*/}:${LINENO} ${FUNCNAME[0]:+${FUNCNAME[0]}()}=> '
fi

# 使用方法：DEBUG=true ./script.sh
```

### 3.4 Heredoc：脚本中的多行文本模板

Heredoc（Here Document）让你在脚本中内嵌多行文本，是生成配置文件、帮助信息、SQL 语句、HTML 模板的强大工具。

#### 3.4.1 基本语法

```
command << DELIMITER
多行文本内容
可以包含变量和命令替换
DELIMITER

# 注意：
# - DELIMITER 可以是任意字符串（常用 EOF、END、HELP）
# - 结束的 DELIMITER 必须单独占一行，前面不能有空格（除非使用 <<-）
# - 如果 DELIMITER 被引号包裹（'EOF'），则禁止变量展开
```

#### 3.4.2 基础示例与引号定界符

```bash
cat > /tmp/heredoc-basic.sh << 'SCRIPT'
#!/bin/bash

# --- 示例1：基本 Heredoc ---
echo "=== 基本 Heredoc（有变量展开）==="
NAME="Alice"
DATE=$(date '+%Y-%m-%d')

cat << EOF
你好, $NAME!
今天的日期是: $DATE
当前用户: $USER
家目录: $HOME
EOF

echo ""

# --- 示例2：引号定界符禁止展开 ---
echo "=== 带引号的 Heredoc（禁止变量展开）==="

cat << 'EOF'
你好, $NAME!
今天的日期是: $DATE
当前用户: $USER
所有变量都保持原样，不会展开。
EOF

echo ""

# --- 示例3：<<- 去除缩进 ---
echo "=== <<- 去除 Tab 缩进 ==="
if true; then
    # <<- 会去除每行开头的 Tab 字符
    # 注意：必须是 Tab，空格不行！
    cat <<- END
	这行有 Tab 缩进，但在输出中会被去除。
	这行也是。
	${NAME} 的变量仍然会展开。
	END
fi

echo ""

# --- 示例4：输出重定向到文件 ---
cat > /tmp/heredoc-output.txt << 'CONFIG'
# 这是通过 Heredoc 生成的配置文件
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
}
CONFIG
echo "生成了配置文件:"
cat /tmp/heredoc-output.txt
rm -f /tmp/heredoc-output.txt
SCRIPT

bash /tmp/heredoc-basic.sh
rm -f /tmp/heredoc-basic.sh
```

#### 3.4.3 Heredoc 实战：脚本帮助信息

```bash
cat > /tmp/heredoc-help.sh << 'SCRIPT'
#!/bin/bash

show_help() {
    cat << 'HELP'
============================================
  系统工具 v1.0 - 使用帮助
============================================

用法:
  ./tool.sh [选项] <参数>

选项:
  -h, --help       显示此帮助
  -v, --verbose    详细输出
  -f, --file FILE  指定输入文件
  -o, --output DIR 指定输出目录

示例:
  ./tool.sh -v -f data.txt -o ./output
  ./tool.sh --help

配置文件格式:
  [section]
  key = value
  # 支持注释行

============================================
HELP
}

show_help
SCRIPT

bash /tmp/heredoc-help.sh
rm -f /tmp/heredoc-help.sh
```

#### 3.4.4 Heredoc 与管道结合

```bash
cat > /tmp/heredoc-pipe.sh << 'SCRIPT'
#!/bin/bash

# Heredoc 可以直接通过管道传递给命令

# 示例1：传递给 grep
echo "=== Heredoc + grep ==="
grep -i "error" << 'LOGDATA'
2026-07-30 10:00:01 INFO  Server started
2026-07-30 10:00:05 ERROR Database connection failed
2026-07-30 10:01:00 WARN  Memory usage high
2026-07-30 10:01:30 ERROR File not found
LOGDATA

echo ""

# 示例2：传递给 while 循环
echo "=== Heredoc + while ==="
while IFS= read -r line; do
    echo "  处理: [$line]"
done << 'ITEMS'
苹果
香蕉
橙子
ITEMS

echo ""

# 示例3：多行 SQL 传递（概念演示）
echo "=== Heredoc + SQL（概念）==="
cat << 'SQL'
SELECT username, email, created_at
FROM users
WHERE status = 'active'
  AND created_at > '2026-01-01'
ORDER BY created_at DESC
LIMIT 10;
SQL
SCRIPT

bash /tmp/heredoc-pipe.sh
rm -f /tmp/heredoc-pipe.sh
```

### 3.5 脚本性能优化技巧

Bash 不是以性能著称的语言，但以下几个技巧可以显著减少脚本的执行时间。

#### 3.5.1 减少外部命令调用

```bash
cat > /tmp/perf-external-cmd.sh << 'SCRIPT'
#!/bin/bash

echo "=== 外部命令 vs 内置操作 ==="
echo ""

# 慢：每次循环都调用外部 tr 命令
echo "--- 外部命令版本（慢）---"
time for i in {1..1000}; do
    result=$(echo "HELLO WORLD" | tr '[:upper:]' '[:lower:]')
done 2>&1 | grep real

echo ""

# 快：使用 Bash 内置参数展开
echo "--- 内置展开版本（快）---"
text="HELLO WORLD"
time for i in {1..1000}; do
    result="${text,,}"
done 2>&1 | grep real

echo ""
echo "规则：能用 Shell 内置操作的地方绝不用外部命令"
echo "  - 字符串操作: \${var,,} 替代 tr, \${var// /} 替代 sed"
echo "  - 算术运算:   \$(( )) 替代 expr 或 bc"
echo "  - 文件测试:   [[ -f ]] 替代 ls | grep"
echo "  - 行计数:     while read 在特定场景替代 awk"
SCRIPT

bash /tmp/perf-external-cmd.sh
rm -f /tmp/perf-external-cmd.sh
```

#### 3.5.2 减少子 Shell 创建

```bash
cat > /tmp/perf-subshell.sh << 'SCRIPT'
#!/bin/bash

echo "=== 子 Shell 创建开销 ==="

# 慢：每次循环创建子 Shell
echo "--- 循环内创建子 Shell（慢）---"
time for i in {1..1000}; do
    result=$(echo "$i")      # $() 创建子 Shell
done 2>&1 | grep real

echo ""

# 快：批量操作
echo "--- 批量操作（快）---"
time {
    output=""
    for i in {1..1000}; do
        output+="$i "
    done
} 2>&1 | grep real

echo ""
echo "规则："
echo "  - 避免在循环内使用 \$() 命令替换"
echo "  - 避免在循环内使用管道"
echo "  - 批量收集输出，一次性处理"
SCRIPT

bash /tmp/perf-subshell.sh
rm -f /tmp/perf-subshell.sh
```

#### 3.5.3 文件读取优化

```bash
cat > /tmp/perf-file-read.sh << 'SCRIPT'
#!/bin/bash

# 创建大文件
seq 1 10000 > /tmp/perf-test-large.txt

echo "=== 文件读取性能对比 ==="

# 慢：for + cat（一次性加载+单词分割）
echo "--- for + cat（慢）---"
time for word in $(cat /tmp/perf-test-large.txt); do
    :   # 空操作
done 2>&1 | grep real

echo ""

# 快：while read（逐行读取）
echo "--- while read（快）---"
time while IFS= read -r line; do
    :
done < /tmp/perf-test-large.txt 2>&1 | grep real

echo ""
echo "规则：读取文件使用 while IFS= read -r，不要用 for + cat"

rm -f /tmp/perf-test-large.txt
SCRIPT

bash /tmp/perf-file-read.sh
rm -f /tmp/perf-file-read.sh
```

#### 3.5.4 性能优化清单

```
+------------------------------------------------------------------+
|                    脚本性能优化清单                                    |
|                                                                    |
|  1. 用 Shell 内置操作替代外部命令                                      |
|     tr     → ${var,,} / ${var^^}                                  |
|     sed    → ${var/pattern/replace}                                |
|     expr   → $(( ))                                               |
|     basename → ${path##*/}                                         |
|     dirname  → ${path%/*}                                          |
|     wc -c   → ${#var}                                             |
|                                                                    |
|  2. 避免在循环中创建子 Shell                                          |
|     - 循环中不用 $() 命令替换                                        |
|     - 循环中不用管道                                                 |
|     - 批量收集输出，一次性处理                                        |
|                                                                    |
|  3. 正确的文件读取方式                                               |
|     - 大文件: while IFS= read -r                                    |
|     - 避免: for line in $(cat file)                                |
|                                                                    |
|  4. 减少 fork/exec 次数                                             |
|     - 合并多个命令为一个调用                                          |
|     - 使用 find -exec + 代替 \;                                     |
|     - 使用 xargs 批量处理                                           |
|                                                                    |
|  5. 数组优于临时文件                                                  |
|     - 内存允许时用数组存储中间结果                                     |
|     - 避免频繁读写磁盘                                                |
+------------------------------------------------------------------+
```

---

## 4. 实战练习

### 练习 25.1：函数定义与作用域验证

**题目：**

编写脚本 `~/bash-lesson25/ex1-scope.sh`：
（1）定义一个全局变量 `MSG="全局消息"`
（2）定义函数 `test_scope`，在函数内部：
    - 使用 `local MSG="局部消息"`
    - 使用 `local` 声明一个新变量 `INSIDE="内部变量"`
    - 不使用 `local` 声明 `LEAKED="泄漏变量"`
    - 输出所有三个变量
（3）调用函数前后分别输出 MSG、INSIDE、LEAKED 的值
（4）输出解释：哪些变量在函数外可见，哪些不可见，为什么

**答案：**

```bash
cat > ~/bash-lesson25/ex1-scope.sh << 'SCRIPT'
#!/bin/bash

# 全局变量
MSG="全局消息"

echo "=========================================="
echo "  练习 25.1：函数作用域验证"
echo "=========================================="

function test_scope {
    local MSG="局部消息"           # local：遮蔽全局同名变量
    local INSIDE="内部变量"        # local：仅函数内可见
    LEAKED="泄漏变量"              # 无 local：修改/创建全局变量
    
    echo "--- 函数内部 ---"
    echo "MSG     = $MSG      (local，遮蔽了全局)"
    echo "INSIDE  = $INSIDE   (local，仅函数内可见)"
    echo "LEAKED  = $LEAKED   (无local，创建了全局变量)"
    echo ""
}

echo "--- 调用函数前 ---"
echo "MSG     = $MSG"
echo "INSIDE  = ${INSIDE:-未定义}"
echo "LEAKED  = ${LEAKED:-未定义}"
echo ""

test_scope

echo "--- 调用函数后 ---"
echo "MSG     = $MSG       (全局值未被修改！)"
echo "INSIDE  = ${INSIDE:-未定义}   (函数退出后不可访问)"
echo "LEAKED  = $LEAKED    (泄漏到全局了！)"
echo ""

echo "结论:"
echo "  - local 变量：函数内可见，退出后销毁，不影响全局同名变量"
echo "  - 无 local 变量：直接操作全局作用域，函数退出后依然存在"
echo "  - 始终在函数内用 local 声明变量，避免意外修改全局状态"
SCRIPT

chmod +x ~/bash-lesson25/ex1-scope.sh
~/bash-lesson25/ex1-scope.sh
```

### 练习 25.2：返回值 vs 输出值

**题目：**

编写脚本 `~/bash-lesson25/ex2-return-vs-output.sh`：
（1）定义函数 `divide`，接收两个参数（被除数、除数）
（2）如果除数为 0，通过 `return 1` 表示错误，同时向 stderr 输出错误信息
（3）如果计算成功，通过 stdout（`echo`）输出结果，通过 `return 0` 表示成功
（4）在调用端同时检查退出码（`$?`）和捕获 stdout 输出
（5）分别测试正常除法和除零两种情况

**答案：**

```bash
cat > ~/bash-lesson25/ex2-return-vs-output.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  练习 25.2：返回值 vs 输出值"
echo "=========================================="

function divide {
    local dividend="$1"
    local divisor="$2"
    
    # 除零检查
    if (( divisor == 0 )); then
        echo "错误: 除数不能为 0" >&2       # stderr 输出错误信息
        return 1                             # return 表示失败
    fi
    
    # 使用 bc 进行浮点除法
    local result
    result=$(bc -l <<< "scale=4; $dividend / $divisor")
    echo "$result"                            # stdout 输出计算结果
    return 0                                  # return 表示成功
}

# --- 测试1：正常除法 ---
echo ""
echo "--- 测试1: 10 / 3 ---"
quotient=$(divide 10 3)
status=$?
if (( status == 0 )); then
    echo "成功！结果: $quotient"
else
    echo "失败！"
fi
echo "退出码: $status (0=成功)"

# --- 测试2：除零 ---
echo ""
echo "--- 测试2: 5 / 0 ---"
quotient=$(divide 5 0 2>&1)    # 2>&1 也捕获 stderr
status=$?
if (( status == 0 )); then
    echo "成功！结果: $quotient"
else
    echo "失败！错误信息: $quotient"
fi
echo "退出码: $status (非0=失败)"

# --- 测试3：在条件中直接使用 ---
echo ""
echo "--- 测试3: 条件中使用 ---"
if divide 22 7 > /dev/null; then
    echo "22/7 计算成功（丢弃输出，只检查状态）"
fi

if ! divide 10 0 > /dev/null 2>&1; then
    echo "10/0 计算失败（正确！）"
fi
SCRIPT

chmod +x ~/bash-lesson25/ex2-return-vs-output.sh
~/bash-lesson25/ex2-return-vs-output.sh
```

### 练习 25.3：trap 信号清理脚本

**题目：**

编写脚本 `~/bash-lesson25/ex3-trap-cleanup.sh`：
（1）创建三个临时文件（使用 `mktemp`）
（2）使用 `trap` 注册 `EXIT`、`INT`、`TERM` 信号处理器
（3）信号处理器输出清理信息并删除所有临时文件
（4）在主逻辑中，模拟一个耗时操作（sleep），让用户有机会按 Ctrl+C
（5）在 cleanup 函数中保存并恢复退出码
（6）验证临时文件确实被清理

**答案：**

```bash
cat > ~/bash-lesson25/ex3-trap-cleanup.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  练习 25.3：trap 信号清理"
echo "=========================================="

# 创建临时文件
TMPFILES=()
TMPFILES+=("$(mktemp /tmp/ex3_data_XXXXXX.tmp)")
TMPFILES+=("$(mktemp /tmp/ex3_log_XXXXXX.tmp)")
TMPFILES+=("$(mktemp /tmp/ex3_config_XXXXXX.tmp)")

echo "脚本 PID: $$"
echo "临时文件:"
for f in "${TMPFILES[@]}"; do
    echo "  $f"
done

# 清理函数
cleanup() {
    local exit_code=$?
    
    echo ""
    echo "=========================================="
    echo "  清理程序 (trap 触发)"
    echo "=========================================="
    echo "原始退出码: $exit_code"
    echo "信号: ${1:-正常退出}"
    echo ""
    
    # 删除所有临时文件
    local cleaned=0 failed=0
    for f in "${TMPFILES[@]}"; do
        if rm -f "$f" 2>/dev/null; then
            echo "  已删除: $(basename "$f")"
            ((cleaned++))
        else
            echo "  删除失败: $(basename "$f")"
            ((failed++))
        fi
    done
    
    echo ""
    echo "清理结果: $cleaned 成功, $failed 失败"
    echo "=========================================="
    
    exit $exit_code
}

# 为不同的信号设置不同的提示
trap 'cleanup "正常退出 (EXIT)"' EXIT
trap 'cleanup "Ctrl+C 中断 (SIGINT)"' INT
trap 'cleanup "被 kill 终止 (SIGTERM)"' TERM

# 向临时文件写入数据
echo "模拟数据 $(date)" > "${TMPFILES[0]}"
echo "[$(date)] 脚本启动" >> "${TMPFILES[1]}"
echo "CONFIG_ENABLED=true" > "${TMPFILES[2]}"

# 显示文件确实存在
echo ""
echo "临时文件内容验证:"
for f in "${TMPFILES[@]}"; do
    echo "  $(basename "$f"): $(cat "$f")"
done

echo ""
echo "提示: 你有 3 秒时间按 Ctrl+C 测试中断清理"
echo "如果在 3 秒内按下 Ctrl+C，将看到 INT 信号清理"
echo "否则脚本正常退出，将看到 EXIT 信号清理"
echo ""

# 模拟耗时操作
for i in 3 2 1; do
    echo "  $i 秒后退出..."
    sleep 1
done

echo ""
echo "时间到，脚本正常退出"
SCRIPT

chmod +x ~/bash-lesson25/ex3-trap-cleanup.sh
~/bash-lesson25/ex3-trap-cleanup.sh

echo ""
echo "=== 验证：临时文件应已被清理 ==="
ls /tmp/ex3_*.tmp 2>/dev/null || echo "(无临时文件残留——清理成功！)"
```

### 练习 25.4：getopts 文件处理工具

**题目：**

编写脚本 `~/bash-lesson25/ex4-getopts-tool.sh`，实现一个文件处理命令行工具：
（1）使用 `getopts` 解析选项：`-i INPUT`（输入文件，必填）、`-o OUTPUT`（输出文件，可选，默认 stdout）、`-v`（详细模式）、`-t TYPE`（处理类型：upper/lower/reverse，默认 upper）、`-h`（帮助）
（2）根据 `-t` 的值执行不同处理：
    - upper：将文件内容转为大写输出
    - lower：将文件内容转为小写输出
    - reverse：将文件内容按行反转输出
（3）如果 `-o` 指定了输出文件，写入该文件；否则输出到 stdout
（4）详细模式下输出处理信息

**答案：**

```bash
cat > ~/bash-lesson25/ex4-getopts-tool.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

usage() {
    cat << 'HELP'
用法: ex4-getopts-tool.sh [选项]

选项:
  -i FILE     输入文件（必填）
  -o FILE     输出文件（可选，默认 stdout）
  -t TYPE     处理类型: upper, lower, reverse（默认 upper）
  -v          详细模式
  -h          显示帮助

示例:
  ex4-getopts-tool.sh -i data.txt -t upper -o result.txt
  ex4-getopts-tool.sh -i data.txt -t lower
  ex4-getopts-tool.sh -i data.txt -v -t reverse
HELP
    exit 0
}

# 默认值
INPUT=""
OUTPUT=""
TYPE="upper"
VERBOSE=false

# getopts 解析
while getopts "i:o:t:vh" opt; do
    case "$opt" in
        i) INPUT="$OPTARG" ;;
        o) OUTPUT="$OPTARG" ;;
        t) TYPE="$OPTARG" ;;
        v) VERBOSE=true ;;
        h) usage ;;
        \?) echo "无效选项: -$OPTARG" >&2; usage ;;
        :)  echo "选项 -$OPTARG 需要参数" >&2; usage ;;
    esac
done
shift $((OPTIND - 1))

# 验证必填选项
if [[ -z "$INPUT" ]]; then
    echo "错误: -i 输入文件是必填的" >&2
    usage
fi
if [[ ! -f "$INPUT" ]]; then
    echo "错误: 文件 '$INPUT' 不存在" >&2
    exit 1
fi

# 验证处理类型
case "$TYPE" in
    upper|lower|reverse) ;;
    *) echo "错误: 无效的处理类型 '$TYPE' (支持: upper, lower, reverse)" >&2; exit 1 ;;
esac

# 处理函数
process_upper() {
    while IFS= read -r line; do
        echo "${line^^}"
    done < "$INPUT"
}

process_lower() {
    while IFS= read -r line; do
        echo "${line,,}"
    done < "$INPUT"
}

process_reverse() {
    # 读取所有行到数组，反向遍历
    mapfile -t lines < "$INPUT"
    for ((i=${#lines[@]}-1; i>=0; i--)); do
        echo "${lines[$i]}"
    done
}

# 执行处理
if $VERBOSE; then
    echo "==========================================" >&2
    echo "  文件处理工具" >&2
    echo "==========================================" >&2
    echo "输入文件: $INPUT" >&2
    echo "输出文件: ${OUTPUT:-stdout}" >&2
    echo "处理类型: $TYPE" >&2
    echo "行数:     $(wc -l < "$INPUT")" >&2
    echo "==========================================" >&2
    echo "" >&2
fi

if [[ -n "$OUTPUT" ]]; then
    # 有输出文件
    case "$TYPE" in
        upper)   process_upper > "$OUTPUT" ;;
        lower)   process_lower > "$OUTPUT" ;;
        reverse) process_reverse > "$OUTPUT" ;;
    esac
    echo "结果已写入: $OUTPUT"
    $VERBOSE && echo "输出大小: $(wc -c < "$OUTPUT") 字节"
else
    # 输出到 stdout
    case "$TYPE" in
        upper)   process_upper ;;
        lower)   process_lower ;;
        reverse) process_reverse ;;
    esac
fi
SCRIPT

chmod +x ~/bash-lesson25/ex4-getopts-tool.sh

# 创建测试文件
cat > /tmp/ex4-test.txt << 'EOF'
Hello World
Ubuntu Linux
Bash Scripting
The Quick Brown Fox
EOF

echo "=== 测试1: upper + stdout ==="
~/bash-lesson25/ex4-getopts-tool.sh -i /tmp/ex4-test.txt -t upper

echo ""
echo "=== 测试2: lower + 输出文件 ==="
~/bash-lesson25/ex4-getopts-tool.sh -i /tmp/ex4-test.txt -t lower -o /tmp/ex4-output.txt
cat /tmp/ex4-output.txt

echo ""
echo "=== 测试3: reverse + 详细模式 ==="
~/bash-lesson25/ex4-getopts-tool.sh -i /tmp/ex4-test.txt -t reverse -v 2>&1

echo ""
echo "=== 测试4: 帮助 ==="
~/bash-lesson25/ex4-getopts-tool.sh -h

rm -f /tmp/ex4-test.txt /tmp/ex4-output.txt
```

### 练习 25.5：调试追踪实战

**题目：**

编写一个存在潜在 bug 的脚本 `~/bash-lesson25/ex5-debugging.sh`：
（1）使用 `set -euo pipefail` 严格模式
（2）自定义 `PS4` 显示文件名、行号、函数名
（3）在 DEBUG 模式下（环境变量 `DEBUG=true`）自动开启 `set -x`
（4）包含一个嵌套函数调用链（至少 3 层）
（5）在关键位置使用 `echo "DEBUG: ..."` 输出中间变量
（6）故意设置一个条件分支，其中一个路径有除零的可能
（7）使用 `trap ERR` 在出错时打印调用栈

**答案：**

```bash
cat > ~/bash-lesson25/ex5-debugging.sh << 'SCRIPT'
#!/bin/bash

# 严格模式
set -euo pipefail

# 调试模式控制
if [[ "${DEBUG:-}" == "true" ]]; then
    export PS4='+ [${BASH_SOURCE##*/}:${LINENO}] ${FUNCNAME[0]:+${FUNCNAME[0]}():} '
    set -x
    echo "[DEBUG] 调试模式已开启"
fi

# 错误处理：打印调用栈
error_handler() {
    local exit_code=$?
    local line_no=$1
    
    echo "==========================================" >&2
    echo "  错误！退出码: $exit_code, 行号: $line_no" >&2
    echo "==========================================" >&2
    
    echo "调用栈:" >&2
    local frame=0
    while caller $frame > /dev/null 2>&1; do
        local ln func file
        read -r ln func file <<< "$(caller $frame)"
        echo "  #$frame $func() at $file:$ln" >&2
        ((frame++))
    done
    echo "==========================================" >&2
    
    exit $exit_code
}
trap 'error_handler $LINENO' ERR

# 工具函数
function validate_number {
    local num="$1"
    # 故意不处理负数和非数字（引入潜在 bug）
    if [[ ! "$num" =~ ^[0-9]+$ ]]; then
        echo "错误: '$num' 不是有效的数字" >&2
        return 1
    fi
    return 0
}

function compute_ratio {
    local a="$1"
    local b="$2"
    
    echo "[compute_ratio] a=$a, b=$b"
    
    # 如果 b 是 0，除零会导致错误
    local ratio=$(( a / b ))
    echo "$ratio"
}

function process_data {
    local x="$1"
    local y="$2"
    
    echo "[process_data] 输入: x=$x, y=$y"
    
    validate_number "$x" || return 1
    validate_number "$y" || return 1
    
    # 调用下一层
    local result
    result=$(compute_ratio "$x" "$y")
    
    echo "[process_data] 结果: $result"
    echo "$result"
}

function main_app {
    echo "=========================================="
    echo "  数据处理程序"
    echo "=========================================="
    
    local a="${1:-10}"
    local b="${2:-2}"
    
    echo ""
    echo "--- 处理 a=$a, b=$b ---"
    process_data "$a" "$b"
    
    if (( $? == 0 )); then
        echo "处理成功"
    else
        echo "处理失败"
    fi
}

# 在子 Shell 中测试以避免整个脚本退出
echo "=== 测试1：正常数据 ==="
main_app 100 5 || echo "（测试1 退出）"

echo ""
echo "=== 测试2：除零（会触发错误处理）==="
main_app 100 0 || echo "（测试2 退出，错误被正确捕获）"

echo ""
echo "=== 测试3：无效数据 ==="
main_app 50 abc || echo "（测试3 退出）"

echo ""
echo "提示: 使用 DEBUG=true 运行脚本可以看到详细执行追踪"
echo "  DEBUG=true bash ex5-debugging.sh"
SCRIPT

chmod +x ~/bash-lesson25/ex5-debugging.sh
~/bash-lesson25/ex5-debugging.sh

echo ""
echo "=========================================="
echo "  使用 DEBUG 模式运行（部分输出）"
echo "=========================================="
DEBUG=true ~/bash-lesson25/ex5-debugging.sh 2>&1 | head -40
```

### 练习 25.6：Heredoc 模板引擎

**题目：**

编写脚本 `~/bash-lesson25/ex6-heredoc-template.sh`：
（1）定义一个函数 `generate_html`，接收标题和内容作为参数
（2）使用 Heredoc 生成一个完整的 HTML 页面模板
（3）模板中正确使用变量展开（标题、内容、日期）
（4）同时也使用 `'EOF'` 定界符生成一个 CSS 代码块（其中的 `$` 和 `{}` 不被展开）
（5）使用 `<<-` 缩进 Heredoc
（6）将生成的 HTML 写入文件

**答案：**

```bash
cat > ~/bash-lesson25/ex6-heredoc-template.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  练习 25.6：Heredoc 模板引擎"
echo "=========================================="

function generate_html {
    local title="$1"
    local content="$2"
    local output_file="${3:-/tmp/page.html}"
    local date_str
    date_str=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "生成 HTML 页面..."
    echo "  标题: $title"
    echo "  输出: $output_file"
    
    # Heredoc 生成 HTML（变量会展开）
    cat > "$output_file" <<- HTMLEND
	<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
	    <meta charset="UTF-8">
	    <meta name="generator" content="Bash Heredoc Template">
	    <title>${title}</title>
	    <style>
	HTMLEND
    
    # 嵌套 Heredoc：CSS 部分禁止展开（'EOF' 定界符）
    cat >> "$output_file" << 'CSSEND'
	        /* CSS Reset */
	        * { margin: 0; padding: 0; box-sizing: border-box; }
	        body {
	            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	            line-height: 1.6;
	            color: #333;
	            max-width: 800px;
	            margin: 0 auto;
	            padding: 20px;
	            background-color: #f5f5f5;
	        }
	        header {
	            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	            color: white;
	            padding: 30px;
	            border-radius: 10px;
	            margin-bottom: 20px;
	            text-align: center;
	        }
	        .content {
	            background: white;
	            padding: 30px;
	            border-radius: 10px;
	            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	        }
	        footer {
	            text-align: center;
	            margin-top: 20px;
	            color: #999;
	            font-size: 0.9em;
	        }
	        /* CSS 中的 ${} 和 $ 不会展开 */
	        /* 因为使用了 'CSSEND' 定界符 */
	CSSEND
    
    # 继续 HTML 主模板（变量会展开）
    cat >> "$output_file" <<- HTMLEND
	    </style>
	</head>
	<body>
	    <header>
	        <h1>${title}</h1>
	    </header>
	    <div class="content">
	        ${content}
	    </div>
	    <footer>
	        <p>由 Bash Heredoc 模板引擎生成 | ${date_str}</p>
	        <p>当前用户: ${USER} | 主机: $(hostname)</p>
	    </footer>
	</body>
	</html>
	HTMLEND
    
    echo "  完成！文件: $output_file"
    echo "  大小: $(wc -c < "$output_file") 字节"
}

# 测试
TITLE="Bash Heredoc 模板引擎演示"
CONTENT=$(cat << 'INNEREOF'
<h2>欢迎</h2>
<p>这个 HTML 页面完全由 Bash 脚本通过 Heredoc 生成。</p>

<h3>Heredoc 的优势</h3>
<ul>
    <li><strong>变量展开</strong>：使用不带引号的定界符（如 EOF），变量和命令会被展开</li>
    <li><strong>字面保留</strong>：使用带引号的定界符（如 'EOF'），所有内容保持原样</li>
    <li><strong>缩进友好</strong>：使用 &lt;&lt;- 可以去除行首的 Tab 缩进</li>
    <li><strong>可嵌套</strong>：多个 Heredoc 可以组合在同一个脚本中</li>
</ul>

<h3>代码示例</h3>
<pre><code>#!/bin/bash
function hello() {
    local name="$1"
    echo "Hello, $name!"
}
hello "World"
</code></pre>
INNEREOF
)

generate_html "$TITLE" "$CONTENT" /tmp/heredoc-page.html

echo ""
echo "=== 生成的 HTML 文件内容（前 30 行）==="
head -30 /tmp/heredoc-page.html

echo ""
echo "=== 验证 CSS 中的 $ 没有被展开 ==="
grep -n '\\$' /tmp/heredoc-page.html || echo "(无未展开的 $ 变量)"

rm -f /tmp/heredoc-page.html
SCRIPT

chmod +x ~/bash-lesson25/ex6-heredoc-template.sh
~/bash-lesson25/ex6-heredoc-template.sh
```

### 练习 25.7：子 Shell 管道问题解决

**题目：**

编写脚本 `~/bash-lesson25/ex7-pipe-solution.sh`：
（1）使用管道 while 循环处理数据（产生子 Shell 问题）
（2）分别用三种方案解决：
    - 方案 A：进程替换 `< <()`
    - 方案 B：Here String `<<< "$()"`
    - 方案 C：`shopt -s lastpipe`
（3）每种方案验证变量在循环外是否保留了正确的值
（4）添加一个实际场景：从 `/etc/passwd` 读取 UID >= 1000 的用户并统计数量

**答案：**

```bash
cat > ~/bash-lesson25/ex7-pipe-solution.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  练习 25.7：子 Shell 管道问题解决方案"
echo "=========================================="

# --- 问题复现 ---
echo ""
echo "--- 问题：管道 while 变量丢失 ---"
count=0
sum=0
seq 1 10 | while read num; do
    ((count++))
    ((sum += num))
done
echo "count=$count (期望 10, 实际 0)"
echo "sum=$sum     (期望 55, 实际 0)"
echo "原因: while 在管道右侧的子 Shell 中运行"

# --- 方案A：进程替换 ---
echo ""
echo "--- 方案A：进程替换 < <() ---"
count=0
sum=0
while read num; do
    ((count++))
    ((sum += num))
done < <(seq 1 10)
echo "count=$count (正确！)"
echo "sum=$sum     (正确！)"

# --- 方案B：Here String ---
echo ""
echo "--- 方案B：Here String <<< ---"
count=0
sum=0
while read num; do
    ((count++))
    ((sum += num))
done <<< "$(seq 1 10)"
echo "count=$count (正确！)"
echo "sum=$sum     (正确！)"

# --- 方案C：lastpipe ---
echo ""
echo "--- 方案C：shopt -s lastpipe ---"
shopt -s lastpipe
count=0
sum=0
seq 1 10 | while read num; do
    ((count++))
    ((sum += num))
done
shopt -u lastpipe
echo "count=$count (正确！)"
echo "sum=$sum     (正确！)"

# --- 实战：统计 /etc/passwd 中的普通用户 ---
echo ""
echo "=========================================="
echo "  实战：统计普通用户（UID >= 1000）"
echo "=========================================="

# 方案A（推荐）
declare -A user_stats
user_count=0
while IFS=: read -r username _ uid _ _ home shell; do
    if (( uid >= 1000 )); then
        user_stats["$username"]="$uid:$home:$shell"
        ((user_count++))
    fi
done < <(cat /etc/passwd 2>/dev/null)

echo "普通用户数: $user_count"
echo ""
echo "用户详情:"
for user in "${!user_stats[@]}"; do
    IFS=':' read -r uid home shell <<< "${user_stats[$user]}"
    printf "  %-15s UID:%-5s Shell:%-15s Home:%s\n" "$user" "$uid" "$shell" "$home"
done
SCRIPT

chmod +x ~/bash-lesson25/ex7-pipe-solution.sh
~/bash-lesson25/ex7-pipe-solution.sh
```

### 练习 25.8：综合挑战 —— 系统备份工具

**题目：**

编写一个完整的系统备份脚本 `~/bash-lesson25/ex8-backup-tool.sh`：
（1）使用 `getopts` 解析选项：`-s SRC`（源目录）、`-d DEST`（目标目录）、`-e PATTERN`（排除模式，可多次使用）、`-v`（详细）、`-c`（压缩）、`-h`（帮助）
（2）定义函数：`log_info`、`log_error`、`usage`、`do_backup`、`cleanup`
（3）使用 `local` 在函数内声明所有变量
（4）使用 `trap` 注册 `EXIT`、`INT`、`TERM` 清理（删除不完整的备份）
（5）使用 `mktemp` 创建临时工作目录
（6）使用 Heredoc 生成备份报告
（7）在 `do_backup` 中：检查源目录存在、创建时间戳备份名、使用 rsync（或 cp）复制、压缩（如果指定）、计算文件数和大小
（8）函数返回恰当的退出码，主程序通过 `$?` 检查

**答案：**

```bash
cat > ~/bash-lesson25/ex8-backup-tool.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# ==========================================
# 系统备份工具 - 综合练习
# ==========================================

# --- 全局变量 ---
SCRIPT_NAME="$(basename "$0")"
START_TIME=$(date +%s.%N)
TMPDIR=""
BACKUP_PATH=""

# --- 函数定义 ---

usage() {
    cat << 'HELP'
系统备份工具

用法:
  ex8-backup-tool.sh -s <源目录> -d <目标目录> [选项]

选项:
  -s DIR      源目录（必填）
  -d DIR      目标目录（必填）
  -e PATTERN  排除模式（可多次使用，如 -e "*.tmp" -e ".git"）
  -c          使用 gzip 压缩备份
  -v          详细输出模式
  -h          显示帮助

示例:
  ex8-backup-tool.sh -s /home/user -d /backup -v
  ex8-backup-tool.sh -s /etc -d /mnt/backup -e "*.log" -e ".cache" -c -v
HELP
    exit 0
}

log_info() {
    echo "[$(date '+%H:%M:%S')] [INFO] $*"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] [ERROR] $*" >&2
}

# 清理函数
cleanup() {
    local exit_code=$?
    
    # 如果是异常退出，删除不完整的备份
    if (( exit_code != 0 )) && [[ -n "$BACKUP_PATH" ]] && [[ -d "$BACKUP_PATH" ]]; then
        log_error "备份中断，清理不完整的备份: $BACKUP_PATH"
        rm -rf "$BACKUP_PATH" 2>/dev/null || true
    fi
    
    # 删除临时目录
    if [[ -n "$TMPDIR" ]] && [[ -d "$TMPDIR" ]]; then
        rm -rf "$TMPDIR" 2>/dev/null || true
    fi
    
    if (( exit_code == 0 )); then
        log_info "清理完成（正常退出）"
    else
        log_info "清理完成（异常退出, 码: $exit_code）"
    fi
    
    exit $exit_code
}
trap cleanup EXIT INT TERM

# 备份主函数
function do_backup {
    local src_dir="$1"
    local dest_dir="$2"
    local -n exclude_ref="$3"    # nameref: 引用调用者的数组
    local use_compress="$4"
    local verbose="$5"
    
    # 验证源目录
    if [[ ! -d "$src_dir" ]]; then
        log_error "源目录不存在: $src_dir"
        return 2
    fi
    if [[ ! -r "$src_dir" ]]; then
        log_error "源目录不可读: $src_dir"
        return 2
    fi
    
    # 创建目标目录
    mkdir -p "$dest_dir" || {
        log_error "无法创建目标目录: $dest_dir"
        return 2
    }
    
    # 生成备份名称
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="backup_$(basename "$src_dir")_${timestamp}"
    BACKUP_PATH="${dest_dir}/${backup_name}"
    
    # 创建临时工作目录
    TMPDIR=$(mktemp -d /tmp/backup_XXXXXX)
    
    $verbose && log_info "源目录:   $src_dir"
    $verbose && log_info "目标目录: $dest_dir"
    $verbose && log_info "备份路径: $BACKUP_PATH"
    $verbose && log_info "压缩:     $use_compress"
    
    # 构建排除参数
    local exclude_opts=()
    for pattern in "${exclude_ref[@]}"; do
        exclude_opts+=(--exclude "$pattern")
        $verbose && log_info "排除:     $pattern"
    done
    
    # 执行备份（使用 rsync 或 cp）
    if command -v rsync > /dev/null 2>&1; then
        $verbose && log_info "使用 rsync 进行备份..."
        rsync -a "${exclude_opts[@]}" "$src_dir/" "$BACKUP_PATH/" 2>/dev/null
    else
        $verbose && log_info "使用 cp 进行备份..."
        # cp 不支持排除模式，所以先复制全部
        cp -r "$src_dir/"* "$BACKUP_PATH/" 2>/dev/null || true
    fi
    
    # 统计
    local file_count dir_count total_size
    file_count=$(find "$BACKUP_PATH" -type f 2>/dev/null | wc -l)
    dir_count=$(find "$BACKUP_PATH" -type d 2>/dev/null | wc -l)
    total_size=$(du -sb "$BACKUP_PATH" 2>/dev/null | cut -f1)
    total_size=${total_size:-0}
    
    # 转换为人类可读
    local size_human
    if (( total_size >= 1073741824 )); then
        size_human="$(bc -l <<< "scale=1; $total_size / 1073741824") GB"
    elif (( total_size >= 1048576 )); then
        size_human="$(bc -l <<< "scale=1; $total_size / 1048576") MB"
    elif (( total_size >= 1024 )); then
        size_human="$(bc -l <<< "scale=1; $total_size / 1024") KB"
    else
        size_human="${total_size} B"
    fi
    
    # 压缩（如果指定）
    if $use_compress; then
        $verbose && log_info "压缩备份..."
        local archive_name="${BACKUP_PATH}.tar.gz"
        tar -czf "$archive_name" -C "$dest_dir" "$backup_name" 2>/dev/null
        rm -rf "$BACKUP_PATH"
        BACKUP_PATH="$archive_name"
    fi
    
    # 计算耗时
    local end_time elapsed
    end_time=$(date +%s.%N)
    elapsed=$(bc -l <<< "scale=1; $end_time - $START_TIME")
    
    # 返回统计信息（通过 stdout）
    echo "file_count=$file_count"
    echo "dir_count=$dir_count"
    echo "total_size=$total_size"
    echo "size_human=$size_human"
    echo "elapsed=$elapsed"
    echo "backup_path=$BACKUP_PATH"
    
    return 0
}

# --- 选项解析 ---
SRC_DIR=""
DEST_DIR=""
declare -a EXCLUDE_PATTERNS=()
COMPRESS=false
VERBOSE=false

while getopts "s:d:e:cvh" opt; do
    case "$opt" in
        s) SRC_DIR="$OPTARG" ;;
        d) DEST_DIR="$OPTARG" ;;
        e) EXCLUDE_PATTERNS+=("$OPTARG") ;;
        c) COMPRESS=true ;;
        v) VERBOSE=true ;;
        h) usage ;;
        \?) log_error "无效选项: -$OPTARG"; usage ;;
        :)  log_error "选项 -$OPTARG 需要参数"; usage ;;
    esac
done
shift $((OPTIND - 1))

# 验证
if [[ -z "$SRC_DIR" ]]; then
    log_error "-s 源目录是必填的"
    usage
fi
if [[ -z "$DEST_DIR" ]]; then
    log_error "-d 目标目录是必填的"
    usage
fi

# --- 执行备份 ---
log_info "=========================================="
log_info "  系统备份工具"
log_info "=========================================="

# 捕获 do_backup 的输出（统计信息）
backup_stats=$(do_backup "$SRC_DIR" "$DEST_DIR" EXCLUDE_PATTERNS "$COMPRESS" "$VERBOSE")
backup_status=$?

if (( backup_status != 0 )); then
    log_error "备份失败！"
    exit $backup_status
fi

# 解析统计信息
declare -A stats
while IFS='=' read -r key value; do
    stats["$key"]="$value"
done <<< "$backup_stats"

# 生成报告（使用 Heredoc）
cat << REPORT
==========================================
  备份报告
==========================================
备份名称: $(basename "${stats[backup_path]}")
备份路径: ${stats[backup_path]}
文件数:   ${stats[file_count]}
目录数:   ${stats[dir_count]}
总大小:   ${stats[size_human]}
耗时:     ${stats[elapsed]} 秒
压缩:     $COMPRESS
源目录:   $SRC_DIR
时间:     $(date '+%Y-%m-%d %H:%M:%S')
==========================================
REPORT

log_info "备份成功完成！"
exit 0
SCRIPT

chmod +x ~/bash-lesson25/ex8-backup-tool.sh

# 创建测试数据
echo "=== 创建测试数据 ==="
mkdir -p /tmp/test-backup-src/{docs,data,logs}
echo "Document content" > /tmp/test-backup-src/docs/readme.txt
echo "Important data" > /tmp/test-backup-src/data/data.csv
echo "Log entry 1" > /tmp/test-backup-src/logs/app.log
echo "Temp data" > /tmp/test-backup-src/logs/debug.tmp
mkdir -p /tmp/test-backup-dest

echo ""
echo "=== 测试1：基本备份 ==="
~/bash-lesson25/ex8-backup-tool.sh -s /tmp/test-backup-src -d /tmp/test-backup-dest -v -e "*.tmp"

echo ""
echo "=== 测试2：带压缩的备份 ==="
~/bash-lesson25/ex8-backup-tool.sh -s /tmp/test-backup-src -d /tmp/test-backup-dest -c -v

echo ""
echo "=== 测试3：帮助信息 ==="
~/bash-lesson25/ex8-backup-tool.sh -h

# 清理
rm -rf /tmp/test-backup-src /tmp/test-backup-dest
```

---

## 5. 常见错误与排错

### 5.1 误区：函数调用加括号

```bash
# 错误：在 Bash 函数调用中使用括号
# myfunc("arg1" "arg2")     # 语法错误！() 是子 Shell 语法

# 正确：直接写函数名和参数（像调用命令一样）
myfunc "arg1" "arg2"

# 演示
function greet { echo "Hello, $1"; }
greet "World"          # 正确！
# greet("World")       # 错误！bash: syntax error near unexpected token `"World"'
```

### 5.2 误区：混淆 return 和 echo

```bash
# 错误示例：用 echo 返回状态，用 return 返回数据
function bad_get_sum {
    return $(( $1 + $2 ))      # 错误！return 只能返回 0-255！
}
# bad_get_sum 100 200          # return 300 => 实际返回 44 (300%256)

function bad_check {
    echo 0                     # 错误！echo 0 会输出到 stdout，不是返回状态！
    # 调用者用 $? 检查会得到 echo 0 后命令的退出码，不是函数的状态
}

# 正确做法
function good_get_sum {
    local sum=$(( $1 + $2 ))
    echo "$sum"                # 数据通过 stdout 输出
    return 0                   # 状态通过 return
}

function good_check {
    if [[ -f "$1" ]]; then
        return 0               # 状态通过 return
    else
        return 1
    fi
}
```

### 5.3 误区：local 一行声明多个变量遇到命令替换

```bash
# 错误：local 声明和命令替换放在同一行，退出码被覆盖
function bad_version {
    local result=$(false)
    echo "退出码: $?"          # 输出 0！不是 1
}

# 正确：分开声明和赋值
function good_version {
    local result
    result=$(false)
    echo "退出码: $?"          # 输出 1，正确
}
```

### 5.4 误区：管道 while 中的变量修改在外部不可见

```bash
# 错误：认为管道 while 中修改的变量在外部可见
# sum=0
# seq 1 10 | while read n; do
#     ((sum += n))             # 在子 Shell 中修改，外部不可见
# done
# echo $sum                    # 始终是 0！

# 正确：使用进程替换
sum=0
while read n; do
    ((sum += n))
done < <(seq 1 10)
echo "$sum"                    # 55，正确
```

### 5.5 误区：Heredoc 定界符前有空格/tab

```bash
# 错误：结束定界符前有空格
# cat << EOF
# 一些内容
#     EOF                      # 错误！EOF 前有空格，不会被识别为定界符

# 正确：结束定界符必须在行首（除非使用 <<-）
cat << EOF
一些内容
EOF                            # 正确！EOF 在行首

# 或使用 <<- 允许 tab 缩进
cat <<- END
	内容有 tab 缩进
	END                        # END 前是 tab（不是空格）
```

### 5.6 误区：不带引号的 Heredoc 中 $ 和 ` 被意外展开

```bash
# 如果 Heredoc 中包含 $ 符号（如正则表达式、CSS、代码示例）
# 不带引号的定界符会导致意外的变量展开

# 错误：正则表达式中的 $ 被当作变量
cat << EOF
grep '^[a-z]*$' file          # $' 被当作变量引用！
EOF

# 正确：使用带引号的定界符
cat << 'EOF'
grep '^[a-z]*$' file          # 所有内容保持原样
EOF
```

### 5.7 误区：set -e 在管道和条件中的例外

```bash
# set -e 在某些场景下不会触发退出：
# 1. 管道中非最后一个命令的失败（除非 set -o pipefail）
# 2. while/until 条件中的命令
# 3. if 条件中的命令
# 4. || 和 && 左侧的命令
# 5. 在 ! 之后的命令

set -e
# 以下不会触发退出：
while false; do echo "不会"; done     # while 条件
if false; then echo "不会"; fi        # if 条件
false || echo "不会退出"               # || 左侧
true && echo "不会退出"               # &&
! false                                # ! 取反
set +e
```

### 5.8 误区：getopts 不识别长选项

```bash
# getopts 是 POSIX 标准，只支持短选项（单个字符）
# 如果需要 --help、--verbose、--file 这样的长选项：
# 选项1：手动解析（while + case）
# 选项2：使用 GNU getopt（非 POSIX，但功能更强）
# 选项3：同时提供短选项和长选项 -h/--help

# getopts 的限制：不能解析 --file=value 语法
# 能解析: -f value 或 -fvalue
# 不能: --file value 或 --file=value
```

### 5.9 误区：函数内的 return 被误解为"返回值"

```bash
function get_value {
    return 42          # 这返回的是退出码 42，不是"值 42"
}
get_value
echo "$?"              # 输出 42（退出码）
# 不是：$result = 42

# 正确理解：
# return N   => 退出状态码（通过 $? 获取）
# echo/cat   => 函数输出（通过 $() 获取）
```

### 5.10 误区：trap 中的 exit 会丢失原始退出码

```bash
# 错误：trap 中直接 exit，丢失原始退出码
cleanup_bad() {
    rm -f "$TMPFILE"
    exit 0               # 总是以 0 退出！
}
trap cleanup_bad EXIT

# 正确：保存并恢复退出码
cleanup_good() {
    local exit_code=$?   # 保存原始退出码
    rm -f "$TMPFILE"
    exit $exit_code       # 恢复原始退出码
}
trap cleanup_good EXIT
```

---

## 6. 进阶延伸

### 6.1 函数库：source 与可复用模块

当你积累了常用的函数后，可以将它们提取到独立的文件中，通过 `source`（或 `.`）在多个脚本中复用。

```bash
cat > ~/bash-lesson25/lib-logging.sh << 'LIB'
#!/bin/bash
# ==========================================
# 日志库 - 可复用的日志函数
# ==========================================

# 颜色支持
if [[ -t 1 ]]; then
    COLOR_RED='\033[0;31m'
    COLOR_GREEN='\033[0;32m'
    COLOR_YELLOW='\033[1;33m'
    COLOR_CYAN='\033[0;36m'
    COLOR_RESET='\033[0m'
else
    COLOR_RED='' COLOR_GREEN='' COLOR_YELLOW='' COLOR_CYAN='' COLOR_RESET=''
fi

# 日志级别
LOG_LEVEL="${LOG_LEVEL:-INFO}"

function log_debug { [[ "$LOG_LEVEL" == "DEBUG" ]] && echo -e "${COLOR_CYAN}[DEBUG]${COLOR_RESET} $(date '+%H:%M:%S') $*" >&2; }
function log_info  { echo -e "${COLOR_GREEN}[INFO]${COLOR_RESET}  $(date '+%H:%M:%S') $*"; }
function log_warn  { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET}  $(date '+%H:%M:%S') $*" >&2; }
function log_error { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $(date '+%H:%M:%S') $*" >&2; }
function log_fatal { echo -e "${COLOR_RED}[FATAL]${COLOR_RESET} $(date '+%H:%M:%S') $*" >&2; exit 1; }
LIB

cat > ~/bash-lesson25/ex-using-lib.sh << 'SCRIPT'
#!/bin/bash

# 加载函数库
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib-logging.sh"

log_info "脚本启动"
log_debug "这是一条调试信息"
log_warn "磁盘使用率达到 80%"
log_error "连接数据库失败"

# 只在使用 source 时可见
# ./ex-using-lib.sh（直接执行 => 子 Shell => 函数不可见）
# source ex-using-lib.sh   （source => 当前 Shell => 函数可见）
SCRIPT

chmod +x ~/bash-lesson25/ex-using-lib.sh
echo "=== 测试函数库 ==="
~/bash-lesson25/ex-using-lib.sh

echo ""
echo "=== 使用 LOG_LEVEL 控制调试输出 ==="
LOG_LEVEL=DEBUG ~/bash-lesson25/ex-using-lib.sh
```

### 6.2 nameref（declare -n / local -n）：引用传递

Bash 4.3+ 支持 nameref（Name Reference），允许函数通过引用修改调用者的变量，而不是通过 stdout 传递数据。

```bash
cat > ~/bash-lesson25/nameref-demo.sh << 'SCRIPT'
#!/bin/bash

# nameref 允许函数直接修改调用者的变量
# 类似于 C++ 的引用或 Python 的可变对象

function increment {
    local -n ref="$1"     # -n 创建 nameref，ref 指向调用者的变量
    ((ref++))
}

function get_user_info {
    local uid="$1"
    local -n out_name="$2"
    local -n out_home="$3"
    
    # 从 /etc/passwd 读取信息，直接写入调用者的变量
    local line
    line=$(grep "^[^:]*:[^:]*:$uid:" /etc/passwd 2>/dev/null)
    
    if [[ -n "$line" ]]; then
        out_name=$(echo "$line" | cut -d: -f1)
        out_home=$(echo "$line" | cut -d: -f6)
        return 0
    else
        return 1
    fi
}

# --- nameref 演示 ---
count=0
echo "count = $count"
increment count
increment count
increment count
echo "count = $count (nameref 修改了调用者的变量)"

echo ""

# --- 多个返回值 ---
username=""
userhome=""
if get_user_info 0 username userhome; then
    echo "UID 0: name=$username, home=$userhome"
else
    echo "UID 0 不存在"
fi

# --- nameref 的陷阱：名称冲突 ---
echo ""
echo "=== nameref 名称冲突 ==="
function bad_nameref {
    local -n arr="$1"      # nameref 指向调用者的 arr
    local arr               # 错误！local arr 尝试创建与 nameref 同名的变量
    arr="value"             # 这会修改 nameref 指向的变量还是 local arr？
}
# 规则：不要在函数内声明与 nameref 同名的 local 变量
SCRIPT

bash ~/bash-lesson25/nameref-demo.sh
rm -f ~/bash-lesson25/nameref-demo.sh
```

### 6.3 信号处理进阶：trap 的组合与恢复

```bash
cat > ~/bash-lesson25/trap-advanced.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  trap 进阶用法"
echo "=========================================="

# --- 1. 查看当前的 trap 设置 ---
echo "--- 当前 trap 设置 ---"
trap -p

# --- 2. 多个信号共享一个处理器 ---
function multi_handler {
    local signal="$1"
    echo "[处理] 收到信号: $signal"
}
trap 'multi_handler EXIT' EXIT
trap 'multi_handler INT' INT

# --- 3. 临时覆盖 trap ---
echo ""
echo "--- 临时覆盖 trap ---"
echo "正常情况: Ctrl+C 被 trap 捕获"

# 在子 Shell 中临时恢复默认信号处理
(
    trap - INT     # 恢复 INT 的默认行为
    echo "在子 Shell 中: Ctrl+C 会直接终止"
    # sleep 10    # 在这期间按 Ctrl+C 会直接终止子 Shell
)
echo "回到父 Shell: Ctrl+C 又被 trap 捕获"

# --- 4. 脚本间的 trap 继承 ---
echo ""
echo "--- trap 继承 ---"
echo "子脚本默认继承父 Shell 中被忽略的信号 (trap '' SIG)"
echo "但不继承被设置了处理器的信号"

# --- 5. 忽略信号 ---
echo ""
echo "--- 忽略信号 ---"
{
    trap '' INT     # 忽略 Ctrl+C
    echo "在 2 秒内，Ctrl+C 被忽略..."
    sleep 2
    trap - INT      # 恢复默认
    echo "Ctrl+C 已恢复"
}
SCRIPT

bash ~/bash-lesson25/trap-advanced.sh
rm -f ~/bash-lesson25/trap-advanced.sh
```

### 6.4 命令提示符变量：PS0-PS4 完整体系

```bash
cat > ~/bash-lesson25/ps-vars.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "  PS0-PS4 命令提示符变量体系"
echo "=========================================="
echo ""

cat << 'EXPLAIN'
+------------------------------------------------------------------+
|                    PS 变量体系                                     |
|                                                                  |
|  PS0: Bash 4.4+。在每条命令执行前由 Bash 展开并显示                |
|       交互式 Shell 使用                                            |
|  PS1: 主提示符（Primary Prompt）—— 等待下一条命令时显示            |
|       默认: "\s-\v\$ " (shell名-版本$)                             |
|       常用: "[\u@\h \W]\$ " (user@host dir$)                      |
|  PS2: 续行提示符（Secondary Prompt）—— 命令未完成时显示            |
|       默认: "> "                                                  |
|  PS3: select 循环的提示符                                          |
|       默认: "#? "                                                 |
|  PS4: set -x 追踪输出的前缀                                        |
|       默认: "+ "                                                  |
+------------------------------------------------------------------+
EXPLAIN

echo ""

# PS1 演示（自定义提示符）
echo "--- PS1 自定义 ---"
echo '当前 PS1: '"$PS1"
echo '建议: export PS1="[\u@\h \w]\\$ "'

# PS2 演示
echo ""
echo "--- PS2 续行提示符 ---"
echo '当你在命令行按回车但命令不完整时：'
echo '  $ for i in {1..3}; do'
echo '  > echo $i           ← PS2 显示为 "> "'
echo '  > done'

# PS4 最佳实践
echo ""
echo "--- PS4 调试前缀 ---"
echo "推荐设置（用于 set -x 调试）："
echo '  export PS4='"'"'+ [\${BASH_SOURCE##*/}:\${LINENO}] \${FUNCNAME[0]:+\${FUNCNAME[0]}():} '"'"
echo ""
echo "输出示例:"
echo "  + [script.sh:42] main(): tar -czf backup.tar.gz /etc"

# PS0（Bash 4.4+）
echo ""
echo "--- PS0（Bash 4.4+，命令执行前）---"
echo "可以用于: 在每条命令前记录时间戳"
echo '  PS0='"'"'\$(date "+%H:%M:%S") '"'"
SCRIPT

bash ~/bash-lesson25/ps-vars.sh
rm -f ~/bash-lesson25/ps-vars.sh
```

### 6.5 使用 caller 构建详细的错误日志

```bash
cat > ~/bash-lesson25/caller-error-log.sh << 'SCRIPT'
#!/bin/bash

# 生产级的错误日志函数
function log_error_with_stack {
    local message="$1"
    local exit_code="${2:-1}"
    
    # 获取调用栈
    local stack_trace=""
    local frame=0
    while caller $frame > /dev/null 2>&1; do
        local line_no func_name file_name
        read -r line_no func_name file_name <<< "$(caller $frame)"
        stack_trace+="  #$frame $func_name() at ${file_name##*/}:$line_no"$'\n'
        ((frame++))
    done
    
    # 写入错误日志
    cat <<- ERRORLOG >&2
	========================================
	  错误报告
	========================================
	  时间:    $(date '+%Y-%m-%d %H:%M:%S')
	  脚本:    ${0##*/}
	  消息:    $message
	  退出码:  $exit_code
	========================================
	  调用栈:
	${stack_trace}========================================
	ERRORLOG
}

function level3 {
    log_error_with_stack "在 level3 中发生错误" 42
}

function level2 {
    level3
}

function level1 {
    level2
}

echo "=== 错误日志演示 ==="
level1
echo "演示结束"
SCRIPT

bash ~/bash-lesson25/caller-error-log.sh
rm -f ~/bash-lesson25/caller-error-log.sh
```

### 6.6 Bash 严格模式的完整解析

```bash
cat > ~/bash-lesson25/strict-mode.sh << 'SCRIPT'
#!/bin/bash

# ==========================================
# Bash 严格模式完整解析
# ==========================================

echo "=========================================="
echo "  Bash 严格模式"
echo "=========================================="

cat << 'EXPLAIN'

推荐的严格模式设置：

  set -euo pipefail
  IFS=$'\n\t'

各项含义：

1. set -e (errexit)
   - 任何命令以非零状态退出时，脚本立即退出
   - 例外: if/while/until 条件、||/&& 左侧、! 取反
   - 配合 set -o pipefail 效果更好

2. set -u (nounset)
   - 引用未定义的变量时报错退出
   - 安全访问: ${var:-default}、[[ -v var ]]

3. set -o pipefail
   - 管道中任何命令失败都导致管道整体失败
   - 默认只有最后一个命令的退出码被报告

4. IFS=$'\n\t'
   - 将内部字段分隔符限制为换行和制表符
   - 防止意外的单词分割（特别是文件名中的空格）

完整模板：

  #!/bin/bash
  set -euo pipefail
  IFS=$'\n\t'
  
  cleanup() {
      local exit_code=$?
      # 清理代码
      exit $exit_code
  }
  trap cleanup EXIT INT TERM
EXPLAIN
SCRIPT

bash ~/bash-lesson25/strict-mode.sh
rm -f ~/bash-lesson25/strict-mode.sh
```

### 6.7 函数命名规范和代码组织

```
+------------------------------------------------------------------+
|                    函数命名规范建议                                    |
|                                                                    |
|  前缀约定：                                                         |
|    get_*    获取数据（通常向 stdout 输出）                           |
|    set_*    设置值（通常修改全局或接收引用参数）                       |
|    check_*  验证条件（通过 return 返回成功/失败）                    |
|    is_*     布尔测试（return 0 或 1）                               |
|    parse_*  解析数据                                                |
|    print_*  输出格式化内容                                          |
|    log_*    日志输出                                                |
|    require_* 前置条件检查（失败则退出）                               |
|    _private 以下划线开头的函数表示"私有"（习惯约定）                 |
|                                                                    |
|  代码组织建议：                                                      |
|    1. Shebang 行                                                    |
|    2. set 选项（严格模式）                                          |
|    3. 全局常量和变量                                                |
|    4. 函数定义（按依赖顺序：被依赖的在前）                          |
|    5. main 函数                                                     |
|    6. 脚本入口: main "$@"                                           |
|                                                                    |
|  文件组织（较大项目）：                                              |
|    lib/utils.sh   - 工具函数                                       |
|    lib/logging.sh - 日志函数                                       |
|    lib/config.sh  - 配置读取                                       |
|    main.sh        - 主逻辑，source 上述文件                        |
+------------------------------------------------------------------+
```

### 6.8 与 Python/Go 的脚本对比与选择边界

```bash
cat << 'GUIDELINE'

+------------------------------------------------------------------+
|                    Bash 脚本的适用边界                                 |
|                                                                    |
|  什么时候用 Bash：                                                  |
|    + 文件系统操作（批量重命名、查找、处理）                          |
|    + 系统管理（备份、监控、部署）                                    |
|    + 命令编排（串联多个 CLI 工具）                                   |
|    + 环境配置（安装脚本、环境初始化）                                |
|    + 管道和重定向操作                                               |
|    + 简单文本处理（sed/awk/grep）                                  |
|    + 快速原型验证                                                  |
|                                                                    |
|  什么时候换 Python/Go：                                            |
|    + 复杂数据结构（嵌套字典、树、图）                                |
|    + 需要 JSON/YAML/XML 解析（虽然有 jq/yq）                        |
|    + 网络编程（HTTP 客户端/服务器）                                  |
|    + 多线程/异步 IO                                                  |
|    + 需要单元测试和类型检查                                          |
|    + 脚本行数超过 500 行                                             |
|    + 需要复杂错误处理逻辑                                           |
|    + 团队合作（Bash 可读性随代码量急剧下降）                        |
|                                                                    |
|  混合策略（Bash + Python）：                                        |
|    Bash 脚本中调用 Python 处理复杂逻辑：                             |
|      result=$(python3 -c "import json; print(json.loads('...'))")  |
|    或用 Here Doc 传递 Python 代码：                                 |
|      python3 << 'PYEOF'                                            |
|      ... Python code ...                                           |
|      PYEOF                                                         |
+------------------------------------------------------------------+
GUIDELINE
```

### 6.9 最佳实践清单

```
==========================================
  函数与高级技巧 —— 最佳实践清单
==========================================

【函数】
  + 一个函数只做一件事（单一职责）
  + 函数名用 snake_case，清晰描述功能
  + 函数内所有变量用 local 声明
  + 优先使用 function name { } 语法
  + 函数定义放在调用之前

【参数与返回】
  + 函数参数用 "$@" 转发给其他命令
  + 数据通过 stdout (echo) 返回，调用者用 $() 捕获
  + 状态通过 return (0-255) 返回，调用者用 $? 检查
  + 多个返回值使用 nameref (declare -n) 或约定格式

【trap】
  + 所有脚本都应设置 trap cleanup EXIT
  + cleanup 中保存并恢复 $?
  + 同时捕获 INT 和 TERM 信号
  + 生产脚本考虑 trap ERR 用于错误日志

【getopts】
  + 解析命令行选项使用 getopts（而非手动 while+case）
  + 提供 -h 帮助选项
  + 必填选项在解析后检查
  + 注意 getopts 不支持长选项（如需，使用 GNU getopt）

【调试】
  + 开发时使用 set -euo pipefail
  + 调试时设置 DEBUG=true 条件开启 set -x
  + 自定义 PS4 显示文件名、行号、函数名
  + 使用 BASH_SOURCE/BASH_LINENO/FUNCNAME 构建调用栈
  + 安装并使用 shellcheck

【Heredoc】
  + 包含 $ 或 ` 的字面量文本使用 'EOF' 定界符
  + 需要展开变量的使用 EOF（不带引号）
  + 使用 <<- 配合 tab 缩进保持代码美观
  + Heredoc 可嵌套（使用不同的定界符）

【子 Shell】
  + 管道 while 用进程替换 < <() 避免变量丢失
  + 避免在循环内使用 $() 创建子 Shell
  + 大文件读取用 while IFS= read -r，不用 for + cat
  + 理解子 Shell 的变量隔离

【工程化】
  + 将通用函数提取到库文件中（source）
  + 使用 main "$@" 模式组织脚本入口
  + 生产脚本包含 help/version/dry-run
  + 超过 200 行考虑重构或改用 Python
  + 使用 shellcheck 静态分析
```

---

本章至此结束。你完成了 Bash 脚本编程三部曲的最后一章。从第 23 章的基础语法（shebang、引号、数组、算术），到第 24 章的条件与循环（if/case/for/while/until/select），到本章的函数与高级技巧（local、trap、getopts、调试、heredoc、子 Shell、性能优化）——你已经掌握了将 Bash 脚本从"能运行"提升到"健壮、可维护、可调试"的工程水准所需要的全部核心知识。

Phase 3（I/O 与变量 —— Shell 脚本的基础设施）到此全部完成。你从第 20 章的重定向与管道开始，到本章的函数与高级技巧，完成了从数据流到脚本工程化的完整学习曲线。Phase 4 将进入**系统篇**——进程管理、用户与权限、文件系统、软件包管理、网络基础、系统启动、内核模块，你将在 Phase 3 掌握的"工具使用能力"之上，建立真正的"系统管理能力"。
