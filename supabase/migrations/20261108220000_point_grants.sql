-- Punts atorgats fora de les enquestes (p. ex. el saldo inicial del compte demo).
-- El saldo continua sent: enquestes respostes × punts per enquesta + punts atorgats − recompenses bescanviades.
-- També s'agafa el títol de les enquestes respostes en qualsevol idioma disponible, com a app_wallet_open.
begin;

create table app_private.point_grants (
  synthetic_person_id uuid not null references public.synthetic_people(id) on delete cascade,
  reason text not null check (length(btrim(reason)) between 1 and 80),
  points integer not null check (points between -10000 and 10000),
  granted_at timestamptz not null default now(),
  primary key (synthetic_person_id, reason)
);
alter table app_private.point_grants enable row level security;
comment on table app_private.point_grants is 'Manual point adjustments per synthetic person (e.g. demo starting balance). One row per reason.';

create or replace function app_private.wallet_state(p_person uuid, p_locale text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with answered as (
    select c.slug, coalesce(qt.title, c.name) as title
    from public.audience_assignments aa
    join public.campaigns c on c.id = aa.campaign_id
    left join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.status = 'published'
    left join lateral (
      select x.title from public.questionnaire_translations x where x.questionnaire_version_id = qv.id
      order by (x.locale = p_locale) desc, (x.locale = 'ca') desc, x.locale limit 1
    ) qt on true
    where aa.synthetic_person_id = p_person and aa.status = 'responded'
  ), granted as (
    select coalesce(sum(g.points), 0)::integer as total
    from app_private.point_grants g where g.synthetic_person_id = p_person
  ), spent as (
    select coalesce(sum(r.cost), 0)::integer as total
    from app_private.reward_redemptions r where r.synthetic_person_id = p_person
  )
  select jsonb_build_object(
    'points', (select count(*) from answered)::integer * app_private.points_per_survey() + (select total from granted) - (select total from spent),
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

insert into app_private.schema_migrations(version) values('20261108220000_point_grants');
commit;
