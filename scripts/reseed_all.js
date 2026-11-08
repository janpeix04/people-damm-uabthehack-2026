import pg from 'pg';

const db = new pg.Client({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 54322),
  database: process.env.POSTGRES_DB || 'damm_pulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function main() {
  await db.connect();
  console.log('Connected to PostgreSQL.');

  await db.query('BEGIN');
  try {
    // 1. Delete unwanted surveys and their responses
    console.log('[1/5] Removing unwanted surveys (test, aadas, test conect, pols-clima-octubre, pols-torns-novembre, seguiment-desembre)...');
    const deleteResp = await db.query(`
      delete from public.survey_responses where campaign_id in (
        select id from public.campaigns where slug in ('pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre', 'enquesta-bf7a2870-3813-4562-9f5e-a38d0e646777', 'enquesta-dbf52731-f110-4d23-b09c-eed75819e03a', 'enquesta-2ef8747e-0219-4c2c-ba2f-9fef7093d8aa')
          or lower(name) in ('test', 'aadas', 'test conect')
      );
    `);
    console.log(`  Deleted ${deleteResp.rowCount} old survey responses.`);

    const deleteCamp = await db.query(`
      delete from public.campaigns where slug in ('pols-clima-octubre', 'pols-torns-novembre', 'seguiment-desembre', 'enquesta-bf7a2870-3813-4562-9f5e-a38d0e646777', 'enquesta-dbf52731-f110-4d23-b09c-eed75819e03a', 'enquesta-2ef8747e-0219-4c2c-ba2f-9fef7093d8aa')
        or lower(name) in ('test', 'aadas', 'test conect');
    `);
    console.log(`  Deleted ${deleteCamp.rowCount} old campaigns.`);

    // 2. Ensure all 5 campaigns exist
    console.log('[2/5] Seeding the 5 official campaigns (pols-novembre, seguretat-industrial, torns, conciliacio-oficines, onboarding-talent)...');
    await db.query(`
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
    `);

    // Questionnaire versions & translations
    await db.query(`
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
    `);

    // Questions
    await db.query(`
      create temp table if not exists demo_questions(slug text, pos smallint, qtype public.question_type, smin smallint, smax smallint, prompt text, options jsonb) on commit drop;
      truncate demo_questions;
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
    `);

    // Audience & Responses
    console.log('[3/5] Generating audience assignments and survey responses...');
    await db.query(`
      create temp table if not exists demo_audience on commit drop as
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

      create temp table if not exists demo_resp on commit drop as
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
    `);

    // 4. Seed Plaza Ideas & Reactions
    console.log('[4/5] Seeding Plaza Ideas (published & pending) and idea reactions...');
    await db.query(`delete from public.plaza_ideas;`);

    const ideaRows = [
      // Published ideas across official sites and categories
      { cat: 'descans-torns', site: 'cc_damm_el_prat', pub: true, text: "Els nous calendaris de torns publicats amb tres setmanes d'antelació ens ajuden molt a conciliar amb la família." },
      { cat: 'descans-torns', site: 'cc_damm_el_prat', pub: true, text: "A la línia d'envasat necessitaríem 5 minuts més de solapament entre torns per traspassar incidències sense presses." },
      { cat: 'descans-torns', site: 'logistic_bcn_zal', pub: true, text: "Al moll de càrrega els divendres a la tarda tenim pics molt forts; reforçar el torn evitaria retards." },
      { cat: 'descans-torns', site: 'font_salem_el_puig', pub: true, text: "Les noves pauses escalonades han donat una mica d'aire fresc a la línia d'omplidores." },
      { cat: 'seguretat', site: 'cc_damm_el_prat', pub: true, text: "Molt bona iniciativa la revisió de calçat ergonòmic per a les jornades de peu." },
      { cat: 'seguretat', site: 'estrella_levante_murcia', pub: true, text: "Les noves ulleres protectores graduades són molt més còmodes i no s'entelen amb la calor." },
      { cat: 'seguretat', site: 'cervezas_victoria_malaga', pub: true, text: "Molt bona reacció dels equips de prevenció davant la petita incidència al circuit de vapor." },
      { cat: 'seguretat', site: 'font_salem_salem', pub: true, text: "La senyalització dels passos de vianants entre naus ha millorat notablement la seguretat." },
      { cat: 'comunicacio', site: 'seu_central_bcn', pub: true, text: "L'app interna de Damm Pulse funciona molt bé per consultar el menú de la cantina i els torns." },
      { cat: 'comunicacio', site: 'cervezas_victoria_malaga', pub: true, text: "Proposo fer un resum de 2 minuts de les millores de planta a les pantalles de la cantina." },
      { cat: 'comunicacio', site: 'cc_damm_el_prat', pub: true, text: "Molt agraïts per les explicacions curtes d'arrencada de torn que fan els caps d'equip." },
      { cat: 'comunicacio', site: 'cacaolat_santa_coloma', pub: true, text: "Els canals digitals han fet molt més fàcil seguir les novetats sense dependre de paper." },
      { cat: 'ambient', site: 'cc_damm_el_prat', pub: true, text: "Molt bon ambient i acollida als nous companys que s'han incorporat a la secció de cocció." },
      { cat: 'ambient', site: 'seu_central_bcn', pub: true, text: "La iniciativa dels divendres de celebració d'equip fa que vingui molt de gust treballar junts." },
      { cat: 'ambient', site: 'la_moravia_lleida', pub: true, text: "L'esperit d'equip a malteria és excel·lent, tothom dona un cop de mà quan cal." },
      { cat: 'installacions', site: 'cc_damm_el_prat', pub: true, text: "La nova climatització a la sala d'envasat ha reduït molt la calor als torns de tarda." },
      { cat: 'installacions', site: 'seu_central_bcn', pub: true, text: "Caldria instal·lar un punt addicional de càrrega per a bicicletes i patinets al pàrquing." },
      { cat: 'installacions', site: 'logistic_murcia', pub: true, text: "Els nous llums LED al magatzem han millorat la visibilitat als passadissos alts." },
      { cat: 'altres', site: 'seu_central_bcn', pub: true, text: "La reducció de plàstic d'un sol ús a totes les plantes és un orgull per a la sostenibilitat de Damm." },
      { cat: 'altres', site: 'la_moravia_lleida', pub: true, text: "Molt recomanable la formació pràctica de tast de malta i matèries primeres." },
      // Pending ideas (moderation queue for HR)
      { cat: 'descans-torns', site: 'cc_damm_el_prat', pub: false, text: "Proposo revisar la rotació de caps de setmana per tal que sigui més equilibrada entre torns." },
      { cat: 'comunicacio', site: 'seu_central_bcn', pub: false, text: "Estaria bé tenir un dia al mes completament lliure de reunions per poder concentrar-nos en projectes de fons." },
      { cat: 'installacions', site: 'logistic_bcn_zal', pub: false, text: "Seria de gran ajuda disposar d'una font d'aigua freda addicional a prop de les portes 12 i 14 del moll." },
      { cat: 'seguretat', site: 'font_salem_el_puig', pub: false, text: "Cal repintar les marques vials de carretons a la intersecció amb el taller de manteniment." }
    ];

    for (const item of ideaRows) {
      const ins = await db.query(`
        insert into public.plaza_ideas(category_id, body_redacted, site_id)
        values($1, $2, (select id from public.sites where code=$3))
        returning id
      `, [item.cat, item.text, item.site]);
      const id = ins.rows[0].id;

      if (item.pub) {
        await db.query(`update public.plaza_ideas set status='published' where id=$1`, [id]);
        // Insert 1-4 reactions for published ideas
        const numLikes = Math.floor(Math.random() * 4) + 1;
        for (let l = 1; l <= numLikes; l++) {
          await db.query(`
            insert into app_private.plaza_idea_reactions(idea_id, wallet_digest)
            values($1, extensions.digest($2, 'sha256'))
            on conflict do nothing
          `, [id, `demo-voter-${l}-${item.site}`]);
        }
      }
    }
    console.log(`  Seeded ${ideaRows.length} ideas with reactions.`);

    // 5. Seed Plaza Daily Questions
    console.log('[5/5] Seeding Plaza Daily Question & Votes...');
    await db.query(`delete from public.plaza_daily_questions where question_date = (now() at time zone 'Europe/Madrid')::date;`);
    const qIns = await db.query(`
      insert into public.plaza_daily_questions(question_date, prompt, status, min_sample_size, approved_by, approved_at)
      values((now() at time zone 'Europe/Madrid')::date, 'Com valores la comunicació de canvis i millores a la teva planta o centre de treball?', 'published', 10, '00000000-0000-4000-a000-000000000001'::uuid, now())
      returning id;
    `);
    const qId = qIns.rows[0].id;

    const optLabels = [
      { key: '0', label: 'Molt transparent i àgil', emoji: '✨' },
      { key: '1', label: 'Correcta i puntual', emoji: '👍' },
      { key: '2', label: 'De vegades arriba tard', emoji: '⏱️' },
      { key: '3', label: 'Falta més informació', emoji: '📢' },
    ];

    const optIds = [];
    for (let i = 0; i < optLabels.length; i++) {
      const o = optLabels[i];
      const optRes = await db.query(`
        insert into public.plaza_daily_options(question_id, option_key, label, emoji, position)
        values($1, $2, $3, $4, $5)
        returning id;
      `, [qId, o.key, o.label, o.emoji, i + 1]);
      optIds.push(optRes.rows[0].id);
    }

    // Add 42 anonymous votes across the options
    const voteCounts = [14, 18, 7, 3];
    for (let oIdx = 0; oIdx < optIds.length; oIdx++) {
      for (let v = 0; v < voteCounts[oIdx]; v++) {
        await db.query(`
          insert into app_private.plaza_daily_votes(question_id, option_id)
          values($1, $2);
        `, [qId, optIds[oIdx]]);
      }
    }
    console.log(`  Seeded daily question with ${optIds.length} options and 42 votes.`);

    await db.query('COMMIT');
    console.log('\n✓ Transaction successfully committed!');

    // Print summary
    const campSummary = await db.query(`
      select c.slug, c.name,
        (select count(*)::int from public.survey_responses r where r.campaign_id=c.id) responses,
        (select count(*)::int from public.audience_assignments a where a.campaign_id=c.id) target
      from public.campaigns c order by responses desc;
    `);
    console.log('\n--- Active Campaigns ---');
    console.table(campSummary.rows);

    const ideaSummary = await db.query(`
      select status, count(*)::int from public.plaza_ideas group by status;
    `);
    console.log('\n--- Plaza Ideas ---');
    console.table(ideaSummary.rows);

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Failed:', err);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
