-- App del treballador: monedero anònim, enquestes pendents, enviament no rastrejable i recompenses.
--
-- Model de privacitat
--  * El dispositiu genera un token aleatori (monedero). Només se'n guarda el SHA-256.
--    En aquesta demo el monedero s'associa a una persona sintètica (substitut del SSO real)
--    per saber a quines campanyes està convidada.
--  * La participació es registra a audience_assignments (status = 'responded'): és el que
--    impedeix que la mateixa persona contesti dues vegades la mateixa enquesta.
--  * Les respostes van a survey_responses via submit_survey_response(), que no guarda cap
--    vincle amb la persona i esborra el token d'un sol ús.
--  * Per evitar l'enllaç per temps, la marca de participació (responded_at) i la resposta
--    (submitted_at) es guarden truncades al dia: no hi ha cap hora exacta compartida.
--  * Els punts només depenen de QUANTES enquestes s'han contestat, mai del contingut.

create table app_private.app_wallets (
  token_digest bytea primary key,
  synthetic_person_id uuid not null unique references public.synthetic_people(id) on delete cascade,
  created_on date not null default current_date
);

comment on table app_private.app_wallets is
  'Demo-only: SHA-256 of an anonymous device token bound to a synthetic person (stand-in for SSO). Never joined to survey_responses.';

create table public.rewards (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null,
  description text not null,
  cost integer not null check (cost > 0),
  tint text not null,
  ink text not null,
  icon text not null,
  position smallint not null unique check (position > 0),
  active boolean not null default true
);

create table app_private.reward_redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  synthetic_person_id uuid not null references public.synthetic_people(id) on delete cascade,
  reward_id text not null references public.rewards(id) on delete restrict,
  cost integer not null check (cost > 0),
  code text not null unique,
  redeemed_on date not null default current_date
);

alter table public.rewards enable row level security;
create policy rewards_read on public.rewards for select to anon, authenticated using (active);
revoke all on table public.rewards from anon, authenticated;
grant select on table public.rewards to anon, authenticated;
grant all on table public.rewards to service_role;
grant all on table app_private.app_wallets, app_private.reward_redemptions to service_role;

insert into public.rewards (id, name, description, cost, tint, ink, icon, position) values
  ('cafe', 'Cafè gratuït', 'Cafè o infusió a la cafeteria de la teva planta.', 50, '#FEF0DC', '#B45309', 'M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3', 1),
  ('snack', 'Snack saludable', 'Fruita seca, barreta o fruita de temporada.', 60, '#EEF6DD', '#4D7C0F', 'M12 7c-3-3-8-1-8 4 0 6 4 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 6-4 6-10 0-5-5-7-8-4zM12 7c0-2 1-4 3-5', 2),
  ('beguda', 'Beguda sense alcohol', 'Refresc, aigua amb gas o cervesa 0,0.', 80, '#E0F0FB', '#1D4ED8', 'M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3zM8 13h8', 3),
  ('solidari', 'Donació solidària', 'Convertim punts en una donació a una entitat local.', 100, '#E3F4F1', '#0F766E', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z', 4),
  ('esmorzar', 'Esmorzar complet', 'Entrepà i beguda a la cafeteria.', 150, '#E6F6EE', '#15803D', 'M3 11a9 5 0 0 1 18 0zM3 11h18l-1 3H4zM5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3', 5),
  ('visita', 'Visita a l’antiga fàbrica', 'Visita guiada per a tu i un acompanyant.', 300, '#FDE3E6', '#A50D26', 'M2 20V9l6 4V9l6 4V5h4l2 15zM2 20h20', 6)
on conflict (id) do nothing;

create or replace function app_private.points_per_survey()
returns integer language sql immutable as $$ select 50 $$;

-- Campanyes que una persona encara pot contestar ara mateix.
create or replace function app_private.pending_assignments(p_person uuid)
returns table (assignment_id uuid, campaign_id uuid, questionnaire_version_id uuid)
language sql
stable
set search_path = ''
as $$
  select aa.id, c.id, qv.id
  from public.audience_assignments aa
  join public.campaigns c on c.id = aa.campaign_id
  join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.status = 'published'
  where aa.synthetic_person_id = p_person
    and aa.status in ('eligible', 'invited', 'opened')
    and c.status = 'published'
    and (c.opens_at is null or c.opens_at <= now())
    and (c.closes_at is null or c.closes_at > now())
  order by c.closes_at nulls last, c.slug;
$$;

-- Resol (i opcionalment crea) el monedero del dispositiu.
create or replace function app_private.wallet_person(p_wallet text, p_create boolean)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_digest bytea;
  v_person uuid;
begin
  if p_wallet is null or p_wallet !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_wallet';
  end if;
  v_digest := extensions.digest(p_wallet, 'sha256');

  select w.synthetic_person_id into v_person from app_private.app_wallets w where w.token_digest = v_digest;
  if found then
    return v_person;
  end if;
  if not p_create then
    raise exception 'unknown_wallet';
  end if;

  -- Persona sintètica lliure, prioritzant les que tenen enquestes pendents.
  select sp.id into v_person
  from public.synthetic_people sp
  where not exists (select 1 from app_private.app_wallets w where w.synthetic_person_id = sp.id)
  order by exists (select 1 from app_private.pending_assignments(sp.id)) desc, random()
  limit 1
  for update of sp skip locked;

  if v_person is null then
    raise exception 'no_people_available';
  end if;

  insert into app_private.app_wallets (token_digest, synthetic_person_id)
  values (v_digest, v_person)
  on conflict (token_digest) do nothing;

  select w.synthetic_person_id into v_person from app_private.app_wallets w where w.token_digest = v_digest;
  return v_person;
end;
$$;

-- Saldo, enquestes contestades, codis i catàleg.
create or replace function app_private.wallet_state(p_person uuid, p_locale text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with answered as (
    select c.slug, coalesce(qt.title, qt_ca.title, c.name) as title
    from public.audience_assignments aa
    join public.campaigns c on c.id = aa.campaign_id
    left join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.status = 'published'
    left join public.questionnaire_translations qt on qt.questionnaire_version_id = qv.id and qt.locale = p_locale
    left join public.questionnaire_translations qt_ca on qt_ca.questionnaire_version_id = qv.id and qt_ca.locale = 'ca'
    where aa.synthetic_person_id = p_person and aa.status = 'responded'
  ), spent as (
    select coalesce(sum(r.cost), 0)::integer as total
    from app_private.reward_redemptions r where r.synthetic_person_id = p_person
  )
  select jsonb_build_object(
    'points', (select count(*) from answered)::integer * app_private.points_per_survey() - (select total from spent),
    'points_per_survey', app_private.points_per_survey(),
    'answered', coalesce((select jsonb_agg(jsonb_build_object('id', a.slug, 'title', a.title) order by a.slug) from answered a), '[]'::jsonb),
    'redeemed', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.reward_id, 'name', rw.name, 'code', r.code) order by r.redeemed_on desc, r.code)
      from app_private.reward_redemptions r join public.rewards rw on rw.id = r.reward_id
      where r.synthetic_person_id = p_person), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object('id', rw.id, 'name', rw.name, 'description', rw.description, 'cost', rw.cost,
                                          'tint', rw.tint, 'ink', rw.ink, 'icon', rw.icon) order by rw.position)
      from public.rewards rw where rw.active), '[]'::jsonb)
  );
$$;

-- Obre el monedero i retorna les enquestes pendents amb un token d'un sol ús nou per a cadascuna.
create or replace function public.app_wallet_open(p_wallet text, p_locale text default 'ca')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid;
  v_locale text := case when p_locale in ('ca', 'es', 'en') then p_locale else 'ca' end;
  v_surveys jsonb := '[]'::jsonb;
  v_token text;
  r record;
begin
  v_person := app_private.wallet_person(p_wallet, true);

  for r in
    select p.assignment_id, c.id as campaign_id, c.slug, c.name, c.opens_at, c.closes_at,
           qv.id as qv_id, qv.estimated_seconds,
           coalesce(qt.title, qt_ca.title, c.name) as title,
           coalesce(qt.introduction, qt_ca.introduction) as introduction,
           coalesce(qt.transparency_notice, qt_ca.transparency_notice) as transparency_notice
    from app_private.pending_assignments(v_person) p
    join public.campaigns c on c.id = p.campaign_id
    join public.questionnaire_versions qv on qv.id = p.questionnaire_version_id
    left join public.questionnaire_translations qt on qt.questionnaire_version_id = qv.id and qt.locale = v_locale
    left join public.questionnaire_translations qt_ca on qt_ca.questionnaire_version_id = qv.id and qt_ca.locale = 'ca'
  loop
    -- Token nou a cada obertura: l'anterior deixa de servir.
    v_token := encode(extensions.gen_random_bytes(24), 'hex');
    update public.audience_assignments
    set access_token_digest = extensions.digest(v_token, 'sha256')
    where id = r.assignment_id;

    v_surveys := v_surveys || jsonb_build_array(jsonb_build_object(
      'id', r.slug,
      'title', r.title,
      'introduction', r.introduction,
      'transparency_notice', r.transparency_notice,
      'opens_at', r.opens_at,
      'closes_at', r.closes_at,
      'estimated_seconds', r.estimated_seconds,
      'access_token', v_token,
      'questions', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', q.id,
                 'key', q.stable_key,
                 'type', q.question_type,
                 'required', q.required,
                 'min', q.scale_min,
                 'max', q.scale_max,
                 'prompt', coalesce(t.prompt, t_ca.prompt, q.stable_key),
                 'help', coalesce(t.help_text, t_ca.help_text),
                 'options', coalesce(t.options, t_ca.options, '[]'::jsonb),
                 'dimension', wd.label_ca
               ) order by q.position)
        from public.questions q
        left join public.question_translations t on t.question_id = q.id and t.locale = v_locale
        left join public.question_translations t_ca on t_ca.question_id = q.id and t_ca.locale = 'ca'
        left join public.wellbeing_dimensions wd on wd.id = q.dimension_id
        where q.questionnaire_version_id = r.qv_id), '[]'::jsonb)
    ));
  end loop;

  return app_private.wallet_state(v_person, v_locale) || jsonb_build_object('surveys', v_surveys);
end;
$$;

-- Envia una resposta anònima i registra la participació (sense poder-les enllaçar).
create or replace function public.app_submit_response(
  p_wallet text,
  p_survey text,
  p_access_token text,
  p_answers jsonb,
  p_locale text default 'ca',
  p_duration_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid;
  v_assignment record;
  v_response_id uuid;
  v_locale text := case when p_locale in ('ca', 'es', 'en') then p_locale else 'ca' end;
begin
  v_person := app_private.wallet_person(p_wallet, false);

  select aa.id, aa.status into v_assignment
  from public.audience_assignments aa
  join public.campaigns c on c.id = aa.campaign_id
  where aa.synthetic_person_id = v_person and c.slug = p_survey
  for update of aa;

  if not found then
    raise exception 'not_invited';
  end if;
  if v_assignment.status = 'responded' then
    raise exception 'already_answered';
  end if;
  if p_access_token is null
     or not exists (select 1 from public.audience_assignments aa
                    where aa.id = v_assignment.id
                      and aa.access_token_digest = extensions.digest(p_access_token, 'sha256')) then
    raise exception 'invalid_token';
  end if;

  v_response_id := public.submit_survey_response(
    p_access_token, p_answers, v_locale, 'web'::public.channel_type,
    case when p_duration_seconds between 1 and 1800 then p_duration_seconds end
  );

  -- Cap hora exacta compartida entre la resposta i la participació.
  update public.survey_responses set submitted_at = date_trunc('day', now()) where id = v_response_id;
  update public.audience_assignments set responded_at = date_trunc('day', now()) where id = v_assignment.id;

  return app_private.wallet_state(v_person, v_locale)
         || jsonb_build_object('earned', app_private.points_per_survey());
end;
$$;

-- Bescanvia una recompensa si hi ha prou saldo.
create or replace function public.app_redeem_reward(p_wallet text, p_reward text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid;
  v_reward record;
  v_points integer;
  v_code text;
begin
  v_person := app_private.wallet_person(p_wallet, false);
  perform pg_advisory_xact_lock(hashtext('wallet:' || v_person::text));

  select rw.id, rw.name, rw.cost into v_reward from public.rewards rw where rw.id = p_reward and rw.active;
  if not found then
    raise exception 'unknown_reward';
  end if;

  v_points := (app_private.wallet_state(v_person, 'ca') ->> 'points')::integer;
  if v_points < v_reward.cost then
    raise exception 'insufficient_points';
  end if;

  v_code := 'DP-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
  insert into app_private.reward_redemptions (synthetic_person_id, reward_id, cost, code)
  values (v_person, v_reward.id, v_reward.cost, v_code);

  return app_private.wallet_state(v_person, 'ca')
         || jsonb_build_object('code', v_code, 'reward_name', v_reward.name);
end;
$$;

revoke execute on function public.app_wallet_open(text, text),
  public.app_submit_response(text, text, text, jsonb, text, integer),
  public.app_redeem_reward(text, text)
from public, anon, authenticated;
revoke execute on function app_private.points_per_survey(), app_private.pending_assignments(uuid),
  app_private.wallet_person(text, boolean), app_private.wallet_state(uuid, text)
from public, anon, authenticated;
grant execute on function public.app_wallet_open(text, text),
  public.app_submit_response(text, text, text, jsonb, text, integer),
  public.app_redeem_reward(text, text)
to service_role;
