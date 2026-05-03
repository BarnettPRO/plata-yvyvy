# Plata Yvyvy - Supabase Database Structure Verification

## 📋 Overview
Complete database structure verification for all platform components. All migrations have been reviewed and validated.

---

## 🗄️ Core Tables

### `user_profile` - Main User Data
**Purpose**: Central user information and game state
**Migration**: 002_new_schema.sql + 003_add_location_fields.sql + 004_add_streak_system.sql + 005_add_barrio_owner.sql

```sql
CREATE TABLE public.user_profile (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  plan_type NOT NULL DEFAULT 'free',
  coins_collected_today INTEGER NOT NULL DEFAULT 0,
  streak_days          INTEGER NOT NULL DEFAULT 0,
  radar_pings_today     INTEGER DEFAULT 3, -- null for paid plans
  clan                  TEXT,
  total_coins           INTEGER NOT NULL DEFAULT 0,
  total_value           INTEGER NOT NULL DEFAULT 0,
  level                 INTEGER NOT NULL DEFAULT 1,
  achievements          JSONB DEFAULT '[]',
  is_admin              BOOLEAN DEFAULT FALSE,
  
  -- Location fields (003)
  city                  TEXT,
  barrio                TEXT,
  referred_by           UUID REFERENCES public.user_profile(id),
  referral_code         TEXT,
  
  -- Streak system (004)
  last_collection_date  DATE,
  current_streak        INTEGER DEFAULT 0,
  streak_multiplier     DECIMAL(3,2) DEFAULT 1.0,
  streak_rescue_available BOOLEAN DEFAULT TRUE,
  last_rescue_date      DATE,
  has_gold_crown        BOOLEAN DEFAULT FALSE,
  last_coin_spawn_seen  TIMESTAMP,
  
  -- Barrio owner (005)
  is_barrio_owner       BOOLEAN DEFAULT FALSE,
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `coins` - Game Coins
**Purpose**: Physical coins placed on map for collection
**Migration**: 002_new_schema.sql + 004_add_streak_system.sql

```sql
CREATE TABLE public.coins (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  value            INTEGER NOT NULL CHECK (value IN (50, 100, 500, 1000, 5000)),
  rarity           coin_rarity NOT NULL DEFAULT 'common',
  is_collected     BOOLEAN NOT NULL DEFAULT FALSE,
  collected_by     UUID REFERENCES public.user_profile(id),
  collected_at     TIMESTAMPTZ,
  
  -- Daily respawn tracking (004)
  spawn_date       DATE,
  spawn_batch_id   UUID,
  
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 🏗️ Platform Components Structure

### 🎮 Authentication System
**Tables**: `auth.users` (Supabase built-in) + `user_profile`
**Features**:
- Email/Google authentication
- Automatic profile creation on signup
- Row Level Security (RLS) policies

**RLS Policies**:
```sql
-- Users can read all profiles
CREATE POLICY "Users can read all profiles" ON public.user_profile FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON public.user_profile FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON public.user_profile FOR INSERT WITH CHECK (auth.uid() = id);
```

### 📍 Location & Ranking System
**Tables**: `user_profile` (city, barrio fields)
**Features**:
- Multi-layer ranking (País, Ciudad, Barrio, Amigos)
- Automatic geolocation detection
- Referral network tracking

**Indexes**:
```sql
CREATE INDEX idx_user_profile_city ON public.user_profile(city);
CREATE INDEX idx_user_profile_barrio ON public.user_profile(barrio);
CREATE INDEX idx_user_profile_total_value ON public.user_profile(total_value DESC);
CREATE INDEX idx_user_profile_referred_by ON public.user_profile(referred_by);
CREATE UNIQUE INDEX idx_user_profile_referral_code ON public.user_profile(referral_code) WHERE referral_code IS NOT NULL;
```

### 🔥 Streak & Retention System
**Tables**: `user_profile` (streak fields) + `coins` (spawn tracking)
**Features**:
- Daily streak tracking with multipliers
- Grace period rescue system
- Daily coin respawn at midnight Paraguay time
- Gold crown for 30-day streaks

**Functions**:
```sql
-- Calculate streak multiplier
calculate_streak_multiplier(streak_days INTEGER) RETURNS DECIMAL(3,2)

-- Update streak after collection
update_user_streak(user_id UUID, collection_date DATE) RETURNS VOID

-- Use streak rescue
use_streak_rescue(user_id UUID) RETURNS BOOLEAN

-- Clear old coins
clear_old_coins() RETURNS VOID

-- Generate daily coins
generate_daily_coins() RETURNS VOID

-- Check respawn needed
check_coin_respawn_needed() RETURNS BOOLEAN
```

### 👑 Barrio Owner System
**Tables**: `user_profile` (is_barrio_owner field)
**Features**:
- #1 player in each barrio gets "Dueño del barrio" title
- Minimum 3 players required per barrio
- Dynamic owner calculation

**Functions**:
```sql
-- Update all barrio owners
update_barrio_owners() RETURNS VOID

-- Check if user owns their barrio
is_user_barrio_owner(user_id UUID) RETURNS BOOLEAN

-- Get barrio owner info
get_barrio_owner(barrio_name TEXT) RETURNS TABLE(...)
```

---

## 📊 Database Types

### Enums
```sql
-- User subscription plans
CREATE TYPE plan_type AS ENUM ('free', 'explorador', 'conquistador', 'leyenda');

-- Coin rarity levels
CREATE TYPE coin_rarity AS ENUM ('common', 'rare', 'legendary');
```

---

## 🔍 Performance Indexes

### User Profile Indexes
```sql
-- Location-based queries
idx_user_profile_city
idx_user_profile_barrio
idx_user_profile_total_value (DESC)

-- Referral system
idx_user_profile_referred_by
idx_user_profile_referral_code (UNIQUE, WHERE NOT NULL)

-- Streak system
idx_user_profile_last_collection
idx_user_profile_current_streak (DESC)
idx_user_profile_barrio_owner
```

### Coins Indexes
```sql
-- Geographic queries
idx_coins_lat_lng
idx_coins_is_collected

-- Daily respawn
idx_coins_spawn_date
idx_coins_spawn_batch_id
```

---

## 🎯 API Integration Points

### Ranking APIs
- `/api/rankings?type=national` - Country-wide ranking
- `/api/rankings?type=city` - City ranking (requires user location)
- `/api/rankings?type=barrio` - Neighborhood ranking (requires user location)
- `/api/rankings?type=friends` - Referral network ranking

### Streak APIs
- `/api/streak` - Get user streak data
- `/api/streak` (POST) - Update streak on collection/use rescue

### Daily Respawn APIs
- `/api/daily-respawn` - Check and trigger daily coin respawn

---

## ✅ Verification Status

### ✅ Core Structure
- [x] User profiles with all required fields
- [x] Coins with geographic and rarity data
- [x] Authentication integration
- [x] Row Level Security policies

### ✅ Location System
- [x] City and barrio fields
- [x] Performance indexes
- [x] Referral code generation
- [x] Multi-layer ranking support

### ✅ Streak System
- [x] All streak tracking fields
- [x] Multiplier calculation functions
- [x] Rescue system logic
- [x] Daily respawn tracking

### ✅ Barrio Owner System
- [x] Owner flag field
- [x] Owner calculation functions
- [x] Minimum player requirements
- [x] Performance optimization

### ✅ Performance
- [x] Strategic indexes for all query patterns
- [x] Efficient ranking queries
- [x] Optimized geographic searches
- [x] Proper foreign key relationships

---

## 🚀 Migration Order

1. **001_initial.sql** - Basic structure (deprecated by 002)
2. **002_new_schema.sql** - Complete schema redesign
3. **003_add_location_fields.sql** - Location and referral system
4. **004_add_streak_system.sql** - Streak and daily respawn
5. **005_add_barrio_owner.sql** - Neighborhood owner system

All migrations are compatible and build upon each other properly.

---

## 📝 Notes

- **Timezone**: All date calculations use Paraguay timezone (America/Asuncion)
- **Security**: RLS enabled on user profile table
- **Performance**: All major query patterns have dedicated indexes
- **Scalability**: Designed for high-concurrency gaming environment
- **Data Integrity**: Proper foreign keys and constraints throughout

The database structure is complete and ready for production deployment! 🎮🇵🇾
