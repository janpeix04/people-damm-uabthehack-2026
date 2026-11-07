import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
} catch {
  // Ignorar si no se puede resolver __dirname
}

const ALLOWED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "host.docker.internal",
]);

const REQUEST_TIMEOUT_MS = 10000;

export interface N8nClientConfig {
  baseUrl: string;
  apiKey: string;
}

export class N8nApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    endpoint: string,
    details?: unknown
  ) {
    super(message);
    this.name = "N8nApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.details = details;
  }
}

export function getValidatedConfig(): N8nClientConfig {
  const rawUrl = process.env.N8N_API_URL?.trim() || "http://localhost:5678/api/v1";
  const apiKey = process.env.N8N_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Configuración incompleta: La variable de entorno N8N_API_KEY no está definida. Define una API Key válida de tu instancia local de n8n antes de ejecutar la herramienta."
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      `Configuración inválida: N8N_API_URL ('${rawUrl}') no es una URL válida.`
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `Protección SSRF: Protocolo no permitido ('${parsedUrl.protocol}'). Solo se admite http: o https:.`
    );
  }

  if (!ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
    throw new Error(
      `Protección SSRF activada: El hostname '${parsedUrl.hostname}' no está autorizado. Solo se permiten conexiones locales a 'localhost', '127.0.0.1' o 'host.docker.internal'.`
    );
  }

  const normalizedBaseUrl = rawUrl.replace(/\/+$/, "");

  return {
    baseUrl: normalizedBaseUrl,
    apiKey,
  };
}

function sanitizeText(input: string, apiKey: string): string {
  if (!input) return input;
  let sanitized = input;
  if (apiKey.length > 0) {
    sanitized = sanitized.split(apiKey).join("[REDACTED_API_KEY]");
  }
  sanitized = sanitized.replace(/X-N8N-API-KEY\s*:\s*[^\s,"']+/gi, "X-N8N-API-KEY: [REDACTED]");
  return sanitized;
}

export class N8nClient {
  private getConfig(): N8nClientConfig {
    return getValidatedConfig();
  }

  public async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      body?: unknown;
    }
  ): Promise<T> {
    const { baseUrl, apiKey } = this.getConfig();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${baseUrl}${cleanPath}`);

    if (!ALLOWED_HOSTNAMES.has(url.hostname)) {
      throw new Error(
        `Protección SSRF activada: Destino '${url.hostname}' bloqueado.`
      );
    }

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "X-N8N-API-KEY": apiKey,
      Accept: "application/json",
    };

    let bodyPayload: string | undefined;
    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: bodyPayload,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Error de red desconocido";
      const safeMessage = sanitizeText(rawMessage, apiKey);
      throw new N8nApiError(
        `Fallo de conexión con n8n local en ${method} ${cleanPath}: ${safeMessage}`,
        0,
        cleanPath
      );
    }

    const rawText = await response.text();

    if (!response.ok) {
      let errorSummary = `HTTP ${response.status} ${response.statusText}`;
      try {
        const parsedError = JSON.parse(rawText) as Record<string, unknown>;
        if (typeof parsedError.message === "string") {
          errorSummary = parsedError.message;
        }
      } catch {
        if (rawText.trim().length > 0) {
          errorSummary = rawText.slice(0, 300);
        }
      }

      const sanitizedSummary = sanitizeText(errorSummary, apiKey);
      throw new N8nApiError(
        `Error de la API de n8n (${response.status}) en ${method} ${cleanPath}: ${sanitizedSummary}`,
        response.status,
        cleanPath
      );
    }

    if (!rawText.trim()) {
      return {} as T;
    }

    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new N8nApiError(
        `Respuesta JSON inválida desde n8n en ${method} ${cleanPath}`,
        response.status,
        cleanPath
      );
    }
  }
}
