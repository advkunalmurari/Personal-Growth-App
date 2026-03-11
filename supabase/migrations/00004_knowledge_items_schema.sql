-- Knowledge Items Schema (Sprint 10: Second Brain)
-- Run this in Supabase Dashboard > SQL Editor

-- Create knowledge type enum
DO $$ BEGIN
    CREATE TYPE knowledge_type AS ENUM ('concept', 'application', 'connection', 'insight');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create Leitner box enum (1-5 boxes for spaced repetition)
DO $$ BEGIN
    CREATE TYPE leitner_box AS ENUM ('1', '2', '3', '4', '5');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Knowledge items table
CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type knowledge_type NOT NULL DEFAULT 'insight',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    tags TEXT[] DEFAULT '{}',
    leitner_box leitner_box NOT NULL DEFAULT '1',
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    review_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own knowledge items" ON knowledge_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge items" ON knowledge_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge items" ON knowledge_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge items" ON knowledge_items
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger (reuse existing function)
CREATE TRIGGER update_knowledge_items_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
