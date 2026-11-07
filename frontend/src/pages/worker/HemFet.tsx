import { Link } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import { HEARD_DID } from '../../data/mock'

const ST: Record<string, string> = { Fet: 'bg-ok-bg text-ok-ink', 'En curs': 'bg-rain-bg text-rain', Avaluant: 'bg-[#EDE9FE] text-[#5B21B6]', 'En revisió': 'bg-warn-bg text-warn-ink' }

export default function HemFet() {
  return (
    <div className="max-w-[560px] mx-auto px-4 pt-5 pb-6 flex flex-col gap-3.5">
      <header>
        <h1 className="serif text-[30px] leading-tight">Ens heu dit, <span className="text-red">hem fet</span></h1>
        <p className="text-sm leading-relaxed text-ink-muted mt-1">El que ens expliqueu a les enquestes i a la plaça es converteix en millores.</p>
      </header>
      <div className="grid grid-cols-3 gap-2">
        {[['1', 'Fetes'], ['2', 'En marxa'], ['1', 'En revisió']].map(([n, l]) => <div key={l} className="card p-3 text-center"><div className="serif text-2xl">{n}</div><div className="text-[11px] text-ink-muted">{l}</div></div>)}
      </div>
      {HEARD_DID.map(it => (
        <article key={it.heard} className="card p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center gap-2"><span className={`chip ${ST[it.status]}`}>{it.status}</span><span className="text-xs text-ink-muted">{it.zone} · {it.date}</span></div>
          <div className="flex gap-2.5"><span className="w-[30px] h-[30px] rounded-[10px] bg-cream grid place-items-center shrink-0"><MessageCircle size={16} className="text-ink-muted" /></span><div><div className="eyebrow">Ens heu dit</div><p className="text-sm leading-snug mt-0.5">{it.heard}</p></div></div>
          <div className="flex gap-2.5"><span className="w-[30px] h-[30px] rounded-[10px] bg-red grid place-items-center shrink-0"><Check size={16} color="#fff" strokeWidth={2.6} /></span><div><div className="eyebrow !text-red-dk">Hem fet</div><p className="text-sm font-semibold leading-snug mt-0.5">{it.did}</p></div></div>
        </article>
      ))}
      <Link to="/app/placa" className="btn-red !h-[52px]">Proposa una millora a la plaça</Link>
    </div>
  )
}
