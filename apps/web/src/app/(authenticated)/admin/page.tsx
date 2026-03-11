'use client'

import { useState } from 'react'
import {
    Building2, Users, BarChart3, TrendingUp, Award,
    Download, ChevronRight, CheckCircle2, AlertTriangle,
    BookOpen, Flame, Target, Zap, Shield
} from 'lucide-react'

// ─── Mock B2B Data ─────────────────────────────────────────────────────────
const COHORTS = [
    {
        id: 'c1',
        name: 'IIT Delhi — Batch 2025',
        institution: 'IIT Delhi',
        members: 128,
        activeToday: 94,
        avgStreak: 12,
        avgXP: 4820,
        topHabit: 'Deep Focus Sessions',
        status: 'active',
        joinedDate: '2024-01-15',
    },
    {
        id: 'c2',
        name: 'Startup Founders Club — Q1',
        institution: 'Internal',
        members: 42,
        activeToday: 39,
        avgStreak: 21,
        avgXP: 9200,
        topHabit: 'Morning Review',
        status: 'active',
        joinedDate: '2024-02-01',
    },
    {
        id: 'c3',
        name: 'ISB Executive MBA — Cohort 7',
        institution: 'ISB Hyderabad',
        members: 67,
        activeToday: 48,
        avgStreak: 8,
        avgXP: 3100,
        topHabit: 'Evening Reflection',
        status: 'active',
        joinedDate: '2024-03-10',
    },
]

const METRICS = [
    { label: 'Total Users', value: '237', change: '+12 this week', icon: <Users className="w-5 h-5 text-indigo-400" />, color: 'text-indigo-400' },
    { label: 'Avg Engagement', value: '76%', change: '+4% vs last month', icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400' },
    { label: 'Avg Daily Streak', value: '13.6d', change: 'Up from 11.2d', icon: <Flame className="w-5 h-5 text-orange-400" />, color: 'text-orange-400' },
    { label: 'Goals Created', value: '891', change: 'Across all cohorts', icon: <Target className="w-5 h-5 text-fuchsia-400" />, color: 'text-fuchsia-400' },
]

const ALERTS = [
    { cohort: 'IIT Delhi — Batch 2025', message: '23 members haven\'t logged in for 5+ days', severity: 'warning' },
    { cohort: 'ISB Executive MBA — Cohort 7', message: 'Avg streak dropped 30% this week', severity: 'danger' },
]

const HABITS_CHART = [
    { name: 'Deep Focus', count: 189, pct: 79 },
    { name: 'Daily Review', count: 142, pct: 60 },
    { name: 'Exercise', count: 128, pct: 54 },
    { name: 'Reading', count: 97, pct: 41 },
    { name: 'Journaling', count: 74, pct: 31 },
]

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'reports'>('overview')
    const [selectedCohort, setSelectedCohort] = useState<string | null>(null)

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'cohorts', label: 'Cohorts', icon: <Users className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports', icon: <Download className="w-4 h-4" /> },
    ] as const

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Institution Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Monitor cohort performance across your organisation.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                    <Shield className="w-4 h-4" />
                    B2B Admin View
                </div>
            </div>

            {/* Alerts */}
            {ALERTS.length > 0 && (
                <div className="space-y-2">
                    {ALERTS.map((alert, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${alert.severity === 'danger'
                            ? 'bg-red-900/20 border-red-500/30 text-red-300'
                            : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                            }`}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span><span className="font-semibold">{alert.cohort}:</span> {alert.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
                {METRICS.map(m => (
                    <div key={m.label} className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 mb-2">{m.icon}<span className="text-xs text-slate-500">{m.label}</span></div>
                        <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{m.change}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === tab.id
                            ? 'border-indigo-500 text-white'
                            : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Overview Tab ──────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-6">
                    {/* Top Habits */}
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" /> Top Habits Across Cohorts
                        </h3>
                        <div className="space-y-4">
                            {HABITS_CHART.map(h => (
                                <div key={h.name}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-300 font-medium">{h.name}</span>
                                        <span className="text-slate-500">{h.count} users</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                            style={{ width: `${h.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 7-Day Engagement heatmap-style */}
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Active Rate
                        </h3>
                        <div className="space-y-3">
                            {COHORTS.map(c => {
                                const pct = Math.round((c.activeToday / c.members) * 100)
                                return (
                                    <div key={c.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300 truncate max-w-[200px]">{c.name}</span>
                                            <span className="text-slate-400 font-medium">{pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5">{c.activeToday} / {c.members} members active</p>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />≥80% Excellent</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />60-80% Good</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />&lt;60% At risk</span>
                        </div>
                    </div>

                    {/* Leaderboard top 3 */}
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 col-span-2">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400" /> Top Performers (All Cohorts)
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { rank: 1, name: 'Priya S.', cohort: 'Startup Founders', xp: 12840, streak: 34 },
                                { rank: 2, name: 'Rahul M.', cohort: 'IIT Delhi', xp: 11200, streak: 28 },
                                { rank: 3, name: 'Alex K.', cohort: 'ISB MBA', xp: 9750, streak: 21 },
                            ].map(u => (
                                <div key={u.rank} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
                                    <span className="text-lg font-bold text-amber-400 w-6 text-center">#{u.rank}</span>
                                    <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{u.cohort}</p>
                                        <p className="text-xs text-amber-400 font-medium">{u.xp.toLocaleString()} XP · {u.streak}d 🔥</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Cohorts Tab ───────────────────────────────────────── */}
            {activeTab === 'cohorts' && (
                <div className="space-y-4">
                    {COHORTS.map(cohort => (
                        <div
                            key={cohort.id}
                            className={`rounded-xl bg-slate-900/50 border transition-all cursor-pointer ${selectedCohort === cohort.id ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'}`}
                            onClick={() => setSelectedCohort(selectedCohort === cohort.id ? null : cohort.id)}
                        >
                            <div className="flex items-center gap-4 p-5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-700 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white">{cohort.name}</p>
                                    <p className="text-xs text-slate-500">{cohort.institution} · Joined {cohort.joinedDate}</p>
                                </div>
                                <div className="flex items-center gap-6 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-white">{cohort.members}</p>
                                        <p className="text-xs text-slate-500">Members</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-emerald-400">{cohort.activeToday}</p>
                                        <p className="text-xs text-slate-500">Active Today</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-orange-400">{cohort.avgStreak}d</p>
                                        <p className="text-xs text-slate-500">Avg Streak</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-fuchsia-400">{cohort.avgXP.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">Avg XP</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selectedCohort === cohort.id ? 'rotate-90' : ''}`} />
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {selectedCohort === cohort.id && (
                                <div className="border-t border-slate-800 px-5 py-4 grid grid-cols-3 gap-4">
                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <p className="text-xs text-slate-500 mb-1">Top Habit</p>
                                        <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5 text-orange-400" /> {cohort.topHabit}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <p className="text-xs text-slate-500 mb-1">Engagement Rate</p>
                                        <p className="text-sm font-semibold text-emerald-400">
                                            {Math.round((cohort.activeToday / cohort.members) * 100)}%
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Reports Tab ───────────────────────────────────────── */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <p className="text-sm text-slate-400">Generate and download aggregate reports for your institution.</p>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { title: 'Weekly Engagement Report', desc: 'Active users, streaks, habits, and XP per cohort — 7-day view.', icon: <TrendingUp className="w-5 h-5 text-indigo-400" />, format: 'CSV + PDF' },
                            { title: 'Monthly Cohort Summary', desc: 'Full month breakdown of goals, tasks completed, and burnout signals.', icon: <BarChart3 className="w-5 h-5 text-emerald-400" />, format: 'PDF' },
                            { title: 'Goal Completion Analysis', desc: 'Tracks how many goals progressed, stalled, or completed per member.', icon: <Target className="w-5 h-5 text-fuchsia-400" />, format: 'CSV' },
                            { title: 'Knowledge Retention Report', desc: 'Leitner box averages, flashcard review frequency, and mastery rate.', icon: <BookOpen className="w-5 h-5 text-amber-400" />, format: 'PDF' },
                            { title: 'Burnout Risk Assessment', desc: 'Flags at-risk members based on habit drops, missed tasks, and streak breaks.', icon: <AlertTriangle className="w-5 h-5 text-red-400" />, format: 'CSV + Alerts' },
                            { title: 'Top Performers Spotlight', desc: 'Leaderboard snapshot with XP, streaks, and challenge completions.', icon: <Award className="w-5 h-5 text-amber-400" />, format: 'PDF' },
                        ].map(report => (
                            <div key={report.title} className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">{report.icon}</div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{report.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{report.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{report.format}</span>
                                    <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                        <Download className="w-3.5 h-3.5" /> Generate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* XP breakdown */}
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> XP Breakdown by Category (All Cohorts)
                        </h3>
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Habits', value: '38%', color: 'bg-indigo-500' },
                                { label: 'Tasks', value: '27%', color: 'bg-fuchsia-500' },
                                { label: 'Goals', value: '18%', color: 'bg-emerald-500' },
                                { label: 'Knowledge', value: '10%', color: 'bg-amber-500' },
                                { label: 'Challenges', value: '7%', color: 'bg-red-500' },
                            ].map(c => (
                                <div key={c.label} className="text-center">
                                    <div className="w-full bg-slate-800 rounded-xl h-20 flex items-end justify-center overflow-hidden mb-2">
                                        <div className={`w-full ${c.color} rounded-t-lg`} style={{ height: c.value }} />
                                    </div>
                                    <p className="text-xs font-semibold text-white">{c.value}</p>
                                    <p className="text-xs text-slate-500">{c.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
