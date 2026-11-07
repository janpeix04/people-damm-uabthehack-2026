import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BASE_RESPONSES, FESTA_GOAL, INITIATIVES, REWARDS, SURVEYS, TOTAL_HEADCOUNT } from '../data/mock'
import type { ActionStatus, Avatar, Idea, Initiative, Reward, Survey } from '../data/types'
import { AppApiError, openWallet, redeemReward, submitSurvey as submitSurveyApi, type WalletState } from '../api/app'

export const POINTS_PER_SURVEY = 50

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

/** Estat de l'app del treballador servit per PostgreSQL (WF-05). */
interface Remote extends WalletState {
  surveys: Survey[]
}

type Redeemed = Persisted['redeemed']

interface Ctx extends Persisted {
  festa: { responses: number; pct: number; goal: number; missing: number }
  /** 'db' quan l'app parla amb PostgreSQL; 'local' si no hi ha connexió (demo al navegador). */
  backend: 'loading' | 'db' | 'local'
  pending: Survey[]
  rewards: Reward[]
  answeredList: { id: string; title: string }[]
  findSurvey: (id: string) => Survey | undefined
  isAnswered: (id: string) => boolean
  /** Envia una enquesta i retorna els punts guanyats. Llança AppApiError si el servidor la rebutja. */
  submitSurvey: (s: Survey, answers: Record<string, unknown>, durationSeconds: number) => Promise<number>
  /** Bescanvia una recompensa i retorna el codi. Llança AppApiError si no es pot. */
  redeemReward: (r: Reward) => Promise<string>
  refreshWallet: () => Promise<void>
  addSurvey: (s: Survey) => void
  setSurveyStatus: (id: string, status: Survey['status']) => void
  addIdea: (category: string, text: string) => void
  setInitiativeStatus: (id: string, status: ActionStatus) => void
  setAvatar: (a: Avatar) => void
  resetDemo: () => void
  toast: (msg: string) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const [remote, setRemote] = useState<Remote | null>(null)
  const [backend, setBackend] = useState<Ctx['backend']>('loading')

  const refreshWallet = useCallback(async () => {
    try {
      const w = await openWallet()
      setRemote(w)
      setBackend('db')
    } catch (e) {
      // Sense backend (p. ex. només `npm run dev`): l'app continua en mode demo local.
      if (!(e instanceof AppApiError) || e.code === 'network_error' || e.code === 'server_error') setBackend(b => (b === 'db' ? b : 'local'))
    }
  }, [])

  useEffect(() => { refreshWallet() }, [refreshWallet])

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
      backend,
      // Amb base de dades, només les enquestes que aquesta persona encara no ha contestat.
      pending: remote ? remote.surveys : st.surveys.filter(s => s.status === 'open' && !st.answered.includes(s.id)),
      points: remote ? remote.points : st.points,
      redeemed: remote ? remote.redeemed : st.redeemed,
      rewards: remote ? remote.rewards : REWARDS,
      answeredList: remote
        ? remote.answered
        : st.surveys.filter(s => st.answered.includes(s.id)).map(s => ({ id: s.id, title: s.title })),
      findSurvey: id => remote?.surveys.find(s => s.id === id) ?? st.surveys.find(s => s.id === id),
      isAnswered: id => (remote ? remote.answered.some(a => a.id === id) : st.answered.includes(id)),
      submitSurvey: async (s, answers, durationSeconds) => {
        if (s.source === 'db') {
          const res = await submitSurveyApi(s, answers, durationSeconds)
          setRemote(r => (r ? { ...res, surveys: r.surveys.filter(x => x.id !== s.id) } : r))
          setSt(p => ({ ...p, extra: p.extra + 1 }))
          return res.earned
        }
        const first = !st.answered.includes(s.id)
        setSt(p => ({
          ...p,
          extra: p.extra + 1,
          // Els punts premien participar (un cop per enquesta), mai el contingut.
          points: p.answered.includes(s.id) ? p.points : p.points + POINTS_PER_SURVEY,
          answered: p.answered.includes(s.id) ? p.answered : [...p.answered, s.id],
          surveys: p.surveys.map(x => (x.id === s.id ? { ...x, responses: x.responses + 1 } : x)),
        }))
        return first ? POINTS_PER_SURVEY : 0
      },
      redeemReward: async r => {
        if (remote) {
          const res = await redeemReward(r.id)
          setRemote(prev => (prev ? { ...res, surveys: prev.surveys } : prev))
          return res.code
        }
        if (st.points < r.cost) throw new AppApiError('insufficient_points')
        const code = `DP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        setSt(p => ({ ...p, points: p.points - r.cost, redeemed: [{ id: r.id, name: r.name, code }, ...p.redeemed] as Redeemed }))
        return code
      },
      refreshWallet,
      addSurvey: s => setSt(p => ({ ...p, surveys: [s, ...p.surveys] })),
      setSurveyStatus: (id, status) => setSt(p => ({ ...p, surveys: p.surveys.map(s => (s.id === id ? { ...s, status } : s)) })),
      addIdea: (category, text) => {
        const id = `idea-${Date.now()}`
        setSt(p => ({ ...p, ideas: [{ id, category, text, status: 'moderant', at: Date.now() }, ...p.ideas] }))
        setTimeout(() => setSt(p => ({ ...p, ideas: p.ideas.map(i => (i.id === id ? { ...i, status: 'publicada' } : i)) })), 6000)
      },
      setInitiativeStatus: (id, status) => setSt(p => ({ ...p, initiatives: p.initiatives.map(i => (i.id === id ? { ...i, status } : i)) })),
      setAvatar: avatar => setSt(p => ({ ...p, avatar })),
      resetDemo: () => setSt(DEFAULTS),
      toast,
    }
  }, [st, toast, remote, backend, refreshWallet])

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
