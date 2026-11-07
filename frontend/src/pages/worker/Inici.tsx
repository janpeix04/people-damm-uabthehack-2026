import { Link } from 'react-router-dom'
import { ArrowRight, Check, ClipboardCheck, Gift, Lock, MessageCircle, Sparkles } from 'lucide-react'
import { PLAZA_TOPICS } from '../../data/mock'
import { POINTS_PER_SURVEY, useApp } from '../../store/AppContext'
import { FestaCard, toneBg } from '../../components/ui'
import { RewardsCatalog } from '../../components/Rewards'
import { SurveyCard } from './Enquestes'

/** Inici de l’app del treballador. */
export default function WorkerInici() {
  const { pending, points, backend } = useApp()
  const next = pending[0]

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-5 md:pt-10 pb-8 md:pb-14 flex flex-col gap-8 md:gap-12">
      {/* Hero */}
      <section className="grid gap-5 md:gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div className="flex flex-col gap-4 md:gap-5">
          <span className="chip bg-red-soft text-red-dk self-start"><Lock size={12} aria-hidden />Anònim · sense iniciar sessió</span>
          <h1 className="serif text-[40px] sm:text-[52px] lg:text-[64px] leading-[1.02]">La teva opinió <span className="text-red">mou la fàbrica</span></h1>
          <p className="text-base md:text-lg leading-relaxed text-ink-muted max-w-xl">
            Respon enquestes curtes, comparteix idees a La Plaça i bescanvia els punts per recompenses.
          </p>
          <div className="hidden lg:flex gap-3 mt-1">
            {next
              ? <Link to={`/e/${next.id}`} className="btn-red !h-14 !px-6 !text-base">Respon ara <ArrowRight size={18} aria-hidden /></Link>
              : <Link to="/app/placa" className="btn-ink !h-14 !px-6 !text-base">Anar a La Plaça</Link>}
            <Link to="/app/recompenses" className="btn-line !h-14 !px-6 !text-base"><Gift size={18} aria-hidden />{points} punts</Link>
          </div>
        </div>

        {next ? (
          <Link to={`/e/${next.id}`} className="flex flex-col gap-4 bg-red text-white rounded-[28px] p-5 md:p-7 shadow-[0_18px_40px_rgba(200,16,46,.32)] hover:bg-red-dk transition">
            <div className="flex justify-between items-center gap-2">
              <span className="text-[11.5px] font-extrabold tracking-[.12em] uppercase bg-white/20 rounded-full px-2.5 py-1">{pending.length === 1 ? 'Tens 1 enquesta' : `Tens ${pending.length} enquestes`}</span>
              <span className="text-[12.5px] font-bold opacity-90">Tanca el {new Date(next.closesAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="serif text-[28px] md:text-[34px] leading-[1.1]">{next.title}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] md:text-sm font-semibold opacity-95">
              <span>{next.questions.length} preguntes</span>
              <span>≈ {Math.max(30, next.questions.reduce((a, q) => a + q.secs, 0))} s</span>
              <span className="flex items-center gap-1"><Sparkles size={14} aria-hidden />+{POINTS_PER_SURVEY} punts</span>
            </div>
            <span className="h-[52px] rounded-[16px] bg-white text-red text-base font-extrabold grid place-items-center">Començar</span>
          </Link>
        ) : backend === 'loading' ? (
          <div className="card p-6 md:p-8 min-h-[180px] grid place-items-center serif text-2xl text-ink-muted">Carregant…</div>
        ) : (
          <div className="card p-6 md:p-8 flex gap-4 items-center">
            <span className="w-14 h-14 rounded-[18px] bg-ok-bg grid place-items-center shrink-0"><Check size={28} className="text-ok" aria-hidden /></span>
            <div><strong className="serif text-2xl block">Estàs al dia</strong><span className="text-sm text-ink-muted">No tens cap enquesta pendent. Gràcies per participar!</span></div>
          </div>
        )}
      </section>

      {/* Com funciona */}
      <section aria-labelledby="com" className="flex flex-col gap-4">
        <h2 id="com" className="eyebrow">Com funciona</h2>
        <ol className="grid gap-3 sm:grid-cols-3 md:gap-4">
          {[
            [ClipboardCheck, 'Respon', 'Preguntes curtes, des del mòbil. Menys d’un minut i 100% anònim.'],
            [MessageCircle, 'Parla a La Plaça', 'Deixa idees i mira de què es parla, sempre de forma anònima.'],
            [Gift, 'Bescanvia punts', `Cada enquesta suma ${POINTS_PER_SURVEY} punts per a cafès, esmorzars i més.`],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Gift
            return (
              <li key={t as string} className="card p-4 md:p-5 flex gap-3.5 items-start">
                <span className="relative w-11 h-11 rounded-[14px] bg-cream grid place-items-center shrink-0">
                  <I size={22} className="text-red" aria-hidden />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] font-extrabold grid place-items-center">{i + 1}</span>
                </span>
                <span><strong className="block text-[16px]">{t as string}</strong><span className="text-[13.5px] leading-snug text-ink-muted">{d as string}</span></span>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Altres enquestes + objectiu col·lectiu */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr] md:gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <h2 className="serif text-[26px] md:text-[30px]">Enquestes obertes</h2>
            <Link to="/app/enquestes" className="text-sm font-bold text-red-dk">Veure-les totes →</Link>
          </div>
          {pending.length > 1
            ? pending.slice(1, 3).map(s => <SurveyCard key={s.id} s={s} />)
            : <p className="card p-4 text-sm text-ink-muted">{pending.length ? 'Aquesta és l’única enquesta oberta ara mateix.' : 'Ara mateix no hi ha cap enquesta oberta per a tu.'}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="serif text-[26px] md:text-[30px]">Entre tots</h2>
          <FestaCard />
        </div>
      </section>

      {/* La Plaça */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline">
          <h2 className="serif text-[26px] md:text-[30px]">La Plaça</h2>
          <Link to="/app/placa" className="text-sm font-bold text-red-dk">Entrar →</Link>
        </div>
        <Link to="/app/placa" className="card overflow-hidden grid md:grid-cols-[1.1fr_1fr] hover:shadow-card transition">
          <svg viewBox="0 0 170 92" className="w-full h-full block min-h-[160px]" preserveAspectRatio="xMidYMid slice" aria-hidden><rect width="170" height="92" fill="#CFE6F4" /><rect y="56" width="170" height="36" fill="#EBD8BA" /><rect x="6" y="26" width="34" height="32" fill="#F3E7D2" /><path d="M3 26 L23 14 L43 26z" fill="#C2512F" /><rect x="42" y="18" width="30" height="40" fill="#FFFFFF" /><rect x="74" y="28" width="40" height="30" fill="#E2B98F" /><path d="M71 28 L94 15 L117 28z" fill="#B5462B" /><rect x="116" y="22" width="48" height="36" fill="#F2E6D2" /><rect x="116" y="44" width="48" height="5" fill="#C8102E" /><ellipse cx="85" cy="74" rx="20" ry="6" fill="#DCD3C6" /><ellipse cx="85" cy="72" rx="16" ry="4" fill="#7FC6E0" /><circle cx="40" cy="70" r="4" fill="#EFC3A1" /><rect x="37" y="74" width="6" height="8" rx="3" fill="#C8102E" /><circle cx="130" cy="72" r="4" fill="#B57A52" /><rect x="127" y="76" width="6" height="8" rx="3" fill="#1E2A44" /></svg>
          <div className="p-4 md:p-6 flex flex-col gap-3">
            <p className="text-[15px] leading-snug"><strong>{PLAZA_TOPICS[0].n} persones</strong> parlen de {PLAZA_TOPICS[0].label.toLowerCase()} aquesta setmana.</p>
            <div className="flex flex-col gap-1.5">
              {PLAZA_TOPICS.slice(0, 3).map(t => (
                <div key={t.label} className="flex justify-between items-center rounded-[12px] px-3 py-2 text-sm" style={{ background: toneBg(t.tone) }}>
                  <strong>{t.label}</strong><span className="text-xs text-ink-muted">{t.n} opinions · {t.trend}</span>
                </div>
              ))}
            </div>
            <span className="btn-ink !h-12 mt-auto"><MessageCircle size={18} aria-hidden />Entrar a La Plaça</span>
          </div>
        </Link>
      </section>

      {/* Recompenses */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline">
          <h2 className="serif text-[26px] md:text-[30px]">Recompenses</h2>
          <Link to="/app/recompenses" className="text-sm font-bold text-red-dk">Veure-les totes →</Link>
        </div>
        <RewardsCatalog limit={3} className="[&>*:nth-child(3)]:hidden lg:[&>*:nth-child(3)]:flex" />
      </section>

      <div className="md:hidden flex justify-center gap-4 text-xs font-semibold text-ink-muted">
        <span>Accés intern (demo):</span>
        <Link to="/">Inici demo</Link>
        <Link to="/rrhh">RRHH</Link>
      </div>
    </div>
  )
}
