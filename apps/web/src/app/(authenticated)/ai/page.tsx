'use client'

import { useState } from 'react'
import TaskBreakdownEngine from '@/components/ai/TaskBreakdownEngine'
import { Bot, Zap, MessageSquare, Loader2, TrendingUp, CheckCircle2 } from 'lucide-react'

interface FeedbackReport {
    score: number
    content: string
}

export default function AIHubPage() {
    const [feedbackLoading, setFeedbackLoading] = useState(false)
    const [feedback, setFeedback] = useState<FeedbackReport | null>(null)
    const [feedbackError, setFeedbackError] = useState<string | null>(null)

    const generateDailyFeedback = async () => {
        setFeedbackLoading(true)
        setFeedbackError(null)
        setFeedback(null)

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'feedback',
                    context: {
                        date: new Date().toLocaleDateString(),
                        note: 'Daily performance summary requested by user'
                    },
                    message: 'Generate my daily performance feedback report for today.'
                })
            })
            const data = await res.json()

            // Extract score from response if present (look for digits near "score" or "/100")
            const scoreMatch = data.response?.match(/(\d{1,3})\s*(?:\/\s*100|out\s*of\s*100)/i)
            const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 72

            setFeedback({ score, content: data.response })
        } catch {
            setFeedbackError('Failed to generate feedback. Please check your API key.')
        } finally {
            setFeedbackLoading(false)
        }
    }

    const agents = [
        {
            icon: <Bot className="w-6 h-6 text-indigo-400" />,
            name: 'LOS Coach',
            description: 'A proactive, context-aware life coach that offers personalized guidance based on your goals, tasks, and habits.',
            badge: 'Active',
            badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            tip: 'Click the floating chat button (bottom-right) to talk to your coach.'
        },
        {
            icon: <Zap className="w-6 h-6 text-fuchsia-400" />,
            name: 'Task Breakdown Engine',
            description: 'Decompose ambitious goals into concrete, prioritized, time-boxed subtasks in seconds.',
            badge: 'Active',
            badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            tip: 'Use the breakdown tool below to generate subtasks from any goal.'
        },
        {
            icon: <MessageSquare className="w-6 h-6 text-amber-400" />,
            name: 'Feedback Agent',
            description: 'Analyzes your daily performance data and generates structured, score-based performance reports.',
            badge: 'Active',
            badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            tip: 'Generate your daily feedback report using the button below.'
        }
    ]

    return (
        <div className="space-y-8 p-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agent Hub</h1>
                <p className="text-slate-400 mt-1">Your intelligent multi-agent performance system, powered by Gemini 2.0 Flash.</p>
            </div>

            {/* Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <div key={agent.name} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700">
                                {agent.icon}
                            </div>
                            <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${agent.badgeColor}`}>
                                {agent.badge}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{agent.name}</h3>
                            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{agent.description}</p>
                        </div>
                        <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">{agent.tip}</p>
                    </div>
                ))}
            </div>

            {/* Task Breakdown Engine */}
            <TaskBreakdownEngine />

            {/* Feedback Agent Section */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-600/10 to-orange-600/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <TrendingUp className="w-5 h-5 text-amber-400" />
                            <div>
                                <h2 className="font-semibold text-white">Daily Feedback Agent</h2>
                                <p className="text-xs text-slate-400">AI-generated performance report for today</p>
                            </div>
                        </div>
                        <button
                            onClick={generateDailyFeedback}
                            disabled={feedbackLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {feedbackLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                            ) : (
                                <><Zap className="w-4 h-4" /> Generate Report</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {feedbackError && (
                        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                            {feedbackError}
                        </p>
                    )}

                    {!feedback && !feedbackLoading && !feedbackError && (
                        <p className="text-sm text-slate-500 italic text-center py-6">
                            Click &ldquo;Generate Report&rdquo; to get your AI-powered daily performance review.
                        </p>
                    )}

                    {feedback && (
                        <div className="space-y-4">
                            {/* Score */}
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                            stroke={feedback.score >= 75 ? '#10b981' : feedback.score >= 50 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="3" strokeDasharray={`${feedback.score}, 100`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">{feedback.score}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-white">Performance Score</p>
                                    <p className="text-sm text-slate-400">
                                        {feedback.score >= 80 ? '🔥 Outstanding day!' :
                                            feedback.score >= 60 ? '✅ Solid performance' :
                                                '⚡ Room to grow — keep going'}
                                    </p>
                                </div>
                            </div>

                            {/* Full report */}
                            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-medium text-slate-300">Full Report</span>
                                </div>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.content}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
