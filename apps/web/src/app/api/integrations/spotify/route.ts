import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/spotify/callback`

// Focus Mode Playlists  
const FOCUS_PLAYLISTS = [
    { id: '37i9dQZF1DX8NTLI2TtZa6', name: 'Deep Focus', emoji: '🧠' },
    { id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Work', emoji: '⚡' },
    { id: '37i9dQZF1DX4sWSpwq3LiO', name: 'Intense Studying', emoji: '📚' },
    { id: '37i9dQZF1DWXe9gFZP0gtP', name: 'Brain Food', emoji: '🎯' },
]

// ─── GET: Start OAuth or handle callback ──────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'callback') {
        const code = searchParams.get('code')
        if (!code) return NextResponse.redirect(`/?error=spotify_auth_failed`)

        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        })

        const tokens = await tokenRes.json()
        if (!tokens.access_token) return NextResponse.redirect(`/?error=spotify_token_failed`)

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.redirect('/login')

        await supabase.from('integrations').upsert({
            user_id: user.id,
            provider: 'spotify',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }, { onConflict: 'user_id,provider' })

        return NextResponse.redirect(`/focus?spotify=connected`)
    }

    // Start Spotify OAuth
    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing')

    return NextResponse.redirect(authUrl.toString())
}

// ─── POST /api/integrations/spotify - Play a focus playlist ─────────────────
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action, playlist_index = 0 } = await req.json()

        const { data: integration } = await supabase
            .from('integrations')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', user.id)
            .eq('provider', 'spotify')
            .single()

        if (!integration) {
            return NextResponse.json({ error: 'Spotify not connected', connect_url: '/api/integrations/spotify' }, { status: 400 })
        }

        let accessToken = integration.access_token

        // Refresh if expired
        if (new Date(integration.expires_at) < new Date()) {
            const refreshRes = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    refresh_token: integration.refresh_token,
                    grant_type: 'refresh_token',
                }),
            })
            const newTokens = await refreshRes.json()
            accessToken = newTokens.access_token
        }

        if (action === 'play') {
            const playlist = FOCUS_PLAYLISTS[playlist_index] || FOCUS_PLAYLISTS[0]
            await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ context_uri: `spotify:playlist:${playlist.id}` }),
            })
            return NextResponse.json({ playing: playlist.name })
        }

        if (action === 'pause') {
            await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            return NextResponse.json({ paused: true })
        }

        if (action === 'playlists') {
            return NextResponse.json({ playlists: FOCUS_PLAYLISTS })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    } catch (e) {
        console.error('Spotify error:', e)
        return NextResponse.json({ error: 'Spotify request failed' }, { status: 500 })
    }
}
