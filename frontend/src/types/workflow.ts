// 工作流类型定义

export interface WorkflowStartRequest {
  topic: string;
  requirements: string;
  session_id?: string;
}

export interface WorkflowStartResponse {
  workflow_id: string;
  status: string;
}

export type WorkflowStage = 'research' | 'writing' | 'editing' | 'complete' | 'failed';

export interface AgentStatus {
  agent_id: string;
  state: string;
  step_count: number;
  last_sfp_index: number;
  cursor: number;
  breakpoint?: string;
}

export interface ToolCallInfo {
  name: string;
  input: string;
  output: string;
  state: string;
}

export interface WorkflowEvent {
  time: string;
  stage: string;
  event_type: string;
  message: string;
  tool_call?: ToolCallInfo;
}

export interface WorkflowStatus {
  workflow_id: string;
  stage: WorkflowStage;
  progress: number;
  start_time: string;
  end_time?: string;
  researcher_status?: AgentStatus;
  writer_status?: AgentStatus;
  editor_status?: AgentStatus;
  events: WorkflowEvent[];
  error?: string;
}

export interface WorkflowArtifacts {
  outline: string;
  draft: string;
  final: string;
}

