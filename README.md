# 🍺 Damm Pulse IA — Plataforma de Escucha Activa, Continua e Inteligente

> **UAB THE HACK! 2026 · Reto Estrella Damm**  
> *«¿Cómo podemos medir el clima laboral de manera ágil, continua e inteligente con IA? Escoltar millor, actuar abans.»*

---

## 🎯 Sobre el Proyecto

En una organización tan diversa como **Damm** —con personas trabajando en **fábricas** (producción y envasado por turnos), **logística** (almacenes y reparto), **equipos comerciales** (en ruta desde el móvil) y **oficinas**—, las encuestas anuales tradicionales presentan tres grandes barreras:
1. **Participación poco representativa:** Planta y logística participan menos por falta de tiempo o acceso a un ordenador.
2. **Talla única (*one-size-fits-all*):** Una misma encuesta larga no refleja las realidades tan distintas de un operario de turno de noche, un comercial o un manager.
3. **Mucho texto, análisis tardío:** Cientos de comentarios abiertos se revisan a mano; cuando se detecta el problema, la oportunidad de actuar ya ha pasado.

**Damm Pulse IA** transforma la medición del clima laboral en un **ciclo continuo, ético y asistido por IA de principio a fin**, conectando una **Web Base para People/RRHH** con flujos automatizados de **IA y análisis de datos en n8n**, publicación directa en **Typeform** (con experiencia móvil/QR para planta) e integración con **Microsoft 365 (Teams)**.

---

## 🔄 El Ciclo de Escucha Continua (8 Pasos)

Nuestra solución cubre de extremo a extremo el recorrido funcional en una única plataforma:

1. **Definir la Necesidad:** RRHH describe en lenguaje natural qué quiere entender, para qué colectivo (`Planta`, `Logística`, `Comercial`, `Oficina`, `Manager`), la duración máxima (< 2 min) y las restricciones.
2. **Generar la Microconsulta con IA:** `n8n` + LLM diseñan una propuesta adaptada en tono, longitud e idioma (Catalán/Castellano), con 3–6 preguntas, lógica condicional y mensaje de transparencia.
3. **Validación Humana (*Human-in-the-Loop*):** RRHH revisa, edita, reordena o elimina preguntas en la Web Base. **La IA nunca publica sin aprobación humana.**
4. **Publicar en Typeform + QR:** Creación automática del formulario vía **Typeform API**, generando al instante un **Cartel QR imprimible** para planta/logística y notificaciones para **Microsoft Teams**.
5. **Participación Representativa:** Experiencia móvil ultrarrápida (< 90 s) sin necesidad de ordenador, acompañada de un monitor que detecta sesgos de cobertura o baja respuesta en turnos específicos.
6. **Recoger, Anonimizar y Analizar:** Ingesta vía API/Webhook, **eliminación automática de datos identificativos (PII)** en comentarios abiertos, clustering semántico por temas, análisis de sentimiento y detección de **señales débiles (*weak signals*)** entre períodos.
7. **Visualizar con Privacidad por Diseño:** Dashboard de *People Analytics* con resultados **siempre agregados**, bloqueo automático de segmentos con muestra insuficiente (**umbral $k \ge 5$**) y panel de explicabilidad (tamaño muestral $N$, confianza y separación entre correlación y causalidad).
8. **Recomendar y Cerrar el Ciclo:** Propuesta de **acciones concretas de bienestar y organización** (validadas por RRHH) y generación con un clic de la **microconsulta de seguimiento** para evaluar la evolución.

---

## 🏗️ Arquitectura Tecnológica

- **Frontend (Web Base):** Aplicación web interactiva para el equipo de People/RRHH y visualización de dashboards agregados.
- **Orquestación, IA y Análisis Backend (`n8n`):** Instancia local de `n8n` (`http://localhost:5678`) automatizada y validada mediante el servidor MCP local [`mcp-n8n-local`](./mcp-n8n-local) y la skill [`n8n-architect`](./.agents/skills/n8n-architect/SKILL.md):
  - `WF-01`: Diseño adaptativo de microconsultas con IA.
  - `WF-02`: Publicación en Typeform API + Generador QR + Conector Microsoft Teams.
  - `WF-03`: Ingesta de respuestas, sanitización PII multicapa y clustering NLP bilingüe (CA/ES).
  - `WF-04`: Motor estadístico de $k$-anonimato, detector de sesgos de representatividad y recomendador de planes de acción.
- **Formularios y Captura:** Integración con **Typeform API**.
- **Datos:** Dataset **100% sintético** (entre 300 y 1.000 respuestas en múltiples períodos y colectivos, con ruido realista y sesgos controlados para validar los Escenarios A, B y C).

---

## 🛡️ Privacidad, Anonimato y Uso Responsable (Reglas de Oro)

La confianza es la base para que las personas respondan con sinceridad. Nuestra plataforma garantiza por diseño:

- **100% Datos Sintéticos:** Ningún dato real de empleados ni información confidencial de Damm se utiliza o almacena en este proyecto.
- **Agregación Estricta y Umbral Mínimo ($k \ge 5$):** Nunca se muestran respuestas individuales identificables. Si una segmentación tiene menos de 5 respuestas, el backend y el dashboard bloquean el desglose.
- **Redacción Automática de PII:** Todo comentario abierto pasa por un filtro determinista y semántico que enmascara nombres propios, correos, teléfonos o referencias personales antes de ser analizado o mostrado.
- **Supervisión Humana Obligatoria:** La IA propone preguntas y recomienda acciones, pero las personas de RRHH siempre validan y deciden.
- **Zero Secrets Exposed:** Todas las credenciales se gestionan mediante variables de entorno (`.env` ignorado en Git).

---

## 📂 Estructura del Repositorio

```text
├── .agents/
│   └── skills/
│       └── n8n-architect/       # Skill de arquitectura y validación de flujos n8n
├── docs/
│   ├── REQUISITOS.md            # Análisis detallado de requisitos funcionales, éticos y de evaluación
│   ├── PLANIFICACION.md         # Arquitectura técnica, diseño de workflows n8n, módulos web y roadmap
│   ├── 20261102 - Guia participants.pdf
│   └── Repte-Estrella-Damm-UAB-THE-HACK-2026.pdf
├── mcp-n8n-local/               # Servidor MCP local para diseñar, validar y desplegar workflows en n8n
├── ANTIGRAVITY_SETUP.md         # Guía de configuración del servidor MCP en Google Antigravity
├── .gitignore                   # Protección contra subida de secretos (.env), bases de datos y artefactos
└── README.md                    # Documentación general del proyecto
```

---

## 🚀 Puesta en Marcha (macOS, Windows y Linux)

Todo el backend corre en **Docker** (n8n + task runner aislado). En tu equipo solo necesitas Docker, Node.js y Git.

### 0. Requisitos previos

| Herramienta | macOS | Windows 10/11 | Linux (Ubuntu/Debian) |
|---|---|---|---|
| **Docker** | [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/) o `brew install --cask docker` | [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (activa **WSL 2** cuando lo pida y reinicia) | [Docker Engine + plugin compose](https://docs.docker.com/engine/install/ubuntu/), luego `sudo usermod -aG docker $USER` y vuelve a iniciar sesión |
| **Node.js ≥ 20** (solo scripts y tests) | `brew install node` | [nodejs.org](https://nodejs.org) (LTS) o `winget install OpenJS.NodeJS.LTS` | [nodejs.org](https://nodejs.org/en/download/package-manager) o `nvm install --lts` |
| **Git** | `xcode-select --install` | `winget install Git.Git` | `sudo apt install git` |

Comprueba que todo está listo (Docker Desktop debe estar **abierto** en macOS/Windows):

```bash
docker --version && docker compose version && node --version
```

> No hace falta instalar n8n: la imagen Docker ya fija la versión (`n8nio/n8n:2.46.6`), igual en todos los equipos.

### 1. Clonar y configurar `.env`

```bash
git clone <URL_DEL_REPOSITORIO> damm && cd damm
cp .env.example .env          # Windows (PowerShell): Copy-Item .env.example .env
```

Edita `.env` y rellena:

| Variable | De dónde sale |
|---|---|
| `N8N_RUNNERS_AUTH_TOKEN` | Genera uno: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `LLM_API_KEY` | Clave del LLM de la UAB The Hack! |
| `TYPEFORM_TOKEN` | Typeform → Account → Personal tokens (opcional: sin él WF-02 usa un modo simulado) |
| `TEAMS_WEBHOOK_URL` | Opcional |
| `N8N_API_KEY` | Se crea en el paso 3 |

> `.env` está en `.gitignore`: **nunca** lo subas ni lo compartas por chat. Cada persona usa sus propias claves.

### 2. Arrancar n8n

```bash
npm run build:mcp      # instala y compila mcp-n8n-local (lo usan scripts y tests)
npm run n8n:up         # levanta n8n + task runner → http://localhost:5678
                       # y el frontend → http://localhost:8080
```

> El frontend se sirve como build estático (se reconstruye en cada `npm run n8n:up`). Para desarrollo con hot-reload: `npm --prefix frontend install && npm --prefix frontend run dev`.

### 3. Crear la API key de n8n (solo la primera vez)

1. Abre `http://localhost:5678` y crea la cuenta owner (es local, no se envía a ningún sitio).
2. **Settings → n8n API → Create API Key** y pégala en `.env` como `N8N_API_KEY`.

### 4. Desplegar y activar los workflows

```bash
npm run setup:workflows   # crea WF-01..04 (si faltan), los actualiza y los activa
```

Webhooks disponibles en `http://localhost:5678/webhook/{generate-survey,publish-survey,ingest-responses,analytics}`.

### Comandos útiles

| Acción | Comando |
|---|---|
| Parar | `npm run n8n:down` (los datos persisten en el volumen `n8n_data`) |
| Ver logs | `npm run n8n:logs` (frontend: `npm run frontend:logs`) |
| Estado | `docker compose ps` |
| Borrar todo (cuenta, workflows, ejecuciones) | `docker compose down -v` |

### Acceso desde otros dispositivos de la red (opcional)

Por defecto n8n **solo escucha en `127.0.0.1`**, así nadie más en tu red (p. ej. la wifi del hackathon) puede verlo. Para probar desde el móvil u otro portátil en la misma red, añade a `.env`:

```env
N8N_BIND=0.0.0.0
N8N_PUBLIC_URL=http://<IP_DE_TU_EQUIPO>:5678/
```

y ejecuta `npm run n8n:up`. Ciérralo de nuevo (borra esas líneas) cuando termines. Los scripts y tests se ejecutan siempre en el equipo que tiene n8n (`mcp-n8n-local` solo permite `localhost` como protección SSRF).

### Privacidad del entorno Docker

- Al contenedor solo se le pasan las variables que usan los workflows (`LLM_API_KEY`, `TYPEFORM_TOKEN`, `TEAMS_WEBHOOK_URL`), no todo `.env`.
- Los nodos *Code* se ejecutan en un contenedor *runner* separado.
- Los datos de ejecución (que incluyen comentarios antes de anonimizar) se **purgan a las 72 h**.
- Telemetría, plantillas y paquetes comunitarios no verificados están desactivados.

*(Para conectar el agente con `mcp-n8n-local`, consulta [`ANTIGRAVITY_SETUP.md`](./ANTIGRAVITY_SETUP.md)).*

### 5. Ejecución de la Batería de Tests Automatizados
El proyecto cuenta con una suite completa de pruebas unitarias, de validación de esquemas Zod, auditoría de seguridad y pruebas de integración E2E en vivo con `n8n`:

```bash
# Ejecutar toda la suite de tests (19 tests)
npm test

# O ejecutar por categorías individuales:
npm run test:security  # Auditoría Git: Cero fugas de tokens, PII o claves
npm run test:schemas   # Validación de grafos y esquemas Zod de los workflows
npm run test:logic     # Pruebas unitarias de filtros anti-sesgo, PII y k-anonimato
npm run test:e2e       # Invocación real a los webhooks activos de n8n
```

---

## 📚 Documentación Detallada

- 📋 **[Requisitos del Proyecto (`docs/REQUISITOS.md`)](./docs/REQUISITOS.md):** Necesidades de negocio, los 8 pasos del ciclo funcional, escenarios de demostración (A, B y C), esquema de datos sintéticos, reglas de privacidad y criterios de evaluación.
- 🗺️ **[Planificación y Arquitectura (`docs/PLANIFICACION.md`)](./docs/PLANIFICACION.md):** Diseño de la Web Base, topología de los 4 workflows en `n8n`, estrategia de sanitización PII y $k$-anonimato, y planificación por fases del hackathon.
- ⚙️ **[Configuración MCP n8n (`ANTIGRAVITY_SETUP.md`)](./ANTIGRAVITY_SETUP.md):** Guía de conexión del servidor `mcp-n8n-local`.

---

## ✅ Checklist de Entrega (UAB THE HACK! 2026)

- [x] El flujo cubre desde la necesidad de RRHH hasta la recomendación de acción y nueva consulta.
- [x] Existe validación humana obligatoria antes de publicar encuestas y al aprobar acciones.
- [x] Los datos utilizados son 100% sintéticos.
- [x] Se aplica umbral mínimo de agregación ($k \ge 5$) y sanitización de PII en comentarios abiertos.
- [x] Ningún token ni secreto está expuesto en el código ni en la documentación (`.gitignore` configurado).
- [x] Documentación completa (`README.md`, `docs/REQUISITOS.md`, `docs/PLANIFICACION.md`).
