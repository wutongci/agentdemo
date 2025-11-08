package ws

import (
	"context"
	"log"
	"net/http"
	"time"

	agentmgr "github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/models"
	"github.com/coso/agentdemo/backend/storage"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/wordflowlab/agentsdk/pkg/types"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源（开发环境）
	},
}

// Handler WebSocket 处理器
type Handler struct {
	sessionStore *storage.SessionStore
	agentManager *agentmgr.Manager
}

// NewHandler 创建 WebSocket 处理器
func NewHandler(sessionStore *storage.SessionStore, agentManager *agentmgr.Manager) *Handler {
	return &Handler{
		sessionStore: sessionStore,
		agentManager: agentManager,
	}
}

// HandleWebSocket 处理 WebSocket 连接
func (h *Handler) HandleWebSocket(c *gin.Context) {
	sessionID := c.Param("sessionId")

	// 获取会话
	session, err := h.sessionStore.Get(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "session not found"})
		return
	}

	// 升级为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}
	defer conn.Close()

	// 获取或创建 Agent
	ag, err := h.agentManager.GetOrCreateAgent(context.Background(), session.AgentID, "writing-assistant")
	if err != nil {
		log.Printf("Failed to get agent: %v", err)
		return
	}

	// 订阅 Agent 事件
	eventCh := ag.Subscribe([]types.AgentChannel{
		types.ChannelProgress,
		types.ChannelMonitor,
	}, nil)

	// 创建取消上下文
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动消息接收协程
	go func() {
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				cancel()
				return
			}
		}
	}()

	// 发送事件到客户端
	for {
		select {
		case <-ctx.Done():
			return

		case envelope, ok := <-eventCh:
			if !ok {
				return
			}

			msg := h.convertEventToWSMessage(envelope.Event)
			if msg != nil {
				if err := conn.WriteJSON(msg); err != nil {
					log.Printf("Failed to write message: %v", err)
					return
				}
			}
		}
	}
}

// convertEventToWSMessage 将 Agent 事件转换为 WebSocket 消息
func (h *Handler) convertEventToWSMessage(event interface{}) *models.WSMessage {
	switch e := event.(type) {
	case *types.ProgressTextChunkEvent:
		return &models.WSMessage{
			Type: "text_chunk",
			Data: models.TextChunkData{
				Delta: e.Delta,
			},
		}

	case *types.ProgressTextChunkStartEvent:
		return &models.WSMessage{
			Type: "text_start",
			Data: nil,
		}

	case *types.ProgressTextChunkEndEvent:
		return &models.WSMessage{
			Type: "text_end",
			Data: nil,
		}

	case *types.ProgressToolStartEvent:
		return &models.WSMessage{
			Type: "tool_start",
			Data: models.ToolEventData{
				Name: e.Call.Name,
			},
		}

	case *types.ProgressToolEndEvent:
		return &models.WSMessage{
			Type: "tool_end",
			Data: models.ToolEventData{
				Name:  e.Call.Name,
				State: string(e.Call.State),
			},
		}

	case *types.ProgressToolErrorEvent:
		return &models.WSMessage{
			Type: "tool_error",
			Data: models.ToolEventData{
				Name:  e.Call.Name,
				Error: e.Error,
			},
		}

	case *types.ProgressDoneEvent:
		return &models.WSMessage{
			Type: "done",
			Data: models.DoneData{
				Reason: e.Reason,
			},
		}

	case *types.MonitorErrorEvent:
		return &models.WSMessage{
			Type: "error",
			Data: gin.H{
				"severity": e.Severity,
				"phase":    e.Phase,
				"message":  e.Message,
			},
		}

	case *types.MonitorStateChangedEvent:
		return &models.WSMessage{
			Type: "state_changed",
			Data: gin.H{
				"state": e.State,
			},
		}

	case *types.MonitorTokenUsageEvent:
		return &models.WSMessage{
			Type: "token_usage",
			Data: gin.H{
				"input_tokens":  e.InputTokens,
				"output_tokens": e.OutputTokens,
				"total_tokens":  e.TotalTokens,
			},
		}

	default:
		return nil
	}
}

// PingHandler 心跳处理
func (h *Handler) PingHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
	})
}

