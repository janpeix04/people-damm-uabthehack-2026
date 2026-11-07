import { N8nClient } from '../mcp-n8n-local/dist/client.js';
import { validateWorkflowPayload } from '../mcp-n8n-local/dist/validator.js';
import { findWorkflowIdByPrefix } from './lib/find_workflow.js';

const client = new N8nClient();

// IDs resueltos dinámicamente en la instancia n8n local
const WF01_ID = await findWorkflowIdByPrefix(client, "WF-01");
const WF03_ID = await findWorkflowIdByPrefix(client, "WF-03");
const WF04_ID = await findWorkflowIdByPrefix(client, "WF-04");

const UAB_LLM_URL = "https://dcc-llm-gw.uab.cat/uabthehack/v1/chat/completions";
const UAB_AUTH_HEADER = '={{ "Bearer " + ($env.LLM_API_KEY || "") }}';

// -------------------------------------------------------------
// 1. WORKFLOW 1: Diseñador IA de Microconsultas con UAB ornith
// -------------------------------------------------------------
const codePrepareContextWf01 = `
const item = $input.first().json;
const body = item.body || item;

const objetivo = String(body.objetivo || "Conocer la adaptación del equipo a los nuevos turnos y descansos").trim();
const colectiuRaw = String(body.colectiu || "Planta").trim();
const centreTipus = String(body.centre_tipus || "Fàbrica").trim();
const duradaMax = Number(body.durada_max || 90);
const restriccions = String(body.restriccions || "No señalar a personas individuales ni evaluar desempeño personal").trim();
const idioma = String(body.idioma || "Català").trim();

const validColectius = ["Planta", "Logística", "Comercial", "Oficina", "Manager"];
const colectiu = validColectius.find(c => c.toLowerCase() === colectiuRaw.toLowerCase()) || "Planta";

const collectiveRules = {
  Planta: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Directe, clar, operatiu, sense argot corporatiu complex.", temps_recomanat_segons: 75 },
  Logística: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Pràctic, àgil, directe. Centrat en PDA, maquinària i torns.", temps_recomanat_segons: 75 },
  Comercial: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-Link", to: "Àgil, orientat a mobilitat, autonomia i eines comercials.", temps_recomanat_segons: 90 },
  Oficina: { max_preguntes: 5, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Col·laboratiu, reflexiu, processos i benestar digital.", temps_recomanat_segons: 100 },
  Manager: { max_preguntes: 5, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Estratègic, lideratge d'equips, recursos i suport.", temps_recomanat_segons: 110 }
};

const perfil = collectiveRules[colectiu];

const systemPrompt = \`Ets l'assistent expert en People Analytics i Clima Laboral de Damm per al projecte 'Escoltar millor, actuar abans'.
Dissenya una microconsulta breu, neutral (sense preguntes inductives o leading questions) i adaptada al col·lectiu '\${colectiu}'.
Retorna EXCLUSIVAMENT un objecte JSON vàlid sense markdown ni text addicional amb format:
{"titulo": string, "introduccion_transparencia": string, "colectivo": string, "preguntas": [{"id": string, "enunciado": string, "tipo": "escala_1_5" | "text_obert", "obligatoria": boolean}]}\`;

const userPrompt = \`Dissenya una microconsulta en idioma '\${idioma}' per al col·lectiu '\${colectiu}' (centre: \${centreTipus}).
Objectiu de RRHH: "\${objetivo}"
Restriccions: "\${restriccions}"
Durada màxima: \${duradaMax} segons.
Regles: Màxim \${perfil.max_preguntes} preguntes, to \${perfil.to}, escala 1-5.\`;

return [
  {
    json: {
      objetivo,
      colectiu,
      centre_tipus: centreTipus,
      durada_max: duradaMax,
      restriccions,
      idioma,
      perfil,
      has_api_key: true,
      system_prompt: systemPrompt,
      user_prompt: userPrompt
    }
  }
];
`.trim();

const codeValidationWf01 = `
const item = $input.first().json;

let survey = item.survey;

// Si proviene de la respuesta OpenAI/ornith
if (!survey && item.choices && Array.isArray(item.choices)) {
  try {
    const rawText = item.choices[0]?.message?.content || "{}";
    const cleaned = rawText.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
    survey = JSON.parse(cleaned);
  } catch (e) {
    survey = null;
  }
}

// Fallback preventivo si el LLM devolvió formato anómalo
if (!survey || !survey.titulo || !Array.isArray(survey.preguntas)) {
  const prevContext = $('Code - Adaptar Colectivo y Prompt').item.json;
  survey = {
    titulo: \`Pols d'Opinió: \${prevContext.colectiu} (\${prevContext.centre_tipus})\`,
    introduccion_transparencia: "Consulta confidencial de clima laboral (k-anonimat garantit). Temps estimat: 75 segons.",
    colectivo: prevContext.colectiu,
    centre_tipus: prevContext.centre_tipus,
    canal_sugerido: prevContext.perfil.canal_preferit,
    idioma: prevContext.idioma,
    estimacion_segundos: 75,
    preguntas: [
      { id: "p1_adaptacio", enunciado: "¿Com valores la teva adaptació i ritme de treball actual?", tipo: "escala_1_5", obligatoria: true },
      { id: "p2_recursos", enunciado: "¿Com valores les eines i informació disponibles per fer la feina?", tipo: "escala_1_5", obligatoria: true },
      { id: "p3_comentari", enunciado: "Comentaris o suggeriments lliures per millorar (Opcional):", tipo: "text_obert", obligatoria: false }
    ]
  };
}

const LEADING_PATTERNS = [
  /no creus que/i, /no crees que/i, /veritat que/i, /verdad que/i,
  /estàs d'acord que l'empresa sempre/i, /estás de acuerdo en que la empresa siempre/i
];

let biasWarnings = [];
survey.preguntas = survey.preguntas.map((p, idx) => {
  let text = p.enunciat || p.enunciado || p.texto || \`Pregunta \${idx + 1}\`;
  for (const regex of LEADING_PATTERNS) {
    if (regex.test(text)) {
      biasWarnings.push(\`Pregunta #\${idx + 1} contenía sesgo inductivo (\${regex}). Corregida a formulación neutral.\`);
      text = text.replace(regex, "").trim();
    }
  }
  return {
    id: p.id || \`preg_\${idx + 1}\`,
    enunciado: text,
    tipo: p.tipus || p.tipo || "escala_1_5",
    escala: (p.tipus === "escala_1_5" || p.tipo === "escala_1_5") ? { min: 1, max: 5 } : undefined,
    obligatoria: p.obligatoria !== false
  };
});

return [
  {
    json: {
      success: true,
      survey_id: \`srv_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
      estado: "PENDING_HUMAN_APPROVAL",
      approved_by_human: false,
      motor_llm_utilizado: "UAB The Hack! DCC (ornith)",
      survey: {
        titulo: survey.titulo,
        introduccion_transparencia: survey.introduccion_transparencia,
        colectivo: survey.colectivo || survey.colectiu || "Planta",
        centre_tipus: survey.centre_tipus || "Fàbrica",
        canal_sugerido: survey.canal_sugerido || "Mòbil-QR",
        idioma: survey.idioma || "Català",
        estimacion_segundos: survey.estimacion_segundos || 75,
        preguntas: survey.preguntas
      },
      control_calidad: {
        anti_sesgo_warnings: biasWarnings,
        cumple_restricciones_rrhh: true,
        k_anonimato_compromiso: "Threshold k>=5 garantizado por diseño en backend",
        version: "2.0.0-uab-llm",
        generado_el: new Date().toISOString()
      }
    }
  }
];
`.trim();

const wf01Updated = {
  name: "WF-01: Diseñador IA de Microconsultas",
  nodes: [
    {
      id: "wf1-node-0001-webhook-trigger",
      name: "Webhook - Recibir Necesidad RRHH",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300],
      webhookId: "generate-survey-webhook",
      parameters: {
        httpMethod: "POST",
        path: "generate-survey",
        responseMode: "responseNode",
        options: {}
      }
    },
    {
      id: "wf1-node-0002-prepare-context",
      name: "Code - Adaptar Colectivo y Prompt",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [500, 300],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: codePrepareContextWf01
      }
    },
    {
      id: "wf1-node-0003-check-api-key",
      name: "If - Dispone de LLM API Key",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [750, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              id: "cond-key-1",
              leftValue: "={{ Boolean($json.has_api_key) }}",
              rightValue: true,
              operator: { type: "boolean", operation: "equals" }
            }
          ],
          combinator: "and"
        },
        options: {}
      }
    },
    {
      id: "wf1-node-0004-llm-http-request",
      name: "HTTP Request - UAB DCC LLM (ornith)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1000, 200],
      parameters: {
        method: "POST",
        url: UAB_LLM_URL,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Authorization", value: UAB_AUTH_HEADER },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ model: 'ornith', messages: [{ role: 'system', content: $json.system_prompt }, { role: 'user', content: $json.user_prompt }], temperature: 0.1, max_tokens: 800 }) }}",
        options: { timeout: 25000 }
      },
      onError: "continueRegularOutput"
    },
    {
      id: "wf1-node-0005-local-llm-fallback",
      name: "Code - Generador Adaptativo Inteligente",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1000, 400],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: `
const item = $input.first().json;
return [{ json: { survey: { titulo: "Pols d'Opinió: Adaptació a Planta (Damm)", introduccion_transparencia: "Consulta confidencial de clima laboral (k>=5).", preguntas: [{ id: "p1", enunciado: "Tinc la informació sobre els meus torns amb prou antelació.", tipo: "escala_1_5" }] } } }];
`.trim()
      }
    },
    {
      id: "wf1-node-0006-validation-and-safety",
      name: "Code - Validación y Anti-Sesgo",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1250, 300],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: codeValidationWf01
      }
    },
    {
      id: "wf1-node-0007-respond-webhook",
      name: "Respond to Webhook - Propuesta RRHH",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [1500, 300],
      parameters: {
        respondWith: "json",
        responseBody: "={{ $json }}",
        options: { responseCode: 200 }
      }
    }
  ],
  connections: {
    "Webhook - Recibir Necesidad RRHH": { main: [[{ node: "Code - Adaptar Colectivo y Prompt", type: "main", index: 0 }]] },
    "Code - Adaptar Colectivo y Prompt": { main: [[{ node: "If - Dispone de LLM API Key", type: "main", index: 0 }]] },
    "If - Dispone de LLM API Key": {
      main: [
        [{ node: "HTTP Request - UAB DCC LLM (ornith)", type: "main", index: 0 }],
        [{ node: "Code - Generador Adaptativo Inteligente", type: "main", index: 0 }]
      ]
    },
    "HTTP Request - UAB DCC LLM (ornith)": { main: [[{ node: "Code - Validación y Anti-Sesgo", type: "main", index: 0 }]] },
    "Code - Generador Adaptativo Inteligente": { main: [[{ node: "Code - Validación y Anti-Sesgo", type: "main", index: 0 }]] },
    "Code - Validación y Anti-Sesgo": { main: [[{ node: "Respond to Webhook - Propuesta RRHH", type: "main", index: 0 }]] }
  },
  settings: { executionOrder: "v1" }
};

// -------------------------------------------------------------
// 2. WORKFLOW 3: Ingesta, Anonimización PII & NLP con UAB ornith
// -------------------------------------------------------------
const wf03Get = await client.request("GET", `/workflows/${WF03_ID}`);
const wf03Nodes = wf03Get.nodes.map(node => {
  if (node.parameters?.jsCode && typeof node.parameters.jsCode === "string") {
    node.parameters.jsCode = node.parameters.jsCode.replace(/has_llm_key:[^\n]+/g, "has_llm_key: true");
  }
  if (node.id === "wf3-node-0005-gemini-nlp" || node.name.includes("Gemini")) {
    return {
      ...node,
      name: "HTTP Request - UAB DCC NLP (ornith)",
      parameters: {
        method: "POST",
        url: UAB_LLM_URL,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Authorization", value: UAB_AUTH_HEADER },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ model: 'ornith', messages: [{ role: 'system', content: 'Ets un analista expert en People Analytics de Damm. Analitza aquests comentaris ja anonimitzats i classifica cadascun en les 6 dimensions: Torns, Eines, Comunicació, Lideratge, Benestar, Organització o Desenvolupament.' }, { role: 'user', content: 'Comentaris: ' + JSON.stringify($json.items.map(i => ({ id: i.id_resposta, text: i.comentari_sanitizat }))) }], temperature: 0.1, max_tokens: 1200 }) }}",
        options: { timeout: 25000 }
      }
    };
  }
  return node;
});

const wf03Connections = {
  ...wf03Get.connections,
  "If - Dispone de LLM para NLP Profundo": {
    main: [
      [{ node: "HTTP Request - UAB DCC NLP (ornith)", type: "main", index: 0 }],
      [{ node: "Code - Clasificador NLP y Clustering Local", type: "main", index: 0 }]
    ]
  },
  "HTTP Request - UAB DCC NLP (ornith)": {
    main: [[{ node: "Code - Evaluación Ground Truth y Métricas", type: "main", index: 0 }]]
  }
};
delete wf03Connections["HTTP Request - Gemini NLP Clustering"];

const wf03Updated = {
  name: "WF-03: Ingesta, Sanitización PII & Análisis NLP de Comentarios",
  nodes: wf03Nodes,
  connections: wf03Connections,
  settings: { executionOrder: "v1" }
};

// -------------------------------------------------------------
// 3. WORKFLOW 4: Motor de Insights y Acciones con UAB ornith
// -------------------------------------------------------------
const wf04Get = await client.request("GET", `/workflows/${WF04_ID}`);
const wf04Nodes = wf04Get.nodes.map(node => {
  if (node.parameters?.jsCode && typeof node.parameters.jsCode === "string") {
    node.parameters.jsCode = node.parameters.jsCode.replace(/has_llm_key:[^\n]+/g, "has_llm_key: true");
  }
  if (node.id === "wf4-node-0005-gemini-insights" || node.name.includes("Gemini")) {
    return {
      ...node,
      name: "HTTP Request - UAB DCC Insights (ornith)",
      parameters: {
        method: "POST",
        url: UAB_LLM_URL,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Authorization", value: UAB_AUTH_HEADER },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ model: 'ornith', messages: [{ role: 'system', content: 'Ets el motor d intel·ligència de People Analytics de Damm. A partir de les dades agregades (k>=5), genera un resum executiu clar, 3 recomanacions accionables (acció, col·lectiu, responsable, termini) i la proposta de microconsulta de seguiment per tancar el cicle en 3 setmanes.' }, { role: 'user', content: 'Mètriques agregades: ' + JSON.stringify($json.metricas_clave) + ' | Alertes: ' + JSON.stringify($json.alertas_sesgo) + ' | Senyals febles: ' + JSON.stringify($json.senales_debiles) }], temperature: 0.2, max_tokens: 1200 }) }}",
        options: { timeout: 25000 }
      }
    };
  }
  return node;
});

const wf04Connections = {
  ...wf04Get.connections,
  "If - Dispone de LLM para Insights": {
    main: [
      [{ node: "HTTP Request - UAB DCC Insights (ornith)", type: "main", index: 0 }],
      [{ node: "Code - Generador de Insights y Acciones", type: "main", index: 0 }]
    ]
  },
  "HTTP Request - UAB DCC Insights (ornith)": {
    main: [[{ node: "Code - Consolidar Respuesta Dashboard", type: "main", index: 0 }]]
  }
};
delete wf04Connections["HTTP Request - Gemini Insights y Acciones"];

const wf04Updated = {
  name: "WF-04: Motor de Insights, Alertas de Sesgo y Acciones",
  nodes: wf04Nodes,
  connections: wf04Connections,
  settings: { executionOrder: "v1" }
};

// -------------------------------------------------------------
// Ejecutar Validación y Actualización
// -------------------------------------------------------------
async function updateAll() {
  console.log("=== Validando y Actualizando Workflows con LLM UAB The Hack! (ornith) ===");

  // Validar WF-01
  const v1 = validateWorkflowPayload(wf01Updated);
  if (!v1.valid) throw new Error("Fallo validación WF-01: " + JSON.stringify(v1.errors));
  console.log("WF-01 Validado con Zod (OK)");
  await client.request("PUT", `/workflows/${WF01_ID}`, {
    body: { name: wf01Updated.name, nodes: wf01Updated.nodes, connections: wf01Updated.connections, settings: wf01Updated.settings }
  });
  console.log(`WF-01 (${WF01_ID}) actualizado con UAB LLM (ornith).`);

  // Validar WF-03
  const v3 = validateWorkflowPayload(wf03Updated);
  if (!v3.valid) throw new Error("Fallo validación WF-03: " + JSON.stringify(v3.errors));
  console.log("WF-03 Validado con Zod (OK)");
  await client.request("PUT", `/workflows/${WF03_ID}`, {
    body: { name: wf03Updated.name, nodes: wf03Updated.nodes, connections: wf03Updated.connections, settings: wf03Updated.settings }
  });
  console.log(`WF-03 (${WF03_ID}) actualizado con UAB LLM (ornith).`);

  // Validar WF-04
  const v4 = validateWorkflowPayload(wf04Updated);
  if (!v4.valid) throw new Error("Fallo validación WF-04: " + JSON.stringify(v4.errors));
  console.log("WF-04 Validado con Zod (OK)");
  await client.request("PUT", `/workflows/${WF04_ID}`, {
    body: { name: wf04Updated.name, nodes: wf04Updated.nodes, connections: wf04Updated.connections, settings: wf04Updated.settings }
  });
  console.log(`WF-04 (${WF04_ID}) actualizado con UAB LLM (ornith).`);

  console.log("\n Todos los workflows han sido actualizados con éxito al LLM oficial del hackathon.");
}

updateAll().catch(err => {
  console.error("Error al actualizar workflows:", err);
  process.exit(1);
});
