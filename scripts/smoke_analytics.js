// Real HTTP check: isolated synthetic campaign, nine fixture answers plus one worker submission.
// Only this run's campaign, test accounts and wallet are removed afterwards.
import crypto from 'node:crypto';
import pg from 'pg';
import assert from 'node:assert/strict';
import {provisionUser,userWallet} from '../server/auth.js';
const db=new pg.Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||54322),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD});
const base=`http://localhost:${process.env.FRONTEND_PORT||8080}`,suffix=crypto.randomBytes(8).toString('hex'),ids=[],cookies={};
let campaign=null,wallet=null;
async function request(path,role,body){
 const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-App-Request':'1',Cookie:cookies[role]||''},body:body?JSON.stringify(body):undefined});
 const data=await response.json();assert.ok(response.ok,JSON.stringify(data));return data;
}
await db.connect();
try{
 for(const role of ['worker','hr_admin']){
  const email=`analytics.${role}.${suffix}@smoke.invalid`,password=crypto.randomBytes(24).toString('base64url');
  await db.query('BEGIN');try{ids.push(await provisionUser(db,{email,password,role}));await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}
  const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify({email,password})});assert.ok(response.ok);cookies[role]=response.headers.get('set-cookie').split(';')[0];
 }
 wallet=await userWallet(db,{id:ids[0]});
 const person=(await db.query(`select p.*,d.code department,s.code site_code from app_private.worker_accounts a join synthetic_people p on p.id=a.synthetic_person_id join departments d on d.id=p.department_id join sites s on s.id=p.site_id where a.user_id=$1`,[ids[0]])).rows[0];
 const saved=await request('/api/hr/surveys','hr_admin',{approved_by_human:true,survey:{title:`Analytics smoke ${suffix}`,goal:'Verificar anàlisi PostgreSQL',status:'open',locale:'ca',zones:[],departmentCodes:[person.department],channels:['app'],opensAt:new Date(Date.now()-60000).toISOString(),closesAt:new Date(Date.now()+86400000).toISOString(),questions:Array.from({length:3},(_,i)=>({type:'scale',text:`Escala de prova ${i+1}`,min:1,max:5,secs:10}))}});
 campaign=(await db.query('select id from campaigns where slug=$1',[saved.id])).rows[0].id;
 const version=(await db.query('select id from questionnaire_versions where campaign_id=$1',[campaign])).rows[0].id;
 for(let i=0;i<9;i++){
  const r=(await db.query(`insert into survey_responses(campaign_id,questionnaire_version_id,period_start,channel,locale,department_id,collective,shift,manager_level,age_band,tenure_band,duration_seconds,site_id)
    values($1,$2,current_date,'web','ca',$3,$4,$5,'individual','30-39','1-3',60,$6) returning id`,[campaign,version,person.department_id,(await db.query('select collective from departments where id=$1',[person.department_id])).rows[0].collective,person.shift,person.site_id])).rows[0].id;
  for(const q of saved.questions)await db.query('insert into response_answers(response_id,question_id,numeric_value) values($1,$2,5)',[r,q.id]);
 }
 const query=new URLSearchParams({survey:saved.id,site:person.site_code});
 const before=await request('/api/hr/analytics?'+query,'hr_admin');assert.equal(before.stats.totalResponses,9);assert.equal(before.stats.isSuppressed,true);
 let r=await fetch(base+'/api/hr/analytics.csv?'+query,{headers:{Cookie:cookies.hr_admin}});assert.equal(r.status,403);
 r=await fetch(base+'/api/hr/analytics?'+query,{headers:{Cookie:cookies.worker}});assert.equal(r.status,403);
 const coverage=await request('/api/hr/representation?'+new URLSearchParams({survey:saved.id}),'hr_admin');
 assert.ok(coverage.summary.population>=10);assert.equal(coverage.summary.participants,null);assert.ok(!JSON.stringify(coverage).includes('synthetic_person_id'));
 r=await fetch(base+'/api/hr/representation?'+new URLSearchParams({survey:saved.id}),{headers:{Cookie:cookies.worker}});assert.equal(r.status,403);
 r=await fetch(base+'/api/hr/reminders',{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1',Cookie:cookies.worker},body:JSON.stringify({survey:saved.id,groupType:'all'})});assert.equal(r.status,403);
 await request('/api/app/listening','worker',{action:'preferences',mood_frequency:'off',survey_reminders:true,pauseDays:0});
 const reminder=await request('/api/hr/reminders','hr_admin',{survey:saved.id,groupType:'all'});assert.equal(reminder.channel,'in_app');
 assert.equal((await request('/api/app/listening','worker',{action:'prompt'})).prompt.kind,'survey');
 assert.equal((await request('/api/app/listening','worker',{action:'prompt'})).prompt,null);
 console.log('PASS HTTP representation + private in-app reminder + daily cap; worker cannot access HR coverage or queue reminders');
 const state=await request('/api/app/wallet','worker',{});const invitation=state.surveys.find(s=>s.id===saved.id);assert.ok(invitation);
 await request('/api/app/submit','worker',{survey:saved.id,access_token:invitation.access_token,locale:'ca',duration_seconds:60,answers:saved.questions.map(q=>({question_id:q.id,numeric_value:1}))});
 const after=await request('/api/hr/analytics?'+query,'hr_admin');assert.equal(after.stats.totalResponses,10);assert.equal(after.stats.isSuppressed,false);assert.equal(after.stats.avgScore,9);assert.equal(after.form.responses,10);
 r=await fetch(base+'/api/hr/analytics.csv?'+query,{headers:{Cookie:cookies.hr_admin}});assert.equal(r.status,200);assert.ok((await r.text()).includes('"Total","10","9"'));
 const count=(await db.query('select count(*)::int n from survey_responses where campaign_id=$1',[campaign])).rows[0].n;assert.equal(count,after.stats.totalResponses);
 console.log('PASS HTTP: worker submission updates DB + dashboard + aggregate CSV; worker access and sub-threshold export blocked');
}finally{
 await db.query('BEGIN');try{
  if(campaign){await db.query('delete from response_answers where response_id in(select id from survey_responses where campaign_id=$1)',[campaign]);await db.query('delete from survey_responses where campaign_id=$1',[campaign]);await db.query('delete from audience_assignments where campaign_id=$1',[campaign]);await db.query('delete from questionnaire_versions where campaign_id=$1',[campaign]);await db.query('delete from audit_events where entity_id=$1',[campaign]);await db.query('delete from campaigns where id=$1',[campaign])}
  if(wallet)await db.query("delete from app_private.app_wallets where token_digest=extensions.digest($1,'sha256')",[wallet]);
  await db.query('delete from audit_events where actor_id=any($1::uuid[])',[ids]);await db.query('delete from auth.users where id=any($1::uuid[])',[ids]);await db.query('COMMIT');console.log('Temporary analytics data removed');
 }catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
}
