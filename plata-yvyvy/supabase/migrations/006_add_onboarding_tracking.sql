-- ============================================================
-- Plata Yvyvy — Add Onboarding Tracking
-- Run in Supabase SQL Editor
-- ============================================================

-- Add onboarding tracking field to user profile
ALTER TABLE public.user_profile 
ADD COLUMN has_seen_onboarding BOOLEAN DEFAULT FALSE;
