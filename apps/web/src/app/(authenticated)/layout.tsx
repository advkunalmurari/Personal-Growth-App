import SidebarNav from '@/components/layout/SidebarNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AICoach from '@/components/ai/AICoach'

export const dynamic = 'force-dynamic'

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile details
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const userInitial = profile?.name?.charAt(0) ?? user.email?.charAt(0)?.toUpperCase() ?? 'U'

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-indigo-500/30">
            <SidebarNav profile={profile} userInitial={userInitial} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Top ambient glow */}
                <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                {children}
                <AICoach />
            </main>
        </div>
    )
}
