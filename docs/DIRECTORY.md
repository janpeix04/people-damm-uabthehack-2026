# Directori i integracions

Pantalla: `/rrhh/directori`. L'antiga ruta `/rrhh/teams` redirigeix aquí. El menú lateral utilitza el nou nom.

## Usuaris

`GET /api/hr/directory` requereix sessió RRHH. Llista els comptes de `auth.users` amb perfil i credencials locals o amb un vincle d'importació registrat a `app_private.directory_links`. Les 727 persones de `synthetic_people` no es presenten com si fossin comptes d'accés provisionats.

Es mostren nom, correu, departament oficial, centre, rol, estat d'accés i origen. El centre/departament del treballador es resol des de la seva persona assignada; RRHH utilitza el perfil. Les contrasenyes, els seus hashes, els moneders i els tokens de sessió no s'envien a la pantalla. Cerca i filtres per origen, estat i departament; paginació de 20 files.

L'origen Microsoft 365 només es mostra si existeix un vincle d'importació persistit al servidor. No s'infereix d'un domini de correu ni de metadades editables. Un usuari importat sense credencials locals apareix com a accés pendent: no s'ha implementat SSO en aquest canvi.

## Integracions

La pantalla llegeix la configuració de `integration_connections` per al proveïdor `microsoft_graph` i les execucions de `app_private.directory_sync_runs`. Mostra el darrer intent, la darrera sincronització completada, els recomptes i els errors registrats. No exposa configuració sensible, secrets ni errors tècnics en brut.

Sense configuració o amb una connexió de demo mostra «Microsoft 365 no connectat». Una connexió marcada com a connectada sense una execució correcta queda pendent de verificar. La resta reflecteix l'estat emmagatzemat, no una comprovació de xarxa en temps real.

S'han eliminat el temporitzador de sincronització simulada, les identitats fictíciament importades i els detalls del paquet ZIP de la pantalla principal. No s'ofereix un botó de sincronització que encara no pugui executar-la.

La importació Microsoft Graph, l'autorització corporativa, SSO i l'enviament Teams continuen pendents de configuració/implementació. No s'ha consultat cap tenant ni enviat cap invitació durant aquest canvi. La creació local de comptes continua sent una operació d'administració via el provisionador descrit a `AUTH.md`.

## Migració i proves

`npm run db:migrate` aplica `20261108150000_directory_integrations.sql` sense reinicialitzar dades. Afegeix els vincles d'identitat externa i un historial de sincronitzacions, tots dos privats i separats del contingut de les respostes.

`node --test tests/10_directory.test.js` valida comptes reals, origen, estats, exclusió de secrets i restriccions SQL. `node --env-file=.env scripts/smoke_auth.js` comprova l'endpoint HTTP amb accés RRHH i denegació a treballadors.
