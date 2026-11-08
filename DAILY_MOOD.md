# Estat d’ànim: resposta separada del compte, sense edició

El treballador pot indicar com se sent una vegada al dia d’Europe/Madrid. La resposta és voluntària, no dona punts i no es pot recuperar ni editar des del compte. La pantalla permet triar la careta i confirmar abans d’enviar; després només mostra el comprovant de participació. El popup automàtic manté les cinc caretes i «Ara no».

## Separació de dades

- `public.daily_moods`: UUID aleatori, dia, centre, departament i careta. Sense usuari, moneder ni hora exacta.
- `app_private.daily_mood_receipts`: només usuari i dia, per evitar respostes duplicades. Sense identificador de resposta, careta ni departament triat.
- `POST /api/app/mood-state`: dia, departament assignat i si el compte ja ha participat. No retorna la resposta ni la careta.
- `POST /api/app/mood`: accepta una resposta nova; un reintent no afegeix ni modifica res. Les peticions d’edició es rebutgen.

La migració `20261108250000_unlink_daily_mood` elimina el vincle tècnic `mood_id`, inclosos els vincles existents, preservant les respostes i els comprovants. Les migracions històriques d’edició es mantenen per reproduir l’esquema i acaben amb aquesta migració de separació.

Centre i departament es resolen al servidor. Abans de respondre, la persona pot seleccionar Altres en lloc del departament assignat. Aquesta elecció només es guarda a la resposta; no al comprovant. Les dades de centre/dia/departament són quasiidentificadors: eliminar el vincle directe no és una garantia d’anonimat absolut davant inferències o accés privilegiat. La consulta de RRHH només mostra agregats amb el llindar mínim, mai la careta d’un compte.

## Damm World

La vista corporativa resumeix avui; un centre mostra els darrers set dies. Sense vincular respostes i comptes, no s’inventa un recompte de persones diferents al llarg de la setmana: per publicar la nota s’exigeix una cohort d’almenys deu respostes en un mateix dia, atès que el servidor permet una resposta per compte/dia. No se sumen participants diaris per superar aquest llindar.

## Freqüència

L’estat d’ànim comparteix el límit d’un avís automàtic al dia amb els recordatoris de consultes. A «Estat d’ànim → Avisos i freqüència» es pot triar freqüència diària, setmanal o sense popup, i pausar els avisos. La participació manual continua disponible. Els avisos són dins la web: no s’han configurat push, Teams ni horaris de torn.

## Validació

`tests/11_daily_mood.test.js` verifica duplicats, agregació i bloqueig d’edició; `tests/14_mood_anonymity.test.js` verifica que s’elimina el vincle existent, que el comprovant només conserva usuari/dia i que una petició repetida no modifica ni duplica la resposta.
