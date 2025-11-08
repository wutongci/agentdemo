import { useState } from 'react'
import { SessionList } from './SessionList'
import { ChatPanel } from './ChatPanel'
import { DocumentEditor } from './DocumentEditor'
import { ToolBar } from './ToolBar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

export function Layout() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* 左侧：会话列表 */}
      <div
        className={`border-r transition-all duration-300 ${
          isLeftPanelCollapsed ? 'w-0' : 'w-64'
        } overflow-hidden`}
      >
        <SessionList
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
        />
      </div>

      {/* 折叠按钮 */}
      <div className="flex items-start pt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
        >
          {isLeftPanelCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* 中间：文档编辑器 + 工具栏（在顶部留白，与导航分离） */}
      <div className="flex-1 flex flex-col min-w-0 border-r pt-3 px-3">
        {/* 编辑器 */}
        <div className="flex-1 min-h-0">
          <DocumentEditor onTextSelect={setSelectedText} />
        </div>

        {/* 工具栏 */}
        <div className="border-t p-4">
          <ToolBar selectedText={selectedText} />
        </div>
      </div>

      {/* 右侧：对话区（加宽并在顶部留白） */}
      <div className="w-[520px] md:w-[560px] xl:w-[640px] flex flex-col min-h-0 shrink-0 pt-3 pr-3">
        <ChatPanel sessionId={currentSessionId} />
      </div>
    </div>
  )
}
