-- MacroBridge initial schema
--
-- Auth is handled by Spring Boot (not Supabase Auth), so users live in our own
-- `users` table. Spring Boot connects as the `postgres` role over JDBC, which
-- bypasses RLS. RLS is enabled with NO policies on every table so the public
-- Supabase Data API (anon / authenticated keys) can't read or write anything.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users: login credentials
-- ---------------------------------------------------------------------------
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  password_hash text   not null,                -- BCrypt hash from Spring Security
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles: one row per user, daily macro targets
-- ---------------------------------------------------------------------------
create table profiles (
  user_id         uuid primary key references users(id) on delete cascade,
  display_name    text,
  timezone        text not null default 'UTC',   -- IANA name, decides what "today" means
  target_calories integer      not null default 2000 check (target_calories between 0 and 20000),
  target_protein  numeric(6,1) not null default 150  check (target_protein >= 0),
  target_carbs    numeric(6,1) not null default 200  check (target_carbs   >= 0),
  target_fat      numeric(6,1) not null default 65   check (target_fat     >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- custom_foods: personal recipe / food library (values are per serving)
-- ---------------------------------------------------------------------------
create table custom_foods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  serving_label text not null default '1 serving',  -- e.g. "1 bowl", "100 g"
  calories      integer      not null check (calories >= 0),
  protein       numeric(6,1) not null check (protein  >= 0),
  carbs         numeric(6,1) not null check (carbs    >= 0),
  fat           numeric(6,1) not null check (fat      >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index custom_foods_user_name_key on custom_foods (user_id, lower(name));

create trigger custom_foods_updated_at
  before update on custom_foods
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- meals: confirmed log entries
-- ---------------------------------------------------------------------------
create table meals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  log_date       date not null,                    -- the user's local date (computed with profiles.timezone)
  logged_at      timestamptz not null default now(),
  meal_label     text not null default 'snack'
                   check (meal_label in ('breakfast', 'lunch', 'dinner', 'snack')),
  description    text not null,
  source         text not null default 'text'
                   check (source in ('text', 'photo', 'manual', 'custom_food')),
  custom_food_id uuid references custom_foods(id) on delete set null,
  servings       numeric(5,2) not null default 1 check (servings > 0),
  calories       integer      not null check (calories >= 0),
  protein        numeric(6,1) not null check (protein  >= 0),
  carbs          numeric(6,1) not null check (carbs    >= 0),
  fat            numeric(6,1) not null check (fat      >= 0),
  items          jsonb,                            -- per-item breakdown from Gemini
  confidence     text check (confidence in ('low', 'medium', 'high')),
  ai_notes       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- GET /api/meals/today → where user_id = ? and log_date = ?
create index meals_user_date_idx on meals (user_id, log_date);

create trigger meals_updated_at
  before update on meals
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Lock down the Supabase Data API
-- ---------------------------------------------------------------------------
alter table users        enable row level security;
alter table profiles     enable row level security;
alter table custom_foods enable row level security;
alter table meals        enable row level security;
