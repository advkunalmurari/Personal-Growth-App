'use client'

import { useEffect, useState } from 'react'
import { useGoalStore } from '@/stores/goalStore'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import {
    AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Target, CheckSquare, Flame, Award, Zap, ArrowUpRight } from 'lucide-react'

export default function AnalyticsPage() {
    const { goals, fetchGoals } = useGoalStore()
    const { tasks, fetchTasks } = useTaskStore()
    const { habits, logs, fetchHabits } = useHabitStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        fetchGoals()
        fetchTasks()
        fetchHabits()
        setMounted(true)
    }, [fetchGoals, fetchTasks, fetchHabits])

    // --- Computed metrics ---
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalXP = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.xp_value, 0)
    const activeGoals = goals.filter(g => g.status === 'active').length
    const avgGoalProgress = goals.length
        ? Math.round(goals.reduce((sum, g) => sum + g.progress_pct, 0) / goals.length)
        : 0
    const longestStreak = Math.max(0, ...habits.map(h => h.longest_streak))
    const habitsCompleted = logs.length

    // --- Chart Data ---
    // XP over last 7 days (from completed tasks)
    const xpByDay: Record<string, number> = {}
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
    })
    last7Days.forEach(d => { xpByDay[d] = 0 })
    tasks.filter(t => t.status === 'completed' && t.completed_at).forEach(t => {
        const day = t.completed_at!.split('T')[0]
        if (xpByDay[day] !== undefined) xpByDay[day] += t.xp_value
    })
    const xpChartData = last7Days.map(d => ({
        day: d.slice(5), // MM-DD
        xp: xpByDay[d]
    }))

    // Task completion by priority
    const priorityData = ['P1', 'P2', 'P3', 'P4'].map(p => ({
        priority: p,
        completed: tasks.filter(t => t.priority === p && t.status === 'completed').length,
        total: tasks.filter(t => t.priority === p).length,
    }))

    // Radar: Life Balance
    const radarData = [
        { subject: 'Goals', score: Math.min(100, activeGoals * 20) },
        { subject: 'Tasks', score: completedTasks > 0 ? Math.min(100, (completedTasks / Math.max(tasks.length, 1)) * 100) : 0 },
        { subject: 'Habits', score: Math.min(100, longestStreak * 10) },
        { subject: 'XP', score: Math.min(100, totalXP / 10) },
        { subject: 'Consistency', score: Math.min(100, habitsCompleted * 5) },
    ]

    const statCards = [
        { label: 'Total XP Earned', value: totalXP.toLocaleString(), icon: <Zap className="w-5 h-5 text-yellow-400" />, color: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20' },
        { label: 'Tasks Completed', value: completedTasks, icon: <CheckSquare className="w-5 h-5 text-emerald-400" />, color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
        { label: 'Active Goals', value: activeGoals, icon: <Target className="w-5 h-5 text-indigo-400" />, color: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20' },
        { label: 'Avg Goal Progress', value: `${avgGoalProgress}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" />, color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-500/20' },
        { label: 'Longest Streak', value: `${longestStreak}d`, icon: <Flame className="w-5 h-5 text-rose-400" />, color: 'from-rose-500/10 to-pink-500/10 border-rose-500/20' },
        { label: 'Habit Check-ins', value: habitsCompleted, icon: <Award className="w-5 h-5 text-amber-400" />, color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20' },
    ]

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Growth Analytics</h1>
                    <p className="text-slate-400 mt-1">Live performance tracking across all life dimensions.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Live Data</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((s) => (
                    <div key={s.label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${s.color}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                                {s.icon}
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* XP Over Time */}
                <div className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-white">XP Growth (Last 7 Days)</h2>
                            <p className="text-xs text-slate-500">Experience points earned from completed tasks</p>
                        </div>
                        <span className="text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full">
                            +{totalXP} XP total
                        </span>
                    </div>
                    {mounted && (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={xpChartData}>
                                <defs>
                                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={2} fill="url(#xpGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Life Balance Radar */}
                <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5">
                    <h2 className="font-semibold text-white mb-1">Life Balance</h2>
                    <p className="text-xs text-slate-500 mb-4">Multidimensional performance score</p>
                    {mounted && (
                        <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Radar name="Score" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Task Priority Breakdown */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-white">Task Completion by Priority</h2>
                        <p className="text-xs text-slate-500">Completed vs total tasks per priority tier</p>
                    </div>
                </div>
                {mounted && (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={priorityData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="priority" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total" name="Total" fill="#1e293b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
