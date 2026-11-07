-- Damm Pulse IA - privacy-first people listening data model (PostgreSQL / Supabase compatible).
-- All workforce and response data in this demo is 100% synthetic.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists app_private;

-- Standalone PostgreSQL compatibility shims for Supabase Auth & Roles
create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

create table if not exists auth.users (
  id uuid primary key default extensions.gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create type public.app_role as enum ('hr_admin', 'hr_analyst', 'manager', 'integration');
create type public.campaign_status as enum ('draft', 'review', 'approved', 'published', 'closed', 'archived');
create type public.questionnaire_status as enum ('draft', 'approved', 'published', 'retired');
create type public.question_type as enum ('scale', 'single_choice', 'multi_choice', 'boolean', 'open_text');
create type public.channel_type as enum ('mobile_qr', 'teams', 'email', 'web');
create type public.assignment_status as enum ('eligible', 'invited', 'opened', 'responded', 'expired', 'suppressed');
create type public.analysis_status as enum ('queued', 'running', 'ready_for_review', 'approved', 'failed');
create type public.action_status as enum ('proposed', 'in_review', 'approved', 'in_progress', 'implemented', 'measuring', 'dismissed');
create type public.integration_provider as enum ('microsoft_teams', 'microsoft_graph', 'outlook', 'typeform', 'n8n');
create type public.delivery_status as enum ('queued', 'sent', 'delivered', 'failed', 'cancelled');

create table public.sites (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null unique,
  location text not null,
  site_type_ca text not null,
  site_category text not null check (site_category in ('factory', 'warehouse', 'field', 'office')),
  default_collective text not null check (default_collective in ('fabriques', 'logistica', 'comercial', 'oficines')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sites is 'Official Damm Group production, logistics, malting, water, dairy, coffee and corporate sites used for synthetic segmentation.';

create table public.departments (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name_ca text not null,
  name_es text not null,
  name_en text not null,
  collective text not null check (collective in ('fabriques', 'logistica', 'comercial', 'oficines')),
  site_type text not null check (site_type in ('factory', 'warehouse', 'field', 'office')),
  parent_id uuid references public.departments(id) on delete restrict,
  synthetic_headcount integer not null check (synthetic_headcount >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_role public.app_role not null,
  department_id uuid references public.departments(id) on delete set null,
  display_label text not null default 'Usuari',
  preferred_locale text not null default 'ca' check (preferred_locale in ('ca', 'es', 'en')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manager_department_required check (app_role <> 'manager' or department_id is not null)
);

comment on table public.user_profiles is 'Authorization profile. Roles are stored in the database, never in user-editable user_metadata.';

create table public.wellbeing_dimensions (
  id smallint generated always as identity primary key,
  code text not null unique,
  label_ca text not null,
  label_es text not null,
  label_en text not null,
  description_ca text not null,
  display_order smallint not null unique check (display_order > 0)
);

create table public.synthetic_people (
  id uuid primary key default extensions.gen_random_uuid(),
  synthetic_code text not null unique check (synthetic_code ~ '^SYN-[0-9]{4}$'),
  department_id uuid not null references public.departments(id) on delete restrict,
  site_id uuid references public.sites(id) on delete restrict,
  site text not null,
  site_location text,
  site_type_ca text,
  role_family text not null,
  role_title text,
  shift text not null check (shift in ('morning', 'afternoon', 'night', 'split', 'flexible', 'route')),
  manager_level text not null check (manager_level in ('individual', 'team_lead', 'manager', 'director')),
  work_mode text not null check (work_mode in ('onsite', 'field', 'hybrid', 'office')),
  preferred_locale text not null check (preferred_locale in ('ca', 'es', 'en')),
  preferred_channel public.channel_type not null,
  age_band text not null check (age_band in ('18-29', '30-39', '40-49', '50+')),
  tenure_band text not null check (tenure_band in ('<1', '1-3', '4-9', '10+')),
  birth_date date not null check (birth_date between date '1959-01-01' and date '2008-12-31'),
  gender text not null check (gender in ('woman', 'man', 'non_binary', 'not_disclosed')),
  hire_date date not null check (
    hire_date >= (birth_date + interval '18 years')::date
    and hire_date <= date '2026-11-07'
  ),
  active boolean not null default true,
  is_synthetic boolean not null default true check (is_synthetic),
  created_at timestamptz not null default now()
);

comment on table public.synthetic_people is 'Demo-only synthetic directory. It deliberately contains no real names, emails, phone numbers or real Damm employee identifiers.';

create table public.campaigns (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  objective text not null,
  context text,
  prohibited_topics text[] not null default '{}',
  status public.campaign_status not null default 'draft',
  target_filter jsonb not null default '{}'::jsonb check (jsonb_typeof(target_filter) = 'object'),
  max_duration_seconds integer not null default 120 check (max_duration_seconds between 30 and 300),
  privacy_threshold integer not null default 10 check (privacy_threshold between 5 and 50),
  target_population integer not null default 0 check (target_population >= 0),
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.user_profiles(user_id) on delete set null,
  approved_by uuid references public.user_profiles(user_id) on delete set null,
  approved_by_label text,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_dates_valid check (closes_at is null or opens_at is null or closes_at > opens_at),
  constraint campaign_human_approval check (
    status in ('draft', 'review')
    or ((approved_by is not null or nullif(btrim(approved_by_label), '') is not null) and approved_at is not null)
  )
);

create table public.questionnaire_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  version integer not null check (version > 0),
  status public.questionnaire_status not null default 'draft',
  estimated_seconds integer not null check (estimated_seconds between 15 and 300),
  generated_by_ai boolean not null default false,
  generation_rationale text,
  approved_by uuid references public.user_profiles(user_id) on delete set null,
  approved_by_label text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, version),
  constraint questionnaire_human_approval check (
    status = 'draft'
    or ((approved_by is not null or nullif(btrim(approved_by_label), '') is not null) and approved_at is not null)
  )
);

create unique index one_published_questionnaire_per_campaign
  on public.questionnaire_versions(campaign_id) where status = 'published';

create table public.questionnaire_translations (
  questionnaire_version_id uuid not null references public.questionnaire_versions(id) on delete cascade,
  locale text not null check (locale in ('ca', 'es', 'en')),
  title text not null,
  introduction text not null,
  closing_message text not null,
  transparency_notice text not null,
  primary key (questionnaire_version_id, locale)
);

create table public.questions (
  id uuid primary key default extensions.gen_random_uuid(),
  questionnaire_version_id uuid not null references public.questionnaire_versions(id) on delete cascade,
  dimension_id smallint references public.wellbeing_dimensions(id) on delete restrict,
  stable_key text not null,
  position smallint not null check (position > 0),
  question_type public.question_type not null,
  required boolean not null default true,
  scale_min smallint,
  scale_max smallint,
  conditional_logic jsonb not null default '{}'::jsonb check (jsonb_typeof(conditional_logic) = 'object'),
  created_at timestamptz not null default now(),
  unique (questionnaire_version_id, stable_key),
  unique (questionnaire_version_id, position),
  constraint scale_bounds_valid check (
    (question_type = 'scale' and scale_min is not null and scale_max is not null and scale_min < scale_max)
    or (question_type <> 'scale' and scale_min is null and scale_max is null)
  )
);

create table public.question_translations (
  question_id uuid not null references public.questions(id) on delete cascade,
  locale text not null check (locale in ('ca', 'es', 'en')),
  prompt text not null,
  help_text text,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  primary key (question_id, locale)
);

create table public.audience_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  synthetic_person_id uuid not null references public.synthetic_people(id) on delete cascade,
  channel public.channel_type not null,
  locale text not null check (locale in ('ca', 'es', 'en')),
  status public.assignment_status not null default 'eligible',
  access_token_digest bytea unique,
  invited_at timestamptz,
  opened_at timestamptz,
  responded_at timestamptz,
  reminder_count smallint not null default 0 check (reminder_count between 0 and 10),
  last_reminder_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, synthetic_person_id),
  constraint response_state_valid check (status <> 'responded' or responded_at is not null)
);

comment on column public.audience_assignments.access_token_digest is 'One-time SHA-256 token digest. Cleared after submission so the response cannot be joined back to a directory record.';

create table public.survey_responses (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  questionnaire_version_id uuid not null references public.questionnaire_versions(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  period_start date not null,
  channel public.channel_type not null,
  locale text not null check (locale in ('ca', 'es', 'en')),
  department_id uuid not null references public.departments(id) on delete restrict,
  collective text not null check (collective in ('fabriques', 'logistica', 'comercial', 'oficines')),
  shift text not null,
  manager_level text not null,
  age_band text not null,
  tenure_band text not null,
  duration_seconds integer check (duration_seconds between 1 and 1800),
  session_nonce uuid not null default extensions.gen_random_uuid() unique,
  pii_redaction_count smallint not null default 0 check (pii_redaction_count >= 0),
  consent_version text not null default '2026-11',
  synthetic boolean not null default true check (synthetic)
);

comment on table public.survey_responses is 'Pseudonymised cohort snapshot. No FK or durable identifier links a response to synthetic_people or audience_assignments.';

create table public.response_answers (
  id bigint generated always as identity primary key,
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  numeric_value numeric(5,2),
  choice_value jsonb,
  free_text_redacted text,
  created_at timestamptz not null default now(),
  unique (response_id, question_id),
  constraint one_answer_shape check (num_nonnulls(numeric_value, choice_value, free_text_redacted) = 1)
);

create table public.analysis_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  status public.analysis_status not null default 'queued',
  model_provider text not null,
  model_name text not null,
  prompt_version text not null,
  sample_size integer not null default 0 check (sample_size >= 0),
  coverage_ratio numeric(5,4) check (coverage_ratio between 0 and 1),
  confidence_label text check (confidence_label in ('low', 'medium', 'high')),
  executive_summary text,
  limitations text[] not null default '{}',
  input_fingerprint text not null,
  requested_by uuid references public.user_profiles(user_id) on delete set null,
  reviewed_by uuid references public.user_profiles(user_id) on delete set null,
  reviewed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, input_fingerprint)
);

create table public.analytics_segments (
  id uuid primary key default extensions.gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  department_id uuid references public.departments(id) on delete restrict,
  dimension_id smallint references public.wellbeing_dimensions(id) on delete restrict,
  period_start date not null,
  segment_key jsonb not null default '{}'::jsonb check (jsonb_typeof(segment_key) = 'object'),
  sample_size integer not null check (sample_size >= 10),
  target_size integer check (target_size >= sample_size),
  participation_rate numeric(5,4) check (participation_rate between 0 and 1),
  average_score numeric(4,2) check (average_score between 0 and 10),
  previous_score numeric(4,2) check (previous_score between 0 and 10),
  sentiment_score numeric(5,4) check (sentiment_score between -1 and 1),
  confidence_label text not null check (confidence_label in ('low', 'medium', 'high')),
  suppressed boolean not null default false check (not suppressed),
  created_at timestamptz not null default now(),
  unique nulls not distinct (analysis_run_id, department_id, dimension_id, period_start, segment_key)
);

comment on table public.analytics_segments is 'Only publishable aggregate segments. A trigger enforces each campaign privacy threshold in addition to the absolute k >= 10 check.';

create table public.analysis_insights (
  id uuid primary key default extensions.gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  department_id uuid references public.departments(id) on delete restrict,
  dimension_id smallint references public.wellbeing_dimensions(id) on delete restrict,
  title text not null,
  summary text not null,
  signal_type text not null check (signal_type in ('strength', 'risk', 'emerging', 'representation_gap', 'change')),
  priority smallint not null check (priority between 1 and 5),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  sample_size integer not null check (sample_size >= 10),
  human_validated boolean not null default false,
  validated_by uuid references public.user_profiles(user_id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint insight_validation_valid check (not human_validated or (validated_by is not null and validated_at is not null))
);

create table public.action_recommendations (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  insight_id uuid references public.analysis_insights(id) on delete set null,
  department_id uuid references public.departments(id) on delete restrict,
  dimension_id smallint references public.wellbeing_dimensions(id) on delete restrict,
  title text not null,
  problem_statement text not null,
  proposed_action text not null,
  action_type text not null check (action_type in ('process_change', 'manager_conversation', 'training', 'meeting', 'email', 'teams_message', 'workplace_improvement', 'follow_up_survey')),
  owner_role text not null,
  due_date date,
  kpi text not null,
  status public.action_status not null default 'proposed',
  generated_by_ai boolean not null default true,
  requires_human_approval boolean not null default true check (requires_human_approval),
  approved_by uuid references public.user_profiles(user_id) on delete set null,
  approved_by_label text,
  approved_at timestamptz,
  implemented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_human_approval check (
    status in ('proposed', 'in_review', 'dismissed')
    or ((approved_by is not null or nullif(btrim(approved_by_label), '') is not null) and approved_at is not null)
  )
);

create table public.integration_connections (
  id uuid primary key default extensions.gen_random_uuid(),
  provider public.integration_provider not null,
  name text not null,
  status text not null check (status in ('demo', 'connected', 'paused', 'error')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  secret_reference text,
  created_by uuid references public.user_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, name),
  constraint no_inline_secrets check (
    configuration ?| array['token', 'secret', 'password', 'api_key', 'client_secret'] = false
  )
);

comment on column public.integration_connections.secret_reference is 'Reference to an environment variable or secret manager entry; never the secret value.';

create table public.action_executions (
  id uuid primary key default extensions.gen_random_uuid(),
  action_id uuid not null references public.action_recommendations(id) on delete cascade,
  integration_connection_id uuid references public.integration_connections(id) on delete set null,
  status public.delivery_status not null default 'queued',
  payload_preview jsonb not null default '{}'::jsonb check (jsonb_typeof(payload_preview) = 'object'),
  requested_by uuid not null references public.user_profiles(user_id) on delete restrict,
  approved_by uuid references public.user_profiles(user_id) on delete restrict,
  approved_at timestamptz,
  external_reference text,
  error_summary text,
  requested_at timestamptz not null default now(),
  executed_at timestamptz,
  constraint execution_human_approval check (status in ('queued', 'cancelled') or (approved_by is not null and approved_at is not null))
);

create table public.integration_events (
  id bigint generated always as identity primary key,
  integration_connection_id uuid references public.integration_connections(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_type text not null,
  status public.delivery_status not null,
  correlation_id uuid not null default extensions.gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  error_summary text,
  occurred_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_type text not null check (actor_type in ('user', 'participant', 'integration', 'system')),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  request_id uuid not null default extensions.gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index people_site_dept_idx on public.synthetic_people(site_id, department_id);
create index responses_campaign_period_idx on public.survey_responses(campaign_id, period_start, department_id);
create index answers_response_idx on public.response_answers(response_id);
create index assignments_campaign_status_idx on public.audience_assignments(campaign_id, status, channel);
create index analysis_runs_campaign_idx on public.analysis_runs(campaign_id, created_at desc);
create index analytics_campaign_period_idx on public.analytics_segments(campaign_id, period_start, department_id);
create index insights_campaign_priority_idx on public.analysis_insights(campaign_id, priority desc);
create index actions_campaign_status_idx on public.action_recommendations(campaign_id, status);
create index audit_entity_idx on public.audit_events(entity_type, entity_id, occurred_at desc);

create or replace function app_private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.app_role
  from public.user_profiles p
  where p.user_id = (select auth.uid())
    and p.active;
$$;

create or replace function app_private.current_department_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.department_id
  from public.user_profiles p
  where p.user_id = (select auth.uid())
    and p.active;
$$;

create or replace function app_private.is_hr()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_app_role() in ('hr_admin', 'hr_analyst'), false);
$$;

create or replace function app_private.is_hr_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_app_role() = 'hr_admin', false);
$$;

create or replace function app_private.can_view_department(p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app_private.is_hr()
    or (
      app_private.current_app_role() = 'manager'
      and app_private.current_department_id() = p_department_id
    ),
    false
  );
$$;

create or replace function app_private.redact_basic_pii(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(
      coalesce(p_value, ''),
      '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
      '[correu eliminat]',
      'gi'
    ),
    '(\+?[0-9][0-9 .()-]{7,}[0-9])',
    '[telèfon eliminat]',
    'g'
  );
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sites_touch before update on public.sites for each row execute function app_private.touch_updated_at();
create trigger departments_touch before update on public.departments for each row execute function app_private.touch_updated_at();
create trigger profiles_touch before update on public.user_profiles for each row execute function app_private.touch_updated_at();
create trigger campaigns_touch before update on public.campaigns for each row execute function app_private.touch_updated_at();
create trigger questionnaire_touch before update on public.questionnaire_versions for each row execute function app_private.touch_updated_at();
create trigger actions_touch before update on public.action_recommendations for each row execute function app_private.touch_updated_at();
create trigger integrations_touch before update on public.integration_connections for each row execute function app_private.touch_updated_at();

create or replace function app_private.enforce_segment_privacy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  required_k integer;
begin
  select c.privacy_threshold into required_k
  from public.campaigns c
  where c.id = new.campaign_id;

  if required_k is null then
    raise exception 'Campaign not found';
  end if;
  if new.sample_size < required_k then
    raise exception 'Segment sample size % is below campaign privacy threshold %', new.sample_size, required_k;
  end if;
  return new;
end;
$$;

create trigger analytics_segments_privacy
before insert or update on public.analytics_segments
for each row execute function app_private.enforce_segment_privacy();

create or replace function public.submit_survey_response(
  p_access_token text,
  p_answers jsonb,
  p_locale text default 'ca',
  p_channel public.channel_type default 'web',
  p_duration_seconds integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignment_record record;
  questionnaire_id uuid;
  v_response_id uuid;
  redactions integer;
begin
  if p_access_token is null or length(p_access_token) < 16 then
    raise exception 'Invalid access token';
  end if;
  if p_locale not in ('ca', 'es', 'en') then
    raise exception 'Unsupported locale';
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) = 0 or jsonb_array_length(p_answers) > 12 then
    raise exception 'Answers must be a non-empty array with at most 12 items';
  end if;

  select aa.id as assignment_id, aa.campaign_id, sp.department_id, d.collective,
         sp.shift, sp.manager_level, sp.age_band, sp.tenure_band
    into assignment_record
  from public.audience_assignments aa
  join public.synthetic_people sp on sp.id = aa.synthetic_person_id
  join public.departments d on d.id = sp.department_id
  join public.campaigns c on c.id = aa.campaign_id
  where aa.access_token_digest = extensions.digest(p_access_token, 'sha256')
    and aa.status in ('eligible', 'invited', 'opened')
    and c.status = 'published'
    and (c.opens_at is null or c.opens_at <= now())
    and (c.closes_at is null or c.closes_at > now())
  for update of aa;

  if not found then
    raise exception 'Token is invalid, already used or campaign is closed';
  end if;

  select qv.id into questionnaire_id
  from public.questionnaire_versions qv
  where qv.campaign_id = assignment_record.campaign_id
    and qv.status = 'published';

  if questionnaire_id is null then
    raise exception 'No published questionnaire';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as supplied(question_id uuid, numeric_value numeric, choice_value jsonb, free_text text)
    where not exists (
      select 1 from public.questions q
      where q.id = supplied.question_id
        and q.questionnaire_version_id = questionnaire_id
    )
  ) then
    raise exception 'Answer contains a question outside the published questionnaire';
  end if;

  select count(*)::integer into redactions
  from jsonb_to_recordset(p_answers) as supplied(question_id uuid, numeric_value numeric, choice_value jsonb, free_text text)
  where supplied.free_text is not null
    and app_private.redact_basic_pii(supplied.free_text) <> supplied.free_text;

  insert into public.survey_responses (
    campaign_id, questionnaire_version_id, period_start, channel, locale,
    department_id, collective, shift, manager_level, age_band, tenure_band,
    duration_seconds, pii_redaction_count
  ) values (
    assignment_record.campaign_id, questionnaire_id, date_trunc('month', now())::date,
    p_channel, p_locale, assignment_record.department_id, assignment_record.collective,
    assignment_record.shift, assignment_record.manager_level, assignment_record.age_band,
    assignment_record.tenure_band, p_duration_seconds, redactions
  ) returning id into v_response_id;

  insert into public.response_answers (response_id, question_id, numeric_value, choice_value, free_text_redacted)
  select v_response_id,
         supplied.question_id,
         supplied.numeric_value,
         supplied.choice_value,
         case when supplied.free_text is null then null else app_private.redact_basic_pii(supplied.free_text) end
  from jsonb_to_recordset(p_answers) as supplied(question_id uuid, numeric_value numeric, choice_value jsonb, free_text text)
  where num_nonnulls(supplied.numeric_value, supplied.choice_value, supplied.free_text) = 1;

  if (select count(*) from public.response_answers ra where ra.response_id = v_response_id) <> jsonb_array_length(p_answers) then
    raise exception 'Each answer must contain exactly one value';
  end if;

  update public.audience_assignments
  set status = 'responded', responded_at = now(), access_token_digest = null
  where id = assignment_record.assignment_id;

  insert into public.audit_events(actor_type, action, entity_type, entity_id, metadata)
  values ('participant', 'response.submitted', 'survey_response', v_response_id::text,
          jsonb_build_object('campaign_id', assignment_record.campaign_id, 'redactions', redactions));

  return v_response_id;
end;
$$;

create view public.campaign_overview
with (security_invoker = true)
as
select c.id, c.slug, c.name, c.status, c.opens_at, c.closes_at,
       c.target_population, c.privacy_threshold,
       coalesce(max(ar.sample_size), 0) as latest_sample_size,
       max(ar.coverage_ratio) as latest_coverage_ratio,
       max(ar.completed_at) as latest_analysis_at
from public.campaigns c
left join public.analysis_runs ar on ar.campaign_id = c.id and ar.status in ('ready_for_review', 'approved')
group by c.id;

create view public.safe_segment_metrics
with (security_invoker = true)
as
select s.id, s.analysis_run_id, s.campaign_id, s.department_id, d.code as department_code,
       d.name_ca as department_name_ca, s.dimension_id, wd.code as dimension_code,
       s.period_start, s.segment_key, s.sample_size, s.target_size,
       s.participation_rate, s.average_score, s.previous_score,
       case when s.previous_score is null then null else s.average_score - s.previous_score end as score_delta,
       s.sentiment_score, s.confidence_label
from public.analytics_segments s
left join public.departments d on d.id = s.department_id
left join public.wellbeing_dimensions wd on wd.id = s.dimension_id
join public.campaigns c on c.id = s.campaign_id
where s.sample_size >= c.privacy_threshold;

create view public.action_board
with (security_invoker = true)
as
select a.id, a.campaign_id, a.department_id, d.code as department_code,
       a.dimension_id, wd.code as dimension_code, a.title, a.problem_statement,
       a.proposed_action, a.action_type, a.owner_role, a.due_date, a.kpi,
       a.status, a.generated_by_ai, a.approved_at, a.implemented_at, a.created_at
from public.action_recommendations a
left join public.departments d on d.id = a.department_id
left join public.wellbeing_dimensions wd on wd.id = a.dimension_id;

alter table public.sites enable row level security;
alter table public.departments enable row level security;
alter table public.user_profiles enable row level security;
alter table public.wellbeing_dimensions enable row level security;
alter table public.synthetic_people enable row level security;
alter table public.campaigns enable row level security;
alter table public.questionnaire_versions enable row level security;
alter table public.questionnaire_translations enable row level security;
alter table public.questions enable row level security;
alter table public.question_translations enable row level security;
alter table public.audience_assignments enable row level security;
alter table public.survey_responses enable row level security;
alter table public.response_answers enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analytics_segments enable row level security;
alter table public.analysis_insights enable row level security;
alter table public.action_recommendations enable row level security;
alter table public.integration_connections enable row level security;
alter table public.action_executions enable row level security;
alter table public.integration_events enable row level security;
alter table public.audit_events enable row level security;

create policy sites_read on public.sites for select to authenticated using (true);
create policy departments_read on public.departments for select to authenticated using (true);
create policy dimensions_read on public.wellbeing_dimensions for select to authenticated using (true);
create policy own_profile_read on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id or app_private.is_hr());
create policy hr_directory_read on public.synthetic_people for select to authenticated using (app_private.is_hr());
create policy hr_campaign_read on public.campaigns for select to authenticated
  using (app_private.is_hr() or app_private.current_app_role() = 'manager');
create policy hr_campaign_insert on public.campaigns for insert to authenticated
  with check (app_private.is_hr());
create policy hr_campaign_update on public.campaigns for update to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy campaign_questionnaire_read on public.questionnaire_versions for select to authenticated
  using (app_private.is_hr() or app_private.current_app_role() = 'manager');
create policy hr_questionnaire_write on public.questionnaire_versions for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy questionnaire_translation_read on public.questionnaire_translations for select to authenticated using (true);
create policy hr_questionnaire_translation_write on public.questionnaire_translations for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy questions_read on public.questions for select to authenticated using (true);
create policy hr_questions_write on public.questions for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy question_translations_read on public.question_translations for select to authenticated using (true);
create policy hr_question_translations_write on public.question_translations for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy hr_assignments_read on public.audience_assignments for select to authenticated using (app_private.is_hr());
create policy hr_assignments_write on public.audience_assignments for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy analysis_runs_read on public.analysis_runs for select to authenticated
  using (app_private.is_hr() or app_private.current_app_role() = 'manager');
create policy hr_analysis_runs_write on public.analysis_runs for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy segments_read on public.analytics_segments for select to authenticated
  using (department_id is null and app_private.is_hr() or app_private.can_view_department(department_id));
create policy hr_segments_write on public.analytics_segments for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy insights_read on public.analysis_insights for select to authenticated
  using (department_id is null and app_private.is_hr() or app_private.can_view_department(department_id));
create policy hr_insights_write on public.analysis_insights for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy actions_read on public.action_recommendations for select to authenticated
  using (department_id is null and app_private.is_hr() or app_private.can_view_department(department_id));
create policy hr_actions_write on public.action_recommendations for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy hr_integrations_all on public.integration_connections for all to authenticated
  using (app_private.is_hr_admin()) with check (app_private.is_hr_admin());
create policy hr_executions_read on public.action_executions for select to authenticated using (app_private.is_hr());
create policy hr_executions_write on public.action_executions for all to authenticated
  using (app_private.is_hr()) with check (app_private.is_hr());
create policy hr_integration_events_read on public.integration_events for select to authenticated using (app_private.is_hr());
create policy hr_audit_read on public.audit_events for select to authenticated using (app_private.is_hr_admin());

revoke all on table public.sites, public.departments, public.user_profiles, public.wellbeing_dimensions,
  public.synthetic_people, public.campaigns, public.questionnaire_versions,
  public.questionnaire_translations, public.questions, public.question_translations,
  public.audience_assignments, public.survey_responses, public.response_answers,
  public.analysis_runs, public.analytics_segments, public.analysis_insights,
  public.action_recommendations, public.integration_connections,
  public.action_executions, public.integration_events, public.audit_events
from anon, authenticated;

grant select on table public.sites, public.departments, public.user_profiles, public.wellbeing_dimensions,
  public.synthetic_people, public.campaigns, public.questionnaire_versions,
  public.questionnaire_translations, public.questions, public.question_translations,
  public.audience_assignments, public.analysis_runs, public.analytics_segments,
  public.analysis_insights, public.action_recommendations, public.integration_connections,
  public.action_executions, public.integration_events, public.audit_events
to authenticated;

grant insert, update, delete on table public.campaigns, public.questionnaire_versions,
  public.questionnaire_translations, public.questions, public.question_translations,
  public.audience_assignments, public.analysis_runs, public.analytics_segments,
  public.analysis_insights, public.action_recommendations, public.integration_connections,
  public.action_executions
to authenticated;

grant select on table public.campaign_overview, public.safe_segment_metrics, public.action_board to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_app_role(), app_private.current_department_id(),
  app_private.is_hr(), app_private.is_hr_admin(), app_private.can_view_department(uuid)
to authenticated;
grant execute on function public.submit_survey_response(text, jsonb, text, public.channel_type, integer)
to anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant usage on schema app_private to service_role;
grant execute on all functions in schema app_private to service_role;
