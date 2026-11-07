begin;
alter type public.app_role add value if not exists 'worker';
create table app_private.auth_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);
create unique index auth_users_email_normalized on auth.users(lower(email));
create table app_private.worker_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  synthetic_person_id uuid not null unique references public.synthetic_people(id) on delete restrict,
  wallet_token text not null unique check(wallet_token ~ '^[0-9a-f]{64}$')
);
create table app_private.auth_sessions (
  token_digest text primary key check(token_digest ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index auth_sessions_user_idx on app_private.auth_sessions(user_id);
create index auth_sessions_expiry_idx on app_private.auth_sessions(expires_at);
create table app_private.login_attempts (
  attempt_key text primary key,
  attempts integer not null default 1,
  window_start timestamptz not null default now()
);
alter table app_private.auth_credentials enable row level security;
alter table app_private.worker_accounts enable row level security;
alter table app_private.auth_sessions enable row level security;
alter table app_private.login_attempts enable row level security;
revoke all on app_private.auth_credentials,app_private.worker_accounts,app_private.auth_sessions,app_private.login_attempts from public,anon,authenticated;
grant all on app_private.auth_credentials,app_private.worker_accounts,app_private.auth_sessions,app_private.login_attempts to service_role;
comment on table app_private.worker_accounts is 'Operational identity and private wallet only. Never join to anonymous survey_responses or Plaza content.';
insert into app_private.schema_migrations(version) values('20261108120000_local_auth');
commit;
