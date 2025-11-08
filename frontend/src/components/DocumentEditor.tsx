import { useState } from 'react'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Card } from './ui/card'
import ReactMarkdown from 'react-markdown'
import { Eye, Edit3 } from 'lucide-react'

interface DocumentEditorProps {
  onTextSelect?: (text: string) => void
}

export function DocumentEditor({ onTextSelect }: DocumentEditorProps) {
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <h2 className="font-semibold">文档编辑器</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? (
            <>
              <Edit3 className="w-4 h-4" />
              编辑
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              预览
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-4">
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{content || '*暂无内容*'}</ReactMarkdown>
              </div>
            </Card>
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMouseUp={handleTextSelection}
            placeholder="在此输入或粘贴你的文本...

支持 Markdown 格式：
- **粗体**
- *斜体*
- # 标题
- [链接](url)
等等..."
            className="h-full resize-none rounded-none border-0 focus-visible:ring-0"
          />
        )}
      </div>
    </div>
  )
}

