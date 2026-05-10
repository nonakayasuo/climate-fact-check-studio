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

create table if not exists fact_check_evidence_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner text not null,
  url text not null,
  source_type text not null check (source_type in ('url', 'pdf', 'report', 'dataset')),
  themes jsonb not null default '[]',
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists fact_check_evidence_sources_url_unique
  on fact_check_evidence_sources (lower(url));

create index if not exists fact_check_evidence_sources_status_idx
  on fact_check_evidence_sources (status, registered_at desc);
