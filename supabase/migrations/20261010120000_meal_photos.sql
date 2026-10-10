-- The photo a meal was logged with: a JPEG the frontend shrinks to 800 px (~50-120 KB), one per meal.
-- Like every table here: RLS on with no policies, so only the backend (postgres role) can touch them.
-- ponytail: photos live in Postgres like avatars; move them to Supabase Storage before the 500 MB free DB fills up.
create table meal_photos (
  meal_id    uuid primary key references meals(id) on delete cascade,
  image      bytea not null,
  created_at timestamptz not null default now()
);

alter table meal_photos enable row level security;
