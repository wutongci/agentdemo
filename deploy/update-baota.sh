#!/bin/bash

# AgentDemo - 宝塔面板更新脚本
# 用于更新代码、重新构建并重启服务
# 适用于宝塔面板 7.x+ 环境

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AgentDemo - 更新脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 获取项目根目录
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${YELLOW}📁 项目目录: $PROJECT_ROOT${NC}"
echo ""

# 检测当前用户和运行用户
CURRENT_USER=$(whoami)
RUN_USER="${RUN_USER:-www}"

# Step 1: 更新代码
echo -e "${BLUE}Step 1: 更新代码${NC}"
echo "============================================================"

cd "$PROJECT_ROOT"

# 检查是否为 Git 仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ 错误: 当前目录不是 Git 仓库${NC}"
    exit 1
fi

# 检查 Git 权限问题
if ! git status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git 权限问题，尝试修复...${NC}"
    
    # 检查目录所有者
    DIR_OWNER=$(stat -c '%U' "$PROJECT_ROOT" 2>/dev/null || stat -f '%Su' "$PROJECT_ROOT" 2>/dev/null || echo "")
    
    if [ "$DIR_OWNER" != "$CURRENT_USER" ] && sudo -n true 2>/dev/null; then
        echo -e "${YELLOW}   修复 .git 目录权限...${NC}"
        sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$PROJECT_ROOT/.git" 2>/dev/null || true
        sudo chmod -R 755 "$PROJECT_ROOT/.git" 2>/dev/null || true
    fi
    
    # 添加 safe.directory
    git config --global --add safe.directory "$PROJECT_ROOT" 2>/dev/null || true
fi

# 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
if git pull origin master || git pull origin main; then
    echo -e "${GREEN}✅ 代码更新成功${NC}"
else
    echo -e "${YELLOW}⚠️  Git pull 失败，尝试使用 sudo...${NC}"
    if sudo -n true 2>/dev/null; then
        # 尝试使用 sudo 运行，但保持当前用户的所有者
        sudo -u "$CURRENT_USER" git pull origin master || sudo -u "$CURRENT_USER" git pull origin main || {
            echo -e "${RED}❌ 代码更新失败${NC}"
            echo "请手动执行: cd $PROJECT_ROOT && git pull origin master"
            exit 1
        }
        echo -e "${GREEN}✅ 代码更新成功${NC}"
    else
        echo -e "${RED}❌ 代码更新失败，请手动执行: git pull origin master${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: 检查环境
echo -e "${BLUE}Step 2: 检查环境${NC}"
echo "============================================================"

# 检查 Go（复用 deploy-baota.sh 的逻辑）
GO_CMD=""
GO_PATHS=(
    "go"
    "/usr/local/btgo/bin/go"
    "/usr/local/go/bin/go"
    "/usr/bin/go"
    "$HOME/go/bin/go"
    "/opt/go/bin/go"
)

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

if [ -z "$GO_CMD" ]; then
    GO_CMD=$(sudo -E which go 2>/dev/null || echo "")
    if [ -n "$GO_CMD" ]; then
        export PATH="$(dirname "$GO_CMD"):$PATH"
    fi
fi

if [ -z "$GO_CMD" ] || ! $GO_CMD version &> /dev/null 2>&1; then
    echo -e "${RED}❌ 错误: Go 未安装或无法访问${NC}"
    exit 1
fi

# 检查 PM2
PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
    PM2_CMD="pm2"
elif [ -f "/usr/local/bin/pm2" ]; then
    PM2_CMD="/usr/local/bin/pm2"
elif [ -f "$HOME/.npm-global/bin/pm2" ]; then
    PM2_CMD="$HOME/.npm-global/bin/pm2"
else
    NPM_PREFIX=$(npm config get prefix 2>/dev/null)
    if [ -n "$NPM_PREFIX" ] && [ -f "$NPM_PREFIX/bin/pm2" ]; then
        PM2_CMD="$NPM_PREFIX/bin/pm2"
    fi
fi

if [ -z "$PM2_CMD" ]; then
    echo -e "${YELLOW}⚠️  PM2 未找到，将使用 npx${NC}"
    PM2_CMD="npx --yes pm2@latest"
else
    echo -e "${GREEN}✅ PM2: $($PM2_CMD -v)${NC}"
fi

echo ""

# Step 3: 重新构建后端
echo -e "${BLUE}Step 3: 重新构建后端${NC}"
echo "============================================================"

cd "$BACKEND_DIR"

echo -e "${YELLOW}🔄 更新 Go 依赖...${NC}"
GOPROXY=https://goproxy.cn,direct $GO_CMD mod tidy

echo -e "${YELLOW}🔨 编译后端...${NC}"
$GO_CMD build -o agentdemo main.go

if [ -f "agentdemo" ]; then
    echo -e "${GREEN}✅ 后端编译成功${NC}"
else
    echo -e "${RED}❌ 后端编译失败${NC}"
    exit 1
fi

echo ""

# Step 4: 重新构建前端
echo -e "${BLUE}Step 4: 重新构建前端${NC}"
echo "============================================================"

cd "$FRONTEND_DIR"

echo -e "${YELLOW}📦 更新前端依赖...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 构建前端生产版本...${NC}"
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ 前端构建成功${NC}"
else
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi

echo ""

# Step 5: 重启 PM2 服务
echo -e "${BLUE}Step 5: 重启 PM2 服务${NC}"
echo "============================================================"

# 检查服务是否存在
BACKEND_EXISTS=$($PM2_CMD list 2>/dev/null | grep -q "agentdemo-backend" && echo "yes" || echo "no")

# 重启后端
if [ "$BACKEND_EXISTS" = "yes" ]; then
    echo -e "${YELLOW}🔄 重启后端服务...${NC}"
    $PM2_CMD restart agentdemo-backend
    echo -e "${GREEN}✅ 后端服务已重启${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务不存在，启动新服务...${NC}"
    cd "$BACKEND_DIR"
    
    # 确保启动脚本存在
    if [ ! -f "start-backend.sh" ]; then
        cat > "$BACKEND_DIR/start-backend.sh" << 'EOFSH'
#!/bin/bash
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi
exec ./agentdemo
EOFSH
        chmod +x "$BACKEND_DIR/start-backend.sh"
    fi
    
    $PM2_CMD start start-backend.sh \
        --name agentdemo-backend \
        --time \
        --log "$PROJECT_ROOT/logs/backend.log" \
        --error "$PROJECT_ROOT/logs/backend-error.log"
    echo -e "${GREEN}✅ 后端服务已启动${NC}"
fi

# 保存 PM2 配置
$PM2_CMD save 2>/dev/null || true

echo ""

# Step 6: 验证更新
echo -e "${BLUE}Step 6: 验证更新${NC}"
echo "============================================================"

sleep 3

echo -e "${YELLOW}📊 服务状态:${NC}"
$PM2_CMD list

echo ""

# 读取端口配置
PORT=$(grep "^PORT=" "$PROJECT_ROOT/.env" 2>/dev/null | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" || echo "3031")
PORT=${PORT:-3031}

# 测试后端
echo -e "${YELLOW}🔍 测试后端服务...${NC}"
if curl -s http://localhost:$PORT/api/sessions > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常 (端口 $PORT)${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务无响应，请检查日志${NC}"
fi

echo ""
echo "============================================================"
echo -e "${GREEN}✅ 更新完成!${NC}"
echo "============================================================"
echo ""
echo "📋 服务信息:"
echo "  - 后端: http://localhost:3031"
echo "  - 前端静态文件: $FRONTEND_DIR/dist"
echo ""
echo "📊 管理命令:"
echo "  - 查看状态: $PM2_CMD status"
echo "  - 查看日志: $PM2_CMD logs"
echo "  - 重启服务: $PM2_CMD restart agentdemo-backend"
echo ""

