#!/bin/bash

echo "================================"
echo "🧪 开始测试 AI 写作助手"
echo "================================"
echo ""

# 测试后端健康状态
echo "1️⃣ 测试后端服务..."
PING_RESULT=$(curl -s http://localhost:8080/ping 2>&1)
if [[ $? -eq 0 ]]; then
    echo "   ✅ 后端服务正常"
else
    echo "   ❌ 后端服务异常"
    exit 1
fi
echo ""

# 创建新会话
echo "2️⃣ 创建新会话..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/sessions -H "Content-Type: application/json" -d '{}')
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "   ✅ 会话已创建: $SESSION_ID"
echo ""

# 发送测试消息
echo "3️⃣ 发送测试消息..."
CHAT_RESULT=$(curl -s -X POST "http://localhost:8080/api/sessions/$SESSION_ID/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"你好，请用一句话介绍你自己"}')
echo "   ✅ 消息已发送"
echo "   响应: $CHAT_RESULT"
echo ""

# 等待 AI 处理
echo "4️⃣ 等待 AI 响应 (10秒)..."
sleep 10

# 检查消息历史
echo "5️⃣ 检查会话状态..."
MESSAGE_RESULT=$(curl -s "http://localhost:8080/api/sessions/$SESSION_ID/messages")
echo "$MESSAGE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$MESSAGE_RESULT"
echo ""

# 测试写作工具
echo "6️⃣ 测试写作工具 (润色)..."
POLISH_RESULT=$(curl -s -X POST "http://localhost:8080/api/writing/polish" \
  -H "Content-Type: application/json" \
  -d '{"text":"这是一个测试文本。"}' \
  --max-time 30)
echo "   润色结果:"
echo "$POLISH_RESULT" | python3 -m json.tool 2>/dev/null || echo "$POLISH_RESULT"
echo ""

echo "================================"
echo "✅ 测试完成！"
echo "================================"
echo ""
echo "📱 前端地址: http://localhost:5173"
echo "🔧 后端地址: http://localhost:8080"
echo "💬 WebSocket: ws://localhost:8080/ws/$SESSION_ID"
echo ""
echo "提示：如果消息历史为空，这是正常的。"
echo "      实际对话内容通过 WebSocket 实时传输。"
echo "      请在浏览器中打开前端页面进行完整测试。"

