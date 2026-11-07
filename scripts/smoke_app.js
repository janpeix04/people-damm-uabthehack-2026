// Real HTTP smoke test. Removes only its own anonymous content and wallet.
import crypto from 'node:crypto';
import pg from 'pg';
import assert from 'node:assert/strict';
import {provisionUser,userWallet} from '../server/auth.js';
let token=null;
const cookies={},ids=[];
const suffix=crypto.randomBytes(8).toString('hex');
const marker='HTTP-plaza-'+[...crypto.randomBytes(24)].map(n=>String.fromCharCode(97+n%26)).join('');
const db=new pg.Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||54322),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD});
let poll=null;
async function call(path,data={}){
  const r=await fetch(`http://localhost:${process.env.FRONTEND_PORT||8080}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1',Cookie:cookies[path.startsWith('hr/')?'hr_admin':'worker']||''},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});
  const result=await r.json();assert.ok(r.ok,JSON.stringify(result));return result;
}
await db.connect();
try{
  for(const role of ['worker','hr_admin']){
    const email=`plaza.${role}.${suffix}@smoke.invalid`,password=crypto.randomBytes(24).toString('base64url');
    await db.query('BEGIN');try{const id=await provisionUser(db,{email,password,role});ids.push(id);await db.query('COMMIT');if(role==='worker')token=await userWallet(db,{id});}catch(e){await db.query('ROLLBACK');throw e;}
    const r=await fetch(`http://localhost:${process.env.FRONTEND_PORT||8080}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify({email,password})});assert.ok(r.ok);cookies[role]=r.headers.get('set-cookie').split(';')[0];
  }
  assert.ok(Array.isArray((await call('app/wallet')).surveys));console.log('PASS wallet');
  await call('app/avatar',{avatar:{skin:2,hair:1,shirt:3,style:2,logo:false}});
  assert.equal((await call('app/state')).avatar.skin,2);console.log('PASS avatar reload');
  await call('app/idea',{category:'altres',text:marker});
  const idea=(await call('hr/plaza',{action:'list'})).find(x=>x.text===marker);assert.equal(idea.status,'moderant');
  await call('hr/plaza',{action:'moderate',id:idea.id,status:'published'});
  assert.ok((await call('app/state')).ideas.some(x=>x.id===idea.id));console.log('PASS idea moderation');
  await call('app/reaction',{index:0,on:true});await call('app/reaction',{index:0,on:true});
  assert.deepEqual((await call('app/state')).plaza.reacted,[0]);console.log('PASS reaction reload');
  if(!(await call('app/state')).plaza.question){
    await call('hr/plaza',{action:'question',text:marker,options:['Option A','Option B'],approved:true});
    poll=(await call('app/state')).plaza.question.id;
    await call('app/daily',{question:poll,option:'0'});await call('app/daily',{question:poll,option:'1'});
    const state=(await call('app/state')).plaza;
    assert.equal(state.todayTotal,1);assert.equal(state.myAnswer,'answered');assert.equal(state.results,null);
    console.log('PASS daily duplicate prevention and privacy');
  }else console.log('SKIP daily HTTP: preserving existing published question (covered by isolated tests)');
}finally{
  await db.query('BEGIN');
  try{
    await db.query('delete from plaza_ideas where body_redacted=$1',[marker]);
    if(poll)await db.query('delete from plaza_daily_questions where id=$1 and prompt=$2',[poll,marker]);
    await db.query("delete from app_private.app_wallets where token_digest=extensions.digest($1,'sha256')",[token]);
    await db.query('delete from audit_events where actor_id=any($1::uuid[])',[ids]);
    await db.query('delete from auth.users where id=any($1::uuid[])',[ids]);
    await db.query('COMMIT');console.log('Temporary data removed');
  }catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
}
