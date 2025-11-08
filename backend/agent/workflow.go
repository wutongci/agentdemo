package agent

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/wordflowlab/agentsdk/pkg/types"
)

// WorkflowStage 工作流阶段
type WorkflowStage string

const (
	StageResearch WorkflowStage = "research"
	StageWriting  WorkflowStage = "writing"
	StageEditing  WorkflowStage = "editing"
	StageComplete WorkflowStage = "complete"
	StageFailed   WorkflowStage = "failed"
)

// WorkflowStatus 工作流状态
type WorkflowStatus struct {
	WorkflowID     string             `json:"workflow_id"`
	Stage          WorkflowStage      `json:"stage"`
	Progress       int                `json:"progress"`
	StartTime      time.Time          `json:"start_time"`
	EndTime        *time.Time         `json:"end_time,omitempty"`
	ResearchStatus *types.AgentStatus `json:"researcher_status,omitempty"`
	WriterStatus   *types.AgentStatus `json:"writer_status,omitempty"`
	EditorStatus   *types.AgentStatus `json:"editor_status,omitempty"`
	Events         []WorkflowEvent    `json:"events"`
	Error          string             `json:"error,omitempty"`
}

// WorkflowEvent 工作流事件
type WorkflowEvent struct {
	Time      time.Time     `json:"time"`
	Stage     WorkflowStage `json:"stage"`
	EventType string        `json:"event_type"`
	Message   string        `json:"message"`
	ToolCall  *ToolCallInfo `json:"tool_call,omitempty"`
}

// ToolCallInfo 工具调用信息
type ToolCallInfo struct {
	Name   string `json:"name"`
	Input  string `json:"input"`
	Output string `json:"output"`
	State  string `json:"state"`
}

// WorkflowOrchestrator 工作流编排器
type WorkflowOrchestrator struct {
	poolManager *PoolManager
	workflows   map[string]*WorkflowStatus
	mu          sync.RWMutex
}

// NewWorkflowOrchestrator 创建工作流编排器
func NewWorkflowOrchestrator(poolManager *PoolManager) *WorkflowOrchestrator {
	return &WorkflowOrchestrator{
		poolManager: poolManager,
		workflows:   make(map[string]*WorkflowStatus),
	}
}

// StartWorkflow 启动工作流
func (wo *WorkflowOrchestrator) StartWorkflow(ctx context.Context, workflowID, topic, requirements string, modelConfig *types.ModelConfig) error {
	log.Printf("[WorkflowOrchestrator] StartWorkflow called - ID: %s, Topic: %s", workflowID, topic)

	wo.mu.Lock()
	defer wo.mu.Unlock()

	// 检查是否已存在
	if _, exists := wo.workflows[workflowID]; exists {
		log.Printf("[WorkflowOrchestrator] Workflow already exists: %s", workflowID)
		return fmt.Errorf("workflow already exists: %s", workflowID)
	}

	// 创建工作流状态
	status := &WorkflowStatus{
		WorkflowID: workflowID,
		Stage:      StageResearch,
		Progress:   0,
		StartTime:  time.Now(),
		Events:     []WorkflowEvent{},
	}
	wo.workflows[workflowID] = status
	log.Printf("[WorkflowOrchestrator] Workflow status created: %s", workflowID)

	// 记录启动事件（在已持有锁的情况下直接操作）
	event := WorkflowEvent{
		Time:      time.Now(),
		Stage:     StageResearch,
		EventType: "workflow_start",
		Message:   "工作流已启动",
	}
	status.Events = append(status.Events, event)
	log.Printf("[WorkflowOrchestrator] Workflow start event added")

	// 创建三个 Agent
	log.Printf("[WorkflowOrchestrator] Creating workflow agents...")
	log.Printf("[WorkflowOrchestrator] ModelConfig: Provider=%s, Model=%s, BaseURL=%s",
		modelConfig.Provider, modelConfig.Model, modelConfig.BaseURL)

	// 使用带超时的 context 创建 Agent，避免无限阻塞
	createCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	deps, err := wo.poolManager.CreateWorkflowAgents(createCtx, workflowID, modelConfig)
	if err != nil {
		log.Printf("[WorkflowOrchestrator] ❌ Failed to create agents: %v", err)
		status.Stage = StageFailed
		status.Error = err.Error()
		return err
	}
	log.Printf("[WorkflowOrchestrator] ✅ Agents created - Researcher: %s, Writer: %s, Editor: %s",
		deps.ResearcherID, deps.WriterID, deps.EditorID)

	// 确保工作目录存在
	log.Printf("[WorkflowOrchestrator] Ensuring workspace directories: %s", deps.WorkDir)
	err = wo.ensureWorkspaceDirs(deps.WorkDir)
	if err != nil {
		log.Printf("[WorkflowOrchestrator] Failed to create workspace dirs: %v", err)
		status.Stage = StageFailed
		status.Error = err.Error()
		return err
	}
	log.Printf("[WorkflowOrchestrator] Workspace directories created")

	// 异步执行工作流
	log.Printf("[WorkflowOrchestrator] Starting async workflow execution...")
	go wo.executeWorkflow(context.Background(), workflowID, topic, requirements, deps)
	log.Printf("[WorkflowOrchestrator] Async workflow execution started")

	return nil
}

// executeWorkflow 执行工作流
func (wo *WorkflowOrchestrator) executeWorkflow(ctx context.Context, workflowID, topic, requirements string, deps *WorkflowDependencies) {
	log.Printf("[executeWorkflow] Starting workflow execution: %s", workflowID)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[executeWorkflow] PANIC in workflow %s: %v", workflowID, r)
			wo.failWorkflow(workflowID, "panic", fmt.Errorf("panic: %v", r))
		}
	}()

	// 阶段 1: 研究员生成大纲
	log.Printf("[executeWorkflow] [%s] Starting research stage", workflowID)
	err := wo.executeResearchStage(ctx, workflowID, topic, requirements, deps)
	if err != nil {
		log.Printf("[executeWorkflow] [%s] Research stage failed: %v", workflowID, err)
		wo.failWorkflow(workflowID, "research", err)
		return
	}
	log.Printf("[executeWorkflow] [%s] Research stage completed", workflowID)

	// 阶段 2: 作家撰写内容
	log.Printf("[executeWorkflow] [%s] Starting writing stage", workflowID)
	err = wo.executeWritingStage(ctx, workflowID, deps)
	if err != nil {
		log.Printf("[executeWorkflow] [%s] Writing stage failed: %v", workflowID, err)
		wo.failWorkflow(workflowID, "writing", err)
		return
	}
	log.Printf("[executeWorkflow] [%s] Writing stage completed", workflowID)

	// 阶段 3: 编辑审校润色
	log.Printf("[executeWorkflow] [%s] Starting editing stage", workflowID)
	err = wo.executeEditingStage(ctx, workflowID, deps)
	if err != nil {
		log.Printf("[executeWorkflow] [%s] Editing stage failed: %v", workflowID, err)
		wo.failWorkflow(workflowID, "editing", err)
		return
	}
	log.Printf("[executeWorkflow] [%s] Editing stage completed", workflowID)

	// 完成
	log.Printf("[executeWorkflow] [%s] All stages completed, marking as complete", workflowID)
	wo.completeWorkflow(workflowID)
}

// executeResearchStage 执行研究阶段
func (wo *WorkflowOrchestrator) executeResearchStage(ctx context.Context, workflowID, topic, requirements string, deps *WorkflowDependencies) error {
	log.Printf("[executeResearchStage] [%s] Starting research stage", workflowID)
	wo.updateProgress(workflowID, StageResearch, 10)
	wo.addEvent(workflowID, StageResearch, "stage_start", "研究员开始分析主题")

	log.Printf("[executeResearchStage] [%s] Getting researcher agent: %s", workflowID, deps.ResearcherID)
	researcher, err := wo.poolManager.GetAgent(deps.ResearcherID)
	if err != nil {
		log.Printf("[executeResearchStage] [%s] Failed to get researcher agent: %v", workflowID, err)
		return fmt.Errorf("get researcher agent: %w", err)
	}
	log.Printf("[executeResearchStage] [%s] Researcher agent obtained", workflowID)

	// 订阅事件
	log.Printf("[executeResearchStage] [%s] Subscribing to researcher events", workflowID)
	eventCh := researcher.Subscribe([]types.AgentChannel{types.ChannelProgress}, nil)
	go wo.handleAgentEvents(workflowID, StageResearch, eventCh)
	log.Printf("[executeResearchStage] [%s] Event subscription started", workflowID)

	// 构建提示 - 简洁自然
	prompt := fmt.Sprintf(`请为以下主题生成详细的写作大纲：

主题：%s
要求：%s

请生成大纲并使用 fs_write 工具将大纲保存为 outline.md 文件。`, topic, requirements)

	log.Printf("[executeResearchStage] [%s] Sending prompt to researcher (length: %d)", workflowID, len(prompt))
	promptPreview := prompt
	if len(promptPreview) > 200 {
		promptPreview = promptPreview[:200]
	}
	log.Printf("[executeResearchStage] [%s] Prompt: %s", workflowID, promptPreview)

	// 执行
	log.Printf("[executeResearchStage] [%s] Calling researcher.Chat...", workflowID)
	result, err := researcher.Chat(ctx, prompt)
	if err != nil {
		log.Printf("[executeResearchStage] [%s] Researcher.Chat failed: %v", workflowID, err)
		return fmt.Errorf("researcher failed: %w", err)
	}

	log.Printf("[executeResearchStage] [%s] Researcher response received (length: %d)", workflowID, len(result.Text))
	responsePreview := result.Text
	if len(responsePreview) > 500 {
		responsePreview = responsePreview[:500]
	}
	log.Printf("[executeResearchStage] [%s] Researcher response: %s", workflowID, responsePreview)

	// 检查文件是否真的被创建
	outlinePath := filepath.Join(deps.WorkDir, "research", "outline.md")
	if _, err := os.Stat(outlinePath); err == nil {
		content, _ := os.ReadFile(outlinePath)
		log.Printf("[executeResearchStage] [%s] ✓ outline.md exists (size: %d bytes)", workflowID, len(content))
	} else {
		log.Printf("[executeResearchStage] [%s] ✗ outline.md NOT FOUND at %s", workflowID, outlinePath)
		log.Printf("[executeResearchStage] [%s] Checking if any files exist in research dir...", workflowID)
		files, _ := os.ReadDir(filepath.Join(deps.WorkDir, "research"))
		var fileNames []string
		for _, f := range files {
			fileNames = append(fileNames, f.Name())
		}
		log.Printf("[executeResearchStage] [%s] Files in research dir: %v", workflowID, fileNames)
	}

	wo.updateProgress(workflowID, StageResearch, 33)
	wo.addEvent(workflowID, StageResearch, "stage_complete", "大纲已生成")
	log.Printf("[executeResearchStage] [%s] Research stage completed successfully", workflowID)

	return nil
}

// executeWritingStage 执行写作阶段
func (wo *WorkflowOrchestrator) executeWritingStage(ctx context.Context, workflowID string, deps *WorkflowDependencies) error {
	log.Printf("[Workflow %s] 开始写作阶段", workflowID)
	wo.updateProgress(workflowID, StageWriting, 40)
	wo.addEvent(workflowID, StageWriting, "stage_start", "作家开始撰写内容")

	writer, err := wo.poolManager.GetAgent(deps.WriterID)
	if err != nil {
		return err
	}

	// 订阅事件
	eventCh := writer.Subscribe([]types.AgentChannel{types.ChannelProgress}, nil)
	go wo.handleAgentEvents(workflowID, StageWriting, eventCh)

	// 构建提示 - 简洁自然
	prompt := `请基于大纲撰写完整的文章内容。

请先使用 fs_read 工具读取 ../research/outline.md 获取大纲，然后按照大纲撰写内容，最后使用 fs_write 工具将草稿保存为 draft.md。`

	// 执行
	result, err := writer.Chat(ctx, prompt)
	if err != nil {
		return fmt.Errorf("writer failed: %w", err)
	}

	log.Printf("[Workflow %s] 作家响应: %s", workflowID, result.Text)

	// 检查文件是否真的被创建
	draftPath := filepath.Join(deps.WorkDir, "writing", "draft.md")
	if _, err := os.Stat(draftPath); err == nil {
		content, _ := os.ReadFile(draftPath)
		log.Printf("[executeWritingStage] [%s] ✓ draft.md exists (size: %d bytes)", workflowID, len(content))
		wo.updateProgress(workflowID, StageWriting, 66)
		wo.addEvent(workflowID, StageWriting, "stage_complete", "草稿已完成")
	} else {
		log.Printf("[executeWritingStage] [%s] ✗ draft.md NOT FOUND at %s", workflowID, draftPath)
		return fmt.Errorf("writer did not create draft.md file")
	}

	return nil
}

// executeEditingStage 执行编辑阶段
func (wo *WorkflowOrchestrator) executeEditingStage(ctx context.Context, workflowID string, deps *WorkflowDependencies) error {
	log.Printf("[Workflow %s] 开始编辑阶段", workflowID)
	wo.updateProgress(workflowID, StageEditing, 70)
	wo.addEvent(workflowID, StageEditing, "stage_start", "编辑开始审校")

	editor, err := wo.poolManager.GetAgent(deps.EditorID)
	if err != nil {
		return err
	}

	// 订阅事件
	eventCh := editor.Subscribe([]types.AgentChannel{types.ChannelProgress}, nil)
	go wo.handleAgentEvents(workflowID, StageEditing, eventCh)

	// 构建提示 - 更明确地要求使用工具
	prompt := `请审校草稿并生成终稿。

任务步骤：
1. 使用 fs_read 工具读取 ../writing/draft.md 获取草稿
2. 全面审校内容（语法、逻辑、表达、段落衔接、标点符号）
3. 进行必要的修改和优化
4. 使用 fs_write 工具将终稿保存为 final.md

重要：必须使用 fs_write 工具保存文件，否则任务无法完成。`

	// 执行
	result, err := editor.Chat(ctx, prompt)
	if err != nil {
		return fmt.Errorf("editor failed: %w", err)
	}

	log.Printf("[Workflow %s] 编辑响应: %s", workflowID, result.Text)

	// 检查文件是否真的被创建（重要：验证任务完成）
	finalPath := filepath.Join(deps.WorkDir, "editing", "final.md")
	if _, err := os.Stat(finalPath); err == nil {
		content, _ := os.ReadFile(finalPath)
		log.Printf("[executeEditingStage] [%s] ✓ final.md exists (size: %d bytes)", workflowID, len(content))
		wo.updateProgress(workflowID, StageEditing, 100)
		wo.addEvent(workflowID, StageEditing, "stage_complete", "终稿已完成")
	} else {
		log.Printf("[executeEditingStage] [%s] ✗ final.md NOT FOUND at %s", workflowID, finalPath)
		log.Printf("[executeEditingStage] [%s] Editor did not write final.md file", workflowID)
		// 即使 Chat() 返回成功，如果没有文件，也认为失败
		return fmt.Errorf("editor did not create final.md file")
	}

	return nil
}

// handleAgentEvents 处理 Agent 事件
func (wo *WorkflowOrchestrator) handleAgentEvents(workflowID string, stage WorkflowStage, eventCh <-chan types.AgentEventEnvelope) {
	log.Printf("[handleAgentEvents] [%s] [%s] Event handler started", workflowID, stage)
	eventCount := 0
	for envelope := range eventCh {
		eventCount++
		log.Printf("[handleAgentEvents] [%s] [%s] Received event #%d: %T", workflowID, stage, eventCount, envelope.Event)

		switch evt := envelope.Event.(type) {
		case *types.ProgressToolStartEvent:
			wo.addEvent(workflowID, stage, "tool_start", fmt.Sprintf("工具执行: %s", evt.Call.Name))
			log.Printf("[handleAgentEvents] [%s] [%s] ✓ Tool Start: %s (ID: %s)", workflowID, stage, evt.Call.Name, evt.Call.ID)

		case *types.ProgressToolEndEvent:
			toolInfo := &ToolCallInfo{
				Name:  evt.Call.Name,
				State: string(evt.Call.State),
			}
			if evt.Call.InputPreview != nil {
				toolInfo.Input = fmt.Sprintf("%v", evt.Call.InputPreview)
			}
			if evt.Call.Result != nil {
				toolInfo.Output = fmt.Sprintf("%v", evt.Call.Result)
			}

			event := WorkflowEvent{
				Time:      time.Now(),
				Stage:     stage,
				EventType: "tool_end",
				Message:   fmt.Sprintf("工具完成: %s", evt.Call.Name),
				ToolCall:  toolInfo,
			}
			wo.mu.Lock()
			if status, exists := wo.workflows[workflowID]; exists {
				status.Events = append(status.Events, event)
			}
			wo.mu.Unlock()
			log.Printf("[handleAgentEvents] [%s] [%s] ✓ Tool End: %s - State: %s", workflowID, stage, evt.Call.Name, evt.Call.State)
			if evt.Call.Result != nil {
				log.Printf("[handleAgentEvents] [%s] [%s] Tool Result: %v", workflowID, stage, evt.Call.Result)
			}
		default:
			log.Printf("[handleAgentEvents] [%s] [%s] Unhandled event type: %T", workflowID, stage, envelope.Event)
		}
	}
	log.Printf("[handleAgentEvents] [%s] [%s] Event handler ended (total events: %d)", workflowID, stage, eventCount)
}

// ensureWorkspaceDirs 确保工作目录存在
func (wo *WorkflowOrchestrator) ensureWorkspaceDirs(workDir string) error {
	dirs := []string{
		filepath.Join(workDir, "research"),
		filepath.Join(workDir, "writing"),
		filepath.Join(workDir, "editing"),
		filepath.Join(workDir, "shared"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("create dir %s: %w", dir, err)
		}
	}
	return nil
}

// GetWorkflowStatus 获取工作流状态
func (wo *WorkflowOrchestrator) GetWorkflowStatus(workflowID string) (*WorkflowStatus, error) {
	wo.mu.RLock()
	defer wo.mu.RUnlock()

	status, exists := wo.workflows[workflowID]
	if !exists {
		return nil, fmt.Errorf("workflow not found: %s", workflowID)
	}

	// 更新 Agent 状态
	deps, err := wo.poolManager.GetWorkflowDeps(workflowID)
	if err == nil {
		status.ResearchStatus, _ = wo.poolManager.GetAgentStatus(deps.ResearcherID)
		status.WriterStatus, _ = wo.poolManager.GetAgentStatus(deps.WriterID)
		status.EditorStatus, _ = wo.poolManager.GetAgentStatus(deps.EditorID)
	}

	return status, nil
}

// GetArtifacts 获取工作流产物
func (wo *WorkflowOrchestrator) GetArtifacts(workflowID string) (map[string]string, error) {
	deps, err := wo.poolManager.GetWorkflowDeps(workflowID)
	if err != nil {
		return nil, err
	}

	artifacts := make(map[string]string)

	// 读取 outline
	outlinePath := filepath.Join(deps.WorkDir, "research", "outline.md")
	if content, err := os.ReadFile(outlinePath); err == nil {
		artifacts["outline"] = string(content)
	}

	// 读取 draft
	draftPath := filepath.Join(deps.WorkDir, "writing", "draft.md")
	if content, err := os.ReadFile(draftPath); err == nil {
		artifacts["draft"] = string(content)
	}

	// 读取 final
	finalPath := filepath.Join(deps.WorkDir, "editing", "final.md")
	if content, err := os.ReadFile(finalPath); err == nil {
		artifacts["final"] = string(content)
	}

	return artifacts, nil
}

// 辅助方法
func (wo *WorkflowOrchestrator) updateProgress(workflowID string, stage WorkflowStage, progress int) {
	wo.mu.Lock()
	defer wo.mu.Unlock()

	if status, exists := wo.workflows[workflowID]; exists {
		status.Stage = stage
		status.Progress = progress
	}
}

func (wo *WorkflowOrchestrator) addEvent(workflowID string, stage WorkflowStage, eventType, message string) {
	wo.mu.Lock()
	defer wo.mu.Unlock()

	if status, exists := wo.workflows[workflowID]; exists {
		event := WorkflowEvent{
			Time:      time.Now(),
			Stage:     stage,
			EventType: eventType,
			Message:   message,
		}
		status.Events = append(status.Events, event)
	}
}

func (wo *WorkflowOrchestrator) failWorkflow(workflowID, stage string, err error) {
	wo.mu.Lock()
	defer wo.mu.Unlock()

	if status, exists := wo.workflows[workflowID]; exists {
		status.Stage = StageFailed
		status.Error = fmt.Sprintf("%s stage failed: %v", stage, err)
		now := time.Now()
		status.EndTime = &now
		log.Printf("[Workflow %s] FAILED at %s: %v", workflowID, stage, err)
	}
}

func (wo *WorkflowOrchestrator) completeWorkflow(workflowID string) {
	wo.mu.Lock()
	defer wo.mu.Unlock()

	if status, exists := wo.workflows[workflowID]; exists {
		status.Stage = StageComplete
		status.Progress = 100
		now := time.Now()
		status.EndTime = &now
		wo.addEvent(workflowID, StageComplete, "workflow_complete", "工作流已完成")
		log.Printf("[Workflow %s] COMPLETED", workflowID)
	}
}
