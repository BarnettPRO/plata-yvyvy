-- ============================================================
-- Plata Yvyvy — Fix Migration (handles existing types)
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.coins CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profile CASCADE;

-- Drop existing types (ignore if they don't exist)
DROP TYPE IF EXISTS public.coin_type CASCADE;
DROP TYPE IF EXISTS public.plan_type CASCADE;
DROP TYPE IF EXISTS public.coin_rarity CASCADE;

-- ============================================================
-- TYPES
-- ============================================================
create type plan_type as enum ('free', 'explorador', 'conquistador', 'leyenda');
create type coin_rarity as enum ('common', 'rare', 'legendary');

-- ============================================================
-- USER PROFILE (extends auth.users)
-- ============================================================
create table public.user_profile (
  id                    uuid primary key references auth.users(id) on delete cascade,
  plan                  plan_type not null default 'free',
  coins_collected_today integer not null default 0,
  streak_days          integer not null default 0,
  radar_pings_today     integer default 3, -- null for paid plans
  clan                  text,
  total_coins           integer not null default 0,
  total_value           integer not null default 0,
  level                 integer not null default 1,
  achievements          jsonb default '[]',
  is_admin              boolean default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.user_profile enable row level security;

-- ============================================================
-- COINS
-- ============================================================
create table public.coins (
  id               uuid primary key default uuid_generate_v4(),
  lat              double precision not null,
  lng              double precision not null,
  value            integer not null check (value in (50, 100, 500, 1000)),
  rarity           coin_rarity not null default 'common',
  sponsored_by     text,
  placed_by_user   uuid references public.user_profile(id),
  event_tag        text,
  collected        boolean default false,
  collected_by     uuid references public.user_profile(id),
  collected_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- Indexes for performance
create index coins_location_idx on public.coins (lat, lng);
create index coins_active_idx on public.coins (collected, created_at);
create index coins_rarity_idx on public.coins (rarity);
create index coins_collected_by_idx on public.coins (collected_by);

alter table public.coins enable row level security;

-- ============================================================
-- COLLECTIONS (tracking)
-- ============================================================
create table public.collections (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.user_profile(id) on delete cascade,
  coin_id      uuid not null references public.coins(id),
  value        integer not null,
  rarity       coin_rarity not null,
  user_lat     double precision not null,
  user_lng     double precision not null,
  collected_at timestamptz not null default now()
);

create index collections_user_idx on public.collections (user_id, collected_at desc);

alter table public.collections enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- User Profile policies
create policy "Users can view all profiles" 
  on public.user_profile for select using (true);

create policy "Users can update own profile" 
  on public.user_profile for update using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.user_profile for insert with check (auth.uid() = id);

-- Coins policies
create policy "Anyone can view active coins" 
  on public.coins for select using (true);

create policy "Users can update collected status" 
  on public.coins for update using (auth.uid() = collected_by);

create policy "Conquistador+ can place coins" 
  on public.coins for insert with check (
    auth.uid() = placed_by_user AND 
    exists (select 1 from public.user_profile where id = auth.uid() and plan in ('conquistador', 'leyenda'))
  );

create policy "Admins can manage all coins" 
  on public.coins for all using (exists (select 1 from public.user_profile where id = auth.uid() and is_admin = true));

-- Collections policies
create policy "Users can view own collections" 
  on public.collections for select using (auth.uid() = user_id);

create policy "System can insert collections" 
  on public.collections for insert with check (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to get user's radar pings remaining
create or replace function get_radar_pings_remaining(user_uuid uuid)
returns integer language sql security definer as $$
  select 
    case 
      when plan = 'free' then greatest(0, coalesce(radar_pings_today, 3))
      else null 
    end
  from public.user_profile 
  where id = user_uuid;
$$;

-- Function to check if user can collect more coins today
create or replace function can_collect_more_today(user_uuid uuid)
returns boolean language sql security definer as $$
  select 
    plan != 'free' or coins_collected_today < 10
  from public.user_profile 
  where id = user_uuid;
$$;

-- Function to check if user can see coin rarity
create or replace function can_see_rarity(user_uuid uuid, target_rarity coin_rarity)
returns boolean language sql security definer as $$
  select 
    case 
      when target_rarity = 'common' then true
      when target_rarity = 'rare' then plan in ('explorador', 'conquistador', 'leyenda')
      when target_rarity = 'legendary' then plan in ('conquistador', 'leyenda')
      else false
    end
  from public.user_profile 
  where id = user_uuid;
$$;

-- Daily reset function
create or replace function daily_reset()
returns void language sql security definer as $$
  update public.user_profile 
  set 
    coins_collected_today = 0,
    radar_pings_today = 3,
    streak_days = case 
      when coins_collected_today > 0 then streak_days + 1
      else 0
    end,
    updated_at = now()
  where plan = 'free';
$$;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table public.coins;
alter publication supabase_realtime add table public.user_profile;
