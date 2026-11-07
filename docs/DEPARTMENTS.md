# Departaments oficials de l'aplicació

Només hi ha quatre departaments:

| Codi de BD | Nom | Col·lectiu intern compatible |
|---|---|---|
| `fabrica` | Fàbrica | `fabriques` |
| `logistica` | Logística | `logistica` |
| `comercial` | Comercial | `comercial` |
| `oficina` | Oficina | `oficines` |

La migració `20261108140000_four_departments.sql` consolida les subdivisions anteriors segons el seu col·lectiu. Trasllada totes les claus foranes, incloent persones, perfils, respostes, segments, insights i iniciatives. Conserva persones, comptes, centres, assignacions, respostes i recompenses. No reinicialitza el seed.

L'àrea anterior de cada persona queda a `synthetic_people.work_area_code`. No és un cinquè departament. Les zones de l'escena (Envasat, Malta, Manteniment, etc.) continuen sent zones visuals. En publicar una enquesta, qualsevol zona de fàbrica selecciona el departament Fàbrica, sense duplicar destinataris.

Els segments analítics històrics es conserven i incorporen `legacy_department_id` a `segment_key` per evitar col·lisions o pèrdua d'informació. No s'han sumat mitjanes ni reinterpretat mostres històriques com a resultats nous. Els rols RRHH/manager continuen sent rols d'accés o llocs de treball, no departaments.

La web de creació i les plantilles locals de generació IA ofereixen només els quatre noms. Les plantilles de n8n s'han actualitzat al repositori, sense desplegar ni activar workflows externs. Les dades de demostració del directori mantenen l'àrea antiga com `workArea` i mostren els quatre noms a `orgDepartment`.

Per a una BD existent: `npm run db:migrate`. Per a volums Docker nous, s'executa com a novè SQL d'inicialització, després del seed i les migracions d'autenticació. Les migracions i el seed originals es mantenen com a historial; el resultat final és sempre els quatre departaments.

Prova: `node --test tests/09_departments.test.js` verifica recompte de departaments, integritat i conservació de files, públic d'una campanya i impossibilitat de crear departaments addicionals.
