## Docker 指令
1. 启动一个容器
```powershell
docker run 
--name SQL_Container
-e MYSQL_ROOT_PASSWORD=123456 
-e MYSQL_DATABASE=sky_take_out 
-p 3308:3306 
-v sky_mysql_data:/var/lib/mysql 
-d mysql:8.4

复制版本：docker run --name SQL_Container -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=sky_take_out -p 3308:3306 -v sky_mysql_data:/var/lib/mysql -d mysql:8.4
```

| 部分                                 | 作用                          |
| ---------------------------------- | --------------------------- |
| `--name SQL_Container`             | 给容器起名                       |
| `MYSQL_ROOT_PASSWORD=123456`       | 设置 MySQL 的 root 密码          |
| `MYSQL_DATABASE=sky_take_out`      | 首次初始化时创建这个数据库               |
| `-p 3308:3306`                     | 电脑的 `3308` 端口连接容器内部的 `3306` |
| `-v sky_mysql_data:/var/lib/mysql` | 用数据卷保存数据库文件                 |
| `-d mysql:8.4`                     | 在后台运行 MySQL 8.4             |
application-dev.yaml
```yaml
host: localhost
port: 3308
database: sky_take_out
username: root
password: 123456
```

2. docker start SQL_Container