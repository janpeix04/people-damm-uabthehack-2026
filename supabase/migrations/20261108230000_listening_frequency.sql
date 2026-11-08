begin;
create table app_private.listening_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 mood_frequency text not null default 'daily' check(mood_frequency in ('daily','weekly','off')),
 survey_reminders boolean not null default true,
 paused_until timestamptz
);
create table app_private.listening_reminder_batches (
 id uuid primary key default extensions.gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 site_id uuid references public.sites(id),
 group_type text not null check(group_type in ('all','department','shift')),
 group_code text not null default '',
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table app_private.listening_prompts (
 id uuid primary key default extensions.gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 local_day date not null default (now() at time zone 'Europe/Madrid')::date,
 kind text not null check(kind in ('mood','survey')),
 campaign_id uuid references public.campaigns(id) on delete cascade,
 batch_id uuid references app_private.listening_reminder_batches(id) on delete cascade,
 shown_at timestamptz not null default now(),
 unique(user_id,local_day)
);
alter table app_private.listening_preferences enable row level security;
alter table app_private.listening_reminder_batches enable row level security;
alter table app_private.listening_prompts enable row level security;
comment on table app_private.listening_prompts is 'Private notification frequency log; never stores answer content. One proactive in-app prompt per account and local day across all listening features.';
insert into app_private.schema_migrations(version) values('20261108230000_listening_frequency');
commit;
