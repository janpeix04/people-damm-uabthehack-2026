# Connexió web–PostgreSQL

L'app utilitza `/api/app/*` via nginx i el servei intern `hr-api`. Les operacions de persistència són directes; n8n es reserva per a IA i automatitzacions. Cap credencial SQL es passa al navegador.

## Funcionalitats connectades

- Avatar: lectura i desament a `app_private.worker_preferences`, identificat pel hash del moneder. Reobrir l'editor carrega l'avatar del servidor.
- Idees: inserció anònima a `plaza_ideas`, sanitització SQL bàsica i estat pendent. S'ha retirat la publicació simulada amb temporitzadors. RRHH les llegeix i les publica/rebutja via `/api/hr/plaza`. Els treballadors només reben les publicades.
- Pregunta del dia: RRHH pot publicar-la amb aprovació des de «Gestionar pregunta del dia». No es publica cap pregunta de demostració automàticament. Rebut i vot s'insereixen en una sola transacció; repetir la petició no duplica el vot. El servidor no retorna l'opció personal després de votar; retorna únicament que ja s'ha respost.
- Resultats diaris: el servidor només retorna distribucions amb mostra >=10. Els comptadors de les opcions públiques són zero fins que hi ha resultats agregats autoritzats.
- Participació setmanal: SQL compta una sola vegada per moneder i setmana, amb setmana i data en Europe/Madrid. Reaccions i preferències dels sis temes fixos queden en una taula privada; les etiquetes dels temes de demostració encara no són anàlisi IA.
- Moneder, enquestes pendents, enviament, punts i bescanvis: `/api/app/wallet`, `/submit` i `/redeem` criden les funcions SQL existents. El servidor valida obligatorietat, pertinença, escala i opcions abans d'enviar. S'ha retirat el desament local alternatiu d'enviaments i bescanvis.

La Plaça es refresca cada 30 segons i després de cada mutació. Les accions mostren l'èxit després del commit. L'accés requereix la sessió i els permisos descrits a [AUTH.md](AUTH.md). El moneder es resol al servidor a partir del compte; el navegador no pot seleccionar-ne un altre. Les persones continuen sent sintètiques i l'autenticació local no és SSO.

## Arrencada i proves

1. `npm run db:migrate`
2. `docker compose up -d --build hr-api frontend`
3. Obre http://localhost:8080/#/app/placa i http://localhost:8080/#/rrhh/placa.

Tests aïllats: `node --test tests/05_hr_surveys.test.js tests/06_plaza_schema.test.js tests/07_app_persistence.test.js`.

Prova HTTP real: `node --env-file=.env scripts/smoke_app.js`. Crea contingut temporal identificable i l'elimina amb el moneder de prova. Si ja hi ha pregunta publicada, conserva aquesta pregunta i deixa la prova de vot a la suite aïllada.

Les iniciatives i l'analítica/escenes amb dades de demostració no s'han convertit en processos d'IA ni en dades analítiques reals amb aquest canvi.
