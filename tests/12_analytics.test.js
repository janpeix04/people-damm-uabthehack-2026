import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {surveyAnalytics,analyticsCsv} from '../server/analytics.js';
import {createSurvey} from '../server/surveys.js';
let db;
before(async()=>{db=new PGlite({extensions:{pgcrypto}});const files=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();for(const [i,f]of files.entries()){await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));if(i===0)await db.exec(fs.readFileSync('supabase/seed.sql','utf8'))}});
after(async()=>db.close());
async function fixture(){
 const survey=await createSurvey(db,{title:'Analytics fixture',goal:'Provar dades reals',status:'open',zones:['envasat'],channels:['app'],opensAt:new Date(Date.now()-86400000).toISOString(),closesAt:new Date(Date.now()+86400000).toISOString(),questions:[{text:'Benestar',type:'scale',min:1,max:5,dim:'Benestar'},{text:'Seguretat',type:'list',options:['Sí','No']},{text:'Comentari',type:'text'}]},true);
 const person=(await db.query("select p.* from synthetic_people p join departments d on d.id=p.department_id where d.code='fabrica' limit 1")).rows[0];
 const site=(await db.query('select code from sites where id=$1',[person.site_id])).rows[0].code;
 const campaign=(await db.query('select id from campaigns where slug=$1',[survey.id])).rows[0].id;
 const version=(await db.query('select id from questionnaire_versions where campaign_id=$1',[campaign])).rows[0].id;
 async function insert(score=5,shift='morning',choice='Sí',siteId=person.site_id,submitted=new Date(Date.now()-60000)){
  const r=(await db.query(`insert into survey_responses(campaign_id,questionnaire_version_id,period_start,channel,locale,department_id,collective,shift,manager_level,age_band,tenure_band,duration_seconds,site_id,submitted_at)
    values($1,$2,current_date,'web','ca',$3,'fabriques',$4,'individual','30-39','1-3',60,$5,$6) returning id`,[campaign,version,person.department_id,shift,siteId,submitted])).rows[0].id;
  await db.query('insert into response_answers(response_id,question_id,numeric_value) values($1,$2,$3)',[r,survey.questions[0].id,score]);
  await db.query('insert into response_answers(response_id,question_id,choice_value) values($1,$2,$3::jsonb)',[r,survey.questions[1].id,JSON.stringify(choice)]);
  await db.query('insert into response_answers(response_id,question_id,free_text_redacted) values($1,$2,$3)',[r,survey.questions[2].id,'PRIVATE_COMMENT_NEVER_EXPOSE']);
  return r;
 }
 return {survey,site,person,insert};
}
test('Analytics: new DB responses update count, normalised score, distributions and CSV; small segments stay hidden',async()=>{
 await db.exec('BEGIN');try{
  const {survey,site,insert}=await fixture();const params=new URLSearchParams({survey:survey.id,site});
  let data=await surveyAnalytics(db,params);assert.equal(data.stats.totalResponses,0);assert.equal(data.stats.isSuppressed,true);assert.throws(()=>analyticsCsv(data),/protegida/);
  for(let i=0;i<9;i++)await insert();
  data=await surveyAnalytics(db,params);assert.equal(data.stats.isSuppressed,true);assert.equal(data.stats.questions.length,0);assert.equal(data.stats.avgScore,null);
  await insert();data=await surveyAnalytics(db,params);
  assert.equal(data.stats.totalResponses,10);assert.equal(data.stats.isSuppressed,false);assert.equal(data.stats.avgScore,10);assert.equal(data.stats.avgDurationSecs,60);
  assert.equal(data.forms.find(f=>f.id===survey.id).responses,10);
  assert.deepEqual(data.stats.questions[0].distribution,[{label:'5',count:10,pct:100}]);
  assert.equal(data.stats.dimensions[0].score,10);
  assert.ok(!JSON.stringify(data).includes('PRIVATE_COMMENT_NEVER_EXPOSE'));assert.ok(!JSON.stringify(data).includes('wallet'));
  const csv=analyticsCsv(data);assert.ok(csv.includes('"Total","10","10"'));assert.ok(!csv.includes('PRIVATE_COMMENT_NEVER_EXPOSE'));
  await insert(1,'night','No');data=await surveyAnalytics(db,params);
  assert.equal(data.stats.totalResponses,11);assert.equal(data.stats.avgScore,9.1);
  assert.equal(data.stats.shiftBreakdown.length,0,'cannot recover a small shift by subtraction');
  assert.equal(data.stats.questions[0].distribution.length,0);assert.equal(data.stats.questions[1].distribution.length,0);
  const narrow=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,site,shift:'night'}));
  assert.equal(narrow.stats.isSuppressed,true);assert.throws(()=>analyticsCsv(narrow),/protegida/);
  const complementary=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,site,shift:'morning'}));
  assert.equal(complementary.stats.totalResponses,10);assert.equal(complementary.stats.isSuppressed,true);assert.equal(complementary.stats.avgScore,null);
 }finally{await db.exec('ROLLBACK')}
});
test('Analytics: department, site, time and channel filters use stored values and actual invitations',async()=>{
 await db.exec('BEGIN');try{
  const {survey,site,person,insert}=await fixture();
  const other=(await db.query('select id,code from sites where id<>$1 and active limit 1',[person.site_id])).rows[0];
  for(let i=0;i<10;i++)await insert(3);
  for(let i=0;i<10;i++)await insert(1,'night','No',other.id,new Date(Date.now()-40*86400000));
  let data=await surveyAnalytics(db,new URLSearchParams({survey:survey.id}));assert.equal(data.stats.totalResponses,20);assert.equal(data.stats.avgScore,2.5);
  data=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,site}));assert.equal(data.stats.totalResponses,10);assert.equal(data.stats.avgScore,5);assert.equal(data.form.responses,10);
  const target=(await db.query(`select count(*)::int n from audience_assignments aa join campaigns c on c.id=aa.campaign_id join synthetic_people p on p.id=aa.synthetic_person_id where c.slug=$1 and p.site_id=$2`,[survey.id,person.site_id])).rows[0].n;
  assert.equal(data.stats.target,target);
  data=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,dateRange:'7d'}));assert.equal(data.stats.totalResponses,10);
  data=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,department:'oficina'}));assert.equal(data.stats.totalResponses,0);
  data=await surveyAnalytics(db,new URLSearchParams({survey:survey.id,channel:'teams'}));assert.equal(data.stats.totalResponses,0);
  await assert.rejects(surveyAnalytics(db,new URLSearchParams({survey:survey.id,site:'inventat'})),/Centre no trobat/);
  await assert.rejects(surveyAnalytics(db,new URLSearchParams({survey:survey.id,channel:'inventat'})),/Canal/);
 }finally{await db.exec('ROLLBACK')}
});
