'use client'

import { useEffect, useState } from 'react'
import { useHabitStore } from '@/stores/habitStore'
import { useTaskStore } from '@/stores/taskStore'
import { AlertTriangle, Heart, Zap, Brain, Calendar, RefreshCw, CheckCircle2, ChevronRight, Flame } from 'lucide-react'

type BurnoutLevel = 'safe' | 'warning' | 'danger'
type SignalStatus = 'good' | 'warning' | 'bad'

interface RecoveryProtocol {
    day: number
    title: string
    activities: string[]
    icon: string
}

const RECOVERY_PROTOCOL: RecoveryProtocol[] = [
    {
        day: 1,
        title: 'Rest & Restore',
        icon: '🌙',
        activities: [
            'Complete only 1 single priority task',
            'Take a 30-minute walk outside',
            'Sleep 8+ hours – no alarms',
            'Hydrate and eat a nourishing meal',
            'No social media after 8pm'
        ]
    },
    {
        day: 2,
        title: 'Rebuild Momentum',
        icon: '🌱',
        activities: [
            'Complete 3 small tasks (max 30 mins each)',
            'Reconnect with your North Star goal',
            'Journal: What drained you? What restored you?',
            'Light exercise or stretching',
            'Reach out to 1 person you care about'
        ]
    },
    {
        day: 3,
        title: 'Re-engage & Recommit',
        icon: '🚀',
        activities: [
            'Review and reset your weekly goals',
            'Rebuild your schedule for next 7 days',
            'Identify and remove 1 recurring energy drain',
            'Celebrate small wins from days 1 & 2',
            'Set 3 clear intentions for the week ahead'
        ]
    }
]

export default function RecoveryPage() {
    const { habits, logs, fetchHabits } = useHabitStore()
    const { tasks, fetchTasks } = useTaskStore()
    const [resetStarted, setResetStarted] = useState(false)
    const [currentDay, setCurrentDay] = useState(1)
    const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set())
    const [recoveryDayScheduled, setRecoveryDayScheduled] = useState(false)

    useEffect(() => {
        fetchHabits()
        fetchTasks()
    }, [fetchHabits, fetchTasks])

    // --- Burnout Score Calculation ---
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
    })

    // Days with at least 1 habit completed in last 7 days
    const daysWithHabits = new Set(
        logs.filter(l => last7Days.includes(l.completed_on)).map(l => l.completed_on)
    ).size

    // Tasks completed in last 7 days
    const recentTasksDone = tasks.filter(t =>
        t.status === 'completed' &&
        t.completed_at &&
        last7Days.includes(t.completed_at.split('T')[0])
    ).length

    // Missed habit days detection
    const missedHabitDays = 7 - daysWithHabits

    // Current active streak average
    const avgStreak = habits.length > 0
        ? Math.round(habits.reduce((s, h) => s + h.current_streak, 0) / habits.length)
        : 0

    // Delayed/skipped tasks
    const stalledTasks = tasks.filter(t => t.status === 'delayed' || t.status === 'skipped').length

    // Compute burnout score (0–100, higher = more burnout)
    let burnoutScore = 0
    if (missedHabitDays >= 5) burnoutScore += 40
    else if (missedHabitDays >= 3) burnoutScore += 20
    if (recentTasksDone === 0) burnoutScore += 30
    else if (recentTasksDone < 3) burnoutScore += 15
    if (avgStreak === 0 && habits.length > 0) burnoutScore += 20
    if (stalledTasks > 5) burnoutScore += 10
    burnoutScore = Math.min(100, burnoutScore)

    const burnoutLevel: BurnoutLevel = burnoutScore >= 60 ? 'danger' : burnoutScore >= 30 ? 'warning' : 'safe'

    const signals: { label: string; value: string; status: SignalStatus; icon: React.ReactNode }[] = [
        {
            label: 'Habit Consistency (7 days)',
            value: `${daysWithHabits}/7 days active`,
            status: daysWithHabits >= 5 ? 'good' : daysWithHabits >= 3 ? 'warning' : 'bad',
            icon: <Flame className="w-4 h-4" />
        },
        {
            label: 'Tasks Completed (7 days)',
            value: `${recentTasksDone} tasks done`,
            status: recentTasksDone >= 5 ? 'good' : recentTasksDone >= 2 ? 'warning' : 'bad',
            icon: <CheckCircle2 className="w-4 h-4" />
        },
        {
            label: 'Average Habit Streak',
            value: `${avgStreak} day streak`,
            status: avgStreak >= 5 ? 'good' : avgStreak >= 2 ? 'warning' : 'bad',
            icon: <Zap className="w-4 h-4" />
        },
        {
            label: 'Stalled / Skipped Tasks',
            value: `${stalledTasks} stalled`,
            status: stalledTasks === 0 ? 'good' : stalledTasks < 3 ? 'warning' : 'bad',
            icon: <AlertTriangle className="w-4 h-4" />
        }
    ]

    const statusColors = {
        safe: { bg: 'from-emerald-600 to-teal-600', text: 'Healthy', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', desc: "You're in a strong rhythm. Keep the momentum going." },
        warning: { bg: 'from-amber-600 to-orange-600', text: 'At Risk', badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20', desc: "Early signs of burnout detected. Ease up and rebuild consistency." },
        danger: { bg: 'from-red-700 to-rose-600', text: 'Burnout Risk', badge: 'text-red-400 bg-red-400/10 border-red-400/20', desc: "High burnout risk. Activate the 3-Day Reset Protocol now." }
    }

    const signalColors = { good: 'text-emerald-400', warning: 'text-amber-400', bad: 'text-red-400' }
    const signalBg = { good: 'border-emerald-500/20 bg-emerald-500/5', warning: 'border-amber-500/20 bg-amber-500/5', bad: 'border-red-500/20 bg-red-500/5' }

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Burnout & Recovery</h1>
                <p className="text-slate-400 mt-1">Real-time burnout detection and guided recovery protocols.</p>
            </div>

            {/* Burnout Score Card */}
            <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${statusColors[burnoutLevel].bg} bg-opacity-10`}
                style={{ background: 'linear-gradient(135deg, rgba(15,20,40,0.9) 0%, rgba(15,15,25,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-400 font-medium">Burnout Assessment — Today</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-5xl font-bold text-white">{burnoutScore}</span>
                                <span className="text-slate-500 text-lg">/100</span>
                            </div>
                            <div>
                                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold border px-3 py-1 rounded-full ${statusColors[burnoutLevel].badge}`}>
                                    {burnoutLevel === 'danger' && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {burnoutLevel === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {burnoutLevel === 'safe' && <Heart className="w-3.5 h-3.5" />}
                                    {statusColors[burnoutLevel].text}
                                </span>
                                <p className="text-sm text-slate-400 mt-1.5 max-w-xs">{statusColors[burnoutLevel].desc}</p>
                            </div>
                        </div>
                    </div>

                    {/* Score ring */}
                    <div className="relative w-28 h-28 flex-shrink-0">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none"
                                stroke={burnoutLevel === 'danger' ? '#ef4444' : burnoutLevel === 'warning' ? '#f59e0b' : '#10b981'}
                                strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={`${burnoutScore} ${100 - burnoutScore}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {burnoutLevel === 'safe'
                                ? <Heart className="w-7 h-7 text-emerald-400" />
                                : <AlertTriangle className={`w-7 h-7 ${burnoutLevel === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Signal Cards */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">Burnout Signals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {signals.map(sig => (
                        <div key={sig.label} className={`flex items-center gap-4 p-4 rounded-xl border ${signalBg[sig.status]}`}>
                            <div className={`flex-shrink-0 ${signalColors[sig.status]}`}>{sig.icon}</div>
                            <div>
                                <p className="text-xs text-slate-500">{sig.label}</p>
                                <p className={`text-sm font-semibold ${signalColors[sig.status]}`}>{sig.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3-Day Reset Protocol */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-indigo-400" />
                            3-Day Reset Protocol
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">A guided, structured recovery plan to return to peak performance.</p>
                    </div>
                    {!resetStarted && (
                        <button
                            onClick={() => setResetStarted(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Start Reset
                        </button>
                    )}
                </div>

                {resetStarted && (
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3].map(d => (
                            <button
                                key={d}
                                onClick={() => setCurrentDay(d)}
                                className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${currentDay === d
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                            >
                                Day {d}
                            </button>
                        ))}
                    </div>
                )}

                <div className={`grid gap-4 ${resetStarted ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {RECOVERY_PROTOCOL
                        .filter(p => !resetStarted || p.day === currentDay)
                        .map(protocol => (
                            <div key={protocol.day} className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
                                    <span className="text-2xl">{protocol.icon}</span>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Day {protocol.day}</p>
                                        <p className="font-semibold text-white">{protocol.title}</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    {protocol.activities.map((activity, i) => {
                                        const key = `${protocol.day}-${i}`
                                        const done = completedActivities.has(key)
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setCompletedActivities(prev => {
                                                        const next = new Set(prev)
                                                        if (next.has(key)) next.delete(key)
                                                        else next.add(key)
                                                        return next
                                                    })
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${done
                                                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                                                    : 'bg-slate-950/30 border border-slate-800 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                                    {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={`text-sm leading-snug ${done ? 'text-emerald-400 line-through opacity-70' : 'text-slate-300'}`}>
                                                    {activity}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Schedule Recovery Day CTA */}
            <div className={`rounded-2xl p-5 border transition-all ${recoveryDayScheduled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-slate-800'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${recoveryDayScheduled ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                            <Calendar className={`w-6 h-6 ${recoveryDayScheduled ? 'text-emerald-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className="font-semibold text-white">Schedule a Recovery Day</p>
                            <p className="text-sm text-slate-400">Block tomorrow on your calendar for full rest. No tasks, no obligations.</p>
                        </div>
                    </div>
                    {recoveryDayScheduled ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                            Scheduled
                        </div>
                    ) : (
                        <button
                            onClick={() => setRecoveryDayScheduled(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all flex-shrink-0"
                        >
                            Schedule Day
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}
