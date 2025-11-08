package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	agentmgr "github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/models"
	"github.com/coso/agentdemo/backend/storage"
	"github.com/gin-gonic/gin"
)

// MessageHandler 消息处理器
type MessageHandler struct {
	sessionStore *storage.SessionStore
	agentManager *agentmgr.Manager
}

// NewMessageHandler 创建消息处理器
func NewMessageHandler(sessionStore *storage.SessionStore, agentManager *agentmgr.Manager) *MessageHandler {
	return &MessageHandler{
		sessionStore: sessionStore,
		agentManager: agentManager,
	}
}

// SendMessage 发送消息
func (h *MessageHandler) SendMessage(c *gin.Context) {
	sessionID := c.Param("id")
	log.Printf("[SendMessage] Received request for session: %s", sessionID)

	var req models.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[SendMessage] ERROR: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}
	log.Printf("[SendMessage] Message content: %q (length: %d)", req.Message, len(req.Message))

	// 获取会话
	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		log.Printf("[SendMessage] ERROR: Session not found: %s, error: %v", sessionID, err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}
	log.Printf("[SendMessage] Session found: ID=%s, AgentID=%s, Title=%s, AgentType=%s", session.ID, session.AgentID, session.Title, session.AgentType)

	// 获取或创建 Agent（使用 Session 的 AgentType）
	log.Printf("[SendMessage] Getting or creating agent: AgentID=%s, Template=%s", session.AgentID, session.AgentType)
	ag, err := h.agentManager.GetOrCreateAgent(context.Background(), session.AgentID, session.AgentType)
	if err != nil {
		log.Printf("[SendMessage] ERROR: Failed to get/create agent: AgentID=%s, Template=%s, error: %v", session.AgentID, session.AgentType, err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}
	log.Printf("[SendMessage] Agent ready: %s (template: %s)", session.AgentID, session.AgentType)

	// 发送消息（异步）
	log.Printf("[SendMessage] Sending message to agent: %q", req.Message)
	if err := ag.Send(context.Background(), req.Message); err != nil {
		log.Printf("[SendMessage] ERROR: Failed to send message to agent: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}
	log.Printf("[SendMessage] Message sent successfully to agent %s", session.AgentID)

	// 更新会话时间
	session.UpdatedAt = time.Now()
	h.sessionStore.Update(session)

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"status":     "processing",
		"message":    "Message sent, connect to WebSocket for real-time updates",
	})
	log.Printf("[SendMessage] Request completed successfully for session %s", sessionID)
}

// 用于 JSON 反序列化的简化结构
type jsonMessage struct {
	Role    string                   `json:"role"`
	Content []map[string]interface{} `json:"content"`
}

// extractTextFromJSON 从 JSON content 数组中提取文本
func extractTextFromJSON(content []map[string]interface{}) string {
	if len(content) == 0 {
		return ""
	}

	var textParts []string
	for _, block := range content {
		// 检查是否有 text 字段（TextBlock）
		if text, ok := block["text"].(string); ok {
			textParts = append(textParts, text)
			continue
		}

		// 检查是否有 name 字段（ToolUseBlock）
		if name, ok := block["name"].(string); ok {
			textParts = append(textParts, fmt.Sprintf("[使用工具: %s]", name))
			continue
		}

		// 检查是否有 tool_use_id 字段（ToolResultBlock）
		if _, ok := block["tool_use_id"].(string); ok {
			if result, hasResult := block["content"].(string); hasResult {
				textParts = append(textParts, fmt.Sprintf("[工具结果: %s]", result))
			} else {
				textParts = append(textParts, "[工具结果]")
			}
			continue
		}

		log.Printf("[extractTextFromJSON] Unknown block format: %v", block)
	}

	return strings.Join(textParts, "\n")
}

// loadMessagesFromJSON 直接从 JSON 文件加载消息
func loadMessagesFromJSON(agentID string) ([]models.Message, error) {
	// 构建 JSON 文件路径
	messagesPath := filepath.Join(".agentsdk", agentID, "messages.json")

	// 检查文件是否存在
	if _, err := os.Stat(messagesPath); os.IsNotExist(err) {
		log.Printf("[loadMessagesFromJSON] Messages file not found: %s", messagesPath)
		return []models.Message{}, nil // 返回空数组，不是错误
	}

	// 读取文件
	data, err := os.ReadFile(messagesPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read messages file: %w", err)
	}

	// 解析 JSON
	var jsonMessages []jsonMessage
	if err := json.Unmarshal(data, &jsonMessages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal messages: %w", err)
	}

	// 转换为 API 消息格式
	messages := make([]models.Message, 0, len(jsonMessages))
	for i, msg := range jsonMessages {
		content := extractTextFromJSON(msg.Content)
		apiMessage := models.Message{
			Role:      msg.Role,
			Content:   content,
			Timestamp: time.Now(),
		}
		messages = append(messages, apiMessage)
		log.Printf("[loadMessagesFromJSON] Message %d: role=%s, content_length=%d, blocks=%d",
			i, msg.Role, len(content), len(msg.Content))
	}

	return messages, nil
}

// GetMessages 获取消息历史
func (h *MessageHandler) GetMessages(c *gin.Context) {
	sessionID := c.Param("id")
	log.Printf("[GetMessages] Loading messages for session: %s", sessionID)

	// 获取会话
	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		log.Printf("[GetMessages] ERROR: Session not found: %s, error: %v", sessionID, err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 获取 Agent
	ag, ok := h.agentManager.GetAgent(session.AgentID)
	if !ok {
		// Agent 不存在，尝试创建以加载历史消息（使用 Session 的 AgentType）
		log.Printf("[GetMessages] Agent not found, creating: AgentID=%s, Template=%s", session.AgentID, session.AgentType)
		ag, err = h.agentManager.GetOrCreateAgent(context.Background(), session.AgentID, session.AgentType)
		if err != nil {
			log.Printf("[GetMessages] ERROR: Failed to create agent: %v", err)
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
			return
		}
	}

	// 获取 Agent 状态
	status := ag.Status()

	// 直接从 JSON 文件加载消息（绕过 SDK 的反序列化问题）
	agentID := ag.ID()
	messages, err := loadMessagesFromJSON(agentID)
	if err != nil {
		log.Printf("[GetMessages] ERROR: Failed to load messages from JSON: %v", err)
		// 返回空数组而不是错误，避免前端清空消息
		messages = []models.Message{}
	}

	log.Printf("[GetMessages] Returning %d messages for session %s", len(messages), sessionID)
	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"messages":   messages,
		"status":     status,
	})
}

