-- Migration: Create Profiles Table with RLS

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    farm_size REAL,
    primary_crops TEXT,
    soil_type TEXT,
    irrigation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ALL policy for authenticated users to manage their own profile
CREATE POLICY "Users can manage own profile." 
ON public.profiles 
FOR ALL 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- Force a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
