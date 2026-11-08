import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {departmentOverview,siteList} from '../server/departments.js';
const MIGRATIONS=['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites','20261108140000_four_departments','20261108150000_directory_integrations','20261108160000_response_sites'];
test('Department overview can be filtered by site without exposing segments below the privacy threshold',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  for(const f of MIGRATIONS)await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261108190000_daily_mood.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261108220000_edit_daily_mood.sql','utf8'));
  await db.exec(`insert into daily_moods(day,site_id,department_id,mood)
    select (now() at time zone 'Europe/Madrid')::date,p.site_id,p.department_id,4
    from (select site_id,department_id from synthetic_people limit 1) p cross join generate_series(1,10)`);
  assert.equal((await db.query('select count(*)::int n from survey_responses where site_id is null')).rows[0].n,0,'seed responses get a site');
  assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_name='survey_responses' and column_name in ('synthetic_person_id','assignment_id')")).rows[0].n,0);
  const sites=await siteList(db);
  assert.equal(sites.reduce((n,s)=>n+s.headcount,0),727);
  const all=await departmentOverview(db);
  const perSite=await Promise.all(sites.map(s=>departmentOverview(db,s.code)));
  for(const code of all.map(d=>d.code)){
   assert.equal(perSite.reduce((n,o)=>n+o.find(d=>d.code===code).headcount,0),all.find(d=>d.code===code).headcount,code+' headcount');
   assert.equal(perSite.reduce((n,o)=>n+o.find(d=>d.code===code).responses,0),all.find(d=>d.code===code).responses,code+' responses');
  }
  for(const o of perSite)for(const d of o)if(d.responses<d.threshold)assert.equal(d.score,null,'suppressed below threshold');
  assert.ok(perSite.some(o=>o.some(d=>d.score!==null)),'some site shows a score');
  await assert.rejects(departmentOverview(db,'no_existeix'),/Centre no trobat/);
 }finally{await db.close()}
});
