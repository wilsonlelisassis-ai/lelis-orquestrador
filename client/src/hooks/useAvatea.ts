/**
 * useAvatea — Hook principal do AVATEA
 * Usa tRPC para chamar o backend (Express), que chama LLM + ElevenLabs TTS.
 * O SimliClient WebRTC é gerenciado diretamente no componente Chat.tsx.
 */
import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc'

export type Persona = 'doutora_sofia' | 'professor_joao' | 'amigo_casual' | 'medica_especialista'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatState {
  persona: Persona
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface SendMessageResult {
  text: string
  audioBase64: string | null
  imageUrl: string | null
}

export function useAvatea() {
  const [state, setState] = useState<ChatState>({
    persona: 'doutora_sofia',
    messages: [],
    isLoading: false,
    error: null,
  })

  const sendMessageMutation = trpc.avatar.sendMessage.useMutation()

  const sendMessage = useCallback(async (text: string): Promise<SendMessageResult | null> => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      error: null,
    }))

    try {
      const history = state.messages.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const data = await sendMessageMutation.mutateAsync({
        message: text,
        persona: state.persona,
        history,
      })

      const aiText = data.text || 'Desculpe, não consegui processar sua pergunta.'

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        isLoading: false,
      }))

      return {
        text: aiText,
        audioBase64: data.audioBase64 ?? null,
        imageUrl: data.imageUrl ?? null,
      }
    } catch (e) {
      console.error('Erro no sendMessage:', e)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Erro desconhecido',
      }))
      return null
    }
  }, [state.messages, state.persona, sendMessageMutation])

  const setPersona = useCallback((persona: Persona) => {
    setState(prev => ({ ...prev, persona }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    sendMessage,
    setPersona,
    clearError,
  }
}
