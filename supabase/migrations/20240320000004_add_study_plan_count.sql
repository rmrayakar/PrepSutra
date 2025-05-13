-- Add study_plan_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'study_plan_count'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN study_plan_count integer DEFAULT 0;
    END IF;
END $$;

-- Update study_plan_count for existing profiles
UPDATE public.profiles p
SET study_plan_count = (
    SELECT COUNT(*)
    FROM public.study_plans sp
    WHERE sp.user_id = p.id
); 