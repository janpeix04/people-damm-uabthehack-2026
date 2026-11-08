begin;

do $$
declare
  v_campaign_id uuid;
  v_analysis_id uuid;
  segment_was_accepted boolean := false;
begin
  select c.id into v_campaign_id from public.campaigns c where c.slug in ('seguretat-industrial', 'pols-novembre') order by c.created_at desc limit 1;
  select ar.id into v_analysis_id from public.analysis_runs ar where ar.campaign_id = v_campaign_id limit 1;

  if v_campaign_id is null then
    raise exception 'Seed campaign is missing';
  end if;

  -- Check all 14 Sites exist
  if (select count(*) from public.sites) <> 14 then
    raise exception 'Expected 14 Damm sites, found %', (select count(*) from public.sites);
  end if;

  -- Works both before and after the four-department consolidation.
  if (select count(distinct collective) from public.departments) <> 4 then
    raise exception 'Expected 4 collectives in departments';
  end if;

  if (select count(distinct site_id) from public.synthetic_people) <> 14 then
    raise exception 'Synthetic employees do not cover all 14 sites';
  end if;

  begin
    insert into public.analytics_segments (
      analysis_run_id, campaign_id, period_start, sample_size, confidence_label
    ) values (v_analysis_id, v_campaign_id, date '2026-11-01', 9, 'low');
    segment_was_accepted := true;
  exception
    when check_violation or raise_exception then null;
  end;

  if segment_was_accepted then
    raise exception 'Privacy invariant failed: a segment below k was accepted';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'survey_responses'
      and column_name in ('synthetic_person_id', 'assignment_id', 'email', 'name', 'phone')
  ) then
    raise exception 'Response table contains a direct identity link';
  end if;

  if exists (
    select 1 from public.safe_segment_metrics sm
    join public.campaigns c on c.id = sm.campaign_id
    where sm.sample_size < c.privacy_threshold
  ) then
    raise exception 'Safe aggregate view exposed a suppressed segment';
  end if;

  if app_private.redact_basic_pii('Contacta prova@example.com o +34 600 123 123') ~ 'prova@example.com|600 123 123' then
    raise exception 'Basic PII redaction failed';
  end if;

  if exists (
    select 1
    from public.synthetic_people
    where site = ''
       or site_id is null
       or birth_date is null
       or gender is null
       or hire_date is null
       or hire_date < (birth_date + interval '18 years')::date
       or hire_date > date '2026-11-07'
  ) then
    raise exception 'Synthetic directory contains incomplete or incoherent demographic data';
  end if;
end;
$$;

rollback;
