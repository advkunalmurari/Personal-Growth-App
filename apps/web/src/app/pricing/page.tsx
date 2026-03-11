'use client'

import { useState } from 'react'
import { Check, Zap, Users, Star } from 'lucide-react'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: new (options: Record<string, unknown>) => { open: () => void }
    }
}

const plans = [
    {
        id: 'pro_monthly',
        name: 'Pro',
        price: '₹499',
        period: '/month',
        icon: Zap,
        color: 'indigo',
        description: 'Full access for serious performers',
        features: [
            'Unlimited Goals & Tasks',
            'AI Coach (Unlimited)',
            'Voice Input',
            'Advanced Analytics',
            'Calendar Sync',
            'Priority Support',
        ],
    },
    {
        id: 'pro_yearly',
        name: 'Pro Annual',
        price: '₹3,999',
        period: '/year',
        icon: Star,
        color: 'fuchsia',
        badge: '33% off',
        description: 'Best value — save ₹1,989 per year',
        features: [
            'Everything in Pro',
            'Early access features',
            'Dedicated onboarding call',
            'Export to PDF/CSV',
        ],
    },
    {
        id: 'team_monthly',
        name: 'Team',
        price: '₹1,999',
        period: '/month',
        icon: Users,
        color: 'emerald',
        description: 'For accountability groups & teams',
        features: [
            'Up to 10 members',
            'Team Leaderboards',
            'Group Challenges',
            'Admin Dashboard',
            'Usage Analytics',
        ],
    },
]

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null)

    const handleCheckout = async (planId: string) => {
        setLoading(planId)
        try {
            // 1. Create order on server
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            // 2. Load Razorpay SDK if not already present
            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script')
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    script.onload = () => resolve()
                    script.onerror = reject
                    document.head.appendChild(script)
                })
            }

            // 3. Open Razorpay checkout
            const rzp = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Life OS',
                description: order.plan_name,
                order_id: order.order_id,
                handler: async (response: Record<string, string>) => {
                    // 4. Verify payment on server
                    await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'verify',
                            plan_id: planId,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    })
                    window.location.href = '/dashboard?upgraded=true'
                },
                theme: { color: '#6366f1' },
            })
            rzp.open()
        } catch (err) {
            console.error('Checkout error:', err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] px-4 py-16">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Invest in Your{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                            Growth
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Join thousands of high-performers running their life at full capacity.
                    </p>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon
                        const isLoading = loading === plan.id
                        const colorMap: Record<string, string> = {
                            indigo: 'from-indigo-500 to-indigo-600 hover:shadow-indigo-500/30',
                            fuchsia: 'from-fuchsia-500 to-purple-600 hover:shadow-fuchsia-500/30',
                            emerald: 'from-emerald-500 to-teal-600 hover:shadow-emerald-500/30',
                        }

                        return (
                            <div
                                key={plan.id}
                                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col hover:border-zinc-600 transition-all"
                            >
                                {plan.badge && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-fuchsia-600 text-white text-xs font-bold">
                                        {plan.badge}
                                    </span>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[plan.color]} flex items-center justify-center shadow-lg`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">{plan.name}</h2>
                                        <p className="text-slate-400 text-[11px]">{plan.description}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                                    <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                                </div>

                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-slate-300 text-sm">
                                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleCheckout(plan.id)}
                                    disabled={isLoading}
                                    id={`checkout-${plan.id}`}
                                    className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${colorMap[plan.color]} shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? 'Processing...' : 'Get Started'}
                                </button>
                            </div>
                        )
                    })}
                </div>

                <p className="text-center text-slate-500 text-sm mt-8">
                    Secure payments via Razorpay · Cancel anytime · 7-day money-back guarantee
                </p>
            </div>
        </div>
    )
}
