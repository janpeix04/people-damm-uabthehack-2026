import type { Survey } from '../data/types'
import type { AggregateStats } from '../data/surveyAnalytics'

async function request<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api/hr/surveys${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-App-Request': '1' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  }).catch(() => { throw new Error('No es pot connectar amb la base de dades.') })
  if (res.status === 401) window.dispatchEvent(new Event('auth-expired'))
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw new Error(data?.error || 'No es pot carregar la informació de RRHH.')
  return data as T
}
export const listHrSurveys = () => request<Survey[]>()
export const saveHrSurvey = (survey: Survey, approved_by_human = false, editId?: string) => request<Survey>(editId ? `/${encodeURIComponent(editId)}` : '', editId ? 'PUT' : 'POST', { survey, approved_by_human })
export const updateHrStatus = (id: string, status: Survey['status'], approved_by_human = false) => request<Survey>(`/${encodeURIComponent(id)}/status`, 'PATCH', { status, approved_by_human })

export async function fetchSurveyAnalytics(params: Record<string, string | undefined>): Promise<AggregateStats> {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== 'all') q.set(k, v)
  }
  const res = await fetch(`/api/hr/enquestes-analytics?${q.toString()}`, {
    headers: { 'Content-Type': 'application/json', 'X-App-Request': '1' },
    signal: AbortSignal.timeout(15000),
  }).catch(() => { throw new Error('No es pot connectar amb la base de dades.') })
  if (res.status === 401) window.dispatchEvent(new Event('auth-expired'))
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw new Error(data?.error || 'Error calculant analítiques de la base de dades.')
  return data as AggregateStats
}
