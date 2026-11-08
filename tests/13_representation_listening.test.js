import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createSurvey} from '../server/surveys.js';
import {provisionUser} from '../server/auth.js';
import {representation,createReminder} from '../server/representation.js';
import {listeningAction} from '../server/listening.js';
import {moodState,submitMood} from '../server/mood.js';
let db;
before(async()=>{db=new PGlite({extensions:{pgcrypto}});for(const [i,f]of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().entries()){await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));if(i===0)await db.exec(fs.readFileSync('supabase/seed.sql','utf8'))}});
after(async()=>db.close());
async function fixture(){
 const s=await createSurvey(db,{title:'Representativitat',goal:'Escoltar tots els torns',status:'open',departmentCodes:['fabrica','oficina'],zones:[],channels:['app'],opensAt:new Date(Date.now()-86400000).toISOString(),closesAt:new Date(Date.now()+86400000).toISOString(),questions:Array.from({length:3},(_,i)=>({text:`Pregunta ${i}`,type:'scale'}))},true);
 const campaign=(await db.query('select id from campaigns where slug=$1',[s.id])).rows[0].id;
 await db.query('delete from audience_assignments where campaign_id=$1',[campaign]);
 let pending;
 for(const [dept,shift,responded]of [['fabrica','night',10],['oficina','morning',30]]){
  const people=(await db.query('select p.id from synthetic_people p join departments d on d.id=p.department_id where d.code=$1 order by p.id limit 40',[dept])).rows;
  for(const [i,p]of people.entries()){
   await db.query('update synthetic_people set shift=$2 where id=$1',[p.id,shift]);
   await db.query(`insert into audience_assignments(campaign_id,synthetic_person_id,channel,locale,status,responded_at) values($1,$2,'web','ca',$3,case when $4 then now() end)`,[campaign,p.id,i<responded?'responded':'eligible',i<responded]);
   if(dept==='fabrica'&&i===responded)pending=p.id;
  }
 }
 const hr={id:(await db.query("insert into auth.users(email) values('representation.hr@test.invalid') returning id")).rows[0].id};
 const worker={id:await provisionUser(db,{email:'representation.worker@test.invalid',password:'Synthetic-test-password-2026',role:'worker',personId:pending})};
 return {s,campaign,hr,worker,pending};
}
test('Representation: actual audience and unique participation, relative gaps and privacy-safe cohorts',async()=>{
 await db.exec('BEGIN');try{
  const {s,campaign}=await fixture();const data=await representation(db,s.id);
  assert.deepEqual(data.summary,{population:80,participants:40,coverage:50});
  const factory=data.departments.find(r=>r.code==='fabrica');assert.equal(factory.population,40);assert.equal(factory.participants,10);assert.equal(factory.coverage,25);assert.equal(factory.status,'underrepresented');assert.equal(factory.canRemind,true);
  const night=data.shifts.find(r=>r.code==='night');assert.ok(night.actions.some(a=>a.includes('QR')));assert.equal(night.status,'underrepresented');
  const site=(await db.query('select s.code from audience_assignments a join synthetic_people p on p.id=a.synthetic_person_id join sites s on s.id=p.site_id where a.campaign_id=$1 limit 1',[campaign])).rows[0].code;
  assert.equal((await representation(db,s.id,site)).site,site);
  assert.ok(!JSON.stringify(data).includes('synthetic_person_id'));assert.ok(!JSON.stringify(data).includes('wallet'));
  await db.query(`insert into audience_assignments(campaign_id,synthetic_person_id,channel,locale) select $1,p.id,'web','ca' from synthetic_people p join departments d on d.id=p.department_id where d.code='logistica' limit 5`,[campaign]);
  const protectedData=await representation(db,s.id);assert.ok(protectedData.departments.some(r=>r.status==='protected'&&r.population===null&&r.code===''));
  assert.ok(protectedData.departments.every(r=>r.participants===null),'hide sibling counts to prevent subtraction');
 }finally{await db.exec('ROLLBACK')}
});
test('Listening reminders: HR queues in-app only, daily cap, 48h cooldown, two per campaign and no reminders after responding',async()=>{
 await db.exec('BEGIN');try{
  const {s,campaign,hr,worker,pending}=await fixture();
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'off',survey_reminders:true,pauseDays:0});
  const input={survey:s.id,groupType:'department',groupCode:'fabrica'};
  const batch=await createReminder(db,hr,input);assert.equal(batch.channel,'in_app');
  await assert.rejects(createReminder(db,hr,input),/recent/);
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'off',survey_reminders:false,pauseDays:0});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'survey reminder opt-out applies to an eligible batch');
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'off',survey_reminders:true,pauseDays:7});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'pause applies to an eligible batch');
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'off',survey_reminders:true,pauseDays:0});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt.kind,'survey');
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'one proactive prompt per day');
  await db.query("update app_private.listening_prompts set local_day=local_day-1,shown_at=now()-interval '1 day' where user_id=$1",[worker.id]);
  await db.query("update app_private.listening_reminder_batches set created_at=now()-interval '3 days' where id=$1",[batch.id]);
  await createReminder(db,hr,input);
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'48h cooldown applies');
  await db.query("update audience_assignments set last_reminder_at=now()-interval '3 days' where campaign_id=$1 and synthetic_person_id=$2",[campaign,pending]);
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt.kind,'survey');
  await db.query('update app_private.listening_prompts set local_day=local_day-10 where user_id=$1',[worker.id]);
  await createReminder(db,hr,{survey:s.id,groupType:'all'});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'maximum two per campaign');
  await db.query("update audience_assignments set reminder_count=0,last_reminder_at=null,status='responded',responded_at=now() where campaign_id=$1 and synthetic_person_id=$2",[campaign,pending]);
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null,'responded people are excluded');
 }finally{await db.exec('ROLLBACK')}
});
test('Listening preferences: weekly mood, opt-out and pause persist; manual mood access is unaffected',async()=>{
 await db.exec('BEGIN');try{
  const {worker}=await fixture();
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'weekly',survey_reminders:false,pauseDays:0});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt.kind,'mood');
  await db.query("update app_private.listening_prompts set local_day=local_day-2,shown_at=now()-interval '2 days' where user_id=$1",[worker.id]);
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null);
  await db.query("update app_private.listening_prompts set local_day=local_day-6,shown_at=now()-interval '8 days' where user_id=$1",[worker.id]);
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt.kind,'mood');
  await db.query('delete from app_private.listening_prompts where user_id=$1',[worker.id]);
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'daily',survey_reminders:true,pauseDays:7});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null);
  const prefs=await listeningAction(db,worker,{action:'state'});assert.ok(prefs.paused_until);
  const mood=await moodState(db,worker);
  await submitMood(db,worker,{day:mood.day,mood:3});
  assert.equal((await moodState(db,worker)).answered,true,'pausing automatic prompts does not block voluntary participation');
  await listeningAction(db,worker,{action:'preferences',mood_frequency:'off',survey_reminders:false,pauseDays:0});
  assert.equal((await listeningAction(db,worker,{action:'prompt'})).prompt,null);
 }finally{await db.exec('ROLLBACK')}
});
