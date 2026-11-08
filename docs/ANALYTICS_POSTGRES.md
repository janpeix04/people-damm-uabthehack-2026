# Anàlisi de formularis sobre PostgreSQL

La pantalla `/rrhh/analisi` consumeix `GET /api/hr/analytics`. Ja no importa `ALL_RESPONSES`, el catàleg de formularis de demostració ni el motor de mètriques del frontend.

## Font i filtres

El servidor llegeix `campaigns`, les versions i traduccions de preguntes, `survey_responses`, `response_answers`, els centres/departaments i `audience_assignments`. No requereix cap migració nova. La consulta HTTP s’executa en una transacció de lectura amb snapshot consistent.

Paràmetres: `survey` (slug), `site` (codi), `department` (codi oficial), `shift` (morning/afternoon/night/split/flexible/route), `channel` (mobile_qr/web/teams/email) i `dateRange` (all/7d/30d/90d). Els valors es validen al servidor i els filtres SQL són parametritzats. El catàleg del selector compta totes les respostes guardades de cada campanya al centre seleccionat; el resum aplica també la resta de filtres. Tot l’històric inclou totes les dates de prova desades; els rangs relatius exclouen dates futures.

El públic objectiu compta les invitacions del centre, departament, torn i canal, segons les dades de la persona sintètica associada a la invitació. No es vincula la resposta amb una persona. El rang de dates limita les respostes i no altera aquest denominador. Els canvis històrics d’assignació de centre/departament no es reconstrueixen retrospectivament.

Cada escala s’expressa de 0 a 10 segons els límits de la pregunta. La mitjana general és la mitjana de les puntuacions per resposta; la de pregunta agrega les seves respostes numèriques. Les distribucions mantenen els valors originals. Les versions es mostren separades. No s’inventen NPS, sentiment, benchmarks ni comparatives mensuals. Les mètriques sense prou valors informats són nul·les. El text lliure només aporta el recompte de preguntes contestades; no es retorna el contingut ni una classificació temàtica fictícia.

## Protecció i CSV

Només RRHH pot consultar o exportar. S’aplica `max(10, privacy_threshold)` a la mostra global, a cada pregunta i a les mètriques calculades. Si hi ha alguna cel·la no buida petita, s’oculta tota aquella partició (canal/torn/departament/opcions), sense mostrar una resta deduïble. Un filtre que deixi un complement global no buit inferior al llindar també protegeix la mostra filtrada. La sèrie temporal prova agrupació per dia, setmana i mes i només publica una partició amb mostres suficients. Aquestes mesures no constitueixen un sistema de privacitat diferencial ni un control d’historial de consultes.

`GET /api/hr/analytics.csv` aplica exactament el mateix motor i filtres. Exporta resum i desglossaments publicables, mai files de respostes, identificadors de participants o comentaris individuals. Retorna 403 si la mostra està protegida. Les cel·les s’escapen per CSV i es neutralitzen prefixos de fórmula.

El dashboard té botó Actualitzar, refresca cada 30 segons i quan la finestra recupera el focus. Els canvis de filtre cancel·len peticions anteriors. No es mostren dades antigues com si fossin del filtre nou.

## Validació

- `node --test tests/12_analytics.test.js`: resposta nova, recomptes, escales, distribucions, centres, departaments, torns, canals, dates, invitacions, privacitat i CSV.
- `node --env-file=.env scripts/smoke_analytics.js`: campanya temporal, nou responent per l’API real del treballador, transició 9→10 respostes, dashboard/CSV coincidents, control d’accés i neteja de totes les dades de la prova.
