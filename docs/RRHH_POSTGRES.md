# Enquestes RRHH sobre PostgreSQL

Arrencada: `docker compose up -d --build`. Obre http://localhost:8080/#/rrhh/enquestes.

La llista RRHH consulta PostgreSQL, sense recuperar enquestes antigues de localStorage. Permet crear amb IA o preguntes de plantilla, desar i editar esborranys, duplicar, aprovar/publicar, programar, obrir ara i tancar. Les operacions mostren èxit només després del commit; els errors no es converteixen en canvis locals.

El servei intern `hr-api` serveix `/api/hr/surveys` a través de nginx. No publica cap port al host. Per desenvolupament amb Vite, executa l'API amb `PORT=3001`, `POSTGRES_HOST=127.0.0.1`, `POSTGRES_PORT=54322` i les credencials locals; el proxy de Vite ja està configurat. El servidor no carrega `.env` automàticament: pots fer servir `node --env-file=.env server/index.js` i sobreescriure host/port a l'entorn.

## Persistència

S'utilitzen `campaigns`, `questionnaire_versions`, `questionnaire_translations`, `questions`, `question_translations`, `audience_assignments` i `audit_events`. No cal crear taules ni reinicialitzar el volum.

Les zones es tradueixen als codis de departament del seed; logística, comercial i oficines inclouen els departaments relacionats. El nombre de destinataris es calcula amb les assignacions SQL. Zones, canals i idioma de l'editor es guarden a `campaigns.target_filter.hr`. Les preguntes i respostes continuen normalitzades a les taules existents.

Crear o editar és una transacció única. Editar conserva la campanya i substitueix el contingut de l'esborrany; les enquestes publicades no es poden editar. Duplicar crea una campanya i preguntes noves, sense heretar respostes ni aprovacions. Publicar requereix `approved_by_human: true`. Les escales de cares es desen com 1–5, les escales numèriques conserven límits i «Sí / No / No ho sé» es conserva com a selecció única. Límit de 3–12 preguntes, coherent amb la funció SQL d'enviament existent.

## Proves

`node --test tests/05_hr_surveys.test.js` comprova persistència relacional, aprovació, validacions, duplicació, edició, programació i tancament amb l'esquema i seed reals en PGlite temporal. La compilació i una prova HTTP pel proxy Docker comproven la integració amb PostgreSQL real.

## Abast local i pendents

L'API requereix ara sessió i comprova el rol RRHH al servidor. L'aprovador de les operacions de la web és l'usuari autenticat. Vegeu [AUTH.md](AUTH.md). Abans d'exposar-la a la xarxa cal configurar HTTPS/cookies Secure i protegir els ports de gestió; l'autenticació implementada és local i no és SSO.

La generació amb IA continua usant WF-01; publicar a PostgreSQL no depèn de Typeform ni envia missatges externs. Ara el moneder, l'enviament i els bescanvis del treballador usen `/api/app/*` amb les funcions SQL existents, sense requerir WF-05. n8n queda per als processos d'IA, notificacions i altres automatitzacions.
