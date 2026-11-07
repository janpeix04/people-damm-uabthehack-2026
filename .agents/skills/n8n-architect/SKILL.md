---
name: n8n-architect
description: Especialista en diseño, validación, despliegue y depuración de workflows en instancias locales de n8n mediante el servidor MCP mcp-n8n-local. Úsalo siempre que el usuario pida crear, modificar, auditar o diagnosticar automatizaciones y flujos de n8n.
---

# n8n Architect Skill (`n8n-architect`)

Esta skill define el protocolo arquitectónico y las reglas operativas obligatorias para construir, auditar y desplegar workflows en una instancia local de **n8n** (`http://localhost:5678`) a través del servidor MCP `mcp-n8n-local`.

## 1. Protocolo de Diseño

1. **Validación Previa Obligatoria**:
   - Antes de crear (`n8n_create_workflow`) o actualizar (`n8n_update_workflow`) cualquier flujo en la API de n8n, diseña la topología completa de nodos y conexiones e invoca **siempre** la herramienta `n8n_validate_workflow`.
   - No envíes payloads a la API hasta que `n8n_validate_workflow` confirme que no existen colisiones de nombres, conexiones huérfanas ni credenciales expuestas.
2. **Coordenadas y Disposición en el Lienzo (Canvas Layout)**:
   - Separa todos los nodos secuenciales en el eje X de **250 en 250 píxeles** (por ejemplo: `[250, 300]`, `[500, 300]`, `[750, 300]`, `[1000, 300]`) para mantener un lienzo limpio y legible en la interfaz local de n8n.
   - Cuando existan bifurcaciones (`If`, `Switch` o manejo de errores), desplaza las ramas secundarias en el eje Y en incrementos de `200` píxeles (ej. rama `true` en `[750, 200]` y rama `false` en `[750, 400]`).
3. **Inactividad por Defecto**:
   - Todo nuevo workflow se despliega con `"active": false`. Solo activa un workflow mediante `n8n_Toggle_workflow` cuando el usuario lo solicite explícitamente o tras haber verificado su estructura.

## 2. Estándar de Expresiones y Código

1. **Sintaxis Moderna de Expresiones n8n**:
   - Usa exclusivamente expresiones modernas basadas en `$json` y `$('Nombre del Nodo')`:
     - Acceso al ítem actual: `={{ $json.campo }}`
     - Acceso a otro nodo: `={{ $('Nombre del Nodo').item.json.campo }}`
     - Variables de entorno: `={{ $env.NOMBRE_VARIABLE }}`
   - Nunca uses la sintaxis legada `$node["Nombre"].json["campo"]`.
2. **Nodos de Código (`n8n-nodes-base.code`)**:
   - En nodos `n8n-nodes-base.code` (JavaScript, `typeVersion: 2`), devuelve siempre un array de objetos con la propiedad `json` siguiendo el estándar de n8n:
     ```javascript
     return $input.all().map(item => ({ json: { ...item.json, procesado: true } }));
     ```

## 3. Seguridad y Manejo de Errores

1. **Prohibición de Credenciales Hardcodeadas**:
   - Nunca inyectes API Keys, tokens `Bearer`, claves privadas (`-----BEGIN PRIVATE KEY-----`) ni secretos en texto plano dentro de `parameters` en nodos `HTTP Request` o `Code`.
   - Referencia siempre credenciales configuradas en n8n mediante el bloque nativo `credentials` del nodo o variables de entorno `{{ $env.API_KEY }}`.
2. **Manejo de Errores en Producción**:
   - Todo flujo de producción debe contemplar manejo de errores (`onError: "continueErrorOutput"` o `"continueRegularOutput"` en nodos críticos) o incluir un nodo `n8n-nodes-base.errorTrigger` secundario si así se solicita.
   - Para depurar ejecuciones fallidas, utiliza `n8n_get_executions` filtrando por `status: "error"` y el `workflowId` correspondiente.

## 4. Referencia de Esquemas de Nodos

Consulta siempre el archivo [references/node-schemas.md](references/node-schemas.md) antes de ensamblar el JSON de los nodos esenciales (`manualTrigger`, `webhook`, `httpRequest`, `code`, `if`, `set`) para garantizar el uso exacto de `type`, `typeVersion` y estructura de `parameters`.
