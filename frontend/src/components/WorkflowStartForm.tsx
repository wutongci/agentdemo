import { useState } from 'react';
import { useStartWorkflow } from '../hooks/useWorkflow';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface WorkflowStartFormProps {
  onWorkflowStarted: (workflowId: string) => void;
}

export function WorkflowStartForm({ onWorkflowStarted }: WorkflowStartFormProps) {
  const [topic, setTopic] = useState('');
  const [requirements, setRequirements] = useState('');
  const startWorkflow = useStartWorkflow();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('请输入文章主题');
      return;
    }

    try {
      console.log('[WorkflowStartForm] Starting workflow with:', { topic: topic.trim(), requirements: requirements.trim() || '无特殊要求' });
      
      const result = await startWorkflow.mutateAsync({
        topic: topic.trim(),
        requirements: requirements.trim() || '无特殊要求',
      });

      console.log('[WorkflowStartForm] Workflow started successfully:', result);
      onWorkflowStarted(result.workflow_id);

      // 清空表单
      setTopic('');
      setRequirements('');
    } catch (error) {
      console.error('[WorkflowStartForm] Failed to start workflow:', error);
      const errorMessage = error instanceof Error ? error.message : '启动工作流失败，请重试';
      alert(`启动工作流失败: ${errorMessage}`);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">🚀 启动写作协作</h2>
      <p className="text-gray-600 mb-6">
        三个专业 Agent 将协作完成您的写作任务：研究员生成大纲 → 作家撰写内容 → 编辑审校润色
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            文章主题 *
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：人工智能在教育领域的应用"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            具体要求
          </label>
          <Textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="描述您的具体要求，如文章风格、目标读者、重点内容等..."
            rows={4}
          />
        </div>

        <Button
          type="submit"
          disabled={startWorkflow.isPending}
          className="w-full"
        >
          {startWorkflow.isPending ? '启动中...' : '启动工作流'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-2">💡 提示</p>
        <ul className="space-y-1 text-blue-800">
          <li>• 工作流将自动创建三个 Agent 进行协作</li>
          <li>• 您可以实时看到每个 Agent 的工作进度</li>
          <li>• 所有文件操作和工具调用都会被记录</li>
          <li>• 完成后可以下载大纲、草稿和终稿</li>
        </ul>
      </div>
    </Card>
  );
}

