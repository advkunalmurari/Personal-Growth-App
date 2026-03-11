'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Target, ListTodo, Flame, BarChart3, Clock, MoreHorizontal,
    Bot, BookOpen, AreaChart, Timer, ShieldAlert, Sparkles,
    Users, Building2, Lock
} from 'lucide-react'

interface UserProfile {
    name?: string | null
    level?: number | null
    xp_total?: number | null
    disclosure_stage?: number | null
}

interface Props {
    profile: UserProfile | null
    userInitial: string
}

const XP_PER_LEVEL = 1000

// ─── Stage-aware navigation definition ───────────────────────────────────────
// Each link has a minStage: only shown if user's disclosure_stage >= minStage
const NAV_SECTIONS: {
    label: string
    links: {
        href: string
        icon: React.ComponentType<{ className?: string }>
        label: string
        color: string
        minStage: number
        badge?: string
    }[]
}[] = [
        {
            label: 'Cmd Center',
            links: [
                { href: '/dashboard', icon: BarChart3, label: 'Today', color: 'text-indigo-400', minStage: 1 },
                { href: '/habits', icon: Flame, label: 'Habits', color: 'text-fuchsia-400', minStage: 1 },
                { href: '/goals', icon: Target, label: 'Goal Engine', color: 'text-indigo-400', minStage: 2 },
                { href: '/tasks', icon: ListTodo, label: 'Tasks', color: 'text-indigo-400', minStage: 2 },
                { href: '/review', icon: BookOpen, label: 'Review', color: 'text-emerald-400', minStage: 2 },
                { href: '/schedule', icon: Clock, label: 'Schedule', color: 'text-indigo-400', minStage: 3 },
            ],
        },
        {
            label: 'AI Agents',
            links: [
                { href: '/ai', icon: Bot, label: 'AI Coach', color: 'text-fuchsia-400', badge: 'NEW', minStage: 3 },
            ],
        },
        {
            label: 'Performance',
            links: [
                { href: '/focus', icon: Timer, label: 'Focus Mode', color: 'text-amber-400', minStage: 3 },
                { href: '/analytics', icon: AreaChart, label: 'Analytics', color: 'text-indigo-400', minStage: 2 },
                { href: '/recovery', icon: ShieldAlert, label: 'Recovery', color: 'text-rose-400', minStage: 3 },
            ],
        },
        {
            label: 'Second Brain',
            links: [
                { href: '/knowledge', icon: Sparkles, label: 'Knowledge', color: 'text-amber-400', minStage: 3 },
            ],
        },
        {
            label: 'Social',
            links: [
                { href: '/community', icon: Users, label: 'Community', color: 'text-sky-400', minStage: 2 },
            ],
        },
        {
            label: 'Admin',
            links: [
                { href: '/admin', icon: Building2, label: 'Institution', color: 'text-slate-400', minStage: 1 },
            ],
        },
    ]

// Stage unlock requirements
const STAGE_HINTS: Record<number, string> = {
    2: 'Unlock: 5 tasks + 7-day streak',
    3: 'Unlock: Complete first monthly goal',
}

export default function SidebarNav({ profile, userInitial }: Props) {
    const pathname = usePathname()
    const stage = profile?.disclosure_stage ?? 1
    const xp = profile?.xp_total ?? 0
    const level = profile?.level ?? 1
    const xpInLevel = xp % XP_PER_LEVEL
    const xpPct = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100))

    // Collect locked stages to show a single hint row
    const hasLockedItems = NAV_SECTIONS.some(s =>
        s.links.some(l => l.minStage > stage)
    )
    const nextStage = stage < 3 ? stage + 1 : null

    return (
        <nav className="w-64 border-r border-gray-800 bg-gray-900/50 flex flex-col backdrop-blur-md z-10 hidden md:flex">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                    LOS.
                </h1>
                {/* Stage badge */}
                <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                    Stage {stage}
                </span>
            </div>

            {/* Nav links — scrollable */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-0.5 scrollbar-none">
                {NAV_SECTIONS.map((section, si) => {
                    const visibleLinks = section.links.filter(l => l.minStage <= stage)
                    if (visibleLinks.length === 0) return null

                    return (
                        <div key={section.label} className={si > 0 ? 'mt-4' : ''}>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 pb-1.5">
                                {section.label}
                            </p>
                            {visibleLinks.map(link => {
                                const Icon = link.icon
                                const isActive = pathname === link.href ||
                                    (link.href !== '/dashboard' && pathname.startsWith(link.href))
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group mb-0.5 ${isActive
                                            ? 'bg-indigo-600/15 text-white ring-1 ring-indigo-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? link.color : 'text-gray-500'}`} />
                                        <span className="flex-1 truncate">{link.label}</span>
                                        {link.badge && (
                                            <span className="text-[9px] font-bold text-fuchsia-400 bg-fuchsia-400/10 px-1.5 py-0.5 rounded leading-none">
                                                {link.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    )
                })}

                {/* Locked features hint */}
                {hasLockedItems && nextStage && (
                    <div className="mt-4 mx-1 p-3 rounded-xl bg-white/3 border border-dashed border-white/10">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Lock className="w-3 h-3 flex-shrink-0" />
                            <p className="text-[10px] leading-snug">{STAGE_HINTS[nextStage]}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* User card with XP bar */}
            <div className="p-4 border-t border-gray-800 flex-shrink-0">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-700 flex items-center justify-center font-bold text-sm text-white">
                                {userInitial}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-900" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{profile?.name || 'User'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] uppercase font-bold text-fuchsia-400 bg-fuchsia-400/10 px-1.5 py-0.5 rounded">
                                    LVL {level}
                                </span>
                                <span className="text-[10px] text-gray-500">{xpInLevel}/{XP_PER_LEVEL} XP</span>
                            </div>
                            {/* XP progress bar */}
                            <div className="mt-1.5 w-full bg-gray-700 rounded-full h-1">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 h-1 rounded-full transition-all duration-700"
                                    style={{ width: `${xpPct}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
                </div>
            </div>
        </nav>
    )
}
