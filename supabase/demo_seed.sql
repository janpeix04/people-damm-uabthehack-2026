-- Dades sintètiques massives de demo per a la plataforma Damm Pulse IA.
-- Aquest script amplia totes les taules clau de la BD:
-- 1. Ampliació de la plantilla sintètica a 2.500 empleats repartits entre els 14 centres oficials de Damm.
-- 2. Estat d'ànim diari (daily_moods) dels darrers 90 dies (inclòs avui) amb desenes de milers de registres.
-- 3. 7 campanyes completes (5 obertes + 2 tancades històriques) amb milers de respostes i preguntes per centre.
-- 4. Bústia d'idees de La Plaça amb més de 110 opinions repartides entre els 14 centres i 6 categories (publicades, pendents per a RRHH, rebutjades i arxivades) i centenars de reaccions.
-- 5. Preguntes diàries a La Plaça dels darrers 6 dies amb opcions i centenars de vots anònims.
-- 6. Recomanacions d'acció People Analytics / IA i execucions associades.
-- 7. Catàleg de recompenses, concessions de punts i bescanvis demo.
-- Ús: npm run db:demo

begin;

-- Les dades són aleatòries a cada creació de la BD. Per repetir-les: PGOPTIONS="-c demo.seed=0.4242"
select case when nullif(current_setting('demo.seed', true), '') is not null then setseed(current_setting('demo.seed')::float8) end;

-- ===== 0. Neteja de dades prèvies per a idempotència =====
delete from public.response_answers where response_id in (
  select id from public.survey_responses where synthetic
);
delete from public.survey_responses where synthetic;
delete from public.audience_assignments where synthetic_person_id in (
  select id from public.synthetic_people where is_synthetic
);

delete from public.campaigns where slug in (
  'pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre',
  'enquesta-bf7a2870-3813-4562-9f5e-a38d0e646777',
  'enquesta-dbf52731-f110-4d23-b09c-eed75819e03a',
  'enquesta-2ef8747e-0219-4c2c-ba2f-9fef7093d8aa'
) or lower(name) in ('test', 'aadas', 'test conect');

-- ===== 1. Plantilla sintètica de 2.500 empleats amb departaments reals per seu =====
with new_numbers as (
  select generate_series(1, 2500) as num
), mapped_data as (
  select
    n.num,
    'SYN-' || lpad(n.num::text, 4, '0') as code,
    -- Departament assignat segons seu real
    case
      when n.num between 1 and 310 then 'oficina'
      when n.num between 311 and 430 then 'comercial'
      when n.num between 431 and 460 then 'others'
      when n.num between 461 and 940 then 'fabrica'
      when n.num between 941 and 1050 then 'logistica'
      when n.num between 1051 and 1095 then 'oficina'
      when n.num between 1096 and 1110 then 'others'
      when n.num between 1111 and 1240 then 'fabrica'
      when n.num between 1241 and 1280 then 'logistica'
      when n.num between 1281 and 1315 then 'comercial'
      when n.num between 1316 and 1330 then 'oficina'
      when n.num between 1331 and 1390 then 'fabrica'
      when n.num between 1391 and 1410 then 'logistica'
      when n.num between 1411 and 1430 then 'comercial'
      when n.num between 1431 and 1440 then 'oficina'
      when n.num between 1441 and 1580 then 'fabrica'
      when n.num between 1581 and 1615 then 'logistica'
      when n.num between 1616 and 1630 then 'oficina'
      when n.num between 1631 and 1695 then 'fabrica'
      when n.num between 1696 and 1713 then 'logistica'
      when n.num between 1714 and 1720 then 'oficina'
      when n.num between 1721 and 1795 then 'fabrica'
      when n.num between 1796 and 1820 then 'logistica'
      when n.num between 1821 and 1832 then 'comercial'
      when n.num between 1833 and 1840 then 'oficina'
      when n.num between 1841 and 1885 then 'fabrica'
      when n.num between 1886 and 1899 then 'logistica'
      when n.num between 1900 and 1905 then 'oficina'
      when n.num between 1906 and 1990 then 'fabrica'
      when n.num between 1991 and 2015 then 'logistica'
      when n.num between 2016 and 2035 then 'comercial'
      when n.num between 2036 and 2045 then 'oficina'
      when n.num between 2046 and 2090 then 'fabrica'
      when n.num between 2091 and 2108 then 'logistica'
      when n.num between 2109 and 2123 then 'comercial'
      when n.num between 2124 and 2130 then 'oficina'
      when n.num between 2131 and 2172 then 'fabrica'
      when n.num between 2173 and 2185 then 'logistica'
      when n.num between 2186 and 2190 then 'oficina'
      when n.num between 2191 and 2226 then 'fabrica'
      when n.num between 2227 and 2236 then 'logistica'
      when n.num between 2237 and 2240 then 'oficina'
      when n.num between 2241 and 2405 then 'logistica'
      when n.num between 2406 and 2440 then 'oficina'
      when n.num between 2441 and 2450 then 'others'
      when n.num between 2451 and 2485 then 'logistica'
      when n.num between 2486 and 2495 then 'comercial'
      when n.num between 2496 and 2500 then 'oficina'
      else 'oficina'
    end as dept_code,
    -- Centre oficial assignat
    case
      when n.num between 1 and 310 then 'seu_central_bcn'
      when n.num between 311 and 430 then 'seu_central_bcn'
      when n.num between 431 and 460 then 'seu_central_bcn'
      when n.num between 461 and 940 then 'cc_damm_el_prat'
      when n.num between 941 and 1050 then 'cc_damm_el_prat'
      when n.num between 1051 and 1095 then 'cc_damm_el_prat'
      when n.num between 1096 and 1110 then 'cc_damm_el_prat'
      when n.num between 1111 and 1240 then 'estrella_levante_murcia'
      when n.num between 1241 and 1280 then 'estrella_levante_murcia'
      when n.num between 1281 and 1315 then 'estrella_levante_murcia'
      when n.num between 1316 and 1330 then 'estrella_levante_murcia'
      when n.num between 1331 and 1390 then 'cervezas_victoria_malaga'
      when n.num between 1391 and 1410 then 'cervezas_victoria_malaga'
      when n.num between 1411 and 1430 then 'cervezas_victoria_malaga'
      when n.num between 1431 and 1440 then 'cervezas_victoria_malaga'
      when n.num between 1441 and 1580 then 'font_salem_el_puig'
      when n.num between 1581 and 1615 then 'font_salem_el_puig'
      when n.num between 1616 and 1630 then 'font_salem_el_puig'
      when n.num between 1631 and 1695 then 'font_salem_salem'
      when n.num between 1696 and 1713 then 'font_salem_salem'
      when n.num between 1714 and 1720 then 'font_salem_salem'
      when n.num between 1721 and 1795 then 'font_salem_santarem'
      when n.num between 1796 and 1820 then 'font_salem_santarem'
      when n.num between 1821 and 1832 then 'font_salem_santarem'
      when n.num between 1833 and 1840 then 'font_salem_santarem'
      when n.num between 1841 and 1885 then 'la_moravia_lleida'
      when n.num between 1886 and 1899 then 'la_moravia_lleida'
      when n.num between 1900 and 1905 then 'la_moravia_lleida'
      when n.num between 1906 and 1990 then 'cacaolat_santa_coloma'
      when n.num between 1991 and 2015 then 'cacaolat_santa_coloma'
      when n.num between 2016 and 2035 then 'cacaolat_santa_coloma'
      when n.num between 2036 and 2045 then 'cacaolat_santa_coloma'
      when n.num between 2046 and 2090 then 'cafes_garriga_barbera'
      when n.num between 2091 and 2108 then 'cafes_garriga_barbera'
      when n.num between 2109 and 2123 then 'cafes_garriga_barbera'
      when n.num between 2124 and 2130 then 'cafes_garriga_barbera'
      when n.num between 2131 and 2172 then 'veri_osca'
      when n.num between 2173 and 2185 then 'veri_osca'
      when n.num between 2186 and 2190 then 'veri_osca'
      when n.num between 2191 and 2226 then 'fuente_liviana_conca'
      when n.num between 2227 and 2236 then 'fuente_liviana_conca'
      when n.num between 2237 and 2240 then 'fuente_liviana_conca'
      when n.num between 2241 and 2405 then 'logistic_bcn_zal'
      when n.num between 2406 and 2440 then 'logistic_bcn_zal'
      when n.num between 2441 and 2450 then 'logistic_bcn_zal'
      when n.num between 2451 and 2485 then 'logistic_murcia'
      when n.num between 2486 and 2495 then 'logistic_murcia'
      when n.num between 2496 and 2500 then 'logistic_murcia'
      else 'seu_central_bcn'
    end as site_code,
    -- Dades demogràfiques coherents
    (date '1965-01-01' + (n.num * 47 % 13800) * interval '1 day')::date as bdate,
    (date '2005-01-01' + (n.num * 31 % 7800) * interval '1 day')::date as hdate,
    case n.num % 4 when 0 then 'woman' when 1 then 'man' when 2 then 'non_binary' else 'woman' end as gen,
    case n.num % 4 when 0 then '18-29' when 1 then '30-39' when 2 then '40-49' else '50+' end as age_b,
    case n.num % 4 when 0 then '<1' when 1 then '1-3' when 2 then '4-9' else '10+' end as ten_b,
    -- Torns adaptats a cada tipus d'activitat real
    case
      -- Oficines no tenen torns nocturns
      when n.num between 1 and 310 or n.num between 1051 and 1095 or n.num between 1316 and 1330 or n.num between 1431 and 1440 or n.num between 1616 and 1630 or n.num between 1714 and 1720 or n.num between 1833 and 1840 or n.num between 1900 and 1905 or n.num between 2036 and 2045 or n.num between 2124 and 2130 or n.num between 2186 and 2190 or n.num between 2237 and 2240 or n.num between 2406 and 2440 or n.num between 2496 and 2500
        then case n.num % 3 when 0 then 'morning' else 'flexible' end
      -- Comercial en ruta o flexible
      when n.num between 311 and 430 or n.num between 1281 and 1315 or n.num between 1411 and 1430 or n.num between 1821 and 1832 or n.num between 2016 and 2035 or n.num between 2109 and 2123 or n.num between 2486 and 2495
        then case n.num % 3 when 0 then 'flexible' else 'route' end
      -- Fàbrica i Logística (torns rotatius: matí, tarda, nit)
      else
        case n.num % 5 when 0 then 'morning' when 1 then 'morning' when 2 then 'afternoon' when 3 then 'afternoon' else 'night' end
    end as shf,
    case n.num % 10 when 0 then 'manager' when 1 then 'team_lead' else 'individual' end as m_lvl,
    case
      when n.num between 1 and 310 then 'hybrid'
      when n.num between 311 and 430 then 'field'
      else 'onsite'
    end as w_mode,
    case n.num % 10 when 0 then 'es' when 1 then 'en' else 'ca' end as loc,
    case
      when n.num between 1 and 460 then
        case n.num % 3 when 0 then 'teams'::public.channel_type when 1 then 'email'::public.channel_type else 'web'::public.channel_type end
      else
        case n.num % 4 when 0 then 'mobile_qr'::public.channel_type when 1 then 'mobile_qr'::public.channel_type when 2 then 'teams'::public.channel_type else 'web'::public.channel_type end
    end as chan
  from new_numbers n
)
insert into public.synthetic_people (
  synthetic_code, department_id, site_id, site, site_location, site_type_ca,
  role_family, role_title, shift, manager_level, work_mode,
  preferred_locale, preferred_channel, age_band, tenure_band, birth_date, gender, hire_date,
  active, is_synthetic, work_area_code
)
select
  m.code,
  d.id as department_id,
  s.id as site_id,
  s.name as site,
  s.location as site_location,
  s.site_type_ca,
  case d.code
    when 'fabrica' then 'operacions_fabrica'
    when 'logistica' then 'logistica_i_magatzem'
    when 'comercial' then 'vendes_i_horeca'
    when 'oficina' then 'serveis_corporatius'
    else 'altres_arees'
  end as role_family,
  -- Títols de feina hiper-realistes adaptats a cada seu
  case
    when s.code = 'la_moravia_lleida' and d.code = 'fabrica' then
      case m.num % 4
        when 0 then 'Operador/a de malteria i sitges'
        when 1 then 'Mestre/a malter i torrador'
        when 2 then 'Tècnic/a de control de germinació'
        else 'Analista de laboratori agronòmic'
      end
    when s.code = 'cacaolat_santa_coloma' and d.code = 'fabrica' then
      case m.num % 4
        when 0 then 'Operari/a de línia làctia'
        when 1 then 'Tècnic/a de tractament UHT'
        when 2 then 'Operari/a d''envasat en vidre i brik'
        else 'Analista de qualitat làctia'
      end
    when s.code = 'cafes_garriga_barbera' and d.code = 'fabrica' then
      case m.num % 4
        when 0 then 'Mestre/a torrador de cafè'
        when 1 then 'Tècnic/a de manteniment de cafeteres Horeca'
        when 2 then 'Operador/a d''envasat en gra i càpsules'
        else 'Tècnic/a de control de tast i mòlta'
      end
    when s.code in ('veri_osca', 'fuente_liviana_conca') and d.code = 'fabrica' then
      case m.num % 4
        when 0 then 'Operari/a d''envasat d''aigua mineral'
        when 1 then 'Tècnic/a de bufat de preformes PET'
        when 2 then 'Analista de qualitat bacteriològica'
        else 'Especialista en línies d''aigua'
      end
    when d.code = 'fabrica' then
      case m.num % 4
        when 0 then 'Operari/a d''envasat (línies ampolla i llauna)'
        when 1 then 'Tècnic/a de cocció i fermentació'
        when 2 then 'Especialista en manteniment industrial'
        else 'Analista de laboratori i qualitat'
      end
    when d.code = 'logistica' and s.code in ('logistic_bcn_zal', 'logistic_murcia') then
      case m.num % 4
        when 0 then 'Conductor/a de carretons retràctils i trilaterals'
        when 1 then 'Preparador/a de comandes (picking)'
        when 2 then 'Cap de torn de molls i expedicions'
        else 'Operador/a de magatzem automatitzat (silos)'
      end
    when d.code = 'logistica' then
      case m.num % 3
        when 0 then 'Conductor/a de carretons elevadors'
        when 1 then 'Preparador/a de comandes'
        else 'Operador/a de moll de càrrega'
      end
    when d.code = 'comercial' and s.code = 'seu_central_bcn' then
      case m.num % 4
        when 0 then 'Key Account Manager (Grans Comptes)'
        when 1 then 'Delegat/da comercial Horeca'
        when 2 then 'Trade Marketing Specialist'
        else 'Gestor/a d''exportació i mercats internacionals'
      end
    when d.code = 'comercial' then
      case m.num % 3
        when 0 then 'Gestor/a de punt de venda Horeca'
        when 1 then 'Comercial de ruta i distribució'
        else 'Promotor/a comercial'
      end
    when d.code = 'oficina' and s.code = 'seu_central_bcn' then
      case m.num % 5
        when 0 then 'Especialista en People & Cultura (RRHH)'
        when 1 then 'Controller financer/a'
        when 2 then 'Data Engineer & IA Specialist'
        when 3 then 'Assessor/a jurídic corporatiu'
        else 'Product Manager de Màrqueting'
      end
    when d.code = 'oficina' then
      case m.num % 4
        when 0 then 'Coordinador/a de PRL i Seguretat'
        when 1 then 'Administratiu/va de planta'
        when 2 then 'Enginyer/a de processos industrials'
        else 'Tècnic/a de sistemes locals'
      end
    else
      case m.num % 3
        when 0 then 'Coordinador/a Fundació Damm'
        when 1 then 'Tècnic/a de Serveis Generals'
        else 'Agent de sostenibilitat i medi ambient'
      end
  end as role_title,
  m.shf,
  m.m_lvl,
  m.w_mode,
  m.loc,
  m.chan,
  m.age_b,
  m.ten_b,
  m.bdate,
  m.gen,
  greatest(m.bdate + interval '18 years 1 day', least(date '2026-11-06', m.hdate))::date,
  true,
  true,
  d.code
from mapped_data m
join public.departments d on d.code = m.dept_code
join public.sites s on s.code = m.site_code
on conflict (synthetic_code) do update set
  department_id = excluded.department_id,
  site_id = excluded.site_id,
  site = excluded.site,
  site_location = excluded.site_location,
  site_type_ca = excluded.site_type_ca,
  role_family = excluded.role_family,
  role_title = excluded.role_title,
  shift = excluded.shift,
  work_mode = excluded.work_mode,
  work_area_code = excluded.work_area_code;

update public.departments d set synthetic_headcount = (
  select count(*) from public.synthetic_people p where p.department_id = d.id and p.active
);

-- ===== 2. Estat d'ànim diari (daily_moods) dels darrers 90 dies =====
delete from public.daily_moods where day >= (now() at time zone 'Europe/Madrid')::date - 89;

with days as (
  select d::date as day, ((now() at time zone 'Europe/Madrid')::date - d::date) as ago
  from generate_series((now() at time zone 'Europe/Madrid')::date - 89, (now() at time zone 'Europe/Madrid')::date, interval '1 day') d
), params as (
  select
    random() as r_answer, random() as r_noise,
    dy.day, dy.ago, extract(isodow from dy.day)::int as dow,
    p.site_id, p.department_id, d.code,
    -- Probabilitat de resposta diària segons col·lectiu i dia de la setmana
    case d.code
      when 'fabrica' then case when extract(isodow from dy.day) >= 6 then 0.22 else 0.44 end
      when 'logistica' then case when extract(isodow from dy.day) >= 6 then 0.25 else 0.46 end
      when 'comercial' then case when extract(isodow from dy.day) >= 6 then 0.08 else 0.48 end
      when 'oficina' then case when extract(isodow from dy.day) >= 6 then 0.05 else 0.52 end
      else case when extract(isodow from dy.day) >= 6 then 0.10 else 0.45 end
    end as p_answer,
    -- Nota mitjana (1-5)
    case d.code
      when 'fabrica' then 3.65 - 0.25 * (1 - dy.ago / 89.0) + (case when extract(isodow from dy.day) = 5 then 0.2 else 0 end)
      when 'logistica' then 3.40 - (case when extract(isodow from dy.day) = 5 then 0.35 else 0 end) + (case when dy.ago <= 14 then -0.2 else 0.1 end)
      when 'comercial' then 4.10 + (case when extract(isodow from dy.day) = 5 then 0.25 else 0 end)
      when 'oficina' then 4.05 - (case when extract(isodow from dy.day) = 3 then 0.20 else 0 end)
      else 3.90
    end as mean
  from days dy
  cross join public.synthetic_people p
  join public.departments d on d.id = p.department_id
  where p.active
)
insert into public.daily_moods(day, site_id, department_id, mood)
select day, site_id, department_id,
  greatest(1, least(5, round(mean + (r_noise - 0.5) * 2.2)))::smallint
from params
where r_answer < p_answer;

-- ===== 3. Les 7 Campanyes Oficials =====
insert into public.campaigns (
  slug, name, objective, context, prohibited_topics, status, target_filter, max_duration_seconds,
  privacy_threshold, target_population, opens_at, closes_at, created_by, approved_by, approved_by_label, approved_at, published_at
)
select v.slug, v.name, v.objective, v.context, array['rendiment individual','salut diagnosticada'], v.status::public.campaign_status, v.tf::jsonb, v.secs,
  10, 0, v.opens::timestamptz, v.closes::timestamptz,
  '00000000-0000-4000-a000-000000000001'::uuid, '00000000-0000-4000-a000-000000000001'::uuid,
  'Direcció de People & ESG (RRHH)', v.opens::timestamptz - interval '2 days', v.opens::timestamptz
from (values
  ('pols-novembre', 'Pols mensual · Novembre 2026',
   'Seguiment periòdic del benestar, descans i comunicació a fàbriques i oficines.',
   'Enquesta periòdica general amb indicador de satisfacció, comunicació interna i suport.',
   'published',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","oficines","comercial","manteniment"],"channels":["qr","app","teams","placa","world"],"locale":"ca","dimensions":{"q1":"Benestar","q2":"Descans","q3":"Comunicació","q4":"Lideratge","q5":"Cultura","q6":"Propostes"}}}',
   65, '2026-11-01 08:00+01', '2026-11-20 23:00+01'),
  ('seguretat-industrial', 'Seguretat i Prevenció de Riscos a Planta',
   'Auditoria de seguretat, EPIs, climatització i protocols operatius.',
   'Diagnòstic de condicions ergonòmiques, equips de protecció i detecció de riscos.',
   'published',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","manteniment"],"channels":["qr","app","teams"],"locale":"ca","dimensions":{"q1":"Seguretat","q2":"EPIs","q3":"Prevenció","q4":"Condicions","q5":"Riscos"}}}',
   53, '2026-10-20 08:00+02', '2026-11-15 23:00+01'),
  ('torns', 'Torns, Descans i Conciliació a Planta',
   'Avaluar l’impacte dels torns rotatius de 8h i els temps de recuperació física.',
   'Enquesta centrada en les línies de producció i magatzem sobre calendaris i sobrecàrrega.',
   'published',
   '{"hr":{"zones":["envasat","logistica","coccio"],"channels":["qr","app","teams","placa"],"locale":"ca","dimensions":{"q1":"Organització","q2":"Planificació","q3":"Equitat","q4":"Descans","q5":"Càrrega","q6":"Millores"}}}',
   58, '2026-11-04 08:00+01', '2026-11-25 23:00+01'),
  ('conciliacio-oficines', 'Flexibilitat, Eines Digitals i Oficines',
   'Mesurar la conciliació en el model híbrid i la reducció de reunions.',
   'Enquesta enfocada a la seu central, finances, màrqueting, IT i equips comercials.',
   'published',
   '{"hr":{"zones":["oficines","comercial"],"channels":["teams","email","app"],"locale":"ca","dimensions":{"q1":"Flexibilitat","q2":"Reunions","q3":"Eines","q4":"Reconeixement","q5":"Propostes"}}}',
   57, '2026-10-25 08:00+02', '2026-11-18 23:00+01'),
  ('onboarding-talent', 'Experiència d’Acollida i Onboarding',
   'Acompanyament i valoració de les incorporacions dels darrers mesos.',
   'Enquesta breu als nous membres sobre rebuda, tutorització i recursos inicials.',
   'published',
   '{"hr":{"zones":["envasat","logistica","coccio","oficines","comercial"],"channels":["app","teams","email","qr"],"locale":"ca","dimensions":{"q1":"Acollida","q2":"Formació","q3":"Acompanyament","q4":"Recursos","q5":"Feedback"}}}',
   55, '2026-10-15 08:00+02', '2026-11-30 23:00+01'),
  ('clima-tardor-2026', 'Avaluació de Clima i Benestar · Tardor 2026',
   'Diagnòstic integral de clima laboral, compromís i satisfacció a tots els centres.',
   'Enquesta general de clima de tardor a tot el grup per analitzar satisfacció i ambient.',
   'closed',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","oficines","comercial","manteniment"],"channels":["app","teams","qr","email"],"locale":"ca","dimensions":{"q1":"Satisfacció","q2":"Reconeixement","q3":"Desenvolupament","q4":"Ambient","q5":"Recomanació","q6":"Propostes"}}}',
   70, '2026-09-15 08:00+02', '2026-10-15 23:00+02'),
  ('sostenibilitat-esg', 'Sostenibilitat, Eficiència Energètica i Residus',
   'Mesurar la percepció i participació en els programes de residu zero i transició ecològica.',
   'Enquesta transversal sobre hàbits de reciclatge, estalvi d''aigua i reducció d''emissions.',
   'closed',
   '{"hr":{"zones":["envasat","logistica","coccio","oficines","comercial"],"channels":["app","teams","email","qr"],"locale":"ca","dimensions":{"q1":"Sensibilització","q2":"Mitjans","q3":"Eficiència","q4":"Circularitat","q5":"Propostes"}}}',
   50, '2026-09-01 08:00+02', '2026-10-01 23:00+02')
) as v(slug, name, objective, context, status, tf, secs, opens, closes)
on conflict (slug) do update set
  name = excluded.name, objective = excluded.objective, context = excluded.context,
  status = excluded.status,
  target_filter = excluded.target_filter, max_duration_seconds = excluded.max_duration_seconds,
  opens_at = excluded.opens_at, closes_at = excluded.closes_at;

-- Questionnaire versions & translations
insert into public.questionnaire_versions (campaign_id, version, status, estimated_seconds, generated_by_ai, generation_rationale, approved_by, approved_by_label, approved_at)
select c.id, 1, 'published', c.max_duration_seconds, true,
  'Preguntes breus adaptades als canals mòbil, QR i Teams; revisades per una persona de RRHH.',
  '00000000-0000-4000-a000-000000000001'::uuid, 'Direcció de People & ESG (RRHH)', c.approved_at
from public.campaigns c
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines', 'clima-tardor-2026', 'sostenibilitat-esg')
on conflict (campaign_id, version) do update set status = 'published';

insert into public.questionnaire_translations (questionnaire_version_id, locale, title, introduction, closing_message, transparency_notice)
select qv.id, 'ca', c.name, c.context, 'Gràcies per participar.', 'Respostes anònimes; resultats agregats amb un mínim de 10 persones.'
from public.questionnaire_versions qv join public.campaigns c on c.id = qv.campaign_id
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines', 'clima-tardor-2026', 'sostenibilitat-esg')
on conflict (questionnaire_version_id, locale) do update set title = excluded.title, introduction = excluded.introduction;

-- Questions per campanya
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
  ('conciliacio-oficines', 5, 'open_text', null, null, 'Quina millora operativa o de benestar proposaries per a oficines?', '[]'),
  -- clima-tardor-2026
  ('clima-tardor-2026', 1, 'scale', 0, 10, 'Del 0 al 10, com valores el teu nivell de satisfacció general a Damm?', '[]'),
  ('clima-tardor-2026', 2, 'scale', 1, 5, 'Sents que la teva feina i el teu esforç són reconeguts pel teu responsable directe?', '[]'),
  ('clima-tardor-2026', 3, 'single_choice', null, null, 'Tens accés a oportunitats d’aprenentatge i creixement professional?', '["Sempre","Sovint","Poques vegades","Mai"]'),
  ('clima-tardor-2026', 4, 'scale', 0, 10, 'Del 0 al 10, com de còmode et sents amb l’ambient de treball i col·laboració?', '[]'),
  ('clima-tardor-2026', 5, 'single_choice', null, null, 'Recomanaries Damm com a excel·lent lloc de treball a familiars i amics?', '["Amb tota seguretat","Probablement","Tinc dubtes","No"]'),
  ('clima-tardor-2026', 6, 'open_text', null, null, 'Quina proposta destacaries per millorar el clima laboral a la teva unitat?', '[]'),
  -- sostenibilitat-esg
  ('sostenibilitat-esg', 1, 'scale', 0, 10, 'Del 0 al 10, com valores el compromís mediambiental i la sostenibilitat a Damm?', '[]'),
  ('sostenibilitat-esg', 2, 'single_choice', null, null, 'A la teva feina diària disposes de mitjans suficients per separar residus?', '["Sempre","Majoritàriament","Freqüentment en falten","No"]'),
  ('sostenibilitat-esg', 3, 'scale', 1, 5, 'Com valores les iniciatives d’estalvi d’aigua i eficiència energètica?', '[]'),
  ('sostenibilitat-esg', 4, 'single_choice', null, null, 'Coneixes o participes en el programa de residu zero i envasos circulars?', '["Sí i hi participo","El conec bé","N''he sentit a parlar","No"]'),
  ('sostenibilitat-esg', 5, 'open_text', null, null, 'Quina acció pràctica d’estalvi de recursos suggeriries a la teva planta o seu?', '[]');

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

-- ===== 4. Audiència i Respostes Massives =====
-- Participació de cada campanya: ±12% sobre la base, diferent a cada creació
create temp table demo_participation on commit drop as
select slug, 0.88 + random() * 0.24 as f
from (values ('pols-novembre'), ('seguretat-industrial'), ('torns'), ('conciliacio-oficines'), ('onboarding-talent'), ('clima-tardor-2026'), ('sostenibilitat-esg')) v(slug);

create temp table demo_audience on commit drop as
select c.id as campaign_id, c.slug, c.opens_at, c.closes_at, p.*, d.collective,
  row_number() over (partition by c.id order by random()) as rn,
  (case c.slug
    when 'pols-novembre' then 1420
    when 'seguretat-industrial' then 980
    when 'torns' then 780
    when 'conciliacio-oficines' then 620
    when 'onboarding-talent' then 390
    when 'clima-tardor-2026' then 1650
    when 'sostenibilitat-esg' then 1280
  end * (select f from demo_participation dp where dp.slug = c.slug))::int as answered
from public.campaigns c
cross join public.synthetic_people p
join public.departments d on d.id = p.department_id
where p.active
  and not exists (select 1 from app_private.worker_accounts wa where wa.synthetic_person_id = p.id)
  and (
    (c.slug = 'seguretat-industrial' and d.code in ('fabrica','logistica'))
    or (c.slug = 'onboarding-talent' and (p.tenure_band = '<1' or p.synthetic_code in ('SYN-0001','SYN-0002','SYN-0003') or p.id::text like '%1' or p.id::text like '%3'))
    or (c.slug = 'conciliacio-oficines' and d.code in ('oficina','comercial','others'))
    or (c.slug = 'torns' and d.code in ('fabrica','logistica'))
    or (c.slug in ('pols-novembre','clima-tardor-2026','sostenibilitat-esg'))
  );

insert into public.audience_assignments (campaign_id, synthetic_person_id, channel, locale, status, access_token_digest, invited_at, responded_at)
select a.campaign_id, a.id, a.preferred_channel, a.preferred_locale,
  case when a.rn <= a.answered then 'responded'::public.assignment_status else 'invited'::public.assignment_status end,
  case when a.rn <= a.answered then null else extensions.digest('demo-' || a.slug || '-' || a.synthetic_code || '-2026', 'sha256') end,
  a.opens_at + interval '1 hour',
  case when a.rn <= a.answered
    then a.opens_at + (least(a.closes_at, now()) - interval '1 hour' - a.opens_at) * power(a.rn::numeric / a.answered, 1.3)
  end
from demo_audience a
on conflict (campaign_id, synthetic_person_id) do nothing;

update public.campaigns c set target_population = (
  select count(*) from public.audience_assignments a where a.campaign_id = c.id
)
where c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines', 'clima-tardor-2026', 'sostenibilitat-esg');

-- Inserir les respostes
insert into public.survey_responses (campaign_id, questionnaire_version_id, submitted_at, period_start, channel, locale, department_id, collective,
  shift, manager_level, age_band, tenure_band, duration_seconds, session_nonce, site_id, synthetic)
select a.campaign_id, qv.id, aa.responded_at, a.opens_at::date, a.preferred_channel, a.preferred_locale, a.department_id, a.collective,
  a.shift, a.manager_level, a.age_band, a.tenure_band, 30 + (a.rn * 17 % 80)::int, md5(a.campaign_id::text || a.id::text)::uuid, a.site_id, true
from demo_audience a
join public.questionnaire_versions qv on qv.campaign_id = a.campaign_id and qv.version = 1
join public.audience_assignments aa on aa.campaign_id = a.campaign_id and aa.synthetic_person_id = a.id and aa.status = 'responded'
on conflict (session_nonce) do nothing;

-- Inserir respostes individuals a les preguntes
create temp table demo_resp on commit drop as
select r.id, r.campaign_id, q.id as question_id, q.position, q.question_type, q.scale_min, q.scale_max, qt.options,
  (case r.shift when 'night' then -0.16 when 'afternoon' then -0.05 when 'route' then -0.08 else 0.04 end
   + case r.collective when 'logistica' then -0.10 when 'oficines' then 0.08 else 0 end
   + (random() + random() - 1) * 0.45) as bias
from public.survey_responses r
join public.campaigns c on c.id = r.campaign_id and c.slug in ('pols-novembre', 'seguretat-industrial', 'torns', 'onboarding-talent', 'conciliacio-oficines', 'clima-tardor-2026', 'sostenibilitat-esg')
join public.questions q on q.questionnaire_version_id = r.questionnaire_version_id
join public.question_translations qt on qt.question_id = q.id and qt.locale = 'ca'
where not exists (select 1 from public.response_answers x where x.response_id = r.id);

insert into public.response_answers (response_id, question_id, numeric_value)
select id, question_id,
  greatest(scale_min, least(scale_max, round(scale_min + (scale_max - scale_min) * (0.70 + bias))))
from demo_resp where question_type = 'scale';

insert into public.response_answers (response_id, question_id, choice_value)
select id, question_id,
  options -> (greatest(0, least(jsonb_array_length(options) - 1,
    floor((0.30 - bias) * jsonb_array_length(options) * case when jsonb_array_length(options) = 3 then 0.85 else 1 end))))::int
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
  ('seguretat-industrial', 1, 'A la zona d’envasat fa calor a la tarda; caldria reforçar la climatització a les línies 2 i 3.'),
  ('seguretat-industrial', 2, 'Les ulleres de protecció de recanvi s’acaben ràpid al torn de nit a la sala de cocció.'),
  ('seguretat-industrial', 3, 'El nou calçat de seguretat és molt còmode per a jornades de peu; bona decisió.'),
  ('onboarding-talent', 0, 'Una explicació curta al començar el torn ajudaria molt als que acabem d’entrar.'),
  ('onboarding-talent', 1, 'El tutor va estar molt pendent, però costa tenir accés a totes les aplicacions el primer dia.'),
  ('onboarding-talent', 2, 'Molt bona benvinguda de l’equip de línia; la guia digital facilita molt el seguiment.'),
  ('conciliacio-oficines', 0, 'Menys reunions de seguiment i més temps per concentrar-se en projectes clau.'),
  ('conciliacio-oficines', 1, 'Les eines de videoconferència van lentes a les sales de reunions petites.'),
  ('conciliacio-oficines', 2, 'Valoro molt la flexibilitat d’horaris; agrairia un bloc fix sense reunions a la setmana.'),
  ('conciliacio-oficines', 3, 'L’ambient de treball a la seu corporativa és fantàstic per col·laborar.'),
  ('pols-novembre', 0, 'Molt bon ambient a la línia d’envasat, però els canvis de torn sobtats encara costen d’assimilar.'),
  ('pols-novembre', 1, 'Els caps de torn escolten més que abans, bona iniciativa per part de direcció.'),
  ('pols-novembre', 2, 'La comunicació per l’app ha millorat moltíssim la previsió setmanal de feina.'),
  ('pols-novembre', 3, 'Orgullós de la feina que fem i de la qualitat de la cervesa que surt de planta.'),
  ('torns', 0, 'Agrairia un calendari tancat de torns amb un mínim de 3 setmanes de vista.'),
  ('torns', 1, 'Les noves pauses escalonades han donat una mica d’aire fresc a la línia d’omplidores.'),
  ('torns', 2, 'El suport entre companys de línia compensa el ritme fort als pics de divendres.'),
  ('torns', 3, 'La rotació de caps de setmana hauria de ser més equitativa entre els equips fixes.'),
  ('clima-tardor-2026', 0, 'Damm ofereix una estabilitat excel·lent; cal mantenir el suport i la confiança de coordinació.'),
  ('clima-tardor-2026', 1, 'Molt bona iniciativa les trobades trimestrals per conèixer els resultats del grup.'),
  ('clima-tardor-2026', 2, 'Cal agilitzar els processos de compra de recanvis industrials per evitar aturades.'),
  ('clima-tardor-2026', 3, 'Agrairia més opcions de desenvolupament tècnic intern i formació contínua.'),
  ('sostenibilitat-esg', 0, 'L’eliminació de plàstics d’un sol ús ha estat un èxit rotund a tot el centre.'),
  ('sostenibilitat-esg', 1, 'Caldria instal·lar més punts de recàrrega de vehicles elèctrics al pàrquing de treballadors.'),
  ('sostenibilitat-esg', 2, 'L’aprofitament del bagàs i el llevat per a economia circular ens enorgulleix molt.'),
  ('sostenibilitat-esg', 3, 'Més contenidors de reciclatge específic de cartró i taps a peu de màquina.')
) as t(slug, variant, comment)
  on t.slug = r.slug
 and t.variant = floor(r.pick * 4)::int
where r.keep < 0.55;

-- ===== 5. Treballadors demo: reben assignacions i punts =====
insert into public.audience_assignments (campaign_id, synthetic_person_id, channel, locale, status, invited_at)
select c.id, a.synthetic_person_id, 'web', 'ca', 'invited', now()
from public.campaigns c
cross join app_private.worker_accounts a
join auth.users u on u.id = a.user_id
where c.status = 'published' and (u.email like '%@demo' or u.email like '%@demo.damm.invalid')
on conflict (campaign_id, synthetic_person_id) do nothing;

insert into app_private.point_grants (synthetic_person_id, reason, points)
select a.synthetic_person_id, 'demo_welcome', 250
from app_private.worker_accounts a join auth.users u on u.id = a.user_id
where u.email like '%@demo' or u.email like '%@demo.damm.invalid'
on conflict (synthetic_person_id, reason) do update set points = 250;

-- ===== 6. Opinions de La Plaça (més de 110 opinions repartides pels 14 centres) =====
delete from public.plaza_ideas;

-- Totes les idees entren inicialment en estat 'pending' per respectar el trigger de moderació
insert into public.plaza_ideas (category_id, body_redacted, status, site_id, submitted_on, published_on)
values
  -- cc_damm_el_prat (Fàbrica Prat)
  ('descans-torns', 'Els nous calendaris de torns publicats amb tres setmanes d''antelació ens ajuden molt a conciliar amb la família.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 18, null),
  ('descans-torns', 'A la línia d''envasat necessitaríem 5 minuts més de solapament entre torns per traspassar incidències sense presses.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 12, null),
  ('seguretat', 'Molt bona iniciativa la revisió de calçat ergonòmic per a les jornades de peu continuades.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 25, null),
  ('comunicacio', 'Molt agraïts per les explicacions curtes d''arrencada de torn que fan els caps d''equip abans d''arrencar línies.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 8, null),
  ('ambient', 'Molt bon ambient i acollida als nous companys que s''han incorporat a la secció de cocció i filtració.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 15, null),
  ('installacions', 'La nova climatització a la sala d''envasat ha reduït notablement la calor als torns de tarda.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 30, null),
  ('descans-torns', 'Proposo revisar la rotació de caps de setmana per tal que sigui més equilibrada entre torns a envasat.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 1, null),
  ('installacions', 'Caldria substituir les banquetes de la sala de descans de la nau 4, estan desgastades.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 2, null),

  -- seu_central_bcn (Seu Central)
  ('comunicacio', 'L''app interna de Damm Pulse funciona molt bé per consultar el menú de la cantina i les novetats corporatives.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 22, null),
  ('ambient', 'La iniciativa dels divendres de celebració d''equip fa que vingui molt de gust treballar junts a l''oficina.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 16, null),
  ('installacions', 'Caldria instal·lar un punt addicional de càrrega per a bicicletes i patinets al pàrquing subterrani.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 35, null),
  ('altres', 'La reducció de plàstic d''un sol ús a totes les plantes i oficines és un orgull per a la sostenibilitat de Damm.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 40, null),
  ('comunicacio', 'Estaria bé tenir un dia al mes completament lliure de reunions per poder concentrar-nos en projectes de fons.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 1, null),
  ('ambient', 'Proposo organitzar una lliga interna de pàdel i activitats saludables interdepartamentals.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 3, null),

  -- estrella_levante_murcia (Múrcia)
  ('seguretat', 'Les noves ulleres protectores graduades són molt més còmodes i no s''entelen amb la calor de l''estiu.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 20, null),
  ('ambient', 'Orgull de marca Estrella de Levante a la regió; l''ambient de fàbrica és proper i familiar.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 14, null),
  ('installacions', 'Els nous dispensadors d''aigua filtrada a la zona d''omplidores han estat una gran millora.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 27, null),
  ('descans-torns', 'Valorem molt positivament la flexibilitat per canviar torns puntuals entre companys.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 9, null),
  ('seguretat', 'Caldria repintar les línies de vianants davant l''accés a la sala de màquines auxiliars.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 1, null),

  -- cervezas_victoria_malaga (Màlaga)
  ('seguretat', 'Molt bona reacció dels equips de prevenció davant la petita incidència al circuit de vapor.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 21, null),
  ('comunicacio', 'Proposo fer un resum de 2 minuts de les millores de planta a les pantalles informatives de la cantina.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 13, null),
  ('ambient', 'L''esperit d''equip a Victoria és immillorable; tothom rema en la mateixa direcció.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 5, null),
  ('altres', 'Molt ben valorades les visites guiades obertes per als familiars dels treballadors.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 28, null),
  ('installacions', 'Caldria revisar la potència de l''aire condicionat al menjador en hores punta.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 2, null),

  -- font_salem_el_puig (València)
  ('descans-torns', 'Les noves pauses escalonades han donat una mica d''aire fresc a la línia d''omplidores d''alta velocitat.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 24, null),
  ('seguretat', 'Els nous protocols ergonòmics de paletitzat han reduït molt les molèsties d''esquena.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 17, null),
  ('installacions', 'Molt bona il·luminació als nous molls d''expedició de comandes.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 11, null),
  ('seguretat', 'Cal repintar les marques vials de carretons a la intersecció amb el taller de manteniment.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 1, null),
  ('comunicacio', 'Necessitem cartelleria digital més visible amb les incidències tècniques obertes.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 3, null),

  -- font_salem_salem (València)
  ('seguretat', 'La senyalització dels passos de vianants entre naus ha millorat notablement la seguretat dels operaris.', 'pending', (select id from public.sites where code='font_salem_salem'), current_date - 19, null),
  ('ambient', 'Molt bona col·laboració entre els torns de matí i tarda durant la campanya d''estiu.', 'pending', (select id from public.sites where code='font_salem_salem'), current_date - 10, null),
  ('installacions', 'La renovació dels vestuaris de planta ha quedat excel·lent, molt més còmodes i nets.', 'pending', (select id from public.sites where code='font_salem_salem'), current_date - 32, null),
  ('descans-torns', 'Demanem que es pugui disposar de cafè calent a les pauses del torn de nit.', 'pending', (select id from public.sites where code='font_salem_salem'), current_date - 2, null),

  -- font_salem_santarem (Portugal)
  ('ambient', 'Excelente integração da equipa local com os novos processos e sistemas corporativos Damm.', 'pending', (select id from public.sites where code='font_salem_santarem'), current_date - 26, null),
  ('seguretat', 'As novas formações práticas de segurança no trabalho foram muito claras e participativas.', 'pending', (select id from public.sites where code='font_salem_santarem'), current_date - 15, null),
  ('comunicacio', 'A aplicação Damm Pulse com opção de idioma facilita imenso o acompanhamento diário.', 'pending', (select id from public.sites where code='font_salem_santarem'), current_date - 7, null),
  ('installacions', 'Seria benéfico aumentar o número de lugares de estacionamento à entrada da fábrica.', 'pending', (select id from public.sites where code='font_salem_santarem'), current_date - 1, null),

  -- la_moravia_lleida (Bell-lloc d'Urgell)
  ('ambient', 'L''esperit d''equip a malteria és excel·lent, tothom dona un cop de mà quan hi ha pics d''arribada d''ordi.', 'pending', (select id from public.sites where code='la_moravia_lleida'), current_date - 23, null),
  ('altres', 'Molt recomanable la formació pràctica de tast de malta i matèries primeres que vam fer.', 'pending', (select id from public.sites where code='la_moravia_lleida'), current_date - 31, null),
  ('seguretat', 'Els nous detectors de pols a les tremuges de descàrrega funcionen de manera impecable.', 'pending', (select id from public.sites where code='la_moravia_lleida'), current_date - 14, null),
  ('comunicacio', 'Proposo compartir les dades de qualitat de malta directament amb els operaris de sitges.', 'pending', (select id from public.sites where code='la_moravia_lleida'), current_date - 2, null),

  -- cacaolat_santa_coloma (Santa Coloma)
  ('comunicacio', 'Els canals digitals han fet molt més fàcil seguir les novetats sense dependre de taulers de paper.', 'pending', (select id from public.sites where code='cacaolat_santa_coloma'), current_date - 18, null),
  ('ambient', 'Orgull de produir una marca tan històrica i estimada; la cohesió a línia és molt forta.', 'pending', (select id from public.sites where code='cacaolat_santa_coloma'), current_date - 12, null),
  ('installacions', 'La nova maquinària de final de línia ha eliminat moltes càrregues manuals feixugues.', 'pending', (select id from public.sites where code='cacaolat_santa_coloma'), current_date - 29, null),
  ('descans-torns', 'Caldria ajustar la durada del descans de mitja jornada al torn de tarda.', 'pending', (select id from public.sites where code='cacaolat_santa_coloma'), current_date - 1, null),

  -- cafes_garriga_barbera (Barberà del Vallès)
  ('ambient', 'Molt bon clima de treball a torrefacció i envasat de cafè; es treballa amb molta cura.', 'pending', (select id from public.sites where code='cafes_garriga_barbera'), current_date - 22, null),
  ('seguretat', 'Molt ben senyalitzat l''espai de maniobra per a camions i càrrega de palets.', 'pending', (select id from public.sites where code='cafes_garriga_barbera'), current_date - 16, null),
  ('altres', 'La nova gamma de càpsules compostables és un gran pas per a la nostra sostenibilitat.', 'pending', (select id from public.sites where code='cafes_garriga_barbera'), current_date - 33, null),
  ('installacions', 'Proposo millorar la ventilació a la zona de torradors durant els dies de molta calor.', 'pending', (select id from public.sites where code='cafes_garriga_barbera'), current_date - 3, null),

  -- veri_osca (Osca)
  ('seguretat', 'Els accessos a la captació d''aigua i a les línies d''embotellat compleixen els estàndards més alts.', 'pending', (select id from public.sites where code='veri_osca'), current_date - 27, null),
  ('ambient', 'Equip petit però molt cohesionat; la flexibilitat i suport mutu són constants.', 'pending', (select id from public.sites where code='veri_osca'), current_date - 13, null),
  ('altres', 'El compromís amb el Parc Natural de Posets-Maladeta és un referent per a tota la plantilla.', 'pending', (select id from public.sites where code='veri_osca'), current_date - 38, null),
  ('descans-torns', 'Estaria bé disposar de més previsió en els calendaris de reforç de campanya d''estiu.', 'pending', (select id from public.sites where code='veri_osca'), current_date - 2, null),

  -- fuente_liviana_conca (Conca)
  ('seguretat', 'Les noves baranes i passarel·les a la nau d''envasat donen molta més tranquil·litat.', 'pending', (select id from public.sites where code='fuente_liviana_conca'), current_date - 25, null),
  ('ambient', 'Molt bona entesa amb els responsables de torn i comunicació diària directa i transparent.', 'pending', (select id from public.sites where code='fuente_liviana_conca'), current_date - 11, null),
  ('installacions', 'La nova il·luminació a la zona de magatzem de palets ha quedat molt neta i clara.', 'pending', (select id from public.sites where code='fuente_liviana_conca'), current_date - 29, null),
  ('comunicacio', 'Agrairíem rebre els comunicats generals de Damm també en paper per a qui no porta el mòbil a línia.', 'pending', (select id from public.sites where code='fuente_liviana_conca'), current_date - 1, null),

  -- logistic_bcn_zal (Barcelona ZAL)
  ('descans-torns', 'Al moll de càrrega els divendres a la tarda tenim pics molt forts; reforçar el torn evitaria retards.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 20, null),
  ('seguretat', 'La separació física entre camions i carretons al pati exterior ha evitat molts ensurts.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 17, null),
  ('comunicacio', 'La nova pantalla de l''estat de molls en temps real ha agilitzat molt la feina dels mossos.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 9, null),
  ('ambient', 'Molt bon companyerisme entre els xofers de repartiment i l''equip de preparació de rutes.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 14, null),
  ('installacions', 'Seria de gran ajuda disposar d''una font d''aigua freda addicional a prop de les portes 12 i 14 del moll.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 1, null),
  ('descans-torns', 'Proposo revisar els temps de canvi de bateria dels carretons per no penalitzar la pausa.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 2, null),

  -- logistic_murcia (Múrcia Logística)
  ('installacions', 'Els nous llums LED al magatzem han millorat la visibilitat als passadissos alts.', 'pending', (select id from public.sites where code='logistic_murcia'), current_date - 21, null),
  ('seguretat', 'Els nous miralls panoràmics als encreuaments de magatzem han estat una mesura clau.', 'pending', (select id from public.sites where code='logistic_murcia'), current_date - 16, null),
  ('ambient', 'Excel·lent relació amb l''equip de trànsit i coordinació fluida en dies de gran volum.', 'pending', (select id from public.sites where code='logistic_murcia'), current_date - 8, null),
  ('descans-torns', 'Demanem que es puguin programar les vacances d''estiu amb més setmanes d''antelació.', 'pending', (select id from public.sites where code='logistic_murcia'), current_date - 1, null),
  ('comunicacio', 'Caldria un taulell informatiu amb les entrades i sortides previstes per al dia següent.', 'pending', (select id from public.sites where code='logistic_murcia'), current_date - 3, null);

-- Afegeix 6 idees que seran rebutjades i 4 que seran arxivades per tenir l'historial complet de moderació
insert into public.plaza_ideas (category_id, body_redacted, status, site_id, submitted_on, published_on)
values
  ('descans-torns', 'Demanem eliminar completament els torns de nit durant els caps de setmana a tota la planta.', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 45, null),
  ('altres', 'Comentari no procedent sobre temes personals individuals fora de l''àmbit laboral.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 40, null),
  ('seguretat', 'Proposta de retirar equips de protecció obligatoris per comoditat personal.', 'pending', (select id from public.sites where code='font_salem_el_puig'), current_date - 35, null),
  ('installacions', 'Peticions individuals que no s''ajusten als criteris de seguretat laboral.', 'pending', (select id from public.sites where code='logistic_bcn_zal'), current_date - 30, null),
  ('comunicacio', 'Crítica nominativa a companys de torn que no compleix les normes de convivència.', 'pending', (select id from public.sites where code='estrella_levante_murcia'), current_date - 25, null),
  ('ambient', 'Comentari reiterat sense proposta constructiva associada.', 'pending', (select id from public.sites where code='cervezas_victoria_malaga'), current_date - 20, null),
  ('installacions', 'Campanya finalitzada de renovació de mobiliari de menjadors (2025).', 'pending', (select id from public.sites where code='cc_damm_el_prat'), current_date - 60, null),
  ('seguretat', 'Revisió de tanques perimetrals ja executada satisfactòriament el trimestre passat.', 'pending', (select id from public.sites where code='font_salem_salem'), current_date - 55, null),
  ('descans-torns', 'Pla pilot d''horaris d''hivern de l''any anterior tancat i avaluat.', 'pending', (select id from public.sites where code='seu_central_bcn'), current_date - 50, null),
  ('comunicacio', 'Informació sobre el llançament de la versió 1.0 de l''app mòbil (ja superat).', 'pending', (select id from public.sites where code='cacaolat_santa_coloma'), current_date - 48, null);

-- Modera les idees: publica la majoria, arxiva i rebutja les de prova, i en deixa 20 pendents per a RRHH
update public.plaza_ideas
set status = 'published', published_on = submitted_on + 1
where submitted_on <= current_date - 4;

update public.plaza_ideas
set status = 'rejected', published_on = null
where body_redacted like 'Demanem eliminar completament%'
   or body_redacted like 'Comentari no procedent%'
   or body_redacted like 'Proposta de retirar equips%'
   or body_redacted like 'Peticions individuals que no s''ajusten%'
   or body_redacted like 'Crítica nominativa a companys%'
   or body_redacted like 'Comentari reiterat sense proposta%';

update public.plaza_ideas
set status = 'archived', published_on = submitted_on + 1
where body_redacted like 'Campanya finalitzada%'
   or body_redacted like 'Revisió de tanques perimetrals%'
   or body_redacted like 'Pla pilot d''horaris%'
   or body_redacted like 'Informació sobre el llançament%';

-- Afegeix reaccions (+1 likes) a les idees publicades
insert into app_private.plaza_idea_reactions(idea_id, wallet_digest)
select i.id, extensions.digest('demo-reaction-' || i.id || '-' || n, 'sha256')
from public.plaza_ideas i
cross join generate_series(1, 8) n
where i.status = 'published' and (i.id::text like '%1' or i.id::text like '%3' or i.id::text like '%5' or i.id::text like '%7' or i.id::text like '%9')
on conflict do nothing;

insert into app_private.plaza_idea_reactions(idea_id, wallet_digest)
select i.id, extensions.digest('demo-reaction-extra-' || i.id || '-' || n, 'sha256')
from public.plaza_ideas i
cross join generate_series(1, 4) n
where i.status = 'published'
on conflict do nothing;

-- ===== 7. Preguntes del Dia a La Plaça dels darrers 6 dies =====
delete from public.plaza_daily_questions where question_date >= (now() at time zone 'Europe/Madrid')::date - 5;

-- 1. Avui
with q_today as (
  insert into public.plaza_daily_questions(question_date, prompt, status, min_sample_size, approved_by, approved_at)
  values(
    (now() at time zone 'Europe/Madrid')::date,
    'Com valores la comunicació de canvis i millores a la teva planta o centre de treball?',
    'published', 10, '00000000-0000-4000-a000-000000000001'::uuid, now()
  ) returning id
), o_today as (
  insert into public.plaza_daily_options(question_id, option_key, label, emoji, position)
  select q.id, o.k, o.l, o.e, o.pos
  from q_today q cross join (values
    ('0', 'Molt transparent i àgil', '✨', 1),
    ('1', 'Correcta i puntual', '👍', 2),
    ('2', 'De vegades arriba tard', '⏱️', 3),
    ('3', 'Falta més informació', '📢', 4)
  ) as o(k, l, e, pos) returning id, question_id, option_key
)
insert into app_private.plaza_daily_votes(question_id, option_id)
select o.question_id, o.id from o_today o
cross join generate_series(1, case o.option_key when '0' then 38 when '1' then 46 when '2' then 19 else 11 end);

-- 2. Ahir
with q_d1 as (
  insert into public.plaza_daily_questions(question_date, prompt, status, min_sample_size, approved_by, approved_at)
  values(
    (now() at time zone 'Europe/Madrid')::date - 1,
    'Quina mesura de sostenibilitat o benestar consideres més prioritària a la teva àrea?',
    'published', 10, '00000000-0000-4000-a000-000000000001'::uuid, now() - interval '1 day'
  ) returning id
), o_d1 as (
  insert into public.plaza_daily_options(question_id, option_key, label, emoji, position)
  select q.id, o.k, o.l, o.e, o.pos
  from q_d1 q cross join (values
    ('0', 'Punts de recàrrega i mobilitat', '🚲', 1),
    ('1', 'Reducció de soroll i confort tèrmic', '🔇', 2),
    ('2', 'Opcions més saludables a cantina', '🥗', 3),
    ('3', 'Fonts d''aigua freda addicionals', '💧', 4)
  ) as o(k, l, e, pos) returning id, question_id, option_key
)
insert into app_private.plaza_daily_votes(question_id, option_id)
select o.question_id, o.id from o_d1 o
cross join generate_series(1, case o.option_key when '0' then 29 when '1' then 42 when '2' then 24 else 18 end);

-- 3. Fa 2 dies
with q_d2 as (
  insert into public.plaza_daily_questions(question_date, prompt, status, min_sample_size, approved_by, approved_at)
  values(
    (now() at time zone 'Europe/Madrid')::date - 2,
    'Com valores l''experiència amb la nova app interna de comunicació Damm Pulse?',
    'published', 10, '00000000-0000-4000-a000-000000000001'::uuid, now() - interval '2 days'
  ) returning id
), o_d2 as (
  insert into public.plaza_daily_options(question_id, option_key, label, emoji, position)
  select q.id, o.k, o.l, o.e, o.pos
  from q_d2 q cross join (values
    ('0', 'Molt intuïtiva i ràpida', '📱', 1),
    ('1', 'Correcta i útil', '👌', 2),
    ('2', 'Podria tenir més funcions', '⚙️', 3),
    ('3', 'M''estimo més altres canals', '💬', 4)
  ) as o(k, l, e, pos) returning id, question_id, option_key
)
insert into app_private.plaza_daily_votes(question_id, option_id)
select o.question_id, o.id from o_d2 o
cross join generate_series(1, case o.option_key when '0' then 44 when '1' then 36 when '2' then 16 else 7 end);

-- ===== 8. Recomanacions d'acció People Analytics i Execucions =====
delete from public.action_recommendations;

with actions_data as (
  insert into public.action_recommendations (
    campaign_id, department_id, title, problem_statement, proposed_action,
    action_type, owner_role, due_date, kpi, status, generated_by_ai, requires_human_approval,
    approved_by, approved_by_label, approved_at, implemented_at
  )
  select
    c.id as campaign_id,
    d.id as department_id,
    a.title, a.problem, a.proposed, a.act_type, a.owner_r, a.due_d::date, a.kpi_desc,
    a.st::public.action_status, true, true,
    '00000000-0000-4000-a000-000000000001'::uuid, 'Direcció de People & ESG',
    case when a.st in ('approved','in_progress','implemented') then now() - interval '5 days' else null end,
    case when a.st = 'implemented' then now() - interval '2 days' else null end
  from (values
    ('pols-novembre', 'fabrica',
     'Pla de millora de climatització i ventilació a la sala d''envasat (El Prat)',
     'Detecció reiterada de temperatures altes als torns de tarda a les línies 2 i 3 d''envasat.',
     'Instal·lació de deflectors d''aire i revisió de cabals de ventilació forçada.',
     'workplace_improvement', 'Cap de Planta · Operacions', '2026-12-15', 'Reducció del 40% en queixes de confort tèrmic a la pròxima enquesta', 'approved'),
    ('torns', 'logistica',
     'Publicació anticipada de torns a 3 setmanes de vista (ZAL i Múrcia)',
     'Els operaris de magatzem reclamen més previsió en els torns de cap de setmana per conciliar.',
     'Implementació del mòdul de planificació automatitzada de torns amb visió a 21 dies.',
     'process_change', 'Responsable de Logística i Distribució', '2026-11-30', 'Índex de satisfacció amb la planificació superior a 7,5 sobre 10', 'implemented'),
    ('seguretat-industrial', 'fabrica',
     'Substitució i homologació de nou calçat ergonòmic transpirable per a torns de peu',
     'Detecció de sobrecàrrega plantar en jornades continuades a peu dret.',
     'Distribució de dos models provats amb plantilla ergonòmica i teixit transpirable.',
     'workplace_improvement', 'Servei de Prevenció de Riscos Laborals', '2026-12-01', 'Satisfacció amb EPIs > 8,0', 'approved'),
    ('conciliacio-oficines', 'oficina',
     'Protocol de dimecres a la tarda sense reunions internes a oficines corporatives',
     'La saturació de reunions impedeix el treball de concentració en projectes de fons.',
     'Bloqueig automàtic de calendaris M365 cada dimecres de 14:00 a 18:00.',
     'process_change', 'People & Organització Corporativa', '2026-11-20', 'Disminució del 30% en queixes de saturació de reunions', 'implemented'),
    ('onboarding-talent', 'comercial',
     'Programa de tutorització tècnica durant el primer mes d''onboarding',
     'Els nous gestors comercials Horeca reporten dificultats inicials per accedir a les rutes i CRM.',
     'Assignació obligatòria d''un tutor sènior durant les primeres 4 setmanes amb llista de verificació.',
     'training', 'Cap de Vendes Regional', '2026-12-20', 'Taxa d''adaptació en el primer mes > 85%', 'proposed'),
    ('seguretat-industrial', 'logistica',
     'Senyalització lumínica i passos segurs per a carretons als molls d''expedició',
     'Punts cecs identificats en la cruïlla d''entrada i sortida de carretons als molls de càrrega.',
     'Instal·lació de focus blaus de terra i miralls panoràmics dobles.',
     'workplace_improvement', 'Coordinació de Seguretat i Manteniment', '2026-11-25', 'Zero incidències de trànsit intern de carretons', 'implemented')
  ) as a(camp_slug, dept_code, title, problem, proposed, act_type, owner_r, due_d, kpi_desc, st)
  join public.campaigns c on c.slug = a.camp_slug
  join public.departments d on d.code = a.dept_code
  returning id, title, status
)
insert into public.action_executions (
  action_id, status, payload_preview, requested_by, approved_by, approved_at, executed_at
)
select
  ad.id,
  case when ad.status = 'implemented' then 'delivered'::public.delivery_status
       when ad.status = 'approved' then 'sent'::public.delivery_status
       else 'queued'::public.delivery_status end,
  jsonb_build_object('action_title', ad.title, 'channel', 'teams_notification', 'origin', 'people_analytics_ai'),
  '00000000-0000-4000-a000-000000000001'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  now() - interval '3 days',
  case when ad.status = 'implemented' then now() - interval '1 day' else null end
from actions_data ad;

-- ===== 9. Recompenses i bescanvis demo =====
delete from app_private.reward_redemptions;
update public.rewards set stock_remaining = 500, active = true;

insert into app_private.reward_redemptions (
  synthetic_person_id, reward_id, cost, code, redeemed_on, status, expires_on, consumed_at, consumed_by
)
select
  p.id,
  r.id,
  r.cost,
  'DAMM-' || upper(substring(r.id from 1 for 4)) || '-' || lpad((row_number() over())::text, 4, '0'),
  current_date - (row_number() over() % 20)::int,
  'issued',
  current_date + 45,
  null,
  null
from (select id from public.synthetic_people limit 24) p
cross join lateral (select id, cost from public.rewards order by position limit 1) r;

update app_private.reward_redemptions
set status = 'consumed',
    consumed_at = now() - interval '2 days',
    consumed_by = '00000000-0000-4000-a000-000000000001'::uuid
where id in (select id from app_private.reward_redemptions limit 8);

commit;

-- Resum final de dades generades
select 'synthetic_people' as taula, count(*)::text as total from public.synthetic_people
union all select 'daily_moods', count(*)::text from public.daily_moods
union all select 'campaigns', count(*)::text from public.campaigns
union all select 'survey_responses', count(*)::text from public.survey_responses
union all select 'response_answers', count(*)::text from public.response_answers
union all select 'audience_assignments', count(*)::text from public.audience_assignments
union all select 'plaza_ideas (' || status || ')', count(*)::text from public.plaza_ideas group by status
union all select 'plaza_idea_reactions', count(*)::text from app_private.plaza_idea_reactions
union all select 'plaza_daily_questions', count(*)::text from public.plaza_daily_questions
union all select 'plaza_daily_votes', count(*)::text from app_private.plaza_daily_votes
union all select 'action_recommendations', count(*)::text from public.action_recommendations
union all select 'reward_redemptions', count(*)::text from app_private.reward_redemptions
order by 1;
