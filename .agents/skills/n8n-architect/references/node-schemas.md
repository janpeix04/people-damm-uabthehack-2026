# Esquemas de Nodos Esenciales de n8n (`node-schemas.md`)

Referencia oficial de estructura JSON (`type`, `typeVersion` y `parameters`) para construir workflows compatibles con n8n moderno.

---

## 1. Manual Trigger (`n8n-nodes-base.manualTrigger`)

Nodo de inicio para pruebas manuales desde el editor de n8n.

```json
{
  "id": "b1a2c3d4-0001-4000-8000-000000000001",
  "name": "Manual Trigger",
  "type": "n8n-nodes-base.manualTrigger",
  "typeVersion": 1,
  "position": [250, 300],
  "parameters": {}
}
```

---

## 2. Webhook (`n8n-nodes-base.webhook`)

Recibe peticiones HTTP entrantes para disparar el workflow en tiempo real.

```json
{
  "id": "b1a2c3d4-0002-4000-8000-000000000002",
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [250, 300],
  "webhookId": "ef891011-1213-4415-8617-181920212223",
  "parameters": {
    "httpMethod": "POST",
    "path": "incoming-event",
    "responseMode": "onReceived",
    "options": {}
  }
}
```

---

## 3. HTTP Request (`n8n-nodes-base.httpRequest` v4.2+)

Realiza llamadas HTTP/REST a servicios externos. Usa `authentication` o variables `$env` en lugar de tokens en texto plano.

```json
{
  "id": "b1a2c3d4-0003-4000-8000-000000000003",
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [500, 300],
  "parameters": {
    "method": "GET",
    "url": "https://api.example.com/v1/items",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Accept",
          "value": "application/json"
        }
      ]
    },
    "options": {
      "timeout": 10000
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "cred_id_placeholder",
      "name": "Header Auth Account"
    }
  }
}
```

---

## 4. Code (`n8n-nodes-base.code` v2)

Ejecuta código JavaScript personalizado sobre los ítems de entrada.

```json
{
  "id": "b1a2c3d4-0004-4000-8000-000000000004",
  "name": "Code",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [750, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "language": "javaScript",
    "jsCode": "return $input.all().map(item => ({ json: { ...item.json, procesado: true } }));"
  }
}
```

---

## 5. If (`n8n-nodes-base.if` v2)

Evalúa condiciones booleanas y enruta los ítems por la salida `0` (`true`) o `1` (`false`).

```json
{
  "id": "b1a2c3d4-0005-4000-8000-000000000005",
  "name": "If",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1000, 300],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "cond-1",
          "leftValue": "={{ $json.procesado }}",
          "rightValue": true,
          "operator": {
            "type": "boolean",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  }
}
```

---

## 6. Edit Fields / Set (`n8n-nodes-base.set` v3.4+)

Define, transforma o filtra campos del objeto JSON de cada ítem.

```json
{
  "id": "b1a2c3d4-0006-4000-8000-000000000006",
  "name": "Edit Fields",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [1250, 300],
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "assign-1",
          "name": "status",
          "value": "completed",
          "type": "string"
        },
        {
          "id": "assign-2",
          "name": "sourceId",
          "value": "={{ $json.id }}",
          "type": "string"
        }
      ]
    },
    "includeOtherFields": true,
    "options": {}
  }
}
```

---

## Estructura de Conexiones (`connections`)

Ejemplo de cómo conectar `Manual Trigger` -> `HTTP Request` -> `Code`:

```json
{
  "Manual Trigger": {
    "main": [
      [
        {
          "node": "HTTP Request",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "HTTP Request": {
    "main": [
      [
        {
          "node": "Code",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```
