-- ============================================================
-- Migration 00015: Production-Ready Schema Upgrade
-- LOS Deep Refinement Guide — Refinement 2
-- ============================================================
-- Adds: disclosure_stage to users, full goals/tasks/habits schema,
--       focus_sessions, review_sessions, weekly_scores,
--       xp_ledger (append-only + trigger), badges/user_badges,
--       ai_suggestions, user_integrations
-- ============================================================

-- ─── 1. USERS — add progressive disclosure + AI profile fields ─────────────
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS disclosure_stage     SMALLINT NOT NULL DEFAULT 1
        CHECK (disclosure_stage IN (1,2,3)),
    ADD COLUMN IF NOT EXISTS stage2_unlocked_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stage3_unlocked_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS productivity_profile JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notification_morning_time TIME DEFAULT '07:30',
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'
        CHECK (subscription_status IN ('free','trial','pro','cancelled')),
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- GIN index on JSONB productivity_profile for fast JSON queries
CREATE INDEX IF NOT EXISTS idx_users_productivity_profile
    ON public.users USING GIN (productivity_profile);

-- ─── 2. GOALS — full 7-level hierarchy ─────────────────────────────────────
ALTER TABLE public.goals
    ADD COLUMN IF NOT EXISTS parent_id      UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS level          SMALLINT NOT NULL DEFAULT 5
        CHECK (level BETWEEN 1 AND 7),
    -- 1=vision,2=yearly,3=half-yearly,4=quarterly,5=monthly,6=weekly,7=daily
    ADD COLUMN IF NOT EXISTS velocity_status TEXT
        CHECK (velocity_status IN ('ahead','on_track','at_risk','behind')),
    ADD COLUMN IF NOT EXISTS sort_order    INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS goals_parent_id_idx ON public.goals(parent_id);
CREATE INDEX IF NOT EXISTS goals_status_idx    ON public.goals(user_id, status);

-- ─── 3. TASKS — full status + XP tracking ──────────────────────────────────
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS actual_mins   SMALLINT,
    ADD COLUMN IF NOT EXISTS xp_value      SMALLINT NOT NULL DEFAULT 15;

-- Change status to full enum (safe: add check, existing 'done' → 'completed' update)
UPDATE public.tasks SET status = 'completed' WHERE status = 'done';

-- ─── 4. HABITS — add frequency, target_time, streaks ───────────────────────
ALTER TABLE public.habits
    ADD COLUMN IF NOT EXISTS frequency     TEXT DEFAULT 'daily'
        CHECK (frequency IN ('daily','weekdays','weekends','custom')),
    ADD COLUMN IF NOT EXISTS custom_days   SMALLINT[],
    ADD COLUMN IF NOT EXISTS target_time   TIME,
    ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_completions INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT TRUE;

-- 4b. HABIT_LOGS — add unique constraint and indexes
ALTER TABLE public.habit_logs
    ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Backfill completed_date from created_at if empty
UPDATE public.habit_logs SET completed_date = created_at::DATE WHERE completed_date IS NULL;

-- Make unique constraint: one log per habit per day
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_date_unique'
    ) THEN
        ALTER TABLE public.habit_logs
            ADD CONSTRAINT habit_logs_habit_date_unique UNIQUE (habit_id, completed_date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS habit_logs_habit_date ON public.habit_logs(habit_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS habit_logs_user_date  ON public.habit_logs(user_id, completed_date DESC);

-- ─── 5. FOCUS_SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id         UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration_mins   SMALLINT NOT NULL DEFAULT 25,
    session_type    TEXT NOT NULL DEFAULT 'pomodoro'
        CHECK (session_type IN ('pomodoro','deep_work','flow','custom')),
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    interruptions   SMALLINT DEFAULT 0,
    notes           TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    xp_earned       SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON public.focus_sessions(user_id, started_at DESC);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "focus_select_own" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "focus_insert_own" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "focus_update_own" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "focus_delete_own" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- ─── 6. REVIEW_SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_sessions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_type     TEXT NOT NULL DEFAULT 'weekly'
        CHECK (review_type IN ('weekly','monthly','quarterly')),
    week_start_date DATE NOT NULL,
    answers         JSONB NOT NULL DEFAULT '{}',
    -- answers: { q1: "what went well", q2: "what to improve", q3: "next week focus" }
    score           SMALLINT, -- 0-100 calculated weekly score
    ai_feedback     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_user_date ON public.review_sessions(user_id, week_start_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_unique_week ON public.review_sessions(user_id, week_start_date, review_type);

ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "review_select_own" ON public.review_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "review_insert_own" ON public.review_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "review_update_own" ON public.review_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ─── 7. WEEKLY_SCORES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_scores (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    tasks_score     SMALLINT DEFAULT 0, -- 0-25
    habits_score    SMALLINT DEFAULT 0, -- 0-25
    goals_score     SMALLINT DEFAULT 0, -- 0-25
    review_score    SMALLINT DEFAULT 0, -- 0-25
    total_score     SMALLINT DEFAULT 0, -- 0-100
    grade           TEXT CHECK (grade IN ('S','A','B','C','D','F')),
    metadata        JSONB DEFAULT '{}',
    calculated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_scores_user_week
    ON public.weekly_scores(user_id, week_start_date);

ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "weekly_scores_own" ON public.weekly_scores FOR ALL USING (auth.uid() = user_id);

-- ─── 8. XP_LEDGER — append-only audit trail with auto-trigger ───────────────
CREATE TABLE IF NOT EXISTS public.xp_ledger (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'task_complete','habit_complete','streak_milestone',
        'level_up','weekly_review','weekly_s_grade',
        'goal_complete','referral','admin_grant'
    )),
    xp_amount   INTEGER NOT NULL,
    reference_id UUID,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user    ON public.xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_created ON public.xp_ledger(user_id, created_at DESC);

ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

-- Append-only: users can only read their own; only service role inserts
CREATE POLICY IF NOT EXISTS "xp_ledger_read_own" ON public.xp_ledger
    FOR SELECT USING (auth.uid() = user_id);
-- Insert blocked for API users (service role bypasses RLS)
-- This prevents XP injection from client side

-- Auto-trigger: update users.xp_total on every xp_ledger insert
CREATE OR REPLACE FUNCTION update_user_xp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET xp_total = xp_total + NEW.xp_amount,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS xp_ledger_update_total ON public.xp_ledger;
CREATE TRIGGER xp_ledger_update_total
    AFTER INSERT ON public.xp_ledger
    FOR EACH ROW EXECUTE FUNCTION update_user_xp();

-- ─── 9. BADGES (seed data) + USER_BADGES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_key   TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    description TEXT,
    icon        TEXT,
    rarity      TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
    xp_required INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Badges are public read, no writes via API
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "badges_read_all" ON public.badges FOR SELECT USING (TRUE);

-- Seed badge data
INSERT INTO public.badges (badge_key, label, description, icon, rarity, xp_required) VALUES
    ('first_win',      '🎯 First Win',       'Completed your first task',                   'target',  'common',    10),
    ('week_warrior',   '🔥 Week Warrior',    'Maintained a 7-day streak',                   'flame',   'rare',     250),
    ('century_club',   '💯 Century Club',    'Reached 1,000 total XP',                      'star',    'rare',    1000),
    ('rising_star',    '⚡ Rising Star',     'Reached Level 5',                             'zap',     'epic',       0),
    ('elite',          '🏆 Elite Performer', 'Reached Level 10',                            'trophy',  'legendary',  0),
    ('focus_master',   '🧠 Focus Master',    'Completed 25 focus sessions',                 'brain',   'epic',       0),
    ('goal_crusher',   '🎖️ Goal Crusher',    'Completed first monthly goal',                'medal',   'rare',       0),
    ('consistent',     '📅 Consistent',      '30-day habit streak',                         'calendar','legendary',  0),
    ('deep_worker',    '⏱️ Deep Worker',     'Accumulated 10 hours of focus time',          'clock',   'epic',       0),
    ('reviewer',       '📝 The Reviewer',    'Completed 4 weekly reviews',                  'pencil',  'rare',       0)
ON CONFLICT (badge_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id    UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_badges_own" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- ─── 10. AI_SUGGESTIONS — cached AI responses ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_type   TEXT NOT NULL, -- 'goal_cascade','task_breakdown','schedule','procrastination','review'
    prompt_hash TEXT NOT NULL, -- MD5 of the prompt for cache lookup
    response    JSONB NOT NULL,
    model_used  TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_hash ON public.ai_suggestions(user_id, prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_exp  ON public.ai_suggestions(expires_at);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ai_suggestions_own" ON public.ai_suggestions FOR ALL USING (auth.uid() = user_id);

-- ─── 11. USER_INTEGRATIONS — OAuth tokens (replace integrations table) ──────
-- (Already created as 'integrations' in migration 00013 — add columns)
ALTER TABLE public.integrations
    ADD COLUMN IF NOT EXISTS provider_user_id TEXT,
    ADD COLUMN IF NOT EXISTS scopes           TEXT[];

-- ─── 12. UPDATED_AT TRIGGER — keep timestamps current ───────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','goals','tasks','habits']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I;
            CREATE TRIGGER set_updated_at_%I
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ─── Done ────────────────────────────────────────────────────────────────────
