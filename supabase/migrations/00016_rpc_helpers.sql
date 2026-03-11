-- Migration 00016: Helper RPCs for cron jobs
-- Provides efficient aggregate queries used by badge-check and habit-reminder crons

-- ─── 1. RPC: get_users_needing_habit_reminder ────────────────────────────────
-- Returns users who have active habits but haven't logged any today
CREATE OR REPLACE FUNCTION get_users_needing_habit_reminder(p_date DATE)
RETURNS TABLE (id UUID, push_token TEXT)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT DISTINCT u.id, pt.token AS push_token
    FROM public.users u
    -- Has at least one active habit
    JOIN public.habits h ON h.user_id = u.id AND h.is_active = TRUE
    -- Has a push token registered
    JOIN public.push_tokens pt ON pt.user_id = u.id
    -- Has NOT logged any habit today
    WHERE NOT EXISTS (
        SELECT 1 FROM public.habit_logs hl
        WHERE hl.user_id = u.id
        AND hl.completed_date = p_date
    )
    -- Only notify users who have enabled notifications (default: enabled)
    AND (u.notification_morning_time IS NOT NULL);
$$;

-- ─── 2. RPC: get_user_badge_stats ────────────────────────────────────────────
-- Returns per-user stats needed for badge checking, plus already-earned badge keys
CREATE OR REPLACE FUNCTION get_user_badge_stats()
RETURNS TABLE (
    id                      UUID,
    xp_total                BIGINT,
    level                   INTEGER,
    task_count              BIGINT,
    longest_streak          BIGINT,
    focus_session_count     BIGINT,
    review_count            BIGINT,
    completed_monthly_goals BIGINT,
    focus_total_mins        BIGINT,
    earned_badge_keys       TEXT[]
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        u.id,
        COALESCE(u.xp_total, 0)::BIGINT                                         AS xp_total,
        COALESCE(u.level, 1)                                                     AS level,
        (SELECT COUNT(*) FROM public.tasks t
            WHERE t.user_id = u.id AND t.status = 'completed')                  AS task_count,
        COALESCE((SELECT MAX(h.longest_streak) FROM public.habits h
            WHERE h.user_id = u.id), 0)::BIGINT                                 AS longest_streak,
        (SELECT COUNT(*) FROM public.focus_sessions fs
            WHERE fs.user_id = u.id AND fs.completed = TRUE)                    AS focus_session_count,
        (SELECT COUNT(*) FROM public.review_sessions rs
            WHERE rs.user_id = u.id)                                             AS review_count,
        (SELECT COUNT(*) FROM public.goals g
            WHERE g.user_id = u.id AND g.status = 'completed' AND g.level = 5)  AS completed_monthly_goals,
        COALESCE((SELECT SUM(fs.duration_mins) FROM public.focus_sessions fs
            WHERE fs.user_id = u.id AND fs.completed = TRUE), 0)::BIGINT        AS focus_total_mins,
        COALESCE(
            ARRAY(SELECT b.badge_key FROM public.user_badges ub
                JOIN public.badges b ON b.id = ub.badge_id
                WHERE ub.user_id = u.id),
            ARRAY[]::TEXT[]
        )                                                                         AS earned_badge_keys
    FROM public.users u
    WHERE u.onboarding_completed_at IS NOT NULL;
$$;

-- ─── 3. RPC: get_user_weekly_score ───────────────────────────────────────────
-- Returns weekly score for a specific user and week (called from dashboard API)
CREATE OR REPLACE FUNCTION get_user_weekly_score(p_user_id UUID, p_week_start DATE)
RETURNS TABLE (
    total_score  SMALLINT,
    grade        TEXT,
    tasks_score  SMALLINT,
    habits_score SMALLINT,
    goals_score  SMALLINT,
    review_score SMALLINT
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        total_score, grade, tasks_score, habits_score, goals_score, review_score
    FROM public.weekly_scores
    WHERE user_id = p_user_id
    AND week_start_date = p_week_start
    LIMIT 1;
$$;

-- Grant execute on RPCs to the service_role
GRANT EXECUTE ON FUNCTION get_users_needing_habit_reminder(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_badge_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_weekly_score(UUID, DATE) TO service_role;
-- Also allow authenticated users to call their own weekly score
GRANT EXECUTE ON FUNCTION get_user_weekly_score(UUID, DATE) TO authenticated;
