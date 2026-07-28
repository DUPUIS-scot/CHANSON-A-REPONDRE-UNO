create table if not exists public.openai_user_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null,
  iv text not null,
  auth_tag text not null,
  encryption_version integer not null default 1,
  masked_key text not null,
  updated_at timestamptz not null default now()
);

alter table public.openai_user_credentials enable row level security;

-- No browser/client policy is intentionally defined. Only the backend service role
-- can read or mutate encrypted credentials. auth.users cascade handles deletion.
