# Zora的问题解决
## 1. 清理已上传的配置文件

当不小心将 `.claude`、`.obsidian` 等配置文件上传到 GitHub 后，需要从版本控制中移除：

```bash
# 1. 创建或更新 .gitignore
# 添加需要忽略的目录和文件：
# .claude/
# .claudian/
# .agents/
# .vscode/
# .obsidian/

# 2. 从 git 缓存中移除（保留本地文件）
git rm -r --cached .claude/ .claudian/ .agents/ .vscode/ .obsidian/

# 3. 提交并推送
git commit -m "Remove config files from tracking"
git push origin main
```

## 2. 分支合并

**保留哪个分支，就切换到那个分支，然后它去 merge 别的分支，最后推送。**

```bash
# 场景：把 feature/air14 的内容合并到 main
git checkout main      # 切换到 main（要保留的分支）
git pull origin main   # 拉取远程最新
git merge feature/air14 # main 合并 feature 分支
git push origin main    # 推送到远程
```

**反向操作**：把 main 同步到 feature
```bash
git checkout feature/air14
git pull origin feature/air14
git merge main
git push origin feature/air14
```

---

## 3. 跨设备笔记同步问题解决

### 3.1 问题背景

两台电脑使用同一个 Obsidian 笔记仓库，但各自有独立的配置和不同的笔记内容：

| 电脑 | 分支 | 问题 |
|------|------|------|
| 拯救者 | `feature/air14` | 上传了 `.claude`、`.obsidian` 等机器配置 |
| 小新 | `main` | 有另一套笔记（测验整理等） |

### 3.2 解决步骤

#### 第一步：创建 .gitignore 排除机器配置

```bash
# 创建 .gitignore 文件，内容：
# .claude/
# .claudian/
# .agents/
# .obsidian/
# .troe/
# skills-lock.json
```

#### 第二步：从暂存区移除已追踪的配置文件

```bash
git rm --cached -r .claude .claudian .agents .obsidian
git add .gitignore
```

`git rm --cached -r` 的作用：**只从 Git 暂存区删除，保留本地文件**。配合 .gitignore，以后这些目录不会再被追踪。

#### 第三步：提交并推送

```bash
git commit -m "chore: remove machine-specific config, add .gitignore"
git push origin feature/air14
```

#### 第四步：合并两台电脑的笔记

在拯救者电脑上，将 main 分支合并到 feature/air14：

```bash
# 如果两个分支没有共同祖先，需要 --allow-unrelated-histories
git merge origin/main --allow-unrelated-histories

# 如果有冲突，手动解决后：
git add .gitignore skills-lock.json
git commit -m "Merge origin/main into feature/air14"
git push origin feature/air14
```

#### 第五步：切回 main 并拉取

```bash
# 删除不需要的分支
git push origin --delete feature/air14

# 切换到 main
git checkout main

# 拉取合并后的代码
git pull origin main
```

### 3.3 解决冲突示例

两个分支的 `.gitignore` 冲突时，可以手动合并内容：

```bash
# .gitignore 冲突内容示例
<<<<<< HEAD
# 拯救者的配置
.claude/
.claudian/
=======
# 小新的配置
.vscode/
.DS_Store
>>>>>>> origin/main
```

**解决方法**：保留两边有用的内容，合并成：

```bash
# Claude Code / Claude 特定配置（机器相关）
.claude/
.claudian/
.claudeignore
.agents/
.troe/

# IDE / 编辑器配置
.vscode/

# Obsidian vault 配置（插件/主题每个机器独立）
.obsidian/

# OS 垃圾文件
.DS_Store
Thumbs.db

# 其他
skills-lock.json
```

### 3.4 关键命令总结

| 场景 | 命令 |
|------|------|
| 创建 .gitignore | 手动创建文件 |
| 取消文件追踪 | `git rm --cached -r <file>` |
| 合并无关分支 | `git merge <branch> --allow-unrelated-histories` |
| 删除远程分支 | `git push origin --delete <branch-name>` |
| 暂存本地变更 | `git stash` |
| 恢复暂存 | `git stash pop` |
| 查看远程分支 | `git fetch origin && git branch -a` |

---

**标签**：#Git #前端开发 #GitFlow #版本控制 #开发流程

**相关笔记**：[[前端面试记录解析]] [[CLAUDE]] [[git命令选项详解]] [[git-flow.canvas]]
# Git 常用指令指南（前端开发）

本指南整理了前端开发中常用的 Git 指令，并遵循 Git Flow 工作流。

## 1. 初始化与配置

### 1.1 初始化仓库
```bash
# 初始化新的 Git 仓库
git init

# 克隆远程仓库
git clone <repository-url>
git clone <repository-url> <directory-name>  # 克隆到指定目录
```

### 1.2 用户配置
```bash
# 设置全局用户名和邮箱
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置当前仓库的用户名和邮箱
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 查看配置
git config --list
```

### 1.3 .gitignore 配置
前端项目常见的忽略文件：
```
# 依赖目录
node_modules/
dist/
build/
.out/
.next/

# 环境变量
.env
.env.local
.env.development
.env.production

# 日志文件
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器目录
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db
```

## 2. 基本操作

### 2.1 添加与提交
```bash
# 查看状态
git status

# 添加文件到暂存区
git add <file>          # 添加指定文件
git add .              # 添加所有修改的文件
git add -A             # 添加所有变化（包括删除）

# 提交更改
git commit -m "提交信息"
git commit -am "提交信息"  # 添加并提交（仅对已跟踪文件）

# 修改上次提交
git commit --amend -m "新的提交信息"
git commit --amend --no-edit  # 只修改内容，不修改提交信息
```

### 2.2 查看历史
```bash
# 查看提交历史
git log
git log --oneline      # 简洁显示
git log --graph        # 图形化显示分支
git log --all --graph --oneline --decorate  # 完整图形化

# 查看文件更改
git diff               # 查看未暂存的更改
git diff --staged      # 查看已暂存的更改
git diff HEAD~1 HEAD   # 查看最近一次提交的更改

# 查看谁修改了文件
git blame <file>
```

## 3. 分支管理

### 3.1 基本分支操作
```bash
# 查看分支
git branch             # 本地分支
git branch -a          # 所有分支（包括远程）
git branch -r          # 远程分支

# 创建分支
git branch <branch-name>           # 创建分支
git checkout -b <branch-name>      # 创建并切换到新分支
git switch -c <branch-name>        # Git 2.23+ 推荐方式

# 切换分支
git checkout <branch-name>
git switch <branch-name>           # Git 2.23+ 推荐方式

# 删除分支
git branch -d <branch-name>        # 删除已合并的分支
git branch -D <branch-name>        # 强制删除未合并的分支

# 重命名分支
git branch -m <new-branch-name>    # 重命名当前分支
git branch -m <old-name> <new-name> # 重命名指定分支
```

### 3.2 远程分支操作
```bash
# 获取远程分支
git fetch origin                   # 获取所有远程更新
git fetch origin <branch-name>     # 获取特定分支

# 推送分支到远程
git push origin <branch-name>      # 推送分支
git push -u origin <branch-name>   # 推送并设置上游分支

# 跟踪远程分支
git checkout --track origin/<branch-name>

# 删除远程分支
git push origin --delete <branch-name>
```

## 4. Git Flow 工作流

Git Flow 是一种流行的分支管理模型，特别适合前端项目。

### 4.1 主要分支
- `main`/`master` - 生产环境代码，只接受发布分支的合并
- `develop` - 开发主分支，集成所有功能

### 4.2 辅助分支
- `feature/*` - 功能分支，从 develop 分支创建，合并回 develop
- `release/*` - 发布分支，从 develop 分支创建，合并到 develop 和 main
- `hotfix/*` - 热修复分支，从 main 分支创建，合并到 develop 和 main

### 4.3 Git Flow 初始化
```bash
# 初始化 Git Flow（如果使用 git-flow 扩展）
git flow init

# 或手动设置分支
git checkout -b develop
git push -u origin develop
```

### 4.4 功能开发流程
```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication

# 2. 在功能分支上开发
git add .
git commit -m "添加用户登录功能"
git commit -m "添加表单验证"
# ... 多次提交

# 3. 完成功能，合并到 develop
git checkout develop
git pull origin develop
git merge --no-ff feature/user-authentication  # 非快进合并，保留历史
git push origin develop

# 4. 删除功能分支
git branch -d feature/user-authentication
git push origin --delete feature/user-authentication  # 删除远程分支
```

### 4.5 发布流程
```bash
# 1. 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 在发布分支上修复 bug（不添加新功能）
git commit -m "修复登录页面样式问题"
git commit -m "更新依赖版本"

# 3. 完成发布，合并到 main 和 develop
git checkout main
git pull origin main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "版本 1.2.0"
git push origin main --tags

git checkout develop
git pull origin develop
git merge --no-ff release/v1.2.0
git push origin develop

# 4. 删除发布分支
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

### 4.6 热修复流程
```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/login-error

# 2. 修复紧急问题
git commit -m "修复登录失败问题"

# 3. 完成热修复，合并到 main 和 develop
git checkout main
git pull origin main
git merge --no-ff hotfix/login-error
git tag -a v1.2.1 -m "热修复版本 1.2.1"
git push origin main --tags

git checkout develop
git pull origin develop
git merge --no-ff hotfix/login-error
git push origin develop

# 4. 删除热修复分支
git branch -d hotfix/login-error
git push origin --delete hotfix/login-error
```

## 5. 合并与冲突解决

### 5.1 合并分支
```bash
# 普通合并
git merge <branch-name>

# 非快进合并（保留分支历史）
git merge --no-ff <branch-name>

# 变基合并（保持线性历史）
git rebase <branch-name>
```

### 5.2 解决冲突
```bash
# 1. 合并时发生冲突
git merge feature/xxx  # 出现冲突提示

# 2. 查看冲突文件
git status

# 3. 手动编辑冲突文件
# 文件内容会显示：
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 要合并的分支的内容
# >>>>>>> feature/xxx

# 4. 解决冲突后标记为已解决
git add <resolved-file>

# 5. 完成合并
git commit

# 6. 如果放弃合并
git merge --abort
```

### 5.3 使用图形化工具解决冲突
```bash
# 使用 VS Code 解决冲突
code .  # 打开 VS Code，使用内置的冲突解决工具

# 使用其他合并工具
git mergetool
```

## 6. 撤销与回退

### 6.1 撤销工作区修改
```bash
# 撤销未暂存的修改
git checkout -- <file>          # 撤销指定文件的修改
git checkout -- .               # 撤销所有修改

# 撤销已暂存的修改（取消暂存）
git reset HEAD <file>           # 取消暂存指定文件
git reset HEAD .                # 取消所有暂存
```

### 6.2 回退提交
```bash
# 软回退（保留修改内容）
git reset --soft HEAD~1         # 回退到上一个提交，保留修改在暂存区

# 混合回退（默认，保留修改在工作区）
git reset --mixed HEAD~1        # 回退到上一个提交，保留修改在工作区

# 硬回退（彻底删除修改）
git reset --hard HEAD~1         # 彻底回退到上一个提交状态

# 回退到特定提交
git reset --hard <commit-hash>
```

### 6.3 恢复已删除的文件
```bash
# 查看删除历史
git log --diff-filter=D --summary

# 恢复文件
git checkout <commit-hash>^ -- <file-path>
```

## 7. 贮藏（Stash）

### 7.1 基本贮藏操作
```bash
# 贮藏当前修改
git stash
git stash save "工作暂存描述"

# 查看贮藏列表
git stash list

# 应用贮藏
git stash apply stash@{0}       # 应用指定贮藏
git stash apply                 # 应用最新贮藏

# 弹出贮藏（应用并删除）
git stash pop

# 删除贮藏
git stash drop stash@{0}        # 删除指定贮藏
git stash clear                 # 删除所有贮藏
```

### 7.2 高级贮藏用法
```bash
# 贮藏指定文件
git stash push -m "描述" -- <file1> <file2>

# 贮藏未跟踪文件
git stash -u

# 查看贮藏内容
git stash show stash@{0}
git stash show -p stash@{0}    # 查看详细差异
```

## 8. 标签管理

### 8.1 创建标签
```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（推荐）
git tag -a v1.0.0 -m "版本 1.0.0 发布"

# 为历史提交打标签
git tag -a v0.9.0 <commit-hash> -m "版本 0.9.0"
```

### 8.2 管理标签
```bash
# 查看标签
git tag
git tag -l "v1.*"              # 筛选标签

# 查看标签详情
git show v1.0.0

# 推送标签到远程
git push origin v1.0.0         # 推送单个标签
git push origin --tags         # 推送所有标签

# 删除标签
git tag -d v1.0.0              # 删除本地标签
git push origin --delete v1.0.0 # 删除远程标签
```

## 9. 前端特定场景

### 9.1 处理 node_modules
```bash
# 从 Git 中删除已提交的 node_modules
git rm -r --cached node_modules
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "从 Git 中移除 node_modules"
```

### 9.2 处理大文件
```bash
# 使用 Git LFS（Large File Storage）
git lfs install                # 安装 Git LFS
git lfs track "*.psd"          # 跟踪大文件类型
git add .gitattributes
git add file.psd
git commit -m "添加设计文件"
```

### 9.3 子模块管理
```bash
# 添加子模块
git submodule add <repository-url> <path>

# 克隆包含子模块的项目
git clone <repository-url>
git submodule init
git submodule update

# 或一次完成
git clone --recurse-submodules <repository-url>

# 更新子模块
git submodule update --remote
```

## 10. 实用技巧

### 10.1 别名设置
```bash
# 设置 Git 别名（添加到 ~/.gitconfig）
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
```

### 10.2 清理仓库
```bash
# 清理未跟踪的文件
git clean -n                  # 预览将要删除的文件
git clean -f                  # 删除未跟踪的文件
git clean -fd                 # 删除未跟踪的文件和目录

# 优化仓库
git gc                        # 垃圾回收
git prune                     # 删除过时对象
```

### 10.3 查找问题
```bash
# 二分查找引入 bug 的提交
git bisect start
git bisect bad                # 标记当前版本有问题
git bisect good v1.0.0        # 标记某个版本正常
# ... 测试当前版本，然后标记 good 或 bad
git bisect reset              # 结束二分查找
```

## 11. 团队协作最佳实践

1. **保持提交原子性**：每个提交只做一件事
2. **编写清晰的提交信息**：使用规范格式
3. **频繁推送**：避免本地堆积大量提交
4. **定期拉取更新**：`git pull --rebase` 保持历史整洁
5. **代码审查**：使用 Pull Request/Merge Request
6. **保护主分支**：禁止直接推送到 main/develop

---

---

