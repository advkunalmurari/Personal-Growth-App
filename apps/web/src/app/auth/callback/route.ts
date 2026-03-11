import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /auth/callback
// ─── Handles OAuth redirects (Google, Apple) and magic-link email confirmations
// After Supabase exchanges the code for a session, we determine whether the
// user is brand-new (send to /onboarding) or returning (send to /dashboard).
export async function GET(req: NextRequest) {
    const { searchParams, origin } = new URL(req.url)
    const code  = searchParams.get('code')
    const next  = searchParams.get('next') ?? '/dashboard'
    const error = searchParams.get('error')

    // Handle OAuth errors (e.g. user cancelled the Google consent screen)
    if (error) {
        console.error('Auth callback error:', error, searchParams.get('error_description'))
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error)}`
        )
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=missing_code`)
    }

    const supabase = await createClient()

    // Exchange the auth code for a session (sets the cookie)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
        console.error('Code exchange failed:', exchangeError.message)
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        )
    }

    // Check if this user is brand-new (no onboarding_completed_at)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('onboarding_completed_at')
            .eq('id', user.id)
            .maybeSingle()

        // New user or no profile yet → send to onboarding
        if (!profile || !profile.onboarding_completed_at) {
            return NextResponse.redirect(`${origin}/onboarding`)
        }
    }

    // Returning user — send to intended destination or dashboard
    return NextResponse.redirect(`${origin}${next}`)
}
