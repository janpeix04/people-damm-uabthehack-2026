# Opinions reals de La Plaça

La bústia desa opinions a `plaza_ideas`, pendents de moderació. Només les publicades apareixen a l’inici del treballador, la finestra Temes i les bafarades. L’escena mostra les cinc últimes; Temes mostra tota la llista publicada. Sense contingut publicat no hi ha bafarades de demostració.

Cada +1 queda a `app_private.plaza_idea_reactions`, vinculat a l’UUID estable de l’opinió i al hash privat del moneder del compte autenticat. La clau única impedeix duplicats. Retirar el +1 elimina la reacció; el total és un recompte SQL real. L’API només exposa el total i si el compte actual ja hi ha reaccionat. No retorna identitats ni hashes. No s’atorguen punts.

Les reaccions antigues a posicions de demostració no es traslladen a opinions reals. Els recomptes actuals no depenen de la setmana ni de la posició de la bafarada. Les dades es refresquen cada 30 segons i després de cada reacció; els focs només es disparen després d’un +1 desat correctament. Els textos d’opinions s’insereixen com a text, mai HTML.

Validació: `node --test tests/07_app_persistence.test.js` i `node --env-file=.env scripts/smoke_app.js`.
