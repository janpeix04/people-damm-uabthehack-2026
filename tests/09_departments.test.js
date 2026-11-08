import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createSurvey} from '../server/surveys.js';
import {departmentOverview} from '../server/departments.js';
test('Department consolidation preserves people, responses, historical analytics, assignments and profiles',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'));
  const tables=['synthetic_people','survey_responses','analytics_segments','analysis_insights','action_recommendations','audience_assignments','user_profiles'];
  const before={};for(const t of tables)before[t]=(await db.query(`select count(*)::int n from public.${t}`)).rows[0].n;
  await db.exec(fs.readFileSync('supabase/migrations/20261108140000_four_departments.sql','utf8'));
  for(const f of ['20261108150000_directory_integrations','20261108160000_response_sites'])await db.exec(fs.readFileSync(`supabase/migrations/${f}.sql`,'utf8'));
  const depts=(await db.query('select code,name_ca from departments order by code')).rows;
  assert.deepEqual(depts.map(d=>d.code),['comercial','fabrica','logistica','oficina']);
  assert.deepEqual(new Set(depts.map(d=>d.name_ca)),new Set(['Fàbrica','Logística','Comercial','Oficina']));
  for(const t of tables)assert.equal((await db.query(`select count(*)::int n from public.${t}`)).rows[0].n,before[t],t);
  assert.equal((await db.query('select count(*)::int n from synthetic_people where work_area_code is null')).rows[0].n,0);
  const s=await createSurvey(db,{title:'Fàbrica',goal:'Benestar',status:'draft',zones:['envasat','malta'],channels:['app'],opensAt:'2026-01-01',closesAt:'2099-01-01',questions:Array.from({length:3},(_,i)=>({text:`Pregunta ${i}`,type:'scale'}))},false);
  const factory=(await db.query("select count(*)::int n from synthetic_people p join departments d on d.id=p.department_id where d.code='fabrica'")).rows[0].n;
  assert.equal(s.target,factory);
  const overview=await departmentOverview(db);
  assert.deepEqual(overview.map(d=>d.code),['fabrica','logistica','comercial','oficina']);
  assert.equal(overview.reduce((n,d)=>n+d.headcount,0),727);
  assert.ok(overview.every(d=>d.score===null||(d.score>=0&&d.score<=10)));
  await db.query("delete from survey_responses where department_id=(select id from departments where code='fabrica')");
  assert.equal((await departmentOverview(db)).find(d=>d.code==='fabrica').score,null);
  await assert.rejects(db.query("insert into departments(code,name_ca,name_es,name_en,collective,site_type,synthetic_headcount) values('rrhh','RRHH','RRHH','HR','oficines','office',0)"),/constraint/);
 }finally{await db.close()}
});
