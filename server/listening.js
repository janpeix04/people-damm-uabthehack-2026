import {InputError} from './surveys.js';
import {moodState} from './mood.js';

export async function listeningState(db,user){
 return (await db.query('select mood_frequency,survey_reminders,paused_until from app_private.listening_preferences where user_id=$1',[user.id])).rows[0]||{mood_frequency:'daily',survey_reminders:true,paused_until:null};
}
export async function listeningAction(db,user,body){
 if(body.action==='state')return listeningState(db,user);
 if(body.action==='preferences'){
  if(!['daily','weekly','off'].includes(body.mood_frequency)||typeof body.survey_reminders!=='boolean'||![0,7].includes(body.pauseDays))throw new InputError('Preferències no vàlides.');
  await db.query(`insert into app_private.listening_preferences(user_id,mood_frequency,survey_reminders,paused_until)
    values($1,$2,$3,case when $4::int=7 then now()+interval '7 days' end)
    on conflict(user_id) do update set mood_frequency=excluded.mood_frequency,survey_reminders=excluded.survey_reminders,paused_until=excluded.paused_until`,[user.id,body.mood_frequency,body.survey_reminders,body.pauseDays]);
  return listeningState(db,user);
 }
 if(body.action!=='prompt')throw new InputError('Acció no trobada.',404);
 // Atomic across tabs, devices and all proactive listening prompts for this account.
 await db.query('select id from auth.users where id=$1 for update',[user.id]);
 const pref=await listeningState(db,user);
 const blocked=(await db.query(`select $2::timestamptz>now() paused,
   exists(select 1 from app_private.listening_prompts where user_id=$1 and local_day=(now() at time zone 'Europe/Madrid')::date) shown`,[user.id,pref.paused_until])).rows[0];
 if(blocked.paused||blocked.shown)return {prompt:null};
 if(pref.survey_reminders){
  const batch=(await db.query(`select b.id batch,c.id campaign,c.slug survey,c.name title,aa.id assignment
   from app_private.listening_reminder_batches b join campaigns c on c.id=b.campaign_id
   join app_private.worker_accounts account on account.user_id=$1 join synthetic_people p on p.id=account.synthetic_person_id
   join departments d on d.id=p.department_id join audience_assignments aa on aa.synthetic_person_id=p.id and aa.campaign_id=c.id
   where c.status='published' and coalesce(c.opens_at<=now(),true) and coalesce(c.closes_at>now(),true)
   and aa.status in ('eligible','invited','opened') and aa.reminder_count<2
   and (aa.last_reminder_at is null or aa.last_reminder_at<=now()-interval '48 hours')
   and (b.site_id is null or p.site_id=b.site_id)
   and (b.group_type='all' or (b.group_type='department' and b.group_code=d.code) or (b.group_type='shift' and b.group_code=p.shift))
   and not exists(select 1 from app_private.listening_prompts l where l.user_id=$1 and l.batch_id=b.id)
   order by b.created_at desc limit 1 for update of aa`,[user.id])).rows[0];
  if(batch){
   const claimed=await db.query("insert into app_private.listening_prompts(user_id,kind,campaign_id,batch_id) values($1,'survey',$2,$3) on conflict(user_id,local_day) do nothing returning id",[user.id,batch.campaign,batch.batch]);
   if(!claimed.rowCount)return {prompt:null};
   await db.query('update audience_assignments set reminder_count=reminder_count+1,last_reminder_at=now() where id=$1',[batch.assignment]);
   return {prompt:{kind:'survey',survey:batch.survey,title:batch.title}};
  }
 }
 if(pref.mood_frequency==='off')return {prompt:null};
 const state=await moodState(db,user);
 if(state.answered)return {prompt:null};
 if(pref.mood_frequency==='weekly'&&(await db.query("select 1 from app_private.listening_prompts where user_id=$1 and kind='mood' and shown_at>now()-interval '7 days'",[user.id])).rowCount)return {prompt:null};
 const claimed=await db.query("insert into app_private.listening_prompts(user_id,kind) values($1,'mood') on conflict(user_id,local_day) do nothing returning id",[user.id]);
 return {prompt:claimed.rowCount?{kind:'mood'}:null};
}
