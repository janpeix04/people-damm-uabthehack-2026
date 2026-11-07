import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
let db;
before(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  for(const f of ['supabase/migrations/20261107162128_init_people_listening_platform.sql','supabase/seed.sql','supabase/migrations/20261108090000_worker_app_wallet_rewards.sql','supabase/migrations/20261108100000_plaza_preferences_reward_operations.sql']) await db.exec(fs.readFileSync(f,'utf8'));
});
after(async()=>{await db.close()});
const admin='00000000-0000-4000-a000-000000000001';
async function rejected(sql,params,pattern){
  await db.exec('SAVEPOINT expected_error');
  try{await assert.rejects(db.query(sql,params),pattern)}finally{await db.exec('ROLLBACK TO expected_error')}
}
test('La Plaça: sanitize PII, pending by default, automatic moderation history and anonymous reads',async()=>{
  await db.exec('BEGIN');try{
    const i=(await db.query("insert into plaza_ideas(category_id,body_redacted) values('altres','Contact demo@example.com 600112233') returning *")).rows[0];
    assert.equal(i.status,'pending');assert.ok(!i.body_redacted.includes('demo@example.com'));assert.ok(!i.body_redacted.includes('600112233'));
    await db.exec('SET LOCAL ROLE anon');
    assert.equal((await db.query('select count(*)::int n from plaza_ideas')).rows[0].n,0);
    await db.exec('RESET ROLE');await db.query("update plaza_ideas set status='published' where id=$1",[i.id]);
    assert.equal((await db.query('select count(*)::int n from app_private.plaza_moderation_events where idea_id=$1',[i.id])).rows[0].n,2);
    await db.exec('SET LOCAL ROLE anon');assert.equal((await db.query('select count(*)::int n from plaza_ideas')).rows[0].n,1);
    await rejected('select * from app_private.worker_preferences',[],/permission denied/);
  }finally{await db.exec('ROLLBACK')}
});
test('Preferences: wallet FK, avatar ranges and anonymous content separation',async()=>{
  await db.exec('BEGIN');try{
    await db.query('select app_wallet_open($1)',['da'.repeat(32)]);
    const wallet=(await db.query('select token_digest from app_private.app_wallets limit 1')).rows[0].token_digest;
    await db.query('insert into app_private.worker_preferences(wallet_digest) values($1)',[wallet]);
    await rejected('update app_private.worker_preferences set skin=99',[],/check constraint/);
    const columns=(await db.query("select column_name from information_schema.columns where table_name in ('plaza_ideas','plaza_daily_votes')")).rows.map(r=>r.column_name);
    assert.ok(!columns.some(c=>/wallet|person|author|user_id/.test(c)));
  }finally{await db.exec('ROLLBACK')}
});
test('Daily polls: approval, option ownership, duplicate receipts and weekly unique participant',async()=>{
  await db.exec('BEGIN');try{
    const q=(await db.query("insert into plaza_daily_questions(question_date,prompt) values(current_date,'Com estàs?') returning id")).rows[0].id;
    await rejected("update plaza_daily_questions set status='published' where id=$1",[q],/check constraint/);
    await db.query("update plaza_daily_questions set status='published',approved_by=$2,approved_at=now() where id=$1",[q,admin]);
    const o=(await db.query("insert into plaza_daily_options(question_id,option_key,label,position) values($1,'be','Bé',1) returning id",[q])).rows[0].id;
    await db.query('insert into app_private.plaza_daily_votes(question_id,option_id) values($1,$2)',[q,o]);
    await db.query('select app_wallet_open($1)',['db'.repeat(32)]);
    const wallet=(await db.query('select token_digest from app_private.app_wallets limit 1')).rows[0].token_digest;
    await db.query('insert into app_private.plaza_daily_receipts values($1,$2)',[wallet,q]);
    await rejected('insert into app_private.plaza_daily_receipts values($1,$2)',[wallet,q],/duplicate key/);
    await db.query("insert into app_private.plaza_weekly_participants values(date_trunc('week',now())::date,$1)",[wallet]);
    await rejected("insert into app_private.plaza_weekly_participants values(date_trunc('week',now())::date,$1)",[wallet],/duplicate key/);
  }finally{await db.exec('ROLLBACK')}
});
test('Rewards: stock reservation, no oversell, expiry and one-time code consumption',async()=>{
  await db.exec('BEGIN');try{
    const person=(await db.query('select id from synthetic_people limit 1')).rows[0].id;
    await db.query("update rewards set stock_remaining=1,code_valid_days=7 where id='cafe'");
    const r=(await db.query("insert into app_private.reward_redemptions(synthetic_person_id,reward_id,cost,code) values($1,'cafe',50,'TEST-STOCK') returning *",[person])).rows[0];
    assert.ok(r.expires_on);assert.equal((await db.query("select stock_remaining from rewards where id='cafe'")).rows[0].stock_remaining,0);
    await rejected("insert into app_private.reward_redemptions(synthetic_person_id,reward_id,cost,code) values($1,'cafe',50,'TEST-OVERSELL')",[person],/reward_out_of_stock/);
    await db.query('select consume_reward_code($1,$2)',['TEST-STOCK',admin]);
    await rejected('select consume_reward_code($1,$2)',['TEST-STOCK',admin],/code_not_available/);
    await db.query("update rewards set stock_remaining=1,available_until=current_date-1 where id='cafe'");
    await rejected("insert into app_private.reward_redemptions(synthetic_person_id,reward_id,cost,code) values($1,'cafe',50,'TEST-UNAVAILABLE')",[person],/reward_unavailable/);
  }finally{await db.exec('ROLLBACK')}
});
