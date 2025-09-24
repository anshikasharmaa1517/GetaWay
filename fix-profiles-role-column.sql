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

-- Create profiles for users who don't have them yet
INSERT INTO public.profiles (id, role, onboarded)
SELECT 
    u.id,
    CASE 
        WHEN r.user_id IS NOT NULL THEN 'reviewer'
        ELSE 'user'
    END as role,
    CASE 
        WHEN r.user_id IS NOT NULL THEN true
        ELSE false
    END as onboarded
FROM auth.users u
LEFT JOIN public.reviewers r ON u.id = r.user_id
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET
    role = CASE 
        WHEN EXISTS (SELECT 1 FROM public.reviewers WHERE user_id = public.profiles.id) THEN 'reviewer'
        ELSE public.profiles.role
    END;

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
