'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { CheckCircle2, Circle, Flame, Zap, ChevronRight, ListTodo } from 'lucide-react'
import Link from 'next/link'

export default function TodayPlan() {
    const { tasks, fetchTasks, updateTaskStatus } = useTaskStore()
    const { habits, logs, fetchHabits, toggleHabitLog } = useHabitStore()
    const [mounted, setMounted] = useState(false)

    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchTasks()
        fetchHabits()
        setMounted(true)
    }, [fetchTasks, fetchHabits])

    if (!mounted) return null

    // Top 3 P1 tasks for today
    const todayTasks = tasks
        .filter(t => t.priority === 'P1' && t.status !== 'completed')
        .slice(0, 3)

    // Daily habits
    const dailyHabits = habits.filter(h => h.frequency === 'daily').slice(0, 4)
    const completedHabitIds = new Set(
        logs.filter(l => l.completed_on === today).map(l => l.habit_id)
    )

    const completedTasks = todayTasks.filter(t => t.status === 'completed').length
    const completedHabitsCount = dailyHabits.filter(h => completedHabitIds.has(h.id)).length
    const totalItems = todayTasks.length + dailyHabits.length
    const completedItems = completedTasks + completedHabitsCount
    const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    const handleCompleteTask = async (id: string) => {
        await updateTaskStatus(id, 'completed')
    }

    const handleLogHabit = async (habitId: string) => {
        await toggleHabitLog(habitId, today)
    }

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-medium">{greeting()} · Today&apos;s Plan</p>
                        <h2 className="text-white font-bold text-lg mt-0.5">Command the Day</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{progressPct}%</p>
                        <p className="text-slate-500 text-xs">{completedItems}/{totalItems} done</p>
                    </div>
                </div>
                {/* Overall progress bar */}
                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${progressPct === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500'}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Top Priority Tasks */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-400" /> Priority Tasks
                        </p>
                        <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                            All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {todayTasks.length === 0 ? (
                        <div className="text-center py-4">
                            <ListTodo className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
                            <p className="text-xs text-slate-600">No P1 tasks yet</p>
                            <Link href="/tasks" className="text-xs text-indigo-400 hover:underline">Add a task →</Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todayTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition-all group text-left"
                                >
                                    {task.status === 'completed'
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        : <Circle className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                                    }
                                    <span className={`text-sm flex-1 truncate ${task.status === 'completed' ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                                        {task.title}
                                    </span>
                                    <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                                        P1
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daily Habits */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Flame className="w-3 h-3 text-orange-400" /> Daily Habits
                        </p>
                        <Link href="/habits" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                            All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {dailyHabits.length === 0 ? (
                        <div className="text-center py-4">
                            <Flame className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
                            <p className="text-xs text-slate-600">No daily habits yet</p>
                            <Link href="/habits" className="text-xs text-indigo-400 hover:underline">Add a habit →</Link>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {dailyHabits.map(habit => {
                                const done = completedHabitIds.has(habit.id)
                                return (
                                    <button
                                        key={habit.id}
                                        onClick={() => handleLogHabit(habit.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${done
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-white'
                                            }`}
                                    >
                                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                        {habit.name}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Completion CTA */}
                {progressPct === 100 && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-2xl">🎉</span>
                        <div>
                            <p className="text-sm font-semibold text-emerald-400">Day Complete!</p>
                            <p className="text-xs text-slate-500">You crushed today&apos;s plan. Time to reflect.</p>
                        </div>
                        <Link href="/review" className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 flex-shrink-0">
                            Review <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
