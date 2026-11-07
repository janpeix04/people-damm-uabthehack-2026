import { useState } from 'react'
import { Gift, Info } from 'lucide-react'
import { REWARDS } from '../data/mock'
import { POINTS_PER_SURVEY, useApp } from '../store/AppContext'
import { cn, Modal, PathIcon } from './ui'

export function PointsCard({ className }: { className?: string }) {
  const { points, redeemed } = useApp()
  const cheapest = Math.min(...REWARDS.map(r => r.cost))
  return (
    <section className={cn('rounded-[24px] bg-ink text-white p-5 sm:p-6 flex flex-col gap-4', className)} aria-label="Saldo de punts">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="text-[13px] font-semibold opacity-80">El teu saldo</div>
          <div className="serif text-[44px] sm:text-[52px] leading-none mt-1 tabular-nums">{points} <span className="font-sans text-base font-semibold opacity-80">punts</span></div>
        </div>
        <span className="w-12 h-12 rounded-[16px] bg-white/10 grid place-items-center shrink-0"><Gift size={24} color="#FFD27A" aria-hidden /></span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-[14px] bg-white/10 px-3 py-2.5"><strong className="block text-base">+{POINTS_PER_SURVEY}</strong><span className="opacity-80">per enquesta</span></div>
        <div className="rounded-[14px] bg-white/10 px-3 py-2.5"><strong className="block text-base">{redeemed.length}</strong><span className="opacity-80">{redeemed.length === 1 ? 'codi bescanviat' : 'codis bescanviats'}</span></div>
      </div>
      {points < cheapest && <p className="text-[13px] opacity-85">Respon una enquesta per desbloquejar la primera recompensa.</p>}
    </section>
  )
}

export function RewardsNote() {
  return (
    <div className="flex gap-2 items-start card p-3 text-xs leading-relaxed text-ink-muted">
      <Info size={16} className="shrink-0 mt-px" aria-hidden />
      <span>Els punts es guanyen per participar, mai pel que contestis. No es vinculen a les teves respostes i no hi ha rànquings.</span>
    </div>
  )
}

/** Catàleg de recompenses amb bescanvi i llista de codis. */
export function RewardsCatalog({ limit, className }: { limit?: number; className?: string }) {
  const { points, redeem, redeemed } = useApp()
  const [code, setCode] = useState<{ name: string; code: string } | null>(null)
  const list = limit ? REWARDS.slice(0, limit) : REWARDS
  return (
    <>
      <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4', className)}>
        {list.map(r => {
          const ok = points >= r.cost
          return (
            <article key={r.id} className="card overflow-hidden flex flex-col">
              <div className="h-24 sm:h-28 grid place-items-center" style={{ background: r.tint }}><PathIcon d={r.icon} size={44} color={r.ink} stroke={1.7} /></div>
              <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
                <h3 className="text-sm sm:text-[15px] font-bold leading-snug">{r.name}</h3>
                <p className="text-xs sm:text-[13px] leading-snug text-ink-muted flex-1">{r.description}</p>
                <div className="text-[13px] font-extrabold text-red-dk">{r.cost} punts</div>
                <button
                  disabled={!ok}
                  onClick={() => { const c = redeem(r.id, r.name, r.cost); if (c) setCode({ name: r.name, code: c }) }}
                  className={ok ? 'btn-red !h-10 !text-[13px]' : 'btn !h-10 !text-[13px] bg-cream-dk text-ink-muted !opacity-100'}
                >
                  {ok ? 'Bescanviar' : `Et falten ${r.cost - points}`}
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <Modal open={!!code} onClose={() => setCode(null)} title="Bescanviat!">
        <p className="text-ink-muted">Mostra aquest codi a la cafeteria per obtenir: <strong className="text-ink">{code?.name}</strong>.</p>
        <div className="serif text-[40px] text-center tracking-widest bg-cream rounded-[16px] py-4">{code?.code}</div>
        <button className="btn-ink" onClick={() => setCode(null)}>Fet</button>
      </Modal>
      {!limit && redeemed.length > 0 && (
        <section className="card p-4 sm:p-5">
          <h2 className="serif text-xl mb-2">Els teus codis</h2>
          {redeemed.map(r => (
            <div key={r.code} className="flex justify-between gap-3 text-sm py-2 border-t border-cream-dk first:border-0">
              <span>{r.name}</span><strong className="tabular-nums tracking-wider">{r.code}</strong>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
