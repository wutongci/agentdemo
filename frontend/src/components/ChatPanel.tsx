import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useSendMessage } from '../hooks/useSession'
import { useWebSocket } from '../hooks/useWebSocket'
import { ActiveSkillsBadge } from './skills/ActiveSkillsBadge'
import ReactMarkdown from 'react-markdown'
import type { WSMessage, Message } from '../types'

interface ChatPanelProps {
  sessionId: string | null
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendMessage = useSendMessage()
  const { isConnected, currentMessage, subscribe } = useWebSocket(sessionId)

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }

    // 订阅 WebSocket 消息
    const unsubscribe = subscribe((message: WSMessage) => {
      if (message.type === 'text_start') {
        setIsTyping(true)
      } else if (message.type === 'done') {
        setIsTyping(false)
        // 将当前消息添加到历史
        if (currentMessage) {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: currentMessage,
              timestamp: new Date().toISOString(),
            },
          ])
        }
      }
    })

    return unsubscribe
  }, [sessionId, subscribe, currentMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentMessage])

  const handleSend = async () => {
    if (!input.trim() || !sessionId || sendMessage.isPending) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      await sendMessage.mutateAsync({ sessionId, message: input })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">👋 欢迎使用 AI 写作助手</p>
          <p className="mt-2">请在左侧创建或选择一个会话开始</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 连接状态 */}
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <h2 className="font-semibold">对话区</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !currentMessage && (
          <div className="text-center text-muted-foreground py-8">
            <p>开始对话吧！</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* 实时输入中的消息 */}
        {isTyping && currentMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{currentMessage}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">输入中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="p-4 border-t">
        {/* 显示激活的 Skills */}
        {input.trim() && <ActiveSkillsBadge message={input} />}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (试试输入 /analyze 或包含'安全'、'质量'等关键词)"
            className="min-h-[60px] max-h-[200px]"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
            className="shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

