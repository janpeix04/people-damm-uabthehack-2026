// Despliega, actualiza y activa WF-01..04 en la instancia n8n local.
// Idempotente: solo crea los workflows que aún no existen (por prefijo de nombre).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { N8nClient } from '../mcp-n8n-local/dist/client.js';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const client = new N8nClient();

const run = (file) => execFileSync(process.execPath, [path.join(scriptsDir, file)], { stdio: 'inherit' });
const listWorkflows = async () => (await client.request('GET', '/workflows')).data || [];

async function main() {
  const existing = await listWorkflows();
  for (const n of ['01', '02', '03', '04']) {
    if (existing.some((wf) => wf.name?.startsWith(`WF-${n}`))) {
      console.log(`WF-${n} ya existe, se omite el despliegue inicial.`);
    } else {
      run(`deploy_wf${n}.js`);
    }
  }

  run('update_wf02_typeform.js');
  run('update_all_workflows_uab.js');

  for (const wf of await listWorkflows()) {
    if (!/^WF-0[1-4]/.test(wf.name || '')) continue;
    if (!wf.active) await client.request('POST', `/workflows/${wf.id}/activate`);
    console.log(`Activo: ${wf.name} (${wf.id})`);
  }
  console.log('\nListo. Webhooks en http://localhost:5678/webhook/{generate-survey,publish-survey,ingest-responses,analytics}');
}

main().catch((err) => {
  console.error('Error en setup local:', err);
  process.exit(1);
});
