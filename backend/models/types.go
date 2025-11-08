package models

import "time"

// Session 会话信息
type Session struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	AgentID   string    `json:"agent_id"`
	AgentType string    `json:"agent_type"` // "simple-chat" | "writing-assistant" | "code-analysis"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Message 消息
type Message struct {
	Role      string    `json:"role"` // "user" or "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// ChatRequest 聊天请求
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

// ChatResponse 聊天响应
type ChatResponse struct {
	SessionID string  `json:"session_id"`
	Message   Message `json:"message"`
}

// WritingToolRequest 写作工具请求
type WritingToolRequest struct {
	Text      string `json:"text" binding:"required"`
	SessionID string `json:"session_id,omitempty"`
	Style     string `json:"style,omitempty"`    // 用于 rewrite
	Language  string `json:"language,omitempty"` // 用于 translate
}

// WritingToolResponse 写作工具响应
type WritingToolResponse struct {
	OriginalText  string `json:"original_text"`
	ProcessedText string `json:"processed_text"`
	Action        string `json:"action"` // polish, rewrite, expand, summarize, translate
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error string `json:"error"`
}

// WSMessage WebSocket 消息
type WSMessage struct {
	Type string      `json:"type"` // "text_chunk", "tool_start", "tool_end", "done", "error"
	Data interface{} `json:"data"`
}

// TextChunkData 文本块数据
type TextChunkData struct {
	Delta string `json:"delta"`
}

// ToolEventData 工具事件数据
type ToolEventData struct {
	Name  string `json:"name"`
	State string `json:"state,omitempty"`
	Error string `json:"error,omitempty"`
}

// DoneData 完成数据
type DoneData struct {
	Reason string `json:"reason"`
}

// CommandExecutedData 命令执行数据
type CommandExecutedData struct {
	CommandName string `json:"command_name"`
	Arguments   string `json:"arguments,omitempty"`
}

// SkillActivatedData 技能激活数据
type SkillActivatedData struct {
	SkillNames []string `json:"skill_names"`
	Trigger    string   `json:"trigger"` // "keyword" | "context" | "always"
}
