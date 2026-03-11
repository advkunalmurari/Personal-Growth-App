import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

// ─── Send a WhatsApp message via Twilio ──────────────────────────────────────
async function sendWhatsApp(to: string, body: string) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            From: TWILIO_WHATSAPP_FROM,
            To: `whatsapp:${to}`,
            Body: body,
        }),
    })

    return res.json()
}

// ─── POST: WhatsApp Webhook (incoming messages from users) ───────────────────
export async function POST(req: NextRequest) {
    const formData = await req.formData()
    const body = formData.get('Body')?.toString().trim().toLowerCase() || ''
    const from = formData.get('From')?.toString().replace('whatsapp:', '') || ''

    const supabase = await createClient()

    // Find user by phone number
    const { data: userProfile } = await supabase
        .from('users')
        .select('id, name, xp_total, level')
        .eq('phone', from)
        .single()

    if (!userProfile) {
        await sendWhatsApp(from, `👋 You don't have a Life OS account linked to this number. Sign up at lifeos.app!`)
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            headers: { 'Content-Type': 'text/xml' },
        })
    }

    let reply = ''

    // Command routing
    if (body === 'status' || body === 'stats') {
        reply = `📊 *Life OS Daily Status*\n\n👤 ${userProfile.name}\n⚡ Level ${userProfile.level} | ${userProfile.xp_total} XP\n\nReply with:\n• *tasks* - Today's tasks\n• *habit* - Log a habit\n• *focus* - Start a focus session`

    } else if (body === 'tasks') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { data: tasks } = await supabase
            .from('tasks')
            .select('title, status')
            .eq('user_id', userProfile.id)
            .gte('scheduled_date', today.toISOString())
            .limit(5)

        const taskText = tasks?.map((t, i) =>
            `${i + 1}. ${t.status === 'done' ? '✅' : '⬜'} ${t.title}`
        ).join('\n') || 'No tasks scheduled for today.'

        reply = `📋 *Today's Tasks*\n\n${taskText}\n\nVisit lifeos.app for the full view.`

    } else if (body.startsWith('done ')) {
        const taskName = body.slice(5)
        const { data: task } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', userProfile.id)
            .ilike('title', `%${taskName}%`)
            .single()

        if (task) {
            await supabase.from('tasks').update({ status: 'done' }).eq('id', task.id)
            reply = `✅ Marked "*${task.title}*" as done! +10 XP`
        } else {
            reply = `❌ Couldn't find a task matching "${taskName}". Try the full task name.`
        }

    } else {
        reply = `🤖 *Life OS Bot Commands*\n\n• *status* - Your daily stats\n• *tasks* - View today's tasks\n• *done [task name]* - Mark a task complete\n\nPowered by Life OS 🚀`
    }

    await sendWhatsApp(from, reply)

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
    })
}
