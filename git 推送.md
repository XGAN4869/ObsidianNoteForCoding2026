端口代理
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 commit -m "try to commit"
    
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push -u origin feature/ZoraGan
    
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 pull origin feature/companyGan

git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 clone  https://github.com/un-pany/v3-admin-vite.git

文件取消追踪
```bash
git rm -r --cached 根目录开始的文件地址
```