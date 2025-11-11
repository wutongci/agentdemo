package api

import (
	agentmgr "github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/api/handlers"
	"github.com/coso/agentdemo/backend/storage"
	"github.com/coso/agentdemo/backend/ws"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(
	router *gin.Engine,
	sessionStore *storage.SessionStore,
	agentManager *agentmgr.Manager,
	workflowOrchestrator *agentmgr.WorkflowOrchestrator,
) {
	// CORS 配置
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"}, // Vite 默认端口
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 创建处理器
	sessionHandler := handlers.NewSessionHandler(sessionStore)
	messageHandler := handlers.NewMessageHandler(sessionStore, agentManager)
	writingHandler := handlers.NewWritingHandler(agentManager)
	workflowHandler := handlers.NewWorkflowHandler(workflowOrchestrator)
	skillsHandler := handlers.NewSkillsHandler("./skills-package")
	middlewareHandler := handlers.NewMiddlewareHandler(agentManager)
	wsHandler := ws.NewHandler(sessionStore, agentManager)

	// API 路由组
	api := router.Group("/api")
	{
		// 会话管理
		sessions := api.Group("/sessions")
		{
			sessions.POST("", sessionHandler.CreateSession)
			sessions.GET("", sessionHandler.ListSessions)
			sessions.GET("/:id", sessionHandler.GetSession)
			sessions.DELETE("/:id", sessionHandler.DeleteSession)

			// 消息相关
			sessions.POST("/:id/chat", messageHandler.SendMessage)
			sessions.GET("/:id/messages", messageHandler.GetMessages)
		}

		// 写作工具
		writing := api.Group("/writing")
		{
			writing.POST("/polish", writingHandler.PolishText)
			writing.POST("/rewrite", writingHandler.RewriteText)
			writing.POST("/expand", writingHandler.ExpandText)
			writing.POST("/summarize", writingHandler.SummarizeText)
			writing.POST("/translate", writingHandler.TranslateText)
		}

		// 工作流协作（新功能）
		workflow := api.Group("/workflow")
		{
			workflow.POST("/start", workflowHandler.StartWorkflow)
			workflow.GET("/:id/status", workflowHandler.GetWorkflowStatus)
			workflow.GET("/:id/artifacts", workflowHandler.GetWorkflowArtifacts)
		}

		// Skills 管理
		skills := api.Group("/skills")
		{
			// Commands 路由
			skills.GET("/commands", skillsHandler.ListCommands)
			skills.GET("/commands/:name", skillsHandler.GetCommand)

			// Skills 路由
			skills.GET("/skills", skillsHandler.ListSkills)
			skills.GET("/skills/:name", skillsHandler.GetSkill)
		}

		// Middleware 管理（新功能 - Phase 6C）
		middleware := api.Group("/middleware")
		{
			middleware.GET("", middlewareHandler.GetAvailableMiddlewares)
			middleware.GET("/agent/:agentId", middlewareHandler.GetAgentMiddlewares)
			middleware.GET("/agent/:agentId/stats", middlewareHandler.GetMiddlewareStats)
			middleware.GET("/:name/tools", middlewareHandler.GetMiddlewareTools)
		}
	}

	// WebSocket 路由
	router.GET("/ws/:sessionId", wsHandler.HandleWebSocket)
	router.GET("/ping", wsHandler.PingHandler)
}
