import { InputError } from './surveys.js';

const avatarDefault={skin:1,hair:0,shirt:0,style:0,logo:true};
const mapIdea=r=>({id:r.id,category:r.category,text:r.body_redacted,status:({pending:'moderant',published:'publicada',rejected:'rebutjada',archived:'arxivada'})[r.status],at:new Date(r.submitted_on).getTime(),likes:r.likes,reacted:r.reacted});
export async function ideas(db,all=false,digest=null,site=null){return (await db.query(`select i.*,c.name category,
 (select count(*)::int from app_private.plaza_idea_reactions r where r.idea_id=i.id) likes,
 exists(select 1 from app_private.plaza_idea_reactions r where r.idea_id=i.id and r.wallet_digest=$1) reacted
 from plaza_ideas i join plaza_categories c on c.id=i.category_id where ($2::uuid is null or i.site_id=$2) ${all?'':"and i.status='published'"} order by i.submitted_on desc,i.id`,[digest,site])).rows.map(mapIdea)}
async function wallet(db,token){
  if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))throw new InputError('invalid_wallet');
  await db.query('select app_private.wallet_person($1,true)',[token]);
  return (await db.query("select extensions.digest($1,'sha256') digest",[token])).rows[0].digest;
}

async function walletSite(db,token){
 const row=(await db.query('select site_id from synthetic_people where id=app_private.wallet_person($1,false)',[token])).rows[0];
 if(!row?.site_id)throw new InputError('Centre no assignat.',403);
 return row.site_id;
}
async function hrSite(db,code){
 if(!code)return null;
 const row=(await db.query('select id from sites where code=$1 and active',[code])).rows[0];
 if(!row)throw new InputError('Centre no trobat.',404);
 return row.id;
}
export async function plazaState(db,token,site=null){
  const digest=token?await wallet(db,token):null;
  if(token)site=await walletSite(db,token);
  const pref=(await db.query('select skin,hair,shirt,hair_style style,show_logo logo from app_private.worker_preferences where wallet_digest=$1',[digest])).rows[0]||avatarDefault;
  const w={headcount:0,participants:0,last_count:0,joined:false,resets_in:0};
  const q=(await db.query("select * from plaza_daily_questions where question_date=(now() at time zone 'Europe/Madrid')::date and status='published'")).rows[0];
  let question=null,results=null,myAnswer=null,todayTotal=0;
  if(q){
    const opts=(await db.query(`select o.option_key key,o.label,coalesce(o.emoji,'') emoji,count(v.id)::int n from plaza_daily_options o left join app_private.plaza_daily_votes v on v.option_id=o.id where o.question_id=$1 group by o.id order by o.position`,[q.id])).rows;
    todayTotal=opts.reduce((n,o)=>n+o.n,0);
    const answered=(await db.query('select 1 from app_private.plaza_daily_receipts where wallet_digest=$1 and question_id=$2',[digest,q.id])).rowCount>0;
    myAnswer=answered?'answered':null;
    question={id:q.id,text:q.prompt,options:opts.map(o=>({...o,n:0}))};
    if(todayTotal>=q.min_sample_size)results=opts.map(o=>({...o,pct:o.n/todayTotal*100}));
  }
  const reacted=[];
  return {avatar:pref,ideas:await ideas(db,false,digest,site),plaza:{...w,lastWeek:w.headcount?w.last_count/w.headcount*100:0,resetsIn:w.resets_in,reacted,question,results,myAnswer,todayTotal}};
}

export async function appAction(db,action,b){
  const digest=await wallet(db,b.wallet);
  if(action==='state')return plazaState(db,b.wallet);
  if(action==='wallet')return (await db.query('select app_wallet_open($1,$2) data',[b.wallet,b.locale||'ca'])).rows[0].data;
  if(action==='redeem')return (await db.query('select app_redeem_reward($1,$2) data',[b.wallet,b.reward])).rows[0].data;
  if(action==='submit'){
    await validateAnswers(db,b);
    return (await db.query('select app_submit_response($1,$2,$3,$4::jsonb,$5,$6::int) data',[b.wallet,b.survey,b.access_token,JSON.stringify(b.answers),b.locale||'ca',Number(b.duration_seconds)||null])).rows[0].data;
  }
  if(action==='avatar'){
    const a=b.avatar;
    if(!a||!['skin','hair','shirt'].every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=5)||!Number.isInteger(a.style)||a.style<0||a.style>3||typeof a.logo!=='boolean')throw new InputError('Avatar no vàlid.');
    await db.query(`insert into app_private.worker_preferences(wallet_digest,skin,hair,shirt,hair_style,show_logo) values($1,$2,$3,$4,$5,$6)
      on conflict(wallet_digest) do update set skin=excluded.skin,hair=excluded.hair,shirt=excluded.shirt,hair_style=excluded.hair_style,show_logo=excluded.show_logo`,[digest,a.skin,a.hair,a.shirt,a.style,a.logo]);
  }else if(action==='idea'){
    if(typeof b.text!=='string'||b.text.trim().length<3||b.text.length>4000)throw new InputError('La idea ha de tenir entre 3 i 4.000 caràcters.');
    const cat=(await db.query('select id from plaza_categories where active and (id=$1 or name=$1)',[b.category])).rows[0];
    if(!cat)throw new InputError('Categoria no vàlida.');
    await db.query('insert into plaza_ideas(category_id,body_redacted,site_id) values($1,$2,$3)',[cat.id,b.text.trim(),await walletSite(db,b.wallet)]);
  }else if(action==='daily'){
    const q=(await db.query("select id from plaza_daily_questions where question_date=(now() at time zone 'Europe/Madrid')::date and status='published' and id::text=$1 for share",[b.question])).rows[0];
    if(!q)throw new InputError('La pregunta ja no està oberta.',409);
    const o=(await db.query('select id from plaza_daily_options where question_id=$1 and option_key=$2',[q.id,b.option])).rows[0];
    if(!o)throw new InputError('Opció no vàlida.');
    const receipt=await db.query('insert into app_private.plaza_daily_receipts(wallet_digest,question_id) values($1,$2) on conflict do nothing returning question_id',[digest,q.id]);
    if(receipt.rowCount)await db.query('insert into app_private.plaza_daily_votes(question_id,option_id) values($1,$2)',[q.id,o.id]);
    
  }else if(action==='reaction'){
    if(typeof b.idea!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.idea)||typeof b.on!=='boolean')throw new InputError('Reacció no vàlida.');
    if(!(await db.query("select id from plaza_ideas where id=$1 and status='published' and site_id=$2 for share",[b.idea,await walletSite(db,b.wallet)])).rowCount)throw new InputError('Opinió no trobada.',404);
    if(b.on)await db.query('insert into app_private.plaza_idea_reactions(idea_id,wallet_digest) values($1,$2) on conflict do nothing',[b.idea,digest]);
    else await db.query('delete from app_private.plaza_idea_reactions where idea_id=$1 and wallet_digest=$2',[b.idea,digest]);
  }else throw new InputError('Acció no trobada.',404);
  return plazaState(db,b.wallet);
}

async function validateAnswers(db,b){
  if(!Array.isArray(b.answers)||b.answers.length<1||b.answers.length>12)throw new InputError('Respostes no vàlides.');
  const qs=(await db.query(`select q.*,t.options from questions q join questionnaire_versions v on v.id=q.questionnaire_version_id join campaigns c on c.id=v.campaign_id
    join lateral(select options from question_translations where question_id=q.id order by (locale=$2) desc limit 1)t on true
    where c.slug=$1 and v.status='published'`,[b.survey,b.locale||'ca'])).rows;
  const seen=new Set();
  for(const a of b.answers){
    const q=qs.find(q=>q.id===a.question_id);
    if(!q||seen.has(a.question_id))throw new InputError('Pregunta desconeguda o repetida.');seen.add(a.question_id);
    if(['numeric_value','choice_value','free_text'].filter(k=>a[k]!==undefined&&a[k]!==null).length!==1)throw new InputError('Cada pregunta necessita una resposta.');
    if(q.question_type==='scale'&&(typeof a.numeric_value!=='number'||!Number.isFinite(a.numeric_value)||a.numeric_value<q.scale_min||a.numeric_value>q.scale_max))throw new InputError('Valor fora de l’escala.');
    if(q.question_type==='open_text'&&(typeof a.free_text!=='string'||!a.free_text.trim()||a.free_text.length>4000))throw new InputError('Text no vàlid.');
    if(q.question_type==='boolean'&&typeof a.choice_value!=='boolean')throw new InputError('Resposta no vàlida.');
    if(q.question_type==='single_choice'&&!q.options.includes(a.choice_value))throw new InputError('Opció no vàlida.');
    if(q.question_type==='multi_choice'&&(!Array.isArray(a.choice_value)||!a.choice_value.length||a.choice_value.some(v=>!q.options.includes(v))))throw new InputError('Opcions no vàlides.');
  }
  if(qs.some(q=>q.required&&!seen.has(q.id)))throw new InputError('Falten preguntes obligatòries.');
}

export async function hrPlazaAction(db,b,user){
  const site=await hrSite(db,b.site);
  if(b.action==='state')return plazaState(db,null,site);
  if(b.action==='list')return ideas(db,true,null,site);
  if(b.action==='moderate'){
    if(!['published','rejected','archived'].includes(b.status))throw new InputError('Estat no vàlid.');
    const r=await db.query('update plaza_ideas set status=$2 where id::text=$1 returning id',[b.id,b.status]);if(!r.rowCount)throw new InputError('Idea no trobada.',404);
    return ideas(db,true,null,site);
  }
  if(b.action==='question'){
    if(typeof b.text!=='string'||!b.text.trim()||b.text.length>1000||!Array.isArray(b.options)||b.options.length<2||b.options.length>6||b.options.some(o=>typeof o!=='string'||!o.trim()||o.length>300))throw new InputError('Indica una pregunta i entre 2 i 6 opcions.');
    if(b.approved!==true)throw new InputError('Cal aprovar la publicació.',403);
    const q=(await db.query("insert into plaza_daily_questions(question_date,prompt) values((now() at time zone 'Europe/Madrid')::date,$1) returning id",[b.text.trim()])).rows[0];
    for(const [i,label]of b.options.entries())await db.query('insert into plaza_daily_options(question_id,option_key,label,position) values($1,$2,$3,$4)',[q.id,String(i),label.trim(),i+1]);
    // Local HR demo identity, same scope as the existing HR API (no SSO).
    await db.query("update plaza_daily_questions set status='published',approved_by=coalesce($2::uuid,(select user_id from user_profiles where app_role='hr_admin' order by user_id limit 1)),approved_at=now() where id=$1",[q.id,user?.id||null]);
    return {ok:true};
  }
  throw new InputError('Acció no trobada.',404);
}
