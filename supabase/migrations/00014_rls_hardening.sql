-- ============================================================
-- Migration: Security Hardening - RLS Policy Hardening
-- ============================================================
-- This migration adds comprehensive RLS policies for all tables
-- ensuring users can ONLY access their own data.
-- ============================================================

-- ─── tasks ───────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
    ON public.tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── goals ───────────────────────────────────────────────────────────────────
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals"
    ON public.goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── habits ──────────────────────────────────────────────────────────────────
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
CREATE POLICY "Users can manage own habits"
    ON public.habits FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── habit_logs ──────────────────────────────────────────────────────────────
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habit logs" ON public.habit_logs;
CREATE POLICY "Users can manage own habit logs"
    ON public.habit_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── time_blocks ─────────────────────────────────────────────────────────────
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own time blocks" ON public.time_blocks;
CREATE POLICY "Users can manage own time blocks"
    ON public.time_blocks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── journals ────────────────────────────────────────────────────────────────
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own journals" ON public.journals;
CREATE POLICY "Users can manage own journals"
    ON public.journals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── users (profiles) ────────────────────────────────────────────────────────
-- Leaderboard: allow reading minimal profile info (name, level, xp) but not PII
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Leaderboard public SELECT (only safe fields via view)
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view AS
    SELECT id, name, level, xp_total
    FROM public.users
    ORDER BY xp_total DESC
    LIMIT 50;

-- Allow anyone authenticated to read the leaderboard view
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- ─── Security: Prevent privilege escalation ───────────────────────────────────
-- Revoke direct table access from anon role for sensitive tables
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.xp_log FROM anon;
REVOKE ALL ON public.badges FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.integrations FROM anon;
REVOKE ALL ON public.push_tokens FROM anon;

-- Grant only authenticated users access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journals TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
