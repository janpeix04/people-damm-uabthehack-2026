-- Dades sintètiques de demo per a la plataforma Damm Pulse IA (idempotent: es pot executar tantes vegades com calgui).
-- 1. Elimina campanyes de test / obsoletes ('test', 'aadas', 'test conect', 'pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre').
-- 2. daily_moods dels darrers 30 dies (inclòs avui): alimenta clima, participació, respostes i mapa d'emocions.
-- 3. 5 campanyes oficials completes (pols-novembre, seguretat-industrial, torns, conciliacio-oficines, onboarding-talent) amb audiència i respostes per centre.
-- 4. Opinions reals de La Plaça (publicades amb likes per centre i pendents de moderació per a RRHH).
-- 5. Pregunta del dia a La Plaça amb opcions i vots anònims.
-- Ús: npm run db:demo

begin;

select setseed(0.4242);

-- ===== 0. Neteja d'enquestes de prova i duplicades antigues =====
delete from public.survey_responses where campaign_id in (
  select id from public.campaigns where slug in (
    'pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre',
    'enquesta-bf7a2870-3813-4562-9f5e-a38d0e646777',
    'enquesta-dbf52731-f110-4d23-b09c-eed75819e03a',
    'enquesta-2ef8747e-0219-4c2c-ba2f-9fef7093d8aa'
  ) or lower(name) in ('test', 'aadas', 'test conect')
);

delete from public.campaigns where slug in (
  'pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre',
  'enquesta-bf7a2870-3813-4562-9f5e-a38d0e646777',
  'enquesta-dbf52731-f110-4d23-b09c-eed75819e03a',
  'enquesta-2ef8747e-0219-4c2c-ba2f-9fef7093d8aa'
) or lower(name) in ('test', 'aadas', 'test conect');

-- ===== 1. Estat d'ànim diari =====
with days as (
  select d::date as day, ((now() at time zone 'Europe/Madrid')::date - d::date) as ago
  from generate_series((now() at time zone 'Europe/Madrid')::date - 29, (now() at time zone 'Europe/Madrid')::date, interval '1 day') d
  where not exists (select 1 from public.daily_moods m where m.day = d::date)
), params as materialized (
  select random() as r_answer, random() as r_other, random() + random() - 1 as r_noise,
    dy.day, dy.ago, extract(isodow from dy.day)::int as dow, p.site_id, p.department_id, d.code,
    case d.code when 'fabrica' then .40 when 'logistica' then .36 when 'comercial' then .46 else .55 end
      * case when extract(isodow from dy.day) >= 6 then case when d.code in ('fabrica','logistica') then .75 else .5 end else 1 end as p_answer,
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

-- ===== 2. Campanyes oficials =====
insert into public.campaigns (
  slug, name, objective, context, prohibited_topics, status, target_filter, max_duration_seconds,
  privacy_threshold, target_population, opens_at, closes_at, created_by, approved_by, approved_by_label, approved_at, published_at
)
select v.slug, v.name, v.objective, v.context, array['rendiment individual','salut diagnosticada'], 'published', v.tf::jsonb, v.secs,
  10, 0, v.opens::timestamptz, v.closes::timestamptz,
  '00000000-0000-4000-a000-000000000001'::uuid, '00000000-0000-4000-a000-000000000001'::uuid,
  'Direcció de People & ESG (RRHH)', v.opens::timestamptz - interval '2 days', v.opens::timestamptz
from (values
  ('pols-novembre', 'Pols mensual · Novembre 2026',
   'Seguiment periòdic del benestar, descans i comunicació a fàbriques i oficines.',
   'Enquesta periòdica general amb indicador de satisfacció, comunicació interna i suport.',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","oficines","comercial","manteniment"],"channels":["qr","app","teams","placa","world"],"locale":"ca","dimensions":{"q1":"Benestar","q2":"Descans","q3":"Comunicació","q4":"Lideratge","q5":"Cultura","q6":"Propostes"}}}',
   65, '2026-11-01 08:00+01', '2026-11-20 23:00+01'),
  ('seguretat-industrial', 'Seguretat i Prevenció de Riscos a Planta',
   'Auditoria de seguretat, EPIs, climatització i protocols operatius.',
   'Diagnòstic de condicions ergonòmiques, equips de protecció i detecció de riscos.',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","manteniment"],"channels":["qr","app","teams"],"locale":"ca","dimensions":{"q1":"Seguretat","q2":"EPIs","q3":"Prevenció","q4":"Condicions","q5":"Riscos"}}}',
   53, '2026-10-20 08:00+02', '2026-11-15 23:00+01'),
  ('torns', 'Torns, Descans i Conciliació a Planta',
   'Avaluar l’impacte dels torns rotatius de 8h i els temps de recuperació física.',
   'Enquesta centrada en les línies de producció i magatzem sobre calendaris i sobrecàrrega.',
   '{"hr":{"zones":["envasat","logistica","coccio"],"channels":["qr","app","teams","placa"],"locale":"ca","dimensions":{"q1":"Organització","q2":"Planificació","q3":"Equitat","q4":"Descans","q5":"Càrrega","q6":"Millores"}}}',
   58, '2026-11-04 08:00+01', '2026-11-25 23:00+01'),
  ('conciliacio-oficines', 'Flexibilitat, Eines Digitals i Oficines',
   'Mesurar la conciliació en el model híbrid i la reducció de reunions.',
   'Enquesta enfocada a la seu central, finances, màrqueting, IT i equips comercials.',
   '{"hr":{"zones":["oficines","comercial"],"channels":["teams","email","app"],"locale":"ca","dimensions":{"q1":"Flexibilitat","q2":"Reunions","q3":"Eines","q4":"Reconeixement","q5":"Propostes"}}}',
   57, '2026-10-25 08:00+02', '2026-11-18 23:00+01'),
  ('onboarding-talent', 'Experiència d’Acollida i Onboarding',
   'Acompanyament i valoració de les incorporacions dels darrers mesos.',
   'Enquesta breu als nous membres sobre rebuda, tutorització i recursos inicials.',
   '{"hr":{"zones":["envasat","logistica","coccio","oficines","comercial"],"channels":["app","teams","email","qr"],"locale":"ca","dimensions":{"q1":"Acollida","q2":"Formació","q3":"Acompanyament","q4":"Recursos","q5":"Feedback"}}}',
   55, '2026-10-15 08:00+02', '2026-11-30 23:00+01')
) as v(slug, name, objective, context, tf, secs, opens, closes)
on conflict (slug) do update set
  name = excluded.name, objective = excluded.objective, context = excluded.context,
  target_filter = excluded.target_filter, max_duration_seconds = excluded.max_duration_seconds,
  opens_at = excluded.opens_at, closes_at = excluded.closes_at;

insert into public.questionnaire_versions (campaign_id, version, status, estimated_seconds, generated_by_ai, generation_rationale, approved_by, approved_by_label, approved_at)
select c.id, 1, 'published', c.max_duration_seconds, true,
  'Preguntes breus adaptades als canals mòbil, QR i Teams; revisades per una persona de RRHH.',
  '00000000-0000-4000-a000-000000000001'::uuid, 'Direcció de People & ESG (RRHH)', c.approved_at
from public.campaigns c
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines')
on conflict (campaign_id, version) do update set status = 'published';

insert into public.questionnaire_translations (questionnaire_version_id, locale, title, introduction, closing_message, transparency_notice)
select qv.id, 'ca', c.name, c.context, 'Gràcies per participar.', 'Respostes anònimes; resultats agregats amb un mínim de 10 persones.'
from public.questionnaire_versions qv join public.campaigns c on c.id = qv.campaign_id
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines')
on conflict (questionnaire_version_id, locale) do update set title = excluded.title, introduction = excluded.introduction;

create temp table demo_questions(slug text, pos smallint, qtype public.question_type, smin smallint, smax smallint, prompt text, options jsonb) on commit drop;
insert into demo_questions values
  -- pols-novembre
  ('pols-novembre', 1, 'scale', 1, 5, 'Com et sents aquesta setmana a la feina?', '["Molt bé","Bé","Regular","Malament"]'),
  ('pols-novembre', 2, 'single_choice', null, null, 'Has pogut fer els descansos que necessitaves?', '["Sempre","Gairebé sempre","Poques vegades","Mai"]'),
  ('pols-novembre', 3, 'scale', 0, 10, 'Del 0 al 10, com valores la comunicació amb el teu equip?', '[]'),
  ('pols-novembre', 4, 'scale', 1, 5, 'Com valores el suport i confiança de la teva coordinació?', '["Molt bona","Bona","Millorable","Deficient"]'),
  ('pols-novembre', 5, 'single_choice', null, null, 'Recomanaries Damm com un bon lloc per treballar als teus coneguts?', '["Sí","No","No ho sé"]'),
  ('pols-novembre', 6, 'open_text', null, null, 'Hi ha alguna cosa concreta que milloraria el teu dia a dia?', '[]'),
  -- torns
  ('torns', 1, 'scale', 1, 5, 'Com valores l’adaptació al nou sistema de torns?', '["Molt fàcil","Fàcil","Dura","Molt dura"]'),
  ('torns', 2, 'single_choice', null, null, 'Amb quanta antelació coneixes els teus horaris de torn?', '["Més de 2 setmanes","1 setmana","Pocs dies","Sense previsió"]'),
  ('torns', 3, 'scale', 0, 10, 'Del 0 al 10, com de just trobes el repartiment de nits i caps de setmana?', '[]'),
  ('torns', 4, 'single_choice', null, null, 'El descans entre torns et permet desconnectar i recuperar-te completament?', '["Sí","No","No ho sé"]'),
  ('torns', 5, 'scale', 0, 10, 'Del 0 al 10, quin nivell d’esgotament físic notes en canvis de torn?', '[]'),
  ('torns', 6, 'open_text', null, null, 'Quina mesura específica sobre torns o pauses consideres més urgent?', '[]'),
  -- seguretat-industrial
  ('seguretat-industrial', 1, 'scale', 0, 10, 'Del 0 al 10, com de segura consideres la teva línia o estació de feina?', '[]'),
  ('seguretat-industrial', 2, 'single_choice', null, null, 'Disposes dels EPIs necessaris, nets i homologats en tot moment?', '["Sempre disponibles","Gairebé sempre","De vegades en falten","Freqüentment falten"]'),
  ('seguretat-industrial', 3, 'single_choice', null, null, 'Has rebut formació pràctica de prevenció en els darrers 6 mesos?', '["Sí","No","No ho sé"]'),
  ('seguretat-industrial', 4, 'scale', 1, 5, 'Com valores les condicions de temperatura, soroll i ventilació a la zona?', '[]'),
  ('seguretat-industrial', 5, 'open_text', null, null, 'Has detectat algun risc ergonòmic, punts cecs o incidències pendents?', '[]'),
  -- onboarding-talent
  ('onboarding-talent', 1, 'scale', 1, 5, 'Com valores la teva experiència d’acollida durant el primer mes?', '[]'),
  ('onboarding-talent', 2, 'scale', 0, 10, 'Del 0 al 10, la formació tècnica rebuda ha estat clara i suficient?', '[]'),
  ('onboarding-talent', 3, 'single_choice', null, null, 'El suport del teu tutor/a o companys de línia ha estat constant?', '["Constant i excel·lent","Puntual però útil","Poc present","He hagut d’espavilar-me sol"]'),
  ('onboarding-talent', 4, 'single_choice', null, null, 'Tens accés a totes les eines, armariets i aplicacions necessàries?', '["Sí","No","No ho sé"]'),
  ('onboarding-talent', 5, 'open_text', null, null, 'Què trobes a faltar o què simplificaries del procés d’onboarding?', '[]'),
  -- conciliacio-oficines
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
on conflict (question_id, locale) do update set prompt = excluded.prompt, options = excluded.options;

-- Audiència i respostes
create temp table demo_audience on commit drop as
select c.id as campaign_id, c.slug, c.opens_at, p.*, d.collective,
  row_number() over (partition by c.id order by md5(c.slug || p.synthetic_code)) as rn,
  case c.slug
    when 'seguretat-industrial' then 245
    when 'onboarding-talent' then 112
    when 'conciliacio-oficines' then 164
    when 'pols-novembre' then 349
    when 'torns' then 198
  end as answered
from public.campaigns c
cross join public.synthetic_people p
join public.departments d on d.id = p.department_id
where p.active
  and not exists (select 1 from app_private.worker_accounts wa where wa.synthetic_person_id = p.id)
  and ((c.slug = 'seguretat-industrial' and d.code in ('fabrica','envasat','coccio','malta','fermentacio','manteniment'))
   or (c.slug = 'onboarding-talent' and (p.tenure_band = '<1' or d.code in ('oficina','comercial','fabrica')))
   or (c.slug = 'conciliacio-oficines' and d.code in ('oficina', 'comercial', 'rrhh', 'data_ia_it'))
   or (c.slug = 'pols-novembre')
   or (c.slug = 'torns' and d.code in ('fabrica', 'logistica', 'envasat', 'coccio')));

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
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines');

insert into public.survey_responses (campaign_id, questionnaire_version_id, submitted_at, period_start, channel, locale, department_id, collective,
  shift, manager_level, age_band, tenure_band, duration_seconds, session_nonce, site_id, synthetic)
select a.campaign_id, qv.id, aa.responded_at, a.opens_at::date, a.preferred_channel, a.preferred_locale, a.department_id, a.collective,
  a.shift, a.manager_level, a.age_band, a.tenure_band, 35 + (a.rn * 13 % 70)::int, md5(a.campaign_id::text || a.id::text)::uuid, a.site_id, true
from demo_audience a
join public.questionnaire_versions qv on qv.campaign_id = a.campaign_id and qv.version = 1
join public.audience_assignments aa on aa.campaign_id = a.campaign_id and aa.synthetic_person_id = a.id and aa.status = 'responded'
on conflict (session_nonce) do nothing;

create temp table demo_resp on commit drop as
select r.id, r.campaign_id, q.id as question_id, q.position, q.question_type, q.scale_min, q.scale_max, qt.options,
  (case r.shift when 'night' then -.18 when 'afternoon' then -.06 when 'route' then -.1 else 0 end
   + case r.collective when 'logistica' then -.12 when 'oficines' then .06 else 0 end
   + (random() + random() - 1) * .55) as bias
from public.survey_responses r
join public.campaigns c on c.id = r.campaign_id and c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines')
join public.questions q on q.questionnaire_version_id = r.questionnaire_version_id
join public.question_translations qt on qt.question_id = q.id and qt.locale = 'ca'
where not exists (select 1 from public.response_answers x where x.response_id = r.id);

insert into public.response_answers (response_id, question_id, numeric_value)
select id, question_id,
  greatest(scale_min, least(scale_max, round(scale_min + (scale_max - scale_min) * (.68 + bias))))
from demo_resp where question_type = 'scale';

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
  ('conciliacio-oficines', 2, 'Valoro molt la flexibilitat; agrairia un dia fix sense reunions.'),
  ('pols-novembre', 0, 'Molt bon ambient a la línia 3, però la calor a migdia encara és notable.'),
  ('pols-novembre', 1, 'Els caps de torn escolten més que abans, bona iniciativa.'),
  ('pols-novembre', 2, 'La comunicació per l’app ha millorat moltíssim la previsió setmanal.'),
  ('torns', 0, 'Agrairia un calendari tancat de torns amb un mínim de 3 setmanes de vista.'),
  ('torns', 1, 'Les noves pauses escalonades han donat una mica d’aire a la línia d’envasat.'),
  ('torns', 2, 'El suport entre companys de línia compensa el ritme fort.')
) as t(slug, variant, comment)
  on t.slug = r.slug
 and t.variant = floor(r.pick * 3)::int
where r.keep < .6;

-- ===== 3. Treballador demo: rep totes les enquestes publicades =====
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

-- ===== 5. Opinions reals per a La Plaça (publicades i pendents) =====
delete from public.plaza_ideas;

insert into public.plaza_ideas (category_id, body_redacted, status, site_id)
values
  -- Published ideas
  ('descans-torns', 'Els nous calendaris de torns publicats amb tres setmanes d''antelació ens ajuden molt a conciliar amb la família.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('descans-torns', 'A la línia d''envasat necessitaríem 5 minuts més de solapament entre torns per traspassar incidències sense presses.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('descans-torns', 'Al moll de càrrega els divendres a la tarda tenim pics molt forts; reforçar el torn evitaria retards.', 'pending', (select id from public.sites where code='logistic_bcn_zal')),
  ('descans-torns', 'Les noves pauses escalonades han donat una mica d''aire fresc a la línia d''omplidores.', 'pending', (select id from public.sites where code='font_salem_el_puig')),
  ('seguretat', 'Molt bona iniciativa la revisió de calçat ergonòmic per a les jornades de peu.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('seguretat', 'Les noves ulleres protectores graduades són molt més còmodes i no s''entelen amb la calor.', 'pending', (select id from public.sites where code='estrella_levante_murcia')),
  ('seguretat', 'Molt bona reacció dels equips de prevenció davant la petita incidència al circuit de vapor.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga')),
  ('seguretat', 'La senyalització dels passos de vianants entre naus ha millorat notablement la seguretat.', 'pending', (select id from public.sites where code='font_salem_salem')),
  ('comunicacio', 'L''app interna de Damm Pulse funciona molt bé per consultar el menú de la cantina i els torns.', 'pending', (select id from public.sites where code='seu_central_bcn')),
  ('comunicacio', 'Proposo fer un resum de 2 minuts de les millores de planta a les pantalles de la cantina.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga')),
  ('comunicacio', 'Molt agraïts per les explicacions curtes d''arrencada de torn que fan els caps d''equip.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('comunicacio', 'Els canals digitals han fet molt més fàcil seguir les novetats sense dependre de paper.', 'pending', (select id from public.sites where code='cacaolat_santa_coloma')),
  ('ambient', 'Molt bon ambient i acollida als nous companys que s''han incorporat a la secció de cocció.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('ambient', 'La iniciativa dels divendres de celebració d''equip fa que vingui molt de gust treballar junts.', 'pending', (select id from public.sites where code='seu_central_bcn')),
  ('ambient', 'L''esperit d''equip a malteria és excel·lent, tothom dona un cop de mà quan cal.', 'pending', (select id from public.sites where code='la_moravia_lleida')),
  ('installacions', 'La nova climatització a la sala d''envasat ha reduït molt la calor als torns de tarda.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('installacions', 'Caldria instal·lar un punt addicional de càrrega per a bicicletes i patinets al pàrquing.', 'pending', (select id from public.sites where code='seu_central_bcn')),
  ('installacions', 'Els nous llums LED al magatzem han millorat la visibilitat als passadissos alts.', 'pending', (select id from public.sites where code='logistic_murcia')),
  ('altres', 'La reducció de plàstic d''un sol ús a totes les plantes és un orgull per a la sostenibilitat de Damm.', 'pending', (select id from public.sites where code='seu_central_bcn')),
  ('altres', 'Molt recomanable la formació pràctica de tast de malta i matèries primeres.', 'pending', (select id from public.sites where code='la_moravia_lleida'));

-- Publica les 20 primeres idees
update public.plaza_ideas set status = 'published', published_on = current_date;

-- Insereix les 4 pendents per a la bústia de moderació de RRHH
insert into public.plaza_ideas (category_id, body_redacted, status, site_id)
values
  ('descans-torns', 'Proposo revisar la rotació de caps de setmana per tal que sigui més equilibrada entre torns.', 'pending', (select id from public.sites where code='cc_damm_el_prat')),
  ('comunicacio', 'Estaria bé tenir un dia al mes completament lliure de reunions per poder concentrar-nos en projectes de fons.', 'pending', (select id from public.sites where code='seu_central_bcn')),
  ('installacions', 'Seria de gran ajuda disposar d''una font d''aigua freda addicional a prop de les portes 12 i 14 del moll.', 'pending', (select id from public.sites where code='logistic_bcn_zal')),
  ('seguretat', 'Cal repintar les marques vials de carretons a la intersecció amb el taller de manteniment.', 'pending', (select id from public.sites where code='font_salem_el_puig'));

-- Afegeix reaccions (+1) a les idees publicades
insert into app_private.plaza_idea_reactions(idea_id, wallet_digest)
select i.id, extensions.digest('demo-reaction-' || i.id || '-' || n, 'sha256')
from public.plaza_ideas i
cross join generate_series(1, 3) n
where i.status = 'published'
on conflict do nothing;

-- ===== 6. Pregunta del dia a La Plaça =====
delete from public.plaza_daily_questions where question_date = (now() at time zone 'Europe/Madrid')::date;

with ins_q as (
  insert into public.plaza_daily_questions(question_date, prompt, status, min_sample_size, approved_by, approved_at)
  values(
    (now() at time zone 'Europe/Madrid')::date,
    'Com valores la comunicació de canvis i millores a la teva planta o centre de treball?',
    'published',
    10,
    '00000000-0000-4000-a000-000000000001'::uuid,
    now()
  )
  returning id
), ins_opts as (
  insert into public.plaza_daily_options(question_id, option_key, label, emoji, position)
  select q.id, o.k, o.l, o.e, o.pos
  from ins_q q
  cross join (values
    ('0', 'Molt transparent i àgil', '✨', 1),
    ('1', 'Correcta i puntual', '👍', 2),
    ('2', 'De vegades arriba tard', '⏱️', 3),
    ('3', 'Falta més informació', '📢', 4)
  ) as o(k, l, e, pos)
  returning id, question_id, option_key
)
insert into app_private.plaza_daily_votes(question_id, option_id)
select o.question_id, o.id
from ins_opts o
cross join generate_series(1, case o.option_key when '0' then 14 when '1' then 18 when '2' then 7 else 3 end);

commit;

-- Resum final
select 'daily_moods' as taula, count(*) as files, min(day)::text as des_de, max(day)::text as fins_a from public.daily_moods
union all
select c.slug, (select count(*) from public.survey_responses r where r.campaign_id = c.id), c.opens_at::date::text, c.closes_at::date::text
from public.campaigns c where c.status = 'published'
union all
select 'plaza_ideas (' || status || ')', count(*), null, null from public.plaza_ideas group by status
order by 1;
