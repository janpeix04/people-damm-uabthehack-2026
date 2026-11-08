<div align="center">

[Català](./README.md) · [Español](./README.es.md) · **🌐 English**

<br>

<img src="./docs/screenshots/cover.jpg" alt="People Damm" width="820">

# People Damm

### Listen better, act sooner.

An active, continuous and intelligent workplace-climate listening platform, powered by AI and private by design.

[![UAB THE HACK! 2026](https://img.shields.io/badge/UAB%20THE%20HACK!-2026-c8102e?style=for-the-badge)](#-hackathon)
[![Estrella Damm Challenge](https://img.shields.io/badge/Challenge-Estrella%20Damm-f2b705?style=for-the-badge)](./docs/Repte-Estrella-Damm-UAB-THE-HACK-2026.pdf)

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=threedotjs&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-2.46-ea4b71?logo=n8n&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)

[Problem](#-the-problem) · [Solution](#-the-solution) · [Screenshots](#-screenshots) · [Architecture](#️-architecture) · [Privacy](#️-privacy-and-responsible-use) · [Getting started](#-getting-started) · [Team](#-team)

</div>

---

## 🎯 The problem

Damm has people working in **factories** (shift-based production and packaging), **logistics** (warehouses and delivery), **sales teams** (on the road, mobile-only) and **offices**. Traditional annual climate surveys run into three barriers:

| Barrier | Consequence |
|---|---|
| **Unrepresentative participation** | Plant and logistics staff respond less due to lack of time or computer access. |
| **One size fits all** | The same long survey doesn't reflect the reality of a night-shift operator, a sales rep or a manager. |
| **Lots of text, late analysis** | Hundreds of open comments are reviewed by hand; by the time a problem is spotted, it's too late to act. |

## 💡 The solution

**People Damm** turns climate measurement into a **continuous, ethical, AI-assisted cycle** with two connected experiences:

- 🧑‍💼 **HR Portal** — create micro-surveys with AI, publish them, analyse aggregated results and decide on actions.
- 👷 **Worker App** — mobile-first: answer in under 90 seconds, share ideas in La Plaça, log your daily mood and redeem points.

### The 8-step listening cycle

```mermaid
flowchart LR
    A[1 · Define<br>the need] --> B[2 · Generate<br>with AI]
    B --> C[3 · Human<br>validation]
    C --> D[4 · Publish<br>QR · Teams · App]
    D --> E[5 · Representative<br>participation]
    E --> F[6 · Anonymise<br>and analyse]
    F --> G[7 · Visualise<br>k ≥ 5]
    G --> H[8 · Recommend<br>and close the loop]
    H -.-> A
```

1. **Define the need** — HR describes in plain language what it wants to understand, for which group and with what maximum duration.
2. **Generate the micro-survey with AI** — an LLM orchestrated through n8n proposes 3–6 questions tailored in tone, length and language (CA/ES/EN).
3. **Human validation** — HR reviews, edits, reorders or removes questions. **The AI never publishes without approval.**
4. **Publish** — in the app, with a **printable QR poster** for the plant floor and a **Microsoft Teams** notification (Typeform optional).
5. **Representative participation** — a fast mobile experience plus a monitor that flags under-represented groups.
6. **Anonymise and analyse** — automatic **PII** removal, topic clustering, sentiment and weak-signal detection.
7. **Visualise with privacy** — results are always aggregated; segments are blocked when **n < 5**.
8. **Recommend and close the loop** — concrete actions validated by HR and a one-click follow-up survey.

## 📸 Screenshots

### Access

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/landing.jpg" alt="Landing"><br><sub><b>Landing</b> — choose between HR Portal and Worker App.</sub></td>
    <td width="50%"><img src="./docs/screenshots/login.jpg" alt="Sign in"><br><sub><b>Sign in</b> — local accounts with roles and secure sessions.</sub></td>
  </tr>
</table>

### HR Portal

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-home.jpg" alt="Home"><br><sub><b>Home</b> — climate and participation KPIs plus an emotion map by department.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-surveys.jpg" alt="Surveys"><br><sub><b>Surveys</b> — active, scheduled, draft and closed, with live participation.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-analytics.jpg" alt="Analytics & insights"><br><sub><b>Analytics & insights</b> — PostgreSQL metrics, filters and representativeness.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-directory.jpg" alt="Directory & integrations"><br><sub><b>Directory & integrations</b> — accounts, sites, roles and data source.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-world.jpg" alt="Damm World 3D"><br><sub><b>Damm World 3D</b> — each department's climate as a living building.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza.jpg" alt="La Plaça 3D"><br><sub><b>La Plaça 3D</b> — topics of the week and most-voted ideas.</sub></td>
  </tr>
</table>

#### Creating a survey with AI (4 steps)

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create.jpg" alt="1 · Goal"><br><sub><b>1 · Goal</b> — HR describes what it wants to learn, duration, language and departments.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-2.jpg" alt="2 · Questions"><br><sub><b>2 · Questions</b> — the AI proposes questions; HR edits, regenerates or discards them.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create-3.jpg" alt="3 · Audience & channels"><br><sub><b>3 · Audience & channels</b> — k-anonymous zones and channels: QR, app, Teams, email, Plaça and World.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-4.jpg" alt="4 · Review & publish"><br><sub><b>4 · Review & publish</b> — mobile preview and mandatory human approval.</sub></td>
  </tr>
</table>

#### La Plaça 3D

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-ideas.jpg" alt="Idea box"><br><sub><b>Idea box</b> — HR moderation before publishing, with automatic PII redaction.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar.jpg" alt="La Barra"><br><sub><b>La Barra</b> — the square's meeting point.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar-menu.jpg" alt="Damm beer menu"><br><sub><b>Damm beer menu</b> — La Plaça's bar, always open.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood-prompt.jpg" alt="Daily mood"><br><sub><b>Daily mood</b> — optional one-tap daily check-in.</sub></td>
  </tr>
</table>

<details>
<summary><b>See the full analysis of a survey</b></summary>
<br>
<p align="center"><img src="./docs/screenshots/hr-analytics-full.jpg" alt="Analytics" width="720"></p>
</details>

### Worker App · desktop

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-home.jpg" alt="Home"><br><sub><b>Home</b> — pending surveys, points and how it works.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — walk around, back ideas with “+1 Me too” and answer surveys.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-rewards.jpg" alt="Rewards"><br><sub><b>Rewards</b> — redeem points for coffee, snacks or donations.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood.jpg" alt="My mood"><br><sub><b>My mood</b> — once a day, without storing which face you picked.</sub></td>
  </tr>
</table>

### Worker App · mobile

<table>
  <tr>
    <td width="25%"><img src="./docs/screenshots/app-home.jpg" alt="Home"><br><sub><b>Home</b> — surveys and points.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — ideas and votes.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-mood.jpg" alt="Mood"><br><sub><b>Mood</b> — anonymous.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-rewards.jpg" alt="Rewards"><br><sub><b>Rewards</b> — points for taking part.</sub></td>
  </tr>
</table>

> Screenshots show the Catalan interface; the app is available in Catalan, Spanish and English.

## ✨ Features

| HR Portal | Worker App |
|---|---|
| AI-generated micro-surveys (CA/ES/EN) | Short surveys (< 90 s) from mobile or QR |
| Editor with mandatory human validation | La Plaça 3D: anonymous ideas and votes |
| Publishing with QR poster and Microsoft Teams | Daily mood, unlinked from the account |
| Analytics filtered by period, area, shift and channel | Points wallet and rewards |
| Representativeness detector (“who aren't we hearing?”) | Trilingual interface |
| Damm World 3D and emotion map | |
| User directory and integrations | |
| CSV export and printable report | |

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client
        W[HR Portal<br>React · Vite · Tailwind]
        M[Worker App<br>mobile-first · Three.js]
    end
    subgraph Docker Compose
        N[nginx<br>static frontend]
        API[hr-api<br>Node.js · auth · analytics]
        DB[(PostgreSQL 17)]
        N8N[n8n 2.46<br>AI workflows]
        R[n8n runners<br>isolated Code nodes]
    end
    LLM[[UAB THE HACK! LLM]]
    EXT[[Typeform · Microsoft Teams]]

    W & M --> N
    N -->|/api| API
    API --> DB
    API -->|/api/hr/automation| N8N
    N8N --- R
    N8N --> LLM
    N8N --> EXT
```

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Three.js, React Router, custom i18n (CA/ES/EN) |
| **API** | Node.js (`server/`): session auth, analytics, surveys, Plaça, directory |
| **Data** | PostgreSQL 17 with SQL migrations and privacy invariants (`supabase/`) |
| **AI & automation** | n8n with an external task runner; custom MCP server [`mcp-n8n-local`](./mcp-n8n-local) |
| **Integrations** | Microsoft Teams ([`integrations/teams`](./integrations/teams)), Typeform (optional) |

### n8n workflows

| Workflow | Purpose |
|---|---|
| `WF-01` | Adaptive AI micro-survey design |
| `WF-02` | Publishing (Typeform API), QR generation and Teams connector |
| `WF-03` | Response ingestion, multi-layer PII sanitisation and bilingual clustering |
| `WF-04` | k-anonymity engine, bias detector and action recommender |

## 🛡️ Privacy and responsible use

> Trust is what makes people answer honestly.

- **100% synthetic data** — no real Damm employee data is used.
- **Strict aggregation (k ≥ 5)** — no segment with fewer than 5 responses is shown, in the backend or the dashboard.
- **Automatic PII redaction** — names, emails and phone numbers are masked before comments are analysed or displayed.
- **Identity separated from content** — responses, ideas and moods carry no user or session keys. Points are earned for taking part, never for what you answer.
- **Humans in charge** — the AI proposes; HR validates and decides.
- **No secrets in the code** — credentials live in `.env` (git-ignored) and a leak-audit test guards the repo.
- **Hardened environment** — services bound to `127.0.0.1`, n8n executions purged after 72 h, telemetry disabled.

## 🚀 Getting started

**Requirements:** Docker (Desktop or Engine with Compose), Node.js ≥ 20 and Git.

```bash
# 1. Clone and configure
git clone <REPOSITORY_URL> damm && cd damm
cp .env.example .env    # fill in N8N_RUNNERS_AUTH_TOKEN, LLM_API_KEY, POSTGRES_PASSWORD…

# 2. Start the whole platform
npm run build:mcp       # builds mcp-n8n-local
npm run n8n:up          # n8n, runners, PostgreSQL, hr-api and frontend

# 3. Create the demo accounts
node --env-file=.env scripts/auth_accounts.js --demo

# 4. Deploy the workflows (needs N8N_API_KEY, created in n8n → Settings → n8n API)
npm run setup:workflows
```

| Service | URL |
|---|---|
| Web (HR Portal + App) | http://localhost:8080 |
| n8n | http://localhost:5678 |
| PostgreSQL | `localhost:54322` |

> On an empty PostgreSQL volume, Docker applies the migrations and the demo seed (`supabase/demo_seed.sql`) with five synthetic campaigns. Demo account passwords are randomly generated and stored in `auth-accounts.local` (git-ignored).

<details>
<summary><b>Useful commands</b></summary>

| Action | Command |
|---|---|
| Stop | `npm run n8n:down` |
| Logs | `npm run n8n:logs` · `npm run frontend:logs` · `npm run postgres:logs` |
| Database status | `npm run db:status` |
| Apply pending migrations | `npm run db:migrate` |
| Hot-reload development | `npm --prefix frontend install && npm --prefix frontend run dev` |
| Wipe everything | `docker compose down -v` |

</details>

### Tests

```bash
npm test                # full suite (node:test)
npm run test:security   # secret and PII leak audit
npm run test:schemas    # n8n workflow validation
npm run test:logic      # PII, k-anonymity and anti-bias filters
npm run test:e2e        # live n8n webhooks
```

## 📂 Repository structure

```text
├── frontend/          # HR Portal and Worker App (React + Vite + Three.js)
├── server/            # hr-api: auth, surveys, analytics, Plaça, directory
├── supabase/          # SQL migrations, seeds and privacy-invariant tests
├── mcp-n8n-local/     # MCP server to design, validate and deploy workflows
├── integrations/teams # Microsoft Teams app and cards
├── scripts/           # Workflow deployment, seeds and smoke tests
├── tests/             # Security, schemas, logic, auth, analytics and anonymity
├── docs/              # Requirements, data architecture and technical docs
└── docker-compose.yml
```

## 📚 Documentation

Technical documentation is written in Catalan and Spanish:

- [Requirements](./docs/REQUISITOS.md) · [Planning](./docs/PLANIFICACION.md) · [Data architecture](./docs/DATA_ARCHITECTURE.md)
- [Authentication](./docs/AUTH.md) · [Analytics](./docs/ANALYTICS_POSTGRES.md) · [Representativeness](./docs/REPRESENTATION.md)
- [La Plaça](./docs/PLAZA_SCHEMA.md) · [Departments](./docs/DEPARTMENTS.md) · [Directory](./docs/DIRECTORY.md)

## 🏆 Hackathon

Built at **UAB THE HACK! 2026** for the **Estrella Damm Challenge**:

> *How can we measure workplace climate in an agile, continuous and intelligent way with AI?*

- [x] Full cycle: from HR's need to action and a new survey.
- [x] Mandatory human validation before publishing and approving actions.
- [x] 100% synthetic data.
- [x] Minimum aggregation threshold (k ≥ 5) and PII sanitisation.
- [x] No secrets exposed in the repository.

## 👥 Team

| | |
|---|---|
| **Phoebe Iglesias** | **Carles Peiró** |
| **Jan Peix** | **Joan Marc Samó** |

---

<div align="center">
<sub>Made with 🍺 at UAB · All data is synthetic · Not an official Damm project</sub>
</div>
