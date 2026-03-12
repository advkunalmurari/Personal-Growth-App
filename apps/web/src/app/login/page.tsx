'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

type View = 'signin' | 'signup' | 'forgot'

function LoginForm() {
    const [view, setView]         = useState<View>('signin')
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState<string | null>(null)
    const [success, setSuccess]   = useState<string | null>(null)

    const router       = useRouter()
    const searchParams = useSearchParams()
    const supabase     = createClient()
// ... rest of the component ...

    // Show OAuth error if redirected back from /auth/callback with error
    useEffect(() => {
        const err = searchParams.get('error')
        if (err) setError(decodeURIComponent(err))
    }, [searchParams])

    // ── Sign In ──────────────────────────────────────────────────────────────
    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'Incorrect email or password. Please try again.'
                : error.message)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
        setLoading(false)
    }

    // ── Sign Up ──────────────────────────────────────────────────────────────
    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setError(null)
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            setLoading(false); return
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
        })
        if (error) {
            setError(error.message)
        } else {
            setSuccess('Account created! Check your email for a confirmation link.')
        }
        setLoading(false)
    }

    // ── Forgot Password ──────────────────────────────────────────────────────
    async function handleForgot(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setError(null)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/settings`,
        })
        if (error) {
            setError(error.message)
        } else {
            setSuccess('Password reset email sent! Check your inbox.')
        }
        setLoading(false)
    }

    // ── Google OAuth (secondary) ─────────────────────────────────────────────
    async function handleGoogle() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
        })
        if (error) { setError(error.message); setLoading(false) }
    }

    const inputCls = 'w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm'

    return (
        <div className="flex min-h-screen bg-gray-950 text-white items-center justify-center p-4">
            {/* Background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/25 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/15 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">

                {/* Logo + Title */}
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        <span className="text-white font-black text-lg">L</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {view === 'signin'  ? 'Welcome back'       : ''}
                        {view === 'signup'  ? 'Create your account' : ''}
                        {view === 'forgot'  ? 'Reset password'     : ''}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Life Operating System
                    </p>
                </div>

                {/* Error / Success messages */}
                {error && (
                    <div className="mb-4 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-rose-300 text-sm">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-300 text-sm">{success}</p>
                    </div>
                )}

                {/* ── Sign In Form ── */}
                {view === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`${inputCls} pl-10`}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    Password
                                </label>
                                <button type="button" onClick={() => { setView('forgot'); setError(null); setSuccess(null) }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inputCls} pl-10 pr-10`}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        {/* Divider */}
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-800" />
                            <span className="flex-shrink-0 mx-4 text-gray-600 text-xs">or</span>
                            <div className="flex-grow border-t border-gray-800" />
                        </div>

                        {/* Google (secondary) */}
                        <button type="button" onClick={handleGoogle} disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-gray-700 hover:border-gray-600 text-white font-medium py-3 rounded-xl transition-all text-sm">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <button type="button" onClick={() => { setView('signup'); setError(null); setSuccess(null) }}
                                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                                Create one
                            </button>
                        </p>
                    </form>
                )}

                {/* ── Sign Up Form ── */}
                {view === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className={`${inputCls} pl-10`} placeholder="you@example.com" required autoComplete="email" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    className={`${inputCls} pl-10 pr-10`} placeholder="Min. 8 characters" required autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5">Must be at least 8 characters</p>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] disabled:opacity-50 mt-2">
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <button type="button" onClick={() => { setView('signin'); setError(null); setSuccess(null) }}
                                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                                Sign in
                            </button>
                        </p>
                    </form>
                )}

                {/* ── Forgot Password Form ── */}
                {view === 'forgot' && (
                    <form onSubmit={handleForgot} className="space-y-4">
                        <p className="text-sm text-gray-400 mb-2">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className={`${inputCls} pl-10`} placeholder="you@example.com" required autoComplete="email" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-50 mt-2">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            <button type="button" onClick={() => { setView('signin'); setError(null); setSuccess(null) }}
                                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                                ← Back to Sign In
                            </button>
                        </p>
                    </form>
                )}

            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
