// WF-05: API de l'app del treballador (monedero anònim, enquestes pendents i recompenses) sobre PostgreSQL.
// Idempotent: crea o actualitza la credencial Postgres i el workflow, i l'activa.
//   POST /webhook/app/wallet  { wallet, locale }                                   → app_wallet_open
//   POST /webhook/app/submit  { wallet, survey, access_token, answers, locale, duration_seconds } → app_submit_response
//   POST /webhook/app/redeem  { wallet, reward }                                   → app_redeem_reward
import { N8nClient } from '../mcp-n8n-local/dist/client.js';

const NAME = 'WF-05: API App Treballador (PostgreSQL)';
const CREDENTIAL_NAME = 'Postgres Damm Pulse';

const client = new N8nClient();

const endpoints = [
  {
    key: 'wallet',
    title: 'Obrir monedero',
    query: 'select public.app_wallet_open($1, $2) as data',
    params: "={{ [$json.body.wallet, $json.body.locale || 'ca'] }}",
  },
  {
    key: 'submit',
    title: 'Enviar resposta anònima',
    query: 'select public.app_submit_response($1, $2, $3, $4::jsonb, $5, $6::integer) as data',
    params: "={{ [$json.body.wallet, $json.body.survey, $json.body.access_token, JSON.stringify($json.body.answers || []), $json.body.locale || 'ca', Number($json.body.duration_seconds) || null] }}",
  },
  {
    key: 'redeem',
    title: 'Bescanviar recompensa',
    query: 'select public.app_redeem_reward($1, $2) as data',
    params: '={{ [$json.body.wallet, $json.body.reward] }}',
  },
];

// Codis d'error controlats que llancen les funcions SQL (raise exception '<codi>').
const KNOWN_ERRORS = ['invalid_wallet', 'unknown_wallet', 'no_people_available', 'not_invited', 'already_answered', 'invalid_token', 'unknown_reward', 'insufficient_points'];
const errorBody = `={{ (() => { const raw = String($json.message ?? $json.error?.message ?? ''); const known = ${JSON.stringify(KNOWN_ERRORS)}.find(c => raw.includes(c)); return { error: known || 'server_error' }; })() }}`;

function buildWorkflow(credential) {
  const nodes = [];
  const connections = {};
  endpoints.forEach((ep, i) => {
    const y = 200 + i * 260;
    const hook = `Webhook - ${ep.title}`;
    const pg = `Postgres - ${ep.title}`;
    const ok = `Resposta OK - ${ep.title}`;
    const ko = `Resposta error - ${ep.title}`;
    nodes.push(
      {
        id: `wf5-${ep.key}-webhook`, name: hook, type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [200, y],
        webhookId: `app-${ep.key}-webhook`,
        parameters: { httpMethod: 'POST', path: `app/${ep.key}`, responseMode: 'responseNode', options: {} },
      },
      {
        id: `wf5-${ep.key}-postgres`, name: pg, type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [460, y],
        onError: 'continueErrorOutput',
        credentials: { postgres: { id: credential.id, name: credential.name } },
        parameters: { operation: 'executeQuery', query: ep.query, options: { queryReplacement: ep.params } },
      },
      {
        id: `wf5-${ep.key}-ok`, name: ok, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [720, y - 70],
        parameters: { respondWith: 'json', responseBody: '={{ $json.data }}', options: { responseCode: 200 } },
      },
      {
        id: `wf5-${ep.key}-ko`, name: ko, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [720, y + 70],
        parameters: { respondWith: 'json', responseBody: errorBody, options: { responseCode: 409 } },
      },
    );
    connections[hook] = { main: [[{ node: pg, type: 'main', index: 0 }]] };
    connections[pg] = { main: [[{ node: ok, type: 'main', index: 0 }], [{ node: ko, type: 'main', index: 0 }]] };
  });
  return { name: NAME, nodes, connections, settings: { executionOrder: 'v1', saveDataSuccessExecution: 'none' } };
}

async function ensureCredential() {
  const list = (await client.request('GET', '/credentials')).data || [];
  const found = list.find(c => c.name === CREDENTIAL_NAME);
  if (found) return found;
  const created = await client.request('POST', '/credentials', {
    body: {
      name: CREDENTIAL_NAME,
      type: 'postgres',
      data: {
        host: 'postgres', // nom del servei a docker-compose
        port: 5432,
        database: process.env.POSTGRES_DB || 'damm_pulse',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        ssl: 'disable',
        allowUnauthorizedCerts: false,
        sshTunnel: false,
      },
    },
  });
  console.log('Credencial creada:', created.id);
  return created;
}

async function main() {
  const credential = await ensureCredential();
  const wf = buildWorkflow(credential);
  const existing = ((await client.request('GET', '/workflows')).data || []).find(w => w.name?.startsWith('WF-05'));
  let id;
  if (existing) {
    if (existing.active) await client.request('POST', `/workflows/${existing.id}/deactivate`);
    await client.request('PUT', `/workflows/${existing.id}`, { body: wf });
    id = existing.id;
    console.log('Workflow actualitzat:', id);
  } else {
    id = (await client.request('POST', '/workflows', { body: wf })).id;
    console.log('Workflow creat:', id);
  }
  await client.request('POST', `/workflows/${id}/activate`);
  console.log(`Actiu: ${NAME}\nWebhooks: /webhook/app/{wallet,submit,redeem}`);
}

main().catch(err => {
  console.error('Error desplegant WF-05:', err.message, err.details ? JSON.stringify(err.details) : '');
  process.exit(1);
});
