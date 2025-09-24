-- Fix for missing profiles.role column
-- Run this in your Supabase SQL editor to add the missing role column

-- Add the role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    -- Check if the role column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        -- Add the role column
        ALTER TABLE public.profiles 
        ADD COLUMN role text NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'reviewer', 'admin'));
        
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
END $$;

-- Update existing profiles to have the correct role based on whether they have a reviewer profile
UPDATE public.profiles 
SET role = 'reviewer' 
WHERE id IN (
    SELECT user_id 
    FROM public.reviewers 
    WHERE user_id IS NOT NULL
);

-- Show the results
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;
