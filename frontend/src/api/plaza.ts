import type { Avatar, Idea } from '../data/types'
import type { PlazaWeek } from '../store/AppContext'
export interface PlazaState { avatar: Avatar; ideas: Idea[]; plaza: Omit<PlazaWeek, 'pct' | 'goal' | 'next'> }
async function call<T>(path: string, data: object): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Request': '1' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) })
  if (r.status === 401) window.dispatchEvent(new Event('auth-expired'))
  const result = await r.json().catch(() => null)
  if (!r.ok || !result) throw new Error(result?.error || 'No s’ha pogut connectar amb PostgreSQL.')
  return result as T
}
export const plazaCall = (action: string, data: object = {}) => call<PlazaState>(`/api/app/${action}`, data)
export const hrPlazaCall = <T>(data: object) => call<T>('/api/hr/plaza', data)
