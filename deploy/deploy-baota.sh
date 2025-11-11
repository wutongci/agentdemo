#!/bin/bash

# AgentDemo - 宝塔面板部署脚本
# 适用于宝塔面板 7.x+ 环境

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AgentDemo - 宝塔面板部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 获取项目根目录
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${YELLOW}📁 项目目录: $PROJECT_ROOT${NC}"
echo ""

# Step 1: 检查环境
echo -e "${BLUE}Step 1: 检查部署环境${NC}"
echo "============================================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
    echo "请在宝塔面板中安装 Node.js 版本管理器,推荐安装 Node.js 20.x LTS"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: npm 未安装${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# 检查 Go（改进版，支持宝塔面板和多种安装路径）
GO_CMD=""
GO_PATHS=(
    "go"
    "/usr/local/btgo/bin/go"  # 宝塔面板安装路径
    "/usr/local/go/bin/go"
    "/usr/bin/go"
    "$HOME/go/bin/go"
    "/opt/go/bin/go"
)

# 首先尝试在当前环境查找
for path in "${GO_PATHS[@]}"; do
    if command -v "$path" &> /dev/null 2>&1; then
        GO_CMD="$path"
        break
    elif [ -f "$path" ]; then
        GO_CMD="$path"
        export PATH="$(dirname "$path"):$PATH"
        break
    fi
done

# 如果还是找不到，尝试使用 sudo -E 保留环境变量查找
if [ -z "$GO_CMD" ]; then
    GO_CMD=$(sudo -E which go 2>/dev/null || echo "")
    if [ -n "$GO_CMD" ]; then
        export PATH="$(dirname "$GO_CMD"):$PATH"
    fi
fi

# 如果仍然找不到，检查常见路径
if [ -z "$GO_CMD" ]; then
    for path in "${GO_PATHS[@]}"; do
        if [ -f "$path" ]; then
            GO_CMD="$path"
            export PATH="$(dirname "$path"):$PATH"
            break
        fi
    done
fi

# 验证 Go 是否可用
if [ -z "$GO_CMD" ] || ! $GO_CMD version &> /dev/null 2>&1; then
    echo -e "${RED}❌ 错误: Go 未安装或无法访问${NC}"
    echo "请在宝塔面板的软件商店中安装 Go 1.21+"
    echo ""
    echo "尝试查找 Go:"
    which go 2>/dev/null || echo "  which go: 未找到"
    sudo which go 2>/dev/null || echo "  sudo which go: 未找到"
    [ -f "/usr/local/btgo/bin/go" ] && echo "  /usr/local/btgo/bin/go: 存在" || echo "  /usr/local/btgo/bin/go: 不存在"
    [ -f "/usr/local/go/bin/go" ] && echo "  /usr/local/go/bin/go: 存在" || echo "  /usr/local/go/bin/go: 不存在"
    exit 1
fi

GO_VERSION=$($GO_CMD version 2>/dev/null || sudo -E $GO_CMD version 2>/dev/null)
echo -e "${GREEN}✅ Go: $GO_VERSION${NC}"
echo -e "${GREEN}   Go 路径: $GO_CMD${NC}"

# 检查 PM2（稳健版，带回退）
USE_NPX=false
if command -v pm2 >/dev/null 2>&1; then
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ PM2: $PM2_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 未安装,尝试安装...${NC}"
    # 仅在安装阶段放宽错误退出
    set +e

    # 优先尝试使用 sudo 进行全局安装
    if sudo -n true 2>/dev/null; then
        echo -e "${YELLOW}ℹ️  使用 sudo 全局安装 PM2...${NC}"
        sudo npm install -g pm2
    else
        echo -e "${YELLOW}ℹ️  无 sudo 权限,尝试用户目录安装...${NC}"
        # 方式1: 使用 npm prefix
        mkdir -p "$HOME/.npm-global"
        npm config set prefix "$HOME/.npm-global"
        npm install -g pm2
        export PATH="$HOME/.npm-global/bin:$PATH"

        # 更新 shell 配置以永久生效
        if [ -f "$HOME/.bashrc" ]; then
            if ! grep -q ".npm-global/bin" "$HOME/.bashrc"; then
                echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.bashrc"
            fi
        fi
    fi

    # 刷新命令缓存
    hash -r 2>/dev/null || true

    # 恢复严格模式
    set -e

    # 检查安装是否成功
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 安装完成${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 全局安装失败,将使用 npx 临时运行${NC}"
        echo -e "${YELLOW}ℹ️  这会导致每次命令都重新下载 PM2,建议手动安装${NC}"
        USE_NPX=true
    fi
fi

if [ "$USE_NPX" = true ]; then
    echo -e "${GREEN}✅ 使用 PM2 命令: npx pm2@latest${NC}"
else
    echo -e "${GREEN}✅ 使用 PM2 命令: pm2${NC}"
fi

echo ""

# Step 2: 检查配置文件
echo -e "${BLUE}Step 2: 检查配置文件${NC}"
echo "============================================================"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在${NC}"
    echo "请先复制 .env.example 到 .env 并配置 API Key:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✅ .env 配置文件存在${NC}"

# 读取配置
ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" || echo "")
MODEL=$(grep "^MODEL=" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" || echo "")
PORT=$(grep "^PORT=" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" || echo "")
PORT=${PORT:-3031}

echo "  Model: ${MODEL:-claude-3-haiku-20240307 (default)}"
echo "  Port: $PORT"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  API Key: ${ANTHROPIC_API_KEY:0:15}..."
else
    echo "  API Key: (未设置，将使用 yunwu.ai 默认配置)"
fi
echo ""

# Step 3: 构建后端
echo -e "${BLUE}Step 3: 构建后端 Go 应用${NC}"
echo "============================================================"

cd "$BACKEND_DIR"

echo -e "${YELLOW}🔄 下载 Go 依赖...${NC}"
# 使用国内代理加速
GOPROXY=https://goproxy.cn,direct $GO_CMD mod tidy

echo -e "${YELLOW}🔨 编译后端...${NC}"
$GO_CMD build -o agentdemo main.go

if [ -f "agentdemo" ]; then
    echo -e "${GREEN}✅ 后端编译成功${NC}"
    ls -lh agentdemo
else
    echo -e "${RED}❌ 后端编译失败${NC}"
    exit 1
fi

echo ""

# Step 4: 构建前端
echo -e "${BLUE}Step 4: 构建前端 React 应用${NC}"
echo "============================================================"

cd "$FRONTEND_DIR"

echo -e "${YELLOW}📦 安装前端依赖...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 构建前端生产版本...${NC}"
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ 前端构建成功${NC}"
    echo "  构建输出目录: $FRONTEND_DIR/dist"
else
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi

echo ""

# Step 5: 使用 PM2 部署后端
echo -e "${BLUE}Step 5: 使用 PM2 部署后端服务${NC}"
echo "============================================================"

# PM2 命令函数
pm2_run() {
    if [ "$USE_NPX" = true ]; then
        npx --yes pm2@latest "$@"
    else
        pm2 "$@"
    fi
}

# 停止旧版本
echo -e "${YELLOW}🛑 停止旧版本服务...${NC}"
pm2_run stop agentdemo-backend 2>/dev/null || true
pm2_run delete agentdemo-backend 2>/dev/null || true

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 启动后端
echo -e "${YELLOW}🚀 启动后端服务...${NC}"
cd "$BACKEND_DIR"

# 创建后端启动脚本,加载 .env 文件
cat > "$BACKEND_DIR/start-backend.sh" << 'EOFSH'
#!/bin/bash
# 加载环境变量
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi
# 启动后端
exec ./agentdemo
EOFSH

chmod +x "$BACKEND_DIR/start-backend.sh"

pm2_run start start-backend.sh \
    --name agentdemo-backend \
    --time \
    --log "$PROJECT_ROOT/logs/backend.log" \
    --error "$PROJECT_ROOT/logs/backend-error.log"

# 保存 PM2 配置
pm2_run save

# 设置 PM2 开机自启（仅在非 npx 模式下）
if [ "$USE_NPX" = false ]; then
    pm2_run startup | grep -v "PM2" | bash 2>/dev/null || true
else
    echo -e "${YELLOW}ℹ️  使用 npx 模式,跳过开机自启配置${NC}"
    echo -e "${YELLOW}ℹ️  建议手动安装 PM2: npm install -g pm2${NC}"
fi

echo ""

# Step 6: 验证部署
echo -e "${BLUE}Step 6: 验证部署${NC}"
echo "============================================================"

sleep 3

# 检查服务状态
echo -e "${YELLOW}📊 服务状态:${NC}"
pm2_run list

echo ""

# 测试后端
echo -e "${YELLOW}🔍 测试后端服务...${NC}"
if curl -s http://localhost:$PORT/api/sessions > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常 (端口 $PORT)${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务无响应，请查看日志: pm2 logs agentdemo-backend${NC}"
fi

echo ""
echo "============================================================"
echo -e "${GREEN}✅ 部署完成!${NC}"
echo "============================================================"
echo ""
echo "📋 服务信息:"
echo "  - 后端 API: http://localhost:3031"
echo "  - 前端静态文件: $FRONTEND_DIR/dist"
echo ""
echo "📊 管理命令:"
echo "  - 查看状态: pm2 status"
echo "  - 查看日志: pm2 logs"
echo "  - 重启服务: pm2 restart agentdemo-backend"
echo "  - 停止服务: pm2 stop agentdemo-backend"
echo ""
echo "🌐 配置 Nginx 反向代理:"
echo "  请在宝塔面板中:"
echo "  1. 创建网站 (域名: agentdemo.bullteam.cn)"
echo "  2. 网站根目录设置为: $FRONTEND_DIR/dist"
echo "  3. 配置反向代理:"
echo "     - 代理名称: agentdemo-api"
echo "     - 目标 URL: http://127.0.0.1:3031"
echo "     - 发送域名: \$host"
echo "     - 位置: /api/"
echo "  4. 启用 SSL (Let's Encrypt)"
echo ""
echo "📖 详细文档: deploy/BAOTA.md"
echo ""

