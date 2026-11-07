import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { SurveyRunner } from '../../components/SurveyRunner'
import { Meter } from '../../components/ui'

/**
 * Destí únic de tots els canals (QR, WhatsApp, correu, app, Plaça, Damm World).
 * No cal iniciar sessió.
 */
export default function Enquesta() {
  const { id } = useParams()
  const nav = useNavigate()
  const { surveys, submitResponse, festa, answered } = useApp()
  const s = surveys.find(x => x.id === id)
  const [done, setDone] = useState(false)

  const shell = (children: React.ReactNode) => (
    <div className="min-h-full bg-cream flex justify-center">
      <div className="w-full max-w-[480px] min-h-full bg-paper sm:shadow-lift flex flex-col" style={{ minHeight: '100dvh' }}>{children}</div>
    </div>
  )

  if (!s) return shell(
    <div className="p-8 flex flex-col gap-4">
      <h1 className="serif text-3xl">No trobem aquesta enquesta</h1>
      <p className="text-ink-muted">Pot ser que l’enllaç no sigui correcte o que l’enquesta s’hagi esborrat.</p>
      <Link to="/app" className="btn-red self-start">Anar a l’inici</Link>
    </div>,
  )

  if (s.status !== 'open' && !done) return shell(
    <div className="p-8 flex flex-col gap-4">
      <h1 className="serif text-3xl">{s.title}</h1>
      <p className="text-ink-muted">{s.status === 'scheduled' ? `Aquesta enquesta s’obrirà el ${new Date(s.opensAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}.` : 'Aquesta enquesta ja està tancada. Gràcies per l’interès!'}</p>
      <Link to="/app/hem-fet" className="btn-line self-start">Veure què hem millorat</Link>
    </div>,
  )

  if (done) return shell(
    <div className="flex-1 flex flex-col gap-4 px-6 pt-10 pb-7 bg-gradient-to-b from-red-soft to-paper to-45%">
      <div className="w-20 h-20 rounded-[26px] bg-red grid place-items-center shadow-red"><Check size={40} color="#fff" strokeWidth={2.6} /></div>
      <h1 className="serif text-[36px] leading-none">Gràcies!</h1>
      <p className="text-base leading-relaxed text-ink-muted">La teva resposta s’ha sumat de forma anònima als resultats.</p>
      <section className="card p-4 flex flex-col gap-2">
        <div className="flex justify-between items-baseline"><strong className="serif text-xl">Festa de la plaça</strong><strong className="tabular-nums">{Math.round(festa.pct)}%</strong></div>
        <Meter value={festa.pct} goal={festa.goal} />
        <span className="text-[13px] text-ink-muted">{festa.missing > 0 ? `Has apropat el concert. Falten ${festa.missing} respostes.` : 'Entre tots heu desbloquejat el concert!'}</span>
      </section>
      <section className="rounded-[20px] bg-cream p-4 text-sm leading-relaxed"><strong>I ara què?</strong> Quan hi hagi prou respostes, RRHH en veurà el resum. Les millores sortiran a “Ens heu dit / Hem fet”.</section>
      <div className="mt-auto flex flex-col gap-2">
        <Link to="/app/placa" className="btn-red !h-14 !text-base">Anar a La Plaça</Link>
        <Link to="/app" className="btn-ghost">Tornar a l’inici</Link>
      </div>
    </div>,
  )

  return shell(
    <>
      {answered.includes(s.id) && <div className="bg-warn-bg text-warn-ink text-[13px] font-semibold px-5 py-2.5">Ja l’has resposta des d’aquest dispositiu. Pots tornar-la a provar (demo).</div>}
      <div className="px-5 pt-4 flex items-center justify-between text-[13px] font-semibold text-ink-muted"><span className="truncate">{s.title}</span><span>People Damm</span></div>
      <div className="flex-1 min-h-0">
        <SurveyRunner questions={s.questions} onExit={() => nav('/app')} onDone={() => { submitResponse(s.id); setDone(true) }} />
      </div>
    </>,
  )
}
