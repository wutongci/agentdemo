package agent

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/wordflowlab/agentsdk/pkg/agent"
	"github.com/wordflowlab/agentsdk/pkg/core"
	"github.com/wordflowlab/agentsdk/pkg/types"
)

// PoolManager 管理多个专业 Agent
type PoolManager struct {
	pool         *core.Pool
	deps         *agent.Dependencies
	mu           sync.RWMutex
	workflowDeps map[string]*WorkflowDependencies // workflowID -> deps
}

// WorkflowDependencies 工作流依赖的 Agent 信息
type WorkflowDependencies struct {
	ResearcherID string
	WriterID     string
	EditorID     string
	WorkDir      string
}

// NewPoolManager 创建 Pool 管理器
func NewPoolManager(deps *agent.Dependencies) (*PoolManager, error) {
	pool := core.NewPool(&core.PoolOptions{
		Dependencies: deps,
		MaxAgents:    50, // 最多管理 50 个 Agent
	})

	return &PoolManager{
		pool:         pool,
		deps:         deps,
		workflowDeps: make(map[string]*WorkflowDependencies),
	}, nil
}

// CreateWorkflowAgents 为工作流创建三个专业 Agent
func (pm *PoolManager) CreateWorkflowAgents(ctx context.Context, workflowID string, modelConfig *types.ModelConfig) (*WorkflowDependencies, error) {
	log.Printf("[PoolManager] CreateWorkflowAgents called for workflow: %s", workflowID)

	pm.mu.Lock()
	defer pm.mu.Unlock()

	// 检查是否已存在
	if deps, exists := pm.workflowDeps[workflowID]; exists {
		log.Printf("[PoolManager] Workflow agents already exist: %s", workflowID)
		return deps, nil
	}

	workDir := fmt.Sprintf("./workspace/%s", workflowID)
	log.Printf("[PoolManager] Work directory: %s", workDir)

	// 创建三个 Agent
	researcherID := fmt.Sprintf("%s-researcher", workflowID)
	writerID := fmt.Sprintf("%s-writer", workflowID)
	editorID := fmt.Sprintf("%s-editor", workflowID)

	log.Printf("[PoolManager] Creating researcher agent: %s", researcherID)
	log.Printf("[PoolManager] Researcher config: TemplateID=%s, Model=%s, Provider=%s",
		"researcher", modelConfig.Model, modelConfig.Provider)

	// 1. 创建研究员 Agent
	researcherConfig := &types.AgentConfig{
		AgentID:     researcherID,
		TemplateID:  "researcher",
		ModelConfig: modelConfig,
		Sandbox: &types.SandboxConfig{
			Kind:    types.SandboxKindLocal,
			WorkDir: workDir + "/research",
		},
	}

	log.Printf("[PoolManager] Calling pm.pool.Create for researcher...")
	_, err := pm.pool.Create(ctx, researcherConfig)
	if err != nil {
		log.Printf("[PoolManager] ❌ Failed to create researcher agent: %v", err)
		return nil, fmt.Errorf("create researcher: %w", err)
	}
	log.Printf("[PoolManager] ✅ Researcher Agent 创建成功: %s", researcherID)

	log.Printf("[PoolManager] Creating writer agent: %s", writerID)
	// 2. 创建作家 Agent
	writerConfig := &types.AgentConfig{
		AgentID:     writerID,
		TemplateID:  "writer",
		ModelConfig: modelConfig,
		Sandbox: &types.SandboxConfig{
			Kind:    types.SandboxKindLocal,
			WorkDir: workDir + "/writing",
		},
	}
	_, err = pm.pool.Create(ctx, writerConfig)
	if err != nil {
		log.Printf("[PoolManager] Failed to create writer agent: %v", err)
		return nil, fmt.Errorf("create writer: %w", err)
	}
	log.Printf("[PoolManager] ✓ Writer Agent 创建成功: %s", writerID)

	log.Printf("[PoolManager] Creating editor agent: %s", editorID)
	// 3. 创建编辑 Agent
	editorConfig := &types.AgentConfig{
		AgentID:     editorID,
		TemplateID:  "editor",
		ModelConfig: modelConfig,
		Sandbox: &types.SandboxConfig{
			Kind:    types.SandboxKindLocal,
			WorkDir: workDir + "/editing",
		},
	}
	_, err = pm.pool.Create(ctx, editorConfig)
	if err != nil {
		log.Printf("[PoolManager] Failed to create editor agent: %v", err)
		return nil, fmt.Errorf("create editor: %w", err)
	}
	log.Printf("[PoolManager] ✓ Editor Agent 创建成功: %s", editorID)

	deps := &WorkflowDependencies{
		ResearcherID: researcherID,
		WriterID:     writerID,
		EditorID:     editorID,
		WorkDir:      workDir,
	}

	pm.workflowDeps[workflowID] = deps
	log.Printf("[PoolManager] All agents created successfully for workflow: %s", workflowID)
	return deps, nil
}

// GetAgent 获取 Agent
func (pm *PoolManager) GetAgent(agentID string) (*agent.Agent, error) {
	ag, exists := pm.pool.Get(agentID)
	if !exists {
		return nil, fmt.Errorf("agent not found: %s", agentID)
	}
	return ag, nil
}

// GetWorkflowDeps 获取工作流依赖
func (pm *PoolManager) GetWorkflowDeps(workflowID string) (*WorkflowDependencies, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	deps, exists := pm.workflowDeps[workflowID]
	if !exists {
		return nil, fmt.Errorf("workflow not found: %s", workflowID)
	}
	return deps, nil
}

// GetAgentStatus 获取 Agent 状态
func (pm *PoolManager) GetAgentStatus(agentID string) (*types.AgentStatus, error) {
	return pm.pool.Status(agentID)
}

// RemoveWorkflowAgents 清理工作流的 Agent
func (pm *PoolManager) RemoveWorkflowAgents(workflowID string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	deps, exists := pm.workflowDeps[workflowID]
	if !exists {
		return nil
	}

	// 移除三个 Agent
	pm.pool.Remove(deps.ResearcherID)
	pm.pool.Remove(deps.WriterID)
	pm.pool.Remove(deps.EditorID)

	delete(pm.workflowDeps, workflowID)
	log.Printf("✓ Workflow %s 的 Agents 已清理", workflowID)
	return nil
}

// Shutdown 关闭 Pool
func (pm *PoolManager) Shutdown() {
	pm.pool.Shutdown()
}

// ListAllAgents 列出所有 Agent
func (pm *PoolManager) ListAllAgents() []string {
	return pm.pool.List("")
}

// GetPoolSize 获取池大小
func (pm *PoolManager) GetPoolSize() int {
	return pm.pool.Size()
}
