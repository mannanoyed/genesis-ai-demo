import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// State: 'idle' | 'listening' | 'thinking' | 'speaking'
export default function AudioVisualizer({ state, audioData }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const barsRef = useRef(Array(32).fill(0).map(() => Math.random()))

  // Animate waveform bars for listening state
  useEffect(() => {
    if (state !== 'listening') return

    const animate = () => {
      barsRef.current = barsRef.current.map((bar) => {
        const target = Math.random()
        return bar + (target - bar) * 0.15
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [state])

  const orbColor = {
    idle: 'rgba(196, 149, 106, 0.3)',
    listening: 'rgba(255, 255, 255, 0.9)',
    thinking: 'rgba(196, 149, 106, 0.6)',
    speaking: 'rgba(196, 149, 106, 1)',
  }[state] || 'rgba(196, 149, 106, 0.3)'

  const orbGlowColor = {
    idle: 'rgba(196, 149, 106, 0.15)',
    listening: 'rgba(255, 255, 255, 0.2)',
    thinking: 'rgba(196, 149, 106, 0.35)',
    speaking: 'rgba(196, 149, 106, 0.5)',
  }[state] || 'rgba(196, 149, 106, 0.15)'

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings */}
        {(state === 'speaking' || state === 'listening') && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 160,
                height: 160,
                background: `radial-gradient(circle, ${orbGlowColor} 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 130,
                height: 130,
                background: `radial-gradient(circle, ${orbGlowColor} 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </>
        )}

        {/* Core orb */}
        <motion.div
          className="relative rounded-full z-10 flex items-center justify-center"
          style={{
            width: 100,
            height: 100,
            background: `radial-gradient(circle at 35% 35%, ${
              state === 'listening' ? 'rgba(255,255,255,0.95)' : 'rgba(196,149,106,0.9)'
            } 0%, ${
              state === 'listening' ? 'rgba(200,200,220,0.7)' : 'rgba(140,90,50,0.7)'
            } 100%)`,
            boxShadow: `0 0 30px ${orbGlowColor}, 0 0 60px ${orbGlowColor}`,
          }}
          animate={
            state === 'idle'
              ? { scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }
              : state === 'thinking'
              ? { scale: [1, 1.06, 0.97, 1.06, 1], opacity: [0.8, 1, 0.8] }
              : state === 'speaking'
              ? { scale: [1, 1.08, 0.96, 1.08, 1] }
              : { scale: [1, 1.05, 1] }
          }
          transition={{
            duration: state === 'thinking' ? 1.2 : state === 'speaking' ? 0.8 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-2 rounded-full opacity-50"
            style={{
              background: `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.6) 0%, transparent 60%)`,
            }}
          />

          {/* State icon */}
          <div className="relative z-10">
            {state === 'idle' && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(0,0,0,0.6)">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/>
              </svg>
            )}
            {state === 'listening' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(0,0,0,0.8)">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/>
                </svg>
              </motion.div>
            )}
            {state === 'thinking' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </motion.div>
            )}
            {state === 'speaking' && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(0,0,0,0.7)">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            )}
          </div>
        </motion.div>
      </div>

      {/* Waveform bars — listening state */}
      {state === 'listening' && (
        <div className="flex items-center justify-center gap-0.5 h-10">
          {Array(24).fill(0).map((_, i) => (
            <motion.div
              key={i}
              className="waveform-bar bg-white rounded-full"
              style={{ width: 3 }}
              animate={{
                height: [
                  `${8 + Math.random() * 28}px`,
                  `${8 + Math.random() * 28}px`,
                  `${8 + Math.random() * 28}px`,
                ],
              }}
              transition={{
                duration: 0.4 + Math.random() * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i / 24) * 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* Speaking waveform */}
      {state === 'speaking' && (
        <div className="flex items-center justify-center gap-0.5 h-10">
          {Array(20).fill(0).map((_, i) => (
            <motion.div
              key={i}
              className="waveform-bar rounded-full"
              style={{
                width: 3,
                background: `linear-gradient(180deg, #D4AF37, #C4956A)`,
              }}
              animate={{
                height: [
                  `${6 + Math.sin((i / 20) * Math.PI * 2) * 18 + 8}px`,
                  `${6 + Math.sin((i / 20) * Math.PI * 2 + 1) * 22 + 8}px`,
                  `${6 + Math.sin((i / 20) * Math.PI * 2 + 2) * 18 + 8}px`,
                ],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.04,
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {state === 'thinking' && (
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-genesis-copper"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* State label */}
      <p className="text-xs tracking-widest uppercase text-genesis-muted">
        {state === 'idle' && 'Tap to speak'}
        {state === 'listening' && 'Listening...'}
        {state === 'thinking' && 'Processing...'}
        {state === 'speaking' && 'Genesis AI speaking'}
      </p>
    </div>
  )
}
