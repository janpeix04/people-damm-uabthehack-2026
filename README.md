<div align="center">

**🌐 Català** · [Español](./README.es.md) · [English](./README.en.md)

<br>

<img src="./docs/screenshots/cover.jpg" alt="People Damm" width="820">

# People Damm

### Escoltar millor, actuar abans.

Plataforma d'escolta activa, contínua i intel·ligent del clima laboral, amb IA i privacitat per disseny.

[![Projecte guanyador](https://img.shields.io/badge/Guanyador-Repte%20Damm-f2b705?style=for-the-badge&labelColor=c8102e)](#-hackathon)
[![UAB THE HACK! 2026](https://img.shields.io/badge/UAB%20THE%20HACK!-2026-c8102e?style=for-the-badge)](#-hackathon)
[![Repte Estrella Damm](https://img.shields.io/badge/Repte-Estrella%20Damm-f2b705?style=for-the-badge)](./docs/Repte-Estrella-Damm-UAB-THE-HACK-2026.pdf)

**Projecte guanyador del Repte Damm a UAB THE HACK! 2026.**

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=threedotjs&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-2.46-ea4b71?logo=n8n&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)

[Problema](#-el-problema) · [Solució](#-la-solució) · [Captures](#-captures) · [Arquitectura](#️-arquitectura) · [Privacitat](#️-privacitat-i-ús-responsable) · [Posada en marxa](#-posada-en-marxa) · [Equip](#-equip)

</div>

---

## 🎯 El problema

Damm té persones a **fàbrica** (producció i envasat per torns), **logística** (magatzems i repartiment), **equips comercials** (en ruta, des del mòbil) i **oficines**. Les enquestes anuals de clima tradicionals topen amb tres barreres:

| Barrera | Conseqüència |
|---|---|
| **Participació poc representativa** | Planta i logística responen menys per falta de temps o d'accés a un ordinador. |
| **Talla única** | Una mateixa enquesta llarga no reflecteix la realitat d'un operari del torn de nit, d'un comercial o d'un manager. |
| **Molt de text, anàlisi tardana** | Centenars de comentaris oberts es revisen a mà; quan es detecta el problema, ja és tard per actuar. |

## 💡 La solució

**People Damm** converteix la mesura del clima laboral en un **cicle continu, ètic i assistit per IA**, amb dues experiències connectades:

- 🧑‍💼 **Portal RRHH** — crear microconsultes amb IA, publicar-les, analitzar resultats agregats i decidir accions.
- 👷 **App del treballador** — mobile-first, respondre en menys de 90 segons, compartir idees a La Plaça, registrar l'estat d'ànim i bescanviar punts.

### El cicle d'escolta en 8 passos

```mermaid
flowchart LR
    A[1 · Definir<br>la necessitat] --> B[2 · Generar<br>amb IA]
    B --> C[3 · Validació<br>humana]
    C --> D[4 · Publicar<br>QR · Teams · App]
    D --> E[5 · Participació<br>representativa]
    E --> F[6 · Anonimitzar<br>i analitzar]
    F --> G[7 · Visualitzar<br>k ≥ 5]
    G --> H[8 · Recomanar<br>i tancar el cicle]
    H -.-> A
```

1. **Definir la necessitat** — RRHH descriu en llenguatge natural què vol entendre, per a quin col·lectiu i amb quina durada màxima.
2. **Generar la microconsulta amb IA** — un LLM orquestrat amb n8n proposa 3–6 preguntes adaptades en to, llargada i idioma (CA/ES/EN).
3. **Validació humana** — RRHH revisa, edita, reordena o elimina preguntes. **La IA mai publica sense aprovació.**
4. **Publicar** — a l'app, amb **cartell QR imprimible** per a planta i notificació a **Microsoft Teams** (Typeform opcional).
5. **Participació representativa** — experiència mòbil ràpida i un monitor que detecta col·lectius infrarepresentats.
6. **Anonimitzar i analitzar** — eliminació automàtica de **PII**, agrupació per temes, sentiment i senyals febles.
7. **Visualitzar amb privacitat** — resultats sempre agregats, segments bloquejats si **n < 5**.
8. **Recomanar i tancar el cicle** — accions concretes validades per RRHH i consulta de seguiment amb un clic.

## 📸 Captures

### Accés

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/landing.jpg" alt="Portada"><br><sub><b>Portada</b> — tria entre Portal RRHH i App del treballador.</sub></td>
    <td width="50%"><img src="./docs/screenshots/login.jpg" alt="Inici de sessió"><br><sub><b>Inici de sessió</b> — comptes locals amb rols i sessions segures.</sub></td>
  </tr>
</table>

### Portal RRHH

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-home.jpg" alt="Inici"><br><sub><b>Inici</b> — KPI de clima, participació i mapa d'emocions per departament.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-surveys.jpg" alt="Enquestes"><br><sub><b>Enquestes</b> — actives, programades, esborranys i tancades, amb participació en directe.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-analytics.jpg" alt="Anàlisi i insights"><br><sub><b>Anàlisi i insights</b> — mètriques de PostgreSQL, filtres i representativitat.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-directory.jpg" alt="Directori i integracions"><br><sub><b>Directori i integracions</b> — comptes, centres, rols i origen de les dades.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-world.jpg" alt="Damm World 3D"><br><sub><b>Damm World 3D</b> — el clima de cada departament com un edifici viu.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza.jpg" alt="La Plaça 3D"><br><sub><b>La Plaça 3D</b> — temes de la setmana i idees més votades.</sub></td>
  </tr>
</table>

#### Crear una enquesta amb IA (4 passos)

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create.jpg" alt="1 · Objectiu"><br><sub><b>1 · Objectiu</b> — RRHH descriu què vol saber, durada, idioma i departaments.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-2.jpg" alt="2 · Preguntes"><br><sub><b>2 · Preguntes</b> — la IA proposa preguntes; RRHH les edita, regenera o descarta.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-create-3.jpg" alt="3 · Públic i canals"><br><sub><b>3 · Públic i canals</b> — zones amb k-anonimat i canals: QR, app, Teams, correu, Plaça i World.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-create-4.jpg" alt="4 · Revisió i publicació"><br><sub><b>4 · Revisió i publicació</b> — previsualització mòbil i aprovació humana obligatòria.</sub></td>
  </tr>
</table>

#### La Plaça 3D

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-ideas.jpg" alt="Bústia d'idees"><br><sub><b>Bústia d'idees</b> — moderació de RRHH abans de publicar, amb redacció automàtica de PII.</sub></td>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar.jpg" alt="La Barra"><br><sub><b>La Barra</b> — punt de trobada de la plaça.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/hr-plaza-bar-menu.jpg" alt="Carta de cerveses Damm"><br><sub><b>Carta de cerveses Damm</b> — la barra de La Plaça, sempre oberta.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood-prompt.jpg" alt="Estat d'ànim"><br><sub><b>Estat d'ànim</b> — pregunta diària opcional, d'un sol toc.</sub></td>
  </tr>
</table>

<details>
<summary><b>Veure l'anàlisi completa d'un formulari</b></summary>
<br>
<p align="center"><img src="./docs/screenshots/hr-analytics-full.jpg" alt="Analytics" width="720"></p>
</details>

### App del treballador · escriptori

<table>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-home.jpg" alt="Inici"><br><sub><b>Inici</b> — enquestes pendents, punts i com funciona.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — passeja, vota idees amb «+1 Jo també» i respon enquestes.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/screenshots/app-desktop-rewards.jpg" alt="Recompenses"><br><sub><b>Recompenses</b> — bescanvia punts per cafè, snacks o donacions.</sub></td>
    <td width="50%"><img src="./docs/screenshots/app-desktop-mood.jpg" alt="El meu estat d'ànim"><br><sub><b>El meu estat d'ànim</b> — una vegada al dia, sense guardar quina cara has triat.</sub></td>
  </tr>
</table>

### App del treballador · mòbil

<table>
  <tr>
    <td width="25%"><img src="./docs/screenshots/app-home.jpg" alt="Inici"><br><sub><b>Inici</b> — enquestes i punts.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-plaza.jpg" alt="La Plaça"><br><sub><b>La Plaça</b> — idees i vots.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-mood.jpg" alt="Estat d'ànim"><br><sub><b>Estat d'ànim</b> — anònim.</sub></td>
    <td width="25%"><img src="./docs/screenshots/app-rewards.jpg" alt="Recompenses"><br><sub><b>Recompenses</b> — punts per participar.</sub></td>
  </tr>
</table>

## ✨ Funcionalitats

| Portal RRHH | App del treballador |
|---|---|
| Generació de microconsultes amb IA (CA/ES/EN) | Enquestes curtes (< 90 s) des del mòbil o QR |
| Editor amb validació humana obligatòria | La Plaça 3D: idees anònimes i vots |
| Publicació amb cartell QR i Microsoft Teams | Estat d'ànim diari, desvinculat del compte |
| Analítica amb filtres per període, zona, torn i canal | Moneder de punts i recompenses |
| Detector de representativitat («a qui no estem escoltant?») | Interfície trilingüe |
| Damm World 3D i mapa d'emocions | |
| Directori d'usuaris i integracions | |
| Exportació CSV i informe imprimible | |

## 🏗️ Arquitectura

```mermaid
flowchart TB
    subgraph Client
        W[Portal RRHH<br>React · Vite · Tailwind]
        M[App treballador<br>mobile-first · Three.js]
    end
    subgraph Docker Compose
        N[nginx<br>frontend estàtic]
        API[hr-api<br>Node.js · auth · analítica]
        DB[(PostgreSQL 17)]
        N8N[n8n 2.46<br>workflows d'IA]
        R[n8n runners<br>nodes Code aïllats]
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

| Capa | Tecnologia |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Three.js, React Router, i18n propi (CA/ES/EN) |
| **API** | Node.js (`server/`): autenticació amb sessions, analítica, enquestes, Plaça, directori |
| **Dades** | PostgreSQL 17 amb migracions SQL i invariants de privacitat (`supabase/`) |
| **IA i automatització** | n8n amb task runner extern; servidor MCP propi [`mcp-n8n-local`](./mcp-n8n-local) |
| **Integracions** | Microsoft Teams ([`integrations/teams`](./integrations/teams)), Typeform (opcional) |

### Workflows d'n8n

| Workflow | Funció |
|---|---|
| `WF-01` | Disseny adaptatiu de microconsultes amb IA |
| `WF-02` | Publicació (Typeform API), generació de QR i connector de Teams |
| `WF-03` | Ingesta de respostes, sanitització PII multicapa i clustering bilingüe |
| `WF-04` | Motor de k-anonimat, detector de biaixos i recomanador d'accions |

## 🛡️ Privacitat i ús responsable

> La confiança és el que fa que la gent respongui amb sinceritat.

- **Dades 100% sintètiques** — no s'utilitza cap dada real d'empleats de Damm.
- **Agregació estricta (k ≥ 5)** — cap segment amb menys de 5 respostes es mostra, ni al backend ni al dashboard.
- **Redacció automàtica de PII** — noms, correus i telèfons s'emmascaren abans d'analitzar o mostrar comentaris.
- **Identitat separada del contingut** — les respostes, idees i estat d'ànim no porten claus d'usuari ni de sessió. Els punts es guanyen per participar, mai pel que es respon.
- **Humans al comandament** — la IA proposa; RRHH valida i decideix.
- **Sense secrets al codi** — credencials a `.env` (ignorat per Git) i test d'auditoria de filtracions.
- **Entorn endurit** — serveis només a `127.0.0.1`, execucions d'n8n purgades a les 72 h, telemetria desactivada.

## 🚀 Posada en marxa

**Requisits:** Docker (Desktop o Engine amb Compose), Node.js ≥ 20 i Git.

```bash
# 1. Clonar i configurar
git clone <URL_DEL_REPOSITORI> damm && cd damm
cp .env.example .env    # omple N8N_RUNNERS_AUTH_TOKEN, LLM_API_KEY, POSTGRES_PASSWORD…

# 2. Aixecar tota la plataforma
npm run build:mcp       # compila mcp-n8n-local
npm run n8n:up          # n8n, runners, PostgreSQL, hr-api i frontend

# 3. Crear els comptes de demo
node --env-file=.env scripts/auth_accounts.js --demo

# 4. Desplegar els workflows (cal N8N_API_KEY, es crea a n8n → Settings → n8n API)
npm run setup:workflows
```

| Servei | URL |
|---|---|
| Web (Portal RRHH + App) | http://localhost:8080 |
| n8n | http://localhost:5678 |
| PostgreSQL | `localhost:54322` |

> En un volum PostgreSQL buit, Docker aplica les migracions i el seed de demo (`supabase/demo_seed.sql`) amb cinc campanyes sintètiques. Les contrasenyes dels comptes de demo es generen aleatòriament i es desen a `auth-accounts.local` (ignorat per Git).

<details>
<summary><b>Ordres útils</b></summary>

| Acció | Ordre |
|---|---|
| Aturar | `npm run n8n:down` |
| Logs | `npm run n8n:logs` · `npm run frontend:logs` · `npm run postgres:logs` |
| Estat de la BD | `npm run db:status` |
| Aplicar migracions pendents | `npm run db:migrate` |
| Desenvolupament amb hot-reload | `npm --prefix frontend install && npm --prefix frontend run dev` |
| Esborrar-ho tot | `docker compose down -v` |

</details>

### Tests

```bash
npm test                # suite completa (node:test)
npm run test:security   # auditoria de filtració de secrets i PII
npm run test:schemas    # validació dels workflows d'n8n
npm run test:logic      # PII, k-anonimat i filtres anti-biaix
npm run test:e2e        # webhooks reals d'n8n
```

## 📂 Estructura del repositori

```text
├── frontend/          # Portal RRHH i App del treballador (React + Vite + Three.js)
├── server/            # hr-api: autenticació, enquestes, analítica, Plaça, directori
├── supabase/          # Migracions SQL, seeds i tests d'invariants de privacitat
├── mcp-n8n-local/     # Servidor MCP per dissenyar, validar i desplegar workflows
├── integrations/teams # App i targetes per a Microsoft Teams
├── scripts/           # Desplegament de workflows, seeds i smoke tests
├── tests/             # Seguretat, esquemes, lògica, auth, analítica i anonimat
├── docs/              # Requisits, arquitectura de dades i documentació tècnica
└── docker-compose.yml
```

## 📚 Documentació

- [Requisits](./docs/REQUISITOS.md) · [Planificació](./docs/PLANIFICACION.md) · [Arquitectura de dades](./docs/DATA_ARCHITECTURE.md)
- [Autenticació](./docs/AUTH.md) · [Analítica](./docs/ANALYTICS_POSTGRES.md) · [Representativitat](./docs/REPRESENTATION.md)
- [La Plaça](./docs/PLAZA_SCHEMA.md) · [Departaments](./docs/DEPARTMENTS.md) · [Directori](./docs/DIRECTORY.md)

## 🏆 Hackathon

**People Damm va ser el projecte guanyador del Repte Damm a UAB THE HACK! 2026**, on es va desenvolupar com a resposta al repte plantejat per Estrella Damm:

> *Com podem mesurar el clima laboral de manera àgil, contínua i intel·ligent amb IA?*

- [x] Cicle complet: de la necessitat de RRHH a l'acció i la nova consulta.
- [x] Validació humana obligatòria abans de publicar i d'aprovar accions.
- [x] Dades 100% sintètiques.
- [x] Llindar mínim d'agregació (k ≥ 5) i sanitització de PII.
- [x] Cap secret exposat al repositori.

## 👥 Equip

| | |
|---|---|
| **Phoebe Iglesias** | **Carles Peiró** |
| **Jan Peix** | **Joan Marc Samó** |

---

<div align="center">
<sub>Fet amb 🍺 a la UAB · Totes les dades són sintètiques · Projecte no oficial de Damm</sub>
</div>
