import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { InputError } from './surveys.js';
const scrypt=promisify(scryptCallback);
export const digest=token=>createHash('sha256').update(token).digest('hex');
export async function hashPassword(password){
  if(typeof password!=='string'||password.length<1||password.length>128)throw new InputError('La contrasenya ha de tenir entre 1 i 128 caràcters.');
  const salt=randomBytes(16).toString('hex');
  const key=await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verify(password,stored){
  const [,salt,key]=stored.split('$');
  const actual=await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return timingSafeEqual(actual,Buffer.from(key,'hex'));
}
const dummy=`scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;
export function sessionToken(cookie=''){
  return cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('damm_session='))?.slice(13)||'';
}
export function sessionCookie(token,secure=false){return `damm_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?28800:0}${secure?'; Secure':''}`;}
export async function login(db,email,password,ip='local'){
  if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>128)throw new InputError('Credencials no vàlides.',401);
  email=email.trim().toLowerCase();
  for(const [key,limit]of [[`email:${digest(email)}`,10],[`ip:${digest(ip)}`,50]]){
    const count=(await db.query(`insert into app_private.login_attempts(attempt_key) values($1)
      on conflict(attempt_key) do update set attempts=case when login_attempts.window_start<now()-interval '15 minutes' then 1 else login_attempts.attempts+1 end,
      window_start=case when login_attempts.window_start<now()-interval '15 minutes' then now() else login_attempts.window_start end returning attempts`,[key])).rows[0].attempts;
    if(count>limit)throw new InputError('Massa intents. Torna-ho a provar d’aquí a 15 minuts.',429);
  }
  const row=(await db.query(`select u.id,u.email,p.app_role role,p.display_label name,p.active,c.password_hash from auth.users u
    join user_profiles p on p.user_id=u.id join app_private.auth_credentials c on c.user_id=u.id where lower(u.email)=any(case when $1 like '%@demo' then array[$1, $1 || '.damm.invalid'] when $1 like '%@demo.damm.invalid' then array[$1, replace($1, '.damm.invalid', '')] else array[$1] end)`,[email])).rows[0];
  const ok=await verify(password,row?.password_hash||dummy);
  if(!row||!row.active||!ok||!['worker','hr_admin','hr_analyst'].includes(row.role))throw new InputError('Correu o contrasenya incorrectes.',401);
  const token=randomBytes(32).toString('hex');
  await db.query('delete from app_private.auth_sessions where expires_at<=now()');
  await db.query("insert into app_private.auth_sessions(token_digest,user_id,expires_at) values($1,$2,now()+interval '8 hours')",[digest(token),row.id]);
  return {token,user:await currentUser(db,token)};
}
export async function currentUser(db,token){
  if(!/^[0-9a-f]{64}$/.test(token))return null;
  return (await db.query(`select u.id,u.email,p.app_role role,p.display_label name,
    case when site.id is null then null else jsonb_build_object('id',site.id,'code',site.code,'name',site.name,'location',site.location) end site
    from app_private.auth_sessions s join auth.users u on u.id=s.user_id join user_profiles p on p.user_id=u.id
    left join app_private.worker_accounts a on a.user_id=u.id
    left join public.synthetic_people person on person.id=a.synthetic_person_id
    left join public.sites site on site.id=case when p.app_role='worker' then person.site_id else p.home_site_id end
    where s.token_digest=$1 and s.expires_at>now() and p.active and p.app_role::text in ('worker','hr_admin','hr_analyst')`,[digest(token)])).rows[0]||null;
}
export function authorize(user,path,method,body={}){
  if(!user)throw new InputError('Cal iniciar sessió.',401);
  const hr=['hr_admin','hr_analyst'].includes(user.role);
  if(path.startsWith('/api/hr/')){
    if(!hr)throw new InputError('No tens permisos de RRHH.',403);
    const read=method==='GET'||(path==='/api/hr/plaza'&&['list','state'].includes(body.action));
    if(!read&&user.role!=='hr_admin')throw new InputError('Aquest compte només pot consultar dades.',403);
  } else if(path.startsWith('/api/app/')&&user.role!=='worker')throw new InputError('Cal un compte de treballador.',403);
}
export async function userWallet(db,user){
  const account=(await db.query('select wallet_token from app_private.worker_accounts where user_id=$1',[user.id])).rows[0];
  if(!account)throw new InputError('El compte no té un moneder assignat.',403);
  return account.wallet_token;
}
export async function provisionUser(db,{email,password,name,role,personId,siteCode}){
  if(!['worker','hr_admin','hr_analyst'].includes(role))throw new InputError('Rol no vàlid.');
  if(typeof email!=='string'||!/^\S+@\S+$/.test(email))throw new InputError('Correu no vàlid.');
  const hash=await hashPassword(password);
  const u=(await db.query(`insert into auth.users(email) values($1) on conflict(lower(email)) do update set email=excluded.email returning id`,[email.trim().toLowerCase()])).rows[0];

  await db.query(`insert into user_profiles(user_id,app_role,display_label) values($1,$2,$3) on conflict(user_id) do update set app_role=excluded.app_role,display_label=excluded.display_label,active=true`,[u.id,role,name||email]);
  await db.query(`insert into app_private.auth_credentials(user_id,password_hash) values($1,$2) on conflict(user_id) do update set password_hash=excluded.password_hash`,[u.id,hash]);
  let site=null;
  if(siteCode){
    site=(await db.query('select id from public.sites where code=$1 and active',[siteCode])).rows[0];
    if(!site)throw new InputError('Centre no vàlid.');
    if(role!=='worker')await db.query('update public.user_profiles set home_site_id=$2 where user_id=$1',[u.id,site.id]);
  }
  if(role==='worker'&&!(await db.query('select 1 from app_private.worker_accounts where user_id=$1',[u.id])).rowCount){
    const person=(await db.query(`select p.id from synthetic_people p where ($1::uuid is null or p.id=$1)
      and ($2::uuid is null or p.site_id=$2)
      and not exists(select 1 from app_private.app_wallets w where w.synthetic_person_id=p.id)
      and not exists(select 1 from app_private.worker_accounts a where a.synthetic_person_id=p.id)
      order by exists(select 1 from app_private.pending_assignments(p.id)) desc,p.id limit 1 for update of p skip locked`,[personId||null,site?.id||null])).rows[0];
    if(!person)throw new InputError('No hi ha cap persona sintètica disponible.');
    const token=randomBytes(32).toString('hex');
    await db.query('insert into app_private.worker_accounts values($1,$2,$3)',[u.id,person.id,token]);
    await db.query("insert into app_private.app_wallets(token_digest,synthetic_person_id) values(extensions.digest($1,'sha256'),$2)",[token,person.id]);
  }
  return u.id;
}
