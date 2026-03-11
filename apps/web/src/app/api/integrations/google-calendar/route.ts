import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`

// ─── GET: Start OAuth flow ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'callback') {
        const code = searchParams.get('code')

        if (!code) return NextResponse.redirect(`/?error=no_code`)

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI.replace('?action=callback', ''),
                grant_type: 'authorization_code',
            }),
        })
        const tokens = await tokenRes.json()

        if (!tokens.access_token) {
            return NextResponse.redirect(`/?error=token_exchange_failed`)
        }

        // Save tokens to Supabase
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.redirect('/login')

        await supabase.from('integrations').upsert({
            user_id: user.id,
            provider: 'google_calendar',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }, { onConflict: 'user_id,provider' })

        return NextResponse.redirect(`/dashboard/schedule?connected=true`)
    }

    // Start OAuth
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ].join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(authUrl.toString())
}

// ─── POST: Sync schedule blocks to Google Calendar ───────────────────────────
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get Google Calendar tokens
        const { data: integration } = await supabase
            .from('integrations')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', user.id)
            .eq('provider', 'google_calendar')
            .single()

        if (!integration) {
            return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
        }

        let accessToken = integration.access_token

        // Refresh the token if expired
        if (new Date(integration.expires_at) < new Date()) {
            const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    refresh_token: integration.refresh_token,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                }),
            })
            const newTokens = await refreshRes.json()
            accessToken = newTokens.access_token

            await supabase.from('integrations').update({
                access_token: accessToken,
                expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            }).eq('user_id', user.id).eq('provider', 'google_calendar')
        }

        // Get today's time blocks
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        const { data: timeBlocks } = await supabase
            .from('time_blocks')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', today.toISOString())
            .lt('start_time', tomorrow.toISOString())

        if (!timeBlocks?.length) {
            return NextResponse.json({ synced: 0, message: 'No time blocks to sync today' })
        }

        // Create/update Google Calendar events
        const results = await Promise.allSettled(
            timeBlocks.map(block =>
                fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        summary: block.title || 'Life OS Block',
                        description: block.notes || '',
                        start: { dateTime: block.start_time },
                        end: { dateTime: block.end_time },
                        colorId: '9', // blueberry
                    }),
                })
            )
        )

        const synced = results.filter(r => r.status === 'fulfilled').length

        return NextResponse.json({ synced, total: timeBlocks.length })

    } catch (e) {
        console.error('Calendar sync error:', e)
        return NextResponse.json({ error: 'Calendar sync failed' }, { status: 500 })
    }
}
