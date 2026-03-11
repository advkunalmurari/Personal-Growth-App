'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
    onResult?: (transcription: string, intent: string, data: Record<string, unknown>) => void
    context?: Record<string, unknown>
    className?: string
}

export default function VoiceInput({ onResult, context, className = '' }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setIsProcessing(true)

                try {
                    const formData = new FormData()
                    formData.append('audio', blob, 'voice.webm')
                    if (context) {
                        formData.append('context', JSON.stringify(context))
                    }

                    const res = await fetch('/api/voice', { method: 'POST', body: formData })
                    const data = await res.json()

                    const text = data.transcription || ''
                    setTranscript(text)
                    onResult?.(text, data.intent || 'general', data.data || {})
                } catch (err) {
                    console.error('Voice processing error:', err)
                    setTranscript('Processing error. Please try again.')
                } finally {
                    setIsProcessing(false)
                }
            }

            recorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Microphone error:', err)
        }
    }, [context, onResult])

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
    }, [])

    const handleToggle = () => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <button
                onClick={handleToggle}
                disabled={isProcessing}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
                aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all
          ${isRecording
                        ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_16px_rgba(239,68,68,0.5)] animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'}
          disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : isRecording ? (
                    <MicOff className="w-5 h-5 text-white" />
                ) : (
                    <Mic className="w-5 h-5 text-white" />
                )}
                {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                )}
            </button>

            {transcript && (
                <p className="text-sm text-slate-300 max-w-xs truncate" title={transcript}>
                    {transcript}
                </p>
            )}
        </div>
    )
}
