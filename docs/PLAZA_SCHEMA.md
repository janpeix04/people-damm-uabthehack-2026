# Persistència pendent: taules creades

Migració: `20261108100000_plaza_preferences_reward_operations.sql`.
Aplicada al PostgreSQL local sense reset. Per a volums existents: `npm run db:migrate`.
El script usa `.env`, bloqueja execucions simultànies i consulta `app_private.schema_migrations` abans d'aplicar la migració. Per a volums nous, Docker executa el SQL com a cinquè script d'inicialització. Aquesta migració és atòmica i registra la seva pròpia versió; les dues migracions anteriors no s'han modificat ni reinicialitzat.

| Taula | Dades |
|---|---|
| `public.plaza_categories` | Sis categories inicials de la bústia d'idees. |
| `public.plaza_ideas` | Text amb redacció bàsica de PII, categoria, moderació, dates sense hora i iniciativa relacionada. Sense autor ni moneder. |
| `app_private.plaza_moderation_events` | Historial automàtic dels canvis d'estat, moderador i motiu sanititzat. |
| `app_private.worker_preferences` | Avatar i idioma, vinculats al hash del moneder. Separats del contingut anònim. |
| `public.plaza_daily_questions` | Pregunta del dia, data, estat, aprovació i llindar mínim de mostra de 10. |
| `public.plaza_daily_options` | Opcions ordenades de cada pregunta. |
| `app_private.plaza_daily_votes` | Vots anònims, sense moneder ni marca temporal. |
| `app_private.plaza_daily_receipts` | Control d'una participació per moneder i pregunta, sense opció ni identificador de vot. |
| `app_private.plaza_weekly_participants` | Una participació setmanal per moneder, sense detall d'activitat. |
| `app_private.schema_migrations` | Registre de la nova migració aplicada. |

## Ampliacions de recompenses

- `public.rewards`: `stock_remaining` (NULL = il·limitat), `available_from`, `available_until`, `code_valid_days`.
- `app_private.reward_redemptions`: `status` (`issued`, `consumed`, `expired`), `expires_on`, `consumed_at`, `consumed_by`, `request_id` únic opcional.
- Un trigger reserva estoc amb bloqueig de fila, rebutja catàleg inactiu/fuera de termini i aplica la caducitat del codi. Els registres previs es conserven.
- `consume_reward_code(code, operator)` consumeix un codi una sola vegada amb bloqueig i rebutja codis caducats. Només es concedeix a `service_role`: el backend ha d'autenticar l'operador abans de cridar-la. L'estat `expired` no es calcula amb cap tasca automàtica; la funció comprova la data encara que l'estat continuï sent `issued`.
- `request_id` prepara la clau d'idempotència; el futur endpoint encara ha de retornar el resultat del primer intent en lloc de tornar a inserir.

## Privacitat i abast

Els lectors anònims només veuen idees publicades, categories actives i preguntes publicades/tancades. La resta requereix backend autoritzat; no es concedeix lectura pública de vots, moneders ni preferències. La redacció de PII reutilitza la funció SQL bàsica existent (correu, telèfon i identificadors); no equival a anonimització semàntica de noms o detalls del relat.

Encara falta connectar els endpoints/workflows i la UI. En particular, el backend ha d'inserir rebut i vot en una transacció, validar que la pregunta està oberta i retornar només agregats amb mostra >= `min_sample_size`. Les taules per si soles no implementen aquests endpoints ni un dashboard. La participació setmanal també s'ha de registrar a la mateixa transacció de l'activitat corresponent.

No es dupliquen les taules existents d'iniciatives, anàlisi IA o integracions. Les respostes d'enquesta continuen sense cap FK cap a moneders o persones.

Proves: `node --test tests/06_plaza_schema.test.js`. Verificades també moderació, redacció i RLS al PostgreSQL del contenidor, amb rollback de les dades de prova.
