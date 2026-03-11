-- Create the function for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Review Types Enum
CREATE TYPE review_type AS ENUM ('daily', 'weekly', 'monthly');

-- Create Review Sessions Table
CREATE TABLE public.review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_type review_type NOT NULL,
  review_date DATE NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb, -- Stores scores: { energy: 8, focus: 7, clarity: 9 }
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure unique review per type per day per user
ALTER TABLE public.review_sessions ADD CONSTRAINT unique_review_per_day UNIQUE (user_id, review_type, review_date);

-- Enable RLS
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own review_sessions"
  ON public.review_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review_sessions"
  ON public.review_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review_sessions"
  ON public.review_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review_sessions"
  ON public.review_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Apply generic updated_at trigger (from Sprint 1)
CREATE TRIGGER update_review_sessions_updated_at
  BEFORE UPDATE ON public.review_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
