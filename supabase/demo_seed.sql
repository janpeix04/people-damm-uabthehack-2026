-- Dades sintètiques de demo per a la pàgina d'inici de RRHH (es pot executar tantes vegades com calgui).
--   1. daily_moods dels darrers 30 dies (inclòs avui): alimenta clima, participació, respostes i mapa d'emocions.
--      Només s'omplen els dies que encara no tenen cap resposta, així que tornar-lo a executar un altre dia
--      afegeix els dies que falten sense duplicar ni esborrar respostes reals.
--   2. Tres campanyes obertes amb audiència i respostes, amb els mateixos identificadors, preguntes i xifres
--      que els formularis de la pàgina d'Anàlisi (seguretat-industrial, onboarding-talent, conciliacio-oficines).
-- Ús: npm run db:demo
begin;

select setseed(0.4242);

-- ===== 1. Estat d'ànim diari =====
-- Relat de la demo: Fàbrica baixa a poc a poc (torns i descansos), Logística empitjora els darrers 10 dies
-- (pics de càrrega, sobretot divendres), Comercial i Oficina es mantenen bé. Un 5% tria «sense especificar
-- departament» i va a Altres, com fa l'app.
with days as (
  select d::date as day, ((now() at time zone 'Europe/Madrid')::date - d::date) as ago
  from generate_series((now() at time zone 'Europe/Madrid')::date - 29, (now() at time zone 'Europe/Madrid')::date, interval '1 day') d
  where not exists (select 1 from public.daily_moods m where m.day = d::date)
), params as materialized (
  -- els random() van a la llista de columnes d'una CTE materialitzada perquè es calculin per persona i dia
  -- (com a filtre, el planificador els avaluava un sol cop per parell dia–departament)
  select random() as r_answer, random() as r_other, random() + random() - 1 as r_noise,
    dy.day, dy.ago, extract(isodow from dy.day)::int as dow, p.site_id, p.department_id, d.code,
    -- probabilitat de respondre aquell dia
    case d.code when 'fabrica' then .40 when 'logistica' then .36 when 'comercial' then .46 else .55 end
      * case when extract(isodow from dy.day) >= 6 then case when d.code in ('fabrica','logistica') then .75 else .5 end else 1 end as p_answer,
    -- careta mitjana (1-5) segons el departament i el dia
    case d.code
      when 'fabrica' then 3.55 - .45 * (1 - dy.ago / 29.0)
      when 'logistica' then case when dy.ago <= 10 then 2.95 else 3.45 end - case when extract(isodow from dy.day) = 5 then .3 else 0 end
      when 'comercial' then 4.0 + case when extract(isodow from dy.day) = 5 then .15 else 0 end
      else 3.9 - case when extract(isodow from dy.day) = 1 then .2 else 0 end
    end as mean
  from days dy
  cross join public.synthetic_people p
  join public.departments d on d.id = p.department_id
  where p.active
)
insert into public.daily_moods(day, site_id, department_id, mood)
select day, site_id,
  case when r_other < .05 then (select id from public.departments where code = 'others') else department_id end,
  greatest(1, least(5, round(mean + r_noise * 1.6)))::smallint
from params
where r_answer < p_answer;

-- ===== 2. Campanyes obertes (les mateixes que mostra Anàlisi) =====
insert into public.campaigns (
  slug, name, objective, context, prohibited_topics, status, target_filter, max_duration_seconds,
  privacy_threshold, target_population, opens_at, closes_at, created_by, approved_by, approved_by_label, approved_at, published_at
)
select v.slug, v.name, v.objective, v.context, array['rendiment individual','salut diagnosticada'], 'published', v.tf::jsonb, v.secs,
  10, 0, v.opens::timestamptz, v.closes::timestamptz,
  '00000000-0000-4000-a000-000000000001'::uuid, '00000000-0000-4000-a000-000000000001'::uuid,
  'Direcció de People & ESG (RRHH)', v.opens::timestamptz - interval '2 days', v.opens::timestamptz
from (values
  ('seguretat-industrial', 'Seguretat i Prevenció de Riscos a Planta',
   'Auditoria de seguretat, EPIs, climatització i protocols operatius.',
   'Diagnòstic de condicions ergonòmiques, equips de protecció i detecció de riscos.',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","manteniment"],"channels":["qr","app","teams"],"locale":"ca","dimensions":{"q1":"Seguretat","q2":"EPIs","q3":"Prevenció","q4":"Condicions","q5":"Riscos"}}}',
   53, '2026-10-20 08:00+02', '2026-11-15 23:00+01'),
  ('onboarding-talent', 'Experiència d’Acollida i Onboarding',
   'Acompanyament i valoració de les incorporacions dels darrers mesos.',
   'Enquesta breu als nous membres sobre rebuda, tutorització i recursos inicials.',
   '{"hr":{"zones":["envasat","logistica","coccio","oficines","comercial"],"channels":["app","teams","email","qr"],"locale":"ca","dimensions":{"q1":"Acollida","q2":"Formació","q3":"Acompanyament","q4":"Recursos","q5":"Feedback"}}}',
   55, '2026-10-15 08:00+02', '2026-11-30 23:00+01'),
  ('conciliacio-oficines', 'Flexibilitat, Eines Digitals i Oficines',
   'Mesurar la conciliació en el model híbrid i la reducció de reunions.',
   'Enquesta enfocada a la seu central, finances, màrqueting, IT i equips comercials.',
   '{"hr":{"zones":["oficines","comercial"],"channels":["teams","email","app"],"locale":"ca","dimensions":{"q1":"Flexibilitat","q2":"Reunions","q3":"Eines","q4":"Reconeixement","q5":"Propostes"}}}',
   57, '2026-10-25 08:00+02', '2026-11-18 23:00+01')
) as v(slug, name, objective, context, tf, secs, opens, closes)
on conflict (slug) do nothing;

insert into public.questionnaire_versions (campaign_id, version, status, estimated_seconds, generated_by_ai, generation_rationale, approved_by, approved_by_label, approved_at)
select c.id, 1, 'published', c.max_duration_seconds, true,
  'Preguntes breus adaptades als canals mòbil, QR i Teams; revisades per una persona de RRHH.',
  '00000000-0000-4000-a000-000000000001'::uuid, 'Direcció de People & ESG (RRHH)', c.approved_at
from public.campaigns c
where c.slug in ('seguretat-industrial', 'onboarding-talent', 'conciliacio-oficines')
on conflict (campaign_id, version) do nothing;

insert into public.questionnaire_translations (questionnaire_version_id, locale, title, introduction, closing_message, transparency_notice)
select qv.id, 'ca', c.name, c.context, 'Gràcies per participar.', 'Respostes anònimes; resultats agregats amb un mínim de 10 persones.'
from public.questionnaire_versions qv join public.campaigns c on c.id = qv.campaign_id
where c.slug in ('seguretat-industrial', 'onboarding-talent', 'conciliacio-oficines')
on conflict (questionnaire_version_id, locale) do nothing;

-- preguntes amb la mateixa correspondència de tipus que createSurvey (faces → escala 1-5, sí/no i llista → opció única)
create temp table demo_questions(slug text, pos smallint, qtype public.question_type, smin smallint, smax smallint, prompt text, options jsonb) on commit drop;
insert into demo_questions values
  ('seguretat-industrial', 1, 'scale', 0, 10, 'Del 0 al 10, com de segura consideres la teva línia o estació de feina?', '[]'),
  ('seguretat-industrial', 2, 'single_choice', null, null, 'Disposes dels EPIs necessaris, nets i homologats en tot moment?', '["Sempre disponibles","Gairebé sempre","De vegades en falten","Freqüentment falten"]'),
  ('seguretat-industrial', 3, 'single_choice', null, null, 'Has rebut formació pràctica de prevenció en els darrers 6 mesos?', '["Sí","No","No ho sé"]'),
  ('seguretat-industrial', 4, 'scale', 1, 5, 'Com valores les condicions de temperatura, soroll i ventilació a la zona?', '[]'),
  ('seguretat-industrial', 5, 'open_text', null, null, 'Has detectat algun risc ergonòmic, punts cecs o incidències pendents?', '[]'),
  ('onboarding-talent', 1, 'scale', 1, 5, 'Com valores la teva experiència d’acollida durant el primer mes?', '[]'),
  ('onboarding-talent', 2, 'scale', 0, 10, 'Del 0 al 10, la formació tècnica rebuda ha estat clara i suficient?', '[]'),
  ('onboarding-talent', 3, 'single_choice', null, null, 'El suport del teu tutor/a o companys de línia ha estat constant?', '["Constant i excel·lent","Puntual però útil","Poc present","He hagut d’espavilar-me sol"]'),
  ('onboarding-talent', 4, 'single_choice', null, null, 'Tens accés a totes les eines, armariets i aplicacions necessàries?', '["Sí","No","No ho sé"]'),
  ('onboarding-talent', 5, 'open_text', null, null, 'Què trobes a faltar o què simplificaries del procés d’onboarding?', '[]'),
  ('conciliacio-oficines', 1, 'scale', 0, 10, 'Del 0 al 10, com valores la flexibilitat d’horaris i teletreball?', '[]'),
  ('conciliacio-oficines', 2, 'scale', 1, 5, 'El volum de reunions diari et permet concentrar-te en tasques clau?', '[]'),
  ('conciliacio-oficines', 3, 'single_choice', null, null, 'Les eines col·laboratives i digitals funcionen de manera àgil?', '["Molt àgils","Correctes","De vegades lentes","Presents problemes greus"]'),
  ('conciliacio-oficines', 4, 'scale', 0, 10, 'Del 0 al 10, sents que la teva feina i esforç són valorats?', '[]'),
  ('conciliacio-oficines', 5, 'open_text', null, null, 'Quina millora operativa o de benestar proposaries per a oficines?', '[]');

insert into public.questions (questionnaire_version_id, stable_key, position, question_type, required, scale_min, scale_max)
select qv.id, 'q' || dq.pos, dq.pos, dq.qtype, dq.qtype <> 'open_text', dq.smin, dq.smax
from demo_questions dq
join public.campaigns c on c.slug = dq.slug
join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.version = 1
on conflict (questionnaire_version_id, stable_key) do nothing;

insert into public.question_translations (question_id, locale, prompt, options)
select q.id, 'ca', dq.prompt, dq.options
from demo_questions dq
join public.campaigns c on c.slug = dq.slug
join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.version = 1
join public.questions q on q.questionnaire_version_id = qv.id and q.position = dq.pos
on conflict (question_id, locale) do nothing;

-- audiència i qui ja ha respost (mateixes xifres de respostes que Anàlisi)
create temp table demo_audience on commit drop as
select c.id as campaign_id, c.slug, c.opens_at, p.*, d.collective,
  row_number() over (partition by c.id order by md5(c.slug || p.synthetic_code)) as rn,
  case c.slug when 'seguretat-industrial' then 245 when 'onboarding-talent' then 112 else 164 end as answered
from public.campaigns c
join public.synthetic_people p on p.active
join public.departments d on d.id = p.department_id
where not exists (select 1 from app_private.worker_accounts wa where wa.synthetic_person_id = p.id) -- els comptes demo hi entren a la secció 3, sense resposta
  and ((c.slug = 'seguretat-industrial' and d.code = 'fabrica')
   or (c.slug = 'onboarding-talent' and p.tenure_band = '<1')
   or (c.slug = 'conciliacio-oficines' and d.code in ('oficina', 'comercial')));

insert into public.audience_assignments (campaign_id, synthetic_person_id, channel, locale, status, access_token_digest, invited_at, responded_at)
select a.campaign_id, a.id, a.preferred_channel, a.preferred_locale,
  case when a.rn <= a.answered then 'responded'::public.assignment_status else 'invited'::public.assignment_status end,
  case when a.rn <= a.answered then null else extensions.digest('demo-' || a.slug || '-' || a.synthetic_code || '-2026', 'sha256') end,
  a.opens_at + interval '1 hour',
  case when a.rn <= a.answered
    then a.opens_at + (now() - interval '1 hour' - a.opens_at) * power(a.rn::numeric / a.answered, 1.4)
  end
from demo_audience a
on conflict (campaign_id, synthetic_person_id) do nothing;

update public.campaigns c set target_population = (select count(*) from public.audience_assignments a where a.campaign_id = c.id)
where c.slug in ('seguretat-industrial', 'onboarding-talent', 'conciliacio-oficines');

insert into public.survey_responses (campaign_id, questionnaire_version_id, submitted_at, period_start, channel, locale, department_id, collective,
  shift, manager_level, age_band, tenure_band, duration_seconds, session_nonce, site_id, synthetic)
select a.campaign_id, qv.id, aa.responded_at, a.opens_at::date, a.preferred_channel, a.preferred_locale, a.department_id, a.collective,
  a.shift, a.manager_level, a.age_band, a.tenure_band, 35 + (a.rn * 13 % 70)::int, md5(a.campaign_id::text || a.id::text)::uuid, a.site_id, true
from demo_audience a
join public.questionnaire_versions qv on qv.campaign_id = a.campaign_id and qv.version = 1
join public.audience_assignments aa on aa.campaign_id = a.campaign_id and aa.synthetic_person_id = a.id and aa.status = 'responded'
on conflict (session_nonce) do nothing;

-- respostes: biaix per torn i col·lectiu perquè els gràfics expliquin alguna cosa (nit i Logística pitjor)
create temp table demo_resp on commit drop as
select r.id, r.campaign_id, q.id as question_id, q.position, q.question_type, q.scale_min, q.scale_max, qt.options,
  (case r.shift when 'night' then -.18 when 'afternoon' then -.06 when 'route' then -.1 else 0 end
   + case r.collective when 'logistica' then -.12 when 'oficines' then .06 else 0 end
   + (random() + random() - 1) * .55) as bias
from public.survey_responses r
join public.campaigns c on c.id = r.campaign_id and c.slug in ('seguretat-industrial', 'onboarding-talent', 'conciliacio-oficines')
join public.questions q on q.questionnaire_version_id = r.questionnaire_version_id
join public.question_translations qt on qt.question_id = q.id and qt.locale = 'ca'
where not exists (select 1 from public.response_answers x where x.response_id = r.id);

insert into public.response_answers (response_id, question_id, numeric_value)
select id, question_id,
  greatest(scale_min, least(scale_max, round(scale_min + (scale_max - scale_min) * (.68 + bias))))
from demo_resp where question_type = 'scale';

-- opció única: posició esbiaixada cap a les primeres opcions (les positives)
insert into public.response_answers (response_id, question_id, choice_value)
select id, question_id,
  options -> (greatest(0, least(jsonb_array_length(options) - 1,
    floor((.32 - bias) * jsonb_array_length(options) * case when jsonb_array_length(options) = 3 then .8 else 1 end))))::int
from demo_resp where question_type = 'single_choice';

insert into public.response_answers (response_id, question_id, free_text_redacted)
select r.id, r.question_id, t.comment
from (
  select dr.id, dr.question_id, c.slug, random() as pick, random() as keep
  from demo_resp dr join public.campaigns c on c.id = dr.campaign_id
  where dr.question_type = 'open_text'
) r
join (values
  ('seguretat-industrial', 0, 'Al moll de càrrega hi ha un punt cec amb les carretilles quan es creua el pas de vianants.'),
  ('seguretat-industrial', 1, 'A la zona d’envasat fa molta calor a la tarda; caldria revisar la ventilació.'),
  ('seguretat-industrial', 2, 'Les ulleres de protecció de recanvi s’acaben ràpid al torn de nit.'),
  ('onboarding-talent', 0, 'Una explicació curta al començar el torn ajudaria molt als que acabem d’entrar.'),
  ('onboarding-talent', 1, 'El tutor va estar molt pendent, però costa tenir accés a totes les aplicacions el primer dia.'),
  ('conciliacio-oficines', 0, 'Menys reunions de seguiment i més temps per concentrar-se.'),
  ('conciliacio-oficines', 1, 'Les eines de videoconferència van lentes a les sales petites.'),
  ('conciliacio-oficines', 2, 'Valoro molt la flexibilitat; agrairia un dia fix sense reunions.')
) as t(slug, variant, comment)
  on t.slug = r.slug
 and t.variant = floor(r.pick * case r.slug when 'onboarding-talent' then 2 else 3 end)::int
where r.keep < .55;

-- ===== 3. Treballador demo: rep totes les enquestes publicades =====
-- (una persona només pot tenir un departament; així el compte demo veu qualsevol enquesta des de la web)
insert into public.audience_assignments (campaign_id, synthetic_person_id, channel, locale, status, invited_at)
select c.id, a.synthetic_person_id, 'web', 'ca', 'invited', now()
from public.campaigns c
cross join app_private.worker_accounts a
join auth.users u on u.id = a.user_id
where c.status = 'published' and (u.email like '%@demo' or u.email like '%@demo.damm.invalid')
on conflict (campaign_id, synthetic_person_id) do nothing;

-- ===== 4. Saldo inicial de 150 punts per als comptes de treballador demo =====
insert into app_private.point_grants (synthetic_person_id, reason, points)
select a.synthetic_person_id, 'demo', 150
from app_private.worker_accounts a join auth.users u on u.id = a.user_id
where u.email like '%@demo' or u.email like '%@demo.damm.invalid'
on conflict (synthetic_person_id, reason) do nothing;

commit;

-- resum
select 'daily_moods' as taula, count(*) as files, min(day)::text as des_de, max(day)::text as fins_a from public.daily_moods
union all
select c.slug, (select count(*) from public.survey_responses r where r.campaign_id = c.id), c.opens_at::date::text, c.closes_at::date::text
from public.campaigns c where c.status = 'published' order by 1;
