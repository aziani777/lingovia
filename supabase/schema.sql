-- Lingovia: tables for accounts, saved progress and call minutes.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  state jsonb,                         -- the learner's progress, as the app stores it
  stripe_customer text,                -- set the first time they open the payment page
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calls (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id text not null unique,
  started_at timestamptz not null default now(),
  seconds integer not null default 0,  -- first what the app reports, then the real length from the voice service
  verified boolean not null default false
);
create index if not exists calls_user_started on public.calls (user_id, started_at);

-- Nobody reads or writes these tables from the browser: only the server does, with the secret key.
alter table public.profiles enable row level security;
alter table public.calls enable row level security;
