# Accés local amb comptes i sessions

Accés: http://localhost:8080/#/login.

Hi ha dos comptes locals preparats:

- `rrhh.admin@demo.damm.invalid`: administració de RRHH.
- `treballador@demo.damm.invalid`: treballador amb moneder i persona sintètica assignats.

Les contrasenyes són aleatòries i estan al fitxer local `auth-accounts.local`, ignorat per Git. No estan al codi, a les imatges Docker ni als fitxers de seed. `node --env-file=.env scripts/auth_accounts.js --demo` crea els comptes que falten sense substituir contrasenyes existents.

## Què està implementat

- Correu i contrasenya, sense registre públic ni possibilitat de triar un rol des del navegador.
- Hash de contrasenya amb scrypt i sal aleatòria.
- Sessions de 8 hores amb token aleatori de 256 bits; PostgreSQL només desa el hash del token. Cookie HttpOnly, SameSite=Strict; Secure quan `AUTH_COOKIE_SECURE=true`.
- Restauració de sessió en recarregar i sortida que revoca la sessió al servidor. Quan l'API respon 401, la web torna a demanar accés.
- Autorització a cada petició, consultant el rol i l'estat actiu actual de `user_profiles`. `worker` només accedeix a l'app; `hr_admin` gestiona RRHH; `hr_analyst` consulta i no modifica.
- Límit d'intents d'accés de 15 minuts per correu i origen de xarxa. La fallada mostra el mateix missatge per correus inexistents, contrasenyes errònies o comptes inactius.
- Mutacions amb comprovació d'origen i capçalera no simple `X-App-Request`. No es permet CORS ni accés anònim a l'API de dades.
- Les automatitzacions de la web passen per `/api/hr/automation/*` amb autorització. El proxy públic `/webhook/` queda tancat; no es modifiquen ni despleguen workflows de n8n.

## Identitat i anonimat

`auth.users` i `user_profiles` continuen sent les taules d'identitat i rols. La migració afegeix el rol `worker` i les taules privades `auth_credentials`, `auth_sessions`, `login_attempts` i `worker_accounts`.

El compte del treballador es vincula a una persona sintètica i a un moneder estable al servidor. L'API ignora qualsevol moneder enviat pel navegador. Dues sessions del mateix compte recuperen punts i avatar del mateix moneder. Els moneders anònims antics no es reclamen automàticament, perquè això permetria apropiar-se de dades d'un altre dispositiu.

El login i la restauració de sessió retornen també el centre assignat (`site`: id, codi, nom i ubicació). Per al treballador es deriva exclusivament de `worker_accounts → synthetic_people → sites`. Per a RRHH s'utilitza `user_profiles.home_site_id`; si és NULL es mostra «Àmbit corporatiu». El centre es mostra automàticament a la capçalera i a La Plaça, en un selector de només lectura. La Plaça continua tenint dades conjuntes de tots els centres i ho indica explícitament: no s'aplica un filtre visual que no existeixi al backend.

Per crear un compte en un centre concret es pot indicar `AUTH_SITE_CODE` al provisionador. En un treballador, es tria una persona sintètica disponible d'aquell centre; en RRHH, es desa el centre al perfil. No s'assigna un centre fictici als comptes corporatius existents.

No s'afegeixen claus d'usuari, sessió o moneder a `survey_responses`, al text de les idees o al contingut dels vots. La participació i els punts es gestionen separadament del contingut. Els canvis de gestió RRHH es registren amb l'usuari autenticat.

## Crear un altre compte

Executa `node --env-file=.env scripts/auth_accounts.js` amb `AUTH_EMAIL`, `AUTH_ROLE` (`worker`, `hr_admin` o `hr_analyst`) i, opcionalment, `AUTH_NAME` i `AUTH_PASSWORD` a l'entorn. Si no s'indica contrasenya, se'n genera una. No passis contrasenyes com a arguments de la línia d'ordres. Les contrasenyes han de tenir entre 12 i 128 caràcters. La creació de treballadors utilitza persones sintètiques disponibles i no reclama moneders antics.

Arrencada: `npm run db:migrate` i `docker compose up -d --build hr-api frontend`. No reinicialitzar els volums.

## Proves i límits

`node --test tests/08_auth.test.js`: hash, login, sessió, revocació, caducitat, canvi de rol, compte inactiu, moneder estable i límit d'intents.

`node --env-file=.env scripts/smoke_auth.js`: proves HTTP reals d'accés anònim denegat, CSRF, restauració, permisos, moneder manipulat, logout i caducitat. Crea i elimina els seus comptes temporals.

Això és autenticació local, no Microsoft Entra/Teams SSO ni Supabase Auth. Encara no inclou recuperació de contrasenya per correu, MFA o una pantalla de gestió de comptes. Per exposar el sistema cal HTTPS i `AUTH_COOKIE_SECURE=true`, i protegir separadament els ports de gestió de n8n/PostgreSQL. No s'han enviat missatges ni fet crides de prova a automatitzacions externes.
