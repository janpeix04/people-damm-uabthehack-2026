import {InputError} from './surveys.js';

export const SHIFT_LABELS={morning:'Matí',afternoon:'Tarda',night:'Nit',split:'Partit',flexible:'Flexible',route:'Ruta'};
const round=n=>Math.round(n*10)/10;
export const REMINDER_POLICY={globalDailyLimit:1,campaignLimit:2,cooldownHours:48,channel:'in_app'};

export async function representation(db,slug,siteCode=''){
 const campaign=(await db.query(`select id,name,privacy_threshold,status,opens_at,closes_at,
   status='published' and coalesce(opens_at<=now(),true) and coalesce(closes_at>now(),true) active from campaigns where slug=$1`,[slug])).rows[0];
 if(!campaign)throw new InputError('Enquesta no trobada.',404);
 const site=siteCode?(await db.query('select id from sites where code=$1 and active',[siteCode])).rows[0]:null;
 if(siteCode&&!site)throw new InputError('Centre no trobat.',404);
 const people=(await db.query(`select p.id,d.code department,d.name_ca department_label,p.shift,aa.status='responded' responded
   from audience_assignments aa join synthetic_people p on p.id=aa.synthetic_person_id join departments d on d.id=p.department_id
   where aa.campaign_id=$1 and ($2::uuid is null or p.site_id=$2)`,[campaign.id,site?.id||null])).rows;
 const threshold=Math.max(10,campaign.privacy_threshold),total=people.length,participants=people.filter(p=>p.responded).length;
 const protectedCount=(population,count)=>population<threshold||count<threshold||(population>count&&population-count<threshold);
 const overall=site?(await db.query(`select count(*)::int population,count(*) filter(where status='responded')::int participants from audience_assignments where campaign_id=$1`,[campaign.id])).rows[0]:{population:total,participants};
 const excluded=overall.participants-participants;
 const hidden=protectedCount(total,participants)||(excluded>0&&excluded<threshold);
 function rows(type,key,label){
  const groups=new Map();for(const person of people){const code=key(person);if(!groups.has(code))groups.set(code,[]);groups.get(code).push(person)}
  // Hide counts across the partition if any one group would be recoverable by subtraction.
  const suppressPartition=[...groups.values()].some(g=>protectedCount(g.length,g.filter(p=>p.responded).length));
  return [...groups].map(([code,group])=>{
   const n=group.length,r=group.filter(p=>p.responded).length,small=n<threshold,coverage=r/n,overall=total?participants/total:0;
   const status=small?'protected':r<threshold?'insufficient':overall&&coverage/overall<0.7?'underrepresented':'covered';
   const countHidden=hidden||suppressPartition;
   const actions=status==='covered'?['Mantén el canal i evita nous avisos si no són necessaris.']:type==='shift'&&code==='night'
    ?['Revisa que el QR sigui accessible al relleu del torn de nit.','Valora ampliar la finestra perquè inclogui aquest torn.']
    :type==='department'&&['fabrica','logistica'].includes(code)
     ?['Facilita un QR o una tauleta en un punt accessible durant el torn.','Ofereix un moment breu per respondre, sense pressió.']
     :['Revisa si el canal triat arriba a aquest col·lectiu.','Valora ampliar la finestra o oferir un canal alternatiu.'];
   return {type,code:small?'':code,label:small?'Grup petit protegit':label(code,group[0]),population:small?null:n,participants:countHidden?null:r,
    coverage:countHidden?null:round(100*coverage),populationShare:small?null:round(n/total*100),sampleShare:countHidden||!participants?null:round(r/participants*100),
    relativeCoverage:countHidden||!overall?null:round(coverage/overall),status,actions:small?['Amplia el grup abans d’analitzar-lo o activar recordatoris.']:actions,
    canRemind:!small&&campaign.active&&['insufficient','underrepresented'].includes(status)};
  }).sort((a,b)=>a.label.localeCompare(b.label));
 }
 return {survey:slug,title:campaign.name,site:siteCode,threshold,active:campaign.active,
  summary:{population:total>=threshold?total:null,participants:hidden?null:participants,coverage:hidden||!total?null:round(participants/total*100)},
  departments:rows('department',p=>p.department,(_,p)=>p.department_label),shifts:rows('shift',p=>p.shift,code=>SHIFT_LABELS[code]||code),
  policy:REMINDER_POLICY,notes:['Cobertura de tota la campanya segons les invitacions i el seu estat de participació. No s’utilitza el contingut de cap resposta.',
   'Una cobertura inferior al 70% de la mitjana de la campanya és un senyal orientatiu, no una prova estadística de biaix.',
   'Els recomptes petits i els seus complements es protegeixen. Si una cel·la és petita, s’oculten els participants de tota aquella taula.',
   'Els recordatoris només es mostren dins la web, a persones amb la consulta pendent i respectant les seves preferències. No s’envien correus ni Teams.']};
}

export async function createReminder(db,user,body){
 if(typeof body.survey!=='string'||typeof (body.site||'')!=='string'||!['all','department','shift'].includes(body.groupType))throw new InputError('Recordatori no vàlid.');
 const info=await representation(db,body.survey,body.site||'');
 if(!info.active)throw new InputError('La consulta no està oberta.',409);
 const code=body.groupType==='all'?'':body.groupCode;
 if(body.groupType!=='all'){
  const row=(body.groupType==='department'?info.departments:info.shifts).find(r=>r.code===code&&r.type===body.groupType);
  if(!row||!row.canRemind)throw new InputError('Aquest grup no permet activar un recordatori.',409);
 }else if(info.summary.population===null)throw new InputError('Cal ampliar el públic abans d’activar recordatoris.',409);
 const campaign=(await db.query('select id from campaigns where slug=$1',[body.survey])).rows[0];
 // Serialise batches for this campaign, including repeated clicks from different HR users.
 await db.query('select id from campaigns where id=$1 for update',[campaign.id]);
 const site=body.site?(await db.query('select id from sites where code=$1',[body.site])).rows[0]?.id:null;
 const previous=(await db.query(`select count(*)::int n,max(created_at)>now()-interval '48 hours' recent from app_private.listening_reminder_batches
   where campaign_id=$1 and site_id is not distinct from $2::uuid and group_type=$3 and group_code=$4`,[campaign.id,site,body.groupType,code])).rows[0];
 if(previous.n>=2||previous.recent)throw new InputError('Ja hi ha un recordatori recent o s’ha arribat al màxim de dos per grup i campanya.',409);
 const batch=(await db.query('insert into app_private.listening_reminder_batches(campaign_id,site_id,group_type,group_code,created_by) values($1,$2,$3,$4,$5) returning id',[campaign.id,site,body.groupType,code,user.id])).rows[0];
 return {id:batch.id,queued:true,channel:'in_app',message:'Recordatori disponible dins la web per a les persones elegibles. No s’ha enviat cap missatge extern.'};
}
