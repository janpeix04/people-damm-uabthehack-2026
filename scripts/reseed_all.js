import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEMO_SEED_FILE = path.join(ROOT_DIR, 'supabase', 'demo_seed.sql');

const db = new pg.Client({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 54322),
  database: process.env.POSTGRES_DB || 'damm_pulse',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function main() {
  await db.connect();
  console.log('Connected to PostgreSQL.');

  console.log('Applying expanded demo seed (supabase/demo_seed.sql)...');
  const sql = fs.readFileSync(DEMO_SEED_FILE, 'utf8');
  await db.query(sql);

  console.log('✓ Demo seed applied successfully!');

  // Print summary of seeded tables
  const summary = await db.query(`
    select 'synthetic_people' as taula, count(*)::text as total from public.synthetic_people
    union all select 'daily_moods', count(*)::text from public.daily_moods
    union all select 'campaigns', count(*)::text from public.campaigns
    union all select 'survey_responses', count(*)::text from public.survey_responses
    union all select 'response_answers', count(*)::text from public.response_answers
    union all select 'audience_assignments', count(*)::text from public.audience_assignments
    union all select 'plaza_ideas (' || status || ')', count(*)::text from public.plaza_ideas group by status
    union all select 'plaza_idea_reactions', count(*)::text from app_private.plaza_idea_reactions
    union all select 'plaza_daily_questions', count(*)::text from public.plaza_daily_questions
    union all select 'plaza_daily_votes', count(*)::text from app_private.plaza_daily_votes
    union all select 'action_recommendations', count(*)::text from public.action_recommendations
    union all select 'reward_redemptions', count(*)::text from app_private.reward_redemptions
    order by 1;
  `);
  console.table(summary.rows);

  await db.end();
}

main().catch(async (err) => {
  console.error('Failed to reseed:', err);
  try { await db.end(); } catch {}
  process.exit(1);
});
