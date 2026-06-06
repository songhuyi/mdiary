# 「墨」部署指南

## 1. 上传项目到服务器

```bash
cd /var/www
git clone 你的仓库地址 diary
cd diary
```

## 2. 创建 `.env` 文件

```bash
cp .env.example .env
nano .env
```

填入以下内容，把密钥和域名替换成你自己的：

```bash
DATABASE_URL="file:/app/data/dev.db"
AUTH_SECRET="用下面的命令生成"
NEXTAUTH_URL="https://你的域名"
AI_API_KEY="你的DeepSeek API Key"
AI_BASE_URL="https://api.deepseek.com/v1"
AI_MODEL="deepseek-v4-pro"
OPENWEATHER_API_KEY="你的OpenWeatherMap API Key"
```

生成 `AUTH_SECRET`：

```bash
openssl rand -base64 32
```

把输出结果粘贴到 `AUTH_SECRET` 的值里。保存退出（Ctrl+O 回车 Ctrl+X）。

## 3. 创建数据目录

```bash
mkdir -p data
```

## 4. 构建并启动

```bash
docker compose up -d --build
```

## 5. 配置你的 Nginx 反代

在你已有的 Nginx 配置中加一个 `proxy_pass`：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 6. 完成

访问 `https://你的域名`，注册账号即可使用。

---

## 常用命令

```bash
# 查看日志
docker compose logs -f diary

# 重启应用
docker compose restart diary

# 停止
docker compose down

# 更新代码后重新部署
git pull
docker compose up -d --build
```
