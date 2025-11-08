import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  Sparkles,
  RefreshCw,
  Maximize2,
  FileText,
  Languages,
  Loader2,
} from 'lucide-react'
import { api } from '../services/api'

interface ToolBarProps {
  selectedText: string
  onProcessedText?: (text: string) => void
}

export function ToolBar({ selectedText, onProcessedText }: ToolBarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleAction = async (
    action: string,
    apiCall: () => Promise<any>
  ) => {
    if (!selectedText) {
      alert('请先在编辑器中选择文本')
      return
    }

    setIsProcessing(true)
    setActiveAction(action)

    try {
      const result = await apiCall()
      if (onProcessedText) {
        onProcessedText(result.processed_text)
      }
      
      // 显示结果
      const confirmed = confirm(
        `原文：\n${result.original_text}\n\n${action}后：\n${result.processed_text}\n\n是否替换原文？`
      )
      
      if (confirmed && onProcessedText) {
        // 这里可以添加替换逻辑
      }
    } catch (error) {
      console.error('处理失败:', error)
      alert('处理失败，请重试')
    } finally {
      setIsProcessing(false)
      setActiveAction(null)
    }
  }

  const tools = [
    {
      id: 'polish',
      name: '润色',
      icon: Sparkles,
      description: '优化表达和语法',
      action: () => handleAction('润色', () => api.polishText(selectedText)),
    },
    {
      id: 'rewrite',
      name: '改写',
      icon: RefreshCw,
      description: '换种方式表达',
      action: () => handleAction('改写', () => api.rewriteText(selectedText)),
    },
    {
      id: 'expand',
      name: '扩写',
      icon: Maximize2,
      description: '增加细节和内容',
      action: () => handleAction('扩写', () => api.expandText(selectedText)),
    },
    {
      id: 'summarize',
      name: '总结',
      icon: FileText,
      description: '提炼核心要点',
      action: () => handleAction('总结', () => api.summarizeText(selectedText)),
    },
    {
      id: 'translate',
      name: '翻译',
      icon: Languages,
      description: '翻译成英文',
      action: () =>
        handleAction('翻译', () => api.translateText(selectedText, '英文')),
    },
  ]

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">写作工具</h3>
      
      {selectedText && (
        <div className="mb-3 p-2 bg-muted rounded text-xs">
          <p className="text-muted-foreground">已选择文本：</p>
          <p className="mt-1 line-clamp-2">{selectedText}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeAction === tool.id
          
          return (
            <Button
              key={tool.id}
              variant="outline"
              className="h-auto flex-col items-start p-3"
              onClick={tool.action}
              disabled={isProcessing || !selectedText}
            >
              <div className="flex items-center gap-2 w-full">
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="font-medium">{tool.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-left">
                {tool.description}
              </p>
            </Button>
          )
        })}
      </div>

      {!selectedText && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          在编辑器中选择文本后，即可使用写作工具
        </p>
      )}
    </Card>
  )
}

