-- Les enquestes creades en un sol idioma (p. ex. castellà) mostraven `q1`, `q2`… a l'app del treballador
-- quan el treballador tenia un altre idioma: només es buscava el seu idioma i el català.
-- Ara s'agafa la traducció del seu idioma, si no la catalana i, si no, la que hi hagi.
begin;

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
           coalesce(qt.title, c.name) as title,
           qt.introduction,
           qt.transparency_notice
    from app_private.pending_assignments(v_person) p
    join public.campaigns c on c.id = p.campaign_id
    join public.questionnaire_versions qv on qv.id = p.questionnaire_version_id
    left join lateral (
      select x.title, x.introduction, x.transparency_notice from public.questionnaire_translations x
      where x.questionnaire_version_id = qv.id
      order by (x.locale = v_locale) desc, (x.locale = 'ca') desc, x.locale limit 1
    ) qt on true
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
                 'prompt', coalesce(t.prompt, q.stable_key),
                 'help', t.help_text,
                 'options', coalesce(t.options, '[]'::jsonb),
                 'dimension', wd.label_ca
               ) order by q.position)
        from public.questions q
        left join lateral (
          select x.prompt, x.help_text, x.options from public.question_translations x
          where x.question_id = q.id
          order by (x.locale = v_locale) desc, (x.locale = 'ca') desc, x.locale limit 1
        ) t on true
        left join public.wellbeing_dimensions wd on wd.id = q.dimension_id
        where q.questionnaire_version_id = r.qv_id), '[]'::jsonb)
    ));
  end loop;

  return app_private.wallet_state(v_person, v_locale) || jsonb_build_object('surveys', v_surveys);
end;
$$;

insert into app_private.schema_migrations(version) values('20261108210000_app_survey_any_locale');
commit;
