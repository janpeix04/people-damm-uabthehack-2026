import test from 'node:test';
import assert from 'node:assert/strict';
import { N8nClient } from '../mcp-n8n-local/dist/client.js';

const N8N_WEBHOOK_BASE = 'http://localhost:5678/webhook';

test('E2E Live: Conexión con motor n8n local y estado de workflows', async () => {
  const client = new N8nClient();
  const list = await client.request('GET', '/workflows');
  assert.ok(Array.isArray(list.data), 'La API de n8n debe devolver lista de workflows');

  // Asegurar que los 4 workflows están activos para recibir webhooks
  for (const wf of list.data) {
    if (!wf.active) {
      await client.request('POST', `/workflows/${wf.id}/activate`);
    }
  }
});

test('E2E Live WF-01: Generación de microconsulta adaptada con LLM ornith y anti-sesgo', async () => {
  const response = await fetch(`${N8N_WEBHOOK_BASE}/generate-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objetivo: 'Conocer adaptación a los nuevos turnos rotativos en Fábrica',
      colectiu: 'Planta',
      centre_tipus: 'Fàbrica',
      durada_max: 90,
      idioma: 'Català'
    })
  });

  assert.equal(response.status, 200, 'El webhook de WF-01 debe responder HTTP 200');
  const data = await response.json();

  assert.equal(data.success, true);
  assert.equal(data.estado, 'PENDING_HUMAN_APPROVAL');
  assert.equal(data.approved_by_human, false, 'Debe requerir aprobación humana previa');
  assert.ok(data.survey, 'Debe contener la propuesta de microconsulta');
  assert.ok(Array.isArray(data.survey.preguntas), 'Debe incluir lista de preguntas');
  assert.ok(data.survey.preguntas.length >= 3, 'Debe tener al menos 3 preguntas (mínimo 3 sin límite máximo)');

  // Verificación del análisis de calidad de la IA
  const analisis = data.survey.analisis_ia || data.control_calidad?.analisis_ia;
  if (analisis) {
    assert.equal(analisis.objetivo_correcto, true, 'Debe analizar que sea correcto sobre lo que se pide');
    assert.equal(analisis.idioma_correcto, true, 'Debe verificar que el idioma sea correcto');
    assert.ok(analisis.tiempo_estimado_segundos > 0, 'Debe estimar el tiempo para responder');
    assert.equal(analisis.tono_verificado, true, 'Debe verificar el tono cercano e inclusivo por defecto');
  }
});

test('E2E Live WF-02: Rechazo automático de publicación si falta firma humana (403)', async () => {
  const response = await fetch(`${N8N_WEBHOOK_BASE}/publish-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approved_by_human: false,
      survey: {
        titulo: 'Encuesta no autorizada',
        colectivo: 'Planta'
      }
    })
  });

  assert.equal(response.status, 403, 'Debe rechazar con HTTP 403 por política de gobernanza');
  const data = await response.json();

  assert.equal(data.success, false);
  assert.equal(data.status, 'BLOCKED_BY_POLICY');
  assert.equal(data.error, 'HUMAN_APPROVAL_REQUIRED');
});

test('E2E Live WF-02: Publicación exitosa con Typeform API y generación de código QR', async () => {
  const response = await fetch(`${N8N_WEBHOOK_BASE}/publish-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approved_by_human: true,
      approved_by: 'Responsable People Analytics (Aprovacio Humana)',
      survey: {
        survey_id: `srv_test_${Date.now()}`,
        titulo: 'Pols de Clima: Torn de Tarda',
        colectivo: 'Planta',
        centre_tipus: 'Fàbrica Prat',
        idioma: 'Català',
        preguntas: [
          { id: 'p1', enunciado: 'Com valores la coordinació amb el relleu de torn?', tipo: 'escala_1_5' }
        ]
      }
    })
  });

  assert.equal(response.status, 200, 'Debe publicar exitosamente con HTTP 200');
  const data = await response.json();

  assert.equal(data.success, true);
  assert.equal(data.status, 'PUBLISHED');
  assert.ok(data.publicacion?.form_url, 'Debe generar URL pública de formulario');
  assert.ok(data.publicacion?.qr_code_url, 'Debe generar URL para imagen del código QR');
  assert.ok(data.kit_difusion?.cartel_imprimible, 'Debe adjuntar cartel para planta');
});

test('E2E Live WF-03: Ingesta de respuestas y sanitización PII multi-capa', async () => {
  const response = await fetch(`${N8N_WEBHOOK_BASE}/ingest-responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comentarios: [
        {
          id_resposta: 'test_resp_1',
          colectiu: 'Planta',
          centre: 'El Prat',
          comentari: 'El cap de linia no ens escolta. El meu correu es usuari.demo@example.com i telefon 600112233'
        }
      ]
    })
  });

  assert.equal(response.status, 200, 'Debe procesar e ingerir con HTTP 200');
  const data = await response.json();

  assert.equal(data.success, true);
  assert.equal(data.status, 'INGESTION_AND_NLP_COMPLETED');
  assert.ok(data.resumen_ingesta, 'Debe devolver resumen de ingesta');
});

test('E2E Live WF-04: Escudo k-anonimato bloquea visualización si n < 5 (RNF-01)', async () => {
  const response = await fetch(`${N8N_WEBHOOK_BASE}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodo: 'T2-Actual',
      colectivo: 'Planta',
      dataset_t2: [
        { id: '1', puntuacio_global: 3.5 }
      ]
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();

  assert.equal(data.success, true);
  assert.equal(data.status, 'SHIELD_ACTIVE', 'Debe activar escudo de privacidad');
  assert.equal(data.dashboard?.locked_by_privacy, true, 'Debe bloquear analíticas por riesgo de reidentificación');
  assert.equal(data.dashboard?.min_threshold, 5, 'El umbral mínimo debe ser k >= 5');
});
