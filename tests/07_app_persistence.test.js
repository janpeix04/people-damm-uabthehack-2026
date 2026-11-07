import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {appAction,hrPlazaAction,plazaState} from '../server/app.js';
let db;
before(async()=>{db=new PGlite({extensions:{pgcrypto}});for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'))});
after(async()=>{await db.close()});
const wallet='a1'.repeat(32);
test('App: avatar persists, anonymous idea waits for moderation, weekly participation counts once',async()=>{
  await db.exec('BEGIN');try{
    assert.equal((await plazaState(db,wallet)).plaza.participants,0);
    const avatar={skin:3,hair:2,shirt:4,style:1,logo:false};await appAction(db,'avatar',{wallet,avatar});
    assert.deepEqual((await plazaState(db,wallet)).avatar,avatar);
    const submitted=await appAction(db,'idea',{wallet,category:'altres',text:'Millorem les pauses, contacte demo@example.com'});
    assert.equal(submitted.ideas.length,0);assert.equal(submitted.plaza.participants,1);
    const pending=await hrPlazaAction(db,{action:'list'});assert.equal(pending[0].status,'moderant');assert.ok(!pending[0].text.includes('demo@example.com'));
    await hrPlazaAction(db,{action:'moderate',id:pending[0].id,status:'published'});
    assert.equal((await plazaState(db,wallet)).ideas.length,1);
    await appAction(db,'reaction',{wallet,index:0,on:true});await appAction(db,'reaction',{wallet,index:0,on:true});
    const state=await plazaState(db,wallet);assert.equal(state.plaza.participants,1);assert.deepEqual(state.plaza.reacted,[0]);
  }finally{await db.exec('ROLLBACK')}
});
test('App: daily vote survives reload without storing the chosen option in the receipt; suppress below 10',async()=>{
  await db.exec('BEGIN');try{
    await assert.rejects(hrPlazaAction(db,{action:'question',text:'Com va?',options:['Bé','Normal']}),/aprovar/);
    await hrPlazaAction(db,{action:'question',text:'Com va?',options:['Bé','Normal'],approved:true});
    const q=(await plazaState(db,wallet)).plaza.question;
    await appAction(db,'daily',{wallet,question:q.id,option:'0'});
    await appAction(db,'daily',{wallet,question:q.id,option:'1'});
    const state=await plazaState(db,wallet);assert.equal(state.plaza.myAnswer,'answered');assert.equal(state.plaza.todayTotal,1);assert.equal(state.plaza.results,null);
    for(let i=2;i<=10;i++)await appAction(db,'daily',{wallet:i.toString(16).padStart(64,'0'),question:q.id,option:'1'});
    const result=(await plazaState(db,wallet)).plaza;assert.equal(result.todayTotal,10);assert.equal(result.results[0].n,1);assert.equal(result.results[1].n,9);
  }finally{await db.exec('ROLLBACK')}
});
test('App: rejects incomplete survey before awarding points',async()=>{
  await db.exec('BEGIN');try{
    const w=await appAction(db,'wallet',{wallet,locale:'ca'});const s=w.surveys[0];assert.ok(s);
    await assert.rejects(appAction(db,'submit',{wallet,survey:s.id,access_token:s.access_token,locale:'ca',answers:[{question_id:s.questions[0].id,numeric_value:3}]}),/obligatòries/);
  }finally{await db.exec('ROLLBACK')}
});
