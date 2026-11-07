import http from 'node:http';
import pg from 'pg';
import { createSurvey, listSurveys, changeStatus, InputError } from './surveys.js';
import { appAction, hrPlazaAction } from './app.js';

const pool = new pg.Pool({host:process.env.POSTGRES_HOST||'postgres', port:Number(process.env.POSTGRES_PORT||5432), database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD});
const server = http.createServer(async (req,res) => {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  let db;
  try {
    // Local development API, same-origin only. No CORS access or external publication.
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new InputError('Origen no autoritzat.',403);
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/healthz'){await pool.query('select 1');res.end('{"ok":true}');return;}
    if(!path.startsWith('/api/hr/surveys')&&!path.startsWith('/api/app/')&&path!=='/api/hr/plaza') throw new InputError('Ruta no trobada.',404);
    db=await pool.connect();
    if(req.method==='GET' && path==='/api/hr/surveys') {res.end(JSON.stringify(await listSurveys(db)));return;}
    if(!['POST','PATCH','PUT'].includes(req.method)) throw new InputError('Mètode no permès.',405);
    if(!req.headers['content-type']?.startsWith('application/json')) throw new InputError('Cal enviar JSON.',415);
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>131072) throw new InputError('Petició massa gran.',413);}
    let body;try{body=JSON.parse(raw)}catch{throw new InputError('JSON no vàlid.');}
    if(!body||typeof body!=='object')throw new InputError('JSON no vàlid.');
    await db.query('BEGIN');
    if(path.startsWith('/api/app/')||path==='/api/hr/plaza'){
      if(req.method!=='POST')throw new InputError('Mètode no permès.',405);
      const data=path==='/api/hr/plaza'?await hrPlazaAction(db,body):await appAction(db,path.split('/').pop(),body);
      await db.query('COMMIT');res.end(JSON.stringify(data));return;
    }
    let survey;
    if(req.method==='POST' && path==='/api/hr/surveys') survey=await createSurvey(db,body.survey,body.approved_by_human);
    else if(req.method==='PUT' && /^\/api\/hr\/surveys\/[a-z0-9-]+$/.test(path)) survey=await createSurvey(db,body.survey,body.approved_by_human,path.split('/').pop());
    else {
      const match=path.match(/^\/api\/hr\/surveys\/([a-z0-9-]+)\/status$/);
      if(req.method!=='PATCH'||!match) throw new InputError('Ruta no trobada.',404);
      survey=await changeStatus(db,match[1],body.status,body.approved_by_human);
    }
    await db.query('COMMIT');res.statusCode=req.method==='POST'?201:200;res.end(JSON.stringify(survey));
  }catch(e){if(db)await db.query('ROLLBACK').catch(()=>{});res.statusCode=e instanceof InputError?e.status:500;
    if(!(e instanceof InputError))console.error('HR API failure:',e.code||e.name);
    const known=['invalid_wallet','unknown_wallet','no_people_available','not_invited','already_answered','invalid_token','unknown_reward','insufficient_points','reward_out_of_stock','reward_unavailable'];
    const controlled=known.find(code=>e.message===code);
    if(controlled)res.statusCode=409;
    if(e.code==='23505')res.statusCode=409;
    res.end(JSON.stringify({error:controlled|| (e.code==='23505'?'Aquest registre ja existeix.':e instanceof InputError?e.message:'No s’ha pogut desar a PostgreSQL.')}));
  }finally{db?.release();}
});
server.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('Local HR API ready'));
