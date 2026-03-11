'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, CheckSquare, Flame, Target, BookOpen } from 'lucide-react'

interface WeeklyScore {
    total_score: number
    grade: string
    tasks_score: number
    habits_score: number
    goals_score: number
    review_score: number
    week_start_date: string
    is_estimate?: boolean
}

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    S: { bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/60' },
    A: { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/60' },
    B: { bg: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/60' },
    C: { bg: 'bg-indigo-500', text: 'text-indigo-400', ring: 'ring-indigo-500/60' },
    D: { bg: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/60' },
    F: { bg: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/60' },
}

const SCORE_ITEMS = [
    { key: 'tasks_score', icon: CheckSquare, label: 'Tasks', color: 'text-indigo-400' },
    { key: 'habits_score', icon: Flame, label: 'Habits', color: 'text-fuchsia-400' },
    { key: 'goals_score', icon: Target, label: 'Focus', color: 'text-amber-400' },
    { key: 'review_score', icon: BookOpen, label: 'Review', color: 'text-emerald-400' },
] as const

export default function WeeklyScorecard() {
    const [score, setScore] = useState<WeeklyScore | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/weekly-score')
            .then(r => r.json())
            .then(data => {
                if (!data.error) setScore(data)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const grade = score?.grade || 'F'
    const colors = GRADE_COLORS[grade] || GRADE_COLORS.F
    const total = score?.total_score || 0

    const getTrendIcon = () => {
        if (total >= 75) return <TrendingUp className="w-4 h-4 text-emerald-400" />
        if (total < 50) return <TrendingDown className="w-4 h-4 text-rose-400" />
        return <Minus className="w-4 h-4 text-gray-400" />
    }

    return (
        <section className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">Weekly Scorecard</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {score?.is_estimate ? 'Live estimate · updates Sunday' : 'Updated Sunday'}
                    </p>
                </div>
                {!loading && getTrendIcon()}
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-12 bg-gray-800 rounded-xl" />
                    <div className="h-4 bg-gray-800 rounded-full" />
                </div>
            ) : (
                <>
                    {/* Grade + total score */}
                    <div className="flex items-center gap-4 p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50 mb-4">
                        <div className={`w-14 h-14 rounded-2xl ${colors.bg}/20 ring-2 ${colors.ring} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-2xl font-black ${colors.text}`}>{grade}</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">
                                {total}<span className="text-gray-600 text-xl">/100</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">This week</div>
                        </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="space-y-2.5">
                        {SCORE_ITEMS.map(item => {
                            const value = score?.[item.key] || 0
                            const Icon = item.icon
                            return (
                                <div key={item.key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <Icon className={`w-3 h-3 ${item.color}`} />
                                            <span className="text-xs text-gray-500">{item.label}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400">{value}/25</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${(value / 25) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {!score && (
                        <p className="text-xs text-gray-600 text-center mt-3">
                            Complete tasks and habits to build your first score
                        </p>
                    )}
                </>
            )}
        </section>
    )
}
