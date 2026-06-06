# 「墨」部署指南

## 前置要求

- 服务器已安装 Docker 和 Docker Compose
- 已有运行中的 nginx（容器化或宿主机均可）

---

## 1. 上传项目到服务器

```bash
cd /var/www
git clone 你的仓库地址 diary
cd diary
```

## 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

填入以下内容，把密钥和域名替换成你自己的：

```ini
DATABASE_URL="file:/app/data/dev.db"
AUTH_SECRET="用下面的命令生成"
NEXTAUTH_URL="https://你的域名"
AI_API_KEY="你的 DeepSeek API Key"
AI_BASE_URL="https://api.deepseek.com/v1"
AI_MODEL="deepseek-v4-pro"
OPENWEATHER_API_KEY="你的 OpenWeatherMap API Key"
```

生成 `AUTH_SECRET`：

```bash
openssl rand -base64 32
```

把输出结果粘贴到 `AUTH_SECRET` 的值里。保存退出。

## 3. 创建数据目录

```bash
mkdir -p data
```

> SQLite 数据库文件会保存在 `./data/` 目录中。该目录通过 Docker 卷挂载到容器内 `/app/data/`，容器重建不会丢失数据。

## 4. 集成到你的 Docker Compose

你的服务器上应该已有包含 nginx 的 `docker-compose.yml`。有两种方式加入日记服务：

### 方式 A：合并到现有 compose（推荐）

将本项目 `docker-compose.yml` 中 `services.diary` 的定义复制到你现有 compose 文件的 `services:` 下。同时添加网络，确保 nginx 和 diary 在同一 Docker 网络内：

```yaml
services:
  nginx:
    # ... 你已有的 nginx 配置
    networks:
      - diary-net

  diary:
    # 从本项目的 docker-compose.yml 复制
    build:
      context: ./diary
      dockerfile: Dockerfile
    container_name: diary
    restart: unless-stopped
    volumes:
      - ./diary/data:/app/data
    env_file:
      - ./diary/.env
    environment:
      - NODE_ENV=production
    networks:
      - diary-net

networks:
  diary-net:
    driver: bridge
```

### 方式 B：独立 compose 文件

保持本项目 `docker-compose.yml` 不变，在项目目录内直接启动：

```bash
docker compose up -d --build
```

如果 nginx 在宿主机运行（非容器化），使用 `proxy_pass http://127.0.0.1:3000`。如果 nginx 在另一个容器中，需要将 diary 加入 nginx 所在的网络。

## 5. 构建并启动

```bash
docker compose up -d --build
```

验证服务状态：

```bash
docker compose ps
```

`diary` 服务应显示 `healthy`。

## 6. 配置 Nginx 反代

将 `nginx-diary.conf` 中的 `location /` 块添加到你的 nginx server 配置中。

重载 nginx：

```bash
# 容器化 nginx
docker compose exec nginx nginx -s reload

# 宿主机 nginx
sudo nginx -s reload
```

## 7. 验证部署

访问 `https://你的域名`，应显示「墨」的登录/注册页面。注册账号后即可使用。

---

## 数据库说明

- 首次启动时，Prisma 客户端会自动连接 SQLite，无需手动运行迁移
- 数据库文件位于宿主机 `./data/dev.db`
- 备份数据库只需复制 `./data/` 目录：
  ```bash
  cp -r data/ data-backup-$(date +%Y%m%d)/
  ```

---

## 常用命令

```bash
# 查看日志
docker compose logs -f diary

# 重启应用
docker compose restart diary

# 停止
docker compose down

# 进入容器调试
docker compose exec diary sh

# 更新代码后重新部署
git pull
docker compose up -d --build
```

---

## 故障排除

| 问题 | 可能原因 | 解决方法 |
|---|---|---|
| `better-sqlite3` 编译失败 | 使用了 Alpine 镜像，缺少编译工具 | 确保 Dockerfile 使用 `node:20-slim`，已安装 `python3 make g++` |
| 数据库文件权限错误 | `data/` 目录权限不正确 | 容器内用户 UID 为 1001，确保宿主机 `data/` 目录可被写入：`chmod 777 data/` |
| nginx 返回 502 | 无法连接到 diary 容器 | 检查 `proxy_pass` 地址：同 Docker 网络用 `http://diary:3000`，宿主机用 `http://127.0.0.1:3000` |
| AI 润色功能超时 | nginx 默认 60s 超时不够 | 确认 `proxy_read_timeout` 设置为 `120s` |
| 登录后无限重定向 | `NEXTAUTH_URL` 配置错误 | 确保 `.env` 中 `NEXTAUTH_URL` 为 `https://你的域名`（与实际访问地址一致，包括协议） |
| 容器启动后立即退出 | 缺少 `.env` 文件或环境变量不完整 | 检查 `.env` 文件是否存在且包含所有必需变量 |
