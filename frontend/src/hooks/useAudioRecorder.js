import { useState, useRef, useCallback } from 'react'

// Amplitude below which audio is treated as silence.
// Raised from 0.01 → 0.02 to better reject low-level speaker echo bleed
// that can occur when the AI is speaking through laptop/phone speakers and
// the mic picks it up at a low amplitude, causing Whisper hallucinations.
const SILENCE_THRESHOLD = 0.02
const SILENCE_DURATION_MS = 1500

// Minimum average energy a recording must have to be submitted for
// transcription. Blobs that are almost entirely silence/echo (e.g. captured
// right after the AI finishes speaking) fall below this and are discarded
// before hitting the API, saving a round-trip and preventing garbage output.
const MIN_ENERGY_TO_SUBMIT = 0.015

export function useAudioRecorder({ onAudioReady, onError }) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState(null) // null = unknown, true/false

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const silenceTimerRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceCheckRef = useRef(null)
  // Tracks peak energy observed during the current recording session so we
  // can discard recordings that never had any real speech (pure echo/silence).
  const peakEnergyRef = useRef(0)

  const stopRecording = useCallback((autoSubmit = true) => {
    if (silenceCheckRef.current) {
      clearInterval(silenceCheckRef.current)
      silenceCheckRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current._autoSubmit = autoSubmit
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      setHasPermission(true)
      streamRef.current = stream

      // Set up audio analysis for silence detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Pick best supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(m => MediaRecorder.isTypeSupported(m)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      peakEnergyRef.current = 0

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        // Clean up stream tracks
        stream.getTracks().forEach(t => t.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
        }

        setIsRecording(false)

        if (recorder._autoSubmit !== false && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || 'audio/webm',
          })
          // Only submit if the blob is large enough AND the recording had
          // meaningful audio energy (peak above threshold). This discards
          // pure-silence or echo-only captures that Whisper would hallucinate
          // as Korean or other unexpected languages.
          if (blob.size > 500 && peakEnergyRef.current >= MIN_ENERGY_TO_SUBMIT) {
            onAudioReady?.(blob, mimeType || 'audio/webm')
          }
        }
        chunksRef.current = []
      }

      recorder.start(100) // Collect data every 100ms
      setIsRecording(true)

      // Silence detection
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      let silenceStart = null

      silenceCheckRef.current = setInterval(() => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const normalized = avg / 255

        // Track peak energy so we can reject low-energy (echo-only) recordings
        if (normalized > peakEnergyRef.current) {
          peakEnergyRef.current = normalized
        }

        if (normalized < SILENCE_THRESHOLD) {
          if (!silenceStart) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart >= SILENCE_DURATION_MS) {
            stopRecording(true)
          }
        } else {
          silenceStart = null
        }
      }, 100)

    } catch (err) {
      setHasPermission(false)
      onError?.('microphone_denied')
      console.error('Microphone error:', err)
    }
  }, [onAudioReady, onError, stopRecording])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording(true)
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return {
    isRecording,
    hasPermission,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
