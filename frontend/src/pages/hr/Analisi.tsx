import { AI_SUMMARIES, DIMENSIONS, HEAT, TOPICS, ZONES, zoneByKey } from '../../data/mock'
import type { ZoneKey } from '../../data/types'
import { PageHead } from '../../components/HRLayout'
import { cn, fmt } from '../../components/ui'

const seq = (v: number) => `hsl(220 30% ${Math.round(94 - Math.max(0, Math.min(1, (v - 4.5) / 4)) * 62)}%)`

function Spark({ data }: { data: number[] }) {
  const lo = Math.min(...data) - .2, hi = Math.max(...data) + .2
  const pts = data.map((v, i) => `${(4 + i * (192 / (data.length - 1))).toFixed(1)},${(46 - ((v - lo) / (hi - lo)) * 42).toFixed(1)}`).join(' ')
  const last = pts.split(' ').pop()!.split(',')
  return (
    <svg viewBox="0 0 200 50" className="w-full h-[50px]" aria-hidden>
      <line x1="0" x2="200" y1="49" y2="49" stroke="#EFE7DC" />
      <polyline points={pts} fill="none" stroke="#1F1A18" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#C8102E" />
    </svg>
  )
}

export default function Analisi() {
  const heatKeys = Object.keys(HEAT) as ZoneKey[]
  return (
    <div className="flex flex-col gap-5">
      <PageHead eyebrow="IA · 1.284 respostes · 612 comentaris" title="Anàlisi i insights" sub="Resultats agregats i comentaris anonimitzats. Cap resposta individual és visible." />

      <section aria-label="Resums de la IA" className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {AI_SUMMARIES.map(s => {
          const c = s.confidence
          const chip = c === 0 ? ['Sense resum', 'bg-fog-bg text-fog'] : c >= .8 ? [`Confiança alta · ${Math.round(c * 100)}%`, 'bg-ok-bg text-ok-ink'] : [`Confiança mitjana · ${Math.round(c * 100)}%`, 'bg-warn-bg text-warn-ink']
          return (
            <article key={s.zone} className="card p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center gap-2"><span className="text-xs font-bold text-ink-muted">{s.zone}</span><span className={cn('chip', chip[1])}>{chip[0]}</span></div>
              <h2 className="text-[15px] font-bold leading-snug">{s.title}</h2>
              <p className="text-[13px] leading-relaxed text-ink-muted">{s.body}</p>
              <div className="mt-auto text-[11.5px] text-ink-muted">Basat en {s.n} respostes · resum revisable</div>
            </article>
          )
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5 min-w-0">
          <h2 className="serif text-[22px]">Temes detectats</h2>
          <p className="text-xs text-ink-muted mb-4">Mencions als comentaris i to mitjà (de negatiu a positiu)</p>
          <div className="flex flex-col gap-2.5">
            {TOPICS.map(t => {
              const half = Math.abs(t.s) * 50
              return (
                <div key={t.label} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_40px_110px] items-center gap-2.5 text-[13px]">
                  <span className="truncate">{t.label}</span>
                  <div className="h-2.5 rounded-full bg-cream-dk"><div className="h-full rounded-full bg-ink" style={{ width: `${(t.n / 312) * 100}%` }} /></div>
                  <span className="text-right tabular-nums text-ink-muted">{t.n}</span>
                  <div className="relative h-2.5 rounded-full bg-cream-dk" title={`To ${fmt(t.s, 2)}`}>
                    <div className="absolute left-1/2 -top-1 w-px h-[18px] bg-[#A1A1AA]" />
                    <div className="absolute top-0 h-2.5 rounded-full" style={{ left: t.s < 0 ? `${50 - half}%` : '50%', width: `${half}%`, background: t.s < 0 ? '#C2410C' : '#1D4ED8' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3.5 text-xs text-ink-muted"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#C2410C]" />To negatiu</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#1D4ED8]" />To positiu</span></div>
        </section>

        <section className="card p-5 min-w-0">
          <h2 className="serif text-[22px]">Comparativa per zones</h2>
          <p className="text-xs text-ink-muted mb-3">Mitjana per dimensió (0–10) · més fosc = més alt · Manteniment ocult (menys de 10 respostes)</p>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[560px] text-[12.5px] border-separate border-spacing-1">
              <thead><tr><th />{heatKeys.map(k => <th key={k} className="font-bold text-ink-muted text-[11px] text-center">{zoneByKey(k).name.replace('Recepció de ', '')}</th>)}</tr></thead>
              <tbody>
                {DIMENSIONS.map((d, di) => (
                  <tr key={d}>
                    <td className="pr-2 font-medium whitespace-nowrap">{d}</td>
                    {heatKeys.map(k => { const v = HEAT[k]![di]; return <td key={k} className="h-9 rounded-lg text-center font-semibold tabular-nums" style={{ background: seq(v), color: (v - 4.5) / 4 > .55 ? '#fff' : '#1F1A18' }}>{fmt(v)}</td> })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="serif text-[22px]">Evolució per zona</h2>
        <p className="text-xs text-ink-muted mb-3">Índex de benestar, últims 12 mesos</p>
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {ZONES.filter(z => z.trend.length).map(z => (
            <div key={z.key} className="border border-cream-dk rounded-[14px] p-3">
              <div className="flex justify-between text-[13px]"><strong>{z.name}</strong><span className={cn('font-bold', z.delta < 0 ? 'text-[#B4261E]' : 'text-ok')}>{z.delta < 0 ? '▼' : z.delta > 0 ? '▲' : ''} {fmt(Math.abs(z.delta))}</span></div>
              <div className="serif text-2xl my-0.5">{fmt(z.score!)}</div>
              <Spark data={z.trend} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="serif text-[22px] mb-3">Problemes emergents</h2>
          {[['+180%', 'Temperatura a la sala de cocció', 'Sala de cocció', 23], ['+95%', 'App de fitxatge lenta', 'Logística', 17], ['+60%', 'Volum de reunions', 'Oficines', 14]].map(([g, l, z, n]) => (
            <div key={String(l)} className="flex items-center gap-3.5 border border-cream-dk rounded-[14px] p-3.5 mb-2.5 last:mb-0">
              <span className="text-[13px] font-extrabold text-[#9A3412] bg-[#FFEDD5] rounded-[10px] px-2.5 py-2">{g}</span>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{l}</div><div className="text-xs text-ink-muted">{z} · {n} mencions en 30 dies</div></div>
              
            </div>
          ))}
        </section>
        <section className="card p-5">
          <h2 className="serif text-[22px]">Mostra suficient?</h2>
          <p className="text-xs text-ink-muted mb-3">Respostes per zona respecte al mínim de 10</p>
          <div className="flex flex-col gap-2">
            {ZONES.filter(z => z.survey).map(z => (
              <div key={z.key} className="grid grid-cols-[130px_minmax(0,1fr)_70px] gap-2.5 items-center text-[13px]">
                <span className="truncate">{z.name}</span>
                <div className="h-2 rounded-full bg-cream-dk"><div className={cn('h-full rounded-full', z.responses < 10 ? 'bg-fog' : 'bg-ink')} style={{ width: `${Math.min(100, z.responses)}%` }} /></div>
                <span className={cn('text-right text-xs font-bold', z.responses < 10 ? 'text-warn' : 'text-ink-muted')}>{z.responses < 10 ? `${z.responses}/10` : `${z.responses} resp.`}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
