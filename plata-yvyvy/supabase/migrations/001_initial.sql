-- ============================================================
-- Plata Yvyvy — Supabase Migration 001
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Coin type enum
create type coin_type as enum ('bronze', 'silver', 'gold');

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  avatar_url    text,
  total_xp      integer not null default 0,
  level         integer not null default 1,
  referral_code text not null unique default substr(md5(random()::text), 1, 6),
  referred_by   uuid references public.users(id),
  created_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ============================================================
-- COINS
-- ============================================================
create table public.coins (
  id           uuid primary key default uuid_generate_v4(),
  type         coin_type not null,
  xp_value     integer not null,
  lat          double precision not null,
  lng          double precision not null,
  is_collected boolean not null default false,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

-- Spatial index for bbox queries
create index coins_location_idx on public.coins (lat, lng);
create index coins_active_idx   on public.coins (is_collected, expires_at);

alter table public.coins enable row level security;

create policy "Anyone can read active coins"
  on public.coins for select using (not is_collected and expires_at > now());

-- Service role only for insert/update (via API routes)
create policy "Service role can manage coins"
  on public.coins for all using (auth.role() = 'service_role');

-- ============================================================
-- COLLECTIONS
-- ============================================================
create table public.collections (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  coin_id      uuid not null references public.coins(id),
  xp_gained    integer not null,
  user_lat     double precision not null,
  user_lng     double precision not null,
  collected_at timestamptz not null default now(),
  unique (user_id, coin_id)
);

create index collections_user_idx on public.collections (user_id, collected_at desc);

alter table public.collections enable row level security;

create policy "Users can read own collections"
  on public.collections for select using (auth.uid() = user_id);

create policy "Service role can insert collections"
  on public.collections for insert with check (auth.role() = 'service_role');

-- ============================================================
-- USER_ACHIEVEMENTS
-- ============================================================
create table public.user_achievements (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  achievement  text not null,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, achievement)
);

alter table public.user_achievements enable row level security;

create policy "Users can read own achievements"
  on public.user_achievements for select using (auth.uid() = user_id);

create policy "Service role can insert achievements"
  on public.user_achievements for insert with check (auth.role() = 'service_role');

-- ============================================================
-- CLEANUP JOB — delete expired coins (call via pg_cron or edge function)
-- ============================================================
create or replace function cleanup_expired_coins()
returns void language sql security definer as $$
  delete from public.coins
  where is_collected = true or expires_at < now() - interval '1 hour';
$$;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table public.coins;
alter publication supabase_realtime add table public.users;
