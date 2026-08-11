-- Migration: Create favorite_crops table for crop catalog favorites

CREATE TABLE IF NOT EXISTS public.favorite_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, crop_name)
);

-- Enable RLS
ALTER TABLE public.favorite_crops ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own favorites
CREATE POLICY "Users can manage own favorite crops."
ON public.favorite_crops
FOR ALL
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- Force a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
