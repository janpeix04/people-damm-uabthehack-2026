import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { zoneByKey } from '../../data/mock'
import type { ActionStatus } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { PageHead } from '../../components/HRLayout'

const COLS: { key: ActionStatus; label: string; dot: string }[] = [
  { key: 'proposada', label: 'Proposada', dot: '#A1A1AA' },
  { key: 'revisio', label: 'En revisió', dot: '#D97706' },
  { key: 'encurs', label: 'En curs', dot: '#2563EB' },
  { key: 'implementada', label: 'Implementada', dot: '#15803D' },
  { key: 'avaluacio', label: 'Pendent d’avaluació', dot: '#7C3AED' },
]

export default function Accions() {
  const { initiatives, setInitiativeStatus, toast } = useApp()
  return (
    <div>
      <PageHead eyebrow="Dels insights a l’acció" title="Accions i millores" sub="Cada acció neix d’un problema detectat, té responsable i un indicador per comprovar l’impacte. Es publiquen a “Ens heu dit / Hem fet”." actions={<Link to="/app/hem-fet" className="btn-line">Veure versió treballador</Link>} />
      <div className="overflow-x-auto scroll-thin pb-2">
        <div className="grid grid-cols-5 gap-3.5 min-w-[1240px] items-start">
          {COLS.map(c => {
            const items = initiatives.filter(i => i.status === c.key)
            return (
              <section key={c.key} className="bg-cream-dk rounded-[20px] p-3 flex flex-col gap-2.5">
                <div className="flex justify-between items-center px-1.5 py-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />{c.label}</h2>
                  <span className="text-xs font-semibold text-ink-muted bg-paper rounded-full px-2">{items.length}</span>
                </div>
                {items.map(it => (
                  <article key={it.id} className="bg-paper rounded-[16px] p-3.5 flex flex-col gap-2.5 shadow-card">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="chip bg-cream text-ink-soft !py-0.5">{it.zone === 'tots' ? 'Tota la planta' : zoneByKey(it.zone).name}</span>
                      {it.fromAI && <span className="chip bg-red-soft text-red-dk !py-0.5">Proposta IA</span>}
                    </div>
                    <h3 className="text-sm font-bold leading-snug">{it.title}</h3>
                    <p className="text-xs leading-relaxed text-ink-muted"><strong className="text-ink">Problema:</strong> {it.problem}</p>
                    <p className="text-xs leading-relaxed text-ink-muted"><strong className="text-ink">Acció:</strong> {it.action}</p>
                    <div className="flex items-center gap-2 text-xs bg-cream rounded-[10px] px-2.5 py-2"><Target size={14} className="text-ink-muted shrink-0" aria-hidden />{it.kpi}</div>
                    <div className="flex justify-between items-center gap-2 text-xs text-ink-muted border-t border-[#F1EAE0] pt-2.5"><span className="truncate">{it.owner}</span><span className="font-bold text-ink whitespace-nowrap">{it.due}</span></div>
                    <label className="sr-only" htmlFor={`st-${it.id}`}>Estat</label>
                    <select id={`st-${it.id}`} value={it.status} onChange={e => { setInitiativeStatus(it.id, e.target.value as ActionStatus); toast('Estat actualitzat') }} className="input !h-9 !py-0 !text-xs">
                      {COLS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    {(it.status === 'implementada' || it.status === 'avaluacio' || it.status === 'encurs') && (
                      <Link to={`/rrhh/crear?plantilla=2&accio=${it.id}`} className="btn-ink !h-9 !text-xs">Generar microenquesta de seguiment</Link>
                    )}
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
