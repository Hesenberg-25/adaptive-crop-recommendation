-- Migration: Add full_results JSONB column to predictions table

ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS full_results JSONB;

-- Force a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
