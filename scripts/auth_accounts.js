import pg from 'pg';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {provisionUser} from '../server/auth.js';
const db=new pg.Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||54322),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD||'postgres'});
await db.connect();
try{
  const configs=process.argv.includes('--demo')?[
    {email:'rrhh.admin@demo',name:'Administració RRHH',role:'hr_admin',password:'1'},
    {email:'treballador@demo',name:'Treballador demo',role:'worker',password:'2'},
    {email:'rrhh.admin@demo.damm.invalid',name:'Administració RRHH',role:'hr_admin',password:'1'},
    {email:'treballador@demo.damm.invalid',name:'Treballador demo',role:'worker',password:'2'}
  ]:[{email:process.env.AUTH_EMAIL,name:process.env.AUTH_NAME,role:process.env.AUTH_ROLE,password:process.env.AUTH_PASSWORD,siteCode:process.env.AUTH_SITE_CODE}];
  await db.query('truncate app_private.login_attempts');
  await db.query('truncate app_private.auth_sessions');
  const created=[];
  for(const config of configs){
    const password=config.password||randomBytes(24).toString('base64url');
    await db.query('BEGIN');
    try{await provisionUser(db,{...config,password});await db.query('COMMIT');created.push(`${config.role}\nCorreu: ${config.email}\nContrasenya: ${password}\n`);console.log('Account created:',config.email)}
    catch(e){await db.query('ROLLBACK');if(e.message.includes('ja té credencials'))console.log('Existing account preserved:',config.email);else throw e;}
  }
  if(created.length){fs.appendFileSync('auth-accounts.local',created.join('\n')+'\n',{mode:0o600});console.log('Generated passwords saved to ignored auth-accounts.local');}
}finally{await db.end()}
