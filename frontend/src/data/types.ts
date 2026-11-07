export type ZoneKey =
  | 'malta' | 'coccio' | 'fermentacio' | 'envasat' | 'logistica'
  | 'oficines' | 'comercial' | 'manteniment' | 'jardi'

export type Weather = 'sun' | 'part' | 'rain' | 'fog' | 'lock'

export interface Zone {
  key: ZoneKey
  name: string
  area: string
  headcount: number
  responses: number
  score: number | null
  delta: number
  participation: number
  weather: Weather
  weatherLabel: string
  story: string
  topics: { label: string; tone: 'pos' | 'neg' | 'neu' }[]
  doing: string
  alerts: string[]
  trend: number[]
  survey: boolean // false per a espais que no són col·lectius (jardí)
}

export type QType = 'faces' | 'list' | 'scale' | 'yesno' | 'text'

export interface Question {
  id: string
  text: string
  type: QType
  dim: string
  secs: number
  options?: string[]
  alts?: string[]
  /** Escala amb límits propis (per defecte 0–10) */
  min?: number
  max?: number
  help?: string
  required?: boolean
  /** Tipus original a PostgreSQL quan la pregunta ve de la base de dades */
  dbType?: 'scale' | 'single_choice' | 'multi_choice' | 'boolean' | 'open_text'
}

export type SurveyStatus = 'draft' | 'scheduled' | 'open' | 'closed'

export type ChannelKey = 'qr' | 'app' | 'teams' | 'email' | 'placa' | 'world' | 'whatsapp' | 'telegram' | 'tablet'

export interface Survey {
  id: string
  title: string
  goal: string
  status: SurveyStatus
  zones: ZoneKey[]
  questions: Question[]
  channels: ChannelKey[]
  opensAt: string
  closesAt: string
  responses: number
  target: number
  createdAt: string
  fromAction?: string
  /** Dades de la publicació via n8n (WF-01 / WF-02) */
  n8nId?: string
  intro?: string
  formUrl?: string
  qrUrl?: string
  /** Enquesta servida per PostgreSQL a l'app del treballador (WF-05) */
  source?: 'db'
  /** Token d'un sol ús per enviar la resposta */
  accessToken?: string
}

export interface Idea {
  id: string
  category: string
  text: string
  status: 'moderant' | 'publicada'
  at: number
}

export type ActionStatus = 'proposada' | 'revisio' | 'encurs' | 'implementada' | 'avaluacio'

export interface Initiative {
  id: string
  title: string
  problem: string
  action: string
  owner: string
  status: ActionStatus
  due: string
  kpi: string
  zone: ZoneKey | 'tots'
  fromAI?: boolean
}

export interface Avatar {
  skin: number
  hair: number
  shirt: number
  style: number
  logo: boolean
}

export interface Reward {
  id: string
  name: string
  description: string
  cost: number
  tint: string
  ink: string
  icon: string
}
