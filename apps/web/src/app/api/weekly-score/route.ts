import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/weekly-score — returns the user's most recent weekly score
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get last Sunday's date (when the score was calculated)
    const today = new Date()
    const daysSinceSunday = today.getDay()
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() - daysSinceSunday)
    const weekStart = lastSunday.toISOString().split('T')[0]

    // Try to get the pre-calculated score for this week
    const { data: score } = await supabase
        .from('weekly_scores')
        .select('total_score, grade, tasks_score, habits_score, goals_score, review_score, week_start_date')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (score) {
        return NextResponse.json(score, {
            headers: { 'Cache-Control': 'private, max-age=3600' },
        })
    }

    // If no score calculated yet (new user this week) — compute a real-time estimate
    const weekEnd = new Date(lastSunday)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const [tasksRes, habitsRes, reviewRes] = await Promise.all([
        supabase.from('tasks')
            .select('status')
            .eq('user_id', user.id)
            .gte('scheduled_date', weekStart)
            .lt('scheduled_date', weekEndStr),
        supabase.from('habit_logs')
            .select('completed_date')
            .eq('user_id', user.id)
            .gte('completed_date', weekStart)
            .lt('completed_date', weekEndStr),
        supabase.from('review_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('week_start_date', weekStart)
            .maybeSingle(),
    ])

    const tasks = tasksRes.data || []
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length
    const tasksScore = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 25) : 0
    const habitsScore = Math.min(25, Math.round(((habitsRes.data?.length || 0) / 7) * 25))
    const reviewScore = reviewRes.data ? 25 : 0
    const totalScore = tasksScore + habitsScore + reviewScore

    let grade = 'F'
    if (totalScore >= 90) grade = 'S'
    else if (totalScore >= 75) grade = 'A'
    else if (totalScore >= 60) grade = 'B'
    else if (totalScore >= 45) grade = 'C'
    else if (totalScore >= 30) grade = 'D'

    return NextResponse.json({
        total_score: totalScore,
        grade,
        tasks_score: tasksScore,
        habits_score: habitsScore,
        goals_score: 0, // no focus data yet
        review_score: reviewScore,
        week_start_date: weekStart,
        is_estimate: true,
    }, {
        headers: { 'Cache-Control': 'private, max-age=900' }, // cache 15 min
    })
}
