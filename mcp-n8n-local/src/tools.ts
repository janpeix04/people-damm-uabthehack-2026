import { z } from "zod";
import { N8nApiError, N8nClient } from "./client.js";
import { validateWorkflowPayload } from "./validator.js";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: "n8n_list_workflows",
    description:
      "Lista los workflows en la instancia local de n8n. Soporta filtrado por estado 'active' y 'limit'. Devuelve id, name, active y updatedAt.",
    inputSchema: {
      type: "object",
      properties: {
        active: {
          type: "boolean",
          description: "Filtra por workflows activos (true) o inactivos (false).",
        },
        limit: {
          type: "number",
          description: "Número máximo de workflows a devolver (1 a 250, por defecto 50).",
        },
      },
    },
  },
  {
    name: "n8n_get_workflow",
    description: "Obtiene la definición JSON completa de un workflow en n8n por su id.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Identificador único del workflow en n8n.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "n8n_validate_workflow",
    description:
      "Valida estructuralmente un workflow con Zod sin llamar a la API de n8n. Verifica nodos, colisiones de IDs/nombres, conexiones huérfanas y bloquea credenciales hardcodeadas en parameters.",
    inputSchema: {
      type: "object",
      properties: {
        workflow: {
          type: "object",
          description:
            "Objeto JSON del workflow con 'name', 'nodes', 'connections' y opcionalmente 'settings'.",
        },
      },
      required: ["workflow"],
    },
  },
  {
    name: "n8n_create_workflow",
    description:
      "Valida el payload con Zod y crea un nuevo workflow mediante POST /workflows en n8n. Siempre fuerza 'active': false por seguridad.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre descriptivo del workflow.",
        },
        nodes: {
          type: "array",
          description: "Lista de nodos del workflow.",
          items: { type: "object" },
        },
        connections: {
          type: "object",
          description: "Mapa de conexiones entre nodos por nombre.",
        },
        settings: {
          type: "object",
          description: "Opciones de configuración del workflow (opcional).",
        },
      },
      required: ["name", "nodes", "connections"],
    },
  },
  {
    name: "n8n_update_workflow",
    description:
      "Valida el payload con Zod y actualiza un workflow existente mediante PUT /workflows/{id}.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID del workflow a actualizar en n8n.",
        },
        name: {
          type: "string",
          description: "Nombre del workflow.",
        },
        nodes: {
          type: "array",
          description: "Lista completa actualizada de nodos del workflow.",
          items: { type: "object" },
        },
        connections: {
          type: "object",
          description: "Mapa actualizado de conexiones entre nodos.",
        },
        settings: {
          type: "object",
          description: "Configuración del workflow (opcional).",
        },
      },
      required: ["id", "name", "nodes", "connections"],
    },
  },
  {
    name: "n8n_Toggle_workflow",
    description:
      "Activa o desactiva un workflow en n8n invocando POST /workflows/{id}/activate o POST /workflows/{id}/deactivate.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID del workflow en n8n.",
        },
        active: {
          type: "boolean",
          description: "true para activar (/activate), false para desactivar (/deactivate).",
        },
      },
      required: ["id", "active"],
    },
  },
  {
    name: "n8n_get_executions",
    description:
      "Consulta ejecuciones en GET /executions filtrando por workflowId y status ('error', 'success', 'waiting') para depuración automática de fallos.",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          description: "ID del workflow cuyas ejecuciones se desean consultar (opcional).",
        },
        status: {
          type: "string",
          enum: ["error", "success", "waiting"],
          description: "Filtra las ejecuciones por estado ('error', 'success', 'waiting').",
        },
        limit: {
          type: "number",
          description: "Cantidad máxima de ejecuciones a recuperar (por defecto 20).",
        },
        includeData: {
          type: "boolean",
          description: "Incluir payload detallado de la ejecución para diagnóstico (por defecto true).",
        },
      },
    },
  },
];

const ListWorkflowsArgsSchema = z.object({
  active: z.boolean().optional(),
  limit: z.number().int().min(1).max(250).optional().default(50),
});

const GetWorkflowArgsSchema = z.object({
  id: z.string().min(1, "El parámetro 'id' es obligatorio."),
});

const ValidateWorkflowArgsSchema = z.object({
  workflow: z.unknown(),
});

const UpdateWorkflowArgsSchema = z.object({
  id: z.string().min(1, "El parámetro 'id' es obligatorio."),
  name: z.string().min(1),
  nodes: z.array(z.unknown()),
  connections: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const ToggleWorkflowArgsSchema = z.object({
  id: z.string().min(1, "El parámetro 'id' es obligatorio."),
  active: z.boolean(),
});

const GetExecutionsArgsSchema = z.object({
  workflowId: z.string().min(1).optional(),
  status: z.enum(["error", "success", "waiting"]).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  includeData: z.boolean().optional().default(true),
});

interface N8nWorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  updatedAt?: string;
}

export async function executeToolCall(
  name: string,
  args: unknown,
  client: N8nClient
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "n8n_list_workflows": {
        const parsedArgs = ListWorkflowsArgsSchema.parse(args ?? {});
        const response = await client.request<{ data?: N8nWorkflowSummary[] }>(
          "GET",
          "/workflows",
          {
            query: {
              active: parsedArgs.active,
              limit: parsedArgs.limit,
            },
          }
        );

        const list = Array.isArray(response.data) ? response.data : [];
        const formatted = list.map((wf) => ({
          id: wf.id,
          name: wf.name,
          active: Boolean(wf.active),
          updatedAt: wf.updatedAt ?? null,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: formatted.length,
                  workflows: formatted,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "n8n_get_workflow": {
        const { id } = GetWorkflowArgsSchema.parse(args ?? {});
        const workflow = await client.request<Record<string, unknown>>(
          "GET",
          `/workflows/${encodeURIComponent(id)}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workflow, null, 2),
            },
          ],
        };
      }

      case "n8n_validate_workflow": {
        const rawInput =
          args !== null &&
          typeof args === "object" &&
          "workflow" in (args as Record<string, unknown>)
            ? ValidateWorkflowArgsSchema.parse(args).workflow
            : args;

        const result = validateWorkflowPayload(rawInput);

        return {
          isError: !result.valid,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  valid: result.valid,
                  summary: result.summary,
                  errors: result.errors,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "n8n_create_workflow": {
        const validation = validateWorkflowPayload(args);
        if (!validation.valid || !validation.data) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "El workflow no superó la validación estructural o de seguridad antes de enviarse a n8n.",
                    validationErrors: validation.errors,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const safePayload = {
          name: validation.data.name,
          nodes: validation.data.nodes,
          connections: validation.data.connections,
          settings: validation.data.settings ?? {},
          active: false,
        };

        const created = await client.request<Record<string, unknown>>(
          "POST",
          "/workflows",
          {
            body: safePayload,
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: "Workflow creado exitosamente en modo inactivo (active: false).",
                  workflow: created,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "n8n_update_workflow": {
        const parsedUpdate = UpdateWorkflowArgsSchema.parse(args ?? {});
        const validation = validateWorkflowPayload({
          name: parsedUpdate.name,
          nodes: parsedUpdate.nodes,
          connections: parsedUpdate.connections,
          settings: parsedUpdate.settings,
        });

        if (!validation.valid || !validation.data) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "El workflow propuesto para actualización no superó la validación estructural o de seguridad.",
                    validationErrors: validation.errors,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const updatePayload = {
          name: validation.data.name,
          nodes: validation.data.nodes,
          connections: validation.data.connections,
          settings: validation.data.settings ?? {},
        };

        const updated = await client.request<Record<string, unknown>>(
          "PUT",
          `/workflows/${encodeURIComponent(parsedUpdate.id)}`,
          {
            body: updatePayload,
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: `Workflow '${parsedUpdate.id}' actualizado correctamente.`,
                  workflow: updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "n8n_Toggle_workflow": {
        const { id, active } = ToggleWorkflowArgsSchema.parse(args ?? {});
        const actionPath = active ? "activate" : "deactivate";

        const toggled = await client.request<Record<string, unknown>>(
          "POST",
          `/workflows/${encodeURIComponent(id)}/${actionPath}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: `Workflow '${id}' ${active ? "activado" : "desactivado"} correctamente.`,
                  id: toggled.id ?? id,
                  active: toggled.active ?? active,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "n8n_get_executions": {
        const parsedExec = GetExecutionsArgsSchema.parse(args ?? {});
        const executions = await client.request<Record<string, unknown>>(
          "GET",
          "/executions",
          {
            query: {
              workflowId: parsedExec.workflowId,
              status: parsedExec.status,
              limit: parsedExec.limit,
              includeData: parsedExec.includeData,
            },
          }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(executions, null, 2),
            },
          ],
        };
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Herramienta desconocida: '${name}'.`,
              }),
            },
          ],
        };
    }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Parámetros de entrada inválidos.",
                issues: err.issues.map((i) => ({
                  path: i.path.join("."),
                  message: i.message,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (err instanceof N8nApiError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: err.message,
                statusCode: err.statusCode,
                endpoint: err.endpoint,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const message =
      err instanceof Error ? err.message : "Error interno inesperado.";
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: message,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
