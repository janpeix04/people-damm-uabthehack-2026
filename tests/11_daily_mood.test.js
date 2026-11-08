import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {moodState,submitMood} from '../server/mood.js';
import {departmentOverview} from '../server/departments.js';

test('Daily mood: one anonymous answer per day, optional department, current-day privacy and site filtering',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites','20261108140000_four_departments','20261108170000_others_department','20261108180000_altres_department_label','20261108190000_daily_mood','20261108220000_edit_daily_mood'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'));
  const user=(await db.query("insert into auth.users(email) values('mood@test.invalid') returning id")).rows[0];
  const person=(await db.query('select id,site_id,department_id from synthetic_people limit 1')).rows[0];
  await db.query('insert into app_private.worker_accounts(user_id,synthetic_person_id,wallet_token) values($1,$2,$3)',[user.id,person.id,'b1'.repeat(32)]);
  const state=await moodState(db,user);assert.equal(state.answered,false);
  await assert.rejects(submitMood(db,user,{day:state.day,mood:6}),/caretes/);
  await assert.rejects(submitMood(db,user,{day:'2000-01-01',mood:4}),/dia/);
  await db.exec('BEGIN');await submitMood(db,user,{day:state.day,mood:5,unspecified:true});await db.exec('COMMIT');
  await submitMood(db,user,{day:state.day,mood:1});
  assert.equal((await moodState(db,user)).answered,true);
  await submitMood(db,user,{day:state.day,mood:2,edit:true,unspecified:true});
  assert.equal((await moodState(db,user)).current_mood,2);
  await submitMood(db,user,{day:state.day,mood:5,edit:true,unspecified:true});
  assert.equal((await db.query('select count(*)::int n from daily_moods')).rows[0].n,1);
  assert.equal((await departmentOverview(db)).find(d=>d.code==='others').score,null);
  const columns=(await db.query("select column_name from information_schema.columns where table_name='daily_moods'")).rows.map(r=>r.column_name);
  assert.deepEqual(columns.sort(),['id','day','site_id','department_id','mood'].sort());
  const dept=(await db.query("select id from departments where code='others'")).rows[0].id;
  await db.query('insert into daily_moods(day,site_id,department_id,mood) select $1,$2,$3,5 from generate_series(1,9)',[state.day,person.site_id,dept]);
  const site=(await db.query('select code from sites where id=$1',[person.site_id])).rows[0].code;
  assert.equal((await departmentOverview(db,site)).find(d=>d.code==='others').score,10);
  await db.query("update daily_moods set day=day-1");
  assert.equal((await departmentOverview(db,site)).find(d=>d.code==='others').score,null);
 }finally{await db.close()}
});
