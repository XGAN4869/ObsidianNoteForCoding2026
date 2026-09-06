# 第 17 章 Vim 编辑器完全指南

---

## 目录

1. [概述](#1-概述)
2. [核心概念](#2-核心概念)
3. [操作详解](#3-操作详解)
4. [实战练习](#4-实战练习)
5. [常见错误与排错](#5-常见错误与排错)
6. [进阶延伸](#6-进阶延伸)

---

## 1. 概述

### 1.1 从"处理文本"到"编辑文本"

Phase 2（第 10--16 章）你掌握了 Linux 文本处理的完整工具链：`cat`/`less`（查看）、`grep`（搜索）、正则表达式（匹配规则）、`sed`（流编辑）、`awk`（分析计算）、`sort`/`uniq`/`cut`/`tr`/`xargs`（工具箱）、`tar`/`gzip`（压缩归档）。你学会了在命令行中用管道串联工具，批量处理成千上万行文本。

但有一件事你还没学会：**交互式地编辑一个文件。**

- `sed` 是脚本化的，你需要先写好命令再执行。
- `cat`/`less` 只能看不能改。
- `nano` 简单但功能有限，无法胜任复杂的编辑任务。

当你需要：
- 在服务器上修改一个配置文件（`/etc/nginx/nginx.conf`）
- 写一个 Shell 脚本或 Python 程序
- 阅读并理解一个大型代码库
- 在多个文件之间快速跳转和编辑

你需要一个真正强大的编辑器。这就是 **Vim**。

### 1.2 Vim 的历史与地位

Vim 的历史可以追溯到 1976 年，由 Bill Joy 编写的 **vi**（**Vi**sual editor）——Unix 的第一个全屏文本编辑器。1991 年，Bram Moolenaar 发布了 **Vim**（**Vi** **IM**proved，即"改进版 vi"），并在此后 30 多年里持续维护，直到 2023 年他去世。

Vim 不是"一个历史上重要的老古董"——它至今仍是 Linux 系统管理员、后端开发者和 DevOps 工程师的首选编辑器。Stack Overflow 的年度开发者调查中，Vim 始终位列最受欢迎的编辑器前五。

**为什么 Vim 长盛不衰？**

1. **无处不在**：几乎每一台 Linux/Unix 服务器都预装了 Vim（或至少 vi）
2. **纯键盘操作**：双手不离开键盘，编辑速度极快
3. **模态编辑**：Vim 的模式系统将"插入文本"和"操作文本"分离，编辑效率远超普通编辑器
4. **可扩展性**：丰富的插件生态（NERDTree、fzf、coc.nvim 等）
5. **一次学习，终身受益**：Vim 的键位（key bindings）已成为行业标准，VS Code、IntelliJ IDEA、Obsidian 等都有 Vim 模式插件

### 1.3 本章目标

本章将从头开始，系统地教授 Vim 的操作体系。你不需要记忆所有命令——只需要理解 Vim 的**设计逻辑**，然后在实践中逐步积累肌肉记忆。

完成本章后，你将能够：
- 在 Vim 中高效地打开、编辑、保存文件
- 使用各种移动命令在文件中快速导航
- 掌握删除、复制、粘贴、撤销、重做等编辑操作
- 使用搜索和替换功能批量修改文本
- 理解寄存器、宏、标记等高级特性
- 管理多窗口、多标签页和多缓冲区
- 配置自己的 `~/.vimrc` 文件
- 了解 Vim 的插件生态系统

### 1.4 前置准备

本章基于 Ubuntu 24.04 LTS，Vim 版本为 9.x。

```bash
# 确认 Vim 已安装
vim --version | head -1
# 输出：VIM - Vi IMproved 9.0 (2024 Jun 30, compiled ...)

# 如未安装
sudo apt update && sudo apt install -y vim

# 启动 Vim 的内置教程（强烈推荐在学习本章前后各做一遍）
# vimtutor
```

> **重要提示：** 本书默认使用 `vim` 而非 `vi`。在 Ubuntu 系统中，`vi` 通常指向 `vim.tiny`（功能精简版），而 `vim` 是完整版。所有本章的命令和操作都以完整版 Vim 为准。你可以通过 `sudo apt install -y vim` 确保安装了完整版。

---

## 2. 核心概念

### 2.1 模态编辑：Vim 的灵魂

Vim 与其他编辑器的最大区别在于**模态（Modal）**设计。在普通编辑器（如 VS Code、Notepad）中，键盘按键总是插入字符——你按下 `a`，屏幕就出现 "a"。但在 Vim 中，同一个按键在不同模式下有不同的含义。

**为什么要模态？**

想象你在编辑一个文档。你花多少时间"插入新文字"，又花多少时间"移动光标、删除、复制、粘贴"？研究表明，程序员和写作者花在**编辑已有内容**上的时间远多于**输入新内容**。Vim 的模态设计将编辑操作提升为"一等公民"：在 Normal（普通）模式下，每个按键都是一个编辑命令，不需要按住 Ctrl 或 Alt。

```
普通编辑器                     Vim
───────────                   ───
每次编辑都要：                  普通模式下按：
Ctrl+Shift+→ 选词              w（跳到下一词首）
Ctrl+X 剪切                    d2w（删除两个词）
Ctrl+V 粘贴                    p（粘贴）
Ctrl+Z 撤销                    u（撤销）

Vim 的方式：手指不离主键盘区，操作更短、更快
```

### 2.2 六大模式全景

Vim 有六种主要模式（有些资料统计方式不同，但以下是最实用的分类）：

```
                         启动 Vim
                            │
                            v
                    ┌───────────────┐
        ┌──────────>│    普通模式     │<──────────┐
        │           │   (Normal)     │           │
        │           └───┬───┬───┬───┘           │
        │               │   │   │               │
        │      ┌────────┘   │   └────────┐      │
        │      │            │            │      │
        │      v            v            v      │
        │  ┌──────┐   ┌──────────┐  ┌────────┐  │
        │  │ 插入  │   │  可视模式  │  │ 命令行  │  │
        │  │Insert│   │  Visual   │  │Command │  │
        │  └──┬───┘   └────┬─────┘  └───┬────┘  │
        │     │            │             │      │
        │     │     ┌──────┴──────┐      │      │
        │     │     │  (子模式)     │      │      │
        │     │     ├─────────────┤      │      │
        │     │     │ 可视行模式    │      │      │
        │     │     │ Visual-Line │      │      │
        │     │     ├─────────────┤      │      │
        │     │     │ 可视块模式    │      │      │
        │     │     │ Visual-Block│      │      │
        │     │     └─────────────┘      │      │
        │     │                          │      │
        │     v                          v      │
        │  ┌──────────┐             ┌────────┐  │
        │  │  替换模式  │             │ 按 Enter│  │
        │  │ Replace  │             │ 执行完  │  │
        │  └────┬─────┘             │ 自动返回│  │
        │       │                   └────────┘  │
        │       │         Esc / Ctrl+[          │
        └───────┴────────────────────────────────┘
```

**六种模式速查：**

| 模式 | 进入方式 | 退出方式 | 用途 |
|------|---------|---------|------|
| **Normal（普通）** | 启动 Vim，或按 `Esc` | 按 `i`/`a`/`o` 等进入插入模式 | 移动、删除、复制、粘贴等所有编辑命令 |
| **Insert（插入）** | `i`, `a`, `o`, `O`, `I`, `A` | `Esc` 或 `Ctrl+[` | 输入文本 |
| **Visual（可视）** | `v` | `Esc` | 按字符选中文本 |
| **Visual-Line（可视行）** | `V`（大写） | `Esc` | 按行选中文本 |
| **Visual-Block（可视块）** | `Ctrl+V` | `Esc` | 按矩形块选中文本（列编辑） |
| **Command-line（命令行）** | `:` | `Esc` 或执行后自动返回 | 执行 Ex 命令（保存、退出、搜索替换等） |
| **Replace（替换）** | `R` | `Esc` | 覆盖式输入（替换光标后的字符，而非插入） |

### 2.3 Vim 的"语法"：操作符 + 动作

Vim 的 Normal 模式命令遵循一种**动词+宾语**的语法结构：

```
[数字] 操作符 [数字] 动作

数字：可选的重复次数
操作符（动词）：要做什么——d（删除）、c（修改）、y（复制）、>（缩进）等
动作（宾语）：对什么做——w（词）、j（下一行）、}（段落）、G（文件末尾）等
```

**实例：**

| 命令 | 分解 | 含义 |
|------|------|------|
| `dw` | d（删除） + w（到词尾） | 删除从光标到词尾 |
| `d3w` | d（删除） + 3（三次） + w（词） | 删除三个词 |
| `c$` | c（修改） + $（到行尾） | 删除到行尾并进入插入模式 |
| `y}` | y（复制） + }（到段落尾） | 复制到段落尾 |
| `>G` | >（增加缩进） + G（到文件尾） | 从当前行缩进到文件末尾 |
| `3dd` | 3（三次） + dd（删除行） | 删除三行（dd 是特例：操作符重复 = 作用于整行） |

**这就是 Vim 的美妙之处：** 你不用记忆成千上万个组合键。你只需要学会操作符（大约 10 个）和动作（大约 20 个），它们自由组合，就能产生数百种编辑操作。

### 2.4 重复的力量：`.`（点命令）

`.`（点）是 Vim 中最强大的按键之一。它**重复上一次的修改操作**（change）。

```vim
" 假设你想要给下面三行每行末尾加上分号：
line one
line two
line three

" 操作：
" A;           ← A 跳到行尾并进入插入模式，输入 ;
" Esc          ← 返回普通模式
" j            ← 下一行
" .            ← 重复修改（在行尾加分号）
" j            ← 下一行
" .            ← 再次重复
```

> **关键理解：** `.` 重复的是"修改"（插入、删除、替换等），不是"移动"。所以 `j.j.` 是"移动，修改，移动，修改"而不是"移动，移动，移动，移动"。

### 2.5 缓冲区、窗口、标签页的概念

这三个概念容易混淆，但也必须理解：

```
┌─────────────────────────────────────────────────────────────┐
│  Vim 界面                                                    │
│                                                             │
│  ┌─ 标签页 1 ───────────────────┐ ┌─ 标签页 2 ─────────────┐ │
│  │                              │ │                        │ │
│  │  ┌─ 窗口 1 ──┐ ┌─ 窗口 2 ─┐ │ │  ┌─ 窗口 3 ──────────┐ │ │
│  │  │            │ │          │ │ │  │                    │ │ │
│  │  │  buffer a  │ │ buffer b │ │ │  │  buffer c          │ │ │
│  │  │  (file.py) │ │(test.py) │ │ │  │  (README.md)       │ │ │
│  │  │            │ │          │ │ │  │                    │ │ │
│  │  └────────────┘ └──────────┘ │ │  └────────────────────┘ │ │
│  └──────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

缓冲区（Buffer）：文件在内存中的副本。你编辑的是缓冲区，保存时才写入磁盘。
窗口（Window）：缓冲区的可视区域。同一个缓冲区可以显示在多个窗口中。
标签页（Tab Page）：窗口的集合。每个标签页可以包含一个或多个窗口。
```

**类比：**
- **缓冲区** = 你打开的文件（在内存中）
- **窗口** = 你看文件的视口
- **标签页** = 一组窗口的布局

---

## 3. 操作详解

### 3.1 基本生存技能：打开、编辑、保存、退出

在深入学习 Vim 的各项功能之前，先掌握最基本的操作——这些是你每次使用 Vim 都会用到的。

#### 3.1.1 启动与退出

```bash
# 打开文件（文件不存在则新建）
vim filename.txt

# 启动时不加载任何插件（调试用）
vim -u NONE filename.txt

# 以只读模式打开
vim -R filename.txt
# 或
view filename.txt

# 打开文件并将光标定位到指定行
vim +50 filename.txt        # 定位到第 50 行
vim +/pattern filename.txt  # 定位到第一个匹配 pattern 的行

# 恢复上次编辑中崩溃的文件
vim -r filename.txt

# 以 diff 模式比较两个文件
vim -d file1.txt file2.txt
```

**退出 Vim（这是 Vim 最著名的"梗"）：**

| 命令 | 含义 |
|------|------|
| `:q` | 退出（quit）——仅在未修改时有效 |
| `:q!` | 强制退出，放弃所有修改 |
| `:wq` | 保存并退出（write + quit） |
| `:x` | 保存并退出（与 `:wq` 相同，但只有修改时才更新文件时间戳） |
| `ZZ` | 保存并退出（Normal 模式下，等价于 `:wq`） |
| `ZQ` | 强制退出不保存（Normal 模式下，等价于 `:q!`） |
| `:w` | 保存（write）但不退出 |
| `:w filename` | 另存为（save as）指定文件名 |

```vim
" 实用示例：
" 发现改错了，想全部放弃并退出：
" 按 Esc（确保在普通模式），然后输入：
:q!

" 编辑完成，保存退出：
" 按 Esc，然后输入：
:wq
" 或直接按（普通模式下，不要按冒号）：
ZZ
```

#### 3.1.2 移动光标（基础）

在 Normal 模式下，以下按键移动光标。**强烈建议不要用方向键**——使用 `h`/`j`/`k`/`l` 保持手指在主键盘区。

```
                             k（上）
                             ↑
                    h（左） ← · → l（右）
                             ↓
                            j（下）
```

| 按键 | 移动 |
|------|------|
| `h` | 左移一个字符 |
| `j` | 下移一行 |
| `k` | 上移一行 |
| `l` | 右移一个字符 |

**为什么是 h/j/k/l？** 这些键位来自 Bill Joy 使用的 ADM-3A 终端——它的键盘上，h/j/k/l 键上正好印有方向箭头。

#### 3.1.3 进入插入模式

| 命令 | 效果 | 记忆技巧 |
|------|------|---------|
| `i` | 在光标前插入（insert） | **i**nsert |
| `a` | 在光标后追加（append） | **a**ppend |
| `I` | 在行首插入 | 大写的 i，插入到最前面 |
| `A` | 在行尾追加 | 大写的 a，追加到最后面 |
| `o` | 在下方打开新行（open） | **o**pen below |
| `O` | 在上方打开新行 | **O**pen above |

```vim
" 实践：光标在下面行的 'w' 上
the quick brown fox

" 按 i → 在 q 前面插入
" 按 a → 在 w 后面插入
" 按 I → 跳到行首插入
" 按 A → 跳到行尾插入
" 按 o → 在当前行下方另起一行并进入插入模式
" 按 O → 在当前行上方另起一行并进入插入模式
```

#### 3.1.4 最简单的编辑操作

| 命令 | 效果 |
|------|------|
| `x` | 删除光标下的字符（类似 Delete 键） |
| `X` | 删除光标前的字符（类似 Backspace 键） |
| `dd` | 删除整行 |
| `yy` | 复制（yank）整行 |
| `p` | 在光标后粘贴（paste） |
| `P` | 在光标前粘贴 |
| `u` | 撤销（undo） |
| `Ctrl+R` | 重做（redo） |
| `.` | 重复上一次修改 |

```vim
" 实践流程：
" 1. 在文件中随便输入几行文字
" 2. 按 Esc 回到普通模式
" 3. 将光标移动到某一行，按 dd → 该行被删除
" 4. 按 u → 撤销删除，该行恢复
" 5. 按 Ctrl+R → 重做删除，该行再次消失
" 6. 将光标移到另一行，按 yy（复制该行），按 p（粘贴）
" 7. 按 .（点）→ 再次粘贴！
```

### 3.2 移动命令：在文本中自由穿行

熟练掌握移动命令是 Vim 效率的关键。本节从近到远，从简单到复杂，全面介绍移动体系。

#### 3.2.1 字符级移动

| 命令 | 移动 | 记忆技巧 |
|------|------|---------|
| `h` / `j` / `k` / `l` | 左/下/上/右 | 基础方向 |
| `f{char}` | 跳到本行下一个 `{char}` 的位置（find） | **f**ind |
| `F{char}` | 跳到本行上一个 `{char}` 的位置 | **F**ind backwards |
| `t{char}` | 跳到本行下一个 `{char}` 之前（till） | **t**ill |
| `T{char}` | 跳到本行上一个 `{char}` 之后 | **T**ill backwards |
| `;` | 重复上一次 f/t/F/T | 前进 |
| `,` | 反向重复上一次 f/t/F/T | 后退 |

```vim
" 实践：光标在行首，行内容为：
" The quick brown fox jumps over the lazy dog.

" 按 fq → 光标跳到 q（quick 的 q）
" 按 ;  → 光标跳到下一个 q？没有，所以不移动
" 按 fo → 光标跳到 o（brown 的 o）
" 按 ;  → 光标跳到下一个 o（fox 的 o）
" 按 ;  → 再下一个 o（over 的 o）
" 按 ,  → 回到上一个 o（fox 的 o）
" 按 to → 光标跳到 o 之前（即 b 或 f 后面）
" 按 To → 光标跳到上一个 o 之后
```

**`f`/`t` 与 `;`/`,` 的组合是 Vim 在一行内移动最快的方式。**

#### 3.2.2 词级移动

| 命令 | 移动 | 说明 |
|------|------|------|
| `w` | 下一个词的词首 | **w**ord（标点视为分隔符） |
| `b` | 上一个词的词首 | **b**ack |
| `e` | 当前/下一个词的词尾 | **e**nd |
| `ge` | 上一个词的词尾 | go to previous **e**nd |
| `W` | 下一个空白分隔的词的词首 | 大写：忽略标点，只看空白 |
| `B` | 上一个空白分隔的词的词首 | 大写：忽略标点 |
| `E` | 当前/下一个空白分隔的词的词尾 | 大写：忽略标点 |
| `gE` | 上一个空白分隔的词的词尾 | 大写：忽略标点 |

```
小写 w/b/e 的词定义：字母、数字、下划线组成词，标点符号各自是独立词
大写 W/B/E 的词定义：任何非空白字符组成词，标点混入其中

示例（光标在行首）：
user.email = "admin@example.com";

w  → user  → .  → email  → =  → "  → admin  → @  → example  → .  → com  → ";  
W  → user.email  → =  → "admin@example.com";

b  → 从光标往回跳，遇到标点就停
B  → 从光标往回跳，只在空白处停
```

**什么时候用小写 w/b/e，什么时候用大写 W/B/E？**
- 编辑代码时：小写（`w`/`b`/`e`），因为你想在 `user.name` 中的点号处停下
- 编辑自然语言文本时：大写（`W`/`B`/`E`），因为你想跳过整个句子中的标点

#### 3.2.3 行级移动

| 命令 | 移动 |
|------|------|
| `0` | 跳到行首（第一个字符位置，包括空白） |
| `^` | 跳到本行第一个非空白字符 |
| `$` | 跳到行尾 |
| `g_` | 跳到本行最后一个非空白字符 |

```vim
" 实践：行内容为 "    hello world    "
" 0 → 光标跳到第 1 列（空白处）
" ^ → 光标跳到 'h' 上
" $ → 光标跳到最后一个空白之后（行尾）
" g_ → 光标跳到 'd' 上
```

#### 3.2.4 文件级移动

| 命令 | 移动 |
|------|------|
| `gg` | 跳到文件第一行 |
| `G` | 跳到文件最后一行 |
| `{N}gg` 或 `{N}G` | 跳到第 N 行 |
| `{N}%` | 跳到文件的 N% 位置（如 `50%` 跳到文件中间） |
| `H` | 跳到屏幕顶行（High） |
| `M` | 跳到屏幕中间行（Middle） |
| `L` | 跳到屏幕底行（Low） |

```vim
" 实践：
" gg = 跳到文件开头
" G  = 跳到文件末尾
" 50gg 或 :50 然后 Enter = 跳到第 50 行
" 50% = 跳到文件中间
```

#### 3.2.5 屏幕滚动（光标不离开当前行）

| 命令 | 效果 |
|------|------|
| `Ctrl+U` | 向上滚动半屏（Up） |
| `Ctrl+D` | 向下滚动半屏（Down） |
| `Ctrl+B` | 向上滚动一屏（Back） |
| `Ctrl+F` | 向下滚动一屏（Forward） |
| `Ctrl+Y` | 向上滚动一行 |
| `Ctrl+E` | 向下滚动一行 |
| `zz` | 将当前行置于屏幕中央（推荐！） |
| `zt` | 将当前行置于屏幕顶部（top） |
| `zb` | 将当前行置于屏幕底部（bottom） |

```vim
" 常用的组合：
" Ctrl+D 向下半屏（刚好够你看到新内容，又保留了上下文）
" Ctrl+U 向上半屏
" zz 将当前行居中——浏览代码时非常有用
```

#### 3.2.6 段落与块级移动

| 命令 | 移动 |
|------|------|
| `{` | 跳到上一个空行（段落开始） |
| `}` | 跳到下一个空行（段落结束） |
| `(` | 跳到上一句 |
| `)` | 跳到下一句 |
| `[[` | 跳到上一个代码块开始（C 语言风格的 `{`） |
| `]]` | 跳到下一个代码块开始 |
| `[]` | 跳到上一个代码块结束 |
| `][` | 跳到下一个代码块结束 |
| `%` | 跳到匹配的括号（`()`、`[]`、`{}`） |

```vim
" { 和 } 在编辑散文或结构化配置文件时非常有用
" % 在编辑代码时是必备技能——光标在 ( 上按 %，跳到对应的 )
```

#### 3.2.7 搜索跳转

| 命令 | 效果 |
|------|------|
| `/pattern` | 向下搜索 pattern |
| `?pattern` | 向上搜索 pattern |
| `n` | 跳转到下一个匹配 |
| `N` | 跳转到上一个匹配 |
| `*` | 向下搜索光标下的单词（整词匹配） |
| `#` | 向上搜索光标下的单词（整词匹配） |
| `g*` | 向下搜索光标下的单词（部分匹配） |
| `g#` | 向上搜索光标下的单词（部分匹配） |

```vim
" 实践（在 Vim 中）：
" 将光标放在任意一个单词上，按 * → 自动搜索该单词
" 按 n → 跳到下一个出现
" 按 N → 跳回上一个出现
"
" 手动搜索：
" /error 然后 Enter → 搜索 "error"
" 按 n / N → 在匹配之间跳转
```

#### 3.2.8 标记（Marks）：快速返回之前的位置

标记让你在文件中"钉"住位置，之后可以瞬间跳回。

| 命令 | 效果 |
|------|------|
| `m{a-z}` | 在当前光标位置设置局部标记（小写字母，仅当前文件有效） |
| `m{A-Z}` | 设置全局标记（大写字母，跨文件有效） |
| `'{mark}` | 跳到标记所在行的第一个非空白字符 |
| `` `{mark} `` | 跳到标记所在行和列的精确位置 |
| `` `` `` | 跳回上一次跳转之前的位置（极其常用！） |
| `''` | 跳回上一行的第一个非空白字符 |
| `:marks` | 列出所有标记 |

```vim
" 实践：
" 1. 在文件某处按 ma（设置标记 a）
" 2. 滚动到文件的另一个位置
" 3. 按 'a → 跳到标记 a 所在行
" 4. 按 `a → 跳到标记 a 的精确行列
" 5. 按 `` → 跳回步骤 3 之前的位置
"
" 场景：你正在第 100 行写代码，突然需要跳到第 500 行查看一个函数
" 在 100 行按 ma，跳到 500 行查看完毕后，按 'a 立即返回
"
" 查看所有标记：
:marks
```

#### 3.2.9 跳转列表与变更列表

Vim 自动记录你的位置历史。

| 命令 | 效果 |
|------|------|
| `Ctrl+O` | 跳转到更早的位置（后退） |
| `Ctrl+I` | 跳转到更新的位置（前进） |
| `:jumps` | 查看跳转列表 |
| `g;` | 跳到上一个修改的位置 |
| `g,` | 跳到下一个修改的位置 |
| `:changes` | 查看修改位置列表 |

```vim
" Ctrl+O / Ctrl+I 是浏览代码的神器：
" 你从 main() → helper() → utility() 一路深入
" 按 Ctrl+O 倒退：回到 helper()，再按一下回到 main()
" 按 Ctrl+I 前进：回到 utility()
```

### 3.3 编辑操作：Vim 的核心能力

有了移动能力，现在来学习"编辑"——对文本执行实际的操作。

#### 3.3.1 操作符 + 动作 = 编辑操作

回顾 2.3 节的语法。以下是所有操作符：

| 操作符 | 全称 | 效果 | 示例 |
|--------|------|------|------|
| `d` | delete | 删除 | `dw`（删除到词尾） |
| `c` | change | 修改（删除并进入插入模式） | `cw`（修改到词尾） |
| `y` | yank | 复制（到寄存器） | `yw`（复制一个词） |
| `>` | indent | 增加缩进 | `>}`（缩进到段落尾） |
| `<` | unindent | 减少缩进 | `<}`（反缩进到段落尾） |
| `=` | format | 自动格式化 | `=}`（格式化到段落尾） |
| `gu` | lowercase | 转为小写 | `guw`（一个词转小写） |
| `gU` | uppercase | 转为大写 | `gUw`（一个词转大写） |
| `g~` | toggle case | 切换大小写 | `g~w`（一个词切换大小写） |
| `!` | filter | 通过外部命令过滤 | `!}sort`（段落内容通过 sort 命令） |

**操作符连击：** 操作符重复两次表示作用于整行。

| 命令 | 效果 |
|------|------|
| `dd` | 删除整行 |
| `cc` | 修改整行（清空行并进入插入模式，保留缩进） |
| `yy` | 复制整行 |
| `>>` | 增加整行缩进 |
| `<<` | 减少整行缩进 |
| `==` | 自动格式化整行 |

```vim
" 常用组合示例（光标在行首）：
" the quick brown fox jumps over the lazy dog

" d2w  → 删除 "the quick"，留下 "brown fox jumps over the lazy dog"
" c3w  → 删除 "the quick brown" 并进入插入模式（等待你输入新内容）
" y2w  → 复制 "the quick"（偷偷存起来，后面用 p 粘贴）
" guw  → "THE quick..."（但只将 "the" 变成大写？不，guw 是转小写）
"       → "the" 已经小写，不变。对 "THE" 用 guw 变成 "the"
" gUw  → "THE quick..."
```

#### 3.3.2 动宾组合速查表

以下是操作符 + 动作的常用组合，你可以按此模式自行扩展：

| 操作 | 到词尾 | 到行尾 | 到段落尾 | 到文件尾 | 整行 | 到指定字符 |
|------|--------|--------|---------|---------|------|-----------|
| **删除** | `dw` | `d$` 或 `D` | `d}` | `dG` | `dd` | `dfx` |
| **修改** | `cw` | `c$` 或 `C` | `c}` | `cG` | `cc` | `cfx` |
| **复制** | `yw` | `y$` | `y}` | `yG` | `yy` | `yfx` |
| **缩进** | `>w` | `>$` | `>}` | `>G` | `>>` | — |
| **小写** | `guw` | `gu$` | `gu}` | `guG` | `guu` | — |
| **大写** | `gUw` | `gU$` | `gU}` | `gUG` | `gUU` | — |

> **注意：** `D` 等价于 `d$`，`C` 等价于 `c$`，`Y` 在某些配置中等价于 `y$`（但默认等价于 `yy`）。

#### 3.3.3 文本对象（Text Objects）：Vim 编辑的终极武器

文本对象是比 `w`/`$`/`}` 更高层次的动作。它们操作的是**有语法意义的文本块**而不是"从光标开始的字符/行"。

文本对象由两部分组成：`i`（inner，内部）或 `a`（a，包含边界）+ 对象类型。

| 命令 | 含义 | 示例文本（`|` 为光标位置） |
|------|------|--------------------------|
| `iw` | inner word：光标所在的词（不含前后空格） | `hello \|world foo` → 操作 "world" |
| `aw` | a word：包含词后的空格 | `hello \|world foo` → 操作 "world " |
| `iW` | inner WORD：空白分隔的词 | 同上（大写忽略标点） |
| `aW` | a WORD：同上，包含空格 | |
| `is` | inner sentence：光标所在句子 | |
| `as` | a sentence：包含句尾空格 | |
| `ip` | inner paragraph：光标所在段落 | |
| `ap` | a paragraph：包含段落后空行 | |
| `i"` | inner double quotes：双引号内的内容 | `"hello \|world"` → 操作 "hello world" |
| `a"` | a double quotes：包含双引号本身 | `"hello \|world"` → 操作 `"hello world"` |
| `i'` | inner single quotes：单引号内 | |
| `a'` | a single quotes：包含单引号 | |
| `i)` 或 `ib` | inner parentheses/bracket：括号内 | `foo(\|a, b, c)` → 操作 "a, b, c" |
| `a)` 或 `ab` | a parentheses：包含括号 | `foo(\|a, b, c)` → 操作 "(a, b, c)" |
| `i]` | inner square brackets：方括号内 | |
| `a]` | a square brackets：包含方括号 | |
| `i}` 或 `iB` | inner braces：花括号内 | |
| `a}` 或 `aB` | a braces：包含花括号 | |
| `i>` | inner angle brackets：尖括号内 | |
| `a>` | a angle brackets：包含尖括号 | |
| `` i` `` | inner backticks：反引号内 | |
| `it` | inner tag：HTML/XML 标签内 | `<p>hello \|world</p>` → 操作 "hello world" |
| `at` | a tag：包含标签本身 | 同上，操作 `<p>hello world</p>` |

```vim
" 文本对象实战（| 代表光标位置）：

" 文本：print("hello |world, welcome")
" ci" → 删除双引号内所有内容，进入插入模式
"      → print("")  光标在引号之间
" 输入 new text → print("new text")

" 文本：function(|arg1, arg2, arg3)
" ci( → 删除括号内所有内容 → function()
" 或 ci) → 同样效果

" 文本：[1, 2, |3, 4, 5]
" di] → 删除方括号内 → []

" 文本：<div>Hello |World</div>
" cit → 删除标签内内容 → <div></div>
" cat → 删除标签及内容 → （整个 div 被删除）

" 文本：Lorem |ipsum dolor sit amet.
" dis → 删除整句话（sentence）
" yap → 复制整段（paragraph）
```

**文本对象是 Vim 效率的飞升之翼。** 一旦你习惯了 `ci"`（修改双引号内）、`da{`（删除花括号块）、`yap`（复制段落），你会发现普通编辑器的 Ctrl+Shift+方向键选择有多低效。

#### 3.3.4 单个字符操作

| 命令 | 效果 | 说明 |
|------|------|------|
| `x` | 删除光标下字符 | 相当于 Delete 键 |
| `X` | 删除光标前字符 | 相当于 Backspace 键 |
| `s` | 删除光标下字符并进入插入模式 | substitute（替换一个字符） |
| `r{char}` | 将光标下字符替换为 `{char}` | replace，不进入插入模式 |
| `R` | 进入替换模式（覆盖式输入） | Replace 模式，按 Esc 退出 |
| `~` | 切换光标下字符的大小写 | 然后光标自动右移一位 |
| `J` | 将下一行合并到当前行尾（Join） | 两行之间会加一个空格 |
| `gJ` | 将下一行合并到当前行尾（不加空格） | |

```vim
" 实践：
" r 的妙用：
" 光标在 "cat" 的 c 上，按 rd → "dat"  （替换一个字符，不进入插入模式）
" 这比 i、删除、输入快得多

" ~ 的妙用：
" 光标在 "hello" 的 h 上，按 ~ → "Hello"
" 再按 ~ → 变回 "hello"

" J 的妙用：
" 有两行：
" This is line one
" and this is line two
" 光标在第一行，按 J → "This is line one and this is line two"
```

#### 3.3.5 撤销与重做

| 命令 | 效果 |
|------|------|
| `u` | 撤销上一次修改（undo） |
| `Ctrl+R` | 重做（redo）——撤销的反操作 |
| `U` | 撤销对当前行的所有修改（在一行中） |

```vim
" u 和 Ctrl+R 的关系：
" 连续按 u → 一直往回撤销
" 按过头了 → 按 Ctrl+R → 前进

" 注意：U 是特殊的——它只恢复当前行的修改。
" 一旦光标离开该行，该行的"历史"就丢失了。
" 一般不推荐依赖 U，建议只用 u/Ctrl+R。
```

#### 3.3.6 复制、粘贴与寄存器

Vim 的复制粘贴不只是 Ctrl+C/Ctrl+V 那么简单。Vim 有**寄存器（Register）**的概念。

**默认行为：**

| 命令 | 效果 |
|------|------|
| `y{motion}` | 复制（yank）指定范围 |
| `yy` | 复制整行 |
| `Y` | 复制整行（注意：默认等价于 yy，不是 y$） |
| `p` | 在光标后粘贴 |
| `P` | 在光标前粘贴 |

**"剪切"操作：** `d`（删除）和 `x` 不仅删除文本，还会把被删除的内容存入寄存器，所以 `d` 实际上也是"剪切"。用 `p` 就能粘贴回来。

```vim
" 实践：
" dd → 删除一行（实际上剪切到寄存器）
" p  → 把刚删除的那行粘贴回来
"
" 如果你想"真正删除"（不覆盖寄存器），使用黑洞寄存器：
" "_dd → 删除行但不存储到任何寄存器
```

**寄存器系统：**

Vim 有 48 个寄存器，按用途分类：

| 寄存器 | 用途 | 说明 |
|--------|------|------|
| `""` | 无名寄存器（默认） | 最近的删除/复制操作都存这里 |
| `"0` | 复制专用寄存器 | 最近一次 `y`（复制）的内容 |
| `"1` - `"9` | 删除历史寄存器 | `"1` 存最近删除，`"2` 存次近...`"9` 存最早的 |
| `"a` - `"z` | 命名寄存器 | 用户明确指定，Vim **从不**自动覆盖 |
| `"+` | 系统剪贴板 | 与操作系统的 Ctrl+C/Ctrl+V 互通 |
| `"*` | 选择剪贴板 | Linux 的中键粘贴（选中即复制） |
| `"_` | 黑洞寄存器 | 写入此寄存器的内容被丢弃 |
| `"/` | 搜索寄存器 | 最近一次搜索的模式 |
| `":` | 命令寄存器 | 最近一次执行的 Ex 命令 |
| `"%` | 文件名寄存器 | 当前文件名 |
| `"=` | 表达式寄存器 | 执行 Vim 表达式并将结果作为文本 |

**寄存器操作：**

```vim
" 存入命名寄存器 a：
"ayy    → 将当前行复制到寄存器 a
"add    → 将当前行剪切到寄存器 a
"ayiw   → 将当前词复制到寄存器 a

" 从命名寄存器 a 粘贴：
"ap     → 粘贴寄存器 a 的内容

" 查看所有寄存器的内容：
:reg
" 或只查看特定寄存器：
:reg a
:reg abcd
:reg "+

" 系统剪贴板互通：
"+y     → 复制到系统剪贴板（Ctrl+C 可用）
"+yy    → 复制整行到系统剪贴板
"+p     → 从系统剪贴板粘贴（Ctrl+V 可用）

" 逐字符追加到寄存器（大写寄存器名追加而非覆盖）：
"Ayy    → 将当前行追加到寄存器 a（不覆盖 a 中已有内容）
```

```vim
" 实践场景：将三个不同位置的内容收集到一起并粘贴
" 1. 光标在位置 1： "ayiw  → 存入寄存器 a
" 2. 光标在位置 2： "Ayiw  → 追加到寄存器 a（注意大写 A！）
" 3. 光标在位置 3： "Ayiw  → 再次追加
" 4. 移动到目标位置： "ap  → 粘贴所有三个词
```

> **关于系统剪贴板：** Ubuntu 24.04 的 Vim 默认编译时包含 `+clipboard` 特性。确认你的 Vim 支持系统剪贴板：
> ```bash
> vim --version | grep clipboard
> # 看到 +clipboard 表示支持，-clipboard 表示不支持
> # 如果显示 -clipboard，安装图形版 Vim：
> # sudo apt install -y vim-gtk3
> ```

#### 3.3.7 可视模式：可视化选择

Vim 有三种可视模式，让你像普通编辑器一样"选中"文本，然后对选中区域执行操作。

**进入可视模式：**

| 命令 | 模式 | 选中方式 |
|------|------|---------|
| `v` | 可视模式（字符级） | 逐字符选择 |
| `V` | 可视行模式 | 逐行选择 |
| `Ctrl+V` | 可视块模式 | 矩形块选择 |

**在可视模式中操作：**

选中文本后，按操作符执行操作：

```vim
" 字符可视模式（v）：
" 按 v，然后移动光标来扩展选区
" 按 d → 删除选中文本
" 按 y → 复制选中文本
" 按 c → 修改选中文本（删除并进入插入模式）
" 按 > → 增加缩进
" 按 < → 减少缩进
" 按 ~ → 切换大小写
" 按 U → 转为大写
" 按 u → 转为小写

" 可视行模式（V）：
" 按 V，然后 j/k 扩展选区
" 按 d → 删除选中的行
" 按 y → 复制选中的行

" 可视块模式（Ctrl+V）——列编辑利器：
" 假设有以下文本：
" name = "alice"
" age  = "25"
" city = "paris"

" 目标：在每行前面插入 "# "
" 操作：Ctrl+V 进入块模式 → 按 3j 选中第一列 → 按 I（大写）→ 输入 "# " → 按 Esc
" 效果：
" # name = "alice"
" # age  = "25"
" # city = "paris"

" 目标：把三行的 = 后面部分全部删除
" 操作：Ctrl+V → 移动光标选中 = 后面的区域 → 按 d
```

**可视块模式的常见场景：**

```vim
" 场景 1：批量注释/取消注释
" 可视块选中多行首列 → I 输入 // → Esc  （添加注释）
" 可视块选中注释符号 → x 或 d  （删除注释）

" 场景 2：列值批量替换
" id  | name  | score
" ----+-------+------
" 1   | Alice | 85
" 2   | Bob   | 92
" 3   | Carol | 78

" 光标在 score 列的 8 上，Ctrl+V 进入块模式
" 选中整列 → c → 输入新值 → Esc
" → 整列被替换为新值！

" 场景 3：追加相同文本到多行行尾
" Ctrl+V 进入块模式 → $ 扩展到行尾 → A 输入内容 → Esc
```

#### 3.3.8 宏：录制并回放操作

宏让你将一组编辑操作录制下来，然后在其他地方回放。这是批量重复操作的终极武器。

| 命令 | 效果 |
|------|------|
| `q{a-z}` | 开始录制宏到寄存器 {a-z}（如 `qa` 录制到 a） |
| `q` | 在录制状态下再按 `q` 结束录制 |
| `@a` | 执行寄存器 a 中的宏 |
| `@@` | 重复执行最近一次执行的宏 |
| `{N}@a` | 将寄存器 a 的宏执行 N 次 |

```vim
" 实践场景：将以下文本的每一行转换为 HTML <li> 标签
" apple
" banana
" cherry
" date

" 步骤：
" 1. 光标在第一行任意位置
" 2. qa     → 开始录制到寄存器 a
" 3. I<li>  → 在行首插入 <li>
" 4. Esc    → 回到普通模式
" 5. A</li> → 在行尾追加 </li>
" 6. Esc    → 回到普通模式
" 7. j      → 下一行（为下次执行做准备！）
" 8. q      → 结束录制
" 9. 3@a    → 对剩余 3 行各执行一次宏

" 结果：
" <li>apple</li>
" <li>banana</li>
" <li>cherry</li>
" <li>date</li>
```

**宏的设计技巧：**

1. **使用与行位置无关的移动**：用 `/pattern` 而非 `j`/`k`（除非你确定在录制中移动的行数）
2. **在宏末尾准备好下一次执行的条件**：如在末尾放一个 `j` 或 `n`（下一个匹配）
3. **使用 `@@` 快速批量执行**：`100@@` 执行宏 100 次
4. **查看宏内容**：`"ap` 粘贴寄存器 a 的内容，或 `:reg a`

```vim
" 更复杂的宏示例：格式化 CSV 数据
" 原始数据：
" alice,engineering,85000
" bob,marketing,65000

" 目标格式：Name: Alice | Dept: Engineering | Salary: 85000

" 录制宏：
" qb
" 0           → 跳到行首
" f,          → 找到第一个逗号
" r|          → 替换为 |
" ~           → 首字母大写（在逗号原位置，上一步的 r 已经改变字符）
" 更好的做法（重新录制）：
" qc
" ^           → 行首第一个非空白
" ~           → 首字母大写
" f,          → 找到逗号
" r|          → 替换为管道符
" ;           → 跳到下一个逗号
" r|          → 替换为管道符
" IName:      → 行首插入
" Esc
" q
```

### 3.4 搜索与替换

#### 3.4.1 搜索

| 命令 | 效果 |
|------|------|
| `/pattern` | 向下搜索 pattern |
| `?pattern` | 向上搜索 pattern |
| `n` | 下一个匹配 |
| `N` | 上一个匹配 |
| `/` 然后 Enter | 重复上一次搜索 |
| `?` 然后 Enter | 重复上一次反向搜索 |

**搜索选项（在搜索模式末尾使用）：**

| 选项 | 效果 | 示例 |
|------|------|------|
| `\c` | 忽略大小写（当前搜索） | `/hello\c` |
| `\C` | 强制区分大小写 | `/hello\C` |

**搜索相关的设置（`:set` 命令）：**

```vim
" 搜索时高亮所有匹配
:set hlsearch

" 禁用高亮
:set nohlsearch
" 或临时关闭：:nohlsearch（当前搜索结果消失，但下次搜索还会高亮）

" 增量搜索（边输入边跳转）
:set incsearch

" 搜索时忽略大小写
:set ignorecase
" 但如果有大写字母出现，自动区分大小写（推荐！）
:set smartcase
" 效果：/hello 匹配 hello/Hello/HELLO
"        /Hello 只匹配 Hello
```

#### 3.4.2 替换（Substitute 命令）

替换命令 `:s` 是 Vim 中使用频率最高的 Ex 命令之一，与 sed 的 `s` 命令语法相似。

**基本语法：**

```
:[range]s/pattern/replacement/[flags]
```

| 部分 | 说明 |
|------|------|
| `[range]` | 替换范围（省略时 = 当前行） |
| `s` | substitute 命令 |
| `/` | 分隔符（可用其他字符如 `#`、`@`、`|`） |
| `pattern` | 要查找的正则表达式 |
| `replacement` | 替换文本（支持 `\1`-`\9` 反向引用和 `&`） |
| `[flags]` | 替换标志 |

**常用范围：**

| 范围写法 | 含义 |
|---------|------|
| 无 | 当前行 |
| `%` | 整个文件（等价于 `1,$`） |
| `1,10` | 第 1 行到第 10 行 |
| `.,$` | 当前行到文件末尾 |
| `.,+5` | 当前行及之后 5 行（共 6 行） |
| `'<,'>` | 可视模式选中区域（进入命令行后自动出现） |

**常用标志：**

| 标志 | 效果 |
|------|------|
| 无 | 只替换每行第一个匹配 |
| `g` | 替换每行所有匹配（global） |
| `c` | 每次替换前确认（confirm） |
| `i` | 忽略大小写 |
| `I` | 区分大小写 |
| `n` | 不实际替换，只报告匹配次数 |
| `e` | 不报告"未找到匹配"错误 |

```vim
" === 基本替换 ===
" 替换当前行第一个 "foo" 为 "bar"
:s/foo/bar/

" 替换当前行所有 "foo" 为 "bar"
:s/foo/bar/g

" 替换整个文件所有 "foo" 为 "bar"
:%s/foo/bar/g

" 替换第 5 行到第 20 行的 "foo" 为 "bar"
:5,20s/foo/bar/g

" === 确认替换 ===
" 对每次替换提示 y（是）/ n（否）/ a（全部是）/ q（退出）/ l（替换这一个并退出）
:%s/old/new/gc

" === 正则替换 ===
" 使用捕获分组：交换两列
:%s/\(\w\+\), \(\w\+\)/\2, \1/g
" 或使用 very magic 模式（\v），减少反斜杠：
:%s/\v(\w+), (\w+)/\2, \1/g

" 使用 & 引用整个匹配：给数字加中括号
:%s/\d\+/[&]/g

" === 替换中的特殊符号 ===
" \r = 回车（换行）
" \t = 制表符
" \n = 换行符（LF）
" \\ = 字面量反斜杠

" 将逗号替换为换行（拆分成多行）
:%s/,/\r/g

" === 统计匹配次数 ===
:%s/pattern//n
" 输出：X matches on Y lines
```

#### 3.4.3 全局命令（Global Command）

`:g`（global）命令比 `:%s` 更强大：它对匹配 pattern 的每一行执行任意 Ex 命令。

```
:g/pattern/command
```

| 变体 | 效果 |
|------|------|
| `:g/pattern/d` | 删除所有匹配的行 |
| `:g/pattern/norm @a` | 在所有匹配行上执行宏 a |
| `:g/pattern/m$` | 将所有匹配行移到文件末尾 |
| `:g/pattern/t$` | 将所有匹配行复制到文件末尾 |
| `:g/pattern/s/old/new/g` | 在匹配行上执行替换 |
| `:g!/pattern/d` 或 `:v/pattern/d` | 删除所有**不**匹配的行 |
| `:g/pattern/` | 打印匹配行（等价于 `:p`） |

```vim
" 实践：
" 删除所有空行：
:g/^$/d

" 删除所有注释行（以 # 开头）：
:g/^\s*#/d

" 将所有包含 TODO 的行移到文件末尾：
:g/TODO/m$

" 在所有包含 ERROR 的行上执行宏 a：
:g/ERROR/norm @a

" 删除所有不是以 #include 开头的行（反向匹配）：
:v/^#include/d
" 或等价于：
:g!/^#include/d

" 对匹配行执行多个命令（用 | 分隔）：
:g/function/ s/foo/bar/g | s/baz/qux/g
```

### 3.5 窗口管理

Vim 的窗口系统让你在一个终端中同时编辑和查看多个文件。

#### 3.5.1 创建与关闭窗口

| 命令 | 效果 |
|------|------|
| `:sp` 或 `:split` | 水平分割窗口（当前文件） |
| `:sp filename` | 水平分割窗口并打开另一文件 |
| `:vs` 或 `:vsplit` | 垂直分割窗口 |
| `:vs filename` | 垂直分割窗口并打开另一文件 |
| `:new` | 水平分割，打开一个空缓冲区 |
| `:vnew` | 垂直分割，打开一个空缓冲区 |
| `Ctrl+W q` | 关闭当前窗口 |
| `Ctrl+W c` | 关闭当前窗口（同 `:q`） |
| `Ctrl+W o` | 只保留当前窗口，关闭其他所有窗口（only） |
| `:q` | 关闭当前窗口（如果是最后一个窗口则退出 Vim） |

```vim
" 三种最常用的窗口操作：
" :vs          → 垂直分割当前文件
" :vs other.py → 垂直分割并打开 other.py
" Ctrl+W q     → 关闭当前窗口
```

#### 3.5.2 Ctrl+W 系列：窗口间导航与调整

`Ctrl+W` 是窗口操作的"前缀键"，按下 `Ctrl+W` 后的下一个按键决定具体操作。

**窗口间跳转：**

| 命令 | 效果 |
|------|------|
| `Ctrl+W h` / `j` / `k` / `l` | 跳到左/下/上/右的窗口 |
| `Ctrl+W w` | 循环跳到下一个窗口 |
| `Ctrl+W W` | 反向循环跳到上一个窗口 |
| `Ctrl+W p` | 跳回上一个活动窗口（previous） |
| `Ctrl+W t` | 跳转到最左上角的窗口（top） |
| `Ctrl+W b` | 跳转到最右下角的窗口（bottom） |

**窗口大小调整：**

| 命令 | 效果 |
|------|------|
| `Ctrl+W +` | 增加当前窗口高度 |
| `Ctrl+W -` | 减少当前窗口高度 |
| `Ctrl+W >` | 增加当前窗口宽度 |
| `Ctrl+W <` | 减少当前窗口宽度 |
| `Ctrl+W =` | 等分所有窗口大小 |
| `Ctrl+W _` | 最大化当前窗口高度 |
| `Ctrl+W \|` | 最大化当前窗口宽度 |
| `:resize N` | 设置当前窗口高度为 N 行 |
| `:vertical resize N` | 设置当前窗口宽度为 N 列 |

**窗口位置互换：**

| 命令 | 效果 |
|------|------|
| `Ctrl+W r` | 顺时针轮转窗口位置（rotate） |
| `Ctrl+W R` | 逆时针轮转窗口位置 |
| `Ctrl+W x` | 与下一个窗口交换位置（exchange） |
| `Ctrl+W H` | 将当前窗口移到最左边 |
| `Ctrl+W J` | 将当前窗口移到最下边 |
| `Ctrl+W K` | 将当前窗口移到最上边 |
| `Ctrl+W L` | 将当前窗口移到最右边 |

```vim
" 典型工作流程：
" 1. vim file.py
" 2. :vs test_file.py    → 左右分屏
" 3. Ctrl+W l            → 跳到右边窗口
" 4. Ctrl+W w            → 回到左边窗口
" 5. Ctrl+W >            → 加大当前窗口宽度
" 6. 编辑完成后 Ctrl+W q → 关闭右边窗口
```

### 3.6 标签页管理

标签页（Tab Pages）是窗口布局的集合。每个标签页可以包含多个窗口。

| 命令 | 效果 |
|------|------|
| `:tabnew` | 打开一个新标签页（空） |
| `:tabnew filename` | 在新标签页中打开文件 |
| `:tabedit filename` | 同上（`:tabe` 是缩写） |
| `:tabclose` | 关闭当前标签页（`:tabc`） |
| `:tabonly` | 只保留当前标签页，关闭其他（`:tabo`） |
| `:tabnext` | 下一个标签页（`:tabn`） |
| `:tabprevious` | 上一个标签页（`:tabp`） |
| `:tabfirst` | 第一个标签页 |
| `:tablast` | 最后一个标签页 |
| `gt` | 下一个标签页（Normal 模式） |
| `gT` | 上一个标签页（Normal 模式） |
| `{N}gt` | 跳到第 N 个标签页 |
| `:tabmove N` | 将当前标签页移到第 N 个位置（0 = 最前） |

```vim
" 典型使用场景：
" 标签页 1：源代码（多个窗口：主代码 + 头文件）
" 标签页 2：测试文件
" 标签页 3：文档/笔记

" 快捷切换：
" gt   → 下一个标签页
" gT   → 上一个标签页
" 2gt  → 跳到第 2 个标签页
```

### 3.7 缓冲区管理

缓冲区（Buffer）是 Vim 中文件的内存表示。你可以打开多个文件，它们在后台作为缓冲区存在，你可以随时切换。

| 命令 | 效果 |
|------|------|
| `:ls` | 列出所有缓冲区（`:buffers`，`:files`） |
| `:b N` | 切换到编号为 N 的缓冲区 |
| `:b filename` | 切换到文件名为 filename 的缓冲区（Tab 补全可用） |
| `:bn` | 下一个缓冲区（`:bnext`） |
| `:bp` | 上一个缓冲区（`:bprevious`） |
| `:bf` | 第一个缓冲区（`:bfirst`） |
| `:bl` | 最后一个缓冲区（`:blast`） |
| `:bd` | 删除（卸载）当前缓冲区（`:bdelete`） |
| `:bd N` | 删除编号为 N 的缓冲区 |
| `:bufdo cmd` | 对所有缓冲区执行 cmd |
| `:e filename` | 打开（编辑）另一个文件（`:edit`） |
| `:e!` | 重新读取当前文件（放弃未保存的修改） |

```vim
" :ls 的输出解读：
"   1 #h   "file1.py"                    line 10
"   2 %a   "file2.py"                    line 25
"   3      "file3.py"                    line 1
"
" 符号含义：
" % = 当前窗口显示的缓冲区
" # = 轮换缓冲区（alternate buffer，Ctrl+^ 可以切换过去）
" a = 活动缓冲区（已加载且在窗口中）
" h = 隐藏缓冲区（已加载但不在窗口中）
" + = 缓冲区有未保存的修改

" 快速切换到轮换缓冲区（在最近两个文件之间切换）：
" Ctrl+^ 或 Ctrl+6
" 这在两个文件间来回跳时极其有用！

" 批量操作示例：
" 保存所有缓冲区：:bufdo w
" 在所有缓冲区中替换：:bufdo %s/old/new/ge | update
```

### 3.8 Vim 配置：~/.vimrc

`~/.vimrc` 是 Vim 的配置文件，在 Vim 启动时自动读取。通过它，你可以自定义 Vim 的行为和外观。

#### 3.8.1 基础配置推荐

```vim
" ~/.vimrc — Vim 配置文件
" 以 " 开头的行为注释

" ===== 基础设置 =====
set nocompatible        " 关闭 vi 兼容模式（必须放在第一行）

" ===== 显示 =====
set number              " 显示行号
set relativenumber      " 显示相对行号（当前行显示绝对行号，其余行显示相对距离）
set cursorline          " 高亮当前行
set showcmd             " 在右下角显示正在输入的命令
set showmode            " 在左下角显示当前模式
set ruler               " 在右下角显示光标位置（行号,列号）
set title               " 在终端标题栏显示文件名

" ===== 搜索 =====
set hlsearch            " 高亮搜索结果
set incsearch           " 增量搜索（边输入边跳转）
set ignorecase          " 搜索时忽略大小写
set smartcase           " 但如果包含大写字母，自动区分大小写

" ===== 缩进 =====
set autoindent          " 自动缩进（新行继承上一行的缩进）
set smartindent         " 智能缩进（根据语法自动调整）
set tabstop=4           " Tab 显示的宽度
set shiftwidth=4        " >> / << 缩进宽度
set expandtab           " 将 Tab 转换为空格
set softtabstop=4       " 在插入模式下，按 Tab 插入 4 个空格

" ===== 编码 =====
set encoding=utf-8      " Vim 内部使用的编码
set fileencoding=utf-8  " 文件保存时使用的编码
set fileencodings=utf-8,gbk,gb2312,cp936,latin1  " 打开文件时尝试的编码列表

" ===== 杂项 =====
set mouse=a             " 在所有模式下启用鼠标（终端支持的话）
set clipboard=unnamedplus  " 将默认寄存器与系统剪贴板同步（需要 +clipboard）
set history=1000        " 保留 1000 条命令历史
set undofile            " 持久化撤销历史（即使关闭 Vim 也能撤销）
set undodir=~/.vim/undo " 撤销历史存储目录
set backupdir=~/.vim/backup " 备份文件存储目录
set directory=~/.vim/swap   " 交换文件存储目录
set splitright          " :vsplit 时新窗口在右边
set splitbelow          " :split 时新窗口在下方
set hidden              " 允许隐藏未保存的缓冲区（切换缓冲区时不强制保存）
set autoread            " 文件被外部修改时自动重新读取
set wildmenu            " 命令行补全时显示菜单
set confirm             " 未保存退出时弹出确认对话框

" ===== 快捷键映射 =====
" 将 <Leader> 键映射为空格键（默认是 \）
let mapleader = "\<Space>"

" 使用 jk 快速退出插入模式（替代 Esc）
inoremap jk <Esc>

" 保存文件
nnoremap <Leader>w :w<CR>

" 退出当前窗口
nnoremap <Leader>q :q<CR>

" 关闭搜索高亮
nnoremap <Leader>h :nohlsearch<CR>

" 窗口导航（用 Ctrl+h/j/k/l 代替 Ctrl+W h/j/k/l）
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l
```

> **创建必要的目录：**
> ```bash
> mkdir -p ~/.vim/undo ~/.vim/backup ~/.vim/swap
> ```

#### 3.8.2 配置文件的位置

| 文件 | 用途 |
|------|------|
| `~/.vimrc` | 用户级配置（所有 Vim 实例共享） |
| `~/.vim/vimrc` | 同上（Vim 推荐的标准位置） |
| `/etc/vim/vimrc` | 系统级配置（影响所有用户） |

#### 3.8.3 查看当前设置

```vim
" 查看某个设置的值：
:set number?          " 输出 number（表示开启）或 nonumber

" 查看所有被修改过的设置：
:set

" 查看所有设置（包括默认值）：
:set all

" 查看某个设置的帮助：
:help 'number'
" 注意：设置名在帮助中需要加单引号
```

### 3.9 Vim 插件生态

Vim 的插件生态系统极大地扩展了它的功能。以下是入门指南。

#### 3.9.1 插件管理器：vim-plug

**vim-plug** 是目前最流行的 Vim 插件管理器（之一），简洁、快速、支持并行安装。

```bash
# 安装 vim-plug
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

在 `~/.vimrc` 中添加插件配置：

```vim
" ===== 插件配置（vim-plug）=====
call plug#begin('~/.vim/plugged')

" 文件浏览器（侧边栏显示目录树）
Plug 'preservim/nerdtree'

" 模糊查找器（快速搜索文件、内容、缓冲区等）
Plug 'junegunn/fzf.vim'

" 代码自动补全（智能补全引擎）
Plug 'neoclide/coc.nvim', {'branch': 'release'}

" 状态栏美化
Plug 'vim-airline/vim-airline'

" 注释插件（gcc 注释/取消注释一行，gc 配合动作）
Plug 'tpope/vim-commentary'

" 括号自动配对
Plug 'tpope/vim-surround'

" Git 集成（在 Vim 中显示 Git 修改状态）
Plug 'tpope/vim-fugitive'

call plug#end()
```

安装插件：在 Vim 中执行 `:PlugInstall`。

**插件说明：**

| 插件 | 用途 | 常用操作 |
|------|------|---------|
| **NERDTree** | 文件浏览器 | `:NERDTreeToggle` 或 `<Leader>n` 切换侧边栏 |
| **fzf.vim** | 模糊查找 | `:Files` 搜索文件（需要安装 `fzf`），`:Buffers` 搜索打开的缓冲区 |
| **coc.nvim** | 代码补全 | 安装后需配置语言服务器（如 `:CocInstall coc-pyright` 用于 Python） |
| **vim-airline** | 底部状态栏 | 自动显示模式、文件类型、Git 分支等信息 |
| **vim-commentary** | 注释 | `gcc` 注释/取消注释当前行，`gc3j` 注释下面 3 行 |
| **vim-surround** | 括号/引号操作 | `cs"'` 将双引号改为单引号，`ds"` 删除双引号 |
| **vim-fugitive** | Git | `:Git status`, `:Git diff`, `:Git blame` |

#### 3.9.2 fzf 安装（fzf.vim 的依赖）

```bash
# Ubuntu 24.04 直接安装
sudo apt install -y fzf

# 或者从 Git 仓库安装（更新的版本）
# git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
# ~/.fzf/install
```

#### 3.9.3 'tpope' 三部曲：vim-commentary、vim-surround、vim-fugitive

这三个插件是 Tim Pope（Vim 社区传奇人物）的作品，广受推崇：

```vim
" vim-commentary 使用：
" gcc    → 注释/取消注释当前行
" gc5j   → 注释/取消注释下面 5 行
" gcap   → 注释/取消注释当前段落
" 在可视模式下：gc → 注释/取消注释选中区域

" vim-surround 使用：
" cs"'   → 将光标所在词的双引号 " 改为单引号 '
" cs([   → 将圆括号改为方括号
" ds"    → 删除光标所在词外围的双引号
" ysiw"  → 给光标所在词添加双引号
" ysiw)  → 给光标所在词添加圆括号（自动加空格）
" ysiw(  → 同上但不加空格
" yss)   → 给整行添加圆括号
" cst<p> → 将当前标签改为 <p>（在 HTML/XML 中）

" vim-fugitive 使用：
" :Git status   → 在 Vim 中查看 git 状态
" :Git diff     → 查看差异
" :Git blame    → 查看每行的提交者
" :Gdiffsplit   → 垂直分屏查看当前文件的 diff
```

### 3.10 vimtutor：内置学习工具

Vim 自带的交互式教程 `vimtutor` 是初学者最好的起点。它大约需要 30 分钟完成。

```bash
# 启动 vimtutor（中文版）
vimtutor

# 如果系统默认是英文版，可以指定中文：
vimtutor zh

# 或英文版：
vimtutor en
```

**建议学习路径：**

1. 第一遍：完成 `vimtutor`（约 30 分钟），了解基本移动和编辑
2. 使用 Vim 作为日常编辑器 1-2 周，遇到问题就查
3. 第二遍：再次完成 `vimtutor`（约 20 分钟），巩固基础
4. 学习本章的进阶内容：文本对象、宏、标记、寄存器
5. 配置自己的 `~/.vimrc`
6. 逐步添加插件

---

## 4. 实战练习

### 准备练习环境

```bash
# 创建练习工作目录
mkdir -p ~/ch17-practice
cd ~/ch17-practice

# 练习文件 1：诗歌文本（用于基本编辑练习）
cat > poem.txt << 'EOF'
The Road Not Taken
by Robert Frost

Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I--
I took the one less traveled by,
And that has made all the difference.
EOF

# 练习文件 2：服务器配置（用于替换练习）
cat > nginx.conf << 'EOF'
# Nginx Configuration
# Generated on 2026-07-30

user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name example.com www.example.com;
        root /var/www/example;

        location / {
            try_files $uri $uri/ =404;
        }

        location /api {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
        }
    }

    server {
        listen 80;
        server_name staging.example.com;
        root /var/www/staging;

        location / {
            try_files $uri $uri/ =404;
        }
    }

    server {
        listen 8080;
        server_name admin.example.com;
        root /var/www/admin;

        location / {
            try_files $uri $uri/ =404;
        }
    }
}
EOF

# 练习文件 3：CSV 数据（用于宏和批量操作练习）
cat > employees.csv << 'EOF'
id,name,department,salary,city
1,alice johnson,engineering,85000,new york
2,bob smith,marketing,65000,los angeles
3,carol williams,engineering,92000,chicago
4,david brown,sales,70000,houston
5,eve davis,engineering,88000,phoenix
6,frank miller,marketing,62000,san diego
7,grace wilson,sales,75000,dallas
8,henry moore,engineering,95000,austin
9,iris taylor,marketing,67000,portland
10,jack anderson,sales,71000,denver
EOF

# 练习文件 4：日志文件（用于搜索和过滤练习）
cat > app.log << 'EOF'
2026-07-30 08:00:01 INFO  Server started on port 3000
2026-07-30 08:00:02 INFO  Connected to database
2026-07-30 08:00:03 DEBUG Initializing cache manager
2026-07-30 08:00:05 INFO  Cache initialized with 1024MB
2026-07-30 08:05:01 DEBUG Processing request GET /api/users
2026-07-30 08:05:02 INFO  GET /api/users - 200 OK
2026-07-30 08:05:10 DEBUG Processing request POST /api/orders
2026-07-30 08:05:12 ERROR Database query timeout: SELECT * FROM orders WHERE...
2026-07-30 08:05:13 WARN  Retrying database connection (attempt 1)
2026-07-30 08:05:14 ERROR Database connection refused
2026-07-30 08:05:15 WARN  Retrying database connection (attempt 2)
2026-07-30 08:05:17 INFO  Database reconnected successfully
2026-07-30 08:06:01 DEBUG Processing request GET /api/reports
2026-07-30 08:06:30 ERROR Report generation failed: timeout
2026-07-30 08:06:31 WARN  Returning cached report from 07:00
2026-07-30 08:07:01 INFO  GET /api/reports - 200 OK (cached)
EOF

# 练习文件 5：代码文件（用于文本对象和缩进练习）
cat > utils.py << 'EOF'
def calculate_stats(numbers):
    """Calculate basic statistics for a list of numbers."""
    if not numbers:
        return {"error": "empty list"}

    total = sum(numbers)
    count = len(numbers)
    average = total / count

    sorted_nums = sorted(numbers)
    median = sorted_nums[count // 2]

    results = {
        "total": total,
        "count": count,
        "average": average,
        "median": median,
    }
    return results


def format_result(stats):
    """Format statistics for display."""
    output = "=== Results ===\n"
    for key, value in stats.items():
        output += f"{key}: {value}\n"
    return output


# TODO: Add more statistical functions
# TODO: Add support for weighted average
# TODO: Add percentile calculation
EOF

# 练习文件 6：TODO 列表（用于练习全局命令）
cat > tasks.txt << 'EOF'
# Project Tasks
# =============

[ ] Write unit tests for user module
[x] Set up CI/CD pipeline
[ ] Refactor database connection pool
[x] Add logging to authentication service
[ ] Update API documentation
[x] Fix memory leak in report generator
[ ] Implement rate limiting for public API
[x] Add pagination to user list endpoint
[ ] Write integration tests for payment flow
[x] Upgrade dependencies to latest versions
EOF

echo "练习环境准备完毕。文件列表："
ls -la ~/ch17-practice/
```

---

### 练习 17.1：基本编辑——打开、编辑、保存、退出

**题目：**

（1）用 Vim 打开 `poem.txt`，将光标移到第 1 行（标题行），在标题上方插入一行 `# Poetry Collection`。

（2）将第 3 行的 "Two roads" 改为 "Three roads"。

（3）将第 3 到第 7 行（第一个诗节）整体向右缩进 4 个空格。

（4）将光标所在行向下移到下一行之后。

（5）保存并退出。

**答案（在 Vim 中操作）：**

（1）：
```
gg       → 跳到文件第一行
O        → 在上方打开新行并进入插入模式
输入: # Poetry Collection
Esc      → 回到普通模式
```

（2）：
```
3G       → 跳到第 3 行
fT       → 光标跳到 "T"（"Two" 的 T）
cw       → 删除当前词并进入插入模式
输入: Three
Esc      → 回到普通模式
```

（3）：
```
3G       → 跳到第 3 行
V        → 进入可视行模式
5j       → 向下选中 5 行（第 3-8 行应包含一个诗节）
>        → 向右缩进
```

（4）：
```
dd       → 剪切当前行
p        → 在光标下方粘贴
```

（5）：
```
:wq      → 保存并退出
" 或按 ZZ（普通模式下，不需要输入冒号）
```

---

### 练习 17.2：移动命令——快速导航

**题目：**

用 Vim 打开 `nginx.conf`，完成以下操作（只使用移动命令，不要用鼠标或方向键）：

（1）跳到文件第一行，然后跳到文件最后一行。

（2）跳到第 30 行（`server {` 块附近）。

（3）在当前行，跳到第一个 `s` 字符处，然后跳到下一个 `{` 字符处。

（4）搜索 `server_name`，在匹配之间跳转。

（5）将当前行置于屏幕中央。

（6）在第一个 `server` 块的首行设置标记 `a`，跳到文件末尾，然后跳回标记。

**答案（在 Vim 中操作）：**

（1）：
```
gg    → 跳到文件开头
G     → 跳到文件末尾
```

（2）：
```
30gg  → 跳到第 30 行
" 或
:30   → 然后按 Enter
```

（3）：
```
fs    → 光标跳到本行第一个 's'
f{    → 光标跳到本行第一个 '{'（注意：{ 在 f 命令中不需要转义）
```

（4）：
```
/server_name  → 按 Enter 搜索
n    → 下一个匹配
N    → 上一个匹配
```

（5）：
```
zz    → 将当前行置于屏幕中央
```

（6）：
```
gg    → 跳到文件开头
/server {  → 搜索第一个 server 块
ma    → 设置标记 a
G     → 跳到文件末尾
'a    → 跳回标记 a 所在行
``    → （反引号反引号）跳回跳转前的位置（文件末尾）
```

---

### 练习 17.3：修改与文本对象

**题目：**

用 Vim 打开 `utils.py`，完成以下操作：

（1）修改 `calculate_stats` 函数内部的双引号字符串 `"error"` 为 `"error: input required"`（使用 `ci"`）。

（2）删除整个 `format_result` 函数（使用 `da{` 或 `dap`）。

（3）将 `results` 字典中的 `"total"` 键名改为 `"sum"`。

（4）将三个 TODO 注释行的 `TODO` 改为 `FIXME`。

（5）将 `sorted_nums` 的赋值行复制一份到其下方并注释掉。

**答案（在 Vim 中操作）：**

（1）：
```
/error      → 搜索 "error"
ci"         → 修改双引号内内容（change inner "）
输入: error: input required
Esc
```

（2）：
```
/def format → 跳到 format_result 函数
da{         → 删除整个花括号块
" 或
dap         → 删除整个段落
```

（3）：
```
/"total"    → 搜索 "total"
ci"         → 修改双引号内内容
输入: sum
Esc
```

（4）：
```
gg          → 跳到文件开头
/TODO       → 搜索 TODO
ciw         → 修改当前词
输入: FIXME
Esc
n           → 下一个 TODO
.           → 重复修改（改为 FIXME）
n           → 再下一个
.           → 再次重复
```

（5）：
```
/sorted_nums → 搜索该行
yy           → 复制整行
p            → 粘贴到下一行
k            → 回到原行
V            → 选中当前行（可视行模式）
:norm I#     → 在行首插入 # 注释
" 或者更简单：在普通模式下
I#           → 在行首插入 #
Esc
j            → 下一行（刚才粘贴的行）
```

---

### 练习 17.4：搜索与替换

**题目：**

用 Vim 打开 `nginx.conf`，完成以下操作：

（1）替换整个文件中所有的 `example.com` 为 `myapp.local`。

（2）将所有 `listen 80` 改为 `listen 80 default_server`（使用确认模式，逐个确认）。

（3）删除所有以 `#` 开头的注释行。

（4）统计 `server_name` 出现的次数。

（5）将所有 `proxy_pass` 行中的 `localhost` 替换为 `127.0.0.1`。

**答案（在 Vim 中操作）：**

（1）：
```
:%s/example\.com/myapp.local/g
" 注意：. 需要转义为 \. 以避免匹配任意字符
```

（2）：
```
:%s/listen 80;/listen 80 default_server;/gc
" g = 替换所有匹配（一行中可能有多个？此处只有一次）
" c = 每次替换前确认
" Vim 会提示：replace with listen 80 default_server; (y/n/a/q/l/^E/^Y)?
" y = 是，n = 否，a = 全部替换，q = 退出，l = 替换当前并退出
```

（3）：
```
:g/^\s*#/d
" 或使用反向匹配：
:v/^\s*#/d    ← 注意：这会删除非注释行，不是我们要的
" 正确做法：
:g/^#/d
```

（4）：
```
:%s/server_name//n
" 输出：X matches on Y lines
" 或：
:%s/server_name/&/n
```

（5）：
```
:%s/\(proxy_pass http:\/\/\)localhost/\1127.0.0.1/g
" 或使用 very magic 模式减少反斜杠：
:%s/\v(proxy_pass http:\/\/)localhost/\1127.0.0.1/g
```

---

### 练习 17.5：可视模式——列编辑

**题目：**

用 Vim 打开 `employees.csv`，完成以下操作：

（1）使用可视块模式，在每行开头添加序号 `"  `（空格+数字+两个空格）。

（2）将 `department` 列中的所有值转为大写。

（3）在 `city` 列的值末尾统一添加 `, USA`。

（4）删除 `id` 列（第一列）。

**答案（在 Vim 中操作）：**

（1）：
```
gg           → 跳到第一行
Ctrl+V       → 进入可视块模式
10j          → 选中所有行（包括表头）的第一列
I            → 在块前插入（I 是块模式的特殊行为）
输入: "  1.  
Esc          → 所有选中的行第一列都加上了输入的内容
```
> 注意：批量添加不同的序号需要用到更高级的技巧（如宏或脚本），块模式无法自动生成递增序号。此练习展示的是块模式的基本能力——在所有行同一列插入相同内容。

（2）选中整列并转大写的做法：
```
/department  → 定位到 department 列（作为参考点）
" 若要对整个文件的所有 department 值转大写，用替换：
:%s/,[a-z]*,/,\U&,/g
" 等等，这不够精确。更实用的做法：
" 用替换：
:%s/\v([^,]*,)([^,]*)(,[^,]*,.*)/\1\U\2\E\3/g
" 但这里第一个字段是人名，不是 department
" 简化：将第三个字段（逗号分隔）转大写：
:%s/\v^([^,]*,[^,]*,)([^,]*)/\1\U\2/g
```

更简单的方式是使用宏：
```
qq           → 开始录制宏 q
2f,          → 跳到第二个逗号后（department 字段开始）
;            → 跳到第三个逗号前？不，用更精确的方式：
/,\zs[^,]*   → 更复杂。简单方式：
" 每行单独操作：
2f,          → 跳到第二个逗号
vi,          → 选中到下一个逗号之前
U            → 转为大写
j            → 下一行
q            → 结束录制
9@q          → 执行 9 次
```

（3）：
```
" 在所有行末尾追加 , USA：
:%s/$/, USA/
" 但注意：第一行是表头，应该跳过
:2,$s/$/, USA/
```

（4）：
```
" 删除第一个逗号及之前的内容：
:%s/^[^,]*,//
" 这会删除 id 列
```

---

### 练习 17.6：寄存器与宏

**题目：**

用 Vim 打开 `employees.csv`，完成以下操作：

（1）将 CSV 文件的每一行（跳过表头）转换为格式 `Name: Alice Johnson, Dept: Engineering, Salary: $85,000`。

（2）将 `app.log` 中所有以 `ERROR` 开头的行收集到文件末尾。

（3）录制一个宏，将光标下的单词首字母大写，并对多个单词执行。

**答案（在 Vim 中操作）：**

（1）使用宏：
```
" 首先删除表头行（稍后手动重写）
G           → 跳到文件末尾
dd          → 删除第一行（表头）放到稍后处理的位置
" 实际操作：第一行是表头，留着参考即可，我们处理第 2 行开始

" 光标在第二行（第一行数据）
qq          → 开始录制宏 q
0           → 跳到行首
df,         → 删除到第一个逗号（删除 id）
r           → 光标在第二个字段开始
" 实际更系统的方法：
" 对每一行执行替换：
qq
:s/\v^[^,]*,([^,]*),([^,]*),([^,]*),.*/Name: \1, Dept: \2, Salary: $\3/
" 但这需要 ^M（Enter）在宏里...
" 更简单：用 Ex 命令批量处理
:2,$s/\v^[^,]*,([^,]*),([^,]*),([^,]*),.*/Name: \1, Dept: \2, Salary: $\3/
```

一行命令解决：
```
:2,$s/\v^[^,]*,([^,]*),([^,]*),([^,]*),.*/Name: \u\1, Dept: \u\2, Salary: $\3/
```
`\u` 在替换文本中将下一个字符转为大写。

（2）：
```
:g/ERROR/m$
" 将所有包含 ERROR 的行移到文件末尾
```

（3）：
```
" 录制宏：
qq          → 开始录制（存入寄存器 q）
b           → 跳到词首
~           → 首字母切换大小写（如果是小写变大写）
w           → 跳到下一个词
q           → 结束录制

" 执行：
@q          → 对当前词执行
3@q         → 对后续 3 个词执行
```

---

### 练习 17.7：窗口与缓冲区

**题目：**

在 Vim 中完成以下窗口和缓冲区操作：

（1）打开 `utils.py`，然后在垂直分屏中打开 `nginx.conf`。

（2）在水平分屏中打开 `poem.txt`（此时你有三个窗口）。

（3）在窗口之间切换，将当前窗口最大化，然后恢复等分。

（4）列出所有缓冲区，切换到 `employees.csv`。

（5）关闭除当前窗口外的所有窗口。

**答案（在 Vim 中操作）：**

（1）：
```
vim utils.py          → 在终端中打开
:vs nginx.conf        → 垂直分屏打开 nginx.conf
```

（2）：
```
Ctrl+W w              → 切换到任意一个窗口
:sp poem.txt          → 水平分屏打开 poem.txt
```

（3）：
```
Ctrl+W w              → 切换到目标窗口
Ctrl+W _              → 最大化当前窗口高度
Ctrl+W |              → 最大化当前窗口宽度
Ctrl+W =              → 恢复所有窗口等分
```

（4）：
```
:ls                   → 列出缓冲区
" 输出类似：
" 1 %a   "utils.py"           line 1
" 2 #h   "nginx.conf"         line 1
" 3  h   "poem.txt"           line 1
" 4      "employees.csv"      line 1   ← 我们想切换到这个

:b 4                   → 切换到缓冲区 4
" 或
:b employees.csv       → 按文件名切换（Tab 补全可用）
```

（5）：
```
Ctrl+W o               → 只保留当前窗口（only）
" 或
:only
```

---

### 练习 17.8：综合场景——配置文件的批量修改

**题目：**

你需要在 `nginx.conf` 中完成以下修改，模拟一个真实的配置更新场景：

（1）将 `example.com` 替换为 `myapp.com`。

（2）将 `staging.example.com` 替换为 `staging.myapp.com`。

（3）将第一个 server 块的 `listen 80` 改为 `listen 443 ssl`。

（4）在第一个 server 块中添加 SSL 证书路径（在 `server_name` 行之后）：
```
    ssl_certificate /etc/ssl/myapp.crt;
    ssl_certificate_key /etc/ssl/myapp.key;
```

（5）删除 `admin.example.com` 的整个 server 块（包括注释上方的空行）。

（6）确保文件末尾有一个空行。

（7）统计文件中 `location` 块的个数。

**答案（在 Vim 中操作）：**

（1）：
```
:%s/example\.com/myapp.com/g
```

（2）：
```
:%s/staging\.myapp\.com/staging.myapp.com/g
" 因为第 (1) 步已经把 staging.example.com 变成了 staging.myapp.com
" 实际上 (1) 步的替换已经包含了这个
" 所以只需 (1) 步
```

（3）：
```
gg
/server {             → 跳到第一个 server 块
j                     → 下一行（listen 80 行）
" 光标在 listen 80; 行
cc                    → 修改整行（清空并进入插入模式）
输入: listen 443 ssl;
Esc
```

（4）：
```
" 光标在第一个 server 块的 server_name 行
o                     → 在下方打开新行
输入: ssl_certificate /etc/ssl/myapp.crt;
Esc
o                     → 再开一行
输入: ssl_certificate_key /etc/ssl/myapp.key;
Esc
```

（5）：
```
/admin\.example\.com  → 搜索 admin server 块
" 但 (1) 步已经将其改为了 admin.myapp.com
/admin\.myapp\.com    → 定位到该行
dap                   → 删除整个段落（server 块）
" 如果 dap 不够精确，使用：
V                     → 进入可视行模式
" 手动 j/k 选中整个 server 块（含 {}）
d                     → 删除
```

（6）：
```
G                     → 跳到文件末尾
" 确保文件末尾有空行：如果最后一个字符不是换行，按 o Esc
" Vim 默认在文件末尾保留空行（如果 'eol' 设置开启）
:set endofline?       → 检查设置
```

（7）：
```
:%s/location//n
" 输出：3 matches on 3 lines
" 或：
:g/location/          → 列出所有包含 location 的行（自动 p 打印）
```

---

### 练习 17.9：配置你的 ~/.vimrc

**题目：**

创建并配置你的个人 `~/.vimrc` 文件，包含以下设置：

（1）启用行号和相对行号。

（2）设置缩进：Tab 宽度为 4，使用空格替代 Tab。

（3）启用增量搜索和高亮搜索结果。

（4）设置 `<Space>` 为 Leader 键。

（5）添加快捷键映射：`<Leader>w` 保存文件，`<Leader>q` 退出。

（6）安装 vim-plug 并配置至少一个插件（如 NERDTree 或 vim-commentary）。

**答案：**

```bash
# 创建 ~/.vimrc
cat > ~/.vimrc << 'VIMRC'
" ===== 个人 Vim 配置 =====
set nocompatible

" 显示
set number
set relativenumber
set cursorline
set showcmd
set showmode

" 搜索
set hlsearch
set incsearch
set ignorecase
set smartcase

" 缩进
set tabstop=4
set shiftwidth=4
set expandtab
set softtabstop=4
set autoindent
set smartindent

" 编码
set encoding=utf-8

" 杂项
set mouse=a
set hidden
set autoread
set history=1000

" Leader 键
let mapleader = "\<Space>"

" 快捷键
nnoremap <Leader>w :w<CR>
nnoremap <Leader>q :q<CR>
nnoremap <Leader>h :nohlsearch<CR>

" 窗口导航
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

" ===== 插件 =====
call plug#begin('~/.vim/plugged')
Plug 'preservim/nerdtree'
Plug 'tpope/vim-commentary'
call plug#end()

" NERDTree 快捷键
nnoremap <Leader>n :NERDTreeToggle<CR>
VIMRC

# 安装 vim-plug
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

# 在 Vim 中安装插件
# vim +PlugInstall +qall
```

---

### 练习 17.10：vimtutor 体验

**题目：**

运行 `vimtutor` 并完成至少前 4 课（共约 15-20 分钟）。

**答案：**

```bash
# 运行内置教程
vimtutor

# 完成以下课程：
# 第 1 课：移动光标、进入/退出 Vim、删除字符、插入文本
# 第 2 课：删除命令、撤销命令
# 第 3 课：修改命令、文件操作
# 第 4 课：光标定位、搜索命令
# 后续课程涵盖：替换、可视模式、外部命令、搜索替换等
```

**检查是否完成：** 每课结束时有练习总结，确保你能独立完成每个操作再进入下一课。

---

## 5. 常见错误与排错

### 5.1 "如何退出 Vim？" —— 最著名的 vim 梗

**现象：**

你在终端中输入了 `vim`，现在面对一个充满 `~` 符号的屏幕，无论按什么都没反应，想退出但发现所有直觉的操作都不生效。

**原因：** Vim 默认是 Normal 模式，键盘输入被解释为命令而非文本。你按 `q` 不会退出，按 `Ctrl+C` 不会退出，按 `Esc` 也不会退出。

**解决：**

```
1. 确认在 Normal 模式：多按几次 Esc
2. 输入以下任一命令然后按 Enter：
   :q    → 退出（如果未修改）
   :q!   → 强制退出（放弃修改）
   :wq   → 保存并退出
   :x    → 保存并退出

" 或者（在 Normal 模式下，不需要输入冒号）：
ZZ     → 保存并退出（按住 Shift，按两次 z）
ZQ     → 退出不保存
```

**如果这些都无效：**
- 确认你确实按了冒号 `:`（Shift + ;）
- 确认命令出现在屏幕底部
- 如果进入了插入模式（底部显示 `-- INSERT --`），先按 Esc
- 如果进入了可视模式（底部显示 `-- VISUAL --`），先按 Esc

### 5.2 不小心进入了各种"奇怪模式"

**现象：**

你的键盘输入和预期完全不同——按字母键结果发生了奇怪的事。

| 你看到的 | 你进入的模式 | 如何退出 |
|---------|------------|---------|
| `-- INSERT --` | 插入模式 | 按 Esc |
| `-- VISUAL --` | 可视模式 | 按 Esc |
| `-- VISUAL LINE --` | 可视行模式 | 按 Esc |
| `-- VISUAL BLOCK --` | 可视块模式 | 按 Esc |
| `-- REPLACE --` | 替换模式 | 按 Esc |
| 底部出现 `:` | 命令行模式 | 按 Esc，或输入完命令后按 Enter |
| 底部出现 `/` 或 `?` | 搜索模式 | 按 Esc，或按 Enter 执行搜索 |
| 底部出现 `recording` | 宏录制中 | 按 `q` 结束录制 |
| 按 Q 进入 Ex 模式 | — | 输入 `visual` 然后按 Enter |

**通用原则：当你不确定自己在什么模式时，多按几次 `Esc`（或 `Ctrl+[`）回到 Normal 模式。** 在 Normal 模式下，你可以安全地执行任何命令。

### 5.3 修改没有保存

**现象：**

你用 `:q` 退出时看到：

```
E37: No write since last change (add ! to override)
```

**原因：** 你对文件做了修改但未保存。Vim 阻止你退出以防止丢失修改。

**解决：**

```
:w       → 先保存
:q       → 再退出
" 或一步完成：
:wq      → 保存并退出

" 如果你确定要放弃修改：
:q!      → 强制退出不保存
```

### 5.4 无法输入中文/中文显示乱码

**现象：**

在 Vim 中切换到中文输入法后无法输入，或打开含中文的文件显示为乱码。

**原因：** 编码设置问题。

**解决：**

```vim
" 在 ~/.vimrc 中添加：
set encoding=utf-8
set fileencoding=utf-8
set fileencodings=utf-8,gbk,gb2312,cp936,latin1

" 临时解决：
:e ++enc=utf-8    → 以 UTF-8 重新读取文件
:e ++enc=gbk      → 以 GBK 重新读取文件

" 检查当前文件编码：
:set fileencoding?
```

### 5.5 不小心按了 Ctrl+Z

**现象：**

Vim 突然消失了，回到终端提示符，但 Vim 进程还在后台。

```
[1]+  Stopped    vim filename
```

**原因：** `Ctrl+Z` 会挂起（suspend）当前前台进程到后台。这是 Unix 终端的功能，不是 Vim 特有的。

**解决：**

```bash
# 恢复 Vim 到前台：
fg

# 查看所有挂起的任务：
jobs

# 如果想彻底终止后台的 Vim：
kill %1    # %1 是 jobs 命令显示的任务编号
```

### 5.6 粘贴代码时缩进错乱

**现象：**

从浏览器或其他编辑器复制代码粘贴到 Vim 中，缩进越来越深，代码变成阶梯状。

```
def hello():
    print("Hello")
        print("World")     ← 缩进被错误地叠加了！
```

**原因：** Vim 的 `autoindent` 或 `smartindent` 会在换行时自动添加缩进。当粘贴的内容中已经包含缩进时，Vim 在它们之上又加了一层缩进。

**解决：**

```vim
" 粘贴前先进入粘贴模式：
:set paste

" 然后按 i 进入插入模式，粘贴（Ctrl+Shift+V 或鼠标中键）

" 粘贴完成后退出粘贴模式：
:set nopaste

" 或者使用 Vim 的 + 寄存器从系统剪贴板粘贴（不会触发自动缩进）：
"+p     → 在 Normal 模式下直接从系统剪贴板粘贴

" 推荐：设置一个快捷键来切换粘贴模式
set pastetoggle=<F2>
" 这样按 F2 就可以在粘贴/非粘贴模式之间切换
```

### 5.7 不小心创建了不需要的标记或宏

**现象：**

执行 `@a` 时报错：寄存器 a 中没有内容，或执行了意想不到的操作。

**原因：** 之前可能无意中录制了宏。

**解决：**

```vim
" 清除寄存器 a 中的宏：
qaq    → 录制空宏到 a（q 开始录制，a 选择寄存器，q 立即停止）

" 查看寄存器内容：
:reg a

" 清除所有命名寄存器（a-z）：需要逐个清除或重启 Vim

" 清除不需要的标记：
:delmarks a    → 删除标记 a
:delmarks!     → 删除所有小写标记（a-z）
```

### 5.8 文件被其他程序修改

**现象：**

你在 Vim 中编辑文件，不小心在另一个终端中也打开了同一个文件并做了修改。回到 Vim 时看到：

```
WARNING: The file has been changed since reading it!!!
Do you really want to write to it (y/n)?
```

**原因：** 文件被外部修改，Vim 检测到了变化。

**解决：**

```vim
" 情况 1：你想保留 Vim 中的修改，放弃外部的变化
" 直接按 y 保存（会覆盖外部修改）

" 情况 2：你想放弃 Vim 中的修改，使用外部版本
:e!     → 强制重新读取文件（放弃 Vim 中的修改）

" 情况 3：你想合并两者
" 保存 Vim 版本到另一个文件：:w /tmp/mine.txt
" 重新读取：:e!
" 手动对比合并：:vert diffsplit /tmp/mine.txt

" 预防：设置 autoread
set autoread    " 文件被外部修改时自动重新读取
```

### 5.9 撤销操作"不生效"

**现象：**

连续按 `u` 撤销，但只撤销了一步。

**原因：** 你可能在撤销后按了其他键（即使是方向键），这会创建新的撤销分支。Vim 的撤销是**分支化**的（类似 Git），而非线性。

**解决：**

```vim
" 使用 g- 和 g+ 在撤销分支中导航
g-    → 更早的撤销状态
g+    → 更新的撤销状态

" 查看撤销树：
:undolist

" 在 Vim 8.0+ 中，设置持久化撤销：
set undofile
set undodir=~/.vim/undo
" 这样即使关闭并重新打开 Vim，也可以撤销以前的修改
```

---

## 6. 进阶延伸

### 6.1 Vim 的学习路径：从新手到高手

学习 Vim 是一个渐进的过程。以下是推荐的成长路径：

```
阶段 1：生存（第 1 周）
├── 打开文件、进入插入模式（i）、保存退出（:wq）
├── 基本移动：h/j/k/l（不用方向键）
├── 基本编辑：x（删除字符）、dd（删除行）、u（撤销）
└── vimtutor 第一遍

阶段 2：熟练（第 2-4 周）
├── 词级移动：w/b/e, W/B/E
├── 行级移动：0/^/$, f/t/F/T + ;/,
├── 操作符+动作：dw, c$, y}, >G
├── 文本对象：ci", da{, yap
├── 搜索与替换：/, *, :%s
└── vimtutor 第二遍

阶段 3：高效（第 2-3 个月）
├── 寄存器：命名寄存器、系统剪贴板
├── 宏录制与回放
├── 标记：m, ', ``
├── 跳转列表：Ctrl+O / Ctrl+I
├── 窗口与标签页管理
├── 配置 ~/.vimrc
└── 安装并使用 3-5 个插件

阶段 4：精通（持续演进）
├── 编写自定义函数和命令
├── 编写 Vim 脚本（Vimscript 或 Lua/Neovim）
├── 使用高级 Ex 命令：:g/:v, :argdo, :bufdo
├── 掌握正则表达式的各种变体（very magic \v）
├── 自定义文本对象
└── 将 Vim 集成到日常工作流中
```

### 6.2 Vim 与其他工具的集成

#### 6.2.1 Vim 作为 Git 编辑器

```bash
# 设置 Vim 为 Git 的默认编辑器
git config --global core.editor "vim"

# 设置 Vim 为系统默认编辑器
echo 'export EDITOR=vim' >> ~/.bashrc
echo 'export VISUAL=vim' >> ~/.bashrc
source ~/.bashrc

# 在 Vim 中使用 Git（需要 vim-fugitive 插件）
# :Git status
# :Git diff
# :Git commit
# :Git push
```

#### 6.2.2 Vim 作为 `less` 的替代品（查看文件）

```bash
# 使用 Vim 作为分页器查看文件
# /usr/share/vim/vim90/macros/less.sh 提供了类似 less 的功能

# 创建别名：
alias vless='vim -R -'  # 从标准输入读取，只读模式
# 使用：
cat longfile.txt | vless
```

#### 6.2.3 Vim 的模式在 VS Code 中

如果你平时使用 VS Code，可以安装 Vim 扩展获得 Vim 的键位：

- **VS Code**: 安装 "Vim" 扩展（作者：vscodevim）
- **IntelliJ IDEA**: 内置 IdeaVim 插件
- **Obsidian**: 设置中启用 Vim 模式
- **Sublime Text**: 启用 Vintage 模式

学习 Vim 的投资回报是：**相同的键位在所有编辑器中通用。**

### 6.3 Vim 与 Neovim

**Neovim** 是 Vim 的一个现代分支，始于 2014 年。它保持了 Vim 的键位和操作逻辑，但在底层做了大量重构：

| 维度 | Vim | Neovim |
|------|-----|--------|
| 项目启动 | 1991 年 | 2014 年 |
| 维护者 | Bram Moolenaar（2023 年去世），社区维护 | Neovim 团队 |
| 配置语言 | Vimscript | Lua（原生支持）+ Vimscript（兼容） |
| 内置 LSP | 不支持（需插件） | 原生内置 LSP 客户端 |
| 内置终端 | 有（`:terminal`） | 有（更强大的 `:terminal`） |
| 插件生态 | 传统的 Vim 插件 | 新一代 Lua 插件（更快） |
| 配置文件 | `~/.vimrc` | `~/.config/nvim/init.lua`（或 `init.vim`） |

**建议：** 对于初学者，从 Vim 开始是更好的选择——因为 Vim 无处不在，且两者的基本操作完全一致。当你对 Vim 足够熟悉后，再考虑是否迁移到 Neovim。

### 6.4 常用高级 Ex 命令速查

除了本章已详细介绍的命令，以下 Ex 命令在高级使用场景中非常有用：

| 命令 | 效果 |
|------|------|
| `:args` | 列出参数列表（启动 Vim 时传入的文件） |
| `:argdo cmd` | 对所有参数列表中的文件执行 cmd |
| `:bufdo cmd` | 对所有缓冲区执行 cmd |
| `:windo cmd` | 对所有窗口执行 cmd |
| `:tabdo cmd` | 对所有标签页执行 cmd |
| `:r filename` | 在当前行下方插入文件内容 |
| `:r !command` | 插入命令执行的输出 |
| `:.!command` | 用命令的输出替换当前行 |
| `:sort` | 对选中行排序 |
| `:sort u` | 排序并去重 |
| `:retab` | 将 Tab 转为空格（或反之，根据设置） |
| `:set list` | 显示不可见字符（Tab、行尾等） |
| `:set listchars` | 定义不可见字符的显示方式 |
| `:help {topic}` | 查看帮助文档 |
| `:helpgrep {pattern}` | 在所有帮助文档中搜索 |

```vim
" 实用示例：在所有 .py 文件中搜索并替换
:args **/*.py       → 将当前目录所有 .py 文件加入参数列表
:argdo %s/old/new/ge | update   → 在所有文件中替换并保存

" 查看当前文件的十六进制表示
:%!xxd              → 转为十六进制
:%!xxd -r           → 恢复为原始格式

" 将命令输出插入到文件中
:r !date            → 插入当前日期
:r !ls -la          → 插入目录列表

" 对可视模式选中的行排序
" 先 V 选中行，然后：
:sort               → 排序
:sort u             → 排序并去重
```

### 6.5 Vim 的正则表达式引擎

Vim 的正则表达式与 POSIX 正则（grep/sed/awk 使用）有所不同：

```vim
" Vim 有四种正则模式，通过 \v, \V, \m, \M 切换：

" 默认模式（magic）：部分字符需要转义
:%s/\+\(pattern\)\+/\1/

" very magic（\v）：几乎所有字符都不需要转义（推荐！）
:%s/\v+(pattern)+/\1/

" very nomagic（\V）：几乎所有字符都是字面量
:%s/\Vpattern/  → 搜索字面量 "pattern"（. 不需要转义）

" magic（\m）：恢复默认
:%s/\m\+\(pattern\)\+/\1/

" 推荐：总是使用 \v，省去大量反斜杠的烦恼
:%s/\v(\d{4})-(\d{2})-(\d{2})/\3\/\2\/\1/
" 对比默认模式：
:%s/\(\d\{4\}\)-\(\d\{2\}\)-\(\d\{2\}\)/\3\/\2\/\1/
```

**Vim 正则的特殊之处：**

| 特性 | Vim 正则 | PCRE/ERE |
|------|---------|---------|
| 非贪婪匹配 | `.\{-}` | `.*?` |
| 单词边界 | `\<` 和 `\>` | `\b` |
| 匹配前一字符 0 或 1 次 | `\=` | `?` |
| 匹配前一字符 1 或更多次 | `\+` | `+` |
| very magic 模式 | `\v` | （类似 Perl 正则） |

### 6.6 推荐资源

**内置资源：**

```vim
:help                    " 帮助系统入口
:help tutor              " 关于 vimtutor
:help usr_01.txt         " 用户手册第 1 章（共约 40 章）
:help quickref           " 快速参考
:help tips               " Vim 技巧
:help pattern            " 正则表达式帮助
```

**外部资源：**

| 资源 | 类型 | 说明 |
|------|------|------|
| `vimtutor` | 内置 | Vim 交互式教程，30 分钟完成 |
| [Vim Adventures](https://vim-adventures.com/) | 在线游戏 | 通过游戏学习 Vim 键位 |
| [Vim Golf](https://www.vimgolf.com/) | 在线挑战 | 用最少的按键完成编辑任务 |
| [Practical Vim](https://pragprog.com/titles/dnvim2/) | 书籍 | Drew Neil 著，Vim 学习的经典读物 |
| [Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/) | 在线教程 | Steve Losh 著，深入学习 Vim 脚本 |
| `:help` | 内置 | Vim 的官方文档是世界上最详尽的软件文档之一 |

---

> **本章小结：**
>
> 1. **模态编辑**是 Vim 的灵魂——Normal 模式用于编辑，Insert 模式用于输入，不同模式下同一按键含义不同
> 2. **操作符 + 动作**的语法让 Vim 命令可以自由组合：`d`（删除）、`c`（修改）、`y`（复制）是操作符，`w`、`$`、`}`、`G` 是动作，`.` 重复上一次修改
> 3. **文本对象**（`ci"`、`da{`、`yap`）是 Vim 效率的飞升之翼——操作有语法意义的文本块而非字符
> 4. **移动体系**从字符（`h/j/k/l`、`f/t`）到词（`w/b/e`）到行（`0/^/$`）到文件（`gg/G`）到屏幕（`Ctrl+D/U`），层层递进
> 5. **搜索与替换**：`/`、`?`、`*`、`#` 用于搜索，`:%s/old/new/g` 用于批量替换，`:g/pattern/cmd` 用于条件执行
> 6. **寄存器**（`"a`-`"z`、`"0`、`"+`）存储复制/删除的内容，**宏**（`q`、`@`）录制和回放操作序列
> 7. **标记**（`m{a-z}`、`'{mark}`、`` `{mark} ``）让你在文件中快速跳转，`` `` `` 返回跳转前的位置
> 8. **窗口/标签页/缓冲区**让你同时编辑多个文件而不离开终端
> 9. **`~/.vimrc`** 是 Vim 的配置中心，**vim-plug** 是插件管理的推荐入口
> 10. **vimtutor** 是所有 Vim 学习者最好的第一课——30 分钟，终生受益

---

**Phase 3 的开篇：** 第 17 章带你进入了交互式编辑的世界。从此，你不必再依赖 `nano` 或图形界面编辑器。Vim 将从这里开始，伴随你在后续章节中编写 Shell 脚本、管理服务配置、排查系统日志——这一切，都在键盘上完成。

下一章，你将学习 **Shell 脚本编程基础**——如何将你学到的所有命令串联起来，编写可重复执行的自动化脚本。Vim 将是你编写这些脚本的利器。
