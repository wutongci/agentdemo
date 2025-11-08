import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useSendMessage } from '../hooks/useSession'
import { useWebSocket } from '../hooks/useWebSocket'
import { ActiveSkillsBadge } from './skills/ActiveSkillsBadge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import '../lib/markdown.css'
import type { WSMessage, Message } from '../types'
import { api } from '../services/api'

interface ToolExecution {
  name: string
  status: 'running' | 'completed' | 'error'
  error?: string
  timestamp: number
}

interface ChatPanelProps {
  sessionId: string | null
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendMessage = useSendMessage()
  const { isConnected, currentMessage, subscribe } = useWebSocket(sessionId)
  const loadedSessionRef = useRef<string | null>(null)

  // 加载历史消息 - 独立的 useEffect，只在 sessionId 变化时触发
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      loadedSessionRef.current = null
      return
    }

    // 如果已经加载过这个 session，不重复加载
    if (loadedSessionRef.current === sessionId) {
      return
    }

    const loadMessages = async () => {
      try {
        console.log('[ChatPanel] Loading messages for session:', sessionId)
        const response = await api.getMessages(sessionId)
        console.log('[ChatPanel] API response:', response)
        const history = response.messages || []
        console.log('[ChatPanel] Loaded messages:', history.length, 'messages')
        setMessages(history)
        loadedSessionRef.current = sessionId
      } catch (error) {
        console.error('[ChatPanel] Failed to load message history:', error)
        loadedSessionRef.current = sessionId // 标记为已尝试加载，避免重试
      }
    }
    loadMessages()
  }, [sessionId]) // 只依赖 sessionId

  // WebSocket 订阅 - 独立的 useEffect
  useEffect(() => {
    if (!sessionId) {
      return
    }

    // 订阅 WebSocket 消息
    const unsubscribe = subscribe((message: WSMessage) => {
      if (message.type === 'text_start') {
        setIsTyping(true)
        // 清除上一次的工具执行记录
        setToolExecutions([])
      } else if (message.type === 'tool_start') {
        // 工具开始执行
        setToolExecutions(prev => [
          ...prev,
          {
            name: message.data?.name || '未知工具',
            status: 'running',
            timestamp: Date.now(),
          },
        ])
      } else if (message.type === 'tool_end') {
        // 工具执行完成
        const toolName = message.data?.name
        setToolExecutions(prev =>
          prev.map(tool =>
            tool.name === toolName && tool.status === 'running'
              ? { ...tool, status: 'completed' as const }
              : tool
          )
        )
      } else if (message.type === 'tool_error') {
        // 工具执行错误
        const toolName = message.data?.name
        const error = message.data?.error || '执行失败'
        setToolExecutions(prev =>
          prev.map(tool =>
            tool.name === toolName && tool.status === 'running'
              ? { ...tool, status: 'error' as const, error }
              : tool
          )
        )
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
        // 工具执行列表会在下次 text_start 时清除，保持可见
      }
    })

    return unsubscribe
  }, [sessionId, subscribe]) // 不依赖 currentMessage，避免重复触发

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
    const messageContent = input
    setInput('')
    setError(null) // 清除之前的错误

    try {
      await sendMessage.mutateAsync({ sessionId, message: messageContent })
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage = error instanceof Error ? error.message : '发送消息失败，请稍后重试'
      setError(errorMessage)
      // 3秒后自动清除错误提示
      setTimeout(() => setError(null), 5000)
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

      {/* 工具执行指示器 */}
      {toolExecutions.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900">
          <div className="space-y-1">
            {toolExecutions.map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {tool.status === 'running' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <Wrench className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-900 dark:text-blue-100">
                      正在执行工具: <span className="font-medium">{tool.name}</span>
                    </span>
                  </>
                )}
                {tool.status === 'completed' && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <Wrench className="w-3 h-3 text-green-600" />
                    <span className="text-green-900 dark:text-green-100">
                      工具完成: <span className="font-medium">{tool.name}</span>
                    </span>
                  </>
                )}
                {tool.status === 'error' && (
                  <>
                    <XCircle className="w-3 h-3 text-red-600" />
                    <Wrench className="w-3 h-3 text-red-600" />
                    <span className="text-red-900 dark:text-red-100">
                      工具错误: <span className="font-medium">{tool.name}</span>
                      {tool.error && <span className="text-xs ml-1">- {tool.error}</span>}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !currentMessage && (
          <div className="text-center text-muted-foreground py-8">
            <p>开始对话吧！</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isUserMessage = message.role === 'user'
          const markdownClasses = 'markdown-body text-sm'

          return (
            <div
              key={index}
              className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  isUserMessage
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-muted'
                }`}
                style={{ color: '#111827', opacity: 1 }}
              >
                <div className={markdownClasses} style={{ color: 'inherit' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )
        })}

        {/* 实时输入中的消息 */}
        {isTyping && currentMessage && (
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-lg px-4 py-2 bg-muted border border-blue-100 dark:border-blue-800 shadow-sm"
              style={{ color: '#111827', opacity: 1 }}
            >
              <div className="markdown-body text-sm" style={{ color: 'inherit' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {currentMessage}
                </ReactMarkdown>
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs font-medium">AI 正在输入...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 - 固定在底部，支持拖动增高 */}
      <div className="p-3 border-t sticky bottom-0 bg-background">
        {/* 错误提示 */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ {error}
            </p>
          </div>
        )}

        {/* 显示激活的 Skills */}
        {input.trim() && <ActiveSkillsBadge message={input} />}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (试试输入 /analyze 或包含'安全'、'质量'等关键词)"
            className="min-h-[80px] max-h-[40vh] resize-y"
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
