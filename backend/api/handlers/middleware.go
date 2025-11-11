package handlers

import (
	"net/http"

	"github.com/coso/agentdemo/backend/agent"
	"github.com/gin-gonic/gin"
)

// MiddlewareHandler Middleware 相关的处理器
type MiddlewareHandler struct {
	agentManager *agent.Manager
}

// NewMiddlewareHandler 创建 Middleware 处理器
func NewMiddlewareHandler(agentManager *agent.Manager) *MiddlewareHandler {
	return &MiddlewareHandler{
		agentManager: agentManager,
	}
}

// MiddlewareInfo Middleware 信息
type MiddlewareInfo struct {
	Name        string   `json:"name"`
	Priority    int      `json:"priority"`
	Description string   `json:"description"`
	Tools       []string `json:"tools"`
	Status      string   `json:"status"` // "active", "inactive"
}

// GetAvailableMiddlewares 获取所有可用的 Middleware
func (h *MiddlewareHandler) GetAvailableMiddlewares(c *gin.Context) {
	// 返回所有已知的 Middleware
	middlewares := []MiddlewareInfo{
		{
			Name:        "summarization",
			Priority:    40,
			Description: "自动总结长对话历史（超过 170k tokens 时触发）",
			Tools:       []string{}, // 纯处理型 Middleware，无工具
			Status:      "active",   // 默认启用
		},
		{
			Name:        "filesystem",
			Priority:    100,
			Description: "提供文件系统操作工具，支持自动大结果驱逐",
			Tools: []string{
				"fs_read",
				"fs_write",
				"fs_ls",
				"fs_edit",
				"fs_glob",
				"fs_grep",
			},
			Status: "inactive", // 目前未启用
		},
		{
			Name:        "subagent",
			Priority:    200,
			Description: "支持任务委托给子代理执行",
			Tools: []string{
				"task",
			},
			Status: "inactive", // 目前未启用
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"middlewares": middlewares,
		"total":       len(middlewares),
	})
}

// GetAgentMiddlewares 获取特定 Agent 的 Middleware 配置
func (h *MiddlewareHandler) GetAgentMiddlewares(c *gin.Context) {
	agentID := c.Param("agentId")

	// 获取 Agent
	ag, exists := h.agentManager.GetAgent(agentID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Agent not found",
		})
		return
	}

	// 获取 Agent 的 Middleware 信息
	// 注意：这里我们返回当前启用的 Middleware
	// 实际的 Middleware 状态由 Agent 内部维护
	enabledMiddlewares := []string{"summarization"}

	c.JSON(http.StatusOK, gin.H{
		"agent_id":    ag.ID(),
		"middlewares": enabledMiddlewares,
	})
}

// MiddlewareStatsResponse Middleware 统计信息响应
type MiddlewareStatsResponse struct {
	MiddlewareName string                 `json:"middleware_name"`
	CallCount      int64                  `json:"call_count"`
	TotalDuration  int64                  `json:"total_duration_ms"`
	AvgDuration    int64                  `json:"avg_duration_ms"`
	LastCalled     string                 `json:"last_called"`
	Details        map[string]interface{} `json:"details"`
}

// GetMiddlewareStats 获取 Middleware 统计信息
func (h *MiddlewareHandler) GetMiddlewareStats(c *gin.Context) {
	agentID := c.Param("agentId")

	// 获取 Agent
	_, exists := h.agentManager.GetAgent(agentID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Agent not found",
		})
		return
	}

	// TODO: 实际实现需要在 Agent 内部维护统计信息
	// 这里返回示例数据
	stats := []MiddlewareStatsResponse{
		{
			MiddlewareName: "summarization",
			CallCount:      0,
			TotalDuration:  0,
			AvgDuration:    0,
			LastCalled:     "",
			Details: map[string]interface{}{
				"summarization_count": 0,
				"tokens_saved":        0,
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"agent_id": agentID,
		"stats":    stats,
	})
}

// GetMiddlewareTools 获取 Middleware 提供的工具列表
func (h *MiddlewareHandler) GetMiddlewareTools(c *gin.Context) {
	middlewareName := c.Param("name")

	var tools []ToolInfo

	switch middlewareName {
	case "filesystem":
		tools = []ToolInfo{
			{
				Name:        "fs_read",
				Description: "读取文件内容，支持分页读取",
				Category:    "filesystem",
			},
			{
				Name:        "fs_write",
				Description: "写入文件内容（覆盖模式）",
				Category:    "filesystem",
			},
			{
				Name:        "fs_ls",
				Description: "列出目录内容，显示文件大小和修改时间",
				Category:    "filesystem",
			},
			{
				Name:        "fs_edit",
				Description: "精确编辑文件（字符串替换）",
				Category:    "filesystem",
			},
			{
				Name:        "fs_glob",
				Description: "使用 Glob 模式匹配文件（如 **/*.go）",
				Category:    "filesystem",
			},
			{
				Name:        "fs_grep",
				Description: "正则表达式搜索文件内容",
				Category:    "filesystem",
			},
		}
	case "subagent":
		tools = []ToolInfo{
			{
				Name:        "task",
				Description: "将任务委托给子代理执行",
				Category:    "subagent",
			},
		}
	case "summarization":
		// 纯处理型 Middleware，无工具
		tools = []ToolInfo{}
	default:
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Middleware not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"middleware": middlewareName,
		"tools":      tools,
		"total":      len(tools),
	})
}

// ToolInfo 工具信息
type ToolInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
}
