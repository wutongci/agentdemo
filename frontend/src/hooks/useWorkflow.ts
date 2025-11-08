import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../services/workflow-api';
import type { WorkflowStartRequest } from '../types/workflow';

export function useStartWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WorkflowStartRequest) => workflowApi.startWorkflow(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useWorkflowStatus(workflowId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['workflow-status', workflowId],
    queryFn: () => workflowApi.getWorkflowStatus(workflowId!),
    enabled: enabled && !!workflowId,
    refetchInterval: (query) => {
      // 如果工作流还在进行中，每2秒刷新一次
      if (query.state.data && !['complete', 'failed'].includes(query.state.data.stage)) {
        return 2000;
      }
      return false;
    },
  });
}

export function useWorkflowArtifacts(workflowId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['workflow-artifacts', workflowId],
    queryFn: () => workflowApi.getWorkflowArtifacts(workflowId!),
    enabled: enabled && !!workflowId,
    refetchInterval: 5000, // 每5秒刷新一次
  });
}

