// Incremental local PostgreSQL migration. Never resets or reseeds the database.
import fs from 'node:fs';
import pg from 'pg';
const versions=['20261108100000_plaza_preferences_reward_operations','20261108110000_plaza_topic_reactions','20261108120000_local_auth','20261108130000_user_sites','20261108140000_four_departments'];
const db=new pg.Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||54322),database:process.env.POSTGRES_DB||'damm_pulse',user:process.env.POSTGRES_USER||'postgres',password:process.env.POSTGRES_PASSWORD});
try {
  await db.connect();
  await db.query("select pg_advisory_lock(hashtext('damm-schema-migrations'))");
  for(const version of versions){
  const table=(await db.query("select to_regclass('app_private.schema_migrations') name")).rows[0].name;
  const applied=table && (await db.query('select 1 from app_private.schema_migrations where version=$1',[version])).rowCount;
  if(applied) console.log('Schema already applied:',version);
  else {await db.query(fs.readFileSync(new URL(`../supabase/migrations/${version}.sql`,import.meta.url),'utf8'));console.log('Schema applied:',version);}
  }
} catch(e) {await db.query('ROLLBACK').catch(()=>{});console.error('Migration failed:',e.message);process.exitCode=1;}
finally {await db.end();}
