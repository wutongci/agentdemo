package main

import (
	"log"
	"os"

	"github.com/coso/agentdemo/backend/agent"
	"github.com/coso/agentdemo/backend/api"
	"github.com/coso/agentdemo/backend/storage"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env 文件（如果存在）
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// 提示：使用 yunwu.ai 中转，可以不设置 API Key
	if os.Getenv("ANTHROPIC_API_KEY") == "" {
		log.Println("Warning: ANTHROPIC_API_KEY not set, using yunwu.ai with default key")
	} else {
		log.Printf("Using API Key: %s...", os.Getenv("ANTHROPIC_API_KEY")[:15])
	}

	// 显示模型配置
	model := os.Getenv("MODEL")
	if model == "" {
		model = "claude-3-haiku-20240307 (default)"
	}
	log.Printf("Using Model: %s", model)

	// 创建会话存储
	sessionStore, err := storage.NewSessionStore()
	if err != nil {
		log.Fatalf("Failed to create session store: %v", err)
	}

	// 创建 Agent 管理器（用于简单对话）
	agentManager, err := agent.NewManager()
	if err != nil {
		log.Fatalf("Failed to create agent manager: %v", err)
	}
	defer agentManager.Close()

	// 创建 Pool 管理器（用于工作流协作）
	poolManager, err := agent.NewPoolManager(agentManager.GetDependencies())
	if err != nil {
		log.Fatalf("Failed to create pool manager: %v", err)
	}
	defer poolManager.Shutdown()

	// 创建工作流编排器
	workflowOrchestrator := agent.NewWorkflowOrchestrator(poolManager)

	// 创建 Gin 路由
	router := gin.Default()

	// 设置路由
	api.SetupRoutes(router, sessionStore, agentManager, workflowOrchestrator)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
