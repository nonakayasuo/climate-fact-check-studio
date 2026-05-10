create table if not exists fact_check_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  media_type text,
  topic text,
  input_text text not null,
  claims jsonb not null default '[]',
  ai_memo text,
  sources jsonb not null default '[]',
  risks jsonb not null default '[]',
  human_rating_accuracy integer check (human_rating_accuracy between 1 and 5),
  human_rating_usefulness integer check (human_rating_usefulness between 1 and 5),
  human_rating_trust integer check (human_rating_trust between 1 and 5),
  human_revision text,
  revision_reason jsonb not null default '[]'
);

create index if not exists fact_check_sessions_created_at_idx
  on fact_check_sessions (created_at desc);

create index if not exists fact_check_sessions_topic_idx
  on fact_check_sessions (topic);
