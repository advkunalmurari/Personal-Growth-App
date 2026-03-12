import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// POST /api/cron/badge-check
// Runs every day at midnight via Vercel cron
// Awards badges to users who have newly qualified

interface BadgeRule {
    key: string
    check: (stats: UserStats) => boolean
}

interface UserStats {
    xp_total: number
    level: number
    task_count: number
    longest_streak: number
    focus_session_count: number
    review_count: number
    completed_monthly_goals: number
    focus_total_mins: number
}

const BADGE_RULES: BadgeRule[] = [
    { key: 'first_win', check: s => s.task_count >= 1 },
    { key: 'week_warrior', check: s => s.longest_streak >= 7 },
    { key: 'century_club', check: s => s.xp_total >= 1000 },
    { key: 'rising_star', check: s => s.level >= 5 },
    { key: 'elite', check: s => s.level >= 10 },
    { key: 'focus_master', check: s => s.focus_session_count >= 25 },
    { key: 'goal_crusher', check: s => s.completed_monthly_goals >= 1 },
    { key: 'consistent', check: s => s.longest_streak >= 30 },
    { key: 'deep_worker', check: s => s.focus_total_mins >= 600 },
    { key: 'reviewer', check: s => s.review_count >= 4 },
]

export async function POST(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all badge IDs in one query
    const { data: badges } = await supabase
        .from('badges')
        .select('id, badge_key')

    if (!badges) return NextResponse.json({ awarded: 0 })

    const badgeMap = Object.fromEntries((badges || []).map((b: any) => [b.badge_key, b.id]))

    // Get all users with their stats via a single view/RPC call
    const { data: users } = await supabase.rpc('get_user_badge_stats')
    if (!users) return NextResponse.json({ awarded: 0 })

    let totalAwarded = 0

    for (const user of users) {
        const stats = user as UserStats & { id: string; earned_badge_keys: string[] }

        for (const rule of BADGE_RULES) {
            if (stats.earned_badge_keys?.includes(rule.key)) continue // already has it
            if (!rule.check(stats)) continue // doesn't qualify
            if (!badgeMap[rule.key]) continue // badge doesn't exist in DB

            // Award the badge
            await supabase.from('user_badges').insert({
                user_id: stats.id,
                badge_id: badgeMap[rule.key],
            }).then(() => {
                // Award XP for the badge
                supabase.from('xp_ledger').insert({
                    user_id: stats.id,
                    action_type: 'admin_grant',
                    xp_amount: 50,
                    metadata: { badge_key: rule.key, reason: 'badge_award' },
                })
            })

            totalAwarded++
        }
    }

    return NextResponse.json({ awarded: totalAwarded, users: users.length })
}
