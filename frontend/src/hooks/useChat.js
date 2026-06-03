import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

export function useChat({ language, currentVehicle }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [error, setError] = useState(null)

  const conversationRef = useRef([])

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isLoading) return null

    const userMessage = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    conversationRef.current = [...conversationRef.current, { role: 'user', content: text }]

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/chat', {
        message: text,
        conversation_id: conversationId,
        conversation_history: conversationRef.current.slice(-10), // Last 10 turns
        current_vehicle: currentVehicle?.id || null,
        language: language,
      })

      const { response: aiText, conversation_id, profile_update, current_profile } = response.data

      // Update conversation ID
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id)
      }

      // Update profile
      if (current_profile) {
        setProfile(current_profile)
      }

      const assistantMessage = {
        role: 'assistant',
        content: aiText,
        timestamp: Date.now(),
        profileUpdate: profile_update,
      }

      setMessages(prev => [...prev, assistantMessage])
      conversationRef.current = [...conversationRef.current, { role: 'assistant', content: aiText }]

      return {
        text: aiText,
        profile: current_profile,
        shouldCaptureLead: current_profile?.should_capture_lead || false,
      }

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Connection error. Please try again.'
      setError(errorMsg)
      console.error('Chat error:', err)

      const errorMessage = {
        role: 'assistant',
        content: language === 'ar'
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : "I apologize — I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
        isError: true,
      }
      setMessages(prev => [...prev, errorMessage])
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, currentVehicle, language])

  const reset = useCallback(() => {
    setMessages([])
    setProfile(null)
    setConversationId(null)
    setError(null)
    conversationRef.current = []
  }, [])

  return {
    messages,
    isLoading,
    profile,
    conversationId,
    error,
    sendMessage,
    reset,
  }
}
