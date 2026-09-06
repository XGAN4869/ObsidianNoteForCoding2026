# 第 22 章 Shell 变量与环境变量

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

### 1.1 从"I/O 通道"到"存储与配置"

第 20 章你学会了用重定向和管道连接进程的数据流。第 21 章你深入到文件描述符的内核层面——理解了 `struct file`、`dup2()`、`lsof` 和 `/proc/PID/fd/`。你掌握了"数据如何在进程之间流动"。

现在，你需要理解"数据如何在 Shell 内部被记住和传递"：

- "为什么我写的 `name=value` 在子脚本里读不到？"
- "`export` 到底做了什么？和普通的 `name=value` 有什么区别？"
- "为什么修改了 `~/.bashrc` 之后要 `source ~/.bashrc` 才生效？"
- "登录 Shell 和非登录 Shell 加载的配置文件有什么区别？"
- "`PATH` 变量的顺序重要吗？为什么 `/usr/local/bin` 要在 `/usr/bin` 前面？"
- "`declare -i` 和 `declare -a` 分别对变量做了什么限制？"
- "`printenv`、`env`、`set` 这三个命令的输出有什么不同？"

这些问题的核心是**变量（Variable）与环境（Environment）**——Shell 编程最基础的抽象。变量是脚本的"记忆"，环境变量是进程间配置传递的"通道"。不理解变量和环境，就无法写出任何有意义的 Shell 脚本。

### 1.2 变量与环境：Phase 3 的最后一块基石

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
|  第 22 章：Shell 变量与环境变量  ← 你在这一章                         |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  变量分类, export, declare, 启动文件, 重要环境变量               │ |
|  │  视角：Shell 如何"记住"和"传递"配置与状态                         │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                              ▲                                    |
|  第 23 章：Bash 脚本编程基础  →                                    |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  条件判断, 循环, 函数, 错误处理                                  │ |
|  │  变量 + I/O = 完整的脚本能力                                    │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

变量是 Shell 脚本的血肉。没有变量，脚本只能执行固定的命令序列；有了变量，脚本可以处理不同的输入、保存中间结果、根据条件改变行为。I/O 重定向解决了"数据从哪里来到哪里去"的问题；变量解决了"数据在脚本内部如何组织"的问题。两者结合，为第 23-25 章的 Bash 脚本编程打下完整的基础。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **变量赋值与查看** | `name=value`, `echo $name`, `${name}` | 创建和使用 Shell 变量 |
| **导出环境变量** | `export`, `declare -x` | 将 Shell 变量标记为环境变量，传递给子进程 |
| **查看变量** | `set`, `env`, `printenv` | 查看 Shell 变量和环境变量的不同视图 |
| **删除变量** | `unset` | 删除变量（环境变量或 Shell 变量） |
| **类型声明** | `declare` | 设置变量的类型属性（整数、数组、只读等） |
| **只读变量** | `readonly`, `declare -r` | 创建不可修改的常量 |
| **加载脚本** | `source`, `.` | 在当前 Shell 中执行脚本（而非子 Shell） |
| **启动文件** | `/etc/profile`, `~/.bashrc`, `~/.profile`, `~/.bash_logout` | Bash 启动时自动加载的配置文件 |
| **核心环境变量** | `PATH`, `HOME`, `USER`, `SHELL`, `LANG`, `PS1`, `LD_LIBRARY_PATH`, `EDITOR`, `PAGER`, `TZ`, `HISTSIZE`, `HISTFILESIZE`, `PROMPT_COMMAND` | 影响 Shell 和系统行为的关键变量 |

### 1.4 本章目标

完成本章后，你将能够：

- 清晰区分局部变量 (Local Variable)、环境变量 (Environment Variable)、Shell 变量 (Shell Variable) 三种概念
- 使用 `export` 将变量传递给子进程，理解进程环境块的继承机制
- 使用 `declare` 为变量设置类型属性：整数 (`-i`)、数组 (`-a`/`-A`)、只读 (`-r`)、导出 (`-x`)、大小写转换 (`-l`/`-u`)、名称引用 (`-n`)
- 理解 Bash 启动文件的加载顺序：login shell vs non-login interactive shell vs non-interactive shell
- 画出完整的登录流程：kernel → init → getty → login → /etc/profile → ~/.profile → ~/.bashrc
- 理解并正确配置 `PATH`、`LD_LIBRARY_PATH`、`PS1`、`HISTSIZE` 等关键环境变量
- 使用 `source` 在当前 Shell 中加载配置而无需开启新的子 Shell
- 排查常见的变量相关错误：赋值空格、引号缺失、export 遗漏、启动文件加载失败

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS，使用 Bash 5.x。

```bash
# 确认 Bash 版本
echo $BASH_VERSION
# 输出示例：5.2.21(1)-release

# 确认当前 Shell 类型
echo $SHELL
# 输出示例：/bin/bash

# 检查当前是否为登录 Shell（login shell）
shopt -q login_shell && echo "当前是登录 Shell" || echo "当前不是登录 Shell"
```

---

## 2. 核心概念

### 2.1 什么是变量：Shell 变量在内存中的本质

变量（Variable）是编程中最基础的概念——它是**一段有名字的内存存储位置**。在 Shell 中，变量不区分类型（默认都是字符串），你不需要声明变量的"数据类型"，直接赋值即可使用。

```
+------------------------------------------------------------------+
|                    Shell 变量在内存中的本质                           |
|                                                                  |
|  Shell 进程的地址空间                                               |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │                                                              │ |
|  │  变量哈希表（Variable Hash Table）                              │ |
|  │  ┌───────────────────────┐                                   │ |
|  │  │  "name"  → "Alice"    │  ← 字符串值                        │ |
|  │  │  "count" → "42"       │  ← 字符串值（declare -i 后为整数）   │ |
|  │  │  "PATH"  → "/usr/bin:..." │ ← 环境变量标记                  │ |
|  │  │  "PS1"   → "\\u@\\h:\\w\\$ " │ ← Shell 特殊变量             │ |
|  │  └───────────────────────┘                                   │ |
|  │                                                              │ |
|  │  Shell 变量的本质：                                             │ |
|  │  1. 变量名 → 字符串键（key），存储在进程的哈希表中                │ |
|  │  2. 变量值 → 字符串值（value），即使看起来是数字                  │ |
|  │  3. 属性标志 → 每个变量携带的标志位（exported, readonly, etc.）   │ |
|  │  4. 数组 → 特殊的变量，值是一个字符串索引/关联数组                 │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                                                                  |
|  环境块（Environment Block）                                       |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  只有被 export 标记的变量才会放入环境块                           │ |
|  │  ┌─────────────────────────────────────────────────────┐     │ |
|  │  │  PATH=/usr/local/bin:/usr/bin:/bin                  │     │ |
|  │  │  HOME=/home/user                                    │     │ |
|  │  │  USER=user                                          │     │ |
|  │  │  LANG=en_US.UTF-8                                   │     │ |
|  │  │  ...                                                │     │ |
|  │  └─────────────────────────────────────────────────────┘     │ |
|  │  execve() 系统调用将环境块传递给新程序的 main()                   │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

```bash
# 验证：Bash 用哈希表存储变量
# 虽然没有直接查看哈希表的命令，但可以通过变量的"即时访问"特性感受

# 创建一些变量
name="Alice"
count=42
favorite_color="blue"

# Bash 通过变量名直接访问，时间复杂度 O(1)
echo "$name has favorite color $favorite_color and count $count"

# 变量的属性可以看到
declare -p name
# 输出：declare -- name="Alice"
#       -- 表示无特殊属性（非导出、非只读、非整数等）
```

### 2.2 三种变量的定义与区别

这是本章最核心的概念区分。Shell 中有三种"变量"概念，它们的区别在于**可见范围**和**生存周期**。

```
+------------------------------------------------------------------+
|                    三种变量的定义与区别                               |
|                                                                  |
|  ┌─────────────────────────────────────────────────────────────┐ |
|  │                   Shell 变量（Shell Variable）                │ |
|  │  ┌───────────────────────────────────────────────────────┐  │ |
|  │  │  定义：在当前 Shell 进程中定义的变量                       │  │ |
|  │  │  范围：整个当前 Shell（包括函数内部，除非用 local）         │  │ |
|  │  │  继承：不会自动传递给子进程                                │  │ |
|  │  │  创建：name=value                                       │  │ |
|  │  │  查看：set（不加参数）                                    │  │ |
|  │  │  ┌─────────────────────────────────────────────────┐  │  │ |
|  │  │  │  局部变量 (Local Variable)                       │  │  │ |
|  │  │  │  - 作用域限定在函数内部                           │  │  │ |
|  │  │  │  - 使用 local 关键字声明                        │  │  │ |
|  │  │  │  - 函数返回后自动销毁                             │  │  │ |
|  │  │  │  - 不传递给子进程                                │  │  │ |
|  │  │  └─────────────────────────────────────────────────┘  │  │ |
|  │  └───────────────────────────────────────────────────────┘  │ |
|  │                                                             │ |
|  │  ┌───────────────────────────────────────────────────────┐  │ |
|  │  │              环境变量 (Environment Variable)            │  │ |
|  │  │  定义：被 export 标记的 Shell 变量                       │  │ |
|  │  │  范围：当前 Shell + 所有子进程                           │  │ |
|  │  │  继承：通过 fork()+exec() 传递给子进程                   │  │ |
|  │  │  创建：export name=value 或 name=value; export name   │  │ |
|  │  │  查看：env 或 printenv                                  │  │ |
|  │  └───────────────────────────────────────────────────────┘  │ |
|  └─────────────────────────────────────────────────────────────┘ |
|                                                                  |
|  关键关系：                                                        |
|  - 所有环境变量都是 Shell 变量，但并非所有 Shell 变量都是环境变量       |
|  - export 的本质：将变量从"Shell 变量哈希表"复制到"进程环境块"         |
|  - 子进程只能继承环境变量，不能继承普通的 Shell 变量                   |
|  - 局部变量（local variable）是 Shell 变量的一个子集，作用域限定在函数内 |
+------------------------------------------------------------------+
```

```bash
# 演示：三种变量的区别

# 1. 创建普通 Shell 变量
my_shell_var="I am a shell variable"
echo "Shell 变量：$my_shell_var"
# 输出：Shell 变量：I am a shell variable

# 2. 在子 Shell 中尝试访问 → 读不到！
bash -c 'echo "子进程中：my_shell_var=$my_shell_var"'
# 输出：子进程中：my_shell_var=
#       （空值——子进程没有继承这个变量）

# 3. 使用 export 将其变为环境变量
export my_shell_var
# 或者一步到位：export my_env_var="I am an env var"

# 4. 再次在子 Shell 中访问 → 可以读到！
bash -c 'echo "子进程中：my_shell_var=$my_shell_var"'
# 输出：子进程中：my_shell_var=I am a shell variable

# 5. 局部变量演示（函数内部）
function demo_local() {
    local local_var="只在函数内可见"
    global_var="函数外也能看到"
    echo "函数内：local_var=$local_var"
}
demo_local
echo "函数外：local_var=${local_var:-未定义}"
echo "函数外：global_var=$global_var"
# 输出：
# 函数内：local_var=只在函数内可见
# 函数外：local_var=未定义
# 函数外：global_var=函数外也能看到
```

### 2.3 变量的作用域与生命周期

```
+------------------------------------------------------------------+
|                    变量的作用域与生命周期                             |
|                                                                  |
|  创建时机           变量类型          销毁时机                       |
|  ─────────────────────────────────────────────────────────────    |
|  name=value        Shell 变量        Shell 退出 / unset            |
|  export name       Shell 变量        Shell 退出 / unset            |
|                    + 环境标记        环境标记被清除（变量本身还在）    |
|  local name       局部变量           函数返回时自动销毁              |
|  declare -r name  只读变量           Shell 退出（无法 unset）       |
|                                                                  |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  父 Shell（PID 1000）                                        │ |
|  │  ┌────────────────────┐                                     │ |
|  │  │ Shell 变量:          │                                     │ |
|  │  │   A=1  (普通)        │                                     │ |
|  │  │   B=2  (exported)    │────── fork()+exec() ──────→         │ |
|  │  └────────────────────┘                                     │ |
|  │  ┌────────────────────┐     ┌──────────────────────────────┐ │ |
|  │  │ 环境块:              │     │  子进程（PID 1001）           │ │ |
|  │  │   B=2               │     │  ┌────────────────────┐     │ │ |
|  │  └────────────────────┘     │  │ 环境变量:             │     │ │ |
|  │                             │  │   B=2  (继承自父进程)  │     │ │ |
|  │                             │  │   C=3  (自己创建)     │     │ │ |
|  │                             │  └────────────────────┘     │ │ |
|  │                             │                              │ │ |
|  │                             │  A 不可见！子进程无法访问      │ │ |
|  │                             │  修改 B 只影响子进程自身      │ │ |
|  │                             │  父进程的 B 不受影响          │ │ |
|  │                             └──────────────────────────────┘ │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

```bash
# 验证：子进程修改环境变量不影响父进程

# 父 Shell 中
PARENT_VAR="original"
export PARENT_VAR
echo "父进程（修改前）: PARENT_VAR=$PARENT_VAR"

# 子 Shell 修改"继承的"变量
bash -c 'PARENT_VAR="modified in child"; echo "子进程: PARENT_VAR=$PARENT_VAR"'

# 父 Shell 不变
echo "父进程（修改后）: PARENT_VAR=$PARENT_VAR"
# 输出：
# 父进程（修改前）: PARENT_VAR=original
# 子进程: PARENT_VAR=modified in child
# 父进程（修改后）: PARENT_VAR=original
#                  ^^^^^^^^ 子进程的修改不会传回父进程
```

### 2.4 变量名的命名规则

```bash
# Shell 变量名遵循以下规则：

# ✅ 合法：字母、数字、下划线组成，不能以数字开头
valid_name="ok"
_underscore_start="ok"
name_123="ok"
NAME="ok"          # 大小写敏感：NAME 和 name 是不同的变量
user_name="ok"

# ❌ 非法：
123name="bad"      # 错误：不能以数字开头
# user-name="bad"  # 错误：不能包含连字符
# user.name="bad"  # 错误：不能包含点号
# user name="bad"  # 错误：不能包含空格

# 命名惯例（非强制，但推荐遵守）
# - 普通变量：小写 + 下划线，如 user_name, file_count
# - 环境变量：大写 + 下划线，如 JAVA_HOME, EDITOR, LD_LIBRARY_PATH
# - 内部变量：下划线开头，如 _internal_counter
# - 函数名：小写 + 下划线，如 get_user_home, parse_config
```

### 2.5 变量的赋值、引用与展开

```
+------------------------------------------------------------------+
|                    变量的赋值与引用语法                               |
|                                                                  |
|  操作          语法                    说明                        |
|  ─────────────────────────────────────────────────────────────    |
|  基本赋值      name=value             等号两边不能有空格！          |
|  基本引用      $name 或 ${name}       后者更精确，避免歧义           |
|  默认值        ${name:-default}      如果未定义或用默认值            |
|  赋值默认值    ${name:=default}      如果未定义则赋值并返回           |
|  必填检查      ${name:?error_msg}    如果未定义则报错退出             |
|  替代值        ${name:+alt_value}    如果已定义则用替代值            |
|  字符串长度    ${#name}               返回变量值的字符数              |
|  子串截取      ${name:offset:length}  从 offset 开始截取 length 字符 |
|  模式删除-前   ${name#pattern}        删除最短匹配前缀               |
|  模式删除-前   ${name##pattern}       删除最长匹配前缀               |
|  模式删除-后   ${name%pattern}        删除最短匹配后缀               |
|  模式删除-后   ${name%%pattern}       删除最长匹配后缀               |
|  替换          ${name/pattern/repl}   替换第一个匹配                 |
|  全部替换      ${name//pattern/repl}  替换所有匹配                   |
|  命令替换      $(command) 或 `command` 将命令输出赋给变量            |
+------------------------------------------------------------------+
```

```bash
# === 基本赋值与引用 ===
greeting="Hello, World!"
echo "$greeting"
echo "${greeting}"       # {} 可以明确变量边界
echo "${greeting}s"      # 输出 "Hello, World!s"——{} 避免了歧义
# echo "$greetings"      # 会读取不存在的变量 $greetings，输出空

# === 默认值操作 ===
echo "未定义变量：${undefined_var:-默认值}"
# 输出：未定义变量：默认值

# ${name:=value}：如果未定义，赋值并返回
echo "赋值后：${new_var:=created_value}"
echo "再次读取：$new_var"
# 输出：赋值后：created_value
#       再次读取：created_value

# ${name:?error_msg}：必填检查
# echo "${required_var:?错误：required_var 未设置}"
# Bash 会输出错误并退出（如果开启了 set -u）

# ${name:+alternative}：如果已定义，使用替代值
defined_var="I exist"
echo "${defined_var:+替代值}"
echo "${undefined_var_2:+替代值}"
# 输出：替代值
#       （空行）

# === 字符串操作 ===
text="Hello Ubuntu Linux"
echo "长度：${#text}"
# 输出：长度：18

echo "子串(6,6)：${text:6:6}"
# 输出：子串(6,6)：Ubuntu

# 模式删除
path="/usr/local/bin/script.sh"
echo "文件名：${path##*/}"        # 删除最长前缀（到最后一个 /）
echo "目录：${path%/*}"           # 删除最短后缀（从第一个 / 开始）
echo "去扩展名：${path%.sh}"     # 删除 .sh 后缀
echo "两重扩展名：${path%%.*}"   # 删除最长后缀（到第一个 .）
# 输出：
# 文件名：script.sh
# 目录：/usr/local/bin
# 去扩展名：/usr/local/bin/script
# 两重扩展名：/usr/local/bin/script

# 替换
sentence="The cat sat on the cat mat"
echo "替换第一个cat：${sentence/cat/dog}"
echo "替换所有cat：${sentence//cat/dog}"
# 输出：
# 替换第一个cat：The dog sat on the cat mat
# 替换所有cat：The dog sat on the dog mat

# === 命令替换 ===
today=$(date +%Y-%m-%d)
echo "今天是：$today"
file_count=$(ls /usr/bin | wc -l)
echo "文件数量：$file_count"
```

### 2.6 Bash 启动文件的加载顺序

这是本章最容易被忽略但对实际工作影响极大的知识点。同一个用户在同一台机器上运行 Bash，根据**调用方式**的不同，Bash 加载的配置文件完全不同。

```
+------------------------------------------------------------------+
|                Bash 启动文件加载顺序（三种调用方式）                    |
|                                                                  |
|  重要概念：                                                        |
|  - 登录 Shell（Login Shell）：需要用户名/密码验证或 su - 启动的 Shell |
|  - 交互式非登录 Shell（Interactive Non-Login Shell）：图形终端中打开   |
|  - 非交互式 Shell（Non-Interactive Shell）：执行脚本时启动的 Shell    |
|                                                                  |
|  ═══════════════════════════════════════════════════════════════  |
|  类型 1：登录 Shell（Login Shell）                                  |
|  ───────────────────────────────────────────────────────────────  |
|  触发方式：ssh user@host, su - user, 控制台登录, sudo -i            |
|                                                                  |
|  加载顺序：                                                        |
|  ① /etc/profile                   ← 系统级，所有用户共用              |
|  ② ~/.bash_profile                 ← 用户级（如果存在）              |
|     → 如果 ~/.bash_profile 不存在：尝试 ~/.bash_login                |
|     → 如果 ~/.bash_login 不存在：尝试 ~/.profile                     |
|  ───────────────────────────────────────────────────────────────  |
|  退出时：                                                          |
|  ③ ~/.bash_logout                 ← 退出登录 Shell 时执行            |
|                                                                  |
|  ═══════════════════════════════════════════════════════════════  |
|  类型 2：交互式非登录 Shell（Interactive Non-Login Shell）           |
|  ───────────────────────────────────────────────────────────────  |
|  触发方式：gnome-terminal 中打开的新标签页, bash 命令, su user        |
|                                                                  |
|  加载顺序：                                                        |
|  ① /etc/bash.bashrc               ← 系统级（Ubuntu 特有）          |
|  ② ~/.bashrc                      ← 用户级                         |
|  ───────────────────────────────────────────────────────────────  |
|  退出时：不执行 ~/.bash_logout                                      |
|                                                                  |
|  ═══════════════════════════════════════════════════════════════  |
|  类型 3：非交互式 Shell（Non-Interactive Shell）                     |
|  ───────────────────────────────────────────────────────────────  |
|  触发方式：bash script.sh, ./script.sh, bash -c "command"          |
|                                                                  |
|  加载顺序：                                                        |
|  BASH_ENV 环境变量指向的文件（如果设置了）                              |
|  通常：不加载任何配置文件！                                          |
|                                                                  |
|  常见陷阱：在 cron 任务中、SSH 远程执行命令时，~/.bashrc 不会被加载！   |
+------------------------------------------------------------------+
```

```bash
# 验证当前是哪种 Shell

# 方法1：检查 login_shell 选项
shopt -q login_shell && echo "登录 Shell (Login Shell)" || echo "非登录 Shell (Non-Login Shell)"

# 方法2：检查 $0（Shell 名称前有 - 表示登录 Shell）
echo "\$0 = $0"
# 登录 Shell：$0 = -bash  （注意前面的 -）
# 非登录 Shell：$0 = bash

# 方法3：检查交互性
[[ $- == *i* ]] && echo "交互式 Shell (Interactive)" || echo "非交互式 Shell (Non-Interactive)"

# 方法4：模拟不同场景
# 启动一个登录 Shell
bash -l -c 'echo "登录 Shell：\$0=$0"'
# 启动一个非登录交互式 Shell
bash -i -c 'echo "交互式非登录 Shell：\$0=$0; exit"'
# 启动非交互式 Shell（执行脚本）
bash -c 'echo "非交互式 Shell：\$0=$0"'
```

```bash
# 在 ~/.bashrc 开头添加标记，方便调试加载顺序
# （执行以下命令添加调试信息）

# 向 ~/.bashrc 开头添加加载时间戳（不影响现有功能）
# 注意：如果 ~/.bashrc 已有内容，以下操作会备份原文件
cp ~/.bashrc ~/.bashrc.backup 2>/dev/null

# 创建或修改 ~/.bashrc 的调试头
cat > /tmp/bashrc_header.txt << 'HEADER'
# === Bash 启动调试（可在理解后删除此行） ===
echo "[$(date '+%H:%M:%S')] ~/.bashrc 被加载（PID: $$）"
# === 调试标记结束 ===

HEADER

# 组合调试头和原文件
cat /tmp/bashrc_header.txt ~/.bashrc > /tmp/bashrc_new.txt 2>/dev/null
mv /tmp/bashrc_new.txt ~/.bashrc 2>/dev/null

# 测试：打开新的终端标签页（非登录 Shell），应该看到调试消息
# 或者使用 bash -l 启动登录 Shell 测试

# 清理（完成后执行）
# cp ~/.bashrc.backup ~/.bashrc
# rm -f /tmp/bashrc_header.txt
```

### 2.7 完整登录流程：从内核到 Shell 提示符

```
+------------------------------------------------------------------+
|                    完整的系统登录流程                                |
|                                                                  |
|  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   |
|  │  Kernel   │ →  │  init    │ →  │  getty   │ →  │  login   │   |
|  │ (内核)    │    │ (systemd)│    │ (tty管   │    │ (用户认  │   |
|  │           │    │          │    │  理程序)  │    │  证程序)  │   |
|  └──────────┘    └──────────┘    └──────────┘    └──────────┘   |
|       │               │               │               │         |
|       │ 启动内核       │ 作为 PID 1    │ 为每个终端       │ 验证用户  │
|       │ 挂载根文件系统  │ 管理系统服务  │ 启动 getty      │ 密码      │
|       │               │               │               │         │
|                                                      │         |
|                                                      ↓         |
|  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   |
|  │  提示符   │ ←  │ ~/.bashrc│ ←  │~/.profile│ ←  │/etc/     │   |
|  │  $        │    │ (交互式   │    │ (用户级   │    │profile   │   |
|  │           │    │  配置)    │    │  环境变量) │    │ (系统级   │   |
|  └──────────┘    └──────────┘    └──────────┘    └──────────┘   |
|                                                                  |
|  详细流程（以 SSH 登录为例）：                                       |
|                                                                  |
|  1. kernel 启动 systemd (PID 1)                                   |
|  2. systemd 启动 sshd 服务                                         |
|  3. 用户 ssh 连接 → sshd 接受连接                                   |
|  4. sshd 验证用户凭据                                               |
|  5. sshd fork() 子进程，设置 uid/gid                               |
|  6. 子进程 exec() /bin/bash -l（-l 表示登录 Shell）                 |
|  7. Bash 读取 /etc/profile                                         |
|     └─ 设置系统级环境变量（PATH, UMASK, 等）                         |
|     └─ 在 Ubuntu 中，/etc/profile 会 source /etc/bash.bashrc        |
|  8. Bash 查找用户级配置文件（按优先级）：                              |
|     └─ ~/.bash_profile → ~/.bash_login → ~/.profile                 |
|     └─ Ubuntu 默认的 ~/.profile 会 source ~/.bashrc                 |
|  9. Bash 显示提示符，等待用户输入                                    |
|                                                                  |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  Ubuntu 的典型配置关系：                                       │ |
|  │                                                              │ |
|  │  /etc/profile                                                │ |
|  │    ├── source /etc/bash.bashrc                                │ |
|  │    └── 设置 PATH, UMASK 等                                    │ |
|  │                                                              │ |
|  │  ~/.profile                                                  │ |
|  │    ├── 设置用户专属环境变量                                    │ |
|  │    └── source ~/.bashrc   ← 关键！这是登录 Shell 也加载        │ |
|  │                              ~/.bashrc 的原因                  │ |
|  │                                                              │ |
|  │  ~/.bashrc                                                   │ |
|  │    ├── 别名 (alias)                                          │ |
|  │    ├── 提示符 (PS1)                                          │ |
|  │    ├── 函数定义                                               │ |
|  │    └── 其他交互式配置                                         │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

```bash
# 查看系统中有哪些配置文件
echo "=== /etc/profile（系统级登录配置）==="
ls -la /etc/profile
echo ""
echo "=== /etc/bash.bashrc（系统级交互式配置）==="
ls -la /etc/bash.bashrc
echo ""
echo "=== 用户级配置文件 ==="
for f in ~/.bash_profile ~/.bash_login ~/.profile ~/.bashrc ~/.bash_logout; do
    if [ -f "$f" ]; then
        echo "存在：$f ($(wc -l < "$f" | tr -d ' ') 行)"
    else
        echo "不存在：$f"
    fi
done

# 查看 /etc/profile 的内容（精简版）
echo ""
echo "=== /etc/profile 的关键内容 ==="
grep -n 'PATH\|bash.bashrc\|profile' /etc/profile 2>/dev/null | head -20

# 查看 ~/.profile 如何加载 ~/.bashrc
echo ""
echo "=== ~/.profile 中的 source 关系 ==="
grep -n 'bashrc\|\. ' ~/.profile 2>/dev/null | head -10
```

```bash
# 实验：追踪登录 Shell 的完整加载链
# 创建临时脚本来追踪变量变化

cat > /tmp/trace_login_env.sh << 'TRACE_SCRIPT'
#!/bin/bash
echo "=== 登录 Shell 加载追踪 ==="
echo "加载前环境变量数量：$(env | wc -l)"
echo ""

# 模拟 /etc/profile 会做的事情
echo "第1步：/etc/profile（模拟）- 设置了 SYSTEM_VAR"
export SYSTEM_VAR="set by /etc/profile"
echo "当前 export 变量：$(env | grep SYSTEM_VAR)"

# 模拟 ~/.profile 会做的事情
echo ""
echo "第2步：~/.profile（模拟）- 设置了 USER_CUSTOM"
export USER_CUSTOM="set by ~/.profile"
echo "当前 export 变量：$(env | grep -E 'SYSTEM_VAR|USER_CUSTOM')"

# 模拟 ~/.bashrc 会做的事情
echo ""
echo "第3步：~/.bashrc（模拟）- 设置了 MY_ALIAS 和 PS1 风格"
export MY_ALIAS="set by ~/.bashrc"
echo "当前 export 变量：$(env | grep -E 'SYSTEM_VAR|USER_CUSTOM|MY_ALIAS')"

echo ""
echo "=== 最终环境汇总 ==="
echo "SYSTEM_VAR  = $SYSTEM_VAR"
echo "USER_CUSTOM = $USER_CUSTOM"
echo "MY_ALIAS    = $MY_ALIAS"
TRACE_SCRIPT

chmod +x /tmp/trace_login_env.sh
/tmp/trace_login_env.sh
rm -f /tmp/trace_login_env.sh
```

---

## 3. 命令详解

### 3.1 export -- 导出变量为环境变量

`export` 是 Shell 变量和环境变量之间的**桥梁**。它将 Shell 变量标记为环境变量，使其能被 fork()+exec() 创建的子进程继承。

```
+------------------------------------------------------------------+
|                    export 的工作原理                                |
|                                                                  |
|  不 export 的变量：                                                 |
|  ┌─────────────┐     fork()+exec()     ┌─────────────────────┐   |
|  │ 父 Shell     │                       │ 子进程               │   |
|  │ A=1 (哈希表) │ ────────────────────→ │ A 不可见！            │   |
|  │ B=2 (环境块) │ ────────────────────→ │ B=2 (从环境块继承)    │   |
|  │ C=3 (哈希表) │                       │ C 不可见！            │   |
|  └─────────────┘                       └─────────────────────┘   |
|                                                                  |
|  export 的作用：标记变量，使其出现在环境块中                            |
|  $ export A    →  将 A 从"仅哈希表"提升到"哈希表 + 环境块"            |
|  $ export C    →  将 C 从"仅哈希表"提升到"哈希表 + 环境块"            |
+------------------------------------------------------------------+
```

**export 命令参数表：**

| 选项 | 说明 |
|------|------|
| `-n` | 取消导出标记（将环境变量降级为普通 Shell 变量） |
| `-p` | 显示所有导出变量（默认行为，不带参数时） |
| `-f` | 导出函数（而非变量） |

```bash
# === export 基础用法 ===

# 方法1：先赋值，再 export
MY_VAR="hello"
export MY_VAR

# 方法2：一步到位（推荐）
export MY_VAR_2="world"

# 方法3：同时导出多个变量
export VAR_A="alpha" VAR_B="beta" VAR_C="gamma"

# === 验证导出效果 ===

# 查看当前 Shell 中所有 export 的变量
echo "=== export -p 输出前 10 行 ==="
export -p | head -10

# 在子进程中验证
bash -c 'echo "子进程中 MY_VAR=$MY_VAR, MY_VAR_2=$MY_VAR_2"'
# 输出：子进程中 MY_VAR=hello, MY_VAR_2=world

# === 取消导出（-n） ===
export -n MY_VAR
echo "取消导出后，在子进程中："
bash -c 'echo "MY_VAR=${MY_VAR:-未定义}"'
# 输出：MY_VAR=未定义

# 注意：MY_VAR 在当前 Shell 中仍然可用
echo "当前 Shell 中 MY_VAR=$MY_VAR"
# 输出：当前 Shell 中 MY_VAR=hello

# === export 的常见陷阱 ===
# 错误：在子 Shell 中 export 不影响父 Shell
(
    export SUB_EXPORTED="子Shell设置的"
    echo "子Shell中：$SUB_EXPORTED"
)
echo "父Shell中：${SUB_EXPORTED:-未定义}"
# 输出：
# 子Shell中：子Shell设置的
# 父Shell中：未定义

# === export -f：导出函数 ===
# Bash 特有功能，允许子 Shell 调用父 Shell 中定义的函数
function greet() {
    echo "Hello, ${1:-World}!"
}

# 导出函数
export -f greet

# 在子 Shell 中调用
bash -c 'greet "Ubuntu"'
# 输出：Hello, Ubuntu!

# 取消函数导出
export -fn greet
bash -c 'greet' 2>&1 || echo "函数不可用（符合预期）"
```

### 3.2 env -- 查看或修改环境变量并执行命令

`env` 有两个主要用途：(1) 查看当前环境变量；(2) 在修改后的环境中运行命令。

```
+------------------------------------------------------------------+
|                    env vs export vs set                            |
|                                                                  |
|  env：   查看环境变量（Environment Variables）                       |
|  export：将 Shell 变量标记为环境变量                                 |
|  set：   查看所有 Shell 变量（包括环境变量 + 普通变量 + 函数）          |
|                                                                  |
|  注意：                                                            |
|  - env 是一个外部命令（/usr/bin/env），它启动一个子进程来显示环境变量     |
|  - export 是 Shell 内置命令（builtin），在当前 Shell 中执行            |
|  - set 是 Shell 内置命令                                             |
+------------------------------------------------------------------+
```

**env 命令参数表：**

| 选项 | 说明 |
|------|------|
| `-i` 或 `--ignore-environment` | 以空环境启动命令（清除所有环境变量） |
| `-u NAME` 或 `--unset=NAME` | 从环境中移除指定变量 |
| `-0` 或 `--null` | 以 null 字符分隔输出行（而非换行） |
| `NAME=VALUE` | 在修改后的环境中执行命令 |

```bash
# === 基础用法：查看环境变量 ===

# 方法1：env
echo "=== env 输出前 10 行 ==="
env | head -10

# 方法2：printenv（更简洁）
echo ""
echo "=== printenv 输出前 10 行 ==="
printenv | head -10

# 比较 env 和 export -p 的区别
echo ""
echo "=== 变量数量对比 ==="
echo "env 显示：$(env | wc -l) 个变量"
echo "export -p 显示：$(export -p | grep -c 'declare -x') 个变量（约）"

# === 在修改的环境中运行命令 ===

# 临时设置环境变量执行命令（不修改当前 Shell 的变量）
env MY_TEMP="temporary value" bash -c 'echo "命令内: MY_TEMP=$MY_TEMP"'
echo "命令外: MY_TEMP=${MY_TEMP:-未定义}"
# 输出：
# 命令内: MY_TEMP=temporary value
# 命令外: MY_TEMP=未定义

# === 实用场景：脚本 shebang ===
# /usr/bin/env bash  而不是  /bin/bash
# env 在 PATH 中查找 bash，提高了脚本的可移植性
echo "#!/usr/bin/env bash" > /tmp/env_demo.sh
echo 'echo "Bash 路径: $(which bash)"' >> /tmp/env_demo.sh
echo 'echo "这种 shebang 方式在 bash 路径不是 /bin/bash 的系统上也能工作"' >> /tmp/env_demo.sh
chmod +x /tmp/env_demo.sh
/tmp/env_demo.sh
rm -f /tmp/env_demo.sh

# === 以空环境启动（-i） ===
echo ""
echo "=== 空环境启动对比 ==="
echo "正常环境变量数量：$(env | wc -l)"
echo "空环境变量数量：$(env -i bash -c 'env | wc -l')"
# 空环境仍然有极少数变量（如 PWD），这是由 Shell 自身设置的

# === 移除特定变量（-u） ===
echo ""
echo "=== 移除 PATH 变量 ==="
env -u PATH bash -c 'echo "PATH=${PATH:-已移除}"; which ls' 2>&1 || true
# 输出：PATH=已移除
#       which: no ls in ...（因为 PATH 没了，找不到命令）
```

### 3.3 set -- 显示所有 Shell 变量和函数

`set` 是 Bash 的内置命令，它有两个截然不同的功能：(1) 不带参数时显示所有 Shell 变量和函数；(2) 带选项时设置 Shell 行为。

```
+------------------------------------------------------------------+
|                    env vs set 的对比                                |
|                                                                  |
|  输出内容对比：                                                     |
|                                                                  |
|  env 输出（~30-50 个变量）：                                        |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  PATH=/usr/local/bin:/usr/bin:/bin                           │ |
|  │  HOME=/home/user                                             │ |
|  │  USER=user                                                   │ |
|  │  ...（仅包含被 export 的变量）                                  │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                                                                  |
|  set 输出（~100-200 个变量 + 函数）：                                |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │  BASH=/bin/bash               ← Shell 自身变量                 │ |
|  │  BASH_VERSION='5.2.21(1)-...'                                 │ |
|  │  HISTSIZE=1000                                                │ |
|  │  IFS=$' \t\n'                                                 │ |
|  │  PS1='\u@\h:\w\$ '                                           │ |
|  │  ...（包含所有 Shell 变量 + 所有函数定义）                       │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

**set 常用选项表：**

| 选项 | 说明 |
|------|------|
| `set` (无参数) | 显示所有 Shell 变量和函数（按字母排序） |
| `set -u` | 引用未定义变量时报错（推荐在脚本中使用） |
| `set -e` | 任何命令失败（退出码非0）时立即退出 |
| `set -x` | 执行每条命令前打印命令本身（调试用） |
| `set -o pipefail` | 管道中任一命令失败则管道视为失败 |
| `set +x` | 关闭 -x（+ 表示关闭选项） |

```bash
# === 基础用法：查看所有变量 ===
echo "=== set 输出行数 ==="
echo "set 共 $(set | wc -l) 行"
echo ""
echo "=== set 输出前 20 行 ==="
set | head -20

# === 对比：env 和 set ===
echo ""
echo "env 有 $(env | wc -l) 行（仅环境变量）"
echo "set 有 $(set | wc -l) 行（所有 Shell 变量和函数）"

# === 过滤查找特定变量 ===
echo ""
echo "=== 查找 BASH 相关变量 ==="
set | grep ^BASH | head -10

echo ""
echo "=== 查找 HIST 相关变量 ==="
set | grep ^HIST

# === set -x 调试模式 ===
echo ""
echo "=== set -x 调试模式演示 ==="
set -x
name="debug-test"
count=$((1 + 2 + 3))
echo "name=$name, count=$count"
set +x
echo "（调试模式已关闭）"

# === set -u 未定义变量报错 ===
echo ""
echo "=== set -u 演示 ==="
# 保存原状态
if set -o | grep -q 'nounset.*on'; then
    saved_nounset="on"
else
    saved_nounset="off"
fi

set -u
# echo "未定义变量：$undefined_variable"   # 取消注释会报错
echo "\${undefined_variable:-默认值} = ${undefined_variable:-默认值}"
# 恢复
[[ "$saved_nounset" == "off" ]] && set +u

# === set -e 遇到错误即退出 ===
echo ""
echo "=== set -e 演示（在子 Shell 中执行） ==="
bash -c '
set -e
echo "这条会执行"
false
echo "这条不会执行（因为上一条失败了）"
' 2>/dev/null
echo "父 Shell 继续执行（因为有子 Shell 隔离）"
```

### 3.4 unset -- 删除变量或函数

`unset` 用于删除 Shell 变量或函数。删除后变量彻底消失，无法再读取。对于只读变量（readonly），`unset` 会失败。

**unset 命令参数表：**

| 选项 | 说明 |
|------|------|
| `-v` | 删除变量（默认行为） |
| `-f` | 删除函数 |
| `-n` | 删除名称引用（nameref），而非引用指向的变量 |

```bash
# === 基础用法 ===

# 创建并删除变量
temp_var="I will be deleted"
echo "删除前：$temp_var"
unset temp_var
echo "删除后：${temp_var:-已不存在}"

# === unset 环境变量 ===
export MY_EXPORTED="exported value"
echo "子进程中可以看到："
bash -c 'echo "MY_EXPORTED=${MY_EXPORTED:-不存在}"'

# 删除环境变量
unset MY_EXPORTED
echo ""
echo "删除后，子进程中："
bash -c 'echo "MY_EXPORTED=${MY_EXPORTED:-不存在}"'

# === unset 只读变量会失败 ===
readonly READONLY_VAR="cannot be deleted"
echo ""
echo "尝试 unset 只读变量："
unset READONLY_VAR 2>&1 || echo "删除失败（符合预期，只读变量不可删除）"

# === unset 多个变量 ===
a=1 b=2 c=3
unset a b c
echo "a=${a:-无} b=${b:-无} c=${c:-无}"

# === unset -f：删除函数 ===
function my_temp_func() {
    echo "我是临时函数"
}
my_temp_func
unset -f my_temp_func
# my_temp_func  # 取消注释会报错：command not found
echo "函数已删除"

# === unset -n：删除 nameref ===
original="original value"
declare -n ref=original
echo "通过 nameref 访问：$ref"
unset -n ref
# ref 本身被删除，original 不受影响
echo "original 仍然存在：$original"
echo "ref 已删除：${ref:-不存在}"
```

### 3.5 printenv -- 精准打印环境变量

`printenv` 是 `/usr/bin/printenv`（外部命令），专门用于查看环境变量。与 `env` 不同，`printenv` 通常用于查看**单个**环境变量的值。

```bash
# === 基础用法 ===

# 查看所有环境变量
echo "=== printenv 所有环境变量 ==="
printenv | head -10

# 查看单个环境变量（不需要 $ 前缀！）
echo ""
echo "HOME = $(printenv HOME)"
echo "USER = $(printenv USER)"
echo "SHELL = $(printenv SHELL)"
echo "PATH 的前80个字符：$(printenv PATH | head -c 80)"

# === printenv vs echo $VAR 的区别 ===
echo ""
echo "=== printenv vs echo ==="

# 对于已定义的环境变量，两者等价
echo "echo \$HOME = $HOME"
echo "printenv HOME = $(printenv HOME)"

# 对于未定义的变量，行为不同
echo "echo \$UNDEFINED = ${UNDEFINED:-空}"
printenv UNDEFINED 2>&1 || echo "printenv UNDEFINED 以非0退出码退出"

# === 实用技巧：检查某个变量是否被 export ===
check_exported() {
    local var_name="$1"
    if printenv "$var_name" > /dev/null 2>&1; then
        echo "✓ $var_name 是环境变量，值为：$(printenv $var_name)"
    else
        echo "✗ $var_name 不是环境变量，或未定义"
    fi
}

export MY_CHECK="test"
NOT_EXPORTED="test2"
check_exported MY_CHECK
check_exported NOT_EXPORTED
check_exported HOME
unset MY_CHECK NOT_EXPORTED
```

### 3.6 declare -- 变量类型与属性的总开关

`declare` 是 Bash 内置的最强大的变量管理命令。它不仅可以声明变量的类型，还能设置多种属性。`typeset` 是 `declare` 的同义词（兼容 ksh 的写法）。

```
+------------------------------------------------------------------+
|                    declare 的类型属性全景                            |
|                                                                  |
|  属性   选项    说明                         示例                    |
|  ───────────────────────────────────────────────────────────────  |
|  整数   -i    变量只能存储整数值            declare -i count=10    |
|                     算术表达式自动求值       count="5+3" → 8       |
|  数组   -a    索引数组（整数下标）           declare -a arr[0]="a" |
|  关联   -A    关联数组（字符串下标）          declare -A map["key"]= |
|  只读   -r    创建只读常量                  declare -r PI=3.14    |
|  导出   -x    等价于 export                declare -x PATH        |
|  小写   -l    自动转换为小写                declare -l name        |
|  大写   -u    自动转换为大写                declare -u CODE        |
|  引用   -n    名称引用（nameref）           declare -n ref=other  |
|  跟踪   -t    跟踪函数（用于调试）           declare -t func       |
|  打印   -p    打印变量的声明语句             declare -p VAR        |
+------------------------------------------------------------------+
```

```bash
# === declare -i：整数变量 ===

# 普通变量：值就是字符串
normal_var=10
normal_var="$normal_var + 5"
echo "普通变量: normal_var = $normal_var"
# 输出：普通变量: normal_var = 10 + 5  （字符串拼接，不是计算）

# declare -i：自动求值
declare -i int_var=10
int_var="int_var + 5"
echo "整数变量: int_var = $int_var"
# 输出：整数变量: int_var = 15  （自动计算）

# 更多整数运算
declare -i result
result=10*5
echo "10 * 5 = $result"
result=2**10
echo "2^10 = $result"
result=100/3
echo "100 / 3 = $result（整数除法，截断）"
# 尝试赋非数值 → 结果为 0
int_var="hello"
echo "给整数变量赋字符串: int_var = $int_var"
# 输出：整数变量: int_var = 0

# === declare -a：索引数组 ===

declare -a fruits
fruits[0]="苹果"
fruits[1]="香蕉"
fruits[2]="橙子"

echo "fruits 数组："
echo "  第1个: ${fruits[0]}"
echo "  第2个: ${fruits[1]}"
echo "  第3个: ${fruits[2]}"
echo "  所有元素: ${fruits[@]}"
echo "  索引列表: ${!fruits[@]}"
echo "  数组长度: ${#fruits[@]}"

# 可以省略 declare -a（Bash 默认行为），但声明更规范
colors=(red green blue)
echo "colors 数组: ${colors[@]}"

# === declare -A：关联数组 ===
# 关联数组必须显式声明！

declare -A user_info
user_info[name]="张三"
user_info[age]=25
user_info[city]="深圳"

echo ""
echo "user_info 关联数组："
echo "  姓名: ${user_info[name]}"
echo "  年龄: ${user_info[age]}"
echo "  城市: ${user_info[city]}"
echo "  所有键: ${!user_info[@]}"
echo "  所有值: ${user_info[@]}"

# 遍历关联数组
echo ""
echo "遍历 user_info："
for key in "${!user_info[@]}"; do
    echo "  $key → ${user_info[$key]}"
done

# === declare -r：只读变量 ===

declare -r VERSION="1.0.0"
declare -r MAX_RETRY=3
echo "VERSION=$VERSION, MAX_RETRY=$MAX_RETRY"

# 尝试修改 → 失败
# VERSION="2.0.0"   # 会报错：VERSION: readonly variable

# declare -r 不能和 +r 在同一个命令中用于修改
# 但是可以在子 Shell 中测试
bash -c 'declare -r test_r="readonly"; test_r="change"' 2>&1 || echo "修改只读变量失败（符合预期）"

# === declare -x：导出变量 ===

# 等价于 export
declare -x MY_EXPORT_VAR="exported via declare"
bash -c 'echo "子进程: MY_EXPORT_VAR=$MY_EXPORT_VAR"'

# 打印当前导出状态
echo ""
echo "MY_EXPORT_VAR 的声明："
declare -p MY_EXPORT_VAR
# 输出：declare -x MY_EXPORT_VAR="exported via declare"
#       -x 表示已导出

# === declare -l 和 -u：大小写转换 ===

declare -l lowercase_var="Hello WORLD! 你好"
declare -u uppercase_var="Hello WORLD! 你好"

echo ""
echo "declare -l: $lowercase_var"
echo "declare -u: $uppercase_var"
# 输出：
# declare -l: hello world! 你好
# declare -u: HELLO WORLD! 你好

# 注意：只影响字母（ASCII 和部分 Unicode），不影响中文

# 动态变化：每次赋值都会自动转换
lowercase_var="NEW VALUE"
uppercase_var="new value"
echo "重新赋值后 -l: $lowercase_var"
echo "重新赋值后 -u: $uppercase_var"

# === declare -n：名称引用（nameref） ===

original_value="我是原始值"
declare -n alias_name=original_value

echo ""
echo "通过 nameref 读取: $alias_name"
echo "通过原名读取: $original_value"

# 通过 nameref 修改 → 原始变量也被修改！
alias_name="通过引用修改的值"
echo "通过原名读取（修改后）: $original_value"
# 输出：通过引用修改的值

# 典型用途：在函数中通过引用传递变量
function increment() {
    # $1 是变量名，-n 使其成为引用
    declare -n ref="$1"
    ref=$((ref + 1))
}

counter=10
echo ""
echo "递增前: counter=$counter"
increment counter
echo "递增后: counter=$counter"

increment counter
echo "再次递增: counter=$counter"

# === declare -p：打印变量声明 ===

echo ""
echo "=== declare -p 示例 ==="
my_normal="字符串"
declare -i my_int=42
declare -a my_arr=("a" "b" "c")

declare -p my_normal
declare -p my_int
declare -p my_arr
# 输出：
# declare -- my_normal="字符串"     （-- 表示无特殊属性）
# declare -i my_int="42"
# declare -a my_arr=([0]="a" [1]="b" [2]="c")
```

### 3.7 readonly -- 创建只读（常量）变量

`readonly` 是 `declare -r` 的简洁替代方案。一旦设置为只读，变量值在当前 Shell 生命周期内无法修改，也无法用 `unset` 删除。

```bash
# === readonly 基础用法 ===

# 方法1：先赋值再声明只读
PI=3.14159
readonly PI
echo "PI = $PI"

# 方法2：一行完成
readonly GOLDEN_RATIO=1.618

# === 尝试修改 → 失败 ===
echo ""
echo "尝试修改只读变量："
# PI=3.14  # 会报错：PI: readonly variable
echo "（修改只读变量会导致错误）"

# 甚至在子 Shell 中也无法修改父 Shell 的只读变量
# 但子 Shell 可以创建自己的同名只读变量
bash -c 'readonly PI=3.14; echo "子Shell中: PI=$PI"'
echo "父Shell中: PI=$PI（未变）"

# === readonly 列出所有只读变量 ===
echo ""
echo "=== 当前只读变量（前10个）==="
readonly -p | head -10

# === readonly -f：声明只读函数 ===
# 函数也可以设置为只读，防止被重新定义
function critical_func() {
    echo "关键函数，不可被覆盖"
}
readonly -f critical_func
echo ""
echo "声明了只读函数：critical_func"

# === readonly 的约束 ===
# 1. 只读变量不能被 unset
echo ""
echo "尝试 unset 只读变量："
unset PI 2>&1 || echo "unset 失败（符合预期）"

# 2. 只读变量不能在当前 Shell 中被重新导出
# （但可以通过 declare -p 查看其属性）

# 3. 只读变量会传递给子进程
bash -c 'echo "子进程中的 PI=$PI"'
```

### 3.8 source 与 . -- 在当前 Shell 中执行脚本

`source` 命令（简写为 `.`）是理解 Bash 配置文件加载机制的关键。它与 `bash script.sh` 的根本区别在于**执行位置**。

```
+------------------------------------------------------------------+
|                    source/./ vs bash 的根本区别                      |
|                                                                  |
|  bash script.sh（在子 Shell 中执行）：                                |
|  ┌──────────────┐                       ┌──────────────────────┐  |
|  │ 父 Shell      │     fork()+exec()     │ 子 Shell (新进程)     │  |
|  │              │ ────────────────────→ │                      │  |
|  │ 变量: A=1    │                       │ 变量: A=1 (继承)      │  |
|  │              │                       │ 执行脚本...           │  |
|  │              │                       │ 脚本中 A=2           │  |
|  │              │ ←── 子Shell 退出 ────  │ 子Shell 销毁          │  |
|  │ 变量: A=1 ←  │                       │                      │  |
|  │ (未变！)     │                       │                      │  |
|  └──────────────┘                       └──────────────────────┘  |
|                                                                  |
|  source script.sh / . script.sh（在当前 Shell 中执行）：              |
|  ┌──────────────────────────────────────────────────────────────┐  |
|  │ 当前 Shell (同一个进程)                                        │  |
|  │                                                              │  |
|  │ 变量: A=1                                                    │  |
|  │ ↓                                                            │  |
|  │ 执行脚本中的每一行...                                           │  |
|  │   export PATH=...     ← 直接修改当前 Shell 的变量               │  |
|  │   alias ll='ls -la'   ← 别名在当前 Shell 中生效                │  |
|  │   A=2                 ← 直接修改！                             │  |
|  │ ↓                                                            │  |
|  │ 变量: A=2 ←（修改生效！）                                       │  |
|  └──────────────────────────────────────────────────────────────┘  |
+------------------------------------------------------------------+
```

```bash
# === 演示：bash vs source 的区别 ===

# 创建测试脚本
cat > /tmp/test_scope.sh << 'SCOPE_SCRIPT'
#!/bin/bash
echo "脚本中：修改前 VAR=$VAR"
VAR="modified in script"
echo "脚本中：修改后 VAR=$VAR"
SCOPE_SCRIPT

# === 方式1：用 bash 执行（子Shell） ===
VAR="original value"
echo "=== bash 方式（子Shell）==="
echo "父Shell 执行前：VAR=$VAR"
bash /tmp/test_scope.sh
echo "父Shell 执行后：VAR=$VAR（未变！）"

# === 方式2：用 source 执行（当前Shell） ===
echo ""
echo "=== source 方式（当前Shell）==="
echo "父Shell 执行前：VAR=$VAR"
source /tmp/test_scope.sh
echo "父Shell 执行后：VAR=$VAR（被修改了！）"

# === 方式3：用 . 执行（等价于 source） ===
echo ""
VAR="value before dot"
echo "=== . 方式（也是当前Shell）==="
. /tmp/test_scope.sh
echo "父Shell 执行后：VAR=$VAR（也被修改了！）"

# 清理
rm -f /tmp/test_scope.sh

# === source 的典型用途 ===

echo ""
echo "=== source 的实际用途 ==="

# 1. 重新加载配置文件
echo "1. 修改 ~/.bashrc 后重新加载："
echo "   source ~/.bashrc"

# 2. 加载函数库
echo "2. 加载函数定义文件："
cat > /tmp/mylib.sh << 'LIB'
# 定义工具函数
function uppercase() {
    echo "${1^^}"
}
function lowercase() {
    echo "${1,,}"
}
LIB

source /tmp/mylib.sh
echo "   uppercase hello → $(uppercase hello)"
echo "   lowercase WORLD → $(lowercase WORLD)"

# 3. 加载环境变量配置
echo "3. 加载环境配置："
cat > /tmp/env_config.sh << 'ENV'
export APP_NAME="MyApp"
export APP_PORT=8080
export APP_DEBUG="true"
echo "   已加载应用配置"
ENV

source /tmp/env_config.sh
echo "   APP_NAME=$APP_NAME, APP_PORT=$APP_PORT"

# 清理
rm -f /tmp/mylib.sh /tmp/env_config.sh
unset VAR APP_NAME APP_PORT APP_DEBUG uppercase lowercase

# === source 的错误处理 ===
echo ""
echo "=== source 的注意事项 ==="

# source 不存在的文件 → 报错
source /tmp/nonexistent_file.sh 2>&1 || echo "source 不存在的文件会报错"

# source 的脚本如果有 exit → 会退出当前 Shell！
# 这就是为什么 .bashrc 不应该包含 exit 命令
# 演示（在子 Shell 中，安全）
bash -c 'echo "测试脚本内容：echo hello; exit 0"; echo "safe"' 2>&1

echo ""
echo "提示：source 脚本中如果有 'exit'，当前终端会关闭！"
echo "      这就是配置文件中通常不用 exit 的原因。"
```

### 3.9 启动文件详解

本节深入分析每个启动文件的内容和角色。

#### 3.9.1 /etc/profile -- 系统级登录配置

```bash
# === /etc/profile 分析 ===

echo "=== /etc/profile 的内容 ==="
# 查看实际内容（Ubuntu 24.04 默认）
cat /etc/profile 2>/dev/null || echo "/etc/profile 不存在或不可读"

echo ""
echo "=== /etc/profile 的关键逻辑 ==="
echo "/etc/profile 通常做以下事情："
echo "  1. 设置 PATH：追加 /usr/local/sbin, /usr/sbin 等"
echo "  2. 设置 UMASK：文件默认权限掩码"
echo "  3. 调用 /etc/bash.bashrc（在 Ubuntu 中）"
echo "  4. 调用 /etc/profile.d/*.sh 中的所有脚本"

# 查看 /etc/profile.d/ 目录
echo ""
echo "=== /etc/profile.d/ 目录 ==="
ls -la /etc/profile.d/ 2>/dev/null | head -20
```

#### 3.9.2 ~/.profile -- 用户级登录配置

```bash
# === ~/.profile 分析 ===

echo "=== ~/.profile 的内容 ==="
if [ -f ~/.profile ]; then
    cat ~/.profile 2>/dev/null
else
    echo "~/.profile 不存在"
fi

echo ""
echo "Ubuntu 默认 ~/.profile 通常包含："
echo "  1. 将 ~/.local/bin 加入 PATH（如果存在）"
echo "  2. source ~/.bashrc（关键！这让登录 Shell 也加载 bashrc）"
echo "  3. 设置用户特定的环境变量"
```

#### 3.9.3 ~/.bashrc -- 交互式 Shell 配置

```bash
# === ~/.bashrc 分析 ===

echo "=== ~/.bashrc 的关键部分 ==="
if [ -f ~/.bashrc ]; then
    echo "~/.bashrc 行数：$(wc -l < ~/.bashrc | tr -d ' ')"
    echo ""
    echo "前 30 行："
    head -30 ~/.bashrc 2>/dev/null
else
    echo "~/.bashrc 不存在"
fi

echo ""
echo "Ubuntu 默认 ~/.bashrc 通常包含："
echo "  1. 颜色化支持（color_prompt）"
echo "  2. 别名定义（alias ll='ls -alF' 等）"
echo "  3. 命令补全配置（bash_completion）"
echo "  4. HISTSIZE 和 HISTFILESIZE"
echo "  5. 函数定义"
echo "  6. 提示符设置（PS1）"
```

#### 3.9.4 ~/.bash_logout -- 退出时执行

```bash
# === ~/.bash_logout ===

echo "=== ~/.bash_logout 的内容 ==="
if [ -f ~/.bash_logout ]; then
    cat ~/.bash_logout 2>/dev/null
else
    echo "~/.bash_logout 不存在"
fi

echo ""
echo "~/.bash_logout 只在退出登录 Shell 时执行"
echo "常见用途："
echo "  1. 清理临时文件"
echo "  2. 清屏（clear）"
echo "  3. 记录登出时间"
echo ""
echo "注意：退出非登录 Shell（如终端标签页）时不会执行此文件"
```

#### 3.9.5 综合实验：验证加载顺序

```bash
# === 综合实验：在文件中添加追踪标记 ===

# 为了验证加载顺序，在每个配置文件的末尾添加临时追踪
# 此实验安全：只添加追踪行，不修改原有内容

echo "=== 启动文件加载验证实验 ==="
echo "向配置文件末尾添加临时追踪标记..."

# 备份
for f in ~/.profile ~/.bashrc /etc/bash.bashrc; do
    if [ -f "$f" ] && [ ! -f "${f}.lesson22backup" ]; then
        sudo cp "$f" "${f}.lesson22backup" 2>/dev/null || cp "$f" "${f}.lesson22backup" 2>/dev/null
    fi
done

# 添加追踪标记
echo '# [课程22实验] 加载追踪' | sudo tee -a /etc/bash.bashrc 2>/dev/null
echo 'echo "[TRACE] /etc/bash.bashrc 已被加载 (PID: $$)"' | sudo tee -a /etc/bash.bashrc 2>/dev/null

echo '# [课程22实验] 加载追踪' >> ~/.profile 2>/dev/null
echo 'echo "[TRACE] ~/.profile 已被加载 (PID: $$)"' >> ~/.profile 2>/dev/null

echo '# [课程22实验] 加载追踪' >> ~/.bashrc 2>/dev/null
echo 'echo "[TRACE] ~/.bashrc 已被加载 (PID: $$)"' >> ~/.bashrc 2>/dev/null

echo ""
echo "追踪标记已添加。测试方法："
echo "  1. 打开新的终端标签页（非登录 Shell）："
echo "     应该看到 ~/.bashrc 的追踪，但没有 ~/.profile 的追踪"
echo ""
echo "  2. 执行 bash -l（登录 Shell）："
echo "     应该按顺序看到 /etc/bash.bashrc → ~/.profile → ~/.bashrc"
echo ""
echo "=== 现在在当前 Shell 中测试 source ~/.bashrc ==="
echo "（只会触发 ~/.bashrc 的追踪）"

# 立即在当前 Shell 中验证
# 注意：source ~/.profile 会触发 ~/.bashrc 的追踪
#       source ~/.bashrc 只会触发自身的追踪

# 清理说明
echo ""
echo "清理方法（实验完成后执行）："
echo "  sudo mv /etc/bash.bashrc.lesson22backup /etc/bash.bashrc  # (如果权限够)"
echo "  mv ~/.profile.lesson22backup ~/.profile   # (如果原文件存在)"
echo "  mv ~/.bashrc.lesson22backup ~/.bashrc     # (如果原文件存在)"
# 注意：上面的还原操作需要手动执行，这里只做提示
```

### 3.10 重要环境变量详解

本节深入讲解每个重要环境变量的含义、用法和常见配置。

#### 3.10.1 PATH -- 可执行文件搜索路径

```
+------------------------------------------------------------------+
|                    PATH 的工作机制                                  |
|                                                                  |
|  当你在终端输入 "ls" 时：                                           |
|                                                                  |
|  $ ls                                                             |
|    ↓                                                              |
|  Shell 在 PATH 的每个目录中依次查找名为 "ls" 的可执行文件               |
|    ↓                                                              |
|  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin |
|    ↓         ↓             ↓        ↓       ↓        ↓           |
|  [查1]      [查2]         [查3]   [查4]    [查5]   [查6]           |
|    ↓                                                              |
|  在 /usr/bin/ls 找到 → 执行它                                       |
|                                                                  |
|  关键规则：                                                        |
|  1. 查找顺序 = PATH 中目录的出现顺序（从左到右）                       |
|  2. 找到第一个匹配的就停止（不做全局搜索）                            |
|  3. 当前目录 . 如果不在 PATH 中，Shell 不会在当前目录搜索！            |
|     → 执行当前目录的程序要用 ./program                                |
|  4. 空目录（连续冒号 :: 或开头:结尾:）代表当前目录，但极不推荐          |
+------------------------------------------------------------------+
```

```bash
# === PATH 基础操作 ===

echo "=== 当前 PATH ==="
echo "$PATH" | tr ':' '\n' | nl

# === 临时追加 PATH ===
echo ""
echo "=== 临时追加 PATH ==="
echo "追加前：which myapp → $(which myapp 2>&1 || echo '未找到')"

# 创建演示用的"自定义命令"
mkdir -p ~/my-custom-bin
cat > ~/my-custom-bin/myapp << 'MYAPP'
#!/bin/bash
echo "这是我的自定义应用！参数: $@"
MYAPP
chmod +x ~/my-custom-bin/myapp

# 临时追加到 PATH
export PATH="$HOME/my-custom-bin:$PATH"
echo "追加后：which myapp → $(which myapp)"
echo "执行 myapp："
myapp hello world

# === PATH 的顺序很重要！ ===
echo ""
echo "=== PATH 顺序演示 ==="
echo "场景：你安装了两个版本的 python"
echo "PATH=/usr/local/bin/python3.12:/usr/bin/python3.10"
echo "如果 /usr/local/bin 在前面 → 执行 python3.12"
echo "如果 /usr/bin 在前面 → 执行 python3.10"

# 模拟
mkdir -p /tmp/path-test/dir1 /tmp/path-test/dir2
echo '#!/bin/bash
echo "我是 dir1 中的程序（旧版本）"
' > /tmp/path-test/dir1/mytool
echo '#!/bin/bash
echo "我是 dir2 中的程序（新版本）"
' > /tmp/path-test/dir2/mytool
chmod +x /tmp/path-test/dir1/mytool /tmp/path-test/dir2/mytool

echo "PATH 中 dir1 在前："
PATH=/tmp/path-test/dir1:/tmp/path-test/dir2:$PATH mytool

echo "PATH 中 dir2 在前："
PATH=/tmp/path-test/dir2:/tmp/path-test/dir1:$PATH mytool

# 清理
rm -rf /tmp/path-test ~/my-custom-bin

# === PATH 最佳实践 ===
echo ""
echo "=== PATH 最佳实践 ==="
echo "1. 用 export PATH=\"...:\$PATH\" 追加（保留原有路径）"
echo "2. 不要导出包含空格的 PATH 值"
echo "3. 当前目录 . 不要加入 PATH（安全原因）"
echo "4. 在 ~/.profile 而非 ~/.bashrc 中修改 PATH"
echo "5. 使用绝对路径，不要用 ~ （Bash 有时展开不一致）"
```

#### 3.10.2 HOME、USER、SHELL -- 用户身份三件套

```bash
# === 用户身份变量 ===

echo "HOME  = $HOME       # 当前用户的家目录"
echo "USER  = $USER        # 当前用户名"
echo "SHELL = $SHELL       # 当前用户默认 Shell"
echo "LOGNAME = ${LOGNAME:-未设置}  # 登录用户名（初始登录时的用户）"
echo "UID   = ${UID:-未设置}"

echo ""
echo "=== HOME 与 ~ 的关系 ==="
echo "~ 展开为 HOME 的值："
echo "  ~ → $HOME"
echo "  ~/Documents → $HOME/Documents"
echo "  ~root → /root（root 用户的家目录）"
echo "  ~nobody → /nonexistent（nobody 用户的家目录）"

echo ""
echo "=== USER vs LOGNAME ==="
echo "USER: 可能因 su 而改变"
echo "LOGNAME: 始终保持初始登录用户名（不变）"
echo "当前值：USER=$USER, LOGNAME=${LOGNAME:-未设置}"

echo ""
echo "=== SHELL vs 当前运行的 Shell ==="
echo "SHELL 变量：$SHELL（用户配置文件中设置的默认 Shell）"
echo "当前 PID $$ 的 Shell：$(readlink /proc/$$/exe)"
# 执行 bash -c 时，SHELL 可能仍然是用户的默认 Shell
```

#### 3.10.3 LANG 与语言环境变量

```bash
# === 语言环境变量 ===

echo "LANG     = ${LANG:-未设置}"
echo "LC_ALL   = ${LC_ALL:-未设置（如果设置会覆盖所有其他 LC_* 变量）}"
echo "LANGUAGE = ${LANGUAGE:-未设置}"

echo ""
echo "=== 查看所有语言环境变量 ==="
locale

echo ""
echo "=== locale 变量的优先级 ==="
echo "LC_ALL > LC_* > LANG"
echo ""
echo "示例："
echo "  即使 LANG=zh_CN.UTF-8"
echo "  如果设置 LC_TIME=en_US.UTF-8"
echo "  那么时间显示使用英文格式，其他类别使用中文格式"
```

#### 3.10.4 PS1 -- 交互式提示符

```bash
# === PS1 提示符 ===

echo "当前 PS1 = $(declare -p PS1 2>/dev/null)"

echo ""
echo "=== PS1 常用转义序列 ==="
cat << 'PS1TABLE'
| 序列 | 含义               | 序列 | 含义             |
|------|-------------------|------|-----------------|
| \u   | 用户名             | \h   | 主机名（短）      |
| \H   | 主机名（全）        | \w   | 当前工作目录（全） |
| \W   | 当前目录（仅末段）  | \$   | #(root)或$(普通) |
| \t   | 24小时时间         | \T   | 12小时时间        |
| \d   | 日期               | \n   | 换行              |
| \!   | 历史编号           | \#   | 命令编号          |
PS1TABLE

echo ""
echo "=== 常见 PS1 范例 ==="
echo 'PS1="\u@\h:\w\$ "'     '     → '  "显示：user@host:~$"
echo 'PS1="[\t] \u@\h \W\$ "' '    → '  "显示：[14:30:25] user@host ~$"
echo 'PS1="\[\e[32m\]\u@\h\[\e[0m\]:\w\$ "' ' → 绿色用户名'

echo ""
echo "=== 临时修改PS1（不影响配置文件）==="
OLD_PS1="$PS1"
PS1="[实验模式] \u@\W\$ "
echo "已临时修改PS1，注意观察提示符变化"
echo "（下一行命令后恢复）"
PS1="$OLD_PS1"
echo "PS1 已恢复"
```

#### 3.10.5 LD_LIBRARY_PATH -- 动态库搜索路径

```bash
# === LD_LIBRARY_PATH ===

echo "LD_LIBRARY_PATH = ${LD_LIBRARY_PATH:-未设置}"

echo ""
echo "=== 动态库搜索顺序 ==="
echo "1. LD_LIBRARY_PATH 中的目录（环境变量）"
echo "2. /etc/ld.so.cache 缓存中记录的目录"
echo "3. /lib 和 /usr/lib（默认系统库目录）"
echo "4. /etc/ld.so.conf 中配置的目录"

echo ""
echo "=== 使用场景与注意事项 ==="
echo "典型场景：安装非系统路径的自定义共享库"
echo "  例：export LD_LIBRARY_PATH=/opt/myapp/lib:\$LD_LIBRARY_PATH"
echo ""
echo "注意：此变量通常为空，不推荐在系统级配置中全局设置"
echo "      仅在需要时临时设置，或仅在启动特定程序的脚本中设置"
```

#### 3.10.6 EDITOR 与 PAGER -- 默认编辑器与分页器

```bash
# === EDITOR 与 VISUAL ===

echo "EDITOR = ${EDITOR:-未设置}"
echo "VISUAL = ${VISUAL:-未设置}"
echo "PAGER  = ${PAGER:-未设置}"

echo ""
echo "=== EDITOR vs VISUAL ==="
echo "VISUAL: 全屏编辑器（如 vim, emacs, nano）"
echo "EDITOR: 行编辑器（如 vi, ed）或与 VISUAL 相同的编辑器"
echo "现代惯例：两者通常设置为同一个编辑器"
echo ""
echo "哪些命令使用这些变量？"
echo "  - git commit（打开编辑器写提交信息）"
echo "  - crontab -e（编辑定时任务）"
echo "  - sudo -e / sudoedit（安全编辑文件）"
echo "  - less（默认分页器）"
echo "  - man（使用 PAGER 显示手册页）"

echo ""
echo "=== 推荐设置 ==="
echo '# 在 ~/.bashrc 中：'
echo 'export EDITOR=vim'
echo 'export VISUAL=vim'
echo 'export PAGER=less'
```

#### 3.10.7 TZ -- 时区

```bash
# === TZ 时区变量 ===

echo "TZ = ${TZ:-未设置（默认使用系统时区）}"
echo "系统当前时间：$(date)"
echo "系统时区：$(timedatectl show --property=Timezone 2>/dev/null || cat /etc/timezone 2>/dev/null || echo '未知')"

echo ""
echo "=== TZ 临时设置示例 ==="
echo "使用 UTC 显示时间："
TZ=UTC date
echo "使用 Asia/Shanghai 显示时间："
TZ=Asia/Shanghai date
echo "使用 America/New_York 显示时间："
TZ=America/New_York date
echo "使用 Asia/Tokyo 显示时间："
TZ=Asia/Tokyo date

echo ""
echo "系统默认时间：$(date)"
```

#### 3.10.8 HISTSIZE、HISTFILESIZE、HISTFILE、HISTCONTROL

```bash
# === 命令历史相关变量 ===

echo "HISTSIZE     = ${HISTSIZE:-未设置}    # 内存中保存的历史命令数"
echo "HISTFILESIZE = ${HISTFILESIZE:-未设置} # 历史文件中保存的命令数"
echo "HISTFILE     = ${HISTFILE:-~/.bash_history} # 历史文件路径"
echo "HISTCONTROL  = ${HISTCONTROL:-未设置}  # 历史记录控制"

echo ""
echo "=== HISTCONTROL 常用值 ==="
echo "  ignorespace   : 以空格开头的命令不记录"
echo "  ignoredups    : 连续的重复命令只记录一次"
echo "  ignoreboth    : 同时启用上述两者"
echo "  erasedups     : 删除历史中的重复命令（保留最新的）"

echo ""
echo "=== HISTTIMEFORMAT ==="
echo "设置后，历史命令会记录时间戳"
echo "  export HISTTIMEFORMAT='%F %T '  →  2024-01-15 14:30:25 ls -la"

# 演示
echo ""
echo "当前历史命令数量（内存中）："
history | wc -l
```

#### 3.10.9 PROMPT_COMMAND -- 每次提示符前的钩子

```bash
# === PROMPT_COMMAND ===

echo "PROMPT_COMMAND = ${PROMPT_COMMAND:-未设置}"

echo ""
echo "=== PROMPT_COMMAND 的机制 ==="
echo "Bash 在显示 PS1 提示符之前，会先执行 PROMPT_COMMAND 中的命令"
echo "可以用于："
echo "  1. 动态更新提示符信息"
echo "  2. 每次命令后自动记录（如终端标题、git 分支）"
echo "  3. 监控和日志"

echo ""
echo "=== PROMPT_COMMAND 示例 ==="
# 演示1：在提示符前显示当前时间
echo "示例1：在提示符前显示时间"
OLD_PROMPT_COMMAND="$PROMPT_COMMAND"
PROMPT_COMMAND='echo -n "[$(date +%H:%M:%S)] "'
echo "（提示符前会显示时间戳，按回车查看效果）"

# 恢复
PROMPT_COMMAND="$OLD_PROMPT_COMMAND"

# 演示2：设置终端标题
echo ""
echo "示例2：设置终端标题为 '用户@主机: 当前目录'"
echo '  PROMPT_COMMAND='\''echo -ne "\033]0;${USER}@${HOSTNAME}: ${PWD}\007"'\'
```

#### 3.10.10 环境变量综合查看

```bash
# === 一次性查看所有重要的环境变量 ===

echo "========================================="
echo "  重要环境变量总览"
echo "========================================="

for var in PATH HOME USER SHELL LOGNAME UID \
           LANG LC_ALL LANGUAGE \
           PS1 PS2 PS4 \
           EDITOR VISUAL PAGER \
           TZ \
           HISTSIZE HISTFILESIZE HISTFILE HISTCONTROL \
           LD_LIBRARY_PATH \
           PROMPT_COMMAND \
           TERM DISPLAY \
           PWD OLDPWD; do
    # 安全地获取变量值，截断过长的值
    val="${!var}"
    if [ ${#val} -gt 100 ]; then
        val="${val:0:100}..."
    fi
    if [ -n "$val" ]; then
        printf "%-18s = %s\n" "$var" "$val"
    else
        printf "%-18s = (未设置)\n" "$var"
    fi
done
```

---

## 4. 实战练习

### 练习 22.1：基础变量操作

**题目：**

（1）创建三个变量 `name`、`age`、`city`，分别赋值为你的姓名、年龄、城市。使用三种不同的引用方式输出它们。

（2）将 `greeting` 变量设置为 `"Hello, World!"`，然后使用 `${greeting:7:5}` 提取 `World`。

（3）演示 `unset` 和 `${var:-默认值}` 的区别。

**答案：**

```bash
# (1) 创建并引用变量
name="张三"
age=25
city="深圳"

# 三种引用方式
echo "方式1（直接引用）：$name"
echo "方式2（花括号引用）：${name}"
echo "方式3（组合引用）：${name}今年${age}岁，住在${city}"

# (2) 子串提取
greeting="Hello, World!"
echo ""
echo "完整: $greeting"
echo "从位置7开始取5个字符: ${greeting:7:5}"
echo "提取 World 后的拼接: ${greeting:7:5} is beautiful!"

# (3) unset 和默认值的区别
echo ""
echo "=== unset vs 默认值 ==="
demo_var="I exist"
echo "变量存在时：$demo_var"
echo "使用默认值（变量存在）：${demo_var:-默认字符串}"

unset demo_var
echo "unset 后直接引用：${demo_var:-已删除}"
echo "使用默认值（变量不存在）：${demo_var:-这是默认值}"
```

### 练习 22.2：export 与子进程继承

**题目：**

（1）创建两个变量 `A=100` 和 `B=200`，只 export A。然后在子 Shell 中检查能否访问 A 和 B，并解释原因。

（2）在子 Shell 中修改 A 的值为 999，然后在父 Shell 中再次输出 A 的值。解释为什么父 Shell 中的 A 没有变化。

（3）使用 `export -p` 列出所有已导出的变量，找出其中的 `A`。

**答案：**

```bash
# (1) export 与子进程继承
A=100
B=200
export A
# B 没有 export

echo "=== 父 Shell ==="
echo "A=$A, B=$B"

echo ""
echo "=== 子 Shell ==="
bash -c '
echo "子进程中：A=$A"
echo "子进程中：B=${B:-未定义（因为 B 没有 export）}"
'

echo ""
echo "=== 解释 ==="
echo "A 被 export 了 → A 进入了环境块 → 子进程可以继承"
echo "B 没有被 export → B 只在 Shell 哈希表中 → 子进程看不到"

# (2) 子进程修改不影响父进程
echo ""
echo "=== 子进程修改变量后 ==="
bash -c 'A=999; echo "子进程中修改后：A=$A"'
echo "父进程中 A=$A（未变！）"

echo ""
echo "=== 解释 ==="
echo "fork() 时子进程复制了父进程的环境块"
echo "子进程修改自己的环境块副本，不影响父进程的环境块"
echo "这是操作系统进程隔离机制的保护"

# (3) export -p 查找 A
echo ""
echo "=== export -p 中的 A ==="
export -p | grep 'declare -x A=' || echo "（如果未找到，检查变量名）"
```

### 练习 22.3：declare 类型属性

**题目：**

（1）使用 `declare -i` 创建一个整数变量 `counter`，初始值为 0，然后在循环中每次加 3，循环 5 次后打印结果。预期结果为 15。

（2）使用 `declare -a` 创建一个索引数组，包含 5 个水果名称。遍历数组并打印每个元素及其索引。

（3）使用 `declare -A` 创建一个关联数组，包含 3 个服务器的 IP 地址映射（server1→192.168.1.10, server2→192.168.1.20, server3→192.168.1.30）。打印所有服务器信息。

（4）使用 `declare -l` 和 `declare -u` 各创建一个变量，展示大小写自动转换的效果。

**答案：**

```bash
# (1) declare -i 整数变量
echo "=== declare -i 整数运算 ==="
declare -i counter=0
echo "初始值: $counter"
for i in 1 2 3 4 5; do
    counter="counter + 3"
    echo "  第 $i 次: $counter"
done
echo "最终结果: $counter（预期 15）"

# (2) declare -a 索引数组
echo ""
echo "=== declare -a 索引数组 ==="
declare -a fruits=("苹果" "香蕉" "橙子" "葡萄" "西瓜")
echo "数组长度: ${#fruits[@]}"
echo ""
for i in "${!fruits[@]}"; do
    echo "  fruits[$i] = ${fruits[$i]}"
done

# (3) declare -A 关联数组
echo ""
echo "=== declare -A 关联数组 ==="
declare -A servers
servers[server1]="192.168.1.10"
servers[server2]="192.168.1.20"
servers[server3]="192.168.1.30"

for server in "${!servers[@]}"; do
    echo "  $server → ${servers[$server]}"
done

# 演示关联数组的键是无序的
echo ""
echo "注意：关联数组的键输出顺序可能与插入顺序不同（哈希表特性）"

# (4) declare -l 和 -u
echo ""
echo "=== declare -l 和 -u ==="
declare -l lower_input="HeLLo WoRLD 2024"
declare -u upper_input="HeLLo WoRLD 2024"
echo "declare -l 自动小写: $lower_input"
echo "declare -u 自动大写: $upper_input"

# 重新赋值后自动转换
lower_input="NEW VALUE HERE"
upper_input="new value here"
echo "重新赋值后 -l: $lower_input"
echo "重新赋值后 -u: $upper_input"
```

### 练习 22.4：环境变量排错

**题目：**

你的同事报告说他在 `~/.bashrc` 中添加了 `export PATH="/opt/myapp/bin:$PATH"`，但执行 `myapp` 命令时仍然提示 "command not found"。请帮他排查可能的原因，并列出至少 3 种可能导致此问题的场景。

**答案：**

```bash
# 问题诊断脚本

echo "=== PATH 配置问题排查 ==="

echo ""
echo "1. 检查 PATH 是否真正更新："
echo "当前 PATH："
echo "$PATH" | tr ':' '\n' | nl
# 检查 /opt/myapp/bin 是否在 PATH 中
if echo "$PATH" | grep -q '/opt/myapp/bin'; then
    echo "✓ /opt/myapp/bin 在 PATH 中"
else
    echo "✗ /opt/myapp/bin 不在 PATH 中"
fi

echo ""
echo "2. 检查命令是否确实存在且可执行："
if [ -f /opt/myapp/bin/myapp ]; then
    echo "✓ myapp 文件存在"
    if [ -x /opt/myapp/bin/myapp ]; then
        echo "✓ myapp 有可执行权限"
    else
        echo "✗ myapp 缺少可执行权限 → 执行: chmod +x /opt/myapp/bin/myapp"
    fi
else
    echo "✗ /opt/myapp/bin/myapp 文件不存在"
fi

echo ""
echo "3. 检查 PATH 是否被其他配置覆盖："
echo "可能原因："
echo "  a) 在 ~/.bashrc 中设置了 PATH，但在 ~/.bashrc 末尾或 ~/.profile"
echo "     中用其他值覆盖了 PATH（没有使用 \$PATH 附加）"
echo "  b) 在非登录 Shell 中设置了 PATH，但 myapp 只在登录 Shell 中需要"
echo "  c) ~/.bashrc 中的修改没有生效（没有 source ~/.bashrc 或重开终端）"
echo "  d) PATH 中包含拼写错误（如 export PATH=\"/opt/myapp/bin:\$ATH\"）"
echo "  e) 当前终端是非交互式 Shell（如 cron 任务），~/.bashrc 不会加载"

echo ""
echo "4. 正确的 PATH 追加方式："
echo "  export PATH=\"/opt/myapp/bin:\$PATH\"    # 在 ~/.profile 中（用户级）"
echo "  或"
echo "  export PATH=\"\$PATH:/opt/myapp/bin\"    # 如果想要低优先级"

echo ""
echo "5. 验证（模拟）："
# 创建模拟目录和程序
mkdir -p /tmp/path-debug/bin
echo '#!/bin/bash
echo "myapp 执行成功！参数: $@"
' > /tmp/path-debug/bin/myapp
chmod +x /tmp/path-debug/bin/myapp

echo ""
echo "修复前："
which myapp 2>&1 || echo "找不到 myapp"

export PATH="/tmp/path-debug/bin:$PATH"
echo "修复后："
echo "which myapp → $(which myapp)"
/tmp/path-debug/bin/myapp hello world

# 清理
rm -rf /tmp/path-debug
```

### 练习 22.5：启动文件加载顺序

**题目：**

（1）根据本章内容，画出登录 Shell（login shell）和非登录交互式 Shell（non-login interactive shell）各自的配置文件加载流程图。

（2）你在 `~/.bashrc` 中定义了一个别名 `alias ll='ls -la'`，但你发现通过 SSH 登录后 `ll` 不可用。请分析原因并给出解决方案。

（3）修改了 `/etc/profile` 后，当前已打开的终端中，修改生效了吗？为什么？如何让修改在当前终端中生效？

**答案：**

```bash
echo "=== (1) 加载流程图（文字描述）==="
echo ""
echo "登录 Shell（ssh user@host / su - / 控制台登录）："
echo "  /etc/profile"
echo "    └── source /etc/bash.bashrc  (Ubuntu特有)"
echo "  ~/.bash_profile"
echo "    └── 如果不存在 → ~/.bash_login"
echo "    └── 如果不存在 → ~/.profile"
echo "        └── source ~/.bashrc    (Ubuntu 默认 ~/.profile 会加载)"
echo ""
echo "非登录交互式 Shell（打开终端标签页 / su / bash）："
echo "  /etc/bash.bashrc  (Ubuntu特有)"
echo "  ~/.bashrc"

echo ""
echo "=== (2) SSH 登录后 ll 不可用 ==="
echo "分析：SSH 启动的是登录 Shell，按上面登录 Shell 的加载顺序："
echo "  /etc/profile → ~/.profile → ~/.bashrc"
echo ""
echo "按 Ubuntu 默认配置，~/.profile 中有类似这样的代码："
echo '  if [ -f "$HOME/.bashrc" ]; then'
echo '      . "$HOME/.bashrc"'
echo '  fi'
echo ""
echo "如果 ~/.profile 中没有加载 ~/.bashrc，登录 Shell 不会加载 ~/.bashrc"
echo "解决方案：在 ~/.profile 中添加上述代码，或直接在 ~/.profile 中定义别名"

# 验证
echo ""
echo "验证：检查 ~/.profile 是否加载了 ~/.bashrc"
if [ -f ~/.profile ]; then
    echo "在 ~/.profile 中搜索 bashrc 引用："
    grep -n 'bashrc\|\. ' ~/.profile | head -5
fi

echo ""
echo "=== (3) /etc/profile 修改在当前终端生效 ==="
echo "回答：默认不生效。因为："
echo "  - /etc/profile 只在登录 Shell 启动时加载一次"
echo "  - 已打开的终端不会重新加载 /etc/profile"
echo ""
echo "让修改生效的方法："
echo "  方法1（推荐）: source /etc/profile"
echo "  方法2: . /etc/profile"
echo "  方法3: 退出当前 Shell 并重新登录"
echo ""
echo "注意：如果修改的是 ~/.bashrc，执行 source ~/.bashrc 即可"
```

### 练习 22.6：source 与 . 的区别

**题目：**

（1）编写一个脚本 `/tmp/my-config.sh`，包含以下内容：
   - 设置变量 `APP_NAME="MyApp"`
   - 设置变量 `APP_PORT=8080`
   - `echo "配置已加载"`
分别用 `bash` 和 `source` 执行这个脚本，观察变量的可用性差异。

（2）为什么配置文件（如 `~/.bashrc`）用 `source` 加载，而普通脚本（如 `./backup.sh`）用 `bash` 执行？两者的设计意图有什么不同？

（3）`source` 一个包含 `exit` 命令的脚本会发生什么？在子 Shell 中验证。

**答案：**

```bash
# (1) bash vs source
cat > /tmp/my-config.sh << 'CONFIG'
#!/bin/bash
APP_NAME="MyApp"
APP_PORT=8080
echo "配置已加载"
CONFIG

echo "=== 使用 bash 执行 ==="
# 先确保变量不存在
unset APP_NAME APP_PORT 2>/dev/null
bash /tmp/my-config.sh
echo "执行后：APP_NAME=${APP_NAME:-未定义}, APP_PORT=${APP_PORT:-未定义}"

echo ""
echo "=== 使用 source 执行 ==="
unset APP_NAME APP_PORT 2>/dev/null
source /tmp/my-config.sh
echo "执行后：APP_NAME=$APP_NAME, APP_PORT=$APP_PORT"

# (2) 设计意图
echo ""
echo "=== (2) 设计意图分析 ==="
echo "配置文件用 source："
echo "  目的：修改当前 Shell 的环境（变量、别名、函数）"
echo "  特点：在当前 Shell 中执行，修改立即生效"
echo "  示例：source ~/.bashrc → 别名立即可用"
echo ""
echo "普通脚本用 bash："
echo "  目的：执行独立任务（备份、处理数据、部署）"
echo "  特点：在隔离的子 Shell 中执行，不影响当前环境"
echo "  示例：bash backup.sh → 脚本中的变量不影响当前 Shell"
echo ""
echo "如果普通脚本也用 source："
echo "  - 脚本中的临时变量会污染当前 Shell"
echo "  - 脚本中的 cd 会改变当前工作目录"
echo "  - 脚本中的 exit 会关闭当前终端！"

# (3) source 包含 exit 的脚本
echo ""
echo "=== (3) source 包含 exit ==="
cat > /tmp/dangerous.sh << 'DANGER'
echo "脚本开始执行..."
echo "准备退出..."
exit 0
echo "这行永远不会执行"
DANGER

echo "在子 Shell 中 source 包含 exit 的脚本（安全）："
bash -c 'source /tmp/dangerous.sh; echo "这行不会打印（如果 exit 生效）"' 2>&1 || true
echo ""
echo "警告：如果直接在当前 Shell 中 source /tmp/dangerous.sh"
echo "      → exit 会关闭当前终端！这就是为什么 .bashrc 中不应该有 exit"

# 清理
rm -f /tmp/my-config.sh /tmp/dangerous.sh
unset APP_NAME APP_PORT
```

### 练习 22.7：实战 -- 编写自定义环境配置脚本

**题目：**

编写一个脚本 `~/myenv.sh`，实现以下功能：
（1）为 PATH 追加 `~/bin` 目录（如果存在）
（2）设置 `EDITOR=vim`、`PAGER=less`
（3）根据 `LANG` 是否包含 `zh_CN` 来设置不同的 `PS1`：中文用户显示 `[用户@主机 目录]$`，英文用户显示 `[user@host dir]$`
（4）设置 `HISTSIZE=5000` 和 `HISTFILESIZE=10000`
（5）检查并打印加载成功信息（包含时间和加载的变量数）
（6）在脚本最后，用 `source` 方式验证——确保变量在 source 后可用

**答案：**

```bash
# 编写 ~/myenv.sh
cat > ~/myenv.sh << 'MYENV'
#!/bin/bash
# =============================================
# 自定义环境配置脚本
# 使用方法：source ~/myenv.sh
# =============================================

# 记录加载前的状态（用于统计）
_env_before=$(set | wc -l)

echo "========================================="
echo "  加载自定义环境配置"
echo "========================================="

# (1) 追加 ~/bin 到 PATH
if [ -d "$HOME/bin" ]; then
    export PATH="$HOME/bin:$PATH"
    echo "✓ 已添加 ~/bin 到 PATH"
else
    echo "○ ~/bin 目录不存在，跳过 PATH 追加"
fi

# (2) 设置编辑器
export EDITOR=vim
export VISUAL=vim
export PAGER=less
echo "✓ EDITOR=$EDITOR, PAGER=$PAGER"

# (3) 根据语言设置 PS1
if [[ "$LANG" == *zh_CN* ]] || [[ "$LANG" == *zh_CN* ]]; then
    # 中文用户
    export PS1='[\u@\h \w]\$ '
    echo "✓ 中文提示符已设置"
else
    # 英文用户
    export PS1='[\u@\h \W]\$ '
    echo "✓ English prompt set"
fi

# (4) 设置历史记录
export HISTSIZE=5000
export HISTFILESIZE=10000
export HISTCONTROL=ignoreboth
export HISTTIMEFORMAT='%F %T '
echo "✓ HISTSIZE=$HISTSIZE, HISTFILESIZE=$HISTFILESIZE"

# (5) 加载报告
_env_after=$(set | wc -l)
echo "========================================="
echo "  加载完成！时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 清理内部变量
unset _env_before _env_after
MYENV

echo ""
echo "=== 脚本已创建：~/myenv.sh ==="
echo ""
echo "=== 验证：使用 source 加载 ==="
echo "加载前的环境变量数：$(env | wc -l)"

# 在子 Shell 中 source 以验证（避免污染当前 Shell）
bash -c '
source ~/myenv.sh
echo ""
echo "验证变量是否可用："
echo "  EDITOR=$EDITOR"
echo "  PAGER=$PAGER"
echo "  HISTSIZE=$HISTSIZE"
'

echo ""
echo "注意：上面的验证在子 Shell 中执行，所以当前 Shell 不受影响"
echo "如果要让配置在当前 Shell 中生效，执行："
echo "  source ~/myenv.sh"
```

### 练习 22.8：综合挑战 -- 变量作用域与启动链追踪

**题目：**

（1）创建一个脚本 `/tmp/trace-env.sh`，它能够：
   - 打印当前 Shell 类型（登录/非登录/交互式/非交互式）
   - 列出当前所有以字母开头的 Shell 变量数量
   - 列出当前所有环境变量数量
   - 检查是否能看到父 Shell 中 export/未export 的变量

（2）按照以下步骤实验，记录每一步的结果：
   - 步骤 A：在当前 Shell 中设置 `X=1`，不 export
   - 步骤 B：设置 `Y=2`，并 export
   - 步骤 C：用 `bash /tmp/trace-env.sh` 执行脚本，观察 X 和 Y
   - 步骤 D：用 `source /tmp/trace-env.sh` 执行脚本，观察 X 和 Y
   - 步骤 E：用 `env X=10 Y=20 bash /tmp/trace-env.sh` 执行，观察 X 和 Y 的值

（3）解释步骤 E 中 X 和 Y 的值为什么分别是 10 和 20，而不是 1 和 2。

**答案：**

```bash
# (1) 创建 trace-env.sh
cat > /tmp/trace-env.sh << 'TRACE'
#!/bin/bash
echo "========================================="
echo "  环境追踪报告"
echo "========================================="
echo "PID: $$"

# Shell 类型判断
if shopt -q login_shell 2>/dev/null; then
    echo "类型: 登录 Shell (Login Shell)"
else
    echo "类型: 非登录 Shell (Non-Login Shell)"
fi

if [[ $- == *i* ]]; then
    echo "交互: 交互式 Shell (Interactive)"
else
    echo "交互: 非交互式 Shell (Non-Interactive)"
fi

# 变量统计
echo ""
echo "--- 变量统计 ---"
echo "Shell 变量总数: $(set | wc -l) 行"
echo "环境变量总数: $(env | wc -l) 个"

# 检查特定变量
echo ""
echo "--- 变量检查 ---"
echo "X = ${X:-未定义（说明父Shell未export X 或未用source执行）}"
echo "Y = ${Y:-未定义（说明父Shell未export Y 或未用source执行）}"

# 父子关系
echo ""
echo "--- 进程关系 ---"
echo "当前 PID: $$"
echo "父进程 PID: $PPID"
echo "当前 Shell 执行文件: $(readlink /proc/$$/exe 2>/dev/null || echo '无法读取')"
TRACE

chmod +x /tmp/trace-env.sh

# (2) 实验步骤
echo "=== 步骤 A-B：设置变量 ==="
X=1
Y=2
export Y
echo "已设置 X=1 (未export), Y=2 (已export)"

echo ""
echo "=== 步骤 C：bash 执行（子Shell）==="
bash /tmp/trace-env.sh

echo ""
echo "=== 步骤 D：source 执行（当前Shell）==="
source /tmp/trace-env.sh

echo ""
echo "=== 步骤 E：env 覆盖执行 ==="
env X=10 Y=20 bash /tmp/trace-env.sh

# (3) 解释
echo ""
echo "=== (3) 解释 ==="
echo "步骤 C (bash)："
echo "  子进程由 fork()+exec() 创建"
echo "  X=1 在父 Shell 哈希表中，未进入环境块 → 子进程看不到"
echo "  Y=2 在环境块中 → 子进程继承了 Y=2"
echo ""
echo "步骤 D (source)："
echo "  脚本在当前 Shell 中执行（没有新进程）"
echo "  X 和 Y 都是当前 Shell 的变量 → 都可以访问"
echo ""
echo "步骤 E (env X=10 Y=20 bash ...)："
echo "  env 命令在启动 bash 之前修改了环境块"
echo "  将 X=10 和 Y=20 放入环境块，覆盖了先前继承的 Y=2"
echo "  所以子进程看到的是 env 指定的值，而不是父 Shell 中的值"
echo ""
echo "  区别总结："
echo "  - env 临时变量：仅在执行的命令中生效，不影响当前 Shell"
echo "  - export 变量：在当前 Shell 和所有子进程中都可用"
echo "  - Shell 变量（未export）：仅在当前 Shell 中可用"

# 清理
rm -f /tmp/trace-env.sh
unset X Y
```

---

## 5. 常见错误与排错

### 5.1 误区：赋值等号两边加空格

**错误案例：**

```bash
# 错误：等号两边有空格
MY_VAR = "hello"      # Bash 把 MY_VAR 当作命令，= 和 "hello" 当作参数
NAME= "Ubuntu"        # NAME 被赋值为空字符串，"Ubuntu" 被当作命令执行
```

**问题：**

Shell 变量赋值的语法要求等号两边**不能有空格**。空格会使 Shell 将变量名解析为命令名，导致 "command not found" 错误。

**正确做法：**

```bash
# 正确：等号两边无空格
MY_VAR="hello"
NAME="Ubuntu"

# 复合赋值同理
result=$(( 1 + 2 ))
```

```bash
# 演示
echo "=== 错误演示（在子 Shell 中，安全）==="
bash -c 'MY_VAR = "hello"' 2>&1 || true
echo "错误原因：Bash 把 MY_VAR 当作命令名来执行"

echo ""
echo "=== 正确写法 ==="
MY_VAR="hello"
echo "MY_VAR=$MY_VAR"
```

### 5.2 误区：在子 Shell 中修改父 Shell 变量

**错误案例：**

```bash
# 期望：循环中的 count 值能在循环后使用
cat file.txt | while read line; do
    count=$((count + 1))
done
echo "总行数: $count"   # 输出：总行数: 0（或空）！
```

**问题：**

管道 `|` 中的每个命令在**独立的子 Shell**中执行。`while read` 循环在子 Shell 中运行，它对 `count` 的修改不会传回父 Shell。循环结束后，父 Shell 中的 `count` 仍然是原值。

**正确做法：**

```bash
# 方法1：使用进程替换（process substitution，避免管道子 Shell）
count=0
while read line; do
    count=$((count + 1))
done < <(cat file.txt)
echo "总行数: $count"

# 方法2：使用 Here String
count=0
while read line; do
    count=$((count + 1))
done <<< "$(cat file.txt)"
echo "总行数: $count"

# 方法3：使用 wc -l 代替（如果只是计数）
count=$(wc -l < file.txt)
echo "总行数: $count"
```

```bash
# 演示
echo "line 1" > /tmp/pipe_test.txt
echo "line 2" >> /tmp/pipe_test.txt
echo "line 3" >> /tmp/pipe_test.txt

echo "=== 错误写法（管道子 Shell）==="
count=0
cat /tmp/pipe_test.txt | while read line; do
    count=$((count + 1))
    echo "  循环内: count=$count"
done
echo "循环后: count=$count（丢失！因为在子 Shell 中累加）"

echo ""
echo "=== 正确写法（进程替换）==="
count=0
while read line; do
    count=$((count + 1))
done < <(cat /tmp/pipe_test.txt)
echo "循环后: count=$count（正确！）"

rm -f /tmp/pipe_test.txt
```

### 5.3 误区：混淆 export 与变量赋值

**错误案例：**

```bash
# 期望一次性导出多个变量
export VAR1="value1" VAR2="value2" VAR3="value3"   # 这是正确的

# 但这样不行
export $MYVAR       # MYVAR 是一个包含变量名的变量
```

**问题：**

`export` 接受的是**变量名**作为参数，不是变量的值。`export $MYVAR` 会先展开 `$MYVAR`，然后将展开后的值作为"变量名"去导出。这通常不是你想要的。

**正确做法：**

```bash
# 正确：export 变量名
var_name="MY_EXPORT_VAR"
MY_EXPORT_VAR="important value"

# 如果想以编程方式导出变量
export "$var_name"   # 不要用 $var_name
# 或者使用 declare -x
declare -x "$var_name"
```

```bash
# 演示
echo "=== 错误：export 变量的值 ==="
VAR_TO_EXPORT="HELLO"
HELLO="world"
export $VAR_TO_EXPORT   # 导出的是 HELLO（VAR_TO_EXPORT 的值）
bash -c 'echo "HELLO=$HELLO"'   # 可以访问到
echo "但如果 VAR_TO_EXPORT 的值不是一个变量名，export 会做什么？"

echo ""
echo "=== 正确：按名称导出 ==="
export VAR_TO_EXPORT   # 导出 VAR_TO_EXPORT 本身
bash -c 'echo "VAR_TO_EXPORT=$VAR_TO_EXPORT"'
```

### 5.4 误区：变量未加引号导致的单词分割

**错误案例：**

```bash
# 文件名中有空格
filename="my document.txt"
cat $filename    # Shell 展开为：cat my document.txt → 尝试打开两个文件！
```

**问题：**

不带引号的变量展开会触发 Shell 的**单词分割（Word Splitting）**和**文件名展开（Globbing）**。空格、制表符、换行符被当作分隔符，将变量值拆分为多个参数。

**正确做法：**

```bash
# 始终用双引号包裹变量引用
filename="my document.txt"
cat "$filename"          # 正确：cat "my document.txt"

# 在 for 循环中也要加引号
files="file1.txt file2.txt"
for f in $files; do ...; done         # 危险：如果文件名有空格
for f in "$files"; do ...; done       # 错误：整个当作一个元素
# 正确做法：用数组
files=("file1.txt" "my file.txt")
for f in "${files[@]}"; do
    echo "处理: $f"
done
```

```bash
# 演示：单词分割的危害
echo "=== 不含引号 ==="
greeting="Hello World Ubuntu"
for word in $greeting; do
    echo "  单词: $word"
done
# 输出三个单词：Hello, World, Ubuntu

echo ""
echo "=== 含引号 ==="
for word in "$greeting"; do
    echo "  单词: $word"
done
# 输出一个整体：Hello World Ubuntu

echo ""
echo "规则：变量引用时始终使用双引号，除非你有意要进行单词分割"
```

### 5.5 误区：修改配置文件后不重新加载

**错误案例：**

```bash
# 修改了 ~/.bashrc，添加了 alias ll='ls -la'
# 但在当前终端中执行 ll 仍然报错 command not found
```

**问题：**

`~/.bashrc` 只在 Shell 启动时加载一次。修改文件后，当前运行的 Shell 不会自动感知变化。必须手动重新加载或重启 Shell。

**正确做法：**

```bash
# 修改 ~/.bashrc 后
source ~/.bashrc
# 或
. ~/.bashrc
# 或者关闭当前终端，重新打开
```

```bash
# 演示
echo "=== 模拟修改 ~/.bashrc ==="
echo 'alias demo_alias="echo 别名生效了"' >> /tmp/test_bashrc

echo "修改后不 source："
bash -c 'source /tmp/test_bashrc; demo_alias' 2>&1 || echo "（不 source 就不生效）"

echo ""
echo "source 后："
bash -c 'source /tmp/test_bashrc; demo_alias'
# 输出：别名生效了

rm -f /tmp/test_bashrc
```

### 5.6 误区：PATH 覆盖而非追加

**错误案例：**

```bash
# 在 ~/.bashrc 中
export PATH="/opt/myapp/bin"     # 严重错误！覆盖了系统 PATH
```

**问题：**

直接赋值给 `PATH` 会**完全覆盖**之前的 `PATH` 值。这导致 `/usr/bin`、`/bin` 等系统目录从 `PATH` 中消失，使得 `ls`、`cp`、`grep` 等基本命令无法使用。

**正确做法：**

```bash
# 始终使用 $PATH 追加（前置或后置）
export PATH="/opt/myapp/bin:$PATH"    # 前置（优先搜索）
export PATH="$PATH:/opt/myapp/bin"   # 后置（低优先级）

# 检查是否重复追加
if [[ ":$PATH:" != *":/opt/myapp/bin:"* ]]; then
    export PATH="/opt/myapp/bin:$PATH"
fi
```

```bash
# 演示：PATH 覆盖的危险（在子 Shell 中，安全）
echo "=== 正常 PATH ==="
echo "PATH 目录数: $(echo $PATH | tr ':' '\n' | wc -l)"

echo ""
echo "=== 覆盖 PATH ==="
bash -c 'export PATH="/tmp/testpath"; echo "ls 还能用吗？"; ls /tmp' 2>&1 || true
# 注意：ls 还能用因为它在命令中使用了完整路径，但如果只写 ls 会失败

echo ""
echo "=== 正确做法：追加 ==="
bash -c 'export PATH="/tmp/testpath:$PATH"; echo "ls 仍然可用: $(which ls)"'
```

### 5.7 误区：declare -r 变量试图修改或 unset

**错误案例：**

```bash
readonly MY_CONST=100
MY_CONST=200           # 报错：MY_CONST: readonly variable
unset MY_CONST         # 报错：MY_CONST: readonly variable
```

**问题：**

只读变量在 Shell 的生命周期内无法修改、无法删除。这个限制在当前 Shell 中是无法解除的（不像其他语言中的常量可以重新赋值）。

**正确做法：**

```bash
# 如果你确实需要在脚本后期"修改"一个常量，有几种办法：

# 方法1：不要用 readonly，用命名约定（全大写）表示"不应修改"
MY_CONST=100

# 方法2：在子 Shell 中创建只读变量（子 Shell 退出后自动清理）
(
    readonly TMP_CONST=100
    echo "子 Shell: TMP_CONST=$TMP_CONST"
)
# 子 Shell 退出，TMP_CONST 消失

# 方法3：如果需要"重置"，用函数封装
get_config() {
    echo "100"   # 返回常量值
}
```

```bash
# 演示
echo "=== 创建只读变量 ==="
readonly DEMO_RD="original"
echo "DEMO_RD=$DEMO_RD"

echo ""
echo "=== 尝试修改（在子 Shell 中演示）==="
bash -c 'readonly TEST_RD="readonly"; TEST_RD="new"' 2>&1 || echo "修改失败（符合预期）"

echo ""
echo "=== 无法 unset ==="
unset DEMO_RD 2>&1 || echo "unset 失败（符合预期）"

echo ""
echo "提示：只读变量除非退出 Shell，否则无法清除"
```

---

## 6. 进阶延伸

### 6.1 间接引用与 nameref 的进阶用法

`declare -n`（nameref）是 Bash 4.3+ 引入的强大特性，允许通过一个变量名间接操作另一个变量。

```bash
echo "=== Nameref 进阶用法 ==="

# 场景1：动态变量名访问
config_db_host="192.168.1.100"
config_db_port=3306
config_web_host="192.168.1.200"
config_web_port=8080

# 不写一堆 if-else，用 nameref 统一访问
function get_config() {
    local config_name="$1"
    local var_name="config_${config_name}"
    # 检查变量是否存在
    if [ -z "${!var_name+x}" ]; then
        echo "配置 $config_name 不存在"
        return 1
    fi
    declare -n ref="$var_name"
    echo "$ref"
}

echo "db_host  = $(get_config db_host)"
echo "web_port = $(get_config web_port)"
echo "invalid  = $(get_config invalid 2>&1)"

# 场景2：函数返回多个值
function get_user_info() {
    declare -n name_ref="$1"
    declare -n age_ref="$2"
    declare -n city_ref="$3"

    name_ref="李四"
    age_ref=30
    city_ref="上海"

    return 0
}

get_user_info user_name user_age user_city
echo ""
echo "用户信息：姓名=$user_name, 年龄=$user_age, 城市=$user_city"

# 场景3：遍历配置前缀
echo ""
echo "=== 遍历 db 相关配置 ==="
for var_name in $(set | grep '^config_db_' | cut -d= -f1); do
    declare -n ref="$var_name"
    echo "  $var_name = $ref"
done

# 清理（避免 nameref 循环引用）
unset user_name user_age user_city
```

### 6.2 关联数组的实战应用

```bash
echo "=== 关联数组实战 ==="

# 场景1：计数器（按键统计）
declare -A word_count
text="apple banana apple orange banana apple grape orange apple"

for word in $text; do
    ((word_count[$word]++))
done

echo "单词统计："
for word in "${!word_count[@]}"; do
    echo "  $word: ${word_count[$word]} 次"
done

# 场景2：配置文件解析
echo ""
echo "=== 解析类 INI 配置 ==="
cat > /tmp/sample.conf << 'INI'
[server]
host=192.168.1.100
port=8080
debug=true

[database]
host=192.168.1.200
port=3306
name=myapp
INI

declare -A config
while IFS='=' read -r key value; do
    # 跳过空行和节标题
    [[ -z "$key" || "$key" =~ ^\[ ]] && continue
    # 去除值中的前后空白
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    config["$key"]="$value"
done < /tmp/sample.conf

echo "解析结果："
for key in "${!config[@]}"; do
    echo "  $key = ${config[$key]}"
done

# 场景3：集合去重
echo ""
echo "=== 集合去重 ==="
declare -A seen
items=("apple" "banana" "apple" "orange" "banana" "grape" "apple")
declare -a unique
for item in "${items[@]}"; do
    if [[ -z "${seen[$item]}" ]]; then
        seen[$item]=1
        unique+=("$item")
    fi
done
echo "去重后: ${unique[@]}"

# 清理
rm -f /tmp/sample.conf
```

### 6.3 环境变量与安全性：sudo env_reset

```bash
echo "=== sudo 与环境变量安全性 ==="

echo "sudo 默认行为: env_reset"
echo "  1. sudo 会重置大多数环境变量"
echo "  2. 只保留 TERM, PATH, HOME, SHELL, LOGNAME, USER, USERNAME"
echo "  3. 这是为了防止恶意环境变量攻击（如 LD_PRELOAD）"

echo ""
echo "=== 演示：sudo 环境变量行为 ==="
# 创建测试变量（不需要真正 sudo）
MY_TEST="test_value"
export MY_TEST

echo "当前 Shell 中：MY_TEST=$MY_TEST"
echo "如果用 sudo bash -c 'echo \$MY_TEST'："
echo "  预期：输出为空（env_reset 清除了 MY_TEST）"

echo ""
echo "=== 安全最佳实践 ==="
echo "1. 不要在环境变量中存储密码或密钥"
echo "2. 不要全局设置 LD_LIBRARY_PATH（改用 /etc/ld.so.conf.d/）"
echo "3. 不要导出包含 .（当前目录）的 PATH"
echo "4. 敏感变量避免 export，只在需要时才设置"
```

### 6.4 /etc/environment 与 PAM environment

```bash
echo "=== /etc/environment 与系统级环境 ==="

echo "/etc/environment："
echo "  这是 PAM（Pluggable Authentication Modules）读取的文件"
echo "  格式：KEY=\"value\"（不是 Shell 语法，没有 export 关键字）"
echo "  对所有登录用户生效，在 Shell 启动之前设置"
echo ""

# 查看 /etc/environment
echo "=== /etc/environment 内容 ==="
cat /etc/environment 2>/dev/null || echo "/etc/environment 不存在或无内容"

echo ""
echo "与 /etc/profile 的区别："
echo "  /etc/environment: PAM 设置，Shell无关，对所有 Shell 有效"
echo "  /etc/profile:     Shell 脚本，仅对 Bash/sh 登录 Shell 有效"
echo ""
echo "/etc/environment 示例内容："
echo '  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"'
echo '  LANG="en_US.UTF-8"'
```

### 6.5 变量展开的高级用法

```bash
echo "=== 高级变量展开技巧 ==="

# 1. 间接引用（indirect expansion）-- ${!var}
echo "--- 间接引用 ---"
target="HOME"
echo "target = $target"
echo "\${!target} = ${!target}"   # 展开为 $HOME 的值

# 2. 变量名展开 -- ${!prefix@} 和 ${!prefix*}
echo ""
echo "--- 变量名展开 ---"
# 列出所有以 BASH 开头的变量名
echo "以 BASH 开头的变量："
for var in ${!BASH*}; do
    echo "  $var"
done | head -5

# 3. 大小写转换 -- ${var^^} 和 ${var,,}
echo ""
echo "--- 大小写转换（Bash 4.0+） ---"
text="Hello World"
echo "原始: $text"
echo "全大写: ${text^^}"
echo "全小写: ${text,,}"
echo "首字母大写: ${text^}"
echo "首字母小写: ${text,}"

# 4. 模式匹配替换配合 eval（慎用）
echo ""
echo "--- 参数展开与字符串操作组合 ---"
filename="backup-2024-07-30.tar.gz"
echo "文件: $filename"
echo "去除 .tar.gz: ${filename%.tar.gz}"
echo "提取日期: ${filename#backup-}"
echo "将 backup 替换为 archive: ${filename/backup/archive}"

# 5. 变量的变量（eval 方式，nameref 更好）
echo ""
echo "--- 变量的变量（eval 演示） ---"
var_name="dynamic_var"
dynamic_var="I am the dynamic value"
eval "echo \$$var_name"    # 输出: I am the dynamic value
# 推荐用 nameref:
declare -n ref="$var_name"
echo "（nameref 方式）: $ref"
```

### 6.6 最佳实践清单

```bash
echo "========================================="
echo "  变量与环境变量 —— 最佳实践清单"
echo "========================================="
echo ""
echo "【变量命名】"
echo "  ✓ 普通变量用小写+下划线: user_name, file_count"
echo "  ✓ 环境变量用大写+下划线: JAVA_HOME, EDITOR"
echo "  ✓ 函数名用小写+下划线: parse_config, get_user"
echo "  ✗ 避免使用全小写的环境变量名（可能和系统变量冲突）"
echo ""
echo "【赋值与引用】"
echo "  ✓ 等号两边不要有空格: name=\"value\""
echo "  ✓ 变量引用始终用双引号: echo \"\$var\""
echo "  ✓ 用 \${var} 而非 \$var 来避免歧义: \${var}suffix"
echo "  ✓ 用 \${var:-default} 提供默认值"
echo "  ✗ 不要用未引号的变量（除非有意进行单词分割）"
echo ""
echo "【export 环境变量】"
echo "  ✓ 只在需要被子进程继承时才 export"
echo "  ✓ 在 ~/.profile 中设置用户级环境变量"
echo "  ✓ 追加 PATH: export PATH=\"...:\$PATH\"（保留原值）"
echo "  ✗ 不要在 ~/.bashrc 中设置全局环境变量（每次交互 Shell 都执行）"
echo "  ✗ 不要 export 动态的或临时的变量"
echo ""
echo "【配置文件管理】"
echo "  ✓ 修改配置后 source 或重启 Shell"
echo "  ✓ 登录相关配置放 ~/.profile"
echo "  ✓ 交互式配置（别名、补全）放 ~/.bashrc"
echo "  ✗ 不要在配置文件中放 exit 命令"
echo "  ✗ 不要 echo 输出（除非调试），会破坏 scp/rsync 等协议"
echo ""
echo "【安全性】"
echo "  ✓ 不要在环境变量中存储密码"
echo "  ✓ 不要将 . 加入 PATH"
echo "  ✓ 敏感操作前检查变量是否为空: \${var:?变量未设置}"
echo "  ✓ 在脚本中使用 local 限定函数内变量作用域"
echo ""
echo "【调试】"
echo "  ✓ 用 declare -p VAR 查看变量的完整定义（含属性）"
echo "  ✓ 用 set -u 捕捉未定义变量的使用"
echo "  ✓ 用 set -x 调试变量赋值过程"
echo "  ✓ 用 env -i 隔离测试环境变量问题"
```

---

本章至此结束。你学习了 Shell 变量的三种类型、环境变量的继承机制、Bash 启动文件的加载顺序、declare 的类型系统，以及 13 个重要环境变量的作用。这些知识是 Shell 脚本编程的基础——第 23 章将进入条件判断与流程控制，届时你会大量使用本章学到的变量操作和参数展开技巧。
