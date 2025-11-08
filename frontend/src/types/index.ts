export interface Session {
  id: string
  title: string
  agent_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
}

export interface WritingToolRequest {
  text: string
  session_id?: string
  style?: string
  language?: string
}

export interface WritingToolResponse {
  original_text: string
  processed_text: string
  action: string
}

export type WSMessageType =
  | "text_chunk"
  | "text_start"
  | "text_end"
  | "tool_start"
  | "tool_end"
  | "tool_error"
  | "done"
  | "error"
  | "state_changed"
  | "token_usage"

export interface WSMessage {
  type: WSMessageType
  data: any
}

export interface TextChunkData {
  delta: string
}

export interface ToolEventData {
  name: string
  state?: string
  error?: string
}

export interface DoneData {
  reason: string
}

