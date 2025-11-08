import type { Session, WritingToolResponse } from '../types'

const API_BASE_URL = 'http://localhost:8080/api'

export const api = {
  // 会话管理
  async createSession(title?: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || '新写作会话' }),
    })
    if (!response.ok) throw new Error('Failed to create session')
    return response.json()
  },

  async listSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/sessions`)
    if (!response.ok) throw new Error('Failed to list sessions')
    return response.json()
  },

  async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`)
    if (!response.ok) throw new Error('Failed to get session')
    return response.json()
  },

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete session')
  },

  // 消息
  async sendMessage(sessionId: string, message: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (!response.ok) throw new Error('Failed to send message')
    return response.json()
  },

  async getMessages(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`)
    if (!response.ok) throw new Error('Failed to get messages')
    return response.json()
  },

  // 写作工具
  async polishText(text: string): Promise<WritingToolResponse> {
    const response = await fetch(`${API_BASE_URL}/writing/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error('Failed to polish text')
    return response.json()
  },

  async rewriteText(text: string, style?: string): Promise<WritingToolResponse> {
    const response = await fetch(`${API_BASE_URL}/writing/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style }),
    })
    if (!response.ok) throw new Error('Failed to rewrite text')
    return response.json()
  },

  async expandText(text: string): Promise<WritingToolResponse> {
    const response = await fetch(`${API_BASE_URL}/writing/expand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error('Failed to expand text')
    return response.json()
  },

  async summarizeText(text: string): Promise<WritingToolResponse> {
    const response = await fetch(`${API_BASE_URL}/writing/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error('Failed to summarize text')
    return response.json()
  },

  async translateText(text: string, language: string): Promise<WritingToolResponse> {
    const response = await fetch(`${API_BASE_URL}/writing/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    })
    if (!response.ok) throw new Error('Failed to translate text')
    return response.json()
  },
}

