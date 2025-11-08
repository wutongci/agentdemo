package handlers

import (
	"net/http"

	"github.com/coso/agentdemo/backend/models"
	"github.com/coso/agentdemo/backend/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SessionHandler 会话处理器
type SessionHandler struct {
	sessionStore *storage.SessionStore
}

// NewSessionHandler 创建会话处理器
func NewSessionHandler(sessionStore *storage.SessionStore) *SessionHandler {
	return &SessionHandler{
		sessionStore: sessionStore,
	}
}

// CreateSession 创建新会话
func (h *SessionHandler) CreateSession(c *gin.Context) {
	var req struct {
		Title string `json:"title"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 生成会话 ID 和 Agent ID
	sessionID := uuid.New().String()
	agentID := "agt:" + uuid.New().String()

	// 设置默认标题
	title := req.Title
	if title == "" {
		title = "新写作会话"
	}

	session := &models.Session{
		ID:      sessionID,
		Title:   title,
		AgentID: agentID,
	}

	if err := h.sessionStore.Create(session); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

// GetSession 获取会话详情
func (h *SessionHandler) GetSession(c *gin.Context) {
	sessionID := c.Param("id")

	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

// ListSessions 列出所有会话
func (h *SessionHandler) ListSessions(c *gin.Context) {
	sessions, err := h.sessionStore.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

// DeleteSession 删除会话
func (h *SessionHandler) DeleteSession(c *gin.Context) {
	sessionID := c.Param("id")

	if err := h.sessionStore.Delete(sessionID); err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session deleted"})
}

