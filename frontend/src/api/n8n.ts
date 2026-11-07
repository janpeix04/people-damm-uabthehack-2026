/**
 * Client dels workflows d'n8n per crear enquestes:
 *  - WF-01 `POST /webhook/generate-survey` → proposta de microconsulta generada per IA
 *  - WF-02 `POST /webhook/publish-survey`  → publicació (Typeform/QR/Teams) amb aprovació humana
 */
import { SURVEY_ZONES } from '../data/mock'
import type { Question, ZoneKey } from '../data/types'

const BASE = (import.meta.env.VITE_N8N_WEBHOOK_BASE ?? '/webhook').replace(/\/$/, '')
const TIMEOUT_MS = 60_000

export const COLECTIUS = ['Planta', 'Logística', 'Comercial', 'Oficina', 'Manager'] as const
export type Colectiu = (typeof COLECTIUS)[number]

export type N8nQuestionType = 'escala_1_5' | 'text_obert' | 'opcion_multiple'

export interface N8nQuestion {
  id: string
  enunciado: string
  tipo: N8nQuestionType | string
  escala?: { min: number; max: number; etiqueta_min?: string; etiqueta_max?: string }
  opciones?: string[]
  obligatoria?: boolean
}

export interface N8nSurvey {
  titulo: string
  introduccion_transparencia?: string
  colectivo?: string
  centre_tipus?: string
  canal_sugerido?: string
  idioma?: string
  estimacion_segundos?: number
  preguntas: N8nQuestion[]
  logica_condicional?: unknown[]
}

export interface GenerateInput {
  objetivo: string
  colectiu: Colectiu
  centre_tipus?: string
  durada_max: number
  restriccions?: string
  idioma: string
}

export interface GenerateResponse {
  success: boolean
  survey_id: string
  estado: string
  approved_by_human: boolean
  survey: N8nSurvey
  control_calidad?: { anti_sesgo_warnings?: string[] }
}

export interface PublishInput {
  approved_by_human: boolean
  approved_by: string
  survey_id: string
  survey: N8nSurvey
}

export interface PublishResponse {
  success: boolean
  status: string
  message?: string
  survey_id: string
  publicacion?: { form_id?: string; form_url?: string; qr_code_url?: string; canal_distribucion?: string }
}

export class N8nError extends Error {
  constructor(message: string, readonly status?: number) { super(message) }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } catch {
    throw new N8nError(ctrl.signal.aborted ? 'n8n ha trigat massa a respondre' : 'No s’ha pogut connectar amb n8n')
  } finally {
    clearTimeout(timer)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || (res.status === 404 ? 'El workflow d’n8n no està actiu' : `n8n ha respost ${res.status}`)
    throw new N8nError(String(msg), res.status)
  }
  if (!data) throw new N8nError('Resposta buida d’n8n')
  return data as T
}

export async function generateSurvey(input: GenerateInput): Promise<GenerateResponse> {
  const r = await post<GenerateResponse>('generate-survey', input)
  if (!r.survey || !Array.isArray(r.survey.preguntas)) throw new N8nError('La IA no ha retornat preguntes vàlides')
  return r
}

export function publishSurvey(input: PublishInput): Promise<PublishResponse> {
  return post<PublishResponse>('publish-survey', input)
}

/* ---------- Mapejadors entre el format d'n8n i el del frontend ---------- */

const YESNO = ['Sí', 'No', 'No ho sé']

/** `p1_descans` → "Descans"; `preg_2` / `p3` → "General". */
function dimFromId(id: string): string {
  const w = id.replace(/^p(reg)?_?\d+_?/i, '').split('_')[0]
  return w && !/^\d+$/.test(w) ? w[0].toUpperCase() + w.slice(1) : 'General'
}

export function toQuestion(p: N8nQuestion, i: number): Question {
  const id = `${p.id || `p${i + 1}`}-${Date.now().toString(36)}${i}`
  const base = { id, text: p.enunciado, dim: dimFromId(p.id || '') }
  if (p.tipo === 'text_obert' || p.tipo === 'texto_abierto') return { ...base, type: 'text', secs: 20 }
  if (p.tipo === 'opcion_multiple' && p.opciones?.length) return { ...base, type: 'list', secs: 10, options: p.opciones.map(String) }
  // escala_1_5 (i qualsevol altre): 5 cares = escala de 5 punts
  return { ...base, type: 'faces', secs: 10 }
}

export function toN8nQuestion(q: Question, i: number): N8nQuestion {
  const id = `p${i + 1}_${q.dim.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_')}`
  const base = { id, enunciado: q.text }
  switch (q.type) {
    case 'text': return { ...base, tipo: 'text_obert', obligatoria: false }
    case 'list': return { ...base, tipo: 'opcion_multiple', opciones: q.options ?? [], obligatoria: true }
    case 'yesno': return { ...base, tipo: 'opcion_multiple', opciones: YESNO, obligatoria: true }
    default: return { ...base, tipo: 'escala_1_5', escala: { min: 1, max: 5 }, obligatoria: true }
  }
}

const ZONE_COLECTIU: Record<ZoneKey, Colectiu> = {
  malta: 'Planta', coccio: 'Planta', fermentacio: 'Planta', envasat: 'Planta', manteniment: 'Planta',
  logistica: 'Logística', oficines: 'Oficina', comercial: 'Comercial', jardi: 'Planta',
}

/** Col·lectiu amb més plantilla entre les zones triades (Planta si no n'hi ha cap). */
export function zonesToColectiu(zones: ZoneKey[]): Colectiu {
  const total: Partial<Record<Colectiu, number>> = {}
  SURVEY_ZONES.filter(z => zones.includes(z.key)).forEach(z => {
    const c = ZONE_COLECTIU[z.key]
    total[c] = (total[c] ?? 0) + z.headcount
  })
  return (Object.entries(total).sort((a, b) => b[1] - a[1])[0]?.[0] as Colectiu) ?? 'Planta'
}
