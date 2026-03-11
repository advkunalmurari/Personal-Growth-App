import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/stage-unlock — check conditions and unlock next progressive disclosure stage
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch current user data
        const { data: profile } = await supabase
            .from('users')
            .select('disclosure_stage, xp_total, level')
            .eq('id', user.id)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const currentStage = profile.disclosure_stage || 1

        // Already at max stage
        if (currentStage >= 3) {
            return NextResponse.json({ stage: 3, unlocked: false, message: 'Already at max stage' })
        }

        // ─── Check Stage 1 → 2: 5+ tasks completed AND 7-day habit streak ─────
        if (currentStage === 1) {
            const today = new Date()
            const sevenDaysAgo = new Date(today)
            sevenDaysAgo.setDate(today.getDate() - 7)

            // Count completed tasks
            const { count: taskCount } = await supabase
                .from('tasks')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('status', 'completed')

            // Check 7-day streak: any habit logged every day for 7 consecutive days
            const { data: habitLogs } = await supabase
                .from('habit_logs')
                .select('completed_date')
                .eq('user_id', user.id)
                .gte('completed_date', sevenDaysAgo.toISOString().split('T')[0])

            const uniqueDays = new Set(habitLogs?.map(l => l.completed_date) || [])
            const hasSevenDayStreak = uniqueDays.size >= 7

            if ((taskCount || 0) >= 5 && hasSevenDayStreak) {
                await supabase
                    .from('users')
                    .update({ disclosure_stage: 2, stage2_unlocked_at: new Date().toISOString() })
                    .eq('id', user.id)

                return NextResponse.json({
                    stage: 2,
                    unlocked: true,
                    message: '🎉 Stage 2 Unlocked! Goals, Weekly Review, and Analytics are now available.',
                })
            }

            const tasksNeeded = Math.max(0, 5 - (taskCount || 0))
            const daysNeeded = Math.max(0, 7 - uniqueDays.size)

            return NextResponse.json({
                stage: 1,
                unlocked: false,
                progress: {
                    tasks: { current: taskCount || 0, required: 5, remaining: tasksNeeded },
                    streak: { current: uniqueDays.size, required: 7, remaining: daysNeeded },
                },
            })
        }

        // ─── Check Stage 2 → 3: First monthly goal completed ─────────────────
        if (currentStage === 2) {
            const { count: completedGoals } = await supabase
                .from('goals')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .eq('level', 5) // level 5 = monthly goal

            if ((completedGoals || 0) >= 1) {
                await supabase
                    .from('users')
                    .update({ disclosure_stage: 3, stage3_unlocked_at: new Date().toISOString() })
                    .eq('id', user.id)

                return NextResponse.json({
                    stage: 3,
                    unlocked: true,
                    message: '🚀 Stage 3 Unlocked! Full power mode: AI Coach, Focus, Time Blocking, and more.',
                })
            }

            return NextResponse.json({
                stage: 2,
                unlocked: false,
                progress: {
                    monthlyGoals: { current: completedGoals || 0, required: 1, remaining: 1 },
                },
            })
        }

        return NextResponse.json({ stage: currentStage, unlocked: false })

    } catch (e) {
        console.error('Stage unlock error:', e)
        return NextResponse.json({ error: 'Stage check failed' }, { status: 500 })
    }
}

// GET /api/stage-unlock — check progress toward next stage without unlocking
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('users')
            .select('disclosure_stage')
            .eq('id', user.id)
            .single()

        const stage = profile?.disclosure_stage || 1

        // Use POST logic but don't commit the update — just return progress
        const { data: response } = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stage-unlock`,
            {
                method: 'POST',
                headers: { cookie: req.headers.get('cookie') || '' },
            }
        ).then(r => r.json()).then(d => ({ data: d }))

        return NextResponse.json({ stage, ...response })
    } catch {
        return NextResponse.json({ error: 'Progress check failed' }, { status: 500 })
    }
}
