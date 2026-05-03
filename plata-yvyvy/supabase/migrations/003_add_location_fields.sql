-- ============================================================
-- Plata Yvyvy — Add Location Fields for Multi-Layer Ranking
-- Run in Supabase SQL Editor
-- ============================================================

-- Add city and barrio columns to user_profile
ALTER TABLE public.user_profile 
ADD COLUMN city TEXT,
ADD COLUMN barrio TEXT;

-- Create indexes for fast ranking queries
CREATE INDEX idx_user_profile_city ON public.user_profile(city);
CREATE INDEX idx_user_profile_barrio ON public.user_profile(barrio);
CREATE INDEX idx_user_profile_total_value ON public.user_profile(total_value DESC);

-- Add referral tracking to user_profile for friend ranking
ALTER TABLE public.user_profile 
ADD COLUMN referred_by UUID REFERENCES public.user_profile(id),
ADD COLUMN referral_code TEXT;

-- Create unique index on referral_code
CREATE UNIQUE INDEX idx_user_profile_referral_code ON public.user_profile(referral_code) WHERE referral_code IS NOT NULL;

-- Create index for referral queries
CREATE INDEX idx_user_profile_referred_by ON public.user_profile(referred_by);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTRING(chars, FLOOR(RANDOM() * 36) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON public.user_profile
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();
