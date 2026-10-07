-- Per-user daily count of AI calls (analyze + suggest), so one person can't use up the
-- shared Gemini quota. RLS on with no policies: backend only.
create table ai_usage (
  user_id uuid not null references users(id) on delete cascade,
  day     date not null default current_date,
  calls   integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);

alter table ai_usage enable row level security;
