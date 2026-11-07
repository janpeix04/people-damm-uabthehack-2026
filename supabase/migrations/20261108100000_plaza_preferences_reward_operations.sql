-- Additive migration: no reset, no identity link on anonymous content.
begin;

create table app_private.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table public.plaza_categories (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null check (length(btrim(name)) between 1 and 120),
  position smallint not null unique check (position > 0),
  active boolean not null default true
);
insert into public.plaza_categories(id,name,position) values
  ('descans-torns','Descans i torns',1),('comunicacio','Comunicació',2),
  ('ambient','Ambient',3),('seguretat','Seguretat',4),
  ('installacions','Instal·lacions',5),('altres','Altres',6);

create table public.plaza_ideas (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id text not null references public.plaza_categories(id) on delete restrict,
  body_redacted text not null check (length(btrim(body_redacted)) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending','published','rejected','archived')),
  submitted_on date not null default current_date,
  published_on date,
  action_id uuid references public.action_recommendations(id) on delete set null,
  constraint idea_publication_date check (status <> 'published' or published_on is not null)
);
comment on table public.plaza_ideas is 'Anonymous ideas. No author, wallet, employee, IP or exact submission timestamp. Only sanitized content is stored.';
create index plaza_ideas_moderation_idx on public.plaza_ideas(status,submitted_on);
create index plaza_ideas_category_idx on public.plaza_ideas(category_id) where status='published';

create table app_private.plaza_moderation_events (
  id uuid primary key default extensions.gen_random_uuid(),
  idea_id uuid not null references public.plaza_ideas(id) on delete cascade,
  previous_status text check (previous_status in ('pending','published','rejected','archived')),
  new_status text not null check (new_status in ('pending','published','rejected','archived')),
  moderator_id uuid references public.user_profiles(user_id) on delete set null,
  reason_redacted text check (length(reason_redacted) <= 2000),
  occurred_at timestamptz not null default now()
);
create index plaza_moderation_idea_idx on app_private.plaza_moderation_events(idea_id,occurred_at);

-- Preference identity lives separately from all anonymous survey/Plaza content.
create table app_private.worker_preferences (
  wallet_digest bytea primary key references app_private.app_wallets(token_digest) on delete cascade,
  skin smallint not null default 1 check (skin between 0 and 5),
  hair smallint not null default 0 check (hair between 0 and 5),
  shirt smallint not null default 0 check (shirt between 0 and 5),
  hair_style smallint not null default 0 check (hair_style between 0 and 3),
  show_logo boolean not null default true,
  locale text not null default 'ca' check (locale in ('ca','es','en')),
  updated_at timestamptz not null default now()
);

create table public.plaza_daily_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  question_date date not null unique,
  prompt text not null check (length(btrim(prompt)) between 1 and 1000),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  min_sample_size integer not null default 10 check (min_sample_size >= 10),
  created_by uuid references public.user_profiles(user_id) on delete set null,
  approved_by uuid references public.user_profiles(user_id) on delete set null,
  approved_at timestamptz,
  constraint plaza_question_approval check (status='draft' or (approved_by is not null and approved_at is not null))
);
create table public.plaza_daily_options (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.plaza_daily_questions(id) on delete cascade,
  option_key text not null check (length(btrim(option_key)) between 1 and 80),
  label text not null check (length(btrim(label)) between 1 and 300),
  emoji text,
  position smallint not null check (position > 0),
  unique(question_id,option_key),
  unique(question_id,position),
  unique(question_id,id)
);
create table app_private.plaza_daily_votes (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.plaza_daily_questions(id) on delete cascade,
  option_id uuid not null,
  foreign key(question_id,option_id) references public.plaza_daily_options(question_id,id) on delete cascade
);
comment on table app_private.plaza_daily_votes is 'Anonymous vote content, without wallet, person or timestamp. Backend must insert receipt and vote atomically.';
create index plaza_daily_votes_count_idx on app_private.plaza_daily_votes(question_id,option_id);
create table app_private.plaza_daily_receipts (
  wallet_digest bytea not null references app_private.app_wallets(token_digest) on delete cascade,
  question_id uuid not null references public.plaza_daily_questions(id) on delete cascade,
  primary key(wallet_digest,question_id)
);
comment on table app_private.plaza_daily_receipts is 'Participation only: prevents duplicate submissions; never records chosen option or vote ID.';

create table app_private.plaza_weekly_participants (
  week_start date not null check (extract(isodow from week_start)=1),
  wallet_digest bytea not null references app_private.app_wallets(token_digest) on delete cascade,
  primary key(week_start,wallet_digest)
);
comment on table app_private.plaza_weekly_participants is 'One participant per week for weekly participation. Does not record content, action type or precise time.';

-- Store moderation history automatically; do not expose pending ideas publicly.
create or replace function app_private.sanitize_plaza_idea()
returns trigger language plpgsql set search_path='' as $$
begin
  new.body_redacted := app_private.redact_basic_pii(new.body_redacted);
  if tg_op='INSERT' and new.status <> 'pending' then
    raise exception 'Ideas must enter moderation before publication';
  end if;
  if new.status='published' then new.published_on := coalesce(new.published_on,current_date); end if;
  return new;
end $$;
create trigger plaza_idea_sanitize before insert or update on public.plaza_ideas
for each row execute function app_private.sanitize_plaza_idea();

create or replace function app_private.log_plaza_moderation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    insert into app_private.plaza_moderation_events(idea_id,new_status,moderator_id)
    values(new.id,new.status,null);
  elsif new.status is distinct from old.status then
    insert into app_private.plaza_moderation_events(idea_id,previous_status,new_status,moderator_id)
    values(new.id,old.status,new.status,
      (select p.user_id from public.user_profiles p where p.user_id=auth.uid()));
  end if;
  return new;
end $$;
create trigger plaza_moderation_audit after insert or update on public.plaza_ideas
for each row execute function app_private.log_plaza_moderation();

create or replace function app_private.sanitize_moderation_reason()
returns trigger language plpgsql set search_path='' as $$
begin new.reason_redacted := app_private.redact_basic_pii(new.reason_redacted); return new; end $$;
create trigger moderation_reason_sanitize before insert or update on app_private.plaza_moderation_events
for each row execute function app_private.sanitize_moderation_reason();
create trigger worker_preferences_touch before update on app_private.worker_preferences
for each row execute function app_private.touch_updated_at();

-- Existing reward API keeps its signature. Inserts now reserve stock atomically.
alter table public.rewards
  add column stock_remaining integer check (stock_remaining >= 0),
  add column available_from date,
  add column available_until date,
  add column code_valid_days integer check (code_valid_days between 1 and 3650),
  add constraint reward_availability_dates check (available_until is null or available_from is null or available_until >= available_from);
comment on column public.rewards.stock_remaining is 'NULL means unlimited. Non-null stock is reserved by the redemption insert trigger.';
alter table app_private.reward_redemptions
  add column status text not null default 'issued' check (status in ('issued','consumed','expired')),
  add column expires_on date,
  add column consumed_at timestamptz,
  add column consumed_by uuid references public.user_profiles(user_id) on delete restrict,
  add column request_id uuid unique,
  add constraint reward_expiry_dates check (expires_on is null or expires_on >= redeemed_on),
  add constraint redemption_consumption_state check (
    (status='consumed' and consumed_at is not null and consumed_by is not null)
    or (status<>'consumed' and consumed_at is null and consumed_by is null)
  );
create index reward_codes_expiry_idx on app_private.reward_redemptions(expires_on) where status='issued';

create or replace function app_private.reserve_reward_stock()
returns trigger language plpgsql set search_path='' as $$
declare r record;
begin
  select * into r from public.rewards where id=new.reward_id for update;
  if not found or not r.active or (r.available_from is not null and r.available_from>current_date)
    or (r.available_until is not null and r.available_until<current_date) then raise exception 'reward_unavailable'; end if;
  if r.stock_remaining=0 then raise exception 'reward_out_of_stock'; end if;
  if new.cost<>r.cost then raise exception 'reward_cost_changed'; end if;
  if new.status<>'issued' then raise exception 'invalid_redemption_status'; end if;
  if r.stock_remaining is not null then update public.rewards set stock_remaining=stock_remaining-1 where id=r.id; end if;
  if r.code_valid_days is not null then new.expires_on := current_date+r.code_valid_days; end if;
  return new;
end $$;
create trigger reward_stock_reservation before insert on app_private.reward_redemptions
for each row execute function app_private.reserve_reward_stock();

create or replace function public.consume_reward_code(p_code text,p_operator uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r record;
begin
  if not exists(select 1 from public.user_profiles where user_id=p_operator and app_role='hr_admin') then
    raise exception 'unauthorized_operator';
  end if;
  select * into r from app_private.reward_redemptions where code=p_code for update;
  if not found then raise exception 'unknown_code'; end if;
  if r.status<>'issued' then raise exception 'code_not_available'; end if;
  if r.expires_on<current_date then raise exception 'code_expired'; end if;
  update app_private.reward_redemptions set status='consumed',consumed_at=now(),consumed_by=p_operator where id=r.id;
  return r.id;
end $$;
comment on function public.consume_reward_code(text,uuid) is 'Trusted backend only: caller must authenticate the HR operator; consumes a code once under row lock.';

-- Least privilege: anonymous readers see only published ideas and active categories.
alter table public.plaza_categories enable row level security;
alter table public.plaza_ideas enable row level security;
alter table public.plaza_daily_questions enable row level security;
alter table public.plaza_daily_options enable row level security;
alter table app_private.worker_preferences enable row level security;
alter table app_private.plaza_moderation_events enable row level security;
alter table app_private.plaza_daily_votes enable row level security;
alter table app_private.plaza_daily_receipts enable row level security;
alter table app_private.plaza_weekly_participants enable row level security;
create policy plaza_categories_read on public.plaza_categories for select to anon,authenticated using(active);
create policy plaza_ideas_read on public.plaza_ideas for select to anon,authenticated using(status='published');
create policy plaza_ideas_hr_read on public.plaza_ideas for select to authenticated using(app_private.is_hr());
create policy plaza_ideas_hr_update on public.plaza_ideas for update to authenticated using(app_private.is_hr()) with check(app_private.is_hr());
create policy plaza_questions_read on public.plaza_daily_questions for select to anon,authenticated using(status<>'draft');
create policy plaza_questions_hr_read on public.plaza_daily_questions for select to authenticated using(app_private.is_hr());
create policy plaza_options_read on public.plaza_daily_options for select to anon,authenticated using(exists(select 1 from public.plaza_daily_questions q where q.id=question_id));
grant select on public.plaza_categories,public.plaza_ideas,public.plaza_daily_questions,public.plaza_daily_options to anon,authenticated;
grant update on public.plaza_ideas to authenticated;
grant all on public.plaza_categories,public.plaza_ideas,public.plaza_daily_questions,public.plaza_daily_options to service_role;
grant all on app_private.worker_preferences,app_private.plaza_moderation_events,app_private.plaza_daily_votes,app_private.plaza_daily_receipts,app_private.plaza_weekly_participants to service_role;
revoke all on function public.consume_reward_code(text,uuid) from public,anon,authenticated;
grant execute on function public.consume_reward_code(text,uuid) to service_role;
revoke all on function app_private.sanitize_plaza_idea(),app_private.log_plaza_moderation(),app_private.sanitize_moderation_reason(),app_private.reserve_reward_stock() from public,anon,authenticated;

insert into app_private.schema_migrations(version) values('20261108100000_plaza_preferences_reward_operations');
commit;
