# 🚀 宝塔面板部署指南

> AgentDemo 宝塔面板一键部署教程

## 📋 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [详细步骤](#详细步骤)
- [Nginx 配置](#nginx-配置)
- [SSL 证书配置](#ssl-证书配置)
- [常见问题](#常见问题)
- [管理维护](#管理维护)

---

## 🔧 环境要求

### 必需软件

在宝塔面板中安装以下软件：

| 软件 | 推荐版本 | 安装位置 |
|------|---------|---------|
| **Node.js** | 20.x LTS | 软件商店 → 运行环境 |
| **Go** | 1.21+ | 软件商店 → 运行环境 |
| **PM2** | Latest | 通过 npm 安装 |
| **Nginx** | Latest | 软件商店 → Web 服务器 |

### 服务器要求

- **操作系统**: Ubuntu 20.04/22.04, CentOS 7/8, Debian 10/11
- **内存**: 最低 1GB，推荐 2GB+
- **磁盘**: 最低 5GB 可用空间
- **端口**: 80, 443, 3031, 8088

---

## ⚡ 快速部署（5分钟）

### 方式一：使用一键脚本（推荐）

```bash
# 1. SSH 登录到服务器
ssh root@your-server-ip

# 2. 进入项目目录（如果还没上传，先上传项目）
cd /www/wwwroot/agentdemo

# 3. 配置环境变量
cp .env.example .env
nano .env
# 配置 API Key 后保存 (Ctrl+O, Enter, Ctrl+X)

# 4. 运行一键部署脚本
chmod +x deploy/deploy-baota.sh
./deploy/deploy-baota.sh
```

**就这么简单！** 🎉 脚本会自动完成所有配置。

### 方式二：使用宝塔文件管理器

1. **上传项目**
   - 在宝塔面板 → 文件 → `/www/wwwroot/` 目录
   - 上传项目压缩包并解压

2. **配置环境**
   - 打开终端（文件管理器 → 终端）
   - 执行上述命令

---

## 📚 详细步骤

### Step 1: 安装必需软件

#### 1.1 安装 Node.js

1. 打开宝塔面板
2. 进入 **软件商店**
3. 搜索 **"Node.js 版本管理器"**
4. 点击 **安装**
5. 安装完成后，点击 **设置**
6. 安装 **Node.js 20.x LTS**

#### 1.2 安装 Go

1. 在软件商店搜索 **"Go"**
2. 安装 **Go 1.21+**

#### 1.3 安装 PM2

```bash
# SSH 登录后执行
npm install -g pm2
```

或在宝塔面板终端中执行。

### Step 2: 上传项目

#### 方式A: 使用 Git（推荐）

```bash
cd /www/wwwroot
git clone git@github.com:wutongci/agentdemo.git
cd agentdemo
```

#### 方式B: 使用宝塔文件管理器

1. 在本地压缩项目文件夹
2. 在宝塔面板 → 文件 → `/www/wwwroot/`
3. 上传压缩包
4. 解压

### Step 3: 配置环境变量

```bash
cd /www/wwwroot/agentdemo
cp .env.example .env
nano .env
```

**最小配置示例**:
```bash
# yunwu.ai API Key（可选，不设置则使用默认配置）
ANTHROPIC_API_KEY=sk-ant-your-key-here

# 服务器端口
PORT=3031

# 模型配置（可选，默认使用最便宜的 haiku）
MODEL=claude-3-haiku-20240307
```

**保存**: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 4: 执行部署脚本

```bash
chmod +x deploy/deploy-baota.sh
./deploy/deploy-baota.sh
```

**脚本会自动**:
- ✅ 检查环境依赖
- ✅ 安装 PM2（如果未安装）
- ✅ 构建后端 Go 应用
- ✅ 构建前端 React 应用
- ✅ 使用 PM2 启动后端服务
- ✅ 配置开机自启
- ✅ 验证部署状态

### Step 5: 配置 Nginx

#### 在宝塔面板中配置

1. **创建网站**
   - 网站 → 添加站点
   - 域名: `agentdemo.bullteam.cn`
   - 根目录: `/www/wwwroot/agentdemo/frontend/dist`
   - PHP 版本: 纯静态

2. **配置反向代理**
   - 点击网站 → 设置
   - 选择 **反向代理**
   - 点击 **添加反向代理**
   - 配置如下:
     ```
     代理名称: agentdemo-api
     目标 URL: http://127.0.0.1:8080
     发送域名: $host
     位置: /api/
     ```
   - 点击 **提交**

3. **配置 WebSocket（如果需要）**
   - 在反向代理设置中，点击 **配置文件**
   - 添加以下配置:
     ```nginx
     # WebSocket 支持
     location /ws/ {
         proxy_pass http://127.0.0.1:3031;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
     }
     ```

4. **配置 SPA 路由**
   - 在网站设置 → 配置文件
   - 在 `location /` 中添加:
     ```nginx
     try_files $uri $uri/ /index.html;
     ```

#### 方式二：使用配置文件（推荐）

1. 在网站设置 → 配置文件
2. 将 `deploy/nginx-baota.conf` 的内容复制粘贴到配置文件中
3. 修改根目录路径（如果需要）
4. 保存并重启 Nginx

### Step 6: 配置 SSL 证书

1. 在网站设置中，选择 **SSL**
2. 选择 **Let's Encrypt**
3. 输入域名和邮箱
4. 勾选 **强制 HTTPS**
5. 点击 **申请**

**自动续期**: 宝塔会自动续期证书，无需手动操作。

### Step 7: 验证部署

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 测试访问
curl http://localhost:3031/api/sessions  # 后端
curl https://agentdemo.bullteam.cn       # 前端
```

---

## 🌐 Nginx 配置

### 在宝塔面板中配置反向代理

#### 方式一：使用宝塔界面（推荐）

1. **创建网站**
   - 网站 → 添加站点
   - 域名: `agentdemo.bullteam.cn`
   - 根目录: `/www/wwwroot/agentdemo/frontend/dist`
   - PHP 版本: 纯静态

2. **配置反向代理**
   - 点击网站 → 设置
   - 选择 **反向代理**
   - 点击 **添加反向代理**
   - 配置如下:
     ```
     代理名称: agentdemo-api
     目标 URL: http://127.0.0.1:8080
     发送域名: $host
     位置: /api/
     ```
   - 点击 **提交**

3. **高级配置** (可选)
   - 在反向代理设置中，点击 **配置文件**
   - 添加以下配置:
     ```nginx
     # WebSocket 支持
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";

     # 超时设置
     proxy_connect_timeout 60s;
     proxy_send_timeout 60s;
     proxy_read_timeout 60s;

     # 缓冲设置
     proxy_buffering off;
     ```

#### 方式二：手动配置

如果需要手动配置 Nginx，请参考 [deploy/nginx-baota.conf](./nginx-baota.conf)

---

## 🔒 SSL 证书配置

### 使用 Let's Encrypt (免费)

1. 在网站设置中，选择 **SSL**
2. 选择 **Let's Encrypt**
3. 输入域名和邮箱
4. 勾选 **强制 HTTPS**
5. 点击 **申请**

**自动续期**: 宝塔会自动续期证书，无需手动操作。

---

## 🛠️ 管理维护

### 常用 PM2 命令

```bash
# 查看所有服务
pm2 list

# 查看日志
pm2 logs                    # 所有服务
pm2 logs agentdemo-backend  # 仅后端
pm2 logs --lines 100        # 查看最近 100 行

# 重启服务
pm2 restart all             # 重启所有
pm2 restart agentdemo-backend  # 重启后端

# 停止服务
pm2 stop all
pm2 stop agentdemo-backend

# 删除服务
pm2 delete all
pm2 delete agentdemo-backend

# 查看详细信息
pm2 show agentdemo-backend

# 实时监控
pm2 monit
```

### 更新代码

```bash
cd /www/wwwroot/agentdemo

# 方式1: Git 拉取
git pull origin master

# 方式2: 上传新文件
# 在宝塔面板上传并覆盖

# 重新部署
./deploy/update-baota.sh
```

### 查看日志

```bash
# PM2 日志
pm2 logs

# 系统日志
tail -f /www/wwwroot/agentdemo/logs/backend.log
tail -f /www/wwwroot/agentdemo/logs/backend-error.log

# Nginx 日志
tail -f /www/wwwlogs/agentdemo.bullteam.cn.log
tail -f /www/wwwlogs/agentdemo.bullteam.cn.error.log
```

---

## ❓ 常见问题

### Q1: Node.js 版本不对

**问题**: 提示 Node.js 版本过低

**解决**:
```bash
# 使用宝塔的 Node.js 版本管理器
# 在软件商店 → Node.js 版本管理器 → 安装 20.x LTS

# 或使用 nvm (高级)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Q2: Go 依赖下载失败

**问题**: `go mod tidy` 超时或失败

**解决**:
```bash
cd /www/wwwroot/agentdemo/backend

# 使用国内代理
GOPROXY=https://goproxy.cn,direct go mod tidy

# 或直接从 GitHub
GOPROXY=direct GOSUMDB=off go mod tidy
```

### Q3: 前端构建失败 - 内存不足

**问题**: `npm run build` 提示内存不足

**解决**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

### Q4: PM2 进程启动失败

**问题**: PM2 启动后立即退出

**解决**:
```bash
# 查看详细错误日志
pm2 logs agentdemo-backend --lines 50

# 检查端口占用
netstat -tulnp | grep 3031

# 手动测试启动
cd /www/wwwroot/agentdemo/backend
./agentdemo
```

### Q5: 无法访问网站

**问题**: 配置完成后无法访问

**检查清单**:
```bash
# 1. 检查服务状态
pm2 status

# 2. 检查端口监听
netstat -tulnp | grep 3031

# 3. 检查防火墙
# 在宝塔面板 → 安全 → 放行端口 80, 443, 3031, 8088

# 4. 检查 Nginx 配置
nginx -t

# 5. 重启 Nginx
systemctl restart nginx
```

### Q6: 权限问题

**问题**: 提示权限不足

**解决**:
```bash
# 给予脚本执行权限
chmod +x /www/wwwroot/agentdemo/deploy/*.sh

# 给予项目目录权限 (谨慎使用)
chown -R www:www /www/wwwroot/agentdemo
```

---

## 🎯 性能优化建议

### 1. 启用 Gzip 压缩

在宝塔 Nginx 配置中:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. 配置静态资源缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 启用 HTTP/2

在宝塔 SSL 配置中，勾选 **启用 HTTP/2**

### 4. 配置 CDN

建议使用阿里云 CDN、腾讯云 CDN 或 Cloudflare 加速静态资源。

---

## 📞 获取帮助

- 📖 完整文档: [README.md](../README.md)
- 🐛 问题反馈: [GitHub Issues](https://github.com/wutongci/agentdemo/issues)

---

## 🎉 部署完成检查清单

部署成功后，确认以下项目：

- [ ] PM2 服务状态显示 `online`
- [ ] 后端 API 响应正常 (`curl http://localhost:3031/api/sessions`)
- [ ] 前端页面加载正常 (`curl https://agentdemo.bullteam.cn`)
- [ ] Nginx 反向代理配置正确
- [ ] SSL 证书已安装（如果使用 HTTPS）
- [ ] 域名解析正确 (agentdemo.bullteam.cn)
- [ ] 防火墙端口已放行 (80, 443, 3031, 8088)
- [ ] PM2 开机自启已配置

**恭喜！🎊 您的 AgentDemo 已成功部署到宝塔面板！**

