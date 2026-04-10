# Git 命令常用选项详解

本笔记专门解释 Git 命令中常见的选项（flags），如 `-b`、`-m`、`-u` 等，方便快速查阅。

> 相关笔记：[[git.md]]

## 目录
- [基础选项](#基础选项)
- [分支相关选项](#分支相关选项)
- [提交相关选项](#提交相关选项)
- [推送与拉取选项](#推送与拉取选项)
- [合并与重置选项](#合并与重置选项)
- [贮藏相关选项](#贮藏相关选项)
- [标签相关选项](#标签相关选项)
- [其他实用选项](#其他实用选项)

## 基础选项

### `-h` / `--help`
**作用**：显示命令帮助信息。
```bash
git commit -h      # 查看 commit 命令的帮助
git --help         # 查看 Git 总体帮助
```

### `-v` / `--version`
**作用**：显示 Git 版本。
```bash
git --version
```

## 分支相关选项

### `-b`
**完整形式**：`--branch`
**作用**：创建新分支并立即切换到该分支。
```bash
git checkout -b feature/login     # 创建并切换到 feature/login 分支
git switch -c feature/login       # Git 2.23+ 推荐方式，效果相同
```

### `-d`
**完整形式**：`--delete`
**作用**：删除已合并的分支。
```bash
git branch -d feature/login       # 删除已合并的 feature/login 分支
```

### `-D`
**完整形式**：`--delete --force`
**作用**：强制删除分支（即使未合并）。
```bash
git branch -D experiment          # 强制删除未合并的 experiment 分支
```

### `-m`
**完整形式**：`--move`
**作用**：重命名分支。
```bash
git branch -m new-name           # 重命名当前分支为 new-name
git branch -m old-name new-name  # 重命名指定分支
```

### `-r`
**作用**：在 `git branch` 命令中，显示远程分支。
```bash
git branch -r                    # 列出所有远程分支
```

### `-a`
**作用**：在 `git branch` 命令中，显示所有分支（本地+远程）。
```bash
git branch -a                    # 列出所有分支
```

## 提交相关选项

### `-m`
**完整形式**：`--message`
**作用**：直接提供提交信息，避免打开编辑器。
```bash
git commit -m "修复登录按钮样式"
```
**注意**：必须用引号括起提交信息。

### `-a`
**完整形式**：`--all`
**作用**：自动暂存所有已跟踪文件的修改，然后提交。
```bash
git commit -am "更新所有已修改文件"
```
**等价于**：`git add .` + `git commit -m "..."`

### `--amend`
**作用**：修改最近一次提交。
```bash
git commit --amend -m "修正提交信息"    # 只改信息
git commit --amend --no-edit           # 只改内容，不改信息
```

## 推送与拉取选项

### `-u`
**完整形式**：`--set-upstream`
**作用**：推送分支并设置上游分支，后续可直接使用 `git push`。
```bash
git push -u origin feature/login
# 设置后，后续只需运行 git push 即可
```

### `--all`
**作用**：推送所有分支。
```bash
git push --all origin
```

### `--tags`
**作用**：推送所有标签。
```bash
git push origin --tags
```

### `--rebase`
**作用**：拉取更新时使用变基而非合并，保持历史线性。
```bash
git pull --rebase origin main
```

## 合并与重置选项

### `--no-ff`
**作用**：禁用快进合并，保留分支历史。
```bash
git merge --no-ff feature/login  # 非快进合并
```

### `--ff-only`
**作用**：只允许快进合并，否则失败。
```bash
git merge --ff-only feature/login
```

### `--abort`
**作用**：中止当前的合并或变基操作。
```bash
git merge --abort    # 中止合并
git rebase --abort   # 中止变基
```

### `--soft`
**作用**：软重置，回退提交但保留修改在暂存区。
```bash
git reset --soft HEAD~1  # 回退到上一个提交，修改在暂存区
```

### `--mixed`
**作用**：混合重置（默认），回退提交但保留修改在工作区。
```bash
git reset --mixed HEAD~1  # 回退到上一个提交，修改在工作区
```

### `--hard`
**作用**：硬重置，彻底回退到指定状态，丢弃所有修改。
```bash
git reset --hard HEAD~1  # 彻底回退到上一个提交
```

## 贮藏相关选项

### `-u`
**作用**：贮藏时包括未跟踪的文件。
```bash
git stash -u                   # 贮藏所有修改（包括未跟踪文件）
git stash save -u "暂存描述"   # 带描述的贮藏
```

### `-p`
**作用**：交互式选择要贮藏的修改。
```bash
git stash -p                   # 交互式贮藏
```

### `--keep-index`
**作用**：贮藏时保留暂存区的修改。
```bash
git stash --keep-index         # 只贮藏工作区修改，保留暂存区
```

## 标签相关选项

### `-a`
**作用**：创建附注标签（annotated tag）。
```bash
git tag -a v1.0.0 -m "版本 1.0.0 发布"
```

### `-d`
**作用**：删除标签。
```bash
git tag -d v1.0.0              # 删除本地标签
git push origin --delete v1.0.0 # 删除远程标签
```

### `-l`
**作用**：列出匹配模式的标签。
```bash
git tag -l "v1.*"              # 列出所有 v1.x.x 标签
```

## 其他实用选项

### `-n`
**作用**：预览操作而不实际执行。
```bash
git clean -n                   # 预览将要删除的未跟踪文件
```

### `-f`
**作用**：强制操作。
```bash
git clean -f                   # 强制删除未跟踪文件
```

### `-C`
**作用**：在其他目录中运行 Git 命令。
```bash
git -C /path/to/other/repo status  # 在其他仓库中运行 status
```

### `--cached`
**作用**：操作暂存区而非工作区。
```bash
git rm --cached file.txt       # 从 Git 中删除但保留本地文件
```

### `--dry-run`
**作用**：试运行，显示将要执行的操作但不实际执行。
```bash
git push --dry-run origin main  # 试运行推送
```

## 组合使用示例

### 创建分支并设置上游
```bash
git checkout -b feature/login
git push -u origin feature/login
# 等价于：创建分支、推送、设置上游
```

### 修改上次提交
```bash
git add forgotten-file.js
git commit --amend --no-edit
# 将文件加入上次提交，不改提交信息
```

### 贮藏未跟踪文件并应用
```bash
git stash -u -m "暂存新文件"
# ... 切换分支工作
git stash pop
```

### 安全删除未合并分支
```bash
git branch -d feature/abandoned   # 如果已合并，正常删除
# 如果失败，使用强制删除
git branch -D feature/abandoned
```

---

**标签**： #Git #命令选项 #开发工具 #版本控制

**相关笔记**：
- [[git.md]] - Git 常用指令完整指南
- [[前端面试记录解析]] - 面试中的 Git 相关问题
- [[CLAUDE]] - 项目说明文件