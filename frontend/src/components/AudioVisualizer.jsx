import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// State: 'idle' | 'listening' | 'thinking' | 'speaking'
//
// This component is the ONE primary voice control. The orb itself is a real,
// keyboard-accessible <button>: tapping it drives the whole flow
// (idle → listen → send → interrupt). There is no separate mic button.
//
// During 'listening', the visualization is driven by `audioLevel` (0..1) — the
// user's *real* microphone level piped in from useAudioRecorder — so the user
// gets genuine proof the mic hears them.
export default function AudioVisualizer({
  state,
  audioLevel = 0,
  onTap,
  isArabic = false,
  disabled = false,
}) {
  // Locally eased copy of the live level so the reaction is buttery-smooth
  // regardless of how coarsely the hook updates it. Only runs while listening.
  const [smoothLevel, setSmoothLevel] = useState(0)
  const rafRef = useRef(null)
  const levelRef = useRef(0)

  useEffect(() => {
    levelRef.current = audioLevel
  }, [audioLevel])

  useEffect(() => {
    if (state !== 'listening') {
      setSmoothLevel(0)
      return
    }
    const tick = () => {
      setSmoothLevel(prev => prev + (levelRef.current - prev) * 0.2)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state])

  const isTappable = !disabled && state !== 'thinking'

  // Per-state color language (idle=copper invite, listening=live white,
  // thinking=copper, speaking=gold).
  const orbGlowColor = {
    idle: 'rgba(196, 149, 106, 0.18)',
    listening: 'rgba(255, 255, 255, 0.24)',
    thinking: 'rgba(196, 149, 106, 0.32)',
    speaking: 'rgba(212, 175, 55, 0.45)',
  }[state] || 'rgba(196, 149, 106, 0.18)'

  const coreGradient = {
    idle: 'radial-gradient(circle at 35% 30%, rgba(212,168,120,0.95) 0%, rgba(140,90,50,0.85) 100%)',
    listening: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.98) 0%, rgba(200,205,220,0.8) 100%)',
    thinking: 'radial-gradient(circle at 35% 30%, rgba(196,149,106,0.9) 0%, rgba(120,80,45,0.8) 100%)',
    speaking: 'radial-gradient(circle at 35% 30%, rgba(212,175,55,0.98) 0%, rgba(160,110,50,0.85) 100%)',
  }[state] || 'radial-gradient(circle at 35% 30%, rgba(212,168,120,0.95) 0%, rgba(140,90,50,0.85) 100%)'

  // Live listening scale reacts to the real mic level.
  const listeningScale = 1 + smoothLevel * 0.22

  const label = {
    idle: isArabic ? 'اضغط للتحدث' : 'Tap to speak',
    listening: isArabic ? 'أستمع… اضغط عند الانتهاء' : "Listening… tap when you're done",
    thinking: isArabic ? 'يفكر…' : 'Thinking…',
    speaking: isArabic ? 'اضغط للمقاطعة' : 'Tap to interrupt',
  }[state] || ''

  const subHint = {
    idle: isArabic ? 'أو اضغط مطولاً على مفتاح المسافة' : 'or hold the Space bar',
    listening: isArabic ? 'أو توقف تلقائياً بعد صمت قصير' : 'or just pause for a moment',
    speaking: '',
    thinking: '',
  }[state] || ''

  const ariaLabel = {
    idle: isArabic ? 'اضغط للتحدث' : 'Tap to start speaking',
    listening: isArabic ? 'اضغط لإنهاء التسجيل' : 'Tap to finish and send',
    thinking: isArabic ? 'يفكر' : 'Processing, please wait',
    speaking: isArabic ? 'اضغط للمقاطعة' : 'Tap to interrupt and speak',
  }[state] || ''

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Primary voice control — the orb IS the button */}
      <motion.button
        type="button"
        onClick={onTap}
        disabled={!isTappable}
        aria-label={ariaLabel}
        title={ariaLabel}
        whileHover={isTappable ? { scale: 1.04 } : undefined}
        whileTap={isTappable ? { scale: 0.96 } : undefined}
        className={`relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-genesis-copper focus-visible:ring-offset-2 focus-visible:ring-offset-genesis-black ${
          isTappable ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ width: 168, height: 168, WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Ambient glow rings — active when there is live audio motion */}
        {(state === 'speaking' || state === 'listening') && (
          <>
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 168,
                height: 168,
                background: `radial-gradient(circle, ${orbGlowColor} 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 140,
                height: 140,
                background: `radial-gradient(circle, ${orbGlowColor} 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </>
        )}

        {/* Idle invite ring — a soft, obviously-tappable copper halo */}
        {state === 'idle' && (
          <motion.div
            className="absolute rounded-full border pointer-events-none"
            style={{ width: 130, height: 130, borderColor: 'rgba(196,149,106,0.35)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Core orb */}
        <motion.div
          className="relative rounded-full z-10 flex items-center justify-center pointer-events-none"
          style={{
            width: 108,
            height: 108,
            background: coreGradient,
            boxShadow: `0 0 32px ${orbGlowColor}, 0 0 64px ${orbGlowColor}`,
            opacity: disabled && state === 'thinking' ? 0.85 : 1,
          }}
          animate={
            state === 'idle'
              ? { scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }
              : state === 'thinking'
              ? { scale: [1, 1.05, 0.98, 1.05, 1] }
              : state === 'speaking'
              ? { scale: [1, 1.07, 0.97, 1.07, 1] }
              : { scale: listeningScale }
          }
          transition={{
            duration: state === 'thinking' ? 1.2 : state === 'speaking' ? 0.8 : state === 'idle' ? 3 : 0.12,
            repeat: state === 'listening' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute inset-2 rounded-full opacity-50 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
          />

          {/* State icon */}
          <div className="relative z-10">
            {state === 'idle' && (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(0,0,0,0.6)">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
              </svg>
            )}
            {state === 'listening' && (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(0,0,0,0.82)">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
              </svg>
            )}
            {state === 'thinking' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </motion.div>
            )}
            {state === 'speaking' && (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(0,0,0,0.72)">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            )}
          </div>
        </motion.div>
      </motion.button>

      {/* Live waveform — listening state, driven by the REAL mic level */}
      {state === 'listening' && (
        <div className="flex items-end justify-center gap-[3px] h-10">
          {Array(24).fill(0).map((_, i) => {
            // Bell-shaped weighting so the center bars are tallest.
            const dist = Math.abs(i - 11.5) / 11.5
            const shape = 1 - dist * 0.65
            // Tiny idle shimmer so the bar cluster is never fully dead, but
            // voice clearly dominates the height.
            const shimmer = 1.5 * Math.abs(Math.sin(i * 1.7 + Date.now() / 220))
            const h = 4 + smoothLevel * 34 * shape + shimmer
            return (
              <div
                key={i}
                className="waveform-bar rounded-full bg-white"
                style={{
                  width: 3,
                  height: `${h}px`,
                  opacity: 0.55 + smoothLevel * 0.45,
                  transition: 'height 90ms linear',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Speaking waveform — ambient (AI voice) */}
      {state === 'speaking' && (
        <div className="flex items-center justify-center gap-[3px] h-10">
          {Array(20).fill(0).map((_, i) => (
            <motion.div
              key={i}
              className="waveform-bar rounded-full"
              style={{ width: 3, background: 'linear-gradient(180deg, #D4AF37, #C4956A)' }}
              animate={{
                height: [
                  `${6 + Math.sin((i / 20) * Math.PI * 2) * 18 + 8}px`,
                  `${6 + Math.sin((i / 20) * Math.PI * 2 + 1) * 22 + 8}px`,
                  `${6 + Math.sin((i / 20) * Math.PI * 2 + 2) * 18 + 8}px`,
                ],
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.04 }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {state === 'thinking' && (
        <div className="flex items-center gap-2 h-10">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-genesis-copper"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Guidance — explicit, bilingual, state-specific */}
      <div className="flex flex-col items-center gap-1 min-h-[2.5rem]" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`text-sm font-medium tracking-wide ${
            state === 'listening'
              ? 'text-white'
              : state === 'speaking'
              ? 'text-genesis-gold'
              : 'text-genesis-copper'
          }`}
        >
          {label}
        </motion.p>
        {subHint && (
          <p className="text-[11px] tracking-wide text-genesis-muted">{subHint}</p>
        )}
      </div>
    </div>
  )
}
