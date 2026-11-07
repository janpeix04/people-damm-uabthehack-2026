import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BASE_RESPONSES, FESTA_GOAL, INITIATIVES, SURVEYS, TOTAL_HEADCOUNT } from '../data/mock'
import type { ActionStatus, Avatar, Idea, Initiative, Survey } from '../data/types'

interface Persisted {
  surveys: Survey[]
  answered: string[]
  extra: number
  ideas: Idea[]
  initiatives: Initiative[]
  avatar: Avatar
  points: number
  redeemed: { id: string; name: string; code: string }[]
}

const KEY = 'damm-pulse-demo-v2'
const DEFAULTS: Persisted = {
  surveys: SURVEYS,
  answered: [],
  extra: 0,
  ideas: [],
  initiatives: INITIATIVES,
  avatar: { skin: 1, hair: 0, shirt: 0, style: 0, logo: true },
  points: 420,
  redeemed: [],
}

function sanitizeSurvey(s: Survey): Survey {
  return {
    ...s,
    channels: (s.channels || []).map(c => {
      const str = c as string
      if (str === 'whatsapp' || str === 'telegram' || str === 'tablet') {
        return 'teams'
      }
      return c
    }),
  }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        ...DEFAULTS,
        ...data,
        surveys: Array.isArray(data.surveys) ? data.surveys.map(sanitizeSurvey) : DEFAULTS.surveys,
      }
    }
  } catch { /* emmagatzematge no disponible */ }
  return DEFAULTS
}

interface Ctx extends Persisted {
  festa: { responses: number; pct: number; goal: number; missing: number }
  pending: Survey[]
  addSurvey: (s: Survey) => void
  setSurveyStatus: (id: string, status: Survey['status']) => void
  submitResponse: (id: string) => void
  addIdea: (category: string, text: string) => void
  setInitiativeStatus: (id: string, status: ActionStatus) => void
  setAvatar: (a: Avatar) => void
  redeem: (id: string, name: string, cost: number) => string | null
  resetDemo: () => void
  toast: (msg: string) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* sense emmagatzematge */ }
  }, [st])

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  const value = useMemo<Ctx>(() => {
    const responses = BASE_RESPONSES + st.extra
    const target = Math.ceil(TOTAL_HEADCOUNT * FESTA_GOAL)
    return {
      ...st,
      festa: { responses, pct: (responses / TOTAL_HEADCOUNT) * 100, goal: FESTA_GOAL * 100, missing: Math.max(0, target - responses) },
      pending: st.surveys.filter(s => s.status === 'open' && !st.answered.includes(s.id)),
      addSurvey: s => setSt(p => ({ ...p, surveys: [s, ...p.surveys] })),
      setSurveyStatus: (id, status) => setSt(p => ({ ...p, surveys: p.surveys.map(s => (s.id === id ? { ...s, status } : s)) })),
      submitResponse: id => setSt(p => ({
        ...p,
        extra: p.extra + 1,
        answered: p.answered.includes(id) ? p.answered : [...p.answered, id],
        surveys: p.surveys.map(s => (s.id === id ? { ...s, responses: s.responses + 1 } : s)),
      })),
      addIdea: (category, text) => {
        const id = `idea-${Date.now()}`
        setSt(p => ({ ...p, ideas: [{ id, category, text, status: 'moderant', at: Date.now() }, ...p.ideas] }))
        setTimeout(() => setSt(p => ({ ...p, ideas: p.ideas.map(i => (i.id === id ? { ...i, status: 'publicada' } : i)) })), 6000)
      },
      setInitiativeStatus: (id, status) => setSt(p => ({ ...p, initiatives: p.initiatives.map(i => (i.id === id ? { ...i, status } : i)) })),
      setAvatar: avatar => setSt(p => ({ ...p, avatar })),
      redeem: (id, name, cost) => {
        if (st.points < cost) return null
        const code = `DP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        setSt(p => ({ ...p, points: p.points - cost, redeemed: [{ id, name, code }, ...p.redeemed] }))
        return code
      },
      resetDemo: () => setSt(DEFAULTS),
      toast,
    }
  }, [st, toast])

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-28 md:bottom-8 z-[100] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="rounded-[14px] bg-ink text-white px-4 py-3 text-sm font-semibold shadow-lift max-w-[90vw]">{t.msg}</div>
        ))}
      </div>
    </AppCtx.Provider>
  )
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp ha de ser dins d’AppProvider')
  return c
}
