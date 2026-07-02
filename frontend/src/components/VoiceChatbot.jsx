import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import AudioVisualizer from './AudioVisualizer'
import LeadCaptureForm from './LeadCaptureForm'
import CustomerProfilePanel from './CustomerProfilePanel'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import { useChat } from '../hooks/useChat'

// 'idle' | 'listening' | 'thinking' | 'speaking'
function useVoiceState() {
  const [voiceState, setVoiceState] = useState('idle')
  return { voiceState, setVoiceState }
}

export default function VoiceChatbot({ isOpen, onClose, language, currentVehicle }) {
  const isArabic = language === 'ar'
  const { voiceState, setVoiceState } = useVoiceState()
  const [showProfile, setShowProfile] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [autoListen, setAutoListen] = useState(false)
  const [micError, setMicError] = useState(false)

  const messagesEndRef = useRef(null)
  const textInputRef = useRef(null)

  const { messages, isLoading, profile, conversationId, sendMessage, reset } = useChat({
    language,
    currentVehicle,
  })

  // TTS
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
    onSpeakStart: () => setVoiceState('speaking'),
    onSpeakEnd: () => {
      setVoiceState('idle')
      if (autoListen) {
        // Use a longer delay (1200ms) so the speaker audio fully decays before
        // we open the mic. This prevents the mic from capturing the tail of
        // the AI's speech, which causes Whisper hallucinations (e.g. Korean).
        setTimeout(() => startRecording(), 1200)
      }
    },
    onError: () => setVoiceState('idle'),
  })

  // STT
  const handleAudioReady = useCallback(async (audioBlob, mimeType) => {
    setVoiceState('thinking')
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording.${mimeType.split('/')[1]?.split(';')[0] || 'webm'}`)
      // Pass the UI language as a hint so Whisper is pinned to the correct
      // language and won't hallucinate Korean (or other languages) when the
      // mic picks up echo/overlap from the AI's own speech output.
      formData.append('language', language)

      const { data } = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      })

      if (data.text?.trim()) {
        const result = await sendMessage(data.text)
        if (result?.text) {
          if (result.shouldCaptureLead && !leadCaptured) {
            setShowLeadForm(true)
          }
          await speak(result.text, language)
        } else {
          setVoiceState('idle')
        }
      } else {
        setVoiceState('idle')
      }
    } catch (err) {
      console.error('STT error:', err)
      setVoiceState('idle')
    }
  }, [sendMessage, speak, language, leadCaptured])

  const { isRecording, hasPermission, audioLevel, startRecording, stopRecording, toggleRecording } = useAudioRecorder({
    onAudioReady: handleAudioReady,
    onError: (err) => {
      if (err === 'microphone_denied') setMicError(true)
      setVoiceState('idle')
    },
    // Recording was dropped as too quiet/short — return UI to idle so it
    // doesn't stay stuck on "Listening…".
    onDiscarded: () => setVoiceState('idle'),
  })

  // Sync voiceState with recording
  useEffect(() => {
    if (isRecording) {
      setVoiceState('listening')
    }
  }, [isRecording])

  useEffect(() => {
    if (isLoading) {
      setVoiceState('thinking')
    }
  }, [isLoading])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Space bar push-to-talk
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && document.activeElement !== textInputRef.current) {
        e.preventDefault()
        if (!isRecording && voiceState === 'idle') {
          startRecording()
        } else if (isSpeaking) {
          // Barge-in: stop AI speech and start listening after a short decay
          stopSpeaking()
          setTimeout(() => startRecording(), 600)
        }
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && document.activeElement !== textInputRef.current) {
        e.preventDefault()
        if (isRecording) {
          stopRecording(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isOpen, isRecording, voiceState, isSpeaking, startRecording, stopRecording, stopSpeaking])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording(false)
      stopSpeaking()
      setVoiceState('idle')
    }
  }, [isOpen, stopRecording, stopSpeaking])

  const handleTextSend = async () => {
    const text = textInput.trim()
    if (!text || isLoading) return
    setTextInput('')

    setVoiceState('thinking')
    const result = await sendMessage(text)
    if (result?.text) {
      if (result.shouldCaptureLead && !leadCaptured) {
        setShowLeadForm(true)
      }
      await speak(result.text, language)
    } else {
      setVoiceState('idle')
    }
  }

  const handleMicToggle = () => {
    if (isSpeaking) {
      // Stop AI speech, then wait for speaker audio to decay before recording.
      // This prevents Whisper from capturing the AI's voice echo and producing
      // hallucinated transcriptions (e.g. Korean text from garbled audio).
      stopSpeaking()
      setTimeout(() => startRecording(), 600)
      return
    }
    if (isRecording) {
      stopRecording(true)
    } else if (voiceState === 'idle') {
      startRecording()
    }
  }

  const handleClose = () => {
    stopRecording(false)
    stopSpeaking()
    setVoiceState('idle')
    greetedRef.current = false
    onClose()
  }

  // Send greeting on first open
  const greetedRef = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      greetedRef.current = false
      return
    }
    if (greetedRef.current) return
    greetedRef.current = true

    const greeting = isArabic
      ? 'مرحباً بك في Genesis. أنا مستشارك الشخصي. كيف يمكنني مساعدتك اليوم؟'
      : currentVehicle
        ? `Welcome to Genesis. I see you're interested in the ${currentVehicle.name}. I'd be happy to tell you more about it or help you find the perfect Genesis for you. What would you like to know?`
        : "Welcome to Genesis. I'm your personal AI concierge. Whether you're looking for a powerful sedan, a luxury SUV, or an electric vehicle — I'm here to guide you. What brings you in today?"

    speak(greeting, language)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex"
            style={{ width: showProfile ? '780px' : '480px' }}
          >
            {/* Profile sidebar */}
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 280 }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-shrink-0 bg-genesis-charcoal border-r border-genesis-border overflow-y-auto p-4"
                >
                  <p className="text-genesis-copper text-xs tracking-widest uppercase mb-4">
                    Live Insights
                  </p>
                  <CustomerProfilePanel profile={profile} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main chat panel */}
            <div className="flex-1 flex flex-col bg-genesis-charcoal border-l border-genesis-border min-w-0">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-genesis-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-genesis-copper/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#C4956A">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Genesis AI</p>
                    <p className="text-genesis-muted text-xs">
                      {voiceState === 'listening' && (isArabic ? 'يستمع...' : 'Listening...')}
                      {voiceState === 'thinking' && (isArabic ? 'يفكر...' : 'Thinking...')}
                      {voiceState === 'speaking' && (isArabic ? 'يتحدث...' : 'Speaking...')}
                      {voiceState === 'idle' && (isArabic ? 'جاهز للمساعدة' : 'Ready to assist')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto-listen toggle */}
                  <button
                    onClick={() => setAutoListen(v => !v)}
                    title={autoListen ? 'Auto-listen on' : 'Auto-listen off'}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      autoListen
                        ? 'border-genesis-copper text-genesis-copper bg-genesis-copper/10'
                        : 'border-genesis-border text-genesis-muted'
                    }`}
                  >
                    Auto
                  </button>

                  {/* Profile toggle */}
                  <button
                    onClick={() => setShowProfile(v => !v)}
                    title="Toggle profile panel"
                    className={`p-2 rounded-lg border transition-all ${
                      showProfile
                        ? 'border-genesis-copper bg-genesis-copper/10 text-genesis-copper'
                        : 'border-genesis-border text-genesis-muted hover:text-genesis-silver'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/>
                    </svg>
                  </button>

                  {/* Close */}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg border border-genesis-border text-genesis-muted hover:text-white hover:border-genesis-silver transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Audio Visualizer — the primary, unified voice control */}
              <div className="flex-shrink-0 py-8 flex justify-center border-b border-genesis-border bg-genesis-black/30">
                <AudioVisualizer
                  state={voiceState}
                  audioLevel={audioLevel}
                  onTap={handleMicToggle}
                  isArabic={isArabic}
                  disabled={voiceState === 'thinking'}
                />
              </div>

              {/* Conversation transcript */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.filter(m => m.content !== '__greeting__').map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-genesis-copper/20 border border-genesis-copper/30 text-white rounded-br-sm'
                          : msg.isError
                          ? 'bg-red-900/20 border border-red-700/30 text-red-300 rounded-bl-sm'
                          : 'bg-genesis-panel border border-genesis-border text-genesis-silver rounded-bl-sm'
                      }`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    >
                      {msg.role === 'assistant' && !msg.isError && (
                        <p className="text-genesis-copper text-xs font-medium mb-1.5 tracking-wider">
                          GENESIS AI
                        </p>
                      )}
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Lead capture form */}
                {showLeadForm && !leadCaptured && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-0"
                  >
                    <LeadCaptureForm
                      conversationId={conversationId}
                      profile={profile}
                      language={language}
                      onComplete={(name) => {
                        setShowLeadForm(false)
                        setLeadCaptured(true)
                        if (name) {
                          const confirmMsg = isArabic
                            ? `شكراً لك ${name}! سنتواصل معك قريباً.`
                            : `Thank you, ${name}! We'll reach out shortly with personalized recommendations.`
                          speak(confirmMsg, language)
                        }
                      }}
                    />
                  </motion.div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-genesis-panel border border-genesis-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-genesis-copper"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Mic error notice */}
              {micError && (
                <div className="flex-shrink-0 px-5 py-2 bg-amber-900/20 border-t border-amber-700/30">
                  <p className="text-amber-300 text-xs">
                    {isArabic
                      ? 'الميكروفون غير متاح. يرجى استخدام مربع النص.'
                      : 'Microphone unavailable — use the text input below.'
                    }
                  </p>
                </div>
              )}

              {/* Current vehicle context */}
              {currentVehicle && (
                <div className="flex-shrink-0 px-5 py-2 bg-genesis-black/40 border-t border-genesis-border flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#C4956A">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                  <p className="text-genesis-muted text-xs">
                    {isArabic ? 'تتصفح' : 'Currently viewing:'}{' '}
                    <span className="text-genesis-copper">{currentVehicle.name}</span>
                  </p>
                </div>
              )}

              {/* Input area — text fallback (voice is the primary control above) */}
              <div className="flex-shrink-0 px-5 py-4 border-t border-genesis-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-genesis-border" />
                  <p className="text-genesis-muted text-[11px] tracking-widest uppercase">
                    {isArabic ? 'أو اكتب سؤالك' : 'or type your question'}
                  </p>
                  <div className="flex-1 h-px bg-genesis-border" />
                </div>

                {/* Text input */}
                <div className="flex gap-2">
                  <input
                    ref={textInputRef}
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTextSend()}
                    placeholder={isArabic ? 'اسأل عن أي سيارة Genesis...' : 'Ask about any Genesis vehicle...'}
                    disabled={isLoading}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    className="flex-1 bg-genesis-dark border border-genesis-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-genesis-muted focus:outline-none focus:border-genesis-copper transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleTextSend}
                    disabled={!textInput.trim() || isLoading}
                    className="px-4 py-2.5 bg-genesis-copper text-black rounded-lg text-sm font-medium hover:bg-genesis-gold transition-colors disabled:opacity-40"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>

                {/* End conversation */}
                <button
                  onClick={() => {
                    reset()
                    handleClose()
                  }}
                  className="w-full mt-3 text-genesis-muted text-xs hover:text-genesis-silver transition-colors py-1 tracking-wider uppercase"
                >
                  {isArabic ? 'إنهاء المحادثة' : 'End Conversation'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
