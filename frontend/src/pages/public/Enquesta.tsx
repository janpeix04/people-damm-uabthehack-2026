import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Gift, ListChecks, Lock, Sparkles } from 'lucide-react'
import { POINTS_PER_SURVEY, useApp } from '../../store/AppContext'
import { AppApiError, ERROR_MESSAGES } from '../../api/app'
import type { Survey } from '../../data/types'
import { SurveyRunner } from '../../components/SurveyRunner'
import { Logo, Meter } from '../../components/ui'

/**
 * Destí únic dels canals. L'accés requereix sessió; el contingut continua sent anònim.
 * Des d’aquí només es pot anar a l’espai públic: Damm World queda dins de l’app.
 */
export default function Enquesta() {
  const { id } = useParams()
  const nav = useNavigate()
  const { findSurvey, isAnswered, submitSurvey, refreshWallet, backend, festa, points, pending, toast } = useApp()
  const [done, setDone] = useState<{ earned: number } | null>(null)
  // En enviar-la, l'enquesta surt de les pendents: en guardem una còpia per a la pantalla de gràcies.
  const [kept, setKept] = useState<Survey | undefined>()
  const [sending, setSending] = useState(false)
  const startedAt = useRef(Date.now())
  const s = findSurvey(id ?? '') ?? (kept?.id === id ? kept : undefined)

  if (!s && backend === 'loading') return (
    <Shell><div className="flex-1 grid place-items-center py-20 serif text-2xl">Carregant…</div></Shell>
  )

  if (!s && id && isAnswered(id)) return (
    <Shell>
      <Message title="Ja l’has contestada" text="Només es pot respondre una vegada cada enquesta. La teva resposta és anònima i ja compta. Gràcies!">
        <Link to="/app/enquestes" className="btn-red">Veure altres enquestes</Link>
        <Link to="/app" className="btn-line">Anar a l’inici</Link>
      </Message>
    </Shell>
  )

  if (!s) return (
    <Shell>
      <Message title="No trobem aquesta enquesta" text="Pot ser que l’enllaç no sigui correcte o que l’enquesta s’hagi esborrat.">
        <Link to="/app/enquestes" className="btn-red">Veure enquestes obertes</Link>
      </Message>
    </Shell>
  )

  if (s.status !== 'open' && !done) return (
    <Shell>
      <Message
        title={s.title}
        text={s.status === 'scheduled'
          ? `Aquesta enquesta s’obrirà el ${new Date(s.opensAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}.`
          : 'Aquesta enquesta ja està tancada. Gràcies per l’interès!'}
      >
        <Link to="/app/placa" className="btn-red">Anar a La Plaça</Link>
        <Link to="/app" className="btn-line">Anar a l’inici</Link>
      </Message>
    </Shell>
  )

  const secs = Math.max(30, s.questions.reduce((a, q) => a + q.secs, 0))
  // Només en mode demo local es pot repetir; amb base de dades el servidor ho impedeix.
  const already = s.source !== 'db' && isAnswered(s.id)

  const send = async (answers: Record<string, unknown>) => {
    if (sending) return
    setSending(true)
    try {
      const earned = await submitSurvey(s, answers, (Date.now() - startedAt.current) / 1000)
      setKept(s)
      setDone({ earned })
    } catch (e) {
      const code = e instanceof AppApiError ? e.code : 'server_error'
      toast(ERROR_MESSAGES[code])
      if (code === 'already_answered' || code === 'invalid_token') refreshWallet()
    } finally {
      setSending(false)
    }
  }

  if (done) {
    const next = pending.find(p => p.id !== s.id)
    return (
      <Shell>
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-14 flex flex-col gap-5 md:gap-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-[26px] bg-red grid place-items-center shadow-red"><Check size={40} color="#fff" strokeWidth={2.6} aria-hidden /></div>
            <h1 className="serif text-[34px] md:text-[44px] leading-tight">Moltes gràcies per la teva col·laboració!</h1>
            <p className="text-base md:text-lg leading-relaxed text-ink-muted max-w-md">La teva resposta s’ha sumat de forma 100% anònima. La teva veu ens ajuda a construir un entorn de treball més proper, transparent i inclusiu per a tot l'equip.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <section className="rounded-[24px] bg-ink text-white p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[13px] opacity-80">{done.earned ? 'Has guanyat' : 'Ja havies sumat els punts d’aquesta enquesta'}</div>
                  {done.earned > 0 && <div className="serif text-[40px] leading-none mt-1">+{done.earned} <span className="font-sans text-base font-semibold opacity-80">punts</span></div>}
                </div>
                <Gift size={26} color="#FFD27A" aria-hidden />
              </div>
              <div className="text-sm opacity-90">Saldo: <strong className="tabular-nums">{points} punts</strong></div>
              <Link to="/app/recompenses" className="h-12 rounded-[14px] bg-white text-ink font-extrabold grid place-items-center mt-auto">Bescanviar punts</Link>
            </section>
            <section className="card p-5 flex flex-col gap-2">
              <div className="flex justify-between items-baseline"><strong className="serif text-xl">Participació de la planta</strong><strong className="tabular-nums">{Math.round(festa.pct)}%</strong></div>
              <Meter value={festa.pct} goal={festa.goal} />
              <span className="text-[13px] text-ink-muted">{festa.missing > 0 ? `Objectiu 60% perquè els resultats siguin representatius · falten ${festa.missing} respostes.` : 'Objectiu de participació assolit. Gràcies!'}</span>
              <p className="text-sm leading-relaxed mt-auto pt-3 border-t border-cream-dk"><strong>I ara què?</strong> Quan hi hagi prou respostes, RRHH en veurà el resum agregat protegit per k-anonimat. Les millores es comunicaran a La Plaça.</p>
            </section>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            {next && <Link to={`/e/${next.id}`} onClick={() => { setDone(null); setKept(undefined); startedAt.current = Date.now() }} className="btn-red !h-14 !px-6 !text-base">Respondre la següent</Link>}
            <Link to="/app/placa" className={next ? 'btn-line !h-14 !px-6 !text-base' : 'btn-red !h-14 !px-6 !text-base'}>Anar a La Plaça</Link>
            <Link to="/app" className="btn-ghost !h-14">Tornar a l’inici</Link>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell fullOnMobile>
      <div className="flex-1 max-w-6xl mx-auto w-full md:px-6 md:py-10 grid md:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:grid-cols-[minmax(0,1fr)_520px] md:gap-10 items-start">
        {/* Context: només a desktop/tauleta */}
        <aside className="hidden md:flex flex-col gap-5 md:sticky md:top-10">
          <span className="eyebrow !text-red">Enquesta anònima</span>
          <h1 className="serif text-[40px] lg:text-[52px] leading-[1.04]">{s.title}</h1>
          {s.intro && <p className="text-base leading-relaxed text-ink-muted">{s.intro}</p>}
          <ul className="grid grid-cols-3 gap-2.5">
            {[[ListChecks, `${s.questions.length}`, 'preguntes'], [Clock, `${secs} s`, 'de durada'], [Sparkles, `+${POINTS_PER_SURVEY}`, 'punts']].map(([I, b, l]) => {
              const Icon = I as typeof Clock
              return (
                <li key={l as string} className="card p-3.5 flex flex-col gap-1">
                  <Icon size={18} className="text-red" aria-hidden />
                  <strong className="serif text-2xl leading-none mt-1">{b as string}</strong>
                  <span className="text-xs text-ink-muted">{l as string}</span>
                </li>
              )
            })}
          </ul>
          <div className="flex gap-3 items-start rounded-[18px] bg-ok-bg text-ok-ink p-4 text-sm leading-relaxed">
            <Lock size={18} className="shrink-0 mt-0.5" aria-hidden />
            <span>No guardem el teu nom, el dispositiu ni la ubicació. Els resultats només es veuen agrupats.</span>
          </div>
        </aside>

        <section className="flex flex-col bg-paper min-h-[100dvh] md:min-h-0 md:h-[min(760px,calc(100dvh-160px))] md:rounded-[28px] md:border md:border-line md:shadow-lift overflow-hidden">
          {already && <div className="bg-warn-bg text-warn-ink text-[13px] font-semibold px-5 py-2.5">Ja has participat en aquesta consulta des d'aquest dispositiu. Pots tornar-la a provar en mode demo.</div>}
          <div className="md:hidden px-5 pt-4 flex items-center justify-between gap-3 text-[13px] font-semibold text-ink-muted">
            <span className="truncate">{s.title}</span><span className="chip bg-ink text-white shrink-0">+{POINTS_PER_SURVEY} punts</span>
          </div>
          <div className="relative flex-1 min-h-0">
            <SurveyRunner
              questions={s.questions}
              onExit={() => nav('/app')}
              onDone={send}
            />
            {sending && <div className="absolute inset-0 bg-paper/80 grid place-items-center serif text-2xl" aria-live="polite">Enviant…</div>}
          </div>
        </section>
      </div>
    </Shell>
  )
}

/** Capçalera mínima: durant l’enquesta no hi ha distraccions. */
function Shell({ children, fullOnMobile }: { children: ReactNode; fullOnMobile?: boolean }) {
  return (
    <div className="min-h-full flex flex-col bg-cream" style={{ minHeight: '100dvh' }}>
      <header className={fullOnMobile ? 'hidden md:block border-b border-line bg-paper' : 'border-b border-line bg-paper'}>
        <div className="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4">
          <Link to="/app" className="flex items-center gap-2.5" aria-label="People Damm, inici"><Logo size="sm" /></Link>
          <Link to="/app" className="btn-ghost"><ArrowLeft size={16} aria-hidden />Inici</Link>
        </div>
      </header>
      {children}
    </div>
  )
}

function Message({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="max-w-xl mx-auto w-full px-4 md:px-6 py-10 md:py-16">
      <div className="card p-6 md:p-8 flex flex-col gap-4">
        <h1 className="serif text-3xl md:text-4xl leading-tight">{title}</h1>
        <p className="text-ink-muted">{text}</p>
        <div className="flex flex-col sm:flex-row gap-2">{children}</div>
      </div>
    </div>
  )
}
