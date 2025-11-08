import type { 
  WorkflowStartRequest, 
  WorkflowStartResponse, 
  WorkflowStatus,
  WorkflowArtifacts 
} from '../types/workflow';

const API_BASE = 'http://localhost:8080/api';

export const workflowApi = {
  // 启动工作流
  startWorkflow: async (request: WorkflowStartRequest): Promise<WorkflowStartResponse> => {
    const response = await fetch(`${API_BASE}/workflow/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to start workflow');
    }

    return response.json();
  },

  // 获取工作流状态
  getWorkflowStatus: async (workflowId: string): Promise<WorkflowStatus> => {
    const response = await fetch(`${API_BASE}/workflow/${workflowId}/status`);

    if (!response.ok) {
      throw new Error('Failed to get workflow status');
    }

    return response.json();
  },

  // 获取工作流产物
  getWorkflowArtifacts: async (workflowId: string): Promise<WorkflowArtifacts> => {
    const response = await fetch(`${API_BASE}/workflow/${workflowId}/artifacts`);

    if (!response.ok) {
      throw new Error('Failed to get workflow artifacts');
    }

    return response.json();
  },
};

