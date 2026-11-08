import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {provisionUser} from '../server/auth.js';
import {moodState,submitMood} from '../server/mood.js';

test('Mood anonymity: unlink existing answers, preserve content, reject edits and keep only a participation receipt',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  for(const [i,f]of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!f.includes('unlink_daily_mood')).sort().entries()){await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));if(i===0)await db.exec(fs.readFileSync('supabase/seed.sql','utf8'))}
  const user={id:await provisionUser(db,{email:'anonymous.mood@test.invalid',password:'Synthetic-password-2026',role:'worker'})};
  const person=(await db.query('select p.* from app_private.worker_accounts a join synthetic_people p on p.id=a.synthetic_person_id where a.user_id=$1',[user.id])).rows[0];
  const day=(await moodState(db,user)).day;
  const answer=(await db.query('insert into daily_moods(day,site_id,department_id,mood) values($1,$2,$3,4) returning id',[day,person.site_id,person.department_id])).rows[0];
  await db.query('insert into app_private.daily_mood_receipts(user_id,day,mood_id) values($1,$2,$3)',[user.id,day,answer.id]);
  await db.exec(fs.readFileSync('supabase/migrations/20261108250000_unlink_daily_mood.sql','utf8'));
  const columns=(await db.query("select column_name from information_schema.columns where table_schema='app_private' and table_name='daily_mood_receipts'")).rows.map(r=>r.column_name).sort();
  assert.deepEqual(columns,['day','user_id']);
  const publicColumns=(await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='daily_moods'")).rows.map(r=>r.column_name).sort();
  assert.deepEqual(publicColumns,['day','department_id','id','mood','site_id']);
  const state=await moodState(db,user);assert.equal(state.answered,true);assert.ok(!('current_mood'in state));assert.ok(!('mood_id'in state));
  await assert.rejects(submitMood(db,user,{day,mood:1,edit:true}),/editar/);
  await submitMood(db,user,{day,mood:1});
  const stored=(await db.query('select id,mood from daily_moods')).rows;assert.equal(stored.length,1);assert.equal(stored[0].id,answer.id);assert.equal(stored[0].mood,4);
 }finally{await db.close()}
});
