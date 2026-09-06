# 第 24 章 Bash 脚本编程(中)：条件与循环

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

### 1.1 从"基础语法"到"智能决策"

第 23 章你学习了 Bash 脚本的基础语法。你掌握了如何创建脚本、如何使用变量和命令替换——这些是脚本的"砖块"。

现在，你需要让脚本**自己做出判断**并提供**重复执行**的能力。这些问题的核心是**条件判断（Conditional Testing）与循环（Looping）**。

### 1.2 条件与循环：从"线性执行"到"控制流"

```
+------------------------------------------------------------------+
|                    脚本执行模式的演进                                  |
|                                                                    |
|  线性执行（第 23 章的能力）：                                         |
|  +---------+    +---------+    +---------+    +---------+         |
|  | 步骤 1  |--->| 步骤 2  |--->| 步骤 3  |--->| 步骤 4  |         |
|  +---------+    +---------+    +---------+    +---------+         |
|  优势：简单、可复用                                                  |
|  局限：不能根据结果选择路径，不能批量处理                              |
|                                                                    |
|  条件与循环（本章的能力）：                                           |
|                       +-------------+                               |
|                   +-->| 步骤 A（真）  |                               |
|  +---------+     /    +-------------+                               |
|  | 检查条件 |----                                                    |
|  +---------+     \    +-------------+                               |
|                   +-->| 步骤 B（假）  |                               |
|                       +-------------+                               |
|                                                                    |
|  +---------+    +---------+    +---------+    +--+ 跳回              |
|  | 步骤 1  |--->| 步骤 2  |--->| 步骤 3  |--->|                     |
|  +---------+    +---------+    +---------+    +--+ 继续             |
|     ^                                            |                 |
|     +--------------------------------------------+                 |
|                                                                    |
|  优势：智能决策、批量处理、动态适应                                    |
+------------------------------------------------------------------+
```

第 23 章的脚本像一份"购物清单"——按顺序逐条执行。本章赋予脚本"大脑"——它能检查条件、能做选择、能重复执行。这是脚本从"静态文本"走向"动态程序"的关键一步。

### 1.3 本章覆盖的命令与概念

| 类别 | 命令/概念 | 用途 |
|------|----------|------|
| **条件测试** | `test`, `[ ]`, `[[ ]]`, `(( ))` | 测试文件属性、字符串、数值的真假 |
| **文件测试运算符** | `-f`, `-d`, `-e`, `-r`, `-w`, `-x`, `-s`, `-nt`, `-ot`, `-ef`, `-L`, `-p`, `-S`, `-b`, `-c`, `-g`, `-u`, `-k`, `-t` | 检查文件的各种属性和类型 |
| **字符串测试** | `=`, `!=`, `-z`, `-n`, `<`, `>`, `=~` | 比较字符串、检查长度、正则匹配 |
| **数值比较** | `-eq`, `-ne`, `-lt`, `-le`, `-gt`, `-ge` | 整数的大小比较 |
| **逻辑运算符** | `&&`, `||`, `!`, `-a`, `-o` | 组合多个测试条件 |
| **条件分支** | `if`/`elif`/`else`/`fi` | 根据条件选择不同的执行路径 |
| **模式匹配分支** | `case`/`esac` | 多个模式的匹配与分发 |
| **循环结构** | `for`, `while`, `until`, `select` | 重复执行代码块 |
| **流程控制** | `break`, `continue` | 跳出循环或跳过当前迭代 |

### 1.4 本章目标

完成本章后，你将能够：

- 在 `test`、`[ ]`、`[[ ]]` 之间做出正确的选择，理解它们的本质区别
- 使用全部 18 种文件测试运算符检查文件的各种属性
- 使用字符串比较、正则匹配（`=~`）和数值比较进行条件判断
- 正确组合逻辑运算符（`&&`、`||`、`!`）构建复杂条件表达式
- 使用 `if`/`elif`/`else`/`fi` 构建多分支条件结构
- 使用 `case`/`esac` 进行简洁的多模式匹配
- 在 `for` 循环中遍历列表、数组、通配符展开和命令输出
- 使用 `while` 和 `until` 进行条件驱动的循环
- 使用 `break n` 和 `continue n` 控制多层嵌套循环的流程
- 使用 `select` 创建简洁的交互式菜单

### 1.5 前置准备

本章基于 Ubuntu 24.04 LTS，使用 Bash 5.x。

```bash
# 确认 Bash 版本
echo $BASH_VERSION
# 输出示例：5.2.21(1)-release

# 创建一个练习目录
mkdir -p ~/bash-lesson24
cd ~/bash-lesson24
echo "练习目录已创建: $(pwd)"
```

---

## 2. 核心概念

### 2.1 条件测试的本质：退出码、真与假

在深入 `[ ]` 和 `[[ ]]` 的细节之前，你必须理解一个根本原则：**Bash 没有布尔类型。条件判断完全依赖于命令的退出码（Exit Code）**。

```
+------------------------------------------------------------------+
|                    Bash 中的"真"与"假"                                 |
|                                                                  |
|  退出码 0  = 成功 = 真（True）                                      |
|  退出码 非0 = 失败 = 假（False）                                     |
|                                                                  |
|  if command; then                                                  |
|      # command 退出码为 0 时执行                                     |
|  else                                                              |
|      # command 退出码非 0 时执行                                     |
|  fi                                                                |
|                                                                  |
|  注意：这与大多数编程语言相反！                                       |
|  在 C/Java/Python 中：0 = false, 非0 = true                        |
|  在 Bash 中：           0 = true,  非0 = false                     |
+------------------------------------------------------------------+
```

```bash
# 演示：退出码决定"真"与"假"
echo "=== exit 0（成功）==="
if true; then     # true 命令总是返回 0
    echo "true 命令返回 0，所以执行了这个分支"
fi

echo ""
echo "=== exit 1（失败）==="
if false; then    # false 命令总是返回 1
    echo "这行不会被执行"
else
    echo "false 命令返回 1，所以执行了这个分支"
fi

echo ""
echo "=== 任何命令都可以作为条件 ==="
if grep -q "root" /etc/passwd; then
    echo "grep 找到了 root，退出码 0 => 条件为真"
fi

if ls /nonexistent 2>/dev/null; then
    echo "不会执行"
else
    echo "ls 失败了，退出码非 0 => 条件为假"
fi
```

这个设计哲学意味着：**任何命令都可以直接用作 `if` 的条件**，不需要专门的"布尔表达式"——命令成功即为真，失败即为假。

### 2.2 三种条件测试方式：test, [ ], 和 [[ ]]

Bash 提供了三种语法来构造条件测试：

```
+------------------------------------------------------------------+
|                    三种条件测试方式对比                                |
|                                                                    |
|  方式        本质                        POSIX  Bash  推荐度         |
|  --------------------------------------------------------------  |
|  test expr   命令（Bash 内置版本）        是     是    ★★☆☆          |
|  [ expr ]    test 的别名（需要 ] 结尾）   是     是    ★★★☆          |
|  [[ expr ]]  Bash 关键字（增强版）        否     是    ★★★★★         |
|  (( expr ))  算术条件（整数专用）         否     是    ★★★★★         |
+------------------------------------------------------------------+
```

#### 2.2.1 test 命令

`test` 是最原始的方式。它评估一个表达式，返回 0（真）或 1（假）。

```bash
# test 的基本语法
test -f /etc/passwd         # 测试文件是否存在且为普通文件
echo "exit code: $?"         # 0 = 真

test 5 -gt 3                # 测试 5 > 3
echo "exit code: $?"         # 0 = 真

test "hello" = "world"      # 测试字符串相等
echo "exit code: $?"         # 1 = 假
```

#### 2.2.2 [ ]（单中括号）—— test 的语法糖

`[ ]` 是 `test` 命令的别名。它看起来像语法结构，但实际上是一个**命令**（`/usr/bin/[`）。

```bash
# [ ] 就是 test，只是语法上需要以 ] 结尾
[ -f /etc/passwd ]           # 等价于 test -f /etc/passwd
# 注意：] 前必须有空格！左括号 [ 后也必须有空格！

which "["                     # 查看 [ 命令的位置
# 输出：/usr/bin/[   （真的有一个叫 [ 的可执行文件！）
```

**`[ ]` 的三大陷阱：**

```bash
# 陷阱 1：单词分割（Word Splitting）—— 不加引号的变量会被分割
var="hello world"
# [ $var = "hello world" ]     # 错误！展开后：too many arguments
[ "$var" = "hello world" ]     # 正确！引号保护了含空格的变量

# 陷阱 2：空变量导致的语法错误
unset name
# [ $name = "hello" ]          # 错误！展开后：[ = hello ]（缺少操作数）
[ "$name" = "hello" ]          # 正确！展开后：[ "" = "hello" ]
# 防御性写法：
[ "${name:-}" = "hello" ]      # 确保空值时也有一个空字符串

# 陷阱 3：文件名展开（Globbing）
# [ *.txt = "*.txt" ]          # 危险！*.txt 会展开成文件列表
[ "*.txt" = "*.txt" ]          # 正确：引号阻止展开
```

#### 2.2.3 [[ ]]（双中括号）—— Bash 增强版

`[[ ]]` 是 Bash 的**关键字（Keyword）**，不是命令。这意味着它拥有特殊的解析规则，克服了 `[ ]` 的大部分局限。

```bash
# [[ ]] 是关键字，不是命令
type "["                      # [ is a shell builtin （也是外部命令）
type "[["                     # [[ is a shell keyword  （纯粹的语法结构）
which "[["                    # 没有对应的可执行文件！
```

**[[ ]] 相比 [ ] 的七大优势：**

```bash
# 优势 1：自动防止单词分割——不需要给变量加引号
var="hello world"
[[ $var = "hello world" ]]    # 正确！无需引号保护
# （但最佳实践：依然建议加引号，保持习惯一致性）

# 优势 2：支持 && 和 || 而非过时的 -a 和 -o
[[ -f /etc/passwd && -r /etc/passwd ]]     # 直观的逻辑与
[ -f /etc/passwd -a -r /etc/passwd ]       # [ ] 只能用 -a -o（过时且易错）

# 优势 3：支持正则表达式匹配（=~）
[[ "hello123" =~ ^[a-z]+[0-9]+$ ]]         # Bash 原生正则！
echo "匹配结果: $?"

# 优势 4：支持模式匹配（== 配合通配符）
[[ "hello.txt" == *.txt ]]                 # 模式匹配（非正则）
echo "是 .txt 文件: $?"

# 优势 5：词法比较 < 和 >（而非重定向）
[[ "apple" < "banana" ]]                   # 字符串比较
# [ "apple" < "banana" ]                   # 在 [ ] 中 < 是重定向！需要用 \<

# 优势 6：空变量安全
unset undefined
[[ $undefined = "test" ]]                  # 安全，不会报语法错误
# [ $undefined = "test" ]                  # 报错：unary operator expected

# 优势 7：括号分组（使用 && || 配合 ()）
[[ ( -f /etc/passwd && -r /etc/passwd ) || $USER = "root" ]]
# 注意：在 [[ ]] 中，() 不需要转义，而在 [ ] 中需要 \( ... \)
```

#### 2.2.4 (( ))（双圆括号）—— 算术测试

`(( ))` 专门用于整数算术条件，使用 C 语言风格的比较符号。

```bash
# (( )) 用于算术，使用自然的 > < >= <= == !=
x=10; y=3
(( x > y )) && echo "x > y"     # 自然的比较符号
(( x == 10 )) && echo "x == 10"
(( y < 5 )) && echo "y < 5"

# 对比：[ ] 中必须用 -lt -gt 等操作符
[ $x -gt $y ] && echo "x > y"   # 不直观的 -gt

# (( )) 中的赋值和自增
(( count = 5 ))
(( count++ ))
(( result = x * y + 2 ))
echo "count=$count, result=$result"

# (( )) 作为条件：非零 = 真，零 = 假
# 注意：这与 Bash 的 "0 = 真" 相反！
(( 1 )) && echo "1 为真"
(( 0 )) || echo "0 为假（注意：与退出码语义相反！）"

# 变量不需要 $ 前缀
x=5
(( x > 3 && x < 10 )) && echo "x 在 3 和 10 之间"
```

**选择建议速查表：**

| 场景 | 推荐使用 | 原因 |
|------|---------|------|
| 算术比较 | `(( ))` | 语法自然，支持所有 C 风格操作符 |
| 字符串比较、文件测试 | `[[ ]]` | 安全、功能强、不用加引号 |
| POSIX 兼容脚本 | `[ ]` | `/bin/sh` 只支持 `[ ]` |
| 正则匹配 | `[[ ]]` 的 `=~` | `[ ]` 不支持正则 |
| 模式匹配（通配符） | `[[ ]]` 的 `==` | `[ ]` 不支持 |
| 组合多个测试 | `[[ ]]` | 支持 `&&` `||`，括号分组无需转义 |

### 2.3 文件测试运算符全集

文件测试是 Shell 脚本中最常用的条件测试类别。以下列出全部 18 种文件测试运算符。

#### 2.3.1 文件类型测试（8 种）

```bash
# 准备测试环境
mkdir -p /tmp/bash-lesson24-test
touch /tmp/bash-lesson24-test/normal-file
ln -sf /tmp/bash-lesson24-test/normal-file /tmp/bash-lesson24-test/symlink 2>/dev/null
mkfifo /tmp/bash-lesson24-test/myfifo 2>/dev/null
cd /tmp/bash-lesson24-test

echo "=== 文件类型测试 ==="

# -e file : 存在（Exist，任何类型文件）
[ -e normal-file ] && echo "-e: normal-file 存在 => 真"
[ -e /nonexistent ] || echo "-e: /nonexistent 不存在 => 假"

# -f file : 普通文件（Regular File）
[ -f normal-file ] && echo "-f: normal-file 是普通文件 => 真"
[ -f /etc ] || echo "-f: /etc 是目录不是普通文件 => 假"

# -d file : 目录（Directory）
[ -d /etc ] && echo "-d: /etc 是目录 => 真"
[ -d normal-file ] || echo "-d: normal-file 不是目录 => 假"

# -L file : 符号链接（Symbolic Link）
[ -L symlink ] && echo "-L: symlink 是符号链接 => 真"
[ -L normal-file ] || echo "-L: normal-file 不是符号链接 => 假"

# -p file : 命名管道（Named Pipe / FIFO）
[ -p myfifo ] && echo "-p: myfifo 是命名管道 => 真"

# -S file : Socket
# 系统级 socket 通常需要 root 权限访问
[ -S /run/systemd/private ] 2>/dev/null && echo "-S: 发现 Socket" || echo "-S: 无权限或不存在（正常）"

# -b file : 块设备（Block Device，如硬盘）
[ -b /dev/sda ] && echo "-b: /dev/sda 是块设备 => 真"
[ -b /dev/null ] || echo "-b: /dev/null 不是块设备 => 假"

# -c file : 字符设备（Character Device，如终端）
[ -c /dev/null ] && echo "-c: /dev/null 是字符设备 => 真"
[ -c /dev/sda ] || echo "-c: /dev/sda 不是字符设备 => 假"

# 清理符号链接和管道（保留 normal-file 给后续测试用）
rm -f symlink myfifo
```

#### 2.3.2 文件权限测试（4 种）

```bash
# 创建不同权限的测试文件
echo "content" > /tmp/bash-lesson24-test/perm-file
chmod 600 /tmp/bash-lesson24-test/perm-file  # rw-------

echo "=== 文件权限测试 ==="

# -r file : 可读（Readable）
[ -r /tmp/bash-lesson24-test/perm-file ] && echo "-r: 可读 => 真"

# -w file : 可写（Writable）
[ -w /tmp/bash-lesson24-test/perm-file ] && echo "-w: 可写 => 真"

# -x file : 可执行（eXecutable）
[ -x /tmp/bash-lesson24-test/perm-file ] || echo "-x: 不可执行(600) => 假"
chmod +x /tmp/bash-lesson24-test/perm-file
[ -x /tmp/bash-lesson24-test/perm-file ] && echo "-x: 加+x后可执行 => 真"

# -s file : 非空（Size > 0）
[ -s /tmp/bash-lesson24-test/perm-file ] && echo "-s: 文件非空 => 真"
> /tmp/bash-lesson24-test/empty-file
[ -s /tmp/bash-lesson24-test/empty-file ] || echo "-s: 空文件 => 假"
```

**关于 root 用户的特殊提醒：** root 对任何文件都视为有 `-r` 和 `-w` 权限（即使文件模式是 000）。只有 `-x` 对 root 也遵循实际的执行位——目录必须有执行位才能进入。

#### 2.3.3 文件时间与同一性测试（3 种）

```bash
echo "=== 文件时间与同一性测试 ==="

# -nt : newer than — 修改时间更新
touch -t 202501010000 /tmp/bash-lesson24-test/old-file
touch -t 202601010000 /tmp/bash-lesson24-test/new-file
[ /tmp/bash-lesson24-test/new-file -nt /tmp/bash-lesson24-test/old-file ] && echo "-nt: new-file 更新 => 真"
[ /tmp/bash-lesson24-test/old-file -nt /tmp/bash-lesson24-test/new-file ] || echo "-nt: old-file 不更新 => 假"

# -ot : older than — 修改时间更旧
[ /tmp/bash-lesson24-test/old-file -ot /tmp/bash-lesson24-test/new-file ] && echo "-ot: old-file 更旧 => 真"

# -ef : 两个路径指向同一个文件（比较 inode 和设备号）
ln /tmp/bash-lesson24-test/normal-file /tmp/bash-lesson24-test/hardlink 2>/dev/null
[ /tmp/bash-lesson24-test/normal-file -ef /tmp/bash-lesson24-test/hardlink ] && echo "-ef: 硬链接指向同一文件 => 真"
[ /tmp/bash-lesson24-test/normal-file -ef /tmp/bash-lesson24-test/perm-file ] || echo "-ef: 不同文件 => 假"
```

#### 2.3.4 特殊权限与终端测试（5 种）

```bash
echo "=== 特殊权限测试 ==="

# -g file : SGID（Set Group ID）已设置
# SGID 目录：在其中创建的文件继承目录的组
ls -la /usr/bin/wall 2>/dev/null | grep -q '^...x..x..x' && echo "-g: /usr/bin/wall 有 SGID"

# -u file : SUID（Set User ID）已设置
# SUID：执行文件时以文件所有者的身份运行
[ -u /usr/bin/passwd ] && echo "-u: /usr/bin/passwd 有 SUID（需要以 root 修改密码）"

# -k file : Sticky bit 已设置
# Sticky 目录：只有文件所有者才能删除自己的文件（如 /tmp）
[ -k /tmp ] && echo "-k: /tmp 有 Sticky bit => 真"

# -t fd : 文件描述符 fd 是否连接到终端
[ -t 0 ] && echo "-t 0: stdin 是终端" || echo "-t 0: stdin 不是终端"
[ -t 1 ] && echo "-t 1: stdout 是终端" || echo "-t 1: stdout 不是终端"
echo "hello" | while read line; do
    [ -t 0 ] && echo "  管道中的 stdin 是终端" || echo "  管道中的 stdin 不是终端"
done

# 清理测试环境
rm -rf /tmp/bash-lesson24-test
```

**文件测试速查总表：**

| 运算符 | 含义 | 真条件 |
|--------|------|--------|
| `-f` | 普通文件 | 存在且为 regular file |
| `-d` | 目录 | 存在且为 directory |
| `-e` | 存在 | 任意类型文件存在 |
| `-L` | 符号链接 | 存在且为 symbolic link |
| `-p` | 命名管道 | 存在且为 named pipe (FIFO) |
| `-S` | Socket | 存在且为 socket |
| `-b` | 块设备 | 存在且为 block device |
| `-c` | 字符设备 | 存在且为 character device |
| `-r` | 可读 | 当前用户有 read 权限 |
| `-w` | 可写 | 当前用户有 write 权限 |
| `-x` | 可执行 | 当前用户有 execute 权限 |
| `-s` | 非空 | 存在且大小大于 0 字节 |
| `-nt` | 更新 | file1 比 file2 修改时间晚 |
| `-ot` | 更旧 | file1 比 file2 修改时间早 |
| `-ef` | 同一文件 | 两个路径指向相同 inode |
| `-g` | SGID | 设置了 set-group-id 位 |
| `-u` | SUID | 设置了 set-user-id 位 |
| `-k` | Sticky | 设置了 sticky 位 |
| `-t` | 终端 | 文件描述符连接到终端 |

### 2.4 字符串测试运算符

```bash
# = 或 == : 字符串相等（在 [[ ]] 中两者等价）
str="hello"
[ "$str" = "hello" ] && echo "[ ] 用 = 判断相等"
[[ $str == "hello" ]] && echo "[[ ]] 用 == 判断相等（= 也可以）"
# 注意：在 [ ] 中 = 是 POSIX 标准，== 不是所有实现都支持

# != : 字符串不相等
[[ "apple" != "banana" ]] && echo "不相等 => 真"

# -z string : 字符串为空（Zero length）
empty=""
[ -z "$empty" ] && echo "empty 是空字符串 => 真"
[ -z "hello" ] || echo "hello 不是空字符串 => 假"

# -n string : 字符串非空（Non-zero length）
[ -n "hello" ] && echo "hello 非空 => 真"
[ -n "$empty" ] || echo "empty 是空字符串 => 假"

# < 和 > : 字典序比较（在 [[ ]] 中，比较的是 ASCII/LC_COLLATE 顺序）
[[ "apple" < "banana" ]] && echo "apple < banana（字典序）=> 真"
[[ "apple" > "banana" ]] || echo "apple > banana => 假"
# 在 [ ] 中必须转义： [ "apple" \< "banana" ]
```

**重点：`[[ ]]` 中的 `==` 支持通配符模式匹配（Glob Pattern Matching）：**

```bash
# == 在 [[ ]] 中右侧可以使用通配符（非正则！）
filename="document.txt"
[[ $filename == *.txt ]] && echo "以 .txt 结尾 => 真"
[[ $filename == *.md ]] || echo "不是 .md => 假"
[[ $filename == doc* ]] && echo "以 doc 开头 => 真"

# 通配符支持：* 任意字符, ? 单个字符, [...] 字符集
[[ "hello" == h*o ]] && echo "通配符 * 匹配任意字符 => 真"
[[ "hello" == h?llo ]] && echo "通配符 ? 匹配单个字符 => 真"
[[ "hello" == [a-z]* ]] && echo "以小写字母开头 => 真"

# 正则表达式匹配：=~ （仅在 [[ ]] 中支持）
[[ "hello123" =~ ^[a-z]+[0-9]+$ ]] && echo "正则匹配 => 真"
[[ "HELLO" =~ ^[a-z]+$ ]] || echo "大写不匹配小写模式 => 假"

# =~ 配合 BASH_REMATCH 捕获分组
if [[ "John Doe, Age: 30" =~ ([A-Za-z]+)[[:space:]]([A-Za-z]+),\ Age:\ ([0-9]+) ]]; then
    echo "全匹配: ${BASH_REMATCH[0]}"
    echo "名: ${BASH_REMATCH[1]}"
    echo "姓: ${BASH_REMATCH[2]}"
    echo "年龄: ${BASH_REMATCH[3]}"
fi
# BASH_REMATCH[0] = 整个正则匹配的内容
# BASH_REMATCH[n] = 第 n 个括号捕获组的内容
```

### 2.5 数值比较运算符

```bash
# 整数比较使用 [ ] 或 [[ ]] 中的专用操作符
# 注意：这些操作符只用于整数！

a=10; b=20

# -eq : 相等（equal）
[ "$a" -eq 10 ] && echo "a == 10"

# -ne : 不等（not equal）
[ "$a" -ne "$b" ] && echo "a != b"

# -lt : 小于（less than）
[ "$a" -lt "$b" ] && echo "a < b"

# -le : 小于等于（less than or equal）
[ "$a" -le 10 ] && echo "a <= 10"

# -gt : 大于（greater than）
[ "$b" -gt "$a" ] && echo "b > a"

# -ge : 大于等于（greater than or equal）
[ "$b" -ge 20 ] && echo "b >= 20"

# 在 [ ] 和 [[ ]] 中都可以使用以上操作符
# 但在 (( )) 中使用自然的符号更直观
(( a < b )) && echo "C 风格: a < b"
(( b >= 20 )) && echo "C 风格: b >= 20"

# 浮点数比较（Bash 本身不支持，需要 bc 或 awk）
x=3.14; y=2.71
if (( $(bc <<< "$x > $y") )); then
    echo "$x > $y（使用 bc）"
fi
```

### 2.6 逻辑运算符

```bash
# && : 逻辑与（AND）—— [[ ]] 和 (( )) 中使用
[[ -f /etc/passwd && -r /etc/passwd ]] && echo "文件存在且可读"

# || : 逻辑或（OR）
[[ "$USER" = "root" || -w /etc/hosts ]] && echo "是 root 或 /etc/hosts 可写"

# ! : 逻辑非（NOT）—— 在任何测试结构中使用
[[ ! -f /nonexistent ]] && echo "文件不存在 => 真"
[ ! -d /tmp ] || echo "/tmp 存在"

# -a : 逻辑与（AND）—— 仅 [ ] 中使用（过时，不推荐）
[ -f /etc/passwd -a -r /etc/passwd ] && echo "[ ] 中的 -a"

# -o : 逻辑或（OR）—— 仅 [ ] 中使用（过时，不推荐）
[ "$USER" = "root" -o -w /etc/hosts ] && echo "[ ] 中的 -o"

# 为什么 [ ] 中的 -a 和 -o 不推荐？
# 问题：POSIX 标准不明确它们的优先级，不同实现可能行为不同
# 而且嵌套复杂时容易产生歧义
# 推荐：在 [ ] 外使用 Shell 的 && 和 || 组合多个 [ ] 调用
[ -f /etc/passwd ] && [ -r /etc/passwd ] && echo "两个独立的 [ ] 更安全"

# [[ ]] 中括号分组的优先级
[[ ( -f /etc/passwd && -r /etc/passwd ) || $USER = "root" ]] && echo "（文件存在且可读）或 是root"

# 注意：在 [[ ]] 中，() 用于分组，不需要转义
# 而在 [ ] 中需要转义为 \( ... \)
```

**Shell 级别的 && 和 || 短路求值：**

```bash
# Shell 的 && 和 || 也可以用于条件链（不仅仅是 [[ ]] 内部）
# 它们遵循短路求值（Short-circuit Evaluation）

# && ：前面成功才执行后面
[ -d /tmp ] && echo "目录存在" && echo "继续执行"
# 等效于：if [ -d /tmp ]; then echo "目录存在"; echo "继续执行"; fi

# || ：前面失败才执行后面
[ -d /nonexistent ] || echo "目录不存在（前面的 [ ] 失败了才执行这行）"

# 三元模式：cmd && action_on_success || action_on_failure
grep -q "root" /etc/passwd && echo "找到root" || echo "没找到root"
# 注意：如果 action_on_success 也失败了，action_on_failure 也会执行！
# 安全做法：使用 if/then/else 替代 &&/|| 链
```

**逻辑运算符优先级速查：**

```
[[ ]] 内部优先级（从高到低）：
  1. !    （非）
  2. &&   （与）
  3. ||   （或）
  
可以通过 () 改变优先级，类似数学中的括号。
在 [ ] 中，-a 的优先级高于 -o，但不同实现可能有差异，
因此强烈建议使用 [[ ]] 或分离的 [ ] 调用。
```

---

## 3. 命令详解

### 3.1 if/elif/else/fi —— 条件分支

`if` 是 Bash 中最基本的条件分支结构。

#### 3.1.1 基本语法

```
if command; then
    命令序列
elif command; then      # elif = else if（可选，可以有多个）
    命令序列
else                    # 可选
    命令序列
fi                      # fi 结束（if 倒过来）
```

`then` 可以写在 `if` 同一行（用分号分隔）或单独一行：

```bash
# 写法1：同一行（分号必需）
if [ -f /etc/passwd ]; then
    echo "文件存在"
fi

# 写法2：单独一行（更易读，不需要分号）
if [ -f /etc/passwd ]
then
    echo "文件存在"
fi
```

#### 3.1.2 完整示例

```bash
cat > /tmp/if-demo.sh << 'SCRIPT'
#!/bin/bash

read -p "请输入一个数字: " num

if ! [[ "$num" =~ ^-?[0-9]+$ ]]; then
    echo "错误: 请输入一个整数" >&2
    exit 1
elif (( num > 0 )); then
    echo "$num 是正数"
elif (( num < 0 )); then
    echo "$num 是负数"
else
    echo "$num 是零"
fi
SCRIPT

bash /tmp/if-demo.sh <<< "42"
bash /tmp/if-demo.sh <<< "-7"
bash /tmp/if-demo.sh <<< "0"
bash /tmp/if-demo.sh <<< "abc"
rm -f /tmp/if-demo.sh
```

#### 3.1.3 实用模式：文件存在性检查

```bash
cat > /tmp/safe-create.sh << 'SCRIPT'
#!/bin/bash

config_file="${1:-/tmp/myconfig.conf}"

if [ -f "$config_file" ]; then
    echo "配置文件 '$config_file' 已存在"
    if [ -r "$config_file" ]; then
        echo "  文件可读，内容行数: $(wc -l < "$config_file")"
    else
        echo "  警告: 文件不可读" >&2
    fi
elif [ -d "$config_file" ]; then
    echo "错误: '$config_file' 是一个目录，不是文件" >&2
    exit 1
else
    echo "创建配置文件: $config_file"
    echo "# Config created on $(date)" > "$config_file"
    echo "  完成！"
fi
SCRIPT

bash /tmp/safe-create.sh /tmp/test-config
rm -f /tmp/safe-create.sh /tmp/test-config
```

#### 3.1.4 嵌套 if vs elif

```bash
# 不推荐：过度嵌套
if [ "$a" -gt 0 ]; then
    if [ "$a" -lt 100 ]; then
        if [ "$a" -ne 50 ]; then
            echo "0 < a < 100 且 a != 50"
        fi
    fi
fi

# 推荐：使用 elif 或逻辑组合
if [ "$a" -gt 0 ] && [ "$a" -lt 100 ] && [ "$a" -ne 50 ]; then
    echo "0 < a < 100 且 a != 50（扁平化）"
fi
# 或使用 [[ ]]
if [[ $a -gt 0 && $a -lt 100 && $a -ne 50 ]]; then
    echo "0 < a < 100 且 a != 50（[[ ]] 版本）"
fi
```

### 3.2 case/esac —— 模式匹配分支

当需要根据一个变量的值匹配多个可能的情况时，`case` 比一长串 `if/elif` 更清晰。

#### 3.2.1 基本语法

```
case expression in
    pattern1)
        命令序列
        ;;              # ;; 表示分支结束（类似 break）
    pattern2 | pattern3) # | 表示"或"——匹配 pattern2 或 pattern3
        命令序列
        ;;
    *)                  # * 匹配所有（默认分支）
        命令序列
        ;;
esac                     # esac 结束（case 倒过来）
```

`;;` 是每个分支的终止符。Bash 4.0+ 还支持 `;&`（继续执行下一个分支）和 `;;&`（继续测试下一个模式），但 `;;` 是最常用的。

#### 3.2.2 模式语法

```bash
# case 中的模式可以使用：
#   *        : 匹配任意字符串（包括空）
#   ?        : 匹配任意单个字符
#   [...]    : 匹配字符集中的任意字符
#   |        : 分隔多个模式（或）
#   [a-z]    : 字符范围

cat > /tmp/case-demo.sh << 'SCRIPT'
#!/bin/bash

read -p "请输入 (yes/no/quit): " answer

case "$answer" in
    y|Y|yes|YES|Yes)
        echo "你选择了 YES"
        ;;
    n|N|no|NO|No)
        echo "你选择了 NO"
        ;;
    q|quit|exit)
        echo "退出程序"
        exit 0
        ;;
    "")
        echo "你没有输入任何内容"
        ;;
    *)
        echo "无法识别的输入: '$answer'"
        echo "请输入 yes、no 或 quit"
        ;;
esac
SCRIPT

echo "=== 测试 case ==="
bash /tmp/case-demo.sh <<< "yes"
bash /tmp/case-demo.sh <<< "N"
bash /tmp/case-demo.sh <<< "quit"
bash /tmp/case-demo.sh <<< "maybe"
rm -f /tmp/case-demo.sh
```

#### 3.2.3 字符模式匹配实战

```bash
cat > /tmp/char-classify.sh << 'SCRIPT'
#!/bin/bash

read -p "请输入一个字符: " -n 1 char
echo ""  # 换行

case "$char" in
    [0-9])
        echo "'$char' 是数字"
        ;;
    [a-z])
        echo "'$char' 是小写字母"
        ;;
    [A-Z])
        echo "'$char' 是大写字母"
        ;;
    [![:alnum:]])
        echo "'$char' 是特殊字符"
        ;;
    *)
        echo "'$char' 是其他字符"
        ;;
esac
SCRIPT

echo "=== 字符分类器 ==="
bash /tmp/char-classify.sh <<< "5"
bash /tmp/char-classify.sh <<< "g"
bash /tmp/char-classify.sh <<< "M"
bash /tmp/char-classify.sh <<< "@"
rm -f /tmp/char-classify.sh
```

#### 3.2.4 脚本参数解析（常见模式）

```bash
cat > /tmp/arg-parser.sh << 'SCRIPT'
#!/bin/bash

# 使用 case 解析命令行参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            echo "Usage: $0 [options]"
            echo "  -v, --verbose   详细输出"
            echo "  -o, --output    输出文件"
            echo "  -h, --help      帮助"
            exit 0
            ;;
        -v|--verbose)
            echo "详细模式开启"
            VERBOSE=true
            shift
            ;;
        -o|--output)
            OUTPUT="$2"
            echo "输出文件: $OUTPUT"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "未知选项: $1" >&2
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

echo "剩余参数: $@"
SCRIPT

chmod +x /tmp/arg-parser.sh
/tmp/arg-parser.sh -v -o result.txt hello world
rm -f /tmp/arg-parser.sh
```

#### 3.2.5 case vs if/elif 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 单一变量匹配多个值 | `case` | 更简洁，支持模式匹配 |
| 复杂条件（多个变量、范围判断） | `if/elif` | `case` 不适合复杂逻辑 |
| 字符串模式匹配（通配符） | `case` | 天然的 Glob 模式支持 |
| 脚本参数解析 | `case` | 业界标准做法 |
| 可以用 `|` 合并的分支 | `case` | 避免重复代码 |

### 3.3 for 循环 —— 四种遍历方式

`for` 循环是 Bash 中最灵活的循环结构，支持四种不同的遍历方式。

#### 3.3.1 列表形式（List Form）

最基础的形式：遍历一个由空格分隔的列表。

```bash
# 基础列表遍历
echo "=== 列表形式 ==="
for fruit in 苹果 香蕉 橙子 葡萄 西瓜; do
    echo "  $fruit"
done

echo ""

# 列表中的元素可以用引号保护含空格的项
for item in "hello world" "ubuntu linux" "bash script"; do
    echo "  [$item]"
done

echo ""

# 使用 {start..end} 生成序列
echo "--- {1..5} 序列 ---"
for i in {1..5}; do
    echo "  迭代 $i"
done

echo "--- {a..e} 字母 ---"
for ch in {a..e}; do
    echo "  字母: $ch"
done

echo "--- {start..end..step} 步长 ---"
for i in {0..20..5}; do
    echo "  步长5: $i"
done
```

#### 3.3.2 C 风格（C-style）

使用类似 C 语言的三个表达式语法：`(( init; condition; increment ))`。

```bash
echo "=== C 风格 for ==="

# 基本语法
for ((i=0; i<5; i++)); do
    echo "  迭代 $i"
done

echo ""

# 计数递减
echo "--- 倒计数 ---"
for ((i=5; i>0; i--)); do
    echo "  倒计时: $i"
done
echo "  发射！"

echo ""

# 多个变量
echo "--- 多变量 ---"
for ((i=0, j=10; i<5; i++, j--)); do
    echo "  i=$i, j=$j"
done

echo ""

# 遍历索引数组
echo "--- 遍历数组 ---"
arr=("zero" "one" "two" "three" "four")
for ((i=0; i<${#arr[@]}; i++)); do
    echo "  arr[$i] = ${arr[$i]}"
done
```

#### 3.3.3 通配符展开（Glob Expansion）

直接使用通配符让 Shell 展开文件列表。

```bash
echo "=== 通配符展开 ==="

# 创建测试文件
mkdir -p /tmp/for-test
touch /tmp/for-test/file{A,B,C}.txt
touch /tmp/for-test/data{1,2}.csv
touch /tmp/for-test/readme.md

# 遍历匹配的文件
echo "--- 所有 .txt 文件 ---"
for file in /tmp/for-test/*.txt; do
    echo "  $(basename "$file")"
done

echo ""
echo "--- 所有文件 ---"
for file in /tmp/for-test/*; do
    echo "  $(basename "$file")"
done

echo ""
echo "--- 文件存在性检查 ---"
# 如果通配符没有匹配到任何文件，默认情况下模式保持原样
# 使用 shopt -s nullglob 可以让空匹配变为空（推荐在脚本中设置）
for file in /tmp/for-test/*.jpg; do
    echo "  找到: $(basename "$file")"
done
echo "  （没有 .jpg 文件，但模式保持原样）"

# 正确做法：先检查
echo ""
echo "--- 安全遍历 ---"
shopt -s nullglob  # 没有匹配时扩展为空
for file in /tmp/for-test/*.jpg; do
    # 当 nullglob 开启时，没有匹配就不会进入循环
    echo "  找到: $(basename "$file")"
done
echo "  （nullglob 开启，空匹配 => 循环体不执行）"
shopt -u nullglob  # 恢复默认

rm -rf /tmp/for-test
```

#### 3.3.4 命令输出迭代

使用命令替换 `$()` 将命令的输出作为遍历列表。

```bash
echo "=== 命令输出迭代 ==="

# 遍历命令输出的每一行
echo "--- ls 输出 ---"
for item in $(ls /usr/bin | head -5); do
    echo "  $item"
done

echo ""

# 遍历 find 输出（处理含空格的文件名需要特殊处理）
echo "--- find + while（安全处理含空格文件名） ---"
find /tmp -maxdepth 1 -name "*.txt" -type f 2>/dev/null | while IFS= read -r file; do
    echo "  $(basename "$file")"
done

echo ""

# 遍历文件内容
echo "--- 读取文件行 ---"
printf "line1\nline2\nline3\n" > /tmp/lines.txt
for line in $(cat /tmp/lines.txt); do
    echo "  [$line]"
done
echo "  （使用 for + cat：每行分割成单词）"

echo ""
echo "  （使用 while read：每行正确读取）"
while IFS= read -r line; do
    echo "  [$line]"
done < /tmp/lines.txt
rm -f /tmp/lines.txt
```

**关键区别：`for line in $(cat file)` vs `while read line`**

```
for line in $(cat file):
  - Shell 先展开 $(cat file) 为空格分隔的单词列表
  - 每一"行"还会进一步按空格分割
  - 如果某行包含空格，会被拆成多个单词
  - 大文件会先全部读入内存

while IFS= read -r line; do ... done < file:
  - 逐行读取，保留每行的原始内容（包括空格）
  - 不会按空格分割
  - 内存友好（逐行处理，不一次性加载）
  - 这是读取文件的推荐方式
```

### 3.4 while 循环 —— 条件驱动的重复

`while` 在条件为真时重复执行循环体。

#### 3.4.1 基本语法

```
while command; do
    命令序列
done
```

循环体在每次迭代前检查条件：若命令退出码为 0（真），执行循环体；否则退出循环。

```bash
# 简单计数器
echo "=== while 计数器 ==="
count=1
while (( count <= 5 )); do
    echo "  第 $count 次迭代"
    ((count++))
done
echo "循环结束，count=$count"
```

#### 3.4.2 读取文件（最常用模式）

```bash
echo "=== 逐行读取 /etc/passwd（前5个普通用户）==="
count=0
while IFS=: read -r username _ uid _ _ _ shell; do
    if [ "$uid" -ge 1000 ] 2>/dev/null; then
        echo "  用户: $username (UID: $uid, Shell: $shell)"
        ((count++))
        [ $count -ge 3 ] && break
    fi
done < /etc/passwd
```

**`while read` 详解：**

```bash
# IFS=  : 不删除行首行尾空白（IFS 置空）
# read -r  : 不将反斜杠解释为转义字符
# _  :  丢弃的字段（占位符）
# done < file : 将文件重定向到循环的 stdin

# 如果没有 IFS=，行首/尾空格和制表符会被删除
# 如果没有 -r，输入中的 \n、\t 等会被解释为转义

# 标准模式：
while IFS= read -r line; do
    echo "  [$line]"
done < somefile
```

#### 3.4.3 无限循环与条件退出

```bash
echo "=== 带超时的输入等待 ==="
start=$(date +%s)
timeout=5

echo "请在 $timeout 秒内输入内容（演示：超时自动退出）:"

# 使用 read -t 的内置超时（更优雅的方式）
if read -t 3 -p "> " input 2>/dev/null; then
    echo "你输入了: $input"
else
    echo ""
    echo "超时！（read -t 方式）"
fi
```

#### 3.4.4 管道中的 while —— 子 Shell 陷阱

```bash
# 陷阱：管道中的 while 在子 Shell 中运行，变量修改不会保留！
echo "=== 管道 while 的子 Shell 问题 ==="

count=0
printf "a\nb\nc\n" | while IFS= read -r line; do
    ((count++))
    echo "  在循环内: count=$count"
done
echo "循环外: count=$count（期望 3，实际 0！子 Shell 的修改丢失了）"

echo ""

# 解决方案1：使用 Process Substitution（进程替换）
count=0
while IFS= read -r line; do
    ((count++))
done < <(printf "a\nb\nc\n")
echo "进程替换方案: count=$count（正确！）"

echo ""

# 解决方案2：使用 Here String（数据量小的时候）
count=0
while IFS= read -r line; do
    ((count++))
done <<< $'a\nb\nc'
echo "Here String方案: count=$count（正确！）"
```

### 3.5 until 循环 —— 条件取反的 while

`until` 与 `while` 相反：条件为**假**时执行循环体，条件为**真**时退出。

```
until command; do
    命令序列
done
# 等价于：
while ! command; do
    命令序列
done
```

```bash
echo "=== until 示例 ==="

# 等待文件出现
echo "--- 等待文件出现 ---"
> /tmp/wait-test-pending
(
    sleep 2
    rm -f /tmp/wait-test-pending
    > /tmp/wait-test-ready
) &
echo "等待 /tmp/wait-test-ready 出现..."
until [ -f /tmp/wait-test-ready ]; do
    echo -n "."
    sleep 0.5
done
echo ""
echo "文件出现了！"

# 重试模式
echo ""
echo "--- 网络重试模式 ---"
attempt=0
max_attempts=3
until ping -c 1 -W 1 127.0.0.1 > /dev/null 2>&1 || (( attempt >= max_attempts )); do
    ((attempt++))
    echo "  第 $attempt 次尝试..."
    sleep 1
done
if (( attempt < max_attempts )); then
    echo "  成功！（尝试了 $attempt 次）"
else
    echo "  失败：已尝试 $max_attempts 次"
fi

rm -f /tmp/wait-test-pending /tmp/wait-test-ready
```

### 3.6 break 与 continue —— 流程控制

#### 3.6.1 break：跳出循环

```bash
echo "=== break 演示 ==="

# 基本用法：跳出当前循环
echo "--- break 基础 ---"
for i in {1..10}; do
    if (( i == 5 )); then
        echo "  i=$i，跳出循环"
        break
    fi
    echo "  i=$i"
done

echo ""

# break n：跳出第 n 层嵌套循环
echo "--- break 2：跳出两层循环 ---"
for outer in {1..3}; do
    echo "外层: outer=$outer"
    for inner in {1..3}; do
        if (( outer == 2 && inner == 2 )); then
            echo "    内层: inner=$inner，break 2 跳出两层"
            break 2
        fi
        echo "    内层: inner=$inner"
    done
done
echo "跳出了双层循环，到这里了"
```

#### 3.6.2 continue：跳过当前迭代

```bash
echo ""
echo "=== continue 演示 ==="

# 基本用法：跳过当前迭代
echo "--- continue 基础 ---"
for i in {1..5}; do
    if (( i == 3 )); then
        echo "  跳过 i=$i"
        continue
    fi
    echo "  处理 i=$i"
done

echo ""

# continue n：跳过第 n 层循环的当前迭代
echo "--- continue 2：跳到外层循环的下一次 ---"
for outer in {1..3}; do
    echo "外层: outer=$outer"
    for inner in {1..3}; do
        if (( inner == 2 )); then
            echo "    内层: inner=$inner，continue 2 跳到外层下一个"
            continue 2
        fi
        echo "    内层: inner=$inner"
    done
done
```

**break n 和 continue n 的工作原理：**

```
n=1（默认）：跳出/跳过当前这一层循环
n=2：跳出/跳过包含当前循环的外层循环
n=3：跳出/跳过更外面一层

每层嵌套对应一个 n：
while ...; do      # n=3
  for ...; do      # n=2
    for ...; do    # n=1 (最内层)
      break 3      # 跳出所有三层
    done
  done
done
```

### 3.7 select —— 交互式菜单

`select` 是 Bash 最被低估的特性之一。它用一行代码创建一个带编号的交互式菜单，用户可以输入数字进行选择。

#### 3.7.1 基本语法

```
select variable in list; do
    命令序列
    # 用户输入存储在 $REPLY（数字）和 $variable（选中的值）中
    break  # 通常需要 break 退出 select 循环
done
```

```bash
cat > /tmp/select-demo.sh << 'SCRIPT'
#!/bin/bash

echo "=== 请选择你最喜欢的编程语言 ==="
PS3="请输入你的选择 (1-4): "  # PS3 是 select 的提示符

select lang in Python JavaScript Go Rust 退出; do
    case "$lang" in
        Python|JavaScript|Go|Rust)
            echo ""
            echo "你选择了: $lang"
            echo "  （REPLY=$REPLY）"
            ;;
        退出)
            echo "再见！"
            break
            ;;
        *)
            echo "无效选择，请重试"
            ;;
    esac
done
SCRIPT

echo "1" | bash /tmp/select-demo.sh
rm -f /tmp/select-demo.sh
```

#### 3.7.2 select 实战：系统管理菜单

```bash
cat > /tmp/sys-menu.sh << 'SCRIPT'
#!/bin/bash

PS3="选择操作 [1-5]: "

select action in "显示磁盘使用" "显示内存使用" "显示运行进程数" "显示当前用户" "退出"; do
    echo ""
    echo "=========================================="
    
    case "$REPLY" in
        1)
            echo "磁盘使用情况:"
            df -h / | tail -1 | awk '{print "  已用: " $3 " / 总计: " $2 " (" $5 ")"}'
            ;;
        2)
            echo "内存使用情况:"
            free -h | grep Mem | awk '{print "  已用: " $3 " / 总计: " $2}'
            ;;
        3)
            echo "运行中的进程数: $(ps aux | wc -l)"
            ;;
        4)
            echo "当前在线用户:"
            who
            ;;
        5)
            echo "再见！"
            break
            ;;
        *)
            echo "无效选择，请输入 1-5 之间的数字"
            ;;
    esac
    echo "=========================================="
    echo ""
done
SCRIPT

echo "5" | bash /tmp/sys-menu.sh
rm -f /tmp/sys-menu.sh
```

#### 3.7.3 PS3 自定义提示符

`PS3` 是 `select` 特有的提示符变量，默认为 `#?`。你可以设置为任何字符串。

```bash
PS3="选择 > "                          # 简单提示符
PS3=$'\n请选择一个选项: '               # 带换行的提示符
PS3="$(date '+%H:%M') - 你的选择: "     # 动态提示符
```

---

## 4. 实战练习

### 练习 24.1：文件类型分类器

**题目：**

编写脚本 `~/bash-lesson24/file-classify.sh`，接收一个路径作为参数，判断它是：
（1）不存在
（2）普通文件（输出大小和行数）
（3）目录（输出其中文件数量）
（4）符号链接（输出指向的目标）
（5）其他类型（块设备、字符设备等）

要求使用 `if/elif/else` 结构，至少使用 5 种不同的文件测试运算符。

**答案：**

```bash
cat > ~/bash-lesson24/file-classify.sh << 'SCRIPT'
#!/bin/bash

path="${1:?用法: $0 <路径>}"

echo "======================================"
echo "  文件类型分类器"
echo "======================================"
echo "检查: $path"
echo ""

if [ ! -e "$path" ]; then
    echo "状态: 路径不存在"
    
elif [ -L "$path" ]; then
    target=$(readlink -f "$path")
    if [ -e "$path" ]; then
        echo "状态: 符号链接（有效）"
    else
        echo "状态: 符号链接（已断开）"
    fi
    echo "目标: $target"
    
elif [ -f "$path" ]; then
    echo "状态: 普通文件"
    if [ -r "$path" ]; then
        echo "大小: $(wc -c < "$path") 字节"
        echo "行数: $(wc -l < "$path") 行"
    else
        echo "（文件不可读，无法统计大小和行数）"
    fi
    [ -s "$path" ] || echo "注意: 文件为空"

elif [ -d "$path" ]; then
    echo "状态: 目录"
    [ -r "$path" ] && echo "内容: $(ls -1 "$path" 2>/dev/null | wc -l) 个条目"
    [ -w "$path" ] && echo "权限: 可写"
    [ -x "$path" ] && echo "权限: 可进入"

elif [ -b "$path" ]; then
    echo "状态: 块设备"
    
elif [ -c "$path" ]; then
    echo "状态: 字符设备"
    
elif [ -p "$path" ]; then
    echo "状态: 命名管道（FIFO）"
    
elif [ -S "$path" ]; then
    echo "状态: Socket"
    
else
    echo "状态: 未知类型"
fi

echo "======================================"
SCRIPT

chmod +x ~/bash-lesson24/file-classify.sh

# 测试
echo "=== 测试1: 普通文件 ==="
echo "hello world" > /tmp/test-classify.txt
~/bash-lesson24/file-classify.sh /tmp/test-classify.txt

echo ""
echo "=== 测试2: 目录 ==="
~/bash-lesson24/file-classify.sh /etc

echo ""
echo "=== 测试3: 不存在的路径 ==="
~/bash-lesson24/file-classify.sh /nonexistent/path

rm -f /tmp/test-classify.txt
```

### 练习 24.2：密码强度校验器

**题目：**

编写脚本 `~/bash-lesson24/password-check.sh`，检查用户输入的密码是否满足以下要求：
（1）至少 8 个字符（使用 `${#var}`）
（2）至少包含一个大写字母（使用 `=~` 正则）
（3）至少包含一个小写字母
（4）至少包含一个数字
（5）至少包含一个特殊字符
（6）不包含空格

对每项检查分别输出通过/未通过，最后给出总体评估。

**答案：**

```bash
cat > ~/bash-lesson24/password-check.sh << 'SCRIPT'
#!/bin/bash

echo "======================================"
echo "  密码强度校验器"
echo "======================================"
echo "要求: 8位以上, 含大小写字母, 数字, 特殊字符, 无空格"
echo ""

read -s -p "请输入密码: " password
echo ""
read -s -p "再次输入确认: " confirm
echo ""

if [ "$password" != "$confirm" ]; then
    echo "错误: 两次输入的密码不一致！" >&2
    exit 1
fi

echo ""
echo "--- 逐项检查 ---"
score=0
max_score=6

# 1. 长度 >= 8
if [ ${#password} -ge 8 ]; then
    echo "  [通过] 长度 >= 8 (当前: ${#password})"
    ((score++))
else
    echo "  [失败] 长度不足 (当前: ${#password}, 需要 >= 8)"
fi

# 2. 包含大写字母
if [[ "$password" =~ [A-Z] ]]; then
    echo "  [通过] 包含大写字母"
    ((score++))
else
    echo "  [失败] 缺少大写字母"
fi

# 3. 包含小写字母
if [[ "$password" =~ [a-z] ]]; then
    echo "  [通过] 包含小写字母"
    ((score++))
else
    echo "  [失败] 缺少小写字母"
fi

# 4. 包含数字
if [[ "$password" =~ [0-9] ]]; then
    echo "  [通过] 包含数字"
    ((score++))
else
    echo "  [失败] 缺少数字"
fi

# 5. 包含特殊字符
if [[ "$password" =~ [[:punct:]] ]]; then
    echo "  [通过] 包含特殊字符"
    ((score++))
else
    echo "  [失败] 缺少特殊字符 (!@#$%^&*等)"
fi

# 6. 不包含空格
if [[ ! "$password" =~ [[:space:]] ]]; then
    echo "  [通过] 无空格"
    ((score++))
else
    echo "  [失败] 包含空格"
fi

echo ""
echo "--- 评估 ---"
if [ $score -eq $max_score ]; then
    echo "强度: 强 (6/6) - 密码符合所有要求"
elif [ $score -ge 4 ]; then
    echo "强度: 中 ($score/6) - 建议加强"
else
    echo "强度: 弱 ($score/6) - 密码太弱，请重新设置"
fi
SCRIPT

chmod +x ~/bash-lesson24/password-check.sh

# 测试（使用非交互式输入）
echo "=== 测试1: 弱密码 ==="
echo -e "abc\nabc" | ~/bash-lesson24/password-check.sh

echo ""
echo "=== 测试2: 强密码 ==="
echo -e "MyStr0ng!Pass\nMyStr0ng!Pass" | ~/bash-lesson24/password-check.sh
```

### 练习 24.3：猜数字游戏（while 循环）

**题目：**

编写脚本 `~/bash-lesson24/guess-number.sh`，实现一个猜数字游戏：
（1）系统随机生成一个 1-100 之间的数（使用 `$RANDOM`）
（2）使用 `while` 循环让用户反复猜测
（3）每次猜测后提示"大了"或"小了"
（4）统计猜测次数
（5）使用 `break` 在猜中时退出
（6）支持输入 q 退出

**答案：**

```bash
cat > ~/bash-lesson24/guess-number.sh << 'SCRIPT'
#!/bin/bash

# 生成 1-100 的随机数
target=$(( RANDOM % 100 + 1 ))
attempts=0

echo "======================================"
echo "  猜数字游戏 (1-100)"
echo "======================================"
echo "我已经想好了一个 1 到 100 之间的数字。"
echo "输入 q 可以退出游戏。"
echo ""

while true; do
    read -p "第 $((attempts + 1)) 次猜测: " guess

    # 检查退出
    if [[ "$guess" == "q" ]]; then
        echo "游戏结束。答案是: $target"
        break
    fi

    # 检查是否为有效数字
    if [[ ! "$guess" =~ ^[0-9]+$ ]]; then
        echo "  请输入有效的数字！"
        continue
    fi

    ((attempts++))

    # 比较
    if (( guess == target )); then
        echo ""
        echo "恭喜！你猜对了！"
        echo "答案是 $target，你用了 $attempts 次猜测。"
        
        # 评价
        if (( attempts <= 5 )); then
            echo "评价: 太厉害了！"
        elif (( attempts <= 10 )); then
            echo "评价: 不错！"
        else
            echo "评价: 继续加油！"
        fi
        break
    elif (( guess > target )); then
        echo "  太大了！"
    else
        echo "  太小了！"
    fi

    # 提示范围（每3次提示一次）
    if (( attempts % 3 == 0 )); then
        echo "  （已猜测 $attempts 次）"
    fi
done
SCRIPT

chmod +x ~/bash-lesson24/guess-number.sh

# 非交互式测试（模拟用户输入）
echo "=== 自动测试 ==="
{
    echo "50"
    echo "75"
    echo "62"
    echo "q"
} | ~/bash-lesson24/guess-number.sh
```

### 练习 24.4：批量文件重命名（for 循环 + 通配符）

**题目：**

编写脚本 `~/bash-lesson24/bulk-rename.sh`，接收一个目录路径和重命名模式，批量处理文件：
（1）使用 for + 通配符遍历目录中匹配的文件
（2）支持三种操作：添加前缀、添加后缀、替换扩展名
（3）使用 `case` 选择操作类型
（4）在重命名前检查目标文件名是否已存在（使用 `-f`）
（5）显示每个文件的重命名结果
（6）提供"试运行"（dry-run）选项，只显示不执行

**答案：**

```bash
cat > ~/bash-lesson24/bulk-rename.sh << 'SCRIPT'
#!/bin/bash

# 参数解析
DRY_RUN=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        *) break ;;
    esac
done

dir="${1:?用法: $0 [--dry-run] <目录路径>}"
target_dir="$dir"

if [ ! -d "$target_dir" ]; then
    echo "错误: '$target_dir' 不是有效的目录" >&2
    exit 1
fi

echo "======================================"
echo "  批量文件重命名工具"
echo "======================================"
echo "目标目录: $target_dir"
echo "试运行: $DRY_RUN"
echo ""

# 选择操作
echo "请选择操作:"
echo "  1) 添加前缀"
echo "  2) 添加后缀"
echo "  3) 替换扩展名"
read -p "选择 [1-3]: " op

case "$op" in
    1) read -p "输入前缀: " prefix ;;
    2) read -p "输入后缀（在扩展名前）: " suffix ;;
    3) read -p "输入旧扩展名（不含点）: " old_ext
       read -p "输入新扩展名（不含点）: " new_ext ;;
    *) echo "无效选择" >&2; exit 1 ;;
esac

# 遍历文件
count=0
shopt -s nullglob  # 没有匹配时不进入循环

for file in "$target_dir"/*; do
    [ -f "$file" ] || continue  # 只处理普通文件
    
    filename=$(basename "$file")
    dirname=$(dirname "$file")

    # 计算新文件名
    case "$op" in
        1) new_name="${prefix}${filename}" ;;
        2)
            if [[ "$filename" == *.* ]]; then
                base="${filename%.*}"
                ext="${filename##*.}"
                new_name="${base}${suffix}.${ext}"
            else
                new_name="${filename}${suffix}"
            fi
            ;;
        3)
            if [[ "$filename" == *.$old_ext ]]; then
                new_name="${filename%.$old_ext}.$new_ext"
            else
                echo "  跳过: $filename（扩展名不匹配 .$old_ext）"
                continue
            fi
            ;;
    esac

    new_path="${dirname}/${new_name}"

    # 检查目标是否存在
    if [ -e "$new_path" ] && [ "$file" != "$new_path" ]; then
        echo "  跳过: $filename -> $new_name（目标已存在）"
        continue
    fi

    if $DRY_RUN; then
        echo "  [试运行] $filename -> $new_name"
    else
        mv "$file" "$new_path"
        echo "  [重命名] $filename -> $new_name"
    fi
    ((count++))
done

shopt -u nullglob

echo ""
echo "======================================"
echo "共处理 $count 个文件"
$DRY_RUN && echo "（试运行模式，未实际修改）"
SCRIPT

chmod +x ~/bash-lesson24/bulk-rename.sh

# 测试
mkdir -p /tmp/rename-test
touch /tmp/rename-test/{a,b,c}.txt
touch /tmp/rename-test/data.csv

echo "=== 试运行 ==="
echo -e "1\ntest_" | ~/bash-lesson24/bulk-rename.sh --dry-run /tmp/rename-test

echo ""
echo "=== 实际执行 ==="
echo -e "1\ntest_" | ~/bash-lesson24/bulk-rename.sh /tmp/rename-test
ls -la /tmp/rename-test/

rm -rf /tmp/rename-test
```

### 练习 24.5：系统监控菜单（select）

**题目：**

编写脚本 `~/bash-lesson24/sys-monitor.sh`，使用 `select` 创建一个系统监控菜单：
（1）显示当前时间和系统运行时间
（2）显示 CPU 负载
（3）显示内存使用
（4）显示磁盘使用
（5）显示网络接口信息
（6）显示当前登录用户
（7）退出

**答案：**

```bash
cat > ~/bash-lesson24/sys-monitor.sh << 'SCRIPT'
#!/bin/bash

# 颜色定义
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PS3=$'\n'"请选择操作 [1-7]: "

while true; do
    clear
    echo -e "${BOLD}======================================${NC}"
    echo -e "${BOLD}  系统监控菜单${NC}"
    echo -e "${BOLD}======================================${NC}"
    
    select action in \
        "系统时间和运行时间" \
        "CPU 负载" \
        "内存使用" \
        "磁盘使用" \
        "网络接口" \
        "当前登录用户" \
        "退出"; do
        
        echo ""
        echo -e "${CYAN}----------------------------------------${NC}"
        
        case "$REPLY" in
            1)
                echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
                echo "系统运行时间: $(uptime -p 2>/dev/null || uptime | awk -F',' '{print $1}')"
                ;;
            2)
                echo "CPU 负载:"
                uptime | awk -F'load average:' '{print "  " $2}'
                echo "CPU 核心数: $(nproc)"
                ;;
            3)
                echo "内存使用:"
                free -h | awk 'NR==1 || NR==2 {print "  " $0}'
                ;;
            4)
                echo "磁盘使用:"
                df -h --type ext4 --type xfs --type btrfs 2>/dev/null || df -h /
                ;;
            5)
                echo "网络接口:"
                ip -4 addr show | grep -E '^[0-9]:|inet ' | sed 's/^/  /'
                ;;
            6)
                echo "当前登录用户:"
                who | awk '{print "  " $1 " (从 " $5 " 登录于 " $3 " " $4 ")"}'
                ;;
            7)
                echo "再见！"
                exit 0
                ;;
            *)
                echo "无效选择，请输入 1-7"
                ;;
        esac
        
        echo -e "${CYAN}----------------------------------------${NC}"
        echo ""
        read -p "按回车键继续..." _
        break  # 跳出 select，回到 while 外层重新显示菜单
    done
done
SCRIPT

chmod +x ~/bash-lesson24/sys-monitor.sh

# 非交互式测试
echo "1" | ~/bash-lesson24/sys-monitor.sh 2>/dev/null
echo "---"
echo "7" | ~/bash-lesson24/sys-monitor.sh 2>/dev/null
```

### 练习 24.6：日志实时监控（while read + tail）

**题目：**

编写脚本 `~/bash-lesson24/log-watch.sh`，实现日志文件的实时监控：
（1）使用 `tail -f` 配合 `while read` 逐行监控日志
（2）对包含 "ERROR" 的行用红色标记（如果终端支持）
（3）对包含 "WARN" 的行用黄色标记
（4）使用 `trap` 在 Ctrl+C 时优雅退出并显示统计
（5）统计监控期间 ERROR 和 WARN 的数量

**答案：**

```bash
cat > ~/bash-lesson24/log-watch.sh << 'SCRIPT'
#!/bin/bash

logfile="${1:?用法: $0 <日志文件路径>}"

if [ ! -f "$logfile" ]; then
    echo "错误: 文件 '$logfile' 不存在" >&2
    exit 1
fi

if [ ! -r "$logfile" ]; then
    echo "错误: 文件 '$logfile' 不可读" >&2
    exit 1
fi

# 颜色（检查终端是否支持）
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    GREEN='\033[0;32m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    RED='' YELLOW='' GREEN='' CYAN='' NC=''
fi

# 统计变量
error_count=0
warn_count=0
info_count=0
total_lines=0

# 清理函数
cleanup() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  监控统计${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "总行数:   $total_lines"
    echo -e "${RED}ERROR:    $error_count${NC}"
    echo -e "${YELLOW}WARN:     $warn_count${NC}"
    echo -e "${GREEN}INFO:     $info_count${NC}"
    echo -e "${CYAN}========================================${NC}"
    exit 0
}

trap cleanup INT TERM

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  日志实时监控${NC}"
echo -e "${CYAN}========================================${NC}"
echo "文件: $logfile"
echo "按 Ctrl+C 退出并查看统计"
echo ""

# 逐行读取日志（tail -f 持续跟踪）
tail -n 0 -f "$logfile" 2>/dev/null | while IFS= read -r line; do
    ((total_lines++))
    
    timestamp=$(date '+%H:%M:%S')
    
    if [[ "$line" =~ ERROR ]]; then
        echo -e "${RED}[$timestamp ERROR] $line${NC}"
        ((error_count++))
    elif [[ "$line" =~ WARN|WARNING ]]; then
        echo -e "${YELLOW}[$timestamp WARN]  $line${NC}"
        ((warn_count++))
    elif [[ "$line" =~ INFO ]]; then
        echo -e "${GREEN}[$timestamp INFO]  $line${NC}"
        ((info_count++))
    else
        echo "[$timestamp] $line"
    fi
done
SCRIPT

chmod +x ~/bash-lesson24/log-watch.sh

# 测试：创建模拟日志并在后台写入
cat > /tmp/test-app.log << 'LOG'
2026-07-30 10:00:01 INFO  Application started
2026-07-30 10:00:05 WARN  Memory usage approaching limit
2026-07-30 10:00:10 INFO  Processing batch #1
2026-07-30 10:00:15 ERROR Connection timeout on API call
LOG

echo "=== 监控测试（2秒后自动停止）==="
timeout 2 ~/bash-lesson24/log-watch.sh /tmp/test-app.log 2>/dev/null || true

rm -f /tmp/test-app.log
```

### 练习 24.7：进程等待器（until 循环）

**题目：**

编写脚本 `~/bash-lesson24/proc-wait.sh`，使用 `until` 循环：
（1）接收一个进程名作为参数
（2）等待该进程启动（`until pgrep` 找到进程）
（3）进程启动后输出其 PID
（4）然后等待该进程结束（`until` 检查进程是否还在）
（5）使用超时机制（30 秒内未启动则退出）
（6）显示等待时长

**答案：**

```bash
cat > ~/bash-lesson24/proc-wait.sh << 'SCRIPT'
#!/bin/bash

proc_name="${1:?用法: $0 <进程名>}"
timeout=30

echo "======================================"
echo "  进程等待器"
echo "======================================"
echo "等待进程 '$proc_name' 启动..."
echo "超时: ${timeout} 秒"
echo ""

# --- 等待进程启动 ---
start_time=$(date +%s)
pid=""

until pid=$(pgrep -x "$proc_name" 2>/dev/null | head -1) && [ -n "$pid" ]; do
    elapsed=$(($(date +%s) - start_time))
    if (( elapsed >= timeout )); then
        echo "超时！进程 '$proc_name' 在 ${timeout} 秒内未启动" >&2
        exit 1
    fi
    echo -n "."
    sleep 1
done

startup_time=$(($(date +%s) - start_time))
echo ""
echo "进程已启动: $proc_name (PID: $pid)"
echo "启动耗时: ${startup_time} 秒"
echo ""

# --- 等待进程结束 ---
echo "等待进程结束..."
wait_start=$(date +%s)
until ! kill -0 "$pid" 2>/dev/null; do
    elapsed=$(($(date +%s) - wait_start))
    echo -ne "\r已监控: ${elapsed} 秒..."
    sleep 1
done

runtime=$(($(date +%s) - wait_start))
echo ""
echo "进程已结束"
echo "运行时长: ${runtime} 秒"
echo "======================================"
SCRIPT

chmod +x ~/bash-lesson24/proc-wait.sh

# 测试：启动一个后台进程，监控它
echo "=== 测试 ==="
sleep 3 &
bg_pid=$!
echo "后台进程已启动，PID: $bg_pid"
# 注意：这里用 pgrep 查找 "sleep" 来演示
# 实际脚本需要进程先不存在再等待启动

# 演示简化的流程
(
    echo "启动一个 sleep 进程..."
    sleep 2 &
    spid=$!
    echo "  PID: $spid"
    wait $spid
    echo "  进程结束"
)
echo "=== 测试完毕 ==="
```

### 练习 24.8：目录结构统计（for + find）

**题目：**

编写脚本 `~/bash-lesson24/dir-stats.sh`，统计目录的结构信息：
（1）使用 for 循环遍历目标目录下的每个子目录
（2）对每个子目录统计：文件数、总大小、最后修改时间
（3）使用嵌套的 for 循环按文件扩展名分类统计
（4）输出格式化的报告（使用 printf 对齐）

**答案：**

```bash
cat > ~/bash-lesson24/dir-stats.sh << 'SCRIPT'
#!/bin/bash

target="${1:-.}"

if [ ! -d "$target" ]; then
    echo "错误: '$target' 不是有效的目录" >&2
    exit 1
fi

# 获取绝对路径
target=$(cd "$target" && pwd)

echo "================================================"
echo "  目录结构统计报告"
echo "================================================"
echo "目标: $target"
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查是否有子目录
subdir_count=$(find "$target" -maxdepth 1 -type d ! -path "$target" | wc -l)

if [ "$subdir_count" -eq 0 ]; then
    echo "该目录下没有子目录"
else
    printf "%-30s %8s %10s %10s\n" "目录名" "文件数" "总大小" "子目录数"
    printf "%-30s %8s %10s %10s\n" "------------------------------" "--------" "----------" "----------"
    
    for subdir in "$target"/*/; do
        [ -d "$subdir" ] || continue
        
        dirname=$(basename "$subdir")
        
        # 统计数据
        file_count=$(find "$subdir" -type f 2>/dev/null | wc -l)
        total_size=$(du -sh "$subdir" 2>/dev/null | cut -f1)
        nested_dirs=$(find "$subdir" -mindepth 1 -type d 2>/dev/null | wc -l)
        
        printf "%-30s %8d %10s %10d\n" "$dirname" "$file_count" "$total_size" "$nested_dirs"
    done
fi

# 按扩展名分类
echo ""
echo "--- 文件类型分布（前 10 种）---"
printf "%-15s %8s\n" "扩展名" "数量"
printf "%-15s %8s\n" "---------------" "--------"

find "$target" -type f 2>/dev/null | while IFS= read -r file; do
    basename "$file"
done | while IFS=. read -r _ ext; do
    if [ -n "$ext" ]; then
        echo ".$ext"
    else
        echo "(无扩展名)"
    fi
done | sort | uniq -c | sort -rn | head -10 | while read count ext; do
    printf "%-15s %8s\n" "$ext" "$count"
done

echo ""
echo "================================================"
SCRIPT

chmod +x ~/bash-lesson24/dir-stats.sh

# 创建测试目录结构
mkdir -p /tmp/dir-stats-test/{src,docs,data}
touch /tmp/dir-stats-test/src/{main.c,utils.c,header.h}
touch /tmp/dir-stats-test/docs/{readme.md,guide.md}
touch /tmp/dir-stats-test/data/{input.csv,output.json}
echo "test data" > /tmp/dir-stats-test/data/input.csv

echo "=== 测试 ==="
~/bash-lesson24/dir-stats.sh /tmp/dir-stats-test

rm -rf /tmp/dir-stats-test
```

### 练习 24.9：九九乘法表（嵌套 for + C 风格）

**题目：**

编写脚本 `~/bash-lesson24/multiplication-table.sh`：
（1）使用 C 风格的嵌套 for 循环打印 9x9 乘法表
（2）使用 `printf` 格式化对齐输出
（3）使用颜色区分行号、列号和结果
（4）同时输出纯文本版本和带颜色的版本

**答案：**

```bash
cat > ~/bash-lesson24/multiplication-table.sh << 'SCRIPT'
#!/bin/bash

print_table() {
    local use_color="$1"
    local RED='' GREEN='' CYAN='' BOLD='' NC=''
    
    if $use_color && [[ -t 1 ]]; then
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        CYAN='\033[0;36m'
        BOLD='\033[1m'
        NC='\033[0m'
    fi

    # 表头
    echo -e "${BOLD}  九九乘法表${NC}"
    echo "=========================================="
    
    # 列号
    printf "     "
    for ((col=1; col<=9; col++)); do
        printf "${CYAN}%4d${NC}" "$col"
    done
    echo ""
    printf "     "
    for ((col=1; col<=9; col++)); do
        printf "----"
    done
    echo ""

    # 表格主体
    for ((row=1; row<=9; row++)); do
        printf "${GREEN}%2d${NC} |" "$row"
        for ((col=1; col<=9; col++)); do
            result=$((row * col))
            printf "${RED}%4d${NC}" "$result"
        done
        echo ""
    done
    
    echo "=========================================="
}

echo "=== 彩色版本 ==="
print_table true

echo ""
echo "=== 纯文本版本 ==="
print_table false
SCRIPT

chmod +x ~/bash-lesson24/multiplication-table.sh
~/bash-lesson24/multiplication-table.sh
```

### 练习 24.10：综合挑战 —— 配置文件解析器

**题目：**

编写脚本 `~/bash-lesson24/config-parser.sh`，解析一个 INI 风格的配置文件：
（1）使用 `while read` 逐行读取配置文件
（2）使用 `case` 识别节（`[section]`）、键值对（`key=value`）、注释（`#`）和空行
（3）使用 `[[ ]]` 和 `=~` 正则提取内容
（4）支持两个子命令：`list`（列出所有配置）和 `get <key>`（获取指定键的值）
（5）使用关联数组存储解析结果
（6）使用 `select` 提供交互式查看菜单

**答案：**

```bash
cat > ~/bash-lesson24/config-parser.sh << 'SCRIPT'
#!/bin/bash

config_file="${1:?用法: $0 <配置文件> [list|get <key>]}"
subcmd="${2:-list}"
key="${3:-}"

if [ ! -f "$config_file" ]; then
    echo "错误: 配置文件 '$config_file' 不存在" >&2
    exit 1
fi

# 声明关联数组存储配置
declare -A config
declare -a sections
current_section="default"

# 解析配置文件
parse_config() {
    while IFS= read -r line || [ -n "$line" ]; do
        # 去除行首行尾空白
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        
        # 跳过空行和纯注释行
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        case "$line" in
            \[*\])
                # 节标题 [section]
                current_section="${line#[}"
                current_section="${current_section%]}"
                sections+=("$current_section")
                ;;
            *=*)
                # 键值对 key=value
                key_part="${line%%=*}"
                val_part="${line#*=}"
                # 去除键的空白
                key_part="${key_part%"${key_part##*[![:space:]]}"}"
                key_part="${key_part#"${key_part%%[![:space:]]*}"}"
                # 去除值的空白和引号
                val_part="${val_part#"${val_part%%[![:space:]]*}"}"
                val_part="${val_part%"${val_part##*[![:space:]]}"}"
                val_part="${val_part#\"}"
                val_part="${val_part%\"}"
                val_part="${val_part#\'}"
                val_part="${val_part%\'}"
                
                # 去除行内注释（简单处理：# 后面有空格的情况）
                if [[ "$val_part" =~ ^(.*)[[:space:]]+# ]]; then
                    val_part="${BASH_REMATCH[1]}"
                fi
                
                full_key="${current_section}.${key_part}"
                config["$full_key"]="$val_part"
                ;;
            *\#*)
                # 跳过注释（保守处理）
                ;;
        esac
    done < "$config_file"
}

parse_config

# 根据子命令执行
case "$subcmd" in
    list)
        echo "======================================"
        echo "  配置列表: $config_file"
        echo "======================================"
        
        for section in "${sections[@]}"; do
            echo ""
            echo "[$section]"
            for full_key in "${!config[@]}"; do
                if [[ "$full_key" == ${section}.* ]]; then
                    local_key="${full_key#${section}.}"
                    printf "  %-20s = %s\n" "$local_key" "${config[$full_key]}"
                fi
            done
        done
        
        echo ""
        echo "======================================"
        echo "共 ${#sections[@]} 个节，${#config[@]} 个配置项"
        ;;
        
    get)
        if [ -z "$key" ]; then
            echo "用法: $0 <配置文件> get <键名>" >&2
            exit 1
        fi
        
        # 搜索所有节
        found=false
        for full_key in "${!config[@]}"; do
            if [[ "$full_key" == *.$key ]] || [[ "$full_key" == "$key" ]]; then
                echo "$full_key = ${config[$full_key]}"
                found=true
            fi
        done
        
        if ! $found; then
            echo "未找到配置项: $key" >&2
            exit 1
        fi
        ;;
        
    interactive)
        echo "交互模式 - 使用 select 浏览配置"
        PS3="选择节 [1-$((${#sections[@]}+1))]: "
        
        select section in "${sections[@]}" "退出"; do
            if [ "$section" = "退出" ] || [ -z "$section" ]; then
                break
            fi
            
            echo ""
            echo "--- [$section] ---"
            for full_key in "${!config[@]}"; do
                if [[ "$full_key" == ${section}.* ]]; then
                    local_key="${full_key#${section}.}"
                    printf "  %-20s = %s\n" "$local_key" "${config[$full_key]}"
                fi
            done
            echo ""
        done
        ;;
        
    *)
        echo "未知子命令: $subcmd (支持: list, get, interactive)" >&2
        exit 1
        ;;
esac
SCRIPT

chmod +x ~/bash-lesson24/config-parser.sh

# 创建测试配置文件
cat > /tmp/test-config.ini << 'INI'
# 数据库配置
[database]
host = localhost
port = 3306
user = admin
password = secret123

# 应用配置
[app]
name = MyApp
version = 2.1.0
debug = true

# 日志配置
[logging]
level = info
file = /var/log/myapp.log
max_size = 100MB
INI

echo "=== 列出所有配置 ==="
~/bash-lesson24/config-parser.sh /tmp/test-config.ini list

echo ""
echo "=== 获取特定配置 ==="
~/bash-lesson24/config-parser.sh /tmp/test-config.ini get host
~/bash-lesson24/config-parser.sh /tmp/test-config.ini get debug

rm -f /tmp/test-config.ini
```

---

## 5. 常见错误与排错

### 5.1 误区：`[ ]` 中忘记空格

这是 Bash 新手最常见的错误。

```bash
# 错误：缺少空格
# [ -f /etc/passwd]    # 错误：] 前没空格
# [-f /etc/passwd ]    # 错误：[ 后没空格
# if[$a -eq 5]         # 错误：if 后没空格，[ 后没空格

# 正确
[ -f /etc/passwd ]      # [ 后空格，] 前空格
if [ "$a" -eq 5 ]       # if 后空格
```

```bash
# 演示：缺少空格的后果
echo "=== 错误演示 ==="
[ -f /etc/passwd] 2>&1 || echo "缺少 ] 前的空格: 语法错误"
[-f /etc/passwd ] 2>&1 || echo "缺少 [ 后的空格: 命令未找到"
```

### 5.2 误区：`[ ]` 中变量不加引号

```bash
# 错误
name="hello world"
# [ $name = "hello world" ]   # 展开后: [ hello world = "hello world" ]  —— 参数太多！

# 正确
[ "$name" = "hello world" ]   # 展开后: [ "hello world" = "hello world" ]

# 更好的做法（使用 [[ ]] 规避此问题）
[[ $name = "hello world" ]]   # [[ ]] 不会进行单词分割
```

### 5.3 误区：`[ ]` 中使用 `==`

```bash
# [ ] 中 = 是 POSIX 标准，== 是 Bash 扩展
# 在 sh（dash）中 [ "a" == "a" ] 可能不被支持
# 安全做法：在 [ ] 中用 =，在 [[ ]] 中可以用 ==
[ "$a" = "$b" ]        # POSIX 兼容
[[ $a == $b ]]          # Bash 专用，两者都可以
```

### 5.4 误区：混淆字符串比较和数值比较

```bash
a=5; b=10

# 错误：用字符串操作符比较数字
# [ "$a" > "$b" ]       # 这是字符串比较（按字典序），且 > 会被解释为重定向！
# [ "$a" < "$b" ]       # 同上，而且 5 > 10 在字典序中为真（'5' > '1'）！

# 正确：整数比较
[ "$a" -lt "$b" ]       # 整数小于比较
(( a < b ))             # 算术比较（推荐）
```

```bash
echo "=== 字符串比较 vs 数值比较 ==="
a=5; b=10
[[ $a < $b ]] && echo "字符串: 5 < 10 => 真" || echo "字符串: 5 < 10 => 假"  
# 注意：字典序中 '5' > '1'，所以 5 > 10！
[[ $a -lt $b ]] && echo "整数:   5 < 10 => 真"
(( a < b )) && echo "算术:   5 < 10 => 真"
```

### 5.5 误区：`=` 和 `==` 在 `[ ]` 中混淆赋值

```bash
# 错误：用一个等号做条件测试时不注意
name="test"
# [ $name = "test" ]   # 正确：= 是比较
# [ $name == "test" ]  # 在 bash 的 [ ] 中可以工作（但不 POSIX）

# 危险：在 [ ] 中用 = 做赋值
# [ $name = "new" ]    # 这是比较！不是赋值！
# 如果想赋值： name="new" （不需要 [ ]）

# [[ ]] 安全区
[[ $name = "test" ]]   # = 和 == 都可以
[[ $name == "test" ]]  # 推荐用 == 明确表示比较
```

### 5.6 误区：`-a` 和 `-o` 的优先级问题

```bash
# [ ] 中的 -a 和 -o 有未定义的优先级
# 不同 Shell 实现可能行为不同
# [ "$a" = "x" -a "$b" = "y" -o "$c" = "z" ]  # 歧义！

# 推荐：分离多个 [ ] 或使用 [[ ]]
[ "$a" = "x" ] && { [ "$b" = "y" ] || [ "$c" = "z" ]; }
# 或
[[ $a = "x" && ( $b = "y" || $c = "z" ) ]]
```

### 5.7 误区：`for line in $(cat file)` 导致单词分割

```bash
# 错误：含空格的行会被分割
# for word in $(cat file); do
#     echo "$word"   # 每行按空格进一步分割！
# done

# 正确：逐行读取
while IFS= read -r line; do
    echo "$line"      # 保留行的完整性
done < file
```

```bash
echo "=== 演示单词分割问题 ==="
printf "hello world\nubuntu linux\nbash script\n" > /tmp/word-split-test.txt

echo "--- for + cat (错误) ---"
for word in $(cat /tmp/word-split-test.txt); do
    echo "  [$word]"
done
echo "  （3行变成了6个单词！）"

echo ""
echo "--- while read (正确) ---"
while IFS= read -r line; do
    echo "  [$line]"
done < /tmp/word-split-test.txt
echo "  （正确保留了3行）"

rm -f /tmp/word-split-test.txt
```

### 5.8 误区：管道中的 while 循环变量丢失

```bash
# 错误：管道中的 while 在子 Shell 中运行
# count=0
# cat file | while read line; do
#     ((count++))
# done
# echo $count  # 永远是 0！子 Shell 的修改不会反映到父 Shell

# 正确做法1：进程替换
count=0
while IFS= read -r line; do
    ((count++))
done < <(cat file)

# 正确做法2：重定向
count=0
while IFS= read -r line; do
    ((count++))
done < file

# 正确做法3：Here String（小数据量）
count=0
while IFS= read -r line; do
    ((count++))
done <<< "$(cat file)"
```

### 5.9 误区：`case` 忘记 `;;` 导致穿越

```bash
# 错误：缺少 ;; 会导致"穿越"（Fall-through）
# case "$var" in
#     a)
#         echo "A"
#         # 忘记 ;; —— 会继续执行下一个模式！
#     b)
#         echo "B"
#         ;;
# esac
# 当 var=a 时，会输出 "A" 和 "B"！

# Bash 4.0+ 的显式穿越控制
# ;&   ：无条件继续执行下一个分支的代码
# ;;&  ：继续测试后续的模式（不推荐，容易出错）
# ;;   ：正常终止分支（最常用）
```

### 5.10 误区：`select` 不 break 导致无限循环

```bash
# select 本身就是一个无限循环！
# 如果没有 break/exit，它会一直重复显示菜单
# select opt in a b c; do
#     echo "你选了 $opt"
#     # 没有 break —— 会一直循环！
# done

# 正确做法：
# select opt in a b c quit; do
#     case "$opt" in
#         quit) break ;;
#         *) echo "处理 $opt" ;;
#     esac
# done
```

---

## 6. 进阶延伸

### 6.1 `[ ]` 是如何工作的：从内核角度理解

你可能好奇：`[` 真的是一个命令吗？是的。

```bash
# /usr/bin/[ 是一个货真价实的可执行文件
ls -la /usr/bin/[
# 同时，Bash 也内置了 [ 以提升性能
type "["
# [ is a shell builtin
```

`[ ]` 的本质是一个接受参数的命令，最后一个参数必须是 `]`。`[` 命令检查它的参数（不包括 `]`）是否构成一个合法的表达式，如果是就评估并返回 0 或 1。

这意味着 `[` 的所有操作符（`-f`、`-eq`、`=` 等）都必须是**独立的参数**：

```
[ -f /etc/passwd ]
参数拆分：
  $0 = [ (命令名)
  $1 = -f (操作符)
  $2 = /etc/passwd (操作数)
  $3 = ] (结束标记)

这就是为什么空格是必需的——没有空格，Shell 就无法将参数正确拆分。
```

### 6.2 `[[ ]]` 的关键字级解析

`[[ ]]` 不是命令，而是 Bash 解析器识别的**复合命令（Compound Command）**。这意味着：

1. **解析发生在变量展开之前**：Bash 解析器在展开变量之前就能识别 `[[` 的语法结构
2. **单词分割被抑制**：在 `[[ ]]` 内部，变量展开不进行单词分割
3. **路径名展开被抑制**：在 `[[ ]]` 内部，`*`、`?` 等通配符不会展开为文件名（除了在 `==` 的右侧用于模式匹配）

```bash
# 这就是为什么这些操作在 [[ ]] 中安全：
var="hello world"
[[ $var = "hello world" ]]  # 变量不用加引号，不会分割

[[ *.txt == *.txt ]]        # 左侧的 * 不会展开，右侧的 * 是模式
```

### 6.3 正则表达式 =~ 的高级用法

`=~` 操作符是 `[[ ]]` 的独有功能，它使用 POSIX 扩展正则表达式（ERE）语法。

```bash
# 邮箱验证
validate_email() {
    local email="$1"
    local pattern='^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if [[ "$email" =~ $pattern ]]; then
        echo "'$email' 是有效的邮箱地址"
        return 0
    else
        echo "'$email' 不是有效的邮箱地址" >&2
        return 1
    fi
}

validate_email "user@example.com"
validate_email "invalid-email"
validate_email "test@sub.domain.co.uk"

# IP 地址验证
validate_ip() {
    local ip="$1"
    local pattern='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
    
    if [[ "$ip" =~ $pattern ]]; then
        IFS='.' read -r -a octets <<< "$ip"
        for octet in "${octets[@]}"; do
            if (( octet > 255 )); then
                echo "无效IP: $ip (段值 > 255)" >&2
                return 1
            fi
        done
        echo "有效IP: $ip"
        return 0
    else
        echo "无效IP: $ip (格式错误)" >&2
        return 1
    fi
}

validate_ip "192.168.1.1"
validate_ip "256.1.1.1"
validate_ip "10.0.0.256"
```

### 6.4 BASH_REMATCH 捕获组的深度使用

```bash
# BASH_REMATCH 捕获组
echo ""
echo "=== BASH_REMATCH 捕获组 ==="
extract_date() {
    local text="$1"
    if [[ "$text" =~ ([0-9]{4})-([0-9]{2})-([0-9]{2}) ]]; then
        echo "日期: ${BASH_REMATCH[0]}"
        echo "  年: ${BASH_REMATCH[1]}"
        echo "  月: ${BASH_REMATCH[2]}"
        echo "  日: ${BASH_REMATCH[3]}"
    fi
}
extract_date "日志时间: 2026-07-30 14:30:00"

# URL 解析
echo ""
echo "=== URL 解析 ==="
parse_url() {
    local url="$1"
    local pattern='^(https?)://([^/]+)(/.*)?$'
    
    if [[ "$url" =~ $pattern ]]; then
        echo "URL: $url"
        echo "  协议: ${BASH_REMATCH[1]}"
        echo "  主机: ${BASH_REMATCH[2]}"
        echo "  路径: ${BASH_REMATCH[3]:-/}"
    else
        echo "无法解析: $url" >&2
    fi
}
parse_url "https://example.com/path/to/page"
parse_url "http://localhost:8080/api/v1"
```

### 6.5 文件的元数据 vs 测试运算符

不同的文件测试运算符检查的是文件的不同层面的信息：

```
+------------------------------------------------------------------+
|                    文件测试的信息来源                                  |
|                                                                    |
|  -e, -f, -d, -L, -p, -S, -b, -c                                   |
|    检查文件类型（来自 stat() 的 st_mode 字段）                       |
|                                                                    |
|  -r, -w, -x                                                        |
|    检查访问权限（来自 access() 系统调用，不止看 st_mode）             |
|    还考虑 ACL、capabilities 等                                      |
|                                                                    |
|  -s                                                                 |
|    检查文件大小（来自 stat() 的 st_size）                           |
|                                                                    |
|  -nt, -ot                                                           |
|    检查修改时间（来自 stat() 的 st_mtime）                          |
|                                                                    |
|  -ef                                                                 |
|    检查 inode 号和设备号（来自 stat() 的 st_ino 和 st_dev）         |
|                                                                    |
|  -g, -u, -k                                                        |
|    检查特殊权限位（来自 stat() 的 st_mode）                         |
+------------------------------------------------------------------+
```

**重要：`-r`/`-w`/`-x` 使用 `access()` 系统调用，而 `ls -l` 只显示 `st_mode` 的权限位。两者可能不一致！** 例如 root 用户（拥有 CAP_DAC_OVERRIDE capability）对 mode 000 的文件也可以通过 access() 检查。

### 6.6 shopt：控制 Shell 行为影响循环

`shopt`（Shell Options）可以改变 Bash 的关键行为，其中几个直接影响到循环和条件判断：

```bash
echo "=== shopt 关键选项 ==="

# nullglob：没有匹配时，通配符展开为空（而非保持原样）
echo "--- nullglob（通配符空匹配）---"
echo "默认行为（nullglob off）:"
for f in /nonexistent-*.txt; do
    echo "  文件: $f"  # 输出 "/nonexistent-*.txt"（字面量）
done

echo ""
echo "开启 nullglob:"
shopt -s nullglob
for f in /nonexistent-*.txt; do
    echo "  文件: $f"  # 不会执行（展开为空）
done
echo "  （循环体不执行——这才是期望的行为）"
shopt -u nullglob

# failglob：没有匹配时直接报错
echo ""
echo "--- failglob ---"
shopt -s failglob 2>/dev/null
# for f in /nonexistent-*.txt; do ... done  # 直接报错退出
shopt -u failglob 2>/dev/null

# nocaseglob：通配符不区分大小写
echo ""
echo "--- nocaseglob ---"
touch /tmp/TEST-FILE.TXT
echo "默认:"
for f in /tmp/test-*.txt; do echo "  $f"; done
echo "开启 nocaseglob:"
shopt -s nocaseglob
for f in /tmp/test-*.txt; do echo "  $f"; done
shopt -u nocaseglob
rm -f /tmp/TEST-FILE.TXT

# globstar：** 递归匹配所有子目录（Bash 4.0+）
echo ""
echo "--- globstar ---"
echo "  shopt -s globstar 后可以用 **/*.conf 递归匹配"
echo "  无需 globstar 时: * 只匹配当前目录"
```

### 6.7 循环与管道的性能考量

```bash
echo "=== 循环性能要点 ==="

# 性能陷阱1：循环中反复调用外部命令
# 慢：每次迭代启动一个外部进程
# for i in {1..1000}; do
#     echo "$i" | cat > /dev/null   # 每次启动 cat
# done

# 快：使用内置操作
# for i in {1..1000}; do
#     :   # 空操作（Bash 内置）
# done

# 性能陷阱2：大文件的 for + cat 会一次性加载到内存
# big_file="/var/log/syslog"
# for line in $(cat "$big_file"); do  # 整个文件加载到内存
#     ...
# done

echo "规则："
echo "  1. 循环体中使用 Shell 内置操作，避免外部命令"
echo "  2. 大文件读取使用 while read，不要用 for + cat"
echo "  3. 命令替换在循环条件中每轮都会执行，注意缓存结果"
echo "  4. 频繁的 stat 调用可以用 find -exec 批量处理替代"
```

### 6.8 健壮脚本模板

```bash
cat > /tmp/robust-template.sh << 'SCRIPT'
#!/bin/bash
# ==========================================
# 健壮脚本模板 —— 条件与循环版本
# ==========================================

set -euo pipefail
IFS=$'\n\t'

cleanup() {
    local exit_code=$?
    echo "[清理] 脚本退出 (码: $exit_code)"
    exit $exit_code
}
trap cleanup EXIT INT TERM

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
error(){ echo "[$(date '+%H:%M:%S')] [ERROR] $*" >&2; }

check_args() {
    if [ $# -eq 0 ]; then
        error "至少需要一个参数"
        echo "用法: $0 <参数>" >&2
        exit 1
    fi
}

ensure_file() {
    local file="$1"
    [[ -f "$file" ]] || { error "文件不存在: $file"; exit 1; }
    [[ -r "$file" ]] || { error "文件不可读: $file"; exit 1; }
}

main() {
    log "脚本开始"
    
    local count=0
    for item in "$@"; do
        log "处理: $item"
        ((count++))
        if (( count > 100 )); then
            error "条目过多 (>100)，终止"
            exit 1
        fi
    done
    
    log "完成，共处理 $count 项"
}

check_args "$@"
main "$@"
SCRIPT

chmod +x /tmp/robust-template.sh
echo "=== 模板执行测试 ==="
/tmp/robust-template.sh item1 item2 item3
rm -f /tmp/robust-template.sh
```

### 6.9 使用 shellcheck 静态分析脚本

`shellcheck` 是 Bash 脚本的静态分析工具，能捕捉大量常见错误。强烈推荐安装使用。

```bash
# 安装 shellcheck（Ubuntu）
# sudo apt install shellcheck

# 常见被 shellcheck 捕获的错误：
# SC2086: 变量引用必须加双引号，防止单词分割和文件名展开
# SC2166: 优先使用分离的 [ ] 而非 -a/-o
# SC2002: 避免无意义的 cat 命令
# SC2046: 对命令替换结果加引号
# SC2068: 数组展开时需要加引号
# SC2143: 使用 grep -q 而非 [ $(... | grep -c) -gt 0 ]
# SC2164: cd 失败时需要处理
# SC2181: 使用 if cmd; then 而非 cmd; if [ $? -eq 0 ]; then
```

### 6.10 最佳实践清单

```
==========================================
  条件与循环 —— 最佳实践清单
==========================================

【条件测试】
  + 优先使用 [[ ]] 而非 [ ]
  + 整数比较用 (( )) 而非 [ -eq ]
  + [ ] 中变量始终加双引号
  + [ ] 中避免 -a/-o，用分离的 [ ] 组合
  + 正则匹配用 [[ =~ ]]
  + 模式匹配用 [[ == pattern ]]

【条件分支】
  + 多值匹配用 case 而非长 if/elif 链
  + case 中每个分支以 ;; 结尾
  + 脚本参数解析用 case + while + shift
  + if 嵌套不超过 3 层

【循环】
  + 遍历数组用 for item in "${array[@]}"
  + C 风格遍历索引用 for ((i=0; i<n; i++))
  + 读取文件用 while IFS= read -r line
  + 避免 for line in $(cat file)
  + 管道 while 要注意子 Shell 陷阱
  + 交互菜单用 select

【流程控制】
  + break n / continue n 使用前确认嵌套深度
  + 无限循环中要有明确的退出条件
  + 循环中超时控制避免死循环

【健壮性】
  + set -euo pipefail 严格模式
  + trap cleanup EXIT 确保清理
  + 检查文件是否存在再操作
  + 检查变量是否为空再使用
  + 循环中限制最大迭代次数
  + 安装并使用 shellcheck
```

---

本章至此结束。你学习了 Bash 脚本编程的条件判断与循环——从 `test`/`[ ]`/`[[ ]]` 的三种条件测试方式，到全部 18 种文件测试运算符，到字符串/数值/正则匹配，到 `if`/`case` 的条件分支，到 `for`/`while`/`until` 的循环结构，再到 `break`/`continue` 的流程控制和 `select` 的交互菜单。这些知识赋予脚本"智能决策"和"自动重复执行"的能力，是从"静态脚本"迈向"动态程序"的关键一步。

第 25 章将进入**函数与错误处理**（Bash 脚本编程三部曲的第三部），届时你将学习如何将代码组织为可复用的函数、如何进行完整的错误处理和调试——这是写出生产级脚本的最后一块拼图。
