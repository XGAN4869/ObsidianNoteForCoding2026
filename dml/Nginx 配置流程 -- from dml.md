# 1.前端项目的打包步骤

1.1  安装项目的依赖包

```
npm install  
```

1.2  将项目进行打包

```
npm run build
```

​    打包成功后，会在项目文件的目录下生成了一个 **dist**  文件，这个文件就是我们需要部署到线上的文件

# 2.服务器安装 Nginx 

1.服务器安装nginx

```
sudo yum install -y nginx
```

2.设置启动&设置开机自启

```
sudo systemctl start nginx
sudo systemctl enable nginx
```

3.验证是否安装成功

```
http://服务器IP
游览器访问这个地址，看到 Welcome to nginx! 就说明 安装成功。
```



# 3.部署前端文件

1.将前端生成的**dist**文件直接丢进服务器里面（任意位置即可）

```
scp -r dist/* root@服务器IP:/var/dist

```

2.新建站点配置文件 

```
sudo vi /etc/nginx/conf.d/your-project.conf
```

  3.配置文件详情

```
server {
    listen 80;
    server_name yourdomain.com;   # 替换你的域名

    root /var/dist;  #第一步得文件地址
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
  
# 后端 A： (访问 /api1/  -> 转发到 3000 端口)（api1替换成你的真实前缀）
    location /api1/ {
        proxy_pass http://localhost:3000/;  #替换为你的后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 后端 B： (访问 /api2/ -> 转发到 3001 端)（api2替换成你的真实前缀）
    location /api2/  {
        proxy_pass http://localhost:3001/;  #替换为你的后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        access_log off;
    }
}
```

4.检查并重载 Nginx 

```
sudo nginx -t
sudo systemctl reload nginx

```

