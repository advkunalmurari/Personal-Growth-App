-- Migration: Subscriptions Table

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id              TEXT NOT NULL,
    period               TEXT NOT NULL DEFAULT 'monthly',
    status               TEXT NOT NULL DEFAULT 'pending', -- pending, active, cancelled, payment_failed
    razorpay_payment_id  TEXT,
    razorpay_order_id    TEXT,
    started_at           TIMESTAMPTZ DEFAULT NOW(),
    expires_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
    ON public.subscriptions FOR ALL
    USING (true);
