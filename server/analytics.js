import {InputError} from './surveys.js';

const SHIFTS={morning:'Matí',afternoon:'Tarda',night:'Nit',split:'Partit',flexible:'Flexible',route:'Ruta'};
const CHANNELS={mobile_qr:'Mòbil / QR',web:'Web / app',teams:'Teams',email:'Correu'};
const round=n=>Math.round(n*10)/10;
const average=values=>values.length?round(values.reduce((a,b)=>a+b,0)/values.length):null;
const group=(rows,key)=>{const out=new Map();for(const row of rows){const k=key(row);if(!out.has(k))out.set(k,[]);out.get(k).push(row)}return out};
// Suppress the complete partition if a small cell could be recovered by subtraction.
function partition(rows,key,label,k){
 const groups=group(rows,key);
 if([...groups.values()].some(items=>items.length<k))return [];
 return [...groups].map(([code,items])=>{const scored=items.map(r=>r.score).filter(v=>v!==null);return {code,label:label(code),count:items.length,pct:round(items.length/rows.length*100),score:scored.length>=k?average(scored):null}});
}
function parse(params){
 const f=Object.fromEntries(['survey','site','department','shift','channel','dateRange'].map(key=>[key,params.get(key)||'']));
 if(f.survey&&!/^[a-z0-9_-]{1,160}$/i.test(f.survey))throw new InputError('Enquesta no vàlida.');
 if(f.site&&!/^[a-z0-9_]{2,60}$/.test(f.site))throw new InputError('Centre no vàlid.');
 if(f.department&&!/^[a-z0-9_]{1,60}$/.test(f.department))throw new InputError('Departament no vàlid.');
 if(f.shift&&!SHIFTS[f.shift])throw new InputError('Torn no vàlid.');
 if(f.channel&&!CHANNELS[f.channel])throw new InputError('Canal no vàlid.');
 if(!['','all','7d','30d','90d'].includes(f.dateRange))throw new InputError('Període no vàlid.');
 return f;
}

export async function surveyAnalytics(db,params){
 const filters=parse(params);
 if(filters.site&&!(await db.query('select 1 from sites where code=$1 and active',[filters.site])).rowCount)throw new InputError('Centre no trobat.',404);
 const departments=(await db.query('select code,name_ca label from departments where active order by name_ca')).rows;
 if(filters.department&&!departments.some(d=>d.code===filters.department))throw new InputError('Departament no trobat.',404);
 const forms=(await db.query(`select c.slug id,coalesce(t.title,c.name) title,c.privacy_threshold threshold,
   (select count(*)::int from survey_responses r left join sites s on s.id=r.site_id where r.campaign_id=c.id and ($1='' or s.code=$1)) responses,
   (select count(*)::int from audience_assignments aa join synthetic_people p on p.id=aa.synthetic_person_id left join sites s on s.id=p.site_id where aa.campaign_id=c.id and ($1='' or s.code=$1)) target
   from campaigns c left join lateral (select t.title from questionnaire_translations t join questionnaire_versions v on v.id=t.questionnaire_version_id
     where v.campaign_id=c.id order by v.version desc,(t.locale=coalesce(c.target_filter->'hr'->>'locale','ca')) desc,(t.locale='ca') desc limit 1) t on true
   where exists(select 1 from questionnaire_versions v where v.campaign_id=c.id) order by c.created_at desc,c.slug`,[filters.site])).rows;
 const form=filters.survey?forms.find(f=>f.id===filters.survey):forms[0];
 if(filters.survey&&!form)throw new InputError('Enquesta no trobada.',404);
 const base={source:'postgres',generatedAt:new Date().toISOString(),filters,forms,form:form||null,
   options:{departments,shifts:Object.entries(SHIFTS).map(([code,label])=>({code,label})),channels:Object.entries(CHANNELS).map(([code,label])=>({code,label}))},stats:null};
 if(!form)return base;
 const threshold=Math.max(10,form.threshold);
 const days={'7d':7,'30d':30,'90d':90}[filters.dateRange]||null;
 const args=[form.id,filters.site,filters.department,filters.shift,filters.channel,days];
 const rows=(await db.query(`select r.id,r.department_id,d.code department,r.shift,r.channel,r.duration_seconds,
   (r.submitted_at at time zone 'Europe/Madrid')::date::text as "day"
   from survey_responses r join campaigns c on c.id=r.campaign_id join departments d on d.id=r.department_id left join sites s on s.id=r.site_id
   where c.slug=$1 and ($2='' or s.code=$2) and ($3='' or d.code=$3) and ($4='' or r.shift=$4) and ($5='' or r.channel::text=$5)
   and ($6::int is null or (r.submitted_at>=now()-make_interval(days=>$6::int) and r.submitted_at<=now()))`,args)).rows;
 const target=(await db.query(`select count(*)::int n from audience_assignments aa join campaigns c on c.id=aa.campaign_id
   join synthetic_people p on p.id=aa.synthetic_person_id join departments d on d.id=p.department_id left join sites s on s.id=p.site_id
   where c.slug=$1 and ($2='' or s.code=$2) and ($3='' or d.code=$3) and ($4='' or p.shift=$4) and ($5='' or aa.channel::text=$5)`,args.slice(0,5))).rows[0].n;
 const globalCount=(await db.query('select count(*)::int n from survey_responses r join campaigns c on c.id=r.campaign_id where c.slug=$1',[form.id])).rows[0].n;
 const smallComplement=globalCount>rows.length&&globalCount-rows.length<threshold;
 const stats={totalResponses:rows.length,target,participationRate:target?round(rows.length/target*100):null,threshold,
   isSuppressed:rows.length<threshold||smallComplement,suppressionReason:smallComplement?'El filtre deixaria un grup exclòs massa petit, que es podria deduir per diferència.':null,avgScore:null,avgDurationSecs:null,channelBreakdown:[],shiftBreakdown:[],departmentBreakdown:[],timeline:[],dimensions:[],questions:[],textResponses:0,
   notes:['Les dades provenen de PostgreSQL. No s’infereix sentiment ni NPS de preguntes que no ho mesuren.',
    'Les particions amb algun grup petit queden ocultes senceres per evitar deduir-lo per diferència.',
    'El públic objectiu són les invitacions del centre/departament/torn/canal; el filtre de dates només limita les respostes. No es mostren comentaris individuals.']};
 if(stats.isSuppressed)return {...base,stats};
 const campaign=(await db.query('select id,target_filter from campaigns where slug=$1',[form.id])).rows[0];
 const questions=(await db.query(`select q.*,v.version,coalesce(t.prompt,q.stable_key) text,t.options,wd.label_ca dimension
   from questions q join questionnaire_versions v on v.id=q.questionnaire_version_id left join wellbeing_dimensions wd on wd.id=q.dimension_id
   left join lateral (select prompt,options from question_translations where question_id=q.id order by (locale=$2) desc,(locale='ca') desc limit 1) t on true
   where v.campaign_id=$1 order by v.version,q.position`,[campaign.id,campaign.target_filter.hr?.locale||'ca'])).rows;
 const answers=(await db.query('select response_id,question_id,numeric_value,choice_value,free_text_redacted is not null has_text from response_answers where response_id=any($1::uuid[])',[rows.map(r=>r.id)])).rows;
 const byQuestion=new Map(questions.map(q=>[q.id,q]));
 const scores=new Map(rows.map(r=>[r.id,[]]));
 for(const a of answers){const q=byQuestion.get(a.question_id);if(q?.question_type==='scale'&&a.numeric_value!==null&&q.scale_max>q.scale_min)scores.get(a.response_id).push(10*(Number(a.numeric_value)-q.scale_min)/(q.scale_max-q.scale_min))}
 for(const r of rows)r.score=average(scores.get(r.id));
 const scored=rows.map(r=>r.score).filter(v=>v!==null);
 stats.avgScore=scored.length>=threshold?average(scored):null;
 const durations=rows.filter(r=>r.duration_seconds!==null).map(r=>r.duration_seconds);
 stats.avgDurationSecs=durations.length>=threshold?average(durations):null;
 stats.channelBreakdown=partition(rows,r=>r.channel,key=>CHANNELS[key]||key,threshold);
 stats.shiftBreakdown=partition(rows,r=>r.shift,key=>SHIFTS[key]||key,threshold);
 stats.departmentBreakdown=partition(rows,r=>r.department,key=>departments.find(d=>d.code===key)?.label||key,threshold);
 for(const buckets of [r=>r.day,r=>{const d=new Date(r.day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)},r=>r.day.slice(0,7)]){
   const result=partition(rows,buckets,key=>key,threshold).sort((a,b)=>a.code.localeCompare(b.code));
   if(result.length){stats.timeline=result;break}
 }
 const dimensionRows=new Map();
 for(const q of questions){
   const qa=answers.filter(a=>a.question_id===q.id);
   const metric={id:q.id,text:q.text,version:q.version,type:q.question_type,dimension:q.dimension||campaign.target_filter.hr?.dimensions?.[q.stable_key]||'',totalAnswers:qa.length,isSuppressed:qa.length<threshold,avgScore:null,distribution:[],shifts:[]};
   if(metric.isSuppressed){stats.questions.push(metric);continue}
   if(q.question_type==='open_text'){stats.textResponses+=qa.length;stats.questions.push(metric);continue}
   const numeric=qa.filter(a=>a.numeric_value!==null);
   if(q.question_type==='scale'&&q.scale_max>q.scale_min){
     metric.avgScore=numeric.length>=threshold?average(numeric.map(a=>10*(Number(a.numeric_value)-q.scale_min)/(q.scale_max-q.scale_min))):null;
     if(metric.dimension){if(!dimensionRows.has(metric.dimension))dimensionRows.set(metric.dimension,new Map());const dim=dimensionRows.get(metric.dimension);for(const a of numeric){if(!dim.has(a.response_id))dim.set(a.response_id,[]);dim.get(a.response_id).push(10*(Number(a.numeric_value)-q.scale_min)/(q.scale_max-q.scale_min))}}
   }
   const counts=new Map();
   for(const a of qa){const values=q.question_type==='scale'?[String(Number(a.numeric_value))]:Array.isArray(a.choice_value)?a.choice_value:[a.choice_value];for(const v of values){if(v===null||v===undefined)continue;const label=typeof v==='boolean'?(v?'Sí':'No'):String(v);counts.set(label,(counts.get(label)||0)+1)}}
   if(![...counts.values()].some(n=>n<threshold))metric.distribution=[...counts].map(([label,count])=>({label,count,pct:round(count/qa.length*100)})).sort((a,b)=>q.question_type==='scale'?Number(a.label)-Number(b.label):a.label.localeCompare(b.label));
   const answerRows=qa.map(a=>({...rows.find(r=>r.id===a.response_id),score:q.question_type==='scale'&&a.numeric_value!==null?10*(Number(a.numeric_value)-q.scale_min)/(q.scale_max-q.scale_min):null}));
   metric.shifts=partition(answerRows,r=>r.shift,key=>SHIFTS[key]||key,threshold);
   stats.questions.push(metric);
 }
 stats.dimensions=[...dimensionRows].filter(([,r])=>r.size>=threshold).map(([label,r])=>({label,count:r.size,score:average([...r.values()].map(average))}));
 return {...base,stats};
}

const csvCell=value=>{let s=String(value??'');if(/^[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
export function analyticsCsv(data){
 const s=data.stats;if(!s||s.isSuppressed)throw new InputError('Mostra protegida: no es pot exportar aquest segment.',403);
 const rows=[['Enquesta','Centre','Departament','Torn','Canal','Període'],[data.form.title,data.filters.site||'Tots',data.filters.department||'Tots',data.filters.shift||'Tots',data.filters.channel||'Tots',data.filters.dateRange||'all'],
 ['Tipus','Etiqueta','Respostes','Mitjana normalitzada /10'],['Resum','Total',s.totalResponses,s.avgScore],['Resum','Públic objectiu',s.target,''],['Resum','Participació %',s.participationRate,'']];
 for(const [type,list]of [['Canal',s.channelBreakdown],['Torn',s.shiftBreakdown],['Departament',s.departmentBreakdown],['Període',s.timeline],['Dimensió',s.dimensions]])for(const item of list)rows.push([type,item.label,item.count,item.score]);
 for(const q of s.questions){if(q.isSuppressed)continue;rows.push(['Pregunta',q.text,q.totalAnswers,q.avgScore]);for(const item of q.distribution)rows.push(['Distribució',q.text+' · '+item.label,item.count,'']);for(const item of q.shifts)rows.push(['Pregunta per torn',q.text+' · '+item.label,item.count,item.score])}
 return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
