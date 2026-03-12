import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS: Record<string, { amount: number; currency: string; name: string; period: string }> = {
    pro_monthly: { amount: 49900, currency: 'INR', name: 'Life OS Pro (Monthly)', period: 'monthly' },  // ₹499
    pro_yearly: { amount: 399900, currency: 'INR', name: 'Life OS Pro (Yearly)', period: 'yearly' },    // ₹3,999
    team_monthly: { amount: 199900, currency: 'INR', name: 'Life OS Team (Monthly)', period: 'monthly' }, // ₹1,999
}

export async function POST(req: NextRequest) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    })

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { plan_id, action } = body

        // Handle signature verification for payment capture
        if (action === 'verify') {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

            const sign = razorpay_order_id + '|' + razorpay_payment_id
            const expectedSign = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                .update(sign)
                .digest('hex')

            if (expectedSign !== razorpay_signature) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
            }

            // Mark subscription as active in DB
            const plan = PLANS[body.plan_id] || {}
            await supabase.from('subscriptions').upsert({
                user_id: user.id,
                plan_id: body.plan_id,
                period: plan.period || 'monthly',
                razorpay_payment_id,
                razorpay_order_id,
                status: 'active',
                started_at: new Date().toISOString(),
                expires_at: new Date(
                    plan.period === 'yearly'
                        ? Date.now() + 365 * 24 * 60 * 60 * 1000
                        : Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
            }, { onConflict: 'user_id' })

            // Award XP for subscribing
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
                body: JSON.stringify({ action: 'goal_milestone', metadata: { reason: 'subscription', plan: body.plan_id } }),
            }).catch(() => { })

            return NextResponse.json({ success: true })
        }

        // Create a new order
        if (!plan_id || !PLANS[plan_id]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const plan = PLANS[plan_id]
        const order = await razorpay.orders.create({
            amount: plan.amount,
            currency: plan.currency,
            receipt: `receipt_${user.id}_${Date.now()}`,
            notes: {
                user_id: user.id,
                plan_id,
                plan_name: plan.name,
            },
        })

        return NextResponse.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            plan_name: plan.name,
        })

    } catch (e) {
        console.error('Checkout error:', e)
        return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
    }
}
