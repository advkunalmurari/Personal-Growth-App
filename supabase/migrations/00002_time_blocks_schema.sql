-- Create Time Block Types Enum
CREATE TYPE time_block_type AS ENUM ('task', 'habit', 'focus', 'break', 'meeting', 'routine');

-- Create Time Blocks Table
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type time_block_type NOT NULL DEFAULT 'focus',
  reference_id UUID, -- Can flexibly link to tasks.id or habits.id
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own time blocks"
  ON public.time_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks"
  ON public.time_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks"
  ON public.time_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks"
  ON public.time_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger (assuming the trigger function update_updated_at_column already exists from Sprint 1)
CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON public.time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
