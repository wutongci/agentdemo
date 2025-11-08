import { useWorkflowStatus } from '../hooks/useWorkflow';
import type { WorkflowEvent } from '../types/workflow';
import { Card } from './ui/card';

interface ToolExecutionLogProps {
  workflowId: string | null;
}

export function ToolExecutionLog({ workflowId }: ToolExecutionLogProps) {
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

  const events = status?.events || [];
  const toolEvents = events.filter((e) => e.event_type.includes('tool'));

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">工具执行日志</h2>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无事件</p>
        ) : (
          events.map((event, index) => (
            <EventItem key={index} event={event} index={index} />
          ))
        )}
      </div>

      {/* 统计信息 */}
      {toolEvents.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-2">统计</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">总事件数:</span>
              <span className="ml-2 font-medium">{events.length}</span>
            </div>
            <div>
              <span className="text-gray-600">工具调用:</span>
              <span className="ml-2 font-medium">{toolEvents.length / 2}</span>
            </div>
          </div>

          {/* 工具使用统计 */}
          <div className="mt-3">
            <span className="text-gray-600 text-sm">工具使用:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {getToolStats(toolEvents).map(([tool, count]) => (
                <span
                  key={tool}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tool}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface EventItemProps {
  event: WorkflowEvent;
  index: number;
}

function EventItem({ event }: EventItemProps) {
  const isStageEvent = event.event_type.includes('stage');

  let bgColor = 'bg-gray-50';
  let iconColor = 'text-gray-500';
  let icon = '📌';

  if (event.event_type === 'tool_start') {
    bgColor = 'bg-blue-50';
    iconColor = 'text-blue-600';
    icon = '🔧';
  } else if (event.event_type === 'tool_end') {
    bgColor = 'bg-green-50';
    iconColor = 'text-green-600';
    icon = '✅';
  } else if (isStageEvent) {
    bgColor = 'bg-purple-50';
    iconColor = 'text-purple-600';
    icon = '🎯';
  }

  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex items-start gap-3">
        <span className={`text-xl ${iconColor}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">
              {new Date(event.time).toLocaleTimeString()}
            </span>
            <span className="text-xs px-2 py-0.5 bg-white rounded">
              {event.stage}
            </span>
          </div>
          <p className="text-sm font-medium">{event.message}</p>

          {/* 工具调用详情 */}
          {event.tool_call && (
            <div className="mt-2 p-2 bg-white rounded text-xs space-y-1">
              <div>
                <span className="text-gray-600">工具:</span>
                <span className="ml-1 font-mono font-medium">{event.tool_call.name}</span>
              </div>
              <div>
                <span className="text-gray-600">状态:</span>
                <span className={`ml-1 font-medium ${
                  event.tool_call.state === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {event.tool_call.state}
                </span>
              </div>
              {event.tool_call.input && (
                <div>
                  <span className="text-gray-600">输入:</span>
                  <pre className="ml-1 mt-1 p-1 bg-gray-50 rounded overflow-x-auto">
                    {truncateString(event.tool_call.input, 100)}
                  </pre>
                </div>
              )}
              {event.tool_call.output && (
                <div>
                  <span className="text-gray-600">输出:</span>
                  <pre className="ml-1 mt-1 p-1 bg-gray-50 rounded overflow-x-auto">
                    {truncateString(event.tool_call.output, 100)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getToolStats(events: WorkflowEvent[]): [string, number][] {
  const stats = new Map<string, number>();

  events.forEach((event) => {
    if (event.tool_call && event.event_type === 'tool_end') {
      const count = stats.get(event.tool_call.name) || 0;
      stats.set(event.tool_call.name, count + 1);
    }
  });

  return Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

