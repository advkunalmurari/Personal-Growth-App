import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Razorpay sends webhook events for subscription lifecycle management
export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('x-razorpay-signature') || ''

        // Verify webhook authenticity
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(body)
            .digest('hex')

        if (expectedSig !== signature) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
        }

        const event = JSON.parse(body)
        const supabase = await createClient()
        const payload = event.payload?.subscription?.entity || event.payload?.payment?.entity || {}

        switch (event.event) {
            case 'subscription.activated':
            case 'subscription.charged': {
                const userId = payload.notes?.user_id
                if (userId) {
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'active' })
                        .eq('user_id', userId)
                }
                break
            }

            case 'subscription.cancelled':
            case 'subscription.expired': {
                const userId = payload.notes?.user_id
                if (userId) {
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'cancelled' })
                        .eq('user_id', userId)
                }
                break
            }

            case 'subscription.halted': {
                const userId = payload.notes?.user_id
                if (userId) {
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'payment_failed' })
                        .eq('user_id', userId)
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (e) {
        console.error('Webhook error:', e)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
