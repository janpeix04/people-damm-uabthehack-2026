import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PGDATA_DIR = path.join(ROOT_DIR, '.pgdata');
const MIGRATION_FILE = path.join(
  ROOT_DIR,
  'supabase',
  'migrations',
  '20261107162128_init_people_listening_platform.sql',
);
const SEED_FILE = path.join(ROOT_DIR, 'supabase', 'seed.sql');
const INVARIANTS_TEST_FILE = path.join(
  ROOT_DIR,
  'supabase',
  'tests',
  'database',
  '001_privacy_invariants.sql',
);

async function main() {
  const isFresh = !fs.existsSync(PGDATA_DIR);
  const reset = process.argv.includes('--reset') || isFresh;
  if (reset && fs.existsSync(PGDATA_DIR)) {
    fs.rmSync(PGDATA_DIR, { recursive: true, force: true });
  }

  console.log('===================================================================');
  console.log(' Damm People Listening Platform — Base de Datos PostgreSQL');
  console.log('===================================================================');
  console.log(`Directorio de datos PostgreSQL: ${PGDATA_DIR}`);

  const db = new PGlite(PGDATA_DIR, {
    extensions: { pgcrypto },
  });

  if (reset) {
    const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    console.log('\n[1/3] Aplicando migración de esquema PostgreSQL...');
    await db.exec(migrationSql);
    console.log('  ✓ Esquema creado correctamente (tablas, vistas, funciones, triggers y políticas RLS).');

    const seedSql = fs.readFileSync(SEED_FILE, 'utf8');
    console.log('\n[2/3] Cargando datos sintéticos (seed.sql)...');
    await db.exec(seedSql);
    console.log('  ✓ Seed cargado correctamente.');
  } else {
    console.log('\n[1-2/3] Base de datos PostgreSQL existente detectada en .pgdata (usa --reset para recrear).');
  }

  const testSql = fs.readFileSync(INVARIANTS_TEST_FILE, 'utf8');
  console.log('\n[3/3] Ejecutando suite de invariantes de privacidad y estructura...');
  await db.exec(testSql);
  console.log('  ✓ Invariantes SQL verificados (14 sites, RRHH, 4 colectivos, k-anonimato >= 10, PII redaction).');

  // Resumen de datos en PostgreSQL
  const sitesRes = await db.query(`
    select s.code, s.name, s.location, s.site_type_ca, s.default_collective,
           count(sp.id)::int as employees
    from public.sites s
    left join public.synthetic_people sp on sp.site_id = s.id
    group by s.id, s.code, s.name, s.location, s.site_type_ca, s.default_collective
    order by s.created_at, s.name;
  `);

  console.log('\n--- Resumen de los 14 Sites de Damm en PostgreSQL ---');
  console.table(sitesRes.rows);

  const deptsRes = await db.query(`
    select d.code, d.collective, d.name_ca as department, count(sp.id)::int as active_people
    from public.departments d
    left join public.synthetic_people sp on sp.department_id = d.id
    group by d.id, d.code, d.collective, d.name_ca
    order by d.collective, d.code;
  `);

  console.log('\n--- Resumen de Departamentos (incluyendo RRHH y los 4 colectivos) ---');
  console.table(deptsRes.rows);

  const profilesRes = await db.query(`
    select u.email, p.display_label, p.app_role, d.code as department_code, p.preferred_locale
    from public.user_profiles p
    join auth.users u on u.id = p.user_id
    left join public.departments d on d.id = p.department_id
    order by p.app_role, u.email;
  `);

  console.log('\n--- Perfiles Operativos (RRHH Admins, Analysts, Managers, Integration) ---');
  console.table(profilesRes.rows);

  const summaryRes = await db.query(`
    select
      (select count(*)::int from public.sites) as total_sites,
      (select count(*)::int from public.departments) as total_departments,
      (select count(*)::int from public.synthetic_people) as total_synthetic_people,
      (select count(*)::int from public.synthetic_people sp join public.departments d on d.id = sp.department_id where d.code = 'rrhh') as rrhh_employees,
      (select count(*)::int from public.campaigns) as total_campaigns,
      (select count(*)::int from public.survey_responses) as total_survey_responses,
      (select count(*)::int from public.response_answers) as total_answers,
      (select count(*)::int from public.analytics_segments) as total_segments,
      (select count(*)::int from public.analysis_insights) as total_insights,
      (select count(*)::int from public.action_recommendations) as total_recommendations;
  `);

  console.log('\n--- Totales Globales en PostgreSQL ---');
  console.table(summaryRes.rows);

  await db.close();
}

main().catch((err) => {
  console.error('Error inicializando PostgreSQL:', err);
  process.exit(1);
});
