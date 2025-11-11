package agent

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/wordflowlab/agentsdk/pkg/agent"
	"github.com/wordflowlab/agentsdk/pkg/provider"
	"github.com/wordflowlab/agentsdk/pkg/sandbox"
	"github.com/wordflowlab/agentsdk/pkg/store"
	"github.com/wordflowlab/agentsdk/pkg/tools"
	"github.com/wordflowlab/agentsdk/pkg/tools/builtin"
	"github.com/wordflowlab/agentsdk/pkg/types"
)

// Manager Agent 管理器
type Manager struct {
	mu               sync.RWMutex
	agents           map[string]*agent.Agent
	deps             *agent.Dependencies
	templateRegistry *agent.TemplateRegistry
}

// NewManager 创建 Agent 管理器
func NewManager() (*Manager, error) {
	// 检查 API Key (yunwu.ai 可以使用任意 key)
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		// yunwu.ai 允许无需 API Key，使用默认值
		apiKey = "sk-default"
	}

	// 获取模型配置，默认使用 claude-3-haiku (最便宜)
	model := os.Getenv("MODEL")
	if model == "" {
		model = "claude-3-haiku-20240307"
	}

	// 创建工具注册表
	toolRegistry := tools.NewRegistry()
	builtin.RegisterAll(toolRegistry)

	// 创建 Sandbox 工厂
	sandboxFactory := sandbox.NewFactory()

	// 创建 Provider 工厂（支持 Anthropic 和 GLM）
	providerFactory := &provider.MultiProviderFactory{}

	// 创建 Store
	jsonStore, err := store.NewJSONStore(".agentsdk")
	if err != nil {
		return nil, fmt.Errorf("create store: %w", err)
	}

	// 创建模板注册表
	templateRegistry := agent.NewTemplateRegistry()

	// 注册所有模板（包括新的协作模板）
	// RegisterAllTemplates 在 templates.go 中定义
	// 这里直接注册模板
	templateRegistry.Register(GetSimpleChatTemplate())      // 简单对话（支持 Skills 和 Commands）
	templateRegistry.Register(GetResearcherTemplate())
	templateRegistry.Register(GetWriterTemplate())
	templateRegistry.Register(GetEditorTemplate())
	templateRegistry.Register(GetWritingAssistantTemplate())
	templateRegistry.Register(GetPolishTemplate())
	templateRegistry.Register(GetRewriteTemplate())
	templateRegistry.Register(GetExpandTemplate())
	templateRegistry.Register(GetSummarizeTemplate())
	templateRegistry.Register(GetTranslateTemplate("英文"))

	// 创建依赖
	deps := &agent.Dependencies{
		Store:            jsonStore,
		SandboxFactory:   sandboxFactory,
		ToolRegistry:     toolRegistry,
		ProviderFactory:  providerFactory,
		TemplateRegistry: templateRegistry,
	}

	return &Manager{
		agents:           make(map[string]*agent.Agent),
		deps:             deps,
		templateRegistry: templateRegistry,
	}, nil
}

// GetOrCreateAgent 获取或创建 Agent
func (m *Manager) GetOrCreateAgent(ctx context.Context, agentID string, templateID string) (*agent.Agent, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 如果 Agent 已存在，直接返回
	if ag, ok := m.agents[agentID]; ok {
		return ag, nil
	}

	// 创建新 Agent
	// 根据环境变量选择 Provider
	providerType := os.Getenv("PROVIDER")
	if providerType == "" {
		providerType = "anthropic" // 默认使用 anthropic
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		apiKey = os.Getenv("GLM_API_KEY") // 尝试 GLM API Key
	}
	if apiKey == "" {
		apiKey = os.Getenv("DEEPSEEK_API_KEY") // 尝试 Deepseek API Key
	}
	if apiKey == "" {
		apiKey = "sk-default"
	}

	// 获取模型配置
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

	// 获取当前工作目录的绝对路径
	currentDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("get current directory: %w", err)
	}

	config := &types.AgentConfig{
		AgentID:    agentID,
		TemplateID: templateID,
		ModelConfig: &types.ModelConfig{
			Provider: providerType,
			Model:    model,
			APIKey:   apiKey,
			BaseURL:  baseURL,
		},
		Sandbox: &types.SandboxConfig{
			Kind:    types.SandboxKindLocal,
			WorkDir: currentDir + "/workspace",
		},
		SkillsPackage: &types.SkillsPackageConfig{
			Source:          "local",
			Path:            currentDir + "/skills-package",
			CommandsDir:     "commands",
			SkillsDir:       "skills",
			EnabledCommands: []string{"analyze", "explain", "optimize", "review", "plan"},
			EnabledSkills:   []string{"best-practices", "code-quality", "security"},
		},
		// 启用 Middleware 系统 (Phase 6C 新功能)
		Middlewares: []string{"summarization"}, // 自动总结长对话 (>170k tokens)
	}

	ag, err := agent.Create(ctx, config, m.deps)
	if err != nil {
		return nil, fmt.Errorf("create agent: %w", err)
	}

	m.agents[agentID] = ag
	return ag, nil
}

// GetAgent 获取 Agent
func (m *Manager) GetAgent(agentID string) (*agent.Agent, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	ag, ok := m.agents[agentID]
	return ag, ok
}

// CreateTemporaryAgent 创建临时 Agent（用于写作工具）
func (m *Manager) CreateTemporaryAgent(ctx context.Context, templateID string) (*agent.Agent, error) {
	// 根据环境变量选择 Provider
	providerType := os.Getenv("PROVIDER")
	if providerType == "" {
		providerType = "anthropic" // 默认使用 anthropic
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		apiKey = os.Getenv("GLM_API_KEY") // 尝试 GLM API Key
	}
	if apiKey == "" {
		apiKey = os.Getenv("DEEPSEEK_API_KEY") // 尝试 Deepseek API Key
	}
	if apiKey == "" {
		apiKey = "sk-default"
	}

	// 获取模型配置
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

	// 获取当前工作目录的绝对路径
	currentDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("get current directory: %w", err)
	}

	config := &types.AgentConfig{
		TemplateID: templateID,
		ModelConfig: &types.ModelConfig{
			Provider: providerType,
			Model:    model,
			APIKey:   apiKey,
			BaseURL:  baseURL,
		},
		Sandbox: &types.SandboxConfig{
			Kind:    types.SandboxKindLocal,
			WorkDir: currentDir + "/workspace",
		},
		SkillsPackage: &types.SkillsPackageConfig{
			Source:          "local",
			Path:            currentDir + "/skills-package",
			CommandsDir:     "commands",
			SkillsDir:       "skills",
			EnabledCommands: []string{"analyze", "explain", "optimize", "review", "plan"},
			EnabledSkills:   []string{"best-practices", "code-quality", "security"},
		},
		// 启用 Middleware 系统
		Middlewares: []string{"summarization"},
	}

	ag, err := agent.Create(ctx, config, m.deps)
	if err != nil {
		return nil, fmt.Errorf("create temporary agent: %w", err)
	}

	return ag, nil
}

// RemoveAgent 移除 Agent
func (m *Manager) RemoveAgent(agentID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	ag, ok := m.agents[agentID]
	if !ok {
		return nil
	}

	if err := ag.Close(); err != nil {
		return fmt.Errorf("close agent: %w", err)
	}

	delete(m.agents, agentID)
	return nil
}

// Close 关闭所有 Agent
func (m *Manager) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, ag := range m.agents {
		if err := ag.Close(); err != nil {
			return err
		}
	}

	m.agents = make(map[string]*agent.Agent)
	return nil
}

// GetDependencies 获取依赖（用于 PoolManager）
func (m *Manager) GetDependencies() *agent.Dependencies {
	return m.deps
}
