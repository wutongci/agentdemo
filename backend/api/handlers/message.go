package handlers

import (
	"context"
	"net/http"
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

	var req models.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 获取会话
	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 获取或创建 Agent
	ag, err := h.agentManager.GetOrCreateAgent(context.Background(), session.AgentID, "writing-assistant")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 发送消息（异步）
	if err := ag.Send(context.Background(), req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 更新会话时间
	session.UpdatedAt = time.Now()
	h.sessionStore.Update(session)

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"status":     "processing",
		"message":    "Message sent, connect to WebSocket for real-time updates",
	})
}

// GetMessages 获取消息历史
func (h *MessageHandler) GetMessages(c *gin.Context) {
	sessionID := c.Param("id")

	// 获取会话
	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 获取 Agent
	ag, ok := h.agentManager.GetAgent(session.AgentID)
	if !ok {
		// Agent 不存在，尝试创建以加载历史消息
		ag, err = h.agentManager.GetOrCreateAgent(context.Background(), session.AgentID, "writing-assistant")
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
			return
		}
	}

	// 获取 Agent 状态
	status := ag.Status()

	// 转换消息格式
	// TODO: 从 AgentSDK 的内部状态获取消息历史
	// 目前返回空列表，实际消息会通过 WebSocket 实时传输
	messages := make([]models.Message, 0)

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"messages":   messages,
		"status":     status,
	})
}

