import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {provisionUser,login,currentUser,authorize,userWallet,digest,sessionCookie,sessionToken} from '../server/auth.js';
let db;
const password='Test-only-password-strong-42';
before(async()=>{db=new PGlite({extensions:{pgcrypto}});for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites','20261108140000_four_departments'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'))});
after(async()=>{await db.close()});
test('Auth: password hashing, login, opaque session, live role, logout and expiry',async()=>{
  await db.exec('BEGIN');try{
    const id=await provisionUser(db,{email:'admin.auth@example.invalid',password,role:'hr_admin'});
    const stored=(await db.query('select password_hash from app_private.auth_credentials where user_id=$1',[id])).rows[0].password_hash;
    assert.ok(stored.startsWith('scrypt$'));assert.ok(!stored.includes(password));
    await assert.rejects(login(db,'admin.auth@example.invalid','wrong'),/incorrectes/);
    const s=await login(db,'ADMIN.AUTH@example.invalid',password);assert.equal(s.user.id,id);
    assert.equal((await currentUser(db,s.token)).role,'hr_admin');
    assert.equal((await db.query('select token_digest from app_private.auth_sessions where user_id=$1',[id])).rows[0].token_digest,digest(s.token));
    const cookie=sessionCookie(s.token,true);assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Strict/);assert.equal(sessionToken(cookie),s.token);
    await db.query("update user_profiles set app_role='hr_analyst' where user_id=$1",[id]);assert.equal((await currentUser(db,s.token)).role,'hr_analyst');
    await db.query('update user_profiles set active=false where user_id=$1',[id]);assert.equal(await currentUser(db,s.token),null);
    await db.query('update user_profiles set active=true where user_id=$1',[id]);await db.query("update app_private.auth_sessions set expires_at=now()-interval '1 second' where user_id=$1",[id]);assert.equal(await currentUser(db,s.token),null);
    const s2=await login(db,'admin.auth@example.invalid',password);await db.query('delete from app_private.auth_sessions where token_digest=$1',[digest(s2.token)]);assert.equal(await currentUser(db,s2.token),null);
  }finally{await db.exec('ROLLBACK')}
});
test('Auth: worker wallet is stable across sessions and cannot choose a role from the client',async()=>{
  await db.exec('BEGIN');try{
    await provisionUser(db,{email:'worker.auth@example.invalid',password,role:'worker'});
    const one=await login(db,'worker.auth@example.invalid',password);const two=await login(db,'worker.auth@example.invalid',password);
    assert.notEqual(one.token,two.token);assert.equal(await userWallet(db,one.user),await userWallet(db,two.user));
    assert.throws(()=>authorize(null,'/api/app/state','POST'),/iniciar sessió/);
    assert.throws(()=>authorize(one.user,'/api/hr/surveys','GET'),/permisos/);
    assert.throws(()=>authorize({role:'hr_analyst'},'/api/hr/surveys','POST'),/consultar/);
    assert.throws(()=>authorize({role:'hr_admin'},'/api/app/state','POST'),/treballador/);
    authorize({role:'hr_analyst'},'/api/hr/plaza','POST',{action:'state'});
  }finally{await db.exec('ROLLBACK')}
});
test('Auth: login rate limit persists failed attempts',async()=>{
  await db.exec('BEGIN');try{
    for(let i=0;i<10;i++)await assert.rejects(login(db,'missing@example.invalid','wrong','test-rate'),e=>e.status===401);
    await assert.rejects(login(db,'missing@example.invalid','wrong','test-rate'),e=>e.status===429);
  }finally{await db.exec('ROLLBACK')}
});

test('Auth: workplace is selected from the worker directory and the assigned HR profile',async()=>{
  await db.exec('BEGIN');try{
    const site=(await db.query('select s.id,s.code from sites s join synthetic_people p on p.site_id=s.id order by s.id limit 1')).rows[0];
    await provisionUser(db,{email:'site.worker@example.invalid',password,role:'worker',siteCode:site.code});
    const worker=await login(db,'site.worker@example.invalid',password,'site-test');
    assert.equal(worker.user.site.id,site.id);assert.equal((await currentUser(db,worker.token)).site.id,site.id);
    await provisionUser(db,{email:'site.hr@example.invalid',password,role:'hr_admin',siteCode:site.code});
    assert.equal((await login(db,'site.hr@example.invalid',password,'site-test')).user.site.id,site.id);
    await provisionUser(db,{email:'corporate.hr@example.invalid',password,role:'hr_admin'});
    assert.equal((await login(db,'corporate.hr@example.invalid',password,'site-test')).user.site,null);
    assert.ok(!('synthetic_person_id' in worker.user));
  }finally{await db.exec('ROLLBACK')}
});
