-- Migration: Add RLS to predictions table

-- Ensure RLS is enabled on predictions table
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own prediction history
CREATE POLICY "Users can manage own predictions" 
ON public.predictions 
FOR ALL 
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- Force a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
