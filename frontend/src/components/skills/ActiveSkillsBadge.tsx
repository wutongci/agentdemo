import { useEffect, useState } from 'react';

interface ActiveSkillsBadgeProps {
  message: string;
}

// Skills 关键词映射
const skillKeywords: Record<string, string[]> = {
  'best-practices': ['最佳实践', 'best practice', '规范', '标准', '如何', '应该', 'SOLID', 'DRY', 'KISS'],
  'code-quality': ['质量', 'quality', '重构', 'refactor', '优化', 'optimize', '复杂度', 'complexity'],
  'security': ['安全', 'security', '漏洞', 'vulnerability', '攻击', '认证', '授权', 'OWASP'],
};

// 技能显示名称
const skillDisplayNames: Record<string, string> = {
  'best-practices': '最佳实践',
  'code-quality': '代码质量',
  'security': '安全检查',
};

export function ActiveSkillsBadge({ message }: ActiveSkillsBadgeProps) {
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [isCommand, setIsCommand] = useState(false);
  const [commandName, setCommandName] = useState('');

  useEffect(() => {
    const lowerMessage = message.toLowerCase();

    // 检测 Slash Command
    if (message.trim().startsWith('/')) {
      setIsCommand(true);
      const parts = message.trim().split(/\s+/);
      setCommandName(parts[0].substring(1));
    } else {
      setIsCommand(false);
      setCommandName('');
    }

    // 检测激活的 Skills
    const activated: string[] = [];
    for (const [skillName, keywords] of Object.entries(skillKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          activated.push(skillName);
          break;
        }
      }
    }
    setActiveSkills(activated);
  }, [message]);

  if (!isCommand && activeSkills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Slash Command 提示 */}
      {isCommand && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-medium text-blue-700">
            执行命令: <code className="px-1.5 py-0.5 bg-blue-100 rounded">/{commandName}</code>
          </span>
        </div>
      )}

      {/* 激活的 Skills */}
      {activeSkills.length > 0 && (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-md">
          <span className="text-lg">🧠</span>
          <span className="text-sm text-purple-700">激活技能:</span>
          <div className="flex gap-1">
            {activeSkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded"
              >
                {skillDisplayNames[skill] || skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
