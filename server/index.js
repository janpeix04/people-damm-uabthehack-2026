import {getSurveyAnalytics} from './enquestes-analytics.js';
import http from 'node:http';
import pg from 'pg';
import {createSurvey,listSurveys,changeStatus,InputError} from './surveys.js';
import {appAction,hrPlazaAction} from './app.js';
import {departmentOverview,siteList} from './departments.js';
import {directoryOverview} from './directory.js';
import {moodState,submitMood} from './mood.js';
import {surveyAnalytics,analyticsCsv} from './analytics.js';
import {representation,createReminder} from './representation.js';
import {listeningAction} from './listening.js';
import {login,currentUser,authorize,userWallet,sessionToken,sessionCookie,digest} from './auth.js';
const pool=new pg.Pool({host:process.env.POSTGRES_HOST||'postgres',port:Number(process.env.POSTGRES_PORT||5432),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD});
const secure=process.env.AUTH_COOKIE_SECURE==='true';
http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  let db;
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/healthz'){await pool.query('select 1');res.end('{"ok":true}');return;}
    if(!path.startsWith('/api/'))throw new InputError('Ruta no trobada.',404);
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new InputError('Origen no autoritzat.',403);
    let body={};
    if(req.method!=='GET'){
      if(req.headers['x-app-request']!=='1')throw new InputError('Petició no autoritzada.',403);
      if(!req.headers['content-type']?.startsWith('application/json'))throw new InputError('Cal enviar JSON.',415);
      let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>131072)throw new InputError('Petició massa gran.',413);}
      try{body=JSON.parse(raw)}catch{throw new InputError('JSON no vàlid.');}
      if(!body||typeof body!=='object'||Array.isArray(body))throw new InputError('JSON no vàlid.');
    }
    db=await pool.connect();
    const token=sessionToken(req.headers.cookie);
    if(path==='/api/auth/login'&&req.method==='POST'){
      const result=await login(db,body.email,body.password,req.socket.remoteAddress||'local');
      if(token)await db.query('delete from app_private.auth_sessions where token_digest=$1',[digest(token)]);
      res.setHeader('Set-Cookie',sessionCookie(result.token,secure));res.end(JSON.stringify({user:result.user}));return;
    }
    if(path==='/api/auth/logout'&&req.method==='POST'){
      if(token)await db.query('delete from app_private.auth_sessions where token_digest=$1',[digest(token)]);
      res.setHeader('Set-Cookie',sessionCookie('',secure));res.end('{"ok":true}');return;
    }
    const user=await currentUser(db,token);
    if(path==='/api/auth/session'&&req.method==='GET'){res.end(JSON.stringify({user}));return;}
    authorize(user,path,req.method,body);
    if(!path.startsWith('/api/hr/')&&!path.startsWith('/api/app/'))throw new InputError('Ruta no trobada.',404);
    if(path.startsWith('/api/hr/automation/')&&req.method==='POST'){
      const action=path.split('/').pop();
      if(!['generate-survey','publish-survey','analytics','ingest-responses'].includes(action))throw new InputError('Ruta no trobada.',404);
      if(action==='publish-survey'&&body.approved_by_human!==true)throw new InputError('Cal aprovació humana.',403);
      const r=await fetch(`http://n8n:5678/webhook/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,approved_by:user.name}),signal:AbortSignal.timeout(110000)});
      res.statusCode=r.status;res.end(await r.text());return;
    }
    if(req.method==='GET'&&path==='/api/hr/surveys'){res.end(JSON.stringify(await listSurveys(db)));return;}
    if(req.method==='GET'&&path==='/api/hr/representation'){
      const query=new URL(req.url,'http://localhost').searchParams;
      await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const data=await representation(db,query.get('survey')||'',query.get('site')||'');
      await db.query('COMMIT');res.end(JSON.stringify(data));return;
    }
    if(req.method==='GET'&&path==='/api/hr/enquestes-analytics'){
      await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const data=await getSurveyAnalytics(db,Object.fromEntries(new URL(req.url,'http://localhost').searchParams));
      await db.query('COMMIT');res.end(JSON.stringify(data));return;
    }
    if(req.method==='GET'&&['/api/hr/analytics','/api/hr/analytics.csv'].includes(path)){
      await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const data=await surveyAnalytics(db,new URL(req.url,'http://localhost').searchParams);
      const output=path.endsWith('.csv')?analyticsCsv(data):JSON.stringify(data);
      await db.query('COMMIT');
      if(path.endsWith('.csv')){res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="damm-analytics.csv"');}
      res.end(output);return;
    }
    if(req.method==='GET'&&path==='/api/hr/departments'){const site=new URL(req.url,'http://localhost').searchParams.get('site');res.end(JSON.stringify(await departmentOverview(db,site&&/^[a-z0-9_]{2,60}$/.test(site)?site:site?'__invalid__':null)));return;}
    if(req.method==='GET'&&path==='/api/hr/sites'){res.end(JSON.stringify(await siteList(db)));return;}
    if(req.method==='GET'&&path==='/api/hr/directory'){res.end(JSON.stringify(await directoryOverview(db)));return;}
    if(!['POST','PATCH','PUT'].includes(req.method))throw new InputError('Mètode no permès.',405);
    await db.query('BEGIN');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user.id]);
    let data;
    if(path==='/api/app/listening')data=await listeningAction(db,user,body);
    else if(path==='/api/hr/reminders')data=await createReminder(db,user,body);
    else if(path==='/api/app/mood-state')data=await moodState(db,user);
    else if(path==='/api/app/mood')data=await submitMood(db,user,body);
    else if(path==='/api/hr/plaza')data=await hrPlazaAction(db,body,user);
    else if(path.startsWith('/api/app/'))data=await appAction(db,path.split('/').pop(),{...body,wallet:await userWallet(db,user)});
    else if(req.method==='POST'&&path==='/api/hr/surveys')data=await createSurvey(db,body.survey,body.approved_by_human);
    else if(req.method==='PUT'&&/^\/api\/hr\/surveys\/[a-z0-9-]+$/.test(path))data=await createSurvey(db,body.survey,body.approved_by_human,path.split('/').pop());
    else{
      const m=path.match(/^\/api\/hr\/surveys\/([a-z0-9-]+)\/status$/);
      if(!m||req.method!=='PATCH')throw new InputError('Ruta no trobada.',404);
      data=await changeStatus(db,m[1],body.status,body.approved_by_human);
    }
    if(path.startsWith('/api/hr/')&&!(path==='/api/hr/plaza'&&body.action==='list')){
      if(data?.id&&path.startsWith('/api/hr/surveys')){
        await db.query(`update campaigns set created_by=coalesce(created_by,$2),approved_by=case when approved_at is not null then $2 else approved_by end,approved_by_label=case when approved_at is not null then $3 else approved_by_label end where slug=$1`,[data.id,user.id,user.name]);
        await db.query('update questionnaire_versions set approved_by=$2,approved_by_label=$3 where campaign_id=(select id from campaigns where slug=$1) and approved_at is not null',[data.id,user.id,user.name]);
      }
      await db.query("insert into audit_events(actor_type,actor_id,action,entity_type,entity_id) values('user',$1,$2,'api',$3)",[user.id,body.action||req.method,path]);
    }
    await db.query('COMMIT');res.end(JSON.stringify(data));
  }catch(e){
    if(db)await db.query('ROLLBACK').catch(()=>{});
    const known=['invalid_wallet','unknown_wallet','no_people_available','not_invited','already_answered','invalid_token','unknown_reward','insufficient_points','reward_out_of_stock','reward_unavailable'];
    const code=known.find(c=>c===e.message);
    res.statusCode=e instanceof InputError?e.status:code||e.code==='23505'?409:500;
    if(res.statusCode===401)res.setHeader('Set-Cookie',sessionCookie('',secure));
    if(res.statusCode===500)console.error('API failure:',e.code||e.name);
    res.end(JSON.stringify({error:code||(e.code==='23505'?'Aquest registre ja existeix.':e instanceof InputError?e.message:'Error del servidor.')}));
  }finally{db?.release()}
}).listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('Authenticated app API ready'));
