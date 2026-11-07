import { BellRing, Check, Clock3, MessagesSquare, ShieldCheck, UsersRound } from 'lucide-react'

interface TeamsDeliveryPreviewProps {
  selected: boolean
  title: string
  questions: number
  closesAt: string
  onToggle: () => void
}

function formatDate(value: string) {
  if (!value) return 'Per definir'
  return new Date(`${value}T12:00:00`).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })
}

export default function TeamsDeliveryPreview({ selected, title, questions, closesAt, onToggle }: TeamsDeliveryPreviewProps) {
  const estimatedSeconds = Math.max(30, questions * 10)

  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-paper" aria-labelledby="teams-delivery-title">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-4 sm:p-5 lg:p-6 flex flex-col gap-5 bg-cream/55">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-[14px] bg-[#6264A7] text-white grid place-items-center shrink-0">
              <MessagesSquare size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="teams-delivery-title" className="serif text-[22px] leading-tight">Microsoft Teams</h3>
                {selected && <span className="chip bg-ok-bg text-ok-ink"><Check size={12} aria-hidden />Seleccionat</span>}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">Invitació i recordatori en una targeta adaptativa, amb accés directe a l’enquesta anònima.</p>
            </div>
          </div>

          <div className="grid gap-3 text-[13px]">
            <div className="flex gap-3 items-start">
              <UsersRound size={18} className="text-red shrink-0 mt-px" aria-hidden />
              <span><strong className="block text-ink">Directori preparat</strong><span className="text-ink-muted">727 identitats sintètiques en demo. Adaptador de Microsoft Graph inclòs.</span></span>
            </div>
            <div className="flex gap-3 items-start">
              <BellRing size={18} className="text-red shrink-0 mt-px" aria-hidden />
              <span><strong className="block text-ink">Recordatori intel·ligent</strong><span className="text-ink-muted">S’envia abans del tancament només a qui encara no ha participat.</span></span>
            </div>
            <div className="flex gap-3 items-start">
              <ShieldCheck size={18} className="text-red shrink-0 mt-px" aria-hidden />
              <span><strong className="block text-ink">Privacitat protegida</strong><span className="text-ink-muted">Teams distribueix l’enllaç. Les respostes no es vinculen a la identitat.</span></span>
            </div>
          </div>

          <button onClick={onToggle} aria-pressed={selected} className={selected ? 'btn-line !h-11 mt-auto' : 'btn-red !h-11 mt-auto'}>
            {selected ? 'Treure Microsoft Teams' : 'Afegir Microsoft Teams'}
          </button>
        </div>

        <div className="p-4 sm:p-6 bg-[#F4F4F8]">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-[#4B4D76]">
            <span className="flex items-center gap-2"><MessagesSquare size={15} aria-hidden />Vista prèvia de la targeta</span>
            <span>{selected ? 'A punt per publicar' : 'No seleccionat'}</span>
          </div>
          <article className={`rounded-[14px] border bg-paper shadow-[0_12px_34px_rgba(52,52,74,.12)] overflow-hidden transition-opacity ${selected ? 'opacity-100' : 'opacity-55'}`}>
            <div className="h-1.5 bg-red" />
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <img src="/logo-people-damm.png" alt="People Damm" className="w-[88px] h-auto" />
                <span className="text-[11px] font-bold text-red-dk">NOVA ENQUESTA</span>
              </div>
              <div>
                <h4 className="serif text-[22px] leading-tight">{title || 'Nova enquesta'}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">La teva opinió ens ajuda a millorar el dia a dia. Respon de forma anònima.</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-[12px] bg-cream px-3 py-2.5"><Clock3 size={15} className="text-red mb-1" aria-hidden /><strong className="block">{estimatedSeconds} segons</strong><span className="text-ink-muted">Temps estimat</span></div>
                <div className="rounded-[12px] bg-cream px-3 py-2.5"><BellRing size={15} className="text-red mb-1" aria-hidden /><strong className="block">{formatDate(closesAt)}</strong><span className="text-ink-muted">Data límit</span></div>
              </div>
              <div className="h-11 rounded-[12px] bg-red text-white text-sm font-extrabold grid place-items-center">Respondre l’enquesta</div>
              <p className="text-[11.5px] leading-relaxed text-ink-muted">Accedeix amb el teu compte. El contingut de les respostes continua sent anònim.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
