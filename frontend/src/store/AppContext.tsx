import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BASE_RESPONSES, FESTA_GOAL, INITIATIVES, PLAZA_MILESTONES, SURVEYS, TOTAL_HEADCOUNT } from '../data/mock'
import type { ActionStatus, Avatar, DailyQuestion, Idea, Initiative, Reward, Survey } from '../data/types'
import { AppApiError, openWallet, redeemReward, submitSurvey as submitSurveyApi, type WalletState } from '../api/app'
import { plazaCall, type PlazaState } from '../api/plaza'
import { listHrSurveys, saveHrSurvey, updateHrStatus } from '../api/hr'

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
  /** La Plaça: la teva participació d'aquesta setmana (compta un cop per persona i setmana). */
  plaza: PlazaMine
}

interface PlazaMine {
  week: string
  joined: boolean
  reacted: number[]
  daily: { day: string; answer: string } | null
}

// ---------- La Plaça: setmana i pregunta del dia ----------
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** Clau de la setmana: el dilluns. La Festa es reinicia cada dilluns. */
const weekKey = (d = new Date()) => { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(m) }
const freshPlaza = (): PlazaMine => ({ week: weekKey(), joined: false, reacted: [], daily: null })

export interface PlazaWeek {
  participants: number
  headcount: number
  pct: number
  goal: number
  joined: boolean
  lastWeek: number
  /** Propera fita encara no aconseguida (o null si ja s'han aconseguit totes). */
  next: { at: number; label: string; missing: number } | null
  /** Dies que falten perquè es reiniciï (dilluns). */
  resetsIn: number
  reacted: number[]
  question: DailyQuestion | null
  myAnswer: string | null
  /** Resultat agregat d'avui; null si encara no hi ha prou respostes per mostrar-lo. */
  results: { key: string; label: string; emoji: string; n: number; pct: number }[] | null
  todayTotal: number
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
  plaza: freshPlaza(),
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
        // setmana nova: la Festa torna a començar
        plaza: data.plaza && data.plaza.week === weekKey() ? { ...freshPlaza(), ...data.plaza } : freshPlaza(),
      }
    }
  } catch { /* emmagatzematge no disponible */ }
  return DEFAULTS
}

/** Estat de l'app del treballador servit per PostgreSQL (WF-05). */
interface Remote extends WalletState {
  surveys: Survey[]
}



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
  hrSurveys: Survey[]
  hrLoading: boolean
  hrError: string | null
  refreshHr: () => Promise<void>
  addSurvey: (s: Survey, approved?: boolean, editId?: string) => Promise<Survey>
  setSurveyStatus: (id: string, status: Survey['status'], approved?: boolean) => Promise<void>
  /** La Plaça d'aquesta setmana (participació única, fites i pregunta del dia). */
  plazaError: string | null
  plazaLoading: boolean
  refreshPlaza: () => Promise<void>
  plazaWeek: PlazaWeek
  /** Respon la pregunta del dia (un cop al dia). */
  answerDaily: (key: string) => Promise<void>
  /** "+1 Jo també" en una bafarada de la Plaça. */
  reactTopic: (index: number, on: boolean) => void
  addIdea: (category: string, text: string) => Promise<void>
  setInitiativeStatus: (id: string, status: ActionStatus) => void
  setAvatar: (a: Avatar) => Promise<void>
  resetDemo: () => void
  toast: (msg: string) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const [remote, setRemote] = useState<Remote | null>(null)
  const [backend, setBackend] = useState<Ctx['backend']>('loading')
  const [plazaRemote, setPlazaRemote] = useState<PlazaState | null>(null)
  const [plazaError, setPlazaError] = useState<string | null>(null)
  const [plazaLoading, setPlazaLoading] = useState(true)
  const refreshPlaza = useCallback(async () => {
    try { setPlazaRemote(await plazaCall('state')); setPlazaError(null) }
    catch (e) { setPlazaError(e instanceof Error ? e.message : 'Error de connexio') }
    finally { setPlazaLoading(false) }
  }, [])
  useEffect(() => { void refreshPlaza(); const timer = setInterval(() => void refreshPlaza(), 30000); return () => clearInterval(timer) }, [refreshPlaza])
  const [hrSurveys, setHrSurveys] = useState<Survey[]>([])
  const [hrLoading, setHrLoading] = useState(true)
  const [hrError, setHrError] = useState<string | null>(null)
  const refreshHr = useCallback(async () => {
    setHrLoading(true)
    try { setHrSurveys(await listHrSurveys()); setHrError(null) }
    catch (e) { setHrError(e instanceof Error ? e.message : 'Error carregant enquestes') }
    finally { setHrLoading(false) }
  }, [])
  useEffect(() => { void refreshHr() }, [refreshHr])

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

    const data = plazaRemote?.plaza
    const participants = data?.participants ?? 0
    const headcount = data?.headcount ?? 0
    const pct = headcount ? participants / headcount * 100 : 0
    const nx = PLAZA_MILESTONES.find(m => pct < m.at)
    const plazaWeek: PlazaWeek = {
      participants, headcount, pct, goal: 60, joined: data?.joined ?? false, lastWeek: data?.lastWeek ?? 0,
      next: nx ? { at: nx.at, label: nx.label, missing: Math.max(0, Math.ceil(headcount * nx.at / 100) - participants) } : null,
      resetsIn: data?.resetsIn ?? 7, reacted: data?.reacted ?? [], question: data?.question ?? null,
      myAnswer: data?.myAnswer ?? null, results: data?.results ?? null, todayTotal: data?.todayTotal ?? 0,
    }
    const mutatePlaza = async (action: string, payload: object) => {
      try { setPlazaRemote(await plazaCall(action, payload)); setPlazaError(null) }
      catch (e) { setPlazaError(e instanceof Error ? e.message : 'Error de connexio'); throw e }
    }

    return {
      ...st,
      avatar: plazaRemote?.avatar ?? DEFAULTS.avatar,
      ideas: plazaRemote?.ideas ?? [],
      plazaLoading, plazaError, refreshPlaza,
      hrSurveys, hrLoading, hrError, refreshHr,
      festa: { responses, pct: (responses / TOTAL_HEADCOUNT) * 100, goal: FESTA_GOAL * 100, missing: Math.max(0, target - responses) },
      backend,
      // Amb base de dades, només les enquestes que aquesta persona encara no ha contestat.
      pending: remote?.surveys ?? [],
      points: remote?.points ?? 0,
      redeemed: remote?.redeemed ?? [],
      rewards: remote?.rewards ?? [],
      answeredList: remote?.answered ?? [],
      findSurvey: id => remote?.surveys.find(s => s.id === id),
      isAnswered: id => remote?.answered.some(a => a.id === id) ?? false,
      submitSurvey: async (s, answers, durationSeconds) => {
        if (s.source === 'db') {
          const res = await submitSurveyApi(s, answers, durationSeconds)
          setRemote(r => (r ? { ...res, surveys: r.surveys.filter(x => x.id !== s.id) } : r))
          setSt(p => ({ ...p, extra: p.extra + 1 }))
          return res.earned
        }
        throw new AppApiError('network_error')
      },
      redeemReward: async reward => {
        if (!remote) throw new AppApiError('network_error')
        const result = await redeemReward(reward.id)
        setRemote(r => r ? { ...result, surveys: r.surveys } : r)
        return result.code
      },
      refreshWallet,
      addSurvey: async (s, approved = false, editId) => {
        const saved = await saveHrSurvey(s, approved, editId)
        setHrSurveys(p => [saved, ...p.filter(x => x.id !== saved.id)])
        return saved
      },
      setSurveyStatus: async (id, status, approved = false) => {
        const saved = await updateHrStatus(id, status, approved)
        setHrSurveys(p => p.map(s => s.id === id ? saved : s))
        void refreshWallet()
      },
      plazaWeek,
      answerDaily: async key => { if (!plazaWeek.question) throw new Error('No hi ha pregunta publicada.'); await mutatePlaza('daily', { question: plazaWeek.question.id, option: key }) },
      reactTopic: (index, on) => { void mutatePlaza('reaction', { index, on }).catch(e => toast(e instanceof Error ? e.message : 'Error')) },
      addIdea: async (category, text) => { await mutatePlaza('idea', { category, text }) },

      setInitiativeStatus: (id, status) => setSt(p => ({ ...p, initiatives: p.initiatives.map(i => i.id === id ? { ...i, status } : i) })),
      setAvatar: async avatar => { await mutatePlaza('avatar', { avatar }) },
      resetDemo: () => setSt(DEFAULTS),
      toast,
    }
  }, [st, toast, remote, backend, refreshWallet, hrSurveys, hrLoading, hrError, refreshHr, plazaRemote, plazaError, plazaLoading, refreshPlaza])

  return <AppCtx.Provider value={value}>{children}<div className="fixed left-1/2 -translate-x-1/2 bottom-28 md:bottom-8 z-[100] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">{toasts.map(t => <div key={t.id} className="rounded-[14px] bg-ink text-white px-4 py-3 text-sm font-semibold shadow-lift max-w-[90vw]">{t.msg}</div>)}</div></AppCtx.Provider>
}
export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp ha de ser dins d’AppProvider')
  return c
}
