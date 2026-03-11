import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PushMessage {
    to: string
    title: string
    body: string
    data?: Record<string, string>
    sound?: 'default' | null
    badge?: number
    channelId?: string
}

async function sendExpoPushNotifications(messages: PushMessage[]) {
    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
    const chunks = []
    const chunkSize = 100

    // Expo recommends sending in batches of 100
    for (let i = 0; i < messages.length; i += chunkSize) {
        chunks.push(messages.slice(i, i + chunkSize))
    }

    const results = await Promise.allSettled(
        chunks.map(chunk =>
            fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                },
                body: JSON.stringify(chunk),
            }).then(res => res.json())
        )
    )

    return results
}

// POST /api/push - Send notifications to specific users or broadcast
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { target, title, message: notifBody, data, type = 'default' } = body

        // Fetch push tokens based on target
        let query = supabase.from('push_tokens').select('token')

        if (target === 'self') {
            query = query.eq('user_id', user.id)
        } else if (target?.user_ids && Array.isArray(target.user_ids)) {
            query = query.in('user_id', target.user_ids)
        }

        const { data: tokens } = await query

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No tokens found' })
        }

        const channelId = type === 'reminder' ? 'reminders' : 'default'

        const messages: PushMessage[] = tokens.map(({ token }) => ({
            to: token,
            title,
            body: notifBody,
            sound: 'default',
            data: data || { url: '/dashboard' }, // deep link
            channelId,
        }))

        const results = await sendExpoPushNotifications(messages)
        const successCount = results.filter(r => r.status === 'fulfilled').length

        return NextResponse.json({
            sent: successCount,
            total: messages.length,
        })

    } catch (e) {
        console.error('Push notification error:', e)
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
    }
}
