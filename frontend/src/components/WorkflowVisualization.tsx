import { useWorkflowStatus } from '../hooks/useWorkflow';
import type { WorkflowStage, AgentStatus } from '../types/workflow';
import { Card } from './ui/card';

interface WorkflowVisualizationProps {
  workflowId: string | null;
}

export function WorkflowVisualization({ workflowId }: WorkflowVisualizationProps) {
  const { data: status, isLoading } = useWorkflowStatus(workflowId);

  if (!workflowId) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">请先启动工作流</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center">加载中...</p>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">协作流程</h2>

      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">总体进度</span>
          <span className="text-sm font-medium">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          当前阶段: <span className="font-semibold">{getStageLabel(status.stage)}</span>
        </div>
      </div>

      {/* 三个 Agent 状态 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentCard
          title="研究员"
          stage="research"
          currentStage={status.stage}
          agentStatus={status.researcher_status}
          icon="🔍"
        />
        <AgentCard
          title="作家"
          stage="writing"
          currentStage={status.stage}
          agentStatus={status.writer_status}
          icon="✍️"
        />
        <AgentCard
          title="编辑"
          stage="editing"
          currentStage={status.stage}
          agentStatus={status.editor_status}
          icon="✨"
        />
      </div>

      {/* 错误信息 */}
      {status.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">错误</p>
          <p className="text-red-600 text-sm mt-1">{status.error}</p>
        </div>
      )}

      {/* 完成信息 */}
      {status.stage === 'complete' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">✅ 工作流已完成！</p>
          <p className="text-green-600 text-sm mt-1">
            所有阶段执行成功，请查看下方的产物。
          </p>
        </div>
      )}
    </Card>
  );
}

interface AgentCardProps {
  title: string;
  stage: WorkflowStage;
  currentStage: WorkflowStage;
  agentStatus?: AgentStatus;
  icon: string;
}

function AgentCard({ title, stage, currentStage, agentStatus, icon }: AgentCardProps) {
  const isActive = currentStage === stage;
  const isPast = getStageOrder(currentStage) > getStageOrder(stage);
  const isFuture = getStageOrder(currentStage) < getStageOrder(stage);

  let statusClass = 'bg-gray-50 border-gray-200';
  let statusText = '等待中';
  let statusColor = 'text-gray-500';

  if (isActive) {
    statusClass = 'bg-blue-50 border-blue-300 shadow-md';
    statusText = '进行中';
    statusColor = 'text-blue-600';
  } else if (isPast) {
    statusClass = 'bg-green-50 border-green-200';
    statusText = '已完成';
    statusColor = 'text-green-600';
  }

  return (
    <div className={`p-4 border-2 rounded-lg transition-all ${statusClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
      </div>

      {agentStatus && (
        <div className="space-y-1 text-sm text-gray-600">
          <div>状态: <span className="font-medium">{agentStatus.state}</span></div>
          <div>步骤数: <span className="font-medium">{agentStatus.step_count}</span></div>
          {agentStatus.breakpoint && (
            <div className="text-xs text-gray-500 mt-2">
              断点: {agentStatus.breakpoint}
            </div>
          )}
        </div>
      )}

      {isFuture && (
        <p className="text-sm text-gray-400 mt-2">待执行</p>
      )}
    </div>
  );
}

function getStageLabel(stage: WorkflowStage): string {
  const labels: Record<WorkflowStage, string> = {
    research: '研究',
    writing: '写作',
    editing: '编辑',
    complete: '完成',
    failed: '失败',
  };
  return labels[stage] || stage;
}

function getStageOrder(stage: WorkflowStage): number {
  const order: Record<WorkflowStage, number> = {
    research: 1,
    writing: 2,
    editing: 3,
    complete: 4,
    failed: 4,
  };
  return order[stage] || 0;
}

