import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {appAction,hrPlazaAction,plazaState} from '../server/app.js';
let db;
before(async()=>{db=new PGlite({extensions:{pgcrypto}});for(const f of ['20261107162128_init_people_listening_platform','SEED','20261108090000_worker_app_wallet_rewards','20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108200000_plaza_idea_reactions','20261108210000_plaza_sites'])await db.exec(fs.readFileSync(f==='SEED'?'supabase/seed.sql':`supabase/migrations/${f}.sql`,'utf8'))});
after(async()=>{await db.close()});
const wallet='a1'.repeat(32);
test('App: avatar persists, anonymous idea waits for moderation, opinions do not track weekly participation or award points',async()=>{
  await db.exec('BEGIN');try{
    assert.equal((await plazaState(db,wallet)).plaza.participants,0);
    const beforeWallet=await appAction(db,'wallet',{wallet});
    const avatar={skin:3,hair:2,shirt:4,style:1,logo:false};await appAction(db,'avatar',{wallet,avatar});
    assert.deepEqual((await plazaState(db,wallet)).avatar,avatar);
    const submitted=await appAction(db,'idea',{wallet,category:'altres',text:'Millorem les pauses, contacte demo@example.com'});
    assert.equal(submitted.ideas.length,0);assert.equal(submitted.plaza.participants,0);
    const pending=await hrPlazaAction(db,{action:'list'});assert.equal(pending[0].status,'moderant');assert.ok(!pending[0].text.includes('demo@example.com'));
    await assert.rejects(appAction(db,'reaction',{wallet,idea:pending[0].id,on:true}),/trobada/);
    await hrPlazaAction(db,{action:'moderate',id:pending[0].id,status:'published'});
    const site=(await db.query('select s.code from sites s join synthetic_people p on p.site_id=s.id where p.id=app_private.wallet_person($1,false)',[wallet])).rows[0].code;
    const otherSite=(await db.query('select code from sites where code<>$1 and active limit 1',[site])).rows[0].code;
    assert.equal((await hrPlazaAction(db,{action:'state',site})).ideas.length,1);
    assert.equal((await hrPlazaAction(db,{action:'state',site:otherSite})).ideas.length,0);
    assert.equal((await hrPlazaAction(db,{action:'list',site:otherSite})).length,0);
    assert.equal((await plazaState(db,wallet)).ideas.length,1);
    await appAction(db,'reaction',{wallet,idea:pending[0].id,on:true});await appAction(db,'reaction',{wallet,idea:pending[0].id,on:true});
    const state=await plazaState(db,wallet);assert.equal(state.plaza.participants,0);assert.equal(state.ideas[0].likes,1);assert.equal(state.ideas[0].reacted,true);
    const otherWallet='b2'.repeat(32);
    await plazaState(db,otherWallet);
    await db.query('update synthetic_people set site_id=(select id from sites where code=$2) where id=app_private.wallet_person($1,false)',[otherWallet,otherSite]);
    assert.equal((await plazaState(db,otherWallet)).ideas.length,0,'other workplace cannot see the opinion');
    await assert.rejects(appAction(db,'reaction',{wallet:otherWallet,idea:pending[0].id,on:true}),/trobada/);
    await db.query('update synthetic_people set site_id=(select site_id from synthetic_people where id=app_private.wallet_person($1,false)) where id=app_private.wallet_person($2,false)',[wallet,otherWallet]);
    assert.equal((await plazaState(db,otherWallet)).ideas[0].reacted,false);
    await appAction(db,'reaction',{wallet:otherWallet,idea:pending[0].id,on:true});
    assert.equal((await plazaState(db,wallet)).ideas[0].likes,2);
    await appAction(db,'reaction',{wallet:otherWallet,idea:pending[0].id,on:false});
    await appAction(db,'reaction',{wallet,idea:pending[0].id,on:false});
    assert.equal((await plazaState(db,wallet)).ideas[0].likes,0);
    assert.equal((await db.query('select count(*)::int n from app_private.plaza_weekly_participants')).rows[0].n,0);
    assert.equal((await appAction(db,'wallet',{wallet})).points,beforeWallet.points);
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
