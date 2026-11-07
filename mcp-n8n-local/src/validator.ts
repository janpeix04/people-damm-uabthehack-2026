import { z } from "zod";

const SECRET_VALUE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "Clave privada PEM",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i,
  },
  {
    name: "Token Bearer en texto plano",
    regex: /\bBearer\s+(?!\{\{)[A-Za-z0-9\-._~+/]{16,}=*/i,
  },
  {
    name: "Token OpenAI / API sk-*",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/,
  },
  {
    name: "Token GitHub Personal Access",
    regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  },
  {
    name: "AWS Access Key ID",
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: "API Key de n8n hardcodeada",
    regex: /\bn8n_api_[A-Za-z0-9]{16,}\b/,
  },
];

const SENSITIVE_KEY_NAME_REGEX =
  /^(?:api[_-]?key|secret[_-]?key|private[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|authorization)$/i;

export interface SecretFinding {
  nodeName: string;
  path: string;
  reason: string;
}

function scanObjectForHardcodedSecrets(
  value: unknown,
  nodeName: string,
  currentPath: string,
  findings: SecretFinding[]
): void {
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Permitir expresiones dinámicas de n8n como ={{ $env.MI_CLAVE }}
    if (trimmed.startsWith("={{") || trimmed.includes("$env.")) {
      return;
    }

    for (const pattern of SECRET_VALUE_PATTERNS) {
      if (pattern.regex.test(trimmed)) {
        findings.push({
          nodeName,
          path: currentPath,
          reason: `Detectado patrón sensible (${pattern.name}). Usa el objeto 'credentials' nativo de n8n o variables '$env'.`,
        });
        return;
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      scanObjectForHardcodedSecrets(
        item,
        nodeName,
        `${currentPath}[${index}]`,
        findings
      );
    });
    return;
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;

    // Detectar pares { name: "Authorization" | "X-API-Key", value: "..." } típicos de httpRequest
    if (
      typeof record.name === "string" &&
      typeof record.value === "string" &&
      SENSITIVE_KEY_NAME_REGEX.test(record.name.trim())
    ) {
      const headerVal = record.value.trim();
      if (
        headerVal.length >= 8 &&
        !headerVal.startsWith("={{") &&
        !headerVal.includes("$env.")
      ) {
        findings.push({
          nodeName,
          path: `${currentPath}.value`,
          reason: `Cabecera o parámetro sensible '${record.name}' contiene un secreto en texto plano. Usa el bloque 'credentials' nativo de n8n o '={{ $env.VARIABLE }}'.`,
        });
      }
    }

    for (const [key, child] of Object.entries(record)) {
      const nextPath = `${currentPath}.${key}`;
      if (
        SENSITIVE_KEY_NAME_REGEX.test(key) &&
        typeof child === "string" &&
        child.trim().length >= 8 &&
        !child.trim().startsWith("={{") &&
        !child.includes("$env.")
      ) {
        findings.push({
          nodeName,
          path: nextPath,
          reason: `Propiedad '${key}' contiene una credencial hardcodeada en texto plano. Usa el objeto 'credentials' nativo de n8n.`,
        });
      } else {
        scanObjectForHardcodedSecrets(child, nodeName, nextPath, findings);
      }
    }
  }
}

export const N8nNodeSchema = z
  .object({
    id: z.string().min(1, "El campo 'id' del nodo debe ser un UUID o string único no vacío."),
    name: z.string().min(1, "El campo 'name' del nodo es obligatorio."),
    type: z
      .string()
      .min(1, "El campo 'type' es obligatorio (ej. 'n8n-nodes-base.httpRequest')."),
    typeVersion: z.number({
      required_error: "El campo 'typeVersion' (number) es obligatorio.",
      invalid_type_error: "El campo 'typeVersion' debe ser numérico.",
    }),
    position: z.tuple([z.number(), z.number()], {
      required_error: "El campo 'position' debe ser una tupla [x, y] de 2 números.",
    }),
    parameters: z.record(z.string(), z.unknown(), {
      required_error: "El campo 'parameters' debe ser un objeto JSON.",
    }),
    credentials: z.record(z.string(), z.unknown()).optional(),
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    notesInFlow: z.boolean().optional(),
    retryOnFail: z.boolean().optional(),
    maxTries: z.number().optional(),
    waitBetweenTries: z.number().optional(),
    alwaysOutputData: z.boolean().optional(),
    executeOnce: z.boolean().optional(),
    onError: z.string().optional(),
    webhookId: z.string().optional(),
  })
  .passthrough();

export const N8nConnectionTargetSchema = z.object({
  node: z.string().min(1, "El nodo destino en 'connections' no puede estar vacío."),
  type: z.string().default("main"),
  index: z.number().int().nonnegative().default(0),
});

export const N8nNodeConnectionsSchema = z.record(
  z.string(),
  z.array(z.array(N8nConnectionTargetSchema))
);

export const N8nConnectionsSchema = z.record(
  z.string(),
  N8nNodeConnectionsSchema
);

export const N8nWorkflowPayloadSchema = z
  .object({
    name: z.string().min(1, "El workflow debe tener un 'name' no vacío."),
    nodes: z
      .array(N8nNodeSchema)
      .min(1, "El workflow debe incluir al menos un nodo en 'nodes'."),
    connections: N8nConnectionsSchema,
    settings: z.record(z.string(), z.unknown()).optional().default({}),
    staticData: z.unknown().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((workflow, ctx) => {
    const nodeNames = new Set<string>();
    const nodeIds = new Set<string>();

    for (let i = 0; i < workflow.nodes.length; i++) {
      const node = workflow.nodes[i];

      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", i, "id"],
          message: `Colisión de ID de nodo: el id '${node.id}' está duplicado.`,
        });
      }
      nodeIds.add(node.id);

      if (nodeNames.has(node.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", i, "name"],
          message: `Colisión de nombre de nodo: el nombre '${node.name}' está duplicado en el workflow.`,
        });
      }
      nodeNames.add(node.name);

      const secretFindings: SecretFinding[] = [];
      scanObjectForHardcodedSecrets(
        node.parameters,
        node.name,
        `nodes[${i}].parameters`,
        secretFindings
      );

      for (const finding of secretFindings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", i, "parameters"],
          message: `[Seguridad - Nodo '${finding.nodeName}' en ${finding.path}]: ${finding.reason}`,
        });
      }
    }

    for (const [sourceNodeName, outputsByType] of Object.entries(
      workflow.connections
    )) {
      if (!nodeNames.has(sourceNodeName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["connections", sourceNodeName],
          message: `Conexión huérfana (origen): La clave '${sourceNodeName}' en 'connections' no corresponde a ningún nodo existente en 'nodes'.`,
        });
      }

      for (const [outputType, branches] of Object.entries(outputsByType)) {
        branches.forEach((branch, branchIdx) => {
          branch.forEach((target, targetIdx) => {
            if (!nodeNames.has(target.node)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                  "connections",
                  sourceNodeName,
                  outputType,
                  branchIdx,
                  targetIdx,
                  "node",
                ],
                message: `Conexión huérfana (destino): El nodo '${sourceNodeName}' intenta conectarse a '${target.node}', el cual no existe en el array 'nodes'.`,
              });
            }
          });
        });
      }
    }
  });

export type ValidatedWorkflowPayload = z.infer<typeof N8nWorkflowPayloadSchema>;

export interface WorkflowValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
  summary: {
    nodeCount: number;
    connectionSourceCount: number;
  };
  data?: ValidatedWorkflowPayload;
}

export function validateWorkflowPayload(
  payload: unknown
): WorkflowValidationResult {
  const parsed = N8nWorkflowPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join(".") || "root",
      message: issue.message,
    }));

    const rawObj =
      payload !== null && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};

    return {
      valid: false,
      errors,
      summary: {
        nodeCount: Array.isArray(rawObj.nodes) ? rawObj.nodes.length : 0,
        connectionSourceCount:
          rawObj.connections && typeof rawObj.connections === "object"
            ? Object.keys(rawObj.connections).length
            : 0,
      },
    };
  }

  return {
    valid: true,
    errors: [],
    summary: {
      nodeCount: parsed.data.nodes.length,
      connectionSourceCount: Object.keys(parsed.data.connections).length,
    },
    data: parsed.data,
  };
}
