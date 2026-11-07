import test from 'node:test';
import assert from 'node:assert/strict';
import { N8nClient } from '../mcp-n8n-local/dist/client.js';
import { validateWorkflowPayload } from '../mcp-n8n-local/dist/validator.js';

test('Esquemas: Validación estricta Zod de todos los workflows de n8n', async () => {
  const client = new N8nClient();
  const list = await client.request('GET', '/workflows');
  assert.ok(list.data.length >= 4, 'Deben existir al menos los 4 workflows del reto Damm');

  for (const wfSummary of list.data) {
    const wfDetail = await client.request('GET', `/workflows/${wfSummary.id}`);
    
    // validateWorkflowPayload realiza parseo estricto con Zod y auditoría de tokens
    const validated = validateWorkflowPayload({
      name: wfDetail.name,
      nodes: wfDetail.nodes,
      connections: wfDetail.connections,
      settings: wfDetail.settings
    });

    assert.equal(
      validated.valid,
      true,
      `El workflow '${wfDetail.name}' no superó la validación Zod: ${JSON.stringify(validated.errors)}`
    );
    assert.ok(validated.summary.nodeCount > 0, `El workflow '${wfDetail.name}' debe contener nodos`);
  }
});

test('Esquemas: Integridad referencial de nodos y conexiones (sin nodos huérfanos)', async () => {
  const client = new N8nClient();
  const list = await client.request('GET', '/workflows');

  for (const wfSummary of list.data) {
    const wf = await client.request('GET', `/workflows/${wfSummary.id}`);
    const nodeNames = new Set(wf.nodes.map(n => n.name));

    for (const [sourceName, outputs] of Object.entries(wf.connections)) {
      assert.ok(
        nodeNames.has(sourceName),
        `En '${wf.name}', la conexión origen '${sourceName}' no existe en la lista de nodos`
      );

      for (const outputType of Object.values(outputs)) {
        for (const targets of outputType) {
          for (const target of targets) {
            assert.ok(
              nodeNames.has(target.node),
              `En '${wf.name}', el nodo destino '${target.node}' referenciado por '${sourceName}' no existe`
            );
          }
        }
      }
    }
  }
});

test('Esquemas: Nodos Webhook disponen de paths y métodos REST válidos', async () => {
  const client = new N8nClient();
  const list = await client.request('GET', '/workflows');

  const expectedPaths = new Set(['generate-survey', 'publish-survey', 'ingest-responses', 'analytics']);
  const registeredPaths = new Set();

  for (const wfSummary of list.data) {
    const wf = await client.request('GET', `/workflows/${wfSummary.id}`);
    const webhookNodes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');

    for (const node of webhookNodes) {
      assert.ok(node.parameters?.path, `El nodo webhook '${node.name}' en '${wf.name}' debe tener 'path'`);
      assert.equal(node.parameters?.httpMethod || 'GET', 'POST', `El webhook '${node.parameters.path}' debe ser POST`);
      registeredPaths.add(node.parameters.path);
    }
  }

  for (const path of expectedPaths) {
    assert.ok(
      registeredPaths.has(path),
      `El path de webhook '${path}' debe estar implementado en los workflows de n8n`
    );
  }
});
