import { randomUUID } from 'node:crypto';

export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const zones = {
  malta: ['fabrica'], coccio: ['fabrica'], fermentacio: ['fabrica'], envasat: ['fabrica'],
  manteniment: ['fabrica'], logistica: ['logistica'],
  oficines: ['oficina'], comercial: ['comercial'],
};
const channels = ['qr', 'app', 'teams', 'email', 'placa', 'world'];
const date = v => v instanceof Date ? v.toISOString() : v;

export async function listSurveys(db, slug) {
  const campaigns = (await db.query(`select c.*,
    (select count(*)::int from public.survey_responses r where r.campaign_id=c.id) responses,
    (select count(*)::int from public.audience_assignments a where a.campaign_id=c.id) target
    from public.campaigns c ${slug ? 'where c.slug=$1' : ''} order by c.created_at desc`, slug ? [slug] : [])).rows;
  const result = [];
  for (const c of campaigns) {
    const v = (await db.query('select * from public.questionnaire_versions where campaign_id=$1 order by version desc limit 1', [c.id])).rows[0];
    if (!v) continue;
    const locale = c.target_filter.hr?.locale || 'ca';
    const t = (await db.query('select * from public.questionnaire_translations where questionnaire_version_id=$1 order by (locale=$2) desc, (locale=\'ca\') desc limit 1', [v.id, locale])).rows[0];
    const qs = (await db.query(`select q.*, t.prompt, t.help_text, t.options from public.questions q
      join lateral (select * from public.question_translations t where t.question_id=q.id
        order by (t.locale=$2) desc, (t.locale='ca') desc limit 1) t on true
      where q.questionnaire_version_id=$1 order by q.position`, [v.id, locale])).rows;
    result.push({ id: c.slug, title: t?.title || c.name, goal: c.objective,
      status: c.status === 'published' ? (c.closes_at && new Date(c.closes_at) <= new Date() ? 'closed' : c.opens_at && new Date(c.opens_at) > new Date() ? 'scheduled' : 'open') : ['closed', 'archived'].includes(c.status) ? 'closed' : 'draft',
      departmentCodes:c.target_filter.hr?.departmentCodes,
      zones: c.target_filter.hr?.zones || [...new Set((c.target_filter.collectives || ['fabriques']).flatMap(x => ({fabriques:['envasat','manteniment'],logistica:['logistica'],oficines:['oficines'],comercial:['comercial']})[x] || []))], channels: c.target_filter.hr?.channels || ['app'],
      locale, intro: t?.introduction, opensAt: date(c.opens_at), closesAt: date(c.closes_at), createdAt: date(c.created_at),
      responses: c.responses, target: c.target, source: 'db',
      questions: qs.map(q => ({id:q.id, text:q.prompt, dim:c.target_filter.hr?.dimensions?.[q.stable_key] || '',
        type: ({scale:'scale', single_choice:'list',multi_choice:'list',boolean:'yesno',open_text:'text'})[q.question_type],
        dbType:q.question_type, required:q.required, min:q.scale_min ?? undefined, max:q.scale_max ?? undefined,
        options:q.options, help:q.help_text, secs:q.question_type==='open_text'?20:10})),
    });
  }
  return result;
}

function validate(s, approved) {
  if (!s || typeof s.title !== 'string' || !s.title.trim() || s.title.length > 200 || typeof s.goal !== 'string' || !s.goal.trim()) throw new InputError('Cal indicar títol i objectiu.');
  if (!['draft','open','scheduled'].includes(s.status)) throw new InputError('Estat no vàlid.');
  if (s.status !== 'draft' && approved !== true) throw new InputError('Cal l’aprovació humana abans de publicar.',403);
  if (!Array.isArray(s.questions) || s.questions.length < 3) throw new InputError('Calen almenys 3 preguntes.');
  if (s.departmentCodes!==undefined) {
    if(!Array.isArray(s.departmentCodes)||!s.departmentCodes.length||s.departmentCodes.some(d=>typeof d!=='string'))throw new InputError('Selecciona departaments vàlids.');
  } else if (!Array.isArray(s.zones) || !s.zones.length || s.zones.some(z => !zones[z])) throw new InputError('Selecciona un públic vàlid.');
  if (!Array.isArray(s.channels) || !s.channels.length || s.channels.some(c => !channels.includes(c))) throw new InputError('Selecciona canals vàlids.');
  if (!Number.isFinite(Date.parse(s.opensAt)) || !Number.isFinite(Date.parse(s.closesAt)) || Date.parse(s.closesAt) <= Date.parse(s.opensAt)) throw new InputError('La data de tancament ha de ser posterior a l’obertura.');
  if (s.status !== 'draft' && Date.parse(s.closesAt) <= Date.now()) throw new InputError('La data de tancament ha de ser futura.');
  if (!['ca','es','en'].includes(s.locale || 'ca')) throw new InputError('Idioma no vàlid.');
  for (const q of s.questions) {
    if (!q || typeof q.text !== 'string' || !q.text.trim() || q.text.length>2000 || !['faces','scale','yesno','list','text'].includes(q.type)) throw new InputError('Pregunta no vàlida.');
    if (q.type==='list' && (!Array.isArray(q.options) || q.options.length<2 || q.options.some(o=>typeof o!=='string'||!o.trim()))) throw new InputError('Les preguntes d’opcions necessiten almenys dues opcions.');
    if (q.type==='scale' && (!Number.isInteger(q.min??0)||!Number.isInteger(q.max??10)||(q.min??0)>=(q.max??10)||(q.min??0)<-100||(q.max??10)>100)) throw new InputError('Límits d’escala no vàlids.');
  }
}

// Caller owns the transaction: campaign, version, translations and audience commit together.
export async function createSurvey(db, s, approved, editId) {
  validate(s, approved);
  const departments=s.departmentCodes?[...new Set(s.departmentCodes)]:[...new Set(s.zones.flatMap(z=>zones[z]))];
  const active=(await db.query('select code from departments where active and code=any($1::text[])',[departments])).rows;
  if(active.length!==departments.length)throw new InputError('Hi ha departaments que no existeixen o estan inactius.');
  const id = editId || `enquesta-${randomUUID()}`;
  const published = s.status !== 'draft';
  const locale = s.locale || 'ca';
  const metadata = {hr:{departmentCodes:departments,zones:s.zones||[],channels:s.channels,locale,dimensions:Object.fromEntries(s.questions.map((q,i)=>[`q${i+1}`,q.dim||'']))}};
  const seconds = Math.max(30,Math.min(300,s.questions.reduce((n,q)=>n+(Number.isFinite(q.secs)?q.secs:10),0)));
  let c;
  if (editId) {
    c=(await db.query('select id,status from public.campaigns where slug=$1 for update',[editId])).rows[0];
    if (!c) throw new InputError('Enquesta no trobada.',404);
    if (!['draft','review'].includes(c.status)) throw new InputError('Només es poden editar esborranys.',409);
    await db.query(`update public.campaigns set name=$2,objective=$3,status=$4,target_filter=$5::jsonb,max_duration_seconds=$6,privacy_threshold=10,opens_at=$7,closes_at=$8,approved_by_label=$9,approved_at=case when $10 then now() end,published_at=case when $10 then now() end where id=$1`,[c.id,s.title.trim(),s.goal.trim(),published?'published':'draft',JSON.stringify(metadata),seconds,s.opensAt,s.closesAt,published?'RRHH local':null,published]);
    await db.query('delete from public.questionnaire_versions where campaign_id=$1',[c.id]);
    await db.query('delete from public.audience_assignments where campaign_id=$1',[c.id]);
  } else c = (await db.query(`insert into public.campaigns(slug,name,objective,status,target_filter,max_duration_seconds,privacy_threshold,opens_at,closes_at,approved_by_label,approved_at,published_at)
    values($1,$2,$3,$4,$5::jsonb,$6,10,$7,$8,$9,case when $10 then now() end,case when $10 then now() end) returning id`,
  [id,s.title.trim(),s.goal.trim(),published?'published':'draft',JSON.stringify(metadata),seconds,s.opensAt,s.closesAt,published?'RRHH local':null,published])).rows[0];
  const v = (await db.query(`insert into public.questionnaire_versions(campaign_id,version,status,estimated_seconds,approved_by_label,approved_at)
    values($1,1,$2,$3,$4,case when $5 then now() end) returning id`,[c.id,published?'published':'draft',seconds,published?'RRHH local':null,published])).rows[0];
  await db.query(`insert into public.questionnaire_translations values($1,$2,$3,$4,$5,$6)`,[v.id,locale,s.title,s.intro||s.goal,'Gràcies per participar.','Respostes anònimes; resultats agregats amb un mínim de 10 persones.']);
  for (const [i,q] of s.questions.entries()) {
    // Yes/no includes “No ho sé”, so store it as a choice instead of losing that answer.
    const type=({faces:'scale',scale:'scale',yesno:'single_choice',list:'single_choice',text:'open_text'})[q.type];
    const row=(await db.query(`insert into public.questions(questionnaire_version_id,stable_key,position,question_type,required,scale_min,scale_max)
      values($1,$2,$3,$4,$5,$6,$7) returning id`,[v.id,`q${i+1}`,i+1,type,q.required??q.type!=='text',type==='scale'?(q.type==='faces'?1:q.min??0):null,type==='scale'?(q.type==='faces'?5:q.max??10):null])).rows[0];
    await db.query('insert into public.question_translations(question_id,locale,prompt,help_text,options) values($1,$2,$3,$4,$5::jsonb)',[row.id,locale,q.text,q.help||null,JSON.stringify(q.type==='yesno'?['Sí','No','No ho sé']:q.options||[])]);
  }
  // Els comptes de treballador demo (@demo) reben totes les enquestes, sigui quin sigui el públic,
  // perquè la demo es pugui fer de punta a punta des de la web.

  await db.query(`insert into public.audience_assignments(campaign_id,synthetic_person_id,channel,locale)
    select $1,p.id,'web',$2 from public.synthetic_people p join public.departments d on d.id=p.department_id
    where d.code=any($3::text[])
       or exists(select 1 from app_private.worker_accounts a join auth.users u on u.id=a.user_id
                 where a.synthetic_person_id=p.id and (u.email like '%@demo' or u.email like '%@demo.damm.invalid'))`,[c.id,locale,departments]);
  await db.query('update public.campaigns set target_population=(select count(*) from public.audience_assignments where campaign_id=$1) where id=$1',[c.id]);
  await db.query(`insert into public.audit_events(actor_type,action,entity_type,entity_id,metadata) values('user','campaign.created','campaign',$1,$2::jsonb)`,[c.id,JSON.stringify({approved_by_human:published})]);
  return (await listSurveys(db,id))[0];
}

export async function changeStatus(db, id, status, approved) {
  if (!['open','closed'].includes(status)) throw new InputError('Transició no vàlida.');
  const c=(await db.query('select * from public.campaigns where slug=$1 for update',[id])).rows[0];
  if (!c) throw new InputError('Enquesta no trobada.',404);
  if (status==='open' && !['draft','review','approved','published'].includes(c.status)) throw new InputError('Aquesta enquesta no es pot reobrir.',409);
  if (status==='closed' && c.status!=='published') throw new InputError('Només es poden tancar enquestes publicades.',409);
  if(status==='open') {
    if(c.status!=='published' && approved!==true) throw new InputError('Cal l’aprovació humana abans de publicar.',403);
    if(c.closes_at && new Date(c.closes_at)<=new Date()) throw new InputError('La data de tancament ha caducat.',409);
    await db.query(`update public.campaigns set status='published',opens_at=now(),approved_by_label=coalesce(approved_by_label,'RRHH local'),approved_at=coalesce(approved_at,now()),published_at=coalesce(published_at,now()) where id=$1`,[c.id]);
    await db.query(`update public.questionnaire_versions set status='published',approved_by_label=coalesce(approved_by_label,'RRHH local'),approved_at=coalesce(approved_at,now()) where campaign_id=$1 and version=(select max(version) from public.questionnaire_versions where campaign_id=$1)`,[c.id]);
  } else await db.query(`update public.campaigns set status='closed',closes_at=now() where id=$1`,[c.id]);
  await db.query(`insert into public.audit_events(actor_type,action,entity_type,entity_id) values('user',$1,'campaign',$2)`,[`campaign.${status}`,c.id]);
  return (await listSurveys(db,id))[0];
}
