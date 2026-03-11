-- Migration: Gamification Backend Tables
-- Creates xp_log and badges tables with RLS policies

-- XP Event Log (used for anti-cheat rate limiting + analytics)
CREATE TABLE IF NOT EXISTS public.xp_log (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,
    xp_amount   INTEGER NOT NULL DEFAULT 0,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_log_user_created ON public.xp_log (user_id, created_at DESC);

ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own XP logs"
    ON public.xp_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP logs"
    ON public.xp_log FOR SELECT
    USING (auth.uid() = user_id);

-- Badges Table (earned achievement badges per user)
CREATE TABLE IF NOT EXISTS public.badges (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id    TEXT NOT NULL,
    label       TEXT NOT NULL,
    earned_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON public.badges (user_id);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
    ON public.badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage badges"
    ON public.badges FOR ALL
    USING (true);
