#!/bin/bash
# 简单的 GLM API 测试

source .env 2>/dev/null || true

API_KEY="${GLM_API_KEY}"
MODEL="${MODEL:-glm-4}"

echo "Testing GLM API with model: $MODEL"
echo "API Key: ${API_KEY:0:20}..."

# 测试简单请求
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}],
    \"stream\": false,
    \"max_tokens\": 10
  }" 2>&1

echo ""
echo ""
echo "================================="
echo "If you see '余额不足', please recharge your account"
echo "================================="
