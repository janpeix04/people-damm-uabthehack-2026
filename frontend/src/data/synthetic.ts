/**
 * Deterministic demo directory and employee-listening dataset.
 *
 * IMPORTANT: every person, identifier, e-mail and answer in this file is
 * synthetic. The broad proportions and sites are calibrated against official
 * Damm reporting and challenge documentation; this is not an extract from a Damm system.
 */

export const SYNTHETIC_DATASET_NOTICE =
  'Dades 100% sintètiques per a demostració. No representen persones ni respostes reals de Damm.'

export const SYNTHETIC_DATASET_VERSION = 'damm-demo-2026.11-v3'
export const PRIVACY_MIN_SAMPLE = 10

export type DepartmentKey = 'fabriques' | 'logistica' | 'comercial' | 'oficines'
export type LanguageKey = 'ca' | 'es' | 'en'
export type ShiftKey = 'mati' | 'tarda' | 'nit' | 'partida' | 'flexible'
export type TenureBand = '<1' | '1-3' | '4-7' | '8-15' | '16+'
export type AgeBand = '<25' | '25-34' | '35-44' | '45-54' | '55+'
export type GenderKey = 'dona' | 'home' | 'no_binari' | 'no_indicat'
export type JobLevel = 'equip' | 'especialista' | 'coordinacio' | 'direccio'
export type DimensionKey =
  | 'benestar'
  | 'lideratge'
  | 'desenvolupament'
  | 'cultura'
  | 'entorn'
  | 'condicions'

export interface DammSite {
  code: string
  name: string
  location: string
  typeCa: string
  collective: DepartmentKey
}

export const DAMM_SITES: DammSite[] = [
  { code: 'seu_central_bcn', name: 'Seu central Damm', location: 'Barcelona', typeCa: 'Oficines corporatives', collective: 'oficines' },
  { code: 'cc_damm_el_prat', name: 'Compañía Cervecera Damm', location: 'El Prat de Llobregat', typeCa: 'Fàbrica de cervesa', collective: 'fabriques' },
  { code: 'estrella_levante_murcia', name: 'Estrella de Levante', location: 'Espinardo, Múrcia', typeCa: 'Fàbrica de cervesa', collective: 'fabriques' },
  { code: 'cervezas_victoria_malaga', name: 'Cervezas Victoria', location: 'Màlaga', typeCa: 'Fàbrica de cervesa', collective: 'fabriques' },
  { code: 'font_salem_el_puig', name: 'Font Salem (El Puig)', location: 'El Puig, València', typeCa: 'Fàbrica de begudes', collective: 'fabriques' },
  { code: 'font_salem_salem', name: 'Font Salem (Salem)', location: 'Salem, València', typeCa: 'Fàbrica de begudes', collective: 'fabriques' },
  { code: 'font_salem_santarem', name: 'Font Salem (Santarém)', location: 'Santarém, Portugal', typeCa: 'Fàbrica de begudes', collective: 'fabriques' },
  { code: 'la_moravia_lleida', name: 'La Moravia', location: "Bell-lloc d'Urgell, Lleida", typeCa: 'Malteria', collective: 'fabriques' },
  { code: 'cacaolat_santa_coloma', name: 'Cacaolat', location: 'Santa Coloma de Gramenet', typeCa: 'Fàbrica de begudes làcties', collective: 'fabriques' },
  { code: 'cafes_garriga_barbera', name: 'Cafès Garriga', location: 'Barberà del Vallès', typeCa: 'Centre de cafè', collective: 'fabriques' },
  { code: 'veri_osca', name: 'Aguas de San Martín de Veri', location: 'Osca', typeCa: "Planta d'aigua", collective: 'fabriques' },
  { code: 'fuente_liviana_conca', name: 'Fuente Liviana', location: 'Conca', typeCa: "Planta d'aigua", collective: 'fabriques' },
  { code: 'logistic_bcn_zal', name: 'Centre logístic Damm Barcelona (ZAL)', location: 'Barcelona (ZAL)', typeCa: 'Logística', collective: 'logistica' },
  { code: 'logistic_murcia', name: 'Centre logístic Damm Múrcia', location: 'Múrcia', typeCa: 'Logística', collective: 'logistica' },
]

export const DIMENSION_KEYS: DimensionKey[] = [
  'benestar',
  'lideratge',
  'desenvolupament',
  'cultura',
  'entorn',
  'condicions',
]

export const DIMENSION_LABELS: Record<LanguageKey, Record<DimensionKey, string>> = {
  ca: {
    benestar: 'Benestar',
    lideratge: 'Lideratge',
    desenvolupament: 'Desenvolupament',
    cultura: 'Cultura i pertinença',
    entorn: 'Entorn i relacions',
    condicions: 'Condicions i organització',
  },
  es: {
    benestar: 'Bienestar',
    lideratge: 'Liderazgo',
    desenvolupament: 'Desarrollo',
    cultura: 'Cultura y pertenencia',
    entorn: 'Entorno y relaciones',
    condicions: 'Condiciones y organización',
  },
  en: {
    benestar: 'Wellbeing',
    lideratge: 'Leadership',
    desenvolupament: 'Development',
    cultura: 'Culture and belonging',
    entorn: 'Environment and relationships',
    condicions: 'Conditions and organisation',
  },
}

export interface SyntheticEmployee {
  id: string
  firstName: string
  lastName: string
  email: string
  teamsUserId: string
  department: DepartmentKey
  orgDepartment: string
  site: string
  siteLocation: string
  siteType: string
  role: string
  jobLevel: JobLevel
  managerId: string | null
  shift: ShiftKey
  tenure: TenureBand
  ageBand: AgeBand
  dateOfBirth: string
  gender: GenderKey
  hireDate: string
  language: LanguageKey
  contract: 'indefinit' | 'temporal'
  workPattern: 'presencial' | 'mobil' | 'hibrid'
  active: boolean
  synthetic: true
}

export interface ListeningCampaign {
  id: string
  title: Record<LanguageKey, string>
  closesAt: string
  departments: DepartmentKey[]
  channels: ('teams' | 'qr' | 'mobile' | 'desktop')[]
}

export interface SyntheticResponse {
  id: string
  campaignId: string
  employeeId: string
  submittedAt: string
  channel: 'teams' | 'qr' | 'mobile' | 'desktop'
  language: LanguageKey
  scores: Record<DimensionKey, number>
  comment: string
  commentDimension: DimensionKey
  sentiment: 'positiu' | 'neutre' | 'negatiu'
  topics: string[]
  synthetic: true
}

export interface DatasetFilters {
  campaignIds?: string[]
  departments?: DepartmentKey[]
  orgDepartments?: string[]
  sites?: string[]
  roles?: string[]
  jobLevels?: JobLevel[]
  shifts?: ShiftKey[]
  tenures?: TenureBand[]
  ageBands?: AgeBand[]
  languages?: LanguageKey[]
  channels?: SyntheticResponse['channel'][]
}

export type BreakdownField =
  | 'department'
  | 'orgDepartment'
  | 'site'
  | 'role'
  | 'jobLevel'
  | 'shift'
  | 'tenure'
  | 'ageBand'
  | 'language'
  | 'channel'
  | 'campaignId'

export interface PrivacySafeAggregate {
  key: string
  n: number
  suppressed: boolean
  suppressionReason?: string
  scores: Record<DimensionKey, number | null>
  overall: number | null
  favourable: number | null
  responseIds: string[]
}

const DEPARTMENT_SIZES: Record<DepartmentKey, number> = {
  fabriques: 332,
  logistica: 180,
  comercial: 95,
  oficines: 120,
}

const SITE_BY_CODE = Object.fromEntries(DAMM_SITES.map(s => [s.code, s]))

const DEPARTMENT_SITES: Record<DepartmentKey, { site: DammSite; weight: number }[]> = {
  fabriques: [
    { site: SITE_BY_CODE.cc_damm_el_prat, weight: 32 },
    { site: SITE_BY_CODE.estrella_levante_murcia, weight: 14 },
    { site: SITE_BY_CODE.cervezas_victoria_malaga, weight: 10 },
    { site: SITE_BY_CODE.font_salem_el_puig, weight: 9 },
    { site: SITE_BY_CODE.font_salem_salem, weight: 7 },
    { site: SITE_BY_CODE.font_salem_santarem, weight: 7 },
    { site: SITE_BY_CODE.la_moravia_lleida, weight: 5 },
    { site: SITE_BY_CODE.cacaolat_santa_coloma, weight: 6 },
    { site: SITE_BY_CODE.cafes_garriga_barbera, weight: 4 },
    { site: SITE_BY_CODE.veri_osca, weight: 3 },
    { site: SITE_BY_CODE.fuente_liviana_conca, weight: 3 },
  ],
  logistica: [
    { site: SITE_BY_CODE.logistic_bcn_zal, weight: 46 },
    { site: SITE_BY_CODE.logistic_murcia, weight: 24 },
    { site: SITE_BY_CODE.cc_damm_el_prat, weight: 18 },
    { site: SITE_BY_CODE.font_salem_el_puig, weight: 12 },
  ],
  comercial: [
    { site: SITE_BY_CODE.seu_central_bcn, weight: 28 },
    { site: SITE_BY_CODE.cc_damm_el_prat, weight: 18 },
    { site: SITE_BY_CODE.estrella_levante_murcia, weight: 14 },
    { site: SITE_BY_CODE.cervezas_victoria_malaga, weight: 12 },
    { site: SITE_BY_CODE.font_salem_el_puig, weight: 10 },
    { site: SITE_BY_CODE.font_salem_santarem, weight: 6 },
    { site: SITE_BY_CODE.cacaolat_santa_coloma, weight: 6 },
    { site: SITE_BY_CODE.cafes_garriga_barbera, weight: 6 },
  ],
  oficines: [
    { site: SITE_BY_CODE.seu_central_bcn, weight: 64 },
    { site: SITE_BY_CODE.cc_damm_el_prat, weight: 12 },
    { site: SITE_BY_CODE.estrella_levante_murcia, weight: 8 },
    { site: SITE_BY_CODE.cervezas_victoria_malaga, weight: 6 },
    { site: SITE_BY_CODE.font_salem_santarem, weight: 5 },
    { site: SITE_BY_CODE.cacaolat_santa_coloma, weight: 5 },
  ],
}

const ROLES: Record<DepartmentKey, { role: string; orgDept: string; level: JobLevel; weight: number }[]> = {
  fabriques: [
    { role: 'Operari/ària d’envasat', orgDept: 'Envasat', level: 'equip', weight: 26 },
    { role: 'Operari/ària de sala de cocció', orgDept: 'Sala de cocció', level: 'equip', weight: 16 },
    { role: 'Operari/ària de recepció de malta i malteria', orgDept: 'Recepció de malta', level: 'equip', weight: 10 },
    { role: 'Tècnic/a de fermentació i celler', orgDept: 'Fermentació', level: 'especialista', weight: 12 },
    { role: 'Tècnic/a de manteniment industrial', orgDept: 'Manteniment', level: 'especialista', weight: 10 },
    { role: 'Tècnic/a de qualitat i seguretat alimentària', orgDept: 'Qualitat', level: 'especialista', weight: 10 },
    { role: 'Cap de torn de fàbrica', orgDept: 'Envasat', level: 'coordinacio', weight: 11 },
    { role: 'Responsable de planta', orgDept: 'Operacions de planta', level: 'direccio', weight: 5 },
  ],
  logistica: [
    { role: 'Mosso/a de magatzem logístic', orgDept: 'Logística i magatzem', level: 'equip', weight: 30 },
    { role: 'Carretoner/a de ZAL i planta', orgDept: 'Logística i magatzem', level: 'equip', weight: 23 },
    { role: 'Conductor/a repartidor/a', orgDept: 'Planificació i distribució', level: 'equip', weight: 18 },
    { role: 'Planificador/a logístic/a', orgDept: 'Planificació i distribució', level: 'especialista', weight: 13 },
    { role: 'Cap d’operacions logístiques', orgDept: 'Logística i magatzem', level: 'coordinacio', weight: 11 },
    { role: 'Responsable logístic/a', orgDept: 'Logística i magatzem', level: 'direccio', weight: 5 },
  ],
  comercial: [
    { role: 'Gestor/a comercial Horeca', orgDept: 'Comercial Horeca', level: 'equip', weight: 46 },
    { role: 'Key Account Executive', orgDept: 'Grans comptes i Trade Marketing', level: 'especialista', weight: 18 },
    { role: 'Trade Marketing Specialist', orgDept: 'Grans comptes i Trade Marketing', level: 'especialista', weight: 14 },
    { role: 'Cap de zona comercial', orgDept: 'Comercial Horeca', level: 'coordinacio', weight: 16 },
    { role: 'Direcció comercial', orgDept: 'Direcció comercial', level: 'direccio', weight: 6 },
  ],
  oficines: [
    { role: 'HR Business Partner (People / RRHH)', orgDept: 'People / RRHH', level: 'especialista', weight: 10 },
    { role: 'Especialista People Analytics i Sostenibilitat ESG (RRHH)', orgDept: 'People / RRHH', level: 'especialista', weight: 9 },
    { role: 'Direcció de People & Desenvolupament de Persones (RRHH)', orgDept: 'People / RRHH', level: 'direccio', weight: 4 },
    { role: 'Data & IA Engineer', orgDept: 'Data & IA / Tecnologia', level: 'especialista', weight: 14 },
    { role: 'Business Analyst IT', orgDept: 'Data & IA / Tecnologia', level: 'especialista', weight: 12 },
    { role: 'Analista financer/a', orgDept: 'Oficines corporatives i Finances', level: 'especialista', weight: 14 },
    { role: 'Tècnic/a de màrqueting', orgDept: 'Oficines corporatives i Finances', level: 'especialista', weight: 12 },
    { role: 'Administratiu/iva corporatiu/iva', orgDept: 'Oficines corporatives i Finances', level: 'equip', weight: 12 },
    { role: 'Manager corporatiu/iva', orgDept: 'Oficines corporatives i Finances', level: 'coordinacio', weight: 9 },
    { role: 'Direcció d’àrea corporativa', orgDept: 'Oficines corporatives i Finances', level: 'direccio', weight: 4 },
  ],
}

const FIRST_NAMES: Record<LanguageKey, string[]> = {
  ca: ['Aina', 'Arnau', 'Berta', 'Biel', 'Carla', 'Ferran', 'Gemma', 'Jordi', 'Laia', 'Marc', 'Núria', 'Pau', 'Sílvia', 'Xavi'],
  es: ['Álvaro', 'Ana', 'Carmen', 'David', 'Elena', 'Hugo', 'Irene', 'Javier', 'Lucía', 'Marcos', 'Marta', 'Raúl', 'Sara', 'Sergio'],
  en: ['Alex', 'Amelia', 'Ben', 'Chloe', 'Daniel', 'Emily', 'Grace', 'Harry', 'Jack', 'Lucy', 'Maya', 'Noah', 'Olivia', 'Sam'],
}

const LAST_NAMES = [
  'Alba', 'Borrell', 'Campos', 'Costa', 'Domènech', 'Ferrer', 'García', 'Gil', 'López', 'Martí',
  'Navarro', 'Ortega', 'Pons', 'Riera', 'Romero', 'Sánchez', 'Serra', 'Soler', 'Vega', 'Vidal',
]

const CAMPAIGNS: ListeningCampaign[] = [
  {
    id: 'pols-2026-07',
    title: { ca: 'Pols d’estiu', es: 'Pulso de verano', en: 'Summer pulse' },
    closesAt: '2026-07-24',
    departments: ['fabriques', 'logistica', 'comercial', 'oficines'],
    channels: ['teams', 'qr', 'mobile', 'desktop'],
  },
  {
    id: 'pols-2026-09',
    title: { ca: 'Tornada i organització', es: 'Vuelta y organización', en: 'Back to work and organisation' },
    closesAt: '2026-09-25',
    departments: ['fabriques', 'logistica', 'comercial', 'oficines'],
    channels: ['teams', 'qr', 'mobile', 'desktop'],
  },
  {
    id: 'pols-2026-11',
    title: { ca: 'Experiència Damm', es: 'Experiencia Damm', en: 'Damm experience' },
    closesAt: '2026-11-06',
    departments: ['fabriques', 'logistica', 'comercial', 'oficines'],
    channels: ['teams', 'qr', 'mobile', 'desktop'],
  },
]

const SCORE_BASE: Record<DepartmentKey, Record<DimensionKey, number>> = {
  fabriques: { benestar: 6.2, lideratge: 6.4, desenvolupament: 6.0, cultura: 7.4, entorn: 7.0, condicions: 5.7 },
  logistica: { benestar: 5.9, lideratge: 6.1, desenvolupament: 5.8, cultura: 6.8, entorn: 6.6, condicions: 5.5 },
  comercial: { benestar: 6.8, lideratge: 6.7, desenvolupament: 6.6, cultura: 7.8, entorn: 7.1, condicions: 6.2 },
  oficines: { benestar: 7.4, lideratge: 6.9, desenvolupament: 7.3, cultura: 7.8, entorn: 7.5, condicions: 7.0 },
}

type CommentVariant = { text: string; topics: string[] }

const COMMENTS: Record<LanguageKey, Record<DepartmentKey, Partial<Record<DimensionKey, CommentVariant[]>>>> = {
  ca: {
    fabriques: {
      benestar: [
        { text: 'Amb l’equip del torn bé, però aquesta setmana he arribat al final força cansat.', topics: ['càrrega', 'torns'] },
        { text: 'El ritme és alt; una pausa ben feta canvia molt com acabes el dia.', topics: ['descansos', 'càrrega'] },
      ],
      lideratge: [
        { text: 'El cap de torn resol quan hi ha un problema, però els canvis podrien explicar-se abans.', topics: ['feedback', 'comunicació'] },
        { text: 'Quan fem els cinc minuts d’arrencada tot va més rodat. No sempre els fem.', topics: ['briefing', 'coordinació'] },
      ],
      desenvolupament: [
        { text: 'La formació de qualitat va ser útil perquè la vam fer a línia, amb casos reals.', topics: ['Damm Academy', 'formació'] },
        { text: 'M’agradaria saber què he d’aprendre per passar a una posició més tècnica.', topics: ['mobilitat', 'carrera'] },
      ],
      cultura: [{ text: 'Hi ha orgull pel producte i per fer-lo bé; això sí que es nota al torn.', topics: ['orgull', 'qualitat'] }],
      entorn: [{ text: 'Entre companys ens cobrim molt. Quan falta algú, però, l’equip queda just.', topics: ['companyonia', 'dotació'] }],
      condicions: [
        { text: 'El calendari de torns hauria d’arribar abans, sobretot quan hi ha cap de setmana.', topics: ['torns', 'conciliació'] },
        { text: 'La calor a la zona d’envasat encara es nota molt a última hora.', topics: ['temperatura', 'instal·lacions'] },
      ],
    },
    logistica: {
      benestar: [{ text: 'Els divendres anem molt al límit. Amb més previsió es faria igual sense tanta pressa.', topics: ['pics de càrrega', 'planificació'] }],
      lideratge: [{ text: 'El responsable és proper, però a vegades la prioritat canvia quan ja tenim el camió preparat.', topics: ['prioritats', 'comunicació'] }],
      desenvolupament: [{ text: 'Faria bé una ruta clara per passar de magatzem a planificació.', topics: ['mobilitat', 'formació'] }],
      cultura: [{ text: 'La marca pesa i fa il·lusió, però al magatzem també volem veure més el que es decideix.', topics: ['pertinença', 'visibilitat'] }],
      entorn: [{ text: 'Bon ambient a moll. La coordinació amb planta és el punt que ens falta acabar de lligar.', topics: ['companyonia', 'planta-logística'] }],
      condicions: [{ text: 'L’equipament nou ajuda molt; el coll d’ampolla ara és la informació que arriba tard.', topics: ['equipament', 'informació'] }],
    },
    comercial: {
      benestar: [{ text: 'M’agrada estar amb clients, però hi ha setmanes que la ruta no deixa gaire marge.', topics: ['rutes', 'càrrega'] }],
      lideratge: [{ text: 'El feedback és concret quan revisem visites. Em serviria que fos més regular.', topics: ['feedback', 'acompanyament'] }],
      desenvolupament: [{ text: 'He après molt al carrer; voldria més sessions curtes sobre negociació i dades.', topics: ['formació', 'dades'] }],
      cultura: [{ text: 'Representar Estrella Damm obre portes i això genera orgull.', topics: ['marca', 'orgull'] }],
      entorn: [{ text: 'Ens ajudem pel xat quan surt un problema amb un client. Funciona.', topics: ['col·laboració', 'clients'] }],
      condicions: [{ text: 'Duplicar la visita en dues eines és temps que no dedico al client.', topics: ['eines', 'duplicació'] }],
    },
    oficines: {
      benestar: [{ text: 'La flexibilitat ajuda molt. El que em desgasta és encadenar reunions sense temps per treballar.', topics: ['flexibilitat', 'reunions'] }],
      lideratge: [{ text: 'Tinc autonomia i suport, però els objectius canvien sense acabar de tancar l’anterior.', topics: ['prioritats', 'autonomia'] }],
      desenvolupament: [{ text: 'Damm Academy té contingut bo; lligaria millor la formació amb el següent pas professional.', topics: ['Damm Academy', 'carrera'] }],
      cultura: [{ text: 'El projecte té identitat pròpia. Quan col·laborem entre negocis es nota encara més.', topics: ['identitat', 'col·laboració'] }],
      entorn: [{ text: 'Molt bon equip, tot i que entre àrees encara depenem massa del correu.', topics: ['equip', 'silos'] }],
      condicions: [{ text: 'Un matí sense reunions ens donaria més focus que una altra eina nova.', topics: ['focus', 'reunions'] }],
    },
  },
  es: {
    fabriques: {
      benestar: [{ text: 'El turno ha salido bien, aunque llevamos varias semanas con bastante carga.', topics: ['carga', 'turnos'] }],
      lideratge: [{ text: 'Mi responsable está cuando hace falta. Los cambios de última hora cuestan más.', topics: ['acompañamiento', 'comunicación'] }],
      desenvolupament: [{ text: 'La formación en máquina sirve; estaría bien tener claro cómo optar a mantenimiento.', topics: ['formación', 'movilidad'] }],
      cultura: [{ text: 'Da orgullo ver salir el producto y saber que lo hacemos aquí.', topics: ['orgullo', 'producto'] }],
      entorn: [{ text: 'Muy buen equipo en la línea. Nos cubrimos, aunque vamos justos en algunos cambios.', topics: ['compañerismo', 'dotación'] }],
      condicions: [{ text: 'Necesitamos el cuadrante con más antelación. Organizar la familia así es complicado.', topics: ['turnos', 'conciliación'] }],
    },
    logistica: {
      benestar: [{ text: 'Hay días intensos, sobre todo al cierre de semana. Se puede organizar mejor.', topics: ['picos de carga', 'estrés'] }],
      lideratge: [{ text: 'El encargado escucha, pero no siempre puede explicar por qué cambia la prioridad.', topics: ['liderazgo', 'prioridades'] }],
      desenvolupament: [{ text: 'Me gustaría tener formación para pasar de carretilla a planificación.', topics: ['formación', 'promoción'] }],
      cultura: [{ text: 'Se siente la marca, aunque logística aparece poco cuando se cuentan los éxitos.', topics: ['pertenencia', 'reconocimiento'] }],
      entorn: [{ text: 'Entre nosotros hay buen ambiente. Con producción falta una coordinación más directa.', topics: ['ambiente', 'coordinación'] }],
      condicions: [{ text: 'La maquinaria está bien; perdemos tiempo cuando la información del pedido cambia tarde.', topics: ['equipamiento', 'pedidos'] }],
    },
    comercial: {
      benestar: [{ text: 'El trabajo con clientes motiva, pero algunas rutas quedan demasiado apretadas.', topics: ['clientes', 'rutas'] }],
      lideratge: [{ text: 'Mi manager conoce el terreno y ayuda. Echo de menos un uno a uno fijo.', topics: ['feedback', 'manager'] }],
      desenvolupament: [{ text: 'Se aprende muchísimo en la calle; quiero ver opciones reales para crecer dentro.', topics: ['aprendizaje', 'carrera'] }],
      cultura: [{ text: 'La marca ayuda y da orgullo cuando entras en un cliente nuevo.', topics: ['marca', 'orgullo'] }],
      entorn: [{ text: 'El equipo responde rápido por Teams cuando hay una incidencia con un cliente.', topics: ['Teams', 'colaboración'] }],
      condicions: [{ text: 'Registrar lo mismo en varias herramientas acaba pesando más que la visita.', topics: ['herramientas', 'duplicidad'] }],
    },
    oficines: {
      benestar: [{ text: 'Valoro la flexibilidad. Lo que más cansa es pasar de reunión en reunión.', topics: ['flexibilidad', 'reuniones'] }],
      lideratge: [{ text: 'Tengo autonomía; agradecería más claridad cuando dos áreas piden cosas distintas.', topics: ['autonomía', 'prioridades'] }],
      desenvolupament: [{ text: 'Hay cursos buenos, pero no siempre se ve qué formación abre una oportunidad interna.', topics: ['Damm Academy', 'movilidad'] }],
      cultura: [{ text: 'Se nota una cultura fuerte de producto y mejora, sobre todo en proyectos transversales.', topics: ['cultura', 'mejora'] }],
      entorn: [{ text: 'Buen ambiente cercano. Entre áreas todavía hay información que llega por demasiados canales.', topics: ['ambiente', 'canales'] }],
      condicions: [{ text: 'Menos reuniones y decisiones más claras nos ayudarían más que otra presentación.', topics: ['reuniones', 'decisiones'] }],
    },
  },
  en: {
    fabriques: {
      benestar: [{ text: 'The shift went well, but the pace has been high for a few weeks now.', topics: ['workload', 'shifts'] }],
      lideratge: [{ text: 'The shift lead is supportive. Last-minute changes are the part that gets difficult.', topics: ['support', 'communication'] }],
      desenvolupament: [{ text: 'Hands-on training works. I would like a clearer route into a technical role.', topics: ['training', 'mobility'] }],
      cultura: [{ text: 'There is real pride in the product and in getting quality right.', topics: ['pride', 'quality'] }],
      entorn: [{ text: 'People on the line help each other. Cover is tight when somebody is away.', topics: ['teamwork', 'staffing'] }],
      condicions: [{ text: 'Earlier shift schedules would make planning life outside work much easier.', topics: ['shifts', 'work-life balance'] }],
    },
    logistica: {
      benestar: [{ text: 'Friday peaks are intense. Better notice would take out a lot of the pressure.', topics: ['peak load', 'planning'] }],
      lideratge: [{ text: 'My supervisor listens, but priorities sometimes change after loading has started.', topics: ['leadership', 'priorities'] }],
      desenvolupament: [{ text: 'I would use a clear learning path from warehouse work into planning.', topics: ['development', 'mobility'] }],
      cultura: [{ text: 'The brand is strong; logistics could be more visible when wins are shared.', topics: ['belonging', 'recognition'] }],
      entorn: [{ text: 'Good people on the dock. The hand-off with production still needs work.', topics: ['teamwork', 'coordination'] }],
      condicions: [{ text: 'The equipment is good. Late order changes are what slow the shift down.', topics: ['equipment', 'orders'] }],
    },
    comercial: {
      benestar: [{ text: 'Customer work is energising, but some routes leave no breathing room.', topics: ['customers', 'routes'] }],
      lideratge: [{ text: 'Feedback after visits is useful. A regular one-to-one would make it better.', topics: ['feedback', 'manager'] }],
      desenvolupament: [{ text: 'I learn a lot in the field and want a more visible path into another business area.', topics: ['learning', 'career'] }],
      cultura: [{ text: 'Representing the brand creates a real sense of pride with customers.', topics: ['brand', 'pride'] }],
      entorn: [{ text: 'The team helps quickly on Teams when a customer issue comes up.', topics: ['Teams', 'collaboration'] }],
      condicions: [{ text: 'Entering the same visit in two tools takes time away from the customer.', topics: ['tools', 'duplicate work'] }],
    },
    oficines: {
      benestar: [{ text: 'Flexibility helps a lot. Back-to-back meetings are the main drain on focus.', topics: ['flexibility', 'meetings'] }],
      lideratge: [{ text: 'I have autonomy, but competing priorities between teams are not always resolved.', topics: ['autonomy', 'priorities'] }],
      desenvolupament: [{ text: 'Damm Academy has useful content; I would link it more clearly to internal moves.', topics: ['Damm Academy', 'career'] }],
      cultura: [{ text: 'The product culture feels distinctive, especially in cross-business projects.', topics: ['culture', 'collaboration'] }],
      entorn: [{ text: 'A supportive team, though too much knowledge still sits inside separate functions.', topics: ['teamwork', 'silos'] }],
      condicions: [{ text: 'A meeting-free morning would create more value than adding another tool.', topics: ['focus', 'meetings'] }],
    },
  },
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashText(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function weighted<T>(random: () => number, items: { value: T; weight: number }[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let cursor = random() * total
  for (const item of items) {
    cursor -= item.weight
    if (cursor <= 0) return item.value
  }
  return items[items.length - 1].value
}

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10))
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

function syntheticDate(random: () => number, firstYear: number, lastYear: number) {
  const year = firstYear + Math.floor(random() * (lastYear - firstYear + 1))
  const month = 1 + Math.floor(random() * 12)
  const day = 1 + Math.floor(random() * 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function birthDateFor(random: () => number, ageBand: AgeBand) {
  const years: Record<AgeBand, [number, number]> = {
    '<25': [2002, 2007],
    '25-34': [1992, 2001],
    '35-44': [1982, 1991],
    '45-54': [1972, 1981],
    '55+': [1959, 1971],
  }
  return syntheticDate(random, ...years[ageBand])
}

function tenureForAge(random: () => number, ageBand: AgeBand, dateOfBirth: string): TenureBand {
  const weights: Record<AgeBand, { value: TenureBand; weight: number }[]> = {
    '<25': [{ value: '<1', weight: 35 }, { value: '1-3', weight: 45 }, { value: '4-7', weight: 20 }],
    '25-34': [{ value: '<1', weight: 15 }, { value: '1-3', weight: 30 }, { value: '4-7', weight: 35 }, { value: '8-15', weight: 20 }],
    '35-44': [{ value: '<1', weight: 8 }, { value: '1-3', weight: 18 }, { value: '4-7', weight: 25 }, { value: '8-15', weight: 39 }, { value: '16+', weight: 10 }],
    '45-54': [{ value: '<1', weight: 6 }, { value: '1-3', weight: 14 }, { value: '4-7', weight: 20 }, { value: '8-15', weight: 32 }, { value: '16+', weight: 28 }],
    '55+': [{ value: '<1', weight: 4 }, { value: '1-3', weight: 10 }, { value: '4-7', weight: 16 }, { value: '8-15', weight: 25 }, { value: '16+', weight: 45 }],
  }
  const legalWorkingYear = Number(dateOfBirth.slice(0, 4)) + 18
  const lastHireYear: Record<TenureBand, number> = { '<1': 2026, '1-3': 2025, '4-7': 2022, '8-15': 2018, '16+': 2010 }
  return weighted(random, weights[ageBand].filter(item => lastHireYear[item.value] >= legalWorkingYear))
}

function hireDateFor(random: () => number, tenure: TenureBand, dateOfBirth: string) {
  let candidate: string
  if (tenure === '<1') {
    const month = 1 + Math.floor(random() * 11)
    const day = 1 + Math.floor(random() * (month === 11 ? 7 : 28))
    candidate = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  } else {
    const years: Record<TenureBand, [number, number]> = {
      '<1': [2026, 2026],
      '1-3': [2023, 2025],
      '4-7': [2019, 2022],
      '8-15': [2011, 2018],
      '16+': [1990, 2010],
    }
    const [firstYear, lastYear] = years[tenure]
    const legalWorkingYear = Number(dateOfBirth.slice(0, 4)) + 18
    candidate = syntheticDate(random, Math.max(firstYear, legalWorkingYear), lastYear)
  }

  const legalWorkingDate = new Date(`${dateOfBirth}T12:00:00`)
  legalWorkingDate.setFullYear(legalWorkingDate.getFullYear() + 18)
  return new Date(`${candidate}T12:00:00`) < legalWorkingDate
    ? legalWorkingDate.toISOString().slice(0, 10)
    : candidate
}

function genderFor(random: () => number, department: DepartmentKey): GenderKey {
  const womenWeight: Record<DepartmentKey, number> = { fabriques: 28, logistica: 27, comercial: 38, oficines: 54 }
  return weighted(random, [
    { value: 'dona' as const, weight: womenWeight[department] },
    { value: 'home' as const, weight: 98 - womenWeight[department] },
    { value: 'no_binari' as const, weight: 1 },
    { value: 'no_indicat' as const, weight: 1 },
  ])
}

function departmentLanguage(random: () => number, department: DepartmentKey): LanguageKey {
  const weights = department === 'oficines'
    ? [{ value: 'ca' as const, weight: 48 }, { value: 'es' as const, weight: 38 }, { value: 'en' as const, weight: 14 }]
    : department === 'comercial'
      ? [{ value: 'ca' as const, weight: 38 }, { value: 'es' as const, weight: 55 }, { value: 'en' as const, weight: 7 }]
      : [{ value: 'ca' as const, weight: 45 }, { value: 'es' as const, weight: 51 }, { value: 'en' as const, weight: 4 }]
  return weighted(random, weights)
}

function departmentShift(random: () => number, department: DepartmentKey): ShiftKey {
  if (department === 'fabriques') {
    return weighted(random, [
      { value: 'mati', weight: 34 }, { value: 'tarda', weight: 31 }, { value: 'nit', weight: 25 }, { value: 'partida', weight: 10 },
    ])
  }
  if (department === 'logistica') {
    return weighted(random, [
      { value: 'mati', weight: 40 }, { value: 'tarda', weight: 30 }, { value: 'nit', weight: 18 }, { value: 'partida', weight: 12 },
    ])
  }
  if (department === 'comercial') return random() < 0.82 ? 'partida' : 'flexible'
  return random() < 0.78 ? 'flexible' : 'partida'
}

function generateEmployees(): SyntheticEmployee[] {
  const random = mulberry32(1876)
  const employees: SyntheticEmployee[] = []
  const departments = Object.keys(DEPARTMENT_SIZES) as DepartmentKey[]

  for (const department of departments) {
    for (let localIndex = 0; localIndex < DEPARTMENT_SIZES[department]; localIndex += 1) {
      const index = employees.length + 1
      const language = departmentLanguage(random, department)
      const firstName = FIRST_NAMES[language][Math.floor(random() * FIRST_NAMES[language].length)]
      const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
      const siteDef = weighted(random, DEPARTMENT_SITES[department].map(item => ({ value: item.site, weight: item.weight })))
      const roleDef = weighted(random, ROLES[department].map(item => ({ value: item, weight: item.weight })))
      const shift = departmentShift(random, department)
      const ageBand = weighted<AgeBand>(random, [
        { value: '<25', weight: department === 'oficines' ? 7 : 10 },
        { value: '25-34', weight: 22 },
        { value: '35-44', weight: 28 },
        { value: '45-54', weight: 29 },
        { value: '55+', weight: department === 'fabriques' || department === 'logistica' ? 14 : 9 },
      ])
      const dateOfBirth = birthDateFor(random, ageBand)
      const tenure = tenureForAge(random, ageBand, dateOfBirth)
      const hireDate = hireDateFor(random, tenure, dateOfBirth)
      const id = `EMP-DEMO-${String(index).padStart(4, '0')}`
      const workPattern = department === 'comercial' ? 'mobil' : department === 'oficines' ? 'hibrid' : 'presencial'

      employees.push({
        id,
        firstName,
        lastName,
        email: `${slug(firstName)}.${slug(lastName)}.${index}@demo.damm.invalid`,
        teamsUserId: `teams-demo-${String(index).padStart(4, '0')}`,
        department,
        orgDepartment: roleDef.orgDept,
        site: siteDef.name,
        siteLocation: siteDef.location,
        siteType: siteDef.typeCa,
        role: roleDef.role,
        jobLevel: roleDef.level,
        managerId: null,
        shift,
        tenure,
        ageBand,
        dateOfBirth,
        gender: genderFor(random, department),
        hireDate,
        language,
        contract: random() < 0.93 ? 'indefinit' : 'temporal',
        workPattern,
        active: true,
        synthetic: true,
      })
    }
  }

  const managers = employees.filter(employee => employee.jobLevel === 'coordinacio' || employee.jobLevel === 'direccio')
  return employees.map(employee => {
    if (employee.jobLevel === 'direccio') return employee
    const candidates = managers.filter(manager => manager.department === employee.department && manager.site === employee.site)
    const fallback = managers.filter(manager => manager.department === employee.department)
    const pool = candidates.length ? candidates : fallback
    const manager = pool[hashText(employee.id) % pool.length]
    return { ...employee, managerId: manager?.id ?? null }
  })
}

function responseProbability(employee: SyntheticEmployee, campaignIndex: number) {
  const base: Record<DepartmentKey, number> = { fabriques: 0.35, logistica: 0.34, comercial: 0.38, oficines: 0.46 }
  let probability = base[employee.department] + campaignIndex * 0.015
  if (employee.shift === 'nit') probability -= 0.08
  if (employee.jobLevel === 'coordinacio' || employee.jobLevel === 'direccio') probability += 0.05
  return Math.max(0.18, Math.min(0.62, probability))
}

function scoreFor(employee: SyntheticEmployee, dimension: DimensionKey, campaignIndex: number, random: () => number) {
  let score = SCORE_BASE[employee.department][dimension]
  score += (campaignIndex - 1) * (dimension === 'condicions' && employee.department === 'logistica' ? -0.18 : 0.08)
  score += (random() + random() + random() - 1.5) * 1.45
  if (employee.shift === 'nit' && (dimension === 'benestar' || dimension === 'condicions')) score -= 0.7
  if (employee.tenure === '<1' && dimension === 'desenvolupament') score += 0.35
  if (employee.tenure === '16+' && dimension === 'cultura') score += 0.35
  if (employee.jobLevel === 'direccio') score += 0.45
  if (employee.jobLevel === 'equip' && dimension === 'lideratge') score -= 0.15
  return clampScore(score)
}

function pickComment(
  employee: SyntheticEmployee,
  scores: Record<DimensionKey, number>,
  random: () => number,
) {
  const ordered = [...DIMENSION_KEYS].sort((a, b) => scores[a] - scores[b])
  const dimension = random() < 0.77 ? ordered[0] : ordered[ordered.length - 1]
  const variants = COMMENTS[employee.language][employee.department][dimension]
    ?? COMMENTS[employee.language][employee.department].entorn
    ?? []
  const variant = variants[Math.floor(random() * variants.length)] ?? { text: '', topics: [] }
  const score = scores[dimension]
  const sentiment = score >= 7.2 ? 'positiu' : score < 6.1 ? 'negatiu' : 'neutre'
  return { dimension, sentiment: sentiment as SyntheticResponse['sentiment'], ...variant }
}

function channelFor(employee: SyntheticEmployee, random: () => number): SyntheticResponse['channel'] {
  if (employee.department === 'fabriques' || employee.department === 'logistica') {
    return weighted(random, [
      { value: 'qr', weight: 46 }, { value: 'mobile', weight: 27 }, { value: 'teams', weight: 18 }, { value: 'desktop', weight: 9 },
    ])
  }
  if (employee.department === 'comercial') {
    return weighted(random, [
      { value: 'mobile', weight: 49 }, { value: 'teams', weight: 32 }, { value: 'qr', weight: 12 }, { value: 'desktop', weight: 7 },
    ])
  }
  return weighted(random, [
    { value: 'teams', weight: 56 }, { value: 'desktop', weight: 31 }, { value: 'mobile', weight: 11 }, { value: 'qr', weight: 2 },
  ])
}

function generateResponses(employees: SyntheticEmployee[]): SyntheticResponse[] {
  const responses: SyntheticResponse[] = []

  CAMPAIGNS.forEach((campaign, campaignIndex) => {
    employees.forEach(employee => {
      const random = mulberry32(hashText(`${employee.id}:${campaign.id}`))
      if (random() > responseProbability(employee, campaignIndex)) return

      const scores = Object.fromEntries(
        DIMENSION_KEYS.map(dimension => [dimension, scoreFor(employee, dimension, campaignIndex, random)]),
      ) as Record<DimensionKey, number>
      const comment = pickComment(employee, scores, random)
      const closeDate = new Date(`${campaign.closesAt}T18:00:00.000Z`)
      const daysBeforeClose = Math.floor(random() * 11)
      const submittedAt = new Date(closeDate.getTime() - daysBeforeClose * 86_400_000 - Math.floor(random() * 32_400_000))

      responses.push({
        id: `RES-DEMO-${campaignIndex + 1}-${employee.id.slice(-4)}`,
        campaignId: campaign.id,
        employeeId: employee.id,
        submittedAt: submittedAt.toISOString(),
        channel: channelFor(employee, random),
        language: employee.language,
        scores,
        comment: comment.text,
        commentDimension: comment.dimension,
        sentiment: comment.sentiment,
        topics: comment.topics,
        synthetic: true,
      })
    })
  })

  return responses
}

export const SYNTHETIC_EMPLOYEES = generateEmployees()
export const LISTENING_CAMPAIGNS = CAMPAIGNS
export const SYNTHETIC_RESPONSES = generateResponses(SYNTHETIC_EMPLOYEES)

const EMPLOYEE_BY_ID = new Map(SYNTHETIC_EMPLOYEES.map(employee => [employee.id, employee]))

export function filterSyntheticDataset(filters: DatasetFilters = {}) {
  const employees = SYNTHETIC_EMPLOYEES.filter(employee => {
    if (filters.departments && !filters.departments.includes(employee.department)) return false
    if (filters.orgDepartments && !filters.orgDepartments.includes(employee.orgDepartment)) return false
    if (filters.sites && !filters.sites.includes(employee.site)) return false
    if (filters.roles && !filters.roles.includes(employee.role)) return false
    if (filters.jobLevels && !filters.jobLevels.includes(employee.jobLevel)) return false
    if (filters.shifts && !filters.shifts.includes(employee.shift)) return false
    if (filters.tenures && !filters.tenures.includes(employee.tenure)) return false
    if (filters.ageBands && !filters.ageBands.includes(employee.ageBand)) return false
    if (filters.languages && !filters.languages.includes(employee.language)) return false
    return true
  })
  const employeeIds = new Set(employees.map(employee => employee.id))
  const responses = SYNTHETIC_RESPONSES.filter(response => {
    if (!employeeIds.has(response.employeeId)) return false
    if (filters.campaignIds && !filters.campaignIds.includes(response.campaignId)) return false
    if (filters.channels && !filters.channels.includes(response.channel)) return false
    return true
  })
  return { employees, responses }
}

function breakdownValue(response: SyntheticResponse, field: BreakdownField) {
  if (field === 'channel' || field === 'campaignId') return response[field]
  const employee = EMPLOYEE_BY_ID.get(response.employeeId)
  return employee ? String(employee[field]) : 'desconegut'
}

function aggregateGroup(key: string, responses: SyntheticResponse[]): PrivacySafeAggregate {
  const n = responses.length
  if (n < PRIVACY_MIN_SAMPLE) {
    return {
      key,
      n,
      suppressed: true,
      suppressionReason: `Mostra inferior a ${PRIVACY_MIN_SAMPLE} respostes`,
      scores: Object.fromEntries(DIMENSION_KEYS.map(dimension => [dimension, null])) as Record<DimensionKey, null>,
      overall: null,
      favourable: null,
      responseIds: [],
    }
  }

  const scores = Object.fromEntries(DIMENSION_KEYS.map(dimension => {
    const value = responses.reduce((sum, response) => sum + response.scores[dimension], 0) / n
    return [dimension, Math.round(value * 10) / 10]
  })) as Record<DimensionKey, number>
  const allScores = responses.flatMap(response => DIMENSION_KEYS.map(dimension => response.scores[dimension]))
  const overall = Math.round((allScores.reduce((sum, value) => sum + value, 0) / allScores.length) * 10) / 10
  const favourable = Math.round((allScores.filter(value => value >= 7).length / allScores.length) * 100)

  return {
    key,
    n,
    suppressed: false,
    scores,
    overall,
    favourable,
    responseIds: responses.map(response => response.id),
  }
}

/**
 * Returns analytics only for cohorts with at least 10 responses. Suppressed
 * groups expose the group size but no score, comment or response identifier.
 */
export function getPrivacySafeBreakdown(
  field: BreakdownField,
  filters: DatasetFilters = {},
): PrivacySafeAggregate[] {
  const { responses } = filterSyntheticDataset(filters)
  const groups = new Map<string, SyntheticResponse[]>()

  responses.forEach(response => {
    const key = breakdownValue(response, field)
    const group = groups.get(key) ?? []
    group.push(response)
    groups.set(key, group)
  })

  return [...groups.entries()]
    .map(([key, group]) => aggregateGroup(key, group))
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key))
}

export function getPrivacySafeTotal(filters: DatasetFilters = {}) {
  return aggregateGroup('total', filterSyntheticDataset(filters).responses)
}

export const SYNTHETIC_DATASET_STATS = {
  employees: SYNTHETIC_EMPLOYEES.length,
  responses: SYNTHETIC_RESPONSES.length,
  campaigns: LISTENING_CAMPAIGNS.length,
  sites: DAMM_SITES.length,
  departments: DEPARTMENT_SIZES,
  privacyMinimum: PRIVACY_MIN_SAMPLE,
  generatedDeterministically: true,
  provenance: [
    'Damm Informe anual 2024: distribució general de plantilla, contractació i edat.',
    'Damm Informe anual 2025: escala, sites i context de persones.',
    'Comentaris, identitats i puntuacions creats exclusivament per a la demo.',
  ],
} as const
