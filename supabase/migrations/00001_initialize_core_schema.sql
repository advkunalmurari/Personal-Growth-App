-- INITIALIZE CORE SCHEMA
-- Based on the B.L.A.S.T/LOS Master Build Prompt specifications.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS (Custom Types)
-- ============================================================================

-- Goals
CREATE TYPE goal_level AS ENUM('vision', 'yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily');
CREATE TYPE goal_category AS ENUM('study', 'business', 'health', 'skill', 'spiritual', 'personal');
CREATE TYPE goal_status AS ENUM('active', 'completed', 'paused', 'archived');
CREATE TYPE velocity_status AS ENUM('on_track', 'at_risk', 'behind');

-- Tasks
CREATE TYPE task_priority AS ENUM('P1', 'P2', 'P3', 'P4');
CREATE TYPE task_status AS ENUM('pending', 'in_progress', 'completed', 'delayed', 'skipped');

-- Habits
CREATE TYPE habit_frequency AS ENUM('daily', 'weekdays', 'custom');

-- Time Blocks
CREATE TYPE block_type AS ENUM('deep_work', 'study', 'business', 'exercise', 'skill_dev', 'spiritual', 'admin');


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  xp_total INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  level goal_level NOT NULL,
  category goal_category NOT NULL,
  status goal_status DEFAULT 'active',
  progress_pct NUMERIC(5,2) DEFAULT 0.00 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  target_date DATE,
  velocity_status velocity_status DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- time_blocks (created before tasks because tasks reference time_blocks)
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  block_type block_type NOT NULL,
  task_id UUID, -- Will link to tasks.id. Circular dependency handle later or nullable
  focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority task_priority NOT NULL,
  estimated_mins INTEGER DEFAULT 30,
  actual_mins INTEGER,
  status task_status DEFAULT 'pending',
  scheduled_date DATE,
  time_block_id UUID REFERENCES public.time_blocks(id) ON DELETE SET NULL,
  xp_value INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key back from time_blocks to tasks
ALTER TABLE public.time_blocks 
  ADD CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;

-- habits
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency habit_frequency DEFAULT 'daily',
  days_of_week INT[], -- 0=Sun, 1=Mon, etc. (for 'custom' frequency)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- habit_logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure a habit can only be logged once per day
ALTER TABLE public.habit_logs ADD CONSTRAINT unique_habit_log_per_day UNIQUE (habit_id, completed_on);


-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
-- Assuming we use Supabase Auth to match auth.uid()
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Policies for public.goals
CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Policies for public.time_blocks
CREATE POLICY "Users can view their own time_blocks" ON public.time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own time_blocks" ON public.time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time_blocks" ON public.time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time_blocks" ON public.time_blocks FOR DELETE USING (auth.uid() = user_id);

-- Policies for public.tasks
CREATE POLICY "Users can view tasks of their goals" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
);
CREATE POLICY "Users can insert tasks of their goals" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
);
CREATE POLICY "Users can update tasks of their goals" ON public.tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
);
CREATE POLICY "Users can delete tasks of their goals" ON public.tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
);

-- Policies for public.habits
CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Policies for public.habit_logs
CREATE POLICY "Users can view their own habit_logs" ON public.habit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own habit_logs" ON public.habit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can update their own habit_logs" ON public.habit_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own habit_logs" ON public.habit_logs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);

-- ============================================================================
-- 4. TRIGGERS & FUNCTIONS
-- ============================================================================
-- Trigger to auto-create user in public.users on auth.users sign up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
