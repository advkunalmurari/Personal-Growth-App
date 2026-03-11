'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, User, Briefcase, GraduationCap, Mic, Loader2 } from 'lucide-react'

type ProfileType = 'student' | 'professional' | 'other'
type Step = 1 | 2 | 3 | 4 | 5

const PRESET_HABITS = [
    { id: 'study', icon: '📚', label: 'Study 30 min' },
    { id: 'exercise', icon: '🏃', label: 'Exercise' },
    { id: 'read', icon: '📖', label: 'Read' },
    { id: 'meditate', icon: '🧘', label: 'Meditate' },
    { id: 'cold', icon: '🚿', label: 'Cold Shower' },
    { id: 'sleep', icon: '🌙', label: 'Sleep by 11 PM' },
]

interface GeneratedTask { title: string; priority: number; estimatedMins: number }

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()

    const [step, setStep] = useState<Step>(1)
    const [profile, setProfile] = useState<ProfileType | null>(null)
    const [goal, setGoal] = useState('')
    const [aiTasks, setAiTasks] = useState<GeneratedTask[]>([])
    const [thinking, setThinking] = useState(false)
    const [selectedHabit, setHabit] = useState<string | null>(null)
    const [xpBurst, setXpBurst] = useState(false)

    // Step 2 → 3: call AI to generate tasks
    async function generateTasks() {
        if (!goal.trim()) return
        setThinking(true)
        setStep(3)

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'goal_cascade',
                    message: goal,
                    context: { goal, profileType: profile, timeframe: '3 months' },
                }),
            })
            const data = await res.json()
            const parsed = typeof data.content === 'string'
                ? JSON.parse(data.content)
                : data.content

            setAiTasks(parsed?.tasks?.slice(0, 3) || [
                { title: `Start working on: ${goal}`, priority: 1, estimatedMins: 30 },
                { title: 'Plan first milestone', priority: 2, estimatedMins: 25 },
                { title: 'Research and gather resources', priority: 3, estimatedMins: 20 },
            ])
        } catch {
            setAiTasks([
                { title: `Start: ${goal}`, priority: 1, estimatedMins: 30 },
                { title: 'Plan first steps', priority: 2, estimatedMins: 25 },
                { title: 'Set deadline', priority: 3, estimatedMins: 15 },
            ])
        } finally {
            setThinking(false)
        }
    }

    // Step 5: Save everything to Supabase and show first win
    async function completeOnboarding() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Save profile type + onboarding complete
        await supabase.from('users').update({
            profile_type: profile,
            onboarding_completed_at: new Date().toISOString(),
            disclosure_stage: 1,
        }).eq('id', user.id)

        // Save goal
        const { data: goalRec } = await supabase.from('goals').insert({
            user_id: user.id,
            title: goal,
            level: 2, // yearly goal
            status: 'active',
        }).select().single()

        // Save tasks
        if (goalRec) {
            await supabase.from('tasks').insert(
                aiTasks.map(t => ({
                    user_id: user.id,
                    goal_id: goalRec.id,
                    title: t.title,
                    priority: t.priority,
                    estimated_mins: t.estimatedMins,
                    scheduled_date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                }))
            )
        }

        // Save habit
        if (selectedHabit) {
            const habit = PRESET_HABITS.find(h => h.id === selectedHabit)
            await supabase.from('habits').insert({
                user_id: user.id,
                title: habit?.label || selectedHabit,
                icon: habit?.icon || '⚡',
                frequency: 'daily',
                is_active: true,
            })
        }

        // Award initial XP via server
        await fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'first_win_of_day' }),
        })

        setStep(5)
        setXpBurst(true)
        setTimeout(() => router.push('/dashboard'), 2500)
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
            {/* Progress dots */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                    <div
                        key={s}
                        className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-indigo-400' :
                                s < step ? 'w-4 bg-indigo-600' : 'w-4 bg-white/10'
                            }`}
                    />
                ))}
            </div>

            <div className="w-full max-w-sm">

                {/* ── Step 1: Who are you? ── */}
                {step === 1 && (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Who are you?</h1>
                        <p className="text-slate-400 mb-8 text-sm">One tap — no forms</p>
                        <div className="grid gap-3">
                            {[
                                { type: 'student' as ProfileType, icon: GraduationCap, label: 'Student', desc: 'Building skills & grades' },
                                { type: 'professional' as ProfileType, icon: Briefcase, label: 'Working Professional', desc: 'Climbing the career ladder' },
                                { type: 'other' as ProfileType, icon: User, label: 'Other', desc: 'Living life on my own terms' },
                            ].map(p => (
                                <button
                                    key={p.type}
                                    onClick={() => { setProfile(p.type); setStep(2) }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 text-left transition-all"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                                        <p.icon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{p.label}</p>
                                        <p className="text-slate-500 text-xs">{p.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 2: Biggest goal ── */}
                {step === 2 && (
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Your biggest goal right now</h1>
                        <p className="text-slate-400 mb-6 text-sm">One thing. What matters most?</p>
                        <textarea
                            autoFocus
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="e.g. Clear my CA exam in May"
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-lg placeholder-slate-600 resize-none outline-none focus:border-indigo-500/50 transition-colors"
                        />
                        <button
                            onClick={generateTasks}
                            disabled={!goal.trim()}
                            className="w-full mt-4 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition-all"
                        >
                            Let AI break it down →
                        </button>
                    </div>
                )}

                {/* ── Step 3: AI Task Generation ── */}
                {step === 3 && (
                    <div className="text-center">
                        {thinking ? (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
                                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Breaking it down...</h2>
                                <p className="text-slate-400 text-sm">Your AI coach is thinking</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-white mb-1">Your first 3 tasks</h2>
                                <p className="text-slate-400 text-sm mb-6">Generated for this week</p>
                                <div className="space-y-3 text-left mb-6">
                                    {aiTasks.map((t, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                            <span className="text-xs font-bold text-indigo-400 bg-indigo-600/20 px-2 py-0.5 rounded-md mt-0.5 flex-shrink-0">
                                                P{t.priority}
                                            </span>
                                            <div>
                                                <p className="text-white text-sm font-medium">{t.title}</p>
                                                <p className="text-slate-500 text-xs">{t.estimatedMins} min</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setStep(4)}
                                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
                                >
                                    Perfect, let's go →
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ── Step 4: Pick a daily habit ── */}
                {step === 4 && (
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Pick one daily habit</h1>
                        <p className="text-slate-400 mb-6 text-sm">Just one. Consistency beats complexity.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {PRESET_HABITS.map(h => (
                                <button
                                    key={h.id}
                                    onClick={() => setHabit(h.id)}
                                    className={`p-4 rounded-2xl border text-left transition-all ${selectedHabit === h.id
                                            ? 'bg-indigo-600/30 border-indigo-500 shadow-indigo-500/20 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:border-indigo-500/40'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{h.icon}</div>
                                    <p className="text-white text-xs font-medium">{h.label}</p>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={completeOnboarding}
                            disabled={!selectedHabit}
                            className="w-full mt-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition-all"
                        >
                            Start my journey →
                        </button>
                    </div>
                )}

                {/* ── Step 5: First win! ── */}
                {step === 5 && (
                    <div className="text-center">
                        <div className={`transition-all duration-700 ${xpBurst ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">You're in! 🚀</h1>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/20 border border-indigo-500/30 mb-4">
                                <span className="text-indigo-300 font-bold">+40 XP</span>
                                <span className="text-slate-400 text-sm">· Day 1 Streak! 🔥</span>
                            </div>
                            <p className="text-slate-400 text-sm">Taking you to your dashboard...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
