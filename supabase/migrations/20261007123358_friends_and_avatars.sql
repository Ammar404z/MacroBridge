-- Friends (mutual, via invite links), meal sharing switch, and profile pictures.
-- Like every table here: RLS on with no policies, so only the backend (postgres role) can touch them.

-- ---------------------------------------------------------------------------
-- profiles: sharing switch + personal invite code (the code in /invite/<code>)
-- ---------------------------------------------------------------------------
alter table profiles
  add column share_meals boolean not null default true,
  add column invite_code text;

update profiles set invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

alter table profiles
  alter column invite_code set not null,
  alter column invite_code set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

create unique index profiles_invite_code_key on profiles (invite_code);

-- ---------------------------------------------------------------------------
-- friendships: one row per pair. pending until the addressee accepts.
-- Deleting the row = decline, cancel, or unfriend.
-- ---------------------------------------------------------------------------
create table friendships (
  requester_id uuid not null references users(id) on delete cascade,
  addressee_id uuid not null references users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- At most one row per pair, whichever direction it was sent in
create unique index friendships_pair_key
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
-- FK index; requester_id is already covered by the primary key
create index friendships_addressee_id_idx on friendships (addressee_id);

alter table friendships enable row level security;

-- ---------------------------------------------------------------------------
-- avatars: small square JPEG (the frontend resizes to 256 px), one per user
-- ---------------------------------------------------------------------------
create table avatars (
  user_id    uuid primary key references users(id) on delete cascade,
  image      bytea not null,
  updated_at timestamptz not null default now()
);

alter table avatars enable row level security;
