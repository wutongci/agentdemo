import { useState } from 'react';
import { useWorkflowArtifacts } from '../hooks/useWorkflow';
import { Card } from './ui/card';
import ReactMarkdown from 'react-markdown';

interface ArtifactViewerProps {
  workflowId: string | null;
}

type ArtifactType = 'outline' | 'draft' | 'final';

export function ArtifactViewer({ workflowId }: ArtifactViewerProps) {
  const { data: artifacts, isLoading } = useWorkflowArtifacts(workflowId);
  const [activeTab, setActiveTab] = useState<ArtifactType>('outline');

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

  const tabs: { key: ArtifactType; label: string; icon: string }[] = [
    { key: 'outline', label: '大纲', icon: '📋' },
    { key: 'draft', label: '草稿', icon: '📝' },
    { key: 'final', label: '终稿', icon: '✅' },
  ];

  const currentContent = artifacts?.[activeTab] || '';
  const hasContent = currentContent.length > 0;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">文档产物</h2>

      {/* 标签页 */}
      <div className="flex gap-2 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="min-h-[400px]">
        {hasContent ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{currentContent}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">暂无内容</p>
              <p className="text-sm">
                {activeTab === 'outline' && '研究员正在生成大纲...'}
                {activeTab === 'draft' && '作家正在撰写草稿...'}
                {activeTab === 'final' && '编辑正在审校终稿...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 下载按钮 */}
      {hasContent && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => downloadArtifact(activeTab, currentContent)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            下载 {tabs.find((t) => t.key === activeTab)?.label}
          </button>
        </div>
      )}
    </Card>
  );
}

function downloadArtifact(type: ArtifactType, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

