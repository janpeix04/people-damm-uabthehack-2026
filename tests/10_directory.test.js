import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {provisionUser} from '../server/auth.js';
import {directoryOverview} from '../server/directory.js';
test('Directory lists real accounts, trusted origin, official department and recorded sync state without secrets',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites','20261108140000_four_departments','20261108150000_directory_integrations'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'));
  assert.equal((await directoryOverview(db)).users.length,0);
  assert.equal((await directoryOverview(db)).integration.state,'not_connected');
  const worker=await provisionUser(db,{email:'directory@example.invalid',password:'test-directory-password-42',name:'Usuari local',role:'worker'});
  let data=await directoryOverview(db);assert.equal(data.users.length,1);assert.equal(data.users[0].id,worker);assert.equal(data.users[0].source,'local');assert.ok(data.users[0].site);assert.ok(['fabrica','logistica','comercial','oficina'].includes(data.users[0].department_code));
  assert.ok(!/password_hash|wallet_token|token_digest|synthetic_person_id/.test(JSON.stringify(data)));
  const connection=(await db.query("insert into integration_connections(provider,name,status) values('microsoft_graph','Test Graph','connected') returning id")).rows[0].id;
  assert.equal((await directoryOverview(db)).integration.state,'pending_verification');
  const external=(await db.query("insert into auth.users(email) values('external@example.invalid') returning id")).rows[0].id;
  await db.query("insert into user_profiles(user_id,app_role,display_label) values($1,'worker','Importat')",[external]);
  await db.query("insert into app_private.directory_links(user_id,connection_id,tenant_id,external_id) values($1,$2,'tenant-test','external-test')",[external,connection]);
  await db.query("insert into app_private.directory_sync_runs(connection_id,status,finished_at,imported_count) values($1,'succeeded',now(),1)",[connection]);
  data=await directoryOverview(db);assert.equal(data.integration.importedUsers,1);assert.equal(data.integration.state,'registered');assert.ok(data.integration.lastSuccess);
  assert.equal(data.users.find(u=>u.id===external).access,'pending');
  await db.query('update user_profiles set active=false where user_id=$1',[worker]);assert.equal((await directoryOverview(db)).users.find(u=>u.id===worker).access,'inactive');
  await db.exec('set role anon');await assert.rejects(db.query('select * from app_private.directory_links'),/permission denied/);
 }finally{await db.close()}
});
