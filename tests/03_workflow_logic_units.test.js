import test from 'node:test';
import assert from 'node:assert/strict';

// =================================================================
// 1. LÓGICA DE WF-01: Perfilado por Colectivo y Detección de Sesgo
// =================================================================
const COLLECTIVE_RULES = {
  Planta: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Directe, clar, operatiu, sense argot corporatiu complex.", temps_recomanat_segons: 75 },
  Logística: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-QR", to: "Pràctic, àgil, directe. Centrat en PDA, maquinària i torns.", temps_recomanat_segons: 75 },
  Comercial: { max_preguntes: 4, escala_tipus: "1-5", canal_preferit: "Mòbil-Link", to: "Àgil, orientat a mobilitat, autonomia i eines comercials.", temps_recomanat_segons: 90 },
  Oficina: { max_preguntes: 5, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Col·laboratiu, reflexiu, processos i benestar digital.", temps_recomanat_segons: 100 },
  Manager: { max_preguntes: 5, escala_tipus: "1-5", canal_preferit: "Teams / Correu", to: "Estratègic, lideratge d'equips, recursos i suport.", temps_recomanat_segons: 110 }
};

const LEADING_PATTERNS = [
  /no creus que/i, /no crees que/i, /veritat que/i, /verdad que/i,
  /estàs d'acord que l'empresa sempre/i, /estás de acuerdo en que la empresa siempre/i
];

function sanitizeLeadingQuestions(questions) {
  const warnings = [];
  const sanitized = questions.map((p, idx) => {
    let text = p.enunciado;
    for (const regex of LEADING_PATTERNS) {
      if (regex.test(text)) {
        warnings.push(`Pregunta #${idx + 1} corregida por sesgo`);
        text = text.replace(regex, "").trim();
      }
    }
    return { ...p, enunciado: text };
  });
  return { sanitized, warnings };
}

test('WF-01 Lógica: Perfilado operativo para Fábrica y Planta respeta restricciones de tiempo y preguntas', () => {
  const perfilPlanta = COLLECTIVE_RULES.Planta;
  assert.equal(perfilPlanta.max_preguntes, 4, 'Planta no debe superar 4 preguntas para garantizar brevedad');
  assert.equal(perfilPlanta.canal_preferit, 'Mòbil-QR', 'Planta debe usar Mòbil-QR sin requerir email corporativo');
  assert.ok(perfilPlanta.temps_recomanat_segons <= 90, 'El tiempo estimado debe ser inferior a 90 segundos');
});

test('WF-01 Lógica: Filtro anti-sesgo detecta y neutraliza preguntas inductivas', () => {
  const preguntasConSesgo = [
    { enunciado: "¿No crees que los nuevos turnos son perjudiciales?", tipo: "escala_1_5" },
    { enunciado: "¿Verdad que las herramientas digitales fallan a menudo?", tipo: "escala_1_5" },
    { enunciado: "¿Cómo valoras la claridad de la información recibida?", tipo: "escala_1_5" }
  ];

  const { sanitized, warnings } = sanitizeLeadingQuestions(preguntasConSesgo);

  assert.equal(warnings.length, 2, 'Debe detectar las dos preguntas con sesgo inductivo');
  assert.doesNotMatch(sanitized[0].enunciado, /no crees que/i, 'La pregunta 1 debe ser desprovista del sesgo');
  assert.doesNotMatch(sanitized[1].enunciado, /verdad que/i, 'La pregunta 2 debe ser desprovista del sesgo');
  assert.equal(sanitized[2].enunciado, preguntasConSesgo[2].enunciado, 'La pregunta neutral no se altera');
});

// =================================================================
// 2. LÓGICA DE WF-02: Human in the Loop & Transformación Typeform
// =================================================================
function transformToTypeformFields(preguntas) {
  return preguntas.map((p, idx) => {
    const ref = p.id || `field_${idx + 1}`;
    const title = p.enunciado || `Pregunta ${idx + 1}`;

    if (p.tipo === "text_obert" || p.tipo === "texto_abierto") {
      return { title, ref, type: "short_text", validations: { required: p.obligatoria === true } };
    }
    if (p.tipo === "opcion_multiple" && Array.isArray(p.opciones)) {
      return {
        title,
        ref,
        type: "multiple_choice",
        properties: { choices: p.opciones.map(opt => ({ label: String(opt) })) },
        validations: { required: p.obligatoria !== false }
      };
    }
    return {
      title,
      ref,
      type: "opinion_scale",
      properties: { steps: 5, start_at_one: true, labels: { left: "Gens d'acord", right: "Totalment d'acord" } },
      validations: { required: p.obligatoria !== false }
    };
  });
}

test('WF-02 Lógica: Gatekeeper rechaza encuestas sin aprobación explícita humana', () => {
  const checkApproval = (payload) => {
    if (payload.approved_by_human !== true) {
      return { status: 403, error: "HUMAN_APPROVAL_REQUIRED" };
    }
    return { status: 200, approved_by: payload.approved_by || "RRHH" };
  };

  const rechazo = checkApproval({ approved_by_human: false });
  assert.equal(rechazo.status, 403);
  assert.equal(rechazo.error, "HUMAN_APPROVAL_REQUIRED");

  const exito = checkApproval({ approved_by_human: true, approved_by: "Responsable RRHH - Human in the loop" });
  assert.equal(exito.status, 200);
  assert.equal(exito.approved_by, "Responsable RRHH - Human in the loop");
});

test('WF-02 Lógica: Mapeo de preguntas a la especificación estricta de Typeform Create Form API', () => {
  const preguntasInput = [
    { id: "p1", enunciado: "Adaptación a turnos", tipo: "escala_1_5", obligatoria: true },
    { id: "p2", enunciado: "¿Qué turno prefieres?", tipo: "opcion_multiple", opciones: ["Mañana", "Tarde", "Noche"] },
    { id: "p3", enunciado: "Comentarios libres", tipo: "text_obert", obligatoria: false }
  ];

  const tfFields = transformToTypeformFields(preguntasInput);

  assert.equal(tfFields.length, 3);
  assert.equal(tfFields[0].type, "opinion_scale");
  assert.equal(tfFields[0].properties.steps, 5);
  assert.equal(tfFields[1].type, "multiple_choice");
  assert.equal(tfFields[1].properties.choices.length, 3);
  assert.equal(tfFields[2].type, "short_text");
  assert.equal(tfFields[2].validations.required, false);
});

// =================================================================
// 3. LÓGICA DE WF-03: Escudo de Privacidad PII & NLP
// =================================================================
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+34|0034)?[\s.-]?[6789](?:[\s.-]?\d){8}\b/g;
const DNI_NIE_REGEX = /\b\d{8}[A-Z]\b|\b[XYZ]\d{7}[A-Z]\b/gi;
const NAME_PATTERNS = [
  /\b(?:el cap|el jefe|la jefa|l'encarregat|el encargado|responsable|jefe|cap)\s+([A-ZÁÉÍÓÚÀÈÒÑ][a-záéíóúàèòñ]+)/gi,
  /\b(?:sóc|soy|me llamo|em dic|mi nombre es|soc)\s+([A-ZÁÉÍÓÚÀÈÒÑ][a-záéíóúàèòñ]+)/gi
];

function sanitizePii(text) {
  let clean = text;
  let piiDetected = 0;

  clean = clean.replace(EMAIL_REGEX, () => {
    piiDetected++;
    return "[EMAIL]";
  });
  clean = clean.replace(PHONE_REGEX, () => {
    piiDetected++;
    return "[TELÈFON]";
  });
  clean = clean.replace(DNI_NIE_REGEX, () => {
    piiDetected++;
    return "[DNI]";
  });
  for (const pattern of NAME_PATTERNS) {
    clean = clean.replace(pattern, (match, name) => {
      piiDetected++;
      return match.replace(name, "[NOM_ANONIMITZAT]");
    });
  }

  return { clean, piiDetected };
}

test('WF-03 Lógica: Enmascaramiento exhaustivo de PII (email, teléfono, DNI y nombres jerárquicos)', () => {
  const rawText = "El cap Albert mai ens ajuda en el torn de nit. Soc Jordi amb DNI 12345678Z, escriviu-me a usuari.demo@example.com o al +34 600 12 34 56.";
  const { clean, piiDetected } = sanitizePii(rawText);

  assert.ok(piiDetected >= 4, 'Debe detectar email, teléfono, DNI y nombre');
  assert.ok(!clean.includes("usuari.demo@example.com"), 'Email debe ser eliminado');
  assert.ok(!clean.includes("+34 600 12 34 56"), 'Teléfono debe ser eliminado');
  assert.ok(!clean.includes("12345678Z"), 'DNI debe ser eliminado');
  assert.ok(clean.includes("[EMAIL]"), 'Debe haber placeholder [EMAIL]');
  assert.ok(clean.includes("[TELÈFON]"), 'Debe haber placeholder [TELÈFON]');
  assert.ok(clean.includes("[DNI]"), 'Debe haber placeholder [DNI]');
});

// =================================================================
// 4. LÓGICA DE WF-04: Escudo k-Anonimato (k >= 5) y Alerta de Sesgo
// =================================================================
test('WF-04 Lógica: k-anonimato bloquea visualización si n < 5 para proteger al informante', () => {
  const evaluateKAnonymity = (sampleCount) => {
    const K_MIN = 5;
    if (sampleCount < K_MIN) {
      return {
        locked_by_privacy: true,
        status: "SHIELD_ACTIVE",
        message: `Accés restringit per privacitat: n=${sampleCount} < k=${K_MIN}`
      };
    }
    return {
      locked_by_privacy: false,
      status: "ANALYTICS_AVAILABLE",
      current_n: sampleCount
    };
  };

  const smallGroup = evaluateKAnonymity(3);
  assert.equal(smallGroup.locked_by_privacy, true);
  assert.equal(smallGroup.status, "SHIELD_ACTIVE");

  const validGroup = evaluateKAnonymity(18);
  assert.equal(validGroup.locked_by_privacy, false);
  assert.equal(validGroup.status, "ANALYTICS_AVAILABLE");
});
