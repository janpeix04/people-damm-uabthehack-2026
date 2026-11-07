import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp } from '../../store/AppContext'
import { Logo } from '../../components/ui'
import { surveyUrl } from '../hr/Detall'
import { POINTS_PER_SURVEY } from '../../store/AppContext'

/** Cartell A4 per penjar a planta. Es pot imprimir des del navegador. */
export default function Cartell() {
  const { id } = useParams()
  const { hrSurveys: surveys, hrLoading, hrError } = useApp()
  const s = surveys.find(x => x.id === id)
  if (hrLoading) return <p role="status">Carregant enquesta?</p>
  if (hrError) return <p role="alert">{hrError}</p>
  if (!s) return <div className="p-8">No trobem aquesta enquesta. <Link to="/rrhh/enquestes" className="font-bold text-red-dk">Tornar</Link></div>
  const url = surveyUrl(s.id)
  const secs = Math.max(30, s.questions.reduce((a, q) => a + q.secs, 0))
  return (
    <div className="min-h-full bg-cream py-8 px-4 flex flex-col items-center gap-4">
      <div className="no-print flex gap-2">
        <Link to={`/rrhh/enquestes/${s.id}`} className="btn-line">← Tornar</Link>
        <button className="btn-red" onClick={() => window.print()}>Imprimir</button>
      </div>
      <div className="w-[595px] max-w-full sm:aspect-[595/842] bg-paper shadow-lift flex flex-col">
        <div className="bg-red text-white px-6 sm:px-10 pt-7 sm:pt-9 pb-6 sm:pb-8 flex flex-col gap-3">
          <div className="flex items-center"><Logo light /></div>
          <h1 className="serif text-[32px] sm:text-[44px] leading-[1.02] mt-1">La teva opinió mou la fàbrica</h1>
          <p className="text-[16px] sm:text-[18px] leading-snug opacity-95">{s.title}: explica-ho en {secs} segons.</p>
        </div>
        <div className="flex-1 flex flex-wrap justify-center gap-5 sm:gap-7 items-center px-6 sm:px-10 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white ring-2 ring-ink"><QRCodeSVG value={url} size={190} fgColor="#1F1A18" level="M" className="w-[140px] h-[140px] sm:w-[190px] sm:h-[190px]" /></div>
          </div>
          <ol className="flex flex-col gap-4 flex-1 min-w-[200px]">
            {[['Escaneja', 'Obre la càmera del mòbil i apunta al codi.'], ['Respon', `${s.questions.length} preguntes anònimes. Accedeix amb el teu compte.`], ['Guanya punts', `+${POINTS_PER_SURVEY} punts per bescanviar a la cafeteria.`]].map(([t, d], i) => (
              <li key={t} className="flex gap-3 items-start"><span className="w-8 h-8 rounded-full bg-ink text-white font-extrabold grid place-items-center shrink-0">{i + 1}</span><span><strong className="block text-[18px]">{t}</strong><span className="text-[15px] leading-snug text-ink-muted">{d}</span></span></li>
            ))}
          </ol>
        </div>
        <div className="mx-6 sm:mx-10 grid grid-cols-3 gap-2.5">
          {[[`${secs} s`, 'de durada'], ['100%', 'anònima'], [`+${POINTS_PER_SURVEY}`, 'punts']].map(([b, l]) => (
            <div key={l} className="bg-cream rounded-[14px] p-3 text-center"><div className="serif text-[26px] text-red leading-none">{b}</div><div className="text-sm font-bold mt-1">{l}</div></div>
          ))}
        </div>
        <div className="mx-6 sm:mx-10 mt-5 mb-6 sm:mb-8 pt-4 border-t-[1.5px] border-line flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 text-[13px] sm:text-[13.5px] leading-snug text-ink-muted">
          <span>No guardem el teu nom, el dispositiu ni la ubicació. Els resultats només es veuen agrupats.</span>
          <span className="whitespace-nowrap font-bold text-ink">Fins al {new Date(s.closesAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  )
}
