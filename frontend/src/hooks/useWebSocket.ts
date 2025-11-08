import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '../types'

const WS_BASE_URL = 'ws://localhost:8080/ws'

export function useWebSocket(sessionId: string | null) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const listeners = useRef<Set<(message: WSMessage) => void>>(new Set())

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
        
        // 如果是文本块，累积消息
        if (message.type === 'text_chunk') {
          setCurrentMessage(prev => prev + message.data.delta)
        } else if (message.type === 'text_start') {
          setCurrentMessage('')
        } else if (message.type === 'done') {
          // 消息完成，可以清空或保持
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
      // 尝试重连
      setTimeout(() => {
        if (sessionId) connect()
      }, 3000)
    }

    ws.current = socket
  }, [sessionId])

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
      setIsConnected(false)
    }
  }, [])

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

  return {
    isConnected,
    currentMessage,
    subscribe,
    connect,
    disconnect,
  }
}

