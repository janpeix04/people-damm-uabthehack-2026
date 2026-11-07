# Revisió local — 7 de novembre de 2026

## Estat verificat

- Docker Desktop iniciat; quatre serveis en marxa: frontend, n8n, runners i PostgreSQL 17.
- Frontend: http://localhost:8080 (HTTP 200).
- n8n: http://localhost:5678 (healthz HTTP 200).
- PostgreSQL: 127.0.0.1:54322, base `damm_pulse`; credencials al `.env` local ignorat per Git.
- BD inicialitzada amb les dues migracions: 14 centres, 727 persones sintètiques, 3 campanyes i 6 recompenses.
- n8n sense workflows: exportació CLI confirma que no en troba cap. `/webhook/app/wallet` retorna 404.
- No s'han configurat claus externes ni un compte propietari/API key de n8n.

## Proves executades

- Build del frontend dins Docker: correcte.
- 7 proves unitàries de lògica: correctes. Proven funcions reproduïdes als tests, no els workflows desplegats.
- 3 proves estàtiques de secrets, gitignore i plantilles: correctes.
- Esquema, seed, invariants i migració del moneder: correctes en PGlite temporal.
- Invariants SQL: correctes també al PostgreSQL del contenidor.
- PostgreSQL real: obrir moneder, respondre (+50 punts), rebutjar duplicat i bescanviar cafè (-50): correcte.
- Error confirmat: enviar només una resposta tot i haver-hi diverses preguntes obligatòries és acceptat i atorga punts.
- Les proves finals es desfan amb ROLLBACK. Una primera prova va deixar un moneder i una resposta sintètica: el fitxer d'invariants tanca la seva pròpia transacció i va finalitzar la transacció exterior abans de la prova. No s'ha reinicialitzat el volum.
- No s'ha executat la suite E2E completa: activa workflows i publica formularis externs; actualment no hi ha workflows ni credencials.

## Connexions pendents, per prioritat

1. **n8n local**: completar el compte inicial i configurar `N8N_API_KEY`; compilar el client MCP ja està fet. El servidor MCP n8n no està disponible entre les eines d'aquesta sessió.
2. **WF-05 → PostgreSQL**: validar i desplegar el workflow del moneder, respostes i recompenses, amb credencial Postgres host `postgres`, port 5432. `setup_local.js` només desplega WF-01..04: WF-05 queda fora. Revisar també la compatibilitat de `GET /credentials` al script de desplegament amb l'API instal·lada.
3. **App → WF-05**: nginx ja configura el proxy `/webhook/`; manca el workflow receptor. Evitar que la caiguda del backend passi silenciosament a recompenses i respostes locals de demostració.
4. **RRHH → BD**: `addSurvey` i `setSurveyStatus` només modifiquen localStorage. Persistir campanyes, versions, preguntes, traduccions, aprovacions i assignacions a les taules existents.
5. **Ingesta i analítica → BD**: connectar WF-03 a respostes sanititzades i WF-04 a agregats SQL; desar execucions, segments, insights i recomanacions. Els scripts base no tenen nodes Postgres en aquests fluxos; WF-04 genera dades de referència.
6. **Dashboard RRHH → analítica persistent**: `pages/hr/Analisi.tsx` importa HEAT, TOPICS i AI_SUMMARIES de mocks.
7. **IA, Typeform i Teams**: configurar claus reals segons els canals que es vulguin provar. La configuració generada només conté secrets interns locals. No s'ha publicat ni enviat res a serveis externs.
8. **Identitat i permisos**: substituir l'assignació aleatòria a persones sintètiques per una integració d'identitat per a ús real. El schema `auth` local és una compatibilitat SQL, no un servei d'autenticació. Fer servir un usuari SQL limitat per a n8n en lloc del superusuari.

## BD i contractes que cal completar

- **Urgent: validació SQL de respostes**. Exigir preguntes obligatòries i comprovar pertinença a la versió/campanya, tipus, rang, opcions i duplicats. Reexecutar proves negatives abans d'usar punts reals.
- **Urgent: unificar anonimat a k >= 10**. La BD ho exigeix, però WF-04 i els tests/documentació antics encara fan servir 5.
- **La Plaça**: afegir persistència d'idees, categories, moderació i estats; ara `addIdea` publica localment amb un temporitzador. Separar identitat i contingut anònim.
- **Avatar**: persistir preferències si s'han de conservar entre dispositius. Ara són locals.
- **Iniciatives**: reutilitzar `action_recommendations` i `action_executions` per a estat, responsable, aprovació i seguiment. Ara els canvis del context són locals.
- **Recompenses**: ja hi ha catàleg i bescanvis; per a ús operatiu cal definir disponibilitat/estoc, caducitat, validació i consum del codi, i idempotència davant reintents.
- **Migracions**: afegir historial i un procés incremental; els SQL de `/docker-entrypoint-initdb.d` només s'executen en crear un volum buit. No fer servir `down -v` per actualitzar una BD amb dades.
- **Scripts de BD**: `db:init`/`db:status` usen PGlite a `.pgdata`, no el PostgreSQL Docker, i el script no aplica la migració del moneder. Separar clarament els dos entorns i afegir verificació del PostgreSQL real.
- **Documentació**: `DATA_ARCHITECTURE.md` descriu taules que no coincideixen amb la migració actual; actualitzar-la segons l'esquema real.

## Ordre de treball recomanat

Corregir validació SQL i llindar d'anonimat; completar n8n i WF-05; provar el recorregut navegador → nginx → n8n → PostgreSQL; connectar creació RRHH i analítica; després persistir La Plaça i completar recompenses operatives.

No s'ha modificat `frontend/src/three/engine.js`, que ja tenia canvis locals en començar aquesta revisió.
