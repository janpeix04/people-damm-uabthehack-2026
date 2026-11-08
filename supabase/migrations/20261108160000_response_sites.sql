begin;
-- Centre de treball a cada resposta anònima, amb la mateixa granularitat que el departament.
-- No és un identificador: diversos centres tenen desenes de persones per departament, i qualsevol
-- agregat per centre + departament es suprimeix per sota del llindar de privacitat de la campanya (mínim 10).
alter table public.survey_responses add column site_id uuid references public.sites(id) on delete restrict;
comment on column public.survey_responses.site_id is 'Workplace cohort of the respondent (same granularity as department). Site+department aggregates are suppressed below the campaign privacy threshold.';

-- Respostes sintètiques del seed: el seed genera session_nonce = md5(campanya || persona sintètica),
-- així que es pot recuperar el centre un sol cop. Les respostes noves el reben de submit_survey_response().
update public.survey_responses r set site_id = p.site_id
from public.synthetic_people p
where r.site_id is null and r.synthetic and r.session_nonce = md5(r.campaign_id::text || p.id::text)::uuid;

create index responses_site_period_idx on public.survey_responses(site_id, period_start, department_id);

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
         sp.shift, sp.manager_level, sp.age_band, sp.tenure_band, sp.site_id
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
    duration_seconds, pii_redaction_count, site_id
  ) values (
    assignment_record.campaign_id, questionnaire_id, date_trunc('month', now())::date,
    p_channel, p_locale, assignment_record.department_id, assignment_record.collective,
    assignment_record.shift, assignment_record.manager_level, assignment_record.age_band,
    assignment_record.tenure_band, p_duration_seconds, redactions, assignment_record.site_id
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

insert into app_private.schema_migrations(version) values('20261108160000_response_sites');
commit;
