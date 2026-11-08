import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { channelLabel, MIN_SAMPLE, SURVEY_ZONES, TEMPLATES, zoneByKey } from '../../data/mock'
import type { SurveyStatus } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { PageHead } from '../../components/HRLayout'
import { cn, Meter, StatusChip } from '../../components/ui'

const TABS: { key: SurveyStatus; label: string }[] = [
  { key: 'open', label: 'Actives' }, { key: 'scheduled', label: 'Programades' }, { key: 'draft', label: 'Esborranys' }, { key: 'closed', label: 'Tancades' },
]

export default function Enquestes() {
  const { hrSurveys: surveys, hrLoading, hrError, refreshHr, setSurveyStatus, addSurvey, toast } = useApp()
  const [busy, setBusy] = useState<string | null>(null)
  const [approvedDraft, setApprovedDraft] = useState<string | null>(null)
  const run = async (id: string, action: () => Promise<unknown>, message: string) => {
    setBusy(id)
    try { await action(); toast(message) }
    catch (e) { toast(e instanceof Error ? e.message : 'No s’ha pogut desar') }
    finally { setBusy(null) }
  }
  const [tab, setTab] = useState<SurveyStatus>('open')
  const list = surveys.filter(s => s.status === tab)
  const d = (iso: string) => new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })

  return (
    <div>
      <PageHead title="Enquestes" sub="Crea, programa i segueix totes les enquestes de la planta." actions={<Link to="/rrhh/crear" className="btn-red"><Plus size={18} aria-hidden />Nova enquesta</Link>} />
      {hrLoading && <p role="status">Carregant enquestes…</p>}
      {hrError && <div role="alert" className="card p-4 mb-4">{hrError} <button className="btn-line" onClick={() => void refreshHr()}>Tornar-ho a provar</button></div>}
      <div role="tablist" aria-label="Estat" className="flex flex-wrap gap-1.5 border-b border-line pb-2.5 mb-4">
        {TABS.map(t => {
          const n = surveys.filter(s => s.status === t.key).length, on = t.key === tab
          return (
            <button key={t.key} role="tab" aria-selected={on} onClick={() => setTab(t.key)} className={cn('h-[38px] px-3.5 rounded-[12px] text-sm font-bold flex items-center gap-2', on ? 'bg-ink text-white' : 'text-ink-soft hover:bg-paper')}>
              {t.label}<span className={cn('text-xs rounded-full px-2 py-px', on ? 'bg-white/20' : 'bg-cream-dk')}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-5 items-start">
        <section aria-label="Llista" className="flex-[999_1_560px] min-w-0 flex flex-col gap-3">
          {list.length === 0 && <div className="card p-8 text-center text-ink-muted">No hi ha cap enquesta en aquest estat. <Link to="/rrhh/crear" className="font-bold text-red-dk">Crea’n una</Link>.</div>}
          {list.map(s => {
            const pct = s.target ? Math.round((s.responses / s.target) * 100) : 0
            const all = s.zones.length >= SURVEY_ZONES.length
            return (
              <article key={s.id} className="card p-5 flex flex-col gap-3">
                <div className="flex flex-wrap justify-between gap-2.5 items-start">
                  <div className="min-w-0">
                    <div className="flex gap-2 items-center flex-wrap"><h2 className="serif text-[22px]"><Link to={`/rrhh/enquestes/${s.id}`} className="hover:text-red-dk">{s.title}</Link></h2><StatusChip status={s.status} /></div>
                    <div className="text-[13px] text-ink-muted mt-1">{all ? 'Tota la planta' : s.zones.map(k => zoneByKey(k).name).join(', ')} · {s.questions.length} preguntes · {s.questions.reduce((a, q) => a + q.secs, 0)} s · {s.status === 'scheduled' ? `s’obre el ${d(s.opensAt)}` : `tanca el ${d(s.closesAt)}`}</div>
                  </div>
                  <div className="text-right"><div className="serif text-[30px] leading-none tabular-nums">{pct}%</div><div className="text-xs text-ink-muted">{s.responses} de {s.target}</div></div>
                </div>
                <Meter value={pct} />
                {s.status !== 'scheduled' && s.source !== 'db' && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.zones.map(k => {
                      const z = zoneByKey(k)
                      if (z.responses < MIN_SAMPLE) return <span key={k} className="chip bg-fog-bg text-fog">{z.name}: {z.responses} resp. (ocult)</span>
                      return <span key={k} className={cn('chip', z.participation >= 50 ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink')}>{z.name} {z.participation}%</span>
                    })}
                  </div>
                )}
                <div className="flex flex-wrap justify-between items-center gap-2.5 border-t border-[#F1EAE0] pt-3">
                  <div className="flex flex-wrap gap-1 items-center"><span className="text-xs text-ink-muted mr-1">Canals:</span>{s.channels.map(c => <span key={c} className="text-[11.5px] font-bold bg-cream rounded-md px-1.5 py-0.5">{channelLabel(c)}</span>)}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {s.status === 'draft' && <Link className="btn-line !h-9" to={`/rrhh/crear?editar=${s.id}`}>Editar esborrany</Link>}
                    {s.status === 'draft' && <><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={approvedDraft === s.id} onChange={e => setApprovedDraft(e.target.checked ? s.id : null)} />He revisat i aprovo la publicació</label><button className="btn-red !h-9" disabled={busy !== null || approvedDraft !== s.id} onClick={() => void run(s.id, () => setSurveyStatus(s.id, 'open', true), 'Enquesta publicada')}>Publicar ara</button></>}
                    <Link to={`/rrhh/enquestes/${s.id}`} className="btn-ink !h-9 !px-3.5 !text-[13px] !rounded-[11px]">Difusió i resultats</Link>
                    {s.status === 'open' && <button className="btn-line !h-9 !px-3.5 !text-[13px] !rounded-[11px]" onClick={() => toast('Recordatori programat (simulació)')}>Enviar recordatori</button>}
                    {s.status === 'open' && <button className="btn-line !h-9 !px-3.5 !text-[13px] !rounded-[11px]" disabled={busy !== null} onClick={() => void run(s.id, () => setSurveyStatus(s.id, 'closed'), 'Enquesta tancada')}>Tancar</button>}
                    {s.status === 'scheduled' && <button className="btn-line !h-9 !px-3.5 !text-[13px] !rounded-[11px]" disabled={busy !== null} onClick={() => void run(s.id, () => setSurveyStatus(s.id, 'open'), 'Enquesta oberta ara')}>Obrir ara</button>}
                    <button className="btn-line !h-9 !px-3.5 !text-[13px] !rounded-[11px]" disabled={busy !== null} onClick={() => void run(s.id, () => addSurvey({ ...s, title: `${s.title} (còpia)`, status: 'draft', responses: 0 }), 'Còpia desada a esborranys')}>Duplicar</button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
          <section className="card p-4 flex flex-col gap-2.5">
            <h2 className="serif text-[21px]">Calendari de pols</h2>
            <p className="text-[12.5px] text-ink-muted">Una enquesta curta cada 2 setmanes. Màxim una de nova alhora per persona.</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-ink-muted">
              {['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(x => <span key={x}>{x}</span>)}
              {Array.from({ length: 28 }, (_, i) => i + 2).map(n => {
                const open = n <= 16, plan = n >= 24
                return <span key={n} className={cn('h-[30px] rounded-lg grid place-items-center text-xs', open ? 'bg-red text-white' : plan ? 'bg-[#F2C6CD] text-ink' : 'bg-cream text-ink')}>{n}</span>
              })}
            </div>
            <div className="flex gap-3 text-[11.5px] text-ink-muted"><span className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-[3px] bg-red" />Oberta</span><span className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#F2C6CD]" />Programada</span></div>
          </section>
          <section className="card p-4 flex flex-col gap-2">
            <h2 className="serif text-[21px]">Plantilles</h2>
            {TEMPLATES.map((t, i) => (
              <Link key={t.name} to={`/rrhh/crear?plantilla=${i}`} className="flex justify-between items-center gap-2 px-3 py-2.5 rounded-[12px] bg-cream hover:bg-cream-dk"><span><strong className="block text-sm">{t.name}</strong><span className="text-xs text-ink-muted">Proposta d’IA a partir d’aquest objectiu</span></span><span aria-hidden>→</span></Link>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
