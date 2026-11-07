import type { ChannelKey, Initiative, Question, Reward, Survey, Mood, Zone, ZoneKey } from './types'

/** Totes les dades d'aquest fitxer són sintètiques. */

export const MIN_SAMPLE = 10
export const TOTAL_HEADCOUNT = 727
export const FESTA_GOAL = 0.6
export const BASE_RESPONSES = 392

export const MOODS: Record<Mood, { bg: string; ink: string; label: string; path: string }> = {
  // Emoció predominant de cada equip, calculada sobre respostes agregades (mínim 10). Mai s'infereix l'emoció d'una persona.
  happy: { bg: '#E6F2EA', ink: '#2F7A4E', label: 'Content', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2' },
  uneasy: { bg: '#FFF1D6', ink: '#9A6208', label: 'Inquiet', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h.01M15 9h.01M8 15h8' },
  stressed: { bg: '#FBE4E1', ink: '#B4261E', label: 'Estressat', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h.01M15 9h.01M16 16s-1.5-2-4-2-4 2-4 2' },
  nodata: { bg: '#ECEEF1', ink: '#5E6672', label: 'Sense dades', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01' },
  lock: { bg: '#F4ECDC', ink: '#7A5A1E', label: 'En obres', path: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4' },
}

export const ZONES: Zone[] = [
  { key: 'envasat', name: 'Envasat', area: 'Producció', headcount: 167, responses: 69, score: 5.6, delta: -0.6, participation: 41, mood: 'stressed', moodLabel: 'Estressat', story: 'El nou sistema de torns pesa sobretot a les línies d’envasat: poc descans entre torns i soroll.', topics: [{ label: 'Torns', tone: 'neg' }, { label: 'Descansos', tone: 'neg' }, { label: 'Soroll', tone: 'neg' }], doing: 'Pilot de pauses escalonades a la línia 3.', alerts: ['Torn de nit infrarepresentat (14% de respostes vs 26% de plantilla)', 'Conciliació −0,6 des de l’entrada dels torns rotatius'], trend: [6.4, 6.3, 6.4, 6.3, 6.2, 6.2, 6.1, 6.0, 6.1, 5.9, 5.8, 5.6], survey: true },
  { key: 'logistica', name: 'Logística', area: 'Logística', headcount: 180, responses: 88, score: 5.4, delta: -0.2, participation: 49, mood: 'stressed', moodLabel: 'Estressat', story: 'Els pics de càrrega dels divendres i la coordinació amb planta generen estrès aquest mes.', topics: [{ label: 'Pics de càrrega', tone: 'neg' }, { label: 'Horaris', tone: 'neg' }, { label: 'Equipament nou', tone: 'pos' }], doing: 'Sincro de 15 minuts amb Envasat cada dilluns.', alerts: ['Estrès percebut a l’alça durant 3 mesos'], trend: [6.2, 6.1, 6.0, 6.2, 6.0, 5.9, 6.0, 5.8, 5.9, 5.7, 5.6, 5.4], survey: true },
  { key: 'coccio', name: 'Sala de cocció', area: 'Producció', headcount: 64, responses: 30, score: 6.3, delta: -0.3, participation: 47, mood: 'uneasy', moodLabel: 'Inquiet', story: 'Molt orgull per l’ofici cerveser, però calor a la plataforma i descansos curts als canvis de torn.', topics: [{ label: 'Calor a la sala', tone: 'neg' }, { label: 'Descansos', tone: 'neg' }, { label: 'Ofici i orgull', tone: 'pos' }], doing: 'Ventilació nova a la plataforma de cocció.', alerts: [], trend: [6.8, 6.7, 6.9, 6.8, 6.6, 6.7, 6.5, 6.4, 6.6, 6.5, 6.6, 6.3], survey: true },
  { key: 'malta', name: 'Recepció de malta', area: 'Producció', headcount: 38, responses: 20, score: 6.6, delta: -0.1, participation: 53, mood: 'uneasy', moodLabel: 'Inquiet', story: 'Bon ritme amb la sitja nova, però els torns de cap de setmana preocupen l’equip.', topics: [{ label: 'Caps de setmana', tone: 'neg' }, { label: 'Equip nou', tone: 'pos' }], doing: 'Revisió del calendari de caps de setmana.', alerts: [], trend: [6.7, 6.8, 6.7, 6.8, 6.7, 6.6, 6.7, 6.8, 6.7, 6.6, 6.7, 6.6], survey: true },
  { key: 'fermentacio', name: 'Fermentació', area: 'Producció', headcount: 41, responses: 23, score: 7.0, delta: 0.2, participation: 56, mood: 'happy', moodLabel: 'Content', story: 'Equip petit i ben coordinat. Valoren molt les sessions de formació en qualitat.', topics: [{ label: 'Formació en qualitat', tone: 'pos' }, { label: 'Bon equip', tone: 'pos' }], doing: 'Mantenir les sessions de tast i qualitat.', alerts: [], trend: [6.6, 6.7, 6.7, 6.8, 6.8, 6.9, 6.8, 6.9, 6.9, 6.8, 6.8, 7.0], survey: true },
  { key: 'oficines', name: 'Oficines', area: 'Seu històrica', headcount: 120, responses: 71, score: 7.8, delta: 0.3, participation: 59, mood: 'happy', moodLabel: 'Content', story: 'A l’edifici històric, la flexibilitat horària i la formació mantenen l’equip content. Petita queixa: massa reunions.', topics: [{ label: 'Flexibilitat', tone: 'pos' }, { label: 'Formació', tone: 'pos' }, { label: 'Reunions', tone: 'neu' }], doing: 'Proposta de dimecres sense reunions.', alerts: [], trend: [7.2, 7.3, 7.2, 7.4, 7.5, 7.4, 7.6, 7.5, 7.6, 7.7, 7.5, 7.8], survey: true },
  { key: 'comercial', name: 'Comercial', area: 'Comercial', headcount: 95, responses: 41, score: 7.1, delta: 0.1, participation: 43, mood: 'happy', moodLabel: 'Content', story: 'L’equip se sent bé, però encara participa poca gent: convé confirmar-ho amb més respostes.', topics: [{ label: 'Suport de màrqueting', tone: 'pos' }, { label: 'Desplaçaments', tone: 'neg' }], doing: 'Enquesta mòbil curta en horari de ruta.', alerts: ['Participació del 43%: interpretar amb prudència'], trend: [6.9, 7.0, 6.8, 6.9, 7.0, 7.1, 7.0, 6.9, 7.0, 7.1, 7.0, 7.1], survey: true },
  { key: 'manteniment', name: 'Manteniment', area: 'Manteniment', headcount: 22, responses: 7, score: null, delta: 0, participation: 32, mood: 'nodata', moodLabel: 'Sense dades', story: 'Amb menys de 10 respostes no mostrem cap resultat, per protegir l’anonimat.', topics: [], doing: '', alerts: ['Menys de 10 respostes: mètriques ocultes'], trend: [], survey: true },
  { key: 'jardi', name: 'Jardí de la cervesa', area: 'Recompensa col·lectiva', headcount: 0, responses: 0, score: null, delta: 0, participation: 0, mood: 'lock', moodLabel: 'En obres', story: 'Quan tota la planta arribi al 60% de participació, s’obre el nou jardí de descans per a tothom.', topics: [], doing: '', alerts: [], trend: [], survey: false },
]

export const zoneByKey = (k: ZoneKey) => ZONES.find(z => z.key === k)!
export const SURVEY_ZONES = ZONES.filter(z => z.survey)

export const CHANNELS: { key: ChannelKey; label: string; sub: string; icon: string }[] = [
  { key: 'qr', label: 'QR a planta', sub: 'Cartells a línies, vestidors i menjador', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z' },
  { key: 'app', label: 'Notificació a l’app', sub: 'Avís al mòbil de qui la té instal·lada', icon: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0' },
  { key: 'teams', label: 'Microsoft Teams', sub: 'Canal corporatiu d’equips i xat intern', icon: 'M19.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM22 8h-5a2 2 0 0 0-2 2v2h9v-2a2 2 0 0 0-2-2zM9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm3 1.5H6a3 3 0 0 0-3 3V16h12v-2.5a3 3 0 0 0-3-3z' },
  { key: 'email', label: 'Correu', sub: 'Per a oficines i comercial', icon: 'M4 4h16v16H4zM22 6l-10 7L2 6' },
  { key: 'placa', label: 'La Plaça', sub: 'Parada de l’enquesta destacada', icon: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6' },
  { key: 'world', label: 'Damm World', sub: 'Apareix com a missió de l’equip', icon: 'M2 20V9l6 4V9l6 4V5h4l2 15zM2 20h20' },
]

export const CHANNEL_LABELS: Record<string, string> = {
  qr: 'QR a planta',
  app: 'Notificació a l’app',
  teams: 'Microsoft Teams',
  email: 'Correu',
  placa: 'La Plaça',
  world: 'Damm World',
  whatsapp: 'Grup de WhatsApp',
  telegram: 'Telegram',
  tablet: 'Tauleta al menjador',
}

export const channelLabel = (key: string): string => {
  return CHANNELS.find(x => x.key === key)?.label || CHANNEL_LABELS[key] || key
}

const Q = (id: string, dim: string, type: Question['type'], secs: number, text: string, extra: Partial<Question> = {}): Question => ({ id, dim, type, secs, text, ...extra })

export const SURVEYS: Survey[] = [
  {
    id: 'pols-novembre', title: 'Pols mensual · Novembre', goal: 'Seguiment del clima general', status: 'open',
    zones: SURVEY_ZONES.map(z => z.key), channels: ['qr', 'app', 'teams', 'placa', 'world'],
    questions: [
      Q('p1', 'Benestar', 'faces', 10, 'Com et sents aquesta setmana a la feina?'),
      Q('p2', 'Descans', 'list', 10, 'Has pogut fer els descansos que necessitaves?', { options: ['Sempre', 'Gairebé sempre', 'Poques vegades', 'Mai'] }),
      Q('p3', 'Comunicació', 'scale', 12, 'Del 0 al 10, com valores la comunicació amb el teu equip?'),
      Q('p4', 'Propostes', 'text', 13, 'Hi ha alguna cosa que milloraria el teu dia a dia?'),
    ],
    opensAt: '2026-11-02', closesAt: '2026-11-16', responses: 349, target: 727, createdAt: '2026-10-30',
  },
  {
    id: 'torns', title: 'Torns i descans', goal: 'Impacte del nou sistema de torns', status: 'open',
    zones: ['envasat', 'logistica'], channels: ['qr', 'app', 'teams', 'placa'],
    questions: [
      Q('t1', 'Organització', 'faces', 10, 'Com valores el nou sistema de torns?'),
      Q('t2', 'Descans', 'list', 10, 'Pots fer els descansos complets?', { options: ['Sempre', 'Gairebé sempre', 'Poques vegades', 'Mai'] }),
      Q('t3', 'Benestar', 'scale', 12, 'Del 0 al 10, com d’equilibrat és el repartiment de torns?'),
      Q('t4', 'Propostes', 'text', 13, 'Si poguessis canviar una cosa dels torns, quina seria?'),
    ],
    opensAt: '2026-11-05', closesAt: '2026-11-23', responses: 125, target: 347, createdAt: '2026-11-04',
  },
  {
    id: 'seguiment-pauses', title: 'Seguiment · pauses escalonades', goal: 'Avaluar el pilot de la línia 3', status: 'scheduled',
    zones: ['envasat'], channels: ['qr', 'app'], fromAction: 'a1',
    questions: [
      Q('s1', 'Descans', 'faces', 10, 'Com valores les noves pauses escalonades?'),
      Q('s2', 'Descans', 'yesno', 8, 'Ara pots fer el descans complet?'),
      Q('s3', 'Propostes', 'text', 12, 'Què milloraries del pilot?'),
    ],
    opensAt: '2026-11-24', closesAt: '2026-12-07', responses: 0, target: 48, createdAt: '2026-11-06',
  },
]

// ---------- Banc de preguntes per al generador IA simulat ----------
type BankItem = Omit<Question, 'id'>
export const QUESTION_BANK: Record<string, BankItem[]> = {
  torns: [
    { text: 'Com valores el nou sistema de torns?', alts: ['Com t’has adaptat al nou sistema de torns?'], type: 'faces', dim: 'Organització', secs: 10 },
    { text: 'El calendari de torns et permet planificar la setmana?', alts: ['Saps el teu torn amb prou antelació?'], type: 'list', options: ['Sí, sense problemes', 'Amb alguna dificultat', 'Gairebé mai', 'No'], dim: 'Conciliació', secs: 12 },
    { text: 'Del 0 al 10, com d’equilibrat és el repartiment de torns?', alts: ['Del 0 al 10, com de just és el repartiment de torns de nit?'], type: 'scale', dim: 'Equitat', secs: 12 },
  ],
  descans: [
    { text: 'Pots fer els descansos complets amb el nou sistema?', alts: ['Amb quina freqüència has d’escurçar el descans?'], type: 'list', options: ['Sempre', 'Gairebé sempre', 'Poques vegades', 'Mai'], dim: 'Descans', secs: 10 },
    { text: 'El temps entre torns et permet descansar prou?', alts: ['Has pogut desconnectar els dies de festa?'], type: 'yesno', dim: 'Descans', secs: 8 },
  ],
  estres: [
    { text: 'Del 0 al 10, quin nivell d’estrès has sentit aquest mes?', alts: ['Del 0 al 10, com arribes de cansat/da al final del torn?'], type: 'scale', dim: 'Benestar', secs: 12 },
    { text: 'En quins moments notes més pressió?', alts: ['Els pics de càrrega s’avisen amb prou antelació?'], type: 'list', options: ['Inici de torn', 'Pics de càrrega', 'Canvi de torn', 'Gairebé mai'], dim: 'Càrrega', secs: 12 },
  ],
  conciliacio: [
    { text: 'Com valores l’equilibri entre feina i vida personal?', alts: ['Què t’ajudaria més a conciliar?'], type: 'faces', dim: 'Conciliació', secs: 10 },
  ],
  comunicacio: [
    { text: 'Reps a temps la informació que necessites?', alts: ['Del 0 al 10, com valores la comunicació amb el teu responsable?'], type: 'list', options: ['Sempre', 'Sovint', 'A vegades', 'Mai'], dim: 'Comunicació', secs: 10 },
  ],
  general: [
    { text: 'Com et sents aquesta setmana a la feina?', alts: ['Com valores el teu dia a dia aquest mes?'], type: 'faces', dim: 'Benestar', secs: 8 },
    { text: 'Què és el que més valores del teu equip?', alts: ['Què milloraria més l’ambient del teu equip?'], type: 'list', options: ['Companyonia', 'Responsable', 'Autonomia', 'Aprenentatge'], dim: 'Ambient', secs: 10 },
  ],
  obert: [
    { text: 'Si poguessis canviar una sola cosa, quina seria?', alts: ['Vols afegir alguna cosa més?'], type: 'text', dim: 'Propostes', secs: 13 },
  ],
}
export const KEYWORDS: Record<string, string[]> = {
  torns: ['torn', 'horari', 'rotaci', 'calendari'],
  descans: ['descans', 'pausa', 'cansa', 'fatiga'],
  estres: ['estrès', 'estres', 'pressió', 'càrrega', 'carrega'],
  conciliacio: ['concilia', 'famíl', 'famil', 'personal'],
  comunicacio: ['comunica', 'informació', 'responsable'],
}
export const TEMPLATES = [
  { name: 'Pols mensual', goal: 'Volem fer el seguiment mensual del clima general a tota la planta.' },
  { name: 'Canvi organitzatiu', goal: 'Volem conèixer com afecta el nou sistema de torns a Envasat i Logística, sobretot pel que fa al descans, l’estrès i la conciliació.' },
  { name: 'Seguiment d’una acció', goal: 'Volem fer el seguiment del pilot de pauses escalonades a la línia 3 d’Envasat.' },
  { name: 'Benvinguda', goal: 'Volem saber com han viscut les primeres setmanes les persones que s’han incorporat aquest mes.' },
]

export const INITIATIVES: Initiative[] = [
  { id: 'a1', title: 'Pauses escalonades a la línia 3', problem: 'No es pot fer el descans complet en canvis de torn.', action: 'Pilot de 6 setmanes amb relleu fix per línia.', owner: 'Cap d’Envasat', status: 'encurs', due: '15 des.', kpi: 'Índex de descans ≥ 6,0', zone: 'envasat', fromAI: true },
  { id: 'a2', title: 'Calendari de torns a 4 setmanes', problem: 'Canvis de torn d’última hora.', action: 'Publicar el calendari al tauler digital i per WhatsApp.', owner: 'RRHH · Planificació', status: 'revisio', due: '1 des.', kpi: 'Conciliació +0,5 en 2 mesos', zone: 'envasat', fromAI: true },
  { id: 'a3', title: 'Sincro setmanal Logística–Envasat', problem: 'Pics de càrrega no anticipats.', action: 'Reunió de 15 min cada dilluns entre caps de torn.', owner: 'Cap de Logística', status: 'proposada', due: '30 nov.', kpi: 'Estrès percebut −10%', zone: 'logistica', fromAI: true },
  { id: 'a4', title: 'Sala de descans climatitzada', problem: 'Calor a envasat i menjador saturat.', action: 'Sala nova amb fonts d’aigua i seients.', owner: 'Serveis Generals', status: 'implementada', due: '20 oct.', kpi: 'Mencions sobre calor −50%', zone: 'envasat' },
  { id: 'a5', title: 'Fitxatge més ràpid', problem: 'App de fitxatge lenta en hores punta.', action: 'Servidor actualitzat i mode sense connexió.', owner: 'IT · Aplicacions', status: 'avaluacio', due: '31 oct.', kpi: 'Temps de fitxatge < 5 s', zone: 'logistica' },
  { id: 'a6', title: 'Dimecres sense reunions', problem: 'Volum de reunions creixent.', action: 'Bloquejar els dimecres a la tarda.', owner: 'Direcció de Persones', status: 'proposada', due: '15 gen.', kpi: 'Mencions sobre reunions −30%', zone: 'oficines', fromAI: true },
]

export const AI_RECS = [
  { id: 'r1', title: 'Pauses escalonades a Envasat', why: 'Descans és la dimensió que més cau (−0,7) i concentra 241 mencions.', cta: 'Veure anàlisi', to: '/rrhh/analisi' },
  { id: 'r2', title: 'Microenquesta per al torn de nit', why: '3 preguntes en 30 s, difosa per QR al menjador entre les 2 h i les 4 h.', cta: 'Crear amb IA', to: '/rrhh/crear?plantilla=1' },
  { id: 'r3', title: 'Sincro Logística–Envasat', why: 'Tema emergent a l’alça durant 3 mesos.', cta: 'Veure anàlisi', to: '/rrhh/analisi' },
]

export const PLAZA_TOPICS = [
  { label: 'Descansos', n: 64, trend: 'a l’alça', tone: 'neg' as const },
  { label: 'Bon ambient', n: 51, trend: 'estable', tone: 'pos' as const },
  { label: 'Comunicació', n: 42, trend: 'a l’alça', tone: 'neu' as const },
  { label: 'Torns amb antelació', n: 39, trend: 'a l’alça', tone: 'neg' as const },
  { label: 'Nova sala de descans', n: 33, trend: 'nou', tone: 'pos' as const },
]

export const IDEA_CATEGORIES = ['Descans i torns', 'Comunicació', 'Ambient', 'Seguretat', 'Instal·lacions', 'Altres']

export const HEARD_DID = [
  { heard: 'Fa massa calor a envasat i no hi ha on descansar.', did: 'Hem obert una sala de descans climatitzada amb fonts d’aigua.', status: 'Fet', zone: 'Envasat', date: 'Oct 2026' },
  { heard: 'No podem fer el descans complet quan hi ha canvi de torn.', did: 'Estem provant pauses escalonades a la línia 3 durant 6 setmanes.', status: 'En curs', zone: 'Envasat', date: 'Nov 2026' },
  { heard: 'Fitxar a l’app és lent i fa cua en canvi de torn.', did: 'Hem millorat el servidor i les tauletes funcionen sense connexió.', status: 'Avaluant', zone: 'Logística', date: 'Oct 2026' },
  { heard: 'Els torns es comuniquen massa tard.', did: 'Estem estudiant publicar el calendari amb 4 setmanes d’antelació.', status: 'En revisió', zone: 'Envasat', date: 'Des 2026' },
]

export const REWARDS: Reward[] = [
  { id: 'cafe', name: 'Cafè gratuït', description: 'Cafè o infusió a la cafeteria de la teva planta.', cost: 50, tint: '#FEF0DC', ink: '#B45309', icon: 'M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3' },
  { id: 'snack', name: 'Snack saludable', description: 'Fruita seca, barreta o fruita de temporada.', cost: 60, tint: '#EEF6DD', ink: '#4D7C0F', icon: 'M12 7c-3-3-8-1-8 4 0 6 4 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 6-4 6-10 0-5-5-7-8-4zM12 7c0-2 1-4 3-5' },
  { id: 'beguda', name: 'Beguda sense alcohol', description: 'Refresc, aigua amb gas o cervesa 0,0.', cost: 80, tint: '#E0F0FB', ink: '#1D4ED8', icon: 'M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3zM8 13h8' },
  { id: 'esmorzar', name: 'Esmorzar complet', description: 'Entrepà i beguda a la cafeteria.', cost: 150, tint: '#E6F6EE', ink: '#15803D', icon: 'M3 11a9 5 0 0 1 18 0zM3 11h18l-1 3H4zM5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3' },
  { id: 'visita', name: 'Visita a l’antiga fàbrica', description: 'Visita guiada per a tu i un acompanyant.', cost: 300, tint: '#FDE3E6', ink: '#A50D26', icon: 'M2 20V9l6 4V9l6 4V5h4l2 15zM2 20h20' },
  { id: 'solidari', name: 'Donació solidària', description: 'Convertim punts en una donació a una entitat local.', cost: 100, tint: '#E3F4F1', ink: '#0F766E', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z' },
]

export const AI_SUMMARIES = [
  { zone: 'Envasat', title: 'Els torns rotatius concentren el malestar', body: 'El 38% dels comentaris mencionen el nou sistema de torns: poc descans entre canvis i dificultat per planificar la vida familiar. Es valora la companyonia a línia.', confidence: 0.86, n: 69 },
  { zone: 'Logística', title: 'Tensió en els pics de càrrega', body: 'L’estrès s’associa als pics de divendres i a la coordinació amb Envasat. Es proposa una reunió curta setmanal conjunta.', confidence: 0.78, n: 88 },
  { zone: 'Oficines', title: 'Tendència positiva sostinguda', body: 'La flexibilitat horària i el pla de formació expliquen la millora. Tema emergent: volum de reunions.', confidence: 0.81, n: 71 },
  { zone: 'Manteniment', title: 'Mostra insuficient', body: 'Només 7 respostes. No es genera cap resum per evitar conclusions no representatives i protegir l’anonimat.', confidence: 0, n: 7 },
]

export const TOPICS = [
  { label: 'Torns i horaris', n: 312, s: -0.42 },
  { label: 'Descansos', n: 241, s: -0.31 },
  { label: 'Companyonia', n: 198, s: 0.64 },
  { label: 'Comunicació interna', n: 176, s: -0.12 },
  { label: 'Formació', n: 121, s: 0.38 },
  { label: 'Seguretat', n: 98, s: 0.21 },
  { label: 'Conciliació', n: 94, s: -0.28 },
]

export const DIMENSIONS = ['Benestar', 'Descans', 'Comunicació', 'Reconeixement', 'Conciliació', 'Seguretat']
export const HEAT: Partial<Record<ZoneKey, number[]>> = {
  envasat: [5.5, 4.8, 5.8, 6.2, 5.1, 7.4],
  logistica: [5.2, 4.9, 5.3, 5.9, 5.5, 7.0],
  coccio: [6.2, 5.4, 6.3, 6.6, 6.0, 7.6],
  malta: [6.6, 6.1, 6.4, 6.7, 6.2, 7.8],
  fermentacio: [7.0, 6.6, 7.0, 7.1, 6.8, 8.0],
  oficines: [7.9, 7.4, 7.1, 7.2, 8.2, 8.4],
  comercial: [7.0, 6.6, 6.8, 7.3, 6.4, 7.9],
}

export const SKINS = ['#FFE6D3', '#F6D7C3', '#EFC3A1', '#D9A074', '#B57A52', '#5E3B26']
export const HAIRS = ['#2E1F17', '#5A3A22', '#A8642F', '#D9B15A', '#1D1D24', '#8B8B92']
export const SHIRTS = ['#C8102E', '#1E2A44', '#F4EFE6', '#7A0C1E', '#3A3532', '#B08A45']
export const HAIR_STYLES = ['Curt', 'Melena', 'Arrissat', 'Monyo']

// ---------- La Plaça: participació setmanal i pregunta del dia ----------
// La Festa de la Plaça és setmanal (es reinicia cada dilluns) i compta PERSONES, no clics:
// cada persona compta un cop per setmana si respon la pregunta del dia, fa "+1 Jo també" o deixa una idea.
// Les enquestes formals no la omplen (tenen el seu propi flux i les missions de Damm World).
export const PLAZA_MILESTONES = [
  { at: 25, label: 'Garlandes', mark: '✓' },
  { at: 40, label: 'Bancs nous', mark: '✓' },
  { at: 60, label: 'Concert', mark: '♪' },
  { at: 75, label: 'Focs', mark: '★' },
]
/** Persones úniques que han participat a la Plaça aquesta setmana (dada sintètica de la demo, sense comptar-te a tu). */
export const PLAZA_WEEK_BASE = 436
/** Participació de la setmana passada, per comparar. */
export const PLAZA_LAST_WEEK = 61

export const DAILY_QUESTIONS: import('./types').DailyQuestion[] = [
  { id: 'torn', text: 'Com ha anat el torn avui?', options: [{ key: 'be', label: 'Bé', emoji: '😊', n: 118 }, { key: 'normal', label: 'Normal', emoji: '😐', n: 64 }, { key: 'dur', label: 'Dur', emoji: '😟', n: 30 }] },
  { id: 'pausa', text: 'Què prefereixes: una pausa llarga o dues de curtes?', options: [{ key: 'llarga', label: 'Una de llarga', emoji: '☕', n: 97 }, { key: 'curtes', label: 'Dues de curtes', emoji: '⏱️', n: 121 }] },
  { id: 'info', text: 'T’han arribat a temps els canvis de torn aquesta setmana?', options: [{ key: 'si', label: 'Sí', emoji: '👍', n: 102 }, { key: 'mitges', label: 'A mitges', emoji: '🤏', n: 71 }, { key: 'no', label: 'No', emoji: '👎', n: 38 }] },
  { id: 'equip', text: 'Com et sents amb el teu equip aquesta setmana?', options: [{ key: 'be', label: 'Bé', emoji: '😊', n: 141 }, { key: 'normal', label: 'Normal', emoji: '😐', n: 52 }, { key: 'malament', label: 'Malament', emoji: '😟', n: 17 }] },
  { id: 'sala', text: 'Què milloraries primer de la sala de descans?', options: [{ key: 'seients', label: 'Seients', emoji: '🛋️', n: 58 }, { key: 'cafe', label: 'Cafè i aigua', emoji: '☕', n: 77 }, { key: 'silenci', label: 'Silenci', emoji: '🤫', n: 41 }, { key: 'taquilles', label: 'Taquilles', emoji: '🔐', n: 33 }] },
  { id: 'descans', text: 'Has pogut desconnectar entre torns?', options: [{ key: 'si', label: 'Sí', emoji: '😌', n: 88 }, { key: 'poc', label: 'Poc', emoji: '😐', n: 79 }, { key: 'no', label: 'No', emoji: '😩', n: 46 }] },
  { id: 'escoltat', text: 'Aquesta setmana t’has sentit escoltat/da?', options: [{ key: 'si', label: 'Sí', emoji: '👂', n: 109 }, { key: 'mitges', label: 'A mitges', emoji: '🤏', n: 66 }, { key: 'no', label: 'No', emoji: '🙉', n: 31 }] },
]
