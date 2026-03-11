import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// ─── GET /api/privacy/export - Download all user data as JSON ────────────────
export async function GET(req: NextRequest) {
    const rl = rateLimit(req, { limit: 3, windowSeconds: 3600, prefix: 'export' })
    if (!rl.success) return rl.response

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Collect all user data in parallel
        const [
            { data: profile },
            { data: tasks },
            { data: goals },
            { data: habits },
            { data: habitLogs },
            { data: timeBlocks },
            { data: journals },
            { data: xpLog },
            { data: badges },
        ] = await Promise.all([
            supabase.from('users').select('*').eq('id', user.id).single(),
            supabase.from('tasks').select('*').eq('user_id', user.id),
            supabase.from('goals').select('*').eq('user_id', user.id),
            supabase.from('habits').select('*').eq('user_id', user.id),
            supabase.from('habit_logs').select('*').eq('user_id', user.id),
            supabase.from('time_blocks').select('*').eq('user_id', user.id),
            supabase.from('journals').select('*').eq('user_id', user.id),
            supabase.from('xp_log').select('*').eq('user_id', user.id),
            supabase.from('badges').select('*').eq('user_id', user.id),
        ])

        const exportData = {
            exported_at: new Date().toISOString(),
            user_email: user.email,
            profile,
            tasks: tasks || [],
            goals: goals || [],
            habits: habits || [],
            habit_logs: habitLogs || [],
            time_blocks: timeBlocks || [],
            journals: journals || [],
            xp_log: xpLog || [],
            badges: badges || [],
        }

        // Return as downloadable JSON file
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="lifeos-data-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })

    } catch (e) {
        console.error('Data export error:', e)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}

// ─── DELETE /api/privacy/export - Delete account (GDPR right to erasure) ────
export async function DELETE(req: NextRequest) {
    const rl = rateLimit(req, { limit: 3, windowSeconds: 3600, prefix: 'delete' })
    if (!rl.success) return rl.response

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json().catch(() => ({}))

        // Require explicit confirmation string
        if (body.confirm !== 'DELETE MY ACCOUNT') {
            return NextResponse.json(
                { error: 'To delete your account, send { "confirm": "DELETE MY ACCOUNT" }' },
                { status: 400 }
            )
        }

        // Delete user data in dependency order
        // (RLS foreign key cascades handle most of this, but explicit order is safer)
        await supabase.from('push_tokens').delete().eq('user_id', user.id)
        await supabase.from('xp_log').delete().eq('user_id', user.id)
        await supabase.from('badges').delete().eq('user_id', user.id)
        await supabase.from('integrations').delete().eq('user_id', user.id)
        await supabase.from('subscriptions').delete().eq('user_id', user.id)
        await supabase.from('habit_logs').delete().eq('user_id', user.id)
        await supabase.from('habits').delete().eq('user_id', user.id)
        await supabase.from('time_blocks').delete().eq('user_id', user.id)
        await supabase.from('tasks').delete().eq('user_id', user.id)
        await supabase.from('goals').delete().eq('user_id', user.id)
        await supabase.from('journals').delete().eq('user_id', user.id)
        await supabase.from('users').delete().eq('id', user.id)

        // Delete the auth user (requires service role or admin API)
        await supabase.auth.admin?.deleteUser(user.id)

        return NextResponse.json({ deleted: true, message: 'Account and all data have been deleted.' })

    } catch (e) {
        console.error('Account deletion error:', e)
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }
}
