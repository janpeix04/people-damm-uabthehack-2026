# Configuración de `mcp-n8n-local` en Google Antigravity

El servidor MCP y la skill están ubicados en este repositorio para ser utilizados por Google Antigravity.

Para activarlo en tu entorno local de Antigravity, añade el servidor a tu archivo de configuración global:

**Ruta del archivo:** `~/.gemini/config/mcp_config.json` (en Windows: `%USERPROFILE%\.gemini\config\mcp_config.json`)

---

## 1. Plantilla de Configuración

Agrega la clave `mcp-n8n-local` dentro de `mcpServers`:

```json
{
  "mcpServers": {
    "mcp-n8n-local": {
      "command": "node",
      "args": [
        "<RUTA_ABSOLUTA_DEL_REPOSITORIO>/mcp-n8n-local/dist/index.js"
      ],
      "env": {
        "N8N_API_URL": "http://localhost:5678/api/v1",
        "N8N_API_KEY": "<TU_N8N_API_KEY>"
      }
    }
  }
}
```

> **Nota para Windows si `node` no está en el PATH:** Puedes sustituir `"command": "node"` por la ruta absoluta a tu ejecutable `node.exe` (por ejemplo, la provista por Node.js o Visual Studio).

---

## 2. Requisitos de la Instancia de n8n

1. **Ejecutar n8n localmente en el puerto 5678:**
   ```bash
   npx n8n start
   # o vía Docker:
   docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
   ```
2. **Obtener la API Key:**
   - Abre `http://localhost:5678` en tu navegador.
   - Ve a **Settings** -> **n8n API** -> **Create API Key**.
   - Coloca dicha clave en `N8N_API_KEY`.
3. **Uso desde Antigravity:**
   - Al iniciar una sesión en Antigravity, el agente dispondrá de las herramientas `n8n_*` (`n8n_list_workflows`, `n8n_create_workflow`, etc.) junto a la skill `n8n-architect`.
