#!/bin/bash

echo "🔑 测试 yunwu.ai API Key"
echo "================================"
echo ""

# 从 .env 读取 API Key
if [ -f ".env" ]; then
    source .env
fi

if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-test-key-please-replace" ]; then
    echo "❌ 请先在 .env 文件中配置有效的 ANTHROPIC_API_KEY"
    echo ""
    echo "获取步骤："
    echo "1. 访问 https://yunwu.ai/register 注册账号"
    echo "2. 访问 https://yunwu.ai/token 获取 API Key"
    echo "3. 更新 .env 文件中的 ANTHROPIC_API_KEY"
    echo "4. 重启后端服务"
    exit 1
fi

echo "正在测试 API Key: ${ANTHROPIC_API_KEY:0:20}..."
echo ""

# 测试 API 调用
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://yunwu.ai/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "你好"}]
  }' \
  --max-time 10 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP 状态码: $HTTP_CODE"
echo ""
echo "响应内容:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Key 有效！可以正常使用"
    echo ""
    echo "下一步：重启后端服务"
    echo "  cd backend && go run main.go"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ API Key 无效或未授权"
elif [ "$HTTP_CODE" = "429" ]; then
    echo "⚠️  请求过于频繁或余额不足"
else
    echo "⚠️  API 调用失败"
fi

