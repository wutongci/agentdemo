import type { SkillInfo } from '../../types/skills';

interface SkillCardProps {
  skill: SkillInfo;
  isEnabled?: boolean;
  onToggle?: (name: string, enabled: boolean) => void;
}

export function SkillCard({ skill, isEnabled = true, onToggle }: SkillCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* 技能标题和状态 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
            {isEnabled && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                已启用
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
        </div>
      </div>

      {/* 触发条件 */}
      {skill.triggers && skill.triggers.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500">触发条件：</span>
          <div className="mt-1 space-y-1">
            {skill.triggers.map((trigger, index) => (
              <div key={index} className="text-xs text-gray-700">
                {trigger.type === 'keyword' && trigger.keywords && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-gray-500">关键词：</span>
                    {trigger.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-block px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded border border-yellow-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {trigger.type === 'context' && trigger.condition && (
                  <div>
                    <span className="text-gray-500">上下文：</span>
                    <span className="ml-1 text-gray-700">{trigger.condition}</span>
                  </div>
                )}
                {trigger.type === 'always' && (
                  <span className="text-purple-600 font-medium">始终激活</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 允许的工具 */}
      {skill.allowed_tools && skill.allowed_tools.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500">可用工具：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {skill.allowed_tools.map((tool) => (
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
      {onToggle && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onToggle(skill.name, !isEnabled)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              isEnabled
                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            {isEnabled ? '禁用' : '启用'}
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
            查看详情
          </button>
        </div>
      )}
    </div>
  );
}
