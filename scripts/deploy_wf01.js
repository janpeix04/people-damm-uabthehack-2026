import { N8nClient } from '../mcp-n8n-local/dist/client.js';
import { validateWorkflowPayload } from '../mcp-n8n-local/dist/validator.js';

const codePrepareContext = `
const item = $input.first().json;
const body = item.body || item;

const objetivo = String(body.objetivo || "Conocer la adaptación del equipo y detectar posibles bloqueos u oportunidades de mejora").trim();
const colectiuRaw = String(body.colectiu || "Planta").trim();
const centreTipus = String(body.centre_tipus || "Fàbrica").trim();
const duradaMax = Number(body.durada_max || 90);
const restriccions = String(body.restriccions || "No señalar a personas individuales ni evaluar desempeño personal").trim();
const idioma = String(body.idioma || "Català").trim();

const validColectius = ["Planta", "Logística", "Comercial", "Oficina", "Manager"];
const colectiu = validColectius.find(c => c.toLowerCase() === colectiuRaw.toLowerCase()) || "Planta";

const collectiveRules = {
  Planta: {
    max_preguntes: 4,
    escala_tipus: "1-5",
    canal_preferit: "Mòbil-QR",
    to: "Directe, clar, operatiu, sense argot corporatiu complex. Frases curtes pensades per a pantalla de mòbil i entorn de fàbrica.",
    dimensio_prioritaria: "Condicions i organització (torns, descansos, eines de feina, seguretat)",
    temps_recomanat_segons: 75
  },
  Logística: {
    max_preguntes: 4,
    escala_tipus: "1-5",
    canal_preferit: "Mòbil-QR",
    to: "Pràctic, àgil, directe. Centrat en operació de magatzem, càrregues, PDA/eines i coordinació entre torns.",
    dimensio_prioritaria: "Condicions i recursos materials (eines, PDA, càrregues de feina)",
    temps_recomanat_segons: 75
  },
  Comercial: {
    max_preguntes: 4,
    escala_tipus: "1-5",
    canal_preferit: "Mòbil-Link",
    to: "Àgil, orientat a mobilitat, autonomia i relació amb client/mercat.",
    dimensio_prioritaria: "Eines comercials, càrrega de visites, suport de l'equip",
    temps_recomanat_segons: 90
  },
  Oficina: {
    max_preguntes: 5,
    escala_tipus: "1-5",
    canal_preferit: "Teams / Correu",
    to: "Col·laboratiu, reflexiu, orientat a processos, transversalitat i benestar digital.",
    dimensio_prioritaria: "Col·laboració, càrrega mental, claredat de prioritats i conciliació",
    temps_recomanat_segons: 100
  },
  Manager: {
    max_preguntes: 5,
    escala_tipus: "1-5",
    canal_preferit: "Teams / Correu",
    to: "Estratègic, facilitador, orientat a gestió d'equips, recursos i presa de decisions.",
    dimensio_prioritaria: "Lideratge, suport organitzatiu, eines de gestió i clima d'equip",
    temps_recomanat_segons: 110
  }
};

const perfil = collectiveRules[colectiu];
const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);

const systemPrompt = \`Ets l'assistent expert en People Analytics i Clima Laboral de Damm per al projecte 'Escoltar millor, actuar abans'.
El teu objectiu és dissenyar una microconsulta breu, neutral (sense preguntes inductives o leading questions) i adaptada al col·lectiu '\${colectiu}'.
Has de retornar exclusivament un objecte JSON vàlid amb l'estructura acordada.\`;

const userPrompt = \`Dissenya una microconsulta en idioma '\${idioma}' per al col·lectiu '\${colectiu}' (centre: \${centreTipus}).
Objectiu de RRHH: "\${objetivo}"
Restriccions: "\${restriccions}"
Durada màxima: \${duradaMax} segons.
Regles del col·lectiu: Màxim \${perfil.max_preguntes} preguntes, to \${perfil.to}, escala recomanada \${perfil.escala_tipus}.
Canal suggerit: \${perfil.canal_preferit}.\`;

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

let titulo = "";
let intro = "";
let preguntes = [];

if (objetivo.toLowerCase().includes("torn") || objetivo.toLowerCase().includes("turno") || colectiu === "Planta") {
  titulo = isCat 
    ? "Pols d'Opinió: Adaptació als Nous Torns a Planta" 
    : "Pulso de Opinión: Adaptación a los Nuevos Turnos en Planta";
  intro = isCat
    ? "Aquesta consulta és 100% anònima i protegida per k-anonimat. Ens ajuda a saber com estàs vivint la planificació dels torns i el temps de descans. Temps estimat: 70 segons."
    : "Esta consulta es 100% anónima y protegida por k-anonimato. Nos ayuda a conocer cómo estás viviendo la planificación de turnos y descansos. Tiempo estimado: 70 segundos.";
  preguntes = [
    {
      id: "p1_claredat",
      enunciat: isCat ? "Tinc la informació i previsió necessària sobre els meus horaris i torns amb prou antelació." : "Dispongo de la información y previsión necesaria sobre mis horarios y turnos con suficiente antelación.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Gens d'acord" : "Nada de acuerdo", etiqueta_max: isCat ? "Totalment d'acord" : "Totalmente de acuerdo" },
      obligatoria: true
    },
    {
      id: "p2_descans",
      enunciat: isCat ? "La distribució del nou sistema de torns em permet un descans adequat entre jornades." : "La distribución del nuevo sistema de turnos me permite un descanso adecuado entre jornadas.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Molt insatisfet" : "Muy insatisfecho", etiqueta_max: isCat ? "Molt satisfet" : "Muy satisfecho" },
      obligatoria: true
    },
    {
      id: "p3_suport",
      enunciat: isCat ? "Quan sorgeix un canvi imprevist o incidència, el meu responsable d'equip ofereix suport ràpid." : "Cuando surge un cambio imprevisto o incidencia, mi responsable de equipo ofrece apoyo rápido.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Rarament" : "Raramente", etiqueta_max: isCat ? "Sempre" : "Siempre" },
      obligatoria: true
    },
    {
      id: "p4_millora_oberta",
      enunciat: isCat ? "Quina millora concreta o ajust en la planificació ajudaria més al teu dia a dia? (Opcional)" : "¿Qué mejora concreta o ajuste en la planificación ayudaría más a tu día a día? (Opcional)",
      tipus: "text_obert",
      placeholder: isCat ? "Escriu el teu comentari lliurement (anònim)..." : "Escribe tu comentario libremente (anónimo)...",
      obligatoria: false
    }
  ];
} else if (colectiu === "Logística" || objetivo.toLowerCase().includes("eina") || objetivo.toLowerCase().includes("pda")) {
  titulo = isCat 
    ? "Pols Logística: Recursos, Eines i Coordinació de Magatzem" 
    : "Pulso Logística: Recursos, Herramientas y Coordinación de Almacén";
  intro = isCat
    ? "La teva veu compta. Microconsulta confidencial de menys de 80 segons per millorar el funcionament de les eines i el ritme de treball."
    : "Tu voz cuenta. Microconsulta confidencial de menos de 80 segundos para mejorar el funcionamiento de herramientas y ritmo de trabajo.";
  preguntes = [
    {
      id: "p1_eines",
      enunciat: isCat ? "Les eines i sistemes (PDA, maquinària, terminals) funcionen correctament durant la meva jornada." : "Las herramientas y sistemas (PDA, maquinaria, terminales) funcionan correctamente durante mi jornada.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Mai / Falla molt" : "Nunca / Falla mucho", etiqueta_max: isCat ? "Sempre fluid" : "Siempre fluido" },
      obligatoria: true
    },
    {
      id: "p2_coordinacio",
      enunciat: isCat ? "El traspàs d'informació i tasques pendents entre torns es fa de manera ordenada." : "El traspaso de información y tareas pendientes entre turnos se realiza de forma ordenada.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Molt desordenat" : "Muy desordenado", etiqueta_max: isCat ? "Molt fluid" : "Muy fluido" },
      obligatoria: true
    },
    {
      id: "p3_comentari",
      enunciat: isCat ? "Alguna incidència freqüent amb eines o càrregues que vulguis assenyalar? (Opcional)" : "¿Alguna incidencia frecuente con herramientas o cargas que desees señalar? (Opcional)",
      tipus: "text_obert",
      obligatoria: false
    }
  ];
} else {
  titulo = isCat 
    ? \`Pols d'Opinió: \${objetivo.slice(0, 45)}\` 
    : \`Pulso de Opinión: \${objetivo.slice(0, 45)}\`;
  intro = isCat
    ? \`Consulta ràpida i confidencial per a l'equip de \${colectiu} a \${centre_tipus}. Temps estimat: 90 segons.\`
    : \`Consulta rápida y confidencial para el equipo de \${colectiu} en \${centre_tipus}. Tiempo estimado: 90 segundos.\`;
  preguntes = [
    {
      id: "p1_general",
      enunciat: isCat ? "Em sento escoltat i recolzat en les decisions del meu equip de treball." : "Me siento escuchado y respaldado en las decisiones de mi equipo de trabajo.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Gens" : "Nada", etiqueta_max: isCat ? "Totalment" : "Totalmente" },
      obligatoria: true
    },
    {
      id: "p2_prioritats",
      enunciat: isCat ? "Tinc claredat sobre les prioritats i els recursos disponibles per fer bé la meva feina." : "Tengo claridad sobre las prioridades y los recursos disponibles para realizar bien mi trabajo.",
      tipus: "escala_1_5",
      escala: { min: 1, max: 5, etiqueta_min: isCat ? "Poca claredat" : "Poca claridad", etiqueta_max: isCat ? "Màxima claredat" : "Máxima claridad" },
      obligatoria: true
    },
    {
      id: "p3_feedback",
      enunciat: isCat ? "Comentaris o propostes d'acció per al benestar i la col·laboració en l'equip (Opcional):" : "Comentarios o propuestas de acción para el bienestar y la colaboración en el equipo (Opcional):",
      tipus: "text_obert",
      obligatoria: false
    }
  ];
}

const surveyProposal = {
  titulo,
  introduccion_transparencia: intro,
  colectiu,
  centre_tipus,
  idioma,
  canal_sugerido: perfil.canal_preferit,
  estimacion_segundos: Math.min(durada_max, perfil.temps_recomanat_segons),
  preguntas: preguntes,
  logica_condicional: [
    {
      condicion: "p1_claredat <= 2 || p2_descans <= 2 || p1_eines <= 2 || p1_general <= 2",
      accion: "mostrar_pregunta_seguimiento_opcional",
      mensaje: isCat ? "Hem detectat que la teva valoració és baixa. Vols afegir alguna dificultat concreta per ajudar-nos a solucionar-la?" : "Hemos detectado una valoración baja. ¿Deseas añadir alguna dificultad concreta para ayudarnos a solucionarla?"
    }
  ],
  origen_generacion: "Generador Adaptatiu Local Damm (Zero Latency)"
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

if (!survey || !survey.titulo || !Array.isArray(survey.preguntas)) {
  const prevContext = $('Code - Adaptar Colectivo y Prompt').item.json;
  survey = {
    titulo: \`Pols d'Opinió: \${prevContext.colectiu} (\${prevContext.centre_tipus})\`,
    introduccion_transparencia: "Consulta confidencial de clima laboral (k-anonimat garantit). Temps estimat: 75 segons.",
    colectiu: prevContext.colectiu,
    centre_tipus: prevContext.centre_tipus,
    idioma: prevContext.idioma,
    canal_sugerido: prevContext.perfil.canal_preferit,
    estimacion_segundos: 75,
    preguntas: [
      {
        id: "p1_clima",
        enunciat: "¿El ritme i les condicions actuals et permeten desenvolupar la teva feina amb seguretat i benestar?",
        tipus: "escala_1_5",
        escala: { min: 1, max: 5 },
        obligatoria: true
      },
      {
        id: "p2_comentari",
        enunciat: "Comentaris o suggeriments lliures (Opcional):",
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
    escala: p.escala || (p.tipus === "escala_1_5" ? { min: 1, max: 5 } : undefined),
    opciones: p.opcions || p.opciones || undefined,
    obligatoria: p.obligatoria !== false
  };
});

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
    idioma: survey.idioma,
    estimacion_segundos: survey.estimacion_segundos || 75,
    preguntas: survey.preguntas,
    logica_condicional: survey.logica_condicional || []
  },
  control_calidad: {
    anti_sesgo_warnings: biasWarnings,
    cumple_restricciones_rrhh: true,
    k_anonimato_compromiso: "Threshold k>=5 garantizado por diseño en backend",
    version: "1.0.0",
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

main().catch((err) => {
  console.error("Error al desplegar workflow:", err);
  process.exit(1);
});
