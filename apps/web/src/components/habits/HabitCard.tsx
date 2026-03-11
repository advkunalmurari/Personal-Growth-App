'use client'

import { useState } from 'react'
import { Check, Flame, Trophy } from 'lucide-react'
import { Habit, useHabitStore } from '@/stores/habitStore'
import clsx from 'clsx'

// Helper to generate the last N days as string YYYY-MM-DD
function getLastNDays(n: number) {
    const days = []
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
    }
    return days
}

export default function HabitCard({ habit }: { habit: Habit }) {
    const { logs, toggleHabitLog } = useHabitStore()
    const [isUpdating, setIsUpdating] = useState(false)

    // Map logs to this habit
    const habitLogs = logs.filter(l => l.habit_id === habit.id)
    const todayStr = new Date().toISOString().split('T')[0]
    const isCompletedToday = habitLogs.some(l => l.completed_on === todayStr)

    const handleToggle = async () => {
        if (isUpdating) return
        setIsUpdating(true)
        await toggleHabitLog(habit.id, todayStr)
        setIsUpdating(false)
    }

    // 14-day Mini Heatmap
    const last14Days = getLastNDays(14)

    return (
        <div className={clsx(
            "relative p-5 rounded-3xl border transition-all duration-300 overflow-hidden group",
            isCompletedToday
                ? "bg-gray-900/40 border-gray-800/40 opacity-80"
                : "bg-gray-900/80 border-gray-700 hover:border-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)]"
        )}>
            {isCompletedToday && (
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent pointer-events-none" />
            )}

            <div className="flex items-start justify-between relative z-10">

                {/* Left Side: Button & Info */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleToggle}
                        disabled={isUpdating}
                        className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer",
                            isCompletedToday
                                ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                                : "bg-gray-800 text-gray-600 border border-gray-700 hover:bg-gray-700 hover:text-white"
                        )}
                    >
                        {isCompletedToday ? <Check className="w-6 h-6" /> : <div className="w-6 h-6 border-2 border-current rounded-lg opacity-50" />}
                    </button>

                    <div>
                        <h3 className={clsx(
                            "text-lg font-bold tracking-tight transition-colors",
                            isCompletedToday ? "text-gray-300" : "text-white"
                        )}>
                            {habit.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold">
                            <span className="uppercase text-gray-500">{habit.frequency}</span>
                            <div className="w-1 h-1 rounded-full bg-gray-800" />
                            <div className="flex items-center gap-1 text-orange-400">
                                <Flame className="w-3.5 h-3.5" />
                                <span>{habit.current_streak} Streak</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-800" />
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{habit.longest_streak} Max</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: GitHub Style Heatmap (Last 14 Days) */}
                <div className="flex items-center gap-1.5">
                    {last14Days.map(dateStr => {
                        const isDone = habitLogs.some(l => l.completed_on === dateStr)
                        const isToday = dateStr === todayStr
                        return (
                            <div
                                key={dateStr}
                                title={dateStr}
                                className={clsx(
                                    "w-3 rounded-sm transition-all duration-300",
                                    isToday ? "h-6" : "h-4",
                                    isDone ? "bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.6)]" : "bg-gray-800"
                                )}
                            />
                        )
                    })}
                </div>

            </div>
        </div>
    )
}
