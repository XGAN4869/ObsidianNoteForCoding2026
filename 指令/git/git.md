#git相关概念
首先，一个仓库里面有很多分支，但是这些分支不一定能连成一棵 git🌳条件如下：
1. 先 git clone，再从 clone 好的本地仓库拉分支
2. 不能现有本地仓库，再通过 remote 的方式连到远程仓库，没通过 clone 的方式 push 上去的东西，会和源头main不一样。
3. 所以如果现在有两颗git🌳，把要保留的那一颗变成 default，删掉另一颗

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

## ❗本地仓库有东西且连接远程
**(不建议，因为这样就不是一颗 git 🌳了，之后可能会无法合并，因为不是同一个源头 )**
```bash
# 给本地仓库起一个“远程地址别名”，叫 origin（和远程分支没关系，无所谓叫什么）
git remote add origin 远程仓库链接
# 更新 origin/* 远程跟踪分支 P.S.[git pull = fetch + merge ✅ 会改]
git fetch origin
# 上面那一步结束后只是将远程分支的信息更新到本地了，但是本地的分支名和远程的分支名不是同步的
# 1. 直接让本地 feature 跟踪远程 feature（优
   git switch --track origin/feature/ZoraGan
# 2. 用远程分支 origin/feature/ZoraGan 创建一个新的本地分支 feature/ZoraGan并切过去
   git checkout -b feature/ZoraGan origin/feature/ZoraGan
以上两种均可
#推送，之后固定推送的分支
git push 
# P.S. 如果用了上面的 --track，这里可以不用 -u 跟踪远程分支。如果没用👇
	git push -u origin 分支名
```
```bash
上面的情况无法成功合并的，只能提交，这样我建议你下次
git clone xxx
再合并

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
## 删除本地分支名
```bash
git branch -d 分支名
```