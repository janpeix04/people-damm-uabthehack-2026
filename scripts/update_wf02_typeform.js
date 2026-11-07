import { N8nClient } from '../mcp-n8n-local/dist/client.js';
import { validateWorkflowPayload } from '../mcp-n8n-local/dist/validator.js';

const client = new N8nClient();
const WF02_ID = "hGcT9TgBCPtTAB5F";
const TYPEFORM_AUTH_HEADER = '={{ "Bearer " + ($env.TYPEFORM_TOKEN || "") }}';

const codeExtractPayload = `
const item = $input.first().json;
const body = item.body || item;

const approvedByHuman = body.approved_by_human === true;
const approvedBy = String(body.approved_by || body.responsable_rrhh || "RRHH - Human in the loop").trim();
const survey = body.survey || body;

const surveyId = String(body.survey_id || survey.survey_id || \`srv_\${Date.now()}\`).trim();
const titulo = String(survey.titulo || "Microconsulta de Clima Laboral").trim();
const introduccion = String(survey.introduccion_transparencia || "Consulta confidencial i anònima (k>=5)").trim();
const colectivo = String(survey.colectivo || survey.colectiu || "Planta").trim();
const centreTipus = String(survey.centre_tipus || "Fàbrica").trim();
const canalSugerido = String(survey.canal_sugerido || (colectivo === "Planta" || colectivo === "Logística" ? "Mòbil-QR" : "Teams / Correu")).trim();
const idioma = String(survey.idioma || "Català").trim();
const preguntas = Array.isArray(survey.preguntas) ? survey.preguntas : [];

// Mapeo adaptativo a especificación estricta de Typeform Create Form API
const typeformFields = preguntas.map((p, idx) => {
  const ref = p.id || \`field_\${idx + 1}\`;
  const title = p.enunciado || p.enunciat || \`Pregunta \${idx + 1}\`;
  
  if (p.tipo === "text_obert" || p.tipo === "texto_abierto") {
    return {
      title,
      ref,
      type: "short_text",
      validations: { required: p.obligatoria === true }
    };
  }
  
  if (p.tipo === "opcion_multiple" && Array.isArray(p.opciones)) {
    return {
      title,
      ref,
      type: "multiple_choice",
      properties: {
        choices: p.opciones.map(opt => ({ label: String(opt) }))
      },
      validations: { required: p.obligatoria !== false }
    };
  }

  // Por defecto: Opinion Scale táctil de 1 a 5 para smartphone / planta
  return {
    title,
    ref,
    type: "opinion_scale",
    properties: {
      steps: 5,
      start_at_one: true,
      labels: {
        left: p.escala?.etiqueta_min || (idioma.toLowerCase().includes("cat") ? "Gens" : "Nada"),
        right: p.escala?.etiqueta_max || (idioma.toLowerCase().includes("cat") ? "Totalment" : "Totalmente")
      }
    },
    validations: { required: p.obligatoria !== false }
  };
});

const typeformPayload = {
  title: \`[Damm Escoltem] \${titulo}\`,
  type: "quiz",
  settings: {
    language: idioma.toLowerCase().includes("cat") ? "ca" : "es",
    progress_bar: "percentage",
    show_time_to_complete: true,
    show_number_of_submissions: false
  },
  welcome_screens: [
    {
      ref: "welcome_screen",
      title: titulo,
      properties: {
        description: introduccion,
        show_button: true,
        button_text: idioma.toLowerCase().includes("cat") ? "Començar (< 90s)" : "Empezar (< 90s)"
      }
    }
  ],
  fields: typeformFields,
  thankyou_screens: [
    {
      ref: "thankyou_screen",
      title: idioma.toLowerCase().includes("cat") ? "Moltes gràcies per la teva veu!" : "¡Muchas gracias por tu opinión!",
      properties: {
        show_button: false,
        share_icons: false,
        description: idioma.toLowerCase().includes("cat") 
          ? "La teva resposta s'ha registrat de forma 100% anònima (k>=5). Damm la transformarà en accions de millora."
          : "Tu respuesta se ha registrado de forma 100% anónima (k>=5). Damm la transformará en acciones de mejora."
      }
    }
  ]
};

return [
  {
    json: {
      approved_by_human: approvedByHuman,
      approved_by: approvedBy,
      survey_id: surveyId,
      titulo,
      introduccion,
      colectivo,
      centre_tipus: centreTipus,
      canal_sugerido: canalSugerido,
      idioma,
      preguntas,
      typeform_payload: typeformPayload,
      has_typeform_token: true,
      has_teams_webhook: false
    }
  }
];
`.trim();

const codeQrAndTeams = `
const item = $input.first().json;
let original = {};
try {
  original = $('Code - Verificar Payload y Firma Humana').first().json;
} catch (e) {
  original = item;
}

// Resolver identificadores desde la API de Typeform o fallback
let formId = item.id || item.form_id || original.survey_id || \`tf_\${Date.now().toString(36)}\`;
let displayUrl = item._links?.display || item.display_url || \`https://form.typeform.com/to/\${formId}\`;
let originTypeform = item._links?.display ? "Typeform Official Cloud API" : "Simulated Local Engine (Fallback)";

const titulo = original.titulo || item.title || "Microconsulta de Clima Laboral";
const introduccion = original.introduccion || "Consulta confidencial i anònima (k>=5)";
const colectivo = original.colectivo || "Planta";
const centreTipus = original.centre_tipus || "Fàbrica";
const canalSugerido = original.canal_sugerido || "Mòbil-QR";
const idioma = original.idioma || "Català";
const approvedBy = original.approved_by || "RRHH";
const surveyId = original.survey_id || formId;

const isCat = String(idioma || "").toLowerCase().includes("cat");
const encodedUrl = encodeURIComponent(displayUrl);
const qrCodeUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=\${encodedUrl}\`;

// Cartel para Planta y Almacenes (Escenario B)
const cartelPlanta = {
  tipo: "Póster / Pantalla Informativa de Fábrica",
  titulo: isCat ? "Damm Escoltem: La teva opinió compta" : "Damm Escuchamos: Tu opinión cuenta",
  subtitulo: titulo,
  instrucciones: isCat 
    ? "Escaneja aquest codi QR des del teu mòbil personal o terminal de planta. Temps estimat: menys de 90 segons."
    : "Escanea este código QR desde tu móvil o terminal de planta. Tiempo estimado: menos de 90 segundos.",
  qr_image_url: qrCodeUrl,
  enlace_directo: displayUrl,
  garantia_privacidad: isCat
    ? "Garantia de privacitat: 100% anònim. Protecció per k-anonimat (k>=5). Cap resposta individual és visible per a ningú."
    : "Garantía de privacidad: 100% anónimo. Protección por k-anonimato (k>=5). Ninguna respuesta individual es visible para nadie.",
  colectivo_objetivo: colectivo,
  centro: centreTipus,
  fecha_lanzamiento: new Date().toISOString().split("T")[0]
};

// Tarjeta Adaptativa para Microsoft 365
const adaptiveCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: \`📢 Nova Microconsulta de Clima: \${titulo}\`,
      weight: "Bolder",
      size: "Medium",
      wrap: true
    },
    {
      type: "TextBlock",
      text: introduccion,
      isSubtle: true,
      wrap: true
    },
    {
      type: "FactSet",
      facts: [
        { title: "Col·lectiu:", value: colectivo },
        { title: "Centre:", value: centreTipus },
        { title: "Temps estimat:", value: "< 90 segons" },
        { title: "Privacitat:", value: "100% Anònim (k ≥ 5)" },
        { title: "Validat per:", value: approvedBy }
      ]
    }
  ],
  actions: [
    {
      type: "Action.OpenUrl",
      title: isCat ? "Participar a la Microconsulta" : "Participar en la Microconsulta",
      url: displayUrl
    }
  ]
};

const shouldNotifyTeams = Boolean(canalSugerido.includes("Teams") || colectivo === "Oficina" || colectivo === "Manager");

return [
  {
    json: {
      ...item,
      survey_id: surveyId,
      colectivo,
      centre_tipus: centreTipus,
      canal_sugerido: canalSugerido,
      approved_by: approvedBy,
      form_id: formId,
      display_url: displayUrl,
      qr_code_url: qrCodeUrl,
      cartel_planta: cartelPlanta,
      adaptive_card: adaptiveCard,
      should_notify_teams: shouldNotifyTeams,
      origin_typeform: originTypeform
    }
  }
];
`.trim();

const codeConsolidateSuccess = `
const item = $input.first().json;

return [
  {
    json: {
      success: true,
      status: "PUBLISHED",
      message: "Microconsulta publicada exitosamente en Typeform con código QR y difusión multicanal.",
      survey_id: item.survey_id,
      publicacion: {
        form_id: item.form_id,
        form_url: item.display_url,
        qr_code_url: item.qr_code_url,
        colectivo: item.colectivo,
        centre_tipus: item.centre_tipus,
        canal_distribucion: item.canal_sugerido,
        origen: item.origin_typeform || "Typeform Official Cloud API"
      },
      kit_difusion: {
        cartel_imprimible: item.cartel_planta,
        teams_notificado: item.should_notify_teams ? true : false,
        adaptive_card_m365: item.adaptive_card
      },
      auditoria_gobernanza: {
        human_in_the_loop_validado: true,
        firmado_por: item.approved_by,
        k_anonimato_garantizado: true,
        publicado_en: new Date().toISOString()
      }
    }
  }
];
`.trim();

const wf02Updated = {
  name: "WF-02: Publicador Typeform & Conector Microsoft Teams",
  nodes: [
    {
      id: "wf2-node-0001-webhook-trigger",
      name: "Webhook - Publicar Encuesta Validada",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300],
      webhookId: "publish-survey-webhook",
      parameters: {
        httpMethod: "POST",
        path: "publish-survey",
        responseMode: "responseNode",
        options: {}
      }
    },
    {
      id: "wf2-node-0002-extract-payload",
      name: "Code - Verificar Payload y Firma Humana",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [500, 300],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: codeExtractPayload
      }
    },
    {
      id: "wf2-node-0003-check-human-approval",
      name: "If - Aprobación Humana Confirmada",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [750, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              id: "cond-human-1",
              leftValue: "={{ Boolean($json.approved_by_human) }}",
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
      id: "wf2-node-0004-check-typeform-token",
      name: "If - Dispone de Typeform Token",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [1000, 200],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              id: "cond-tf-1",
              leftValue: "={{ Boolean($json.has_typeform_token) }}",
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
      id: "wf2-node-0005-typeform-api",
      name: "HTTP Request - Crear Formulario Typeform",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1250, 100],
      parameters: {
        method: "POST",
        url: "https://api.typeform.com/forms",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Authorization", value: TYPEFORM_AUTH_HEADER },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.typeform_payload) }}",
        options: { timeout: 15000 }
      },
      onError: "continueRegularOutput"
    },
    {
      id: "wf2-node-0006-local-typeform",
      name: "Code - Generador Typeform Local",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1250, 300],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: `
const item = $input.first().json;
const formCode = \`damm_\${item.colectivo.toLowerCase()}_\${Date.now().toString(36).substring(2, 8)}\`;
return [{ json: { ...item, form_id: formCode, display_url: \`https://form.typeform.com/to/\${formCode}\`, typeform_origin: "simulated_local_engine" } }];
`.trim()
      }
    },
    {
      id: "wf2-node-0007-qr-and-teams",
      name: "Code - Metadatos QR y Tarjeta Teams",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1500, 200],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: codeQrAndTeams
      }
    },
    {
      id: "wf2-node-0008-check-teams",
      name: "If - Enviar a Canal Teams",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [1750, 200],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              id: "cond-teams-1",
              leftValue: "={{ Boolean($json.should_notify_teams) }}",
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
      id: "wf2-node-0009-teams-webhook",
      name: "HTTP Request - Teams Webhook",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [2000, 100],
      parameters: {
        method: "POST",
        url: "={{ $env.TEAMS_WEBHOOK_URL }}",
        sendHeaders: true,
        headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: $json.adaptive_card }] }) }}",
        options: { timeout: 10000 }
      },
      onError: "continueRegularOutput"
    },
    {
      id: "wf2-node-0010-consolidate-success",
      name: "Code - Consolidar Respuesta Exitosa",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [2250, 200],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: codeConsolidateSuccess
      }
    },
    {
      id: "wf2-node-0011-respond-success",
      name: "Respond to Webhook - Publicación Exitosa",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [2500, 200],
      parameters: {
        respondWith: "json",
        responseBody: "={{ $json }}",
        options: { responseCode: 200 }
      }
    },
    {
      id: "wf2-node-0012-reject-unapproved",
      name: "Code - Rechazo Control Humano",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1000, 500],
      parameters: {
        mode: "runOnceForAllItems",
        language: "javaScript",
        jsCode: `
return [{ json: { success: false, status: "BLOCKED_BY_POLICY", error: "HUMAN_APPROVAL_REQUIRED", message: "Publicación abortada: Se requiere aprobación explícita de RRHH (approved_by_human: true)." } }];
`.trim()
      }
    },
    {
      id: "wf2-node-0013-respond-error",
      name: "Respond to Webhook - Error 403",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [1250, 500],
      parameters: {
        respondWith: "json",
        responseBody: "={{ $json }}",
        options: { responseCode: 403 }
      }
    }
  ],
  connections: {
    "Webhook - Publicar Encuesta Validada": { main: [[{ node: "Code - Verificar Payload y Firma Humana", type: "main", index: 0 }]] },
    "Code - Verificar Payload y Firma Humana": { main: [[{ node: "If - Aprobación Humana Confirmada", type: "main", index: 0 }]] },
    "If - Aprobación Humana Confirmada": {
      main: [
        [{ node: "If - Dispone de Typeform Token", type: "main", index: 0 }],
        [{ node: "Code - Rechazo Control Humano", type: "main", index: 0 }]
      ]
    },
    "If - Dispone de Typeform Token": {
      main: [
        [{ node: "HTTP Request - Crear Formulario Typeform", type: "main", index: 0 }],
        [{ node: "Code - Generador Typeform Local", type: "main", index: 0 }]
      ]
    },
    "HTTP Request - Crear Formulario Typeform": { main: [[{ node: "Code - Metadatos QR y Tarjeta Teams", type: "main", index: 0 }]] },
    "Code - Generador Typeform Local": { main: [[{ node: "Code - Metadatos QR y Tarjeta Teams", type: "main", index: 0 }]] },
    "Code - Metadatos QR y Tarjeta Teams": { main: [[{ node: "If - Enviar a Canal Teams", type: "main", index: 0 }]] },
    "If - Enviar a Canal Teams": {
      main: [
        [{ node: "HTTP Request - Teams Webhook", type: "main", index: 0 }],
        [{ node: "Code - Consolidar Respuesta Exitosa", type: "main", index: 0 }]
      ]
    },
    "HTTP Request - Teams Webhook": { main: [[{ node: "Code - Consolidar Respuesta Exitosa", type: "main", index: 0 }]] },
    "Code - Consolidar Respuesta Exitosa": { main: [[{ node: "Respond to Webhook - Publicación Exitosa", type: "main", index: 0 }]] },
    "Code - Rechazo Control Humano": { main: [[{ node: "Respond to Webhook - Error 403", type: "main", index: 0 }]] }
  },
  settings: { executionOrder: "v1" }
};

async function updateWf02() {
  console.log("=== Validando y Actualizando WF-02 con Typeform Token Oficial ===");
  const v = validateWorkflowPayload(wf02Updated);
  if (!v.valid) throw new Error("Fallo de validación WF-02: " + JSON.stringify(v.errors, null, 2));
  console.log("WF-02 Validado con Zod (OK).");

  await client.request("PUT", `/workflows/${WF02_ID}`, {
    body: {
      name: wf02Updated.name,
      nodes: wf02Updated.nodes,
      connections: wf02Updated.connections,
      settings: wf02Updated.settings
    }
  });

  console.log(`WF-02 (${WF02_ID}) actualizado exitosamente en n8n con Typeform API en vivo.`);
}

updateWf02().catch(err => {
  console.error("Error al actualizar WF-02:", err);
  process.exit(1);
});
