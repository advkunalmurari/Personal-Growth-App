import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/cron/habit-reminders
// Runs every day at 6:30 AM IST (UTC 01:00)
// Sends push notification reminders to users who haven't logged habits yet

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role — bypasses RLS
)

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Users who have active habits but haven't logged ANY today
    const { data: pendingUsers } = await supabase.rpc('get_users_needing_habit_reminder', {
        p_date: todayStr,
    })

    if (!pendingUsers || pendingUsers.length === 0) {
        return NextResponse.json({ sent: 0 })
    }

    let sent = 0

    for (const user of pendingUsers) {
        if (!user.push_token) continue

        try {
            // Expo Push API
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.push_token,
                    title: '🔥 Keep your streak alive!',
                    body: `You haven't logged your habits yet today. Tap to log now!`,
                    data: { screen: 'habits', action: 'log' },
                    sound: 'default',
                    badge: 1,
                }),
            })
            sent++
        } catch (e) {
            console.error(`Push failed for user ${user.id}:`, e)
        }
    }

    return NextResponse.json({ sent, total: pendingUsers.length })
}
