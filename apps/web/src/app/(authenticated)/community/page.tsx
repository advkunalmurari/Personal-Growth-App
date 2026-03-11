'use client'

import { useState } from 'react'
import {
    Users, Trophy, Zap, Target, CheckCircle2,
    Copy, Star, Flame, ChevronRight, Globe,
    Shield, Clock, TrendingUp
} from 'lucide-react'

// ─── Mock data (frontend demo — integrate Supabase realtime in V4) ───────────
const LEADERBOARD = [
    { rank: 1, name: 'Priya S.', avatar: 'P', xp: 12840, streak: 34, badge: '🔥', tag: 'You' },
    { rank: 2, name: 'Rahul M.', avatar: 'R', xp: 11200, streak: 28, badge: '⚡', tag: null },
    { rank: 3, name: 'Alex K.', avatar: 'A', xp: 9750, streak: 21, badge: '🧠', tag: null },
    { rank: 4, name: 'Sophie T.', avatar: 'S', xp: 8400, streak: 18, badge: '🌱', tag: null },
    { rank: 5, name: 'David L.', avatar: 'D', xp: 7900, streak: 15, badge: '🎯', tag: null },
    { rank: 6, name: 'Nina J.', avatar: 'N', xp: 6200, streak: 12, badge: '💡', tag: null },
]

const CHALLENGES = [
    {
        id: '1',
        title: '7-Day Deep Work Hackathon',
        description: 'Complete at least 3 Pomodoro sessions daily for 7 consecutive days.',
        icon: '🧑‍💻',
        color: 'from-indigo-600 to-purple-600',
        border: 'border-indigo-500/30',
        participants: 284,
        daysLeft: 4,
        xpReward: 500,
        joined: false,
    },
    {
        id: '2',
        title: 'No Excuse November — Habit Streak',
        description: 'Maintain a 30-day streak on your primary daily habit. No skips allowed.',
        icon: '🔥',
        color: 'from-orange-600 to-red-600',
        border: 'border-orange-500/30',
        participants: 512,
        daysLeft: 21,
        xpReward: 1000,
        joined: true,
    },
    {
        id: '3',
        title: '30-Day Reading Marathon',
        description: 'Log at least 20 minutes of reading every day for 30 days. Track insights in Second Brain.',
        icon: '📚',
        color: 'from-emerald-600 to-teal-600',
        border: 'border-emerald-500/30',
        participants: 189,
        daysLeft: 14,
        xpReward: 750,
        joined: false,
    },
    {
        id: '4',
        title: 'Reflection Ritual Reset',
        description: 'Complete a Daily Review every day for 14 days using the Review system.',
        icon: '🪞',
        color: 'from-fuchsia-600 to-pink-600',
        border: 'border-fuchsia-500/30',
        participants: 97,
        daysLeft: 7,
        xpReward: 400,
        joined: false,
    },
]

const PARTNERS = [
    { name: 'Rahul M.', avatar: 'R', status: 'active', lastSeen: '2h ago', streak: 28, color: 'bg-emerald-500' },
    { name: 'Sophie T.', avatar: 'S', status: 'active', lastSeen: '5h ago', streak: 18, color: 'bg-amber-500' },
]

const REFERRAL_CODE = 'LOS-KUNAL-7X42'

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenges' | 'partners'>('leaderboard')
    const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set(['2']))
    const [copied, setCopied] = useState(false)
    const [partnerEmail, setPartnerEmail] = useState('')
    const [inviteSent, setInviteSent] = useState(false)

    const handleCopyCode = () => {
        navigator.clipboard.writeText(REFERRAL_CODE).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleJoinChallenge = (id: string) => {
        setJoinedChallenges(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSendInvite = () => {
        if (!partnerEmail.trim()) return
        setInviteSent(true)
        setPartnerEmail('')
        setTimeout(() => setInviteSent(false), 3000)
    }

    const tabs = [
        { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
        { id: 'challenges', label: 'Group Challenges', icon: <Target className="w-4 h-4" /> },
        { id: 'partners', label: 'Accountability', icon: <Users className="w-4 h-4" /> },
    ] as const

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community</h1>
                    <p className="text-slate-400 mt-1">Compete, collaborate, and grow together.</p>
                </div>
                {/* Referral CTA */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">Invite Code (+500 XP)</p>
                        <p className="text-sm font-mono font-bold text-white">{REFERRAL_CODE}</p>
                    </div>
                    <button
                        onClick={handleCopyCode}
                        title="Copy referral code"
                        className="ml-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* XP Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Your XP', value: '12,840', icon: <Zap className="w-5 h-5 text-amber-400" />, sub: 'Global Rank #1' },
                    { label: 'Active Challenges', value: joinedChallenges.size, icon: <Target className="w-5 h-5 text-indigo-400" />, sub: `${CHALLENGES.length} available` },
                    { label: 'Partners', value: PARTNERS.length, icon: <Users className="w-5 h-5 text-fuchsia-400" />, sub: 'All active today' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-slate-500">{s.label}</span></div>
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-0">
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

            {/* ─── Tab: Leaderboard ─────────────────────────────── */}
            {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Globe className="w-4 h-4" />
                        Global leaderboard — updated daily
                    </div>

                    {/* Top 3 podium */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((user, i) => {
                            const positions = [2, 1, 3]
                            const pos = positions[i]
                            const heights = ['h-24', 'h-32', 'h-20']
                            const golds = ['bg-slate-700', 'bg-gradient-to-b from-amber-500 to-amber-700', 'bg-slate-800']
                            return (
                                <div key={user.rank} className="flex flex-col items-center gap-2">
                                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${pos === 1 ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : pos === 2 ? 'bg-gradient-to-tr from-slate-400 to-slate-300' : 'bg-gradient-to-tr from-amber-700 to-orange-600'}`}>
                                        {user.avatar}
                                        <span className="absolute -bottom-1 -right-1 text-xs">{user.badge}</span>
                                    </div>
                                    <p className="text-xs text-white font-semibold text-center">{user.name}{user.tag ? ` (${user.tag})` : ''}</p>
                                    <p className="text-xs text-slate-400">{user.xp.toLocaleString()} XP</p>
                                    <div className={`w-full ${heights[i]} ${golds[i]} rounded-t-lg flex items-end justify-center pb-2`}>
                                        <span className="text-white font-bold text-lg">#{pos}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Full Leaderboard List */}
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden divide-y divide-slate-800">
                        {LEADERBOARD.map(user => (
                            <div key={user.rank} className={`flex items-center gap-4 px-5 py-3.5 ${user.tag === 'You' ? 'bg-indigo-500/5' : ''}`}>
                                <span className={`text-sm font-bold w-6 text-center ${user.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {user.rank}
                                </span>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white ${user.tag === 'You' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    {user.avatar}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">
                                        {user.name}
                                        {user.tag && <span className="ml-2 text-xs text-indigo-400 font-semibold">{user.tag}</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Flame className="w-3 h-3 text-orange-400" /> {user.streak}-day streak
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">{user.xp.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">XP</p>
                                </div>
                                <span className="text-lg">{user.badge}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Tab: Group Challenges ────────────────────────── */}
            {activeTab === 'challenges' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CHALLENGES.map(challenge => {
                        const joined = joinedChallenges.has(challenge.id)
                        return (
                            <div key={challenge.id} className={`rounded-2xl bg-slate-900/50 border ${challenge.border} overflow-hidden`}>
                                <div className={`h-2 w-full bg-gradient-to-r ${challenge.color}`} />
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{challenge.icon}</span>
                                            <div>
                                                <h3 className="font-semibold text-white text-sm leading-tight">{challenge.title}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                    <Users className="w-3 h-3" />{challenge.participants} joined
                                                    <Clock className="w-3 h-3 ml-1" />{challenge.daysLeft}d left
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold flex-shrink-0">
                                            <Zap className="w-3 h-3" />
                                            +{challenge.xpReward}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{challenge.description}</p>
                                    <button
                                        onClick={() => handleJoinChallenge(challenge.id)}
                                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${joined
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                            : `bg-gradient-to-r ${challenge.color} text-white hover:opacity-90`
                                            }`}
                                    >
                                        {joined ? (<><CheckCircle2 className="w-4 h-4" /> Joined</>) : (<>Join Challenge <ChevronRight className="w-4 h-4" /></>)}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ─── Tab: Accountability Partners ─────────────────── */}
            {activeTab === 'partners' && (
                <div className="space-y-6">
                    {/* Existing Partners */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Accountability Partners</h2>
                        <div className="space-y-3">
                            {PARTNERS.map(partner => (
                                <div key={partner.name} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <div className={`w-11 h-11 rounded-full ${partner.color} flex items-center justify-center font-bold text-white`}>
                                        {partner.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{partner.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                            Active · Last seen {partner.lastSeen}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-orange-400 font-semibold flex items-center gap-1">
                                            <Flame className="w-3.5 h-3.5" /> {partner.streak}d
                                        </p>
                                        <p className="text-xs text-slate-500">streak</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <TrendingUp className="w-3 h-3" /> On track
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Shield className="w-3 h-3" /> Trusted
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invite a Partner */}
                    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5">
                        <h3 className="font-semibold text-white mb-1">Invite an Accountability Partner</h3>
                        <p className="text-sm text-slate-400 mb-4">Partners can see your streak and challenge each other to stay consistent.</p>
                        <div className="flex gap-3">
                            <input
                                value={partnerEmail}
                                onChange={e => setPartnerEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
                                placeholder="Enter their email address..."
                                aria-label="Partner email"
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleSendInvite}
                                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all flex-shrink-0"
                            >
                                {inviteSent ? '✓ Sent!' : 'Send Invite'}
                            </button>
                        </div>
                        {inviteSent && <p className="text-xs text-emerald-400 mt-2">✓ Invite sent! They&apos;ll receive +200 XP for joining.</p>}
                    </div>

                    {/* How it works */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: '📨', title: 'Invite', desc: 'Send an invite link or email to a friend' },
                            { icon: '🤝', title: 'Connect', desc: 'They accept and your profiles link up' },
                            { icon: '🏆', title: 'Compete', desc: 'See each other\'s progress and stay accountable' },
                        ].map(step => (
                            <div key={step.title} className="text-center p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                                <div className="text-2xl mb-2">{step.icon}</div>
                                <p className="text-xs font-semibold text-white mb-1">{step.title}</p>
                                <p className="text-xs text-slate-500 leading-snug">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
