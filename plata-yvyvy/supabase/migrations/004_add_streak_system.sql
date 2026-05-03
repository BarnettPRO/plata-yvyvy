-- ============================================================
-- Plata Yvyvy — Add Streak System and Daily Coin Respawn
-- Run in Supabase SQL Editor
-- ============================================================

-- Add streak tracking fields to user_profile
ALTER TABLE public.user_profile 
ADD COLUMN last_collection_date DATE,
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN streak_multiplier DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN streak_rescue_available BOOLEAN DEFAULT TRUE,
ADD COLUMN last_rescue_date DATE,
ADD COLUMN has_gold_crown BOOLEAN DEFAULT FALSE,
ADD COLUMN last_coin_spawn_seen TIMESTAMP;

-- Add coin tracking for daily respawn
ALTER TABLE public.coins
ADD COLUMN spawn_date DATE,
ADD COLUMN spawn_batch_id UUID;

-- Create indexes for streak queries
CREATE INDEX idx_user_profile_last_collection ON public.user_profile(last_collection_date);
CREATE INDEX idx_user_profile_current_streak ON public.user_profile(current_streak DESC);
CREATE INDEX idx_coins_spawn_date ON public.coins(spawn_date);
CREATE INDEX idx_coins_spawn_batch ON public.coins(spawn_batch_id);

-- Function to calculate streak multiplier
CREATE OR REPLACE FUNCTION calculate_streak_multiplier(streak_days INTEGER)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  IF streak_days >= 30 THEN
    RETURN 3.0;
  ELSIF streak_days >= 7 THEN
    RETURN 2.0;
  ELSIF streak_days >= 3 THEN
    RETURN 1.5;
  ELSE
    RETURN 1.0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streak after coin collection
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID, collection_date DATE)
RETURNS VOID AS $$
DECLARE
  last_date DATE;
  current_streak_val INTEGER;
  new_multiplier DECIMAL(3,2);
  days_diff INTEGER;
BEGIN
  -- Get current streak and last collection date
  SELECT last_collection_date, current_streak 
  INTO last_date, current_streak_val
  FROM public.user_profile 
  WHERE id = user_id;
  
  -- Calculate days difference
  IF last_date IS NULL THEN
    -- First time collecting
    days_diff := 0;
  ELSE
    days_diff := collection_date - last_date;
  END IF;
  
  -- Update streak based on days difference
  IF days_diff = 0 THEN
    -- Same day, no change
    RETURN;
  ELSIF days_diff = 1 THEN
    -- Consecutive day, increment streak
    current_streak_val := current_streak_val + 1;
  ELSIF days_diff = 2 AND last_date = collection_date - INTERVAL '2 days' THEN
    -- Missed exactly one day, check if rescue is available
    IF EXISTS (
      SELECT 1 FROM public.user_profile 
      WHERE id = user_id 
      AND streak_rescue_available = TRUE 
      AND (last_rescue_date IS NULL OR last_rescue_date < collection_date - INTERVAL '7 days')
    ) THEN
      -- Rescue available, but don't use it automatically
      RETURN;
    ELSE
      -- No rescue available, reset streak
      current_streak_val := 1;
    END IF;
  ELSE
    -- Missed more than one day or other gap, reset streak
    current_streak_val := 1;
  END IF;
  
  -- Calculate new multiplier
  new_multiplier := calculate_streak_multiplier(current_streak_val);
  
  -- Check for gold crown (30-day streak)
  DECLARE
    has_crown BOOLEAN := FALSE;
  BEGIN
    IF current_streak_val >= 30 THEN
      has_crown := TRUE;
    END IF;
    
    -- Update user profile
    UPDATE public.user_profile
    SET 
      last_collection_date = collection_date,
      current_streak = current_streak_val,
      streak_multiplier = new_multiplier,
      has_gold_crown = has_crown,
      streak_rescue_available = CASE 
        WHEN days_diff <= 1 THEN TRUE 
        ELSE FALSE 
      END
    WHERE id = user_id;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to use streak rescue
CREATE OR REPLACE FUNCTION use_streak_rescue(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_date DATE;
  rescue_available BOOLEAN;
BEGIN
  -- Check if rescue is available
  SELECT last_collection_date, streak_rescue_available
  INTO last_date, rescue_available
  FROM public.user_profile
  WHERE id = user_id;
  
  IF NOT rescue_available OR last_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if exactly one day was missed
  IF CURRENT_DATE - last_date = 2 THEN
    -- Use rescue: restore streak and set rescue cooldown
    UPDATE public.user_profile
    SET 
      current_streak = current_streak + 1,
      streak_multiplier = calculate_streak_multiplier(current_streak + 1),
      streak_rescue_available = FALSE,
      last_rescue_date = CURRENT_DATE,
      last_collection_date = CURRENT_DATE - INTERVAL '1 day'
    WHERE id = user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to clear old coins (for daily respawn)
CREATE OR REPLACE FUNCTION clear_old_coins()
RETURNS VOID AS $$
BEGIN
  -- Delete coins that are more than 1 day old
  DELETE FROM public.coins
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily coin batch
CREATE OR REPLACE FUNCTION generate_daily_coins()
RETURNS UUID AS $$
DECLARE
  batch_id UUID;
  new_coins RECORD[];
  lat_offset DECIMAL;
  lng_offset DECIMAL;
  i INTEGER;
BEGIN
  -- Generate batch ID
  batch_id := gen_random_uuid();
  
  -- Clear old coins first
  PERFORM clear_old_coins();
  
  -- Generate 20 coins with specified distribution
  FOR i IN 1..20 LOOP
    -- Random position within 500m radius (approx 0.0045 degrees lat, 0.006 degrees lng)
    lat_offset := (RANDOM() - 0.5) * 0.009;
    lng_offset := (RANDOM() - 0.5) * 0.012;
    
    -- Determine coin value based on distribution
    IF i <= 10 THEN
      -- 10x ₲50 coins
      INSERT INTO public.coins (lat, lng, value, rarity, spawn_date, spawn_batch_id)
      VALUES (-25.2667 + lat_offset, -57.5833 + lng_offset, 50, 'common', CURRENT_DATE, batch_id);
    ELSIF i <= 16 THEN
      -- 6x ₲100 coins
      INSERT INTO public.coins (lat, lng, value, rarity, spawn_date, spawn_batch_id)
      VALUES (-25.2667 + lat_offset, -57.5833 + lng_offset, 100, 'common', CURRENT_DATE, batch_id);
    ELSIF i <= 19 THEN
      -- 3x ₲500 coins
      INSERT INTO public.coins (lat, lng, value, rarity, spawn_date, spawn_batch_id)
      VALUES (-25.2667 + lat_offset, -57.5833 + lng_offset, 500, 'rare', CURRENT_DATE, batch_id);
    ELSE
      -- 1x ₲1.000 coin
      INSERT INTO public.coins (lat, lng, value, rarity, spawn_date, spawn_batch_id)
      VALUES (-25.2667 + lat_offset, -57.5833 + lng_offset, 1000, 'rare', CURRENT_DATE, batch_id);
    END IF;
  END LOOP;
  
  -- 20% chance for ₲5.000 coin
  IF RANDOM() < 0.2 THEN
    lat_offset := (RANDOM() - 0.5) * 0.009;
    lng_offset := (RANDOM() - 0.5) * 0.012;
    INSERT INTO public.coins (lat, lng, value, rarity, spawn_date, spawn_batch_id)
    VALUES (-25.2667 + lat_offset, -57.5833 + lng_offset, 5000, 'legendary', CURRENT_DATE, batch_id);
  END IF;
  
  RETURN batch_id;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily coin respawn at midnight Paraguay time (GMT-4)
-- This would be set up as a cron job or scheduled function
-- For now, we'll create a function to check if respawn is needed
CREATE OR REPLACE FUNCTION should_respawn_coins()
RETURNS BOOLEAN AS $$
DECLARE
  last_spawn_date DATE;
BEGIN
  -- Get the most recent coin spawn date
  SELECT MAX(spawn_date) INTO last_spawn_date
  FROM public.coins;
  
  -- If no coins exist or last spawn was before today, respawn needed
  IF last_spawn_date IS NULL OR last_spawn_date < CURRENT_DATE THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
