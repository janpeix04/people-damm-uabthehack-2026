import { useState } from 'react'
import { Info } from 'lucide-react'
import { REWARDS } from '../../data/mock'
import { useApp } from '../../store/AppContext'
import { Modal, PathIcon } from '../../components/ui'

export default function Recompenses() {
  const { points, redeem, redeemed } = useApp()
  const [code, setCode] = useState<{ name: string; code: string } | null>(null)
  return (
    <div className="max-w-[560px] mx-auto px-4 pt-5 pb-6 flex flex-col gap-3.5">
      <header className="flex justify-between items-center"><h1 className="serif text-[30px]">Recompenses</h1><span className="chip bg-warn-bg text-warn-ink">Concepte · demo</span></header>
      <section className="rounded-[24px] bg-ink text-white p-5 flex justify-between items-center">
        <div><div className="text-[13px] opacity-80">Saldo de demostració</div><div className="serif text-[40px] leading-none mt-1">{points} <span className="font-sans text-base font-semibold opacity-80">punts</span></div></div>
      </section>
      <div className="flex gap-2 items-start card p-3 text-xs leading-relaxed text-ink-muted"><Info size={16} className="shrink-0 mt-px" /><span>Proposta pendent de validar. Els punts no es vinculen a les teves respostes ni depenen del que contestis. No hi ha rànquings.</span></div>
      <div className="grid grid-cols-2 gap-3">
        {REWARDS.map(r => {
          const ok = points >= r.cost
          return (
            <article key={r.id} className="card overflow-hidden flex flex-col">
              <div className="h-24 grid place-items-center" style={{ background: r.tint }}><PathIcon d={r.icon} size={44} color={r.ink} stroke={1.7} /></div>
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h2 className="text-sm font-bold">{r.name}</h2>
                <p className="text-xs leading-snug text-ink-muted flex-1">{r.description}</p>
                <div className="text-[13px] font-extrabold text-red-dk">{r.cost} punts</div>
                <button disabled={!ok} onClick={() => { const c = redeem(r.id, r.name, r.cost); if (c) setCode({ name: r.name, code: c }) }} className={ok ? 'btn-red !h-10 !text-[13px]' : 'btn !h-10 !text-[13px] bg-cream-dk text-ink-muted'}>{ok ? 'Bescanviar' : `Et falten ${r.cost - points}`}</button>
              </div>
            </article>
          )
        })}
      </div>
      {redeemed.length > 0 && <section className="card p-4"><h2 className="serif text-xl mb-2">Els teus codis</h2>{redeemed.map(r => <div key={r.code} className="flex justify-between text-sm py-1.5 border-t border-cream-dk first:border-0"><span>{r.name}</span><strong className="tabular-nums">{r.code}</strong></div>)}</section>}
      <Modal open={!!code} onClose={() => setCode(null)} title="Bescanviat!">
        <p className="text-ink-muted">Mostra aquest codi a la cafeteria per obtenir: <strong className="text-ink">{code?.name}</strong>.</p>
        <div className="serif text-[40px] text-center tracking-widest bg-cream rounded-[16px] py-4">{code?.code}</div>
        <button className="btn-ink" onClick={() => setCode(null)}>Fet</button>
      </Modal>
    </div>
  )
}
