'use client'

import { useState, useEffect } from 'react'
import { Shield, X, Check } from 'lucide-react'

const CONSENT_KEY = 'los_consent_v1'

interface ConsentState {
    analytics: boolean
    personalization: boolean
    marketing: boolean
    acceptedAt?: string
}

export default function ConsentBanner() {
    const [visible, setVisible] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [prefs, setPrefs] = useState<ConsentState>({
        analytics: true,
        personalization: true,
        marketing: false,
    })

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY)
        if (!stored) {
            // Show banner after a short delay
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = (all: boolean) => {
        const consent: ConsentState = all
            ? { analytics: true, personalization: true, marketing: true, acceptedAt: new Date().toISOString() }
            : { ...prefs, acceptedAt: new Date().toISOString() }

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))

        // Signal PostHog based on consent
        if (typeof window !== 'undefined' && window.posthog) {
            if (consent.analytics) {
                window.posthog.opt_in_capturing()
            } else {
                window.posthog.opt_out_capturing()
            }
        }

        setVisible(false)
    }

    if (!visible) return null

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
        >
            <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white font-semibold text-sm">Your privacy matters 🔒</h2>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            We use cookies to improve your experience, analyze performance, and personalize content.
                            Compliant with India&apos;s DPDP Act 2023 and GDPR.{' '}
                            <a href="/privacy" className="text-indigo-400 underline">Read our Privacy Policy</a>.
                        </p>

                        {expanded && (
                            <div className="mt-4 space-y-3">
                                {[
                                    { key: 'analytics', label: 'Analytics', desc: 'Usage data to improve Life OS (PostHog, Sentry)', required: false },
                                    { key: 'personalization', label: 'Personalization', desc: 'AI coaching context and adaptive features', required: false },
                                    { key: 'marketing', label: 'Marketing', desc: 'Promotional emails and offers', required: false },
                                ].map(item => (
                                    <label key={item.key} className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <p className="text-slate-200 text-xs font-medium">{item.label}</p>
                                            <p className="text-slate-500 text-[10px]">{item.desc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={prefs[item.key as keyof ConsentState] as boolean}
                                            onChange={e => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                                            className="w-4 h-4 rounded accent-indigo-500"
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <button
                                onClick={() => accept(true)}
                                id="consent-accept-all"
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                                <Check className="w-3 h-3" /> Accept All
                            </button>

                            {expanded ? (
                                <button
                                    onClick={() => accept(false)}
                                    id="consent-save-prefs"
                                    className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold transition-all"
                                >
                                    Save Preferences
                                </button>
                            ) : (
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold transition-all"
                                >
                                    Customize
                                </button>
                            )}

                            <button
                                onClick={() => { setPrefs({ analytics: false, personalization: false, marketing: false }); accept(false) }}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-all"
                            >
                                Reject All
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setVisible(false)}
                        title="Dismiss"
                        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Extend window type for PostHog
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posthog?: any
    }
}
