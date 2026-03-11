'use client'

import { useEffect } from 'react'
import { useGoalStore } from '@/stores/goalStore'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { Target, Activity, Zap, TrendingUp, Flame } from 'lucide-react'
import Link from 'next/link'
import TodayPlan from '@/components/dashboard/TodayPlan'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import WeeklyScorecard from '@/components/dashboard/WeeklyScorecard'

export default function DashboardPage() {
    const { goals, fetchGoals, isLoading: goalsLoading } = useGoalStore()
    const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore()
    const { habits, fetchHabits, isLoading: habitsLoading } = useHabitStore()

    useEffect(() => {
        fetchGoals()
        fetchTasks()
        fetchHabits()
    }, [fetchGoals, fetchTasks, fetchHabits])

    const isLoading = goalsLoading || tasksLoading || habitsLoading

    const todayStr = new Date().toISOString().split('T')[0]

    const visionGoals = goals.filter(g => g.level === 'vision' && g.status === 'active')

    // Calculate some vanity metrics
    const completedToday = tasks.filter(t => t.status === 'completed' && t.completed_at && t.completed_at.startsWith(todayStr)).length

    if (isLoading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto custom-scrollbar">
            {/* Top Welcome & Stats Array */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-indigo-950/50 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                    <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Command Center</h1>
                    <p className="text-indigo-200/80 mb-6 relative z-10 max-w-md">
                        Your centralized nexus for strategic planning, daily execution, and atomic behavior tracking.
                    </p>
                    <div className="flex gap-4 relative z-10">
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 min-w-[120px]">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" /> Active Goals
                            </div>
                            <div className="text-2xl font-bold text-white">{goals.filter(g => g.status === 'active').length}</div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 min-w-[120px]">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-green-400" /> Velocity
                            </div>
                            <div className="text-2xl font-bold text-green-400 text-shadow-sm">On Track</div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-orange-400" />
                        </div>
                        <h3 className="text-gray-400 font-medium">Daily XP</h3>
                    </div>
                    <div className="text-4xl font-black text-white">{completedToday * 15} <span className="text-lg text-gray-500 font-normal">XP</span></div>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +{completedToday} tasks today
                    </p>
                </div>

                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                            <Flame className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <h3 className="text-gray-400 font-medium">Habit Streaks</h3>
                    </div>
                    <div className="text-4xl font-black text-white">
                        {habits.reduce((acc, h) => acc + h.current_streak, 0)} <span className="text-lg text-gray-500 font-normal">Days</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Total compounded consistency
                    </p>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Today's Execution Plan */}
                <div className="lg:col-span-2 space-y-8">
                    <TodayPlan />
                </div>

                {/* Right Column: North Star & Progress */}
                <div className="space-y-8">

                    {/* North Star Visions */}
                    <section className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold text-white">North Star Visions</h2>
                        </div>

                        <div className="space-y-4">
                            {visionGoals.length > 0 ? (
                                visionGoals.map(vision => (
                                    <div key={vision.id} className="group cursor-pointer">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">{vision.title}</span>
                                            <span className="text-xs text-gray-500 font-mono">{vision.progress_pct}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-out"
                                                style={{ width: `${vision.progress_pct}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    No vision goals established. Define your North Star in the Goal Engine.
                                </div>
                            )}

                            <Link href="/goals" className="block w-full text-center py-3 mt-4 text-sm font-semibold text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors">
                                Open Goal Engine
                            </Link>
                        </div>
                    </section>

                    {/* Weekly Scorecard — Live */}
                    <WeeklyScorecard />

                </div>
            </div>
        </div>
    )
}
