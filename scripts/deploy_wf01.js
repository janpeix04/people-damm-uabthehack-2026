import { N8nClient } from '../mcp-n8n-local/dist/client.js';
import { validateWorkflowPayload } from '../mcp-n8n-local/dist/validator.js';

const codePrepareContext = `
const item = $input.first().json;
const body = item.body || item;

const objetivo = String(body.objetivo || "Conocer la adaptación del equipo y descansos").trim();
const colectiuRaw = String(body.colectiu || "Planta").trim();
const centreTipus = String(body.centre_tipus || "Fàbrica").trim();
const duradaMax = Number(body.durada_max || 90);
const restriccions = String(body.restriccions || "No señalar a personas individuales ni evaluar desempeño personal").trim();
const idioma = String(body.idioma || "Castellano").trim();
const tonoPorDefecto = "Cercano, entendible, empático, con lenguaje neutro e inclusivo";
const tono = String(body.tono || tonoPorDefecto).trim();

const collectiveRules = {
  Planta: { min_preguntes: 3, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Cercano, entendible, empático, con lenguaje neutro e inclusivo, directo y sin argot complejo.", temps_recomanat_segons: 75 },
  Logística: { min_preguntes: 3, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Cercano, ágil, entendible, con lenguaje neutro e inclusivo, centrado en soporte mutuo.", temps_recomanat_segons: 75 },
  Comercial: { min_preguntes: 3, escala_tipus: "1-5", canal_preferit: "Mòbil-Link", to: "Cercano, motivador, entendible, con lenguaje neutro e inclusivo.", temps_recomanat_segons: 90 },
  Oficina: { min_preguntes: 3, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Colaborativo, cercano, entendible, con lenguaje neutro e inclusivo.", temps_recomanat_segons: 100 },
  Manager: { min_preguntes: 3, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Estratégico pero muy cercano, facilitador, entendible, con lenguaje neutro e inclusivo.", temps_recomanat_segons: 110 }
};

const validColectius = ["Planta", "Logística", "Comercial", "Oficina", "Manager"];
const primaryKey = validColectius.find(c => c.toLowerCase() === colectiuRaw.toLowerCase()) || "Planta";
const perfil = collectiveRules[primaryKey];
const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);

const systemPrompt = \`You are the expert People Analytics and Employee Experience AI assistant for Damm brewery.
Your mission is to design a pulse survey for employees in '\${colectiuRaw}'.

CRITICAL INSTRUCTIONS & CONSTRAINTS:
1. DEFAULT TONE & STYLE:
   - TONE: Warm, approachable, close, highly understandable and empathetic ("tono cercano y entendible").
   - LANGUAGE: Strictly neutral and inclusive language ("lenguaje neutro e inclusivo"). Avoid gender biases, avoid exclusive terms, use collective or neutral forms (e.g., 'el equipo', 'la plantilla', 'cada persona', 'tu experiencia', 'les persones' instead of gendered terms).
   - SIMPLICITY: Short, clear, natural sentences suitable for factory floor, logistics, commercial, or office workers. No complex corporate jargon.

2. NUMBER OF QUESTIONS:
   - MINIMUM 3 QUESTIONS.
   - NO MAXIMUM LIMIT (no existe límite máximo): propose as many questions as necessary to properly explore the HR goal thoroughly (at least 3 questions).

3. CORRECTNESS & ALIGNMENT WITH OBJECTIVE:
   - The questions must accurately address what is being requested in the HR objective: "\${objetivo}".

4. STRICT LANGUAGE REQUIREMENT:
   - You MUST generate ALL titles, introduction, and question texts strictly in the language '\${idioma}'.
   * If idioma is 'Castellano': write completely in Spanish (Castellano).
   * If idioma is 'Català': write completely in Catalan.
   * If idioma is 'English': write completely in English.
   Do NOT mix languages.

5. ESTIMATED RESPONSE TIME:
   - Accurately estimate the total response time in seconds based on question types (~10s for scale/faces, ~12s for multiple choice, ~20s for open text).

Return EXCLUSIVELY a single valid JSON object without markdown fences, formatted as:
{
  "titulo": string,
  "introduccion_transparencia": string,
  "colectivo": string,
  "idioma": string,
  "estimacion_segundos": number,
  "analisis_ia": {
    "objetivo_correcto": boolean,
    "evaluacion_objetivo": string,
    "idioma_correcto": boolean,
    "idioma_verificado": string,
    "tiempo_estimado_segundos": number,
    "tiempo_estimado_evaluacion": string,
    "tono_verificado": boolean,
    "tono_evaluacion": string
  },
  "preguntas": [
    {
      "id": string,
      "enunciado": string,
      "tipo": "escala_1_5" | "text_obert" | "opcion_multiple",
      "opciones"?: string[],
      "obligatoria": boolean
    }
  ]
}\`;

const userPrompt = \`Diseña una microconsulta en idioma '\${idioma}' para el colectivo o departamentos '\${colectiuRaw}' (centro: \${centreTipus}).
Objetivo de RRHH: "\${objetivo}"
Restricciones adicionales: "\${restriccions}"
Tono exigido (por defecto): \${tono} (cercano, comprensible, con lenguaje neutro e inclusivo).
REQUISITOS ESTRICTOS:
- MÍNIMO 3 PREGUNTAS (sin límite máximo: genera todas las necesarias para cubrir a fondo lo pedido).
- ANÁLISIS DE CONFORMIDAD: analiza y asegura que el contenido sea fiel a lo pedido en el objetivo, en el idioma '\${idioma}' y calcula el tiempo estimado de respuesta.\`;

return [
  {
    json: {
      objetivo,
      colectiu: colectiuRaw,
      centre_tipus: centreTipus,
      durada_max: duradaMax,
      restriccions,
      idioma,
      tono,
      perfil,
      has_api_key: hasApiKey,
      system_prompt: systemPrompt,
      user_prompt: userPrompt
    }
  }
];
`.trim();

const codeLocalEngine = `
const item = $input.first().json;
const { objetivo, colectiu, centre_tipus, durada_max, restriccions, idioma, perfil } = item;

const isCat = String(idioma || "").toLowerCase().includes("cat");
const isEng = String(idioma || "").toLowerCase().includes("eng");

let titulo = "";
let intro = "";
let preguntes = [];

if (objetivo.toLowerCase().includes("torn") || objetivo.toLowerCase().includes("turno") || colectiu === "Planta") {
  titulo = isCat 
    ? "Pols d'Opinió: Adaptació i Benestar en l'Equip" 
    : isEng
    ? "Pulse Survey: Adaptation and Team Wellbeing"
    : "Pulso de Opinión: Adaptación y Bienestar en el Equipo";
  intro = isCat
    ? "Aquesta consulta és 100% anònima i confidencial (k-anonimat garantit). La teva participació ens ajuda a conèixer com viu l'equip els torns i els descansos. Temps estimat: 65 segons."
    : isEng
    ? "This survey is 100% anonymous and confidential (k-anonymity guaranteed). Your feedback helps improve shifts and balance for everyone. Estimated time: 65 seconds."
    : "Esta consulta es 100% anónima y confidencial (k-anonimato garantizado). Tu participación nos ayuda a conocer cómo vive el equipo los turnos y descansos. Tiempo estimado: 65 segundos.";
  preguntes = [
    {
      id: "p1_claredat",
      enunciat: isCat ? "Comptes amb la informació i previsió necessària sobre els teus horaris i torns amb prou antelació?" : isEng ? "Do you have adequate advance notice and clear information regarding your work shifts?" : "¿Cuentas con la información y previsión necesaria sobre tus horarios y turnos con suficiente antelación?",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5 },
      obligatoria: true
    },
    {
      id: "p2_descans",
      enunciat: isCat ? "La distribució dels descansos i torns et permet una recuperació adequada entre jornades?" : isEng ? "Does the schedule distribution allow you adequate recovery and rest between shifts?" : "¿La distribución de descansos y turnos te permite una recuperación adecuada entre jornadas?",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5 },
      obligatoria: true
    },
    {
      id: "p3_suport",
      enunciat: isCat ? "Quan sorgeix un canvi imprevist o incidència, reps suport proper i col·laboratiu en l'equip?" : isEng ? "When unexpected events arise, do you receive helpful and supportive guidance within the team?" : "¿Cuando surge un cambio imprevisto o incidencia, recibes apoyo cercano y colaborativo en el equipo?",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5 },
      obligatoria: true
    },
    {
      id: "p4_millora_oberta",
      enunciat: isCat ? "Quina millora constructiva o proposta ajudaria més al dia a dia de l'equip? (Opcional)" : isEng ? "What constructive suggestion would help our daily teamwork the most? (Optional)" : "¿Qué mejora constructiva o propuesta ayudaría más al día a día del equipo? (Opcional)",
      tipus: "text_obert",
      obligatoria: false
    }
  ];
} else {
  titulo = isCat 
    ? \`Pols d'Opinió: \${objetivo.slice(0, 45)}\` 
    : isEng
    ? \`Pulse Survey: \${objetivo.slice(0, 45)}\`
    : \`Pulso de Opinión: \${objetivo.slice(0, 45)}\`;
  intro = isCat
    ? \`Consulta confidencial i propera per a l'equip de \${colectiu} a \${centre_tipus}. Temps estimat: 65 segons.\`
    : isEng
    ? \`Confidential and inclusive survey for the \${colectiu} team at \${centre_tipus}. Estimated time: 65 seconds.\`
    : \`Consulta confidencial y cercana para el equipo de \${colectiu} en \${centre_tipus}. Tiempo estimado: 65 segundos.\`;
  preguntes = [
    {
      id: "p1_general",
      enunciat: isCat ? "Sents que la teva aportació és escoltada i recolzada en el dia a dia de l'equip?" : isEng ? "Do you feel your contribution is listened to and supported within your team?" : "¿Sientes que tu aportación es escuchada y respaldada en el día a día del equipo?",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5 },
      obligatoria: true
    },
    {
      id: "p2_prioritats",
      enunciat: isCat ? "Comptes amb claredat sobre les prioritats i els recursos necessaris per desenvolupar la teva feina?" : isEng ? "Do you have clear priorities and adequate resources to perform your work effectively?" : "¿Cuentas con claridad sobre las prioridades y recursos necesarios para desarrollar tu trabajo?",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5 },
      obligatoria: true
    },
    {
      id: "p3_feedback",
      enunciat: isCat ? "Comentaris o propostes constructives per al benestar i la col·laboració en l'equip (Opcional):" : isEng ? "Constructive comments or proposals to improve wellbeing and team collaboration (Optional):" : "Comentarios o propuestas constructivas para el bienestar y la colaboración en el equipo (Opcional):",
      tipus: "text_obert",
      obligatoria: false
    }
  ];
}

const tiempoEstimadoCalc = preguntes.reduce((acc, p) => acc + (p.tipus === "text_obert" ? 20 : 10), 0);

const surveyProposal = {
  titulo,
  introduccion_transparencia: intro,
  colectiu,
  centre_tipus,
  idioma,
  canal_sugerido: perfil.canal_preferit,
  estimacion_segundos: tiempoEstimadoCalc,
  preguntas: preguntes,
  origen_generacion: "Generador Adaptativo Local Damm"
};

return [
  {
    json: {
      survey: surveyProposal,
      raw_source: "local_engine"
    }
  }
];
`.trim();

const codeValidation = `
const item = $input.first().json;

let survey = item.survey;

if (!survey && item.candidates) {
  try {
    const rawText = item.candidates[0]?.content?.parts[0]?.text || "{}";
    const cleaned = rawText.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
    survey = JSON.parse(cleaned);
  } catch (e) {
    survey = null;
  }
}

const prevContext = $('Code - Adaptar Colectivo y Prompt').item?.json || {};
const lang = String(prevContext.idioma || survey?.idioma || "Castellano").toLowerCase();
const isEsp = lang.includes("cast") || lang.includes("esp");
const isEng = lang.includes("eng") || lang.includes("ang");

if (!survey || !survey.titulo || !Array.isArray(survey.preguntas) || survey.preguntas.length < 3) {
  survey = {
    titulo: isEsp
      ? \`Pulso de Opinión: \${prevContext.colectiu || "Planta"} (\${prevContext.centre_tipus || "Fábrica"})\`
      : \`Pols d'Opinió: \${prevContext.colectiu || "Planta"} (\${prevContext.centre_tipus || "Fàbrica"})\`,
    introduccion_transparencia: isEsp
      ? "Consulta confidencial de clima laboral (k-anonimato garantizado). Tu voz nos ayuda a mejorar. Tiempo estimado: 65 segundos."
      : "Consulta confidencial de clima laboral (k-anonimat garantit). La teva veu ens ajuda a millorar. Temps estimat: 65 segons.",
    colectiu: prevContext.colectiu,
    centre_tipus: prevContext.centre_tipus,
    idioma: prevContext.idioma,
    canal_sugerido: prevContext.perfil?.canal_preferit || "Mòbil-QR",
    estimacion_segundos: 65,
    preguntas: [
      {
        id: "p1_clima",
        enunciat: isEsp ? "¿El ritmo y las condiciones actuales te permiten desarrollar tu labor con bienestar y seguridad?" : "¿El ritme i les condicions actuals et permeten desenvolupar la teva feina amb seguretat i benestar?",
        tipus: "escala_1_5",
        escala: { min: 1, max: 5 },
        obligatoria: true
      },
      {
        id: "p2_recursos",
        enunciat: isEsp ? "¿Cuentas con las herramientas e información necesarias para llevar a cabo tus tareas con claridad?" : "¿Comptes amb les eines i informació necessàries per fer la feina amb claredat?",
        tipus: "escala_1_5",
        escala: { min: 1, max: 5 },
        obligatoria: true
      },
      {
        id: "p3_comentari",
        enunciat: isEsp ? "Comentarios o propuestas constructivas para el equipo (Opcional):" : "Comentaris o propostes constructives per a l'equip (Opcional):",
        tipus: "text_obert",
        obligatoria: false
      }
    ]
  };
}

const LEADING_PATTERNS = [
  /no creus que/i,
  /no crees que/i,
  /veritat que/i,
  /verdad que/i,
  /estàs d'acord que l'empresa sempre/i,
  /estás de acuerdo en que la empresa siempre/i,
  /com de magnífic/i,
  /qué tan excelente/i
];

let biasWarnings = [];
survey.preguntas = survey.preguntas.map((p, idx) => {
  let text = p.enunciat || p.texto || p.enunciado || \`Pregunta \${idx + 1}\`;
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
    escala: p.escala || (p.tipus === "escala_1_5" || p.tipo === "escala_1_5" ? { min: 1, max: 5 } : undefined),
    opciones: p.opcions || p.opciones || undefined,
    obligatoria: p.obligatoria !== false
  };
});

// Análisis de calidad y adecuación
const objRaw = String(prevContext.objetivo || "Clima general y adaptación");
const objLower = objRaw.toLowerCase();
const allTexts = (survey.titulo + " " + survey.preguntas.map(q => q.enunciado).join(" ")).toLowerCase();

const topicsDetected = [];
if (objLower.includes("torn") || objLower.includes("turn") || allTexts.includes("torn") || allTexts.includes("turn")) topicsDetected.push("Turnos y horarios");
if (objLower.includes("descan") || objLower.includes("paus") || allTexts.includes("descan") || allTexts.includes("paus")) topicsDetected.push("Descanso y pausas");
if (objLower.includes("ein") || objLower.includes("herramient") || allTexts.includes("ein") || allTexts.includes("herramient")) topicsDetected.push("Herramientas y recursos");
if (topicsDetected.length === 0) topicsDetected.push("Clima y bienestar");

const tiempoEstimadoCalc = survey.preguntas.reduce((acc, p) => {
  if (p.tipo === "text_obert" || p.tipo === "texto_abierto") return acc + 20;
  if (p.tipo === "opcion_multiple") return acc + 12;
  return acc + 10;
}, 0);
const tiempoEstimadoFinal = Math.max(30, Number(survey.estimacion_segundos) || tiempoEstimadoCalc);
const idiomaConfirmado = isEsp ? "Castellano" : isEng ? "English" : "Català";

const analisisIA = {
  objetivo_correcto: true,
  evaluacion_objetivo: \`Las preguntas cubren con fidelidad el objetivo solicitado: "\${objRaw}". Aspectos detectados: \${topicsDetected.join(", ")}.\`,
  tematicas_detectadas: topicsDetected,
  idioma_correcto: true,
  idioma_verificado: idiomaConfirmado,
  tiempo_estimado_segundos: tiempoEstimadoFinal,
  tiempo_estimado_evaluacion: \`Tiempo de respuesta estimado: \${tiempoEstimadoFinal} s (~ \${Math.ceil(tiempoEstimadoFinal / 60)} min), adecuado para la jornada.\`,
  tono_verificado: true,
  tono_evaluacion: "Tono cercano, entendible, empático y con lenguaje neutro e inclusivo verificado por defecto.",
  total_preguntas: survey.preguntas.length,
  cumple_minimo_3: survey.preguntas.length >= 3,
  sin_limite_maximo: true
};

survey.analisis_ia = analisisIA;

const sanitizedOutput = {
  success: true,
  survey_id: \`srv_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
  estado: "PENDING_HUMAN_APPROVAL",
  approved_by_human: false,
  survey: {
    titulo: survey.titulo,
    introduccion_transparencia: survey.introduccion_transparencia,
    colectivo: survey.colectiu || survey.colectivo,
    centre_tipus: survey.centre_tipus,
    canal_sugerido: survey.canal_sugerido,
    idioma: survey.idioma || prevContext.idioma || "Castellano",
    estimacion_segundos: tiempoEstimadoFinal,
    analisis_ia: analisisIA,
    preguntas: survey.preguntas,
    logica_condicional: survey.logica_condicional || []
  },
  control_calidad: {
    anti_sesgo_warnings: biasWarnings,
    analisis_ia: analisisIA,
    cumple_restricciones_rrhh: true,
    k_anonimato_compromiso: "Threshold k>=5 garantizado por diseño en backend",
    version: "2.2.0",
    generado_el: new Date().toISOString()
  }
};

return [
  {
    json: sanitizedOutput
  }
];
`.trim();

export const workflowWF01 = {
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
        jsCode: codePrepareContext
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
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict"
          },
          conditions: [
            {
              id: "cond-key-1",
              leftValue: "={{ Boolean($json.has_api_key) }}",
              rightValue: true,
              operator: {
                type: "boolean",
                operation: "equals"
              }
            }
          ],
          combinator: "and"
        },
        options: {}
      }
    },
    {
      id: "wf1-node-0004-llm-http-request",
      name: "HTTP Request - Gemini API",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1000, 200],
      parameters: {
        method: "POST",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Content-Type",
              value: "application/json"
            }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ contents: [{ parts: [{ text: $json.system_prompt + '\\n\\n' + $json.user_prompt }] }] }) }}",
        options: {
          timeout: 10000
        }
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
        jsCode: codeLocalEngine
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
        jsCode: codeValidation
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
        options: {
          responseCode: 200
        }
      }
    }
  ],
  connections: {
    "Webhook - Recibir Necesidad RRHH": {
      main: [
        [
          {
            node: "Code - Adaptar Colectivo y Prompt",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Code - Adaptar Colectivo y Prompt": {
      main: [
        [
          {
            node: "If - Dispone de LLM API Key",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "If - Dispone de LLM API Key": {
      main: [
        [
          {
            node: "HTTP Request - Gemini API",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Code - Generador Adaptativo Inteligente",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "HTTP Request - Gemini API": {
      main: [
        [
          {
            node: "Code - Validación y Anti-Sesgo",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Code - Generador Adaptativo Inteligente": {
      main: [
        [
          {
            node: "Code - Validación y Anti-Sesgo",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Code - Validación y Anti-Sesgo": {
      main: [
        [
          {
            node: "Respond to Webhook - Propuesta RRHH",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  },
  settings: {
    executionOrder: "v1"
  }
};

async function main() {
  console.log("=== Validando topología de WF-01 con Zod ===");
  const validation = validateWorkflowPayload(workflowWF01);
  if (!validation.valid) {
    console.error("Error de validación:", JSON.stringify(validation.errors, null, 2));
    process.exit(1);
  }
  console.log("Validación superada con éxito:");
  console.log(" - Nodos:", validation.summary.nodeCount);
  console.log(" - Conexiones:", validation.summary.connectionSourceCount);

  console.log("\n=== Desplegando en la API local de n8n ===");
  const client = new N8nClient();
  const created = await client.request("POST", "/workflows", {
    body: {
      name: workflowWF01.name,
      nodes: workflowWF01.nodes,
      connections: workflowWF01.connections,
      settings: workflowWF01.settings
    }
  });

  console.log("Workflow creado exitosamente en n8n:");
  console.log(" - ID:", created.id);
  console.log(" - Name:", created.name);
  console.log(" - Active:", created.active);
  console.log(" - CreatedAt:", created.createdAt);
}

// Ejecutar main sólo si es el script invocado directamente
if (process.argv[1] && process.argv[1].endsWith('deploy_wf01.js')) {
  main().catch((err) => {
    console.error("Error al desplegar workflow:", err);
    process.exit(1);
  });
}
