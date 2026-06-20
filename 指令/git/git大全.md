1. 在分支A git add . git commit 了之后，可以通过哈希值恢复回原来的分支
	1. git log # 找到你在A分支做的那个commit，复制前面的哈希值（比如 a1b2c3d）
	2. 切换到分支 B：git switch B
	3. 把 A 分支的 commit 复制到 B：git cherry-pick 复制的哈希值 # 例：git cherry-pick a1b2c3d
	4. 然后本地选择一下要保留的代码
	5. 最后解决冲突后执行 `git add .` + `git cherry-pick --continue`，最后在 B 分支 commit 即可