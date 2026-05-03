-- ============================================================
-- Plata Yvyvy — Update Treasure Scale with New Values
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop existing coin_rarity enum and recreate with new values
DROP TYPE IF EXISTS public.coin_rarity;

-- Create new coin_rarity enum with all rarity levels
CREATE TYPE public.coin_rarity AS ENUM (
  'common',
  'uncommon', 
  'rare',
  'epic',
  'legendary'
);

-- Update existing coins to use new rarity values
-- Map old values to new scale
UPDATE public.coins 
SET rarity = 'uncommon' 
WHERE rarity = 'common' AND value >= 100 AND value < 1000;

UPDATE public.coins 
SET rarity = 'rare' 
WHERE rarity = 'rare' AND value >= 1000 AND value < 5000;

UPDATE public.coins 
SET rarity = 'epic' 
WHERE rarity = 'legendary' AND value >= 5000 AND value < 50000;

UPDATE public.coins 
SET rarity = 'legendary' 
WHERE rarity = 'legendary' AND value >= 50000;

-- Update coin values to match new scale
UPDATE public.coins 
SET value = 50000 
WHERE rarity = 'common';

UPDATE public.coins 
SET value = 500000 
WHERE rarity = 'uncommon';

UPDATE public.coins 
SET value = 2000000 
WHERE rarity = 'rare';

UPDATE public.coins 
SET value = 10000000 
WHERE rarity = 'epic';

UPDATE public.coins 
SET value = 50000000 
WHERE rarity = 'legendary';

-- Update collection records to reflect new values
UPDATE public.collections 
SET value = CASE 
  WHEN c.rarity = 'common' THEN 50000
  WHEN c.rarity = 'uncommon' THEN 500000  
  WHEN c.rarity = 'rare' THEN 2000000
  WHEN c.rarity = 'epic' THEN 10000000
  WHEN c.rarity = 'legendary' THEN 50000000
  ELSE c.value
END
FROM public.coins c
WHERE public.collections.coin_id = c.id;

-- Update user total_value to reflect new scale
UPDATE public.user_profile 
SET total_value = (
  SELECT COALESCE(SUM(value), 0) 
  FROM public.collections 
  WHERE public.collections.user_id = public.user_profile.id
);
