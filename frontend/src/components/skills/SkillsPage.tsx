import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCommands, fetchSkills } from '../../services/skillsService';
import { CommandCard } from './CommandCard';
import { SkillCard } from './SkillCard';

type TabType = 'commands' | 'skills';

export function SkillsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('commands');
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(
    new Set(['best-practices', 'code-quality', 'security'])
  );

  // 获取命令列表
  const {
    data: commands,
    isLoading: commandsLoading,
    error: commandsError,
  } = useQuery({
    queryKey: ['commands'],
    queryFn: fetchCommands,
  });

  // 获取技能列表
  const {
    data: skills,
    isLoading: skillsLoading,
    error: skillsError,
  } = useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
  });

  // 处理命令执行
  const handleExecuteCommand = (commandName: string) => {
    // TODO: 实现命令执行逻辑
    console.log('执行命令:', commandName);
    alert(`执行命令: /${commandName}\n\n此功能即将实现！`);
  };

  // 处理技能启用/禁用
  const handleToggleSkill = (skillName: string, enabled: boolean) => {
    const newEnabledSkills = new Set(enabledSkills);
    if (enabled) {
      newEnabledSkills.add(skillName);
    } else {
      newEnabledSkills.delete(skillName);
    }
    setEnabledSkills(newEnabledSkills);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900">Skills 管理</h2>
        <p className="text-sm text-gray-600 mt-1">
          管理 Slash Commands 和 Agent Skills，增强 AI 助手的能力
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'commands'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">⚡</span>
            Slash Commands
            {commands && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {commands.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'skills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">🧠</span>
            Agent Skills
            {skills && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {skills.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'commands' && (
          <div>
            {/* 说明 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                什么是 Slash Commands？
              </h3>
              <p className="text-sm text-blue-800">
                Slash Commands 是用户主动触发的命令。在对话框中输入{' '}
                <code className="px-1.5 py-0.5 bg-blue-100 rounded">/命令名</code>{' '}
                即可执行预定义的工作流。
              </p>
            </div>

            {/* 命令列表 */}
            {commandsLoading && (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            )}

            {commandsError && (
              <div className="text-center py-12">
                <p className="text-red-600">
                  加载失败: {(commandsError as Error).message}
                </p>
              </div>
            )}

            {commands && commands.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无可用命令</p>
              </div>
            )}

            {commands && commands.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {commands.map((command) => (
                  <CommandCard
                    key={command.name}
                    command={command}
                    onExecute={handleExecuteCommand}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            {/* 说明 */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                什么是 Agent Skills？
              </h3>
              <p className="text-sm text-purple-800">
                Agent Skills 是 AI 自动激活的知识库。根据对话内容和触发条件，相关技能会自动注入到
                AI 的系统提示中，提供专业知识和最佳实践指导。
              </p>
            </div>

            {/* 技能列表 */}
            {skillsLoading && (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            )}

            {skillsError && (
              <div className="text-center py-12">
                <p className="text-red-600">加载失败: {(skillsError as Error).message}</p>
              </div>
            )}

            {skills && skills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无可用技能</p>
              </div>
            )}

            {skills && skills.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    isEnabled={enabledSkills.has(skill.name)}
                    onToggle={handleToggleSkill}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
