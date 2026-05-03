-- ============================================================
-- Plata Yvyvy — Add Barrio Owner System
-- Run in Supabase SQL Editor
-- ============================================================

-- Add barrio owner field to user profile
ALTER TABLE public.user_profile 
ADD COLUMN is_barrio_owner BOOLEAN DEFAULT FALSE;

-- Create index for barrio owner queries
CREATE INDEX idx_user_profile_barrio_owner ON public.user_profile(is_barrio_owner);

-- Function to update barrio owners (run this periodically or on demand)
CREATE OR REPLACE FUNCTION update_barrio_owners()
RETURNS VOID AS $$
DECLARE
    barrio_record RECORD;
    top_player RECORD;
BEGIN
    -- Clear all existing barrio owner flags
    UPDATE public.user_profile SET is_barrio_owner = FALSE;
    
    -- For each barrio with at least 3 players, find the #1 player
    FOR barrio_record IN 
        SELECT barrio 
        FROM public.user_profile 
        WHERE barrio IS NOT NULL 
        AND barrio != 'Desconocido'
        GROUP BY barrio 
        HAVING COUNT(*) >= 3
    LOOP
        -- Find the top player in this barrio
        SELECT id INTO top_player.id
        FROM public.user_profile 
        WHERE barrio = barrio_record.barrio 
        ORDER BY total_value DESC, created_at ASC 
        LIMIT 1;
        
        -- Mark as barrio owner
        UPDATE public.user_profile 
        SET is_barrio_owner = TRUE 
        WHERE id = top_player.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is barrio owner
CREATE OR REPLACE FUNCTION is_user_barrio_owner(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN;
    user_barrio TEXT;
    player_count INTEGER;
BEGIN
    -- Get user's barrio
    SELECT barrio INTO user_barrio
    FROM public.user_profile
    WHERE id = user_id;
    
    -- If no barrio or unknown barrio, not an owner
    IF user_barrio IS NULL OR user_barrio = 'Desconocido' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if barrio has enough players (minimum 3)
    SELECT COUNT(*) INTO player_count
    FROM public.user_profile
    WHERE barrio = user_barrio;
    
    IF player_count < 3 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is the top player in their barrio
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profile up1
        WHERE up1.id = user_id
        AND up1.barrio = user_barrio
        AND NOT EXISTS (
            SELECT 1 
            FROM public.user_profile up2
            WHERE up2.barrio = user_barrio
            AND up2.total_value > up1.total_value
        )
        AND NOT EXISTS (
            SELECT 1 
            FROM public.user_profile up3
            WHERE up3.barrio = user_barrio
            AND up3.total_value = up1.total_value
            AND up3.created_at < up1.created_at
            AND up3.id != up1.id
        )
    ) INTO is_owner;
    
    RETURN is_owner;
END;
$$ LANGUAGE plpgsql;

-- Function to get barrio owner info
CREATE OR REPLACE FUNCTION get_barrio_owner(barrio_name TEXT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    total_value BIGINT,
    level INTEGER,
    barrio TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        'Jugador ' || SUBSTRING(up.id::TEXT, 1, 8) as username,
        up.total_value,
        up.level,
        up.barrio
    FROM public.user_profile up
    WHERE up.barrio = barrio_name
    AND up.total_value = (
        SELECT MAX(total_value)
        FROM public.user_profile
        WHERE barrio = barrio_name
    )
    ORDER BY up.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
