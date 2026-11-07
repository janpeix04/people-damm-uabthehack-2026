import { Link } from 'react-router-dom'
import { Check, ChevronRight, Clock } from 'lucide-react'
import type { Survey } from '../../data/types'
import { POINTS_PER_SURVEY, useApp } from '../../store/AppContext'
import { cn } from '../../components/ui'

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })

export function SurveyCard({ s, done }: { s: Survey; done?: boolean }) {
  const secs = Math.max(30, s.questions.reduce((a, q) => a + q.secs, 0))
  return (
    <Link to={`/e/${s.id}`} className={cn('card p-4 md:p-5 flex gap-4 items-center hover:shadow-card transition', done && 'opacity-75')}>
      <span className={cn('w-12 h-12 rounded-[16px] grid place-items-center shrink-0', done ? 'bg-ok-bg' : 'bg-red-soft')}>
        {done ? <Check size={22} className="text-ok" aria-hidden /> : <Clock size={22} className="text-red" aria-hidden />}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <strong className="text-[15px] md:text-base leading-snug">{s.title}</strong>
        <span className="text-[13px] text-ink-muted flex flex-wrap gap-x-3">
          <span>{s.questions.length} preguntes</span>
          <span>≈ {secs} s</span>
          {done ? <span className="text-ok-ink font-bold">Contestada</span> : <span>Tanca el {fmtDate(s.closesAt)}</span>}
        </span>
      </span>
      {!done && <span className="hidden sm:inline-flex chip bg-ink text-white">+{POINTS_PER_SURVEY} punts</span>}
      <ChevronRight size={18} className="text-ink-muted shrink-0" aria-hidden />
    </Link>
  )
}

export default function Enquestes() {
  const { surveys, pending, answered } = useApp()
  const done = surveys.filter(s => s.status === 'open' && answered.includes(s.id))
  const soon = surveys.filter(s => s.status === 'scheduled')

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-5 md:pt-10 pb-8 flex flex-col gap-6">
      <header>
        <h1 className="serif text-[32px] md:text-[44px] leading-tight">Enquestes</h1>
        <p className="text-sm md:text-base text-ink-muted mt-1">Totes són anònimes i duren menys d’un minut. Cada una suma {POINTS_PER_SURVEY} punts.</p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="pend">
        <h2 id="pend" className="eyebrow">Pendents · {pending.length}</h2>
        {pending.length
          ? pending.map(s => <SurveyCard key={s.id} s={s} />)
          : <p className="card p-4 text-sm text-ink-muted">Estàs al dia. Gràcies per participar!</p>}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="fet">
          <h2 id="fet" className="eyebrow">Ja contestades</h2>
          {done.map(s => <SurveyCard key={s.id} s={s} done />)}
        </section>
      )}

      {soon.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="aviat">
          <h2 id="aviat" className="eyebrow">Properament</h2>
          {soon.map(s => (
            <div key={s.id} className="card p-4 flex justify-between gap-3 text-sm">
              <strong>{s.title}</strong><span className="text-ink-muted whitespace-nowrap">S’obre el {fmtDate(s.opensAt)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
