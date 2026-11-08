<div align="center">

[Català](./README.md) · **🌐 Español** · [English](./README.en.md)

<br>

<img src="./docs/screenshots/cover.jpg" alt="People Damm" width="820">

# People Damm

### Escuchar mejor, actuar antes.

Plataforma de escucha activa, continua e inteligente del clima laboral, con IA y privacidad por diseño.

[![UAB THE HACK! 2026](https://img.shields.io/badge/UAB%20THE%20HACK!-2026-c8102e?style=for-the-badge)](#-hackathon)
[![Reto Estrella Damm](https://img.shields.io/badge/Reto-Estrella%20Damm-f2b705?style=for-the-badge)](./docs/Repte-Estrella-Damm-UAB-THE-HACK-2026.pdf)

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=threedotjs&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-2.46-ea4b71?logo=n8n&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)

[Problema](#-el-problema) · [Solución](#-la-solución) · [Capturas](#-capturas) · [Arquitectura](#️-arquitectura) · [Privacidad](#️-privacidad-y-uso-responsable) · [Puesta en marcha](#-puesta-en-marcha) · [Equipo](#-equipo)

</div>

---

## 🎯 El problema

Damm tiene personas en **fábrica** (producción y envasado por turnos), **logística** (almacenes y reparto), **equipos comerciales** (en ruta, desde el móvil) y **oficinas**. Las encuestas anuales de clima tradicionales chocan con tres barreras:

| Barrera | Consecuencia |
|---|---|
| **Participación poco representativa** | Planta y logística responden menos por falta de tiempo o de acceso a un ordenador. |
| **Talla única** | Una misma encuesta larga no refleja la realidad de un operario del turno de noche, un comercial o un manager. |
| **Mucho texto, análisis tardío** | Cientos de comentarios abiertos se revisan a mano; cuando se detecta el problema, ya es tarde para actuar. |

## 💡 La solución

**People Damm** convierte la medición del clima laboral en un **ciclo continuo, ético y asistido por IA**, con dos experiencias conectadas:

- 🧑‍💼 **Portal RRHH** — crear microconsultas con IA, publicarlas, analizar resultados agregados y decidir acciones.
- 👷 **App del trabajador** — mobile-first, responder en menos de 90 segundos, compartir ideas en La Plaça, registrar el estado de ánimo y canjear puntos.

### El ciclo de escucha en 8 pasos

```mermaid
flowchart LR
    A[1 · Definir<br>la necesidad] --> B[2 · Generar<br>con IA]
    B --> C[3 · Validación<br>humana]
    C --> D[4 · Publicar<br>QR · Teams · App]
    D --> E[5 · Participación<br>representativa]
    E --> F[6 · Anonimizar<br>y analizar]
    F --> G[7 · Visualizar<br>k ≥ 5]
    G --> H[8 · Recomendar<br>y cerrar el ciclo]
    H -.-> A
```

1. **Definir la necesidad** — RRHH describe en lenguaje natural qué quiere entender, para qué colectivo y con qué duración máxima.
2. **Generar la microconsulta con IA** — un LLM orquestado con n8n propone 3–6 preguntas adaptadas en tono, longitud e idioma (CA/ES/EN).
3. **Validación humana** — RRHH revisa, edita, reordena o elimina preguntas. **La IA nunca publica sin aprobación.**
4. **Publicar** — en la app, con **cartel QR imprimible** para planta y notificación en **Microsoft Teams** (Typeform opcional).
5. **Participación representativa** — experiencia móvil rápida y un monitor que detecta colectivos infrarrepresentados.
6. **Anonimizar y analizar** — eliminación automática de **PII**, agrupación por temas, sentimiento y señales débiles.
7. **Visualizar con privacidad** — resultados siempre agregados, segmentos bloqueados si **n < 5**.
8. **Recomendar y cerrar el ciclo** — acciones concretas validadas por RRHH y consulta de seguimiento con un clic.

## 📸 Capturas

### Acceso

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/landing.jpg" alt="Portada"><br><sub><b>Portada</b> — elige entre Portal RRHH y App del trabajador.</sub></td>
    <td width="50%"><img src="./docs/screenshots/login.jpg" alt="Inicio de sesión"><br><sub><b>Inicio de sesión</b> — cuentas locales con roles y sesiones seguras.</sub></td>
  </tr>
</table>

### Portal RRHH

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-home.jpg" alt="Inicio"><br><sub><b>Inicio</b> — KPI de clima, participación y mapa de emociones por departamento.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-surveys.jpg" alt="Encuestas"><br><sub><b>Encuestas</b> — activas, programadas, borradores y cerradas, con participación en directo.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-analytics.jpg" alt="Análisis e insights"><br><sub><b>Análisis e insights</b> — métricas de PostgreSQL, filtros y representatividad.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-directory.jpg" alt="Directorio e integraciones"><br><sub><b>Directorio e integraciones</b> — cuentas, centros, roles y origen de los datos.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-world.jpg" alt="Damm World 3D"><br><sub><b>Damm World 3D</b> — el clima de cada departamento como un edificio vivo.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza.jpg" alt="La Plaça 3D"><br><sub><b>La Plaça 3D</b> — temas de la semana e ideas más votadas.</sub></td>
  </tr>
</table>

#### Crear una encuesta con IA (4 pasos)

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create.jpg" alt="1 · Objetivo"><br><sub><b>1 · Objetivo</b> — RRHH describe qué quiere saber, duración, idioma y departamentos.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-2.jpg" alt="2 · Preguntas"><br><sub><b>2 · Preguntas</b> — la IA propone preguntas; RRHH las edita, regenera o descarta.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create-3.jpg" alt="3 · Público y canales"><br><sub><b>3 · Público y canales</b> — zonas con k-anonimato y canales: QR, app, Teams, correo, Plaça y World.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-4.jpg" alt="4 · Revisión y publicación"><br><sub><b>4 · Revisión y publicación</b> — vista previa móvil y aprobación humana obligatoria.</sub></td>
  </tr>
</table>

#### La Plaça 3D

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-ideas.jpg" alt="Buzón de ideas"><br><sub><b>Buzón de ideas</b> — moderación de RRHH antes de publicar, con redacción automática de PII.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar.jpg" alt="La Barra"><br><sub><b>La Barra</b> — punto de encuentro de la plaza.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar-menu.jpg" alt="Carta de cervezas Damm"><br><sub><b>Carta de cervezas Damm</b> — la barra de La Plaça, siempre abierta.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood-prompt.jpg" alt="Estado de ánimo"><br><sub><b>Estado de ánimo</b> — pregunta diaria opcional, de un solo toque.</sub></td>
  </tr>
</table>

<details>
<summary><b>Ver el análisis completo de un formulario</b></summary>
<br>
<p align="center"><img src="./docs/screenshots/hr-analytics-full.jpg" alt="Analytics" width="720"></p>
</details>

### App del trabajador · escritorio

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-home.jpg" alt="Inicio"><br><sub><b>Inicio</b> — encuestas pendientes, puntos y cómo funciona.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — pasea, vota ideas con «+1 Yo también» y responde encuestas.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-rewards.jpg" alt="Recompensas"><br><sub><b>Recompensas</b> — canjea puntos por café, snacks o donaciones.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood.jpg" alt="Mi estado de ánimo"><br><sub><b>Mi estado de ánimo</b> — una vez al día, sin guardar qué cara has elegido.</sub></td>
  </tr>
</table>

### App del trabajador · móvil

<table>
  <tr>
    <td width="25%"><img src="./docs/screenshots/app-home.jpg" alt="Inicio"><br><sub><b>Inicio</b> — encuestas y puntos.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — ideas y votos.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-mood.jpg" alt="Estado de ánimo"><br><sub><b>Estado de ánimo</b> — anónimo.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-rewards.jpg" alt="Recompensas"><br><sub><b>Recompensas</b> — puntos por participar.</sub></td>
  </tr>
</table>

> Las capturas muestran la interfaz en catalán; la aplicación está disponible en catalán, castellano e inglés.

## ✨ Funcionalidades

| Portal RRHH | App del trabajador |
|---|---|
| Generación de microconsultas con IA (CA/ES/EN) | Encuestas cortas (< 90 s) desde el móvil o QR |
| Editor con validación humana obligatoria | La Plaça 3D: ideas anónimas y votos |
| Publicación con cartel QR y Microsoft Teams | Estado de ánimo diario, desvinculado de la cuenta |
| Analítica con filtros por período, zona, turno y canal | Monedero de puntos y recompensas |
| Detector de representatividad («¿a quién no estamos escuchando?») | Interfaz trilingüe |
| Damm World 3D y mapa de emociones | |
| Directorio de usuarios e integraciones | |
| Exportación CSV e informe imprimible | |

## 🏗️ Arquitectura

```mermaid
flowchart TB
    subgraph Cliente
        W[Portal RRHH<br>React · Vite · Tailwind]
        M[App trabajador<br>mobile-first · Three.js]
    end
    subgraph Docker Compose
        N[nginx<br>frontend estático]
        API[hr-api<br>Node.js · auth · analítica]
        DB[(PostgreSQL 17)]
        N8N[n8n 2.46<br>workflows de IA]
        R[n8n runners<br>nodos Code aislados]
    end
    LLM[[LLM UAB THE HACK!]]
    EXT[[Typeform · Microsoft Teams]]

    W & M --> N
    N -->|/api| API
    API --> DB
    API -->|/api/hr/automation| N8N
    N8N --- R
    N8N --> LLM
    N8N --> EXT
```

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Three.js, React Router, i18n propio (CA/ES/EN) |
| **API** | Node.js (`server/`): autenticación con sesiones, analítica, encuestas, Plaça, directorio |
| **Datos** | PostgreSQL 17 con migraciones SQL e invariantes de privacidad (`supabase/`) |
| **IA y automatización** | n8n con task runner externo; servidor MCP propio [`mcp-n8n-local`](./mcp-n8n-local) |
| **Integraciones** | Microsoft Teams ([`integrations/teams`](./integrations/teams)), Typeform (opcional) |

### Workflows de n8n

| Workflow | Función |
|---|---|
| `WF-01` | Diseño adaptativo de microconsultas con IA |
| `WF-02` | Publicación (Typeform API), generación de QR y conector de Teams |
| `WF-03` | Ingesta de respuestas, sanitización PII multicapa y clustering bilingüe |
| `WF-04` | Motor de k-anonimato, detector de sesgos y recomendador de acciones |

## 🛡️ Privacidad y uso responsable

> La confianza es lo que hace que la gente responda con sinceridad.

- **Datos 100% sintéticos** — no se utiliza ningún dato real de empleados de Damm.
- **Agregación estricta (k ≥ 5)** — ningún segmento con menos de 5 respuestas se muestra, ni en el backend ni en el dashboard.
- **Redacción automática de PII** — nombres, correos y teléfonos se enmascaran antes de analizar o mostrar comentarios.
- **Identidad separada del contenido** — respuestas, ideas y estado de ánimo no llevan claves de usuario ni de sesión. Los puntos se ganan por participar, nunca por lo que se responde.
- **Humanos al mando** — la IA propone; RRHH valida y decide.
- **Sin secretos en el código** — credenciales en `.env` (ignorado por Git) y test de auditoría de filtraciones.
- **Entorno endurecido** — servicios solo en `127.0.0.1`, ejecuciones de n8n purgadas a las 72 h, telemetría desactivada.

## 🚀 Puesta en marcha

**Requisitos:** Docker (Desktop o Engine con Compose), Node.js ≥ 20 y Git.

```bash
# 1. Clonar y configurar
git clone <URL_DEL_REPOSITORIO> damm && cd damm
cp .env.example .env    # rellena N8N_RUNNERS_AUTH_TOKEN, LLM_API_KEY, POSTGRES_PASSWORD…

# 2. Levantar toda la plataforma
npm run build:mcp       # compila mcp-n8n-local
npm run n8n:up          # n8n, runners, PostgreSQL, hr-api y frontend

# 3. Crear las cuentas de demo
node --env-file=.env scripts/auth_accounts.js --demo

# 4. Desplegar los workflows (requiere N8N_API_KEY, se crea en n8n → Settings → n8n API)
npm run setup:workflows
```

| Servicio | URL |
|---|---|
| Web (Portal RRHH + App) | http://localhost:8080 |
| n8n | http://localhost:5678 |
| PostgreSQL | `localhost:54322` |

> Con un volumen PostgreSQL vacío, Docker aplica las migraciones y el seed de demo (`supabase/demo_seed.sql`) con cinco campañas sintéticas. Las contraseñas de las cuentas de demo se generan aleatoriamente y se guardan en `auth-accounts.local` (ignorado por Git).

<details>
<summary><b>Comandos útiles</b></summary>

| Acción | Comando |
|---|---|
| Parar | `npm run n8n:down` |
| Logs | `npm run n8n:logs` · `npm run frontend:logs` · `npm run postgres:logs` |
| Estado de la BD | `npm run db:status` |
| Aplicar migraciones pendientes | `npm run db:migrate` |
| Desarrollo con hot-reload | `npm --prefix frontend install && npm --prefix frontend run dev` |
| Borrarlo todo | `docker compose down -v` |

</details>

### Tests

```bash
npm test                # suite completa (node:test)
npm run test:security   # auditoría de filtración de secretos y PII
npm run test:schemas    # validación de los workflows de n8n
npm run test:logic      # PII, k-anonimato y filtros anti-sesgo
npm run test:e2e        # webhooks reales de n8n
```

## 📂 Estructura del repositorio

```text
├── frontend/          # Portal RRHH y App del trabajador (React + Vite + Three.js)
├── server/            # hr-api: autenticación, encuestas, analítica, Plaça, directorio
├── supabase/          # Migraciones SQL, seeds y tests de invariantes de privacidad
├── mcp-n8n-local/     # Servidor MCP para diseñar, validar y desplegar workflows
├── integrations/teams # App y tarjetas para Microsoft Teams
├── scripts/           # Despliegue de workflows, seeds y smoke tests
├── tests/             # Seguridad, esquemas, lógica, auth, analítica y anonimato
├── docs/              # Requisitos, arquitectura de datos y documentación técnica
└── docker-compose.yml
```

## 📚 Documentación

- [Requisitos](./docs/REQUISITOS.md) · [Planificación](./docs/PLANIFICACION.md) · [Arquitectura de datos](./docs/DATA_ARCHITECTURE.md)
- [Autenticación](./docs/AUTH.md) · [Analítica](./docs/ANALYTICS_POSTGRES.md) · [Representatividad](./docs/REPRESENTATION.md)
- [La Plaça](./docs/PLAZA_SCHEMA.md) · [Departamentos](./docs/DEPARTMENTS.md) · [Directorio](./docs/DIRECTORY.md)

## 🏆 Hackathon

Proyecto desarrollado en **UAB THE HACK! 2026** para el **Reto Estrella Damm**:

> *¿Cómo podemos medir el clima laboral de manera ágil, continua e inteligente con IA?*

- [x] Ciclo completo: de la necesidad de RRHH a la acción y la nueva consulta.
- [x] Validación humana obligatoria antes de publicar y de aprobar acciones.
- [x] Datos 100% sintéticos.
- [x] Umbral mínimo de agregación (k ≥ 5) y sanitización de PII.
- [x] Ningún secreto expuesto en el repositorio.

## 👥 Equipo

| | |
|---|---|
| **Phoebe Iglesias** | **Carles Peiró** |
| **Jan Peix** | **Joan Marc Samó** |

---

<div align="center">
<sub>Hecho con 🍺 en la UAB · Todos los datos son sintéticos · Proyecto no oficial de Damm</sub>
</div>
