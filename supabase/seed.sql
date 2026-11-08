-- Damm Pulse IA demo seed.
-- This file contains 100% synthetic people, official Damm sites, departments (including People / RRHH) and synthetic responses.

insert into public.wellbeing_dimensions (code, label_ca, label_es, label_en, description_ca, display_order) values
  ('benestar', 'Benestar', 'Bienestar', 'Wellbeing', 'Com es viu l’experiència professional.', 1),
  ('lideratge', 'Lideratge', 'Liderazgo', 'Leadership', 'Com es perceben l’acompanyament, la comunicació i el feedback.', 2),
  ('desenvolupament', 'Desenvolupament', 'Desarrollo', 'Development', 'Si hi ha oportunitats per aprendre i créixer.', 3),
  ('cultura', 'Cultura i pertinença', 'Cultura y pertenencia', 'Culture and belonging', 'Si les persones s’identifiquen amb Damm i els seus valors.', 4),
  ('entorn', 'Entorn i relacions', 'Entorno y relaciones', 'Environment and relationships', 'Com es viuen la col·laboració i l’ambient de treball.', 5),
  ('condicions', 'Condicions i organització', 'Condiciones y organización', 'Conditions and organisation', 'Si hi ha recursos i condicions per treballar adequadament.', 6)
on conflict (code) do nothing;

-- 14 Official Sites requested by the user
insert into public.sites (code, name, location, site_type_ca, site_category, default_collective) values
  ('seu_central_bcn', 'Seu central Damm', 'Barcelona', 'Oficines corporatives', 'office', 'oficines'),
  ('cc_damm_el_prat', 'Compañía Cervecera Damm', 'El Prat de Llobregat', 'Fàbrica de cervesa', 'factory', 'fabriques'),
  ('estrella_levante_murcia', 'Estrella de Levante', 'Espinardo, Múrcia', 'Fàbrica de cervesa', 'factory', 'fabriques'),
  ('cervezas_victoria_malaga', 'Cervezas Victoria', 'Màlaga', 'Fàbrica de cervesa', 'factory', 'fabriques'),
  ('font_salem_el_puig', 'Font Salem (El Puig)', 'El Puig, València', 'Fàbrica de begudes', 'factory', 'fabriques'),
  ('font_salem_salem', 'Font Salem (Salem)', 'Salem, València', 'Fàbrica de begudes', 'factory', 'fabriques'),
  ('font_salem_santarem', 'Font Salem (Santarém)', 'Santarém, Portugal', 'Fàbrica de begudes', 'factory', 'fabriques'),
  ('la_moravia_lleida', 'La Moravia', 'Bell-lloc d''Urgell, Lleida', 'Malteria', 'factory', 'fabriques'),
  ('cacaolat_santa_coloma', 'Cacaolat', 'Santa Coloma de Gramenet', 'Fàbrica de begudes làcties', 'factory', 'fabriques'),
  ('cafes_garriga_barbera', 'Cafès Garriga', 'Barberà del Vallès', 'Centre de cafè', 'factory', 'fabriques'),
  ('veri_osca', 'Aguas de San Martín de Veri', 'Osca', 'Planta d''aigua', 'factory', 'fabriques'),
  ('fuente_liviana_conca', 'Fuente Liviana', 'Conca', 'Planta d''aigua', 'factory', 'fabriques'),
  ('logistic_bcn_zal', 'Centre logístic Damm Barcelona (ZAL)', 'Barcelona (ZAL)', 'Logística', 'warehouse', 'logistica'),
  ('logistic_murcia', 'Centre logístic Damm Múrcia', 'Múrcia', 'Logística', 'warehouse', 'logistica')
on conflict (code) do update set
  name = excluded.name,
  location = excluded.location,
  site_type_ca = excluded.site_type_ca,
  site_category = excluded.site_category,
  default_collective = excluded.default_collective;

-- Departments across all 4 macro-collectives (Fàbrica, Logística, Comercial, Oficines) including RRHH / People
insert into public.departments (code, name_ca, name_es, name_en, collective, site_type, synthetic_headcount) values
  ('envasat', 'Envasat', 'Envasado', 'Packaging', 'fabriques', 'factory', 142),
  ('coccio', 'Sala de cocció', 'Sala de cocción', 'Brewhouse', 'fabriques', 'factory', 64),
  ('malta', 'Recepció de malta i malteria', 'Recepción de malta y maltería', 'Malt intake and malting', 'fabriques', 'factory', 38),
  ('fermentacio', 'Fermentació i celler', 'Fermentación y bodega', 'Fermentation and cellar', 'fabriques', 'factory', 41),
  ('manteniment', 'Manteniment industrial', 'Mantenimiento industrial', 'Industrial maintenance', 'fabriques', 'factory', 22),
  ('qualitat', 'Qualitat i seguretat alimentària', 'Calidad y seguridad alimentaria', 'Quality and food safety', 'fabriques', 'factory', 25),
  ('logistica', 'Logística i magatzem', 'Logística y almacén', 'Logistics and warehouse', 'logistica', 'warehouse', 128),
  ('planificacio_logistica', 'Planificació i distribució', 'Planificación y distribución', 'Planning and distribution', 'logistica', 'warehouse', 52),
  ('comercial', 'Comercial Horeca i rutes', 'Comercial Horeca y rutas', 'Horeca sales and routes', 'comercial', 'field', 65),
  ('grans_comptes', 'Grans comptes i Trade Marketing', 'Grandes cuentas y Trade Marketing', 'Key accounts and Trade Marketing', 'comercial', 'field', 30),
  ('rrhh', 'People / Recursos Humans (RRHH)', 'People / Recursos Humanos (RRHH)', 'People / Human Resources (HR)', 'oficines', 'office', 28),
  ('oficines', 'Oficines corporatives i Finances', 'Oficinas corporativas y Finanzas', 'Corporate offices and Finance', 'oficines', 'office', 58),
  ('data_ia_it', 'Data & IA / Tecnologia', 'Data & IA / Tecnología', 'Data & AI / Technology', 'oficines', 'office', 34)
on conflict (code) do update set
  name_ca = excluded.name_ca,
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  collective = excluded.collective,
  site_type = excluded.site_type,
  synthetic_headcount = excluded.synthetic_headcount;

-- Demo Auth users & user_profiles for RRHH (hr_admin, hr_analyst), Department Managers and Integrations
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'rrhh.admin@demo.damm.invalid', '{"synthetic":true,"role":"hr_admin"}'::jsonb),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'people.analytics@demo.damm.invalid', '{"synthetic":true,"role":"hr_analyst"}'::jsonb),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'manager.fabrica@demo.damm.invalid', '{"synthetic":true,"role":"manager"}'::jsonb),
  ('00000000-0000-4000-a000-000000000004'::uuid, 'manager.logistica@demo.damm.invalid', '{"synthetic":true,"role":"manager"}'::jsonb),
  ('00000000-0000-4000-a000-000000000005'::uuid, 'manager.comercial@demo.damm.invalid', '{"synthetic":true,"role":"manager"}'::jsonb),
  ('00000000-0000-4000-a000-000000000006'::uuid, 'manager.oficines@demo.damm.invalid', '{"synthetic":true,"role":"manager"}'::jsonb),
  ('00000000-0000-4000-a000-000000000007'::uuid, 'n8n.service@demo.damm.invalid', '{"synthetic":true,"role":"integration"}'::jsonb)
on conflict (id) do nothing;

insert into public.user_profiles (user_id, app_role, department_id, display_label, preferred_locale)
select u.user_id, u.app_role::public.app_role, d.id, u.display_label, u.preferred_locale
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'hr_admin', 'rrhh', 'Direcció de People & ESG (RRHH)', 'ca'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'hr_analyst', 'rrhh', 'Especialista People Analytics & IA (RRHH)', 'ca'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'manager', 'envasat', 'Responsable de Planta · Envasat', 'ca'),
  ('00000000-0000-4000-a000-000000000004'::uuid, 'manager', 'logistica', 'Responsable de Logística ZAL', 'es'),
  ('00000000-0000-4000-a000-000000000005'::uuid, 'manager', 'comercial', 'Direcció Comercial Horeca', 'es'),
  ('00000000-0000-4000-a000-000000000006'::uuid, 'manager', 'oficines', 'Manager Corporatiu · Seu Central', 'ca'),
  ('00000000-0000-4000-a000-000000000007'::uuid, 'integration', 'data_ia_it', 'Orquestrador n8n & M365 Connector', 'ca')
) as u(user_id, app_role, dept_code, display_label, preferred_locale)
join public.departments d on d.code = u.dept_code
on conflict (user_id) do update set
  app_role = excluded.app_role,
  department_id = excluded.department_id,
  display_label = excluded.display_label;

-- Generate 727 synthetic employees across all 14 Sites and 13 Departments (including RRHH)
with directory_rows as (
  select d.id as department_id, d.code as dept_code, d.collective, d.synthetic_headcount,
         generate_series(1, d.synthetic_headcount) as local_number
  from public.departments d
), numbered as (
  select *, row_number() over (order by dept_code, local_number) as global_number
  from directory_rows
), mapped_site as (
  select n.*,
    case
      when n.dept_code = 'malta' then
        case when n.local_number % 2 = 0 then 'la_moravia_lleida' else 'cc_damm_el_prat' end
      when n.collective = 'fabriques' then
        case n.local_number % 12
          when 0 then 'cc_damm_el_prat'
          when 1 then 'cc_damm_el_prat'
          when 2 then 'estrella_levante_murcia'
          when 3 then 'cervezas_victoria_malaga'
          when 4 then 'font_salem_el_puig'
          when 5 then 'font_salem_salem'
          when 6 then 'font_salem_santarem'
          when 7 then 'la_moravia_lleida'
          when 8 then 'cacaolat_santa_coloma'
          when 9 then 'cafes_garriga_barbera'
          when 10 then 'veri_osca'
          else 'fuente_liviana_conca'
        end
      when n.collective = 'logistica' then
        case n.local_number % 5
          when 0 then 'logistic_bcn_zal'
          when 1 then 'logistic_bcn_zal'
          when 2 then 'logistic_murcia'
          when 3 then 'cc_damm_el_prat'
          else 'font_salem_el_puig'
        end
      when n.collective = 'comercial' then
        case n.local_number % 8
          when 0 then 'seu_central_bcn'
          when 1 then 'cc_damm_el_prat'
          when 2 then 'estrella_levante_murcia'
          when 3 then 'cervezas_victoria_malaga'
          when 4 then 'font_salem_el_puig'
          when 5 then 'font_salem_santarem'
          when 6 then 'cacaolat_santa_coloma'
          else 'cafes_garriga_barbera'
        end
      else -- oficines (including rrhh, oficines, data_ia_it)
        case n.local_number % 10
          when 0 then 'cc_damm_el_prat'
          when 1 then 'estrella_levante_murcia'
          when 2 then 'cervezas_victoria_malaga'
          when 3 then 'font_salem_santarem'
          when 4 then 'cacaolat_santa_coloma'
          else 'seu_central_bcn'
        end
    end as site_code
  from numbered n
)
insert into public.synthetic_people (
  synthetic_code, department_id, site_id, site, site_location, site_type_ca,
  role_family, role_title, shift, manager_level, work_mode,
  preferred_locale, preferred_channel, age_band, tenure_band, birth_date, gender, hire_date
)
select
  'SYN-' || lpad(ms.global_number::text, 4, '0'),
  ms.department_id,
  s.id as site_id,
  s.name as site,
  s.location as site_location,
  s.site_type_ca,
  case
    when ms.dept_code = 'rrhh' then 'people_i_rrhh'
    when ms.dept_code = 'data_ia_it' then 'data_ia_i_tecnologia'
    when ms.dept_code in ('manteniment', 'qualitat') then 'qualitat_i_manteniment'
    when ms.collective = 'fabriques' then 'produccio_i_envasat'
    when ms.dept_code = 'planificacio_logistica' then 'planificacio_i_rutes'
    when ms.collective = 'logistica' then 'magatzem_i_distribucio'
    when ms.dept_code = 'grans_comptes' then 'key_accounts_i_trade'
    when ms.collective = 'comercial' then 'vendes_de_camp'
    else 'corporatiu_i_finances'
  end as role_family,
  case
    when ms.dept_code = 'rrhh' then
      case ms.local_number % 4
        when 0 then 'HR Business Partner (People)'
        when 1 then 'Tècnic/a de Desenvolupament de Persones i Sostenibilitat ESG'
        when 2 then 'Especialista People Analytics i Clima Laboral'
        else 'Responsable de Relacions Laborals i Selecció'
      end
    when ms.dept_code = 'data_ia_it' then
      case ms.local_number % 3
        when 0 then 'Data & IA Engineer'
        when 1 then 'Business Analyst IT'
        else 'Arquitecte/a de Sistemes i Automatització'
      end
    when ms.dept_code = 'envasat' then
      case ms.local_number % 4
        when 0 then 'Cap de torn d''envasat'
        when 1 then 'Operari/ària de línia d''envasat'
        when 2 then 'Especialista de maquinària d''envasat'
        else 'Operari/ària de condicionament'
      end
    when ms.dept_code = 'coccio' then
      case ms.local_number % 3
        when 0 then 'Mestre/a cerveser/a de torn'
        when 1 then 'Operari/ària de sala de cocció'
        else 'Tècnic/a de procés cerveser'
      end
    when ms.dept_code = 'malta' then
      case ms.local_number % 2
        when 0 then 'Tècnic/a de malteria i sitges'
        else 'Operari/ària de recepció de malta'
      end
    when ms.dept_code = 'fermentacio' then
      case ms.local_number % 2
        when 0 then 'Tècnic/a de fermentació i celler'
        else 'Operari/ària de filtració i tancs'
      end
    when ms.dept_code = 'manteniment' then
      case ms.local_number % 2
        when 0 then 'Tècnic/a electromecànic/a'
        else 'Responsable de manteniment preventiu'
      end
    when ms.dept_code = 'qualitat' then
      case ms.local_number % 2
        when 0 then 'Analista de laboratori i qualitat'
        else 'Tècnic/a de seguretat alimentària i medi ambient'
      end
    when ms.dept_code = 'logistica' then
      case ms.local_number % 3
        when 0 then 'Mosso/a de magatzem logístic'
        when 1 then 'Carretoner/a de planta i ZAL'
        else 'Cap d''operacions de moll'
      end
    when ms.dept_code = 'planificacio_logistica' then
      case ms.local_number % 2
        when 0 then 'Planificador/a de rutes i estocs'
        else 'Conductor/a de distribució capil·lar'
      end
    when ms.dept_code = 'comercial' then
      case ms.local_number % 3
        when 0 then 'Gestor/a comercial Horeca'
        when 1 then 'Delegat/da de vendes de zona'
        else 'Cap d''àrea comercial'
      end
    when ms.dept_code = 'grans_comptes' then
      case ms.local_number % 2
        when 0 then 'Key Account Manager'
        else 'Trade Marketing Specialist'
      end
    else
      case ms.local_number % 3
        when 0 then 'Analista financer/a i control de gestió'
        when 1 then 'Tècnic/a de màrqueting i comunicació'
        else 'Administratiu/iva corporatiu/iva'
      end
  end as role_title,
  case
    when ms.collective = 'comercial' then 'route'
    when ms.collective = 'oficines' then 'flexible'
    when ms.local_number % 5 = 0 then 'night'
    when ms.local_number % 3 = 0 then 'afternoon'
    else 'morning'
  end as shift,
  case
    when ms.local_number % 50 = 0 then 'director'
    when ms.local_number % 18 = 0 then 'manager'
    when ms.local_number % 9 = 0 then 'team_lead'
    else 'individual'
  end as manager_level,
  case ms.collective when 'comercial' then 'field' when 'oficines' then 'hybrid' else 'onsite' end as work_mode,
  case when ms.local_number % 20 = 0 then 'en' when ms.local_number % 5 in (0, 1) then 'es' else 'ca' end as preferred_locale,
  case
    when ms.collective in ('fabriques', 'logistica') then 'mobile_qr'::public.channel_type
    when ms.collective = 'oficines' then 'teams'::public.channel_type
    else 'web'::public.channel_type
  end as preferred_channel,
  case ms.local_number % 4 when 0 then '18-29' when 1 then '30-39' when 2 then '40-49' else '50+' end as age_band,
  case ms.local_number % 4 when 0 then '<1' when 1 then '1-3' when 2 then '4-9' else '10+' end as tenure_band,
  case ms.local_number % 4
    when 0 then make_date(1997 + (ms.local_number % 11), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
    when 1 then make_date(1987 + (ms.local_number % 10), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
    when 2 then make_date(1977 + (ms.local_number % 10), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
    else make_date(1959 + (ms.local_number % 18), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
  end as birth_date,
  case
    when ms.local_number % 100 = 98 then 'non_binary'
    when ms.local_number % 100 = 99 then 'not_disclosed'
    when ms.local_number % 100 < case ms.collective when 'fabriques' then 28 when 'logistica' then 27 when 'comercial' then 38 else 54 end then 'woman'
    else 'man'
  end as gender,
  case ms.local_number % 4
    when 0 then make_date(2026, 1 + (ms.local_number % 10), 1 + (ms.local_number % 28))
    when 1 then make_date(2023 + (ms.local_number % 3), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
    when 2 then make_date(2017 + (ms.local_number % 6), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
    else make_date(2000 + (ms.local_number % 17), 1 + (ms.local_number % 12), 1 + (ms.local_number % 28))
  end as hire_date
from mapped_site ms
join public.sites s on s.code = ms.site_code
on conflict (synthetic_code) do update set
  department_id = excluded.department_id,
  site_id = excluded.site_id,
  site = excluded.site,
  site_location = excluded.site_location,
  site_type_ca = excluded.site_type_ca,
  role_family = excluded.role_family,
  role_title = excluded.role_title;

insert into public.campaigns (
  slug, name, objective, context, prohibited_topics, status, target_filter,
  max_duration_seconds, privacy_threshold, target_population, opens_at, closes_at,
  created_by, approved_by, approved_by_label, approved_at, published_at
) values
  ('seguretat-industrial', 'Seguretat i Prevenció de Riscos a Planta',
   'Auditoria de seguretat, EPIs, climatització i protocols operatius.',
   'Diagnòstic de condicions ergonòmiques, equips de protecció i detecció de riscos.',
   array['rendiment individual', 'salut diagnosticada'], 'published',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","manteniment"],"channels":["qr","app","teams"],"locale":"ca","dimensions":{"q1":"Seguretat","q2":"EPIs","q3":"Prevenció","q4":"Condicions","q5":"Riscos"}}}',
   53, 10, 332, '2026-10-20 08:00+02', '2026-11-15 23:00+01',
   '00000000-0000-4000-a000-000000000001'::uuid,
   '00000000-0000-4000-a000-000000000001'::uuid,
   'Direcció de People & ESG (RRHH)', '2026-10-18 10:00+02', '2026-10-20 08:00+02'),
  ('pols-novembre', 'Pols mensual · Novembre 2026',
   'Seguiment periòdic del benestar, descans i comunicació a fàbriques i oficines.',
   'Enquesta periòdica general amb indicador de satisfacció, comunicació interna i suport.',
   array['rendiment individual', 'salut diagnosticada'], 'published',
   '{"hr":{"zones":["envasat","logistica","coccio","malta","fermentacio","oficines","comercial","manteniment"],"channels":["qr","app","teams","placa","world"],"locale":"ca"}}',
   65, 10, 727, '2026-11-01 08:00+01', '2026-11-20 23:00+01',
   '00000000-0000-4000-a000-000000000001'::uuid,
   '00000000-0000-4000-a000-000000000001'::uuid,
   'Direcció de People & ESG (RRHH)', '2026-10-28 10:00+01', '2026-11-01 08:00+01'),
  ('torns', 'Torns, Descans i Conciliació a Planta',
   'Avaluar l’impacte dels torns rotatius de 8h i els temps de recuperació física.',
   'Enquesta centrada en les línies de producció i magatzem sobre calendaris i sobrecàrrega.',
   array['rendiment individual'], 'published',
   '{"hr":{"zones":["envasat","logistica","coccio"],"channels":["qr","app","teams","placa"],"locale":"ca"}}',
   58, 10, 347, '2026-11-04 08:00+01', '2026-11-25 23:00+01',
   '00000000-0000-4000-a000-000000000001'::uuid,
   '00000000-0000-4000-a000-000000000001'::uuid,
   'Direcció de People & ESG (RRHH)', '2026-11-02 10:00+01', '2026-11-04 08:00+01'),
  ('conciliacio-oficines', 'Flexibilitat, Eines Digitals i Oficines',
   'Mesurar la conciliació en el model híbrid i la reducció de reunions.',
   'Enquesta enfocada a la seu central, finances, màrqueting, IT i equips comercials.',
   array['rendiment individual'], 'published',
   '{"hr":{"zones":["oficines","comercial"],"channels":["teams","email","app"],"locale":"ca"}}',
   57, 10, 215, '2026-10-25 08:00+02', '2026-11-18 23:00+01',
   '00000000-0000-4000-a000-000000000001'::uuid,
   '00000000-0000-4000-a000-000000000001'::uuid,
   'Direcció de People & ESG (RRHH)', '2026-10-23 10:00+02', '2026-10-25 08:00+02'),
  ('onboarding-talent', 'Experiència d’Acollida i Onboarding',
   'Acompanyament i valoració de les incorporacions dels darrers mesos.',
   'Enquesta breu als nous membres sobre rebuda, tutorització i recursos inicials.',
   array['rendiment individual'], 'published',
   '{"hr":{"zones":["envasat","logistica","coccio","oficines","comercial"],"channels":["app","teams","email","qr"],"locale":"ca"}}',
   55, 10, 148, '2026-10-15 08:00+02', '2026-11-30 23:00+01',
   '00000000-0000-4000-a000-000000000001'::uuid,
   '00000000-0000-4000-a000-000000000001'::uuid,
   'Direcció de People & ESG (RRHH)', '2026-10-13 10:00+02', '2026-10-15 08:00+02')
on conflict (slug) do nothing;

insert into public.questionnaire_versions (
  campaign_id, version, status, estimated_seconds, generated_by_ai,
  generation_rationale, approved_by, approved_by_label, approved_at
)
select c.id, 1, 'published'::public.questionnaire_status, c.max_duration_seconds, true,
       'Preguntes breus adaptades als canals mòbil, QR i Teams; revisades per una persona de RRHH.',
       '00000000-0000-4000-a000-000000000001'::uuid, 'Direcció de People & ESG (RRHH)', c.approved_at
from public.campaigns c
where c.slug in ('seguretat-industrial', 'pols-novembre', 'torns', 'conciliacio-oficines', 'onboarding-talent')
on conflict (campaign_id, version) do nothing;

insert into public.questionnaire_translations (
  questionnaire_version_id, locale, title, introduction, closing_message, transparency_notice
)
select qv.id, 'ca', c.name, c.context, 'Gràcies. Tornarem amb el que hem après i què farem.', 'Les respostes són sintètiques i només es mostren agregades amb 10 o més persones.'
from public.questionnaire_versions qv
join public.campaigns c on c.id = qv.campaign_id
where c.slug in ('seguretat-industrial', 'pols-novembre', 'torns', 'conciliacio-oficines', 'onboarding-talent')
on conflict (questionnaire_version_id, locale) do nothing;

with question_templates(stable_key, position, dimension_code, question_type, scale_min, scale_max) as (values
  ('q1', 1::smallint, 'benestar', 'scale'::public.question_type, 1::smallint, 5::smallint),
  ('q2', 2::smallint, 'lideratge', 'scale'::public.question_type, 1::smallint, 5::smallint),
  ('q3', 3::smallint, 'desenvolupament', 'scale'::public.question_type, 1::smallint, 5::smallint),
  ('q4', 4::smallint, 'cultura', 'scale'::public.question_type, 1::smallint, 5::smallint),
  ('q5', 5::smallint, 'condicions', 'scale'::public.question_type, 1::smallint, 5::smallint),
  ('q6', 6::smallint, 'entorn', 'open_text'::public.question_type, null::smallint, null::smallint)
)
insert into public.questions (
  questionnaire_version_id, dimension_id, stable_key, position, question_type,
  required, scale_min, scale_max
)
select qv.id, wd.id, qt.stable_key, qt.position, qt.question_type,
       qt.stable_key <> 'q6', qt.scale_min, qt.scale_max
from public.questionnaire_versions qv
join public.campaigns c on c.id = qv.campaign_id
cross join question_templates qt
join public.wellbeing_dimensions wd on wd.code = qt.dimension_code
where c.slug in ('seguretat-industrial', 'pols-novembre', 'torns', 'conciliacio-oficines', 'onboarding-talent')
on conflict (questionnaire_version_id, stable_key) do nothing;

with translations(stable_key, locale, prompt, help_text) as (values
  ('q1', 'ca', 'Com valores el teu benestar a la feina aquesta setmana?', 'De molt baix a molt alt'),
  ('q1', 'es', '¿Cómo valoras tu bienestar en el trabajo esta semana?', 'De muy bajo a muy alto'),
  ('q1', 'en', 'How would you rate your wellbeing at work this week?', 'From very low to very high'),
  ('q2', 'ca', 'Reps la informació i l’acompanyament que necessites?', null),
  ('q2', 'es', '¿Recibes la información y el apoyo que necesitas?', null),
  ('q2', 'en', 'Do you get the information and support you need?', null),
  ('q3', 'ca', 'Tens oportunitats reals d’aprendre i créixer?', null),
  ('q3', 'es', '¿Tienes oportunidades reales de aprender y crecer?', null),
  ('q3', 'en', 'Do you have real opportunities to learn and grow?', null),
  ('q4', 'ca', 'Et sents part de Damm i del que representa?', null),
  ('q4', 'es', '¿Te sientes parte de Damm y de lo que representa?', null),
  ('q4', 'en', 'Do you feel part of Damm and what it stands for?', null),
  ('q5', 'ca', 'Tens els recursos i l’organització necessaris per treballar bé?', null),
  ('q5', 'es', '¿Tienes los recursos y la organización necesarios para trabajar bien?', null),
  ('q5', 'en', 'Do you have the resources and organisation needed to work well?', null),
  ('q6', 'ca', 'Què canviaria més el teu dia a dia?', 'No incloguis noms ni dades personals.'),
  ('q6', 'es', '¿Qué cambiaría más tu día a día?', 'No incluyas nombres ni datos personales.'),
  ('q6', 'en', 'What one change would most improve your day?', 'Do not include names or personal information.')
)
insert into public.question_translations (question_id, locale, prompt, help_text)
select q.id, t.locale, t.prompt, t.help_text
from public.questions q
join translations t on t.stable_key = q.stable_key
on conflict (question_id, locale) do nothing;

insert into public.audience_assignments (
  campaign_id, synthetic_person_id, channel, locale, status, access_token_digest,
  invited_at, responded_at
)
select c.id, sp.id, sp.preferred_channel, sp.preferred_locale,
       case
         when substring(sp.synthetic_code from 5)::integer <= 245 then 'responded'::public.assignment_status
         else 'invited'::public.assignment_status
       end,
       case
         when substring(sp.synthetic_code from 5)::integer <= 245 then null
         else extensions.digest('demo-' || c.slug || '-' || sp.synthetic_code || '-2026', 'sha256')
       end,
       '2026-10-20 09:00+02'::timestamptz,
       case
         when substring(sp.synthetic_code from 5)::integer <= 245 then '2026-10-28 12:00+02'::timestamptz
         else null
       end
from public.campaigns c
cross join public.synthetic_people sp
where c.slug = 'seguretat-industrial'
on conflict (campaign_id, synthetic_person_id) do nothing;

with selected_people as (
  select sp.*, d.collective,
         row_number() over (order by sp.synthetic_code) as rn
  from public.synthetic_people sp
  join public.departments d on d.id = sp.department_id
), campaign_samples as (
  select c.id as campaign_id, c.slug, qv.id as questionnaire_version_id,
         sp.*, date '2026-10-01' as period_start
  from public.campaigns c
  join public.questionnaire_versions qv on qv.campaign_id = c.id and qv.status = 'published'
  join selected_people sp on sp.rn <= 245
  where c.slug = 'seguretat-industrial'
)
insert into public.survey_responses (
  campaign_id, questionnaire_version_id, submitted_at, period_start, channel, locale,
  department_id, collective, shift, manager_level, age_band, tenure_band,
  duration_seconds, session_nonce, synthetic
)
select campaign_id, questionnaire_version_id,
       period_start::timestamptz + make_interval(hours => 8 + (rn % 10)::int, mins => (rn * 7 % 60)::int),
       period_start, preferred_channel, preferred_locale, department_id, collective,
       shift, manager_level, age_band, tenure_band, 45 + (rn % 55)::int,
       md5(campaign_id::text || id::text)::uuid, true
from campaign_samples cs
where not exists (
  select 1 from public.survey_responses sr
  where sr.campaign_id = cs.campaign_id and sr.period_start = cs.period_start
    and sr.session_nonce = md5(cs.campaign_id::text || cs.id::text)::uuid
);

with score_questions as (
  select q.id as question_id, q.questionnaire_version_id, q.stable_key
  from public.questions q
  where q.question_type = 'scale'
)
insert into public.response_answers(response_id, question_id, numeric_value)
select sr.id, q.question_id,
       greatest(1, least(5,
         case d.code
           when 'envasat' then 2 + ((extract(day from sr.submitted_at)::int + length(q.stable_key)) % 3)
           when 'logistica' then 2 + (extract(day from sr.submitted_at)::int % 3)
           when 'rrhh' then 4 + (extract(day from sr.submitted_at)::int % 2)
           when 'oficines' then 3 + (extract(day from sr.submitted_at)::int % 3)
           else 3 + (extract(day from sr.submitted_at)::int % 2)
         end
       ))::numeric
from public.survey_responses sr
join public.departments d on d.id = sr.department_id
join score_questions q on q.questionnaire_version_id = sr.questionnaire_version_id
on conflict (response_id, question_id) do nothing;

with open_questions as (
  select q.id as question_id, q.questionnaire_version_id
  from public.questions q
  where q.question_type = 'open_text'
), comment_bank as (
  select * from (values
    ('ca', 0, 'Al moll de càrrega hi ha un punt cec amb les carretilles quan es creua el pas de vianants.'),
    ('ca', 1, 'A la zona d’envasat fa molta calor a la tarda; caldria revisar la ventilació.'),
    ('ca', 2, 'Les ulleres de protecció de recanvi s’acaben ràpid al torn de nit.'),
    ('ca', 3, 'M’agrada l’ambient i poder aprendre amb la gent que té més experiència.')
  ) as bank(locale, variant, comment)
)
insert into public.response_answers(response_id, question_id, free_text_redacted)
select sr.id, oq.question_id, cb.comment
from public.survey_responses sr
join open_questions oq on oq.questionnaire_version_id = sr.questionnaire_version_id
join comment_bank cb on cb.locale = sr.locale and cb.variant = (extract(day from sr.submitted_at)::int % 4)
on conflict (response_id, question_id) do nothing;

insert into public.analysis_runs (
  campaign_id, status, model_provider, model_name, prompt_version, sample_size,
  coverage_ratio, confidence_label, executive_summary, limitations,
  input_fingerprint, requested_by, reviewed_by, reviewed_at, started_at, completed_at
)
select c.id, 'approved', 'demo-local', 'aggregate-people-analytics-v1', 'damm-2026-11-v1',
       count(sr.id), count(sr.id)::numeric / nullif(c.target_population, 0),
       case when count(sr.id)::numeric / nullif(c.target_population, 0) >= 0.45 then 'high' else 'medium' end,
       'La percepció de seguretat i EPIs a planta és sòlida. Els punts cecs a magatzem i la ventilació concentren les millores operatives proposades.',
       array['Dades 100% sintètiques', 'Les associacions no demostren causalitat', 'Els segments amb menys de 10 respostes no es publiquen'],
       encode(extensions.digest(c.slug || '-seed-v1', 'sha256'), 'hex'),
       '00000000-0000-4000-a000-000000000002'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       max(sr.submitted_at) + interval '5 minutes',
       max(sr.submitted_at), max(sr.submitted_at) + interval '2 minutes'
from public.campaigns c
join public.survey_responses sr on sr.campaign_id = c.id
where c.slug = 'seguretat-industrial'
group by c.id
on conflict (campaign_id, input_fingerprint) do nothing;

insert into public.analytics_segments (
  analysis_run_id, campaign_id, department_id, period_start, sample_size, target_size,
  participation_rate, average_score, previous_score, sentiment_score, confidence_label
)
select ar.id, ar.campaign_id, sr.department_id, sr.period_start, count(distinct sr.id), d.synthetic_headcount,
       count(distinct sr.id)::numeric / nullif(d.synthetic_headcount, 0),
       round((avg(ra.numeric_value) * 2)::numeric, 2),
       round((avg(ra.numeric_value) * 2 + 0.4)::numeric, 2),
       round(((avg(ra.numeric_value) - 3) / 2)::numeric, 4),
       case when count(distinct sr.id) >= 40 then 'high' when count(distinct sr.id) >= 20 then 'medium' else 'low' end
from public.analysis_runs ar
join public.survey_responses sr on sr.campaign_id = ar.campaign_id
join public.departments d on d.id = sr.department_id
join public.response_answers ra on ra.response_id = sr.id and ra.numeric_value is not null
group by ar.id, ar.campaign_id, sr.department_id, sr.period_start, d.synthetic_headcount
having count(distinct sr.id) >= 10
on conflict do nothing;

insert into public.analysis_insights (
  analysis_run_id, campaign_id, department_id, dimension_id, title, summary,
  signal_type, priority, evidence, sample_size, human_validated, validated_by, validated_at
)
select ar.id, ar.campaign_id, d.id, wd.id,
       'Millora de visibilitat al moll de càrrega',
       'Els comentaris d’envasat i magatzem repeteixen la necessitat de senyalització clara per als passos de vianants.',
       'risk', 5, '{"theme":"seguretat","trend":"stable","source":"aggregate_comments"}',
       greatest(10, least(ar.sample_size, 69)), true,
       '00000000-0000-4000-a000-000000000001'::uuid, now()
from public.analysis_runs ar
join public.campaigns c on c.id = ar.campaign_id and c.slug = 'seguretat-industrial'
join public.departments d on d.code = 'envasat'
join public.wellbeing_dimensions wd on wd.code = 'condicions'
where not exists (select 1 from public.analysis_insights ai where ai.analysis_run_id = ar.id and ai.title = 'Millora de visibilitat al moll de càrrega');

insert into public.action_recommendations (
  campaign_id, analysis_run_id, insight_id, department_id, dimension_id,
  title, problem_statement, proposed_action, action_type, owner_role, due_date,
  kpi, status, generated_by_ai
)
select ai.campaign_id, ai.analysis_run_id, ai.id, ai.department_id, ai.dimension_id,
       'Senyalitzar passos de vianants i instal·lar miralls convexos',
       'Hi ha punts cecs amb trànsit de carretons quan es creua el moll.',
       'Pintar passos reflectants i instal·lar dos miralls panoràmics al passadís principal de magatzem.',
       'process_change', 'Prevenció de Riscos Laborals (PRL)', date '2026-12-15',
       '100% punts cecs senyalitzats i zero incidències', 'proposed', true
from public.analysis_insights ai
where ai.title = 'Millora de visibilitat al moll de càrrega'
  and not exists (select 1 from public.action_recommendations a where a.insight_id = ai.id);

insert into public.integration_connections (provider, name, status, configuration, secret_reference, created_by) values
  ('microsoft_teams', 'Teams People - Demo', 'demo', '{"mode":"adaptive_card","channel_strategy":"by_collective"}', 'TEAMS_WEBHOOK_URL', '00000000-0000-4000-a000-000000000001'::uuid),
  ('typeform', 'Typeform - Demo', 'demo', '{"mode":"forms_api","local_fallback":true}', 'TYPEFORM_TOKEN', '00000000-0000-4000-a000-000000000001'::uuid),
  ('n8n', 'n8n local', 'connected', '{"base_path":"/webhook","workflows":["generate-survey","publish-survey","ingest-responses","analytics"]}', 'N8N_API_KEY', '00000000-0000-4000-a000-000000000001'::uuid)
on conflict (provider, name) do nothing;
