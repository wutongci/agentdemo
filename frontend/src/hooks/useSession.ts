import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: api.listSessions,
  })
}

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionId ? api.getSession(sessionId) : null,
    enabled: !!sessionId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (title?: string) => api.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sessionId: string) => api.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      api.sendMessage(sessionId, message),
  })
}

