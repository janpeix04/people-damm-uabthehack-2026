# Arquitectura de Dades i Privacitat — Damm People Listening Platform

Aquest document descriu el model de dades relacional a **PostgreSQL / Supabase**, els mecanismes de privacitat per disseny (*Privacy-by-Design*), el directori sintètic de 727 persones distribuïdes en els **14 sites oficials de Damm** i **13 departaments** (incloent RRHH i Data & IA), i el contracte d'intercanvi amb el motor d'automatització i IA (**n8n**).

---

## 1. Visió General i Stack de Persistència

La plataforma separa estrictament:
1. **Capa d'Identitat Operativa i Governança** (`user_profiles`, `sites`, `departments`, `synthetic_people`, `campaigns`, `questionnaires`, `questions`) — gestionada per **People / RRHH**.
2. **Capa de Captura Anonimitzada** (`survey_responses`, `response_scale_answers`, `response_open_answers`) — sense cap vincle nominal (`user_id`, correu electrònic, IP o identificador d'empleat) i amb redacció automàtica de PII abans d'escriure a disc.
3. **Capa Analítica i d'Insights IA** (`analysis_runs`, `analysis_segments`, `insights`, `action_recommendations`) — alimentada pel pipeline de **n8n** i governada per la regla dura de **$k$-anonimat ($k \ge 10$)**.

---

## 2. Centres / Sites Oficials de Damm (`public.sites`)

La taula `public.sites` conté els **14 centres oficials** de Damm amb la seva ubicació, tipologia i col·lectiu principal:

| `#` | `code` | `name` | `location` | `type_ca` | `default_collective` |
|---|---|---|---|---|---|
| 1 | `seu-central-bcn` | Seu central Damm | Barcelona | Oficines corporatives | `oficines` |
| 2 | `ccd-el-prat` | Compañía Cervecera Damm | El Prat de Llobregat | Fàbrica de cervesa | `fabriques` |
| 3 | `estrella-levante-murcia` | Estrella de Levante | Espinardo, Múrcia | Fàbrica de cervesa | `fabriques` |
| 4 | `cervezas-victoria-malaga` | Cervezas Victoria | Màlaga | Fàbrica de cervesa | `fabriques` |
| 5 | `font-salem-el-puig` | Font Salem (El Puig) | El Puig, València | Fàbrica de begudes | `fabriques` |
| 6 | `font-salem-salem` | Font Salem (Salem) | Salem, València | Fàbrica de begudes | `fabriques` |
| 7 | `font-salem-santarem` | Font Salem (Santarém) | Santarém, Portugal | Fàbrica de begudes | `fabriques` |
| 8 | `la-moravia-lleida` | La Moravia | Bell-lloc d'Urgell, Lleida | Malteria | `fabriques` |
| 9 | `cacaolat-santa-coloma` | Cacaolat | Santa Coloma de Gramenet | Fàbrica de begudes làcties | `fabriques` |
| 10 | `cafes-garriga-barbera` | Cafès Garriga | Barberà del Vallès | Centre de cafè | `fabriques` |
| 11 | `veri-osca` | Aguas de San Martín de Veri | Osca | Planta d'aigua | `fabriques` |
| 12 | `fuente-liviana-conca` | Fuente Liviana | Conca | Planta d'aigua | `fabriques` |
| 13 | `zal-barcelona` | Centre logístic Damm Barcelona (ZAL) | Barcelona (ZAL) | Logística | `logistica` |
| 14 | `logistic-murcia` | Centre logístic Damm Múrcia | Múrcia | Logística | `logistica` |

---

## 3. Col·lectius i Departaments (`public.departments`)

Els departaments s'agrupen en els **4 grans col·lectius** operatius (`fabriques`, `logistica`, `comercial`, `oficines`):

| `code` | `collective` | `name_ca` | `location` | `target_headcount` |
|---|---|---|---|---|
| `fab_el_prat` | `fabriques` | Producció i Envasat — Fàbrica | El Prat de Llobregat | 190 |
| `fab_manteniment` | `fabriques` | Manteniment Industrial i Qualitat | El Prat / Múrcia / Màlaga | 75 |
| `fab_begudes_aigua` | `fabriques` | Plantes de Begudes, Aigua, Malteria i Làctics | València / Portugal / Lleida / Osca / Conca / Sta. Coloma / Barberà | 105 |
| `log_zal` | `logistica` | Logística i Magatzem ZAL | ZAL Prat / Barcelona | 95 |
| `log_dist` | `logistica` | Distribució Capil·lar i Rutes | Catalunya i Llevant | 60 |
| `log_murcia` | `logistica` | Plataforma Logística Sud-Est | Múrcia | 35 |
| `com_horeca` | `comercial` | Comercial HORECA | Catalunya, Llevant i Sud | 80 |
| `com_alimentacio` | `comercial` | Comercial Alimentació i Gran Consum | Iberia | 38 |
| `com_trade` | `comercial` | Trade Marketing i Activació Punt de Venda | Barcelona / Regional | 22 |
| `ofi_corp` | `oficines` | Oficines Corporatives — Finances, Legal i Compres | Seu Central Rosselló / Barcelona | 52 |
| `ofi_marqueting` | `oficines` | Màrqueting, Marca i Sostenibilitat | Seu Central Barcelona | 30 |
| `rrhh` | `oficines` | People / Recursos Humans (RRHH) | Seu Central Barcelona / Multi-site | 26 |
| `data_ia_it` | `oficines` | Transformació Digital, IT, Data & IA | Seu Central Barcelona | 29 |

---

## 4. Esquema Relacional PostgreSQL (`supabase/migrations/`)

El fitxer `supabase/migrations/20261107162128_init_people_listening_platform.sql` defineix les 14 taules i 2 vistes analítiques següents:

| Taula / Vista | Rol Principal | Conté Identitat d'Empleat? |
|---|---|---|
| `public.wellbeing_dimensions` | Catàleg oficial de les 6 dimensions de benestar (`mood`, `workload`, `team_support`, `recognition`, `alignment`, `communication`). | No |
| `public.sites` | Catàleg dels 14 centres productius, logístics i corporatius de Damm. | No |
| `public.departments` | Estructura organitzativa agrupada en els 4 col·lectius i 13 departaments. | No |
| `public.user_profiles` | Perfils de rol (`hr_admin`, `hr_analyst`, `manager`, `integration`) associats a `auth.users`. | Només usuaris de gestió RRHH / Managers |
| `public.synthetic_people` | Directori sintètic (727 empleats) amb `site_id`, `site`, `site_location`, `site_type_ca`, `department_id`, `collective`, `role_family`, `role_title`, `shift`, `contract_type`, `tenure_band`, `age_band`, `gender`, `manager_level` i `work_modality` per calcular taxes de participació i elegibilitat d'audiència. | Sintètic (`EMP-0001..EMP-0727`), desacoblat de `survey_responses` |
| `public.questionnaires` | Plantilles trilingües (`ca`, `es`, `en`) reutilitzables de micro-enquestes. | No |
| `public.questions` | Preguntes d'escala (`scale_1_5`, `enps_0_10`, `single_choice`) i text obert (`open_text`). | No |
| `public.campaigns` | Campanyes de pols amb finestra temporal, col·lectius objectiu i llindar `min_group_size` ($\ge 10$). | No |
| `public.survey_responses` | Capçalera anònima de resposta amb metadades agregables (`collective`, `department_id`, `tenure_band`, `shift`) i **zero** columnes d'identitat. | **Mai** (Zero-PII) |
| `public.response_scale_answers` | Respostes quantitatives normalitzades a escala $0..100$ mitjançant columna generada (`normalized_score`). | **Mai** |
| `public.response_open_answers` | Comentaris oberts amb trigger automàtic `trg_sanitize_open_answer_pii` que redacta emails, telèfons i DNIs/NIEs abans del `INSERT`. | **Mai** (PII redactada) |
| `public.analysis_runs` | Registre d'execucions analítiques i d'IA disparades des de **n8n** o des del backoffice. | No |
| `public.analysis_segments` | Mètriques agregades per segment amb flag automàtic `suppressed_by_k_anonymity`. | No |
| `public.insights` | Insights executius trilingües detectats per l'agent IA sobre segments amb $n \ge 10$. | No |
| `public.action_recommendations` | Plans d'acció prioritzats (`alta`, `mitjana`, `baixa`) vinculats a campanya, dimensió i insight. | No |
| `public.integration_connections` | Estat i configuració dels connectors externs (`n8n`, `typeform`, `teams`, `email`). | No |
| `public.v_campaign_participation` | Vista que calcula `invited_count`, `responded_count`, `participation_rate_pct` i `k_anonymity_ready`. | No |
| `public.v_campaign_dimension_scores` | Vista que aplica la màscara d'anonimat: retorna `NULL` a `avg_normalized_0_100` si `respondent_count < min_group_size`. | No |

---

## 5. Garanties de Privacitat al Motor SQL

1. **Absència física d'identificadors a les respostes**:
   `public.survey_responses` no té cap clau forana cap a `auth.users` ni `synthetic_people`, ni emmagatzema adreces IP, `user-agent` ni correus electrònics.
2. **Coerció de micro-segments demogràfics (`trg_anonymize_survey_response_demographics`)**:
   Si un empleat envia una combinació de `department_id` + `tenure_band` + `shift` que al directori `synthetic_people` té menys de `min_group_size` ($\ge 10$) persones, el trigger de PostgreSQL substitueix automàticament `tenure_band` i `shift` per `'unassigned'` en el moment de la inserció per impedir la re-identificació per triangulació.
3. **Redacció automàtica de PII en text lliure (`trg_sanitize_open_answer_pii`)**:
   Qualsevol correu electrònic (`[EMAIL_REDACTED]`), telèfon (`[PHONE_REDACTED]`) o DNI/NIE (`[ID_REDACTED]`) escrit per error en una pregunta oberta es neteja dins del mateix motor PostgreSQL abans d'escriure la fila.
4. **Supressió per $k$-anonimat a vistes i RPCs (`k >= 10`)**:
   - La restricció `campaigns_min_group_size_check` impedeix a nivell de motor SQL crear cap campanya amb `min_group_size < 10`.
   - Tant `v_campaign_dimension_scores` com `analysis_segments` oculten qualsevol agregat quan la mostra és inferior a `min_group_size`.
5. **Row Level Security (RLS)**:
   - Els empleats anònims (`anon`) només poden llegir campanyes actives i invocar la funció `public.submit_survey_response(...)`.
   - Els rols `hr_admin` i `hr_analyst` només poden consultar agregats i comentaris ja sanititzats.
   - Els `manager` només poden veure segments no suprimits (`suppressed_by_k_anonymity = false`) i del seu propi departament.
   - El rol `integration` (utilitzat per **n8n**) pot llegir comentaris sanititzats i publicar `analysis_runs`, `analysis_segments`, `insights` i `action_recommendations`.
