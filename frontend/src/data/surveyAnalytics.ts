import type { ChannelKey, Question, Survey, ZoneKey } from './types'

export type ShiftType = 'mati' | 'tarda' | 'nit' | 'flexible'
export type SentimentType = 'positiu' | 'neutre' | 'negatiu'

export interface FormResponse {
  id: string
  formId: string
  submittedAt: string // ISO string
  zone: ZoneKey
  shift: ShiftType
  channel: ChannelKey
  sentiment: SentimentType
  durationSeconds: number
  answers: Record<string, string | number | boolean>
  comment?: string
  commentCategory?: string
}

export interface AnalyticsFormConfig extends Survey {
  category: 'Clima' | 'Operacions' | 'Seguretat' | 'Talent' | 'Organització'
  description: string
  version: string
}

export interface FilterOptions {
  formId?: string
  dateRange?: 'all' | '7d' | '30d' | '90d'
  zone?: ZoneKey | 'all'
  shift?: ShiftType | 'all'
  channel?: ChannelKey | 'all'
  sentiment?: SentimentType | 'all'
  searchQuery?: string
}

// ---------------------------------------------------------------------------
// CATÀLEG DE FORMULARIS
// ---------------------------------------------------------------------------

const Q = (
  id: string,
  dim: string,
  type: Question['type'],
  secs: number,
  text: string,
  extra: Partial<Question> = {},
): Question => ({ id, dim, type, secs, text, ...extra })

export const ANALYTICS_FORMS: AnalyticsFormConfig[] = [
  {
    id: 'pols-novembre',
    title: 'Pols mensual · Novembre 2026',
    category: 'Clima',
    goal: 'Seguiment periòdic del benestar, descans i comunicació a fàbriques i oficines.',
    description: 'Enquesta periòdica general amb indicador de satisfacció, comunicació interna i suport.',
    status: 'open',
    version: 'v2.4',
    zones: ['envasat', 'logistica', 'coccio', 'malta', 'fermentacio', 'oficines', 'comercial', 'manteniment'],
    channels: ['qr', 'app', 'teams', 'placa', 'world'],
    opensAt: '2026-11-01',
    closesAt: '2026-11-20',
    responses: 349,
    target: 727,
    createdAt: '2026-10-28',
    questions: [
      Q('p1', 'Benestar', 'faces', 10, 'Com et sents aquesta setmana a la feina?', {
        options: ['Molt bé', 'Bé', 'Regular', 'Malament'],
      }),
      Q('p2', 'Descans', 'list', 10, 'Has pogut fer els descansos que necessitaves?', {
        options: ['Sempre', 'Gairebé sempre', 'Poques vegades', 'Mai'],
      }),
      Q('p3', 'Comunicació', 'scale', 12, 'Del 0 al 10, com valores la comunicació amb el teu equip?', {
        min: 0,
        max: 10,
      }),
      Q('p4', 'Lideratge', 'faces', 10, 'Com valores el suport i confiança de la teva coordinació?', {
        options: ['Molt bona', 'Bona', 'Millorable', 'Deficient'],
      }),
      Q('p5', 'Cultura', 'yesno', 8, 'Recomanaries Damm com un bon lloc per treballar als teus coneguts?'),
      Q('p6', 'Propostes', 'text', 15, 'Hi ha alguna cosa concreta que milloraria el teu dia a dia?'),
    ],
  },
  {
    id: 'torns',
    title: 'Torns, Descans i Conciliació a Planta',
    category: 'Operacions',
    goal: 'Avaluar l’impacte dels torns rotatius de 8h i els temps de recuperació física.',
    description: 'Enquesta centrada en les línies de producció i magatzem sobre calendaris i sobrecàrrega.',
    status: 'open',
    version: 'v1.2',
    zones: ['envasat', 'logistica', 'coccio'],
    channels: ['qr', 'app', 'teams', 'placa'],
    opensAt: '2026-11-04',
    closesAt: '2026-11-25',
    responses: 198,
    target: 347,
    createdAt: '2026-11-02',
    questions: [
      Q('t1', 'Organització', 'faces', 10, 'Com valores l’adaptació al nou sistema de torns?', {
        options: ['Molt fàcil', 'Fàcil', 'Dura', 'Molt dura'],
      }),
      Q('t2', 'Planificació', 'list', 12, 'Amb quanta antelació coneixes els teus horaris de torn?', {
        options: ['Més de 2 setmanes', '1 setmana', 'Pocs dies', 'Sense previsió'],
      }),
      Q('t3', 'Equitat', 'scale', 12, 'Del 0 al 10, com de just trobes el repartiment de nits i caps de setmana?', {
        min: 0,
        max: 10,
      }),
      Q('t4', 'Descans', 'yesno', 8, 'El descans entre torns et permet desconnectar i recuperar-te completament?'),
      Q('t5', 'Càrrega', 'scale', 12, 'Del 0 al 10, quin nivell d’esgotament físic notes en canvis de torn?', {
        min: 0,
        max: 10,
      }),
      Q('t6', 'Millores', 'text', 15, 'Quina mesura específica sobre torns o pauses consideres més urgent?'),
    ],
  },
  {
    id: 'seguretat-industrial',
    title: 'Seguretat i Prevenció de Riscos a Planta',
    category: 'Seguretat',
    goal: 'Auditoria de seguretat, EPIs, climatització i protocols operatius.',
    description: 'Diagnòstic de condicions ergonòmiques, equips de protecció i detecció de riscos.',
    status: 'open',
    version: 'v1.0',
    zones: ['envasat', 'logistica', 'coccio', 'malta', 'fermentacio', 'manteniment'],
    channels: ['qr', 'app', 'teams'],
    opensAt: '2026-10-20',
    closesAt: '2026-11-15',
    responses: 245,
    target: 332,
    createdAt: '2026-10-18',
    questions: [
      Q('s1', 'Seguretat', 'scale', 10, 'Del 0 al 10, com de segura consideres la teva línia o estació de feina?', {
        min: 0,
        max: 10,
      }),
      Q('s2', 'EPIs', 'list', 10, 'Disposes dels EPIs necessaris, nets i homologats en tot moment?', {
        options: ['Sempre disponibles', 'Gairebé sempre', 'De vegades en falten', 'Freqüentment falten'],
      }),
      Q('s3', 'Prevenció', 'yesno', 8, 'Has rebut formació pràctica de prevenció en els darrers 6 mesos?'),
      Q('s4', 'Condicions', 'faces', 10, 'Com valores les condicions de temperatura, soroll i ventilació a la zona?', {
        options: ['Molt bones', 'Acceptables', 'Molestes', 'Insuportables'],
      }),
      Q('s5', 'Riscos', 'text', 15, 'Has detectat algun risc ergonòmic, punts cecs o incidències pendents?'),
    ],
  },
  {
    id: 'onboarding-talent',
    title: 'Experiència d’Acollida i Onboarding',
    category: 'Talent',
    goal: 'Acompanyament i valoració de les incorporacions dels darrers mesos.',
    description: 'Enquesta breu als nous membres sobre rebuda, tutorització i recursos inicials.',
    status: 'open',
    version: 'v1.1',
    zones: ['envasat', 'logistica', 'coccio', 'oficines', 'comercial'],
    channels: ['app', 'teams', 'email', 'qr'],
    opensAt: '2026-10-15',
    closesAt: '2026-11-30',
    responses: 112,
    target: 140,
    createdAt: '2026-10-12',
    questions: [
      Q('o1', 'Acollida', 'faces', 10, 'Com valores la teva experiència d’acollida durant el primer mes?', {
        options: ['Excel·lent', 'Bona', 'Regular', 'Millorable'],
      }),
      Q('o2', 'Formació', 'scale', 12, 'Del 0 al 10, la formació tècnica rebuda ha estat clara i suficient?', {
        min: 0,
        max: 10,
      }),
      Q('o3', 'Acompanyament', 'list', 10, 'El suport del teu tutor/a o companys de línia ha estat constant?', {
        options: ['Constant i excel·lent', 'Puntual però útil', 'Poc present', 'He hagut d’espavilar-me sol'],
      }),
      Q('o4', 'Recursos', 'yesno', 8, 'Tens accés a totes les eines, armariets i aplicacions necessàries?'),
      Q('o5', 'Feedback', 'text', 15, 'Què trobes a faltar o què simplificaries del procés d’onboarding?'),
    ],
  },
  {
    id: 'conciliacio-oficines',
    title: 'Flexibilitat, Eines Digitals i Oficines',
    category: 'Organització',
    goal: 'Mesurar la conciliació en el model híbrid i la reducció de reunions.',
    description: 'Enquesta enfocada a la seu central, finances, màrqueting, IT i equips comercials.',
    status: 'open',
    version: 'v2.0',
    zones: ['oficines', 'comercial'],
    channels: ['teams', 'email', 'app'],
    opensAt: '2026-10-25',
    closesAt: '2026-11-18',
    responses: 164,
    target: 215,
    createdAt: '2026-10-22',
    questions: [
      Q('c1', 'Flexibilitat', 'scale', 10, 'Del 0 al 10, com valores la flexibilitat d’horaris i teletreball?', {
        min: 0,
        max: 10,
      }),
      Q('c2', 'Reunions', 'faces', 10, 'El volum de reunions diari et permet concentrar-te en tasques clau?', {
        options: ['Molt fluid', 'Acceptable', 'Excessiu', 'Molt saturat'],
      }),
      Q('c3', 'Eines', 'list', 10, 'Les eines col·laboratives i digitals funcionen de manera àgil?', {
        options: ['Molt àgils', 'Correctes', 'De vegades lentes', 'Presents problemes greus'],
      }),
      Q('c4', 'Reconeixement', 'scale', 12, 'Del 0 al 10, sents que la teva feina i esforç són valorats?', {
        min: 0,
        max: 10,
      }),
      Q('c5', 'Propostes', 'text', 15, 'Quina millora operativa o de benestar proposaries per a oficines?'),
    ],
  },
]

// ---------------------------------------------------------------------------
// GENERADOR DE RESPOSTES SINTÈTIQUES DETERMINISTA
// ---------------------------------------------------------------------------

function makePrng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const COMMENTS_POOL: Record<string, { text: string; sentiment: SentimentType; cat: string }[]> = {
  'pols-novembre': [
    { text: 'Molt bon ambient a la línia 3, però la calor a migdia encara és notable.', sentiment: 'positiu', cat: 'Instal·lacions' },
    { text: 'Els caps de torn escolten més que abans, bona iniciativa.', sentiment: 'positiu', cat: 'Lideratge' },
    { text: 'Necessitem que els torns de nit tinguin el mateix accés al servei de cafeteria.', sentiment: 'negatiu', cat: 'Serveis' },
    { text: 'Els descansos de 15 minuts són massa justos si s’ha d’anar fins al menjador.', sentiment: 'negatiu', cat: 'Descansos' },
    { text: 'La comunicació per l’app ha millorat moltíssim la previsió setmanal.', sentiment: 'positiu', cat: 'Comunicació' },
    { text: 'Torn de tarda molt carregat els divendres, falten mans de reforç.', sentiment: 'neutre', cat: 'Càrrega' },
    { text: 'Caldria canviar els seients de la sala de descans de la planta baixa.', sentiment: 'neutre', cat: 'Instal·lacions' },
    { text: 'Orgullós de la marca i de la qualitat del que fem cada dia.', sentiment: 'positiu', cat: 'Cultura' },
  ],
  torns: [
    { text: 'L’antelació de 4 dies per saber el torn de dissabte és inacceptable per conciliar.', sentiment: 'negatiu', cat: 'Planificació' },
    { text: 'El canvi de nit a matí deixa només 24 hores de descans i el cos ho nota molt.', sentiment: 'negatiu', cat: 'Descans' },
    { text: 'Les noves pauses escalonades han donat una mica d’aire a la línia d’envasat.', sentiment: 'positiu', cat: 'Descans' },
    { text: 'Agrairia un calendari tancat de torns amb un mínim de 3 setmanes de vista.', sentiment: 'neutre', cat: 'Planificació' },
    { text: 'A logística patim pics de feina imprevisibles els divendres al vespre.', sentiment: 'negatiu', cat: 'Càrrega' },
    { text: 'El suport entre companys de línia compensa el ritme fort.', sentiment: 'positiu', cat: 'Equip' },
    { text: 'La rotació hauria de ser més equitativa entre els equips fixes i flotants.', sentiment: 'neutre', cat: 'Equitat' },
  ],
  'seguretat-industrial': [
    { text: 'Falta revisió de les reixetes del terra al moll 4, rellisquen quan es neteja.', sentiment: 'negatiu', cat: 'Manteniment' },
    { text: 'Els nous guants ergonòmics per a manipulació de caixes són molt millors.', sentiment: 'positiu', cat: 'EPIs' },
    { text: 'La formació de carretilles ha estat molt pràctica i necessària.', sentiment: 'positiu', cat: 'Formació' },
    { text: 'El soroll ambiental a la zona d’omplidores supera els decibels recomanats.', sentiment: 'negatiu', cat: 'Soroll' },
    { text: 'Molt bona reacció dels equips de seguretat davant la petita fuita de vapor.', sentiment: 'positiu', cat: 'Prevenció' },
    { text: 'Caldria més il·luminació als passos de vianants entre naus.', sentiment: 'neutre', cat: 'Instal·lacions' },
  ],
  'onboarding-talent': [
    { text: 'El tutor que em va tocar m’ha ensenyat el funcionament de la màquina amb paciència.', sentiment: 'positiu', cat: 'Acompanyament' },
    { text: 'El primer dia vaig haver d’esperar 3 hores per tenir les taquilles i les sabates.', sentiment: 'negatiu', cat: 'Material' },
    { text: 'Molt bona presentació de la cultura de Damm i dels valors cervesers.', sentiment: 'positiu', cat: 'Cultura' },
    { text: 'L’app mòbil per a treballadors és molt intuïtiva i fa fàcil consultar-ho tot.', sentiment: 'positiu', cat: 'Eines' },
    { text: 'Caldria un manual resumit de protocols en paper per consultar ràpidament.', sentiment: 'neutre', cat: 'Formació' },
  ],
  'conciliacio-oficines': [
    { text: 'El model híbrid funciona molt bé, però els dimecres hi ha una acumulació boja de reunions.', sentiment: 'neutre', cat: 'Reunions' },
    { text: 'Agrairia poder flexibilitzar l’entrada entre les 7:30 i les 9:30.', sentiment: 'positiu', cat: 'Horaris' },
    { text: 'La iniciativa de dimecres sense reunions a la tarda s’hauria d’aplicar de debò.', sentiment: 'negatiu', cat: 'Reunions' },
    { text: 'Molt bones eines i suport tècnic per part de l’equip de sistemes.', sentiment: 'positiu', cat: 'IT' },
    { text: 'L’ambient a l’edifici històric és genial per col·laborar.', sentiment: 'positiu', cat: 'Cultura' },
  ],
}

export function generateAllResponses(): FormResponse[] {
  const all: FormResponse[] = []
  const rand = makePrng(42817)

  const shifts: ShiftType[] = ['mati', 'mati', 'tarda', 'tarda', 'nit', 'flexible']
  const fallbackChannels: ChannelKey[] = ['qr', 'qr', 'app', 'app', 'teams', 'email', 'placa']

  // Per cada formulari del catàleg
  ANALYTICS_FORMS.forEach(form => {
    const totalResponses = form.responses
    const commentsList = COMMENTS_POOL[form.id] || COMMENTS_POOL['pols-novembre']
    const baseDate = new Date(form.opensAt).getTime()
    const endDate = new Date(form.closesAt).getTime()
    const span = Math.max(86400000, endDate - baseDate)

    for (let i = 0; i < totalResponses; i++) {
      const zone = form.zones[Math.floor(rand() * form.zones.length)]
      const shift = shifts[Math.floor(rand() * shifts.length)]
      const channel = form.channels?.length ? form.channels[Math.floor(rand() * form.channels.length)] : fallbackChannels[Math.floor(rand() * fallbackChannels.length)]
      
      // Data simulada progressiva amb pics a mitja campanya
      const timeOffset = Math.pow(rand(), 0.8) * span
      const subDate = new Date(baseDate + timeOffset)

      // Generació de respostes a preguntes
      const answers: Record<string, string | number | boolean> = {}
      let scoreSum = 0
      let scaleCount = 0

      form.questions.forEach(q => {
        if (q.type === 'scale') {
          // Biaix lleuger segons torn i zona
          let mean = 7.2
          if (shift === 'nit') mean -= 1.3
          if (zone === 'envasat' || zone === 'logistica') mean -= 0.8
          if (zone === 'oficines' || zone === 'fermentacio') mean += 0.9

          const noise = (rand() - 0.5) * 3
          const val = Math.max(0, Math.min(10, Math.round(mean + noise)))
          answers[q.id] = val
          scoreSum += val
          scaleCount++
        } else if (q.type === 'faces') {
          const opts = q.options || ['Molt bé', 'Bé', 'Regular', 'Malament']
          const r = rand()
          // 45% bo, 30% neutre, 15% molt bo, 10% negatiu
          const idx = r < 0.25 ? 0 : r < 0.65 ? 1 : r < 0.88 ? 2 : 3
          answers[q.id] = opts[Math.min(idx, opts.length - 1)]
        } else if (q.type === 'list') {
          const opts = q.options || ['Opció 1', 'Opció 2', 'Opció 3']
          const r = rand()
          const idx = Math.floor(Math.pow(r, 1.2) * opts.length)
          answers[q.id] = opts[Math.min(idx, opts.length - 1)]
        } else if (q.type === 'yesno') {
          // Majoritàriament afirmatiu (65-80%)
          answers[q.id] = rand() < 0.72
        } else if (q.type === 'text') {
          // El 40% deixa un comentari de text obert
          if (rand() < 0.42) {
            const commentObj = commentsList[Math.floor(rand() * commentsList.length)]
            answers[q.id] = commentObj.text
          }
        }
      })

      // Determinar sentiment agregat
      const avgScale = scaleCount > 0 ? scoreSum / scaleCount : 7.0
      let sentiment: SentimentType = 'positiu'
      if (avgScale < 5.2) sentiment = 'negatiu'
      else if (avgScale < 7.0) sentiment = 'neutre'

      const hasComment = typeof answers[form.questions.find(q => q.type === 'text')?.id || ''] === 'string'
      const commentText = hasComment ? (answers[form.questions.find(q => q.type === 'text')!.id] as string) : undefined
      const commentObj = commentsList.find(c => c.text === commentText)

      all.push({
        id: `resp_${form.id}_${i + 1}`,
        formId: form.id,
        submittedAt: subDate.toISOString(),
        zone,
        shift,
        channel,
        sentiment: commentObj ? commentObj.sentiment : sentiment,
        durationSeconds: Math.round(25 + rand() * 65),
        answers,
        comment: commentText,
        commentCategory: commentObj?.cat,
      })
    }
  })

  return all
}

export const ALL_RESPONSES = generateAllResponses()

// ---------------------------------------------------------------------------
// MOTOR DE FILTRATGE I MÈTRIQUES AGREGADES
// ---------------------------------------------------------------------------

export interface AggregateStats {
  totalResponses: number
  target: number
  participationRate: number
  avgScore: number
  npsScore: number
  avgDurationSecs: number
  sentimentBreakdown: {
    positiu: { count: number; pct: number }
    neutre: { count: number; pct: number }
    negatiu: { count: number; pct: number }
  }
  channelBreakdown: { channel: ChannelKey; label: string; count: number; pct: number }[]
  shiftBreakdown: { shift: ShiftType; label: string; count: number; pct: number }[]
  zoneBreakdown: { zone: ZoneKey; name: string; count: number; avgScore: number }[]
  timeline: { date: string; count: number; cumulative: number; avgScore: number }[]
  dimensionRadar: { dimension: string; score: number; benchmark: number }[]
  questionBreakdown: QuestionMetric[]
  comments: {
    id: string
    text: string
    zone: ZoneKey
    shift: ShiftType
    submittedAt: string
    sentiment: SentimentType
    category?: string
  }[]
  isSuppressed: boolean
}

export interface QuestionMetric {
  question: Question
  totalAnswers: number
  avgScore?: number
  optionsBreakdown: { label: string; count: number; pct: number }[]
  shiftComparison?: { shift: ShiftType; label: string; avgScoreOrTop: string | number }[]
  zoneComparison?: { zone: ZoneKey; label: string; count: number; avgScore?: number }[]
}

const SHIFT_LABELS: Record<ShiftType, string> = {
  mati: 'Matí (06:00 - 14:00)',
  tarda: 'Tarda (14:00 - 22:00)',
  nit: 'Nit (22:00 - 06:00)',
  flexible: 'Central / Flexible',
}

const CHANNEL_LABELS_MAP: Record<ChannelKey, string> = {
  qr: 'QR a planta',
  app: 'App Treballador',
  teams: 'Microsoft Teams',
  email: 'Correu corporatiu',
  placa: 'La Plaça (3D/Punt)',
  world: 'Damm World',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  tablet: 'Tauleta menjador',
}

export function filterAndAggregateForm(
  form: AnalyticsFormConfig,
  filters: FilterOptions,
  allResponses: FormResponse[] = ALL_RESPONSES,
): AggregateStats {
  const now = new Date('2026-11-20T23:59:59Z').getTime()

  // 1. Filtratge de respostes
  const filtered = allResponses.filter(r => {
    if (r.formId !== form.id) return false

    // Filtre de dates
    if (filters.dateRange && filters.dateRange !== 'all') {
      const t = new Date(r.submittedAt).getTime()
      const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
      if (now - t > days * 86400000) return false
    }

    // Filtre de zona
    if (filters.zone && filters.zone !== 'all' && r.zone !== filters.zone) return false

    // Filtre de torn
    if (filters.shift && filters.shift !== 'all' && r.shift !== filters.shift) return false

    // Filtre de canal
    if (filters.channel && filters.channel !== 'all' && r.channel !== filters.channel) return false

    // Filtre de sentiment
    if (filters.sentiment && filters.sentiment !== 'all' && r.sentiment !== filters.sentiment) return false

    // Cerca lliure en text
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      const matchesComment = r.comment?.toLowerCase().includes(q)
      const matchesZone = r.zone.toLowerCase().includes(q)
      if (!matchesComment && !matchesZone) return false
    }

    return true
  })

  const n = filtered.length
  // k-anonimato: Mínim 5 respostes per mostrar resultats agregats sense revelar identitats
  const isSuppressed = n < 5

  if (isSuppressed) {
    return {
      totalResponses: n,
      target: form.target,
      participationRate: Math.round((n / Math.max(1, form.target)) * 100),
      avgScore: 0,
      npsScore: 0,
      avgDurationSecs: 0,
      sentimentBreakdown: {
        positiu: { count: 0, pct: 0 },
        neutre: { count: 0, pct: 0 },
        negatiu: { count: 0, pct: 0 },
      },
      channelBreakdown: [],
      shiftBreakdown: [],
      zoneBreakdown: [],
      timeline: [],
      dimensionRadar: [],
      questionBreakdown: [],
      comments: [],
      isSuppressed: true,
    }
  }

  // 2. Mètriques globals
  let totalScoreSum = 0
  let totalScoreCount = 0
  let promoters = 0
  let detractors = 0
  let durationSum = 0

  const sentCount = { positiu: 0, neutre: 0, negatiu: 0 }
  const chanCount = new Map<ChannelKey, number>()
  const shiftCount = new Map<ShiftType, number>()
  const zoneStats = new Map<ZoneKey, { count: number; scoreSum: number; scoreCount: number }>()

  filtered.forEach(r => {
    durationSum += r.durationSeconds
    sentCount[r.sentiment] = (sentCount[r.sentiment] || 0) + 1
    chanCount.set(r.channel, (chanCount.get(r.channel) || 0) + 1)
    shiftCount.set(r.shift, (shiftCount.get(r.shift) || 0) + 1)

    const z = zoneStats.get(r.zone) || { count: 0, scoreSum: 0, scoreCount: 0 }
    z.count += 1

    // Extreure escales per mitjana general
    form.questions.forEach(q => {
      if (q.type === 'scale' && typeof r.answers[q.id] === 'number') {
        const val = r.answers[q.id] as number
        totalScoreSum += val
        totalScoreCount++
        z.scoreSum += val
        z.scoreCount++

        if (val >= 9) promoters++
        else if (val <= 6) detractors++
      }
    })
    zoneStats.set(r.zone, z)
  })

  const avgScore = totalScoreCount > 0 ? Math.round((totalScoreSum / totalScoreCount) * 10) / 10 : 7.2
  const npsScore = totalScoreCount > 0 ? Math.round(((promoters - detractors) / totalScoreCount) * 100) : 18
  const avgDurationSecs = Math.round(durationSum / n)

  // 3. Desglossaments
  const channelBreakdown = Array.from(chanCount.entries())
    .map(([channel, count]) => ({
      channel,
      label: CHANNEL_LABELS_MAP[channel] || channel,
      count,
      pct: Math.round((count / n) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const shiftBreakdown = (['mati', 'tarda', 'nit', 'flexible'] as ShiftType[])
    .map(shift => {
      const count = shiftCount.get(shift) || 0
      return {
        shift,
        label: SHIFT_LABELS[shift].split(' ')[0],
        count,
        pct: Math.round((count / n) * 100),
      }
    })
    .filter(s => s.count > 0)

  const zoneBreakdown = Array.from(zoneStats.entries())
    .map(([zone, st]) => ({
      zone,
      name: zone.charAt(0).toUpperCase() + zone.slice(1),
      count: st.count,
      avgScore: st.scoreCount > 0 ? Math.round((st.scoreSum / st.scoreCount) * 10) / 10 : avgScore,
    }))
    .sort((a, b) => b.count - a.count)

  // 4. Línia temporal (agrupació per dia)
  const byDay = new Map<string, { count: number; scoreSum: number; scoreN: number }>()
  filtered.forEach(r => {
    const day = r.submittedAt.slice(0, 10)
    const cur = byDay.get(day) || { count: 0, scoreSum: 0, scoreN: 0 }
    cur.count++
    form.questions.forEach(q => {
      if (q.type === 'scale' && typeof r.answers[q.id] === 'number') {
        cur.scoreSum += r.answers[q.id] as number
        cur.scoreN++
      }
    })
    byDay.set(day, cur)
  })

  const sortedDays = Array.from(byDay.keys()).sort()
  let runningCumulative = 0
  const timeline = sortedDays.map(day => {
    const item = byDay.get(day)!
    runningCumulative += item.count
    return {
      date: new Date(day).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }),
      count: item.count,
      cumulative: runningCumulative,
      avgScore: item.scoreN > 0 ? Math.round((item.scoreSum / item.scoreN) * 10) / 10 : avgScore,
    }
  })

  // 5. Radar de dimensions
  const dimsMap = new Map<string, { sum: number; count: number }>()
  form.questions.forEach(q => {
    dimsMap.set(q.dim, { sum: 0, count: 0 })
  })

  filtered.forEach(r => {
    form.questions.forEach(q => {
      const dimEntry = dimsMap.get(q.dim)
      if (!dimEntry) return

      if (q.type === 'scale' && typeof r.answers[q.id] === 'number') {
        dimEntry.sum += r.answers[q.id] as number
        dimEntry.count++
      } else if (q.type === 'faces') {
        const val = r.answers[q.id]
        const score = val === 'Molt bé' || val === 'Excel·lent' || val === 'Molt bona' || val === 'Molt fàcil' ? 9.5
          : val === 'Bé' || val === 'Bona' || val === 'Fàcil' ? 7.8
          : val === 'Regular' || val === 'Millorable' || val === 'Dura' ? 5.2 : 3.0
        dimEntry.sum += score
        dimEntry.count++
      } else if (q.type === 'yesno') {
        dimEntry.sum += r.answers[q.id] ? 8.5 : 4.0
        dimEntry.count++
      }
    })
  })

  const dimensionRadar = Array.from(dimsMap.entries())
    .filter(([_, d]) => d.count > 0)
    .map(([dimension, d]) => {
      const score = Math.round((d.sum / d.count) * 10) / 10
      // Benchmark general de Damm
      const benchmark = Math.round((score * 0.95 + 0.3) * 10) / 10
      return { dimension, score, benchmark }
    })

  // 6. Desglossament per pregunta
  const questionBreakdown: QuestionMetric[] = form.questions.map(q => {
    const validAnswers = filtered.map(r => r.answers[q.id]).filter(v => v !== undefined && v !== null && v !== '')
    const totalAnswers = validAnswers.length

    if (q.type === 'scale') {
      const numAnswers = validAnswers.filter((v): v is number => typeof v === 'number')
      const sum = numAnswers.reduce((a, b) => a + b, 0)
      const qAvg = numAnswers.length > 0 ? Math.round((sum / numAnswers.length) * 10) / 10 : 0

      // Distribució per trams (0-4 molt baix, 5-6 mitjà, 7-8 bo, 9-10 excel·lent)
      const bins = [
        { label: 'Excel·lent (9-10)', count: numAnswers.filter(v => v >= 9).length },
        { label: 'Notable (7-8)', count: numAnswers.filter(v => v >= 7 && v <= 8).length },
        { label: 'Moderat (5-6)', count: numAnswers.filter(v => v >= 5 && v <= 6).length },
        { label: 'Crític (0-4)', count: numAnswers.filter(v => v <= 4).length },
      ]

      const optionsBreakdown = bins.map(b => ({
        label: b.label,
        count: b.count,
        pct: totalAnswers > 0 ? Math.round((b.count / totalAnswers) * 100) : 0,
      }))

      // Comparativa per torns
      const shiftComparison = (['mati', 'tarda', 'nit', 'flexible'] as ShiftType[])
        .map(sh => {
          const shVals = filtered
            .filter(r => r.shift === sh && typeof r.answers[q.id] === 'number')
            .map(r => r.answers[q.id] as number)
          const shAvg = shVals.length > 0 ? Math.round((shVals.reduce((a, b) => a + b, 0) / shVals.length) * 10) / 10 : 0
          return {
            shift: sh,
            label: SHIFT_LABELS[sh].split(' ')[0],
            avgScoreOrTop: shAvg,
          }
        })
        .filter(s => s.avgScoreOrTop > 0)

      return {
        question: q,
        totalAnswers,
        avgScore: qAvg,
        optionsBreakdown,
        shiftComparison,
      }
    } else if (q.type === 'faces' || q.type === 'list') {
      const counts = new Map<string, number>()
      validAnswers.forEach(v => {
        const str = String(v)
        counts.set(str, (counts.get(str) || 0) + 1)
      })

      const options = q.options || Array.from(counts.keys())
      const optionsBreakdown = options.map(opt => {
        const count = counts.get(opt) || 0
        return {
          label: opt,
          count,
          pct: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
        }
      })

      return {
        question: q,
        totalAnswers,
        optionsBreakdown,
      }
    } else if (q.type === 'yesno') {
      const yesCount = validAnswers.filter(v => v === true).length
      const noCount = totalAnswers - yesCount
      const optionsBreakdown = [
        { label: 'Sí', count: yesCount, pct: totalAnswers > 0 ? Math.round((yesCount / totalAnswers) * 100) : 0 },
        { label: 'No', count: noCount, pct: totalAnswers > 0 ? Math.round((noCount / totalAnswers) * 100) : 0 },
      ]

      return {
        question: q,
        totalAnswers,
        optionsBreakdown,
      }
    } else {
      // Text
      return {
        question: q,
        totalAnswers,
        optionsBreakdown: [
          { label: 'Comentaris aportats', count: totalAnswers, pct: Math.round((totalAnswers / Math.max(1, n)) * 100) },
        ],
      }
    }
  })

  // 7. Llista de comentaris de text
  const comments = filtered
    .filter(r => r.comment && r.comment.trim().length > 0)
    .map(r => ({
      id: r.id,
      text: r.comment!,
      zone: r.zone,
      shift: r.shift,
      submittedAt: r.submittedAt,
      sentiment: r.sentiment,
      category: r.commentCategory,
    }))

  return {
    totalResponses: n,
    target: form.target,
    participationRate: Math.round((n / Math.max(1, form.target)) * 100),
    avgScore,
    npsScore,
    avgDurationSecs,
    sentimentBreakdown: {
      positiu: { count: sentCount.positiu, pct: Math.round((sentCount.positiu / n) * 100) },
      neutre: { count: sentCount.neutre, pct: Math.round((sentCount.neutre / n) * 100) },
      negatiu: { count: sentCount.negatiu, pct: Math.round((sentCount.negatiu / n) * 100) },
    },
    channelBreakdown,
    shiftBreakdown,
    zoneBreakdown,
    timeline,
    dimensionRadar,
    questionBreakdown,
    comments,
    isSuppressed: false,
  }
}

// ---------------------------------------------------------------------------
// EXPORTADOR CSV
// ---------------------------------------------------------------------------

export function exportResponsesCsv(form: AnalyticsFormConfig, _stats?: AggregateStats): void {
  const headers = ['ID', 'Data', 'Zona', 'Torn', 'Canal', 'Sentiment', 'Durada(s)']
  form.questions.forEach((q, idx) => {
    headers.push(`P${idx + 1}: ${q.text.replace(/,/g, ' ')}`)
  })

  // CSV content
  const rows: string[] = [headers.join(',')]

  const responses = ALL_RESPONSES.filter(r => r.formId === form.id)
  responses.forEach(r => {
    const row = [
      r.id,
      r.submittedAt.slice(0, 10),
      r.zone,
      r.shift,
      r.channel,
      r.sentiment,
      r.durationSeconds,
    ]

    form.questions.forEach(q => {
      const val = r.answers[q.id]
      if (val === undefined || val === null) {
        row.push('')
      } else if (typeof val === 'boolean') {
        row.push(val ? 'Sí' : 'No')
      } else {
        row.push(`"${String(val).replace(/"/g, '""')}"`)
      }
    })

    rows.push(row.join(','))
  })

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `damm_analitica_${form.id}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
