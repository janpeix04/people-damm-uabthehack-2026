import pg from 'pg';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {provisionUser,userWallet,digest} from '../server/auth.js';
const db=new pg.Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||54322),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD||'postgres'});
const base=`http://localhost:${process.env.FRONTEND_PORT||8080}`;
const password=randomBytes(24).toString('base64url');const suffix=randomBytes(8).toString('hex');const ids=[];
async function call(path,{body,cookie,header=true,origin}={}){
  const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(header?{'X-App-Request':'1'}:{}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});
  return {status:r.status,data:await r.json().catch(()=>null),cookie:r.headers.get('set-cookie')?.split(';')[0],flags:r.headers.get('set-cookie')};
}
await db.connect();
try{
  for(const role of ['worker','hr_admin']){await db.query('BEGIN');try{ids.push(await provisionUser(db,{email:`${role}.${suffix}@auth-test.invalid`,password,role}));await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}}
  assert.equal((await call('/api/hr/surveys')).status,401);assert.equal((await call('/api/app/state',{body:{}})).status,401);console.log('PASS anonymous API denied');
  assert.equal((await call('/api/auth/login',{body:{email:`worker.${suffix}@auth-test.invalid`,password},header:false})).status,403);
  assert.equal((await call('/api/auth/login',{body:{email:`worker.${suffix}@auth-test.invalid`,password},origin:'https://other.invalid'})).status,403);console.log('PASS CSRF/origin checks');
  assert.equal((await call('/api/auth/login',{body:{email:`worker.${suffix}@auth-test.invalid`,password:'incorrect'}})).status,401);
  const worker=await call('/api/auth/login',{body:{email:`worker.${suffix}@auth-test.invalid`,password}});assert.equal(worker.status,200);assert.match(worker.flags,/HttpOnly/);assert.match(worker.flags,/SameSite=Strict/);assert.equal(worker.data.user.role,'worker');
  const restored=(await call('/api/auth/session',{cookie:worker.cookie})).data.user;
  assert.equal(restored.id,ids[0]);assert.ok(worker.data.user.site?.id);assert.equal(restored.site.id,worker.data.user.site.id);console.log('PASS login + session restore + automatic workplace');
  assert.equal((await call('/api/hr/surveys',{cookie:worker.cookie})).status,403);assert.equal((await call('/api/hr/automation/generate-survey',{cookie:worker.cookie,body:{}})).status,403);console.log('PASS worker cannot access HR or automation');
  assert.equal((await call('/api/hr/directory',{cookie:worker.cookie})).status,403);
  assert.equal((await call('/api/app/wallet',{cookie:worker.cookie,body:{wallet:'ff'.repeat(32)}})).status,200);
  const pref={skin:4,hair:2,shirt:1,style:1,logo:false};assert.equal((await call('/api/app/avatar',{cookie:worker.cookie,body:{avatar:pref,wallet:'ff'.repeat(32)}})).status,200);
  assert.equal((await call('/api/app/state',{cookie:worker.cookie,body:{}})).data.avatar.skin,4);console.log('PASS account-bound wallet ignores client wallet');
  const hr=await call('/api/auth/login',{body:{email:`hr_admin.${suffix}@auth-test.invalid`,password}});assert.equal(hr.status,200);
  assert.equal((await call('/api/hr/surveys',{cookie:hr.cookie})).status,200);
  const directory=await call('/api/hr/directory',{cookie:hr.cookie});assert.equal(directory.status,200);assert.ok(directory.data.users.some(u=>u.id===ids[0]));assert.ok(!/password_hash|wallet_token|token_digest/.test(JSON.stringify(directory.data)));console.log('PASS HR directory protected and secrets excluded');
  const departments=await call('/api/hr/departments',{cookie:hr.cookie});assert.equal(departments.status,200);assert.deepEqual(departments.data.map(d=>d.code),['fabrica','logistica','comercial','oficina','others']);console.log('PASS official department overview');
  assert.equal((await call('/api/hr/plaza',{cookie:hr.cookie,body:{action:'state'}})).status,200);
  assert.equal((await call('/api/app/state',{cookie:hr.cookie,body:{}})).status,403);console.log('PASS HR access is separate');
  await call('/api/auth/logout',{cookie:worker.cookie,body:{}});assert.equal((await call('/api/auth/session',{cookie:worker.cookie})).data.user,null);assert.equal((await call('/api/app/state',{cookie:worker.cookie,body:{}})).status,401);console.log('PASS logout revokes server session');
  await db.query("update app_private.auth_sessions set expires_at=now()-interval '1 second' where token_digest=$1",[digest(hr.cookie.split('=')[1])]);assert.equal((await call('/api/hr/surveys',{cookie:hr.cookie})).status,401);console.log('PASS expired session denied');
}finally{
  for(const id of ids){const row=(await db.query('select wallet_token from app_private.worker_accounts where user_id=$1',[id])).rows[0];if(row)await db.query("delete from app_private.app_wallets where token_digest=extensions.digest($1,'sha256')",[row.wallet_token]);await db.query('delete from auth.users where id=$1',[id]);}
  await db.end();console.log('Temporary test accounts removed');
}
