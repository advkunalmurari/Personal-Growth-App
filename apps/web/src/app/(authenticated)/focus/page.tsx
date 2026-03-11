'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, Trophy } from 'lucide-react'

type SessionType = 'focus' | 'short_break' | 'long_break'

const SESSION_CONFIG: Record<SessionType, { label: string; minutes: number; color: string; icon: React.ReactNode }> = {
    focus: { label: 'Deep Focus', minutes: 25, color: 'from-indigo-600 to-purple-600', icon: <Brain className="w-5 h-5" /> },
    short_break: { label: 'Short Break', minutes: 5, color: 'from-emerald-600 to-teal-600', icon: <Coffee className="w-5 h-5" /> },
    long_break: { label: 'Long Break', minutes: 15, color: 'from-amber-600 to-orange-600', icon: <Coffee className="w-5 h-5" /> },
}

const BADGES = [
    { id: 'first_session', label: 'First Focus', description: 'Complete your first session', icon: '🏁', xp: 50, threshold: 1 },
    { id: 'five_sessions', label: 'Flow State', description: 'Complete 5 focus sessions', icon: '🔥', xp: 150, threshold: 5 },
    { id: 'ten_sessions', label: 'Deep Worker', description: 'Complete 10 focus sessions', icon: '⚡', xp: 300, threshold: 10 },
    { id: 'twenty_sessions', label: 'Iron Mind', description: 'Complete 20 focus sessions', icon: '🧠', xp: 750, threshold: 20 },
]

export default function FocusPage() {
    const [sessionType, setSessionType] = useState<SessionType>('focus')
    const [secondsLeft, setSecondsLeft] = useState(SESSION_CONFIG.focus.minutes * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [sessionsCompleted, setSessionsCompleted] = useState(0)
    const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
    const [justCompleted, setJustCompleted] = useState(false)
    const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null)

    const config = SESSION_CONFIG[sessionType]
    const totalSeconds = config.minutes * 60
    const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100

    const handleComplete = useCallback(() => {
        setIsRunning(false)
        setJustCompleted(true)

        if (sessionType === 'focus') {
            const newCount = sessionsCompleted + 1
            setSessionsCompleted(newCount)
            setTotalFocusMinutes(prev => prev + config.minutes)

            const earned = BADGES.find(b => b.threshold === newCount)
            if (earned) setNewBadge(earned)
        }

        setTimeout(() => setJustCompleted(false), 3000)
    }, [sessionType, sessionsCompleted, config.minutes])

    useEffect(() => {
        if (!isRunning) return

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    handleComplete()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isRunning, handleComplete])

    const switchSession = (type: SessionType) => {
        setSessionType(type)
        setSecondsLeft(SESSION_CONFIG[type].minutes * 60)
        setIsRunning(false)
        setJustCompleted(false)
    }

    const reset = () => {
        setSecondsLeft(config.minutes * 60)
        setIsRunning(false)
    }

    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
    const secs = (secondsLeft % 60).toString().padStart(2, '0')

    const earnedBadges = BADGES.filter(b => sessionsCompleted >= b.threshold)
    const nextBadge = BADGES.find(b => sessionsCompleted < b.threshold)

    return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isRunning ? 'from-indigo-950/40 via-slate-950 to-purple-950/30' : 'from-slate-950 via-slate-950 to-slate-900'} transition-all duration-2000`} />
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-br ${config.color} opacity-5 blur-3xl transition-all duration-1000 ${isRunning ? 'scale-150' : 'scale-100'}`} />

            <div className="relative z-10 w-full max-w-md space-y-8">

                {/* Session Type Tabs */}
                <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                    {(Object.keys(SESSION_CONFIG) as SessionType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => switchSession(type)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all capitalize ${sessionType === type
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {SESSION_CONFIG[type].label}
                        </button>
                    ))}
                </div>

                {/* Timer Ring */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-64 h-64">
                        {/* SVG Circular Progress */}
                        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
                            <circle
                                cx="50" cy="50" r="45" fill="none"
                                stroke="url(#timerGrad)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45 * progress / 100} ${2 * Math.PI * 45 * (1 - progress / 100)}`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Time Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className={`flex items-center gap-1 mb-1 text-xs font-medium ${isRunning ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {config.icon}
                                <span>{config.label}</span>
                            </div>
                            <div className="text-6xl font-bold font-mono tracking-wider text-white">
                                {mins}:{secs}
                            </div>
                            {isRunning && (
                                <div className="mt-2 flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                            style={{ animationDelay: `${i * 150}ms` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={reset}
                            title="Reset timer"
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsRunning(r => !r)}
                            title={isRunning ? 'Pause timer' : 'Start timer'}
                            className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg hover:opacity-90 active:scale-95 transition-all`}
                        >
                            {isRunning
                                ? <Pause className="w-8 h-8" />
                                : <Play className="w-8 h-8 ml-1" />
                            }
                        </button>

                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex flex-col items-center justify-center">
                            <span className="text-xs text-slate-500">Done</span>
                            <span className="text-sm font-bold text-white">{sessionsCompleted}</span>
                        </div>
                    </div>
                </div>

                {/* Completed flash */}
                {justCompleted && (
                    <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Session complete! +{sessionType === 'focus' ? '100' : '0'} XP
                    </div>
                )}

                {/* New Badge Alert */}
                {newBadge && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl">
                        <span className="text-3xl">{newBadge.icon}</span>
                        <div>
                            <p className="text-sm font-semibold text-white">🏆 Badge Earned: {newBadge.label}</p>
                            <p className="text-xs text-slate-400">{newBadge.description} — +{newBadge.xp} XP</p>
                        </div>
                    </div>
                )}

                {/* Stats + Next Badge */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{totalFocusMinutes}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Minutes focused today</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{sessionsCompleted * 100}</p>
                        <p className="text-xs text-slate-500 mt-0.5">XP from focus sessions</p>
                    </div>
                </div>

                {/* Badges */}
                {(earnedBadges.length > 0 || nextBadge) && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <p className="text-sm font-medium text-slate-300">Focus Badges</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {BADGES.map(badge => {
                                const earned = sessionsCompleted >= badge.threshold
                                return (
                                    <div key={badge.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${earned
                                        ? 'bg-amber-500/10 border-amber-500/20'
                                        : 'bg-slate-900/40 border-slate-800 opacity-40'
                                        }`}>
                                        <span className="text-xl">{badge.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">{badge.label}</p>
                                            <p className="text-[10px] text-slate-500">{badge.threshold} sessions</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
