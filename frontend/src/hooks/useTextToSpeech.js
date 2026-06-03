import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

export function useTextToSpeech({ onSpeakStart, onSpeakEnd, onError }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef(null)
  const abortRef = useRef(null)

  const speak = useCallback(async (text, language = 'en') => {
    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (!text?.trim()) return

    try {
      abortRef.current = new AbortController()

      const response = await axios.post(
        '/api/tts',
        { text, language },
        {
          responseType: 'blob',
          signal: abortRef.current.signal,
          timeout: 30000,
        }
      )

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsSpeaking(true)
        onSpeakStart?.()
      }

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        onSpeakEnd?.()
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        onSpeakEnd?.()
        onError?.('tts_error')
      }

      await audio.play()

    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return // Intentionally cancelled
      }
      setIsSpeaking(false)
      onError?.('tts_error')
      console.error('TTS error:', err)
      onSpeakEnd?.()
    }
  }, [onSpeakStart, onSpeakEnd, onError])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setIsSpeaking(false)
    onSpeakEnd?.()
  }, [onSpeakEnd])

  return { speak, stop, isSpeaking }
}
