import type { CommandInfo } from '../../types/skills';

interface CommandCardProps {
  command: CommandInfo;
  onExecute?: (name: string) => void;
}

export function CommandCard({ command, onExecute }: CommandCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* 命令标题 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            <span className="text-blue-600">/</span>{command.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{command.description}</p>
        </div>
      </div>

      {/* 参数提示 */}
      {command.argument_hint && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500">参数：</span>
          <span className="text-xs text-gray-700 ml-1">{command.argument_hint}</span>
        </div>
      )}

      {/* 允许的工具 */}
      {command.allowed_tools && command.allowed_tools.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500">可用工具：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {command.allowed_tools.map((tool) => (
              <span
                key={tool}
                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {onExecute && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onExecute(command.name)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
          >
            ▶ 执行命令
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
            查看详情
          </button>
        </div>
      )}
    </div>
  );
}
