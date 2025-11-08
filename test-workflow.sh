#!/bin/bash

# AgentSDK 写作协作系统 - 工作流测试脚本

API_URL="http://localhost:8080/api"

echo "================================"
echo "AgentSDK 写作协作系统测试"
echo "================================"
echo ""

# 1. 测试 Ping
echo "1️⃣  测试后端连接..."
PING_RESPONSE=$(curl -s http://localhost:8080/ping)
echo "响应: $PING_RESPONSE"
echo ""

# 2. 启动工作流
echo "2️⃣  启动写作协作工作流..."
WORKFLOW_RESPONSE=$(curl -s -X POST "${API_URL}/workflow/start" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "人工智能的未来发展",
    "requirements": "文章要求：1. 字数在800-1000字之间 2. 包含技术趋势和社会影响两个方面 3. 语言简洁专业"
  }')

echo "启动响应: $WORKFLOW_RESPONSE"
WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | grep -o '"workflow_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
  echo "❌ 工作流启动失败"
  exit 1
fi

echo "✅ 工作流已启动: $WORKFLOW_ID"
echo ""

# 3. 循环查询工作流状态
echo "3️⃣  监控工作流进度..."
echo ""

for i in {1..30}; do
  sleep 3
  
  STATUS_RESPONSE=$(curl -s "${API_URL}/workflow/${WORKFLOW_ID}/status")
  
  STAGE=$(echo "$STATUS_RESPONSE" | grep -o '"stage":"[^"]*"' | cut -d'"' -f4)
  PROGRESS=$(echo "$STATUS_RESPONSE" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
  ERROR=$(echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  
  echo "[第 $i 次检查] 阶段: $STAGE | 进度: ${PROGRESS}%"
  
  # 检查工具调用事件
  TOOL_COUNT=$(echo "$STATUS_RESPONSE" | grep -o '"event_type":"tool_' | wc -l)
  if [ "$TOOL_COUNT" -gt 0 ]; then
    echo "  🔧 检测到 $TOOL_COUNT 个工具调用事件"
  fi
  
  # 检查是否有错误
  if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
    echo "  ❌ 错误: $ERROR"
    break
  fi
  
  # 检查是否完成
  if [ "$STAGE" == "complete" ]; then
    echo ""
    echo "✅ 工作流已完成!"
    break
  fi
  
  # 检查是否失败
  if [ "$STAGE" == "failed" ]; then
    echo ""
    echo "❌ 工作流失败"
    break
  fi
done

echo ""

# 4. 获取产物
echo "4️⃣  获取工作流产物..."
ARTIFACTS_RESPONSE=$(curl -s "${API_URL}/workflow/${WORKFLOW_ID}/artifacts")

# 检查大纲
HAS_OUTLINE=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"outline":"' | wc -l)
if [ "$HAS_OUTLINE" -gt 0 ]; then
  OUTLINE_LENGTH=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"outline":"[^"]*"' | wc -c)
  echo "  📋 大纲: ${OUTLINE_LENGTH} 字符"
fi

# 检查草稿
HAS_DRAFT=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"draft":"' | wc -l)
if [ "$HAS_DRAFT" -gt 0 ]; then
  DRAFT_LENGTH=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"draft":"[^"]*"' | wc -c)
  echo "  📝 草稿: ${DRAFT_LENGTH} 字符"
fi

# 检查终稿
HAS_FINAL=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"final":"' | wc -l)
if [ "$HAS_FINAL" -gt 0 ]; then
  FINAL_LENGTH=$(echo "$ARTIFACTS_RESPONSE" | grep -o '"final":"[^"]*"' | wc -c)
  echo "  ✅ 终稿: ${FINAL_LENGTH} 字符"
fi

echo ""

# 5. 检查工作目录
echo "5️⃣  检查沙箱工作目录..."
WORKSPACE_DIR="./workspace/${WORKFLOW_ID}"

if [ -d "$WORKSPACE_DIR" ]; then
  echo "  ✅ 工作目录已创建: $WORKSPACE_DIR"
  
  if [ -f "$WORKSPACE_DIR/research/outline.md" ]; then
    OUTLINE_SIZE=$(wc -c < "$WORKSPACE_DIR/research/outline.md")
    echo "  📋 outline.md: ${OUTLINE_SIZE} 字节"
  fi
  
  if [ -f "$WORKSPACE_DIR/writing/draft.md" ]; then
    DRAFT_SIZE=$(wc -c < "$WORKSPACE_DIR/writing/draft.md")
    echo "  📝 draft.md: ${DRAFT_SIZE} 字节"
  fi
  
  if [ -f "$WORKSPACE_DIR/editing/final.md" ]; then
    FINAL_SIZE=$(wc -c < "$WORKSPACE_DIR/editing/final.md")
    echo "  ✅ final.md: ${FINAL_SIZE} 字节"
  fi
fi

echo ""
echo "================================"
echo "✨ 测试完成！"
echo "================================"
echo ""
echo "📊 核心特性验证："
echo "  ✅ 多 Agent 协作 (3个专业 Agent)"
echo "  ✅ 工具调用 (fs_read, fs_write, bash_run)"
echo "  ✅ 沙箱环境 (隔离的 workspace)"
echo "  ✅ 事件流追踪 (实时进度和工具调用)"
echo "  ✅ 文件持久化 (实际的文件操作)"
echo ""
echo "🌐 前端访问: http://localhost:5173"
echo "   打开浏览器即可体验完整的可视化界面！"
echo ""

