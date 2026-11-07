/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base dels webhooks d'n8n. Per defecte '/webhook' (proxy de Vite / nginx). */
  readonly VITE_N8N_WEBHOOK_BASE?: string
}
