import { Link } from 'react-router-dom'
import { Check, ChevronRight, Clock } from 'lucide-react'
import type { Survey } from '../../data/types'
import { POINTS_PER_SURVEY, useApp } from '../../store/AppContext'
import { getLocale, useT } from '../../i18n'
import { useDemoText } from '../../i18n/demo'

const fmtDate = (d: string) => new Date(d).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' })

export function SurveyCard({ s }: { s: Survey }) {
  const t = useT()
  const dx = useDemoText()
  const secs = Math.max(30, s.questions.reduce((a, q) => a + q.secs, 0))
  return (
    <Link to={`/e/${s.id}`} className={'card p-4 md:p-5 flex gap-4 items-center hover:shadow-card transition'}>
      <span className="w-12 h-12 rounded-[16px] grid place-items-center shrink-0 bg-red-soft">
        <Clock size={22} className="text-red" aria-hidden />
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <strong className="text-[15px] md:text-base leading-snug">{dx(s.title)}</strong>
        <span className="text-[13px] text-ink-muted flex flex-wrap gap-x-3">
          <span>{t('home.questions', { count: s.questions.length })}</span>
          <span>≈ {secs} s</span>
          <span>{t('home.closesOn', { date: fmtDate(s.closesAt) })}</span>
        </span>
      </span>
      <span className="hidden sm:inline-flex chip bg-ink text-white">{t('home.pointsPlus', { count: POINTS_PER_SURVEY })}</span>
      <ChevronRight size={18} className="text-ink-muted shrink-0" aria-hidden />
    </Link>
  )
}

export default function Enquestes() {
  const { pending, answeredList, backend } = useApp()
  // Les programades de demo només tenen sentit sense base de dades.
  const soon: Survey[] = []

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-5 md:pt-10 pb-8 flex flex-col gap-6">
      <header>
        <h1 className="serif text-[32px] md:text-[44px] leading-tight">Enquestes</h1>
        <p className="text-sm md:text-base text-ink-muted mt-1">Totes són anònimes i duren menys d’un minut. Cada una suma {POINTS_PER_SURVEY} punts.</p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="pend">
        <h2 id="pend" className="eyebrow">Pendents · {pending.length}</h2>
        {backend === 'loading'
          ? <p className="card p-4 text-sm text-ink-muted">Carregant…</p>
          : backend === 'local' ? <p role="alert" className="card p-4">No s’ha pogut connectar amb el servidor. Torna-ho a provar.</p> : pending.length
          ? pending.map(s => <SurveyCard key={s.id} s={s} />)
          : <p className="card p-4 text-sm text-ink-muted">Estàs al dia. Gràcies per participar!</p>}
      </section>

      {answeredList.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="fet">
          <h2 id="fet" className="eyebrow">Ja contestades · {answeredList.length}</h2>
          {answeredList.map(a => (
            <div key={a.id} className="card p-4 md:p-5 flex gap-4 items-center opacity-80">
              <span className="w-12 h-12 rounded-[16px] grid place-items-center shrink-0 bg-ok-bg"><Check size={22} className="text-ok" aria-hidden /></span>
              <span className="flex-1 min-w-0"><strong className="block text-[15px] md:text-base leading-snug">{a.title}</strong><span className="text-[13px] text-ok-ink font-bold">Contestada · resposta anònima</span></span>
            </div>
          ))}
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
