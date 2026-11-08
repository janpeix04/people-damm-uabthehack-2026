import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { createSurvey, listSurveys, changeStatus } from '../server/surveys.js';

let db;
before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  for (const f of ['supabase/migrations/20261107162128_init_people_listening_platform.sql','supabase/seed.sql','supabase/migrations/20261108090000_worker_app_wallet_rewards.sql','supabase/migrations/20261108100000_plaza_preferences_reward_operations.sql','supabase/migrations/20261108110000_plaza_topic_reactions.sql','supabase/migrations/20261108120000_local_auth.sql','supabase/migrations/20261108130000_user_sites.sql','supabase/migrations/20261108140000_four_departments.sql']) await db.exec(fs.readFileSync(f,'utf8'));
});
after(async () => { await db.close(); });
const survey = (status='open') => ({title:'Prova RRHH',goal:'Millorar els torns',status,locale:'es',zones:['envasat','logistica'],channels:['app','qr'],opensAt:new Date(Date.now()-3600000).toISOString(),closesAt:new Date(Date.now()+86400000).toISOString(),questions:[{type:'faces',text:'Benestar?',secs:10},{type:'yesno',text:'Suport?',secs:10},{type:'text',text:'Propostes?',secs:20}]});

test('RRHH: DB department codes target the exact audience, including Altres without map zones',async()=>{
 await db.exec('BEGIN');
 try{
  await db.exec(fs.readFileSync('supabase/migrations/20261108170000_others_department.sql','utf8').replace(/^begin;|commit;$/gm,''));
  await db.query("update synthetic_people set department_id=(select id from departments where code='others') where id=(select id from synthetic_people limit 1)");
  const saved=await createSurvey(db,{...survey(),zones:[],departmentCodes:['others']},true);
  assert.equal(saved.target,1);assert.deepEqual(saved.departmentCodes,['others']);
  assert.deepEqual((await listSurveys(db,saved.id))[0].departmentCodes,['others']);
  await assert.rejects(createSurvey(db,{...survey(),departmentCodes:['inventat']},true),/departaments/);
 }finally{await db.exec('ROLLBACK')}
});

test('RRHH: publicació requereix aprovació i valida dates i públic', async () => {
  await assert.rejects(createSurvey(db,survey(),false),/aprovació humana/);
  await assert.rejects(createSurvey(db,{...survey(),closesAt:'invalid'},true),/tancament/);
  await assert.rejects(createSurvey(db,{...survey(),zones:['inventat']},true),/públic/);
});

test('RRHH: crea campanya, versió, traduccions i assignacions; persisteix en rellegir', async () => {
  await db.exec('BEGIN');
  try {
    const saved=await createSurvey(db,survey(),true);
    assert.equal(saved.source,'db'); assert.equal(saved.status,'open'); assert.equal(saved.locale,'es');
    assert.ok(saved.target>0); assert.equal(saved.questions.length,3);
    assert.equal(saved.questions[0].min,1);assert.equal(saved.questions[0].max,5);
    assert.deepEqual(saved.questions[1].options,['Sí','No','No ho sé']);
    assert.equal(saved.questions[2].required,false);
    assert.deepEqual((await listSurveys(db,saved.id))[0],saved);
    const pending=(await db.query(`select count(*)::int n from app_private.pending_assignments((select synthetic_person_id from audience_assignments where campaign_id=(select id from campaigns where slug=$1) limit 1)) where campaign_id=(select id from campaigns where slug=$1)`,[saved.id])).rows[0];
    assert.equal(pending.n,1);
    await changeStatus(db,saved.id,'closed');
    assert.equal((await listSurveys(db,saved.id))[0].status,'closed');
    await assert.rejects(changeStatus(db,saved.id,'open'),/reobrir/);
  } finally { await db.exec('ROLLBACK'); }
});

test('RRHH: duplicar genera un esborrany independent sense respostes ni aprovació heretada', async () => {
  await db.exec('BEGIN');
  try {
    const original=await createSurvey(db,survey(),true);
    const copy=await createSurvey(db,{...original,title:'Còpia',status:'draft'},false);
    assert.notEqual(copy.id,original.id);assert.equal(copy.responses,0);assert.equal(copy.status,'draft');
    await assert.rejects(changeStatus(db,copy.id,'open',false),/aprovació humana/);
    assert.equal((await changeStatus(db,copy.id,'open',true)).status,'open');
  } finally { await db.exec('ROLLBACK'); }
});

test('RRHH: programar i obrir ara manté una única versió publicada', async () => {
  await db.exec('BEGIN');
  try {
    const scheduled=await createSurvey(db,{...survey(),status:'scheduled',opensAt:new Date(Date.now()+3600000).toISOString()},true);
    assert.equal(scheduled.status,'scheduled');
    assert.equal((await changeStatus(db,scheduled.id,'open')).status,'open');
    const count=(await db.query(`select count(*)::int n from questionnaire_versions where campaign_id=(select id from campaigns where slug=$1) and status='published'`,[scheduled.id])).rows[0].n;
    assert.equal(count,1);
  } finally { await db.exec('ROLLBACK'); }
});

test('RRHH: edita un esborrany amb el mateix identificador i protegeix els publicats', async () => {
  await db.exec('BEGIN');
  try {
    const draft=await createSurvey(db,survey('draft'),false);
    const edited=await createSurvey(db,{...draft,title:'Títol revisat'},false,draft.id);
    assert.equal(edited.id,draft.id);assert.equal(edited.title,'Títol revisat');assert.equal(edited.questions.length,3);
    const published=await createSurvey(db,{...edited,status:'open'},true,draft.id);
    assert.equal(published.id,draft.id);assert.equal(published.status,'open');
    await assert.rejects(createSurvey(db,{...published,status:'draft'},false,draft.id),/Només es poden editar/);
  } finally { await db.exec('ROLLBACK'); }
});

test('RRHH: permet publicar enquestes amb més de 12 preguntes (sense límit artificial)', async () => {
  await db.exec('BEGIN');
  try {
    const questions15 = Array.from({ length: 15 }, (_, i) => ({ type: 'scale', text: `Pregunta ${i + 1}?`, min: 1, max: 5, secs: 10 }));
    const saved = await createSurvey(db, { ...survey('open'), questions: questions15 }, true);
    assert.equal(saved.questions.length, 15);
    assert.equal(saved.status, 'open');
  } finally { await db.exec('ROLLBACK'); }
});
