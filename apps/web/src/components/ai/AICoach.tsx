'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface AICoachProps {
    context?: Record<string, unknown>
}

export default function AICoach({ context = {} }: AICoachProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hey! I'm your LOS Coach. I have full context of your goals, tasks, and habits. What would you like to optimize today?"
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'coach',
                    context,
                    message: userMessage
                })
            })

            const data = await res.json()
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || 'Something went wrong. Please try again.'
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please check your API key in settings.'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                title="Open AI Coach"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] transition-all hover:scale-110 active:scale-95"
            >
                <Bot className="w-6 h-6" />
            </button>
        )
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 w-96 rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 flex flex-col transition-all ${isMinimized ? 'h-14' : 'h-[520px]'}`}
            style={{ background: 'linear-gradient(135deg, rgba(15,15,30,0.97) 0%, rgba(20,15,40,0.97) 100%)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">LOS Coach</p>
                        <p className="text-[10px] text-indigo-300 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Powered by Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsMinimized(m => !m)}
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                        {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        title="Close AI Coach"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-white/8 text-slate-200 rounded-bl-sm border border-white/5'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/8 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                                    <span className="text-sm text-slate-400">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Ask your coach anything..."
                                aria-label="Ask AI coach"
                                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                title="Send message"
                                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <Send className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
