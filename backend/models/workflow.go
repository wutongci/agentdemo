package models

import "time"

// WorkflowStartRequest 启动工作流请求
type WorkflowStartRequest struct {
	Topic        string `json:"topic" binding:"required"`
	Requirements string `json:"requirements"`
	SessionID    string `json:"session_id"`
}

// WorkflowStartResponse 启动工作流响应
type WorkflowStartResponse struct {
	WorkflowID string `json:"workflow_id"`
	Status     string `json:"status"`
}

// WorkflowStatusResponse 工作流状态响应
type WorkflowStatusResponse struct {
	WorkflowID       string              `json:"workflow_id"`
	Stage            string              `json:"stage"`
	Progress         int                 `json:"progress"`
	StartTime        time.Time           `json:"start_time"`
	EndTime          *time.Time          `json:"end_time,omitempty"`
	ResearcherStatus interface{}         `json:"researcher_status,omitempty"`
	WriterStatus     interface{}         `json:"writer_status,omitempty"`
	EditorStatus     interface{}         `json:"editor_status,omitempty"`
	Events           []WorkflowEventData `json:"events"`
	Error            string              `json:"error,omitempty"`
}

// WorkflowEventData 工作流事件数据
type WorkflowEventData struct {
	Time      time.Time     `json:"time"`
	Stage     string        `json:"stage"`
	EventType string        `json:"event_type"`
	Message   string        `json:"message"`
	ToolCall  *ToolCallData `json:"tool_call,omitempty"`
}

// ToolCallData 工具调用数据
type ToolCallData struct {
	Name   string `json:"name"`
	Input  string `json:"input"`
	Output string `json:"output"`
	State  string `json:"state"`
}

// WorkflowArtifactsResponse 工作流产物响应
type WorkflowArtifactsResponse struct {
	Outline string `json:"outline"`
	Draft   string `json:"draft"`
	Final   string `json:"final"`
}
