import { useState, useRef, useCallback } from 'react'

// Voice activity is measured as time-domain RMS amplitude (0..1), NOT a
// spectral average. RMS reflects how loud the signal actually is, so the
// thresholds below behave predictably for real speech. (The previous version
// averaged getByteFrequencyData across all FFT bins — a value that stays tiny
// for normal speech because the upper bins are near zero — and set the
// thresholds so high that legitimate speech was discarded before ever being
// sent for transcription.)
//
// RMS amplitude below which audio is treated as silence.
const SILENCE_THRESHOLD = 0.015
const SILENCE_DURATION_MS = 1500

// Minimum peak RMS amplitude a recording must reach to be worth transcribing.
// This still rejects pure-silence / echo-only captures (e.g. the mic opening
// right after the AI finishes speaking) without swallowing real speech.
const MIN_ENERGY_TO_SUBMIT = 0.01

export function useAudioRecorder({ onAudioReady, onError, onDiscarded }) {
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
          } else {
            // Capture was too quiet / too short to transcribe. Let the caller
            // reset UI state (otherwise it stays stuck on "Listening…").
            onDiscarded?.()
          }
        }
        chunksRef.current = []
      }

      recorder.start(100) // Collect data every 100ms
      setIsRecording(true)

      // Silence detection — time-domain RMS amplitude (0..1)
      const dataArray = new Uint8Array(analyserRef.current.fftSize)
      let silenceStart = null

      silenceCheckRef.current = setInterval(() => {
        if (!analyserRef.current) return
        analyserRef.current.getByteTimeDomainData(dataArray)
        // Time-domain samples are centered at 128; deviation from center is
        // the signal. RMS of that deviation is a true loudness measure.
        let sumSquares = 0
        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128
          sumSquares += sample * sample
        }
        const normalized = Math.sqrt(sumSquares / dataArray.length)

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
