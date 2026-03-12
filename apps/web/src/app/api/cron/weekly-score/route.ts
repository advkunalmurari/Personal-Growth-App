import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/cron/weekly-score
// Runs every Sunday at 8:00 PM IST (UTC 14:30) via Vercel cron
// Calculates and stores weekly_scores for ALL active users
export async function POST(req: NextRequest) {
    // Verify this is called by Vercel Cron or an internal call
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const weekStart = getLastSunday()

    // Fetch all active users
    const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('subscription_status', 'pro')
        .or('subscription_status.eq.trial,subscription_status.eq.free')

    if (error || !users) {
        console.error('Failed to fetch users for weekly score:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    let processed = 0
    const errors: string[] = []

    for (const user of users) {
        try {
            await calculateAndStoreWeeklyScore(supabase, user.id, weekStart)
            processed++
        } catch (e) {
            errors.push(user.id)
            console.error(`Failed to calculate score for user ${user.id}:`, e)
        }
    }

    return NextResponse.json({
        success: true,
        processed,
        errors: errors.length,
        weekStart,
    })
}

async function calculateAndStoreWeeklyScore(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    weekStart: string
) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Parallel fetch of all week's data
    const [tasksRes, habitsRes, focusRes, reviewRes] = await Promise.all([
        supabase.from('tasks')
            .select('status')
            .eq('user_id', userId)
            .gte('scheduled_date', weekStart)
            .lt('scheduled_date', weekEndStr),
        supabase.from('habit_logs')
            .select('id')
            .eq('user_id', userId)
            .gte('completed_date', weekStart)
            .lt('completed_date', weekEndStr),
        supabase.from('focus_sessions')
            .select('duration_mins, completed')
            .eq('user_id', userId)
            .eq('completed', true)
            .gte('started_at', weekStart)
            .lt('started_at', weekEndStr),
        supabase.from('review_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('week_start_date', weekStart)
            .maybeSingle(),
    ])

    // ── Tasks score (0-25): completed / total * 25
    const tasks = tasksRes.data || []
    const tasksTotal = tasks.length
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length
    const tasksScore = tasksTotal > 0
        ? Math.round((tasksCompleted / tasksTotal) * 25)
        : 0

    // ── Habits score (0-25): days logged / 7 * 25
    const habitDays = (habitsRes.data || []).length
    const habitsScore = Math.min(25, Math.round((habitDays / 7) * 25))

    // ── Goals score (0-25): based on focus minutes (proxy for goal progress)
    const focusMins = (focusRes.data || []).reduce((acc, s) => acc + (s.duration_mins || 0), 0)
    const goalsScore = Math.min(25, Math.round(Math.min(focusMins / 300, 1) * 25))
    // 300 min = 5 hours focus per week = perfect score

    // ── Review score (0-25): did they complete the weekly review?
    const reviewScore = reviewRes.data ? 25 : 0

    const totalScore = tasksScore + habitsScore + goalsScore + reviewScore

    // ── Grade
    let grade: string
    if (totalScore >= 90) grade = 'S'
    else if (totalScore >= 75) grade = 'A'
    else if (totalScore >= 60) grade = 'B'
    else if (totalScore >= 45) grade = 'C'
    else if (totalScore >= 30) grade = 'D'
    else grade = 'F'

    // ── Upsert into weekly_scores
    await supabase.from('weekly_scores').upsert({
        user_id: userId,
        week_start_date: weekStart,
        tasks_score: tasksScore,
        habits_score: habitsScore,
        goals_score: goalsScore,
        review_score: reviewScore,
        total_score: totalScore,
        grade,
        metadata: { tasksCompleted, tasksTotal, habitDays, focusMins },
        calculated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_start_date' })

    // ── Award bonus XP for S-grade via xp_ledger (service role insert in cron)
    if (grade === 'S') {
        await supabase.from('xp_ledger').insert({
            user_id: userId,
            action_type: 'weekly_s_grade',
            xp_amount: 100,
            metadata: { week: weekStart, grade },
        })
    }
}

function getLastSunday(): string {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    const sunday = new Date(today.setDate(diff))
    return sunday.toISOString().split('T')[0]
}
