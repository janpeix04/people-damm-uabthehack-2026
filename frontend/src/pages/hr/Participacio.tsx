import { Link } from 'react-router-dom'
import { BIAS, CHANNELS, MIN_SAMPLE, SURVEY_ZONES } from '../../data/mock'
import { useApp } from '../../store/AppContext'
import { PageHead } from '../../components/HRLayout'
import { cn, FestaCard, Meter } from '../../components/ui'

const CHANNEL_SPLIT: Record<string, number> = { qr: 34, whatsapp: 24, app: 16, placa: 9, email: 8, tablet: 5, world: 3, telegram: 1 }

export default function Participacio() {
  const { festa } = useApp()
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Participació" sub="Qui està responent, per on arriba l’enquesta i on falten veus." actions={<Link to="/rrhh/crear?plantilla=0" className="btn-red">Reforçar amb una microenquesta</Link>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card p-5">
          <h2 className="serif text-[22px]">Per zona</h2>
          <p className="text-xs text-ink-muted mb-4">Línia negra: objectiu del 60%. Les zones amb menys de {MIN_SAMPLE} respostes no mostren resultats.</p>
          <div className="flex flex-col gap-3">
            {SURVEY_ZONES.map(z => (
              <div key={z.key} className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_96px] gap-3 items-center text-sm">
                <span className="font-semibold truncate">{z.name}</span>
                <Meter value={z.participation} goal={60} thin />
                <span className={cn('text-right text-xs font-bold', z.responses < MIN_SAMPLE ? 'text-warn' : 'text-ink-muted')}>{z.responses < MIN_SAMPLE ? `${z.responses}/10 · ocult` : `${z.participation}% · ${z.responses}`}</span>
              </div>
            ))}
          </div>
        </section>
        <div className="flex flex-col gap-4">
          <FestaCard />
          <section className="card p-5">
            <h2 className="serif text-[22px] mb-3">Per on entren</h2>
            <div className="flex flex-col gap-2">
              {CHANNELS.map(c => (
                <div key={c.key} className="grid grid-cols-[minmax(0,1fr)_110px_36px] items-center gap-2 text-[13px]">
                  <span className="truncate">{c.label}</span>
                  <div className="h-2 rounded-full bg-cream-dk"><div className="h-full rounded-full bg-red" style={{ width: `${CHANNEL_SPLIT[c.key] * 2.5}%` }} /></div>
                  <span className="text-right tabular-nums text-ink-muted">{CHANNEL_SPLIT[c.key]}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted mt-3">Total respostes d’aquest mes: {festa.responses + 892}</p>
          </section>
        </div>
      </div>
      <section className="card p-5">
        <h2 className="serif text-[22px]">Biaix per torn · Envasat</h2>
        <p className="text-xs text-ink-muted mb-4">Percentatge de respostes comparat amb el pes de cada torn a la plantilla</p>
        <div className="flex flex-col gap-3 max-w-3xl">
          {BIAS.map(b => (
            <div key={b.group} className="grid grid-cols-[120px_minmax(0,1fr)_110px] gap-3 items-center text-[13px]">
              <span>{b.group}</span>
              <div className="flex flex-col gap-1">
                <div className="h-2 rounded-full bg-ink" style={{ width: `${b.sample * 2}%` }} />
                <div className="h-2 rounded-full bg-[#C9C9CF]" style={{ width: `${b.population * 2}%` }} />
              </div>
              <span className={cn('text-right text-xs font-bold', b.sample < b.population * .7 ? 'text-[#B4261E]' : 'text-ink-muted')}>{b.sample < b.population * .7 ? '⚠ ' : ''}{b.sample}% vs {b.population}%</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-ink-muted"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-ink" />Respostes</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#C9C9CF]" />Plantilla</span></div>
        <div className="mt-4 rounded-[14px] bg-warn-bg text-[#5A3A10] text-[13px] leading-relaxed p-3.5">El torn de nit està infrarepresentat. Els resultats d’Envasat es ponderen per torn i es proposa un QR al menjador i un recordatori a les 2 h.</div>
      </section>
    </div>
  )
}
