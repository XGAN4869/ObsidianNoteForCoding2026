## 拉代码流程
```bash
# 暂存+提交
git add. 
git commit -m "feat: xxx"
# 切换到目标分支
git checkout 分支名
# 拉代码
git pull
# 切回当前分支
git checkout 分支名
# 合代码
git merge 要合的目标分支名 --no-edit
# 有冲突的话解决冲突，没有就重复第一步
git add.
git commit -m "feat: xxx"
```

## 本地仓库有东西且连接远程
```bash
# 给本地仓库起一个“远程地址别名”，叫 origin（和远程分支没关系，无所谓叫什么）
git remote add origin 远程仓库链接
# 拉远程数据（比如拿到远程分支）❌ 不改 P.S.[git pull = fetch + merge ✅ 会改]
git fetch origin
# 上面那一步结束后就可以看到远程分支的数据了
git checkout 分支名
#推送，之后固定推送的分支
git push -u origin 分支名
```

## 合并 feature分支 到 main分支
```bash
# 切到 main 分支
git checkout main
# 确保 main 分支是最新代码
git pull origin main
# 合并feature 分支
git merge feature
# 推送到远程
git push origin main
```
## 撤销 merge，细察
```bash
git reset xxx
```