端口代理
git -c http.proxy=http://127.0.0.1:7897 
    -c https.proxy=http://127.0.0.1:7897 
	commit -m "try to commit"
    
git -c http.proxy=http://127.0.0.1:7897 
    -c https.proxy=http://127.0.0.1:7897 
    push -u origin feature/ZoraGan