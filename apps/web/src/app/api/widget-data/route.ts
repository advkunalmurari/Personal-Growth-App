import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/widget-data?userId=... - Provides lightweight data for home screen widgets
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }

        const supabase = await createClient()

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayIso = today.toISOString()

        // Fetch all needed data in parallel
        const [
            { data: userRecord },
            { data: todayTasks },
            { data: todayHabits },
        ] = await Promise.all([
            supabase
                .from('users')
                .select('name, level, xp_total')
                .eq('id', userId)
                .single(),
            supabase
                .from('tasks')
                .select('status')
                .eq('user_id', userId)
                .gte('scheduled_date', todayIso),
            supabase
                .from('habit_logs')
                .select('id')
                .eq('user_id', userId)
                .gte('logged_at', todayIso),
        ])

        const tasksTotal = todayTasks?.length || 0
        const tasksDone = todayTasks?.filter(t => t.status === 'done').length || 0

        const hour = new Date().getHours()
        let greeting = 'Good morning'
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
        else if (hour >= 17) greeting = 'Good evening'

        return NextResponse.json({
            name: userRecord?.name || 'You',
            level: userRecord?.level || 1,
            xp: userRecord?.xp_total || 0,
            tasksCompleted: tasksDone,
            totalTasks: tasksTotal,
            habitsLoggedToday: todayHabits?.length || 0,
            greeting,
            updatedAt: new Date().toISOString(),
        }, {
            headers: {
                // Widgets can cache for 30 minutes
                'Cache-Control': 'private, max-age=1800',
            },
        })

    } catch (e) {
        console.error('Widget data error:', e)
        return NextResponse.json({ error: 'Failed to fetch widget data' }, { status: 500 })
    }
}
