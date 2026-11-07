/**
 * API de l'app del treballador (WF-05 a n8n → PostgreSQL).
 *  - POST /webhook/app/wallet → monedero anònim, enquestes pendents i saldo
 *  - POST /webhook/app/submit → resposta anònima (una per persona i enquesta)
 *  - POST /webhook/app/redeem → bescanvi de recompenses
 *
 * El dispositiu guarda un token aleatori (monedero). El servidor només en desa el hash,
 * i les respostes es guarden sense cap vincle amb aquest token.
 */
import type { Question, QType, Reward, Survey } from '../data/types'

const BASE = (import.meta.env.VITE_N8N_WEBHOOK_BASE ?? '/webhook').replace(/\/$/, '')
const WALLET_KEY = 'damm-pulse-wallet'
const TIMEOUT_MS = 15_000

export type AppErrorCode =
  | 'invalid_wallet' | 'unknown_wallet' | 'no_people_available' | 'not_invited'
  | 'already_answered' | 'invalid_token' | 'unknown_reward' | 'insufficient_points'
  | 'server_error' | 'network_error'

export class AppApiError extends Error {
  constructor(public code: AppErrorCode) { super(code) }
}

interface DbQuestion {
  id: string
  key: string
  type: 'scale' | 'single_choice' | 'multi_choice' | 'boolean' | 'open_text'
  required: boolean
  min: number | null
  max: number | null
  prompt: string
  help: string | null
  options: string[]
  dimension: string | null
}

interface DbSurvey {
  id: string
  title: string
  introduction: string | null
  transparency_notice: string | null
  opens_at: string | null
  closes_at: string | null
  estimated_seconds: number
  access_token: string
  questions: DbQuestion[]
}

export interface WalletState {
  points: number
  points_per_survey: number
  answered: { id: string; title: string }[]
  redeemed: { id: string; name: string; code: string }[]
  rewards: Reward[]
}

export function walletToken(): string {
  try {
    const saved = localStorage.getItem(WALLET_KEY)
    if (saved && /^[0-9a-f]{64}$/.test(saved)) return saved
  } catch { /* sense emmagatzematge */ }
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  try { localStorage.setItem(WALLET_KEY, token) } catch { /* sense emmagatzematge */ }
  return token
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: walletToken(), ...body }),
      signal: ctrl.signal,
    })
  } catch {
    throw new AppApiError('network_error')
  } finally {
    clearTimeout(timer)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw new AppApiError((data?.error as AppErrorCode) ?? (res.status === 404 ? 'network_error' : 'server_error'))
  return data as T
}

const QTYPE: Record<DbQuestion['type'], QType> = { scale: 'scale', single_choice: 'list', multi_choice: 'list', boolean: 'yesno', open_text: 'text' }
const SECS: Record<QType, number> = { scale: 8, faces: 6, list: 10, yesno: 6, text: 20 }

function toSurvey(db: DbSurvey): Survey {
  const questions: Question[] = db.questions.map(q => {
    const type = QTYPE[q.type] ?? 'text'
    return {
      id: q.id,
      text: q.prompt,
      type,
      dim: q.dimension ?? '',
      secs: SECS[type],
      options: q.type === 'boolean' ? undefined : q.options,
      min: q.min ?? undefined,
      max: q.max ?? undefined,
      help: q.help ?? undefined,
      required: q.required,
      dbType: q.type,
    }
  })
  return {
    id: db.id,
    title: db.title,
    goal: '',
    intro: db.introduction ?? undefined,
    status: 'open',
    zones: [],
    questions,
    channels: ['app'],
    opensAt: db.opens_at ?? new Date().toISOString(),
    closesAt: db.closes_at ?? new Date().toISOString(),
    responses: 0,
    target: 0,
    createdAt: db.opens_at ?? new Date().toISOString(),
    source: 'db',
    accessToken: db.access_token,
  }
}

/** Converteix les respostes del SurveyRunner al format de submit_survey_response. */
function toAnswers(questions: Question[], ans: Record<string, unknown>) {
  const out: Record<string, unknown>[] = []
  for (const q of questions) {
    const v = ans[q.id]
    if (v === undefined || v === null) continue
    if (q.dbType === 'open_text') {
      const text = String(v).trim()
      if (text) out.push({ question_id: q.id, free_text: text })
    } else if (q.dbType === 'scale') {
      out.push({ question_id: q.id, numeric_value: Number(v) })
    } else if (q.dbType === 'boolean') {
      if (v === 0 || v === 1) out.push({ question_id: q.id, choice_value: v === 0 }) // "No ho sé" no s'envia
    } else {
      const option = q.options?.[Number(v)]
      if (option !== undefined) out.push({ question_id: q.id, choice_value: q.dbType === 'multi_choice' ? [option] : option })
    }
  }
  return out
}

export async function openWallet(): Promise<WalletState & { surveys: Survey[] }> {
  const data = await post<WalletState & { surveys: DbSurvey[] }>('/app/wallet', { locale: 'ca' })
  return { ...data, surveys: data.surveys.map(toSurvey) }
}

export async function submitSurvey(s: Survey, ans: Record<string, unknown>, durationSeconds: number) {
  return post<WalletState & { earned: number }>('/app/submit', {
    survey: s.id,
    access_token: s.accessToken,
    answers: toAnswers(s.questions, ans),
    locale: 'ca',
    duration_seconds: Math.round(durationSeconds),
  })
}

export async function redeemReward(rewardId: string) {
  return post<WalletState & { code: string; reward_name: string }>('/app/redeem', { reward: rewardId })
}

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  invalid_wallet: 'No hem pogut identificar aquest dispositiu.',
  unknown_wallet: 'No hem pogut identificar aquest dispositiu.',
  no_people_available: 'Ara mateix no hi ha places disponibles a la demo.',
  not_invited: 'Aquesta enquesta no és per al teu col·lectiu.',
  already_answered: 'Ja has contestat aquesta enquesta. Gràcies!',
  invalid_token: 'L’enllaç d’aquesta enquesta ha caducat. Torna-la a obrir des de l’inici.',
  unknown_reward: 'Aquesta recompensa ja no està disponible.',
  insufficient_points: 'No tens prou punts per a aquesta recompensa.',
  server_error: 'Hi ha hagut un error. Torna-ho a provar.',
  network_error: 'Sense connexió amb el servidor. Torna-ho a provar.',
}
