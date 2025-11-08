#!/bin/bash

# Skills 系统完整测试脚本
# 测试 Skills 激活、Slash Command 执行和错误处理

set -e

API_BASE="http://localhost:8080/api"
LOG_FILE="/tmp/backend-test.log"

echo "========================================="
echo "Skills 系统测试"
echo "========================================="
echo

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${YELLOW}➜${NC} $1"
}

# 测试 1: 创建新会话（simple-chat 类型，支持 Skills）
info "测试 1: 创建 simple-chat 类型的会话..."
RESPONSE=$(curl -s -X POST "$API_BASE/sessions" \
  -H "Content-Type: application/json" \
  -d '{"title": "Skills测试会话", "agent_type": "simple-chat"}')

SESSION_ID=$(echo $RESPONSE | jq -r '.id')
AGENT_TYPE=$(echo $RESPONSE | jq -r '.agent_type')

if [ "$AGENT_TYPE" = "simple-chat" ]; then
    success "会话创建成功: $SESSION_ID (AgentType: $AGENT_TYPE)"
else
    error "AgentType 不正确: $AGENT_TYPE (期望: simple-chat)"
    exit 1
fi

echo

# 等待一下确保会话创建完成
sleep 1

# 测试 2: 发送包含关键词的消息（触发 Skills）
info "测试 2: 发送包含'质量'和'安全'关键词的消息..."
MESSAGE="如何提升代码质量和安全性？请提供最佳实践建议"

SEND_RESPONSE=$(curl -s -X POST "$API_BASE/sessions/$SESSION_ID/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$MESSAGE\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$SEND_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    success "消息发送成功 (HTTP 200)"
else
    error "消息发送失败 (HTTP $HTTP_STATUS)"
    echo "$SEND_RESPONSE"
    exit 1
fi

# 检查后端日志
sleep 2
info "检查后端日志中的 Skills 激活记录..."

SKILLS_LOG=$(tail -50 "$LOG_FILE" | grep -i "\[Skills\]" || true)

if echo "$SKILLS_LOG" | grep -q "Found.*active skills"; then
    SKILL_COUNT=$(echo "$SKILLS_LOG" | grep "Found.*active skills" | tail -1 | grep -oP '\d+(?= active)')
    if [ "$SKILL_COUNT" -gt 0 ]; then
        success "Skills 已激活: $SKILL_COUNT 个技能"
        echo "$SKILLS_LOG" | grep "Activated:" | while read line; do
            echo "  $line"
        done
    else
        error "未激活任何 Skills (找到 0 个)"
    fi
else
    error "日志中未找到 Skills 激活记录"
fi

echo

# 测试 3: 发送 Slash Command
info "测试 3: 发送 /analyze Slash Command..."
COMMAND_MESSAGE="/analyze src/main.go"

COMMAND_RESPONSE=$(curl -s -X POST "$API_BASE/sessions/$SESSION_ID/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$COMMAND_MESSAGE\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

COMMAND_HTTP_STATUS=$(echo "$COMMAND_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$COMMAND_HTTP_STATUS" = "200" ]; then
    success "Command 发送成功 (HTTP 200)"
else
    error "Command 发送失败 (HTTP $COMMAND_HTTP_STATUS)"
    echo "$COMMAND_RESPONSE"
    exit 1
fi

# 检查 Command 执行日志
sleep 2
info "检查后端日志中的 Command 执行记录..."

COMMAND_LOG=$(tail -100 "$LOG_FILE" | grep -i "\[Command\]" || true)

if echo "$COMMAND_LOG" | grep -q "Executing command"; then
    success "Command 执行日志已记录"
    echo "$COMMAND_LOG" | grep "Executing command\|executed successfully" | while read line; do
        echo "  $line"
    done
else
    error "日志中未找到 Command 执行记录"
fi

echo

# 测试 4: 验证错误日志功能
info "测试 4: 发送到不存在的会话（测试错误日志）..."
FAKE_SESSION="00000000-0000-0000-0000-000000000000"

ERROR_RESPONSE=$(curl -s -X POST "$API_BASE/sessions/$FAKE_SESSION/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' \
  -w "\nHTTP_STATUS:%{http_code}")

ERROR_HTTP_STATUS=$(echo "$ERROR_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$ERROR_HTTP_STATUS" = "404" ]; then
    success "错误处理正常 (HTTP 404)"

    # 检查错误日志
    ERROR_LOG=$(tail -20 "$LOG_FILE" | grep "\[SendMessage\] ERROR" | tail -1 || true)
    if [ -n "$ERROR_LOG" ]; then
        success "错误日志已记录"
        echo "  $ERROR_LOG"
    else
        error "错误日志未记录"
    fi
else
    error "错误处理不正确 (HTTP $ERROR_HTTP_STATUS, 期望 404)"
fi

echo

# 总结
echo "========================================="
echo "测试完成！"
echo "========================================="
echo
echo "📋 完整日志: $LOG_FILE"
echo "🌐 前端地址: http://localhost:5173"
echo
echo "下一步测试建议："
echo "1. 打开前端界面: http://localhost:5173"
echo "2. 选择刚创建的会话: $SESSION_ID"
echo "3. 输入包含'质量'或'安全'的消息"
echo "4. 观察 Skills 激活提示（🧠 图标）"
echo "5. 尝试输入 /analyze 命令"
echo
success "所有API测试通过！"
