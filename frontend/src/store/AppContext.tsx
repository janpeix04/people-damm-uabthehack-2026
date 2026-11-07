import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BASE_RESPONSES, DAILY_QUESTIONS, FESTA_GOAL, INITIATIVES, MIN_SAMPLE, PLAZA_LAST_WEEK, PLAZA_MILESTONES, PLAZA_WEEK_BASE, REWARDS, SURVEYS, TOTAL_HEADCOUNT } from '../data/mock'
import type { ActionStatus, Avatar, DailyQuestion, Idea, Initiative, Reward, Survey } from '../data/types'
import { AppApiError, openWallet, redeemReward, submitSurvey as submitSurveyApi, type WalletState } from '../api/app'
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
const todaysQuestion = (d = new Date()): DailyQuestion => DAILY_QUESTIONS[Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000) % DAILY_QUESTIONS.length]
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
  question: DailyQuestion
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
  hrSurveys: Survey[]
  hrLoading: boolean
  hrError: string | null
  refreshHr: () => Promise<void>
  addSurvey: (s: Survey, approved?: boolean, editId?: string) => Promise<Survey>
  setSurveyStatus: (id: string, status: Survey['status'], approved?: boolean) => Promise<void>
  /** La Plaça d'aquesta setmana (participació única, fites i pregunta del dia). */
  plazaWeek: PlazaWeek
  /** Respon la pregunta del dia (un cop al dia). */
  answerDaily: (key: string) => void
  /** "+1 Jo també" en una bafarada de la Plaça. */
  reactTopic: (index: number, on: boolean) => void
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

    // ---- La Plaça d'aquesta setmana ----
    const mine = st.plaza && st.plaza.week === weekKey() ? st.plaza : freshPlaza()
    const participants = PLAZA_WEEK_BASE + (mine.joined ? 1 : 0)
    const ppct = (participants / TOTAL_HEADCOUNT) * 100
    const nx = PLAZA_MILESTONES.find(m => ppct < m.at)
    const question = todaysQuestion()
    const myAnswer = mine.daily && mine.daily.day === dayKey() ? mine.daily.answer : null
    const qOpts = question.options.map(o => ({ ...o, n: o.n + (myAnswer === o.key ? 1 : 0) }))
    const todayTotal = qOpts.reduce((a, o) => a + o.n, 0)
    const plazaWeek: PlazaWeek = {
      participants, headcount: TOTAL_HEADCOUNT, pct: ppct, goal: 60, joined: mine.joined, lastWeek: PLAZA_LAST_WEEK,
      next: nx ? { at: nx.at, label: nx.label, missing: Math.ceil((TOTAL_HEADCOUNT * nx.at) / 100) - participants } : null,
      resetsIn: (8 - new Date().getDay()) % 7 || 7,
      reacted: mine.reacted, question, myAnswer, todayTotal,
      // mínim de respostes abans de mostrar cap resultat
      results: todayTotal >= MIN_SAMPLE ? qOpts.map(o => ({ key: o.key, label: o.label, emoji: o.emoji, n: o.n, pct: (o.n / todayTotal) * 100 })) : null,
    }
    /** Primera participació de la setmana: compta un cop a la Festa (i avisa si desbloqueja una fita). */
    const joinPlaza = (patch: Partial<PlazaMine>) => {
      if (!mine.joined) {
        const after = ((participants + 1) / TOTAL_HEADCOUNT) * 100
        const hit = PLAZA_MILESTONES.find(m => ppct < m.at && after >= m.at)
        toast(hit ? `Has desbloquejat: ${hit.label}! Gràcies per sumar-t’hi.` : 'Has sumat a la Festa de la setmana. Gràcies!')
      }
      setSt(p => ({ ...p, plaza: { ...(p.plaza && p.plaza.week === weekKey() ? p.plaza : freshPlaza()), ...patch, joined: true } }))
    }

    return {
      ...st,
      hrSurveys, hrLoading, hrError, refreshHr,
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
      answerDaily: key => { if (!myAnswer) joinPlaza({ daily: { day: dayKey(), answer: key } }) },
      reactTopic: (index, on) => {
        const reacted = on ? Array.from(new Set([...mine.reacted, index])) : mine.reacted.filter(i => i !== index)
        if (on) joinPlaza({ reacted })
        else setSt(p => ({ ...p, plaza: { ...mine, reacted } }))
      },
      addIdea: (category, text) => {
        const id = `idea-${Date.now()}`
        joinPlaza({})
        setSt(p => ({ ...p, ideas: [{ id, category, text, status: 'moderant', at: Date.now() }, ...p.ideas] }))
        setTimeout(() => setSt(p => ({ ...p, ideas: p.ideas.map(i => (i.id === id ? { ...i, status: 'publicada' } : i)) })), 6000)
      },
      setInitiativeStatus: (id, status) => setSt(p => ({ ...p, initiatives: p.initiatives.map(i => (i.id === id ? { ...i, status } : i)) })),
      setAvatar: avatar => setSt(p => ({ ...p, avatar })),
      resetDemo: () => setSt(DEFAULTS),
      toast,
    }
  }, [st, toast, remote, backend, refreshWallet, hrSurveys, hrLoading, hrError, refreshHr])

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
