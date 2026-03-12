import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { rateLimit } from '@/lib/rate-limit'
import { validateBody, schemas } from '@/lib/validation'

// ─── XP Awards Table ─────────────────────────────────────────────────────────
const XP_TABLE: Record<string, number> = {
    task_complete: 10,
    task_complete_on_time: 15,
    habit_logged: 8,
    habit_streak_7: 25,
    habit_streak_30: 100,
    habit_streak_100: 500,
    focus_session_25min: 12,
    focus_session_90min: 40,
    goal_milestone: 50,
    review_completed: 20,
    first_win_of_day: 5,
}

// ─── Anti-Cheat Config ────────────────────────────────────────────────────────
const MAX_XP_PER_HOUR = 200
const MAX_XP_PER_DAY = 600
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// ─── Badge Definitions ────────────────────────────────────────────────────────
const BADGES = [
    { id: 'first_task', label: '🎯 First Win', condition: (xp: number, level: number) => xp >= 10 && level === 1 },
    { id: 'week_streak', label: '🔥 Week Streak', condition: (_: number, __: number, streak7: boolean) => streak7 },
    { id: 'century_club', label: '💯 Century Club', condition: (xp: number) => xp >= 1000 },
    { id: 'level_5', label: '⚡ Rising Star', condition: (_: number, level: number) => level >= 5 },
    { id: 'level_10', label: '🏆 Elite Performer', condition: (_: number, level: number) => level >= 10 },
    { id: 'focus_master', label: '🧠 Focus Master', condition: (xp: number) => xp >= 500 },
]

function calculateLevel(totalXP: number): number {
    // XP thresholds follow a curve: level n requires n * 100 XP
    let level = 1
    let required = 100
    let remaining = totalXP
    while (remaining >= required) {
        remaining -= required
        level++
        required = level * 100
    }
    return level
}

export async function POST(req: NextRequest) {
    // Rate limit: 30 XP events per minute per IP
    const rl = rateLimit(req, { limit: 30, windowSeconds: 60, prefix: 'xp' })
    if (!rl.success) return rl.response

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Validate input with Zod
        const validation = await validateBody(req, schemas.xpRequest)
        if (validation.error) return validation.error

        const { action, metadata = {} } = validation.data
        const xpToAward = XP_TABLE[action] || 0

        // ─── Anti-Cheat: Rate Limiting ────────────────────────────────────────
        const { data: recentXP } = await supabase
            .from('xp_log')
            .select('xp_amount, created_at')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())

        const hourlyXP = (recentXP || []).reduce((sum, r) => sum + r.xp_amount, 0)
        if (hourlyXP + xpToAward > MAX_XP_PER_HOUR) {
            return NextResponse.json({ error: 'Rate limit: Max XP per hour reached', throttled: true })
        }

        // ─── Anti-Cheat: Daily Cap ────────────────────────────────────────────
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: todayXP } = await supabase
            .from('xp_log')
            .select('xp_amount')
            .eq('user_id', user.id)
            .gte('created_at', todayStart.toISOString())

        const dailyXP = (todayXP || []).reduce((sum, r) => sum + r.xp_amount, 0)
        if (dailyXP + xpToAward > MAX_XP_PER_DAY) {
            return NextResponse.json({ error: 'Rate limit: Max XP per day reached', throttled: true })
        }

        // ─── Log this XP event ────────────────────────────────────────────────
        await supabase.from('xp_log').insert({
            user_id: user.id,
            action,
            xp_amount: xpToAward,
            metadata,
        })

        // ─── Update User's Total XP ───────────────────────────────────────────
        const { data: userRecord } = await supabase
            .from('users')
            .select('xp_total, level')
            .eq('id', user.id)
            .single()

        const currentXP = userRecord?.xp_total || 0
        const newXP = currentXP + xpToAward
        const newLevel = calculateLevel(newXP)
        const leveledUp = newLevel > (userRecord?.level || 1)

        await supabase
            .from('users')
            .update({ xp_total: newXP, level: newLevel })
            .eq('id', user.id)

        // ─── Badge Evaluation ─────────────────────────────────────────────────
        const hasStreak7 = action === 'habit_streak_7'
        const earnedBadges: string[] = []

        for (const badge of BADGES) {
            const earned = badge.condition(newXP, newLevel, hasStreak7)
            if (earned) {
                // Upsert badge (idempotent)
                const { error: badgeError } = await supabase
                    .from('badges')
                    .upsert(
                        { user_id: user.id, badge_id: badge.id, label: badge.label },
                        { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
                    )
                if (!badgeError) earnedBadges.push(badge.id)
            }
        }

        return NextResponse.json({
            success: true,
            xp_awarded: xpToAward,
            xp_total: newXP,
            level: newLevel,
            leveled_up: leveledUp,
            badges_earned: earnedBadges,
        })

    } catch (e) {
        console.error('XP route error:', e)
        return NextResponse.json({ error: 'XP processing failed' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Leaderboard: top 10 users by XP
        const { data: leaderboard } = await supabase
            .from('users')
            .select('id, name, xp_total, level')
            .order('xp_total', { ascending: false })
            .limit(10)

        return NextResponse.json({ leaderboard: leaderboard || [] })
    } catch (e) {
        console.error('Leaderboard error:', e)
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }
}
