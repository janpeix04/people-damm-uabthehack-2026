import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp } from '../../store/AppContext'
import { LogoSlot } from '../../components/ui'
import { surveyUrl } from '../hr/Detall'

/** Cartell A4 per penjar a planta. Es pot imprimir des del navegador. */
export default function Cartell() {
  const { id } = useParams()
  const { surveys } = useApp()
  const s = surveys.find(x => x.id === id)
  if (!s) return <div className="p-8">No trobem aquesta enquesta. <Link to="/rrhh/enquestes" className="font-bold text-red-dk">Tornar</Link></div>
  const url = surveyUrl(s.id)
  const secs = Math.max(30, s.questions.reduce((a, q) => a + q.secs, 0))
  return (
    <div className="min-h-full bg-cream py-8 px-4 flex flex-col items-center gap-4">
      <div className="no-print flex gap-2">
        <Link to={`/rrhh/enquestes/${s.id}`} className="btn-line">← Tornar</Link>
        <button className="btn-red" onClick={() => window.print()}>Imprimir</button>
      </div>
      <div className="w-[595px] max-w-full aspect-[595/842] bg-paper shadow-lift flex flex-col">
        <div className="bg-red text-white px-10 pt-9 pb-8 flex flex-col gap-3">
          <div className="flex justify-between items-center"><LogoSlot light /><span className="text-[13px] font-extrabold tracking-[.14em]">DAMM PULSE</span></div>
          <h1 className="serif text-[44px] leading-[1.02] mt-1">La teva opinió mou la fàbrica</h1>
          <p className="text-[18px] leading-snug opacity-95">{s.title}: explica-ho en {secs} segons.</p>
        </div>
        <div className="flex-1 flex flex-wrap gap-7 items-center px-10 py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white ring-2 ring-ink"><QRCodeSVG value={url} size={190} fgColor="#1F1A18" level="M" /></div>
          </div>
          <ol className="flex flex-col gap-4 flex-1 min-w-[200px]">
            {[['Escaneja', 'Obre la càmera del mòbil i apunta al codi.'], ['Respon', `${s.questions.length} preguntes, sense iniciar sessió.`], ['Mira què canvia', 'A “Ens heu dit / Hem fet” veuràs les millores.']].map(([t, d], i) => (
              <li key={t} className="flex gap-3 items-start"><span className="w-8 h-8 rounded-full bg-ink text-white font-extrabold grid place-items-center shrink-0">{i + 1}</span><span><strong className="block text-[18px]">{t}</strong><span className="text-[15px] leading-snug text-ink-muted">{d}</span></span></li>
            ))}
          </ol>
        </div>
        <div className="mx-10 grid grid-cols-3 gap-2.5">
          {[[`${secs} s`, 'de durada'], ['100%', 'anònima'], ['0', 'apps a instal·lar']].map(([b, l]) => (
            <div key={l} className="bg-cream rounded-[14px] p-3 text-center"><div className="serif text-[26px] text-red leading-none">{b}</div><div className="text-sm font-bold mt-1">{l}</div></div>
          ))}
        </div>
        <div className="mx-10 mt-5 mb-8 pt-4 border-t-[1.5px] border-line flex justify-between gap-4 text-[13.5px] leading-snug text-ink-muted">
          <span>No guardem el teu nom, el dispositiu ni la ubicació. Els resultats només es veuen agrupats.</span>
          <span className="whitespace-nowrap font-bold text-ink">Fins al {new Date(s.closesAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  )
}
