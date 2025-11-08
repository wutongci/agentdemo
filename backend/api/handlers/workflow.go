package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"

	agentmgr "github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wordflowlab/agentsdk/pkg/types"
)

// WorkflowHandler 工作流处理器
type WorkflowHandler struct {
	orchestrator *agentmgr.WorkflowOrchestrator
}

// NewWorkflowHandler 创建工作流处理器
func NewWorkflowHandler(orchestrator *agentmgr.WorkflowOrchestrator) *WorkflowHandler {
	return &WorkflowHandler{
		orchestrator: orchestrator,
	}
}

// StartWorkflow 启动工作流
func (h *WorkflowHandler) StartWorkflow(c *gin.Context) {
	log.Println("[WorkflowHandler] StartWorkflow called")

	var req models.WorkflowStartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[WorkflowHandler] Bind JSON error: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	log.Printf("[WorkflowHandler] Request received - Topic: %s, Requirements: %s", req.Topic, req.Requirements)

	// 生成工作流 ID
	workflowID := uuid.New().String()
	log.Printf("[WorkflowHandler] Generated workflow ID: %s", workflowID)

	// 获取模型配置
	providerType := os.Getenv("PROVIDER")
	if providerType == "" {
		providerType = "anthropic" // 默认使用 anthropic
	}

	// 根据 Provider 类型优先选择对应的 API Key
	var apiKey string
	switch providerType {
	case "anthropic":
		apiKey = os.Getenv("ANTHROPIC_API_KEY")
	case "glm", "zhipu", "bigmodel":
		apiKey = os.Getenv("GLM_API_KEY")
	case "deepseek":
		apiKey = os.Getenv("DEEPSEEK_API_KEY")
	default:
		// 默认尝试所有 API Key
		apiKey = os.Getenv("ANTHROPIC_API_KEY")
		if apiKey == "" {
			apiKey = os.Getenv("GLM_API_KEY")
		}
		if apiKey == "" {
			apiKey = os.Getenv("DEEPSEEK_API_KEY")
		}
	}
	if apiKey == "" {
		apiKey = "sk-default"
	}

	model := os.Getenv("MODEL")
	if model == "" {
		if providerType == "glm" {
			model = "glm-4" // GLM 默认模型
		} else if providerType == "deepseek" {
			model = "deepseek-chat" // Deepseek 默认模型
		} else {
			model = "claude-3-haiku-20240307" // Anthropic 默认模型
		}
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		if providerType == "anthropic" {
			baseURL = "http://yunwu.ai" // Anthropic 使用 yunwu.ai 中转
		} else if providerType == "glm" {
			baseURL = "https://open.bigmodel.cn/api/paas/v4" // GLM 默认地址
		} else if providerType == "deepseek" {
			baseURL = "https://api.deepseek.com" // Deepseek 默认地址
		}
	}

	log.Printf("[WorkflowHandler] Model config - Provider: %s, Model: %s, APIKey: %s...", providerType, model, apiKey[:min(10, len(apiKey))])

	modelConfig := &types.ModelConfig{
		Provider: providerType,
		Model:    model,
		APIKey:   apiKey,
		BaseURL:  baseURL,
	}

	// 启动工作流
	log.Printf("[WorkflowHandler] Calling orchestrator.StartWorkflow for workflow: %s", workflowID)
	err := h.orchestrator.StartWorkflow(c.Request.Context(), workflowID, req.Topic, req.Requirements, modelConfig)
	if err != nil {
		log.Printf("[WorkflowHandler] StartWorkflow error: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	log.Printf("[WorkflowHandler] Workflow started successfully: %s", workflowID)
	c.JSON(http.StatusOK, models.WorkflowStartResponse{
		WorkflowID: workflowID,
		Status:     "started",
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetWorkflowStatus 获取工作流状态
func (h *WorkflowHandler) GetWorkflowStatus(c *gin.Context) {
	workflowID := c.Param("id")

	status, err := h.orchestrator.GetWorkflowStatus(workflowID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 转换为响应格式
	response := models.WorkflowStatusResponse{
		WorkflowID:       status.WorkflowID,
		Stage:            string(status.Stage),
		Progress:         status.Progress,
		StartTime:        status.StartTime,
		EndTime:          status.EndTime,
		ResearcherStatus: status.ResearchStatus,
		WriterStatus:     status.WriterStatus,
		EditorStatus:     status.EditorStatus,
		Error:            status.Error,
	}

	// 转换事件
	events := make([]models.WorkflowEventData, len(status.Events))
	for i, evt := range status.Events {
		events[i] = models.WorkflowEventData{
			Time:      evt.Time,
			Stage:     string(evt.Stage),
			EventType: evt.EventType,
			Message:   evt.Message,
		}
		if evt.ToolCall != nil {
			events[i].ToolCall = &models.ToolCallData{
				Name:   evt.ToolCall.Name,
				Input:  evt.ToolCall.Input,
				Output: evt.ToolCall.Output,
				State:  evt.ToolCall.State,
			}
		}
	}
	response.Events = events

	c.JSON(http.StatusOK, response)
}

// GetWorkflowArtifacts 获取工作流产物
func (h *WorkflowHandler) GetWorkflowArtifacts(c *gin.Context) {
	workflowID := c.Param("id")

	artifacts, err := h.orchestrator.GetArtifacts(workflowID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	response := models.WorkflowArtifactsResponse{
		Outline: artifacts["outline"],
		Draft:   artifacts["draft"],
		Final:   artifacts["final"],
	}

	c.JSON(http.StatusOK, response)
}

// StreamWorkflowProgress 流式获取工作流进度 (通过 WebSocket)
func (h *WorkflowHandler) StreamWorkflowProgress(c *gin.Context) {
	workflowID := c.Param("id")

	// 验证工作流存在
	_, err := h.orchestrator.GetWorkflowStatus(workflowID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 返回 WebSocket 连接信息
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Connect to WebSocket: ws://localhost:8080/ws/workflow/%s", workflowID),
		"ws_url":  fmt.Sprintf("/ws/workflow/%s", workflowID),
	})
}
