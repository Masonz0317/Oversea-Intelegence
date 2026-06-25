# 生产环境部署指南

## 架构概览

```
用户 → :80 (Nginx) → RAGFlow 前端页面
                   → /api/* 代理到 :9005 (overseas-backend)
```

两个服务：
- **RAGFlow**：前端页面 + 知识库 + 对话引擎（Nginx 端口 80）
- **overseas-backend**：用户认证 + 聊天记录 + 管理后台（端口 9005）

## 一、服务器准备

### 最低配置

| 资源 | 建议 |
|---|---|
| CPU | 4 核+ |
| 内存 | 8 GB+ |
| 磁盘 | 50 GB+ |
| 系统 | Ubuntu 22.04 / CentOS 7+ |

### 安装 Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin
```

### 开放端口

云服务器安全组 / 防火墙放行：
- `80`（HTTP）
- `443`（HTTPS，配置 SSL 后需要）

---

## 二、部署步骤

### 1. 克隆仓库

```bash
git clone https://github.com/Masonz0317/Oversea-Intelegence.git
cd Oversea-Intelegence
```

### 2. 配置环境变量

```bash
cd docker
cp .env.example .env   # 如果没有 .env.example，手动编辑 .env
```

关键配置（`docker/.env`）：

```bash
# 时区
TZ=Asia/Shanghai

# RAGFlow 对外端口
SVR_HTTP_PORT=80

# 内存限制（按服务器实际内存调整）
MEM_LIMIT=8073741824
```

### 3. 配置后端

编辑 `overseas-backend/server.py` 顶部的环境变量，或通过 Docker Compose 注入：

```bash
# 生产环境务必修改以下默认值：
JWT_SECRET=<生成一个随机密钥>
ADMIN_PWD=<强密码>
SMTP_HOST=<邮件服务器地址>
SMTP_PORT=465
SMTP_USER=<发件邮箱>
SMTP_PWD=<邮箱密码>
SMTP_FROM=noreply@你的域名.com
```

生成随机密钥：
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4. 配置 LLM

部署后登录管理员后台，在设置中配置：
- API Key
- API Base URL
- Model 名称

### 5. 启动服务

```bash
cd docker

# 使用基础 Compose（Linux 服务器）
docker compose -f docker-compose.yml up -d

# macOS 用这个
docker compose -f docker-compose-macos.yml up -d

# 查看日志
docker compose logs -f

# 确认服务正常
curl http://localhost:80
curl http://localhost:9005/api/auth/login
```

---

## 三、配置域名和 HTTPS

### 1. DNS 解析

将域名 A 记录指向服务器 IP。

### 2. 安装 Certbot（Let's Encrypt 免费 SSL）

```bash
# Ubuntu
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 你的域名.com
```

Certbot 会自动修改 Nginx 配置，启用 HTTPS。

### 3. 手动 Nginx 反向代理（如果需要）

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    # RAGFlow 前端
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:9005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 四、开机自启

```bash
# Docker Compose 服务设置开机自启
# 在 docker-compose.yml 中已有 restart: unless-stopped 则自动重启

# 如果没有，创建 systemd 服务：
sudo tee /etc/systemd/system/ragflow.service << 'EOF'
[Unit]
Description=RAGFlow + Overseas Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/Oversea-Intelegence/docker
ExecStart=/usr/bin/docker compose -f docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ragflow
```

---

## 五、常用运维命令

```bash
# 查看所有容器状态
docker compose -f docker-compose.yml ps

# 查看日志
docker compose -f docker-compose.yml logs -f --tail=100

# 重启单个服务
docker compose -f docker-compose.yml restart overseas-backend

# 更新代码后重新构建并部署
git pull
docker compose -f docker-compose.yml build overseas-backend
docker compose -f docker-compose.yml up -d overseas-backend

# 前端更新（重新构建 dist 后）
cd web && npm run build
docker cp dist/. <ragflow容器名>:/ragflow/web/dist/

# 数据库备份
cp overseas-backend/data.db overseas-backend/data.db.bak.$(date +%Y%m%d)
```

---

## 六、安全检查清单

- [ ] `JWT_SECRET` 已改为随机密钥
- [ ] `ADMIN_PWD` 已改为强密码
- [ ] SMTP 邮箱密码为应用专用密码（非主密码）
- [ ] 服务器防火墙只开放 80 / 443 端口
- [ ] 已配置 HTTPS（Let's Encrypt）
- [ ] 数据库定期备份
- [ ] `.env` 文件未被提交到 Git
