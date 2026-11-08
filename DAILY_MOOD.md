# Estat d’ànim diari

Adaptació selectiva de `feat/daily-checkin-worker-yellow` a `NewNew`: tema groc als espais del treballador, caretes SVG sense comentari, transicions de modals/preguntes/controls i accés permanent «Editar estat d’ànim» a la capçalera del treballador. La tria d’una cara desa immediatament.

Amb la migració `20261108220000_edit_daily_mood`, el comprovant privat conserva una referència a la resposta per permetre modificar-la. Aquesta referència no s’exposa a RRHH; l’API del treballador només retorna la seva cara actual i si és editable. L’edició substitueix la resposta del dia i no suma participació. Les respostes antigues no es vinculen retrospectivament i no són editables. La taula pública de respostes continua sense nom, usuari, moneder ni hora exacta; el comprovant privat sí permet relacionar la resposta amb el compte per donar suport a l’edició.

Els treballadors veuen «Com et sents avui?» en entrar a l’app. Cinc caretes, resposta voluntària, una vegada per dia d’Europe/Madrid. «Ara no» tanca l’avís durant la sessió del navegador; la franja permet tornar-lo a obrir. Es comprova el canvi de dia amb la web oberta i en recuperar el focus.

El centre i el departament provenen del compte al servidor. La persona pot seleccionar «Prefereixo no especificar el departament» per agregar la resposta a Altres, sense canviar l’assignació del compte. No s’atorguen punts ni recompenses.

`POST /api/app/mood-state` consulta si s’ha respost avui; `POST /api/app/mood` rep `day`, `mood` (1–5) i `unspecified` (booleà). Només comptes de treballador autenticats, amb les proteccions CSRF existents. La transacció insereix un comprovant únic per usuari/dia i una resposta separada sense usuari, moneder ni hora exacta. Un duplicat no afegeix cap resposta.

Damm World i el mapa d’emocions consumeixen el resum de les respostes d’avui, filtrable per centre. No es barregen amb les enquestes anteriors. La mitjana transforma les caretes 1–5 a escala 0–10; els colors existents indiquen el resultat agregat. Amb menys de 10 respostes per departament i centre consultat, la nota i l’emoció queden ocultes. Cada dia comença sense resultats.

L’avís funciona dins la web. No hi ha push amb el navegador tancat, integració amb Teams ni planificació segons torns: falten els horaris de feina i la configuració del canal de notificacions.

Validació: `node --test tests/09_departments.test.js tests/11_daily_mood.test.js`.
