-- Migration: Push Tokens Table

CREATE TABLE IF NOT EXISTS public.push_tokens (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,
    platform    TEXT NOT NULL DEFAULT 'ios', -- ios, android
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_platform_token UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
    ON public.push_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all push tokens"
    ON public.push_tokens FOR SELECT
    USING (true);
