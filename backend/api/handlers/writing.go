package handlers

import (
	"context"
	"net/http"

	agentmgr "github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/models"
	"github.com/gin-gonic/gin"
)

// WritingHandler 写作工具处理器
type WritingHandler struct {
	agentManager *agentmgr.Manager
}

// NewWritingHandler 创建写作工具处理器
func NewWritingHandler(agentManager *agentmgr.Manager) *WritingHandler {
	return &WritingHandler{
		agentManager: agentManager,
	}
}

// PolishText 润色文本
func (h *WritingHandler) PolishText(c *gin.Context) {
	var req models.WritingToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.processText(c.Request.Context(), "text-polisher", req.Text, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.WritingToolResponse{
		OriginalText:  req.Text,
		ProcessedText: result,
		Action:        "polish",
	})
}

// RewriteText 改写文本
func (h *WritingHandler) RewriteText(c *gin.Context) {
	var req models.WritingToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 构建提示词
	prompt := req.Text
	if req.Style != "" {
		prompt = "请将以下文本改写为" + req.Style + "风格：\n\n" + req.Text
	}

	result, err := h.processText(c.Request.Context(), "text-rewriter", prompt, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.WritingToolResponse{
		OriginalText:  req.Text,
		ProcessedText: result,
		Action:        "rewrite",
	})
}

// ExpandText 扩写文本
func (h *WritingHandler) ExpandText(c *gin.Context) {
	var req models.WritingToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.processText(c.Request.Context(), "text-expander", req.Text, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.WritingToolResponse{
		OriginalText:  req.Text,
		ProcessedText: result,
		Action:        "expand",
	})
}

// SummarizeText 总结文本
func (h *WritingHandler) SummarizeText(c *gin.Context) {
	var req models.WritingToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.processText(c.Request.Context(), "text-summarizer", req.Text, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.WritingToolResponse{
		OriginalText:  req.Text,
		ProcessedText: result,
		Action:        "summarize",
	})
}

// TranslateText 翻译文本
func (h *WritingHandler) TranslateText(c *gin.Context) {
	var req models.WritingToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// 默认翻译为英文
	language := req.Language
	if language == "" {
		language = "英文"
	}

	result, err := h.processText(c.Request.Context(), "text-translator", req.Text, language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.WritingToolResponse{
		OriginalText:  req.Text,
		ProcessedText: result,
		Action:        "translate",
	})
}

// processText 处理文本（通用方法）
func (h *WritingHandler) processText(ctx context.Context, templateID string, text string, extraParam string) (string, error) {
	// 创建临时 Agent
	ag, err := h.agentManager.CreateTemporaryAgent(ctx, templateID)
	if err != nil {
		return "", err
	}
	defer ag.Close()

	// 发送消息并等待结果
	result, err := ag.Chat(ctx, text)
	if err != nil {
		return "", err
	}

	return result.Text, nil
}

