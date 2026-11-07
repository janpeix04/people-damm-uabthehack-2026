import { Link } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { AI_RECS, channelLabel, MOODS, ZONES, zoneByKey } from '../../data/mock'
import { useApp } from '../../store/AppContext'
import { FestaCard, fmt, Meter, PathIcon, MoodBadge } from '../../components/ui'

export default function HRInici() {
  const { hrSurveys: surveys, festa } = useApp()
  const open = surveys.filter(s => s.status === 'open')
  const kpis = [
    { label: 'Clima general', value: '6,5', note: '▼ 0,2 respecte a octubre', noteCls: 'text-[#B4261E]', w: 'uneasy' as const },
    { label: 'Participació', value: `${Math.round(festa.pct)}%`, note: 'Objectiu 60%', noteCls: 'text-ink-muted', w: null },
    { label: 'Respostes agregades', value: (892 + festa.responses).toLocaleString('ca-ES'), note: '+212 aquesta setmana', noteCls: 'text-ok', w: null },
    { label: 'Enquestes actives', value: String(open.length), note: open.length ? `La primera tanca el ${new Date(open.map(s => s.closesAt).sort()[0]).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}` : 'Cap oberta', noteCls: 'text-ink-muted', w: null },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <label className="flex items-center gap-2.5 h-11 px-3.5 rounded-[14px] bg-paper border border-line flex-1 max-w-[380px] min-w-[200px]">
          <Search size={18} className="text-ink-muted" aria-hidden />
          <span className="sr-only">Cerca</span>
          <input type="search" placeholder="Cerca enquestes, temes o zones" className="bg-transparent outline-none text-sm font-medium flex-1 min-w-0" />
        </label>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[13px] font-semibold text-ink-muted">Planta del Prat · Novembre 2026</span>
          <Link to="/rrhh/crear" className="btn-red"><Sparkles size={18} aria-hidden />Crear enquesta</Link>
        </div>
      </div>

      <section className="flex flex-wrap gap-5 items-stretch">
        <div className="flex-[999_1_460px] min-w-0 flex flex-col justify-center gap-2">
          <h1 className="serif text-[34px] sm:text-[40px] leading-[1.05]">Bon dia, equip de Persones</h1>
          <p className="text-base leading-relaxed text-ink-muted max-w-[620px]">El clima general és de <strong className="text-ink">6,5 i l’emoció predominant és inquietud</strong>. Envasat i Logística necessiten atenció aquesta setmana, i Manteniment encara no té prou respostes.</p>
        </div>
        <div className="flex-[1_1_340px] min-w-0"><FestaCard /></div>
      </section>

      <section aria-label="Indicadors" className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 flex gap-3.5 items-center">
            {k.w ? <MoodBadge w={k.w} /> : <span className="w-[46px] h-[46px] rounded-[14px] bg-red-soft grid place-items-center shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-red" /></span>}
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink-muted">{k.label}</div>
              <div className="serif text-[30px] leading-tight tabular-nums">{k.value}</div>
              <div className={`text-xs font-semibold ${k.noteCls}`}>{k.note}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-5 items-start">
        <section className="card p-5 flex-[999_1_560px] min-w-0 flex flex-col gap-3.5">
          <div className="flex flex-wrap justify-between items-end gap-2">
            <div><h2 className="serif text-2xl">Mapa d’emocions</h2><p className="text-[13px] text-ink-muted">Emoció predominant de cada equip (agregada), amb la nota i la participació</p></div>
            <Link to="/rrhh/world" className="text-[13.5px] font-bold text-red-dk">Obrir Damm World 3D →</Link>
          </div>
          <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
            {ZONES.map(z => {
              const w = MOODS[z.mood]
              return (
                <Link to={`/rrhh/world?zona=${z.key}`} key={z.key} className="rounded-[16px] p-3.5 flex flex-col gap-2 hover:-translate-y-0.5 transition" style={{ background: w.bg, border: z.mood === 'stressed' ? '1px solid #F2B8B1' : '1px solid transparent' }}>
                  <div className="flex justify-between items-center gap-2"><span className="text-sm font-bold">{z.name}</span><PathIcon d={w.path} size={22} color={w.ink} /></div>
                  <div className="flex items-baseline gap-2"><span className="serif text-[26px] leading-none">{z.score != null ? fmt(z.score) : z.key === 'jardi' ? '60%' : '—'}</span><span className="text-xs font-bold" style={{ color: w.ink }}>{z.moodLabel}</span></div>
                  {z.survey && <div className="h-1.5 rounded-full bg-white/85"><div className="h-full rounded-full bg-ink" style={{ width: `${z.participation}%` }} /></div>}
                  <div className="text-[11.5px] text-ink-soft">{z.key === 'manteniment' ? `${z.responses} de 10 respostes: ocult` : z.key === 'jardi' ? 'S’obre al 60% de planta' : `${z.headcount} persones · ${z.participation}%`}</div>
                </Link>
              )
            })}
          </div>
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <section className="card p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-center"><h2 className="serif text-[21px]">Propostes de la IA</h2><span className="chip bg-red-soft text-red-dk">Cal aprovació</span></div>
            {AI_RECS.map(r => (
              <div key={r.id} className="border border-cream-dk rounded-[14px] p-3 flex flex-col gap-1.5">
                <strong className="text-sm">{r.title}</strong>
                <span className="text-[12.5px] leading-snug text-ink-muted">{r.why}</span>
                <div className="flex gap-2 mt-0.5"><Link to={r.to} className="btn-ink !h-8 !px-3 !text-[12.5px] !rounded-[10px]">{r.cta}</Link><button className="btn-ghost !h-8 !px-2 !text-[12.5px]">Descartar</button></div>
              </div>
            ))}
          </section>
          <section className="rounded-[20px] bg-warn-bg p-4 flex flex-col gap-1.5">
            <strong className="text-sm text-warn-ink">Representativitat</strong>
            <span className="text-[13px] leading-relaxed text-[#5A3A10]">El torn de nit d’Envasat és el 26% de la plantilla però només el 14% de les respostes. Proposta: QR al menjador i recordatori a les 2 h.</span>
          </section>
        </aside>
      </div>

      <section className="card p-5">
        <div className="flex justify-between items-center gap-2 mb-2"><h2 className="serif text-[22px]">Enquestes en curs</h2><Link to="/rrhh/enquestes" className="text-[13.5px] font-bold text-red-dk">Veure totes →</Link></div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead><tr className="text-left text-[11px] tracking-[.08em] uppercase text-ink-muted"><th className="py-2.5 px-2 font-bold">Enquesta</th><th className="py-2.5 px-2 font-bold">Públic</th><th className="py-2.5 px-2 font-bold">Canals</th><th className="py-2.5 px-2 font-bold w-[200px]">Participació</th><th className="py-2.5 px-2 font-bold">Tanca</th></tr></thead>
            <tbody>
              {open.map(s => {
                const pct = Math.round((s.responses / s.target) * 100)
                return (
                  <tr key={s.id} className="border-t border-cream-dk">
                    <td className="py-3 px-2 font-bold"><Link to={`/rrhh/enquestes/${s.id}`} className="hover:text-red-dk">{s.title}</Link></td>
                    <td className="py-3 px-2 text-ink-muted">{s.zones.length >= 8 ? 'Tota la planta' : s.zones.map(k => zoneByKey(k).name).join(', ')}</td>
                    <td className="py-3 px-2"><span className="flex flex-wrap gap-1">{s.channels.map(c => <span key={c} className="text-[11px] font-bold bg-cream rounded-md px-1.5 py-0.5">{channelLabel(c).split(' ')[0]}</span>)}</span></td>
                    <td className="py-3 px-2"><div className="flex items-center gap-2"><Meter value={pct} goal={60} thin className="flex-1" /><span className="text-xs font-bold tabular-nums">{pct}%</span></div></td>
                    <td className="py-3 px-2 text-ink-muted">{new Date(s.closesAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
