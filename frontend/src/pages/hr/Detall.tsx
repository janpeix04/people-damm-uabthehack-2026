import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, ExternalLink, Printer } from 'lucide-react'
import { CHANNELS, SURVEY_ZONES, zoneByKey } from '../../data/mock'
import type { ChannelKey } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { Meter, PathIcon, StatusChip } from '../../components/ui'

export const surveyUrl = (id: string) => `${window.location.origin}${window.location.pathname}#/e/${id}`

function message(c: ChannelKey, title: string, url: string, secs: number) {
  const t = `${Math.max(30, secs)} segons`
  switch (c) {
    case 'teams': return `Canal Teams · Participació a l’enquesta interna: "${title}". Resposta anònima en només ${t}: ${url}`
    case 'whatsapp': case 'telegram': return `Equip, ${t} per dir com va: “${title}”. És anònim i no cal instal·lar res: ${url}`
    case 'email': return `Assumpte: ${t} per millorar el dia a dia\n\nHola! Volem saber la teva opinió sobre “${title}”. És anònima i es respon des del mòbil o l’ordinador:\n${url}\n\nGràcies,\nPersones · Damm`
    case 'app': return `People Damm · Tens una enquesta de ${t}: “${title}”. És anònima.`
    case 'tablet': return 'La tauleta del menjador mostrarà aquesta enquesta en mode quiosc. Es reinicia després de cada resposta i no guarda res de qui respon.'
    case 'placa': return 'La parada de l’enquesta de La Plaça mostrarà l’avís “Enquesta nova” i el botó fix portarà a aquest enllaç.'
    case 'world': return 'Apareixerà com a missió col·lectiva a les zones seleccionades de Damm World.'
    default: return 'Imprimeix el cartell A4 i penja’l a línies, vestidors, molls i menjador.'
  }
}

export default function Detall() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const { hrSurveys: surveys, hrLoading, hrError, toast } = useApp()
  const s = surveys.find(x => x.id === id)
  if (hrLoading) return <p role="status">Carregant enquesta?</p>
  if (hrError) return <p role="alert">{hrError}</p>
  if (!s) return <div className="card p-8">No trobem aquesta enquesta. <Link to="/rrhh/enquestes" className="font-bold text-red-dk">Tornar a la llista</Link></div>
  const url = surveyUrl(s.id)
  const secs = s.questions.reduce((a, x) => a + x.secs, 0)
  const copy = async (text: string, ok = 'Copiat al porta-retalls') => {
    try { await navigator.clipboard.writeText(text); toast(ok) } catch { toast('No s’ha pogut copiar: selecciona el text manualment') }
  }
  const pct = s.target ? Math.round((s.responses / s.target) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap justify-between items-end gap-3">
        <div className="min-w-0">
          <Link to="/rrhh/enquestes" className="text-[13px] font-bold text-red-dk">← Enquestes</Link>
          <div className="flex items-center gap-2.5 flex-wrap mt-1.5"><h1 className="serif text-[34px] leading-[1.05]">{s.title}</h1><StatusChip status={s.status} /></div>
          <p className="text-[14px] text-ink-muted mt-1">{s.questions.length} preguntes · {secs} s · {s.zones.length >= SURVEY_ZONES.length ? 'Tota la planta' : s.zones.map(k => zoneByKey(k).name).join(', ')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/e/${s.id}`} className="btn-line"><ExternalLink size={16} aria-hidden />Provar com a treballador</Link>
          <Link to="/rrhh/analisi" className="btn-ink">Veure resultats</Link>
        </div>
      </header>

      {q.get('nova') && <div className="rounded-[16px] bg-ok-bg text-ok-ink px-4 py-3 font-bold">✓ {s.status === 'draft' ? 'Esborrany desat. Pots editar-lo i aprovar-lo des de la llista.' : s.status === 'open' ? 'Publicada i oberta.' : `Programada: s’obrirà el ${new Date(s.opensAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}.`}</div>}

      <div className="flex flex-wrap gap-5 items-start">
        <section className="card p-5 flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <h2 className="serif text-2xl">Enllaç únic</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="bg-white p-3 rounded-[14px] border border-line"><QRCodeSVG value={url} size={148} fgColor="#1F1A18" level="M" /></div>
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <label htmlFor="url" className="eyebrow">Adreça</label>
              <input id="url" readOnly value={url} className="input !text-[13px]" onFocus={e => e.currentTarget.select()} />
              <div className="flex gap-2 flex-wrap">
                <button className="btn-ink !h-10" onClick={() => copy(url, 'Enllaç copiat')}><Copy size={16} aria-hidden />Copiar enllaç</button>
                <Link to={`/cartell/${s.id}`} className="btn-line !h-10"><Printer size={16} aria-hidden />Cartell A4</Link>
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-muted">Tots els canals porten aquí. Sense iniciar sessió ni instal·lar res.</p>
          <div>
            <div className="flex justify-between items-baseline mb-1.5"><span className="eyebrow">Participació</span><strong className="tabular-nums">{pct}% · {s.responses} de {s.target}</strong></div>
            <Meter value={pct} goal={60} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.zones.map(k => { const z = zoneByKey(k); return <span key={k} className="chip bg-cream text-ink-soft">{z.name}</span> })}
          </div>
        </section>

        <section className="flex-[999_1_520px] min-w-0 flex flex-col gap-3">
          <h2 className="serif text-2xl">Canals de difusió</h2>
          <p className="text-[13px] text-ink-muted -mt-2">Missatges preparats per a cada canal. En aquesta versió no s’envia res: copia’ls i comparteix-los tu mateix.</p>
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {CHANNELS.filter(c => s.channels.includes(c.key)).map(c => {
              const msg = message(c.key, s.title, url, secs)
              const copyable = ['teams', 'whatsapp', 'telegram', 'email', 'app'].includes(c.key)
              return (
                <article key={c.key} className="card p-4 flex flex-col gap-2.5">
                  <div className="flex gap-2.5 items-center"><span className="w-9 h-9 rounded-[11px] bg-red grid place-items-center"><PathIcon d={c.icon} size={18} color="#fff" /></span><strong className="text-[15px]">{c.label}</strong></div>
                  <p className="text-[13px] leading-relaxed text-ink-soft whitespace-pre-line bg-cream rounded-[12px] p-3">{msg}</p>
                  {copyable && <button className="btn-line !h-9 self-start !text-[13px]" onClick={() => copy(msg, 'Missatge copiat')}><Copy size={14} aria-hidden />Copiar missatge</button>}
                  {c.key === 'qr' && <Link to={`/cartell/${s.id}`} className="btn-line !h-9 self-start !text-[13px]"><Printer size={14} aria-hidden />Obrir el cartell</Link>}
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="serif text-2xl mb-3">Preguntes</h2>
        <ol className="flex flex-col gap-2">
          {s.questions.map((x, i) => <li key={x.id} className="flex gap-3 items-start text-[14px]"><span className="w-6 h-6 rounded-full bg-ink text-white text-xs font-extrabold grid place-items-center shrink-0">{i + 1}</span><span className="flex-1">{x.text}</span><span className="chip bg-red-soft text-red-dk">{x.dim}</span></li>)}
        </ol>
      </section>
    </div>
  )
}
