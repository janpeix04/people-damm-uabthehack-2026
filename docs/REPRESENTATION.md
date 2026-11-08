# Representativitat i freqüència d’escolta

## Detector de cobertura

La pantalla d’anàlisi inclou «A qui no estem escoltant?». `GET /api/hr/representation?survey=slug&site=code` utilitza les invitacions de `audience_assignments`, la seva participació registrada i el directori sintètic per comparar públic i participants. No consulta el contingut de les respostes ni mostra identitats. Compta persones úniques, no comentaris ni preguntes contestades.

La cobertura és de tota la campanya i del centre seleccionat; no canvia amb els filtres temporals, de pregunta o canal del dashboard. Les dades de població són les assignacions actuals del directori, no una reconstrucció històrica. Els recomptes poden diferir del volum de respostes anònimes importades si aquestes es van carregar sense actualitzar l’estat de les invitacions; no s’inventen vincles per reconciliar-los.

Es mostren taules per departament i torn. Una cobertura inferior al 70% de la mitjana del públic de la campanya és un senyal heurístic de menor cobertura, no una prova de representativitat estadística ni de causalitat. S’indica mostra insuficient quan no arriba al llindar, i s’ofereixen actuacions: QR o tauleta accessible, revisar el canal, donar temps sense pressió o ampliar la finestra perquè cobreixi el torn de nit.

Llindar: `max(10, campaign.privacy_threshold)`. Els grups amb menys població queden sense etiqueta identificativa ni recomptes. Si una cel·la té participants o no participants positius per sota del llindar, els recomptes de participants de tota aquella partició s’oculten per evitar deduir-los per diferència. Un complement petit de participants fora del centre seleccionat també protegeix els recomptes del centre. No hi ha llistes de persones que han contestat o que falten.

## Recordatoris dins la web

Un administrador RRHH pot activar `POST /api/hr/reminders` sobre un grup ampli amb alerta. Es desa un lot privat per consulta, centre i departament o torn. No s’envien missatges externs. No s’exposa cap llista de destinataris ni s’utilitza el contingut de les opinions per seleccionar-los. El compte analista no pot activar-los.

En obrir o recuperar el focus de l’app, `POST /api/app/listening` amb `action: prompt` reclama com a màxim un avís automàtic al dia local (Europe/Madrid), compartit amb el popup d’estat d’ànim. El límit és al servidor, amb bloqueig transaccional i unicitat per compte/dia, també entre pestanyes o dispositius.

Només reben recordatori els comptes amb una invitació pendent, consulta oberta, preferència activada i sense pausa. S’exigeixen 48 hores entre avisos i un màxim de dos recordatoris per consulta, utilitzant `reminder_count` i `last_reminder_at` existents. Un mateix lot només es mostra una vegada al compte. L’activació repetida de lots per al mateix grup té també 48 hores de separació i un límit de dos. La persona pot obrir la consulta o triar «Ara no»; cap resposta és obligatòria. Les persones que ja han respost s’exclouen.

## Preferències del treballador

A «Estat d’ànim → Avisos i freqüència» es pot triar estat d’ànim diari, cada set dies o sense popup automàtic, activar/desactivar recordatoris de consultes i pausar tots els avisos set dies. Les preferències es guarden a PostgreSQL. La participació manual i l’edició de l’estat d’ànim continuen disponibles. Els horaris de torn no estan configurats: aquests avisos funcionen dins la web i no són push, correus ni Teams.

Les taules privades de preferències i freqüència no emmagatzemen el contingut de cap resposta ni s’exposen al directori de RRHH. La migració és `20261108230000_listening_frequency`. No s’ha configurat encara una tasca de caducitat d’aquests registres.

## Validació

`node --test tests/13_representation_listening.test.js` cobreix població, participació, alertes, privacitat, límits, preferències i absència d’avisos després de respondre. `node --env-file=.env scripts/smoke_analytics.js` comprova també els endpoints reals, el recordatori dins la web i els permisos.
