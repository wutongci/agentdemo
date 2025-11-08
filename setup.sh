#!/bin/bash

clear
echo "================================"
echo "🚀 AI 写作助手 - 快速配置"
echo "================================"
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    exit 1
fi

source .env

# 检查 API Key
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-test-key-please-replace" ]; then
    echo "⚠️  需要配置 yunwu.ai API Key"
    echo ""
    echo "获取步骤："
    echo "  1. 访问 https://yunwu.ai/register 注册"
    echo "  2. 访问 https://yunwu.ai/token 获取 Key"
    echo "  3. 编辑 .env 文件，更新 ANTHROPIC_API_KEY"
    echo ""
    read -p "您已配置了 API Key 吗？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "请先配置 API Key，然后重新运行此脚本"
        exit 1
    fi
    
    # 重新加载
    source .env
fi

echo "✅ API Key: ${ANTHROPIC_API_KEY:0:20}..."
echo ""

# 测试 API Key
echo "🔍 测试 API Key..."
TEST_RESULT=$(curl -s -w "%{http_code}" -o /tmp/api_test.json -X POST "https://yunwu.ai/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]}' \
  --max-time 10 2>&1)

HTTP_CODE=$(echo "$TEST_RESULT" | tail -c 4)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Key 有效！"
else
    echo "❌ API Key 测试失败 (HTTP $HTTP_CODE)"
    cat /tmp/api_test.json | python3 -m json.tool 2>/dev/null || cat /tmp/api_test.json
    echo ""
    echo "请检查："
    echo "  1. API Key 是否正确"
    echo "  2. 账户是否有余额"
    echo "  3. 网络连接是否正常"
    exit 1
fi

echo ""
echo "================================"
echo "🎯 启动服务"
echo "================================"
echo ""

# 清理旧进程
echo "🧹 清理旧进程..."
pkill -f "go run main.go" 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

# 启动后端
echo "🔧 启动后端..."
cd backend
go run main.go > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# 检查后端
if curl -s http://localhost:8080/ping > /dev/null 2>&1; then
    echo "   ✅ 后端启动成功 (PID: $BACKEND_PID)"
else
    echo "   ❌ 后端启动失败"
    tail -20 /tmp/backend.log
    exit 1
fi

# 启动前端
echo "📱 启动前端..."
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

echo "   ✅ 前端启动成功 (PID: $FRONTEND_PID)"

echo ""
echo "================================"
echo "✅ 启动完成！"
echo "================================"
echo ""
echo "📱 前端地址: http://localhost:5173"
echo "🔧 后端地址: http://localhost:8080"
echo ""
echo "📝 查看日志:"
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎉 现在可以打开浏览器访问前端了！"

