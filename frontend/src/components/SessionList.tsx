import { Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useSessions, useCreateSession, useDeleteSession } from '../hooks/useSession'
import type { Session } from '../types'

interface SessionListProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
}

export function SessionList({ currentSessionId, onSelectSession }: SessionListProps) {
  const { data: sessions, isLoading } = useSessions()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()

  const handleCreateSession = async () => {
    const session = await createSession.mutateAsync(undefined)
    onSelectSession(session.id)
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个会话吗？')) {
      await deleteSession.mutateAsync(sessionId)
      if (currentSessionId === sessionId) {
        onSelectSession('')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button
          onClick={handleCreateSession}
          className="w-full"
          disabled={createSession.isPending}
        >
          <Plus className="w-4 h-4" />
          新建会话
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions && sessions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>暂无会话</p>
            <p className="text-sm mt-2">点击上方按钮创建新会话</p>
          </div>
        )}

        {sessions?.map((session: Session) => (
          <Card
            key={session.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
              currentSessionId === session.id ? 'bg-accent border-primary' : ''
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{session.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(session.updated_at).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => handleDeleteSession(session.id, e)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

