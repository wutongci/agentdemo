import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '../types'

const WS_BASE_URL = 'ws://localhost:8080/ws'

// 流式输出缓冲配置
const FLUSH_INTERVAL = 30        // 主缓冲时间(毫秒) - 缩短以更快响应
const MAX_BUFFER_SIZE = 80       // 最大缓冲字符数 - 降低以更频繁刷新
const SENTENCE_ENDINGS = /[。!?！？\n，,；;：:、]$/  // 句子结束标识 - 增加更多中文标点

export function useWebSocket(sessionId: string | null) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const listeners = useRef<Set<(message: WSMessage) => void>>(new Set())

  // 缓冲相关 refs
  const bufferRef = useRef<string>('')           // 缓冲区
  const flushTimerRef = useRef<number | null>(null)  // 定时器
  const accumulatedTextRef = useRef<string>('')  // 已显示的累积文本

  // 刷新缓冲区到 UI
  const flushBuffer = useCallback(() => {
    if (bufferRef.current) {
      const textToFlush = bufferRef.current
      bufferRef.current = ''

      // 更新累积文本
      accumulatedTextRef.current += textToFlush
      setCurrentMessage(accumulatedTextRef.current)
    }

    // 清除定时器
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  // 添加文本到缓冲区
  const addToBuffer = useCallback((delta: string) => {
    bufferRef.current += delta

    // 检查是否应该立即刷新
    const shouldFlushImmediately =
      // 条件1: 遇到句子结束符
      SENTENCE_ENDINGS.test(bufferRef.current) ||
      // 条件2: 缓冲区超过最大大小
      bufferRef.current.length >= MAX_BUFFER_SIZE

    if (shouldFlushImmediately) {
      // 立即刷新
      const reason = SENTENCE_ENDINGS.test(bufferRef.current) ? '句子结束' : '缓冲区满'
      console.log(`[Buffer] 立即刷新 (${reason}), 内容:`, bufferRef.current)
      flushBuffer()
    } else {
      // 启动/重启定时器
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current)
      }

      flushTimerRef.current = window.setTimeout(() => {
        console.log('[Buffer] 定时器触发刷新, 内容:', bufferRef.current)
        flushBuffer()
      }, FLUSH_INTERVAL)
    }
  }, [flushBuffer])

  // 重置所有流式状态
  const resetStreamingState = useCallback(() => {
    bufferRef.current = ''
    accumulatedTextRef.current = ''
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!sessionId || ws.current?.readyState === WebSocket.OPEN) return

    const socket = new WebSocket(`${WS_BASE_URL}/${sessionId}`)

    socket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)

        // 使用缓冲机制处理文本块
        if (message.type === 'text_chunk') {
          console.log('[WS] 收到 text_chunk:', message.data.delta)
          addToBuffer(message.data.delta)
        } else if (message.type === 'text_start') {
          // 重置状态
          resetStreamingState()
          setCurrentMessage('')
        } else if (message.type === 'done') {
          // 强制刷新剩余缓冲区
          flushBuffer()
        }

        // 通知所有监听器
        listeners.current.forEach(listener => listener(message))
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      // 清理缓冲区
      resetStreamingState()
      // 尝试重连
      setTimeout(() => {
        if (sessionId) connect()
      }, 3000)
    }

    ws.current = socket
  }, [sessionId, addToBuffer, flushBuffer, resetStreamingState])

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
      setIsConnected(false)
      resetStreamingState()
    }
  }, [resetStreamingState])

  const subscribe = useCallback((listener: (message: WSMessage) => void) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  useEffect(() => {
    if (sessionId) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [sessionId, connect, disconnect])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    currentMessage,
    subscribe,
    connect,
    disconnect,
  }
}
