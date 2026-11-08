begin;
create table app_private.daily_mood_receipts (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 primary key(user_id,day)
);
create table public.daily_moods (
 id uuid primary key default extensions.gen_random_uuid(),
 day date not null,
 site_id uuid not null references public.sites(id),
 department_id uuid not null references public.departments(id),
 mood smallint not null check(mood between 1 and 5)
);
create index daily_moods_day_department_site on public.daily_moods(day,department_id,site_id);
alter table app_private.daily_mood_receipts enable row level security;
alter table public.daily_moods enable row level security;
comment on table public.daily_moods is 'Voluntary daily mood. No user, wallet or precise timestamp; never awards points.';
insert into app_private.schema_migrations(version) values('20261108190000_daily_mood');
commit;
