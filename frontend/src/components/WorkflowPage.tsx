import { useState } from 'react';
import { WorkflowStartForm } from './WorkflowStartForm';
import { WorkflowVisualization } from './WorkflowVisualization';
import { ArtifactViewer } from './ArtifactViewer';
import { ToolExecutionLog } from './ToolExecutionLog';

export function WorkflowPage() {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI 写作协作系统</h1>
          <p className="text-gray-600 mt-2">
            展示 AgentSDK 的核心能力：多 Agent 协作、工具调用、沙箱执行
          </p>
        </div>

        {/* 启动表单 */}
        <WorkflowStartForm onWorkflowStarted={setCurrentWorkflowId} />

        {/* 工作流可视化 */}
        {currentWorkflowId && (
          <>
            <WorkflowVisualization workflowId={currentWorkflowId} />

            {/* 两列布局：文档产物 + 工具日志 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ArtifactViewer workflowId={currentWorkflowId} />
              <ToolExecutionLog workflowId={currentWorkflowId} />
            </div>
          </>
        )}

        {/* 说明文档 */}
        {!currentWorkflowId && (
          <div className="p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">✨ 特性说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">🤝 多 Agent 协作</h3>
                <p className="text-sm text-gray-600">
                  使用 AgentSDK 的 Pool 机制管理三个专业 Agent，实现真实的分工协作
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🛠️ 完整工具系统</h3>
                <p className="text-sm text-gray-600">
                  每个 Agent 都能使用 fs_read、fs_write、bash_run 等工具进行实际操作
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔒 沙箱环境</h3>
                <p className="text-sm text-gray-600">
                  所有文件操作和命令执行都在隔离的 workspace 中进行，安全可控
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📊 完整可观测性</h3>
                <p className="text-sm text-gray-600">
                  实时追踪每个工具调用、Agent 状态、执行进度和事件流
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

